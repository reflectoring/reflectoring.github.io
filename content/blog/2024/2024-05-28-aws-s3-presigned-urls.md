---
title: "Using AWS S3 Presigned URLs in Spring Boot"
categories: [ "AWS", "Spring Boot", "Java" ]
date: 2024-05-28 00:00:00 +0530
modified: 2024-05-28 00:00:00 +0530
authors: [ "hardik" ]
description: "In this article, we demonstrate how to use AWS S3 Presigned URLs in a Spring Boot application to offload file transfers, reduce server load and improve performance. We cover required dependencies, configuration, IAM policy, generation of Presigned URLs and integration testing with LocalStack and Testcontainers."
image: images/stock/0139-stamped-envelope-1200x628-branded.jpg
url: "aws-s3-presigned-url-spring-boot"
---

When building web applications that involve file uploads or downloads, a common approach is to have the files pass through an application server. However, this can lead to **increased load on the server, consuming valuable computing resources, and potentially impacting performance**. A more efficient solution is to **offload file transfers to the client (web browsers, desktop/mobile applications) using Presigned URLs**.

Presigned URLs are **time-limited URLs that allow clients temporary access to upload or download objects directly to or from the storage solution being used**. These URLs are generated with a specified expiration time, after which they are no longer accessible.

The storage solution we'll be using in this article is <a href="https://docs.aws.amazon.com/AmazonS3/latest/userguide" target="_blank">Amazon S3 (Simple Storage Service)</a>, provided by AWS. However, it's worth noting that **the concept of Presigned URLs is not limited to AWS**. It can also be implemented with other cloud storage services like Google Cloud Storage, DigitalOcean Spaces, etc.

In this article, we'll discuss how to generate Presigned URLs in a Spring Boot application to delegate the responsibility of uploading/downloading files to the client. We'll be using **Spring Cloud AWS** to communicate with Amazon S3 and develop a service class that provides methods for generating Presigned URLs. 

These URLs will allow the client applications to securely upload and download objects to/from a provisioned S3 bucket. We'll also test our developed Presigned URL functionality using **LocalStack and Testcontainers**.

{{% github "https://github.com/thombergs/code-examples/tree/master/aws/spring-cloud-aws-s3" %}}

## Use Cases and Benefits of Presigned URLs

Before diving into the implementation, let's further discuss the use cases and advantages of using Presigned URLs to offload file transfers from our application servers:

* **Large File Downloads**: When having an entertainment or an e-learning platform that serves video courses to users, instead of serving the large video files from our application server, we can generate Presigned URLs for each video file and offload the responsibility of downloading/streaming the video directly from S3 to the client. 

  To secure this architecture, before we generate the Presigned URLs, our server can validate/authenticate the user requesting the video content. Additionally, we can restrict access to the video content to the specific IP address that originated the request. 

  By implementing Presigned URLs on applications that serve high volume of content from S3, we **reduce the load on our server(s), improve performance and make our architecture scalable**.

* **Uploading User Generated Content**: In scenarios where our application requires the users to upload files such as profile pictures, KYC documents, or other media content, instead of having the files pass through our application server, we can generate a Presigned URL with the necessary permissions and provide it to the client.

  This approach not only reduces the load on our application server but also simplifies the upload process. The client can initiate the file upload directly to S3, eliminating the need for temporary storage on our server and the additional step of forwarding the file to S3.

Now that we understand the use cases for which we can implement Presigned URLs and their benefits, let's proceed with the implementation.

## Configurations

We'll be using <a href="https://awspring.io/" target="_blank">Spring Cloud AWS</a> to connect to and interact with our provisioned S3 bucket. While interacting with S3 directly through the <a href="https://mvnrepository.com/artifact/software.amazon.awssdk/s3" target="_blank">AWS SDK for Java</a> is possible, it often leads to verbose configuration classes and boilerplate code.

Spring Cloud AWS simplifies this integration by providing a layer of abstraction over the official SDK, making it easier to interact with services like S3.

The main dependency that we need is `spring-cloud-aws-starter-s3`, which contains all S3 related classes needed by our application.

We will also make use of <a href="https://mvnrepository.com/artifact/io.awspring.cloud/spring-cloud-aws-dependencies" target="_blank">Spring Cloud AWS BOM</a> (Bill of Materials) to manage the version of the S3 starter in our project. The BOM ensures version compatibility between the declared dependencies, avoids conflicts and makes it easier to update versions in the future.

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

Now, the only thing left in order to allow Spring Cloud AWS to establish a connection with the Amazon S3 service, is to define the necessary configuration properties in our `application.yaml` file:

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

### S3 Bucket Name and Presigned URL Validity

To perform operations against a provisioned S3 bucket, we need to provide its name. And to generate Presigned URLs, we need to provide a validity duration. We'll store these properties in our `application.yaml` file and make use of `@ConfigurationProperties` to map the values to a POJO:

```java
@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "io.reflectoring.aws.s3")
public class AwsS3BucketProperties {

  @NotBlank(message = "S3 bucket name must be configured")
  private String bucketName;

  @Valid
  private PresignedUrl presignedUrl = new PresignedUrl();

  @Getter
  @Setter
  @Validated
  public class PresignedUrl {

    @NotNull(message = "S3 presigned URL validity must be specified")
    @Positive(message = "S3 presigned URL validity must be a positive value")
    private Integer validity;

  }

  public Duration getPresignedUrlValidity() {
    var urlValidity = this.presignedUrl.validity;
    return Duration.ofSeconds(urlValidity);
  }

}
```

We've added validation annotations to ensure that both the bucket name and Presigned URL validity are configured correctly. If any of the validations fail, it will result in the Spring Application Context failing to start up. This allows us to conform to the <a href="https://www.codereliant.io/fail-fast-pattern/" target="_blank">fail fast principle</a>.

When generating Presigned URLs, the validity duration needs to be provided as an instance of the `Duration` class. To facilitate this, we've also added a `getPresignedUrlValidity()` method in our class that'll be invoked by our service layer.

Below is a snippet of our `application.yaml` file, which defines the required properties that will be automatically mapped to our `AwsS3BucketProperties` class defined above:

```yaml
io:
  reflectoring:
    aws:
      s3:
        bucket-name: ${AWS_S3_BUCKET_NAME}
        presigned-url:
          validity: ${AWS_S3_PRESIGNED_URL_VALIDITY}
```

This setup allows us to externalize the bucket name and the validity duration of the Presigned URLs attributes and easily access it in our code.

This configuration **assumes that the application will be operating against a single S3 bucket and the defined validity will be applicable for both PUT and GET Presigned URLs**. If that is not the case for your application, then the `AwsS3BucketProperties` class can be modified as per requirement. 

## Generating Presigned URLs

Now that we have our configurations set up, we'll proceed to develop our service class that generates Presigned URLs for uploading and downloading objects:

```java
@Service
@RequiredArgsConstructor
@EnableConfigurationProperties(AwsS3BucketProperties.class)
public class StorageService {

  private final S3Template s3Template;
  private final AwsS3BucketProperties awsS3BucketProperties;

  public URL generateViewablePresignedUrl(String objectKey) {
    var bucketName = awsS3BucketProperties.getBucketName();
    var urlValidity = awsS3BucketProperties.getPresignedUrlValidity();

    return s3Template.createSignedGetURL(bucketName, objectKey, urlValidity);
  }

  public URL generateUploadablePresignedUrl(String objectKey) {
    var bucketName = awsS3BucketProperties.getBucketName();
    var urlValidity = awsS3BucketProperties.getPresignedUrlValidity();

    return s3Template.createSignedPutURL(bucketName, objectKey, urlValidity);
  }

}
```
We have used the `S3Template` class provided by Spring Cloud AWS in our service layer which offers a high level abstraction over the `S3Presigner` class from the official AWS SDK.

While it's possible to use the `S3Presigner` class directly, `S3Template` reduces boilerplate code and simplifies the generation of Presigned URLs by offering convenient, Spring-friendly methods.

We also make use of our custom `AwsS3BucketProperties` class to reference the S3 bucket name and the Presigned URL validity duration defined in our `application.yaml` file.

## Required IAM Permissions

To have our service layer generate Presigned URLs correctly, the IAM user whose security credentials we have configured must have the necessary permissions of `s3:GetObject` and `s3:PutObject`.

Here is what our policy should look like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::bucket-name/*"
    }
  ]
}
```

The above IAM policy **conforms to the least privilege principle**, by granting only the necessary permissions required for our service layer to generate Presigned URLs. We also specify the bucket ARN in the `Resource` field, further limiting the scope of the IAM policy to work with a single bucket that is provisioned for our application.

## Integration Testing with LocalStack and Testcontainers

Before concluding this article, we need to ensure that our configurations and service layer work correctly and are able to generate legitimate Presigned URLs. We'll be making use of LocalStack and Testcontainers to do this, but first let's look at what these two tools are:

* <a href="https://www.localstack.cloud/" target="_blank">LocalStack</a> : is a **cloud service emulator** that enables local development and testing of AWS services, without the need for connecting to a remote cloud provider. We'll be provisioning the required S3 bucket inside this emulator.
* <a href="https://java.testcontainers.org/modules/localstack/" target="_blank">Testcontainers</a> : is a library that **provides lightweight, throwaway instances of Docker containers** for integration testing. We'll be starting a LocalStack container via this library.

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

### Provisioning S3 Bucket Using Init Hooks

In order to upload and download objects from an S3 bucket via Presigned URLs, we need... **an S3 bucket**. (big brain stuff 🧠) 

Localstack gives us the ability to create required AWS resources when the container is started via <a href="https://docs.localstack.cloud/references/init-hooks/" target="_blank">Initialization Hooks</a>. We'll be creating a bash script `init-s3-bucket.sh` for this purpose inside our `src/test/resources` folder:

```bash
#!/bin/bash
bucket_name="reflectoring-bucket"

awslocal s3api create-bucket --bucket $bucket_name

echo "S3 bucket '$bucket_name' created successfully"
echo "Executed init-s3-bucket.sh"
```

The script creates an S3 bucket with name `reflectoring-bucket`. We'll copy this script to the path `/etc/localstack/init/ready.d` inside the LocalStack container for execution in our integration test class.

### Starting LocalStack via Testcontainers

At the time of this writing, the latest version of the LocalStack image is `3.4`, we'll be using this version in our integration test class:

```java
@SpringBootTest
class StorageServiceIT {

  private static final LocalStackContainer localStackContainer;

  // Bucket name as configured in src/test/resources/init-s3-bucket.sh
  private static final String BUCKET_NAME = "reflectoring-bucket";
  private static final Integer PRESIGNED_URL_VALIDITY = randomValiditySeconds();

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
    registry.add("io.reflectoring.aws.s3.presigned-url.validity", () -> PRESIGNED_URL_VALIDITY);
  }

  private static int randomValiditySeconds() {
    return ThreadLocalRandom.current().nextInt(5, 11);
  }

}
```
That's a lot of setup code 😥, let's break it down. In our integration test class `StorageServiceIT`, we do the following:

* Start a new instance of the LocalStack container and enable the **`S3`** service.
* Copy our bash script **`init-s3-bucket.sh`** into the container to ensure bucket creation.
* Configure a strategy to wait for the log **`"Executed init-s3-bucket.sh"`** to be printed, as defined in our init script.
* Configure a small random Presigned URL validity using **`randomValiditySeconds()`**.
* Dynamically define the AWS configuration properties needed by our applications in order to create the required S3 related beans using **`@DynamicPropertySource`**.

Our `@DynamicPropertySource` code block declares an additional `spring.cloud.aws.s3.endpoint` property, which is not present in the main `application.yaml` file.

**This property is necessary when connecting to the LocalStack container's S3 bucket**, `reflectoring-bucket`, as it requires a specific endpoint URL. However, when connecting to an actual AWS S3 bucket, specifying an endpoint URL is not required. AWS automatically uses the default endpoint for each service in the configured region.

The LocalStack container will be automatically destroyed post test suite execution, hence we do not need to worry about manual cleanups.

With this setup, our application will use the started LocalStack container for all interactions with AWS cloud during the execution of our integration test, providing an **isolated and ephemeral testing environment**.

### Testing the Service Layer

With the LocalStack container set up successfully via Testcontainers, we can now write test cases to ensure our service layer generates legitimate Presigned URLs that can be used to upload and download objects to/from the provisioned S3 bucket:

```java
@SpringBootTest
class StorageServiceIT {

  @Autowired
  private S3Template s3Template;

  @Autowired
  private StorageService storageService;

  // LocalStack setup as seen above

  @Test
  void shouldGeneratePresignedUrlToFetchStoredObjectFromBucket() {
    // Prepare test file and upload to S3 Bucket
    var key = RandomString.make(10) + ".txt";
    var fileContent = RandomString.make(50);
    var fileToUpload = createTextFile(key, fileContent);
    storageService.save(fileToUpload);

    // Invoke method under test
    var presignedUrl = storageService.generateViewablePresignedUrl(key);

    // Perform a GET request to the presigned URL
    var restClient = RestClient.builder().build();
    var responseBody = restClient.method(HttpMethod.GET)
        .uri(URI.create(presignedUrl.toExternalForm()))
        .retrieve()
        .body(byte[].class);

    // verify the retrieved content matches the expected file content.
    var retrievedContent = new String(responseBody, StandardCharsets.UTF_8);
    assertThat(fileContent).isEqualTo(retrievedContent);
  }

  private MultipartFile createTextFile(String fileName, String content) {
    var fileContentBytes = content.getBytes();
    var inputStream = new ByteArrayInputStream(fileContentBytes);
    return new MockMultipartFile(fileName, fileName, "text/plain", inputStream);
  }

}
```

In our initial test case, we verify that our `StorageService` class successfully generates a Presigned URL that can be used to download an object from the provisioned S3 bucket.

We begin by preparing a file with random content and name and save it to our S3 bucket. Then we invoke the `generateViewablePresignedUrl` method exposed by our service layer with the corresponding random file key.

Finally, we perform an HTTP GET request on the generated Presigned URL and assert that the API response matches with the saved file's content.

Now, to validate the functionality of uploading an object through the generated Presigned URL:

```java
@Test
void shouldGeneratePresignedUrlForUploadingObjectToBucket() {
  // Prepare test file to upload
  var key = RandomString.make(10) + ".txt";
  var fileContent = RandomString.make(50);
  var fileToUpload = createTextFile(key, fileContent);

  // Invoke method under test
  var presignedUrl = storageService.generateUploadablePresignedUrl(key);

  // Upload the test file using the presigned URL
  var restClient = RestClient.builder().build();
  var response = restClient.method(HttpMethod.PUT)
    .uri(URI.create(presignedUrl.toExternalForm()))
    .body(fileToUpload.getBytes())
    .retrieve()
    .toBodilessEntity();
  assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

  // Verify that the file is saved successfully in S3 bucket
  var isFileSaved = s3Template.objectExists(BUCKET_NAME, key);
  assertThat(isFileSaved).isTrue();
}
```

In the above test case, we again create a test file with random key and content. We invoke the `generateUploadablePresignedUrl` method of our service layer with the corresponding random file key to generate the Presigned URL.

We perform an HTTP PUT request on the generated Presigned URL and send the contents of the test file in the request body.

Finally, we make use of `S3Template` to assert that the file is indeed saved in our S3 bucket successfully.

By executing the above integration test cases, we successfully validate that our service layer generates valid Presigned URLs for both uploading and downloading objects to/from the provisioned S3 bucket.

## Conclusion

In this article, we explored how to **generate Presigned URLs in a Spring Boot application to offload file transfers from the application server to the client.**

We used **Spring Cloud AWS** to communicate with our Amazon S3 bucket and reduced boilerplate configuration code.

We discussed the benefits and use cases of using Presigned URLs, such as handling large file downloads and user generated content uploads. We walked through the necessary configurations and developed a service class that generates Presigned URLs for uploading and downloading objects to/from an S3 bucket.

We also covered the required IAM permissions and tested our implementation using LocalStack and Testcontainers to ensure the functionality works as expected.

The source code demonstrated throughout this article is available on <a href="https://github.com/thombergs/code-examples/tree/master/aws/spring-cloud-aws-s3" target="_blank">Github</a>. I would highly encourage you to explore the codebase and set it up locally.