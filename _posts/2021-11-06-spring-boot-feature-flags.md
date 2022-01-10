---
title: "Feature Flags with Spring Boot"
categories: ["Spring Boot"]
date: 2021-11-06 00:00:00 +1100 
modified: 2021-11-06 00:00:00 +1100 
excerpt: "Feature flags don't need to be simple if/else blocks. Instead, we can replace whole methods or even whole beans with a bit of Spring Boot magic."
image: images/stock/0112-decision-1200x628-branded.jpg
---

Feature flags are a great tool to improve confidence in deployments and to avoid impacting customers with unintended
changes.

Instead of deploying a new feature directly to production, we "hide" it behind an if/else statement in our code that
evaluates a feature flag. Only if the feature flag is enabled, will the user see the change in production.

By default, feature flags are disabled so that we can deploy with the confidence of knowing that nothing will change for
the users until we flip the switch.

Sometimes, however, new features are a bit bigger and a single if/else statement is not the right tool to feature flag
the change. Instead, we want to replace a whole method, object, or even a whole module with the flip of a feature flag.

**This tutorial introduces several ways of feature flagging code in a Spring Boot app.**

If you are interested in feature flags in general, I recently wrote about
using [different feature flagging tools](/java-feature-flags/)
and [how to do zero-downtime database changes](/zero-downtime-deployments-with-feature-flags/)
with feature flags.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/feature-flags" %}}

## Simple `if/else`

Let's start with the simplest way of feature flagging a change: the if/else statement.

Say we have a method `Service.doSomething()` that should return a different value depending on a feature flag. This is what it would look like:

```java
@Component
class Service {

  private final FeatureFlagService featureFlagService;

  public Service(FeatureFlagService featureFlagService) {
    this.featureFlagService = featureFlagService;
  }

  public int doSomething() {
    if (featureFlagService.isNewServiceEnabled()) {
      return "new value";
    } else {
      return "old value";
    }
  }
}
```

We have a `FeatureFlagService` that we can ask if a certain feature flag is enabled. This service is backed by a feature flagging tool like [LaunchDarkly](https://launchdarkly.com) or [Togglz](https://www.togglz.org/) or it may be a homegrown implementation.

In our code, we simply ask the `FeatureFlagService` if a certain feature is enabled, and return a value depending on whether the feature is enabled or not.

That's pretty straightforward and doesn't even rely on any specific Spring Boot features. Many new changes are small enough to be introduced with a simple if/else block.

Sometimes, however, a change is bigger than that. We would have to add multiple if/else blocks across the codebase and that would unnecessarily pollute the code.

In this case, we might want to replace a whole method instead.

## Replacing a Method

If we have a bigger feature or simply don't want to sprinkle feature flags all over the code of a long method, we can replace a whole method with a new method. 

If you want to play along, have a look at the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/feature-flags/src/main/java/io/reflectoring/featureflags/patterns/replacemethod).

Say we have a class called `OldService` that implements two methods:

```java
@Component
class OldService {
  
  public String doSomething() {
    return "old value";
  }

  public int doAnotherThing() {
    return 2;
  }
}
```

We want to replace the `doSomething()` method with a new method that is only active behind a feature flag.

### Introduce an Interface

The first thing we do is to introduce an interface for the method(s) that we want to make feature flaggable:

```java
interface Service {

  String doSomething();

}

@Component
class OldService {

  @Override
  public String doSomething() {
    return "old value";
  }

  public int doAnotherThing() {
    return 2;
  }
}
```

Notice that the interface only declares the `doSomething()` method and not the other method, because we only want to make this one method flaggable.

### Put the New Feature Behind the Interface
Then, we create a class called `NewService` that implements this interface as well:

```java
@Component
class NewService implements Service {
  
  @Override
  public String doSomething() {
    return "new value";
  }
}
```

This class defines the new behavior we want to see, i.e. the behavior that will be activated when we activate the feature flag.

Now we have two classes `OldService` and `NewService` implementing the `doSomething()` method and we want to toggle between those two implementations with a feature flag.

### Implement a Feature Flag Proxy

For this, we introduce a third class named `FeatureFlaggedService` that also implements our `Service` interface:

```java
@Component
@Primary
class FeatureFlaggedService implements Service {

  private final FeatureFlagService featureFlagService;
  private final NewService newService;
  private final OldService oldService;

  public FeatureFlaggedService(
          FeatureFlagService featureFlagService, 
          NewService newService, 
          OldService oldService) {
    this.featureFlagService = featureFlagService;
    this.newService = newService;
    this.oldService = oldService;
  }

  @Override
  public String doSomething() {
    if (featureFlagService.isNewServiceEnabled()) {
      return newService.doSomething();
    } else {
      return oldService.doSomething();
    }
  }

}
```

This class takes an instance of `OldService` and an instance of `NewService` and acts as a proxy for the `doSomething()` method. 

If the feature flag is enabled, `FeatureFlaggedService.doSomething()` will call the `NewService.doSomething()`, otherwise it will stick to the old service's implementation `OldService.doSomething()`. 

### Replacing a Method in Action

To demonstrate how we would use this code in a Spring Boot project, have a look at the following integration test:

```java
@SpringBootTest
public class ReplaceMethodTest {

  @MockBean
  private FeatureFlagService featureFlagService;

  @Autowired
  private Service service;

  @Autowired
  private OldService oldService;

  @BeforeEach
  void resetMocks() {
    Mockito.reset(featureFlagService);
  }

  @Test
  void oldServiceTest() {
    given(featureFlagService.isNewServiceEnabled()).willReturn(false);
    assertThat(service.doSomething()).isEqualTo("old value");
    assertThat(oldService.doSomethingElse()).isEqualTo(2);
  }

  @Test
  void newServiceTest() {
    given(featureFlagService.isNewServiceEnabled()).willReturn(true);
    assertThat(service.doSomething()).isEqualTo("new value");
    // doSomethingElse() is not behind a feature flag, so it 
    // should return the same value independent of the feature flag
    assertThat(oldService.doSomethingElse()).isEqualTo(2);
  }

}
```

In this test, we mock the `FeatureFlagService` so that we can define the feature flag state to be either enabled or disabled. 

We let Spring autowire a bean of type `Service` and a bean of type `OldService`. 

The injected `Service` bean will be backed by the `FeatureFlaggedService` bean because we have marked it as `@Primary` above. That means Spring will pick the `FeatureFlaggedService` bean over the `OldService` and `NewService` beans, which are also implementations of `Service` and which are also available in the application context (because they are both annotated with `@Component` above).

In `oldServiceTest()`, we disable the feature flag and make sure that `service.doSomething()` returns the value calculated by the `OldService` bean. 

In `newServiceTest()`, we enable the feature flag and assert that `service.doSomething()` now returns the value calculated by the `NewService` bean. We also check that `oldService.doSomethingElse()` still returns the old value, because this method is not backed by the feature flag and thus shouldn't be affected by it.

**To recap, we can introduce an interface for the method(s) that we want to put behind a feature flag and implement a "proxy" bean that switches between two (or more) implementations of that interface**.

Sometimes, changes are even bigger and we would like to replace a whole bean instead of just a method or two, though.

## Replacing a Spring Bean

If we want to replace a whole bean depending on a feature flag evaluation, we could use the method described above and create a proxy for all methods of the bean. 

However, that would require a lot of boilerplate code, especially if we're using this pattern with multiple different services. 

With the `FactoryBean` concept, Spring provides a more elegant mechanism to replace a whole bean.

Again, we have two beans, `OldService` and `NewService` implementing the `Service` interface:

{{% image alt="Two beans implementing the same interface" src="images/posts/spring-boot-feature-flags/services.png" %}}

We now want to completely replace the `OldService` bean with the `NewService` bean depending on the value of a feature flag. And we want to be able to do this in an ad-hoc fashion, without having to restart the application!

If you want to have a look at the code, it's [on GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/feature-flags/src/main/java/io/reflectoring/featureflags/patterns/replacebean).

### Implementing a `FeatureFlagFactoryBean`

We'll take advantage of Spring's `FactoryBean` concept to replace one bean with another.

A `FactoryBean` is a special bean in Spring's application context. Instead of contributing itself to the application context, as normal beans annotated with `@Component` or `@Bean` do, it contributes a bean of type `<T>` to the application context. 

Each time a bean of type `<T>` is required by another bean in the application context, Spring will ask the `FactoryBean` for that bean. 

We can leverage that to check for the feature flag value each time the `FactoryBean` is asked for a bean of type `Service`, and then return the `NewService` or `OldService` bean depending on the feature flag value.

The implementation of our `FactoryBean` looks like this:

```java
public class FeatureFlagFactoryBean<T> implements FactoryBean<T> {

  private final Class<T> targetClass;
  private final Supplier<Boolean> featureFlagEvaluation;
  private final T beanWhenTrue;
  private final T beanWhenFalse;

  public FeatureFlagFactoryBean(
          Class<T> targetClass, 
          Supplier<Boolean> featureFlagEvaluation, 
          T beanWhenTrue, 
          T beanWhenFalse) {
    this.targetClass = targetClass;
    this.featureFlagEvaluation = featureFlagEvaluation;
    this.beanWhenTrue = beanWhenTrue;
    this.beanWhenFalse = beanWhenFalse;
  }

  @Override
  public T getObject() {
    InvocationHandler invocationHandler = (proxy, method, args) -> {
      if (featureFlagEvaluation.get()) {
        return method.invoke(beanWhenTrue, args);
      } else {
        return method.invoke(beanWhenFalse, args);
      }
    };

    Object proxy = Proxy.newProxyInstance(
            targetClass.getClassLoader(), 
            new Class[]{targetClass}, 
            invocationHandler);

    return (T) proxy;
  }

  @Override
  public Class<?> getObjectType() {
    return targetClass;
  }
}
```

Let's look at what the code does:

* We implement the `FactoryBean<T>` interface, which requires us to implement the `getObject()` and `getObjectType()` methods.
* In the constructor, we pass a `Supplier<Boolean>` that evaluates if a feature flag is true or false. We must pass a callback like this instead of just passing the value of the feature flag because the feature flag value can change over time! 
* In the constructor, we also pass two beans of type `<T>`: one to use when the feature flag is true (`beanWhenTrue`), another for when it's false (`beanWhenFalse`).
* The interesting bit happens in the `getObject()` method: here we use Java's built-in `Proxy` feature to create a proxy for the interface of type `T`. Every time a method on the proxy gets called, it decides based on the feature flag which of the beans to call the method on.

The TL;DR is that the `FeatureFlagFactoryBean` returns a proxy that forwards method calls to one of two beans, depending on a feature flag. **This works for all methods declared on the generic interface of type `<T>`**.

### Adding the Proxy to the Application Context

Now we have to put our new `FeatureFlagFactoryBean` into action. 

Instead of adding our `OldService` and `NewService` beans to Spring's application context, we will add a single factory bean like this:

```java
@Component
class FeatureFlaggedService extends FeatureFlagFactoryBean<Service> {

  public FeatureFlaggedService(FeatureFlagService featureFlagService) {
    super(
        Service.class,
        featureFlagService::isNewServiceEnabled,
        new NewService(),
        new OldService());
  }
}
```

We implement a bean called `FeatureFlaggedService` that extends our `FeatureFlagFactoryBean` from above. It's typed with `<Service>`, so that the factory bean knows which interface to proxy.

In the constructor, we pass the feature flag evaluation function, a `NewService` instance for when the feature flag is `true`, and an `OldService` instance for when the feature flag is `false`.

Note that the `NewService` and `OldService` classes are no longer annotated with `@Component`, so that our factory bean is the only place that adds them to Spring's application context.

### Replacing a Spring Bean in Action

To show how this works in action, let's take a look at this integration test:

```java
@SpringBootTest
public class ReplaceBeanTest {

  @MockBean
  private FeatureFlagService featureFlagService;

  @Autowired
  private Service service;

  @BeforeEach
  void resetMocks() {
    Mockito.reset(featureFlagService);
  }

  @Test
  void oldServiceTest() {
    given(featureFlagService.isNewServiceEnabled()).willReturn(false);
    assertThat(service.doSomething()).isEqualTo("old value");
  }

  @Test
  void newServiceTest() {
    given(featureFlagService.isNewServiceEnabled()).willReturn(true);
    assertThat(service.doSomething()).isEqualTo("new value");
  }

}
```

We let Spring inject a bean of type `Service` into the test. This bean will be backed by the proxy generated by our `FeatureFlagFactoryBean`.

In `oldServiceTest()` we disable the feature flag and assert that the `doSomething()` method returns the value provided by `OldService`.

In `newServiceTest()` we enable the feature flag and assert that the `doSomething()` method returns the value provided by `NewService`.


## Make Features Evident in Your Code

This article has shown that you don't need to sprinkle messy `if/else` statements all over your codebase to implement feature flags.

Instead, make the features evident in your code by creating interfaces and implementing them in different versions. 

This allows for simple code, easy switching between implementations, easier-to-understand code, quick cleanup of feature flags, and fewer headaches when deploying features into production.

The code from this article (and other articles on feature flags) is available [on GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/feature-flags) for browsing and forking.

