---
title: Implementing Rate Limiting with Resilience4j
categories: [java]
date: 2020-08-05 05:00:00 +1100
modified: 2020-08-05 05:00:00 +1100
author: saajan
excerpt: "A deep dive into the Resilience4j ratelimiter module. This article shows why, when and how to use it to build resilient applications."
image:
  auto: 0051-stop
---

In the previous article in this series, we learned about Resilience4j and how to use its [Retry module](/retry-with-resilience4j/). Let's now learn about the RateLimiter - what it is, when and how to use it, and what to watch out for when implementing rate limiting (or "throttling", as it's also called).

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/resilience4j/ratelimiter" %}

## What is Resilience4j?

Please refer to the description in the previous article for a quick intro into [how Resilience4j works in general](/retry-with-resilience4j/#what-is-resilience4j).

## What is Rate Limiting?

We can look at rate limiting from two perspectives - as a service provider and as a service consumer. 

### Server-side Rate Limiting

**As a service provider, we implement rate limiting to protect our resources from overload and Denial of Service (DoS) attacks.** 

To meet our service level agreement (SLA) with all our consumers, we want to ensure that one consumer that is causing a traffic spike doesn't impact the quality of our service to others. 

We do this by setting a limit on how many requests a consumer is allowed to make in a given unit of time. We reject any requests above the limit with an appropriate response, like HTTP status 429 (Too Many Requests). This is called server-side rate limiting. 

The rate limit is specified in terms of requests per second (rps), requests per minute (rpm), or similar. Some services have multiple rate limits for different durations (50 rpm *and* not more than 2500 rph, for example) and different times of day (100 rps during the day and 150 rps at night, for example). The limit may apply to a single user (identified by user id, IP address, API access key, etc.) or a tenant in a multi-tenant application.

### Client-side Rate Limiting

**As a consumer of a service, we want to ensure that we are not overloading the service provider.** Also, we don't want to incur unexpected costs - either monetarily or in terms of quality of service.

This could happen if the service we are consuming is elastic. Instead of throttling our requests, the service provider might charge us extra for the additional load. Some even ban misbehaving clients for short periods. Rate limiting implemented by a consumer to prevent such issues is called client-side rate limiting.

## When to Use RateLimiter?

[resilience4j-ratelimiter](https://resilience4j.readme.io/docs/ratelimiter) is intended for client-side rate limiting. 

Server-side rate limiting requires things like caching and coordination between multiple server instances, which is not supported by resilience4j. For server-side rate limiting, there are API gateways and API filters like [Kong API Gateway](https://konghq.com/kong/?itm_source=website&itm_medium=nav) and [Repose API Filter](https://repose.atlassian.net/wiki/spaces/REPOSE/pages/526154/Rate+Limiting+filter).  Resilience4j's RateLimiter module is not intended to replace them.

## Resilience4j RateLimiter Concepts

A thread that wants to call a remote service first asks the RateLimiter for permission. If the RateLimiter permits it, the thread proceeds. Otherwise, the RateLimiter parks the thread or puts it in a waiting state. 

The RateLimiter creates new permissions periodically. When a permission becomes available, the thread is notified and it can then continue. 

The number of calls that are permitted during a period is called  `limitForPeriod`. How often the RateLimiter refreshes the permissions is specified by `limitRefreshPeriod`. How long a thread can wait to acquire permission is specified by `timeoutDuration`. If no permission is available at the end of the wait time, the RateLimiter throws a `RequestNotPermitted` runtime exception.

## Using the Resilience4j RateLimiter Module

`RateLimiterRegistry`, `RateLimiterConfig`, and `RateLimiter` are the main abstractions in [resilience4j-ratelimiter](https://resilience4j.readme.io/docs/ratelimiter). 

`RateLimiterRegistry` is a factory for creating and managing `RateLimiter` objects. 

`RateLimiterConfig` encapsulates the `limitForPeriod`, `limitRefreshPeriod` and `timeoutDuration` configurations. Each `RateLimiter` object is associated with a `RateLimiterConfig`. 

`RateLimiter` provides helper methods to create decorators for the functional interfaces or lambda expressions containing the remote call.

Let's see how to use the various features available in the RateLimiter module. Assume that we are building a website for an airline to allow its customers to search for and book flights. Our service talks to a remote service encapsulated by the class `FlightSearchService`. 

### Basic Example

The first step is to create a `RateLimiterConfig`:

```java
RateLimiterConfig config = RateLimiterConfig.ofDefaults();
```

This creates a `RateLimiterConfig` with default values for `limitForPeriod` (50), `limitRefreshPeriod`(500ns), and `timeoutDuration` (5s). 

Suppose our contract with the airline's service says that we can call their search API at 1 rps. Then we would create the `RateLimiterConfig` like this:

```java
RateLimiterConfig config = RateLimiterConfig.custom()
  .limitForPeriod(1)
  .limitRefreshPeriod(Duration.ofSeconds(1))
  .timeoutDuration(Duration.ofSeconds(1))
  .build();
```

If a thread is not able to acquire permission in the 1s `timeoutDuration` specified, it will error out. 

We then create a `RateLimiter` and decorate the `searchFlights()` call:

```java
RateLimiterRegistry registry = RateLimiterRegistry.of(config);
RateLimiter limiter = registry.rateLimiter("flightSearchService");
// FlightSearchService and SearchRequest creation omitted
Supplier<List<Flight>> flightsSupplier = 
  RateLimiter.decorateSupplier(limiter,
    () -> service.searchFlights(request));
```

Finally, we use  the decorated `Supplier<List<Flight>>` a few times:

```java
for (int i=0; i<3; i++) {
  System.out.println(flightsSupplier.get());
}
```

The timestamps in the sample output show one request being made every second:

```
Searching for flights; current time = 15:29:39 847
Flight search successful
[Flight{flightNumber='XY 765', ... }, ... ]
Searching for flights; current time = 15:29:40 786
...
[Flight{flightNumber='XY 765', ... }, ... ]
Searching for flights; current time = 15:29:41 791
...
[Flight{flightNumber='XY 765', ... }, ... ]
```

If we exceed the limit, we get a `RequestNotPermitted` exception:

```java
Exception in thread "main" io.github.resilience4j.ratelimiter.RequestNotPermitted: RateLimiter 'flightSearchService' does not permit further calls at io.github.resilience4j.ratelimiter.RequestNotPermitted.createRequestNotPermitted(RequestNotPermitted.java:43)       
  at io.github.resilience4j.ratelimiter.RateLimiter.waitForPermission(RateLimiter.java:580)
... other lines omitted ...
```

### Decorating Methods Throwing Checked Exceptions

Suppose we're calling `FlightSearchService.searchFlightsThrowingException()` which can throw a checked `Exception`. Then we cannot use `RateLimiter.decorateSupplier()`. We would use `RateLimiter.decorateCheckedSupplier()` instead:

```java
CheckedFunction0<List<Flight>> flights = 
  RateLimiter.decorateCheckedSupplier(limiter, 
    () -> service.searchFlightsThrowingException(request));

try {
  System.out.println(flights.apply());
} catch (...) {
  // exception handling
}
```

`RateLimiter.decorateCheckedSupplier()` returns a `CheckedFunction0` which represents a function with no arguments. Notice the call to  `apply()` on the `CheckedFunction0` object to invoke the remote operation.

If we don't want to work with `Supplier`s , `RateLimiter` provides more helper decorator methods like `decorateFunction()`, `decorateCheckedFunction()`, `decorateRunnable()`, `decorateCallable()` etc. to work with other language constructs. The `decorateChecked*` methods are used to decorate methods that throw checked exceptions.

### Applying Multiple Rate Limits

Suppose the airline's flight search had multiple rate limits: 2 rps *and* 40 rpm. We can apply multiple limits on the client-side by creating multiple `RateLimiter`s:

```java
RateLimiterConfig rpsConfig = RateLimiterConfig.custom().
  limitForPeriod(2).
  limitRefreshPeriod(Duration.ofSeconds(1)).
  timeoutDuration(Duration.ofMillis(2000)).build();

RateLimiterConfig rpmConfig = RateLimiterConfig.custom().
  limitForPeriod(40).
  limitRefreshPeriod(Duration.ofMinutes(1)).
  timeoutDuration(Duration.ofMillis(2000)).build();

RateLimiterRegistry registry = RateLimiterRegistry.of(rpsConfig);
RateLimiter rpsLimiter = 
  registry.rateLimiter("flightSearchService_rps", rpsConfig);
RateLimiter rpmLimiter = 
  registry.rateLimiter("flightSearchService_rpm", rpmConfig);        
```

We then decorate the `searchFlights()` method using both the `RateLimiter`s:

```java
Supplier<List<Flight>> rpsLimitedSupplier = 
  RateLimiter.decorateSupplier(rpsLimiter, 
    () -> service.searchFlights(request));

Supplier<List<Flight>> flightsSupplier 
  = RateLimiter.decorateSupplier(rpmLimiter, rpsLimitedSupplier);
```

The sample output shows 2 requests being made every second and being limited to 40 requests:

```
Searching for flights; current time = 15:13:21 246
...
Searching for flights; current time = 15:13:21 249
...
Searching for flights; current time = 15:13:22 212
...
Searching for flights; current time = 15:13:40 215
...
Exception in thread "main" io.github.resilience4j.ratelimiter.RequestNotPermitted: 
RateLimiter 'flightSearchService_rpm' does not permit further calls 
at io.github.resilience4j.ratelimiter.RequestNotPermitted.createRequestNotPermitted(RequestNotPermitted.java:43)
at io.github.resilience4j.ratelimiter.RateLimiter.waitForPermission(RateLimiter.java:580)
```

### Changing Limits at Runtime

If required, we can change the values for `limitForPeriod` and `timeoutDuration` at runtime:

```java
limiter.changeLimitForPeriod(2);
limiter.changeTimeoutDuration(Duration.ofSeconds(2));
```

This feature is useful if our rate limits vary based on time of day, for example - we could have a scheduled thread to change these values. The new values won't affect the threads that are currently waiting for permissions.

### Using `RateLimiter` and `Retry` Together

Let's say we want to retry if we get a `RequestNotPermitted` exception since it is a transient error. We would create `RateLimiter` and `Retry` objects as usual. We then decorate a rate-limited `Supplier` and wrap it with a `Retry`:

```java
Supplier<List<Flight>> rateLimitedFlightsSupplier = 
  RateLimiter.decorateSupplier(rateLimiter, 
    () -> service.searchFlights(request));

Supplier<List<Flight>> retryingFlightsSupplier = 
  Retry.decorateSupplier(retry, rateLimitedFlightsSupplier);
```

The sample output shows the request being retried for a `RequestNotPermitted` exception:

```
Searching for flights; current time = 17:10:09 218
...
[Flight{flightNumber='XY 765', flightDate='07/31/2020', from='NYC', to='LAX'}, ...]
2020-07-27T17:10:09.484: Retry 'rateLimitedFlightSearch', waiting PT1S until attempt '1'. Last attempt failed with exception 'io.github.resilience4j.ratelimiter.RequestNotPermitted: RateLimiter 'flightSearchService' does not permit further calls'.
Searching for flights; current time = 17:10:10 492
...
2020-07-27T17:10:10.494: Retry 'rateLimitedFlightSearch' recorded a successful retry attempt...
[Flight{flightNumber='XY 765', flightDate='07/31/2020', from='NYC', to='LAX'}, ...]
```

**The order in which we created the decorators is important**. It would not work if we wrapped the `Retry` with the `RateLimiter`.

## RateLimiter Events

`RateLimiter` has an `EventPublisher` which generates events of the types `RateLimiterOnSuccessEvent` and `RateLimiterOnFailureEvent` when calling a remote operation to indicate if acquiring a permission was successful or not. We can listen for these events and log them, for example:

```java
RateLimiter limiter = registry.rateLimiter("flightSearchService");
limiter.getEventPublisher().onSuccess(e -> System.out.println(e.toString()));
limiter.getEventPublisher().onFailure(e -> System.out.println(e.toString()));
```

The sample output shows what's logged:

```
RateLimiterEvent{type=SUCCESSFUL_ACQUIRE, rateLimiterName='flightSearchService', creationTime=2020-07-21T19:14:33.127+05:30}
... other lines omitted ...
RateLimiterEvent{type=FAILED_ACQUIRE, rateLimiterName='flightSearchService', creationTime=2020-07-21T19:14:33.186+05:30}
```

## RateLimiter Metrics

Suppose after implementing client-side throttling we find that the response times of our APIs have increased. This is possible - as we have seen, if permissions are not available when a thread invokes a remote operation, the `RateLimiter` puts the thread in a waiting state. 

If our request handling threads are often waiting to get permission, it could mean that our `limitForPeriod` is too low. Perhaps we need to work with our service provider and get additional quota provisioned first.

Monitoring `RateLimiter` metrics helps us identify such capacity issues and ensure that the values we've set on the `RateLimiterConfig` are working well.

`RateLimiter` tracks two metrics: the number of permissions available (`resilience4j.ratelimiter.available.permissions`), and the number of threads waiting for permissions (`resilience4j.ratelimiter.waiting.threads`).

First, we create `RateLimiterConfig`, `RateLimiterRegistry`, and `RateLimiter` as usual. Then, we create a `MeterRegistry` and bind the `RateLimiterRegistry` to it:

```java
MeterRegistry meterRegistry = new SimpleMeterRegistry();
TaggedRateLimiterMetrics.ofRateLimiterRegistry(registry)
  .bindTo(meterRegistry);
```

After running the rate-limited operation a few times, we display the captured metrics:

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
The number of available permissions - resilience4j.ratelimiter.available.permissions: -6.0
The number of waiting threads - resilience4j.ratelimiter.waiting_threads: 7.0
```

The negative value for `resilience4j.ratelimiter.available.permissions` shows the number of permissions that have been reserved for requesting threads. In a real application, we would export the data to a monitoring system periodically and analyze it on a dashboard.

## Gotchas and Good Practices When Implementing Client-side Rate Limiting

### Make the Rate Limiter a Singleton
**All calls to a given remote service should go through the same `RateLimiter` instance. For a given remote service the `RateLimiter` must be a singleton**. 

If we don't enforce this, some areas of our codebase may make a direct call to the remote service, bypassing the `RateLimiter`. To prevent this, the actual call to the remote service should be in a core, internal layer and other areas should use a rate-limited decorator exposed by the internal layer.

How can we ensure that a new developer understands this intent in the future? Check out Tom's article which shows one way of solving such problems by [organizing the package structure to make such intents clear](https://reflectoring.io/java-components-clean-boundaries/). Additionally, it shows how to enforce this by codifying the intent in ArchUnit tests.

### Configure the Rate Limiter for Multiple Server Instances
**Figuring out the right values for the configurations can be tricky. If we are running multiple instances of our service in a cluster, the value for `limitForPeriod` must account for this.** 

For example, if the upstream service has a rate limit of 100 rps and we have 4 instances of our service, then we would configure 25 rps as the limit on each instance. 

This assumes, however, that the load on each of our instances will be roughly the same. If that's not the case or if our service itself is elastic and the number of instances can vary, then Resilience4j's `RateLimiter` [may not be a good fit](https://github.com/resilience4j/resilience4j/issues/350). 

In that case, we would need a rate limiter that maintains its data in a distributed cache and not in-memory like Resilience4j `RateLimiter`. But that would impact the response times of our service. Another option is to implement some kind of adaptive rate limiting. While Resilience4j [may support](https://github.com/resilience4j/resilience4j/issues/201) it in the future, it is not clear when it will be available.

### Choose the Right Timeout
**For the `timeoutDuration` configuration value, we should keep the expected response times of our APIs in mind.** 

If we set the `timeoutDuration` too high, the response times and throughput will suffer. If it is too low, our error rate may increase. 

Since there could be some trial and error involved here, a good practice is to **maintain the values we use in `RateLimiterConfig` like `timeoutDuration`, `limitForPeriod`, and `limitRefreshPeriod` as a configuration outside our service**. Then we can change them without changing code.

### Tune Client-side and Server-side Rate Limiters
**Implementing client-side rate limiting does *not* guarantee that we will never get rate limited by our upstream service.** 

Suppose we had a limit of 2 rps from the upstream service and we had configured `limitForPeriod` as 2 and `limitRefreshPeriod` as 1s. If we make two requests in the last few milliseconds of the second, with no other calls until then, the  `RateLimiter` would permit them. If we make another two calls in the first few milliseconds of the next second, the `RateLimiter` would permit them too since two new permissions would be available. But the upstream service could reject these two requests since servers often implement sliding window-based rate limiting. 

To guarantee that we will never get a rate exceeded from an upstream service, we would need to configure the fixed window in the client to be shorter than the sliding window in the service. So if we had configured `limitForPeriod` as 1 and `limitRefreshPeriod` as 500ms in the previous example, we would not get a rate limit exceeded error. But then, all the three requests after the first one would wait, increasing the response times and reducing the throughput. Check out this [video](https://www.youtube.com/watch?v=m64SWl9bfvk) which talks about the problems with static rate limiting and the advantages of adaptive control.

## Conclusion

In this article, we learned how we can use Resilience4j's RateLimiter module to implement client-side rate limiting. We looked at the different ways to configure it with practical examples. We learned some good practices and things to keep in mind when implementing rate limiting.

You can play around with a complete application illustrating these ideas using the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/resilience4j/ratelimiter). 