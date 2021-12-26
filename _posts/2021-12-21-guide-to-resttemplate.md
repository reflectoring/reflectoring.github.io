---
title: "Exhaustive Guide to Spring RestTemplate"
categories: [spring-boot]
date: 2021-12-21 06:00:00 +1000
modified: 2021-12-21 06:00:00 +1000
author: pratikdas
excerpt: "REST styled APIs are all around us and as such most applications need to invoke REST APIs for some or all of their functions. These REST APIs could be either of their own or from other sources. Hence applications need to consume APIs elegantly and consistently. RestTemplate is a library of Spring that helps us to do just that. In this article, we will understand the different methods of invoking REST API with Spring RestTemplate."
image:
  auto: 0074-stack
---

REST-styled APIs are all around us. Hence many applications need to invoke REST APIs for some or all of their functions. These REST APIs could be either of their own or from other sources. Hence for applications to function gracefully, they need to consume APIs elegantly and consistently.

`RestTemplate` is a class within the Spring framework that helps us to do just that. In this article, we will understand how to use `RestTemplate` for invoking REST APIs of different shapes.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/resttemplate" %}

## What is Spring RestTemplate

According to the official [documentation](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/client/RestTemplate.html), `RestTemplate` is a synchronous client to perform HTTP requests. 

It is a higher-order API since it performs HTTP requests by using an HTTP client library like the JDK HttpURLConnection, Apache HttpClient, and others.

The HTTP client library takes care of all the low-level details of communication over HTTP while the `RestTemplate` adds the capability of transforming the request and response in JSON or XML to Java objects.
By default, `RestTemplate` uses the class `java.net.HttpURLConnection` as the HTTP client. However, we can switch to another HTTP client library which we will see in a later section. 

Starting with Spring 5, the `RestTemplate` class is in maintenance mode. The non-blocking and [reactive](https://spring.io/reactive) `WebClient` is provided by the framework as a modern alternative to the `RestTemplate`. `WebClient` offers support for both synchronous and asynchronous HTTP requests and streaming scenarios. Therefore, `RestTemplate` will be marked as deprecated in a future version of the Spring Framework and will not contain any new functionalities.


## Some useful methods of RestTemplate

Before looking at the examples, it will be helpful to take a look at the important methods of the `RestTemplate` class.

`RestTemplate` provides higher-level methods for each of the HTTP methods which make it easy to invoke  RESTful services.

The names of the methods are based on a naming convention:
* the first part in the name indicates the HTTP method being invoked
* the second part in the name indicates returned element. 

For example, the method `getForObject()` will perform a GET and return an object. 

**getForEntity()**: This method executes a GET request and returns an object of ResponseEntity class that contains both the status code and the resource as an object. 

**getForObject()** : This is similar to `getForEntity()`, but returns the resource directly. 

**exchange()**: This method executes a specified HTTP method, such as GET, POST, PUT, etc, and returns a ResponseEntity containing both the HTTP status code and the resource as an object.

**execute()** : This method is similar to the `exchange` method, but takes additional parameters: `RequestCallback` and `ResultSetExtractor`. 

**headForHeaders()**: This method executes a HEAD request and returns all HTTP headers for the specified URL. 

**optionsForAllow()**: This method executes an OPTIONS request and uses the Allow header to return the HTTP methods that are allowed under the specified URL.

**delete()** : Deletes the resources at the given URL. It uses the HTTP DELETE method.

put(): It creates a new resource or update for the given URL using the HTTP PUT method.

**postForObject()** : This method creates a new resource using HTTP POST method and returns an entity.

**postForLocation()**: This method creates a new resource using the HTTP POST method and returns the location of the newly created resource.

For additional information on the methods of `RestTemplate`, please refer to the [Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/client/RestTemplate.html).

We will see the use of the above methods of `RestTemplate` with the help of some examples in subsequent sections.


## Project Setup for Running the Examples

To work with the examples of using `RestTemplate`, let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.6.1&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=restclient&name=restclient&description=Project%20to%20demo%20Spring%20Rest%20Client&packageName=io.pratik.restclient&dependencies=web), and then open the project in our favorite IDE. We have added the `web` dependency to Maven `pom.xml.
`.

We will also add a dependency on httpClient module for Apache HttpComponents. The Dependency `spring-boot-starter-web` is a starter for building web applications. This dependency contains the class RestTemplate, the option to publish REST web services, and many other web-related things.

As HTTP client API we use Apache HttpComponents for our examples.

We will use a POJO class: `Product` in most of the examples which looks like this:

```java
public class Product {
    public Product(String name, String brand, Double price, String sku) {
        super();
        id = UUID.randomUUID().toString();
        this.name = name;
        this.brand = brand;
        this.price = price;
        this.sku = sku;
    }
    private String id;
    private String name;
    private String brand;
    private Double price;
    private String sku;

    ...
}
```

We also have a simple REST web service: `ProductController` for testing our examples:

```java
@RestController
public class ProductController {
    
    private List<Product> products = List.of(new Product("Television", "Samsung",1145.67,"S001"),
               new Product("Washing Machine", "LG",114.67,"L001"),
               new Product("Laptop", "Apple",11453.67,"A001"));
    
    @GetMapping("/products")
    public List<Product> fetchProducts(){
        
        return products;
    }
    
    @PostMapping("/products")
    public ResponseEntity<String> createProduct(@RequestBody Product product){
        
        // Create product with ID;
        String productID = UUID.randomUUID().toString();
        product.setId(productID);
        products.add(product);
        
        return ResponseEntity.ok().body("{\"productID\":\""+productID+"\"}");
    }

    @PutMapping("/products")
    public ResponseEntity<String> updateProduct(@RequestBody Product product){
        
        products.set(1, product);
        // Update product. Return success or failure without response body
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/products")
    public ResponseEntity<String> deleteProduct(@RequestBody Product product){
        
        products.remove(1);
        // Update product. Return success or failure without response body
        return ResponseEntity.ok().build();
    }

}

```

As we can see the code for the controller is very simple but functional.

The REST web service contains the methods to create, read, update and delete product resources and supports the HTTP verbs GET, POST, PUT, and DELETE. The web service is available at the endpoint `http://localhost:8080/products`.

We will consume all these APIs using `RestTemplate` in the following sections.

## Making an HTTP GET Request to Obtain the JSON Response

The simplest form of using `RestTemplate` is to invoke an HTTP GET request to fetch the response body as a raw JSON string as shown in this example:

```java

public class RestConsumer {
    
    public void getProductAsJson() {
        RestTemplate restTemplate = new RestTemplate();
        String resourceUrl
          = "http://localhost:8080/products";
        ResponseEntity<String> response
          = restTemplate.getForEntity(resourceUrl, String.class);
        
        String productsJson = response.getBody();
        
        System.out.println(productsJson);
    }
    
}

```
Here we are using the `getForEntity` method of the `RestTemplate` class to invoke the API and get the response as a JSON string. We need to further work with the JSON response to extract the individual fields with the help of JSON parsing libraries like Jackson. 

This method is preferred in situations where we are interested in only a small subset of a large HTTP response composed of many fields. 

## Making an HTTP GET Request to Obtain the Response as a POJO

A variation of the earlier method is to get the response as a POJO class. In this case, we need to create a POJO class to map with the API response. 

```java
public class RestConsumer {
    
    public void getProducts() {
        RestTemplate restTemplate = new RestTemplate(getClientHttpRequestFactory());
        String resourceUrl
          = "http://localhost:8080/products";
        ResponseEntity<List> response
          = restTemplate.getForEntity(resourceUrl, List.class);
        
        List<Product> products = response.getBody();
        System.out.println(products);
    }
}

```
Here also we are calling the `getForEntity()` method for receiving the response as a `List` of `Product` objects.

Instead of using `getForEntity()` method, we could have used the `getForObject` method as shown below:

```java
public class RestConsumer {
    
    public void getProductObjects() {
        //RestTemplate restTemplate = new RestTemplate(getClientHttpRequestFactory());
        RestTemplate restTemplate = new RestTemplate();
        String resourceUrl
          = "http://localhost:8080/products";
        List<?> products
          = restTemplate.getForObject(resourceUrl, List.class);
        
        System.out.println(products);
    }

```
As we can see here, instead of the `ResponseEntity` object, we are directly getting back the object. While `getForObject()` looks better at first glance, `getForEntity()` returns important metadata like the response headers and the HTTP status code in the `ResponseEntity` object.

## Making an HTTP POST Request 
 After the GET methods, let us look at an example of making a POST request with the `RestTemplate`.

 We are invoking an HTTP POST method on a REST API with the `postForObject()` method:

```java
public class RestConsumer {
        
    public void createProduct() {
        RestTemplate restTemplate = new RestTemplate();
        String resourceUrl
          = "http://localhost:8080/products";
        HttpEntity<Product> request = new HttpEntity<Product>(new Product("Television", "Samsung",1145.67,"S001"));
        String productCreateResponse = restTemplate.postForObject(resourceUrl, request, String.class);
        
        System.out.println(productCreateResponse);
    }
}
    
```
Here the `postForObject` method takes the request body in the form of a `HttpEntity` class. The `HttpEntity` is constructed with the `Product` class which is the POJO class representing the HTTP request.

## Using the Exchange method for POST
In the earlier examples, we saw separate methods for making API calls like `postForObject` for HTTP POST and `getForEntity` for GET. `RestTemplate` has similar methods for PUT and DELETE and PATCH.

The `exchange()` method in contrast is more generalized and can be used for different HTTP methods. The HTTP method is sent as a parameter as shown in this example:

```java
public class RestConsumer {
    
    public void createProductWithExchange() {
        RestTemplate restTemplate = new RestTemplate();
        String resourceUrl
          = "http://localhost:8080/products";
        HttpEntity<Product> request = new HttpEntity<Product>(new Product("Television", "Samsung",1145.67,"S001"));
        ResponseEntity<String> productCreateResponse = restTemplate.exchange(resourceUrl, HttpMethod.POST, request, String.class);
            
        System.out.println(productCreateResponse);
    }
}

```
Here we are making the same POST request by passing the POST parameter as an enumeration: `HttpMethod.POST` in addition to the request body and the response type POJO.

## Using the Exchange method for PUT with Empty Response Body

Here is another example of using `exchange()` for making a PUT request which returns an empty response body:
```java
public class RestConsumer {
    
    public void updateProductWithExchange() {
        RestTemplate restTemplate = new RestTemplate();
        String resourceUrl
          = "http://localhost:8080/products";

        HttpEntity<Product> request = new HttpEntity<Product>(
            new Product("Television", "Samsung",1145.67,"S001"));

        restTemplate.exchange(resourceUrl, HttpMethod.PUT, request, Void.class);
        
        
    }
}

```
We use the `Void` class to represent the empty body here.

## Using the Exchange method for Downloading Large Files

Now we will use the `execute()` method for downloading large files. The `getForObject()` and `getForEntity()` methods which we saw earlier load the complete response of the REST service in memory. 

This is not desired for downloading large files because it can result in out-of-memory exceptions. 
To handle this problem, we can use the `ResponseExtractor` class as an argument of the `execute()` method of RestTemplate.

The `execute()` method takes a callback parameter for creating the request and a response extractor for processing the response as shown in this example:

```java
public class RestConsumer {
    
        public void getProductasStream() {
        final Product updatedProduct = new Product("Television", "Samsung",1145.67,"S001");
        RestTemplate restTemplate = new RestTemplate();
        String resourceUrl
          = "http://localhost:8080/products";
    
        
        RequestCallback requestCallback = request -> request.getHeaders()
                 .setAccept(Arrays.asList(MediaType.APPLICATION_OCTET_STREAM, MediaType.ALL));

        ResponseExtractor<Void> responseExtractor = response -> {
                 Path path = Paths.get("some/path");
                 Files.copy(response.getBody(), path);
                 return null;
             };
        restTemplate.execute(resourceUrl, HttpMethod.GET, requestCallback(updatedProduct), responseExtractor );
        
        
    }
}

```

The request callback method is used to prepare the HTTP request by setting different HTTP headers. Here we are setting the headers for content type and authorization.

The overridden method: `extractData()` is used to extract data from the given `ClientHttpResponse` This method will be called each time we receive stream data. Then, to get the data under `InputStream`, we  call var1.getBody(). Finally, we will read data from InputStream, then convert it to our format.



## Invoking APIs with application/form type Input

Another class of APIs takes `HTTP form` as an input. To call these APIs, we need to set the Content-Type header to `application/x-www-form-urlencoded` in addition to setting the request body. This allows us to send a large query string containing name and value pairs separated by `& ` to the server. 

```java
public class RestConsumer {
    public void submitProductForm() {
        RestTemplate restTemplate = new RestTemplate();
        String resourceUrl
          = "http://localhost:8080/products";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        MultiValueMap<String, String> map= new LinkedMultiValueMap<>();
        map.add("id", "1");
        
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
        
        ResponseEntity<String> response = restTemplate.postForEntity(
                  resourceUrl+"/form", request , String.class);       
        System.out.println(response.getBody());
    }
}

```
Next, we wrap the form variables in a `LinkedMultiValueMap` object and use this to create the `HttpEntity` class.

## Configuring the RestTemplate
The simplest form of `RestTemplate` is created as a new instance of the class with an empty constructor as seen in the examples so far.

As explained earlier, `RestTemplate` uses the class `java.net.HttpURLConnection` as the HTTP client by default. However, we can switch to another HTTP client library like Apache HttpComponents, Netty, OkHttp, etc by calling `setRequestFactory()` method on the class. 

In the example below , we are configuring the `RestTemplate` to use [Apache HttpClient](https://hc.apache.org/httpcomponents-client-5.1.x/index.html) library. For this, we first need to add the client library as a dependency :

```xml
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.apache.httpcomponents</groupId>
            <artifactId>httpclient</artifactId>
        </dependency>
    </dependencies>

```
Here we have added the dependency on Apache HttpClient in our `pom.xml`.

Next we will configure the HTTP client with settings like connect timeout, socket read timeout, pooled connection limit, idle connection timeout, etc as shown below:

```java
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

public class RestConsumer {

    private ClientHttpRequestFactory getClientHttpRequestFactory() {

        // Create an instance of Apache HttpClient
        HttpComponentsClientHttpRequestFactory clientHttpRequestFactory
          = new HttpComponentsClientHttpRequestFactory();

        int connectTimeout = 5000;
        int readTimeout = 5000;
          
        clientHttpRequestFactory.setConnectTimeout(connectTimeout);
        clientHttpRequestFactory.setReadTimeout(readTimeout);

        return clientHttpRequestFactory;
    }

    public void fetchProducts() {
        RestTemplate restTemplate = new RestTemplate(getClientHttpRequestFactory());
        ...
        ...
    }
}

```


In this example, we have specified the HTTP connection timeout and socket read timeout intervals to 5 seconds. This allows us to fine-tune the behavior of the HTTP connection.

Other than the default and Apache HttpClient, Spring also supports Netty and OkHttp client libraries through the `ClientHttpRequestFactory` abstraction.

## HTTP Message Conversion
Objects passed to and returned from the methods getForObject(), getForEntity(), postForLocation(), postForObject() and put() are converted to HTTP requests and from HTTP responses by HttpMessageConverter instances.

For performance reasons, the default RestTemplate constructor does not register any message converters. However, if you pass true to the alternate constructor, then converters for the main mime types are registered. You can also write your own converter and register it via the messageConverters property.

## Attaching an ErrorHandler
`RestTemplate` is associated with default error handler which throws the following exceptions:

* HTTP status 4xx: HttpClientErrorException
* HTTP status 5xx: HttpServerErrorException 
* unknown HTTP status: UnknownHttpStatusCodeException

These exceptions are subclasses of `RestClientResponseException` which is a subclass of RuntimeException. So if we do not catch them they bubble up to the top layer. 

The following is a sample of an error produced by the default error handler when the service responds with an HTTP status of 404:

```shell
Default error handler::org.springframework.web.client.DefaultResponseErrorHandler@30b7c004
...
...
...org.springframework.web.client.RestTemplate - Response 404 NOT_FOUND
Exception in thread "main" org.springframework.web.client.HttpClientErrorException$NotFound: 404 : "{"timestamp":"2021-12-20T07:20:34.865+00:00","status":404,"error":"Not Found","path":"/product/error"}"
    at org.springframework.web.client.HttpClientErrorException.create(HttpClientErrorException.java:113)
    ...
    at org.springframework.web.client.DefaultResponseErrorHandler.handleError(DefaultResponseErrorHandler.java:122)
    at org.springframework.web.client.ResponseErrorHandler.handleError(ResponseErrorHandler.java:63)
```

`RestTemplate` allows us to attach a custom error handler. Our custom error handler looks like this:

```java
public class RestServiceException extends RuntimeException {

    private String serviceName;
    private HttpStatus statusCode;
    private String error;
    public RestServiceException(String serviceName, HttpStatus statusCode, String error) {
        super();
        this.serviceName = serviceName;
        this.statusCode = statusCode;
        this.error = error;
    }
}
public class RestTemplateError {
    private String timestamp;
    private String status;
    private String error;
    private String path;
    ...
    ...
}
public class CustomErrorHandler implements ResponseErrorHandler{

    @Override
    public boolean hasError(ClientHttpResponse response) 
            throws IOException {
        return (
                  response.getStatusCode().series() ==
                      HttpStatus.Series.CLIENT_ERROR 
                      
                  || response.getStatusCode().series() == 
                      HttpStatus.Series.SERVER_ERROR
               );
            
    }

    @Override
    public void handleError(ClientHttpResponse response) 
            throws IOException {

        if (response.getStatusCode().is4xxClientError() 
                || response.getStatusCode().is5xxServerError()) {


            try (BufferedReader reader = new BufferedReader(new InputStreamReader(response.getBody()))) {
              String httpBodyResponse = reader.lines().collect(Collectors.joining(""));
              
              ObjectMapper mapper = new ObjectMapper();
              RestTemplateError restTemplateError = mapper.readValue(httpBodyResponse, RestTemplateError.class);

              
              throw new RestServiceException(restTemplateError.getPath(), response.getStatusCode(), restTemplateError.getError());
            }   
        
        }
        
    
    }
}

```
We override two methods: `hasError()` and `handleError()`. The error handling logic is in the handleError() method. In this method, we are extracting the service path and error message from the error response body returned as a JSON with the Jackson ObjectMapper.

The response with our custom error handler looks like this:

```shell
error occured: [Not Found] in service:: /product/error
```

As we can see this is more elegant and can be produced in a format compatible with our logging systems for further diagnosis.


Spring Boot provides an auto-configured `RestTemplateBuilder` which can be used to create RestTemplate instances when needed. The auto-configured RestTemplateBuilder ensures that sensible HttpMessageConverters are applied to RestTemplate instances.RestTemplateBuilder includes a number of useful methods that can be used to quickly configure a RestTemplate. 

## Attaching MessageConverters

We can further customize with messageTransformers.
## RestTemplate customization
There are three main approaches to RestTemplate customization depending on how broadly we want the customizations to apply.

* inject the auto-configured RestTemplateBuilder and then call its methods as required

To make the scope of any customizations as narrow as possible, inject the auto-configured RestTemplateBuilder and then call its methods as required. Each method call returns a new RestTemplateBuilder instance so the customizations will only affect this use of the builder.

To make an application-wide, additive customization a RestTemplateCustomizer bean can be used. All such beans are automatically registered with the auto-configured RestTemplateBuilder and will be applied to any templates that are built with it.

Here’s an example of a customizer that configures the use of a proxy for all hosts except 192.168.0.5:


## Comparison with Other HTTP Clients

As briefly touched in the beginning RestTemplate is a higher-level API that makes use of lower-level APIs like Java's API client.

RestTemplate is deprecated in favor of the WebClient which is more performant. Being synchronous calls to RestTemplate are blocking threads.

### Benefits

Spring RestTemplate provides many functionalities for interacting with Rest client. It deals with JSON/XML transformation of entities, …

Spring RestTemplate is a higher-level abstraction than Apache HttpClient. By default, Spring RestTemplate uses Apache HttpClient internally. We can use other implementation with configuring ClientHttpRequestFactory class.

RestTemplate is thread-safe once constructed, and that we can use callbacks to customize its operations.

### Drawbacks

It takes so much time when we have multiple user access.

Under the hood, RestTemplate uses the Java Servlet API, which is based on the thread-per-request model. The thread will block until the web client receives the response.

When we have multiple users, our application will create multiple threads, which will exhaust the thread pool or occupy all the available memory.

Degrade our application’s performance.

## Conclusion

Here is a list of the major points for a quick reference:

1. RestTemplate is a synchronous client for making API calls
2. RestTemplate has generalized methods which take the HTTP method as a parameter.
3. RestTemplate also has separate methods for making different HTTP method calls(GET, POST, PUTa, etc).
4. We can get the response body in raw JSON format which needs to be further processed with a JSON parser or a structured POJO that can be directly used in the application.
5. Request body is sent using HttpEntity class which is constructed with a POJO representing the API request.

We use HttpHeaders class to fill some key-values into our http header.
Normally, we will use HttpEntity to wrap all request body and all parameters of http header.
The common way to send request is to use exchange() method and use HttpMethod class that define all request methods we need.

With get request, we can use getForEntity() method or getForObject() method.

With post request, use postForObject(), postForEntity(), postForLocation() methods.

With put request, use put() method.

With delete request, use delete() method.

To get all headers information, use headForHeaders() method.

6. Lastly using RestTemplate results in blocking calls. WebClient is advised to be used for new applications.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/resttemplate).

