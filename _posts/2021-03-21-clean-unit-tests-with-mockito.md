---
title: "Clean Unit Tests with Mockito"
categories: [java]
date: 2021-03-20 00:00:00 +0100 
modified: 2021-03-20 00:00:00 +0100 
author: lleuenberger 
excerpt: "Intro to writing clean unit tests with Mockito."
image:
  auto: 0098-profile
---

In this article we will learn how to mock objects with Mockito. We'll first talk about what test doubles
are and then how we can use them so that we create meaningful and tailored unit tests. We will also have a look at the
most important Dos and Dont's so that we are able to write our own clean unit tests with Mockito.

{% include github-project.html url="https://github.com/silenum/mockito-examples" %}

## Introduction to Mocks

The basic concept of mocking is replacing real objects with doubles. We can control how these doubles behave. These doubles we call "Test doubles". We'll cover the different kinds of test doubles later in this article.

Let's imagine we have a service that processes orders from a database. It's very unhandy to set up a whole database
just to test that service. To avoid setting up a database for the test, we create a *mock* that pretends to be the database, but in the eyes of the
service it looks like a real database. We can advise the mock exactly how it shall behave. Having this tool, we
are able to test the service but don't actually need a database.

Here [Mockito](https://www.mockito.org) comes into play. Mockito is a very popular library that allows us to create such mock objects.

Consider reading the section [Why Mock?](https://reflectoring.io/spring-boot-mock/#why-mock) for additional information
about mocking.

## Different Types of Test Doubles

In the world of code, there are many different words for test doubles and definitions for their duty. I recommend to
define a common language within the team.

Here is a little summary of the different types for test doubles and how we use them in this article:

| Type  | Description                          |
| ----- | ------------------------------------------------------------ |
| Stub  | A stub is an object that always returns the same value, regardless of which parameters you provide on a stub's methods. |
| Mock  | A mock is an object whose behaviour is declared before the test is run. (This is exactly what Mockito is made for!) |
| Spy   | A spy is an object that logs each method call that is performed on it (including argument values). It can be queried to create assertions in order to verify the behaviour of the system under test. (Spies are supported by Mockito!) |

## Mockito in Use

Consider following example:

![Simple UML Diagram](../assets/img/posts/clean-unit-tests-with-mockito/city-uml-diagram.png)

Let's quickly recapitulate this UML diagram. If you're familiar with UML and understood the diagram, hop to the next
paragraph. 

The green arrow with the continuous line and filled triangle stands for inheritance. With other words,
the `CityService` *inherits* from `BaseService` or `CityService` *is a* `BaseService`. 

The green arrow with the dotted
line and filled triangle stands for *implements*. `CityServiceImpl` is the implementation of `CityService` and
therefore *an instance of* `CityService`. The white arrows with the diamond says, that `CityRepository` *is part of*
`CityService`. It is also known as *composition*. The remaining white arrow with the dotted line stands for a reference.

**Unfortunately, we can't consider all those components as bug-free and working as expected**. If we include all those
components in our test, we include even more complexity so that there are numerous reasons that our test is going to
fail.

Here Mockito comes to the rescue! Mockito allows us to create suitable test doubles instead of creating the whole long
tail of objects for the real implementation.

**In summary, what we want is a simple, fast and reliable unit test instead of a potentially complex, slow and flaky
one!**

Let's see an example:

```java
class CityServiceImplTest {

  // System under Test (SuT)
  private CityService cityService;

  // Mocks
  private CityRepository cityRepository;

  @BeforeEach
  void setUp() {
    cityRepository = Mockito.mock(CityRepository.class);
    cityService = new CityServiceImpl(cityRepository);
  }

  // Test cases omitted for brevity.

}
```

The test case consists of the system under test `CityService` and its dependencies. In this case, this
is `CityRepository`. We need those references in oder to test the expected behaviour and reset the test double to not
interfere with other test cases (more about that later).

Within the setup section, we create a test double with `Mockito.mock(<T> classToMock)`. Then, we
inject this test double into the `CityService` so that its dependencies are satisfied. Now we are ready to create the test
cases:

```java
class CityServiceImplTest {

  // System under Test (SuT)
  private CityService cityService;

  // Mocks
  private CityRepository cityRepository;

  @BeforeEach
  void setUp() {
    cityRepository = Mockito.mock(CityRepository.class);
    cityService = new CityServiceImpl(cityRepository);
  }

  @Test
  void find() throws ElementNotFoundException {
    City expected = createCity();
    Mockito.when(cityRepository.find(expected.getId()))
        .thenReturn(Optional.of(expected));
    City actual = cityService.find(expected.getId());
    ReflectionAssert.assertReflectionEquals(expected, actual);
  }

  @Test
  void delete() throws ElementNotFoundException {
    City expected = createCity();
    cityService.delete(expected);
    Mockito.verify(cityRepository).delete(expected);
  }

}
```

Here we have two example test cases. 

The first one is about finding a city via the `CityService`. Therefore, we create
an instance of `City`. This city is the object which we expected to be returned from the `CityService`. Now
we have to advise the repository to return that value, if and only if the declared ID has been provided.

Since `cityRepository` is a Mockito mock, we can declare its behaviour with `Mockito.when()`. Now we can call the `save()` method on the
service, which will return an instance of city. Having those two objects, we can create a corresponding assertion.

In case a method has no return value (like `cityService.delete()` in the code example), we cannot create an assertion on the return value. Here Mockito's spy features comes into play.

We can query the test double and ask if a method was called with the expected parameter. This is what `Mockito.verify()`
does. 

These two features - mocking return values and verifying method calls on test doubles - are widely used and give us a huge possibility to create various simple test cases. Also,
the shown examples can be used for test driven development and regression tests. Mockito fits both needs!

## How to Create Mocks with Mockito

Until now, we have seen how to create fast and simple test cases. Now let's look at the different ways of creating mocks for our needs.
Before we'll continue, we must understand what kind of test double Mockito creates. 

Mockito creates test doubles of the type
*mock*, but they have some features of a *spy*. These extra features allow us to verify if a certain method was called after we executed
our test case.

### Creating Mocks with Plain Mockito

In case we don't want to use any framework nor annotations, we can create the mocks we need as follows:

```java
ClassToMock mock = Mockito.mock(ClassToMock.class);
```

That's all we need to create a mock with Mockito!

### Initializing Mocks with Mockito Annotations

If the system under test has several dependencies that must be mocked, it gets cumbersome to create all these mocks with
the variant shown above. 

To initialize them all at once, we can annotate them with `@Mock`:

```java
class CityServiceImplTestMockitoAnnotationStyle {

  // System under Test (SuT)
  private CityService cityService;

  // Mocks
  @Mock
  private CityRepository cityRepository;

  @BeforeEach
  void setUp() {
    MockitoAnnotations.openMocks(this);
    cityService = new CityServiceImpl(cityRepository);
  }

}
```

Applying this variant, we don't have to deal with boilerplate code and are able to keep our unit test neat and concise.
`MockitoAnnotations.openMocks(this)` initializes the fields annotated with `@Mock` for the given test class, which is in
our case the class itself.

### Using JUnit Jupiter's MockitoExtension

As an alternative to the Mockito annotation style we can make use of JUnit Jupiter's `@ExtendWith` and extend JUnit
Jupiter's context with `MockitoExtension.class`:

```java
@ExtendWith(MockitoExtension.class)
class CityServiceImplTestMockitoJUnitExtensionStyle {

  // System under Test (SuT)
  private CityService cityService;

  // Mocks
  @Mock
  private CityRepository cityRepository;

  @BeforeEach
  void setUp() {
    cityService = new CityServiceImpl(cityRepository);
  }

}
```
The extension assumes the initialization for annotated fields, so we must not do it ourselves. This makes our setup
even neater and conciser!

### Injecting Mocks with Spring

If we have a more complex test fixture, and we want to inject the mock into Spring's `ApplicationContext` we can make
use of `@MockBean`:

```java
@ExtendWith(SpringExtension.class)
class CityServiceImplTestMockitoSpringStyle {

  // System under Test (SuT)
  private CityService cityService;

  // Mocks
  @MockBean
  private CityRepository cityRepository;

  @BeforeEach
  void setUp() {
    cityService = new CityServiceImpl(cityRepository);
  }

}
```

But caution: `@MockBean` is not an annotation from Mockito but from Spring!
In the startup process Spring places the mock in the context, so that we don't need to do it ourselves.
Wherever a bean claims to have its dependency satisfied, Spring injects the mock instead of the real object.
This become handy if we want to have the same mock in different places.

See [Mocking with Mockito and Spring Boot](https://reflectoring.io/spring-boot-mock/#mocking-with-mockito-and-spring-boot)
for a deep dive how to mock Beans in Spring Boot.

## Mockito Best Practices

Knowing how to create the mocks, let's have a look at some best practices to keep our tests clean and maintainable. It will save us much time debugging and doesn't let our team members guess
what the intent of the test case is.

### Avoid Concatenation in `setUp()`

Even though the test cases are reduced to a minimum, the readability suffers a lot. Besides, we must highly pay 
attention to not break any other test cases. Like so, we avoid interfering other tests by overriding the setup.

Avoid `setUp()` methods like this:

```java
  @BeforeEach
  void setUp() {
    expected = createCity();
    cityRepository = Mockito.mock(CityRepository.class);
    cityService = new CityServiceImpl(cityRepository);

    // Avoid such complex declarations
    Mockito.when(cityRepository.save(expected))
        .thenReturn(Optional.of(expected));
    Mockito.when(cityRepository.find(expected.getId()))
        .thenReturn(Optional.of(expected));
    Mockito.when(cityRepository.findByName(expected.getName()))
        .thenReturn(Optional.of(expected));
    Mockito.when(cityRepository.findAllByCanton(expected.getCanton()))
        .thenReturn(Collections.singleton(expected));
    Mockito.when(cityRepository.findAllByCountry(expected.getCanton().getCountry()))
        .thenReturn(Collections.singleton(expected));
  }
```

To get simple test cases like this:

```java
  @Test
  void save() throws ElementNotFoundException {
    ReflectionAssert.assertReflectionEquals(expected, cityService.save(expected));
  }

  @Test
  void find() throws ElementNotFoundException {
    ReflectionAssert.assertReflectionEquals(expected, cityService.find(expected.getId()));
  }

  @Test
  void delete() throws ElementNotFoundException {
    cityService.delete(expected);
    Mockito.verify(cityRepository).delete(expected);
  }

  @Test
  void findByName() throws ElementNotFoundException {
    ReflectionAssert.assertReflectionEquals(expected, cityService.findByName(expected.getName()));
  }
```

### Don't Recycle Mocks

Having a complex scenario might tempt us to recycle our mocks. However, this will lead us sooner or later to unexpected
behaviour of our mocks. Each scenario shall be well reflected and set up and in case we need the same setup twice,
initialize it by calling a method.  It's better to create new mocks for each test case. Otherwise, we might experience 
unexpected behavior through interfering declarations.

```java
  void initializeScenario() {
    // Mockito behaviour declarations
  }

  @BeforeEach
  void setUp() {
    MockitoAnnotations.openMocks(this);
    cityService = new CityServiceImpl(cityRepository);
  }

  @Test
  void testOne() {
    initializeScenario();
    // Test Case One
  }
  
  @Test
  void testTwo() {
    initializeScenario();
    // Test Case Two
  }
```

### Write Test Cases Independently

Don't expect test cases to be always executed in the same order! Write everything that belongs to our test case into
the test method, so that a test case can be executed alone in our IDE or all together within our CI!

This mistake often comes together with recycled mocks. At least now our alarm bell should ring, and it's time to
reconsider our test case! Especially, if we need to call `reset()` in a test procedure, which is considered as code
smell by Mockito.

### Don't Mock Collections or Value Objects

Mockito is a framework to mock objects with behaviour that can be declared at the beginning of our test.
It is common to have *Data Transfer Objects* (or DTOs). The intent of such a DTO is, as its name says, to 
transport data from a source to a destination. In order to retrieve this data from the object, we could declare
the behaviour of each getter. Albeit this is possible, we should better use real values and set them to the DTO.
The same rule applies for collections too, since they are container for values as well.

### Testing Error Handling with Mockito

```java
Mockito.when(cityRepository.find(expected.getId())).thenThrow(RuntimeException.class);
```

Mockito comes with a built-in mechanism to test our error handling. Instead of declaring a return value, advise Mockito
to throw the expected exception. In case we throw checked exceptions, the compiler doesn't let we to throw checked
exceptions, that are not declared on the method.

### Mocking `void` Methods

```java
// Causes a compiler error
Mockito.when(cityRepository.delete()).thenThrow(RuntimeException.class);
```

In case we want to declare a special behaviour for `void` methods, we must change our approach. The compiler doesn't
like void methods in brackets, since they have no arguments. Change our approach to following:

```java
Mockito.doThrow(RuntimeException.class).when(cityRepository).delete(expected);
```

### Verify Method Calls

```java
Mockito.verify(cityRepository,Mockito.times(1)).delete(expected);
```

We can verify how many times a mock was called by simply use the built-in `verify` method. If the condition is not met,
our test case will fail. This is extremely handy for algorithms or similar processes. There are other predefined
verification modes such as `atLeastOnce` or `never` already present and ready to use!

## Mockito FAQ

In this section we want to point out important things which are nice to know.

* *What types can I mock?* Mockito allows us to mock not only interfaces but also concrete classes.
* *What is returned if I don't declare a mock's behaviour?* Mockito returns `null` for reference objects, and the
  default values for primitive data types (for example `0` for `int` and `false` for `boolean`)
* *How many times does Mockito return a previously declared value?* Mockito returns always the same value, regardless of how
  many times a method is called.
* *Can I mock `final` classes?* No, final classes **can't** be mocked and neither final methods are mockable. This has
  to do with the internal mechanism of how Mocktio creates the mock and the Java Language Specification. If we want to
  do so, we use [PowerMock](https://github.com/powermock/powermock).
* *Can I mock a constructor?* Mockito can't mock constructors, static methods, `equals()` nor `hashCode` out of the box.
  In order to achieve that [PowerMock](https://github.com/powermock/powermock) must be used.

## Pros and Cons

Mockito helps us to create simple mocks fast. The application of the methods is easy to read, since they are written in
fluent style. Mockito can be used in plain Java projects or together with frameworks such as Spring Boot. It Is well
documented and has lots of examples in it. In case of problems there is a huge community behind and questions are
answered frequently on StackOverflow. It disposes great flexibility to its users which can contribute their ideas, since
it is an open source project. Therefore, the development is ongoing, and the project is maintained.

Mockito can't mock everything out of the box. In case we want to mock `final` or `static` methods, `equals()` or the
construction of an object, we need [PowerMock](https://github.com/powermock/powermock).

## Conclusion

In this post we learned how to create mocks for unit tests in various variants. Mockito gives us a lot of flexibility,
and the freedom to choose between numerous tools to achieve our goals. When working in teams, we define a common language
and Mockito code style guideline how we want to use this powerful tool for testing. This will improve our performance
and helps to discuss and communicate.

Although Mockito comes with a lot of features, be aware of its restrictions. Don't spend time to make the impossible
possible, better reconsider our approach to test a scenario.

You will find all examples on [GitHub](https://github.com/silenum/mockito-examples).