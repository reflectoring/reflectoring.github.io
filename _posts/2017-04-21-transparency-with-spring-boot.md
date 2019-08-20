---

title: Exposing Metrics of a Spring Boot Application using Dropwizard
categories: [spring-boot]
modified: 2017-04-21
excerpt: "A tutorial on how to use the Dropwizard library to expose monitoring metrics in a Spring Boot application."
image: 0047-transparent
---



How do we know if an application we just put into production is working
as it should? How do we know that the application can cope with the
number of users and is not slowing down to a crawl? And how do we know
how many more users the application can handle before having to scale
up and put another instance into the cluster? The answer to these questions
is transparency. A good application is transparent in that it exposes
several metrics about its health and current status that can be 
interpreted manually as well as automatically.

This post explains how to create metrics in a Java application with the Dropwizard 
metrics library and how to expose them with Spring Boot.

## What Metrics to Measure?

Usual monitoring setups measure metrics like CPU, RAM and hard drive usage.
These metrics measure the resources available to our application. These metrics
can usually be read from the application server or operating system so that
we don't have to do anything specific within our application to make them
available. 

These resource metrics are very important. If the monitoring setup raises an
alarm because some resource is almost depleted, we can take action to mitigate
that problem (i.e. adding another hard drive or putting another server into
the load balancing cluster).
 
However, there are metrics which are just as important that can only be
created within our application: the number of payment transactions or 
the average duration of a search in a shop application, for example. 
These metrics give insight to the actual business value of our application
and make capacity planning possible when held against the resource metrics.

## Creating Metrics with Dropwizard

Luckily, there are tools for creating such metrics, so we don't have to
do it on our own. [Dropwizard metrics](http://metrics.dropwizard.io/) is
such a tool, which makes it very easy to create metrics within our Java 
application.

### Injecting the MetricsRegistry
First off, you will need a `MetricRegistry` object at which to register
the metrics you want to measure. In a Spring Boot application, you simply
have to add a dependency to the [Dropwizard metrics library](http://search.maven.org/#search%7Cga%7C1%7Cg%3Aio.dropwizard.metrics%20a%3Ametrics-core). 
Spring Boot will automatically create a `MetricRegistry` object for you
which you can inject like this:

```java
@Service
public class ImportantBusinessService {
  
  private MetricRegistry metricRegistry;
  
  @Autowired
  public ImportantBusinessService(MetricRegistry metricRegistry){
    this.metricRegistry = metricRegistry;
  }
  
}
```

### Measuring Throughput
If you want to create a throughput metric or a "rate", simply create a 
`Meter` and update it within your business transaction:

```java
@Service
public class ImportantBusinessService {
  
  private Meter paymentsMeter;
  
  @Autowired
  public ImportantBusinessService(MetricRegistry metricRegistry){
    this.paymentsMeter = metricRegistry.meter("payments");
  }
  
  public void pay(){
    ... // do business
    paymentsMeter.mark();  
  }  
  
}
```

This way, each time a payment transaction is finished, Dropwizard will 
update the following metrics (also see the [Dropwizard manual](http://metrics.dropwizard.io/3.2.2/manual/core.html#meters)) :

* a counter telling how many payments have been made since server start
* the mean rate of transactions per second since server start
* moving average rates transactions per second within the last minute, the last 5 minutes and the last 15 minutes.

The moving averages rates are actually exponentially weighted so that the
most recent transactions are taken into account more heavily. This is done
so that trend changes can be noticed earlier, since they can mean that
something is just now happening to our application (a DDOS attack, for example).

### Measuring Duration

Dropwizard also allows measuring the duration of our transactions. This is done
with a `Timer`:

```java
@Service
public class ImportantBusinessService {
  
  private Timer paymentsTimer;
  
  @Autowired
  public ImportantBusinessService(MetricRegistry metricRegistry){
    this.paymentsTimer = metricRegistry.timer("payments");
  }
  
  public void pay(){
    Timer.Context timer = paymentsTimer.time();
    try {
      ... // do business
    } finally {
      timer.stop();
    }
  }  
  
}
```
A `Timer` creates the following metrics for us:

* the min, max, mean and median duration of transactions
* the standard deviation of the duration of transactions
* the 75th, 95th, 98th, 99th and 999th percentile of the transaction duration

The 99th percentile means that 99% of the measured transactions were faster
than this value and 1% was slower. Additionally, a `Timer` also creates all 
metrics of a `Meter`.

## Exposing Metrics via Spring Boot Actuator
Having measured the metrics, we still need to expose them, so that
some monitoring tool can pick them up. Using Spring Boot, you can simply
add a dependency to the [Actuator Plugin](http://search.maven.org/#search%7Cga%7C1%7Cg%3A%22org.springframework.boot%22%20a%3A%22spring-boot-starter-actuator%22).
By default Actuator will create a REST endpoint on `/metrics` which lists several
metrics already, including some resources metrics as well as counts on different
page hits.

Spring Boot has support for Dropwizard by default, so that all metrics created
with Dropwizard will automatically be exposed on that endpoint. Calling the
endpoint results in a JSON structure like the following:

```json
{  
  "classes": 13387,
  "classes.loaded": 13387,
  "classes.unloaded": 0,
  "datasource.primary.active": 0,
  "datasource.primary.usage": 0.0,
  "gc.ps_marksweep.count": 4,
  "gc.ps_marksweep.time": 498,
  "gc.ps_scavenge.count": 17,
  "gc.ps_scavenge.time": 305,
  "heap": 1860608,
  "heap.committed": 876544,
  "heap.init": 131072,
  "heap.used": 232289,
  "httpsessions.active": 0,
  "httpsessions.max": -1,
  "instance.uptime": 3104,
  "mem": 988191,
  "mem.free": 644254,
  "nonheap": 0,
  "nonheap.committed": 115008,
  "nonheap.init": 2496,
  "nonheap.used": 111648,
  "processors": 8,
  "systemload.average": -1.0,
  "threads": 19,
  "threads.daemon": 16,
  "threads.peak": 20,
  "threads.totalStarted": 25,
  "uptime": 20126,
  "payments.count": 0,
  "payments.fifteenMinuteRate": 0.0,
  "payments.fiveMinuteRate": 0.0,
  "payments.meanRate": 0.0,
  "payments.oneMinuteRate": 0.0,
  "payments.snapshot.75thPercentile": 0,
  "payments.snapshot.95thPercentile": 0,
  "payments.snapshot.98thPercentile": 0,
  "payments.snapshot.999thPercentile": 0,
  "payments.snapshot.99thPercentile": 0,
  "payments.snapshot.max": 0,
  "payments.snapshot.mean": 0,
  "payments.snapshot.median": 0,
  "payments.snapshot.min": 0,
  "payments.snapshot.stdDev": 0
}
```

## Wrap-Up
When implementing a web application, think of the business metrics you want
to measure and add a Dropwizard `Meter` or `Timer` to create those metrics.
It's a few lines of code that provide a huge amount of insight into an
application running in production. 
Spring Boot offers first class support for Dropwizard metrics by automatically
exposing them via the '/metrics' endpoint to be picked up by a monitoring tool.
