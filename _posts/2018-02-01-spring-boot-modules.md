---
title: "Modularizing a Spring Boot Application"
categories: [spring]
modified: 2018-01-18
author: tom
comments: true
ads: false
header:
 teaser: /assets/images/posts/consumer-driven-contract-consumer-spring-cloud-contract/contract.jpg
 image: /assets/images/posts/consumer-driven-contract-consumer-spring-cloud-contract/contract.jpg
---

Every software project comes to a point where the code should be broken up into modules.
These may be modules within a single code base or modules that each live in their own
code base. This article explains some Spring Boot features that help to split up
your Spring Boot application into several modules. 

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/spring-boot/modular" %}

# What's a Module in Spring Boot?

A module in the sense of this article is a set of Spring components loaded into the 
application context. 

A module can be a business module, providing some business services to the application
or a technical module that provides cross-cutting concerns to several other
modules or to the whole of the application. 

# Options for Creating Modules

Spring and Spring Boot provide several ways to create a module. 

## `@ComponentScan`

The easiest way to create a module is using the `@ComponentScan` annotation: 

```java
@Configuration
@ComponentScan(basePackages = "io.reflectoring.booking")
public class BookingModuleConfiguration {
}
```

If this configuration class is picked up by one of the importing mechanisms,
it will look through all classes in the package `io.reflectoring.booking` and load 
an instance of each class annotated with one of Spring's [stereotype annotations](https://github.com/spring-projects/spring-framework/tree/master/spring-context/src/main/java/org/springframework/stereotype)
into the `ApplicationContext`. 

This way is fine as long as you always want to load *all* classes into the `ApplicationContext`.
If you need more control, read on.

## `@Bean` Definitions

With its [Java configuration feature](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-java), 
Spring itself brings a standard for creating modules:

```java
@Configuration
public class BookingModuleConfiguration {

  @Bean
  public BookingService bookingService(){
    return new BookingService();
  }
  
  // potentially more @Bean definitions ...

}
```

When this configuration class is imported, a
`BookingService` instance will be created and inserted into the `ApplicationContext`.

## Spring Boot's `@Conditional` Annotations 

If you need even more fine-grained control over which components should be loaded into the
`ApplicationContext`, you can make use of Spring Boot's `@Conditional...` annotations:

```java
@Configuration
@ConditionalOnProperty(name = "io.reflectoring.security.enabled", havingValue = "true", matchIfMissing = true)
public class SecurityModuleConfiguration {
  // @Bean definitions ...
}
```

Setting the property `io.reflectoring.security.enabled` to `false` will now
disable this module completely.

There are lots of other [`@Conditional...` annotations](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-developing-auto-configuration.html#boot-features-condition-annotations)
you can use to define conditions for loading a module.

# Options for Importing Modules

Having created a module, we need to import it into the application. 

## `@Import`

The most straight-forward way is to use the `@Import` annotation:

```java
@SpringBootApplication
@Import(BookingModuleConfiguration.class)
public class ModularApplication {
  // ...
}
```

This will import the `BookingModuleConfiguration` class and all beans that come with it.  

## Spring Boot's `@Enable...` Annotations

Spring Boot brings a set of annotations that each import a certain module by themselves. An example 
is `@EnableScheduling`, which import all Beans necessary for the scheduling sub system and the
`@Scheduled` annotation to work.

We can make use of this ourselves, by defining our own `@EnableBookingModule` annotation:

```java
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE})
@Documented
@Import(BookingModuleConfiguration.class)
@Configuration
public @interface EnableBookingModule {
}
```

The annotation is used like this:

```java 
@SpringBootApplication
@EnableBookingModule
public class ModularApplication {
 // ...
}
``` 

The `@EnableBookingModule` annotation is actually just a wrapper around an `@Import` annotation 
that imports our `BookingModuleConfiguration` as before. However, if we have a module consisting 
of more than one configuration, this is a convenient and expressive way to import that module.

## Auto-Configuration

If we want to load a module automatically instead of hard-wiring the import into the 
source code, we can make use of Spring Boot's [auto-configuration feature](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-developing-auto-configuration.html).

To enable a module for auto configuration, put a file `META-INF/spring.factories` into
the classpath:

```properties
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  io.reflectoring.security.SecurityModuleConfiguration
```

This would import the `SecurityModuleConfiguration` class and evaluate all `@Conditional...`
annotations before loading it and all its beans into the `ApplicationContext`.

# When to use which Import Strategy?

So many options ... when should we use which one?

## Use `@Import` for Business Modules

For modules that contain business logic - like the `BookingModuleConfiguration` from the 
code snippets above - a static import with the `@Import` annotation should suffice in
most cases. It usually does not make sense to *not* load a business module, 
so we do not need any control about the conditions under which it is loaded.

Note that even if a module is *always* loaded, it still has a right to exist as a module,
since it being a module enables it to live in its own package or even 
its own JAR file.

## Use Auto-Configuration for Technical Modules

Technical modules, on the other hand - like the `SecurityModuleConfiguration` from above - 
usually provide some cross-cutting concerns like logging, exception handling, authorization 
or monitoring features which the application can very well live without. 

Especially during development, these features may not be desired at all, so we want to have
a way to disable them. 

Also, we do not want to import each technical module statically with `@Import`, since
they should not really have any impact on our code.

So, the best option for importing technical modules is the auto-configuration feature. The
modules are loaded silently in the background and we can influence them outside of the code
with properties.
