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

Elasticsearch is built on [Apache Lucene](https://lucene.apache.org) and was first released by Elasticsearch N.V. (now Elastic) in 2010. According to the website of [Elastic](https://www.elastic.co/what-is/elasticsearch), it is a distributed, open source **search and analytics engine** for all types of data, including textual, numerical, geospatial, structured, and unstructured.  

The operations of Elasticsearch are exposed as REST APIs. The primary functions are of storing Documents in an Index, searching the Index with powerful Queries to fetch those Documents, and also run analytic functions on the data. **Spring Data Elasticsearch provides a simple interface to perform these operations on Elasticsearch instead of the REST APIs.**

In this article, we will use Spring Data Elasticsearch to highlight the main capabilities of Elasticsearch - indexing of documents and searching and finally build a simple search application for searching products in a product inventory.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-elasticsearch" %}


## Indexing a Document
The easiest way to get introduced to Elasticsearch concepts is by drawing an analogy with a database as illustrated in this table:

|Elasticsearch|->|Database|
|-------------|--------|
|Index|->|Table|
|Document|->||Row|
|Field|->|Column|

Any data we want to search or analyze is stored as a Document in an Index. In Spring Data we represent a Document in the form of a POJO and decorate it with annotations to define the mapping with a Elasticsearch Document. 

Unlike a database, the text stored in Elasticsearch is first processed by various analyzers. The default analyzer splits the text by common word separators like space, and punctuation, and also removes common English words. 

If we store a text - "The sky is blue", the analyzer will store this as a Document with the 'terms' - sky and blue. We will be able to search this Document with text in the form of "blue sky", "sky", or "blue" with a degree of the match given as a score. Apart from text, Elasticsearch can store other types of data known as `Field Type` as explained under the section on [mapping-types](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html) in the documentation.

## Starting our Elasticsearch Instance
Before going any further, let us start an Elasticsearch instance which we will use through out for running our examples. There are numerous ways of running an Elasticsearch instance :
1. Using a hosted service
2. Using a managed service from a Cloud Provider like [AWS](https://aws.amazon.com/elasticsearch-service/) or [Azure](https://azuremarketplace.microsoft.com/en-in/marketplace/apps/elastic.elasticsearch)
3. DIY way by installing Elasticsearch in a cluster of VMs.
4. Running a [Docker Image](https://www.docker.elastic.co)

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

Elasticsearch operations are accessed with REST APIs. There are two ways of adding documents to an index - adding one document at a time or adding documents in bulk. The API for adding individual documents accepts a document as a parameter.

A simple PUT request to an Elasticsearch instance for storing a Document looks like this:

```shell
PUT /messages/_doc/1
{
  "message": "The Sky is blue today"
}
```
This will store the message - "The Sky is blue today" as a Document in an Index named "messages". 

We can fetch this Document with a search query sent to the `search` REST API: 
```shell
GET /messages/search
{
  "query": 
  {
    "match": {"message": "blue sky"}

  }
}
```
Here we are sending a query of type `match` for fetching Documents matching the attribute message with values "blue sky". We can specify queries for searching documents in multiple ways. Elasticsearch provides a JSON based [Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html) (Domain Specific Language) to define queries.

For bulk addition, we need to supply a JSON document containing entries similar to the following snippet:

## Elasticsearch Operations with Spring Data

We have two ways of accessing Elasticsearch with Spring Data as shown here:

![Elasticsearch Operations Types with Spring Data](/assets/img/posts/spring-data-elasticsearch/Elasticsearch-springdata.png)

- **Repositories**: We define methods in an interface and Elasticsearch Queries are generated from method names at runtime. 

- **ElasticsearchRestTemplate**: We create queries with method chaining and native queries to have more control over creating Elasticsearch Queries in relatively complex scenarios.

We will look at these two ways in much more detail in the following sections.

## Creating the Application and Adding Dependencies

Let us first create our application with the [Spring Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.3.6.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik.elasticsearch&artifactId=productsearchapp&name=productsearchapp&description=Demo%20project%20for%20Elasticsearch%20with%20Spring%20Boot&packageName=io.pratik.elasticsearch.productsearchapp&dependencies=web,lombok,thymeleaf) by including the dependencies for web, thymeleaf, and lombok. 

We will now add the `Spring Data` dependencies in our Maven `pom.xml` for interacting with Elasticsearch: 

```xml
    <dependency>
      <groupId>org.springframework.data</groupId>
      <artifactId>spring-data-elasticsearch</artifactId>
    </dependency>
```
Here we are adding the dependency for `spring-data-elasticsearch` which will enable us to use the Spring Data semantics for accessing the Elasticsearch data store.


## Connecting to the Elasticsearch Instance

  Spring Data Elasticsearch uses [Java High Level REST Client (JHLC)](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-high.html#java-rest-high) to connect to Elasticsearch server. JHLC is the default client of Elasticsearch. We will create a Spring Bean Configuration to set this up:

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
Here we are connecting to our Elasticsearch instance which we started earlier. We can further customize the connection by adding more properties like enabling ssl, setting timeouts, etc. 

**Enabling transport layer logging**: For debugging and diagnostics, we will turn on  request / response logging on the transport level as outlined in this snippet:

<logger name="org.springframework.data.elasticsearch.client.WIRE" level="trace"/>

## Representing the Document
In our example, we will search for products by its name, brand, price, or description. So for storing the product as a Document in Elasticsearch, we will represent the product as a POJO, and decorate with `Field` annotations to configure the mapping with Elasticsearch as shown here:

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

The `@Document` annotation specifies the index name. By default the spring application creates the index based on the configuration in this annotation along with annotations for Id and Field as explained next. 

The `@Id` annotation, which makes this field the `_id` of our document, being the unique identifier in this index. 

The `@Field` annotation configures the type of a field. We can also set the name to a different field name. 

## Indexing and Searching with Spring Data Repository

Repositories provide the most elegant way to access data in Spring Data using finder methods. The Elasticsearch queries get created from method names. However, we have to be careful about not ending up with inefficient queries thereby putting a high load on the cluster.

Let us create a Spring Data repository interface by extending [ElasticsearchRepository](https://docs.spring.io/spring-data/elasticsearch/docs/current/api/org/springframework/data/elasticsearch/repository/ElasticsearchRepository.html) interface: 

```java
public interface ProductRepository 
      extends ElasticsearchRepository<Product, String> {
}
```
Some methods like  `save` and `saveAll` are included from the `ElasticsearchRepository` interface.
We will now store some products in the index by invoking the `save` method for storing one product and `saveAll` method for bulk indexing. Before that we will put the repository interface inside a service class:

```java
@Service
..
public class ProductSearchServiceWithRepo {

  private ProductRepository productRepository;

  public void createProductIndexBulk(final List<Product> products) {
    productRepository.saveAll(products);
  }

  public void createProductIndex(final Product product) {
    productRepository.save(product);
  }
```
When we call these methods from JUnit, we can see in the trace log, the REST APIs for index and bulk index being called corresponding to invocation of `save` and `saveAll` methods.


For fufilling our search requirements, we will add finder methods to our interface:

```java
public interface ProductRepository 
      extends ElasticsearchRepository<Product, String> {
 
    List<Product> findByName(String name);
    
    List<Product> findByNameContaining(String name);
 
    List<Product> findByManufacturerAndCategory(String manufacturer,String category);
}
```

On running the method `findByName` with JUnit, we can see Elasticsearch queries generated before sending to server in the trace logs:
```shell
TRACE Sending request POST /productindex/_search? ..: 
Request body: {.."query":{"bool":{"must":[{"query_string":{"query":"apple","fields":["name^1.0"],..}
```

Simmilarly, by running the method `findByManufacturerAndCategory`, we can see the query generated with two `query_string` corresponding to the two fields - "manufacturer" and "category" being searched on.
```shell
TRACE .. Sending request POST /productindex/_search..: 
Request body: {.."query":{"bool":{"must":[{"query_string":{"query":"samsung","fields":["manufacturer^1.0"],..}},{"query_string":{"query":"laptop","fields":["category^1.0"],..}}],..}},"version":true}
```


## Indexing with ElasticsearchRestTemplate
Spring Data repository may not be suitable in situations when we need more control over how we design our queries or teams already have expertise with Elasticsearch syntax. 

In this situation, we use [ElasticsearchRestTemplate](https://docs.spring.io/spring-data/elasticsearch/docs/current/api/org/springframework/data/elasticsearch/core/ElasticsearchRestTemplate.html). It is the new client of Elasticsearch based on HTTP and replaces the TransportClient of earlier versions, which used a node-to-node binary protocol. 

ElasticsearchRestTemplate implements the interface - ElasticsearchOperations, which does the heavy-lifting for low level search and cluster actions. This interface has the methods `index` for adding a single Document and `bulkIndex` for adding multiple Documents to the Index. The code snippet here shows the use of `bulkIndex` for adding multiple products to the Index - "productindex":

```java
  private static final String PRODUCT_INDEX = "productindex";

  private ElasticsearchOperations elasticsearchOperations;

    List<IndexQuery> queries = products.stream()
        .map(product->
          new IndexQueryBuilder()
          .withId(product.getId().toString())
          .withObject(product).build())
        .collect(Collectors.toList());;
    
    return elasticsearchOperations
        .bulkIndex(queries,IndexCoordinates.of(PRODUCT_INDEX));
```
The Document to be stored is enclosed within an IndexQuery object. The `bulkIndex` method takes as input a list of `IndexQuery` objects and name of the Index wrapped inside `IndexCoordinates` class. When we execute this method, we get a trace of the REST API for `bulk`request.

```shell
 Sending request POST /_bulk?timeout=1m with parameters: 
Request body: {"index":{"_index":"productindex","_id":"383..35"}}
{"_class":"..Product","id":"383..35","name":"New Apple .."manufacturer":"apple"}
..
{"_class":"..Product","id":"d7a..34",.."manufacturer":"samsung"}
```
Next, we use the index method to add a single Document:
```java
    IndexQuery indexQuery = new IndexQueryBuilder()
           .withId(product.getId().toString())
           .withObject(product).build();
    .. elasticsearchOperations
    .index(indexQuery, IndexCoordinates.of(PRODUCT_INDEX));

```

The trace accordingly shows the REST API PUT request for adding a single Document.
```shell
Sending request PUT /productindex/_doc/59d..987..: 
Request body: {"_class":"..Product","id":"59d..87",.."manufacturer":"dell"}

```

## Searching with ElasticsearchRestTemplate

ElasticsearchRestTemplate also has the `search` method for searching Documents in an Index. This search operation resembles Elasticsearch queries and are built by constructing a Query object and passing it to a search method. 

The Query object is of three variants - Native, String, and Criteria Query depending on the method of construction. Let us build a few queries for searching products:


1. NativeQuery
NativeQuery provides the maximum flexibility of building the query using objects representing Elasticsearch constructs like aggregation, filter, and sort. Here is `nativeQuery` for searching products matching a particular manufacturer. 

```java
    QueryBuilder queryBuilder = 
        QueryBuilders
        .matchQuery("manufacturer", brandName);

    Query searchQuery = new NativeSearchQueryBuilder()
        .addAggregation(AggregationBuilders.cardinality("productName"))
        .withFilter(queryBuilder).build();

    SearchHits<Product> productHits = 
      elasticsearchOperations
      .search(searchQuery, 
              Product.class,
              IndexCoordinates.of(PRODUCT_INDEX));

```
Here we are building query containing the components match,filter, and aggregate.

2. StringQuery

A StringQuery is formed by constructing the query as a valid JSON string.

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

We will now add a screen(User Interface) to our application to see the product search in action. The user interface will have a search input box for searching products on name or description. The input box will have a autocomplete feature to show a list of suggestions based on searches done earlier.

For building this application we will create :
1. REST API for search with endpoint "/products"
2. REST API for fetching suggestions for autocomplete with endpoint "/suggestions"
3. Controller class - [SearchController]() for API endpoints
4. Service class - [ProductSearchService]() containing methods for search and fetching suggestions.
5. HTML page [`search.html`]() with an input textbox along with some JQuery code to handle the autocomplete and search events, and for invoking the APIs for searching and fetching suggestions for search text.
6. We will use [Thymeleaf](https://www.thymeleaf.org/index.html) as the templating engine. So we will add a dependency for thymeleaf and save [`search.html`]() HTML page under the resources/templates folder.

## Building the Product Search Index
We will work with two indices here:
```java
  private static final String PRODUCT_INDEX = "productindex";
  private static final String SEARCH_SUGGEST_INDEX = "searchsuggest";
```  
The `productindex` is the same Index we had used earlier for running the JUnit tests. We will first delete the `productindex` with Elasticsearch REST API, so that the `productindex` is created fresh during application start up with products loaded from our sample dataset of 50 fashion-line products:
```shell
curl -X DELETE http://localhost:9200/productindex
```
We will get the message `{"acknowledged":true}` if the delete operation is successful. 

We will create an Index for the products in our inventory. We will use a sample dataset of fifty products to build our Index. The products are arranged as separate rows in a [CSV file](). Each row has three attributes - id, name, and description. We want the index to be created during application startup. However, index creation is a separate process in real environments. We will read each row of the CSV and add it to the product index. 

```java
    @PostConstruct
    public void buildIndex() {
      esOps.indexOps(Product.class).refresh();
      productRepo.saveAll(prepareDataset());
    }

    private Collection<Product> prepareDataset() {
    Resource resource = new ClassPathResource("fashion-products.csv");
    ...
    return productList;
  }
```
In this snippet, we do some preprocessing by reading the rows from the dataset and passing those to the saveAll method of the repository to add products to the Index. On running the application we can see the below trace logs in the application start up.

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
## Building the Suggestions Search Index
We will also create another Index `searchsuggest` for storing the search text when we receive a search request from a user. 

Here is the POJO for `SearchSuggest` containing the mapping with Elasticsearch Document by means of `Field` annotations:
```java
@Document(indexName = "searchsuggest")
public class SearchSuggest {
  
  @Id
  private String id;
  
  @Field(type = FieldType.Text)
  private String searchText;
  
  @CreatedDate
  @Field(type = FieldType.Date, format = DateFormat.basic_date_time)
  private Instant creationDate;
```
The `SearchSuggest` POJO contains the field - `searchText` for storing the query used for search and creation datettime. We do not want to add duplicate search requests. So we will populate the `id` field with the search text as shown here:
```java
  public void updateSuggestionsIndex(String query) {
    if(query.getBytes().length < 512) {
       searchSuggestRepository
          .save(SearchSuggest
              .builder()
              .id(query)
              .searchText(query)
              .build());
    }
```    
The `id` field has a constraint of 512 characters. In our case a search text exceeding 512 bytes is unlikely so we will simply not store those texts in the `searchsuggest` Index.




## Searching Products with Multi-field and Fuzzy Search
The product search happens in two steps when we submit the search request. Here is how we process the search request in the method `processSearch`:

```java
  private static final String PRODUCT_INDEX = "productindex";
  private static final String SEARCH_SUGGEST_INDEX = "searchsuggest";

  private ElasticsearchOperations elasticsearchOperations;
  private SearchSuggestRepository searchSuggestRepository; 

  public List<Product> processSearch(final String query) {
    log.info("Search with query {}", query);
    
    // 1. Update searchsuggest Index
    updateSuggestionsIndex(query);  

    // 2. Create query on multiple fields enabling fuzzy search
    QueryBuilder queryBuilder = 
        QueryBuilders
        .multiMatchQuery(query, "name", "description")
        .fuzziness(Fuzziness.AUTO);

    Query searchQuery = new NativeSearchQueryBuilder()
                        .withFilter(queryBuilder)
                        .build();

    // 3. Execute search
    SearchHits<Product> productHits = 
        elasticsearchOperations
        .search(searchQuery, Product.class,
        IndexCoordinates.of(PRODUCT_INDEX));

    // 4. Map searchHits to product list
    List<Product> productMatches = new ArrayList<Product>();
    productHits.forEach(srchHit->{
      productMatches.add(srchHit.getContent());
    });
    return productMatches;
  }
...
```
We will first update the suggestions Index and then perform a search on multiple fields on the product index on fields - name and description.

## Fetching Suggestions with Wild-card Search
When we type into the search text field, we will fetch suggestions by performing a wild card search with the characters entered in the search box.

```java
  public List<String> fetchRecentSuggestions(String query) {
    QueryBuilder queryBuilder = QueryBuilders
        .wildcardQuery("searchText", "*");

    Query searchQuery = new NativeSearchQueryBuilder()
        .withFilter(queryBuilder).build();

    SearchHits<SearchSuggest> searchSuggestions = 
        elasticsearchOperations.search(searchQuery, 
            SearchSuggest.class,
        IndexCoordinates.of(SEARCH_SUGGEST_INDEX));
    
    List<String> suggestions = new ArrayList<String>();
    searchSuggestions.getSearchHits().forEach(srchHit->{
      suggestions.add(srchHit.getContent().getSearchText());
    });
    return suggestions;
  }
```


## Conclusion 
We looked at the Spring Data 
When you’re creating a new index in Elasticsearch, it’s important to understand your data and choose your datatypes with care. Before creating the mapping for an index, it’s helpful to know how users might be searching for data in a specific field; this is especially true when you’re dealing with string data where partial matching may be needed. 



