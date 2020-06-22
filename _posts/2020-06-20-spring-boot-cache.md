---
title: Spring Cache Abstraction with Spring Boot and Hazelcast 
categories: [spring-boot]
date: 2020-06-20 05:00:00 +1100
modified: 2020-06-20 05:00:00 +1100
author: artur
excerpt: "TODO"
image:
  auto: 0071-cache
---

A cache is used to protect the database or avoid cost-intensive calculations.
Spring provides an abstraction level for using cache. This article shows how to use
this abstraction support with the [Hazelcast](https://hazelcast.org/) as a cache provider.

{% include github-project.html url="https://github.com/arkuksin/code-examples/tree/cache/spring-boot/cache" %}

# What is abstracted?

If we want to build a Spring Boot application and use a cache, usually we want to
execute some typical operations like 
 * put data into the cache,
 * read data from the cache,
 * update data in the cache,
 * delete data from the cache.
 
We have a lot of technologies to set up a cache in our system. Every of this technology
has its own API. If we want to use it in our application, we would have a dependency
on a cache provider.
 
The Spring Cache Abstraction gives us the possibility to use
an abstract level to access the cache. Our business code can use
the abstraction level only. Spring abstraction provides annotations to
abstract the cache and to separate it from our code. For example, 
a method that executes an operation for slow reading data can be annotated
to use the cache instead.

Behind the abstraction level, we can choose a 
dedicated cache provider, but the business logic doesn't need to know anything about
the provider. 

**Spring abstraction let us use a cache independently of the cache provider.**

## Cache Providers
Spring Boot supports a list of [providers](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#boot-features-caching-provider).
Spring Boot tries to find one of them on the classpath. If a cache provider
is found on the classpath, Spring Boot tries to find a default configuration for this
provider. If no provider is found, the `Simple` provider is used, which is just a 
`ConcurrentHashMap`.

## Using Cache Abstraction
Let's see how to enable caching in Spring Boot application

First, we have to add a cache starter

```groovy
implementation 'org.springframework.boot:spring-boot-starter-cache'
```

This starter provides all classes we need to support the cache. These are 
interfaces `Cache` and `CacheManager` that should be implemented
by the provider and annotation for the methods and classes, that 
are supposed to use the cache.

Second, we should enable the cache used by Spring Boot.

```java
@Configuration
@EnableCaching
public class EmbeddedCacheConfig {
 
  // Other methods omitted.

}
```

The annotation `@EnableCaching` will start the search for a `CacheManger` bean to configure the cache provider.
After enabling the cache we are ready to use it, but we didn't define any cache provider, so as mentioned above a 
`Simple` provider would be used. This provider might be good for testing, but we want to use a cache in production.
We need a provider that supports several data structures, distributed cache, a configuration of time-to-live, etc.
Let's use Hazelcast as a cache provider. The Hazelcast has a lot of [advantages](/spring-boot-hazelcast/) as a provider.  

To use the cache we have to do two things:
  * configure the cache provider
  * declare the annotation on the methods and classes, that are used for caching

### Provider Configuration
The Spring cache abstraction supports the cache access only but not the configuration
of the cache. The configuration of the cache is provider specific.

To add Hazelcast as a cache provider we first have to add Hazelcast libraries.

````groovy
compile("com.hazelcast:hazelcast:4.0.1")
compile("com.hazelcast:hazelcast-spring:4.0.1")
````

The first dependency is the Hazelcast library, and the second one is the integration of the
hazelcast into Spring Cache Abstraction amongst others, the implementation of `CacheManager`
and `Cache`.


Now the Spring Boot will find the Hazelcast on the classpath and will search for the configuration
of the cache provider.

Hazelcast supports two kinds of cache [topology](/spring-boot-hazelcast/#hazelcast-as-a-distributed-cache).
We can choose, which topology we want to configure.

#### Configuration of Embedded Cache Topology
With embedded topology, every instance of Spring Boot application starts a member of 
the cache cluster.

Since we added the Hazelcast to the classpath, Spring Boot will search for the cache configuration
of Hazelcast. Spring Boot will set up the configuration for embedded topology if
`hazelcast.xml` or `hazelcast.xml` is found on the classpath. These are files,
where we can define cache names, data structure, and other parameters of the cache.
Another option to configure the cache is to do it programmatically.

```java
import com.hazelcast.config.Config;

@Configuration
@EnableCaching
public class EmbeddedCacheConfig {

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

We add a bean of the type `Config` to the Spring context. It is enough to
configure the cache of Hazelcast. Spring Cache Abstraction will find this configuration
and set up Hazelcast cache with embedded topology.

#### Configuration of Client-Server Cache Topology
[Client-Server topology](/spring-boot-hazelcast/#client-server-topology) is used to start the application as
a client of a cache cluster.

Spring Cache Abstraction will set up the client-server configuration, if 
`hazelcast-client.xml` or `hazelcast-client.xml` is found on the classpath.
Similar to the embedded cache we can configure the client-server topology programmatically too.

```java
@Configuration
@EnableCaching
public class ClientCacheConfig {

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

We added the `ClientConfig` bean to the context. Spring Cache Abstraction will find
this bean and configure the `CacheManager` for using Hazelcast as a client of a Hazelcast cache cluster
automatically. Note, that it makes sense to use [near-cache](spring-boot-hazelcast/#near-cache)
in the client-server topology.

### Declaration
Now we can use the annotation of Spring Cache to enable the cache on the methods.
We create a Spring Boot application with an in-memory database and JPA for accessing the database.
We assume that the operations for accessing the database are slow and require establishing the connection
to the database. Our goal is to avoid unnecessary operations by using cache.

We create a service for managing data. This service has a method for reading data.

```java
@Service
public class CarService {

    public Car saveCar(Car car) {
        return carRepository.save(car);
    }

    @Cacheable(value = "cars")
    public Car get(UUID uuid) {
        return carRepository.findById(uuid)
                .orElseThrow(() -> new IllegalStateException("car with id " + uuid + " was not found"));
    }
   
   // other methods omitted. 
}
```
The method `saveCar()` is supposed to be used only for inserting new cars. Normally we don't
need any cache behavior in this case. The car is just stored in the database.

The method `get()` is annotated with `@Caachable`. It starts the whole powerful Spring Cache support
for caching. The data in the cache are stored using the key-value pattern. Spring Cache uses the parameters
 of the method as key and the return value as a value in the cache.

When the method is called the first time Spring Cache will check, if the value with the given key
id in is the cache. It will not be the case, and the method itself will be executed. It means we will
have to connect the database and read data from it. The `@Cacheable` annotation takes care
of putting the result into the cache. The usual java serialization is used for values
unless another serializer is defined for the cache provider. After the first call,
the cached value is in the cache and stays there according to the cache configuration.

When the method is called the second time, and the cache value is not evicted yet,
Spring Cache will search for the value by the key. Now it hits.

**The value is found in the cache, and the method will not be executed.**
 
Spring Cache uses `SimpleKeyGenerator` to calculate the key from the method parameters. Also, it is
possible to define a custom key generation by using `key` attribute in the `@Cacheable`.

If we have data in the cache, which is actually a copy of the data in the primary storage, 
and this primary storage is changed, we can get old or incontinence data in the cache.
We can solve this problem by using `@CachePut` annotation.

```java
@Service
public class CarService {

    @CachePut(value = "cars", key = "#car.id")
    public Car update(Car car) {
        if (carRepository.existsById(car.getId())) {
            return carRepository.save(car);
        }
        throw new IllegalArgumentException("A car must have an id to be updated");
    }
    
    // other methods omitted.
}
```
**The method that is annotated by `@CachePut` is always executed.**
The result of the method is put into the cache. In this case, we defined
the key, that is used to update data in the cache.

If we delete data from our primary storage, we would have stale data in the cache.
We can annotate the deletion method to update the cache.

```java
@Service
public class CarService {

    @CacheEvict(value = "cars", key = "#uuid")
    public void delete(UUID uuid) {
        carRepository.deleteById(uuid);
    }
    // Other methods omitted.
}
```

The `@CacheEvict` annotation deletes the data from the cache. We can define the key, that
is used to delete the value from the cache. We can delete all entries from the cache if we set the attribute
`allEntries` to true.

<div class="notice success">
  <h4>Implement Cache as AOP</h4>
  <p>
  If we wouldn't like to use Spring Cache Abstraction for some reason,
  we should implement the cache logic as aspect oriented programming, otherwise
  we would break the Single Responsibility Principle.
  </p>
</div>


## Conclusion
Spring Cache abstraction provides a powerful mechanism to keep cache usage abstract und independently of a
cache provider. Spring Cache supports a few well-know cache providers, which should be configured in a 
provider-specific way. With Spring Cache Abstraction we can keep our business code and the cache implementation
separately.



  
 
    
 




