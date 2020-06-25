---
title: Implementing a Cache with Spring's Cache Abstraction
categories: [spring-boot]
date: 2020-06-20 05:00:00 +1100
modified: 2020-06-20 05:00:00 +1100
author: artur
excerpt: "Spring cache abstraction supports powerful mechanism for caching. This article shows how to use it with the Hazelcast as cache provider."
image:
  auto: 0071-cache
---

We use a cache to protect the database or to avoid cost-intensive calculations.
Spring provides an abstraction layer for implementing a cache. This article shows how to use
this abstraction support with [Hazelcast](https://hazelcast.org/) as a cache provider.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/cache" %}

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
this abstraction level only, without calling the Cache provider's code directly. The Spring abstraction provides annotations to
abstract the cache and to separate it from our code. For example, 
a method that executes an operation for slow reading data can be annotated
to use the cache instead.

Behind the abstraction, we can choose a 
dedicated cache provider, but the business logic doesn't need to know anything about
the provider. 

**The Spring abstraction layer lets us use a cache independently of the cache provider.**

## Cache Providers
Spring Boot supports a list of [providers](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#boot-features-caching-provider).
If Spring Boot finds a cache provider
 on the classpath, it tries to find a default configuration for this
provider. If it doesn't find a provider, it configures the the `Simple` provider, which is just a 
`ConcurrentHashMap`.

## Using Spring's Cache Abstraction
Let's have a look at how to enable caching in a Spring Boot application

First, we have to add the cache starter (Gradle notation):

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
After enabling the cache we are ready to use it, but we didn't define any cache provider, so as mentioned above a 
`Simple` provider would be used. The in-memory cache might be good for testing, but we want to use a "real" cache in production.

We need a provider that supports several data structures, a distributed cache, a time-to-live configuration, and so on.
Let's use Hazelcast as a cache provider. [We could use Hazelcast as a Cache provider directly](/spring-boot-hazelcast/), but we want to configure it so that we can use the Spring abstraction instead.

To use the cache we have to do two things:
  * configure the cache provider, and
  * declare the annotation on the methods and classes, that are should be cached.

### Configuring a Cache Provider
The Spring cache abstraction supports the cache access only but not the configuration
of the cache. The configuration of the cache is provider specific.

To add Hazelcast as a cache provider we first have to add Hazelcast libraries:

````groovy
compile("com.hazelcast:hazelcast:4.0.1")
compile("com.hazelcast:hazelcast-spring:4.0.1")
````

The first dependency is the Hazelcast library, and the second one is the implementation of 
the Spring cache abstraction - amongst others, the implementation of `CacheManager`
and `Cache`.


Now Spring Boot will find Hazelcast on the classpath and will search for a Hazelcast configuration.

Hazelcast supports two kinds of [cache topology](/spring-boot-hazelcast/#hazelcast-as-a-distributed-cache).
We can choose which topology we want to configure.

### Configuring an Embedded Cache with Hazelcast
With the embedded topology, every instance of the Spring Boot application starts a member of 
the cache cluster.

Since we added Hazelcast to the classpath, Spring Boot will search for the cache configuration
of Hazelcast. Spring Boot will set up the configuration for embedded topology if
`hazelcast.xml` or `hazelcast.yaml` is found on the classpath. These are files,
where we can define cache names, data structures, and other parameters of the cache.

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

We add a bean of the type `Config` to the Spring context. This is enough to
configure a Hazelcast cache. The Spring cache abstraction will find this configuration
and set up a Hazelcast cache with the embedded topology.

### Configuring a Client-Server Cache with Hazelcast
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
automatically. Note, that it makes sense to use [near-cache](/spring-boot-hazelcast/#near-cache)
in the client-server topology.

### Using a Cache
Now we can use the Spring caching annotations to enable the cache on specific methods.
We create a Spring Boot application with an in-memory database and JPA for accessing the database.

We assume that the operations for accessing the database are slow because of heavy database use. Our goal is to avoid unnecessary operations by using a cache.

#### Putting Data into the Cache
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
                .orElseThrow(() -> new IllegalStateException("car with id " + uuid + " was not found"));
    }
   
   // other methods omitted. 
}
```
The method `saveCar()` is supposed to be used only for inserting new cars. Normally we don't
need any cache behavior in this case. The car is just stored in the database.

The method `get()` is annotated with `@Cachable`. It starts the powerful Spring cache support. The data in the cache is stored using a key-value pattern. Spring Cache uses the parameters
 of the method as key and the return value as a value in the cache.

When the method is called the first time, Spring will check if the value with the given key
is in the cache. It will not be the case, and the method itself will be executed. It means we will
have to connect to the database and read data from it. The `@Cacheable` annotation takes care
of putting the result into the cache.

After the first call,
the cached value is in the cache and stays there according to the cache configuration.

When the method is called the second time, and the cache value has not been evicted yet,
Spring will search for the value by the key. Now it hits.

**The value is found in the cache, and the method will not be executed.**

Spring Cache uses `SimpleKeyGenerator` to calculate the key from the method parameters. It's also
possible to define a custom key generation by using the `key` attribute in the `@Cacheable` annotation.

Also, we can use a different key generator. We should implement the interface `KeyGenerator`.
After that, we can declare a bean with the key generator implementation:

```java
@Configuration
@EnableCaching
public class EmbeddedCacheConfig {

    @Bean
    public KeyGenerator keyGenerator() {
        return new CarKeyGenerator();
    }
    // other methods omitted
}
``` 

Another possibility is to use the `keyGenerator` attribute in the `@Cacheable` annotation:

````java
@Service
class CarService {

    @Cacheable(value = "cars", keyGenerator = "carKeyGenerator")
    public Car get(UUID uuid) {
        return carRepository.findById(uuid)
                .orElseThrow(() -> new IllegalStateException("car with id " + uuid + " was not found"));
    }
   
   // other methods omitted. 
}
````

#### Serialization
The java objects, that are stored in the cache should be serialized. 
The `Car` class implements `Serializable`. In this case, the provider will use
the usual java serialization.

We can use other serializers too. Hazelcast provides us two options:

* implement a Hazelcast serialization interface type in the classes, that should be serialized.
* implement a custom serializer and add it to the cache configuration.

Hazelcast has few serialization interface types. Let's have a look at the interface `DataSerializable`.
This interface is more CPU and memory usage efficient than `Serializable`.

We implement this interface in the class `Car`:

```java
public class Car implements DataSerializable {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    private String name;
    private String color;

    @Override
    public void writeData(ObjectDataOutput out) throws IOException {
        out.writeUTF(id.toString());
        out.writeUTF(name);
        out.writeUTF(color);
    }

    @Override
    public void readData(ObjectDataInput in) throws IOException {
        id = UUID.fromString(in.readUTF());
        name = in.readUTF();
        color = in.readUTF();
    }
}
```

The methods `writeData()` and `readData()` serialize and deserialize the object of the class `Car.
We have to note, that the serialization and the deserialization of the single fields should me 
done in the same order.

That's it. Hazelcast will now use the serialization methods.
But now we have the Hazelcast dependency in the domain object `Car`. We can use a custom serializer
to resolve this dependency.

First, we have to implement a serializer. Let's take the `StreamSerializer`.

````java
public class CarStreamSerializer implements StreamSerializer<Car> {

    @Override
    public void write(ObjectDataOutput out, Car car) throws IOException {
        out.writeUTF(car.getId().toString());
        out.writeUTF(car.getName());
        out.writeUTF(car.getColor());
    }

    @Override
    public Car read(ObjectDataInput in) throws IOException {
        return Car.builder()
                .id(UUID.fromString(in.readUTF()))
                .name(in.readUTF())
                .color(in.readUTF())
                .build();
    }

    @Override
    public int getTypeId() {
        return 1;
    }
}
````
The methods `write` and `read` serialize and deserialize the object `Car`. We have to have the same order of 
writing and reading fields again. The method `getTypeId` return the identifier of this serializer.

Second, we have to add this serializer to the configuration:

```java
@Configuration
@EnableCaching
public class EmbeddedCacheConfig {

    @Bean
    Config config() {
        Config config = new Config();

        MapConfig mapConfig = new MapConfig();
        mapConfig.setTimeToLiveSeconds(300);
        config.getMapConfigs().put("cars", mapConfig);

        config.getSerializationConfig()
                .addSerializerConfig(serializationConfig());

        return config;
    }

    private SerializerConfig serializationConfig() {
        SerializerConfig serializerConfig = new SerializerConfig();
        serializerConfig.setImplementation(new CarStreamSerializer());
        serializerConfig.setTypeClass(Car.class);
        return serializerConfig;
    }
}
```

In the method `serializationConfig()` we let Hazelcast know, that it should use `CarStreamSerializer` for
`Car` objects.

Now the class `Car` doesn't need to implement anything and can be just a domain object.  

#### Updating the Cache
If we have data in the cache, which is actually a copy of the data in the primary storage, 
and this primary storage is changed, we can get old or inconsistent data in the cache.
We can solve this by using the `@CachePut` annotation:

```java
@Service
class CarService {

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
**The body of the `update()` method will always be executed.**
The result of the method is to put the result of the method into the cache. In this case, we also defined the key that is used to update the data in the cache.

#### Evicting Data from the Cache

If we delete data from our primary storage, we would have stale data in the cache.
We can annotate the deletion method to update the cache:

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

## Conclusion
Spring's cache abstraction provides a powerful mechanism to keep cache usage abstract und independent of a
cache provider. Spring Cache supports a few well-know cache providers, which should be configured in a 
provider-specific way. With Spring's cache abstraction we can keep our business code and the cache implementation
separate.

You can play around with a complete Spring Boot application using the Cache abstraction [on GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/cache). 



  
 
    
 




