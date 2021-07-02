---
title: "Feature Flagging in Java - Should I Use Togglz or LaunchDarkly?"
categories: [java]
date: 2021-06-23 00:00:00 +1100
modified: 2021-06-23 00:00:00 +1100
author: default
excerpt: ""
image:
  teaser: /assets/img/special/robot-arena.jpg
  opengraph: /assets/img/special/robot-arena.jpg
---

With feature flags, we can reduce the risk of rolling out software changes to a minimum. We deploy the software with the changes, but the changes are behind a (deactivated) feature flag. After successful deployment, we can choose when and for which users to activate the feature. 

By reducing the deployment risk, feature flags are a main driver of DevOps metrics like lead time and deployment frequency - which are proven to have a positive impact on organizational performance (see my book notes on "[Accelerate](https://reflectoring.io/book-review-accelerate/)"). 

In this article, **we're going to compare some tools that support feature flagging in Java**. This will help you decide which tool fits your needs.

## Feature Flagging Use Cases

Before we dive into the tools, let's take a look at some common feature flagging use cases. We'll try to implement each of these use cases with each of the feature flag tools so we get a feeling which one is best in which context.

There are more than the use cases discussed in this article, of course. The idea is to look at the most common use cases to compare what the different feature flagging tools can do.

### Use Case 1: Global Rollout

This is the simplest feature flag possible. We want to enable or disable a certain feature for all users. 

We deploy a new version of the application with a deactivated feature and after successful deployment, we activate (roll out) the feature for all users. We can later decide to deactivate it again - also for all users:

![A global rollout](/assets/img/posts/feature-flag-tools/global-feature-flag.png)

### Use Case 2: Percentage Rollout 

The global rollout use case is very simple and raises the question of why we would even need a feature flagging tool because we could just implement it ourselves.

A percentage rollout is another very common rollout strategy in which we activate a feature for a small percentage of users first, to see if it's working as expected, and then ramp up the percentage over days or weeks until the feature is active for all users: 

![A percentage rollout](/assets/img/posts/feature-flag-tools/percentage-rollout.png)

Important in this use case is that a user stays in the same cohort over time. It's not enough to just enable a feature for 20% of the *requests*, because a user could make multiple requests and have the feature enabled for some requests and disabled for others - which would be a rather awkward user experience. So, the evaluation of the feature flag has to take the user into account.

Also, if the percentage is increased from 20% to 30%, the new 30% cohort should include the previous 20% cohort so the feature is not suddently deactivated for the early adopters. 

You can see that we don't really want to implement this ourselves from scratch.

### Use Case 3: Rollout Based on User Attributes

The last use case we're going to look at is a targeted rollout based on a user attribute or behavior. A user attribute can be anything: the location of the user, demographic information, or attributes that are specific to our application like "the user has done a specific thing in our application".

In our example, we'll activate a certain feature after a user has clicked a certain button:

![A rollout based on user attributes](/assets/img/posts/feature-flag-tools/user-attribute-rollout.png)

Our application will set the user's `clicked` attribute to `true` after clicking the button. The feature flagging tool should take this attribute into account when evaluating the feature flag.

## Togglz

Togglz is a Java library that we can include into our application. The concepts of the library rotate around the `FeatureManager` class:

![Togglz concepts](/assets/img/posts/feature-flag-tools/togglz.png)

Once configured, we can ask the `FeatureManager` if a certain feature is *active* for a given user. Before a feature can be active, it needs to be *enabled*. This is to ensure that we're not accidentally activating features that are not ready to be served to our users, yet.  

The `FeatureManager` has access to a `UserProvider`, which knows about the user who is currently using our application. This way, Togglz can distinguish between users and we can build features that are active for some users and inactive for others.

The `FeatureProvider` provides the `Feature`s that we want to control in our application. Different `FeatureProvider` implementations load the feature data from different locations. This feature data contains the names of the features and whether they are enabled or active by default. We can decide to define our features in a config file, or in environment variables, for example.

Each `Feature` has an `ActivationStrategy` that defines under which circumstances the feature will be active for a given user.

Finally, the `FeatureManager` has access to a `StateRepository` which stores feature state. Most importantly, this state includes whether the feature is enabled and which `ActivationStrategy` the feature is using. By default, Togglz is using an in-memory store for the feature states. 

Let's set up Togglz in our Java application to see what it can do!

### Initial Setup

We're going to set Togglz up in a Spring Boot application. We need to declare the following dependency in our `pom.xml`:

```xml
<dependency>
    <groupId>org.togglz</groupId>
    <artifactId>togglz-spring-boot-starter</artifactId>
    <version>2.6.1.Final</version>
</dependency>
```

To get Togglz running, we need to declare our features in an enum:

```java
public enum Features implements Feature {

    GLOBAL_BOOLEAN_FLAG,

    //... more features

    public boolean isActive() {
        return FeatureContext.getFeatureManager().isActive(this);
    }
}
```

For each feature that we want to use, we add a new enum constant. We can influence the features with a handful of [different annotations](https://github.com/togglz/togglz/tree/master/core/src/main/java/org/togglz/core/annotation).

What's left to do is to tell Togglz that is should use this `Features` enum. We do this by setting the `togglz.feature-enums` property in Spring Boot's `application.yml` configuration file:

```yaml
togglz:
  feature-enums: io.reflectoring.featureflags.togglz.Features
```

This configuration property points to the fully qualified class name of our `Features` enum and the Spring Boot Starter that we included in the dependencies will automatically configure Togglz with a `FeatureProvider` that uses this enum as the source of feature definitions.

We're now ready to use Togglz, so let's see how we can implement our feature flagging use cases.

### Global Boolean Rollout with Togglz

We've already seen our global boolean feature in the enum, but here it is again:

```java
public enum Features implements Feature {

    GLOBAL_BOOLEAN_FLAG;

    public boolean isActive() {
      return FeatureContext.getFeatureManager().isActive(this);
    }
}
```

We can check if the feature is active by asking the Feature Manager like in the `isActive()` convenience method in the code above. 

`Features.GLOBAL_BOOLEAN_FLAG.isActive()` would return `false`, currently, because features are disabled by default. Only if a feature is *enabled* will an `ActivationStrategy` decide whether the feature should be *active* for a given user.

We can enable the feature by setting a property in `application.yml`:

```yaml
togglz:
  features:
    GLOBAL_BOOLEAN_FLAG:
      enabled: true
```

Alternatively, we could start the application with the environment variable `TOGGLZ_FEATURES_GLOBAL_BOOLEAN_FLAG_ENABLED` set to `true`.

If we call `Features.GLOBAL_BOOLEAN_FLAG.isActive()` now, it will return `true`. 

But why is the feature *active* now when we only *enabled* it? Aren't *enabled* and *active* different things as explained above? Yes, they are, but we haven't declared an `ActivationStrategy` for our feature. 

Without an `ActivationStrategy` all *enabled* features are automatically *active*. 

We just implemented a global boolean flag that is controlled by a configuration property or environment variable.

### Percentage Rollout with Togglz

Next, let's build a percentage rollout. Togglz calls this a "gradual rollout".

A proper percentage rollout only works when Togglz knows which user is currently using the application. So, we have to implement the `UserProvider` interface:

```java
@Component
public class TogglzUserProvider implements UserProvider {

    private final UserSession userSession;

    public TogglzUserProvider(UserSession userSession) {
        this.userSession = userSession;
    }

    @Override
    public FeatureUser getCurrentUser() {
        return new FeatureUser() {
            @Override
            public String getName() {
                return userSession.getUsername();
            }

            @Override
            public boolean isFeatureAdmin() {
                return false;
            }

            @Override
            public Object getAttribute(String attributeName) {
                return null;
            }
        };
    }
}
```

This implementation of `UserProvider` reads the current user from the session. `UserSession` is a session-scoped bean in the Spring application context (see the full code [here](TODO)). 

We annotate our implementation with the `@Component` annotation, so that Spring creates an object of it during startup and puts it into the application context. The Spring Boot starter dependency we added automatically picks up `UserProvider` implementations from the application context and configure Togglz' `FeatureManager` with it. Togglz will now know which user is currently browsing our application.

Next, we define our feature in the `Features` enum like this:

```java
public enum Features implements Feature {

  @EnabledByDefault
  @DefaultActivationStrategy(id = GradualActivationStrategy.ID, parameters = {
          @ActivationParameter(name = GradualActivationStrategy.PARAM_PERCENTAGE, value = "50")
  })
  USER_BASED_PERCENTAGE_ROLLOUT;

  // ...
}
```

This time, we're using the `@EnabledByDefault` annotation. That means the feature is enabled and will let its activation strategy decide whether the feature is active or not for a given user. We don't need to add `togglz.features.GLOBAL_BOOLEAN_FLAG.enabled: true` to `application.yml` to enable it.

We're also using the `@DefaultActivationStrategy` annotation to configure this new feature to use the `GradualActivationStrategy` and configure it to activate the feature for 50% of the users.

This activation strategy creates a hashcode of the user name and the feature name, normalizes it to a value between 0 and 100, and then checks if the hashcode is below the percentage value (in our case 50). Only then will it activate the feature. See the full code of this activation strategy [here](https://github.com/togglz/togglz/blob/master/core/src/main/java/org/togglz/core/activation/GradualActivationStrategy.java).

`Features.USER_BASED_PERCENTAGE_ROLLOUT.isActive()` will now return true for approximately 50% of the users using our application. If we have very few users with hashcodes that are close together, it might be considerably more or less than 50%, however.

### Rollout Based on a User Attribute with Togglz

Now, let's look at how to build a feature that activates only after a user has done a certain action in our application.

For this, we're going to implement the `getAttribute()` method in our `UserProvider` implementation:

```java
@Component
public class TogglzUserProvider implements UserProvider {

    // ...

    @Override
    public FeatureUser getCurrentUser() {
        return new FeatureUser() {
            @Override
            public String getName() {
                return userSession.getUsername();
            }

            @Override
            public boolean isFeatureAdmin() {
                return false;
            }

            @Override
            public Object getAttribute(String attributeName) {
                if (attributeName.equals("clicked")) {
                    return userSession.hasClicked();
                }
                return null;
            }
        };
    }
}
```

Similar to the `getUsername()`, the `getAttribute()` method returns a value from the session. We're assuming here that `userSession.hasClicked()` returns `true` only after a user has clicked a certain button in our application. In a real application, we should persist this value in the database so it will stay the same even between user sessions!

Our Togglz user objects now have the attribute `clicked` set to `true` after they have clicked the button.

Next, we implement a custom `UserClickedActivationStrategy`:

```java
public class UserClickedActivationStrategy implements ActivationStrategy {

    @Override
    public String getId() {
        return "clicked";
    }

    @Override
    public String getName() {
        return "Rollout based on user click";
    }

    @Override
    public boolean isActive(FeatureState featureState, FeatureUser user) {
        return (Boolean) user.getAttribute("clicked");
    }

    @Override
    public Parameter[] getParameters() {
        return new Parameter[0];
    }
}
```

Note that the `isActive()` method returns the value of the user's `clicked` attribute, which we just implemented in our custom `UserProvider` implementation.

Now we can finally declare the feature in the `Features` enum:

```java
public enum Features implements Feature {

    @EnabledByDefault
    @DefaultActivationStrategy(id = "clicked")
    USER_ACTION_TARGETED_FEATURE;

    // ...
}
```

Again, we enable it by default, so that we don't have to so manually. As the activation strategy we're using our custom `UserClickedActivationStrategy` by passing the ID of that strategy into the `DefaultActivationStrategy` annotation.

`Features.USER_ACTION_TARGETED_FEATURE.isActive()` will now return `true` only after the user has clicked a certain button in our application.

### Managing Feature Flags with the Togglz Web Console

Now that we have a few features, we want to toggle them on or off. For example, we want to do a "dark launch" for a feature. That means we don't enable it by default, deploy the feature in its disabled state, and only then decide to activate it. 

We could, of course, change the `enabled` state in the `application.yml` file and then re-reploy the application, but the point of feature flagging is that we separate deployments from enabling features, so we don't want to do this.

For managing features, Togglz offers a web console that we can deploy next to our application. With the Spring Boot integration, we can set a few properties in `application.yml` to activate it:

```yaml
togglz:
  console:
    enabled: true
    secured: false
    path: /togglz
    use-management-port: false
```

The `secured` property should be set to `true` in a production environment (or you secure it yourself). If set to `true`, only users for which `FeatureUser.isFeatureAdmin()` returns `true` will have access to the web console. This can be controlled in the `UserProvider` implementation.

Setting `use-management-port` to `false` will start the web console on the same port as our Spring Boot application.

Once the application is started with this configuration, we can access the web console on `http://localhost:8080/togglz`:

![The Togglz web console](/assets/img/posts/feature-flag-tools/togglz-console.png)

The web console allows us to enable and disable features and even to change their activation strategy on the fly. The `GLOBAL_BOOLEAN_FLAG` is listed twice, probably because the web console reads it from the `Features` enum and from the `application.yml` file.

### Deploying Togglz into Production

In a production environment, we usually want to deploy multiple nodes of our application. So, as soon as we think about a production environment for our application, we need to answer the question of **how to use Togglz across multiple application nodes**. 

This diagram outlines what a production deployment could look like:

![Example of a production deployment with Togglz](/assets/img/posts/feature-flag-tools/togglz-deployment.png)

Our users are accessing the application over a load balancer that shares the traffic across multiple application nodes. Each of these nodes is using Togglz to decide whether certain features are active or not. 

Since all application nodes should have the same state for all features, we need to connect Togglz to a feature state database that is shared across all application nodes. We can do this by implementing [Togglz' `StateRepository` interface](https://www.togglz.org/documentation/repositories.html) (or use an existing implementation like the `JdbcStateRepository`) and pointing it to a database.

To manage features, we need at least one node that serves the Togglz web console. This can be one (or all) of the application nodes, or a separate node as shown in the diagram above. This web console also has to be connected to the shared feature state database and it has to be protected from unauthorized access. 

### Other Togglz Features

In addition to what we discussed above, Togglz offers:

* a handful of different [activation strategies](https://www.togglz.org/documentation/activation-strategies.html) to control how to activate a feature,
* a handful of different [state repository implementations](https://www.togglz.org/documentation/activation-strategies.html) to store feature state in different databases,
* some pre-canned [user provider implementations](https://www.togglz.org/documentation/authentication.html) that integrate with authentication providers like Spring Security,
* [grouping features](https://www.togglz.org/documentation/feature-groups.html) in the admin console,
* [support for JUnit 4 and 5](https://www.togglz.org/documentation/testing.html) to help control feature state in tests.

## LaunchDarkly


![LaunchDarkly Concepts](/assets/img/posts/feature-flag-tools/launchdarkly.png)

Implementing feature flags using the LaunchDarkly SDK. This will probably be very similar to the section "Feature Flags Backed by a Feature Management Service" in the article [[Implementing Feature Flags with Spring Boot]].

"Feature Management Platform"
name from "dark launch"


### Global Boolean Feature Flag
### User-Based Percentage Rollout
### Implementing a Rollout Based on User Attributes
- https://docs.launchdarkly.com/sdk/features/track#java
- DON'T rely on the server-side state of the attributes! The feature flag rules are evaluated on the client-side!
- the User dashboard only updates attributes every 5 minutes!

- not bound to any rollout strategy at implementation time

## What's the Best Solution for Me?
Comparing the different tools, maybe in form of a table.

Summary table:

- supported languages
- basic on/off features
- percentage rollouts
- non-boolean feature flags
- rollouts based on custom user actions
- custom targeting cohorts
