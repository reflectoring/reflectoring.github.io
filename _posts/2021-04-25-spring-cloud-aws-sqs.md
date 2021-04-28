---
title: "Working with AWS SQS and Spring Cloud"
categories: [craft]
date: 2021-04-25 06:00:00 +1000
modified: 2021-04-25 06:00:00 +1000
author: pratikdas
excerpt: "Working with AWS SQS and Spring Cloud"
image:
  auto: 0074-stack
---
Spring Cloud is a suite of projects containing many of the services required to make an application cloud-native by conforming to the [12-Factor](https://12factor.net/) principles. Spring Cloud for Amazon Web Services(AWS) is a sub-project of [Spring Cloud](https://spring.io/projects/spring-cloud) built to make it easy to integrate with AWS services.

In this article, we will look at using Spring Cloud AWS for working with Amazon Simple Queue Service (SQS) with the help of some basic concepts and code examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/localstack" %}

## What is SQS?

Amazon Simple Queue Service (SQS) is a distributed messaging system for point-to-point communication and offered as a fully managed service in the AWS Cloud. It follows the familiar message semantics of a producer sending a message to a queue and a consumer reading this message from the queue once the message is available. This enables decoupling the producer system from the consumer by facilitating asynchronous modes of communication.

The SQS queue used for storing messages is highly-scalable, and reliable with its storage distributed across multiple servers. The SQS queue can be of two types: 
1. **Standard**:  Standard queues have maximum throughput, best-effort ordering, and at-least-once delivery. 
2. **First In First Out(FIFO)**:  FIFO queues guarantee that messages are processed exactly once, in the order that they are sent 


Spring Cloud AWS is built as a collection of modules, with each module being responsible for providing integration with a AWS Service.  SQS to simplify the publication and consumption of messages over SQS. 

Spring Cloud AWS Messaging is the module that does the integration with AWS SQS to simplify the publication and consumption of messages over SQS using Spring's [Messaging API} (https://docs.spring.io/spring-integration/docs/5.0.5.RELEASE/reference/html/spring-integration-core-messaging.html). 

Amazon SQS allows only String payloads, so any Object must be transformed into a String representation. Spring Cloud AWS has support to transfer Java objects to Amazon SQS  by converting them to string in JSON format.

## Configuring the Dependencies

As with all Spring project, Spring Initialiser provides an easy method to generate a project. Let us add all the dependencies we are going to need and then open the project in our favorite IDE.


Let us create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.4.5.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=springcloudsqs&name=springcloudsqs&description=Demo%20project%20for%20Spring%20cloud%20sqs&packageName=io.pratik.springcloudsqs&dependencies=web).

For configuring Spring Cloud AWS, let us add a separate Spring Cloud AWS BOM in our `pom.xml` file using this`dependencyManagement` block :

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

## Introducing the Classes of Message API
`QueueMessageChannel` and `QueueMessagingTemplate` are two of the main classes used to send and receive messages. For receiving we have a more convenient method of adding a polling behavior to a method by adding a `SQSListener` annotation.
## Configuring Client Configuration
clientConfiguration - The client configuration options control how a client connects to Amazon SQS with attributes like proxy settings, retry counts, etc. We can override the default configuration used by all integrations with ...
We will configure Spring Cloud AWS to use ClientConfiguration by defining a bean of type ClientConfiguration and a name specific to the integration `sqsClientConfiguration`

## Creating the Message
Messages are created using the `MessageBuilder` helper class. The MessageBuilder provides two factory methods for creating Messages from either an existing Message or with a payload Object. When building from an existing Message, the headers and payload of that Message will be copied to the new Message:

```java

    Message<String> msg = MessageBuilder.withPayload(messagePayload)
        .setHeader("sender", "app1")
        .setHeaderIfAbsent("country", "AE")
        .build();

```

## Queue Identifiers
The queue is identified with a URL or physical name. It can also be identified with a logical identifier.
We create a queue with a queue name which is unique for the AWS account and region. Amazon SQS assigns each queue an identifier in the form of a queue URL that includes the queue name and other Amazon SQS components. We provide the queue URL whenever we want to perform any action on a queue,

The name of a FIFO queue must end with the .fifo suffix. The suffix counts towards the 80-character queue name quota. To determine whether a queue is FIFO, you can check whether the queue name ends with the suffix.

Let us create a SQS queue named "testQueue" using the AWs Console. The URL of the queue is `https://sqs.us-east-1.amazonaws.com/<aws account ID>/testQueue`. We will be using either the queue name or queue URL as identifiers of our queue in our examples.

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
So far we have used payloads of type `string`. We can also send object payloads by serializing them to a JSON `string`. To do this, we use `converters`. Let us define a model to represent a `signup` event. 

```java

```
```shell
2021-04-28 20:33:59.910  INFO 2587 --- [           main] i.p.s.SpringcloudsqsApplicationTests     : Started SpringcloudsqsApplicationTests in 3.651 seconds (JVM running for 4.583)
2021-04-28 20:34:00.179  INFO 2587 --- [enerContainer-2] i.pratik.springcloudsqs.MessageReceiver  : message received {"signupTime":"20/04/2021 11:40 AM", "userName":"jackie","email":"jackie.chan@gmail.com"} SignupEvent(signupTime=20/04/2021 11:40 AM, userName=jackie, email=jackie.chan@gmail.com)

```

In the absence of the converter we will get an exception of the following form:

```shell
2021-04-28 20:38:34.915 ERROR 2609 --- [enerContainer-2] i.a.c.m.listener.QueueMessageHandler     : An exception occurred while invoking the handler method

org.springframework.messaging.converter.MessageConversionException: Cannot convert from [java.lang.String] to [io.pratik.springcloudsqs.models.SignupEvent] for GenericMessage [payload={"signupTime":"20/04/2021 11:40 AM", "userName":"jackie","email":"jackie.chan@gmail.com"}, headers={
  ...
  ...
```
## Consuming AWS Event messages

The AWS SDK for Java also comes with classes for AWS events. This allows us to have type-safe access to the event using the S3EventNotification class.

## Reply
Message listener methods can be annotated with @SendTo to send their return value to another channel. The SendToHandlerMethodReturnValueHandler uses the defined messaging template set on the aws-messaging:annotation-driven-queue-listener element to send the return value. The messaging template must implement the DestinationResolvingMessageSendingOperations interface.

## Conclusion

We saw how to use Spring Cloud AWS for the integration of our application with the AWS SQS service. 

I hope this will help you to feel empowered and have more fun while working with AWS services during development and lead to higher productivity, shorter development cycles, and lower AWS cloud bills.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/sqs).