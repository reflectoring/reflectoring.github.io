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

In the IntelliJ IDE, we can go to the __File -> New -> Project...__. We will get the next screen:
{{% image alt="Spring Boot initialization through IDE" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-IDE.png" %}}

After defining the project on this screen, we can move forward to the next screen:

{{% image alt="Spring Boot initialization through IDE" src="images/posts/spring-boot-begginer-guide/spring-boot-initialize-IDE-2.png" %}}

We will, for now, select the Spring Web dependency.

This dependency provides the embedded Tomcat container, and we can go and run our application locally. We won't see much, but we will see a deployed instance of our application running locally.
## Generation Through Spring Initializr

On the [link](#https://start.spring.io/), we can generate the Spring Boot project:

{{% image alt="Spring Boot initialization online" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-online.png" %}}

Even though the page looks different, we need to provide the same information as in the [previous chapter](#generation-through-ide). 

After defining all necessary information, we can go and add our dependency. By clicking on the button on the top right corner, we can see the next screen:

{{% image alt="Spring Boot initialization online" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-online-2.png" %}}

We can search the Spring Web dependency and add it to our project. After selecting desired dependencies, we can generate our project by clicking the "Generate" button on the lower-left corner of the screen. This will download the zip file onto our machine. We need to unpack the provided file and import it into the IDE.

## Generated files
The initializaion process creates several files and folders:

{{% image alt="Spring Boot initialization online" src="images/posts/spring-boot-begginer-guide/spring-boot-generated-files.png" %}}

In next two chapters we will go through:
- [pom.xml](#maven-dependencies)
- [application.properties](#configuration-file)

### Maven dependecies
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
The dependency is the package that contains the peace of the code that our project needs to run successfully.
The pom.xml defines all dependencies that we are going to use. For now, we are importing only `spring-boot-starter-web`. 

The `spring-boot-starter-web` contains everything we need to run and deploy our first web application.
It contains:
 - spring-boot-starter
 - spring-boot-starter-json
 - spring-boot-starter-tomcat
 - spring-web
 - spring-web-mvc

The starter dependencies are one of the Spring Boot features. They pull all necessary dependencies for the application to run successfully. 

The `spring-boot-starter-web` contains `spring-boot-starter` which contains all core features, auto-configuration support etc. The `spring-boot-starter-tomcat` provides us with the embedded Tomcat server. 

### Configuration file
If we look into the application.properties, file we will find it empty. That is because we didn't need to change the default configuration.

With the `spring-boot-starter-web` dependency, we got the auto-configuration feature enabled. With the application.properties we can change those configurations by hand.

The great thing about using the application.properties file is that we can externalize our configuration and make our codebase work in different environments.

We will show how to use the application.properties file later on when we start building our application.

# Building Controllers
After discussing about generation process let us create our first controller in the application.

The imported `spring-boot-starter-web` contains everything that we need for the controller. We have the Spring MVC autoconfigured and the embedded Tomcat server ready to use.

The Spring MVC is a Spring framework which is used to create Model View Controller web applications. With the Spring MVC we can define a controller with the `@Controller` or `@RestController` annotation so it can handle incoming requests.

## Creating a Endpoint With the @RestController
We are going to create our first endpoint. We want to fetch all books that the bookstore owns.
Let us look into the codebase:
```java
@RestController
@RequestMapping("/books")
public class BooksRestController {

    @GetMapping
    List<BookResponse> fetchAllBooks(){
        BookResponse sandman = BookResponse.builder()
                .title("The Sandman Vol. 1: Preludes & Nocturnes")
                .author("Neil Gaiman")
                .publishedOn("19/10/2010")
                .currentlyAvailableNumber(4)
                .build();
        BookResponse lotr = BookResponse.builder()
                .title("The Lord Of The Rings Illustrated Edition")
                .author("J.R.R. Tolkien")
                .publishedOn("16/11/2021")
                .currentlyAvailableNumber(1)
                .build();
        List<BookResponse> response = List.of(sandman, lotr);

        return response;
    }
}
```
To make our class the controller bean we need to annotate it with the `@RestController` or with the `@Controller`. The difference between these two is that the `@RestController` automatically wraps return object into the `ResponseEntity<>`. 

We went with the `@RestController` because it is easier to follow the code without transformation code.

The `@RequestMapping("/books")` annotation maps our bean to this path. If we start this code locally we can access this enpoint on the `http://localhost:8080/books`. 

We annotated the `fetchAllBooks()` method with the `@GetMapping` annotation to define that this is the GET method. Since we didn't define additional path on the `@GetMapping` annotation we are using the path from the `@RequestMapping` definitions.

## Creating a Endpoint With the @Controller
Instead with the `@RestController` we can define our controller bean with the `@Controller` annotation:
```java
@Controller
@RequestMapping("/controllerBooks")
public class BooksController {

    @GetMapping
    ResponseEntity<List<BookResponse>> fetchAllBooks(){
        BookResponse sandman = BookResponse.builder()
                .title("The Sandman Vol. 1: Preludes & Nocturnes")
                .author("Neil Gaiman")
                .publishedOn("19/10/2010")
                .currentlyAvailableNumber(4)
                .build();
        BookResponse lotr = BookResponse.builder()
                .title("The Lord Of The Rings Illustrated Edition")
                .author("J.R.R. Tolkien")
                .publishedOn("16/11/2021")
                .currentlyAvailableNumber(1)
                .build();
        List<BookResponse> response = List.of(sandman, lotr);

        return ResponseEntity.ok(response);
    }
}
```
When using the `@Controller` annotation we need to make sure that we wrap our result in the `ResponseEntity<>` class.

This approach gives us more freedom when returning objects. Let us imagine we are rewriting some legacy backend code to the Spring Boot project. One of requirements was that the current frontend applications work as they should. Previous code always returned the 200 code but the body would differ if some error occured. In those kind of scenarios we can use the `@Controller` annotation and control what is returned to the user.

## Calling the Endpoint
After we build our first enpoint we want to test it and see what do we get as the result. Since we don't have any frontend we can use command line tools or the [Postman](#https://www.postman.com/). 
If we are using the command line tools like cURL we can call the endpoint as follows:

`curl --location --request GET 'http://localhost:8080/books'`

The result the we got was:
```json
[
    {
        "title": "The Sandman Vol. 1: Preludes & Nocturnes",
        "author": "Neil Gaiman",
        "publishedOn": "19/10/2010",
        "currentlyAvailableNumber": 4
    },
    {
        "title": "The Lord Of The Rings Illustrated Edition",
        "author": "J.R.R. Tolkien",
        "publishedOn": "16/11/2021",
        "currentlyAvailableNumber": 1
    }
]
```
## Creating a POST Endpoint

After we built our first endpoint let us call this endpoint and look into the result.
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