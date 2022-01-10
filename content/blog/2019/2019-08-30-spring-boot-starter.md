---
authors: [tom]
title: Quick Guide to Building a Spring Boot Starter
categories: ["WIP", "Spring Boot"]
date: 2019-08-30
excerpt: "Everything you need to know to build a Spring Boot Starter bringing a cross-cutting concern to any Spring Boot application."
image:  images/stock/0039-start-1200x628-branded.jpg
url: spring-boot-starter
---

There are certain cross-cutting concerns that we don't want to implement from scratch for each Spring Boot application we're building. **Instead, we want to implement those features *once* and include them into any application as needed**.

In Spring Boot, the term used for a module that provides such cross-cutting concerns is "starter". A starter makes it easy to include a certain set of features to "get started" with them.

Some example use cases for a Spring Boot starter are: 

* providing a configurable and/or default logging configuration or making it easy to log to a central log server
* providing a configurable and/or default security configuration
* providing a configurable and/or default error handling strategy
* providing an adapter to a central messaging infrastructure 
* integrating a third-party library and making it configurable to use with Spring Boot
* ...

In this article, we'll build a Spring Boot starter that allows a Spring Boot application to easily send and receive Events over an imaginary central messaging infrastructure.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/starter" %}}

## Spring Boot Starter Vocabulary

Before we dive into the details of creating a Spring Boot starter, let's discuss some keywords that will help to understand the workings of a starter.

### What's the Application Context?

In a Spring application, **the application context is the network of objects (or "beans") that makes up the application**. It contains our web controllers, services, repositories and whatever (usually stateless) objects we might need for our application to work.

### What's a Spring Configuration?

A class annotated with the `@Configuration` annotation serves as a factory for beans that are added to the application context. It may contain factory methods annotated with `@Bean` whose return values are automatically added to the application context by Spring. 

In short, **a Spring configuration contributes beans to the application context**.

### What's an Auto-Configuration?

**An auto-configuration is a `@Configuration` class that is automatically discovered by Spring**. As soon as an auto-configuration is found on the classpath, it is evaluated and the configuration's contribution is added to the application context.

An auto-configuration may be [conditional](/spring-boot-conditionals/) so that its activation depends on external factors like a certain configuration parameter having a specific value.

### What's an Auto-Configure Module?

**An auto-configure module is a Maven or Gradle module that contains an auto-configuration class**. This way, we can build modules that automatically contribute to the application context, adding a certain feature or providing access to a certain external library. All we have to do to use it in our Spring Boot application is to include a dependency to it in our `pom.xml` or `build.gradle`.

This method is heavily used by the Spring Boot team to integrate Spring Boot with external libraries.  

### What's a Spring Boot Starter?

Finally, **a Spring Boot Starter is a Maven or Gradle module with the sole purpose of providing all dependencies necessary to "get started" with a certain feature**. This usually means that it's a solitary `pom.xml` or `build.gradle` file that contains dependencies to one or more auto-configure modules and any other dependencies that might be needed. 

In a Spring Boot application, we then only need to include this starter to use the feature.

<div class="notice success">
  <h3>Combining Auto-Configuration and Starter in a Single Module</h3>
  <p>
   The <a target="_blank" href="https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-developing-auto-configuration.html#boot-features-custom-starter-module-starter">reference manual</a> proposes to separate auto-configuration and starter each into 
   a distinct Maven or Gradle module to separate the concern of auto-configuration from 
   the concern of dependency management. 
  </p>
  <p>
  This may be a bit over-engineered in environments where we're not building an  
  open-source library that is used by thousands of users. <strong>In this article, we're 
  combining both concerns into a single starter module</strong>. 
  </p>
</div> 

## Building a Starter for Event Messaging

Let's discover how to implement a starter with an example.

Imagine we're working in a microservice environment and want to implement a starter that allows the services to communicate with each other asynchronously. The starter we're building will provide the following features:

* an `EventPublisher` bean that allows us to send events to a central messaging infrastructure
* an abstract `EventListener` class that can be implemented to subscribe to certain events from the central messaging infrastructure.

Note that the implementation in this article will not actually connect to a central messaging infrastructure, but instead provide a dummy implementation. The goal of this article is to showcase how to build a Spring Boot starter and not how to do messaging, after all.

### Setting Up the Gradle Build

Since a starter is a cross-cutting concern across multiple Spring Boot applications, it should live in its own codebase and have its own Maven or Gradle module. We'll use Gradle as the build tool of choice, but it works very similar with Maven.

To get the basic Spring Boot features into our starter, **we need to declare a dependency to the basic Spring Boot starter** in our `build.gradle` file:

```groovy
plugins {
  id 'io.spring.dependency-management' version '1.0.8.RELEASE'
  id 'java'
}

dependencyManagement {
  imports {
    mavenBom("org.springframework.boot:spring-boot-dependencies:2.1.7.RELEASE")
  }
}

dependencies {
  implementation 'org.springframework.boot:spring-boot-starter'
  testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

The full file is available [on github](https://github.com/thombergs/code-examples/blob/master/spring-boot/starter/event-starter/build.gradle).

To get the version of the basic starter that is compatible to a certain Spring Boot version, we're using the Spring Dependency Management plugin to include the BOM (bill of materials) of that specific version.
 
This way, Gradle looks up the compatible version of the starter (and the versions of any other dependencies Spring Boot needs) in this BOM and we don't have to declare it manually. 

### Providing an Auto-Configuration

As an entry point to the features of our starter, we provide a `@Configuration` class:

```java
@Configuration
class EventAutoConfiguration {

  @Bean
  EventPublisher eventPublisher(List<EventListener> listeners){
    return new EventPublisher(listeners);
  }

}
```

This configuration includes all the `@Bean` definitions we need to provide the features of our starter. In this case, we simply add an `EventPublisher` bean to the application context. 

Our dummy implementation of the `EventPublisher` needs to know all `EventListeners` so it can deliver the events to them, so we let Spring inject the list of all `EventListeners` available in the application context.

To make our configuration an auto-configuration, we list it in the file `META-INF/spring.factories`:

```properties
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  io.reflectoring.starter.EventAutoConfiguration
```

Spring Boot searches through all `spring.factories` files it finds on the classpath and loads the configurations declared within.

With the `EventAutoConfiguration` class in place, we now have an automatically activated single point of entry for our Spring Boot starter. 

### Making it Optional

**It's always a good idea to allow the features of a Spring Boot starter to be disabled**. This is especially important when providing access to an external system like a messaging service. That service won't be available in a test environment, for instance, so we want to shut the feature down during tests.

We can make our entry point configuration optional by using Spring Boot's [conditional annotations](/spring-boot-conditionals/):

```java
@Configuration
@ConditionalOnProperty(value = "eventstarter.enabled", havingValue = "true")
@ConditionalOnClass(name = "io.reflectoring.KafkaConnector")
class EventAutoConfiguration {
  ...
}
```

By using `ConditionalOnProperty` we tell Spring to only include the `EventAutoConfiguration` (and all the beans it declares) into the application context if the property `eventstarter.enabled` is set to `true`. 

The `@ConditionalOnClass` annotation tells Spring to only activate the auto-configuration when the class `io.reflectoring.KafkaConnector` is on the classpath (this is just a dummy class to showcase the use of conditional annotations).

### Making it Configurable

For a library that is used in multiple applications, like our starter, **it's also a good idea to make the behavior as configurable as possible**.

Imagine that an application is only interested in certain events. To make this configurable per application, we could provide a list of the enabled events in an `application.yml` (or `application.properties`) file:

```yml
eventstarter:
  listener:
    enabled-events:
      - foo
      - bar
```

To make these properties easily accessible within the code of our starter, we can provide a [`@ConfigurationProperties` class](/spring-boot-configuration-properties/):

```java
@ConfigurationProperties(prefix = "eventstarter.listener")
@Data
class EventListenerProperties {

  /**
   * List of event types that will be passed to {@link EventListener}
   * implementations. All other events will be ignored.
   */
  private List<String> enabledEvents = Collections.emptyList();

}
```

We enable the `EventListenerProperties` class by annotating our entry point configuration with `@EnableConfigurationProperties`:
 
```java
@Configuration
@EnableConfigurationProperties(EventListenerProperties.class)
class EventAutoConfiguration {
  ...
}
```

And finally, we can let Spring inject the `EventListenerProperties` bean anywhere we need it, for instance within our abstract `EventListener` class to filter out the events we're not interested in:

```java
@RequiredArgsConstructor
public abstract class EventListener {

  private final EventListenerProperties properties;

  public void receive(Event event) {
    if(isEnabled(event) && isSubscribed(event)){
      onEvent(event);
    }
  }

  private boolean isSubscribed(Event event) {
    return event.getType().equals(getSubscribedEventType());
  }

  private boolean isEnabled(Event event) {
    return properties.getEnabledEvents().contains(event.getType());
  }
}
```

### Creating IDE-friendly Configuration Metadata

With `eventstarter.enabled` and `eventstarter.listener.enabled-events` we have specified two configuration parameters for our starter. **It would be nice if those parameters would be auto-completed when a developer starts typing `event...` within a configuration file**.

Spring Boot provides an annotation processor that collects metadata about configuration parameters from all `@ConfigurationProperties` classes it finds. We simply include it in our `build.gradle` file:

```groovy
dependencies {
  ...
  annotationProcessor 'org.springframework.boot:spring-boot-configuration-processor'
}
```

This annotation processor will generate the file `META-INF/spring-configuration-metadata.json` that contains metadata about the configuration parameters in our `EventListenerProperties` class. This metadata includes the Javadoc on the fields so be sure to make the Javadoc as clear as possible. 

In IntelliJ, the [Spring Assistant plugin](https://plugins.jetbrains.com/plugin/10229-spring-assistant) will read this metadata and provide auto-completion for those properties. 

This still leaves the `eventstarter.enabled` property, though, since it's not listed in a `@ConfigurationProperties` class. 

We can add this property manually by creating the file `META-INF/additional-spring-configuration-metadata.json`:

```json
{
  "properties": [
    {
      "name": "eventstarter.enabled",
      "type": "java.lang.Boolean",
      "description": "Enables or disables the EventStarter completely."
    }
  ]
}
```
 
The annotation processor will then automatically merge the contents of this file with the automatically generated file for IDE tools to pick up. The format of this file is documented in the [reference manual](https://docs.spring.io/spring-boot/docs/current/reference/html/configuration-metadata.html).

### Improving Startup Time

For each auto-configuration class on the classpath, Spring Boot has to evaluate the conditions encoded within the `@Conditional...` annotations to decide whether to load the auto-configuration and all the classes it needs. **Depending on the size and number of starters in a Spring Boot application, this can be a very expensive operation and affect startup time**.

There is yet another annotation processor that generates metadata about the conditions of all auto-configurations. Spring Boot reads this metadata during startup and can filter out configurations whose conditions are not met without actually having to inspect those classes.

For this metadata to be generated, we simply need to add the annotation processor to our starter module:

```groovy
dependencies {
    ...
    annotationProcessor 'org.springframework.boot:spring-boot-autoconfigure-processor'
}
```

During the build, the metadata will be generated into the `META-INF/spring-autoconfigure-metadata.properties` file, which will look something like this:

```properties
io.reflectoring.starter.EventAutoConfiguration=
io.reflectoring.starter.EventAutoConfiguration.ConditionalOnClass=io.reflectoring.KafkaConnector
io.reflectoring.starter.EventAutoConfiguration.Configuration=
```

I'm not sure why the metadata contains the `@ConditionalOnClass` condition but not the `@ConditionalOnProperty` condition. If you know why, please let me know in the comments.

## Using the Starter

Now that the starter is polished it's ready to be included into a Spring Boot application.

This is as simple as adding a single dependency in the `build.gradle` file:

```groovy
dependencies {
  ...
  implementation project(':event-starter')
}
```

In the example above, the starter is a module within the same Gradle build, so we don't use the fully-qualified Maven coordinates to identify the starter.

We can now configure the starter using the [configuration parameters](#making-it-configurable) we have introduced above. Hopefully, our IDE will evaluate the [configuration metadata](#creating-ide-friendly-configuration-metadata) we created and auto-complete the parameter names for us. 

To use our event starter, we can now inject an `EventPublisher` into our beans and use it to publish events. Also, we can create beans that extend the `EventListener` class to receive and act on events. 

A working example application is available [on GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/starter/application).

## Conclusion

Wrapping certain features into a starter to use them in any Spring Boot application is only a matter of a few simple steps. Provide an auto-configuration, make it configurable, and polish it with some auto-generated metadata to improve performance and usability.
