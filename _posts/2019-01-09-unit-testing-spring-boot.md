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

Note that this article only discusses unit tests. Integration tests, tests of the web layer
and tests of the persistence layer will be discussed in upcoming articles in this series.

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
  void savedUserHasId(){
    User user = new User("zaphod", "zaphod@mail.com");
    User savedUser = registerUseCase.registerUser(user);
    assertThat(savedUser.getId()).isNotNull();
  }

}
```

**This test takes about 4.5 seconds to run on an empty Spring project on my computer.** Note that
if it's run from the IDE, it shows only about 75 ms, but the IDE only shows the time needed
to actually run the test, not the time to set up the Spring context.

The rest of the 4.5 seconds is due to the `@SpringBootRun` annotation that tells Spring Boot
to set up **a whole Spring Boot application context only so that we can autowire a `RegisterUseCase`
instance into our test**. It will take even longer once the application gets bigger and Spring
has to load more beans into the application context. Dave Syer has written a comprehensive
write-up about [Spring Boot startup times](https://github.com/dsyer/spring-boot-startup-bench)
if you want to dig deeper.

So, why this article when we shouldn't use Spring Boot in a unit test? To be honest, most of the
article is about how to write good unit tests without Spring Boot. But let's first discuss 
how we can write a Spring bean so that it can be unit tested well without Spring Boot.

# Creating a Testable Spring Bean

* Field Injection vs. Constructor Injection
* don't pollute your code with `@Autowired` (no longer needed with Spring 5)
* make dependencies final
* use Lomboks `@RequiredArgsConstructor` to reduce boilerplate
* we may even remove the `@Component` annotation to make it completely Spring-agnostic

# The Cost of @SpringBootRun

* example with `@SpringBootRun`
* builds a whole ApplicationContext each time
* measure time: how long does it take even with a minimal example?
* Spring builds a new context each time it changes
  * code
* conclusion: don't use it for unit tests

# Mocking Dependencies with Mockito
* Mockito.mock()
* MockitoJunitRunner und @Mock

# Creating Readable Assertions with assertJ
* transform assertions from above into assertJ
* write your own assertion

# Naming Test Classes and Methods
* test classes should be named *Tests not *Test
* method names should express what is tested
  * given_when_then
  
# Navigating Between Test and Production Code
* shortcut in Intellij: CTRL+SHIFT+T
* have the production code on the second screen

# Conclusion
