---
authors: [sagaofsilence]
categories: [Java]
date: 2024-05-29 00:00:00 +1100
excerpt: Reactive APIs Offered by Apache HttpClient.
image: images/stock/0120-data-stream-1200x628-branded.jpg
title: Reactive APIs Offered by Apache HttpClient
url: apache-http-client-reactive-apis
---

In this article, we are going to learn about reactive APIs offered by Apache HttpClient APIs. We are going to explore how to use reactive, full-duplex HTTP/1.1 message exchange using RxJava and Apache HttpClient. So get ready to learn to implement HTTP interactions with Apache HttpClient!

## The "Create an HTTP Client with Apache HttpClient" Series

This article is the fifth part of a series:

1. [Introduction to Apache HttpClient](/create-a-http-client-with-apache-http-client/)
2. [Apache HttpClient Configuration](/apache-http-client-config/)
3. [Classic APIs Offered by Apache HttpClient](/apache-http-client-classic-apis/)
4. [Async APIs Offered by Apache HttpClient](/apache-http-client-async-apis/)
5. [Reactive APIs Offered by Apache HttpClient](/apache-http-client-reactive-apis/)

{{% github "https://github.com/thombergs/code-examples/tree/master/create-a-http-client-wth-apache-http-client" %}}
  
Let's now learn how to use Apache HttpClient for web communication. We have grouped the examples under the following categories of APIs: classic, async, and reactive. In this article we will learn about the reactive APIs offered by Apache HttpClient.

{{% info title="Reqres Fake Data CRUD API" %}}
We are going to use [Reqres API Server](https://reqres.in) to test different HTTP methods. It is a free online API that can be used for testing and prototyping. It provides a variety of endpoints that can be used to test different HTTP methods. The Reqres API is a good choice
for testing CORS because it supports all the HTTP methods that are allowed by CORS.
{{% /info %}}

## HttpClient (Reactive APIs)

In this section of examples, we are going to learn how to use `HttpAsyncClient` in combination with RxJava for sending reactive, full-duplex HTTP/1.1 message exchange.

{{% info title="HTTP and CRUD Operations" %}}
CRUD operations refer to Create, Read, Update, and Delete actions performed on data. In the context of HTTP endpoints for a `/users` resource:

1. **Create**: Use HTTP POST to add a new user. Example URL: `POST /users`
2. **Read**: Use HTTP GET to retrieve user data. Example URL: `GET /users/{userId}` for a specific user or `GET /users?page=1` for a list of users with pagination.
3. **Update**: Use HTTP PUT or PATCH to modify user data. Example URL: `PUT /users/{userId}`
4. **Delete**: Use HTTP DELETE to remove a user. Example URL: `DELETE /users/{userId}`
   {{% /info %}}

## Basic Reactive HTTP Request / Response Exchange

Let's look at an example of how to send a simple HTTP reactive request.
{{% info title="Reactive Java Programming and RxJava" %}}
Reactive Java Programming, also known as [ReactiveX or Reactive Extensions](https://reactivex.io/), is an approach to programming that emphasizes asynchronous and event-driven processing. It enables developers to write code that reacts to changes or events in the system, rather than relying on traditional imperative programming paradigms.

[RxJava](https://github.com/ReactiveX/RxJava), a library for reactive programming in Java, implements the principles of ReactiveX. It provides a powerful toolkit for composing asynchronous and event-based programs using observable sequences. These sequences represent streams of data or events that can be manipulated and transformed using a wide range of operators.

RxJava allows developers to write concise and expressive code by leveraging operators like map, filter, and reduce to perform common data transformations. It also provides features for error handling, backpressure handling, and concurrency control, making it suitable for building responsive and resilient applications.
{{% /info %}}

### Project Setup

We need to set up following Maven dependencies:

```xml
<dependency>
    <groupId>org.apache.httpcomponents.core5</groupId>
    <artifactId>httpcore5-reactive</artifactId>
    <version>5.2.4</version>
</dependency>

<dependency>
    <groupId>io.reactivex.rxjava3</groupId>
    <artifactId>rxjava</artifactId>
    <version>3.1.8</version>
</dependency>

```

### Implementing the Reactive Request Processing

In the following example we'll implement a helper class that has methods to start and stop the async client and methods to execute HTTP requests:

```java
public class UserAsyncHttpRequestHelper extends BaseHttpRequestHelper {

  private MinimalHttpAsyncClient minimalHttp1Client;
  private MinimalHttpAsyncClient minimalHttp2Client;
  
  // methods to start and stop the http clients

  public User createUserWithReactiveProcessing(
      MinimalHttpAsyncClient minimalHttpClient,
      String userName,
      String userJob,
      String scheme,
      String hostname)
      throws RequestProcessingException {
    try {
      // Prepare request payload
      HttpHost httpHost = new HttpHost(scheme, hostname);
      URI uri = new URIBuilder(httpHost.toURI() + "/api/users/").build();
      String payloadStr = preparePayload(userName, userJob);
      ReactiveResponseConsumer consumer = new ReactiveResponseConsumer();
      // execute the request
      Future<Void> requestFuture 
        = executeRequest(minimalHttpClient, consumer, uri, payloadStr);
      // Print headers 
      Message<HttpResponse, Publisher<ByteBuffer>> streamingResponse =
          consumer.getResponseFuture().get();
      printHeaders(streamingResponse);
      // Prepare result
      return prepareResult(streamingResponse, requestFuture);
    } catch (Exception e) {
      String errorMessage = "Failed to create user. Error: " + e.getMessage();
      throw new RequestProcessingException(errorMessage, e);
    }
  }

  private String preparePayload(String userName, String userJob) 
        throws JsonProcessingException {
    Map<String, String> payload = new HashMap<>();
    payload.put("name", userName);
    payload.put("job", userJob);
    return OBJECT_MAPPER.writeValueAsString(payload);
  }

  private Future<Void> executeRequest(
      MinimalHttpAsyncClient minimalHttpClient,
      ReactiveResponseConsumer consumer,
      URI uri,
      String payloadStr) {
    byte[] bs = payloadStr.getBytes(StandardCharsets.UTF_8);
    ReactiveEntityProducer reactiveEntityProducer =
        new ReactiveEntityProducer(Flowable.just(ByteBuffer.wrap(bs)), 
                                   bs.length, ContentType.TEXT_PLAIN, null);

    return minimalHttpClient.execute(
        new BasicRequestProducer("POST", uri, reactiveEntityProducer), 
        consumer, 
        null);
  }

  private void printHeaders(
        Message<HttpResponse, Publisher<ByteBuffer>> streamingResponse) {
    log.debug("Head: {}", streamingResponse.getHead());
    for (Header header : streamingResponse.getHead().getHeaders()) {
      log.debug("Header : {}", header);
    }
  }

  private User prepareResult(
      Message<HttpResponse, Publisher<ByteBuffer>> streamingResponse, 
      Future<Void> requestFuture)
        throws InterruptedException, ExecutionException, 
               TimeoutException, JsonProcessingException {
    StringBuilder result = new StringBuilder();
    Observable.fromPublisher(streamingResponse.getBody())
        .map(
            byteBuffer -> {
              byte[] bytes = new byte[byteBuffer.remaining()];
              byteBuffer.get(bytes);
              return new String(bytes);
            })
        .materialize()
        .forEach(
            stringNotification -> {
              String value = stringNotification.getValue();
              if (value != null) {
                result.append(value);
              }
            });

    requestFuture.get(1, TimeUnit.MINUTES);
    return OBJECT_MAPPER.readerFor(User.class).readValue(result.toString());
  }
}
```

This code creates a user using reactive processing with Apache HttpClient's minimal reactive component and RxJava. It constructs an HTTP POST request with user data and sends it asynchronously. Upon receiving the response, it reads the response body as a stream of bytes and converts it into a string. Then, it deserializes the string into a `User` object using Jackson's `ObjectMapper`.

The process starts by constructing the request payload and setting up the request entity. It then executes the HTTP request asynchronously and processes the response using a reactive approach. It converts the response body into a stream of byte buffers. Then it transforms the buffer into a stream of strings using RxJava. Finally, it obtains the string stream, and uses the result to deserialize the user object.

If there are any exceptions during this process, it catches such exceptions and wraps those in a `RequestProcessingException`. Overall, this approach leverages reactive programming to handle HTTP requests and responses asynchronously, providing better scalability and responsiveness.

The code sample demonstrates how to use notable classes and methods from Apache reactive APIs:

[Reactive Streams Specification](https://www.reactive-streams.org/) is a standard for processing asynchronous data using streaming with non-blocking backpressure. `ReactiveEntityProducer` is a `AsyncEntityProducer` that subscribes to a `Publisher` instance, as defined by the Reactive Streams specification. It is responsible for producing HTTP request entity content reactively. It accepts a `Flowable<ByteBuffer>` stream of data chunks and converts it into an HTTP request entity. In the code sample, it is used to create the request entity from the payload data (`payloadStr`).

`BasicRequestProducer` is a basic implementation of `AsyncRequestProducer` that produces one fixed request and relies on a `AsyncEntityProducer` to generate a request entity stream. It constructs an HTTP request with the specified method, URI, and request entity. In the code, it creates a POST request with the URI obtained from the provided `scheme` and `hostname`.

`ReactiveResponseConsumer` is a `AsyncResponseConsumer` that publishes the response body through a `Publisher`, as defined by the Reactive Streams specification. The response represents a `Message` consisting of a `HttpResponse` representing the headers and a `Publisher` representing the response body as an asynchronous stream of `ByteBuffer` instances. It is a reactive implementation of the `ResponseConsumer` interface, designed to consume HTTP response asynchronously. It processes the response stream reactively and provides access to the response body as a `Publisher<ByteBuffer>`. In the code, it is used to consume the HTTP response asynchronously.

`Message` represents a generic message consisting of both a head (metadata) and a body (payload). In the code sample, it's used as the return type of `getResponseFuture()` method of `ReactiveResponseConsumer`, providing access to the HTTP response's head and body.

`Publisher` is a provider of a potentially unbounded number of sequenced elements, publishing them according to the demand received from its `Subscriber`(s).
A `Publisher` can serve multiple `Subscriber`s subscribed through `subscribe(Subscriber)` dynamically at various points in time. It's used to publish data asynchronously, and in the code, it represents the body of the HTTP response, providing a stream of byte buffers.

### RxJava Classes

Now let's get familiar with the RxJava noteworthy classes.

The [Observable](https://reactivex.io/RxJava/3.x/javadoc/io/reactivex/rxjava3/core/Observable.html) class is the non-backpressured, optionally multivalued base reactive class that offers factory methods, intermediate operators and the ability to consume synchronous and/ or asynchronous reactive data flows. Its `fromPublisher()` method converts an arbitrary reactive stream `Publisher` into an `Observable`. Its `map()` method returns an `Observable` that applies a specified function to each item emitted by the current `Observable` and emits the results of these function applications. Furthermore, `materialize()` method returns an `Observable` that represents all the emissions and notifications from the current `Observable` into emissions marked with their original types within `Notification` objects.

The [Flowable](https://reactivex.io/RxJava/3.x/javadoc/io/reactivex/rxjava3/core/Flowable.html) class that implements the reactive streams `Publisher` pattern, offers factory methods, intermediate operators and the ability to consume reactive data flows. Reactive streams operates with `Publishers` which `Flowable` extends. Many operators therefore accept general `Publishers` directly and allow direct interoperation with other reactive streams implementations.


### Testing the Reactive Request Processing

Now let's test out reactive functionality:

```java
@Test
void createUserWithReactiveProcessing() {
  MinimalHttpAsyncClient minimalHttpAsyncClient = null;
  try {
    minimalHttpAsyncClient = userHttpRequestHelper.startMinimalHttp1AsyncClient();

    User responseBody =
        userHttpRequestHelper.createUserWithReactiveProcessing(
            minimalHttpAsyncClient, "RxMan", "Manager", "https", "reqres.in");
    // verify
    assertThat(responseBody).extracting("id", "createdAt").isNotNull();
  } catch (Exception e) {
    Assertions.fail("Failed to execute HTTP request.", e);
  } finally {
    userHttpRequestHelper.stopMinimalHttpAsyncClient(minimalHttpAsyncClient);
  }
}

```

This test validates the functionality of creating a user with reactive processing using the Apache HttpClient.

It starts by initializing the `MinimalHttpAsyncClient` and setting it to null. Then, it attempts to create a user with the specified name and job role using reactive processing through the `createUserWithReactiveProcessing()` method of the `userHttpRequestHelper`.

After executing the request, it verifies the response by asserting that the response body contains non-null values for the user's ID and creation timestamp.

If any exception occurs during the execution of the test, it fails with an appropriate error message. Finally, it ensures that the `MinimalHttpAsyncClient` is stopped regardless of the test outcome.


## Comparing Async and Reactive APIs

Finally, let's compare the reactive APIs with the async APIs and understand when to use each.

Apache HttpClient provides two powerful paradigms for handling HTTP requests: Async APIs and Reactive APIs. Both styles offer non-blocking operations, but they differ in their design, usage patterns, and underlying concepts. Let's compare these two approaches.

### Async APIs

The Async APIs allow us to send and receive HTTP requests asynchronously. Apache built them on top of Java's `Future` and `CompletableFuture` classes. We use them to execute HTTP requests concurrently without blocking the main thread.

Async APIs have the following key features. First, they are callback-based. They use callbacks to handle responses once they are available. It is easier to integrate them into existing codebases that are already using `Future` and `CompletableFuture`. Furthermore, they allow more control over individual request handling, such as custom timeout settings and retry logic.

For example, we would use them to execute multiple HTTP requests concurrently to fetch data from different services and aggregate the results.

### Reactive APIs

The Reactive APIs follow the principles of reactive programming. They implement the Reactive Streams specification, typically involving frameworks like RxJava or Reactor. They are ideal for applications that need to handle large volumes of data streams or require high responsiveness and scalability.

Reactive APIs have the following key features. They are event-driven. They use an event-driven model to process HTTP responses as they arrive. Furthermore, they support backpressure handling. That in turn allows consumers to process data at their own pace without being overwhelmed. Last but not least, they offer composability. Composing allows for more complex data processing pipelines using reactive operators (e.g., map, flatMap).

For example, we would use a reactive approach to build a real-time data processing application that continuously receives and processes data from multiple sources.

### Comparison

| Aspect                  | Async APIs                                           | Reactive APIs                                           |
|-------------------------|------------------------------------------------------|---------------------------------------------------------|
| **Programming Model**   | Future-based, callback-driven                        | Reactive Streams, event-driven                          |
| **Concurrency**         | Easy to manage with `CompletableFuture`              | Inherent support for handling asynchronous data streams |
| **Scalability**         | Suitable for moderate concurrency                    | Highly scalable, suitable for high-throughput scenarios |
| **Backpressure**        | Not inherently supported                             | Built-in backpressure support                           |
| **Integration**         | Seamless with existing `CompletableFuture` codebases | Ideal for applications using reactive frameworks        |
| **Complexity**          | Simpler for straightforward async tasks              | More complex but powerful for advanced use cases        |

### Choosing the Right API

Use async APIs to make concurrent HTTP requests with simpler control over futures and callbacks. It's a good fit for applications that are already leveraging `CompletableFuture`.
On the other hand, use reactive APIs to build a highly responsive, scalable application that needs to process streams of data efficiently. It's particularly suitable if we're already using a reactive programming framework like Reactor or RxJava.

By understanding the differences and strengths of Async and Reactive APIs, we can choose the most appropriate approach for the application's needs, ensuring efficient and effective handling of HTTP requests with Apache HttpClient.

## Conclusion

In this article, we got familiar with the integration of Apache reactive HTTP client with RxJava for reactive streams processing. We learned how to leverage reactive programming paradigms for handling HTTP requests and responses asynchronously. By combining Apache's reactive stream client with RxJava's powerful capabilities, developers can create efficient and scalable applications. 

We learned the usage of reactive entities like `ReactiveEntityProducer` and `ReactiveResponseConsumer`, along with RxJava's `Observable` and `Flowable`, to perform asynchronous data processing. We now better understand the benefits of reactive streams processing, such as improved responsiveness and resource utilization, and saw practical examples demonstrating the integration of Apache HTTP client and RxJava.
