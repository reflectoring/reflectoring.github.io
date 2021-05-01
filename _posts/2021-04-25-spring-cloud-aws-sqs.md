---
title: "Working with AWS SQS and Spring Cloud"
categories: [craft]
date: 2021-04-25 06:00:00 +1000
modified: 2021-04-25 06:00:00 +1000
author: pratikdas
excerpt: "AWS SQS is one of the important services in AWS Cloud. Spring Cloud provides convenient methods to make it easy to integrate applications with the SQS service. In this article, we will look at using Spring Cloud for working with Amazon Simple Queue Service (SQS) with the help of some basic concepts and code examples"
image:
  auto: 0074-stack
---
Spring Cloud is a suite of projects containing many of the services required to make an application cloud-native by conforming to the [12-Factor](https://12factor.net/) principles. [Spring Cloud for Amazon Web Services(AWS)\(https://spring.io/projects/spring-cloud-aws) is a sub-project of [Spring Cloud](https://spring.io/projects/spring-cloud) which makes it easy to integrate with AWS services using Spring idioms and APIs familiar to Spring developers.

In this article, we will look at using Spring Cloud AWS for interacting with AWS [Simple Queue Service (SQS)](https://aws.amazon.com/sqs/) with the help of some basic concepts of queue and messaging along with code examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/springcloudsqs" %}

## What is SQS?

Amazon Simple Queue Service (SQS) is a distributed messaging system for point-to-point communication and is offered as a fully managed service in the AWS Cloud. 

It follows the familiar messaging semantics of a producer sending a message to a queue and a consumer reading this message from the queue once the message is available. 

![SQS queue](/assets/img/posts/aws-sqs-spring-cloud/SQS-Queue.png)

This enables decoupling the producer system from the consumer by facilitating asynchronous mode of communication.

The SQS queue used for storing messages is highly-scalable, and reliable with its storage distributed across multiple servers. The SQS queue can be of two types: 
1. **Standard**:  Standard queues have maximum throughput, best-effort ordering, and at-least-once delivery. 
2. **First In First Out(FIFO)**:  FIFO queues guarantee the messages to be processed exactly once by the receiver, in the order that they are sent.

Spring Cloud AWS is built as a collection of modules, with each module being responsible for providing integration with a AWS Service.  

Spring Cloud AWS Messaging is the module that does the integration with AWS SQS to simplify the publication and consumption of messages over SQS using Spring's [Messaging API} (https://docs.spring.io/spring-integration/docs/5.0.5.RELEASE/reference/html/spring-integration-core-messaging.html). 

Amazon SQS allows only payloads of type string, so any object sent to SQS must be transformed into a string representation before being put in the SQS queue. Spring Cloud AWS enables transfering Java objects to SQS by converting them to string in JSON format.

## Introducing the Classes of Interest from the Message API
The important classes used are shown in the class diagram :

![SQS classes](/assets/img/posts/aws-sqs-spring-cloud/SQSClasses.png)
A SQS message is represented by the `Message` interface. 

`QueueMessageChannel` and `QueueMessagingTemplate` are two of the main classes used to send and receive messages. For receiving we have a more convenient method of adding polling behavior to a method by adding a `SQSListener` annotation.

## Configuring Client Configuration
clientConfiguration - The client configuration options control how a client connects to Amazon SQS with attributes like proxy settings, retry counts, etc. We can override the default configuration used by all integrations with ...
We will configure Spring Cloud AWS to use ClientConfiguration by defining a bean of type ClientConfiguration and 

## Setting up the Environment

With this basic understanding, let us work with a few examples by first setting up our environment.

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
```
For adding the support for messaging, we need to include the module dependency for Spring Cloud AWS Messaging into our Maven configuration.  We do this by including the starter `spring-cloud-starter-aws-messaging`. 

Next, we will add the dependency with a starter for the AWS SQS service:

```xml
    <dependency>
      <groupId>io.awspring.cloud</groupId>
      <artifactId>spring-cloud-starter-aws-messaging</artifactId>
    </dependency>

```
`spring-cloud-starter-aws-messaging` includes the transitive dependencies for `spring-cloud-starter-aws`, and `spring-cloud-aws-messaging`.

a name specific to the integration `sqsClientConfiguration`

## Creating the Message
Messages are created using the `MessageBuilder` helper class. The MessageBuilder provides two factory methods for creating Messages from either an existing Message or with a payload Object. When building from an existing Message, the headers and payload of that Message will be copied to the new Message:

```java

    Message<String> msg = MessageBuilder.withPayload(messagePayload)
        .setHeader("sender", "app1")
        .setHeaderIfAbsent("country", "AE")
        .build();

```

## Queue Identifiers
A queue is identified with a URL or physical name. It can also be identified with a logical identifier.
We create a queue with a queue name which is unique for the AWS account and region. Amazon SQS assigns each queue an identifier in the form of a queue URL that includes the queue name and other Amazon SQS components. We provide the queue URL whenever we want to perform any action on a queue,

The name of a FIFO queue must end with the .fifo suffix. The suffix counts towards the 80-character queue name quota. To determine whether a queue is FIFO, you can check whether the queue name ends with the suffix.

Let us create a SQS queue named "testQueue" using the AWs Console as shown here:

![create Queue](/assets/img/posts/aws-sqs-spring-cloud/create-queue.png)


We can see the URL of the queue as `https://sqs.us-east-1.amazonaws.com/<aws account ID>/testQueue`. We will be using either the queue name or queue URL as identifiers of our queue in our examples.

## Sending a Message
We can send messages to an SQS queue using the `QueueMessageChannel` or `QueueMessagingTemplate`.

### Sending with QueueMessageChannel

With the `QueueMessageChannel`, we first create an instance of this class to represent the SQS queue and then call the `send` method for sending the message to the queue:
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
```
In this code snippet, we first create the `QueueMessageChannel` with the queue URL. Then we construct the message to be sent with the `MessageBuilder` class where apart from the payload, we also set two header fields. Finally, we invoke the send method by specifying a timeout interval. The `send` method is a blocking call so it is always advisable to set a timeout when calling this method.

### Sending with QueueMessagingTemplate
The `QueueMessagingTemplate` contains many convenient methods to send a message. The destination can be specified as a `QueueMessageChannel` object created with a queue URL as in previous example or the queue name supplied as a primitive string. 

We create the `QueueMessagingTemplate` bean in our configuration with `AmazonSQSAsync` client, which is available by default in the application context when using Spring Boot starters:
```java
@Bean
public QueueMessagingTemplate queueMessagingTemplate(
  AmazonSQSAsync amazonSQSAsync) {
    return new QueueMessagingTemplate(amazonSQSAsync);
}
```
Then, we can send the messages using the `convertAndSend` method:
```java
@Service
public class MessageSenderWithTemplate {
  private static final String TEST_QUEUE = "testQueue";

  private static final Logger logger = LoggerFactory.getLogger(MessageSenderWithTemplate.class);

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
```
In this example, we first create a message with the `MessageBuilder` class, similar to our previous example and use the `convertAndSend` method to send the message to the queue.

## Receiving a Message

We need to check the SQS queue repeatedly for the availability of messages. Messages can be received in two ways from the SQS queue:
1. using the receive methods of the `QueueMessagingTemplate`
2. with annotation-driven listener endpoints. This is the more convenient way of receiving messages.

 We annotate a method with `SqsListener` annotation for subscribing to a queue. The `SqsListener` annotation adds polling behavior to the method and also provides support for serializing and converting the received message to a Java object as shown here:
 ```java
@Service
public class MessageReceiver {
  private static final Logger logger = LoggerFactory.getLogger(MessageReceiver.class.getName());

  @SqsListener(value = "testQueue", deletionPolicy = SqsMessageDeletionPolicy.ON_SUCCESS)
  public void receiveMessage(String message, 
    @Header("SenderId") String senderId) {
    logger.info("message received {} {}",senderId,message);
  }
}
 ```
In this example, the SQS message payload is serialized and passed to our `receiveMessage` method. We have also defined the deletion policy `ON_SUCCESS` for acknowledging the message when no exception is thrown.

## Working with Object Messages
So far we have used payloads of type `string`. We can also send object payloads by serializing them to a JSON `string`. We do this by using the `MessageConverter` interface which defines a simple contract for conversion between Java objects and SQS messages. The default implementation is `SimpleMessageConverter` which unwraps the message payload if it matches the target type. 

Let us define a model to represent a `signup` event:

```java
@Data
public class SignupEvent {
  
  private String signupTime;
  private String userName;
  private String email;

}
```

Now let us change our `receiveMessage` method to receive the `SignupEvent` :
```java
@Slf4j
@Service
public class MessageReceiver {

  @SqsListener(value = "testQueue", deletionPolicy = SqsMessageDeletionPolicy.ON_SUCCESS)
  public void receiveMessage(final SignupEvent message, 
    @Header("SenderId") String senderId) {
    log.info("message received {} {}",senderId,message);
  }
}
```
Next we will send a JSON message matching the structure of our objects from the SQS console:
![sqs json message](/assets/img/posts/aws-sqs-spring-cloud/messsage-sent.png)

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
```
We can see a `MessageConversionException` here since the default converter `SimpleMessageConverter` can only convert between `string` and SQS messages. For complex objects like `SignupEvent` in our example, a custom converter needs to be configured like this:

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

Here, we have defined a new message converter using our applications' default object mapper and then passed it to an instance of `QueueMessageHandlerFactory`. The  `QueueMessageHandlerFactory` allows Spring to use our custom message converter for deserialising the messages it receives in its listener method. 

Let us send the same JSON message again using the AWS SQS console.

When we run our application after making this change, we get the following output:
```shell
 io.pratik.springcloudsqs.MessageReceiver  : message received {"signupTime":"20/04/2021 11:40 AM", "userName":"jackie","email":"jackie.chan@gmail.com"} SignupEvent(signupTime=20/04/2021 11:40 AM, userName=jackie, email=jackie.chan@gmail.com)

```
From the logs, we can see the JSON message deserialized into `SingupEvent` object in our `receiveMessage` method with the help of the configured custom converter.

## Consuming AWS Event messages
SQS message listeners can also receive events generated by other AWS services. Messages originating from AWS events does not contain the mime-type header. So the Jackson message converter needs to be configured with the `strictContentTypeMatch` property false as shown below: 

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

```
Here we have modified our earlier configuration by setting `strictContentTypeMatch` property in the `MappingJackson2MessageConverter` object to `false`.

Let us add a listener class for receiving the notification messages sent by an AWS S3 bucket when certain configured events occur in the bucket. We can enable certain AWS S3 bucket events to send a notification message to a destination like SQS queue when the events occur. Before running this example, we will create an S3 bucket and attach a notification event as shown below: 

![s3-notification-event](/assets/img/posts/aws-sqs-spring-cloud/s3-notification-event.png)

Here we can see a notification event which will get triggered when an object is uploaded to the S3 bucket. This notification event is configured to send a message to our SQS queue `testQueue`. 

Our class `S3EventListener` containing the listener method which will receive this event from S3 looks like this:
```java

@Slf4j
@Service
public class S3EventListener {
  
  @SqsListener(value = "testQueue", deletionPolicy = SqsMessageDeletionPolicy.ON_SUCCESS)
  public void receive(S3EventNotification s3EventNotificationRecord) {
    S3EventNotification.S3Entity s3Entity = s3EventNotificationRecord.getRecords().get(0).getS3();
    String objectKey = s3Entity.getObject().getKey();
    log.info("objectKey:: {}",objectKey);
  }

}
```
When we upload an object to our S3 bucket, the listener method receives this event payload in the `S3EventNotification` object for further processing. 


## Conclusion

We saw how to use Spring Cloud AWS for the integration of our applications with the AWS SQS service. A summary of the things we covered:
1. Message, QueueMessageTemplate, QueueMessageChannel, MessageBuilder are some of the important classes used.
2. SQS messages are built using MessageBuilder class where we specify the message payload along with message headers and other message attributes.
3. QueueMessageTemplate and QueueMessageChannel are used to send messages.
4. Appplying `SqsListener` annotation to a method enables receiving of SQS messages from a specific SQS queue , sent by other applications.
5. Methods annotated with `SqsListener` can take both `string` and complex objects. For receiving complex objects, we need to configure a custom converter.

I hope this will help you to get started with building applications using AWS SQS.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/springcloudsqs).