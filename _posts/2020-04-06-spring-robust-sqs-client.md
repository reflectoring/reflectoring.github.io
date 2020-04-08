---
title: Building a Robust SQS Client with Spring Boot
categories: [meta]
date: 2020-04-06 05:00:00 +1100
modified: 2020-04-06 05:00:00 +1100
author: default
excerpt: "TODO"
image:
  auto: 0067-todo
---

* while you can interact with SQS in a variety of operations, publishing a message to SQS and receiving messages from SQS are the most common use cases and should therefor be as robust as possible

## Get The SQS Starter Library
The code in this article comes from the [SQS Starter library](https://github.com/thombergs/sqs-starter) that I built for one of my projects. If you need a robust SQS message publisher and message handler, have a look at the starter on GitHub to see if it fits your needs.

## The `AmazonSQS` Client

* SDK provided by AWS
* easy to use
* but we need some extra robustness

## Building a Robust Message Publisher

* `AmazonSQS` provides overloaded `sendMessage()` and `sendMessageBatch()` methods that we can use to publish messages
* while this is easy, messages are handled as `String`s and we want to build in some robustness with retries
* So let's build a typesafe, robust `SqsMessagePublisher`:

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
  throw new RuntimeException(String.format("got error response from SQS queue %s: %s",
    sqsQueueUrl,
    result.getSdkHttpMetadata()));
  }

  } catch (JsonProcessingException e) {
  throw new IllegalStateException("error sending message to SQS: ", e);
  }
  }
}
```

## Building a Robust Message Handler

* SQS doesn't push messages to us (at least not in a common setting), so we have to pull.
* with that come questions like "how often do we pull?", "and how to we handle message spikes"?

### The `SqsMessageHandler` Interface

```java
public interface SqsMessageHandler<T> {

  void handle(T message);

  Class<T> messageType();

}
```

The `SqsMessageHandler` interface gives us type safety. Instead of having to work with `String`s, we can now work with message types.

But we still need some infrastructure to get messages from SQS, deserialize them into objects of our message type, and finally pass them to our message handler.

### Fetching Messages from SQS

```java
class SqsMessageFetcher {

  private static final Logger logger = LoggerFactory.getLogger(SqsMessageFetcher.class);
  private final AmazonSQS sqsClient;
  private final SqsMessagePollerProperties properties;

  // constructor ...

  List<Message> fetchMessages() {

    logger.debug("fetching messages from SQS queue {}", properties.getQueueUrl());

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

### Polling Messages 

```java
class SqsMessagePoller<T> {

  private static final Logger logger = LoggerFactory.getLogger(SqsMessagePoller.class);
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
        final T message = objectMapper.readValue(sqsMessage.getBody(), messageHandler.messageType());
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
    sqsClient.deleteMessage(pollingProperties.getQueueUrl(), message.getReceiptHandle());
  }

}
```

```java
class SqsMessagePoller<T> {

  private static final Logger logger = LoggerFactory.getLogger(SqsMessagePoller.class);
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

### Registering Message Handlers

```java
List<SqsMessageHandlerRegistration> registrations = ...;
SqsMessageHandlerRegistry registry = new SqsMessageHandlerRegistry(registrations);
registry.start();
...
registry.stop();
```

```java
public interface SqsMessageHandlerRegistration<T> {

    /**
     * The message handler that shall process the messages polled from SQS.
     */
    SqsMessageHandler<T> messageHandler();

    /**
     * A human-readable name for the message handler. This is used to name the message handler threads.
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

```java
class SqsMessageHandlerRegistry {

    private static final Logger logger = LoggerFactory.getLogger(SqsMessageHandlerRegistry.class);

    private final Set<SqsMessagePoller<?>> pollers;

    public SqsMessageHandlerRegistry(List<SqsMessageHandlerRegistration<?>> messageHandlerRegistrations) {
        this.pollers = initializePollers(messageHandlerRegistrations);
    }

    private Set<SqsMessagePoller<?>> initializePollers(List<SqsMessageHandlerRegistration<?>> registrations) {
        Set<SqsMessagePoller<?>> pollers = new HashSet<>();
        for (SqsMessageHandlerRegistration<?> registration : registrations) {
            pollers.add(createPollerForHandler(registration));
            logger.info("initialized SqsMessagePoller '{}'", registration.name());
        }
        return pollers;
    }

    private SqsMessagePoller<?> createPollerForHandler(SqsMessageHandlerRegistration<?> registration) {
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


## Wiring it Up With Spring Boot

### Creating an Auto Configuration

```java
@Configuration
class SqsAutoConfiguration {

  @Bean
  SqsMessageHandlerRegistry sqsMessageHandlerRegistry(List<SqsMessageHandlerRegistration<?>> registrations) {
    return new SqsMessageHandlerRegistry(registrations);
  }

  @Bean
  SqsLifecycle sqsLifecycle(SqsMessageHandlerRegistry registry) {
    return new SqsLifecycle(registry);
  }

}
```

```java
@RequiredArgsConstructor
class SqsAutoConfigurationLifecycle implements ApplicationListener<ApplicationReadyEvent> {

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

```properties
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  io.reflectoring.sqs.internal.SqsAutoConfiguration
```

## Conclusion











