---
title: "Working with AWS DynamoDB and Spring"
categories: [craft]
date: 2021-04-25 06:00:00 +1000
modified: 2021-04-25 06:00:00 +1000
author: pratikdas
excerpt: "AWS DynamoDB is a fully managed NoSQL database service in AWS Cloud. In this article, we will look at accessing DynamoDB from our Java applications with Spring Data and enhanced high-level client with the help of some code examples"
image:
  auto: 0074-stack
---

AWS DynamoDB is a NoSQL database service available in AWS Cloud. 

DynamoDB provides many benefits starting from a flexible pricing model, stateless connection, and a consistent response time irrespective of the database size. 

Due to this reason, DynamoDB is widely used as a database with serverless compute services like AWS Lambda and in microservice architectures. 

In this article, we will look at using the DynamoDB database in microservice applications built with [Spring Boot](https://spring.io/projects/spring-boot) along with code examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/springdynamodb" %}


## AWS DynamoDB Concepts
[Amazon DynamoDB](https://aws.amazon.com/dynamodb/) is a key-value database. A key-value database stores data as a collection of key-value pairs. Both the keys and the values can be simple or complex objects.

There is plenty to know about DynamoDB for building a good understanding for which we should refer to the [official documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html). 

We will only skim through the main concepts represented in this diagram, which are essential for designing our applications:

![Table creation](/assets/img/posts/aws-dynamodb-java/tablitemattr.png)

This diagram shows the organization of order records placed by a customer in a `Order` table. Each order is uniquely identified by a combination of `customerID` and `orderID`. Let us understand this structure in detail.

### Tables, Items and Attributes
Like all databases, **a table is the fundamental concept in DynamoDB where we store our data**. DynamoDB tables are schemaless. Other than the primary key, we do not need to define any additional attributes when creating a table. 

**A table contains one or more items. An item is composed of attributes, which are different elements of data for a particular item**. They are similar to columns in a relational database. 

We also specify the type of the attribute when creating a table. A type can be simple types like strings and numbers or composite types like lists, maps, or sets. In our example, each `order` item has `OrderValue`, `OrderDate` as simple type attributes and `products` list as a composite type attribute.

### Uniquely Identifying Items in a Table with Primary Key
The primary key is used to uniquely identify each item in an Amazon DynamoDB table. A primary key is of two types:

1. **Simple Primary Key**: This is composed of one attribute called the Partition Key. If we wanted to store a customer record, then we could have used `customerID` or `email` as a partition key to uniquely identify the customer in the DynamoDB table.
2. **Composite Primary Key**: This is composed of two attributes Partition and Sort Keys. In our example above, each order is uniquely identified by a composite primary key with `customerID` as the partition key and `orderID` as the sort key.


### Data Distribution Across Partitions

**A partition is a unit of storage for a table where the data is stored by DynamoDB**. 

When we write an item to the table, DynamoDB uses the value of the partition key as input to an internal hash function. The output of the hash function determines the partition in which the item will be stored.

When we read an item from the table, we must specify the partition key value for the item. DynamoDB uses this value as input to its hash function, to locate the partition in which the item can be found.

### Querying with Secondary Indexes
We can use a secondary index to query the data in the table using an alternate key, in addition to queries against the primary key. Secondary Indexes are of two types:

- **Global Secondary Index (GSI)**: An index with a partition key and sort key that are different from the partition key and sort key of the table.
- **Local Secondary Index (LSI)**: An index that has the same partition key as the table, but a different sort key.

### Single Table Data Model

We do not require most of the attributes for every item. This allows for a more flexible data model compared to relational databases. We can store completely different kinds of objects (items in the table) in a single DynamoDB table, such as a Customer object with Name, email, and phone attributes, and an Address object with street, city, and zip attributes. This is an established design pattern called a single table design for storing multiple different entity types in a single table.


## Setting up DynamoDB
We can run a local instance of DynamoDB for development and testing. When we are ready to deploy our application in production, we can remove the local endpoint in the code, to make it point to the DynamoDB web service. DynamoDB Local is available as a download (requires JRE), as an Apache Maven dependency, or as a Docker image.


## Writing Applications with DynamoDB
DynamoDB is a web service, and interactions with it are stateless. We interact with DynamoDB by REST API calls over HTTP(S). Unlike connection protocols like JDBC, applications do not need to maintain persistent network connections. We send the name of the operation that we want to perform in the API request. 

We usually do not work with APIs directly. AWS provides SDK in different programming languages which we integrate with our applications for performing database operations.

We will describe two ways for accessing DynamoDB from Spring applications:
- Using DynamoDB module of Spring Data
- Using Enhanced Client for DynamoDB

Let us see some examples of using these two methods in the following sections.

## Accessing DynamoDB with Spring Data
The primary goal of the [Spring® Data](https://spring.io/projects/spring-data) project is to make it easier to build Spring-powered applications by providing a consistent framework to use different data access technologies. Spring Data is an umbrella project composed of many different sub-projects each corresponding to specific database technologies. 

[Spring Data module for DynamoDB](https://github.com/derjust/spring-data-dynamodb) is a community module for accessing AWS DynamoDB with familiar Spring Data constructs of data objects and repository interfaces.

### Initial Setup
Let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.4.5.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=springcloudsqs&name=dynamodbspringdata&description=Demo%20project%20for%20Spring%20data&packageName=io.pratik.springdata&dependencies=web), and then open the project in our favorite IDE.


For configuring Spring Data, let us add a separate Spring Data release train BOM in our `pom.xml` file using this `dependencyManagement` block :

```xml
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.springframework.data</groupId>
        <artifactId>spring-data-releasetrain</artifactId>
        <version>Lovelace-SR1</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>

```
For adding the support for Spring Data, we need to include the module dependency for Spring Data DynamoDB into our Maven configuration.  We do this by adding the module`spring-data-dynamodb` in our `pom.xml`:

```xml
    <dependency>
      <groupId>com.github.derjust</groupId>
      <artifactId>spring-data-dynamodb</artifactId>
      <version>5.1.0</version>
    </dependency>
```
### Creating the Configuration

We will initialize `dynamodbEnhancedClient` in our Spring configuration:

```java
Configuration
@EnableDynamoDBRepositories
(basePackages = "io.pratik.dynamodbspring.repositories")
public class AppConfig {

    @Bean
    public AmazonDynamoDB amazonDynamoDB() {
        AWSCredentialsProvider credentials = new ProfileCredentialsProvider("pratikpoc");
    AmazonDynamoDB amazonDynamoDB 
          = AmazonDynamoDBClientBuilder.standard().withCredentials(credentials).build();
        
        return amazonDynamoDB;
    }

}

```
### Creating the Mapping with DynamoDB Table in a Data Class
Let us now create a DynamoDB table which we will use to store customer records from our application:

![Table creation](/assets/img/posts/aws-dynamodb-java/table-creation.png)
We are using the AWS console to create a table named `Customer` with `CustomerID` as the partition key. 

We will next create a class to represent the `Customer` DynamoDB table which will contain the mapping with the keys and attributes of an item stored in the table:
```java
@DynamoDBTable(tableName = "Customer")
public class Customer {
  
  private String customerID;
  
  private String name;
  
  private String email;

  // Partition key
    @DynamoDBHashKey(attributeName = "CustomerID")
  public String getCustomerID() {
    return customerID;
  }

  public void setCustomerID(String customerID) {
    this.customerID = customerID;
  }

  @DynamoDBAttribute(attributeName = "Name")
  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  @DynamoDBAttribute(attributeName = "Email")
  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

}
```

We have defined the mappings with the table by decorating the class with `@DynamoDBTable` annotation and passing in the table name. We have used the `DynamoDBHashKey` attribute over the getter method of the `customerID` field. For mapping the remaining attributes, we have decorated the getter methods of the remaining fields with the  `@DynamoDBAttribute` passing in the name of the attribute.

### Defining the Repository Interface
We will next define a repository interface by extending CrudRepository and be typed to the domain class and an ID type. Next, let us create our repository interface `CustomerRepository` and invoke it from a `service` class: 

```java
@EnableScan
public interface CustomerRepository  extends 
  CrudRepository<Customer, String> {
 
}

@Service
public class CustomerService {
  
  @Autowired
  private CustomerRepository customerRepository;
  
  public void createCustomer(final Customer customer) {
    customerRepository.save(customer);
  }
}
```
We are extending `CrudRepository` to expose CRUD methods for our domain class `Customer`.

Let us execute the service from a test class:

```java
@SpringBootTest
class CustomerServiceTest {

  @Autowired
  private CustomerService customerService;
...
...

  @Test
  void testCreateCustomer() {
    Customer customer = new Customer();   
    customer.setCustomerID("CUST-001");
    customer.setName("John Lennon");
    customer.setEmail("john.lennon@lenno.com");
    customerService.createCustomer(customer);
  }
}

```

## Using the DynamoDB enhanced Client
Enhanced DynamoDB client is a new module of the AWS SDK for Java 2.0. This module provides a more idiomatic code authoring experience. We can integrate applications with  DynamoDB using an adaptive API that allows us to execute database operations directly with the data classes our application already works with.

### Initial Setup
Let us create one more Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.4.5.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=springcloudsqs&name=dynamodbec&description=Demo%20project%20for%20SEnhanced%20client&packageName=io.pratik&dependencies=web) where we will use the enhanced client to access DynamoDB.


Let us create one more Spring Boot project where we will use the enhanced client to access DynamoDB.
The first step of using the DynamoDB Enhanced Client for Java is to include its dependency in our project:

```xml
    <dependency>
      <groupId>software.amazon.awssdk</groupId>
      <artifactId>dynamodb-enhanced</artifactId>
      <version>2.16.74</version>
    </dependency>
```
Here we are adding enhanced client as a Maven dependency of `dynamodb-enhanced` module in our `pom.xml`.

### Creating the Configuration

We will initialize `dynamodbEnhancedClient` in our Spring configuration:

```java
@Configuration
public class AppConfig {

  @Bean
  public DynamoDbClient getDynamoDbClient() {
    AwsCredentialsProvider credentialsProvider = 
              DefaultCredentialsProvider.builder()
               .profileName("pratikpoc")
               .build();

    return DynamoDbClient.builder().region(Region.US_EAST_1).credentialsProvider(credentialsProvider).build();
  }
  
  @Bean
  public DynamoDbEnhancedClient getDynamoDbEnhancedClient() {
    return DynamoDbEnhancedClient.builder()
                .dynamoDbClient(getDynamoDbClient())
                .build();
  }

}

```

Here we are creating a bean `dynamodbClient` with our AWS credentials and using this to create a bean for `DynamoDbEnhancedClient`;

### Creating the Mapping Class
Let us now create one more DynamoDB table to store the orders placed by a customer. This time we will define a composite primary key for the `Order` table :

![Table creation](/assets/img/posts/aws-dynamodb-java/table-creation.png)

As we can see here, we are using the AWS console to create a table named `Order` with a composite primary key composed of`CustomerID` as the partition key and `OrderID` as the sort key. 


We will next create a `Order` class to represent the items in the `Order` table:

```java
@DynamoDbBean
public class Order {
  private String customerID;
  private String orderID;
  private double orderValue;
  private Instant createdDate;
    
  @DynamoDbPartitionKey
  @DynamoDbAttribute("CustomerID")
  public String getCustomerID() {
    return customerID;
  }
  public void setCustomerID(String customerID) {
      this.customerID = customerID;
  }
  
  @DynamoDbSortKey
  @DynamoDbAttribute("OrderID")
  public String getOrderID() {
    return orderID;
  }
  public void setOrderID(String orderID) {
    this.orderID = orderID;
  }
  
...
...
    
}

```
Here we are decorating the `Order` data class with the `@DynamoDB` annotation to designate the class as a DynamoDB bean’. We have also added an annotation `@DynamoDbPartitionKey` for the partition key and another annotation `@DynamoDbSortKey` on the getter for the sort key of the record. 

### Creating the Repository Class

In the last step we will inject this `DynamoDbEnhancedClient` in a repository class and use the data class created earlier for performing different database operations:

```java
@Repository
public class OrderRepository {
  
  @Autowired
  private DynamoDbEnhancedClient dynamoDbenhancedClient ;

  // Store the order item in the database
  public void save(final Order order) {
    DynamoDbTable<Order> orderTable = getTable();
    orderTable.putItem(order);
  }

  // Retrieve a single order item from the database
  public Order getOrder(final String customerID, final String orderID) {
    DynamoDbTable<Order> orderTable = getTable();
    // Construct the key with partition and sort key
    Key key = Key.builder().partitionValue(customerID)
                       .sortValue(orderID)
                       .build();
    
    Order order = orderTable.getItem(key);
    
    return order;
  }

  /**
   * @return
   */
  private DynamoDbTable<Order> getTable() {
    // Create a tablescheme to scan our bean class order
    DynamoDbTable<Order> orderTable = 
        dynamoDbenhancedClient.table("Order", TableSchema.fromBean(Order.class));
    return orderTable;
  }

}

```

Here we are constructing a `TableSchema` by calling `TableSchema.fromBean(Order.class)` to scan our bean class `Order`. This will use the annotations in the `Order` class defined earlier to determine the attributes which are partition and sort keys. We are then associating this `Tableschema` with our actual table name `Order` to create an instance of `DynamoDbTable` which represents the object with a mapped table resource `Order`. 

We are using this mapped resource to save the `order` item in the `save` method by calling the `putItem` method and fetch the item by calling the `getItem` method.

We can similarly perform all other table-level operations on this mapped resource as shown here:

```java
@Repository
public class OrderRepository {

  @Autowired
  private DynamoDbEnhancedClient dynamoDbenhancedClient;

 ...
 ...

  public void deleteOrder(final String customerID, final String orderID) {
    DynamoDbTable<Order> orderTable = getTable();

    Key key = Key.builder().partitionValue(customerID).sortValue(orderID).build();

    DeleteItemEnhancedRequest deleteRequest = DeleteItemEnhancedRequest
        .builder()
        .key(key)
        .build();
    
    orderTable.deleteItem(deleteRequest);
  }
  
  public PageIterable<Order> scanOrders(final String customerID, final String orderID) {
    DynamoDbTable<Order> orderTable = getTable();
    
    return orderTable.scan();
  }

  public PageIterable<Order> findOrdersByValue(final String customerID, final double orderValue) {
    DynamoDbTable<Order> orderTable = getTable();
        
        AttributeValue attributeValue = AttributeValue.builder()
                .n(String.valueOf(orderValue))
                .build();

        Map<String, AttributeValue> expressionValues = new HashMap<>();
        expressionValues.put(":value", attributeValue);

        Expression expression = Expression.builder()
                .expression("orderValue > :value")
                .expressionValues(expressionValues)
                .build();

        // Create a QueryConditional object that is used in the query operation
        QueryConditional queryConditional = QueryConditional
                .keyEqualTo(Key.builder().partitionValue(customerID)
                        .build());

        // Get items in the Customer table and write out the ID value
        PageIterable<Order> results = orderTable
                                        .query(r -> r.queryConditional(queryConditional)
                                                 .filterExpression(expression));
        return results;
  }


}
```
In this snippet, we are calling the `delete`, `scan`, and `query` methods on the mapped object `orderTable`. 


## Handling Nested Types

We can handle nested types by adding `@DynamoDbBean` annotation to the class being nested as shown in this example:

```java
@DynamoDbBean
public class Order {
  private String customerID;
  private String orderID;
  private double orderValue;
  private Instant createdDate;
    
  private List<Product> products;
  ..
  ..
}

@DynamoDbBean
public class Product {
  private String name;
  private String brand;
  private double price;
...
...

}

```

Here we have added a nested collection of `Product` class to the `Order` class and annotated the `Product` class with `@DynamoDbBean` annotation.


## Conclusion

In this article, we looked at the important concepts of AWS DynamoDB. we also saw how to use Spring Data for accessing the database of our application with the AWS RDS service. Here is a summary of the things we covered:
1. We store our data in a table in AWS Dynamo DB. A table is composed of items and each item has attributes.
2. A DynamoDB table must have a partition key and optionally a sort key.
3. We create a secondary Index to search on other fields
4. We accessed DynamoDB with Spring data module and then with enhanced dynamoDB client module of AWS Java SDK.

I hope this will help you to get started with building applications using Spring with AWS DynamoDB as the database. 

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/springdynamodb).