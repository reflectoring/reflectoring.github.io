---
title: Implementing a Circuit Breaker with Resilience4j
categories: ["Java"]
date: 2020-12-21 05:00:00 +1100
modified: 2020-12-21 05:00:00 +1100
author: saajan
excerpt: "A deep dive into the Resilience4j circuit breaker module. This article shows why, when and how to use it to build resilient applications."
image:
  auto: 0089-circuitbreaker
---

In this series so far, we have learned about Resilience4j and its [Retry](/retry-with-resilience4j/), [RateLimiter](/rate-limiting-with-resilience4j/), [TimeLimiter](/time-limiting-with-resilience4j/), and [Bulkhead](https://reflectoring.io/bulkhead-with-resilience4j/) modules. In this article, we will explore the CircuitBreaker module. We will find out when and how to use it, and also look at a few examples.

{{% github "https://github.com/thombergs/code-examples/tree/master/resilience4j/circuitbreaker" %}}

## What is Resilience4j?

Please refer to the description in the previous article for a quick intro into [how Resilience4j works in general](/retry-with-resilience4j/#what-is-resilience4j).

## What is a Circuit Breaker?

The idea of circuit breakers is to prevent calls to a remote service if we know that the call is likely to fail or time out. We do this so that we don't unnecessarily waste critical resources both in our service and in the remote service. Backing off like this also gives the remote service some time to recover.

How do we know that a call is likely to fail? By keeping track of the results of the previous requests made to the remote service. If, say, 8 out of the previous 10 calls resulted in a failure or a timeout, the next call will likely also fail. 

A circuit breaker keeps track of the responses by wrapping the call to the remote service. During normal operation, when the remote service is responding successfully, we say that the circuit breaker is in a "closed" state. When in the closed state, a circuit breaker passes the request through to the remote service normally.

When a remote service returns an error or times out, the circuit breaker increments an internal counter. If the count of errors exceeds a configured threshold, the circuit breaker switches to an "open" state. When in the open state, a circuit breaker immediately returns an error to the caller without even attempting the remote call.

After some configured time, the circuit breaker switches from open to a "half-open" state. In this state, it lets a few requests pass through to the remote service to check if it's still unavailable or slow. If the error rate or slow call rate is above the configured threshold, it switches back to the open state. If the error rate or slow call rate is below the configured threshold, however, it switches to the closed state to resume normal operation.

### Types of Circuit Breakers

A circuit breaker can be count-based or time-based. A count-based circuit breaker switches state from closed to open if the last N number of calls failed or were slow. A time-based circuit breaker switches to an open state if the responses in the last N seconds failed or were slow. In both circuit breakers, we can also specify the threshold for failure or slow calls. 

For example, we can configure a count-based circuit breaker to "open the circuit" if 70% of the last 25 calls failed or took more than 2s to complete. Similarly, we could tell a time-based circuit breaker to open the circuit if 80% of the calls in the last 30s failed or took more than 5s.

## Resilience4j `CircuitBreaker` Concepts

[resilience4j-circuitbreaker](https://resilience4j.readme.io/docs/circuitbreaker) works similarly to the other Resilience4j modules. We provide it the code we want to execute as a functional construct - a lambda expression that makes a remote call or a `Supplier` of some value which is retrieved from a remote service, etc. - and the circuit breaker decorates it with the code that keeps tracks of responses and switches states if required.

**Resilience4j supports both count-based and time-based circuit breakers.**

We specify the type of circuit breaker using the `slidingWindowType()` configuration. This configuration can take one of two values - `SlidingWindowType.COUNT_BASED` or `SlidingWindowType.TIME_BASED`.

`failureRateThreshold()` and `slowCallRateThreshold()` configure the failure rate threshold and the slow call rate in percentage. 

`slowCallDurationThreshold()` configures the time in seconds beyond which a call is considered slow.

We can specify a `minimumNumberOfCalls()` that are required before the circuit breaker can calculate the error rate or slow call rate. 

As mentioned earlier, the circuit breaker switches from the open state to the half-open state after a certain time to check how the remote service is doing. `waitDurationInOpenState()` specifies the time that the circuit breaker should wait before switching to a half-open state. 

`permittedNumberOfCallsInHalfOpenState()` configures the number of calls that will be allowed in the half-open state and `maxWaitDurationInHalfOpenState()` determines the amount of time a circuit breaker can stay in the half-open state before switching back to the open state. 

The default value of 0 for this configuration means that the circuit breaker will wait infinitely until all the` permittedNumberOfCallsInHalfOpenState()` is complete.

By default, the circuit breaker considers any `Exception` as a failure. But we can tweak this to specify a list of `Exception`s that should be treated as a failure using the `recordExceptions()` configuration and a list of `Exception`s to be ignored using the `ignoreExceptions()` configuration. 

If we want even finer control when determining if an `Exception` should be treated as a failure or ignored, we can provide a `Predicate<Throwable>` as a `recordException()` or `ignoreException()` configuration.

The circuit breaker throws a `CallNotPermittedException` when it is rejecting calls in the open state. We can control the amount of information in the stack trace of a `CallNotPermittedException` using the `writablestacktraceEnabled()` configuration.

## Using the Resilience4j `CircuitBreaker` Module

Let's see how to use the various features available in the [resilience4j-circuitbreaker](https://resilience4j.readme.io/docs/circuitbreaker) module. 

We will use the same example as the previous articles in this series. Assume that we are building a website for an airline to allow its customers to search for and book flights. Our service talks to a remote service encapsulated by the class `FlightSearchService`. 

When using the Resilience4j circuit breaker  `CircuitBreakerRegistry`, `CircuitBreakerConfig`, and `CircuitBreaker` are the main abstractions we work with.

`CircuitBreakerRegistry` is a factory for creating and managing `CircuitBreaker` objects. 

`CircuitBreakerConfig` encapsulates all the configurations from the previous section. Each `CircuitBreaker` object is associated with a `CircuitBreakerConfig`. 

The first step is to create a `CircuitBreakerConfig`:

```java
CircuitBreakerConfig config = CircuitBreakerConfig.ofDefaults();
```

This creates a `CircuitBreakerConfig` with these default values:
 
| Configuration | Default value |
| --- | ---|
| `slidingWindowType` | `COUNT_BASED` |
| `failureRateThreshold` | 50% |
| `slowCallRateThreshold` | 100% |
| `slowCallDurationThreshold` | 60s |
| `minimumNumberOfCalls` | 100 |
| `permittedNumberOfCallsInHalfOpenState` | 10 |
| `maxWaitDurationInHalfOpenState` | `0s |
 
### Count-based Circuitbreaker

Let's say we want the circuitbreaker to open if 70% of the last 10 calls failed:

```java
CircuitBreakerConfig config = CircuitBreakerConfig
  .custom()
  .slidingWindowType(SlidingWindowType.COUNT_BASED)
  .slidingWindowSize(10)
  .failureRateThreshold(70.0f)
  .build();
```

We then create a `CircuitBreaker` with this config:

```java
CircuitBreakerRegistry registry = CircuitBreakerRegistry.of(config);
CircuitBreaker circuitBreaker = registry.circuitBreaker("flightSearchService");
```

Let's now express our code to run a flight search as a `Supplier` and decorate it using the `circuitbreaker`:

```java
Supplier<List<Flight>> flightsSupplier = 
  () -> service.searchFlights(request);
Supplier<List<Flight>> decoratedFlightsSupplier = 
  circuitBreaker.decorateSupplier(flightsSupplier);
```

Finally, let's call the decorated operation a few times to understand how the circuit breaker works. We can use `CompletableFuture` to simulate concurrent flight search requests from users:

```java
for (int i=0; i<20; i++) {
  try {
    System.out.println(decoratedFlightsSupplier.get());
  }
  catch (...) {
    // Exception handling
  }
}
```

The output shows the first few flight searches succeeding followed by 7 flight search failures. At that point, the circuit breaker opens and throws `CallNotPermittedException` for subsequent calls:

```text
Searching for flights; current time = 12:01:12 884
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... ]
Searching for flights; current time = 12:01:12 954
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... ]
Searching for flights; current time = 12:01:12 957
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... ]
Searching for flights; current time = 12:01:12 958
io.reflectoring.resilience4j.circuitbreaker.exceptions.FlightServiceException: Error occurred during flight search
... stack trace omitted ...
io.github.resilience4j.circuitbreaker.CallNotPermittedException: CircuitBreaker 'flightSearchService' is OPEN and does not permit further calls
... other lines omitted ...
io.reflectoring.resilience4j.circuitbreaker.Examples.countBasedSlidingWindow_FailedCalls(Examples.java:56)
  at io.reflectoring.resilience4j.circuitbreaker.Examples.main(Examples.java:229)
```

Now, let's say we wanted the circuitbreaker to open if 70% of the last 10 calls took 2s or more to complete:

```java
CircuitBreakerConfig config = CircuitBreakerConfig
  .custom()
  .slidingWindowType(SlidingWindowType.COUNT_BASED)
  .slidingWindowSize(10)
  .slowCallRateThreshold(70.0f)
  .slowCallDurationThreshold(Duration.ofSeconds(2))
  .build();            	
```

The timestamps in the sample output show requests consistently taking 2s to complete. After 7 slow responses, the circuitbreaker opens and does not permit further calls:

```text
Searching for flights; current time = 12:26:27 901
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... ]
Searching for flights; current time = 12:26:29 953
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... ]
Searching for flights; current time = 12:26:31 957
Flight search successful
... other lines omitted ...
Searching for flights; current time = 12:26:43 966
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... ]
io.github.resilience4j.circuitbreaker.CallNotPermittedException: CircuitBreaker 'flightSearchService' is OPEN and does not permit further calls
... stack trace omitted ...
	at io.reflectoring.resilience4j.circuitbreaker.Examples.main(Examples.java:231)
io.github.resilience4j.circuitbreaker.CallNotPermittedException: CircuitBreaker 'flightSearchService' is OPEN and does not permit further calls
... stack trace omitted ...
	at io.reflectoring.resilience4j.circuitbreaker.Examples.main(Examples.java:231)
```

Usually we would configure a single circuit breaker with both failure rate and slow call rate thresholds:

```java
CircuitBreakerConfig config = CircuitBreakerConfig
  .custom()
	.slidingWindowType(SlidingWindowType.COUNT_BASED)
	.slidingWindowSize(10)
	.failureRateThreshold(70.0f)
  .slowCallRateThreshold(70.0f)
  .slowCallDurationThreshold(Duration.ofSeconds(2))
  .build();
```

### Time-based Circuitbreaker

Let's say we want the circuit breaker to open if 70% of the requests in the last 10s failed:

```java
CircuitBreakerConfig config = CircuitBreakerConfig
  .custom()
  .slidingWindowType(SlidingWindowType.TIME_BASED)
  .minimumNumberOfCalls(3)
  .slidingWindowSize(10)
  .failureRateThreshold(70.0f)
  .build();
```

We create the `CircuitBreaker`, express the flight search call as a `Supplier<List<Flight>>` and decorate it using the `CircuitBreaker` just as we did in the previous section.

Here's sample output after calling the decorated operation a few times:

```text
Start time: 18:51:01 552
Searching for flights; current time = 18:51:01 582
Flight search successful
[Flight{flightNumber='XY 765', ... }]
... other lines omitted ...
Searching for flights; current time = 18:51:01 631
io.reflectoring.resilience4j.circuitbreaker.exceptions.FlightServiceException: Error occurred during flight search
... stack trace omitted ...
Searching for flights; current time = 18:51:01 632
io.reflectoring.resilience4j.circuitbreaker.exceptions.FlightServiceException: Error occurred during flight search
... stack trace omitted ...
Searching for flights; current time = 18:51:01 633
... other lines omitted ...
io.github.resilience4j.circuitbreaker.CallNotPermittedException: CircuitBreaker 'flightSearchService' is OPEN and does not permit further calls
... other lines omitted ...
```

The first 3 requests were successful and the next 7 requests failed. At this point the circuitbreaker opened and the subsequent requests failed by throwing `CallNotPermittedException`.

Now, let's say we wanted the circuitbreaker to open if 70% of the calls in the last 10s took 1s or more to complete:

```java
CircuitBreakerConfig config = CircuitBreakerConfig
  .custom()
  .slidingWindowType(SlidingWindowType.TIME_BASED)
  .minimumNumberOfCalls(10)
  .slidingWindowSize(10)
  .slowCallRateThreshold(70.0f)
  .slowCallDurationThreshold(Duration.ofSeconds(1))
  .build();
```

The timestamps in the sample output show requests consistently taking 1s to complete. After 10 requests(`minimumNumberOfCalls`), when the circuit breaker determines that 70% of the previous requests took 1s or more, it opens the circuit:

```text
Start time: 19:06:37 957
Searching for flights; current time = 19:06:37 979
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 19:06:39 066
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 19:06:40 070
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 19:06:41 070
... other lines omitted ...
io.github.resilience4j.circuitbreaker.CallNotPermittedException: CircuitBreaker 'flightSearchService' is OPEN and does not permit further calls
... stack trace omitted ...
```

Usually we would configure a single time-based circuit breaker with both failure rate and slow call rate thresholds:

```java
CircuitBreakerConfig config = CircuitBreakerConfig
  .custom()
	.slidingWindowType(SlidingWindowType.TIME_BASED)
	.slidingWindowSize(10)
  .minimumNumberOfCalls(10)
	.failureRateThreshold(70.0f)
  .slowCallRateThreshold(70.0f)
  .slowCallDurationThreshold(Duration.ofSeconds(2))
  .build();
```

### Specifying Wait Duration in Open State

Let's say we want the circuit breaker to wait 10s when it is in open state, then transition to half-open state and let a few requests pass through to the remote service:

```java
CircuitBreakerConfig config = CircuitBreakerConfig
	.custom()
	.slidingWindowType(SlidingWindowType.COUNT_BASED)
	.slidingWindowSize(10)
	.failureRateThreshold(25.0f)
	.waitDurationInOpenState(Duration.ofSeconds(10))
	.permittedNumberOfCallsInHalfOpenState(4)
	.build();
```

The timestamps in the sample output show the circuit breaker transition to open state initially, blocking a few calls for the next 10s, and then changing to a half-open state. Later, consistent successful responses when in half-open state causes it to switch to closed state again:

```text
Searching for flights; current time = 20:55:58 735
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 20:55:59 812
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 20:56:00 816
... other lines omitted ...
io.reflectoring.resilience4j.circuitbreaker.exceptions.FlightServiceException: Flight search failed
	at 
... stack trace omitted ...	
2020-12-13T20:56:03.850115+05:30: CircuitBreaker 'flightSearchService' changed state from CLOSED to OPEN
2020-12-13T20:56:04.851700+05:30: CircuitBreaker 'flightSearchService' recorded a call which was not permitted.
2020-12-13T20:56:05.852220+05:30: CircuitBreaker 'flightSearchService' recorded a call which was not permitted.
2020-12-13T20:56:06.855338+05:30: CircuitBreaker 'flightSearchService' recorded a call which was not permitted.
... other similar lines omitted ... 
2020-12-13T20:56:12.862362+05:30: CircuitBreaker 'flightSearchService' recorded a call which was not permitted.
2020-12-13T20:56:13.865436+05:30: CircuitBreaker 'flightSearchService' changed state from OPEN to HALF_OPEN
Searching for flights; current time = 20:56:13 865
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... }]
... other similar lines omitted ...
2020-12-13T20:56:16.877230+05:30: CircuitBreaker 'flightSearchService' changed state from HALF_OPEN to CLOSED
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 20:56:17 879
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... }]
... other similar lines omitted ...
```

### Specifying a Fallback Method

A common pattern when using circuit breakers is to specify a fallback method to be called when the circuit is open. **The fallback method can provide some default value or behavior for the remote call that was not permitted**.

We can use the `Decorators` utility class for setting this up. `Decorators` is a builder from the `resilience4j-all` module with methods like `withCircuitBreaker()`, `withRetry()`, `withRateLimiter()` to help apply multiple Resilience4j decorators to a `Supplier`, `Function`, etc.

We will use its `withFallback()` method to return flight search results from a local cache when the circuit breaker is open and throws `CallNotPermittedException`:

```java
Supplier<List<Flight>> flightsSupplier = () -> service.searchFlights(request);
Supplier<List<Flight>> decorated = Decorators
  .ofSupplier(flightsSupplier)
  .withCircuitBreaker(circuitBreaker)
  .withFallback(Arrays.asList(CallNotPermittedException.class),
                e -> this.getFlightSearchResultsFromCache(request))
  .decorate();
```

Here's sample output showing search results being returned from cache after the circuit breaker opens:

```text
Searching for flights; current time = 22:08:29 735
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 22:08:29 854
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 22:08:29 855
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 22:08:29 855
2020-12-13T22:08:29.856277+05:30: CircuitBreaker 'flightSearchService' recorded an error: 'io.reflectoring.resilience4j.circuitbreaker.exceptions.FlightServiceException: Error occurred during flight search'. Elapsed time: 0 ms
Searching for flights; current time = 22:08:29 912
... other lines omitted ...
2020-12-13T22:08:29.926691+05:30: CircuitBreaker 'flightSearchService' changed state from CLOSED to OPEN
Returning flight search results from cache
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... }]
Returning flight search results from cache
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... }]
... other lines omitted ...
```

### Reducing Information in the Stacktrace

Whenever a circuit breaker is open, it throws a  `CallNotPermittedException`: 

```text
io.github.resilience4j.circuitbreaker.CallNotPermittedException: CircuitBreaker 'flightSearchService' is OPEN and does not permit further calls
	at io.github.resilience4j.circuitbreaker.CallNotPermittedException.createCallNotPermittedException(CallNotPermittedException.java:48)
... other lines in stack trace omitted ...
at io.reflectoring.resilience4j.circuitbreaker.Examples.timeBasedSlidingWindow_SlowCalls(Examples.java:169)
	at io.reflectoring.resilience4j.circuitbreaker.Examples.main(Examples.java:263)
```

Apart from the first line, the other lines in the stack trace are not adding much value. If the `CallNotPermittedException` occurs multiple times, these stack trace lines would repeat in our log files.

We can reduce the amount of information that is generated in the stack trace by setting the `writablestacktraceEnabled()` configuration to `false`:

```java
CircuitBreakerConfig config = CircuitBreakerConfig
  .custom()
  .slidingWindowType(SlidingWindowType.COUNT_BASED)
  .slidingWindowSize(10)
  .failureRateThreshold(70.0f)
  .writablestacktraceEnabled(false)
  .build();
```

Now, when a `CallNotPermittedException` occurs, only a single line is present in the stack trace:

```text
Searching for flights; current time = 20:29:24 476
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... ]
Searching for flights; current time = 20:29:24 540
Flight search successful
[Flight{flightNumber='XY 765', flightDate='12/31/2020', from='NYC', to='LAX'}, ... ]
... other lines omitted ...
io.github.resilience4j.circuitbreaker.CallNotPermittedException: CircuitBreaker 'flightSearchService' is OPEN and does not permit further calls
io.github.resilience4j.circuitbreaker.CallNotPermittedException: CircuitBreaker 'flightSearchService' is OPEN and does not permit further calls
... 
```

### Other Useful Methods

Similar to the [Retry](https://reflectoring.io/retry-with-resilience4j/#exception-based-conditional-retry) module, `CircuitBreaker` also has methods like `ignoreExceptions()`, `recordExceptions()` etc which let us specify which exceptions the `CircuitBreaker` should ignore and consider when tracking results of calls.

For example, we might not want to ignore a `SeatsUnavailableException` from the remote flight service - we don't really want to open the circuit in this case.

Also similar to the other Resilience4j modules we have seen, the `CircuitBreaker` also provides additional methods like `decorateCheckedSupplier()`, `decorateCompletionStage()`, `decorateRunnable()`, `decorateConsumer()` etc. so we can provide our code in other constructs than a `Supplier`.

## Circuitbreaker Events

`CircuitBreaker` has an `EventPublisher` which generates events of the types 

* `CircuitBreakerOnSuccessEvent`, 
* `CircuitBreakerOnErrorEvent`,  
* `CircuitBreakerOnStateTransitionEvent`,
* `CircuitBreakerOnResetEvent`,
* `CircuitBreakerOnIgnoredErrorEvent`,
* `CircuitBreakerOnCallNotPermittedEvent`,
* `CircuitBreakerOnFailureRateExceededEvent` and
* `CircuitBreakerOnSlowCallRateExceededEvent`.

We can listen for these events and log them, for example:

```java
circuitBreaker.getEventPublisher()
  .onCallNotPermitted(e -> System.out.println(e.toString()));
circuitBreaker.getEventPublisher()
  .onError(e -> System.out.println(e.toString()));
circuitBreaker.getEventPublisher()
  .onFailureRateExceeded(e -> System.out.println(e.toString()));
circuitBreaker.getEventPublisher().onStateTransition(e -> System.out.println(e.toString()));
```

The sample output shows what's logged:

```text
2020-12-13T22:25:52.972943+05:30: CircuitBreaker 'flightSearchService' recorded an error: 'io.reflectoring.resilience4j.circuitbreaker.exceptions.FlightServiceException: Error occurred during flight search'. Elapsed time: 0 ms
Searching for flights; current time = 22:25:52 973
... other lines omitted ... 
2020-12-13T22:25:52.974448+05:30: CircuitBreaker 'flightSearchService' exceeded failure rate threshold. Current failure rate: 70.0
2020-12-13T22:25:52.984300+05:30: CircuitBreaker 'flightSearchService' changed state from CLOSED to OPEN
2020-12-13T22:25:52.985057+05:30: CircuitBreaker 'flightSearchService' recorded a call which was not permitted.
... other lines omitted ... 
```

## `CircuitBreaker` Metrics

`CircuitBreaker` exposes many metrics, these are some important ones:

* Total number of successful, failed, or ignored calls (`resilience4j.circuitbreaker.calls`)
* State of the circuit breaker (`resilience4j.circuitbreaker.state`)
* Failure rate of the circuit breaker (`resilience4j.circuitbreaker.failure.rate`)
* Total number of calls that have not been permitted (`resilience4.circuitbreaker.not.permitted.calls`)
* Slow call of the circuit breaker (`resilience4j.circuitbreaker.slow.call.rate`)

First, we create `CircuitBreakerConfig`, `CircuitBreakerRegistry`, and `CircuitBreaker` as usual. Then, we create a `MeterRegistry` and bind the `CircuitBreakerRegistry` to it:

```java
MeterRegistry meterRegistry = new SimpleMeterRegistry();
TaggedCircuitBreakerMetrics.ofCircuitBreakerRegistry(registry)
  .bindTo(meterRegistry);
```

After running the circuit breaker-decorated operation a few times, we display the captured metrics. Here's some sample output:

```text
The number of slow failed calls which were slower than a certain threshold - resilience4j.circuitbreaker.slow.calls: 0.0
The states of the circuit breaker - resilience4j.circuitbreaker.state: 0.0, state: metrics_only
Total number of not permitted calls - resilience4j.circuitbreakernot.permitted.calls: 0.0
The slow call of the circuit breaker - resilience4j.circuitbreaker.slow.call.rate: -1.0
The states of the circuit breaker - resilience4j.circuitbreaker.state: 0.0, state: half_open
Total number of successful calls - resilience4j.circuitbreaker.calls: 0.0, kind: successful
The failure rate of the circuit breaker - resilience4j.circuitbreaker.failure.rate: -1.0
```

In a real application, we would export the data to a monitoring system periodically and analyze it on a dashboard.

## Conclusion

In this article, we learned how we can use Resilience4j's Circuitbreaker module to pause making requests to a remote service when it returns errors. We learned why this is important and also saw some practical examples on how to configure it.

You can play around with a complete application illustrating these ideas using the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/resilience4j/circuitbreaker).