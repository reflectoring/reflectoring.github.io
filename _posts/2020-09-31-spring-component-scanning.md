---
title: Spring Component Scanning
categories: [spring-boot]
date: 2020-07-22 05:00:00 +1100
modified: 2020-07-22 05:00:00 +1100
author: nandan
excerpt: 'How to use Spring Kafka to send messages to and receive messages from Kafka.'
image:
  auto: 0075-envelopes
---

In this article, we'll look at how to integrate a Spring Boot application with Apache Kafka and start sending and consuming messages from our application. We'll be going through each section with code examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-kafka" %}

## What is Component Scanning?

As we know Spring does dependecy injection with Inversion of Control principle. To achieve dependency injection Spring must know where components are present in the application and create bean for them, so it can inject them whereever required. This process of searching for components which helps in creating beans is called Component Scanning.

## Stereotype Annotations

Classes annotated with stereotype are considered as candidates for auto-detection when using annotation-based configuration and classpath component scanning. Spring components are mainly made of four types:

### 1. `@Component`

This is a generic stereotype annotation used to create and indicates that the class is a Spring managed component. Other stereotypes are basically the specialization of `@Component`.

### 2. `@Controller`

This indicates that the annotated class is a Spring managed controller which is used with annotated handler methods based on `@RequestMapping`. Spring 4.0 introduced `@RestController` which combines both `@Controller` and `@ResponseBody` and makes it easy to create RESTful services.

### 3. `@Service`

We can use `@Service` sterotype for classes which contains the business logic or the classes which comes in service layer.

### 4. `@Respository`

We can use `@Repository` sterotype for DAO classes which are responsible for providing CRUD operations on entities. If we are using Spring Data for managing database operations, then we should use Spring Data Repository interface.

## When to Use Component Scanning

Spring provides a mechanism to indentify managed components explicitly through `@ComponentScan` annotation, we'll look into various properties which we can use in further sections.

For a normal Spring application, we can tell Spring to perform component scan by explicitly specifying in XML configuration or Java Configuration.

If application is a Spring Boot application, then all the packages under parent package will be covered by implicit component scan. Spring Boot's `@SpringBootApplication` annotation is a compraises of `@Configuration`, `@ComponentScan`, and `@EnableAutoConfiguration` annotations. As we mentioned it includes `@ComponentScan`, which will scans for the componenets in the current package and all its sub packages. So if your application doesn't have a varying package structure then there is no need of explicit component scanning.

**Specifying `@Configuration` in default pacakge will tell Spring to scan all the classes in all the jars in the classpath.**

## How to Use `@ComponentScan`

`@ComponentScan` along with `@Configuration` annotation is used to tell Spring to scan all the classes which are annotated with stereotype annotation. `@ComponentScan` annotation provides different attributes which we can modify to get desired scanning behavior.

We'll be using `ApplicationContext`'s `getBeanDefinitionNames()` method through out this article to checkout list of beans created under application context.

example

### Spring Boot's Implicit Auto Scanning

As said earlier Spring Boot does auto scanning for all the packages that fall under parent package. Let's have a look at how it works:

example

### Using `@ComponentScan` without any attributes

If we have a package which doesnot fall under Spring Boot's parent package, we can use `@ComponentScan` along with `@Configuration` without any attributes. This will tell Spring to scan the components in the package where this `@Configuration` class is present and its subpackes.

example

### Using `@ComponentScan` with attributes

Let's now have a look at what all attributes we can modify with `@ComponentScan`.
Below are some of the commonly used attributes of `@ComponentScan`:

- **`basePackages`**: Takes list of package names which has to be scanned for components.
- **`basePackageClasses`**: Takes list of classes whose packages has to be scanned.
- **`includeFilters`**: Enables us to specify what type of components has to be scanned.
- **`excludeFilters`**: This is opposite of `includeFilters`. We can specify conditions to ignore some of the components based on criteria while scanning.
- **`useDefaultFilters`**: If true, it enables the automatic detection of classes annotated with any sterotypes. If false, the components which falls under filter criteria will be included.

#### `@ComponentScan` for Discrete Packages

Let's now see how we can scan a package with is not under our main package with `basePackages` attribute:

example

#### `@ComponentScan` with Filters

Spring provides the `FilterType` enum for the type filters that can be used with `@ComponentScan`. Below are list of available `FilterType`s which can be used with `includeFilters` or `excludeFilters`:

- `ANNOTATION`: Filter classes with specific stereotype annotation.
- `ASPECTJ`: Filter using an AspectJ type pattern expression
- `ASSIGNABLE_TYPE`: Filter classes that extend or implement this class or interface.
- `REGEX`: Filter classes using a regular expression for package names.

Let's use the above filter types with `includeFilters` and `excludeFilters`. Now let's have a look at `includeFilters`:

example

Now let's have a look at `excludeFilters`:

example

## Conclusion
