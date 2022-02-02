---
title: "Getting Started with Spring Boot"
categories: ["Spring"]
date: 2022-01-18 00:00:00 +1100 
modified: 2022-01-18 00:00:00 +1100
authors: [mateo]
excerpt: "A comprehensive entry level guide through Spring Boot"
image: images/stock/0012-pages-1200x628-branded.jpg 
url: getting-started-with-spring-boot
---
# Introduction
- Spring Boot vs. Spring

# Our First Project

Let us imagine that we got a job at the local bookstore. We need to build them an application that will allow them to keep track of borrowed books. The application is simple, and we started to design it.

We need two types of entities:
- User
- Book

The user can register to the application, see all books and borrow them. The bookstore wants to constraint each user to borrow only three books at one time. 

The book contains information about the author, date of publication, and a number of instances of that book currently available in the store.

After some thinking, the bookstore wanted the system to send automatic notifications about book return overdue.

# Setting up the Project

In this chapter, we will show how to generate a new Spring Boot project using IntelliJ IDE and Spring Initializr.
## Generation Through IDE

In the IntelliJ IDE we can go to the __File -> New -> Project...__. We will get the next screen:
{{% image alt="Spring Boot initialization through IDE" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-IDE.png" %}}

After defining the project on this screen we can move forward to the next screen:

{{% image alt="Spring Boot initialization through IDE" src="images/posts/spring-boot-begginer-guide/spring-boot-initialize-IDE-2.png" %}}

We will, for now, just select the Spring Web dependency. This dependency provides the embedded Tomcat container, and we can go and run our application locally. We won't use much, but we will see a deployed instance of our application running locally.
## Generation Through Spring Initializr

On the next (link)[#https://start.spring.io/], we can generate the Spring Boot project:

{{% image alt="Spring Boot initialization online" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-online.png" %}}

Even though the page looks differenct, we need to provide the same information as in the (previous chapter)[#generation-through-ide]. 

After defining all necessary information, we can go and add our dependency. By clicking on the button on the top right corner, we can see the next screen:

{{% image alt="Spring Boot initialization online" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-online-2.png" %}}

We can search the Spring Web dependency and add it to our project. After selecting desired dependencies, we can generate our project by clicking the "Generate" button on the lower-  left corner of the screen. This will download the zip file onto our machine. We need to unpack the    provided file and import it into the IDE.

## What is Generated ?
### Pom.xml
Let us look into the pom.xml file that Spring Boot generated for us:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.6.2</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.reflectoring</groupId>
    <artifactId>begginers-guide</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>begginers-guide</name>
    <description>begginers-guide</description>
    <properties>
        <java.version>11</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```
The pom.xml is the file containing project information and dependencies. The dependency is the package that we need to download to our machine for build to run successfully.

In the (previous chapter)[#setting-up-the-project] we defined only one dependency: Spring Web. The `spring-boot-starter-web` contains everything that we need to run and deploy our first web application.

It contains:
 - spring-boot-starter
 - spring-boot-starter-json
 - spring-boot-starter-tomcat
 - spring-web
 - spring-web-mvc

The starter dependencies are one of the Spring Boot features. They pulls all necessery dependencies for the application to run successfullyWe can see that in the `spring-boot-starter-web` we go the `spring-boot-starter` which contains all core features, auto-configuration support etc. We got the embedded Tomcat server with the `spring-boot-starter-tomcat`. 

### Application.properties
If we look into the application.properties file we will find it empty. That is because we didn't need to change the default configuration.

With the `spring-boot-starter-web` dependency we got the auto-configuration feature enabled. The application.properties enables us to change those configurations by hand. 
The great thing about using the application.properties file is that we can externalize our configuration and make our codebase work in different environments. 

Imagine that we built our application and we want to deploy it on two separate enviroments:
- development
- production

Each environment has separate authentication server. We can configure our application so that we don't need to push separate codebase for each environment each time. We can define custom location in the application.properties:
```xml
authentication.server.location=https://mock-production.com/auth
```

- Environment variables

### Application.class

### Tests


- What is generated
        - pom.xml
        - Application.class
        - application.properties
        - tests
- Building spring MVC app
    - Building first controllers
        - Dependencies that we need ?
        - What is Spring MVC ?
        - What is Servlet Container ?
        - Explain part by part of the conttroller ( annotations, requests, responses, multipart etc.)
    - Connecting to the database
        - Dependencies that we need ?
        - What is the driver and which ones can we use ?
        - How to set up the connection ?
        - Repository pattern ?
        - Explain part by part of the repository ( annotations, hibernate etc.)
    - Enabling security
        - How to enable security
        - How does security work
        - Enable different types of security
    - Writing unit and integration tests with the Spring Boot
- Conclusion