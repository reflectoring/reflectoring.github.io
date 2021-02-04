---
title: "Getting Started with AWS S3 and Spring Boot"
categories: [spring-boot]
date: 2021-02-03 00:00:00 +0100
modified: 2021-02-03 00:00:00 +0100
author: mmr
excerpt: "Learn how to use Spring Boot and AWS S3 to build you own file sharing application."
image:
  auto: 0090-404
---

In this article, **we are going to explore AWS' Simple Storage Service (S3) together with Spring Boot to build a custom file-sharing application** (just like in the good old days before Google Drive, Dropbox & co).

As you will learn, S3 is an extremely versatile and easy to use solution for a variety of use cases.

{% include github-project.html url="" %}

### What is S3?
S3 stands for "simple storage service" and is an object store service hosted on Amazon Web Services (AWS) - but what does this exactly mean?

You are probably familiar with databases (of any kind). Let's take Postgres for example. Postgres is a relational database, very well suited for storing structured data that has a schema that won't change too much over its lifetime (e.g. financial transaction records). But what if you want to store more than just plain data? What if you want to store a picture, a PDF, a document, or a video?

It is technically possible to [store those binary files in Postgres](https://www.postgresql.org/docs/current/datatype-binary.html) but  **object stores like S3 might be better suited for storing unstructured data**.

### Object Store vs. File Store 

So you might ask yourself, how is an object store different from a file store? Without going into the gory details,  **an object store is a repository that stores objects in a flat structure**, similar to a key-value store. 

Opposed to file-based storage where we have a hierarchy of files inside folders, inside folders,... **the only thing we need to get an item out of an object store is the key of the object we want to retrieve**. Additionally, we can provide metadata (data about data) that we attach to the object to further enrich it.

If you want to take a deeper look into the differences, I recommend going through [this article](https://www.redhat.com/en/topics/data-storage/file-block-object-storage).

## Basic S3 concepts
S3 was one of the first services offered by AWS in 2006. Since then, a lot of features have been added, but **the core concepts of S3 are still Buckets and Objects**.

### Buckets
Buckets are containers of objects you want to store. An important thing to note here is that S3 requires the name of the bucket to be globally unique.

### Objects
Objects are the actual things you are storing in S3. **They are identified by a key** which is a *sequence of Unicode characters whose UTF-8 encoding is at most 1,024 bytes long*.

### Key Delimiter
By default, the "/" character gets special treatment if used in an object key. As written above, an object store does not use directories or folders but just keys. However, if you use a "/" in your object key, the AWS S3 console will render the object as if it was in a folder. 

So, if your object has the key "foo/bar/test.json" the console will show a "folder" *foo* which contains a "folder" *bar* which contains the actual object. This *key delimiter* helps you to group your data into logical hierarchies.

## Building an S3 Sample Application
Going forward we are exploring the basic operations of S3. We do so by building our own file-sharing application that lets you securely & temporarily limited share files with other people.

> The sample application does include a lot of code that is not directly related to S3. If you are solely interested in the S3 specific parts, you might want to focus the `io.jgoerner.s3.adapter.out.s3.S3Repository` class

The application's `Readme` has all instructions needed to launch it. You don't have to use the application to follow this article. It is merely meant as supportive means to explain certain S3 concepts.

### Setup AWS & AWS SDK
The first step is to set up an AWS account (if you haven't already) and to configure your AWS credentials. Here is [another article that explains this set up in great detail](https://reflectoring.io/getting-started-with-aws-cloudformation/#setting-up-an-aws-account) (only the initial configuration paragraphs are needed here, so feel free to come back after you're all set).

### Spring Boot & S3

Our sample application is going to use the [Spring Cloud for Amazon Web Services](https://cloud.spring.io/spring-cloud-aws/reference/html/#using-amazon-web-services) project. The main advantage over the [official AWS SDK for Java](https://aws.amazon.com/sdk-for-java/) is the convenience and head start we get by using the Spring project. A lot of common operations are wrapped into higher-level APIs that reduce the amount of boilerplate code.

Spring Cloud AWS gives us the `org.springframework.cloud:spring-cloud-starter-aws` dependency which bundles all the dependencies we need to communicate with S3.

### Configuration
Just as with any other Spring Boot application, we can make use of an `application.properties`/`application.yaml` file to store our configuration:

```yaml
# application.yaml
cloud:
  aws:
    region:
      static: eu-central-1
    stack:
      auto: false
    credentials:
      profile-name: dev
```

The snippet above does a few things:
- `region/static`: we statically set our AWS region to be `eu-central-1` (because that is the region that is closest to me)
- `stack/auto`: as we don't rely on AWS `CloudFormation` service, we want to disable the auto-detection
- `credentials/profile-name`: we tell the application to use the credentials of the profile named `dev` (that's how I named my AWS profile locally)

If you configured your credentials properly you should be able to start the application. However, due to a [known issue](https://docs.spring.io/spring-cloud-aws/docs/2.2.3.RELEASE/reference/html/#amazon-sdk-configuration
) you might want to add the following snippet to the configuration file to prevent noise in the application logs:

```yaml
logging:
  level:
    com:
      amazonaws:
        util:
          EC2MetadataUtils: error
```

What the above configuration does is simply adjusting the log level for the class `com.amazonaws.util.EC2MetadataUtils` to `error` so we don't see the warning logs anymore.

### Amazon S3 Client
The core class to handle the communication with S3 is the `com.amazonaws.services.s3.AmazonS3Client`. Thanks to Spring Boot's dependency injection we can simply use the constructor to get a reference to the client:

```java
// io.jgoerner.s3.adapter.out.S3Repository

public class S3Repository {

  private final AmazonS3Client s3Client;

  public S3Repository(AmazonS3Client s3Client) {
    this.s3Client = s3Client;
  }
  
  // other repository methods

}
```

### Creating a Bucket
Before we can upload any file, we have to have a bucket. Creating a bucket is quite easy:

```java
s3Client.createBucket("my-awesome-bucket");
```

We simply use the `createBucket` method and specify the name of the bucket. This sends the request to S3 to create a new bucket for us. As this request is going to be handled asynchronously, the client gives us the way to block our application until that bucket exists:

```java
// optionally block to wait until creation is finished
s3Client
  .waiters()
  .bucketExists()
  .run(
    new WaiterParameters<>(
      new HeadBucketRequest("my-awesome-bucket")
    )
  );
```

We simply utilize the client's `waiters()` method and run a `HeadBucketRequest` (similar to the [HTTP head method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD)).

As mentioned before, **the name of the S3 bucket has to be globally unique**, so often I end up with rather long or non-human readable bucket names. Unfortunately, we can not attach any metadata to the bucket (as opposed to objects). Therefore, the sample application uses a little lookup table to map human and UI friendly names to globally unique ones. This is not required when working with S3, just something to improve the usability.

> **Sample Application: Create a Bucket**
>
> To use the sample application's UI to create a bucket:
> 1. Navigate to the _Spaces_ section
> 2. Click on _New Space_ 
> 3. Enter the name and click _Submit_ 
> 4. A message should pop up to indicate success


### Uploading a File
Now that our bucket is created we are all set to upload a file of our choice. The client provides us with the overloaded `putObject()` method. Besides the fine-grained `PutObjectRequest` we can use the function in three ways:

```java
// String-based
String content = ...;
s3Client.putObject("my-bucket", "my-key", content);

// File-based
File file = ...;
s3Client.putObject("my-bucket", "my-key", file);

// InputStream-based
InputStream input = ...;
Map<String, String> metadata = ...;
s3Client.putObject("my-bucket", "my-key", input, metadata);
```

In the simplest case, we can directly write the content of a `String` into an object. We can also put a `File` into a bucket. Or we can use an `InputStream`.

Only the last option gives us the possibility to directly attach metadata in the form of a `Map<String, String>` to the uploaded object.

In our sample application, we attach a human-readable `name` to the object while making the key random to avoid collisions within the bucket - so we don't need any additional lookup tables.

Object metadata can be quite useful, but we should note that S3 does not give us the possibility to directly search an object by metadata. If you are looking for a specific metadata key (e.g. `department` being set to `Engineering`) you have to touch all objects in your bucket and filter based on that property.

There are some upper boundaries worth mentioning when it comes to the size of the uploaded object. At the time of writing this article, you can upload an item of max 5GB within a single operation as we did with `putObject()`. If you use the client's `initiateMultipartUpload()` method, it is possible to upload an object of max 5TB through a [Multipart upload](https://docs.aws.amazon.com/AmazonS3/latest/dev/mpuoverview.html).

> **Sample Application: Upload a File**
>
> To use the sample application's UI to upload a file:
> 1. Navigate to the _Spaces_ section
> 2. Select _Details_ on the target Space/Bucket
> 3. Click on _Upload File_
> 4. Pick our file, provide a name and click _Submit_
> 5. A message should pop up to indicate success

### Listing Files
Once we have uploaded our files, we want to be able to retrieve them and list the content of a bucket. The simplest way to do so is the client's `listObjectV2()` method:

> AWS released `V2` of their [AWS SDK for Java in late 2018](https://aws.amazon.com/blogs/developer/aws-sdk-for-java-2-x-released/). Some of the client's methods offer both versions of the function, hence the `V2` suffix of the `listObjectsV2()` method.

```java
s3Client
  .listObjectsV2("my-awesome-bucket")
  .getObjectSummaries();
```

Similar to concepts of the [JSON API](https://jsonapi.org/), the object keys are not directly returned but wrapped in a payload that also contains other useful information about the request (e.g. such as pagination information). We get the object details by using the `getObjectSummaries()` method.

As our sample application doesn't use the `S3ObjectSummary` model that the client provides us, we map those results into our domain model:

```java
s3Client.listObjectsV2(bucket).getObjectSummaries()
  .stream()
  .map(S3ObjectSummary::getKey)
  .map(key -> mapS3ToObject(bucket, key)) // custom mapping function
  .collect(Collectors.toList());
```

Thanks to Java's `stream()` we can simply append the transformation to the request.

Another noteworthy aspect is the handling of buckets that contain more than 1000 objects. By default, the client might only return a fraction, requiring pagination. However, the newer V2 SDK provides higher-level methods, that follow an [autopagination approach](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/pagination.html).

> **Sample Application: List all Objects**
>
> To use the sample application's UI to list all objects:
> 1. Navigate to the _Spaces_ section
> 2. Select _Details_ on the target Space/Bucket
> 3. You see a list of all objects stored in the bucket

### Making a File Public
Every object in S3 has a URL that can be used to access that object. The URL follows a specific pattern of bucket name, region, and object key. Instead of manually creating this URL, we can use the `getUrl()` method, providing a bucket name and an object key:

```java
s3Client
  .getUrl("my-awesome-bucket", "some-key");
```

Depending on the region you are in, this yields an URL like the following (given that you are in the `eu-central-1` region):

```
https://my-awesome-bucket.s3.eu-central-1.amazonaws.com/some-key
```

> **Sample Application: Get Object's URL**
>
> To use the sample application's UI get an object's URL:
> 1. Navigate to the _Spaces_ section
> 2. Select _Details_ on the target Space/Bucket
> 3. Select _Download_ on the target object
> 4. The object's URL shall be opened in a new tab

When accessing this URL directly after uploading an object you should get an `Access Denied` error, since **all objects are private by default**: 

```xml
<Error>
  <Code>AccessDenied</Code>
  <Message>Access Denied</Message>
  <RequestId>...</RequestId>
  <HostId>...</HostId>
</Error>
```



As our application is all about sharing things, we do want those objects to be publicly available though.

Therefore, we are going to alter the object's **Access Control List** (ACL).

An ACL is a list of access rules. Each of those rules contains the information of a grantee (*who*) and a permission (*what*). By default, only the bucket owner (*grantee*) has full control (*permission*) but we can easily change that.

We can make objects public by altering their ACL like the following:

```java
s3Client
  .setObjectAcl(
    "my-awesome-bucket",
    "some-key",
    CannedAccessControlList.PublicRead
  );
```

We are using the the clients' `setObjectAcl()` in combination with the high level `CannedAccessControlList.PublicRead`. The `PublicRead` is a prepared rule, that allows anyone (*grantee*) to have read access (*permission*) on the object.

> **Sample Application: Make object public**
>
> To use the sample application's UI to make an object public:
> 1. Navigate to the _Spaces_ section
> 2. Select _Details_ on the target Space/Bucket
> 3. Select _Make Public_ on the target object
> 4. A message should pop up to indicate success

If you reload the page that gave you an `Access Denied` error again, you will now be prompted to download the file.

### Making a File Private
Once the recipient downloaded the file, you might want to revoke the public access. This can be done following the same logic and methods, with slightly different parameters:


```java
s3Client
  .setObjectAcl(
    "my-awesome-bucket",
    "some-key",
    CannedAccessControlList.BucketOwnerFullControl
  );
```

The above snippet sets the object's ACL so that only the bucket owner (*grantee*) has full control (*permission*), which is the default setting.

> **Sample Application: Make object private**
>
> To use the sample application's UI to make an object public:
> 1. Navigate to the _Spaces_ section
> 2. Select _Details_ on the target Space/Bucket
> 3. Select _Make Private_ on the target object
> 4. A message should pop up to indicate success

### Deleting Files & Buckets

You might not want to make the file private again, because once it was downloaded there is no need to keep it.

The client also gives us the option to easily delete an object from a bucket:


```java
s3Client
  .deleteObject("my-awesome-bucket", "some-key");
```

The `deleteObject()` method simply takes the name of the bucket and the key of the object.

> **Sample Application: Delete an Object**
>
> To use the sample application's UI to delete an object:
> 1. Navigate to the _Spaces_ section
> 2. Select _Details_ on the target Space/Bucket
> 3. Select _Delete_ on the target object
> 4. The list of objects should reload without the deleted one

One noteworthy aspect around deletion is that you can't delete non-empty buckets. So if you want to get rid of a complete bucket, you first have to make sure that you delete all the items first.

> **Sample Application: Delete a Bucket**
>
> To use the sample application's UI to delete a bucket:
> 1. Navigate to the _Spaces_ section
> 2. Select _Delete_ on the target Space/Bucket
> 3. The list of buckets should reload without the deleted one

### Using Pre-Signed URLs

Reflecting on our approach, we did achieve what we wanted to: making files easily shareable temporarily. However, there are some features that S3 offers which greatly improve the way we share those files.

Our current approach to making a file shareable contains quite a lot of steps:

1. Update ACL to make the file public
2. Wait until the file was downloaded
3. Update ACL to make the file private again

What if we forget to make the file private again?

S3 offers a concept called "pre-signed URLs". **A pre-signed URL is the link to our object containing an access token, that allows for a temporary download** (or upload). We can easily create such a pre-signed URL by specifying the bucket, the object, and the expiration date:

```java
// duration measured in seconds
var date = new Date(new Date().getTime() + duration * 1000);

s3Client
  .generatePresignedUrl(bucket, key, date);
```


The client gives us the `generatePresignedUrl()` method, which accepts a `java.util.Date` as the expiration parameter. So if we think of a certain duration as opposed to a concrete expiration date, we have to convert that duration into a Date.

In the above snippet, we do so by simply multiplying the duration (in seconds) by 1000 (to convert it to milliseconds) and add that to the current time (in UNIX milliseconds).

The [official documentation](https://docs.aws.amazon.com/AmazonS3/latest/dev/ShareObjectPreSignedURL.html) has some more information around the limitations of pre-signed URLs.

> **Sample Application: Generate a pre-signed URL**
>
> To use the sample application's UI to generate a pre-signed URL for an object:
1. Navigate to the _Spaces_ section
2. Select _Details_ on the target Space/Bucket
3. Select _Magic Link_ on the target object
4. A message should pop up, containing a pre-signed URL for that object (which is valid for 15 minutes)

### Using Bucket Lifecycle Policies

Another improvement we can implement is the deletion of the files. Even though the [AWS free tier](https://aws.amazon.com/free/?all-free-tier.sort-by=item.additionalFields.SortRank&all-free-tier.sort-order=asc&all-free-tier.q=S3&all-free-tier.q_operator=AND) gives us 5GB of S3 storage space before we have to pay, we might want to get rid of old files we have shared already. Similar to the visibility of objects, we can manually delete objects, but wouldn't it be more convenient if they get automatically cleaned up?

AWS gives us multiple ways to automatically delete objects from a bucket, however we'll use S3's concept of `Object Life Cycle rules`. An object life cycle rule basically contains the information *when* to do *what* with the object:

```java
// delete files a week after upload
s3Client
  .setBucketLifecycleConfiguration(
    "my-awesome-bucket",
    new BucketLifecycleConfiguration()
      .withRules(
        new BucketLifecycleConfiguration.Rule()
          .withId("custom-expiration-id")
          .withFilter(new LifecycleFilter())
          .withStatus(BucketLifecycleConfiguration.ENABLED)
          .withExpirationInDays(7)
      )
  );
```

We use the client's `setBucketLifecycleConfiguration()` method, given the bucket's name and the desired configuration. The configuration above consists of a single rule, having:

- an `id` to make the rule uniquely identifiable
- a default `LifecycleFilter`, so this rule applies to all objects in the bucket
- a status of being `ENABLED`, so as soon as this rule is created, it is effective
- an expiration of seven days, so after a week the object gets deleted

It shall be noted that the snippet above overrides the old lifecycle configuration. That is ok for our use case but you might want to fetch the existing rules first and upload the combination of old and new rules.

> **Sample Application: Set expiration on Bucket**
>
> To use the sample application's UI to set an expiration on a bucket's objects:
> 1. Navigate to the _Spaces_ section
> 2. Select _Make Temporary_ on the target Space/Bucket
> 3. Select _Delete_ on the target object
> 4. A message should pop up to indicate success

Lifecycle rules are very versatile, as you can use the filter to only apply the rule to objects with a certain key prefix or carry out other actions like archiving of objects.

## Conclusion

In this article, you've learned the basics of AWS' Simple Storage Service (S3) and how to use Spring Boot and the `Spring Cloud` project to get started with it.

We used S3 to build a custom file-sharing application, that lets you upload & share your files in different ways. But it shall be said, that S3 is way more versatile, often also quoted to be the **backbone of the internet**.

As this is a getting started article, we did not touch other topics like [storage tiers](https://aws.amazon.com/s3/storage-classes/), [object versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html) or [static content hosting](https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html). So I can only recommend you get your hands dirty, and play around with S3!

