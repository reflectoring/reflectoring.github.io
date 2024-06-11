---
authors: [ tom, hardik ]
title: "Validation with Spring Boot - the Complete Guide"
categories: ["Spring Boot"]
date: 2021-08-05T00:00:00
modified: 2024-06-10T00:00:00
description: "A tutorial consolidating the most important features you'll need to integrate Bean Validation into your Spring Boot application."
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
that for us. If you're not using the plugin, you can find the most recent version on
[Maven Central](https://search.maven.org/search?q=g:org.springframework.boot%20AND%20a:spring-boot-starter-validation&core=gav).

Note that the validation starter does no more than adding a dependency to a compatible version of
[hibernate validator](https://search.maven.org/search?q=g:org.hibernate.validator%20AND%20a:hibernate-validator&core=gav), which is 
the most widely used implementation of the Bean Validation specification (JSR-380).

## Bean Validation Basics

Very basically, Bean Validation works by defining constraints to the fields of a class by annotating
them with certain [annotations](https://jakarta.ee/specifications/bean-validation/3.0/apidocs/jakarta/validation/constraints/package-summary). 

### Common Validation Annotations

Some of the most common validation annotations are:

* **`@NotNull`:** to say that a field must not be null.
* **`@NotEmpty`:** to say that a list field must not be empty.
* **`@NotBlank`:** to say that a string field must not be an empty string (i.e. it must have at least one character).
* **`@Min` and `@Max`:** to say that a numerical field is only valid when its value is above or below a certain value.
* **`@Pattern`:** to say that a string field is only valid when it matches a certain regular expression.
* **`@Email`:** to say that a string field must be a valid email address.
* **`@Past`:** to say that a date field must be in the past.

Let's look at an example of how some of these annotations can be used in a Java class:

```java
class Customer {

  @NotBlank
  private String name;

  @Email
  private String email;

  @Min(1)
  @Max(100)
  private int age;

  @Past
  private LocalDate dateOfBirth;
  
  // ... other customer fields
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

Let's say we have implemented a Spring REST controller and want to validate the input that's passed in by a client. There are three 
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

  @Min(value = 1, message = "Number must not be less than 1")
  @Max(value = 10, message = "Number must not be greater than 10")
  private int numberBetweenOneAndTen;

  @Pattern(regexp = "^[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}$", message = "Invalid IP address")
  private String ipAddress;
  
  // ...
}
```

We have an `int` field that must have a value between 1 and 10, inclusively, as defined by the `@Min` and `@Max` annotations. We also have a `String`
field that must contain an IP address, as defined by the regex in the `@Pattern` annotation (the regex actually still allows invalid IP addresses with octets
greater than 255, but we're going to fix that later in the tutorial, [when we're building a custom validator](#a-custom-validator-with-spring-boot)).

Also, currently we've hardcoded the error messages in our validation annotations. We'll look at how they can be [loaded from a properties file](#loading-error-messages-from-a-properties-file) later in the tutorial.

To validate the request body of an incoming HTTP request, we annotate the request body with the `@Valid` annotation in a REST controller:

```java
@RestController
class ValidateRequestBodyController {

  @PostMapping("/validate-request-body")
  ResponseEntity<Void> validateBody(@Valid @RequestBody Input input) {
    return ResponseEntity.ok().build();
  }

}
```

We simply have added the `@Valid` annotation to the `Input` parameter, which is also annotated with `@RequestBody`
to mark that it should be read from the request body. By doing this,
we're telling Spring to pass the object to a `Validator` before doing anything else. 

{{% warning title="Use <code>@Valid</code> on Complex Types" %}}
If the <code>Input</code> class contains a field with another complex type that should be validated, this field, too, needs to be annotated with <code>@Valid</code>.
{{% /warning %}}

If the validation fails, it will trigger a `MethodArgumentNotValidException`. By default, Spring will translate
this exception to a HTTP status 400 (Bad Request). 

We can verify this behavior with an integration test:

```java
@WebMvcTest(controllers = ValidateRequestBodyController.class)
class ValidateRequestBodyControllerTest {

  @Autowired
  private MockMvc mvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void whenInputIsInvalid_thenReturnsStatus400() {
    Input input = invalidInput();
    String body = objectMapper.writeValueAsString(input);

    mvc.perform(post("/validate-request-body")
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

  @GetMapping("/validate-path-variable/{id}")
  ResponseEntity<Void> validatePathVariable(
      @PathVariable("id") @Min(5) int id) {
    return ResponseEntity.ok().build();
  }
  
  @GetMapping("/validate-request-parameter")
  ResponseEntity<Void> validateRequestParameter(
      @RequestParam("param") @Min(5) int param) { 
    return ResponseEntity.ok().build();
  }
}
```

Note that we have to add Spring's `@Validated` annotation to the controller at class level to tell Spring to 
evaluate the constraint annotations on method parameters. 

The `@Validated` annotation is only evaluated
on class level in this case, even though it's allowed to be used on methods (we'll learn why it's allowed on
method level when discussing [validation groups](#using-validation-groups-to-validate-objects-differently-for-different-use-cases) later).

In contrast to request body validation, a failed validation will trigger a `ConstraintViolationException`
instead of a `MethodArgumentNotValidException`. Spring does not register a default exception handler for this exception,
so it will by default cause a response with HTTP status 500 (Internal Server Error).

If we want to return a HTTP status 400 instead (which makes sense, since the client provided an invalid
parameter, making it a bad request), we can add a custom exception handler to our contoller class and return a [`ProblemDetail`](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html) instance:

```java
@RestController
@Validated
class ValidateParametersController {

  // request mapping methods omitted
  
  @ResponseBody
  @ExceptionHandler(ConstraintViolationException.class)
  ProblemDetail handle(ConstraintViolationException exception) {
    String detail = "Validation error: " + exception.getMessage();
    return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
  }

}
```

The `ProblemDetail` class allows us to return a structured error response back to the client without having to create a custom class. It's an implementation of the RFC 9457 specification.

Later in this tutorial, we'll define a global exception handler and look at how we can include the [list of all the failed validations](#handling-validation-errors) for the client to inspect.

We can verify the validation behavior with an integration test:

```java
@WebMvcTest(controllers = ValidateParametersController.class)
class ValidateParametersControllerTest {

  @Autowired
  private MockMvc mvc;

  @Test
  void whenPathVariableIsInvalid_thenReturnsStatus400() {
    String apiPath = "/validate-path-variable/3";
    mvc.perform(get(apiPath))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.instance").value(apiPath))
            .andExpect(jsonPath("$.detail").value(startsWith("Validation error:")));
  }

  @Test
  void whenRequestParameterIsInvalid_thenReturnsStatus400() {
    String apiPath = "/validate-request-parameter";
    mvc.perform(get(apiPath)
            .param("param", "3"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.instance").value(apiPath))
            .andExpect(jsonPath("$.detail").value(startsWith("Validation error:")));
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

{{% info title="Is the Persistence Layer the right Place for Validation?" %}}
We usually don't want to do validation as late as in the persistence layer because it means that the business code above has worked with potentially invalid objects which may lead to unforeseen errors. More on this topic in my article about <a href="/bean-validation-anti-patterns/#anti-pattern-1-validating-only-in-the-persistence-layer">Bean Validation anti-patterns</a>.{{% /info %}}

Let's say want to store objects of our `Input` class to the database. First, we add the necessary JPA annotation 
`@Entity` and add an ID field:

```java
@Entity
class Input {

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
interface ValidatingRepository extends CrudRepository<Input, Long> {}
```

By default, any time we use the repository to store an `Input` object whose constraint annotations are violated,
we'll get a `ConstraintViolationException` as this integration test demonstrates:

```java
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
Spring Boot property `spring.jpa.properties.jakarta.persistence.validation.mode` to `none`.

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
@Target(FIELD)
@Retention(RUNTIME)
@Constraint(validatedBy = IpAddressValidator.class)
@Documented
@interface IpAddress {

  String message() default "Invalid IP address";

  Class<?>[] groups() default { };

  Class<? extends Payload>[] payload() default { };

}
```

A custom constraint annotation needs all of the following:

* the parameter `message`, allowing to specify an error message in case of violation. We've hardcoded a default error message of `Invalid IP address`, we'll look at how this can be [externalized and loaded from a properties file](#loading-error-messages-from-a-properties-file) in the upcoming section.
* the parameter `groups`, allowing to define under which circumstances this validation is to be triggered
  (we're going to talk about [validation groups](#using-validation-groups-to-validate-objects-differently-for-different-use-cases) later),
* the parameter `payload`, allowing to define a payload to be passed with this validation (since this is 
  a rarely used feature, we'll not cover it in this tutorial), and
* a `@Constraint` annotation pointing to an implementation of the `ConstraintValidator` interface.

The validator implementation looks like this:

```java
class IpAddressValidator implements ConstraintValidator<IpAddress, String> {

  private static final Pattern IP_ADDRESS_PATTERN = Pattern.compile("^([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3})$");

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    Matcher matcher = IP_ADDRESS_PATTERN.matcher(value);
    boolean isValidIpAddress = matcher.matches();
    
    if (isValidIpAddress) {
    	isValidIpAddress = isValidOctets(matcher);
    }
    return isValidIpAddress;
  }

  private boolean isValidOctets(Matcher matcher) {
    for (int i = 1; i <= 4; i++) {
      int octet = Integer.parseInt(matcher.group(i));
      if (octet < 0 || octet > 255) {
        return false;
      }
    }
    return true;
  }

}
```

We can now use our custom `@IpAddress` annotation similar to other constraint annotations on our class level fields:

```java
@IpAddress
private String ipAddress;
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

## Validating Properties at Startup

When working with external configuration properties in a Spring Boot application, we often use `@ConfigurationProperties` to bind the required properties to a POJO.

However, in scenarios where we forget to provide a required property or if we provide an invalid value, our application may encounter exceptions at runtime where the properties are referenced. This leads to unexpected application behavior and a poor user experience.

In such a case, **we want our application to fail fast during startup, rather than encountering runtime exceptions later on**.

To achieve this, we can use the Bean Validation annotations on fields of our `@ConfigurationProperties` class:

```java
@Validated
@ConfigurationProperties(prefix = "io.reflectoring.jwt")
class RequiredConfigurationProperties {

  @NotBlank
  private String privateKey;

  @NotNull
  @Positive
  private Integer validityMinutes;

  // ... getter and setter methods

}
```

We take an example of an application that needs the above properties to generate a JWT successfully. We annotate our class with `@ConfigurationProperties` and bind properties with the prefix `io.reflectoring.jwt`.

The `privateKey` field is annotated with `@NotBlank`, indicating that it must not be null or an empty string. The `validityMinutes` field is annotated with `@NotNull` and `@Positive`, enforcing that it must not be null and must be a positive integer.

We've also annotated our class with `@Validated` to trigger Bean Validations.

To enable validation for our `RequiredConfigurationProperties` class, we need to register it with Spring Boot, preferably in a `@Configuration` class:

```java
@EnableConfigurationProperties(RequiredConfigurationProperties.class)
```

Now, if we start our application without providing the required properties or with invalid values, the application context will fail to start, and we'll see an error message in the console similar to:

```console
***************************
APPLICATION FAILED TO START
***************************

Description:

Binding to target io.reflectoring.validation.RequiredConfigurationProperties failed:

    Property: io.reflectoring.jwt.privateKey
    Value: "null"
    Reason: must not be blank

    Property: io.reflectoring.jwt.validityMinutes
    Value: "-90"
    Origin: class path resource [application.properties] - 3:38
    Reason: must be greater than 0

Action:

Update your application's configuration
```

The error message clearly indicates which properties are missing or have invalid values, making it easy to identify and fix the configuration issues.

In addition to using built-in Bean Validation annotations, we can also create custom validation annotations that we've seen, to enforce specific business rules. For example, in our [Integrating Amazon S3 with Spring Boot Using Spring Cloud AWS](https://reflectoring.io/integrating-amazon-s3-with-spring-boot-using-spring-cloud-aws/#validating-bucket-existence-during-startup) article, we'd created a custom `@BucketExists` annotation to validate that a S3 bucket exists in our AWS account with the configured name during application startup to avoid runtime exceptions.

This fail-fast approach helps us maintain a more stable and predictable application behavior.

## Implementing Cross-Field Validation

Sometimes we may have validation rules that span multiple fields. A common example is when a field's validation depends on the value of another field. Let's consider an example:

```java
class ProgrammerRegisterationRequest {

  @NotBlank
  private String programmingLanguage;

  @NotBlank
  private String favoriteIDE;

  // ... getter and setter methods

}
```

We have two fields: `programmingLanguage` and `favoriteIDE` in our class. Let's say we want to apply an unusual validation rule that if the programming language is selected as `Java`, then the favorite IDE cannot be `Notepad` or `Netbeans` (because that would be just weird, right? 😝).

To implement this validation rule, first we'll create a custom constraint annotation `@ProgrammerStereotype`, similar to what we've seen before:

```java
@Documented
@Target(TYPE)
@Retention(RUNTIME)
@Constraint(validatedBy = ProgrammerStereotypeValidator.class)
@interface ProgrammerStereotype {

  String message() default "Stereotype violation detected! IDE and language not vibing.";

  Class<?>[] groups() default { };

  Class<? extends Payload>[] payload() default { };

}
```

Note that we've used `@Target(ElementType.TYPE)` here because this validation spans across multiple fields and will be annotated to our `ProgrammerRegisterationRequest` class, and not just to a single field. This is a key difference from the earlier `@IpAddress` annotation that we created.

Next, let's create our constraint validator implementation:

```java
class ProgrammerStereotypeValidator implements ConstraintValidator < ProgrammerStereotype, ProgrammerRegisterationRequest > {

  private static final List <String> UNWORTHY_JAVA_IDES = List.of("Notepad", "Netbeans");

  @Override
  public boolean isValid(ProgrammerRegisterationRequest request, ConstraintValidatorContext context) {
    if (request.getProgrammingLanguage().equalsIgnoreCase("Java")) {
      if (UNWORTHY_JAVA_IDES.contains(request.getFavoriteIDE())) {
        return false;
      }
    }
    return true;
  }

}
```

In the overriden `isValid()` method, we implement our validation logic. We check if the programming language is `Java` and if the favorite IDE is in the list of unworthy Java IDEs. If both conditions are `true`, we return `false`, indicating that the validation has failed.

We can now annotate the `ProgrammerRegisterationRequest` class with our new `@ProgrammerStereotype` annotation:

```java
@ProgrammerStereotype
class ProgrammerRegisterationRequest {
  // ... same as above
}
```

Finally, in order to ensure our cross-field validation works as expected, let's write a unit test:

```java
class ProgrammerSteriotypeValidationTest {

  private Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

  @Test
  void whenJavaProgrammerUsesNotepad_thenValidationFails() {
    ProgrammerRegisterationRequest request = new ProgrammerRegisterationRequest();
    request.setProgrammingLanguage("Java");
    request.setFavoriteIDE("Notepad");

    var violations = validator.validate(request);

    assertFalse(violations.isEmpty());
    assertThat(violations)
      .extracting(ConstraintViolation::getMessage)
      .contains("Stereotype violation detected! IDE and language not vibing.");
  }

}
```

And there we have it! We've implemented a validation rule that spans multiple fields. By using cross-field validation, we can enforce complex business rules and maintain data consistency in our classes. 

## Using Validation Groups for Conditional Validations

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

{{% warning title="Careful with Validation Groups" %}}
Using validation groups can easily become an anti-pattern since we're mixing concerns. With validation groups the validated entity has to know the validation rules for all the use cases (groups) it is used in. More on this topic in my article about <a href="/bean-validation-anti-patterns/#anti-pattern-3-using-validation-groups-for-use-case-validations">Bean Validation anti-patterns</a>.
{{% /warning %}}

## Handling Validation Errors

When a validation fails, we want to return a meaningful error message to the client. In order to enable the client
to display a helpful error message, **we should return an error message for each validation that failed**.

First, we'll define a custom `Violation` class that contains the name of the field that failed validation and its corresponding error message:

```java
class Violation {

  private String fieldName;

  private String message;

  // ... constructor and getter methods
}
```

We'll add this `Violation` class as a custom property to the `ProblemDetail` instance that we'll return back to the client.

Finally, we create a global `ControllerAdvice` that handles all `ConstraintViolationExceptions` that bubble up to the
controller level. In order to catch validation errors for [request bodies](#validating-a-request-body) as well, we will
also handle `MethodArgumentNotValidExceptions`:

```java
@ControllerAdvice
class ErrorHandlingControllerAdvice {
	
  private static final String VIOLATIONS_KEY = "violations";

  @ExceptionHandler(ConstraintViolationException.class)
  ProblemDetail handle(ConstraintViolationException exception) {
    List < Violation > violations = new ArrayList < > ();
    for (ConstraintViolation<?> violation: exception.getConstraintViolations()) {
      violations.add(new Violation(violation.getPropertyPath().toString(), violation.getMessage()));
    }

    ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failure.");
    problemDetail.setProperty(VIOLATIONS_KEY, violations);
    return problemDetail;
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ProblemDetail handle(MethodArgumentNotValidException exception) {
    List < Violation > violations = new ArrayList < > ();
    for (FieldError fieldError: exception.getBindingResult().getFieldErrors()) {
      violations.add(new Violation(fieldError.getField(), fieldError.getDefaultMessage()));
    }
    ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failure.");
    problemDetail.setProperty(VIOLATIONS_KEY, violations);
    return problemDetail;
  }

}
```

What we're doing here is simply reading information about the violations out of the exceptions, translating them
into our `Violation` class, and adding it as a custom property to the `ProblemDetail` instance.

The resulting JSON error response in an event of a violation exception will look like this:

```json
{
  "detail": "Validation failure.",
  "instance": "/validate-request-body",
  "status": 400,
  "title": "Bad Request",
  "type": "about:blank",
  "violations": [
    {
      "fieldName": "numberBetweenOneAndTen",
      "message": "must be greater than or equal to 1"
    },
    {
      "fieldName": "ipAddress",
      "message": "must match \"^[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}$\""
    }
  ]
}
```

Note the `@ControllerAdvice` annotation which makes the exception handler methods available globally to all
controllers within the application context.

## Loading Error Messages from a Properties File

We've been hardcoding the error messages in our constraint validation annotations throughout this tutorial. A better approach to improve maintainability would be to externalize them into a properties file.

First, we'll create a `validation-errors.properties` file in our `src/main/resources` directory and define our error messages there:

```properties
ip-address.invalid=Invalid IP address: '${validatedValue}'
number.invalid=The provided number '${validatedValue}' must be between ${min} and ${max}
```

Note that we're using the `${validatedValue}` placeholder which will be replaced with the actual value that failed the validation. And the `${min}` and `${max}` placeholders will be replaced with the corresponding constraint values.

We also use the kebab-case for declaring the keys in our `.properties` file as per normal convention.

By default, Spring Boot looks for a file named `messages.properties` in the classpath to load error messages. But since we've used a different file name, we'll need to tell Spring Boot to load error messages from our `validation-errors.properties` file instead:

```java
@Bean
public MessageSource messageSource() {
  ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
  messageSource.setBasenames("classpath:validation-errors");
  return messageSource;
}
```

Alternatively, we can define the base name of our properties file in the `application.properties`:

```properties
spring.messages.basename=validation-errors
```

Both of these approaches take a comma seperated list of values that can be used to register multiple files.

Finally, we'll update our code to reference the error message from our properties file using the `{}` placeholder syntax:

```java
@interface IpAddress {

  String message() default "{ip-address.invalid}";

  // ... same as above
}
```
```java
@Min(value = 1, message = "{number.invalid}")
@Max(value = 10, message = "{number.invalid}")
private int numberBetweenOneAndTen;
``` 

By externalizing our error messages into a separate `.properties` file, we improve the maintainability of our application and can easily update the messages without modifying the codebase.

## Conclusion
In this tutorial, we've gone through all major validation features we might need when building an application with
Spring Boot.  

If you want to get your hands dirty on the example code, have a look at the 
[github repository](https://github.com/thombergs/code-examples/tree/master/spring-boot/validation).

## Update History
* **2024-06-10:** upgraded code snippets to Spring Boot 3
* **2021-08-05:** updated and polished the article a bit. 
* **2018-10-25:** added a word of caution on using bean validation in the persistence layer 
(see [this](https://twitter.com/olivergierke/status/1055015506326052865) thread on Twitter). 
