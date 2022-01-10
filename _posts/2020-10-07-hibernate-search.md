---
title: "Full-Text Search with Hibernate Search and Spring Boot"
categories: ["Spring Boot"]
date: 2020-10-07 00:00:00 +1100
modified: 2020-10-07 20:00:00 +1100
author: mmr
excerpt: "Hibernate Search lets you enable Fulltext search functionality in your existing Spring Boot application. Not 
just that it also provides seamless integration with Fulltext powerhouses such as Elasticsearch."
image:
  auto: 0084-search
---

If you want to integrate extensive full-text search features in your Spring Boot application without having to make 
major changes, Hibernate Search may be a way to go.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/hibernate-search" %}

## Introduction
Adding full-text search functionality with Hibernate Search is as easy as adding a dependency and a couple of annotations to your entities. 

Well, this is an oversimplification of the process, but yes, it's easy.

Hibernate Search provides integration with Lucene and Elasticsearch which are highly optimized for full-text search. While Lucene and Elasticsearch handle searches, Hibernate Search provides seamless integration between them and Hibernate. 

We only need to tell Hibernate Search which entities to index.

This kind of setup allows us to redirect our text-based queries to search frameworks and standard SQL queries to our RDBMS 
database.  

## Setting Things Up
To get started first we need to add the Hibernate Search dependency (Gradle notation):
```groovy
implementation 'org.hibernate:hibernate-search-orm:5.11.5.Final'
```
For this tutorial, we're going to use the Elasticsearch integration. The motivation is that it's far easier
to scale with Elasticsearch than with Lucene.  
```groovy
implementation 'org.hibernate:hibernate-search-elasticsearch:5.11.5.Final'
```   
Also, we will need to add the following properties in our `application.yml` file:
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
* `default` means the following configurations apply to all the indexes. Hibernate Search allows us to apply configurations to a specific index, too. In this case, `default` must be replaced with the fully qualified class name of the indexed entity. The above configurations are common for all indexes.
* `required_index_status` indicates the safest status of the index after which further operations can be performed. 
The default value is `green`. If your Elasticsearch setup doesn't have the required number of nodes, index status will be `yellow`.
* Further properties and its details can be found in the [Hibernate Search docs](https://docs.jboss.org/hibernate/stable/search/reference/en-US/html_single/#elasticsearch-integration-configuration).


One more thing to note here is that Hibernate Search v.5 only supports Elasticsearch up to v.5.2.x, though I have been using it with v.6.8, and it's working just fine.
 
If you are using or planning on using Elasticsearch v.7 you might want to use Hibernate Search v.6 which is still in Beta at the time of this writing.

If you choose to stick with Lucene (which is the default integration) you can still follow along as the APIs are almost 
identical across integrations.

## How Does Hibernate Search Work?

Let's have a look at how Hibernate Search works in general.

First, we need to tell Hibernate [what entities we want to index](#preparing-entities-for-indexing).

We can also tell Hibernate how to index the fields of those entities using [analyzers and normalizers](#analyzers-and-normalizers).

Then, when we boot up the application Hibernate will either create, update, or validate index mappings in Elasticsearch, depending on our selected `index_schema_management_strategy`.

Once the application has started, Hibernate Search will keep track of any operations performed on the entities and 
will apply the same on its corresponding indexes in the Elasticsearch. 

Once we have loaded some data into indexes we can [perform search queries](#performing-queries) using Hibernate Search APIs. 

At searching time 
Hibernate Search will again apply the same analyzers and normalizers that were used during indexing. 

## Some Important Terms

### Text and Keyword
A `String` field can be either mapped to the `text` or the `keyword` type of Elasticsearch. 

**The primary difference between `text` and
a `keyword` is that a `text` field will be tokenized while a `keyword` cannot.** 

We can use the `keyword` type when we 
want to perform filtering or sorting operations on the field.

For instance, let's assume that we have a `String` field called `body`, and let's say it has the value 'Hibernate is fun'. 

If we choose to treat `body` as text then we will be able to tokenize it ['Hibernate', 'is', 'fun'] and we will be able to perform queries like 
`body: Hibernate`.
 
If we make it a `keyword` type, a match will only be found if we pass the complete text `body: Hibernate is fun`
(wildcard will work, though: `body: Hibernate*`).

Elasticsearch supports [numerous other types](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html).



### Analyzers and Normalizers

Analyzers and normalizers are text analysis operations that are performed on `text` and `keyword` respectively, 
before indexing them and searching for them. 

When an analyzer is applied on `text`, it first tokenizes the text and then applies one or more 
filters such as a lowercase filter (which converts all the text to lowercase) or a stop word filter (which removes common English stop words such as 'is',
'an', 'the' etc). 

Normalizers are similar to analyzers with the difference that normalizers don't apply a tokenizer. 

**On a given field we can either apply an analyzer or a normalizer.**

To summarize:

|Text|Keyword|
|----|-------|
|Is tokenized|Can not be tokenized|
|Is analyzed | Can be normalized|
|Can perform term based search| Can only match exact text|

## Preparing Entities For Indexing
As mentioned in the introduction to index entities we just need to annotate the entities and their fields with 
a couple of annotations.

Let's have a look at those annotations. 

### `@Indexed` Annotation

```java
@Entity
@Indexed(index = "idx_post")
class Post {
  ....
}
```

As the name suggests, with `@Indexed` we make this entity eligible for indexing. We have also 
given the index the name `idx_post` which is not required. 

By default, Hibernate Search will use the fully qualified class
name as the index name.

With the `@Entity` annotation from JPA, we map 
a class to a database table and, its fields to the table columns. 

Similarly, with `@Indexed` we map a class to Elasticsearch's index and 
its fields to the document fields in the index (an Index is a collection of JSON documents). 

In the case of `@Entity`, we have a companion annotation called `@Column` to map fields while in the case of `@Indexed` we have the `@Field` 
annotation to do the same. 

### `@Field` Annotation
We need to apply the `@Field` annotation on all the fields that we wish to search, sort, or that we need for [projection](#projection).  

`@Field` has several properties which we can set to customize its behavior. By default, it will exhibit the following behavior:
* `@Field` has a property called `name` which when left empty picks the name of the field on which the annotation is placed. 
Hibernate Search then uses this name to store the field's value in the index document. 
* Hibernate Search maps this field to Elasticsearch native types. For instance, a field of type `String` gets mapped 
to `text` type, `Boolean` to `boolean` type, `Date` to `date` type of Elasticsearch. 
* Elasticsearch also applies a default analyzer on the value. The default analyzer
first applies a tokenizer that splits text on non-alphanumeric characters and then applies the lowercase filter.
For instance, if the `hashTags` field has the value '#Food#Health', it will be internally stored as `['food', 'health]` after being analyzed.

### `@Analyzer`
```java
@Field(name = "body") 
@Field(name = "bodyFiltered", 
       analyzer = @Analyzer(definition = "stop"))
private String body;
``` 
We can also apply multiple `@Field` annotations on a single field. 
Here we have given a different name to the 
field and have also provided a different analyzer. 

This allows us to perform different kinds of search operations on the same entity field. We can also pass different analyzers using the `analyzer` property. 

Here, we have passed the `stop` value in the analyzer 
definition which refers to a built-in Elasticsearch analyzer called "Stop Analyzer". It removes common stop words ('is', 'an', etc) that aren't very helpful while querying. 

Here's a list of Elasticsearch's other 
[Built-in analyzers](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-analyzers.html).

### `@Normalizer`

```java
@Entity
@Indexed(index = "idx_post")
@NormalizerDef(name = "lowercase",
    filters = @TokenFilterDef(factory = LowerCaseFilterFactory.class))
class Post {
  ...

  @Field(normalizer = @Normalizer(definition = "lowercase"))
  @Enumerated(EnumType.STRING)
  private Tag tag;
  
  ...

}
```

The `tag` field, which is an enum, will mostly consist of a single word. We don't need to analyze such fields. So, instead, we can either set the `analyze` property of `@Field` to 
`Analyze.NO` or we can apply a `normalizer`. Hibernate will then treat this field as `keyword`. 

The 'lowercase' normalizer
that we have used here will be applied both at the time of indexing and searching. So, both 'MOVIE' or 'movie' will be a match.  

`@Normalizer` can apply one or more filters on the input. In the above example, we have only added the lowercase filter using `LowerCaseFilterFactory` but if required we
can also add multiple filters such as `StopFilterFactory` which removes common English [stop words](https://en.wikipedia.org/wiki/Stop_word), or `SnowballPorterFilterFactory` which performs stemming on the word 
(Stemming is a process of converting a given word to its base word. E.g., 'Refactoring' gets converted to 'Refactor'). 

You can find a full list of other available filters in the [Apache Solr docs](https://cwiki.apache.org/confluence/display/solr/AnalyzersTokenizersTokenFilters#AnalyzersTokenizersTokenFilters-TokenFilterFactories#).

### `@SortableField`
```java
@Field
@SortableField
private long likeCount;
```

The `@SortableField` annotation is a companion annotation of `@Field`. When we add `@SortableField` to a field, Elasticsearch will optimize the index for sorting operations over those fields.
We can still perform sorting operations over other fields that are not marked with this annotation but that will have some
performance penalties.

### Exclude a Field From Indexing
```java
@Field(index = Index.NO, store = Store.YES) 
private String middle;
```

`Index.NO` indicates that the field won't be indexed. We won't be able to perform any search operation over it. You might be
thinking "Why not simply remove the `@Field` annotation?". And the answer is that we still need this field for [projection](#projection).

### Combine Field Data
```java
@Field(store = Store.YES)
@Field(name = "fullName")
private String first;

@Field(store = Store.YES)
@Field(name = "fullName")
private String last;
```
In the [section about `@Analyzer`](#analyzer), we saw that we can map one entity field to multiple index document fields. We can also do the inverse. 

In the code above, `@Field(name = "fullName")` is mapped to `first` and `last` both. This way, the index property `fullName` will have the content of both fields. So, instead of searching over the `first` and `last` fields separately, we can directly search over `fullName`. 

### Store Property
We can set `store` to `Store.YES` when we plan to use it in projection. Note that this will require extra space. Plus, 
Elasticsearch already stores the value in the `_source` field (you can find more on the source field in the [Elasticsearch docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-source-field.html)). So, the only reason to set the `store` property to `true` is that when we don't want Elasticsearch to look up and extract value from the `_source` field. 

We need to set store to `Store.YES` when we set `Index.NO` though, or else Elasticsearch won't store it at all. 

### `@IndexedEmbedded` and `@ContainedIn`
```java
@Entity
@Indexed(index = "idx_post")
class Post {
  ...
  @ManyToOne
  @IndexedEmbedded
  private User user;  
  ...

}
```
We use `@IndexedEmbedded` when we want to perform a search over nested objects fields. For instance, let's say we want to search
all posts made by a user with the first name 'Joe' (`user.first: joe`). 

```java
@Entity
@Indexed(index = "idx_user")
class User {
  ...
  @ContainedIn
  @OneToMany(mappedBy = "user")
  private List<Post> post;
}
```
`@ContainedIn` makes a `@OneToMany` relationship bidirectional. When the values of this
entity are updated, its values in the index of the root `Post` entity will also be updated.

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

We can call the `initiateIndexing()` method either at the application startup or create an API in a REST controller to call it.

`createIndexer()` also takes in class references as input. This gives us more choice over which entities we want to index. 

This is going to be a one-time thing. After this, Hibernate Search will keep entities in both sources in sync. Unless of course for some reason our database goes out of sync with Elasticsearch in which case this indexing API might come in handy again. 

## Performing Queries
With Elasticsearch integration we have two choices for writing queries:
1. **Hibernate Search query DSL**: a nice way to write Lucene queries. If you are familiar with [Specifications](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#specifications) and the
[Criteria API](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html#criteria) you will find it easy to get your head around it.
2. **Elasticsearch query**: Hibernate Search supports both Elasticsearch native queries and JSON queries.

In this tutorial, we are only going to look at Hibernate Search query DSL. 

### Keyword Query
Now let's say we want to write a query to fetch all records from `idx_post`  where either `body` or `hashtags` contain 
the word 'food':

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
4. Lastly, we wrap everything in `FullTextQuery` and fetch the result list by calling `getResultList()`.

One thing to note here is that although we are performing a query on Elasticsearch, Hibernate will still fire a query on the database to fetch the full entity. 

Which makes sense, because as we saw in the previous section we didn't store all the fields of the
`Post` entity in the index and those fields still need to be retrieved. If we only want to fetch what's stored in your index anyway and think this database call is redundant, we can make use of a [Projection](#projection).

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
operator. If we want to exclude the limits, we just call `excludeLimit()` after `above()`.
  
For the other two fields, we have again used a keyword query. 

Now, it's time to combine all queries. To do so, we will make use of `QueryBuilder`'s `bool()` function which 
provides us with verbs such as `should()`, `must()`, and `not()`. 

We have used `must()` for `likeCount` query and `should()`
for the rest as they are optional. Optional queries wrapped in `should()` contribute to the relevance score.

### Fuzzy And Wildcard Search Queries
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
of searching by allowing some degree of error. The threshold of the error to be allowed can be decided by us. 

For instance, here we have
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

Now when we fetch results Hibernate will return a list of object arrays which we have to map to the objects we want. Apart from
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
Finally, let's talk about pagination and sorting as we don't want to fetch millions of records that we have stored in our 
Elasticsearch indexes in a single go.

To perform pagination we need two things, the number of results we want per page and page offset (or page number, to put it plainly).

Prior we can pass call `setMaxResult()` and `setFirstResult()` when building our `FullTextQuery`. Then, the query will return results 
accordingly.

Query DSL also provides us a way to define a sort field and order using `sort()`. We can also perform sort operation on multiple fields by 
chaining with `andByField()`.

## Further Reading

That's it! I mean this is not everything, but I believe this is enough to get you started. For further reading you can 
explore the following:

* [Phrase queries](https://docs.jboss.org/hibernate/stable/search/reference/en-US/html_single/#_phrase_queries) - Which allows us to search complete sentences
* [Simple query Strings](https://docs.jboss.org/hibernate/stable/search/reference/en-US/html_single/#_simple_query_string_queries) - It's a powerful function that can translate string input into Lucene query. With this, you can allow your platform to take queries directly from the end-users. Fields on which the query needs to perform will still need to be specified. 
* [Faceting](https://docs.jboss.org/hibernate/stable/search/reference/en-US/html_single/#query-faceting) - Faceted search is a technique which allows us to divide the results of a query into multiple categories. 

## Conclusion

Hibernate Search combined with Elasticsearch becomes a really powerful tool. 

With Elasticsearch taking care of scaling and availability, and Hibernate Search managing the synchronization, it makes up for a perfect match. 

But, this marriage
comes at a cost. Keeping schemas in the database and Elasticsearch in-sync might require manual intervention in some cases. 

Plus, there is also the cost of calling Elasticsearch API for index updates and queries. 

However, if it's allowing you to deliver more value to your customers in form of a full-text search then that cost becomes negligible.   

Thank you for reading! You can find the working code at [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/hibernate-search).