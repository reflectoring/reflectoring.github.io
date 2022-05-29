---
title: "Using a Jumphost to access an RDS database in a private subnet"
categories: ["aws"]
date: 2022-05-20T05:00:00
modified: 2022-05-20T05:00:00
authors: [pratikdas]
excerpt: "In this article, we will be using a Jump host to access an RDS database in a private subnet."
image: images/stock/0118-keyboard-1200x628-branded.jpg
url: connect-rds-byjumphost
---

Back-end server resources like databases often contain data which is critical for an application to function in a consistent manner. So these resources are protected from public access over the internet by placing them in a private subnet. This will however make it inaccessible to the database clients and applications running on our local development workstations. 

This problem is mitigated by using a server called "Jump host" that can receive requests from external sources over the internet and securely forward("jump") to the database secured in the private subnet.

In this tutorial, we will use a Jump host for accessing an RDS database residing in a private subnet.

## Creating an RDS Database with Engine Type: MySQL
Let us first create our RDS database using the AWS Managedment Console with `MySQL` as the engine type:

{{% image alt="Create RDS Database" src="images/posts/aws-rds-connect/create-db.png" %}}

For creating the RDS database in a private subnet we have used the following configurations:
{{% image alt="Create RDS Database" src="images/posts/aws-rds-connect/connect.png" %}}

We have used the default VPC available in our AWS account and set the `public access` to `No`.  We have also chosen the option to create a new security group named `db-sg` where we will define the inbound rules to allow traffic from selected sources. 

We will also select `Password authentication` as the Database authentication option.

Our RDS database created in a private subnet is ready to use when the status changes to `available`
{{% image alt="Create RDS Database" src="images/posts/aws-rds-connect/db-created.png" %}}

With our database created, we will next set up a jump host and populate inbound rules in the security groups in the following sections.

## Creating a Jump Host 
We will use an EC2 instance as our jump host for connecting to the RDS database created in the previous section.
Let us create the EC2 instance from the AWS Management Console in a public subnet in the same VPC where we had created our RDS database:


{{% image alt="Create EC2 bastion" src="images/posts/aws-rds-connect/create-ec2.png" %}}

We have created our instance in the free tier with a ssh key pair to access the instance with SSH.

For creating the instance in public subnet we have used the network settings as shown below:
{{% image alt="Create EC2 bastion" src="images/posts/aws-rds-connect/ec2-network.png" %}}

This EC2 instance is also secured with a security group. A security group by default is associated with an outbound rule which has all outbound traffic enabled.



We will use this EC2 instance as a bastion server on which we will set up an SSH tunnel for connecting to the RDS database.




A bastion or Jump host is a server whose purpose is to provide access to a private network from an external network like Internet. 

## Connecting to the RDS Database
Let us add an inbound rule to the security group `db-sg`  to allow connections from the EC2 instance:

{{% image alt="Create RDS Database" src="images/posts/aws-rds-connect/added-ingress.png" %}}


We will use MySQL workbemch to connect to our RDS database.

{{% image alt="Create RDS Database" src="images/posts/aws-rds-connect/mysql-connnect.png" %}}

## Conclusion 
In this article, we walked through the steps of creating an RDS database in a private subnet and then connecting to the database using a Jump server:

1. Create an RDS database in a private subnet.
2. Create an EC2 instance in a public subnet in the same VPC where the RDS database was created. This EC2 instance will act as the bastion or Jump host for connecting to the RDS database. A bastion or jump host is a server whose purpose is to provide access to a private network from an external network like Internet. 
3. Add an inbound rule to the security group associated with the RDS database to allow incoming traffic from the EC2 instance created in step 2.
4. Optionally add an outbound rule to the security group associated with the EC2 instance to allow outgoing traffic to the RDS database.
5. Use a database client and connect to the endpoint of the RDS database with the database credentials configured during creation time or later using SSH tunneling method.

