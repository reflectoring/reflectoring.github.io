---
title: "Production Health Check of Spring Boot Applications"
categories: [spring-boot]
date: 2020-09-07 06:00:00 +1000
modified: 2020-09-07 06:00:00 +1000
author: pratikdas
excerpt: "Monitoring and observability are essential attributes of applications running in distributed environments. Spring Boot comes with the Actuator module which provides the health status and integrates with Micrometer to emit metrics. We will build health check functions in Spring Boot applications and make them observable by capturing useful health metrics and integrate with popular monitoring and visualization tools - Prometheus and Grafana."
image:
  auto: 0074-stack
---

Monitoring and observability are essential attributes of applications running in distributed environments but they are invariably reliant on effective health checking mechanisms built in the component applications and useful metrics that can be observed at runtime. 

Spring Boot is one of the popular frameworks for building microservices. We will build health check functions in Spring Boot applications and make them observable by capturing useful health metrics and integrate with popular monitoring and visualization tools - Prometheus and Grafana.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-health-check" %}

## Why Do we use Health Check?
A distributed system is composed of many moving parts like database, queues, other services, and all of them are subject to the vagaries of the surrounding infrastructure. **Health check functions tell us the status of our running application like whether the service is slow or not available.**

We also learn to predict the system health in the future by observing any anomalies in a series of metrics like memory utilization, errors, and disk space. This allows us to take mitigating actions like restarting instances, falling back to a redundant instance, or throttling the incoming requests. **Timely Detection and proactive mitigations will ensure that the application is stable thereby minimizing any impact on business functions.**

Apart from infrastructure and operation teams, Health Check metrics and insights derived from them are also becoming useful to the end-users. In an API ecosystem, for instance, comprising API developers, partners, and third-party developers, the health status of APIs is regularly updated and published in a dashboard. Giving below a health check dashboard of twitter APIs:![twitter API Health Status](/assets/img/posts/spring-boot-health-check/twitter-api-health-status.png)

The dashboard gives a snapshot of the health status of the Twitter APIs as Operational, Degraded Performance, etc helping us to understand the behavior of our applications consuming those APIs.

## Common Health Checking Techniques

The simplest way of implementing a health check is to periodically check the “heartbeat” of a running application by sending requests to some its API endpoints and getting a response payload containing the health of the system. 

These heartbeat endpoints are HTTP Get or Head requests that run light-weight processes and do not change the state of the system. The response is interpreted from either the HTTP response status like 200 or 201 indicating success or from specific fields in the response payload. 

Although this method can tell us if the application itself is up and running, it does not tell us anything about the services that the application depends on like a database, or another service. So a composite Health Check comprising the health of dependent systems aggregated together gives a more complete view. 

**A more proactive approach involves monitoring a set of metrics indicating system health. These are more useful since they give us early indications of any deteriorating health of the system giving us time to take mitigating measures.**

We will look at all of these approaches in the subsequent sections.


## Adding Health Check in Spring Boot Applications
We will build a few APIs with Spring Boot and devise mechanisms to check and monitor their health.

Let us create our application with the [Spring Initializer](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.3.3.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik.healthcheck&artifactId=usersignup&name=usersignup&description=Demo%20project%20for%20Spring%20Boot%20Health%20Check&packageName=io.pratik.healthcheck.usersignup&dependencies=web,actuator,lombok) by including the dependencies for web,lombok, and actuator. 


### Adding the Actuator Dependency

One of the more interesting endpoints provided by Actuator is /health. 

The Actuator module provides useful insight into the Spring environment for a running application with functions for health checking and metrics gathering by exposing multiple endpoints over HTTP and JMX. We can refer to the full description of the Actuator module in the [Actuator Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/production-ready-features.html).

We added the `actuator` dependency while creating the application from the `initializor`. We can choose to add it later in our `pom.xml` if we are using the Maven build tool :

```xml
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
```

For gradle, we add our dependency as :
```
dependencies {
  compile("org.springframework.boot:spring-boot-starter-actuator")
}
```
### Checking the Health Status with Zero Configuration
We will first build our application created with the Spring Initializer above with Maven or Gradle :
```shell
mvn clean package
```
Running this command will generate the executable in the `fat jar` format containing the `actuator` module. Let us execute this jar with :

```shell
java -jar target/usersignup-0.0.1-SNAPSHOT.jar
```
We will now run the application and access the health endpoint using `curl` or by hitting the URL from the browser:
```shell
curl http://localhost:8080/actuator/health
```
Running the curl command gives the output:
```shell
{"status":"UP"}
```
The status - `UP` indicates the application is running. The status will show DOWN if the application becomes unhealthy anytime during the run. This endpoint indicates the general health of the application.

### Checking the Details of Health Status
To view some more information about the application's health, we will enable the property `management.endpoint.health.show-details` in `application.properties`:

```application.properties
# Show details of health endpoint
management.endpoint.health.show-details=always
```
After we compile and run the application, we get the output with details of the components contributing to the health status:
```json
{
   "status": "UP",
   "components": {
      "diskSpace": {
         "status": "UP",
         "details": {
            "total": 250685575168,
            "free": 12073996288,
            "threshold": 10485760,
            "exists": true
         }
      },
      "ping": {
         "status": "UP"
      }
   }
}
```
We can see in this output that the health status is comprised of one component named `diskspace` which is `healthy` as indicated by `status` -`UP` with details containing the `total`, `free`, and `threshold` space.

## Aggregating Health Status from Multiple Health Indicators 

Let us add some real-life flavor to our application by adding some APIs that will not only store information in a database but also read from it. We will create three APIs by adding a `controller`, `service`, and `repository` class. The `repository` is based on JPA and uses the in-memory H2 database. 

### Health Status Including Health of Database
After we build and run our application as before and check the health status, we can see one additional component for the database named `db` included under the `components` key:
```json
{
   "status": "UP",
   "components": {
      "db": {
         "status": "UP",
         "details": {
            "database": "H2",
            "validationQuery": "isValid()"
         }
      },    
      "diskSpace": {
         "status": "UP",
         "details": {
            "total": 250685575168,
            "free": 12073996288,
            "threshold": 10485760,
            "exists": true
         }
      },
      "ping": {
         "status": "UP"
      }
   }
}
```
As we can see from the output the health status is composed of status contributed by multiple components called 'Health Indicator' in the Actuator vocabulary. In our case, our health status is composed of health indicators of diskspace and database.

### Construct of a Health Indicator
Spring Boot Actuator comes with several predefined health indicators like DataSourceHealthIndicator, MongoHealthIndicator, RedisHealthIndicator, CassandraHealthIndicator, etc. Each of them is a class with `Component` annotation that implements the HealthIndicator interface and checks the health of that component. 

By default, all standard components (such as DataSource) implement this interface. The HealthCheck provided by a DataSource is to make a connection to a database and perform a simple query, such as select 1 from dual for instance, against an Oracle DataBase.

These health indicators are used as part of the health check-up process. If our application uses Redis, the RedisHealthIndicator is used for the health check. The MongoHealthIndicator is used for health check if our application uses MongoDB, so on. 

### Aggregating Health Indicators
The aggregation is done by an implementation of StatusHealthAggregator which aggregates the statuses from each health indicator into a single overall status.

Spring Boot auto-configures an instance of SimpleHealthAggregator. We can provide our implementation of StatusHealthAggregator to supersede the default behavior. 

We can also disable a particular health indicator using application properties :
```
management.health.mongo.enabled=false
```

## Checking Health of APIs with Custom Health Indicators
Predefined Health Indicators do not cover all use cases of Health Check. For example, if our API is dependent on any external service, we might like to know if the external service is available. 

In our example, we are using an external service for shortening the URLs. We will monitor the availability of this service by building our health indicator. 

Creating custom health indicators is done in two steps:
1. Implement the HealthIndicator interface and override the health method.
2. Register the health indicator class as Spring Bean by adding the `component` annotation.

Our custom Health Indicator for UrlShortener Service looks like this:

```java
@Component
@Slf4j
public class UrlShortenerServiceHealthIndicator implements HealthIndicator, HealthContributor {

  private static final String URL = "https://cleanuri.com/api/v1/shorten";

  @Override
  public Health health() {
    // check if url shortener service url is reachable
        try {
            URL url = new URL(URL);
            int port = url.getPort();
            if (port == -1) {
                port = url.getDefaultPort();
            }

            try (Socket socket = new Socket(url.getHost(), port)) {
            } catch (IOException e) {
                log.warn("Failed to connect to : {}", URL);
                return Health.down().withDetail("error", e.getMessage()).build();
            }
        } catch (MalformedURLException e1) {
            log.warn("Invalid URL: {}",URL);
            return Health.down().withDetail("error", e1.getMessage()).build();
        }

        return Health.up().build();
  }
```
In this class, we return the status as "UP" if the URL is reachable, otherwise we return the "DOWN" status with an error message.

We can further increase the accuracy of the health checks by checking specific resources on a per API basis. 

In the previous section, we added three APIs to our application. It will be very useful to see the health of the APIs as part of our health check. We will do this by building a specific health indicator for our API. The health status of our API will be "UP" only if the resources like the database and external service on which it depends are available:

A snippet of the `FetchUsersAPIHealthIndicator` is given below:
```java
@Component("FetchUsersAPI")
@Slf4j
public class FetchUsersAPIHealthIndicator implements HealthIndicator {

  private static final String URL = "https://cleanuri.com/api/v1/shorten";

  @Autowired
    private DataSource ds;
    
  @Override
  public Health health() {
    
    Health dbHealth = dbIsHealthy();
    Health serviceHealth = externalServiceIsHealthy();
    
    if(Status.UP.equals(dbHealth.getStatus())) {
      if(Status.UP.equals(serviceHealth.getStatus())) {
         return Health.up().build();
      }else {
        return serviceHealth;
      }
    }else {
        return dbHealth;
    }
  }

```
In the health method, we check the health of the database by executing a query and checking the reachability of our external service.

With this health indicator of the API added, our health check output now contains the health status of `FetchUsers` API in the list of components.

```json
{
   "status": "UP",
   "components": {
      "FetchUsersAPI": {
         "status": "UP"
      },
      ...
}
```
The corresponding error output appears as: 
```json
{
   "status": "UP",
   "components": {
      "FetchUsersAPI": {
         "status": "OUT_OF_SERVICE",
         "details": {
            "error": "org.h2.jdbc.JdbcSQLSyntaxErrorException: Table \"USER\" not found; ..."
         }
      },
```
This output indicates that the API is out of service and cannot serve requests when the database is not set up.

Health Indicators can also be grouped for specific purposes. For example, we can have a group for database health and another for the health of our caches.


## Monitoring Application Health

We monitor the health of our application by observing a set of metrics. We will enable the metrics endpoint to get many useful metrics like JVM memory consumed, CPU usage, open files, and many more.

Micrometer is a library for collecting metrics from JVM-based applications and converting them in a format accepted by the monitoring tools. It is a facade between application metrics and the metrics infrastructure developed by different monitoring systems like Prometheus, New Relic, and [many others](https://docs.spring.io/spring-boot/docs/current/reference/html/production-ready-features.html#production-ready-metrics). 

To illustrate, we will integrate our Spring Boot application with one of these monitoring systems - Prometheus. Prometheus operates on a pull model by scraping metrics from an endpoint exposed by the application instances at fixed intervals.

We will first add the micrometer SDK for Prometheus:
```xml
    <dependency>
      <groupId>io.micrometer</groupId>
      <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>

```
We can integrate with another monitoring system like New Relic similarly by adding `micrometer-registry-newrelic` dependency for metric collection. New Relic in contrast to Prometheus works on a push model so we need to additionally configure credentials for New Relic in Spring Boot application.

Continuing with our example with Prometheus, we will expose the Prometheus endpoint by updating the `management.endpoints.web.exposure.include` property in our application.properties.

```application.properties
management.endpoints.web.exposure.include=health,info,prometheus
```
Next, we will add the job in Prometheus with the configuration for scraping the metrics from our application.
```yml
  - job_name: 'user sign up'
    metrics_path: '/actuator/prometheus'
    scrape_interval: 5s
    static_configs:
    - targets: ['<HOST_NAME>:8080']
```
This configuration will scrape the metrics at 5-second intervals.

We will use Docker to run Prometheus:
```shell
docker run \
-p 9090:9090 \
-v prometheus-config.yml:/etc/prometheus/prometheus.yml \
prom/prometheus
```
Now we can check our application as a target in Prometheus:
![Prometheus Targets](/assets/img/posts/spring-boot-health-check/prometheus-ss.png)

As stated above, due to the Micrometer metrics facade we can integrate with other [monitoring tools](https://docs.spring.io/spring-boot/docs/current/reference/html/production-ready-features.html#production-ready-metrics) only by adding the provider-specific Micrometer dependency to the application. 

## Visualizing Application Health
It is easier to understand the metrics with the help of graphs and dashboards which enable us to see the trends over different time windows. We will visualize the metrics collected by our application using Grafana.

![Grafana Dashboard](/assets/img/posts/spring-boot-health-check/grafana-ss.png)

We are using a standard JVM dashboard to view our application metrics.

## Configuring Kubernetes Probes
Microservices built with Spring Boot are commonly packaged in containers and deployed to container orchestration systems like Kubernetes. One of the key features of Kubernetes is self-healing, which it does by regularly checking the health of the application. 

The container is replaced with a healthy instance, anytime it goes down. This is detected using two properties:
\
**Liveness Check**: An endpoint indicating that the application is available. The Kubelet process uses liveness probes to know when to restart a container.
**Readiness Check**: The Kubelet process of Kubernetes uses readiness probes to know when a container is ready to start accepting traffic. 

We will enable these two health checks by setting the property in application.properties.
```
management.health.probes.enabled=true
```
After this when we compile and run the application, we can see these two health checks in the output of the health endpoint and also two health groups.

![Health Groups](/assets/img/posts/spring-boot-health-check/healthprobes-k8s.png)

We can next use these two endpoints to configure Http probes for liveness and readiness checks in Kubernetes: 

```yml
.
.
livenessProbe:  
    httpGet:  
      path: /actuator/health/liveness  
      port: 8000  
readinessProbe:  
    httpGet:  
      path: /actuator/health/readiness  
      port: 8000  
```            
For the HTTP probe, the Kubelet process sends an HTTP request to the specified path and port to perform the liveness and readiness checks.


## Conclusion

We saw how we can build powerful monitoring and observability capabilities in Spring Boot applications with the help of the Actuator module. We configured health indicators and Kubernetes probes in a microservice application and enabled health check metrics to integrate with monitoring tool and visualization tool - Prometheus and Grafana.

Observability is a rapidly evolving area and we should expect to see more features along these lines in future releases of Spring Boot.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-health-check).