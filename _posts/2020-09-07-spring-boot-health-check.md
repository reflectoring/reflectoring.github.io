---
title: "Production Health Check of Spring Boot Applications"
categories: [spring-boot]
date: 2020-09-07 06:00:00 +1000
modified: 2020-09-07 06:00:00 +1000
author: pratikdas
excerpt: "Developing a Spring Boot App Against AWS Services with LocalStack"
image:
  auto: 0074-stack
---

Monitoring and observability are essential attributes of applications running in distributed environments but they are invariably reliant on effective health checking mechanisms built in the component applications. 

Spring Boot is one of the popular frameworks for building microservices. We will look at building health check functions in Spring Boot applications.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-health-check" %}

## Why Do we use Health Check?
A distributed system is composed of many moving parts like database, queues, other services, and all of them are subject to the vagaries of the surrounding infrastructure. Health check functions will tell us the status of our running application like whether the service is slow or not available. This will allow us to take mitigating actions like falling back to a redundant instance or throttle the incoming requests. Timely Detection and proactive mitigations will ensure that the application is stable thereby minimizing any impact on business functions.

Health Check also plays an important role in the API ecosystem comprising API developers, partners, and third-party developers. The health status of APIs is regularly updated and published in a dashboard. Giving below health check dashboards from twitter APIs:[twitter API Health Status](/assets/img/posts/spring-boot-health-check/twitter-api-health-status.png)
## Common Health Checking Techniques

The simplest way of implementing a health check is to periodically check the “heartbeat” of a running application by sending requests to some its API endpoints and getting a response payload containing the health of the system. These heartbeat endpoints are HTTP Get or Head requests that run light-weight processes and do not change the state of the system. The response is interpreted from either the HTTP response status like 200 or 201 indicating success or from specific fields in the response payload. 

Although this method can tell us if the application itself is up and running, it does not tell us anything about the many services that the application depends on (for example, a database, cache, or another running service), even though these dependencies are critical for its functioning. So a better way is to use a composite health check. 

A proactive approach involves monitoring a set of metrics indicating system health. These are more useful since they give us early indications of any deteriorating health of the system giving us time to take mitigating measures.

We will look at all of these approaches in the subsequent sections.


## Adding Health Check in Spring Boot Applications
We will build a few APIs and devise mechanisms to check and monitor their health.

Let us first create our application with the [Spring Initializer](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.3.3.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik.healthcheck&artifactId=usersignup&name=usersignup&description=Demo%20project%20for%20Spring%20Boot%20Health%20Check&packageName=io.pratik.healthcheck.usersignup&dependencies=web,actuator,webflux) by including the dependencies for web, actuator, and webflux. We next create a `signup` API by adding a `service` class.


### Adding the Actuator Dependency

The `actuator` module provides functions for health check, metrics gathering, http tracing by exposing multiple endpoints over HTTP and JMX. We added the `actuator` dependency while creating the application from the `initializor`. We can choose to add it later in our `pom.xml` if we are using the Maven build tool :

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
### Checking the Default Health Status
We will build our application:
```shell
mvn clean package
```
Running this command will generate the executable jar in the fat jar format. We will execute this jar with :

```shell
java -jar target/usersignup-0.0.1-SNAPSHOT.jar
```
We will now run the application and access the health endpoint using `curl` or by hitting the url from the browser:
```shell
curl http://localhost:8080/actuator/health
```
Running the curl command gives the output:
```shell
{"status":"UP"}
```
The status - UP indicates the application is running. This default health check aggregates health status. The status will show DOWN if the application becomes unhealthy anytime during the run. 

### Checking the Details of Health Status
We will enable the details by adding the property `management.endpoint.health.show-details`:

```application.properties
# Show details of health endpoint
management.endpoint.health.show-details=always
```

```shell
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

## Actuator Components

- HealthContributorRegistry
- HealthContributors
  - HealthIndicator
  - CompositeHealthContributor
- StatusAggregator 
- Endpoints : **Every actuator endpoint can be explicitly enabled and disabled. The endpoints also need to be exposed over HTTP or JMX to make them remotely accessible.** Only the health and info endpoints are exposed over HTTP by default.

Spring Boot Actuator comes with several predefined health indicators like DataSourceHealthIndicator, DiskSpaceHealthIndicator, MongoHealthIndicator, RedisHealthIndicator, CassandraHealthIndicator etc. It uses these health indicators as part of the health check-up process.

For example, If your application uses Redis, the RedisHealthIndicator will be used as part of the health check-up. If your application uses MongoDB, the MongoHealthIndicator will be used as part of the health check-up and so on.

You can also disable a particular health indicator using application properties like so -
```
management.health.mongo.enabled=false
```
But by default, all these health indicators are enabled and used as part of the health checking process.



## Composite Health Check 
There is a Spring Boot add-on known as Actuator which provides a useful insight into the Spring environment for a running application. It has several endpoints, and a full discussion of this functionality can be found in the Actuator Documentation

One of the more interesting endpoints provided by Actuator is /health. This endpoint will provide an indication of the general health of the application, and for each of the @Component classes that implement the HealthIndicator interface, will actually check the health of that component. By default, all standard components (such as DataSource) implement this interface. The HealthCheck provided by a DataSource is to make a connection to a database and perform a simple query, such as select 1 from dual against an Oracle DataBase.

Health Indicators can be grouped for specific purposes. For example, we can have a group for database health and another for the health of our caches.


## Monitoring Application Health

We monitor the health of our application by observing a set of metrics. We will enable the metrics endpoint to get many useful metrics like JVM memory consumed, CPU usage, open files, and many more.
Micrometer is a library for collecting metrics from JVM-based applications and converting them in a format accepted by the monitoring tools. It is actually a facade between application metrics and the metrics infrastructure developed by different providers like Prometheus, New Relic, and others. 

To illustrate, we will integrate our Spring Boot application with one of these monitoring systems - Prometheus. Prometheus operates on a pull model by scraping metrics from an endpoint exposed by the application instances at fixed intervals.

We will add the 
```xml
    <dependency>
      <groupId>io.micrometer</groupId>
      <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>

```
We can integrate with another monitoring system like New Relic in a similar way by adding `micrometer-registry-newrelic` dependency for metric collection. New Relic in contrast to Prometheus works on a push model so we need to additionally configure credentials for New Relic in Spring Boot application.

Continuing with our example with Prometheus, we will expose the Prometheus endpoint by updating the `management.endpoints.web.exposure.include` property in our application.properties.



```application.properties
management.endpoints.web.exposure.include=health,info,prometheus
```
```yml
  - job_name: 'user sign up'
    metrics_path: '/actuator/prometheus'
    scrape_interval: 5s
    static_configs:
    - targets: ['<HOST_NAME>:8080']
```
```shell
docker run \
-p 9090:9090 \
-v prometheus-config.yml:/etc/prometheus/prometheus.yml \
prom/prometheus
```
![Prometheus Targets](/assets/img/posts/spring-boot-health-check/prometheus-ss.png)

We can integrate with other [monitoring tools]() like Prometheus.
## Visualizing Application Health
It is easier to understand the metrics with the help of graphs and dashboards which help us to see the trends over different time windows. We will visualize the metrics collected by our application using Grafana.

![Grafana Dashboard](/assets/img/posts/spring-boot-health-check/grafana-ss.png)

## Configuring Kubernetes Probes
Microservices built with Spring Boot are commonly packaged in containers and deployed to container orchestration systems like Kubernetes. One of the key features of these Kubernetes is self-healing. which it does by regularly checking the health of the application. If the container goes down, it will be replaced with a healthy instance. This is detected using two properties:
**Liveness Check**: An endpoint indicating The kubelet uses liveness probes to know when to restart a container.
**Readiness Check**: The kubelet process of Kubernetes uses readiness probes to know when a container is ready to start accepting traffic. 

We will enable these two health checks by setting the property in application.properties.
```
management.health.probes.enabled=true
```
After this when we compile and run the application, we can see these two health checks in the output of the health endpoint and also two health groups.

![Health Groups](/assets/img/posts/spring-boot-health-check/healthprobes-k8s.png)

We can next use these two endpoints to configure Http probes for liveliness and readiness checks in Kubernetes. For the HTTP probe, the Kubelet process sends an HTTP request to the specified path and port to perform the check.

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



## Conclusion

We saw how we can build powerful monitoring and observability capabilities in Spring Boot applications with the help of the Actuator module, configuring health indicators, Kubernetes probes. We also enabled health check metrics to integrate with the monitoring tool (Prometheus) and visualization tool (Grafana).
Observability is still an evolving area and we should expect to see more features along these lines in future releases of Spring Boot.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-health-check).