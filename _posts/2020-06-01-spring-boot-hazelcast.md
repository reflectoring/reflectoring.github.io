---
title: Distributed Cache with Hazelcast and Spring.
categories: [spring-boot]
date: 2020-05-26 05:00:00 +1100
modified: 2020-05-26 05:00:00 +1100
author: artur
excerpt: "Cache is needed for fast access to the data. Some applications need a distributed cache. This article shows how to set up a distributed cache cluster with Hazelcast and Spring."
image:
  auto: 0070-hazelcast
---

In some applications, it is needed to offload the database or avoid multiple calculations of cost-intensive operation.
A cache is used for this goal. This article shows how to use [Hazelcast](https://hazelcast.org/) as Cache with Spring 
in a distributed and scalable application.

{% include github-project.html url="https://github.com/arkuksin/code-examples/tree/hazelcast/spring-boot/hazelcast" %}

## Why Cache
Normally, an application reads data from the storage, for example, a database. If we want to increase the performance
of reading or writing data, we can improve the hardware and make it faster. But it costs money.
If the data in the external storage don't change very fast, we can create copies of these data in smaller but
much faster storage. These copies are store temporarily. Usually, the RAM is used for such kind of storage.
It is called a cache.

If the application wants to access data, it requests the data in the cache. We know, that the data in the cache are copies,
and we cannot use them for a long time. The data in the primary storage can change. In this case, we would get a data inconsistency.
That's why we need to define the validity time of the data in the cache. Also, we don't need the data in the cache, 
that is not frequently required. These data allocate resources of the cache and are not used. In this case, we can configure the time,
how long a data lives in the cache if it is not required. It is called **time-to-live** (TTL).

In a big enterprise system, there can be a cluster of caches. We have to replicate and synchronize the data in this cluster
between the caches. It is called **write-through concept**.

## Hazelcast as Distributed Cache

Let's say we have a Spring application, and we want to build in a cache in the application. But we also want to 
be able to scale this application. It means, when we start for example three instances of the application, they have to
share the cache to keep the data consistently. This problem can be solved by using a **distributed cache**.

Hazelcast is a distributed in-memory object store and provides many features including TTL, work-through, and scalability.
We can build a Hazelcast cluster by starting several `Hazelcast` nodes in a net. This node is called a member. 
Before we go into the topic, how to use Hazelcast with Spring, let's have a look at the topologies of Hazelcast 
cache cluster.

There are two types of topologies
 * topology with embedded cache,
 * client-server topology.
 
## Embedded Cache
This type of topology means, that every instance of application has an integrated member. 

![Embedded Cache Topology](/assets/img/posts/hazelcast/embedded-cache.png)

In this case, the application and the cache data are running on one node. **When a new cache entry is written in
the cache, `Hazelcast` takes care about the distribution to other members.** When data should be read from the cache, 
then this data can be found on the same node, where the application is running.

Let's have a look at how to build a cluster with an embedded `Hazelcast` cache topology and Spring application.
`Hazelcast` supports many distributed data structures for caching. We will use a `Map` because it provides well known `get`
and `put` operations. 

First, we have to add the `Hazelcast` dependency. `Hazelcast` is just a Java library, so that can be done very easily.

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

This approach has two advantages.
 * It is very easy to set up the cluster,
 * Data access is very fast.
 
We don't need to set up a separate cache cluster. It means we can create a cluster very fast by adding a couple
lines of code.

If we want to read the data from the cluster, the data access is low-latency, because we don't need to send
a request to the cache cluster over the net.

But it brings drawbacks too. Imagine we have a system, that requires one hundred instances of our application.
In this cluster topology, it means we would have one hundred of cluster members even though we don't need it.
The replication and synchronizing would be pretty expensive.
Also, we have to note, that the `Hazelcast` is a java library. That means, the member can be embedded in a java
application only.

**Embedded cache topology should be used, when we have to execute high performing computing with the data from the cache.**

### Configuration of Cluster
Since we create the members of the cluster in our code, we can configure the cache.
Let's look at a couple of the configuration parameters.

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
    
    // Other methods omitted.
}
````

We can configure every `Map` or other data structure in the cluster separately. In this case, we
configure the `Map` Cars. 

With the method `setTimeToLiveSeconds(360)` we define how long an
entry stays in the cache. After 360 seconds, the entry will be evicted. If the entry is updated, the eviction time is reset to 0 again.

The method `setMaxIdleSeconds(20)` defines how long the entry stays in the cache without being touched.
Entry is touched by any reading operation. If an entry is not touched for 20 seconds, it will be evicted.
 

## Client-Server Topology
This type of topology means, that we set up a separate cache cluster, and our application is a client of this
cluster.

![Client-Server Cache Topology](/assets/img/posts/hazelcast/client-server-cache.png)

The members build a separate cluster, and the clients access the cluster from outside.
To build a cluster we can create a java application, that sets up a `Hazelcast` member,
but for this example, we can use a prepared `Hazelcast` [server](https://hazelcast.org/imdg/download/#hazelcast-imdg).
Alternatively, we can start a [docker container](https://hub.docker.com/r/hazelcast/hazelcast)
as a cluster member. Every server or every docker container will start a new member of the cluster with
the default configuration.

Now we need to create a client to access the cache cluster. `Hazelcast` uses TCP socket communication. That's
why it is possible to create a client not only with java. `Hazelcast` provide a list of client written in other languages.
To keep it simple let's look at how to create a client with Spring.

First, we have to add a `Hazelcast` dependency for the client.

````groovy
compile group: 'com.hazelcast', name: 'hazelcast-client', version: '3.12.7'
````

Now we create a `Hazelcast` client in a Spring application.

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
To create a `Hazelcast` client we need to call the method  `HazelcastClient.newHazelcastClient()` only.
`Hazelcast` will find the cache cluster automatically. After that, we can use the cache by using the `Map`
again. If we put or get data from the Map, the `Hazelcast` client connects the cluster to access data.

**Now we can deploy and scale the application and the cache cluster independently.** We can have for example 50
instances of the application and 5 members of the cache cluster. This the biggest advantage of this topology.

If we have some problems with the cluster, it is easier to identify and to fix this issue, since the
clients and the cache are separated and not mixed.

This approach has drawbacks. First, whenever we write or read the data from the cluster we need
net communication. It can take longer than in the approach with the embedded cache. 
This difference is especially significant by reading access. Second, we have to take care of the
version compatibility between the cluster members and the clients. 

**The client-server topology should be used, when the deployment of the application is bigger than
the cluster cache.**

Since we have in the application the clients of the cluster only, we have to find the way to test it.
It can be done very easily by using [Tescontainers](/spring-boot-flyway-testcontainers/).

## Conclusion
`Hazelcast` java library supports the setting up the cache cluster with two topologies.
Embedded cache topology supports very fast reading for high performing computing. The client-server topology supports very gut independent scaling of the application and cache
cluster. It is very easy to integrate the cluster or write a client for
the cluster in a Spring application.

 



