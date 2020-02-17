---
title: Spring Boot Application Events Explained
categories: [spring-boot]
date: 2020-02-13 05:00:00 +1100
modified: 2020-02-13 05:00:00 +1100
author: default
excerpt: "Reactive Programming has a lot of pitfalls for rookies to fall into, especially when it's multi-threaded. This article documents some of those pitfalls and their solutions so you don't have to fall."
image:
  auto: 0058-motorway-junction
---

You can always write the listener as another method within the application, but it will be tightly coupled. With events, you no need to change the application code as well as events code. We can easily switch between listeners and events without worrying. Also, you can have multiple listeners for the same event. For example, sending an email and do some other task on user registration.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-testing" %}

# What is an Application Event?

Spring Application Events gives the capability for listening to specific application events that you can process as per application needs. Events are meant for loosely coupled components to exchange information. As there is no direct coupling between publishers and subscribers, it enables us to extend subscribers without affecting others.

Let us see how we can create, publish and listen to custom events in spring application.

## Throwing an Application Event

Application events are sent by using the Spring Framework’s event publishing mechanism. Prior to Spring 4.2, it was required to extend `ApplicationEvent` for latter it is no longer required.

In the below example, we will create a custom event called `UserCreationEvent` to store user-related data.

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

Spring gives the flexibility to publish any arbitrary event and not force you to extend from `ApplicationEvent`. The `ApplicationEventPublisher` interface has been extended to allow you to publish any object. When this object is not an `ApplicationEvent`, Spring will wrap it in a `PayloadApplicationEvent` for you.

Now that we have `UserCreatedEvent`. In order to publish it to its respective listeners, we need `ApplicationEventPublisher`.

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

Now that you know how to create and publish a custom event. Let us see how to start listening to the event. An event can have multiple listeners doing different work based on the application requirement. By default spring events are synchronous it blocks until all listeners finish processing the event.

There are two ways to define a listener. One with `@EventListener` annotation and another by implementing `ApplicationListener`.

Note: Listener has to be a bean managed by spring.

### Annotation-Driven

From Spring 4.1 it is now possible to simply annotate a method of a managed bean with `@EventListener` to automatically register an `ApplicationListener` matching the signature of the method. No additional configuration is necessary with annotation-driven configuration enabled.

```java
@EventListener
public void handleUserCreatedEvent(UserCreatedEvent event) {
	System.out.println("User created event triggered. Created user: " + event.getName());
}
```

For the methods annotated with `@EventListener` and defined as a non-void return type, Spring will send that result as a new event for you.

Spring allows your listener to be triggered by a particular scenario using a condition attribute. The event will be handled if the expression evaluates to boolean true or one of the following strings: "true", "on", "yes", or "1". Method arguments are exposed via their names. The condition expression also exposes a “root” variable with raw `ApplicationEvent (#root.event)` and the actual method arguments `(#root.args)`

### Implementing ApplicationListener

```java
@Component
public class UserCreatedListener implements ApplicationListener<UserCreatedEvent> {

	@Override
	public void onApplicationEvent(UserCreatedEvent event) {
		System.out.println("User created event triggered with ApplicationListener implemented listener. Created user: " + event.getName());
	}
}
```

#### Asynchronous Events

As said earlier Spring events are synchronous by default, it blocks publisher thread until all the listeners have processed the event. To make this run in async mode, all you have to do is use `@Async` annotation on the listener.
Note: You have to enable async for application by using @`EnableAsync` to use `@Async`.

## Transaction bound events

Spring provides the ability to bind the listener to a phase of the transaction. This allows events to be used with more flexibility when the outcome of the current transaction actually matters to the listener.

The transaction module implements an `EventListenerFactory` that looks for the new `@TransactionalEventListener` annotation. So when you annotate your method with `@TransactionalEventListener` an extended event listener that is aware of the transaction is registered instead of the default. You can bind the listener to the following phases of transaction: `AFTER_COMMIT`(default), `AFTER_ROLLBACK`, `BEFORE_COMMIT` and `AFTER_COMPLETION`.

```java
@Component
public class MyComponent {

  @TransactionalEventListener
  public void handleUserCreatedEvent(UserCreatedEvent userEvent) {
    ...
  }
}
```

## Spring’s Application Events

Below are a list of application events with respect to their order their execution that are tied with `SpringApplication`.

Some events are actually triggered before the `ApplicationContext` is created, so you cannot register a listener on those as a @Bean. You can register them with the `SpringApplication.addListeners(…​)` method or `the SpringApplicationBuilder.listeners(…​)` method.

You can also register your listener regardless of how the application is created by adding a `META-INF/spring.factories` file to your project and reference your listener(s) by using the `org.springframework.context.ApplicationListener` key, as shown in the following example:

`org.springframework.context.ApplicationListener=com.reflectoring.eventdemo.MyListener`

### ApplicationContextInitializedEvent

An `ApplicationContextInitializedEvent` is sent when the `ApplicationContext` is prepared and `ApplicationContextInitializers` have been called but before any bean definitions are loaded.

```java
public class ApplicationContextInitializedEventListener implements ApplicationListener< ApplicationContextInitializedEvent> {

	@Override
	public void onApplicationEvent(ApplicationContextInitializedEvent event) {
		System.out.println("ApplicationContextInitializedEvent Received - " + event);
	}
}
```

### ApplicationEnvironmentPreparedEvent

An `ApplicationEnvironmentPreparedEvent` is sent when the Environment to be used in the context is known but before the context is created.

```java
public class ApplicationEnvironmentPreparedEventListener implements ApplicationListener< ApplicationEnvironmentPreparedEvent> {

	@Override
	public void onApplicationEvent(ApplicationEnvironmentPreparedEventevent) {
		System.out.println("ApplicationEnvironmentPreparedEvent Received - " + event);
	}
}
```

### ApplicationFailedEvent

An `ApplicationFailedEvent` is sent if there is an exception on startup.

```java
public class ApplicationFailedEventListener implements ApplicationListener< ApplicationFailedEvent> {

	@Override
	public void onApplicationEvent(ApplicationFailedEvent) {
		System.out.println("ApplicationFailedEvent Received - " + event);
	}
}
```

### ApplicationPreparedEvent

An `ApplicationPreparedEvent` is sent just before the refresh is started but after bean definitions have been loaded.

```java
public class ApplicationPreparedEventListener implements ApplicationListener< ApplicationPreparedEvent> {

	@Override
	public void onApplicationEvent(ApplicationPreparedEvent) {
		System.out.println("ApplicationPreparedEvent Received - " + event);
	}
}
```

### ApplicationReadyEvent

An `ApplicationReadyEvent` is sent after any application and command-line runners have been called. It indicates that the application is ready to service requests.

```java
public class ApplicationReadyEventListener implements ApplicationListener< ApplicationReadyEvent> {

	@Override
	public void onApplicationEvent(ApplicationReadyEvent) {
		System.out.println("ApplicationReadyEvent Received - " + event);
	}
}
```

### ApplicationStartedEvent

An `ApplicationStartedEvent` is sent after the context has been refreshed but before any application and command-line runners have been called.

```java
public class ApplicationStartedEventListener implements ApplicationListener< ApplicationStartedEvent> {

	@Override
	public void onApplicationEvent(ApplicationStartedEvent) {
		System.out.println("ApplicationStartedEvent Received - " + event);
	}
}
```

### ApplicationStartingEvent

An `ApplicationStartingEvent` is sent at the start of a run but before any processing, except for the registration of listeners and initializers.

```java
public class ApplicationStartingEventListener implements ApplicationListener< ApplicationStartingEventListener> {

	@Override
	public void onApplicationEvent(ApplicationStartingEventListener) {
		System.out.println("ApplicationStartingEventListener Received - " + event);
	}
}
```

In addition to these, the following events are also published after `ApplicationPreparedevent` and before `ApplicationStartedEvent`:

#### ContextRefreshedEvent

A `ContextRefreshedEvent` is sent when an `ApplicationContext` is refreshed.

#### WebServerInitializedEvent

A `WebServerInitializedEvent` is sent after the WebServer is ready. `ServletWebServerInitializedEvent` and `ReactiveWebServerInitializedEvent` are the servlet and reactive variants respectively.

# Conclusion

You often need not use application events, but it can be handy to know that they exist. It is good to use events when you want to pass on the processing to another thread (example: sending an email on some task completion) or in case, you do not want the outcome for further processing and also with events, TDD will be easy.
