---
title: Executing Code on Spring Boot Application Startup
categories: [spring-boot]
date: 2019-11-12 06:00:00 +1100
modified: 2019-11-12 06:00:00 +1100
excerpt: "TODO"
image:
  auto: 0031-matrix
tags: ["configuration"]
---

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/startup" %}

## Why Would I Want to Run Code at Startup?

The most critical use case of doing something at application startup is when we want our application to start processing certain data only when everything is set up to support that processing. 

Imagine our application is event-driven and pulls events from a queue, processes them, and then sends new events to another queue. In this case, we want the application to start pulling events from the source queue only if the connection to the target queue is ready to receive events. 

In a more conventional setting, our application responds to HTTP requests and loads and saves data to a database. We want to start responding to HTTP requests only once the database connection is ready to do its work, otherwise we would be serving responses with HTTP status 500 until the connection was ready.

Spring Boot takes care of many of those scenarios automatically and will activate certain things only when the application is "warm".

For custom scenarios, though, we need a way to react to application startup with custom code. Spring and Spring Boot offer several ways of doing this.

Let's have a look at each of them.

## `CommandLineRunner`

`CommandLineRunner` is a simple interface we can implement to execute some code after the Spring application has successfully started up:

```java
@Component
class MyCommandLineRunner implements CommandLineRunner {

  @Override
  public void run(String... args) throws Exception {
    // do something
  }

}
```

When Spring Boot finds a `CommandLineRunner` object in the application context, it will call its `run()` method after the application has started up and pass in the command line arguments with which the application has been started. 

If we need simple access to a command line parameter, this is the way to go.

## `ApplicationRunner`

`ApplicationRunner` work very similar. The only difference is that the command line 

## @PostConstruct
## InitializinBean
## ApplicationListener
## Putting Things in Order
Table showing where @Order can be used.

@PostConstruct: only @DeopendsOn works

Box: Warning that too much ordering stuff is not very maintainable