---
title: Spring Boot Application Events Explained
categories: [spring-boot]
date: 2020-02-13 05:00:00 +1100
modified: 2020-02-13 05:00:00 +1100
author: default
excerpt: 'Spring Boot allows us to throw and listen to specific application events that we can process as we wish. Events are meant for exchanging information between loosely coupled components.'
image:
  auto: 0058-motorway-junction
---

To "listen" to an event, we can always write the listener as another method within the source of the event, but this will tightly couple the event source to the logic of the listener. 

With real events, we are more flexible than with direct method calls. We can dynamically register and deregister listeners to certain events as we wish. We can also have multiple listeners for the same event. 

This tutorial gives an overview of how to use publish and listen to custom events and explains Spring Boot's built-in events.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-events" %}

## What is an Application Event?

Spring application events allows us to throw and listen to specific application events that we can process as we wish. Events are meant for exchanging information between loosely coupled components. As there is no direct coupling between publishers and subscribers, it enables us to modify subscribers without affecting the publishers and vice-versa.

Let's see how we can create, publish and listen to custom events in a Spring Boot application.

## Creating an Application Event

We can publish application events using the Spring Framework’s event publishing mechanism. Prior to Spring 4.2, events had to extend `ApplicationEvent`. Note that in later versions, we can just publish any object as an event. 

Let's create a custom event called `UserCreatedEvent`:

```java
public class UserCreatedEvent extends ApplicationEvent {
	private String name;

	public UserCreatedEvent(String name) {
		super(name);
		this.name = name;
	}

	public String getName() {
		return this.name;
	}
}
```

## Publishing an Application Event

Spring gives the flexibility to publish an arbitrary event and doesn't force us to extend from `ApplicationEvent`. The `ApplicationEventPublisher` interface has been extended to allow you to publish any object. When this object is not an `ApplicationEvent`, Spring will wrap it in a `PayloadApplicationEvent` for us.

Now that we have a `UserCreatedEvent`. In order to publish it to its respective listeners, we need an `ApplicationEventPublisher`:

```java
@Component
public class Publisher {
	@Autowired
	private ApplicationEventPublisher publisher;

	public void publishEvent(final String name) {
		publisher.publishEvent(new UserCreatedEvent(name));
	}
}
```

## Listening to an Application Event

Now that we know how to create and publish a custom event, let's see how we can listen to the event. An event can have multiple listeners doing different work based on the application requirements. 

There are two ways to define a listener. We can either use the `@EventListener` annotation or implement the `ApplicationListener` interface. In either case, the listener class has to be managed by Spring.

### Annotation-Driven

Starting with Spring 4.1 it's now possible to simply annotate a method of a managed bean with `@EventListener` to automatically register an `ApplicationListener` matching the signature of the method. No additional configuration is necessary with annotation-driven configuration enabled:

```java
@EventListener
public void handleUserCreatedEvent(UserCreatedEvent event) {
	System.out.println("User created event triggered. Created user: " + event.getName());
}
```

For the methods annotated with `@EventListener` and defined as a non-void return type, Spring will send that result as a new event for us.

Spring allows our listener to be triggered only in certain circumstances if we specify a `condition`. The event will only be handled if the expression evaluates to `true` or one of the following strings: "true", "on", "yes", or "1". Method arguments are exposed via their names. The condition expression also exposes a “root” variable referring to the raw `ApplicationEvent` (`#root.event`) and the actual method arguments `(#root.args)`

### Implementing `ApplicationListener`

```java
@Component
public class UserCreatedListener implements ApplicationListener<UserCreatedEvent> {

	@Override
	public void onApplicationEvent(UserCreatedEvent event) {
		System.out.println("User created event triggered with ApplicationListener implemented listener. Created user: " + event.getName());
	}
}
```

### Asynchronous Event Listeners

**By default spring events are synchronous, meaning the publisher thread blocks until all listeners have finished processing the event.**
 
To make an event listener run in async mode, all we have to do is use the `@Async` annotation on that listener. To make the `@Async` annotation work, we also have to annotate one of our `@Configuration` classes or the `@SpringBootApplication` class with `@EnableAsync`.

## Transaction Bound Events

Spring allows us to bind an event listener to a phase of the current transaction. This allows events to be used with more flexibility when the outcome of the current transaction actually matters to the listener:

```java
@Component
public class MyComponent {

  @TransactionalEventListener
  public void handleUserCreatedEvent(UserCreatedEvent userEvent) {
    ...
  }
}
```

The transaction module implements an `EventListenerFactory` that looks for the new `@TransactionalEventListener` annotation. So when you annotate your method with `@TransactionalEventListener` an extended event listener that is aware of the transaction is registered instead of the default. You can bind the listener to the following phases of transaction: `AFTER_COMMIT`(default), `AFTER_ROLLBACK`, `BEFORE_COMMIT` and `AFTER_COMPLETION`.

## Spring Boot’s Application Events

Spring Boot provides a number of predefined `ApplicationEvent`s that are tied to the lifecycle of a `SpringApplication`.

Some events are actually triggered before the `ApplicationContext` is created, so we cannot register a listener on those as a `@Bean`. We can register listeners for these events by adding the listener manually: 

```java
@SpringBootApplication
public class EventsDemoApplication {

	public static void main(String[] args) {
		SpringApplication springApplication = new SpringApplication(EventsDemoApplication.class);
		springApplication.addListeners(new SpringBuiltInEventsListener());
		springApplication.run(args);
	}

}
```

We can also register our listeners regardless of how the application is created by adding a `META-INF/spring.factories` file to our project and reference our listener(s) by using the `org.springframework.context.ApplicationListener` key:

`org.springframework.context.ApplicationListener=com.reflectoring.eventdemo.MyListener`

Once we made sure that our event listener is registered properly, we can listen to all of Spring Boot's `SpringApplicationEvents`:

```java
public class SpringBuiltInEventsListener implements ApplicationListener<SpringApplicationEvent>{

	@Override
	public void onApplicationEvent(SpringApplicationEvent event) {
		System.out.println("SpringApplicationEvent Received - " + event);
	}
}
```

### ApplicationContextInitializedEvent

An `ApplicationContextInitializedEvent` is sent when the `ApplicationContext` is prepared and `ApplicationContextInitializers` have been called but before any bean definitions are loaded.

### ApplicationEnvironmentPreparedEvent

An `ApplicationEnvironmentPreparedEvent` is sent when the `Environment` to be used in the context is known but before the context is created.

### ApplicationFailedEvent

An `ApplicationFailedEvent` is sent if there is an exception on startup.

### ApplicationPreparedEvent

An `ApplicationPreparedEvent` is sent just before the refresh is started but after bean definitions have been loaded.

### ApplicationReadyEvent

An `ApplicationReadyEvent` is sent after any application and command-line runners have been called. It indicates that the application is ready to service requests.

### ApplicationStartedEvent

An `ApplicationStartedEvent` is sent after the context has been refreshed but before any application and command-line runners have been called.

### ApplicationStartingEvent

An `ApplicationStartingEvent` is sent at the start of a run but before any processing, except for the registration of listeners and initializers.

### ContextRefreshedEvent

A `ContextRefreshedEvent` is sent when an `ApplicationContext` is refreshed.

### WebServerInitializedEvent

A `WebServerInitializedEvent` is sent after the WebServer is ready. `ServletWebServerInitializedEvent` and `ReactiveWebServerInitializedEvent` are the servlet and reactive variants respectively.

# Conclusion

Both events and direct method calls fits for different situations. With method call its like making assertion that, no matter what the state of modules are, they need to know this event happened. With events you just say this event occured and which modules get notified is not my concern. It is good to use events when you want to pass on the processing to another thread (example: sending an email on some task completion). Also for test driven development events comes in handy.
