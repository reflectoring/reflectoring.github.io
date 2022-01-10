---
authors: [tom]
title: "Configuring a Spring Boot Module with @ConfigurationProperties"
categories: ["WIP", "Spring Boot"]
date: 2019-03-18
excerpt: "An in-depth look at Spring Boot's support to bind external configuration
          parameters to fields of a Spring bean."
image:  images/stock/0013-switchboard-1200x628-branded.jpg
url: spring-boot-configuration-properties
---



Every application above play size requires some parameters at startup. These
parameters may, for instance, define which database to connect to, which locale
to support or which logging level to apply. 

These parameters should be [externalized](/externalize-configuration/), 
meaning that we should not bake them into a deployable artifact 
but instead provide them as a command-line argument or 
a configuration file when starting the application.

With the `@ConfigurationProperties` annotation, Spring boot provides a 
convenient way to access such parameters from within the application code.

This tutorial goes into the details of this annotation and shows how to
use it to configure a Spring Boot application module.  

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/configuration" %}}

## Using `@ConfigurationProperties` to Configure a Module

Imagine we're building a [module](/spring-boot-modules/) in our application that is responsible for
sending emails. In local tests, we don't want the module
to actually send emails, so **we need a parameter to disable this functionality**.
Also, **we want to be able to configure a default subject** for these mails, so we
can quickly identify emails in our inbox that have been sent from a test
environment.

Spring Boot offers [many different options](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-external-config.html#boot-features-external-config)
to pass parameters like these into an application.
In this article, we choose to create an `application.properties` file with
the parameters we need:  

```properties
myapp.mail.enabled=true
myapp.mail.default-subject=This is a Test
```

Within our application, we could now access the values of these properties by asking
Spring's [`Environment`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/env/Environment.html) 
bean or by using the [`@Value`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/annotation/Value.html) annotation, among other
things.

However, there's a more convenient and safer way to access those properties by
creating a class annotated with `@ConfigurationProperties`: 

```java
@ConfigurationProperties(prefix = "myapp.mail")
class MailModuleProperties {

  private Boolean enabled = Boolean.TRUE;
  private String defaultSubject;

  // getters / setters
  
}
```

The basic usage of `@ConfigurationProperties` is pretty straightforward: we
provide a class with fields for each of the external properties we want to capture.
Note the following:

* The `prefix` defines which external properties will be bound to the fields of the class.
* The classes' property names must match the names of the external properties
  according to Spring Boot's [relaxed binding](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-external-config.html#boot-features-external-config-relaxed-binding)
  rules.
* We can define a default values by simply initializing a field with a value.
* The class itself can be package private.
* The classes' fields must have public setters.

If we inject a bean of type `MailModuleProperties` into an other bean, this
bean can now access the values of those external configuration parameters
in a type-safe manner.

However, we still have to make our `@ConfigurationProperties` class known to Spring
so it will be loaded into the application context.

## Activating `@ConfigurationProperties`

For Spring Boot to create a bean of the `MailModuleProperties` class, we need to 
add it to the application context in one of several ways.

First, we can simply let it be part of a component scan by **adding the `@Component`
annotation**:

```java
@Component
@ConfigurationProperties(prefix = "myapp.mail")
class MailModuleProperties {
  // ...  
}
```

This obviously only works if the class in within a package that is scanned for
Spring's stereotype annotations via `@ComponentScan`, which by default is any
class in the package structure below the main application class.

**We can achieve the same result using Spring's Java Configuration feature**:

```java
@Configuration
class MailModuleConfiguration {

  @Bean
  public MailModuleProperties mailModuleProperties(){
    return new MailModuleProperties();
  }

}
```

As long as the `MailModuleConfiguration` class is scanned by the Spring Boot 
application, we'll have access to a `MailModuleProperties` bean in the application
context.

Alternatively, **we can use the `@EnableConfigurationProperties` annotation** to make our
class known to Spring Boot:

```java
@Configuration
@EnableConfigurationProperties(MailModuleProperties.class)
class MailModuleConfiguration {

}
```

<div class="notice success">
  <h4>Which is the Best Way to activate a <code>@ConfigurationProperties</code> Class?</h4>
  <p>
  All of the above ways are equally valid. I would suggest, however, to 
  <a href="/spring-boot-modules/">modularize your application</a> and have 
  each module provide its own <code>@ConfigurationProperties</code>
  class with only the properties it needs as we have done for the 
  mail module in the code above. This makes it easy to refactor properties
  in one module without affecting other modules.
  </p>
  <p>  
  For this reason, I would not recommend to use <code>@EnableConfigurationProperties</code>
  on the application class itself, as is shown in many other tutorials,
  but instead on a module-specific <code>@Configuration</code> class which might also
  make use of package-private visibility to hide the properties from the rest
  of the application.  
  </p>
</div> 

## Failing on Unconvertible Properties

What happens if we define a property in our `application.properties` that cannot
be interpreted correctly? Say we provide the value `'foo'` for our `enabled` property
that expects a boolean:

```properties
myapp.mail.enabled=foo
```

By default, Spring Boot will refuse to start the application with an exception:

```text
java.lang.IllegalArgumentException: Invalid boolean value 'foo'
```

If, for any reason, we don't want Spring Boot to fail in cases like this, we
can set the `ignoreInvalidFields` parameter to `true` (default is `false`):

```java
@ConfigurationProperties(prefix = "myapp.mail", ignoreInvalidFields = true)
class MailModuleProperties {
  
  private Boolean enabled = Boolean.TRUE;
  
  // getters / setters
}
```

In this case, **Spring Boot will set the `enabled` field to the default value 
we defined in the Java code**. If we don't initialize the field in the Java code, it would
be `null`.

## Failing on Unknown Properties

What happens if we have provided certain properties in our `application.properties`
file that our `MailModuleProperties` class doesn't know?

```properties
myapp.mail.enabled=true
myapp.mail.default-subject=This is a Test
myapp.mail.unknown-property=foo
```

**By default, Spring Boot will simply ignore properties that could not be bound to 
a field in a `@ConfigurationProperties` class.**

We might, however, want to fail startup when there is a property in the configuration
file that is not actually bound to a `@ConfigurationProperties` class. 
Maybe we have previously used this configuration property but it has been removed since,
so we want to be triggered to remove it from the `application.properties` file
as well.

If we want startup to fail on unknown properties, we can simply set the `ignoreUnknownFields`
parameter to `false` (default is `true`):

```java
@ConfigurationProperties(prefix = "myapp.mail", ignoreUnknownFields = false)
class MailModuleProperties {
  
  private Boolean enabled = Boolean.TRUE;
  private String defaultSubject;
  
  // getters / setters
}
```

We'll now be rewarded with an exception on application startup that tells us that a certain
property could not be bound to a field in our `MailModuleProperties` class since there
was no matching field:

```text
org.springframework.boot.context.properties.bind.UnboundConfigurationPropertiesException:
  The elements [myapp.mail.unknown-property] were left unbound.
```

<div class="notice warning">
  <h4>Deprecation Warning</h4>
  <p>
  The paramater <code>ignoreUnknownFields</code> is to be <a href="https://github.com/spring-projects/spring-boot/issues/12601">deprecated</a>
  in a future Spring Boot version. The reason is that we could have two <code>@ConfigurationProperties</code>
  classes bound to the same namespace. A property might be known to one of those classes and unknown to the other,
  causing a startup failure although we have two perfectly valid configurations.  
  </p>
</div> 

## Validating `@ConfigurationProperties` on Startup

If we want to make sure that the parameters that the configuration parameters passed into
the application are valid, **we can add [bean validation](/bean-validation-with-spring-boot/)
annotations to the fields and the `@Validated` annotation to the class itself**: 


```java
@ConfigurationProperties(prefix = "myapp.mail")
@Validated
class MailModuleProperties {

  @NotNull private Boolean enabled = Boolean.TRUE;
  @NotEmpty private String defaultSubject;

  // getters / setters
}
```

If we now forget to set the `enabled` property in our `application.properties` file
and leave the `defaultSubject` empty, we'll get a `BindValidationException`
on startup:

```properties
myapp.mail.default-subject=
```

```text
org.springframework.boot.context.properties.bind.validation.BindValidationException: 
   Binding validation errors on myapp.mail
   - Field error in object 'myapp.mail' on field 'enabled': rejected value [null]; ...
   - Field error in object 'myapp.mail' on field 'defaultSubject': rejected value []; ...
```

If we need a validation that's not supported by the default bean validation annotations,
we can [create a custom bean validation annotation](/bean-validation-with-spring-boot/#implementing-a-custom-validator).

And if our validation logic is too special for bean validation, we can implement
it in a method annotated with `@PostConstruct` that throws an exception if the validation
fails. 

## Complex Property Types

Most parameters we want to pass into our application are primitive strings or numbers.
In some cases, though, we have a parameter that we'd like to bind to a field in our
`@ConfigurationProperty` class that has a complex datatype like a List.  

### Lists and Sets

Imagine we need to provide a list of SMTP servers to our mail module.
We can simply add a `List` field to our `MailModuleProperties` class:

```java
@ConfigurationProperties(prefix = "myapp.mail")
class MailModuleProperties {

  private List<String> smtpServers;
  
  // getters / setters
  
}
```

Spring Boot automatically fills this list if we use the array notation
in our `application.properties` file:

```properties
myapp.mail.smtpServers[0]=server1
myapp.mail.smtpServers[1]=server2
```

YAML has built-in support for list types, so if we use an
`application.yml` instead, the configuration file we better readable
for us humans:

```yaml
myapp:
  mail:
    smtp-servers:
      - server1
      - server2
```

We can bind parameters to `Set` fields in the same way.

### Durations

Spring Boot has built-in [support for parsing durations](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-external-config.html#boot-features-external-config-conversion-duration)
from a configuration parameter:

```java
@ConfigurationProperties(prefix = "myapp.mail")
class MailModuleProperties {

  private Duration pauseBetweenMails;
  
  // getters / setters
  
}
```

This duration can either be provided as a long to indicate milliseconds or
in a textual, human-readable way that includes the unit 
(one of `ns`, `us`, `ms`, `s`, `m`, `h`, `d`):

```properties
myapp.mail.pause-between-mails=5s
```

### File Sizes 

In a very similar manner, we can provide configuration parameters [that define a 
file size](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-external-config.html#boot-features-external-config-conversion-datasize):

```java
@ConfigurationProperties(prefix = "myapp.mail")
class MailModuleProperties {

  private DataSize maxAttachmentSize;
  
  // getters / setters
  
}
```

The `DataSize` type is provided by the Spring Framework itself. We can now provide
a file size configuration parameter as a long to indicate the number of bytes
or with a unit (one of `B`, `KB`, `MB`, `GB`, `TB`):

```properties
myapp.mail.max-attachment-size=1MB
```

### Custom Types 

In rare cases, we might want to parse a configuration parameter into a custom
value object. Imagine that we want to provide the (hypothetical) 
maximum attachment weight for an email:

```properties
myapp.mail.max-attachment-weight=5kg
```

We want to bind this property to a field of our custom type `Weight`:

```java
@ConfigurationProperties(prefix = "myapp.mail")
class MailModuleProperties {

  private Weight maxAttachmentWeight;
  
  // getters / setters
}
```

There are two light-weight options to make Spring Boot automatically parse the String (`'5kg'`)
into an object of type `Weight`:

* the `Weight` class provides a constructor that takes a single String (`'5kg'`) as an argument, or
* the `Weight` class provides a static `valueOf` method that takes a single String as an argument and
  returns a `Weight` object.

**If we cannot provide a constructor or a `valueOf` method, we're stuck with the slightly
more invasive option of creating a custom converter**:

```java
class WeightConverter implements Converter<String, Weight> {

  @Override
  public Weight convert(String source) {
    // create and return a Weight object from the String
  }

}
```

Once we have created our converter, we have to make it known to Spring Boot: 

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

**It's important to add the `@ConfigurationPropertiesBinding` annotation** to let Spring 
Boot know that this converter is needed during the binding of configuration properties.

<div class="notice success">
  <h4>email Attachments with a Weight?</h4>
  <p>
  Obviously, emails cannot have "real" attachments with a weight. I'm quite aware
  of this. I had a hard time to come up with an example for a custom configuration
  type, though, since this is a rare case indeed.   
  </p>
</div>

## Using the Spring Boot Configuration Processor for Auto-Completion

Ever wanted auto-completion for any of Spring Boot's built-in configuration parameters?
Or your own configuration properties?

Spring Boot provides a configuration processor that collects data from
all `@ConfigurationProperties` annotations it finds in the classpath 
to create a JSON file with some metadata. IDEs can use this JSON file to
provide features like auto-completion.

All we have to do is to add the dependency to the configuration processor to our project
(gradle notation):

```groovy
dependencies {
  ...
  annotationProcessor 'org.springframework.boot:spring-boot-configuration-processor'
}
```

When we build our project, the configuration processor now creates a JSON file that looks
something like this:

```json
{
 "groups": [
   {
     "name": "myapp.mail",
     "type": "io.reflectoring.configuration.mail.MailModuleProperties",
     "sourceType": "io.reflectoring.configuration.mail.MailModuleProperties"
   }
 ],
 "properties": [
   {
     "name": "myapp.mail.enabled",
     "type": "java.lang.Boolean",
     "sourceType": "io.reflectoring.configuration.mail.MailModuleProperties",
     "defaultValue": true
   },
   {
     "name": "myapp.mail.default-subject",
     "type": "java.lang.String",
     "sourceType": "io.reflectoring.configuration.mail.MailModuleProperties"
   }
 ],
 "hints": []
}
```

### IntelliJ

To get auto-completion in IntelliJ, we just install the [Spring Assistant](https://plugins.jetbrains.com/plugin/10229-spring-assistant)
plugin. If we now hit CMD+Space in an `application.properties` or `application.yml`
file, we get an auto-completion popup:

{{% image alt="Auto-Completion in IntelliJ" src="images/posts/spring-boot-configuration-properties/intellij.png" %}}
 
### Eclipse

I'd like to provide information about how to use the auto-completion feature for
configuration properties in Eclipse, but I didn't get it to work. If you have successfully done so, 
please let me know in the comments. I'd love to put that information here.

### Marking a Configuration Property as Deprecated

A nice feature of the configuration processor is that it allows us to mark properties
as deprecated:

```java
@ConfigurationProperties(prefix = "myapp.mail")
class MailModuleProperties {
  
  private String defaultSubject;
  
  @DeprecatedConfigurationProperty(
      reason = "not needed anymore", 
      replacement = "none")
  public String getDefaultSubject(){
    return this.defaultSubject;
  }
  
  // setter
  
}
```

We can simply add the `@DeprecatedConfigurationProperty` annotation to a field
our our `@ConfigurationProperties` class and the configuration processor will
include deprecation information in the meta data:

```json
...
{
  "name": "myapp.mail.default-subject",
  "type": "java.lang.String",
  "sourceType": "io.reflectoring.configuration.mail.MailModuleProperties",
  "deprecated": true,
  "deprecation": {
    "reason": "not needed anymore",
    "replacement": "none"
  }
}
...
```

This information is then provided to us when typing away in the properties file 
(IntelliJ, in this case):

{{% image alt="Deprecated info in auto-completion" src="images/posts/spring-boot-configuration-properties/deprecated.png" %}}

## Conclusion

Spring Boot's `@ConfigurationProperties` annotation is a powerful tool to bind
configuration parameters to type-safe fields in a Java bean. 

Instead of simply creating one configuration bean for our application, we can take
advantage of this feature to create a separate configuration bean for each of
our [modules](/spring-boot-modules/), giving us the flexibility to evolve each module separately not only
in code, but also in configuration. 
