---
authors: [akinwalehabib]
title: Unit tests for software architecture using ArchUnit
categories: [Java, Spring]
date: 2024-06-12 13:34:00 +0100
image: images/stock/0118-module-1200x628-branded.jpg
url: unit-test-for-software-architecture-using-archunit
---

A well-defined software architecture is the backbone of a maintainable and scalable application. It lays out the overall structure, components, and interactions that guide development.  Unfortunately, a poorly designed architecture can lead to a tangled mess of code, creating a nightmare for maintenance and future enhancements.

Here's where automated architecture testing with ArchUnit comes in.  By continuously scanning our codebase, we can identify violations of architectural principles as soon as they occur, reducing the risk of regressions and ensuring consistency with established coding practices.  This not only minimizes technical debt (accumulated poorly designed code) but also helps onboard new developers by providing clear documentation through tests, allowing them to understand the architectural principles and how their code fits within the overall structure.

This article dives into ArchUnit, a powerful tool that lets us write automated unit tests for our software architecture.

## What is ArchUnit

ArchUnit is a free, simple and extensible library for checking the architecture of your Java code using any plain Java unit test framework. 

ArchUnit has different layers: the Core layer, the Lang layer, and the Library layer.

Much of the Core layer extends and closely resembles the Java reflection API. The Core layer offers a lot of information about the static structure of a Java program. For example, to import all Java classes in the com.akinwalehabib.archunitdemo package, we can use the ClassFileImporter from the Core layer:

```java
JavaClasses classes = new ClassFileImporter()
  .importPackages("com.akinwalehabib.archunitdemo");
```

ArchUnit also has the Lang API, which provides a powerful syntax to express rules abstractly. Most parts of the Lang API are fluent APIs that are very expressive. You use the Lang API to create test rules. You can think of these rules as assertions in any unit test framework.

```java
ArchRule rule = classes()
  .that()
  .resideInAPackage("..service..")
  .should()
  .onlyBeAccessed()
  .byAnyPackage("..controller..", "..service..");
```

In this code above, the rule states that all classes in the `service` package should only be accessible by classes in controller and the service package.

Once we have imported the desired classes we wish to test and created our architecture rule using the Lang API, we check the rule against our imported classes:

```java
ArchRule rule = rule.check(importedClasses);
```

The Library API offers predefined complex rules for typical architectural goals. For example, we can use the Library API to check that a project adheres to a software architecture design such as the Onion architecture.

In summary, we use the Objects from the Core API to import Java bytecode into Java Objects, then use Objects from the Lang API to specify our architecture rules. The Library API contains more complex predefined rules.

## What to check

What should we check in architectural tests in the first place? The typical checks we can do with ArchUnit are class dependencies and package dependency checks to enforce dependency rules in a class or between classes in different packages. Package dependency check is commonly used in Spring Modulith applications to check that classes do not depend on a class in another bounded context.

## Getting started with ArchUnit

Let us create a Spring Boot application. Although the example in this article is a bit contrived, it can help us understand how to use ArchUnit in a typical web application with different layers.

Create a new Spring project using start.spring.io or any other way you prefer. We will add a few starter dependencies to our project: Spring Web and Spring Data Mongo.

In this project, we will add a REST API controller, a service class and a Spring Data MongoDB repository. These are all different layers in our architecture. We will then write automated tests to check that our service class depends on the repository class. We will also write tests to check that the controller class depends on the service class and does not use the repository class.

{{% image alt="Spring starter" src="images/posts/unit-tests-for-software-architecture-with-archunit/spring-starter.png" %}}

Spring Boot applications created using the starter at start.spring.io contains Spring Boot Starter Test dependency, which includes testing infrastructure such as JUnit5, Mockito, and assertJ.

Let us add our application configuration to the application.yml file:

```YAML
spring:
  application:
    name: archunitdemo
  data:
    mongodb:
      uri: mongodb://localhost/archunit
```

We provide the uri for our MongoDB database in the configuration above.

Let us create a controller class and API endpoints for creating a user and another for getting the user using the email address:

```java
@RestController
@RequestMapping(path = "/user", produces = MediaType.APPLICATION_JSON_VALUE)
public class UserController {
  private Logger logger = LoggerFactory.getLogger(UserController.class);
  private UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  @PostMapping()
  @ResponseStatus(HttpStatus.CREATED)
  public void createUser(@RequestBody CreateUserDTO createUserDTO) {
      logger.info(
        "createUser using name{}, and email {}",
        createUserDTO.name(),
        createUserDTO.email());

      User user = new User(
        createUserDTO.name(),
        createUserDTO.email(),
        createUserDTO.password());

      userService.createUser(user);
  } 
  
  @GetMapping
  public ResponseEntity<User> getUser(@RequestParam String email) {
      logger.info("getUser using email: {}", email);

      Optional<User> user = userService.getUser(email);
      if (!user.isPresent()) {
        return ResponseEntity.notFound()
            .build();
      }

      return ResponseEntity.ok()
          .contentType(MediaType.APPLICATION_JSON)
          .body(user.get());
  }
}
```

We have two endpoints in the REST controller class. One endpoint accepts a GET request with email request parameter. The other endpoint accepts a POST request with user json in the request body.

Here is the create user data transfer object, which the createUser controller function accepts as a parameter:

```java
public record CreateUserDTO(
  String name,
  String email,
  String password
) {}
```

Next, we need to create a User domain model. This model keeps track of user details such as name, email, and password. The User class will have a no-args constructor and another constructor that accepts name, email and password. Lastly, this class will also contain getter and setter methods for the instance variables:

```java
@Document(collection = "users")
public class User {

  @Id
  private String id;

  private String name;

  private String email;

  private String password;

  public User(){}

  public User(String name, String email, String password) {
    this.name = name;
    this.email = email;
    this.password = password;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }
  
}
```

Next, let’s create a service class named userService which will handle the logic for our endpoints and also communicate with the data layer via userRepository interface.

```java
@Service
public class UserService {

  private UserRepository userRepository;

  public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public void createUser(User user) {
    userRepository.save(user);
  }

  public Optional<User> getUser(String email) {
    return userRepository.getByEmail(email);
  }
  
}
```
The UserService provides two methods. createUser function creates a new user using the User parameter. The getUser accepts an email parameter and returns an optional object of user type.

```java
@Repository
public interface UserRepository extends MongoRepository<User, String> {
  public Optional<User> getByEmail(String id);
}
```

The UserRepository extends the MontoRepository provided by Spring Data MongoDB.

We now have an application with 2 API endpoints. We can run this application and manually test it using Httpie. To create a user, we will send a POST request to /user path.

{{% image alt="Spring starter" src="images/posts/unit-tests-for-software-architecture-with-archunit/http-post-request.png" %}}

We will send a GET request to /user path to get a user using the email.

{{% image alt="Spring starter" src="images/posts/unit-tests-for-software-architecture-with-archunit/http-get-request.png" %}}

Our Spring Boot application contains different layers, like the persistence/data layer, which we use Spring Data MongoDB to connect to the database. The UserRepository interface extends the MongoRepository interface provided by Spring Data MongoDB, which communicates with the database and performs the CRUD operations.

The UserService class handles the business logic related to the domain we are building the software for. The UserService belongs to the business layer.

Lastly, the UserController class belongs to the presentation layer of our application architecture.

It is a best practice that the presentation layer depends on the business layer, which in turn depends on the data layer. Now, let us enforce this principle in our architectural test using ArchUnit. We will also enforce a naming principle.

Before writing our tests, we must add the archunit-junit5  dependency to the gradle or maven build file:

```groovy
testImplementation 'com.tngtech.archunit:archunit-junit5:1.3.0'
```

```XML
<dependency>
    <groupId>com.tngtech.archunit</groupId>
    <artifactId>archunit-junit5</artifactId>
    <version>1.3.0</version>
    <scope>test</scope>
</dependency>
```

Here is our default test class for our Spring Boot application. We will add our tests to this class:

```java
@SpringBootTest
class ArchunitdemoApplicationTests {

	@Test
	void contextLoads() {}

}
```

## Enforce Naming Convention
Let us add our first test, which involves enforcing a naming convention for our repository interfaces. We want every repository interface name to contain the word Repository.

We will import the classes we want to test using the ClassFileImporter. The ClassFileImporter.importPackages accepts a string, which is the location as a fully qualified package name.

Next, we will create a test rule using classes from the ArchRuleDefinition package. We will import classes as a static class like this:

```java
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
```

Lastly, we will check the rule against our imported classes.

```java
@Test
void repository_interfaces_name_should_contain_Repository() {
	// Import classes
	JavaClasses importedClasses = new ClassFileImporter()
    .importPackages("com.akinwalehabib.archunitdemo");

	// Create architectural rule
	ArchRule myRule = classes()
		.that()
		.areAnnotatedWith(org.springframework.stereotype.Repository.class)
		.should()
		.haveSimpleNameContaining("Repository");

	// Test rule against imported classes
	myRule.check(importedClasses);
}
```
We import our classes from the desired package. We then create a rule to ensure that any class annotated with @Repository must contain Repository in its class name. Lastly we check our rule against our imported classes.

## Test to check repositories are only accessed by services.

Let us add another test case that ensures only service classes, which belong in the business layer, can depend on our data layer, in which the repository interfaces belong:

```java
@Test
	void only_services_are_allowed_to_depend_on_repository_classes() {
		// Import classes
		JavaClasses importedClasses = new ClassFileImporter()
      .importPackages("com.akinwalehabib.archunitdemo");

		// Create architectural rule
		ArchRule myRule = classes()
			.that()
			.areAnnotatedWith(org.springframework.stereotype.Repository.class)
			.should()
			.onlyHaveDependentClassesThat()
            .areAnnotatedWith(org.springframework.stereotype.Service.class);

		// Test rule against imported classes
		myRule.check(importedClasses);
	}
```

```bash
./gradlew test
```

Let us run our tests using the Gradle test command. All tests should pass. If we remove the Repository value from the `UserRepository.java` file name and run our tests, the tests will fail.

## Test to check services are only accessed by controllers.
Next, let us add a test case that ensures only classes that belong in the presentation layer, such as our controller class, can depend on our service classes that belong in the business layer:

```java
@Test
	void only_controllers_are_allowed_to_depend_on_service_classes() {
		// Import classes
		JavaClasses importedClasses = new ClassFileImporter()
      .importPackages("com.akinwalehabib.archunitdemo");

		// Create architectural rule
		ArchRule myRule = classes()
			.that()
			.areAnnotatedWith(org.springframework.stereotype.Service.class)
			.should()
			.onlyHaveDependentClassesThat()
            .areAnnotatedWith(org.springframework.web.bind.annotation.RestController.class);

		// Test rule against imported classes
		myRule.check(importedClasses);
	}
```

## Summary
ArchUnit is very powerful, and we have only used it to test architectural layers and enforce a naming convention.

We learned how to set up ArchUnit in a Spring boot application. We also learned how to use the basic constructs of ArchUnit to import classes, create a rule and check the rule against the applicable Java classes. We then learned how to test different layers of the application architecture. 

You can find more information about ArchUnit on the documentation website at https://www.archunit.org/userguide/html/000_Index.html.

I believe there is value in using ArchUnit to enforce architectural principles and conventions in large codebases with several team members.