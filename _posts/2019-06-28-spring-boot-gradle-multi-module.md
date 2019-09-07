---
title: "Building a Multi-Module Spring Boot Application with Gradle"
categories: [spring-boot]
modified: 2019-06-28
excerpt: "A tutorial on how to split up a Spring Boot application into multiple Gradle modules."
image:
  auto: 0010-gray-lego

---



The [Spring Initializr](https://start.spring.io/) is a great way to quickly create a Spring Boot
application from scratch. It creates a single Gradle file that we can expand upon
to grow our application.

When projects become bigger, however, we might want to split our codebase 
into multiple build modules for better maintainability and understandability.

This article shows **how to split up a Spring Boot application into multiple build modules**
with Gradle.

{% include github-project.html url="https://github.com/thombergs/buckpal" %}

## What's a Module?

As we'll be using the word "module" a lot in this tutorial, let's first
define what a module is.

A module ...

* ... has a codebase that is separate from other modules' code,
* ... is transformed into a separate artifact (JAR file) during a build, and
* ... can define dependencies to other modules or third-party libraries.

**A module is a codebase that can be maintained and built 
separately from other modules' codebases**. 

However, a module is still part of a parent build
process that builds all modules of our application and combines them to
a single artifact like a WAR file.

## Why Do We Need Multiple Modules?

Why would we make the effort to split up our codebase into multiple 
modules when everything works just fine with a single, monolithic module?

The main reason is that **a single monolithic codebase is susceptible to architectural
decay**. Within a codebase, we usually use packages to demarcate architectural boundaries. 
But packages in Java aren't very good at protecting those boundaries (more about this in the chapter
"Enforcing Architecture Boundaries" of my [book](/get-your-hands-dirty-on-clean-architecture/)). Suffice it to say
that the dependencies between classes within a single monolithic codebase tend to quickly
degrade into a big ball of mud.

If we split up the codebase into multiple smaller modules that each has
clearly defined dependencies to other modules, we take a big step towards an easily maintainable
codebase. 

## The Example Application

Let's take a look at the modular example web application we're going to build in this tutorial. 
The application is called "BuckPal" and shall provide online payment functionality.
It follows the hexagonal architecture style described in my [book](/get-your-hands-dirty-on-clean-architecture/), 
which splits the codebase into separate, clearly defined architectural elements.
For each of those architectural elements, we'll create a separate Gradle build module,
as indicated by the following folder structure: 
 
```
├── adapters
|   ├── buckpal-persistence
|   |  ├── src
|   |  └── build.gradle
|   └── buckpal-web
|    ├── src
|    └── build.gradle
├── buckpal-application
|  ├── src
|  └── build.gradle
├── common
|  ├── src
|  └── build.gradle
├── buckpal-configuration
|  ├── src
|  └── build.gradle
├── build.gradle
└── settings.gradle
```

Each module is in a separate folder with Java sources, a `build.gradle` file, and
distinct responsibilities:

* The top-level `build.gradle` file configures build behavior that is shared between all sub-modules so that we don't have
  to duplicate things in the sub-modules.
* The `buckpal-configuration` module contains the actual Spring Boot application and any 
  Spring Java Configuration that puts together the Spring application context. To create the application
  context, it needs access to the other modules, which each provides certain parts of the application.
  I have also seen this module called `infrastructure` in other contexts. 
* The `common` module provides certain classes that can be accessed by all other modules.
* The `buckpal-application` module holds classes that make up the "application layer": 
  services that implement use cases which query and modify the domain model.
* The `adapters/buckpal-web` module implements the web layer of our application, which may call the uses
  cases implemented in the `application` module.
* The `adapters/buckpal-persistence` module implements the persistence layer of our application.

In the rest of this article, we'll look at how to create a separate Gradle module for each of those 
application modules. Since we're using Spring, it makes sense to cut our Spring application context
into multiple Spring modules along the same
boundaries, but that's a story for a [different article](/spring-boot-modules/). 

## Parent Build File

To include all modules in the parent build, we first need to list them in the
`settings.gradle` file in the parent folder: 

```
include 'common'
include 'adapters:buckpal-web'
include 'adapters:buckpal-persistence'
include 'buckpal-configuration'
include 'buckpal-application'
```

Now, if we call `./gradlew build` in the parent folder, Gradle will automatically
resolve any dependencies between the modules and build them in the correct order, regardless
of the order they are listed in `settings.gradle`.

For instance, the `common` module will be built before all other modules since
all other modules depend on it.

In the parent `build.gradle` file, we now define basic configuration that is shared across 
all sub-modules:

```groovy
plugins {
  id "io.spring.dependency-management" version "1.0.8.RELEASE"
}

subprojects {

  group = 'io.reflectoring.reviewapp'
  version = '0.0.1-SNAPSHOT'

  apply plugin: 'java'
  apply plugin: 'io.spring.dependency-management'
  apply plugin: 'java-library'

  repositories {
    jcenter()
  }

  dependencyManagement {
    imports {
      mavenBom("org.springframework.boot:spring-boot-dependencies:2.1.7.RELEASE")
    }
  }

}
```

First of all, we include the [Spring Dependency Management Plugin](https://docs.spring.io/dependency-management-plugin/docs/current/reference/html/)
which provides us with the `dependencyManagement` closure that we'll use later. 

Then, we define a shared configuration within the `subprojects` closure. **Everything within `subprojects` 
will be applied to all sub-modules**. 

The most important part within `subprojects` is the `dependencyManagement` closure.
Here, we can define any dependencies to Maven artifacts in a certain version.
If we need one of those dependencies within a sub-module, we can specify it in the sub-module without providing a version
number since the version number will be loaded from the `dependencyManagement`
closure. 

**This allows us to specify version numbers in a single place instead of spreading them over
multiple modules**, very similar to the `<dependencyManagement>` element in Maven's `pom.xml` files.

The only dependency we added in the example is the dependency to the Maven BOM (bill of materials)
of Spring Boot. This BOM includes [all dependencies that a Spring Boot application potentially might need](https://mvnrepository.com/artifact/org.springframework.boot/spring-boot-dependencies/2.1.5.RELEASE)
in the exact version that is compatible with a given Spring Boot version (2.1.5.RELEASE in this case).
Thus, we don't need to list every single dependency on our own and potentially get the version wrong.

Also, note that we apply the `java-library` plugin to all sub-modules. This enables us to use the
`api` and `implementation` configurations which allow us to define [finer-grained dependency scopes](/gradle-pollution-free-dependencies/).

## Module Build Files

In a module build file, we now simply add the dependencies the module needs.

The file `adapters/buckpal-persistence/build.gradle` looks like this:

```groovy
dependencies {
  implementation project(':common')
  implementation project(':buckpal-application')
  implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
  
  // ... more dependencies
}
```

The persistence module depends on the `common` and the `application` module. The `common` module
is used by all modules, so this dependency is natural. The dependency to the `application` module
comes from the fact that we're following a hexagonal architecture style in which the persistence
module implements interfaces located in the application layer, thus acting as a persistence "plugin" 
for the application layer.

More importantly, however, we add the dependency to `spring-boot-starter-data-jpa` which
provides Spring Data JPA support for a Spring Boot application. **Note that we did not add
a version number** because the version is automatically resolved from the `spring-boot-dependencies`
BOM in the parent build file. In this case, we'll get the version that is compatible with Spring Boot 2.1.5.RELEASE.

Note that we added the `spring-boot-starter-data-jpa` dependency to the `implementation` configuration.
This means that this dependency does not leak into the compile time of the modules that include the persistence module as a dependency. This keeps us from accidentally using JPA classes in modules where we don't want it.

The build file for the web layer, `adapters/buckpal-web/build.gradle`, looks similar, just with a dependency
to `spring-boot-starter-web` instead:

```groovy
dependencies {
  implementation project(':common')
  implementation project(':application')
  implementation 'org.springframework.boot:spring-boot-starter-web'
  
  // ... more dependencies
}
```

Our modules have access to all the classes they need to build a web or persistence
layer for a Spring Boot application, without having unnecessary dependencies. 

The web module knows nothing about persistence and vice versa. As a developer, **we cannot
accidentally add persistence code to the web layer or web code to the persistence layer**
without consciously adding a dependency to a `build.gradle` file. This helps to avoid
the dreaded big ball of mud.

## Spring Boot Application Build File

Now, all we have to do is to aggregate those modules into a single Spring Boot application.
We do this in the `buckpal-configuration` module. 

In the `buckpal-configuration/build.gradle` build file, we add the dependencies to all
of our modules:

```groovy
plugins {
  id "org.springframework.boot" version "2.1.7.RELEASE"
}

dependencies {

  implementation project(':common')
  implementation project(':buckpal-application')
  implementation project(':adapters:buckpal-persistence')
  implementation project(':adapters:buckpal-web')
  implementation 'org.springframework.boot:spring-boot-starter'

  // ... more dependencies
}
```

We also add the [Spring Boot Gradle plugin](https://docs.spring.io/spring-boot/docs/current/gradle-plugin/reference/html/) that,
among other things, gives us the `bootRun` Gradle task.
We can now start the application with Gradle using `./gradlew bootRun`.

Also, we add the obligatory `@SpringBootApplication`-annotated class to the source folder of 
the `buckpal-configuration` module: 

```java
@SpringBootApplication
public class BuckPalApplication {

  public static void main(String[] args) {
    SpringApplication.run(BuckPalApplication.class, args);
  }

}
```

This class needs access to the `SpringBootApplication` and `SpringApplication` classes
that the `spring-boot-starter` dependency gives us access to.

## Conclusion

In this tutorial, we've seen how to split up a Spring Boot application into multiple Gradle modules
with the help of the Spring Dependency Plugin for Gradle. We can follow this approach to split an application
up along technical layers like in the [example application on GitHub](https://github.com/thombergs/clean-architecture-example), 
or along [functional boundaries](/testing-verticals-and-layers-spring-boot/), or both. 

A very similar approach can be used with Maven.

If you'd like another perspective on the topic, there's also a [Spring guide](https://spring.io/guides/gs/multi-module/) 
on creating a multi-module Spring Boot application that talks about different aspects.
