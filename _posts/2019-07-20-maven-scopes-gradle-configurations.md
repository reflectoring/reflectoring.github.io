---
title: Maven Scopes and Gradle Configurations Explained
categories: [tools]
modified: 2017-07-23
author: tom
tags: [gradle, maven, scope, configuration]
comments: true
ads: true
excerpt: "An explanation and comparison of Maven scopes and Gradle configurations to declare dependencies in a build file."
sidebar:
  toc: true
---

{% include sidebar_right %}

One of the key features of a build tool is dependency management. We want to declare which libraries we use in our own projects and the build tool takes care of downloading it and providing it to the classpath at the right moments in the build lifecycle.

Maven has been around as a build tool for a long time. It's stable and still well liked in the Java community. 

Gradle has emerged as an alternative to Maven quite some time ago, too, heavily relying on Maven dependency infrastructure, but providing a more flexible way to declare dependencies.

Whether you're moving from Maven to Gradle or you're just interested in the different ways of declaring dependencies in Maven or Gradle, this article will help to give an overview.   

## What's a Scope / Configuration?

A Maven `pom.xml` file or a Gradle `build.gradle` file defines the steps necessary to create a software artifact from our source code. This artifact can be a JAR file or a WAR file, for instance.

In most non-trivial projects, we rely on libraries and frameworks. So, another task of build tools like Maven and Gradle is to manage the dependencies to those libraries and frameworks.

Say we want to use the SLF4J logging library in our code. In a Maven `pom.xml` file, we would declare the following dependency:

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>1.7.26</version>
    <scope>compile</scope>
</dependency>
```

In a Gradle `build.gradle` file, the same dependency would look like this:

```groovy
implementation 'org.slf4j:slf4j-api:1.7.26'
```

Both Maven and Gradle allow to define **different groups of dependencies**. These dependency groups are called "scopes" in Maven and "configurations" in Gradle. 

Each of those dependency groups has different characteristics and answers the following questions differently:

* **At which step in the build lifecycle will the dependency be available?** At compile time? At runtime? At compile and runtime of tests?
* **Is the dependency transitive?** Will it be passed on to projects that consume / depend on our project?
* **Will the dependency be included in the final build artifact?** Will the WAR or JAR file of our own project include the JAR file of the dependency?

In the above example, the dependency is added to the Maven scope "compile" and the Gradle configuration "implementation", which can be considered the defaults. 

Let's look at the semantics of all those scopes and configurations.

## Maven Scopes

Maven provides [4 main scopes](http://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html#Dependency_Scope) for Java projects.

The additional scopes `system` and `import` are not covered in this article, since they are rather exotic.

### `compile`

The `compile` scope is the default scope. We can use it when we have no special requirements for declaring a certain dependency.

| When available?                                                                    | Transitive ? | Included in Artifact? |
| ---------------------------------------------------------------------------------- | ------------ | --------------------- |
| {::nomarkdown}<ul><li>compile time</li><li>runtime</li><li>test compile time</li><li>test runtime</li></ul>{:/} | yes          | yes                   |

### `provided`

We can use the `provided` scope to declare a dependency that will not be included in the final build artifact, for instance to declare a dependency to the Servlet API when we're deploying to an application server where this dependency is already available.

| When available?                                                                    | Transitive ? | Included in Artifact? |
| ---------------------------------------------------------------------------------- | ------------ | --------------------- |
| {::nomarkdown}<ul><li>compile time</li><li>runtime</li><li>test compile time</li><li>test runtime</li></ul>{:/} | no           | no                   |

### `runtime`

We use the `runtime` scope for dependencies that are not needed at compile time, like when we're compiling against an API and only need the implementation of that API at runtime.

An example is SLF4J where we include `slf4j-api` to the `compile` scope and an implementation of that API (like `slf4j-log4j12` or `logback-classic`) to the `runtime` scope.

| When available?                             | Transitive ? | Included in Artifact? |
| ------------------------------------------- | ------------ | --------------------- |
| {::nomarkdown}<ul><li>runtime</li></ul>{:/} | no           | yes                   |

### `test`

Use this scope for dependencies that are only needed in tests, like unit test frameworks and assertion libraries.

| When available?                                                            | Transitive ? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
| {::nomarkdown}<ul><li>test compile time</li><li>test runtime</li></ul>{:/} | no           | yes                   |


## Gradle Configurations (Java Plugin)

Gradle has a [more diverse set of configurations](https://docs.gradle.org/current/userguide/java_library_plugin.html#sec:java_library_configurations_graph). This is the result of Gradle being younger and more actively developed, and thus able to adapt to more use cases.

### `implementation`

The `implementation` configuration should be considered the default. We use it to declare dependencies that we don’t want to expose to our consumers.

This configuration was introduced to replace the deprecated `compile` configuration to avoid "polluting" the consumer with dependencies we actually don't want to expose. 

| When available?                                                            | Transitive ? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
| {::nomarkdown}<ul><li>compile time</li><li>runtime</li><li>test compile time</li><li>test runtime</li></ul>{:/} | no           | yes                   |

### `api`

We use the `api` configuration do declare dependencies that are part of our API, i.e. for dependencies that we explicitly want to expose to our consumers.

| When available?                                                            | Transitive ? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
| {::nomarkdown}<ul><li>compile time</li><li>runtime</li><li>test compile time</li><li>test runtime</li></ul>{:/} | yes           | yes                   |

### `compileOnly`

The `compileOnly` configuration allows us to to declare dependencies that should only be available at compile time, but are not needed at runtime. 

An example are annotation processors like [Lombok](https://projectlombok.org/), which modify the bytecode at compile time. After compilation they’re not needed anymore.</p> 

| When available?                                                            | Transitive ? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
|{::nomarkdown}<ul><li>compile time</li></ul>     {:/}  | no           | no                   |

### `runtimeOnly`

The `runtimeOnly` configuration allows us to declare dependencies that are not needed at compile time, but will be needed at runtime, similar to Maven's `runtime` scope. 

An example is again SLF4J where we include `slf4j-api` to the `implementation` configuration and an implementation of that API (like `slf4j-log4j12` or `logback-classic`) to the `runtimeOnly` configuration.

| When available?                                                            | Transitive ? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
|{::nomarkdown}<ul><li>runtime</li></ul>         {:/}  | no           | yes                   |

### `testImplementation`

Similar to `implementation`, but dependencies declared with `testImplementation` are only available during compilation and runtime of tests. 

We can use it for declaring dependencies to testing frameworks like [JUnit](https://junit.org/junit5/) or [Mockito](https://site.mockito.org/) that are only needed in tests and should not be available in the production code.

| When available?                                                            | Transitive ? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
|{::nomarkdown}<ul><li>test compile time</li><li>test runtime</li></ul>  {:/}  | no           | no                   |

### `testCompileOnly`

Similar to `compileOnly`, but dependencies declared with `testCompileOnly` are only available during compilation of tests.

I can't think of a specific example, but there may be some annotation processors similar to [Lombok](https://projectlombok.org/) that are only relevant for tests.

| When available?                                                            | Transitive ? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
|{::nomarkdown}<ul><li>test compile time</li></ul>   {:/}  | no           | no                   |


### `testRuntimeOnly`the

Similar to `runtimeOnly`, but dependencies declared with `testRuntimeOnly` are only available during runtime of tests.

An example would be declaring a depenendcy to the [JUnit Jupiter Engine](https://stackoverflow.com/questions/48448331/difference-between-junit-jupiter-api-and-junit-jupiter-engine), which runs our unit tests, but which we don’t compile against.

| When available?                                                            | Transitive ? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
|{::nomarkdown}<ul><li>test runtime</li></ul>   {:/}  | no           | no                   |

### Combining Gradle Configurations

Since the Gradle configurations are very specific, sometimes we might want to combine their features. In this case, we can declare a dependency with more than one configuration. For example, if we want a `compileOnly` dependency to also be available at test compile time, we additionaly declare it to the `testCompileOnly` configuration:

```groovy
compileOnly 'org.projectlombok:lombok:1.18.8'
testCompileOnly 'org.projectlombok:lombok:1.18.8'
```

To remove the duplicate declaration, we could also tell Gradle that we want the `testCompileOnly` configuration to include everything from the `compileOnly` configuration:

```groovy
configurations {
    testCompileOnly.extendsFrom compileOnly
}
``` 

Do this with care, however, since we're losing flexibility in declaring dependencies every time we're combining two configurations this way.

## Maven Scopes vs. Gradle Configurations

Maven scopes don't translate perfectly to Gradle configurations because Gradle configurations are more granular. However,
here's a table that translates between Maven scopes and Gradle configurations with a few notes about differences:

| Maven Scope | Equivalent Gradle Configuration                                                                                                                                | 
| ------------| -------------------------------------------------------------------------------------------------------------------------------------------------------------  | 
| `compile`   | {::nomarkdown}<ul><li>`implementation` if the dependency should not be transitive</li><li>`api` if the dependency should be transitive</li></ul>{:/}                              | 
| `provided`  | `compileOnly` and potentially `testCompileOnly`; be aware that `provided` dependencies are also available at runtime while `compileOnly` dependencies are not. | 
| `runtime`   | `runtimeOnly`                                                                                                                                                  | 
| `test`      | `testImplementation`                                                                                                                                           | 

## Conclusion

Gradle, being the younger build tool, provides a lot more flexibility in declaring dependencies. It allows to distinguish better between compile time and runtime dependencies as well as between transitive and intransitive dependencies.

