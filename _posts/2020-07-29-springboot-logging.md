---
title: "Spring Boot Logging"
categories: [spring-boot]
date: 2020-08-15 06:00:00 +1100
modified: 2020-08-15 06:00:00 +1100
author: pratikdas
excerpt: "Logging forms the bedrock of any well-written application. We look at the logging capabilities in spring boot starting with the default. "
image:
  auto: 0074-stack
---
Logging forms an important part of development. A good percentage of our source code is log statements. They capture a footprint of the application execution which we refer post-facto to investigate any normal or unexpected behavior. Observability tools monitor the logs in real-time to gather important metrics useful for both business and operations. Developers use logs for debugging and tracing and even to capture important events for build and test runs in CI/CD pipelines. 

Like many good things, Spring Boot comprises an implementation of a logger in its opinionated framework. This article is an in-depth guide into configuring logging with Spring Boot with a focus on the different techniques of using logging for several application management functions.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-logging-dtls" %}


## Default Logger In Spring Boot

***The default logger configuration in Spring Boot is a logback implementation at info level for logging the output to console.*** Let us see this behaviour in action by creating a Spring Boot application. We generate a minimal application named SpringLogger with just the web dependency using starter.spring.io. Next we add some log statements to the application class file - SpringLoggerApplication:

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
After compiling with maven or Gradle and running the resulting jar file, we can see our log statements getting printed in the console:

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
... : Started SpringLoggerApplication in 3.054 seconds (JVM running for 3.726)
... : Starting my application 0

```
The first info log is printed, followed by a seven-line banner of Spring and then the next info log. The debug statement is suppressed. 


## Customizing The Logger In Spring Boot
A default configuration is seldom useful in real life. We will wish to make several customizations for various purposes :

1. Print finer level logs for deeper analysis into the application behavior.
2. Log to a file that will be archived on exceeding a threshold size.
3. Add contextual information to our log statements for better insights during the diagnosis of unexpected behavior of our application.
4. Add tracking information to correlate logs from different applications.
5. Change the structure of our log to make it consumable by log readers. 

We usually take three routes to customize logging by overriding the default behavior:
 - Set the logging parameters as environment variables 
 - Set the logging parameters in Application.properties
 - Define the parameters in logback configuration file

### Reduce Log Level For Deeper Analysis
Sometimes we need to see detailed logs to troubleshoot an application behavior. To achieve that we send our desired log level as an argument when running our application. 
```shell
java -jar target/springLogger-0.0.1-SNAPSHOT.jar --trace
```
This will start to output from trace level printing logs of trace, debug, info, warn, error. 

### Package Level Logging To Suppress Less Important Logs
We are more interested in the log output of the code we have written instead of log output from Spring. We control the logging by specifying package names by setting an environment variable - log.level.<package-name> :
```shell
java -jar target/springLogger-0.0.1-SNAPSHOT.jar -Dlogging.level.org.springframework=ERROR -Dlogging.level.io.pratik=TRACE
```
Alternatively, we can specify our package in the application.properties :

```properties
logging.level.org.springframework=ERROR 
logging.level.io.app=TRACE
```

### Log To File For Archival Or Shipping To Log Aggregators
We can write our logs to a file path by setting only one of the properties logging.file.name or logging.file.path in our application.properties. By default, for file output, the log level is set to info. 

```
# Output to a file named application.log. 
logging.file.name=application.log
```
```
# Output to a file named spring.log in path /Users
logging.file.path=/Users
```
If both properties are set, only the logging.file.name takes effect. 

Note: The name of these properties has changed in spring 2.2 onwards but the official documentation does not yet reflect this. Our example is working with version 2.3.2.RELEASE. 

Apart from file name, we can override the default logging pattern with the property logging.pattern.file:
``` 
# Logging pattern for file
logging.pattern.file= %d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%

```

Other properties related to file :   


| Property        | What It Means           | Value If Not Set  |
| --------------------- |:-------------| :-------------:|
| logging.file.max-size      | total size of log archive | 10 Mb |
| logging.file.max-history      | how many days' rotated log files to be kept      |   7 Days |
| logging.file.total-size-cap | total size of log archives. Backups are deleted when the total size of log archives exceeds that threshold.      |   Not Specified |
| logging.file.clean-history-on-start | force log archive cleanup on application startup      |    false |


We can apply the same customization in a separate file which we will see in the next section. 

### Isolate Logging Configuration From Application With logback Configuration
 
We can isolate the log configuration from the application by specifying the configuration in logback.xml or logback-spring in XML or groovy syntax. Spring recommends using the names with spring-like logback-spring.xml or logback-spring.groovy.
The configuration is comprised of appender element inside a root configuration tag. The pattern is specified inside an encoder element :

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
```

Logback uses a configuration library - Joran so we will see these logs during application startup if we set a debug property in the configuration tag to true.

```xml
<configuration debug="true">
```

## Making Our Logging Useful
We need to capture relevant information in our logs for our logging to be useful. Let us look at few of those:
### What do we log
The utility of logs depends on the information we capture during logging. Some common usages include data written by logs are :  
1. Request/Response payload: Log the request and response payload of an API. This forms the starting point of any abnormal conditions in the system behavior. For instance, we check whether the input is valid, if the status of other sub-systems were healthy, etc.
2. Headers: We log important request and response headers, for example, the JWT authorization header, headers giving context information like model of the device that sent the request, geography of the user.
3. Method entry/exit: Similar to API, we might log the inputs and output of important methods to ensure that all the statements within the method executed successfully.
4. Useful checkpoints within our source code to indicate the occurrence of any important event, for example, payment successful with payment reference, the message posted to a queue, etc.
5. Exceptions are often captured in error logs with a complete stack trace and are a valuable component for any system diagnosis. 

### Add Contextual Information
Logs become even more useful if we add some contextual information to every message we log, for example, the identifier of the user or the name of the business function. Instead of manually appending the contextual information to each log message, we can use Logback’s Mapped Diagnostic Context (MDC). Whatever we put in the MDC can be used in the log pattern. This behavior is comparable to a ThreadLocal variable.
For example, we put the user idenntifier and function name in the MDC for adding to the log message:

```java
  @GetMapping("/users/{userID}")
  public String getUser(@PathVariable("userID") final String userID) {
    
    MDC.put("user", userID);
    MDC.put("function", "userInquiry");
    
    logger.info("Controller: Fetching user with id {}", userID);
    
    MDC.remove("user");
    MDC.remove("function");
    
    return userService.getUser(userID);
                                                 
```

The user identifier and function name in the MDC are then added to the log message in the pattern attribute :
```
%d{HH:mm:ss.SSS} [%X{user}] [%X{function}] [%thread] %-5level %logger{36} - %msg%n
```
A sample of the log output with the MDC attributes user and function name :
```shell
...            : Controller: Fetching user with id john123
... [john123] [userInquiry] ... - Controller: Fetching user with id john123
...       : Service: Fetching user with id john123
... [john123] [userInquiry] ... - Service: Fetching user with id john123
```

### Different Logging For Each Environment

We often have different logging formats for local and production runtime environments. Spring profiles are an elegant way to implement different logging for each environment. You can refer to a very good use case in this article for (environment-specific logging)[https://reflectoring.io/profile-specific-logging-spring-boot/]. 

### Tracing Requests Across Microservices
Debugging and tracing in microservice applications is challenging since
the microservices are deployed and run independently resulting in their logs being distributed across many individual components. We apply two techniques to help simplify the log analysis process of multiple microservices : 

#### Log Aggregation 
Logs from different microservices are aggregated to a central location. For spring boot, we need to output logs in a format compatible with the log aggregation software. Let us look at an appender configured for logstash :

```xml
  <appender name="LOGSTASH"
    class="net.logstash.logback.appender.LogstashTcpSocketAppender">
    <destination>localhost:4560</destination>
    <encoder charset="UTF-8"
      class="net.logstash.logback.encoder.LogstashEncoder" />
  </appender>
``` 
Here the LogstashEncoder encodes logs in JSON format and sent to the elastic search database. We can then apply various visualization tools to query logs.


#### Correlate Logs To Trace Requests Across Microservices

To add tracking information, we can activate Spring Cloud Sleuth which provides Spring Boot auto-configuration for distributed tracing. Sleuth adds trace and span identifiers to the Slf4J MDC so that we can extract all the logs from a given trace or span in a log aggregator.
Sleuth is added to the classpath as a maven dependency :

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
Executing API requests produces logs with trace and span identifiers with the application name.
```shell
...  INFO [users,66e2ecef2184c874,66e2ecef2184c874,true] ...
     ... : Controller: Fetching user with id 7697698
...  INFO [users,66e2ecef2184c874,66e2ecef2184c874,true] ... 
     ... : Service: Fetching user with id 7697698

```
We have a more elaborate explanation of this article on (tracing across distributed systems)[https://reflectoring.io/tracing-with-spring-cloud-sleuth/].

### Logs In Container Runtimes
If we are building a docker app, we can use the console appender and view the logs using :

```shell
docker logs <container-ID>
```

## More Customizations
We can apply further customizations to our logs using a mix of spring boot and logback features. Let us take a look at some of those :

### Switch off the banner
The spring banner at the top of the log file does not add any value. We can switch off the banner by setting the property to off in application properties.
***Example:***
src/main/resources/application.properties
```
spring.main.banner-mode=off 
```

### Change The Color Of Log Output In The Console
We can display ANSI color-coded output by setting the spring.output.ansi.enabled property. The possible values are ALWAYS, DETECT, and NEVER.

***Example:***
src/main/resources/application.properties
```
spring.output.ansi.enabled=ALWAYS
```
The property spring.output.ansi.enabled is set to 'DETECT' by default. The colored output takes effect only if the target terminal supports ANSI codes.

### Lombok
We have a useful Lombok annotation Slf4j to provide a reference to the logger.

```java
@Service
@Slf4j
public class UserService {
  public String getUser(final String userID) {
    log.info("Service: Fetching user with id {}", userID);

```

### Change Logger Implementation
Logback starter is part of the default spring boot starter. We can change this to log4j or java util implementations by including their starters and excluding the default spring-boot-starter-logging.
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


## Additional Best Practices
- Use placeholders instead of string concatenation.

```java
    log.info("Service: Fetching user with id {}", userID);

    // Not preferred
    log.info("Service: Fetching user with id " + userID);
```     
- Avoid putting logs inside loops

```java
   // Not preferred
   for(int i=0; i < 10; ++i){
     log.info("loop counter {}", i);
   }
```
- Do not perform heavy operations inside custom appenders 
- Use the appropriate log level, for example, ERROR for exceptions, INFO for important events in the application, etc.
- Do not use the log for auditing functions. 


## Conclusion

In this article, we saw how to use logging in spring boot and customize it further to suit our requirements. But to fully leverage the benefits, the logging capabilities of the framework need to be complemented with robust and standardized logging practices in engineering teams. 

These practices will also need to be enforced with a mix of peer reviews and automated code quality tools. Everything taken together will ensure that when production errors happen we have the maximum information to dig deeper start our diagnosis. 

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-logging-dtls).