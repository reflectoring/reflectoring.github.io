---
authors: [tom]
title: Executing Code on Spring Boot Application Startup
categories: ["Spring Boot"]
date: 2019-12-02T06:00:00
description: "Spring Boot offers many different solutions to run code at application startup. This article explains how they work and when to use which."
image:  images/stock/0039-start-1200x628-branded.jpg
url: spring-boot-execute-on-startup
---

Sometimes we just need to run a snippet of code on application startup, be it only to log that a certain bean has loaded or the application is ready to process requests.

Spring Boot offers at least 5 different ways of executing code on startup, so which one should we choose? This article gives an overview of those different ways and explains when to use which one.

Let's start by looking at some use cases, though. 

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/startup" %}}

## Why Would I Want to Execute Code at Startup?

The most critical use case of doing something at application startup is when we want our application to start processing certain data only when everything is set up to support that processing. 

Imagine our application is event-driven and pulls events from a queue, processes them, and then sends new events to another queue. In this case, we want the application to start pulling events from the source queue only if the connection to the target queue is ready to receive events. So we include some startup logic that activates the event processing once the connection to the target queue is ready.

In a more conventional setting, our application responds to HTTP requests, loads data from a database, and stores data back to the database. We want to start responding to HTTP requests only once the database connection is ready to do its work, otherwise, we would be serving responses with HTTP status 500 until the connection was ready.

**Spring Boot takes care of many of those scenarios automatically and will activate certain connections only when the application is "warm".**

For custom scenarios, though, we need a way to react to application startup with custom code. Spring and Spring Boot offer several ways of doing this.

Let's have a look at each of them in turn.

## `CommandLineRunner`

`CommandLineRunner` is a simple interface we can implement to execute some code after the Spring application has successfully started up:

```java
@Component
@Order(1)
class MyCommandLineRunner implements CommandLineRunner {

  private static final Logger logger = ...;

  @Override
  public void run(String... args) throws Exception {
  if(args.length > 0) {
    logger.info("first command-line parameter: '{}'", args[0]);
  }
  }

}
```

When Spring Boot finds a `CommandLineRunner` bean in the application context, it will call its `run()` method after the application has started up and pass in the command-line arguments with which the application has been started. 

We can now start the application with a command-line parameter like this:

```text
java -jar application.jar --foo=bar
```

This will produce the following log output:

```text
first command-line parameter: '--foo=bar'
```

As we can see, the parameter is not parsed but instead interpreted as a single parameter with the value `--foo=bar`. We'll later see how an `ApplicationRunner` parses arguments for us.

Note the `Exception` in the signature of `run()`. Even though we don't need to add it to the signature in our case, because we're not throwing an exception, it shows that Spring Boot will handle exceptions in our `CommandLineRunner`. **Spring Boot considers a `CommandLineRunner` to be part of the application startup and will abort the startup when it throws an exception**.

Several `CommandLineRunner`s can be put in order using the `@Order` annotation.

**When we want to access simple space-separated command-line parameters, a `CommandLineRunner` is the way to go.** 

<div class="notice success">
  <h4>Don't <code>@Order</code> too much!</h4>
  <p>
   While the <code>@Order</code> annotation is very convenient to put certain startup logic fragments into a sequence, it's also a sign that those startup fragments have a dependency on each other. We should strive to have as few dependencies as possible to create a maintainable codebase.   
  </p>
  <p>
  What's more, the <code>@Order</code> annotation creates a hard-to-understand <strong>logical dependency</strong> instead of an easy-to-catch compile-time dependency. Future you might wonder about the <code>@Order</code> annotation and delete it, causing Armageddon on the way. 
  </p>
</div>

## `ApplicationRunner`

We can use an `ApplicationRunner` instead if we want the command-line arguments parsed:

```java
@Component
@Order(2)
class MyApplicationRunner implements ApplicationRunner {

  private static final Logger logger = ...;

  @Override
  public void run(ApplicationArguments args) throws Exception {
  logger.info("ApplicationRunner#run()");
  logger.info("foo: {}", args.getOptionValues("foo"));
  }

}
```

The `ApplicationArguments` object gives us access to the parsed command-line arguments. Each argument can have multiple values because they might be used more than once in the command-line. We can get an array of the values for a specific parameter by calling `getOptionValues()`.

Let's start the application with the `foo` parameter again:
 
```text
java -jar application.jar --foo=bar
```

The resulting log output looks like this:

```text
foo: [bar]
```

As with `CommandLineRunner`, an exception in the `run()` method will abort application startup and several `ApplicationRunners` can be put in sequence using the `@Order` annotation. The sequence created by `@Order` is shared between `CommandLineRunner`s and `ApplicationRunner`s.

**We'll want to use an `ApplicationRunner` if we need to create some global startup logic with access to complex command-line arguments.**

## `ApplicationListener`

If we don't need access to command-line parameters, we can tie our startup logic to Spring's `ApplicationReadyEvent`:

```java
@Component
@Order(0)
class MyApplicationListener 
    implements ApplicationListener<ApplicationReadyEvent> {

  private static final Logger logger = ...;

  @Override
  public void onApplicationEvent(ApplicationReadyEvent event) {
    logger.info("ApplicationListener#onApplicationEvent()");
  }

}
```

The `ApplicationReadyEvent` is fired only after the application is ready (duh) so that  **the above listener will execute after all the other solutions described in this article have done their work**.

Multiple `ApplicationListeners` can be put in an order with the `@Order` annotation. The order sequence is shared only with other `ApplicationListener`s and not with `ApplicationRunner`s or `CommandLineRunner`s. 

**An `ApplicationListener` listening for the `ApplicationReadyEvent` is the way to go if we need to create some global startup logic without access to command-line parameters.** We can still access environment parameters by injecting them with Spring Boot's support for [configuration properties](/spring-boot-configuration-properties/).

## `@PostConstruct`

Another simple solution to create startup logic is by providing an initializing method that is called by Spring during bean creation. All we have to do is to add the `@PostConstruct` annotation to a method:

```java
@Component
@DependsOn("myApplicationListener")
class MyPostConstructBean {

  private static final Logger logger = ...;

  @PostConstruct
  void postConstruct(){
    logger.info("@PostConstruct");
  }

}
```

This method will be called by Spring once the bean of type `MyPostConstructBean` has been successfully instantiated.

The `@PostConstruct` method is called right after the bean has been created by Spring, so we cannot order it freely with the `@Order` annotation, as it may depend on other Spring beans that are `@Autowired` into our bean. 

Instead, it will be called after all beans it depends on have been initialized. If we want to add an artificial dependency, and thus create an order, we can use the `@DependsOn` annotation (same warnings apply as for the `@Order` annotation!).

**A `@PostConstruct` method is inherently tied to a specific Spring bean so it should be used for the initialization logic of this single bean only**. 

For global initialization logic, a `CommandLineRunner`, `ApplicationRunner`, or `ApplicationListener` provides a better solution.  

## `InitializingBean`

Very similar in effect to the `@PostConstruct` solution, we can implement the `InitializingBean` interface and let Spring call a certain initializing method:

```java
@Component
class MyInitializingBean implements InitializingBean {

  private static final Logger logger = ...;

  @Override
  public void afterPropertiesSet() throws Exception {
    logger.info("InitializingBean#afterPropertiesSet()");
  }

}
```

Spring will call the `afterPropertiesSet()` method during application startup. As the name suggests, we can be sure that all the properties of our bean have been populated by Spring. If we're using `@Autowired` on certain properties (which we shouldn't - we should use [constructor injection](/constructor-injection) instead), Spring will have injected beans into those properties before calling `afterPropertiesSet()` - same as with `@PostConstruct`. 

**With both `InitializingBean` and `@PostConstruct` we must be careful not to depend on state that has been initialized in the `afterPropertiesSet()` or `@PostConstruct` method of another bean. That state may not have been initialized yet and cause a `NullPointerException`**.

If possible, we should use [constructor injection](/constructor-injection) and initialize everything we need in the constructor, because that makes this kind of error impossible. 

## Conclusion

There are many ways of executing code during the startup of a Spring Boot application. Although they look similar, each one behaves slightly different or provides different features so they all have a right to exist.

We can influence the sequence of different startup beans with the `@Order` annotation but should only use this as a last resort, because it introduces a difficult-to-grasp logical dependency between those beans.

If you want to see all solutions at work, have a look at the [GitHub repository](https://github.com/thombergs/code-examples/tree/master/spring-boot/startup).
