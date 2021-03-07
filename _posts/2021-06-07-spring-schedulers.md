---
title: "Scheduling with springboot"
categories: [craft]
date: 2021-03-05 00:00:00 +0530
modified: 2021-03-05 00:00:00 +0530
author: default
excerpt: "In this article we look at spring schedulers, different anntations for scheduling tasks, internal deep dive and how to schedule tasks without annotation"
image:
  auto: 0061-cloud
---

We developers do have use cases where we need to execute some task periodically, it could be at a fixed time in a day or maybe every few hours, one way to do it  rather old fashioned way  would be to expose endpoints for those tasks and calling those endpoints via scheduling jobs like CAWA. But what if I told you we do not need to do this, Spring developers already took care of this and that's what we would be discussing in this article i.e. Spring Schedulers.

Some use cases where we can utilize Spring scheduler are calling an API periodically i.e every few hours, reading a file from an SFTP location which is uploaded there once a day by your upstream ,or may be checking your mail to see if your manager is on leave every morning :). Basically anything that you want to do periodically without depending on any external System can be done by Spring scheduler


## How to add Spring Scheduler to your project

Good news is you do not need any additional dependency as it comes with spring boot starter

## Important Annotations for Spring EnableScheduling

* `@EnableScedhuling`: to be used on  @Configuration  classes ,it enables detection of `@Scheduled` annotations, generally we use it on top of our MainClass, but no one is stopping us, to use it over your own configuration class.
```java
@SpringBootApplication
@EnableScheduling
public class SpringSchedulerApplication {
 public static void main(String[] args) {
   SpringApplication.run(SpringSchedulerApplication.class, args);
 }
}
```
* `@ScheduledFuture`: is used over methods which will basically defines the task, continue reading you will get a better understanding.
  

## What are Spring Scheduler Tasks

Strictly talking about syntax, **any void method which does take any parameters and is decorated with @Scheduled annotation** can be termed as spring scheduler task. 


## Different ways to schedule tasks


As of now we know `@Scheduled` is the way to schedule tasks, but now we will see different flavors of it.
* `Schedule tasks with FixedRate`: Using this would execute our task, after every n milliseconds, which you provided. **An important thing to know here is that every execution is independent i.e. it will execute our task even if previous execution is still `in progress`**.
```java
@Scheduled(fixedRate = 1000)
public void callApiViaFixedRate() {
 System.out.println("calling API using fixed rate");
}
```
* Schedule tasks with FixedDelay: Using this would ensure, the gap between execution of our task is always n milliseconds, i.e. **our task will invoke only `after previous execution is complete.`**
```java
@Scheduled(fixedDelay = 1000)
public void callApiViaFixedDelay() {
 System.out.println("calling API using fixed delay");
}
```
* `Schedule tasks with Cron Expression`: Generally our use cases are to execute tasks daily at some fixed time or weekly or any other `calendar schedule`, for those purposes we use cron expression.
```java
@Scheduled(cron = "0/30 * * * * ?")
public void callApiViaCron() {
 System.out.println("calling API using cron expression");
}
```

For Fixed Rate, Fixed Delay and Cron, we can add **initial delays** for the FIRST execution only, that is our task will be executed `after the initial delay specified`. So we can do some preparatory things if we want to.
```java
@Scheduled(fixedRate = 1000, initialDelay = 200)
public void callApiViaFixedRateWithInitialDelay() {
 System.out.println("calling API using fixed rate with initial delay");}
```   

For the Cron task, we can also specify **zones**. For example if NASA wants to stop the Perseverance rover’s heating system at 9 AM Martian time, they can use a spring scheduler:). The only problem is to add Martian TimeZone Support, rest is already covered.

```java
@Scheduled(cron = "0 0 9 * * ?", zone = "Milky Way/Mars")
public void callApiViaCronForASpecificZone() {
 System.out.println("Stop heating systems, its warm enough");
}   
```  

## Where do we run scheduled tasks
**Generally all tasks are queued over one thread pool.**

We can define a custom Thread pool and our scheduled tasks will run over it. 

```java
@SpringBootApplication
@EnableScheduling
public class SpringSchedulerApplication {
 public static void main(String[] args) {
   SpringApplication.run(SpringSchedulerApplication.class, args);
 }

//custom thread pool size of 10, define it as per need
@Bean(destroyMethod = "shutdown")
public ThreadPoolTaskScheduler taskScheduler() {
 ThreadPoolTaskScheduler taskScheduler = new     ThreadPoolTaskScheduler();
  taskScheduler.setPoolSize(10);    
  return taskScheduler;
 }
}
```

## How it all works, Deep Dive into internals


So let's do a little deep dive and understand some internals and see how it all works

The Spring Framework provides abstractions for scheduling of tasks with the TaskScheduler interfaces, and the annotations we discussed earlier are all annotation support for these methods below.
      

```java
public interface TaskScheduler {

  //remember there is not annotation support for this.
  //we will cover this later in this article
  ScheduledFuture schedule(Runnable task,
   Trigger trigger);


  ScheduledFuture schedule(Runnable task, 
    Date startTime);

  ScheduledFuture scheduleAtFixedRate(Runnable task,
   Date startTime, long period);

  ScheduledFuture scheduleAtFixedRate(Runnable task,
   long period);

  ScheduledFuture scheduleWithFixedDelay(Runnable task,
   Date startTime, long delay);

  ScheduledFuture scheduleWithFixedDelay(Runnable task, 
    long delay);

}
```

**Now every task is run as a thread on the threadpool and spring internally manages it as a scheduled task which Internally has a task and which is basically a runnable at its core**

```java
//this is protected, so you cannot  create an instance of this manually 
public final class ScheduledTask {
 private final Task task;
 @Nullable
 volatile ScheduledFuture<?> future;

 ScheduledTask(Task task) {
   this.task = task;
 }
 public void cancel() {
   ScheduledFuture<?> future = this.future;
   if (future != null) {
     future.cancel(true);
   }
 }
}

public class Task {
 private final Runnable runnable;

 public Task(Runnable runnable) {
   Assert.notNull(runnable, "Runnable must not be null");
   this.runnable = runnable;
 }

 public Runnable getRunnable() {
   return this.runnable;
 }
}
```

Now hopefully all basics are clear, lets where all the magic happens and how these things come together to save the world

```java
ScheduledAnnotationBeanPostProcessor
```
 is the class, when you use `@Scheduled` annotation on any void method, this class holds the responsibility of registering that as ScheduledTask and its management.

This class has a
```java
processScheduled()
```
which is called when `@Scheduled` is used,
And this class register the task, based on whatever type of flavour you have used for example **if its a `@Scheduled(cron=””)`  it will register a CronTask, if it is a `@Scheduled(fixedRate=””)` it will register a FixedRateTask.**

```java
public class CronTask extends TriggerTask {
 private final String expression;

 public CronTask(Runnable runnable, String expression) {
   this(runnable, new CronTrigger(expression));
 }

 public CronTask(Runnable runnable, CronTrigger cronTrigger) {
   super(runnable, cronTrigger);
   this.expression = cronTrigger.getExpression();
 }

 public String getExpression() {
   return this.expression;
 }
}
``` 

Now we won’t look at all the tasks, you can look at processScheduled for more detail.
Why I wanted to show is to have your attention on **private final String expression;** 

**It is final which means once we use `@Scheduled(cron=””)`, we CANNOT update it programmatically later**, if we want to change it, we will need to register a new task and stop this one.

Same goes with tasks of any other flavor, **they all are IMMUTABLE when we create it with `@Scheduled` annotation**.

**Unfortunately, there is no annotation which supports mutable tasks**. That means we will have to do it manually.

Now to have the ability to change the scheduling at run time, we will need to use  
```java
ScheduledFuture schedule(Runnable task, Trigger trigger);
```             
Recollect we already saw this in `TaskScheduler` and that's what we will see in the next section.


## How to schedule a task without annotation

  The first question that comes to any develoipers mind is **Why to schedule a task with annotation?**        

  * **Tasks created with @Schedule annotation are immutable:** As we read in the previous section, `@Scheduled` annotation tasks are immutable, For example we scheduled a task which pulls data at 4 AM everyday, now if we want to change it on runtime, we can’t. We will need to stop the application and update the cron expression.
  * **Tasks need custom trigger logic:** we can have use cases, where we want to run tasks based on some `custom logic`, **let's say we calculate next execution time based on that day's weather forecast.**


  We need to create a **custom Trigger**, which could even hold your custom logic. Here in this example we will just update the expression via calling updateCron method.



```java
@Component
public class CustomTrigger implements Trigger {

private String cron="initialCron";

public void updateCron(String updatedCron){
  this.cron = updatedCron;
;}

 @Override
 public Date nextExecutionTime(TriggerContext triggerContext) {
   CronTrigger crontrigger = new CronTrigger(cron)
   Date nextRunDate = crontrigger.nextExecutionTime(triggerContext);
   return nextRunDate;
 }
}
``` 

Now we have the trigger, we will create a config class and register our task for that we need to implement **SchedulingConfigurer**   interface


```java
@Component
public class SchedulerConfig implements SchedulingConfigurer{

 private final CustomTrigger customTrigger;

 private ScheduledFuture<?> future;
 @Override
 public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {

   taskScheduler = taskRegistrar.getScheduler();
   future = taskScheduler.schedule(
       () -> {
         System.out.println("call API from custom task");
       }, customTrigger);
  }
}

``` 


Now once you start the app, your app will run using the initial cron expression and when you call updateCron with some different cron, it will run on that updated expression.

## Conclusion

So In this article we have saw how to use `@Scheduled` annotation, different flavors of `@Scheduled` annotation, overview of its internal working and **how to schedule a mutable task without any annotations** 
With all of this informatiom. I am sure you will get motivation to deep dive in spring internals and implement any custom solution required in your projects. 



