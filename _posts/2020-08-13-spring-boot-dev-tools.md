---
title: Optimize Your Dev Loop with Spring Boot Dev Tools
categories: ["Java"]
date: 2020-08-13 05:00:00 +1100
modified: 2020-08-13 05:00:00 +1100
author: default
excerpt: "Having to restart a Spring Boot application again and again to test changes costs a lot of time. If it takes long enough, we're not only losing the time of the restart but also have to pay the cost of context switching, because we've started to work on something else in the meantime. Spring Boot Dev Tools reduces the time we lose considerably, if configured correctly."
image:
  auto: 0078-hourglass
---

What are you doing when you've made a change to a Spring Boot app and want to test it? 

**You probably restart it and go get a coffee or swipe through your Twitter feed until it's up and running again**. 

Then, you log back into the app, navigate to where you were before, and check if your changes work. 

Sound familiar? That's pretty much how I developed Spring Boot apps for a long time. Until I got fed up with it and gave Spring Boot Dev Tools a try. 

It took me some time to set it up to my satisfaction (and then some more time to build a [Gradle plugin](https://github.com/thombergs/spring-boot-devtools-gradle-plugin) that makes the setup easier), but it was worth it.

This article explains how Spring Boot Dev Tools works and how to configure it to your Spring Boot application consisting of a single or multiple Gradle modules (it will probably also work with Maven, with some changes, but this article will only show the Gradle configuration). 

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/devtools-demo/" %}

## The Perfect Dev Loop

Before we start, let's describe what we want to achieve for our developer experience with Spring Boot.

**We want that any changes we do to files are visible in the running Spring Boot app a couple of seconds later**.

These files include:

* Java files
* static assets like Javascript files or CSS
* HTML templates
* resources files like properties or other configuration files.

Files that need to be compiled (like Java files), will require a restart of the Spring application context. 

For files that don't need to be compiled (like HTML templates), we want the turnaround time to be even faster, as they don't require a restart of the application context.

So, the dev loop we're aiming for looks like this:

* we start the Spring Boot app via `./gradlew bootrun` or `./mvnw spring-boot:run`
* we change a file in our IDE and save it
* the IDE runs a background task that updates the classpath of the running application
* our browser window automatically refreshes and shows the changes

## How Does Spring Boot Dev Tools Work?

You might say it's not important to know the details of how Spring Boot Dev Tools work, but since a lot of things can break in auto-reloading files, I think it's good to know how Spring Boot Dev Tools works under the cover. 

**Having a solid understanding will help in finding and fixing inevitable issues when optimizing the dev loop of your project**.

[Spring Boot Dev Tools](https://docs.spring.io/spring-boot/docs/current/reference/html/using-spring-boot.html#using-boot-devtools) hooks into the classloader of Spring Boot to provide a way to restart the application context on-demand or to reload changed static files without a restart.

To do this, Spring Boot Dev Tools divides the application's classpath into two classloaders: 

* the base classloader contains rarely changing resources like the Spring Boot JARs or 3rd party libraries
* the restart classloader contains the files of our application, which are expected to change in our dev loop.

The restart functionality of Spring Boot Dev Tools listens to changes to the files in our application and then throws away and restarts the restart classloader. **This is faster than a full restart because only the classes of our application have to be reloaded**.

## Installing a Live Reload Plugin

Before configuring Spring Boot Dev Tools, make sure to have a [Livereload](http://livereload.com/) plugin installed for your browser. Spring Boot Dev Tools ships with a livereload server that will trigger such a plugin and cause the current page to be reloaded automatically.

The Chrome plugin shows an icon with two arrows and a dot in the middle (<img alt="livereload inactive" style="display:inline" src="/assets/img/posts/spring-boot-dev-tools/livereload-inactive.png">). Click on it to activate livereload for the currently active browser tab and the dot in the middle will turn black (<img alt="livereload active" style="display:inline" src="/assets/img/posts/spring-boot-dev-tools/livereload-active.png">).

## Setting up Dev Tools for a Single-Module App

Let's first discuss setting up Spring Boot Dev Tools for the most common case: we have a single Gradle (or Maven) module that contains all the code we're working on. We may pull in some 1st party or 3rd party JARs from other projects, but we're not changing their code, so **our dev loop only needs to support changes to the code within the Spring Boot module**. 

If you want to play around with a working example, have a look at the `app` module of my example app [on GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/devtools-demo/). 

### Basic setup

To activate the basic features of Spring Boot Dev Tools, we only need to add it to our dependencies:

```groovy
plugins {
  id 'org.springframework.boot' version '2.3.2.RELEASE'
}

dependencies {
  developmentOnly("org.springframework.boot:spring-boot-devtools")
  // other dependencies
}
```

The Spring Boot Gradle plugin automatically adds the `developmentOnly` configuration. Any dependency in this configuration will not be included in the production build. In older versions of the Spring Boot plugin, we might have to create the `developmentOnly` configuration ourselves.

### Restarting on Changes to Java Files

With the dev tools declared as a dependency, all we need to do is to start the application with `./gradlew bootrun`, change a Java file, and hit "compile" in our IDE. The changed class will be compiled into the folder `/build/classes`, which is on the classpath for the running Spring Boot app.

**Spring Boot Dev Tools will notice that a file has changed and trigger a restart of the application context**. Once that is done, the embedded livereload server will call out to the browser plugin which will refresh the page that's currently open in our browser.

Pretty neat.

**But changing a static file like an HTML template or a Javascript file will also trigger a restart, even though this isn't necessary!**

### Reloading on Changes to Static Files

In addition to re-*starting*, Spring Boot Dev Tools supports re-*loading* without restarting the application context. 

It will reload any static files that are excluded from a restart in our `application.yml`:

```yaml
spring:
  devtools:
    restart:
      exclude: static/**,templates/**,custom/**
```

Any changes to a file in `src/main/resources/static`, `src/main/resources/templates`, and `src/main/resources/custom` will now trigger a *reload* instead of a *restart*.

To reload on changing a static file, we need a way to copy the changed files into the classpath of the running app. With Gradle, this is as easy as adding a custom task to `build.gradle`:

```groovy
task reload(type: Copy) {
    from 'src/main/resources'
    into 'build/resources/main'
    include 'static/**'
    include 'templates/**'
    include 'custom/**'
}
```

When we run `./gradlew reload` now, all files in `src/main/resources/static`, `src/main/resources/templates`, and `src/main/resources/custom` will be copied into the classpath of the running Spring Boot app.

Now, **if we run `./gradlew reload`, it won't trigger a restart**, but changes to any of the files we included in the task will still be visible in the running app almost instantly.

If our IDE supports save actions or other shortcuts, **we can link this task to a shortcut to quickly update the running app with our changes to static files**.

## Setting up Dev Tools for a Multi-Module App

The above works quite well already for a single module app, i.e. when we're interested in code changes within the Gradle or Maven module that contains our Spring Boot app.

**Properly modularized applications usually consist of multiple build modules**. 

In addition to the main module that contains the Spring Boot application, we may have specialized modules that contribute the UI, a REST API, or a business component from a certain [bounded context](https://reflectoring.io/java-components-clean-boundaries/).

Each of the submodules is declared as a dependency in the main module and thus will contribute a JAR file to the final Spring Boot JAR (or WAR) file.

**But Spring Boot Dev Tools only listens for changes in the `build` folder of the main module and not for changes in a contributing JAR file**. 

That means we have to go the extra mile to trigger a restart or a reload on changes in the contributing modules.

The [example app](https://github.com/thombergs/code-examples/tree/master/spring-boot/devtools-demo/) on GitHub contains a module named `module` if you want to have a closer look.

### Restarting on Changes in Java Files of the Module

Like with changes to Java files in the main module, we want changes in a Java file of the contributing module to trigger a restart of the application context.  

We can achieve this with two more custom Gradle tasks in the `build.gradle` of our main module (or their equivalent in Maven): 

```groovy
task restart {
  dependsOn(classes)
  dependsOn('restartModule')
}

task restartModule(type: Copy){
  from '../module/build/classes/'
  into 'build/classes'
  
  dependsOn(':module:classes')
}
```

In the `restart` task, we make sure that the `classes` task of the main module will be called to update the files in the `build` folder. Also, we trigger the `restartModule` task, which in turn triggers the same task in the module and copies the resulting files into the `build` folder of the main module. 

Calling `./gradlew restart` will now compile all changed classes and resources and update the running app's classpath, triggering a restart.

**This will work for changes in any file in the main module or the contributing submodule.**

But again, this will always trigger a restart. For lightweight changes on static resources, we don't want to trigger a restart.

### Reloading on Changes in Static Files of the Module

So, we create another task, called `reload`, that doesn't trigger a restart:

```groovy
task reload(type: Copy) {
  from 'src/main/resources'
  into 'build/resources/main'
  include 'static/**'
  include 'templates/**'
  include 'custom/**'
  dependsOn('reloadModule')
}

task reloadModule(type: Copy){
  from '../module/src/main/resources'
  into 'build/resources/main'
  include 'static/**'
  include 'templates/**'
  include 'custom/**'
}
```

The task is the same as in the [single module example](#reloading-on-changes-to-static-files) above, with the addition of calling the `reloadModule` task, which will copy the module's resources into the `build` folder of the main module to update the running app's classpath. 

Now, as with the single module example, **we can call `./gradlew reload` to trigger a reload of static resources that does not trigger a restart of the application context**.

### Avoiding Classloading Issues

If you run into classloading issues when starting a multi-module app with Dev Tools enabled, the cause may be that **a contributing module's JAR file was put into the base classloader and not into the restart classloader**. 

Changing dependencies between classes across the two classloaders will cause problems.  

To fix these issues, we need to tell Spring Boot Dev Tools to include all the JARs of our contributing modules in the restart class loader. In `META-INF/spring-devtools.properties`, we need to mark each JAR file that should be part of the restart class loader:

```properties
restart.include.modules=/devtools-demo.*\.jar
```

### And What if I Have Many Modules?

The above works nicely if we have a single module that contributes a JAR file to the main Spring Boot application. But what if we have many modules like that?

We can just create a `restartModule` and a `reloadModule` task for each of those modules and add them as a dependency to the main tasks `restart` and `reload` and it should work fine. 

However, note that **the more modules are involved during a restart or a reload, the longer it will take to run the Gradle tasks**! 

At some point, we'll have lost most of the speed advantage over just restarting the Spring Boot app manually. 

So, **choose wisely for which modules you want to support reloading and restarting**. Most likely, you're not working on all modules at the same time anyways, so you might want to change the configuration to restart and reload only the modules you're currently working on.

My [Gradle plugin](https://github.com/thombergs/spring-boot-devtools-gradle-plugin) makes configuring multiple modules easy, by the way :).

## Don't Lose Your Session

**When Spring Boot Dev Tools restarts the application context, any server-side user session will be lost**.

If we were logged in before the restart, we'll see the login screen again after the restart. We have to log back in and then navigate to the page we're currently working on. This costs a lot of time.

To fix this, I suggest storing the session in the database.

For this, we need to add this dependency to our `build.gradle`:

```text
dependencies {
  implementation 'org.springframework.session:spring-session-jdbc'
  ...
}
``` 

Then, we need to provide the database tables for Spring Session JDBC to use. We can pick one of the schema files,  add it to our [Flyway](/database-migration-spring-boot-flyway/) or [Liquibase](/database-migration-spring-boot-liquibase/) scripts, and we're done. 

**The session will now be stored in the database and will survive a restart of the Spring Boot application context**. 

Nice bonus: the session will also survive a failover from one application instance to another, so we don't have to configure sticky sessions in a load balancer if we're running more than one instance.

Be aware, though, that everything stored in the session now has to implement the `Serializable` interface and we have to be a bit more careful with changing the classes that we store in the session to not cause problems to the users when we're updating our application.

## Using the Spring Boot Dev Tools Gradle Plugin

If you don't want to build custom Gradle tasks, have a look at the [Spring Boot Dev Tools Gradle Plugin](https://github.com/thombergs/spring-boot-devtools-gradle-plugin), which I have built to cover most of the use cases described in this article with an easier configuration. Give it a try and let me know what's missing!

## Conclusion

Updating the classpath of a running app is often considered to be black magic. This tutorial gave some insights into this "magic" and outlined a plain non-magic way to optimize the turnaround time when developing a Spring Boot application. 

Spring Boot Dev Tools is the tool that makes it possible and my [Gradle plugin](https://github.com/thombergs/spring-boot-devtools-gradle-plugin) makes it even easier to configure your project for a quick dev loop.





