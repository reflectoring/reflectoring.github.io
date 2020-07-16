---
title: Implementing Retry with Resilience4j
categories: [java]
date: 2020-07-09 05:00:00 +1100
modified: 2020-07-09 05:00:00 +1100
author: saajan
excerpt: "Retry is a very useful pattern to handle remote operation failures. This article is a deep dive into the Resilience4j retry module and shows why, when and how to use it to build resilient applications."
image:
  auto: 0073-broken
---

In this article, we'll start with a quick intro to Resilience4j and then deep dive into its Retry module. We'll learn when and how to use it, and what features it provides. Along the way, we'll also learn a few good practices when implementing retries.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/resilience4j/retry" %}

## What is Resilience4j?

Many things can go wrong when applications communicate over the network. **Operations can time out or fail because of broken connections, network glitches, unavailability of upstream services, etc.** Applications can overload one another, become unresponsive, or even crash. 

**Resilience4j is a Java library that helps us build resilient and fault-tolerant applications. It provides a framework for writing code to prevent and handle such issues.**

Written for Java 8 and above, Resilience4j works on constructs like functional interfaces, lambda expressions, and method references. 

Let's have a look at the modules and their purpose:

| **Module**      | Purpose                                                      |
| :-------------- | :----------------------------------------------------------- |
| **Retry**           | Automatically retry a failed remote operation                |
| **RateLimiter**     | Limit how many times we call a remote operation in a certain period |
| **TimeLimiter**     | Set a time limit when calling remote operation               |
| **Circuit Breaker** | Fail fast or perform default actions when a remote operation is continuously failing |
| **Bulkhead**        | Limit the number of concurrent remote operations             |
| **Cache**           | Store results of costly remote operations                    |

### Usage Pattern

While each module has its abstractions, here's the general usage pattern:

1. Create a Resilience4j configuration object
2. Create a Registry object for such configurations
3. Create or get a Resilience4j object from the Registry
4. Code the remote operation as a lambda expression or a functional interface or a usual Java method
5. Create a decorator or wrapper around the code from step 4 using one of the provided helper methods
6. Call the decorator method to invoke the remote operation

Steps 1-5 are usually done one time at application start. Let's look at these steps for the retry module:

```java
RetryConfig config = RetryConfig.ofDefaults(); // ----> 1
RetryRegistry registry = RetryRegistry.of(config); // ----> 2
Retry retry = registry.retry("flightSearchService", config); // ----> 3

FlightSearchService searchService = new FlightSearchService();
SearchRequest request = new SearchRequest("NYC", "LAX", "07/21/2020");
Supplier<List<Flight>> flightSearchSupplier = 
  () -> searchService.searchFlights(request); // ----> 4

Supplier<List<Flight>> retryingFlightSearch = 
  Retry.decorateSupplier(retry, flightSearchSupplier); // ----> 5

System.out.println(retryingFlightSearch.get()); // ----> 6
```

## A Short Primer on Remote Operations and Retries

**A remote operation can be any request made over the network.** Usually, it's one of these:

1. Sending an HTTP request to a REST endpoint
2. Calling a remote procedure (RPC) or a web service
3. Reading and writing data to/from a data store (SQL/NoSQL databases, object storage, etc.)
4. Sending messages to and receiving messages from a message broker (RabbitMQ/ActiveMQ/Kafka etc.)

We have two options when a remote operation fails - immediately return an error to our client, or retry the operation. If it succeeds on retry, it's great for the clients - they don't even have to know that there was a temporary issue. 

Which option to choose depends on the error type (transient or permanent), the operation (idempotent or nonidempotent), the client (person or application), and the use case.

**Transient errors are temporary and usually, the operation is likely to succeed if retried.** Requests being throttled by an upstream service, a connection drop or a timeout due to temporary unavailability of some service are examples. 

**A hardware failure or a 404 (Not Found) response from a REST API are examples of permanent errors where retrying won't help**.

**If we want to apply retries, the operation must be idempotent**. Suppose the remote service received and processed our request, but an issue occurred when sending out the response. In that case, when we retry, we don't want the service to treat the request as a new one or return an unexpected error (think money transfer in banking).

**Retries increase the response time of APIs.** This may not be an issue if the client is another application like a cron job or a daemon process. If it's a person, however, sometimes it's better to be responsive, fail quickly, and give feedback rather than making the person wait while we keep retrying. 

**For some critical use cases, reliability can be more important than response time** and we may need to implement retries even if the client is a person. Money transfer in banking or a travel agency booking flights and hotels for a trip are good examples - users expect reliability, not an instantaneous response for such use cases. We can be responsive by immediately notifying the user that we have accepted their request and letting them know once it is completed.

## Using the Resilience4j Retry Module

`RetryRegistry`, `RetryConfig`, and `Retry` are the main abstractions in [resilience4j-retry](https://resilience4j.readme.io/docs/retry). `RetryRegistry` is a factory for creating and managing `Retry` objects. `RetryConfig` encapsulates configurations like how many times retries should be attempted, how long to wait between attempts etc. Each `Retry` object is associated with a `RetryConfig`. `Retry` provides helper methods to create decorators for the functional interfaces or lambda expressions containing the remote call.

Let's see how to use the various features available in the retry module. Assume that we are building a website for an airline to allow its customers to search for and book flights. Our service talks to a remote service encapsulated by the class `FlightSearchService`. 

### Simple Retry

In a simple retry, the operation is retried if a `RuntimeException` is thrown during the remote call. We can configure the number of attempts, how long to wait between attempts etc.:

```java
RetryConfig config = RetryConfig.custom()
  .maxAttempts(3)
  .waitDuration(Duration.of(2, SECONDS))
  .build();

// Registry, Retry creation omitted

FlightSearchService service = new FlightSearchService();
SearchRequest request = new SearchRequest("NYC", "LAX", "07/31/2020");
Supplier<List<Flight>> flightSearchSupplier = 
  () -> service.searchFlights(request);

Supplier<List<Flight>> retryingFlightSearch = 
  Retry.decorateSupplier(retry, flightSearchSupplier);

System.out.println(retryingFlightSearch.get());
```

We created a `RetryConfig` specifying that we want to retry a maximum of 3 times and wait for 2s between attempts. If we used the `RetryConfig.ofDefaults()` method instead, default values of 3 attempts and 500ms wait duration would be used.

We expressed the flight search call as a lambda expression - a `Supplier` of `List<Flight>`. The `Retry.decorateSupplier()` method decorates this `Supplier` with retry functionality. Finally, we called the `get()` method on the decorated `Supplier` to make the remote call.

We would use `decorateSupplier()` if we wanted to create a decorator and re-use it at a different place in the codebase. If we want to create it and immediately execute it, we can use `executeSupplier()` instance method instead:

```java
List<Flight> flights = retry.executeSupplier(
  () -> service.searchFlights(request));
```

Here's sample output showing the first request failing and then succeeding on the second attempt:

```
Searching for flights; current time = 20:51:34 975
Operation failed
Searching for flights; current time = 20:51:36 985
Flight search successful
[Flight{flightNumber='XY 765', flightDate='07/31/2020', from='NYC', to='LAX'}, ...]
```

#### Working with Checked Exceptions

Now, suppose we want to retry for both checked and unchecked exceptions. Let's say we're calling `FlightSearchService.searchFlightsThrowingException()` which can throw a checked `Exception`. Since a `Supplier` cannot throw a checked exception, we would get a compiler error on this line:

```
Supplier<List<Flight>> flightSearchSupplier = 
  () -> service.searchFlightsThrowingException(request);
```

We might try handling the `Exception` within the lambda expression and returning `Collections.emptyList()`, but this doesn't look good. But more importantly, since we are catching  `Exception` ourselves, the retry doesn't work anymore:

```java
Supplier<List<Flight>> flightSearchSupplier = () -> {
  try {      
    return service.searchFlightsThrowingException(request);
  } catch (Exception e) {
    // don't do this, this breaks the retry!
  }
  return Collections.emptyList();
};
```

So what should we do when we want to retry for all exceptions that our remote call can throw? We can use the `Retry.decorateCheckedSupplier()` (or the `executeCheckedSupplier()` instance method) instead of `Retry.decorateSupplier()`:

```java
CheckedFunction0<List<Flight>> retryingFlightSearch = 
  Retry.decorateCheckedSupplier(retry, 
    () -> service.searchFlightsThrowingException(request));

try {
  System.out.println(retryingFlightSearch.apply());
} catch (...) {
  // handle exception that can occur after retries are exhausted
}
```

`Retry.decorateCheckedSupplier()` returns a `CheckedFunction0` which represents a function with no arguments. Notice the call to  `apply()` on the `CheckedFunction0` object to invoke the remote operation.

If we don't want to work with `Supplier`s , `Retry` provides more helper decorator methods like `decorateFunction()`, `decorateCheckedFunction()`, `decorateRunnable()`, `decorateCallable()` etc. to work with other language constructs. The difference between the `decorate*` and `decorateChecked*` versions is that the `decorate*` version retries on `RuntimeException`s and `decorateChecked*` version retries on `Exception`.

### Conditional Retry

The simple retry example above showed how to retry when we get a `RuntimeException` or a checked `Exception` when calling a remote service. In real-world applications, we may not want to retry for all exceptions. For example, if we get an `AuthenticationFailedException` retrying the same request will not help. When we make an HTTP call, we may want to check the HTTP response status code or look for a particular application error code in the response to decide if we should retry. Let's see how to implement such conditional retries.

#### Predicate-based Conditional Retry

Let's say that the airline's flight service initializes flight data in its database regularly. This internal operation takes a few seconds for a given day's flight data. If we call the flight search for that day while this initialization is in progress, the service returns a particular error code FS-167. The flight search documentation says that this is a temporary error and that the operation can be retried after a few seconds. 

Let's see how we would create the `RetryConfig`:

```java
RetryConfig config = RetryConfig.<SearchResponse>custom()
  .maxAttempts(3)
  .waitDuration(Duration.of(3, SECONDS))
  .retryOnResult(searchResponse -> searchResponse
    .getErrorCode()
    .equals("FS-167"))
  .build();
```

We use the `retryOnResult()` method and pass a `Predicate` that does this check. The logic in this `Predicate` can be as complex as we want - it could be a check against a set of error codes, or it can be some custom logic to decide if the search should be retried.

#### Exception-based Conditional Retry

Suppose we had a general exception `FlightServiceBaseException` that's thrown when anything unexpected happens during the interaction with the airline's flight service. As a general policy, we want to retry when this exception is thrown. But there is one subclass of `SeatsUnavailableException` which we don't want to retry on - if there are no seats available on the flight, retrying will not help.  We can do this by creating the `RetryConfig` like this:

```java
RetryConfig config = RetryConfig.custom()
  .maxAttempts(3)
  .waitDuration(Duration.of(3, SECONDS))
  .retryExceptions(FlightServiceBaseException.class)
  .ignoreExceptions(SeatsUnavailableException.class)
  .build();
```

In `retryExceptions()` we specify a list of exceptions. Resilience4j will retry any exception which matches or inherits from the exceptions in this list. We put the ones we want to ignore and not retry into `ignoreExceptions()`. If the code throws some other exception at runtime, say an `IOException`, it will also not be retried. 

Let's say that even for a given exception we don't want to retry in all instances. Maybe we want to retry only if the exception has a particular error code or a certain text in the exception message. We can use the `retryOnException` method in that case:

```java
Predicate<Throwable> rateLimitPredicate = rle -> 
  (rle instanceof  RateLimitExceededException) &&
  "RL-101".equals(((RateLimitExceededException) rle).getErrorCode());

RetryConfig config = RetryConfig.custom()
  .maxAttempts(3)
  .waitDuration(Duration.of(1, SECONDS))
  .retryOnException(rateLimitPredicate)
  build();
```

As in the predicate-based conditional retry, the checks within the predicate can be as complex as required. 

### Backoff Strategies

Our examples so far had a fixed wait time for the retries. Often we want to increase the wait time after each attempt - this is to give the remote service sufficient time to recover in case it is currently overloaded. We can do this using `IntervalFunction`. 

`IntervalFunction` is a functional interface - it's a `Function` that takes the attempt count as a parameter and returns the wait time in milliseconds.

#### Randomized Interval

Here we specify a random wait time between attempts:

```java
RetryConfig config = RetryConfig.custom()
  .maxAttempts(4)
  .intervalFunction(IntervalFunction.ofRandomized(2000))
  .build();
```

The `IntervalFunction.ofRandomized()` has a `randomizationFactor` associated with it. We can set this as the second parameter to `ofRandomized()`. If it's not set, it takes a default value of 0.5. This `randomizationFactor` determines the range over which the random value will be spread. So for the default of 0.5 above, the wait times generated will be between 1000ms (2000 - 2000 * 0.5) and 3000ms (2000 + 2000 * 0.5).

The sample output shows this behavior:

```
Searching for flights; current time = 20:27:08 729
Operation failed
Searching for flights; current time = 20:27:10 643
Operation failed
Searching for flights; current time = 20:27:13 204
Operation failed
Searching for flights; current time = 20:27:15 236
Flight search successful
[Flight{flightNumber='XY 765', flightDate='07/31/2020', from='NYC', to='LAX'},...]
```

#### Exponential Interval

For exponential backoff, we specify two values - an initial wait time and a multiplier. In this method, the wait time increases exponentially between attempts because of the multiplier. For example, if we specified an initial wait time of 1s and a multiplier of 2, the retries would be done after 1s, 2s, 4s, 8s, 16s, and so on. This method is a recommended approach when the client is a background job or a daemon.

Here's how we would create the `RetryConfig` for exponential backoff:

```java
RetryConfig config = RetryConfig.custom()
  .maxAttempts(6)
  .intervalFunction(IntervalFunction.ofExponentialBackoff(1000, 2))
  .build();
```

The sample output below shows this behavior:

```
Searching for flights; current time = 20:37:02 684
Operation failed
Searching for flights; current time = 20:37:03 727
Operation failed
Searching for flights; current time = 20:37:05 731
Operation failed
Searching for flights; current time = 20:37:09 731
Operation failed
Searching for flights; current time = 20:37:17 731
```

`IntervalFunction` also provides an `exponentialRandomBackoff()` method which combines both the approaches above. We can also provide custom implementations of `IntervalFunction`.

### Retrying Asynchronous Operations

The examples we saw until now were all synchronous calls. Let's see how to retry asynchronous operations. Suppose we were searching for flights asynchronously like this:

```java
CompletableFuture.supplyAsync(() -> service.searchFlights(request))
  .thenAccept(System.out::println);
```

The `searchFlight()` call happens on a different thread and when it returns, the returned `List<Flight>` is passed to `thenAccept()` which just prints it.

We can do retries for asynchronous operations like above using the `executeCompletionStage()` method on the `Retry` object. This method takes two parameters - a `ScheduledExecutorService` on which the retry will be scheduled  and a `Supplier<CompletionStage>` that will be decorated. It decorates and executes the `CompletionStage` and then returns a `CompletionStage` on which we can call `thenAccept` as before:

```java
ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

Supplier<CompletionStage<List<Flight>>> completionStageSupplier = 
  () -> CompletableFuture.supplyAsync(() -> service.searchFlights(request));

retry.executeCompletionStage(scheduler, completionStageSupplier)
.thenAccept(System.out::println);
```

In a real application, we would use a shared thread pool (`Executors.newScheduledThreadPool()`) for scheduling the retries instead of the single-threaded scheduled executor shown here. 

### Retry Events

In all these examples, the decorator has been a black box - we don't know when an attempt failed and the framework code is attempting a retry. Suppose for a given request, we wanted to log some details like the attempt count or the wait time until the next attempt. We can do that using Retry events that are published at different points of execution. `Retry` has an `EventPublisher` that has methods like `onRetry()`, `onSuccess()`, etc. 

We can collect and log details by implementing these listener methods:

```java
Retry.EventPublisher publisher = retry.getEventPublisher();
publisher.onRetry(event -> System.out.println(event.toString()));
publisher.onSuccess(event -> System.out.println(event.toString()));
```

Similarly, `RetryRegistry` also has an `EventPublisher` which publishes events when `Retry` objects are added or removed from the registry.

## Retry Metrics

`Retry` maintains counters to track how many times an operation

1. Succeeded on the first attempt
2. Succeeded after retrying 
3. Failed without retrying
4. Failed even after retrying

It updates these counters each time a decorator is executed. 

### Why Capture Metrics?

**Capturing and regularly analyzing metrics can give us insights into the behavior of upstream services. It can also help identify bottlenecks and other potential problems.** 

For example, if we find that an operation usually fails on the first attempt, we can look into the cause for this. If we find that our requests are getting throttled or that we are getting a timeout when establishing a connection, it could indicate that the remote service needs additional resources or capacity.

### How to Capture Metrics?

Resilience4j uses Micrometer to publish metrics. Micrometer provides a facade over instrumentation clients for monitoring systems like Prometheus, Azure Monitor, New Relic, etc. So we can publish the metrics to any of these systems or switch between them without changing our code.

First, we create `RetryConfig` and `RetryRegistry` and `Retry` as usual. Then, we create a `MeterRegistry` and bind the `RetryRegistry` to it:

```java
MeterRegistry meterRegistry = new SimpleMeterRegistry();
TaggedRetryMetrics.ofRetryRegistry(retryRegistry).bindTo(meterRegistry);
```

After running the retryable operation a few times, we display the captured metrics:

```java
Consumer<Meter> meterConsumer = meter -> {
    String desc = meter.getId().getDescription();
    String metricName = meter.getId().getTag("kind");
    Double metricValue = StreamSupport.stream(meter.measure().spliterator(), false)
      .filter(m -> m.getStatistic().name().equals("COUNT"))
      .findFirst()
      .map(m -> m.getValue())
      .orElse(0.0);
    System.out.println(desc + " - " + metricName + ": " + metricValue);
};
meterRegistry.forEachMeter(meterConsumer);
```

Here's some sample output:

```
The number of successful calls without a retry attempt - successful_without_retry: 4.0
The number of failed calls without a retry attempt - failed_without_retry: 0.0
The number of failed calls after a retry attempt - failed_with_retry: 0.0
The number of successful calls after a retry attempt - successful_with_retry: 6.0
```

Of course, in a real application, we would export the data to a monitoring system and view it on a dashboard.

## Gotchas and Good Practices When Retrying

**Often services provide client libraries or SDKs which have a built-in retry mechanism.** This is especially true for cloud services. For example, Azure CosmosDB and Azure Service Bus provide client libraries with a built-in retry facility. They allow applications to set retry policies to control the retry behavior.

In such cases, it's better to use the built-in retries rather than coding our own. **If we do need to write our own, we should disable the built-in default retry policy - otherwise, it could lead to nested retries where each attempt from the application causes multiple attempts from the client library.**

Some cloud services document transient error codes. Azure SQL for example, provides a list of error codes for which it expects database clients to retry. It's good to check if service providers have such lists before deciding to add retry for a particular operation. 

Another good practice is to **maintain the values we use in `RetryConfig` like maximum attempts, wait time, and retryable error codes and exceptions as a configuration outside our service**. If we discover new transient errors or we need to tweak the interval between attempts, we can make the change without building and redeploying the service.

Usually when retrying, there is likely a `Thread.sleep()` happening somewhere in the framework code. This would be the case for synchronous retries with a wait time between retries. If our code is running in the context of a web application, this `Thread` will most likely be the web server's request handling thread. **So if we do too many retries it would reduce the throughput of our application.**

## Conclusion

In this article, we learned what Resilience4j is and how we can use its retry module to make our applications resilient to temporary errors. We looked at the different ways to configure retries and some examples for deciding between the various approaches. We learned some good practices to follow when implementing retries and the importance of collecting and analyzing retry metrics.

You can play around with a complete application illustrating these ideas using the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/resilience4j/retry). 