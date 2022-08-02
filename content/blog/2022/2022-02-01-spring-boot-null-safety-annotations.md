---
authors: [saikat]
title: "Protect Your Code from NullPointerExceptions with Spring's Null-Safety Annotations"
categories: ["Spring Boot"]
date: 2022-02-01 00:00:00 +1000
excerpt: "A guide on how to write null-safe code using Spring annotations"
url: spring-boot-null-safety-annotations
image: images/stock/0116-shield-1200x628-branded.jpg
---

`NullPointerExceptions` (often shortened as "NPE") are a nightmare for every Java programmer.

We can find plenty of articles on the internet explaining how to write null-safe code. Null-safety ensures that we have added proper checks in the code to **guarantee the object reference cannot be null or possible safety measures are taken when an object is null, after all**.

Since `NullPointerException` is a runtime exception, it would be hard to figure out such cases during code compilation. Java's type system does not have a way to quickly eliminate the dangerous null object references.

Luckily, Spring Framework offers some annotations to solve this exact problem. 
In this article, we will learn how to use these annotations to write null-safe code using [Spring Boot](https://reflectoring.io/categories/spring-boot/).

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-null-safe-annotations" %}}

## Null-Safety Annotations in Spring

Under the `org.springframework.lang` Spring core package, there are 4 such annotations: 

* `@NonNull`, 
* `@NonNullFields`, 
* `@Nullable`, and 
* `@NonNullApi`.

**Popular IDEs like Eclipse and IntelliJ IDEA can understand these annotations.** They can warn developers of potential issues during compile time. 

We are going to use IntelliJ IDEA in this tutorial. Let us find out more with some code examples.

To create the base project, we can use the [Spring Initializr](https://start.spring.io/). The Spring Boot starter is all we need, no need to add any extra dependencies.

## IDE Configuration

**Please note that not all development tools can show these compilation warnings. If you don't see the relevant warning, check the compiler settings in your IDE.**

### IntelliJ

For IntelliJ, we can activate the annotation checking under 'Build, Execution, Deployment -> Compiler':

{{% image alt="IntelliJ compiler config" src="images/posts/spring-boot-null-safety-annotations/intellij-compiler-settings.png" %}}

### Eclipse

For Eclipse, we can find the settings under 'Java -> Compiler -> Errors/Warnings':

{{% image alt="Eclipse compiler config" src="images/posts/spring-boot-null-safety-annotations/eclipse-compiler-settings.png" %}}

## Example Code

Let's use a plain `Employee` class to understand the annotations:

```java
package io.reflectoring.nullsafety;

// imports 

class Employee {
  String id;
  String name;
  LocalDate joiningDate;
  String pastEmployment;

  // standard constructor, getters, setters
}
```

## `@NonNull`

Mostly the `id` field (in the `Employee` class) is going to be a non-nullable value. So, to avoid any potential `NullPointerException` we can mark this field as [`@NonNull`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/lang/NonNull.html):

```java
class Employee {

  @NonNull 
  String id;

  //...
}
```
Now, if we accidentally try to set the value of `id` as null anywhere in the code, the IDE will show a compilation warning:

{{% image alt="IDE warning for NonNull" src="images/posts/spring-boot-null-safety-annotations/nonnull-ide-warning.png" %}}

**The `@NonNull` annotation can be used at the method, parameter, or field level.** 

At this point, you might be thinking "what if a class has more than one non-null field?". Would it not be too wordy if we have to add a `@NonNull` annotation before each of these? 

We can solve this problem by using the [`@NonNullFields`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/lang/NonNullFields.html) annotation.

Here is a quick summary for `@NonNull`:

| Annotated element | Effect                                        |
| ----------------- | --------------------------------------------- |
| field             | Shows a warning when the field is null        |
| parameter         | Shows a warning when the parameter is null    |
| method            | Shows a warning when the method returns null  |
| package           | Not Applicable                                |

## `@NonNullFields`

Let us create a `package-info.java` file to apply the non-null field checks at the package level. This file will contain the root package name with `@NonNullFields` annotation:

```java
@NonNullFields
package io.reflectoring.nullsafety;

import org.springframework.lang.NonNullFields;
```

Now, **we no longer need to annotate the fields with the `@NonNull` annotation**. Because by default, all fields of classes in that package are now treated as non-null. And, we will still see the same warning as before:

{{% image alt="IDE warning for NonNullFields" src="images/posts/spring-boot-null-safety-annotations/nonnull-ide-warning.png" %}}

Another point to note here is if there are any uninitialized fields, then we will see a warning to initialize those:

{{% image alt="IDE warning for NonNull" src="images/posts/spring-boot-null-safety-annotations/nonnullfields-ide-warning.png" %}}

Here is a quick summary for `@NonNullFields`:

| Annotated element | Effect                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| field             | Not Applicable                                                         |
| parameter         | Not Applicable                                                         |
| method            | Not Applicable                                                         |
| package           | Shows a warning if any of the fields are null for the applied package  |

## `@NonNullApi`

By now, you might have spotted another requirement, i.e., to have similar checks for method parameters or return values. Here [`@NonNullApi`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/lang/NonNullApi.html) will come to our rescue. 

Similar to `@NonNullFields`, we can use a `package-info.java` file and add the `@NonNullApi` annotation for the intended package:

```java
@NonNullApi
package io.reflectoring.nullsafety;

import org.springframework.lang.NonNullApi;
```
Now, if we write code where the method is returning null:

```java
package io.reflectoring.nullsafety;

// imports

class Employee {

  String getPastEmployment() {
    return null;
  }

  //...
}  
```

We can see the IDE is now warning us about the non-nullable return value:

{{% image alt="IDE warning for NonNullApi" src="images/posts/spring-boot-null-safety-annotations/nonnullapi-method-ide-warning.png" %}}

Here is a quick summary for `@NonNullApi`:

| Annotated element | Effect                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------- |
| field             | Not Applicable                                                                              |
| parameter         | Not Applicable                                                                              |
| method            | Not Applicable                                                                              |
| package           | Shows a warning if any of the parameters or return values are null for the applied package  |

## `@Nullable`

But here is a catch. **There could be scenarios where a particular field can be null** (no matter how much we want to avoid it). 

For example, the `pastEmployment` field could be nullable in the `Employee` class (for someone who hasn't had previous employment). But as per our safety checks, the IDE thinks it cannot be.

We can express our intention using the `@Nullable` annotation on the field. This will tell the IDE that the field can be null in some cases, so no need to trigger an alarm. As the [JavaDoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/lang/Nullable.html) suggests:
> Can be used in association with `@NonNullApi` or `@NonNullFields` to override the default non-nullable semantic to nullable.

Similar to `NonNull`, the `Nullable` annotation can be applied to the method, parameter, or field level. 

We can now mark the `pastEmployment` field as nullable:

```java
package io.reflectoring.nullsafety;

// imports

class Employee {

  @Nullable
  String pastEmployment;

  @Nullable String getPastEmployment() {
    return pastEmployment;
  }

  //...
}  
```
Here is a quick summary for `@Nullable`:

| Annotated element | Effect                                      |
| ----------------- | ------------------------------------------- |
| field             | Indicates that the field can be null        |
| parameter         | Indicates that the parameter can be null    |
| method            | Indicates that the method can return null   |
| package           | Not Applicable                              |

## Automated Build Checks

So far, we are discussing how modern IDEs make it easier to write null-safe code. However, if we want to have some automated code checks in our build pipeline, that's also doable to some extent.

[SpotBugs](https://spotbugs.github.io/) (the reincarnation of the famous but abandoned [FindBugs](http://findbugs.sourceforge.net/) project) offers a Maven/Gradle plugin that can detect code smells due to nullability. Let's see how we can use it.

For a Maven project, we need to update the `pom.xml` to add the [SpotBugs Maven Plugin](https://spotbugs.readthedocs.io/en/latest/maven.html):

```xml
<plugin>
  <groupId>com.github.spotbugs</groupId>
  <artifactId>spotbugs-maven-plugin</artifactId>
  <version>4.5.2.0</version>
  <dependencies>
    <!-- overwrite dependency on spotbugs if you want to specify the version of spotbugs -->
    <dependency>
      <groupId>com.github.spotbugs</groupId>
      <artifactId>spotbugs</artifactId>
      <version>4.5.3</version>
    </dependency>
  </dependencies>
</plugin>
```
After building the project, we can use the following goals from this plugin:

* the `spotbugs` goal analyzes the target project.
* the `check` goal runs the `spotbugs` goal and makes the build fail if it finds any bugs.

If you use Gradle instead of Maven, you can configure the [SpotBugs Gradle Plugin](https://spotbugs.readthedocs.io/en/latest/gradle.html) in your `build.gradle` file:

```groovy
dependencies {
  spotbugsPlugins 'com.h3xstream.findsecbugs:findsecbugs-plugin:1.11.0'
}

spotbugs {
  toolVersion = '4.5.3'
}
```
Once the project is updated, we can run the check using the `gradle check` command.

SpotBugs provides a few rules to flag potential issues by processing the `@NonNull` annotation during Maven build. You can go through the detailed list of [bug descriptions](https://spotbugs.readthedocs.io/en/latest/bugDescriptions.html).

For example, if any of the methods annotated with `@NonNull` is accidentally returning null, then the SpotBugs check will fail with an error similar to this:

```text
[ERROR] High: io.reflectoring.nullsafety.Employee.getJoiningDate() may return null, but is declared @Nonnull [io.reflectoring.nullsafety.Employee] At Employee.java:[line 36] NP_NONNULL_RETURN_VIOLATION
```

## Conclusion

These annotations are indeed a boon for Java programmers to reduce the possibility of a `NullPointerException` arising during runtime. Please bear in mind this does not guarantee complete null safety, however.

[Kotlin](https://kotlinlang.org/docs/null-safety.html) uses these annotations to infer the nullability of the Spring API.

I hope you are now ready to write null-safe code in Spring Boot! 
