---
title: "Getting Started with Apache Camel and Spring Boot"
categories: [spring-boot]
date: 2021-06-14 06:00:00 +1000
modified: 2021-06-13 06:00:00 +1000
author: pratikdas
excerpt: "Apache Camel is an integration framework with a programming model for integrating a wide variety of applications. In this article, we will look at using Apache Camel for building integration logic in microservice applications built with Spring Boot with the help of code examples."
image:
  auto: 0074-stack
---

Apache Camel is an integration framework with a programming model for integrating a wide variety of applications. 

It is also a good fit for microservice architectures where we need to communicate between different microservices and other upstream and downstream systems like databases and messaging systems.

In this article, we will look at using Apache Camel for building integration logic in microservice applications built with [Spring Boot](https://spring.io/projects/spring-boot) with the help of code examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-camel" %}


## What is Apache Camel

As explained at the start, Apache Camel is an integration framework. Camel can do :
1. **Routing**: Take a data payload also called "message" from a source system to a destination system
2. **Mediation**: Message processing like filtering the message based on one or more message attributes, modifying certain fields of the message, enrichment by making API calls, etc. 

Some of the important concepts of Apache Camel used during integration are shown in this diagram:


![Camel Message Flow](/assets/img/posts/camel-spring/camel-arch.png)

Let us get a basic understanding of these concepts before proceeding further.

### Camel Context
Camel context is the runtime container of all the Camel constructs and executes the routing rules. The Camel context activates the routing rules at start up by loading all the resources required for their execution.

The Camel context is described by the [CamelContext](https://github.com/Talend/apache-camel/blob/master/camel-core/src/main/java/org/apache/camel/CamelContext.java) interface and is autoconfigured by default if running in a Spring container.

### Routes and Endpoints

**A Route is the most basic construct which we use to define the path a message should take while moving from source to destination.** We define routes using a Domain Specific Language (DSL). 

These are loaded in the Camel context and are used to execute the routing logic when the route is triggered. Each route is identified by a unique identifier in the Camel context.

**Endpoints represent the source and destination of a message.** They are usually referred to in the Domain Specific Language (DSL) via their URIs. Examples of an endpoint are either a URI or URL in a web application or a Destination in a JMS system.

### Domain Specific Language (DSL)
We define routes in Apache Camel with a variety of [Domain Specific Languages (DSL)](https://camel.apache.org/manual/latest/dsl.html). The Java DSL and the Spring XML DSL are the two main types of DSLs used in Spring applications.  

Here is an example of a route defined in Java DSL using the `RouteBuilder` class:

```java
    RouteBuilder builder = new RouteBuilder() {

      @Override
      public void configure() throws Exception {
        // Route definition in Java DSL for 
        // moving file from jms queue to file system.
        from("jms:queue:myQueue").to("file://mysrc");
      }
        
    };
```
Here we have defined a route with a JMS queue as a source and a file endpoint as a destination by using the `RouteBuilder` class. The [RouteBuilder](https://www.javadoc.io/doc/org.apache.camel/camel-core/3.0.0-M2/org/apache/camel/builder/RouteBuilder.html) class creates routing rules using the DSL. Instances of RouteBuilder are added to the CamelContext.

The same route defined using Spring XML DSL looks like this :
```xml

<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
       http://www.springframework.org/schema/beans 
       http://www.springframework.org/schema/beans/spring-beans.xsd
       http://camel.apache.org/schema/spring 
       http://camel.apache.org/schema/spring/camel-spring.xsd" >

  <camelContext id="sendtoqueue" 
                  xmlns="http://camel.apache.org/schema/spring">
    <route>
      <from uri="jms:queue:myQueue"/>
 
      <to uri="file://mysrc"/>
    </route>
  </camelContext>

</beans>
```

### Components

The transport of a message from the source to the destination goes through multiple steps. Processing in each step might require connecting to different types of resources in the message flow like an invocation of a bean method or calling an API. **We use components to perform the function of connecting to these resources.** 


For example, the route defined with the `RouteBuilder` class in Java DSL uses the `file` component to bridge to the file system and the `jms` component to bridge to the JMS provider. 

```java
    RouteBuilder builder = new RouteBuilder() {

      @Override
      public void configure() throws Exception {
        // Route definition in Java DSL for 
        // moving file from jms queue to file system.
        from("jms:queue:myQueue").to("file://mysrc");
      }
        
    };
```

Camel has several [pre-built components](https://camel.apache.org/components/latest/) and many others built by communities. Here is a snippet of the components available in Camel which gives us an idea of the wide range of systems we can integrate using the framework:

- ActiveMQ
- AMQP
- Async HTTP Client
- Atom
- Avro RPC
- AWS2 DynamoDB
- AWS2 Lambda
- AWS2 SQS
- AWS2 SNS
- Azure CosmosDB
- Azure Storage Blob
- Azure Storage Queue
- Bean
- Cassandra CQL
- Consul
- CouchDB
- Cron
- Direct
- Docker
- Elasticsearch
- Facebook
- FTP
- Google Cloud Storage
- Google Cloud Function
- GraphQL
- Google Pubsub
- gRPC
- HTTP


These functions are grouped in separate Jar files. Depending on the component we are using, we need to include the corresponding Jar dependency. 

For our example, we need to include the `camel-jms` dependency and use the component by referring to the documentation of [Camel JMS component](https://camel.apache.org/components/3.4.x/jms-component.html).

We can also [build our own components](https://camel.apache.org/manual/latest/writing-components.html) by implementing the [Component](https://www.javadoc.io/doc/org.apache.camel/camel-api/latest/org/apache/camel/Component.html) interface.


## Using Apache Camel in Spring Boot
Camel support for Spring Boot includes an opinionated auto-configuration of the Camel context and starters for many Camel components. The auto-configuration of the Camel context detects Camel routes available in the Spring context and registers the key Camel utilities (like producer template, consumer template, and the type converter) as Spring beans. 

Let us understand this with the help of an example. We will set up a simple route for calling a bean method and invoke that route from a REST endpoint.

Let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.4.7.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=camelapp&name=camelapp&description=Demo%20project%20for%20Spring%20with%20camel&packageName=io.pratik&dependencies=web), and then open the project in our favorite IDE.

### Adding the Dependencies
Apache Camel ships a Spring Boot Starter module `camel-spring-boot-starter` that allows us to use Camel in Spring Boot applications. 

Let us first add the Camel Spring Boot BOM to your Maven `pom.xml` :

```xml
<dependencyManagement>

  <dependencies>
    <!-- Camel BOM -->
    <dependency>
      <groupId>org.apache.camel.springboot</groupId>
      <artifactId>camel-spring-boot-bom</artifactId>
      <version>${project.version}</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
    <!-- ... other BOMs or dependencies ... -->
  </dependencies>

</dependencyManagement>

```

The `camel-spring-boot-bom` contains all the Camel Spring Boot starter JAR files.

Next, let us add the Camel Spring Boot starter to set up the Camel Context by adding the following dependency to our `pom.xml` file :

```xml
<dependency>
  <groupId>org.apache.camel</groupId>
  <artifactId>camel-spring-boot-starter</artifactId>
</dependency>
```

We need to further add the starters for the components required by our Spring Boot application :

```xml
<dependency>
  <groupId>org.apache.camel.springboot</groupId>
  <artifactId>camel-servlet-starter</artifactId>
</dependency>
<dependency>
  <groupId>org.apache.camel.springboot</groupId>
  <artifactId>camel-jackson-starter</artifactId>
</dependency>
<dependency>
  <groupId>org.apache.camel.springboot</groupId>
  <artifactId>camel-swagger-java-starter</artifactId>
</dependency>
```

Here we have added three dependencies with the starters for using the components for `servlet`, `jackson`, and `swagger` which will perform the following functions:
1. The Servlet component will provide HTTP based endpoints for consuming HTTP requests arriving at an HTTP endpoint bound to a published Servlet. 
2. The Jackson component will be used for marshaling and unmarshalling between [JavaScript Object Notation (JSON)](https://www.json.org/json-en.html) and object representations.
3. The Swagger component will expose the REST services and their APIs using [Swagger/Open API specification](https://swagger.io/docs/specification/about/).

### Defining a Route with Java DSL's RouteBuilder

Let us now create a route for fetching products by using a Spring bean method. 
We create Camel routes by extending the `RouteBuilder` class and overriding its `configure` method to define our routing rules in Java Domain Specific Language (DSL).

Each of the router classes is instantiated once and is registered with the `CamelContext` object. 

Our class containing the routing rule defined using Java Domain Specific Language (DSL) looks like this:


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
Here we are creating the route by defining the Java DSL in a class `FetchProductsRoute` by extending `RouteBuilder` class. We defined the endpoint as `direct:fetchProducts` and provided a route identifier `direct-fetchProducts`. The prefix `direct:` in the name of the endpoint makes it possible to call the route from another camel route using the `direct` camel component. 

### Triggering a Route with Templates
We can invoke the routes with `ProducerTemplate` and `ConsumerTemplate`. The `ProducerTemplate` is used as an easy way of sending messages to a Camel endpoint. 

Both of these templates are similar to the template utility classes in the Spring Framework like `JmsTemplate` or `JdbcTemplate` that simplify access to the [JMS](https://www.oracle.com/java/technologies/java-message-service.html) and [JDBC](https://docs.oracle.com/javase/8/docs/technotes/guides/jdbc/) APIs. 

Let us invoke the route we created earlier from a resource class in our application :

```java
@RestController
public class ProductResource {
  
  @Autowired
  private ProducerTemplate producerTemplate;
  
  @GetMapping("/products/{category}")
  @ResponseBody
  public List<Product> getProductsByCategory(
                @PathVariable("category") final String category){
    producerTemplate.start();
    List<Product> products = producerTemplate
       .requestBody("direct:fetchProducts", category, List.class);
    
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

Here we have defined a REST endpoint in our `resource` class with a `GET` method for fetching products by category. We are invoking our Camel route inside the method by using the `producerTemplate` which we configured in our Spring configuration. 

In our Spring configuration we have defined the `producerTemplate` and `consumerTemplate` by calling corresponding methods on the `CamelContext` which is available in the `ApplicationContext`.

## Defining a Route with Splitter-Aggregator Enterprise Integration Pattern

Let us now look at a route where we will use an Enterprise Integration Pattern.

Camel provides implementations for many of the [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/patterns/messaging/toc.html) from the [book](https://www.amazon.com/o/asin/0321200683/ref=nosim/enterpriseint-20) by Gregor Hohpe and Bobby Woolf. We will use the `Splitter` and `Aggregator` integration patterns in our example.

We can split a single message into multiple fragments with the [Splitter](https://www.enterpriseintegrationpatterns.com/patterns/messaging/Sequencer.html) and process them individually. After that, we can use the [Aggregator](https://www.enterpriseintegrationpatterns.com/patterns/messaging/Aggregator.html) to combine those individual fragments into a single message. 

### Selecting the Enterprise Integration Pattern (EIP)
Before trying to build our integration logic, we should look for the integration pattern most appropriate for fulfilling our use case. 

Let us see an example of defining a route with the Splitter and Aggregate integration patterns.  Here we will consider a hypothetical scenario of building a REST API for an E-Commerce application for processing an order placed by a customer. We will expect our order processing API to perform the following steps:

1. Fetch the list of items from the shopping cart 
2. Fetch the price of each order line item in the cart 
3. Calculate the sum of prices of all order line items to generate the order invoice.

After finishing step 1, we want to fetch the price of each order line item in step 2. We want to fetch them in parallel since they are not dependent on each other. There are multiple ways of doing this kind of processing. 

However, since design patterns are accepted solutions to recurring problems within a given context, we will search for a pattern closely resembling our problem from our list of Enterprise Integration Patterns. After looking through the list, we find that the [Splitter](https://www.enterpriseintegrationpatterns.com/patterns/messaging/Sequencer.html) and [Aggregator](https://www.enterpriseintegrationpatterns.com/patterns/messaging/Aggregator.html) patterns are best suited to do this processing.

### Applying the Enterprise Integration Pattern (EIP)

Next, we will refer to Apache Camel's documentation to learn about the usage of the [Splitter](https://camel.apache.org/components/3.4.x/eips/split-eip.html) and [Aggregator](https://camel.apache.org/components/latest/eips/aggregate-eip.html) integration patterns to build our routes.

Let us apply these patterns by performing the below steps:   

1. Fetch the order lines from the shopping cart and then split them into individual order line items with the Splitter EIP.
2. For each order line item, fetch the price, apply discounts, etc. These steps are running in parallel.
3. Aggregate price from each line item in `PriceAggregationStrategy` class which implements `AggregationStrategy` interface.

Our route for using this Enterprise Integration Pattern (EIP) looks like this:


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
        OrderLine newOrderLine = newExchange.getIn()
                                .getBody(OrderLine.class);
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
Here we have defined a route in Java DSL which splits the incoming message (collection of order lines) into individual order line items. Each order line item is sent to the `calculatePrice` method of the `PricingService` class to compute the price of the items.

Next, we have tied up an aggregator after the split step. The aggregator implements the `AggregationStrategy` interface and our aggregation logic is inside the overridden `aggregate()` method. In the `aggregate()` method, we take each of the order line items and consolidate them into a single `order` object. 

## Consuming the Route with Splitter Aggregator Pattern from REST Styled DSL
Let us next use the REST styled DSL in Apache Camel to define REST APIs with the HTTP verbs like GET, POST, PUT, and, DELETE. The actual REST transport is leveraged by using Camel REST components such as Netty HTTP, Servlet, and others that have native REST integration.

To use the Rest DSL in Java, we need to extend the `RouteBuilder` class and define the routes in the `configure` method similar to how we created regular Camel routes earlier. 

Let us define a hypothetical REST service for processing orders by using the `rest` construct in the Java DSL to define the API. We will also generate a specification for the API based on the [OpenAPI Specification (OAS)](https://swagger.io/specification/):

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
        .apiProperty("api.title", "REST API for processing Order")
        .apiProperty("api.version", "1.0")
        .apiProperty("cors", "true")
        .apiContextRouteId("doc-api")
        .port(env.getProperty("server.port", "8080"))
        .bindingMode(RestBindingMode.json);
    
    rest("/order/")
    .get("/process").description("Process order")
    .route().routeId("orders-api")
    .bean(OrderService.class, "generateOrder")
    .to("direct:fetchProcess")
    .endRest();
    
  }

```
This defines a REST service of type GET with URL mappings `/order/process`.

We then route directly to the Camel endpoint of our route named `direct:fetchProcess` using the Splitter and Aggregator Enterprise Integration pattern that we created earlier using the `to` construct in the DSL. 

## When to Use and Not to Use Apache Camel

As we saw in our examples, we can easily accomplish the above tasks with custom coding instead of using Apache Camel. Let us understand some of the situations when we should consider using Apache Camel for our integration requirements:

1. Apache Camel with a rich set of components will be useful in applications requiring integration with systems over different protocols (like files, APIs, or JMS Queues).
2. Apache Camel's implementation of Enterprise Integration Patterns is useful to fulfill complex integration requirements with tried and tested solutions for recurring integration scenarios.
3. Orchestration and choreography in microservices can be defined with Domain Specific Language in Apache Camel routes. Routes help to keep the core business logic decoupled from the communication logic and satisfy one of the key Microservice principles of SRP (single responsibility principle).
4. Apache Camel works very well with Java and Spring applications.
4. Working with Java Objects (POJOs): Apache Camel is a Java framework, so it is especially good at working with Java objects. So if we are working with a file format like XML, JSON that can be de-serialized into a Java object then it will be handled easily by Camel.

On the contrary, we should avoid using Apache Camel in the following scenarios:
1. If we have simple integration involving calling few APIs
2. Camel is not known to perform well for heavy data processing
3. Camel will also not be good for teams lacking in Java skills

Generally, the best use cases for Camel are where we have a source of data that we want to consume from like incoming messages on a queue, or fetching data from an API and a target, where we want to send the data to.

## Conclusion

In this article, we looked at the important concepts of Apache Camel and used it to build integration logic in a Spring Boot application. Here is a summary of the things we covered:
1. Apache Camel is an integration framework providing a programming model along with implementations of many Enterprise Integration Patterns.
2. We use different types of Domain Specific Languages (DSL) to define the routing rules of the message. 
3. A Route is the most basic construct which we specify with a DSL to define the path a message should take while moving from source to destination.
4. CamelContext is the runtime container for executing Camel routes.
5. We built a route with the Splitter and Aggregator Enterprise Integration Patterns and invoked it from a REST DSL.
6. Finally we looked at some scenarios where using Apache Camel will benefit us.


I hope this post has given you a good introduction to Apache Camel and we can use Camel with Spring Boot applications. This should help you to get started with building applications using Spring with Apache Camel. 

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-camel).