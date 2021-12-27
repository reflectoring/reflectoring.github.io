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

We will see how to use the above methods of `RestTemplate` with the help of some examples in subsequent sections.


## Project Setup for Running the Examples

To work with the examples of using `RestTemplate`, let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.6.1&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=restclient&name=restclient&description=Project%20to%20demo%20Spring%20Rest%20Client&packageName=io.pratik.restclient&dependencies=web), and then open the project in our favorite IDE. We have added the `web` dependency to Maven `pom.xml.
`.

The dependency `spring-boot-starter-web` is a starter for building web applications. This dependency contains the `RestTemplate` class.

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

We also have a minimal REST web service built with the `@RestController` annotation: `ProductController` for testing our examples:

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

The REST web service contains the methods to create, read, update, and delete `product` resources and supports the HTTP verbs GET, POST, PUT, and DELETE. When we run our example, this web service will be available at the endpoint `http://localhost:8080/products`.

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
Here we are using the `getForEntity()` method of the `RestTemplate` class to invoke the API and get the response as a JSON string. We need to further work with the JSON response to extract the individual fields with the help of JSON parsing libraries like Jackson. 

We prefer to work with raw JSON responses when we are interested only in a small subset of an HTTP response composed of many fields. 

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

Instead of using `getForEntity()` method, we could have used the `getForObject()` method as shown below:

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
As we can see here, instead of the `ResponseEntity` object, we are directly getting back the response object. While `getForObject()` looks better at first glance, `getForEntity()` returns additional important metadata like the response headers and the HTTP status code in the `ResponseEntity` object.

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
Here the `postForObject` method takes the request body in the form of an `HttpEntity` class. The `HttpEntity` is constructed with the `Product` class which is the POJO class representing the HTTP request.

## Using the Exchange method for POST
In the earlier examples, we saw separate methods for making API calls like `postForObject()` for HTTP POST and `getForEntity()` for GET. `RestTemplate` class has similar methods for other HTTP verbs like PUT, DELETE, and PATCH.

The `exchange()` method in contrast is more generalized and can be used for different HTTP verbs. The HTTP verb is sent as a parameter as shown in this example:

```java
public class RestConsumer {
    
    public void createProductWithExchange() {
        RestTemplate restTemplate = new RestTemplate();

        String resourceUrl
          = "http://localhost:8080/products";
        HttpEntity<Product> request = 
          new HttpEntity<Product>(
            new Product("Television", "Samsung",1145.67,"S001"));

        ResponseEntity<String> productCreateResponse = 
               restTemplate
                   .exchange(resourceUrl, HttpMethod.POST, request, String.class);
            
        System.out.println(productCreateResponse);
    }
}

```
Here we are making the POST request by sending  `HttpMethod.POST` as a parameter in addition to the request body and the response type POJO.

## Using the Exchange method for PUT with Empty Response Body

Here is another example of using the `exchange()` for making a PUT request which returns an empty response body:
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
To handle this problem, we can use the `ResponseExtractor` class as an argument of the `execute()` method of `RestTemplate`.

The `execute()` method takes a callback parameter for creating the request and a response extractor interface for processing the response as shown in this example:

```java
public class RestConsumer {
    
    public void getProductasStream() {
        final Product updatedProduct = new Product("Television", "Samsung",1145.67,"S001");
        RestTemplate restTemplate = new RestTemplate();
        String resourceUrl
          = "http://localhost:8080/products";
    
        // Set HTTP headers in the request callback
        RequestCallback requestCallback = request -> request.getHeaders()
                 .setAccept(
                    Arrays.asList
                    (MediaType.APPLICATION_OCTET_STREAM, MediaType.ALL));

        // Processing the response. Here we are extracting the 
        // response and copying the file to a folder in the server.
        ResponseExtractor<Void> responseExtractor = response -> {
                 Path path = Paths.get("some/path");
                 Files.copy(response.getBody(), path);
                 return null;
             };
        restTemplate.execute(resourceUrl, HttpMethod.GET, requestCallback(updatedProduct), responseExtractor );
        
        
    }
}

```

The request callback method is used to prepare the HTTP request by setting different HTTP headers like `Content-Type` and `Authorization`.

The `responseExtractor` used here extracts the response and creates a file in a folder in the server.


## Invoking APIs with application/form type Input

Another class of APIs takes `HTTP form` as an input. To call these APIs, we need to set the `Content-Type` header to `application/x-www-form-urlencoded` in addition to setting the request body. This allows us to send a large query string containing name and value pairs separated by `& ` to the server. 

We send the request in form variables by wrapping them in a `LinkedMultiValueMap` object and use this to create the `HttpEntity` class as shown in this example:

```java
public class RestConsumer {
    public void submitProductForm() {
        RestTemplate restTemplate = new RestTemplate();
        String resourceUrl
          = "http://localhost:8080/products";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        MultiValueMap<String, String> map= new LinkedMultiValueMap<>();
        map.add("sku", "S34455");
        map.add("name", "Television");
        map.add("brand", "Samsung");
        
        HttpEntity<MultiValueMap<String, String>> request = 
            new HttpEntity<>(map, headers);
        
        ResponseEntity<String> response = restTemplate.postForEntity(
                  resourceUrl+"/form", request , String.class);       
        System.out.println(response.getBody());
    }
}

```
Here we have sent three form variables `sku`, `name`, and `brand` in the request. Then we are invoking the `postForEntity()` method to get the response in `ResponseEntity` object.

## Configuring the Http Client in RestTemplate
The simplest form of `RestTemplate` is created as a new instance of the class with an empty constructor as seen in the examples so far.

As explained earlier, `RestTemplate` uses the class `java.net.HttpURLConnection` as the HTTP client by default. However, we can switch to another HTTP client library like Apache HttpComponents, Netty, OkHttp, etc. We do this by calling the `setRequestFactory()` method on the class. 

In the example below , we are configuring the `RestTemplate` to use [Apache HttpClient](https://hc.apache.org/httpcomponents-client-5.1.x/index.html) library. For this, we first need to add the client library as a dependency. 

Let us add a dependency on the `httpclient` module from the Apache [HttpComponents](https://hc.apache.org) project: 


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
Here we can see the dependency on `httpclient` added in Our Maven `pom.xml`.

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
        RestTemplate restTemplate = new RestTemplate(
            getClientHttpRequestFactory());
        ...
        ...
    }
}

```

In this example, we have specified the HTTP connection timeout and socket read timeout intervals to 5 seconds. This allows us to fine-tune the behavior of the HTTP connection.

Other than the default `HttpURLConnection` and Apache HttpClient, Spring also supports Netty and OkHttp client libraries through the `ClientHttpRequestFactory` abstraction.

## Attaching an ErrorHandler to RestTemplate
`RestTemplate` is associated with a default error handler which throws the following exceptions:

* HTTP status 4xx: HttpClientErrorException
* HTTP status 5xx: HttpServerErrorException 
* unknown HTTP status: UnknownHttpStatusCodeException

These exceptions are subclasses of `RestClientResponseException` which is a subclass of RuntimeException. So if we do not catch them they will bubble up to the top layer. 

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


            try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(response.getBody()))) {
              String httpBodyResponse = reader.lines()
                        .collect(Collectors.joining(""));
              
              ObjectMapper mapper = new ObjectMapper();
              RestTemplateError restTemplateError = mapper
               .readValue(httpBodyResponse, 
                RestTemplateError.class);

              
              throw new RestServiceException(restTemplateError.getPath(), 
                            response.getStatusCode(), 
                            restTemplateError.getError());
            }   
        
        }
   
    }
}

```
As we can see the `CustomErrorHandler` class implements the `ResponseErrorHandler` interface. It also uses an error POJO: `RestTemplateError` and a runtime exception class `RestServiceException`.

We override two methods of the `ResponseErrorHandler` interface: `hasError()` and `handleError()`. The error handling logic is in the `handleError()` method. In this method, we are extracting the service path and error message from the error response body returned as a JSON with the Jackson ObjectMapper.

The response with our custom error handler looks like this:

```shell
error occured: [Not Found] in service:: /product/error
```

As we can see this is more elegant and can be produced in a format compatible with our logging systems for further diagnosis.

When using `RestTemplate` in Spring Boot applications, we can use an auto-configured `RestTemplateBuilder` to create RestTemplate instances. 

## Attaching MessageConverters
REST APIs can serve resources in multiple formats(XML, JSON, etc) to the same URI following a REST principle called [content negotiation](https://www.w3.org/Protocols/rfc2616/rfc2616-sec12.html). REST clients request for the format they can support by sending the `accept` header in the request. Similarly, the `Content-Type` header is used to specify the format of the request.

The conversion of objects passed to the methods of `RestTemplate` is converted to HTTP requests by instances of `HttpMessageConverter` interface. This converter also converts HTTP responses to Java objects.

We can write our converter and register it with `RestTemplate` to request specific representations of a resource. In this example, we are requesting the XML representation of the `Product` resource:

```java
public class RestConsumer {
    public void getProductAsXML() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setMessageConverters(getXmlMessageConverter());
        
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_XML));
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        String productID = "P123445";

        String resourceUrl
          = "http://localhost:8080/products/"+productID;

        ResponseEntity<Product> response = 
          restTemplate.exchange(
            resourceUrl, 
            HttpMethod.GET, 
            entity, Product.class, "1");
        Product resource = response.getBody();
    }
    
    private List<HttpMessageConverter<?>> getXmlMessageConverter() {
        XStreamMarshaller marshaller = new XStreamMarshaller();
        marshaller.setAnnotatedClasses(Product.class);
        MarshallingHttpMessageConverter marshallingConverter = 
          new MarshallingHttpMessageConverter(marshaller);

        List<HttpMessageConverter<?>> converters = new ArrayList<>();
        converters.add(marshallingConverter);
        return converters;
    }
}

```

Here we have set up the `RestTemplate` with a message converter `XStreamMarshaller` since we are consuming XML representation of the `Product` resource.


## Comparison with Other HTTP Clients

As briefly mentioned in the beginning `RestTemplate` is a higher-level construct which makes use of a lower-level HTTP client.

`RestTemplate` is deprecated in favor of the reactive `WebClient` which is more performant. It is based on the thread-per-request model. Every request to `RestTemplate` blocks until the response is received. As a result, applications using `RestTemplate` will not scale well with an increasing number of concurrent users.

The official Spring documentation also advocates using `WebClient` instead of `RestTemplate`. `WebClient` has all the capabilities of `RestTemplate`. But it also has asynchronous capabilities and supports a functional style of programming. 

However, `RestTemplate` is still the preferred choice for applications stuck with an older version(< 5.0) of Spring or those evolving from a substantial legacy codebase. 

## Conclusion

Here is a list of the major points for a quick reference:

1. RestTemplate is a synchronous client for making REST API calls over HTTP
2. RestTemplate has generalized methods like `execute()` and `exchange()` which take the HTTP method as a parameter.
3. RestTemplate also has separate methods for making different HTTP method  like `getForObject()` and `getForEntity()`.
4. We have the option of getting the response body in raw JSON format which needs to be further processed with a JSON parser or a structured POJO that can be directly used in the application.
5. Request body is sent wrapped in a `HttpEntity` class.
6. `RestTemplate` can be customized with an HTTP client library, error handler, and message converter.
7. Lastly, calling `RestTemplate` methods results in blocking of the request thread till the response is received. Reactive `WebClient` is advised to be used for new applications.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/resttemplate).

