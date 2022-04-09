---
authors: [pratikdas]
title: "Getting Started with Amazon EC2"
categories: ["aws"]
date: 2022-03-03T00:00:00
excerpt: "Amazon Elastic Compute Cloud (EC2) is a compute service with which we can create virtual machines in the AWS Cloud. We can configure the computing capacity of an EC2 instance and attach different types and capacities of storage which we can further scale up or down to handle changes in server load and consumer traffic, thereby reducing our need to forecast the capacity for investing in hardware upfront. In this article, we will introduce the Amazon EC2 service and understand some of its core concepts like instances, instance types, disk storage, networking, elastic capabilities, and security by creating a few instances of EC2 and applying different configurations to those instances."
image: images/stock/0115-2021-1200x628-branded.jpg
url: getting-started-with-Amazon-EC2
---
Amazon Elastic Compute Cloud (EC2) is a compute service with which we can create virtual machines in the AWS Cloud. We can configure the computing capacity of an EC2 instance and attach different types and capacities of storage which we can further scale up or down to handle changes in server load and consumer traffic, thereby reducing our need to forecast the capacity for investing in hardware upfront. 

In this article, we will introduce the Amazon EC2 service and understand some of its core concepts like instances, instance types, disk storage, networking, elastic capabilities, and security by creating a few instances of EC2 and applying different configurations to those instances.

## Creating an Amazon EC2 Instance

Let us get a flavor of the EC2 service by creating what we call an "EC2 instance". 

An EC2 instance is a virtual machine in the cloud. Like most AWS resources we can create an EC2 instance from the [AWS administration console](https://us-east-1.console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances:), [AWS Command Line Interface(CLI)](https://aws.amazon.com/cli/), or by leveraging IaC services: Cloudformation and AWS CDK. 

The minimum information required for creating an EC2 instance is the operating system like Linux, Windows, or Mac along with the size (CPU, memory, storage) of the virtual machine. We provide the operating system when we select the AMI. The size of the virtual machine is specified through the configuration: instance type.

### Creating a Linux EC2 instance
Let us create an EC2 instance which will have Linux OS and size: 1 CPU from the [AWS administration console](https://us-east-1.console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances:) as shown in this diagram:

{{% image alt="Create EC2 instance" src="images/posts/aws-ec2/creating-ec2-short.png" %}}

For creating the instance, we have selected an Amazon Machine Image(AMI) named: `Amazon Linux 2 AMI (HVM) - Kernel 5.10, SSD Volume Type` and an instance type: `t2.micro`. 

**An Amazon Machine Image (AMI) is a template that contains a base configuration for the virtual machine that we want to create.** It includes the operating system, root storage volumes, and some pre-installed applications. The Amazon Linux AMI used in this example includes packages, and configurations for integration with Amazon Web Services, and is pre-installed with many AWS API tools.

**Instance types comprise varying combinations of CPU, memory, storage, and networking capacity and give us the flexibility to choose the appropriate mix of resources for our applications.** We have selected our instance type as `t2.micro` in this example, which is a low-cost, general-purpose instance type that provides a baseline level of CPU performance with the ability to burst above the baseline when needed.

In the last step of creating the instance, we need to choose from an existing Key pair or create a new Key pair which we use to connect to our instance when it is ready. A Key pair which is a combination of public key which is stored by AWS and a private key which we need to store. We had created a new key pair and downloaded the private key and stored it in our local workstation. We will explain this further in the next section when we will connect to this EC2 instance.

We have accepted default properties for all other configurations like storage volume, and security group.

When we launch an EC2 instance, it takes a short time for the instance to be ready and it remains in its initial state of `pending`. The state of the EC2 instance changes to `running` after it starts and it receives a public DNS name. We can see the EC2 instance in the `running` state as shown below:

{{% image alt="Running EC2 instances" src="images/posts/aws-ec2/running-ec2.png" %}}

We can also see attributes of the running instance in the lower block. Some of the important attributes to note are: 
* instance ID: This is the identifier of the instance
* public DNS name: Public DNS name of the instance
* Availability Zone: Availability Zone where the instance is created
* Security Group: Set of rules to allow or disallow incoming and outgoing traffic to the EC2 instance

We will use these attributes to add or modify the configurations of our EC2 instance in the subsequent sections.

### Creating a Windows EC2 Instance
Let us create a Windows EC2 instance in a similar way by selecting a AMI for Windows Operating System as shown below:

{{% image alt="Create EC2 Windows instance" src="images/posts/aws-ec2/create-ec2-windows.png" %}}

As we can see from the description of the AMI, this will create an EC2 instance with the `2019` version of the `Microsoft Windows` operating system. 

## Connecting to the EC2 Linux Instance
We connect to EC2 instances created with Linux AMIs using SSH client. 

For accessing the EC2 instance we had created a SSH Key pair during instance creation for connecting to the instance. The SSH key pair is used to authenticate the identity of a user or process that wants to access the EC2 instance using the SSH protocol.

A key pair as explained earlier is a combination of public key which is stored by AWS and a private key which we need to store. We had downloaded the private key and stored it in our workstation in path: `~/Downloads/mykeypair.pem`.

The public key is saved in a file `.ssh/authorized_keys` in the EC2 instance that contains a list of all authorized public keys.

We use the below ssh command to connect to our instance with our own private key:

```shell
chmod 400 ~/Downloads/mykeypair.pem
ssh -i ~/Downloads/mykeypair.pem ec2-user@ec2-34-235-151-78.compute-1.amazonaws.com
```
Before running the `ssh` command, we change the permission of our private key file.  We have used the public DNS name: `ec2-34-235-151-78.compute-1.amazonaws.com` to connect to our instance. The logged in ssh session for our EC2 instance looks like this:
```shell
       __|  __|_  )
       _|  (     /   Amazon Linux 2 AMI
      ___|\___|___|

https://aws.amazon.com/amazon-linux-2/
[ec2-user@ip-172-31-31-48 ~]$ 

```
As we can see, we have logged in as `ec2-user` and can execute commands in the linux shell.

## Connecting to the EC2 Windows Instance
To connect to a Windows instance, we first retrieve the initial administrator password using the private key file and then enter this password when we connect to our instance using Remote Desktop. The name of the administrator account depends on the language of the operating system. For example, for English, it's `Administrator`.

{{% image alt="EC2 Windows instance generate password" src="images/posts/aws-ec2/win-gen-pwd.png" %}}

For Windows AMIs, the private key file is required to obtain the password used to log into our instance.

## Important EC2 Configurations : Volumes, Security Groups
When creating the instance earlier we had specified the AMI and instance type for creating the EC2 instance. We had accepted default values for all other configurations. However, in most real-life situations we need to configure those properties when creating EC2 instances. 

`ec2-54-235-20-109.compute-1.amazonaws.com.rdp`

{{% image alt="EC2 Windows instance generate password" src="images/posts/aws-ec2/win-connecting.png" %}}
{{% image alt="EC2 Windows instance generate password" src="images/posts/aws-ec2/win-login.png" %}}

If our instance is joined to a domain, we can connect to our instance using domain credentials you've defined in AWS Directory Service. On the Remote Desktop login screen, instead of using the local computer name and the generated password, use the fully-qualified user name for the administrator (for example, corp.example.com\Admin), and the password for this account.

Let us understand these important configurations we set during creation of an EC2 instance

### Adding Data Storage for EC2 Instance

EC2 provides the following data storage options for our instances. Each option has a unique combination of performance and durability:
1. Elastic Block Store (EBS): We use EBS as a primary storage device for data that requires frequent and granular updates for example a write heavy database. EBS provides durable, block-level storage volumes that we can attach to a running instance. 
EBS provides the different volume types: General Purpose SSD (gp2 and gp3), Provisioned IOPS SSD (io1 and io2), Throughput Optimized HDD (st1), Cold HDD (sc1), and Magnetic (standard). They differ in performance characteristics and price, allowing you to tailor your storage performance and cost to the needs of your applications. For more information, see Amazon EBS volume types.
2. EC2 instance store: 
3. EFS: We use an EFS file system as a common data source for workloads and applications running on multiple instances.EFS provides scalable file storage.
4. S3: S3 provides access to reliable and inexpensive data storage infrastructure.

Root Storage Device: The root storage device contains all the information necessary to boot the instance. A root storage device is created for an instance, when we launch an instance from an AMI.


We can attach an EBS volume to any EC2 instance in the same Availability Zone. After we attach a volume, it appears as a native block device similar to a hard drive or other physical device. At that point, the instance can interact with the volume just as it would with a local drive. 

Let us create a EBS volume in the `us-east-1b` where our EC2 instance is running.


### Networking
VPC is a virtual network dedicated to an AWS account. When we launch an instance, we can select a subnet from the VPC. The instance is configured with a primary network interface, which is a logical virtual network card. The instance receives a primary private IP address from the IPv4 address of the subnet, and it is assigned to the primary network interface.

### User Data
We can pass user data to the EC2 instance for performing common automated configuration tasks and run scripts after the instance starts. We can pass two types of user data to Amazon EC2: shell scripts and cloud-init directives.

```shell
#!/bin/bash
yum update -y
yum -y install httpd
usermod -a -G apache ec2-user
chown -R ec2-user:apache /var/www
chmod 2775 /var/www
echo "Hello from $(hostname -f)" > /var/www/html/index.html
systemctl start httpd
systemctl enable httpd
```

{{% image alt="Create EC2 instance" src="images/posts/aws-ec2/user-data.png" %}}

We also need to add an inbound security rule to allow traffic from port `80` as shown below:

{{% image alt="Create EC2 instance" src="images/posts/aws-ec2/inbound-sg.png" %}}

We should be using AWS CloudFormation and AWS OpsWorks for more complex automation scenarios.


## Security
Security in all cloud platforms is based on a shared responsibility model consisting of two components:

Security of the cloud: AWS is responsible for protecting the infrastructure that runs AWS services in the AWS Cloud. AWS also provides you with services that you can use securely. 

Security in the cloud: This component of the security includes:
Controlling network traffic
1. Restrict access to our instances with security groups. 
2. Prevent internet access by putting the instances in private subnets




## Register EC2 as Targets of an Application Load Balancer
We can register EC2 instances as targets of an Application Load Balancer. The load balancer distributes incoming application traffic across multiple targets, such as EC2 instances, in multiple Availability Zones. This increases the availability of our application. 

{{% image alt="LB Targets" src="images/posts/aws-ec2/lb-targets.png" %}}

{{% image alt="LB Targets" src="images/posts/aws-ec2/lb-create.png" %}}

Elastic Load Balancing offers two types of load balancers that both feature high availability, automatic scaling, and robust security. These include the Classic Load Balancer that routes traffic based on either application or network level information, and the Application Load Balancer that routes traffic based on advanced application level information that includes the content of the request.

## Auto Scaling a EC2 Fleet
Auto Scaling ensures that you have the correct number of Amazon EC2 instances available to handle the load for your application. We create collections of EC2 instances, called Auto Scaling groups and specify the maximum and minimum number of EC2 instances in an auto scaling group.EC2 Auto Scaling ensures that the number of instances never goes below th

If you specify scaling policies, then Amazon EC2 Auto Scaling can launch or terminate instances as demand on your application increases or decreases.

An EC2 Fleet contains a group of On-Demand and Spot instances. We can automate the management of a fleet of EC2 instances with Auto Scaling to meet a pre-defined target capacity.
An EC2 Fleet contains the configuration information to launch a group of instances.

We can use Auto Scaling to automatically increase the number of EC2 instances during spikes in demand to maintain performance and decrease capacity during lulls to reduce costs.

## Monitoring an EC2 Instance

At a minimum, we monitor the following metrics in an EC2 instance:

1. NetworkIn
1. NetworkOut
2. DiskReadOps
3. DiskWriteOps
4. DiskReadBytes
5. DiskWriteBytes
6. CPUUtilization

By default, EC2 sends metric data to CloudWatch in 5-minute periods. We can enable detailed monitoring on the EC2 instance to send metric data for our instance to CloudWatch in 1-minute periods. The Amazon EC2 console displays a series of graphs based on the raw data from Amazon CloudWatch. 

{{% image alt="Create Alarm" src="images/posts/aws-ec2/create-alarm.png" %}}

Depending on your needs, you might prefer to get data for your instances from Amazon CloudWatch instead of the graphs in the console.

* CloudWatch Alarms
* EventBridge
* CloudWatch Logs
* CloudWatch agent 

## Optimizing Costs with Purchasing Options
We can use the following purchasing options of EC2 to optimize our cost of using EC2:

**On-Demand Instances**:  We pay by the second for the running instances.
**Savings Plans**: Reduce your Amazon EC2 costs by making a commitment to a consistent amount of usage, in USD per hour, for a term of 1 or 3 years.
Reserved Instances – Reduce your Amazon EC2 costs by making a commitment to a consistent instance configuration, including instance type and Region, for a term of 1 or 3 years.
Spot Instances – Request unused EC2 instances, which can reduce your Amazon EC2 costs significantly.
Dedicated Hosts – Pay for a physical host that is fully dedicated to running your instances, and bring your existing per-socket, per-core, or per-VM software licenses to reduce costs.
Dedicated Instances – Pay, by the hour, for instances that run on single-tenant hardware.
Capacity Reservations – Reserve capacity for your EC2 instances in a specific Availability Zone for any duration.

## Platform Services Based on EC2
EC2 is a foundation level service in the Amazon Cloud. Multiple platform level services are available in which take care of the provisioning of EC2:
1. Elastic Container Service (Amazon ECS) is a highly scalable and fast container management service.
2. Fargate: With AWS Fargate, you don't need to manage servers, handle capacity planning, or isolate container workloads for security. Fargate handles the infrastructure management aspects of your workload for you.
3. AWS Elastic Beanstalk makes it easy for you to create, deploy, and manage scalable, fault-tolerant applications running on the AWS Cloud.

## Conclusion

Here is a list of the major points for a quick reference:



You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/kinesis).

