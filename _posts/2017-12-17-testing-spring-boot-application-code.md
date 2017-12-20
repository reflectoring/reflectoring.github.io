---
title: "The Spring Boot Test Pyramid"
categories: [spring-boot]
modified: 2017-12-10
author: tom
tags: [spring, boot, testing, junit]
comments: true
ads: false
header:
  teaser: /assets/images/posts/consumer-driven-contracts-with-angular-and-pact/contract.jpg
  image: /assets/images/posts/consumer-driven-contracts-with-angular-and-pact/contract.jpg
---

It's common sense these days that you should cover as much as possible of your code with
unit tests. When developing an application with Spring Boot, you have access to some
very nice testing features provided by the framework. This article goes into the features you will need most commonly
and explain when to use them and when you should not.

# The Test Pyramid

In an article on testing, you don't get around the [test pyramid](https://martinfowler.com/bliki/TestPyramid.html).
The pyramid is split into multiple
layers, growing from wide at the bottom to very narrow at the top. Each layer represents a kind of test you can run
to test your software application. 

The bottom layer - which is the basis of the pyramid and supports all layers above - usually contains unit tests.
Going upwards, you usually come along integration tests and end up with end-to-end tests at the top.

TODO: image of a plain test pyramid!

The rationale behind the test pyramid is that the higher you get to the top the more brittle, time-consuming and thus
expensive those tests become. Thus, you should do a lot of the tests at the bottom (unit tests) and very little
of the tests at the top (end-to-end tests).

In this article I am going to visit each of the main testing features of Spring Boot and arrange them in a
test pyramid to illustrate the proportions in which they should be used in a healthy Spring Boot application
code base.
 
# Isolated Tests

The first level of tests contains the usual suspects - plain old unit tests.
These actually have nothing to do with Spring Boot or any other application framework.
You can - and should - implement them without dependencies to any such framework
to make them really isolated.

A unit test should mock away all dependencies we don't want to test. In the example
below, we want to test the behavior of `BookingService`. In order to satisy `BookingService`s
dependency to `BookingRepository`, we create a mock with [Mockito](http://site.mockito.org/)
and mock out its behavior. 

```java
public BookingServiceTest {
  
  private BookingService bookingService;
  
  @BeforeAll
  public static void setup(){
    BookingRepository repository = Mockito.mock(BookingRepository.class);
    this.bookingService = new BookingService(repository);
  }
  
  @Test
  public void bookingFailsWhenAboveThreshold(){
    Mockito.when(bookingRepository.book(any(Booking.class))).thenReturn(true);
    Booking booking = new Booking(99999L);
    assertThat(this.bookingService.book(booking)).isFalse();
  }
  
}
```

You really should attempt to cover as many of your classes as possible with these simple
unit tests as they are really fast and very easy to understand and debug (provided you
designed your classes with testing in mind). If you take anything away from this article
this should be it.

No Spring Boot features here, yet. Disappointed? You should note that **all** of the Spring Boot testing
features - as helpful as they are - are features supporting **integration tests** and not unit tests
in the sense above. Thus, you should use them as little as possible :).

# Testing a Slice of the ApplicationContext with `@Import`
Next up, we take a look at the `@Import` annotation of Spring. This also is not a Spring Boot feature but comes
directly from the Spring framework.

The `@Import` annotation is used with the Java-based configuration mechanism of Spring. Let's say we create
a `@Configuration` that provides our `BookingService` from above:

```java
@Configuration
public class BookingConfiguration {
  
  @Bean
  public BookingRepository bookingRepository(){
    return new BookingRepository();
  }
  
  @Bean
  public BookingService bookingService(){
    return new BookingService(bookingRepository());
  }
}
```

We can then use `BookingConfiguration` to create the same test as in the plain old unit test example above:

```java
@ExtendWith(SpringExtension.class)
@Import(BookingConfiguration.class)
public class BookingServiceTest {
  
   @Test
    public void bookingFailsWhenAboveThreshold(@Mock){
      Mockito.when(bookingRepository.book(any(Booking.class))).thenReturn(true);
      Booking booking = new Booking(99999L);
      assertThat(this.bookingService.book(booking)).isFalse();
    }
  
}
```


@RunWith(SpringRunner.class)
@Import(...)


# Testing Spring Data Repositories with `@DataJpaTest`
* shared over next tests?

# Testing Spring MVC Controllers with `@WebMvcTest`
* shared over next tests?

# Testing the Real ApplicationContext with `@SpringBootTest`
* shared over next tests, unless @DirtiesContext

# Mocking Single Beans with `@MockBean`

# A Note on Startup Time
* data from a real project with x total beans, y of which are controllers and z of which are Repositories
* startup time with @Import, @SpringBootTest, @DataJpaTest, @WebMvcTest
