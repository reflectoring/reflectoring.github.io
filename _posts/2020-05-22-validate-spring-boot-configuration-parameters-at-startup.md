---
title: Validate Spring Boot Configuration Parameters at Startup
categories: [spring-boot]
date: 2020-05-22 06:00:00 +200
modified: 2020-05-22 06:00:00 +200
author: default
excerpt: "One of the important steps to keep software applications customizable is the effective configuration management. Modern frameworks have many provisions out of the box to externalize configuration parameters."
image:
  auto: 0065-java
---

One of the important steps to keep software applications customizable is the effective configuration management. Modern frameworks have many provisions out of the box to externalize configuration parameters.

However, validation of these parameters can still be a problem for some developers.

Spring Boot offers us a neat way of validating configuration parameters. Binding input values and supporting [Bean Validation](https://beanvalidation.org/), we can do it practically.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/configuration" %}

## Why Do We Need to Validate Configuration Parameters?
Developers are super passionate guys when it comes to building up new things, architecting clever solutions and those are the moments that they really shine.

But, all these attractive moments sometimes make us forget (or neglect? ... nevermind) to validate inputs. Especially, if these are the ones only we define like configuration parameters. I know, I'm one of them :)

However, **not doing the proper validation of our configuration can be critical sometimes**.

Let's think about a scenario:

You wake up early than usual because of a frustrated call. Your client complains about they haven't been receiving the utmost important reports for a week from the fancy analysis application you had developed. You jump out from your bed and debug the issue blazing fast but it still takes for a couple of hours to find out.

Oh, God! you realized the typo in the e-mail address you defined in the configuration:

```
app.properties.report-email-address = manager.analysisapp.com
```

"Didn't I validate it? Oh, I see. I had to implement a helper class to read and validate the configuration data and I was so lazy at that moment. Ahh, nevermind, it's fixed right now."

I lived that scenario, not just once. So, I believe what makes sense to me can make sense to others too. That was the motivation behind this article and let's keep going to see a practical solution for that.

## Validating Properties at Startup
Binding our configuration parameters to an object would be a clean way to maintain them. Therefore, **we can benefit from type-safety and seeing errors in advance**.

Spring Boot has the [@ConfigurationProperties](https://reflectoring.io/spring-boot-configuration-properties/) annotation to make this binding automatically for our properties defined in `.properties` files.

However, to validate them we need to follow a couple of more steps.

First, let's take a look at our `application.properties` file:
```
app.properties.name = Analysis Application
app.properties.send-report-emails = true
app.properties.report-type = HTML
app.properties.report-interval-in-days = 7
app.properties.report-email-address = manager@analysisapp.com
```

Next, we add `@Validated` annotation to our properties class alongside the [bean validation](https://reflectoring.io/bean-validation-with-spring-boot/) anotations on the fields:
```java
@Validated
@ConfigurationProperties(prefix="app.properties")
class AppProperties {

  @NotEmpty
  private String name;

  private Boolean sendReportEmails = Boolean.FALSE;

  private ReportType reportType = ReportType.HTML;

  @Min(value = 7)
  @Max(value = 30)
  private Integer reportIntervalInDays;

  @Email
  private String reportEmailAddress;

  // ...
}
```

Plus, we need to mark our `AppProperties` class with `@EnableConfigurationProperties` in order to make it work:
```java
@Configuration
@EnableConfigurationProperties(AppProperties.class)
class AppConfiguration {
  //...
}
```

As we notice, using Spring's `@Validated` annotation we trigger the validation for the `AppProperties` class when the context boots up:
```
***************************
APPLICATION FAILED TO START
***************************

Description:

Binding to target org.springframework.boot.context.properties.bind.BindException: Failed to bind properties under 'app.properties' to io.reflectoring.validation.AppProperties failed:

    Property: app.properties.name
    Value:
    Origin: class path resource [application-validation.properties]:1:21
    Reason: must not be empty


Action:

Update your application's configuration
```

<div class="notice warning">
  <h4>Bean Validation API Dependency</h4>
  In order to make bean validation work, we must have <code>javax.validation.validation-api</code> dependency in our classpath. For Spring Boot, take a look at <a href="https://reflectoring.io/bean-validation-with-spring-boot/#setting-up-validation">setting up bean validation</a> section.
</div>

Additionally, we can also define some default values that are set when our `AppProperties` class is initialized:
```java

private Boolean sendReportEmails = Boolean.FALSE;

private ReportType reportType = ReportType.HTML;

```
Therefore, even if we don't define any values for the properties `send-report-emails` and `report-type`, we can still get the default values `Boolean.FALSE` and `ReportType.HTML` respectively.

### Nested Configuration Objects
For some properties, it would be meaningful to bind them into a nested object.

So, let's create `ReportProperties` to group the properties related to `report` key:

```java
class ReportProperties {

  private Boolean sendEmails = Boolean.FALSE;

  private ReportType type = ReportType.HTML;

  @Min(value = 7)
  @Max(value = 30)
  private Integer intervalInDays;

  @Email
  private String emailAddress;

  // ...
}
```

Next, we refactor our `AppProperties` to include our nested object `ReportProperties`:

```java
@Validated
@ConfigurationProperties(prefix="app.properties")
class AppProperties {

  @NotEmpty
  private String name;

  @Valid
  private ReportProperties report;

  // ...
}
```

Besides, we should also pay attention to put `@Valid` annotation on our nested class field `report`.

Thus, Spring can validate the inner properties included in nested objects.

### Using Bean Methods
Another way of triggering validation, we can use the Spring bean methods. This is particularly useful when we want to **bind properties to components defined in third-party libraries or maintained in separate jar files**:
```java
@Bean
@Validated
@ConfigurationProperties(prefix = "app.third-party.properties")
public ThirdPartyComponentProperties thirdPartyComponentProperties() {
  return ThirdPartyComponentProperties();
}
```

### Using a Custom `Validator`
Even though bean validation provides a declarative approach to validate our objects in a reusable way, sometimes we need more to customize our validation logic in purpose.

In that case, **Spring has an independent `Validator` mechanism to allow dynamic input validation**.

Let's make our validation further, to check the `report.email-address` can only be an address under a specific domain like `@analysisapp.com`:
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
    if (reportProperties.getEmailAddress().endsWith(EMAIL_DOMAIN)) {
      errors.rejectValue("emailAddress", "field.domain.required",
          new Object[]{EMAIL_DOMAIN},
          "The email address must contain [" + EMAIL_DOMAIN + "] domain.");
    }

  }
}
```
Then, we need to register our custom Spring validator with a specific definition of `configurationPropertiesValidator`:
```java
@Bean
public static ReportEmailAddressValidator configurationPropertiesValidator(){
  return new ReportEmailAddressValidator();
}
```
As we notice, we should define our `configurationPropertiesValidator` bean as `static`.

Therefore, Spring can create the bean in a very early stage, before `@Configuration` classes, to avoid any problems when creating other beans depending on the configuration properties.

## Conclusion
If you want to be safe from input errors, validating your configuration would be a good way to go. Spring Boot makes it even more practical which we've explained the ways of them in this article.

All the code examples and even more you can play with is over [on Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/configuration).
