---
title: Building a Robust SQS Client with Spring Boot
categories: [spring-boot]
date: 2020-04-13 05:00:00 +1100
modified: 2020-04-13 05:00:00 +1100
author: default
excerpt: "A top-to-bottom approach of building an SQS client for publishing and receiving messages from an SQS queue in a robust and scalable way."
image:
  auto: 0035-switchboard
---

I mistrust tools and products that have the word "simple" in their name. This was also the case when I had First Contact with AWS's "Simple Queue Service" or SQS.

And while it *is* rather simple to send messages to an SQS queue, there are some things to consider when retrieving messages from it. It's not rocket science, but it requires some careful design to build a robust and scalable message handler.

This article shows a way of implementing a component that is capable of sending messages to and retrieving messages from an SQS queue in a robust and scalable manner. In the end, we'll wrap this component into a Spring Boot starter to be used in our Spring Boot applications. 

## Get the SQS Starter Library
The code in this article comes from the [SQS Starter library](https://github.com/thombergs/sqs-starter) that I built for one of my projects. It's [available on Maven Central](https://search.maven.org/artifact/io.reflectoring/sqs-starter) and I'll welcome any contributions you might have to make it better.

## Isn't the AWS SDK Good Enough?

AWS provides [an SDK](https://search.maven.org/search?q=a:aws-java-sdk-sqs) that provides functionality to interact with an SQS queue. And it's quite good and easy to use. 

However, **it's missing a polling mechanism that allows us to pull messages from the queue regularly and process them in near-realtime across a pool of message handlers working in parallel**. 

This is exactly what we'll be building in this article. 

As a bonus, we'll build a message publisher that wraps the AWS SDK and adds a little extra robustness in the form of retries. 

## Building a Robust Message Publisher

Let's start with the easy part and look at publishing messages.

The `AmazonSQS` client, which is part of the AWS SDK, provides the methods `sendMessage()` and `sendMessageBatch()` to send messages to an SQS queue.

In our publisher, we wrap `sendMessage()` to create a little more high-level message publisher that

* serializes a message object into JSON,
* sends the message to a specified SQS queue,
* and retries this if SQS returns an error response:

```java
public abstract class SqsMessagePublisher<T> {

  private final String sqsQueueUrl;
  private final AmazonSQS sqsClient;
  private final ObjectMapper objectMapper;
  private final RetryRegistry retryRegistry;

  // constructors ...  

  public void publish(T message) {
  Retry retry = retryRegistry.retry("publish");
  retry.executeRunnable(() -> doPublish(message));
  }

  private void doPublish(T message) {
  try {
    SendMessageRequest request = new SendMessageRequest()
    .withQueueUrl(sqsQueueUrl)
    .withMessageBody(objectMapper.writeValueAsString(message));
    SendMessageResult result = sqsClient.sendMessage(request);
  
    if (result.getSdkHttpMetadata().getHttpStatusCode() != 200) {
    throw new RuntimeException(
      String.format("got error response from SQS queue %s: %s",
      sqsQueueUrl,
      result.getSdkHttpMetadata()));
  }

  } catch (JsonProcessingException e) {
    throw new IllegalStateException("error sending message to SQS: ", e);
  }
  }
}
```

In the `publish()` method, we use [resilience4j's retry functionality](https://github.com/resilience4j/resilience4j#circuitbreaker-retry-fallback) to configure a retry behavior. We can modify this behavior by configuring the `RetryRegistry` that is passed into the constructor. Note that the AWS SDK provides its own [retry behavior](https://docs.aws.amazon.com/general/latest/gr/api-retries.html), but I opted for the more generic resilience4j library here. 

The interaction with SQS happens in the internal `doPublish()` method. Here, we build a `SendMessageRequest` and send that to SQS via the `AmazonSqs` client from the Amazon SDK. If the returned HTTP status code is not 200, we throw an exception so that the retry mechanism knows something went wrong and will trigger a retry.

In our application, we can now simply extend the abstract `SqsMessagePublisher` class, instantiate that class and call the `publish()` method to send messages to a queue. 

## Building a Robust Message Handler

Now to the more involved part: building a message handler that regularly polls an SQS queue and fans out the messages it receives to multiple message handlers in a thread pool.

### The `SqsMessageHandler` Interface

Let's start with the message handler interface:

```java
public interface SqsMessageHandler<T> {

  void handle(T message);

  Class<T> messageType();

}
```

For each SQS queue, we implement this interface to handle the messages we receive from that queue. Note that we're assuming that all messages in a queue are of the same type!

The `SqsMessageHandler` interface gives us type safety. Instead of having to work with `String`s, we can now work with message types.

But we still need some infrastructure to get messages from SQS, deserialize them into objects of our message type, and finally pass them to our message handler.

### Fetching Messages from SQS

Next, we build a `SqsMessageFetcher` class that fetches messages from an SQS queue:

```java
class SqsMessageFetcher {

  private static final Logger logger = ...;
  private final AmazonSQS sqsClient;
  private final SqsMessagePollerProperties properties;

  // constructor ...

  List<Message> fetchMessages() {

  ReceiveMessageRequest request = new ReceiveMessageRequest()
    .withMaxNumberOfMessages(properties.getBatchSize())
    .withQueueUrl(properties.getQueueUrl())
    .withWaitTimeSeconds((int) properties.getWaitTime().toSeconds());

  ReceiveMessageResult result = sqsClient.receiveMessage(request);

  if (result.getSdkHttpMetadata().getHttpStatusCode() != 200) {
    logger.error("got error response from SQS queue {}: {}",
      properties.getQueueUrl(),
      result.getSdkHttpMetadata());
    return Collections.emptyList();
  }

  logger.debug("polled {} messages from SQS queue {}",
    result.getMessages().size(),
    properties.getQueueUrl());

  return result.getMessages();
  }

}
```

Again, we use the `AmazonSqs` client, but this time to create a `ReceiveMessageRequest` and return the `Message`s we received from the SQS queue. We can configure some parameters in the `SqsMessagePollerProperties` object that we pass into this class. 

An important detail is that we're configuring the `waitTimeSeconds` on the request to tell the Amazon SDK to wait some seconds until `maxNumberOfMessages` messages are available before returning a list of messages (or an empty if there weren't any after that time). **With these configuration parameters, we have effectively implemented a long polling mechanism if we call our `fetchMessages()` method regularly**. 

Note that we're not throwing an exception in case of a non-success HTTP response code. This is because we're expecting  `fetchMessages()` to be called frequently in short intervals. We just hope that the call will succeed the next time.

### Polling Messages 

The next layer up, we build a `SqsMessagePoller` class that calls our `SqsMessageFetcher` in regular intervals to implement the long polling mechanism mentioned earlier:

```java
class SqsMessagePoller<T> {

  private static final Logger logger = ...;
  private final SqsMessageHandler<T> messageHandler;
  private final SqsMessageFetcher messageFetcher;
  private final SqsMessagePollerProperties pollingProperties;
  private final AmazonSQS sqsClient;
  private final ObjectMapper objectMapper;
  private final ThreadPoolExecutor handlerThreadPool;

  // other methods omitted

  private void poll() {

  List<Message> messages = messageFetcher.fetchMessages();

  for (Message sqsMessage : messages) {
    try {
    final T message = objectMapper.readValue(
      sqsMessage.getBody(), 
      messageHandler.messageType());
    handlerThreadPool.submit(() -> {
      messageHandler.handle(message);
      acknowledgeMessage(sqsMessage);
    });
    } catch (JsonProcessingException e) {
    logger.warn("error parsing message: ", e);
    }
  }
  }

  private void acknowledgeMessage(Message message) {
  sqsClient.deleteMessage(
    pollingProperties.getQueueUrl(),
    message.getReceiptHandle());
  }

}
```

In the `poll()` method, we get some messages from the message fetcher. We then deserialize each message from the JSON string we receive from the Amazon SDK's `Message` object.

Next, we pass the message object into the `handle()` method of an`SqsMessageHandler` instance. We don't do this in the current thread, though, but instead defer the execution to a thread in a special thread pool (`handlerThreadPool`). **This way, we can fan out the processing of messages into multiple concurrent threads**. 

After a message has been handled, we need to tell SQS that we have handled it successfully. We do this by calling the `deleteMessage()` API. If we didn't, SQS would serve this message again after some time with one of the next calls to our `SqsMessageFetcher`. 

### Starting and Stopping to Poll

A piece that is still missing from the puzzle is how to start the polling. You might have noticed that the `poll()` method is private, so it needs to be called from somewhere within the `SqsMessagePoller` class.

So, we add a `start()` and a `stop()` method to the class, allowing us to start and stop the polling: 

```java
class SqsMessagePoller<T> {

  private static final Logger logger = ...;
  private final SqsMessagePollerProperties pollingProperties;
  private final ScheduledThreadPoolExecutor pollerThreadPool;
  private final ThreadPoolExecutor handlerThreadPool;

  void start() {
  logger.info("starting SqsMessagePoller");
  for (int i = 0; i < pollerThreadPool.getCorePoolSize(); i++) {
    logger.info("starting SqsMessagePoller - thread {}", i);
    pollerThreadPool.scheduleWithFixedDelay(
      this::poll,
      1,
      pollingProperties.getPollDelay().toSeconds(),
      TimeUnit.SECONDS);
  }
  }

  void stop() {
  logger.info("stopping SqsMessagePoller");
  pollerThreadPool.shutdownNow();
  handlerThreadPool.shutdownNow();
  }

  // other methods omitted ...

}
```

With `pollerThreadPool`, we have introduced a second thread pool. In `start()`, **we schedule a call to our `poll()` method as a recurring task to this thread pool every couple seconds after the last call has finished**. 

Note that for most cases, it should be enough if the poller thread pool has a single thread. We'd need a lot of messages on a queue and a lot of concurrent message handlers to need more than one poller thread.

In the `stop()` method, we just shut down the poller and handler thread pools so that they stop to accept new work.

### Registering Message Handlers

The final part to get everything to work is a piece of code that wires everything together. **We'll want to have a registry where we can register a message handler**. The registry will then take care of creating the message fetcher and poller required to serve messages to the handler.

But first, we need a data structure that takes all the configuration parameters needed to register a message handler. We'll call this class `SqsMessageHandlerRegistration`:

```java
public interface SqsMessageHandlerRegistration<T> {

  /**
   * The message handler that shall process the messages polled from SQS.
   */
  SqsMessageHandler<T> messageHandler();

  /**
   * A human-readable name for the message handler. This is used to name 
   * the message handler threads.
   */
  String name();

  /**
   * Configuration properties for the message handler.
   */
  SqsMessageHandlerProperties messageHandlerProperties();

  /**
   * Configuration properties for the message poller.
   */
  SqsMessagePollerProperties messagePollerProperties();

  /**
   * The SQS client to use for polling messages from SQS.
   */
  AmazonSQS sqsClient();

  /**
   * The {@link ObjectMapper} to use for deserializing messages from SQS.
   */
  ObjectMapper objectMapper();
}
```

**A registration contains the message handler and everything that's needed to instantiate and configure an `SqsMessagePoller` and the underlying `SqsMessageFetcher`**.

We'll then want to pass a list of such registrations to our registry:

```java
List<SqsMessageHandlerRegistration> registrations = ...;
SqsMessageHandlerRegistry registry = 
  new SqsMessageHandlerRegistry(registrations);

registry.start();
...
registry.stop();
```

The registry takes the registrations and initializes the thread pools, a fetcher, and a poller for each message handler. We can then call `start()` and `stop()` on the registry to start and stop the message polling.

The registry code will look something like this:

```java
class SqsMessageHandlerRegistry {

  private static final Logger logger = ...;

  private final Set<SqsMessagePoller<?>> pollers;

  public SqsMessageHandlerRegistry(
    List<SqsMessageHandlerRegistration<?>> messageHandlerRegistrations) {
    this.pollers = initializePollers(messageHandlerRegistrations);
  }

  private Set<SqsMessagePoller<?>> initializePollers(
        List<SqsMessageHandlerRegistration<?>> registrations) {
    
    Set<SqsMessagePoller<?>> pollers = new HashSet<>();
    
    for (SqsMessageHandlerRegistration<?> registration : registrations) {
      pollers.add(createPollerForHandler(registration));
      logger.info("initialized SqsMessagePoller '{}'", registration.name());
    }
 
    return pollers;
  }

  private SqsMessagePoller<?> createPollerForHandler( 
        SqsMessageHandlerRegistration<?> registration) {
    ...
  }

  public void start() {
    for (SqsMessagePoller<?> poller : this.pollers) {
      poller.start();
    }
  }

  public void stop() {
    for (SqsMessagePoller<?> poller : this.pollers) {
      poller.stop();
    }
  }
}
```

The registry code is pretty straightforward glue code. For each registration, we create a poller. we collect the pollers in a list so that we reference them in `start()` and `stop()`. 

**If we call `start()` on the registry now, each poller will start polling messages from SQS in a separate thread and fan the messages out to message handlers living in a separate thread pool for each message handler.**

### Creating a Spring Boot Auto-Configuration

The code above will work with plain Java, but I promised to make it work with Spring Boot. For this, we can create a [Spring Boot starter](/spring-boot-starter/).

The starter consists of a single auto-configuration class: 

```java
@Configuration
class SqsAutoConfiguration {

  @Bean
  SqsMessageHandlerRegistry sqsMessageHandlerRegistry(
      List<SqsMessageHandlerRegistration<?>> registrations) {
    return new SqsMessageHandlerRegistry(registrations);
  }

  @Bean
  SqsLifecycle sqsLifecycle(SqsMessageHandlerRegistry registry) {
    return new SqsLifecycle(registry);
  }

}
```

In this configuration, we register our registry from above and pass all `SqsMessageHandlerRegistration` beans into it. 

**To register a message handler, all we have to do now is to add a `SqsMessageHandlerRegistration` bean to the Spring application context.** 

Additionally, we add an `SqsLifecycle` bean to the application context:

```java
@RequiredArgsConstructor
class SqsAutoConfigurationLifecycle implements 
      ApplicationListener<ApplicationReadyEvent> {

  private final SqsMessageHandlerRegistry registry;

  @Override
  public void onApplicationEvent(ApplicationReadyEvent event) {
    registry.start();
  }

  @PreDestroy
  public void destroy() {
    registry.stop();
  }

}
```

This lifecycle bean has the sole job of starting up our registry when the Spring Boot application starts up and stopping it again on shutdown.

Finally, to make the `SqsAutoConfiguration` a real auto configuration, we need to add it to the `META-INF/spring.factories` file for Spring to pick up on application startup:

```properties
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  io.reflectoring.sqs.internal.SqsAutoConfiguration
```

## Conclusion

In this article, we went through a way of implementing a robust message publisher and message handler to interact with an SQS queue. The Amazon SDK provides an easy-to-use interface but we wrapped it with layer adding robustness in the form of retries and scalability in the form of a configurable thread pool to handle messages.

The full code explained in this article is available as a Spring Boot starter [on Github](https://github.com/thombergs/sqs-starter) and [Maven Central](https://search.maven.org/artifact/io.reflectoring/sqs-starter) to use at your leisure.










