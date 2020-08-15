---
title: "Spring Boot Logging"
categories: [spring-boot]
date: 2020-08-15 06:00:00 +1100
modified: 2020-08-15 06:00:00 +1100
author: pratikdas
excerpt: "Logging forms the bedrock of any well written application. We look at the logging capabilities in spring boot starting with the default. "
image:
  auto: 0074-stack
---
Logging forms an important part of development. A good percentage of our source code is log statements. They capture a footprint of the application execution which we refer post-facto to investigate any normal or unexpected behavior. Observability tools monitor the logs in real-time to gather important metrics useful for both business and operations. Developers use logs for debugging and tracing and even to capture important events for build and tests runs in CI/CD pipelines. 

Like many good things, Spring Boot comprises an implementation of a logger in its opinionated framework. This article is an in-depth guide into configuring logging with Spring Boot and includes some best practices for configuring logging in different environments.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/localstack" %}


## Default Logger In Spring Boot

*** The default logger configuration in Spring Boot is a logback implementation at info level for logging to console. *** Let us see this behaviour in action by creating a Spring Boot application. We generate a minimal application named SpringLogger with just the web dependency using starter.spring.io. Next we add some log statements to the application class file - SpringLoggerApplication:

```java
@SpringBootApplication
public class SpringLoggerApplication {
  static final Logger logger = LoggerFactory.getLogger(SpringLoggerApplication.class);
  public static void main(String[] args) {
    logger.info("Before starting application");
    SpringApplication.run(SpringLoggerApplication.class, args);
    logger.debug("Starting my application {}", args.length);
    logger.info("Starting my application {}", args.length);
  }
```
After compiling with maven or gradle and running the resulting jar file, we can see our log statements getting printed in the console:

```shell
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
2020-08-08 13:21:48.965  INFO 27072 --- [           main] i.p.s.SpringLoggerApplication            : Started SpringLoggerApplication in 3.054 seconds (JVM running for 3.726)
2020-08-08 13:21:48.969  INFO 27072 --- [           main] i.p.s.SpringLoggerApplication            : Starting my application 0

```
The first info log is printed, followed by a seven line banner of Spring and then the next info log. The debug statement is suppressed. 


## Customizing The Logger In Spring Boot
Default configuration is seldom useful in real life. We will wish to make several customizations for various purposes :

1. Print finer level logs for deeper analysis into the application behavior.
2. Log to a file that will be archived on exceeding a threshold size.
3. Add contextual information to our log statements for better insights during diagnosis of unexpected behaviour of our application.
4. Add tracing information to correlate logs from different applications.
5. Change the structure of our log to make it consumable by log readers. 

Spring Boot logger has three customization routes as represented in this schematic:

### Change Log Level 
By default, info level logs are printed. We can change the log level by setting environment variables - log.level.<package-name> and log.level.root:

#### From Command Line

```
-Dlogging.level.org.springframework=ERROR 
-Dlogging.level.io.app=TRACE
```

#### Application Properties
```
logging.level.org.springframework=ERROR 
logging.level.io.app=TRACE
```

### Log To File
We can write our logs to a file path by setting the properties logging.file and logging.file.path.logging.pattern.file in our application.properties :  

```
# Output to a temp_folder/file
logging.file=/app.log
 
# Logging pattern for file
logging.pattern.file= %d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%

```
By default, the log file is rotated on reaching 10 MB and set to info level logging. 
Other properties related to file :   
| Property Name        | DESCRIPTION                        | Default Value |
| -------------------- | -----------------------------------| ----------    |
|logging.file.max-size | total size of log archives  | 10 MB |
logging.file.max-history | Duration of keeping Rotated log files | 7 |
logging.file.total-size-cap | total size of log archives. Backups are deleted when the total size of log archives exceeds that threshold. | na |
logging.file.clean-history-on-start| force log archive cleanup on application startup | false |

| Property        | What It Means           | Value If Not Set  |
| --------------------- |:-------------| -----:|
| logging.file.max-size      | total size of log archive | 10 Mb |
| logging.file.max-history      | how many days' rotated log files to be kept      |   7 Days |
| logging.file.total-size-cap | total size of log archives. Backups are deleted when the total size of log archives exceeds that threshold.      |    $1 |
| logging.file.clean-history-on-start | force log archive cleanup on application startup      |    false |


 10 MB and, as with console output, ERROR-level, WARN-level, and INFO-level messages are logged by default. Size limits can be changed using the logging.file.max-size property. Rotated log files of the last 7 days are kept by default unless the logging.file.max-history property has been set. The total size of log archives can be capped using logging.file.total-size-cap. When the total size of log archives exceeds that threshold, backups will be deleted. To force log archive cleanup on application startup, use the logging.file.clean-history-on-start property.

We can apply the same customization in a separate file which we will see in the next section. 

### Using logback.xml
We isolate the log configuration from the application by specifying the configuration in logback.xml or logback-spring.xml. Spring recommends to use logback-spring.xml.
#### Appender
Appender is the most important component of logback.xml. We can use either File or Console appender or write our own.


*** File Appender ***

*** Rotate Log Files ***

## Making Our Logging Useful
We need to capture relevant information in our logs for our logging to be useful. Let us look at few of those:
### What do we log
1. Request/Response payload
2. headers
3. Method entry/exit
4. Useful checkpoints
5. Exceptions

### Add Contextual Information
Who made the request, which business service, understand the impact

### Different Logging For Each Environment
We will have separate properties for each environment. We do this using spring profiles.

### Monitoring, Debugging And Tracing Between Microservices
Debugging and tracing in microservices is challenging since
they are deployed and run independently resulting in their logs being distributed across many individual components. Good and effective logging is the best source of data to help troubleshoot, debug, and trace microservices. We apply two techniques to help simplify the log analysis process of multiple microservices : 

1. Log Aggregation to aggregate logs from different microservices in a central location. We do this 
2. Correlate Logs to trace a request across microservices. We can activate spring-sleuth to add tracing information.

```xml
  <properties>
    <java.version>11</java.version>
    <spring-cloud-sleuth.version>2.2.4.RELEASE</spring-cloud-sleuth.version>
  </properties>
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-sleuth</artifactId>
        <version>${spring-cloud-sleuth.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
```
2020-08-11 21:59:50.442  INFO [users,66e2ecef2184c874,66e2ecef2184c874,true] 86982 --- [nio-8080-exec-1] i.p.s.SpringLoggerApplication            : Controller: Fetching user with id 7697698
2020-08-11 21:59:50.442  INFO [users,66e2ecef2184c874,66e2ecef2184c874,true] 86982 --- [nio-8080-exec-1] io.pratik.springLogger.UserService       : Service: Fetching user with id 7697698

```


### Log Format
Reader friendly vs machine friendly
costly operations

### Logs In Container Runtimes
If we are building a docker app, we continue with console appender

## More Customizations
We can apply further customizations to our logs using a mix of spring boot and logback features. Let us take a look at some of those :

### Switch off the banner
The spring banner at the top of log file does not add any value. We can switch off the banner by setting the property to off in application properties.
***Example:***
src/main/resources/application.properties
```
spring.main.banner-mode=off 
```

### Change The Color Of Log Output In The Console
We can display ANSI color coded output by setting the spring.output.ansi.enabled property. The possible values are ALWAYS, DETECT and NEVER.

***Example:***
src/main/resources/application.properties
```
spring.output.ansi.enabled=ALWAYS
```
The property spring.output.ansi.enabled is set to 'DETECT' by default. The colored output takes effect only if the target terminal supports ANSI codes.

### Lombok
We have a useful lombok construct slf4j to provide a reference to the logger.

### Masking
Sometimes we need to hide supress sensitive data by apply mask on sensitive data. We mask the sensitive fields in our payload to hide the info. At the same time useful information should be present.

### Change Logger Implementation
adding the log implementation in the default starter. It is included by adding starter for logback implementation. Starter for log4j and java util can also be added.

## Best Practices
1. use placeholders 
2. avoid putting logs inside loops
3. Do not do heavy operations in custom appenders 
4. Use the right log level 
5. Do not use log for audit


## Log Storage & Visualization
Logs can be stored in files and relational databases. Many of the logging frameworks referred to earlier support both. Specialized databases called time-series databases (TSDB) are better suited to gathering telemetry.

Log data is used to capture events. Logs, once recorded, are never modified. TSDB are optimized for data that is only ever added and arrives in chronological order. Logging application events is a core use case for time-series databases. There are several open-source TSDB available, including Prometheus and Kibana (the “K” in the classic “ELK stack.”)

Some TSDB include web-based data visualization tools that can be used to query logs. Grafana is a dedicated visualization tool that works with most TSDBs.


## Conclusion

In this article we saw how to use logging in spring boot and customize it further to suit our requirements. But to fully leverage the benefits, the logging capabilities of the framework need to be complemented with robust and standardized logging practices in engineering teams. The logging standards also need to be enforced with reviews and code quality tools and help to give us visibliity into our systems in live environments.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/localstack).