---
title: Multi-threaded Batch Processing with RxJava
categories: [java]
date: 2020-01-30 05:00:00 +1100
modified: 2020-01-30 05:00:00 +1100
author: tom
excerpt: "Reactive Programming offers a lot of pitfalls for rookies, especially when it's multi-threaded. This article documents some of those pitfalls so you don't have to fall."
image:
  auto: 0018-cogs
---

I had a rough time this week refactoring a multi-threaded, reactive message processor. It just didn't seem to be working the way I expected. It was failing in various ways, each of which took me a while to understand. But it finally clicked.

This article provides a complete example of a reactive stream that processes items in parallel and explains all the pitfalls I encountered. It should be a good intro for developers that are just starting with reactive, and it also provides a working solution for creating a reactive batch processing stream for those that are looking for such a solution.

We'll be using [RxJava 3](https://github.com/ReactiveX/RxJava), which is an implementation of the [ReactiveX](http://reactivex.io/) specification. It should be relatively easy to transfer the code to other reactive libraries, though.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/reactive" %}

## The Batch Processing Use Case

Let's start with a literally painted picture of what we're trying to achieve:

![A coordinator thread fans items out to worker threads to be processed.](/assets/img/posts/rxjava-reactive-batch-processing/usecase.jpg)

We want to create a paginating processor that fetches batches (or pages) of items (we may call them messages, tasks, or whatever) from a source. This source can be a queue system, or a REST endpoint, or any other system providing input messages for us. 

Our batch processor loads these batches of items in a dedicated "coordinator" thread, splits the batch into single items, and forwards the single items to a number of worker threads.

In the figure above, the coordinator threads loads pages of 3 items at a time and forwards them to a thread pool of 2 worker threads to be processed. When all items of a page have been processed, the coordinator thread loads the next batch of items and forwards these, too. If the source runs out of items, the coordinator thread waits for the source to generated more messages and continues its work.

Our batch processor shall have the following properties:

* The fetching of items must take place in a different thread from processing the items to fully take advantage of parallelization (i.e. we need a coordinator thread).
* The number of worker threads must be configurable.
* If the message source has more messages than our worker thread pool can handle, we must not reject those incoming messages, but instead wait until the worker threads have capacity again.

## Why Reactive?

So, why implement this multi-threaded batch processor in the reactive way instead of in the usual imperative way? Reactive is hard, isn't it? 

Hard to learn, hard to read, even harder to debug. 

Believe me, I had my share of cursing the reactive programming model, and I think all of the above statements are true. But I can't help to admire the elegance of the reactive way, especially when it's about working with multiple threads.

It requires much less code and once you have understood it, it even makes sense (this is a lame statement, but I wanted to express my joy in finally having understood it)! 

So, let's understand this thing.

## Designing a Batch Processing API

First, let's define the API of this batch processor we want to create. 

### `MessageSource`

A `MessageSource` is where the items come from:

```java
public interface MessageSource {

  Flowable<MessageBatch> getMessageBatches();

}
```

It's a simple interface that returns a `Flowable` of `MessageBatch` objects. This `Flowable` can be a steady stream of messages, or a paginated one like in the figure above, or whatever else. The implementation of this interface decides the way in which messages are being fetched from a source. 

### `MessageHandler`

At the other end of the reactive stream is the `MessageHandler`:

```java
public interface MessageHandler {

  enum Result {
    SUCCESS,
    FAILURE
  }

  Result handleMessage(Message message);

}
```

The `handleMessage()` method takes a single message as input and returns a success or failure `Result`. The `Message` and `Result` types are placeholders for whatever types our application needs.

### `ReactiveBatchProcessor`

Finally, we have a class named `ReactiveBatchProcessor` that will later contain the heart of our reactive stream implementation. We'll want this class to have an API like this:

```java
ReactiveBatchProcessor processor = new ReactiveBatchProcessor(
    messageSource,
    messageHandler,
    threads,
    threadPoolQueueSize);

processor.start();
```

We pass a `MessageSource` and a `MessageHandler` to the processor, so that it knows from where to fetch the messages and where to forward them for processing. Also, we want to configure the size of the worker thread pool and the size of the queue of that thread pool (a `ThreadPoolExecutor` can have a queue of tasks that is used to buffer tasks when all threads are currently busy).

## Testing the Batch Processing API

In a test-driven fashion, let's write a failing test before we start with the implementation. Note that I didn't actually build it in TDD fashion, because I didn't actually know how to test this before playing around with the problem a bit. But from a didactic point of view, I think it's good to start with the test to get a grasp for the requirements:

```java
public class ReactiveBatchProcessorTest {

  @Test
  public void allMessagesAreProcessedOnMultipleThreads() {

    int batches = 10;
    int batchSize = 3;
    int threads = 2;
    int threadPoolQueueSize = 10;

    MessageSource messageSource = new TestMessageSource(batches, batchSize);
    TestMessageHandler messageHandler = new TestMessageHandler();

    ReactiveBatchProcessor processor = new ReactiveBatchProcessor(
        messageSource,
        messageHandler,
        threads,
        threadPoolQueueSize);

    processor.start();

    await()
        .atMost(10, TimeUnit.SECONDS)
        .pollInterval(1, TimeUnit.SECONDS)
        .untilAsserted(() -> assertEquals(batches * batchSize, messageHandler.getProcessedMessages()));

    assertEquals(threads, messageHandler.threadNames().size());
  }

}
```

Let's take this test apart. 

Since we want to unit-test our batch processor, we don't want a real message source or message handler. Hence, we create a `TestMessageSource` that generates 10 batches of 3 messages each and a `TestMessageHandler` that processes a single message by simply logging it, counting the number of messages it has processed, and counting the number of threads it has been called from. You can find the implementation of both classes in the [GitHub repo](https://github.com/thombergs/code-examples/tree/master/reactive/src/test/java/io/reflectoring).

Then, we create our `ReactiveBatchProcessor`, giving it 2 threads and a thread pool queue of 10 items.

Next, we call the `start()` method on the processor, which should trigger the coordination thread to start fetching message batches from the source and passing them to the 2 worker threads.

Since none of this takes place in the main thread of our unit test, we now have to wait until all messages have been processed. For this, we make use of the [Awaitility library](http://www.awaitility.org). The `await()` method allows us to wait at most 10 seconds until all messages have been processed. To check if all messages have been processed, we compare the number of expected messages (# of batches * # of messages per batch) to the number of messages our `TestMessageHandler` has counted so far. 

Finally, after all messages have been successfully processed, we ask the `TestMessageHandler` for the number of different threads it has been called in to assert that all threads of our thread pool have been used in processing the messages. 

Our task is now to build an implementation of `ReactiveBatchProcessor` that passes this test.


## Implementing the Reactive Batch Processor

### Iteration #1 - Working on the Wrong Thread

```java
public class ReactiveBatchProcessorV1 {
  
  // ...
  
  public void start() {
    messageSource.getMessageBatches()
      .subscribeOn(Schedulers.from(Executors.newSingleThreadExecutor()))
      .doOnNext(batch -> logger.log(batch.toString()))
      .flatMap(batch -> Flowable.fromIterable(batch.getMessages()))
      .flatMapSingle(m -> Single.just(messageHandler.handleMessage(m))
    .subscribeOn(threadPoolScheduler(threads, 10)))
      .subscribeWith(new SimpleSubscriber<>(threads, 1));
  }
}
```

```
1580500514456 Test worker: subscribed
1580500514472 pool-1-thread-1: MessageBatch{messages=[1-1, 1-2, 1-3]}
1580500514974 pool-1-thread-1: processed message 1-1
1580500515486 pool-1-thread-1: processed message 1-2
1580500515987 pool-1-thread-1: processed message 1-3
1580500515987 pool-1-thread-1: MessageBatch{messages=[2-1, 2-2, 2-3]}
1580500516487 pool-1-thread-1: processed message 2-1
1580500516988 pool-1-thread-1: processed message 2-2
1580500517488 pool-1-thread-1: processed message 2-3
```
Learning: defer execution, otherwise it

### Iteration #2 - Working On Too Many Threadpools

```java
public class ReactiveBatchProcessorV2 {
  
  // ...
  
  public void start() {
    messageSource.getMessageBatches()
      .subscribeOn(Schedulers.from(Executors.newSingleThreadExecutor()))
      .doOnNext(batch -> logger.log(batch.toString()))
      .flatMap(batch -> Flowable.fromIterable(batch.getMessages()))
      .flatMapSingle(m -> Single.defer(() -> Single.just(messageHandler.handleMessage(m)))
      .subscribeOn(threadPoolScheduler(threads, 10)))
      .subscribeWith(new SimpleSubscriber<>(threads, 1));
  }
}
```

```
1580500834588 Test worker: subscribed
1580500834603 pool-1-thread-1: MessageBatch{messages=[1-1, 1-2, 1-3]}
1580500834618 pool-1-thread-1: MessageBatch{messages=[2-1, 2-2, 2-3]}
... some more message batches
1580500835117 pool-3-thread-1: processed message 1-1
1580500835117 pool-5-thread-1: processed message 1-3
1580500835117 pool-4-thread-1: processed message 1-2
1580500835118 pool-8-thread-1: processed message 2-3
1580500835118 pool-6-thread-1: processed message 2-1
1580500835118 pool-7-thread-1: processed message 2-2
... some more messages
```

Learning: subscribeOn() within a flatMap is called for each Observable produced by the flatMap!

### Iteration #3 - Rejected Messages

```java
public class ReactiveBatchProcessorV3 {
  
  // ...
  
  public void start() {
    Scheduler scheduler = threadPoolScheduler(threads, threadPoolQueueSize);
  
    messageSource.getMessageBatches()
      .subscribeOn(Schedulers.from(Executors.newSingleThreadExecutor()))
      .doOnNext(batch -> logger.log(batch.toString()))
      .flatMap(batch -> Flowable.fromIterable(batch.getMessages()))
      .flatMapSingle(m -> Single.defer(() -> Single.just(messageHandler.handleMessage(m)))
    .subscribeOn(scheduler))
      .subscribeWith(new SimpleSubscriber<>(threads, 1));
  }
}
```

```
1580501297031 Test worker: subscribed
1580501297044 pool-3-thread-1: MessageBatch{messages=[1-1, 1-2, 1-3]}
1580501297056 pool-3-thread-1: MessageBatch{messages=[2-1, 2-2, 2-3]}
1580501297057 pool-3-thread-1: MessageBatch{messages=[3-1, 3-2, 3-3]}
1580501297057 pool-3-thread-1: MessageBatch{messages=[4-1, 4-2, 4-3]}
1580501297058 pool-3-thread-1: MessageBatch{messages=[5-1, 5-2, 5-3]}
io.reactivex.exceptions.UndeliverableException: The exception could not be delivered to the consumer ...
Caused by: java.util.concurrent.RejectedExecutionException: Task ... rejected from java.util.concurrent.ThreadPoolExecutor@4a195f69[Running, pool size = 2, active threads = 2, queued tasks = 10, completed tasks = 0]	
```


```java
public class WaitForCapacityPolicy implements RejectedExecutionHandler {

  @Override
  public void rejectedExecution(Runnable runnable, ThreadPoolExecutor threadPoolExecutor) {
    try {
      threadPoolExecutor.getQueue().put(runnable);
    } catch (InterruptedException e) {
      throw new RejectedExecutionException(e);
    }
  }

}
```

### Iteration #4 - Works as Expected

```java
public class ReactiveBatchProcessor {
  
  // ...

  public void start() {
    Scheduler scheduler = threadPoolScheduler(threads, threadPoolQueueSize);
  
    messageSource.getMessageBatches()
      .subscribeOn(Schedulers.from(Executors.newSingleThreadExecutor()))
      .doOnNext(batch -> logger.log(batch.toString()))
      .flatMap(batch -> Flowable.fromIterable(batch.getMessages()))
      .flatMapSingle(m -> Single.defer(() -> Single.just(messageHandler.handleMessage(m)))
    .subscribeOn(scheduler))
      .subscribeWith(new SimpleSubscriber<>(threads, 1));
  }
  
  private Scheduler threadPoolScheduler(int poolSize, int queueSize) {
      return Schedulers.from(new ThreadPoolExecutor(
      poolSize,
      poolSize,
      0L,
      TimeUnit.SECONDS,
      new LinkedBlockingDeque<>(queueSize),
      new WaitForCapacityPolicy()
      ));
    }
}
```

```
1580501887484 Test worker: subscribed
1580501887498 pool-3-thread-1: MessageBatch{messages=[1-1, 1-2, 1-3]}
1580501887510 pool-3-thread-1: MessageBatch{messages=[2-1, 2-2, 2-3]}
1580501887511 pool-3-thread-1: MessageBatch{messages=[3-1, 3-2, 3-3]}
1580501887512 pool-3-thread-1: MessageBatch{messages=[4-1, 4-2, 4-3]}
1580501887512 pool-3-thread-1: MessageBatch{messages=[5-1, 5-2, 5-3]}
1580501888014 pool-1-thread-2: processed message 1-2
1580501888014 pool-1-thread-1: processed message 1-1
1580501888517 pool-1-thread-1: processed message 1-3
1580501888518 pool-1-thread-2: processed message 2-1
1580501888520 pool-3-thread-1: MessageBatch{messages=[6-1, 6-2, 6-3]}
1580501889019 pool-1-thread-1: processed message 2-3
1580501889019 pool-1-thread-2: processed message 2-2
```

Learning: Re-queue  rejected messages if you don't want to lose them 

## Conclusion

