---
title: "Working with AWS DynamoDB and Spring"
categories: [craft]
date: 2021-04-25 06:00:00 +1000
modified: 2021-04-25 06:00:00 +1000
author: pratikdas
excerpt: "AWS Relational Database Service (RDS) is a managed database service in AWS Cloud. Spring Cloud AWS provides convenient configurable components to integrate applications with the RDS service. In this article, we will look at using Spring Cloud AWS for working with AWS RDS with the help of some code examples"
image:
  auto: 0074-stack
---

Amazon DynamoDB is a NoSQL database service available in AWS Cloud. It is fully managed and provides fast and predictable performance for storing and retrieving any amount of data, and serve any level of request traffic. Amazon DynamoDB automatically spreads the data and traffic for the table over a sufficient number of servers to handle the request capacity specified by the customer and the amount of data stored, while maintaining consistent and fast performance.

In this article, we will look at using the DynamoDB database in Spring Boot applications along with code examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/springdynamodb" %}


## AWS DynamoDB Concepts
[Amazon DynamoDB](https://aws.amazon.com/dynamodb/) is a fully managed service key-value and document database. Being a managed service, AWS takes care of  operating and scaling database so we don’t have to worry about hardware provisioning, setup and configuration, throughput capacity planning, replication, software patching, or cluster scaling. We will introduce the concepts which are required to know for building applications.

### Tables, Items and Attributes
Like all databases,we start with a table to represent our entities like a person, customer, product. A table contains items similar to the rows in a RDBMS.

### Uniquely Identifying Items in a Table with Primary Key
We specify a primary key to uniquely identify an item in the table. Primary Keys are of two types:
1. **Simple Primary Key**: This is composed of one attribute called the Partition Key.
2. **Composite Primary Key**: This is composed of two attributes Partition and Sort Keys.

### Querying with Secondary Indexes
We can use a secondary index to query the data in the table using an alternate key, in addition to queries against the primary key. Secondary Indexes are of two types:

- **Global secondary index** : An index with a partition key and sort key that are different from the partition key and sort key of the table.
- **Local secondary index** :An index that has the same partition key as the table, but a different sort key.

### Data Distribution in Partitions
A partition is a unit of storage for a table where the data is stored by DynamoDB. It is backed by solid state drives (SSDs) and replicated across multiple Availability Zones within an AWS Region. If our table has a simple primary key (partition key only), DynamoDB stores and retrieves each item based on its partition key value.

To write an item to the table, DynamoDB uses the value of the partition key as input to an internal hash function. The output value from the hash function determines the partition in which the item will be stored.

To read an item from the table, we must specify the partition key value for the item. DynamoDB uses this value as input to its hash function, yielding the partition in which the item can be found.

### Designing Partition Key for Efficiency
The primary key that uniquely identifies each item in an Amazon DynamoDB table can be simple (a partition key only) or composite (a partition key combined with a sort key).

We should design your application for uniform activity across all logical partition keys in the table and its secondary indexes. We can determine the access patterns that our application requires, and estimate the total read capacity units (RCU) and write capacity units (WCU) that each table and secondary index requires.

## Setting up DynamoDB
We can run a local instance of DynamoDB for development and testing. We can remove the local endpoint in the code, and then it will points to the DynamoDB web service, When we are ready to deploy our application in production. DynamoDB Local is available as a download (requires JRE), as an Apache Maven dependency, or as a Docker image.



## Writing Applications with DynamoDB
We can interact with AWS DynamoDB with the AWS SDK. Spring applications

## Accessing DynamoDB with Spring Data
The primary goal of the Spring® Data project is to make it easier to build Spring-powered applications that use data access technologies.

Support for DynamoDB in Spring Data is available as a community module. This module deals with enhanced support for a data access layer built on AWS DynamoDB.

Add dependency

```xml
<dependency>
  <groupId>com.github.derjust</groupId>
  <artifactId>spring-data-dynamodb</artifactId>
  <version>5.1.0</version>
</dependency>
```

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

Let us first create a DynamoDB table to store customers:

![Table creation](/assets/img/posts/aws-dynamodb-java/table-creation.png)
We are using the AWS console to create a table named `Customer` with `CustomerID` as partition key and `OrderID` as the sort key. We are following the partitioning best practices here. Having customerID as partition key will ensure that order items of same customer will be stored and fetched together resulting in efficient fetch times.

Create a DynamoDB entity `Customer` for this table:
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
We have decorated the getter methods with `@DynamoDBAttribute` passing in the name of the attribute.

To define a repository interface, we first need to define a domain class-specific repository interface. The interface must extend Repository and be typed to the domain class and an ID type. Next let us create our repository interface `CustomerRepository` and invoke it from a `service` class: 

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

Let us first create a DynamoDB table to store the orders placed by a customer:

![Table creation](/assets/img/posts/aws-dynamodb-java/table-creation.png)
We are using the AWS console to create a table named `Order` with `CustomerID` as partition key and `OrderID` as the sort key. We are following the partitioning best practices here. Having customerID as partition key will ensure that order items of same customer will be stored and fetched together resulting in efficient fetch times.

We broadly do this in four Steps
Including the `dynamodb-enhanced` as a dependency.
Defining the data class to represent the DynamoDB item in the table.
Defining the DynamoDbEnhancedAsyncClient.
Defining the repository class.

Let us first add the Maven dependency in our `pom.xml`:

```xml
    <dependency>
      <groupId>software.amazon.awssdk</groupId>
      <artifactId>dynamodb-enhanced</artifactId>
      <version>2.16.74</version>
    </dependency>
```

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

In order for the AWS SDK v2 for Java’s Enhanced Client to detect an attribute on a @DynamoDbBean, the field must have a setter. 

```java
@SpringBootTest
class OrderRepositoryTest {
  
  @Autowired
  private OrderRepository orderRepository;

  @Test
  void testCreateOrder() {
    Order order = new Order();
    order.setOrderID("ORD-007");
    order.setCustomerID("CUST-001");
    order.setOrderValue(56.7);
    order.setCreatedDate(Instant.now());
    orderRepository.save(order);
  }
  
  @Test
  void testGetOrder() {
    Order order = 
        orderRepository.getOrder("CUST-001", "ORD-007");
    System.out.println("order "+order.getOrderID());
  }

}

```

AFter running thus test we can view the item created in the DynamoDB console:
![Item created](/assets/img/posts/aws-dynamodb-java/item-created.png)


Handling Nested Types

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

```shell
java.lang.IllegalStateException: Converter not found for EnhancedType(io.pratik.dynamodbapps.models.Product)
  at software.amazon.awssdk.enhanced.dynamodb.DefaultAttributeConverterProvider.lambda$converterFor$0(DefaultAttributeConverterProvider.java:134)
  ...
  ...

```



## Conclusion

In this article, we looked at the important concepts of AWS DynamoDB. we also saw how to use Spring Data for accessing the database of our application with the AWS RDS service. Here is a summary of the things we covered:
1. We store our data in a table in AWS Dynamo DB. A table is composed of items and each item has attributes.
2. A DynamoDB table must have a partition key and optionally a sort key.
2. Indexes
3. Read-replica feature of RDS is used to increase throughput and is can be enabled in Spring Cloud JDBC by setting a property and decorating a method with `Transaction read only` annotation.
4. Failover support is provided with the help of retry interceptors.

I hope this will help you to get started with building applications using Spring with AWS DynamoDB as the data source. 

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/springdynamodb).