---
title: "How to Configure Environment-Specific Logging Behavior with Spring Boot" 
categories: [howto, logging]
modified: 2018-08-10
author: tom
tags: [transparency, logging, log, format]
comments: true
ads: true
header:
  teaser: 
  image: 
excerpt: "A guide to configuring different logging behavior in different runtime environments."
sidebar:
  nav: logging
  toc: true
---

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-logging" %}



In the Tip [Use a Human-Readable Logging Format](/logging-format), I proposed to use a human-readable logging format
so that we can quickly scan a log to find the information we need. However, a human-readable
logging format may not be needed or even desirable in every runtime environment. 

We definitely want a human-readable logging format when we're working on our local machine.
But in a staging environment we might want to log to a log server instead, which may
need a completely different set of logging configurations.

## Spring Profiles

To differentiate between our runtime environments, we make use 
of [Spring Profiles](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-profiles.html).

When starting our application, we can define which profile should be active by specifying
the `spring.profiles.active` environment variable or adding the parameter 
`--spring.profiles.active=...` to the command line when starting the JAR.

Depending on this profile, we want to modify the logging behavior of the application. 

Let's say we have two profiles: `dev` and `staging`. 

While developing on our local
machine, we use the `dev` profile and 
want to have a nice, human-readable log format.

When the application is deployed to our `staging` environment, we want a CSV format
instead of a human-readable format, because we have configured some fancy log slurper that reads the logs from
the console, parses them and publishes them somewhere else for later reference. 

## Using Profiles in logback-spring.xml

When using Logback as our logging framework [Spring Boot allows to define a file](https://docs.spring.io/spring-boot/docs/current/reference/html/howto-logging.html#howto-configure-logback-for-logging) named `logback-spring.xml`. This replaces
the normal `logback.xml` in the resources folder and allows 
us to use some fancy templating features to
modify the content depending on certain parameters.

The above requirements can be achieved with this configuration:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>

  <springProfile name="dev">
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
      <encoder>
        <pattern>
          %d{HH:mm:ss.SSS} | %5p | %logger{25} | %m%n
        </pattern>
        <charset>utf8</charset>
      </encoder>
    </appender>

    <root level="DEBUG">
      <appender-ref ref="CONSOLE"/>
    </root>
  </springProfile>

  <springProfile name="staging">
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
      <encoder>
        <pattern>
          %d{yyyy-MM-dd};%d{HH:mm:ss.SSS};%t;%5p;%logger{25};%m%n
        </pattern>
        <charset>utf8</charset>
      </encoder>
    </appender>

    <root level="DEBUG">
      <appender-ref ref="CONSOLE"/>
    </root>
  </springProfile>

</configuration>
```

Using `<springProfile>`, we can distinguish between different profiles. When the appplication
runs in the `dev` profile, it logs with a human-readable pattern. In the `staging` profile,
it logs some more data, separated by ";" characters.

## Provide a Default Behavior

Using the above configuration, we **must** specify one of the two available profiles
when starting the application. Otherwise, we would get no log output at all (see [LoggingWithoutProfileTest](https://github.com/thombergs/code-examples/blob/master/spring-boot/spring-boot-logging/src/test/java/io/reflectoring/springbootlogging/LoggingWithoutProfileTest.java)
in the [github repo](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-logging)).

If we want to provide a default behavior, we can add another `<springProfile>` section
that is used when none of the valid profiles is matching.

```xml
<springProfile name="!dev,!staging">
  ...
</springProfile>
```

## Conclusion

Using Logback with Spring Boot, we can make us of Spring's Profile feature and create 
a logging configuration for each profile. 

This could be used to define a different [logging format](/logging-format) or a 
different logging destination for each profile, for example.  

 

 
