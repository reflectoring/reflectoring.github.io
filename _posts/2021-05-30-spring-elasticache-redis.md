---
title: "Caching in Spring Boot with AWS ElastiCache for Redis"
categories: [spring-boot]
date: 2021-05-31 00:00:00 +1100
modified: 2021-05-31 00:00:00 +1100
author: mmr
excerpt: "In this article will look at how we can configure our Spring Boot to use AWS ElastiCache for Redis as cache store"
image:
    auto: 0090-404
---


ElastiCache is a managed in-memory cache service by AWS. It currently supports two popular cache implementations
[Memcached](https://memcached.org/) and [Redis](https://redis.io/).

In this article, we will look at how we can setup AWS ElatiCache for Redis and also how we can configure our Spring Boot
Application to use it as cache-store.

But, before diving into that let's talk a bit about Caching and Redis in general. 
 
{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/caching-with-elasticache-redis" %}

## Why Caching?


Caching is a common technique of temporarily storing a copy of data or result of a computation in-memory for quick and frequent access. We tend
to use caching primarily for the following two reasons:

1. **Improving the throughput of the application.**
2. **Avoiding overwhelming the application or downstream applications with redundant requests.**

Implementing caching may result in a fluid user experience and a robust system.

Some common use cases of caching in a web application include storing results of operation that require complex Database queries, heavy computations, and
responses of API calls.

A simple in-memory cache can be easily implemented in an application using some implementation of a `Map` data structure.
This should serve us well if we have a very limited amount of data to cache. But, if we have a lot of data and are considering scaling the
application (Which is true for most modern applications today) we might want to move cache out of our application.

That's where caching solutions such as Redis or fully managed solutions such as ElastiCache come in. They are high performant, scalable and
resilient to any failure.

## AWS ElastiCache for Redis

Redis is a very popular in-memory data structure store. It's open-source and widely used in the industry for caching. It stores
the data in key-value pair and supports data structure ranging from `String` and `List` to `hyperloglogs` and `stream`.

**The basic building block of ElastiCache for Redis is the cluster**. A cluster can have one or more nodes. Each
node runs an instance of the Redis server. A group of interrelated nodes is called a **Shard**. In a single Shard, we have one primary and
one or more read-only replicas. By default, an ElastiCache cluster has a single Shard.

ElastiCache also supports the partitioning feature of Redis. With partitioning, we can easily scale our Redis cache horizontally. When partitioning is enabled,
we can add more shards into our cluster. In ElastiCache we can enable partitioning by enabling cluster mode.

Just to summarize Redis can be configured in ElastiCache in two modes:
1. No Cluster mode
2. Cluster mode

Let's talk a bit more about them.

### No Cluster mode

In this mode, we can only have one Shard with one primary node and zero or more replicas for high availability. This mode
allows us to scale vertically by increasing the size of the node.

![No cluster mode](/assets/img/posts/spring-elasticache-redis/cluster-01.png)

To configure ElatiCache in this mode simply make sure not to check "**Cluster mode enabled**" checkbox. Also, make sure
you have enabled "**Multi A-Z**" this will enable auto-failover. In case of a primary node's failure, a replica will take
over as primary.

Once you are done with creating the cluster, your configuration should something similar to the following screenshot. Most
of the configurations is the default:

![No cluster mode configuration](/assets/img/posts/spring-elasticache-redis/no-cluster.png)

Couple of things to note here:

* **Security**: According to [AWS ElastiCache Guide](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/GettingStarted.AuthorizeAccess.html) cluster is designed to be accessed from an EC2 instance. So, just a head's up, do not spend time trying to connect from your local environment as it won't work.
  The document also provides some steps on how a resource can access the cluster. This is also true for Cluster Mode.
* **Primary Endpoint**: URL that always points to the primary node. This URL will remain the same even in case of failover as ElastiCache will
  always update the DNS entry of the actual primary node registered against it.
* **Reader Endpoint**: URL of the load balancer that points to our replicas. This allows us to add and remove replicas on demand
  without worrying about changing the node's endpoint.

  
### Cluster mode

This mode allows us to add more Shards into our cluster.

![cluster mode](/assets/img/posts/spring-elasticache-redis/cluster-02.png)

To configure ElatiCache in this mode just make sure to check "**Cluster mode enabled**" checkbox. Now, we will see options to specify
the number of shards and also options to specify regions of shards.

![No cluster mode configuration](/assets/img/posts/spring-elasticache-redis/cluster-mode.png)

Here we can note that we don't have primary and reader endpoints, instead we have a single configuration endpoint. Our Redis
clients can retrieve the cluster topology - Address and roles of all nodes - using this URL.

Now let's configure our Spring application to point to ElastiCache.

## Configuring Dependencies for Redis Cache

The only dependency that we need to enable caching with Redis is [Spring Data Redis](https://docs.spring.io/spring-data/redis/docs/2.5.1/reference/html/#redis).

```groovy
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
```

This will give us access to Spring Cache abstraction, and [Lettuce](https://lettuce.io/) which is a popular Redis client.

Now that we have our dependencies we need to get to configuring our cache client.

## Configuring Caching in Spring Boot

Out of the box Spring Data Redis is configured to locate Redis instance running on the `localhost` and port `6379`. This
configuration is good enough for testing on a local machine.

Let's see how we can connect to ElastiCache, first when it's running on [No Cluster Mode](#no-cluster-mode) and then in
[Cluster Mode](#cluster-mode).

### Connecting to ElastiCahce when Cluster mode is disabled

We read in the [No Cluster Mode](#no-cluster-mode) section that ElastiCache gives us two endpoints: Primary node's and Reader node's.
So, one choice is to use the primary node's endpoint and read/write directly to and from the primary node. In which case our configurations will
be following:

```yaml
spring:
  cache:
    type: redis
  redis:
    host: spring-cluster.xxxx.ng.001.use2.cache.amazonaws.com
```

Please note that **Redis performs replication asynchronously**, so if we always read from and write to primary, we will always get
the latest data. This is recommended when strong consistency is required.

The second choice is to write to primary and read from replicas:

```yaml
spring:
  cache:
    type: redis
  redis:
    primary: spring-cluster.xxxx.ng.001.use2.cache.amazonaws.com
    reader: spring-cluster-ro.xxxx.ng.001.use2.cache.amazonaws.com
```

We will also have to create a `LettuceConnectionFactory` bean since spring doesn't seem to have a configuration for specifying
primary and readers host. Here `spring.cache.redis.primary` and `spring.cache.redis.reader` are our custom properties.

```java
@Configuration
@EnableCaching
public class EnableCache {
  public static final int PORT = 6379;
  
  @Value("${spring.redis.primary}")
  private String primaryEndpoint;
  
  @Value("${spring.redis.reader}")
  private String readerEndpoint;
  @Bean
  public LettuceConnectionFactory redisConnectionFactory() {
      LettuceClientConfiguration clientConfig = LettuceClientConfiguration
              .builder()
              .readFrom(ReadFrom.REPLICA_PREFERRED)
              .build();
      
      var staticMasterReplicaConfiguration = 
        new RedisStaticMasterReplicaConfiguration(this.primaryEndpoint, PORT);
      
      staticMasterReplicaConfiguration.addNode(readerEndpoint, PORT);
      return new LettuceConnectionFactory(
              staticMasterReplicaConfiguration, 
              clientConfig
      );
  }
}
```

`RedisStaticMasterReplicaConfiguration` is one of the many available configurations class in Lettuce. We use this when
our nodes have a fixed URL which is true for our case.

We have also specified our read preference to `ReadFrom.REPLICA_PREFERRED`. This means Spring will prefer replica to perform
read operations and will only prefer primary when all the replicas are down. Please find the full list of available read settings in [Lettuce reference doc](https://lettuce.io/core/release/reference/#readfrom.read-from-settings).

This mode allows us to improve our read throughput by distributing the load of read requests among replicas. Another benefit is that
in case of the primary node's failure, clients will still be able to read the data.

One downside of this configuration is that since replication is asynchronous, you might get stale data sometimes if there
is a lag in replications.

### Connecting to ElatiCahce when Cluster mode is Enabled

When cluster mode is enabled, we will only receive the endpoint of the configuration URL or seed URL in Lettuce client's
terminology.

```yaml
spring:
  cache:
    type: redis
  redis:
    cluster:
      nodes: spring-redis-cluster.xx.clustercfg.use2.cache.amazonaws.com:6379
    lettuce:
      cluster:
        refresh:
          period: PT10M
```

Lettuce will use this seed URL to retrieve the complete topology of the cluster: URL of all the nodes and their roles. It will
also periodically refresh the topology based on the `Duration` configured. We have set refresh duration to `PT10M` i.e., 10 minutes.
If new shards are added or removed it will discover it.

This mode is ideal when you want to increase your write throughput as the load will be distributed among partitions.

Now that we are done with all the configurations, let's make some operations cacheable.

## Caching with Spring Boot

Spring provides Cache abstraction to do caching in a Spring Boot application. Please read our article on
[Spring Boot Cache](https://reflectoring.io/spring-boot-cache/) to read more about it in detail. In this section, we will
just see a quick overview of the same.

First, to use Spring cache we need to enable caching in our application with `@EnableCaching` annotation:

```java
@Configuration
@EnableCaching
public class EnableCache {
    ....
}
```

Next, we need to annotate our methods whose results we want to cache with Spring cache annotations:

```java
@Service
@AllArgsConstructor
@CacheConfig(cacheNames = "product")
public class ProductService {
  private final ProductRepository repository;
  
  @Cacheable
  public Product getProduct(String id) {
    return repository.findById(id).orElseThrow(()->
            new RuntimeException("No such product found with id"));
  }
  
  public Product addProduct(ProductInput productInput){
    var product = new Product();
    product.setName(productInput.getName());
    product.setPrice(productInput.getPrice());
    product.setWeight(product.getWeight());
    product.setCategory(
            Objects.isNull(productInput.getCategory())? 
                    Category.BOOKS: 
                    productInput.getCategory()
    );
    return repository.save(product);
  }
  
  @CacheEvict
  public void deleteProduct(String id) {
      repository.deleteById(id);
  }
  
  @CachePut(key = "#id")
  public Product updateProduct(String id, ProductInput productInput) {
      var product = new Product();
      product.setId(id);
      product.setName(productInput.getName());
      product.setPrice(productInput.getPrice());
      product.setWeight(product.getWeight());
      product.setCategory(
              Objects.isNull(productInput.getCategory())?
                      Category.BOOKS: 
                      productInput.getCategory()
      );
      return repository.save(product);
  }
}
```

Let's talk about some common features and properties of the annotations before talking about them one by one:

* `cacheNames`: Providing cache name is mandatory in all cache annotations. We can provide more than one cache name too.
* `key`: Spring does a good job of creating a default key for our values. In case of `getProduct` function, it will use the argument of `id` parameter as a key.
  In case if we have more than one parameter or complex object parameter we need to override its `key` property and provide on using SEpL
  e.g., `@CachePut(key = "#id")` on `updateProduct`

Now let's look at the annotations one by one:

* `@CacheConfig(cacheNames = "product")`: We use this annotation in cases where all the cache annotations used in the annotated
  class share some common configuration. In our case, all share a common cache.
* `@Cacheable`: It caches the result of the annotated method.
* `@CacheEvit`: Removes the value from the cache.
* `@CachePut`: Updates the value of the given key.

One last thing about Spring cache abstraction before we move on.

Spring cache abstraction is well, an abstraction, it still needs a concrete implementation to function.
To be precise, it needs an implementation of `CacheManager`. Since we have added Spring Data Redis dependency in our project,
the implementation for the same is already provided by it in form of `RedisCacheManger`. So now all we need to do is
to run our application.

Congratulations on finishing the Spring Cache Abstraction crash course!🎉

## Running our example application

Our Example application comes with a `DockerFile` and a Terraform script to deploy the application on AWS ECS as a Fargate instance.

As a first step create an ECR repository and upload the image of the example application. You should be able to find push commands
for the same from the ECR repository page.

![Push commands](/assets/img/posts/spring-elasticache-redis/push-commands.png)

The rest of the job will be done by the Terraform script, just make sure to provide the required details in the `input.tf` file.
```terraform
variable "profile" {
  default = "sandbox"//If you have multiple profiles replace this with your profile name
}

variable "region" {
  default = "us-east-2"
}

variable "name" {
  default = "example-app"
}

variable "account" {
  default = "12222333"
}

variable "repository" {
  default = "example-repository"
}

variable "vpc" {
  default = "vpc-axxxx"
}

variable "public-subnet" {
  default = ["subnet-a","subnet-b"]
}

```
Replace all the default values with your environment details. Then execute `terraform init` and then `terraform apply`.

Finally, in the Redis cluster's security group give this service's security group as an inbound rule. Done!

The service has public-facing IP. Once the service is up, use that to try the APIs.

## Things to keep in mind while caching.

### What to cache?

Whatever we can! As retrieving data from cache will always be more efficient than retrieving from a database, or an API
call. Being said that we should still be a bit careful with what we cache.

We cache data so that the consecutive request for the same resource are served faster. But, what if the data is updated more
frequently than it's fetched? In this case, overall write overhead will be more since Spring needs to update database
and cache in every call. In such cases caching should be considered only if our requirements demand it.

### Cache Eviction 

Deciding when to evict the data from the cache can be even more challenging than deciding what to cache.

Let's say we cached an API response, but data on the remote server might change without our
knowledge. Here one question arises is that should we even cache this data? If we must then Time-to-live (TTL) for
keys should be considered. Once the TTL passes, the keys will be automatically be removed from the cache.

```yaml
spring:
  cache:
    type: redis
    redis:
      time-to-live: 60000
```

Another benefit of TTL is that let's say due to a glitch in our system the key was not removed then TTL will come in handy
in this case.

Other than TTL Redis also has an auto eviction policy in place. For ElastiCahe Redis by default, it's `volatile-lru`. This policy will
evict the least recently used keys out of all the keys with an “expire” field set. Furthermore, this policy will be enacted only
when an instance is about to hit `maxmemory`.

If we are not using TTL then we might want to use `allkeys-lru` eviction policy which will evict the least recently used key.

In ElastiCache we can set this by overriding `maxmemory-policy`.

To do that you need to create a Parameter Group using `redis.6.x` or whichever Redis version we are using as a base:

![Parameter Group create](/assets/img/posts/spring-elasticache-redis/parameter-group-create.png)

Then we need to edit the parameter group:

![Parameter Group edit](/assets/img/posts/spring-elasticache-redis/parameter-group-edit.png)

Finally, we need to apply it to the Redis cluster.

### Key size

Redis supports keys of size up to 512 MB. Quite big! Redis keys are binary-safe Strings means you can set anything as a key
a string, an object, or even an image. We should prefer shorter keys as it will impact the performance of the fetch
operation.

## Conclusion

Thank you for reading!
