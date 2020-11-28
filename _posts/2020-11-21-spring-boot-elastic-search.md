---
title: "Using Elastic Search with Spring Boot"
categories: [spring-boot]
date: 2020-11-05 06:00:00 +1000
modified: 2020-11-05 06:00:00 +1000
author: pratikdas
excerpt: "How do we build a search function in Spring Boot using Elastic Search?"
image:
  auto: 0086-twelve
---

We always work with some kind of data in our applications. The data is usually dead if it cannot be located and made use of. A search function provides the capability to locate and fetch this data relevant to our application. Elastic Search is a tool for searching documents. From the elastic website - Elasticsearch is a distributed, RESTful search and analytics engine.

In this article, we will look at the components of elastic search and then build a simple search application using Spring Boot to demonstrate it's main capabilities. 

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-elasticsearch" %}

## Components of Elastic Search
Elastic Search has two principal components viz. Document and Index around which most of the other components work. **We query an Index to search a Document.** Let us look at the main ones.

Document: Anything we can search in Elasticsearch is a Document.

Index: 

## Building our Search Application

L


A common theme running through all the twelve principles is making the application portable to meet the demands of a dynamic environment provisioning typical of cloud platforms. The goals of the Twelve-Factor App as asserted in the [documentation](https://12factor.net) are:

1. **Using declarative formats** to automate the setup.
2. **Maximizing portability** across execution environments
3. Suitable for **deployment in Cloud Platforms**
4. **Minimizing divergence between development and production** by enabling continuous deployment for maximum agility
5. Ability to **scale up without significant changes** to tooling, architecture, or development practices.

We will see these principles in action by applying them to a Spring Boot application. 

## 1. Codebase - Single Codebase Under Version Control for All Environments

> One codebase tracked in revision control, many deploys.

**This helps to establish clear ownership of an application with a single individual or group.** The application has a single codebase that evolves with new features, defect fixes, and upgrades to existing features. The application owners are accountable for building different versions and deploying to multiple environments like test, stage, and production during the lifetime of the application. 

This principle advocates having a single codebase that can be built and deployed to multiple environments. Each environment has specific resource configurations like database, configuration data, and API URLs. To achieve this, we need to separate all the environment dependencies into a form that can be specified during the build and run phases of the application. 

This helps to achieve the first two goals of the Twelve-Factor App - maximizing portability across environments using declarative formats.

**Following this principle, we'll have a single Git repository containing the source code of our Spring Boot application. This code is compiled and packaged and then deployed to one or more environments.**

We configure the application for a specific environment at runtime using [Spring profiles](/spring-boot-profiles/) and [environment-specific properties](/profile-specific-logging-spring-boot/). 

**We're breaking this rule if we have to change the source code to configure it for a specific environment** or if we have separate repositories for different environments like development and production.

## 2. Dependencies

> Explicitly declare and isolate dependencies.

**Dependencies provide guidelines for reusing code between applications. While the reusable code itself is maintained as a single codebase, it is packaged and distributed in the form of libraries to multiple applications.** 

The most likely dependencies of an application are open-source libraries or libraries built in-house by other teams. Dependencies could also take the form of specific software installed on the host system. We declare dependencies in external files leveraging the dependency management tools of the platform.

For the Spring Boot application, we declare the dependencies in a `pom.xml` file (or `build.gradle` if we use Gradle). Here is an example of a Spring Boot application using `spring-boot-starter-web` as one of its dependencies: 

```xml
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
```

This principle is an evolution from an earlier practice of sharing libraries across applications by storing them in a shared classpath. Using that approach introduced a coupling with the configuration of the host system. 

The declarative style of specifying dependencies removes this coupling. 

In the context of using Spring Boot, when using a dependency tool like Maven/Gradle we get:

 - **Versioning** by declaring specific versions of the dependencies with which our application works, and
 - **Isolation** by bundling dependencies with the application.

## 3. Config - Externalizing Configuration Properties

> Store config in the environment.

Ideally, the environments are dynamically provisioned in the cloud, so very little information is available while building the application. 

**Isolating configuration properties into environment variables makes it easy and faster to deploy the application to different environments without any code changes.** 

A few examples of configuration data are database connection URLs and credentials, and URLs of services on which an application depends. These most often have different values across environments. If these are hard-coded in the code or property files bundled with the application, we need to update the application for deploying to different environments. 

Instead, a better approach is to [externalize the configuration](/externalize-configuration/) using environment variables. The values of the environment variables are provided at runtime. We can provide the values from the command line if the application is run standalone. 

The default behavior in Spring Boot applications is to apply the values from environment variables to override any values declared in property files. We can use [configuration properties](/spring-boot-configuration-properties/) to use the configuration parameters in the code.

## 4. Backing Services - Pluggable Data Sources, and Queues

> Treat backing services as attached resources.

**This principle provides flexibility to change the backing service implementations without major changes to the application.**

Pluggability can be best achieved by using an abstraction like JPA over an RDBMS data source and using configuration properties (like a JDBC URL) to configure the connection.

This way, we can just change the JDBC URL to swap out the database. And we can swap out the underlying database by changing the dependency. A snippet of a dependency on H2 database looks like this:


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
We can easily replace the H2 database with any other RDBMS like Oracle or MySQL. Similar to JPA, we can use JMS for messaging and SMTP for mails.

## 5. Build, Release, Run - Leverage Containers for the Development Workflow

> Strictly separate build and run stages.

**We should keep the stages for build, release, and run as separate. This separation is important to maintain application fidelity and integrity.**
 
 These stages occur in a sequence. Each stage has a different objective and produces output that is propagated to the subsequent stage. 

Any code changes including emergency fixes should happen in the build stage and follow an established release cycle before being promoted to production. Violating this principle for example by making a fix in production environments however small makes it difficult to propagate to the build stage, disturbs existing branches, and above all increases risk and overall cost of following this practice.

For Spring Boot applications, this is easy to achieve with the development workflow for containers:

* **Build**: we compile the source code and build a Docker image.
* **Release**: we tag the image and push it to a registry.
* **Run**:  we pull the image from the registry and run it as a container instance. 
 
If we are using containers to package and run our application, no application changes are required to adhere to this Twelve-Factor App principle.


## 6. Processes - Stateless Applications

> Execute the app as one or more stateless processes.

**Stateless processes give the application an ability to scale out quickly to handle a sudden increase in traffic and scale in when the traffic to the system decreases.** To make it stateless, we need to store all data outside the application.

Spring Boot applications execute as a Java process on the host system or inside a container runtime environment like Docker. This principle advocates that the processes should be stateless and share-nothing. Any data that needs to persist must be stored in a stateful backing service like a database.

This is a shift from the method of using “sticky sessions” in web applications that cache user session data in the memory of the application's process and expecting future requests from the same session to be routed to the same process. 

Sticky sessions are a violation of twelve-factor. Session state data should be stored outside the application in a datastore that offers time-expiration, such as Memcached or Redis.

## 7. Port Binding - Port Defined as Environment Property

> Export services via port binding.

**Port Binding refers to an application binding itself to a particular port and listening to all the requests from interested consumers on that port.** The port is declared as an environment variable and provided during execution.

Applications built following this principle do not depend on a web server. The application is completely self-contained and executes standalone. The web server is packaged as a library and bundled with the application.

Port binding is one of the fundamental requirements for microservices to be autonomous and self-contained.

Spring Boot embeds Tomcat in applications and exports HTTP as a service by binding to a port and listening to incoming requests to that port. 

We can configure the port by setting the `server.port` configuration property. The default value is 8080.

## 8. Concurrency - Stateless Applications Help to Scale Out

> Scale out via the process model. 

Traditionally, whenever an application reached the limit of its capacity, the solution was to increase its capacity by adding RAM, CPU, and other resources - a process called vertical scaling.
 
Horizontal scaling or "scaling out", on the other hand, is a more modern approach, meant to work well with the elastic scalability of cloud environments. **Instead of making a single process even larger, we create multiple processes and then distribute the load of our application among those processes.**

Spring Boot does not help us much with this factor. We have to make sure that our application is stateless, and thus can be scaled out to many concurrent workers to support the increased load. All kinds of state should be managed outside the application.

And we also have to make sure to split our applications into multiple smaller applications (i.e. microservices) if we want to scale certain processes independently. Scaling is taken care of by container orchestration systems like Kubernetes and Docker Swarm.


## 9. Disposability - Leverage Ephemeral Containers

> Maximize robustness with fast startup and graceful shutdown.

**Disposability in an application allows it to be started or stopped rapidly.** 

The application cannot scale, deploy, or recover rapidly if it takes a long time to get into a steady state and shut down gracefully. If our application is under increasing load, and we need to bring up more instances to handle that load, any delay to startup could mean denial of requests during the time the application is starting up.

Spring Boot applications should be run inside containers to make them disposable. Containers are ephemeral and can be started or stopped at any moment. 

So it is important to minimize the startup time and ensure that the application shuts down gracefully when the container stops. Startup time is minimized with lazy initialization of dependent resources and by building [optimized container images](/spring-boot-docker/).

## 10. Dev/Prod Parity - Build Once - Ship Anywhere
> Keep development, staging, and production as similar as possible.

**The purpose of dev/prod parity is to ensure that the application will work in all environments ideally with no changes.** 

Movement of code across environments has traditionally been a major factor slowing down the development velocity. This resulted from a difference in the infrastructure used for development and production. 

Containers made it possible to build once and ship to multiple target environments. They also allow to package all the dependencies including the OS. 

Spring Boot applications are packaged in Docker containers and pushed to a Docker registry. Apart from using a Docker file to create a Docker image, Spring Boot provides plugins for [building OCI image from source](/spring-boot-docker/) with Cloud-Native buildpacks.


## 11. Logs - Publish Logs as Event Streams
> Treat Logs as Event Streams.

The application should only produce logs as a sequence of events. In cloud environments, we have limited knowledge about the instances running the application.  The instances can also be created and terminated, for example during elastic scaling. 

**An application diagnostic process based on logs stored in file systems of the host instances will be tedious and error-prone.** 

So the responsibility of storing, aggregating, and shipping logs to other systems for further analysis should be delegated to purpose-built software or observability services available in the underlying cloud platform.

Also simplifying your application’s log emission process allows us to reduce our codebase and focus more on our application’s core business value.

Spring Boot logs only to the console by default and does not write log files. It is preconfigured with Logback as the default Logger implementation. 

Logback has a rich ecosystem of log appenders, filters, shippers, and thus supports many monitoring and visualization tools. All these are elaborated in [configuring logging in Spring boot](/springboot-logging/).


## 12. Admin Processes - Built as API and Packaged with the Application
> Run admin/management tasks as one-off processes.

Most applications need to run one-off tasks for administration and management. The original recommendation emphasizes using programmatic interactive shells (REPL) more suited to languages like python and C. However this needs to be adapted suitably to align with the current development practices. 

Examples of administrative tasks include database scripts to initialize the database or scripts for fixing bad records. In keeping with the Twelve-Factor App's original goals of building for maximum portability, this code should be packaged with the application and released together, and also run in the same environment. 

In a Spring Boot application, we should expose administrative functions as separate endpoints that are invoked as one-off processes. Adding functions to execute one-off processes will go through the build, test, and release cycle.


## Conclusion
We looked at the Twelve-Factor principles for building a cloud-native application with Spring Boot. The following table summarizes what we have to do and what Spring Boot does for us to follow the twelve factors:

| Factor        | What do we have to do?|
| ------------- |-------------| 
| Codebase      | Use one codebase for all environments. |
| Dependencies      | Declare all the dependencies in `pom.xml` or `build.gradle`. |
| Config      | Externalize configuration with environment variables. |
| Backing Services      | Build pluggable services by using abstractions like JPA. |
| Build/Release/Run      | Build and publish a Docker image. |
| Processes      | Build stateless services and store all state information outside the application, for example in a database.|
| Port Binding      | Configure port with the `server.port` environment variable. |
| Concurrency      | Build smaller stateless applications (microservices). |
| Disposability      | Package the application in a container image. |
| Dev/prod parity      | Build container images and ship to multiple environments.  |
| Logs      | Publish logs to a central log aggregator. | 
| Admin Processes      | Build one-off processes as API endpoints.  |  

