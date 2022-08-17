---
title: "Configuring CORS with Spring Boot and Spring Security"
categories: ["Spring"]
date: 2022-06-30 00:00:00 +1100
modified: 2022-06-30 00:00:00 +1100
authors: ["ranjani"]
description: "Configuring CORS with Spring Boot and Spring Security"
image: images/stock/0014-handcuffs-1200x628-branded.jpg
url: spring-cors
---

**Cross Origin Resource Sharing (CORS) is an HTTP-header based mechanism** that allows servers to **explicitly whitelist certain 
origins** and helps **bypass the same-origin policy**. This is required since **browsers by default apply the same-origin policy for security**.
By implementing CORS in a web application, a webpage could request for additional resources and load into the browser from other domains.

This article will focus on the various ways in which CORS can be implemented in a Spring based application.
To understand how CORS works in detail, refer to this excellent [introductory article.](https://reflectoring.io/complete-guide-to-cors/)

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/cors/configuring-cors-with-spring" %}}

## Overview of CORS specific HTTP Response Headers

The CORS specification defines a set of response headers returned by the server that will be the focus in the subsequent sections.

| Response Headers                 | Description                                                                                                                                            |
|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| Access-Control-Allow-Origin      | Comma separated list of whitelisted origins or "*".                                                                                                    |
| Access-Control-Allow-Methods     | Comma separated list of HTTP methods the web server allows for cross-origin requests                                                                   |
| Access-Control-Allow-Headers     | Comma separated list of HTTP headers the web server allows for cross-origin requests                                                                   |
| Access-Control-Expose-Headers    | Comma separated list of HTTP headers that the client script can consider safe to display                                                               |
| Access-Control-Allow-Credentials | If the browser makes a request to the server by passing credentials <br/>(in the form of cookies or authorization headers), its value is set to `true` |
| Access-Control-Max-Age           | Indicates how long the results of a preflight request can be cached.                                                                                   |

## Setting up a sample client application

We will use a simple angular application that will call the REST endpoints that we can inspect using browser developer tools.
You can check out the [source code on GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/cors/configuring-cors-with-spring/cors-app).

````text
    ng serve --open
````
We should be able to start the client application successfully.
{{% image alt="settings" src="images/posts/configuring-cors-with-spring/client.jpg" %}}

## Setting up a sample server application

We will use an example Spring based Library application with sample GET and POST requests that the client application can call.
The Maven Wrapper bundled with the application will be used to start the service
You can check out the [source code on GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/cors/configuring-cors-with-spring/SimpleLibraryApplication).

````text
    mvnw clean verify spring-boot:run (for Windows)
    ./mvnw clean verify spring-boot:run (for Linux)
````
Once the Spring application successfully starts the client application should be able to successfully load data from the server.
{{% image alt="settings" src="images/posts/configuring-cors-with-spring/app.jpg" %}}


## Configuring CORS in a Spring boot Application

The initial setup created with a Spring Initializr holds all the required CORS dependencies. No external dependencies need to be added.

### Enabling CORS with @CrossOrigin

Let's first understand the attributes that @CrossOrigin supports.


| Attributes       | Description                                                                                                                                                                                                                                              | Sample Usage                                                                                                                      |
|------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| origins          | Allows you to specify a list of allowed origins. By default, it allows all origins.<br/> The attribute value will be set in the **Access-Control-Allow-Origin** header of both the preflight response and the actual response.                           | @CrossOrigin(origins = "http://localhost:8080") <br/> @CrossOrigin(origins = {"http://localhost:8080", "http://testserver:8087"}) |
| allowedHeaders   | Allows you to specify a list of headers that will be accepted when the browser makes the request. By default, any headers will be allowed. The value specified in this attribute is used in **Access-Control-Allow-Headers** in the preflight response.  | @CrossOrigin(allowedHeaders = {"Authorization", "Origin"})                                                                        |
| exposedHeaders   | List of headers that are set in the actual response header. If not specified only the [safelisted headers](https://developer.mozilla.org/en-US/docs/Glossary/CORS-safelisted_response_header) will be considered safe to be exposed by the client script | @CrossOrigin(exposedHeaders = {"Access-Control-Allow-Origin","Access-Control-Allow-Credentials"})                                 |                                                                        |
| allowCredentials | When credentials are required to invoke the API, set **Access-Control-Allow-Credentials** header value to true. In case no credentials are required, omit the header.                                                                                    | @CrossOrigin(allowCredentials = true)                                                                                             |                                                                        |
| maxAge           | Default maxAge is set to 1800 seconds(30 minutes). Indicates how long the preflight responses can be cached for.                                                                                                                                         | @CrossOrigin(maxAge = 300)                                                                                                        |                                                                        |

### What if we do not configure CORS 

Consider our Spring Boot Application has not been configured for CORS support.
If we try to hit our angular application running on port 4200, we see this error on the developer console.
{{% image alt="settings" src="images/posts/configuring-cors-with-spring/cors-error.jpg" %}}

### Configure CORS using @CrossOrigin

Here we will look at various ways in which our client application will be able to access the server resources without throwing CORS errors

#### Defining @CrossOrigin at the class level

````java
    @CrossOrigin(maxAge = 3600)
    @RestController
    @RequestMapping("cors-library/managed/books")
    public class LibraryController {}
````

Here since we have defined @CrossOrigin
 - All cross-origin requests will be accepted.
 - Since maxAge = 3600, all pre-flight responses will be cached for 30 mins.

#### Defining @CrossOrigin at method level

````java
    @CrossOrigin(origins = "http://localhost:4200", allowedHeaders = "Requestor-Type", exposedHeaders = "X-Get-Header")
    @GetMapping
    public ResponseEntity<List<BookDto>> getBooks(@RequestParam String type) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Get-Header", "ExampleHeader");
        return ResponseEntity.ok().headers(headers).body(libraryService.getAllBooks(type));
        }
````

 - Request coming from origin http://localhost:4200 only will be processed.
 - If we expect only certain headers to be accepted, we can specify those headers in the allowedHeaders attribute. If the "Requestor-Type" header is not sent by the browser, the request will not be processed.
 - If we set certain response headers, for the client application to be able to use them, we need to explicitly set the list of response headers to be exposed.

#### Combination of @CrossOrigin at class and method levels

````java
    @CrossOrigin(maxAge = 3600)
    @RestController
    @RequestMapping("cors-library/managed/books")
    public class LibraryController {

        private static final Logger log = LoggerFactory.getLogger(LibraryController.class);

        private final LibraryService libraryService;

        public LibraryController(LibraryService libraryService) {
            this.libraryService = libraryService;
        }

        @CrossOrigin(origins = "http://localhost:4200", allowedHeaders = "Requestor-Type")
        @GetMapping
        public ResponseEntity<List<BookDto>> getBooks(@RequestParam String type) {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Get-Header", "ExampleHeader");
            return ResponseEntity.ok().headers(headers).body(libraryService.getAllBooks(type));
        }
    }
````
By defining the annotation at both class and method levels
    - its combined attributes will be applied to the methods i.e (origins, allowedHeaders, maxAge)

## Enable CORS Configuration globally

Instead of adding CORS to each of the resource separately, we could define a common CORS configuration that would apply to
all resources defined in the application. We could use **WebMvcConfigurer** which is a part of the Spring Web MVC library.
By overriding the **addCorsMapping** we could configure CORS to all URLs that are handled by Spring Web MVC.

To define the same configuration (as explained in the previous sections) globally, we could use the configuration parameters
defined in **application.yml** to create a bean as defined below:

````yaml
    web:
    cors:
      allowed-origins: "http://localhost:4200"
      allowed-methods: GET, POST, PATCH, PUT, DELETE, OPTIONS, HEAD
      max-age: 3600
      allowed-headers: "Requestor-Type"
      exposed-headers: "X-Get-Header"
````

````java
    @Bean
    public WebMvcConfigurer corsMappingConfigurer() {
            return new WebMvcConfigurer() {
                @Override
                public void addCorsMappings(CorsRegistry registry) {
                    WebConfigProperties.Cors cors = webConfigProperties.getCors();
                    registry.addMapping("/**")
                    .allowedOrigins(cors.getAllowedOrigins())
                    .allowedMethods(cors.getAllowedMethods())
                    .maxAge(cors.getMaxAge())
                    .allowedHeaders(cors.getAllowedHeaders())
                    .exposedHeaders(cors.getExposedHeaders());
            }
        };
    }
````

{{% info title="NOTE:" %}}
**addMapping()** returns a **CorsRegistration** object which applies default **CorsConfiguration** if
one or more methods **allowedOrigins**, **allowedMethods**, **maxAge**, **allowedHeaders**, **exposedHeaders** are not explicitly defined.
Refer to the Spring library method **CorsConfiguration.applyPermitDefaultValues()** to understand the defaults applied.
{{% /info %}}

