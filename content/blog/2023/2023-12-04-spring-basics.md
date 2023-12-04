---
authors: [tom]
title: "Spring Basics"
categories: ["Spring"]
date: 2023-12-04 00:00:00 +1100
excerpt: "Everything you need to know to get started with the Spring Framework."
image: images/stock/0027-cover-1200x628-branded.jpg
url: spring-basics
---


At its core, Spring is a Dependency Injection framework. Although it now offers a variety of other features that simplify developers' lives, most of these are built on top of the Dependency Injection framework.

Dependency Injection (DI) is often considered the same as Inversion of Control (IoC). Let's briefly explain and classify the two terms in the context of the Spring Framework.
## Inversion of Control

The concept of Inversion of Control is to give control over the execution of program code to a framework. This can be done, for example, through a function that we program ourselves and then pass to a framework, which then calls it at the right time. We call this function a "callback."

An example of a callback is a function that should be executed in a server application when a specific URL is called. We program the function, but we do not call it ourselves. Instead, we pass the function to a framework that listens for HTTP requests on a specific port, analyzes the request, and then forwards it to one of the registered callback functions based on specific parameters. The Spring WebMVC project is based on this exact mechanism.
## Dependency Injection

Dependency Injection is a specific form of Inversion of Control. As the name suggests, Dependency Injection is about dependencies. Class `A` is dependent on another class `B` if class `A` calls a method of `B`. In program code, this dependency is often expressed as an attribute of type `B` in class `A`:

```java
class GreetingService {
  UserDatabase userDatabase = new UserDatabase();

  String greet(Integer userId){
    User user = userDatabase.findUser(userId);
    return "Hello " + user.getName();
  }
}
```

In this example, the `GreetingService` requires an object of type `UserDatabase` to do its work. When we instantiate an object of type `GreetingService`, it automatically creates an object of type `UserDatabase`.

The `GreetingService` class is responsible for resolving the dependency on `UserDatabase`. This is problematic due to several reasons.

First, this solution creates a very strong coupling between the two classes. `GreetingService` must know how to create a `UserDatabase` object. What if creating a `UserDatabase` object is not that simple? To open a database connection, we usually require a few parameters:

```java
class GreetingService {

  UserDatabase userDatabase;

  public GreetingService(
    String dbUrl,  
    Integer dbPort
  ){
      this.userDatabase = new UserDatabase(dbUrl, dbPort);
  }

  String greet(Integer userId){
    User user = userDatabase.findUser(userId);
    return "Hello " + user.getName();
  }
}
```

The `GreetingService` still creates its own instance of type `UserDatabase`, but now it needs to know which parameters are required for a database connection. The coupling between `GreetingService` and `UserDatabase` has just become even stronger. We don't want to see these details in the `GreetingService`!

What if other classes in our application also need a `UserDatabase` object? We don't want every class to know how to create a `UserDatabase` object!

Due to the strong coupling, details of the `UserDatabase` class are spread throughout the codebase. A change to `UserDatabase` would therefore lead to many changes in other parts of the code.

This not only makes it difficult to develop application code but also to write tests. If we want to test the `GreetingService` class, we need the URL and port of a real database in this example. If we pass invalid connection parameters, the `greet()` method no longer works!

To break the strong coupling between classes, we modify the code so that we can "inject" the dependency into the constructor:

```java
class GreetingService {

  final UserDatabase userDatabase;

  public GreetingService(UserDatabase userDatabase){
    this.userDatabase = userDatabase;
  }

  String greet(Integer userId){
    User user = userDatabase.findUser(userId);
    return "Hello " + user.getName();
  }
}
```

There is still a coupling between `GreetingService` and `UserDatabase`, but it is much looser than before because `GreetingService` no longer needs to know how a `UserDatabase` object is created. The coupling is reduced to the necessary minimum. This pattern is called "constructor injection" since we pass the dependencies of a class in the form of constructor parameters.

In a test, we can now create a mock object of type `UserDatabase` (for example, using a mock library like Mockito) and pass it to the `GreetingService`. Since we control the behavior of the mock, we no longer need a real database connection to test the `GreetingService` class.

In the application code, we instantiate the `UserDatabase` class only once and pass this instance to all the classes that need it. In other words, we "inject" the dependency to `UserDatabase` into the constructors of other classes.

This "injection" of dependencies can become cumbersome in a real application with hundreds of classes because we need to instantiate all classes in the correct order and explicitly program their dependencies. The result is a lot of "boilerplate" code that often changes and distracts us from the actual development.

This is where Dependency Injection comes into play. A Dependency Injection framework like Spring takes on the task of instantiating most of the classes in our application so that we don't have to worry about it anymore. It becomes clear that Dependency Injection is a form of Inversion of Control because we hand over control of object instantiation to the Dependency Injection framework.

The division of tasks between Spring and us as developers looks something like this:

1. We program the classes `GreetingService` and `UserDatabase`.
2. We express the dependency between the two classes through a parameter of type `UserDatabase` in the constructor of `GreetingService`.
3. We instruct Spring to take control over the classes `GreetingService` and `UserDatabase`.
4. Spring instantiates the classes in the correct order to resolve dependencies and creates an object network with an object for each passed class.
5. When we need an object of type `GreetingService` or `UserDatabase`, we ask Spring for that object.

In a real application, Spring manages not just two objects but a complex network of hundreds or thousands of objects. This network is referred to as the "application context" in Spring, as it forms the core of our application.

In the next section, we'll discuss how Spring's application context works.

## The Spring Application Context

The application context is the heart of an application that is based on the Spring Framework. It contains all the objects whose control we have delegated to Spring. For this reason, it is sometimes also referred to as the "IoC container" (IoC = "Inversion of Control") or the "Spring container".

The objects within the application context are called "beans." If you are not familiar with the Java world, the term "bean" might be somewhat confusing. We can derive the word like this:

- Spring is a framework for the Java programming language.
- Java is the name of an island in Indonesia where coffee is grown, and the type of coffee produced there is also called "Java."
- Coffee is made from coffee beans.
- In the Java community, it was decided to call certain objects in Java (the programming language) "Beans."

It's a bit far-fetched, but the term has become widely adopted, like it or not.

So, the application context is essentially a network of Java objects known as "beans." Spring instantiates these beans for us and resolves the dependencies between the beans through constructor injection.

But how does Spring know which beans it should create and manage within its application context? This is where the term "configuration" comes into play.

A configuration in the context of Spring is a definition of the beans required for our application. In the simplest case, this is just a list of classes. Spring takes these classes, instantiates them, and includes the resulting objects (beans) in the application context.

If the instantiation of the classes is not possible (for example, if a bean constructor expects another bean that is not part of the configuration), Spring halts the creation of the application context with an exception.

This is one of the advantages that Spring offers: a faulty configuration usually prevents the application from starting at all, thus avoiding potential runtime issues.

There are several ways to create a Spring configuration. In most use cases, it is convenient and practical to program the configuration in Java. However, in cases where the source code should be completely free from dependencies on the Spring Framework, configuring with XML can also be useful.

### Configuring an Application Context with XML

In the early days of Spring, the application context had to be configured with XML. XML configuration allows for complete separation of configuration from the code. The code doesn't need to be aware that it is managed by Spring.

An example XML configuration looks like this:

```xml
<?xml version="1.0" encoding="UTF-8"?> 
<beans> 
  <bean id="userDatabase" class="de.springboot3.xml.UserDatabase"/> 
  <bean id="greetingService" class="de.springboot3.xml.GreetingService"> 
      <constructor-arg ref="userDatabase"/> 
  </bean> 
</beans> 
```

In this configuration, the beans `userDatabase` and `greetingService` are defined. Each bean declaration provides instructions to Spring on how to instantiate that bean.

The class `UserDatabase` has a default constructor without parameters, so it is sufficient to provide Spring with the class name. The class `GreetingService` has a constructor parameter of type `UserDatabase`, so we refer to the previously declared `userDatabase` bean using the `constructor-ref` element.

With this XML declaration, we can now create an `ApplicationContext` object:

```java
public class XmlConfigMain { 
  public static void main(String[] args) { 
    
    ApplicationContext applicationContext = 
      new ClassPathXmlApplicationContext( 
        "application-context.xml"); 
    
    GreetingService greetingService =  
      applicationContext.getBean( 
        GreetingService.class); 
    
    System.out.println(greetingService.greet(1)); 
   } 
}
```

We pass the XML configuration to the constructor of `ClassPathXmlApplicationContext`, and Spring creates an `ApplicationContext` object for us.

This `ApplicationContext` now serves as our IoC container, and, via the method `getBean()` we can, for example, inquire about a bean of type `GreetingService` from it.

While the XML configuration in this example appears quite manageable, it can become more extensive in larger applications. For us as Java developers, it would be more convenient to manage such a comprehensive configuration in Java itself and take advantage of the Java compiler and IDE features.

### Java Configuration in Detail

XML configuration is now mostly used in exceptional cases and legacy applications, and configuration with Java has become the standard. Therefore, let's take a closer look at this approach, also known as "Java config".

#### `@Configuration` and `@Bean`

The core of a Java configuration is a Java class annotated with the Spring annotation `@Configuration`:

```java
@Configuration 
public class GreetingConfiguration {
	@Bean
	UserDatabase userDatabase() {
	    return new UserDatabase();
	}
	
	@Bean
	GreetingService greetingService(UserDatabase userDatabase) {
	    return new GreetingService(userDatabase);
	}
}
```

This configuration is equivalent to the XML configuration from the previous section. With the `@Configuration` annotation, we inform Spring that this class contributes to the application context. Without this annotation, Spring remains inactive.

A configuration class can declare factory methods like `userDatabase()` and `greetingService()`, each creating an object. With the `@Bean` annotation, we mark such factory methods. Spring finds these methods and calls them to create an `ApplicationContext`.

Dependencies between beans, such as the dependency of `GreetingService` on `UserDatabase`, are resolved through parameters of the factory methods. In our case, Spring first calls the method `userDatabase()` to create a `UserDatabase` bean and then passes it to the method `greetingService()` to create a `GreetingService` bean.

Using the `AnnotationConfigApplicationContext` class, we can then create an `ApplicationContext`:

```java
public class JavaConfigMain { 
  
  public static void main(String[] args) {  
    ApplicationContext applicationContext 
      = new AnnotationConfigApplicationContext(GreetingConfiguration.class);
    
    GreetingService greetingService 
      = applicationContext.getBean(GreetingService.class); 
    
    System.out.println(greetingService.greet(1));
  }
}
```

The constructor of `AnnotationConfigApplicationContext` allows us to pass multiple configuration classes instead of just one. This is helpful for larger applications because we can split the configuration of many beans into multiple configuration classes to maintain clarity.

#### `@Component` and `@ComponentScan`

Configuring hundreds or even thousands of beans via Java for a large application can become tedious. To simplify this, Spring offers the ability to "scan" for beans in the Java classpath.

This scanning is activated using the `@ComponentScan` annotation:

```java
@Configuration 
@ComponentScan("de.springboot3") 
public class GreetingScanConfiguration {
}
```

As before, we create a configuration class (annotated with `@Configuration`). However, instead of defining the beans ourselves as factory methods annotated with the `@Bean` annotation, we add the new `@ComponentScan` annotation.

With this annotation, we instruct Spring to scan the `de.springboot3` package for beans. If the scan finds a class annotated with `@Component`, it will create a bean from that class (i.e., the class will be instantiated and added to the Spring application context).

Therefore, we simply annotate all classes for which Spring should create a bean with the `@Component` annotation:

```java
@Component 
public class GreetingService {
	private final UserDatabase userDatabase;
	
	public GreetingService(UserDatabase userDatabase) {
	    this.userDatabase = userDatabase;
	}
}

@Component 
public class UserDatabase { 
  // ... 
}
```

As before, dependencies between beans are expressed through constructor parameters, and Spring resolves these automatically.

{{% info title="@Bean vs. @Component" %}}
The annotations `@Bean` and `@Component` express a similar concept: both mark a contribution to the Spring application context. This similarity can be confusing, especially at the beginning.

The Java compiler helps here a bit, as the `@Bean` annotation is only allowed on methods, and the `@Component` annotation is only allowed on classes. So, we cannot confuse them. However, we can still annotate methods and classes that Spring doesn't recognize!

Spring evaluates the `@Bean` annotation only within a `@Configuration` class, and the `@Component` annotation only on classes found by a component scan.
{{% /info %}}

#### Combining `@Configuration` and `@ComponentScan`

Spring does not dictate how we should configure the beans of our application. We can configure them using XML or Java config or even combine both approaches. We can also combine explicit bean definitions using `@Bean` methods with a scan using `@ComponentScan`:

```java
@Configuration 
@ComponentScan("de.springboot3.java.mixed") 
class MixedConfiguration {
	@Bean
	GreetingService greetingService(UserDatabase userDatabase) {
	    return new GreetingService(userDatabase);
	}
}

// no @Component annotation!
class GreetingService {...}

@Component 
class UserDatabase {...}
```

In this configuration, Spring creates a bean of type `UserDatabase` because the class is annotated with `@Component`, and a `@ComponentScan` is configured. On the other hand, the bean of type `GreetingService` is defined through the explicit `@Bean`-annotated factory method.

{{% info title="Modular Configuration" %}}
Configuring a larger application with hundreds of beans can quickly become confusing.

The explicit configuration using `@Bean` annotations has the advantage that the configuration of beans is bundled in a few `@Configuration` classes and is easy to understand.

The implicit configuration using `@ComponentScan` and `@Component` has the advantage that we don't need to define each bean ourselves, but it can be spread over many `@Component` annotations and, therefore, over the entire codebase, making it more challenging to grasp.

A proven principle is to design the Spring configuration along the architecture of the application. Each module of the application should reside in its own package and have its own `@Configuration` class. In this `@Configuration` class, we can either configure a `@ComponentScan` for the module package or use explicit configuration using `@Bean` methods. To bring the modules together into a complete application, we create a parent `@Configuration` class that defines a `@ComponentScan` for the main package. This scan will pick up all `@Configuration` classes in this and the sub-packages.
{{% /info %}}

#### What benefits does the Spring Container give us?

Now we know that Spring offers us an IoC container that instantiates and manages objects (beans) for us. This saves us from the burden of managing the lifecycle of these objects ourselves.

But that's just the beginning. Since Spring has control over all beans, it can perform many other tasks for us. For example, Spring can intercept calls to bean methods to start or commit a database transaction. We can also use Spring as an event bus. We send an event to the Spring container, and Spring forwards the event to all interested beans.

We will delve into these and many other features throughout the rest of the book. The foundation of all these features is the Spring programming model, whose core we have already learned in this chapter. This programming model is a combination of annotations, conventions, and interfaces that we can assemble into a complete application.

## Events

Since Spring manages all beans defined by us, the framework can send messages to these beans. We can use this to develop an event mechanism that loosely couples our components. This is just one of the benefits that the Spring container gives us.

### Loose Coupling

When a software component requires the functionality of another component, the two components are "coupled" together.

This coupling can vary. For example, a class may call a method of another class to access its functionality. This couples the two classes at compile time. We refer to this as "strong coupling."

The strength of the coupling also depends on how extensive and complicated the signature of the called method is – if it's a simple method without parameters, the coupling is not as strong as if the method expects a series of complex parameters. Once we make a change to the types of these parameters, we have to modify the code of both the calling and the called class.

Coupling is not inherently bad. Sometimes, two classes need to work very closely together to fulfill a function.

Most of the time, we want to design our code modularly. When working on a module, we don't want to have to think about all the other modules of the application. This is only possible if the dependencies between the modules are limited.

Loosely coupled modules allow for parallel development. Each module can be developed by a different developer or even team. This is not possible if the modules are heavily coupled because then the teams would step on each other's feet.

Let's take the example of a banking application that implements use cases from two different domains. The first module implements the "User" domain. It manages user data and serves as the single source of truth for this data. Another module implements the "Transactions" domain. This module implements functions related to money transfers.

Every time the "Transactions" module initiates a transfer, it needs to check whether the user initiating the transfer is locked or not. The transfer is only executed if the user is not locked.

The "Transactions" module could always directly call the "User" module before performing a transfer and ask if the user is locked or not. However, this would strongly couple the "Transactions" module to the "User" module. Whenever we make a change to the "User" module, we may also have to adjust the code in the "Transactions" module. Additionally, in the future, we may want to extract the "Transactions" module into its own (micro)service so that it can be released independently of the "User" module.

Events provide a solution to loosely couple both modules. Every time a new user is registered, locked, or unlocked, the "User" module sends an event. The "Transactions" module listens to these events and updates its own database with the current status of each respective user. Before performing a transfer, the "Transactions" module can now check its own database to see if the user is locked or not, instead of having to make a request to the user module. The data storage is completely decoupled from the "User" module.

Using this example, we want to explore how we can implement such an event mechanism with Spring and Spring Boot.

### Sending Events

The prerequisite for sending and receiving events with Spring is that both the sender and the receiver must be registered as beans in the `ApplicationContext`.

We can define the events themselves as simple Java classes or records. For example, we can write our user events as follows:

```java
public record UserCreatedEvent(User user) {}

public record UserLockedEvent(int userId) {}

public record UserUnlockedEvent(int userId) {}
```

To send such an event, we can use the `ApplicationEventPublisher` interface. Conveniently, Spring automatically provides a bean that implements this interface in the `ApplicationContext`. So we can simply inject it into our `UserService`:

```java
@Component
public class UserService {

    private final ApplicationEventPublisher applicationEventPublisher;

    public UserService(ApplicationEventPublisher applicationEventPublisher) {
        this.applicationEventPublisher = applicationEventPublisher;
    }

    public void createUser(User user) {
        // ... business logic omitted
        this.applicationEventPublisher.publishEvent(new UserCreatedEvent(user));
    }

    public void lockUser(int userId) {
        // ... business logic omitted
        this.applicationEventPublisher.publishEvent(new UserLockedEvent(userId));
    }

    public void unlockUser(int userId) {
        // ... business logic omitted
        this.applicationEventPublisher.publishEvent(new UserUnlockedEvent(userId));
    }
}
```

We simply call the `publishEvent()` method. That's all we need to do to send an event.

### Receiving Events

There are several ways to respond to events in Spring. We can implement the `ApplicationListener` interface or use the `@EventListener` annotation.

#### `ApplicationListener`

The conventional way to respond to an event in a Spring application is by implementing the `ApplicationListener` interface:

```java
@Component
public class UserCreatedEventListener implements ApplicationListener<UserCreatedApplicationEvent> {

    private static final Logger logger 
      = LoggerFactory.getLogger(UserCreatedEventListener.class);

    private final TransactionDatabase database;

    public UserCreatedEventListener(TransactionDatabase database) {
        this.database = database;
    }

    @Override
    public void onApplicationEvent(UserCreatedApplicationEvent event) {
        this.database.saveUser(new User(event.getUser().id(), User.UNLOCKED));
        logger.info("received event: {}", event);
    }
}
```

The `UserCreatedEventListener` class is part of the "Transactions" module. It has access to an object of type `TransactionDatabase`, which simulates the module's database.

We implement the `onApplicationEvent()` method, which, in our case, takes an object of type `UserCreatedApplicationEvent`. The event contains a `User` object. The listener takes the user's data that the "Transactions" module needs and saves it in the database. Users are unlocked by default, so we pass the `UNLOCKED` status.

Why do we use the event class `UserCreatedApplicationEvent` instead of the record `UserCreatedEvent` we learned about earlier?

Because Spring's `ApplicationListener` can only handle events of type `ApplicationEvent`. This means that every event we send must inherit from this class:

```java
public class UserCreatedApplicationEvent extends ApplicationEvent {

    private final User user;

    public UserCreatedApplicationEvent(Object source, User user) {
        super(source);
        this.user = user;
    }

    public User getUser() {
        return user;
    }
}
```

As we can see, it is somewhat cumbersome to receive events with an `ApplicationListener`. On the one hand, our event must inherit from the `ApplicationEvent` class, and on the other hand, we must implement the `ApplicationListener` interface, which can only respond to a single type of events. To receive other event types, we would have to write additional `ApplicationListener`s or implement a large if/else block in the `onApplicationEvent()` method.

The Spring team recognized this and added an annotation-based event mechanism to Spring.

#### `@EventListener`

To respond to an event, we can also use the `@EventListener` annotation. If Spring finds this annotation on a method of a bean registered in the `ApplicationContext`, Spring automatically sends all events of the corresponding type to this method.

```java
@Component
public class UserEventListener {

    private final TransactionDatabase database;

    public UserEventListener(TransactionDatabase database) {
        this.database = database;
    }

    @EventListener(UserCreatedEvent.class)
    public void onUserCreated(UserCreatedEvent event) {
        this.database.saveUser(new User(event.user().id(), User.UNLOCKED));
    }
}
```


The `UserEventListener` class is added to the Spring `ApplicationContext` using the `@Component `annotation. The `onUserCreated()` method is annotated with `@EventListener` and accepts an object of our simple record type `UserCreatedEvent`.

The event does not have to inherit from the `ApplicationEvent` type, as in the example with an `ApplicationListener`! Spring internally wraps our event in an `ApplicationEvent`, but we don't notice it. We can receive any type as an event, but immutable records are best suited for transporting events.

### Synchronous or asynchronous?

If we use events as shown in the examples, our "Users" and "Transactions" modules are decoupled at compile time. The only coupling between the modules are the event objects, which both modules must know.

But how are our modules coupled at runtime? What happens if our `EventListener` in the "Transactions" module produces an exception when receiving an event or takes a long time to process an event? Can and should we react to this in our "Users" module?

By default, the Spring Event mechanism works synchronously, as shown in the following diagram:

![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAcQAAACxCAYAAABax83ZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAADFeSURBVHhe7Z0HmBTF1oYPOQtiAAmSRTICIiA5gwpckogKigExYuAq/AIXJMgVkKtIEBADkpQgCChBREUREUUJChIVBCRJkMz89Z3pHoZheqZ3dmZ3dvd7n6d3tquqqyucrlOnqro6nccghBBCSBonvfVLCCGEpGmoEAkhhBADFSIhhBBioEIkhBBCDEEX1Rw+fETGjHlTzp49JxcucM1NrEiXzvRI0qeTBg3qSN26dSzX0LBuSFqEzwqJBuHkKKhCHDLkFWnTppPkynWF5UJiyZdfLpWMGc9Lx44dLRdnWDckLcNnhUQDJzkKOmR6+vQZClESUrduY9m2bZt1FhrWDUnL8Fkh0cBJjoIqRL6ZmLSgvDNlymSdhYZ1Q9IyfFZINHCSIy6qIYQQQgxUiIQQQoiBCpEQQggxUCESQgghBipEQgghxJAiFeI///wjmzZtkN27/5ALFy5YriQ5mDx5vLz55mjrjMQbbuonMXXI+iepiYgUYoMGN0vnzm2ss4vAfeDAPtZZbJg9e7pUqVJSmjW7VWrWLC+lSxeQr7/+wvKNDffc01batWtunaUMdu7cLsWKXSUtWtS1XGLD4sULZdGiedZZ7MsqVvG3bdtcihbNe9lx6tQpK0TS45+mUqXy6/M1fvzrlq87AusnGImpQzfxxyvJ2Y7Fq7y1aBF8F6CU2AZGQkQK8fz580EtMyf3aIH4X355gNxwQxmZN2+ZLFy4wlTU/ZI5c2YrRGy46aZqUq3aLdZZymDWrOlaXhs2/CS//LLRco090SyrDz+cJv/970vWmZdY1YXHc0Hy5csvo0aNv+SItWzZBMsr0nTddQVk2LDXpE2b9nLo0EEZPLivfPnlcitEbEiJ8h4JydWOgXiVN+Q9GAmRiWBxpxSSZMg01DeI4RfK3wZhVq5cIXv3/ikPPvioVK5cVcqXryT9+w81FVXDCnWRhMQbjmef7SO9ew+wzi7F6Xq3948FuC8UYvbs2fUcVnU43KTVTZholtXixQv08CeS+ANxCpc7dx6jeDpccqRP7/4RccpHIG7zCvLkuVLuvPMeeeWV0Zp3sHbtd/obCW7S51TGkebNBn6JjSM5iXbe4lHenEiITISKOzFptolGHE7EVCFinu+RR7pImTIFpWLFYvL668MtH2yrdEr69HlGKlUqLhUqFJUBA3pf0jt5/vkn5amnHpa3335TatQoZ3rJA+Wqq65Wv1WrVupvMCKJt2vXDvLii89ZIbysWLFMGjWqIX/+ucd3jc3Zs2dMAzVIateuLMWLXy3Vq5eRqVPfUb9w908Kvv32a/n9953Sr98QbVDnzJl5WY/XztO0ae9KvXpVtY4ef/wBOX78uBXCXZhAElJWH3wwVbp0aW86NkWkSpUb5NVXX1Z3MHLkULWEtm/fpvXQs2d3dQ8W/5Ah/bQuS5bMJy1b1rvMgrKvwfAehoRQN7jGLeHkw63MOd3fKa+BYGQEHD36t/52736v6RA+r/+Dw4cP6fXz5s2yXC6SmDoM9RzbhCrbSJ7JeCLa7Vg44kXe/HErE05xJzbNICnkKKYKsU+fp2XLls2msCaZCh5kCq+85SNa4R9/PMcU2PNy//3ddXJ+2jRvQwl27dqpcxOvvz7C9Jw6Sv36jaVcuYqmICrLlClvSbdunWTfvr1W6ItEEu+NN5aV6dPf8zU04P33J0vWrFl1yArX7Nq1w/Lx3gMCAMt0woT35dFHn5ZChQr7/ELdPymYNWua5MiRQ/PXqlU7LaeVxrr2B3n65JP5RgkNNUqktbG4q2lDOmHCxQUSbsIEkpCy+v771VK0aHEZPvwNqVWrjipELJQC9eo1NH4lJG/evKbhf0LzAQLj79u3l0ycOMZcX1cGDx5heoUXdL7jxx+/t0J4r1myZKE880wPTQfCjhv3mvzwwxorhJfTp0/Ltm2/+Y4TJ06oezj5cCNzoe7vlNdAUK8AlgTYsWOb/PHHLv0fnD9/zjxvv8iRI4ctFy8bN/6cqDoM9RyDX3/dGLJsI3km44lot2M28S5v/riVCae4E5tmkBRyFFOFiASiYGrXri8dO94tjRt7J2X/+mufWgcdOnQ2iu0RNcdLl8a84KU923Tp0sm7734oL7zQ32j8W9Vt+vR50qBBE1m69BOT4aqycOFH6g4ijfdf/7pTzpw5LQsWeOM6ePCAif9THaoKBPeYMWOKsXZKyqhR4zRP9933sNSt29D1/WPJyZMnTT7mml5WKx0ybd/+LnWfNWuG/vqTK1dumTt3qelZ9dNyxRA0eqL+uAnjRKiyAi+/PEoGDvyvSesd5kHorW4rLcVdteotUrjw9TqsBNlp2LCpuvtz4MB+bTiaNm1peqZjpVOne80D4l3gMWbMq/prg8UKo0dPkpdeesX0LIepm30vm+3btxqZquY77GGfUPLhts5D3T9UXg8c+Et7uk2a1NSybNbsNu0UJoTE1CFweo5tQuUt0mcynohFOwbiUd7c4lQmweKORpqTSo5iqhC7dn1Qh+/q1atitPk437Adehb4/6OPZulqURzofdjWgU3ZshWMVVjBOvOC3evffnumjBgxRjPfo8d9Mn/+bPWLNF70yMqUKeeba8MQY4YMGaR16/Z67o99j2BC5Pb+sQQWHYbDqlatLlu3btHyuvba/MZ9nr6u4g8Et0CBgtaZ6LzsunVr5dixo5aLuzBOhCorgCGQ2bNnaM/vpZf+T90wBOqW337bovFXr17LcvHOuZUqVVo2b/7FcvFSqVIV0+h4e4zXXHOt/p49e1Z/bUqUKCWrVm3wHehUgFDy4bbO3dw/GAcPHpRPP11gLIOCOl8+Zsxky8c9ialD4PQc24TKW6TPZDwRi3YMxKO8uSWcTPgTjTQnlRxFpBBheRw/fsw6u8jJk/9ItmzehRzgySd7ydixb+vcX//+L/jGoDGsBWrWrG0K9mE9+vYdIs89520UwwFFiJ7C/PmfScaMmXxzUomJF72y1au/MQX8u8ycOUWaN79dezmB2PfInj2H/vqT2HxFA6zwAr17P63Lx3Hs379XlSGUYihQrhiTDzUZ7SaMTaiyOnfunNx7bztd3p4lS5bLrA43oBcN/GUOZM2azfi5V6w22P0eisM+MERl4yQfsa7z0qVvlM8++1Z7vQ880MOkMfGrEBNSh8DpOXZDPDwTTiR3OxaP8uaWhMhENNKcVPmOSCEWLFhY5y/Qw7dBbxOmPSrWn9tua2NM/xWmgjvq+C/mN9CDx0N57Ngx6dy5q+9AmIRQosQNcv31RWTbti16nph4MS+DazFRi9cUgg2XgpIlvfdYunSR5XKRaOUrUjDhjiGGHj2ekm++We87Fi36UnuYwYZN/cG8W968V8kVV+S2XC7HTRibUGW1fPkS0yteqfMPffsOliZNWqq7fyONazEE7ASGYsGaNav0F0DxY86sWLESlkt0cJKPaNV5uLwGw3vfi1bewoXu3gdMSB3aBHuO3ZDcz0Qo4qUdC0Y8ylsgTjIRGHc00pxUchSRQkRBYMIXq9W++26VLgPHZCioV6+R/qJhw1DYsmWf6MQ/3qHKkyevZM6cRYfw2rXrJCtWLNX3Cn/9dZMusMCrAqFYsmSRzqds3Lhe43vvvUk6LNi160PqH2m8IH/+60zvo46xoj42D0ohndQNBt4dgrAiDY891k2HDTCOjdVRibl/NJgzx6vwunR5SPNgHxhCqFevsSpL/4VI69b9IG+8MVJXpI4aNUw2bVovd999v+XrxU0YJ0KXVT4Ng/L57LPFpqf3mJ77D3VWrHiT3hfK015w4E+hQtfrcCyGFLGy7Oeff5RevR5X67NLlwetUO7BUDM2efA/0DgCJ/mIVp2Hy2swsEBm/fp1Oo8+fPhgY20H7y0npg5DPcduSO5nIhTJ1Y7ZxKO8BUsT5u/8CScTgXFHI81JJkcmc5fRt+8gz65dRxyPHTsOebp1e8STPn16dOf1yJYtm2fIkJG+MDt3HvYYC8EXpkyZcp6JE6f6/Ddt2u0xvR5PxowZ1T9jxkyeOnUa+Pxr167vqVr1Ft85DmOie7Jnz+67p2lwPffc082zefNeX5hI4rWPESPG6DU9ez5/iXvgNRs3/u65/fZ/+fKGvPfq9aL6hbu/0zF8+HCr9EMTqm5Kly7jqVu3YVC/8ePf0/QYa0zPb721nscoFI8RXnU3vS9Pq1btLilLN2ECyyYhZdW27Z1aTjiMAvM0adJCwwwaNFz9v/nmZ0+5chXVDWkJFv/atZs99es31rQhXI4cOTz9+g3x+Qe7BvKLsM8809vnBn+4BR7jxr3jC+MkHwmVuWD3D5ZXXAM3O0zgsWDB5x5jJes1xtrxvPXWdP1/8OARvjCIq3z5ShHXYbjn2E3eEvNMBjui8azgSK52DAfc7Hv6H8ktbzgPPEaOHJsgmQgWdzTSnBRylA5/TOSX0K/fYHnoocetM2fQm9ixY6vO42H5vP8YuA1MZ/TCYC0EA4so9uzZrUMUbuZHkFz0SnBvTD7DjA5GQuONBAzPHT58UBc8GOGwXL0k9P4zZ06UZ5991jpzxm3dhOOuu1rLqVMnjVW5WK1GzKdgAY4/bsK4xams0LvMkiWrviaCut2z5w9TZoUuqVcMBWOxjGmsLJfLgTz8/ffhoHWRVERD5tzkNRBcg+X4wcAcWbp06bV8E1OH4Z5jN0TrmYz2s5Ic7Vg0SC55swlXJsHijkaaYylHiWo5cubMqUu4oZiCCRFAYYR6iJChIkWKuc4YGsrChYvoKiwnZQgSGm8koHHBPESwBjgp7h8tUD/hGkk3YULhVFaYy0JjDVCfCBNYr2jswz2wkEWnukgqolHnbvIaiJMyBDlz5vKVb2LqMNxz7IZ4fSaSox2LBtG4ZyTyZhOuTILFHY00RyMOJ5Kv9SDJCvYlvPnmy7e888dNGEIISS1QIaZR8GJrnz6htzZyE4YQQlILVIiEEEKIgQqREEIIMVAhxglBFvsSQoLAZ4VEg2By5KgQKXRJx8GD+yV3bve7hrBuSFqFzwqJBk5yFFQh1qlzqyxfvtg6I7Fk//59MnXqJOnatavlEhrWDUmr8Fkh0SCUHAV9MR/MmPGhbN261TojsSJPntzy0EMPCDb6dQvrhqRF+KyQaBBKjhwVYkrk66+/llq1Ln4KiJBoQxkjKRXKbnhS1aKab775xvqPkNhAGSMpFcpueLjKlBBCCDFQIRJCCCEGKkRCCCHEkKoUYs2aNa3/CIkNlDGSUqHshidVrTIlhBBCIoVDpoQQQoiBCpEQQggxUCESQgghhlSlELETAyGxhDJGUiqU3fCkKoXInRhIrKGMkZQKZTc8HDIlhBBCDFSIhBBCiIEKkRBCCDGkKoXInRhIrKGMkZQKZTc83Kkmgfz222+SI0cOue666yyXSwnnH4rEXJscnDx5UrJly2adJS/xlBZCSMqECjGBVKhQQerXry+vv/665XIpgf4jR46UEiVKSOvWrfU8FOHiHjZsmBw4cMA689KgQQNp2bKldZZ0bNy4UZ599llZtGiR5ZK8PPXUU1oWbdq0sVwIISRhcA4xxsyePTtq7/9MmDBBPvzwQ9m9e7fvOHr0qOUbG1avXq2HP6dPn1bFAwWUXASmq3379nLXXXeplU0IIZFAhRhjvvrqK7XsogWU0NSpU31Hp06dLJ/wRDIY0LNnTxkzZox15uV///ufnD17Vq0yfyIdbIhGuurUqaOW8nPPPWe5EEJIwkhVCtGNJdaqVSvp16+fdOvWTa688kq5/vrr5e2337Z8vQ3r6NGjrTNv449hTH/OnDnjeH0guN+gQYOsM5EFCxZI3bp1JUuWLFKoUCHZvHmz5ePl/Pnz2qjnz59fKleuLMuWLbN8nGnRooX07dvXOvPSuXNnn9vOnTulWbNmkj17dilWrJjMnTtX3QHSN2DAgKD3/Pe//y1r165VK7d06dIyZcoUdZ80aZI8/PDDmgfgFH9Sp+vJJ5+Ujz/+WPbu3avnsYC7fZCUCmU3PKlKIbrZiWH79u0yePBgyZQpk7z55ps6v9e9e3c5fvy4+m/duvWSeTr8v23bNuvMy8SJEx2vDwT327dvn/4PZXf//fdL2bJl5ddff5V33nlH8uXLp342GBZdv369Wj9QOFDe/uC6t956S4/p06er2y233CJvvPGGDmWCLVu2qF/Tpk3lwoULOn+JX1ird9xxh/To0UPDAaQPCjvYPRHuhhtu0E4ClA7iQ3gocSgiECr+pEwXQJpQxm46EZHC3T5ISoWyG540OWR69913y/jx46VDhw5qDcLiW7JkieUbnkivT58+vSrSNWvWyF9//SWNGjWS3LlzW75esDR6/vz50rZtW52n++GHHywfLzt27JAPPvhAD1hD4L777pMjR47InDlz9ByKGkoXCgPzbOvWrdN7QTHBDRYU3Gyc7gmrLWfOnHLNNdfIzTffLNdee63s2rVL/UqWLKm/oeJPynQBWJJYpQvLkxBCEkqaVIj+SghWBRTV999/b7mEJ9Lr06VLJ7NmzZJjx45J9erV1SqCYvSnUqVKqjRBsNcIMMSIlZ047KHCokWLSsOGDXUoE8pl8uTJarUCWznA8sQwJ4Yhy5Urd8nik3D39Ad5BbDEQKj4kzJdAHORsDgzZMhguRBCiHvSpEL0Z9OmTdqIYj7PBgtGbDB0F4pg14eiRo0a8ssvv8jMmTNl+fLl+lpGNMCcJoYKhw8fru/kdenSRd2LFCmiv71799bhR/to166dursB+bOBkgO24goXf1KlC+zZs0fvYaeREEISQqpSiG53YkADjeE3zA+ioYb1Yb8nWKpUKfn888916A7v2b3//vvq7k+o60OBxhrzj3/88YeuFs2TJ48OKSYEvGYBJW0fUAIAw4qwXF988UVdeWpbsdWqVdMFKa+88oosXrxYLTXkzR76DAfmSFetWuVLZ+HChTU+dARAuPiTKl0AacJcoz2nGAu42wdJqVB2w5OqFGKtWrWs/0IDBYahR8w9ffTRRzr0aO8OAyUI6+emm26Sn376SZ544gl19wdzVU7XY1gUh43/OeYahwwZotYRLErMp/Xv31/9QKhrbTDkWrx4cd9x++23q3vWrFn1PTzwyCOP6C/ImDGjzuEhfUgz8g5l/OOPP6p/uHs++uijmm7M12HoE/Tp00fnTg8dOhQ2/qRKF4ZLBw4cqO5Y/esPFjWhY5PQzkcw3MoYIfEGZTc8aW6nGns3GLxOgRfbCxQocNmcE4ZMMc+XN29ey+Uif//9t1ohmTNndrw+HGiYMRd3xRVXWC5JA6zLEydO+JS3WyAisGr98/qf//xH/vzzT11cZBNp/NFIFzolM2bM0EU4weoDK+weeOABndPEsC3mcAkhxJ80qxCdtkcj7sFwcby8CD9u3Dhd/ZsrVy7L5XIwZwtliLlHWNf4HyuFMXRNCCFpTiHinTYsukiO/T9J8gOl2LVrVx1+LViwoOzfv1+aN29Oq5EQkroUInZi4Dg5CYetFO3VxBhyxWsksC7DWY2UMZJSoeyGJ1UpxITOQRHiD+aFsVAHL/1jEwFsM+cWzKcSEs+MGDFCFw0SZ1KVQmSFEzdggQ220MOrHqdOnVI3LHKChQgliD1RYSGig+VG0bkNR0hywvYxPGn+xXyStrCV4T///KPKEIqwSpUqMm3aNN0wAfulcpENIWkTKkSSZoAyhAWI1zzwhQ1sEr5hwwbfF0gIIWmbNLlTDUl7QBliGzm8doMvbtAaJGkNto/hSXOvXZC0B3aqWbp0qdx2220JUoCcQyQkbUGFSIgDVIiEpC04h0gIIYQYqBAJIYQQQ6pSiNiJgRBCyOWwfQxPqlKIWElICCHkctg+hodDpoQQQoiBCpEQQggxUCESQgghhlSlELkTAyFpk8OHD+s2fIGcPHnS+i/5Se60sH0MT6pSiPzWF0mtYJs57Lnqz9q1a+XFF1+0zqLPsWPHZOjQodKpUydp0KCBboo+aNAg2b59uxUifvjggw+kfPny4r/PyMaNG6Vt27bWWfLzwgsvyNy5c62zpIftY3g4ZEpICuC1116Tzz//3DrzAovof//7n3UWXbDXa8WKFWXYsGFy7bXXyu233y6ZMmWSMWPGyJo1a6xQ0WP16tV6RAt82qtNmzaqyJOLwDy1b99e7rrrLvntt98sFxJvUCESkoZwu1Njz5495dChQ/ruGpQxvqOHjyb/8ccfcscdd1ihnEnojpC4H5RtMCLZXRIdhbNnz8pTTz1luXiJdKfKSK4LzFOdOnWkZcuW8txzz1kuJN6gQiQkCYAiwfBd3rx59YC1sGfPHstXpFWrVjJgwABtLPPnzy+VK1eWZcuWWb7usD9jlSVLFilUqJBs3rzZ8hHZuXOnNGvWTD97VaxYsUuG7nBvDL3i01g5c+aU5cuXy6effiqPP/64lC1b1grlBd+PzJo1q/4feB2GUkPdB8OtNWrU0OsrVaqkG66Df//73zr8O3v2bCldurRMmTJF3UPFtWvXLmnSpIn6IY1LliyxfLxMmjRJHn74YS0L4BRXixYtpG/fvvq/DfJju4UrN6c6c8oTPj798ccfy969e/WcxBmm55NqWLlypfUfIYnHNHLWf6EJF+7cuXOem266yVOmTBmPaVA9c+bM0f+rVq3qOX/+vIYpX768J2PGjB7T+HpmzZrlqV69uqdWrVrqB3Lnzu0xDa915uXdd9/1GEWk/+Me11xzjad79+4eo5g8Rtl4jhw5on64h1FAnsaNG3vWrFnjeeKJJy5JM+6dLl06T5cuXTymsdb7o2lYvHixFSI4gdcdP3485H2GDh3q+fDDDz0bNmzw1K5d29OgQQN137Ztm6dChQoeYz15Vq9e7dm3b1/INF+4cEHLE/dHGo0S8lSsWFHTDD/Eh/+RDxAqrv79+3uuvPJKz6lTp/TcdCI0T1988YWrcnOqs2B5An/++aemzShIPU9K2D6GJ1VZiNyJgcQjpjGVH374QYfQWrdurXNbsBS+//57tSJssApw/vz5akkiDK5xCyw3zPHhXn/99Zc0atRIjBJVP8xjrVu3Tt0wt4ahO1gocLOBFfTOO+/oJ7KMIlU3WLLh8L/u559/DnkfLCpp166dFClSRP2QVgDLCxamUehy880365xlqDSjzOzyhJXYsGFDeeyxxzQuAOsRlCxZUn9DxXXfffdpfk0nRcNiWBgWJ8K4KTenOguWJ2AUquTIkUMtz6SG7WN4OGRKSIzZsWOH/larVk1/gf2/7QeMNaJKDWTLlk1/bTJkyHDZsn1jwagiBMaqEWOl6MpQY6noPB8UI7Ab3wkTJugwIob5ypUrd8niDlt5gKJFi+qvf9qc8L8u3H3Gjh0r119/vZQoUUJmzJihbk6EistYX+pXpUoV/Q3ELhOUDwgVF/IKhYohVii9yZMni7GyNbybcgtVZ8EwRogYK1brk8QfVIiExJgCBQror/97crCmQMGCBfU3HAj31VdfWWde8A1GWBw2mJ/D6tCZM2fqPODIkSPVHRYZ6N27t6xfv953wFoLBlaXonGHAksIoe6zYsUKefTRR6V///5qZfXo0UPD+gNFYRMqrhtvvFH9/F//wAIaG1uh24orXP67deumc3/Dhw/XTkeXLl3UPaHlFgz/PAHMG+MedhpJfEGFSEiMgcVWvHhxHY7Du3EYcsP/sK6crJxAGjduLD/99JMOT544cUK++OILtWYwjAfQyE6cOFEX7+BVgzx58viGPmGNYsHHK6+8IosXL1ZLCGmwhxYDufrqq+X5559XJdG1a1e1FE+dOqWLYHr16qX3Dkao++DFeYC4v/zyS/noo4/kn3/+UYsWwGpctWqVqzRXqFBBLc1XX31VV8GiTJBem8KFC+u1mzZt0vNw+cdwJ4aXsUAI71zaQ80JLbdAAvMEkCYs9GnatKnlQuIK71Ri6oCTxiSa+C+gCIWbcD/++KOnXLlyuqACBxZrmMbV8vXoAgws2rAZNWqUJ3v27NaZx3Po0CFPixYt9Nr06dPrb82aNT27d+9Wf9PoeooVK6YLQkyD62nSpIku4LDBQpt69erpdQiDhSRGKalf4L0BFpQYheO54oorfGnG/82bN/esXbtWwwS7zuk+xoLzNGrUyBfP4MGDNX/G2tPrjGLzGItMF6kYxa5uodI8depUj7Fi1c8oHo9R1Po/FtUAYyXrIqODBw/qeai4gLFY1Q8LYPxJSLkF1llgnpA204HxPP3001aIpIXtY3jS4Y+pbEJIANddd50OS4bDbTiAeT3McV111VWWS8LYv3+/zm3hnhhGNY205eMF1gjiN0rHcrmUo0ePqoWJ692A5gH3wzVlypTxzc+Fw+k+SD8W6xglodYh4rfTiv9h4WKI2X+OzSmuM2fOyIEDB3xD0oH85z//0XoZP3685ZLw/NtEep1/nvDqBeZOsQjH7Rzivn371DLHoiVY/SS2UCES4gAav2grRJK0YF4wXl6EHzdunNx9992SK1cuy8UdWB2KeU0s4EFeMFdMYgMVIiEOUCGSeAFzpXfeeaeunMXoAvaVxWIgWo3RhYtqCCEkzsHG3BhuxYIcDBPD8sXiIux4hIU7JDqkKoWIXhQhhKRGoBTff/993foOA3vnzp2TlStXSocOHVQ54jUb/xWtgbB9DE+qGjIdMWKEbkJMSDRIyJApIckFFjrhtR68d4kFSpirxH6sbuFw/0WoEAlxgHOIJN4YOHCgb8OEfPny6cpfvBeJVbv33HOPWouYV6TsRgbnEAkhJAVgK0O88I89VLEZAxbYYIMC7AT00EMPcZFNIqFCJISQOOeNN97QnYjw/iIOfLbq22+/ldGjR+tOSCQ6pCqFiF4TIYSkJvAeIhQivr+I7yvSGowdqUohYhUWIYSkFrBTDb7ugRWitAZjD4dMCSEkTsHCGexuQ2swaaBCJIQQQgxUiIQQQoghVSlE7sRA4h3sJILdRjA3RAiJL1KVQsRqLELikU8++URatmypK6Gxqwjmhggh8QWHTAmJEYcOHdIvzJcqVUq/TICvpb/11lt8PYiQOIUKkZAoA2uwcePGUr58ef0o7IULFyR37twydepUKkNC4hgqREKiQKA1uGHDBt/X4DNnzkzLkJAUQKpSiGxwSHKBr5jDGgT+++UfP35cdxXBgi9spIwN6AF+ec7zWJ0DnIc7yKXwi/mEOIAGw+0XAzA/+MEHH6hShBLMlSuXbNmyRYdL8SWCSZMmSdOmTa0rCCHxCBUiIQ4kRCH6h1u9erW8++678umnn0qhQoVk9+7d+mUCKkVC4hsqREIciFQh2uCdQ9tqxMdb8ZUCzCViwQ0hJP6gQiTEgcQqRH9sq/Gzzz5TS5Hz3YTEH6lqUQ13qiHxCr5SgK8VQEbx9QLuVEOSGraP4UlVCpE71ZB4B18twNcLuFMNSWrYPoaH7yESQgghBipEQgghxJBmFSK/OkAIIcSfVKUQ3azc41cHCCFpEa5sDk+aeO0C+0wOHTpU5s6dKydOnJAsWbJwo2USlmi+dkEIiX9S9ZApvzpACCHELalOIfKrA4QQQiIhVSnE5cuX86sDPI/qOf4PdxBCUgepag4Ryq5s2bL86gCJGZCxWrVqWWeEpBwou+FJVRYidmLATiCwBFesWCFjx47V+cPs2bPLjTfeKNmyZZMHHnhAFi9ebF1BSMLgbh8kpULZDU+qXlRj7x/53XffSefOnXV4C5bigw8+KEuXLrVCEUIIIalcIdr4W41z5syRVq1ayZNPPskeEyGEEB9pQiH6w68OEEIICUaqUogJeZ2CXx0gkcBXdkhKhbIbHn4gmBBCCDGkuSFTQgghJBhUiIQQQoiBCpEQQggxpCqFiJWjhMQSyhhJqVB2w5OqFCLfKySxhjJGUiqU3fBwyJQQQggxUCESQgghBipEQgghxJCqFCJ3YiCxhjJGUiqU3fAE3anmyJG/ZezYN+XMmXOXfGSXRJ/06dNJgwa1pU6dOpZLaFg3JK3CZ4VEg1ByFFQhDh06XFq3vlNy5brCciGx5KuvlkqGDOelY8eOloszrBuSluGzQqKBkxwFHTI9deoMhSgJqVOniX55ww2sG5KW4bNCooGTHAVViBxeSFpQ3pkyZbLOQsO6IWkZPiskGjjJEVeZEkIIIQYqREIIIcRAhUgIIYQYqBAJIYQQAxUiIYQQYkiRCvGff/6RTZs2yO7df8iFCxcsV5IcTJ48Xt58c7R1RuINN/WTmDpk/ZPUREQKsUGDm6Vz5zbW2UXgPnBgH+ssNsyePV2qVCkpzZrdKjVrlpfSpQvI119/YfnGhnvuaSvt2jW3zlIGO3dul2LFrpIWLepaLrFh8eKFsmjRPOss9mUVq/jbtm0uRYvmvew4deqUFSLp8U9TqVL59fkaP/51y9cdgfUTjMTUoZv445XkbMfiVd5atAi+C1BKbAMjISKFeP78+aCWmZN7tED8L788QG64oYzMm7dMFi5cYSrqfsmcObMVIjbcdFM1qVbtFussZTBr1nQtrw0bfpJfftloucaeaJbVhx9Ok//+9yXrzEus6sLjuSD58uWXUaPGX3LEWrZsguUVabruugIybNhr0qZNezl06KAMHtxXvvxyuRUiNqREeY+E5GrHQLzKG/IejITIRLC4UwpJMmQa6gVZ+Ll5gRZhVq5cIXv3/ikPPvioVK5cVcqXryT9+w81FVXDCnWRhMQbjmef7SO9ew+wzi7F6Xq3948FuC8UYvbs2fUcVnU43KTVTZholtXixQv08CeS+ANxCpc7dx6jeDpccqRP7/4RccpHIG7zCvLkuVLuvPMeeeWV0Zp3sHbtd/obCW7S51TGkebNBn6JjSM5iXbe4lHenEiITISKOzFptolGHE7EVCFinu+RR7pImTIFpWLFYvL668MtH5HTp09Jnz7PSKVKxaVChaIyYEDvS3onzz//pDz11MPy9ttvSo0a5UwveaBcddXV6rdq1Ur9DUYk8Xbt2kFefPE5K4SXFSuWSaNGNeTPP/f4rrE5e/aMaaAGSe3alaV48aulevUyMnXqO+oX7v5Jwbfffi2//75T+vUbog3qnDkzL+vx2nmaNu1dqVevqtbR448/IMePH7dCuAsTSELK6oMPpkqXLu1Nx6aIVKlyg7z66svqDkaOHKqW0Pbt27Qeevbsru7B4h8ypJ/WZcmS+aRly3qXWVD2NRjew5AQ6gbXuCWcfLiVOaf7O+U1EIyMgKNH/9bf7t3vNR3C5/V/cPjwIb1+3rxZlstFElOHoZ5jm1BlG8kzGU9Eux0LR7zImz9uZcIp7sSmGSSFHMVUIfbp87Rs2bLZFNYkU8GDTOGVt3xEK/zjj+eYAnte7r+/u07OT5vmbSjBrl07dW7i9ddHmJ5TR6lfv7GUK1fRFERlmTLlLenWrZPs27fXCn2RSOK98cayMn36e76GBrz//mTJmjWrDlnhml27dlg+3ntAAGCZTpjwvjz66NNSqFBhn1+o+ycFs2ZNkxw5cmj+WrVqp+W00ljX/iBPn3wy3yihoUaJtDYWdzVtSCdMuLhAwk2YQBJSVt9/v1qKFi0uw4e/IbVq1VGFiIVSoF69hsavhOTNm9c0/E9oPkBg/H379pKJE8eY6+vK4MEjTK/wgs53/Pjj91YI7zVLliyUZ57poelA2HHjXpMfflhjhfBy+vRp2bbtN99x4sQJdQ8nH25kLtT9nfIaCOoVwJIAO3Zskz/+2KX/g/Pnz5nn7Rc5cuSw5eJl48afE1WHoZ5j8OuvG0OWbSTPZDwR7XbMJt7lzR+3MuEUd2LTDJJCjmKqEJFAFEzt2vWlY8e7pXFj76TsX3/tU+ugQ4fORrE9ouZ46dKYF7y0Z5suXTp5990P5YUX+huNf6u6TZ8+Txo0aCJLl35iMlxVFi78SN1BpPH+6193ypkzp2XBAm9cBw8eMPF/qkNVgeAeM2ZMMdZOSRk1apzm6b77Hpa6dRu6vn8sOXnypMnHXNPLaqVDpu3b36Xus2bN0F9/cuXKLXPnLjU9q35arhiCRk/UHzdhnAhVVuDll0fJwIH/NWm9wzwIvdVtpaW4q1a9RQoXvl6HlSA7DRs2VXd/DhzYrw1H06YtTc90rHTqdK95QLwLPMaMeVV/bbBYYfToSfLSS6+YnuUwdbPvZbN9+1YjU9V8hz3sE0o+3NZ5qPuHyuuBA39pT7dJk5pals2a3aadwoSQmDoETs+xTai8RfpMxhOxaMdAPMqbW5zKJFjc0UhzUslRTBVi164P6vBdvXpVjDYf5xu2Q88C/3/00SxdLYoDvQ/bOrApW7aCsQorWGdesHv922/PlBEjxmjme/S4T+bPn61+kcaLHlmZMuV8c20YYsyQIYO0bt1ez/2x7xFMiNzeP5bAosNwWNWq1WXr1i1aXtdem9+4z9PXVfyB4BYoUNA6E52XXbdurRw7dtRycRfGiVBlBTAEMnv2DO35vfTS/6kbhkDd8ttvWzT+6tVrWS7eObdSpUrL5s2/WC5eKlWqYhodb4/xmmuu1d+zZ8/qr02JEqVk1aoNvgOdChBKPtzWuZv7B+PgwYPy6acLjGVQUOfLx4yZbPm4JzF1CJyeY5tQeYv0mYwnYtGOgXiUN7eEkwl/opHmpJKjiBQiLI/jx49ZZxc5efIfyZbNu5ADPPlkLxk79m2d++vf/wXfGDSGtUDNmrVNwT6sR9++Q+S557yNYjigCNFTmD//M8mYMZNvTiox8aJXtnr1N6aAf5eZM6dI8+a3ay8nEPse2bPn0F9/EpuvaIAVXqB376d1+TiO/fv3qjKEUgwFyhVj8qEmo92EsQlVVufOnZN7722ny9uzZMlymdXhBvSigb/MgaxZsxk/94rVBrvfQ3HYB4aobJzkI9Z1Xrr0jfLZZ99qr/eBB3qYNCZ+FWJC6hA4PcduiIdnwonkbsfiUd7ckhCZiEaakyrfESnEggUL6/wFevg26G3CtEfF+nPbbW2M6b/CVHBHHf/F/AZ68Hgojx07Jp07d/UdCJMQSpS4Qa6/vohs27ZFzxMTL+ZlcC0mavGaQrDhUlCypPceS5cuslwuEq18RQom3DHE0KPHU/LNN+t9x6JFX2oPM9iwqT+Yd8ub9yq54orclsvluAljE6qsli9fYnrFK3X+oW/fwdKkSUt192+kcS2GgJ3AUCxYs2aV/gIofsyZFStWwnKJDk7yEa06D5fXYHjve9HKW7jQ3fuACalDm2DPsRuS+5kIRby0Y8GIR3kLxEkmAuOORpqTSo4iUogoCEz4YrXad9+t0mXgmAwF9eo10l80bBgKW7bsE534xztUefLklcyZs+gQXrt2nWTFiqX6XuGvv27SBRZ4VSAUS5Ys0vmUjRvXa3zvvTdJhwW7dn1I/SONF+TPf53pfdQxVtTH5kEppJO6wcC7QxBWpOGxx7rpsAHGsbE6KjH3jwZz5ngVXpcuD2ke7ANDCPXqNVZl6b8Qad26H+SNN0bqitRRo4bJpk3r5e6777d8vbgJ40TossqnYVA+n3222PT0HtNz/6HOihVv0vtCedoLDvwpVOh6HY7FkCJWlv3884/Sq9fjan126fKgFco9GGrGJg/+BxpH4CQf0arzcHkNBhbIrF+/TufRhw8fbKzt4L3lxNRhqOfYDcn9TIQiudoxm3iUt2BpwvydP+FkIjDuaKQ5yeTIZO4y+vYd5Nm164jjsWPHIU+3bo940qdPj+68HtmyZfMMGTLSF2bnzsMeYyH4wpQpU84zceJUn/+mTbs9ptfjyZgxo/pnzJjJU6dOA59/7dr1PVWr3uI7x2FMdE/27Nl99zQNrueee7p5Nm/e6wsTSbz2MWLEGL2mZ8/nL3EPvGbjxt89t9/+L1/ekPdevV5Uv3D3dzqGDx9ulX5oQtVN6dJlPHXrNgzqN378e5oeY43p+a231vMYheIxwqvupvfladWq3SVl6SZMYNkkpKzatr1TywmHUWCeJk1aaJhBg4ar/zff/OwpV66iuiEtweJfu3azp379xpo2hMuRI4enX78hPv9g10B+EfaZZ3r73OAPt8Bj3Lh3fGGc5COhMhfs/sHyimvgZocJPBYs+NxjrGS9xlg7nrfemq7/Dx48whcGcZUvXyniOgz3HLvJW2KeyWBHNJ4VHMnVjuGAm31P/yO55Q3ngcfIkWMTJBPB4o5GmpNCjtLhj4n8Evr1GywPPfS4deYMehM7dmzVeTwsn/cfA7eB6YxeGKyFYGARxZ49u3WIws38CJKLXgnujclnmNHBSGi8kYDhucOHD+qCByMclquXhN5/5syJ8uyzz1pnzritm3DcdVdrOXXqpLEqF6vViPkULMDxx00YtziVFXqXWbJk1ddEULd79vxhyqzQJfWKoWAsljGNleVyOZCHv/8+HLQukopoyJybvAaCa7AcPxiYI0uXLr2Wb2LqMNxz7IZoPZPRflaSox2LBsklbzbhyiRY3NFIcyzlKFEtR86cOXUJNxRTMCECKIxQDxEyVKRIMdcZQ0NZuHARXYXlpAxBQuONBDQumIcI1gAnxf2jBeonXCPpJkwonMoKc1lorAHqE2EC6xWNfbgHFrLoVBdJRTTq3E1eA3FShiBnzly+8k1MHYZ7jt0Qr89EcrRj0SAa94xE3mzClUmwuKOR5mjE4UTytR4kWcG+hDfffPmWd/64CUMIIakFKsQ0Cl5s7dMn9NZGbsIQQkhqgQqREEIIMVAhEkIIIQYqREIIIcQQVCGGWr1Jok/69O7Lm3VD0jJ8Vkg0cJKjoAoxe/YsuoURSRpWrlwmJUq422qMdUPSMnxWSDRwkqOgL+YfPXpUxo+fIGfOnNOXpUnsQE+lbt1bpXbt2pZLaFg3JK3CZ4VEg1ByFFQhEkIIIWkNLqohhBBCDFSIhBBCiIEKkRBCCBGR/weRMyM/lhxUPAAAAABJRU5ErkJggg==)

The `UserService` sends an event to the `ApplicationEventPublisher`. This knows which event listeners are interested in the event, and calls them one after the other (in our case, it calls only the `UserEventListener`). Only when the `onUserCreated()` method has completed its processing does the control flow return to the `UserService`. The processing takes place synchronously.

This means that if the `UserEventListener.onUserCreated()` method throws an exception, it arrives in the `UserService` and interrupts the processing there. Or if the method takes a long time, the control flow in the `UserService` is interrupted for that long.

So our modules are not as decoupled as we had hoped! We have to adapt our exception handling and make our code more robust so that it can handle long waiting times if necessary.

Can we also process events asynchronously to reduce this coupling, as shown in the following sequence diagram?

![](data:image/png;base64,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)

The short answer is "yes." We can simply annotate the listener method with the `@Async` annotation:

```java
@Component
public class UserEventListener {

    @Async
    @EventListener(UserCreatedEvent.class)
    public void onUserCreated(UserCreatedEvent event) {
        // …
    }
}
```

This prompts Spring to return control flow directly to the caller and execute the method in a separate thread in the background.

For the `@Async` annotation to take effect, we must first activate it. We do this using the `@EnableAsync` annotation on one of our `@Configuration` classes.

Since events are now processed asynchronously, exceptions in the event listener are no longer forwarded to the sender of the event. Depending on the use case, this may be desired or undesired.

We should be aware that decoupling using the `@Async` annotation only scales to a limited extent. If we process a large number of events, they will accumulate in Spring's internal thread pool and be processed one after the other. In synchronous event processing, scaling problems become apparent more quickly, as the entire processing chain slows down instead of just the event processing.

### Spring Boot's Application Events

During the lifecycle of an application, Spring Boot sends some events that we can respond to. Most of these events are very technical and are rarely relevant to us as application developers. The following table briefly lists these events in chronological order:

| Event                               | Description                                                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ApplicationStartingEvent            | The application is currently starting, but the `Environment` and `ApplicationContext` are not yet available.                                                           |
| ApplicationEnvironmentPreparedEvent | The application is currently starting, and the Spring `Environment` is available.                                                                                    |
| ApplicationContextInitializedEvent  | The application is currently starting, and the Spring `ApplicationContext` is available.                                                                             |
| ApplicationPreparedEvent            | A combination of the previous two events. The `ApplicationContext` and `Environment` are available.                                                               |
| ContextRefreshedEvent               | The `ApplicationContext` has been updated. This happens when the `ApplicationContext` starts and when it is reloaded (for example, after a configuration change). |
| WebServerInitializedEvent           | The embedded web server (Tomcat by default) has started.                                                                                                      |
| ApplicationStartedEvent             | The application has started, but no `ApplicationRunners` and `CommandLineRunners` have been executed yet.                                                         |
| ApplicationReadyEvent               | The application is fully started.                                                                                                                             |
| ApplicationFailedEvent              | The application did not start due to an error.                                                                                                                |
|                                     |                                                                                                                                                               |

The most relevant event for us is probably the `ApplicationReadyEvent`, as it is fired when the application is ready to work. We can use it, for example, to activate certain components in our application.

If our application processes messages from a queue, for example, we want to make sure that our application is also ready to process these messages. This is the case as soon as we have received the `ApplicationReadyEvent`.

We cannot react to some of the earlier events from the table in the "normal" way, as they are fired very early. If we want to react to these events, we must manually register an `ApplicationListener`:

```java
@SpringBootApplication
public class EventsApplication {

    public static void main(String[] args) {
        SpringApplication springApplication =
                new SpringApplication(EventsApplication.class);
        springApplication.addListeners(new MyApplicationListener());
        springApplication.run(args);
    }
}
```

