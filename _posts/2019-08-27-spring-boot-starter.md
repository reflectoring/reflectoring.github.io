---
title: Building a Spring Boot Starter for Cross-Cutting Concerns
categories: [spring-boot]
modified: 2017-08-28
excerpt: "TODO"
image: 0039-start
---

## Vocabulary

### What's the Application Context?

In a Spring application, the application context is the network of objects (or "beans") that makes up the application. It contains our web controllers, services, repositories and whatever (usually stateless) objects we might need for our application to work.

### What's a Spring Configuration?

A class annotated with the `@Configuration` annotation serves as a factory for beans that are added to the application context. It may contain methods annotated with `@Bean` whose return values are automatically added to the application context by Spring. 

In short, a Spring configuration makes a contribution to the application context.

### What's an Auto-Configuration?

An auto-configuration is a `@Configuration` class that is automatically discovered by Spring. As soon as an auto-configuration is found on the classpath, it is evaluated and the configuration's contribution is added to the application context.

An auto-configuration may be [conditional](/spring-boot-conditionals/), so that its activation depends on external factors like a certain configuration parameter having a specific value.

### What's an Auto-Configure Module?

An auto-configure module is a Maven or Gradle module that contains an auto-configuration class. This way, we can build modules that automatically contribute to the application context, adding a certain feature or providing access to a certain external library. All we have to do to use it in our Spring Boot application is to include a dependency to it in our `pom.xml` or `build.gradle`.

This method is heavily used by the Spring Boot team to integrate Spring Boot with external libraries.  

### What's a Spring Boot Starter?

Finally, a Spring Boot Starter is a Maven or Gradle module with the sole purpose of providing all dependencies necessary to "get started" with a certain feature. This usually means that it's a solitary `pom.xml` or `build.gradle` file that contains dependencies to one or more auto-configure modules and any other dependencies that might be needed. 

In our application, we then only need to include this starter to use the feature.

<div class="notice success">
  <h4>Combining Auto-Configuration and Starter in a Single Module</h4>
  <p>
   The <a target="_blank" href="https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-developing-auto-configuration.html#boot-features-custom-starter-module-starter">reference manual</a> proposes to separate auto-configuration and starter each into 
   their own Maven or Gradle module to separate the concern of auto-configuration from 
   the concern of dependency management. 
  </p>
  <p>
  This may seem a bit over-engineered in environments where we're not building an  
  open source library that is used by thousands of users. <strong>In this article, we're 
  combining both concerns into a single starter module</strong>. 
  </p>
</div> 

## When does a Spring Boot Starter Make Sense?

* cross-cutting concerns in Microservices
* providing a library
* logging configuration
* security configuration
* event messaging adapter
* ...

# The Example Use Case
* allow publishing events to an event broker
* provides an EventPublisher

# Setting Up the Gradle Build
* doesn't make much sense in a monolithic codebase, because there are easier ways to include spring moduls (link to article)

* Gradle build file
* refer to Spring Boot Gradle Multi-Module article for usage of Spring Dependency Plugin if used in the same build as the application
* if not in the same parent build, have a separate dependencyManagement closure
* include spring boot dependencies in `compileOnly` configuration to let the consumer decide on the version

# Providing an entry-point `@Configuration`
* functionality is a set of beans made available in the application context
* @configuration class that can include other configurations
* single point of entry to the functionality of the starter

# Making it Optional
* always allow to turn it off
* Conditional annotations (link to post)

# Making it Configurable
* always make it configurable (not everyone needs all features)
* @ConfigurationProperties (link to post)
* we access the consumer's `application.properties`

# Including the starter in the consumer
* simply add it as a dependency


https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-developing-auto-configuration.html

# Improving Startup Time
* use the autoconfigure processor
