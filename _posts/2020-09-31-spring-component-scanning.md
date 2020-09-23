---
title: Spring Component Scanning
categories: [spring-boot]
date: 2020-07-22 05:00:00 +1100
modified: 2020-07-22 05:00:00 +1100
author: nandan
excerpt: 'What is Spring Component Scanning and how can we use it to build our application context?'
image:
  auto: 0075-envelopes
---

In this article, we'll look at Spring component scanning and how to use it. We'll be using a Spring Boot application for all our examples throughout this article.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-component-scanning" %}

## What is Component Scanning?

To do dependency injection, Spring creates a so-called application context.

During startup, Spring instantiates objects and adds them to the application context. Objects in the application context are called "Spring beans" or "components".

Spring resolves dependencies between Spring beans and injects Spring beans into other Spring beans' fields or constructors.

**The process of searching the classpath for classes that should contribute to the application context is called component scanning.**

## Stereotype Annotations

If Spring finds a class annotated with one of several annotations, it will consider this class as a candidate for a Spring bean to be added to the application context during component scanning.

Spring components are mainly made up of four types.

### `@Component`

This is a generic stereotype annotation used to create and indicates that the class is a Spring-managed component. Other stereotypes are a specialization of `@Component`.

### `@Controller`

This indicates that the annotated class is a Spring-managed controller which is used with annotated handler methods based on `@RequestMapping`. Spring 4.0 introduced `@RestController` which combines both `@Controller` and `@ResponseBody` and makes it easy to create RESTful services.

### `@Service`

We can use the `@Service` stereotype for classes that contain business logic or classes which come in the service layer.

### `@Repository`

We can use the `@Repository` stereotype for DAO classes which are responsible for providing access to database entities. If we are using Spring Data for managing database operations, then we should use the Spring Data Repository interface instead of building our own `@Repository`-annotated classes.

## When to Use Component Scanning

Spring provides a mechanism to identify Spring bean candidates explicitly through the `@ComponentScan` annotation.

We'll look into various properties which we can use in further sections.

For a normal Spring application, we can tell Spring to perform a component scan by explicitly specifying in XML configuration or Java Configuration.

If the application is a Spring Boot application, then all the packages under the package containing the Spring Boot application class will be covered by an implicit component scan.

Spring Boot's `@SpringBootApplication` annotation implies the `@Configuration`, `@ComponentScan`, and `@EnableAutoConfiguration` annotations.

The `@ComponentScan` annotation will scan for the components in the current package and all its sub-packages. So if your application doesn't have a varying package structure then there is no need for explicit component scanning.

**Specifying `@Configuration` in the default package will tell Spring to scan all the classes in all the jars in the classpath. This is dangerous!**

## How to Use `@ComponentScan`

We use the `@ComponentScan` annotation along with the `@Configuration` annotation to tell Spring to scan classes that are annotated with any stereotype annotation. The `@ComponentScan` annotation provides different attributes that we can modify to get desired scanning behavior.

We'll be using `ApplicationContext`'s `getBeanDefinitionNames()` method throughout this article to check out the list of beans created under the application context:

```java
@Component
class BeanViewer {

  private final Logger LOG = LoggerFactory.getLogger(getClass());

  @EventListener
  public void showBeansRegistered(ApplicationReadyEvent event) {
    String[] beanNames = event.getApplicationContext()
      .getBeanDefinitionNames();

      for(String beanName: beanNames) {
        LOG.info("{}", beanName);
      }
  }
}
```

The above `BeanViewer` will print all the beans that are registered with the application context. This will help us to check whether our components are loaded properly or not.

### Spring Boot's Implicit Auto Scanning

As said earlier, Spring Boot does auto scanning for all the packages that fall under the parent package. Let's have a look at how it works:

```
|- io.reflectoring.componentscan (main package)
   |- SpringComponentScanningApplication.java
   |- UserService.java (@Component stereotype)
   |- BeanViewer.java
   |- ExplicitScan.java
```

We have created a `UserService` class with the `@Service` stereotype in our parent package `io.reflectoring.componentscan`. As said earlier, since these classes are under the parent package where we have our main method defined with `@SpringBootApplication` annotation, the component will be scanned by default.

```
...
INFO 95832 --- [main] i.reflectoring.componentscan.BeanViewer  : beanViewer
INFO 95832 --- [main] i.reflectoring.componentscan.BeanViewer  : explicitScan
INFO 95832 --- [main] i.reflectoring.componentscan.BeanViewer  : users
...
```

The above output shows the bean created for `BeanViewer`, `ExplicitScan`, and `Users` are printed out by our `BeanViewer`.

### Using `@ComponentScan` without any attributes

If we have a package that is not under our parent package, or we're not using Spring Boot at all, we can use `@ComponentScan` along with a `@Configuration` bean.

This will tell Spring to scan the components in the package of this `@Configuration` class and its sub-packages:

```java
package io.reflectoring.birds;

@Configuration
@ComponentScan
public class BirdsExplicitScan {
}
```

The `birds` package is next to the main package of the application, so it's not caught by Spring Boot's default scanning:

```
|- io.reflectoring.componentscan
   |- SpringComponentScanningApplication.java
|- io.reflectoring.birds
   |- BirdsExplicitScan.java
   |- Eagle.java (@Component stereotype)
   |- Sparrow.java (@Component stereotype)
```

If we want to include the `BirdsExplicitScan` into our Spring Boot application, we have to import it:

```java
@SpringBootApplication
@Import(value= {BirdsExplicitScan.class})
public class SpringComponentScanningApplication {
  public static void main(String[] args) {
    SpringApplication.run(SpringComponentScanningApplication.class, args);
  }
}
```

When we start the application, we get the following output:

```
...
INFO 95832 --- [main] i.reflectoring.componentscan.BeanViewer  : beanViewer
INFO 95832 --- [main] i.reflectoring.componentscan.BeanViewer  : explicitScan
INFO 95832 --- [main] i.reflectoring.componentscan.BeanViewer  : users
INFO 84644 --- [main] i.reflectoring.componentscan.BeanViewer  : eagle
INFO 84644 --- [main] i.reflectoring.componentscan.BeanViewer  : sparrow
...
```

As we can see in the above output, beans got created for `Eagle` & `Sparrow` classes.

### Using `@ComponentScan` with Attributes

Let's have a look at attributes we can modify with `@ComponentScan`:

- **`basePackages`**: Takes a list of package names that should be scanned for components.
- **`basePackageClasses`**: Takes a list of classes whose packages should be scanned.
- **`includeFilters`**: Enables us to specify what types of components should be scanned.
- **`excludeFilters`**: This is opposite of `includeFilters`. We can specify conditions to ignore some of the components based on criteria while scanning.
- **`useDefaultFilters`**: If true, it enables the automatic detection of classes annotated with any stereotypes. If false, the components which fall under filter criteria defined by `includeFilters` and `excludeFilters` will be included.

To demonstrate the different attributes, let's add some classes to the package `io.reflectoring.vehicles` (which is _not_ a sub package of our application main package `io.reflectoring.componentscan`):

```
|- io.reflectoring.componentscan (Main Package)
   |- ExplicitScan.java
|- io.reflectoring.birds
|- io.reflectoring.vehicles
   |- Car.java
   |- Hyundai.java (@Component stereotype and extends Car)
   |- Tesla.java (@Component stereotype and extends Car)
   |- SpaceX.java (@Service stereotype)
   |- Train.java (@Service stereotype)
```

Let's see how we can control which classes are loaded during a component scan.

### Scanning a Whole Package with `basePackages`

We'll create the class `ExplicitScan` and add the package `io.reflectoring.vehicles` via the `basePackages` attribute:

```java
package io.reflectoring.componentscan;

@Configuration
@ComponentScan(basePackages= "io.reflectoring.vehicles")
public class ExplicitScan {
}
```

If we run the application, we see that all components in the `vehicles` package are included in the application context:

```
...
INFO 65476 --- [main] i.reflectoring.componentscan.BeanViewer  : hyundai
INFO 65476 --- [main] i.reflectoring.componentscan.BeanViewer  : spaceX
INFO 65476 --- [main] i.reflectoring.componentscan.BeanViewer  : tesla
INFO 65476 --- [main] i.reflectoring.componentscan.BeanViewer  : train
...
```

### Including Components with `includeFilters`

Let's see how we can include only classes that extend the `Car` type for component scanning:

```java
@Configuration
@ComponentScan(basePackages= "io.reflectoring.vehicles",
  includeFilters=
    @ComponentScan.Filter(
      type=FilterType.ASSIGNABLE_TYPE,
      classes=Car.class),
    useDefaultFilters=false)
public class ExplicitScan {
}
```

With a combination of `includeFilters` and `FilterType`, we can tell Spring to include classes that follow specified filter criteria.

We used the filter type `ASSIGNABLE_TYPE` to catch all classes that are assignable to / extend the `Car` class.

Other available filter types are:

- `ANNOTATION`: Match only classes with a specific stereotype annotation.
- `ASPECTJ`: Match classes using an AspectJ type pattern expression
- `ASSIGNABLE_TYPE`: Match classes that extend or implement this class or interface.
- `REGEX`: Match classes using a regular expression for package names.

In the above example, we have modified our `ExplicitScan` class with `includeFilters` to include components that extend `Car.class` and we are changing `useDefaultFilters = false` so that only our specific filters are applied.

Now, only the `Hyundai` and `Tesla` beans are being included in the component scan, because they extend the `Car` class:

```
INFO 68628 --- [main] i.reflectoring.componentscan.BeanViewer  : hyundai
INFO 68628 --- [main] i.reflectoring.componentscan.BeanViewer  : tesla
```

### Excluding Components with `excludeFilters`

Similar to `includeFilters`, we can use `FilterType` with `excludeFilters` to exclude classes from getting scanned based on matching criteria.

Let's modify our `ExplicitScan` with `excludeFilters` and tell Spring to exclude classes which extend `Car` from component scanning.

```java
@Configuration
@ComponentScan(basePackages= "io.reflectoring.vehicles",
  excludeFilters=
    @ComponentScan.Filter(
      type=FilterType.ASSIGNABLE_TYPE,
      classes=Car.class))
public class ExplicitScan {
}
```

Note that we did not set `useDefaultFilters` to false, so that by default, Spring would include all classes in the package.

The output shows that the `Hyundai` and `Tesla` beans we excluded and only the other two classes in the package were included in the scan:

```
...
INFO 97832 --- [main] i.reflectoring.componentscan.BeanViewer  : spaceX
INFO 97832 --- [main] i.reflectoring.componentscan.BeanViewer  : train
...
```

## Conclusion

In this article, we've learned about Spring component stereotypes, what is component scanning and how to use component scanning, and its various attributes which we can modify to get the desired scanning behavior.
