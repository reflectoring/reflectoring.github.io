---
authors: [tom]
title: "Spring Boot Basics"
categories: ["Spring"]
date: 2023-12-04 00:00:00 +1100
excerpt: "Everything you need to know to get started with the Spring Boot Framework."
image: images/stock/0027-cover-1200x628-branded.jpg
url: spring-boot-basics
---


Spring Boot builds on top of the [Spring Framework](/spring-basics) and provides a wealth of additional features and integrations. To simplify somewhat, one could say that the Spring Framework focuses on functions related to the application context, while Spring Boot provides functions that are needed in many applications running in production or that simplify developer life. In this chapter, we will provide an overview of the core functions of Spring Boot, which we will examine in more detail in later chapters.

## Bootstrapping

The name "Spring Boot" comes from the core functionality of Spring Boot: bootstrapping. In this case, bootstrapping refers to the process of transforming a pile of source code into an application and making it accessible to users.

In the previous chapter, we already saw how we can create and start an application context using Spring (without Spring Boot). But how do we turn this `ApplicationContext` into a complete application? This is where Spring Boot enters the stage.

Instead of manually creating an `ApplicationContext`, we let Spring Boot do this for us. We simply provide a `main` method that is declared as a Spring Boot application:

```java
@SpringBootApplication  
public class SpringBootBasicsApplication {  
    public static void main(String[] args) {  
        SpringApplication.run(SpringBootBasicsApplication.class, args);  
    }  
}
```


In the `main()` method, we call the static method `SpringApplication.run()` and pass in a class annotated with `@SpringBootApplication`. Typically, this is the same class that also contains the `main()` method, as shown in the example above.

To have access to the classes `@SpringBootApplication` and `SpringApplication`, we need to declare the `org.springframework.boot:spring-boot-starter` module as a dependency in our `pom.xml` or `build.gradle` file.

Once we start the `main()` method (for example from our IDE), we will see the following log output:

```txt
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.0.1)

2023-07-03T11:48:41.624+10:00  INFO 44185 --- [           main]
d.s.s.SpringBootBasicsApplication        : 
Starting SpringBootBasicsApplication using Java 18 with PID 44185 

2023-07-03T11:48:41.629+10:00  INFO 44185 --- [           main] 
d.s.s.SpringBootBasicsApplication        : 
No active profile set, falling back to 1 default profile: "default"

2023-07-03T11:48:42.482+10:00  INFO 44185 --- [           main] 
d.s.s.SpringBootBasicsApplication        : 
Started SpringBootBasicsApplication in 1.288 seconds (process running for 1.87)

Process finished with exit code 0

```

This log excerpt already shows us some interesting things:

- We're using Spring Boot version 3.0.1.
- We're using Java 18.
- Spring Boot starts in the `default` profile because we haven't defined a specific profile. This means that Spring Boot supports the concept of "profiles"! We will learn what exactly a profile is and how to use it in chapter [[22 - Konfiguration]].
- It took 1.288 seconds to start the Spring Boot application.
- Spring Boot has configured logging for us, so our log outputs are formatted with dates, log levels, process ID, thread names, etc.

So, Spring Boot has already done quite a bit of "bootstrapping" to help us start and configure an application, and we'll learn many more things that Spring Boot can do for us throughout the rest of the book.

However, after the log output from above, our example application exits directly without having done anything and returns an exit code of `0` to the command line, indicating a successful application termination. This isn't very helpful, so let's look at some more Spring Boot features that can help us build a real application.

## Influencing the ApplicationContext

In the "Spring Basics" chapter, we already saw how to influence an ApplicationContext. Just like in a Spring application, the ApplicationContext is the heart of a Spring Boot application, and we can influence it just as we're accustomed to from Spring (with some extras that we'll learn in the "Extending Spring Boot" chapter).

If we look at the source code of the `@SpringBootApplication` annotation, we see the following:

```java
@Target(ElementType.TYPE)  
@Retention(RetentionPolicy.RUNTIME)  
@Documented  
@Inherited  
@SpringBootConfiguration  
@EnableAutoConfiguration  
@ComponentScan(excludeFilters = { @Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),  
      @Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class) })  
public @interface SpringBootApplication {
  ...
}
```

We recognize the `@ComponentScan` annotation from the chapter on [[Spring Basics]]! Let's continue to look at the source code of the `@SpringBootConfiguration` annotation:

```java
@Target(ElementType.TYPE)  
@Retention(RetentionPolicy.RUNTIME)  
@Documented  
@Configuration  
@Indexed  
public @interface SpringBootConfiguration {
  ...
}
```

Here, we see the `@Configuration` annotation again!

Annotations on annotations are called meta-annotations. When Spring examines class annotations, the framework is smart enough to also evaluate meta-annotations (and meta-meta-annotations, and so on). For us, this means that our main class `SpringBootBasicsApplication` is annotated with both the `@ComponentScan` and `@Configuration` (meta-)annotations.

Since our main class is annotated with `@ComponentScan`, Spring automatically evaluates all `@Component` and `@Configuration` annotations in the class's package and all packages below it, instantiates objects of the annotated classes, and adds them to the ApplicationContext, as described in the [[Spring Basics]] chapter.

Furthermore, Spring treats our main class as a `@Configuration` class, so we can directly add `@Bean`-annotated factory methods here if we want to.

To implement a "Hello World," we could extend our application as follows:

```java
@SpringBootApplication  
public class SpringBootBasicsApplication {  
    public static void main(String[] args) {  
        SpringApplication.run(SpringBootBasicsApplication.class, args);  
    }  
  
    @Bean  
    public HelloBean helloBean() {  
        return new HelloBean();  
    }  
  
    static class HelloBean {  
        public HelloBean() {  
            System.out.println("Hello!");  
        }  
    }  
}
```

We create a bean of type `HelloBean`, which outputs a message in its constructor. If we start the application again, we'll see this log output before the application stops.

So far, we've seen how we can use Spring Boot to develop an application that performs a single action (in our case, printing "Hello!" to the command line). In Chapter XX, we will see how we can use this to develop full-fledged command-line programs.

However, many applications we develop nowadays are web applications and not command-line programs, so our next focus will be on Spring Boot's embedded web server features.

## Embedded Web Server

Traditionally, Java-based web applications were deployed on application servers like Tomcat or JBoss. The application was packaged as a WAR (Web Archive) file and copied to the server, which then unpacked the archive, read some metadata from descriptor XML files, and forwarded the users' HTTP requests to the endpoints defined by the application.

Spring Boot has turned the traditional deployment of web applications on its head. Instead of creating a WAR file and copying it to a server, with Spring Boot, we create a "runnable" JAR file (also known as a "fat JAR" or "uber JAR") by default. This JAR file contains our application code, all dependencies, and an embedded web server. When we start this JAR file with the command `java -jar app.jar`, Spring Boot automatically starts the web server, which then listens for HTTP requests and forwards them to our application.

To develop a web application, we simply need to add the `org.springframework.boot:spring-boot-starter-web` module as a dependency in our `pom.xml` or `build.gradle` file.

When we start the application, we'll see the following log output in addition to the previous log outputs:

```txt
...

2023-07-05T09:55:58.253+10:00  INFO 87686 --- [           main] 
o.s.b.w.embedded.tomcat.TomcatWebServer  : 
Tomcat started on port(s): 8080 (http) with context path ''
```

Spring Boot has automatically started a Tomcat server that listens on port 8080 to receive HTTP requests. Our application no longer stops immediately after starting; it now waits for HTTP requests until it's terminated (or crashes). It now acts as now a fully functional web server!

The embedded web server simplifies the deployment of a Spring Boot application. For instance, we can package the JAR file into a Docker image and start it using the `java -jar app.jar` command within the Docker container. With the profile concept we've already seen in the log output, Spring Boot also makes it easy to configure the application for different environments (development, staging, production, etc.). To do this, we only need to include a file like `application-<profile>.yml` in the JAR file (or place it next to the JAR file) and activate the profile. We will learn about this in detail in chapter [[22 - Konfiguration]].

## Dependency Management

Another core feature of Spring Boot is dependency management.

In our application, we often don't want to reinvent the wheel, so we use a large number of libraries defined as dependencies in our `pom.xml` or `build.gradle` file. Each of these libraries exists in versions that are compatible with our code (and other libraries), and often in versions that are outdated (or too new) and not compatible with our application. We need to manage the versions of all our dependencies to ensure they remain compatible with each other.

Spring Boot addresses this. It provides us with a "Bill of Materials" (BOM) that defines a set of libraries and their versions, ensuring they are always compatible with each other and the current Spring Boot version. This BOM doesn't list _all_ libraries out there, but it covers all the libraries needed by Spring Boot itself or by its official integrations with other products (such as databases).

To use the Spring Boot BOM, we simply need to import the `org.springframework.boot:spring-boot-dependencies` dependency in the same version as Spring Boot into our `pom.xml` or `build.gradle` file. If we use the Spring Boot plugin for Maven or Gradle, the plugin does this automatically for us. When declaring a dependency on a library, we can omit the version, and it will be automatically loaded in the version defined in the Spring Boot BOM. We will delve into the details of the Maven and Gradle plugins for Spring Boot in the "Build Management" chapter.

### Integrations

Spring Boot comes with several integrations for commonly used libraries, making configuration easier without requiring us to write the integration code ourselves.

One example is database integration. For instance, if we add the dependency `org.postgresql:postgresql` to our `pom.xml` or `build.gradle` file (without specifying a version, as Spring Boot's dependency management automatically uses the latest compatible version), Spring Boot recognizes the PostgreSQL driver in the classpath. It then automatically provides a `DataSource` object to the `ApplicationContext`, which we can use to access the database. We just need to provide Spring Boot with the database's URL, username, and password by adding configuration parameters in the `application.yml` file.

The `DataSource` object provided by Spring Boot can be used directly, but it's also used by other integrations. For instance, if we add a dependency to Spring Data JPA or Spring Data JDBC, Spring Boot detects this and provides these integrations with the `DataSource`. In this case, we don't need to use the `DataSource` directly; we can use Spring Data's abstractions to access the database, making our life much simpler.

This database integration example follows a typical pattern for Spring Boot integrations. Spring Boot detects a dependency on the classpath and automatically configures some beans in the `ApplicationContext` that can be used by us (or by other integrations). If the integration requires additional configuration parameters, we can provide them in the `application.yml` file. If we need to further customize the beans provided by the integration, we can "override" the beans in the `ApplicationContext` by defining them ourselves as `@Bean` or `@Component`.

The database integration is so commonly needed in applications that Spring Boot includes it at its core. Other integrations (like with a cache or messaging system) are not required in every application, so we need to activate them with so-called "starters." For example, if we want to use a Redis cache in our application, we need to add the `org.springframework.boot:spring-boot-starter-data-redis` dependency, which activates the integration with Redis. A "starter" is a small library that simplifies starting with a specific feature or integration. We'll explore starters in more detail in the "Extending Spring Boot" chapter.

### Production Features

In addition to bootstrapping and the embedded web server, Spring Boot offers features that significantly facilitate running an application in production.

One of the most important production features is logging. We've already seen the automatic configuration of log outputs, where dates and thread names appear in each log line, making debugging easier. Spring Boot relies on the de facto standard SLF4J for this, so we only need to define a `Logger` and use it for log outputs. We'll explore logging in more detail in the Logging chapter.

We've also seen the profile feature. We can define configuration parameters that have their own values for each profile. When starting the application, we can specify which profiles (and thus which configuration values) should be active. This allows us to run the same application in different environments, only needing to adjust the configuration for each environment. This feature is essential in modern software development, as it prevents a whole class of environment-specific bugs. We'll cover profiles and configuration parameters in the [[22 - Konfiguration]] chapter.

With the "actuator" module, Spring Boot also provides insights into a running application. Once we add this module as a dependency, various metrics such as memory and processing capacity are exposed through the `/actuator` endpoint. These metrics can then be queried by observability tools and made available in dashboards, providing constant observability into the production environment.

This was just a glimpse of the features that Spring Boot offers. Spring Boot provides numerous other features that make application development and operation easier, which we'll cover in the rest of this book.

