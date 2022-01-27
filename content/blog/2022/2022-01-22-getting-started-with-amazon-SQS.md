---
authors: [pratikdas]
title: "Getting Started with AWS SQS"
categories: ["aws"]
date: 2022-01-20T00:00:00
excerpt: "Amazon Simple Queue Service (SQS) is a fully managed message queuing service. We can send, store, and receive messages at any volume, without losing messages or requiring other systems to be available. In this article, we will introduce Amazon SQS, understand its core concepts and work through some examples."
image: images/stock/0115-2021-1200x628-branded.jpg
url: getting-started-with-aws-sqs
---

Amazon Simple Queue Service (SQS) is a fully managed message queuing service that enables decoupling and communication between the components of a distributed system. We can send, store, and receive messages at any volume, without losing messages or requiring other systems to be available. 

Being fully managed, Amazon SQS also eliminates the additional overhead associated with managing and operating message-oriented middleware thereby empowering developers to focus on application development instead of managing infrastructure. 

In this article, we will introduce Amazon SQS, understand its core concepts of the queue and sending and receiving messages and work through some examples.

{{% github "https://github.com/thombergs/code-examples/tree/master/aws/sqs" %}}

## What is Message Queueing

Message Queueing is an asynchronous style of communication between two or more processes.

Messages and queues are the basic components of a message queuing system.

Programs communicate with each other by sending data in the form of messages which are placed in a storage called queue, instead of calling each other directly. The receiver programs retrieve the message from the queue and does the processing without any knowledge of the producer programs.

This allows the communicating programs to run independently of each other, at different speeds and times, in different processes, and without having a direct connection between them.


## Core Concepts of Amazon SQS
The Amazon Simple Queue Service (SQS) is a fully managed distributed Message Queueing System. The queue provided by the SQS service redundantly stores the messages across multiple Amazon SQS servers. Let us look at some of its core concepts:

### Standard Queues vs FIFO Queues

Amazon SQS provides two types of message queues:

**Standard queues**: They offer maximum throughput, best-effort ordering, and at-least-once delivery. The standard queue is the default queue type in SQS.  

**FIFO queues**: FIFO (First-In-First-Out) queues are used for messaging when the order of operations and events exchanged between applications is important, or in situations where we want to avoid processing duplicate messages. FIFO queues guarantee that messages are processed exactly once, in the exact order that they are sent.

### Ordering and Deduplication (Exactly-Once Delivery) in FIFO Queues

A FIFO queue preserves the order in which messages are sent and received and a message is delivered exactly once.

The messages are ordered based on message group ID. If multiple hosts send messages with the same message group ID to a FIFO queue, Amazon SQS stores the messages in the order in which they arrive for processing. 

To make sure that Amazon SQS preserves the order in which messages are sent and received, each producer should use a unique message group ID to send all its messages.

Messages that belong to the same message group are always processed one by one, in a strict order relative to the message group.

FIFO queues also help us to avoid sending duplicate messages to a queue. If we send the same message within the 5-minute deduplication interval, it is not added to the queue. We can configure deduplication in two ways:

- **Enabling Content-Based Deduplication**: When this property is enabled for a queue, Amazon SQS uses a SHA-256 hash to generate the message deduplication ID using the contents in body of the message.

- **Providing the Message Deduplication ID**: When a message with a particular message deduplication ID is sent, any messages subsequently sent with the same message deduplication ID are accepted successfully but are not delivered during the 5-minute deduplication interval.

### Queue Configurations

After creating the queue, we need to configure the queue with specific attributes based on our message processing requirements. Let us look at some of the properties which we configure:

**Dead-letter Queue**:A dead-letter queue is a queue that one or more source queues can use for messages that are not consumed successfully. They are useful for debugging our applications or messaging system because they let us isolate unconsumed messages to determine why their processing does not succeed.

**Dead-letter Queue Redrive**:We configure a dead-letter queue redrive to move standard unconsumed messages out of an existing dead-letter queue back to their source queues.

**Visibility Timeout**:The visibility timeout is a period of time during which a message received from a queue by one consumer is not visible to the other message consumers. Amazon SQS prevents other consumers from receiving and processing the message during the visibility timeout period. 

**Message Retention Period**: The amount of time for which a message remains in the queue. The messages in the queue should be received and processed before this time is crossed. They are automatically deleted from the queue once the message retention period has passed. 

**DelaySeconds**: The length of time for which the delivery of all messages in the queue is delayed. 

**MaximumMessageSize**: The limit of how many bytes a message can contain before Amazon SQS rejects it.   
**ReceiveMessageWaitTimeSeconds**: The length of time for which a ReceiveMessage action waits for a message to arrive. Valid values: An integer from 0 to 20 (seconds). Default: 0.

**Short and long polling**:Amazon SQS provides short polling and long polling to receive messages from a queue. By default, queues use short polling.


## Creating a Standard SQS Queue
We can use the [Amazon SQS console](https://console.aws.amazon.com/sqs/#/create-queue) to create standard queues and FIFO queues. The console provides default values for all settings except for the queue name. 

However, for our examples, we will use AWS SDK for Java to create our queues and send and receive messages. Let us first add the following Maven dependency in our `pom.xml`:

```xml
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>sqs</artifactId>
    </dependency>
    <dependencyManagement>
        <dependencies>
          <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>bom</artifactId>
            <version>2.17.116</version>
            <type>pom</type>
            <scope>import</scope>
          </dependency>
        </dependencies>
   </dependencyManagement>

```



We will define our queue with the Java SDK:

```java
public class ResourceHelper {
  public static void createStandardQueue() {
    SqsClient sqsClient = getSQSClient();
   
    // Define the request for creating a 
    // standard queue with default parameters
    CreateQueueRequest createQueueRequest 
                           = CreateQueueRequest.builder()
                            .queueName("myqueue")
                            .build();
    // Create the queue
    sqsClient.createQueue(createQueueRequest);
  }
  
  
  private static SqsClient getSQSClient() {
    AwsCredentialsProvider credentialsProvider = 
        ProfileCredentialsProvider.create("<Profile");
    
    SqsClient sqsClient = SqsClient
        .builder()
        .credentialsProvider(credentialsProvider)
        .region(Region.US_EAST_1).build();
    return sqsClient;
  }

}


```
We have defined an SQS queue with default configuration and set the name of the queue as `myqueue`. The queue name is unique for our AWS account and region. 

Running this program will create a standard type SQS queue of name `myqueue` with default configuration. We can see the queue we just created in the aws console:
{{% image alt="SQS queue" src="images/posts/aws-sqs/sqs-queue.png" %}}


## Sending Message to a Standard SQS Queue
We can send a message to an SQS Queue from the AWS console. However, for all practical purposes, the message is sent programmatically using the AWS SDK for a supported programming language. 

Let us send a message to our queue from a Java program. So we will use the AWS Java SDK and add it as a Maven dependency. The AWS SDK for Java simpliﬁes the use of AWS Services by providing a set of libraries that are based on common design patterns familiar to Java developers.

We use the following code snippet to send a message to the queue that we created earlier:

```java
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.ProfileCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.MessageAttributeValue;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;
import software.amazon.awssdk.services.sqs.model.SendMessageResponse;

public class MessageSender {

  private static Logger logger = Logger
         .getLogger(MessageSender.class.getName());

  public static void sendMessage() {
    SqsClient sqsClient = getSQSClient();
    
    final String queueURL 
    = "https://sqs.us-east-1.amazonaws.com/*****/myqueue";

    SendMessageRequest sendMessageRequest = SendMessageRequest
                           .builder()
                           .queueUrl(queueURL)
                           .messageBody("Test message")
                           .build();

    SendMessageResponse sendMessageResponse = 
                                sqsClient
                                .sendMessage(sendMessageRequest);
    
    logger.info("message id: "+ sendMessageResponse.messageId());
    
    sqsClient.close();
  }



  private static SqsClient getSQSClient() {
    AwsCredentialsProvider credentialsProvider = 
           ProfileCredentialsProvider.create("<profile name>");
    
    SqsClient sqsClient = SqsClient
        .builder()
        .credentialsProvider(credentialsProvider)
        .region(Region.US_EAST_1).build();

    return sqsClient;
  }

}

```

Here we are first establishing a connection with the AWS SQS service using the `SqsClient` class. After that, the message to be sent is constructed with the `SendMessageRequest` class by specifying the URL of the queue and the message body. 

Then the message is sent by invoking the `sendMessage()` method on the `SqsClient` instance.

When we run this program we can see the `message id` in the output:

```shell
INFO: message id: fa5fd857-59b4-4a9a-ba54-a5ab98ee82f9 

```
This message ID returned in the `sendMessage()` response is assigned by SQS and is useful for identifying messages.

We can also send multiple messages in a single request using the `sendMessageBatch()` method of the `SqsClient` class.

## Creating a FIFO SQS Queue

Let us now create a FIFO queue that we can use for sending non-duplicate messages in a fixed sequence. We will do this in the `createFifoQueue()` method as shown here: 

```java
public class ResourceHelper {
  private static Logger logger 
       = Logger.getLogger(ResourceHelper.class.getName());
  
  public static void main(String[] args) {
    createFifoQueue();
  }
  

  public static void createFifoQueue() {
    SqsClient sqsClient = getSQSClient();
    
    
    // Define attributes of FIFO queue in an attribute map
    Map<QueueAttributeName, String> attributeMap 
          = new HashMap<QueueAttributeName, String>();
    
    // FIFO_QUEUE attribute is set to true mark the queue as FIFO
    attributeMap.put(QueueAttributeName.FIFO_QUEUE, "true");

    // Scope of DEDUPLICATION is set to messageGroup
    attributeMap.put(QueueAttributeName.DEDUPLICATION_SCOPE, "messageGroup");

    // CONTENT_BASED_DEDUPLICATION is disabled
    attributeMap.put(QueueAttributeName.CONTENT_BASED_DEDUPLICATION, "false");
    
    // Prepare the queue creation request and end the name of the queue with fifo
    CreateQueueRequest createQueueRequest = CreateQueueRequest.builder()
                .queueName("myfifoqueue.fifo")
                .attributes(attributeMap )
                .build();

    // Create the FIFO queue
    CreateQueueResponse createQueueResponse 
       = sqsClient.createQueue(createQueueRequest);
        
    // URL of the queue is returned in the response  
    logger.info("url "+createQueueResponse.queueUrl());
  }
  
  private static SqsClient getSQSClient() {
    AwsCredentialsProvider credentialsProvider 
    = ProfileCredentialsProvider.create("<Profile>");
    
    SqsClient sqsClient = SqsClient
        .builder()
        .credentialsProvider(credentialsProvider)
        .region(Region.US_EAST_1).build();
    return sqsClient;
  }
  
  private static String getQueueArn(
                  final String queueName, 
                  final String region) {
    return "arn:aws:sqs:"+region + ":" + AppConfig.ACCOUNT_NO + ":" + queueName;
  }

}

```
As we can see, we have defined a queue with the name `myfifoqueue.fifo`. The name of FIFO queues must end with `.fifo`. We have set the property: `contentBasedDeduplication` to `false` which means that we need to explicitly send `messageDeduplicationId` with the message so that SQS can identify them as duplicates. 

Further, the `deduplicationScope` property of the queue is set to `MESSAGE_GROUP` which indicates the message group as the scope for identifying duplicate messages. The `deduplicationScope` property can alternately be set to `QUEUE`.

## Sending Message to FIFO Queue

As explained earlier, a FIFO queue preserves the order in which messages are sent and received. 

To check this behavior, let us send five messages to the FIFO queue, we created earlier :

```java
public class MessageSender {

  private static Logger logger 
  = Logger.getLogger(MessageSender.class.getName());

  public static void sendMessageToFifo() {
    SqsClient sqsClient = getSQSClient();
    
    Map<String, MessageAttributeValue> messageAttributes 
              = new HashMap<String, MessageAttributeValue>();
    ...
    ...
    
    final String queueURL = "https://sqs.us-east-1.amazonaws.com/" 
                    +AppConfig.ACCOUNT_NO 
                    + "/myfifoqueue.fifo";
   
    
    List<String> dedupIds = List.of("dedupid1",
                                    "dedupid2",
                                    "dedupid3",
                                    "dedupid2",
                                    "dedupid1");
    
    String messageGroupId = "signup";
    
    List<String> messages = List.of(
                "My fifo message1",
                "My fifo message2",
                "My fifo message3",
                "My fifo message2",
                "My fifo message1");
    short loop = 0;
    for (String message : messages) {
      
      SendMessageRequest sendMessageRequest 
        = SendMessageRequest.builder()
          .queueUrl(queueURL)
          .messageBody(message)
          .messageAttributes(messageAttributes)
          .messageDeduplicationId(dedupIds.get(loop))
          .messageGroupId(messageGroupId)
          .build();
      
      SendMessageResponse sendMessageResponse 
        = sqsClient
          .sendMessage(sendMessageRequest);
      
      logger.info("message id: "+ sendMessageResponse.messageId());
      
      loop+=1;
    }

    
    sqsClient.close();
  }

```
A sample of the output generated by running this program is shown:

```shell

message id and sequence no.: 9529ddac-8946-4fee-a2dc-7be428666b63 | 18867399222923248640

message id and sequence no.: 2ba4d7dd-877c-4982-b41e-817c99633fc4 | 18867399223023088896

message id and sequence no.: ad354de3-3a89-4400-83b8-89a892c30526 | 18867399223104239872

message id and sequence no.: 2ba4d7dd-877c-4982-b41e-817c99633fc4 | 18867399223023088896

message id and sequence no.: 9529ddac-8946-4fee-a2dc-7be428666b63 | 18867399222923248640


```
When SQS accepts the message, it returns a sequence number along with a message identifier. The Sequence number as we can see is a large, non-consecutive number that Amazon SQS assigns to each message.

We are sending five messages with two of them being duplicates. Since we had set the `contentBasedDeduplication` property to `true`, SQS determines duplicate messages by the `messageDeduplicationId`. The messages: "My fifo message1" and "My fifo message2" are each sent twice with the same `messageDeduplicationId` while "My fifo message3" is sent once. 

Although we have sent five messages, we will only receive three unique messages in the same order when we consume the messages from the queue. We will look at how to consume messages from SQS in the next section.

## Consuming Messages from a Queue

Now let us read the message we sent to the queue from a different consumer program. As explained earlier, in keeping with the asynchronous programming model, the consumer program is independent of the sender program. The sender program does not wait for the consumer program to read the message before completion.

We retrieve messages that are currently in the queue by calling the AmazonSQS client’s `receiveMessage()` method of the `SqsClient` class as shown here:

```java
public class MessageReceiver {
  
  public static void receiveMessage() {
    SqsClient sqsClient = getSQSClient();

    final String queueURL = "https://sqs.us-east-1.amazonaws.com/" 
                    +AppConfig.ACCOUNT_NO 
                    + "/myqueue";


    // long polling and wait for waitTimeSeconds before timing out
    ReceiveMessageRequest receiveMessageRequest = 
                            ReceiveMessageRequest
                            .builder()
                            .queueUrl(queueURL)
                            .waitTimeSeconds(20)
                            .messageAttributeNames("trace-id") 
                            .build();

    List<Message> messages 
                        = sqsClient
                           .receiveMessage(receiveMessageRequest)
                           .messages();
  }
  
  private static SqsClient getSQSClient() {
    AwsCredentialsProvider credentialsProvider = 
              ProfileCredentialsProvider.create("<Profile>");
    
    SqsClient sqsClient = SqsClient
        .builder()
        .credentialsProvider(credentialsProvider)
        .region(Region.US_EAST_1).build();
    return sqsClient;
  }

}
```
Here we have enabled long polling for receiving the SQS messages by setting the wait time as `20` seconds on the `ReceiveMessageRequest` which we have supplied to the `receiveMessage()` method of the `SqsClient` class.

The `receiveMessage()` returns the messages from the queue as a list of `Message` objects.


## Deleting Messages from a Queue with the ReceiptHandle

We get a `receiptHandle` when we receive a message from SQS. 

We use this `receiptHandle` to delete a message from a queue as shown in this example, otherwise, the messages left in a queue are deleted automatically after the expiry of the retention period configured for the queue:

```java
public class MessageReceiver {

  
  public static void receiveFifoMessage() throws InterruptedException {
    SqsClient sqsClient = getSQSClient();

    final String queueURL = "https://sqs.us-east-1.amazonaws.com/" 
                    +AppConfig.ACCOUNT_NO 
                    + "/myfifoqueue.fifo";

    ...
    ...
    
    while(true) {
    
          Thread.sleep(20000l);
          List<Message> messages 
               = sqsClient.receiveMessage(receiveMessageRequest)
               .messages();

          messages.stream().forEach(msg->{
          
          // Get the receipt handle of the message received
          String receiptHandle = msg.receiptHandle();

          // Create the delete request with the receipt handle
          DeleteMessageRequest deleteMessageRequest 
                                  = DeleteMessageRequest
                                      .builder()
                                      .queueUrl(queueURL)
                                      .receiptHandle(receiptHandle)
                                      .build();

          // Delete the message
          DeleteMessageResponse deleteMessageResponse 
                         = sqsClient.deleteMessage(deleteMessageRequest );
         
        });
    
    }
  
  }
  
  private static SqsClient getSQSClient() {

    AwsCredentialsProvider credentialsProvider 
                        = ProfileCredentialsProvider.create("<Profile>");
    
    SqsClient sqsClient = SqsClient
                            .builder()
                            .credentialsProvider(credentialsProvider)
                            .region(Region.US_EAST_1)
                            .build();
    return sqsClient;
  }

}

```
In this `receiveFifoMessage()`, we get the `receiptHandle` of the message received from SQS and use this to delete the queue.

The `receiptHandle` is associated with a specific instance of receiving a message. It is different each time we receive the message in case we receive the message more than once. So we must use the most recently received `receiptHandle` for the message for sending deletion requests.

For standard queues, it is possible to receive a message even after we have deleted it because of the distributed nature of the underlying storage. We should ensure that our application is idempotent to handle this scenario.

## Handling Messaging Failures with SQS Dead Letter Queue (DLQ)
Sometimes, messages cannot be processed because of many erroneous conditions within the producer or consumer application. We can isolate the messages which failed processing by moving them to a separate queue called Dead Letter Queue (DLQ). 

After we have fixed the consumer application or when the consumer application is available to consume the message, we can move the messages back to the source queue using the dead-letter queue redrive capability.

A dead-letter queue is a queue that one or more source queues can use for messages that are not consumed successfully. 

Amazon SQS does not create the dead-letter queue automatically. We must first create the queue before using it as a dead-letter queue. With this understanding, let us update the queue creation method that we defined earlier using AWS SDK:


```java
public class ResourceHelper {
  private static Logger logger 
    = Logger.getLogger(ResourceHelper.class.getName());
  
  public static void main(String[] args) {
    createStandardQueue();
  }

  public static void createStandardQueue() {
    SqsClient sqsClient = getSQSClient();
    
    String dlqName = "mydlq";
    CreateQueueRequest createQueueRequest = CreateQueueRequest.builder()
                                  .queueName(dlqName)
                                  .build();
    

    // Create dead letter queue
    CreateQueueResponse createQueueResponse 
       = sqsClient.createQueue(createQueueRequest);
    
    
    String dlqArn = getQueueArn(dlqName,"us-east-1"); 
    
    Map<QueueAttributeName, String> attributeMap 
         = new HashMap<QueueAttributeName, String>();

    attributeMap.put(QueueAttributeName.REDRIVE_POLICY, 
        "{\"maxReceiveCount\":10,\"deadLetterTargetArn\":\""+dlqArn+"\"}");
      
    // Prepare request for creating the standard queue
    createQueueRequest = CreateQueueRequest.builder()
                .queueName("myqueue")
                .attributes(attributeMap)
                .build();

    // create the queue
    createQueueResponse = sqsClient.createQueue(createQueueRequest);
      
    logger.info("Queue URL " + createQueueResponse.queueUrl());
  }

  private static String getQueueArn(
    final String queueName, 
    final String region) {

    return "arn:aws:sqs:"+region + ":" + AppConfig.ACCOUNT_NO+ ":" + queueName;
  }
  
}

```
Here we have first defined a standard queue named `mydlq` for using it as the dead letter queue. 

The redrive policy of a SQS queue is used to specify the source queue, the dead-letter queue, and the conditions under which Amazon SQS will move messages if the consumer of the source queue fails to process a message a specified number of times. The `maxReceiveCount` is the number of times a consumer tries to receive a message from a queue without deleting it before being moved to the dead-letter queue.

Accordingly, we have defined the `Redrive policy` in the attribute map when creating the source queue with `maxReceiveCount` value of `10` and Amazon Resource Names (ARN) of the dead letter queue. 


## Trigger AWS Lambda Function by Messages in the Queue

AWS Lambda is a serverless, event-driven compute service which we can use to run code for any type of application or backend service without provisioning or managing servers. 

We can trigger the Lambda function from many AWS services and only pay for what we use.

We can attach a SQS standard and FIFO queues to an AWS Lambda function as an event source. The lambda function will get triggered whenever messages are put in the queue. The function will read and process messages in the queue. 

The Lambda function will poll the queue and invoke the Lambda function by passing an event parameter that contains the messages in the queue. 

Lambda function supports many language runtimes like Node.js, Python, C#, and Java. 

Let us attach the following lambda function to our standard queue created earlier to process SQS messages: 

```js
exports.handler = async function(event, context) {
  event.Records.forEach(record => {
    const { body } = record;
    console.log(body);
  });
  return {};
}

```
This function written in Javascript and uses the Node.js runtime during execution in AWS Lambda. A handler function named `handler()` is exported that takes an `event` object and a `context` object as parameters and prints the message received from the SQS queue in the console. The handler function in Lambda is the method that processes events. Lambda runs the handler method when the function is invoked.

We will also need to create a execution role with lambda with the following IAM policy attached:

```xml
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "sqs:DeleteMessage",
                "sqs:ReceiveMessage",
                "sqs:GetQueueAttributes"
            ],
            "Resource": [
                "arn:aws:sqs:us-east-1:<account-no>:myqueue"
            ]
        }
    ]
}

```
For processing messages from the queue, the lambda function needs permissions for `DeleteMessage`, `ReceiveMessage`, `GetQueueAttributes` on our SQS queue and a AWS managed policy: `AWSLambdaBasicExecutionRole` for permission for writing to cloudwatch logs.

Let us create this lambda function from the AWS console as shown here:

{{% image alt="Lambda Trigger for SQS queue" src="images/posts/aws-sqs/lambda-trigger.png" %}}



Let us run our `sendMessage()` method to send a message to the queue where the lambda function is attached. Since the lambda function is attached to be triggered by messages in the queue, we can see the message sent by the `sendMessage()` method in the CloudWatch console:

{{% image alt="Lambda Trigger for SQS queue" src="images/posts/aws-sqs/cloudwatch-log.png" %}}

We can see the message: `Test message` which was sent to the SQS queue , printed by the lambda receiver function in the CloudWatch console.

We can also specify a queue to act as a dead-letter queue for messages that our Lambda function fails to process.

## Sending Message Metadata with Message Attributes

Message attributes are structured metadata that can be attached and sent together with the message to SQS. 

Message Metadata are of two kinds : 

- **Message Attributes**:  These are custom metadata usually added and extracted by our applications for general purpose use cases. Each message can have up to 10 attributes. 

- **Message System Attributes**: These are used to store metadata for other AWS services like AWS X-Ray. 

Let us modify our earlier example of sending a message by adding a message attribute to be sent with the message:

```java
public class MessageSender {

  private static final String TRACE_ID_NAME = "trace-id";
  private static Logger logger 
      = Logger.getLogger(MessageSender.class.getName());

  public static void main(String[] args) {
    sendMessage();
  }

  public static void sendMessage() {
    SqsClient sqsClient = getSQSClient();
    
    Map<String, MessageAttributeValue> messageAttributes = 
                     new HashMap<String, MessageAttributeValue>();

    // generates a UUID as the traceId
    String traceId = UUID.randomUUID().toString();
    // add traceId as a message attribute
    messageAttributes.put(TRACE_ID_NAME, 
                  MessageAttributeValue.builder()
                  .dataType("String")
                  .stringValue(traceId)
                  .build());
    
    final String queueURL 
    = "https://sqs.us-east-1.amazonaws.com/****/myqueue";

    SendMessageRequest sendMessageRequest = SendMessageRequest
                           .builder()
                           .queueUrl(queueURL)
                           .messageBody("Test message")
        .messageAttributes(messageAttributes)
        .build();

    SendMessageResponse sendMessageResponse 
                                  = sqsClient
                                  .sendMessage(sendMessageRequest);
    
    logger.info("message id: "+ sendMessageResponse.messageId());
    
    sqsClient.close();
  }



  private static SqsClient getSQSClient() {
    AwsCredentialsProvider credentialsProvider 
     = ProfileCredentialsProvider.create("<Profile>");
    
    SqsClient sqsClient = SqsClient
        .builder()
        .credentialsProvider(credentialsProvider)
        .region(Region.US_EAST_1).build();
    return sqsClient;
  }

}

```
In this example, we have added a message attribute named `traceId` which will be of `String` type.


## Defining SQS Queue as an SNS Topic Subscriber

Amazon Simple Notification Service (SNS) is a fully managed publish/subscribe messaging service that allows us to fan out messages from a logical access point called Topic to multiple recipients at the same time. 

SNS topics support different subscription types like SQS queues, AWS Lambda functions, HTTP endpoints, email addresses, SMS, and mobile push where we can publish messages.

We can subscribe multiple Amazon SQS queues to an Amazon Simple Notification Service (Amazon SNS) topic. When we publish a message to a topic, Amazon SNS sends the message to each of the subscribed queues. 

Let us update our `ResourceHelper` class by adding  a method to create an SNS topic along with a subscription to the SQS Standard Queue created earlier:

```java
public class ResourceHelper {
  private static Logger logger 
      = Logger.getLogger(ResourceHelper.class.getName());
  
  public static void main(String[] args) {
    createSNSTopicWithSubscription();
  }

  public static void createSNSTopicWithSubscription() {
    SnsClient snsClient = getSNSClient();
    
    // Prepare the request for creating SNS topic 
    CreateTopicRequest createTopicRequest 
               = CreateTopicRequest
                         .builder()
                         .name("mytopic")
                         .build();

    // Create the topic
    CreateTopicResponse createTopicResponse 
              = snsClient.createTopic(createTopicRequest );
    
    String topicArn = createTopicResponse.topicArn();

    String queueArn= getQueueArn("myqueue","us-east-1");
    
    // Prepare the SubscribeRequest for subscribing
    // endpoint of protocol sqs to topic of topicArn 
    SubscribeRequest subscribeRequest = SubscribeRequest.builder()
                              .protocol("sqs")
                              .topicArn(topicArn)
                              .endpoint(queueArn)
                              .build();

    SubscribeResponse subscribeResponse 
               = snsClient.subscribe( subscribeRequest );

      
    logger.info("subscriptionArn " + 
      subscribeResponse.subscriptionArn());
  }

}

```
Here we have first created an SNS topic of name `mytopic`. Then we have created a subscription by adding the SQS queue as a subscriber to the topic.

Let us now publish a message to this SNS topic using AWS Java SDK as shown below:

```java
public class MessageSender {
  private static Logger logger 
  = Logger.getLogger(MessageSender.class.getName());

  /**
   * @param args
   */
  public static void main(String[] args) {
    // sendMessage();
    // sendMessageToFifo();
    sendMessageToSnsTopic();
  }

  public static void sendMessageToSnsTopic() {
    SnsClient snsClient = getSNSClient();
    
    final String topicArn = "arn:aws:sns:us-east-1:675153449441:LambdaFromSqsStack-mytopicDA9518A7-18LSXENGTNKKY";
  
    // Build the publish request with the 
    // SNS Topic Arn and the message body
    PublishRequest publishRequest = PublishRequest
                                        .builder()
                                        .topicArn(topicArn)
                                        .message("Test message published to topic")
                                        .build();

    // Publish the message to the SNS topic
    PublishResponse publishResponse 
         = snsClient.publish(publishRequest);
    
    logger.info("message id: "+ publishResponse.messageId());
    
    snsClient.close();
  }
  
  private static SnsClient getSNSClient() {
    AwsCredentialsProvider credentialsProvider 
    = ProfileCredentialsProvider.create("<Profile>");
    
    // Construct the SnsClient with AWS account credentials
    SnsClient snsClient = SnsClient
        .builder()
        .credentialsProvider(credentialsProvider)
        .region(Region.US_EAST_1).build();

    return snsClient;
  }

}

```

Here we have set up the SNS client using our AWS account credentials and invoked the publish method on the `SnsClient` instance to publish a message to the topic. The SQS queue being a subscriber to the queue receives the message from the topic.

## Conclusion

Here is a list of the major points for a quick reference:

1. Message Queueing is an asynchronous style of communication between two or more processes.
2. Messages and queues are the basic components of a message queuing system.
3. Amazon Simple Queue Service (SQS) is a fully managed message queuing service using which we can send, store, and receive messages to enable asynchronous communication between decoupled systems.  
4. SQS provides two types of queues: Standard Queue and First-in-First-out FIFO Queue.
5. Standard queues are more performant but do not preserve message ordering.
6. FIFO queues preserve the order of the messages that are sent with the same message group identifier and also do not allow duplicate messages.
7. We used AWS CDK to build an infrastructure stack containing SQS standard queue, FIFO queue, SNS topic, and a lambda function that will get triggered by messages in the queue. Other than CDK we can use CloudFormation directly or use AWS SDK for a supported language to build queues and topics.
8. We define a Dead-letter queue (DLQ) to receive messages which have failed processing due to any erroneous condition in the producer or consumer program.
9. SQS queue can be defined as a subscriber to an SNS topic.




You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/sqs).

