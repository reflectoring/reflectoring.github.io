---
title: One-Stop Guide to Profiles with Spring Boot
categories: ["Spring Boot"]
date: 2020-01-02 05:00:00 +1100
modified: 2020-01-02 05:00:00 +1100
excerpt: "Profiles are a mighty tool for configuring Spring and Spring Boot applications. In this article, we discuss how Profiles work, for which use cases they are the right solution, and when we should rather not use them."
image:
  auto: 0056-colors
tags: ["profiles"]
---

Spring provides a mighty tool for grouping configuration properties into so-called profiles, allowing us to activate a bunch of configurations with a single profile parameter. Spring Boot builds on top of that by allowing us to configure and activate profiles externally.

Profiles are perfect for setting up our application for different environments, but they're also tempting in other use cases.

Read on to learn how profiles work, what use cases they support and in which cases we should rather not use them.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/profiles" %}}

## What Do Profiles Control?

Activating a certain profile can have a huge effect on a Spring Boot application, but under the hood, a profile can merely control two things: 

* a profile may influence the application properties, and
* a profile may influence which beans are loaded into the application context.

Let's look at how to do both.

### Profile-Specific Properties

In Spring Boot, we can create a file named `application.yml` that contains configuration properties for our application (we can also use a file named `application.properties`, but I'll only refer to the YAML version from now on).

By default, if an `application.yml` file is found [in the root of the classpath, or next to the executable JAR](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#boot-features-external-config), the properties in this file will be made available in the Spring Boot application context.

**Using profiles, we can create an additional file `application-foo.yml` whose properties will only be loaded when the `foo` profile is active.**

Let's look at an example. We have two YAML files:

```yaml
// application.yml
helloMessage: "Hello!"
```

```yaml
// application-foo.yml
helloMessage: "Hello Foo!"
```

And we have a Bean that takes the `helloMessage` property as a constructor argument:

```java
@Component
class HelloBean {

  private static final Logger logger = ...;

  HelloBean(@Value("${helloMessage}") String helloMessage) {
    logger.info(helloMessage);
  }

}
```

Depending on whether the `foo` profile is active, `HelloBean` will print a different message to the logger.

We can also specify all profiles in a single YAML file called `application.yml` using the multi-document syntax:

```YAML
helloMessage: "Hello!"
---
spring:
    profiles: foo
helloMessage: "Hello Foo!"
```

By specifying the property `spring.profiles` in each section separated by `---` we define the target profile for the properties in that section. If it's missing, the properties belong to the default profile.

I'm a fan of using separate files, however, because it makes it much easier to find properties for a certain profile and even to compare them between profiles. Even the reference manual says that [the multi-document syntax can lead to unexpected behavior](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-external-config-yaml-shortcomings).

### Profile-Specific Beans

With properties, we can already control many things like connection strings to databases or URLs to external systems that should have different values in different profiles.

But with profiles, **we can also control which beans are loaded into Spring's application context**. 

Let's look at an example:

```java
@Component
@Profile("foo")
class FooBean {

  private static final Logger logger = ...;

  @PostConstruct
  void postConstruct(){
    logger.info("loaded FooBean!");
  }

}
```

The `FooBean` is automatically picked up by Spring Boot's classpath scan because we used the `@Component` annotation. But we'll only see the log output in the `postConstruct()` method if the `foo` profile is active. Otherwise, the bean will not be instantiated and not be added to the application context.

It works similarly with beans defined via `@Bean` in a `@Configuration` class:

```java
@Configuration
class BaseConfiguration {

  private static final Logger logger = ...;

  @Bean
  @Profile("bar")
  BarBean barBean() {
    return new BarBean();
  }

}
```

**The factory method `barBean()` will only be called if the `bar` profile is active.** If the profile is not active, there will be no `BarBean` instance available in the application context.

<div class="notice success">
  <h4>Use Profile-Specific Beans Responsibly!</h4>
  <p>
  Adding certain beans to the application context for one profile, but not for another, can quickly add complexity to our application! We always have to pause and think if a bean is available in a particular profile or not, otherwise, this may cause <code>NoSuchBeanDefinitionException</code>s when other beans depend on it! 
  </p>
  <p>
  <strong>Most use cases can and should be implemented using profile-specific properties instead of profile-specific beans.</strong> This makes the configuration of our application easier to understand because everything specific to a profile is collected in a single <code>application.yml</code> file and we don't have to scan our codebase to find out which beans are actually loaded for which profile. 
  </p>
<p>
Read more about why you should avoid the <code>@Profile</code> annotation in <a href="/dont-use-spring-profile-annotation">this article</a>.
</p>
</div>

## How to Activate Profiles?

Spring only acts on a profile if it's activated. Let's look at the different ways to activate a profile. 

### The Default Profile

The `default` profile is always active. Spring Boot loads all properties in `application.yml` into the default profile. We could rename the configuration file to `application-default.yml` and it would work the same. 

**Other profiles will always be evaluated on top of the `default` profile.** This means that if a property is defined in the `default` profile, but not in the `foo` profile, the property value will be populated from the `default` profile. This is very handy for defining default values that are valid across all profiles.

### Via Environment Variable

To activate other profiles than the default profile, we have to let Spring know which profiles we want to activate.

The first way to do this is via the environment variable `SPRING_PROFILES_ACTIVE`:

```text
export SPRING_PROFILES_ACTIVE=foo,bar
java -jar profiles-0.0.1-SNAPSHOT.jar
```

This will activate the profiles `foo` and `bar`.

### Via Java System Property

We can achieve the same using the Java system property `spring.profiles.active`:

```text
java -Dspring.profiles.active=foo -jar profiles-0.0.1-SNAPSHOT.jar
```

If the system property is set, the environment variable `SPRING_PROFILES_ACTIVE` will be ignored. 

It's important to put the `-D...` before the `-jar...`, otherwise the system property won't have an effect.

### Programmatically

We can also influence the profile of our application programmatically when starting the application:

```java
@SpringBootApplication
public class ProfilesApplication {

  public static void main(String[] args) {
    SpringApplication application = 
      new SpringApplication(ProfilesApplication.class);
    application.setAdditionalProfiles("baz");
    application.run(args);
  }

}
```

**This will activate the `baz` profile in addition to all profiles that have been activated by either the environment variable or the system property.**

I can't think of a good use case that justifies this, though. It's always better to configure the application using external environment variables or system properties instead of baking it into the code.

### Activating a Profile in Tests with `@ActiveProfiles`

In tests, using system properties or environment variables to activate a profile would be very awkward, especially if we have different tests that need to activate different profiles.

The Spring Test library gives us the `@ActiveProfiles` annotation as an alternative. We simply annotate our test and the Spring context used for this test will have the specified profiles activated:

```java
@SpringBootTest
@ActiveProfiles({"foo", "bar"})
class FooBarProfileTest {

  @Test
  void test() {
    // test something
  }

}
```

It's important to note that the `@ActiveProfiles` annotation will create a new application context for each combination of profiles that are encountered when running multiple tests. **This means that the application context will not be re-used between tests with different profiles** which will cause longer test times, depending on the size of the application. 

### Checking Which Profiles are Active

To check which profiles are active, we can simply have a look at the log output. Spring Boot logs the active profiles on each application start:

```text
... i.r.profiles.ProfilesApplication: The following profiles are active: foo
```

We can also check which profiles are active programmatically:

```java
@Component
class ProfileScannerBean {

  private static final Logger logger = ...;

  private Environment environment;

  ProfileScannerBean(Environment environment) {
    this.environment = environment;
  }

  @PostConstruct
  void postConstruct(){
    String[] activeProfiles = environment.getActiveProfiles();
    logger.info("active profiles: {}", Arrays.toString(activeProfiles));
  }

}
```

We simply inject the `Environment` into a bean and call the `getActiveProfiles()` method to get all active profiles.

## When To Use Profiles?

Now that we know how to use profiles let's discuss in which cases we should use them.

### Using a Profile for Each Environment

**The prime use case for profiles is configuring our application for one of multiple environments.**

Let's discuss an example.

There might be a `local` environment that configures the application to run on the developer machine. This profile might configure a database url to point to `localhost` instead of to an external database. So we put the `localhost` URL into `application-local.yml`. 

Then, there might be a `prod` profile for the production environment. This profile uses a real database and so we set the database url to connect to the real database in `application-prod.yml`. 

**I would advise putting an invalid value into the default profile** (i.e. into `application.yml`) so that the application fails fast if we forget to override it in a profile-specific configuration. If we put a valid URL like `test-db:1234` into the default profile we might get an ugly surprise when we forget to override it and the production environment unknowingly connects to the test database....

Our configuration files then might look like this:

```yaml
# application.yml
database-url: "INVALID!"

# application-local.yml
database-url: "localhost:1234"

# application-prod.yml
database-url: "the-real-db:1234"
```

For each environment, we now have a pre-configured set of properties that we can simply activate using [one of the methods above](#how-to-activate-profiles).

### Using a Profile for Tests

Another sensible use case for profiles is creating a `test` profile to be used in [Spring Boot integration tests](/spring-boot-test/). All we have to do to activate this profile in a test is to annotation the test class with `@ActiveProfiles("test")` and everything is set up for the test.

Using the same properties as above, our `application-test.yml` might look like this:

```yaml
# application-test.yml
database-url: "jdbc:h2:mem:testDB"
```

We have set the database url to point to an in-memory database that is used during tests.

Basically, we have created an additional environment called `test`. 

If we have a set of integration tests that interact with a test database, we might also want to create a
 separate `integrationTest` profile pointing to a different database:

```yaml
# application-integrationTest.yml
database-url: "the-integration-db:1234"
```

<div class="notice success">
  <h4>Don't Re-Use Environments for Tests!</h4>
  <p>
  Don't re-use another environment (like `local`) for tests, even if the properties are the same. In this case, copy <code>application-local.yml</code> into <code>application-test.yml</code> and use the <code>test</code> profile. The properties <em>will</em> diverge at some point and we don't want to have to search which property values belong into which profile then!
  </p>
</div>

## When Not to Use Profiles?

Profiles are powerful and we might be tempted to use them for other use cases than the ones described above. Here's my take on why that is a bad idea more often than not.

### Don't Use Profiles For "Application Modes"

This is probably debatable because profiles seem to be a perfect solution to this, but I would argue not to use profiles to create different "modes" of an application.

For example, our application could have a master mode and a worker mode. We'd create a `master` and a `worker` profile and add different beans to the application context depending on these profiles:

```java
@Configuration
@Profile("master")
public class MasterConfiguration {
  // @Bean definitions needed for a master
}

@Configuration
@Profile("worker")
public class WorkerConfiguration {
  // @Bean definitions needed for a worker
}
```

In a different use case, our application might have a mock mode, to be used in tests, that mocks all outgoing HTTP calls instead of calling the real services. We'd have a `mock` profile that replaces our output ports with mocks:

```java
@Configuration
class BaseConfiguration {
  
  @Profile("mock")
  OutputPort mockedOutputPort(){
    return new MockedOutputPort();
  }
  
  @Profile("!mock")
  OutputPort realOutputPort(){
    return new RealOutputPort();
  }

}
```

So, why do I consider this to be problematic?

First, **we have to look into the code to see which profiles are available and what they do**. That is if we haven't documented them outside of the code, but who does that, right? We see these `@Profile` annotations in the code and ask ourselves what this profile does exactly. Each time. Better to use a set of properties that are clearly documented in `application.yml` and can be overridden for a specific environment or a specific test. 

Second, **we have a combinatorial effect when using profiles for multiple application modes**. Which combinations of modes are compatible? Does the application still work when we combine the `worker` profile with the `mock` profile? What happens if we activate the `master` *and* the `worker` profile at the same time? We're more likely to understand the effect of these combinations if we're looking at them at a property level instead of at a profile level. So, again, a set of central properties in `application.yml` for the same effect is easier to grasp.

The final reason why I find this problematic is that **we're creating a different application with each profile**! Each "mode" of the application needs to be tested with each valid combination of other "modes". It's easy to forget to test a specific combination of modes if they're not aligned with the environment profiles.  

### Don’t Use Profiles For Feature Flags

For similar reasons, I believe that we shouldn't use profiles for feature flags.

A feature flag is an on/off switch for a specific feature. We could model this as a profile `enable-foo` that controls the loading of a couple beans. 

But if we use feature flags for what they're intended (i.e. to enable trunk-based development and speed up our deployments), we're bound to collect a bunch of feature flags over time. If we create a profile for each profile, **we'll be drowning in the combinatorial hell I described in the previous section**.

Also, **profiles are too cumbersome to evaluate at runtime**. To check if a feature is enabled or disabled, we'll have to use if/else blocks more often than not and to call `environment.getActiveProfiles()` for this check is awkward at best. 

Better to configure a boolean property for each feature and inject it into our beans with `@Value("${feature.foo.enabled}") boolean featureEnabled`.

Feature flags should be a simple property with a very narrow scope instead of an application-wide profile. Better yet, use a dedicated feature flag tool.

### Don’t Use Profiles That Align With Environments

I've seen profiles like `test-db` (configures a database to be used in tests) and `local-only` (configures who knows what for local testing). These profiles clearly align with the `test` and the `local` environment, respectively. So, the database configuration in the `test-db` profile should move into the `test` profile, and the configuration in the `local-only` profile should move into the `local` profile.

As a general rule, profiles that contain the name of an environment in their name should be consolidated into a single profile with the name of that environment to reduce combinatorial effects. **A few environment profiles are much easier to maintain than many profiles that we have to combine to create a valid environment configuration**.

### Don’t Use `spring.profiles.active` In `application.yml`!

As we've seen above, [profiles are activated using the `spring.profiles.active` property](#how-to-activate-profiles). This is useful for external configuration via environment variable or similar. 

We could also add the property `spring.profiles.active` to one of our `application.yml` files to activate a certain set of profiles by default.

This only works in the default `application.yml` file, however, and not in the profile-specific `application-<profile>.yml` files. Otherwise, in a profile, we could activate another set of profiles, which could activate another set of profiles, which could activate another set of profiles until no one knows where those profiles come from anymore. Spring Boot doesn't support this profile-ception, and that's a good thing!

So, using `spring.profiles.active` might lead to misunderstandings when developers expect `spring.profiles.active` to work in profile-specific YAML files. 

Also, activating a profile in `application.yml` would make it active by default. **If it's active by default, why would we need a profile for it**? 

## Conclusion

Profiles are a great tool to provide configuration properties for different environments like local development and a test, staging, and production environment. We create a set of properties we need, apply different values to those properties depending on the environment and activate the profile via command-line parameter or environment variable. In my opinion, this is the best (and should be the only) use of profiles.

As soon as we use profiles for different things like feature flags or application modes, things might get hard to understand and hard to maintain very quickly.

You can find the example code from this article on [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/profiles).

Use profiles for environments and think very hard before using a profile for something different.