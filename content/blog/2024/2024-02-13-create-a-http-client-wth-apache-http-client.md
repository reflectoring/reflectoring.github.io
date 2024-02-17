---
authors: [sagaofsilence]
title: "Create a Http Client with Apache Http Client"
categories: ["Java"]
date: 2024-02-11 00:00:00 +1100
excerpt: "Get familiar with the Apache Http Client."
image: images/stock/0063-interface-1200x628-branded.jpg
url: create-a-http-client-wth-apache-http-client
---

In this article we're diving deep into the world of Apache HTTP client APIs. We are going to explore the different ways Apache HTTP client enable developers to send and receive data over the internet. From simple GET requests to complex multipart POSTs, we'll cover it all with real-world examples. So get ready to master the art of web communication with Apache HTTP client! 

## Why Should We Care About HTTP Client?
Have you ever wondered how your favorite apps seamlessly fetch data from the internet or communicate with servers behind the scenes? That's where HTTP clients come into play – they're the silent heroes of web communication, doing the heavy lifting so you don't have to.

Imagine you're using a weather app to check the forecast for the day. Behind the scenes, the app sends an HTTP request to a weather service's server, asking for the latest weather data. The server processes the request, gathers the relevant information, and sends back an HTTP response with the forecast. All of this happens in the blink of an eye, thanks to the magic of HTTP clients.

HTTP clients are like digital messengers, facilitating communication between client software and web servers across the internet. They handle all the nitty-gritty details of making connection to server, sending HTTP requests and processing responses, so you can focus on building great software without getting bogged down in the complexities of web communication.

So why should you care about HTTP clients? Well, imagine if every time you wanted to fetch data from a web server or interact with a web service, you had to manually craft and send HTTP requests, then parse and handle the responses – it would be a nightmare! HTTP clients automate all of that for you, making it easy to send and receive data over the web with just a few lines of code.

Whether you're building a mobile app, a web service, or anything in between, HTTP clients are essential tools for interacting with the vast digital landscape of the internet. So the next time you're building software that needs to communicate over the web, remember to tip your hat to the humble HTTP client – they're the unsung heroes of web development!

{{% info title="Examples of HTTP Clients" %}}

There are many Java HTTP clients available. Check this article on [Comparison of Java HTTP Clients](https://reflectoring.io/comparison-of-java-http-clients/) for more details.

{{% /info %}}

## Brief Overview of Apache HTTP Client
Apache HttpClient is a powerful Java library that excels at sending HTTP requests and handling HTTP responses. It has gained popularity due to its open-source nature and its rich set of features that align with the latest HTTP standards.

One of the key strengths of Apache HttpClient is its support for various authentication mechanisms, allowing developers to easily integrate secure authentication into their applications. Additionally, the library offers connection pooling, which can greatly enhance performance by reusing existing connections instead of establishing new ones.

Another notable feature of Apache HttpClient is its ability to intercept requests and responses. This enables developers to modify or inspect the data being sent or received, providing flexibility and control over the communication process.

Furthermore, Apache HttpClient offers seamless integration with other Apache libraries, making it a versatile tool for Java developers. It also provides robust support for the fundamental HTTP methods, ensuring compatibility with a wide range of web services.

## Why Should We Use Apache HTTP Client for HTTP Requests?
Apache HttpClient is often preferred over other Java HTTP clients for several reasons:

1. **Robustness and Stability**: Apache HttpClient has a long history of development and has been thoroughly tested in various environments. It's known for its stability and reliability, making it a trusted choice for mission-critical applications.

2. **Feature-rich**: Apache HttpClient offers a comprehensive set of features for handling HTTP requests and responses. It supports various HTTP methods, authentication mechanisms, connection pooling, request and response interception, and much more.

3. **Flexibility**: Apache HttpClient provides a flexible and extensible architecture that allows developers to customize and extend its functionality as needed. It supports pluggable components such as connection managers, request interceptors, response interceptors, and authentication schemes.

4. **Community Support**: Being part of the Apache Software Foundation, Apache HttpClient benefits from a vibrant and active community of developers and users. This community provides support, documentation, and ongoing development, ensuring that the library stays up-to-date and relevant.

5. **Backward Compatibility**: Apache HttpClient maintains backward compatibility with older versions, ensuring that existing applications can upgrade to newer versions without major code changes. This stability is crucial for long-term maintenance and support of applications.

Overall, Apache HttpClient is a mature and reliable HTTP client library that offers a rich set of features, flexibility, and community support, making it a top choice for Java developers.

{{% github "https://github.com/thombergs/code-examples/tree/master/create-a-http-client-wth-apache-http-client" %}}

<p>

`HttpClient` is a HTTP/1.1 compliant HTTP agent implementation based on HttpCore. It also provides reusable components for client-side authentication, HTTP state management, and HTTP connection management.

Let us know learn how to use Apache HTTP client for web communication. We have grouped the examples under following categories of APIs: classic, async and reactive.

## HttpClient (Classic APIs)
In this section of examples we are going to learn how to use `HttpClient` for sending requests and consuming responses in synchronous mode. The client code will wait until it receives response from the server.

### Basic Handling of HTTP Requests and Responses
The main purpose of `HttpClient` is to perform HTTP methods. We provide a request object to execute, and `HttpClient` sends the request to the server and returns a response object. If the execution fails, it throws an exception. The `HttpClient` interface is main entry point for the HttpClient API.

Let us see this basic ineteraction in action:
```java

/** Demonstrates how to process HTTP responses using the HTTP client. */
public class BasicClientTests {

  @Test
  void executeGetRequest() {
    CloseableHttpResponse closeableHttpResponse = null;
    try (CloseableHttpClient httpclient = HttpClientBuilder.create().build()) {
      
	  // Prepare the request
	  HttpGet httpget = new HttpGet("https://reqres.in/api/users?page=1");
      
      // Execute method and get the response
      closeableHttpResponse = httpclient.execute(httpget);

	  // Process the response
	  HttpEntity respEntity = closeableHttpResponse.getEntity();
      String respStr = EntityUtils.toString(respEntity);
      log.info("Got response: {}", respStr);
	  
    } catch (IOException e) {
      fail("Failed to execute HTTP request.", e);
    } finally {
      if (closeableHttpResponse != null) {
        try {
          closeableHttpResponse.close();
        } catch (IOException e) {
          fail("Failed to close the HTTP response.", e);
        }
      }
    }
  }
}


```
This code snippet demonstrates how to process HTTP responses using the Apache HTTP client in Java. 

We begin by creating an instance of the `CloseableHttpClient` using the `HttpClientBuilder`. This client is responsible for sending HTTP requests and receiving responses.

Next, we prepare an HTTP GET request using the `HttpGet` class, specifying the URL we want to request. In this example, we're fetching data from the "https://reqres.in/api/users?page=1" endpoint.

We then execute the HTTP GET request using the `execute()` method of the `CloseableHttpClient`. This method returns a `CloseableHttpResponse` object representing the response from the server.

To process the response, we extract the response entity using the `getEntity()` method of the `CloseableHttpResponse`. We then convert the entity content to a string using `EntityUtils.toString()`. Finally, we log the response content.

In the `catch` block, we handle any `IOException` that may occur during the execution of the HTTP request, failing the test if an exception is thrown.

In the `finally` block, we ensure that the `CloseableHttpResponse` is closed properly to release any underlying resources.

Overall, this code demonstrates a basic example of sending an HTTP GET request, processing the response, and handling any potential exceptions that may occur during the process.

### Processing HTTP Responses Using a Response Handler
The motivation behind using a response handler in Apache HTTP client is to provide a structured and reusable way to process HTTP responses. 

Response handlers encapsulate the logic for extracting data from HTTP responses, allowing developers to define how to handle different types of responses in a modular and consistent manner. 

By using response handlers, developers can centralize error handling, data extraction, and resource cleanup, resulting in cleaner and more maintainable code. 

Additionally, response handlers promote code reusability, as the same handler can be used across multiple HTTP requests with similar response processing requirements. 

Overall, response handlers enhance the flexibility, readability, and maintainability of code that interacts with HTTP responses using Apache HTTP client.

Let us now see how to process HTTP responses using a response handler:
```java
public class ClientWithResponseHandlerTests {

    @Test
    void executeGetRequest() {
        try (CloseableHttpClient httpclient = HttpClientBuilder.create().build()) {
            HttpGet httpget = new HttpGet("https://reqres.in/api/users?page=1");
            log.debug("Executing request: {}", httpget.getURI());

            // Create a response handler
            ResponseHandler<String> responseHandler = new BasicResponseHandler();
            String responseBody = httpclient.execute(httpget, responseHandler);

            // verify
            assertThat(responseBody).isNotEmpty();
            log.info("Got response: {}", responseBody);
        } catch (IOException e) {
            Assertions.fail(e);
        }
    }
}

```

This code snippet demonstrates how to process HTTP responses using a response handler in the Apache HTTP client.

We begin by creating an instance of the `CloseableHttpClient` using the `HttpClientBuilder`. This client is responsible for sending HTTP requests and receiving responses.

Next, we prepare an HTTP GET request using the `HttpGet` class, specifying the URL we want to request. In this example, we're fetching data from the "https://reqres.in/api/users?page=1" endpoint.

We then create a response handler by instantiating a `BasicResponseHandler`. Response handlers encapsulate the logic for processing HTTP responses, allowing us to define how to handle the response content.

To execute the HTTP request and process the response, we call the `execute()` method of the `CloseableHttpClient`, passing both the `HttpGet` request and the response handler as arguments. This method returns the response body as a string, which we store in the `responseBody` variable.

We then perform a verification on the response body to ensure that it is not empty, using the `assertThat` method from JUnit. Finally, we log the response body for debugging purposes.

In the `catch` block, we handle any `IOException` that may occur during the execution of the HTTP request, failing the test if an exception is thrown.

