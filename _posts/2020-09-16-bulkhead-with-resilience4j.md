---
title: Implementing Bulkhead with Resilience4j
categories: [java]
date: 2020-09-16 05:00:00 +1100
modified: 2020-09-16 05:00:00 +1100
author: saajan
excerpt: "Next up in the Resilience4j series - this article explains the Bulkhead module and how to use it to build resilient applications."
image:
  auto: 0079-stopwatch
---

In this series so far, we have learned about Resilience4j and its [Retry](/retry-with-resilience4j/), [RateLimiter](/rate-limiting-with-resilience4j/), and [TimeLimiter]((/bulkhead-with-resilience4j/)) modules. In this article, we will explore the Bulkhead module. We will find out what problem it solves, when and how to use it, and also look at a few examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/resilience4j/bulkhead" %}

## What is Resilience4j?

Please refer to the description in the previous article for a quick intro into [how Resilience4j works in general](/retry-with-resilience4j/#what-is-resilience4j).

## What is a Bulkhead?

A few years back we had a production issue where one of the servers stopped responding to health checks and the load balancer took the server out of the pool. Even as we began investigating the issue, there was a second alert - another server had stopped responding to health checks and had also been taken out of the pool. In a few minutes, every server had stopped responding to health probes and our service was completely down.

We were using Redis for caching some data for a couple of features supported by the application. As we found out later, there was some issue with the Redis cluster at the same time and it had stopped accepting new connections. We were using the Jedis library to connect to Redis and the default behavior of that library was to block the calling thread indefinitely until a connection was established. 

Our service was hosted on Tomcat and it had a default request handling thread pool size of 200 threads. So every request which went through a code path that connected to Redis ended up blocking the thread indefinitely. Within minutes, all 2000 threads across the cluster had blocked indefinitely - there were no free threads to even respond to health checks from the load balancer.

The service itself supported several features and not all of them required accessing the Redis cache. But when a problem occurred in this one area, it ended up impacting the entire service. **This is exactly the problem that bulkhead addresses - it prevents a problem in one area of the service from affecting the entire service.** While what happened to our service was an extreme example, we can see how even a slow upstream service can impact an unrelated area of the calling service. 

If we had a limit of, say, 20 concurrent requests to Redis set on each of the server instances, only those threads would have got affected when the Redis connectivity issue occurred. The remaining request handling threads could have continued serving other requests. 

**The idea behind bulkheads is to set a limit on the number of concurrent calls we make to a remote service. We treat calls to different remote services as different, isolated pools and set a limit on how many calls can be made concurrently.** 

The term bulkhead itself comes from its usage in ships where the bottom portion of the ship is divided into sections separated from each other. If there is a breach, and water starts flowing in, only that section gets filled with water. This prevents the entire ship from sinking.

## Resilience4j Bulkhead Concepts

[resilience4j-bulkhead](https://resilience4j.readme.io/docs/bulkhead) works similar to the other Resilience4j modules. We provide it the code we want to execute as a functional construct - a lambda expression that makes a remote call or a `Supplier` of some value which is retrieved from a remote service, etc. -  and the bulkhead decorates it with the code to control the number of concurrent calls.

**Resilience4j provides two types of bulkheads - `SemaphoreBulkhead` and `ThreadPoolBulkhead`.** 

The `SemaphoreBulkhead` internally uses `java.util.concurrent.Semaphore` to control the number of concurrent calls and executes our code on the current thread. 

The `ThreadPoolBulkhead` uses a thread from a thread pool to execute our code. It internally uses a `java.util.concurrent.ArrayBlockingQueue` and a `java.util.concurrent.ThreadPoolExecutor` to control the number of concurrent calls.

### `SemaphoreBulkhead`

Let's look at the configurations associated with the semaphore bulkhead and what they mean.

`maxConcurrentCalls` determines the maximum number of concurrent calls we can make to the remote service. We can think of this value as the number of permits that the semaphore is initialized with. 

Any thread which attempts to call the remote service over this limit can either get a `BulkheadFullException` immediately or wait for some time for a permit to be released by another thread. This is determined by the `maxWaitDuration` value. 

When there are multiple threads waiting for permits, the `fairCallHandlingEnabled` configuration determines if the waiting threads acquire permits in a first-in, first-out [order](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Semaphore.html#Semaphore-int-boolean-). 

Finally, the `writableStackTraceEnabled` configuration lets us reduce the amount of information in the stack trace when a `BulkheadFullException` occurs. This can be useful because without it, our logs could get filled with a lot of similar information when the exception occurs multiple times. Usually when reading logs, just knowing that a `BulkheadFullException` has occurred is enough.

### `ThreadPoolBulkhead`

`coreThreadPoolSize` , `maxThreadPoolSize` , `keepAliveDuration` and `queueCapacity`  are the main configurations associated with the `ThreadPoolBulkhead`. `ThreadPoolBulkhead` internally uses these configurations to [construct](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ThreadPoolExecutor.html#ThreadPoolExecutor-int-int-long-java.util.concurrent.TimeUnit-java.util.concurrent.BlockingQueue-java.util.concurrent.ThreadFactory-) a `ThreadPoolExecutor`. 

The  internal`ThreadPoolExecutor` executes incoming tasks using one of the available, free threads. If no thread is free to execute an incoming task, the task is enqueued for executing later when a thread becomes available. If the `queueCapacity` has been reached, then the remote call is rejected with a `BulkheadFullException`. 

`ThreadPoolBulkhead` also has a`writableStackTraceEnabled` configuration to control the amount of information in the stack trace of a BulkheadFullException.

## Using the Resilience4j Bulkhead Module

Let's see how to use the various features available in the [resilience4j-bulkhead](https://resilience4j.readme.io/docs/bulkhead) module. We will use the same example as the previous articles in this series. Assume that we are building a website for an airline to allow its customers to search for and book flights. Our service talks to a remote service encapsulated by the class `FlightSearchService`. 

### `SemaphoreBulkhead`

When using the semaphore-based bulkhead, `BulkheadRegistry`, `BulkheadConfig`, and `Bulkhead` are the main abstractions we work with.

`BulkheadRegistry` is a factory for creating and managing `Bulkhead` objects. 

`BulkheadConfig` encapsulates the `maxConcurrentCalls`, `maxWaitDuration`, `writableStackTraceEnabled`, and `fairCallHandlingEnabled` configurations. Each `Bulkhead` object is associated with a `BulkheadConfig`. 

The first step is to create a `BulkheadConfig`:

```java
BulkheadConfig config = BulkheadConfig.ofDefaults();
```

This creates a `BulkheadConfig` with default values for`maxConcurrentCalls`(25), `maxWaitDuration`(0s), `writableStackTraceEnabled`(`true`), and `fairCallHandlingEnabled`(`true`).

Let's say we want to limit the number of concurrent calls to 2 and that we are willing to wait 2s for a thread to acquire a permit:

```java
BulkheadConfig config = BulkheadConfig.custom()
  .maxConcurrentCalls(2)
  .maxWaitDuration(Duration.ofSeconds(2))
  .build();
```

We then create a `Bulkhead`:

```java
BulkheadRegistry registry = BulkheadRegistry.of(config);
Bulkhead bulkhead = registry.bulkhead("flightSearchService");
```

Let's now express our code to run a flight search as a `Supplier` and decorate it using the `bulkhead`:

```java
Supplier<List<Flight>> flightsSupplier = () -> service.searchFlightsTakingOneSecond(request);
Supplier<List<Flight>> decoratedFlightsSupplier = Bulkhead.decorateSupplier(bulkhead, flightsSupplier);
```

Finally, let's call the decorated operation a few times to understand how the bulkhead works. We can use `CompletableFuture` to simulate concurrent flight search requests from users:

```java
for (int i=0; i<4; i++) {
  CompletableFuture
    .supplyAsync(decoratedFlightsSupplier)
    .thenAccept(flights -> System.out.println("Received results"));
}
```

The timestamps and thread names in the output show that out of the 4 concurrent requests, the first two requests went through immediately:

```java
Searching for flights; current time = 11:42:13 187; current thread = ForkJoinPool.commonPool-worker-3
Searching for flights; current time = 11:42:13 187; current thread = ForkJoinPool.commonPool-worker-5
Flight search successful at 11:42:13 226
Flight search successful at 11:42:13 226
Received results
Received results
Searching for flights; current time = 11:42:14 239; current thread = ForkJoinPool.commonPool-worker-9
Searching for flights; current time = 11:42:14 239; current thread = ForkJoinPool.commonPool-worker-7
Flight search successful at 11:42:14 239
Flight search successful at 11:42:14 239
Received results
Received results
```

The third and the fourth requests were able to acquire permits only 1s later, after the previous requests  completed.

If a thread is not able to acquire a permit in the 2s  `maxWaitDuration` we specified, a `BulkheadFullException` is thrown:

```
Caused by: io.github.resilience4j.bulkhead.BulkheadFullException: Bulkhead 'flightSearchService' is full and does not permit further calls
	at io.github.resilience4j.bulkhead.BulkheadFullException.createBulkheadFullException(BulkheadFullException.java:49)
	at io.github.resilience4j.bulkhead.internal.SemaphoreBulkhead.acquirePermission(SemaphoreBulkhead.java:164)
	at io.github.resilience4j.bulkhead.Bulkhead.lambda$decorateSupplier$5(Bulkhead.java:194)
	at java.base/java.util.concurrent.CompletableFuture$AsyncSupply.run(CompletableFuture.java:1700)
	... 6 more
```

Apart from the first line, the other lines in the stack trace are not adding much value. If the `BulkheadFullException` occurs multiple times, these stack trace lines would repeat in our log files.

We can reduce the amount of information that is generated in the stack trace by setting the `writableStackTraceEnabled` configuration to `false`:

```java
BulkheadConfig config = BulkheadConfig.custom()
	.maxConcurrentCalls(2)
	.maxWaitDuration(Duration.ofSeconds(1))
	.writableStackTraceEnabled(false)
  .build();
```

Now, when a `BulkheadFullException` occurs, only a single line is present in the stack trace:

```
Searching for flights; current time = 12:27:58 658; current thread = ForkJoinPool.commonPool-worker-3
Searching for flights; current time = 12:27:58 658; current thread = ForkJoinPool.commonPool-worker-5
io.github.resilience4j.bulkhead.BulkheadFullException: Bulkhead 'flightSearchService' is full and does not permit further calls
Flight search successful at 12:27:58 699
Flight search successful at 12:27:58 699
Received results
Received results
```

Similar to the other Resilience4j modules we have seen, the `Bulkhead` also provides additional methods like `decorateCheckedSupplier()`, `decorateCompletionStage()`, `decorateRunnable()`, `decorateConsumer()` etc.

### `ThreadPoolBulkhead`

When using the semaphore-based bulkhead, `ThreadPoolBulkheadRegistry`, `ThreadPoolBulkheadConfig`, and `ThreadPoolBulkhead` are the main abstractions we work with.

`ThreadPoolBulkheadRegistry` is a factory for creating and managing `ThreadPoolBulkhead` objects. 

`ThreadPoolBulkheadConfig` encapsulates the `coreThreadPoolSize` , `maxThreadPoolSize` , `keepAliveDuration` and `queueCapacity` configurations. Each `ThreadPoolBulkhead` object is associated with a `ThreadPoolBulkheadConfig`. 

The first step is to create a `ThreadPoolBulkheadConfig`:

```java
ThreadPoolBulkheadConfig config = ThreadPoolBulkheadConfig.ofDefaults();
```

This creates a `ThreadPoolBulkheadConfig` with default values for `coreThreadPoolSize` (number of processors available - 1) , `maxThreadPoolSize` (number of processors available) , `keepAliveDuration`(20ms) and `queueCapacity` (100). 

Let's say we want to limit the number of concurrent calls to 2:

```java
ThreadPoolBulkheadConfig config = ThreadPoolBulkheadConfig.custom()
  .maxThreadPoolSize(2)
  .coreThreadPoolSize(1)
  .queueCapacity(1)
  .build();
```

We then create a `ThreadPoolBulkhead`:

```java
ThreadPoolBulkheadRegistry registry = ThreadPoolBulkheadRegistry.of(config);
ThreadPoolBulkhead bulkhead = registry.bulkhead("flightSearchService");
```

Let's now express our code to run a flight search as a `Supplier` and decorate it using the `bulkhead`:

```java
Supplier<List<Flight>> flightsSupplier = () -> service.searchFlightsTakingOneSecond(request);
Supplier<CompletionStage<List<Flight>>> decoratedFlightsSupplier = ThreadPoolBulkhead.decorateSupplier(bulkhead, flightsSupplier);
```

Unlike the `SemaphoreBulkhead.decorateSupplier()` which returned a `Supplier<List<Flight>>`, the `ThreadPoolBulkhead.decorateSupplier()` returns a `Supplier<CompletionStage<List<Flight>>`. This is because the `ThreadPoolBulkHead` does not execute the code synchronously on the current thread. 

Finally, let's call the decorated operation a few times to understand how the bulkhead works:

```java
for (int i=0; i<3; i++) {
  decoratedFlightsSupplier
    .get()
    .whenComplete((r,t) -> {
      if (r != null) {
        System.out.println("Received results");
      }
      if (t != null) {
        t.printStackTrace();
      }
    });
}
```

The timestamps and thread names in the output show that while the first two requests executed immediately, the third request was queued and later executed by one of the threads that freed up:

```java
Searching for flights; current time = 16:15:00 097; current thread = bulkhead-flightSearchService-1
Searching for flights; current time = 16:15:00 097; current thread = bulkhead-flightSearchService-2
Flight search successful at 16:15:00 136
Flight search successful at 16:15:00 135
Received results
Received results
Searching for flights; current time = 16:15:01 151; current thread = bulkhead-flightSearchService-2
Flight search successful at 16:15:01 151
Received results
```

If there are no free threads and no capacity in the queue, a `BulkheadFullException` is thrown:

```
Exception in thread "main" io.github.resilience4j.bulkhead.BulkheadFullException: Bulkhead 'flightSearchService' is full and does not permit further calls
	at io.github.resilience4j.bulkhead.BulkheadFullException.createBulkheadFullException(BulkheadFullException.java:64)
	at io.github.resilience4j.bulkhead.internal.FixedThreadPoolBulkhead.submit(FixedThreadPoolBulkhead.java:157)
... other lines omitted ...
```

We can use the `writableStackTraceEnabled` configuration to reduce the amount of information that is generated in the stack trace:

```java
ThreadPoolBulkheadConfig config = ThreadPoolBulkheadConfig.custom()
  .maxThreadPoolSize(2)
  .coreThreadPoolSize(1)
  .queueCapacity(1)
  .writableStackTraceEnabled(false)
  .build();
```

Now, when a `BulkheadFullException` occurs, only a single line is present in the stack trace:

```
Searching for flights; current time = 12:27:58 658; current thread = ForkJoinPool.commonPool-worker-3
Searching for flights; current time = 12:27:58 658; current thread = ForkJoinPool.commonPool-worker-5
io.github.resilience4j.bulkhead.BulkheadFullException: Bulkhead 'flightSearchService' is full and does not permit further calls
Flight search successful at 12:27:58 699
Flight search successful at 12:27:58 699
Received results
Received results
```

#### Context Propagation

Sometimes we store data in a `ThreadLocal` variable and read it in a different area of the code. We do this to avoid explicitly passing the data as a parameter between method chains, especially when the value is not directly related to the core business logic we are implementing. 

For example, we might want to log the current user ID or a transaction ID or some request tracking ID to every log statement to make it easier to search logs. Using a `ThreadLocal` is a useful technique for such scenarios.

When using the `ThreadPoolBulkhead`, since our code is not executed on the current thread, the data we had stored on `ThreadLocal` variables will not be available in the other thread. 

Let's look at an example to understand this problem. First we define a `RequestTrackingIdHolder` class, a wrapper class around a `ThreadLocal`:

```java
class RequestTrackingIdHolder {
  static ThreadLocal<String> threadLocal = new ThreadLocal<>();

  static String getRequestTrackingId() {
    return threadLocal.get();
  }

  static void setRequestTrackingId(String id) {
    if (threadLocal.get() != null) {
      threadLocal.set(null);
      threadLocal.remove();
    }
    threadLocal.set(id);
  }

  static void clear() {
    threadLocal.set(null);
    threadLocal.remove();
  }
}
```

The static methods make it easy to set and get the value stored on the `ThreadLocal`. We next set a request tracking id before calling the bulkhead-decorated flight search operation:

```java
for (int i=0; i<2; i++) {
  String trackingId = UUID.randomUUID().toString();
  System.out.println("Setting trackingId " + trackingId + " on parent, main thread before calling flight search");
  RequestTrackingIdHolder.setRequestTrackingId(trackingId);
  decoratedFlightsSupplier
    .get()
    .whenComplete((r,t) -> {
				// other lines omitted
    });
}

```

The sample output shows that this value was not available in the bulkhead-managed thread:

```
Setting trackingId 98ff99df-466a-47f7-88f7-5e31fc8fcb6b on parent, main thread before calling flight search
Setting trackingId 6b98d73c-a590-4a20-b19d-c85fea783caf on parent, main thread before calling flight search
Searching for flights; current time = 19:53:53 799; current thread = bulkhead-flightSearchService-1; Request Tracking Id = null
Flight search successful at 19:53:53 824
Received results
Searching for flights; current time = 19:53:54 836; current thread = bulkhead-flightSearchService-1; Request Tracking Id = null
Flight search successful at 19:53:54 836
Received results
```

To solve this problem, `ThreadPoolBulkhead` provides a `ContextPropagator`. `ContextPropgator` is an abstraction for retrieving, copying and cleaning up values across thread boundaries. It defines an interface with methods to get a value from the current thread (`retrieve()`), copy it to the new executing thread (`copy()`) and finally cleaning up on the executing thread (`clear()`).

Let's implement a `RequestTrackingIdPropagator`:

```java
class RequestTrackingIdPropagator implements ContextPropagator {
  @Override
  public Supplier<Optional> retrieve() {
    System.out.println("Getting request tracking id from thread: " + Thread.currentThread().getName());
    return () -> Optional.of(RequestTrackingIdHolder.getRequestTrackingId());
  }

  @Override
  Consumer<Optional> copy() {
    return optional -> {
      System.out.println("Setting request tracking id " + optional.get() + " on thread: " + Thread.currentThread().getName());
      optional.ifPresent(s -> RequestTrackingIdHolder.setRequestTrackingId(s.toString()));
    };
  }

  @Override
  Consumer<Optional> clear() {
    return optional -> {
      System.out.println("Clearing request tracking id on thread: " + Thread.currentThread().getName());
      optional.ifPresent(s -> RequestTrackingIdHolder.clear());
    };
  }
}
```

We provide the `ContextPropagator` to the `ThreadPoolBulkhead` by setting it on the `ThreadPoolBulkheadConfig`:

```java
ThreadPoolBulkheadConfig config = ThreadPoolBulkheadConfig.custom()
.maxThreadPoolSize(2)
.coreThreadPoolSize(1)
.queueCapacity(1)
.contextPropagator(new RequestTrackingIdPropagator())
.build();        
```

Now, the sample output shows that the request tracking id was made available in the bulkhead-managed thread:

```
Setting trackingId 71d44cb8-dab6-4222-8945-e7fd023528ba on parent, main thread before calling flight search
Getting request tracking id from thread: main
Setting trackingId 5f9dd084-f2cb-4a20-804b-038828abc161 on parent, main thread before calling flight search
Getting request tracking id from thread: main
Setting request tracking id 71d44cb8-dab6-4222-8945-e7fd023528ba on thread: bulkhead-flightSearchService-1
Searching for flights; current time = 20:07:56 508; current thread = bulkhead-flightSearchService-1; Request Tracking Id = 71d44cb8-dab6-4222-8945-e7fd023528ba
Flight search successful at 20:07:56 538
Clearing request tracking id on thread: bulkhead-flightSearchService-1
Received results
Setting request tracking id 5f9dd084-f2cb-4a20-804b-038828abc161 on thread: bulkhead-flightSearchService-1
Searching for flights; current time = 20:07:57 542; current thread = bulkhead-flightSearchService-1; Request Tracking Id = 5f9dd084-f2cb-4a20-804b-038828abc161
Flight search successful at 20:07:57 542
Clearing request tracking id on thread: bulkhead-flightSearchService-1
Received results
```

## Bulkhead Events

Both `Bulkhead` and `ThreadPoolBulkhead` have an `EventPublisher` which generates events of the types `BulkheadOnCallPermittedEvent`, `BulkheadOnCallRejectedEvent`, and `BulkheadOnCallFinishedEvent`. We can listen for these events and log them, for example:

```java
Bulkhead bulkhead = registry.bulkhead("flightSearchService");
bulkhead.getEventPublisher().onCallPermitted(e -> System.out.println(e.toString()));
bulkhead.getEventPublisher().onCallFinished(e -> System.out.println(e.toString()));
bulkhead.getEventPublisher().onCallRejected(e -> System.out.println(e.toString()));
```

The sample output shows what's logged:

```
2020-08-26T12:27:39.790435: Bulkhead 'flightSearch' permitted a call.
... other lines omitted ...
2020-08-26T12:27:40.290987: Bulkhead 'flightSearch' rejected a call.
... other lines omitted ...
2020-08-26T12:27:41.094866: Bulkhead 'flightSearch' has finished a call.
```

## Bulkhead Metrics

### `SemaphoreBulkhead`

`Bulkhead` exposes two metrics - the maximum number of available permissions (`resilience4j.bulkhead.max.allowed.concurrent.calls`) and the number of allowed concurrent calls (`resilience4j.bulkhead.available.concurrent.calls`).`resilience4j.bulkhead.max.allowed.concurrent.calls` is the same as `maxConcurrentCalls` that we configure on the `BulkheadConfig`.

First, we create `BulkheadConfig`, `BulkheadRegistry`, and `Bulkhead` as usual. Then, we create a `MeterRegistry` and bind the `BulkheadRegistry` to it:

```java
MeterRegistry meterRegistry = new SimpleMeterRegistry();
TaggedBulkheadMetrics.ofBulkheadRegistry(registry)
  .bindTo(meterRegistry);
```

After running the bulkhead-decorated operation a few times, we display the captured metrics:

```java
Consumer<Meter> meterConsumer = meter -> {
  String desc = meter.getId().getDescription();
  String metricName = meter.getId().getName();
  Double metricValue = StreamSupport.stream(meter.measure().spliterator(), false)
    .filter(m -> m.getStatistic().name().equals("VALUE"))
    .findFirst()
    .map(m -> m.getValue())
    .orElse(0.0);
  System.out.println(desc + " - " + metricName + ": " + metricValue);
};
meterRegistry.forEachMeter(meterConsumer);
```

Here's some sample output:

```
The maximum number of available permissions - resilience4j.bulkhead.max.allowed.concurrent.calls: 8.0
The number of available permissions - resilience4j.bulkhead.available.concurrent.calls: 3.0
```

### `ThreadPoolBulkhead`

`ThreadPoolBulkhead` exposes five metrics - the current length of the queue (`resilience4j.bulkhead.queue.depth`), the current size of the thread pool (`resilience4j.bulkhead.thread.pool.size`), the core and maximum sizes of the thread pool (`resilience4j.bulkhead.core.thread.pool.size` and `resilience4j.bulkhead.max.thread.pool.size`) and the capacity of the queue (` resilience4j.bulkhead.queue.capacity`). 

First, we create `ThreadPoolBulkheadConfig`, `ThreadPoolBulkheadRegistry`, and `ThreadPoolBulkhead` as usual. Then, we create a `MeterRegistry` and bind the `ThreadPoolBulkheadRegistry` to it:

```java
MeterRegistry meterRegistry = new SimpleMeterRegistry();
TaggedThreadPoolBulkheadMetrics.ofThreadPoolBulkheadRegistry(registry).bindTo(meterRegistry);
```

After running the bulkhead-decorated operation a few times, we display the captured metrics:

```
The queue capacity - resilience4j.bulkhead.queue.capacity: 5.0
The queue depth - resilience4j.bulkhead.queue.depth: 1.0
The thread pool size - resilience4j.bulkhead.thread.pool.size: 5.0
The maximum thread pool size - resilience4j.bulkhead.max.thread.pool.size: 5.0
The core thread pool size - resilience4j.bulkhead.core.thread.pool.size: 3.0
```

In a real application, we would export the data to a monitoring system periodically and analyze it on a dashboard.

## Gotchas and Good Practices When Implementing Bulkhead

### Make the Bulkhead a Singleton

**All calls to a given remote service should go through the same `Bulkhead` instance. For a given remote service the `Bulkhead` must be a singleton**. 

If we don't enforce this, some areas of our codebase may make a direct call to the remote service, bypassing the `Bulkhead`. To prevent this, the actual call to the remote service should be in a core, internal layer and other areas should use the bulkhead decorator exposed by the internal layer.

How can we ensure that a new developer understands this intent in the future? Check out Tom's article which shows one way of solving such problems by [organizing the package structure to make such intents clear](https://reflectoring.io/java-components-clean-boundaries/). Additionally, it shows how to enforce this by codifying the intent in ArchUnit tests.

### Combine with other Resilience4j modules

It's more effective to combine a bulkhead with one or more of the other Resilience4j modules like retry and rate limiter. We may want to retry after some delay if there is a `BulkheadFullException`, for example.

## Conclusion

In this article, we learned how we can use Resilience4j's Bulkhead module to set a limit on the concurrent calls that we make to a remote service. We learned why this is important and also saw some practical examples on how to configure it.

You can play around with a complete application illustrating these ideas using the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/resilience4j/bulkhead).