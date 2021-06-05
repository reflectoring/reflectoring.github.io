---
title: "Per-Environment Logging With Plain Java and Spring Boot" 
categories: [spring-boot, java]
excerpt: "A guide to configuring different logging behavior in different runtime environments."
image:
  auto: 0031-matrix
---

Application logs are the most important resource when it comes to investigating issues and incidents. Imagine something goes wrong during your on-call rotation and you don't have any logs! If applied smartly, we can even harvest important business metrics from our logs. **Having no logs is equivalent to driving a car with your eyes closed.** You don't know where you're going and you're very likely to crash.

To make log data usable, we need to send it to the right place. When developing an app locally, we usually want to send the logs to the console or a local log file. When the app is running in a staging or production environment, we'll want to send the logs to a log server which the whole team can use to query the logs.

In this tutorial, **we're going to configure a Java application to send logs to the console or to a cloud logging provider depending on the environment the application is running in**. As the cloud provider we're going to use [Logz.io](https://logz.io), which provides a managed ELK stack solution with a nice frontend for querying logs.

We're going to look at:

* [Configuring a plain Java application with Log4J](#configuring-log4j-in-a-plain-java-application) 
* Configuring a plain Java application with Logback, and
* Configuring a Spring Boot application with Logback

In all cases, the application will be started with certain environment variables that control the logging behavior to send logs wither to the console or to the cloud.

## Why Should I Send My Logs to a Log Server?
Back in the days, logs were written into log files. There were sysadmins who guarded these log files. Every time I wanted to access the logs, I would write an email to the sysadmins. Once they read their mail, they would run some scripts to collect the log files from all server instances, filter them for the time period I was interested in, and put the resulting files on a shared network folder from where I would download them.

Then I would use command-line tools like `grep` and `sed` to search the log files for anything I'm interested in. Most often, I would find that the logs I had access to were not enough and I would have to repeat the whole procedure with the sysadmins for logs from a different time period - that was no fun!

At some point, log servers like Logstash and Graylog came along. Instead of sending logs into files, we could now send the logs to a server. Instead of asking sysadmins to send us the logs we need, we could now search the logs through a web UI!

The whole team now has access to a web UI to search the logs. Everybody who needs log data can easily get it. A log server is a key enabler for a "you built it, you run it" culture! It also reduces the mean time to restore (MTTR) - i.e. the time a team needs to restore a service after an incident - because the log data is directly available for analysis. **DevOps is unthinkable without a log server!**

To make things even easier, today we don't even have to set up our own log server, but we can send the logs to a fully managed log server provider in the cloud. In this article, we'll be sending logs to [Logz.io](https://logz.io) and then query the logs via their web UI.

## Setting Up a Logz.io Account
If you want to follow along with sending logs to the cloud, set up an account with [logz.io](https://logz/io). When logged in, click on the gear icon in the upper right and select Settings -> General. Under "Account settings", the page will show your token. Copy this token - we'll need it later to configure our application to send logs to the cloud.

## Per-Environment Logging for a Plain Java Application

If you're building a plain Java application that needs configurable logging, this is the tutorial to follow. We'll have a look at both Log4J and Logback and how to configure them to do different things in different runtime environments. You can clone or browse the example applications for [Log4J](https://github.com/thombergs/code-examples/tree/master/logging/log4j) and [Logback](https://github.com/thombergs/code-examples/tree/master/logging/log4j) on GitHub.

### Application Code

Our example application is very simple:

```java
public class Main {
  public static void main(String[] args) {
    Logger logger = LoggerFactory.getLogger(Main.class);
    logger.debug("This is a debug message");
    logger.info("This is an info message");
    logger.warn("This is a warn message");
    logger.error("This is an error message");
  }
}
```

It's just a small Java program with a `main()` method that logs a few lines using an SLF4J `Logger` instance. This program is a placeholder for any real Java application. SLF4J is a logging API that abstracts over the actual logging implementation, so we can use it for both Log4J and Logback (and other logging implementations, for that matter). This allows us to always implement against the same logging API, even if we decide to swap out the actual logging library underneath.

### Passing Environment Variables to the Application

We want to make the logging behave differently depending on the environment the application is running in. If the application is running on the local machine, we want the above log events to be send to the console. If it's running in a staging or production environment, we want it to log to our cloud logging provider.

But how does the application decide which environment it's running in? This is exactly what environment variables are there for. 

**We'll pass an environment variable with the name `LOG_TARGET` to the application on startup.** There are two possible values for this variable:

* `CONSOLE`: the app shall send the logs to the console 
* `LOGZIO`: the app shall send the logs to logz.io cloud 
  
This command will then start the app in "local" logging mode:
```
LOG_TARGET=CONSOLE java -jar app.jar 
```

And this command will start the app in "staging", or "production" logging mode:
```
LOG_TARGET=LOGZIO java -jar app.jar 
```

Let's now see how we can configure Log4J and Logback in our application to respect the `LOG_TARGET` environment variable.

### Configuring Log4J with Environment Variables
You can browse or clone the full example code of the Log4J application [on GitHub](https://github.com/thombergs/code-examples/tree/master/logging/log4j).

#### Adding Log4J Dependencies

To get Log4J working properly, we need to add the following dependencies to our application's `pom.xml`:

```xml
<dependencies>
  <dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-api</artifactId>
    <version>2.14.1</version>
  </dependency>
  <dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-core</artifactId>
    <version>2.14.1</version>
  </dependency>
  <dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-slf4j-impl</artifactId>
    <version>2.14.1</version>
  </dependency>
  <dependency>
    <groupId>io.logz.log4j2</groupId>
    <artifactId>logzio-log4j2-appender</artifactId>
    <version>1.0.12</version>
  </dependency>
</dependencies>
```

The first two dependencies are the log4j API and the log4J implementation. We could implement logging with just these two dependencies, already, but we additionally add the `log4j-slf4j-impl` dependency to include SLF4J. This way, we can use the SLF4J API for our logging, which is a logging abstraction that allows us to swap out the underlying logger without changing our code, should we decide so.

The last dependency is a log appender that sends the logs to logz.io so we can view them online. 

#### Configuring Log4J with Environment Variables

Next, we need to create a `log4j2.xml` file in the `src/main/resources` folder of the codebase. Log4J will automatically pick up this configuration file from the classpath when the application starts up:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Configuration status="WARN">

  <Appenders>
    <Console name="CONSOLE" target="SYSTEM_OUT">
      <PatternLayout pattern="%d{HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n"/>
    </Console>
  
    <LogzioAppender name="LOGZIO">
      <logzioToken>YOUR_LOGZIO_TOKEN></logzioToken>
      <logzioUrl>https://listener.logz.io:8071</logzioUrl>
      <logzioType>java</logzioType>
    </LogzioAppender>
  </Appenders>

  <Loggers>
    <Root level="INFO">
      <AppenderRef ref="${env:LOG_TARGET:-CONSOLE}"/>
    </Root>
  </Loggers>
</Configuration>
```

In the `log4j2.xml` file above we have configured two appenders. An appender is a Log4J concept that takes log events, transforms them, and then sends them to a certain destination.

The appender with the name `CONSOLE` is a standard Log4J appender that sends the logs to the console. We can define a pattern in which to format the log output.

The appender with the name `LOGZIO` is a special appender that sends the logs to logz.io. We can only use the `<LogzioAppender>` XML element because we have included the dependency to `logzio-log4j2-appender` in the `pom.xml` above. If you want to try sending logs, you have to put your logz.io token into the `<logzioToken>` element.w

Finally, in the `<Root>` element, we configure which appender the root logger should use. We could just put one of the appender names into the `ref` attribute of the `<AppenderRef>` element, but this would hard-code the appender and it wouldn't be configurable. So, instead, we set it to `${env:LOG_TARGET:-CONSOLE}`, which tells Log4J to use the value of the `LOG_TARGET` environment variable and if this variable is not set, use the value `CONSOLE` as a default.

That's it. If we run the app without any environment variables, it will log to the console. If we set the environment variable `LOG_TARGET` to `LOGZIO`, it will log to logz.io.

## Configuring Spring Boot Logging for Different Environments

### Spring Boot's Default Logging Configuration

-   investigate the default logging configuration
-   by default, Spring Boot logs to standard out
-   we have to either capture the standard output and send it to a log server, or we have to configure the logger to send it to a log server directly
-   look into the default `logback-spring.xml`

### Using Log4J Instead of Logback
- how to do this?

### Activating a Spring Profile
- link to Profiles article
- start the app with Gradle or Maven and the Spring Boot plugin

### Sending Logs to a File in the `local` Environment
- configure Spring Boot to send logs to a file in the local environment
- code examples, link to example application

### Sending Logs to Logz.io  in the `staging` Environment
-   configure Spring Boot to send logs to Logz.io in test/production environment, but not in local development
-   code examples, link to example application

### Querying Logs with Logz.io
-   show that the logs have reached Logz.io
-   do some basic queries in the hosted Kibana

 

 
