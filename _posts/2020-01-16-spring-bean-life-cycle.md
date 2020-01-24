---
title: "The Lifecycle of Spring Beans"
categories: [spring-boot]
modified: 2020-01-16
excerpt: "An in-depth look at the paging support provided by Spring Data for querying
          Spring Web MVC controllers and Spring Data repositories."
image:
  auto: 0012-pages

---

## What are Spring Beans?
 > Spring beans are Java objects created and managed by the Spring container.

Spring's `ApplicationContext` is responsible for creating a Spring bean and manage the 
Spring bean life cycle.

Below, We have created a simple Spring bean for `Foo` class using `@Component` annotation.

```java
@Component
Class Foo { //variables and methods ...}
```
## The Spring Bean Lifecycle

The Bean's life cycle consists of 2 phases `Post-initialization` and `Pre-destruction`. 

Below are the Phase 1, `Post-initialization` steps while creating a Bean.
1. Bean Creation → using Annotations or XML Bean Configs.
2. Bean Instantiate → In this step Bean will be loaded in `JVM` memory.
3. Populating Bean properties →  Container will Create a Bean `id`, `scope`, `default values`.
4. Implementing `BeanNameAware setBeanName()` → Getting to know the Bean Name created by Spring container.
5. Implementing `BeanClassLoaderAware setBeanClassLoder()` → Getting to know the class is loaded in Spring container Bean Factory.
6. Implementing `BeanFactoryAware setBeanFactory()` → Getting to know the application Bean and its dependencies. 
7. Implementing `ApplicationContextAware setApplicationContextAware()` → Getting to know the total number of beans created in the application and etc…
8. `@PostConstruct` → will be called the annotated method.
9. Implementing `InitializingBean afterPropertiesSet()` → method will be called after setting the bean properties.
10. `@Bean init-method` → called specified method inside an `init-method` attribute.
11. Bean is Ready to use.

Below is Phase 2, `Pre-destruction` steps while destroying a Bean.

1. `@PreDestroy` → Annotated method will be called.
2. `DisposiableBean destroy()` → will be called at the closing.
3. `@Bean destroy-method` → called specified method inside the `destroy-method` attribute.
4. Bean will be destroyed.

## Why Would I Need to Hook into the Bean Lifecycle?
  Below are some of the use cases.
  + To make sure application dependency (ex: `Remote Database` and `External Services` and etc...) modules are up and running on startup while creating bean.
  + Loading application `Metadata` (ex: US state code values) information while creating a bean.
  + Assigning `Default values` for bean properties (ex: MIN_VALUE and MAX_VALUE).
  + Scheduling `CRON` jobs or Starting a `Message Queue Listeners` on Bean Creation.
  + Cleaning up the data which is stored in memory using bean destruction.
  + Terminating `Process` or `Thread` as part of the bean destruction.
  + Closing the `Database` connections and `Files`.


## Hooking into the Bean Lifecycle
  Let us look at the 5 different ways of tapping into the spring bean lifecycle.
### Using Spring @PostConstruct and @PreDestroy annotations
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
### Using @Bean annotation and Attributes
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
```java
@Configuration
public class Config {

    @Bean(initMethod = "init", destroyMethod = "destroy")
    public Foo getFooInstance() {
        return new Foo();

    }
}
```

### Using Spring InitializingBean and DisposableBean Interfaces
```java
@Component
public class Foo implements InitializingBean, DisposableBean {

    @Override
    public void afterPropertiesSet() {
        System.out.println("Spring Bean Post Contract After Properties Set Method ");
    }

    @Override
    public void destroy() {
        System.out.println("Spring Bean Pre Destroy Method ");
    }
}


```
### Using Spring Aware Interfaces
```java
@Component
class Foo implements BeanNameAware {
    @Override
    public void setBeanName(String name) {
        System.out.println("Spring Set Bean Name Method Call");
    }
}
```
  
```java
@Component
class Foo implements BeanFactoryAware {
    @Override
    public void setBeanFactory(BeanFactory beanFactory) {
        System.out.println("Spring Set Bean Factory Method Call");
    }
}
```

```java
@Component
class Foo implements ApplicationContextAware {
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        System.out.println("Spring Set Application Context Method Call");
    }
}
```
 
### Using XML configuration(<Bean> Tag)
modern-day spring applications are not using the traditional XML Bean configurations. For more information refer Spring reference manual for bean [Creation](https://docs.spring.io/spring/docs/3.2.x/spring-framework-reference/html/beans.html#beans-factory-lifecycle-initializingbean) and [Destruction](https://docs.spring.io/spring/docs/3.2.x/spring-framework-reference/html/beans.html#beans-factory-lifecycle-disposablebean) callback methods.

## Conclusion
It is always good vs bad practice debts about tapping into spring container internals.

Best Practise standpoint  [Spring Document](https://docs.spring.io/spring/docs/3.2.x/spring-framework-reference/html/beans.html#beans-factory-lifecycle) preference is to use `JSR-250 @PostConstruct` and `@PreDestroy` annotations and then `@Bean` `init-method` and `destroy-method` tapping options.

[Spring Document](https://docs.spring.io/spring/docs/3.2.x/spring-framework-reference/html/beans.html#beans-factory-lifecycle) specifically suggesting not to use and tied with Spring specific `InitializingBean` and `DisposableBean` interfaces.

Definitely, Spring bean life cycle callback methods are alternates for `Constructor` based bean setters to avoid bean dependencies and `Null Pointer` issues.