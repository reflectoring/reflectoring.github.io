---
title: "What is AWS? A High-Level Overview of the Most Important AWS Services"
categories: ["AWS"]
date: 2020-06-30T06:00:00
modified: 2020-06-30T06:00:00
authors: [pratikdas]
excerpt: "New to AWS? We've got you covered. AWS is a vast ocean of services across a bunch of different domains. This article introduces the most commonly used AWS services."
image: images/stock/0072-aws-1200x628-branded.jpg
url: what-is-aws
widgets: ["gyhdoca-ad", "stratospheric-ad"]
---

**AWS (Amazon Web Services) is a cloud computing platform with a wide portfolio of services like compute, storage, networking, data, security, and many more.**

This article provides an overview of the most important AWS services, which are often hidden behind an acronym. I hope it serves as a valuable aid to begin the exploration of AWS. I have selected the AWS services by considering the components required to build and run a customer-facing n-tier application.

While reading this article, you'll come across the IAAS (Infrastructure As A Service) and PAAS (Platform As A Service) categories of services. I have also included services under the serverless category, and services for running containers. I have not included services under specialized subjects like machine learning, IoT, security, and Big Data.

**If you like to learn about deploying a production-ready Spring Boot application to AWS, have a look at the [Stratospheric book](https://stratospheric.dev)!**

##  Choose a Region and Availability Zone
Whenever we think of cloud, one of the first decisions we make is where to run our applications. Where are our servers located? We may like to host our applications closer to the location of our customers. 

AWS data centers are located all across the globe. [AWS Regions and AZs](https://aws.amazon.com/about-aws/global-infrastructure/regions_az) (Availability Zones) are essential entities of this global infrastructure.

**An AWS region is composed of multiple AZs.** An AZ is a logical data center within a region. Each AZ is mapped to physical data centers located in that region, with redundant power, networking, and connectivity.
  
AWS resources are bound either to a region, to an AZ, or are global. 

## Run Virtual Machines with EC2
Next, we create our VM (Virtual Machine) to run our applications. **[EC2 (Elastic Compute Cloud)](https://aws.amazon.com/ec2/features) is the service used to create and run VMs.** We create the VM as an EC2 instance using a pre-built machine image from AWS (AMI - Amazon Machine Image) or a custom machine image.

**A machine image is similar to a pre-built template containing the operating system with some pre-configured applications installed over it.** For example, we can use a machine image for Windows 2016 server with SQL Server or an RHEL Linux with Docker for creating our EC2 instance. 

We also select an instance family to assign the number of CPUs and RAM for our VM. These range from nano instances, with one virtual CPU, to instance families of high-end configurations with a lot of processing power and memory.

We can enable autoscaling to create additional instances when we exceed a certain threshold of capacity utilization. Autoscaling will also take care of terminating instances when our servers are underutilized.

Each EC2 instance is backed by storage in the form of [EBS (Elastic Block Storage)](https://aws.amazon.com/ebs) volumes. **An EBS volume is block-level storage used to store data that we want to persist beyond the lifetime of our EC2 instances.**

EBS volumes are attached and mounted as disks to our VM. EBS volumes are automatically replicated in the same availability zone to achieve redundancy and high availability.

## Distribute Traffic with ELB
[ELB (Elastic Load Balancing)](https://aws.amazon.com/elasticloadbalancing) is the load balancing service of AWS. **ELB load balancers can distribute incoming traffic at the application layer (layer 7) or the transport layer (layer 4) across multiple targets, such as Amazon EC2 instances, containers, IP addresses, and Lambda functions.** A load balancer is a region-level resource. 

We always have the option of deploying our own, custom load balancer on an EC2 instance. But ELB comes as a fully managed service. It scales automatically to handle the load of our application's traffic and distributes load to our targets in a single AZ, or across multiple AZs, thereby making our applications highly available and fault-tolerant.

## Create a Network with VPC
Our EC2 instances need to communicate with each other to be useful. We will also need to protect these instances. We do this by putting them into a secure private network called [VPC (Virtual Private Cloud)](https://aws.amazon.com/vpc). 

**A VPC is our logically isolated network with private and/or public subnets, route tables and network gateways within an AWS region**. A VPC contains a certain range of IP addresses that we can bind to our resources.

A VPC is divided into multiple [subnets](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Subnets.html#vpc-subnet-basics), each of them associated with a subset of the IP addresses available to the parent VPC. Our EC2 instances are launched within a subnet and are assigned IP addresses from the subnet's pool of IP addresses.

Our instances get a different IP address every time we launch an instance. If we need fixed IPs, we reserve them using [EIP (Elastic IP)](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-eips.html) addresses.

### Protect Instance with Security Groups and Access Control Lists
We control traffic to an EC2 instance using a [Security Group](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html) (sometimes abbreviated SG). **With a Security Group, we set up rules for incoming traffic (ingress) and outgoing traffic (egress).**  

Additionally, we control traffic for an entire subnet using a [network ACL (Access Control List)](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html).

### Connect To On-Premises Systems with VPN or DX
Enterprises operate hybrid cloud environments to connect their on-premises resources to resources in the VPC. AWS provides two categories of services - [VPN (Virtual Private Network)](https://aws.amazon.com/vpn) and [DX (AWS Direct Connect)](https://aws.amazon.com/directconnect).
  
**With AWS VPN service, we can create IPsec Site-to-Site VPN tunnels from a VPC to an on-premises network over the public internet.** This is a good option when we have to adhere to corporate rules that require certain systems to be available from the cloud but to run in our own data center.
  
The other way around, **with DX, we can establish dedicated ultra-low latency connections from on-premises to AWS.** We also reduce network charges and experience a more consistent network performance with higher bandwidth.

## Control Access with IAM
[IAM (Identity and Access Management)](https://aws.amazon.com/iam) is an all-encompassing service for authentication and authorization in AWS, coming into action from the time we create our AWS account. 

**We create users, groups, and roles with IAM and grant or deny access to resources declaratively with policies.** We then provide our identity in the form of a username and password or an access token and secret, to access the AWS resources. 

IAM also provides SSO (Single Sign-on) capabilities by integrating with SAML (Security Assertion Markup Language) and OpenID based identity providers residing within or outside of AWS. 

An SCP (Service Control Policy) is used to draw permission boundaries across one or more AWS accounts. 

An STS (Security Token Service) is used to generate a temporary access token to invoke an AWS service, either using the AWS SDK (Software Development Kit) or from the AWS CLI (Command Line Interface).

## Store Objects on S3
[S3 (Simple Storage Service)](https://aws.amazon.com/s3) is one of the most widely used services in the AWS portfolio. It is the foundation on which many AWS services are built. It embodies many of the features inherent to the Cloud. 

**S3 provides unlimited object storage, scales to any extent, possesses a layered security model, and comes with a simple API.** We can store all kinds of objects in S3 like files, images, videos, EBS snapshots, or machine images without worrying about file size or data integrity and durability. 

We store an object in a container called bucket, with a key and some metadata as object attributes. We apply our access controls on the bucket or the S3 object. S3 offers a range of storage classes to store our objects in relevant storage tiers based on our access requirements. 

Additionally, we can use lifecycle policies to define rules, for example, a lifecycle policy on a bucket for deleting or moving an object after a certain time.

S3 is widely used in various use cases, like web hosting, data lakes in big data, archiving, and secure log storage. S3 also plays a big part in the migration of different workloads to the cloud.

## Store Data in Databases
We *could* install our own, custom database on an EC2 instance but this will entail the rigmarole of database administration tasks like applying security patches and running scheduled backups. AWS provides managed services for different kinds of databases.

### Store Relational Data with RDS
[RDS (Relational Data Service)](https://aws.amazon.com/rds) is the managed database offering for relational databases where we can choose our database between Oracle, SQL Server, MySQL, PostgreSQL, MariaDB, and Aurora. 

We can select the processing and memory power as well as the VPC the database shall be placed into. 

### Store NoSQL with DDB
[DDB (DynamoDB)](https://aws.amazon.com/dynamodb) is a proprietary NoSQL database of AWS. **It is fully managed, fast, and efficient at any scale with single-digit millisecond latency.** 

DynamoDB is a [wide-column/key-value store](https://en.wikipedia.org/wiki/Wide-column_store). We cannot do things like joins or aggregations with DynamoDB, so we should know the access patterns before deciding to go with Dynamo. 

Being fully managed, AWS will manage the instances in the DynamoDB fleet to ensure its availability and performance. DynamoDB is also the preferred database to use with lambda functions.

## Exchange Messages with SQS and SNS
We apply asynchronous [messaging patterns](https://www.enterpriseintegrationpatterns.com/patterns/messaging/Messaging.html) to make our applications resilient and highly available. AWS takes away the complexity of managing our middleware by providing the messaging infrastructure in the form of two managed services -[SQS](https://aws.amazon.com/sqs) and [SNS](https://aws.amazon.com/sns). 

**SQS (Simple Queue Service) is the messaging middleware to send, store, and receive messages.** SQS comes in two flavors: 
1. Standard queue guarantees at-least-once delivery with best-effort ordering.
1. FIFO (First In First Out) queue guarantees the order of messages received with exactly-once delivery.

**SNS (Simple Notification Service) is a pub-sub messaging middleware. The sender publishes a message to a topic that is subscribed by one or more consumers.**  

We manage access to queues and topics using resource policies.

## Code Infrastructure With CloudFormation
Managing infrastructure as code involves creating the infrastructure resources like servers, databases, message queues, network firewalls on the fly, and dispose of them when no longer required. Creating the AWS resources manually is going to be tedious and error-prone. 

Instead, we model all the resources in a single [CloudFormation](https://aws.amazon.com/cloudformation) (sometimes abbreviated CFN) template and manage them in a single unit called a stack. For making changes we first generate a changeset to see the list of proposed changes before applying the changes.

**CloudFormation allows us to define our infrastructure 'stack' in YML or JSON files which each specify a group of resources (think EC2, ELB, Security Groups, RDS instances, etc).** 

We create and update our infrastructure by interacting with these stacks from the AWS console, CLI, or by integrating them into our CI/CD pipelines. CloudFormation is a widely used service and is integral to all automation and provisioning activities.

## Run Containers On ECS & EKS
Our container infrastructure requires a registry like Docker hub to publish our images and an orchestration system for running the desired number of container instances across multiple host machines like EC2 instances. AWS provides [ECR](https://aws.amazon.com/ecr) for image registry and [ECS](https://aws.amazon.com/ecs) for container orchestration.  

**ECR (Elastic Container Registry) provides a private Docker registry for publishing our container images with access controlled by IAM policies**.  

**ECS (Elastic Container Service) is the container orchestration service for running stateless and stateful Docker containers using tasks and services**. If you're interested in deploying containers to AWS, have a look at our [AWS Journey series](/aws-cloudformation-deploy-docker-image/).

**EKS (Elastic Kubernetes Service) is Amazon's fully-managed Kubernetes offering.** EKS provides a managed control plane and managed worker nodes.

Both ECS and EKS come with a Fargate option for provisioning EC2 instances. Given a Docker image, AWS Fargate takes care of automatically provisioning and managing our servers.

## Serverless Compute with Lambda and SAM
With [AWS lambda](https://aws.amazon.com/lambda) we can eliminate activities of provisioning servers of the right capacity.

**Lambda is the AWS service for running functions in a serverless model.** We provide our function written in one of the supported languages with enough permissions to execute. 

The server for executing the function is provisioned at the time of invocation. The infrastructure is dynamically scaled, depending on the number of concurrent requests. 

**Lambda is commonly invoked by events from other AWS services like API Gateway, SQS, SNS, or Cloudwatch**.

**SAM (Serverless Application Model) is the framework for developing lambda applications with useful tools like a CLI, a local test environment based on Docker, and integration with developer tools.** 
 
## Deliver Content with CloudFront
**[AWS CloudFront](https://aws.amazon.com/cloudfront) is a CDN (Content Delivery Network) service used to serve both static and dynamic content using a global network of AWS POP (Points of Presence).** The content is served to the end-users from the nearest AWS POP to minimize latency. Some of the common usages are: 

* Deliver image and video files stored in an S3 bucket
* Deliver single-page applications composed of javascript, image and HTML assets in minified or exploded form
* Deliver an entire web portal accelerating both the download and upload functionalities in the portal

Other sources of content are web applications running on EC2, or an ELB load balancer routing requests to a fleet of EC2 instances running web applications.


## Route to Your IP with Route 53
[AWS Route 53](https://aws.amazon.com/route53) is the DNS (Domain Name System) service with capabilities of high availability and scalability. **It provides ways to route incoming end-user requests to resources within AWS like EC2 and ELB load balancers and also to resources outside of AWS using a group of routing rules based on network latency, geo-proximity, and weighted round-robin.**

## Governance, Compliance & Audit with CloudTrail
Security in the cloud works on the principle of shared responsibility (something you will find repeated ad-nausea across AWS docs). AWS is responsible for the security *of* the cloud and we are responsible for security *in* the cloud. 

[CloudTrail](https://aws.amazon.com/cloudtrail) is a service that is switched on by default in an AWS account but we need to build controls to ensure nobody switches it off, modifies the generated trails, sends trails to an S3 bucket accessible to our security teams.

**CloudTrail helps to gain complete visibility into all user activity in the form of events telling you who did what and when. It provides event history of all the activities done in your AWS account.**

## Observability with CloudWatch
With the advent of distributed applications, observability has emerged as a key capability to monitor the health of systems and identify the root cause of problems like outage or slowness. [CloudWatch](https://aws.amazon.com/cloudwatch) has understandably been among the first services.

**AWS CloudWatch comprises services for logging, monitoring, and event handling**. We send logs from various AWS resources like EC2 and even our applications to CloudWatch. Resources also emit a set of metrics over which we create alarms to enable us to take remedial actions. CloudWatch Events (renamed to EventBridge) allows us to configure remedial actions in response to any events of our interest.
 
## Conclusion 
 I have put everything together in the mind map below.

 [{{% image alt="AWS Mind Map](/assets/img/posts/aws-acronyms-overview/mindmapaws.jpg)" src="images/posts/aws-acronyms-overview/mindmapaws.jpg" %}}

 AWS is a behemoth. I tried to give you a peek by covering the main capabilities of the commonly used services. We also saw the elastic nature of services like ELB, S3, VPN, DX, EC2 which can autoscale based on demand. You can always refer to the AWS documentation to learn more about these services.
 
 **If you like to learn about deploying a production-ready Spring Boot application to AWS, have a look at the [Stratospheric book](https://stratospheric.dev)!**