---
title: "Using AWS S3 with Spring Cloud AWS"
categories: [ "AWS", "Spring Boot", "Java" ]
date: 2024-05-05 00:00:00 +0530
modified: 2024-05-05 00:00:00 +0530
authors: [ "hardik" ]
description: "In this article, we learn how AWS S3 can be integrated in a Spring Boot application using Spring Cloud AWS. The article details the necessary configurations, best practices, IAM policy and integration testing with LocalStack and Testcontainers."
image: images/stock/0138-bucket-alternative-1200x628-branded.jpg
url: "spring-cloud-aws-s3"
---

In modern web applications, storing and retrieving files has become a common requirement. Whether its user uploaded content like images and documents or application generated logs and reports, having a reliable and scalable storage solution is crucial.

One such solution provided by AWS is <a href="https://docs.aws.amazon.com/AmazonS3/latest/userguide" target="_blank">Amazon S3 (Simple Storage Service)</a>, which is a widely used, highly scalable, and durable object storage service.

While interacting with the S3 service directly through the <a href="https://mvnrepository.com/artifact/software.amazon.awssdk/s3" target="_blank">AWS SDK for Java</a> is possible, it often leads to verbose configuration classes and boilerplate code. But fortunately, the <a href="https://awspring.io/" target="_blank">Spring Cloud AWS</a> project simplifies this integration by providing a layer of abstraction over the official SDK, making it easier to interact with services like S3.

In this article, we will explore how to leverage Spring Cloud AWS to easily integrate Amazon S3 in our Spring Boot application. We'll go through the required dependencies, configurations, and IAM policy in order to interact with our provisioned S3 bucket. We will use this to build our service layer that performs basic S3 operations like uploading, fetching, and deleting files.

And finally to validate our application's interaction with the AWS S3 service, we will be writing integration tests using LocalStack and Testcontainers.

{{% github "https://github.com/thombergs/code-examples/tree/master/aws/spring-cloud-aws-s3" %}}

## Configurations

The main dependency that we will need is `spring-cloud-aws-starter-s3`, which contains all the S3 related classes needed by our application.

We will also make use of <a href="https://mvnrepository.com/artifact/io.awspring.cloud/spring-cloud-aws-dependencies" target="_blank">Spring Cloud AWS BOM</a> (Bill of Materials) to manage the version of the S3 starter in our project. The BOM ensures version compatibility between the declared dependencies, avoids conflicts, and makes it easier to update versions in the future.

Here is how our `pom.xml` file would look like:

```xml
  <properties>
    <spring.cloud.version>3.1.1</spring.cloud.version>
  </properties>

  <dependencies>
    <!-- Other project dependencies... -->
    <dependency>
      <groupId>io.awspring.cloud</groupId>
      <artifactId>spring-cloud-aws-starter-s3</artifactId>
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

Now, the only thing left in order to allow Spring Cloud AWS to establish a connection with the AWS S3 service, is to define the necessary configuration properties in our `application.yaml` file:

```yaml
spring:
  cloud:
    aws:
      credentials:
        access-key: ${AWS_ACCESS_KEY}
        secret-key: ${AWS_SECRET_KEY}
      s3:
        region: ${AWS_S3_REGION}
```
Spring Cloud AWS will automatically create the necessary configuration beans using the above defined properties, allowing us to interact with the S3 service in our application.

### S3 Bucket Name

To perform operations against a provisioned S3 bucket, we need to provide it's name. We will store this property in our project’s `application.yaml` file and make use of `@ConfigurationProperties` to map the value to a POJO, which our service layer will reference when interacting with S3:

```java
@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "io.reflectoring.aws.s3")
public class AwsS3BucketProperties {

  @NotBlank(message = "S3 bucket name must be configured")
  private String bucketName;

}
```

We have also added the `@NotBlank` annotation to validate that the bucket name is configured when the application starts. If the corresponding value is not provided, it will result in the Spring Application Context failing to start up.

Below is a snippet of our `application.yaml` file where we have defined the required property which will be automatically mapped to the above defined class:

```yaml
io:
  reflectoring:
    aws:
      s3:
        bucket-name: ${AWS_S3_BUCKET_NAME}
```

This setup allows us to externalize the bucket name attribute and easily access it in our code. The created class `AwsS3BucketProperties` can be extended later on, if additional S3 related attributes are needed by our application.

## Interacting with the S3 Bucket

Now that we have our configurations set up, we will create a service class that will interact with our provisioned S3 bucket and expose the following functionalities:

* Storing a file in the S3 bucket
* Retrieving a file from the S3 bucket
* Deleting a file from the S3 bucket

```java
@Service
@RequiredArgsConstructor
@EnableConfigurationProperties(AwsS3BucketProperties.class)
public class StorageService {

  private final S3Template s3Template;
  private final AwsS3BucketProperties awsS3BucketProperties;

  public void save(MultipartFile file) {
    var objectKey = file.getOriginalFilename();
    var bucketName = awsS3BucketProperties.getBucketName();
    s3Template.upload(bucketName, objectKey, file.getInputStream());
  }

  public S3Resource retrieve(String objectKey) {
    var bucketName = awsS3BucketProperties.getBucketName();
    return s3Template.download(bucketName, objectKey);
  }

  public void delete(String objectKey) {
    var bucketName = awsS3BucketProperties.getBucketName();
    s3Template.deleteObject(bucketName, objectKey);
  }

}
```
We have used the `S3Template` class provided by Spring Cloud AWS in our service layer. `S3Template` is a high level abstraction over the `S3Client` class provided by the AWS SDK.

While it is possible to use the `S3Client` directly, `S3Template` reduces boilerplate code and simplifies interaction with S3 by offering convenient, Spring-friendly methods for common S3 operations.

We also make use of our custom `AwsS3BucketProperties` class which we had created earlier, to reference the S3 bucket name defined in our `application.yaml` file.

## Required IAM permissions

To have our service layer operate normally, the IAM user whose security credentials we have configured must have the necessary permissions of `s3:GetObject`, `s3:PutObject` and `s3:DeleteObject`.

Here is what our policy should look like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::bucket-name/*"
    }
  ]
}
```

The above IAM policy conforms to the **least privilege principle**, by granting only the necessary permissions required for our service layer to operate correctly. We also specify the bucket ARN in the `Resource` field, further limiting the scope of the IAM policy to work with a single bucket that is provisioned for our application.

## Validating Bucket Existence during Startup

If no S3 bucket exists in our AWS account corresponding to the configured bucket name in our `application.yaml` file, the service layer we have created **will encounter exceptions at runtime when attempting to interact with the S3 service**. This can lead to unexpected application behavior and a **poor user experience**.

To address this issue, we will leverage the Bean Validation API and create a custom constraint to validate the existence of the configured S3 bucket during application startup, **ensuring that our application fails fast if the bucket does not exist, rather than encountering runtime exceptions later on**:

```java
@RequiredArgsConstructor
public class BucketExistenceValidator implements ConstraintValidator<BucketExists, String> {
  
  private final S3Template s3Template;

  @Override
  public boolean isValid(String bucketName, ConstraintValidatorContext context) {
    return s3Template.bucketExists(bucketName);
  }

}
```

Our validation class `BucketExistenceValidator` implements the `ConstraintValidator` interface and injects an instance of the `S3Template` class. We override the `isValid` method and use the convenient `bucketExists` functionality provided by the injected `S3Template` instance to validate the existence of the bucket.

Next, we will create our custom constraint annotation:

```java
@Documented
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = BucketExistenceValidator.class)
public @interface BucketExists {
  
  String message() default "No bucket exists with the configured name.";
  
  Class<?>[] groups() default {};
  
  Class<? extends Payload>[] payload() default {};

}
```

The `@BucketExists` annotation is meta-annotated with `@Constraint`, which specifies the validator class `BucketExistenceValidator` that we created earlier to perform the validation logic. The annotation also defines a default error message that will be logged in case of validation failure.

Now, with our custom constraint created, we can annotate the `bucketName` field in our `AwsS3BucketProperties` class with our custom annotation `@BucketExists`:

```java
@BucketExists 
@NotBlank(message = "S3 bucket name must be configured")
private String bucketName;
```

If the bucket with the configured name does not exist, the application context will fail to start, and we will see an error message in the console similar to:

```console
***************************
APPLICATION FAILED TO START
***************************

Description:

Binding to target org.springframework.boot.context.properties.bind.BindException: Failed to bind properties under 'io.reflectoring.aws.s3' to io.reflectoring.configuration.AwsS3BucketProperties failed:

    Property: io.reflectoring.aws.s3.bucketName
    Value: "non-existent-bucket-name"
    Origin: class path resource [application.yaml] - 14:24
    Reason: No bucket exists with configured name.


Action:

Update your application's configuration
```
To finish our implementation, we need to add an additional statement to our IAM policy, one which allows permission to perform the `s3:ListBucket` action:

```json
{
  "Effect": "Allow", 
  "Action": [
    "s3:ListBucket"
  ],
  "Resource": "arn:aws:s3:::*"  
}
```
The above IAM statement is necessary for us to execute the `s3Template.bucketExists()` method in our custom validation class. 

By validating the existence of the configured S3 bucket at startup, we ensure that our application fails fast and provides clear feedback when an S3 bucket does not exist corresponding to the configured name. This approach helps maintain a more stable and predictable application behavior.

## Integration Testing

We cannot conclude this article without testing the code we have written so far. We need to ensure that our configurations and service layer work correctly. We will be making use of LocalStack and Testcontainers, but first let’s look at what these two tools are:

* <a href="https://www.localstack.cloud/" target="_blank">LocalStack</a> : is a **cloud service emulator** that enables local development and testing of AWS services, without the need for connecting to a remote cloud provider. We'll be provisioning the required S3 bucket inside this emulator.
* <a href="https://java.testcontainers.org/modules/localstack/" target="_blank">Testcontainers</a> : is a library that **provides lightweight, throwaway instances of Docker containers** for integration testing. We will be starting a LocalStack container via this library.

The prerequisite for running the LocalStack emulator via Testcontainers is, as you’ve guessed it, **an up-and-running Docker instance**. We need to ensure this prerequisite is met when running the test suite either locally or when using a CI/CD pipeline.

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
```

The declared `spring-boot-starter-test` gives us the basic testing toolbox as it transitively includes JUnit, AssertJ and other utility libraries, that we will be needing for writing assertions and running our tests.

And `org.testcontainers:localstack` dependency will allow us to run the LocalStack emulator inside a disposable Docker container, ensuring an isolated environment for our integration test.

### Provisioning S3 Bucket using Init Hooks

Localstack gives us the ability to create required AWS resources when the container is started via <a href="https://docs.localstack.cloud/references/init-hooks/" target="_blank">Initialization Hooks</a>. We will be creating a bash script `init-s3-bucket.sh` for this purpose inside our `src/test/resources` folder:

```bash
#!/bin/bash
bucket_name="reflectoring-bucket"

awslocal s3api create-bucket --bucket $bucket_name

echo "S3 bucket '$bucket_name' created successfully"
echo "Executed init-s3-bucket.sh"
```

The script creates an S3 bucket with name `reflectoring-bucket`. We will copy this script to the path `/etc/localstack/init/ready.d` inside the LocalStack container for execution in our integration test class.

### Starting LocalStack via Testcontainers

At the time of this writing, the latest version of the LocalStack image is `3.4`, we will be using this version in our integration test class:

```java
@SpringBootTest
class StorageServiceIT {

  private static final LocalStackContainer localStackContainer;

  // Bucket name as configured in src/test/resources/init-s3-bucket.sh
  private static final String BUCKET_NAME = "reflectoring-bucket";

  static {
    localStackContainer = new LocalStackContainer(DockerImageName.parse("localstack/localstack:3.4"))
        .withCopyFileToContainer(MountableFile.forClasspathResource("init-s3-bucket.sh", 0744), "/etc/localstack/init/ready.d/init-s3-bucket.sh")
        .withServices(Service.S3)
        .waitingFor(Wait.forLogMessage(".*Executed init-s3-bucket.sh.*", 1));
    localStackContainer.start();
  }

  @DynamicPropertySource
  static void properties(DynamicPropertyRegistry registry) {
    // spring cloud aws properties
    registry.add("spring.cloud.aws.credentials.access-key", localStackContainer::getAccessKey);
    registry.add("spring.cloud.aws.credentials.secret-key", localStackContainer::getSecretKey);
    registry.add("spring.cloud.aws.s3.region", localStackContainer::getRegion);
    registry.add("spring.cloud.aws.s3.endpoint", localStackContainer::getEndpoint);

    // custom properties
    registry.add("io.reflectoring.aws.s3.bucket-name", () -> BUCKET_NAME);
  }

}
```
In our integration test class `StorageServiceIT`, we do the following:

* Start a new instance of the LocalStack container and enable the **`S3`** service.
* Copy our bash script **`init-s3-bucket.sh`** into the container to ensure bucket creation.
* Configure a strategy to wait for the log **`"Executed init-s3-bucket.sh"`** to be printed, as defined in our init script.
* Dynamically define the AWS configuration properties needed by our applications in order to create the required S3 related beans using **`@DynamicPropertySource`**.

Our `@DynamicPropertySource` code block declares an additional `spring.cloud.aws.s3.endpoint` property, which is not present in the main `application.yaml` file.

This property is necessary when connecting to the LocalStack container's S3 bucket, `reflectoring-bucket`, as it requires a specific endpoint URL. However, when connecting to an actual AWS S3 bucket, specifying an endpoint URL is not required. AWS automatically uses the default endpoint for each service in the configured region.

This LocalStack container will be automatically destroyed post test suite execution, hence we do not need to worry about manual cleanups.

With this setup, our applications will use the started LocalStack container for all interactions with AWS cloud during the execution of our integration test, providing an **isolated and ephemeral testing environment**.

### Testing the Service Layer

With the LocalStack container set up successfully via Testcontainers, we can now write test cases to ensure our service layer works as expected and interacts with the provisioned S3 bucket correctly:

```java
@SpringBootTest
class StorageServiceIT {

  @Autowired
  private S3Template s3Template;

  @Autowired
  private StorageService storageService;

  // LocalStack setup as seen above

  @Test
  void shouldSaveFileSuccessfullyToBucket() {
    // Prepare test file to upload
    var key = RandomString.make(10) + ".txt";
    var fileContent = RandomString.make(50);
    var fileToUpload = createTextFile(key, fileContent);

    // Invoke method under test
    storageService.save(fileToUpload);

    // Verify that the file is saved successfully in S3 bucket
    var isFileSaved = s3Template.objectExists(BUCKET_NAME, key);
    assertThat(isFileSaved).isTrue();
  }

  private MultipartFile createTextFile(String fileName, String content) {
    var fileContentBytes = content.getBytes();
    var inputStream = new ByteArrayInputStream(fileContentBytes);
    return new MockMultipartFile(fileName, fileName, "text/plain", inputStream);
  }

}
```

In our initial test case, we verify that the `StorageService` class can successfully upload a file to the provisioned S3 bucket.

We begin by preparing a file with random content and name, we pass this test file to the `save()` method exposed by our service layer.

Finally, we make use of `S3Template` to assert that the file is indeed saved in the S3 bucket.

Now, to validate the functionality of fetching a saved file:

```java
@Test
void shouldFetchSavedFileSuccessfullyFromBucket() {
  // Prepare test file and upload to S3 Bucket
  var key = RandomString.make(10) + ".txt";
  var fileContent = RandomString.make(50);
  var fileToUpload = createTextFile(key, fileContent);
  storageService.save(fileToUpload);

  // Invoke method under test
  var retrievedObject = storageService.retrieve(key);

  // Read the retrieved content and assert integrity
  var retrievedContent = readFile(retrievedObject.getContentAsByteArray());
  assertThat(retrievedContent).isEqualTo(fileContent);
}

private String readFile(byte[] bytes) {
  var inputStreamReader = new InputStreamReader(new ByteArrayInputStream(bytes));
  return new BufferedReader(inputStreamReader).lines().collect(Collectors.joining("\n"));
}  
```

We begin by saving a test file to the S3 bucket. Then, we invoke the `retrieve()` method of our service layer with the corresponding random file key. We read the content of the retrieved file and assert that it matches with the original file content.

Finally, let's conclude by testing our delete functionality:

```java
  @Test
  void shouldDeleteFileFromBucketSuccessfully() {
    // Prepare test file and upload to S3 Bucket
    var key = RandomString.make(10) + ".txt";
    var fileContent = RandomString.make(50);
    var fileToUpload = createTextFile(key, fileContent);
    storageService.save(fileToUpload);

    // Verify that the file is saved successfully in S3 bucket
    var isFileSaved = s3Template.objectExists(BUCKET_NAME, key);
    assertThat(isFileSaved).isTrue();

    // Invoke method under test
    storageService.delete(key);

    // Verify that file is deleted from the S3 bucket
    isFileSaved = s3Template.objectExists(BUCKET_NAME, key);
    assertThat(isFileSaved).isFalse();
  }
```

In this test case, we again create a test file and upload it to our S3 bucket. We verify that the file is successfully saved using `S3Template`. Then, we invoke the `delete()` method of our service layer with the generated file key.

To verify that the file is indeed deleted from our bucket, we again use the `S3Template` instance to assert that the file is no longer present in our bucket.

By executing the above integration test cases, we simulate different interactions with our S3 bucket and ensure that our service layer works as expected.

## Conclusion

In this article, we explored how to integrate the AWS S3 service in a Spring Boot application using Spring Cloud AWS. 

We started by adding the necessary dependencies and configurations to establish a connection with the S3 service. Then, we used the auto configuration feature of Spring Cloud AWS to create a service class that performs basic S3 operations of uploading, retrieving, and deleting files.

We also discussed the required IAM permissions, and enhanced our application's behaviour by validating the existence of the configured S3 bucket at application startup using a custom validation annotation.

Finally, to ensure our application works and interacts with the provisioned S3 bucket correctly, we wrote a few integration tests using LocalStack and Testcontainers.

The source code demonstrated throughout this article is available on <a href="https://github.com/thombergs/code-examples/tree/master/aws/spring-cloud-aws-s3" target="_blank">Github</a>. I would highly encourage you to explore the codebase and set it up locally.