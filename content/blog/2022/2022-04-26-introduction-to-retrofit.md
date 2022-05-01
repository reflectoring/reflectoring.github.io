---
title: "Create a Http Client with OkHttp and Retrofit"
categories: ["Java"]
date: 2022-04-26 00:00:00 +1100
modified: 2022-04-26 00:00:00 +1100
authors: ["ranjani"]
description: "Introduction to a type-safe HTTP Client OkHttp and Retrofit"
image: images/stock/0006-library-1200x628-branded.jpg
url: introduction-to-retrofit
---

Developers use HTTP Clients to communicate with other applications over the network. 
Over the years, multiple [HTTP Clients](https://reflectoring.io/comparison-of-java-http-clients/) have been developed to suit varying application needs.

In this article, we will focus on `Retrofit`, one of the most popular type-safe Http Client for Java and Android.

{{% github "https://github.com/thombergs/code-examples/tree/master/java/retrofit" %}}

## What is `OkHttp`
[OkHttp](https://square.github.io/okhttp/) is an efficient HttpClient developed by Square. Some of its key advantages are:
- HTTP/2 support
- Connection pooling (helps reduce request latency)
- GZIP compression (saves bandwidth and speeds up interaction)
- Response Caching
- Silent recovery from connection problems
- Support for synchronous and asynchronous calls

## What is `Retrofit`
[Retrofit](https://square.github.io/retrofit/) is a high-level REST abstraction built on top of OkHttp. 
When used to call REST applications, it greatly simplifies API interactions by parsing requests and responses into POJOs.

In the further sections, we will work on creating a Retrofit client and look at how to incorporate the various features that OkHttp provides.

## Setting up an existing REST Service Application
We will use a sample REST-based [Spring Boot Library Application](https://github.com/ranjanih/code-examples/tree/ranjani-retrofit/core-java/retrofit/introduction-to-retrofit/SimpleLibraryApplication) that will serve as a REST service.
This library application is a Spring Boot service that uses Maven for build and HSQLDB as the underlying database.
We will use the maven wrapper bundled with the application to start the service
````text
    mvnw clean verify spring-boot:run (for Windows)
    ./mvnw clean verify spring-boot:run (for Linux)
````
Now, the application should successfully start
{{% image alt="settings" src="images/posts/retrofit/success_at_startup.jpg" %}}

The Swagger documentation of this application can be viewed at 
````text
    http://localhost:8090/swagger-ui.html
````
The documentation should look like this:
{{% image alt="settings" src="images/posts/retrofit/swagger-doc.jpg" %}}

Before we use swagger to make REST calls, we will need to add basic authentication credentials. (The credentials are configured in application.yaml)
{{% image alt="settings" src="images/posts/retrofit/basic-auth.jpg" %}}

We should be able to hit the REST endpoints successfully now. (Sample JSON requests are available in README.md file in the application codebase.)
{{% image alt="settings" src="images/posts/retrofit/POST.jpg" %}}
{{% image alt="settings" src="images/posts/retrofit/POST-response.jpg" %}}

Once successfully posted, we should now be able to make a GET call to confirm
{{% image alt="settings" src="images/posts/retrofit/GET-response.jpg" %}}

Now that our REST service works as expected, we will move on to setup another application that will act as a REST client making calls to this service.
In the process, we will learn about Retrofit and its various features.

## Introduction to REST Client Application
The REST Client application will be a [Spring Boot Library Audit application]((https://github.com/ranjanih/code-examples/tree/ranjani-retrofit/core-java/retrofit/introduction-to-retrofit/AuditApplication)) that exposes REST endpoints and uses Retrofit to call another REST service. The result is then audited in an in-memory database for tracking purposes.

## Adding Retrofit dependencies
### Maven
````text
        <dependency>
			<groupId>com.squareup.retrofit2</groupId>
			<artifactId>retrofit</artifactId>
			<version>2.5.0</version>
		</dependency>
		<dependency>
			<groupId>com.squareup.retrofit2</groupId>
			<artifactId>converter-jackson</artifactId>
			<version>2.5.0</version>
		</dependency>
````
### Gradle
````text
        dependencies {  
            implementation 'com.squareup.retrofit2:retrofit:2.5.0'
            implementation 'com.squareup.retrofit2:converter-jackson:2.5.0'
        }
````

## Setting Up a Retrofit Client

Every Retrofit client needs to follow the three steps listed below:

### Creating the model objects for Retrofit
We will take the help of the Swagger documentation in our REST service to create model objects for our Retrofit client.
{{% image alt="settings" src="images/posts/retrofit/swagger-models.jpg" %}}

We will now create corresponding model objects in our client application
````java
@Getter
@Setter
@NoArgsConstructor
public class AuthorDto {

    @JsonProperty("id")
    private long id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("dob")
    private String dob;

}
````

````java
@Getter
@Setter
@NoArgsConstructor
public class BookDto {
    @JsonProperty("bookId")
    private long id;

    @JsonProperty("bookName")
    private String name;

    @JsonProperty("publisher")
    private String publisher;

    @JsonProperty("publicationYear")
    private String publicationYear;

    @JsonProperty("isCopyrighted")
    private boolean copyrightIssued;

    @JsonProperty("authors")
    private Set<AuthorDto> authors;
}

````
````java
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LibResponse {
    private String responseCode;

    private String responseMsg;
}
````

### Creating the client interface
To create the retrofit interface, we will map every service call with an individual interface method.
In the screenshot below, we can see that the REST service has configured 4 REST endpoints.
In our client application, we will create corresponding 4 interface methods.

{{% image alt="settings" src="images/posts/retrofit/REST.jpg" %}}

````java
public interface LibraryClient {

    @GET("/library/managed/books")
    Call<List<BookDto>> getAllBooks(@Query("type") String type);

    @POST("/library/managed/books")
    Call<LibResponse> createNewBook(@Body BookDto book);

    @PUT("/library/managed/books/{id}")
    Call<LibResponse> updateBook(@Path("id") Long id, @Body BookDto book);

    @DELETE("/library/managed/books/{id}")
    Call<LibResponse> deleteBook(@Path("id") Long id);
}
````
We will deep-dive into the annotations and Retrofit classes in the further sections.

### Creating a Retrofit.Builder class as a Spring Boot Configuration bean 
We will use the Retrofit Builder API to define URL for HTTP operations.

````java
@Configuration
@EnableConfigurationProperties(ClientConfigProperties.class)
public class RestClientConfiguration {

    @Bean
    public LibraryClient libraryClient(ClientConfigProperties props) {
        OkHttpClient.Builder httpClientBuilder = new OkHttpClient.Builder()
                .addInterceptor(new BasicAuthInterceptor(props.getUsername(), props.getPassword()))
                .connectTimeout(props.getConnectionTimeout(), TimeUnit.SECONDS)
                .readTimeout(props.getReadWriteTimeout(), TimeUnit.SECONDS);

        return new Retrofit.Builder().client(httpClientBuilder.build())
                .baseUrl(props.getEndpoint())
                .addConverterFactory(JacksonConverterFactory.create(new ObjectMapper()))
                .build().create(LibraryClient.class);

    }

}
````

## Using Retrofit
In the further sections we will learn more about the Retrofit API and how to use them. 

### Building a REST Client (interface) with Retrofit and OkHttp
In this section, we will look at how to build the client interface.
Retrofit supports annotations @GET, @POST, @PUT, @DELETE, @PATCH, @OPTIONS, @HEAD which we use to annotate our client methods as shown below

````text
    @GET("/library/managed/books")
    Call<List<BookDto>> getAllBooks(@Query("type") String type);
````

Further, we specify the relative path of the REST service endpoint. To make this relative URL more dynamic we could have 
parameter replacement blocks as shown below:
````text
    @PUT("/library/managed/books/{id}")
    Call<LibResponse> updateBook(@Path("id") Long id, @Body BookDto book);
````
To pass the actual value of `id`, we set it as @Path so that the call execution will replace `{id}` with its corresponding value.

We can specify the query parameters in the URL directly or add @Query param to the method.
````text
    @GET("/library/managed/books?type=all")
    OR
    @GET("/library/managed/books")
    Call<List<BookDto>> getAllBooks(@Query("type") String type);
````
If the request needs to have multiple query parameters, we could use @QueryMap
````text
   @GET("/library/managed/books")
    Call<List<BookDto>> getAllBooks(@QueryMap Map<String, String> options);
````
To specify an object as HTTP request body, we use the @Body annotation.
````text
    @POST("/library/managed/books")
    Call<LibResponse> createNewBook(@Body BookDto book);
````
To the Retrofit interface methods, we can specify static or dynamic header parameters
For static headers, we have
````text
    @Headers("Accept: application/json")
    @GET("/library/managed/books")
    Call<List<BookDto>> getAllBooks(@Query("type") String type);
````
To specify multiple static headers, we could use
````text
    @Headers({
        "Accept: application/json",
        "Cache-Control: max-age=640000"})
    @GET("/library/managed/books")
    Call<List<BookDto>> getAllBooks(@Query("type") String type);
````
In cases where we need to pass dynamic headers, we pass them as parameters.
````text
    @GET("/library/managed/books/{requestId}")
    Call<BookDto> getAllBooksWithHeaders(@Header("requestId") String requestId);
````
For multiple dynamic headers, we use @HeaderMap.
All Retrofit responses are wrapped in a `Call` object. This helps control if the client requests need to be made synchronously or asynchronously.

## Using the Retrofit Builder API to setup Client Configuration
The Builder API on Retrofit allows for customization of the Configuration object. We will take a closer look at some of the configuration options






