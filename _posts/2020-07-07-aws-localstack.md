---
title: "Local development with AWS on LocalStack"
categories: [craft]
date: 2020-06-30 06:00:00 +1100
modified: 2020-06-30 06:00:00 +1100
author: pratikdas
excerpt: "This article describes LocalStack as a useful aid to test your AWS services locally."
image:
  auto: 0072-aws
---
During the initial days of development, we prefer to focus on writing code for our application instead of spending time on setting up the environment for accessing AWS services. We access various AWS services while building our applications - for example, upload files in S3, store some data in DynamoDb, send messages to SQS, etc.  

**Setting up a development environment for using these services is complex and time-consuming.** Instead, we use [LocalStack](https://github.com/localstack/localstack) to develop and unit test our applications with mock implementations of these services. We switch to the real services only in the integration environment and beyond.

{% include github-project.html url="https://github.com/pratikdas/localstack" %}

## Why Use LocalStack?
The method of temporarily using dummy (or mock, fake, proxy) objects in place of actual ones is a time-tested way of running unit tests for applications having external dependencies. Most appropriately, these dummies are called [test doubles](http://xunitpatterns.com/Test%20Double.html). 

Some methods to create test doubles are:

1. Manual - Creating and using mock objects with frameworks like Mockito during unit testing.
2. DIY (Do It yourself) - Using a homegrown solution deployed as a service running in a separate process, or embedded in our code.

**We'll implement test doubles of our AWS services with LocalStack.**

LocalStack gives a good alternative to both these approaches. With LocalStack, we can:

1. run our applications without connecting to AWS.
2. avoid the complexity of AWS configuration and focus on development.
3. run tests in our CI/CD pipeline. 
4. configure and test error scenarios.

## Overriding AWS Endpoints
Our usage of LocalStack revolves around two core aspects:  

1. Run LocalStack in a Docker container.
2. Override the AWS endpoint URL with URL of LocalStack.

**LocalStack is a Python application designed to run as an HTTP request processor, listening on specific ports.** We run the Docker image of LocalStack.

We access AWS services from the CLI or our applications using the AWS SDK (Software Development Kit).

The AWS SDK (Software Development Kit) and CLI are an integral part of our toolset for building applications with AWS services. The SDK provides client libraries in all the popular programming languages like java, Node js, or Python for accessing various AWS services. 

Both the AWS SDK and the CLI give an option of overriding the URL of the AWS API in the local environment for connecting to LocalStack.

We do this in AWS CLI using commands like this:
```
aws --endpointurl http://localhost:4956 kinesis list-streams
```

This will send requests to Kinesis to localhost on port 4956 instead of to the real AWS endpoint.

We can do it similarly in the SDK:
 
```java
URI endpointOverride = new URI("http://localhost:4566");
S3Client s3 = S3Client.builder()
  .endpointOverride(endpointOverride )
  .region(region)
  .build();
```

Here, we have overridden the endpoint to S3.

## Running LocalStack

We run LocalStack either as a Python application using our local Python installation or alternately using a Docker image. 

### Run with Python

This starts a Docker container with the below output.

```
pip install localstack
```

```
localstack start
```


 We can also run as Docker image wuth the Docker run command or docker-compose.


## Running CLI Commands Against LocalStack

### Create a Profile for the AWS CLI
We start by creating a profile for the AWS CLI so that we can later use the AWS CLI against the services provided by LocalStack:

```
aws configure --profile localstack
```

Here we create a profile named `localstack`. You can use any other name. 
Provide any value you like for AWS Access Key and Secret Access Key and a valid AWS region like `us-east-1`, but don't leave them blank. 

Unlike AWS, LocalStack does not validate these credentials but complains if no profile is set. So far, it is just like any other AWS profile which we will use to work with LocalStack.

### Execute CLI Commands
With our profile created, we execute CLI commands by passing an additional parameter for overriding the endpoint URL:
```
aws s3 --endpoint-url http://localhost:4566 create-bucket io.pratik.mybucket
```
**This command created an S3 bucket in LocalStack.**

We can also execute a regular CloudFormation template that describes multiple AWS resources:

```
aws cloudformation create-stack \
  --endpoint-url http://localhost:4566 \
  --stack-name samplestack \
  --template-body file://sample.yaml \
  --profile localstack
```

### Running JUnit Tests Against LocalStack
If we want to run tests against the AWS APIs, we can do this from within a JUnit test.

**At the start of a test, we start LocalStack as a Docker container on a random port and after all tests have finished execution we stop it again:** 

```java
@ExtendWith(LocalstackDockerExtension.class)
@LocalstackDockerProperties(services = { "s3", "sqs" })
class AwsServiceClientTest {

	private static final Logger logger = Logger.getLogger(AwsServiceClient.class.getName());

	private static final Region region = Region.US_EAST_1;
	private static final String bucketName = "io.pratik.poc";

	private AwsServiceClient awsServiceClient = null;

	@BeforeEach
	void setUp() throws Exception {
		String endpoint = Localstack.INSTANCE.getEndpointS3();
		awsServiceClient = new AwsServiceClient(endpoint);
		createBucket();
	}

	@Test
	void testStoreInS3() {
		logger.info("Executing test...");
		awsServiceClient.storeInS3("image1");
		assertTrue(keyExistsInBucket(), "Object created");
	}
```

The code snippet is a JUnit Jupiter test used to test a java class to store an object in an S3 bucket.

## Configuring a Spring Boot Application to use LocalStack

### A Spring Boot Application using S3 and DynamoDB

We'll create a simple customer registration application using the popular [Spring Boot](https://spring.io/projects/spring-boot) framework. Our application will have an API that will take a first name, last name, email, mobile, and a profile picture. This API will save the record in DynamoDB, and store the profile picture in an S3 bucket. 

We'll start with creating a Spring boot REST API using [https://start.spring.io](https://start.spring.io) with minimum dependencies for web and Lombok. 

Next, we create a `docker-compose.yml` file that we can use to start up LocalStack:

```
version: '2.1'

services:
  localstack:
    container_name: "${LOCALSTACK_DOCKER_NAME-localstack_main}"
    image: localstack/localstack
    ports:
      - "4566-4599:4566-4599"
      - "${PORT_WEB_UI-8080}:${PORT_WEB_UI-8080}"
    environment:
      - SERVICES=s3,dynamodb

```

In `docker-compose.yml`, we set the environment variable `SERVICES` to the name of the services we want to use from our application (`s3` and `dynamodb`).

To connect to the AWS services, we need to add the dependencies to the AWS SDKs to our `pom.xml`:

```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>dynamodb</artifactId>
</dependency>
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
</dependency>
<dependency>
    <groupId>cloud.localstack</groupId>
    <artifactId>localstack-utils</artifactId>
    <version>0.2.1</version>
    <scope>test</scope>
</dependency>
```
I created the controller class containing the endpoint and two service classes for invoking the S3 and DynamoDB services.
I used the default profile for real AWS services and created an additional profile named "local" for testing with LocalStack (mock AWS services). The LocalStack URL is configured in application-local.properties. Let us take a look at our CustomerProfileStore class. 


```java
@Service
public class CustomerProfileStore {
	private static final String TABLE_NAME = "entities";
	private static final Region region = Region.US_EAST_1;
	
	private final String awsLocalEndpoint;
	
	public CustomerProfileStore(@Value("${aws.local.endpoint:#{null}}") String awsLocalEndpoint) {
		super();
		this.awsLocalEndpoint = awsLocalEndpoint;
	}

	private DynamoDbClient getDdbClient() {
		DynamoDbClient dynamoDB = null;;
		try {
			DynamoDbClientBuilder builder = DynamoDbClient.builder();
			// awsLocalEndpoint is set only in local environments
			if(awsLocalEndpoint != null) {
				// override aws endpoint with localstack URL in dev environment
				builder.endpointOverride(new URI(awsLocalEndpoint));
			}
			dynamoDB = builder.region(region).build();
		}catch(URISyntaxException ex) {
			log.error("Invalid url {}",awsLocalEndpoint);
		}
		return dynamoDB;
	}
	
```
We inject the URL of LocalStack using the variable `awsLocalEndpoint`. The value is set only when we run our application using the local profile, else it has the default value null. 

In the method `getDdbClient()`, we pass this variable to the `endpointOverride()` method in the DynamoDbClientBuilder class only if the variable awsLocalEndpoint has a value which is the case when using the local profile.

I created the AWS resources - S3 Bucket and DynamoDB table using a [cloudformation template](https://github.com/pratikdas/localstack/blob/master/cloudformation/sample.yaml). I prefer this approach instead of creating the resources individually from the console. It allows me to create and clean up all the resources with a single command at the end of the exercise following IAC principles.

### Running the application

We start LocalStack with docker-compose using the command:
```
TMPDIR=/private$TMPDIR docker-compose up
```
The part `TMPDIR=/private$TMPDIR` is required only in macOS.

We create our S3 bucket and DynamoDB table by executing our CloudFormation Template:

```
aws cloudformation create-stack \
  --endpoint-url http://localhost:4566 \
  --stack-name samplestack \
  --template-body file://sample.yaml \
  --profile localstack
```
The output will look similar to the below if the command executes successfully.

```
{
    "StackId": "arn:aws:cloudformation:us-east-1:000000000000:stack/samplestack/bb74d80d-0e02-4ddd-a2fc-b7432b22fd3a"
}
```

After creating our resources, we will run our Spring Boot application with the local profile.
```
java -Dspring.profiles.active=local -jar target/customerregistration-1.0.jar
```
I have set 8085 as the port for my application. I tested my API by sending the request using curl. You can also use Postman or any other REST client.

```
curl -X POST -H "Content-Type: application/json" -d '{"firstName":"Peter","lastName":"Parker", "email":"peter.parker@fox.com", "phone":"476576576", "photo":"rtruytiutiuyo"}' http://localhost:8085/customers/
```

Finally, we run our Spring Boot app connected to the real AWS services by switching to the default profile.


## Summary

We saw how to use LocalStack for testing the integration of our application with AWS services locally. Localstack also has an enterprise version available with more services. I hope this will help you to feel empowered and have more fun while working with AWS services during development. Ultimately leading to higher productivity, shorter development cycles, and lower AWS cloud bills.

You can refer to all the source code used in the article in my [Github repository](https://github.com/pratikdas/localstack).