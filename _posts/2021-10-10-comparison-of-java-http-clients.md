---
title: "Comparison of Java HTTP Clients"
categories: [java]
date: 2021-10-30 28:00:00 +1000
modified: 2021-10-30 06:00:00 +1000
author: pratikdas
excerpt: "HTTP is a widely used protocol for communication between applications which publish their capabilities in the form of REST APIs. Applications built with Java rely on some form of HTTP client to make API invocations on other applications. A wide array of alternatives exist for choosing an HTTP client. This article aims to provide an overview of the major libraries that are used as HTTP clients in Java applications for making HTTP calls."
image:
  auto: 0074-stack
---
HTTP is a widely used protocol for communication between applications that publish their capabilities in the form of REST APIs. Applications built with Java rely on some form of HTTP client to make API invocations on other applications.

A wide array of alternatives exist for choosing an HTTP client. This article aims to provide an overview of the major libraries which are used as HTTP clients in Java applications for making HTTP calls.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/httpclients" %}

## Different Types of HTTP Clients

The HTTP Clients we will look at in this post are :

1. HttpClient included from Java 11 for applications written in Java 11 and above
2. Apache HTTPClient from Apache HttpComponents project
3. OkHttpClient from [Square](https://developer.squareup.com/)
4. Spring WebClient for Spring Boot Applications


## Native HttpClient for Applications in Java 11 and Above

The native `HttpClient` was introduced as an incubator module in Java 9 and then made generally available in Java 11. Some of its features include:
1. Support for HTTP/1.1 and HTTP/2
2. Support for Synchronous and asynchronous programming models
3. Handling of request and response bodies as reactive-streams
4. Support for cookies.

An example of using `HttpClient` is shown below: 

```java
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpClient.Redirect;
import java.net.http.HttpClient.Version;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;

public class HttpClientApp {
  
  public void invoke() throws URISyntaxException {
    
    HttpClient client = HttpClient.newBuilder()
            .version(Version.HTTP_2)
            .followRedirects(Redirect.NORMAL)
            .build();
    
    HttpRequest request = HttpRequest.newBuilder()
          .uri(new URI(URLConstants.URL))
          .GET()
          .header(URLConstants.API_KEY_NAME, URLConstants.API_KEY_VALUE)
          .timeout(Duration.ofSeconds(10))
          .build();
    
    
    client.sendAsync(request, BodyHandlers.ofString())
        .thenApply(HttpResponse::body)
        .thenAccept(System.out::println)
        .join();
  }

}

```
Here we have used the builder pattern to create instances of `HttpClient` and `HttpRequest` and then made an asynchronous call to the REST API. The constants for the API URL and API keys are stored in`URLConstants` interface.

We should use HttpClient if our application is built using Java 11 and above.


## Apache HttpComponents
HttpComponents is a project under [Apache Software Foundation](http://www.apache.org/) and contains a toolset of low-level Java components for working with HTTP. The components under this project are divided into :
1. **HttpCore**: It is a set of low-level HTTP transport components that can be used to build custom client and server-side HTTP services.
2. **HttpClient**: It is a HTTP compliant HTTP agent implementation based on HttpCore. It also provides reusable components for client-side authentication, HTTP state management, and HTTP connection management. 

For API invocation with HttpClient, first we need to include the Apache HTTP Client 5 libraries using our dependency manager: 

```xml
    <dependency>
      <groupId>org.apache.httpcomponents.client5</groupId>
      <artifactId>httpclient5</artifactId>
      <version>5.1.1</version>
    </dependency>
```
Here we have added the `httpclient5` as a Maven dependency in our `pom.xml`.

A common way to make REST API invocation with the Apache `HttpClient` is shown below:

```java
public class ApacheHttpClientApp {

  
    public void invoke() throws ClientProtocolException, IOException, ParseException {
        
            HttpGet request = new HttpGet(URLConstants.URL);
          // add request headers
            request.addHeader(URLConstants.API_KEY_NAME, URLConstants.API_KEY_VALUE);
            try(
                  CloseableHttpClient httpClient = HttpClients.createDefault();
                
                  CloseableHttpResponse response = httpClient.execute(request);) {

                  // Get HttpResponse Status
                  System.out.println("version "+ response.getVersion());              // HTTP/1.1
                  System.out.println(response.getCode());   // 200
                  System.out.println(response.getReasonPhrase()); // OK
  
                  HttpEntity entity = response.getEntity();
                  if (entity != null) {
                      // return it as a String
                      String result = EntityUtils.toString(entity);
                      System.out.println(result);
                  }

            } 
        
    }
 

}
```
Here we are using the `CloseableHttpClient` to send an asynchronous GET request.

The Apache `HttpClient` is preferred when we need extreme flexibility in configuring the behavior for example providing support for mutual TLS. 


## OkHttpClient
OkHttpClient is an open-source library originally released in 2013 by Square.
For API invocation with `OkHttpClient`, we need to include the `okhttp` libraries using our dependency manager: 

```xml
    <dependency>
      <groupId>com.squareup.okhttp3</groupId>
      <artifactId>okhttp</artifactId>
      <version>4.9.2</version>
    </dependency>
```
Here we have added the `okhttp` module as a Maven dependency in our `pom.xml`.

The below code fragment illustrates the execution of the HTTP `GET` request using the `OkHttpClient` API.
```java
public class OkHttpClientApp {
  
  public void invoke() throws URISyntaxException, IOException {
    OkHttpClient client = new OkHttpClient.Builder()
          .readTimeout(1000, TimeUnit.MILLISECONDS)
          .writeTimeout(1000, TimeUnit.MILLISECONDS)
          .build();

    Request request = new Request.Builder()
      .url(URLConstants.URL)
      .get()
      .addHeader(URLConstants.API_KEY_NAME, URLConstants.API_KEY_VALUE)
      .build();

    Response response = client.newCall(request).execute();
    System.out.println(response.body().string());
  }
}

```

Here we are customizing the client by using the builder pattern to set the timeout values of read and write operations. Next, we are creating the request using the `Request.Builder` for setting the API URL and API keys in the HTTP request header. Then we make a synchronous HTTP call on the client and receive the response.

OkHttp performs best when we create a single `OkHttpClient` instance and reuse it for all HTTP calls in the application. Popular HTTP clients like Retrofit and Picasso used in Android applications use OkHttp underneath.

## Spring WebClient
Spring WebClient is a reactive web client introduced in Spring 5 to replace the older [RestTemplate](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/client/RestTemplate.html) for making REST API calls by applications built with the Spring Boot framework and supports sync, async, and streaming scenarios.

For using WebClient, we need to add a dependency on the Spring WebFlux starter module:

```xml
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-webflux</artifactId>
      <version>2.3.5.RELEASE</version>
    </dependency>
```

Here is a simple example to illustrate its usage:
```java
public class WebClientApp {
  
  public void invoke() {
    WebClient client = WebClient.create();
    
    String response = client.get()
        .uri(URLConstants.URL)
        .header(URLConstants.API_KEY_NAME, URLConstants.API_KEY_VALUE)
        .retrieve()
        .bodyToMono(String.class)
        .block();

  }
  
}

```
Here we are making a GET request to the same REST API used in our earlier examples.

Please refer to an [earlier post](https://reflectoring.io/spring-webclient/) for a more elaborate explanation of using Spring WebClient.

## Conclusion

In this post, we looked at the types of HTTP clients available in the Java ecosystem.

We’d recommend avoiding HttpURLConnection unless you have no alternative, particularly now that the Java 11+ HttpClient is available.

If ultimate flexibility is what you need and you can do without HTTP/2 for the time being, the venerable Apache client may be the one to aim for. You’ll also benefit from its very widespread use and the abundance of information on the internet.

However, all things being equal Square’s OkHttpClient would be our recommendation for teams choosing a new client library. It’s feature-rich, highly configurable, and works well in production out of the box.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/httpclients).