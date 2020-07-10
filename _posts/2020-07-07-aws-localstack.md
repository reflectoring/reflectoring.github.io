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
During the initial days of development, we prefer to focus on writing code for our application instead of spending time on setting up the environment for accessing AWS services. We access various AWS services while building our applications - for example, upload files in S3, store some data in DynamoDb, send message to SQS, etc.  

***Setting up a development environment for using these services is complex and time-consuming. Instead, we use [LocalStack](https://github.com/localstack/localstack) to develop and unit test our applications with mock implementations of these services.*** We switch to the real services only in the integration environment and beyond.

 {% include github-project.html url="https://github.com/pratikdas/localstack" %}

## Why Use LocalStack
The method of temporarily using dummy (mock, fake, proxy, and several others are part of the folklore) objects in place of actual ones is a time tested way of running unit tests on applications having external dependencies, most appropriately called [Test Doubles](http://xunitpatterns.com/Test%20Double.html).
***We implement Test Double of our AWS services with LocalStack.*** 

Some of the other methods of doing this are -

1. Manual - Using mock objects with frameworks like Mockito during unit testing.
2. DIY (Do It yourself) - Using a homegrown solution deployed as a service running in a separate process, or embedded in our code.

LocalStack gives a good alternative to both these approaches.
1. With Localstack we can run our applications without connecting to AWS.
2. Avoid the complexity of AWS configuration and focus on development.
3. Integrate LocalStack in our DevOps pipeline. 
4. Enrich our test leveraging LocalStack's integration with JUnit using a runner and a JUnit 5 extension
5. Limited Error scenarios can be configured

## Making This Work - Docker & AWS Endpoint Override
Our usage of LocalStack revolves around two core aspects - 

1. Run LocalStack in a Docker container

2. Override the AWS endpoint with URL of LocalStack

***LocalStack is a python application designed to run as an HTTP request processor, listening on specific ports.*** We run the docker image of LocalStack.

We access AWS services from the CLI or our applications using the AWS SDK (Software Development Kit).

The AWS SDK (Software Development Kit) and CLI are an integral part of our toolset for building applications with AWS services. The SDK provides client libraries in all the popular programming languages like java, node js, python for accessing various AWS services. It essentially does the heavy-lifting of securely connecting to the AWS services.

Both the AWS SDK and the CLI give an option of overriding the URL of AWS API in the local environment for connecting to LocalStack.
We do this in AWS CLI using commands like this:
```
aws --endpointurl http://localhost:4956 kinesis list-streams
```
I am connecting to LocalStack on port 4956.

Similarly in SDK our code looks will resemble the below snippet - 
```java
URI endpointOverride = new URI("http://localhost:4566");
S3Client s3 = S3Client.builder().endpointOverride(endpointOverride ).region(region).build();
```

## How To Run LocalStack

We run LocalStack either as a python application using our local python installation or alternately using a docker image. 

### Run with python
```
pip install localstack
```
```
localstack start
```
This starts a docker container with the below output.

[![Console](/assets/img/posts/aws-localstack/localstackconsole.png)](/assets/img/posts/aws-localstack/localstackconsole.png)

 We can also run as docker image wuth the docker run command or docker-compose.


## Common Usages

#### Create Fake Profile
We start in the usual way by creating a profile with any arbitrary credentials.
```
aws configure --profile localstack
```
Here we create a profile named localstack. You can use any other name. 
Provide any value you like for aws Access Key and Secret Access Key and a valid AWS region like us-east-1 except leaving them blank. Unlike AWS, LocalStack does not validate these credentials but complains if no profile is set. So far, it is just any other AWS profile which we will use to work with LocalStack.

#### Execute CLI Commands
With our profile created, we execute CLI commands by passing an additional parameter for overriding the endpoint URL as shown here.
```
aws s3 --endpoint-url http://localhost:4566 create-bucket io.pratik.mybucket
```
***We create an S3 bucket in LocalStack by overriding the endpoint URL.***
Next, we execute a regular cloudformation template to create a stack composed of an S3 bucket and a DynamoDB table.

```
aws cloudformation --endpoint-url http://localhost:4566 create-stack --stack-name samplestack --template-body file://sample.yaml --profile localstack
```

```
aws cloudformation --endpoint-url http://localhost:4566 delete-stack --stack-name samplestack --profile localstack
```

### Execute JUnit Tests
While running as JUnit, ***LocalStack is started as a docker container at a random port and stopped after all tests have finished execution.*** 

The code snippet is a JUnit Jupiter test used to test a java class to store an object in an S3 bucket.

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


### Spring Boot Application using S3 and DynamoDB

We will create a simple customer registration application using the popular [Spring Boot](https://spring.io/projects/spring-boot) framework. Our application will have an API that will take a first name, last name, email, mobile, and a profile picture. This API will save the record in DynamoDB, and store the profile picture in an S3 bucket. 

I started by creating a Spring boot rest API using https://start.spring.io with minimum dependencies for web, and Lombok. I created docker-compose.yml. The below snippet shows the environment variable SERVICES set to the name of services (s3 and dynamodb) I need to spin up for my application.

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

I added the AWS SDK dependencies for S3 and DynamoDB to the pom.xml of the application generated in the previous step.

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

##### Endpoint Override in local profile
```java
@Service
public class CustomerProfileStore {
	
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
We inject the URL of LocalStack using the variable - awsLocalEndpoint. The value is set only when we run our application using the local profile, else it has the default value null. In the method named getDdbClient, the value is set with the endpointOverride method in the DynamoDbClientBuilder class only if the variable awsLocalEndpoint has a value which is the case when using the local profile.

I created the AWS resources - S3 Bucket and DynamoDB table using a [cloudformation template](https://github.com/pratikdas/localstack/blob/master/cloudformation/sample.yaml). I prefer this approach instead of creating the resources individually from the console. It allows me to create and clean up all the resources with a single command at the end of the exercise following IAC principles.

#### Running Spring Boot application

We start LocalStack with docker-compose using the command - 
```
TMPDIR=/private$TMPDIR docker-compose up
```
The first part - TMPDIR=/private$TMPDIR is required only in macOS.

We create our S3 bucket and DynamoDB table by executing our CloudFormation Template.

```
aws cloudformation --endpoint-url http://localhost:4566 create-stack --stack-name samplestack --template-body file://sample.yaml --profile localstack
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

Finally, we run our spring boot app connected to AWS by switching to the default profile. We run our application with the default profile


## Summary

We saw how to use LocalStack for testing the integration of our application with AWS services locally. Localstack also has an enterprise version available with more services. I hope this will help you to feel empowered and have more fun while working with AWS services during development. Ultimately leading to higher productivity, shorter development cycles, and lower AWS Cloud bills.

You can refer to all the source code used in the article in my [Github repository](https://github.com/pratikdas/localstack).