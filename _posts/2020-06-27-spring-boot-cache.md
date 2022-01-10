---
title: Implementing a Cache with Spring Boot
categories: ["Spring Boot"]
date: 2020-06-27 05:00:00 +1100
modified: 2021-09-30 05:00:00 +1100
author: artur
excerpt: "Spring provides a powerful abstraction to implement a cache without binding to a specific cache provider. This article shows how to use it with Hazelcast as cache provider."
image:
  auto: 0071-disk
---

We use a cache to protect the database or to avoid cost-intensive calculations.
Spring provides an abstraction layer for implementing a cache. This article shows how to use
this abstraction support with [Hazelcast](https://hazelcast.org/) as a cache provider.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/cache" %}}

# Why Do We Need a Cache Abstraction?

If we want to build a Spring Boot application and use a cache, usually we want to
execute some typical operations like 
 * putting data into the cache,
 * reading data from the cache,
 * updating data in the cache,
 * deleting data from the cache.
 
We have a lot of technologies available to set up a cache in our application. Each of these technologies, like Hazelcast or Redis, for example,
has its own API. If we want to use it in our application, we would have a hard dependency
on one of those cache providers.
 
The Spring cache abstraction gives us the possibility to use
an abstract API to access the cache. Our business code can use
this abstraction level only, without calling the Cache provider's code directly. **Spring provides an easy-to-use annotation-based method to implement caching.**

Behind the abstraction, we can choose a 
dedicated cache provider, but the business logic doesn't need to know anything about
the provider. 

**The Spring abstraction layer lets us use a cache independently of the cache provider.**

## Cache Providers
Spring Boot supports several cache [providers](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#boot-features-caching-provider).
If Spring Boot finds a cache provider
 on the classpath, it tries to find a default configuration for this
provider. If it doesn't find a provider, it configures the `Simple` provider, which is just a 
`ConcurrentHashMap`.

## Enabling Spring's Cache Abstraction with `@EnableCaching`
Let's have a look at how to enable caching in a Spring Boot application.

First, we have to add a dependency to the cache starter (Gradle notation):

```groovy
implementation 'org.springframework.boot:spring-boot-starter-cache'
```

This starter provides all classes we need to support the cache. These are 
mainly the interfaces `Cache` and `CacheManager` that should be implemented
by the provider, and the annotations for the methods and classes that 
we can use to mark methods as cacheable.

Second, we need to enable the cache:

```java
@Configuration
@EnableCaching
class EmbeddedCacheConfig {
 
  // Other methods omitted.

}
```

The annotation `@EnableCaching` will start the search for a `CacheManger` bean to configure the cache provider.
After enabling the cache we are ready to use it. But we didn't define any cache provider, so as mentioned above a 
`Simple` in-memory provider would be used. This simple cache might be good for testing, but we want to use a "real" cache in production.

We need a provider that supports several data structures, a distributed cache, a time-to-live configuration, and so on.
Let's use Hazelcast as a cache provider. [We could use Hazelcast as a Cache provider directly](/spring-boot-hazelcast/), but we want to configure it so that we can use the Spring abstraction instead.

To use the cache we have to do two things:
  * configure the cache provider, and
  * put some annotations on the methods and classes, that should read from and modify the cache.

## Configuring Hazelcast as a Cache Provider
To use the cache, we don't need to know the cache provider. To configure the cache, however, we need to select a specific provider and configure it accordingly.

To add Hazelcast as a cache provider we first have to add Hazelcast libraries:

````groovy
compile("com.hazelcast:hazelcast:4.0.1")
compile("com.hazelcast:hazelcast-spring:4.0.1")
````

The first dependency is the Hazelcast library, and the second one is the implementation of 
the Spring cache abstraction - amongst others, the implementation of `CacheManager`
and `Cache`.


Now Spring Boot will find Hazelcast on the classpath and will search for a Hazelcast configuration.

Hazelcast supports two different [cache topologies](/spring-boot-hazelcast/#hazelcast-as-a-distributed-cache).
We can choose which topology we want to configure.

### Configuring an Embedded Cache
With the [embedded topology](/spring-boot-hazelcast/#embedded-cache-topology), every instance of the Spring Boot application starts a member of 
the cache cluster.

Since we added Hazelcast to the classpath, Spring Boot will search for the cache configuration
of Hazelcast. Spring Boot will set up the configuration for embedded topology if
`hazelcast.xml` or `hazelcast.yaml` is found on the classpath. In these files, we
can define cache names, data structures, and other parameters of the cache.

Another option is to configure the cache programmatically via Spring's Java config:

```java
import com.hazelcast.config.Config;

@Configuration
@EnableCaching
class EmbeddedCacheConfig {

  @Bean
  Config config() {
    Config config = new Config();

    MapConfig mapConfig = new MapConfig();
    mapConfig.setTimeToLiveSeconds(300);
    config.getMapConfigs().put("cars", mapConfig);

    return config;
  }
}
```

We add a bean of type `Config` to the Spring context. This is enough to
configure a Hazelcast cache. The Spring cache abstraction will find this configuration
and set up a Hazelcast cache with the embedded topology.

### Configuring a Client-Server Cache
In Hazelcast's [Client-Server topology](/spring-boot-hazelcast/#client-server-topology) the application is a client of a cache cluster.

Spring's cache abstraction will set up the client-server configuration if 
`hazelcast-client.xml` or `hazelcast-client.yaml` is found on the classpath.
Similar to the embedded cache we can also configure the client-server topology programmatically:

```java
@Configuration
@EnableCaching
class ClientCacheConfig {

  @Bean
  ClientConfig config() {
    ClientConfig clientConfig = new ClientConfig();
    clientConfig.addNearCacheConfig(nearCacheConfig());
    return clientConfig;
  }

  private NearCacheConfig nearCacheConfig() {
    NearCacheConfig nearCacheConfig = new NearCacheConfig();
    nearCacheConfig.setName("cars");
    nearCacheConfig.setTimeToLiveSeconds(300);
    return nearCacheConfig;
  }
}
```

We added the `ClientConfig` bean to the context. Spring will find
this bean and configure the `CacheManager` to use Hazelcast as a client of a Hazelcast cache cluster
automatically. Note that it makes sense to use [near-cache](/spring-boot-hazelcast/#near-cache)
in the client-server topology.

## Using the Cache
**Now we can use the Spring caching annotations to enable the cache on specific methods.**
For demo purposes, we're looking at a Spring Boot application with an in-memory database and JPA for accessing the database.

We assume that the operations for accessing the database are slow because of heavy database use. Our goal is to avoid unnecessary operations by using a cache.

### Putting Data into the Cache with `@Cacheable`
We create a `CarService` to manage car data. This service has a method for reading data:

```java
@Service
class CarService {

  public Car saveCar(Car car) {
    return carRepository.save(car);
  }

  @Cacheable(value = "cars")
  public Car get(UUID uuid) {
    return carRepository.findById(uuid)
      .orElseThrow(() -> new IllegalStateException("car not found"));
  }
   
  // other methods omitted. 
}
```text
The method `saveCar()` is supposed to be used only for inserting new cars. Normally we don't
need any cache behavior in this case. The car is just stored in the database.

The method `get()` is annotated with `@Cachable`. This annotation starts the powerful Spring cache support. The data in the cache is stored using a key-value pattern. **Spring Cache uses the parameters
 of the method as key and the return value as a value in the cache**.

When the method is called the first time, Spring will check if the value with the given key
is in the cache. It will not be the case, and the method itself will be executed. It means we will
have to connect to the database and read data from it. The `@Cacheable` annotation takes care
of putting the result into the cache.

After the first call,
the cached value is in the cache and stays there according to the cache configuration.

When the method is called the second time, and the cache value has not been evicted yet,
Spring will search for the value by the key. Now it hits.

**The value is found in the cache, and the method will not be executed.**

### Updating the Cache with `@CachePut`
The data in the cache is just a copy of the data in the primary storage. 
If this primary storage is changed, the data in the cache may become stale.
We can solve this by using the `@CachePut` annotation:

```java
@Service
class CarService {

  @CachePut(value = "cars", key = "#car.id")
  public Car update(Car car) {
    if (carRepository.existsById(car.getId())) {
      return carRepository.save(car);
    }
    throw new IllegalArgumentException("A car must have an id");
  }
  
  // other methods omitted.
}
```text
**The body of the `update()` method will always be executed.**
Spring will put the result of the method into the cache. In this case, we also defined the key that should be used to update the data in the cache.

### Evicting Data from the Cache with `@CacheEvict`

If we delete data from our primary storage, we would have stale data in the cache.
We can annotate the `delete()` method to update the cache:

```java
@Service
class CarService {

  @CacheEvict(value = "cars", key = "#uuid")
  public void delete(UUID uuid) {
    carRepository.deleteById(uuid);
  }
  // Other methods omitted.
}
```

The `@CacheEvict` annotation deletes the data from the cache. We can define the key that
is used to identify the cache item that should be deleted. We can delete all entries from the cache if we set the attribute
`allEntries` to true.

## Customizing Key Generation

Spring Cache uses `SimpleKeyGenerator` to calculate the key to be used for retrieving or updating an item in the cache from the method parameters. It's also
possible to define a custom key generation by specifying a SpEL expression in the `key` attribute of the `@Cacheable` annotation.

If that is not expressive enough for our use case, we can use a different key generator. For this, we implement the interface `KeyGenerator` and declare an instance of it as a Spring bean:

```java
@Configuration
@EnableCaching
class EmbeddedCacheConfig {

  @Bean
  public KeyGenerator carKeyGenerator() {
    return new CarKeyGenerator();
  }

  // other methods omitted
}
``` 

Then, we can reference the key generator in the `keyGenerator` attribute of the `@Cacheable` annotation by bean name:

```java
@Service
class CarService {

  @Cacheable(value = "cars", keyGenerator = "carKeyGenerator")
  public Car get(UUID uuid) {
    return carRepository.findById(uuid)
        .orElseThrow(() -> new IllegalStateException("car not found"));
  }
   
   // other methods omitted. 
}
```

## Conclusion
Spring's cache abstraction provides a powerful mechanism to keep cache usage abstract und independent of a
cache provider. 

Spring Cache supports a few well-known cache providers, which should be configured in a 
provider-specific way.
 
 With Spring's cache abstraction we can keep our business code and the cache implementation
separate.

You can play around with a complete Spring Boot application using the Cache abstraction [on GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/cache). 



  
 
  
 




