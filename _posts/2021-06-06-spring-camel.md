---
title: "Getting Started with Camel and Spring Boot"
categories: [craft]
date: 2021-04-25 06:00:00 +1000
modified: 2021-04-25 06:00:00 +1000
author: pratikdas
excerpt: "AWS DynamoDB is a fully managed NoSQL database service in AWS Cloud. In this article, we will see how to integrate Apache Camel with a Spring Boot Application with the help of some code examples"
image:
  auto: 0074-stack
---

Apache Camel is an lightweight integration framework with a consistent API and programming model for integrating a wide variety of applications. Camel implements most of the [Enterprise Integration Patterns (EIP)](https://www.enterpriseintegrationpatterns.com/patterns/messaging/toc.html) and provides a wide range of integration constructs which we can use for our integration needs.

Apache Camel is also a good fit for microservice architectures where we need to communicate between different microservices, and other upstream and downstream systems like databases and messaging systems.

In this article, we will look at using Apache Camel for building integration logic in microservice applications built with [Spring Boot](https://spring.io/projects/spring-boot)with the help of code examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/springcamel" %}


## Why Apache Camel
Before going further, we should understand why we should use Apache Camel in our applications. Alternatively, we have the option of using custom code for writing integration logic like making an API call or sending a message to a Queue of a message provider system. Apart from making our application code look verbose with lots of LOC, we may not to it in the way it is best done by taking care of all the exception scenarios. Design patterns are a solution for applying proven approaches to common set of problems and Apache Camel provides implementation of most of the EIPs. Here are some more reasons we should consider using Apache Camel for our integration requirements:


[Amazon Camel](https://aws.amazon.com/dynamodb/) is a framework for integrating applications. A typical integration framework consists of data flowing from source to destination with some transformations along the way, Almost every technology you can imagine is available, for example HTTP, FTP, JMS, EJB, JPA, RMI, JMS, JMX, LDAP, Netty, and many, many more (of course most ESBs also offer support for them). Besides, own custom components can be created very easily. 

Lightweight: Camel is acknowledged as a lean framework compared to other integration frameworks like Mule, Kafka, and Spark.
Easy to change: by configuring connectors. 
Wide collection of connectors
Supporting EIP
Extensible: with new custom connectors. application can be extended
Multiple deployment options

## What is Apache Camel

As explained at the start, Apache Camel is an integration framework for routing (taking a data payload (message) from a source system to a destination system) and mediation (processing like filtering the message based on one or more message attributes, modifying certain fields of the message, enrichment by making API calls, etc). 

The important concepts of Apache Camel used during integration are shown in this diagram:


![Table items attributes](/assets/img/posts/spring-camel/camel-concepts.png)

Let us understand these concepts :

Camel Context is the runtime container of all the Camel constructs and executes the routing logic.

### Routes and Endpoints

A Route is the most basic construct which we use to define the path a message should take while moving from source to a destination. We build routes with DSL. These  are loaded in the Camel context and used to execute the routing logic when the route is triggered. Each route is identified by a unique identifier in the camel context.

Endpoints represent the source and destinations. Endpoints are usually created by a Component and Endpoints are usually referred to in the DSL via their URIs.

### Components

These are units of integration constructs like filters, converters, processors which we can assemble together to build a message flow path between source and destination endpoints. An Endpoint is either a URI or URL in a web application or a Destination in a JMS system. We communicate with an endpoint either by sending messages to it or consuming messages from it.

 transport of a message from source to destination goes through processing stages. Components process or modify the original message or redirect it. Apache Camel ships with an [extensive set of components](https://camel.apache.org/components/latest/). Component references are references used to place a component in an assembly. Apache Component references provides various references that offers services for messaging, sending data, notifications and various other services that can not only resolve easy messaging and transferring data but also provide securing of data.

### Domain Specific Language (DSL)
We define routes in Apache Camel with two variants of Domain Specific Languages (DSL) for defining routes: a Java DSL and a Spring XML DSL. Endpoints and processors are The basic building blocks for defining routes with DSL. The processor is configured by setting its attributes with expressions or logical predicates.

## Example of using Apache Camel in Spring Boot
Let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.4.5.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=springcloudsqs&name=dynamodbspringdata&description=Demo%20project%20for%20Spring%20data&packageName=io.pratik.springdata&dependencies=web), and then open the project in our favorite IDE.

### Adding the Dependencies
Apache Camel ships a Spring Boot Starter module `camel-spring-boot-starter` that allows us to develop Spring Boot applications using starters. 

To use the starter, let us add the our spring boot pom.xml file :

```xml
<dependency>
    <groupId>org.apache.camel</groupId>
    <artifactId>camel-spring-boot-starter</artifactId>
    <version>${camel.version}</version> <!-- use the same version as your Camel core version -->
</dependency>
```


### Building Route with RouteBuilder

Let us start by creating a route for fetching products using a spring bean method:

```java
@Component
public class FetchProductsRoute extends RouteBuilder {

  @Override
  public void configure() throws Exception {
    from("direct:fetchProducts")
      .routeId("direct-fetchProducts")
      .tracing()
      .log(">>> ${body}")
      .bean(ProductService.class, "fetchProductsByCategory")
      .end();
  }

}
```
Here we are creating the route by defining the Java DSL in a class `FetchProductsRoute` by extending `RouteBuilder` class. We defined the endpoint as `direct:fetchProducts` and provided a route identifier `direct-fetchProducts`. The prefix `direct:` in the name of the endpoint makes it possible to call the route from another camel route. 

## Triggering a Route
We can invoke the routes with `ProducerTemplate` and `ConsumerTemplate`. The ProducerTemplate used as an easy way of sending messages to a Camel endpoint. Both of these templates are inspired by the template utility classes in the Spring Framework that simplify access to an API. In Spring, you may have used a JmsTemplate or JdbcTemplate to simplify access to the JMS and JDBC APIs. In the case of Camel, the ProducerTemplate and ConsumerTemplate interfaces allow you to easily work with producers and consumers.

By “easily work,” we mean you can send a message to any kind of Camel component in only one line of code. 

Let us invoke this route from our application by creating a resource class:

```java
@RestController
public class ProductResource {
  
  @Autowired
  private ProducerTemplate producerTemplate;
  
  @GetMapping("/products/{category}")
  @ResponseBody
  public List<Product> getProductsByCategory(@PathVariable("category") final String category){
    producerTemplate.start();
    List<Product> products = producerTemplate.requestBody("direct:fetchProducts", category, List.class);
      System.out.println("products "+products);
    producerTemplate.stop();
    return products;
  
  }
} 

@Configuration
public class AppConfig {
  
  @Autowired
  private  CamelContext camelContext;
 ...
 ...
  
  @Bean
  ProducerTemplate producerTemplate() {
    return camelContext.createProducerTemplate();
  }
  
  @Bean
  ConsumerTemplate consumerTemplate() {
    return camelContext.createConsumerTemplate();
  }

}

```

Here we have defined a `GET` method for fetching products. 

## Integrating with Splitter-Aggregator Enterprise Integration Pattern

Camel provides implementations of most of the [Enterprise Integration Patterns]() from the book by Gregor Hohpe and Bobby Woolf. The full list of EIPs supported are available here. For our example, let us consider building a API in an E-Commerce application for processing a order placed by a customer. The API will perform these steps:
1. fetch the list of items from the shopping cart 
2. fetch price of each orderline item in the cart 
3. Calculate the sum of prices of all orderline items to generate the order invoice.

We want to perform steps 1 and 2 in parallel since they are not dependent on each other. There are multiple ways of doing this but we will use a pattern from EIP here. The Splitter and Aggregator patterns From the EIP is best suited to do this processing.

We can split a message into a number of pieces with the Splitter and process them individually. After that we can use the Aggregator pattern to combine those individual pieces together into a single message. 

We will apply this pattern by doing these steps:   
1. Fetch the orderlines from the shopping cart and then split them into individual orderline items with the Splitter EIP.
For each orderline item, fetch the price, apply discounts etc. These steps are running in parallel.
Aggregate price from each line item.

Our route for using this EIP looks like this:


```java
@Component
public class OrderProcessingRoute extends RouteBuilder {
  
  @Autowired
  private PriceAggregationStrategy priceAggregationStrategy;

  @Override
  public void configure() throws Exception {
    from("direct:fetchProcess")
    .split(body(), priceAggregationStrategy).parallelProcessing()
    .to("bean:pricingService?method=calculatePrice")
    .end();
  }
}

@Component
public class PriceAggregationStrategy implements AggregationStrategy{
  
  @Override
  public Exchange aggregate(Exchange oldExchange, Exchange newExchange) {
    OrderLine newBody = newExchange.getIn().getBody(OrderLine.class);
        if (oldExchange == null) {
            Order order = new Order();
            order.setOrderNo(UUID.randomUUID().toString());
            order.setOrderDate(Instant.now().toString());
            order.setOrderPrice(newBody.getPrice());
            order.addOrderLine(newBody);
                 
            newExchange.getIn().setBody(order, Order.class);
            return newExchange;
        }
        OrderLine newOrderLine = newExchange.getIn().getBody(OrderLine.class);
        Order order = oldExchange.getIn().getBody(Order.class);
        order.setOrderPrice(order.getOrderPrice() + newOrderLine.getPrice());
        order.addOrderLine(newOrderLine);
        oldExchange.getIn().setBody(order);
        
        return oldExchange;
  }

}

@Service
public class PricingService {
  
  public OrderLine calculatePrice(final OrderLine orderLine ) {
    String category = orderLine.getProduct().getProductCategory();
    if("Electronics".equalsIgnoreCase(category))
       orderLine.setPrice(300.0);
...
...
    return orderLine;
    
  }

}
```
Here we have used an aggregator 

## Connecting the EIP with Rest Definition

We will create our REST endpoint using Camel's RestDefinition.
```java
@Component
public class RestApiRoute  extends RouteBuilder {
  
  @Autowired
  private Environment env;

  @Override
  public void configure() throws Exception {
    
    restConfiguration()
        .contextPath("/ecommapp")
        .apiContextPath("/api-doc")
        .apiProperty("api.title", "JAVA DEV JOURNAL REST API")
        .apiProperty("api.version", "1.0")
        .apiProperty("cors", "true")
        .apiContextRouteId("doc-api")
        .port(env.getProperty("server.port", "8080"))
        .bindingMode(RestBindingMode.json);
    
    rest("/order/process")
    .get("/").description("Process order")
    .route().routeId("orders-api")
    .bean(OrderService.class, "generateOrder")
    .to("direct:fetchProcess")
    .endRest();
    
  }

```

## Testing 

## Monitoring

## Conclusion

In this article, we looked at the important concepts of Apache Camel and performed database operations from two applications written in Spring Boot first with Spring Data and then using the Enhanced DynamoDB Client. Here is a summary of the things we covered:
1. AWS DynamoDB is a NoSQL Key-value data store and helps us to store flexible data models.
2. We store our data in a table in AWS DynamoDB. A table is composed of items and each item has a primary key and a set of attributes.
3. A DynamoDB table must have a primary key which can be composed of a partition key and optionally a sort key.
4. We create a secondary Index to search the DynamoDB on fields other than the primary key.
5. We accessed DynamoDB with Spring Data module and then with Enhanced DynamoDB Client module of AWS Java SDK.

I hope this will help you to get started with building applications using Spring with AWS DynamoDB as the database. 

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/springdynamodb).