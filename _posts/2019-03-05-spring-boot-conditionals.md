---
title: "Conditional Beans with Spring Boot"
categories: [spring-boot]
modified: 2019-03-07
excerpt: "An overview of Spring Boot's @ConditionalOn... annotations and when it makes sense to use them."
image: 0017-coffee-beans
---



When building a Spring Boot app, we sometimes want to **only load beans or [modules](/spring-boot-modules/) into the application 
context if some condition is met**. Be it to disable some beans during tests or to react to a certain
property in the runtime environment. 

Spring has introduced the `@Conditional` annotation that allows us to define custom conditions
to apply to parts of our application context. Spring Boot builds on top of that and provides 
some pre-defined conditions so we don't have to implement them ourselves.

In this tutorial, we'll have a look some use cases that explain why we would need conditionally
loaded beans at all. Then, we'll see how to apply conditions and which conditions Spring Boot
offers. To round things up, we'll also implement a custom condition. 

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/conditionals" %}

## Why do we need Conditional Beans?

A Spring application context contains an object graph that makes up all the beans that our
application needs at runtime. Spring's `@Conditional` annotation allows us to define
conditions under which a certain bean is included into that object graph.

Why would we need to include or exclude beans under certain conditions?

In my experience, the most common use case is that **certain beans don't work in a test environment**. 
They might require a connection to a remote system or an application server that
is not available during tests. So, we want to [modularize our tests](/testing-verticals-and-layers-spring-boot/)
to exclude or replace these beans during tests.

Another use case is that we want **to enable or disable a certain cross-cutting concern**.
Imagine that [we have built a module](/spring-boot-modules/) that configures security. During developer tests,
we don't want to type in our usernames and passwords every time, so we flip a
switch and disable the whole security module for local tests.

Also, we might want to load certain beans only **if some external resource 
is available** without which they cannot work. For instance, we want to configure
our Logback logger only if a `logback.xml` file has been found on the classpath.

We'll see some more use cases in the discussion below.

## Declaring Conditional Beans

Anywhere we define a Spring bean, we can optionally add a condition. Only if this
condition is satisfied will the bean be added to the application context.
To declare a condition, we can use any of the `@Conditional...` annotations
that are described [below](#pre-defined-conditions).

But first, let's look at how to apply a condition to a certain Spring bean.

### Conditional `@Bean`

If we add a condition to a single `@Bean` definition, this bean is only 
loaded if the condition is met:

```java
@Configuration
class ConditionalBeanConfiguration {

  @Bean
  @Conditional... // <--
  ConditionalBean conditionalBean(){
    return new ConditionalBean();
  };
}
```

### Conditional `@Configuration`

If we add a condition to a Spring `@Configuration`, all beans contained
within this configuration will only be loaded if the condition is met: 

```java
@Configuration
@Conditional... // <--
class ConditionalConfiguration {
  
  @Bean
  Bean bean(){
    ...
  };
  
}
```

### Conditional `@Component`

Finally, we can add a condition to any bean declared with one of the stereotype
annotations `@Component`, `@Service`, `@Repository`, or `@Controller`:

```java
@Component
@Conditional... // <--
class ConditionalComponent {
}
```

## Pre-Defined Conditions

Spring Boot offers some pre-defined `@ConditionalOn...` annotations that 
we can use out-of-the box. Let's have a look at each one in turn.

### `@ConditionalOnProperty`

The `@ConditionalOnProperty` annotation is, in my experience, the most commonly used conditional
annotation in Spring Boot projects. It allows to load beans conditionally depending on
a certain environment property:

```java
@Configuration
@ConditionalOnProperty(
    value="module.enabled", 
    havingValue = "true", 
    matchIfMissing = true)
class CrossCuttingConcernModule {
  ...
}
```

The `CrossCuttingConcernModule` is only loaded if the `module.enabled` property has the value `true`.
If the property is not set at all, it will still be loaded, because we have defined `matchIfMissing`
as `true`. **This way, we have created a module that is loaded by default until we decide otherwise**.

In the same way we might create other modules for cross-cutting concerns like security or
scheduling that we might want to disable in a certain (test) environment.

### `@ConditionalOnExpression`

If we have a more complex condition based on multiple properties, we can use `@ConditionalOnExpression`:

```java
@Configuration
@ConditionalOnExpression(
    "${module.enabled:true} and ${module.submodule.enabled:true}"
)
class SubModule {
  ...
}
```

The `SubModule` is only loaded if both properties `module.enabled` and `module.submodule.enabled`
have the value `true`. By appending `:true` to the properties we tell Spring to use `true` 
as a default value in the case the properties have not been set. We can use the full extend of
the [Spring Expression Language](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#expressions).

This way we can, for instance, **create sub modules that should be disabled if the
parent module is disabled, but can also be disabled if the parent module is enabled**.

### `@ConditionalOnBean` 

Sometimes, we might want to load a bean only if a certain other bean is available in 
the application context:

```java
@Configuration
@ConditionalOnBean(OtherModule.class)
class DependantModule {
  ...
}
```

The `DependantModule` is only loaded if there is a bean of class `OtherModule` in the application
context. We could also define the bean name instead of the bean class.

**This way, we can define dependencies between certain modules**, for example. One module
is only loaded if a certain bean of another module is available.

### `@ConditionalOnMissingBean`
Similarly, we can use `@ConditionalOnMissingBean` if we want to load a bean only if a certain
other bean is *not* in the application context:

```java
@Configuration
class OnMissingBeanModule {

  @Bean
  @ConditionalOnMissingBean
  DataSource dataSource() {
    return new InMemoryDataSource();
  }
}
```

In this example, **we're only injecting an in-memory datasource into the application context
if there is not already a datasource available**. This is very similar to what Spring Boot
does internally to provide an in-memory database in a test context.

### `@ConditionalOnResource`

If we want to load a bean depending on the fact that a certain resource is available on
the class path, we can use `@ConditionalOnResource`: 

```java
@Configuration
@ConditionalOnResource(resources = "/logback.xml")
class LogbackModule {
  ...
}
```

The `LogbackModule` is only loaded if the logback configuration file was found on the
classpath. This way, **we might create similar modules that are only loaded if their
respective configuration file has been found**.

### Other Conditions

The conditional annotations described above are the more common ones that we might use 
in any Spring Boot application. Spring Boot provides even more conditional annotations. 
They are, however, not as common and some are more suited for framework development rather 
than application development (Spring Boot uses some of them heavily under the covers).
So, let's only have a brief look at them here.


**`@ConditionalOnClass`**  

Load a bean only if a certain class is on the classpath:

```java
@Configuration
@ConditionalOnClass(name = "this.clazz.does.not.Exist")
class OnClassModule {
  ...
}
```

**`@ConditionalOnMissingClass`**

Load a bean only if a certain class is *not* on the classpath:

```java
@Configuration
@ConditionalOnMissingClass(value = "this.clazz.does.not.Exist")
class OnMissingClassModule {
  ...
}
```

**`@ConditionalOnJndi`**

Load a bean only if a certain resource is available via JNDI:

```java
@Configuration
@ConditionalOnJndi("java:comp/env/foo")
class OnJndiModule {
  ...
}

```

**`@ConditionalOnJava`**

Load a bean only if running a certain version of Java:

```java
@Configuration
@ConditionalOnJava(JavaVersion.EIGHT)
class OnJavaModule {
  ...
}
```

**`@ConditionalOnSingleCandidate`**

Similar to `@ConditionalOnBean`, but will only load a bean if a single candidate for the
given bean class has been determined. There probably isn't a use case outside of
auto-configurations:

```java
@Configuration
@ConditionalOnSingleCandidate(DataSource.class)
class OnSingleCandidateModule {
  ...
}
```

**`@ConditionalOnWebApplication`**

Load a bean only if we're running inside a web application:

```java
@Configuration
@ConditionalOnWebApplication
class OnWebApplicationModule {
  ...
}
``` 

**`@ConditionalOnNotWebApplication`**

Load a bean only if we're *not* running inside a web application:

```java
@Configuration
@ConditionalOnNotWebApplication
class OnNotWebApplicationModule {
  ...
}
```

**`@ConditionalOnCloudPlatform`**

Load a bean only if we're running on a certain cloud platform:

```java
@Configuration
@ConditionalOnCloudPlatform(CloudPlatform.CLOUD_FOUNDRY)
class OnCloudPlatformModule {
  ...
}
```

## Custom Conditions 

Aside from the conditional annotations, we can create our own and combine multiple conditions 
with logical operators.

### Defining a Custom Condition

Imagine we have some Spring beans that talk to the operating system natively. These
beans should only be loaded if we're running the application on the respective operating
system. 

Let's implement a condition that loads beans only if we're running the code on a unix
machine. For this, we implement Spring's [`Condition`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Condition.html)
interface:

```java
class OnUnixCondition implements Condition {

  @Override
    public boolean matches(
        ConditionContext context, 
        AnnotatedTypeMetadata metadata) {
  	  return SystemUtils.IS_OS_LINUX;
    }
}
```

We simply use Apache Commons' `SystemUtils` class to determine if we're running on a unix-like 
system. If needed, we could include more sophisticated logic that uses information about the current 
application context (`ConditionContext`) or about the annotated class (`AnnotatedTypeMetadata`).

The condition is now ready to be used in combination with Spring's `@Conditional` annotation:

```java
@Bean
@Conditional(OnUnixCondition.class)
UnixBean unixBean() {
  return new UnixBean();
}
```

### Combining Conditions with OR

If we want to combine multiple conditions into a single condition 
with the logical "OR" operator, we can extend `AnyNestedCondition`:

```java
class OnWindowsOrUnixCondition extends AnyNestedCondition {

  OnWindowsOrUnixCondition() {
    super(ConfigurationPhase.REGISTER_BEAN);
  }

  @Conditional(OnWindowsCondition.class)
  static class OnWindows {}

  @Conditional(OnUnixCondition.class)
  static class OnUnix {}

}
```

Here, we have created a condition that is satisfied if the application runs on windows 
or unix. 

The `AnyNestedCondition` parent class will evaluate the `@Conditional` annotations on the
methods and combine them using the OR operator.

We can use this condition just like any other condition:

```java
@Bean
@Conditional(OnWindowsOrUnixCondition.class)
WindowsOrUnixBean windowsOrUnixBean() {
  return new WindowsOrUnixBean();
}
```

<div class="notice--success">
  <h4>Is your <code>AnyNestedCondition</code> or <code>AllNestedConditions</code> not working?</h4>
  <p>
  Check the <code>ConfigurationPhase</code> parameter passed into <code>super()</code>. If you want
  to apply your combined condition to <code>@Configuration</code> beans, use the value 
  <code>PARSE_CONFIGURATION</code>. If you want to apply the condition to simple beans,
  use <code>REGISTER_BEAN</code> as shown in the example above. Spring Boot needs to make
  this distinction so it can apply the conditions at the right time during application
  context startup.   
  </p>
</div> 

### Combining Conditions with AND

If we want to combine conditions with "AND" logic, **we can simply use multiple 
`@Conditional...` annotations** on a single bean. They will automatically be combined with the
 logical "AND" operator so that if at least one condition fails, the bean will not be loaded:

```java
@Bean
@ConditionalOnUnix
@Conditional(OnWindowsCondition.class)
WindowsAndUnixBean windowsAndUnixBean() {
  return new WindowsAndUnixBean();
}
```

This bean should never load, unless someone has created a Windows / Unix hybrid 
that I'm not aware of. 

Note that the `@Conditional` annotation cannot be used more than once on a single
method or class. So, if we want to combine multiple annotations this way, we 
have to use custom `@ConditionalOn...` annotations, which do not have this
restriction. [Below](#defining-a-custom-conditionalon-annotation),
 we'll explore how to create the `@ConditionalOnUnix` annotation.

Alternatively, if we want to combine conditions with AND into a single 
`@Conditional` annotation, we can extend Spring Boot's `AllNestedConditions`
class which works exactly the same as `AnyNestedConditions` described above. 

### Combining Conditions with NOT

Similar to `AnyNestedCondition` and `AllNestedConditions`, we can extend
`NoneNestedCondition` to only load beans if NONE of the combined
conditions match.

### Defining a Custom @ConditionalOn... Annotation

We can create a custom annotation for any condition. We simply need to 
meta-annotate this annotation with `@Conditional`:

```java
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(OnLinuxCondition.class)
public @interface ConditionalOnUnix {}
```

Spring will evaluate this meta annotation when we annotate a bean with our new annotation:

```java
@Bean
@ConditionalOnUnix
LinuxBean linuxBean(){
  return new LinuxBean();
}
```

## Conclusion

With the `@Conditional` annotation and the possibility to create custom `@Conditional...`
annotations, Spring already gives us a lot of power to control
the content of our application context. 

Spring Boot builds on top of that by bringing some convenient `@ConditionalOn...` annotations 
to the table and by allowing us to combine conditions using `AllNestedConditions`,
`AnyNestedCondition` or `NoneNestedCondition`. These tools allow us to [modularize our 
production code](/spring-boot-modules/) as well as [our tests](/testing-verticals-and-layers-spring-boot/).

With power comes responsibility, however, so we should take care not to litter
our application context with conditions, lest we lose track of what
is loaded when.

The code for this article is available [on github](https://github.com/thombergs/code-examples/tree/master/spring-boot/conditionals).  
