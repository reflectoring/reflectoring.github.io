---
title: "Sending HTTP requests with Spring WebClient"
categories: ["Spring Boot"]
date: 2021-05-25T00:00:00
modified: 2021-05-25T00:00:00
authors: [pimterry]
description: "How to get started using Spring WebClient to talk to REST APIs."
image: images/stock/0001-network-1200x628-branded.jpg
url: spring-webclient
---

In Spring 5, Spring gained a reactive web framework: Spring WebFlux. This is designed to co-exist alongside the existing Spring Web MVC APIs, but to add support for non-blocking designs. Using WebFlux, you can build asynchronous web applications, using reactive streams and functional APIs to better support concurrency and scaling.

As part of this, Spring 5 introduced the new `WebClient` API, replacing the existing `RestTemplate` client. Using `WebClient` you can make synchronous or asynchronous HTTP requests with a functional fluent API that can integrate directly into your existing Spring configuration and the WebFlux reactive framework.

In this article we'll look first at how you can start sending simple GET and POST requests to an API with `WebClient` right now, and then discuss how to take `WebClient` further for advanced use in substantial production applications.

## How to Make a GET Request with `WebClient`

Let's start simple, with a plain GET request to read some content from a server or API.

To get started, you'll first need to add some dependencies to your project, if you don't have them already. If you're using Spring Boot you can use [spring-boot-starter-webflux](https://mvnrepository.com/artifact/org.springframework.boot/spring-boot-starter-webflux), or alternatively you can install [spring-webflux](https://mvnrepository.com/artifact/org.springframework/spring-webflux) and [reactor-netty](https://mvnrepository.com/artifact/io.projectreactor.netty/reactor-netty) directly.

The Spring `WebClient` API must be used on top of an existing asynchronous HTTP client library. In most cases that will be Reactor Netty, but you can also use Jetty Reactive HttpClient or Apache HttpComponents, or integrate others by building a custom connector.

Once these are installed, you can send your first GET request in `WebClient`:

```java
WebClient client = WebClient.create();

WebClient.ResponseSpec responseSpec = client.get()
    .uri("http://example.com")
    .retrieve();
```

There's a few things happening here:

* We create a `WebClient` instance
* We define a request using the `WebClient` instance, specifying the request method (GET) and URI
* We finish configuring the request, and obtain a `ResponseSpec`

This is everything required to send a request, but it's important to note that no request has actually been sent at this point! **As a reactive API, the request is not actually sent until something attempts to read or wait for the response.**

How do we do that?

## How to Handle an HTTP Response with `WebClient`

Once we've made a request, we usually want to read the contents of the response.

In the above example, we called `.retrieve()` to get a `ResponseSpec` for a request. This is an asynchronous operation, which doesn't block or wait for the request itself, which means that on the following line the request is still pending, and so we can't yet access any of the response details.

Before we can get a value out of this asynchronous operation, you need to understand the [Flux](https://projectreactor.io/docs/core/release/reference/#flux) and [Mono](https://projectreactor.io/docs/core/release/reference/#mono) types from Reactor.

### Flux

A `Flux` represents a stream of elements. It's a sequence that will asynchronously emit any number of items (0 or more) in the future, before completing (either successfully or with an error).

In reactive programming, this is our bread-and-butter. A `Flux` is a stream that we can transform (giving us a new stream of transformed events), buffer into a List, reduce down to a single value, concatenate and merge with other Fluxes, or block on to wait for a value.

### Mono

A Mono is a specific but very common type of `Flux`: a `Flux` that will asynchronously emit either 0 or 1 results before it completes.

In practice, it's similar to Java's own `CompletableFuture`: it represents a single future value.

If you'd like more background on these, take a look at [Spring's own docs](https://spring.io/blog/2016/04/19/understanding-reactive-types) which explain the Reactive types and their relationship to traditional Java types in more detail.

### Reading the Body

To read the response body, we need to get a `Mono` (i.e: an async future value) for the contents of the response. We then need to unwrap that somehow, to trigger the request and get the response body content itself, once it's available.

There are a few different ways to unwrap an asynchronous value. To start with, we'll use the simplest traditional option, by blocking to wait for the data to arrive:

```java
String responseBody = responseSpec.bodyToMono(String.class).block();
```

This gives us a string containing the raw body of the response. It's possible to pass different classes here to parse content automatically into an appropriate format, or to use a `Flux` here instead to receive a stream of response parts (for example from an event-based API), but we'll come back to that in just a minute.

Note that we're not checking the status here ourselves. When we use `.retrieve()`, the client automatically checks the status code for us, providing a sensible default by throwing an error for any 4xx or 5xx responses. We'll talk about custom status checks & error handling later on too.

## How to Send a Complex POST Request with `WebClient`

We've seen how to send a very basic GET request, but what happens if we want to send something more advanced?

Let's look at a more complex example:

```java
MultiValueMap<String, String> bodyValues = new LinkedMultiValueMap<>();

bodyValues.add("key", "value");
bodyValues.add("another-key", "another-value");

String response = client.post()
    .uri(new URI("https://httpbin.org/post"))
    .header("Authorization", "Bearer MY_SECRET_TOKEN")
    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
    .accept(MediaType.APPLICATION_JSON)
    .body(BodyInserters.fromFormData(bodyValues))
    .retrieve()
    .bodyToMono(String.class)
    .block();
```

As we can see here, `WebClient` allows us to configure headers by either using dedicated methods for common cases (`.contentType(type)`) or generic keys and values (`.header(key, value)`).

In general, using dedicated methods is preferable, as their stricter typings will help us provide the right values, and they include runtime validation to catch various invalid configurations too.

This example also shows how to add a body. There are a few options here:

* We can call `.body()` with a `BodyInserter`, which will build body content for us from form values, multipart values, data buffers, or other encodeable types.
* We can call `.body()` with a `Flux` (including a `Mono`), which can stream content asynchronously to build the request body.
* We can call `.bodyValue(value)` to provide a string or other encodeable value directly.

Each of these has different use cases. Most developers who aren't familiar with reactive streams will find the Flux API unhelpful initially, but as you invest more in the reactive ecosystem, asynchronous chains of streamed data like this will begin to feel more natural.

## How to Take Spring `WebClient` into Production

The above should be enough to get you create and send basic requests and read responses, but there are a few more topics we need to cover if you want to build substantial applications on top of this.

### Reading Response Headers

Until now, we've focused on reading the response body, and ignored the headers. A lot of the time that's fine, and the important headers will be handled for us, but you will find that many APIs include valuable metadata in their response headers, not just the body.

This data is easily available within the `WebClient` API too, using the `.toEntity()` API, which gives us a [ResponseEntity](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ResponseEntity.html), wrapped in a `Mono`.

This allows us to examine response headers:

```java
ResponseEntity<String> response = client.get()
    // ...
    .retrieve()
    .toEntity(String.class)
    .block();

HttpHeaders responseHeaders = response.getHeaders();

List<String> headerValue = responseHeaders.get("header-name");
```

### Parsing Response Bodies

In the examples above, we've handled responses as simple strings, but Spring can also automatically parse these into many higher-level types for you, by providing a more specific type when reading the response, like so:

```java
Mono<Person> response = client.post()
    // ...
    .retrieve()
    .bodyToMono(Person.class)
```

Which classes can be converted depends on the `HttpMessageReaders` that are available. By default, the supported formats include:

* Conversion of any response to `String`, `byte[]`, `ByteBuffer`, `DataBuffer` or `Resource`
* Conversion of `application/x-www-form-urlencoded` responses into `MultiValueMap<String,String>>`
* Conversion of `multipart/form-data` responses into `MultiValueMap<String, Part>`
* Deserialization of JSON data using Jackson, if available
* Deserialization of XML data using Jackson's XML extension or JAXB, if available

This can also use the standard `HttpMessageConverter` configuration registered in your Spring application, so message converters can be shared between your WebMVC or WebFlux server code and your `WebClient` instances. If you're using Spring Boot, you can use [the pre-configured WebClient.Builder instance](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-webclient) to get this set up automatically.

For more details, take a look at the [Spring WebFlux codecs documentation](https://docs.spring.io/spring-framework/docs/current/reference/html/web-reactive.html#webflux-codecs).

### Manually Handling Response Status

By default `.retrieve()` will check for error status for you. That's fine for simple cases, but you're likely to find many REST APIs that encode more detailed success information in their status codes (for example returning 201 or 202 values), or APIs where you want to add custom handling for some error status.

It's possible to read the status from the `ResponseEntity` like we did for the headers, but that's only useful for accepted statuses, since and error status will throw the error before we receive the entity in that case.

To handle those types of status codes ourselves, we need to add an [`onStatus`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/reactive/function/client/WebClient.ResponseSpec.html#onStatus-java.util.function.Predicate-java.util.function.Function-) handler. This handler can match certain status code, and return a `Mono<Throwable>` (to control the specific error thrown) or `Mono.empty()` to stop that error code from being treated as an error.

It works like so:

```java
ResponseEntity response = client.get()
    // ...
    .retrieve()
    // Don't treat 401 responses as errors:
    .onStatus(
        status -> status == HttpStatus.NOT_FOUND,
        clientResponse -> Mono.empty()
    )
    .toEntity(String.class)
    .block();

// Manually check and handle the relevant status codes:
if (response.getStatusCode() == HttpStatus.NOT_FOUND) {
    // ...
} else {
    // ...
}
```

### Making Fully Asynchronous Requests

Up until this point we've called `.block()` on every response, blocking the thread completely to wait for the response to arrive.

Within a traditional heavily threaded architecture that might fit quite naturally, but in a non-blocking design we need to avoid these kinds of blocking operations wherever possible.

As an alternative, we can handle requests by weaving transforms around our `Mono` or `Flux` values to handle and combine values as they're returned, and then pass these `Flux`-wrapped values into other non-blocking APIs, all fully asynchronously.

There isn't space here to fully explain this paradigm or WebFlux from scratch, but an example of doing so with `WebClient` might look like this:

```java
@GetMapping("/user/{id}")
private Mono<User> getUserById(@PathVariable String id) {
    // Load some user data asynchronously, e.g. from a DB:
    Mono<BaseUserInfo> userInfo = getBaseUserInfo(id);

    // Load user data with WebClient from a separate API:
    Mono<UserSubscription> userSubscription = client.get()
        .uri("http://subscription-service/api/user/" + id)
        .retrieve()
        .bodyToMono(UserSubscription.class);

    // Combine the monos: when they are both done, take the
    // data from each and combine it into a User object.
    Mono<User> user = userInfo
        .zipWith(userSubscription)
        .map((tuple) -> new User(tuple.getT1(), tuple.getT2());

    // The resulting mono of combined data can be returned immediately,
    // without waiting or blocking, and WebFlux will handle sending
    // the response later, once all the data is ready:
    return user;
}
```

### Testing with Spring `WebTestClient`

In addition to `WebClient`, Spring 5 includes `WebTestClient` which provides an interface extremely similar to `WebClient` but designed for convenient testing of server endpoints.

We can set this up either by creating a `WebTestClient` that's bound to a server and sending real requests over HTTP, or one that's bound to a single `Controller`, `RouterFunction` or `WebHandler` to run integration tests using mock request & response objects.

That looks like this:

```java
// Connect to a real server over HTTP:
WebTestClient client = WebTestClient
    .bindToServer()
    .baseUrl("http://localhost:8000")
    .build();

// Or connect to a single WebHandler using mock objects:
WebTestClient client = WebTestClient
    .bindToWebHandler(handler)
    .build();
```

Once we've created a WebTestClient, we can define requests just like any other `WebClient`.

To send the request and check the result, we call `.exchange()` and then use the assertion methods available there:

```java
client.get()
    .uri("/api/user/123")
    .exchange()
    .expectStatus().isNotFound(); // Assert that this is a 404 response
```

There's a wide variety of assertion methods to check the response status, headers and body - see [the JavaDoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/web/reactive/server/WebTestClient.ResponseSpec.html) for the full list.

## Inspecting and Mocking `WebClient` HTTP Traffic with HTTP Toolkit

After you've deployed your `WebClient` code, you need to be able to debug it. HTTP requests are often the linchpin within complex interactions, and they can fail in many interesting ways. It's useful to be able to see the requests and responses your client is working with to understand what your system is doing, and injecting your own data or errors can be a powerful technique for manual testing.

To do this, you can use [HTTP Toolkit](https://httptoolkit.tech/java/), a cross-platform open-source tool that can capture traffic from a wide variety of Java HTTP clients, and which includes a specific integration to automatically intercept Spring `WebClient`.

Once you have HTTP Toolkit installed, the next step is to intercept your Java HTTP traffic. To do so you can either:

* Click the 'Fresh Terminal' button in HTTP Toolkit to open a terminal, and launch your application from there; or
* Start your application as normal, then click the 'Attach to JVM' button in HTTP Toolkit to attach to the already running JVM

Once you've intercepted your traffic, you can inspect every request and response sent by your application from the 'View' page inside HTTP Toolkit:

![HTTP Toolkit inspecting HTTP requests]({{ base }}/assets/images/posts/http_toolkit.png)

You can also add rules from the 'Mock' page, to interactively mock HTTP responses, breakpoint requests, or inject errors like connection failures and timeouts.

## Conclusion

In this article we've looked at everything you need to get started using Spring `WebClient`. WebFlux and `WebClient` are mature powerful APIs with a lot to offer on top of the classic Spring feature set. Give them a try in your application today!
