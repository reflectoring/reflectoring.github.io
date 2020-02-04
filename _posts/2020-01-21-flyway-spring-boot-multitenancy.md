---
title: Multitenancy Applications with Spring Boot and Flyway
categories: [spring-boot]
date: 2020-02-04 05:00:00 +1100
modified: 2020-02-04 05:00:00 +1100
author: artur
excerpt: "Multitenancy applications require a separate data store for each tenant. This guide shows how to configure a Spring Boot application with multiple data sources and how to switch between them depending on the tenant using the software. Using Flyway we can even upgrade the database schemas for all data sources at once."
image:
  auto: 0058-multitenant
---

Multitenancy applications allow different customers to work with the same application without seeing each other's data.
That means we have to set up a separate data store for each tenant.
And as if that's not hard enough, if we want to make some changes to the database, we have to do it for every tenant.

This article shows a way how to implement a Spring Boot application with a data source for each tenant and how to use Flyway to make updated to all tenant databases at once.

{% include github-project.html url="https://github.com/arkuksin/flyway-multitenancy" %}

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
```
In the method `preHandle(WebRequest request)`, we read every request's `tenantId` from the header and forward it
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

## Configuring A `DataSource` for Each Tenant

There are different possibilities to separate data for different tenants. We can

* use a different schema for each tenant, or
* use a completely different database for each tenant.

From the application's perspective, schemas and databases are abstracted by a `DataSource`, so, in the code, we can handle both approaches in the same way.

In a Spring Boot application we usually configure the `DataSource` in `application.yaml` using properties with the prefix `spring.datasource`.
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
```
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
```
In `DataSourceProperties`, we build a `Map` with the data source names as keys and the `DataSource` objects as values.
Now we can add a new tenant to `application.yaml` and the `DataSource` for this new tenant will be loaded automatically
by starting the application.  

The default configuration of Spring Boot has only one `DataSource`. In our case it should be always the `DataSource` of the tenant from the
request. We can achieve this by using `AbstractRoutingDataSource`. `AbstractRoutingDataSource`
can manage multiple `DataSource`s and routes over connections. We can extend `AbstractRoutingDataSource`
to route over our Car `Datasource`s.

```java
public class CarRoutingDataSource extends AbstractRoutingDataSource {

  private static final String DEFAULT_TENANT = "vw";

  @Override
  protected Object determineCurrentLookupKey() {
    return ObjectUtils.defaultIfNull(ThreadTenantStorage.getTenantName(), DEFAULT_TENANT);
  }
}
````
The `CarRoutingDataSource` will call `determineCurrentLookupKey` whenever it gets a new connection.
The current tenant has been set to `ThreadTenantStorage`, so the method `determineCurrentLookupKey `
returns this current tenant, the `CarRoutingDataSource` find the `DataSource` of this tenant and set it as current
`DataSource` automatically. It means every access to data from the thread will be routed to this `Datasource`.

Now we need a way to load the right data source for a tenant, depending on the `tenantId` from the HTTP request.
For this, we provide our Spring Boot application with a `DataSource` that wraps all of our tenant `DataSource`s.
As described above, the `CarRoutingDataSource` takes care about providing the right `DataSource`:

```java
@Configuration
public class DataSourceConfiguration {

  private final DataSourceProperties dataSourceProperties;

  public DataSourceConfiguration(DataSourceProperties dataSourceProperties) {
    this.dataSourceProperties = dataSourceProperties;
  }

  @Bean
  @PostConstruct
  public DataSource dataSource() {
    CarRoutingDataSource customDataSource = new CarRoutingDataSource();
    customDataSource.setTargetDataSources(dataSourceProperties.getDatasources());
    return customDataSource;
  }
}
```

## Migrating SQL Schemas with Multiple Tenants

If we want to have version control over the database with Flyway and make changes in it like adding a column, adding a table,
dropping a constraint and so on, we have to write SQL scripts. With the Flyway support for Spring Boot we just need
to deploy the application and new scripts are being executed to migrate the database to the new state. By default, Flyway uses the current `DataSource`.

But we want to apply the scripts to all `DataSource`s we defined in the application.
We didn't define static `Datasource`s, but we put them in a `Map` in the `DataSourceProperties`, so now we can iterate
over them.

```java
@Configuration
public class DataSourceConfiguration {

  private final DataSourceProperties dataSourceProperties;

  public DataSourceConfiguration(DataSourceProperties dataSourceProperties) {
    this.dataSourceProperties = dataSourceProperties;
  }

  @Bean
  @PostConstruct
  public DataSource dataSource() {

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

Now, every time when the application starts, the SQL scripts are migrated for every `DataSource`.

If we want to add a new tenant, we just put a new configuration in `application.yaml` and restart the application
to trigger the SQL migration. If we don't want to rebuild the application [we can externalize the configuration](https://reflectoring.io/externalize-configuration/) of tenants.



## Conclusion

Spring Boot provides good means to implement a multi-tenant application. With interceptors, it's possible to bind
the request to a tenant. Spring Boot supports the work with many data sources and with Flyway we can migrate SQL
script to many data sources from one application.

