---
authors: [sagaofsilence]
title: "All You Need to Know about Spring's Java Config"
categories: ["Spring"]
date: 2023-10-14 00:00:00 +0530
excerpt: "Discover the simplicity of Spring's Java Configuration! Dive into this beginner-friendly guide and master essential concepts, crafting powerful Spring applications with confidence and ease."
image: images/stock/0013-switchboard-1200x628-branded.jpg
url: beginner-friendly-guide-to-spring-java-config
---

Welcome to the exciting world of Spring's Java Configuration! Eager to unravel the mysteries of Spring applications? You've come to the right place!

In this comprehensive guide, we'll embark on a journey to demystify Spring's Java-based configuration, simplifying the process for newcomers.

Imagine crafting robust Spring applications with just Java classes, understanding core annotations like `@Bean` and `@Configuration`, and seamlessly managing properties.

We'll explore the art of configuration logic organization, delve into modular setups, and tailor configurations with ease.

By the end, you'll not only grasp the fundamentals but also be equipped to create scalable Spring applications effortlessly.

Let's dive in and transform our Spring development experience!

<a name="example-code" />
{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/java-config" %}}


## Spring Configuration: Demystifying the Heartbeat of Spring Applications

In the vibrant landscape of software development, Spring Configuration stands as the silent orchestrator, harmonizing the elements of Spring applications. At its core, **Spring Configuration is the art and science of setting up a Spring application, defining its components, managing dependencies, and orchestrating their interactions**. It serves as the blueprint, guiding the behavior of our Spring-powered creations.

Configuration in Spring is all about empowering our applications with context, specifying how beans (Spring-managed objects) are created, wired, and used within the application.

Traditionally, Spring offered XML-based configuration, providing a structured way to define beans and their relationships. In the dynamic landscape of Java and Spring, XML configurations have been replaced by more intuitive, expressive, and Java-centric approaches, showcasing the superior efficiency of Java configuration.

## What Makes Spring Configuration Essential?

Java-based configuration in Spring is like poetry in code, where you harness the power of plain Java classes and annotations to configure our application. With Java-based configuration, you bid farewell to XML files and embrace the elegance of Java code to define our beans and their relationships.

In the upcoming sections, we will unravel the intricacies of Spring's Java Configuration, exploring its core concepts, understanding annotations like `@Bean` and `@Configuration`, and delving into the art of organizing and managing our Spring applications.

Let's embark on this journey to demystify Spring's heartbeat and empower our coding endeavors.

{{% info title="Notes: Understanding Beans in Spring Applications" %}}

Excited to dive into the magic of Spring? Let's recap the essentials: beans, IoC, and DI. Join us on this empowering journey, making our Java applications thrive!

✍ **BEANS: THE CORE OF SPRING:**
In the world of Spring, a 'bean' is not just a legume but the fundamental building block of our application. **Beans are Java objects managed by the Spring container.** Think of them as the essential ingredients in a recipe, representing the various components of our application, from simple data objects to complex business logic. **Spring takes care of creating these beans, managing their lifecycle, and wiring them together, making our application cohesive and organized.**

✍ **INVERSION OF CONTROL (IOC) SIMPLIFIED:**
IoC, often referred to as the 'heart' of Spring, is a concept where the control over the object creation and lifecycle is transferred from our application to the Spring container. Imagine our application as a passenger in a self-driving car; you specify the destination, and Spring takes care of the driving, ensuring **our beans are created, configured, and managed without our direct intervention**.

✍ **DEPENDENCY INJECTION (DI) UNVEILED:**
Dependency Injection is like a magic potion in Spring. It's the process where beans receive their dependencies from an external source, typically the Spring container, rather than creating them internally. Picture a chef receiving all the ingredients pre-chopped and organized on the kitchen counter. With DI, our beans are ready to use, making our code cleaner, more modular, and easier to test. **Spring handles the 'injection' of dependencies, ensuring our beans work seamlessly together in our application recipe.**

👉 Unveil the secrets of beans, IoC, and DI in [our detailed article](http://localhost:1313/dependency-injection-and-inversion-of-control/).
{{% /info %}}

## Types of Spring Configuration

In the vibrant Spring ecosystem, configuring our applications is an art. Spring offers various types of configuration options, each tailored to specific needs.

Let's get familiar with them:

1. **XML Configuration:**
   Dive into the classic approach! Configure Spring beans and dependencies using XML files. Perfect for legacy systems and scenarios requiring external configuration.

2. **Annotation-based Configuration:**
   Embrace simplicity! Use annotations like `@Component`, `@Service`, and `@Repository` to define beans. Ideal for small to medium-sized projects, reducing XML clutter.

3. **Java-based Configuration:**
   Embrace elegance! Configure beans with Java classes using `@Configuration` and `@Bean`. Promotes modularity and testability, making our codebase cleaner.

4. **Java Configuration with Annotation Scanning:**
   Enjoy automation! Combine Java-based configuration with annotation scanning for effortless bean discovery. Boost productivity in large projects.

5. **Java Configuration with Property Files:**
   Master flexibility! Externalize configuration properties to property files. Inject values using `@Value` annotation, ensuring adaptability across environments.

Each type caters to specific project demands. Stay tuned as we unravel the nuances, guiding you to choose the perfect configuration style for our Spring endeavors. Get ready to configure Spring like a pro!

## Understanding Core Concepts: @Bean and @Configuration

{{% info title="Use Case: Employee Management System" %}}
Imagine you're building an Employee Management System, where employees belong to various departments within a company. In this intricate ecosystem, maintaining clean code and modular architecture is crucial.

Feel free to refer to example code shared on [Github](#example-code).

{{% /info %}}
\
Enter Spring's core concepts: `@Bean` and `@Configuration`.

**Understanding @Bean:**
In Spring, `@Bean` is a magic wand that transforms ordinary methods into Spring-managed beans. These beans are objects managed by the Spring IoC container, ensuring centralized control and easier dependency management. In our Employee Management System, `@Bean` helps create beans representing employees and departments.

```java
public class Employee {
    // Employee properties and methods
}

public class Department {
    // Department properties and methods
}

@Configuration
public class JavaConfigAppConfiguration {
    @Bean
    public Employee newEmployee(final String firstName, final String lastName) {
        return Employee.builder().firstName(firstName).lastName(lastName).build();
    }

    @Bean
    public Department newDepartment(final String deptName) {
        final Department department = Department.builder().name(deptName).build();
        acme().addDepartment(department);
        return department;
    }

    @Bean
    @Scope(ConfigurableBeanFactory.SCOPE_SINGLETON)
    public Employee founderEmployee() {
        final Employee founder = newEmployee("Scott", "Tiger");
        founder.setDesignation("Founder");
        founder.setDepartment(coreDepartment());
        return founder;
    }

    @Bean
    @Scope(ConfigurableBeanFactory.SCOPE_SINGLETON)
    public Department coreDepartment() {
        return newDepartment("Core");
    }

    @Bean
    @Scope(ConfigurableBeanFactory.SCOPE_SINGLETON)
    public Organization acme() {
        final Organization acmeCo = new Organization();
        acmeCo.setName("Acme Inc");
        return acmeCo;
    }
}
```

Here, the `newEmployee` and `founderEmployee` methods create an `Employee` bean, `newDepartment` and `coreDepartment` methods create a `Department` bean and `acme` method creats an `Organization` bean. Spring now manages these objects, handling their lifecycle and ensuring proper dependencies.

**Understanding Bean Lifecycle:**
The lifecycle of a Spring bean involves its instantiation, initialization, use, and eventual disposal. When the Spring container starts, it instantiates the beans. Then, it injects the dependencies, calls the initialization methods (if specified), and makes the bean available for use. When the container shuts down, the beans are destroyed, invoking any destruction methods (if defined).

{{% info title="Spring Bean Lifecycle: A Summary" %}}

Spring beans, the heart of Spring applications, undergo a series of stages known as the bean lifecycle. Understanding these stages is essential for effective bean management.

Here’s a concise summary of the Spring bean lifecycle methods:

1. **Instantiation:** Beans are created, either through constructor invocation or factory methods.

2. **Population of Properties:** Dependencies and properties of the bean are set.

3. **Awareness:** Beans implementing `Aware` interfaces are notified of the Spring environment and related beans. Examples include `BeanNameAware`, `BeanFactoryAware`, and `ApplicationContextAware`.

4. **Initialization:** The bean is initialized after its properties are set. This involves calling custom initialization methods specified by the developer. If a bean implements the `InitializingBean` interface, the `afterPropertiesSet()` method is invoked. Alternatively, you can define a custom initialization method and specify it in the bean configuration.

5. **In Use:** The bean is now in use, performing its intended functions within the application.

6. **Destruction:** When the application context is closed or the bean is no longer needed, the destruction phase begins. Beans can implement the `DisposableBean` interface to define custom cleanup operations in the `destroy()` method. Alternatively, you can specify a custom destruction method in the bean configuration.

Understanding these stages ensures proper initialization and cleanup of Spring beans, facilitating efficient and well-managed Spring applications.

👉 Unveil the secrets of bean lifecycle in [our detailed article](https://reflectoring.io/spring-bean-lifecycle/).

{{% /info %}}
\
**Managing Spring Bean Lifecycle with @Bean:**

In the context of the Employee Management System, let’s delve deeper into managing the lifecycle of a Spring bean using `@Bean` methods and related annotations.

**1. Custom Initialization and Destruction Methods:**

```java
public class Employee {

    // Bean properties and methods

    public void init() {
        // Custom initialization logic
    }

    public void destroy() {
        // Custom cleanup logic
    }
}
```

In our configuration class:

```java
@Configuration
public class JavaConfigAppConfiguration {

    @Bean(initMethod = "init", destroyMethod = "destroy")
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    public Employee employee() {
        return new Employee();
    }
}
```

In this example, the `employee()` method creates an `Employee` bean. The `initMethod` attribute specifies a custom initialization method, and the `destroyMethod` attribute defines a custom cleanup method. When the bean is created and destroyed, these methods are invoked, allowing you to handle specific lifecycle events.

**2. Implementing InitializingBean and DisposableBean Interfaces:**

```java

public class Department implements InitializingBean, DisposableBean {

    // Bean properties and methods

    @Override
    public void afterPropertiesSet() throws Exception {
        // Initialization logic
    }

    @Override
    public void destroy() throws Exception {
        // Cleanup logic
    }
}
```

In our configuration class, you can create the bean as usual:

```java
@Configuration
public class JavaConfigAppConfiguration {

    @Bean
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    public Department newDepartment(final String deptName) {
        final Department department = Department.builder().name(deptName).build();
        acme().addDepartment(department);
        return department;
    }
}
```

In this approach, the `Department` class implements the `InitializingBean` and `DisposableBean` interfaces, providing `afterPropertiesSet()` for initialization and `destroy()` for cleanup. Spring automatically detects these interfaces and calls the appropriate methods during bean lifecycle stages.

Interface `InitializingBean` is implemented by beans that need to react once all their properties have been set by a BeanFactory: for example, to perform custom initialization, or merely to check that all mandatory properties have been set.

Interface `DisposableBean` is implemented by beans that want to release resources on destruction. A BeanFactory is supposed to invoke the destroy method if it disposes a cached singleton. An application context is supposed to dispose all of its singletons on close.

These examples demonstrate how `@Bean` methods, along with custom initialization and destruction methods or interfaces like `InitializingBean` and `DisposableBean`, enable precise control over the lifecycle of Spring beans within our Employee Management System.

**Specifying Bean Scope:**
The `@Scope` annotation allows you to define the scope of the bean. For instance, `@Scope("prototype")` indicates a new instance of the bean for every request, while the default scope is Singleton, creating a single bean instance per Spring IoC container.

```java
@Configuration
public class EmployeeConfig {

    @Bean
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    public Employee employee() {
        return new Employee();
    }
}
```
{{% info title="Summary of Spring Bean Scopes" %}}
In Spring, bean scope defines the lifecycle and visibility of a bean instance within the Spring IoC container. Choosing the right scope ensures appropriate management and usage of beans in our application. Here’s a summary of common Spring bean scopes:

1. **Singleton Scope:** Beans in Singleton scope have a single instance per Spring IoC container. It's the default scope. Singleton beans are created once and shared across the application. Use this scope for stateless beans and heavy objects to conserve resources.

2. **Prototype Scope:** Beans in Prototype scope have a new instance every time they are requested. Each request for a prototype bean creates a new object. Use this scope for stateful beans or when you need a new instance every time.

3. **Request Scope:** Beans in Request scope have a single instance per HTTP request. This scope is specific to web applications. Each HTTP request gets a new instance of the bean. Use this for stateful beans in a web context.

4. **Session Scope:** Beans in Session scope have a single instance per HTTP session. Similar to request scope but persists across multiple requests within the same session. Use this for user-specific stateful beans in a web context.

5. **Application Scope:** Beans in Application scope have a single instance per ServletContext. This means a single instance shared across all users/sessions in a web application. Use this for global, stateless beans that should be shared by all users.

6. **Custom Scope:** Besides the standard scopes, Spring allows you to create custom scopes tailored to specific requirements. Custom scopes can range from narrow scopes like thread scope to broader scopes based on business logic.

Choosing the appropriate scope depends on the specific use case and requirements of our beans. Understanding these scopes ensures that our beans are managed effectively, optimizing resource utilization and ensuring the correct behavior of our Spring application.
{{% /info %}}
\
**Overriding Default Bean Name:**
By default, the bean name is the same as the method name. However, you can specify a custom name using the name attribute in the `@Bean` annotation.

```java
@Configuration
public class JavaConfigAppConfiguration {

    @Bean(name = "founder")
    @Scope(ConfigurableBeanFactory.SCOPE_SINGLETON)
    public Employee founderEmployee() {
        final Employee founder = newEmployee("Scott", "Tiger");
        founder.setDesignation("Founder");
        founder.setDepartment(coreDepartment());
        return founder;
    }
}
```

In this example, the bean is named `founder`, allowing specific identification within the application context.

Understanding `@Bean` and its related concepts is pivotal in Spring configuration. It not only creates instances but also allows fine-grained control over their lifecycle, scope, and naming conventions, empowering our Employee Management System with robust, Spring-managed components.

**Understanding @Configuration:**
`@Configuration` is a superhero annotation that marks a class as a source of bean definitions. It allows you to create beans using `@Bean` methods within the class. In our Employee Management System, `@Configuration` organizes the creation of beans, providing a centralized configuration hub.

```java
@Configuration
public class JavaConfigAppConfiguration {
    @Bean
    public Employee employee() {
        return new Employee();
    }

    @Bean
    public Department salesDepartment() {
        return new Department();
    }
}
```

With `@Configuration`, you encapsulate our bean definitions, promoting modularity and enhancing maintainability. Spring ensures that these beans are available for injection wherever needed, making our Employee Management System robust and scalable.

### Concrete Examples for @Bean and @Configuration

**1. Database Configuration with DataSource:**

In a RESTful Employee Management System, configuring a database connection is critical. `@Configuration` can be used to set up the data source, ensuring seamless communication with your database.

```java
@Configuration
public class DatabaseConfiguration {

    @Bean
    public DataSource dataSource() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setUrl("jdbc:mysql://localhost:3306/employees_db");
        dataSource.setUsername("username");
        dataSource.setPassword("password");
        return dataSource;
    }
}
```

Here, the `@Bean` annotation configures a `DataSource` bean, facilitating connections to your database. This configuration can be further extended for more complex setups like connection pooling.

**2. Caching Configuration with EhCache:**

Efficient data caching is vital for improving response times in RESTful applications. `@Configuration` can be utilized to set up caching mechanisms, enhancing the system’s performance.

```java
@Configuration
@EnableCaching
public class CachingConfiguration {

    @Bean
    public CacheManager cacheManager() {
        net.sf.ehcache.config.Configuration config 
            = new ConfigurationFactory().parseConfiguration();
            config.addCache(
                new CacheConfiguration("employeesCache", 1000)
                    .timeToLiveSeconds(3600) // Cache entries expire after an hour
            );
        return new net.sf.ehcache.CacheManager(config);
    }
}
```

In this example, `@Configuration` sets up caching using EhCache, creating a cache named "employeesCache" that expires after an hour. This enhances the application’s responsiveness by reducing database queries.

**3. Security Configuration with Spring Security:**

Securing your Employee Management System is paramount. `@Configuration` can be used to configure Spring Security, ensuring that your endpoints are protected.

```java
@Configuration
@EnableWebSecurity
public class SecurityConfiguration extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .antMatchers("/api/employees/**").authenticated()
                .anyRequest().permitAll()
                .and()
            .httpBasic();
    }
}
```

In this instance, `@Configuration` enables Spring Security, allowing only authenticated users to access endpoints under "/api/employees". This ensures data security within your application.

These advanced examples demonstrate the power of `@Bean` and `@Configuration` in configuring complex components such as database connections, caching mechanisms, and security protocols within a RESTful Employee Management System.

In the intricate world of employee management, `@Bean` and `@Configuration` shine as the building blocks, simplifying complexity and ensuring our Spring application runs seamlessly. Harness their power, and watch our application flourish.

## Java-Based Container Configuration

## Initiating the Spring Container

Unraveling the Mystery of AnnotationConfigApplicationContext

## Crafting Beans with Precision

Mastering the @Bean Annotation for Effective Bean Management

## Organizing Configuration Logic

Simplifying Configuration with @Configuration Annotation

## Building Scalable Applications

Creating Modular Configurations for Growing Projects

## Tailoring Configurations with Profiles

Customizing Configurations for Different Scenarios

## Managing Properties with Ease

Understanding Spring’s PropertySource for Configuration Data

## Seamless External Configuration

Integrating External Properties with @PropertySource
