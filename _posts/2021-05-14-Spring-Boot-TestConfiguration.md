---
title: Spring Boot @TestConfiguration Annotation
categories: [spring-boot]
date: 2021-05-15 00:00:00 +0530
excerpt: "Create custom beans or override specific beans during Spring Boot Test execution"
image:
  auto: 0035-switchboard
---
In this article, we will see how to create custom beans or override specific beans during testing using @TestConfiguration annotation.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-testconfiguration" %}

## Introducing @TestConfiguration

We use the `@TestConfiguration` annotation during unit testing of Spring Boot applications for creating custom beans and/or overriding the behavior of specific beans.

Let us assume that, we have a service implementation, which talks to an external restful API to get some data. The service completes its operation once the data is fetched. The service uses [Spring WebClient](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html) to invoke the restful API. Web Client is a non-blocking, reactive client for making HTTP requests.

During application runtime, the WebClient will be created as a bean with appropriate configurations set such as Domain, Port, TLS version, Request/Response handlers, Metrics, default headers, etc.,

However, during testing, the WebClient is not required to be configured with such a full configuration. What the service need is, a simple instance of WebClient, that is configured to talk to a mock web server.

We could use `@TestConfiguration` annotation to create a WebClient bean with less configuration and override the original WebClient bean during testing.

Let us create a simple version of WebClient bean that could be used during testing:

```java
@TestConfiguration
public class WebClientTestConfiguration {
 @Bean
 public WebClient getWebClient(final WebClient.Builder builder) {
  WebClient webClient = builder.baseUrl("http://localhost")
          .build();
  System.out.println("WebClient Instance Created During Testing: "
          + webClient.toString());
  return webClient;
 }
}
```

## Note on Bean Overriding
From `Spring 5.1` onwards, the bean overriding functionality is disabled by default. A [BeanDefinitionOverrideException](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/support/BeanDefinitionOverrideException.html) is thrown if we attempt to override the behaviour of one or more beans.

It is recommended not to turn off this behavior during application runtime. However, we need to turn this feature off to be able to override the bean definition during testing.

To turn this feature on, set the flag `spring.main.allow-bean-definition-overriding` to `true` in `src/test/resources/test.properties` file.

## Configuration vs TestConfiguration
Though the `TestConfiguration` annotation inherits from the `Configuration` annotation, the key difference is, the TestConfiguration will be excluded during the spring boot component scan.

Also, the @TestConfiguration annotation is annotated with `@TestComponent` to indicate that the annotation should be used for testing.

## Activating @TestConfiguration
There are 2 ways in which we can use the @TestConfiguration during testing:
* **Import test configuration using @Import**
* **Declaring TestConfiguration as a static inner class**


### Via @Import
The @Import annotation allows us to import bean definitions from multiple @Configuration classes. This annotation could be used to instruct the spring test context to load the bean definition from the TestConfiguration class:

```java
@SpringBootTest
@Import(WebClientTestConfiguration.class)
class TestConfigurationExampleAppTests {
 // Test case implementations
}
```

### Static Inner Class
In this approach, the @TestConfiguration class is implemented as a static inner class in the test class itself. The spring boot test context will discover and load the @TestConfiguration by default if it's declared as a static inner class:

```java
@SpringBootTest
public class UsingStaticInnerTestConfiguration {
    // Test case implementations

    @TestConfiguration
    public static class WebClientConfiguration {
        @Bean
        public WebClient getWebClient(final WebClient.Builder builder) {
            WebClient webClient = builder.baseUrl("http://localhost").build();
            System.out.println("WebClient Instance Created During Testing, " +
                    "using static inner class: " + webClient.toString());
            return webClient;
        }
    }
}
```

## @TestConfiguration In Action
Let us put all these pieces together to see how the @TestConfiguration could be used during testing.

### Service Implementation
Below is a simple service implementation that takes an instance of WebClient as a constructor argument to perform the Restful API calls:

```java
package io.reflectoring.springboot.testconfiguration.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class DataService {
 
 private final WebClient webClient;
 
 public DataService(final WebClient webClient) {
  this.webClient = webClient;
  System.out.println("WebClient instance " + this.webClient.toString());
 }
}
```

### Configuration Implementation
The actual instance of WebClient is created as a bean by a @Configuration implementation during application runtime. The hostname or domain name of the Restful API is supplied to the configuration class as an environment variable. Along with using the hostname or domain name as the base URL, the configuration class configures the WebClient with other required configurations:

```java
package io.reflectoring.springboot.testconfiguration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfiguration {
 @Bean
 public WebClient getWebClient(final WebClient.Builder builder,
                               @Value("${data.service.endpoint:https://google.com}") 
                               final String url) {
  WebClient webClient = builder.baseUrl(url)
          .defaultHeader(HttpHeaders.CONTENT_TYPE, 
                  MediaType.APPLICATION_JSON_VALUE)
          // more configurations and customizations
          .build();
  System.out.println("WebClient Instance Created During Testing: " 
          + webClient.toString());
  return webClient;
 }
}
```

### Running the application
Let us run the application using `mvn spring-boot:run` to verify that the WebClient created by the @Configuration class is injected into the service.

In the console log, we can observe that has `webClient.toString()` in both configuration and service class prints the same value:

```
WebClient Instance Created During Testing: org.springframework.web.reactive.function.client.DefaultWebClient@e4533f3a
WebClient instance org.springframework.web.reactive.function.client.DefaultWebClient@e4533f3a
```

### Implementing Test using @Import
Let us implement a simple unit test that imports the @TestConfiguration to overwrite the WebClient and inject the same to the service class:

```java
@SpringBootTest
@Import(WebClientTestConfiguration.class)
@TestPropertySource(locations="classpath:test.properties")
class TestConfigurationExampleAppTests {
   @Autowired
   private DataService dataService;
   @Test
   void contextLoads() {
   }
}
```

### Implementing Test using Static Inner Class
Let us implement a simple unit test that imports the @TestConfiguration declared as a static inner class. In this case, we don't need to instruct the spring content to load the @TestConfiguration class:

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
    public static class WebClientConfiguration {
        @Bean
        public WebClient getWebClient(final WebClient.Builder builder) {
            WebClient webClient = builder
                    .baseUrl("http://localhost")
                    .build();
            System.out.println("WebClient Instance Created During Testing, " +
                    "using static inner class: " + webClient.toString());
            return webClient;
        }
    }
}
```

When we run the above Junit tests, we can observe that the @Configuration class is not called to create the WebClient, but the @TestConfiguration class is called to create the WebClient instance.

We can compare and observe the webClient.toString() method in both the @TestConfiguration class and the service implementation, which are found to be the same.

## Conclusion

In this post, we looked at how to use the `@TestConfiguration` for creating a custom bean or for overriding the behaviour of an existing bean for unit testing. 
