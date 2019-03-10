---
title: "Modularizing a Spring Boot Application"
categories: [spring]
modified: 2018-02-06
author: tom
comments: true
ads: true
header:
 teaser: /assets/images/posts/spring-boot-modules/spring-boot-modules.jpg
 image: /assets/images/posts/spring-boot-modules/spring-boot-modules.jpg
---

{% include sidebar_right %}

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

The base for a Spring Module is a `@Configuration`-annotated class along the lines of Spring's 
[Java configuration](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-java)
feature.

There are several ways to define what beans should be loaded by such a 
configuration class.

## `@ComponentScan`

The easiest way to create a module is using the `@ComponentScan` annotation on
a configuration class:

```java
@Configuration
@ComponentScan(basePackages = "io.reflectoring.booking")
public class BookingModuleConfiguration {
}
```

If this configuration class is picked up by one of the importing mechanisms (explained later),
it will look through all classes in the package `io.reflectoring.booking` and load 
an instance of each class that is annotated with one of 
Spring's [stereotype annotations](https://github.com/spring-projects/spring-framework/tree/master/spring-context/src/main/java/org/springframework/stereotype)
into the application context. 

This way is fine as long as you always want to load *all* classes of a package and its sub-packages
into the application context. If you need more control on what to load, read on.

## `@Bean` Definitions

Spring's Java configuration feature also brings the `@Bean` annotation for creating beans
that are loaded into the application context:

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
`BookingService` instance will be created and inserted into the application context.

Using this way to create a module gives a clearer picture of what beans
are actually loaded, since you have a single place to look at - in contrast
to using `@ComponentScan` where you have to look at the stereotype annotations
of all classes in the package to see what's going on. 

## `@Conditional` Annotations 

If you need even more fine-grained control over which components should be loaded into the
application context, you can make use of Spring Boot's `@Conditional...` annotations:

```java
@Configuration
@ConditionalOnProperty(name = "io.reflectoring.security.enabled", 
    havingValue = "true", matchIfMissing = true)
public class SecurityModuleConfiguration {
  // @Bean definitions ...
}
```

Setting the property `io.reflectoring.security.enabled` to `false` will now
disable this module completely.

There are other [`@ConditionalOn...` annotations](/spring-boot-conditionals)
you can use to define conditions for loading a module. These include a 
condition depending on the version of the JVM and
the existence of a certain class in the classpath or a certain bean in the
application context.

If you ever asked yourself how Spring Boot magically loads exactly the beans 
your application needs into the application context, this is how. Spring Boot itself makes
heavy use of the `@ConditionalOn...` annotations.

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

This will import the `BookingModuleConfiguration` class and all beans that come 
with it - no matter whether they are declared by `@ComponentScan` or `@Bean` annotations.  

## `@Enable...` Annotations

Spring Boot brings a set of annotations that each import a certain module by themselves. An example 
is `@EnableScheduling`, which imports all Beans necessary for the scheduling sub system 
and its `@Scheduled` annotation to work.

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
of more than one configuration, this is a convenient and expressive way to aggregate these
configurations into a single module.

## Auto-Configuration

If we want to load a module automatically instead of hard-wiring the import into the 
source code, we can make use of Spring Boot's [auto-configuration feature](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-developing-auto-configuration.html).

To enable a module for auto configuration, put the file `META-INF/spring.factories` into
the classpath:

```properties
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  io.reflectoring.security.SecurityModuleConfiguration
```

This would import the `SecurityModuleConfiguration` class all its beans into the application context.

# When to use which Import Strategy?

This article presented the major options for creating and importing modules
in a Spring Boot application. But when should we use which of those options?

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
