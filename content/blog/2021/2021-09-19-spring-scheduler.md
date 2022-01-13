---
title: "Running Scheduled Jobs in Spring Boot"
categories: ["Spring Boot"]
date: 2021-09-19T06:00:00
modified: 2021-09-19T06:00:00
authors: [pratikdas]
excerpt: "Scheduled jobs are a piece of business logic that should run on a timer. Spring allows us to run scheduled jobs in the Spring container by using some simple annotations. In this article, we will illustrate how to configure and run scheduled jobs in applications built using the Spring Boot framework."
image: images/stock/0111-clock-1200x628-branded.jpg
url: spring-scheduler
---

Scheduling is the process of executing a piece of logic at a specific time in the future.
Scheduled jobs are a piece of business logic that should run on a timer. Spring allows us to run scheduled jobs in the Spring container by using some simple annotations.

In this article, we will illustrate how to configure and run scheduled jobs in Spring Boot applications.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-scheduler" %}}


## Creating the Spring Boot Application for Scheduling

To work with some examples, let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.5.4&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=jobscheduling&name=jobscheduling&description=Demo%20project%20for%20Schedulers%20in%20Spring%20Boot&packageName=io.pratik.jobscheduling), and then open the project in our favorite IDE. We have not added any dependencies to Maven `pom.xml` since the scheduler is part of the core module of the Spring framework.

## Enabling Scheduling

Scheduling is not enabled by default. Before adding any scheduled jobs we need to enable scheduling explicitly by adding the `@enableScheduling` annotation:

```java

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class JobschedulingApplication {

  public static void main(String[] args) {
    SpringApplication.run(JobschedulingApplication.class, args);
  }

}
```
Here we have added the `@enableScheduling` annotation to our application class `JobschedulingApplication` to enable scheduling. 

As a best practice we should move this annotation to a dedicated class under a package that contains the code for our scheduled jobs:

```java
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
public class SchedulerConfig {

}
```

The scheduling will now only be activated when we load the `SchedulerConfig` class into the application, providing better modularization.

When the `@EnableScheduling` annotation is processed, Spring scans the application packages to find all the Spring Beans decorated with `@Scheduled` methods and sets up their execution schedule.

## Enabling Scheduling Based on a Property
We would also like to disable scheduling during running tests. For this, we need to add a [condition](/spring-boot-conditionals/) to our `SchedulerConfig` class. Let us add the `@ConditionalOnProperty` annotation with the name of the property we want to use to control scheduling:

```java
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "scheduler.enabled", matchIfMissing = true)
public class SchedulerConfig {

}
``` 
Here we have specified the property name as `scheduler.enabled`. We want to enable it by default. For this, we have also set the value of `matchIfMissing` to `true` which means we do not have to set this property to enable scheduling but have to set this property to explicitly disable the scheduler.

## Adding Scheduled Jobs

After enabling scheduling, we will add jobs to our application for scheduling. We can turn any method in a Spring bean for scheduling by adding the `@Scheduled` annotation to it. 

The `@Scheduled` is a [method-level annotation](https://docs.oracle.com/javase/tutorial/java/annotations/index.html) applied at runtime to mark the method to be scheduled. It takes one attribute from `cron`, `fixedDelay`, or `fixedRate` for specifying the schedule of execution in different formats.

The annotated method needs to fulfill two conditions:
1. The method should not have a return type and so return `void`. For methods that have a  return type, the returned value is ignored when invoked through the scheduler.
2. The method should not accept any input parameters.

In the next sections, we will examine different options of configuring the scheduler to trigger the scheduled jobs. 

## Running the Job with Fixed Delay
We use the `fixedDelay` attribute to configure a job to run after a fixed delay which means the interval between the end of the previous job and the beginning of the new job is fixed. 

**The new job will always wait for the previous job to finish**. It should be used in situations where method invocations need to happen in a sequence. 

In this example, we are computing the price of a product by executing the method in a Spring bean with a fixed delay :

```java
@Service
public class PricingEngine {
  
  static final Logger LOGGER = 
    Logger.getLogger(PricingEngine.class.getName());
  private Double price;
  
  public Double getProductPrice() {
    return price;
    
  }
  
  @Scheduled(fixedDelay = 2000)
  public void computePrice() throws InterruptedException {
    
    ...
    ...
    LOGGER.info("computing price at "+ 
      LocalDateTime.now().toEpochSecond(ZoneOffset.UTC)); 

    // added sleep to simulate method 
    // which takes longer to execute.   
    Thread.sleep(4000); 
  }

}

```
Here we have scheduled the execution of the `computePrice` method with a fixed delay by setting the  `fixedDelay` attribute to `2000` milliseconds or `2` seconds. 

We also make the method to sleep for `4` seconds with `Thread.sleep()` to simulate the situation of a method that takes longer to execute than the delay interval. The next execution will start only after the previous execution ends at least after `4` seconds, even though the delay interval of 2 seconds is elapsed.

## Running the Job at Fixed Rate

We use the `fixedRate` attribute to specify the interval for executing a job at a fixed interval of time. It should be used in situations where method invocations are independent. **The execution time of the method is not taken into consideration when deciding when to start the next job**. 

In this example, we are refreshing the pricing parameters by executing a method at a fixed rate:

```java
@Service
public class PricingEngine {
  
  static final Logger LOGGER = 
     Logger.getLogger(PricingEngine.class.getName());
 
  
  @Scheduled(fixedRate = 3000)
  @Async
  public void refreshPricingParameters() {
    ...
    ...
    LOGGER.info("computing price at "+ 
      LocalDateTime.now().toEpochSecond(ZoneOffset.UTC));  
  }
}

@Configuration
@EnableScheduling
@EnableAsync
@ConditionalOnProperty(name="scheduler.enabled", matchIfMissing = true)
public class SchedulerConfig {


}
```

Here we have annotated the `refreshPricingParameters` method with the `@Scheduled` annotation and set the `fixedRate` attribute to `3000` milliseconds or `3` seconds. This will trigger the method every `3` seconds. 

We have also added an `@Async` annotation to the method and `@EnableAsync` to the configuration class: `SchedulerConfig`.  

The `@Async` annotation over a method allows it to execute in a separate thread. As a result of this, when the previous execution of the method takes longer than the fixed-rate interval, the subsequent invocation of a method will trigger even if the previous invocation is still executing. 

This will allow multiple executions of the method to run in parallel for the overlapped time interval.

Without applying `@Async` annotation, the method will always execute after the previous execution is completed, even if the fixed-rate interval is expired.

The main cause of all the scheduled tasks not running in parallel by default is that the thread pool for scheduled task has a default size of 1. So instead of using the `@Async` annotation, we can also set the property `spring.task.scheduling.pool.size` to a higher value to allow multiple executions of a method to run in parallel during the overlapped time interval.

## Delaying the First Execution with Initial Delay

With both `fixedDelay` and `fixedRate`,  the first invocation of the method starts immediately after the application context is initialized. However, we can choose to delay the first execution of the method by specifying the interval using the `initialDelay` attribute as shown below:

```java
@Service
public class PricingEngine {
  
  static final Logger LOGGER = 
    Logger.getLogger(PricingEngine.class.getName());

  @Scheduled(initialDelay = 2000, fixedRate = 3000)
  @Async
  public void refreshPricingParameters() {
    
    Random random = new Random();
    price = random.nextDouble() * 100;
    LOGGER.info("computing price at "+ 
      LocalDateTime.now().toEpochSecond(ZoneOffset.UTC));  
  }
}
```

Here we have set the `initialDelay` to delay the first execution of the method by `2000` milliseconds or `2` seconds.

## Specifying Intervals in ISO Duration Format

So far in our examples, we have specified the time interval in milliseconds. Specifying higher values of an interval in hours or days which is most often the case in real situations is difficult to read. 

So instead of specifying a large value like `7200000` for `2` hours, we can specify the time in the [ISO duration format](https://en.wikipedia.org/wiki/ISO_8601#Durations) like `PT02H`. 

The `@Scheduler` annotation provides the attributes `fixedRateString` and `fixedDelayString` which take the interval in the ISO duration format as shown in this code example:

```java
@Service
public class PricingEngine {
  
  static final Logger LOGGER = 
    Logger.getLogger(PricingEngine.class.getName());
  private Double price;
  
  public Double getProductPrice() {
    return price;
    
  }
  
  @Scheduled(fixedDelayString = "PT02S"))
  public void computePrice() throws InterruptedException {
    
    Random random = new Random();
    price = random.nextDouble() * 100;
    LOGGER.info("computing price at "+ 
      LocalDateTime.now().toEpochSecond(ZoneOffset.UTC));  
    Thread.sleep(4000);
  }

}
```
Here we have set the value of `fixedDelayString` as `PT02S` to specify a fixed delay of at least 2 seconds between successive invocations. Similarly, we can use `fixedRateString` to specify a fixed rate in this format. 

## Externalizing the Interval to a Properties File
We can also reference a property value from our properties file as the value of `fixedDelayString` or `fixedRateString` attributes to externalize the interval values as shown below:

```java
@Service
public class PricingEngine {
  
  static final Logger LOGGER = 
    Logger.getLogger(PricingEngine.class.getName());
  private Double price;
  
  public Double getProductPrice() {
    return price;
    
  }
  
  @Scheduled(fixedDelayString = "${interval}")
  public void computePrice() throws InterruptedException {
    
    Random random = new Random();
    price = random.nextDouble() * 100;
    LOGGER.info("computing price at "+ 
      LocalDateTime.now().toEpochSecond(ZoneOffset.UTC));  
    Thread.sleep(4000);
  }

}
```
```.properties
interval=PT02S
```
Here we have set the fixed delay interval as a property in our `application.properties` file. The property named `interval` is set to `2` seconds in the duration format `PT02S`.

## Using Cron Expressions to Define the Interval
We can also specify the time interval in UNIX style cron-like expression for more complex scheduling requirements as shown in this example:

```java
@Service
public class PricingEngine {
...
...
  @Scheduled(cron = "${interval-in-cron}")
  public void computePrice() throws InterruptedException {
    ...
    ...
    LOGGER.info("computing price at "+ 
      LocalDateTime.now().toEpochSecond(ZoneOffset.UTC));  
  }

}
```
```properties
interval-in-cron=0 * * * * *
```
Here we have specified the interval using a cron expression externalized to a property named `interval-in-cron` defined in our `application.properties` file.

A cron expression is a string of six to seven fields separated by white space to represent triggers on the second, minute, hour, day of the month, month, day of the week, and optionally the year. However, the cron expression in Spring Scheduler is comprised of six fields as shown below:


```shell
 ┌───────────── second (0-59)
 │ ┌───────────── minute (0 - 59)
 │ │ ┌───────────── hour (0 - 23)
 │ │ │ ┌───────────── day of the month (1 - 31)
 │ │ │ │ ┌───────────── month (1 - 12) (or JAN-DEC)
 │ │ │ │ │ ┌───────────── day of the week (0 - 7)
 │ │ │ │ │ │          (or MON-SUN -- 0 or 7 is Sunday)
 │ │ │ │ │ │
 * * * * * *
```

For example, a cron expression: `0 15 10 * * *` is triggered to run at 10:15 a.m. every day ( every 0th second, 15th minute, 10th hour, every day). `*` indicates the cron expression matches for all values of the field. For example, `*` in the minute field means every minute.


Expressions such as 0 0 * * * * are hard to read. To improve readability, Spring supports macros to represent commonly used sequences like in the following code sample: 

```java
@Service
public class PricingEngine {
...
...
  @Scheduled(cron = "@hourly")
  public void computePrice() throws InterruptedException {
    ...
    ...
    LOGGER.info("computing price at "+ 
      LocalDateTime.now().toEpochSecond(ZoneOffset.UTC));  
  }

}

```
Here we have specified an hourly interval with a cron macro: `hourly` instead of the less readable cron expression `0 0 * * * *`. 

Spring provides the following macros: 

* `@hourly`,
* `@yearly`, 
* `@monthly`, 
* `@weekly`, and 
* `@daily`


## Deploying Multiple Scheduler Instances with ShedLock

As we have seen so far with Spring Scheduler, it is very easy to schedule jobs by attaching the `@Scheduler` annotation to methods in Spring Beans. However, in distributed environments when we deploy multiple instances of our application, **it cannot handle scheduler synchronization over multiple instances**. Instead, it executes the jobs simultaneously on every node.


ShedLock is a library that ensures our scheduled tasks when deployed in multiple instances are executed at most once at the same time. It uses a locking mechanism by acquiring a lock on one instance of the executing job which prevents the execution of another instance of the same job. 

ShedLock uses an external data store shared across multiple instances for coordination. like Mongo, any JDBC database, Redis, Hazelcast, ZooKeeper, or others for coordination.

ShedLock is designed to be used in situations where we have scheduled tasks that are not ready to be executed in parallel but can be safely executed repeatedly. Moreover, the locks are time-based and ShedLock assumes that clocks on the nodes are synchronized.

Let us modify our example by adding the dependencies:

```xml
<dependency>
    <groupId>net.javacrumbs.shedlock</groupId>
    <artifactId>shedlock-spring</artifactId>
    <version>4.27.0</version>
</dependency>

<dependency>
  <groupId>net.javacrumbs.shedlock</groupId>
  <artifactId>shedlock-provider-jdbc-template</artifactId>
  <version>4.27.0</version>
</dependency>

<dependency>
  <groupId>com.h2database</groupId>
  <artifactId>h2</artifactId>
  <scope>runtime</scope>
</dependency>

```
We have added dependencies on the core module `shedlock-spring` along with dependencies on `shedlock-provider-jdbc-template` for jdbc template and on the h2 database to be used as the shared database. In production scenarios, we should use a persistent database like MySQL, Postgres, etc.

Next we update our scheduler configuration to integrate the library with Spring:
```java
@Configuration
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "10m")
@EnableAsync
@ConditionalOnProperty(name="scheduler.enabled", matchIfMissing = true)
public class SchedulerConfig {
  
  @Bean
  public LockProvider lockProvider(DataSource dataSource) {
    return new JdbcTemplateLockProvider(
        JdbcTemplateLockProvider.Configuration.builder()
        .withJdbcTemplate(new JdbcTemplate(dataSource))
        .usingDbTime() // Works on Postgres, MySQL, MariaDb, MS SQL, Oracle, DB2, HSQL and H2
        .build()
    );
  }

}

```

Here we have enabled schedule locking by using the `@EnableSchedulerLock` annotation. We have also configured the `LockProvider` by creating an instance of `JdbcTemplateLockProvider` which is connected to a datasource with the in-memory H2 database. 

Next, we will create a table that will be used as the shared database.
```sql
DROP TABLE IF EXISTS shedlock;

CREATE TABLE shedlock(
  name VARCHAR(64) NOT NULL, 
  lock_until TIMESTAMP(3) NOT NULL,
  locked_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), 
  locked_by VARCHAR(255) NOT NULL, 
  PRIMARY KEY (name)
);
```

Finally, we will annotate our scheduled jobs by applying the `@SchedulerLock` annotation:
```java
@Service
public class PricingEngine {
  
  static final Logger LOGGER = 
    Logger.getLogger(PricingEngine.class.getName());

  
  @Scheduled(cron = "${interval-in-cron}")
  @SchedulerLock(name = "myscheduledTask")
  public void computePrice() throws InterruptedException {
    
    Random random = new Random();
    price = random.nextDouble() * 100;
    LOGGER.info("computing price at "+ 
      LocalDateTime.now().toEpochSecond(ZoneOffset.UTC));  
    Thread.sleep(4000);
  }
  
...
...

}

```

Here we have added the `@SchedulerLock` annotation to the `computePrice()` method.
Only methods annotated with the `@SchedulerLock` annotation are locked, the library ignores all other scheduled tasks. We have also specified a name for the lock as `myscheduledTask`. We can execute only one task with the same name at the same time.

## Conditions for using Distributed Job Scheduler Quartz

[Quartz Scheduler](http://www.quartz-scheduler.org) is an open-source distributed job scheduler that provides many enterprise-class features like support for JTA transactions and clustering. 

Among its main capabilities is job persistence support to an external database that is very useful for resuming failed jobs as well as for reporting purposes.

Clustering is another key feature of Quartz that can be used for Fail-safe and/or Load Balancing. 

Spring Scheduler is preferred when we want to implement a simple form of job scheduling like executing methods on a bean every X seconds, or on a cron schedule without worrying about any side-effects of restarting jobs after failures. 

On the other hand, if we need clustering along with support for job persistence then Quartz is a better alternative.

## Conclusion

Here is a list of major points from the tutorial for quick reference:

1. Scheduling is part of the core module, so we do not need to add any dependencies. 
2. Scheduling is not enabled by default. We explicitly enable scheduling by adding the `@EnableScheduling` annotation to a Spring configuration class. 
3. We can make the scheduling conditional on a property so that we can enable and disable scheduling by setting the property.
3. We create scheduled jobs by decorating a method with the `@Scheduled` annotation.
4. Only methods with `void` return type and zero parameters can be converted into scheduled jobs by adding `@Scheduled` annotation.
5. We set the interval of executing by specifying the `fixedRate` or `fixedDelay` attribute in the `@Scheduled` annotation.
6. We can choose to delay the first execution of the method by specifying the interval using the `initialDelay` attribute.
7. We can deploy multiple Scheduler Instances using the ShedLock library which ensures only one instance to run at a time by using a locking mechanism in a shared database.
8. We can use a Distributed Job Scheduler like Quartz to address more complex scenarios of scheduling like resuming failed jobs, and reporting. 



You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-scheduler).

