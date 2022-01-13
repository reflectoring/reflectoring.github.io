---
authors: [tom]
title: "Validation with Spring Boot - the Complete Guide"
categories: ["Spring Boot"]
date: 2021-08-05T00:00:00
modified: 2021-08-05T00:00:00
excerpt: "A tutorial consolidating the most important features you'll need to integrate Bean Validation into your Spring Boot application. "
image: images/stock/0051-stop-1200x628-branded.jpg
url: bean-validation-with-spring-boot
---


[Bean Validation](https://beanvalidation.org/) is the de-facto standard for implementing validation
logic in the Java ecosystem. It's well integrated with Spring and Spring Boot. 

However, there are some pitfalls. This tutorial goes over all major validation use cases
and sports code examples for each.   
  
{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/validation" %}} 

## Using the Spring Boot Validation Starter

Spring Boot's Bean Validation support comes with the validation starter, which we can include into 
our project (Gradle notation):

```groovy
implementation('org.springframework.boot:spring-boot-starter-validation')
```

It's not necessary to add the version number since the Spring Dependency Management Gradle plugin does
that for us. If you're not using the plugin, you can find the most recent version 
[here](https://search.maven.org/search?q=g:org.springframework.boot%20AND%20a:spring-boot-starter-validation&core=gav).

However, if we have also included the web starter, the validation starter comes for free:

```groovy
implementation('org.springframework.boot:spring-boot-starter-web')
```

Note that the validation starter does no more than adding a dependency to a compatible version of
[hibernate validator](https://search.maven.org/search?q=g:org.hibernate.validator%20AND%20a:hibernate-validator&core=gav), which is 
the most widely used implementation of the Bean Validation specification.

## Bean Validation Basics

Very basically, Bean Validation works by defining constraints to the fields of a class by annotating
them with certain [annotations](https://docs.jboss.org/hibernate/beanvalidation/spec/2.0/api/javax/validation/constraints/package-summary.html). 

### Common Validation Annotations

Some of the most common validation annotations are:

* **`@NotNull`:** to say that a field must not be null.
* **`@NotEmpty`:** to say that a list field must not empty.
* **`@NotBlank`:** to say that a string field must not be the empty string (i.e. it must have at least one character).
* **`@Min` and `@Max`:** to say that a numerical field is only valid when it's value is above or below a certain value.
* **`@Pattern`:** to say that a string field is only valid when it matches a certain regular expression.
* **`@Email`:** to say that a string field must be a valid email address.

An example of such a class would look like this:

```java
class Customer {

  @Email
  private String email;

  @NotBlank
  private String name;
  
  // ...
}
```

### Validator

To validate if an object is valid, we pass it into a [Validator](https://docs.jboss.org/hibernate/beanvalidation/spec/2.0/api/javax/validation/Validator.html)
which checks if the constraints are satisfied:

```java
Set<ConstraintViolation<Input>> violations = validator.validate(customer);
if (!violations.isEmpty()) {
  throw new ConstraintViolationException(violations);
}
```

More about using a `Validator` in the [section about validating programmatically](#validating-programmatically).

### `@Validated` and `@Valid`

In many cases, however, Spring does the validation for us. We don't even need to create a validator object ourselves. Instead, we can let Spring know that we want to have a certain object validated. This works by using the the `@Validated` and `@Valid` annotations. 

The `@Validated` annotation is a class-level annotation that we can use to tell Spring to validate parameters that are passed into a method of the annotated class. We'll learn more about how to use it in the section about [validating path variables and request parameters](#validating-path-variables-and-request-parameters).  

We can put the `@Valid` annotation on method parameters and fields to tell Spring that we want a method parameter or field to be validated. We'll learn all about this annotation in the [section about validating a request body](#validating-a-request-body).   

## Validating Input to a Spring MVC Controller

Let's say we have implemented a Spring REST controller and want to validate the input that' passed in by a client. There are three 
things we can validate for any incoming HTTP request:

* the request body,
* variables within the path (e.g. `id` in `/foos/{id}`) and,
* query parameters.

Let's look at each of those in more detail.

### Validating a Request Body

In POST and PUT requests, it's common to pass a JSON payload within the request body. Spring automatically maps 
the incoming JSON to a Java object. Now, we want to check if the incoming Java object meets our requirements.

This is our incoming payload class:

```java
class Input {

  @Min(1)
  @Max(10)
  private int numberBetweenOneAndTen;

  @Pattern(regexp = "^[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}$")
  private String ipAddress;
  
  // ...
}
```

We have an `int` field that must have a value between 1 and 10, inclusively, as defined by the `@Min` and `@Max` annotations. We also have a `String`
field that must contain an IP address, as defined by the regex in the `@Pattern` annotation (the regex actually still allows invalid IP addresses with octets
greater than 255, but we're going to fix that later in the tutorial, [when we're building a custom validator](#a-custom-validator-with-spring-boot)).

To validate the request body of an incoming HTTP request, we annotate the request body with the `@Valid` annotation in a REST controller:

```java
@RestController
class ValidateRequestBodyController {

  @PostMapping("/validateBody")
  ResponseEntity<String> validateBody(@Valid @RequestBody Input input) {
    return ResponseEntity.ok("valid");
  }

}
```

We simply have added the `@Valid` annotation to the `Input` parameter, which is also annotated with `@RequestBody`
to mark that it should be read from the request body. By doing this,
we're telling Spring to pass the object to a `Validator` before doing anything else. 

<div class="notice warning">
  <h4>Use <code>@Valid</code> on Complex Types</h4>
  If the <code>Input</code> class contains a field with another complex type that should be validated, this field, too, needs
  to be annotated with <code>@Valid</code>.
</div>

If the validation fails, it will trigger a `MethodArgumentNotValidException`. By default, Spring will translate
this exception to a HTTP status 400 (Bad Request). 

We can verify this behavior with an integration test:

```java
@ExtendWith(SpringExtension.class)
@WebMvcTest(controllers = ValidateRequestBodyController.class)
class ValidateRequestBodyControllerTest {

  @Autowired
  private MockMvc mvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void whenInputIsInvalid_thenReturnsStatus400() throws Exception {
    Input input = invalidInput();
    String body = objectMapper.writeValueAsString(input);

    mvc.perform(post("/validateBody")
            .contentType("application/json")
            .content(body))
            .andExpect(status().isBadRequest());
  }
}
```

You can find more details about testing Spring MVC controllers in
[my article about the `@WebMvcTest` annotation](/spring-boot-web-controller-test/).  

### Validating Path Variables and Request Parameters

Validating path variables and request parameters works a little differently.

We're not validating complex Java objects in this case, since path variables and request parameters are 
primitive types like `int` or their counterpart objects like `Integer` 
or `String`. 

Instead of annotating a class field like above, we're adding a constraint annotation (in this case `@Min`) directly to
the method parameter in the Spring controller:  

```java
@RestController
@Validated
class ValidateParametersController {

  @GetMapping("/validatePathVariable/{id}")
  ResponseEntity<String> validatePathVariable(
      @PathVariable("id") @Min(5) int id) {
    return ResponseEntity.ok("valid");
  }
  
  @GetMapping("/validateRequestParameter")
  ResponseEntity<String> validateRequestParameter(
      @RequestParam("param") @Min(5) int param) { 
    return ResponseEntity.ok("valid");
  }
}
```

Note that we have to add Spring's `@Validated` annotation to the controller at class level to tell Spring to 
evaluate the constraint annotations on method parameters. 

The `@Validated` annotation is only evaluated
on class level in this case, even though it's allowed to be used on methods (we'll learn why it's allowed on
method level when discussing [validation groups](#using-validation-groups-to-validate-objects-differently-for-different-use-cases) later).

In contrast to request body validation a failed validation will trigger a `ConstraintViolationException`
instead of a `MethodArgumentNotValidException`. Spring does not register a default exception handler for this exception,
so it will by default cause a response with HTTP status 500 (Internal Server Error).

If we want to return a HTTP status 400 instead (which makes sense, since the client provided an invalid
parameter, making it a bad request), we can add a custom exception handler to our contoller:

```java
@RestController
@Validated
class ValidateParametersController {

  // request mapping method omitted
  
  @ExceptionHandler(ConstraintViolationException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  ResponseEntity<String> handleConstraintViolationException(ConstraintViolationException e) {
    return new ResponseEntity<>("not valid due to validation error: " + e.getMessage(), HttpStatus.BAD_REQUEST);
  }

}
```

Later in this tutorial we will look at how to return a [structured error response](#returning-structured-error-responses)
that contains details on all failed validations for the client to inspect.

We can verify the validation behavior with an integration test:

```java
@ExtendWith(SpringExtension.class)
@WebMvcTest(controllers = ValidateParametersController.class)
class ValidateParametersControllerTest {

  @Autowired
  private MockMvc mvc;

  @Test
  void whenPathVariableIsInvalid_thenReturnsStatus400() throws Exception {
    mvc.perform(get("/validatePathVariable/3"))
            .andExpect(status().isBadRequest());
  }

  @Test
  void whenRequestParameterIsInvalid_thenReturnsStatus400() throws Exception {
    mvc.perform(get("/validateRequestParameter")
            .param("param", "3"))
            .andExpect(status().isBadRequest());
  }

}
```

## Validating Input to a Spring Service Method

Instead of (or additionally to) validating input on the controller level, we can also validate the input to
any Spring components. In order to to this, we use a combination of the `@Validated` and `@Valid` annotations:

```java
@Service
@Validated
class ValidatingService{

    void validateInput(@Valid Input input){
      // do something
    }

}
```

Again, the `@Validated` annotation is only evaluated on class level, so don't put it on a method in this use case.

Here's a test verifying the validation behavior:

```java
@ExtendWith(SpringExtension.class)
@SpringBootTest
class ValidatingServiceTest {

  @Autowired
  private ValidatingService service;

  @Test
  void whenInputIsInvalid_thenThrowsException(){
    Input input = invalidInput();

    assertThrows(ConstraintViolationException.class, () -> {
      service.validateInput(input);
    });
  }

}
```

## Validating JPA Entities

The last line of defense for validation is the persistence layer. By default, Spring Data uses Hibernate underneath,
which supports Bean Validation out of the box. 

<div class="notice success">
  <h4>Is the Persistence Layer the right Place for Validation?</h4>
  <p>
  We usually don't want to do validation as late as in the persistence layer because it means that the 
  business code above has worked with potentially invalid objects which may lead to unforeseen errors. More on this topic in my article about <a href="/bean-validation-anti-patterns/#anti-pattern-1-validating-only-in-the-persistence-layer">Bean Validation anti-patterns</a>.
  </p>
</div>

Let's say want to store objects of our `Input` class to the database. First, we add the necessary JPA annotation 
`@Entity` and add an ID field:

```java
@Entity
public class Input {

  @Id
  @GeneratedValue
  private Long id;

  @Min(1)
  @Max(10)
  private int numberBetweenOneAndTen;

  @Pattern(regexp = "^[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}$")
  private String ipAddress;
  
  // ...
  
}
```

Then, we create a Spring Data repository that provides us with methods to persist and query for
`Input` objects:

```java
public interface ValidatingRepository extends CrudRepository<Input, Long> {}
```

By default, any time we use the repository to store an `Input` object whose constraint annotations are violated,
we'll get a `ConstraintViolationException` as this integration test demonstrates:

```java
@ExtendWith(SpringExtension.class)
@DataJpaTest
class ValidatingRepositoryTest {

  @Autowired
  private ValidatingRepository repository;

  @Autowired
  private EntityManager entityManager;

  @Test
  void whenInputIsInvalid_thenThrowsException() {
    Input input = invalidInput();

    assertThrows(ConstraintViolationException.class, () -> {
      repository.save(input);
      entityManager.flush();
    });
  }

}
``` 
You can find more details about testing Spring Data repositories in
my [article about the `@DataJpaTest` annotation](/spring-boot-data-jpa-test/).

Note that Bean Validation is only triggered by Hibernate once the `EntityManager` is flushed. Hibernate flushes
thes `EntityManager` automatically under certain circumstances, but in the case of our integration test
we have to do this by hand.

If for any reason we want to disable Bean Validation in our Spring Data repositories, we can set the
Spring Boot property `spring.jpa.properties.javax.persistence.validation.mode` to `none`.

## A Custom Validator with Spring Boot

If the available [constraint annotations](https://docs.jboss.org/hibernate/beanvalidation/spec/2.0/api/javax/validation/constraints/package-summary.html)
do not suffice for our use cases, we might want to create one ourselves.

In the `Input` class from above, we used a regular expression to validate that a String is a valid IP address.
However, the regular expression is not complete: it allows octets with values greater than 255 (i.e. "111.111.111.333"
would be considered valid).

Let's fix this by implementing a validator that implements this check in Java instead of with a regular expression (yes,
I know that we could just use a more complex regular expression to achieve the same result, 
but we like to implement validations in Java, don't we?).

First, we create the custom constraint annotation `IpAddress`:

```java
@Target({ FIELD })
@Retention(RUNTIME)
@Constraint(validatedBy = IpAddressValidator.class)
@Documented
public @interface IpAddress {

  String message() default "{IpAddress.invalid}";

  Class<?>[] groups() default { };

  Class<? extends Payload>[] payload() default { };

}
```

A custom constraint annotation needs all of the following:

* the parameter `message`, pointing to a property key in `ValidationMessages.properties`, which is used
  to resolve a message in case of violation,
* the parameter `groups`, allowing to define under which circumstances this validation is to be triggered
  (we're going to talk about [validation groups](#using-validation-groups-to-validate-objects-differently-for-different-use-cases) later),
* the parameter `payload`, allowing to define a payload to be passed with this validation (since this is 
  a rarely used feature, we'll not cover it in this tutorial), and
* a `@Constraint` annotation pointing to an implementation of the `ConstraintValidator` interface.

The validator implementation looks like this:

```java
class IpAddressValidator implements ConstraintValidator<IpAddress, String> {

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    Pattern pattern = 
      Pattern.compile("^([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3})$");
    Matcher matcher = pattern.matcher(value);
    try {
      if (!matcher.matches()) {
        return false;
      } else {
        for (int i = 1; i <= 4; i++) {
          int octet = Integer.valueOf(matcher.group(i));
          if (octet > 255) {
            return false;
          }
        }
        return true;
      }
    } catch (Exception e) {
      return false;
    }
  }
}
```

We can now use the `@IpAddress` annotation just like any other constraint annotation:

```java
class InputWithCustomValidator {

  @IpAddress
  private String ipAddress;
  
  // ...

}
```

## Validating Programmatically

There may be cases when we want to invoke validation programmatically instead of relying on Spring's built-in
Bean Validation support. In this case, we can use the Bean Validation API directly.

**We create a `Validator` by hand** and invoke it to trigger a validation:  

```java
class ProgrammaticallyValidatingService {
  
  void validateInput(Input input) {
    ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
    Validator validator = factory.getValidator();
    Set<ConstraintViolation<Input>> violations = validator.validate(input);
    if (!violations.isEmpty()) {
      throw new ConstraintViolationException(violations);
    }
  }
  
}
```

This requires no Spring support whatsoever.

**However, Spring Boot provides us with a pre-configured `Validator` instance**. We can inject this
instance into our service and use this instance instead of creating one by hand:

```java
@Service
class ProgrammaticallyValidatingService {

  private Validator validator;

  ProgrammaticallyValidatingService(Validator validator) {
    this.validator = validator;
  }

  void validateInputWithInjectedValidator(Input input) {
    Set<ConstraintViolation<Input>> violations = validator.validate(input);
    if (!violations.isEmpty()) {
      throw new ConstraintViolationException(violations);
    }
  }
}
```

When this service is instantiated by Spring, it will automatically have a `Validator` instance injected into the
constructor.

The following unit test proves that both methods above work as expected:

```java
@ExtendWith(SpringExtension.class)
@SpringBootTest
class ProgrammaticallyValidatingServiceTest {

  @Autowired
  private ProgrammaticallyValidatingService service;

  @Test
  void whenInputIsInvalid_thenThrowsException(){
    Input input = invalidInput();

    assertThrows(ConstraintViolationException.class, () -> {
      service.validateInput(input);
    });
  }

  @Test
  void givenInjectedValidator_whenInputIsInvalid_thenThrowsException(){
    Input input = invalidInput();

    assertThrows(ConstraintViolationException.class, () -> {
      service.validateInputWithInjectedValidator(input);
    });
  }

}
```   

## Using Validation Groups to Validate Objects Differently for Different Use Cases

Often, certain objects are shared between different use cases. 

Let's take the typical CRUD operations,
for example: the "Create" use case and the "Update" use case will most probably both take the same object type
as input. However, there may be validations that should be triggered under different circumstances: 

* only in the "Create" use case,
* only in the "Update" use case, or
* in both use cases.

**The Bean Validation feature that allows us to implement validation rules like this is called "Validation Groups"**.

We have already seen that all constraint annotations must have a `groups` field. This can be used to pass any classes
that each define a certain validation group that should be triggered.

For our CRUD example, we simply define two marker interfaces `OnCreate` and `OnUpdate`:

```java
interface OnCreate {}

interface OnUpdate {}
```

We can then use these marker interfaces with any constraint annotation like this:

```java
class InputWithGroups {

  @Null(groups = OnCreate.class)
  @NotNull(groups = OnUpdate.class)
  private Long id;
  
  // ...
  
}
```

This will make sure that the ID is empty in our "Create" use case and that it's not empty in our "Update" use case.

Spring supports validation groups with the `@Validated` annotation:

```java
@Service
@Validated
class ValidatingServiceWithGroups {

    @Validated(OnCreate.class)
    void validateForCreate(@Valid InputWithGroups input){
      // do something
    }

    @Validated(OnUpdate.class)
    void validateForUpdate(@Valid InputWithGroups input){
      // do something
    }

}
```

Note that the `@Validated` annotation must again be applied to the whole class. To define which validation group
should be active, it must also be applied at method level. 

To make certain that the above works as expected, we can implement a unit test:

```java
@ExtendWith(SpringExtension.class)
@SpringBootTest
class ValidatingServiceWithGroupsTest {

  @Autowired
  private ValidatingServiceWithGroups service;

  @Test
  void whenInputIsInvalidForCreate_thenThrowsException() {
    InputWithGroups input = validInput();
    input.setId(42L);
    
    assertThrows(ConstraintViolationException.class, () -> {
      service.validateForCreate(input);
    });
  }

  @Test
  void whenInputIsInvalidForUpdate_thenThrowsException() {
    InputWithGroups input = validInput();
    input.setId(null);
    
    assertThrows(ConstraintViolationException.class, () -> {
      service.validateForUpdate(input);
    });
  }

}
```

<div class="notice warning">
  <h4>Careful with Validation Groups</h4>
  Using validation groups can easily become an anti-pattern since we're mixing concerns. With
  validation groups the validated entity has to know the validation rules for all the use cases
  (groups) it is used in. More on this topic in my article about 
  <a href="/bean-validation-anti-patterns/#anti-pattern-3-using-validation-groups-for-use-case-validations">Bean Validation anti-patterns</a>.
</div>

## Handling Validation Errors

When a validation fails, we want to return a meaningful error message to the client. In order to enable the client
to display a helpful error message, **we should return a data structure that contains an error message for each 
validation that failed**.

First, we need to define that data structure. We'll call it `ValidationErrorResponse` and it contains
a list of `Violation` objects:

```java
public class ValidationErrorResponse {

  private List<Violation> violations = new ArrayList<>();

  // ...
}

public class Violation {

  private final String fieldName;

  private final String message;

  // ...
}
``` 

Then, we create a global `ControllerAdvice` that handles all `ConstraintViolationExceptions` that bubble up to the
controller level. In order to catch validation errors for [request bodies](#validating-a-request-body) as well, we will
also handle `MethodArgumentNotValidExceptions`:

```java
@ControllerAdvice
class ErrorHandlingControllerAdvice {

  @ExceptionHandler(ConstraintViolationException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  @ResponseBody
  ValidationErrorResponse onConstraintValidationException(
      ConstraintViolationException e) {
    ValidationErrorResponse error = new ValidationErrorResponse();
    for (ConstraintViolation violation : e.getConstraintViolations()) {
      error.getViolations().add(
        new Violation(violation.getPropertyPath().toString(), violation.getMessage()));
    }
    return error;
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  @ResponseBody
  ValidationErrorResponse onMethodArgumentNotValidException(
      MethodArgumentNotValidException e) {
    ValidationErrorResponse error = new ValidationErrorResponse();
    for (FieldError fieldError : e.getBindingResult().getFieldErrors()) {
      error.getViolations().add(
        new Violation(fieldError.getField(), fieldError.getDefaultMessage()));
    }
    return error;
  }

}
```

What we're doing here is simply reading information about the violations out of the exceptions and translating them
into our `ValidationErrorResponse` data structure.

Note the `@ControllerAdvice` annotation which makes the exception handler methods available globally to all
controllers within the application context.

## Conclusion
In this tutorial, we've gone through all major validation features we might need when building an application with
Spring Boot.  

If you want to get your hands dirty on the example code, have a look at the 
[github repository](https://github.com/thombergs/code-examples/tree/master/spring-boot/validation).

## Update History
* **2021-08-05:** updated and polished the article a bit. 
* **2018-10-25:** added a word of caution on using bean validation in the persistence layer 
(see [this](https://twitter.com/olivergierke/status/1055015506326052865) thread on Twitter). 
