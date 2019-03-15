---
title: "Configuring Spring Boot Modules with `@ConfigurationProperties`"
categories: [java]
modified: 2019-03-15
last_modified_at: 2019-03-15
author: tom
tags: 
comments: true
ads: true
excerpt: "TODO"
sidebar:
  toc: true
---

{% include sidebar_right %}

TODO 

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/spring-boot/configuration" %}

## Using `@ConfigurationProperties` to configure a Module

* we need setters!

### Ignoring Invalid Properties

```java
@Data
@Component
@ConfigurationProperties(prefix = "myapp.mail", ignoreInvalidFields = false)
class MailModuleProperties {
  private boolean enabled;
  private String defaultSubject;
}
```

```properties
myapp.mail.enabled=foo
myapp.mail.defaultSubject=Hello
```

```
java.lang.IllegalArgumentException: Invalid boolean value 'asd'
```

### Ignoring Unknown Properties

```java
@Data
@Component
@ConfigurationProperties(prefix = "myapp.mail", ignoreUnknownFields = false)
class MailModuleProperties {
  private boolean enabled;
  private String defaultSubject;
}
```

```properties
myapp.mail.enabled=true
myapp.mail.defaultSubject=Hello
myapp.mail.foo=foo
```

```
org.springframework.boot.context.properties.bind.UnboundConfigurationPropertiesException:
  The elements [myapp.mail.foo] were left unbound.
```

## Activating `@ConfigurationProperties`

* via `@EnableConfigurationProperties` on a `@Configuration` class or the application class
* via `@Component`
* via `@Bean`

Hint: don't add configuration properties to the application class because then they're always
loaded and the properties class must have public visibility. For better modularization,
make the properties class package private within the package of the module you're 
configuring.

## Validating `@ConfigurationProperties` on Startup

## Logging `@ConfigurationProperties` on Startup

* TODO: is there a class in Spring Boot that logs all properties? 

## Complex Property Types

### Durations

### File Sizes 

### Providing a Custom `ConversionService`

## Using the Spring Boot Configuration Processor for Auto-Completion

```groovy
dependencies {
  ...
	annotationProcessor 'org.springframework.boot:spring-boot-configuration-processor'
}
```

### IntelliJ

* install "Spring Assistant" Plugin

### Eclipse

## Conclusion  
