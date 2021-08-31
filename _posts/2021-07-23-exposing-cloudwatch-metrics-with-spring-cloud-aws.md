---
title: "Publishing Metrics from Spring Boot Application to Amazon CloudWatch"
categories: [craft]
date: 2021-06-14 06:00:00 +1000
modified: 2021-06-13 06:00:00 +1000
author: pratikdas
excerpt: "Amazon CloudWatch is a monitoring and observability service in AWS Cloud. Spring Cloud AWS provides convenient methods to make it easy to integrate applications with the AWS Services. In this article, we will look at using Spring Cloud AWS for working with Amazon CloudWatch Service with the help of some basic concepts of observality."
image:
  auto: 0074-stack
---

Metrics provide a quantifiable measure of specific attributes of an application. Metrics form an integral part of monitoring which plays a critical role in a Microservice architecture where each service should be monitored to observe the overall system health. 

A collection of different metrics give intelligent insights into the health and performance of the application. Applications built on a Microservice architecture require monitoring the metrics of each microservice is essential to manage applications composed of many microservices.

Amazon CloudWatch is a monitoring and observability service. Among its main capabilities is being a metrics collector and storing the metrics in a time-series database.

In this article, we will generate different types of application metrics in a Spring Boot web application and send those metrics to Amazon CloudWatch. Amazon CloudWatch will store the metrics data, and help us to visualize the data in graphs.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/cloudwatch" %}

## What is CloudWatch?

Amazon CloudWatch is a monitoring and observability service in the AWS cloud platform. Among its main capabilities are collecting and monitoring logs, storing metrics from AWS resources, and applications running on environments running in AWS or outside AWS, and providing system-wide visualization with graphs and statistics. We will use only the metrics storing capability of CloudWatch here. 

Hence it will be worthwhile to introduce a few concepts before moving ahead:

**Metric**: Metric is a fundamental concept in CloudWatch. It is associated with one or more measures of any application attribute at any point of time. Some examples of metrics are:

 like number of http requests, CPU utilization, etc. 
 |-|10:00|10:05|10.10|10:15|
 |-|-|-|-|-|
 |cpu|40|63|10.10|10:15|


**NameSpace**: A namespace is a container for CloudWatch metrics. We specify a namespace for each data point you publish to CloudWatch. 

Metrics are uniquely defined by a name, a namespace, and zero or more dimensions. Each data point in a metric has a time stamp, and (optionally) a unit of measure. 

Each metric data point must be associated with a time stamp. The time stamp can be up to two weeks in the past and up to two hours into the future. If you do not provide a time stamp, CloudWatch creates a time stamp for you based on the time the data point was received.

A dimension is a name/value pair that is part of the identity of a metric. We can assign up to 10 dimensions to a metric.

In the subsequent sections, we will create a Spring Boot application, generate metrics, and ship them to Amazon CloudWatch.

## Setting up the Environment

With this basic understanding of CloudWatch, let us work with a few examples by first setting up our environment.

Let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.5.3.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=metricscapture&name=metricscapture&description=Demo%20project%20for%20capturing%20cloudwatch%20metrics%20in%20Spring%20Boot&packageName=io.pratik.metricscapture&dependencies=web,lombok), and then open the project in our favorite IDE.

We want to create a REST API for fetching a list of products in an online shopping application. Accordingly we have added dependencies on web and lombok modules in our pom.xml. 

In the next sections we will enrich our application to capture the following metrics each with a specific purpose:
1. number of http requests for the fetch products api
2. Price of product

## Using Micrometer to Decouple the Application from CloudWatch
We are using Amazon CloudWatch to collect the metrics from our application. In future we might want to switch to a different metrics collector like datadog, prometheus, etc. Micrometer provides a tool agnostic interface for collecting metrics from our application and publish the metrics to our target metrics collector. This enables us to support multiple metrics collectors and switch between them with minimal changes in configuration.


Registry and meter are the two central concepts in Micrometer. A Meter is the interface for collecting metrics about an application. Meters in Micrometer are created from and held in a MeterRegistry. A sample code for instantiating a `MeterRegistry` will look like this:

```java
MeterRegistry registry = new SimpleMeterRegistry();
```
`SimpleMeterRegistry` is a default implementation of `MeterRegistry` bundled in Micrometer. It holds the latest value of each meter in memory and does not export the data to any metrics collectors.

`MeterRegistry` represents the monitoring system where we want to push the metrics for storage and visualization. Each supported monitoring system has an implementation of `MeterRegistry`. `CloudWatchMeterRegistry` is the `MeterRegistry` implementation for Amazon CloudWatch. We will create this class in our example in the next section to push the metrics to Amazon CloudWatch. 

Metrics are a set of measurements about an application.
A Meter is the interface for collecting metrics and is created from a MeterRegistry. Counter, Gauge, and Timer are different types of meter. We will collect these types in our application.

Each [supported monitoring system] has an implementation of MeterRegistry. For example, for sending metrics to Amazon CloudWatch we will use `CloudWatchMeterRegistry`.

Micrometer is bundled with various Meter implementations like Timer, Counter, Gauge, etc. These get converted into one or more metrics in a format compatible with the target system.

Micrometer comes with the following set of Meters:
Timer, Counter, Gauge, DistributionSummary, LongTaskTimer, FunctionCounter, FunctionTimer, and TimeGauge. Among these we will use Timer, Counter, Gauge in our application. 

Let us understand the kind of measures they can be typically used for:

### Counters
Counter represents a single numerical value that only goes up. They are used to count requests served, tasks completed, errors occurred, etc. Counters should not be used for counts of items whose number can also go down. For these items we should use gauges described in the next section.

### Gauges
A gauge represents a single numerical value that can arbitrarily go up and down. Gauges are used for measured values like current memory usage, but also “counts” that can go up and down, like the number of messages in a queue.

### Timers
Timers measure both the rate that a particular piece of code is called and the distribution of its duration. They do not record the duration until the task is complete. These are useful for measuring short-duration latencies and the frequency of such events.

Different meter types result in a different number of time series metrics. For example, while there is a single metric that represents a Gauge, a Timer measures both the count of timed events and the total time of all events timed.


## Spring Boot Integration with Micrometer
Getting back to our application, we will first integrate Micrometer with our Spring Boot application to produce these metrics. We do this by first adding a dependency on micrometer core library named `micrometer-core` :

```xml
    <dependency>
      <groupId>io.micrometer</groupId>
      <artifactId>micrometer-core</artifactId>
    </dependency>
```
This library provides classes for creating the meters and pushing to the target monitoring system.

We next add dependency for the target monitoring system. We are using Amazon CloudWatch so we will add a dependency to `micrometer-registry-cloudwatch2` module in our project:

```xml
    <dependency> 
        <groupId>io.micrometer</groupId> 
        <artifactId>micrometer-registry-cloudwatch2</artifactId> 
    </dependency> 
```
This module uses AWS Java SDK version 2 to integrate with Amazon CloudWatch. An earlier version of the module named `micrometer-registry-cloudwatch` uses the AWS Java SDK version 1. Version 2 is the recommended version to use.

This library does the transformation from Micrometer meters to the format of the target monitoring system. Here the `micrometer-registry-cloudwatch2` library converts micrometer meters to cloudwatch metrics. 


## Creating the Registry

We will now create the `MeterRegistry` implementation for Amazon CloudWatch to create our meters and push the metrics to Amazon CloudWatch. We do this in a Spring configuration class as shown here:


```java
@Configuration
public class AppConfig {
  

  @Bean
  public CloudWatchAsyncClient cloudWatchAsyncClient() {
    return CloudWatchAsyncClient.builder().region(Region.US_EAST_1)
        .credentialsProvider(ProfileCredentialsProvider.create("pratikpoc")).build();
  }
  
  @Bean
  public MeterRegistry getMeterRegistry() {
    CloudWatchConfig cloudWatchConfig = setupCloudWatchConfig();
    
    CloudWatchMeterRegistry cloudWatchMeterRegistry = new CloudWatchMeterRegistry(cloudWatchConfig, Clock.SYSTEM,
        cloudWatchAsyncClient());
        
    return cloudWatchMeterRegistry;
  }

  private CloudWatchConfig setupCloudWatchConfig() {
    CloudWatchConfig cloudWatchConfig = new CloudWatchConfig() {
      
      private Map<String, String> configuration
            = Map.of("cloudwatch.namespace", "productsApp",
                     "cloudwatch.step", Duration.ofMinutes(1).toString());
      
      @Override
      public String get(String key) {
        return configuration.get(key);
      }
    };
    return cloudWatchConfig;
  }

}

```
In this code snippet, we have defined `CloudWatchMeterRegistry` as a Spring bean and initialized the bean with two configuration properties: `cloudwatch.namespace` and `cloudwatch.step` to store and send the metrics to CloudWatch. The complete set of configurable properties are listed in this table:

|Property Name| Description| Default |
|-|-|-|


A namespace is used as a container to group the metrics as explained earlier in the section describing cloudWatch.

For creating our registry we are first creating a `CloudWatchConfig`. The CloudWatch registry is a `StepMeterRegistry`. `CloudWatchConfig` inherits from the `StepConfig` interface. A step meter registry publishes metrics in predefined intervals called steps and normalizes the metric values for each step, for example by aggregating individual counter increments.

In addition to the configuration options available for every step meter registry, the CloudWatch config requires to specify a namespace for the metrics to be published. 

The following snippet creates a new `CloudWatch` config that publishes all metrics to the Company/App namespace every minute.

Next we create the meter registry by providing the `CloudWatch` config, a system clock, and an asynchronous CloudWatch client. The asynchronous CloudWatch client is created with our AWS security credentials. 

The full list of configuration properties available for CloudWatch integration are:


## Creating the Meters

After configuring the MeterRegistry, we will next register our meters. We will do this in the constructor of our controller class holding the signature of our REST API.

We have registered the meters of type Counter, Gauge, and Timer using two methods as shown below:

```java
@RestController
@Slf4j
public class ProductController {
  private Counter pageViewsCounter;
  private Timer productTimer;
  private Gauge priceGauge = null;
  
  private MeterRegistry meterRegistry;
  
  private PricingEngine pricingEngine;

  @Autowired
  ProductController(MeterRegistry meterRegistry, PricingEngine pricingEngine){
    
     this.meterRegistry = meterRegistry;
     this.pricingEngine = pricingEngine;
         
     // Meter registrations     
     priceGauge = Gauge
            .builder("product.price", pricingEngine , 
               (pe)->{return pe!=null?pe.getProductPrice():null;})
            .description("Product price")
            .baseUnit("ms")
            .register(meterRegistry);
      
     pageViewsCounter = meterRegistry
         .counter("PAGE_VIEWS.ProductList");
     
     productTimer = meterRegistry
         .timer("execution.time.fetchProducts");
  
  }
  
  ...
  ...

}
```
Here we are initializing three meters:
1. Counter to measure the count of views of the product list page.
2. Gauge to track the price of a product
3. Timer to record time of execution of `fetchProducts` method.

 can either use the factory methods provided by the global Metrics singleton (if you added the CloudWatch registry before) or the ones provided directly by the registry. The meter examples of the previous section were created like this. For more flexibility you can use the meter builders and call the register method at the end.

At every step the CloudWatch registry will collect the data for all registered meters and publish CloudWatch metrics accordingly. Those metrics will be published in the namespace specified in the registry configuration. The metric dimensions are directly derived from the meter tags.

Next we create our meters in a controller class:

## Generating Application Metrics
Here we increment the counter for page views meter using the `increment` method. 
```java
@RestController
@Slf4j
public class ProductController {
  private Counter pageViews;
  private Timer productTimer;
  private Gauge priceGauge = null;
  
  private MeterRegistry meterRegistry;
  
  private PricingEngine pricingEngine;

  @Autowired
  ProductController(MeterRegistry meterRegistry, PricingEngine pricingEngine){
 // Meter registrations 
 ...
 ...

  }
  
  @GetMapping("/products")
  @ResponseBody
  public List<Product> fetchProducts() {
    long startTime = System.currentTimeMillis();
    
    List<Product> products = fetchProductsFromStore();
    
    // increment page views counter
    pageViewsCounter.increment();

    // record time to execute the method
    productTimer.record(Duration.ofMillis(System.currentTimeMillis() - startTime));
        
    return products;
  }
}

@Service
public class PricingEngine {
  
  private Double price;
  
  public Double getProductPrice() {
    return price;
  }
  
  @Scheduled(fixedRate = 70000)
  public void computePrice() {
    Random random = new Random();
    price = random.nextDouble() * 100;
  }
}

```

### Increamenting Counter

### Updating Gauge

### Recording Timer

## Visualizing the Metrics in CloudWatch

Let us open the AWS console and visualize the metrics generated in the previous section.


## Conclusion

Here is a list of important points from the article for quick reference:
In this post we have seen how Micrometer can be used to publish metrics from your application to different monitoring systems. It works as a flexible layer of abstraction between your code and the monitoring systems so that you can easily swap or combine them.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/cloudwatch).

