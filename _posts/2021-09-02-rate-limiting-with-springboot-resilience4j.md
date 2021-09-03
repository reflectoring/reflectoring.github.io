---
title: Rate-Limiting with Spring Boot and Resilience4j
categories: [spring-boot]
date: 2021-09-02 05:00:00 +1100
modified: 2021-09-02 05:00:00 +1100
author: saajan
excerpt: "A deep dive into the Spring Boot Resilience4j RateLimiter module, this article shows why, when and how to use it to build resilient applications."
image:
  auto: 0108-speed-limit

---

In this series so far, we've learned how to use the Resilience4j [Retry](https://reflectoring.io/retry-with-resilience4j/), [RateLimiter](https://reflectoring.io/rate-limiting-with-resilience4j/), [TimeLimiter](https://reflectoring.io/time-limiting-with-resilience4j/), [Bulkhead](https://reflectoring.io/bulkhead-with-resilience4j/), [Circuitbreaker](https://reflectoring.io/circuitbreaker-with-resilience4j/) core modules and [seen](https://reflectoring.io/retry-with-springboot-resilience4j/) its Spring Boot support for the Retry module. 

In this article, we'll focus on the RateLimiter and see how the Spring Boot support makes it simple and more convenient to implement rate-limiting in our applications. 

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/resilience4j/springboot-resilience4j" %}

## High-level Overview

If you haven't read the previous article on RateLimiter, check out the ["What is Rate Limiting?"](https://reflectoring.io/rate-limiting-with-resilience4j/#what-is-rate-limiting),  ["When to Use RateLimiter?"](https://reflectoring.io/rate-limiting-with-resilience4j/#when-to-use-ratelimiter), and ["Resilience4j RateLimiter Concepts"](https://reflectoring.io/rate-limiting-with-resilience4j/#resilience4j-ratelimiter-concepts) sections for a quick intro.

You can find out how to set up Maven or Gradle for your project [here](https://reflectoring.io/retry-with-springboot-resilience4j/#step-1-adding-the-resilience4j-spring-boot-starter).

## Using the Spring Boot Resilience4j RateLimiter Module

Assume that we are building a website for an airline to allow its customers to search for and book flights. Our service talks to a remote service encapsulated by the class `FlightSearchService`. 

Let's see how to use the various features available in the RateLimiter module. **This mainly involves configuring the `RateLimiter` instance in the `application.yml` file and adding the `@RateLimiter` annotation on the Spring `@Service` component that invokes the remote operation.**

In production, we'd configure the `RateLimiter` based on our contract with the remote service. However, in these examples, we'll set the `limitForPeriod`, `limitRefreshPeriod`, and the `timeoutDuration` to low values so we can see the `RateLimiter` in action.

### Basic Example

Suppose our contract with the airline's service says that we can call their search API at 2 rps (requests per second). Then we would configure the `RateLimiter` like this:

```yaml
  ratelimiter:
    instances:
      basic:
        limitForPeriod: 2
        limitRefreshPeriod: 1s
        timeoutDuration: 1s
```

The `limitForPeriod` and `limitRefreshPeriod` configurations together determine the rate (2rps). The `timeoutDuration` configuration specifies the time we are willing to wait to acquire permission from the `RateLimiter` before erroring out.

Next, we annotate the method in the bean that calls the remote service:

```java
@RateLimiter(name = "basic")
List<Flight> basicExample(SearchRequest request) {
  return remoteSearchService.searchFlights(request);
}
```

Finally, we call the decorated method on this `@Service` from another bean (like a `@Controller`):

```java
for (int i=0; i<3; i++) {
  System.out.println(service.basicExample(request));
}
```

The timestamps in the sample output show two requests being made every second:

```shell
Searching for flights; current time = 19:51:09 777
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 19:51:09 803
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 19:51:10 096
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 19:51:10 097
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
```

If we exceed the limit, the `RateLimiter` parks the thread. If there no permits available within the 1s `timeoutDuration` we specified, we get a `RequestNotPermitted` exception:

```java
io.github.resilience4j.ratelimiter.RequestNotPermitted: RateLimiter 'timeoutExample' does not permit further calls at io.github.resilience4j.ratelimiter.RequestNotPermitted.createRequestNotPermitted(RequestNotPermitted.java:43) 
	at io.github.resilience4j.ratelimiter.RateLimiter.waitForPermission(RateLimiter.java:591)
... other lines omitted ...
```

### Applying Multiple Rate Limits

Suppose the airline's flight search had multiple rate limits: 2 rps *and* 40 rpm (requests per minute). 

Let's first configure the two `RateLimiter`s:

```yaml
ratelimiter:
  instances:
    multipleRateLimiters_rps_limiter:
      limitForPeriod: 2
      limitRefreshPeriod: 1s
      timeoutDuration: 2s

    multipleRateLimiters_rpm_limiter:
      limitForPeriod: 40
      limitRefreshPeriod: 1m
      timeoutDuration: 2s
```

Intutitively, we might think that we can annotate both these on the method that calls the remote service:

```java
@RateLimiter(name = "multipleRateLimiters_rps_limiter")
@RateLimiter(name = "multipleRateLimiters_rpm_limiter")
List<Flight> multipleRateLimitsExample2(SearchRequest request) {
  return remoteSearchService.searchFlights(request, remoteSearchService);
}
```

**However, this approach does not work. Since the `@RateLimiter` annotation is not a repeatable annotation, the compiler does not allow it to be added multiple times to the same method**:

```shell
java: io.github.resilience4j.ratelimiter.annotation.RateLimiter is not a repeatable annotation type
```

There is a feature request open for a long time in the [Resilience4j Github](https://github.com/resilience4j/resilience4j/issues/643) to add support for this kind of use case. In the future, we may have a new repeatable annotation, but how do we solve our problem in the meantime?

Let's try another approach. We'll have 2 separate methods - one for our rps `RateLimiter` and one for the rpm `RateLimiter`. 

We'll then call the rpm `@RateLimiter` annotated method from the rps `@RateLimiter` annotated one:

```java
@RateLimiter(name = "multipleRateLimiters_rps_limiter")
List<Flight> rpsLimitedSearch(SearchRequest request) {
  return rpmLimitedSearch(request, remoteSearchService);
}

@RateLimiter(name = "multipleRateLimiters_rpm_limiter")
List<Flight> rpmLimitedSearch(SearchRequest request) {
  return remoteSearchService.searchFlights(request, remoteSearchService);
}
```

**If we run this, we'll find that this approach doesn't work either.** Only the first `@RateLimiter` is applied and not the second one.

**This is because when a Spring bean calls another method defined in the same bean, the call does not go through the Spring proxy, and thus the annotation is not evaluated.** It would just be a call from one method in the target object to another one in the same object.

To get around this, let's define the `rpmRateLimitedSearch()` method in a new Spring bean:

```java
@Component
class RPMRateLimitedFlightSearchSearch {
  @RateLimiter(name = "multipleRateLimiters_rpm_limiter")
  List<Flight> searchFlights(SearchRequest request, FlightSearchService remoteSearchService) {
    return remoteSearchService.searchFlights(request);
  }
}
```

Now, we autowire this bean into the one calling the remote service:

```java
@Service
public class RateLimitingService {
  @Autowired
  private FlightSearchService remoteSearchService;

  @Autowired
  private RPMRateLimitedFlightSearchSearch rpmRateLimitedFlightSearchSearch;

  // other lines omitted
}
```

Finally, we can call one method from the other:

```java
@RateLimiter(name = "multipleRateLimiters_rps_limiter")
List<Flight> multipleRateLimitsExample(SearchRequest request) {
  return rpmRateLimitedFlightSearchSearch.searchFlights(request, remoteSearchService);
}
```

Let's call the the  `multipleRateLimitsExample()` method more than 40 times:

```java
for (int i=0; i<45; i++) {
  try {
    System.out.println(service.multipleRateLimitsExample(request));
  }
  catch (Exception e) {
    e.printStackTrace();
  }
}
```

The timestamps in the first part of the output show 2 requests being made every second:

```shell
Searching for flights; current time = 16:45:11 710
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 16:45:11 723
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 16:45:12 430
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 16:45:12 460
Flight search successful
....................... other lines omitted .......................
Searching for flights; current time = 16:45:30 431
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
io.github.resilience4j.ratelimiter.RequestNotPermitted: RateLimiter 'multipleRateLimiters_rpm_limiter' does not permit further calls
```

And the last part of the output above shows the 41st request being throttled due to the 40 rpm rate limit.

### Changing Limits at Runtime

Sometimes, we may want to change at runtime the values we configured for `limitForPeriod` and `timeoutDuration`. For example, the remote service may have specified different rate limits based on the time of day or normal hours vs. peak hours, etc.

We can do this by calling the `changeLimitForPeriod()` and `changeTimeoutDuration()` methods on the `RateLimiter`, just as we did when working with the `RateLimiter` core module.

What's different is how we obtain a reference to the `RateLimiter`. When working with Spring Boot Resilience4j, we usually only use the `@RateLimiter` annotation and don't deal with the `RateLimiter` instance itself.

First, we inject the `RateLimiterRegistry` into the bean that calls the remote service:

```java
@Service
public class RateLimitingService {
  @Autowired
  private FlightSearchService remoteSearchService;

  @Autowired
  private RateLimiterRegistry registry;
  
  // other lines omitted
}
```

Next, we add a method that fetches the `RateLimiter` by name from this registry and changes the values on it:

```java
void updateRateLimits(String rateLimiterName, int newLimitForPeriod, Duration newTimeoutDuration) {
  io.github.resilience4j.ratelimiter.RateLimiter limiter = registry.rateLimiter(rateLimiterName);
  limiter.changeLimitForPeriod(newLimitForPeriod);
  limiter.changeTimeoutDuration(newTimeoutDuration);
}
```

Now, we can change the `limitForPeriod` and  `timeoutDuration` values at runtime by calling this method from other beans:

```java
service.updateRateLimits("changeLimitsExample", 2, Duration.ofSeconds(2));
```

The sample output shows requests going through at 1 rps initially and then at 2 rps after the change:

```shell
Searching for flights; current time = 18:43:49 420
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 18:43:50 236
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 18:43:51 236
Flight search successful
... other limes omitted....
Rate limits changed
Searching for flights; current time = 18:43:56 240
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 18:43:56 241
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 18:43:57 237
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
Searching for flights; current time = 18:43:57 237
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
... other lines omitted ....
```

### Using `RateLimiter` and `Retry` Together

Let's say we want to retry the search when a `RequestNotPermitted` exception occurs since it's a transient error. 

First, we'd configure the `Retry` and `RateLimiter` instances:

```yaml
resilience4j:
  retry:
    instances:
      retryAndRateLimitExample:
        maxRetryAttempts: 2
        waitDuration: 1s

  ratelimiter:
    instances:
      limitForPeriod: 1
      limitRefreshPeriod: 1s
      timeoutDuration: 250ms
```

We can then apply both the `@Retry` and the `@RateLimiter` annotations:

```java
@Retry(name = "retryAndRateLimitExample")
@RateLimiter(name = "retryAndRateLimitExample")
public List<Flight> retryAndRateLimit(SearchRequest request) {
  return remoteSearchService.searchFlights(request);
}
```

The sample output shows the second call getting throttled and then succeeding during the retry:

```shell
Searching for flights; current time = 18:35:04 192
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
Retry 'retryAndRateLimitExample', waiting PT1S until attempt '1'. Last attempt failed with exception 'io.github.resilience4j.ratelimiter.RequestNotPermitted: RateLimiter 'retryAndRateLimitExample' does not permit further calls'.
Searching for flights; current time = 18:35:05 475
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
```

When a method has both the `@RateLimiter` and `@Retry` annotations, Spring Boot Resilience4j applies them in this order: Retry ( RateLimiter (method) ).

### Specifying a Fallback Method

Sometimes we may want to take a default action when a request gets throttled. In other words, if the thread is unable to acquire permission in time and a `RequestNotPermitted` exception occurs, we may want to return a default value or some data from a local cache.

We can do this by specifying a `fallbackMethod` in the `@RateLimiter` annotation:

```java
@RateLimiter(name = "fallbackExample", fallbackMethod = "localCacheFlightSearch")
public List<Flight> fallbackExample(SearchRequest request) {
  return remoteSearchService.searchFlights(request);
}
```

The fallback method should be defined in the same class as the rate-limiting class. It should have the same method signature as the original method with one additional parameter - the `Exception` that caused the original one to fail:

```java
private List<Flight> localCacheFlightSearch(SearchRequest request, RequestNotPermitted rnp) {
  // fetch results from the cache
  return results;
}
```

## RateLimiter Events

The `RateLimiter` has an `EventPublisher` which generates events of the types `RateLimiterOnSuccessEvent` and `RateLimiterOnFailureEvent` to indicate if acquiring permission was successful or not. We can listen to these and log them, for example.

Since we don't have a reference to the `RateLimiter` instance when working with Spring Boot Resilience4j, this requires a little more work. The idea is still the same, but how we get a reference to the `RateLimiterRegistry` and then the `RateLimiter` instance itself is a bit different.

First, we `@Autowire` a `RateLimiterRegistry` into the bean that invokes the remote operation:

```java
@Service
public class RateLimitingService {
  @Autowired
  private FlightSearchService remoteSearchService;

  @Autowired
  private RateLimiterRegistry registry;

  // other lines omitted
}
```

Then we add a `@PostConstruct` method which sets up the `onSuccess` and  `onFailure` event handlers:

```java
@PostConstruct
public void postConstruct() {
  EventPublisher eventPublisher = registry
        .rateLimiter("rateLimiterEventsExample")
        .getEventPublisher();
  
  eventPublisher.onSuccess(System.out::println);
  eventPublisher.onFailure(System.out::println);
}
```

Here, we fetched the `RateLimiter` instance by name from the `RateLimiterRegistry` and then got the `EventPublisher` from the `RateLimiter` instance.

Instead of the `@PostConstruct` method, we could have also done the same in the constructor of `RateLimitingService`.

Now, the sample output shows details of the events:

```shell
RateLimiterEvent{type=SUCCESSFUL_ACQUIRE, rateLimiterName='rateLimiterEventsExample', creationTime=2021-08-29T18:52:19.229460}
Searching for flights; current time = 18:52:19 241
Flight search successful
[Flight{flightNumber='XY 765', flightDate='08/15/2021', from='NYC', to='LAX'}, ... }]
RateLimiterEvent{type=FAILED_ACQUIRE, rateLimiterName='rateLimiterEventsExample', creationTime=2021-08-29T18:52:19.329324}
RateLimiter 'rateLimiterEventsExample' does not permit further calls
```

## Actuator Endpoints

Spring Boot Resilience4j makes the details about the last 100 rate limit events available through the Actuator endpoint `/actuator/ratelimiterevents`. Apart from this, it exposes a few other endpoints:

1. `/actuator/ratelimiters`
2. `/actuator/metrics/resilience4j.ratelimiter.available.permissions`
3. `/actuator/metrics/resilience4j.ratelimiter.waiting_threads`

Let's look at the data returned by doing a `curl` to these endpoints.

### Ratelimiters Endpoint

This endpoint lists the names of all the rate-limiter instances available:

```bash
$ curl http://localhost:8080/actuator/ratelimiters
{
  "rateLimiters": [
    "basicExample",
    "changeLimitsExample",
    "multipleRateLimiters_rpm_limiter",
    "multipleRateLimiters_rps_limiter",
    "rateLimiterEventsExample",
    "retryAndRateLimitExample",
    "timeoutExample",
    "fallbackExample"
  ]
}
```

### Permissions Endpoint

This endpoint exposes the `resilience4j.ratelimiter.available.permissions` metric:

```bash
$ curl http://localhost:8080/actuator/metrics/resilience4j.ratelimiter.available.permissions
{
  "name": "resilience4j.ratelimiter.available.permissions",
  "description": "The number of available permissions",
  "baseUnit": null,
  "measurements": [
    {
      "statistic": "VALUE",
      "value": 48
    }
  ],
  "availableTags": [
    {
      "tag": "name",
      "values": [
        "multipleRateLimiters_rps_limiter",
         ... other lines omitted ...
      ]
    }
  ]
}
```

### Waiting Threads Endpoint

This endpoint exposes the `resilience4j.ratelimiter.waiting_threads` metric:

```bash
$ curl http://localhost:8080/actuator/metrics/resilience4j.ratelimiter.available.permissions
{
  "name": "resilience4j.ratelimiter.waiting_threads",
  "description": "The number of waiting threads",
  "baseUnit": null,
  "measurements": [
    {
      "statistic": "VALUE",
      "value": 0
    }
  ],
  "availableTags": [
    {
      "tag": "name",
      "values": [
        "multipleRateLimiters_rps_limiter",
         ... other lines omitted ...
      ]
    }
  ]
}
```

## Conclusion

In this article, we learned how we can use Resilience4j RateLimiter's built-in Spring Boot support to implement client-side rate-limiting. We looked at the different ways to configure it with practical examples. 

For a deeper understanding of Resilience4j RateLimiter concepts and some good practices to follow when implementing rate-limiting in general, check out the related, previous [article](https://reflectoring.io/rate-limiting-with-resilience4j/) in this series. 

You can play around with a complete application illustrating these ideas using the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/resilience4j/springboot-resilience4j).