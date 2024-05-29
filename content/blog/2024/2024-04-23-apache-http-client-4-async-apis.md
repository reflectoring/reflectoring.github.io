---
authors: [sagaofsilence]
categories: [Java]
date: 2024-05-29 00:00:00 +1100
excerpt: Async APIs Offered by Apache HttpClient.
image: images/stock/0075-envelopes-1200x628-branded.jpg
title: Async APIs Offered by Apache HttpClient
url: apache-http-client-async-apis
---

In this article, we are going to learn about the async APIs offered by Apache HttpClient. We are going to explore the different ways Apache HttpClient enables developers to send and receive data over the internet in asynchronous mode. From simple `GET` requests to complex multipart `POST` requests, we'll cover it all with real-world examples. So get ready to learn to implement HTTP interactions with Apache HttpClient!

## The "Create an HTTP Client with Apache HttpClient" Series

This article is the fourth part of a series:

1. [Introduction to Apache HttpClient](/create-a-http-client-with-apache-http-client/)
2. [Apache HttpClient Configuration](/apache-http-client-config/)
3. [Classic APIs Offered by Apache HttpClient](/apache-http-client-classic-apis/)
4. [Async APIs Offered by Apache HttpClient](/apache-http-client-async-apis/)
5. [Reactive APIs Offered by Apache HttpClient](/apache-http-client-reactive-apis/)

{{% github "https://github.com/thombergs/code-examples/tree/master/create-a-http-client-wth-apache-http-client" %}}
  
Let's now learn how to use Apache HttpClient for web communication. We have grouped the examples under the following categories of APIs: classic, async, and reactive. In this article, we will learn about the async APIs offered by Apache HttpClient.

{{% info title="Reqres Fake Data CRUD API" %}}
We are going to use [Reqres API Server](https://reqres.in) to test different HTTP methods. It is a free online API that can be used for testing and prototyping. It provides a variety of endpoints that can be used to test different HTTP methods. The Reqres API is a good choice
for testing CRUD operations because it supports all the HTTP methods that CRUD allows.
{{% /info %}}

## HttpClient (Async APIs)

In this section of examples, we are going to learn how to use the `HttpAsyncClient` for sending requests and consuming responses in asynchronous mode. The client code will wait until it receives a response from the server without blocking the current thread.

{{% info title="HTTP and CRUD Operations" %}}
CRUD operations refer to Create, Read, Update, and Delete actions performed on data. In the context of HTTP endpoints for a `/users` resource:

- **Create**: Use HTTP POST to add a new user: `POST /users`
- **Read**: Use HTTP GET to retrieve user data: `GET /users/{userId}` for a specific user or `GET /users?page=1` for a list of users with pagination.
- **Update**: Use HTTP PUT or PATCH to modify user data: `PUT /users/{userId}`
- **Delete**: Use HTTP DELETE to remove a user: `DELETE /users/{userId}`
   {{% /info %}}

### When Should We Use HttpAsyncClient?

Apache's `HttpAsyncClient` is an HTTP client that enables non-blocking and parallel processing of long-lasting HTTP calls. This library incorporates a non-blocking IO model, allowing multiple requests to be active simultaneously without the need for additional background threads. By leveraging this approach, `HttpAsyncClient` offers significant performance benefits over blocking HTTP clients, particularly when dealing with high-volume, long-running HTTP requests. Additionally, this library provides a robust and flexible interface for building HTTP clients, making it an ideal choice for developers looking to optimize their asynchronous HTTP processing workflows.

Asynchronous HTTP clients have a thread pool to handle responses, with explicit timeouts for idle, TTL, and request. For low workloads, synchronous HTTP clients perform better with dedicated threads per connection. For higher throughput, non-blocking IO (NIO) clients are more effective.

## Basic Asynchronous HTTP Request / Response Exchange

Let's now understand how to send a simple HTTP request asynchronously.

{{% info title="IO Reactor" %}}
`HttpAsyncClient` uses IO Reactor to exchange messages asynchronously. HttpCore NIO is a system that uses the Reactor pattern, created by Doug Lea. Its purpose is to react to I/O events and to send event notifications to individual I/O sessions. The idea behind the I/O Reactor pattern is to avoid having one thread per connection, which is the case with the classic blocking I/O model.

The Apache HttpClient's `IOReactor` interface represents an abstract object that implements the Reactor pattern. I/O reactors use a few dispatch threads (usually one) to send I/O event notifications to a much greater number of I/O sessions or connections (often several thousand). It is recommended to have one dispatch thread per CPU core.
{{% /info %}}
  
Let's now implement the logic to call the endpoints asynchronously.
Here is the helper class that has methods to start and stop the async client and methods to execute HTTP requests:

```java
public class UserAsyncHttpRequestHelper extends BaseHttpRequestHelper {

  private CloseableHttpAsyncClient httpClient;

  /** Starts http async client. */
  public void startHttpAsyncClient() {
    
    if (httpClient == null) {
      try {
        PoolingAsyncClientConnectionManager cm =
            PoolingAsyncClientConnectionManagerBuilder.create().build();
        
        IOReactorConfig ioReactorConfig =
            IOReactorConfig.custom().setSoTimeout(Timeout.ofSeconds(5)).build();
        
        httpClient =
            HttpAsyncClients.custom()
                .setIOReactorConfig(ioReactorConfig)
                .setConnectionManager(cm)
                .build();
        
        httpClient.start();
      } catch (Exception e) {
        // handle exception
      }
    }
  }

  /** Stop http async client. */
  public void stopHttpAsyncClient() {
    if (httpClient != null) {
      log.info("Shutting down.");
      httpClient.close(CloseMode.GRACEFUL);
      httpClient = null;
    }
  }
  
  // Helper methods to execute HTTP requests.
}

```

We use `CloseableHttpAsyncClient` to execute HTTP requests. In this implementation, it is set up once. In the `startHttpAsyncClient()` method, we first build the connection manager. Then we configure the IO reactor, and build and start the async client.

The method `stopHttpAsyncClient()` stops the client gracefully.

Now let's understand why do we need to start and stop the HTTP async client. We did not need to do so for the classic HTTP client.

The need to start and stop the Apache HttpAsyncClient but not for the classic HttpClient is primarily due to their underlying architectures and usage scenarios.

Apache `HttpAsyncClient` is designed for asynchronous, non-blocking HTTP communication. It operates based on an event-driven model, sends requests asynchronously, and processes responses in a non-blocking manner. This asynchronous nature requires explicit management of the client's life cycle, including starting and stopping it, to control the execution of asynchronous tasks and resources.

On the other hand, the classic `HttpClient` operates synchronously by default. It sends HTTP requests and blocks until it receives a response, making it straightforward to use without the need for explicit start and stop operations. Each request in the classic `HttpClient` is executed synchronously, and there's no ongoing asynchronous activity that needs to be managed.

We are going to use the `execute()` method of `HttpAsyncClient`:

```java
public <T> Future <T> execute(AsyncRequestProducer  requestProducer,
                              AsyncResponseConsumer <T> responseConsumer,
                              FutureCallback <T> callback)

```

Let's now learn how to do it. Here is the implementation of a custom callback. We can also implement it inline using an anonymous class:

```java
public class SimpleHttpResponseCallback
  implements FutureCallback<SimpleHttpResponse> {
  /** The Http get request. */
  SimpleHttpRequest httpRequest;

  /** The Error message. */
  String errorMessage;

  public SimpleHttpResponseCallback(SimpleHttpRequest httpRequest, 
                                    String errorMessage) {
    this.httpRequest = httpRequest;
    this.errorMessage = errorMessage;
  }

  @Override
  public void completed(SimpleHttpResponse response) {
    log.debug(httpRequest + "->" + new StatusLine(response));
    log.debug("Got response: {}", response.getBody());
  }

  @Override
  public void failed(Exception ex) {
    log.error(httpRequest + "->" + ex);
    throw new RequestProcessingException(errorMessage, ex);
  }

  @Override
  public void cancelled() {
    log.debug(httpRequest + " cancelled");
  }
}

```

We have overridden the life cycle methods of the `FutureCallback` interface. Furthermore, we have also defined the response type `SimpleHttpResponse` it will receive when the HTTP request call completes. When the call fails, we opt to raise an exception in the implementation of the `failed()` method.

Now let's see how to use this custom callback:

```java
public Map<Long, String> getUserWithCallback(List<Long> userIdList, int delayInSec)
    throws RequestProcessingException {
  
  Map<Long, String> userResponseMap = new HashMap<>();
  Map<Long, Future<SimpleHttpResponse>> futuresMap = new HashMap<>();
  
  for (Long userId : userIdList) {
    try {
      // Create request
      HttpHost httpHost = HttpHost.create("https://reqres.in");
      
      URI uri;
      uri = new URIBuilder("/api/users/" + userId + "?delay=" + delayInSec).build();
      
      SimpleHttpRequest httpGetRequest =
          SimpleRequestBuilder.get().setHttpHost(httpHost)
                              .setPath(uri.getPath()).build();
      // log request

      Future<SimpleHttpResponse> future =
          httpClient.execute(
              SimpleRequestProducer.create(httpGetRequest),
              SimpleResponseConsumer.create(),
              new SimpleHttpResponseCallback(
                  httpGetRequest,
                  MessageFormat.format("Failed to get user for ID: {0}", userId)));
      
      futuresMap.put(userId, future);
    } catch (Exception e) {
      userResponseMap.put(userId, "Failed to get user for ID: " + userId));
    }
  }


```

The code snippet aims to retrieve user data for a list of user IDs asynchronously using Apache HttpAsyncClient. It starts by ensuring that the `HTTPAsyncClient` is initialized. It then initializes data structures to store user responses and futures for asynchronous HTTP requests.

For each user ID in the provided list, it constructs a `GET` request with a specified delay parameter and executes it asynchronously. It stores response futures in a map for later retrieval. It logs any exceptions that occur during request execution and adds corresponding error messages to the response map.

Note that we have added a delay to the `GET` endpoint. It simulates a delayed server operation. The HTTP client sends the request, one after the other, without waiting for the response. We can verify it by checking the logs:

```bash
Started HTTP async client. 
Executing GET request: https://reqres.in/api/users/1 on host https://reqres.in 
Executing GET request: https://reqres.in/api/users/2 on host https://reqres.in 
...
Executing GET request: https://reqres.in/api/users/10 on host https://reqres.in 
Got 10 futures.
GET https://reqres.in/api/users/1->HTTP/1.1 200 OK 
GET https://reqres.in/api/users/2->HTTP/1.1 200 OK 
...
GET https://reqres.in/api/users/10->HTTP/1.1 200 OK 

```

It will send the requests in the order of the IDs in the list. However, the requests may complete in any order. So our implementation should be agnostic to the order of request completion.

Now let's verify the implementation using a unit test:

```java
class UserAsyncHttpRequestHelperTests extends BaseAsyncExampleTests {

  private UserAsyncHttpRequestHelper userHttpRequestHelper 
    = new UserAsyncHttpRequestHelper();

  private Condition<String> getUserErrorCheck =
      new Condition<String>("Check failure response.") {
        @Override
        public boolean matches(String value) {
          // value should not be null
          // value should not be a failure message
          return value != null
              && (!value.startsWith("Failed to get user")
                  || value.equals("Server does not support HTTP/2 multiplexing."));
        }
      };

  /** Tests get user. */
  @Test
  void getUserWithCallback() {
    try {
      userHttpRequestHelper.startHttpAsyncClient();

      // Send 10 requests in parallel
      // call the delayed endpoint
      List<Long> userIdList 
        = List.of(1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L);
      Map<Long, String> responseBodyMap 
        = userHttpRequestHelper.getUserWithCallback(userIdList, 3);
      // verify
      assertThat(responseBodyMap)
          .hasSameSizeAs(userIdList)
          .doesNotContainKey(null)
          .doesNotContainValue(null)
          .hasValueSatisfying(getUserErrorCheck);
    } catch (Exception e) {
      Assertions.fail("Failed to execute HTTP request.", e);
    } finally {
      userHttpRequestHelper.stopHttpAsyncClient();
    }
  }
}


```

Here, we verify fetching user data asynchronously with Apache HttpAsyncClient. First, we initialize the client, and send 10 parallel requests to a delayed endpoint, each with a unique user ID and 3-second delay. Stores the responses in a map. After receiving all responses, we validate their correctness: ensuring the map matches the user IDs, contains no null key-value pairs, and no responses indicating failure. If an exception occurs, the test fails with an error message. Finally, we stop the client.

## Asynchronous Content Stream HTTP Request / Response Exchange

Let's now understand how to handle content stream HTTP requests asynchronously. We would extend `AbstractCharResponseConsumer` to implement the content consumer. `AbstractCharResponseConsumer` is a base class that developers can extend to create custom response consumers for handling character-based content streams. This class specifically handles scenarios where the HTTP response entity contains character data, such as text-based content like HTML, JSON, or XML.

When extending `AbstractCharResponseConsumer`, we typically override methods as follows. First, `start()` marks the beginning of the response stream. We perform any initialization or setup tasks required for processing the incoming character data stream. Then we have the `data()` method. Apache client repeatedly calls it to process the content received from the server. We implement logic to read and process the character data in chunks as it becomes available from the response stream. And finally, in `buildResult()` the response stream ends. We perform any cleanup or finalization tasks, such as closing resources or finalizing the processing of the received content. For error handling, we override the `failed()` method.

{{% info title="Content Streaming User Scenarios" %}}

In scenarios where large volumes of data need to be processed in real-time or near-real-time, asynchronous streaming with Apache HttpAsyncClient can be beneficial. For example, in a big data analytics platform, data streams from various sources such as sensors, logs, or social media feeds can be asynchronously streamed to a central processing system for analysis and insights generation.

IoT devices often generate continuous streams of data that need to be transmitted and processed efficiently. We can use Apache HttpAsyncClient's asynchronous streaming feature to handle such data streams from IoT devices. For instance, in a smart city deployment, sensor data from various devices like traffic cameras, environmental sensors, and smart meters can be asynchronously streamed to a central server for real-time monitoring and analysis.

OTT platforms deliver streaming media content such as videos, audio, and live broadcasts over the internet. We can use Apache HttpAsyncClient's asynchronous streaming capability to handle the transmission of media streams between servers and client applications. For example, in a video streaming service, video content can be asynchronously streamed from content servers to end-user devices, ensuring smooth playback and minimal buffering delays.
{{% /info %}}
  
Here's the implementation of the consumer response:

```java
public class SimpleCharResponseConsumer 
  extends AbstractCharResponseConsumer<SimpleHttpResponse> {
  // fields
  // constructor

  @Override
  protected void start(HttpResponse httpResponse, ContentType contentType)
      throws HttpException, IOException {
    responseBuilder.setLength(0);
  }

  @Override
  protected SimpleHttpResponse buildResult() throws IOException {
    return SimpleHttpResponse.create(HttpStatus.SC_OK, responseBuilder.toString());
  }

  @Override
  protected void data(CharBuffer src, boolean endOfStream) throws IOException {
    while (src.hasRemaining()) {
      responseBuilder.append(src.get());
    }
    if (endOfStream) {
      log.debug(responseBuilder.toString());
    }
  }

  @Override
  public void failed(Exception ex) {
    throw new RequestProcessingException(errorMessage, ex);
  }

  // other overridden methods
}

```

We process character-based HTTP responses asynchronously. Extending `AbstractCharResponseConsumer`, we override methods to handle the response stream. `start()` initializes response logging and content accumulation. `data()` appends received data to a `StringBuilder`. `buildResult()` constructs a `SimpleHttpResponse` with HTTP status code and accumulated content. On failure, `failed()` logs errors and throws a `RequestProcessingException`.

Now let's test this functionality:

```java
class UserAsyncHttpRequestHelperTests extends BaseAsyncExampleTests {

  private UserAsyncHttpRequestHelper userHttpRequestHelper 
    = new UserAsyncHttpRequestHelper();

  private Condition<String> getUserErrorCheck =
      new Condition<String>("Check failure response.") {
        @Override
        public boolean matches(String value) {
          // value should not be null
          // value should not be failure message
          return value != null && !value.startsWith("Failed to get user");
        }
      };

  @Test
  void getUserWithStream() {
    try {
      userHttpRequestHelper.startHttpAsyncClient();

      // Send 10 requests in parallel
      // call the delayed endpoint
      List<Long> userIdList = List.of(1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L);
      Map<Long, String> responseBodyMap =
          userHttpRequestHelper.getUserWithStreams(userIdList, 3);
      // verify
      assertThat(responseBodyMap)
          .hasSameSizeAs(userIdList)
          .doesNotContainKey(null)
          .doesNotContainValue(null)
          .hasValueSatisfying(getUserErrorCheck);
    } catch (Exception e) {
      Assertions.fail("Failed to execute HTTP request.", e);
    } finally {
      userHttpRequestHelper.stopHttpAsyncClient();
    }
  }
}


```

The `getUserWithStream()` test method in the `UserAsyncHttpRequestHelperTests` class verifies the functionality of retrieving user data asynchronously using streams.

First, we start the HTTP asynchronous client using `userHttpRequestHelper.startHttpAsyncClient()`.

Then, we prepare a list of user IDs and call the method `getUserWithStreams()` from the `UserAsyncHttpRequestHelper` class, passing the list of user IDs and a delay value of 3 seconds.

The method sends HTTP requests in parallel for each user ID, fetching user data from the delayed endpoint. It returns a map containing the response bodies for each user ID.

Finally, the test verifies the correctness of the responses. It ensures that the response map has the same size as the list of user IDs. The map does not contain null keys or values. Furthermore, the map satisfies the predefined condition `getUserErrorCheck`, which checks that the response does not contain a failure message.

If any exception occurs during the execution of the test, the test fails with an error message indicating the failure to execute the HTTP request. Finally, we stop the HTTP asynchronous client using `userHttpRequestHelper.stopHttpAsyncClient()`.

## Pipelined HTTP Request / Response Exchange

HTTP pipelining is a technique that allows a client to send multiple HTTP requests to a server without waiting for a response. The server, in turn, must respond to all the requests in the same order they were received. This technique is a way to improve the performance of HTTP/1.1 connections.

When a client makes an HTTP request, it has to wait for the server to respond before sending another request. This waiting time can be significant, especially on high-latency networks. HTTP pipelining allows a client to send multiple requests at once, without waiting for the server to respond. By doing this, the client can make better use of the connection and reduce overall loading times.

It's worth noting that HTTP pipelining is not supported by all servers, so it's not always a reliable way to improve performance. Additionally, if there is an error in one of the requests, the entire pipeline will fail, and the client will need to resend all the requests.

Pipelining can also improve performance by packing multiple HTTP requests into a single TCP message. This can help to reduce the overhead of the connection and improve the overall speed of the transfer. However, we don't use this technique widely, as it can be challenging to implement correctly and may lead to compatibility issues with some servers.

Now let's understand how to pipeline requests using Apache HttpClient:

```java
public class CustomHttpResponseCallback 
  implements FutureCallback<SimpleHttpResponse> {
  // fields
  // constructor

  @Override
  public void completed(SimpleHttpResponse response) {
    latch.countDown();
  }

  @Override
  public void failed(Exception ex) {
    latch.countDown();
    throw new RequestProcessingException(errorMessage, ex);
  }

  @Override
  public void cancelled() {
    latch.countDown();
  }
}


```

We have overridden the life cycle methods of `FutureCallback`. We have also mentioned the response type `SimpleHttpResponse` it will receive when the HTTP request call completes. When the call fails, we opt to raise an exception in `failed`.

Now let's see how to use this custom callback:

```java
public Map<String, String> getUserWithPipelining(
    MinimalHttpAsyncClient minimalHttpClient,
    List<String> userIdList,
    int delayInSec,
    String scheme,
    String hostname)
    throws RequestProcessingException {
  return getUserWithParallelRequests(minimalHttpClient, 
                                     userIdList, delayInSec, scheme, hostname);
}

private Map<String, String> getUserWithParallelRequests(
    MinimalHttpAsyncClient minimalHttpClient, List<String> userIdList, int delayInSec,
    String scheme, String hostname) throws RequestProcessingException {

  Map<String, String> userResponseMap = new HashMap<>();
  Map<String, Future<SimpleHttpResponse>> futuresMap = new HashMap<>();
  AsyncClientEndpoint endpoint = null;
  String userId = null;

  try {
    HttpHost httpHost = new HttpHost(scheme, hostname);
    
    Future<AsyncClientEndpoint> leaseFuture 
      = minimalHttpClient.lease(httpHost, null);
    endpoint = leaseFuture.get(30, TimeUnit.SECONDS);
    CountDownLatch latch = new CountDownLatch(userIdList.size());

    for (String currentUserId : userIdList) {
      userId = currentUserId;
      Future<SimpleHttpResponse> future =
          executeRequest(minimalHttpClient, delayInSec, userId, httpHost, latch);
      futuresMap.put(userId, future);
    }

    latch.await();
  } catch (Exception e) {
    // handle exception
    userResponseMap.put(userId, e.getMessage());
  } finally {
    // release resources
  }

  handleFutureResults(futuresMap, userResponseMap);
  return userResponseMap;
}

private Future<SimpleHttpResponse> executeRequest(
    MinimalHttpAsyncClient minimalHttpClient,
    int delayInSec,
    Long userId,
    HttpHost httpHost,
    CountDownLatch latch)
    throws URISyntaxException {
  // Create request
  URI uri 
    = new URIBuilder("/api/users/" + userId + "?delay=" + delayInSec).build();
  SimpleHttpRequest httpGetRequest =
      SimpleRequestBuilder.get().setHttpHost(httpHost).setPath(uri.getPath()).build();
  log.debug(
      "Executing {} request: {} on host {}",
      httpGetRequest.getMethod(),
      httpGetRequest.getUri(),
      httpHost);

  Future<SimpleHttpResponse> future =
      minimalHttpClient.execute(
          SimpleRequestProducer.create(httpGetRequest),
          SimpleResponseConsumer.create(),
          new CustomHttpResponseCallback(
              httpGetRequest,
              MessageFormat.format("Failed to get user for ID: {0}", userId),
              latch));
  return future;
}

private void handleFutureResults(
    Map<Long, Future<SimpleHttpResponse>> futuresMap, 
    Map<Long, String> userResponseMap) {
  for (Map.Entry<Long, Future<SimpleHttpResponse>> futureEntry 
        : futuresMap.entrySet()) {
    Long currentUserId = futureEntry.getKey();
    try {
      userResponseMap.put(currentUserId, futureEntry.getValue().get().getBodyText());
    } catch (Exception e) {
      // prepare error message
      userResponseMap.put(currentUserId, message);
    }
  }
}


```

This code retrieves user data asynchronously using pipelining. It sends parallel requests to the server for each user ID. The method `getUserWithPipelining()` orchestrates this process, while `getUserWithParallelRequests()` handles actual request execution. Processes each request asynchronously, and stores responses in a map. If an error occurs, it logs the error, and adds an appropriate message to the response map. Finally, the method returns the map containing user responses.

{{% warning title="The `ConnectionClosedException` For Unsupported HTTP/2 Async Features" %}}
It may be noted that not all servers support HTTP/2 features like multiplexing. In that case, Apache HttpAsyncClient multiplexer encounters `ConnectionClosedException` with the message "Frame size exceeds maximum" when executing requests with an enclosed message body and the remote endpoint having negotiated a maximum frame size larger than the protocol default (16 KB).
{{% /warning %}}
  
Now let's understand how to call this functionality.

First, let's understand the operations to start and stop the client for HTTP/1:

```java
public class UserAsyncHttpRequestHelper extends BaseHttpRequestHelper {
  
  private MinimalHttpAsyncClient minimalHttp1Client;

  // Starts minimal http 1 async client.
  public MinimalHttpAsyncClient startMinimalHttp1AsyncClient() {
    if (minimalHttp1Client == null) {
      minimalHttp1Client = startMinimalHttpAsyncClient(HttpVersionPolicy.FORCE_HTTP_1);
    }
    return minimalHttp1Client;
  }

  // Starts minimal HTTP async client.
  private MinimalHttpAsyncClient startMinimalHttpAsyncClient(
    HttpVersionPolicy httpVersionPolicy
  ) {
    
    try {
      MinimalHttpAsyncClient minimalHttpClient =
          HttpAsyncClients.createMinimal(
              H2Config.DEFAULT,
              Http1Config.DEFAULT,
              IOReactorConfig.DEFAULT,
              PoolingAsyncClientConnectionManagerBuilder.create()
                  .setTlsStrategy(getTlsStrategy())
                  .setDefaultTlsConfig(
                      TlsConfig.custom().setVersionPolicy(httpVersionPolicy).build())
                      .build());
      
      minimalHttpClient.start();
      log.debug("Started minimal HTTP async client for {}.", httpVersionPolicy);
      return minimalHttpClient;
    } catch (Exception e) {
      // handle exception
    }
  }

  // Stops minimal http async client.
  public void stopMinimalHttpAsyncClient(MinimalHttpAsyncClient minimalHttpClient) {
    if (minimalHttpClient != null) {
      log.info("Shutting down minimal http async client.");
      minimalHttpClient.close(CloseMode.GRACEFUL);
      minimalHttpClient = null;
    }
  }
}

```

The `UserAsyncHttpRequestHelper` class facilitates the management of a minimal HTTP asynchronous client for making requests. It contains methods to start and stop the client.

The `startMinimalHttp1AsyncClient()` method initiates the minimal HTTP/1 async client if it hasn't been started already. It checks if the client is `null`, and if so, it starts the client with HTTP/1 enforced as the HTTP version policy. It then returns the initialized client.

The `startMinimalHttpAsyncClient()` method is a private helper method responsible for initializing the minimal HTTP async client. It creates a `MinimalHttpAsyncClient` instance with default configurations such as HTTP/2, HTTP/1, I/O reactor, and connection manager settings. It starts the client, and if successful, it logs the event and returns the initialized client. If an exception occurs during initialization, it logs an error message and throws a runtime exception.

The `stopMinimalHttpAsyncClient()` method gracefully stops the minimal HTTP async client. It takes the client as an argument, checks if it's not null, shuts down the client gracefully, logs the shutdown event, and sets the client reference to null.

These methods provide a convenient way to manage the life cycle of the minimal HTTP async client, ensuring proper initialization and shutdown procedures.

Here's the test to execute the pipelined HTTP requests:

```java
@Test
  void getUserWithPipelining() {
    
    MinimalHttpAsyncClient minimalHttpAsyncClient = null;
    
    try {
      minimalHttpAsyncClient = userHttpRequestHelper.startMinimalHttp1AsyncClient();

      // Send 10 requests in parallel
      // call the delayed endpoint
      List<Long> userIdList = List.of(1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L);
      Map<Long, String> responseBodyMap =
          userHttpRequestHelper.getUserWithPipelining(
              minimalHttpAsyncClient, userIdList, 3, "https", "reqres.in");
      // verify
      assertThat(responseBodyMap)
          .hasSameSizeAs(userIdList)
          .doesNotContainKey(null)
          .doesNotContainValue(null)
          .hasValueSatisfying(getUserErrorCheck);
    } catch (Exception e) {
      Assertions.fail("Failed to execute HTTP request.", e);
    } finally {
      userHttpRequestHelper.stopMinimalHttpAsyncClient(minimalHttpAsyncClient);
    }
  }


```

In the `getUserWithPipelining()` test method, an instance of `MinimalHttpAsyncClient` is initialized to `null`. The method starts by attempting to start a minimal HTTP/1 asynchronous client using the `startMinimalHttp1AsyncClient()` method of the `userHttpRequestHelper` object. Finally, it assigns this client to the `minimalHttpAsyncClient` variable.

It creates a list of user IDs (`userIdList`). Then invokes `getUserWithPipelining()` method on the `userHttpRequestHelper` object, passing the `minimalHttpAsyncClient`, the `userIdList`, a delay of 3 seconds, and the scheme and hostname of the target server ("https" and "reqres.in" respectively). This method orchestrates the parallel execution of pipelined requests to the specified endpoints.

After executing all the requests, the method retrieves the response body for each request and populates a map (`responseBodyMap`) with the URI as the key and the response body as the value.

The test then verifies the correctness of the responses by asserting that the `responseBodyMap` has the same size as the `userIdList`, does not contain any `null` keys or values, and satisfies the `getUserErrorCheck` condition.

If any exception occurs during the execution of the HTTP requests, the test fails with an appropriate error message. Finally, the `stopMinimalHttpAsyncClient` method is called to stop and release resources associated with the `minimalHttpAsyncClient`.

## Multiplexed HTTP Request / Response Exchange

In HTTP/2, multiplexing enables a web server connection to handle multiple requests and responses simultaneously, leading to improved efficiency and resource utilization. Unlike HTTP/1.1, where requests had to wait for responses before sending the next request, HTTP/2 allows for parallel processing. This means that resources can load concurrently, preventing one resource from blocking others. By using a single TCP connection to transmit multiple data streams, HTTP/2 eliminates the need to establish new connections for each request, resulting in faster loading times. Inspired by Google's SPDY protocol, HTTP/2 enhances web page performance by compressing, multiplexing, and prioritizing HTTP requests, making pages load much faster than with HTTP/1.1.

There is little difference between the way pipelined and multiplexed HTTP request processing. In pipelined exchange, we enforce HTTP/1 version policy whereas in multiplexed exchange we enforce HTTP/2.

Here's the implementation for client setup for multiplexed exchange:

```java
public class UserAsyncHttpRequestHelper extends BaseHttpRequestHelper {
  
  private MinimalHttpAsyncClient minimalHttp2Client;

  public MinimalHttpAsyncClient startMinimalHttp2AsyncClient() {
    if (minimalHttp2Client == null) {
      minimalHttp2Client = startMinimalHttpAsyncClient(HttpVersionPolicy.FORCE_HTTP_2);
    }
    return minimalHttp2Client;
  }
}

```

We have already seen the method `startMinimalHttpAsyncClient()`. We pass `HttpVersionPolicy.FORCE_HTTP_2` to start the client for multiplexed exchanges.

And here is the logic to call request processing with multiplexing:

```java
public Map<String, String> getUserWithMultiplexing(
    MinimalHttpAsyncClient minimalHttpClient,
    List<String> userIdList,
    int delayInSec,
    String scheme,
    String hostname)
    throws RequestProcessingException {
  return getUserWithParallelRequests(minimalHttpClient, 
                                     userIdList, delayInSec, scheme, hostname);
}

```

Here's the test to verify this functionality:

```java
@Test
void getUserWithMultiplexing() {
  
  MinimalHttpAsyncClient minimalHttpAsyncClient = null;
  
  try {
    minimalHttpAsyncClient = userHttpRequestHelper.startMinimalHttp2AsyncClient();

    // Send 10 requests in parallel
    // call the delayed endpoint
    List<Long> userIdList = List.of(1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L);
    Map<Long, String> responseBodyMap =
        userHttpRequestHelper.getUserWithMultiplexing(
            minimalHttpAsyncClient, userIdList, 3, "https", "reqres.in");
    // verify
    assertThat(responseBodyMap)
        .hasSameSizeAs(userIdList)
        .doesNotContainKey(null)
        .doesNotContainValue(null)
        .hasValueSatisfying(getUserErrorCheck);
  } catch (Exception e) {
    Assertions.fail("Failed to execute HTTP request.", e);
  } finally {
    userHttpRequestHelper.stopMinimalHttpAsyncClient(minimalHttpAsyncClient);
  }
}


```

We first attempt to start a minimal HTTP/2 asynchronous client using the `startMinimalHttp2AsyncClient()` method of the `userHttpRequestHelper` object. Finally, it assigns this client to the `minimalHttpAsyncClient` variable.

Then we populate the list of user IDs (`userIdList`). Then we invoke `getUserWithMultiplexing()` method on the `userHttpRequestHelper` object, passing the `minimalHttpAsyncClient`, the `userIdList`, a delay of 3 seconds, and the scheme and host name of the target server ("https" and "reqres.in" respectively). This method orchestrates the parallel execution of multiplexed requests to the specified endpoints.

Once it executes the requests, the method retrieves the response body for each request and populates a map (`responseBodyMap`) with the URI as the key and the response body as the value.

The test then verifies the correctness of the responses by asserting that the `responseBodyMap` has the same size as the `userIdList`, does not contain any `null` keys or values, and satisfies the `getUserErrorCheck` condition.

If any exception occurs during the execution of the HTTP requests, the test fails with an appropriate error message. Finally, we call `stopMinimalHttpAsyncClient()` method to stop and release resources associated with the `minimalHttpAsyncClient`.

{{% info title="Pipelining vs Multiplexing" %}}

In HTTP/1.1 pipelining, requests must still wait for their turn, and we should return them in the exact order they were sent, which can cause delays known as [head-of-line blocking](https://en.wikipedia.org/wiki/Head-of-line_blocking).

However, HTTP/2 improves on this by dividing response data into smaller chunks and returning them in an interleaved manner. This prevents any single request from blocking others, resulting in faster loading times.

It's important to note that HTTP/1.1 pipelining never became widely used due to limited browser and server support. For more details, visit [HTTP Pipelining](https://en.m.wikipedia.org/wiki/HTTP_pipelining), [HTTP/2](https://en.wikipedia.org/wiki/HTTP/2) and [Multiplexing](https://en.wikipedia.org/wiki/Multiplexing).

While both HTTP/1.1 pipelining and HTTP/2 offer similar performance benefits, in theory, HTTP/2 is favored for its more extensive features and broader support.
{{% /info %}}

## Request Execution Interceptors

Request and response interceptors in Apache HttpAsyncClient allow developers to intercept and modify requests and responses before they are sent or received by the client.

`HttpRequestInterceptor` is an interface used to intercept and modify HTTP requests before they are sent to the server. It has the method:

```java
void process(HttpRequest request, EntityDetails entity, HttpContext context)

```

It provides a mechanism to add custom headers, modify request parameters, or perform any other preprocessing tasks on the request.

`AsyncExecChainHandler` is an interface used to intercept and process requests and responses as they pass through the execution chain of the HTTP async client. It has the method:

```java
void execute(HttpRequest httpRequest, AsyncEntityProducer asyncEntityProducer,
             AsyncExecChain.Scope scope, AsyncExecChain asyncExecChain, 
             AsyncExecCallback asyncExecCallback) throws HttpException, IOException

```

It allows developers to perform custom actions such as logging, error handling, creating mock responses, or modifying the behavior of the client based on the response received from the server.

These interceptors are useful in various crosscutting scenarios, such as:

Intercept requests and responses to log information such as request parameters, response status codes, or response bodies for debugging or auditing purposes. Add authentication tokens or credentials to outgoing requests before sending them to the server. Intercept responses to handle errors or exceptions gracefully and take appropriate actions based on the response received from the server. Modify requests to add custom headers, parameters, or payloads before sending them to the server.

Now let's understand one of these scenarios with an example. Let's learn how to create a mock response:

```java
public class UserResponseAsyncExecChainHandler implements AsyncExecChainHandler {
  @Override
  public void execute(HttpRequest httpRequest, AsyncEntityProducer asyncEntityProducer,
      AsyncExecChain.Scope scope, AsyncExecChain asyncExecChain, 
      AsyncExecCallback asyncExecCallback
    ) throws HttpException, IOException {
    
    try {
      boolean requestHandled = false;
      
      if (httpRequest.containsHeader("x-base-number")
          && httpRequest.containsHeader("x-req-exec-number")) {
        
        String path = httpRequest.getPath();
        if (StringUtils.startsWith(path, "/api/users/")) {
          requestHandled = handleUserRequest(httpRequest, asyncExecCallback);
        }
      }

      if (!requestHandled) {
        asyncExecChain.proceed(httpRequest, asyncEntityProducer, 
                               scope, asyncExecCallback);
      }
    } catch (IOException | HttpException ex) {
      String msg = "Failed to execute request.";
      log.error(msg, ex);
      throw new RequestProcessingException(msg, ex);
    }
  }
  
  private boolean handleUserRequest(HttpRequest httpRequest, 
                                    AsyncExecCallback asyncExecCallback)
      throws HttpException, IOException {
    boolean requestHandled = false;
    Header baseNumberHeader = httpRequest.getFirstHeader("x-base-number");
    String baseNumberStr = baseNumberHeader.getValue();
    int baseNumber = Integer.parseInt(baseNumberStr);

    Header reqExecNumberHeader = httpRequest.getFirstHeader("x-req-exec-number");
    String reqExecNumberStr = reqExecNumberHeader.getValue();
    int reqExecNumber = Integer.parseInt(reqExecNumberStr);

    // check if user id is multiple of base value
    if (reqExecNumber % baseNumber == 0) {
      String reasonPhrase = "Multiple of " + baseNumber;
      HttpResponse response 
        = new BasicHttpResponse(HttpStatus.SC_OK, reasonPhrase);
      ByteBuffer content 
        = ByteBuffer.wrap(reasonPhrase.getBytes(StandardCharsets.US_ASCII));
      BasicEntityDetails entityDetails =
          new BasicEntityDetails(content.remaining(), ContentType.TEXT_PLAIN);
      AsyncDataConsumer asyncDataConsumer =
          asyncExecCallback.handleResponse(response, entityDetails);
      asyncDataConsumer.consume(content);
      asyncDataConsumer.streamEnd(null);
      requestHandled = true;
    }
    return requestHandled;
  }
}


```

It overrides the default behavior of handling HTTP requests in the asynchronous execution chain. It checks if the request contains specific headers (`x-base-number` and `x-req-exec-number`) and if the request path starts with "/api/users/". If it meets these conditions, it extracts the values of these headers and parses them into integers. Then, it checks if the `reqExecNumber` is a multiple of the `baseNumber`. If so, it creates a custom response with the status code `HTTP OK (200)` and a reason phrase indicating that it's a multiple of the base number. Otherwise, it proceeds with the execution chain to handle the request normally. Finally, it handles any exceptions that occur during the execution process.

Now let's prepare a client and configure it to use an interceptor:

```java
public CloseableHttpAsyncClient startHttpAsyncInterceptingClient() {
  try {
    if (httpAsyncInterceptingClient == null) {
      PoolingAsyncClientConnectionManager cm =
          PoolingAsyncClientConnectionManagerBuilder.create()
              .setTlsStrategy(getTlsStrategy())
              .build();
      
      IOReactorConfig ioReactorConfig =
          IOReactorConfig.custom().setSoTimeout(Timeout.ofSeconds(5)).build();
      
      httpAsyncInterceptingClient =
          HttpAsyncClients.custom()
              .setIOReactorConfig(ioReactorConfig)
              .setConnectionManager(cm)
              .addExecInterceptorFirst("custom", 
                                        new UserResponseAsyncExecChainHandler())
              .build();
      
      httpAsyncInterceptingClient.start();
      
      log.debug("Started HTTP async client with requests interceptors.");
    }
    return httpAsyncInterceptingClient;
  } catch (Exception e) {
    String errorMsg = "Failed to start HTTP async client.";
    log.error(errorMsg, e);
    throw new RuntimeException(errorMsg, e);
  }
}

```

It initializes and returns an HTTP asynchronous client with request interceptors. It first checks if the client already is in initialized state. If not, it creates a pooling asynchronous client connection manager with a specified TLS strategy. Then, it configures an I/O reactor with a socket timeout of 5 seconds. Next, it creates the HTTP asynchronous client, adds a custom execution interceptor named "custom" (which is an instance of `UserResponseAsyncExecChainHandler`) as the first interceptor, and sets the connection manager and I/O reactor configuration. Finally, it starts the client and logs the action.

Now let's see the scenario of executing an HTTP request and its interception:

```java
public Map<Integer, String> executeRequestsWithInterceptors(
    CloseableHttpAsyncClient closeableHttpAsyncClient,
    Long userId,
    int count,
    int baseNumber)
    throws RequestProcessingException {
  
  Map<Integer, String> userResponseMap = new HashMap<>();
  Map<Integer, Future<SimpleHttpResponse>> futuresMap = new LinkedHashMap<>();

  try {
    HttpHost httpHost = HttpHost.create("https://reqres.in");
    
    URI uri = new URIBuilder("/api/users/" + userId).build();
    String path = uri.getPath();
    
    SimpleHttpRequest httpGetRequest =
        SimpleRequestBuilder.get()
            .setHttpHost(httpHost)
            .setPath(path)
            .addHeader("x-base-number", String.valueOf(baseNumber))
            .build();
    
    for (int i = 0; i < count; i++) {
      try {
        Future<SimpleHttpResponse> future = null; 
        future = executeInterceptorRequest(closeableHttpAsyncClient, 
                                           httpGetRequest, i, httpHost);
        futuresMap.put(i, future);
      } catch (RequestProcessingException e) {
        userResponseMap.put(i, e.getMessage());
      }
    }
  } catch (Exception e) {
    String message = MessageFormat.format("Failed to get user for ID: {0}", userId);
    log.error(message, e);
    throw new RequestProcessingException(message, e);
  }

  handleInterceptorFutureResults(futuresMap, userResponseMap);
  return userResponseMap;
}

private Future<SimpleHttpResponse> executeInterceptorRequest(
    CloseableHttpAsyncClient closeableHttpAsyncClient,
    SimpleHttpRequest httpGetRequest,
    int i,
    HttpHost httpHost)
    throws URISyntaxException {
  // Update request
  httpGetRequest.removeHeaders("x-req-exec-number");
  httpGetRequest.addHeader("x-req-exec-number", String.valueOf(i));
  log.debug(
      "Executing {} request: {} on host {}",
      httpGetRequest.getMethod(),
      httpGetRequest.getUri(),
      httpHost);

  return closeableHttpAsyncClient.execute(
      httpGetRequest, new SimpleHttpResponseCallback(httpGetRequest, ""));
}

private void handleInterceptorFutureResults(
    Map<Integer, Future<SimpleHttpResponse>> futuresMap, 
    Map<Integer, String> userResponseMap) {
  log.debug("Got {} futures.", futuresMap.size());

  for (Map.Entry<Integer, Future<SimpleHttpResponse>> futureEntry
        : futuresMap.entrySet()) {
    Integer currentRequestId = futureEntry.getKey();
    try {
      userResponseMap.put(currentRequestId, 
                          futureEntry.getValue().get().getBodyText());
    } catch (Exception e) {
      String message 
        = MessageFormat.format("Failed to get user for request id: {0}", 
                                currentRequestId);
      log.error(message, e);
      userResponseMap.put(currentRequestId, message);
    }
  }
}

```

It sends multiple asynchronous HTTP requests with interceptors applied. It initializes a map to store the responses and a map for the futures of each request. Then, it constructs a request with a specified base number and user ID. For each request, it updates the request with the current request ID, executes the request asynchronously using the provided HTTP client, and adds the future to the map. If an exception occurs during execution, it logs the error message. After executing all requests, it retrieves the responses from the futures and populates the response map. Finally, it returns the map containing the request IDs and corresponding responses.

Finally, let's test our logic:

```java
@Test
void getUserWithInterceptors() {
  try (CloseableHttpAsyncClient closeableHttpAsyncClient =
      userHttpRequestHelper.startHttpAsyncInterceptingClient()) {

    int baseNumber = 3;
    int requestExecCount = 5;
    Map<Integer, String> responseBodyMap =
        userHttpRequestHelper.executeRequestsWithInterceptors(
            closeableHttpAsyncClient, 1L, requestExecCount, baseNumber);
    // verify
    assertThat(responseBodyMap)
        .hasSize(requestExecCount)
        .doesNotContainKey(null)
        .doesNotContainValue(null)
        .hasValueSatisfying(getUserErrorCheck);

    String expectedResponse = "Multiple of " + baseNumber;
    for (Integer i : responseBodyMap.keySet()) {
      if (i % baseNumber == 0) {
        assertThat(responseBodyMap).containsEntry(i, expectedResponse);
      }
    }
  } catch (Exception e) {
    Assertions.fail("Failed to execute HTTP request.", e);
  }
}

```

We execute asynchronous HTTP requests with interceptors applied. First, we start a new closeable HTTP async client with interceptors enabled using the `startHttpAsyncInterceptingClient()` method. Then, we define parameters like the base number and request execution count and invoke the `executeRequestsWithInterceptors()` method to send multiple requests asynchronously. After receiving the responses, we verify the size and content of the response map, ensuring that all responses are valid. Finally, we check if the responses contain the expected response for requests where the request ID is a multiple of the base number.

## Conclusion

In this article, we got familiar with the async APIs of Apache HttpClient, and we explored a multitude of essential functionalities vital for interacting with web servers. We learned its key functionalities including basic request processing, content streaming, pipelining, and multiplexing. We learned how to use interceptors to customize request and response processing, enhancing flexibility and control. Overall, the Apache HTTP Async Client is suitable for situations requiring efficient, non-blocking HTTP communication, offering a wide range of features to meet diverse requirements in modern web development.
