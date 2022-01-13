---
title: Validate Spring Boot Configuration Parameters at Startup
categories: ["Spring Boot"]
date: 2020-05-28T06:00:00
modified: 2020-05-28T06:00:00
authors: [yavuztas]
excerpt: "One of the important steps to keep software applications customizable is the effective configuration management. Let's have a look at how to do this with Spring Boot."
image: images/stock/0051-stop-1200x628-branded.jpg
url: validate-spring-boot-configuration-parameters-at-startup
---

One of the important steps to keep software applications customizable is effective configuration management. Modern frameworks provide out-of-the-box features to externalize configuration parameters.

For some configuration parameters it makes sense to fail application startup if they're invalid.

Spring Boot offers us a neat way of validating configuration parameters. We're going to bind input values to `@ConfigurationProperties` and use [Bean Validation](https://beanvalidation.org/) to validate them.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/configuration" %}}

## Why Do We Need to Validate Configuration Parameters?
Doing proper validation of our configuration parameters can be critical sometimes.

Let's think about a scenario:

We wake up early to a frustrated call. Our client complains about not having received their very important report emails from the fancy analysis application we developed. We jump out of bed to debug the issue.

Finally, we realize the cause. A typo in the e-mail address we defined in the configuration:

```text
app.properties.report-email-address = manager.analysisapp.com
```

"Didn't I validate it? Oh, I see. I had to implement a helper class to read and validate the configuration data and I was so lazy at that moment. Ahh, nevermind, it's fixed right now."

I lived that scenario, not just once.

So, that's the motivation behind this article. Let's keep going to see a practical solution to this problem.

## Validating Properties at Startup
[Binding our configuration parameters to an object](/spring-boot-configuration-properties/) is a clean way to maintain them. This way **we can benefit from type-safety and find errors earlier**.

Spring Boot has the [`@ConfigurationProperties`](/spring-boot-configuration-properties/) annotation to do this binding for the properties defined in `application.properties` or `application.yml` files.

However, to validate them we need to follow a couple of more steps.

First, let's take a look at our `application.properties` file:

```text
app.properties.name = Analysis Application
app.properties.send-report-emails = true
app.properties.report-type = HTML
app.properties.report-interval-in-days = 7
app.properties.report-email-address = manager@analysisapp.com
```

Next, we add the `@Validated` annotation to our `@ConfigurationProperties` class along with some [Bean Validation](/bean-validation-with-spring-boot/) anotations on the fields:

```java
@Validated
@ConfigurationProperties(prefix="app.properties")
class AppProperties {

  @NotEmpty
  private String name;

  private Boolean sendReportEmails;

  private ReportType reportType;

  @Min(value = 7)
  @Max(value = 30)
  private Integer reportIntervalInDays;

  @Email
  private String reportEmailAddress;

  // getters / setters
}
```

To have Spring Boot pick up our `AppProperties` class, we annotate our `@Configuration` class with `@EnableConfigurationProperties`:

```java
@Configuration
@EnableConfigurationProperties(AppProperties.class)
class AppConfiguration {
  // ...
}
```

When we start the Spring Boot application now with the (invalid) email address from the example above, the application won't start up:

```text
***************************
APPLICATION FAILED TO START
***************************

Description:

Binding to target org.springframework.boot.context.properties.bind.BindException:
  Failed to bind properties under 'app.properties' to
  io.reflectoring.validation.AppProperties failed:

    Property: app.properties.reportEmailAddress
    Value: manager.analysisapp.com
    Reason: must be a well-formed email address


Action:

Update your application's configuration
```

<div class="notice warning">
  <h4>Bean Validation API Dependency</h4>
  In order to use the bean validation annotations, <a href="/bean-validation-with-spring-boot/#setting-up-validation">we must have the <code>javax.validation.validation-api</code> dependency in our classpath</a>
</div>

Additionally, we can also define some default values by initializing the fields of `AppProperties`:
```java
@Validated
@ConfigurationProperties(prefix="app.properties")
class AppProperties {
  // ...
  private Boolean sendReportEmails = Boolean.FALSE;

  private ReportType reportType = ReportType.HTML;
  // ...
}
```
Even if we don't define any values for the properties `send-report-emails` and `report-type` in `application.properties`, we will now get the default values `Boolean.FALSE` and `ReportType.HTML` respectively.

### Validate Nested Configuration Objects
For some properties, it makes sense to bundle them into a nested object.

So, let's create `ReportProperties` to group the properties related to our very important report:

```java
class ReportProperties {

  private Boolean sendEmails = Boolean.FALSE;

  private ReportType type = ReportType.HTML;

  @Min(value = 7)
  @Max(value = 30)
  private Integer intervalInDays;

  @Email
  private String emailAddress;

  // getters / setters
}
```

Next, we refactor our `AppProperties` to include our nested object `ReportProperties` instead of the single properties:

```java
@Validated
@ConfigurationProperties(prefix="app.properties")
class AppProperties {

  @NotEmpty
  private String name;

  @Valid
  private ReportProperties report;

  // getters / setters
}
```

**We should pay attention to put `@Valid` annotation on our nested `report` field.**

This tells Spring to validate the properties of the nested objects.

Finally, we should change the prefix of the report-related properties to `report.*` in our `application.properties` file as well:
```text
...
app.properties.report.send-emails = true
app.properties.report.type = HTML
app.properties.report.interval-in-days = 7
app.properties.report.email-address = manager@analysisapp.com
```

This way, properties with the prefix `app.properties` will still be bound to the `AppProperties` class, but properties with the prefix `app.properties.report` will be bound to the `ReportProperties` object in the `report` field.

### Validate Using @Bean Factory Methods
We can also trigger validation by binding a properties file to a `@Bean` factory method with the `@ConfigurationProperties` annotation:

```java
@Configuration
class AppConfiguration {
  // ...
  @Bean
  @Validated
  @ConfigurationProperties(prefix = "app.third-party.properties")
  public ThirdPartyComponentProperties thirdPartyComponentProperties() {
    return new ThirdPartyComponentProperties();
  }
  // ...
}
```

**This is particularly useful when we want to bind properties to components defined in third-party libraries or maintained in separate jar files**.

### Using a Custom Spring `Validator`
Even though Bean Validation provides a declarative approach to validate our objects in a reusable way, sometimes we need more to customize our validation logic.

For this case, **Spring has an independent `Validator` mechanism to allow dynamic input validation**.

Let's extend our validation to check that the `report.email-address` has a specific domain like `@analysisapp.com`:

```java
class ReportEmailAddressValidator implements Validator {

  private static final String EMAIL_DOMAIN = "@analysisapp.com";

  public boolean supports(Class clazz) {
    return ReportProperties.class.isAssignableFrom(clazz);
  }

  public void validate(Object target, Errors errors) {

    ValidationUtils.rejectIfEmptyOrWhitespace(errors,
        "emailAddress", "field.required");

    ReportProperties reportProperties = (ReportProperties) target;
    if (!reportProperties.getEmailAddress().endsWith(EMAIL_DOMAIN)) {
      errors.rejectValue("emailAddress", "field.domain.required",
          new Object[]{EMAIL_DOMAIN},
          "The email address must contain [" + EMAIL_DOMAIN + "] domain.");
    }

  }
}
```
Then, we need to register our custom Spring validator with the special method name `configurationPropertiesValidator()`:
```java
@Configuration
class AppConfiguration {
  // ...
  @Bean
  public static ReportEmailAddressValidator configurationPropertiesValidator() {
    return new ReportEmailAddressValidator();
  }
  // ...
}
```

Only if the resulting Spring bean's name is `configurationPropertiesValidator` will Spring run this validator against all `@ConfigurationProperties` beans.

Note that we must define our `configurationPropertiesValidator()` method as `static`. This allows Spring to create the bean in a very early stage, before `@Configuration` classes, to avoid any problems when creating other beans depending on the configuration properties.

<div class="notice warning">
  <h4><code>Validator</code> Is Not a Part of Bean Validation</h4>
  Spring's <a href="https://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/validation/Validator.html">Validator</a> is not related to Bean Validation and works independently after the Bean Validation happens. Its main purpose is to encapsulate the validation logic from any infrastructure or context.
</div>

In case we need to define more than one `Validator` for our configuration properties, we cannot do it by defining bean factory methods, because we can only define one bean named `configurationPropertiesValidator`.

Instead of defining a bean factory method, we can move our custom `Validator` implementation to inside the configuration property classes:
```java
@Validated
@ConfigurationProperties(prefix = "app.properties")
class AppProperties implements Validator {

  // properties ...

  public boolean supports(Class clazz) {
    return ReportProperties.class.isAssignableFrom(clazz);
  }

  public void validate(Object target, Errors errors) {
    // validation logic
  }
}
```
By doing so, we can implement a different `Validator` implementation for each `@ConfigurationProperties` class.

## Conclusion
If we want to be safe from input errors, validating our configuration is a good way to go. Spring Boot makes it easy with the ways described in this article.

All the code examples and even more you can play with is over [on Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/configuration).
