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

To "listen" to an event, we can always write "listener" to an event as another method within the source of the event, but this will tightly couple the event source to the logic of the listener.

With real events, we are more flexible than with direct method calls. We can dynamically register and deregister listeners to certain events as we wish. We can also have multiple listeners for the same event.

This tutorial gives an overview of how to publish and listen to custom events and explains Spring Boot's built-in events.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-events" %}

## Why Should I Use Events Instead of Direct Method Calls?

Both events and direct method calls fit for different situations. With a method call it's like making an assertion that, no matter the state of the sending and receiving modules, they need to know this event happened.

With events, on the other hand, we just say that an event occurred and which modules get notified is not our concern. It's good to use events when we want to pass on the processing to another thread (example: sending an email on some task completion). Also, events come in handy for test driven development.

## What is an Application Event?

Spring application events allows us to throw and listen to specific application events that we can process as we wish. Events are meant for exchanging information between loosely coupled components. As there is no direct coupling between publishers and subscribers, it enables us to modify subscribers without affecting the publishers and vice-versa.

Let's see how we can create, publish and listen to custom events in a Spring Boot application.

## Creating an `ApplicationEvent`

We can publish application events using the Spring Framework’s event publishing mechanism.

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

The `source` which is being passed to `super()` can be a object on which the event occured initially or a object with which the event is associated.

Since Spring 4.2, **we can also publish objects as an event without extending `ApplicationEvent`**:

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

We use the `ApplicationEventPublisher` interface to publish our events.

When the object we're publishing is not an `ApplicationEvent`, Spring will wrap it in a `PayloadApplicationEvent` for us:

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

```java
@Component
class UserRemovedListener {

	@EventListener
	ReturnedEvent handleUserRemovedEvent(UserRemovedEvent event) {
		System.out.println(String.format("User removed (@EventListener): %s", event.getName()));
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

Starting with Spring 4.1 it's now possible to simply annotate a method of a managed bean with `@EventListener` to automatically register an `ApplicationListener` matching the signature of the method. No additional configuration is necessary with annotation-driven configuration enabled. Our method can listen to several events or if we want to define it with no parameter at all, the event types can also be specified on the annotation itself. Example: `@EventListener({ContextStartedEvent.class, ContextRefreshedEvent.class})`.

For the methods annotated with `@EventListener` and defined as a non-void return type, Spring will publish the result as a new event for us.

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

Spring allows our listener to be triggered only in certain circumstances if we specify a `condition` by defining a boolean SpEL expression. The event will only be handled if the expression evaluates to `true` or one of the following strings: "true", "on", "yes", or "1". Method arguments are exposed via their names. The condition expression also exposes a “root” variable referring to the raw `ApplicationEvent` (`#root.event`) and the actual method arguments `(#root.args)`

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

In the above example, we have created a listener by implementing `ApplicationLister` and the generic represents the type of event we want to listen. It is now possible to define our `ApplicationListener` implementation with nested generics information in the event type. When dispatching an event, the signature of our listener is used to determine if it matches said incoming event.

### Asynchronous Event Listeners

**By default spring events are synchronous, meaning the publisher thread blocks until all listeners have finished processing the event.**

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

To make an event listener run in async mode, all we have to do is use the `@Async` annotation on that listener. To make the `@Async` annotation work, we also have to annotate one of our `@Configuration` classes or the `@SpringBootApplication` class with `@EnableAsync`.

## Transaction-Bound Events

Spring allows us to bind an event listener to a phase of the current transaction. This allows events to be used with more flexibility when the outcome of the current transaction actually matters to the listener.

```java
@Component
class UserRemovedListener {

  	@TransactionalEventListener(condition = "#event.name eq 'reflectoring'", phase=TransactionPhase.AFTER_COMPLETION)
	void handleAfterUserRemoved(UserRemovedEvent event) {
		System.out.println(String.format("User removed (@TransactionalEventListener): %s", event.getName()));
	}
}
```

The transaction module implements an `EventListenerFactory` that looks for the new `@TransactionalEventListener` annotation. So when we annotate our method with `@TransactionalEventListener`, we get an extended event listener that is aware of the transaction:

The `UserRemovedListener` will only be invoked when the current transaction completes.

We can bind the listener to the following phases of transaction:

- `AFTER_COMMIT`: Event will be fired when the transaction gets committed successfully. Can perform further operation once the main transaction commit gets complete.
- `AFTER_COMPLETION`: Event will be fired when trasaction commit or get a successful rollback. Can perform cleanup after transaction completion.
- `AFTER_ROLLBACK`: Event will be fired after trasaction has rolled back.
- `BEFORE_COMMIT`: Event will be fired before trasaction commit. Can flush trasactional O/R mapping sessions to database.

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

```java
class SpringBuiltInEventsListener implements ApplicationListener<SpringApplicationEvent>{

	@Override
	public void onApplicationEvent(SpringApplicationEvent event) {
		System.out.println("SpringApplicationEvent Received - " + event);
	}
}
```

Once we make sure that our event listener is registered properly, we can listen to all of Spring Boot's `SpringApplicationEvents`:

Below are the list of `SpringApplicationEvent`'s in the order of their execution,

### ApplicationContextInitializedEvent

An `ApplicationContextInitializedEvent` is fired when the `ApplicationContext` is ready and `ApplicationContextInitializers` are called but bean definitions are not yet loaded. Can be use to perfoem task before beans are initialized into Spring container.

### ApplicationEnvironmentPreparedEvent

An `ApplicationEnvironmentPreparedEvent` is fired when the `Environment` to be used in the context is available. Since environment will be ready we can inspect and do modification if required.

### ApplicationFailedEvent

An `ApplicationFailedEvent` is fired if there is an exception and application fails to start. Can be used to perform some task like execute a script or notify on failure.

### ApplicationPreparedEvent

An `ApplicationPreparedEvent` is fired when `ApllicationContext` is prepared but not refreshed. Environment is ready for use and bean definitions will be loaded.

### ApplicationReadyEvent

An `ApplicationReadyEvent` is fired to indicate that application is ready to service requests. It is advised not to modify the internal state since all initialization steps will be completed.

### ApplicationStartedEvent

An `ApplicationStartedEvent` is fired after the context has been refreshed but before any application and command-line runners have been called.

### ApplicationStartingEvent

An `ApplicationStartingEvent` is fired at the start of a run but before any processing, except for the registration of listeners and initializers.

### ContextRefreshedEvent

A `ContextRefreshedEvent` is fired when an `ApplicationContext` is refreshed.

### WebServerInitializedEvent

A `WebServerInitializedEvent` is fired after the WebServer is ready. `ServletWebServerInitializedEvent` and `ReactiveWebServerInitializedEvent` are the servlet and reactive variants respectively.

# Conclusion

Events are designed for simple communication among Spring beans within the same application context. As of Spring 4.2, the infrastructure has been significantly improved and offers an annotation-based model as well as the ability to publish any arbitrary event.

However, for more sophisticated enterprise needs, the [Spring Integration](https://spring.io/projects/spring-integration) project provides complete support for building lightweight, pattern-oriented, event-driven applications that build upon the well-known Spring programming model.
