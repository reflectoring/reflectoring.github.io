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

* we need setters (must be public)!
* class itself can package private

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
myapp.mail.default-subject=Hello
```

```
java.lang.IllegalArgumentException: Invalid boolean value 'foo'
```

Hint: relaxed binding

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
myapp.mail.default-subject=Hello
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

```java
@Data
@Component
@ConfigurationProperties(prefix = "myapp.mail", ignoreUnknownFields = true)
@Validated
class MailModuleProperties {

  @NotNull
  private Boolean enabled;

  @NotEmpty
  private String defaultSubject;
}
```

```
org.springframework.boot.context.properties.bind.validation.BindValidationException: 
   Binding validation errors on myapp.mail
   - Field error in object 'myapp.mail' on field 'enabled': rejected value [null]; ...
   - Field error in object 'myapp.mail' on field 'defaultSubject': rejected value []; ...
```

## Complex Property Types

### Lists and Sets

```java
@Data
@ConfigurationProperties(prefix = "myapp.mail")
class MailModuleProperties {

  private List<String> smtpServers;
  
}
```

```properties
myapp.mail.smtpServers[0]=server1
myapp.mail.smtpServers[1]=server2
```

```yaml
myapp:
  mail:
    smtp-servers:
      - server1
      - server2
```

### Durations

```java
@Data
@ConfigurationProperties(prefix = "myapp.mail")
class MailModuleProperties {

  private Duration pauseBetweenMails;
  
}
```

```properties
myapp.mail.pause-between-mails=5s
```

### File Sizes 

```java
@Data
@ConfigurationProperties(prefix = "myapp.mail")
class MailModuleProperties {

  private DataSize maxAttachmentSize;
  
}
```

```properties
myapp.mail.max-attachment-size=1MB
```

### Custom Types 

```properties
myapp.mail.max-attachment-weight=5kg
```

* hard to come up with an example since most use cases are covered
* either provide a constructor taking a String as an argument
* or a static valueOf(String) method
* or implement a custom converter


```java
class WeightConverter implements Converter<String, Weight> {

	@Override
	public Weight convert(String source) {
		return Weight.fromString(source);
	}

}
```

```java
@Configuration
class MailModuleConfiguration {

	@Bean
	@ConfigurationPropertiesBinding
	public WeightConverter weightConverter() {
		return new WeightConverter();
	}

}
```


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

### Marking a Configuration Property as Deprecated

```java
@Data
@ConfigurationProperties(prefix = "myapp.mail")
class MailModuleProperties {
  
  private String defaultSubject;
  
  @DeprecatedConfigurationProperty(reason = "not needed anymore", replacement = "none")
  public String getDefaultSubject(){
    return this.defaultSubject;
  }
  
}
```

Hint: when using Lombok together with `@DeprecatedConfigurationProperty` the property
will be included twice in the metadata!

![Deprecated info in auto-completion](/assets/images/posts/spring-boot-configuration-properties/deprecated.png)

## Conclusion  
