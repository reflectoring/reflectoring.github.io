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

In this article, we'll look at what is component scanning and how to use it. We'll be using the Spring Boot application for all our examples throughout this article.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-kafka" %}

## What is Component Scanning?

As we know Spring does dependency injection with the inversion of control principle. To achieve dependency injection Spring must know where components are present in the application and create a bean for them, so it can inject them wherever required. This process of searching for components that help in creating beans is called Component Scanning.

## Stereotype Annotations

Classes annotated with stereotypes are considered as candidates for auto-detection when using annotation-based configuration and classpath component scanning. Spring components are mainly made of four types:

### 1. `@Component`

This is a generic stereotype annotation used to create and indicates that the class is a Spring-managed component. Other stereotypes are the specialization of `@Component`.

### 2. `@Controller`

This indicates that the annotated class is a Spring-managed controller which is used with annotated handler methods based on `@RequestMapping`. And Spring 4.0 introduced `@RestController` which combines both `@Controller` and `@ResponseBody` and makes it easy to create RESTful services.

### 3. `@Service`

We can use the `@Service` stereotype for classes that contains the business logic or the classes which come in the service layer.

### 4. `@Respository`

We can use the `@Repository` stereotype for DAO classes which are responsible for providing CRUD operations on entities. If we are using Spring Data for managing database operations, then we should use the Spring Data Repository interface.

## When to Use Component Scanning

Spring provides a mechanism to identify managed components explicitly through `@ComponentScan` annotation, we'll look into various properties which we can use in further sections.

For a normal Spring application, we can tell Spring to perform a component scan by explicitly specifying in XML configuration or Java Configuration.

If the application is a Spring Boot application, then all the packages under the parent package will be covered by an implicit component scan. Spring Boot's `@SpringBootApplication` annotation is comprised of `@Configuration`, `@ComponentScan`, and `@EnableAutoConfiguration` annotations. As we mentioned it includes `@ComponentScan`, which will scans for the components in the current package and all its sub-packages. So if your application doesn't have a varying package structure then there is no need for explicit component scanning.

**Specifying `@Configuration` in the default package will tell Spring to scan all the classes in all the jars in the classpath.**

## How to Use `@ComponentScan`

`@ComponentScan` along with `@Configuration` annotation is used to tell Spring to scan classes that are annotated with stereotype annotation. The `@ComponentScan` annotation provides different attributes that we can modify to get desired scanning behavior.

```java
@Component
public class BeanViewer {

  private final Logger LOG = LoggerFactory.getLogger(getClass());

  @EventListener
  public void showBeansRegistered(ApplicationReadyEvent event) {
    String[] beanNames = event.getApplicationContext().getBeanDefinitionNames();
      for(String beanName: beanNames) {
        LOG.info("{}", beanName);
    }
  }
}
```

We'll be using `ApplicationContext`'s `getBeanDefinitionNames()` method throughout this article to check out the list of beans created under the application context.

The above `BeanViewer` will print all the beans that are registered with the application context. This will help us to check whether our components are loaded properly or not.

### Spring Boot's Implicit Auto Scanning

As said earlier, Spring Boot does auto scanning for all the packages that fall under the parent package. Let's have a look at how it works:

```
|- io.reflectoring.componentstan (main package)
   |- SpringComponentScanningApplication.java
   |- User.java (@Component stereotype)
   |- BeanViewer.java
   |- ExplicitScan.java
```

We have created a `User` class with the `@Component` stereotype in our parent package `io.reflectoring.componentscan`. As said earlier, since these classes come under the parent package where we have our main method defined with `@SpringBootApplication` annotation, the component will be scanned by default.

```
OUTPUT
...
INFO 95832 --- [main] i.reflectoring.componentscan.BeanViewer  : beanViewer
INFO 95832 --- [main] i.reflectoring.componentscan.BeanViewer  : explicitScan
INFO 95832 --- [main] i.reflectoring.componentscan.BeanViewer  : users
...
```

The above output shows the bean created for `BeanViewer`, `ExplicitScan`, and `Users` and printed by our `BeanViewer`. Since all these classes come under our parent package `io.reflectoring.componentscan` these are auto scanned by Spring.

### Using `@ComponentScan` without any attributes

If we have a package that does not come under our parent package, we can use `@ComponentScan` along with `@Configuration`. This will tell Spring to scan the components in the package where this `@Configuration` class is present and its sub-packages.

```java
package io.reflectoring.birds;

@Configuration
@ComponentScan
public class BirdsExplicitScan {
}
```

```java
@SpringBootApplication
@Import(value= {BirdsExplicitScan.class})
public class SpringComponentScanningApplication {
  public static void main(String[] args) {
    SpringApplication.run(SpringComponentScanningApplication.class, args);
  }
}
```

```
|- io.reflectoring.componentstan
   |- SpringComponentScanningApplication.java
|- io.reflectoring.birds
   |- BirdsExplicitScan.java
   |- Eagle.java (@Component stereotype)
   |- Sparrow.java (@Component stereotype)
```

We have created the `BirdsExplicitScan` class with the `@ComponentScan` annotation in the `io.reflectoring.birds` package, which tells spring to scan the `io.reflectoring.birds` package and its sub-packages. For Spring to know about this `BirdsExplicitScan` configuration class, we'll add this configuration to `@Import` in our `SpringComponentScanningApplication`.

```
OUTPUT
...
INFO 95832 --- [main] i.reflectoring.componentscan.BeanViewer  : beanViewer
INFO 95832 --- [main] i.reflectoring.componentscan.BeanViewer  : explicitScan
INFO 95832 --- [main] i.reflectoring.componentscan.BeanViewer  : users
INFO 84644 --- [main] i.reflectoring.componentscan.BeanViewer  : eagle
INFO 84644 --- [main] i.reflectoring.componentscan.BeanViewer  : sparrow
...
```

As we can see in the above output, beans got created for `Eagle` & `Sparrow` classes.

### Using `@ComponentScan` with attributes

Let's have a look at attributes we can modify with `@ComponentScan`:

- **`basePackages`**: Takes a list of package names which has to be scanned for components.
- **`basePackageClasses`**: Takes a list of classes whose packages have to be scanned.
- **`includeFilters`**: Enables us to specify what type of components has to be scanned.
- **`excludeFilters`**: This is opposite of `includeFilters`. We can specify conditions to ignore some of the components based on criteria while scanning.
- **`useDefaultFilters`**: If true, it enables the automatic detection of classes annotated with any stereotypes. If false, the components which fall under filter criteria will be included.

### `@ComponentScan` for Discrete Packages

Let's see how we can scan a package which is not under our parent package with `basePackages` attribute:

```
|- io.reflectoring.componentstan (Main Package)
   |- ExplicitScan.java
|- io.reflectoring.birds
|- io.reflectoring.vehicles
   |- Car.java
   |- Hyundai.java (@Component stereotype and extends Car)
   |- Tesla.java (@Component stereotype and extends Car)
   |- SpaceX.java (@Service stereotype)
   |- Train.java (@Service stereotype)
```

To demonstrate, we have created the `io.reflectoring.vehicles` package which is not a sub package of our parent package `io.reflectoring.componentscan`. Also, we have created some classes under this package as shown in the above package tree.

```java
package io.reflectoring.componentscan;

@Configuration
@ComponentScan(basePackages= "io.reflectoring.vehicles")
public class ExplicitScan {
}
```

We have created an `ExplicitScan` class with `@Configuration` and `@ComponentScan` annotation. Also saying Spring to include `io.reflectoring.vehicles` for component scanning by specifying the package name in `basePackages` attribute.

```
OUTPUT
...
INFO 65476 --- [main] i.reflectoring.componentscan.BeanViewer  : hyundai
INFO 65476 --- [main] i.reflectoring.componentscan.BeanViewer  : spaceX
INFO 65476 --- [main] i.reflectoring.componentscan.BeanViewer  : tesla
INFO 65476 --- [main] i.reflectoring.componentscan.BeanViewer  : train
...
```

### `@ComponentScan` with Filters

Spring provides the `FilterType` enum for the type filters that can be used with `@ComponentScan`. Below are a list of available `FilterType`s which can be used with `includeFilters` or `excludeFilters`:

- `ANNOTATION`: Filter classes with specific stereotype annotation.
- `ASPECTJ`: Filter using an AspectJ type pattern expression
- `ASSIGNABLE_TYPE`: Filter classes that extend or implement this class or interface.
- `REGEX`: Filter classes using a regular expression for package names.

#### Now let's have a look at `includeFilters`:

With the combination of `includeFilters` and `FilterType`, we can tell Spring to include classes that follow filter criteria.

```java
@Configuration
@ComponentScan(basePackages= "io.reflectoring.vehicles",
includeFilters=@ComponentScan.Filter(type=FilterType.ASSIGNABLE_TYPE, classes=Car.class), useDefaultFilters=false)
public class ExplicitScan {
}
```

In the above example, we have modified our `ExplicitScan` class with `includeFilters` to include components that extend `Car.class` and we are changing `useDefaultFilters = false`.

```
OUTPUT
INFO 68628 --- [main] i.reflectoring.componentscan.BeanViewer  : hyundai
INFO 68628 --- [main] i.reflectoring.componentscan.BeanViewer  : tesla
```

Now we have only `Hyundai` and `Tesla` beans getting created which extends `Car.class` as shown in the above output.

#### Now let's have a look at `excludeFilters`:

Similar to `includeFilters`, we can use `FilterType` with `excludeFilters` to exclude classes from getting scanned based on matching criteria.

```java
@Configuration
@ComponentScan(basePackages= "io.reflectoring.vehicles",
excludeFilters=@ComponentScan.Filter(type=FilterType.ASSIGNABLE_TYPE, classes=Car.class))
public class ExplicitScan {
}
```

In the above example, we have modified our `ExplicitScan` with `excludeFilters` and telling Spring to exclude classes which extend `Car` from component scanning.

```
OUTPUT
...
INFO 97832 --- [main] i.reflectoring.componentscan.BeanViewer  : spaceX
INFO 97832 --- [main] i.reflectoring.componentscan.BeanViewer  : train
...
```

As we can see in the above output, only `SpaceX` and `Train` beans were created. But `Hyundai` and `Tesla` beans got excluded as they were extending the `Car` class.

## Conclusion

In this article, we've seen about Spring component stereotypes, what is component scanning and how to use component scanning, and its various attributes which we can modify to get the desired scanning behavior.
