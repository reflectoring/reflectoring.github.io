---
authors: [sagaofsilence]
title: "Apache HTTP Client Configuration"
categories: ["Java"]
date: 2024-02-11 00:00:00 +1100
excerpt: "Apache HTTP Client Configuration."
image: images/stock/0063-interface-1200x628-branded.jpg
url: apache-http-client-config
---

Configuring Apache HTTP Client is essential for tailoring its behavior to meet specific requirements and optimize performance. From setting connection timeouts to defining proxy settings, configuration options allow developers to fine-tune the client's behavior according to the needs of their application. In this section, we will explore various configuration options available in Apache HTTP Client, covering aspects such as connection management, request customization, authentication, and error handling. Understanding how to configure the client effectively empowers developers to build robust and efficient HTTP communication within their applications.

## The "Create a HTTP Client with Apache HTTP Client" Series

This article is the second part of a series:

1. [Introduction to Apache HTTP Client](/create-a-http-client-with-apache-http-client/)
2. [Apache HTTP Client Configuration](/apache-http-client-config/)
3. [Classic APIs Offered by Apache HTTP Client](/apache-http-client-classic-apis/)
4. [Async APIs Offered by Apache HTTP Client](/apache-http-client-async-apis/)
5. [Reactive APIs Offered by Apache HTTP Client](/apache-http-client-reactive-apis/)

{{% github "https://github.com/thombergs/code-examples/tree/master/create-a-http-client-wth-apache-http-client" %}}

\
Let us now learn how to configure Apache HTTP client for web communication.

## HttpClient Client Connection Management
Connection management in Apache HTTP Client refers to the management of underlying connections to remote servers. Efficient connection management is crucial for optimizing performance and resource utilization. Apache HTTP Client provides various options for configuring connection management.

`PoolingHttpClientConnectionManager` manages a pool of client connections and is able to service connection requests from multiple execution threads. Connections are pooled on a per route basis.

`PoolingHttpClientConnectionManager` maintains a maximum limit of connections on a per route basis and in total. By default it creates up to 2 concurrent connections per given route and up to 20 connections in total. For real-world applications we cam increase these limits if needed.

This example shows how the connection pool parameters can be adjusted:

```java
  public CloseableHttpClient getPooledCloseableHttpClient(
      final String host,
      int port,
      int maxTotalConnections,
      int defaultMaxPerRoute,
      long requestTimeoutMillis,
      long responseTimeoutMillis,
      long connectionKeepAliveMillis) {
    PoolingHttpClientConnectionManager connectionManager =
        new PoolingHttpClientConnectionManager();
    connectionManager.setMaxTotal(maxTotalConnections);
    connectionManager.setDefaultMaxPerRoute(defaultMaxPerRoute);

    Timeout requestTimeout = Timeout.ofMilliseconds(requestTimeoutMillis);
    Timeout responseTimeout = Timeout.ofMilliseconds(responseTimeoutMillis);
    TimeValue connectionKeepAlive 
      = TimeValue.ofMilliseconds(connectionKeepAliveMillis);
    RequestConfig requestConfig =
        RequestConfig.custom()
            .setConnectionRequestTimeout(requestTimeout)
            .setResponseTimeout(responseTimeout)
            .setConnectionKeepAlive(connectionKeepAlive)
            .build();

    HttpHost httpHost = new HttpHost(host, port);
    connectionManager.setMaxPerRoute(new HttpRoute(httpHost), 50);
    return HttpClients.custom()
        .setDefaultRequestConfig(requestConfig)
        .setConnectionManager(connectionManager)
        .build();
  }
```
This code snippet creates a customized `CloseableHttpClient` with specific connection pool properties. It first initializes a `PoolingHttpClientConnectionManager` and configures the maximum total connections and default connections per route. Then, it sets timeout values for connection requests and responses, as well as the duration for keeping connections alive.

The `RequestConfig` is configured with the specified timeout values and connection keep-alive duration. It then creates an `HttpHost` based on the provided host and port.

Finally, it sets the maximum connections per route for the specified host and port, and builds the `CloseableHttpClient` with the custom request configuration and connection manager.

This customized `CloseableHttpClient` is useful for controlling connection pooling behavior, managing timeouts, and optimizing resource utilization in HTTP communication.

### Connection Pooling
Apache HTTP Client utilizes connection pooling to reuse existing connections instead of establishing a new connection for each request. This minimizes the overhead of creating and closing connections, resulting in improved performance.

### Max Connections
Developers can specify the maximum number of connections allowed per route or per client. This prevents resource exhaustion and ensures that the client operates within specified limits.

### Connection Timeout
It defines the maximum time allowed for establishing a connection with the server. Setting an appropriate connection timeout prevents the client from waiting indefinitely for a connection to be established.

### Socket Timeout
Socket timeout specifies the maximum time allowed for data transfer between the client and the server. It prevents the client from blocking indefinitely if the server is unresponsive or the network is slow.

### Connection Keep-Alive
Keep-Alive is a mechanism that allows multiple requests to be sent over the same TCP connection, thus reducing the overhead of establishing new connections. Apache HTTP Client supports Keep-Alive by default, but developers can configure its behavior according to their requirements.

By understanding and configuring connection management settings, developers can optimize resource utilization, improve performance, and ensure the robustness of their HTTP communication.

## Caching Configuration
The caching HttpClient inherits all configuration options and parameters of the default non-caching implementation (this includes setting options like timeouts and connection pool sizes). For caching specific configuration, you can provide a CacheConfig instance to customize behavior.

First of all, we need to add the maven dependency for Apache HTTP client cache.
```xml
<dependency>
    <groupId>org.apache.httpcomponents.client5</groupId>
    <artifactId>httpclient5-cache</artifactId>
    <version>5.3.1</version>
</dependency>

``` 

Here is an example to build a client supporting cache:

```java
CacheConfig cacheConfig =  CacheConfig.custom()
                                      .setMaxCacheEntries(maxCacheEntries)
                                      .setMaxObjectSize(maxObjectSize)
                                      .build();
CachingHttpClientBuilder builder = CachingHttpClients.custom(); 
CloseableHttpClient client = builder.setCacheConfig(cacheConfig).build();

```

This code snippet first creates a `CacheConfig` object using the `CacheConfig.custom()` builder method. This configures parameters such as the maximum number of cache entries (`maxCacheEntries`) and the maximum size of cached objects (`maxObjectSize`).

Next, it creates a `CachingHttpClientBuilder` and set the `CacheConfig` object to the builder using `builder.setCacheConfig(cacheConfig)`.

Finally, it builds the `CloseableHttpClient` by calling `builder.build()`, which creates an HTTP client with caching enabled according to the specified configuration.

This setup enables caching of HTTP responses, which can improve performance by serving cached responses for repeated requests, reducing the need for repeated network requests and server processing.

## Configuring Request Interceptors
A custom request interceptor in Apache HttpClient allows developers to intercept outgoing HTTP requests before they are sent to the server. This interceptor can modify the request headers, request parameters, or even the entire request body based on specific requirements. For example, it can add authentication headers, logging headers, or handle request retries.

Here is an example to build a client supporting request interception:
```java
public class CustomHttpRequestInterceptor implements HttpRequestInterceptor {
  @Override
  public void process(HttpRequest request, EntityDetails entity, HttpContext context)
      throws HttpException, IOException {
    request.setHeader("x-request-id", UUID.randomUUID().toString());
    request.setHeader("x-api-key", "secret-key");
  }
}
```

The `CustomHttpRequestInterceptor` implements the `HttpRequestInterceptor` interface provided by Apache HttpClient. This interceptor is designed to intercept outgoing HTTP requests before they are sent to the server. In the `process()` method the interceptor modifies the request object by adding custom headers. In this specific implementation,
 it sets `x-request-id` header to a randomly generated UUID string. We commonly use such header to uniquely identify each request, which can be helpful for tracking and debugging purposes. Then it sets `x-api-key header` to a predefined secret key. This header would be used for authentication or authorization purposes, allowing the server to verify the identity of the client making the request.
 
Overall, this interceptor enhances outgoing HTTP requests by adding custom headers, which can serve various purposes such as request identification, security, or API key authentication.

Now let us build a HTTP client using this request interceptor:
``` java
HttpRequestInterceptor interceptor = new CustomHttpRequestInterceptor();
HttpClientBuilder builder = HttpClients.custom();
CloseableHttpClient client = builder.addRequestInterceptorFirst(interceptor).build();

```

In this code snippet, we first create an instance of `CustomHttpRequestInterceptor` to customize outgoing HTTP requests. Then we build the client using `HttpClientBuilder`.

Then we call `addRequestInterceptorFirst()` method passing the interceptor object as an argument. This method adds the `CustomHttpRequestInterceptor` as the first request interceptor in the chain of interceptors. It also has a method `addRequestInterceptorLast()` to add the interceptor at the end.

By adding the interceptor first, it ensures that the custom headers set by the `CustomHttpRequestInterceptor` will be included in all outgoing HTTP requests made by the HttpClient instance. Finally, it calls the `build()` method to create the `CloseableHttpClient` instance with the configured request interceptor.

## Configuring Execution Interceptors
On the other hand, an execution interceptor allows developers to intercept the execution of HTTP requests and responses. It operates at a lower level compared to request interceptors and can intercept various stages of the request execution process, such as before sending the request, after receiving the response, or when an exception occurs during execution. Execution interceptors can be used for tasks like logging, caching, or error handling. They provide finer-grained control over the HTTP request execution process and enable developers to implement custom logic based on specific requirements or conditions.

Here is an example to build a client supporting cache:
```java

```


## Conclusion
TODO.
