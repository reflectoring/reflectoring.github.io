---
title: "Health Checks with Spring Boot"
categories: [spring-boot]
date: 2020-09-27 06:00:00 +1000
modified: 2020-09-27 06:00:00 +1000
author: pratikdas
excerpt: "We will build a Twelve-factor application with Spring Boot."
image:
  auto: 0082-ekg
---

[Twelve-factor app](https://12factor.net) is a set of guidelines for building good quality software. These guidelines were initially conceived in Heroku but have come to be considered as best practices for building cloud native applications. By cloud native we will mean application which is portable across environments, scalable to take advantage of the elastic capabilities of the cloud.

A majority of these principles are implicit in today's microservice frameworks. However we can also observe a shift from the 'older way' of building systems targetted to run on constrained infrastructure. Spring Boot is a popular framework for building microservice application. In this article, we will build a Twelve-factor application with Spring Boot and discuss these along.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-health-check" %} 

## What are the Twelve-factors
The Twelve-factor is a set of twelve principles encompassing guidelines on managing configuration data, abstracting library dependencies and backing services, log streaming, and administration. A common theme running through all the twelve principles is making the application portable to meet the demands of dynamic environment provisioning typical of cloud platforms. That is also the reason why they are often discussed along side cloud-native applications.

## Codebase
> One codebase tracked in revision control, many deploys

When not using Cloud, we were used to working with a fixed set of environments like dev, qa, prod in on-premise infrastructure. Each have environment specific resources like database, api url's. This principle advocates having a single codebase that can be built and deployed to multiple environments. To achieve this we need to separate all the environment dependencies into a form that can be specified during build and run. 

Following this principle, we will have a single Git repository containing the source code of our Spring Boot application. This will be built for different environments by specifying environment specific properties. Spring Profiles and environment properties are standard ways of doing this. 

This rule will be violated if we have to change the source code before building for a specific environment.

## Dependencies
> Explicitly declare and isolate dependencies
An evolution from an earlier practice of sharing dependencies across applications by storing common libraries in a classpath shared by multiple applications. This introduces a dependency on the configuration of the host system. Host systems are ephemeral today having evolved into containers. 

Some of the key components of this condition are :
- Managing dependencies with Maven as Dependency Manager
- Declarative
- Versioning 
- Isolating the dependencies by bundling them with the application
The dependencies are declared in external files leveraging dependency management tools of the platform, For Spring Boot application we declare the library dependencies in `pom.xml` or gradle depending on whether we are using Maven or Gradle. For our Spring Boot application, our pom.xml contains the dependencies of database driver and web framework.

## Config
> Store config in the environment

Examples of configuration data include database connection URL and credentials, URLs of services on which an application depends. These most often have different values across environments. If these are hard-coded in the code or in property files bundled with the application, we need to update the application for deploying to different environments. Instead a better approach is to update the configuration with environment variables.

So all environment related information is extracted as environment variables. The snippet of our property files shows the URLs mapped to environment variables. We can supply the values from command line if the application is run standalone. If The default behaviour Spring Boot applications is to prefer using values from environment variables over values declared in property files. Kubernetes is used as container orchestration system. The environment variables are supplied in configmap or in env variables in container spec in Deployment object.

## Backing Services
> Treat backing services as attached resourcesTreat backing services as attached resources 

Backing services should be attached and replacable instead of embedded in the code. Use of specifications like JPA help us achieve this for RDBMS databases. But in the absence of specifications some code creeps into the code although we can keep them separate with abstraction layers. Similar to JPA, we can use JMS for messaging and SMTP for mails.


## Build, release, run
> Strictly separate build and run stages

The stages for Build, Release, Run should be kept separate. For Spring Boot Applications, we compile the source code and build the Docker Image
Tag the Image and push to the Registry.
Run: Image is pulled and run as a container instance.

✓Strong isolation between Build, Release, and Run:
- Build Stage, compiling and producing binaries by including all the assets required.
- Release Stage, combining binaries with environment- specific configuration parameters. - Run Stage, running application on a specific execution environment.
✓ The pipeline is unidirectional, so it is not possible to propagate changes from the run stages back to the build stage.
✓ANTI-PATTERN, Specific builds for production. SUGGESTION = Go through the pipeline.
✓ANTI-PATTERN, Make changes to the code at runtime.
SUGGESTION = Any change (or set of changes) must create a new release, following the
Pipeline: Build -> Release -> Run.
✓ SUGGESTION = Every release should always have a unique release ID, such as a timestamp of the release (such as 2011-04-06-20:32:17) or an incrementing number (such as v100).
✓ BUILD = codebase + dependencies + assets ✓ RELEASE = BUILD + config
✓ RUN = run process against RELEASE
✓ ROLLBACK = just use the last release instead.





## Processes
> Execute the app as one or more stateless processes

Spring Boot applications execute as a Java process on the host system or inside a container runtime environment like Docker. This principle advocates that the processes should should be stateless and share-nothing. Any data that needs to persist must be stored in a stateful backing service like a database.

Some web systems rely on “sticky sessions” – that is, caching user session data in memory of the app’s process and expecting future requests from the same visitor to be routed to the same process. Sticky sessions are a violation of twelve-factor and should never be used or relied upon. Session state data is a good candidate for a datastore that offers time-expiration, such as Memcached or Redis.


## Port Binding
> Export services via port binding

Port binding is one of the fundamental requirements for microservices to be autonomous and self-contained.

The default web container- Tomcat is embedded in the Spring Boot applications that exports HTTP as a service by binding to a port and listening to incoming requests in that port. a port that is specified by the property  ```server.port```. The default value is 8080. But we can override this value by passing this property as an environment variable. 


## Concurrency
> Scale out via the process model
Spring Boot applications are stateless. This helps them to scale out by creating more instances to support increasing loads. This is taken care of by container orchstration systems like Kubernetes and Docker Swarm. From an application perspective all state if any needs to be managed outside the application.


## Disposability
> Maximize robustness with fast startup and graceful shutdown

Spring Boot applications are commonly run inside containers. Containers are ephemeral and can be started or stopped at any moment. So it is important to minimize the startup time and ensure that the application shuts down gracefully when the container stops. Startup time is minimized with lazy initialization of dependent resources and by building [optimized container images(https://reflectoring.io/spring-boot-docker/).

## Dev/prod parity
> Keep development, staging, and production as similar as possible

Movement of code across environments has traditionally been a major factor slowing down the development velocity. This resulted from difference in the infrastructure used for development and in production. 

Containers made this possible to build once and ship to multiple target environments. Container make it possible to package all the dependencies including the OS and all dependencies. 

Spring Boot applications are packaged in Docker containers and pushed to a Docker registry. Apart from using a Docker file to create a Docker image, Spring Boot provides plugins for [building OCI image from source](https://reflectoring.io/spring-boot-docker/) with Cloud-Native buildpacks.


## Logs
> Treat Logs as Event Streams

The application should only produce logs in the form of event streams. Storing the logs in files or database and shipping to other systems for further analysis should be delegated to specialized software. 

Spring Boot logs only to the console by default, and does not write log files. It is preconfigured with Logback as the default Logger implementation. However the principle of producing logs as event streams enables it to be integrated with a rich ecosystem of log appenders, filters, shippers, monitoring and visualization tools to build a highly observable system. All these is elaborated in [configuring logging in Spring boot](https://reflectoring.io/springboot-logging/).


## ADMIN Processes: Administering the Application
> Run admin/management tasks as one-off processes
Most applications need to run one-off tasks for administration and management. Examples of these tasks include database scripts to initialize the database or scripts for fixing bad records. This code should be packaged with the application and released together and run in the same environment. 

In Spring Boot application we expose admin functions as separate endpoints that are invoked as one-off processes. Adding functions to execute one-off processes will go through the build, test, and release cycle.



## Conclusion
We looked at the twelve factor principles for building cloud native application. The diagram puts everything in one perspective:

These principles should be adhered to when building cloud native applications when using other languages and frameworks.


You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-12-factor).