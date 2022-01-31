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

# Our first project

Let us imagine that we got a job at the local bookstore. We need to build them an application that will allow them to keep track of borrowed books. The application is simple, and we started to design it.

We need two types of entities:
- User
- Book

The user can register to the application, see all books and borrow them. The bookstore wants to constraint each user to borrow only three books at one time. 

The book contains information about the author, date of publication, and a number of instances of that book currently available in the store.

After some thinking, the bookstore wanted the system to send automatic notifications about book return overdue.

# Setting up the project

In this chapter, we will show how to generate a new Spring Boot project using IntelliJ IDE and Spring Initializr.
## Generation through IDE

In the IntelliJ IDE we can go to the __File -> New -> Project...__. We will get the next screen:
{{% image alt="Spring Boot initialization through IDE" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-IDE.png" %}}

After defining the project on this screen we can move forward to the next screen:

{{% image alt="Spring Boot initialization through IDE" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-IDE-2.png" %}}

We will, for now, just select the Spring Web dependency. This dependency provides the embedded Tomcat container, and we can go and run our application locally. We won't use much, but we will see a deployed instance of our application running locally.
## Generation through Spring Initializr

On the next (link)[#https://start.spring.io/], we can generate the Spring Boot project:

{{% image alt="Spring Boot initialization online" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-online.png" %}}

Even though the page looks differenct, we need to provide the same information as in the (previous chapter)[#generation-through-ide]. 

After defining all necessary information, we can go and add our dependency. By clicking on the button on the top right corner, we can see the next screen:

{{% image alt="Spring Boot initialization online" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-online-2.png" %}}

We can search the Spring Web dependency and add it to our project. After selecting desired dependencies, we can generate our project by clicking the "Generate" button on the lower-  left corner of the screen. This will download the zip file onto our machine. We need to unpack the    provided file and import it into the IDE.

## What is generated ?
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