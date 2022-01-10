---
title: "Getting Started With AWS SQS and Spring Cloud"
categories: ["Spring Boot"]
date: 2021-05-10T06:00:00
authors: [pratikdas]
excerpt: "Amazon Simple Queue Service (SQS) is one of the important services in AWS Cloud. Spring Cloud provides convenient methods to make it easy to integrate applications with the SQS service. In this article, we will look at using Spring Cloud for working with SQS with the help of some basic concepts and code examples"
image: images/stock/0035-switchboard-1200x628-branded.jpg
---
Spring Cloud is a suite of projects containing many of the services required to make an application cloud-native by conforming to the [12-Factor](/spring-boot-12-factor-app) principles. 

[Spring Cloud for Amazon Web Services(AWS)](https://spring.io/projects/spring-cloud-aws) is a sub-project of [Spring Cloud](https://spring.io/projects/spring-cloud) which makes it easy to integrate with AWS services using Spring idioms and APIs familiar to Spring developers.

In this tutorial, we will look at using Spring Cloud AWS for interacting with [Simple Queue Service (SQS)](https://aws.amazon.com/sqs/) with the help of some basic concepts of queueing and messaging along with code examples.

{{% github "https://github.com/thombergs/code-examples/tree/master/aws/springcloudsqs" %}}

## Check out the Book!

<a href="https://stratospheric.dev"><img src="/assets/img/stratospheric/stratospheric-cover.jpg" alt="Stratospheric - From Zero to Production with Spring Boot and AWS" style="float:left; clear:both; padding-right: 15px; margin-bottom: 30px;"/></a>

If you're interested in learning about building applications with Spring Boot and AWS from top to bottom, make sure to check out ["Stratospheric - From Zero to Production with Spring Boot and AWS"](https://stratospheric.dev)!

## What is SQS?

SQS is a distributed messaging system for point-to-point communication and is offered as a fully managed service in the AWS Cloud. 

It follows the familiar messaging semantics of a producer sending a message to a queue and a consumer reading this message from the queue once the message is available as shown here: 

{{% image alt="SQS queue" src="images/posts/aws-sqs-spring-cloud/SQS-Queue.png" %}}

The producer will continue to function normally even if the consumer application is temporarily not available. **SQS decouples the producer system from the consumer by facilitating asynchronous modes of communication**.

The SQS queue used for storing messages is highly scalable and reliable with its storage distributed across multiple servers. The SQS queue can be of two types: 
1. **Standard**:  Standard queues have maximum throughput, best-effort ordering, and at least once delivery. 
2. **First In First Out (FIFO)**: When a high volume of transactions are received, messages might get delivered more than one once, which might require complex handling of message sequence. For this scenario, we use FIFO queues where the messages are delivered in a "First in first out" manner. The message is delivered only once and is made available only until the consumer processes it. After the message is processed by the consumer, it is deleted - thereby preventing chances of duplicate processing.

## Spring Cloud AWS Messaging

Spring Cloud AWS is built as a collection of modules, with each module being responsible for providing integration with an AWS Service.  

Spring Cloud AWS Messaging is the module that does the integration with AWS SQS to simplify the publication and consumption of messages over SQS. 

Amazon SQS allows only payloads of type string, so any object sent to SQS must be transformed into a string representation before being put in the SQS queue. Spring Cloud AWS enables transferring Java objects to SQS by converting them to string in [JSON](https://www.json.org/json-en.html) format.

## Introducing the Spring Cloud AWS Messaging API
The important classes which play different roles for interaction with AWS SQS are shown in this class diagram :

{{% image alt="SQS classes" src="images/posts/aws-sqs-spring-cloud/SQSClasses.png" %}}

An SQS message is represented by the `Message` interface. 

`QueueMessageChannel` and `QueueMessagingTemplate` are two of the main classes used to send and receive messages. For receiving we have a more convenient method of adding polling behavior to a method by adding an `SQSListener` annotation.

We can override the default configuration used by all integrations with `ClientConfiguration`. The client configuration options control how a client connects to Amazon SQS with attributes like proxy settings, retry counts, etc.

## Setting Up the Environment

With this basic understanding of SQS and the involved classes, let us work with a few examples by first setting up our environment.

Let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.4.5.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=springcloudsqs&name=springcloudsqs&description=Demo%20project%20for%20Spring%20cloud%20sqs&packageName=io.pratik.springcloudsqs&dependencies=web,lombok), and then open the project in our favorite IDE.


For configuring Spring Cloud AWS, let us add a separate Spring Cloud AWS BOM in our `pom.xml` file using this `dependencyManagement` block :

```xml
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>io.awspring.cloud</groupId>
        <artifactId>spring-cloud-aws-dependencies</artifactId>
        <version>2.3.0</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
```text
For adding the support for messaging, we need to include the module dependency for Spring Cloud AWS Messaging into our Maven configuration.  We do this by adding the starter module`spring-cloud-starter-aws-messaging`:

```xml
    <dependency>
      <groupId>io.awspring.cloud</groupId>
      <artifactId>spring-cloud-starter-aws-messaging</artifactId>
    </dependency>
```text
`spring-cloud-starter-aws-messaging` includes the transitive dependencies for `spring-cloud-starter-aws`, and `spring-cloud-aws-messaging`.

## Creating a Message
Messages are created using the `MessageBuilder` helper class. The MessageBuilder provides two factory methods for creating messages from either an existing message or with a payload Object:

```java
@Service
public class MessageSenderWithTemplate {
...
...
  
  public void send(final String messagePayload) {
      
    Message<String> msg = MessageBuilder.withPayload(messagePayload)
      .setHeader("sender", "app1")
      .setHeaderIfAbsent("country", "AE")
      .build();

    ...
  }
}
```text
Here we are using the `MessageBuilder` class to construct the message with a string payload and two headers inside the `send` method.

## Queue Identifiers
A queue is identified with a URL or physical name. It can also be identified with a logical identifier. 

We create a queue with a queue name that is unique for the AWS account and region. Amazon SQS assigns each queue an identifier in the form of a queue URL that includes the queue name and other Amazon SQS components. 

{{% image alt="SQS classes" src="images/posts/aws-sqs-spring-cloud/queue-id.png" %}}

We provide the queue URL whenever we want to perform any action on a queue.

Let us create an SQS queue named "testQueue" using the AWS Console as shown here:

{{% image alt="create Queue" src="images/posts/aws-sqs-spring-cloud/create-queue.png" %}}


We can see the URL of the queue as `https://sqs.us-east-1.amazonaws.com/<aws account ID>/testQueue`. We will be using either the queue name or queue URL as identifiers of our queue in our examples.

## Sending a Message
We can send messages to an SQS queue using the `QueueMessageChannel` or `QueueMessagingTemplate`.

### Sending with `QueueMessageChannel`

With the `QueueMessageChannel`, we first create an instance of this class to represent the SQS queue and then call the `send()` method for sending the message to the queue:
```java
@Service
public class MessageSender {
  private static final Logger logger = LoggerFactory.getLogger(MessageSender.class);

  // Replace XXXXX with AWS account ID.
  private static final String QUEUE_NAME = "https://sqs.us-east-1.amazonaws.com/XXXXXXX/testQueue";

  @Autowired
  private final AmazonSQSAsync amazonSqs;

  @Autowired
  public MessageSender(final AmazonSQSAsync amazonSQSAsync) {
    this.amazonSqs = amazonSQSAsync;
  }

  public boolean send(final String messagePayload) {
    MessageChannel messageChannel = new QueueMessageChannel(amazonSqs, QUEUE_NAME);

    Message<String> msg = MessageBuilder.withPayload(messagePayload)
        .setHeader("sender", "app1")
        .setHeaderIfAbsent("country", "AE")
        .build();

    long waitTimeoutMillis = 5000;
    boolean sentStatus = messageChannel.send(msg,waitTimeoutMillis);
    logger.info("message sent");
    return sentStatus;
  }

}
```text
In this code snippet, we first create the `QueueMessageChannel` with the queue URL. Then we construct the message to be sent with the `MessageBuilder` class. 

Finally, we invoke the `send()` method on the `MessageChannel` by specifying a timeout interval. The `send()` method is a blocking call so it is always advisable to set a timeout when calling this method.

### Sending with `QueueMessagingTemplate`
The `QueueMessagingTemplate` contains many convenient methods to send a message. The destination can be specified as a `QueueMessageChannel` object created with a queue URL as in the previous example or the queue name supplied as a primitive string. 

We create the `QueueMessagingTemplate` bean in our configuration with an `AmazonSQSAsync` client, which is available by default in the application context when using the Spring Cloud AWS Messaging Spring Boot starter:
```java
@Bean
public QueueMessagingTemplate queueMessagingTemplate(
  AmazonSQSAsync amazonSQSAsync) {
    return new QueueMessagingTemplate(amazonSQSAsync);
}
```text
Then, we can send the messages using the `convertAndSend()` method:
```java
@Slf4j
@Service
public class MessageSenderWithTemplate {
  private static final String TEST_QUEUE = "testQueue";

  @Autowired
  private QueueMessagingTemplate messagingTemplate;
  
    public void send(final String queueName,final String messagePayload) {
      
    Message<String> msg = MessageBuilder.withPayload(messagePayload)
        .setHeader("sender", "app1")
        .setHeaderIfAbsent("country", "AE")
        .build();
    
        messagingTemplate.convertAndSend(TEST_QUEUE, msg);
    }
}
```text
In this example, we first create a message with the `MessageBuilder` class, similar to our previous example, and use the `convertAndSend()` method to send the message to the queue.

### Sending a Message to a FIFO Queue
For sending a message to a FIFO Queue, we need to add two fields: `messageGroupId` and `messageDeduplicationId` in the header like in the example below:

```java
@Slf4j
@Service
public class MessageSenderWithTemplate {
    private static final String TEST_QUEUE = "testQueue";

    @Autowired
    private QueueMessagingTemplate messagingTemplate;
  
    public void sendToFifoQueue(final String messagePayload, final String messageGroupID, final String messageDedupID) {
      
          Message<String> msg = MessageBuilder.withPayload(messagePayload)
              .setHeader("message-group-id", messageGroupID)
              .setHeader("message-deduplication-id", messageDedupID)
              .build();
              messagingTemplate.convertAndSend(TEST_QUEUE, msg);
              log.info("message sent");
    }  
}

```text
Here we are using the `MessageBuilder` class to add the two header fields required for creating a message for sending to a FIFO queue.

## Receiving a Message

Let us now look at how we can receive messages from an SQS queue. To receive a message, the client has to call the SQS API to check for new messages (i.e the messages are not pushed from the server to client).There are two ways to poll for new messages from SQS:
1. **Short Polling**: Short polling returns immediately, even if the message queue being polled is empty. For short polling, we call the `receive()` method of `QueueMessagingTemplate` in an infinite loop that regularly polls the queue. The `receive()` method returns empty if there are no messages in the queue.
2. **Long Polling**: long-polling does not return a response until a message arrives in the message queue, or the long poll times out. We do this with the `@SQSListener` annotation.

In most cases, Amazon SQS long polling is preferable to short polling since long polling requests let the queue consumers receive messages as soon as they arrive in the queue while reducing the number of empty responses returned (and thus the costs of SQS, since they are calculated by API calls).

We annotate a method with the `@SqsListener` annotation for subscribing to a queue. The `@SqsListener` annotation adds polling behavior to the method and also provides support for serializing and converting the received message to a Java object as shown here:
 ```java
@Slf4j
@Service
public class MessageReceiver {

  @SqsListener(value = "testQueue", deletionPolicy = SqsMessageDeletionPolicy.ON_SUCCESS)
  public void receiveMessage(String message, 
    @Header("SenderId") String senderId) {
    logger.info("message received {} {}",senderId,message);
  }
}
 ```text
In this example, the SQS message payload is serialized and passed to our `receiveMessage()` method. We have also defined the deletion policy `ON_SUCCESS` for acknowledging (deleting) the message when no exception is thrown. A deletion policy is used to define in which cases a message must be deleted after the listener method is called. For an overview of the available deletion policies, refer to the Java documentation of [SqsMessageDeletionPolicy](https://javadoc.io/doc/org.springframework.cloud/spring-cloud-aws-messaging/2.1.3.RELEASE/org/springframework/cloud/aws/messaging/listener/SqsMessageDeletionPolicy.html).

## Working With Object Messages
So far we have used payloads of type `String`. We can also send object payloads by serializing them to a JSON `string`. We do this by using the `MessageConverter` interface which defines a simple contract for conversion between Java objects and SQS messages. The default implementation is `SimpleMessageConverter` which unwraps the message payload if it matches the target type. 

Let us define another SQS queue named `testObjectQueue` and define a model to represent a `signup` event:

```java
@Data
public class SignupEvent {
  
  private String signupTime;
  private String userName;
  private String email;

}
```

Now let us change our `receiveMessage()` method to receive the `SignupEvent` :
```java
@Slf4j
@Service
public class MessageReceiver {

  @SqsListener(value = "testObjectQueue", deletionPolicy = SqsMessageDeletionPolicy.ON_SUCCESS)
  public void receiveMessage(final SignupEvent message, 
    @Header("SenderId") String senderId) {
    log.info("message received {} {}",senderId,message);
  }
}
```text
Next, we will send a JSON message matching the structure of our objects from the SQS console:
{{% image alt="sqs json message" src="images/posts/aws-sqs-spring-cloud/messsage-sent.png" %}}

If we run our Spring Boot application, we will get an exception of the following form in the log: 

```shell
.. i.a.c.m.listener.QueueMessageHandler     : An exception occurred while invoking the handler method

org.springframework.messaging.converter.MessageConversionException: /
Cannot convert from [java.lang.String] to [io.pratik.springcloudsqs.models.SignupEvent] /
for GenericMessage /
[payload={"signupTime":"20/04/2021 11:40 AM", "userName":"jackie",/
"email":"jackie.chan@gmail.com"}, headers={
  ...
  ...
```text
We can see a `MessageConversionException` here since the default converter `SimpleMessageConverter` can only convert between `String` and SQS messages. For complex objects like `SignupEvent` in our example, a custom converter needs to be configured like this:

```java
@Configuration
public class CustomSqsConfiguration {

  
  @Bean
  public QueueMessagingTemplate queueMessagingTemplate(
    AmazonSQSAsync amazonSQSAsync) {
      return new QueueMessagingTemplate(amazonSQSAsync);
  }
  
  @Bean
  public QueueMessageHandlerFactory queueMessageHandlerFactory(
    final ObjectMapper mapper, final AmazonSQSAsync amazonSQSAsync){

        final QueueMessageHandlerFactory queueHandlerFactory = 
                                   new QueueMessageHandlerFactory();
        queueHandlerFactory.setAmazonSqs(amazonSQSAsync);
        queueHandlerFactory.setArgumentResolvers(Collections.singletonList(
                new PayloadMethodArgumentResolver(jackson2MessageConverter(mapper))
        ));
        return queueHandlerFactory;
  }

  private MessageConverter jackson2MessageConverter(final ObjectMapper mapper){
  
        final MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(mapper);
        return converter;
  }
}

```

Here, we have defined a new message converter using our applications' default object mapper and then passed it to an instance of `QueueMessageHandlerFactory`. The  `QueueMessageHandlerFactory` allows Spring to use our custom message converter for deserializing the messages it receives in its listener method. 

Let us send the same JSON message again using the AWS SQS console.

When we run our application after making this change, we get the following output:
```shell
 io.pratik.springcloudsqs.MessageReceiver  : message received {"signupTime":"20/04/2021 11:40 AM", "userName":"jackie","email":"jackie.chan@gmail.com"} SignupEvent(signupTime=20/04/2021 11:40 AM, userName=jackie, email=jackie.chan@gmail.com)

```text
From the logs, we can see the JSON message deserialized into `SingupEvent` object in our `receiveMessage()` method with the help of the configured custom converter.

## Consuming AWS Event Messages
SQS message listeners can also receive events generated by other AWS services or microservices. Messages originating from AWS events do not contain the mime-type header, which is expected by our message converter by default.

To make the message conversion more robust in this case, the Jackson message converter needs to be configured with the `strictContentTypeMatch` property set to `false` as shown below: 

```java

@Configuration
public class CustomSqsConfiguration {
...
...

  private MessageConverter jackson2MessageConverter(final ObjectMapper mapper) {

    final MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();

    // set strict content type match to false to enable the listener to handle AWS events
    converter.setStrictContentTypeMatch(false);
    converter.setObjectMapper(mapper);
    return converter;
  }
}

```text
Here we have modified our earlier configuration by setting `strictContentTypeMatch` property in the `MappingJackson2MessageConverter` object to `false`.

Let us add a listener class for receiving the notification messages sent by an AWS S3 bucket when certain configured events occur in the bucket. We can enable certain AWS S3 bucket events to send a notification message to a destination like the SQS queue when the events occur. Before running this example, we will create an SQS queue and S3 bucket and attach a notification event as shown below: 

{{% image alt="s3-notification-event" src="images/posts/aws-sqs-spring-cloud/s3-notification-event.png" %}}

Here we can see a notification event that will get triggered when an object is uploaded to the S3 bucket. This notification event is configured to send a message to our SQS queue `testS3Queue`. 

Our class `S3EventListener` containing the listener method which will receive this event from S3 looks like this:
```java

@Slf4j
@Service
public class S3EventListener {
  
  @SqsListener(value = "testS3Queue", deletionPolicy = SqsMessageDeletionPolicy.ON_SUCCESS)
  public void receive(S3EventNotification s3EventNotificationRecord) {
    S3EventNotification.S3Entity s3Entity = s3EventNotificationRecord.getRecords().get(0).getS3();
    String objectKey = s3Entity.getObject().getKey();
    log.info("objectKey:: {}",objectKey);
  }

}
```text
When we upload an object to our S3 bucket, the listener method receives this event payload in the `S3EventNotification` object for further processing. 


## Conclusion

We saw how to use Spring Cloud AWS for the integration of our applications with the AWS SQS service. A summary of the things we covered:
1. `Message`, `QueueMessageTemplate`, `QueueMessageChannel`, `MessageBuilder` are some of the important classes used.
2. SQS messages are built using `MessageBuilder` class where we specify the message payload along with message headers and other message attributes.
3. `QueueMessageTemplate` and `QueueMessageChannel` are used to send messages.
4. Applying the `@SqsListener` annotation to a method enables receiving of SQS messages from a specific SQS queue, sent by other applications.
5. Methods annotated with `@SqsListener` can take both `string` and complex objects. For receiving complex objects, we need to configure a custom converter.

I hope this will help you to get started with building applications using AWS SQS.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/springcloudsqs).

## Check out the Book!

<a href="https://stratospheric.dev"><img src="/assets/img/stratospheric/stratospheric-cover.jpg" alt="Stratospheric - From Zero to Production with Spring Boot and AWS" style="float:left; clear:both; padding-right: 15px; margin-bottom: 30px;"/></a>

If you're interested in learning about building applications with Spring Boot and AWS from top to bottom, make sure to check out ["Stratospheric - From Zero to Production with Spring Boot and AWS"](https://stratospheric.dev)!
