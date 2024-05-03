---
title: "Publisher-Subscriber Pattern Using AWS SNS and SQS in Spring Boot"
categories: [ "AWS", "Spring Boot", "Java" ]
date: 2024-04-28 00:00:00 +0530
modified: 2024-04-28 00:00:00 +0530
authors: [ "hardik" ]
description: "Learn how to implement the publisher-subscriber pattern in Spring Boot applications using AWS SNS and SQS. This article guides you through configuration details using Spring Cloud AWS, IAM and resource policies, and local development using LocalStack."
image: images/stock/0112-ide-1200x628-branded.jpg
url: "publisher-subscriber-pattern-using-aws-sns-and-sqs-in-spring-boot"
---

In an event-driven architecture where multiple microservices need to communicate with each other, the publisher-subscriber pattern provides an asynchronous communication model to achieve this. It enables us to design a **loosely coupled architecture** that is easy to extend and scale.

In this article, we will be looking at how we can **use <a href='https://docs.aws.amazon.com/sns/latest/dg' target='_blank'>AWS SNS</a> and <a href='https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide' target='_blank'>SQS</a> services to implement the publisher-subscriber pattern in Spring Boot** based microservices. 

We will configure a microservice to act as a publisher and send messages to an SNS topic, and another to act as a subscriber which consumes messages from an SQS queue subscribed to that topic.

## Decoupling with SNS: Advantages over Direct Messaging Queues

Before we begin implementing our microservices, I want to explain the decision to have an SNS topic in front of an SQS queue, rather than directly using an SQS queue in both microservices. 

Traditional messaging queues like SQS, Kafka, or RabbitMQ allow asynchronous communication as well, wherein the publisher publishes the payload required by the listener of the queue. This facilitates a point-to-point communication where the publisher is aware of the existence and identity of the subscriber.

In contrast, the pub/sub pattern facilitated by SNS allows for a more loosely coupled approach. SNS acts as a **middleware** between the parties, allowing them to **evolve independently**. Using this pattern, the publisher is not concerned about who the payload is intended for, which allows it to **remain unchanged** in the event where multiple new subscribers are added to receive the same payload.

{{% github "https://github.com/thombergs/code-examples/tree/master/aws/spring-cloud-sns-sqs-pubsub" %}}

## Publisher Microservice

Now that we have understood the "Why" of our topic, we will proceed with creating our publisher microservice.

The microservice will simulate a **user management service**, where a single API endpoint is exposed to create a user record. Once this API is invoked, the service publishes a trimmed down version of the API request to the SNS topic `user-account-created` signifying successful account creation.

### Spring Cloud AWS

We will be using <a href="https://awspring.io/" target="_blank">Spring Cloud AWS</a> to establish connection and interact with the SNS service, rather than using the SNS SDK provided by AWS directly. Spring Cloud AWS is a wrapper around the official AWS SDKs, which significantly simplifies configuration and provides simple methods to interact with AWS services.

The main dependency that we will need is `spring-cloud-aws-starter-sns`, which contains all SNS related classes needed by our application.

We will also make use of Spring Cloud AWS BOM (Bill of Materials) to manage the versions of the Spring Cloud AWS dependencies in our project. The BOM ensures version compatibility between the declared dependencies, avoids conflicts and makes it easier to update versions in the future.

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

**Spring Cloud AWS will automatically create the necessary configuration beans** using the above defined properties, allowing us to interact with the SNS service in our application.

### Configuring SNS Topic ARN

**The recommended approach to interact with an SNS topic is through its Amazon Resource Name (ARN)**. We will store this property in our project's `application.yaml` file and make use of `@ConfigurationProperties` to map the defined ARN to a POJO, which our application will reference while publishing messages to SNS:

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

It is worth noting that Spring Cloud AWS also allows us to specify the SNS topic name instead of the full ARN. In such cases, the `sns:CreateTopic` permission needs to be attached to the IAM policy as well, to allow the library to fetch the ARN of the topic. However, I **do not recommend this approach to be used** since the library would create a new topic if one with the configured name doesn't already exist. Moreover, **resource creation should not be done in our Spring Boot microservices**.

### Publishing Messages to the SNS Topic

Now that we are done with the SNS related configurations, we will create a service method that accepts a DTO containing user creation details and publishes a message to the SNS topic:

```java
@Slf4j
@Service
@RequiredArgsConstructor
@EnableConfigurationProperties(AwsSnsTopicProperties.class)
public class UserService {

  private final SnsTemplate snsTemplate;
  private final AwsSnsTopicProperties awsSnsTopicProperties;

  public void create(UserCreationRequestDto userCreationRequest) {
    // save user record in database or other business logic

    var topicArn = awsSnsTopicProperties.getTopicArn();
    var payload = removePassword(userCreationRequest);
    snsTemplate.convertAndSend(topicArn, payload);
    log.info("Successfully published message to topic ARN: {}", topicArn);
  }
    
  // Rest of the service class implementation 
}
```
We have used the `SnsTemplate` class provided by Spring Cloud AWS, to publish a message to the SNS topic in our service layer. We also make use of our custom `AwsSnsTopicProperties` class to reference the SNS topic ARN defined in our active `application.yaml` file.

To finish the implementation of our publisher microservice `user-management-service`, we will expose an API endpoint on top of our service layer method:

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
If everything is configured correctly, we should see a log message in the console indicating that the service layer was invoked and the message was successfully published to our SNS topic:

```console
Successfully published message to topic ARN: <ARN-value-here>
```

## Subscriber Microservice

Now that we have our publisher microservice up and running, let's shift our focus on developing the second component of our architecture: the subscriber microservice.

For our use case, the subscriber microservice will simulate a **notification dispatcher service** that sends out account creation confirmation emails to users. It will listen for messages on an SQS queue `dispatch-email-notification` and perform the email dispatch logic, which for the sake of demonstration will be a simple log statement. (I wish everything was this easy 😆)

### SQS Queue Configuration

Similar to the publisher microservice, we will be using Spring Cloud AWS to connect to and poll messages from our SQS queue. We will take advantage of the **library's automatic deserialization and message deletion features** to simplify our implementation.

The only change needed in our `pom.xml` file is to include the SQS starter dependency:

```xml
<dependency>
  <groupId>io.awspring.cloud</groupId>
  <artifactId>spring-cloud-aws-starter-sqs</artifactId>
</dependency>
```

Similarly, in our `application.yaml` file, we need to define the necessary configuration properties required by Spring Cloud AWS to establish connection and interact with the SQS service:

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

And just like that, we have successfully given our application the ability to poll messages from our SQS queue. With the addition of the above configuration properties, Spring Cloud AWS will automatically create the necessary SQS-related beans required by our application.

### Consuming Messages from an SQS Queue

**The recommended attribute to use when interacting with a provisioned SQS queue is the queue URL**, which we will be configuring in our `application.yaml` file:

```yaml
io:
  reflectoring:
    aws:
      sqs:
        queue-url: ${AWS_SQS_QUEUE_URL}
```

We will now use the `@SqsListener` annotation provided by Spring Cloud AWS on a method in a `@Component` class, to listen to messages received on the queue and process them as required:

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

In our listener, we have referenced the queue URL defined in our `application.yaml` file using the property placeholder `(${…​})` capability in the `@SqsListener` annotation. This is why we did not create a corresponding `@ConfigurationProperties` class for it.

The payload received by the SQS queue will be automatically deserialized into a `UserCreatedEventDto` object, which we have declared as a method argument.

Once the `listen` method in our `EmailNotificationListener` class has been executed successfully i.e., it completes without any exceptions, Spring Cloud AWS will automatically delete the processed message from the queue to avoid the same message from being processed again.

### Raw Message Delivery and @SnsNotificationMessage

When an SQS queue subscribed to an SNS topic receives a message, the message contains not only the actual payload but also various metadata. **This additional metadata can cause automatic message deserialization to fail**.

One way to resolve this issue is to enable the raw message delivery attribute on our active subscription. When enabled, all the metadata is stripped from the message, and only the actual payload is delivered as is.

Another approach that allows us to deserialize the entire SNS payload without enabling the raw message delivery attribute is to use the `@SnsNotificationMessage` annotation on the method parameter:

```java
  @SqsListener("${io.reflectoring.aws.sqs.queue-url}")
  public void listen(@SnsNotificationMessage UserCreatedEventDto userCreatedEvent) {
    // processing logic
  }
```

In the above code, the `@SnsNotificationMessage` annotation automatically extracts the payload from the SNS message and deserializes it into a `UserCreatedEventDto` object.

The message format used, based on whether this attribute is enabled or not, can be viewed in this <a href="https://docs.aws.amazon.com/sns/latest/dg/sns-large-payload-raw-message-delivery.html#raw-message-examples" target="_blank">reference document</a>.

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

Since the additional permissions needed are `read-only`, there is no harm in configuring the queue name and allowing the library to fetch the URL instead. However, I would still prefer to use the queue URL directly, since it **leads to faster application startup time and avoids unnecessary calls to AWS cloud**.

## Subscribing SQS Queue to an SNS Topic

Now that we have both of our microservices set up, there's one final piece of the puzzle to connect: **subscribing our SQS queue to our SNS topic**. This will allow the messages published to the SNS topic `user-account-created` to automatically be forwarded to the SQS queue `dispatch-email-notification` for consumption by our subsriber microservice.

To create a subscription between the services, the <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-configure-subscribe-queue-sns-topic.html" target="_blank">official documentation guide</a> can be referenced.

### Resource Based Policy

Once our subscription has been created, we need to grant our SNS topic the permission to send messages to our SQS queue. This permission needs to be added to our queue's resource-based policy (Access policy).

You might wonder why this is necessary when we have already granted required IAM permissions to our microservices. The answer lies in the way AWS services communicate with each other. IAM permissions control what actions an IAM user can perform on an AWS resource, **while resource-based policies determine what actions another AWS service can perform on it**. Resource-based policies are attached to an AWS resource (SQS in this context).

In our case, we need to create a resource-based policy on the SQS queue to allow the SNS topic to send messages to it. **Without this policy, even though our microservices have the necessary IAM permissions, the SNS topic will not be able to forward messages to the SQS queue**.

Here is what our SQS resource policy should look like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "sns.amazonaws.com"
      },
      "Action": "sqs:SendMessage",
      "Resource": "sqs-queue-arn",
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "sns-topic-arn"
        }
      }
    }
  ]
}
```

In this policy, we are granting the SNS service `(sns.amazonaws.com)` permission to perform the `sqs:SendMessage` action on our SQS queue. We specify the ARNs of our SQS queue and SNS topic in the `Resource` and `Condition` field respectively to ensure that only messages from our specific topic are allowed.

Once this resource-based policy is attached to our SQS queue, the SNS topic will be able to forward messages to it, finally completing the setup of our publisher-subscriber architecture.

## Encryption at Rest Using KMS

When dealing with sensitive data, it is recommended to ensure that the data is encrypted not only in transit but also at rest. Encryption at rest, not only enhances the security of our architecture but also makes our life easier when going through HIPAA and PCI-DSS audits.

In this section, we will discuss the necessary steps to integrate our architecture with <a href="https://docs.aws.amazon.com/kms/latest/developerguide/overview.html" target="_blank">AWS KMS</a> and ensure data in our SNS topic and SQS queue is always encrypted.

To encrypt data at rest, we start by creating a **custom symmetric AWS KMS key**. Once the custom key is created, we need to enable encryption on both our SNS topic and SQS queue by configuring them to use our newly created KMS key.

After enabling encryption, our developed publisher-subscriber flow **will... drumroll please ... stop working!** 😭. This is due to our SNS topic and SQS queue not having the required permissions to perform encryption and decryption operations using our custom KMS key, also our publisher microservice now lacks the necessary IAM permissions to encrypt the data before publishing it to our SNS topic.

To resolve the above issues, we need to update our KMS key policy (resource-based policy) to include the following statements that grant SNS and SQS, the necessary permissions to interact with our custom KMS key:

```json
[
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "sqs.amazonaws.com"
      },
      "Action": [
        "kms:GenerateDataKey",
        "kms:Decrypt"
      ],
      "Resource": "kms-key-arn",
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "sqs-queue-arn"
        }
      }
    },
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "sns.amazonaws.com"
      },
      "Action": [
        "kms:GenerateDataKey",
        "kms:Decrypt"
      ],
      "Resource": "kms-key-arn",
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "sns-topic-arn"
        }
      }
    }
  ]
```

The above policy statements allows SNS and SQS to use the `kms:GenerateDataKey` and `kms:Decrypt` actions on our custom KMS key. The `Condition` block ensures that only our specific SNS topic and SQS queue are granted these permissions, conforming to **least privilege principle**.

Additionally, we need to attach the following IAM statement to the policy of the IAM user whose security credentials have been configured in our publisher microservice:

```json
{
  "Effect": "Allow",
  "Action": [
    "kms:GenerateDataKey",
    "kms:Decrypt"
  ],
  "Resource": "kms-key-arn"
}
```
The above IAM statement allows our publisher microservice to use our custom KMS key, enabling it to encrypt the data before publishing it to the SNS topic.

By configuring encryption at rest using AWS KMS, **we have further enhanced our architecture by adding an extra layer of security to it**.

## Validating Pub/Sub Functionality with LocalStack and Testcontainers

Before concluding this article, we will test the publisher-subscriber flow that we have implemented so far with an **integration test**. We will be making use of **LocalStack and Testcontainers**. Before we begin, let's look at what these two tools are:

* <a href="https://www.localstack.cloud/" target="_blank">LocalStack</a> : is a **cloud service emulator** that enables local development and testing of AWS services, without the need for connecting to a remote cloud provider. We'll be provisioning the required SNS table and SQS queue inside this emulator.
* <a href="https://java.testcontainers.org/modules/localstack/" target="_blank">Testcontainers</a> : is a library that **provides lightweight, throwaway instances of Docker containers** for integration testing. We will be starting a LocalStack container via this library.

The prerequisite for running the LocalStack emulator via Testcontainers is, as you've guessed it, **an up-and-running Docker instance**. We need to ensure this prerequisite is met when running the test suite either locally or when using a CI/CD pipeline.

### Dependencies

Let’s start by declaring the required test dependencies in our `pom.xml`:

```xml
<!-- Test dependencies -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>localstack</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.awaitility</groupId>
  <artifactId>awaitility</artifactId>
  <scope>test</scope>
</dependency>
```
The declared **`spring-boot-starter-test`** gives us the basic testing toolbox as it transitively includes JUnit, MockMVC and other utility libraries, that we will require for writing assertions and running our tests.  
And **`org.testcontainers:localstack`** dependency will allow us to run the LocalStack emulator inside a disposable Docker container, **ensuring an isolated environment for our integration test**.  
Finally, **`awaitility`** will help us validate the integrity of our asynchronous system.

### Creating AWS Resources Using Init Hooks

Localstack gives us the ability to create required AWS resources when the container is started via <a href="https://docs.localstack.cloud/references/init-hooks/" target="_blank">Initialization Hooks</a>. We will be creating a bash script `provision-resources.sh` for this purpose inside our `src/test/resources` folder:

```bash
#!/bin/bash
topic_name="user-account-created"
queue_name="dispatch-email-notification"

sns_arn_prefix="arn:aws:sns:us-east-1:000000000000"
sqs_arn_prefix="arn:aws:sqs:us-east-1:000000000000"

awslocal sns create-topic --name $topic_name
echo "SNS topic '$topic_name' created successfully"

awslocal sqs create-queue --queue-name $queue_name
echo "SQS queue '$queue_name' created successfully"

awslocal sns subscribe --topic-arn "$sns_arn_prefix:$topic_name" --protocol sqs --notification-endpoint "$sqs_arn_prefix:$queue_name"
echo "Subscribed SQS queue '$queue_name' to SNS topic '$topic_name' successfully"

echo "Successfully provisioned resources"
```

The script creates an SNS topic with name `user-account-created` and an SQS queue named `dispatch-email-notification`. After creating these resources, it subscribes the queue to the created SNS topic. We will copy this script to the path `/etc/localstack/init/ready.d` in the LocalStack container for execution in our integration test class.

### Starting LocalStack via Testcontainers

At the time of this writing, the latest version of the LocalStack image is `3.4`, we will be using this version in our integration test class:

```java
@SpringBootTest
class PubSubIT {
	
  private static final LocalStackContainer localStackContainer;
	
  // as configured in initializing hook script 'provision-resources.sh' in src/test/resources
  private static final String TOPIC_ARN = "arn:aws:sns:us-east-1:000000000000:user-account-created";
  private static final String QUEUE_URL = "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/dispatch-email-notification";
	
  static {
    localStackContainer = new LocalStackContainer(DockerImageName.parse("localstack/localstack:3.3"))
      .withCopyFileToContainer(MountableFile.forClasspathResource("provision-resources.sh", 0744), "/etc/localstack/init/ready.d/provision-resources.sh")
      .withServices(Service.SNS, Service.SQS)
      .waitingFor(Wait.forLogMessage(".*Successfully provisioned resources.*", 1));
    localStackContainer.start();
  }
	
  @DynamicPropertySource
  static void properties(DynamicPropertyRegistry registry) {
    registry.add("spring.cloud.aws.credentials.access-key", localStackContainer::getAccessKey);
    registry.add("spring.cloud.aws.credentials.secret-key", localStackContainer::getSecretKey);
		
    registry.add("spring.cloud.aws.sns.region", localStackContainer::getRegion);
    registry.add("spring.cloud.aws.sns.endpoint", localStackContainer::getEndpoint);
    registry.add("io.reflectoring.aws.sns.topic-arn", () -> TOPIC_ARN);

    registry.add("spring.cloud.aws.sqs.region", localStackContainer::getRegion);
    registry.add("spring.cloud.aws.sqs.endpoint", localStackContainer::getEndpoint);
    registry.add("io.reflectoring.aws.sqs.queue-url", () -> QUEUE_URL);		
  }

}
```

In our integration test class `PubSubIT`, we do the following:

* Start a new instance of the LocalStack container and enable the required services of **`SNS`** and **`SQS`**.
* Copy our bash script **`provision-resources.sh`** into the container to ensure AWS resource creation.
* Configure a strategy to wait for the log **`"Successfully provisioned resources"`** to be printed, as defined in our init script.
* Dynamically define the AWS configuration properties needed by our applications in order to create the required SNS and SQS related beans using **`@DynamicPropertySource`**.

With this setup, our applications will use the started LocalStack container for all interactions with AWS cloud during the execution of our integration test, providing an **isolated and ephemeral testing environment**.

### Test Case

Now that we have configured the LocalStack container successfully via Testcontainers, we can test our publisher-subscriber functionality:

```java
@SpringBootTest
@AutoConfigureMockMvc
@ExtendWith(OutputCaptureExtension.class)
class PubSubIT {
	
  @Autowired
  private MockMvc mockMvc;

  // LocalStack setup as seen above
	
  @Test
  @SneakyThrows
  void test(CapturedOutput output) {
    // prepare API request body to create user
    var name = RandomString.make();
    var emailId = RandomString.make() + "@reflectoring.io";
    var password = RandomString.make();
    var userCreationRequestBody = String.format("""
    {
      "name" : "%s",
      "emailId" : "%s",
      "password" : "%s"
    }
    """, name, emailId, password);
				
    // execute API request to create user
    var userCreationApiPath = "/api/v1/users";
    mockMvc.perform(post(userCreationApiPath)
      .contentType(MediaType.APPLICATION_JSON)
      .content(userCreationRequestBody))
      .andExpect(status().isCreated());
		
    // assert that message has been published to SNS topic
    var expectedPublisherLog = String.format("Successfully published message to topic ARN: %s", TOPIC_ARN);
    Awaitility.await().atMost(1, TimeUnit.SECONDS).until(() -> output.getAll().contains(expectedPublisherLog));
		
    // assert that message has been received by the SQS queue
    var expectedSubscriberLog = String.format("Dispatching account creation email to %s on %s", name, emailId);
    Awaitility.await().atMost(1, TimeUnit.SECONDS).until(() -> output.getAll().contains(expectedSubscriberLog));
  }

}
```
By executing the above test case, we simulate the complete flow of our publisher-subscriber architecture.

Using `MockMVC`, we invoke the user creation API endpoint exposed by our publisher microservice. We then use the `CapturedOutput` instance provided by the `OutputCaptureExtension` to assert that the expected logs are generated by both the publisher and subscriber microservices, **confirming that the message has been successfully published to the SNS topic and consumed from the SQS queue**.

With this integration test in place, we have confidently validated the functionality of our publisher-subscriber architecture.

## Conclusion

In this article, we explored how to **implement the publisher-subscriber pattern in Spring Boot microservices using AWS SNS and SQS services**.

Throughout the implementation, we made use of Spring Cloud AWS to simplify the configurations required to interact with AWS services. We also discussed the necessary IAM and resource policies required by our loosely coupled architecture to function seamlessly.

The source code demonstrated throughout this article is available on <a href="https://github.com/thombergs/code-examples/tree/master/aws/spring-cloud-sns-sqs-pubsub" target="_blank">Github</a>. The codebase is built as a Maven multi-module project and has been **integrated with LocalStack and Docker Compose, to enable local development without the need for provisioning real AWS services**. I would highly encourage you to explore the codebase and set it up locally.
