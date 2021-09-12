---
title: "Running Scheduled Jobs in Spring Boot"
categories: [craft]
date: 2021-09-02 06:00:00 +1000
modified: 2021-09-02 06:00:00 +1000
author: pratikdas
excerpt: "Amazon CloudWatch is a monitoring and observability service in AWS Cloud. In this article, we will generate different types of application metrics in a Spring Boot web application and send those metrics to Amazon CloudWatch. Amazon CloudWatch will store the metrics data, and help us to derive insights about our application by visualizing the metric data in graphs."
image:
  auto: 0074-stack
---

Scheduling is the process of executing a piece of logic at a specifuc time in future.
Scheduled jobs are a piece of business logic that should run on a scheduled basis. Spring allows us to run scheduled jobs in the Spring container by using some simple annotations.

In this tutorial, we'll illustrate how the Spring @Scheduled annotation can be used to configure and schedule tasks.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/springcloudwatch" %}


## Creating the Spring Boot Application for Scheduling

To work with some examples, let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.5.4&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=jobscheduling&name=jobscheduling&description=Demo%20project%20for%20Schedulers%20in%20Spring%20Boot&packageName=io.pratik.jobscheduling), and then open the project in our favorite IDE. We have not added any dependencies to Maven `pom.xml` since scheduler is part of the core module of Spring framework.

## Enable Scheduling

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

As a best practice we should move this annotation to a dedicated class under a package for maintaining configuration as shown below:

```java
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
public class SchedulerConfig {

}
```

When the `@EnableScheduling` annotation is processed, Spring scans the application packages to find all the Spring Beans decorated with `@Scheduled` methods and sets up their execution schedule.

## Enable Scheduling Based on a Property
We would also like to disable scheduling during running tests. For this we need to add another annotation `@ConditionalOnProperty` with the name of the property.

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
Here we have specified the property name as `scheduler.enabled`. We want to enable it by default. For this we have also set the value of `matchIfMissing` to `true` which means we do not have to set this property to enable scheduling but have to set this property to explicitly to disable scheduler.

## Adding Scheduled Jobs

After enabling scheduling, we will add jobs to our application for scheduling. We can turn any method in a Spring bean for scheduling by adding the `@Scheduled` annotation over it. 

The `@Scheduled` is a method level annotation applied at runtime to mark the method to be scheduled. It takes one attribute from `cron`, `fixedDelay`, or `fixedRate` attributes for specifying the schedule of execution in different formats.
The annotated method must expect no arguments. It will typically have a void return type; if not, the returned value will be ignored when called through the scheduler.

The annotated method needs to fulfill two conditions:
1. The method needs should not have a return type and so return `void`. For methods which have a  return type, the returned value is ignored when invoked through the scheduler.
2. The method should not accept any input parameters.

In the next sections, we will examine different options for specifying the scheduler to trigger the scheduled jobs. The `@Scheduled` is a method level [annotation](https://docs.oracle.com/javase/tutorial/java/annotations/index.html) and we need to add it on a method of a Spring Bean class. We can provide parameters to the annotations to specify if we wish the method to be executed on a fixed interval or at a specific schedule of time and date.

| fixedRate | fixedDelay |
| - | - |
| The method is run on periodic intervals even if the last invocation may still be running |  specifically controls the next execution time when the last execution finishes|

Let us look at their behavaviour by running the example.

## Running the Job with Fixed Delay

For repeated execution of the method with `Scheduled` annotation at regular intervals, we use the `fixedRate` attribute of the annotation to specify the interval in milliseconds.

In this example, we are computing the price at regular intervals of 2 seconds:

When a fixedDelay is specified, the next execution will only begin a specified number of milliseconds after the previous execution is finished. 

Unlike fixed rate, with fixed delay, the method execution starts after the previous execution ends. 

```java
@Service
public class PricingEngine {
  
  private Double price;
  
  public Double getProductPrice() {
    return price;
    
  }
  
  @Scheduled(fixedDelay = 7000)
  public void computePrice() {    
    Random random = new Random();
    price = random.nextDouble() * 100;
    System.out.println("computing price "+price);   
  }

}

```
Spring executes the above method at a fixed delay of 2 seconds. Which means, the duration between the end of first execution and the start of the next will always be 2 seconds. In other words, the next execution won’t start until the specific fixed delay is elapsed after the completion of the current execution.


## Running the Job at Fixed Rate

For repeated execution of the method annotated with `Scheduled` annotation at regular intervals, we use the `fixedRate` attribute of the annotation to specify the interval in milliseconds.

In this example, we are computing the price at regular intervals of 2 seconds:

```java
@Service
public class PricingEngine {
  
  static final Logger LOGGER = Logger.getLogger(PricingEngine.class.getName());
  private Double price;
  
  public Double getProductPrice() {
    return price;
    
  }
  
  @Scheduled(fixedRate = 2000)
  @Async
  public void computePrice() {
    
    Random random = new Random();
    price = random.nextDouble() * 100;
    LOGGER.info("computing price at "+ LocalDateTime.now());  
  }

}

```
Here we have annotated the `computePrice` method with the `@Scheduled` annotation and set the `fixedRate` attribute to `2000` milliseconds. 

When we run the application, we get the following output in the console:

```shell
: computing price at 1631452537
: computing price at 1631452539
: computing price at 1631452541
: computing price at 1631452543
: computing price at 1631452545
: computing price at 1631452547
...
```
As we can see from the output, the epoch time is printed after every 2 seconds.

Let us add a delay of 4 seconds to the method to check the behaviour of the method.

```java
@Service
public class PricingEngine {
...
  
  @Scheduled(fixedRate = 2000)
  public void computePrice() throws InterruptedException {
    
    Random random = new Random();
    price = random.nextDouble() * 100;
    LOGGER.info("computing price at "+ LocalDateTime.now().toEpochSecond(ZoneOffset.UTC));  
    Thread.sleep(4000);
  }

}

```

When we run the application, we can see the method executing at intervals of 4 seconds completely ignoring the interval set for the `fixedRate` attribute. 
```shell
: computing price at 1631452933
: computing price at 1631452937
: computing price at 1631452941
: computing price at 1631452945
...
...
```
This behaviour of waiting for the method to finish execution when the `fixedRate` interval is expired is very similar to the behaviour of the scheduler with `fixedDelay` explained in the previous section.
We will fix this in the next section using another annotation `@Async`.

the method every 2 seconds that is 2 seconds between each invocation. First invocation starts immediately after the application context is initialized. Execution time of the method is not taken into consideration when we use fixed rate. 



## Running the Job with an Initial Delay
We can specify the initial start time. We specify these values in milliseconds. Specifying higher values becomes difficult to read. So we can specify a Java Duration 

```java
@Service
public class PricingEngine {
  
  private Double price;
  
  public Double getProductPrice() {
    return price;
    
  }
  
  @Scheduled(initialDelay = 100, fixedDelay = 7000)
  public void computePrice() {    
    Random random = new Random();
    price = random.nextDouble() * 100;
    System.out.println("computing price "+price);   
  }

}

```

## Specifying Interval in Duration Format
In our previous examples, we have specified the time interval in milliseconds. Specifying higher values becomes difficult to read. So we can specify the time in Java Duration format like "".

## Cron Expressions
To specify more complex time interval, we use cron expressions. A cron-like expression, extending the usual UN*X definition to include triggers on the second, minute, hour, day of month, month, and day of week.
For example, "0 * * * * MON-FRI" means once per minute on weekdays (at the top of the minute - the 0th second). "

The fields read from left to right are interpreted as follows.

second
minute
hour
day of month
month
day of week
The special value "-" indicates a disabled cron trigger, primarily meant for externally specified values resolved by a ${...} placeholder.




## Handling Multiple Instances of a Scheduled Job



## Conclusion

Here is a list of important points from the tutorial for quick reference:

1. Scheduling is part of the core module so we do not need to add any dependencies. 
2. Scheduling is not enabled by default. We explicitly enable by adding the `@enableScheduling` annotation to a Spring configuration class. 
3. We can make the scheduling conditional on a property so that we can enable and disable scheduling by setting the property.
3. We create scheduled jobs by decorating a method with the `@scheduled` annotation.
4. Only methods with `void` return type and zero parameters can be converted into scheduled jobs by adding `@scheduled` annotation.
5. We set the interval of executing by specifying the `fixedRate` or `fixedDelay` attribute in the `@scheduled` annotation.


You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/springscheduler).

