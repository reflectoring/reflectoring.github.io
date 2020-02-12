---
title: "The Lifecycle of Spring Beans"
categories: [spring-boot]
modified: 2020-01-16
excerpt: "Spring Bean Creation and hooking into Spring Bean Life Cycle"
image:
  auto: 0012-pages

---

## What are Spring Beans?
 > Spring Beans are Java Objects or Instances which will be created and managed by Spring [IOC/DI](https://docs.spring.io/spring/docs/3.2.x/spring-framework-reference/html/beans.html#beans) container.

Spring will take over the control of a bean life cycle using `ApplicationContext` or `BeanFactory` interfaces.

`ApplicationContext` is a extension of `BeanFactory` interface, Which is providing more useful [futures](https://docs.spring.io/spring/docs/3.2.x/spring-framework-reference/html/beans.html#beans-beanfactory) over `BeanFactory` interface.

Below, We have asked Spring to take over the control of `Foo` class bean life cycle using `@Component` annotation.

```java
@Component
Class Foo { //variables and methods ...}
```
## The Spring Bean Lifecycle
Let us look at the Spring Bean creation and destroy life cycle steps.  

**1. Bean Definition**  
Spring Bean will be defined using stereotype annotations or XML Bean configurations.

**2. Bean Creation and Instantiate**  
As soon as bean created and It will be instantiated and loaded into `ApplicationContext` and `JVM` memory.

**3. Populating Bean properties**  
Spring container will create a bean `id`, `scope`, `default values` based on the bean definition.

**4. Post-initialization**  
Spring provides [Aware](https://docs.spring.io/spring/docs/3.0.6.RELEASE_to_3.1.0.BUILD-SNAPSHOT/3.1.0.BUILD-SNAPSHOT/org/springframework/beans/factory/Aware.html) interfaces to access application bean meta-data details and callback methods to hook into bean life cycle to execute custom application-specific logic. 

**5. Ready to Serve**  
Now, Bean is created and injected all the dependencies and should be executed all the [Aware](https://docs.spring.io/spring/docs/3.0.6.RELEASE_to_3.1.0.BUILD-SNAPSHOT/3.1.0.BUILD-SNAPSHOT/org/springframework/beans/factory/Aware.html) and callback methods implementation. 
Bean is ready to serve.  

**6. Pre-destroy**  
Spring provides callback methods to execute custom application-specific logic and clean-ups before destroying a bean from `ApplicationContext`.

**7. Bean Destroyed**  
Bean will be removed or destroyed from `ApplicationContext` and `JVM` memory.

## Hooking into the Bean Lifecycle
  Let us look at the 5 different ways of tapping into the spring bean life cycle.
## Using Spring Aware Interfaces
Foo class implements `BeanNameAware` interface  `setBeanName()` method will provide the bean name created by spring container.  

```java
@Component
class Foo implements BeanNameAware {
    @Override
    public void setBeanName(String name) {
        System.out.println("Spring Set Bean Name Method Call");
    }
}
```

Foo class implements `BeanClassLoaderAware` interface `setBeanClassLoder()` method will notify the application, class is loaded into current bean factory.  
```java
@Component
class Foo implements BeanClassLoaderAware {
    @Override
    public void setBeanClassLoader(ClassLoader beanClassLoader) {
        System.out.println("Spring Set Bean Class Loader Method Call");
    }
}
```

Foo class implements `BeanFactoryAware` interface `setBeanFactory()` method will provide the bean type and dependencies.   

```java
@Component
class Foo implements BeanFactoryAware {
    @Override
    public void setBeanFactory(BeanFactory beanFactory) {
        System.out.println("Spring Set Bean Factory Method Call");
    }
}
```

Foo class implements `ApplicationContextAware` inerface `setApplicationContextAware()` method will provide the application Name, Environment and the total number of beans created in the application, etc.... 

```java
@Component
class Foo implements ApplicationContextAware {
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        System.out.println("Spring Set Application Context Method Call");
    }
}
```
## Using Spring @PostConstruct and @PreDestroy annotations
The Foo class postConstructMethod() method annotated by `@PostConstruct` will be called after [Aware](https://docs.spring.io/spring/docs/3.0.6.RELEASE_to_3.1.0.BUILD-SNAPSHOT/3.1.0.BUILD-SNAPSHOT/org/springframework/beans/factory/Aware.html) interfaces implementations executes.

The Foo class preDestroy() method annotated by `@PreDestroy` will be executed at the time of bean destroy.  
```java
@Component
class Foo {
    @PostConstruct
    public void postConstructMethod() {
        System.out.println("Spring Bean Post Construct Annotation Method ");
    }

    @PreDestroy
    public void preDestroy() {
        System.out.println("Spring Bean Pre Destroy Annotation Method");
    }
}
```
## Using Spring InitializingBean and DisposableBean Interfaces
Foo class implements `InitializingBean` inerface `afterPropertiesSet()` method will be called after populating bean properties.  

Foo class implements `DisposableBean` interface `destroy()` method will be called at the time of bean destroy. 
```java
@Component
public class Foo implements InitializingBean, DisposableBean {

    @Override
    public void afterPropertiesSet() {
        System.out.println("Spring Bean Post Contract After Properties Set Method ");
    }

    @Override
    public void destroy() {
        System.out.println("Spring Disposable Bean Destroy Method ");
    }
}
```

## Using @Bean annotation and Attributes
```java
@Component
public class Foo {

    public void init() {
        System.out.println("Spring @Bean Initialization Method Call");
    }

    public void destroy() {
        System.out.println("Spring @Bean Destroy Method");
    }
}
```
The Config class getFooInstance() method annotated by `@Bean` and specified init() method inside `initMethod` attribute  will be called at the time of bean creation.  

The Config class getFooInstance() method annotated by `@Bean` and specified destroy() method inside `destroyMethod` attribute will be called at the time of bean destroy.  
```java
@Configuration
public class Config {

    @Bean(initMethod = "init", destroyMethod = "destroy")
    public Foo getFooInstance() {
        return new Foo();

    }
}
```

## Using XML configuration(Bean Tag)
modern-day spring applications are not using the traditional XML Bean configurations. For more information refer Spring reference manual for bean [Creation](https://docs.spring.io/spring/docs/3.2.x/spring-framework-reference/html/beans.html#beans-factory-lifecycle-initializingbean) and [Destruction](https://docs.spring.io/spring/docs/3.2.x/spring-framework-reference/html/beans.html#beans-factory-lifecycle-disposablebean) callback methods.

## Why Would I Need to Hook into the Bean Lifecycle?
  Below are some of the use cases.
  + Assigning `Default values` for bean properties (ex: FILE PATH, MIN_VALUE, and MAX_VALUE) while creating bean.
  + Opening and Closing the `Files` and `Database` connections as part of the bean creation and destruction.   
  + Loading application `Metadata` (ex: US state code values) information while creating a bean and clean up on bean destruction.  
  + Starting and Terminating a `Process` or `Thread` as part of the bean creation and destruction.  
  + To make sure application dependency (ex: `Remote Database` and `External Services` etc...) modules are up and running while creating bean.

## How It Works

Let's consider an example of `Default values` and `Files` opening and closing while creating and destroying a bean with Movie Rental.

MovieRental class is used to check out the movies from NetFlix for rental. Every user will have a file with name as a file name. It records moive Name, Date and Time for each rental.

```java

import org.springframework.beans.factory.annotation.Value;

import java.io.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class MovieRental {

    @Value("MovieRentalUser1")
    private String name;
    @Value("c:/MovieRental")
    private String filePath;
    private BufferedWriter bufferedWriter;

    public void openMovieRentalFile() throws IOException {
        File file = new File(filePath, name + ".txt");
        bufferedWriter = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(file, true)));
    }

    public void movieCheckout(List<String> movieList, BufferedWriter bufferedWriter) throws IOException {
        bufferedWriter.write(movieList.stream().collect(Collectors.joining(",")) + " , " + LocalDateTime.now());
    }

    public void closeMovieRentalFile() throws IOException {
        bufferedWriter.close();
    }

}

```
```java
    MovieRental movieRental = new MovieRental();
    movieRental.movieCheckout(movieList, bufferedWriter);
```
Now, If we create a bean using constructor like above will result in `NullPointerException`.  
The reason is we are not assigned any values for name, filepath and also trying to write before opening the file.    

Let us see how we can avoid `NullPointerException` applying tapping options explained in previous sections.  

Annotating openMovieRentalFile() with `@PostConstruct` will be called during MovieRental bean creation.  

Annotating closeMovieRentalFile() with `@PreDestroy` will be called during MovieRental bean destroy.  

```java
    @PostConstruct
    public void openMovieRentalFile() throws IOException {    }

    @PreDestroy
    public void closeMovieRentalFile() throws IOException {    }
```

Calling openMovieRentalFile() and closeMovieRentalFile() methods inside `afterPropertiesSet()` and `destroy()` callback methods. 

```java
    @Override
    public void afterPropertiesSet() throws IOException { openMovieRentalFile(); }

    @Override
    public void destroy() throws IOException { closeMovieRentalFile(); }
```

Setting `@Baen` `initMethod` attribute value as openMovieRentalFile and `destroyMethod` attribute value as closeMovieRentalFile.    

```java
    @Bean(initMethod = "openMovieRentalFile", destroyMethod = "closeMovieRentalFile")
    public MovieRental getMovieRentalInstance() {
        return new MovieRental();

    }
```

Example code [github repository](https://github.com/NRamasamy82/springbeanlifecycle.git).

## Conclusion
It is always good vs bad practice debts about tapping into spring container internals.

Best Practise standpoint  [Spring Document](https://docs.spring.io/spring/docs/3.2.x/spring-framework-reference/html/beans.html#beans-factory-lifecycle) preference is to use `JSR-250 @PostConstruct` and `@PreDestroy` annotations and then `@Bean` `init-method` and `destroy-method` tapping options.

[Spring Document](https://docs.spring.io/spring/docs/3.2.x/spring-framework-reference/html/beans.html#beans-factory-lifecycle) specifically suggesting not to use and tied with Spring specific `InitializingBean` and `DisposableBean` interfaces.

Spring bean life cycle callback methods are alternates for `Constructor` based bean setters to avoid bean dependencies and `NullPointerException` issues.
