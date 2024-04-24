---
title: "Publisher-Subscriber Pattern using AWS SNS and SQS in Spring Boot"
categories: [ "AWS", "Spring Boot", "Java" ]
date: 2024-04-23 00:00:00 +0530
modified: 2024-04-23 00:00:00 +0530
authors: [ "hardik" ]
description: "Learn how to implement the publisher-subscriber pattern in Spring Boot applications using AWS SNS and SQS. This article guides you through configuration details using Spring Cloud AWS, IAM and resource policies, and local development using LocalStack."
image: images/stock/0112-ide-1200x628-branded.jpg
url: "publisher-subscriber-pattern-using-aws-sns-and-sqs-in-spring-boot"
---

In an event-driven architecture where multiple microservices need to communicate with each other, the publisher-subscriber pattern provides an asynchronous communication model to achieve this. It enables us to design a loosely coupled architecture that is easy to extend and scale.

In this article, we will be looking at how we can use AWS SNS and SQS services to implement the publisher-subscriber pattern in Spring Boot based microservices. 

We will configure a microservice to act as a publisher to send messages to an SNS topic, and another to act as a subscriber which consumes messages from an SQS queue subscribed to that topic.

## Decoupling with SNS: Advantages over Direct Messaging Queues

Before we begin implementing our microservices, I wanted to explain the decision to have an SNS topic in front of an SQS queue, rather than directly using an SQS queue in both microservices. 

Traditional messaging queues like SQS, Kafka, or RabbitMQ allow asynchronous communication as well, wherein the publisher publishes the payload required by the listener of the queue. This facilitates point-to-point communication where the publisher is aware of the existence and identity of the subscriber.

In contrast, the pub/sub pattern facilitated by SNS allows for a more loosely coupled approach. SNS acts as middleware between the parties, allowing them to evolve independently. Using this pattern, the publisher is not concerned about who the payload is intended for, which allows it to remain unchanged in the event where multiple new subscribers are added to receive the same payload.

{{% github "https://github.com/thombergs/code-examples/tree/master/aws/spring-cloud-sns-sqs-pubsub" %}}

## Publisher Microservice

Now that we have understood the "Why" of our topic, we will proceed with creating our publisher microservice.

The microservice will simulate a user management service, where a single API endpoint is exposed to create a user record. Once this API is invoked, the service publishes a trimmed down version of the API request to the SNS topic `user-account-created` signifying successful account creation.

### Spring Cloud AWS

We will be using [Spring Cloud AWS](https://awspring.io/) to establish connection and interact with the SNS service, rather than using the SNS SDK provided by AWS directly. Spring Cloud AWS is a wrapper around the official SDK which significantly simplifies configuration and provides simple methods to interact with the SNS service.

The main dependency that we will need is `spring-cloud-aws-starter-sns`, which contains all SNS related classes for our project.

We will also make use of the Spring Cloud AWS BOM (Bill of Materials) to manage the versions of the Spring Cloud AWS dependencies in our project. The BOM ensures version compatibility between the declared dependencies, avoiding conflicts and making it easier to update versions in the future.

Here is how our `pom.xml` would look like:

```xml
	<properties>
		<spring.cloud.version>3.1.1</spring.cloud.version>
	</properties>
    
    <dependencies>
        <!-- other project dependencies -->
		<dependency>
			<groupId>io.awspring.cloud</groupId>
			<artifactId>spring-cloud-aws-starter-sns</artifactId>
		</dependency>
	</dependencies>

    <dependencyManagement>
		<dependencies>
			<dependency>
				<groupId>io.awspring.cloud</groupId>
				<artifactId>spring-cloud-aws</artifactId>
				<version>${spring.cloud.version}</version>
				<type>pom</type>
				<scope>import</scope>
			</dependency>
		</dependencies>
	</dependencyManagement>
```

The only thing left for us to establish connection with the AWS SNS service, is to define the necessary configuration properties in our `application.yaml` file:

```yaml
spring:
  cloud:
    aws:
      credentials:
        access-key: ${AWS_ACCESS_KEY}
        secret-key: ${AWS_SECRET_KEY}
      sns:
        region: ${AWS_SNS_REGION}
```

Spring Cloud AWS will automatically create the necessary configuration beans based on these properties, allowing us to interact with the SNS service in our application.

### Configuring SNS Topic ARN

The recommended approach to interact with an SNS topic is through its Amazon Resource Name (ARN). We will store this property in our project's `application.yaml` file and make use of `@ConfigurationProperties` to map the defined ARN to a POJO, which our application will reference while publishing messages to SNS.

```java
@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "io.reflectoring.aws.sns")
public class AwsSnsTopicProperties {

	@NotBlank(message = "SNS topic ARN must be configured")
	private String topicArn;

}
```
We have also added the `@NotBlank` annotation to validate that the ARN value is configured when the application starts. If the corresponding value is not provided, it would result in the Spring Application Context failing to start up.

Below is a snippet of our `application.yaml` file where we have defined the required property which will be automatically mapped to the above defined class:

```yaml
io:
  reflectoring:
    aws:
      sns:
        topic-arn: ${AWS_SNS_TOPIC_ARN}
```

### Required IAM Permissions

To publish messages to our SNS topic, the IAM user whose security credentials have been configured in our publisher microservice must have the necessary permission of `sns:Publish`.

Here is what our policy should look like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "sns-topic-arn"
    }
  ]
}
```

It is worth noting that Spring Cloud AWS also allows us to specify the SNS topic name instead of the full ARN. In such cases, the `sns:CreateTopic` permission needs to be attached to the IAM policy to allow the library to fetch the ARN of the topic. However, I **would not recommend this approach at all** as it would create a new topic if a topic with the configured name doesn't already exist. Moreover, resource creation should not be done in our Spring Boot microservices.

### Publishing Messages to SNS Topic

Now that we are done with the SNS related configurations, we will create a service class that takes in a DTO containing user creation details and, after business logic execution, publishes a message to the SNS topic.

```java
@Slf4j
@Service
@RequiredArgsConstructor
@EnableConfigurationProperties(AwsSnsTopicProperties.class)
public class UserService {

	private final SnsTemplate snsTemplate;
	private final AwsSnsTopicProperties awsSnsTopicProperties;

	public void create(UserCreationRequestDto userCreationRequest) {
		// save user record in database

		var topicArn = awsSnsTopicProperties.getTopicArn();
		var payload = removePassword(userCreationRequest);
		snsTemplate.convertAndSend(topicArn, payload);
		log.info("Successfully published message to topic ARN: {}", topicArn);
	}
    
    // Rest of the service class implementation 
}
```
We have used the `SnsTemplate` class provided by Spring Cloud AWS to publish a message to the SNS topic in our service layer. We have also made use of our custom `AwsSnsTopicProperties` class to reference the SNS topic ARN defined in our active `application.yaml` file.

To complete the implementation of our publisher microservice `user-management-service`, we will expose an API endpoint on top of our service layer:

```java
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

	private final UserService userService;

	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<HttpStatus> createUser(@Valid @RequestBody UserCreationRequestDto userCreationRequest) {
		userService.create(userCreationRequest);
		return ResponseEntity.status(HttpStatus.CREATED).build();
	}

}
```

We can now test our publisher microservice by making a POST request to the exposed API endpoint with a sample payload:

```bash
curl -X POST http://localhost:8080/api/v1/users \ 
     -H "Content-Type: application/json" \
     -d '{
          "name": "Hardik Singh Behl",
          "emailId": "behl@reflectoring.io",
          "password": "somethingSecure"
         }'
```
If everything is configured correctly, we should see a log message in the console indicating that the service layer was invoked and message was successfully published to our SNS topic:

```console
Successfully published message to topic ARN: <ARN-value-here>
```

## Subscriber Microservice

Now that we have our publisher microservice up and running, let's shift our focus to develop the second component of our publisher-subscriber implementation: the subscriber microservice.

For our use case, the subscriber microservice will simulate a `notification dispatcher service` that sends out account creation confirmation emails to users. It will listen for messages on an SQS queue `dispatch-email-notification` and perform the email dispatch logic, which for the sake of demonstration, will be a simple log statement (I wish everything was this easy 😆).

### SQS Queue Configuration

Similar to the publisher microservice, we will be using Spring Cloud AWS to connect to and poll messages from the SQS queue. We will take advantage of the library's automatic deserialization and message deletion on successful processing features to simplify our implementation.

The only change needed in our `pom.xml` file is to include the SQS starter dependency:

```xml
  <dependency>
    <groupId>io.awspring.cloud</groupId>
    <artifactId>spring-cloud-aws-starter-sqs</artifactId>
  </dependency>
```

Similarly, in our `application.yaml` file, we need to define the necessary configuration properties required by Spring Cloud AWS to establish a connection and interact with the SQS service.

```yaml
spring:
  cloud:
    aws:
      credentials:
        access-key: ${AWS_ACCESS_KEY}
        secret-key: ${AWS_SECRET_KEY}
      sqs:
        region: ${AWS_SQS_REGION}
```

And just like that, we have successfully given our application the ability to poll messages from an SQS queue. With the addition of the above configuration properties, Spring Cloud AWS will automatically create the necessary SQS-related beans required by our application.

### Consuming Messages from SQS Queue

The recommended attribute to use when interacting with a provisioned SQS queue is the queue URL, which we will be configuring in our `application.yaml` file:

```yaml
io:
  reflectoring:
    aws:
      sqs:
        queue-url: ${AWS_SQS_QUEUE_URL}
```

We will now use the `@SqsListener` annotation provided by Spring Cloud AWS on a method in a `@Component` class to listen to messages received on the queue and process them as required:

```java
@Slf4j
@Component
public class EmailNotificationListener {

	@SqsListener("${io.reflectoring.aws.sqs.queue-url}")
	public void listen(UserCreatedEventDto userCreatedEvent) {
		log.info("Dispatching account creation email to {} on {}", userCreatedEvent.getName(), userCreatedEvent.getEmailId());
		// business logic to send email
	}

}
```

We have referenced the queue URL defined in our `application.yaml` file using the property placeholder `(${…​})` capability in the `@SqsListener` annotation. This is why we did not create a corresponding `@ConfigurationProperties` class for it.

The payload received by the SQS queue will automatically be deserialized into a `UserCreatedEventDto` object that we have declared as a method argument.

Once the `listen` method in our `EmailNotificationListener` class has been executed successfully i.e., completes without any exceptions, Spring Cloud AWS will automatically delete the processed message from the queue to avoid the same message from being processed again.

### Raw Message Delivery and @SnsNotificationMessage

When an SQS queue subscribed to an SNS topic receives a message, the message contains not only the actual payload but also various metadata. This additional metadata can cause automatic message deserialization to fail.

One way to resolve this issue is by enabling the raw message delivery attribute on the active subscription. When enabled, all the metadata is stripped from the message, and only the payload is delivered as is.

Another approach that allows us to deserialize the entire SNS message without enabling the raw message delivery attribute is to use the `@SnsNotificationMessage` annotation on the method argument:

```java
  @SqsListener("${io.reflectoring.aws.sqs.queue-url}")
	public void listen(@SnsNotificationMessage UserCreatedEventDto userCreatedEvent) {
    // processing logic
	}
```

In the above code, the `@SnsNotificationMessage` annotation automatically extracts the payload from the SNS message and deserializes it into a UserCreatedEventDto object.

The message format used, based on whether this attribute is enabled or not, can be viewed in the provided [reference document](https://docs.aws.amazon.com/sns/latest/dg/sns-large-payload-raw-message-delivery.html#raw-message-examples).

### Required IAM Permissions

To have our subscriber microservice operate normally, the IAM user whose security credentials we have configured must have the necessary permissions of `sqs:ReceiveMessage` and `sqs:DeleteMessage`.

Here is what our policy should look like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage"
      ],
      "Resource": "sqs-queue-arn"
    }
  ]
}
```
Spring Cloud AWS also allows us to specify the SQS queue name instead of the queue URL. In such cases, the read only permissions of `sqs:GetQueueAttributes` and `sqs:GetQueueUrl` need to be attached to the IAM policy as well.

Since the additional permissions needed are `read-only`, there is no harm in configuring the queue name and allowing the library to fetch the URL instead. However, I would still prefer to use the queue URL directly, since it leads to faster application startup time and avoids unnecessary calls to AWS cloud.