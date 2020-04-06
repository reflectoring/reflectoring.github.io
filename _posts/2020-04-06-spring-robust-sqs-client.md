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














