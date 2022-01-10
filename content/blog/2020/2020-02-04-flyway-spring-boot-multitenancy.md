---
title: Multitenancy Applications with Spring Boot and Flyway
categories: ["Spring Boot"]
date: 2020-02-04T05:00:00
modified: 2020-02-04T05:00:00
authors: [artur]
excerpt: "Multitenancy applications require a separate data store for each tenant. This guide shows how to configure a Spring Boot application with multiple data sources and how to switch between them depending on the tenant using the software. Using Flyway we can even upgrade the database schemas for all data sources at once."
image: images/stock/0059-library-1200x628-branded.jpg
url: flyway-spring-boot-multitenancy
---

Multitenancy applications allow different customers to work with the same application without seeing each other's data.
That means we have to set up a separate data store for each tenant.
And as if that's not hard enough, if we want to make some changes to the database, we have to do it for every tenant.

This article shows a way **how to implement a Spring Boot application with a data source for each tenant and how to use Flyway to make updates to all tenant databases at once**.

{{% github "https://github.com/arkuksin/flyway-multitenancy" %}}

## General Approach
To work with multiple tenants in an application we'll have a look at:
1. how to bind an incoming request to a tenant,
2. how to provide the data source for the current tenant, and
3. how to execute SQL scripts for all tenants at once.

## Binding a Request to a Tenant
When the application is used by many different tenants, every tenant has their own data. This means that
the business logic executed with each request sent to the application must work with the data of the tenant
who sent the request. 

**That's why we need to assign every request to an existing tenant.**
 
There are different ways to bind an incoming request to a specific tenant:

* sending a `tenantId` with a request as part of the URI,
* adding a `tenantId` to the JWT token,
* including a `tenantId` field in the header of the HTTP request,
* and many more....

To keep it simple, let's consider the last option. **We'll include a `tenantId` field in the header of the HTTP request.**

In Spring Boot, to read the header from a request, we implement the `WebRequestInterceptor` interface. This interface allows us 
to intercept a request before it's received in the web controller:

```java
@Component
public class HeaderTenantInterceptor implements WebRequestInterceptor {

  public static final String TENANT_HEADER = "X-tenant";

  @Override
  public void preHandle(WebRequest request) throws Exception {
    ThreadTenantStorage.setId(request.getHeader(TENANT_HEADER));
  }
  
  // other methods omitted

}
```text
In the method `preHandle()`, we read every request's `tenantId` from the header and forward it
to `ThreadTenantStorage`. 

`ThreadTenantStorage` is a storage that contains a `ThreadLocal` variable. By storing the `tenantId` in a `ThreadLocal` we can be sure that
every thread has its own copy of this variable and that the current thread has no access to another `tenantId`:

```java
public class ThreadTenantStorage {

  private static ThreadLocal<String> currentTenant = new ThreadLocal<>();

  public static void setTenantId(String tenantId) {
    currentTenant.set(tenantId);
  }

  public static String getTenantId() {
    return currentTenant.get();
  }

  public static void clear(){
    currentTenant.remove();
  }
}
```

The last step in configuring the tenant binding is to make our interceptor known to Spring:

```java
@Configuration
public class WebConfiguration implements WebMvcConfigurer {

  private final HeaderTenantInterceptor headerTenantInterceptor;

  public WebConfiguration(HeaderTenantInterceptor headerTenantInterceptor) {
    this.headerTenantInterceptor = headerTenantInterceptor;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addWebRequestInterceptor(headerTenantInterceptor);
  }
}
```

<div class="notice success">
  <h4>Don't Use Sequential Numbers as Tenant IDs!</h4>
  <p>
  Sequential numbers are easy to guess. All you have to do as a client is to add or subtract from your own <code>tenantId</code>, modify the HTTP header, and voilá, you'll have access to another tenant's data.
  </p>
  <p>
  Better use a UUID, as it's all but impossible to guess and people won't accidentally confuse one tenant ID with another. <strong>Better yet, verify that the logged-in user actually belongs to the specified tenant in each request.</strong> 
  </p>
</div>

## Configuring a `DataSource` For Each Tenant

There are different possibilities to separate data for different tenants. We can

* use a different schema for each tenant, or
* use a completely different database for each tenant.

From the application's perspective, schemas and databases are abstracted by a `DataSource`, so, in the code, we can handle both approaches in the same way.

In a Spring Boot application, we usually configure the `DataSource` in `application.yaml` using properties with the prefix `spring.datasource`.
But we can define only one `DataSource` with these properties. To define multiple `DataSource`s we
need to use custom properties in `application.yaml`: 

```yaml
tenants:
  datasources:
    vw:
      jdbcUrl: jdbc:h2:mem:vw
      driverClassName: org.h2.Driver
      username: sa
      password: password
    bmw:
      jdbcUrl: jdbc:h2:mem:bmw
      driverClassName: org.h2.Driver
      username: sa
      password: password
```text
In this case, we configured data sources for two tenants: `vw` and `bmw`. 

To get access to these `DataSource`s in our code, we can bind the properties to a Spring bean using [`@ConfigurationProperties`](/spring-boot-configuration-properties/):

```java
@Component
@ConfigurationProperties(prefix = "tenants")
public class DataSourceProperties {

  private Map<Object, Object> datasources = new LinkedHashMap<>();

  public Map<Object, Object> getDatasources() {
    return datasources;
  }

  public void setDatasources(Map<String, Map<String, String>> datasources) {
    datasources
        .forEach((key, value) -> this.datasources.put(key, convert(value)));
  }

  public DataSource convert(Map<String, String> source) {
    return DataSourceBuilder.create()
        .url(source.get("jdbcUrl"))
        .driverClassName(source.get("driverClassName"))
        .username(source.get("username"))
        .password(source.get("password"))
        .build();
  }
}
```text
In `DataSourceProperties`, we build a `Map` with the data source names as keys and the `DataSource` objects as values.
Now we can add a new tenant to `application.yaml` and the `DataSource` for this new tenant will be loaded automatically
when the application is started.  

The default configuration of Spring Boot has only one `DataSource`. In our case, however, **we need a way to load the right data source for a tenant, depending on the `tenantId` from the HTTP request**. We can achieve this by using an `AbstractRoutingDataSource`. 

`AbstractRoutingDataSource` can manage multiple `DataSource`s and routes between them. We can extend `AbstractRoutingDataSource`
to route between our tenants' `Datasource`s:

```java
public class TenantRoutingDataSource extends AbstractRoutingDataSource {

  @Override
  protected Object determineCurrentLookupKey() {
    return ThreadTenantStorage.getTenantId();
  }

}
````text
The `AbstractRoutingDataSource` will call `determineCurrentLookupKey()` whenever a client requests a connection.
The current tenant is available from `ThreadTenantStorage`, so the method `determineCurrentLookupKey()`
returns this current tenant. This way, `TenantRoutingDataSource` will find the `DataSource` of this tenant and return a connection to this data source automatically.

Now, we have to replace Spring Boot's default `DataSource` with our `TenantRoutingDataSource`:

```java
@Configuration
public class DataSourceConfiguration {

  private final DataSourceProperties dataSourceProperties;

  public DataSourceConfiguration(DataSourceProperties dataSourceProperties) {
    this.dataSourceProperties = dataSourceProperties;
  }

  @Bean
  public DataSource dataSource() {
    TenantRoutingDataSource customDataSource = new TenantRoutingDataSource();
    customDataSource.setTargetDataSources(
        dataSourceProperties.getDatasources());
    return customDataSource;
  }
}
```

To let the `TenantRoutingDataSource` know which `DataSource`s to use, we pass the map `DataSource`s from our `DataSourceProperties` into `setTargetDataSources()`. 

That's it. Each HTTP request will now have its own `DataSource` depending on the `tenantId` in the HTTP header.

## Migrating Multiple SQL Schemas at Once

If we want to have version control over the database state with Flyway and make changes to it like adding a column, adding a table, or
dropping a constraint, we have to write SQL scripts. With Spring Boot's Flyway support we just need
to deploy the application and new scripts are executed automatically to migrate the database to the new state. 

To enable Flyway for all of our tenants' data sources, first we have do disable the preconfigured property for automated Flyway migration in `application.yaml`:

```yaml
spring:
  flyway:
    enabled: false
```text
If we don't do this, Flyway will try to migrate scripts to the current `DataSource` when starting the application. But during startup, we don't have a current tenant, so `ThreadTenantStorage.getTenantId()` would return `null` and the application would crash.

Next, we want to apply the Flyway-managed SQL scripts to all `DataSource`s we defined in the application.
We can iterate over our `DataSource`s in a `@PostConstruct` method: 

```java
@Configuration
public class DataSourceConfiguration {

  private final DataSourceProperties dataSourceProperties;

  public DataSourceConfiguration(DataSourceProperties dataSourceProperties) {
    this.dataSourceProperties = dataSourceProperties;
  }

  @PostConstruct
  public void migrate() {
    for (Object dataSource : dataSourceProperties
          .getDatasources()
          .values()) {
      DataSource source = (DataSource) dataSource;
      Flyway flyway = Flyway.configure().dataSource(source).load();
      flyway.migrate();
    }
  }

}
```

Whenever the application starts, the SQL scripts are now executed for each tenant's `DataSource`.

If we want to add a new tenant, we just put a new configuration in `application.yaml` and restart the application
to trigger the SQL migration. The new tenant's database will be updated to the current state automatically.  

If we don't want to re-compile the application for adding or removing a tenant, [we can externalize the configuration](https://reflectoring.io/externalize-configuration/) of tenants (i.e. not bake `application.yaml` into the JAR or WAR file). Then, all it needs to trigger the Flyway migration is a restart.

## Conclusion

Spring Boot provides good means to implement a multi-tenant application. With interceptors, it's possible to bind
the request to a tenant. Spring Boot supports working with many data sources and with Flyway we can execute SQL
scripts across all of those data sources.

You can find the code examples [on GitHub](https://github.com/arkuksin/flyway-multitenancy).

