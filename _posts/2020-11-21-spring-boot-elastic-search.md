---
title: "Using Elasticsearch with Spring Boot"
categories: [spring-boot]
date: 2020-11-05 06:00:00 +1000
modified: 2020-11-05 06:00:00 +1000
author: pratikdas
excerpt: "How do we build a search function in Spring Boot using Elasticsearch?"
image:
  auto: 0086-twelve
---

Elasticsearch is a distributed search and analytics engine for various types of data, including textual, numerical, geospatial, structured, and unstructured. The data is stored as a JSON document in a storage called Index. The operations are exposed as REST APIs. We search an Index with a Query to fetch one or more Documents. 

Spring Data Elasticsearch provides a simple interface to perform operations on Elasticsearch.

In this article, we will use Spring Data Elasticsearch to build a simple search application and demonstrate:
1. Indexing a Document
2. Searching with Repositories
3. Searching with Elasticsearch Queries 

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-elasticsearch" %}


## Indexing a Document
A Document is the unit of storage in Elasticsearch. It is the equivalent of a row in a traditional database. Documents are stored in an Index which is the equivalent of a table. How we index the document during storage influences the results of a search query. When using Spring Data we represent a document in the form of a POJO and decorate it with annotations to define the mapping with Elasticsearch documents. 

Any text stored in Elasticsearch is first processed by an analyzer. The analyzer splits the text by common separators like space, and punctuation and removes common English words. If we store a text - "The sky is blue", the analyzer will store this as a document with the 'terms' - sky and blue. We will be able to search this document with text in the form of "blue sky", "sky", "blue" with a degree of the match indicated by a score. 

## Starting our Elasticsearch Instance
There are numerous ways of running an Elasticsearch instance :
1. Using a hosted service
2. Using a managed service from a Cloud Provider
3. DIY way by installing Elasticsearch in a cluster of VMs.
4. Running a Docker Image

We will use the Docker image from Dockerhub which is good enough for our demo application. Let us start our Elasticsearch instance by running the Docker `run` command:

```shell
docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.10.0
```

This will start an Elasticsearch instance listening on port 9200. We can verify the instance by hitting the URL - http://localhost:9200 and check the resulting output in our browser:

```xml
{
  "name" : "8c06d897d156",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "Jkx..VyQ",
  "version" : {
    "number" : "7.10.0",
    ...
  },
  "tagline" : "You Know, for Search"
}
```
We should get the above output if our Elasticsearch instance is started successfully. 

## Indexing and Searching with REST API

Elasticsearch operations are accessed with REST APIs. A simple PUT request to an Elasticsearch instance looks like this:

```shell
PUT /messages/_doc/1
{
  "message": "The Sky is blue today"
}
```
This will store the message - "The Sky is blue today" as a document in an Index named "messages". 

We can fetch this document with a search query sent to the `search` REST API: 
```shell
GET /messages/search
{
  "query": 
  {
    "match": {"message": "blue sky"}

  }
}
```
Here we are sending a query of type match for fetching documents matching the attribute message with values "blue sky". There is an analysis process during the query also. The text - "blue sky" will be tokenized into "blue" and "sky" and then matched with tokens associated with the documents in the index.

We can specify queries for searching documents in multiple ways, some of which are listed here : 
|Query                           |Result|
| ---------------------|-------------| 
|"match": {"message": "blue sky"}| 


## Elasticsearch Operations with Spring Data

We have two ways of accessing Elasticsearch with Spring Data.
- Repositories: We define methods in an interface and Elasticsearch Queries are generated from method names at runtime.

- Elasticsearch Operations: We create queries that have more control over creating Elasticsearch Queries.

Add diagram

## Creating the Application and Adding Dependencies

Let us first create our application with the [Spring Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.3.6.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik.elasticsearch&artifactId=productsearchapp&name=productsearchapp&description=Demo%20project%20for%20Elasticsearch%20with%20Spring%20Boot&packageName=io.pratik.elasticsearch.productsearchapp&dependencies=web,lombok,thymeleaf) by including the dependencies for web, thymeleaf, and lombok. 


We will now add the `Spring Data` dependencies for interacting with Elasticsearch. Spring Data is an umbrella project of multiple subprojects each of which are for a specific data store. 

```xml
    <dependency>
      <groupId>org.springframework.data</groupId>
      <artifactId>spring-data-elasticsearch</artifactId>
    </dependency>
```
Here we are adding the dependency for spring-data-elasticsearch which will enable us to use the Spring Data semantics for accessing the Elasticsearch data store.


## Connecting to the Elasticsearch Instance

We will connect to our Elasticsearch Instance by creating a Spring Bean Configuration. The Java High Level REST Client is the default client of Elasticsearch.  We will configure the client to access the Elasticsearch operations for searching and indexing. Spring Data Elasticsearch uses an Elasticsearch REST client that is connected to a single Elasticsearch node or a cluster.

```java
@Configuration
public class ElasticsearchClientConfig extends AbstractElasticsearchConfiguration {
  @Override
  @Bean
  public RestHighLevelClient elasticsearchClient() {

    final ClientConfiguration clientConfiguration = 
        ClientConfiguration
          .builder()
          .connectedTo("localhost:9200")
          .build();

    return RestClients.create(clientConfiguration).rest();
  }

```
Here we are connecting to our Elasticsearch instance running on localhost and listening on port 9200. We can further customize by adding more properties like enabling ssl, setting timeouts, etc. 

**Enabling transport layer logging**: To see what is sent to and received from the server, Request / Response logging on the transport level needs to be turned on as outlined in this snippet:

<logger name="org.springframework.data.elasticsearch.client.WIRE" level="trace"/>

## Representing the Document
Our model object looks like this:

```java
@Document(indexName = "productindex")
public class Product {
  @Id
    private String id;
  
  @Field(type = FieldType.Text, name = "name")
  private String name;
  
  @Field(type = FieldType.Double, name = "price")
  private Double price;
  
  @Field(type = FieldType.Integer, name = "quantity")
  private Integer quantity;
  
  @Field(type = FieldType.Keyword, name = "category")
  private String category;
  
  @Field(type = FieldType.Text, name = "desc")
  private String description;
  
  @Field(type = FieldType.Keyword, name = "manufacturer")
  private String manufacturer;
```

First the @Document annotation: This one specifies, which index our entities should go into. By default the spring application creates the index based on the configuration in this annotation and the following field annotations.

The @Id annotation, which makes this field the `_id` of our document, being the unique identifier in this index.

The @Field annotation configures the type of a field. We can also set the name to a different field name. 

## Indexing and Searching with Spring Data Repository

Repositories provide the most elegant way to access data in Spring Data using finder methods. Queries get created from method names. However, we have to be careful about not ending up with inefficient queries thereby putting a high load on the cluster.

We will create a repository by extending ElasticsearchRepository. Some methods like  `save` and `saveAll` are included by default. We will add the below finder methods to our interface.

```java
public interface ProductRepository 
      extends ElasticsearchRepository<Product, String> {
 
    List<Product> findByName(String name);
    
    List<Product> findByNameContaining(String name);
 
    List<Product> findByManufacturerAndCategory(String manufacturer,String category);
}
```
We will add a single document to the index by executing the JUnit method :

```java
  public void createProductIndex(final Product product) {
    productRepository.save(product);
  }
```

```java
  @Test
  void testCreateProductIndex() {
    final Product product = Product.builder()
        .id(UUID.randomUUID().toString())
        .name("Dell Vostro ..")
        ...
        .build();
    productSearchServiceWithRepo.createProductIndex(product);
```

For adding multiple documents we will execute saveAll method:

```java
  public void createProductIndexBulk(final List<Product> products) {
    productRepository.saveAll(products);
  }
```
## Indexing with ElasticsearchOperations

ElasticsearchRestTemplate is the new client of Elasticsearch based on HTTP and replaces the TransportClient which used the Elasticsearch node-to-node binary protocol. 

ElasticsearchRestTemplate implements ElasticsearchOperations, which does the heavy-lifting for low level search and cluster actions. 

```java
    List<IndexQuery> queries = products.stream()
        .map(product->
          new IndexQueryBuilder()
          .withId(product.getId().toString())
          .withObject(product).build())
        .collect(Collectors.toList());;
    
    return elasticsearchOperations
        .bulkIndex(queries,IndexCoordinates.of(INDEX_NAME));
```

```shell
 Sending request POST /_bulk?timeout=1m with parameters: 
Request body: {"index":{"_index":"productindex","_id":"383..35"}}
{"_class":"..Product","id":"383..35","name":"New Apple iPh..ue","price":2300.0,"quantity":55,"category":"phone","desc":"6.7-inch ..ing","manufacturer":"apple"}
{"index":{"_index":"productindex","_id":"c27..cd5"}}
{"_class":"..Product","id":"c27..cd5","name":"New Apple iPh..Blue","price":2300.0,"quantity":15,"category":"phone","desc":"5.4-inch..ance","manufacturer":"apple"}
{"index":{"_index":"productindex","_id":"e7e..29"}}
{"_class":"..Product","id":"e7e..29","name":"Samsung ..sor","manufacturer":"samsung"}
{"index":{"_index":"productindex","_id":"d7a..34"}}
{"_class":"..Product","id":"d7a..34","name":"Sam..LED","price":2100.0,"quantity":5,"category":"television","desc":"Reso..esign","manufacturer":"samsung"}
Received raw response: 200 OK
ProductSearchServiceTest - documentIDs [3831..35, c27..5, e7e..29, d7a..34]
```

```shell
Sending request PUT /productindex/_doc/59d..987?timeout=1m with parameters: 
Request body: {"_class":"io.pratik.elasticsearch.productsearchapp.Product","id":"59d135f5-8683-424b-b64e-7dedb467c987","name":"Dell Vostro 3401 14inch FHD AG 2 Side Narrow Border Display Laptop","price":2100.0,"quantity":28,"category":"laptop","desc":"Processor:10th Genera... Display","manufacturer":"dell"}
Received raw response: 201 CREATED
ProductSearchServiceTest - documentID 59d1..987

```

## Searching with Elasticsearch Operations

Searches look similar to Elasticsearch queries and are built by constructing a Query object and passing it to a search method. The queries are of three variants based on their method of construction. Let us build a few queries using these three variants:


1. NativeQuery
NativeQuery provides the maximum flexibility of building the query using objects representing Elasticsearch constructs like aggregation, filter, and sort.

```java
    QueryBuilder queryBuilder = 
        QueryBuilders
        .matchQuery("manufacturer", brandName);

    Query searchQuery = new NativeSearchQueryBuilder()
        .addAggregation(AggregationBuilders.cardinality("productName"))
        .withFilter(queryBuilder).build();

    SearchHits<Product> productHits = elasticsearchOperations.search(searchQuery, Product.class,
        IndexCoordinates.of(INDEX_NAME));

```
```shell
Sending request POST /productindex/_search..: 
Request body: {.."query":{"match_all":{"boost":1.0}},"post_filter":{"match":{"manufacturer":{"query":"samsung","operator":"OR",..}}},"version":true}

Received raw response: 200 OK
ProductSearchService - [SearchHit{id='ee5..b4', score=1.0, sortValues=[], content=Product(id=ee5..b4, name=Sam..age), price=2100.0, quantity=25, category=phone, description=12MP U..sor, manufacturer=samsung), highlightFields={}},

SearchHit{id='7a8..91', score=1.0, sortValues=[], content=Product(id=7a8..91, name=Samsung 163 cm (65 Inches) Q Series 4K Ultra HD QLED, price=2100.0, quantity=5, category=television, description=Res..ign, manufacturer=samsung), highlightFields={}}]

```
2. StringQuery

A StringQuery is formed with a valid JSON string.

```java
  public void findByProductName(final String productName) {
    Query searchQuery = new StringQuery(
        "\"{ \\\"match\\\": { \\\"name\\\": { \\\"query\\\": \\\"macbook\\\" } } } \"");

    SearchHits<Product> products = elasticsearchOperations.search(searchQuery, Product.class,
        IndexCoordinates.of(INDEX_NAME));

```

3. CriteriaQuery
CriteriaQuery uses method chaining to construct the Elasticsearch query as shown here:

```java
  public void findByProductPrice(final String productPrice) {
    Criteria criteria = new Criteria("price").greaterThan(10.0).lessThan(100.0);
    Query searchQuery = new CriteriaQuery(criteria);

    SearchHits<Product> products = elasticsearchOperations.search(searchQuery, Product.class,
        IndexCoordinates.of(INDEX_NAME));

```

## Building our Search Application

We will build an application that will have a search input box for searching for different products from an inventory. The products are stored with the attributes -  name, description, price, category, and manufacturer. We can search in three ways : 

1. **Exact Search**: We will search a product by specifying it's the exact name
2. **Like Search**: We can list products produced by a manufacturer. Since manufacturer names are long we will specify part of the name in our search query, to get back the list of products from a manufacturer whose name contains our search text.
3. **Fuzzy Search**: We will search for products by specifying a closely matching text in the description.

We will next create an HTML page [`search.html`]() containing the input box along with some JQuery code to handle the click events and invoking the search APIs of our application. We will save this HTML page under the resources/templates folder.







## Building the Search Index
We will create an index for the products in our inventory. We will use a sample dataset of fifty products to build our Index. The products are arranged as separate rows in a CSV file. Each row has three attributes - id, name, and description. We want the index to be created during application startup. However, index creation is a separate process in real environments. We will read each row of the csv and add to product index. 

In the core Elasticsearch api, there are two ways of adding documents to an index - adding one document at a time or adding documents in bulk. The api for adding individual documents accept a document as parameter.

For bulk addition, we need to supply a json document containing entries similar to the following snippet:

Spring Data abstracts these method in save and saveAll methods in the repository. We have used the saveAll method to add our documents:

```java
  @PostConstruct
  public void buildIndex() {

    esOps.indexOps(Product.class).refresh();

    productRepo.saveAll(prepareDataset());
  }

```
In this snippet, we do some preprocessing by reading the rows from the dataset and passing those to the saveAll method of the repository. On running the application we can see the below trace logs in the application start up.

```shell
...Sending request POST /_bulk?timeout=1m with parameters: 
Request body: {"index":{"_index":"productindex"}}
{"_class":"io.pratik.elasticsearch.productsearchapp.Product","name":"Hornby 2014 Catalogue","description":"Product Desc..talogue","manufacturer":"Hornby"}
{"index":{"_index":"productindex"}}
{"_class":"io.pratik.elasticsearch.productsearchapp.Product","name":"FunkyBuys..","description":"Size Name:Lar..& Smoke","manufacturer":"FunkyBuys"}
{"index":{"_index":"productindex"}}
.
...
```


## Executing Our Search
We will now build mechanisms to search our product inventory leveraging the Elasticsearch Index we built in the previous step. 
- **Exact Search**: We can search a product by exact name
- **Like Search**: We can list products produced by a manufacturer. Since manufacturer names are long we will specify part of the name in our search query.
- **Fuzzy Search**: We can use search products by closely matching text in the description.




## Conclusion 
We looked at the Spring Data 
When you’re creating a new index in Elasticsearch, it’s important to understand your data and choose your datatypes with care. Before creating the mapping for an index, it’s helpful to know how users might be searching for data in a specific field; this is especially true when you’re dealing with string data where partial matching may be needed. 



