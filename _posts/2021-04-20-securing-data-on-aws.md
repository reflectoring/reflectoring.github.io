---
title: Securing Data in AWS
categories: [craft]
date: 2021-04-09 05:00:00 +1100
modified: 2021-04-09 05:00:00 +1100
author: artur
excerpt: "Working with data in the cloud it is recommended to protect it. This article shows how to encrypt data on storage in AWS Cloud"
image:
  auto: 0100-keylock
---

Amazon Web Services provide many possibilities to secure data in the cloud. In this article, we will have a closer look
at how to encrypt different types of data on AWS.

# Why Encryption?

If we work with any AWS service, we create data, that is stored in some storage of AWS. Why should this data be encrypted?

All cloud providers like AWS have several customers in the entire world. When we have our data in the cloud, we want to protect this data from the cloud provider and other customers of this cloud provider. We want to be sure, that only we can read the data, that is stored in the cloud.  We also want to prevent our data from being read, even if it gets into the hands of unauthorized people or applications through intentional or accidental means. 

Due to these reasons, many customers have a concern about unauthorized access to the data stored in plain text in the cloud. **Encryption solves this problem of securing data stored in the cloud.**

>The primary reason for encrypting data is confidentiality.

# Encryption basics for storages
We need keys to encrypt data. Keys, that we need for encryption, are of two types:

* Symmetric keys
* Asymmetric keys

Symmetric keys are used, when we want to encrypt and decrypt data with the same key. It means somebody who encrypts
data has to share the key with someone who wants to decrypts the data.

When we speak about asymmetric keys, we mean a key pair, that consists of a pair of private key and public key. The data, that is
encrypted with the public key can be decrypted with the private key only. It means, if a sender wants to encrypt data for a
receiver, the public key of the receiver is used for the encryption. The receiver can use the private
key for decryption which is securely stored in an appropriate storage like a protected file system or specialized software or hardware.

The encryption and decryption with a symmetric key is much faster than with an asymmetric key because the keys used are much shorter than they are in asymmetric cryptography. and only one key gets used (versus two for asymmetric cryptography). It is however less secure since the entities which want to correspond via symmetric encryption must share the key, and if the channel used to share the key is compromised, the entire system for sharing secure messages gets broken since anyone with the key can encrypt or decrypt all communications between the entities.


In this article, we are interested in the encryption of data on storage. **It is called encryption of the data at
rest.**
In addition to this, we can also encrypt the data in transit.

Securing data with symmetric encryption is appropriate since we want to encrypt and decrypt data at one place with the same
account on the storage. We also encrypt the data before writing and decrypt data after reading and we don't
need to protect the data for transport. 

Sometimes we encrypt data with a key and after that, we encrypt this key with another one. It is called enveloped
encryption. The enveloped encryption is used by many AWS services.

# Overview of Data Encryption on AWS

As mentioned above we can secure data at rest and in transit. For the data in transit, we can use TSL or an AWS
Service [Certificate Manager](https://aws.amazon.com/certificate-manager/?nc1=h_ls)

We want to have a deeper look at the encryption at rest.

If we encrypt data on an AWS storage we have two approaches:

* client-side encryption
* server-side encryption

Client-side encryption means, that the data is encrypted outside of the AWS cloud and then sent to storage. It is stored on an AWS storage in encrypted form, but AWS has nothing to do with the encryption. If the client wants to read data, the
client requires the data from the storage, and it has to decrypt the data on the client-side. We can use this approach if
we want to use cloud storage, but we don't trust the security service of the cloud provider and want to secure the data on
our own.

Server-side encryption means, that AWS takes care of the encryption of the data of the storage, and it is transparent
for the client, who writes or reads these data. AWS provides several possibilities for server-side encryption on storage.

Now we need to do three steps to protect the data:

* get a key
* encrypt data
* store the key securely

There are two services for managing a key, that are mostly used. We can use these Services to do the three steps.

* [AWS Key Management Service](https://aws.amazon.com/kms/?nc1=h_ls) and
* [AWS Cloud HSM](https://aws.amazon.com/cloudhsm/?nc1=h_ls)

Most storage services support encryption and have a good integration with AWS KMS to encrypt data.

# Amazon Key Management Service

Before we encrypt storage let's have a look at services, which provide and manage the keys.

Amazon KMS has an integration with many storage services of AWS and these storages can use the KMS to create and store
keys.

## Advantages of KMS

**KMS provides a centralized management of keys for an AWS customer**. If we use many Amazon services we have always one
service to manage all keys.

The first thing we have to know working with KMS is a **customer master key** (CMK). The Customer Master Key is a key, that

* is stored securely in KMS
* never leaves KMS
* is used for encryption other keys only, but not the data.

While creating a CMK we have to choose the type of key. Normally we choose a symmetric key for encryption of
storages.
**If we configure the KMS for use by other AWS Services like S3 or EBS, then KMS will create other keys for encryption
of data. The keys are called data keys.** Data keys cannot be created by a separate customer request. KMS decides when
creating a data key.

Again, all data is encrypted by data keys. But the data keys are encrypted by CMK.
**If an AWS service wants to perform an encryption operation, it requires a new data key every time at KMS.**
It means a new data key is generated for every volume or every S3 object etc. We have a unique data key for each
encryption request. KMS creates a new data key and returns it to a storage service in encrypted form. This data key can
be stored with metadata on the storage. After that, a storage service send the encrypted data key to KMS, KMS decrypts
this data key with CMK and sends it as plain back to the service. The service uses this key for encryption and erases the key from
memory after that.

![Customer master key](/assets/img/posts/securing-data-in-aws/AWSCMK.png)

**If we create CMK we can define usage policies for the keys.** It means we can choose who can manage key, or who can
delete the key.

Also, we can use [AWS CloudTrail](https://aws.amazon.com/cloudtrail/?nc1=h_ls) service for auditing key usage. **Every
request encryption operation can be tracked.**

**KMS provides many APIs, that can be used not only from other AWS services but for example from a custom application.**
It is the case if the application requires a key management. The application can use the existing solution of KMS
instead to develop a new one.

## Source of key material

If we create a CMK we have two possibilities to get the key:

* let the KMS create the key
* import the key from outside

The first way is pretty easy. We just define what kind of key we want to have and KMS creates the key for us. We get the
reference to the key and can use it for some encryption operations.

The second way means, we have a key outside AWS Cloud, we don't want to use keys, which are created by KMS, but we want
to use all advantages, that are provided by KMS.
**In this case we can import our key to KMS and use it as CMK.**

## Key Rotation

Reusing the key for many cryptographic operations is not a good idea. Should the key be stolen, all encrypted data can
be decrypted. That's why it is important to rotate CMK. We can do it manually if we want to schedule the rotation on
our own, but **AWS KMS provides the possibility of the automatic rotation**. If we enable the automatic CMK rotation, a
new key is created with every rotation and all new data keys will be encrypted with a new CMK. The old CMK is not
deleted and will be used for the decryption of old data keys, that were created before rotation. But everything is
transparent for AWS customers. The ID or NAME of the CMK is not changed. The KMS managed automatically the
usage of the old and current CMKs.

## KMS storage

We said several times, that a key is stored in KMS. But what does it mean to store the key in KMS? KMS uses a Cloud HSM service
for generating and storing CMKs. HSM is a special hardware device for cryptographic operation and storing
sensitive material.
**This device is very secure.** The CMKs, that are persisted in this device can not be exported from it.

**But KMS uses one device for many customers. So the KMS is a multi-tenant service.** The keys, that are persisted in a
device can belong to different tenants. It can be enough for many use cases. But some customers or applications can have
higher security requirements. Multi-tenancy can be not secure enough for such kinds of applications. In this case, we can use a
separate HSM, only for us.

# Cloud HSM

HSM means Hardware Security Module. It is a device, that is designed for cryptographic operations and key storage. AWS
Cloud HSM is a service, that provides hardware to an AWS customer. If we require a Cloud HSM, we get a device located
in AWS data center. Keys, that are created in this HSM are not shared with other AWS customers. They are located
on dedicated hardware.

**Cloud HSM allows having a secure single-tenant key storage**

Every HSM device is isolated inside the customer VPC. If we want to create an HSM, we need to create an AWS CloudHSM
cluster first. We can get up to 28 devices in the cluster. AWS takes care of the load balancing and synchronizing the
keys between devices. Working with a Cloud HSM means working with the CloudHSM cluster, even if we have only one device
in the cluster. If we choose the CLoudHSM service for key management, it means it is very important for us how secure
the keys stored. It is recommended to have at least two HSMs in a cluster to avoid losing keys in case of device
problems.

Since we get a device from AWS, it is important to understand what an AWS customer can do on the HSM and what does
Amazon.

In a CloudHSM cluster, the AWS customer has full control over the key management. Amazon has nothing to do with the
keys. But Amazon manages and monitors the HSM. AWS takes care of backups, updates, synchronization, etc. The AWS customer
has more functionality for key management than in KMS. The customer can generate a symmetric and asymmetric key of
different lengths, perform encryption with many algorithms, import and export keys, make key non-exportable, and so on.

If we want to encrypt data on storage it seems to be a very good solution for key management, especially if we have very
high-security requirements for our encryption. But CloudHSM doesn't have such good integration with other AWS services
as KMS. Since AWS has no access to the keys at all, it is harder to use this key for encryption of S3 Objects, EFS
volume, or EBS immediately.

AWS provides several tools to manage the keys on an HSM cluster. We can use Command Line Tools
like [CloudHSM Management Utility](https://docs.aws.amazon.com/cloudhsm/latest/userguide/cloudhsm_mgmt_util.html)
for user management
and [Key Management Utility](https://docs.aws.amazon.com/cloudhsm/latest/userguide/key_mgmt_util.html) for key
management. AWS provides a Client SDK for integration of the custom application with CloudHSM. But these tools cannot help
us to use the keys for storage encryption of AWS services.

# Cloud HSM and KMS integration

Fortunately, we can combine the advantages of both services KMS and CloudHSM.
**We can bind a Cloud HSM cluster to Key Management Service in an AWS account.**

First, we have to create a CloudHSM cluster and create a crypto user with the name `kmsuser` in the HSM, not an AWS user.
Second, we have to configure a **custom key store** in KMS. Custom Key Store means a store in KMS, that is provided by
the customer. We can provide only a CloudHSM cluster currently. There are no other options. By configuring the
custom key store we have to provide:

* the Cloud HSM cluster
* the credentials of the crypto user
* a certificate, we got by creating the CloudHSM cluster.

That's it. Now we can use KMS interfaces with the CloudHSM cluster in the backend. We can create CMKs using KMS. In this
case, we don't care about generating and storing the key in the backend. Alternatively, we can create CMKs directly in Cloud
HSM cluster, because we have full control over it.

**Custom key store allows having all benefits of KMS with the single-tenant key storage**

Finally, we can use KMS integration with all AWS services, and we don't share the storage environment of the keys with other
customers.

Another thing we have to know is the costs. AWS KMS is much cheaper than Cloud HSM.

Every CMK in AWS costs currently 1 USD per month. Also, we have 20.000 cryptographic requests in a month for free. If we
make more than 20.000 requests in a month it costs between 0,03 and 12,00 USD for 10.000 requests depending on the key type.

Cloud HSM costs between 1,4 and 2,00 USD per hour and per device depending on the region. There are no costs for single
operations. If we have two HSMs in the cluster for a price of 1,50 USD, we pay 72 USD per day.

If we want to use a custom key store in KMS we have to pay for both.

# Encryption of Storages

Now we know how to manage keys in AWS. Let's go over AWS storage types and look at how we can encrypt the data on these
storages.

## Amazon Elastic File System

AWS EFS is used as shared file storage. When we create a new file system, for example from AWS Console, the default
settings are configured to encrypt the data on this file system. We don't need to do anything. The new file system uses
AWS Service by default to get the CMK. A key with the name `aws/elasticfilesystem` already exists or will be created
automatically in KMS at every AWS account. Such keys are called **AWS managed keys**, because they are created and
managed by AWS without custom request. Even more, if we don't want to encrypt the data on our file system we have to
disable it actively in the custom settings when creating a file system.

The AWS KMS uses a symmetric key with AES-256 encryption algorithm.

If we want to have more control over the keys, we can create a new CMK in the KMS service and use it for the encryption
of data keys. If we create the CMK and choose KMS, the CMK is created and stored in KMS storage. It is a CloudHSM
cluster, that is shared between many AWS customers.

We have also a third option to use a custom key store for key generation and storing. In this case, the CMK is generated
and stored in a dedicated Cloud HSM cluster, that we provided before.

So we had three options for key management KMS:

* AWS managed key - AWS KMS creates key for us with minimal effort from our side,
* Customer master key in KMS store - we create actively the key in KMS, and the key is stored in a shared environment
* Customer master key in custom key store - we create the key actively through KMS, but with a dedicated HSM cluster in
  backend.

It is important to know, that we have to decide on encryption while creating an EFS. We can set it only at
the moment of creation. It is not possible to disable or enable the encryption after creation.

Every time we want to write or read data, KMS will make encrypt or decrypt operations. So we won't see any difference in
the normal work and our data are safe.

## Amazon FSx

Amazon FSx is used as Windows storage for Windows servers. This storage is always encrypted, and we cannot disable this.
Similar to EFS storage we can use the default CMK of KMS, which is called `aws/fsx`. If we want to use a CMK for
encryption we have to put the ARN of the key. ARN is Amazon Resource Names and is unique for every resource in the whole
AWS cloud. In this case, the FSx service doesn't know where our key sore is. It can be a KMS key store or a custom key store.
We just put the ARN of the CMK and the service uses it.

## Amazon Elastic Block Store

AWS EBS is a storage volume on the block level. It is like an unformatted storage device. The whole procedure for
encryption is very similar to other service services. We have a choice between the default AWS managed key or Custom
Master Key.

Using EBS we can create snapshots of the volume. If we encrypt the volume, the snapshots, that we create are
automatically encrypted.

If we create a volume from a snapshot and this snapshot is encrypted, then our new volume will be automatically
encrypted as well. If we create a volume from a snapshot and this snapshot is not encrypted, we have again the choice
of which key we can use for encryption.

## Amazon S3

Amazon S3 is the object storage, where we normally can upload and download files. We are working with single objects in
S3 Service. We don't have a complex hierarchical structure like in file systems. We can group many objects into a bucket.

If we want to encrypt data on S3 Storage we have three options for managing keys:

* Amazon S3 key
* Customer Provided Key
* AWS KMS

In all cases, it is about server-side encryption.

### Amazon S3 Key

Amazon S3 key is an encryption option, that is provided by the S3 service. It
has nothing to do with AWS KMS. If we choose it, the S3 service creates a master key. After that every time, when we want to
upload a file a new data key is created, the object is encrypted with this data key, the data key is encrypted by the master key
and stored along with the object. If we want to download the S3 object, the encrypted data key is decrypted with the master key
and is used to decrypt the S3 object.

We can configure the encryption not only with AWS console but also with REST API or with AWS SDK.

Since the master key is not managed by KMS, the master key is not stored so securely like in the KMS service.

### Customer Provided Key

We can encrypt S3 objects with our key and not with a key from AWS. To do this we have to send the key along with the
upload request. If we use REST API or AWS SDK and want to upload or download a file, we have to send the key as base 64
encoded, the encryption algorithm and the hash of the key in the header of the request. S3 service will recognize the header
and perform encryption or decryption. After the operation, the key will be deleted from the memory.

Currently, it is not possible with the AWS console.

### Encryption of S3 Objects with AWS KMS

Of course, we can use the AWS KMS as well. It is similar to other storage services. We can use the AWS managed key. It
is called `aws/s3` or we can use a key from custom managed keys in the KMS service. It can be a normal KMS CMK or a CMK from
a custom key store. If we use the AWS console, we can use an existing key from the list or just put an ARN of the key.

Some buckets are growing very fast and can have thousands of objects. Moreover, some objects can be downloaded very often.
Remember, that we pay for every cryptographical request by using KMS. Such a scenario can be expensive.

**S3 Bucket Key allows us to reduce the costs for cryptographic operation with S3 objects**

A bucket key is a symmetric key, that is created on the bucket level. It is encrypted once by a CMK in KMS and returned to
the S3 Service. Now the S3 Service can generate data keys for every object and encrypt them with a bucket key outside KMS.
It reduced the traffic to AWS KMS from the S3 storage service, and the number of cryptographic operations inside KMS. We can
define the using bucket keys in the console, via REST API, in AWS SDK, AWS CLI, or using CloudFormation

![Bucket Key](/assets/img/posts/securing-data-in-aws/BucketKey.png)

Unlike the other storage service, we can change encryption options after the encryption for every object. It means we
can change the encryption of an object for example from AWS managed key to the AWS Customer Managed Key anytime. In this
case, this object will be decrypted with the AWS managed key and encrypted with the Customer Managed Key.

Using REST API or AWS SDK we can define the encryption option of single objects every time by upload. So we can encrypt
every S3 object differently. For example, we can have three files. The first file is encrypted with Amazon S3 Key, the
second file is encrypted using AWS KMS, and the third file is encrypted with a customer provide key, which we sent by
uploading the file.

# Conclusion

AWS provides many solutions for the protection of the data in the cloud using server-side encryption. The AWS Key Management
Service has a very simple interface and gut integration with the storage services of AWS. The Cloud HSM provides a solution for
higher security requirements. It is possible to combine both services for secure key management. The storage
service like EFS, FSx, EBS, and S3 can be easily and securely protected with help of AWS and CloudHSM.



