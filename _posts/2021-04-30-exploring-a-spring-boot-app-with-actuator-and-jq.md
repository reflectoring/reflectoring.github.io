---
title: Exploring a Spring Boot App with Actuator and jq
categories: ["Spring Boot"]
date: 2021-04-30 05:00:00 +1100
modified: 2021-04-30 05:00:00 +1100
author: saajan
excerpt: "This article shows why and how to use Spring Actuator and jq JSON processor to explore a new Spring Boot application."
image:
  auto: 0100-motor
---

Spring Boot Actuator helps us monitor and manage our applications in production. It exposes endpoints that provide health, metrics, and other information about the running application. We can also use it to change the logging level of the application, take a thread dump, and so on - in short, capabilities that make it easier to operate in production.

While its primary use is in production, it can also help us during development and maintenance. We can use it to explore and analyze a new Spring Boot application. 

In this article, we'll see how to use some of its endpoints to explore a new application that we are not familiar with. We will work on the command line and use `curl` and `jq`, a nifty and powerful command-line JSON processor. 

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-actuator" %}}

## Why Use Actuator to Analyze and Explore an Application?

Let's imagine we are working on a new Spring Boot-based codebase for the first time. We would probably explore the folder structure, look at the names of the folders, check out the package names and class names to try and build a model of the application in our mind. We could generate some UML diagrams to help identify dependencies between modules, packages, classes, etc. 

While these are essential steps, they only give us a static picture of the application. We can't get a complete picture without understanding what happens at runtime. E.g., what are all the Spring Beans that are created? Which API endpoints are available? What are all the filters that a request goes through?

**Constructing this mental model of the runtime shape of the application is very helpful. We can then dive deeper to read and understand code in the important areas more effectively.**

## High-level Overview of Spring Actuator

Let's start with a short primer on Spring Boot Actuator.

On a high level, when we work with Actuator, we do the following steps:

1. Add Actuator as a dependency to our project
2. Enable and expose the endpoints
3.  Secure and configure the endpoints

Let's look at each of these steps briefly.

### Step 1: Add Actuator

Adding Actuator to our project is like adding any other library dependency. Here's the snippet for Maven's `pom.xml`:

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
</dependencies>
```

If we were using Gradle, we'd add the below snippet to `build.gradle` file:

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
}
```

Just adding the above dependency to a Spring Boot application provides some endpoints like `/actuator/health` out-of-the-box which can be used for a shallow health check by a load balancer, for example.

```sh
$ curl http://localhost:8080/actuator/health
{"status":"UP"}
```

We can hit the `/actuator` endpoint to view the other endpoints available by default. `/actuator` exposes a "discovery page" with all available endpoints:

```shell
$ curl http://localhost:8080/actuator
{"_links":{"self":{"href":"http://localhost:8080/actuator","templated":false},"health":{"href":"http://localhost:8080/actuator/health","templated":false},"health-path":{"href":"http://localhost:8080/actuator/health/{*path}","templated":true},"info":{"href":"http://localhost:8080/actuator/info","templated":false}}}
```

### Step 2: Enable and Expose Endpoints

Endpoints are identified by IDs like `health`, `info`, `metrics` and so on. Enabling and exposing an endpoint makes it available for use under the `/actuator` path of the application URL, like `http://your-service.com/actuator/health`, `http://your-service.com/actuator/metrics` etc.

Most endpoints except `shutdown` are enabled by default. We can disable an endpoint by setting the `management.endpoint.<id>.enabled` property to `false` in the `application.properties` file. For example, here's how we would disable the `metrics` endpoint:

```properties
management.endpoint.metrics.enabled=false
```

Accessing a disabled endpoint returns a HTTP 404 error:

```shell
$ curl http://localhost:8080/actuator/metrics
{"timestamp":"2021-04-24T12:55:40.688+00:00","status":404,"error":"Not Found","message":"","path":"/actuator/metrics"}
```

We can choose to expose the endpoints over HTTP and/or JMX. While HTTP is generally used, JMX might be preferable for some applications.

We can expose endpoints by setting the `management.endpoints.[web|jmx].exposure.include` to the list of endpoint IDs we want to expose. Here's how we would expose the `metrics` endpoint, for example:

```properties
management.endpoints.web.exposure.include=metrics
```

**An endpoint has to be both enabled and exposed to be available.**

### Step 3: Secure and Configure the Endpoints

Since many of these endpoints contain sensitive information, it's important to secure them. **The endpoints should be accessible only to authorized users managing and operating our application in production and not to our normal application users.** Imagine the disastrous consequences of a normal application user having access to `heapdump` or `shutdown` endpoints!

We will not look at securing endpoints in any detail in this article since we are mainly interested in using Spring Actuator to explore the application in our local, development environment. You can find details in the documentation [here](https://docs.spring.io/spring-boot/docs/current/reference/html/production-ready-features.html#production-ready-endpoints-security).

## A Quick Introduction to `jq`

`jq` is a command-line JSON processor. It works like a filter by taking an input and producing an output. Many built-in filters, operators and functions are available. We can combine filters, pipe the output of one filter as input to another etc. 

Suppose we had the following JSON in a file `sample.json`:

```json
{
  "students": [
    {
      "name": "John",
      "age": 10,
      "grade": 3,
      "subjects": ["math", "english"]      
    },
    {
      "name": "Jack",
      "age": 10,
      "grade": 3,
      "subjects": ["math", "social science", "painting"]
    },
    {
      "name": "James",
      "age": 11,
      "grade": 5,
      "subjects": ["math", "environmental science", "english"]
    },
    .... other student objects omitted ...
  ]
}
```

It's an object containing an array of "student" objects with some details for each student.

Let's look at a few examples of processing and transforming this JSON with `jq`.

```shell
$ cat sample.json | jq '.students[] | .name'
"John"
"Jack"
"James"
```

Let's unpack the `jq` command to understand what's happening:

<style>
.table td {
  padding-top:3px
  padding-bottom:3px
}
</style>

| Expression  | Effect |
| ----------- | ------------ |
| `.students[]` | iterate over the `students` array |
| \| | output each `student` to the next filter |
| `.name` | extract `name` from the `student` object |
{: .table}

Now, let's get the list of students who have subjects like "environmental science", "social science" etc.:

```shell
$ cat sample.json | jq '.students[] | select(.subjects[] | contains("science"))'
{
  "name": "Jack",
  "age": 10,
  "grade": 3,
  "subjects": [
    "math",
    "social science",
    "painting"
  ]
}
{
  "name": "James",
  "age": 11,
  "grade": 5,
  "subjects": [
    "math",
    "environmental science",
    "english"
  ]
}
```

Let's unpack the command again:

| Expression  | Effect |
| ----------- | ------------ |
| `.students[]` | iterate over the `students` array |
| \| | output each `student` to the next filter |
| `select(.subjects[] | contains("science"))` | select a student if their `subjects` array contains an item with the string "science" |
{: .table}

With one small change, we can collect these items into an array again:

```shell
$ cat sample.json | jq '[.students[] | select(.subjects[] | contains("science"))]'
[
  {
    "name": "Jack",
    "age": 10,
    "grade": 3,
    "subjects": [
      "math",
      "social science",
      "painting"
    ]
  },
  {
    "name": "James",
    "age": 11,
    "grade": 5,
    "subjects": [
      "math",
      "environmental science",
      "english"
    ]
  }
]
```

All we needed to do was put the entire expression within brackets.

We can use `jq` to both filter and reshape the JSON:

```shell
$ cat sample.json | jq '[.students[] | {"studentName": .name, "favoriteSubject": .subjects[0]}]'
[
  {
    "studentName": "John",
    "favoriteSubject": "math"
  },
  {
    "studentName": "Jack",
    "favoriteSubject": "math"
  },
  {
    "studentName": "James",
    "favoriteSubject": "math"
  }
]
```

We've iterated over the `students` array, created a new object containing properties `studentName` and `favoriteSubject` with values set to the `name` property and the first `subject` from the original `student` object. We finally collected all the new items into an array. 

We can get a lot done with a few keystrokes in `jq`. Since most APIs that we usually work with use JSON, it's a great tool to have in our tool belt.

Check out the [tutorial](https://stedolan.github.io/jq/tutorial/) and [manual](https://stedolan.github.io/jq/manual/) from the official documentation. [jqplay](https://jqplay.org/) is a great resource for playing around and constructing our `jq` expressions.

## Exploring a Spring Boot Application

In the remainder of this article, we'll use Actuator to explore a running Spring Boot application. The application itself is a very simplified example of an eCommerce order processing application. It only has skeleton code needed to illustrate ideas. 

While there are many Actuator endpoints available, we will focus only on those which help us understand the runtime shape of the application.

All the endpoints we will see are enabled by default. Let's expose them:

```properties
management.endpoints.web.exposure.include=mappings,beans,startup,env,scheduledtasks,caches,metrics
```

### Using the `mappings` Endpoint

**Checking out the available APIs is usually a good place to start exploring a service**. The `mappings` endpoint provides all the routes and handlers, along with additional details.

Let's hit the endpoint with a `curl` command and pipe the response into `jq` to pretty-print it:

```shell
$ curl http://localhost:8080/actuator/mappings | jq
```

Here's the response:

```shell
{
  "contexts": {
    "application": {
      "mappings": {
        "dispatcherServlets": {
          "dispatcherServlet": [
            {
              "handler": "Actuator web endpoint 'metrics'",
              "predicate": "{GET [/actuator/metrics], produces [application/vnd.spring-boot.actuator.v3+json || application/vnd.spring-boot.actuator.v2+json || application/json]}",
              "details": {
                "handlerMethod": {
                  "className": "org.springframework.boot.actuate.endpoint.web.servlet.AbstractWebMvcEndpointHandlerMapping.OperationHandler",
                  "name": "handle",
                  "descriptor": "(Ljavax/servlet/http/HttpServletRequest;Ljava/util/Map;)Ljava/lang/Object;"
                },
                "requestMappingConditions": {
                  ... properties omitted ...
                  ],
                  "params": [],
                  "patterns": [
                    "/actuator/metrics"
                  ],
                  "produces": [
                    ... properties omitted ...
                  ]
                }
              }
            },
          ... 20+ more handlers omitted ...
          ]
        },
        "servletFilters": [
          {
            "servletNameMappings": [],
            "urlPatternMappings": [
              "/*"
            ],
            "name": "webMvcMetricsFilter",
            "className": "org.springframework.boot.actuate.metrics.web.servlet.WebMvcMetricsFilter"
          },
          ... other filters omitted ...
        ],
        "servlets": [
          {
            "mappings": [
              "/"
            ],
            "name": "dispatcherServlet",
            "className": "org.springframework.web.servlet.DispatcherServlet"
          }
        ]
      },
      "parentId": null
    }
  }
}
```

 It can still be a bit overwhelming to go through this response JSON - it has a lot of details about all the request handlers, servlets and servlet filters.

Let's use `jq` to filter this information further. Since we know the package names from our service, we will have `jq` `select` only those handlers which `contains` our package name `io.reflectoring.springboot.actuator`:

```shell
$ curl http://localhost:8080/actuator/mappings | jq '.contexts.application.mappings.dispatcherServlets.dispatcherServlet[] | select(.handler | contains("io.reflectoring.springboot.actuator"))'
{
  "handler": "io.reflectoring.springboot.actuator.controllers.PaymentController#processPayments(String, PaymentRequest)",
  "predicate": "{POST [/{orderId}/payment]}",
  "details": {
    "handlerMethod": {
      "className": "io.reflectoring.springboot.actuator.controllers.PaymentController",
      "name": "processPayments",
      "descriptor": "(Ljava/lang/String;Lio/reflectoring/springboot/actuator/model/PaymentRequest;)Lio/reflectoring/springboot/actuator/model/PaymentResponse;"
    },
    "requestMappingConditions": {
      "consumes": [],
      "headers": [],
      "methods": [
        "POST"
      ],
      "params": [],
      "patterns": [
        "/{orderId}/payment"
      ],
      "produces": []
    }
  }
}
{
  "handler": "io.reflectoring.springboot.actuator.controllers.OrderController#getOrders(String)",
  "predicate": "{GET [/{customerId}/orders]}",
  "details": {
    "handlerMethod": {
      "className": "io.reflectoring.springboot.actuator.controllers.OrderController",
      "name": "getOrders",
      "descriptor": "(Ljava/lang/String;)Ljava/util/List;"
    },
    "requestMappingConditions": {
      "consumes": [],
      "headers": [],
      "methods": [
        "GET"
      ],
      "params": [],
      "patterns": [
        "/{customerId}/orders"
      ],
      "produces": []
    }
  }
}
{
  "handler": "io.reflectoring.springboot.actuator.controllers.OrderController#placeOrder(String, Order)",
  "predicate": "{POST [/{customerId}/orders]}",
  "details": {
    "handlerMethod": {
      "className": "io.reflectoring.springboot.actuator.controllers.OrderController",
      "name": "placeOrder",
      "descriptor": "(Ljava/lang/String;Lio/reflectoring/springboot/actuator/model/Order;)Lio/reflectoring/springboot/actuator/model/OrderCreatedResponse;"
    },
    "requestMappingConditions": {
      "consumes": [],
      "headers": [],
      "methods": [
        "POST"
      ],
      "params": [],
      "patterns": [
        "/{customerId}/orders"
      ],
      "produces": []
    }
  }
}
```

We can see the APIs available and details about the HTTP method, the request path etc. In a complex, real-world application, this would give a consolidated view of all the APIs and their details irrespective of how the packages were organized in a multi-module codebase. **This is a useful technique to start exploring the application especially when working on a multi-module legacy codebase where even Swagger documentation may not be available.**

Similarly, we can check what are the filters that our requests pass through before reaching the controllers:

```shell
$ curl http://localhost:8080/actuator/mappings | jq '.contexts.application.mappings.servletFilters'
[
  {
    "servletNameMappings": [],
    "urlPatternMappings": [
      "/*"
    ],
    "name": "webMvcMetricsFilter",
    "className": "org.springframework.boot.actuate.metrics.web.servlet.WebMvcMetricsFilter"
  },
  ... other filters omitted ...
]
```

### Using the `beans` Endpoint

Now, let's see the list of beans that are created:

```shell
$ curl http://localhost:8080/actuator/beans | jq
{
  "contexts": {
    "application": {
      "beans": {
        "endpointCachingOperationInvokerAdvisor": {
          "aliases": [],
          "scope": "singleton",
          "type": "org.springframework.boot.actuate.endpoint.invoker.cache.CachingOperationInvokerAdvisor",
          "resource": "class path resource [org/springframework/boot/actuate/autoconfigure/endpoint/EndpointAutoConfiguration.class]",
          "dependencies": [
            "org.springframework.boot.actuate.autoconfigure.endpoint.EndpointAutoConfiguration",
            "environment"
          ]
        },
   			.... other beans omitted ...
    }
  }
}

```

This gives a consolidated view of all the beans in the `ApplicationContext`. **Going through this gives us some idea of the shape of the application at the runtime - what are the Spring internal beans, what are the application beans, what are their scopes, what are the dependencies of each bean etc.**

Again, we can use `jq` to filter the responses and focus on those parts of the response that we are interested in:

```shell
$ curl http://localhost:8080/actuator/beans | jq '.contexts.application.beans | with_entries(select(.value.type | contains("io.reflectoring.springboot.actuator")))'
{
  "orderController": {
    "aliases": [],
    "scope": "singleton",
    "type": "io.reflectoring.springboot.actuator.controllers.OrderController",
    "resource": "file [/code-examples/spring-boot/spring-boot-actuator/target/classes/io/reflectoring/springboot/actuator/controllers/OrderController.class]",
    "dependencies": [
      "orderService",
      "simpleMeterRegistry"
    ]
  },
  "orderService": {
    "aliases": [],
    "scope": "singleton",
    "type": "io.reflectoring.springboot.actuator.services.OrderService",
    "resource": "file [/code-examples/spring-boot/spring-boot-actuator/target/classes/io/reflectoring/springboot/actuator/services/OrderService.class]",
    "dependencies": [
      "orderRepository"
    ]
  },
  ... other beans omitted ...
  "cleanUpAbandonedBaskets": {
    "aliases": [],
    "scope": "singleton",
    "type": "io.reflectoring.springboot.actuator.services.tasks.CleanUpAbandonedBaskets",
    "resource": "file [/code-examples/spring-boot/spring-boot-actuator/target/classes/io/reflectoring/springboot/actuator/services/tasks/CleanUpAbandonedBaskets.class]",
    "dependencies": []
  }
}
```

This gives a bird's-eye view of all the application beans and their dependencies. 

How is this useful? We can derive additional information from this type of view: for example, **if we see some dependency repeated in multiple beans, it likely has important functionality encapsulated that impacts multiple flows**. We could mark that class as an important one that we would want to understand when we dive deeper into the code. Or perhaps, that bean is a [God object](https://en.wikipedia.org/wiki/God_object) that needs some refactoring once we understand the codebase.

### Using the `startup` Endpoint

Unlike the other endpoints we have seen, configuring the `startup` endpoint requires some additional steps. We have to provide an implementation of `ApplicationStartup` to our application:

```java
SpringApplication app = new SpringApplication(DemoApplication.class);
app.setApplicationStartup(new BufferingApplicationStartup(2048));
app.run(args);
```

Here, we have set our application's `ApplicationStartup` to  a `BufferingApplicationStartup` which is an in-memory implementation that captures the events in Spring's complex startup process. The internal buffer will have the capacity we specified - 2048.

Now, let's hit the `startup` endpoint. Unlike the other endpoints `startup` supports the `POST` method:

```shell
$ curl -XPOST 'http://localhost:8080/actuator/startup' | jq
{
  "springBootVersion": "2.4.4",
  "timeline": {
    "startTime": "2021-04-24T12:58:06.947320Z",
    "events": [
      {
        "startupStep": {
          "name": "spring.boot.application.starting",
          "id": 1,
          "parentId": 0,
          "tags": [
            {
              "key": "mainApplicationClass",
              "value": "io.reflectoring.springboot.actuator.DemoApplication"
            }
          ]
        },
        "startTime": "2021-04-24T12:58:06.956665337Z",
        "endTime": "2021-04-24T12:58:06.998894390Z",
        "duration": "PT0.042229053S"
      },
      {
        "startupStep": {
          "name": "spring.boot.application.environment-prepared",
          "id": 2,
          "parentId": 0,
          "tags": []
        },
        "startTime": "2021-04-24T12:58:07.114646769Z",
        "endTime": "2021-04-24T12:58:07.324207009Z",
        "duration": "PT0.20956024S"
      },
     	.... other steps omitted ....
      {
        "startupStep": {
          "name": "spring.boot.application.started",
          "id": 277,
          "parentId": 0,
          "tags": []
        },
        "startTime": "2021-04-24T12:58:11.169267550Z",
        "endTime": "2021-04-24T12:58:11.212604248Z",
        "duration": "PT0.043336698S"
      },
      {
        "startupStep": {
          "name": "spring.boot.application.running",
          "id": 278,
          "parentId": 0,
          "tags": []
        },
        "startTime": "2021-04-24T12:58:11.213585420Z",
        "endTime": "2021-04-24T12:58:11.214002336Z",
        "duration": "PT0.000416916S"
      }
    ]
  }
}
```

The response is an array of events with details about the event's `name`, `startTime`, `endTime` and `duration`.

How can this information help is in our exploration of the application? **If we know which steps are taking more time during startup, we can check that area of the codebase to understand why.** It could be that a cache warmer is pre-fetching data from a database or pre-computing some data, for example. 

Since the above response contains a lot of details, let's narrow it down by filtering on `spring.beans.instantiate` step and also sort the events by duration in a descending order:

```shell
$ curl -XPOST 'http://localhost:8080/actuator/startup' | jq '.timeline.events | sort_by(.duration) | reverse[] | select(.startupStep.name | contains("instantiate"))'
$ 

```

What happened here? Why did we not get any response? Invoking `startup` endpoint also clears the internal buffer. Let's retry after restarting the application:

```shell
$ curl -XPOST 'http://localhost:8080/actuator/startup' | jq '[.timeline.events | sort_by(.duration) | reverse[] | select(.startupStep.name | contains("instantiate")) | {beanName: .startupStep.tags[0].value, duration: .duration}]' 
[
  {
    "beanName": "orderController",
    "duration": "PT1.010878035S"
  },
  {
    "beanName": "orderService",
    "duration": "PT1.005529559S"
  },
  {
    "beanName": "requestMappingHandlerAdapter",
    "duration": "PT0.11549366S"
  },
  {
    "beanName": "tomcatServletWebServerFactory",
    "duration": "PT0.108340094S"
  },
  ... other beans omitted ...
]
```

So it takes more than a second to create the `orderController` and `orderService` beans! That's interesting - we now have a specific area of the application we can focus on to understand more.

The `jq` command here was a bit complex compared to the earlier ones. Let's break it down to understand what's happening:

```shell
jq '[.timeline.events \
  | sort_by(.duration) \
  | reverse[] \
  | select(.startupStep.name \
  | contains("instantiate")) \
  | {beanName: .startupStep.tags[0].value, duration: .duration}]'
```

| Expression  | Effect |
| ----------- | ------------ |
| `.timeline.events | sort_by(.duration) | reverse` | sort the `timeline.events` array on the `duration` property and reverse the result to have it sorted in descending order |
| `[]` | iterate over the resulting array |
| `select(.startupStep.name | contains("instantiate"))` | select an element only if the element's  `startupStep` object's `name` property contains the text "instantiate" |
| `{beanName: .startupStep.tags[0].value, duration: .duration}` | construct a new JSON object with properties `beanName` and `duration`
{: .table}

The brackets over the entire expression indicate we want to collect all the constructed JSON objects into an array.

### Using the `env` Endpoint

The `env` endpoint gives a consolidated view of all the configuration properties of the application. This includes configurations from the`application.properties` file, the JVM's system properties, environment variables etc.

We can use it to see if the application has some configurations set via enviornment variables, what are all the jar files that are on its classpath etc.:

```shell
$ curl http://localhost:8080/actuator/env | jq
{
  "activeProfiles": [],
  "propertySources": [
    {
      "name": "server.ports",
      "properties": {
        "local.server.port": {
          "value": 8080
        }
      }
    },
    {
      "name": "servletContextInitParams",
      "properties": {}
    },
    {
      "name": "systemProperties",
      "properties": {
        "gopherProxySet": {
          "value": "false"
        },
        "java.class.path": {
          "value": "/target/test-classes:/target/classes:/Users/reflectoring/.m2/repository/org/springframework/boot/spring-boot-starter-actuator/2.4.4/spring-boot-starter-actuator-2.4.4.jar:/Users/reflectoring/.m2/repository/org/springframework/boot/spring-boot-starter/2.4.4/spring-boot-starter-2.4.4.jar: ... other jars omitted ... "
        },
       ... other properties omitted ...
      }
    },
    {
      "name": "systemEnvironment",
      "properties": {
        "USER": {
          "value": "reflectoring",
          "origin": "System Environment Property \"USER\""
        },
        "HOME": {
          "value": "/Users/reflectoring",
          "origin": "System Environment Property \"HOME\""
        }
        ... other environment variables omitted ...
      }
    },
    {
      "name": "Config resource 'class path resource [application.properties]' via location 'optional:classpath:/'",
      "properties": {
        "management.endpoint.logfile.enabled": {
          "value": "true",
          "origin": "class path resource [application.properties] - 2:37"
        },
        "management.endpoints.web.exposure.include": {
          "value": "metrics,beans,mappings,startup,env, info,loggers",
          "origin": "class path resource [application.properties] - 5:43"
        }
      }
    }
  ]
}
```

### Using the `scheduledtasks` Endpoint

This endpoint let's us check if the application is running any task periodically using Spring's `@Scheduled` annotation:

```shell
$ curl http://localhost:8080/actuator/scheduledtasks | jq
{
  "cron": [
    {
      "runnable": {
        "target": "io.reflectoring.springboot.actuator.services.tasks.ReportGenerator.generateReports"
      },
      "expression": "0 0 12 * * *"
    }
  ],
  "fixedDelay": [
    {
      "runnable": {
        "target": "io.reflectoring.springboot.actuator.services.tasks.CleanUpAbandonedBaskets.process"
      },
      "initialDelay": 0,
      "interval": 900000
    }
  ],
  "fixedRate": [],
  "custom": []
}
```

From the response we can see that the application generates some reports every day at 12 pm and that there is a background process that does some clean up every 15 minutes. We could then read those specific classes' code if we we wanted to know what those reports are, what are the steps involved in cleaning up an abandoned basket etc.

### Using the `caches` Endpoint

This endpoint lists all the application caches:

```shell
$ curl http://localhost:8080/actuator/caches | jq
{
  "cacheManagers": {
    "cacheManager": {
      "caches": {
        "states": {
          "target": "java.util.concurrent.ConcurrentHashMap"
        },
        "shippingPrice": {
          "target": "java.util.concurrent.ConcurrentHashMap"
        }
      }
    }
  }
}
```

We can tell that the application is caching some `states` and `shippingPrice` data. This gives us another area of the application to explore and learn more about: how are the caches built, when are cache entries evicted etc.

### Using the `health` Endpoint

The `health` endpoint shows the application's health information:

```shell
$ curl http://localhost:8080/actuator/health
{"status":"UP"}
```

This is usually a shallow healthcheck. While this is useful in a production environment for a loadbalancer to check against frequently, it does not help us in our goal of understanding the application.

Many applications also implement **deep healthchecks** which **can help us quickly find out what are the external dependencies of the application, which databases and message brokers does it connect to etc**.

Check out this Reflectoring [article](https://reflectoring.io/spring-boot-health-check/) to learn more about implementing healthchecks using Actuator.

### Using the `metrics` Endpoint

This endpoint lists all the metrics generated by the application:

```shell
$ curl http://localhost:8080/actuator/metrics | jq
{
  "names": [
    "http.server.requests",
    "jvm.buffer.count",
    "jvm.buffer.memory.used",
    "jvm.buffer.total.capacity",
    "jvm.threads.states",
    "logback.events",
    "orders.placed.counter",
    "process.cpu.usage",
    ... other metrics omitted ...
  ]
}
```

We can then fetch the individual metrics data: 

 ```shell
$ curl http://localhost:8080/actuator/metrics/jvm.memory.used | jq
{
  "name": "jvm.memory.used",
  "description": "The amount of used memory",
  "baseUnit": "bytes",
  "measurements": [
    {
      "statistic": "VALUE",
      "value": 148044128
    }
  ],
  "availableTags": [
    {
      "tag": "area",
      "values": [
        "heap",
        "nonheap"
      ]
    },
    {
      "tag": "id",
      "values": [
        "CodeHeap 'profiled nmethods'",
        "G1 Old Gen",
				... other tags omitted ...
      ]
    }
  ]
}
 ```

**Checking out the available custom API metrics is especially useful. It can give us some insight into what is important about this application from a business's point of view.** For example, we can see from the metrics list that there is an `orders.placed.counter` that probably tells us how many orders have been placed in a period of time.

## Conclusion

In this article, we learned how we can use Spring Actuator in our local, development environment to explore a new application. We looked at a few actuator endpoints that can help us identify important areas of the codebase that may need a deeper study. Along the way, we also learned how to process JSON on the command line using the lightweight and extremely powerful `jq` tool.

You can play around with a complete application illustrating these ideas using the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-actuator).