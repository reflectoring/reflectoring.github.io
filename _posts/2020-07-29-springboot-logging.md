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
Logging forms an important part of development. A good percentage of our source code is log statements. They capture a footprint of the application execution which we refer post-facto to investigate any normal or unexpected behavior. Observability tools monitor the logs in real-time to gather important metrics useful for both business and operations.

Spring Boot comprises an implementation of a logger in its opinionated framework. This article is an in-depth guide into configuring logging with Spring Boot and includes some best practices for configuring logging in different environments.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/localstack" %}

## Default Configuration
Let us see what we get as default by creating a Spring Boot application. Our application is a user signup application with api for signup. 
```java
@SpringBootApplication
public class SpringLoggerApplication {
    static final Logger logger = LoggerFactory.getLogger(SpringLoggerApplication.class);
  public static void main(String[] args) {
    SpringApplication.run(SpringLoggerApplication.class, args);
    logger.info("Starting my application ");

```
On running this I can see the log statement getting printed :
```
2020-08-08 12:29:59.954  INFO 22368 --- [           main] i.p.s.SpringLoggerApplication            : Started SpringLoggerApplication in 3.112 seconds (JVM running for 3.853)
2020-08-08 12:29:59.957  INFO 22368 --- [           main] i.p.s.SpringLoggerApplication            : Starting my application 

```
This is a INFO level log.
Let us modify the log to print the arguments passed. We will print debug level logs by passing a variable.

adding the log implementation in the default starter. It is included by adding starter for logback implementation. Starter for log4j and java util can also be added.



Default options are often not enough so we need to customize it. We do this by specifying the additional configurations in logback-spring.xml file. Let us look at the customization we can do and where to do the logging.

## Control Log Level
We create a spring boot application using the starter and add a controller named UserController. We add a log statement to the application file. This log will printed when application starts up. The spring banner at the top of log file does not add any value. Let us switch off the banner by setting the property to off in application properties. By default, info level logs are printed. We can change the log level by setting it to debug or warn.

## Customize Log Behavior
So far we have used only the default setup. Now we will change the behavior of logback by adding logback.xml. The spring reco is to add logbac-spring.xml. We configure different appenders here like connsole appender or file appender. If we are building a docker app, we continue with console appender

## Environment Flags
We will have separate properties for each environment. We do this using spring profiles.

## Tracing between Microservices
Thinking of containers, the logs are printed to console. We activate spring-sleuth to add tracing information. This information is used by observability tools to aggregate logs from different microservices.

We mask the sensitive fields in our payload to hide the info. At the same time useful info should be present.


Istio can generate access logs for service traffic in a configurable set of formats, providing operators with full control of the how, what, when and where of logging. For more information, please refer to Getting Envoy’s Access Logs.

Example Istio access log:
When we build applications with AWS, we access various AWS services for multiple purposes: store files in S3, save some data in DynamoDB, send messages to SQS, write event handlers with lambda functions, and many others. 

## What do we log
Request/Response payload
headers
Method entry/exit
Useful checkpoints
Exceptions

## Logging For Microservices
Debugging and tracing microservices is different from monoliths, and therefore must be treated differently.

Microservices are deployed and operate independently of each other. This distributes the sources of logging across many individual services, rather than just one. Good logging is the best source of data to troubleshoot, debug, and trace microservices.

Create robust, standardized logging practices in your development teams. Use code reviews and code quality tools to enforce those standards. Open-source and commercial databases and tools round out a complete strategy for keeping your microservices healthy and your systems running.

Logs can be stored in files and relational databases. Many of the logging frameworks referred to earlier support both. Specialized databases called time-series databases (TSDB) are better suited to gathering telemetry.

Log data is used to capture events. Logs, once recorded, are never modified. TSDB are optimized for data that is only ever added and arrives in chronological order. Logging application events is a core use case for time-series databases. There are several open-source TSDB available, including Prometheus and Kibana (the “K” in the classic “ELK stack.”)

Some TSDB include web-based data visualization tools that can be used to query logs. Grafana is a dedicated visualization tool that works with most TSDBs.


## Conclusion

We saw how to use LocalStack for testing the integration of our application with AWS services locally. Localstack also has an [enterprise version](https://localstack.cloud/#pricing) available with more services and features. 

I hope this will help you to feel empowered and have more fun while working with AWS services during development and lead to higher productivity, shorter development cycles, and lower AWS cloud bills.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/localstack).