---
title: "Structuring and Testing Modules and Layers with Spring Boot"
categories: ["Spring Boot"]
modified: 2018-05-27
excerpt: "Slice your Spring Boot applications into vertical modules and make them
          testable in isolation using Spring Boot's testing features."
image:
  auto: 0034-layers
---



Well-behaved software consists of highly cohesive modules that are loosely coupled
to other modules. Each module takes care from user input in the web layer down to
writing into and reading from the database. 

This article presents a way to structure 
a Spring Boot application in vertical modules and discusses a way how
to test the layers within one such module isolated from other modules using
the testing features provided by Spring Boot. 

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-testing" %}

## Code Structure

Before we can test modules and layers, we need to create them. So, let's have a look
at how the code is structured. If you want to view the code while reading, have a look
at the [github repository](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-testing)
with the example code.

![Package Structure](/assets/img/posts/testing-verticals-and-layers-spring-boot/package-structure.jpg)

The application resides in the package `io.reflectoring` and consists of three vertical modules:

* The `booking` module is the main module. It provides functionality to book a flight for
  a certain customer and depends on the other modules.
* The `customer` module is all about managing customer data.
* The `flight` module is all about managing available flights.

Each module has its own sub-package. Within each module we have the following layers:

* The `web` layer contains our Spring Web MVC Controllers, resource classes and any
  configuration necessary to enable web access to the module.
* The `business` layer contains the business logic and workflows that make up
  the functionality of the module.
* The `data` layer contains our JPA entities and Spring Data repositories.

Again, each layer has its own sub-package.   

## `ApplicationContext` Structure

Now that we have a clear-cut package structure, let's look at how we structure the Spring 
`ApplicationContext` in order to represent our modules:

![ApplicationContext Structure](/assets/img/posts/testing-verticals-and-layers-spring-boot/configurations.jpg)

It all starts with a Spring Boot `Application` class:

```java
package io.reflectoring;

@SpringBootApplication
public class Application {
  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}
```

The `@SpringBootApplication` annotation already takes care of loading all our classes
into the `ApplicationContext`. 

However, we want our modules to be separately runnable and testable. So we create a custom configuration class 
annotated with `@Configuration` for each module 
to load only the slice of the application context that this module needs.

The `BookingConfiguration` imports the other two configurations since it depends on 
them. It also enables a `@ComponentScan` for Spring beans within the module package.
It also creates an instance of `BookingService` to be added to the application context:

```java
package io.reflectoring.booking;

@Configuration
@Import({CustomerConfiguration.class, FlightConfiguration.class})
@ComponentScan
public class BookingConfiguration {

  @Bean
  public BookingService bookingService(
          BookingRepository bookingRepository,
          CustomerRepository customerRepository,
          FlightService flightService) {
    return new BookingService(bookingRepository, customerRepository, flightService);
  }

}
```

Aside from `@Import` and `@ComponentScan`, Spring Boot also offers other 
[features for creating and loading modules](/spring-boot-modules/).

The `CustomerConfiguration` looks similar, but it has no dependency to other configurations.
Also, it doesn't provide any custom beans, since all beans are expected to be loaded via
`@ComponentScan`:

```java
package io.reflectoring.customer;

@Configuration
@ComponentScan
public class CustomerConfiguration {}
```

Let's assume that the `Flight` module contains some scheduled tasks, so we enable
Spring Boot's scheduling support: 

```java
package io.reflectoring.flight;

@Configuration
@EnableScheduling
@ComponentScan
public class FlightConfiguration {

  @Bean
  public FlightService flightService(){
    return new FlightService();
  }

}
``` 

Note that we don't add annotations like `@EnableScheduling` at application level
but instead at module level to keep responsibilities sharp and to avoid any side-effects
during testing.

## Testing Modules in Isolation

Now that we have defined some "vertical" modules within our Spring Boot application,
we want to be able to test them in isolation.

If we're doing integration tests in the customer module, we don't want them to fail
because some bean in the booking module has an error. So, how do we load only
the part of the application context that is relevant for a certain module?

We could use Spring's standard `@ContextConfiguration` support to load only
one of our module configurations above, but this way we won't have support for
Spring Boot's test annotations like `@SpringBootTest`, `@WebMvcTest`, and `@DataJpaTest`
which conveniently set up an application context for integration tests.

By default, the test annotations mentioned above create an application
for the first `@SpringBootConfiguration` annotation they find from the current
package upwards, which is usually the main application class, since the
`@SpringBootApplication` annotation includes a `@SpringBootConfiguration`. 

So, to narrow down the application context to a single module, we can create a 
test configuration for each of our modules **within the test sources**: 

```java
package io.reflectoring.booking;

@SpringBootConfiguration
@EnableAutoConfiguration
class BookingTestConfiguration extends BookingConfiguration {}
```

```java
package io.reflectoring.customer;

@SpringBootConfiguration
@EnableAutoConfiguration
class CustomerTestConfiguration extends CustomerConfiguration {}
```

```java
package io.reflectoring.flight;

@SpringBootConfiguration
@EnableAutoConfiguration
class FlightTestConfiguration extends FlightConfiguration {}
```

Each test configuration is annotated with `@SpringBootConfiguration` to make it discoverable
by `@SpringBootTest` and its companions and extends the "real" configuration 
class to inherit its contributions
to the application context. Also, each configuration is additionally annotated with 
`@EnableAutoConfiguration` to enable Spring Boot's auto-configuration magic.

<div class="notice success">
  <h4>Why not use <code>@SpringBootConfiguration</code> in production code?</h4>
  <p>
    We could just add <code>@SpringBootConfiguration</code> and <code>@EnableAutoConfiguration</code>
    to our module configurations in the prodcution code and it would still work.
  </p>
  <p>
    But the <a href="https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/SpringBootConfiguration.html">API docs</a>
    state that we should not use more than one <code>@SpringBootConfiguration</code> 
    in a single application and this one is usually inherited from the <code>@SpringBootApplication</code>
    annotation.  
  </p>
  <p>
    So, as not to make our code incompatible to future Spring Boot versions, 
    we take a slight detour and duplicate the module configurations in the test sources,
    adding the <code>@SpringBootConfiguration</code> annotation where it cannot hurt. 
  </p>
</div> 

If we now create a `@SpringBootTest` in the `customer` package, for instance,
only the customer module is loaded by default.

Let's create some integration tests to prove our test setup.  
  
## Testing a Module's Data Layer with `@DataJpaTest`

Our data layer mainly contains our JPA entities and Spring Data repositories. Our testing
efforts in this layer concentrate on testing the interaction between our repositories 
and the underlying database.

Spring Boot provides the [`@DataJpaTest`](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-testing.html#boot-features-testing-spring-boot-applications-testing-autoconfigured-jpa-test) 
annotation to set up a stripped application context with only the beans needed for JPA, Hibernate and an embedded database.

Let's create a test for the data layer of our `customer` module:

```java
package io.reflectoring.customer.data;

@DataJpaTest
class CustomerModuleDataLayerTests {

  @Autowired
  private CustomerRepository customerRepository;

  @Autowired(required = false)
  private BookingRepository bookingRepository;

  @Test
  void onlyCustomerRepositoryIsLoaded() {
    assertThat(customerRepository).isNotNull();
    assertThat(bookingRepository).isNull();
  }

}
```

`@DataJpaTest` goes up the package structure until it finds a class annotated with `@SpringBootConfiguration`. It
finds our `CustomerTestConfiguration` and then adds all Spring Data repositories within that package and all sub-packages 
to the application context, so that we can just autowire them and run tests against them.

The test shows that only the `CustomerRepository` is loaded. The `BookingRepository` is in another
module and not picked up in the application context. An error in a query within the
`BookingRepository` will no longer cause this test to fail. We have effectively decoupled
our modules in our tests.   

My [article about the `@DataJpaTest` annotation](/spring-boot-data-jpa-test/) goes into
deeper detail about which queries to test, and how to set up and populate a database schema
for tests. 

## Testing a Module's Web Layer with `@WebMvcTest`

Similar to `@DataJpaTest`, [`@WebMvcTest`](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-testing.html#boot-features-testing-spring-boot-applications-testing-autoconfigured-mvc-tests) 
sets up an application context with everything we need for testing
a Spring MVC controller:

```java
package io.reflectoring.customer.web;

@WebMvcTest
class CustomerModuleWebLayerTests {

  @Autowired
  private CustomerController customerController;

  @Autowired(required = false)
  private BookingController bookingController;

  @Test
  void onlyCustomerControllerIsLoaded() {
    assertThat(customerController).isNotNull();
    assertThat(bookingController).isNull();
  }

}
```

Similar to `@DataJpaTest`, `@WebMvcTest` goes up the package structure to the first `@SpringBootConfiguration` 
it finds and uses it as the root for the application context. 

It again finds our `CustomerTestConfiguration` 
and adds all web-related beans from the `customer` module. Web controllers from other
modules are not loaded.

If you want to read up on details about what to test in a web layer and how to test it,
have a look at my article about [testing Spring MVC web controllers](/spring-boot-web-controller-test/).

## Testing a whole Module using `@SpringBootTest`

Instead of only creating an application context for a certain layer of one of our modules,
we can create an application context for a whole module with `@SpringBootTest`:

```java
package io.reflectoring.customer;

@SpringBootTest
class CustomerModuleTest {

  @Autowired(required = false)
  private BookingController bookingController;
  @Autowired(required = false)
  private BookingService bookingService;
  @Autowired(required = false)
  private BookingRepository bookingRepository;

  @Autowired
  private CustomerController customerController;
  @Autowired
  private CustomerService customerService;
  @Autowired
  private CustomerRepository customerRepository;

  @Test
  void onlyCustomerModuleIsLoaded() {
    assertThat(customerController).isNotNull();
    assertThat(customerService).isNotNull();
    assertThat(customerRepository).isNotNull();
    assertThat(bookingController).isNull();
    assertThat(bookingService).isNull();
    assertThat(bookingRepository).isNull();
  }

}
```

Again, only the beans of our `customer` module are loaded, this time spanning from the
web layer all the way to the data layer. We can now happily autowire any beans from
the `customer` module and create integration tests between them.

We can use `@MockBean` to mock beans from other modules that might be needed.

If you want to find out more about integration tests with Spring Boot,
read [my article about the `@SpringBootTest` annotation](/spring-boot-test/).

## Testing ApplicationContext Startup 

Even though we have now successfully modularized our Spring Boot application and our
tests, we want to know if the application context still works as a whole. 

So, a must-have test for each Spring Boot application is wiring up the whole `ApplicationContext`, 
spanning all modules, to check if all dependencies between the beans are satisfied.

This test actually is already included in the default sources if you create your Spring Boot
application via [Spring Initializr](http://start.spring.io/):

```java
package io.reflectoring;

@ExtendWith(SpringExtension.class)
@SpringBootTest
class ApplicationTests {

  @Test
  void applicationContextLoads() {
  }

}
``` 

As long as this test is in the base package of our application, it will not find any
of our module configurations and instead load the application context for the 
main application class annotated with `@SpringBootApplication`.

If the application context cannot be started due to any configuration error or conflict 
between our modules, the test will fail.

## Conclusion

Using `@Configuration` classes in the production sources paired with 
`@SpringBootConfiguration` classes in the test sources, we can create modules within
a Spring Boot application that are testable in isolation.

You can find the source code for this article [on github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-testing).

## Update History
* **03-01-2019:** Refactored the article in order to make it compatible with Spring Boot API docs
 stating that we should have only one `@SpringBootConfiguration` per application. Also removed
 testing basics and instead linked to other articles.
 
