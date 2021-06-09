---
title: "Getting Started with Camel and Spring Boot"
categories: [craft]
date: 2021-04-25 06:00:00 +1000
modified: 2021-04-25 06:00:00 +1000
author: pratikdas
excerpt: "AWS DynamoDB is a fully managed NoSQL database service in AWS Cloud. In this article, we will see how to integrate Apache Camel with a Spring Boot Application with the help of some code examples"
image:
  auto: 0074-stack
---

Apache Camel is an open source framework for integrating a wide variety of applications. It plays the role of a message oriented middleware (MoM) by taking a data payload (message) from a source system to a destination system with optional processing stages along the way. When using Camel to transport messages, we get to choose from a set of [Enterprise Integration Patterns (EIP)](https://www.enterpriseintegrationpatterns.com/patterns/messaging/toc.html) most suitable for our use case.

Integration in microservice architecture is a common problem which is best solved by applying one of the proven EIPs. Apache Camel provides implementations of most of the EIPs which we configure in our integration flows with DSLs.

In this article, we will look at using Apache Camel for building integration logic in microservice applications built with [Spring Boot](https://spring.io/projects/spring-boot)with the help of code examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/springcamel" %}


## Why Apache Camel
Before going further, we should understand why we should use Apache Camel in our applications. Alternatively, we have the option of using custom code for writing integration logic like making an API call or sending a message to a Queue of a message provider system. Apart from making our application code look verbose with lots of LOC, we may not to it in the way it is best done by taking care of all the exception scenarios. Design patterns are a solution for applying proven approaches to common set of problems and Apache Camel provides implementation of most of the EIPs. Here are some more reasons we should consider using Apache Camel for our integration requirements:


[Amazon Camel](https://aws.amazon.com/dynamodb/) is a framework for integrating applications. A typical integration framework consists of data flowing from source to destination with some transformations along the way, Almost every technology you can imagine is available, for example HTTP, FTP, JMS, EJB, JPA, RMI, JMS, JMX, LDAP, Netty, and many, many more (of course most ESBs also offer support for them). Besides, own custom components can be created very easily. 

Lightweight: Camel is acknowledged as a lean framework compared to other integration frameworks like Mule, Kafka, and Spark.
Easy to change: by configuring connectors. 
Wide collection of connectors
Supporting EIP
Extensible: with new custom connectors. application can be extended
Multiple deployment options

## Important Camel Components

Now let us understand the important concepts of Apache Camel.

As explained at the start, Apache Camel plays the role of a message oriented middleware (MoM) by taking a data payload (message) from a source system to a destination system with optional processing stages along the way.

![Table items attributes](/assets/img/posts/aws-dynamodb-java/tablitemattr.png)

Here we are moving a message from system A to system B. A system in this context is an application or any othe
A Route is the most basic construct which we use to define the path a message should take while moving from source to a destination. A route is built by extending RouteBuilder class.

Camel uses a Java based Routing Domain Specific Language (DSL) or an XML Configuration to configure routing and mediation rules which are added to a CamelContext to implement the various Enterprise Integration Patterns.

Component references are references used to place a component in an assembly. Apache Component references provides various references that offers services for messaging, sending data, notifications and various other services that can not only resolve easy messaging and transferring data but also provide securing of data.

Routes

Endpoints

There is plenty to know about Apache for building a good understanding for which we should refer to the [official documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html). 



Let us see some examples creating applications by using these two methods in the following sections.


## Routing Example

### XML

### DSL

## Spring Integration

Apache Camel ships a Spring Boot Starter module `camel-spring-boot-starter` that allows you to develop Spring Boot applications using starters. 

To use the starter, add the following to your spring boot pom.xml file:


<dependency>
    <groupId>org.apache.camel</groupId>
    <artifactId>camel-spring-boot-starter</artifactId>
    <version>${camel.version}</version> <!-- use the same version as your Camel core version -->
</dependency>

## Example
Let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.4.5.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=springcloudsqs&name=dynamodbspringdata&description=Demo%20project%20for%20Spring%20data&packageName=io.pratik.springdata&dependencies=web), and then open the project in our favorite IDE.

### Building Route with RouteBuilder

```java
from("REST").process(saveToDB).dynamicRouter(method(dynamicRouter));
```

### Triggering the Route

```java
Exchange response = producerTemplate.send("REST", exchange);
```

## Conclusion

In this article, we looked at the important concepts of Apache Camel and performed database operations from two applications written in Spring Boot first with Spring Data and then using the Enhanced DynamoDB Client. Here is a summary of the things we covered:
1. AWS DynamoDB is a NoSQL Key-value data store and helps us to store flexible data models.
2. We store our data in a table in AWS DynamoDB. A table is composed of items and each item has a primary key and a set of attributes.
3. A DynamoDB table must have a primary key which can be composed of a partition key and optionally a sort key.
4. We create a secondary Index to search the DynamoDB on fields other than the primary key.
5. We accessed DynamoDB with Spring Data module and then with Enhanced DynamoDB Client module of AWS Java SDK.

I hope this will help you to get started with building applications using Spring with AWS DynamoDB as the database. 

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/springdynamodb).