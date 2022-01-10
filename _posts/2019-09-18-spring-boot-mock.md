---
title: Mocking with (and without) Spring Boot
categories: [spring-boot, java]
modified: 2019-09-18
excerpt: "An intro to Mockito and how to use it with Spring Boot."
image:
  auto: 0052-mock
tags: ["mockito", "mock", "spring boot"]
---

Mockito is a very popular library to support testing. It allows us to replace real objects with "mocks", i.e. with objects that are not the real thing and whose behavior we can control within our test. 

This article gives a quick intro to the how and why of Mockito and Spring Boot's integration with it. 

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/mocking" %}}

## The System Under Test

Before we dive into the details of mocking, let's take a look at the application we're going to test. We'll use some code based on the payment example application "buckpal" of my [book](/get-your-hands-dirty-on-clean-architecture/).

The system under test for this article will be a Spring REST controller that accepts requests to transfer money from one account to another:

```java
@RestController
@RequiredArgsConstructor
public class SendMoneyController {

  private final SendMoneyUseCase sendMoneyUseCase;

  @PostMapping(path = "/sendMoney/{sourceAccountId}/{targetAccountId}/{amount}")
  ResponseEntity sendMoney(
          @PathVariable("sourceAccountId") Long sourceAccountId,
          @PathVariable("targetAccountId") Long targetAccountId,
          @PathVariable("amount") Integer amount) {
  
    SendMoneyCommand command = new SendMoneyCommand(
            sourceAccountId,
            targetAccountId,
            amount);
  
    boolean success = sendMoneyUseCase.sendMoney(command);
    
    if (success) {
      return ResponseEntity
              .ok()
              .build();
    } else {
      return ResponseEntity
              .status(HttpStatus.INTERNAL_SERVER_ERROR)
              .build();
    }
  }

}
```

The controller passes the input on to an instance of `SendMoneyUseCase` which is an interface with a single method:

```java
public interface SendMoneyUseCase {

  boolean sendMoney(SendMoneyCommand command);

  @Value
  @Getter
  @EqualsAndHashCode(callSuper = false)
  class SendMoneyCommand {

    private final Long sourceAccountId;
    private final Long targetAccountId;
    private final Integer money;

    public SendMoneyCommand(
            Long sourceAccountId,
            Long targetAccountId,
            Integer money) {
      this.sourceAccountId = sourceAccountId;
      this.targetAccountId = targetAccountId;
      this.money = money;
    }
  }

}
```

Finally, we have a dummy service implementing the `SendMoneyUseCase` interface:

```java
@Slf4j
@Component
public class SendMoneyService implements SendMoneyUseCase {

  public SendMoneyService() {
    log.info(">>> constructing SendMoneyService! <<<");
  }

  @Override
  public boolean sendMoney(SendMoneyCommand command) {
    log.info("sending money!");
    return false;
  }

}
```

Imagine that there is some wildly complicated business logic going on in this class in place of the logging statements. 

For most of this article, we're not interested in the actual implementation of the `SendMoneyUseCase` interface. After all, we want to mock it away in our test of the web controller.

## Why Mock?

Why should we use a mock instead of a real service object in a test?

Imagine the service implementation above has a dependency to a database or some other third-party system. We don't want to have our test run against the database. If the database isn't available, the test will fail even though our system under test might be completely bug-free. **The more dependencies we add in a test, the more reasons a test has to fail.** And most of those reasons will be the wrong ones. If we use a mock instead, we can mock all those potential failures away.

Aside from reducing failures, **mocking also reduces our tests' complexity and thus saves us some effort**. It takes a lot of boilerplate code to set up a whole network of correctly-initialized objects to be used in a test. Using mocks, we only have to "instantiate" one mock instead of a whole rat-tail of objects the real object might need to be instantiated.

In summary, **we want to move from a potentially complex, slow, and flaky integration test towards a simple, fast, and reliable unit test**.

So, in a test of our `SendMoneyController` above, instead of a real instance of `SendMoneyUseCase`, we want to use a mock with the same interface whose behavior we can control as needed in the test.

## Mocking with Mockito (and without Spring)

As a mocking framework, we'll use [Mockito](https://site.mockito.org/), since it's well-rounded, well-established, and well-integrated into Spring Boot. 

But the best kind of test [doesn't use Spring at all](/unit-testing-spring-boot/#dont-use-spring-in-unit-tests), so let's first look at how to use Mockito in a plain unit test to mock away unwanted dependencies.

### Plain Mockito Test

The plainest way to use Mockito is to simply instantiate a mock object using `Mockito.mock()` and then pass the so created mock object into the class under test: 

```java
public class SendMoneyControllerPlainTest {

  private SendMoneyUseCase sendMoneyUseCase = 
      Mockito.mock(SendMoneyUseCase.class);

  private SendMoneyController sendMoneyController = 
      new SendMoneyController(sendMoneyUseCase);

  @Test
  void testSuccess() {
    // given
    SendMoneyCommand command = new SendMoneyCommand(1L, 2L, 500);
    given(sendMoneyUseCase
        .sendMoney(eq(command)))
        .willReturn(true);
  
    // when
    ResponseEntity response = sendMoneyController
        .sendMoney(1L, 2L, 500);
  
    // then
    then(sendMoneyUseCase)
        .should()
        .sendMoney(eq(command));
  
    assertThat(response.getStatusCode())
        .isEqualTo(HttpStatus.OK);
  }

}
```

We create a mock instance of `SendMoneyService` and pass this mock into the constructor of `SendMoneyController`. The controller doesn't know that it's a mock and will treat it just like the real thing.

In the test itself, we can use Mockito's `given()` to define the behavior we want the mock to have and `then()` to check if certain methods have been called as expected. You can find more on Mockito's mocking and verification methods in the [docs](https://static.javadoc.io/org.mockito/mockito-core/3.0.0/org/mockito/Mockito.html).

<div class="notice success">
  <h4>Web Controllers Should Be Integration-tested!</h4>
  <p>
  Don't do this at home! The code above is just an example for how to create mocks.
  Testing a Spring Web Controller with a unit test like this only covers a fraction of the potential errors that can happen in production. The unit test above verifies that a certain response code is returned, but it does not integrate with Spring to check if the input parameters are parsed correctly from an HTTP request, or if the controller listens to the correct path, or if exceptions are transformed into the expected HTTP response, and so on.
  </p>
  <p>
  Web controllers should instead be tested in integration with Spring as discussed in <a href="/spring-boot-web-controller-test/">my article</a> about the <code>@WebMvcTest</code> annotation. 
  </p>
</div>

### Using Mockito Annotations with JUnit Jupiter

Mockito provides some handy annotations that reduce the manual work of creating mock instances and passing them into the object we're about to test.

With JUnit Jupiter, we need to apply the `MockitoExtension` to our test:

```java
@ExtendWith(MockitoExtension.class)
class SendMoneyControllerMockitoAnnotationsJUnitJupiterTest {

  @Mock
  private SendMoneyUseCase sendMoneyUseCase;

  @InjectMocks
  private SendMoneyController sendMoneyController;

  @Test
  void testSuccess() {
    ...
  }

}
```

We can then use the `@Mock` and `@InjectMocks` annotations on fields of the test. 

Fields annotated with `@Mock` will then automatically be initialized with a mock instance of their type, just like as we would call `Mockito.mock()` by hand.

Mockito will then try to instantiate fields annotated with `@InjectMocks` by passing all mocks into a constructor. Note that we need to provide such a constructor for Mockito to work reliably. If Mockito doesn't find a constructor, it will try setter injection or field injection, but the cleanest way is still a constructor. You can read about the algorithm behind this in [Mockito's Javadoc](https://static.javadoc.io/org.mockito/mockito-core/3.0.0/org/mockito/InjectMocks.html).

### Using Mockito Annotations with JUnit 4

With JUnit 4, it's very similar, except that we need to use `MockitoJUnitRunner` instead of `MockitoExtension`: 

```java
@RunWith(MockitoJUnitRunner.class)
public class SendMoneyControllerMockitoAnnotationsJUnit4Test {

  @Mock
  private SendMoneyUseCase sendMoneyUseCase;

  @InjectMocks
  private SendMoneyController sendMoneyController;

  @Test
  public void testSuccess() {
    ...
  }

}
```

## Mocking with Mockito and Spring Boot

There are times when we have to rely on Spring Boot to set up an application context for us because it would be too much work to instantiate the whole network of classes manually. 

We may not want to test the integration between all the beans in a certain test, however, so we need a way to replace certain beans within Spring's application context with a mock. Spring Boot provides the `@MockBean` and `@SpyBean` annotations for this purpose.

### Adding a Mock Spring Bean with @MockBean

A prime example for using mocks is using Spring Boot's `@WebMvcTest` to create an application context that contains all the beans necessary for testing a Spring web controller:

```java
@WebMvcTest(controllers = SendMoneyController.class)
class SendMoneyControllerWebMvcMockBeanTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private SendMoneyUseCase sendMoneyUseCase;

  @Test
  void testSendMoney() {
    ...
  }

}
```

The application context created by `@WebMvcTest` will not pick up our `SendMoneyService` bean (which implements the `SendMoneyUseCase` interface), even though it is marked as a Spring bean with the `@Component` annotation. We have to provide a bean of type  `SendMoneyUseCase` ourselves, otherwise, we'll get an error like this:

```text
No qualifying bean of type 'io.reflectoring.mocking.SendMoneyUseCase' available:
  expected at least 1 bean which qualifies as autowire candidate.
```

Instead of instantiating `SendMoneyService` ourselves or telling Spring to pick it up, potentially pulling in a rat-tail of other beans in the process, we can just add a mock implementation of `SendMoneyUseCase` to the application context.

This is easily done by using Spring Boot's `@MockBean` annotation. The Spring Boot test support will then automatically create a Mockito mock of type `SendMoneyUseCase` and add it to the application context so that our controller can use it. In the test method, we can then use Mockito's `given()` and `when()` methods just like above.

This way we can easily create a focused web controller test that instantiates only the objects it needs.

### Replacing a Spring Bean with @MockBean

Instead of *adding* a new (mock) bean, we can use `@MockBean` similarly to *replace* a bean that already exists in the application context with a mock:

```java
@SpringBootTest
@AutoConfigureMockMvc
class SendMoneyControllerSpringBootMockBeanTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private SendMoneyUseCase sendMoneyUseCase;

  @Test
  void testSendMoney() {
    ...
  }

}
```

Note that the test above uses `@SpringBootTest` instead of `@WebMvcTest`, meaning that the full application context of the Spring Boot application will be created for this test. This includes our `SendMoneyService` bean, as it is annotated with `@Component` and lies within the package structure of our application class.

The `@MockBean` annotation will cause Spring to look for an existing bean of type `SendMoneyUseCase` in the application context. If it exists, it will replace that bean with a Mockito mock.

The net result is the same: in our test, we can treat the `sendMoneyUseCase` object like a Mockito mock. 

The difference is that the `SendMoneyService` bean will be instantiated when the initial application context is created before it's replaced with the mock. If `SendMoneyService` did something in its constructor that requires a dependency to a database or third-party system that's not available at test time, this wouldn't work. Instead of using `@SpringBootTest`, we'd have to create a more focused application context and add the mock to the application context before the actual bean is instantiated.

### Spying on a Spring Bean with @SpyBean

Mockito also allows us to spy on real objects. Instead of mocking away an object completely, Mockito creates a proxy around the real object and simply monitors which methods are being called to that we can later verify if a certain method has been called or not.

Spring Boot provides the `@SpyBean` annotation for this purpose:

```java
@SpringBootTest
@AutoConfigureMockMvc
class SendMoneyControllerSpringBootSpyBeanTest {

  @Autowired
  private MockMvc mockMvc;

  @SpyBean
  private SendMoneyUseCase sendMoneyUseCase;

  @Test
  void testSendMoney() {
    ...
  }

}
```

`@SpyBean` works just like `@MockBean`. Instead of adding a bean to or replacing a bean in the application context it simply wraps the bean in Mockito's proxy. In the test, we can then use Mockito's `then()` to verify method calls just as above.


### Why Do My Spring Tests Take So Long?

If we use `@MockBean` and `@SpyBean` a lot in our tests, running the tests will take a lot of time. This is because Spring Boot creates a new application context for each test, which can be an expensive operation depending on the size of the application context.

## Conclusion

Mockito makes it easy for us to mock away objects that we don't want to test right now. This allows to reduce integration overhead in our tests and can even transform an integration test into a more focused unit test.

Spring Boot makes it easy to use Mockito's mocking features in Spring-supported integration tests by using the `@MockBean` and `@SpyBean` annotations.

As easy as these Spring Boot features are to include in our tests, we should be aware of the cost: each test may create a new application context, potentially increasing the runtime of our test suite noticeable.

The code examples are available on [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/mocking).
