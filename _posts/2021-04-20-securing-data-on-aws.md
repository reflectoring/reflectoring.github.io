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

## Why Encryption?

If we work with any AWS service, we create data, that is stored in some storage of AWS. Why should this data be encrypted?

All cloud providers like AWS have several customers in the entire world. When we have our data in the cloud, we want to protect this data from the cloud provider and other customers of this cloud provider. We want to be sure, that only we can read the data, that is stored in the cloud.  

We also want to prevent our data from being read, even if it gets into the hands of unauthorized people or applications through intentional or accidental means. 

Due to these reasons, many customers have a concern about unauthorized access to the data stored in plain text in the cloud. **Encryption solves this problem of securing data stored in the cloud.**

>The primary reason for encrypting data is **confidentiality**.

## Encryption Basics for Storage
We need keys to encrypt data. Keys, that we need for encryption, are of two types:

* Symmetric keys
* Asymmetric keys

**Symmetric keys are used to encrypt and decrypt data with the same key**. It means somebody who encrypts data has to share the encryption key with someone who needs to decrypt the data.

**Asymmetric key is a key pair, that consists of a private key and public key**. The data, that is encrypted with the public key can be decrypted with the private key only. It means, if a sender wants to send encrypted data to a receiver, it uses the public key of the receiver for encryption of the data. The receiver then uses the private key for the decryption of the data.

The receiver also securely stores the private key in appropriate storage like a protected file system or specialized software or hardware.

The encryption and decryption with a symmetric key are much faster than with an asymmetric key.

It is however less secure since the entities which want to correspond via symmetric encryption must share the encryption key.

If the channel used to share the key is compromised, the entire system for sharing secure messages gets broken. This can be exploited by anyone with the key since they can encrypt or decrypt all communications between the entities.

## Overview of Data Encryption on AWS

As mentioned above we can use encryption to secure data at rest and in transit.

Let us have a deeper look at the encryption of data at rest.

Since we want to encrypt and decrypt data at one and not at different places, we can use a symmetric key for that. 
If we encrypt data on an AWS storage we have two approaches:

* Client-side encryption
* Server-side encryption

**In Client-side encryption, the data is encrypted outside of the AWS Cloud and then sent to storage**. It is stored on an AWS storage in encrypted form, but AWS has nothing to do with the encryption.

When the client wants to read data, it has to decrypt the data on the client-side after extracting the encrypted data from AWS. We use this approach if we want to use cloud storage, but we don't trust the security service of the cloud provider and want to secure the data on our own.

**In Server-side encryption, AWS takes care of the encryption of the data in its storage**. The encryption process is transparent for the client, who writes or reads this data.

AWS provides several possibilities for server-side encryption on storage.

In general, we need to perform three steps to protect our data:

1. Get a key for encryption
2. Encrypt data
3. Store the key securely

AWS provides two services for managing encryption keys:

* [AWS Key Management Service](https://aws.amazon.com/kms/?nc1=h_ls)
* [AWS Cloud HSM](https://aws.amazon.com/cloudhsm/?nc1=h_ls)


## Amazon Key Management Service (KMS)

Let's look at AWS KMS service which we can use to manage our encryption keys.

Most storage services in AWS support encryption and have good integration with AWS KMS for managing the encryption keys to encrypt their data.

### Advantages of KMS

1. KMS provides a centralized system for managing our encryption keys.

2. KMS uses hardware security modules(HSM) to protect the confidentiality and integrity of your keys encryption keys. Noone, including AWS employees, can retrieve our plaintext keys from the service.

3. Each KMS request can be audited by enabling [AWS CloudTrail](https://aws.amazon.com/cloudtrail). The audit logs contains details of the user, time, date, API action and,key used.

4. We also get the advantages of scalability, durability and high availability compared to an on-premise Key management solution. 

5. KMS functions are available as APIs and bundled into SDKs which make it possible to integrate with any custom application for key amanagement.

### Working of KMS

It is important to understand CMK and data keys to understand the working of KMS.
#### CMK
KMS maintains a logical representation of the key it manages in the form of a Customer master key (CMK). The CMK also contains the key ID, creation date, description, and state of the key. CMKs in any one of the states: Enabled, Disabled, PendingImport, PendingDeletion, or Unavailable.

AWS KMS has three types of CMKs: 
1. **Customer managed CMK**: The customer has creates and manages these CMKs and have full control over these.
2. **AWS managed CMK**: These CMKs are created, managed, and used on our behalf by an AWS service that is integrated with AWS KMS.
3. **AWS owned CMK**: These are owned and managed by the AWS services for use in multiple AWS accounts. We cannot view and use these CMKs and are not charged any fee for their usage.

Some AWS services support only an AWS managed CMK. Others use an AWS owned CMK or offer a choice of CMKs.

#### Data Key
Data keys are the keys that we use to encrypt data and other data encryption keys.

We use AWS KMS customer master keys (CMKs) to generate, encrypt, and decrypt data keys.

The data key is used outside of KMS, such as when using OpenSSL for client-side encryption using a unique symmetric data key.

#### Data Key Pairs
Data key pairs are asymmetric data keys consisting of a pair of public key and private key. They are used for client-side encryption and decryption, or signing and verification of messages outside of AWS KMS. 

The private key in each data key pair is protected under a symmetric CMK in AWS KMS. Both RSA and Elliptic curve key pair are supported.

For signing, the private key of the data key pair is used to generate a cryptographic signature for a message. Anyone with the corresponding public key can use it to verify the integrity of the message.

#### Source of Key Material

If we create a CMK we have two possibilities to get the key:
1. **KMS generates the key material**: We define what kind of key we want to have and KMS creates the key material for us. We get the reference to the key and use it for encryption operations.
2. **Bring your own key (BYOK)**: We create a CMK without key material and then import the key material from outside into the CMK.

#### Key Rotation

Reusing the key for many cryptographic operations is not a good idea. Should the key be stolen, all encrypted data can be decrypted. That's why it is important to rotate CMK. We can do it manually if we want to schedule the rotation on our own, but **AWS KMS provides the possibility of the automatic rotation**. 

If we enable the automatic CMK rotation, a new key is created with every rotation and all new data keys will be encrypted with a new CMK. The old CMK is not deleted and will be used for the decryption of old data keys, that were created before rotation. But everything is transparent for AWS customers. The ID or NAME of the CMK is not changed. The KMS managed automatically the usage of the old and current CMKs.

#### KMS storage

AWS KMS key store is used as the default storage for keys managed by KMS but this storage is shared by many customers.

It can be enough for most use cases. But some customers or applications can have higher security requirements. For instance, we have to ensure our keys are isolated by using a dedicated infrastructure to ensure any regulatory compliance.

A custom key store can be configured to address these scenarios.The custom key store is associated with an AWS CloudHSM cluster which is a managed Hardware Security Module (HSM) service set up in our own AWS account. 

HSM is a special hardware for cryptographic operation and storing sensitive material.

## AWS CloudHSM

HSM means Hardware Security Module. It is hardware, that is designed for cryptographic operations and key storage. AWS
Cloud HSM is a service, that provides hardware to an AWS customer. If we require a Cloud HSM, we get dedicated hardware located
in AWS data center. Keys, that are created in this HSM are not persisted on storage, which is shared with other AWS customers.

### Benefits of CloudHSM

**Cloud HSM allows having a secure single-tenant key storage**

Every HSM is isolated inside the customer VPC. If we want to create an HSM, we need to create an AWS CloudHSM
cluster first. We can get up to 28 HSMs in the cluster. AWS takes care of the load balancing and synchronizing the
keys between HSM. Working with a Cloud HSM means working with the CloudHSM cluster, even if we have only one HSM
in the cluster. If we choose the CLoudHSM service for key management, it means it is very important for us how secure
the keys stored. **It is recommended to have at least two HSMs in a cluster to avoid losing keys in case of hardware
problems.**

### Working With CloudHSM

**In a CloudHSM cluster, the AWS customer has full control over the key management.** Amazon has nothing to do with the
keys. But Amazon manages and monitors the HSM. AWS takes care of backups, firmware updates, synchronization, etc. The AWS customer
has more functionality for key management than in KMS. The customer can generate a symmetric and asymmetric key of
different lengths, perform encryption with many algorithms, import and export keys, make key non-exportable, and so on.

If we want to encrypt data on storage it seems to be a very good solution for key management, especially if we have very
high-security requirements for our encryption. **But CloudHSM doesn't have such good integration with other AWS services
as KMS.** Since AWS has no access to the keys at all, it is harder to use this key for encryption of S3 Objects, EFS
volume, or EBS immediately.

AWS provides several tools to manage the keys on an HSM cluster. We can use Command Line Tools
like [CloudHSM Management Utility](https://docs.aws.amazon.com/cloudhsm/latest/userguide/cloudhsm_mgmt_util.html)
for user management
and [Key Management Utility](https://docs.aws.amazon.com/cloudhsm/latest/userguide/key_mgmt_util.html) for key
management. AWS provides a Client SDK for integration of the custom application with CloudHSM. But these tools cannot help
us to use the keys for storage encryption of AWS services.

## Cloud HSM and KMS integration

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

### Cost comparison
Another thing we have to know is the costs. [AWS KMS](https://aws.amazon.com/kms/pricing/?nc1=h_ls) is much cheaper
than [Cloud HSM](https://aws.amazon.com/cloudhsm/pricing/?nc1=h_ls).

Every CMK in AWS costs currently 1 USD per month. Also, we have 20.000 cryptographic requests in a month for free. If we
make more than 20.000 requests in a month it costs between 0,03 and 12,00 USD for 10.000 requests depending on the key type.

Cloud HSM costs between 1,4 and 2,00 USD per hour and per device depending on the region. There are no costs for single
operations. If we have two HSMs in the cluster for a price of 1,50 USD, we pay 72 USD per day.

If we want to use a custom key store in KMS we have to pay for both.

## Encryption of Storages

Now that we know how to manage our encryption keys in AWS, let's go over AWS storage types and look at how we can encrypt the data on these
storages.

### Amazon Elastic File System

AWS EFS is a serverless file storage service for use with AWS compute services and on-premise servers.
EFS is a durable, high throughput file system, that can be mounted on an Amazon EC2 instance.

When we create a new file system, for example from AWS Console, the default
settings are configured to encrypt the data on this file system. We don't need to do anything. The new file system uses
AWS Service by default to get the CMK. A key with the name `aws/elasticfilesystem` already exists or will be created
automatically in KMS at every AWS account. Such keys are called **AWS managed keys**, because they are created and
managed by AWS without custom request. Even more, if we don't want to encrypt the data on our file system we have to
disable it actively in the custom settings when creating a file system.

The AWS KMS uses a symmetric key with AES-256 encryption algorithm.

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


### Amazon FSx

Amazon FSx is used as Windows storage for Windows servers. This storage is always encrypted, and we cannot disable this.
Similar to EFS storage we can use the default CMK of KMS, which is called `aws/fsx`. If we want to use a CMK for
encryption we have to put the ARN of the key. ARN is Amazon Resource Names and is unique for every resource in the whole
AWS cloud. In this case, the FSx service doesn't know where our key sore is. It can be a KMS key store or a custom key store.
We just put the ARN of the CMK and the service uses it.

### Amazon Elastic Block Store

AWS EBS is a storage volume on the block level. It is like an unformatted storage device. The whole procedure for
encryption is very similar to other service services. We have a choice between the default AWS managed key or Custom
Master Key.

Using EBS we can create snapshots of the volume. If we encrypt the volume, the snapshots, that we create are
automatically encrypted.

If we create a volume from a snapshot and this snapshot is encrypted, then our new volume will be automatically
encrypted as well. If we create a volume from a snapshot and this snapshot is not encrypted, we have again the choice
of which key we can use for encryption.

### Amazon S3

Amazon S3 is the object storage, where we normally can upload and download files. We are working with single objects in
S3 Service. We don't have a complex hierarchical structure like in file systems. We can group many objects into a bucket.

If we want to encrypt data on S3 Storage we have three options for managing keys:

* Amazon S3 key
* Customer Provided Key
* AWS KMS

In all cases, it is about server-side encryption.

#### Amazon S3 Key

Amazon S3 key is an encryption option, that is provided by the S3 service. It
has nothing to do with AWS KMS. If we choose it, the S3 service creates a master key.

We can configure the encryption not only with AWS console but also with REST API or with AWS SDK.

Since the master key is not managed by KMS, the master key is not stored so securely like in the KMS service.

#### Customer Provided Key

We can encrypt S3 objects with our key and not with a key from AWS. To do this we have to send the key along with the
upload request. If we use REST API or AWS SDK and want to upload or download a file, we have to send the key as base 64
encoded, the encryption algorithm and the hash of the key in the header of the request. S3 service will recognize the header
and perform encryption or decryption. After the operation, the key will be deleted from the memory.

Currently, it is not possible with the AWS console.

#### Encryption of S3 Objects with AWS KMS

Of course, we can use the AWS KMS as well. It is similar to other storage services. We can use the AWS managed key. It
is called `aws/s3` or we can use a key from custom managed keys in the KMS service. It can be a normal KMS CMK or a CMK from
a custom key store.

Some buckets are growing very fast and can have thousands of objects. Moreover, some objects can be downloaded very often.
Remember, that we pay for every cryptographical request by using KMS. Such a scenario can be expensive.

**S3 Bucket Key allows us to reduce the costs for cryptographic operation with S3 objects**

A bucket key is a symmetric key, that is created on the bucket level. It is encrypted once by a CMK in KMS and returned to
the S3 Service. Now the S3 Service can generate data keys for every object and encrypt them with a bucket key outside KMS.
It reduced the traffic to AWS KMS from the S3 storage service, and the number of cryptographic operations inside KMS.

![Bucket Key](/assets/img/posts/securing-data-in-aws/BucketKey.png)

Unlike the other storage service, we can change encryption options after the encryption for every object. It means we
can change the encryption of an object for example from AWS managed key to the AWS Customer Managed Key anytime.

Using REST API or AWS SDK we can define the encryption option of single objects every time by upload. So we can encrypt
every S3 object differently. For example, we can have three files. The first file is encrypted with Amazon S3 Key, the
second file is encrypted using AWS KMS, and the third file is encrypted with a customer provide key, which we sent by
uploading the file.

## Conclusion

AWS provides many solutions for the protection of the data in the cloud using server-side encryption. The AWS Key Management
Service has a very simple interface and good integration with the storage services of AWS. The Cloud HSM provides a solution for
higher security requirements. It is possible to combine both services for secure key management. The storage
service like EFS, FSx, EBS, and S3 can be easily and securely protected with help of AWS and CloudHSM.



