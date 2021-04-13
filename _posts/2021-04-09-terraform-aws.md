---
title: "Using Terraform to Deploy AWS Resources"
categories: [craft]
date: 2021-04-09 06:00:00 +1000
modified: 2021-04-09 06:00:00 +1000
author: pratikdas
excerpt: "We will see how Terraform can be used to provision AWS resources."
image:
  auto: 0074-stack
---
Provisioning infrastructure has always been a time-consuming manual process. Infrastructure has now moved away from physical hardware in data centers to software-defined infrastructure using virtualization technology and cloud computing. All the cloud providers allow the creation of infrastructure resources through code like AWS Cloudformation and Azure Resource Manager. Terraform provides a common language for creating infrastructure for multiple cloud providers thereby becoming a key enabler for multi-cloud computing.

In this post, we will look at the capabilities of Terraform with examples of creating resources in AWS Cloud.


{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/terraform" %}

## Infrastructure as Code with Terraform
Infrastructure as Code (IaC) is the managing and provisioning of infrastructure through code instead of through manual processes. Terraform is an open-source infrastructure as code software tool from Hashicorp that provides a consistent CLI workflow to manage hundreds of cloud services. Terraform codifies cloud APIs into declarative configuration files. We specify the provider in the configuration file and add configurations for the resources we want to create for that provider. 

## Terraform Setup
Terraform distributions come in three variants:
1. Terraform CLI: For local development
2. Terraform Cloud: Using Terraform in a SAS environment
3. Terraform Enterprise

For local installation, we can download a [binary distribution](!https://www.terraform.io/downloads.html) for our specific operating system. After installation, we can check by running the below command:

```
terraform -v
```

Since we will be creating resources in AWS, first we will run set up the AWS CLI by running the below command:
```shell
aws configure
```

When prompted, we will provide AWS access key id and secret access key and choose a default region and output format:

```shell
AWS Access Key ID [****************2345]: ....
AWS Secret Access Key [****************2345]: ...
Default region name [us-east-1]: 
Default output format [json]: 
```
We are using us-east-1 as the region and json as the format.

## Terraform Concepts with Simple Workflow
Terraform  in two steps:
1. Designing the infrastructure resources in a configuration file and 
2. Using this configuration to create the actual infrastructure

The configuration is defined in a JSON like language called Hashicorp Configuration Language(HCL). A Terraform configuration is a complete document in the Terraform language that tells Terraform how to manage a given collection of infrastructure. A configuration can consist of multiple files and directories.

### Init, Plan, and Apply Cycle
Terraform has the concept of state. Our desired state is what infrastructure resources we wish to create. When we run the `plan`, Terraform pulls the resource information and compares with the desired infrastructure. It then outputs a report containing the changes which will happen when the configuration is applied(in the `Apply` stage).

The comparison happens against a persisted state usually a file with extension `.tfstate`. The state can also be stored remotely and subjected to version control which is useful in a team environment.



The main steps for any basic task with Terraform are:
1. Create a workspace folder
2. Create a configuration file named `main.tf`. This file will have the configuration of the infrastructure to be created or updated.
3. Initialize the workspace using command `terraform init`.
4. Create the plan
5. Apply the plan

### Defining the Configuration
We first define a workspace folder named `aws-ec2`. We next define the configuration file `main.tf` and save it in the workspace folder:

```
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.27"
    }
  }
}

provider "aws" {
  profile = "default"
  region  = "us-west-2"
}

resource "aws_instance" "vm-web" {
  ami           = "ami-830c94e3"
  instance_type = "t2.micro"

  tags = {
    Name = "server for web"
    Env = "dev"
  }
}
```
Here we are creating a aws EC2 instance named "vm-web" of type `t2.micro` using an ami `ami-830c94e3`. We also define two tags with names - `Name` and `Env`.
We can also see the three main parts of configuration :
1. Provider
2. Resource: We define our infrastructure in terms of resources. Example of a resource could be an EC2 instance, a S3 bucket, lambda function or their equivalents from other providers. We represent these resources in the form of a configuration in a text file in HCL syntax. 

3. Terraform block

### Initializing the Workspace
We will now initialize the workspace folder by running the command:

```shell
terraform init
```

We get this output:
```shell
Initializing the backend...

Initializing provider plugins...
- Checking for available provider plugins...
- Downloading plugin for provider "aws" (hashicorp/aws) 3.36.0...

Terraform has been successfully initialized!
...
```
The first run of this command will download the plugins required for the configured provided - aws in this case.



### Creating the Plan
The terraform plan command is used to create an execution plan. Terraform performs a refresh, unless explicitly disabled, and then determines what actions are necessary to achieve the desired state specified in the configuration files.

This command is a convenient way to check whether the execution plan for a set of changes matches your expectations without making any changes to real resources or to the state. For example, terraform plan might be run before committing a change to version control, to create confidence that it will behave as expected.

The optional -out argument can be used to save the generated plan to a file for later execution with terraform apply, which can be useful when running Terraform in automation.

If Terraform detects no changes to resource or to root module output values, terraform plan will indicate that no changes are required.

```
terraform plan -out aws-ec2-plan
```

```shell
Refreshing Terraform state in-memory prior to plan...
The refreshed state will be used to calculate this plan, but will not be
persisted to local or remote state storage.


------------------------------------------------------------------------

An execution plan has been generated and is shown below.
Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # aws_instance.vm-web will be created
  + resource "aws_instance" "vm-web" {
      + ami                          = "ami-830c94e3"
      + arn                          = (known after apply)

...
...

Plan: 1 to add, 0 to change, 0 to destroy.

------------------------------------------------------------------------

This plan was saved to: aws-ec2-plan

To perform exactly these actions, run the following command to apply:
    terraform apply "aws-ec2-plan"

```



### Applying the Plan

```shell
terraform apply "aws-app-stack-plan"
```

```shell
aws_instance.vm-web: Creating...
aws_instance.vm-web: Still creating... [10s elapsed]
aws_instance.vm-web: Still creating... [20s elapsed]
aws_instance.vm-web: Still creating... [30s elapsed]
aws_instance.vm-web: Creation complete after 35s [id=i-0f07186f0c1481df4]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

The state of your infrastructure has been saved to the path
below. This state is required to modify and destroy your
infrastructure, so keep it safe. To inspect the complete state
use the `terraform show` command.

State path: terraform.tfstate


```

### Destroy

```shell
terraform destroy
```

```shell
Plan: 0 to add, 0 to change, 1 to destroy.

Do you really want to destroy all resources?
  Terraform will destroy all your managed infrastructure, as shown above.
  There is no undo. Only 'yes' will be accepted to confirm.

  Enter a value: yes

aws_instance.vm-web: Destroying... [id=i-0f07186f0c1481df4]
...
aws_instance.vm-web: Destruction complete after 48s

Destroy complete! Resources: 1 destroyed.
```

### Parameterizing the Configuration with Input Variables

```shell
Pratiks-MacBook-Pro:aws-app-stack-input-vars pratikdas$ terraform plan
var.ec2_instance_type
  AWS EC2 instance type.

  Enter a value: t2.micro
```

```
resource "aws_instance" "vm-web" {
  ami           = "ami-830c94e3"
  instance_type = var.ec2_instance_type

  tags = {
    Name = "server for web"
    Env = "dev"
  }

```

### Organizing and Reusing Configurations with Modules
In our previous example, we represented our architecture by directly creating an EC2 instance. In real-life situations, our application stack will have many more resources with dependencies between them. We might also like to reuse certain constructs for consistency and compactness of our configuration code. Functions fulfill this need In programming languages. HCL has a similar concept called modules. Similar to functions, a module has an input, output and a body. 

It is most often a grouping of one or more resources that are used to represent a logical component in the architecture. For example, we might create our infrastructure with two logical constructs(modules) a module for the application composed of EC2 instances and ELB and another module for storage composed of S3 and RDS.


Every Terraform configuration has at least one module called root module that has the resources defined in the .tf files in the main working directory. A module can call other modules.

Modules are the main way to package and reuse resource configurations with Terraform. 

Let us create two modules for our application stack , one for creating EC2 instance and another for creating a S3 bucket. 


The root module is the directory that holds the Terraform configuration files that are applied to build our desired infrastructure.
We will first install Terraform following the installation steps for our applicable operating systems. Let us create or provision a EC2 instance with Terraform. For 
Some of the basic steps for provisioning infrastructure are:
1. Determine what resources we want to create

### Terraform Cloud and Terraform Enterprise

Terraform Cloud is available as a hosted service at https://app.terraform.io. It is an application to use Terraform in a team environment with the help of below components:
1. Shared instance of Terraform running in a consistent and reliable environment, 
2. Shared state and secret data, 
3. Access controls for approving changes to infrastructure, 
4. Private registry for sharing Terraform modules, 
5. detailed policy controls for governing the contents of Terraform configurations.


Large enterprises can purchase Terraform Enterprise, our self-hosted distribution of Terraform Cloud. It offers enterprises a private instance of the Terraform Cloud application, with no resource limits and with additional enterprise-grade architectural features like audit logging and SAML single sign-on.


### CI CD

When we design software, most of the time we think about CI/CD approach to improve overall software development cycle and speed up deployments. We can add Terraform to our CI/CD pipelines. 



## Conclusion

In this post we looked at the capabilities of Terraform as IaC platform that supports the creation and provisioning of many types of resources across an array of cloud providers like aws, azure, and gcp. We started with the basic init, plan and apply cycle for creating and modifying infrastructure resources. Then we used modules as a better way of organizing our IaC code into logical constructs in layers similar to what we do with application programming. We finally introduced two more variants : Terraform Cloud and Terraform Enterprise. 

Some of the popular choices in the IaC domain are :

Chef
Puppet
Red Hat Ansible Automation Platform
Saltstack
Terraform 
AWS CloudFormation

However, Terraform stands out for supporting multicloud solutions, defining concise configuration language and modular support to help build complex infrastructures.
, we can It can also compose highly complex, multiplatform and multicloud solutions.
With IaC, configuration files are created that contain our infrastructure specifications, which makes it easier to edit and distribute configurations. It also ensures that you provision the same environment every time.

By codifying and documenting your configuration specifications, IaC aids configuration management and helps you to avoid undocumented, ad-hoc configuration changes.

Version control is an important part of IaC, and your configuration files should be under source control just like any other software source code file. 

Deploying your infrastructure as code also means that you can divide your infrastructure into modular components that can then be combined in different ways through automation.


You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/terraform).