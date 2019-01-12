---
title: "All You Need To Know About Unit Testing with Spring Boot"
categories: [java]
modified: 2018-12-31
last_modified_at: 2018-12-31
author: tom
tags: 
comments: true
ads: true
excerpt: ""
sidebar:
  toc: true
---

{% include sidebar_right %}

Writing good unit tests can be considered an art that is hard to master. But the
good news is that the mechanics supporting this art are easy to learn. This article
provides these mechanics and goes into the technical details that are necessary
to write good unit tests. 

We'll have a look at how to create Spring beans in a testable manner and then discuss 
usage of Mockito and AssertJ, both libraries that Spring Boot automatically includes for
supporting tests. 

Note that this article only discusses unit tests. Integration tests, tests of the web layer
and tests of the persistence layer will be discussed in upcoming articles of this series.

# Dependencies

For the unit tests in this tutorial, we'll use JUnit Jupiter (JUnit 5), Mockito, and 
AssertJ. We'll also include Lombok for reducing a bit of boilerplate code:

```groovy
compileOnly('org.projectlombok:lombok')
testCompile('org.springframework.boot:spring-boot-starter-test')
testCompile 'org.junit.jupiter:junit-jupiter-engine:5.2.0'
testCompile('org.mockito:mockito-junit-jupiter:2.23.0')
```

Mockito and AssertJ are automatically imported with the `spring-boot-starter-test` dependency.
 
# Don't Use Spring in Unit Tests 

If you have written tests with Spring or Spring Boot in the past, **you'll probably say that
we don't need Spring to write unit tests**. But why?

Consider the following "unit" test that tests a single method on the `RegisterUseCase` class:

```java
@ExtendWith(SpringExtension.class)
@SpringBootTest
class RegisterUseCaseTest {

  @Autowired
  private RegisterUseCase registerUseCase;

  @Test
  void savedUserHasRegistrationDate() {
    User user = new User("zaphod", "zaphod@mail.com");
    User savedUser = registerUseCase.registerUser(user);
    assertThat(savedUser.getRegistrationDate()).isNotNull();
  }

}
```

[comment]: # (CROSS REFERENCE - tutorial on how to inject current time)

**This test takes about 4.5 seconds to run on an empty Spring project on my computer.** Note that
if it's run from the IDE, it shows only about 75 ms, but the IDE only shows the time needed
to actually run the test, not the time to set up the Spring context.

The rest of the 4.5 seconds is due to the `@SpringBootRun` annotation that tells Spring Boot
to set up **a whole Spring Boot application context only so that we can autowire a `RegisterUseCase`
instance into our test**. It will take even longer once the application gets bigger and Spring
has to load more beans into the application context. If you want to dig deeper into 
Spring Boot startup performance, have a look at Dave Syer's 
[write-up about this topic](https://github.com/dsyer/spring-boot-startup-bench).

So, why this article when we shouldn't use Spring Boot in a unit test? To be honest, most of this tutorial
is about how to write good unit tests *without* Spring Boot.

# Creating a Testable Spring Bean

## Field Injection is Evil

However, we can write Spring beans ways that are better or worse unit testable without Spring Boot. Consider
the following class:

```java
@Service
public class RegisterUseCase {

  @Autowired
  private UserRepository userRepository;

  public User registerUser(User user) {
    return userRepository.save(user);
  }

}
```

This class cannot be unit tested without Spring because it provides no way to pass in a `UserRepository`
instance. Instead, we need to write the test in the way discussed in the previous section to let
Spring create a `UserRepository` instance and inject it into the field annotated with `@Autowired`.

**The lesson here is not to use field injection.** 

## Providing a Constructor
 
Actually let's not use the `@Autowired` annotation at all:

```java
@Service
public class RegisterUseCase {

  private final UserRepository userRepository;

  public RegisterUseCase(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public User registerUser(User user) {
    return userRepository.save(user);
  }

}
```

This version allows constructor injection by providing a constructor that allows to pass 
in a `UserRepository` instance. In the unit test, we can now
create such an instance (perhaps a mock instance as will be discussed later) and pass it into the constructor.

Spring will automatically use this constructor to instantiate a `RegisterUseCase` object when creating
the application context. Note that prior to Spring 5, we need to add the `@Autowired` annotation to
the constructor for Spring to find the constructor. 

Also note that the `UserRepository` field is now `final`. This makes sense since the field content 
won't ever change during the lifetime of an application. It also helps to avoid programming
errors, because the compiler will complain if we have forgotten to initialize the field.

## Reducing Boilerplate Code

Using Lombok's [`@RequiredArgsConstructor`](https://projectlombok.org/features/constructor)
annotation we can let the constructor be automatically generated:

```java
@Service
@RequiredArgsConstructor
public class RegisterUseCase {

  private final UserRepository userRepository;

  public User registerUser(User user) {
    user.setRegistrationDate(LocalDateTime.now());
    return userRepository.save(user);
  }

}
```

Now we have a very concise class without boilerplate code that can be instantiated easily in 
a plain java test case:

```java
class RegisterUseCaseTest {

  private UserRepository userRepository = ...;

  private RegisterUseCase registerUseCase;

  @BeforeEach
  void initUseCase() {
    RegisterUseCase registerUseCase = new RegisterUseCase(userRepository);
  }

  @Test
  void savedUserHasRegistrationDate() {
    User user = new User("zaphod", "zaphod@mail.com");
    User savedUser = registerUseCase.registerUser(user);
    assertThat(savedUser.getRegistrationDate()).isNotNull();
  }

}
```

In the next section we'll look at how to create a mock `UserRepository` instance so that 
we can test the `RegisterUseCase` class without relying on an actual `UserRepository`
that would in turn rely on a database.   

# Using Mockito to Mock Dependencies

The de-facto standard mocking library nowadays is [Mockito](https://site.mockito.org/).
It provides at least two ways to create a mocked `UserRepository` to fill the blank in the previous code example.

## Mocking Dependencies with Plain Mockito

The first way is to just use Mockito programmatically:

```java
private UserRepository userRepository = Mockito.mock(UserRepository.class);
``` 

This will create an object that looks like a `UserRepository` from the outside. **By default, it will
do nothing when a method is called and return `null` if the method has a return value**.

Our test would now fail with a `NullPointerException` at `assertThat(savedUser.getRegistrationDate()).isNotNull()`
because the content of the `savedUser` resulting from the call to `userRepository.save(user)` is `null`.

So, we have to tell Mockito to return something when `save()` is called. We do this with the static `when`
method:

```java
@Test
void savedUserHasRegistrationDate() {
  User user = new User("zaphod", "zaphod@mail.com");
  when(userRepository.save(any(User.class))).then(returnsFirstArg());
  User savedUser = registerUseCase.registerUser(user);
  assertThat(savedUser.getRegistrationDate()).isNotNull();
}
```

This will make `userRepository.save()` return the same user object that is passed into
the method.

For more information on how to use Mockito, have a look at 
the [reference documentation](https://static.javadoc.io/org.mockito/mockito-core/2.23.4/org/mockito/Mockito.html).

## Mocking Dependencies with Mockito's `@Mock` Annotation

An alternative way of creating mock objects is Mockito's `@Mock` annotation in combination with 
the `MockitoExtension` for JUnit Jupiter:

```java
@ExtendWith(MockitoExtension.class)
class RegisterUseCaseTest {

  @Mock
  private UserRepository userRepository;

  private RegisterUseCase registerUseCase;

  @BeforeEach
  void initUseCase() {
    registerUseCase = new RegisterUseCase(userRepository);
  }

  @Test
  void savedUserHasRegistrationDate() {
    // ...
  }

}
```

The `@Mock` annotation specifies the fields in which Mockito should inject mock objects. The `@MockitoExtension`
tells Mockito to evaluate those `@Mock` annotations because JUnit does not do this automatically.

The result is the same as if calling `Mockito.mock()` manually, it's a matter of taste which way to use. Note, though,
that by using `MockitoExtension` you're bound to the test framework. 

# Creating Readable Assertions with AssertJ

Another library that comes automatically with the Spring Boot test support is [AssertJ](http://joel-costigliola.github.io/assertj/).
We have already used it above to implement our assertion:

```java
assertThat(savedUser.getRegistrationDate()).isNotNull();
```

However, wouldn't it be nice to make the assertion even more readable? Like this, for example:

```java
assertThat(savedUser).hasRegistrationDate();
``` 

There are many cases where small changes like this make the test so much better to understand.
So, let's create our own [custom assertion](http://joel-costigliola.github.io/assertj/assertj-core-custom-assertions.html):

```java
public class UserAssert extends AbstractAssert<UserAssert, User> {

  public UserAssert(User user) {
    super(user, UserAssert.class);
  }

  public static UserAssert assertThat(User actual) {
    return new UserAssert(actual);
  }

  public UserAssert hasRegistrationDate() {
    isNotNull();
    if (actual.getRegistrationDate() == null) {
      failWithMessage("Expected user to have a registration date, but it was null");
    }
    return this;
  }
}
```

Now, if we import the `assertThat` method from the new `UserAssert` class instead from
the AssertJ library, we can use the new, easier to read assertion.

Creating a custom assertion may seem like a lot of work, but it's actually done in a couple minutes.
I believe strongly that it's worth to invest these minutes to create readable test code, even if it's
only marginally better readable afterwards. **We only write the test code once, after all, and others
have to read, understand and then manipulate the code many, many times during the life-time of a software**.

If it still seems like too much work, have a look at AssertJ's 
[Assertions Generator](http://joel-costigliola.github.io/assertj/assertj-assertions-generator.html).

# Conclusion

There are reasons to start up a Spring application in a test, but for plain unit tests, this is not
necessary. It's even harmful due to the longer turnaround times. Instead, we should build our Spring
beans in a way that easily supports writing plain unit tests for.

The Spring Boot Test Starter comes with Mockito and AssertJ as testing libraries. We should exploit their
features to create expressive unit tests.

The code example in its final form is available [on github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-testing).   
