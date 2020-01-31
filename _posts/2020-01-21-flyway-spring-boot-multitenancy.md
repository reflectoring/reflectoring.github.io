---

title: Flyway Migration in a Spring Boot Application with Multitenancy
categories: [spring-boot]
date: 2020-01-26 05:00:00 +1100
modified: 2020-01-26 05:00:00 +1100
author: artur
excerpt: "Flyway and Spring Boot provide us automated data migration with multiple data sources"
image:
  auto: 0058-multitenant
---

Multitenancy applications support work with different customers, who want to separate their data from each other.
A multitenancy application uses the same business logic for all tenants but persists their data in different places.
If we want to make some changes to the database, we have to do it for every tenant.

This article shows a way how to do it with Flyway in a Spring Boot application.

{% include github-project.html url="https://github.com/arkuksin/flyway-multitenancy" %}

## General approach
To work with multiple tenants in an application we will have a look at how to:
1. bind an incoming request to a tenant,
2. provide the data source for the current tenant,
3. migrate SQL Scripts for all tenants if we want to make changes in the database or add a new tenant.

## Multitenancy in relational databases
There are different possibilities to separate data for tenants. We will have a look at two of them:
* use different schemas for tenants,
* use different databases for tenants.

From the application's perspective of view, both of them are `DataSource`s, so we can handle these approaches in the same way.

## Binding Request to Tenant
There are also different ways to bind an incoming request to the tenant in the application. For Example
* send `tenantId` with a request as part of the URI,
* add `tenantId` to the JWT token,
* send `tenantId` as a header of the HTTP request and so on.

To keep it simple, let's consider the last option with sending `tenantId` as a header of the HTTP request.
To read the header from the request we implement `WebRequestInterceptor` interface. This interface defines 
an interceptor that is executed before the request is received in the `Controller`.

```java
@Component
public class HeaderTenantInterceptor implements WebRequestInterceptor {

    public static final String TENANT_HEADER = "X-tenant";

    @Override
    public void preHandle(WebRequest request) throws Exception {
        ThreadTenantStorage.setTenantName(request.getHeader(TENANT_HEADER));
    }
}
```
Every incoming request is proceeded in the method `preHandle(WebRequest request)`. The tenant from the header is set
to `ThreadTenantStorage`. `ThreadTenantStorage` is a storage, that contains a `ThreadLocal` variable. With `ThreadLocal` we can be sure, that
every thread has its copy of this variable and the current thread has no access to a `ThreadLocal`
of another tenant.

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

The last step in the configuration of tenant binding is to register the interceptor in the `WebMvcConfigurer`

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

## Multiple Data Source Configuration

Normally we define the `DataSource` configuration in `application.yaml` using properties `spring.datasource`.
But we can define only one `DataSource` with these properties. To load multiple `DataSource`s we
can customize properties. 

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
In this case, two data sources are configured: `vw` and `bmw`. If we assume, that we had a fixed number of tenants
we could define the `Datasource`s for them as static data. But we want to be able to add new tenants without building
the application again. So let's implement it dynamically.
Now we can bind the properties to a Spring Bean using `@ConfigurationProperties`.
In the `DataSourceProperties` we built a `Map` with the names of  a `DataSource` 
as key and the `DataSource`s itself as value.

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
Now we can define the data source configuration for multiple `DataSource`s.

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

## Migration of SQL scripts with multiple data sources

If we want to have version control over the database with Flyway and make changes in it like adding a column, adding a table,
dropping a constraint and so on, we have to write SQL script. With the Flyway support for Spring Boot we just need
to deploy the application and new scripts are migrated. By default, Flyway uses the current `DataSource`.
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

Every time when the application starts, the SQL scripts are migrated to every `DataSource`.

If we want to add a new tenant, we just put a new configuration in `application.yaml` and restart the application
to trigger the SQL migration. If we don't want to rebuild the application we can externalize the configuration of tenants.



## Conclusion

Spring Boot provides good means to implement a multitenant application. With the Spring Interceptors, it is possible to bind
the request to a tenant. Spring Boot supports the work with many data sources and with Flyway we can migrate SQL
script to many data sources from one application.

