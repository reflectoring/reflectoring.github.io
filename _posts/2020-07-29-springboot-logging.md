---
title: "Logging In Spring Boot"
categories: [spring-boot]
date: 2020-08-15 06:00:00 +1100
modified: 2020-08-15 06:00:00 +1100
author: pratikdas
excerpt: "Logging is the bedrock for analyzing when anything goes wrong, or even for seeing that everything is in order. In this article, we look at the logging capabilities in Spring Boot to see what we can do with it and how we can customize it."
image:
  auto: 0074-stack
---
 
Logging is a vital part of all applications and brings benefits not only to us developers but also to ops and business people. Spring Boot applications need to capture relevant log data to help us diagnose and fix problems and measure business metrics. 

**The Spring Boot framework is preconfigured with Logback as a default implementation in its opinionated framework.** This article looks at different ways of configuring logging in Spring Boot.


{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-logging-dtls" %}

## Why Is Logging Important?
The decisions on what to log and where are often strategic and are taken after considering that the application will malfunction in live environments. Logs play a key role in helping the application to recover quickly from any such failures and resume normal operations.

### Make Errors At Integration Points Visible
The distributed nature of today's applications built using microservice architecture introduces a lot of moving parts. As such, it is natural to encounter problems due to temporary interruptions in any of the surrounding systems. 

Exception logs captured at the integration points enable us to detect the root cause of the interruption and allow us to take appropriate actions to recover with minimum impact on the end-user experience. 

### Diagnose Functional Errors In Production
There could be customer complaints of an incorrect transaction amount. To diagnose this, we need to drill into our logs to find the sequence of operations starting from the request payload when the API is invoked until the response payload at the end of API processing.

### Analyze Event History
Log statements capture a footprint of the application execution. We refer to these logs after the fact to analyze any normal or unexpected behavior of the application for a variety of tasks. 

We can find out the number of users logged in within a particular time window or how many users are actively making use of any newly released feature which is valuable information to plan the changes for future releases.

### Monitoring
Observability tools monitor the logs in real-time to gather important metrics useful for both business and operations and can also be configured to raise alarms when these metrics exceed specific thresholds. Developers use logs for debugging and tracing and even to capture important events for build and test runs in CI/CD pipelines. 

## Spring Boot's Default Logging Configuration

**The default logging configuration in Spring Boot is a Logback implementation at the info level for logging the output to console.** 

Let us see this behavior in action by creating a Spring Boot application. We generate a minimal application with just the web dependency using [start.spring.io](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.3.3.RELEASE&packaging=jar&jvmVersion=11&groupId=io.example&artifactId=springLogger&name=springLogger&description=Demo%20project%20for%20Spring%20Boot%20logging&packageName=io.example.springLogger&dependencies=web). Next, we add some log statements to the application class file:

```java
@SpringBootApplication
public class SpringLoggerApplication {
    static final Logger log = 
        LoggerFactory.getLogger(SpringLoggerApplication.class);
  
    public static void main(String[] args) {
     log.info("Before Starting application");
     SpringApplication.run(SpringLoggerApplication.class, args);
     log.debug("Starting my application in debug with {} args", args.length);
     log.info("Starting my application with {} args.", args.length);  
    }
  }
```
After compiling with Maven or Gradle and running the resulting jar file, we can see our log statements getting printed in the console:

```
13:21:45.673 [main] INFO io.pratik.springLogger.SpringLoggerApplication - Before Starting application

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::        (v2.3.2.RELEASE)
.
.
.
... : Started SpringLoggerApplication in 3.054 seconds (JVM running for 3.726)
... : Starting my application 0

```
The first info log is printed, followed by a seven-line banner of Spring and then the next info log. The debug statement is suppressed. 



## High-Level Logging Configuration

Spring Boot offers considerable [support for configuring the logger](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-logging) to meet our logging requirements.
 
 On a high level, we can modify command-line parameters or add properties to `application.properties` (or `application.yml`) so configure some logging features.

### Configuring the Log Level with a Command-Line Parameter
Sometimes we need to see detailed logs to troubleshoot an application behavior. To achieve that we send our desired log level as an argument when running our application. 
```shell
java -jar target/springLogger-0.0.1-SNAPSHOT.jar --trace
```
This will start to output from trace level printing logs of trace, debug, info, warn, and error. 

### Configuring Package-Level Logging 
Most of the time, we are more interested in the log output of the code we have written instead of log output from frameworks like Spring. We control the logging by specifying package names in the environment variable `log.level.<package-name>` :

```shell
java \\
  -jar target/springLogger-0.0.1-SNAPSHOT.jar \\
  -Dlogging.level.org.springframework=ERROR \\
  -Dlogging.level.io.pratik=TRACE
```
Alternatively, we can specify our package in `application.properties`:

```properties
logging.level.org.springframework=ERROR 
logging.level.io.app=TRACE
```

### Logging to a File
We can write our logs to a file path by setting only one of the properties `logging.file.name` or `logging.file.path` in our `application.properties`. By default, for file output, the log level is set to info. 

```
# Output to a file named application.log. 
logging.file.name=application.log
```
```
# Output to a file named spring.log in path /Users
logging.file.path=/Users
```
If both properties are set, only `logging.file.name` takes effect. 

Note that the name of these properties has changed in Spring 2.2 onwards but the official documentation does not yet reflect this. Our example is working with version 2.3.2.RELEASE. 

Apart from the file name, we can override the default logging pattern with the property `logging.pattern.file`:
``` 
# Logging pattern for file
logging.pattern.file= %d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%
```

Other properties related to the logging file :   

| Property        | What It Means           | Value If Not Set  |
| --------------------- |:-------------| :-------------:|
| `logging.file.max-size`     | maximum total size of log archive before a file is rotated | 10 Mb |
| `logging.file.max-history`      | how many days worth of rotated log files to be kept      |   7 Days |
| `logging.file.total-size-cap` | total size of log archives. Backups are deleted when the total size of log archives exceeds that threshold.      |   not specified |
| `logging.file.clean-history-on-start` | force log archive cleanup on application startup      |    false |

We can apply the same customization in a separate configuration file as we will see in the next section. 

### Switching Off the Banner
The spring banner at the top of the log file does not add any value. We can switch off the banner by setting the property to off in `application.properties`:

```
spring.main.banner-mode=off 
```

### Changing the Color of Log Output in the Console
We can display ANSI color-coded output by setting the `spring.output.ansi.enabled` property. The possible values are ALWAYS, DETECT, and NEVER.

```
spring.output.ansi.enabled=ALWAYS
```

The property `spring.output.ansi.enabled` is set to `DETECT` by default. The colored output takes effect only if the target terminal supports ANSI codes.

### Switching the Logger Implementation
Logback starter is part of the default Spring Boot starter. We can change this to log4j or java util implementations by including their starters and excluding the default spring-boot-starter-logging in `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-log4j2</artifactId>
</dependency>
```

## Low-Level Logging Configuration in `logback-spring.xml`
 
We can isolate the log configuration from the application by specifying the configuration in `logback.xml` or `logback-spring.xml` in XML or groovy syntax. Spring recommends using `logback-spring.xml` or `logback-spring.groovy` because they are more powerful.

The default configuration is comprised of an `appender` element inside a root `configuration` tag. The pattern is specified inside an `encoder` element :

```xml
<configuration >
  <include
    resource="/org/springframework/boot/logging/logback/base.xml" />
  <appender name="STDOUT"
    class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n
      </pattern>
    </encoder>
  </appender>
</configuration>
```
### Logging Logback Configuration

If we set the `debug` property in the `configuration` tag to `true`, we can see the values of logback configuration during application startup.

```xml
<configuration debug="true">
```

Starting our application with this setting produces the output containing the configuration values of logback used in the application:

```shell
...- About to instantiate appender of type [...ConsoleAppender]
...- About to instantiate appender of type [...RollingFileAppender]
..SizeAndTimeBasedRollingPolicy.. - setting totalSizeCap to 0 Bytes
..SizeAndTimeBasedRollingPolicy.. - ..limited to [10 MB] each.
..SizeAndTimeBasedRollingPolicy.. Will use gz compression
..SizeAndTimeBasedRollingPolicy..use the pattern /var/folders/
..RootLoggerAction - Setting level of ROOT logger to INFO
```

### Tracing Requests Across Microservices
Debugging and tracing in microservice applications is challenging since
the microservices are deployed and run independently resulting in their logs being distributed across many individual components. 

We can correlate our logs and trace requests across microservices by adding tracking information to the logging pattern in `logback-spring.xml` to. Please check out [tracing across distributed systems](/tracing-with-spring-cloud-sleuth/) for a more elaborate explanation on distributed tracing.

### Aggregating Logs on a Log Server 
Logs from different microservices are aggregated to a central location. For Spring Boot, we need to output logs in a format compatible with the log aggregation software. Let us look at an appender configured for Logstash :

```xml
  <appender name="LOGSTASH"
    class="net.logstash.logback.appender.LogstashTcpSocketAppender">
    <destination>localhost:4560</destination>
    <encoder charset="UTF-8"
      class="net.logstash.logback.encoder.LogstashEncoder" />
  </appender>
``` 
Here, the `LogstashEncoder` encodes logs in JSON format and sends them to a log server at `localhost:4560`. We can then apply various visualization tools to query logs.

### Configuring Logging Differently For Each Environment

We often have different logging formats for local and production runtime environments. Spring profiles are an elegant way to implement different logging for each environment. You can refer to a very good use case in [this article about environment-specific logging](/profile-specific-logging-spring-boot/). 

## Using Lombok to Get a Logger Reference
Just as a hint to save some typing: we can use the Lombok annotation `Slf4j` to provide a reference to the logger:

```java
@Service
@Slf4j
public class UserService {
  public String getUser(final String userID) {
    log.info("Service: Fetching user with id {}", userID);
  }
}
```

## Conclusion

In this article, we saw how to use logging in Spring Boot and how to customize it further to suit our requirements. But to fully leverage the benefits, the logging capabilities of the framework need to be complemented with robust and standardized logging practices in engineering teams. 

These practices will also need to be enforced with a mix of peer reviews and automated code quality tools. Everything taken together will ensure that when production errors happen we have the maximum information available for our diagnosis. 

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-logging-dtls).