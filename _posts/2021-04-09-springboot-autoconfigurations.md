# How Spring Boot's AutoConfigurations Internally Work

In this article, we will discuss and understand how Spring Boot's AutoConfigurations internally works

## 1. Introduction
Before we deep dive into Spring Boot's AutoConfiguration, **what really is Spring Boot?**

*As per Spring Boot documentation:*
> It takes an opinionated view of the Spring platform and third-party libraries so you can get started with minimum fuss.

## 2. What is Spring Boot Auto Configuration?

> Spring Boot auto-configuration attempts to automatically configure your Spring application based on the jar dependencies that we have added in ``pom.xml`` or ``build.gradle`` depends on the tool which we are using.

In a nutshell, Spring Boot looks at libraries or frameworks available on available properties and libraries on the classpath. Based on these, it provides the basic configuration needed to configure the application with these libraries or frameworks. This is called ``Auto Configuration``.

**For example**, if the Spring MVC jar is on the classpath, and we no need to manually configure ``Dispatcher Servlet``, then Spring Boot auto-configures Dispatcher Servlet.


## 3. Why do we need Spring Boot Auto Configuration?

Spring related applications had a lot of configuration. In Spring MVC, we need to configure **web.xml, applicationcontext.xml** or **ComponentScan, Dispatcher Servlet, a view resolver and web jars**. Hence, to reduce the time and effort configuring all the stuff, we need to use a new thought process and intelligence called ``Spring Boot's AutoConfigurations`` which will help us to develop an application in less time.

The below code snippet shows the configuration of Dispatcher Servlet in a Web Application in ``web.xml``

```xml

    <servlet>
        <servlet-name>dispatcher</servlet-name>
        <servlet-class>
            org.springframework.web.servlet.DispatcherServlet
        </servlet-class>
        <init-param>
            <param-name>contextConfigLocation</param-name>
            <param-value>/WEB-INF/musicservice-servlet.xml</param-value>
        </init-param>
        <load-on-startup>1</load-on-startup>
    </servlet>

    <servlet-mapping>
        <servlet-name>dispatcher</servlet-name>
        <url-pattern>/</url-pattern>
    </servlet-mapping>

```
For delivering static content we would InternalViewResolver bean needs to be configured

```xml

   <bean
        class="org.springframework.web.servlet.view.InternalResourceViewResolver">
        <property name="prefix">
            <value>/WEB-INF/views/</value>
        </property>
        <property name="suffix">
            <value>.jsp</value>
        </property>
  </bean>

  <mvc:resources mapping="/webjars/**" location="/webjars/"/>

```
When we use Hibernate/JPA, we would need to configure a data source, an entity manager factory, a transaction manager factory manually.

```xml

    <bean id="dataSource" class="com.mchange.v2.c3p0.ComboPooledDataSource"
        destroy-method="close">
        <property name="driverClass" value="${db.driver}" />
        <property name="jdbcUrl" value="${db.url}" />
        <property name="user" value="${db.username}" />
        <property name="password" value="${db.password}" />
    </bean>

    <jdbc:initialize-database data-source="dataSource">
        <jdbc:script location="classpath:config/schema.sql" />
        <jdbc:script location="classpath:config/data.sql" />
    </jdbc:initialize-database>

    <bean
        class="org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean"
        id="entityManagerFactory">
        <property name="persistenceUnitName" value="musicservice_pu" />
        <property name="dataSource" ref="dataSource" />
    </bean>

    <bean id="transactionManager" class="org.springframework.orm.jpa.JpaTransactionManager">
        <property name="entityManagerFactory" ref="entityManagerFactory" />
        <property name="dataSource" ref="dataSource" />
    </bean>

    <tx:annotation-driven transaction-manager="transactionManager"/>

 ```
In Spring-based application, above XML configuration we have to do manually for each of the beans contained in it and wire/associate them properly.

## 4. Role of Conditional Auto-Configurations with @Conditional annotation

Before we understand the concept of auto-configuration, we need to understand just one important concept i.e., Spring Framework's ``@Conditional`` annotation.

### 4.1 What is @Conditional?

``@Conditional`` indicates that a component is only eligible for registration when all specified conditions match. A ``condition`` is any state that can be determined programmatically before the bean definition is due to the registered.

```java

   @Target(value = {TYPE, METHOD }
   @Retention(value = RUNTIME)
   @Documented
   public @interface Conditional

```

The ``@Conditional`` annotation may be used in any of the following ways:
   * as a type-level annotation on any class directly or indirectly annotated with ``@Component``, including ``@Configuration`` classes.
   * as a meta-annotation, for the purpose of composing custom stereotype annotations.
   * as a method-level annotation on any ``@Bean`` method.

You can find more information at this link [Conditional Beans with Spring Boot!](https://reflectoring.io/spring-boot-conditionals/)


## 5. An in-depth understanding of Spring Boot and its AutoConfigurations

### 5.1 What happens internally when you start Spring Boot Application?

When you start/launch the Spring Boot application there is a main() method that launches Spring Boot's enchantment.

``` java

package com.bsmlabs.movieservice

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MovieServiceApplication {

   public static void main(String[] args) { // (1)
     SpringApplication.run(MovieServiceApplication.class, args);
   }

}

```
1. when we run this main method and the Tomcat server boots up, application.properties file gets read in and we can start writing @RestControllers.

Let's understand internally what happens.

There are many internal things that happen when we run an application, but let's have a look at three core features

* **Auto-registered @PropertySources**

* **Where is Spring Boot's AutoConfigurations implemented and read-in META-INF/spring.factories**

* **Enhanced Conditional Support**

### **5.1.1. Auto-registered @PropertySources**

In Spring framework application to read in .properties files from any location we want, with the help of the ``@PropertySource`` annotation.

```java
  @PropertySource(value = "classpath:application.properties", ignoreResourceNotFound = true)
```
So when we run the main method of our MusicServiceApplication, Spring Boot will automatically register 17 of these PropertySources and added to our project.
You can find the complete list of default ProperySources [in the Spring Boot Official documentation!](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-external-config), but here's an excerpt

```
  Config Data from the application.properties files
  ...
  OS environment variables
  ...
  Java System properties (System.getProperties())

```
Since Spring Boot has an opinionated view, it has a default set of property locations that it always to read in, like ``application.properties`` inside the .jar file. for example, if we explicitly specify port details ``server.port = 9090`` in application.properties, during application startup it will listen port as 9090 else it will listen from port number 8080.

Next, what does it do with these .properties which we have registered in the previous step? Before we have a look at that in Spring Boot's original source code, let's have a look at the next magic that happens when running Spring Boot's main method.

### **5.1.2. Where is Spring Boot's AutoConfigurations implemented and read-in META-INF/spring.factories**

All auto-configuration logic is implemented in ``spring-boot-autoconfigure.jar``. All auto configuration logic for mvc, data, JMS, and other frameworks is present in a single jar.

![autoconfigure](/assets/img/posts/springboot-autoconfiguration/springbootautoconfigure.png)

Every Spring Boot project has a dependency on the following library: ``org.springframework.boot:spring-boot-autoconfigure``. It is a simple .jar file containing pretty much all of Spring Boot's magic.

In addition, it comes with a file called ``spring.factories``, under the ``META-INF`` folder.

![spring.factories](/assets/img/posts/springboot-autoconfiguration/springfactories.png)

In the ``spring.factories`` file, there's one section called "#Auto Configure", which has hundred of lines

```
# Auto Configure
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
org.springframework.boot.autoconfigure.admin.SpringApplicationAdminJmxAutoConfiguration,\
org.springframework.boot.autoconfigure.aop.AopAutoConfiguration,\
org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration,\
org.springframework.boot.autoconfigure.batch.BatchAutoConfiguration,\
org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration,\
org.springframework.boot.autoconfigure.cassandra.CassandraAutoConfiguration,\
org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration,\
org.springframework.boot.autoconfigure.context.LifecycleAutoConfiguration,\
org.springframework.boot.autoconfigure.context.MessageSourceAutoConfiguration,\
org.springframework.boot.autoconfigure.context.PropertyPlaceholderAutoConfiguration,\
org.springframework.boot.autoconfigure.couchbase.CouchbaseAutoConfiguration,\
// 100 more lines

```
In a nutshell, when Spring Boot boots up:

  1. It read in .properties from 17 hard-coded locations.
  2. It also reads in the ``spring.factories`` file of your autoconfigure-module and finds out which AutoConfigurations it should evaluate.
  3. It has an enhanced concept of @Conditionals, compared to plain Spring.

### 5.2 How to debug/analyze Auto Configuration with an example?

Inside the spring-boot-autoconfigure module, we'll find a subpackage and AutoConfiguration for every Spring or 3rd party library that Spring Boot Integrates with.

**Example of DataSourceAutoConfiguration**

We will take a look at DataSourceAutoConfiguration. It is the one that builds a DataSource for us after you put a couple of properties like ``spring.datasource.url`` into the ``application.properties`` files.

A plethora of annotations here, let's discuss through it line-by-line.

```java
    @Configuration(proxyBeanMethods = false) // (1)
```
 1. Bootstrapping through @Configuration for DataSourceAutoConfiguration.

```java
   @ConditionalOnClass({ DataSource.class, EmbeddedDatabaseType.class }) // (2)
```
 2. Before @Configuration get registered with beans available, we need to have two classes on the classpath: DataSource and EmbeddedDatabaseType. If the Conditional is false, the whole @Configuration is not registered or evaluated.

```java

  @EnableConfigurationProperties(DataSourceProperties.class) // (3)
  @Import({ DataSourcePoolMetadataProvidersConfiguration.class, DataSourceInitializationConfiguration.class }) // (3)

```
 3. @EnableConfigurationProperties enables that the properties we put in .properties files can get automatically set/converted to an object, like the DataSourceProperties here.

```java
   @Configuration(proxyBeanMethods = false) // (4)
```
4. The DataSourceAutoConfiguration has inner two other @Configurations. One of them is the ``PooledDataSourceConfiguration``, which will (conditionally) create a connection pool DataSource for you.

```java
   @Conditional(PooledDataSourceCondition.class) // (5)
```
 5. It has a ``@Conditional`` on a PooledDataSourceCondition, which really is a nested @ConditionalOnProperty.

```java
   @ConditionalOnMissingBean({ DataSource.class, XADataSource.class }) // (6)
```
6. The PooledDataSourceConfiguration only gets evaluated further if the DataSource or XADataSource has not specified. Embedded Database is configured only if there are no beans of type DataSource.class or XADataSource.class already configured.

```java
   @Import({ DataSourceConfiguration.Hikari.class, DataSourceConfiguration.Tomcat.class,
			DataSourceConfiguration.Dbcp2.class, DataSourceConfiguration.OracleUcp.class,
			DataSourceConfiguration.Generic.class, DataSourceJmxConfiguration.class }) // (7)
```
7. The PooledDataSourceConfiguration imports connection pool library like ``Hikari, Tomcat, Dbcp2, OracleUcp, Generic, and DataSourceJmxConfiguration``.

Complete code snippet as follows:

```java
package org.springframework.boot.autoconfigure.jdbc;

import java.sql.SQLException;

import javax.sql.DataSource;

import com.zaxxer.hikari.HikariDataSource;
import oracle.jdbc.OracleConnection;
import oracle.ucp.jdbc.PoolDataSourceImpl;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DatabaseDriver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration(proxyBeanMethods = false)
@ConditionalOnClass({ DataSource.class, EmbeddedDatabaseType.class })
@ConditionalOnMissingBean(type = "io.r2dbc.spi.ConnectionFactory")
@EnableConfigurationProperties(DataSourceProperties.class)
@Import({ DataSourcePoolMetadataProvidersConfiguration.class, DataSourceInitializationConfiguration.class })
public class DataSourceAutoConfiguration {

	@Configuration(proxyBeanMethods = false)
	@Conditional(EmbeddedDatabaseCondition.class)
	@ConditionalOnMissingBean({ DataSource.class, XADataSource.class })
	@Import(EmbeddedDataSourceConfiguration.class)
	protected static class EmbeddedDatabaseConfiguration {

	}

	@Configuration(proxyBeanMethods = false)
	@Conditional(PooledDataSourceCondition.class)
	@ConditionalOnMissingBean({ DataSource.class, XADataSource.class })
	@Import({ DataSourceConfiguration.Hikari.class, DataSourceConfiguration.Tomcat.class,
			DataSourceConfiguration.Dbcp2.class, DataSourceConfiguration.OracleUcp.class,
			DataSourceConfiguration.Generic.class, DataSourceJmxConfiguration.class }) // (7)
	protected static class PooledDataSourceConfiguration {

	}

      // more details

}

```
All the above steps are normal Spring ``@Configurations``, handled with ``@Conditionals``.

Let's discuss one of the imported ``DataSourceConfiguration.Hikari.class`` file

**Hikari DataSource configuration**

```java


	@Configuration(proxyBeanMethods = false) // (1)
	@ConditionalOnClass(HikariDataSource.class) // (2)
	@ConditionalOnMissingBean(DataSource.class) // (3)
	@ConditionalOnProperty(name = "spring.datasource.type", havingValue = "com.zaxxer.hikari.HikariDataSource",
			matchIfMissing = true) // (4)
	static class Hikari {

		@Bean // (5)
		@ConfigurationProperties(prefix = "spring.datasource.hikari")
		HikariDataSource dataSource(DataSourceProperties properties) {
			HikariDataSource dataSource = createDataSource(properties, HikariDataSource.class);
			if (StringUtils.hasText(properties.getName())) {
				dataSource.setPoolName(properties.getName());
			}
			return dataSource;
		}

	}

```
Let's discuss line by line in ``HikariDataSourceConfiguration``

1. Bootstrapping with @Configuration
2. The HikariDataSource.class must be on the classpath, i.e., hikari-cp must be added to your ``pom.xml`` or ``build.gradle`` file.
3. A DataSource bean must not have specified.
4. @ConditionalOnProperty checking whether ``spring.datasource.type`` is missing, or it must have a specific value ``com.zaxxer.hikari.HikariDataSource``
5. If above all the steps conditions match, then @Bean HikariDataSource has gets created.

In a nutshell, if you have HikariCP on the classpath, then we will automatically get a HikariDataSource @Bean created.

If we have the DBCP2 library on application classpath (and Hikari excluded), then we will get the ``dbpc2`` connection pool.

```java
        @Configuration(proxyBeanMethods = false)
	@ConditionalOnClass(org.apache.commons.dbcp2.BasicDataSource.class)
	@ConditionalOnMissingBean(DataSource.class)
	@ConditionalOnProperty(name = "spring.datasource.type", havingValue = "org.apache.commons.dbcp2.BasicDataSource",
			matchIfMissing = true)
	static class Dbcp2 {

		@Bean
		@ConfigurationProperties(prefix = "spring.datasource.dbcp2")
		org.apache.commons.dbcp2.BasicDataSource dataSource(DataSourceProperties properties) {
			return createDataSource(properties, org.apache.commons.dbcp2.BasicDataSource.class);
		}

	}

```


And Spring Boot comes with a default Tomcat Servlet container which will run on port 8080. It follows the steps as below:

1. It needs to check if Tomcat is on the classpath (@ConditionalOnClass(Tomcat.class))
2. It will read specific properties in case if we specify them in ``application.properties`` like ``server.port``. By default tomcat run on port 8080, else it will override with the value being specified in .properties file.
3. Next Spring MVC's DispatcherServlet should register it with Tomcat, to make ``@RestController`` with their ``@GetMappings``, and ``@PostMappings`` work.
4. If all conditions match, the application should start with Embedded Tomcat Server and DispatcherServlet can forward the requests to specific controllers.

### Debugging Auto Configuration

There are two ways we can debug and find more information about auto-configuration.

1. By adding property debug logging property ``logging.level.org.springframework: DEBUG`` in ``application.properties`` or ``application.yaml`` file.

While starting an application, we can see an auto-configuration report printed in the log

```
=========================
AUTO-CONFIGURATION REPORT
=========================

Positive matches:
-----------------
DispatcherServletAutoConfiguration matched
 - @ConditionalOnClass classes found: org.springframework.web.servlet.DispatcherServlet (OnClassCondition)
 - found web application StandardServletEnvironment (OnWebApplicationCondition)


Negative matches:
-----------------
ActiveMQAutoConfiguration did not match
 - required @ConditionalOnClass classes not found: javax.jms.ConnectionFactory,org.apache.activemq.ActiveMQConnectionFactory (OnClassCondition)

AopAutoConfiguration.CglibAutoProxyConfiguration did not match
 - @ConditionalOnProperty missing required properties spring.aop.proxy-target-class (OnPropertyCondition)

```
2. Other way to debug by adding ``Spring Boot Actuator`` dependency along with HAL Explorer dependency to view the JSON report.

```xml
      <dependency>
	  <groupId>org.springframework.boot</groupId>
	  <artifactId>spring-boot-starter-actuator</artifactId>
      </dependency>

      <dependency>
	<groupId>org.springframework.data</groupId>
	<artifactId>spring-data-rest-hal-browser</artifactId>
     </dependency>
```
## 6. Conclusion

So Spring Boot is just a couple of Autoconfigurations classes that create @Beans for us if certain @Conditions are met.

Important Conditions are ``1. @ConditionalOnClass`` ``2. @ConditionalOnProperty`` ``3. @ConditioanlOnMissingBean``.

Lastly, ``Spring Framework`` is a set of tools that help you build Java Applications with manual ``configurations``.
On other hand ``Spring Boot`` builds on top of Spring Framework with ``Auto-Configurations``.

For more details we can refer to [Spring Boot documentation!](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)
