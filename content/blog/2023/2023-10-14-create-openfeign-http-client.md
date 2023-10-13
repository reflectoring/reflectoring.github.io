---
authors: [sagaofsilence]
title: "Create an HTTP Client with OpenFeign"
categories: ["Java"]
date: 2023-10-14 00:00:00 +0530
excerpt: "Feign is an HTTP client that allows us to easily make web requests. With its simplified and fluent API, it makes consuming RESTful services a breeze."
image: images/stock/0125-tools-1200x628-branded.jpg
url: create-openfeign-http-client
---

Feign is an open-source Java library that simplifies the process of making web requests. It streamlines the implementation of RESTful web services by providing a higher-level abstraction. Feign eliminates the need for boilerplate code, which makes the codebase more readable and maintainable.

## What is Feign?
Feign is a popular Java HTTP client library that offers several advantages and features, making it a good choice for developers building HTTP-based microservices and applications.

### What is a declarative HTTP client?
It's a way to make HTTP requests by writing a Java interface. Feign generates the actual implementation behind that interface based on annotations that we provide.

### Why use Feign?
If we have a large set of APIs to call, we don't want to generate the HTTP code by hand or with hard-to-maintain code generation. It would be much easier and more maintainable to describe the API in a simple, small interface and let Feign interpret and implement that interface at runtime.

### Who should use Feign?
If we are making HTTP requests in our Java code, and don't want to write boilerplate code, or use libraries like Apache httpclient directly, Feign is a great choice.

<a name="example-code" />
{{% github "https://github.com/thombergs/code-examples/tree/master/openfeign/openfeign-client-intro" %}}

## Creating a Basic Feign Client
### Step 1: Add Feign Dependency
Include Feign library in the Maven `pom.xml` file as a dependency.
```xml
<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-core</artifactId>
    <version>12.5</version>
</dependency>
```
### Step 2: Define the Client Interface
**It typically contains the method declarations annotated with Feign annotations.**

We are going to declare a client interface with a method for each REST endpoint we want to call on a server. These are just declarations. We do not implement those methods. Feign will do that for us. **The method signatures should include the HTTP method as well as all required data.**

Let us define an interface to represent calculator service. It has a simple API methods to perform calculations like add, substract, multiply and divide:
    
```java
public interface CalculatorService {
  /**
   * Adds two whole numbers.
   *
   * @param firstNumber  first whole number
   * @param secondNumber second whole number
   * @return sum of two numbers
   */
  @RequestLine("POST /operations/add?"
          + "firstNumber={firstNumber}&secondNumber={secondNumber}")
  Long add(@Param("firstNumber") Long firstNumber, 
           @Param("secondNumber") Long secondNumber);

  /**
   * Subtracts two whole numbers.
   *
   * @param firstNumber  first whole number
   * @param secondNumber second whole number
   * @return subtraction of two numbers
   */
  @RequestLine("POST /operations/subtract?"
          + "firstNumber={firstNumber}&secondNumber={secondNumber}")
  Long subtract(@Param("firstNumber") Long firstNumber, 
                @Param("secondNumber") Long secondNumber);

  /**
   * Multiplies two whole numbers.
   *
   * @param firstNumber  first whole number
   * @param secondNumber second whole number
   * @return multiplication of two numbers
   */
  @RequestLine("POST /operations/multiply?"
          + "firstNumber={firstNumber}&secondNumber={secondNumber}")
  Long multiply(@Param("firstNumber") Long firstNumber, 
                @Param("secondNumber") Long secondNumber);

  /**
   * Divides two whole numbers.
   *
   * @param firstNumber  first whole number
   * @param secondNumber second whole number, should not be zero
   * @return division of two numbers
   */
  @RequestLine("POST /operations/divide?"
          + "firstNumber={firstNumber}&secondNumber={secondNumber}")
  Long divide(@Param("firstNumber") Long firstNumber, 
              @Param("secondNumber") Long secondNumber);
}
```
`@RequestLine` defines the `HttpMethod` and `UriTemplate` for request. And `@Param` defines a template variable. Do not worry.  We will learn more about the [annotations provided by OpenFeign](#getting-familiar-with-annotations) later.

### Step 3: Create a Client Object
We use Feign's `builder()` method to prepare the client:
    
```java
final CalculatorService target = Feign
        .builder()
        .decoder(new JacksonDecoder())
        .target(CalculatorService.class, HOST);
```    
There are many ways to prepare the client depending on our needs. The code snippet given above is just one of the simple ways to prepare the client. We have registered the decoder used to decode the JSON responses. The decoder can be changed to match the content type of the response returned by the service. We will learn more about [decoders](#integrating-encoderdecoder) later.

### Step 4: Use the Client to for API Calls
Now let us call the `add()` method of our client:
```java
final Long result = target.add(firstNumber, secondNumber);
```
We notice that calling service with Feign HTTP client is fairly simple compared to other [HTTP clients](https://reflectoring.io/comparison-of-java-http-clients/).

You can see it in action by running the `givenTwoNumbersReturnAddition()` unit test in the example code shared on [Github](https://github.com/thombergs/code-examples/blob/master/openfeign/openfeign-client-intro/src/test/java/io/reflectoring/openfeign/services/CalculatorServiceTest.java#L37).

{{% info title="Notes on Testing" %}}
We would use Wiremock to emulate the service implementation. [WireMock](https://wiremock.org/) is a web service mocking and stubbing tool. It works by emulating a real HTTP server to which the test code can connect as if it were a real online service. It allows for HTTP response stubbing, request verification, proxy/interception, stub recording/playback, and fault injection.

It is particularly useful to emulate error scenarios that are difficult to achieve with real service implementation. With these emulated interactions we rest assured that when such errors occur, our client error handling logic works as expected.
{{% /info %}}

## Feign Annotations
OpenFeign uses a set of annotations for defining HTTP requests and their parameters. Here's a table of commonly used OpenFeign annotations with examples:

| Annotation | Description | Example |
| --- | --- | --- |
| `@RequestLine` | Specifies the HTTP method and path. | `@RequestLine("GET /resource/{id}")` |
|`@Headers`|Specifies HTTP headers for the request.|`@Headers("Authorization: Bearer {token}")`|
|`@QueryMap`|Maps a Map of query parameters to the request.|`@QueryMap Map<String, Object> queryParams`|
|`@Body`|Sends a specific object as the request body.|`@Body RequestObject requestObject`|
|`@Param`|Adds a query parameter to the request.|`@Param("id") long resourceId`|
|`@Path`|Replaces a template variable in the path.|`@Path("id") long resourceId`|
|`@RequestHeader`|Adds a header to the request.|`@RequestHeader("Authorization") String authToken`|
|`@Headers`|Specifies additional headers for the request.|`@Headers("Accept: application/json")`|

**These annotations allow us to define and customize OpenFeign client interface, making it easy to interact with remote services using OpenFeign. us can mix and match these annotations based on our specific API requirements.**

## Handling Responses
Feign also provides a declarative approach to API integration. Instead of manually writing boilerplate code for handling response or error, Feign allows us to define custom handlers and register those with Fiegn builder. This not only reduces the amount of code we need to write but also improves readability and maintainability.

Let us see a `decoder` example:
```java
final CalculatorService target = Feign.builder()
    .encoder(new JacksonEncoder())
    .decoder(new JacksonDecoder())
    .target(CalculatorService.class, HOST);
```
This given code snippet demonstrates the creation of a Feign client for using Jackson for both request encoding and response decoding.
Let's break down what these lines do:

`.encoder(new JacksonEncoder())`: Here, a `JacksonEncoder` is set for the Feign client. `JacksonEncoder` is part of the Feign Jackson module and is used to encode Java objects into JSON format for the HTTP request body. This is particularly useful when you need to send objects in the request body.

`.decoder(new JacksonDecoder())`: Similarly, a `JacksonDecoder` is set for the Feign client. `JacksonDecoder` is responsible for decoding JSON responses from the server into Java objects. It deserializes the JSON response into the corresponding Java objects.

## Handling Errors
Error handling is a crucial aspect of building robust and reliable applications, especially when it comes to making remote API calls. Feign offers powerful features that can assist in effectively handling errors.

**Feign gives us more control over handling unexpected responses. We can register a custom ErrorDecoder via the builder.**
    
```java
final CalculatorService target = Feign.builder()
    .errorDecoder(new CalculatorErrorDecoder())
    .target(CalculatorService.class, HOST);
```

Here is an example to show error handling:
```java
public class CalculatorErrorDecoder implements ErrorDecoder {
  private final ErrorDecoder defaultErrorDecoder = new Default();

  @Override
  public Exception decode(String methodKey, Response response) {
    ExceptionMessage message = null;
    try (InputStream bodyIs = response.body().asInputStream()) {
      ObjectMapper mapper = new ObjectMapper();
      message = mapper.readValue(bodyIs, ExceptionMessage.class);
    } catch (IOException e) {
      return new Exception(e.getMessage());
    }
    final String messageStr = message == null ? "" : message.getMessage();
    switch (response.status()) {
      case 400:
        return new RuntimeException(messageStr.isEmpty() 
                ? "Bad Request" 
                : messageStr
        );
      case 401:
        return new RetryableException(response.status(),
          response.reason(),
          response.request().httpMethod(),
          null,
          response.request());
      case 404:
        return new RuntimeException(messageStr.isEmpty() 
                ? "Not found" 
                : messageStr
        );
      default:
        return defaultErrorDecoder.decode(methodKey, response);
    }
  }
}
```
All responses with HTTP status other than `HTTP 2xx` range, for example `HTTP 400`, will trigger the ErrorDecoder's `decode()` method. 
In this overridden `decode()` method, we can handle the response, wrap the failure into a custom exception or perform any additional processing.


We can even retry the request again by throwing a `RetryableException`. 
This will invoke the registered `Retryer`. [Retryer](#configuring-retryer) is explained in detail in the advanced techniques.

You can see it in action by running `givenNegativeDivisorDivisionReturnsError()` test in the example code shared on [Github](https://github.com/thombergs/code-examples/blob/master/openfeign/openfeign-client-intro/src/test/java/io/reflectoring/openfeign/services/CalculatorServiceTest.java#L56C10-L56C50).

## Advanced Techniques

### Integrating Encoder/Decoder
Encoder and decoder are **used to encode/decode the request and response data respectively**. We select these depending on the content type of the request and response. For example, [Gson](https://github.com/OpenFeign/feign/blob/master/gson) or [Jackson](https://github.com/OpenFeign/feign/blob/master/jackson)
 can be used for JSON data.

Here is an example showing how to use `Jackson` encoder and decoder.
```java
final CalculatorService target = Feign.builder()
  .encoder(new JacksonEncoder())
  .decoder(new JacksonDecoder())
  .target(CalculatorService.class, HOST);

```

### Changing HTTP Client
By default, it uses Feign HTTP client. The motivation behind changing the default HTTP client of Feign, from the original Apache HTTP Client to other libraries like OkHttp, is primarily driven by the need for **better performance, improved features, and enhanced compatibility with modern HTTP standards**.

Now let us see how to override the HTTP client.
```java
final CalculatorService target = Feign.builder()
  .client(new OkHttpClient())
  .target(CalculatorService.class, HOST);

```

### Configuring a Logger
[SLF4JModule](https://github.com/OpenFeign/feign/blob/master/slf4j) is used to send Feign's logging to [SLF4J](http://www.slf4j.org/). With SLF4J, we can easily use a logging backend of our choice (Logback, Log4J, etc.)

Here is an example about building the client:
```java
final CalculatorService target = Feign.builder()
  .logger(new Slf4jLogger())
  .logLevel(Level.FULL)
  .target(CalculatorService.class, HOST);

```
To use SLF4J with Feign, add both the SLF4J module and an SLF4J binding of our choice to the classpath. 
Then, configure Feign to use the Slf4jLogger as shown above.

### Configuring Request Interceptors
Request Interceptors in Feign allow us to **customize and manipulate HTTP requests before they are sent to the remote server**. They are useful for a variety of purposes, such as adding custom headers, logging, authentication, or request modification.

Here's why we might want to use Request Interceptors in Feign:
1. **Authentication**: We can use a Request Interceptor **to add authentication tokens or credentials to every request**. For example, adding an "Authorization" header with a JWT token.

1. **Logging**: Interceptors are helpful **for logging incoming and outgoing requests and responses. This can be useful for debugging and monitoring**.

1. **Request Modification**: We can **modify the request before it's sent**. This includes changing **headers, query parameters, or even the request body**.

1. **Rate Limiting**: Implementing rate limiting by inspecting the number of requests being made and deciding whether to **allow or block a request**.

1. **Caching**: Caching request/response data based on specific criteria.

Here is a code snippet to demonstrate how to use request interception:
```java
static class AuthorizationInterceptor implements RequestInterceptor {
  @Override public void apply(RequestTemplate template) {
    // Check if token is present, if not, add it
    template.header("Authorization", "Bearer " + generatedToken);
  }
}

public class CalculatorServiceTest {
  public static void main(String[] args) {
    final interceptor = new AuthorizationInterceptor();
    final CalculatorService target = Feign.builder()
      .requestInterceptor(interceptor)
      .target(CalculatorService.class, HOST);
  }
}

```
Implement `RequestInterceptor` and override its `apply()` method to do any modifications on the request that you require.

### Configuring Retryer
OpenFeign Retryer is a component that allows us to configure how Feign handles retries when a request fails. It can be particularly useful for handling transient failures in network communications. We can specify conditions under which Feign should automatically retry a failed request.

#### Retryer Configuration
To use a Retryer in OpenFeign, provide an implementation of the Retryer interface. The Retryer interface has two methods:

1. `boolean continueOrPropagate(int attemptedRetries, int responseStatus, Request request)`: This method is called to determine whether to continue with the retry or propagate the error. It takes the number of attempted retries, the HTTP response status, and the request as parameters and returns true to continue with the retry or false to propagate the error.

1. `Retryer clone()`: This method creates a clone of the Retryer instance.

#### Default Retryer
Feign provides a default retryer implementation called `Retryer.Default`. This default retryer is used when we create a Feign client without explicitly specifying a custom retryer. 

It provided two factory methods to create a `Retryer` object.


The first factory method doesn't require any parameters:
```java
public Default() {
    this(100L, TimeUnit.SECONDS.toMillis(1L), 5);
}
```

It defines a simple retry strategy with the following characteristics:

- **Max Attempts**: It allows a maximum of 5 retry attempts for failed requests.

- **Backoff Period**: It uses an exponential backoff strategy between retries, starting with a backoff of 100 milliseconds and doubling the backoff time with each subsequent retry.

- **Retryable Exceptions**: It retries requests if they result in any exceptions that are considered retryable. These typically include network-related exceptions like connection timeouts or socket exceptions.

The second factory methods requires some parameters. We can use it if the default configuration is not suitable for us.
```java
public Default(long period, long maxPeriod, int maxAttempts)

// use it to create retryer
new Retryer.Default(1, 100, 10);
```

While the default retryer provided by Feign covers many common retry scenarios, there are situations where we might want to define a custom retryer. Here are some motivations for defining a custom retryer:

1. **Fine-Grained Control**: If we need **more control over the default retry behavior**, such as specifying a different maximum number of retry attempts or a custom backoff strategy, a custom retryer allows is to tailor the behavior to our specific requirements.

1. **Retry Logic**: In some cases, we might want to **retry requests only for specific response codes or exceptions**. A custom retryer lets us implement our own logic for determining when a retry should occur.

1. **Logging and Metrics**: If we want to **log or collect metrics related to retry attempts**, implementing a custom retryer provides an opportunity to add this functionality.

1. **Integration with Circuit Breakers**: If we are using circuit breaker patterns in conjunction with Feign, a custom retryer can be integrated with the circuit breaker's state to make more informed decisions about when to retry or when to open the circuit.

1. **Non-Standard Retry Strategies**: For scenarios that do not fit the standard retry strategies provided by the default retryer, such as rate-limited APIs or APIs with specific retry requirements, we can define a custom retryer tailored to our use case.

Here's an example of implementing a custom `Retryer` in OpenFeign:
```java
public class CalculatorRetryer implements Retryer {
    /**
     * millis to wait between retries
     */
    private final long period;

    /**
     * Maximum number of retries
     */
    private final int maxAttempts;

    private int attempt = 1;

    @Override
    public void continueOrPropagate(RetryableException e) {
        log.info("Feign retry attempt {} of {} due to {} ", 
                attempt, 
                maxAttempts, 
                e.getMessage());
        if (++attempt > maxAttempts) {
            throw e;
        }
        if (e.status() == 401) {
            try {
                Thread.sleep(period);
            } catch (InterruptedException ex) {
                throw e;
            }
        } else {
            throw e;
        }
    }

    @Override
    public Retryer clone() {
        return this;
    }

    public int getRetryAttempts() {
        return attempt - 1; // Subtract 1 to exclude the initial attempt
    }
}
```
It specifically retries `HTTP 401` errors.

You can see it in action by running `givenTwoNumbersAndServerReturningUnauthorizedErrorShouldRetry` test in the example code shared on [Github](#example-code).

To summarise, the incentive for creating a custom retryer in Feign arises when we require greater control and flexibility over how retries are handled in our HTTP requests. When our requirements differ from the behaviour of the default retryer, a custom retryer allows us to modify the retry logic to our specific use case.

### Circuit Breakers
Circuit breakers are typically implemented using separate libraries or tools such as [Netflix Hystrix](https://github.com/Netflix/Hystrix), [Resilience4j](https://resilience4j.readme.io/), or [Spring Cloud Circuit Breaker](https://spring.io/projects/spring-cloud-circuitbreaker).


#### Why Should I use a Circuit Breaker?
The primary motivation for using a circuit breaker with Feign is to enhance the resilience of our microservices-based applications. Here are some key reasons:

1. **Fault Isolation**: Circuit breakers prevent failures in one service from cascading to other services by isolating the failing component.

1. **Fail-Fast**: When a circuit is open (indicating a failure state), subsequent requests are "failed fast" without attempting to make calls to a potentially unresponsive or failing service, reducing latency and resource consumption.

1. **Graceful Degradation**: Circuit breakers allow our application to gracefully degrade when a dependent service is experiencing issues, ensuring that it can continue to provide a reduced set of functionality.

1. **Monitoring and Metrics**: Circuit breakers provide metrics and monitoring capabilities, allowing us to track the health and performance of our services.

#### Configuring Circuit Breakers
[HystrixFeign](https://github.com/OpenFeign/feign/blob/master/hystrix) is used to configure circuit breaker support provided by Hystrix.

Hystrix is a latency and fault tolerance library designed to isolate points of access to remote systems, services, and 3rd-party libraries in a distributed environment. It helps to stop cascading failure and enable resilience in complex distributed systems where failure is inevitable.

To use Hystrix with Feign, we need to add the Hystrix module to classpath. 
And use the HystrixFeign builder as follows:
```java
final CalculatorService target = HystrixFeign.builder()
  .target(CalculatorService.class, HOST);
```

Let us see how to use fallback class to handle errors from the service.

In Hystrix, a fallback class is an alternative way to define fallback logic for a Hystrix command instead of defining the fallback logic directly within the getFallback method of the Hystrix command class. The fallback class provides a separation of concerns, allowing us to keep our command class focused on the main logic and delegate fallback logic to a separate class. This can improve code organization and maintainability.

Here is sample code to implement the fallback for `CalculatorService`. 
```java

@Slf4j
public class CalculatorHystrixFallback implements CalculatorService {

    @Override
    public Long add(Long firstNumber, Long secondNumber) {
        log.info("[Fallback add] Adding {} and {}", firstNumber, secondNumber);
        return firstNumber + secondNumber;
    }

    @Override
    public Long subtract(Long firstNumber, Long secondNumber) {
        return null;
    }

    @Override
    public Long multiply(Long firstNumber, Long secondNumber) {
        return null;
    }

    @Override
    public Long divide(Long firstNumber, Long secondNumber) {
        return null;
    }
}
```

To demonstrate fallback, we have implemented only `add` method:
Then we use this fallback while building the client:
```java
final CalculatorHystrixFallback fallback = new CalculatorHystrixFallback();
final CalculatorService target = HystrixFeign.builder()
  .decoder(new JacksonDecoder())
  .target(CalculatorService.class, 
          HOST, fallback);
```
When there is error sent by add endpoint or the circuit is open, `add` fallback method would be called by Hystrix. 
You can see it in action by running `givenTwoNumbersAndServerReturningServerErrorShouldCircuitBreak` test in the example code shared on [Github](#example-code).

You can learn circuit breakers in detail by going through our article [Implementing a Circuit Breaker with Resilience4j](https://reflectoring.io/circuitbreaker-with-resilience4j/).


### Collecting Metrics
Feign does not natively offer a built-in metric capabilities API like some other libraries or frameworks. **Metrics related to Feign, such as request duration, error rates, or retries, typically need to be collected and tracked using external libraries or tools.** Popular libraries for collecting metrics in Java applications include [Micrometer](https://micrometer.io/) and [Dropwizard Metrics](https://www.dropwizard.io/projects/metrics/en/stable/index.html).

Here's how we can use Micrometer, a commonly used library, to collect and report metrics related to Feign calls:
```java
public class CalculatorServiceTest {
  public static void main(String[] args) {
    final CalculatorService target = Feign.builder()
      .addCapability(new MicrometerCapability())
      .target(CalculatorService.class, HOST);
    target.contributors("OpenFeign", "feign");
    // metrics will be available from this point onwards
  }
}
```
Please note that we would need to add Micrometer as a dependency in our project and configure it properly.

## Next Steps
If you are interested in learning more about OpenFeign and trying out its features, we recommend visiting the official OpenFeign website and exploring the documentation. Here's how you can get started:

### Step 1: Visit the Official OpenFeign Website

Visit the [official OpenFeign website](https://github.com/OpenFeign/feign).

### Step 2: Explore the Documentation

The OpenFeign documentation provides comprehensive information on how to use and configure the library. You will find examples, guides, and detailed explanations of various features. Make sure to check out the documentation sections that interest you the most:

- **Getting Started**: This section typically provides a quick overview and setup instructions.
- **Annotations**: Learn about the powerful annotations used in OpenFeign to define HTTP clients.
- **Request Interceptors**: Understand how to use request interceptors for customizing requests.
- **Error Handling**: Explore error handling strategies in Feign.
- **Configuration**: Learn how to configure Feign for different use cases.
- **Advanced Topics**: Dive into advanced topics like custom encoders/decoders, retries, and circuit breakers.

### Step 3: Try Out Examples

As you go through the documentation, try out the provided examples in your development environment. Experiment with different features and configurations to get a hands-on experience with OpenFeign.

### Step 4: Join the Community

If you have questions, run into issues, or want to share your experiences, consider joining the OpenFeign community. You can find the community on platforms like GitHub, Stack Overflow, or relevant discussion forums.

### Step 5: Stay Updated

Keep an eye on the project's GitHub repository for updates, releases, and new features. OpenFeign is an open-source project, and it may evolve over time with improvements and enhancements.

By visiting the [OpenFeign official website](https://github.com/OpenFeign/feign) and exploring its documentation, you'll gain valuable insights into how to use this powerful library for making HTTP requests in your Java applications. It's a great way to enhance your skills and improve your ability to work with remote APIs efficiently.