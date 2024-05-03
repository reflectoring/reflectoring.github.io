---
title: "Using AWS S3 Presigned URLs in Spring Boot"
categories: [ "AWS", "Spring Boot", "Java" ]
date: 2024-05-02 00:00:00 +0530
modified: 2024-05-02 00:00:00 +0530
authors: [ "hardik" ]
description: "In this article, we demonstrate how to use AWS S3 Presigned URLs in a Spring Boot application to offload file transfers, reducing server load and improving performance. We cover required dependencies, configuration, IAM policy, generation of Presigned URLs and integration testing with LocalStack and Testcontainers."
image: images/stock/0139-stamped-envelope-1200x628-branded.jpg
url: "aws-s3-presigned-url-spring-boot"
---

When building web applications that involve file uploads or downloads, a common approach is to have the files pass through the application server. However, this can lead to **increased load on the server, consuming valuable computing resources, and potentially impacting performance**. A more efficient solution is to **offload file transfers to the client (web browsers, desktop/mobile applications) using Presigned URLs**.

Presigned URLs are time-limited URLs that **allow clients temporary access to upload or download objects directly to or from the storage solution being used**. These URLs are generated with a specified expiration time, after which they are no longer accessible.

The storage solution we will be using in this article is <a href="https://docs.aws.amazon.com/AmazonS3/latest/userguide" target="_blank">Amazon S3 (Simple Storage Service)</a>, provided by AWS. However, it's worth noting that **the concept of Presigned URLs is not limited to AWS**. It can also be implemented with other cloud storage services like Google Cloud Storage, DigitalOcean Spaces, etc.

In this article, we will explore how to generate S3 Presigned URLs in a Spring Boot application using Spring Cloud AWS. We'll go through the necessary configurations and create a service class that exposes methods to generate Presigned URLs for uploading objects to and downloading objects from the specified S3 bucket.

We will also test our developed Presigned URL functionality using LocalStack and Testcontainers.

## Use Cases and Benefits of Presigned URLs

Before diving into the implementation, let's further discuss the use cases and advantages of using S3 Presigned URLs to offload file transfers from your application server:

* **Large File Downloads**: When having an entertainment or an e-learning platform that serves video courses to users, instead of serving the large video files directly from our application server, we can generate Presigned URLs for each video file and offload the responsibility of downloading/streaming the video directly from S3 to the client. 

  Before generating the Presigned URL, our server can validate/authenticate the user requesting the video content. In addition to this, we can also restrict access to the video content to a specific IP address from which the request originated. 

  By implementing Presigned URLs on applications that serve high volume of content from S3, we **reduce the load on our server(s), improve performance and make our architecture scalable**.

* **Uploading User-Generated Content**: complete this point

Now that we understand the use cases for which we can implement Presigned URls and it's benefits, let's proceed with the implementation.

{{% github "https://github.com/thombergs/code-examples/tree/master/aws/spring-cloud-aws-s3" %}}

## Configurations

We will be using <a href="https://awspring.io/" target="_blank">Spring Cloud AWS</a> to connect to and interact with our provisioned S3 bucket. While interacting with S3 directly through the <a href="https://mvnrepository.com/artifact/software.amazon.awssdk/s3" target="_blank">AWS SDK for Java</a> is possible, it often leads to verbose configuration classes and boilerplate code.

Spring Cloud AWS simplifies this integration by providing a layer of abstraction over the official SDK, making it easier to interact with services like S3.

The main dependency that we will need is `spring-cloud-aws-starter-s3`, which contains all S3 related classes needed by our application.

We will also make use of <a href="https://mvnrepository.com/artifact/io.awspring.cloud/spring-cloud-aws-dependencies" target="_blank">Spring Cloud AWS BOM</a> (Bill of Materials) to manage the version of S3 starter in our project. The BOM ensures version compatibility between the declared dependencies, avoids conflicts and makes it easier to update versions in the future.

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

Now, the only thing left in order to allow Spring Cloud AWS to establish connection with the AWS S3 service, is to define the necessary configuration properties in our `application.yaml` file:

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

write what two properties are needed

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

}
```
explain validations in place

Below is a snippet of our `application.yaml` file where we have defined the required properties which will be automatically mapped to our above defined class:

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

This configuration, assumes that the application will be operating against a single S3 bucket and the defined validity will be applicable for both PUT and GET Presigned URls. If that is not the case for your application, then the `AwsS3BucketProperties` can be modified as per requirement. 

## Generating Presigned URLs

```java
@Service
@RequiredArgsConstructor
@EnableConfigurationProperties(AwsS3BucketProperties.class)
public class StorageService {

  private final S3Template s3Template;
  private final AwsS3BucketProperties awsS3BucketProperties;

  public URL generateViewablePresignedUrl(String objectKey) {
    var bucketName = awsS3BucketProperties.getBucketName();
    var urlValidity = awsS3BucketProperties.getPresignedUrl().getValidity();
    var urlValidityDuration = Duration.ofSeconds(urlValidity);

    return s3Template.createSignedGetURL(bucketName, objectKey, urlValidityDuration);
  }

  public URL generateUploadablePresignedUrl(String objectKey) {
    var bucketName = awsS3BucketProperties.getBucketName();
    var urlValidity = awsS3BucketProperties.getPresignedUrl().getValidity();
    var urlValidityDuration = Duration.ofSeconds(urlValidity);

    return s3Template.createSignedPutURL(bucketName, objectKey, urlValidityDuration);
  }

}
```

## Required IAM Permissions

## Conclusion