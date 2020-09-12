---
title: "Production Health Check of Spring Boot Applications"
categories: [spring-boot]
date: 2020-09-07 06:00:00 +1000
modified: 2020-09-07 06:00:00 +1000
author: pratikdas
excerpt: "Developing a Spring Boot App Against AWS Services with LocalStack"
image:
  auto: 0074-stack
---
Building health checking mechanisms forms an integral part of an application especially when it runs in a distributed environment. They provide visibility and useful metrics to observe the state of an application. 



We will look at health check in spring-boot.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-health-check" %}

## Why Do we use Health Check?
In distributed system, lot of moving parts database, queues, other servces, they can go down , could be slow. Timely Detecting and proactive mitigation will ensure that the application is stable thereby minimising any impact to business functions.

Health information is used to check the status of our running application. It is often used by monitoring software to raise alerts when a production system goes down.

In case of API built using microservice architecture, we publish in a dashboard which can be monitored by the consuming systems and fallback to redundant systems. Giving below health check dashboards from twitter APIs:

## Common Health Checking Techniques
Monitoring an application’s health is one of the most important tasks when running production grade services.

The common way of health check is to periodically check the “heartbeat” of a running application by sending requests to some its API endpoints which run light weight processes and do not change the state of a system. A response is represented in a dashboard or integrated with a monitoring system to send alerts.

Although this method can tell you if the application itself is up and running, it doesn’t tell you anything about the many services that the application depends on (for example, a database, cache, or another running service), even though these dependencies are critical for its functioning. So a better way is a composite health check. We will look at both these approaches.


## Adding Health Check in Spring Boot Applications
We will build few APIs in simple application and build mechanisms to check and monitor their health.
We will build health check in our application. Let us first create our application with the [Spring Initializer](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.3.3.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik.healthcheck&artifactId=usersignup&name=usersignup&description=Demo%20project%20for%20Spring%20Boot%20Health%20Check&packageName=io.pratik.healthcheck.usersignup&dependencies=web,actuator,webflux). 

## Basic Check by Adding the Actuator Dependency

The `actuator` module provides the health check function. 

```xml
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
```
We will build our application:
```shell
mvn clean package
```
Running this command wiill generate the executable jar in the fat jar format. We will execute this jar with :

```shell
java -jar target/usersignup-0.0.1-SNAPSHOT.jar
```
If we run the application and access the health endpoint
```shell
curl http://localhost:8080/actuator/health
```

```shell
{"status":"UP"}
```
Our application uses a database and an external service.

## Actuator Components

- HealthContributorRegistry
- HealthContributors
  - HealthIndicator
  - CompositeHealthContributor
- StatusAggregator  

## Composite Health Check 
There is a Spring Boot add-on known as Actuator which provides a user insight into the Spring environment for a running application. It has several endpoints, and a full discussion of this functionality can be found in the Actuator Documentation

One of the more interesting endpoints provided by Actuator is /health. This endpoint will provide an indication of the general health of the application, and for each of the @Component classes that implement the HealthIndicator interface, will actually check the health of that component. By default, all standard components (such as DataSource) implement this interface. The HealthCheck provided by a DataSource is to make a connection to a database and perform a simple query, such as select 1 from dual against an Oracle DataBase.


## Custom Endpoints


## Kubernetes Probes


## Conclusion

We saw how to use LocalStack for testing the integration of our application with AWS services locally. Localstack also has an [enterprise version](https://localstack.cloud/#pricing) available with more services and features. 

I hope this will help you to feel empowered and have more fun while working with AWS services during development and lead to higher productivity, shorter development cycles, and lower AWS cloud bills.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-health-check).