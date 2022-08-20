---
authors: [tom]
title: "Testing Feature Flags"
categories: ["Software Craft", "Java"]
date: 2022-08-20 00:00:00 +1100
modified: 2022-08-20 00:00:00 +1100
excerpt: "Feature flags should be tested just like other code, otherwise we risk to deploy broken features."
image: /images/stock/0019-magnifying-glass-1200x628.jpg
url: testing-feature-flags
---

Putting your code behind a feature flag means that you can deploy unfinished changes. As long as the feature flag is disabled, the changes are not having an effect.

Among other benefits, this enables you to continuously merge tiny changes into production and avoids the need for long-lived feature branches and big pull requests.

When we deploy unfinished code to production, however, we want to be extra certain that this code is not being executed! This means we should write tests for our feature flags.

## Why You Should Test Your Feature Flags

A big reason why we should test feature flags is the one I mentioned already: with a feature flag, we're potentially deploying unfinished code to production. We want to make sure that this code is not accidentally being executed until we want it to be executed.

You might say that feature flag code is so trivial that we don't need to test it. After all it can be as simple as an `if/else` branch like this:

```java
class SystemUnderTest {
  public String doSomething() {
    if (featureOneEnabled) {
      // new code
      return "new";
    } else {
      // old code
      return "old";
    }
  }
}
```

This code checks if a feature is enabled and then returns either returns the string "new" or the string "old". What is there to test?

Even in this simple scenario, let’s consider what happens if we accidentally invert the feature flag value in the `if` condition:

```java
class SystemUnderTest {
  public String doSomething() {
    if (featureOneEnabled) {
      // old code
      return "old";
    } else {
      // new code
      return "new";
    }
  }
}
```

It’s important to note that real code frequently doesn’t include a comment saying `// old code` and `// new code`, so you might not be able to easily distinguish between the old and new code at a glance.

This is an extremely simple example. Imagine if your use of flags were more complex, for instance using dependent flags or multivariate flags (flags with many possible values) that pass configuration values. It’s easy to see how mistakes can can happen!

**If the above code is deployed to production, the feature flag will most likely default to the value `false` and execute the new code instead of the old code!** The deployment will potentially break things for our users while we expect that the change is hidden behind the feature flag.

How do you avoid this? For the above example, we’d do this by writing a test that checks the following:

1. Is the old code executed when the feature flag is disabled?
2. Is the new code executed when the feature flag is enabled?

Ideally, the first question is answered by our existing test base. Given that the old code has been covered by a unit test, this test should fail if we have accidentally inverted the feature flag because during the test the new code would now be executed instead of the old code.

Let's look at what feature flag tests might look like!

## Creating a Feature Flag Service
To make feature flags easily testable, it's a good idea to put them into an interface like this `FeatureFlagService`:

```java
public interface FeatureFlagService {

  boolean featureOneEnabled();

  // ... other feature flags ...
}
```

For each feature flag, we add a new method to this interface.

The implementations of these methods retrieve the value of the feature flag from our feature management platform (like [LaunchDarkly](https://launchdarkly.com)). The feature management platform manages the state of our feature flags for us and allows us to turn them on or off for all or a specific cohort of users. If you want to read more on different feature flagging options, read my article about [making or buying a feature flag tool](/feature-flags-make-or-buy/)).

With this `FeatureFlagService` we now have a single place for all our feature flags. We can inject the implementation of this service into any code that needs to evaluate a feature flag and then use it like this:

```java
class SystemUnderTest{
  
  private final FeatureFlagService featureFlagService;
  
  SystemUnderTest(FeatureFlagService featureFlagService){
    this.featureFlagService = featureFlagService;
  }
  
  public String doSomething() {
    if (featureFlagService.featureOneEnabled()) {
      // new code
      return "new";
    } else {
      // old code
      return "old";
    }
  }
}
```

Another advantage of centralizing our feature flags like this is that we create a layer of abstraction over our feature flagging tool. If we decide to change from one tool to another, the interface stays the same and we only need to change the implementation of the `FeatureFlagService`. The rest of the code stays untouched.

## Mocking the Feature Flag Service
In our tests, we'll want to mock the values the `FeatureFlagService` returns so that we can test the code paths with the feature flag enabled or disabled. Having all feature flag evaluations behind an interface makes it easy to mock our feature
flags.


### Creating a `MockFeatureFlagService`
A simple way of mocking is to create a custom implementation of the `FeatureFlagService` interface that allows us to change the feature flag state on-demand:

```java
class MockFeatureFlagService implements FeatureFlagService {

  private boolean isFeatureOneEnabled = false;

  boolean featureOneEnabled(){
    return isFeatureOneEnabled;
  }

  void setFeatureOneEnabled(boolean flag){
    this.isFeatureOneEnabled = flag;
  }

}
```

In a unit test, we can then inject the `MockFeatureFlagService` into the system under test and change the state as required in the tests:

```java
class MyTest {

  private final MockFeatureFlagService featureFlagService 
    = new MockFeatureFlagService();

  private final SystemUnderTest sut 
    = new SystemUnderTest(featureFlagService);

  @Test
  void testOldState(){
    featureFlagService.setFeatureOneEnabled(false);
    assertThat(sut.doSomething()).equals("old");
  }

  @Test
  void testNewState(){
    featureFlagService.setFeatureOneEnabled(true);
    assertThat(sut.doSomething()).equals("new");
  }

}
```

### Using Mockito
Instead of implementing our own `MockFeatureFlagService` implementation, we can also use a mocking library like Mockito :

```java
class MyTest {

  private final FeatureFlagService featureFlagService 
    = Mockito.mock(FeatureFlagService.class);

  private final SystemUnderTest sut 
    = new SystemUnderTest(featureFlagService);

  @Test
  void testOldState(){
    given(featureFlagService.featureOneEnabled()).willReturn(false);
    assertThat(sut.doSomething()).equals("old");
  }

  @Test
  void testNewState(){
    given(featureFlagService.featureOneEnabled()).willReturn(true);
    assertThat(sut.doSomething()).equals("new");
  }

}
```

This has the same effect, but saves us from writing a whole `MockFeatureFlagService` class, because we can use Mockito's `given()` or `when()` methods to define the return value of the `FeatureFlagService` on demand.

There is a cost, however: we no longer have a single place where we control all the values of the mocked feature flags as we do when we have a `MockFeatureFlagService` because we're now defining each feature flag value on demand right where we need it. That means we cannot define the default values for the feature flags used in our tests in a central place!

### Choose Default Values Carefully!
No matter which way of mocking feature flags you use, choose the default values of those feature flags carefully!

**The default value of a feature flag in tests should be the same value as the feature flag has (or will soon have) in production!**

Imagine what can happen if the default value of a feature flag in our test is `false`, while the feature flag is `true` in production. We add some code to our application and the tests are all still passing so we assume everything is alright. However, we overlooked that the code we added only runs if the feature flag is `false`, while the feature flag in production is set to `true`! The tests didn't save us because they had a different default value for the feature flag than the production environment!

This is where a central `MockFeatureFlagService` comes in handy. We can define all the default values there and even change them over time when we change a feature flag value in production. The tests will always use the same default values for feature flag states as in production, avoiding an issue like the one outlined above.

This is useful even if you’re using a feature management platform. For instance, LaunchDarkly enables you to define a default value in case of any failure in retrieving the value from the LaunchDarkly service. Having these values centralized can help eliminate any mistake.


## Testing the Feature Flag Lifecycle
Most feature flags go through a common lifecycle. We create them, we activate them, and then we remove them again, although this lifecycle can differ for different types of flags (permanent flags that manage configuration changes, are not removed, for example). Let’s take a look at what the tests should look like at each stage of the typical feature flag lifecycle.

### Before the Feature Flag

Let's say that our test code looks like this before we have introduced a feature flag:

```java
class MyTest {

  private final SystemUnderTest sut = new SystemUnderTest();

  @Test
  void existingTest(){
    assertThat(sut.doSomething()).equals("old");
  }

}
```

The method `doSomething()` returns the String "old".

### Adding a Test Case for the Feature Flag
Now, we have decided to change the logic of the `doSomething()` method, but we don't want to deploy this change to all users at the same time, because we want to get some feedback from early adopters first. The `doSomething()` method should return the String "new" for some users, and "old" for the rest of the users.

The test from above will not compile anymore, because the constructor of `SystemUnderTest` will now require a `FeatureFlagService` as a parameter because it needs to know the current value of the feature flag.

So, we pass in a mocked `FeatureFlagService` to fix the test:

```java
class MyTest {

  private final FeatureFlagService featureFlagService
          = Mockito.mock(FeatureFlagService.class);

  private final SystemUnderTest sut 
          = new SystemUnderTest(featureFlagService);

  @Test
  void existingTest(){
    assertThat(sut.doSomething()).equals("old");
  }

}
```

Will the test `existingTest()` succeed or fail now? That depends on the default value that the method `FeatureFlagService.featureOneEnabled()` method returns. In the code above, Mockito will return `false`, because that is the default for a boolean value. That means the test should still pass.

However, we might want to make it explicit that we expect the feature flag to be `false`. Also, we'll want to add a test for the case when the feature flag is `true`:

```java
class MyTest {

  private final FeatureFlagService featureFlagService 
          = Mockito.mock(FeatureFlagService.class);

  private final SystemUnderTest sut 
          = new SystemUnderTest(featureFlagService);

  @Test
  void existingTest(){
    given(featureFlagService.featureOneEnabled()).willReturn(false);
    assertThat(sut.doSomething()).equals("old");
  }

  @Test
  void newTest(){
    given(featureFlagService.featureOneEnabled()).willReturn(true);
    assertThat(sut.doSomething()).equals("new");
  }

}
```

This test now covers all states of the feature flag. If the feature flag was not a boolean, but instead a string or a number, we might want to add some more tests that cover edge cases.

### Removing the Feature Flag
The code has been deployed to production and we have enabled it for the early adopters. They were happy, so we decided to enable it for all users. After a week, we heard no complaints and our monitoring doesn't show any issues with the new code, so we decide to remove the old code and instead make the new code the default.

The method `SystemUnderTest.doSomething()` shall now return "new" for all users, all the time. We remove the `if/else` block from the `doSomething()` method. Since `SystemUnderTest` no longer requires a feature flag, we remove the `FeatureFlagService` from its constructor, which causes the above test case to show a compile error.

So, we fix our test again:

```java
class MyTest {

  private final SystemUnderTest sut = new SystemUnderTest();

  @Test
  void newTest(){
    assertThat(sut.doSomething()).equals("new");
  }

}
```

We have removed the `existingTest()` method because that tested the no longer relevant case when the feature flag returned the value `false`. We keep the `newTest()` method but remove the code that mocks the feature flag value because the feature flag doesn't exist anymore (and implicitly has the value `true`).

All tests should be green!

## Conclusion

Feature flag evaluations in our code should be tested just like any other code. If we don't write tests for the different values a feature flag can have, we risk deploying code that we *think* is disabled by a feature flag when it's actually enabled by default - completely undermining the value of feature flags!