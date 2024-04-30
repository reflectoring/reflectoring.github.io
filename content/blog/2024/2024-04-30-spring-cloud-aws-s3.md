---
title: "Using AWS S3 with Spring Cloud AWS"
categories: [ "AWS", "Spring Boot", "Java" ]
date: 2024-04-30 00:00:00 +0530
modified: 2024-04-30 00:00:00 +0530
authors: [ "hardik" ]
description: "In this article, we learn how AWS S3 can be integrated in a Spring Boot application using Spring Cloud AWS. The article details the necessary configurations, best practices, IAM policy and integration testing with LocalStack and Testcontainers."
image: images/stock/0112-ide-1200x628-branded.jpg
url: "spring-cloud-aws-s3"
---

In modern web applications, storing and retrieving files has become a common requirement. Whether its user-uploaded content like images and documents or application-generated logs and reports, having a reliable and scalable storage solution is crucial.

Once such solution provided by AWS is <a href="https://docs.aws.amazon.com/AmazonS3/latest/userguide" target="_blank">S3 (Simple Storage Service)</a>, which is a widely used, highly scalable and durable object storage service.

While interacting with AWS S3 directly through the <a href="https://mvnrepository.com/artifact/software.amazon.awssdk/s3" target="_blank">AWS SDK for Java</a> is possible, it often leads to verbose configuration classes and boilerplate code. But fortunately, the <a href="https://awspring.io/" target="_blank">Spring Cloud AWS</a> project simplifies this integration by providing a layer of abstraction over the official AWS SDK, making it easier to interact with services like S3.

In this article, we will explore how to leverage Spring Cloud AWS to easily integrate Amazon S3 in our Spring Boot application. We'll go through the required dependencies, configurations, and IAM policy in order to interact with our provisioned S3 bucket. We will use this to build our service layer that performs basic S3 operations like uploading, fetching, and deleting files.

We will also be testing our application's interaction with S3 using LocalStack and Testcontainers.

{{% github "https://github.com/hardikSinghBehl/code-examples/tree/master/aws/spring-cloud-aws-s3" %}}

## Configurations

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

### S3 Bucket Name

To interact with an S3 bucket, we need to provide it's name. We will store this property in our project’s `application.yaml` file and make use of `@ConfigurationProperties` to map the defined bucket name to a POJO, which our service layer will reference when interacting with S3:

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

We have also added the `@NotBlank` annotation to validate that the bucket name is configured when the application starts. If the corresponding value is not provided, it would result in the Spring Application Context failing to start up.

Below is a snippet of our `application.yaml` file where we have defined the required property which will be automatically mapped to the above defined class:

```yaml
io:
  reflectoring:
    aws:
      s3:
        bucket-name: ${AWS_S3_BUCKET_NAME}
```