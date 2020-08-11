---
title: "Spring Boot Logging"
categories: [craft]
date: 2020-07-28 06:00:00 +1100
modified: 2020-07-28 06:00:00 +1100
author: pratikdas
excerpt: "Configure Logback"
image:
  auto: 0074-stack
---
Logging forms an important part of development. A good percentage of our source code is log statements. They capture a footprint of the application execution which we refer post-facto to investigate any normal or unexpected behavior. Observability tools monitor the logs in real-time to gather important metrics useful for both business and operations. Developers use logs for debugging and tracing and even to capture important events for build and tests runs in CI/CD pipelines. 

Like many goodies, Spring Boot comprises an implementation of a logger in its opinionated framework. This article is an in-depth guide into configuring logging with Spring Boot and includes some best practices for configuring logging in different environments.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/localstack" %}


## Default Configuration
*** What do we log ***
Request/Response payload
headers
Method entry/exit
Useful checkpoints
Exceptions

Let us see what we get as default after creating a Spring Boot application. We generate a minimal application named SpringLogger with just the web dependency using starter.spring.io. Next we add some log statements to the application class file - SpringLoggerApplication:

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
The first info log is printed, followed by a seven line banner of Spring and then the next info log. The debug statement is suppressed. So ** the default logger configuration is a logback implementation at info level.** 

## Do We Need To Customize ?
Default configuration is seldom useful in real life. We will wish to make several customizations for various purposes :

1. Print finer level logs for deeper analysis into the application behavior.
2. Log to a file that will be archived on exceeding a threshold size.
3. Add contextual information to our log statements for better insights during diagnosis of unexpected behaviour of our application.
4. Add tracing information to correlate logs from different applications.
5. Change the structure of our log to make it consumable by log readers. 

Spring Boot logger has three customization routes as represented in this schematic:

## Log Levels
By default, info level logs are printed. We can change the log level by setting an environment variable - log.level.<package-name> and log.level.root.


### From Command Line

-Dlogging.level.org.springframework=ERROR 
-Dlogging.level.io.app=TRACE

### Application Properties
logging.level.org.springframework=ERROR 
logging.level.io.app=TRACE

## Log To File
Default options are often not enough so we need to customize it. We do this by specifying the additional configurations in logback-spring.xml file. Let us look at the customization we can do and where to do the logging.

```
# Output to a temp_folder/file
logging.file=c:/temp/application.log
 
#logging.path=/my-folder/
 
# Logging pattern for file
logging.pattern.file= %d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%

```
### File Appender

### Rotate Log Files

## Add Contextual Information
Who made the request, which business service, understand the impact

## Correlate Logs
sleuth
log aggregation

## Log Format
Reader friendly vs machine friendly
costly operations

## Logs In Container Runtimes
If we are building a docker app, we continue with console appender

## Others
### Switch off the banner
The spring banner at the top of log file does not add any value. Let us switch off the banner by setting the property to off in application properties.

### Change the color

### Lombok
We have a useful lombok construct slf4j to provide a reference to the logger.

### Masking
Sometimes we need to hide supress sensitive data by apply mask on sensitive data.

### Change Logger Implementation
adding the log implementation in the default starter. It is included by adding starter for logback implementation. Starter for log4j and java util can also be added.

## Best Practices
** use placeholders **
** avoid putting logs inside loops ** 

Let us modify the log to print the arguments passed. We will print debug level logs by passing a variable.


## Environment Flags
We will have separate properties for each environment. We do this using spring profiles.

## Tracing between Microservices
Thinking of containers, the logs are printed to console. We activate spring-sleuth to add tracing information. This information is used by observability tools to aggregate logs from different microservices.

We mask the sensitive fields in our payload to hide the info. At the same time useful info should be present.


Istio can generate access logs for service traffic in a configurable set of formats, providing operators with full control of the how, what, when and where of logging. For more information, please refer to Getting Envoy’s Access Logs.

Example Istio access log:

## Logging For Microservices
Debugging and tracing microservices is different from monoliths, and therefore must be treated differently.

Microservices are deployed and operate independently of each other. This distributes the sources of logging across many individual services, rather than just one. Good logging is the best source of data to troubleshoot, debug, and trace microservices.


## Log Storage & Visualization
Logs can be stored in files and relational databases. Many of the logging frameworks referred to earlier support both. Specialized databases called time-series databases (TSDB) are better suited to gathering telemetry.

Log data is used to capture events. Logs, once recorded, are never modified. TSDB are optimized for data that is only ever added and arrives in chronological order. Logging application events is a core use case for time-series databases. There are several open-source TSDB available, including Prometheus and Kibana (the “K” in the classic “ELK stack.”)

Some TSDB include web-based data visualization tools that can be used to query logs. Grafana is a dedicated visualization tool that works with most TSDBs.


## Conclusion


Create robust, standardized logging practices in your development teams. Use code reviews and code quality tools to enforce those standards. Open-source and commercial databases and tools round out a complete strategy for keeping your microservices healthy and your systems running.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/localstack).