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

One such solution provided by AWS is <a href="https://docs.aws.amazon.com/AmazonS3/latest/userguide" target="_blank">S3 (Simple Storage Service)</a>, which is a widely used, highly scalable and durable object storage service.

While interacting with AWS S3 directly through the <a href="https://mvnrepository.com/artifact/software.amazon.awssdk/s3" target="_blank">AWS SDK for Java</a> is possible, it often leads to verbose configuration classes and boilerplate code. But fortunately, the <a href="https://awspring.io/" target="_blank">Spring Cloud AWS</a> project simplifies this integration by providing a layer of abstraction over the official AWS SDK, making it easier to interact with services like S3.

In this article, we will explore how to leverage Spring Cloud AWS to easily integrate Amazon S3 in our Spring Boot application. We'll go through the required dependencies, configurations, and IAM policy in order to interact with our provisioned S3 bucket. We will use this to build our service layer that performs basic S3 operations like uploading, fetching, and deleting files.

We will also be testing our application's interaction with S3 using LocalStack and Testcontainers.

{{% github "https://github.com/thombergs/code-examples/tree/master/aws/spring-cloud-aws-s3" %}}

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

This setup allows us to externalize the bucket name attribute and easily access it in our code. The created class `AwsS3BucketProperties` can be extended in future, if additional S3-related attributes are needed by our application.

## Interacting with S3 Bucket

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

While it's possible to use the `S3Client` directly, `S3Template` reduces boilerplate code and simplifies interacting with S3 by offering convenient, Spring-friendly methods for common S3 operations.

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

## Validating Bucket Existence at Startup

If no S3 bucket exists in our AWS account corresponding to the configured bucket name in our `application.yaml` file, the service layer we have created, when attempting to interact with the S3 service, will result in exceptions at runtime, leading to unexpected application behavior and a poor user experience.

To address this issue, we will leverage the Bean Validation API and create a custom constraint to validate the existence of the configured S3 bucket during application startup, ensuring that our application fails fast if the bucket does not exist, rather than encountering runtime exceptions later on:

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

Our validation class `BucketExistenceValidator` implements the `ConstraintValidator` interface and injects an instance of the `S3Template` class. We override the `isValid` method and use the convenient `bucketExists` functionality provided by the injected `S3Template` instance to check the existence of the bucket.

Next, we will create our custom constraint annotation:

```java
@Documented
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = BucketExistenceValidator.class)
public @interface BucketExists {
  
  String message() default "No bucket exists with configured name.";
  
  Class<?>[] groups() default {};
  
  Class<? extends Payload>[] payload() default {};

}
```

The `@BucketExists` annotation is meta-annotated with `@Constraint`, which specifies the validator class `BucketExistenceValidator` that we created earlier to perform the validation logic. The annotation also defines a default error message that will be used when the validation fails.

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

By validating the existence of the configured S3 bucket at startup, we can ensure that our application fails fast and provides clear feedback when an S3 bucket does not exist corresponding to the configured name. This approach helps maintain a more stable and predictable application behavior.

## Conclusion

In this article, we explored how to integrate AWS S3 in a Spring Boot application using Spring Cloud AWS. 

We started by adding the necessary dependencies and configurations to establish connection with the S3 service. Then, we used the auto-configuration feature of Spring cloud AWS to create a service class that performs basic S3 operations of uploading, retrieving, and deleting files.

We also discussed the required IAM permissions, and enhanced our application's behaviour by validating the existence of the configured S3 bucket at application startup using a custom validation annotation.

Finally, to ensure our application works and interacts with the provisioned S3 bucket correctly, we wrote a few integration tests using LocalStack and Testcontainers.

The source code demonstrated throughout this article is available on <a href="https://github.com/thombergs/code-examples/tree/master/aws/spring-cloud-aws-s3" target="_blank">Github</a>. I would highly encourage you to explore the codebase and set it up locally.