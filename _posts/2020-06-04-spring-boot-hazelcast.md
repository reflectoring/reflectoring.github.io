---
title: Distributed Cache with Hazelcast and Spring
categories: [spring-boot]
date: 2020-06-04 05:00:00 +1100
modified: 2020-06-04 05:00:00 +1100
author: artur
excerpt: "We need a Cache to reduce expensive read operations. Distributed applications need a distributed cache. This article shows how to set up a distributed cache cluster with Hazelcast and Spring."
image:
  auto: 0070-hazelcast
---

In some applications, we need to protect the database or avoid cost-intensive calculations.
We can use a cache for this goal. This article shows how to use [Hazelcast](https://hazelcast.org/) as a cache with Spring 
in a distributed and scalable application.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/hazelcast" %}

## Caching 101
Normally, an application reads data from storage, for example, from a database. If we want to increase the performance
of reading or writing data, we can improve the hardware and make it faster. But this costs money.

If the data in the external storage doesn't change very fast, we can create copies of this data in smaller but
much faster storage. These copies are store temporarily. Usually, we use RAM for such fast storage.

**This is what we call a cache**.

If the application wants to access data, it requests the data in the cache. We know that the data in the cache are copies,
and we cannot use them for a long time because the data in the primary storage can change. In this case, we would get a data inconsistency.

That's why we need to define the validity time of the data in the cache. Also, we don't want data in the cache that is not frequently requested. This data would only allocate resources of the cache but wouldn't be used. In this case, we configure the time how long a data lives in the cache if it is not requested. 

**This is what we call time-to-live (TTL)**.

In a big enterprise system, there can be a cluster of caches. We have to replicate and synchronize the data in this cluster
between the caches. 

**This, we call write-through concept**.

## Hazelcast as a Distributed Cache

Let's say we have a Spring Boot application, and we want to use a cache in the application. But we also want to 
be able to scale this application. This means, when we start three instances of the application, for example, that they have to
share the cache to keep the data consistent. 

**We solve this problem by using a distributed cache**.

Hazelcast is a distributed in-memory object store and provides many features including TTL, write-through, and scalability.
We can build a Hazelcast cluster by starting several Hazelcast nodes in a net. Each node is called a member. 

There are two types of topologies we can implement with Hazelcast:
 * embedded cache topology, and
 * client-server topology.
 
Let's have a look at how to implement each topology with Spring.
 
## Embedded Cache Topology
This topology means that every instance of the application has an integrated member: 

![Embedded Cache Topology](/assets/img/posts/hazelcast/embedded-cache.png)

In this case, the application and the cache data are running on the same node. **When a new cache entry is written in
the cache, Hazelcast takes care of distributing it to the other members.** When data is read from the cache, 
it can be found on the same node where the application is running.

### Embedded Cache with Spring

Let's have a look at how to build a cluster with an embedded Hazelcast cache topology and a Spring application.
Hazelcast supports many distributed data structures for caching. We will use a `Map` because it provides the well-known `get`
and `put` operations. 

First, we have to add the Hazelcast dependency. Hazelcast is just a Java library, so that can be done very easily (Gradle notation):

````groovy
compile group: 'com.hazelcast', name: 'hazelcast', version: '4.0.1'
````

Now let's create a cache client for the application.

```java
@Component
public class CacheClient {

    public static final String CARS = "cars";
    private final HazelcastInstance hazelcastInstance
                            = Hazelcast.newHazelcastInstance();

    public Car put(String number, Car car){
        IMap<String, Car> map = hazelcastInstance.getMap(CARS);
        return map.putIfAbsent(number, car);
    }

    public Car get(String key){
        IMap<String, Car> map = hazelcastInstance.getMap(CARS);
        return map.get(key);
    }
   
   // other methods omitted

}
```
That's it. Now the application has a distributed cache. The most important part of this code is the creation of
a cluster member. It happens by calling the method `Hazelcast.newHazelcastInstance()`. The method `getMap()`
creates a `Map` in the cache or returns an existing one. The only thing we have to do to set the name of the `Map`.

When we want to scale our application, every new instance will create a new member and this member will join
the cluster automatically.
 
Hazelcast provides several mechanisms for discovering the members. If we don't configure
any discovery mechanism, the default one is used, in which Hazelcast tries to find other members in the same network using multicast.  

This approach has two advantages:
 * it's very easy to set up the cluster, and
 * data access is very fast.
 
We don't need to set up a separate cache cluster. It means we can create a cluster very fast by adding a couple
of lines of code.

If we want to read the data from the cluster, the data access is low-latency, because we don't need to send
a request to the cache cluster over the network.

But it brings drawbacks too. Imagine we have a system that requires one hundred instances of our application.
In this cluster topology, it means we would have one hundred cluster members even though we don't need them.
This big number of cache members would consume a lot of memory. 

Also, replication and synchronizing would be pretty expensive.
Whenever an entry is added or updated in the cache this entry would be synchronized with other members of the cluster,
which causes a lot of network communication. 

Also, we have to note that Hazelcast is a java library. That means, the member can be embedded in a java
application only.

**We should use the Embedded cache topology when we have to execute high-performance computing with the data from the cache.**

### Cache Configuration
We can configure the cache by passing a `Config` object into the factory method.
Let's have a look at a couple of the configuration parameters:

````java
@Component
public class CacheClient {

    public static final String CARS = "cars";
    private final HazelcastInstance hazelcastInstance 
         = Hazelcast.newHazelcastInstance(createConfig());

    public Config createConfig() {
        Config config = new Config();
        config.addMapConfig(mapConfig());
        return config;
    }

    private MapConfig mapConfig() {
        MapConfig mapConfig = new MapConfig(CARS);
        mapConfig.setTimeToLiveSeconds(360);
        mapConfig.setMaxIdleSeconds(20);
        return mapConfig;
    }
    
    // other methods omitted
}
````

We can configure every `Map` or other data structure in the cluster separately. In this case, we
configure the `Map` of cars. 

With `setTimeToLiveSeconds(360)` we define how long an
entry stays in the cache. After 360 seconds, the entry will be evicted. If the entry is updated, the eviction time will reset to 0 again.

The method `setMaxIdleSeconds(20)` defines how long the entry stays in the cache without being touched.
An entry is "touched" with each read operation. If an entry is not touched for 20 seconds, it will be evicted.
 
## Client-Server Topology
This topology means that we set up a separate cache cluster, and our application is a client of this
cluster.

![Client-Server Cache Topology](/assets/img/posts/hazelcast/client-server-cache.png)

The members form a separate cluster, and the clients access the cluster from outside.

To build a cluster we could create a java application that sets up a Hazelcast member,
but for this example, we'll use a prepared Hazelcast [server](https://hazelcast.org/imdg/download/#hazelcast-imdg).

Alternatively, we can start a [docker container](https://hub.docker.com/r/hazelcast/hazelcast)
as a cluster member. Every server or every docker container will start a new member of the cluster with
the default configuration.

Now we need to create a client to access the cache cluster. Hazelcast uses TCP socket communication. That's
why it's possible to create a client not only with java. Hazelcast provides a list of clients written in other languages.
To keep it simple, let's look at how to create a client with Spring.

First, we'll add the dependency to the Hazelcast client:

````groovy
compile group: 'com.hazelcast', name: 'hazelcast-client', version: '3.12.7'
````

Next, we create a Hazelcast client in a Spring application, similar as we did for the embedded cache topology:

````java
@Component
public class CacheClient {

    private static final String CARS = "cars";

    private HazelcastInstance client = HazelcastClient.newHazelcastClient();

    public Car put(String key, Car car){
        IMap<String, Car> map = client.getMap(CARS);
        return map.putIfAbsent(key, car);
    }

    public Car get(String key){
        IMap<String, Car> map = client.getMap(CARS);
        return map.get(key);
    }
    
    // other methods omitted

}
````
To create a Hazelcast client we need to call the method  `HazelcastClient.newHazelcastClient()`.
Hazelcast will find the cache cluster automatically. After that, we can use the cache by using the `Map`
again. If we put or get data from the Map, the Hazelcast client connects the cluster to access data.

**Now we can deploy and scale the application and the cache cluster independently.** We can have for example 50
instances of the application and 5 members of the cache cluster. This the biggest advantage of this topology.

If we have some problems with the cluster, it's easier to identify and to fix this issue, since the
clients and the cache are separated and not mixed.

This approach has drawbacks, too, though. 

Firstly, whenever we write or read the data from the cluster we need
network communication. It can take longer than in the approach with the embedded cache. 
This difference is especially significant for read operations. 

Secondly, we have to take care of the
version compatibility between the cluster members and the clients. 

**We should use the client-server topology when the deployment of the application is bigger than
the cluster cache.**

Since our application now only contains the clients to the cache and not the cache itself, we need to spin up a cache instance in our tests.
We can do this very easily by using the [Hazelcast Docker image](https://hub.docker.com/r/hazelcast/hazelcast/) and [Testcontainers](https://www.testcontainers.org/) (see [an example](https://github.com/thombergs/code-examples/blob/master/spring-boot/hazelcast/hazelcast-client-server/src/test/java/io/reflectoring/cache/cleint/AbstractIntegrationTest.java) on GitHub).

## Conclusion
The Hazelcast Java library supports setting up the cache cluster with two topologies.
The embedded cache topology supports very fast reading for high-performance computing. The client-server topology supports  independent scaling of the application and the cache
cluster. It's very easy to integrate the cluster or write a client for
the cluster in a Spring (Boot) application.

If you want to play around with a working example, have a look at the code on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/hazelcast).

 



