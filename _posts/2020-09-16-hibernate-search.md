---
title: "Supercharge your queries with Hibernate Search"
categories: [spring-boot]
date: 2020-09-16 20:00:00 +1100
modified: 2020-09-16 20:00:00 +1100
author: Murtuza Ranapurwala
excerpt: "Hibernate Search lets you enable Fulltext search functionality in your existing Spring Boot application. Not 
just that it also provides seamless integration with Fulltext powerhouses such as Elasticsearch."
image:
  auto:
---

If you want to integrate extensive full-text search features in your Spring Boot application without having to make 
major changes **Hibernate Search** is a way to go.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/hibernate-search" %}

#Introduction
Adding full-text search functionality with Hibernate Search is as easy as adding a dependency, and a couple of annotations over your entities. Well, this is an oversimplification of the process, but yes, it's easy.

Hibernate search provides integration with **Lucene** and **Elasticsearch** which are highly optimized for full-text search. While Lucene and Elasticsearch handle searches Hibernate search provides seamless integration with them. 
We only need to manage entities hibernate will manage indexes of us.

This kind of setup allows us to redirect our text-based queries to search frameworks and join based queries to our RDBMS 
database.  

#Setting Things Up
To get started first we need to add Hibernate search dependency into our Gradle file
```groovy
implementation 'org.hibernate:hibernate-search-orm:5.11.5.Final'
```
For this tutorial, I am going to use Elasticsearch integration. The motivation for using the same is that it's far easier
to scale with it instead of Lucene integration.  
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
Few things to note here:
* `default` means the following configurations apply to all the indexes. Hibernate Search allows you to apply configurations to a specific index too. In which case, `default` will be replaced with the fully qualified class name of the indexed entity. The above configurations are common for all indexes.
* `required_index_status` indicates the safest status of the index after which further operation could be performed. 
The default value is `green`. If your Elasticsearch setup doesn't have the required number of nodes index status will be `yellow`.
* Further properties and its details can be found in Hibernate Search Document's 
[Elasticsearch integration section](https://docs.jboss.org/hibernate/stable/search/reference/en-US/html_single/#elasticsearch-integration-configuration).


One more thing to note here is that Hibernate Search v.5 only supports Elasticsearch up to v.5.2.x, though I have been using it with v.6.8, and it's working just fine. But, if you are using or planning on using Elasticsearch v.7 you might want to use Hibernate Search v.6 which is still in Beta by the way.

If you choose to stick with Lucene which is the default integration you can still follow along as the APIs are almost 
identical across integrations.

If you have Spring boot actuator dependency in your project make sure to this property too
```yaml
spring:
  elasticsearch:
    rest:
      uris: <Elasticsearch-url>
```

#Preparing Entities For Indexing
As I have said in the introduction to index entities we just need to annotate the entities, and it's fields with 
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

  @Field(name = "body") //-> [1]
  @Field(name = "bodyFiltered", analyzer = @Analyzer(definition = "stop"))//->[2]
  private String body;

  @ManyToOne
  @IndexedEmbedded//->[6]
  private User user;

  @Field(normalizer = @Normalizer(definition = "lower"))//->[4]
  @Enumerated(EnumType.STRING)
  private Tag tag;

  private String imageUrl;

  private String imageDescription;

  @Field//->[3]
  private String hashTags;

  @Field
  @SortableField//->[5]
  private long likeCount;

  @Field(analyze = Analyze.NO)
  @SortableField//->[5]
  private LocalDateTime createdAt;
}
```

**Note**: The examples make use of project Lombok to avoid boilerplate code such as getters and setters

You will notice a couple of new annotations in the class above. 

Let's start with `@Indexed`.  As the name suggests with `@Indexed` we make this entity eligible for indexing. I have also 
given the index name `idx_post` which is not required but if you won't mention, Hibernate will use fully qualified class
name as index name. 

Next up is `@Field` but before discussing that we need to understand a few terms.

A `String` type can be either mapped to `text` or `keyword` type of Elasticsearch. **Primary difference between `text` and
a `keyword` is that a `text` field can be tokenized while a `keyword` cannot.**

For instance, let's look at the `body` field and assume it has the value 'Hibernate is fun'. If we choose to treat `body` as text then we will be able to tokenize it ['Hibernate', 'is', 'fun'] and we will be able to perform queries like 
`body: Hibernate`. While in keyword type, the match will only be found if we pass complete text `body: Hibernate is fun`
(Wildcard will work though `body: Hibernate*`).

|Text|Keyword|
|----|-------|
|Is tokenized|Can not be tokenized|
|Is analyzed | Can be normalized|
|Can perform term based search| Can only match exact text|

You will see two more new terms in the above table `Normalize` and `Analyze`. When we analyze a text we mean we are 
applying an **Analyzer** which first tokenize the text and then applies one or more filters such as lowercase filter -- 
which converts all the text to lowercase -- or stop word filter -- which removes common English stop words such as 'is',
'an', 'the' etc. **Normalizers** are similar to **Analyzers** only difference is that Normalizers don't apply tokenizer. **On a given field we can 
either apply an Analyzer or a Normalizer.**

Coming back to `@Field` annotation. We need to apply `@Field` annotation on all the fields that we wish to search, 
sort or want it for projection.

Let's look at the `Post` class again and zoom in on some fields to see how we can change the handling of the fields by 
setting various properties of `@Field` annotation.

1. `@Field(name = "body")` with this the string will be saved as `text`, and a default analyzer will be applied to the value. Also, we don't need to set the `name` property if we are content with the class field name. 

2. `@Field(name = "bodyFiltered", analyzer = @Analyzer(definition = "stop"))` here I have given a different name to the 
field and have also provided a different analyzer. This allows us to perform different kinds of search operations on the same entity field. We can also pass different analyzers using analyzer property. Here, I have passed `stop` value in the analyzer 
definition which refers to an in-built Elasticsearch analyzer called `Stop Analyzer`. It removes common stop words ('is','an', etc) that aren't very helpful while querying. Here's a list of other 
[Elasticsearch's Built-in Analyzers](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-analyzers.html).

3. There is nothing special about `@Field` annotation which is applied to `hashTags` field. I just want to highlight the fact that tokenizer splits the text on any nonalphanumeric character. So a value like this '#food#health' will be 
automatically tokenized to ['food','health].

4. `tag` field which is an enum will mostly consist of a single word. We don't need to analyze such fields. So, instead, we can either set `analyze` property of `@Field` to 
`Analyze.NO` or we can apply a `normalizer`. Hibernate will then treat this field as `keyword`. The lowercase normalizer
that I have used here will be applied both at the time of indexing and searching. So, both 'MOVIE' or 'movie' value will be a match.  

5. When we apply `@SortableField` over a field, Elasticsearch will optimize the index for sorting operations over those fields.
We can still perform sorting operations over other fields which are not marked with this annotation but that will have some
performance penalties.

6. `@IndexedEmbedded` is used when we want to perform a search over nested objects fields. For instance, let's say we want to search
all posts made by a user with the first name 'Joe' (user.first: joe). 


Some things to note about analyzers and normalizers when using Elasticsearch integration:
* Although you can use Lucene's built-in analyzers or even custom analyzers using `@AnalyzerDef`, it's recommended to use 
built-in Elasticsearch analyzers.
* Built-in Normalizers are directly translated to Elasticsearch supported normalizers but for this to work you 
need to define Normalizer using `@NormalizerDef` and pass the name in definition as I have done in `Tag` enum's field.

We need to cover a few more properties of `@Field` annotation before moving on. Let's look at `User` class for that.

```java
@Getter
@Setter
@Entity
@Indexed(index = "idx_user")
class User {
  @Id
  private String id;

  @Field(store = Store.YES)//->[3]
  @Field(name = "fullName")//->[2]
  private String first;

  @Field(index = Index.NO) //->[1]
  private String middle;

  @Field
  @Field(name = "fullName")//->[2]
  private String last;

  @Field
  private Integer age;

  @ContainedIn//->[4]
  @OneToMany(mappedBy = "user")
  private List<Post> post;
}
```

Couple of interesting things to notice here. Let's start with the `index` property.

1. `Index.NO` this indicates that property will be stored in the index document, but it won't be indexed. We won't be able
to perform any search operation over it. You might be thinking "Why not simply remove `@Field` annotation?". And the answer is that we still need this field for Projection (Covered in the next section).

2. In the `Post` class we saw that we can map one entity field to multiple index document fields. We can also do the inverse. As 
you can see `@Field(name = "fullName")` is mapped to `first` and `last` both. This way `fullName` will have content of both fields. So, instead of searching over the `first` and `last` field separately, we can directly search over `fullName`. 

3. We can set store to `Store.YES` when we plan to use it in projection. Note that this will require extra space. Plus, 
Elasticsearch already stores the value in the `_soucre` field. So, the only reason to set the store to true is that when we don't want Elasticsearch to look up and extract value from the `_source` field.

4. `@ContainedIn` just like `@OneToMany`-`@ManyToOne` annotation makes relationship bidirectional. When the values of this
entity will be updated its values in the root entity i.e., in the `idx_post`(Post) index will also be updated.

#Performing Queries
Before we perform any queries, we first need to load data into the Elasticsearch.

Use the following snippet to do the same.

 ```java
@Service
@RequiredArgsConstructor
@Slf4j
class IndexingService {

    private final EntityManager em;

    @Transactional
    public void initiateIndexing() throws InterruptedException {
        log.info("Initiating indexing...");
        FullTextEntityManager fullTextEntityManager = Search.getFullTextEntityManager(em);
        fullTextEntityManager.createIndexer().startAndWait();
        log.info("All entities indexed");
    }
}
```

You can call the `initiateIndexing()` function either at the application startup or create an API in the REST controller to call it.
`createIndexer` function also takes in Class references as input. This gives you more choice over the indexing. This is going to be a one-time thing, after this Hibernate search will keep entities in both sources in sync. Unless of course for some reason your database goes out of sync with Elasticsearch in which case indexing API might come in handy again. 

With Elasticsearch integration you have two choices for writing queries:
1. Hibernate search query DSL - It's a nice way to write Lucene queries. If you are familiar with Specification and 
Criteria query API you will find it easy to get your head around it.
2. Elasticsearch query - Hibernate search supports both Elasticsearch native queries and JSON queries.

In this tutorial, we are only going to look at Hibernate Search query DSL. 

Now let's say we want to write a query to fetch all records from `idx_post`  where either `body` or `hashtags` contain 
word 'food'

```java
@Component
@Slf4j
@RequiredArgsConstructor
public class SearchService {

    private final EntityManager entityManager;
    //.........

    public List<Post> getPostBasedOnWord(String word){
        FullTextEntityManager fullTextEntityManager = Search.getFullTextEntityManager(entityManager);
        QueryBuilder qb = fullTextEntityManager.getSearchFactory().buildQueryBuilder()
                .forEntity(Post.class)
                .get();
        Query foodQuery = qb.keyword().onFields("body","hashTags").matching(word).createQuery();
        FullTextQuery fullTextQuery = fullTextEntityManager.createFullTextQuery(foodQuery, Post.class);
        return (List<Post>) fullTextQuery.getResultList();
    }
    //.........
    
}
```

Let me explain the above code line by line:
1. First, we create an object of `FullTextEntitiyManager` which is a wrapper over our `EntityManager`
2. Next, we create `QueryBuilder` for the index on which we want to perform a search. We also need to pass the entity class object in it.
3. Using `QueryBuilder` we finally build our `Query`. 
4. Next, we make use of the keyword query `keyword()` which allows us to look for a specific word in a field or fields. Finally, we pass the word that we want to search in the `matching` 
function.
4. Lastly, we wrap everything in `FullTextQuery` and fetch result list by calling `getResultList()` function.

One thing to note here is that although we are performing a query on Elasticsearch, Hibernate will still fire a query on the database to fetch the full entity. Which make sense, because as we saw in the previous section we didn't store all the fields of 
`Post` entity and those fields still needed to be retrieved. If you only wanted to fetch what's stored in your index anyway and think this database call is redundant, I know just the way. Keep reading on to find out.

Let's move to the next query. 

Let's retrieve all the posts whose `likeCount` is greater than 1000 and should optionally contain 'food' hashtag and 
'Literature' tag.

```java
@Component
@Slf4j
@RequiredArgsConstructor
public class SearchService {

    private final EntityManager entityManager;
    //.........

    public List<Post> getBasedOnLikeCountTags(Long likeCount, String hashTags, String tag){
        FullTextEntityManager fullTextEntityManager = Search.getFullTextEntityManager(entityManager);
        QueryBuilder qb = fullTextEntityManager.getSearchFactory().buildQueryBuilder()
                .forEntity(Post.class)
                .get();
        Query likeCountGreater = qb.range().onField("likeCount").above(likeCount).createQuery();
        Query hashTagsQuery = qb.keyword().onField("hashTags").matching(hashTags).createQuery();
        Query tagQuery = qb.keyword().onField("tag").matching(tag).createQuery();
        Query finalQuery = qb.bool().must(likeCountGreater).should(tagQuery).should(hashTagsQuery).createQuery();

        FullTextQuery fullTextQuery = fullTextEntityManager.createFullTextQuery(finalQuery, Post.class);
        fullTextQuery.setSort(qb.sort().byScore().createSort());
        return (List<Post>) fullTextQuery.getResultList();
    }
    //.........
    
}
```

As you can see in the snippet above for `likeCount` we are using range query. Using only `above()` is equivalent to `>=` 
operator. If you want to exclude the limits, just call `excludeLimit()` after `above()`.
  
For the other two fields, we have again used a keyword query. 

Now, it's time to combine all queries. To do so, we will make use of `QueryBuilder` object's `bool()` function which 
provides us with verbs such as `should()`, `must()` and `not()`. I have used `must()` for `likeCount` query and `should()`
for the rest as they are optional. Optional queries wrapped in `should()` contribute to the relevance score. For instance document with tag matching, 'Literature' will score higher.

A couple of paragraphs ago I had promised you that I will show you a way to avoid queries to the database. So, here it is, and 
it's called **Projection**.
```java
@Component
@Slf4j
@RequiredArgsConstructor
public class SearchService {
    private final EntityManager entityManager;

    public List<User> getUserByFirstWithProjection(String first, int max, int page){
        FullTextEntityManager fullTextEntityManager = Search.getFullTextEntityManager(entityManager);
        QueryBuilder qb = fullTextEntityManager.getSearchFactory().buildQueryBuilder()
                .forEntity(User.class)
                .get();
        Query similarToUser = qb.keyword().fuzzy().withEditDistanceUpTo(2).onField("first")
                .matching(first).createQuery();
        Query finalQuery = qb.bool().must(similarToUser).createQuery();

        FullTextQuery fullTextQuery = fullTextEntityManager.createFullTextQuery(finalQuery, User.class);
        fullTextQuery.setProjection(FullTextQuery.ID, "first","last","middle","age");
        fullTextQuery.setSort(qb.sort().byField("age").desc().andByScore().createSort());
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
}
```

Before moving on to the main event let's zoom in on a couple of interesting things here.

* Up until now we were using keyword queries to perform exact match searches only, but here as you can see I have combined
it with the fuzzy query which will allow us to perform fuzzy searches too. This query gives end-users some flexibility in terms of searching by allowing some degree of error. The threshold of the error to be allowed can be decided by us. For instance, here I have
set edit distance to 2 (Default is also 2 by the way) which means Elasticsearch will match all the words with a maximum of 2 differences to 
the input. e.g., 'jab' will match 'jane'

* We can also perform sorting and pagination. Sorting can be applied on single or multiple fields, and pagination can be 
controlled with `setMaxResult`--Number of results we need per page-- and `setFirstResult`--We can pass page number in it.

* Finally, let's talk about projection. To use projection we need to pass the list of fields that we want in output in the `setProjection` method. 
Now when we fetch results hibernate will return a list of object arrays. Which to be honest is a bit incontinent. Apart from
fields, we can also fetch metadata such as id with `FullTextQuery.ID` or even score with `FullTextQuery.SCORE`.

That's it! I mean this is not everything, but I believe this is enough to get you started. For further reading you can 
explore the following:

* Phrase queries - which allows you to search complete sentences
* Wildcard queries - which allows you to search terms with wildcard character in it such as `*` (Multiple characters) and 
`?` (Single Character)
* Simple query Strings - It's a powerful function that can translate string input into Lucene query. With this, you can allow your platform to take queries directly from the end-users. Fields on which the query needs to perform will still need to be specified. 

#Conclusion

Hibernate Search combined with Elasticsearch becomes a really powerful tool. With Elasticsearch taking care of scaling and availability, and Hibernate Search managing the synchronization, it makes up for a perfect match. But, this marriage
comes at a cost. Keeping schemas in the database and Elasticsearch in-sync might require manual intervention in some cases. Plus there is also the cost of calling Elasticsearch API for index updates and queries. However, if it's allowing you to deliver more value to your customers in form of a Fulltext search than that cost becomes negligible.   
