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
Unit test is used to verify the smallest part of an application ("units") independent of other parts. This makes the verification process easy and fast since the scope of testing is restricted to a narrow scope of a class or method. 

Spring Boot applications are usually built with sequence of multiple dependencies which make writing unit tests difficult. `@TestConfiguration` annotation is used to decouple these dependencies.

In this article, we will see the use of `@TestConfiguration` annotation to create custom beans or override specific beans during unit testing of Spring Boot.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-testconfiguration" %}

## Introducing @TestConfiguration

`@TestConfiguration` is best understood by first looking at the `@Configuration` annotation.

We use the `@Configuration` over a class to declare multiple `@Bean` methods like this: 
```java
 @Configuration
 public class WebClientTestConfiguration {

    @Bean
    public WebClient getWebClient(final WebClient.Builder builder) {
        return builder.baseUrl("<SOME EXTERNAL HOST>").build();
    }
    ...
 }
```
The methods annotated with `@Bean` are processed by the Spring container to generate bean definitions for those beans. Here we are configuring a bean of type `WebClient` which will be used through out our application for making HTTP calls to REST APIs. 

`TestConfiguration` annotation extends `Configuration` annotation by providing the capability for defining additional beans for applying customizations primarily required for running a unit test. 

The above example with the `TestConfiguration` annotation will look like this:
```java
@TestConfiguration
public class WebClientTestConfiguration {
    @Bean
    public WebClient getWebClient(final WebClient.Builder builder) {
        return builder.baseUrl("http://localhost").build();
    }
}
```
Here we are overriding the behavior of the `WebClient` bean to point to `localhost` to use a local instance of the REST API only for the purpose of unit testing. 

## Overriding Bean with TestConfiguration

### What is bean overriding?
Every bean in the Spring application context will have one or more unique identifiers. We can choose to provide a unique identifier while defining the bean. Otherwise, the Spring container generates a unique identifier for that bean.

Bean overriding is, registering or defining another bean with the same identifier as a result of which the previous bean definition is overridden with a new bean implementation.

### Spring version 5.1 behaviour
From `Spring version 5.1` onwards, the bean overriding feature is disabled by default. A [BeanDefinitionOverrideException](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/support/BeanDefinitionOverrideException.html) is thrown if we attempt to override one or more beans.

We should not enable this feature during application runtime. However, we need to enable this feature during testing to override one or more bean definition.

We can enable this feature by switching on an application property `spring.main.allow-bean-definition-overriding` . to `true` in a resource file as shown here: 
```.properties
spring.main.allow-bean-definition-overriding=true
```
Here we set the application property `spring.main.allow-bean-definition-overriding` to `true` in our resource file:`test.properties` under test to enable bean overriding feature during testing.

## Configuration vs TestConfiguration
Though the `TestConfiguration` annotation inherits from the `Configuration` annotation, the key difference is, the `TestConfiguration` will be excluded during the Spring Boot component scan.

Also, the @TestConfiguration annotation is annotated with `@TestComponent` to indicate that the annotation should be used for testing.

## Activating @TestConfiguration
There are two ways in which we can use the `@TestConfiguration` during testing:
* Import test configuration using `@Import`
* Declaring `TestConfiguration` as a static inner class


### Via @Import
The @Import annotation allows us to import bean definitions from multiple `@Configuration` classes. This annotation can be used to instruct the Spring test Context to load the bean definition from the `TestConfiguration` class as well:

```java
@SpringBootTest
@Import(WebClientTestConfiguration.class)
class TestConfigurationExampleAppTests {
    // Test case implementations
}
```
The above code example shows, how to import a test configuration annotated with @TestConfiguration using @Import annotation.

### Static Inner Class
In this approach, the `@TestConfiguration` class is implemented as a static inner class in the test class itself. The Spring Boot test context will discover and load the `@TestConfiguration` by default if it's declared as a static inner class:

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
The above code example shows, how we can define test configuration as a static inner class. In this static inner class approach, we `don't need to explicitly` import the @TestConfiguration using @Import

## @TestConfiguration In Action
Let us put all these pieces together to see how the `@TestConfiguration` can be used during testing.

### Service Implementation
```java
@Service
public class DataService {
    private final WebClient webClient;
    public DataService(final WebClient webClient) {
        this.webClient = webClient;
   }
}
```
Simple service implementation that takes an instance of `WebClient` as a constructor argument to perform the REST API calls.

### Configuration Implementation
```java
@Configuration
public class WebClientConfiguration {
    @Bean
    public WebClient getWebClient(final WebClient.Builder builder, 
                                  @Value("${data.service.endpoint:https://google.com}") final String url) {
        WebClient webClient = builder.baseUrl(url)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                // more configurations and customizations
                .build();
        return webClient; 
    }
}
```
The actual instance of `WebClient` is created as a bean by a `@Configuration` implementation during application runtime. The hostname or domain name of the REST API is provided to the configuration class as an environment variable. Along with using the hostname or domain name as the base URL, the configuration class configures the WebClient with other required configurations


### Running the application
Let us run the application using `mvn spring-boot:run` to verify that the WebClient created by the `@Configuration` class is injected into the service.

```shell
WebClient Instance Created During Testing: org.springframework.web.reactive.function.client.DefaultWebClient@e4533f3a
WebClient instance org.springframework.web.reactive.function.client.DefaultWebClient@e4533f3a
```
In the console log, we can observe that `webClient.toString()` in both configuration and service class prints the same value.

### Implementing Test using @Import
```java
@SpringBootTest
@Import(WebClientTestConfiguration.class)
@TestPropertySource(locations="classpath:test.properties")
class TestConfigurationExampleAppTests {
    @Autowired
    private DataService dataService;
    @Test
    void contextLoads() {}
}
```
A simple unit test that imports the @TestConfiguration to overwrite the WebClient and inject the same to the service class.

### Implementing Test using Static Inner Class
```java
@SpringBootTest
@TestPropertySource(locations="classpath:test.properties")
public class UsingStaticInnerTestConfiguration {
    @Autowired
    private DataService dataService;
    
    @Test
    void contextLoads() {
    }
    
    @TestConfiguration
    public static class WebClientTestConfiguration {
        @Bean
        public WebClient getWebClient(final WebClient.Builder builder) {
            return builder.baseUrl("http://localhost").build();
        }
    }
}
```
A simple unit test that has a `@TestConfiguration` declared as a static inner class. In this case, we don't need to instruct the Spring Context to load the `@TestConfiguration` class.

### Observation
During these test execution, we can observe that the `webClient.toString()` method returns the same instance name for the webclient bean, both in WebClientTestConfiguration and service implementation. 

This indicates that the WebClient bean is created by the definition from `WebClientTestConfiguration` (annotated with @TestConfiguration), not from the `WebClientConfiguration` (annotated with @Configuration).

## Conclusion

In this post, we looked at how to use the `@TestConfiguration` for creating a custom bean or for overriding the behavior of an existing bean for unit testing. 

