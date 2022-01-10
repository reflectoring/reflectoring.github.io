---
title: "Comparison of Java HTTP Clients"
categories: ["Java"]
date: 2021-11-09 06:00:00 +1000
modified: 2021-11-09 06:00:00 +1000
authors: [pratikdas]
excerpt: "This post provides an overview of some of the major libraries that are used as HTTP clients by Java applications for making HTTP calls."
image: images/stock/-1200x628-branded.jpg
 auto: 0046-rack
---
Hypertext Transfer Protocol (HTTP) is an [application-layer](https://en.wikipedia.org/wiki/OSI_model#Layer_7:_Application_Layer) protocol for transmitting hypermedia documents, such as HTML, and API payloads in a standard format like JSON and XML. 

It is a commonly used protocol for communication between applications that publish their capabilities in the form of REST APIs. Applications built with Java rely on some form of HTTP client to make API invocations on other applications.

A wide array of alternatives exist for choosing an HTTP client. This article provides an overview of some of the major libraries which are used as HTTP clients in Java applications for making HTTP calls.

{{% github "https://github.com/thombergs/code-examples/tree/master/http-clients" %}}

## Overview of HTTP Clients

We will look at the following HTTP clients in this post :

1. 'HttpClient' included from Java 11 for applications written in Java 11 and above
2. Apache HTTPClient from [Apache HttpComponents](https://hc.apache.org) project
3. OkHttpClient from [Square](https://developer.squareup.com/)
4. Spring WebClient for [Spring Boot](https://spring.io/projects/spring-boot) applications

In order to cover the most common scenarios we will look at examples of sending asynchronous HTTP `GET` request and synchronous POST request fot each type of client. 

For HTTP `GET` requests, we will invoke an API: `https://weatherbit-v1-mashape.p.rapidapi.com/forecast/3hourly?lat=35.5&lon=-78.5` with API keys created from the API portal. These values are stored in a constants file `URLConstants.java`. The API key and value will be sent as a request header along with the HTTP `GET` requests. 

Other APIs will have different controls for access and the corresponding HTTP clients need to be adapted accordingly.

For HTTP `POST` requests, we will invoke the API: `https://reqbin.com/echo/post/json` which takes a JSON body in the request.

We can observe a common pattern of steps among all the HTTP clients during their usage in our examples:

1. Create an instance of the HTTP client.
2. Create a request object for sending the HTTP request.
3. Make the HTTP call either synchronous or asynchronous.
4. Process the HTTP response received in the previous step.

Let us look at each type of client and understand how to use them in our applications:

## Native HttpClient for Applications in Java 11 and Above

The native `HttpClient` was introduced as an [incubator module in Java 9](https://docs.oracle.com/javase/9/docs/api/jdk/incubator/http/HttpClient.html) and then made generally available in [Java 11](https://docs.oracle.com/en/java/javase/11/docs/api/java.net.http/java/net/http/HttpClient.html) as a part of [JEP 321](https://openjdk.java.net/jeps/321). 

`HTTPClient` replaces the legacy `HttpUrlConnection` class present in the JDK since the early versions of Java.

Some of its features include:

1. Support for HTTP/1.1, [HTTP/2](https://http2.github.io), and Web Socket.
2. Support for synchronous and asynchronous programming models.
3. Handling of request and response bodies as reactive streams.
4. Support for cookies.

### Asynchronous GET Request
An example of using `HttpClient` for making an asynchronous `GET` request is shown below: 

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

```text
Here we have used the builder pattern to create an instance of `HttpClient` and `HttpRequest` and then made an asynchronous call to the REST API. When creating the request, we have set the HTTP method as `GET` by calling the `GET()` method and also set the API URL and API key in the header along with a timeout value of `10` seconds.

### Synchronous POST Request
For HTTP POST and PUT, we call the methods `POST(BodyPublisher body)` and `PUT(BodyPublisher body)` on the builder. The `BodyPublisher` parameter has several out-of-the-box implementations which simplify sending the request body.

```java
public class HttpClientApp {

 public void invokePost() {
  
  try {
   String requestBody = prepareRequest();
   HttpClient client = HttpClient.newHttpClient();
   HttpRequest request = HttpRequest
     .newBuilder()
     .uri(URI.create("https://reqbin.com/echo/post/json"))
     .POST(HttpRequest.BodyPublishers.ofString(requestBody))
     .header("Accept", "application/json")
     .build();

   HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

   System.out.println(response.body());
  } catch (IOException | InterruptedException e) {
   e.printStackTrace();
  }
 }

 private String prepareRequest() throws JsonProcessingException {
  var values = new HashMap<String, String>() {
   {
    put("Id", "12345");
    put("Customer", "Roger Moose");
    put("Quantity", "3");
    put("Price","167.35");
   }
  };

  var objectMapper = new ObjectMapper();
  String requestBody = objectMapper.writeValueAsString(values);
  return requestBody;
 }

}

```text
Here we have created a JSON string in the `prepareRequest()` method for sending the request body in the HTTP `POST()` method. 

Next, we are using the builder pattern to create an instance of `HttpRequest` and then making a synchronous call to the REST API. 

When creating the request, we have set the HTTP method as `POST` by calling the `POST()` method and also set the API URL and body of the request by wrapping the JSON string in a `BodyPublisher` instance.

The response is extracted from the HTTP response by using a `BodyHandler` instance.

Use of `HttpClient` is preferred if our application is built using Java 11 and above.

## Apache HttpComponents
[HttpComponents](https://hc.apache.org/) is a project under the Apache Software Foundation and contains a toolset of low-level Java components for working with HTTP. The components under this project are divided into :

1. **HttpCore**: A set of low-level HTTP transport components that can be used to build custom client and server-side HTTP services.
2. **HttpClient**: An HTTP-compliant HTTP agent implementation based on HttpCore. It also provides reusable components for client-side authentication, HTTP state management, and HTTP connection management. 

### Dependency

For API invocation with HttpClient, first we need to include the Apache HTTP Client 5 libraries using our dependency manager: 

```xml
  <dependency>
   <groupId>org.apache.httpcomponents.client5</groupId>
   <artifactId>httpclient5</artifactId>
   <version>5.1.1</version>
  </dependency>
```text
Here we have added the `httpclient5` as a Maven dependency in our `pom.xml`.

### Asynchronous GET Request

A common way to make asynchronous REST API invocation with the Apache `HttpClient` is shown below:

```java
public class ApacheHttpClientApp {
 
 public void invoke() {
  
  try(
   CloseableHttpAsyncClient client = 
      HttpAsyncClients.createDefault();) {
   client.start();
    
    final SimpleHttpRequest request = 
      SimpleRequestBuilder
      .get()
      .setUri(URLConstants.URL)
      .addHeader(
      URLConstants.API_KEY_NAME, 
      URLConstants.API_KEY_VALUE)
      .build();
    
    Future<SimpleHttpResponse> future = 
     client.execute(request, 
      new FutureCallback<SimpleHttpResponse>() {

       @Override
       public void completed(SimpleHttpResponse result) {
        String response = result.getBodyText();
        System.out.println("response::"+response);
       }

       @Override
       public void failed(Exception ex) {
        System.out.println("response::"+ex);
       }

       @Override
       public void cancelled() {
        // do nothing
       }
        
      });
    
    HttpResponse response = future.get();
    
    // Get HttpResponse Status
    System.out.println(response.getCode()); // 200
    System.out.println(response.getReasonPhrase()); // OK
 
  } catch (InterruptedException 
     | ExecutionException 
     | IOException e) {
    e.printStackTrace();
  } 
 }

}
```text
Here we are creating the client by instantiating the `CloseableHttpAsyncClient` with default parameters within an extended `try` block. 

After that, we start the client. 

Next, we are creating the request using `SimpleHttpRequest` and making the asynchronous call by calling the `execute()` method and attaching a `FutureCallback` class to capture and process the HTTP response.


### Synchronous POST Request
Let us now make a synchronous `POST` Request with Apache HttpClient:

```java
public class ApacheHttpClientApp {
  
  public void invokePost() {
   
    StringEntity stringEntity = new StringEntity(prepareRequest());
    HttpPost httpPost = new HttpPost("https://reqbin.com/echo/post/json");

    httpPost.setEntity(stringEntity);
    httpPost.setHeader("Accept", "application/json");
    httpPost.setHeader("Content-type", "application/json");

    try(
      CloseableHttpClient httpClient = HttpClients.createDefault();
      
      CloseableHttpResponse response = httpClient.execute(httpPost);) {

      // Get HttpResponse Status
      System.out.println(response.getCode());  // 200
      System.out.println(response.getReasonPhrase()); // OK

      HttpEntity entity = response.getEntity();
      if (entity != null) {
        // return it as a String
        String result = EntityUtils.toString(entity);
        System.out.println(result);
      }
    } catch (ParseException | IOException e) {
       e.printStackTrace();
    } 
  }

  private String prepareRequest() {
    var values = new HashMap<String, String>() {
      {
         put("Id", "12345");
         put("Customer", "Roger Moose");
         put("Quantity", "3");
         put("Price","167.35");
      }
    };

    var objectMapper = new ObjectMapper();
    String requestBody;
    try {
      requestBody = objectMapper.writeValueAsString(values);
    } catch (JsonProcessingException e) {
      e.printStackTrace();
    }
    return requestBody;
 }
}

```text
Here we have created a JSON string in the `prepareRequest` method for sending the request body in the HTTP `POST` method. 

Next, we are creating the request by wrapping the JSON string in a `StringEntity` class and setting it in the `HttpPost` class.

We are making a synchronous call to the API by invoking the `execute()` method on the `CloseableHttpClient` class which takes the `HttpPost` object populated with the StringEntity instance as the input parameter. 

The response is extracted from the `CloseableHttpResponse` object returned by the `execute()` method.

The Apache `HttpClient` is preferred when we need extreme flexibility in configuring the behavior for example providing support for mutual TLS. 

## OkHttpClient
OkHttpClient is an open-source library originally released in 2013 by Square.

### Dependency
For API invocation with `OkHttpClient`, we need to include the `okhttp` libraries using our dependency manager: 

```xml
  <dependency>
   <groupId>com.squareup.okhttp3</groupId>
   <artifactId>okhttp</artifactId>
   <version>4.9.2</version>
  </dependency>
```text
Here we have added the `okhttp` module as a Maven dependency in our `pom.xml`.


### Asynchronous GET Request
The below code fragment illustrates the execution of the HTTP `GET` request using the `OkHttpClient` API:

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

    Call call = client.newCall(request);
    call.enqueue(new Callback() {
      public void onResponse(Call call, Response response)
              throws IOException {
        System.out.println(response.body().string());
      }

      public void onFailure(Call call, IOException e) {
        // error
      }
    });

  }
}

```

Here we are customizing the client by using the builder pattern to set the timeout values of read and write operations. 

Next, we are creating the request using the `Request.Builder` for setting the API URL and API keys in the HTTP request header. Then we make an asynchronous HTTP call on the client and receive the response by attaching a `Callback` handler.

### Synchronous POST Request
The below code illustrates executing a synchronous HTTP `POST` request using the `OkHttpClient` API:

```java
public class OkHttpClientApp {

  public void invokePost() throws URISyntaxException, IOException {
    OkHttpClient client = new OkHttpClient.Builder()
            .readTimeout(1000, TimeUnit.MILLISECONDS)
            .writeTimeout(1000, TimeUnit.MILLISECONDS)
            .build();

    //1. Create JSON Request for sending in the POST method 
    String requestBody = prepareRequest();

    //2. Create Request Body
    RequestBody body = RequestBody.create(
            requestBody,
            MediaType.parse("application/json"));

    //3. Create HTTP request 
    Request request = new Request.Builder()
            .url("https://reqbin.com/echo/post/json")
            .post(body)
            .addHeader(URLConstants.API_KEY_NAME, URLConstants.API_KEY_VALUE)
            .build();

    //4. Synchronous call to the REST API
    Response response = client.newCall(request).execute();
    System.out.println(response.body().string());
  }

  // Create JSON string with Jackson library
  private String prepareRequest() throws JsonProcessingException {
    var values = new HashMap<String, String>() {
      {
        put("Id", "12345");
        put("Customer", "Roger Moose");
        put("Quantity", "3");
        put("Price", "167.35");
      }
    };

    var objectMapper = new ObjectMapper();
    String requestBody = objectMapper.writeValueAsString(values);
    return requestBody;
  }
}

```text
Here we have created a JSON string in the `prepareRequest()` method for sending the request body in the HTTP `POST` method. 

Next, we are creating the request using the `Request.Builder` for setting the API URL and API keys in the HTTP request header.

We are then setting this in the `OkHttpClient` request while creating the request using the `Request.Builder` before making a synchronous call to the API by invoking the `newCall()` method on the `OkHttpClient`.


OkHttp performs best when we create a single `OkHttpClient` instance and reuse it for all HTTP calls in the application. Popular HTTP clients like Retrofit and Picasso used in Android applications use OkHttp underneath.

## Spring WebClient
Spring WebClient is an asynchronous, reactive HTTP client introduced in Spring 5 in the Spring WebFlux project to replace the older [RestTemplate](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/client/RestTemplate.html) for making REST API calls in applications built with the Spring Boot framework. It supports synchronous, asynchronous, and streaming scenarios.

### Dependency 
For using `WebClient`, we need to add a dependency on the Spring WebFlux starter module:

```xml
  <dependency>
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-webflux</artifactId>
   <version>2.3.5.RELEASE</version>
  </dependency>
```text
Here we have added a Maven dependency on `spring-boot-starter-webflux` in `pom.xml`. Spring WebFlux is part of Spring 5 and provides support for reactive programming in web applications.

### Asynchronous GET Request
This is an example of an asynchronous GET request made with the WebClient:
```java
public class WebClientApp {
 
 public void invoke() {
  
  WebClient client = WebClient.create();

  client
  .get()
  .uri(URLConstants.URL)
  .header(URLConstants.API_KEY_NAME, URLConstants.API_KEY_VALUE)
  .retrieve()
  .bodyToMono(String.class)
  .subscribe(result->System.out.println(result));

 }
}
```text
In this code fragment, we first create the client with default settings. Next, we call the `get()` method on the client for the HTTP GET request and `uri` and `header` methods for setting the API endpoint URL and access control header. 

The `retrieve()` method called next in the chain is used to make the API call and get the response body which is converted to `Mono` with the `bodyToMono()` method. We finally subscribe in a non-blocking way on the `Mono` wrapper returned by the `bodyToMono()` method using the `subscribe()` method. 

### Synchronous POST Request
Although Spring WebClient is asynchronous, we can still make a synchronous call by calling the `block()` method which blocks the thread until the end of execution. We get the result after the method execution.

Let us see an example of a synchronous POST request made with the WebClient:
```java
public class WebClientApp {

  public void invokePost() {
    WebClient client = WebClient.create();

    String result = client
            .post()
            .uri("https://reqbin.com/echo/post/json")
            .body(BodyInserters.fromValue(prepareRequest()))
            .exchange()
            .flatMap(response -> response.bodyToMono(String.class))
            .block();
    System.out.println("result::" + result);
  }

  private String prepareRequest() {
    var values = new HashMap<String, String>() {
      {
        put("Id", "12345");
        put("Customer", "Roger Moose");
        put("Quantity", "3");
        put("Price", "167.35");
      }
    };

    var objectMapper = new ObjectMapper();
    String requestBody;
    try {
      requestBody = objectMapper.writeValueAsString(values);
    } catch (JsonProcessingException e) {
      e.printStackTrace();
      return null;
    }
    return requestBody;
  }

}
```text
Here we have created a JSON string in the `prepareRequest()` method and then sent this string as the request body in the HTTP `POST` method. 

We have used the `exchange()` method to call the API here. The `exchange()` method provides more control in contrast to the `retrieve()` method used previously by providing access to the response from the HTTP client.

Please refer to an [earlier post](https://reflectoring.io/spring-webclient/) for a more elaborate explanation of using Spring WebClient.

## Which Client to Use?

In this post, we looked at the commonly used HTTP clients in Java applications. We also explored the usage of each of those clients with the help of examples of making HTTP `GET` and `POST` requests. Here is a summary of the important points:

If we do not want to add any external libraries, Java's native `HTTPClient` is the first choice for Java 11+ applications.

Spring WebClient is the preferred choice for Spring Boot applications more importantly if we are using reactive APIs.

Apache HttpClient is used in situations when we want maximum customization and flexibility for configuring the HTTP client. It also has the maximum available documentation on various sites on the internet compared to other libraries due to its widespread use in the community.

Square’s OkHttpClient is recommended when we are using an external client library. It is feature-rich, highly configurable, and has APIs which are easier to use compared to the other libraries, as we saw in the examples earlier.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/http-clients).