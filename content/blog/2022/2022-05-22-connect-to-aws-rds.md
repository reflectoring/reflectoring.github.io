---
title: "Using a Jump host to access an RDS database in a private subnet"
categories: ["aws"]
date: 2022-05-20T05:00:00
modified: 2022-05-20T05:00:00
authors: [pratikdas]
excerpt: "Back-end server resources like databases often contain data that is critical for an application to function consistently. So these resources are protected from public access over the internet by placing them in a private subnet. This will however make it inaccessible to the database clients and applications running on our local development workstations. This problem is addressed by using a server called 'jump host' that can receive requests from external sources over the internet and securely forward or 'jump' to the database secured in the private subnet. In this tutorial, we will use a jump host for accessing an RDS database residing in a private subnet."
image: images/stock/0118-keyboard-1200x628-branded.jpg
url: connect-rds-byjumphost
---

Back-end server resources like databases often contain data that is critical for an application to function consistently. So these resources are protected from public access over the internet by placing them in a private subnet. This will however make it inaccessible to the database clients and applications running on our local development workstations. 

This problem is addressed by using a server called "Jump host" that can receive requests from external sources over the internet and securely forward or "jump" to the database secured in the private subnet.

In this tutorial, we will use a jump host for accessing an RDS database residing in a private subnet.

## Creating an RDS Database with Engine Type: MySQL
Let us first create our RDS database using the AWS Management Console with `MySQL` as the engine type:

{{% image alt="Create RDS Database" src="images/posts/aws-rds-connect/create-db.png" %}}

For creating the RDS database in a private subnet we have used the following configurations:
{{% image alt="Create RDS Database" src="images/posts/aws-rds-connect/connect.png" %}}

We have used the default VPC available in our AWS account and set the `public access` to `No`. We have also chosen the option to create a new security group named `db-sg` where we will define the inbound rules to allow traffic from selected sources. 

We will also select `Password authentication` as the Database authentication option.

Our RDS database created in a private subnet is ready to use when the status changes to `available`
{{% image alt="Create RDS Database" src="images/posts/aws-rds-connect/db-created.png" %}}

When the database is ready to be used, we can see the endpoint of the database along with the port which we will use later to connect to the database.

With our database created, we will next set up a jump host and populate inbound rules in the security groups in the following sections.

## Creating an EC2 Instance as the Jump Host 
A jump host is also called a bastion host/server whose sole purpose is to provide access to resources in a private network from an external network like the internet. A rough representation of this architecture is shown below:

{{% image alt="Jump host" src="images/posts/aws-rds-connect/jump-host.png" %}}

Here we are using an EC2 instance in a public subnet as our jump host for connecting to an RDS database in a private subnet.

Let us create the EC2 instance from the AWS Management Console in a public subnet in the same VPC where we had created our RDS database in the previous section.:

{{% image alt="Create EC2 bastion" src="images/posts/aws-rds-connect/create-ec2.png" %}}

We have created our instance in the free tier with an SSH key pair to access the instance with SSH in the later sections. The private key of the SSH key pair is downloaded and saved to our local workstation. 

For creating the instance in the public subnet we have used the network settings as shown below:
{{% image alt="Create EC2 bastion" src="images/posts/aws-rds-connect/ec2-network.png" %}}

We will use this EC2 instance as our jump host on which we will set up an SSH tunnel for connecting to the RDS database in the next section.

## Allow Traffic to the RDS Database from the Jump Host
To enable connectivity to our RDS database, any security groups, network ACL, security rules, or third-party security software that exist on the RDS database must allow traffic from the EC2 instance used as the jump host. 

In our example, the security group of our RDS database must allow access to port `3306` from the EC2 instance. To enable this, let us add an inbound rule to the security group `db-sg` to allow connections from the EC2 instance:

{{% image alt="Create RDS Database" src="images/posts/aws-rds-connect/added-ingress.png" %}}

This EC2 instance is also secured by a security group. A security group by default is associated with an outbound rule which has all outbound traffic enabled. This will allow the EC2 instance to make an outbound connection to the RDS database.

## Connecting to the RDS Database
We will use MySQL workbench which provides a GUI to connect to our RDS MySQL database in two ways:

### Connection Type: Standard TCP/IP

In this method, we create an SSH tunnel from our local machine to access the RDS MySQL database using the EC2 instance as the jump host.

Let us start the SSH tunnel by running the following command:

```shell
ssh -i <SSH key of EC2 instance> ec2-user@<instance-IP of EC2> -L 3306:<RDS DB endpoint>:3306
```
When we run this command, the local port `3306` on our local machine tunnels to port `3306` on the RDS instance. We can then use MySQL workbench to access the RDS MySQL with connection type as `Standard TCP/IP`:

{{% image alt="Connect RDS Database with TCP" src="images/posts/aws-rds-connect/db-conn-local.png" %}}

We can see the successful test connection message with `127.0.0.1` as the hostname and `3306` as the port.

Alternately, we can run the following command in our terminal using the MySQL Command-Line Client: `mysql`:

```shell
mysql -u <DB User> -h 127.0.0.1 -P 3306 -p <DB password>
```
Here also we are connecting to the RDS MySQL database with `127.0.0.1` as the hostname and `3306` as the port.

### Connection Type: Standard TCP/IP over SSH
In this method, we are connecting to the RDS MySQL database using the MySQL workbench using `TCP/IP over SSH` as the connection type:

{{% image alt="Connect RDS Database with TCP" src="images/posts/aws-rds-connect/db-conn-ssh.png" %}}

We can see the successful test connection message with the following parameters :

1. **SSH Hostname**: DNS name or IP of the EC2 instance used as the jump host
2. **SSH Username**: SSH user name (`ec2-user` in our example) to connect to the EC2 instance. 
3. **SSH Key File**: Path to the SSH private key file saved in our local machine when creating the EC2 instance.
4. **MySQL Hostname**: Endpoint of the RDS MySQL database.
5. **MySQL Server Port**: TCP/IP port of the RDS MySQL database.
6. **Username**: The user name of the RDS MySQL database set up during RDS database creation.
7. **Password**: Password of the RDS MySQL database set up during RDS database creation.

## Conclusion 
In this article, we walked through the steps of creating an RDS database in a private subnet and then connecting to the database using a jump host:

1. Create an RDS database in a private subnet.
2. Create an EC2 instance in a public subnet in the same VPC where the RDS database was created. This EC2 instance will act as the bastion or Jump host for connecting to the RDS database. A bastion or jump host is a server whose purpose is to provide access to a private network from an external network like the Internet. 
3. Add an inbound rule to the security group associated with the RDS database to allow incoming traffic from the EC2 instance created in step 2.
4. Optionally add an outbound rule to the security group associated with the EC2 instance to allow outgoing traffic to the RDS database.
5. Use a database client and connect to the endpoint of the RDS database with the database credentials configured during creation time or later using the SSH tunneling method.

