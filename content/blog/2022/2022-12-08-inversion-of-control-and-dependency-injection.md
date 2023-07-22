---
title: "Dependency Injection and Inversion of Control"
categories: ["Software Craft"]
date: 2022-12-08 00:00:00 +1100
authors: ["cercenazi"]
description: "Dependency Injection and Inversion of Control"
image: images/stock/0128-threads-1200-628.jpg
url: dependency-injection-and-inversion-of-control
---

Inversion of control (IoC) is simply providing a callback (reaction) to an event that might happen in a system. In other words, instead of executing some logic directly, we invert the control to that callback whenever a specific event occurs.
This pattern allows us to separate *what* we want to do from *when* we want to do it with each part knowing as little as possible about the other, thus simplifying our design.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/ioc-and-di" %}}


## Use Cases for Inversion of Control
IoC offers us the ability to separate the concern of writing the code to take action from the concern of declaring when to take that action. This comes in handy when we are developing a complex system and we want to keep it clean and maintainable.
Let's take a look at some concrete usages.

### Framework
A framework is the best example of IoC because we invert so much control into it. Let's take the Spring framework for example. Instead of going through the trouble of writing code to configure and start a web server we just use the Spring `@SpringBootApplication` annotation that tells Spring to take control and start a web server.

```java
@SpringBootApplication  
public class MyApplication {  
   public static void main(String[] args) {  
      SpringApplication.run(MyApplication.class, args);  
  } 
}
```
Spring also uses IoC to facilitate all related back-end development tasks, such as creating HTTP request handlers.
```java
@GetMapping("/hello")  
public void createPost() {  
    // handle request  
}
```
The `@GetMapping` annotation is Spring's IoC pattern to tell us not to worry about *how* to intercept the GET request to the endpoint `/hello` but worry about *what* to do with it.

### Message Handling
Messaging systems are another good example of inversion of control where we subscribe to a certain message queue (topic) and then we simply write the code that handles what to do with that message. In other words, we invert the control of fetching the messages to the messaging system and ask it to handle the message.

Let's look at an example using Kafka:
```java
@KafkaListener(topics = "myTopic", groupId = "myGroup")  
public void consumeMessage(String message) {  
   System.out.println("Received Message in myGroup : " + message);  
}
``` 

## Dependency Injection
Simply put, dependency injection (DI) is having a framework that provides a component with its dependencies, so you don't have to construct the objects with all their dependencies yourself. 

In this sense, dependency injection is a subtype of inversion of control because we invert the control of constructing objects with their dependencies to a framework.

### Reasons to Use Dependency Injection

Using dependency injection has major benefits that make it a widely-used pattern. Let's discuss two of them.

#### Simplifies Code Design
Using dependency injection allows a component not to worry about how to instantiate its dependencies, which might be quite complicated and might require method calls to other helper utilities. This way the component only asks for the dependency rather than creating it which makes the component itself smaller and simpler.

Let's look at an example where we have a `ShippingService` that only sends a shipment after making some checks using REST calls and Database operations.

First, let's do it without dependency injection, where we construct the `RestTemplate` and `DataSource` objects inside the `ShippingService`.

```java
public class ShippingService {
  private RestTemplate restTemplate;
  private DataSource dataSource;

  public ShippingService() {
    RestTemplate restTemplate =
        new RestTemplateBuilder()
            .setConnectTimeout(Duration.ofMillis(1000))
            .setReadTimeout(Duration.ofMillis(2000))
            .build();
    restTemplate.setUriTemplateHandler(new DefaultUriBuilderFactory("http://payment-service-uri:8080"));

    this.restTemplate = restTemplate;

    DataSourceBuilder dataSourceBuilder = DataSourceBuilder.create();
    dataSourceBuilder.driverClassName("org.h2.Driver");
    dataSourceBuilder.url("jdbc:h2:file:C:/temp/test");
    dataSourceBuilder.username("shipping-user");
    dataSourceBuilder.password("superSecretPassword");
    DataSource dataSource = dataSourceBuilder.build();

    this.dataSource = dataSource;
  }

  private boolean packageIsShippable(String id) {
    // business logic that make REST and database calls  
    return true;
  }

  public void ship(String shipmentId) {
    if (packageIsShippable(shipmentId)) {
      // ship the thing  
    }
  }
}
```
One thing that immediately catches our attention is the big amount of code we had to write without even starting with the `ShippingServie` core business logic.

Now let's use dependency injection to create a simpler design.
```java
public class ShippingService {
  private RestTemplate restTemplate;
  private DataSource dataSource;

  public ShippingService(RestTemplate restTemplate, DataSource dataSource) {
    this.restTemplate = restTemplate;
    this.dataSource = dataSource;
  }

  private boolean packageIsShippable(String id) {
    // business logic that makes REST and database calls  
    return true;
  }

  public void ship(String shipmentId) {
    if (packageIsShippable(shipmentId)) {
      // ship the thing  
    }
  }
}
```
Note that now the `ShippingService` doesn't concern itself with how to construct the `RestTemplate` and `DataSource` dependencies, rather it just asks for them and expects them to be fully configured.

So, who will create the dependencies and pass them to the `ShippingService` ? In the dependency injection world, this is known as the  dependency injection Container.

```java
public class DIContainer {
  private RestTemplate getRestTemplate() {
    RestTemplate restTemplate =
        new RestTemplateBuilder()
            .setConnectTimeout(Duration.ofMillis(1000))
            .setReadTimeout(Duration.ofMillis(2000))
            .build();
    restTemplate.setUriTemplateHandler(new DefaultUriBuilderFactory("http://payment-service-uri:8080"));

    return restTemplate;
  }

  private DataSource getDataSource() {
    DataSourceBuilder dataSourceBuilder = DataSourceBuilder.create();
    dataSourceBuilder.driverClassName("org.h2.Driver");
    dataSourceBuilder.url("jdbc:h2:file:C:/temp/test");
    dataSourceBuilder.username("shipping-user");
    dataSourceBuilder.password("superSecretPassword");
    return dataSourceBuilder.build();
  }

  public ShippingService getShipmentService() {
    return new ShippingService(getRestTemplate(), getDataSource());
  }
}
```
And now, whoever wants to use the `ShippingService` can simply as the `DIContainer` for it and start using it out of the box.


#### Simplifies Testing
Testing often includes testing a component that has dependencies that we don't necessarily want to test as well. That's where the concept of mocking comes in to help us mock the behavior of those dependencies.

Dependency injection allows dependencies to be passed into the component under test. Those dependencies could be the actual implementation or mocks that we create to simulate them during the test.

Let's look at an example using Mockito as our mocking library.
```java
public class ShippingServiceTest {
  @Test
  void testShipping() {
    RestTemplate restTemplateMock = Mockito.mock(RestTemplate.class);
    DataSource dataSourceMock = Mockito.mock(DataSource.class);
    when(restTemplateMock.getForEntity("url", String.class))
        .thenReturn(ResponseEntity.ok("What Ever"));

    ShippingService shippingService = new ShippingService(restTemplateMock, dataSourceMock);
    shippingService.ship("some Id");
    // assert stuff  
  }
}
```

While we're not using a dependency injection framework here, we are injecting the (mocked) dependencies into the constructor of `ShippingService`. 

### Dependency Injection Frameworks
In the Java world, we have three main frameworks that handle DI.

#### [Spring](https://spring.io/)
It's an OpenSource framework developed and maintained by Pivotal. It's a widely used framework with lots of integrations which makes quite heavyweight.

####  [Guice](https://github.com/google/guice)
It's an OpenSource framework that is developed and maintained by Google. It's lightweight in comparison with Spring, however, it has fewer integrations.

#### [Dagger](https://github.com/google/dagger)
Just like Guice, it's also an OpenSource framework maintained by Google. However, it's more lightweight with very few integrations.

## Dependency Injection in Spring
Spring makes it pretty straightforward to declare components and their dependencies and it handles the injection process itself, leaving us the task of declaring what dependencies to be injected in which components.

### Spring Bean
Spring offers us the concept of Beans, which are just Java objects that get registered in the Spring Bean Registry.

Spring Beans are objects that we define in a configuration class.
```java
@Configuration
public class ShipmentConfiguration {

  @Bean
  public RestTemplate restTemplate() {
    RestTemplate restTemplate =
        new RestTemplateBuilder()
            .setConnectTimeout(Duration.ofMillis(1000))
            .setReadTimeout(Duration.ofMillis(2000))
            .build();
    restTemplate.setUriTemplateHandler(new DefaultUriBuilderFactory("http://payment-service-uri:8080"));

    return restTemplate;
  }
}
```
By doing this we are telling Spring to register a Bean of type `RestTemplate` with a name of `restTemplate`. Spring then allows us to inject this Bean in any other registered Spring Bean or in a Spring `Component`.

To have Spring inject the `RestTemplate` object into our `ShippingService` all we have to do is to accept it as a constructor argument:

```java
@Component  
public class ShippingService {  
      
    private final RestTemplate restTemplate;  
    
    public ShippingService(RestTemplate restTemplate){
        this.restTemplate = restTemplate;
    }
    
	public void ship(String shipmentId) {  
	   // do stuff  
	 }  
}
```
Note that we annotated the `ShippingService` class with the `@Component` annotation which tells Spring to make a bean of this class and to inject whatever dependencies it has.

### Dependency Injection Types in Spring
Spring offers us different ways to inject dependencies into our components. Let's get to know them.

#### Field Injection
We declare the dependency as a field in the component and simply annotate it with `@Autowired`:

```java
@Component
public class ShippingService {

    @Autowired
    RestTemplate restTemplate;

    public void ship(String shipmentId) {
        // do stuff  
    }
}
```

#### Setter Injection
We can annotate a setter method with `@Autowired` which tells Spring to inject the Bean of the type declared in the parameter.
```java
@Component
public class ShippingService {

    RestTemplate restTemplate;

    @Autowired
    public void setRestTemplate(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void ship(String shipmentId) {
        // do stuff  
    }
}
```
#### Constructor Injection
Spring also allows us to inject the dependencies through the constructor of the component class, which we have seen in the first example:
```java
@Component
public class ShippingService {

    private final RestTemplate restTemplate;

    public ShippingService(RestTemplate restTemplate){
        this.restTemplate = restTemplate;
    }

    public void ship(String shipmentId) {
        // do stuff  
    }
}
```

Constructor injection is the preferred way of injecting dependencies, because it makes the code less dependent on the framework. We can just as well use the constructor without Spring to create an object with mocked dependencies for a unit test, for example.

## Conclusion
Inversion of control (IoC) is a design pattern in which we declare an action to be taken when a certain event happens in our system. It is heavily used in software because it allows us to write clean and maintainable code.

Dependency injection (DI) is one form of IoC where we delegate the responsibility of creating and injecting components' dependencies to some other party outside of the components themselves.