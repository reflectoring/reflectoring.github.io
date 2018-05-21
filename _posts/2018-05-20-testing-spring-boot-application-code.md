---
title: "Testing Verticals and Layers in Spring Boot"
categories: [spring-boot]
modified: 2018-05-20
author: tom
tags: [spring, boot, testing, junit]
comments: true
ads: false
header:
  teaser: /assets/images/posts/consumer-driven-contracts-with-angular-and-pact/contract.jpg
  image: /assets/images/posts/consumer-driven-contracts-with-angular-and-pact/contract.jpg
---

It's common sense these days that you should cover your code with automated
unit and integration tests. When developing an application with Spring Boot, you have access to some
very nice testing features. This article goes into the features you will need most commonly
and explain when to use them and when you should not.

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-testing" %}

# Code Structure

# Testing single Beans with Plain Old Unit Tests

The first level of tests contains the usual suspects - plain old unit tests.
These actually have nothing to do with Spring Boot or any other application framework.
You can - and should - implement them without dependencies to any such framework
to make them really isolated.

A unit test should mock away all dependencies we don't want to test. In the example
below, we want to test the behavior of `BookingService`. In order to satisfy `BookingService`s
dependency to `BookingRepository`, we create a mock with [Mockito](http://site.mockito.org/)
and mock out its behavior. 

```java
class BookingServiceTest {

  private BookingRepository bookingRepositoryMock = Mockito.mock(BookingRepository.class);

  private BookingService bookingService = new BookingService(bookingRepositoryMock);

  @Test
  void whenBook_thenSaveAndReturnBooking() {
    final Long customerId = 42L;
    final Long productId = 4711L;
    final Booking expectedBooking = Booking.builder()
            .id(1L)
            .customerId(customerId)
            .productId(productId)
            .build();

    when(bookingRepositoryMock.save(refEq(expectedBooking, "id"))).thenReturn(expectedBooking);
    Booking booking = bookingService.book(customerId, productId);

    verify(bookingRepositoryMock, times(1)).save(refEq(expectedBooking, "id"));
    assertThat(booking).isEqualToComparingFieldByField(expectedBooking);
  }

}
```

We really should attempt to cover as many of your classes as possible with these simple
unit tests as they are really fast and very easy to understand and debug (provided we
designed our classes with testing in mind). 

No Spring Boot features here, yet. Note that **all** of the Spring Boot testing
features - as helpful as they are - are features supporting **integration tests** and not unit tests
in the sense above. Thus, we should use them as little as possible.

# Testing the Data Layer with `@DataJpaTest`
* shared over next tests?

# Testing the Web Layer with `@WebMvcTest`
* shared over next tests?

# Testing a Vertical with `@SpringBootTest`

# Testing the Application with `@SpringBootTest`
* shared over next tests, unless @DirtiesContext


 

# Testing a Slice of the ApplicationContext with `@Import`

Next, let's take a look at Springs `@Import` annotation. 

The `@Import` annotation is used with the Java-based configuration mechanism of Spring. Let's say we create
a `@Configuration` that provides our `BookingService` from above:

```java
@Configuration
public class BookingConfiguration {

  @Bean
  public BookingService bookingService(BookingRepository bookingRepository) {
    return new BookingService(bookingRepository);
  }

}
```

We can then use `BookingConfiguration` to create the same test as in the plain old unit test example above:

```java
@ExtendWith(SpringExtension.class)
@Import(BookingConfiguration.class)
class BookingServiceWithConfigurationTest {

  @MockBean
  private BookingRepository bookingRepositoryMock;

  @Autowired
  private BookingService bookingService;

  @Test
  void whenBook_thenSaveAndReturnBooking() {
    final Long customerId = 42L;
    final Long productId = 4711L;
    final Booking expectedBooking = Booking.builder()
            .id(1L)
            .customerId(customerId)
            .productId(productId)
            .build();

    when(bookingRepositoryMock.save(refEq(expectedBooking, "id"))).thenReturn(expectedBooking);
    Booking booking = bookingService.book(customerId, productId);

    verify(bookingRepositoryMock, times(1)).save(refEq(expectedBooking, "id"));
    assertThat(booking).isEqualToComparingFieldByField(expectedBooking);
  }

}
```

As `BookingConfiguration` only defines a `BookingService` bean and not a `BookingRepository`, we
need to tell Spring to inject a mocked `BookingRepository` using the `@MockBean` annotation.

This is more than a simple unit test. We're testing the functionality of `BookingService` as well
as the wiring `BookingConfiguration` does for us. So why would we create a test like this rather
than a plain old unit test?

If the creation of a `BookingService` object (i.e. the logic within the `bookingService()`
factory method) is very complex, we don't want to repeat this in every unit test, so we just let it
be created by Spring. 

Note, however, that the more beans are contained within the `@Import`ed configuration, the more
overhead we are creating in every test!  

# Testing the Data Layer with `@DataJpaTest`
* shared over next tests?

# Testing the Web Layer with `@WebMvcTest`
* shared over next tests?

# Testing the whole Application with `@SpringBootTest`
* shared over next tests, unless @DirtiesContext

# A Note on Startup Time
* data from a real project with x total beans, y of which are controllers and z of which are Repositories
* startup time with @Import, @SpringBootTest, @DataJpaTest, @WebMvcTest
