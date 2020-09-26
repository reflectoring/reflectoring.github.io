---
title: "Integration Tests with Spring Boot and @SpringBootTest"
categories: [spring-boot]
modified: 2020-09-15
excerpt: "A tutorial on when and how to use Spring Boot's @SpringBootTest annotation and how to reduce test runtime."
image:
  auto: 0018-cogs
---



With the `@SpringBootTest` annotation, Spring Boot provides a convenient way to start up
an application context to be used in a test. In this tutorial, we'll discuss when to use
`@SpringBootTest` and when to better use other tools for testing. We'll also look into
different ways to customize the application context and how to reduce test runtime. 

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-testing" %}

## The "Testing with Spring Boot" Series

This tutorial is part of a series:

1. [Unit Testing with Spring Boot](/unit-testing-spring-boot/)
2. [Testing Spring MVC Web Controllers with Spring Boot and `@WebMvcTest`](/spring-boot-web-controller-test/)
3. [Testing JPA Queries with Spring Boot and `@DataJpaTest`](/spring-boot-data-jpa-test/)
4. [Integration Tests with `@SpringBootTest`](/spring-boot-test/)

**If you like learning from videos, make sure to check out Philip's** [**Testing Spring Boot Applications Masterclass**](https://transactions.sendowl.com/stores/13745/194393) (if you buy through this link, I get a cut). 

## Dependencies

The code examples in this article only need the dependencies to Spring Boot's test starter
and to JUnit Jupiter:

```groovy
dependencies {
	testCompile('org.springframework.boot:spring-boot-starter-test')
	testCompile('org.junit.jupiter:junit-jupiter:5.4.0')
}
```

## Integration Tests vs. Unit Tests

Before we start into integration tests with Spring Boot, let's define
what sets an integration test apart from a unit test.

A unit test covers a single "unit", where a unit commonly is a single class,
but can also be a cluster of cohesive classes that is tested in combination.

An integration test can be any of the following:

* a test that covers multiple "units". It tests the interaction between two or more
  clusters of cohesive classes. 
* a test that covers multiple layers. This is actually a specialization of the
  first case and might cover the interaction between a business service and 
  the persistence layer, for instance.
* a test that covers the whole path through the application. In these tests, we 
  send a request to the application and check that it responds correctly and
  has changed the database state according to our expectations.

Spring Boot provides the `@SpringBootTest` annotation which we can use to
create an application context containing all the objects we need for all of the
above test types. Note, however, that overusing `@SpringBootTest`
might lead to very [long-running test suites](#why-are-my-integration-tests-so-slow).

So, for simple tests that cover multiple units we should rather create 
plain tests, very similar to [unit tests](/unit-testing-spring-boot/),
in which we manually create the 
object graph needed for the test and mock away the rest. This way, Spring doesn't
fire up a whole application context each time the test is started.

For tests that cover integration with the web layer or persistence layer, we can use
[`@WebMvcTest`](/spring-boot-web-controller-test/) or [`@DataJpaTest`](/spring-boot-data-jpa-test/) instead. 
For integration with other layers, have a look at Spring Boot's other [test slice annotations](https://docs.spring.io/spring-boot/docs/current/reference/html/test-auto-configuration.html).
Note that these test slices will also take some time to boot up, though.

Finally, for tests that cover the whole Spring Boot application from incoming
request to database, or tests that cover certain parts of the application that
are hard to set up manually, we can and should use `@SpringBootTest`.   

## Creating an ApplicationContext with `@SpringBootTest`

`@SpringBootTest` by default starts searching in the current package of the 
test class and then searches upwards through the package structure, looking for 
a class annotated with `@SpringBootConfiguration` from which it then reads the
configuration to create an application context. This class is usually our main
application class since the `@SpringBootApplication` annotation includes
the `@SpringBootConfiguration` annotation. It then creates an
application context very similar to the one that would be started in a production
environment.

We can customize this application context in many different ways, [as described
in the next section](#customizing-the-application-context).

Because we have a full application context, including web controllers, Spring 
Data repositories, and data sources, `@SpringBootTest` is very convenient for
integration tests that go through all layers of the application: 

```java
@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureMockMvc
class RegisterUseCaseIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private UserRepository userRepository;

  @Test
  void registrationWorksThroughAllLayers() throws Exception {
    UserResource user = new UserResource("Zaphod", "zaphod@galaxy.net");

    mockMvc.perform(post("/forums/{forumId}/register", 42L)
            .contentType("application/json")
            .param("sendWelcomeMail", "true")
            .content(objectMapper.writeValueAsString(user)))
            .andExpect(status().isOk());

    UserEntity userEntity = userRepository.findByName("Zaphod");
    assertThat(userEntity.getEmail()).isEqualTo("zaphod@galaxy.net");
  }

}
```

<div class="notice success">
  <h4><code>@ExtendWith</code></h4>
  <p>
  The code examples in this tutorial use the <code>@ExtendWith</code> annotation to tell
  JUnit 5 to enable Spring support. <a href="https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.1-Release-Notes#junit-5">As of Spring Boot 2.1</a>, we no longer need to
  load the <code>SpringExtension</code> because it's included as a meta annotation in the 
  Spring Boot test annotations like <code>@DataJpaTest</code>, <code>@WebMvcTest</code>, and 
  <code>@SpringBootTest</code>.
  </p>
</div> 

Here, we additionally use `@AutoConfigureMockMvc` to add a `MockMvc` instance 
to the application context.

We use this `MockMvc` object to perform a `POST` request to our application
and to verify that it responds as expected. 

We then use the `UserRepository` from the application context to verify that the 
request has lead to an expected change in the state of the database. 

## Customizing the Application Context

We can turn a lot of knobs to customize the application context
created by `@SpringBootTest`. Let's see which options we have.

<div class="notice success">
  <h4>Caution when Customizing the Application Context</h4>
  <p>
  Each customization of the application context is one more thing that
  makes it different from the "real" application context that is started 
  up in a production setting. So, in order to make our tests as close to
  production as we can, <strong>we should only customize what's really necessary
  to get the tests running!</strong>  
  </p>
</div> 
 
### Adding Auto-Configurations

Above, we've already seen an auto-configuration in action:

```java
@SpringBootTest
@AutoConfigureMockMvc
class RegisterUseCaseIntegrationTest {
  ...
}
```

There's a lot of other [auto-configurations](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-testing.html#boot-features-testing-spring-boot-applications-testing-autoconfigured-tests)
available that each add other beans to the application context. 

### Setting Custom Configuration Properties

Often, in tests it's necessary to set some configuration properties to a value that's 
different from the value in a production setting:

```java
@SpringBootTest(properties = "foo=bar")
class SpringBootPropertiesTest {

  @Value("${foo}")
  String foo;

  @Test
  void test(){
    assertThat(foo).isEqualTo("bar");
  }
}
```

If the property `foo` exists in the default setting, it will be overridden
by the value `bar` for this test. 

### Externalizing Properties with `@ActiveProfiles`

If many of our tests need the same set of properties, we can create a
configuration file `application-<profile>.properties` or `application-<profile>.yml`
and load the properties from that file by activating a certain profile:

```yaml
# application-test.yml
foo: bar
```

```java
@SpringBootTest
@ActiveProfiles("test")
class SpringBootProfileTest {

  @Value("${foo}")
  String foo;

  @Test
  void test(){
    assertThat(foo).isEqualTo("bar");
  }
}
```

### Setting Custom Properties with `@TestPropertySource`
 
Another way to customize a whole set of properties is with the `@TestPropertySource`
annotation:

```properties
# src/test/resources/foo.properties
foo=bar
```

```java
@SpringBootTest
@TestPropertySource(locations = "/foo.properties")
class SpringBootPropertySourceTest {

  @Value("${foo}")
  String foo;

  @Test
  void test(){
    assertThat(foo).isEqualTo("bar");
  }
}
```

All properties from the `foo.properties` file are loaded into the application
context. `@TestPropertySource` also to [configure a lot more](https://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/test/context/TestPropertySource.html).  

### Injecting Mocks with `@MockBean`

If we only want to test a certain part of the application instead of the
whole path from incoming request to database, we can replace certain 
beans in the application context by using `@MockBean`: 

```java
@SpringBootTest
class MockBeanTest {

  @MockBean
  private UserRepository userRepository;

  @Autowired
  private RegisterUseCase registerUseCase;

  @Test
  void testRegister(){
    // given
    User user = new User("Zaphod", "zaphod@galaxy.net");
    boolean sendWelcomeMail = true;
    given(userRepository.save(any(UserEntity.class))).willReturn(userEntity(1L));

    // when
    Long userId = registerUseCase.registerUser(user, sendWelcomeMail);

    // then
    assertThat(userId).isEqualTo(1L);
  }
  
}
```

In this case, we have replaced the `UserRepository` bean with a mock.
Using Mockito's `given` method, we have specified the expected behavior for this
mock in order to test a class that uses this repository.

You can read more about the `@MockBean` annotation in [my article](/spring-boot-mock/) about mocking.

### Adding Beans with `@Import`

If certain beans are not included in the default application context, but we need
them in a test, we can import them using the `@Import` annotation:

```java
package other.namespace;

@Component
public class Foo {
}
```

```java
@SpringBootTest
@Import(other.namespace.Foo.class)
class SpringBootImportTest {

  @Autowired
  Foo foo;

  @Test
  void test() {
    assertThat(foo).isNotNull();
  }
}
```

By default, a Spring Boot application includes all components it finds within its
package and sub-packages, so this will usually only be needed if we want to include 
beans from other packages.

### Creating a Custom `@SpringBootApplication`

We can even create a whole custom Spring Boot application to start up in tests.
If this application class is in the same package as the real application class, 
but in the test sources rather than
the production sources, `@SpringBootTest` will find it before the actual application class 
and load the application context from this application instead.

Alternatively, we can tell Spring Boot which application class to use to create an
application context: 

```java
@SpringBootTest(classes = CustomApplication.class)
class CustomApplicationTest {

}
```

When doing this, however, **we're testing an application context that may be completely
different from the production environment**, so this should be a last resort only when
the production application cannot be started in a test environment. Usually, there
are better ways, though, such as to make the real application context configurable
to exclude beans that won't start in a test environment. Let's look at this in an example.

Let's say we use the `@EnableScheduling` annotation on our application class.
Each time the application context is started (even in tests), all `@Scheduled` jobs will
be started and may conflict with our tests. We usually don't want the jobs to run in tests,
so we can create a second application class without the `@EnabledScheduling` annotation 
and use this in the tests. However, the better solution would be to create a configuration class
that can be toggled with a property:

```java
@Configuration
@EnableScheduling
@ConditionalOnProperty(
        name = "io.reflectoring.scheduling.enabled",
        havingValue = "true",
        matchIfMissing = true)
public class SchedulingConfiguration {
}
```

We have moved the `@EnableScheduling` annotation from our application class to this special
confgiuration class. Setting the property `io.reflectoring.scheduling.enabled` to `false`
will cause this class not to be loaded as part of the application context:

```java
@SpringBootTest(properties = "io.reflectoring.scheduling.enabled=false")
class SchedulingTest {

  @Autowired(required = false)
  private SchedulingConfiguration schedulingConfiguration;

  @Test
  void test() {
    assertThat(schedulingConfiguration).isNull();
  }
}
```

We have now successfully deactivated the scheduled jobs
in the tests. The property `io.reflectoring.scheduling.enabled` can be specified in any of the ways described
[above](#setting-custom-configuration-properties).

## Why are my Integration Tests so slow?

A code base with a lot of `@SpringBootTest`-annotated tests may take quite some time
to run. The Spring test support is [smart enough](https://docs.spring.io/spring/docs/current/spring-framework-reference/testing.html#testcontext-ctx-management-caching)
to only create an application context once and re-use it in following tests, but if different tests need different application
contexts, it will still create a separate context for each test, which takes some time for
each test.

**All of the customizing options described above will cause Spring to create a new application
context**. So, we might want to create one single configuration and use it for all tests so
that the application context can be re-used. 

If you're interested in the time your tests spend for setup and Spring application contexts,
you may want to have a look at [JUnit Insights](https://github.com/adessoAG/junit-insights),
which can be included in a Gradle or Maven build to produce a nice report 
about how your JUnit 5 tests spend their time.

## Conclusion

`@SpringBootTest` is a very convenient method to set up an application context for tests
that is very close the one we'll have in production. There are a lot of options to customize
this application context, but they should be used with care since we want our tests to run
as close to production as possible. 

`@SpringBootTest` brings the most value if we want to test the whole way through the application.
For testing only certain slices or layers of the application, we have other options available.

The example code used in this article is available on [github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-testing).

**If you like learning from videos, make sure to check out Philip's** [**Testing Spring Boot Applications Masterclass**](https://transactions.sendowl.com/stores/13745/194393) (if you buy through this link, I get a cut). 
