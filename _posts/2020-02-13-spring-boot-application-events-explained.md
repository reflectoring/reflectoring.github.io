---
title: Spring Boot Application Events Explained
categories: [spring-boot]
date: 2020-02-13 05:00:00 +1100
modified: 2020-02-13 05:00:00 +1100
author: nandan
excerpt: 'Spring Boot allows us to throw and listen to specific application events that we can process as we wish. Events are meant for exchanging information between loosely coupled components.'
image:
  auto: 0058-motorway-junction
---

To "listen" to an event, we can always write the listener as another method within the source of the event, but this will tightly couple the event source to the logic of the listener.

With real events, we are more flexible than with direct method calls. We can dynamically register and deregister listeners to certain events as we wish. We can also have multiple listeners for the same event.

This tutorial gives an overview of how to use publish and listen to custom events and explains Spring Boot's built-in events.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-events" %}

## Why Should I Use Events Instead of Direct Method Calls

Both events and direct method calls fits for different situations. With method call its like making assertion that, no matter what the state of modules are, they need to know this event happened. With events you just say this event occured and which modules get notified is not my concern. It is good to use events when you want to pass on the processing to another thread (example: sending an email on some task completion). Also for test driven development events comes in handy.

## What is an Application Event?

Spring application events allows us to throw and listen to specific application events that we can process as we wish. Events are meant for exchanging information between loosely coupled components. As there is no direct coupling between publishers and subscribers, it enables us to modify subscribers without affecting the publishers and vice-versa.

Let's see how we can create, publish and listen to custom events in a Spring Boot application.

## Creating an `ApplicationEvent`

We can publish application events using the Spring Framework’s event publishing mechanism. Prior to Spring 4.2, events had to extend `ApplicationEvent`. In latest versions, we can just publish any object as an event.
We are passing `source` object on which the event initially occurred or with which the event is associated (never null) to `super`. We do this for event sourcing. In event sourcing, we capture the state of entity or aggregate as a sequence of state changing events.

Let's create a custom event called `UserCreatedEvent` by extending `ApplicationEvent`

```java
class UserCreatedEvent extends ApplicationEvent {
	private String name;

	UserCreatedEvent(Object source, String name) {
		super(source);
		this.name = name;
	}
	...
}
```

Event can also be a normal object which does not extend `ApplicationEvent`,

```java
class UserRemovedEvent {
	private String name;

	UserRemovedEvent(String name) {
		this.name = name;
	}
	...
}
```

## Publishing an `ApplicationEvent`

Spring gives the flexibility to publish an arbitrary event and doesn't force us to extend from `ApplicationEvent`. The `ApplicationEventPublisher` interface has been extended to allow you to publish any object.

Now that we have a `UserCreatedEvent` by extending `ApplicationEvent` and `UserRemovedEvent` without extending. When the object is not an `ApplicationEvent`, Spring will wrap it in a `PayloadApplicationEvent` for us. In order to publish it to its respective listeners, we need an instance of`ApplicationEventPublisher`:

```java
@Component
class Publisher {
	@Autowired
	private ApplicationEventPublisher publisher;

	void publishEvent(final String name) {
		// Publishing event created by extending ApplicationEvent
		publisher.publishEvent(new UserCreatedEvent(this, name));
		// Publishing a object as an event
		publisher.publishEvent(new UserRemovedEvent(name));
	}
}
```

## Listening to an Application Event

Now that we know how to create and publish a custom event, let's see how we can listen to the event. An event can have multiple listeners doing different work based on the application requirements.

There are two ways to define a listener. We can either use the `@EventListener` annotation or implement the `ApplicationListener` interface. In either case, the listener class has to be managed by Spring.

### Annotation-Driven

Starting with Spring 4.1 it's now possible to simply annotate a method of a managed bean with `@EventListener` to automatically register an `ApplicationListener` matching the signature of the method. No additional configuration is necessary with annotation-driven configuration enabled. If your method should listen to several events or if you want to define it with no parameter at all, the event types can also be specified on the annotation itself. Example: `@EventListener({ContextStartedEvent.class, ContextRefreshedEvent.class})`.
For the methods annotated with `@EventListener` and defined as a non-void return type, Spring will send that result as a new event for us.

```java
@Component
class UserRemovedListener {

	@EventListener
	ReturnedEvent handleUserRemovedEvent(UserRemovedEvent event) {
		System.out.println(String.format("User removed (@EventListerner): %s", event.getName()));
		// Spring will send ReturnedEvent as a new event
		return new ReturnedEvent();
	}

	// Listener to receive the event returned by Spring
	@EventListener
	void handleReturnedEvent(ReturnedEvent event) {
		System.out.println("Returned Event Called");
	}
	...
}
```

Spring allows our listener to be triggered only in certain circumstances if we specify a `condition` by defining a boolean SpEL expression. The event will only be handled if the expression evaluates to `true` or one of the following strings: "true", "on", "yes", or "1". Method arguments are exposed via their names. The condition expression also exposes a “root” variable referring to the raw `ApplicationEvent` (`#root.event`) and the actual method arguments `(#root.args)`

```java
@Component
class UserRemovedListener {

	...
	@EventListener(condition = "#event.name eq 'reflectoring'")
	void handleConditionalListener(UserRemovedEvent event) {
		System.out.println(String.format("User removed (Conditional): %s", event.getName()));
	}
}
```

In the above example, the listener will be triggered with `UserRemovedEvent` only when the `#event.name` has value `'reflectoring'`,

### Implementing `ApplicationListener`

```java
@Component
class UserCreatedListener implements ApplicationListener<UserCreatedEvent> {

	@Override
	public void onApplicationEvent(UserCreatedEvent event) {
		System.out.println(String.format("User created: %s", event.getName()));
	}
}
```

In the above example, we have created a listener by implementing `ApplicationLister` and the generic represents the type of event you want to listen. It is now possible to define your `ApplicationListener` implementation with nested generics information in the event type. When dispatching an event, the signature of your listener is used to determine if it matches said incoming event.

### Asynchronous Event Listeners

**By default spring events are synchronous, meaning the publisher thread blocks until all listeners have finished processing the event.**

To make an event listener run in async mode, all we have to do is use the `@Async` annotation on that listener. To make the `@Async` annotation work, we also have to annotate one of our `@Configuration` classes or the `@SpringBootApplication` class with `@EnableAsync`.

```java
@Component
class AsyncListener {

	@Async
	@EventListener
	void handleAsyncEvent(String event) {
		System.out.println(String.format("Async event recevied: %s", event));
	}
}
```

## Transaction Bound Events

Spring allows us to bind an event listener to a phase of the current transaction. This allows events to be used with more flexibility when the outcome of the current transaction actually matters to the listener.

The transaction module implements an `EventListenerFactory` that looks for the new `@TransactionalEventListener` annotation. So when you annotate your method with `@TransactionalEventListener` an extended event listener that is aware of the transaction is registered instead of the default.

You can bind the listener to the following phases of transaction:  
`AFTER_COMMIT` : Fire the event after the commit has completed successfully.  
`AFTER_COMPLETION`: Fire the event after the transaction has completed.  
`AFTER_ROLLBACK`: Fire the event if the transaction has rolled back.  
`BEFORE_COMMIT`: Fire the event before transaction commit.

```java
@Component
class UserRemovedListener {

  	@TransactionalEventListener(condition = "#event.name eq 'reflectoring'", phase=TransactionPhase.AFTER_COMPLETION)
	void handleAfterUserRemoved(UserRemovedEvent event) {
		System.out.println(String.format("User removed (@TransactionalEventListener): %s", event.getName()));
	}
}
```

Listener in above example will be called when `UserRemovedEvent` completes its transaction (i.e., `phase=TransactionPhase.AFTER_COMPLETION`).

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

`org.springframework.context.ApplicationListener = com.reflectoring.eventdemo.SpringBuiltInEventsListener`

Once we make sure that our event listener is registered properly, we can listen to all of Spring Boot's `SpringApplicationEvents`:

```java
class SpringBuiltInEventsListener implements ApplicationListener<SpringApplicationEvent>{

	@Override
	public void onApplicationEvent(SpringApplicationEvent event) {
		System.out.println("SpringApplicationEvent Received - " + event);
	}
}
```

Below are the list of `SpringApplicationEvent`'s in the order of their execution,

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

Events are desgined for simple communication among Spring beans within the same application context. As of Spring 4.2, the infrastructure has been significantly improved and offers an annotation-based model as well as the ability to publish any arbitrary event. However, for more sophisticated enterprise needs, the [Spring Integration](https://spring.io/projects/spring-integration) project provides complete support for building lightweight, pattern-oriented, event-driven that build upon the well-known Spring programming model.
