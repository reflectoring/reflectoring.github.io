---
title: "Complete Guide to Spring RestTemplate"
categories: ["WIP","Spring Boot"]
date: 2021-12-29T05:00:00
modified: 2021-12-29T05:00:00
authors: [pratikdas]
excerpt: "REST styled APIs are all around us and as such most applications need to invoke REST APIs for some or all of their functions. These REST APIs could be either of their own or from other sources. Hence, applications need to consume APIs elegantly and consistently. RestTemplate is a library of Spring that helps us to do just that. In this article, we will understand the different methods of invoking REST API with Spring RestTemplate."
image: images/stock/0074-stack-1200x628-branded.jpg
url: spring-resttemplate
---

REST-styled APIs are all around us. Many applications need to invoke REST APIs for some or all of their functions. Hence for applications to function gracefully, they need to consume APIs elegantly and consistently.

`RestTemplate` is a class within the Spring framework that helps us to do just that. In this tutorial, we will understand how to use `RestTemplate` for invoking REST APIs of different shapes.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/resttemplate" %}}

## What is Spring `RestTemplate`?

According to the official [documentation](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/client/RestTemplate.html), `RestTemplate` is a synchronous client to perform HTTP requests. 

It is a higher-order API since it performs HTTP requests by using an HTTP client library like the JDK [HttpURLConnection](https://docs.oracle.com/en/java/javase/12/docs/api/java.base/java/net/HttpURLConnection.html), Apache HttpClient, and others.

The HTTP client library takes care of all the low-level details of communication over HTTP while the `RestTemplate` adds the capability of transforming the request and response in [JSON](https://www.json.org/json-en.html) or [XML](https://www.w3.org/XML/) to Java objects.

By default, `RestTemplate` uses the class `java.net.HttpURLConnection` as the HTTP client. However, we can switch to another HTTP client library which we will see in a later section. 


## Some Useful Methods of `RestTemplate`

Before looking at the examples, it will be helpful to take a look at the important methods of the `RestTemplate` class.

`RestTemplate` provides higher-level methods for each of the HTTP methods which make it easy to invoke  RESTful services.

The names of most of the methods are based on a naming convention:
* the first part in the name indicates the HTTP method being invoked
* the second part in the name indicates returned element. 

For example, the method `getForObject()` will perform a GET and return an object. 

**`getForEntity()`**: executes a GET request and returns an object of `ResponseEntity` class that contains both the status code and the resource as an object. 

**`getForObject()`** : similar to `getForEntity()`, but returns the resource directly. 

**`exchange()`**: executes a specified HTTP method, such as GET, POST, PUT, etc, and returns a `ResponseEntity` containing both the HTTP status code and the resource as an object.

**`execute()`** : similar to the `exchange()` method, but takes additional parameters: `RequestCallback` and `ResultSetExtractor`. 

**`headForHeaders()`**: executes a HEAD request and returns all HTTP headers for the specified URL. 

**`optionsForAllow()`**: executes an OPTIONS request and uses the Allow header to return the HTTP methods that are allowed under the specified URL.

**`delete()`**: deletes the resources at the given URL using the HTTP DELETE method.

**`put()`**: updates a resource for a given URL using the HTTP PUT method.

**`postForObject()`** : creates a new resource using HTTP POST method and returns an entity.

**`postForLocation()`**: creates a new resource using the HTTP POST method and returns the location of the newly created resource.

For additional information on the methods of `RestTemplate`, please refer to the [Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/client/RestTemplate.html).

We will see how to use the above methods of `RestTemplate` with the help of some examples in subsequent sections.


## Project Setup for Running the Examples

To work with the examples of using `RestTemplate`, let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.6.1&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=restclient&name=restclient&description=Project%20to%20demo%20Spring%20Rest%20Client&packageName=io.pratik.restclient&dependencies=web), and then open the project in our favorite IDE. We have added the `web` dependency to the Maven `pom.xml.
`.

The dependency `spring-boot-starter-web` is a starter for building web applications. This dependency contains a dependency to the `RestTemplate` class.

We will use this POJO class `Product` in most of the examples:

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

We also have built a minimal REST web service with the following `@RestController`:

```java
@RestController
public class ProductController {
    
    private List<Product> products = List.of(
               new Product("Television", "Samsung",1145.67,"S001"),
               new Product("Washing Machine", "LG",114.67,"L001"),
               new Product("Laptop", "Apple",11453.67,"A001"));
    
    @GetMapping(value="/products/{id}", 
        produces=MediaType.APPLICATION_XML_VALUE)
    public @ResponseBody Product fetchProducts(
        @PathParam("id") String productId){
        
        return products.get(1);
    }

    @GetMapping("/products")
    public List<Product> fetchProducts(){
        
        return products;
    }
    
    @PostMapping("/products")
    public ResponseEntity<String> createProduct(
        @RequestBody Product product){
        
        // Create product with ID;
        String productID = UUID.randomUUID().toString();
        product.setId(productID);
        products.add(product);
        
        return ResponseEntity.ok().body(
            "{\"productID\":\""+productID+"\"}");
    }

    @PutMapping("/products")
    public ResponseEntity<String> updateProduct(
        @RequestBody Product product){
        
        products.set(1, product);
        // Update product. Return success or failure without response body
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/products")
    public ResponseEntity<String> deleteProduct(
        @RequestBody Product product){
        
        products.remove(1);
        // Update product. Return success or failure without response body
        return ResponseEntity.ok().build();
    }

}

```

The REST web service contains the methods to create, read, update, and delete `product` resources and supports the HTTP verbs GET, POST, PUT, and DELETE. 

When we run our example, this web service will be available at the endpoint `http://localhost:8080/products`.

We will consume all these APIs using `RestTemplate` in the following sections.

## Making an HTTP GET Request to Obtain the JSON Response

The simplest form of using `RestTemplate` is to invoke an HTTP GET request to fetch the response body as a raw JSON string as shown in this example:

```java

public class RestConsumer {
    
    public void getProductAsJson() {
        RestTemplate restTemplate = new RestTemplate();

        String resourceUrl
          = "http://localhost:8080/products";

        // Fetch JSON response as String wrapped in ResponseEntity
        ResponseEntity<String> response
          = restTemplate.getForEntity(resourceUrl, String.class);
        
        String productsJson = response.getBody();
        
        System.out.println(productsJson);
    }
    
}

```text
Here we are using the `getForEntity()` method of the `RestTemplate` class to invoke the API and get the response as a JSON string. We need to further work with the JSON response to extract the individual fields with the help of JSON parsing libraries like Jackson. 

We prefer to work with raw JSON responses when we are interested only in a small subset of an HTTP response composed of many fields. 

## Making an HTTP GET Request to Obtain the Response as a POJO

A variation of the earlier method is to get the response as a POJO class. In this case, we need to create a POJO class to map with the API response. 

```java
public class RestConsumer {
    
    public void getProducts() {
        RestTemplate restTemplate = new RestTemplate();

        String resourceUrl
          = "http://localhost:8080/products";

        // Fetch response as List wrapped in ResponseEntity
        ResponseEntity<List> response
          = restTemplate.getForEntity(resourceUrl, List.class);
        
        List<Product> products = response.getBody();
        System.out.println(products);
    }
}

```text
Here also we are calling the `getForEntity()` method for receiving the response as a `List` of `Product` objects.

Instead of using `getForEntity()` method, we could have used the `getForObject()` method as shown below:

```java
public class RestConsumer {
    
    public void getProductObjects() {
       
        RestTemplate restTemplate = new RestTemplate();

        String resourceUrl
          = "http://localhost:8080/products";

        // Fetching response as Object  
        List<?> products
          = restTemplate.getForObject(resourceUrl, List.class);
        
        System.out.println(products);
    }

```text
Instead of the `ResponseEntity` object, we are directly getting back the response object. 

While `getForObject()` looks better at first glance, `getForEntity()` returns additional important metadata like the response headers and the HTTP status code in the `ResponseEntity` object.

## Making an HTTP POST Request 
After the GET methods, let us look at an example of making a POST request with the `RestTemplate`.

We are invoking an HTTP POST method on a REST API with the `postForObject()` method:

```java
public class RestConsumer {
        
    public void createProduct() {
        RestTemplate restTemplate = new RestTemplate();

        String resourceUrl
          = "http://localhost:8080/products";

        // Create the request body by wrapping
        // the object in HttpEntity 
        HttpEntity<Product> request = new HttpEntity<Product>(
            new Product("Television", "Samsung",1145.67,"S001"));

        // Send the request body in HttpEntity for HTTP POST request
        String productCreateResponse = restTemplate
               .postForObject(resourceUrl, request, String.class);
        
        System.out.println(productCreateResponse);
    }
}
    
```text
Here the `postForObject()` method takes the request body in the form of an `HttpEntity` class. The `HttpEntity` is constructed with the `Product` class which is the POJO class representing the HTTP request.

## Using `exchange()` for POST
In the earlier examples, we saw separate methods for making API calls like `postForObject()` for HTTP POST and `getForEntity()` for GET. `RestTemplate` class has similar methods for other HTTP verbs like PUT, DELETE, and PATCH.

The `exchange()` method in contrast is more generalized and can be used for different HTTP verbs. The HTTP verb is sent as a parameter as shown in this example:

```java
public class RestConsumer {
    
    public void createProductWithExchange() {
        RestTemplate restTemplate = new RestTemplate();

        String resourceUrl
          = "http://localhost:8080/products";

        // Create the request body by wrapping
        // the object in HttpEntity   
        HttpEntity<Product> request = 
          new HttpEntity<Product>(
            new Product("Television", "Samsung",1145.67,"S001"));

        ResponseEntity<String> productCreateResponse = 
               restTemplate
                .exchange(resourceUrl, 
                    HttpMethod.POST, 
                    request, 
                    String.class);
            
        System.out.println(productCreateResponse);
    }
}

```text
Here we are making the POST request by sending  `HttpMethod.POST` as a parameter in addition to the request body and the response type POJO.

## Using `exchange()` for PUT with an Empty Response Body

Here is another example of using the `exchange()` for making a PUT request which returns an empty response body:
```java
public class RestConsumer {
    
    public void updateProductWithExchange() {
        RestTemplate restTemplate = new RestTemplate();

        String resourceUrl
          = "http://localhost:8080/products";

        // Create the request body by wrapping
        // the object in HttpEntity 
        HttpEntity<Product> request = new HttpEntity<Product>(
            new Product("Television", "Samsung",1145.67,"S001"));

        // Send the PUT method as a method parameter
        restTemplate.exchange(
            resourceUrl, 
            HttpMethod.PUT, 
            request, 
            Void.class);
        
        
    }
}

```text
Here we are sending `HttpMethod.PUT` as a parameter to the `exchange()` method. Since the REST API returns an empty body, we are using the `Void` class to represent the same.

## Using `execute()` for Downloading Large Files

The `execute()` in contrast to the `exchange()` method is the most generalized way to perform a request, with full control over request preparation and response extraction via callback interfaces.

We will use the `execute()` method for downloading large files. 

The `execute()` method takes a callback parameter for creating the request and a response extractor callback for processing the response as shown in this example:

```java
public class RestConsumer {
    
    public void getProductasStream() {
        final Product fetchProductRequest = 
        new Product("Television", "Samsung",1145.67,"S001");

        RestTemplate restTemplate = new RestTemplate();

        String resourceUrl
          = "http://localhost:8080/products";
    
        // Set HTTP headers in the request callback
        RequestCallback requestCallback = request -> {
            ObjectMapper mapper = new ObjectMapper();
                mapper.writeValue(request.getBody(), 
                        fetchProductRequest);

                request.getHeaders()
                 .setAccept(Arrays.asList(
                         MediaType.APPLICATION_OCTET_STREAM, 
                         MediaType.ALL));
                };

        // Processing the response. Here we are extracting the 
        // response and copying the file to a folder in the server.
        ResponseExtractor<Void> responseExtractor = response -> {
                 Path path = Paths.get("some/path");
                 Files.copy(response.getBody(), path);
                 return null;
             };

        restTemplate.execute(resourceUrl, 
            HttpMethod.GET, 
            requestCallback, 
            responseExtractor );    
        
    }
}

```text
Here we are sending a request callback and a response callback to the `execute()` method. The request callback is used to prepare the HTTP request by setting different HTTP headers like `Content-Type` and `Authorization`.

The `responseExtractor` used here extracts the response and creates a file in a folder in the server.


## Invoking APIs with `application/form` Type Input

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
        
        // Set the form inputs in a multivaluemap
        MultiValueMap<String, String> map= new LinkedMultiValueMap<>();
        map.add("sku", "S34455");
        map.add("name", "Television");
        map.add("brand", "Samsung");
        
        // Create the request body by wrapping
        // the MultiValueMap in HttpEntity  
        HttpEntity<MultiValueMap<String, String>> request = 
            new HttpEntity<>(map, headers);
        
        ResponseEntity<String> response = restTemplate.postForEntity(
                  resourceUrl+"/form", request , String.class); 

        System.out.println(response.getBody());
    }
}

```text
Here we have sent three form variables `sku`, `name`, and `brand` in the request by first adding them to a `MultiValueMap` and then wrapping the map in `HttpEntity`. After that, we are invoking the `postForEntity()` method to get the response in a `ResponseEntity` object.

## Configuring the HTTP Client in `RestTemplate`
The simplest form of `RestTemplate` is created as a new instance of the class with an empty constructor as seen in the examples so far.

As explained earlier, `RestTemplate` uses the class `java.net.HttpURLConnection` as the HTTP client by default. However, we can switch to a different HTTP client library like Apache HttpComponents, Netty, OkHttp, etc. We do this by calling the `setRequestFactory()` method on the class. 

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

```text
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

## Attaching an ErrorHandler to `RestTemplate`
`RestTemplate` is associated with a default error handler which throws the following exceptions:

* *HTTP status 4xx*: `HttpClientErrorException`
* *HTTP status 5xx*: `HttpServerErrorException` 
* *unknown HTTP status*: `UnknownHttpStatusCodeException`

These exceptions are subclasses of `RestClientResponseException` which is a subclass of `RuntimeException`. So if we do not catch them they will bubble up to the top layer. 

The following is a sample of an error produced by the default error handler when the service responds with an HTTP status of 404:

```shell
Default error handler::org.springframework.web.client.DefaultResponseErrorHandler@30b7c004
...
...
...org.springframework.web.client.RestTemplate - Response 404 NOT_FOUND
Exception in thread "main" org.springframework.web.client
.HttpClientErrorException$NotFound: 404 : 
"{"timestamp":"2021-12-20T07:20:34.865+00:00","status":404,
"error":"Not Found","path":"/product/error"}" 
    at org.springframework.web.client.HttpClientErrorException
    .create(HttpClientErrorException.java:113)
    ... 
    at org.springframework.web.client.DefaultResponseErrorHandler.handleError(DefaultResponseErrorHandler.java:122) 
    at org.springframework.web.client.ResponseErrorHandler
    .handleError(ResponseErrorHandler.java:63)
```

`RestTemplate` allows us to attach a custom error handler. Our custom error handler looks like this:

```java

// Custom runtime exception
public class RestServiceException extends RuntimeException {

    private String serviceName;
    private HttpStatus statusCode;
    private String error;

    public RestServiceException(
        String serviceName, 
        HttpStatus statusCode, 
        String error) {

        super();
        this.serviceName = serviceName;
        this.statusCode = statusCode;
        this.error = error;
    }
}

// Error POJO
public class RestTemplateError {
    private String timestamp;
    private String status;
    private String error;
    private String path;
    ...
    ...
}

// Custom error handler
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

              
              throw new RestServiceException(
                            restTemplateError.getPath(), 
                            response.getStatusCode(), 
                            restTemplateError.getError());
            }   
        
        }
   
    }
}

```text
The `CustomErrorHandler` class implements the `ResponseErrorHandler` interface. It also uses an error POJO: `RestTemplateError` and a runtime exception class `RestServiceException`.

We override two methods of the `ResponseErrorHandler` interface: `hasError()` and `handleError()`. The error handling logic is in the `handleError()` method. In this method, we are extracting the service path and error message from the error response body returned as a JSON with the Jackson ObjectMapper.

The response with our custom error handler looks like this:

```shell
error occured: [Not Found] in service:: /product/error
```

The output is more elegant and can be produced in a format compatible with our logging systems for further diagnosis.

When using `RestTemplate` in Spring Boot applications, we can use an auto-configured `RestTemplateBuilder` to create `RestTemplate` instances as shown in this code snippet:

```java
@Service
public class InventoryServiceClient {
    
    private RestTemplate restTemplate;
    
    public InventoryServiceClient(RestTemplateBuilder builder) {
        restTemplate = builder.errorHandler(
                new CustomErrorHandler())
                .build();
        
        ...
        ...
    }
}
```text
Here the `RestTemplateBuilder` autoconfigured by Spring is injected in the class and used to attach the `CustomErrorHandler` class we created earlier.

## Attaching `MessageConverters` to the `RestTemplate`
REST APIs can serve resources in multiple formats (XML, JSON, etc) to the same URI following a principle called [content negotiation](https://www.w3.org/Protocols/rfc2616/rfc2616-sec12.html). REST clients request for the format they can support by sending the `accept` header in the request. Similarly, the `Content-Type` header is used to specify the format of the request.

The conversion of objects passed to the methods of `RestTemplate` is converted to HTTP requests by instances of `HttpMessageConverter` interface. This converter also converts HTTP responses to Java objects.

We can write our converter and register it with `RestTemplate` to request specific representations of a resource. In this example, we are requesting the XML representation of the `Product` resource:

```java
public class RestConsumer {
    public void getProductAsXML() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setMessageConverters(getXmlMessageConverter());
        
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(
            Collections.singletonList(MediaType.APPLICATION_XML));
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

Starting with Spring 5, the `RestTemplate` class is in maintenance mode. The non-blocking [`WebClient` is provided by the Spring framework as a modern alternative to the `RestTemplate`](/spring-webclient). 

`WebClient` offers support for both synchronous and asynchronous HTTP requests and streaming scenarios. Therefore, `RestTemplate` will be marked as deprecated in a future version of the Spring Framework and will not contain any new functionalities.

`RestTemplate` is based on a thread-per-request model. Every request to `RestTemplate` blocks until the response is received. As a result, applications using `RestTemplate` will not scale well with an increasing number of concurrent users.

The official Spring documentation also advocates using `WebClient` instead of `RestTemplate`. 

However, `RestTemplate` is still the preferred choice for applications stuck with an older version(< 5.0) of Spring or those evolving from a substantial legacy codebase. 

## Conclusion

Here is a list of the major points for a quick reference:

1. `RestTemplate` is a synchronous client for making REST API calls over HTTP
2. `RestTemplate` has generalized methods like `execute()` and `exchange()` which take the HTTP method as a parameter. `execute()` method is most generalized since it takes request and response callbacks which can be used to add more customizations to the request and response processing.
3. `RestTemplate` also has separate methods for making different HTTP methods like `getForObject()` and `getForEntity()`.
4. We have the option of getting the response body in raw JSON format which needs to be further processed with a JSON parser or a structured POJO that can be directly used in the application.
5. Request body is sent by wrapping the POJOs in a `HttpEntity` class.
6. `RestTemplate` can be customized with an HTTP client library, error handler, and message converter.
7. Lastly, calling `RestTemplate` methods results in blocking the request thread till the response is received. Reactive `WebClient` is advised to be used for new applications.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/resttemplate).

