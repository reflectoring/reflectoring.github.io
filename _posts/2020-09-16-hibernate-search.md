---
title: "Full-Text Search with Hibernate Search and Spring Boot"
categories: [spring-boot]
date: 2020-09-16 20:00:00 +1100
modified: 2020-09-16 20:00:00 +1100
author: mmr
excerpt: "Hibernate Search lets you enable Fulltext search functionality in your existing Spring Boot application. Not 
just that it also provides seamless integration with Fulltext powerhouses such as Elasticsearch."
image:
  auto: 0052-mock
---

If you want to integrate extensive full-text search features in your Spring Boot application without having to make 
major changes Hibernate Search is a way to go.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/hibernate-search" %}

## Introduction
Adding full-text search functionality with Hibernate Search is as easy as adding a dependency and a couple of annotations to your entities. Well, this is an oversimplification of the process, but yes, it's easy.

Hibernate Search provides integration with Lucene and Elasticsearch which are highly optimized for full-text search. While Lucene and Elasticsearch handle searches, Hibernate Search provides seamless integration between them and Hibernate. 
We only need to manage entities hibernate will manage indexes of us.

This kind of setup allows us to redirect our text-based queries to search frameworks and standard SQL queries to our RDBMS 
database.  

## Setting Things Up
To get started first we need to add Hibernate search dependency (Gradle notation):
```groovy
implementation 'org.hibernate:hibernate-search-orm:5.11.5.Final'
```
For this tutorial, we're going to use the Elasticsearch integration. The motivation is that it's far easier
to scale with Elasticsearch than with Lucene.  
```groovy
implementation 'org.hibernate:hibernate-search-elasticsearch:5.11.5.Final'
```   
Also, you will need to add the following properties in your `application.yml` file:
```yaml
spring:
  jpa:
    properties:
      hibernate:
        search:
          default:
            indexmanager: elasticsearch
            elasticsearch:
              host: <Elasticsearch-url>
              index_schema_management_strategy: drop-and-create
              required_index_status: yellow
```
A few things to note here:
* `default` means the following configurations apply to all the indexes. Hibernate Search allows us to apply configurations to a specific index too. In this case, `default` must be replaced with the fully qualified class name of the indexed entity. The above configurations are common for all indexes.
* `required_index_status` indicates the safest status of the index after which further operation could be performed. 
The default value is `green`. If your Elasticsearch setup doesn't have the required number of nodes, index status will be `yellow`.
* Further properties and its details can be found in Hibernate Search Document's 
[Elasticsearch integration section](https://docs.jboss.org/hibernate/stable/search/reference/en-US/html_single/#elasticsearch-integration-configuration).


One more thing to note here is that Hibernate Search v.5 only supports Elasticsearch up to v.5.2.x, though I have been using it with v.6.8, and it's working just fine. But, if you are using or planning on using Elasticsearch v.7 you might want to use Hibernate Search v.6 which is still in Beta at the time of this writing.

If you choose to stick with Lucene (which is the default integration) you can still follow along as the APIs are almost 
identical across integrations.

## How Does Hibernate Search Work?

Working of the Hibernate Search can be summarized by the following points:
* First, we need to tell hibernate what Entities we want to index. More on this is [Preparing Entities For Indexing](#preparing-entities-for-indexing)
* We can also tell hibernate how to index the fields of those entities using [Analysers and Normalizers](#analyzers-and-normalizers)
* Then, when we boot up the application based on our selected `index_schema_management_strategy` hibernate will either 
create, update or validate index mappings in the Elasticsearch. You can find more details for the same in [Hibernate Search Documentaion](https://docs.jboss.org/hibernate/stable/search/reference/en-US/html_single/#elasticsearch-integration-configuration)
* Once the application has started, Hibernate Search will keep track of any operations performed on the entities and 
will apply the same on its corresponding indexes in the Elasticsearch. 
* Once we have loaded some data in Indexes we can perform search queries using hibernate search APIs. At time searching 
hibernate will again apply the same analyzers and normalizers used on fields on the query input. For the resulting data, it will
again fire one query to fetch complete entities from the database. Read more about this in [Performing Queries](#performing-queries).  

## Some Important Terms

### Text and Keyword
A `String` field can be either mapped to the `text` or the `keyword` type of Elasticsearch. **The primary difference between `text` and
a `keyword` is that a `text` field can be tokenized while a `keyword` cannot.** We can make use of the `keyword` type when we 
want to perform filtering or sorting operations on the field.

For instance, let's assume that we have a `String` field called `body` field, and let's say it has the value 'Hibernate is fun'. 

If we choose to treat `body` as text then we will be able to tokenize it ['Hibernate', 'is', 'fun'] and we will be able to perform queries like 
`body: Hibernate`.
 
If we make it a `keyword` type, a match will only be found if we pass the complete text `body: Hibernate is fun`
(Wildcard will work, though: `body: Hibernate*`).

Elasticsearch supports numerous other types full list can be found at [Elasticsearch Mapping types doc](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html).

### Analyzers and Normalizers

Analyzers and Normalizers are a kind of text analysis operations that are performed on `text` and `keyword` respectively, 
while indexing them and searching them. 

When an analyzer is applied on `text`, it first tokenizes the text and then applies one or more 
filters such as a lowercase filter (which converts all the text to lowercase) or a stop word filter (which removes common English stop words such as 'is',
'an', 'the' etc). 

Normalizers are similar to analyzers with the difference that normalizers don't apply a tokenizer. 

**On a given field we can either apply an analyzer or a normalizer.**

Some things to note about analyzers and normalizers when using Elasticsearch integration:
* Although you can use Lucene's built-in analyzers or even custom analyzers using `@AnalyzerDef`, it's recommended to use 
built-in Elasticsearch analyzers. As built-in analyzers won't allow you to take full advantage of Elasticsearch analyzers. 
* Built-in Normalizers are directly translated to Elasticsearch supported normalizers but for this to work you 
need to define Normalizer using `@NormalizerDef`


To summarize:

|Text|Keyword|
|----|-------|
|Is tokenized|Can not be tokenized|
|Is analyzed | Can be normalized|
|Can perform term based search| Can only match exact text|


## Preparing Entities For Indexing
As I have said in the introduction to index entities we just need to annotate the entities and its fields with 
a couple of annotations.

Let's look at the `Post` entity to understand it better. 

```java
@Getter
@Setter
@Entity
@Indexed(index = "idx_post")
@NormalizerDef(name = "lower",
    filters = @TokenFilterDef(factory = LowerCaseFilterFactory.class))
class Post {
  @Id
  private String id;

  @Field(name = "body") 
  @Field(name = "bodyFiltered", 
        analyzer = @Analyzer(definition = "stop"))
  private String body;

  @ManyToOne
  @IndexedEmbedded
  private User user;

  @Field(normalizer = @Normalizer(definition = "lower"))
  @Enumerated(EnumType.STRING)
  private Tag tag;

  private String imageUrl;

  private String imageDescription;

  @Field
  private String hashTags;

  @Field
  @SortableField
  private long likeCount;

  @Field(analyze = Analyze.NO)
  @SortableField
  private LocalDateTime createdAt;
}
```

**Note**: The examples make use of project Lombok to avoid boilerplate code such as getters and setters

You will notice a couple of new annotations in the class above. 

### @Indexed Annotation

As the name suggests, with `@Indexed` we make this entity eligible for indexing. I have also 
given the index the name `idx_post` which is not required. By default, Hibernate Search will use the fully qualified class
name as the index name. 

### @Field Annotation
We need to apply the `@Field` annotation on all the fields that we wish to search, sort or need for projection.  

Let's look at the `Post` class and zoom in on some fields to see how we can change the handling of the fields by 
setting various properties of `@Field` annotation.

#### `@Field(name = "body")`

With this the string will be saved as `text`, and a default analyzer will be applied to the value. Also, we don't need to set the `name` property if we are content with the class field name. 

#### `@Field(name = "bodyFiltered", analyzer = @Analyzer(definition = "stop"))` 

We can also apply multiple `@Field` annotations on a single field. 
Here I have given a different name to the 
field and have also provided a different analyzer. This allows us to perform different kinds of search operations on the same entity field. We can also pass different analyzers using the `analyzer` property. Here, I have passed `stop` value in the analyzer 
definition which refers to an in-built Elasticsearch analyzer called "Stop Analyzer". It removes common stop words ('is','an', etc) that aren't very helpful while querying. Here's a list of other 
[Elasticsearch's Built-in Analyzers](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-analyzers.html).

#### @Field on `hashTags`

There is nothing special about the `@Field` annotation which is applied to `hashTags` field. I just want to highlight the fact that tokenizer splits the text on any nonalphanumeric character. So a value like '#food#health' will be 
automatically tokenized to `['food','health]`.

#### @Normalizer

The `tag` field which is an enum will mostly consist of a single word. We don't need to analyze such fields. So, instead, we can either set the `analyze` property of `@Field` to 
`Analyze.NO` or we can apply a `normalizer`. Hibernate will then treat this field as `keyword`. The lowercase normalizer
that I have used here will be applied both at the time of indexing and searching. So, both 'MOVIE' or 'movie' value will be a match.  

### @SortableField

When we add `@SortableField` to a field, Elasticsearch will optimize the index for sorting operations over those fields.
We can still perform sorting operations over other fields which are not marked with this annotation but that will have some
performance penalties.

### @IndexedEmbedded

We use `@IndexedEmbedded` when we want to perform a search over nested objects fields. For instance, let's say we want to search
all posts made by a user with the first name 'Joe' (user.first: joe). 

We need to cover a few more properties of the `@Field` annotation before moving on. Let's look at the `User` class for that:

```java
@Getter
@Setter
@Entity
@Indexed(index = "idx_user")
class User {
  @Id
  private String id;

  @Field(store = Store.YES)
  @Field(name = "fullName")
  private String first;

  @Field(index = Index.NO) 
  private String middle;

  @Field
  @Field(name = "fullName")
  private String last;

  @Field
  private Integer age;

  @ContainedIn
  @OneToMany(mappedBy = "user")
  private List<Post> post;
}
```

A couple of interesting things to notice here. Let's start with the `index` property.
#### `@Field(index = Index.NO)`

`Index.NO` indicates that it won't be indexed. We won't be able to perform any search operation over it. You might be
thinking "Why not simply remove `@Field` annotation?". And the answer is that we still need this field for [Projection] 
(Covered in the next section).

#### `@Field(name = "fullName")`

In the `Post` class we saw that we can map one entity field to multiple index document fields. We can also do the inverse. As 
you can see `@Field(name = "fullName")` is mapped to `first` and `last` both. This way `fullName` will have the content of both fields. So, instead of searching over the `first` and `last` field separately, we can directly search over `fullName`. 

#### `@Field(store = Store.YES)`

We can set store to `Store.YES` when we plan to use it in projection. Note that this will require extra space. Plus, 
Elasticsearch already stores the value in the `_source` field. So, the only reason to set the store to true is that when we don't want Elasticsearch to look up and extract value from the `_source` field.

### @ContainedIn

`@ContainedIn` makes a `@OneToMany` relationship bidirectional. When the values of this
entity are updated, its values in the root entity i.e., in the `idx_post`(Post) index will also be updated.

## Loading Current Data Into Elasticsearch
Before we perform any queries, we first need to load data into Elasticsearch:

 ```java
@Service
@RequiredArgsConstructor
@Slf4j
class IndexingService {

  private final EntityManager em;

  @Transactional
  public void initiateIndexing() throws InterruptedException {
      log.info("Initiating indexing...");
      FullTextEntityManager fullTextEntityManager = 
                            Search.getFullTextEntityManager(em);
      fullTextEntityManager.createIndexer().startAndWait();
      log.info("All entities indexed");
  }
}
```

You can call the `initiateIndexing()` method either at the application startup or create an API in the REST controller to call it.

`createIndexer()` also takes in class references as input. This gives you more choice over the indexing. 

This is going to be a one-time thing. After this, Hibernate search will keep entities in both sources in sync. Unless of course for some reason your database goes out of sync with Elasticsearch in which case indexing API might come in handy again. 

## Performing Queries
With Elasticsearch integration you have two choices for writing queries:
1. **Hibernate search query DSL**: a nice way to write Lucene queries. If you are familiar with [Specification](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#specifications) and 
[Criteria query](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html#criteria) API you will find it easy to get your head around it.
2. **Elasticsearch query**: Hibernate search supports both Elasticsearch native queries and JSON queries.

In this tutorial, we are only going to look at Hibernate Search query DSL. 

### Keyword Query
Now let's say we want to write a query to fetch all records from `idx_post`  where either `body` or `hashtags` contain 
word 'food':

```java
@Component
@Slf4j
@RequiredArgsConstructor
public class SearchService {

  private final EntityManager entityManager;
  
  public List<Post> getPostBasedOnWord(String word){
    FullTextEntityManager fullTextEntityManager = 
      Search.getFullTextEntityManager(entityManager);

    QueryBuilder qb = fullTextEntityManager
      .getSearchFactory()
      .buildQueryBuilder()
      .forEntity(Post.class)
      .get();

    Query foodQuery = qb.keyword()
      .onFields("body","hashTags")
      .matching(word)
      .createQuery();

    FullTextQuery fullTextQuery = fullTextEntityManager
      .createFullTextQuery(foodQuery, Post.class);
    return (List<Post>) fullTextQuery.getResultList();
  }
  
  
}
```

Let's go through this code example:
1. First, we create an object of `FullTextEntityManager` which is a wrapper over our `EntityManager`.
2. Next, we create `QueryBuilder` for the index on which we want to perform a search. We also need to pass the entity class object in it.
3. We use a `QueryBuilder` to build our `Query`. 
4. Next, we make use of the keyword query `keyword()` which allows us to look for a specific word in a field or fields. Finally, we pass the word that we want to search in the `matching` 
function.
4. Lastly, we wrap everything in `FullTextQuery` and fetch result list by calling `getResultList()` function.

One thing to note here is that although we are performing a query on Elasticsearch, Hibernate will still fire a query on the database to fetch the full entity. 

Which make sense, because as we saw in the previous section we didn't store all the fields of 
`Post` entity and those fields still need to be retrieved. If you only want to fetch what's stored in your index anyway and think this database call is redundant, you can make use of [Projection](#projection).

### Range Queries

Let's retrieve all the posts whose `likeCount` is greater than 1000 and should optionally contain the 'food' hashtag and 
'Literature' tag:

```java
public List<Post> getBasedOnLikeCountTags(Long likeCount, 
    String hashTags, 
    String tag){

  FullTextEntityManager fullTextEntityManager = 
    Search.getFullTextEntityManager(entityManager);
  
  QueryBuilder qb = fullTextEntityManager
    .getSearchFactory()
    .buildQueryBuilder()
    .forEntity(Post.class)
    .get();

  Query likeCountGreater = qb.range()
    .onField("likeCount")
    .above(likeCount)
    .createQuery();

  Query hashTagsQuery = qb.keyword()
    .onField("hashTags")
    .matching(hashTags)
    .createQuery();

  Query tagQuery = qb.keyword()
    .onField("tag")
    .matching(tag)
    .createQuery();

  Query finalQuery = qb.bool()
    .must(likeCountGreater)
    .should(tagQuery)
    .should(hashTagsQuery)
    .createQuery();

  FullTextQuery fullTextQuery = fullTextEntityManager
    .createFullTextQuery(finalQuery, Post.class);
  fullTextQuery.setSort(qb.sort().byScore().createSort());
  
  return (List<Post>) fullTextQuery.getResultList();
}
```

For `likeCount` we are using range query. Using only `above()` is equivalent to the `>=` 
operator. If you want to exclude the limits, just call `excludeLimit()` after `above()`.
  
For the other two fields, we have again used a keyword query. 

Now, it's time to combine all queries. To do so, we will make use of `QueryBuilder`'s `bool()` function which 
provides us with verbs such as `should()`, `must()` and `not()`. 

I have used `must()` for `likeCount` query and `should()`
for the rest as they are optional. Optional queries wrapped in `should()` contribute to the relevance score.

### Fuzzy And Wildcard Search Queires
```java
Query similarToUser = qb.keyword().fuzzy()
  .withEditDistanceUpTo(2)
  .onField("first")
  .matching(first)
  .createQuery();
```

Up until now, we used keyword queries to perform exact match searches, but when combined
it with the `fuzzy()` function it enables us to perform fuzzy searches too. 

Fuzzy search gives relevant results even if you have some typos in your query. It gives end-users some flexibility in terms 
of searching by allowing some degree of error. The threshold of the error to be allowed can be decided by us. For instance, here I have
set edit distance to 2 (default is also 2 by the way) which means Elasticsearch will match all the words with a maximum of 2 differences to 
the input. e.g., 'jab' will match 'jane'.

```java
Query similarToUser = qb.keyword().wildcard()
  .onField("s?ring*")
  .matching(first)
  .createQuery();
```

While Fuzzy queries allow us to search even when we have misspelled words in your query, wildcard queries allow us to 
perform pattern-based searches. For instance, a search query with 's?ring\*' will match 'spring','string','strings'' etc. 
Here '\*' indicates zero or more characters and '?' indicates a single character.  


### Projection
Projection can be used when we want to fetch data directly from Elasticsearch without making another 
query to the database.

```java
public List<User> getUserByFirstWithProjection(String first, 
     int max, 
     int page){

  FullTextEntityManager fullTextEntityManager = 
    Search.getFullTextEntityManager(entityManager);
  QueryBuilder qb = fullTextEntityManager
    .getSearchFactory()
    .buildQueryBuilder()
    .forEntity(User.class)
    .get();
  
  Query similarToUser = qb.keyword().fuzzy()
    .withEditDistanceUpTo(2)
    .onField("first")
    .matching(first)
    .createQuery();
  
  Query finalQuery = qb.bool()
    .must(similarToUser)
    .createQuery();
  
  FullTextQuery fullTextQuery = 
    fullTextEntityManager.createFullTextQuery(
      finalQuery,
      User.class);

  fullTextQuery.setProjection(
    FullTextQuery.ID,
    "first",
    "last",
    "middle",
    "age");
  fullTextQuery.setSort(qb.sort()
    .byField("age")
    .desc()
    .andByScore()
    .createSort());
  fullTextQuery.setMaxResults(max);
  fullTextQuery.setFirstResult(page);
  
  return getUserList(fullTextQuery.getResultList());
}

private List<User> getUserList(List<Object[]> resultList) {
  List<User> users = new ArrayList<>();
  for (Object[] objects : resultList) {
      User user = new User();
      user.setId((String) objects[0]);
      user.setFirst((String) objects[1]);
      user.setLast((String) objects[2]);
      user.setMiddle((String) objects[3]);
      user.setAge((Integer) objects[4]);
      users.add(user);
  }
  return users;
}
```

To use projection we need to pass the list of fields that we want in output in the `setProjection` method. 

Now when we fetch results hibernate will return a list of object arrays. Which to be honest is a bit incontinent. Apart from
fields, we can also fetch metadata such as id with `FullTextQuery.ID` or even score with `FullTextQuery.SCORE`.

### Pagination
```java
FullTextQuery fullTextQuery = 
   fullTextEntityManager.createFullTextQuery(
     finalQuery,
     User.class);
//...
fullTextQuery.setSort(qb.sort()
   .byField("age")
   .desc()
   .andByScore()
   .createSort());
fullTextQuery.setMaxResults(max);
fullTextQuery.setFirstResult(page);
```
Lastly, let's talk about pagination and sorting as we don't want to fetch millions of records that we have stored in our 
Elasticsearch indexes.

To perform pagination we need two things, the number of results we want per page and page offset (Page number, if I put plainly).
Prior we can pass to `FullTextQuery` objects `setMaxResult` method and later in `setFirstResult`. Then query will return results 
accordingly.

Query DSL also provides us a way to define sort field and order using `sort()`. We can also perform sort operation on multiple fields by 
chaining with `andByField()`.

That's it! I mean this is not everything, but I believe this is enough to get you started. For further reading you can 
explore the following:

* [Phrase queries](https://docs.jboss.org/hibernate/stable/search/reference/en-US/html_single/#_phrase_queries) - Which allows us to search complete sentences
* [Simple query Strings](https://docs.jboss.org/hibernate/stable/search/reference/en-US/html_single/#_simple_query_string_queries) - It's a powerful function that can translate string input into Lucene query. With this, you can allow your platform to take queries directly from the end-users. Fields on which the query needs to perform will still need to be specified. 
* [Faceting](https://docs.jboss.org/hibernate/stable/search/reference/en-US/html_single/#query-faceting) - Faceted search is a technique which allows to divide the results of a query into multiple categories. 

## Conclusion

Hibernate Search combined with Elasticsearch becomes a really powerful tool. 

With Elasticsearch taking care of scaling and availability, and Hibernate Search managing the synchronization, it makes up for a perfect match. 

But, this marriage
comes at a cost. Keeping schemas in the database and Elasticsearch in-sync might require manual intervention in some cases. 

Plus, there is also the cost of calling Elasticsearch API for index updates and queries. 

However, if it's allowing you to deliver more value to your customers in form of a full-text search then that cost becomes negligible.   

Thank you for reading! You can find the working code at [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/hibernate-search).