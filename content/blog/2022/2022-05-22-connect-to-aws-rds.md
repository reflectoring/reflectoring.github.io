---
title: "Using a Jumphost to access an RDS database in a private subnet"
categories: ["aws"]
date: 2022-05-20T05:00:00
modified: 2022-05-20T05:00:00
authors: [pratikdas]
excerpt: "In this article, we will be using a Jumphost to access an RDS database in a private subnet."
image: images/stock/0118-keyboard-1200x628-branded.jpg
url: connect-rds-byjumphost
---

In this tutorial, we will create an RDS database in a private subnet so that it is not publicly accessible. We will then use a mechanism called "SSH Tunelling" for accessing this database securely over the internet.

## Creating the Networking Components: VPC, Subnets

Let us create a VPC with a size /16 IPv4 CIDR block (example: 10.0.0.0/16) from the [AWS management Console](https://us-east-1.console.aws.amazon.com/vpc/home?region=us-east-1#CreateVpc:createMode=vpcOnly).

Next let us add a private subnet with a size /24 IPv4 CIDR block (example: 10.0.1.0/24) to this VPC. We must specify an IPv4 CIDR block for the subnet from the range of our VPC. 



We can specify the Availability Zone in which you want the subnet to reside. 

Let us also add a public subnet with a size /24 IPv4 CIDR block (example: 10.0.1.0/24) to this VPC.

## Creating an RDS Database with Engine Type: MySQL
Let us first create our RDS database using the AWS Managedment Console with `MySQL` as the engine type:

{{% image alt="Create RDS Database" src="images/posts/aws-rds-connect/create-db.png" %}}

For creating the RDS database in a private subnet we have used the following configurations:
{{% image alt="Create RDS Database" src="images/posts/aws-rds-connect/connect.png" %}}

We have used the default VOC available in our AWS account and set the `public access` to `No`.  We have also chosen the option to create a new security group named `db-sg`. 

We will also select `Password authentication` as the Database authentication option.


Our RDS database created in a private subnet is ready to use when the status changes to `available`
{{% image alt="Create RDS Database" src="images/posts/aws-rds-connect/db-created.png" %}}

## Creating a Bastion/Jump Server 
We will next create an EC2 instance from the AWS Management Console in a public subnet in the same VPC where we had created our RDS database in the previous section:


{{% image alt="Create EC2 bastion" src="images/posts/aws-rds-connect/create-ec2.png" %}}


This EC2 instance is also secured with a security group. A security group by default is associated with an outbound rule which has all outbound traffic enabled. Let us leave it like this or we can tighten it further by specifying the RDS instance as destination:



We will use this EC2 instance as a bastion server on which we will set up an SSH tunnel for connecting to the RDS database.




A bastion host is a server whose purpose is to provide access to a private network from an external network, such as the Internet. Because of its exposure to potential attack, a bastion host must minimize the chances of penetration.

## Connecting to the RDS Database
Let us add an inbound rule to the security group `db-sg`  to allow connections from the EC2 instance:

{{% image alt="Create RDS Database" src="images/posts/aws-rds-connect/added-ingress.png" %}}


We will use MySQL workbemch to connect to our RDS database.

{{% image alt="Create RDS Database" src="images/posts/aws-rds-connect/mysql-connnect.png" %}}

## Conclusion 
In this article, we looked at the different capabilities of Axios. Here is a summary of the important points from the article:

1. Axios is an HTTP client for calling REST APIs from JavaScript programs running in the server as well as in web browsers.
2. We create default instance of `axios` by calling `require('axios')`
3. We can override the default instance of `axios` with the `create()` method of `axios` to create a new instance, where we can override the default configuration properties like 'timeout'.
4. Axios allows us to attach request and response interceptors to the `axios` instance where we can perform actions common to multiple APIs.
5. Error conditions are handled in the `catch()` function of the `Promise` response.
6. We can cancel requests by calling the `abort()` method of the `AbortController` class.
7. The Axios library includes TypeScript definitions, so we do not have to install them separately when using Axios in TypeScript applications.

You can refer to all the source code used in the article
on [Github](https://github.com/thombergs/code-examples/tree/master/nodejs/axios).