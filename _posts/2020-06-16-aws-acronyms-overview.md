



# AWS and Acronyms
**AWS** - ***Amazon Web Services*** provides a cloud computing platform comprising services under different portfolios like compute, storage, networking, data, etc. AWS is vast and looks daunting to many newcomers. I will attempt to make this easy here by introducing the AWS landscape using **Acronyms**.
An ***acronym*** is a word formed from the first few letters or groups of letters in a name or phrase. It is a memory technique that helps us associate the information we want to remember with a simple shortcut.
Today **Acronyms** are dominating all AWS conversations. Everybody uses them, even if they don’t know their name. 

# Create VM with EC2 of AMI type & attached to one or more EBS
We start our AWS **acronym** journey with the humble **VM**- ***Virtual Machine***. A virtual machine is a computer with an OS and RAM on which we run our applications. 
**EC2** -***Elastic compute*** is the service used to create VMs using an **AMI**. **AMI**- ***Amazon machine image*** can be thought of as a pre-built template containing the OS to be used along with applications installed over it. 
Each **EC2** instance is backed up by storage in the form of **EBS**-***Elastic Block storage*** which can be attached and mounted as disks to your **VM**. 
EBS comes in two different flavours- **SSD** ***(Solid-state drive)*** and **HDD** ***(Hard disk drive)*** backed volumes. SSD volumes are of type **GP2** - ***General Purpose*** and Provisioned IOPS (**io1**)- Provisioned Input output storage. HDD volumes are of type Throughput optimized (**st1**) and cold HDD(**sc1**).

# Isolate with Regions and AZs
An **AWS region** is a physical location containing a group of data centers. Each region is divided into multiple isolated data centers called **AZ**-***Availability Zone***. AWS resources are scoped either to a region or **AZ** or are global.

# Create your network-VPC
**VPC**-***Virtual Private Cloud*** is our private network. A **VPC** network is created within an **AWS region**. We specify a pool of IP addresses for our **VPC** by specifying the IP range in  **CIDR**-***Classless Interdomain routing*** notation. 
The **VPC** is divided into multiple subnets each associated with a subset of IP addresses allocated to the parent **VPC**. Our **EC2** instances are launched within a subnet with IP addresses assigned from the subnet's pool of IP addresses. 
Additionally, you can reserve IPs that are reachable from the internet for your EC2 instances using **EIP**-***Elastic IP Addresses***. 

### Protect your instance with SG and subnet with ACL
You can control traffic for an **EC2** instance using **SG**-***Security Group*** where you set up rules for incoming traffic-**ingress** and outgoing traffic - **egress**.
However, you can control traffic for an entire subnet using a network **ACL**-***Access Control List***

### Connect to on-premise systems over VPN or DX
Connect to your on-premise servers using **VPN**-***Virtual Private Network*** or a dedicated leased line ***DX***- **AWS Direct Connect**. VPN is a secure connection over the internet while DX is a dedicated high-speed network connection between AWS and our private network.
 
# Control access with IAM
Use **IAM**-***Identity and Access Management***  to manage users, groups, and roles. Permissions are defined using **policies** to allow or deny access to AWS services and APIs. 
Policies are of different types. An **IAM policy** is used to define permissions for a user or group. A **Resource policy** is used to grant permission to an AWS resource like a bucket or queue/topic. An **SCP**-***Service Control Policy** is used to draw permission boundaries across one or more AWS accounts. 
An **STS**-***Security Token Service*** is used to generate a temporary access token to invoke an AWS service either using AWS **SDK**-***Software development kit*** or from AWS ***CLI***-**Command Line Interface**.
 
# Store objects on S3
**S3**-***Simple Storage Service*** is the oldest AWS service used to store objects in containers called **buckets**. We can control access to buckets and objects using **resource policies**.
**S3** comes with storage classes classified based on access patterns. 
**Standard**-Frequently accessed
**Standard IA**-Infrequently accessed
**Standard one zone IA**-Long-lived Less frequently accessed
**Glacier**-Long time archival
**Intelligent Tiering**- for unknown access patterns

# Store relational data with RDS and NoSQL with DDB
**RDS**-***Relational Data Service*** is the managed database offering from AWS where AWS takes over many of our activities like patching, taking backups, and failover. 
We can choose our database from Oracle, SQL Server, MySQL, PostgreSQL, MariaDB, and Aurora. 
**BYOL**-***Bring your own License*** option allows you to use your own Enterprise database license instead of using the included license from AWS.  
**DDB**-***Dynamo DB*** is a nosql global database for storing NoSQL data.

# Decoupled communication with SQS and SNS
**SQS**-***Simple Queue Service*** is the messaging middleware to send, store, and receive messages.  **SQS** comes in two flavors: **Standard queue** - guarantees at least once delivery with best-effort ordering.
**FIFO**-***First in First Out*** guarantees ordering with exactly-once processing.
**SNS**-***Simple Notification Service*** is a pub-sub messaging middleware. The sender publishes a message to a **Topic** which is subscribed by one or more consumers.
Access to Queues and Topics are managed using **resource policies**.

# Code your infra with CFN or CDK
**CFN**-***CloudFormation*** rarely called by the acronym is the service to create and update infrastructure by declaring resource configuration in YML files. **CDK**-***Cloud Development Kit*** is a relatively new service for creating infrastructure using your favorite programming languages like javascript(NodeJS), java, dot net makes it a more developer-friendly option.

# Pull images from ECR to run containers on ECS & EKS
**ECR**-***Elastic Container Registry*** provides a private registry for your docker images with access controlled by **IAM**.
**ECS**-***Elastic Container Service*** is the container orchestration service for running stateless and stateful containers using **tasks** and **services**.  You can start your AWS journey for running containers by following these [series of articles](https://reflectoring.io/aws-deploy-docker-image-via-web-console/).
**EKS**-***Elastic Kubernetes Service*** is the managed Kubernetes offering from AWS for running containers.
Both **ECS** and **EKS** come with a **Fargate** option for provisioning EC2 instances in a serverless way.

# Serverless compute with lambda and SAM
**Lambda** is the service for running functions in a serverless model. You provide your function written in one of the supported languages with enough permissions. 
The server for executing the function is provisioned at the time of invocation. The infrastructure is dynamically scaled depending on the number of concurrent requests. 
**Lambda** is commonly invoked by events from other AWS services like **API Gateway**, **SQS**, **SNS**, or **Cloudwatch**.
**SAM**-***Serverless Application Model*** is the framework for developing lambda applications with useful tools like a CLI, a local test environment based on docker, and integration with developer tools. 
 
# Monitor/Log with CloudWatch & Audit with CloudTrail
These do not have acronyms but are among the most important all-pervasive services in the AWS portfolio.
**CloudTrail** captures the audit information telling you who did what and when. It provides an event history of all the activities done in your AWS account.
**CloudWatch** encompasses services for logging, monitoring, and event handling. You can set up by creating alarms on metrics generated by different AWS services.
 
 # Conclusion
 I tried to provide a beginner level introduction to **AWS** using **acronyms**. I covered only the most popular and useful ones from different domains. I hope it will get you excited enough to dig deeper into AWS. 
