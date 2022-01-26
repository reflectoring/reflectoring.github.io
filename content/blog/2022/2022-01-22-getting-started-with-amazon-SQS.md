---
authors: [pratikdas]
title: "Getting Started with AWS SQS"
categories: ["aws"]
date: 2022-01-20 06:00:00 +1000
modified: 2022-01-20 06:00:00 +1000
excerpt: "Amazon Simple Queue Service (SQS) is a fully managed message queuing service. We can send, store, and receive messages at any volume, without losing messages or requiring other systems to be available. In this article, we will introduce Amazon SQS, understand its core concepts and work through some examples."
image: images/stock/0115-2021-1200x628-branded.jpg
url: getting-started-with-aws-sqs
---

Amazon Simple Queue Service (SQS) is a fully managed message queuing service that enables decoupling and communication between the components of a distributed system. We can send, store, and receive messages at any volume, without losing messages or requiring other systems to be available. 

Being fully managed, Amazon SQS also eliminates the additional overhead associated with managing and operating message-oriented middleware thereby empowering developers to focus on application development instead of managing infrastructure. 

In this article, we will introduce Amazon SQS, understand its core concepts of the queue and sending and receiving messages and work through some examples.

{{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/sqs" %}}

## What is Message Queueing

Message Queueing is an asynchronous style of communication between two or more processes.
Messages and queues are the basic components of a message queuing system.

Programs communicate with each other by sending data in the form of messages instead of calling each other directly.

Messages are placed in a storage called queues, which allows the communicating programs to run independently of each other, at different speeds and times, in different processes, and without having a direct connection between them.

They are an essential component of modern-day architectures, helping to decouple applications into smaller, independent building blocks that can be independently scaled, deployed, and evolved. 

The messages sent to a queue are usually small and can be things like requests, replies, error messages, or just plain information. To send a message, a component called a producer sends a message to the queue. The message is stored on the queue until another component called a consumer retrieves the message and does processing without any knowledge of the producer component.


## Core Concepts of Amazon SQS
The Amazon Simple Queue Service (SQS) is a fully managed distributed Message Queueing System. The queue provided by the SQS service redundantly stores the messages across multiple Amazon SQS servers. Let us look at some of its core concepts:

### Standard Queues vs FIFO Queues

Amazon SQS provides two types of message queues:

**Standard queues**: They offer maximum throughput, best-effort ordering, and at-least-once delivery. The standard queue is the default queue type in SQS.  

**FIFO queues**: FIFO (First-In-First-Out) queues are used for messaging when the order of operations and events exchanged between applications is important, or in situations where we want to avoid processing duplicate messages. FIFO queues guarantee that messages are processed exactly once, in the exact order that they are sent.

## FIFO Queues
A FIFO queue preserves the order in which messages are sent and received and a message is delivered once 

The messages are ordered based on message group ID. If multiple hosts (or different threads on the same host) send messages with the same message group ID to a FIFO queue, Amazon SQS stores the messages in the order in which they arrive for processing. To make sure that Amazon SQS preserves the order in which messages are sent and received, each producer should use a unique message group ID to send all its messages.

Messages that belong to the same message group are always processed one by one, in a strict order relative to the message group.

FIFO queues also help us to avoid sending duplicate messages to a queue. If we send the same message within the 5-minute deduplication interval, it is not added to the queue. We can configure deduplication in two ways:

- Enable content-based deduplication. This instructs Amazon SQS to use a SHA-256 hash to generate the message deduplication ID using the body of the message
- Explicitly provide the message deduplication ID (or view the sequence number) for the message. If a message with a particular message deduplication ID is sent successfully, any messages sent with the same message deduplication ID are accepted successfully but are not delivered during the 5-minute deduplication interval.

### Queue Configurations

After creating the queue, we need to configure the queue with specific attributes based on our message processing requirements. Let us look at some of the properties which we configure:

**Dead-letter Queue**:A dead-letter queue is a queue that one or more source queues can use for messages that are not consumed successfully. 
Amazon SQS supports dead-letter queues (DLQ), which other queues (source queues) can target for messages that cannot be processed (consumed) successfully. Dead-letter queues are useful for debugging our application or messaging system because they let you isolate unconsumed messages to determine why their processing doesn't succeed.

**Dead-letter Queue Redrive**:We configure a dead-letter queue redrive to move standard unconsumed messages out of an existing dead-letter queue back to their source queues.

**Visibility Timeout**:The visibility timeout is a period of time during which a message received from a queue by one consumer is not visible to the other message consumers. Amazon SQS prevents other consumers from receiving and processing the message during the visibility timeout period. 

**Message Retention Period**: The amount of time for which a message remains in the queue. The messages in the queue should be received and processed before this time is crossed. They are automatically deleted from the queue once the message retention period has passed. 

**DelaySeconds**: The length of time for which the delivery of all messages in the queue is delayed. 

**MaximumMessageSize**: The limit of how many bytes a message can contain before Amazon SQS rejects it.  
**ReceiveMessageWaitTimeSeconds**: The length of time for which a ReceiveMessage action waits for a message to arrive. Valid values: An integer from 0 to 20 (seconds). Default: 0.

**Short and long polling**:Amazon SQS provides short polling and long polling to receive messages from a queue. By default, queues use short polling.


## Creating a Standard SQS Queue
We can use the [Amazon SQS console](https://console.aws.amazon.com/sqs/#/create-queue) to create standard queues and FIFO queues. The console provides default values for all settings except for the queue name. 

However, for our examples, we will use AWS Cloud Development Kit (CDK) for creating our SQS Queue. AWS CDK is an open-source software development framework for defining our cloud application resources using programming languages like java, C#, node.js, typescript, etc.

We will define our queue with CDK using Java as the programming language:

```java
public class LambdaFromSqsStack extends Stack {
    public LambdaFromSqsStack(final Construct scope, final String id) {
        this(scope, id, null);
    }

    public LambdaFromSqsStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        Queue queue = Queue
                       .Builder
                       .create(this, "myqueue")
                       .queueName("myqueue")
                       .build();
    }
}

```
We have defined an SQS queue with default configuration and set the name of the queue as `myqueue`. The queue name is unique for our AWS account and region. 

Let us run the following `cdk` commands in sequence to provision this SQS queue:
```shell
cdk bootstrap --profile <AWS profile name>

cdk synth

cdk deploy --profile <AWS profile name>
```
Running these commands will create a standard type SQS queue of name `myqueue` with default configuration. We can see the queue we just created in the aws console:
{{% image alt="SQS queue" src="images/posts/aws-sqs/sqs-queue.png" %}}


## Sending Message to a Standard SQS Queue
We can send a message to an SQS Queue from the AWS console. However, for all practical purposes, the message is sent programmatically using the AWS SDK for a supported programming language. We will send a message to our queue from a Java program so we will use the AWS Java SDK and add it as a Maven dependency. The AWS SDK for Java simpliﬁes the use of AWS Services by providing a set of libraries that are based on common design patterns familiar to Java developers.

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
    
    final String queueURL = "https://sqs.us-east-1.amazonaws.com/*****/myqueue";

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
When we run this program we can see the `message id` in the output:
```shell
INFO: message id: fa5fd857-59b4-4a9a-ba54-a5ab98ee82f9 

```
The message ID is assigned by SQS which is returned in the SendMessage response. This identifier is useful for identifying messages.

Here we are first establishing a connection with the AWS SQS service using the `SqsClient` class. After that, the message to be sent is constructed with the `SendMessageRequest` class by specifying the URL of the queue and the message body. Then the message is sent by invoking the `sendMessage()` method on the `SqsClient` instance.

We can also send multiple messages in a single request using the `sendMessageBatch()` method of the `SqsClient` class.

## Creating a FIFO SQS Queue

Let us now define a FIFO queue that we can use for sending non-duplicate messages in a fixed sequence. We will update our CDK stack as shown below:

```java
public class LambdaFromSqsStack extends Stack {
    public LambdaFromSqsStack(final Construct scope, final String id) {
        this(scope, id, null);
    }

    public LambdaFromSqsStack(final Construct scope, final String id, final StackProps props) {
         super(scope, id, props);

     ...
     ...
     
     // Create a FIFO queue. 
     Queue fifoQueue = Queue.Builder.create(this, "myfifoqueue")
              .queueName("myfifoqueue.fifo")
              .deduplicationScope(DeduplicationScope.MESSAGE_GROUP)
              .contentBasedDeduplication(false)
              .fifo(true)
              .build();

    }
}

```
As we can see, we have defined a queue with the name `myfifoqueue.fifo`. The name of FIFO queues must end with `.fifo`. We have set the property: `contentBasedDeduplication` to `false` which means that we need to explicitly send `messageDeduplicationId` with the message so that SQS can identify them as duplicates. 

Further, the `deduplicationScope` property is set to `MESSAGE_GROUP` which indicates the message group as the scope for identifying duplicate messages. The `deduplicationScope` property can alternately be set to `QUEUE`.

## Sending Message to FIFO Queue

As explained earlier, a FIFO queue preserves the order in which messages are sent and received. 

To check this behavior, let us send five messages to the FIFO queue, we created earlier :

```java
  public static void sendMessageToFifo() {
    SqsClient sqsClient = getSQSClient();
    
    Map<String, MessageAttributeValue> messageAttributes 
              = new HashMap<String, MessageAttributeValue>();
    ...
    ...
    
    final String queueURL = "https://sqs.us-east-1.amazonaws.com/*****/myfifoqueue.fifo";
    
    
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
      
      SendMessageRequest sendMessageRequest = SendMessageRequest.builder()
          .queueUrl(queueURL)
          .messageBody(message)
          .messageAttributes(messageAttributes)
          .messageDeduplicationId(dedupIds.get(loop))
          .messageGroupId(messageGroupId)
          .build();
      
      SendMessageResponse sendMessageResponse = sqsClient
          .sendMessage(sendMessageRequest);
      
      logger.info("message id: "+ sendMessageResponse.messageId());
      
      loop+=1;
    }

    
    sqsClient.close();
  }

```
A sample of the output generated by running this program is shown:

```shell

INFO: message id and sequence no.: 9529ddac-8946-4fee-a2dc-7be428666b63 | 18867399222923248640

INFO: message id and sequence no.: 2ba4d7dd-877c-4982-b41e-817c99633fc4 | 18867399223023088896

INFO: message id and sequence no.: ad354de3-3a89-4400-83b8-89a892c30526 | 18867399223104239872

INFO: message id and sequence no.: 2ba4d7dd-877c-4982-b41e-817c99633fc4 | 18867399223023088896

INFO: message id and sequence no.: 9529ddac-8946-4fee-a2dc-7be428666b63 | 18867399222923248640


```
When SQS accepts the message, it returns a sequence number along with a message identifier. The Sequence number as we can see is a large, non-consecutive number that Amazon SQS assigns to each message.

We are sending five messages with two of them being duplicates. Since we had set the `contentBasedDeduplication` property to `true`, SQS determines duplicate messages by the `messageDeduplicationId`. The messages: "My fifo message1" and "My fifo message2" are each sent twice with the same `messageDeduplicationId` while "My fifo message3" is sent once. Although we have sent five messages, we will only receive three unique messages in the same order when we consume the messages from the queue. We will look at how to consume messages from SQS in the next section.

## Consuming Messages from a Queue

Now let us read the message we sent to the queue from a different consumer program. As explained earlier, in keeping with the asynchronous programming model, the consumer program is independent of the sender program. The sender program does not wait for the consumer program to read the message before completion.

We retrieve messages that are currently in the queue by calling the AmazonSQS client’s `receiveMessage()` method of the `SqsClient` class as shown here:

```java
public class MessageReceiver {
  
  public static void receiveMessage() {
    SqsClient sqsClient = getSQSClient();

    final String queueURL = "https://sqs.us-east-1.amazonaws.com/*****/myqueue";

    // long polling and wait for waitTimeSeconds before timing out
    ReceiveMessageRequest receiveMessageRequest = 
                            ReceiveMessageRequest
                            .builder()
                                    .queueUrl(queueURL)
                                    .waitTimeSeconds(20)
                                    .messageAttributeNames("trace-id") 
                                    .build();

    List<Message> messages = sqsClient
                               .receiveMessage(receiveMessageRequest)
                               .messages();
  }
  
  private static SqsClient getSQSClient() {
    AwsCredentialsProvider credentialsProvider = 
              ProfileCredentialsProvider.create("******");
    
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


## Deleting Messages from a Queue with ReceiptHandle

We get a `receiptHandle` when we receive a message from SQS. 

We use this `receiptHandle` to delete a message from a queue as shown in this example, otherwise, the messages left in a queue are deleted automatically after the expiry of the retention period configured for the queue:

```java
public class MessageReceiver {

  
  public static void receiveFifoMessage() throws InterruptedException {
    SqsClient sqsClient = getSQSClient();
    final String queueURL = "https://sqs.us-east-1.amazonaws.com/675153449441/myfifoqueue.fifo";
    ...
    ...
    
    while(true) {
    
      Thread.sleep(20000l);
      List<Message> messages = sqsClient.receiveMessage(receiveMessageRequest).messages();
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
                            = ProfileCredentialsProvider.create("****");
    
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

Amazon SQS does not create the dead-letter queue automatically. We must first create the queue before using it as a dead-letter queue. With this understanding, let us update the infrastructure stack that we defined earlier using CDK:


```java
public class LambdaFromSqsStack extends Stack {

    public LambdaFromSqsStack(final Construct scope, final String id) {
        this(scope, id, null);
    }

    public LambdaFromSqsStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Define the Queue which will be used as Dead letter queue
        Queue dlq = Queue.Builder.create(this, "mydlq")
                      .queueName("mydlq")
                      .build();
        
        // Configure the Dead letter queue with maxReceiveCount
        DeadLetterQueue deadLetterQueue = DeadLetterQueue.builder()
                              .queue(dlq)
                              .maxReceiveCount(10)
                              .build();
        
        // Associate the Dead letter queue with the source queue
        Queue queue = Queue.Builder.create(this, "myqueue")
                .queueName("myqueue")
                .deadLetterQueue(deadLetterQueue )
                .visibilityTimeout(Duration.minutes(5))
                .deliveryDelay(Duration.minutes(1))
                .maxMessageSizeBytes(1024*100)  // 100 Kb
                .receiveMessageWaitTime(Duration.seconds(5))
                .retentionPeriod(Duration.days(1))
                .build();
    }
}

```
Here we have first defined a standard queue for using it as the dead letter queue and then configured the queue with `maxReceiveCount` value of `10`. After that, we have associated this dead letter queue with the source queue.

We have defined the dead-letter queue of a standard queue as a standard queue. Similarly, the dead-letter queue of a FIFO queue must also be a FIFO queue. 

Additionally, we can define a redrive policy to specify the source queue, the dead-letter queue, and the conditions under which Amazon SQS will move messages if the consumer of the source queue fails to process a message a specified number of times. The `maxReceiveCount` is the number of times a consumer tries to receive a message from a queue without deleting it before being moved to the dead-letter queue.

## Trigger AWS Lambda Function by Messages in the Queue

AWS Lambda is a serverless, event-driven compute service which we can use to run code for any type of application or backend service without provisioning or managing servers. 

We can trigger the Lambda function from many AWS services and only pay for what we use.

We can attach an AWS Lambda function to an SQS queue that will get triggered whenever messages are put in the queue. The Lambda function will poll the queue and invoke the Lambda function by passing an event parameter that contains the messages in the queue. 

Lambda function supports many language runtimes like Node.js, python, c#, and Java. 

Let us write the code of our lambda function in JavaScript to process SQS messages as shown below: 

```js
exports.handler = async function(event, context) {
  event.Records.forEach(record => {
    const { body } = record;
    console.log(body);
  });
  return {};
}

```
We will run this function with Node.js in AWS Lambda.

We have written this Lambda function in a single source file named `index.js` and saved this file under a folder named `resources` in our project folder. 

This file exports a handler function named `handler()` that takes an `event` object and a `context` object as parameters. The handler function in Lambda is the method that processes events. Lambda runs the handler method when the function is invoked.


Let us now update the CDK stack that we used for queue creation earlier and attach the lambda function to the queue. We will need to provide the name of the Lambda handler function as `index.handler` along with the folder containing the source code in the function configuration as shown here:

```java
public class LambdaFromSqsStack extends Stack {
    public LambdaFromSqsStack(final Construct scope, 
                              final String id) {
        this(scope, id, null);
    }

    public LambdaFromSqsStack(final Construct scope, 
                              final String id, 
                              final StackProps props) {
        super(scope, id, props);

        // Create the Queue
        Queue queue = Queue.Builder.create(this, "myqueue")
                                    .queueName("myqueue")
                                    .build();
        
        // Configure the Lambda function
        Function sqsReceiver = Function.Builder.create(this, "SQSReceiver")
                                  // folder containing the Lambda code
                                  .code(AssetCode.fromAsset("resources"))
                                  // Name of the handler function
                                  .handler("index.handler")
                                  .runtime( Runtime.NODEJS_14_X)
                                  .build();
      
        // Configure the queue as the event source of the Lambda function
        IEventSource source = SqsEventSource.Builder.create(queue).build();

        // Add the event source to the Lambda function
        sqsReceiver.addEventSource(source);
    
    }
}
```
Here we have defined the SQS queue as before. Then we have configured the lambda function and specified the runtime as Node.js, handler method as `index.handler`, and the folder containing the source code of Lambda function as `resources`.

We have next defined the queue as the event source of the Lambda function and attached it to our Lambda function.

We can also specify a queue to act as a dead-letter queue for messages that our Lambda function fails to process.

## Sending Message Metadata
We can include structured metadata with messages using message attributes.

Message attributes are structured metadata that can be attached and sent together with the message. 

There are two sets of message attributes: 
- **Message Attributes**:  Message Attributes are provided for general purpose use cases which normally are added and extracted by our applications. Each message can have up to 10 attributes. 

- **Message System Attributes**:Message System Attributes are designed to store metadata for other AWS services, such as AWS X-Ray. 

One of the common use cases of Message Attributes is distributed tracing. When a messaging infrastructure such as SQS is used by distributed applications, tracing a message produced and consumed among applications becomes tricky yet an essential feature to have. To demonstrate how to add and extract custom metadata with message attributes, an attribute named `traceId` will be used and there are three components in the example:

In the following example, we will focus on the usage of Message Attributes.
```java
public class MessageSender {

  private static final String TRACE_ID_NAME = "trace-id";
  private static Logger logger = Logger.getLogger(MessageSender.class.getName());

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
    = "https://sqs.us-east-1.amazonaws.com/675153449441/myqueue";

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
    AwsCredentialsProvider credentialsProvider = ProfileCredentialsProvider.create("pratikpoc");
    
    SqsClient sqsClient = SqsClient
        .builder()
        .credentialsProvider(credentialsProvider)
        .region(Region.US_EAST_1).build();
    return sqsClient;
  }

}

```
## Queue and Message identifiers
Both standard and FIFO queues have multiple identifiers with which we find and manipulate specific queues and messages in queues. Let us look at these identifiers and understand their uses:


3. **Receipt handle**:Every time you receive a message from a queue, you receive a receipt handle for that message. This handle is associated with the action of receiving the message, not with the message itself. To delete the message or to change the message visibility, you must provide the receipt handle (not the message ID).




## SQS Queue as an SNS Topic Subscriber

Amazon Simple Notification Service (SNS) is a fully managed publish/subscribe messaging service that allows us to fan out messages from a logical access point called Topic to multiple recipients at the same time. 

SNS topics support different subscription types like SQS queues, AWS Lambda functions, HTTP endpoints, email addresses, and mobile devices (SMS, push) where we can push messages.

We can subscribe multiple Amazon SQS queues to an Amazon Simple Notification Service (Amazon SNS) topic. When we publish a message to a topic, Amazon SNS sends the message to each of the subscribed queues. Let us update our infrastructure by adding an SNS topic and a subscription to an SQS Queue:

```java
public class LambdaFromSqsStack extends Stack {
    public LambdaFromSqsStack(
      final Construct scope, 
      final String id) {
        this(scope, id, null);
    }

    public LambdaFromSqsStack(
      final Construct scope, 
      final String id, 
      final StackProps props) {
        super(scope, id, props);
        ...
        ...
        // Create an SQS queue
        Queue queue = Queue.Builder.create(this, "myqueue")
            .queueName("myqueue")
            .deadLetterQueue(deadLetterQueue )
            .visibilityTimeout(Duration.minutes(5))
            .deliveryDelay(Duration.minutes(1))
            .maxMessageSizeBytes(1024*100)  // 100 Kb
            .receiveMessageWaitTime(Duration.seconds(5))
            .retentionPeriod(Duration.days(1))
            .build();
        
        ...
        ...
        
        // Create a SNS Topic
        Topic topic = Topic
                          .Builder
                          .create(this, "mytopic")
                          .build();
           
        // Add the queue as Topic Subscriber 
        topic.addSubscription(
                  SqsSubscription
                  .Builder
                  .create(queue)
                  .build());
    }
}

```
Here we have first created an SQS queue as we had done in previous examples. Then we have created an SNS topic and then added the SQS queue as a subscriber to the topic.

Let us now publish a message to this SNS topic using AWS Java SDK as shown below:

```java
public class MessageSender {
  private static Logger logger = Logger.getLogger(MessageSender.class.getName());

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
  
    // Build the publish request with the SNS Topic Arn and the message body
    PublishRequest publishRequest = PublishRequest
                                        .builder()
                                        .topicArn(topicArn)
                                        .message("Test message published to topic")
                                        .build();

    // Publish the message to the SNS topic
    PublishResponse publishResponse = snsClient.publish(publishRequest);
    
    logger.info("message id: "+ publishResponse.messageId());
    
    snsClient.close();
  }
  
  private static SnsClient getSNSClient() {
    AwsCredentialsProvider credentialsProvider 
    = ProfileCredentialsProvider.create("******");
    
    // Construct the SnsClient with AWS account credentials
    SnsClient snsClient = SnsClient
        .builder()
        .credentialsProvider(credentialsProvider)
        .region(Region.US_EAST_1).build();

    return snsClient;
  }

}

```

Here we have set up the SNS client using our AWS account credentials and invoked the publish method on the `SnsClient` instance to publish a test message to the topic.

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
9. SQS queue can be used as a subscriber to an SNS topic.




You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/sqs).

