---

title: Loading External Application Properties in the Gradle bootRun Task
categories: [spring-boot]
modified: 2017-01-25
author: tom
tags: [gradle, spring boot, bootrun, properties, application.properties]
comments: true
ads: true
excerpt: "Configuration parameters should not be baked into code - including 
          the code of your build scripts. This tutorial shows how use the Gradle bootRun task to
          start a Spring Boot application with application parameters loaded from a properties file." 
---

{% include sidebar_right %}

The Spring Boot gradle plugin provides the `bootRun` task that allows a 
developer to start the application in a "developer mode" without first building
a JAR file and then starting this JAR file. Thus, it's a quick way to test
the latest changes you made to the codebase.

Sadly, most applications cannot be started or would not work correctly without
specifying a couple configuration parameters. Spring Boot supports such 
parameters with it's `application.properties` file. The parameters in this file
are automatically read when the application is started from a JAR
and passed to the application.

The `bootRun` task also allows to define such properties. 
The common way of doing this is like this in the `build.gradle` file: 

```groovy
bootRun {
  jvmArgs =
    [
      "-DmyApp.myParam1=value1",
      "-DmyApp.myParam2=value2"
    ]
}
```

However, if your are working at the codebase together with other developers,
each developer may want to test different use cases and needs different
configuration values. She would have to edit the `build.gradle` each time.
And each time she checks in changes to the codebase, she has to check if
the `build.gradle` file should really be checked in. Which is not what we want.

The solution to this problem is a specific properties file for each developer's 
local environment that is not checked into the VCS. 
Let's call it `local.application.properties`. In this file, put your applications
configuration parameters just as you would in a real `application.properties` file.

To make the `bootRun` task load these properties, add the following snippet to your
`build.gradle`:

```groovy
def Properties localBootRunProperties() {
    Properties p = new Properties();
    p.load(new FileInputStream(
      file(project.projectDir).absolutePath + "/local.application.properties"))
    return p;
}
```

Then, in your `bootRun` task, fill the `systemProperties` attribute as follows:

```groovy
bootRun {
  doFirst {
    bootRun.systemProperties = localBootRunProperties()
  }
}
```

The call to `localBootRunProperties()` is put into the `doFirst` closure so that
it gets executed only when the task itself is executed. Otherwise event all other tasks
would fail with a `FileNotFoundException` if the properties file is not found
instead of only the `bootRun` task.

## Further Reading

* [Spring Boot Gradle Plugin](http://docs.spring.io/spring-boot/docs/current/reference/html/build-tool-plugins-gradle-plugin.html)

