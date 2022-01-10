---
title: "Assumptions and Conditional Test Execution with JUnit 4 and 5"
categories: ["Java"]
modified: 2017-10-10
excerpt: "A comparison on how to implement assumptions and conditional test execution between JUnit 4 and 5."
image:
  auto: 0019-magnifying-glass
---



Sometimes, a test should only be run under certain conditions. One such case
are integration tests which depend on a certain external system. We don't want
our builds to fail if that system has an outage, so we just want to skip 
the tests that need a connection to it. This article shows how
you can skip tests in JUnit 4 and JUnit 5 depending on certain conditions.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/junit/assumptions" %}

## Assumptions
Both JUnit 4 and JUnit 5 support the concept of assumptions. Before each test,
a set of assumptions can be made. If one of these assumptions is not met,
the test should be skipped.  

In our example, we make the assumption that a connection to a certain external
system can be established.

To check if a connection can be established, we create the helper class
`ConnectionChecker`:

```java
public class ConnectionChecker {

  private String uri;

  public ConnectionChecker(String uri){
    this.uri = uri;
  }

  public boolean connect() {
    ... // try to connect to the uri 
  }

}
```

Our `ConnectionChecker` has a single public method `connect()` which
sends an HTTP GET request to a given URI and returns `true` if the server responded
with an HTTP response with a status code in the range of 200-299 meaning that
the response was successfully processed. 
 
## Assumptions for a single Test Method (JUnit 4 and JUnit 5)

Skipping a single test method based on an assumption works the same in JUnit 4
and JUnit 5:

```java
public class ConnectionCheckingTest {

  private ConnectionChecker connectionChecker = 
      new ConnectionChecker("http://my.integration.system");

  @Test
  public void testOnlyWhenConnected() {
    assumeTrue(connectionChecker.connect());
    ... // your test steps
  }

}
``` 

The lines below `assumeTrue()` will only be called if a connection to the integration
system could successfully be established.

Most of the times, though, we want all methods in a test class to be skipped
depending on an assumption. This is done differently in JUnit 4 and JUnit 5

## Assumptions for all Test Methods with JUnit 4

In JUnit 4, we have to implement a `TestRule` like this:

```java
public class AssumingConnection implements TestRule {

  private ConnectionChecker checker;

  public AssumingConnection(ConnectionChecker checker) {
    this.checker = checker;
  }

  @Override
  public Statement apply(Statement base, Description description) {
    return new Statement() {
      @Override
      public void evaluate() throws Throwable {
        if (!checker.connect()) {
          throw new AssumptionViolatedException("Could not connect. Skipping test!");
        } else {
          base.evaluate();
        }
      }
    };
  }

}
```
We use our `ConnectionChecker` to check the connection and throw an 
`AssumptionViolatedException` if the connection could not be established.

We then have to include this rule in our JUnit test class like this:

```java
public class ConnectionCheckingJunit4Test {

  @ClassRule
  public static AssumingConnection assumingConnection = 
      new AssumingConnection(new ConnectionChecker("http://my.integration.system"));

  @Test
  public void testOnlyWhenConnected() {
    ...
  }

}
```

## Assumptions for all Test Methods with JUnit 5

In JUnit 5, the same can be achieved a little more elegantly with the [extension sytem](http://junit.org/junit5/docs/current/user-guide/#extensions-registration)
and annotations. First, we define ourselves an annotation that should mark tests
that should be skipped if a certain URI cannot be reached:

```java
@Retention(RetentionPolicy.RUNTIME)
@ExtendWith(AssumeConnectionCondition.class)
public @interface AssumeConnection {

  String uri();

}
```

In this annotation we hook into the JUnit 5 extension mechanism by using `@ExtendWith`
and pointing to an extension class. In this extension class, we read the
URI from the annotation and call our `ConnectionChecker` to either continue
with the test or skip it:

```java
public class AssumeConnectionCondition implements ExecutionCondition {

  @Override
  public ConditionEvaluationResult evaluateExecutionCondition(ExtensionContext context) {
    Optional<AssumeConnection> annotation = findAnnotation(context.getElement(), AssumeConnection.class);
    if (annotation.isPresent()) {
      String uri = annotation.get().uri();
      ConnectionChecker checker = new ConnectionChecker(uri);
      if (!checker.connect()) {
        return ConditionEvaluationResult.disabled(String.format("Could not connect to '%s'. Skipping test!", uri));
      } else {
        return ConditionEvaluationResult.enabled(String.format("Successfully connected to '%s'. Continuing test!", uri));
      }
    }
    return ConditionEvaluationResult.enabled("No AssumeConnection annotation found. Continuing test.");
  }

}
```

We can now use the annotation in our tests either on class level or on method
level to skip tests conditionally:

```java
@AssumeConnection(uri = "http://my.integration.system")
public class ConnectionCheckingJunit5Test {

  @Test
  public void testOnlyWhenConnected() {
    ...
  }

}
```

## Conclusion
Both JUnit 4 and JUnit 5 support the concept of assumptions to conditionally 
enable or disable tests. However, it's definitely worthwhile to have a look at JUnit 5 and its
extension system since it allows a very declarative way (not only) to create
conditionally running tests. 



