---
title: Maven Scopes and Gradle Configurations Explained
categories: [tools]
modified: 2017-07-24
author: tom
tags: [gradle, maven, scope, configuration]
comments: true
ads: true
excerpt: "An explanation and comparison of Maven scopes and Gradle configurations to declare dependencies in a build file."
sidebar:
  toc: true
---

<style>
.scope-table td {
  width:25%;
}
</style>



One of the key features of a build tool for Java is dependency management. We declare that we want to use a certain third-party library in our own project and **the build tool takes care of downloading it and adding it to the classpath at the right times in the build lifecycle**.

Maven has been around as a build tool for a long time. It's stable and still well liked in the Java community. 

Gradle has emerged as an alternative to Maven quite some time ago, heavily relying on Maven dependency infrastructure, but providing a more flexible way to declare dependencies.

Whether you're moving from Maven to Gradle or you're just interested in the different ways of declaring dependencies in Maven or Gradle, this article will give an overview.   

## What's a Scope / Configuration?

**A Maven `pom.xml` file or a Gradle `build.gradle` file specifies the steps necessary to create a software artifact from our source code**. This artifact can be a JAR file or a WAR file, for instance.

In most non-trivial projects, we rely on third-party libraries and frameworks. So, **another task of build tools is to manage the dependencies to those third-party libraries and frameworks**.

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

* **In which steps of the build lifecycle will the dependency be made available?** Will it be available at compile time? At runtime? At compile and runtime of tests?
* **Is the dependency transitive?** Will it be exposed to consumers of our own project, so that they can use it, too? If so, will it leak into the consumers' compile time and / or the consumers' runtime?
* **Is the dependency included in the final build artifact?** Will the WAR or JAR file of our own project include the JAR file of the dependency?

In the above example, we added the SLF4J dependency to the Maven `compile` scope and the Gradle `implementation` configuration, which can be considered the defaults for Maven and Gradle, respectively. 

Let's look at the semantics of all those scopes and configurations.

## Maven Scopes

Maven provides [6 scopes](http://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html#Dependency_Scope) for Java projects.

We're not going to look at the `system` and `import` scopes, however, since they are rather exotic.

### `compile`

The `compile` scope is the default scope. We can use it **when we have no special requirements** for declaring a certain dependency.

| When available?                                                                    | Leaks into consumers' compile time? | Leaks into consumers' runtime? | Included in Artifact? |
| ---------------------------------------------------------------------------------- | ------------ | --------------------- |
| {::nomarkdown}<ul><li>compile time</li><li>runtime</li><li>test compile time</li><li>test runtime</li></ul>{:/} | yes     | yes                   | yes |
{: .scope-table}

Note that the `compile` scope leaks into the compile time, thus promoting [dependency pollution](/gradle-pollution-free-dependencies/#whats-dependency-pollution).

### `provided`

We can use the `provided` scope **to declare a dependency that will not be included in the final build artifact**.

If we rely on the Servlet API in our project, for instance, and we deploy to an application server that already provides the Servlet API, then we would add the dependency to the `provided` scope.  

| When available?                                                                    | Leaks into consumers' compile time? | Leaks into consumers' runtime? | Included in Artifact? |
| ---------------------------------------------------------------------------------- | ------------ | --------------------- |
| {::nomarkdown}<ul><li>compile time</li><li>runtime</li><li>test compile time</li><li>test runtime</li></ul>{:/} | no           | no                   | no |
{: .scope-table}

### `runtime`

We use the `runtime` scope **for dependencies that are not needed at compile time**, like when we're compiling against an API and only need the implementation of that API at runtime.

An example is [SLF4J](https://www.slf4j.org/) where we include `slf4j-api` to the `compile` scope and an implementation of that API (like `slf4j-log4j12` or `logback-classic`) to the `runtime` scope.

| When available?                             | Leaks into consumers' compile time? | Leaks into consumers' runtime? | Included in Artifact? |
| ------------------------------------------- | ------------ | --------------------- |
| {::nomarkdown}<ul><li>runtime</li><li>test runtime</li></ul>{:/} | no           | yes                   | yes |
{: .scope-table}

### `test`

We can use the `test` scope **for dependencies that are only needed in tests** and that should not be available in production code.
 
Examples dependencies for this scope are testing frameworks like [JUnit](https://junit.org/junit5/), [Mockito](https://site.mockito.org/), or [AssertJ](https://joel-costigliola.github.io/assertj/).

| When available?                                                            | Leaks into consumers' compile time? | Leaks into consumers' runtime? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
| {::nomarkdown}<ul><li>test compile time</li><li>test runtime</li></ul>{:/} | no           | no                   | no
{: .scope-table}


## Gradle Configurations

Gradle has a [more diverse set of configurations](https://docs.gradle.org/current/userguide/java_library_plugin.html#sec:java_library_configurations_graph). This is the result of Gradle being younger and more actively developed, and thus able to adapt to more use cases.

Let's look at the standard configurations of Gradle's Java Library Plugin. Note that **we have to declare the plugin in the build script** to get access to the configurations: 

```groovy
plugins {
    id 'java-library'
}
```

### `implementation`

The `implementation` configuration should be considered the default. We use it **to declare dependencies that we don’t want to expose to our consumers' compile time**.

This configuration was introduced to replace the deprecated `compile` configuration [to avoid polluting the consumer's compile time](/gradle-pollution-free-dependencies/#gradles-solution) with dependencies we actually don't want to expose. 

| When available?                                                            | Leaks into consumers' compile time? | Leaks into consumers' runtime? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
| {::nomarkdown}<ul><li>compile time</li><li>runtime</li><li>test compile time</li><li>test runtime</li></ul>{:/} |   no | yes        | yes                   |
{: .scope-table}


### `api`

We use the `api` configuration do declare dependencies that are part of our API, i.e. **for dependencies that we explicitly want to expose to our consumers**.

This is the only standard configuration that exposes dependencies to the consumers' compile time. 

| When available?                                                            | Leaks into consumers' compile time? | Leaks into consumers' runtime? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
| {::nomarkdown}<ul><li>compile time</li><li>runtime</li><li>test compile time</li><li>test runtime</li></ul>{:/} | yes           | yes                   | yes |
{: .scope-table}

### `compileOnly`

The `compileOnly` configuration allows us **to declare dependencies that should only be available at compile time**, but are not needed at runtime. 

An example use case for this configuration is an annotation processor like [Lombok](https://projectlombok.org/), which modifies the bytecode at compile time. After compilation it's not needed anymore, so the dependency is not available at runtime. 

| When available?                                                            | Leaks into consumers' compile time? | Leaks into consumers' runtime? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
|{::nomarkdown}<ul><li>compile time</li></ul>     {:/}  | no           | no                   | no |
{: .scope-table}

### `runtimeOnly`

The `runtimeOnly` configuration allows us **to declare dependencies that are not needed at compile time, but will be available at runtime**, similar to Maven's `runtime` scope. 

An example is again [SLF4J](https://www.slf4j.org/) where we include `slf4j-api` to the `implementation` configuration and an implementation of that API (like `slf4j-log4j12` or `logback-classic`) to the `runtimeOnly` configuration.

| When available?                                                            | Leaks into consumers' compile time? | Leaks into consumers' runtime? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
|{::nomarkdown}<ul><li>runtime</li></ul>         {:/}  | no | yes           | yes                   |
{: .scope-table}

### `testImplementation`

Similar to `implementation`, but dependencies declared with `testImplementation` **are only available during compilation and runtime of tests**. 

We can use it for declaring dependencies to testing frameworks like [JUnit](https://junit.org/junit5/) or [Mockito](https://site.mockito.org/) that we only need in tests and that should not be available in the production code.

| When available?                                                            | Leaks into consumers' compile time? | Leaks into consumers' runtime? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
|{::nomarkdown}<ul><li>test compile time</li><li>test runtime</li></ul>  {:/}  | no | no           | no                   |
{: .scope-table}

### `testCompileOnly`

Similar to `compileOnly`, but dependencies declared with `testCompileOnly` are **only available during compilation of tests** and not at runtime.

I can't think of a specific example, but there may be some annotation processors similar to [Lombok](https://projectlombok.org/) that are only relevant for tests.

| When available?                                                            | Leaks into consumers' compile time? | Leaks into consumers' runtime? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
|{::nomarkdown}<ul><li>test compile time</li></ul>   {:/}  | no           | no                   | no |
{: .scope-table}


### `testRuntimeOnly`

Similar to `runtimeOnly`, but dependencies declared with `testRuntimeOnly` are **only available during runtime of tests** and not at compile time.

An example would be declaring a dependency to the [JUnit Jupiter Engine](https://stackoverflow.com/questions/48448331/difference-between-junit-jupiter-api-and-junit-jupiter-engine), which runs our unit tests, but which we don’t compile against.

| When available?                                                            | Leaks into consumers' compile time? | Leaks into consumers' runtime? | Included in Artifact? |
| -------------------------------------------------------------------------- | ------------ | --------------------- |
|{::nomarkdown}<ul><li>test runtime</li></ul>   {:/}  | no           | no                   | no |
{: .scope-table}

### Combining Gradle Configurations

Since the Gradle configurations are very specific, sometimes we might want to combine their features. In this case, **we can declare a dependency with more than one configuration**. For example, if we want a `compileOnly` dependency to also be available at test compile time, we additionally declare it to the `testCompileOnly` configuration:

```groovy
dependencies {
  compileOnly 'org.projectlombok:lombok:1.18.8'
  testCompileOnly 'org.projectlombok:lombok:1.18.8'
}
```

To remove the duplicate declaration, we could also tell Gradle that we want the `testCompileOnly` configuration to include everything from the `compileOnly` configuration:

```groovy
configurations {
  testCompileOnly.extendsFrom compileOnly
}

dependencies {
  compileOnly 'org.projectlombok:lombok:1.18.8'
}
``` 

**Do this with care**, however, since we're losing flexibility in declaring dependencies every time we're combining two configurations this way.

## Maven Scopes vs. Gradle Configurations

Maven scopes don't translate perfectly to Gradle configurations because Gradle configurations are more granular. However,
here's a table that translates between Maven scopes and Gradle configurations with a few notes about differences:

| Maven Scope | Equivalent Gradle Configuration                                                                                                                                | 
| ------------| -------------------------------------------------------------------------------------------------------------------------------------------------------------  | 
| `compile`   | `api` if the dependency should be exposed to consumers, `implementation` if not                              | 
| `provided`  | `compileOnly` (note that the `provided` Maven scope is also available at runtime while the `compileOnly` Gradle configuration is not) | 
| `runtime`   | `runtimeOnly`  
| `test`      | `testImplementation`                                                                                                                                           | 

## Conclusion

Gradle, being the younger build tool, provides a lot more flexibility in declaring dependencies. We have finer control
about whether dependencies are available in tests, at runtime or at compile time.  

Furthermore, with the `api` and `implementation`
configurations, Gradle allows us to explicitly specify which dependencies we want to expose to our consumers, reducing
[dependency pollution](/gradle-pollution-free-dependencies/#whats-dependency-pollution) to the consumers.  



