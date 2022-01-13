---
title: "Don't Use the @Profile Annotation in a Spring Boot App!"
categories: ["Spring Boot"]
date: 2021-03-21T00:00:00
modified: 2021-03-21T00:00:00
authors: [tom]
excerpt: "Why using Spring's @Profile annotation is a bad idea and what to do instead."
image: images/stock/0098-profile-1200x628-branded.jpg
url: dont-use-spring-profile-annotation
---

With profiles, Spring (Boot) provides a very powerful feature to configure our applications. Spring also offers the `@Profile` annotation to add beans to the application context only when a certain profile is active. This article is about this `@Profile` annotation, why it's a bad idea to use it, and what to do instead.

## What Are Spring Profiles?

For an in-depth discussion of profiles in Spring Boot, have a look at my ["One-Stop Guide to Profiles with Spring Boot"](/spring-boot-profiles). 

The one-sentence explanation of profiles is this: **when we start a Spring (Boot) application with a certain profile (or number of profiles) activated, the application can react to the activated profiles in some way**.

The main use case for profiles in Spring Boot is to group configuration parameters for different environments into different `application-<profile>.yml` configuration files. Spring Boot will automatically pick up the right configuration file depending on the activated profile and load the configuration properties from that file.

We might have an `application-local.yml` file to configure the application for local development, an `application-staging.yml` file to configure it for the staging environment, and an `application-prod.yml` file to configure it for production.

That's a powerful feature and we should make use of it!

## What's the `@Profile` Annotation?

The `@Profile` annotation is one of the ways to react to an activated profile in a Spring (Boot) application. The other way is to call `Environment.getActiveProfiles()`, which you can read about [here](/spring-boot-profiles/#checking-which-profiles-are-active).

One pattern of using the `@Profile` annotation that I have observed in various projects is replacing "real" beans with mock beans depending on a profile, something like this:

```java
@Configuration
class MyConfiguration {

    @Bean
    @Profile("test")
    Service mockService() {
      return new MockService();
    }
   
    @Bean
    @Profile("!test")
    Service realService(){
      return new RealService();
    }
  
}
```

This configuration adds a bean of type `MockService` to the application context if the `test` profile is active, and a bean of type `RealService` otherwise. 

Another case I often see is this one:

```java
@Configuration
class MyConfiguration {

    @Bean
    @Profile("staging")
    Client stagingClient() {
      return new Client("https://staging.url");
    }
   
    @Bean
    @Profile("prod")
    Client prodClient(){
      return new Client("https://prod.url");
    }
  
}
```

We create a `Client` bean that connects against a different URL depending on the active profile.

I have also seen the `@Profile` annotation used like this:

```java
@Configuration
class MyConfiguration {

    @Bean
    @Profile("postgresql")
    DatabaseService postgresqlService() {
      return new PostgresqlService();
    }
   
    @Bean
    @Profile("h2")
    DatabaseService h2Service(){
      return new H2Service();
    }
    
}
```

If the `postgresql` profile is active, we connect to a "real" PostgreSQL database (assuming the `PostgresqlService` class does that for us). If the `h2` profile is active, we connect to an in-memory H2 database, instead. 

**All of the above patterns are bad. Don't do it at home (or rather, at work)!**

Actually, don't use the `@Profile` annotation at all, if you can avoid it. And I will tell you how to avoid it later.

## What's Wrong with the `@Profile` Annotation?

The main issue I see with the `@Profile` annotation is that **it spreads dependencies to the profiles across the codebase**. 

There probably won't be a single a configuration class where we use `@Profile("test")`, `@Profile("!test")`, `@Profile("postgresql")`, or `@Profile("h2")`. There will be many places, spread across multiple components of our codebase. 

With the `@Profile` annotations spread across the codebase, **we can't see at a glance what effect a particular profile has on our application**. What's more, we don't know what happens if we combine certain profiles.

What happens if we activate the `h2` profile? What happens if we activate the `h2` profile and we *do not* activate the `test` profile? What happens if we activate the `postgresql` profile together with the `test` profile? Will the application still work?

To find out, we have to do a full text search for `@Profile` annotations in our codebase and try to make sense of the configuration. Which no one will do, because it's tedious. Which means that no one will understand the application configuration. In turn, this means that we'll trial-and-error our way through any issues we encounter... .

Using negations like `@Profile("!test")` makes it even worse. We can't even use a full-text search to look for beans that are activated with a certain profile, because the profile is not visible in the code. Instead *we have to know* that we have to search for `!test`, instead. 

You get the gist. And we've only been talking about a couple of different profiles here. Imagine the combinatorial mess when there are more!

## How to Avoid the `@Profile` Annotation?

First of all, say goodbye to profiles like `postgresql`, `h2`, or `enableFoo`. **Profiles should be used for exactly one reason: to create a configuration profile for a runtime environment**. You can read more about when not to use profiles [here](/spring-boot-profiles/#when-not-to-use-profiles).

For each environment the application is going to run in, we create a separate profile. Usually these are variations of the following:

* `local` to configure the application for local development,
* `staging` to configure the application to run in a staging environment, 
* `prod` to configure the application to run in a prod environment,
* and perhaps `test` to configure the application to run in tests. 

There may be more environments, of course, depending on the application and the ecosystem it lives in.

But the idea is that we have an `application-<profile>.yml` configuration file for each profile which contains ALL configuration parameters that are different from the default. 

Then, we can fix the examples from above.

Instead of using `@Profile("test")` and `@Profile("!test")` to load a `MockService` or a `RealService` instance, we add a property to our `application.yml`:

```yml
service.mock: false
```

In `application-test.yml`, we override this property to `true`, to load the mock during testing.

In the code, we do the following:

```java
@Configuration
class MyConfiguration {

    @Bean
    @ConditionalOnProperty(name="service.mock", havingValue="true")
    Service mockService() {
      return new MockService();
    }
   
    @Bean
    @ConditionalOnProperty(name="service.mock", havingValue="false")
    Service realService(){
      return new RealService();
    }
  
}
```

The code doesn't look much different from the original, but what we've achieved is that **we no longer reference the profile in the code**. Instead, we reference a configuration property. This property we can influence from any `application-<profile>.yml` configuration file. We're no longer bound to the `test` profile, but we have fine-grained control over the configuration property that influences mocking of the service.

<div class="notice success">
  <h4>What To Do in a Plain Spring Application?</h4>
  <p>
     The <code>@ConditionalOnProperty</code> annotation is only available in Spring Boot, not in plain Spring. Also, we don't have Spring Boot's powerful configuration features with a different <code>application-&lt;profile&gt;.yml</code> configuration file for each profile. 
  </p>
  <p>
    In a plain Spring application, make sure that you're using profiles only for environment profiles like "local", "staging", and "prod", and not to control features (i.e. no "h2", "postgresql", or "enableFoo" profiles). Then, create a <code>@Configuration</code> class for each profile that's annotated with <code>@Profile("profileName")</code> that contains all beans that are loaded conditionally in that profile. 
  </p>
  <p>
    This means you have to write a bit more code because you have to duplicate some bean definitions across profiles, but you have also centralized the dependency to profiles to a few classes and avoided to spread it across the codebase. Also, you can just search for a profile name and you will find the beans it controls (as long as you don't use negations like <code>@Profile("!test")</code>).
  </p>
</div>

We do a very similar thing in the second example. Instead of hard-coding the staging and production URL of the external resource into the code, we create the property `client.resourceUrl` in `application-staging.yml` and `application-prod.yml` and set its value to the URL we need in the respective environment. Then, we access that configuration property from the code like this:

```java
@Configuration
class MyConfiguration {

    @Bean
    Client client(@Value("${client.resourceUrl}") String resourceUrl) {
      return new Client(resourceUrl);
    }
  
}
```

We have even shaved off a couple lines of code this way, because now we only have one `@Bean`-annotated method instead of two.

We can solve the third example in a similar manner: we create a property `database.mode` and set it to `h2` in `application-local.yml` and to `postgresql` in `application-staging.yml` and `application-prod.yml`. Then, in the code, we reference this new property:

```java
@Configuration
class MyConfiguration {

    @Bean
    DatabaseService databaseService(@Value("${database.mode}") String databaseMode) {
      if ("postgresql".equals(databaseMode)) {
        return new PostgresqlService();
      } else if ("h2".equals(databaseMode)) {
        return new H2Service();
      }
      throw new ConfigurationException("invalid value for 'database.mode': " + databaseMode);
    }
    
}
```

The code looks a bit more complicated because we have introduced an if/else block, but again we have removed the dependency to a specific profile from the code and instead pushed it into the `application-<profile>.yml` configuration files where they belong.

The pattern is this: **every time you want to use `@Profile`, create a configuration property instead**. Then, set the value of that configuration for each environment in the respective `application-<profile>.yml` file. 

This way, **we have a single source of truth for the configuration of each environment** and no longer need to search the codebase for all the `@Profile` annotations and then guess which combinations are valid and which are not.

## Conclusion

Don't use `@Profile`, because it spreads dependencies to profiles all across the codebase. Every time you need a profile-specific configuration, introduce a specific configuration property and control that property for each profile in the respective `application-<profile>.yml` file. 

It will make your team's life easier because you now have a single source of truth for all your configuration properties instead of having to search the codebase every time you want to know how the application is configured.
