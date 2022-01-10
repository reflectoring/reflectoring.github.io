---
title: Retry with Spring Boot and Resilience4j
categories: ["Spring Boot"]
date: 2021-07-24T05:00:00
modified: 2021-07-24T05:00:00
authors: [saajan]
excerpt: "A deep dive into the Spring Boot Resilience4j Retry module, this article shows why, when and how to use it to build resilient applications."
image: images/stock/0106-fail-1200x628-branded.jpg

---

In this series so far, we have learned how to use the Resilience4j [Retry](https://reflectoring.io/retry-with-resilience4j/), [RateLimiter](https://reflectoring.io/rate-limiting-with-resilience4j/), [TimeLimiter](https://reflectoring.io/time-limiting-with-resilience4j/), [Bulkhead](https://reflectoring.io/bulkhead-with-resilience4j/), and [Circuitbreaker](https://reflectoring.io/circuitbreaker-with-resilience4j/) core modules. We'll continue the series exploring Resilience4j's built-in support for Spring Boot applications, and in this article, we'll focus on Retry.

We will walk through many of the same examples as in the previous articles in this series and some new ones and understand how the Spring support makes Resilience4j usage more convenient.

{{% github "https://github.com/thombergs/code-examples/tree/master/resilience4j/springboot-resilience4j" %}}

## High-level Overview

On a high level, when we work with resilience4j-spring-boot2, we do the following steps:

1. Add Spring Boot Resilience4j starter as a dependency to our project
2. Configure the Reslience4j instance
3. Use the Resilience4j instance

Let's look at each of these steps briefly.

### Step 1: Adding the Resilience4j Spring Boot Starter

Adding Spring Boot Resilience4j starter to our project is like adding any other library dependency. Here's the snippet for Maven's `pom.xml`:

```xml
<dependencies>
  <dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot2</artifactId>
    <version>1.7.0</version>
  </dependency>
</dependencies>
```

In addition, we need to add dependencies to Spring Boot Actuator and Spring Boot AOP:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
  <version>2.4.1</version>
</dependency>

<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-aop</artifactId>
  <version>2.4.1</version>
</dependency>
```

If we were using Gradle, we'd add the below snippet to `build.gradle` file:

```groovy
dependencies {
  compile "io.github.resilience4j:resilience4j-spring-boot2:1.7.0"
  compile('org.springframework.boot:spring-boot-starter-actuator')
  compile('org.springframework.boot:spring-boot-starter-aop')
}
```

### Step 2: Configuring the Resilience4j Instance

We can configure the Resilience4j instances we need in Spring Boot's `application.yml` file.

```yml
resilience4j:
  retry:
    instances:
      flightSearch:
        maxRetryAttempts: 3
        waitDuration: 2s
```

Let's unpack the configuration to understand what it means.

The `resilience4j.retry` prefix indicates which module we want to use. For the other Resilience4j modules, we'd use `resilience4j.ratelimiter`, `resilience4j.timelimiter` etc.

`flightSearch` is the name of the retry instance we're configuring. We will be referring to the instance by this name in the next step when we use it.

`maxRetryAttempts` and `waitDuration` are the actual module configurations. These correspond to the available configurations in the corresponding `Config` class, such as `RetryConfig`.

Alternatively, we could configure these properties in the `application.properties` file.

### Step 3: Using the Resilience4j Instance

Finally, we use the Resilience4j instance that we configured above. We do this by annotating the method we want to add retry functionality to:

```java
@Retry(name = "flightSearch")
public List<Flight> searchFlights(SearchRequest request) {
    return remoteSearchService.searchFlights(request);
}
```

For the other Resilience4j modules, we'd use annotations `@RateLimiter`, `@Bulkhead`, `@CircuitBreaker`, etc.

### Comparing with Plain Resilience4J

Spring Boot Resilience4j lets us easily use the Resilience4j modules in a standard, idiomatic way. 

We don't have to create Resilience4j configuration object (`RetryConfig`), Registry  object (`RetryRegsitry`), etc. as we did in the previous articles in this series. All that is handled by the framework based on the configurations we provide in the `application.yml` file.

We also don't need to write code to invoke the operation as a lambda expression or a functional interface. We just need to annotate the method to which we want the resilience pattern to be applied.

## Using the Spring Boot Resilience4j Retry Module

Assume that we are building a website for an airline to allow its customers to search for and book flights. Our service talks to a remote service encapsulated by the class `FlightSearchService`. 

### Simple Retry

In a simple retry, the operation is retried if a `RuntimeException` is thrown during the remote call. We can configure the number of attempts, how long to wait between attempts etc.

The example we saw in the previous section was for a simple retry.

Here's sample output showing the first request failing and then succeeding on the second attempt:

```text
Searching for flights; current time = 15:46:42 399
Operation failed
Searching for flights; current time = 15:46:44 413
Flight search successful
[Flight{flightNumber='XY 765', flightDate='07/31/2021', from='NYC', to='LAX'}, ... }]
```

### Retrying on Checked Exceptions

Let's say we're calling `FlightSearchService.searchFlightsThrowingException()` which can throw a checked `Exception`. 

Let's configure a retry instance called `throwingException`:

```yml
resilience4j:
  retry:
    instances:
      throwingException:
        maxRetryAttempts: 3
        waitDuration: 2s
        retryExceptions:
          - java.lang.Exception
```

If there were other `Exception`s we wanted to configure, we would add them to the list of `retryExceptions`.  Similarly, we could also specify `ignoreExceptions` on the retry instance.

Next, we annotate the method that calls the remote service:

```java
@Retry(name = "throwingException")
public List<Flight> searchFlightsThrowingException(SearchRequest request) throws Exception {
   return remoteSearchService.searchFlightsThrowingException(request);
}

```

Here's sample output showing the first two requests failing and then succeeding on the third attempt:

```text
Searching for flights; current time = 11:41:12 908
Operation failed, exception occurred
Searching for flights; current time = 11:41:14 924
Operation failed, exception occurred
Searching for flights; current time = 11:41:16 926
Flight search successful
[Flight{flightNumber='XY 765', flightDate='07/31/2021', from='NYC', to='LAX'}, ... }]
```

### Conditional Retry

In real-world applications, we may not want to retry for all exceptions. We may want to check the HTTP response status code or look for a particular application error code in the response to decide if we should retry. Let's see how to implement such conditional retries.

Let's say that the airline's flight service initializes flight data in its database regularly. This internal operation takes a few seconds for a given day's flight data. If we call the flight search for that day while this initialization is in progress, the service returns a particular error code FS-167. The flight search documentation says that this is a temporary error and that the operation can be retried after a few seconds. 

First, we define a `Predicate` that tests for this condition:

```java
ConditionalRetryPredicate implements Predicate<SearchResponse> {
  @Override
  public boolean test(SearchResponse searchResponse) {
    if (searchResponse.getErrorCode() != null) {
      return searchResponse.getErrorCode().equals("FS-167");
    }
    return false;
  }
}
```

The logic in this `Predicate` can be as complex as we want - it could be a check against a set of error codes, or it can be some custom logic to decide if the search should be retried.

We then specify this `Predicate` when configuring the retry instance:

```yml
resilience4j:
  retry:
    instances:
      predicateExample:
        maxRetryAttempts: 3
        waitDuration: 3s
        resultPredicate: io.reflectoring.resilience4j.springboot.predicates.ConditionalRetryPredicate
```

The sample output shows sample output showing the first request failing and then succeeding on the next attempt:

```text
Searching for flights; current time = 12:15:11 212
Operation failed
Flight data initialization in progress, cannot search at this time
Search returned error code = FS-167
Searching for flights; current time = 12:15:14 224
Flight search successful
[Flight{flightNumber='XY 765', flightDate='01/25/2021', from='NYC', to='LAX'}, ...}]
```

### Backoff Strategies

Our examples so far had a fixed wait time for the retries. Often we want to increase the wait time after each attempt - this is to give the remote service sufficient time to recover in case it is currently overloaded. 

#### Randomized Interval

Here we specify a random wait time between attempts:

```yml
resilience4j:
  retry:
  instances:
    intervalFunctionRandomExample:
      maxRetryAttempts: 3
      waitDuration: 2s
      enableRandomizedWait: true
      randomizedWaitFactor: 0.5
```

The `randomizedWaitFactor` determines the range over which the random value will be spread with regard to the specifiied `waitDuration`. So for the value of 0.5 above, the wait times generated will be between 1000ms (2000 - 2000 * 0.5) and 3000ms (2000 + 2000 * 0.5).

The sample output shows this behavior:

```text
Searching for flights; current time = 14:32:48 804
Operation failed
Searching for flights; current time = 14:32:50 450
Operation failed
Searching for flights; current time = 14:32:53 238
Flight search successful
[Flight{flightNumber='XY 765', flightDate='07/31/2021', from='NYC', to='LAX'}, ... }]
```

#### Exponential Interval

For exponential backoff, we specify two values - an initial wait time and a multiplier. In this method, the wait time increases exponentially between attempts because of the multiplier. For example, if we specified an initial wait time of 1s and a multiplier of 2, the retries would be done after 1s, 2s, 4s, 8s, 16s, and so on. This method is a recommended approach when the client is a background job or a daemon.

Let's configure the retry instance for exponential backoff:

```yml
resilience4j:
  retry:
    instances:
      intervalFunctionExponentialExample:
        maxRetryAttempts: 6
        waitDuration: 1s
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
```

The sample output below shows this behavior:

```text
Searching for flights; current time = 14:49:45 706
Operation failed
Searching for flights; current time = 14:49:46 736
Operation failed
Searching for flights; current time = 14:49:48 741
Operation failed
Searching for flights; current time = 14:49:52 745
Operation failed
Searching for flights; current time = 14:50:00 745
Operation failed
Searching for flights; current time = 14:50:16 748
Flight search successful
[Flight{flightNumber='XY 765', flightDate='07/31/2021', from='NYC', to='LAX'}, ... }]
```

### Acting on Retry Events

In all these examples, the decorator has been a black box - we don't know when an attempt failed and the framework code is attempting a retry. Suppose for a given request, we wanted to log some details like the attempt count or the wait time until the next attempt. 

If we were using the Resilience4j core modules directly, we could have done this easily using the `Retry.EventPublisher`. We would have listened to the events published by the `Retry` instance. 

Since we don't have a reference to the `Retry` instance or the `RetryRegistry` when working with Spring Boot Resilience4j, this requires a little more work. The idea is still the same, but how we get a reference to the `RetryRegistry` and `Retry` instances is a bit different.

First, we `@Autowire` a `RetryRegistry` into our retrying service which is the service that invokes the remote operations:

```java
@Service
public class RetryingService {
  @Autowired
  private FlightSearchService remoteSearchService;

  @Autowired
  private RetryRegistry registry;
  
  // other lines omitted
 }
```

Then we add a `@PostConstruct` method which sets up the `onRetry` event handler:

```java
@PostConstruct
public void postConstruct() {
    registry
        .retry("loggedRetryExample")
        .getEventPublisher()
        .onRetry(System.out::println);
}
```

We fetch the `Retry` instance by name from the `RetryRegistry` and then get the `EventPublisher` from the `Retry` instance.

Instead of the `@PostConstruct` method, we could have also done the same in the constructor of `RetryingService`.

Now, the sample output shows details of the retry event:

```text
Searching for flights; current time = 18:03:07 198
Operation failed
2021-07-20T18:03:07.203944: Retry 'loggedRetryExample', waiting PT2S until attempt '1'. Last attempt failed with exception 'java.lang.RuntimeException: Operation failed'.
Searching for flights; current time = 18:03:09 212
Operation failed
2021-07-20T18:03:09.212945: Retry 'loggedRetryExample', waiting PT2S until attempt '2'. Last attempt failed with exception 'java.lang.RuntimeException: Operation failed'.
Searching for flights; current time = 18:03:11 213
Flight search successful
[Flight{flightNumber='XY 765', flightDate='07/31/2021', from='NYC', to='LAX'}, ... }]
```

### Fallback Method

Sometimes we may want to take a default action when all the retry attempts to the remote operation fail. This could be returning a default value or returning some data from a local cache.

We can do this by specifying a `fallbackMethod` in the `@Retry` annotation:

```java
@Retry(name = "retryWithFallback", fallbackMethod = "localCacheFlightSearch")
public List<Flight> fallbackExample(SearchRequest request) {
	return remoteSearchService.searchFlights(request);
}
```

The fallback method should be defined in the same class as the retrying class. It should have the same method signature as the retrying method with one additional parameter - the `Exception` that caused the retry to fail:

```java
private List<Flight> localCacheFlightSearch(SearchRequest request, RuntimeException re) {
    System.out.println("Returning search results from cache");
 		// fetch results from the cache
    return results;
 }
```

## Actuator Endpoints

Spring Boot Resilience4j makes the retry metrics and the details about the last 100 retry events available through Actuator endpoints:

1. `/actuator/retries`
2. `/actuator/retryevents`
3. `/actuator/metrics/resilience4j.retry.calls`

Let's look at the data returned by doing a `curl` to these endpoints.

### Endpoint `/actuator/retries`

This endpoint lists the names of all the retry instances available:

```bash
$ curl http://localhost:8080/actuator/retries
{
  "retries": [
    "basic",
    "intervalFunctionExponentialExample",
    "intervalFunctionRandomExample",
    "loggedRetryExample",
    "predicateExample",
    "throwingException",
    "retryWithFallback"
  ]
}
```

### Endpoint `/actuator/retryevents`

This endpoint provides details about the last 100 retry events in the application:

```bash
$ curl http://localhost:8080/actuator/retryevents
{
  "retryEvents": [
    {
      "retryName": "basic",
      "type": "RETRY",
      "creationTime": "2021-07-21T11:04:07.728933",
      "errorMessage": "java.lang.RuntimeException: Operation failed",
      "numberOfAttempts": 1
    },
    {
      "retryName": "basic",
      "type": "SUCCESS",
      "creationTime": "2021-07-21T11:04:09.741841",
      "errorMessage": "java.lang.RuntimeException: Operation failed",
      "numberOfAttempts": 1
    },
    {
      "retryName": "throwingException",
      "type": "RETRY",
      "creationTime": "2021-07-21T11:04:09.753174",
      "errorMessage": "java.lang.Exception: Operation failed",
      "numberOfAttempts": 1
    },
    ... other lines omitted ...
 }
```

Under the `retryevents` endpoint, there are two more endpoints available: `/actuator/retryevents/{retryName}` and `/actuator/retryevents/{retryName}/{type}`. These provide similar data as the above one, but we can filter further by the `retryName` and `type` (`success`/`error`/`retry`).

### Endpoint `/actuator/metrics/resilience4j.retry.calls`

This endpoint exposes the retry-related metrics:

```bash
$ curl http://localhost:8080/actuator/metrics/resilience4j.retry.calls
{
  "name": "resilience4j.retry.calls",
  "description": "The number of failed calls after a retry attempt",
  "baseUnit": null,
  "measurements": [
    {
      "statistic": "COUNT",
      "value": 6
    }
  ],
  "availableTags": [
    {
      "tag": "kind",
      "values": [
        "successful_without_retry",
        "successful_with_retry",
        "failed_with_retry",
        "failed_without_retry"
      ]
    },
    {
      "tag": "name",
      "values": [
        ... list of retry instances ...
      ]
    }
  ]
}
```

## Conclusion

In this article, we learned how we can use Resilience4j Retry's built-in Spring Boot support to make our applications resilient to temporary errors. We looked at the different ways to configure retries and some examples for deciding between the various approaches. 

For a deeper understanding of Resilience4j Retry concepts and some good practices to follow when implementing retries in general, check out the related, previous [article](https://reflectoring.io/retry-with-resilience4j/) in this series.

You can play around with a complete application illustrating these ideas using the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/resilience4j/springboot-resilience4j).
