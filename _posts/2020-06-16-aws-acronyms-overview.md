---
title: "What is AWS? An overview with acronyms."
categories: [craft]
modified: 2020-06-18
excerpt: "AWS is vast with all kinds of services under different domains. This article introduces the most commonly used AWS services along with their acronyms."
image:
  auto: 0028-stream
---

***AWS -Amazon Web Services provides a cloud computing platform comprising services under a wide range of portfolios like compute, storage, networking, data, security, and many more.***This makes AWS vast and looks daunting to many newcomers. I will attempt to make this easy by describing some of the popular AWS services.

##  Choose your Regions and AZs to Run your Workloads
One of the first decisions we make is where to run our applications? Where are our servers located? We may like to host our applications closer to the location of our customers. AWS data centers are located all across the globe.
AWS Regions and AZs](https://aws.amazon.com/about-aws/global-infrastructure/regions_az/) are essential entities of this global infrastructure.***An AWS Region is composed of multiple AZ-availability zones, with each AZ mapped to physical data centers located in that region.***
***An AZ-Availability Zone is a logical data center within a region.*** 
AWS resources are scoped either to a region, in an AZ, or are global. 

## Create your VM with EC2 Attached to One or More EBS Volumes
Next, we proceed to create our VM - Virtual Machine over which we can run our applications. ***[EC2-Elastic Compute Cloud](https://aws.amazon.com/ec2/features/) is the service used to create VMs.***We create the VM as an EC2 instance using a pre-built machine image from Amazon (called AMI) or a custom image.*** A machine image is similar to a pre-built template containing the operating system with some pre-configured applications installed over it.*** For example, we can use a machine image for Windows 2016 server with SQL Server or an RHEL Linux with docker, for creating our EC2 instance. We also need to select an instance family to decide the number of CPUs and RAM for our VM. These range from nano instances, with one virtual CPU, to instance families of high-end configurations.
We can enable autoscaling to create additional instances when we exceed a certain threshold of capacity utilization. Alternatively, we can scale down by terminating instances when our servers are underutilized. We do this by monitoring various metrics from our running EC2 instances. 
Each EC2 instance is backed up by storage in the form of [EBS](https://aws.amazon.com/ebs/) volumes. ***An EBS-Elastic Block storage volume is block-level storage used to store data that we want to persist beyond the lifetime of our EC2 instances. EBS volumes are attached and mounted as disks to our VM.*** EBS volumes are automatically replicated in the same availability zone to achieve redundancy and high availability.

## Distribute Traffic with ELB
[ELB-Elastic Load Balancing](https://aws.amazon.com/elasticloadbalancing) is the load balancing service of AWS.***Elastic Load Balancing distributes incoming application traffic(layer 7), and network traffic(layer 4) across multiple targets, such as Amazon EC2 instances, containers, IP addresses, and Lambda functions.*** ELB is a region level resource. We always have the option of deploying our own load balancer on an EC2 instance. But ELB comes as a fully managed service. It scales automatically to handle the varying load of our application traffic and distributes load to our targets in a single Availability Zone, or across multiple availability zones, thereby making our applications highly available and fault-tolerant.

## Create your Network with VPC
Our EC2 instances need to communicate with each other to be useful. We will also need to protect these by putting them in a secure private network called [VPC-Virtual Private Cloud](https://aws.amazon.com/vpc).***VPC-Virtual Private Cloud is our logically isolated private network with subnets, route tables and network gateways within an AWS region***. We specify a pool of IP addresses for our VPC by specifying the IP range in CIDR-Classless Interdomain routing notation.
***The VPC is divided into multiple subnets, each of them associated with a subset of IP addresses allocated to the parent VPC.***Our EC2 instances are launched within a subnet and are assigned IP addresses from the subnet's pool of IP addresses.
Our instances get different IP every time we launch an instance. If we need fixed IP, we reserve IPs using EIP-Elastic IP Addresses.
### Protect your Instance with SG and Network ACL
We control traffic to an EC2 instance using (SG-Security Group)[https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html]. ***We set up rules for incoming traffic-ingress and outgoing traffic - egress.*** Additionally, we control traffic for an entire subnet using a (network ACL-Access Control List)[https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html].
### Connect to your On-Premise Systems with VPN or DX
Enterprises operate hybrid cloud environments to connect their on-premise resources to resources in the public cloud.AWS provides two categories of services-(VPN-Virtual Private Network)[https://aws.amazon.com/vpn] and (DX-AWS Direct Connect)[https://aws.amazon.com/directconnect].
***With AWS (VPN-Virtual Private Network) service, we can create IPsec Site-to-Site VPN tunnels from a VPC to an on-premises network over the public internet .***This is a good option for limited hybrid cloud requirements. 
In contrast, with ***(DX-AWS Direct Connect), we can establish dedicated 'ultra-low latency' connections from on-premises to AWS.***With DX, we reduce network charges and experience a more consistent network performance utilizing a higher bandwidth.

## Control Access with IAM
[IAM-Identity and Access Management](https://aws.amazon.com/iam/) is an all-encompassing service for authentication and authorization in AWS, coming into action from the time we create our AWS account. Access to resources is provided based on the principle of least privilege. We also use identity in the form of a username and password or an access token and secret in case of applications to access AWS resources.***We create users, groups, and roles with IAM and grant or deny access to resources declaratively with policies.***IAM also provides SSO-Single Sign-on capabilities by integrating with SAML and OpenID based identity providers residing within or outside AWS. 
An SCP-Service Control Policy is used to draw permission boundaries across one or more AWS accounts. 
An STS-Security Token Service is used to generate a temporary access token to invoke an AWS service, either using the AWS SDK-Software development kit or from AWS CLI-Command Line Interface.

## Store Objects on S3
[S3-Simple Storage service](https://aws.amazon.com/s3) is the most important service in AWS portfolio. It is the foundation over which many AWS services are built. It embodies many of the features inherent to Cloud. ***S3 provides object unlimited storage, scales to any extent, durability, possesses layered security model and comes with a simple API.*** We can store all kind of objects in S3 like files, images, videos, EBS snapshots, machine images without worrying about file size or data integrity and durability. 
We store an object in containers called bucket with a key and some metadata as object attributes. We apply our access controls on the bucket or on the S3 object. S3 offers a range of storage classes to store our objects in appropriate storage tiers based on our access requirements. Additionally, we can use lifecycle policies to define rules like delete an object or move to different storage tier after certain time period.
S3 is widely used in many varied use cases like web hosting, data lakes in big data, archival, secure log storage. S3 plays a big part in migration of different workloads to cloud.

## Databases for Data Persistence
Well, we can install our database in an EC2 instance but this will entail continuing with the rigmarole of database administration tasks like applying security patches and taking scheduled backups. AWS provides a managed service offering, where you place your order with AWS, and AWS provisions one for you.
### Store Relational Data with RDS
***[RDS](https://aws.amazon.com/rds)-Relational Data Service is the managed database offering for relational databases where we can choose our database from Oracle, SQL Server, MySQL, PostgreSQL, MariaDB, and Aurora. We also select the EC2 instance family with a VPC subnet*** 
### Store NoSQL with DDB
[DDB-DynamoDB](https://aws.amazon.com/dynamodb) is a proprietary NoSQL database of AWS. ***It is fully managed, fast and efficient at any scale with single-digit millisecond latency.*** DynamoDB is a (wide-column/key-value store)[https://en.wikipedia.org/wiki/Wide-column_store]. We cannot do things like joins or aggregations with DynamoDB. Being fully managed, AWS will manage the instances in the DynamoDB fleet to ensure its availability and performance. DynamoDB is also the preferred database to use with lambda functions.

## Messaging with SQS and SNS
We apply [messaging patterns](https://www.enterpriseintegrationpatterns.com/patterns/messaging/Messaging.html) to make our applications resilient, fault-tolerant and highly available. AWS takes away the complexity of managing our own middleware by providing the messaging infrastructure in the form of two managed services -[SQS](https://aws.amazon.com/sqs) and SNS](https://aws.amazon.com/sns). 
***SQS-Simple Queue Service is the messaging middleware to send, store, and receive messages.***  SQS comes in two flavors: 
Standard queue guarantees at least once delivery with best-effort ordering.
FIFO-First in First Out queue guarantees ordering with exactly-once processing.
***SNS-Simple Notification Service is a pub-sub messaging middleware. The sender publishes a message to a Topic which is subscribed by one or more consumers.***
Access to Queues and Topics are managed using **resource policies**.

## Code your Infrastructure with CFN
Managing Infrastructure as Code (IAC) involves creating the infrastructure resources like servers, databases, message queues, network firewalls on the fly, and dispose of them when no longer required. Creating the AWS resources manually is going to be tedious and error-prone. We instead model all the resources in a single [cloudformation](https://aws.amazon.com/cloudformation) template and manage them in a single unit called a stack. For making changes we first generate a changeset to see the list of proposed changes before applying the changes.
***CFN-CloudFormation allows us to define our infrastructure 'stack' in YML files containing a group of resources (think EC2, ELB, Security Groups, RDS instances, etc).*** We create and update our infrastructure by executing these from AWS console, CLI, or integrating with our CI/CD pipelines. CloudFormation is a widely used service and is integral to all automation and provisioning activities.

## Pull Images from ECR to Run Containers on ECS & EKS
Our container infrastructure requires a registry like Docker hub where we publish our images and an orchestration system for creating our desired number of container instances across multiple host machines like EC2 instance. AWS provides [ECR](https://aws.amazon.com/ecr) for image registry and [ECS](https://aws.amazon.com/ecs) for container orchestration.
***ECR-Elastic Container Registry provides a private registry for our container images with access controlled by IAM policies***.
***ECS-Elastic Container Service is the container orchestration service for running stateless and stateful containers using tasks and services***.  Here are some hands-on [series of articles](https://reflectoring.io/aws-deploy-docker-image-via-web-console/) for learning about running your applications on ECS.
**EKS-Elastic Kubernetes Service is the managed Kubernetes offering from AWS.*** Setting up Kubernetes is not for the faint of heart. We need to provision our VMs to set up the control node and worker nodes. EKS provides a managed control plane and managed worker nodes
Both ECS and EKS come with a Fargate option for provisioning EC2 instances in a serverless way.

## Serverless Compute with Lambda and SAM
With [lambda](https://aws.amazon.com/lambda) we can get rid of provisioning our servers and plan for scaling.
***Lambda is the service for running functions in a serverless model.*** We provide our function written in one of the supported languages with enough permissions to execute. 
The server for executing the function is provisioned at the time of invocation. The infrastructure is dynamically scaled, depending on the number of concurrent requests. 
***Lambda is commonly invoked by events from other AWS services like API Gateway, SQS, SNS, or Cloudwatch***.
***SAM-Serverless Application Model*** is the framework for developing lambda applications with useful tools like a CLI, a local test environment based on docker, and integration with developer tools.*** 
 
## Deliver Content with CloudFront
(AWS CloudFront)[https://aws.amazon.com/cloudfront/] is a CDN-content delivery network service to serve content from the nearest AWS POP-point of presence. ***It is a global autoscaled service integrated for content origin with resource endpoints in EC2, ELB, and S3.*** 

## DNS with Route 53
(AWS Route 53)[https://aws.amazon.com/route53/] is the DNS-Domain Name System service with capabilities of high availability and scalability. ***It provides ways to route incoming end-user requests to resources within AWS like EC2, ELB load balancer and also to resources outside AWS using a group of routing rules based on network latency, geo-proximity, and weighted round-robin.***


## Governance, Compliance & Audit with CloudTrail
Security in the cloud works on the principle of shared responsibility something you will find repeated ad-nausea across AWS literature. AWS is responsible for the security of the cloud and we are responsible for security in the cloud. [CloudTrail](https://aws.amazon.com/cloudtrail) is a service that is switched on by default in an AWS account but we need to build controls to ensure nobody switches it off, modifies the generated trails, sends trails to an S3 bucket accessible to our security teams.
***CloudTrail helps to gain complete visibility into all user activity in the form of events telling you who did what and when. It provides event history of all the activities done in your AWS account.***

## CloudWatch-Capture Logs Monitor With Alarms & Remediate With Events
With the advent of distributed applications, observability has emerged as a key capability to monitor the health of systems and identify the root cause of problems like outage or slowness.[CloudWatch](https://aws.amazon.com/cloudwatch) is understandably among the first services from AWS stable.***AWS CloudWatch comprises services for logging, monitoring, and event handling***. We send logs from various AWS resources like EC2 and even our applications to CloudWatch. Resources also emit a set of metrics over which we create alarms, for example, CPU above 80% to enable us to take remedial actions. CloudWatch Events rechristened EventBus allows us to configure remedial actions in response to any events of our interest.
 
## Conclusion with Mind Map
 Putting everything together in the mind map below.

 ![AWS Mind Map](/assets/img/posts/aws-acronyms-overview/mindmapaws.png)

 AWS is a behemoth. I tried to give you a peek by covering the main capabilities of the commonly used services. We saw global scoped services like IAM, Route 53. We also saw the elastic nature of services like ELB, S3, VPN, DX, EC2 which can autoscale based on demand. 
 With some more reading, you should be able to start building useful applications. This in itself is a great incentive to dig deeper into the world of AWS.