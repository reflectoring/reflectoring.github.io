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

Cache is used to protect the database or avoid cost-intensive calculations.
Spring provides an abstraction level for using cache. This article show how to use
this abstraction support with the [Hazelcast](https://hazelcast.org/) as provider.

{% include github-project.html url="https://github.com/arkuksin/code-examples/tree/cache/spring-boot/cache" %}

# What is Abstracted?

If we want to build a Spring Boot application and use a cache, usually we want to
execute some typical operations like 
 * put data into the cache,
 * read data from the cache,
 * update data in the cache,
 * delete data from the cache.
 
We have a lot of technologies to set up a cache in our system. Every of this technology
has its own API. If we want to use it in our application, we would have a dependency
to a cache provider.
 
The Spring cache abstraction gives us the possibility to use
an abstract level to access the cache. Our business code can use
the abstraction level only. Spring abstraction provides annotation to
abstract the cache and separate it from our code. For example, 
a method that execute an operation for slow reading data can be annotated
to use teh cache instead.  

Behind the abstraction level we can choose a 
dedicated cache provider, but the business logic does'n need to know anything about
the provider. 

**Spring abstraction let us use a cache independently of the cache provider.**

## Cache Providers
Spring Boot supports a list of [providers](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#boot-features-caching-provider).
Spring Boot tries to find one of them on classpath. If a cache provider
is found on the classpath, Spring Boot tries to find a default configuration for this
provider. If no provider is found, the `Simple` provider is used, which is just a 
`ConcurrentHashMap`.

## Using Cache Abstraction
Let's see how to enable caching in Spring Boot application

First we have to add a cache starter

```groovy
implementation 'org.springframework.boot:spring-boot-starter-cache'
```

This starter provides all classes we need to support cache. These are 
interfaces `Cache` and `CacheManager` that should be implemented
by the provider and annotation for the methods and classes, that 
are supposed to use the cache.

Second we should enable the cache using by Spring Boot.

```java
@Configuration
@EnableCaching
public class EmbeddedCacheConfig {
 
  // Other methods omitted.

}
```

The annotation `@EnableCaching` will start the search for a `CacheManger` bean to configure the cache provider.
Now we are already ready to use the cache, but we didn't define any cache provider, so as mentioned above a 
`Simple` provider would be used. This provider might be good for testing, but we want use a cache in production.
We need a provider that supports several data structures, distributed cache, configuration of time-to-live etc.
Let's use Hazelcast as cache provider. The Hazelcast has a lot of [advantages](/spring-boot-hazelcast/) as provider.  

To use cache we have to do two things:
  * configure the cache provider
  * declare the annotation on the methods and classes, that are used for caching

### Provider Configuration
The Spring cache abstraction supports the cache access only but not the configuration
of the cache. The configuration of the cache is provider specific.

To add Hazelcast as cache provider we first have to add Hazelcast libraries.

````groovy
compile("com.hazelcast:hazelcast:4.0.1")
compile("com.hazelcast:hazelcast-spring:4.0.1")
````

The first dependency is the Hazelcast library, and the second one is the integration of the
hazelcast into Spring Cache Abstraction amongst others, the implementation of `CacheManager`
ans `Cache`.

Now the Spring Boot will find the Hazelcast on the classpath und will search for the configuration
of the cache provider.

Hazelcast supports two kinds of cache [topology](/spring-boot-hazelcast/#hazelcast-as-a-distributed-cache).
We can choose, which topology we want to configure.

#### Configuration of Embedded Cache Topology
With embedded topology, every instance of Spring Boot application starts a member of 
the cache cluster.

Since we added the Hazelcast to the classpath, Spring Boot will search for the cache configuration
of Hazelcast. Spring Boot will set up the configuration for embedded topology, if
`hazelcast.xml` or `hazelcast.xml` is found on the classpath. These are files,
where we can define cache names, data structure and other parameters of the cache.
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
this bean and configure the `CacheManager` for using Hazelcast as client of a Hazelcast cache cluster
automatically. Note, that it makes sense to use [near-cache](spring-boot-hazelcast/#near-cache) in the client-server topology.

### Declaration

## Conclusion



  
 
    
 




