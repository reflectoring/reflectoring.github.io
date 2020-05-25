---
title: Code-First API Documentation with Swagger
categories: [spring-boot]
date: 
modified: 
author: petros
excerpt: "What's the 'Code-First' Approach? And how do we go about it with Springdoc and Spring Boot? This guide explains and showcases this approach."
image:
  auto: 0035-switchboard
tags: ["spring-boot", "code-first-approach", "swagger"]
---

When following a Code-First approach, we first start with the development, and then we might generate the specification, which then becomes the documentation.

Let's see, what are the benefits of using this approach.

## When to choose Code-First Approach

When we need to go **fast** in production it is the best approach. Then we can generate our documentation from the API.

Code-First is also good, while the documentation will be generated from the actual Code. Which means, we don't have to keep in **sync** other files.

## Spring Boot 

For our post we will be using [Spring Boot](https://spring.io/projects/spring-boot) together with [springdoc-openapi](https://springdoc.org/).

Springdoc integrates nicely with Spring Boot and will help us generate our documentation.

### Example

#### Getting started

To easily get started we only need to add the Springdoc dependency in our `build.gradle`

```groovy
implementation 'org.springdoc:springdoc-openapi-ui:1.3.3'
```

First let us define the path of our documentation. This can be defined easily in the application.yml of our project:

```yaml
springdoc:
  api-docs:
    path: /reflectoring-openapi
```

This, is where our OpenAPI specification lives, which then springdoc uses to beautifully display our endpoints. For more configuration properties please check the [official documentation](https://springdoc.org/springdoc-properties.html).

#### Define APIs Information

Let us define some information about our API.

```java
@OpenAPIDefinition(
        info = @Info(
                title = "Code-First Approach (reflectoring.io)",
                description = "" +
                        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur et rhoncus quam. Aenean quis augue ac eros pulvinar malesuada. " +
                        "In sagittis elit egestas tincidunt iaculis. " +
                        "Donec eu lacus vitae nulla varius consectetur a vel quam. Aliquam erat volutpat. Duis eget ullamcorper tellus",
                contact = @Contact(name = "Reflectoring", url = "https://reflectoring.io", email = "petros.stergioulas94@gmail.com"),
                license = @License(name = "MIT Licence", url = "https://github.com/thombergs/code-examples/blob/master/LICENSE")),
        servers = @Server(url = "http://localhost:8080")
)
```

Now, start the server and navigate to: http://localhost:8080/swagger-ui/index.html?configUrl=/reflectoring-openapi/swagger-config

You can see now the information that we defined above!
![General Information](/assets/img/posts/reflect92/general-info.png)

#### Define Rest API

In this section, we will define our Rest endpoint.

```java
@RequestMapping("/api/todos")
@Tag(name = "Todo API", description = "euismod in pellentesque massa placerat duis ultricies lacus sed turpis")
interface TodoApi {

    @GetMapping
    @ResponseStatus(code = HttpStatus.OK)
    List<Todo> findAll();

    @GetMapping("/{id}")
    @ResponseStatus(code = HttpStatus.OK)
    Todo findById(@PathVariable String id);

    @PostMapping
    @ResponseStatus(code = HttpStatus.CREATED)
    Todo save(@RequestBody Todo todo);

    @PutMapping("/{id}")
    @ResponseStatus(code = HttpStatus.OK)
    Todo update(@PathVariable String id, @RequestBody Todo todo);

    @DeleteMapping("/{id}")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    void delete(@PathVariable String id);
}
```

The `@Tag` annotation simple describes the endpoint.

Implementing this interface and annotating our controller with 
`@RestController` will let springdoc know that this is a controller and should produce a documentation for it.
```java
@RestController
class TodoController implements TodoApi {
  // omit implementation, not relevant    
}
```

Navigate again to http://localhost:8080/swagger-ui/index.html?configUrl=/reflectoring-openapi/swagger-config and take a quick look.

![Todo API Information](/assets/img/posts/reflect92/todo-api-info.png)

Springdoc did its magic and created us the documentation for our API!

Let's dive a little more on Springdoc by defining also a security scheme.

#### Define Security Scheme

To define a Security Scheme for our application we just need to add the `@SecurityScheme` annotation:

```java
@SecurityScheme(name = "api", scheme = "basic", type = SecuritySchemeType.HTTP, in = SecuritySchemeIn.HEADER)
```

The above `@SecurityScheme` will be referred as "api" and will do a **basic** authentication via **http**

Let's see what this annotation produced for us:

![Secure Scheme](/assets/img/posts/reflect92/secure-scheme.png)

Our documentation has now also an Authorize Button! If we press this button we will the dialog where we can authenticate.

![Secure Scheme Dialog](/assets/img/posts/reflect92/secure-scheme-dialog.png)

To define that an api endpoint uses the above scheme we have to define it with the `@SecurityRequirement` annotation:

```java
@SecurityRequirement(name = "api")
```

Now our TodoApi Interface looks like this:

```java
@RequestMapping("/api/todos")
@Tag(name = "Todo API", description = "euismod in pellentesque massa placerat duis ultricies lacus sed turpis")
@SecurityRequirement(name = "api")
interface TodoApi {

    @GetMapping
    @ResponseStatus(code = HttpStatus.OK)
    List<Todo> findAll();

    @GetMapping("/{id}")
    @ResponseStatus(code = HttpStatus.OK)
    Todo findById(@PathVariable String id);

    @PostMapping
    @ResponseStatus(code = HttpStatus.CREATED)
    Todo save(@RequestBody Todo todo);

    @PutMapping("/{id}")
    @ResponseStatus(code = HttpStatus.OK)
    Todo update(@PathVariable String id, @RequestBody Todo todo);

    @DeleteMapping("/{id}")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    void delete(@PathVariable String id);
}
```

Now we can see that our API is "secured".

![Todo API with lock](/assets/img/posts/reflect92/todo-api-info-with-lock.png)

Actually it is not, if we try to request `/api/todos` resource we will still be able to receive the data without a problem.

![Todo API with lock unsecured](/assets/img/posts/reflect92/todo-api-info-with-lock-unsecured.png)

For demonstration purposes we secured our application with `spring-security`. You can check the [repository](todo_link)  for the full implementation.

After securing the application we can now see that we receive `401` status code if we try to access any resource under `/api/todos`.

![Todo API with lock secured 401](/assets/img/posts/reflect92/todo-api-info-with-lock-secured-401.png)

After authenticating we can again access the resource:

![Todo API with lock secured 200](/assets/img/posts/reflect92/todo-api-info-with-lock-secured-200.png)

## Conclusion

As we saw in this article Code-First Approach is all about speed. First we define our API then we generate the documentation via annotations.
Springdoc elevates Swagger and helps us create our own OpenAPI Specification.





