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

Exception handling in a conventional JAVA application is a trivial task, but if we are using Spring Boot then we have more than
one way of doing the same.

This article will explore those ways and will also provide some pointers on when a given way might be suitable over the 
other.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/exception-handling" %}

## Introduction 

Spring Boot provides us tools to handle exceptions beyond simple 'Try-Catch'. These tools are nothing, but a handful of
annotations that allow us to treat exception handling as a cross-cutting concern.

* [@ResponseStatus](#responsestatus)
* [@ExceptionHandler](#exceptionhandler)
* [@ControllerAdvice](#controlleradvice)

Before jumping onto these annotations we will first look at how Spring handles exceptions thrown by our controllers - Our last line of defense for catching an exception.
We will also look at the number of configurations provided by the framework in order to modify the default behavior.
We will identify the challenges we face while doing that, and then we will try to overcome those using these annotations.

## Spring Boot's Default Exception Handling Mechanism

Let's say we have a controller named `ProductController` whose `getProduct(...)` method is throwing a runtime exception called
`NoSuchElementFound` when `Product` with a given id is not found.

```java
@RestController
@RequestMapping("/product")
public class ProductController {
  private final ProductService productService;
  //constructor omitted for brevity...
  
  @GetMapping("/{id}")
  public Response getProduct(@PathVariable String id){
      return productService.getProduct(id);
  }
  
}
```

If we call `/product` API with invalid `id` the service will throw `NoSuchElementFoundException` and we will get the
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

We can see that besides a well-formed error response payload it is not giving us any useful information. Even the `message`
the field is empty which should at least have 'Item with id 1 not found' that our exception is carrying.

Let's start by fixing the error message issue.

Spring Boot provides a number of properties using which we can add exception message, exception class, or even have a stack trace
as part of the response payload.

```yaml
server:
  error:
    include-message: always
    include-binding-errors: always
    include-stacktrace: on_trace_param
    include-exception: false
```

Using these [Spring Boot server properties](https://docs.spring.io/spring-boot/docs/current/reference/html/appendix-application-properties.html#server-properties) we can basically alter the error response to some extent.

Now if we call the `/product` API again with invalid `id` we will get the following response:

```json
{
  "timestamp": "2020-11-29T09:42:12.287+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Item with id 1 not found",
  "path": "/product/1"
} 
```
You can notice that for `include-stacktrace` we have set value `on_trace_param` which means if we have `/product/1?trace=true` in the query param you
will get a stack trace in the response payload.

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

Moving on! The status and error message - `500` - indicates that something is wrong with our code but in actuality, it's a client error, and
our current status code doesn't correctly reflect that. Unfortunately, this is as far as we can go with the `server.error` configurations.

## `@ResponseStatus`

`@ResponseStatus` as the name suggests allows us to modify the HTTP status of our response. It can be applied at following
places:
* On the exception class itself
* Along with `@ExceptionHandler` annotation on methods
* Along with `@ControllerAdvice` annotation on classes

In this section, we will be looking at the first point only.

Let's come back to the problem at hand which is our error responses aren't giving us status codes that better represent the
corresponding error message.

To address this we can we annotate our Exception class with `@ResponseStatus` and pass in the desired HTTP response status
in its value property:

```java
@ResponseStatus(value = HttpStatus.NOT_FOUND)
public class NoSuchElementFound extends RuntimeException {

}
```

This change will result in a much better response:

```json
{
    "timestamp": "2020-11-29T09:42:12.287+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "Item with id 1 not found",
    "path": "/product/1"
} 
```

Another way to achieve the same is by extending `ResponseStatusException` class:

```java
public class NoSuchElementFoundException extends ResponseStatusException {

    public NoSuchElementFoundException(String message){
        super(HttpStatus.NOT_FOUND, message);
    }
}
```

This approach comes in handy when we want to manipulate the response headers too.

Now, as we can see `@ResponseStatus` along with `server.error` properties allows us to manipulate almost all the fields
in our Spring defined error response payload but, what if want to manipulate response payload structure too? Let's see how
we can achieve that in the next section. 

## `@ExceptionHandler`
`@ExceptionHandler` annotation gives us a lot of flexibility in terms of handling exceptions. For starters, to use it, we
simply need to create a method either in the controller itself or in a `@ControllerAdvice` class and
annotate it with `@ExceptionHandler`.

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
                .status(httpStatus)
                .body(exception.getMessage());
    }

}
```

`@ExceptionHandler` takes in an exception, or a list of exceptions as an argument that we want to handle in the defined
method. If we don't wish to do that then simply defining exception as a parameter of the method will also do:

```java
@ExceptionHandler
public ResponseEntity<String> handleNoSuchElementFoundException(
        NoSuchElementFoundException exception
        )
```

Or we can keep both just as shown in the example controller above. It gives better readability. For the same reason, we have
kept `@ResponseStatus(HttpStatus.NOT_FOUND)` on the handler method. Although it's not required as we have already provided HTTP status in `ResponseEntity`.

Apart from exception parameter we can also have `HttpServletRequest`, `WebRequest`, `HttpSession` types as parameters. Similarly, the handler
methods support a variety of return types such as `ResponseEntity`, `String`, or even `void`.
Find more input and return types in [`@ExceptionHandler` java documentation](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/ExceptionHandler.html).

With the plethora of options available to us in form of both input parameters and return types in our exception handling function,
we are in complete control of the error response.

Now, let's finalize an error response payload for our APIs. In case of any error clients usually expect two things:
* First is error code which tells what kind of error it is. Also, error codes can be used by clients in their code to drive
  some business logic based on it. Usually, error codes are standards HTTP status codes, but I have also seen APIs returning
  custom errors code likes `E001`.
* Second is an additional human-readable message which gives more information on the error and even some hints
  on how to fix them or link to API doc(The way [GitHub APIs](https://docs.github.com/en/free-pro-team@latest/rest/guides/getting-started-with-the-rest-api) does).
* We will add an optional `stackTrace` field which will help us in debugging in the development environment.
* Lastly, we also need to make provisions for giving validations errors in the response. You can find out more about bean 
validations in this article on [Handling Validations with Spring Boot](https://reflectoring.io/bean-validation-with-spring-boot/).

Keeping these points in mind we will go with the following payload:

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

### Giving Stack Trace
Giving stack trace in the error response can save our Developers and QA's trouble of crawling through the log files or console logs or by
whatever means we have used to expose our logs. As we saw in the [Spring Boot's Default Exception Handling Mechanism](#spring-boots-default-exception-handling-mechanism) section that Spring was already providing us
with this functionality but now, as we are handling error responses this also needs to be handled by ourselves.

To achieve this, similar to `server.error` first we have introduced a property named `reflectoring.trace` which if set to `true`
will enable `stack_trace` in the response. In order to actually get `stackTrace` in an API response, our clients must pass
`trace` parameter with the value `true`.

```text
curl --location --request GET 'http://localhost:8080/product/1?trace=true'
```

Now, as the behavior of `strace_trace` is controlled by our feature flag in our properties file, we can remove it or set
to `false` when we deploy in production environments.

### Catch-All Exception

*Gotta catch em all*

```java
try{
    performSomeOperation();
} catch(OperationSpecificException ex){
    //...
} catch(Exception catchAllExcetion){
    //...    
}
```

As a cautionary measure, we often surround our top level method's body with a catch-all Try-Catch exception handler block
in order to avoid any unwanted side effects or behavior. The `handleAllUncaughtException` method in our controller behaves
similarly. **It will catch all the exceptions for which a handler method doesn't exist**.

One thing I would like to note here is that even if we don't have this catch-all exception handler, Spring will handle it
anyway. We handled it because we wanted the response to go in our format rather than Spring's. 

Handler method might also be a good place to log exceptions. This catch-all is one those exceptions that we must log, as 
they might give insight into a possible bug. While we can skip logging field validation exceptions such as `MethodArgumentNotValidException`
as they are raised because of syntactically invalid input.


### Order Of Exception Handler Method

The order in which you mention the handler methods doesn't matter. **Spring will first look for the specific exception handler method**.
If it fails to find it then it will look for its parent class which in our case is `RuntimeException` and hence
`handleAllUncaughtException` method will finally handle the exception.

This should help us handle the exceptions in this particular controller, but what if these same exceptions are being thrown
by other controllers too? How do we handle those? Do we create the same handlers in all controllers or create a base class with
common handlers and extend it in all controllers?

Luckily, we don't have to do any of that. Spring provides a very elegant solution to this problem in form of Controller Advices
let's study them.

## `@ControllerAdvice`
Controller Advice classes allow us to apply exception handlers to more than one or all controllers in our application.

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
        
        ErrorResponse errorResponse = 
                new ErrorResponse(HttpStatus.UNPROCESSABLE_ENTITY.value(),
                        "Validation error. Check 'errors' field for details.");
        
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errorResponse.addValidationError(fieldError.getField(), 
                    fieldError.getDefaultMessage());
        }
        return ResponseEntity
                .unprocessableEntity()
                .body(errorResponse);
    }

    @ExceptionHandler(ItemNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<Object> handleItemNotFoundException(
            ItemNotFoundException itemNotFoundException, 
            WebRequest request
    ){
        
        return buildErrorResponse(
                itemNotFoundException, 
                HttpStatus.NOT_FOUND, 
                request
        );
    }

    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Object> handleAllUncaughtException(
            RuntimeException exception, 
            WebRequest request
    ){
        
        return buildErrorResponse(
                exception,
                "Unknown error occurred",
                HttpStatus.INTERNAL_SERVER_ERROR, 
                request
        );
    }

    private ResponseEntity<Object> buildErrorResponse(
            Exception exception,
            HttpStatus httpStatus,
            WebRequest request
    ) {
        
        return buildErrorResponse(
                exception, 
                exception.getMessage(), 
                httpStatus, request
        );
    }

    private ResponseEntity<Object> buildErrorResponse(
            Exception exception,
            String message,
            HttpStatus httpStatus,
            WebRequest request
    ) {
        
        ErrorResponse errorResponse = new ErrorResponse(
                httpStatus.value(), 
                message
        );
        
        if(printStackTrace && isTraceOn(request)){
            errorResponse.setStackTrace(ExceptionUtils.getStackTrace(exception));
        }
        
        return ResponseEntity
                .status(httpStatus)
                .body(errorResponse);
    }

    private boolean isTraceOn(WebRequest request) {
        String [] value = request.getParameterValues(TRACE);
        return Objects.nonNull(value)
                && value.length > 0
                && value[0].contentEquals("true");
    }

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

The handler functions defined in the above class, and the other support code is almost identical to that we saw in the [@ExceptionHandler](#exceptionhandler) section.  
A couple of things are new which we will talk about in while. One major difference here is that these handlers will handle exceptions thrown by all the controllers
in the application and not just `ProductController`.

If we want to selectively apply or limit the scope of the Controller Advice to a particular controller, or a package we can do it
using a number of its available properties:
* `@ControllerAdvice("com.reflectoring.controller")` - We can pass package name or list of it in the annotation's `value`
  or `basePackages` parameter. With this, Controller Advice will only handle exceptions of this package's controllers.
* `@ControllerAdvice(annotations = Adviced.class)` - Only controllers marked with `@Adivsed` annotation will be advised
  by the Controller Adviser.

Find other parameters in the [`@ControllerAdvice` annotation doc](https://www.javadoc.io/doc/org.springframework/spring-web/4.3.8.RELEASE/org/springframework/web/bind/annotation/ControllerAdvice.html).

### `ResponseEntityExceptionHandler`
According to its documentation, `ResponseEntityExceptionHandler` is a convenient base class for Controller Advice classes. It provides
exception handlers for internal Spring exceptions. If we don't extend it then all the exceptions will be redirected to `DefaultHandlerExceptionResolver`
which returns `ModelAndView` object. Since we are on the mission to handle all the exceptions
by ourselves, we don't want to miss those.

As you can see we have overridden two of the `ResponseEntityExceptionHandler` methods:
* `handleMethodArgumentNotValid` - In [@ExceptionHandler](#exceptionhandler) section we had implemented a handler for it ourselves. In here we have only
  overridden its behavior.
* `handleExceptionInternal` - All the handlers in the `ResponseEntityExceptionHandler` use this function to build the
  `ResponseEntity` similar to our `buildErrorResponse`. If we don't override this then the clients will receive only HTTP status
  in response but since we include HTTP statues in our response bodies as well, we have overridden the method.


<div class="notice warning">
  <h4>Handling `NoHandlerFoundException` will requires few extra Steps</h4>
  <p>
  This exception occurs when you try to call the API which doesn't exist in the system. Despite us implementing it's handler 
  via <code>ResponseEntityExceptionHandler</code> class the exception is redirected to <code>DefaultHandlerExceptionResolver</code>.
  </p>
  <p>
  In order to redirect the exception to our adviser we need to set couple of properties in the the properties file: <code>spring.mvc.throw-exception-if-no-handler-found=true</code> and <code
>spring.web.resources.add-mappings=false</code> 
  </p>
  <p>Credit: Stackoverflow user mengchengfeng <a href="https://stackoverflow.com/questions/36733254/spring-boot-rest-how-to-configure-404-resource-not-found">link</a>.</p>
</div>

### Some Points To Keep In Mind When Using @ControllerAdvice
* To keep things simple always have only one Controller Adviser class in the project. It's good to have a single repository of
  all the exceptions in the application. In case you create multiple then try to utilize `basePackages` or `annotations` property
  to make it clear what controllers it's going to advise.
* **Spring can process Controller Advice classes in any order** so be mindful when you write a catch-all handler in them. Especially
  when you have not specified `basepPackages` or `annotations` in the annotation.

## How Does Spring Process The Exceptions?
Now that we have introduced ourselves with the mechanisms available to us for handling exceptions in Spring, let's
understand in brief how Spring handles it and when one mechanism gets prioritized over the other.

Please go through the following flow chart that traces the process of the exception handling by Spring:

![Spring Exception Handling Flow](/assets/img/posts/spring-exception-handling/spring-exception-handling-mechanism.png)

## Conclusion
When an exception crosses the bounds of the Controller, it's destined to reach the client, either in form of a JSON response
or an HTML web page. In this article, we saw how Spring translates those exceptions into a user-friendly output for our 
clients and also configurations and annotations that allowed us to further mold them into the shape we desired.

Thank you for reading! You can find the working code at [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/exception-handling).
