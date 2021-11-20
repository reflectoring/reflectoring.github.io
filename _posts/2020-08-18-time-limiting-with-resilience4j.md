---
title: Implementing Timeouts with Resilience4j
categories: [java]
date: 2020-08-18 05:00:00 +1100
modified: 2020-18-08 05:00:00 +1100
author: saajan
excerpt: "Continuing the Resilience4j journey, this article on TimeLimiter shows when and how to use it to build resilient applications."
image:
  auto: 0079-stopwatch
---

In this series so far, we have learned about Resilience4j and its [Retry](/retry-with-resilience4j/) and [RateLimiter](/rate-limiting-with-resilience4j/) modules. In this article, we will continue exploring Resilience4j with a look into the TimeLimiter. We will find out what problem it solves, when and how to use it, and also look at a few examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/resilience4j/timelimiter" %}

## What is Resilience4j?

Please refer to the description in the previous article for a quick intro into [how Resilience4j works in general](/retry-with-resilience4j/#what-is-resilience4j).

## What is Time Limiting?

Setting a limit on the amount of time we are willing to wait for an operation to complete is called time limiting. If the operation does not complete within the time we specified, we want to be notified about it with a timeout error. 

Sometimes, this is also referred to as "setting a deadline".

One main reason why we would do this is to ensure that we don't make users or clients wait indefinitely. A slow service that does not give any feedback can be frustrating to the user. 

Another reason we set time limits on operations is to make sure we don't hold up server resources indefinitely. The `timeout` value that we specify when using Spring's `@Transactional` annotation is an example - we don't want to hold up database resources for long in this case.

## When to Use the Resilience4j TimeLimiter?

**Resilience4j's [TimeLimiter](https://resilience4j.readme.io/docs/timeout) can be used to set time limits (timeouts) on asynchronous operations implemented with `CompleteableFuture`s**.

The `CompletableFuture` class introduced in Java 8 makes asynchronous, non-blocking programming easier. A slow method can be executed on a different thread, freeing up the current thread to handle other tasks. We can provide a callback to be executed when `slowMethod()` returns:

```java
int slowMethod() {
    // time-consuming computation or remote operation
  return 42;
}

CompletableFuture.supplyAsync(this::slowMethod)
  .thenAccept(System.out::println);
```

The `slowMethod()` here could be some computation or remote operation. Usually, we want to set a time limit when making an asynchronous call like this. We don't want to wait indefinitely for `slowMethod()` to return. If `slowMethod()` takes more than a second, for example, we may want to return a previously computed, cached value or maybe even error out.

In Java 8's `CompletableFuture` there's no easy way to set a time limit on an asynchronous operation. `CompletableFuture` implements the `Future` interface and `Future` has an overloaded `get()` method to specify how long we can wait:

```java
CompletableFuture<Integer> completableFuture = CompletableFuture
  .supplyAsync(this::slowMethod);
Integer result = completableFuture.get(3000, TimeUnit.MILLISECONDS);
System.out.println(result);
```

But there's a problem here - the `get()` method is a blocking call.  So it defeats the purpose of using `CompletableFuture` in the first place, which was to free up the current thread.

**This is the problem that Resilience4j's `TimeLimiter` solves - it lets us set a time limit on the asynchronous operation while retaining the benefit of being non-blocking when working with `CompletableFuture` in Java 8.**

This limitation of `CompletableFuture` has been addressed in Java 9. We can set time limits directly using methods like  `orTimeout()` or `completeOnTimeout()` on `CompletableFuture` in Java 9 and above. With Resilience4J's [metrics](#timelimiter-metrics) and [events](#timelimiter-events), it still provides added value compared to the plain Java 9 solution, however. 

## Resilience4j TimeLimiter Concepts

The `TimeLimiter` supports both `Future` and `CompletableFuture`. But using it with `Future` is equivalent to a `Future.get(long timeout, TimeUnit unit)`. So we will focus on the `CompletableFuture` in the remainder of this article.

Like the other Resilience4j modules, the `TimeLimiter` works by decorating our code with the required functionality - returning a `TimeoutException` if an operation did not complete in the specified `timeoutDuration` in this case.  

We provide the `TimeLimiter` a `timeoutDuration`, a `ScheduledExecutorService` and the asynchronous operation itself expressed as a `Supplier` of a `CompletionStage`. It returns a decorated `Supplier` of a `CompletionStage`. 

Internally, it uses the scheduler to schedule a timeout task - the task of completing the `CompletableFuture` by throwing a `TimeoutException`. If the operation finishes first, the `TimeLimiter` cancels the internal timeout task. 

Along with the `timeoutDuration`, there is another configuration `cancelRunningFuture` associated with a `TimeLimiter`. This configuration [applies to](https://github.com/resilience4j/resilience4j/issues/905) `Future` only and not `CompletableFuture`. When a timeout occurs, it cancels the running `Future` before throwing a `TimeoutException`. 

## Using the Resilience4j TimeLimiter Module

`TimeLimiterRegistry`, `TimeLimiterConfig`, and `TimeLimiter` are the main abstractions in [resilience4j-timelimiter](https://resilience4j.readme.io/docs/timeout). 

`TimeLimiterRegistry` is a factory for creating and managing `TimeLimiter` objects. 

`TimeLimiterConfig` encapsulates the `timeoutDuration` and `cancelRunningFuture` configurations. Each `TimeLimiter` object is associated with a `TimeLimiterConfig`. 

`TimeLimiter` provides helper methods to create or execute decorators for `Future` and `CompletableFuture` `Supplier`s.

Let's see how to use the various features available in the TimeLimiter module. We will use the same example as the previous articles in this series. Assume that we are building a website for an airline to allow its customers to search for and book flights. Our service talks to a remote service encapsulated by the class `FlightSearchService`. 

The first step is to create a `TimeLimiterConfig`:

```java
TimeLimiterConfig config = TimeLimiterConfig.ofDefaults();
```

This creates a `TimeLimiterConfig` with default values for `timeoutDuration` (1000ms) and `cancelRunningFuture` (`true`).

Let's say we want to set a timeout value of 2s instead of the default:

```java
TimeLimiterConfig config = TimeLimiterConfig.custom()
  .timeoutDuration(Duration.ofSeconds(2))
  .build();
```

We then create a `TimeLimiter`:

```java
TimeLimiterRegistry registry = TimeLimiterRegistry.of(config);
TimeLimiter limiter = registry.timeLimiter("flightSearch");
```

We want to asynchronously call `FlightSearchService.searchFlights()` which returns a `List<Flight>`. Let's express this as a  `Supplier<CompletionStage<List<Flight>>>`:

```java
Supplier<List<Flight>> flightSupplier = () -> service.searchFlights(request);
Supplier<CompletionStage<List<Flight>>> origCompletionStageSupplier = 
() -> CompletableFuture.supplyAsync(flightSupplier);
```

We can then decorate the `Supplier` using the `TimeLimiter`:

```java
ScheduledExecutorService scheduler = 
  Executors.newSingleThreadScheduledExecutor();
Supplier<CompletionStage<List<Flight>>> decoratedCompletionStageSupplier =  
  limiter.decorateCompletionStage(scheduler, origCompletionStageSupplier);
```

Finally, let's call the decorated asynchronous operation:

```java
decoratedCompletionStageSupplier.get().whenComplete((result, ex) -> {
  if (ex != null) {
    System.out.println(ex.getMessage());
  }
  if (result != null) {
    System.out.println(result);
  }
});
```

Here's sample output for a successful flight search that took less than the 2s `timeoutDuration` we specified:

```java
Searching for flights; current time = 19:25:09 783; current thread = ForkJoinPool.commonPool-worker-3
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/30/2020', from='NYC', to='LAX'}, Flight{flightNumber='XY 746', flightDate='08/30/2020', from='NYC', to='LAX'}] on thread ForkJoinPool.commonPool-worker-3
```

And this is sample output for a flight search that timed out:

```java
Exception java.util.concurrent.TimeoutException: TimeLimiter 'flightSearch' recorded a timeout exception on thread pool-1-thread-1 at 19:38:16 963
Searching for flights; current time = 19:38:18 448; current thread = ForkJoinPool.commonPool-worker-3
Flight search successful at 19:38:18 461
```

The timestamps and thread names above show that the calling thread got a `TimeoutException` even as the asynchronous operation completed later on the other thread.

We would use `decorateCompletionStage()` if we wanted to create a decorator and re-use it at a different place in the codebase. If we want to create it and immediately execute the `Supplier<CompletionStage>`, we can use `executeCompletionStage()` instance method instead:

```java
CompletionStage<List<Flight>> decoratedCompletionStage =  
  limiter.executeCompletionStage(scheduler, origCompletionStageSupplier);
```

## TimeLimiter Events

`TimeLimiter` has an `EventPublisher` which generates events of the types `TimeLimiterOnSuccessEvent`, `TimeLimiterOnErrorEvent`, and `TimeLimiterOnTimeoutEvent`. We can listen for these events and log them, for example:

```java
TimeLimiter limiter = registry.timeLimiter("flightSearch");
limiter.getEventPublisher().onSuccess(e -> System.out.println(e.toString()));
limiter.getEventPublisher().onError(e -> System.out.println(e.toString()));
limiter.getEventPublisher().onTimeout(e -> System.out.println(e.toString()));
```

The sample output shows what's logged:

```
2020-08-07T11:31:48.181944: TimeLimiter 'flightSearch' recorded a successful call.
... other lines omitted ...
2020-08-07T11:31:48.582263: TimeLimiter 'flightSearch' recorded a timeout exception.
```

## TimeLimiter Metrics

`TimeLimiter` tracks the number of successful, failed, and timed-out calls. 

First, we create `TimeLimiterConfig`, `TimeLimiterRegistry`, and `TimeLimiter` as usual. Then, we create a `MeterRegistry` and bind the `TimeLimiterRegistry` to it:

```java
MeterRegistry meterRegistry = new SimpleMeterRegistry();
TaggedTimeLimiterMetrics.ofTimeLimiterRegistry(registry)
  .bindTo(meterRegistry);
```

After running the time-limited operation a few times, we display the captured metrics:

```java
Consumer<Meter> meterConsumer = meter -> {
  String desc = meter.getId().getDescription();
  String metricName = meter.getId().getName();
  String metricKind = meter.getId().getTag("kind");
  Double metricValue = 
    StreamSupport.stream(meter.measure().spliterator(), false)
    .filter(m -> m.getStatistic().name().equals("COUNT"))
    .findFirst()
    .map(Measurement::getValue)
    .orElse(0.0);
  System.out.println(desc + " - " + 
                     metricName + 
                     "(" + metricKind + ")" + 
                     ": " + metricValue);
};
meterRegistry.forEachMeter(meterConsumer);
```

Here's some sample output:

```
The number of timed out calls - resilience4j.timelimiter.calls(timeout): 6.0
The number of successful calls - resilience4j.timelimiter.calls(successful): 4.0
The number of failed calls - resilience4j.timelimiter.calls(failed): 0.0
```

In a real application, we would export the data to a monitoring system periodically and analyze it on a dashboard.

## Gotchas and Good Practices When Implementing Time Limiting

Usually, we deal with two kinds of operations - queries (or reads) and commands (or writes). It is safe to time-limit queries because we know that they don't change the state of the system. The `searchFlights()` operation we saw was an example of a query operation.

Commands usually change the state of the system. A `bookFlights()` operation would be an example of a command. When time-limiting a command we have to keep in mind that the command is most likely still running when we timeout. A `TimeoutException` on a `bookFlights()` call for example doesn't necessarily mean that the command failed. 

We need to manage the user experience in such cases - perhaps on timeout, we can notify the user that the operation is taking longer than we expected. We can then query the upstream to check the status of the operation and notify the user later.

## Conclusion

In this article, we learned how we can use Resilience4j's TimeLimiter module to set a time limit on asynchronous, non-blocking operations. We learned when to use it and how to configure it with some practical examples. 

You can play around with a complete application illustrating these ideas using the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/resilience4j/timelimiter).