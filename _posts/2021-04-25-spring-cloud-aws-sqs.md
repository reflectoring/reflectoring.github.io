---
title: "Working with AWS SQS and Spring Cloud"
categories: [craft]
date: 2021-04-25 06:00:00 +1000
modified: 2021-04-25 06:00:00 +1000
author: pratikdas
excerpt: "Working with AWS SQS and Spring Cloud"
image:
  auto: 0074-stack
---
Spring Cloud is a suite of projects containing many of the services required to make an application cloud-native by conforming to the 12-Factor principles. Spring Cloud for Amazon Web Services(AWS) is a sub-project of Spring Cloud built with the objective of making it easy to integrate with AWS services.

In this article we will look at using Spring Cloud AWS for working with AWS SQS.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/localstack" %}

## What is SQS?
Amazon Simple Queue Service (Amazon SQS) is a reliable, highly-scalable hosted queue for storing messages as they travel between applications or microservices. Amazon SQS moves data between distributed application components and helps you decouple these components.



## Configuring the Dependencies

Let us create a Spring Boot project with the help of the Spring boot Initializr.

For configuring Spring Cloud AWS, we will add a separate Spring Cloud AWS BOM in our `pom.xml` file:

```xml
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>io.awspring.cloud</groupId>
        <artifactId>spring-cloud-aws-dependencies</artifactId>
        <version>2.3.0</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
```

Next, we will add the dependency with a starter for the AWS SQS service:

```xml
    <dependency>
      <groupId>io.awspring.cloud</groupId>
      <artifactId>spring-cloud-starter-aws-messaging</artifactId>
    </dependency>

```

## Configuring Client Configuration
clientConfiguration - The client configuration options controls how a client connects to Amazon SQS with attributes like proxy settings, retry counts, etc. We can override the default configuration used by all integrations with ...
We will configure Spring Cloud AWS to use ClientConfiguration by defining a bean of type ClientConfiguration and a name specific to the integration `sqsClientConfiguration`
## Performing Operations on Queue 

### Sending a Message

### Receiving a Message


## Conclusion

We saw how to use Spring Cloud AWS for the integration of our application with AWS SQS service . 

I hope this will help you to feel empowered and have more fun while working with AWS services during development and lead to higher productivity, shorter development cycles, and lower AWS cloud bills.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/localstack).