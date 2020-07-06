---
title: Connect to Kafka with Spring Kafka
categories: [spring-boot]
date: 2020-06-28 05:00:00 +1100
modified: 2020-06-28 05:00:00 +1100
author: nandan
excerpt: 'Kafka mainly aims to solve low-latency ingestion of large amounts of event data. We can use Kafka when we have to move a large amount of data, process data in real-time.'
image:
  auto: 0065-java
---

In this article we'll look at how to integrate Spring Boot application with Apache Kafka and start sending and consuimg records from our application. We'll be going through each section with code examples.

## Why Kafka?

Traditional messaging queues like ActiveMQ, RabbitMQ can handle high throughput usually used for long-running or background jobs and communicating between services. Kafka is a stream-processing platform built by LinkedIn and currently developed by Apache Software Foundation. Kafka mainly aims to solve low-latency ingestion of large amounts of event data.

We can use Kafka when we have to move a large amount of data, process data in real-time. An example would be when we want to track user behavior on our website and give suggestions accordingly or monitor events produced by our micro-services. Kafka is built from ground up with horizontal scaling in mind. We easily can scale by adding more brokers to the existing Kafka cluster. While RabbitMQ is mostly designed for vertical scaling. i.e, We can scale by adding more power.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-events" %}

## Kafka Vocabulary

Lets look at the key terminologies of Kafka,

- **Producer**: Producer is a client that sends records to the Kafka server to the specified topic.
- **Consumer**: Consumers are the recipients who receive records from the Kafka server.
- **Broker**: Brokers can create a Kafka cluster by sharing information using Zookeeper. The broker receives records from producers and consumers fetch records from the broker by the topic, partition, and offset.
- **Cluster**: Kafka is a distributed system. A Kafka cluster contains multiple brokers sharing the workload.
- **Topic**: Topic is a category name to which records are published and consumers read from topics.
- **Partition**: Records published to a topic are spread across Kafka cluster into several partitions. Each partition can be associated with a broker to allow consumers to read from a topic in parallel.
- **Offset**: Offset is a pointer to the last record that Kafka has already sent to a consumer.

## Configuring a Kafka Client

We should have a Kafka server running on our machine. If you don't have Kafka setup on your system, take a look at [Kafka quickstart guide](https://kafka.apache.org/quickstart). Once we have Kafka server up and running, Kafka client can be easily configured with Spring configuration in java or even quicker with Spring Boot. Let us start by adding spring-kafka dependency to our pom.xml

```
<dependency>
  <groupId>org.springframework.kafka</groupId>
  <artifactId>spring-kafka</artifactId>
  <version>2.5.2.RELEASE</version>
</dependency>
```

### Using Java Configuration

Lets us now see how to configure Kafka client using Java Configuration for Spring. For better understanding we have separated `KafkaProducerConfig` and `KafkaConsumerConfig`.

Let's have a look at producer config first:

```java
@Configuration
class KafkaProducerConfig {

    @Value("${io.reflectoring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public Map<String, Object> producerConfigs() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        return props;
    }

    @Bean
    public ProducerFactory<String, String> producerFactory() {
        return new DefaultKafkaProducerFactory<>(producerConfigs());
    }

    @Bean
    public KafkaTemplate<String, String> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
```

The above example shows how to configure the Kafka producer to send records. `ProducerFactory` is responsible for creating Kafka Producer instances. `KafkaTemplate` helps us to send records to their respective topic and also it gives a template for executing high-level operations. We'll see more about `KafkaTemplate` in [Sending Records](#sending-records) section.

In producerConfigs() we are configuring,

- `BOOTSTRAP_SERVERS_CONFIG` - Host and port on which Kafka is running.
- `KEY_SERIALIZER_CLASS_CONFIG` - Serializer class to be used for the key.
- `VALUE_SERIALIZER_CLASS_CONFIG` - Serializer class to be used for the value. We are using StringSerializer for both keys and values.

Now that we have our producer config ready. Let's create configuration for consumer:

```java
@Configuration
class KafkaConsumerConfig {

    @Value("${io.reflectoring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public Map<String, Object> consumerConfigs() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        return props;
    }

    @Bean
    public ConsumerFactory<String, String> consumerFactory() {
        return new DefaultKafkaConsumerFactory<>(consumerConfigs());
    }

    @Bean
    public KafkaListenerContainerFactory<ConcurrentMessageListenerContainer<String, String>> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }
}
```

In the above example, we use `ConcurrentKafkaListenerContainerFactory` to create containers for methods annotated with `@KafkaListener`. The `KafkaListenerContainer` receives all the records from all topics or partitions on a single thread. We'll see more about message listener containers in the [consuming records](#consuming-records) section.

### Using Spring Boot Auto Configuration

Spring Boot does most of the configuration automatically, so we can focus on building the listeners and producing the messages. It also provides the option to override the default configs through `application.properties`.

## Creating Kafka Topics

Let`s now have a look at how we can create Kafka topics:

```java
@Configuration
class KafkaTopicConfig {

  @Bean
  public NewTopic topic1() {
    return TopicBuilder.name("reflectoring-1").build();
  }

  @Bean
  public NewTopic topic2() {
    return TopicBuilder.name("reflectoring-2").build();
  }
  ...
}
```

KafkaAdmin bean is responsible for creating new topics in our broker. **With Spring Boot KafkaAdmin bean is automatically registered, so no need to register explicitly.**

We can add a `NewTopic` `@Bean` for each topic to the application context. We can make use of `TopicBuilder` to create these beans. KafkaAdmin also increases the number of partitions if it is found that an existing topic has fewer partitions than `NewTopic.numPartitions`.
For our example we'll be creating 5 topics '`reflectoring-1`', '`reflectoring-2`', '`reflectoring-3`', '`reflectoring-user`' and '`reflectoring-others`' as shown above.

## Sending Records

### Using Kafka Template

As said earlier while explaining [producer config](#using-java-configuration), `KafkaTemplate` provides convenient methods to send records to topics.

```java
@Component
class KafkaSenderExample {
  ...

  @Autowired
  private KafkaTemplate<String, String> kafkaTemplate;

  void sendMessage(String msg) {
    kafkaTemplate.send(topic1, msg);
  }
  ...
}
```

The above example shows how we can send records with `KafkaTemplate`.
Producer instances are thread-safe, having a single instance of producer throughout the application context will give higher performance since they are thread-safe.

Spring Kafka also allows us to configure async callback. Let's now see how we can achieve this:

```java
@Component
class KafkaSenderExample {
    ...
  void sendMessageWithCallback(String message) {
    ListenableFuture<SendResult<String, String>> future = kafkaTemplate.send(topic1, message);

    future.addCallback(new ListenableFutureCallback<SendResult<String, String>>()
    {
      @Override
      public void onSuccess(SendResult<String, String> result) {
        LOG.info("Message [{}] delivered with offset -{}", message, result.getRecordMetadata().offset());
      }

      @Override
      public void onFailure(Throwable ex) {
        LOG.warn("Unable to deliver message [{}]. {}", message, ex.getMessage());
      }
    });
  }
}
```

We can get an asynchronous callback with help of ProducerListener (`onSuccess` or `onError`) instead of waiting for the `Future` as shown in the above example. Send methods of `KafkaTemplate` returns a `ListenableFuture<SendResult>` we can register a callback with the listener to receive the result of the send.

### Using `RoutingKafkaTemplate`

We can use `RoutingKafkaTemplate` when we have multiple producers with different configuration and we want to select producer at runtime based on the topic name.

```java
@Configuration
class KafkaProducerConfig {
  ...

  @Bean
  public RoutingKafkaTemplate routingTemplate(GenericApplicationContext context) {
    Map<String, Object> props = new HashMap<>();
    props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
    props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, ByteArraySerializer.class);
    DefaultKafkaProducerFactory<Object, Object> bytesPF = new DefaultKafkaProducerFactory<>(props);
    context.registerBean(DefaultKafkaProducerFactory.class, "bytesPF", bytesPF);
    Map<Pattern, ProducerFactory<Object, Object>> map = new LinkedHashMap<>();
    map.put(Pattern.compile(".*-bytes"), bytesPF);
    return new RoutingKafkaTemplate(map);
  }

  ...
}
```

As shown in the above example, `RoutingKafkaTemplate` takes a map of `java.util.regex.Pattern` and `ProducerFactory<Object, Object>` instances and it is traversed in order, so it is advised to add specific patterns at the beginning.

We have created a pattern `.*-bytes` so that the topic names ending with '`-bytes`' will use `ByteArraySerializer` when we use `RoutingKafkaTemplate` instance.

The latest version supports `DelegatingSerializer` and `DelegatingDeserializer`, which allow producing and consuming records with different key or value types. We can achieve this by setting `DelegatingSerializer.VALUE_SERIALIZATION_SELECTOR` and `DelegatingSerializer.KEY_SERIALIZATION_SELECTOR` to Producers config.

## Consuming Records

### Message Listener

As said earlier, `KafkaMessageListenerContainer` receives all records from all topics on a single thread. The `ConcurrentMessageListenerContainer` assigns these records to multiple `KafkaMessageListenerContainer` instances to provide the multi-threaded capability. It also has a concurrency property (`setConcurrency`) which helps to instantiate multiple `KafkaMessageListenerContainer` instances. Let's now look at how to create listeners:

### Using `@KafkaListener` Annotation

`@KafkaListener` annotation allows us to create listeners effortlessly as shown below.

```java
@Component
class KafkaListenersExample {

    Logger LOG = LoggerFactory.getLogger(KafkaListenersExample.class);

    @KafkaListener(topics = "reflectoring-1")
    void listener(String data) {
        LOG.info(data);
    }

    @KafkaListener(topics = "reflectoring-1, reflectoring-2", groupId = "reflectoring-group-2")
    void commonListenerForMultipleTopics(String message) {
    	LOG.info("MultipleTopicListener - {}", message);
    }
}
```

To use this annotation we should add `@EnableKafka` annotation on one of our `@Configuration` class and it requires a listener container factory, which we have configured in `KafkaConsumerConfig.java`.
We can create a listener bean by annotating a method with `@KafkaListener` annotation and the created bean will be wrapped in `MessagingMessageListenerAdapter`. We can also specify multiple topics for a single listener using topics attribute as shown above.

### Using `@KafkaHandler` for Class Level

```java
@Component
@KafkaListener(id = "class-level", topics = "reflectoring-3")
class KafkaClassListener {
  ...

  @KafkaHandler
  void listen(String message) {
    LOG.info("KafkaHandler[String] {}", message);
  }

  @KafkaHandler(isDefault = true)
  void listenDefault(Object object) {
    LOG.info("KafkaHandler[Default] {}", object);
  }
}
```

As shown in the above example, we can create listeners at class-level with `@KafkaListener` annotation and we should specify `@KafkaHandler` at the method level. When the listener receive records, converted record types are used to determine which `KafkaHandler` must to used. We can assign at most one `KafkaHandler` as default using attribute `isDefault=true`, whenever there is no match default handler will be called.

### Consuming Records from the Specific Partition with an Initial Offset

```java
@Component
class KafkaListenersExample {
...

    @KafkaListener(topicPartitions = @TopicPartition(topic = "reflectoring-1", partitionOffsets = {
    		@PartitionOffset(partition = "0", initialOffset = "0") }), groupId = "reflectoring-group-3")
    void listenToParition(@Payload String message,
            @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition,
    		@Header(KafkaHeaders.OFFSET) int offset) {
    	LOG.info("Received message [{}] from partition-{} with offset-{}", message, partition, offset);
    }
}
```

We can configure listeners created to listen to multiple topics, partitions, and initial offset optionally as shown in the above example. Since we have specified `initialOffset = "0"` in `listenToParitionWithOffset` listener, we will receive all the records starting from offset-0 every time we restart the application.
We can also retrieve the useful metadata about the consumed record using `@Header()` annotation as shown in the above example.

### Adding Filters to Listeners

Spring provides a strategy to filter messages before reaching to our listeners.

```java
class KafkaConsumerConfig {

    @Bean
    KafkaListenerContainerFactory<ConcurrentMessageListenerContainer<String, String>>
    kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());

        factory.setRecordFilterStrategy(record -> record.value().contains("ignored"));
        return factory;
    }
}
```

Spring wraps the listener with `FilteringMessageListenerAdapter`. It takes an implementation of `RecordFilterStrategy` in which we implement the filter method and the records which won't match get discarded before reaching the listener.

In the above example, we have added a filter to discard the records which contain the word "ignored".

### Reply using `@SendTo`

Spring allows to send method's return value to specified destination with `@SendTo`.

```java
@KafkaListener(topics = "reflectoring-others")
@SendTo("reflectoring-1")
String listenAndReply(String message) {

  LOG.info("ListenAndReply [{}]", message);
  return "This is a reply sent after receiving message";
}
```

SpringBoot default factory configuration gives the SendTo template. Since we are overriding the factory configuration in our code example, the listener container factory must be provided with a `KafkaTemplate` by using `setReplyTemplate` which is used to send the reply. In the above example, we are forwarding the reply message to the topic "reflectoring-1".

## Custom Records

Let's now look at how to send/receive a Java Object as a JSON byte[].

```java
class User {
    private String name;
  ...
}
```

We'll be sending and receiving the above `User` class in our example.

### Using JSON Serializer & Deserializer

To achieve this, we must configuring our producer and consumer to use JSON serializer & deserializer.

```java
@Configuration
class KafkaProducerConfig {
    ...

    @Bean
    public ProducerFactory<String, User> userProducerFactory() {
        ...
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public KafkaTemplate<String, User> userKafkaTemplate() {
        return new KafkaTemplate<>(userProducerFactory());
    }
}
```

```java
@Configuration
class KafkaConsumerConfig {
    ...
    public ConsumerFactory<String, User> userConsumerFactory() {
        ...
        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), new JsonDeserializer<>(User.class));
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, User> userKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, User> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(userConsumerFactory());
        return factory;
    }
    ...
}
```

Spring Kafka provides `JsonSerializer` and `JsonDeserializer` implementations that are based on the Jackson JSON object mapper. It allows us to convert any Java Object to `bytes[]`.

In the above example, we are creating one more `ConcurrentKafkaListenerContainerFactory` for JsonSerialization. In this, we have configured `JsonSerializer.class` as our value serializer in Producer config and `JsonDeserializer<>(User.class)` as out value deserializer in consumer config. For this, we are creating separate Kafka listener container `userKafkaListenerContainerFactory`. If we have multiple Java object types to be serialized/deserialized, we have to create a listener container for each type as shown above.

Now that we have configured our serializer & deserializer, we can send User object using `KafkaTemplate`.

```java
@Component
class KafkaSenderExample {
  ...

  @Autowired
  private KafkaTemplate<String, User> userKafkaTemplate;

  void sendCustomMessage(User user, String topicName) {
    userKafkaTemplate.send(topicName, user);
  }
  ...
}
```

As shown above, we can create `KafkaTemplate` for the specific type and send user records to designated topics.

```java
@Component
class KafkaListenersExample {

  @KafkaListener(topics = "reflectoring-user", groupId="reflectoring-user", containerFactory="userKafkaListenerContainerFactory")
  void listener(User user) {
    LOG.info("CustomUserListener [{}]", user);
  }
}
```

Since we have multiple listener containers, we are specifying which container factory (`containerFactory="userKafkaListenerContainerFactory"`) to be used while consuming records.

If we don't specify this attribute it defaults to `kafkaListernerContainerFactory` which uses `StringSerializer` and `StringDeserializer` in our case.

### Using Spring Messaging Message Conversion

```java
@Configuration
class KafkaProducerConfig {
  ...

  @Bean
  KafkaTemplate<String, String> kafkaTemplate() {
    ...
    kafkaTemplate.setMessageConverter(new StringJsonMessageConverter());
    kafkaTemplate.setDefaultTopic("reflectoring-user");
    return kafkaTemplate;
  }
  ...
}
```

Spring Kafka provides `MessageConverter` abstractions with `JsonMessageConverter`. We can inject `MessageConverter` into our `KafkaTemplate` instance directly. We must configure a message converter that is compatible with the configured Kafka Serializer. We are using `StringJsonMessageConverter` with `StringSerializer`. Also, a default topic must to set, becaause we'll be separating records based on the type of data we are sending.

```java
@Configuration
class KafkaConsumerConfig {
  @Bean
  public ConcurrentKafkaListenerContainerFactory<String, String> kafkaJsonListenerContainerFactory() {
  ...
  factory.setMessageConverter(new StringJsonMessageConverter());
  return factory;
  }
}
```

```java
@Component
class KafkaListenersExample {
  ...

  @KafkaListener(topics = "reflectoring-user", groupId="reflectoring-user-mc", containerFactory="kafkaJsonListenerContainerFactory")
  void listenerWithMessageConverter(User user) {
    LOG.info("MessageConverterUserListener [{}]", user);
  }
}
```

Now in our `KafkaConsumerConfig`, we are creating a new `kafkaJsonListenerContainerFactory` with `StringJsonMessageConverter` set as our `MessageConverter`. We can inject this created listener factory directly to our `@KafkaListener` with `containerFactory="kafkaJsonListenerContainerFactory"` as shown in the above example.

We can create any number of listeners for different types of records, without the need for multiple configurations for each type. When we use a `@KafkaListener`, the parameter type is provided to the method that will assist with the conversion (In our case the User type).

```java
@Component
class KafkaSenderWithMessageConverter {

  @Autowired
  private KafkaTemplate<String,?> kafkaTemplate;

  void sendMessageWithConverter(Message<?> user) {
    kafkaTemplate.send(user);
  }
}
```

Now we have a generic `KafkaTemplate` which can be used to send any type of Java object. We just have to wrap the object to be sent inside Spring's `GenericMessage<>` before sending it as shown below.

```
messageConverterSender.sendMessageWithConverter(new GenericMessage<>(new User("Pikachu")));
```

## Conclusion

In this article, we covered how we can leverage the Spring support for Kafka. Build Kafka based messaging with code-examples that can help to get started quickly.
