---
title: "Twelve-Factor App with Spring Boot"
categories: [spring-boot]
date: 2020-09-27 06:00:00 +1000
modified: 2020-09-27 06:00:00 +1000
author: pratikdas
excerpt: "We will build a Twelve-factor application with Spring Boot."
image:
  auto: 0082-ekg
---

[Twelve-factor app](https://12factor.net) is a set of guidelines used for building cloud-native applications. By cloud-native, we will mean an application that is portable across environments, easy to update, and scalable enough to take advantage of the elastic capabilities of the cloud. These twelve factors comprise of best practices on managing configuration data, abstracting library dependencies and backing services, log streaming, and administration. 

Today's microservice frameworks already adhered to a few of these principles by design, while some are supported by running the applications inside containers. 

Spring Boot is a popular framework for building microservice applications. In this article, we will check the compliance of the Spring Boot application with the Twelve-factor app and the necessary changes required to make it adhere to those principles. 

## Goals of the Twelve-factors
A common theme running through all the twelve principles is making the application portable to meet the demands of a dynamic environment provisioning typical of cloud platforms. The goals of the Twelve-factor app as asserted in the [documentation](https://12factor.net) are:

1. ***Using declarative formats*** to automate the setup.
2. ***Maximizing portability*** across execution environments
3. Suitable for ***deployment in Cloud Platforms***
4. ***Minimizing divergence between development and production***, enabling continuous deployment for maximum agility
5. Ability to ***scale up without significant changes*** to tooling, architecture, or development practices.

We will see these principles in action by applying them to a Spring Boot application. 

## Codebase - Single Codebase Under Version Control for All Environments

> One codebase tracked in revision control, many deploys

This principle advocate having a single codebase that can be built and deployed to multiple environments. Each environment has specific resource configurations like database, configuration data, and API URLs. To achieve this, we need to separate all the environment dependencies into a form that can be specified during the build and run phases of the application. 

This helps to achieve the first two goals of the Twelve-Factor app - maximizing portability across environments using declarative formats

Following this principle, we will have a single Git repository containing the source code of our Spring Boot application. This will be built and run for different environments by specifying environment-specific properties. 

[Spring Profiles](https://reflectoring.io/spring-boot-profiles/) and [environment properties](https://reflectoring.io/profile-specific-logging-spring-boot/) are popular ways of doing this. 

This rule will be broken, if we have to change the source code before building for a specific environment or have separate repositories for different environments like development and production.

## Dependencies
> Explicitly declare and isolate dependencies

The most likely dependencies of an application are the libraries pulled from open source repositories or built inhouse by other teams. Dependencies could also take the form of specific software installed in the host system. The dependencies are declared in external files leveraging dependency management tools of the platform.

For the Spring Boot application, we declare the library dependencies in `pom.xml` or Gradle depending on whether we are using Maven or Gradle. Our Spring Boot application uses `spring-boot-starter-web` as one of its dependencies. The declarative form of this dependency is added to the `pom.xml`: 

```xml
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
```

This principle is an evolution from an earlier practice of sharing libraries across applications by storing them in a shared classpath. But using this approach introduced a coupling with the configuration of the host system. 

The declarative style of specifying dependencies removed this coupling. In the context of using Spring Boot, when using a dependency tool like Maven/Gradle also allows us in :
 - ***Versioning*** by declaring specific versions of the dependencies with which our application works, and
 - ***Isolating*** them by bundling them with the application.

## Config - Externalizing Configuration Properties
> Store config in the environment

Few examples of configuration data are database connection URL and credentials, and URLs of services on which an application depends. These most often have different values across environments. If these are hard-coded in the code or property files bundled with the application, we need to update the application for deploying to different environments. 

Instead, a better approach is to [externalizing](https://reflectoring.io/externalize-configuration/https://reflectoring.io/externalize-configuration/) the configuration using environment variables. The values of the environment variables are provided at runtime. We can provide the values from the command line if the application is run standalone. The default behavior in Spring Boot applications is to apply the values from environment variables to override any values declared in property files.

## Backing Services - Pluggable Datasources, and Queues
> Treat backing services as attached resources

Backing services should be attached and replaceable instead of embedded in the code. The use of specifications like JPA helps us achieve this for RDBMS databases. But in the absence of specifications, some code creeps into the code although we can keep them separate with abstraction layers. Similar to JPA, we can use JMS for messaging and SMTP for mails.
```xml
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>runtime</scope>
    </dependency>
```
The declarative format allows us to replace the H2 database with any other RDBMS like Oracle or MySQL.

## Build, Release, Run - Leverage Development Workflow for Containers
> Strictly separate build and run stages

The stages for Build, Release, Run should be kept separate. For Spring Boot Applications, this is easy to achieve with the development workflow for containers. 

The activities in these stages are:
***Build***: we compile the source code and build the Docker Image
***Release***: Tag the Image and push to the Registry.
***Run***:  The Image pushed to the Registry during the release stage is pulled and run as a container instance. 
 
If we are using containers to package and run our application, no application changes are required to adhere to the Twelve-factor app principle.


## Processes - Stateless Applications
> Execute the app as one or more stateless processes

Spring Boot applications execute as a Java process on the host system or inside a container runtime environment like Docker. This principle advocates that the processes should be stateless and share-nothing.  Any data that needs to persist must be stored in a stateful backing service like a database.

This is a shift from the method of using “sticky sessions” in web applications that cache user session data in the memory of the application's process and expecting future requests from the same session to be routed to the same process. Sticky sessions are a violation of twelve-factor. Session state data should be stored outside the application in a datastore that offers time-expiration, such as Memcached or Redis.

## Port Binding - Port Defined as Environment Property
> Export services via port binding

Port binding is one of the fundamental requirements for microservices to be autonomous and self-contained.

The default web container- Tomcat is embedded in the Spring Boot applications that exports HTTP as a service by binding to a port and listening to incoming requests in that port. a port that is specified by the property  ```server.port```. The default value is 8080. But we can override this value by passing this property as an environment variable. 


## Concurrency - Stateless Applications Helps to Scale-Out
> Scale out via the process model 

Spring Boot applications are stateless. This helps them to scale out by creating more instances to support increasing loads. This is taken care of by container orchestration systems like Kubernetes and Docker Swarm. From an application perspective all state if any needs to be managed outside the application.


## Disposability - Leverage Ephemeral Containers
> Maximize robustness with fast startup and graceful shutdown

Spring Boot applications are commonly run inside containers. Containers are ephemeral and can be started or stopped at any moment. So it is important to minimize the startup time and ensure that the application shuts down gracefully when the container stops. Startup time is minimized with lazy initialization of dependent resources and by building [optimized container images(https://reflectoring.io/spring-boot-docker/).

## Dev/prod Parity - Build Once - Ship it Anywhere
> Keep development, staging, and production as similar as possible

Movement of code across environments has traditionally been a major factor slowing down the development velocity. This resulted from a difference in the infrastructure used for development and production. 

Containers made this possible to build once and ship to multiple target environments. Containers make it possible to package all the dependencies including the OS and all dependencies. 

Spring Boot applications are packaged in Docker containers and pushed to a Docker registry. Apart from using a Docker file to create a Docker image, Spring Boot provides plugins for [building OCI image from source](https://reflectoring.io/spring-boot-docker/) with Cloud-Native buildpacks.


## Logs - Publish Logs as Event Streams
> Treat Logs as Event Streams

The application should only produce logs in the form of event streams. Storing the logs in files or databases and shipping to other systems for further analysis should be delegated to purpose-built software. 

Spring Boot logs only to the console by default and does not write log files. It is preconfigured with Logback as the default Logger implementation. However, the principle of producing logs as event streams enables it to be integrated with a rich ecosystem of log appenders, filters, shippers, monitoring, and visualization tools to build a highly observable system. All these are elaborated in [configuring logging in Spring boot](https://reflectoring.io/springboot-logging/).


## Admin Processes - Built as API and Packaged with the Application
> Run admin/management tasks as one-off processes

Most applications need to run one-off tasks for administration and management. Examples of these tasks include database scripts to initialize the database or scripts for fixing bad records. This code should be packaged with the application and released together and run in the same environment. 

In the Spring Boot application, we expose admin functions as separate endpoints that are invoked as one-off processes. Adding functions to execute one-off processes will go through the build, test, and release cycle.


## Conclusion
We looked at the Twelve-factor principles for building a cloud-native application. The following table puts everything in one perspective:

| Factor        | Spring Boot Changes|
| ------------- |:-------------:| 
| Codebase      | One Codebase for all environments |
| Dependencies      | Declare dependencies in pom.xml |
| Config      | Externalize Configuration with Environment Properties. |
| Backing Services      | Pluggable services by coding to specifications like JPA |
| Build/Release/Run      | Container workflow |
| Processes      | Framework Support.No changes required |
| Port Binding      | Configured with server.port environment variable |
| Concurrency      | Framework Support.No changes required |
| Disposability      | Container feature |
| Dev/prod parity      | Container feature |
| Logs      | Publish Logs as Event Streams | 
| Admin Processes      | Build one-off processes as APIs  |  

