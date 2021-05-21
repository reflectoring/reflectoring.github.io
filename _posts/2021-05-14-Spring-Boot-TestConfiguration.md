---
title: Spring Boot @TestConfiguration Annotation
categories: [spring-boot]
date: 2021-05-15 00:00:00 +0530
modified: 2021-05-15 06:00:00 +1000
author: naveen
excerpt: "Create custom beans or override specific bean behaviors during unit testing of Spring Boot applications "
image:
 auto: 0035-switchboard
---
A unit test is used to verify the smallest part of an application ("units") independent of other parts. This makes the verification process easy and fast since the scope of testing is restricted to a narrow scope of a class or method. 

In this article, we will see the use of `TestConfiguration` annotation for creating custom beans or overriding specific beans during unit testing of Spring Boot applications.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-testconfiguration" %}

## Introducing TestConfiguration

Spring Boot applications are usually built with sequence of multiple dependencies which make writing unit tests difficult. `TestConfiguration` annotation is used to decouple these dependencies. It does this by allowing us to define additional beans or for modify the behavior of existing beans in the Spring application context. We use this capability for applying customizations for abstracting the external dependencies and run our unit test. 

We use the [TestConfiguration](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/context/TestConfiguration.html) to create configurations For our tests.

We can best understand the `TestConfiguration` annotation by first looking at the `Configuration` annotation which is the parent annotation it inherits from. 

Before that, let us create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.5.0.RELEASE&packaging=jar&jvmVersion=11&groupId=io.reflectoring.springboot.testconfiguration&artifactId=spring-boot-test-configuration&name=spring-boot-test-configuration&description=Project%20for%20Spring%20Boot%20Test%20Configuration&packageName=io.reflectoring.springboot.testconfiguration.spring-boot-test-configuration&dependencies=webflux), and then open the project in our favorite IDE. We will use this project to create our service class and bean configurations and then write tests using the `TestConfiguration` annotation.

## Configuring Test with Configuration

Let us look at the structure of a unit test in Spring Boot where we define the beans in a configuration class annotated with the `Configuration` annotation : 

```java
@Configuration
public class WebClientConfiguration {
     private static final Logger LOGGER = LoggerFactory.getLogger(WebClientConfiguration.class);
     @Bean
     public WebClient getWebClient
              (final WebClient.Builder builder,
               @Value("${data.service.endpoint:https://google.com}") final String url) {

         WebClient webClient = builder.baseUrl(url)
                 .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                 // more configurations and customizations
                 .build();
         LOGGER.info("WebClient Bean Instance: {}", webClient);
         return webClient;
     }
 }
```
In this code snippet, we define the `WebClient` bean with an external URL. We will next define a service class where we will inject this `webclient` to call a REST API:

```java
@Service
 public class DataService {
     private static final Logger LOGGER = LoggerFactory.getLogger(DataService.class);
     private final WebClient webClient;
     public DataService(final WebClient webClient) {
         this.webClient = webClient;
         LOGGER.info("WebClient instance {}", this.webClient);
     }
 }
 ```
 In this code snippet, the `DataService` bean is injected in the test class uses the `WebClient` bean configured with an external URL. 

 We will now create our test class and  annotate it with `SpringBootTest`. This results in bootstrapping of the full application context containing the beans selected by component scanning. Due to this we can inject any bean from the application context by autowiring the bean in our test class:

```java
@SpringBootTest
@TestPropertySource(locations="classpath:test.properties")
class TestConfigurationExampleAppTests {
 	@Autowired
 	private DataService dataService;
    ...
 }
```
In this code snippet, the `DataService` bean injected in the test class uses the `WebClient` bean configured with an external URL. This makes our unit test dependent on an external dependency which might fail if we run our test as part of any automatted test or in any other environment with restricted connectivity. 

## Configuring Test with TestConfiguration

In order to make our unit tests run without any dependency on an external API, we may want to use a modified test configuration which will connect to a locally running mock service instead of bootstrapping the actual application context. We do this by using the `TestConfiguration` annotation over our configuration class being used for test. This test configuration class can be  an inner class within a test class or a separate class as shown here:

```java
@TestConfiguration
public class WebClientTestConfiguration {
     ...
     @Bean
     public WebClient getWebClient(final WebClient.Builder builder) {
         //customized for running unit tests
         WebClient webClient = builder
                 .baseUrl("http://localhost")
                 .build();
         LOGGER.info("WebClient Instance Created During Testing: {}", webClient);
         return webClient;
     }
 }

@SpringBootTest
@Import(WebClientTestConfiguration.class)
@TestPropertySource(locations="classpath:test.properties")
class TestConfigurationExampleAppTests {
 	@Autowired
 	private DataService dataService;

}
```
Here the `DataService` bean injected in the test class uses the `WebClient` bean configured in the test configuration class with `TestConfiguration` annotation with local URL. This way we can execute our unit test without any dependency on an external system. 

Here we are overriding the behavior of the `WebClient` bean to point to `localhost` so that we can use a local instance of the REST API only for the purpose of unit testing. 

`TestConfiguration` annotation provides the capability for defining additional beans or for modifying the behavior of existing beans in the Spring Application Context for applying customizations primarily required for running a unit test. 

## Enabling the Bean Overriding Behavior

Every bean in the Spring application context will have one or more unique identifiers. Bean overriding is, registering or defining another bean with the same identifier as a result of which the previous bean definition is overridden with a new bean implementation.
The bean overriding feature is disabled by default from [Spring Boot 2.1](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.1-Release-Notes#bean-overriding). A [BeanDefinitionOverrideException](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/support/BeanDefinitionOverrideException.html) is thrown if we attempt to override one or more beans.

We should not enable this feature during application runtime. However, we need to enable this feature during testing to override one or more bean definition.

We need to enable this feature by switching on an application property `spring.main.allow-bean-definition-overriding` in a resource file as shown here: 

```properties
spring.main.allow-bean-definition-overriding=true
```
Here we are setting the application property `spring.main.allow-bean-definition-overriding` to `true` in our resource file:`test.properties` under test to enable bean overriding feature during testing.

## Component Scanning Behavior
Though the `TestConfiguration` annotation inherits from the `Configuration` annotation, the key difference is, the `TestConfiguration` is excluded during Spring Boot's [component scanning](https://reflectoring.io/spring-component-scanning/).

Configuration classes annotated with @TestConfiguration are excluded from component scanning, therefore we need to import it explicitly in every test where we want to @Autowire it. 

Also, the `TestConfiguration` annotation is annotated with the [TestComponent](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/context/TestComponent.html) in it's definition to indicate that the annotation should be used only for testing.

## Using TestConfiguration in Unit Tests
As explained earlier, we can use the `TestConfiguration` annotation in two ways during testing:
1. Import test configuration using the `Import` annotation
2. Declaring `TestConfiguration` as a static inner class


### Using TestConfiguration with the Import Annotation
The `Import` annotation allows us to import bean definitions from multiple `@Configuration` classes. This annotation is used to instruct the Spring test Context to load the bean definition from the `TestConfiguration` class as well:

```java
@SpringBootTest
@Import(WebClientTestConfiguration.class)
class TestConfigurationExampleAppTests {
    // Test case implementations
}
```
The above code example shows, how to import a test configuration annotated with `TestConfiguration` using the `Import` annotation.

### Using TestConfiguration with the Static Inner Class
In this approach, the class annotated with `TestConfiguration` is implemented as a static inner class in the test class itself. The Spring Boot test context will discover and load the test configuration if it is declared as a static inner class:

```java
@SpringBootTest
public class UsingStaticInnerTestConfiguration {
  @TestConfiguration
  public static class WebClientConfiguration {
    @Bean
    public WebClient getWebClient(final WebClient.Builder builder) {
     return builder.baseUrl("http://localhost").build();
   }
 }
}
```
The above code example shows, how we can define test configuration as a static inner class. In this static inner class approach, we don't need to explicitly import the test configuration.


## Conclusion

In this post, we looked at how to use the `TestConfiguration` annotation for creating a custom bean or for overriding the behavior of an existing bean for unit testing. 

