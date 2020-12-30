---
title: "Complete Guide to Exception Handling in Spring Boot"
categories: [spring-boot]
date: 2020-12-03 00:00:00 +1100
modified: 2020-12-03 00:00:00 +1100
author: mmr
excerpt: "This article showcases various ways to handle exceptions in a Spring Boot Application"
image:
  auto: 0059-library
---

Handling exceptions is an important part of building a robust application. Spring Boot offers more than one way of doing it.

This article will explore these ways and will also provide some pointers on when a given way might be preferable over another.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/exception-handling" %}

## Introduction 

Spring Boot provides us tools to handle exceptions beyond simple 'try-catch' blocks. To use these tools, we apply a couple of annotations 
that allow us to treat exception handling as a cross-cutting concern:

* [`@ResponseStatus`](#responsestatus)
* [`@ExceptionHandler`](#exceptionhandler)
* [`@ControllerAdvice`](#controlleradvice)

Before jumping into these annotations we will first look at how Spring handles exceptions thrown by our web controllers - our last line of defense for catching an exception.

We will also look at a number of configurations provided by Spring Boot to modify the default behavior.

We'll identify the challenges we face while doing that, and then we will try to overcome those using these annotations.

## Spring Boot's Default Exception Handling Mechanism

Let's say we have a controller named `ProductController` whose `getProduct(...)` method is throwing `NoSuchElementFoundException` runtime exception when a `Product` with a given id is not found:

```java
@RestController
@RequestMapping("/product")
public class ProductController {
  private final ProductService productService;
  //constructor omitted for brevity...
  
  @GetMapping("/{id}")
  public Response getProduct(@PathVariable String id){
    // this method throws a "NoSuchElementFoundException" exception
    return productService.getProduct(id);
  }
  
}
```

If we call the `/product` API with an invalid `id` the service will throw a `NoSuchElementFoundException` runtime exception and we'll get the
following response:

```json
{
  "timestamp": "2020-11-28T13:24:02.239+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "",
  "path": "/product/1"
}
```

We can see that besides a well-formed error response, the payload it is not giving us any useful information. Even the `message`
the field is empty which we might want to contain the message of our exception, which would be something like "Item with id 1 not found".

Let's start by fixing the error message issue.

Spring Boot provides a number of properties with which **we can add the exception message, exception class, or even have a stack trace
as part of the response payload**:

```yaml
server:
  error:
  include-message: always
  include-binding-errors: always
  include-stacktrace: on_trace_param
  include-exception: false
```

Using these [Spring Boot server properties](https://docs.spring.io/spring-boot/docs/current/reference/html/appendix-application-properties.html#server-properties) in our `application.yml` we can alter the error response to some extent.

Now if we call the `/product` API again with an invalid `id` we'll get the following response:

```json
{
  "timestamp": "2020-11-29T09:42:12.287+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Item with id 1 not found",
  "path": "/product/1"
} 
```
Note that we've set the property `include-stacktrace` to `on_trace_param` which means that only if we include the `trace` param in the URL (`?trace=true`), we'll get a stack trace in the response payload:

```json
{
  "timestamp": "2020-11-29T09:42:12.287+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Item with id 1 not found",
  "trace": "io.reflectoring.exception.exception.NoSuchElementFoundException: Item with id 1 not found...", 
  "path": "/product/1"
} 
```
We might want to keep the value of `include-stacktrace` flag to `never` only, at least in production, as it might reveal internal
workings of the application.

Moving on! The status and error message - `500` - indicates that something is wrong with our server code but actually it's a client error because the client provided an invalid id.

Our current status code doesn't correctly reflect that. Unfortunately, this is as far as we can go with the `server.error` configuration properties, so we'll have to look at the annotations that Spring Boot offers.

## `@ResponseStatus`

As the name suggests, `@ResponseStatus` allows us to modify the HTTP status of our response. It can be applied at the following
places:

* On the exception class itself
* Along with the `@ExceptionHandler` annotation on methods
* Along with the `@ControllerAdvice` annotation on classes

In this section, we'll be looking at the first case only.

Let's come back to the problem at hand which is **our error responses aren't giving us HTTP status codes that better represent the
corresponding error message**.

To address this we can we annotate our Exception class with `@ResponseStatus` and pass in the desired HTTP response status
in its value property:

```java
@ResponseStatus(value = HttpStatus.NOT_FOUND)
public class NoSuchElementFound extends RuntimeException {
  ...
}
```

This change will result in a much better response if we call our controller:

```json
{
  "timestamp": "2020-11-29T09:42:12.287+00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Item with id 1 not found",
  "path": "/product/1"
} 
```

Another way to achieve the same is by extending the `ResponseStatusException` class:

```java
public class NoSuchElementFoundException extends ResponseStatusException {

  public NoSuchElementFoundException(String message){
    super(HttpStatus.NOT_FOUND, message);
  }
}
```

**This approach comes in handy when we want to manipulate the response headers, too**.

`@ResponseStatus`, in combination with the `server.error` configuration properties, allows us to manipulate almost all the fields
in our Spring-defined error response payload.

But what if want to manipulate the structure of the response payload as well?

Let's see how
we can achieve that in the next section. 

## `@ExceptionHandler`
The `@ExceptionHandler` annotation gives us a lot of flexibility in terms of handling exceptions. For starters, to use it, we
simply need to create a method either in the controller itself or in a `@ControllerAdvice` class and
annotate it with `@ExceptionHandler`:

```java
@RestController
@RequestMapping("/product")
public class ProductController { 
    
  private final ProductService productService;
  
  //constructor omitted for brevity...

  @GetMapping("/{id}")
  public Response getProduct(@PathVariable String id) {
    return productService.getProduct(id);
  }

  @ExceptionHandler(NoSuchElementFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  public ResponseEntity<String> handleNoSuchElementFoundException(
      NoSuchElementFoundException exception
  ) {
    return ResponseEntity
        .status(HttpStatus.NOT_FOUND)
        .body(exception.getMessage());
  }

}
```

The `@ExceptionHandler` method takes in an exception or a list of exceptions as an argument that we want to handle in the defined
method. If we don't wish to do that then simply defining exception as a parameter of the method will also do:

```java
@ExceptionHandler
public ResponseEntity<String> handleNoSuchElementFoundException(
    NoSuchElementFoundException exception)
```

Although, it's a good idea to mention exception class in the annotation even though we have mentioned it in method signature.
It gives better readability. 

Also `@ResponseStatus(HttpStatus.NOT_FOUND)` on the handler method is not required as HTTP status passed in `ResponseEnity`
will take precedence, but we have kept it any way for the same readability reasons.

Apart from the exception parameter we can also have `HttpServletRequest`, `WebRequest`, or `HttpSession` types as parameters. 

Similarly, the handler
methods support a variety of return types such as `ResponseEntity`, `String`, or even `void`.

Find more input and return types in [`@ExceptionHandler` java documentation](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/ExceptionHandler.html).

With the large number of options available to us in form of both input parameters and return types in our exception handling function,
**we are in complete control of the error response**.

Now, let's finalize an error response payload for our APIs. In case of any error, clients usually expect two things:

* First is the error code which tells the client what kind of error it is. Error codes can be used by clients in their code to drive
  some business logic based on it. Usually, error codes are standard HTTP status codes, but I have also seen APIs returning
  custom errors code likes `E001`.
* Second is an additional human-readable message which gives more information on the error and even some hints
  on how to fix them or link to API doc(The way [GitHub APIs](https://docs.github.com/en/free-pro-team@latest/rest/guides/getting-started-with-the-rest-api) does).
  
We will also add an optional `stackTrace` field which will help us with debugging in the development environment.

Lastly, we also need want to handle validation errors in the response. You can find out more about bean 
validations in this article on [Handling Validations with Spring Boot](https://reflectoring.io/bean-validation-with-spring-boot/).

Keeping these points in mind we will go with the following payload for the error response:

```java
@Getter
@Setter
@RequiredArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
  private final int status;
  private final String message;
  private String stackTrace;
  private List<ValidationError> errors;

  @Getter
  @Setter
  @RequiredArgsConstructor
  private static class ValidationError {
    private final String field;
    private final String message;
  }

  public void addValidationError(String field, String message){
    if(Objects.isNull(errors)){
      errors = new ArrayList<>();
    }
    errors.add(new ValidationError(field, message));
  }
}
```

Now, let's apply all these to our `NoSuchElementFoundException` handler method.

```java
@RestController
@RequestMapping("/product")
@AllArgsConstructor
public class ProductController {
  public static final String TRACE = "trace";

  @Value("${reflectoring.trace:false}")
  private boolean printStackTrace;
  
  private final ProductService productService;

  @GetMapping("/{id}")
  public Product getProduct(@PathVariable String id){
    return productService.getProduct(id);
  }

  @PostMapping
  public Product addProduct(@RequestBody @Valid ProductInput input){
    return productService.addProduct(input);
  }

  @ExceptionHandler(NoSuchElementFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  public ResponseEntity<ErrorResponse> handleItemNotFoundException(
      NoSuchElementFoundException exception, 
      WebRequest request
  ){
    log.error("Failed to find the requested element", exception);
    return buildErrorResponse(exception, HttpStatus.NOT_FOUND, request);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
  public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
      MethodArgumentNotValidException ex,
      WebRequest request
  ) {
    ErrorResponse errorResponse = new ErrorResponse(
        HttpStatus.UNPROCESSABLE_ENTITY.value(), 
        "Validation error. Check 'errors' field for details."
    );
    
    for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
      errorResponse.addValidationError(fieldError.getField(), 
          fieldError.getDefaultMessage());
    }
    return ResponseEntity.unprocessableEntity().body(errorResponse);
  }

  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ResponseEntity<ErrorResponse> handleAllUncaughtException(
      Exception exception, 
      WebRequest request){
    log.error("Unknown error occurred", exception);
    return buildErrorResponse(
        exception,
        "Unknown error occurred", 
        HttpStatus.INTERNAL_SERVER_ERROR, 
        request
    );
  }

  private ResponseEntity<ErrorResponse> buildErrorResponse(
      Exception exception,
      HttpStatus httpStatus,
      WebRequest request
  ) {
    return buildErrorResponse(
        exception, 
        exception.getMessage(), 
        httpStatus, 
        request);
  }

  private ResponseEntity<ErrorResponse> buildErrorResponse(
      Exception exception,
      String message,
      HttpStatus httpStatus,
      WebRequest request
  ) {
    ErrorResponse errorResponse = new ErrorResponse(
        httpStatus.value(), 
        exception.getMessage()
    );
    
    if(printStackTrace && isTraceOn(request)){
      errorResponse.setStackTrace(ExceptionUtils.getStackTrace(exception));
    }
    return ResponseEntity.status(httpStatus).body(errorResponse);
  }

  private boolean isTraceOn(WebRequest request) {
    String [] value = request.getParameterValues(TRACE);
    return Objects.nonNull(value)
        && value.length > 0
        && value[0].contentEquals("true");
  }
}
```

Couple of things to note here:

### Providing a Stack Trace
Providing stack trace in the error response can save our developers and QA engineers trouble of crawling through the log files. 

As we saw in [Spring Boot's Default Exception Handling Mechanism](#spring-boots-default-exception-handling-mechanism), Spring already provides us
with this functionality. But now, as we are handling error responses ourselves, this also needs to be handled by us.

To achieve this, first we have introduced a server-side configuration property named `reflectoring.trace` which, if set to `true`,
will enable the `stackTrace` field in the response. In order to actually get a `stackTrace` in an API response, our clients must additionally pass
`trace` parameter with the value `true`:

```text
curl --location --request GET 'http://localhost:8080/product/1?trace=true'
```

Now, as the behavior of `stackTrace` is controlled by our feature flag in our properties file, we can remove it or set
to `false` when we deploy in production environments.

### Catch-All Exception Handler

*Gotta catch em all:*

```java
try{
  performSomeOperation();
} catch(OperationSpecificException ex){
  //...
} catch(Exception catchAllExcetion){
  //...  
}
```

As a cautionary measure, we often surround our top level method's body with a catch-all try-catch exception handler block
, to avoid any unwanted side effects or behavior. The `handleAllUncaughtException()` method in our controller behaves
similarly. **It will catch all the exceptions for which we don't have a specific handler**.

One thing I would like to note here is that even if we don't have this catch-all exception handler, Spring will handle it
anyway. But we want the response to be in our format rather than Spring's, so we have to handle the exception ourselves. 

A handler method might also be a good place to log exceptions. This catch-all is one those exceptions that we must log, as 
they might give insight into a possible bug. While we can skip logging field validation exceptions such as `MethodArgumentNotValidException`
as they are raised because of syntactically invalid input.


### Order of Exception Handlers

The order in which you mention the handler methods doesn't matter. **Spring will first look for the most specific exception handler method**.

If it fails to find it then it will look for a handler of the parent exception, which in our case is `RuntimeException` and if none is found, the
`handleAllUncaughtException()` method will finally handle the exception.

This should help us handle the exceptions in this particular controller, but what if these same exceptions are being thrown
by other controllers too? How do we handle those? Do we create the same handlers in all controllers or create a base class with
common handlers and extend it in all controllers?

Luckily, we don't have to do any of that. Spring provides a very elegant solution to this problem in form of "controller advices".

Let's study them.

## `@ControllerAdvice`

> The term 'Advice' in Controller Advice comes from Aspect Oriented programming which allows us to handle cross-cutting 
> concerns. Similar to that, a Controller Advice allows us to treat exception handling as a cross-cutting concern.

Controller advice classes allow us to apply exception handlers to more than one or all controllers in our application:

```java
@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

  public static final String TRACE = "trace";

  @Value("${reflectoring.trace:false}")
  private boolean printStackTrace;

  @Override
  @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
      MethodArgumentNotValidException ex,
      HttpHeaders headers,
      HttpStatus status,
      WebRequest request
  ) {
      //Body omitted as it's similar to the method of same name
      // in ProductController example...  
      //.....
  }

  @ExceptionHandler(ItemNotFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  public ResponseEntity<Object> handleItemNotFoundException(
      ItemNotFoundException itemNotFoundException, 
      WebRequest request
  ){
      //Body omitted as it's similar to the method of same name
      // in ProductController example...  
      //.....  
  }

  @ExceptionHandler(RuntimeException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ResponseEntity<Object> handleAllUncaughtException(
      RuntimeException exception, 
      WebRequest request
  ){
      //Body omitted as it's similar to the method of same name
      // in ProductController example...  
      //.....
  }
  
  //....

  @Override
  public ResponseEntity<Object> handleExceptionInternal(
      Exception ex,
      Object body,
      HttpHeaders headers,
      HttpStatus status,
      WebRequest request) {

    return buildErrorResponse(ex,status,request);
  }

}
```

The body of the handler functions defined in the above class, and the other support code is omitted as it's almost 
identical to that we saw in the [@ExceptionHandler](#exceptionhandler) section.  

A couple of things are new which we will talk about in while. One major difference here is that these handlers will handle exceptions thrown by all the controllers
in the application and not just `ProductController`.

If we want to selectively apply or limit the scope of the controller advice to a particular controller, or a package, we can use the properties provided by the annotation:

* `@ControllerAdvice("com.reflectoring.controller")`: we can pass a package name or list of package names in the annotation's `value`
  or `basePackages` parameter. With this, the controller advice will only handle exceptions of this package's controllers.
* `@ControllerAdvice(annotations = Advised.class)`: only controllers marked with the `@Advised` annotation will be handled
  by the controller advice.

Find other parameters in the [`@ControllerAdvice` annotation docs](https://www.javadoc.io/doc/org.springframework/spring-web/4.3.8.RELEASE/org/springframework/web/bind/annotation/ControllerAdvice.html).

### `ResponseEntityExceptionHandler`
According to its documentation, `ResponseEntityExceptionHandler` is a convenient base class for   controller advice classes. It provides
exception handlers for internal Spring exceptions. If we don't extend it, then all the exceptions will be redirected to `DefaultHandlerExceptionResolver`
which returns a `ModelAndView` object. Since we are on the mission to handle all the exceptions
by ourselves, we don't want to miss those.

As you can see we have overridden two of the `ResponseEntityExceptionHandler` methods:
* `handleMethodArgumentNotValid()`: in the [@ExceptionHandler](#exceptionhandler) section we have implemented a handler for it ourselves. In here we have only
  overridden its behavior.
* `handleExceptionInternal()`: all the handlers in the `ResponseEntityExceptionHandler` use this function to build the
  `ResponseEntity` similar to our `buildErrorResponse()`. If we don't override this then the clients will receive only the HTTP status
  in the response but since we want to include the HTTP status in our response bodies as well, we have overridden the method.


<div class="notice warning">
  <h4>Handling <code>NoHandlerFoundException`</code> requires few extra Steps</h4>
  <p>
  This exception occurs when you try to call an API which doesn't exist in the system. Despite us implementing it's handler 
  via <code>ResponseEntityExceptionHandler</code> class the exception is redirected to <code>DefaultHandlerExceptionResolver</code>.
  </p>
  <p>
  In order to redirect the exception to our advice we need to set a couple of properties in the the properties file: <code>spring.mvc.throw-exception-if-no-handler-found=true</code> and <code
>spring.web.resources.add-mappings=false</code> 
  </p>
  <p>Credit: <a href="https://stackoverflow.com/questions/36733254/spring-boot-rest-how-to-configure-404-resource-not-found">Stackoverflow user mengchengfeng</a>.</p>
</div>

### Some Points to Keep in Mind when Using @ControllerAdvice

* To keep things simple always have only one Controller Advice class in the project. It's good to have a single repository of
  all the exceptions in the application. In case you create multiple then try to utilize `basePackages` or `annotations` property
  to make it clear what controllers it's going to advise.
* **Spring can process controller advice classes in any order** unless, of course, we haven't annotated it with `@Order` annotation. So, be mindful when you write a catch-all handler in them. Especially
  when you have not specified `basePackages` or `annotations` in the annotation.

## How Does Spring Process The Exceptions?
Now that we have introduced the mechanisms available to us for handling exceptions in Spring, let's
understand in brief how Spring handles it and when one mechanism gets prioritized over the other.

Have a look through the following flow chart that traces the process of the exception handling by Spring:

![Spring Exception Handling Flow](/assets/img/posts/spring-exception-handling/spring-exception-handling-mechanism.png)

## Conclusion
When an exception crosses the bounds of the controller, it's destined to reach the client, either in form of a JSON response
or an HTML web page. 

In this article, we saw how Spring Boot translates those exceptions into a user-friendly output for our 
clients and also configurations and annotations that allow us to further mold them into the shape we desire.

Thank you for reading! You can find the working code at [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/exception-handling).
