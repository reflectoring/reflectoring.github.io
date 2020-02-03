---

title: Multi-Tenancy Applications with Spring Boot and Flyway
categories: [spring-boot]
date: 2020-01-26 05:00:00 +1100
modified: 2020-01-26 05:00:00 +1100
author: artur
excerpt: "Flyway and Spring Boot provide us automated data migration with multiple data sources"
image:
  auto: 0058-multitenant
---

Multitenancy applications support work with different customers who want to separate their data from each other.
A multitenancy application uses the same business logic for all tenants but persists their data in different places.
If we want to make some changes to the database, we have to do it for every tenant.

This article shows a way how to do it with Flyway in a Spring Boot application.

{% include github-project.html url="https://github.com/arkuksin/flyway-multitenancy" %}

## General Approach
To work with multiple tenants in an application we'll have a look at how to:
1. bind an incoming request to a tenant,
2. provide the data source for the current tenant,
3. migrate SQL Scripts for all tenants if we want to make changes in the database or add a new tenant.

## Binding A Request to Tenant
When the application is used by many tenants, every tenant has his own data in the persistence. Also every tenant
sends requests to the application to execute the business logic and this logic must be applied to the data of tenant,
who sent the request. That's why we need to assign every request to an existing tenant. 
There are different ways to bind an incoming request to the tenant in the application:

* send a `tenantId` with a request as part of the URI,
* add a `tenantId` to the JWT token,
* include a `tenantId` field in the header of the HTTP request,
* and many more....

To keep it simple, let's consider the last option. We'll include a `tenantId` field in the header of the HTTP request.

In Spring Boot, to read the header from a request, we implement the `WebRequestInterceptor` interface. This interface allows us 
to intercept a request before it's received in the web controller:

```java
@Component
public class HeaderTenantInterceptor implements WebRequestInterceptor {

  public static final String TENANT_HEADER = "X-tenant";

  @Override
  public void preHandle(WebRequest request) throws Exception {
    ThreadTenantStorage.setTenantName(request.getHeader(TENANT_HEADER));
  }
  
  // other methods omitted

}
```
In the method `preHandle(WebRequest request)`, we read every request's `tenantId` from the header and forward it
to `ThreadTenantStorage`. 

`ThreadTenantStorage` is a storage that contains a `ThreadLocal` variable. By storing the `tenantId` in a `ThreadLocal` we can be sure that
every thread has its own copy of this variable and the current thread has no access to another `tenantId`:

```java
public class ThreadTenantStorage {

  private static ThreadLocal<String> currentTenant = new ThreadLocal<>();

  public static void setTenantName(String tenantName) {
    currentTenant.set(tenantName);
  }

  public static String getTenantName() {
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

There are different possibilities to separate data for different tenants. We'll have a look at two of them:
* using a different schema for each tenant,
* using a completely different database for each tenant.

From the application's perspective, schemas and databases are abstracted by a `DataSource`, so, in the code, we can handle these approaches in the same way.

In a Spring Boot application we usually configure the `DataSource` in `application.yaml` using properties with the prefix `spring.datasource`.
But we can define only one `DataSource` with these properties. To define multiple `DataSource`s we
need to use custom properties: 

```yaml
spring:
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
In this case, we configured data sources for two tenants: `vw` and `bmw`. If we assume that we have a fixed number of tenants
we can define the `Datasource`s for them as static data in `application.yml`. 

But we want to be able to add new tenants without building
the application again. So let's implement it dynamically.

Now we can bind the properties to a Spring Bean using `@ConfigurationProperties`:

```java
@Component
@ConfigurationProperties(prefix = "spring")
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
In the `DataSourceProperties` we build a `Map` with the datasource names as keys and the `DataSource`s as values.

Now we need a way to load the right data source for a tenant, depending on the `tenantId` from the HTTP request.
For this, we provide our Spring Boot application with a `DataSource` that wraps all of our tenant `DataSource`s:

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

We have only one `DataSource` in this configuration and it should be always the `DataSource` of the tenant from the
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

If we want to add a new tenant, we just put a new configuration in `application.yml` and restart the application
to trigger the SQL migration. If we don't want to rebuild the application [we can externalize the configuration](https://reflectoring.io/externalize-configuration/) of tenants.



## Conclusion

Spring Boot provides good means to implement a multi-tenant application. With interceptors, it's possible to bind
the request to a tenant. Spring Boot supports the work with many data sources and with Flyway we can migrate SQL
script to many data sources from one application.

