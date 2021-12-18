---
title: "Exhaustive Guide to Spring RestTemplate"
categories: [spring-boot]
date: 2021-12-18 06:00:00 +1000
modified: 2021-12-18 06:00:00 +1000
author: pratikdas
excerpt: "REST styled APIs are all around us and as such even the most simple applications need to invoke REST APIs for some or all of their functions. These REST APIs could be either of their own or from other sources. Hence applications need to consume APIs elegantly and consistently. RestTemplate is a library of Spring that helps us to do just that. In this article, we will understand the different methods of invoking REST API with Spring RestTemplate."
image:
  auto: 0074-stack
---

REST-styled APIs are all around us and as such even the most simple applications need to invoke REST APIs for some or all of their functions. These REST APIs could be either of their own or from other sources. Hence applications need to consume APIs elegantly and consistently. 

RestTemplate is a library of Spring that helps us to do just that. In this article, we will understand the different methods of invoking REST API with Spring RestTemplate.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/resttemplate" %}

## What is Spring RestTemplate

According to the official documentation, Spring RestTemplate is a synchronous client to perform HTTP requests. RestTemplate is a higher-order API since it performs HTTP requests by using the basic HTTP client libraries like the JDK HttpURLConnection, Apache HttpComponents, and others.

The methods of RestTemplate are of two categories covering most of the common scenarios of API invocation:
* By HTTP methods like the GET and POST 
* Generalized methods like an exchange and execute which take the HTTP method as a parameter.


NOTE: As of Spring 5.0 this class is in maintenance mode, with only minor requests for changes and bugs to be accepted going forward. Please, consider using the org.springframework.web.reactive.client.WebClient has a more modern API and supports sync, async, and streaming scenarios.

Let us see the use of Spring RestTemplate in a Spring Boot application.


## Creating the Spring Boot Application for Providing REST API for Consumption with Spring RestTemplate

To work with the examples of using RestTemplate, let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.6.1&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=restclient&name=restclient&description=Project%20to%20demo%20Spring%20Rest%20Client&packageName=io.pratik.restclient&dependencies=web), and then open the project in our favorite IDE. We have added the `web` dependencies to Maven `pom.xml` to build the REST APIs which will be consumed using the RestTemplate. However, in real scenarios, the API code will reside in a separate application or can be provided by a third party like Google, Twitter, or any other outside source.

For the APIs we have built simple REST APIs in the `ProductController` class as shown here:


```java
@RestController
public class ProductController {
    
    @GetMapping("/products")
    public List<Product> fetchProducts(){
        
        return List.of(new Product("Television", "Samsung",1145.67,"S001"),
                       new Product("Washing Machine", "LG",114.67,"L001"),
                       new Product("Laptop", "Apple",11453.67,"A001"));
    }
    
    @PostMapping("/products")
    public ResponseEntity<String> createProduct(){
        
        
        Product product = new Product("Television", "Samsung",1145.67,"S001");
        return ResponseEntity.ok().body("{\"productID\":\"p12345\"}");
    }

}

```
We have created APIs for fetching products using the GET method and for creating a product with the HTTP POST. We also have APIs which take the form of input. When we run this application, the REST APIs get published to the URL `http://localhost:8080/products`.

We will consume all these APIs using the RestTemplate client in the following sections.

## Configuring the RestTemplate

We set up RestTemplate in our application by creating a Spring bean and injecting the dependency in the service classes or just by creating a new instance of the `RestTemplate` class. The simplest form of `RestTemplate` is created with the empty constructor.

We can further configure the RestTemplate with attributes like timeout intervals by specifying the ClientRequestFactory class as shown here:

```java
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

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

    private ClientHttpRequestFactory getClientHttpRequestFactory() {
        int connectTimeout = 5000;
        int readTimeout = 5000;
        HttpComponentsClientHttpRequestFactory clientHttpRequestFactory
          = new HttpComponentsClientHttpRequestFactory();
        clientHttpRequestFactory.setConnectTimeout(connectTimeout);
        clientHttpRequestFactory.setReadTimeout(readTimeout);
        return clientHttpRequestFactory;
    }
}

```
Here we have specified the HTTP connection timeout and read timeout intervals in an instance of `HttpComponentsClientHttpRequestFactory` and used this instance to initialize our `RestTemplate` class.
It is always advisable to set up the `RestTemplate` with sensible configuration externalized in property files based on the application's runtime environment (like development, test, and production).

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
Here we are using the `getForEntity` method of the `RestTemplate` class to invoke the API and get the response as a JSON string. We need to further work with the JSON response to extract the individual fields with the help of JSON parsing libraries like Jackson and JSON. This method is preferred in situations where we are interested in only a small subset of a large HTTP response composed of many fields. 

## Making an HTTP GET Request to Obtain the Response as a POJO

A variation of the earlier method is to get the response as a POJO class. In this case, we need to create a POJO class to map with the API response. It is advisable to use client generation tools like Swagger (OpenAPI) to generate the POJO classes and also keep the models in sync with any change in the API contract in the future.

Let us update our application by adding a `LocaleResolver` bean to our Spring configuration class:

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
Here we are receiving the response as a `List` of `Product` objects.

## Making an HTTP POST Request 
 After the GET methods, let us look at an example of making a POST request with the RestTemplate.

 We are invoking an HTTP POST method on a REST API with the `postForObject` method:

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
In the earlier examples, we saw separate methods for making API calls like `postForObject` for HTTP POST and `getForEntity` for GET. RestTemplate has similar methods for PUT and DELETE and PATCH.

The second category methods take the HTTP method as a parameter as shown in this example:

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
Here we are making the same POST request by passing the POST parameter as an enumeration: HttpMethod.POST in addition to the request body and the response type POJO.

## Using the Exchange method for PUT and Handling Empty Response Body

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

## Using the Execute method for PUT

Now we will use the execute method for making the PUT request. The execute method takes a callback parameter for creating the request and a response extractor for processing the response as shown in this example:

```java
public class RestConsumer {
    
    public void updateProductWithExecute() {
        final Product updatedProduct = new Product("Television", "Samsung",1145.67,"S001");
        RestTemplate restTemplate = new RestTemplate();
        String resourceUrl
          = "http://localhost:8080/products";
    
        
        ResponseExtractor<String> responseExtractor = new ResponseExtractor<String>() {

            @Override
            public String extractData(ClientHttpResponse response) throws IOException {
                System.out.println(response.getBody());
                return null;
            }

            
        };
        restTemplate.execute(resourceUrl, HttpMethod.PUT, requestCallback(updatedProduct), responseExtractor );
    }

    private RequestCallback requestCallback(final Product updatedProduct) {
        return clientHttpRequest -> {
            ObjectMapper mapper = new ObjectMapper();
            mapper.writeValue(clientHttpRequest.getBody(), updatedProduct);
            clientHttpRequest.getHeaders().add(
              HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
            clientHttpRequest.getHeaders().add(
              HttpHeaders.AUTHORIZATION, "Bearer Ahwye82939jeb ");
        };
    }
}

```

The request callback method is used to prepare the HTTP request by setting different headers. Here we are setting the headers for content type and authorization.


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


## Comparison with Other HTTP Clients

As briefly touched in the beginning RestTemplate is a higher-level API that makes use of lower-level APIs like Java's API client.

RestTemplate is deprecated in favor of the WebClient which is more performant. Being synchronous calls to RestTemplate are blocking threads.

On the pros side, RestTemplate is simpler to use compared to WebClient. The code is less verbose and is suitable for situations of POCs or MVPs when we need a quick turnaround time and the application is used by a limited number of users.

## Conclusion

Here is a list of the major points for a quick reference:

1. RestTemplate is a synchronous client for making API calls
2. RestTemplate has generalized methods which take the HTTP method as a parameter.
3. RestTemplate also has separate methods for making different HTTP method calls(GET, POST, PUTa, etc).
4. We can get the response body in raw JSON format which needs to be further processed with a JSON parser or a structured POJO that can be directly used in the application.
5. Request body is sent using HttpEntity class which is constructed with a POJO representing the API request.
6. Lastly using RestTemplate results in blocking calls. WebClient is advised to be used for new applications.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/resttemplate).

