---
title: Timeouts with Spring Boot and Resilience4j
categories: ["Java"]
date: 2021-10-24T05:00:00
modified: 2021-10-24T05:00:00
authors: [saajan]
description: "Continuing the Resilience4j journey, this article on Spring Boot TimeLimiter shows when and how to use it to build resilient applications."
image: images/stock/0079-stopwatch-1200x628-branded.jpg
url: time-limiting-with-springboot-resilience4j
---

In this series so far, we have learned how to use the Resilience4j [Retry](https://reflectoring.io/retry-with-resilience4j/), [RateLimiter](https://reflectoring.io/rate-limiting-with-resilience4j/), [TimeLimiter](https://reflectoring.io/time-limiting-with-resilience4j/), [Bulkhead](https://reflectoring.io/bulkhead-with-resilience4j/), [Circuitbreaker](https://reflectoring.io/circuitbreaker-with-resilience4j/) core modules and also seen its Spring Boot support for the [Retry](https://reflectoring.io/retry-with-springboot-resilience4j/) and the [RateLimiter](https://reflectoring.io/rate-limiting-with-springboot-resilience4j/) modules. 

In this article, we'll focus on the TimeLimiter and see how the Spring Boot support makes it simple and more convenient to implement time limiting in our applications. 

{{% github "https://github.com/thombergs/code-examples/tree/master/resilience4j/springboot-resilience4j" %}}

## High-level Overview

If you haven't read the previous article on the TimeLimiter, check out the ["What is Time Limiting?"](https://reflectoring.io/time-limiting-with-resilience4j/#what-is-time-limiting),  ["When to Use TimeLimiter?"](https://reflectoring.io/time-limiting-with-resilience4j/#when-to-use-the-resilience4j-timelimiter), and ["Resilience4j TimeLimiter Concepts"](https://reflectoring.io/time-limiting-with-resilience4j/#resilience4j-timelimiter-concepts) sections for a quick intro.

You can find out how to set up Maven or Gradle for your project [here](https://reflectoring.io/retry-with-springboot-resilience4j/#step-1-adding-the-resilience4j-spring-boot-starter).

## Using the Spring Boot Resilience4j TimeLimiter Module

We will use the same example as the previous articles in this series. Assume that we are building a website for an airline to allow its customers to search for and book flights. Our service talks to a remote service encapsulated by the class `FlightSearchService`. 

Let's see how to use the various features available in the TimeLimiter module. **This mainly involves configuring the `TimeLimiter` instance in the `application.yml` file and adding the `@TimeLimiter` annotation on the Spring `@Service` component that invokes the remote operation.**

### Basic Example

Let's say we want to set a time limit of 2s for the flight search call. In other words, if the call doesn't complete within 2s, we want to be notified through an error.

First, we will configure the `TimeLimiter` instance in the `application.yml` file:

```yaml
resilience4j:
  instances:
    basicExample:
      timeoutDuration: 2s
```

Next, let's add the `@TimeLimiter` annotation on the method in the bean that calls the remote service:

```java
@TimeLimiter(name = "basicExample")
CompletableFuture<List<Flight>> basicExample(SearchRequest request) {
  return CompletableFuture.supplyAsync(() -> remoteSearchService.searchFlights(request));
}
```

Here, we can see that the remote operation is being invoked asynchronously, with the `basicExample()` method returning a `CompletableFuture` to its caller.

Finally, let's call the time-limited `basicExample()` method from a different bean:

```java
SearchRequest request = new SearchRequest("NYC", "LAX", "10/30/2021");
System.out.println("Calling search; current thread = " + Thread.currentThread().getName());
CompletableFuture<List<Flight>> results = service.basicExample(request);
results.whenComplete((result, ex) -> {
  if (ex != null) {
    System.out.println("Exception " +
      ex.getMessage() +
      " on thread " +
      Thread.currentThread().getName() +
      " at " +
      LocalDateTime.now().format(formatter));
  }
  if (result != null) {
    System.out.println(result + " on thread " + Thread.currentThread().getName());
  }
});

```

Here's sample output for a successful flight search that took less than the 2s `timeoutDuration` we specified:

```java
Calling search; current thread = main
Searching for flights; current time = 13:13:55 705; current thread = ForkJoinPool.commonPool-worker-3
Flight search successful at 13:13:56 716
[Flight{flightNumber='XY 765', flightDate='10/30/2021', from='NYC', to='LAX'}, ... }] on thread ForkJoinPool.commonPool-worker-3
```

The output shows that the search was called from the main thread, and executed on a different thread.

And this is sample output for a flight search that timed out:

```bash
Calling search; current thread = main
Searching for flights; current time = 13:16:03 710; current thread = ForkJoinPool.commonPool-worker-3
Exception java.util.concurrent.TimeoutException: TimeLimiter 'timeoutExample' recorded a timeout exception. on thread pool-2-thread-1 at 13:16:04 215
java.util.concurrent.CompletionException: java.util.concurrent.TimeoutException: TimeLimiter 'timeoutExample' recorded a timeout exception.
	at java.base/java.util.concurrent.CompletableFuture.encodeThrowable(CompletableFuture.java:331)
... other lines omitted ...
Flight search successful at 13:16:04 719
```

The timestamps and thread names above show that the caller got a `TimeoutException` even as the asynchronous operation finished later on a different thread.

### Specifying a Fallback Method

Sometimes we may want to take a default action when a request times out. For example, if we are not able to fetch a value from a remote service in time, we may want to return a default value or some data from a local cache.

We can do this by specifying a `fallbackMethod` in the `@TimeLimiter` annotation:

```java
@TimeLimiter(name = "fallbackExample", fallbackMethod = "localCacheFlightSearch")
CompletableFuture<List<Flight>> fallbackExample(SearchRequest request) {
  return CompletableFuture.supplyAsync(() -> remoteSearchService.searchFlights(request));
}
```

The fallback method should be defined in the same bean as the time-limiting bean. It should have the same method signature as the original method with one additional parameter - the `Exception` that caused the original one to fail:

```java
private CompletableFuture<List<Flight>> localCacheFlightSearch(SearchRequest request, TimeoutException rnp) {
  // fetch results from the cache
  return results;
}
```

Here's sample output showing the results being fetched from a cache:

```bash
Calling search; current thread = main
Searching for flights; current time = 08:58:25 461; current thread = ForkJoinPool.commonPool-worker-3
TimeLimiter 'fallbackExample' recorded a timeout exception.
Returning search results from cache
[Flight{flightNumber='XY 765', flightDate='10/30/2021', from='NYC', to='LAX'}, ... }] on thread pool-2-thread-2
Flight search successful at 08:58:26 464
```

## TimeLimiter Events

The `TimeLimiter` has an `EventPublisher` which generates events of the types `TimeLimiterOnSuccessEvent`, `TimeLimiterOnErrorEvent`, and `TimeLimiterOnTimeoutEvent`. We can listen to these events and log them, for example.

However, since we don't have a reference to the `TimeLimiter` instance when working with Spring Boot Resilience4j, this requires a little more work. The idea is still the same, but how we get a reference to the `TimeLimiterRegistry` and then the `TimeLimiter` instance itself is a bit different.

First, we `@Autowire` a `TimeLimiterRegistry` into the bean that invokes the remote operation:

```java
@Service
public class TimeLimitingService {
  @Autowired
  private FlightSearchService remoteSearchService;

  @Autowired
  private TimeLimiterRegistry timeLimiterRegistry;
  
  // other lines omitted
}
```

Then we add a `@PostConstruct` method which sets up the `onSuccess` and  `onFailure` event handlers:

```java
@PostConstruct
void postConstruct() {
  EventPublisher eventPublisher = timeLimiterRegistry.timeLimiter("eventsExample").getEventPublisher();
  
  eventPublisher.onSuccess(System.out::println);
  eventPublisher.onError(System.out::println);
  eventPublisher.onTimeout(System.out::println);
}
```

Here, we fetched the `TimeLimiter` instance by name from the `TimeLimiterRegistry` and then got the `EventPublisher` from the `TimeLimiter` instance.

Instead of the `@PostConstruct` method, we could have also done the same in the constructor of `TimeLimitingService`.

Now, the sample output shows details of the events:

```shell
Searching for flights; current time = 13:27:22 979; current thread = ForkJoinPool.commonPool-worker-9
Flight search successful
2021-10-03T13:27:22.987258: TimeLimiter 'eventsExample' recorded a successful call.
Search 3 successful, found 2 flights
Searching for flights; current time = 13:27:23 279; current thread = ForkJoinPool.commonPool-worker-7
Flight search successful
2021-10-03T13:27:23.280146: TimeLimiter 'eventsExample' recorded a successful call.
... other lines omitted ...
2021-10-03T13:27:24.290485: TimeLimiter 'eventsExample' recorded a timeout exception.
... other lines omitted ...
Searching for flights; current time = 13:27:24 334; current thread = ForkJoinPool.commonPool-worker-3
Flight search successful
```

## TimeLimiter Metrics

Spring Boot Resilience4j makes the details about the last one hundred timelimit events available through Actuator endpoints:

1. `/actuator/timelimiters`
2. `/actuator/timelimiterevents`
3. `/actuator/metrics/resilience4j.ratelimiter.waiting_threads`

Let's look at the data returned by doing a `curl` to these endpoints.

### `/timelimiters` Endpoint

This endpoint lists the names of all the time-limiter instances available:

```bash
$ curl http://localhost:8080/actuator/timelimiters
{
  "timeLimiters": [
    "basicExample",
    "eventsExample",
    "timeoutExample"
  ]
}
```

### `timelimiterevents` Endpoint

This endpoint provides details about the last 100 time limit events in the application:

```bash
$ curl http://localhost:8080/actuator/timelimiterevents
{
  "timeLimiterEvents": [
    {
      "timeLimiterName": "eventsExample",
      "type": "SUCCESS",
      "creationTime": "2021-10-07T08:19:45.958112"
    },
    {
      "timeLimiterName": "eventsExample",
      "type": "SUCCESS",
      "creationTime": "2021-10-07T08:19:46.079618"
    },
... other lines omitted ...
    {
      "timeLimiterName": "eventsExample",
      "type": "TIMEOUT",
      "creationTime": "2021-10-07T08:19:47.908422"
    },
    {
      "timeLimiterName": "eventsExample",
      "type": "TIMEOUT",
      "creationTime": "2021-10-07T08:19:47.909806"
    }
  ]
}
```

Under the `timelimiterevents` endpoint, there are two more endpoints available: `/actuator/timelimiterevents/{timelimiterName}` and `/actuator/timelimiterevents/{timeLimiterName}/{type}`. These provide similar data as the above one, but we can filter further by the `retryName` and `type` (`success`/`timeout`).

### `calls` Endpoint

This endpoint exposes the `resilience4j.timelimiter.calls` metric:

```bash
$ curl http://localhost:8080/actuator/metrics/resilience4j.timelimiter.calls
{
  "name": "resilience4j.timelimiter.calls",
  "description": "The number of successful calls",
  "baseUnit": null,
  "measurements": [
    {
      "statistic": "COUNT",
      "value": 12
    }
  ],
  "availableTags": [
    {
      "tag": "kind",
      "values": [
        "timeout",
        "successful",
        "failed"
      ]
    },
    {
      "tag": "name",
      "values": [
        "eventsExample",
        "basicExample",
        "timeoutExample"
      ]
    }
  ]
}
```

## Conclusion

In this article, we learned how we can use Resilience4j's TimeLimiter module to set a time limit on asynchronous, non-blocking operations. We learned when to use it and how to configure it with some practical examples. 

You can play around with a complete application illustrating these ideas using the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/resilience4j/timelimiter).

