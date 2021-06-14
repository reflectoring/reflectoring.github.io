---
title: "Caching with ElastiCache for Redis and Spring cloud AWS"
categories: [spring-boot]
date: 2021-05-31 00:00:00 +1100
modified: 2021-05-31 00:00:00 +1100
author: mmr
excerpt: "In this article we will look at configuring a Spring Boot Application to use AWS ElastiCache for Redis using Spring Cloud AWS"
image:
    auto: 0090-404
---
[Spring Cloud AWS](https://docs.awspring.io/spring-cloud-aws/docs/current/reference/html/index.html) helps us in simplifying the communication of our Spring Boot application with AWS resources. From taking care
of security to autoconfiguring the beans required for the communication, it takes care of a lot of essential steps.

Currently, Spring Cloud AWS provides support for services such as S3, SES, SNS, RDS, and ElastiCache. In this article, we will look at how we can use it
to connect our application to [AWS ElastiCache for Redis](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/SelectEngine.html).
 
{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/caching-with-elasticache-redis" %}

## Caching with ElastiCache for Redis
ElastiCache is a fully managed in-memory cache service by AWS. It currently supports two caching engines
[Memcached](https://memcached.org/) and [Redis](https://redis.io/).

Let's talk a bit about Redis and ElastiCache first.

Redis is a very popular in-memory data structure store. It is open-source and widely used in the industry for caching. It stores the data as key-value pairs and supports many varieties of data structures like string, hash, list, set, sorted set with range queries, bitmap, hyperloglog, geospatial index, and streams.

In AWS, one of the ways of using Redis for caching is by using the ElastiCache service. ElastiCache is like a container that hosts the caching engines such as Redis in a High Availability, Scalability, and Resiliency to it.

**The basic building block of ElastiCache is the cluster**. A cluster can have one or more nodes. Each
node runs an instance of the Redis cache engine software. A group of interrelated nodes is called a **Shard**. In a single Shard, we can have one primary and zero or more read-only replicas. By default, an ElastiCache cluster has a single Shard.

ElastiCache also supports the partitioning feature of Redis. With partitioning, we can easily scale our Redis cache horizontally. When partitioning is enabled,
we can add more shards into our cluster. In ElastiCache we can enable partitioning by enabling cluster mode.

In summary, Redis can be configured in ElastiCache in one of the following modes:
1. **Single Node** - Only one node.
2. **Cluster mode disabled** - Single shard with one primary Node and read-only replicas.
3. **Cluster mode enabled** - More than one shard.

## Configuring Dependencies

To use Spring Cloud AWS, first, we need to add Spring cloud AWS BOM(Bill of material). BOM will help us to manage our dependency versions:

```groovy
dependencyManagement {
  imports {
    mavenBom 'io.awspring.cloud:spring-cloud-aws-dependencies:2.3.1'
  }
}
```

Next, we need to add the following dependencies:

```groovy
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
implementation 'io.awspring.cloud:spring-cloud-starter-aws'
implementation 'com.amazonaws:aws-java-sdk-elasticache'
```

Let's talk a bit about these dependencies:

* `spring-cloud-starter-aws` provides core AWS cloud dependencies such as `spring-cloud-aws-context` and `spring-cloud-aws-autoconfiguration`.
* Out of the box `spring-cloud-aws-context` provides support for Memcached but for Redis, it needs Spring Data Redis dependency.
* Spring Data Redis gives us access to Spring Cache abstraction, and also [Lettuce](https://lettuce.io/) which is a popular Redis client.
* `spring-cloud-aws-autoconfiguration` also needs `aws-java-sdk-elasticache` dependency which is required to fetch ElastiCache cluster descriptions.

`spring-cloud-aws-autoconfiguration` glues everything together and configures a `CacheManager` which is required by Spring Cache abstraction to provide caching to the application.

Spring Cloud AWS does all the heavy lifting of configuring the caches for us. All we need to do is to provide the name of the cache. Let's look at how we can do that.

## Caching with Spring Boot

Spring Cloud AWS requires clusters of the same name as cache names to exist in the ElastiCache.

For instance, in our example application, we have used two caches. One named `product-cache` in `ProductService` and another named `user-cache` in `UserService`::

```java
@Service
@AllArgsConstructor
@CacheConfig(cacheNames = "product-cache")
public class ProductService {
    private final ProductRepository repository;

    @Cacheable
    public Product getProduct(String id) {
        return repository.findById(id).orElseThrow(()->
                new RuntimeException("No such product found with id"));
    }
    //....
}

@Service
@AllArgsConstructor
@CacheConfig(cacheNames = "user-cache")
public class UserService {

    private final UserRepository repository;

    @Cacheable
    public User getUser(String id){
        return repository.findById(id).orElseThrow(()->
                new RuntimeException("No such user found with id"));
    }
}
```
We have specified the cache name in `@CacheConfig` annotation.

Clusters of the same name need to exist in the ElastiCache:

![ElastiCache Clusters](/assets/img/posts/spring-elasticache-redis/cache-clusters.png)

Technically, Spring Cloud AWS looks for nodes with the same name but since these are **Single Node** clusters the name of the node is the same as the cluster name.

We also need to define cluster names in the `application.yml`. Spring Cloud AWS will use this to scan the ElastiCache to find the clusters:

```yaml
cloud:
  aws:
    elasticache:
      clusters:
        -
          name: product-cache
          expiration: 100
        -
          name: user-cache
          expiration: 6000
```

We can also define Time-To-Live for the keys in each cache via `expiration` properties.

If we are using CloudFormation to deploy our application stack in the AWS then one more
approach exists for us:

Let's say we are using the following CloudFormation to create Clusters:

```yaml
Parameters:

  InstanceType:
    Description: Instance Type to use for Cache Cluster
    Type: String
    Default: cache.t2.micro


Resources:

  ProductCache:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      ClusterName: product-cache
      Engine: "Redis"
      EngineVersion: "6.x"
      CacheNodeType: !Ref InstanceType
      NumCacheNodes: 1
      VpcSecurityGroupIds: ["sg-xxxx"]

  UserCache:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      ClusterName: user-cache
      Engine: "Redis"
      EngineVersion: "6.x"
      CacheNodeType: !Ref InstanceType
      NumCacheNodes: 1
      VpcSecurityGroupIds: [ "sg-xxxx" ]
```

Then instead of giving cluster names, we only need to provide the stack name. Say the stack name
is `example-stack`:

```yaml
cloud:
  aws:
    stack:
      name: example-stack
```

Spring Cloud AWS retrieves all the cache clusters from our stack and builds `CacheManager` with
the names of the resources as cache names instead of cluster names. With this, we need to
update our cache names in our application to resource names instead of cluster names:

```java
@CacheConfig(cacheNames = "ProductCache")
public class ProductService {
    //...
}

@CacheConfig(cacheNames = "UserCache")
public class UserService {
    //...
}
```

Make sure to add the following dependency when using the stack name approach:

```groovy
implementation 'com.amazonaws:aws-java-sdk-cloudformation'
```


## How Does Spring Cloud AWS Configure the `CacheManager`?

In this section, we will dive a bit deeper into the inner workings of the Spring Cloud AWS
and see how it autoconfigures the cache for us.

As we know that for caching to work in a Spring application we need a `CacheManager` bean. The job of Spring Cloud AWS is to essentially create that bean for us.

Let's look at the steps it performs along with the classes involved in building `CacheManager`:

![Spring Cloud AWS](/assets/img/posts/spring-elasticache-redis/spring-cloud-classes.png)

* When our application starts in the AWS environment, `ElastiCacheAutoConfiguration` reads cluster names from the
  `application.yml` and passes them on to the `ElastiCacheCacheConfigurer` object.
* Then `ElastiCacheCacheConfigurer` creates the `CacheManager` with the help of `ElastiCacheFactoryBean` class.
* `ElastiCacheFactoryBean` scans the ElastiCache in the same availability zone and retrieves the host and port
  names of the nodes. To allow our service to scan ElatiCache we need to provide `AmazonElastiCacheReadOnlyAccess` permission
  to our service or `AWSCloudFormationReadOnlyAccess` if we are using the stack name approach.
* Also `ElastiCacheFactoryBean` passes this host and port to `RedisCacheFactory` which then uses Redis clients such as Lettuce to create the connection object which then actually establishes with the nodes and perform required operations.

## Conclusion

While ElastiCache is already making our life easier by managing our Redis Clusters, Spring Cloud AWS further simplifies
our lives by simplifying the configurations required for communicating with it.

In this article, we saw those configurations and also how to apply them. Hope this was helpful!

Thank you for reading! You can find the working code at [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/caching-with-elasticache-redis).
