---
authors: [pratikdas]
title: "Getting Started with AWS SQS"
categories: ["aws"]
date: 2022-01-20 06:00:00 +1000
modified: 2022-01-20 06:00:00 +1000
excerpt: "Amazon Simple Queue Service (SQS) is a fully managed message queuing service that enables you to decouple and scale microservices, distributed systems, and serverless applications. SQS eliminates the complexity and overhead associated with managing and operating message-oriented middleware, and empowers developers to focus on differentiating work."
image: images/stock/0115-2021-1200x628-branded.jpg
url: getting-started-with-aws-sqs
---

Amazon Simple Queue Service (SQS) is a fully managed message queuing service that enables you to decouple and scale microservices, distributed systems, and serverless applications. SQS eliminates the complexity and overhead associated with managing and operating message-oriented middleware, and empowers developers to focus on differentiating work. 

Using SQS, you can send, store, and receive messages between software components at any volume, without losing messages or requiring other services to be available. Get started with SQS in minutes using the AWS console, Command Line Interface or SDK of your choice, and three simple commands.

In this article, we will introduce Amazon SQS, understand its core concepts and work through some examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/cdkv2" %}

## What is Message Queueing
In modern cloud architecture, applications are decoupled into smaller, independent building blocks that are easier to develop, deploy and maintain. Message queues provide communication and coordination for these distributed applications. Message queues can significantly simplify coding of decoupled applications, while improving performance, reliability and scalability.


Message queues allow different parts of a system to communicate and process operations asynchronously. A message queue provides a lightweight buffer which temporarily stores messages, and endpoints that allow software components to connect to the queue in order to send and receive messages. The messages are usually small, and can be things like requests, replies, error messages, or just plain information. To send a message, a component called a producer adds a message to the queue. The message is stored on the queue until another component called a consumer retrieves the message and does something with it.


## What is Amazon Simple Queue Service
The Amazon Simple Queue Service (AWS SQS) offers a secure, durable, and available hosted queue that lets you integrate and decouple distributed software systems and components. Amazon SQS offers common constructs such as dead-letter queues and cost allocation tags. It provides a generic web services API that you can access using any programming language that the AWS SDK supports.



## Standard Queues vs FIFO Queues

Amazon SQS provides two types of message queues:

**Standard queues**: They offer maximum throughput, best-effort ordering, and at-least-once delivery. 
**FIFO queues**: They are designed to guarantee that messages are processed exactly once, in the exact order that they are sent.


## Creating a Queue
We can use the Amazon SQS console to create standard queues and FIFO queues. The console provides default values for all settings except for the queue name.

## Configuring a Dead-Letter Queue
A dead-letter queue is a queue that one or more source queues can use for messages that are not consumed successfully. For more information, see Amazon SQS dead-letter queues.

Amazon SQS does not create the dead-letter queue automatically. You must first create the queue before using it as a dead-letter queue..

The dead-letter queue of a FIFO queue must also be a FIFO queue. Similarly, the dead-letter queue of a standard queue must also be a standard queue.

## Sending Message to a Queue

## Consuming Message from a Queue


## Conclusion

Here is a list of the major points for a quick reference:



You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/cdkv2).

