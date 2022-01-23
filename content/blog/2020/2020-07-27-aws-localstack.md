---
title: "Local Development with AWS on LocalStack"
categories: ["AWS"]
date: 2020-07-27T06:00:00
modified: 2020-07-27T06:00:00
authors: [pratikdas]
description: "Developing a Spring Boot App Against AWS Services with LocalStack"
image: images/stock/0074-stack-1200x628-branded.jpg
url: aws-localstack
widgets: ["simplify-form", "gyhdoca-ad", "stratospheric-ad"]
---
When we build applications with AWS, we access various AWS services for multiple purposes: store files in S3, save some data in DynamoDB, send messages to SQS, write event handlers with lambda functions, and many others. 

However, in the early days of development, we prefer to focus on writing application code instead of spending time on setting up the environment for accessing AWS services. **Setting up a development environment for using these services is time-consuming and incurs unwanted cost with AWS.** 

To avoid getting bogged down by these mundane tasks, we can use [LocalStack](https://github.com/localstack/localstack) to develop and test our applications with mock implementations of these services. 

Simply put, **LocalStack is an open-source mock of the real AWS services. It provides a testing environment on our local machine with the same APIs as the real AWS services.** We switch to using the real AWS services only in the integration environment and beyond.


{{% stratospheric %}}
This article gives only a first impression of what you can do with AWS.

If you want to go deeper and learn how to deploy a Spring Boot application to the AWS cloud and how to connect it to cloud services like RDS, Cognito, and SQS, make sure to check out the book [Stratospheric - From Zero to Production with Spring Boot and AWS](https://stratospheric.dev?utm_source=reflectoring&utm_content=in_content)!
{{% /stratospheric %}}

{{% github "https://github.com/thombergs/code-examples/tree/master/aws/localstack" %}}



## Why Use LocalStack?
The method of temporarily using dummy (or mock, fake, proxy) objects in place of actual ones is a popular way of running tests for applications with external dependencies. Most appropriately, these dummies are called [test doubles](http://xunitpatterns.com/Test%20Double.html). 

**With LocalStack, we will implement test doubles of our AWS services with LocalStack.** LocalStack supports:

1. running our applications without connecting to AWS.
2. avoiding the complexity of AWS configuration and focus on development.
3. running tests in our CI/CD pipeline. 
4. configuring and testing error scenarios.

## How To Use LocalStack 

**LocalStack is a Python application designed to run as an HTTP request processor while listening on specific ports.** 

Our usage of LocalStack is centered around two tasks:  

1. Running LocalStack.
2. Overriding the AWS endpoint URL with the URL of LocalStack.

LocalStack usually runs inside a Docker container, but we can also run it as a Python application instead. 

### Running LocalStack With Python

We first install the LocalStack package using pip:

```text
pip install localstack
```
We then start localstack with the "start" command as shown below:

```text
localstack start
```
This will start LocalStack inside a Docker container.

### Running LocalStack With Docker
We can also run LocalStack directly as a Docker image either with the Docker run command or with `docker-compose`.

We will use `docker-compose`. For that, we download the base version of `docker-compose.yml` from the [GitHub repository of LocalStack](https://github.com/localstack/localstack/blob/master/docker-compose.yml) and customize it as shown in the next section or run it without changes if we prefer to use the default configuration:

```text
TMPDIR=/private$TMPDIR docker-compose up
```

This starts up LocalStack. The part `TMPDIR=/private$TMPDIR` is required only in MacOS. 

### Customizing LocalStack
The default behavior of LocalStack is to spin up all the [supported services](https://github.com/localstack/localstack#overview) with each of them listening on port 4566. We can override this behavior of LocalStack by setting a few environment variables. 

The default port 4566 can be overridden by setting the environment variable EDGE_PORT. We can also configure LocalStack to spin up a limited set of services by setting a comma-separated list of service names as value for the environment variable SERVICES:

```text
version: '2.1'

services:
  localstack:
    container_name: "${LOCALSTACK_DOCKER_NAME-localstack_main}"
    image: images/stock/localstack/localstack-1200x628-branded.jpg
    ports:
      - "4566-4599:4566-4599"
      - "${PORT_WEB_UI-8080}:${PORT_WEB_UI-8080}"
    environment:
      - SERVICES=s3,dynamodb

```

In this `docker-compose.yml`, we set the environment variable `SERVICES` to the name of the services we want to use in our application (`S3` and `DynamoDB`).

### Connecting With LocalStack
We access AWS services via the AWS CLI or from our applications using the AWS SDK (Software Development Kit).

The AWS SDK and CLI are an integral part of our toolset for building applications with AWS services. The SDK provides client libraries in all the popular programming languages like Java, Node js, or Python for accessing various AWS services. 

Both the AWS SDK and the CLI provide an option of overriding the URL of the AWS API. We usually use this to specify the URL of our proxy server when connecting to AWS services from behind a corporate proxy server. We will use this same feature in our local environment for connecting to LocalStack.

We do this in the AWS CLI using commands like this:
```text
aws --endpointurl http://localhost:4956 kinesis list-streams
```

Executing this command will send the requests to the URL of LocalStack specified as the value of the endpoint URL command line parameter (localhost on port 4956) instead of the real AWS endpoint.

We use a similar approach when using the SDK:
 
```java
URI endpointOverride = new URI("http://localhost:4566");
S3Client s3 = S3Client.builder()
  .endpointOverride(endpointOverride )  // <-- Overriding the endpoint
  .region(region)
  .build();
```

Here, we have overridden the AWS endpoint of S3 by providing the value of the URL of LocalStack as the parameter to the `endpointOverride` method in the [S3ClientBuilder](https://sdk.amazonaws.com/java/api/latest/software/amazon/awssdk/services/s3/S3ClientBuilder.html) class.

## Common Usage Patterns 

### Creating a CLI Profile for LocalStack

**We start by creating a fake profile in the AWS CLI** so that we can later use the AWS CLI for invoking the services provided by LocalStack:

```text
aws configure --profile localstack
```

Here we create a profile named `localstack` (we can call it whatever we want).
 
This will prompt for the AWS Access Key, Secret Access Key, and an AWS region. We can provide any dummy value for the credentials and a valid region name like `us-east-1`, but we can't leave any of the values blank. 

Unlike AWS, LocalStack does not validate these credentials but complains if no profile is set. So far, it's just like any other AWS profile which we will use to work with LocalStack.

### Running CLI Commands Against LocalStack

With our profile created, **we proceed to execute the AWS CLI commands** by passing an additional parameter for overriding the endpoint URL:

```text
aws s3 --endpoint-url http://localhost:4566 create-bucket io.pratik.mybucket
```

**This command created an S3 bucket in LocalStack.**

We can also execute a regular CloudFormation template that describes multiple AWS resources:

```text
aws cloudformation create-stack \
  --endpoint-url http://localhost:4566 \
  --stack-name samplestack \
  --template-body file://sample.yaml \
  --profile localstack
```

Similarly, we can run CLI commands for all the [services](https://github.com/localstack/localstack#overview) supported and spun up by our instance of LocalStack.

### Running JUnit Tests Against LocalStack

If we want to run tests against the AWS APIs, we can do this from within a JUnit test.

**At the start of a test, we start LocalStack as a Docker container on a random port and after all tests have finished execution we stop it again:** 

```java
@ExtendWith(LocalstackDockerExtension.class)
@LocalstackDockerProperties(services = { "s3", "sqs" })
class AwsServiceClientTest {

    private static final Logger logger = Logger.getLogger(AwsServiceClient.class.getName());

    private static final Region region = Region.US_EAST_1;
    private static final String bucketName = "io.pratik.mybucket";

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
}
```

The code snippet is a JUnit Jupiter test used to test a Java class to store an object in an S3 bucket. `LocalstackDockerExtension` in the `ExtendsWith` annotation is the JUnit test runner that pulls and runs the latest LocalStack Docker image and stops the container when tests are complete. 

The container is configured to spin up S3 and DynamoDB services with the `@LocalstackDockerProperties` annotation. 

Note that the LocalStack endpoint is allocated dynamically and is accessed using methods in the form of `Localstack.INSTANCE.getEndpointS3()` in our setup method. Similarly, we use `Localstack.INSTANCE.getEndpointDynamoDB()` to access the dynamically allocated port for DynamoDB.

## Using LocalStack with Spring Boot

### Configuring a Spring Boot Application to Use LocalStack

Now, we will create a simple customer registration application using the popular [Spring Boot](https://spring.io/projects/spring-boot) framework. Our application will have an API that will take a first name, last name, email, mobile, and a profile picture. This API will save the record in DynamoDB, and store the profile picture in an S3 bucket. 

We start by creating a Spring Boot REST API using [https://start.spring.io](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.3.1.RELEASE&packaging=jar&jvmVersion=14&groupId=io.pratik&artifactId=customerregistration&name=customerregistration&description=Spring%20Boot%20with%20Dynamodb%20and%20S3%20to%20demonstrate%20LocalStack&packageName=io.pratik.customerregistration&dependencies=lombok,web) with dependencies to the web and [Lombok](https://projectlombok.org/features/all) modules. 

Next, we add the AWS dependencies to our `pom.xml`:

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

We have also added a test scoped dependency on LocalStack to start the LocalStack container when the JUnit test starts.  

After that, we create the controller class containing the endpoint and two service classes for invoking the S3 and DynamoDB services.

We use the default Spring Boot profile for real AWS services and create an additional profile named "local" for testing with LocalStack (mock AWS services). The LocalStack URL is configured in `application-local.properties`: 

```application-local.properties
aws.local.endpoint=http://localhost:4566
```

Let's now take a look at the service class connecting to DynamoDB: 

```java
@Service
public class CustomerProfileStore {
    private static final String TABLE_NAME = "entities";
    private static final Region region = Region.US_EAST_1;
    
    private final String awsEndpoint;
    
    public CustomerProfileStore(@Value("${aws.local.endpoint:#{null}}") String awsEndpoint) {
        super();
        this.awsEndpoint = awsEndpoint;
    }

    private DynamoDbClient getDdbClient() {
        DynamoDbClient dynamoDB = null;;
        try {
            DynamoDbClientBuilder builder = DynamoDbClient.builder();
            // awsLocalEndpoint is set only in local environments
            if(awsEndpoint != null) {
                // override aws endpoint with localstack URL in dev environment
                builder.endpointOverride(new URI(awsEndpoint));
            }
            dynamoDB = builder.region(region).build();
        }catch(URISyntaxException ex) {
            log.error("Invalid url {}",awsEndpoint);
            throw new IllegalStateException("Invalid url "+awsEndpoint,ex);
        }
        return dynamoDB;
    }
    
```
We inject the URL of LocalStack from the configuration parameter `aws.local.endpoint`. The value is set only when we run our application using the local profile, else it has the default value `null`. 

In the method `getDdbClient()`, we pass this variable to the `endpointOverride()` method in the DynamoDbClientBuilder class only if the variable `awsLocalEndpoint` has a value which is the case when using the local profile.

I created the AWS resources - S3 Bucket and DynamoDB table using a [cloudformation template](https://github.com/thombergs/code-examples/tree/master/aws/localstack/sample.yaml). I prefer this approach instead of creating the resources individually from the console. It allows me to create and clean up all the resources with a single command at the end of the exercise following the principles of Infrastructure as Code.

### Running the Spring Boot Application

First, we start LocalStack with `docker-compose` as we did before.

Next, We create our resources with the CloudFormation service:

```text
aws cloudformation create-stack \
  --endpoint-url http://localhost:4566 \
  --stack-name samplestack \
  --template-body file://sample.yaml \
  --profile localstack
```

Here we define the S3 bucket and DynamoDB table in a CloudFormation Template file - [sample.yaml](https://github.com/thombergs/code-examples/tree/master/aws/localstack/sample.yaml).
After creating our resources, we run our Spring Boot application with the spring profile named "local":

```text
java -Dspring.profiles.active=local -jar target/customerregistration-1.0.jar
```

I have set 8085 as the port for my application. I tested my API by sending the request using curl. You can also use Postman or any other REST client:

```text
curl -X POST 
     -H "Content-Type: application/json" 
     -d '{"firstName":"Peter","lastName":"Parker", 
          "email":"peter.parker@fox.com", "phone":"476576576", 
          "photo":"iVBORw0KGgo...AAAASUVORK5CYII="
         }' 
       http://localhost:8085/customers/
```

Finally, we run our Spring Boot app connected to the real AWS services by switching to the default profile.

## Conclusion

We saw how to use LocalStack for testing the integration of our application with AWS services locally. Localstack also has an [enterprise version](https://localstack.cloud/#pricing) available with more services and features. 

I hope this will help you to feel empowered and have more fun while working with AWS services during development and lead to higher productivity, shorter development cycles, and lower AWS cloud bills.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/localstack).

{{% stratospheric %}}
This article gives only a first impression of what you can do with AWS.

If you want to go deeper and learn how to deploy a Spring Boot application to the AWS cloud and how to connect it to cloud services like RDS, Cognito, and SQS, make sure to check out the book [Stratospheric - From Zero to Production with Spring Boot and AWS](https://stratospheric.dev?utm_source=reflectoring&utm_content=in_content)!
{{% /stratospheric %}}