---
title: "Using Terraform to Deploy AWS Resources"
categories: [craft]
date: 2021-04-09 06:00:00 +1000
modified: 2021-04-09 06:00:00 +1000
author: pratikdas
excerpt: "Terraform is a popular infrastructure provisioning tool which is flexible to work with multiple cloud providers. It also uses a very clear and concise HCL syntax to define the resource configurations which makes it very easy to define infrastructure as code. In this post, we will introduce Terraform basics and see how Terraform can be used to provision AWS resources."
image:
  auto: 0074-stack
---
Provisioning infrastructure has always been a time-consuming manual process. Infrastructure has now moved away from physical hardware in data centers to software-defined infrastructure using virtualization technology and cloud computing. All the cloud providers provide services for the creation and modification of infrastructure resources through code like AWS Cloudformation and Azure Resource Manager. Terraform provides a common language for creating infrastructure for multiple cloud providers thereby becoming a key enabler for multi-cloud computing.

In this post, we will look at the capabilities of Terraform with examples of creating resources in AWS Cloud.


{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/terraform" %}

## Infrastructure as Code with Terraform
Infrastructure as Code (IaC) is the managing and provisioning of infrastructure through code instead of through manual processes. From the website of Terraform: "Terraform is an open-source infrastructure as code software tool that provides a consistent CLI workflow to manage hundreds of cloud services."
For defining resources with Terraform, we specify the provider in the configuration file and add configurations for the resources in one or more files. 

Terraform is logically split into two main parts: 
1. Terraform Core 
2. Terraform Plugins

Terraform plugin exposes an implementation for a specific service, such as AWS, or provisioner, such as bash. All Providers and Provisioners used in Terraform configurations are plugins. 

## Terraform Setup

For running our examples, let us download a [binary distribution](!https://www.terraform.io/downloads.html) for our specific operating system for local installation. We will use this to install the Terraform command-line interface(CLI) where we will execute different Terraform commands. We can check for successful installation by running the below command:

```
terraform -v
```
This gives the below output on my Mac OS showing the version of Terraform that is installed:
```shell
Terraform v0.15.0
on darwin_amd64
```

We can view the list of all Terraform commands by running the terraform command without any arguments:

```shell
terraform
...
...
Main commands:
  init          Prepare your working directory for other commands
  validate      Check whether the configuration is valid
  plan          Show changes required by the current configuration
  apply         Create or update infrastructure
  destroy       Destroy previously-created infrastructure

All other commands:
  console       Try Terraform expressions at an interactive command prompt
  fmt        
...
...
```
We will use the main commands `init`, `plan`, and `apply` throughout this post.

Since we will be creating resources in AWS, we will also set up the AWS CLI by running the below command:
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
We are using us-east-1 as the region and JSON as the output format.

## Terraform Concepts with Simple Workflow
Terraform  in two steps:
1. Designing the infrastructure resources in a configuration file and 
2. Using this configuration to create the actual infrastructure

The configuration is defined in [Terraform language](https://www.terraform.io/docs/language/index.html) using a JSON-like syntax called Hashicorp Configuration Language(HCL) that tells Terraform how to manage a collection of infrastructure. A configuration can consist of multiple files and directories.

### Init, Plan, and Apply Cycle
Terraform has the concept of state. Our desired state is what infrastructure resources we wish to create. When we run the `plan`, Terraform pulls the resource information and compares it with the desired infrastructure. It then outputs a report containing the changes which will happen when the configuration is applied(in the `Apply` stage).

The main steps for any basic task with Terraform are:
1. Create a workspace folder
2. Create a configuration file named `main.tf`. This file will have the configuration of the infrastructure to be created or updated.
3. Initialize the workspace using the command `terraform init`.
4. Create the plan
5. Apply the plan

### Defining the Configuration
We write terraform configurations in Terraform language. Let us define our configuration in a file `main.tf`:

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
Here we are creating an aws EC2 instance named "vm-web" of type `t2.micro` using an ami `ami-830c94e3`. We also define two tags with names - `Name` and `Env`.
We can also see the three main parts of configuration :

1. Resource: We define our infrastructure in terms of resources. Each resource block in the configuration file describes one or more infrastructure objects. EC2 instance, an S3 bucket, lambda function, or their equivalents from other Cloud platforms are examples of different resource types. 


2. Provider: Terraform uses `providers` to connect to remote systems. Each resource type is implemented by a provider. Most providers configure a specific infrastructure platform (either cloud or self-hosted). Providers can also offer local utilities for tasks like generating random numbers for generating unique resource names.


3. Terraform Settings: We configure some behaviors of Terraform like the minimum Terraform version in the terraform block. Here we also specify all of the providers each with a source address and a version constraint required by the current module in the required_providers block.

### Initializing the Working Directory
We run terraform commands from a working directory that contains one or more configuration files. Terraform reads configuration content from this directory, and also uses this directory to store settings, caching plugins and modules, and sometimes state data.

This working directory must be initialized before Terraform can perform any operations in it (like provisioning infrastructure or modifying state).

Let us now create a working directory and save under it the configuration file that we created in the previous step. We will now initialize our working directory by running the [init](https://www.terraform.io/docs/cli/init/index.html) command:

```shell
terraform init
```

After running this command, we get this output:
```shell
Initializing the backend...

Initializing provider plugins...
- Checking for available provider plugins...
- Downloading plugin for provider "aws" (hashicorp/aws) 3.36.0...

Terraform has been successfully initialized!
...
```
From the output, we can see initialization messages for the `backend` and `provider plugins`. 

The backend is used to store state information. Here we are using the default local backend, which requires no configuration. In real-life situations, a remote backend should be used where state information can be persisted. This works only in cloud and enterprise variants where multiple individuals work with common infrastructure.

The first run of this command will download the plugins required for the configured provider.

Our working directory contents after running the terraform `init` command looks like this:

```shell

├── .terraform
│   └── plugins
│       └── darwin_amd64
│           ├── lock.json
│           └── terraform-provider-aws_v3.36.0_x5
└── main.tf
```
The plugin for the configured provider AWS is downloaded and stored as `terraform-provider-aws_v3.36.0_x5`. 

### Creating the Plan
An execution plan is generated by running the terraform [plan](https://www.terraform.io/docs/cli/commands/plan.html) command. Terraform first performs a refresh, unless explicitly disabled, and then determines what actions are necessary to achieve the desired state specified in the configuration files.

This command is a convenient way to check whether the execution plan for a set of changes matches your expectations without making any changes to real resources or to the state. For example, terraform plan might be run before committing a change to version control, to create confidence that it will behave as expected.

The optional -out argument can be used to save the generated plan to a file for later execution with terraform apply, which can be useful when running Terraform in automation.

If Terraform detects no changes to resource or root module output values, terraform plan will indicate that no changes are required.

Let us run terraform plan to generate an execution plan:

```
terraform plan -out aws-ec2-plan
```
Running the command gives the following output:
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
From the output we can see that one resource will be added, zero changed and zero destroyed. The plan is saved in the file specified in the output.


### Applying the Plan
We use the terraform [apply](https://www.terraform.io/docs/cli/commands/apply.html) command to apply our changes and create or modify the changes. By default, apply scans the current directory for the configuration and applies the changes appropriately. However, we can optionally give the path to a saved plan file that was previously created by running `terraform plan`.

If we do not give a plan file on the command line, running `terraform apply`  creates a new plan automatically and then prompts for approval to apply it. If the created plan does not include any changes to resources or root module output values then running `terraform apply` exits immediately, without prompting.


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
Instead of putting the values in the configuration file, we can use variables and receive their values when applying the configuration. Let us modify the configuration file created in the earlier with variables for instance type:


```
resource "aws_instance" "vm-web" {
  ami           = "ami-830c94e3"
  instance_type = var.ec2_instance_type

  tags = {
    Name = "server for web"
    Env = "dev"
  }

```
The configuration now has a variable by the name `ec2_instance_type`. When we run the plan, it prompts for the value of the variable:
```shell
Pratiks-MacBook-Pro:aws-app-stack-input-vars pratikdas$ terraform plan
var.ec2_instance_type
  AWS EC2 instance type.

  Enter a value: t2.micro
```
The variable values can also be supplied in a separate file with extension `tfvars`.

### Organizing and Reusing Configurations with Modules
In our previous example, we represented our architecture by directly creating an EC2 instance. In real-life situations, our application stack will have many more resources with dependencies between them. We might also like to reuse certain constructs for the consistency and compactness of our configuration code. Functions fulfill this need In programming languages. Terraform has a similar concept called modules. Similar to functions, a module has an input, output, and a body. 


Modules are the main way to package and reuse resource configurations with Terraform. It is most often a grouping of one or more resources that are used to represent a logical component in the architecture. For example, we might create our infrastructure with two logical constructs(modules) a module for the application composed of EC2 instances and ELB and another module for storage composed of S3 and RDS.

Every Terraform configuration has at least one module called the root module that has the resources defined in the .tf files in the main working directory. A module can call other modules.

Let us create two modules for our application stack, one for creating an EC2 instance and another for creating an S3 bucket. Our directory structure looks like this:

```shell
├── main.tf
├── modules
│   ├── application
│   │   ├── main.tf
│   │   ├── outputs.tf
│   │   └── variables.tf
│   └── storage
│       ├── main.tf
│       ├── outputs.tf
│       └── variables.tf

```
Here we have defined two child modules named `application` and `storage` under the `modules` folder which will be invoked from the root module.
Each of these modules has a configuration file `main.tf` (it can also be any other name) and input variables in `variables.tf` and output variables in `outputs.tf`.

```hcl
resource "aws_instance" "vm-web" {
  ami           = var.ami
  instance_type = var.ec2_instance_type
  tags = var.tags
}

```
Here we define the resource with variables declared in `variables.tf`:
```
variable "ec2_instance_type" {
  description = "Instance type"
  type        = string
}

variable "ami" {
  description = "ami id"
  type = string
}

variable "tags" {
  description = "Tags to set on the bucket."
  type        = map(string)
  default     = {Name = "server for web"
                 Env = "dev"}
}
```
We are declaring three variables: `ec2_instance_type` and `ami` are of type string and the variable `tags` is of type `map` with a default value.
Our main configuration now invokes these modules instead of the directly declaring the resources:

```shell
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

module "app_server" {
  source = "./modules/application"

  ec2_instance_type    = "t2.micro"
  ami = "ami-830c94e3"
  tags = {
    Name = "server for web"
    Env = "dev"
  }
}

module "app_storage" {
  source = "./modules/storage"

  bucket_name     = "io.pratik.tf-example-bucket"
  env = "dev"
}

```
During invocation of the child modules, we are using the `module` construct with a `source` argument containing the path of the child modules `application` and `storage`. Here we are using the local directory to store our modules. Other than the local path, we can also use different [source types](https://www.terraform.io/docs/language/modules/sources.html) like a `terraform registry`, `github`, `s3`, etc to reuse modules published by other individuals or teams. When using remote sources, terraform will download these modules when we run `terrafom init` and store them in the local directory.

### Terraform Cloud and Terraform Enterprise

We ran Terraform using Terraform CLI which performed operations on the workstation where it is invoked and stored state in a local working directory. This is called the local workflow. However, we will need a remote workflow when using Terraform in a team which will require the state to be shared and Terraform to run in a remote environment.

Terraform has two more variants Terraform Cloud and Terraform Enterprise for using Terraform in a team environment. Terraform Cloud is a hosted service at https://app.terraform.io where Terraform runs on disposable virtual machines in its cloud infrastructure. Terraform Enterprise is available for hosting in a private data center which will be an option preferred by large enterprises. 

Let us run remote plans in the terraform Cloud from our local command line, also called the CLI workflow. First, we need to log in to https://app.terraform.io/session after creating an account with our email address. Similar to our working directory in the CLI, we will create a `workspace`. We will modify our configuration to add a backend block to configure our remote backend and the `terraform plan` command will start a remote run in the configured Terraform Cloud workspace. 

```hcl
terraform {
 
  backend "remote" {
    hostname = "app.terraform.io"
    organization = "pratikorg"
    token = "pj7p5*************************************************czt62p1bs"
    workspaces {
      name = "my-tf-workspace"
    }
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.36"
    }
  }
}

```
Running `terraform plan` will output the following log:

```shell
Running plan in the remote backend. Output will stream here. Pressing Ctrl-C
will stop streaming the logs, but will not stop the plan running remotely.

Preparing the remote plan...

To view this run in a browser, visit:
https://app.terraform.io/app/pratikorg/my-tf-workspace/runs/run-Q2PMW9pCRtqXiKqh

Waiting for the plan to start...

Terraform v0.15.0
on linux_amd64
Configuring remote state backend...
Initializing Terraform configuration...

```


Terraform Cloud is available as a hosted service at https://app.terraform.io. It is an application to use Terraform in a team environment with the help of the below components:
1. Shared instance of Terraform running in a consistent and reliable environment, 
2. Shared state and secret data, 
3. Access controls for approving changes to infrastructure, 
4. Private registry for sharing Terraform modules, 
5. detailed policy controls for governing the contents of Terraform configurations.


Large enterprises can purchase Terraform Enterprise, our self-hosted distribution of Terraform Cloud. It offers enterprises a private instance of the Terraform Cloud application, with no resource limits and with additional enterprise-grade architectural features like audit logging and SAML single sign-on.

### Providers
https://registry.terraform.io/providers/hashicorp/aws/latest


### Terraform Configuration with 

Apart from the CLI workflow, Terraform Cloud/Enterprise has two more types of workflows targetted for continuous integration. Here the Terraform workspace is connected to a repository of a supported [version control systems](https://www.terraform.io/docs/cloud/vcs/index.html#supported-vcs-providers) which provides Terraform configurations for that workspace. Terraform Cloud monitors new commits and pull requests to the repository using webhooks. After any commit to a branch, a Terraform Cloud workspace based on that branch will run Terraform.  

We can find elaborate documentation for configuring Terraform for specific VCS providers by following their respective [links](https://www.terraform.io/docs/cloud/vcs/index.html#configuring-vcs-access). 


## Conclusion

In this post, we looked at the capabilities of Terraform as IaC platform that supports the creation and provisioning of many types of resources across an array of cloud providers like aws, azure, and gcp. We started with the basic init, plan and apply cycle for creating and modifying infrastructure resources. Then we used modules as a better way of organizing our IaC code into logical constructs in layers similar to what we do with application programming. We finally introduced two more variants : Terraform Cloud and Terraform Enterprise. 

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