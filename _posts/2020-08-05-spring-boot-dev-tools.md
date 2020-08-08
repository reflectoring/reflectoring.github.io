---
title: Improve Your Dev Loop with Spring Boot Dev Tools
categories: [java]
date: 2020-08-05 05:00:00 +1100
modified: 2020-08-05 05:00:00 +1100
author: tom
excerpt: ""
image:
  auto: 0051-stop
---

TODO: NEXT STEPS:`
 - create an example project with a single module and configure dev tools to make live reload for resources work

When I've been working on a Spring Boot application, I manually restarted my application with the Gradle `bootRun` task every time I made a change and waited until it was booted up again to test my changes.

While this works, this takes at least 5 seconds and, depending on the size of the application, can take a lot longer.

So, I dug into the Spring Boot Dev Tools to fix this situation. This article explains how to configure the Spring Boot Dev Tools to quickly restart your app on changes and, as a bonus, showcases a Gradle plugin I wrote to support Spring Boot Dev Tools with multi-module Gradle builds.

## The Perfect Dev Loop
* currently: change something, restart the app
* goals:
  * change a class -> Spring Boot restarts
  * change a resource file -> Spring Boot just reloads the class

## How Does Spring Boot Dev Tools Work?
* you start via `bootrun` or `spring-boot:run` task
* the app's classpath includes the `build` folder
* once you run a build, the files in `build` will be updated and Spring Boot Dev Tools restart the application context
* two class loaders
* caveat: you're losing your session!

## Installing a Live Reload Plugin

## Setting up Dev Tools for a Single-Module App

* Single Gradle module
* probably the most common setup 

### Basic setup

* re-building (CTRL+F9 in IntelliJ) will update the /build folder and trigger a restart
* but changing a template and then CTRL+F9 will still trigger a restart!

### Reloading on Changes to Static Files
* changing a template in build/resources/main/templates directly will trigger a reload but not a restart
* create a reload task that specifically only copies the reload files:

```groovy
task reload(type: Copy) {
    from 'src/main/resources'
    into 'build/resources/main'
    include 'static/**'
    include 'templates/**'
    include 'custom/**'
}
```

```yaml
spring:
  devtools:
    restart:
      exclude: static/**,templates/**,custom/**
```

### Restarting on Changes in Java Files
* either CTRL+F9
* only for symmetry :)

## Setting up Dev Tools for a Multi-Module App

* a sub module contributes a JAR file to the Spring Boot App
* dev tools only listens for changes in the build folder of the main module, not for changes in a JAR file

### Avoiding Classloading Issues

* add the module jar to the restart classloader in `spring-devtools.properties`:

```properties
restart.include.modules=/devtools-demo.*\.jar
```

### Reloading on Changes in Static Files in the Module

```groovy
task reload(type: Copy) {
    ...
    dependsOn('reloadFromModule')
}

task reloadFromModule(type: Copy){
    from '../module/src/main/resources'
    into 'build/resources/main'
    include 'static/**'
    include 'templates/**'
    include 'custom/**'
}
```

### Reloading on Changes in Java Files in the Module

## Using the Spring Boot Dev Tools Gradle Plugin



