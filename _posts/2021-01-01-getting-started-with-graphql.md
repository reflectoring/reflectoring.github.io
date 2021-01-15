---
title: "Getting Started with GraphQL"
categories: [spring-boot]
date: 2020-11-05 06:00:00 +1000
modified: 2020-11-05 06:00:00 +1000
author: pratikdas
excerpt: "We will introduce the GraphQL specification and explain with an example implementation in Java and Spring Boot"
image:
  auto: 0086-twelve
---

GraphQL was developed by Facebook in 2012 for their mobile apps. It was open-sourced in 2015 and is now used by many development teams, including some prominent ones like GitHub, Twitter, and Airbnb. Here we will see what is GraphQL and explain its usage with some simple examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/graphql" %}

## What is GraphQL

GraphQL is a specification of a query language for APIs. The client or API consumer sends the request in a query language containing the fields it requires and the server returns only the requested fields instead of the complete payload. 

We have a single endpoint on which the consumer sends different queries depending on the data of interest. A sample request/response to a GraphQL endpoint looks like this:

```
{
  product {
    name
    rating
    price
  }
}

```
In this sample, we send a request for fetching a product with attributes name, rating, and price, and the server returns the response containing only those fields (name, rating, and price). 

GraphQL shifts some responsibility to the client for constructing the query containing the fields of its interest. The server is responsible for processing the query and then fetching the data from an underlying system like a database or a web service.

So instead of the server providing multiple APIs for different needs of the consumer, the onus is thrown to the consumer to fetch only the data of its interest. 

## GraphQL SDL: Service, Types, and Fields
GraphQL is language-agnostic so it has its query language and a schema definition language. A `Type` is the most basic component of a GraphQL schema and represents a kind of object we can fetch from our service. 

### Type : Scaler and Object Type
We create a GraphQL service by defining types and then providing functions for each type. Similar to the types in many programming languages, a type can be a scaler like int, string, decimal, etc, or an object type formed with a combination of multiple scaler and complex types. An example of types for a GraphQL service that fetches a list of recent purchases looks like this:
```
type Product {
    id: ID!
    title: String!
    description: String!
    category: String
    madeBy: Manufacturer!
}

type Manufacturer {
    id: ID!
    name: String!
    address: String
}

```
Here we have defined object types: `Product` and `Manufacturer`. `Manufacturer` type is composed of scaler types with names: `id`, `name`, and `address`. Similarly, `Product` type is composed of four scaler types with names: `id`, `title`, `description`, `category`, and an object type `Manufacturer`.

### Special Types: Query, Mutation, and Subscription
We need to add root types of the GraphQL schema for adding functionality to the API. GraphQL Schema has three root-level types: Query, Mutation, and Subscription. These are special Types and signify the entry point of a GraphQL service. Of these three, only the Query type is mandatory for every GraphQL service. 

The root types determine the shape of the queries and mutations that will be accepted by the server. An example of Query root type for a GraphQL service that fetches a list of recent purchases looks like this:

```
type Query {
    myRecentPurchases(count: Int, customerID: String): [Product]!
}
```

A mutation is represented changes we can make on our object. Our schema with a mutation will look like this:

```
...
...
type Mutation {
    addPurchases(count: Int, customerID: String): [Product]!
}
```
Here, this mutation is used to add purchases.

Subscription is another special type for real-time push-style updates. Subscriptions depend on the use of a publishing mechanism to generate the event that notifies a subscription that is subscribed to that event. 

```
type Subscription {
  newProduct: Product!
}

```

## Server-Side Implementation
GraphQL has several [server side](https://graphql.org/code/#javascript-server) implementations available in multiple languages. These implementations roughly follow a pipeline pattern with the following stages:

1. An endpoint is exposed which accepts GraphQL queries. 
2. We define a schema with types, query, and mutation. 
3. We associate functions called resolvers with the types in the respective programming language to fetch data from underlying systems. 

A GraphQL endpoint can live along with side Rest APIs. Similar to REST, the GraphQL will also depend on a business logic layer for fetching data from underlying systems.

Support for GraphQL constructs varies across implementations. While the basic types: Query and Mutations are supported across all implementations, subscription support is not available in a few.

## Client Side Implementations
The consumers of the GraphQL API use this query language to request for the specific data of their interest instead of the complete payload from the API response. This is done by creating a strongly typed Schema of our API and instructions on how our API can resolve data and client queries.

On the client-side, at the most basic level, we can send the query as a JSON payload in a POST request to a `graphql` endpoint.

```shell
curl --request POST 'localhost:8080/graphql' --header 'Content-Type: application/json'  --data-raw '{"query":"query {myRecentPurchases(count:10){title,description}}"}'
```
Here we send a request for fetching 10 recent purchases with the fields title, and description in each record.

To avoid making the low-level HTTP calls, we should use a GraphQL client as an abstraction layer to take care of:
1. sending the request and handling the response
2. view layer integrations and optimistic UI updates
3. caching query results

There are several [client frameworks](https://graphql.org/code/#javascript-client) available with popular ones being [Apollo Client](https://github.com/apollographql/apollo-client), [Relay (from Facebook)](https://facebook.github.io/relay/), and [urql](https://github.com/FormidableLabs/urql).

## GraphQL Example with Spring Boot

We will use a Spring Boot application to build a GraphQL server implementation. For this, let us first create a Spring Boot application with the [Spring Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.4.2.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=graphqldemo&name=graphqldemo&description=Demo%20project%20for%20GraphQL%20with%20Spring%20Boot&packageName=io.pratik.graphqldemo&dependencies=web,lombok,h2). 

## Adding the Dependencies
For GraphQL server, we will add the following Maven dependencies: 

```xml
    <dependency>
      <groupId>com.graphql-java</groupId>
      <artifactId>graphql-spring-boot-starter</artifactId>
      <version>5.0.2</version>
    </dependency>
    <dependency>
      <groupId>com.graphql-java</groupId>
      <artifactId>graphql-java-tools</artifactId>
      <version>5.2.4</version>
    </dependency>
```
Here we have added `graphql-spring-boot-starter` as a GraphQL starter and a Java tools module `graphql-java-tools`.

### Defining the GraphQL Schema 
We can either take a top-down approach by defining the schema and then create POJO for each type or a bottom-up approach by creating the POJOs first followed by schema from the POJO classes. 

The GraphQL schema needs to be defined in a file with the extension `graphqls`. Let us define our schema in a file `product.graphqls`:

```
type Product {
    id: ID!
    title: String!
    description: String!
    category: String
    madeBy: Manufacturer!
}

type Manufacturer {
    id: ID!
    name: String!
    address: String
}

# The Root Query for the application
type Query {
    myRecentPurchases(count: Int, customerID: String): [Product]!
    lastVisitedProducts(count: Int, customerID: String): [Product]!
    productsByCategory(category: String): [Product]!
}

# The Root Mutation for the application
type Mutation {
    addRecentProduct(title: String!, description: String!, category: String) : Product!
}

```
Here we have added three operations to our Query and a Mutation for adding recent products.

Next, we define the POJO classes for the Object types: `Product` and `Manufacturer`:

```java
@Data
public class Product {
   private String id; 
   private String title;
   private String description; 
   private String category;
   private Manufacturer madeBy;
}
```
This `Product` POJO maps to the `product` type and `Manufacturer` maps to the `manufacturer` object defined in our GraphQL schema.


### Associate GraphQL Types with Resolvers

Multiple resolver components convert the GraphQl request received from the API consumers or front end and invoke operations to fetch data from applicable data sources. For each type, we define a `resolver`.

We will now add resolvers for all the types defined in the schema. We first add a resolver class named `QueryResolver` containing the methods corresponding to our GraphQL operations: 

```java
@Service
public class QueryResolver implements GraphQLQueryResolver {

  private ProductRepository productRepository;
  
  @Autowired
  public QueryResolver(final ProductRepository productRepository) {
    super();
    this.productRepository = productRepository;
  }

  public List<Product> getMyRecentPurchases(Integer count, String customerID) {
    
    List<Product> products = productRepository.getRecentPurchases(count);
    
    return products;
  }
  
  public List<Product> getLastVisitedProducts(final Integer count, final String customerID) {
    List<Product> products = productRepository.getLastVisitedPurchases(count);
    return products;
  }
  
  public List<Product> getProductsByCategory( final String category) {
    List<Product> products = productRepository.getProductsByCategory(category);
    return products;
  }

}
```
We have defined the `QueryResolver` class as a Service class to resolve the root Query in our GraphQL schema. This service class is injected with a repository class to fetch data from an H2 Database.

We next add a resolver for the `Manufacturer` object type:
```java
@Service
public class ProductResolver implements GraphQLResolver<Product>{

  private ManufacturerRepository manufacturerRepository;
  
  @Autowired
  public ProductResolver(ManufacturerRepository manufacturerRepository) {
    super();
    this.manufacturerRepository = manufacturerRepository;
  }

  public Manufacturer getMadeBy(final Product product) {
    return manufacturerRepository.getManufacturerById(product.getManufacturerID());
  }
}
```
This resolver fetches the `Manufacturer` record corresponding to a `Product`.

### Connecting to Datasources and Applying Middleware Logic
Next, we will enable our resolvers to fetch data from underlying data sources like a database or web service. For this example, we have configured an in-memory H2 database as the data store for `products` and `manufacturers`. We use Spring JDBC to retrieve data from the database and put this logic in separate repository classes. 

Apart from fetching data, we can also build different categories of middleware logic in this business service layer, like authorization of incoming requests, applying filters on data fetched from backend, transformation into backend data models, and also caching any less frequently changing data.

### Running Application
After compiling and running the application, we can send GraphQL queries to the endpoint http://localhost:8080/graphql. A sample request and response captured in postman tool is shown here :

![Snippet from Postman Tool](/assets/img/posts/graphql-intro/results.png)

## GraphQL vs REST
REST has been the de-facto style for building APIs. Good API designs are usually driven by consumer needs which can be varied. If we consider an e-commerce site, we might want to show recent purchases of a customer on an order history page and last viewed products on a profile page. 

With REST we will require two different APIs although we are working with the same product data. Alternately we might fetch the entire product data with all its relations every time even though we only need a part of the data. 

GraphQL tries to solve these problems of over fetching or under fetching data. With GraphQL, we will have a single endpoint on which the consumer can send different queries depending on the data of interest. Let us look into how GraphQL differs from REST.

### Shape of the API
REST API is based on resources that are identified by URLs and an HTTP method (GET, POST, PUT, DELETE.) indicating one of the CRUD operations. GraphQL in contrast is based on a data graph that is returned in response to a request sent as a query to a fixed endpoint.

### HTTP Status Codes
REST APIs are mostly designed to return 200 series status codes for success and 400 and 500 series for failures. GraphQL APIs return 200 as status code irrespective of whether it is a success or failure. 

### Health Check
With REST APIs, we check for a 200 status code on a specific endpoint to check if the API is healthy and capable of serving the requests. In GraphQL, health checking is relatively complex since the monitoring function needs to parse the response body to check the server status.

### Caching
With REST APIs, the GET endpoints are cached using a CDN or in the application layer. With GraphQL, caching on the client-side is better supported than REST with the help of GraphQL client implementations, for example, Apollo Client and URQL make use of GraphQL's schema and type system using introspection to maintain a client-side cache.


## Conclusion

In this article, we looked at the main capabilities of GraphQL and how it helps to solve some common problems associated with consuming APIs. 

We also looked at GraphQL's Schema Definition Language (SDL) along with the root types: Query, Mutation, and Subscription followed by how it is implemented on the server-side with the help of resolver functions. 

We finally set up a GraphQL server implementation with the help of two Spring modules and defined a schema with a Query and Mutation. We then defined resolver functions to connect the query with the underlying data source in the form of an H2 database. 

GraphQL is a powerful mechanism for building APIs but we should use it to complement REST APIs instead of using it as a complete replacement. For example, REST may be a better fit for APIs with very few entities and relationships across entities while GraphQL may be appropriate for applications with many different domain objects.
