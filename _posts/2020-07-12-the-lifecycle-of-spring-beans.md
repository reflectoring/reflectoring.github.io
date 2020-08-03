---
title: The Lifecycle of Spring Beans
categories: [spring-boot]
date: 2020-07-12 06:00:00 +1000
modified: 2020-07-12 06:00:00 +1000
author: yavuztas
excerpt: ""
---

Like many other frameworks in the Java Ecosystem, providing an enterprise-level IOC Container is one of the core provisions of the Spring Framework. Spring does a fluent orchestration of its beans and manages their lifecycle that we are going to explain in this tutorial.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/bean-lifecycle" %}

## What Is a Spring Bean?
Every class which is under the control of Spring's `ApplicationContext` in terms of **creation**, **orchestration**, and **destruction** are called Spring Beans.

The most common way to define a Spring bean is using annotations:
```java
@Configuration
class MySpringConfiguration {

  @Bean
  public MySpringBean mySpringBean() {
    return new MySpringBean();
  }

}
```

## The Spring Bean Lifecycle
When we look into the lifecycle of spring beans, we can see numerous phases starting **from the object instantiation up to their destruction.**

To keep it simple, we group them into two parts as **creation** and **destruction** phases:
<img src="/assets/img/posts/the-lifecycle-of-spring-beans/spring-bean-lifecycle.png" />

Let's explain these phases in a little bit more detail.

### Bean Creation Phases
- **Instantiation:** This is where everything starts for a bean. Spring instantiates bean objects just like the same we create a Java object instance.
- **Populating Properties:** After instantiating objects, Spring scans the beans that implement `Aware` interfaces and starts setting relevant properties.
- **Pre-Initialization:** Spring's `BeanPostProcessor`s get into action in this phase. The `postProcessBeforeInitialization` methods do their job. Also, `@PostConstruct` annotated methods run right after them.
- **AfterPropertiesSet:** Spring executes `afterPropertiesSet` methods of the beans which implements `InitializingBean`.
- **Custom Initialization:** Spring triggers our custom initialization methods defined by `@Bean`'s `initMethod`.
- **Post-Initialization:** Spring's `BeanPostProcessor`s are in action for the second time. In this phase `postProcessAfterInitialization` methods are executed.

### Bean Destruction Phases
- **Pre-Destroy:** Spring triggers`@PreDestroy` annotated methods in this phase.
- **Destroy:** Spring executes the `destroy` methods of `DisposableBean` implementations.
- **Custom Destruction:** We can define custom destruction hooks by `@Bean`'s `destroyMethod` and Spring runs them in the last phase.

## Hooking Into the Bean Lifecycle
There are numerous ways to hook into the phases of the bean lifecycle in a Spring application.

Let's see some examples of each way of them.

### Using Spring's Interfaces
We can use Spring's `InitializingBean` interface to run custom operations in `afterPropertiesSet` phase:
```java
@Component
public class MySpringBean implements InitializingBean {

  @Override
  public void afterPropertiesSet() {
    //...
  }

}
```
Similarly, `DisposableBean` interface for destroy phase can be used:
```java
@Component
public class MySpringBean implements DisposableBean {

  @Override
  public void destroy() {
    //...
  }

}
```

### Using JSR-250 Annotations
Spring supports the `@PostConstruct` and `@PreDestroy` annotations of <a href="https://jcp.org/en/jsr/detail?id=250">the JSR-250 specification.</a>

Therefore, we can use them respectively to hook into pre-initialization and destroy phases:  
```java
@Component
public class MySpringBean {

  @PostConstruct
  public void postConstruct() {
    //...
  }

  @PreDestroy
  public void preDestroy() {
    //...
  }

}
```

### Using `@Bean` Annotation's Attributes
Additionally, when we define our Spring beans we can set `initMethod` and `destroyMethod` attributes of the `@Bean` annotation in Java configuration:
```java
@Configuration
class MySpringConfiguration {

  @Bean(initMethod = "onInitialize", destroyMethod = "onDestroy")
  public MySpringBean mySpringBean() {
    return new MySpringBean();
  }

}
```

We should notice that **if we have a public method named `close` or `shutdown` in our bean, then it is automatically triggered with a destruction callback by default:**
```java
@Component
public class MySpringBean {

  public void close() {
    //...
  }

}
```

However, if we do not wish this behavior, we can disable it by setting `destroyMethod=""`:
```java
@Configuration
class MySpringConfiguration {

  @Bean(destroyMethod = "")
  public MySpringBean mySpringBean() {
    return new MySpringBean();
  }

}
```

<div class="notice warning">
  <h4>XML Configuration</h4>
  For legacy applications, we might have still some beans left in XML configuration. Luckily, we can still configure these attributes in our <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-factory-lifecycle-initializingbean">XML bean definitions.</a>
</div>

### Using `BeanPostProcessor`
Alternatively, we can make use of `BeanPostProcessor` interface and benefit to be able to run any custom operation before or after a spring bean initializes:
```java
public class MyBeanPostProcessor implements BeanPostProcessor {

  @Override
  public Object postProcessBeforeInitialization(Object bean, String beanName)
    throws BeansException {
    //...
    return bean;
  }

  @Override
  public Object postProcessAfterInitialization(Object bean, String beanName)
    throws BeansException {
    //...
    return bean;
  }

}
```
<div class="notice warning">
  <h4><code>BeanPostProcessor</code> Is Not Bean Specific</h4>
  We should pay attention that Spring's <code>BeanPostProcessor</code>s are executed for each bean defined in the spring context.
</div>

### Using `Aware` Interfaces
Another way of getting into the lifecycle, we can use `Aware` interfaces:
```java
@Component
public class MySpringBean implements BeanNameAware, ApplicationContextAware {

  @Override
  public void setBeanName(String name) {
    //...
  }

  @Override
  public void setApplicationContext(ApplicationContext applicationContext)
    throws BeansException {
    //...
  }

}
```
There are additional <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#aware-list">`Aware` interfaces</a> which we can use on purpose in Spring.

## Why Would I Need to Hook Into the Bean Lifecycle?
When we need to extend our software with new requirements, it is critical to find the best practices to keep our codebase maintainable in the long run.

In Spring Framework, **hooking into the bean lifecycle is a good way to extend our application in most cases.**

### Acquiring Bean Properties
One of the use-cases is acquiring the bean properties (like bean name) in runtime. For example, when we do some logging:
```java
@Component
public class NamedSpringBean implements BeanNameAware {

  Logger logger = LoggerFactory.getLogger(NamedSpringBean.class);

  public void setBeanName(String name) {
    logger.info(name + " created.");
  }

}
```
### Dynamically Changing Spring Bean Instances
In some cases, we need to define Spring beans programmatically. This can be a practical solution when we need to re-create and change our bean instances on-demand:
```java
@Service
public class IpToLocationService implements BeanFactoryAware {

  DefaultListableBeanFactory listableBeanFactory;
  IpDatabaseRepository ipDatabaseRepository;

  @Override
  public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
    listableBeanFactory = (DefaultListableBeanFactory) beanFactory;
    updateIpDatabase();
  }

  public void updateIpDatabase(){
    String updateUrl = "https://download.acme.com/ip-database-latest.mdb";

    AbstractBeanDefinition definition = BeanDefinitionBuilder
        .genericBeanDefinition(IpDatabaseRepository.class)
        .addPropertyValue("file", updateUrl)
        .getBeanDefinition();

    listableBeanFactory
        .registerBeanDefinition("ipDatabaseRepository", definition);

    ipDatabaseRepository = listableBeanFactory
        .getBean(IpDatabaseRepository.class);
  }
}
```
### Accessing Beans From the Outside of the Spring Context
Another scenario is accessing the `BeanFactory` instance from outside the Spring context.

For example, we may want to inject `BeanFactory` to a non-spring class to be able to access Spring beans or configurations inside that class. Spring - Quartz integration is a good example to show this use-case:
```java
public class AutowireCapableJobFactory
    extends SpringBeanJobFactory implements ApplicationContextAware {

  private AutowireCapableBeanFactory beanFactory;

  @Override
  public void setApplicationContext(final ApplicationContext context) {
    this.beanFactory = context.getAutowireCapableBeanFactory();
  }

  @Override
  protected Object createJobInstance(final TriggerFiredBundle bundle)
      throws Exception {
    final Object job = super.createJobInstance(bundle);
    this.beanFactory.autowireBean(job);
    return job;
  }

}
```
Also, a common Spring - Jersey integration is another clear example of this:
```java
@Configuration
public class JerseyConfig extends ResourceConfig {

  @Autowired
  private ApplicationContext applicationContext;

  @PostConstruct
  public void registerResources() {
    applicationContext.getBeansWithAnnotation(Path.class).values()
      .forEach(this::register);
  }

}
```

## The Execution Order
Let's write a Spring bean to see the execution order of each phase of the lifecycle:
```java
public class MySpringBean implements BeanNameAware, ApplicationContextAware,
    InitializingBean, DisposableBean {

  private String message;

  public void sendMessage(String message) {
    this.message = message;
  }

  public String getMessage() {
    return this.message;
  }

  @Override
  public void setBeanName(String name) {
    System.out.println("--- setBeanName executed ---");
  }

  @Override
  public void setApplicationContext(ApplicationContext applicationContext)
      throws BeansException {
    System.out.println("--- setApplicationContext executed ---");
  }

  @PostConstruct
  public void postConstruct() {
    System.out.println("--- @PostConstruct executed ---");
  }

  @Override
  public void afterPropertiesSet() {
    System.out.println("--- afterPropertiesSet executed ---");
  }

  public void initMethod() {
    System.out.println("--- init-method executed ---");
  }

  @PreDestroy
  public void preDestroy() {
    System.out.println("--- @PreDestroy executed ---");
  }

  @Override
  public void destroy() throws Exception {
    System.out.println("--- destroy executed ---");
  }

  public void destroyMethod() {
    System.out.println("--- destroy-method executed ---");
  }

}
```
Besides, we create a `BeanPostProcessor` to hook into the before and after initialization phases:
```java
public class MyBeanPostProcessor implements BeanPostProcessor {

  @Override
  public Object postProcessBeforeInitialization(Object bean, String beanName)
      throws BeansException {
    if (bean instanceof MySpringBean) {
      System.out.println("--- postProcessBeforeInitialization executed ---");
    }
    return bean;
  }

  @Override
  public Object postProcessAfterInitialization(Object bean, String beanName)
      throws BeansException {
    if (bean instanceof MySpringBean) {
      System.out.println("--- postProcessAfterInitialization executed ---");
    }
    return bean;
  }

}
```
Next, we write a Spring configuration to define our beans:
```java
@Configuration
public class MySpringConfiguration {

  @Bean
  public MyBeanPostProcessor myBeanPostProcessor(){
    return new MyBeanPostProcessor();
  }

  @Bean(initMethod = "initMethod", destroyMethod = "destroyMethod")
  public MySpringBean mySpringBean(){
    return new MySpringBean();
  }

}
```
Finally, we write a `@SpringBootTest` to run our Spring context:
```java
@SpringBootTest
public class BeanLifecycleApplicationTests {

  @Autowired
  public MySpringBean mySpringBean;

  @Test
  public void testMySpringBeanLifecycle() {
    String message = "Hello World";
    mySpringBean.sendMessage(message);
    assertThat(mySpringBean.getMessage()).isEqualTo(message);
  }

}
```

As a result, our test method outputs the execution order between the lifecycle phases:
```java
--- setBeanName executed ---
--- setApplicationContext executed ---
--- postProcessBeforeInitialization executed ---
--- @PostConstruct executed ---
--- afterPropertiesSet executed ---
--- init-method executed ---
--- postProcessAfterInitialization executed ---
...
--- @PreDestroy executed ---
--- destroy executed ---
--- destroy-method executed ---
```

## Conclusion

In this tutorial, we explained what the bean lifecycle phases are, why, and how we hook into lifecycle phases in Spring.

Spring has numerous phases in a bean lifecycle as well as many ways to receive callbacks. We can hook into these phases both over on beans or from a common point as we do in `BeanPostProcessor`.

Although each method has its purpose, **we should avoid using Spring interfaces. This will force us to couple our code to Spring Framework and violates the <a href="https://en.wikipedia.org/wiki/Dependency_inversion_principle">Dependency Inversion Principle.</a>**

On the other hand, **`@PostConstruct` and `@PreDestroy` annotations are a part of Java API. Therefore, we can consider them a better alternative to receiving lifecycle callbacks because they decouple our components from Spring.**

All the code examples and more are over [on Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/bean-lifecycle) for you to play.
