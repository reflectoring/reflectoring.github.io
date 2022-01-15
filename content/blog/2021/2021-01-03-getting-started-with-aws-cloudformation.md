---
title: "Getting Started with AWS CloudFormation"
categories: ["AWS"]
date: 2021-01-03T00:00:00
modified: 2021-01-03T00:00:00
authors: [tom]
excerpt: "Let's deploy our first application to AWS with CloudFormation. No previous CloudFormation knowledge required!"
image: images/stock/0061-cloud-1200x628-branded.jpg
url: getting-started-with-aws-cloudformation
widgets: ["gyhdoca-ad", "stratospheric-ad"]
---

Continuous deployment is an important part in today's software development loop. We want to ship the latest version of our software in no time to provide our users with the newest features or bugfixes. This is a major pillar of the DevOps movement.

**This means deployments have to be automated**. 

AWS CloudFormation is Amazon's solution to deploying software and infrastructure into the cloud. In this article, we'll deploy a Docker image to the AWS cloud with CloudFormation. We'll start at zero so no previous AWS knowledge is required.

At the end of this article you will

* know what CloudFormation is and can do,
* know the basic vocabulary to talk about AWS cloud infrastructure, and
* have all the tools necessary to deploy a Docker image with a couple of CLI commands.

## Check out the Book!

<a href="https://stratospheric.dev"><img src="/assets/img/stratospheric/stratospheric-cover.jpg" alt="Stratospheric - From Zero to Production with Spring Boot and AWS" style="float:left; clear:both; padding-right: 15px; margin-bottom: 30px;"/></a>
This article is a self-sufficient sample chapter from the book ["Stratospheric - From Zero to Production with Spring Boot and AWS"](https://stratospheric.dev), which I'm co-authoring. 

If you're interested in learning about building applications with Spring Boot and AWS from top to bottom, make sure to check it out!

## Getting Ready

If you've never deployed an app to the cloud before, you're in for a treat. We're going to deploy a "Hello World" version of a Todo app to AWS with only a couple of CLI commands (it requires some preparation to get these CLI commands working, though).

We're going to use Docker to make our app runnable in a container, AWS CloudFormation to describe the infrastructure components we need, and the AWS CLI to deploy that infrastructure and our app.

The goal of this chapter is not to become an expert in all things AWS, but instead to learn a bit about the AWS CLI and CloudFormation to have a solid foundation to build more AWS knowledge.

We'll start at zero and set up our AWS account first.

### Setting up an AWS Account

To do anything with AWS, you need an account with them. If you don't have an account yet, go ahead and [create one now](https://portal.aws.amazon.com/billing/signup#/start).

If you already have an account running serious applications, you might want to create an extra account just to make sure you're not messing around with your serious business while playing around with this article.

### Installing the AWS CLI

To do magic with AWS from our command line, we need to install the AWS CLI.

The AWS CLI is a beast of a command-line interface that provides commands for many and many different AWS services (224 at the time of this writing). In this chapter, we're going to use it to deploy the application and then to get some information about the deployed application.

Installing the AWS CLI differs across operating systems, so please follow the [official instructions](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) for your operating system to install version 2 of the AWS CLI on your machine.

Once it's installed, run `aws configure`. You will be asked to provide 4 parameters:

```text
~ aws configure
AWS Access Key ID [****************OGBE]: 
AWS Secret Access Key [****************CmqH]: 
Default region name [ap-southeast-2]: 
Default output format [yaml]:
``` 

You can get the "AWS Access Key ID" and "AWS Secret Access Key" after you have [logged into to your AWS account](https://aws.amazon.com/console/) when you click on your account name and then "My Security Credentials". There, you open the tab "Access keys" and click on "Create New Access Key". Copy the values into the prompt of the AWS CLI.

The AWS CLI is now authorized to make calls to the AWS APIs in your name.

Next, the `aws configure` command will ask you for a "Default region name".

The AWS services are distributed across "regions" and "availability zones". Each geographical region is fairly isolated from the other regions for reasons of data residency and low latency. Each region has 2 or more availability zones to make the services resilient against outages.

Each time we interact with an AWS service, it will be with the service's instance in a specific region. So, choose the region nearest to your location from [the list of service endpoints provided by AWS](https://docs.aws.amazon.com/general/latest/gr/rande.html) and enter the region code into the `aws configure` prompt (for example "us-east-1").

Finally, the `aws configure` command will prompt you for the "Default output format". This setting defines the way the AWS CLI will format any output it presents to you.

You can choose between two evils: "json" and "yaml". I'm not going to judge you on your choice.

We're done configuring the AWS CLI now. Run the following command to test it:

```
 aws ec2 describe-regions
```

This command lists all the AWS regions in which we can make use of EC2 instances (i.e. "Elastic Cloud Compute" machines that we can use to deploy our own applications into). If you get a list of regions, you're good to go.

## Inspecting the "Hello World" App

Let's take a quick peek at the Todo app we're going to deploy to AWS.

You'll find the source code for the app in the folder `chapters/chapter-1/application` of the [GitHub repository](https://github.com/stratospheric-dev/stratospheric/tree/main/chapters/chapter-1/application). Feel free to clone it or to inspect it on GitHub.

At this point, the app is no more than a stateless "Hello World" Spring Boot app.

It has a single controller `IndexController` that shows nothing more than the message "Welcome to the Todo Application!". Feel free to start the application via this command:

```text
./gradlew bootrun
``` 

Then, navigate to [http://localhost:8080](http://localhost:8080) to see the message.

To deploy the app to AWS, we need to publish it as a Docker image next.

## Publishing the "Hello World" App to Docker Hub

If you know how to package a Spring Boot app in a Docker image, you can safely skip this section. We have published the app on Docker Hub already, so you can use that Docker image in the upcoming steps.

If you're interested in the steps to create and publish a basic Docker image, stay tuned.

First, we need a `Dockerfile`. The repository already contains a `Dockerfile` with this content:

```text
FROM openjdk:11.0.9.1-jre

ARG JAR_FILE=build/libs/*.jar
COPY ${JAR_FILE} app.jar

ENTRYPOINT ["java", "-jar", "/app.jar"]
```

This file instructs Docker to create an image based on a basic `openjdk` image, which bundles OpenJDK 11 with a Linux distribution. Starting with version 2.3.0, Spring Boot supports more sophisticated ways of creating Docker images, including cloud-native Buildpacks. We're not going to dive into that, but if you're interested, [this blog post](https://spring.io/blog/2020/01/27/creating-docker-images-with-spring-boot-2-3-0-m1) gives an introduction to what you can do.

We create the argument `JAR_FILE` and tell Docker to copy the file specified by that argument into the file `app.jar` within the container.

Then, Docker will start the app by calling `java -jar /app.jar`.

Before we can build a Docker image, we need to build the app with

```text
./gradlew build
```

This will create the file `/build/libs/todo-application-0.0.1-SNAPSHOT.jar`, which will be caught by the `JAR_FILE` argument in the Docker file.

To create a Docker image we can now call this command:

```text
docker build -t stratospheric/todo-app-v1:latest .
```

Docker will now build an image in the namespamce `stratospheric` and the name `todo-app-v1` and tag it with the tag `latest`. **If you do this yourself, make sure to use your Docker Hub username as the namespace because you won't be able to publish a Docker image into the `stratospheric` namespace**.

A call to `docker image ls` should list the Docker image now:

```text
~ docker image ls
REPOSITORY                  TAG      IMAGE ID       CREATED     SIZE
stratospheric/todo-app-v1   latest   5d3ef7cda994   3 days ago  647MB
```

To deploy this Docker image to AWS, we need to make it available to AWS somehow. One way to do that is to publish it to Docker Hub, which is the official registry for Docker images (in the [book](https://stratospheric.dev), we'll also learn how use Amazon's ECR service to deploy Docker images). To do this, we call `docker login` and `docker push`:

```text
docker login
docker push stratospheric/todo-app-v1:latest
``` 

The login command will ask for your credentials, so you need to have an account at hub.docker.com. The push command will upload the image to the Docker Hub, so that anyone can pull it from there with this command:

```text
docker pull stratospheric/todo-app-v1:latest
``` 

Great! the app is packaged in a Docker image and the image is published. Time to talk about deploying it to AWS.

## Getting Started with AWS Resources

As mentioned above, we'll be using AWS CloudFormation to deploy some infrastructure and finally our Docker image to the cloud.

**In a nutshell, CloudFormation takes a YAML or JSON file as input and provisions all the resources listed in that file to the cloud**. This way, we can spin up a whole network with load balancers, application clusters, queues, databases, and whatever else we might need.

Pretty much every AWS service provides some resources we can provision with CloudFormation. Almost everything that you can do via the AWS web interface (called the AWS Console), you can also do with CloudFormation. The docs provide a [list of the CloudFormation resources](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html).

The advantage of this is clear: with CloudFormation, we can automate what we would otherwise have to do manually.

Let's have a look at what we're going to deploy in this article:

![We're deploying an ECS cluster within a public subnet in a virtual private cloud.](/assets/img/stratospheric/aws-infrastructure.png)

For deploying our Todo app, we're starting with just a few resources so we don't get overwhelmed. We're deploying the following resources:

A **Virtual Private Cloud (VPC)** is the basis for many other resources we deploy. It spins up a virtual network that is accessible only to us and our resources.

A VPC contains **public and private subnets**. A public subnet is reachable from the internet, a private subnet is not. In our case, we deploy a single public subnet only. For production deployments, we'd usually deploy at least two subnets, each in a different availability zone (AZ) for higher availability.

To make a subnet public, we need an **internet gateway**. An internet gateway allows outbound traffic from the resources in a public subnet to the internet and it does network address translation (NAT) to route inbound traffic from the internet to the resources in a public subnet.

A subnet that is not attached to an internet gateway makes it a private subnet.

Into our public subnet, we deploy an ECS cluster. ECS (Elastic Container Service) is an AWS service that automates much of the work to deploy Docker images.

Within an ECS cluster we can define one or more different services that we want to run. For each service, we can define a so-called task. A task is backed with a Docker image. We can decide how many instances of each task we want to run and ECS takes care of keeping that many instances alive at all times.

If the healthcheck of one of our application instances (i.e. task instances) fails, ECS will automatically kill that instance and restart a new one. If we want to deploy a new version of the Docker image, we give ECS the URL to the new Docker image and it will automatically do a rolling deployment, keeping at least one instance alive at all times until all old instances have been replaced with new ones.

Let's get our hands dirty and have a look at the files that describe this infrastructure!

## Inspecting the CloudFormation Templates

You can find the CloudFormation templates in the [cloudformation folder](https://github.com/stratospheric-dev/stratospheric/tree/main/chapters/chapter-1/cloudformation)on GitHub.

In that folder, we have two YAML files - `network.yml` and `service.yml` - as well as two shell scripts - `create.sh` and `delete.sh`.

The YAML files are the CloudFormation templates that describe the resources we want to deploy. The shell scripts wrap some calls to the AWS CLI to create (i.e. deploy) and delete (i.e. destroy) the resources described in those files. `network.yml` describes the basic network infrastructure we need, and `service.yml` describes the application we want to run in that network.

Before we look at the CloudFormation files, we need to discuss the concept of "stacks".

**A stack is CloudFormation's unit of work.** We cannot create single resources with CloudFormation, unless they are wrapped in a stack.

A YAML file (or JSON file, if you enjoy chasing closing brackets more than chasing indentation problems) always describes the resources of a stack. Using the AWS CLI, we can interact with this stack by creating it, deleting it, or modifying it.

CloudFormation will automatically resolve dependencies between the resources defined in a stack. If we define a subnet and a VPC, for example, CloudFormation will create the VPC before the subnet, because a subnet always refers to a specific VPC. When deleting a stack, it will automatically delete the subnet before deleting the VPC.

### The Network Stack

With the CloudFormation basics in mind, let's have a look at the first couple of lines of the network stack defined in `network.yml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: A basic network stack that creates a VPC with a single public subnet 
             and some ECS resources that we need to start a Docker container 
             within this subnet.
Resources:
  ...
```

A stack file always refers to a version of the CloudFormation template syntax. The last version is from 2010. I couldn't believe that at first, but the syntax is rather simple, as we'll see shortly, so I guess it makes sense that it's stable.

Next is a description of the stack and then a big section with the key `Resources` that describes the resources we want to deploy in this stack.

In the network stack, we want to deploy the basic resources we need to deploy our Todo application onto. That means we want to deploy a VPC with a public subnet, an internet gateway to make that subnet accessible from the internet, and an ECS cluster that we can later put our Docker image into.

The first resource we define within the `Resources` block is the VPC:

```yaml
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
```

The key `VPC` we can choose as we see fit. We can reference the resource by this name later in the template.

A resource always has a `Type`. There are a [host of different resource types](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) available, since almost every AWS service allows us to create resources via CloudFormation. In our case, we want to deploy a VPC - a virtual private cloud in which we put all the other resources.

Next, a resource may require some `Properties` to work. Most resources do require properties. To find out which properties are available, have a look at the reference documentation of the resource you want to work with. The easiest way to get there is by googling "cloudformation \<resource name\>". The documentation is not always clear about which properties are required and which are optional, so it may require some trial and error when working with a new resource.

In the case of our VPC, we only define the property `CidrBlock` that defines the range of IP addresses available to any resources within the VPC that need an IP address. The value `10.0.0.0/16` means that we're creating a network with an IP address range from `10.0.0.0` through `10.0.255.255` (the 16 leading bits `10.0` are fixed, the rest is free to use).

We could deploy the CloudFormation stack with only this single resource, but we need some more infrastructure for deploying our application. Here's a list of all the resources we deploy with a short description for each. You can look them up in the [`network.yml` file](https://github.com/stratospheric-dev/stratospheric/blob/main/chapters/chapter-1/cloudformation/network.yml)) to see their configuration:

* **`PublicSubnet`:** A public subnet in one of the availability zones of the region we're deploying into. We make this subnet public by setting `MapPublicIpOnLaunch` to true and attaching it to an internet gateway.
* **`InternetGateway`:** An internet gateway to allow inbound traffic from the internet to resources in our public subnet and outbound traffic from the subnet to the internet.
* **`GatewayAttachment`:**  This resource of type `VpcGatewayAttachment` attaches our subnet to the internet gateway, making it effectively public.
* **`PublicRouteTable`:** A `RouteTable` to define routes between the internet gateway and the public subnet.
* **`PublicSubnetRouteTableAssociation`:** Some boilerplate to link the route table with our public subnet.
* **`PublicRoute`:** The actual route telling AWS that we want to allow traffic from our internet gateway to any IP address within our public subnet.
* **`ECSCluster`:** A container for running ECS tasks. We'll deploy an ECS task with our Docker image later in the service stack (`service.yml`).
* **`ECSSecurityGroup`:** A security group that we can later use to allow traffic to the ECS tasks (i.e. to our Docker container). We'll refer to this security group later in the service stack (`service.yml`)
* **`ECSSecurityGroupIngressFromAnywhere`:** A security group rule that allows traffic from anywhere to any resources attached to our `ECSSecurityGroup`.
* **`ECSRole`:** A role that attaches some permissions to the `ecs-service` principal. We're giving the ECS service some permissions to modify networking stuff for us.
* **`ECSTaskExecutionRole`:** A role that attaches some permissions to the `ecs-tasks` principal. This role will give our ECS tasks permissions to write log events, for example.

That's quite some resources we need to know about and configure. Creating CloudFormation templates quickly becomes a trial-and-error marathon until you get it configured just right for your use case. In the [book](https://stratospheric.dev), we'll also have a look at the Cloud Development Kit (CDK) which takes some of that work from our shoulders.

In case you wondered about the special syntax used in some places of the YAML file, let's quickly run through it:

* **`Fn::Select`** / **`!Select`**: Allows us to select one element from a list of elements. We use it to select the first availability zone of the region we're working in.
* **`Fn::GetAZs`** / **`!GetAZs`**: Gives us a list of all availability zones in a region.
* **`Fn::Ref`** / **`!Ref`**: Allows us to reference another resource by the name we've given to it.
* **`Fn::Join`** / **`!Join`**: Joins a list of strings to a single string, with a given delimiter between each.
* **`Fn::GetAtt`** / **`!GetAtt`**: Resolves an attribute of a resource we've defined.

All functions have a long form (`Fn::...`) and a short form (`!...`) which behave the same, but look a bit different in YAML. In a nutshell, we can use the short form for single-line expressions and the long form for longer expressions that we might want to split over several lines.

Finally, at the bottom of `network.yml`, we see an `Outputs` section:

```yaml
Outputs:
  ClusterName:
    Description: The name of the ECS cluster
    Value: !Ref 'ECSCluster'
    Export:
      Name: !Join [ ':', [ !Ref 'AWS::StackName', 'ClusterName' ] ]
  ... (more outputs)
```

Each output describes a parameter that we want to export from the stack to be used in other stacks.

For example, we export the name of the ECS Cluster under the name `<NETWORK_STACK_NAME>:ClusterName`. In other stacks, like our service stack, we now only need to know the name of the network stack to access all of its output parameters.

Let's have a look at the service stack now to see how we deploy our application.

### The Service Stack

The service stack is defined in [`service.yml`](https://github.com/stratospheric-dev/stratospheric/blob/main/chapters/chapter-1/cloudformation/service.yml). We call it "service stack" because it describes an ECS task and an ECS service that spins up Docker containers and do some magic to make them available via the internet.

Different from the network stack, the service stack starts with a `Parameters` section:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Deploys a Docker container within a previously created VPC. 
             Requires a running network stack.
Parameters:
  NetworkStackName:
    Type: String
    Description: The name of the networking stack that
      these resources are put into.
  ServiceName:
    Type: String
    Description: A human-readable name for the service.
  ImageUrl:
    Type: String
    Description: The url of a docker image that will handle incoming traffic.
  ContainerPort:
    Type: Number
    Default: 80
    Description: The port number the application inside the docker container
      is binding to.
  ContainerCpu:
    Type: Number
    Default: 256
    Description: How much CPU to give the container. 1024 is 1 CPU.
  ContainerMemory:
    Type: Number
    Default: 512
    Description: How much memory in megabytes to give the container.
  DesiredCount:
    Type: Number
    Default: 1
    Description: How many copies of the service task to run.
...
```

Within the `Parameters` section, we can define input parameters to a stack. We're passing the name of an existing network stack, for example, so that we can refer to its output parameters. Also, we pass in a URL pointing to the Docker image we want to deploy and some other information that we might want to change from one deployment to another.

The service stack deploys merely three resources:

* **`LogGroup`:** A container for the logs of our application.
* **`TaskDefinition`:** The definition for an ECS task. The task will pull one or more Docker images from URLs and run them.
* **`Service`:** An ECS service that provides some logic around a task definition, like how many instances should run in parallel and if they should be assigned public IP addresses.

In several instances, you'll see references to the network stack's outputs like this one:

```yaml
Fn::ImportValue:
  !Join [':', [!Ref 'NetworkStackName', 'ClusterName']]
```

`Fn:ImportValue` imports an output value exported by another stack. Since we have included the network stack name in the name out its outputs, we need to join the network stack name with the output parameter name to get the right value.

So, we've looked at over 200 lines of YAML configuration describing the infrastructure we want to deploy. In the [book](https://stratospheric.dev), we'll also have a look at AWS CDK (Cloud Development Kit) to see how to do this in Java instead of YAML, making it more reusable and easier to handle in general.

## Inspecting the Deployment Scripts

Let's deploy our app to the cloud! We'll need the scripts `create.sh` and `delete.sh` from the `cloudformation` folder in the [GitHub repo](https://github.com/stratospheric-dev/stratospheric/tree/main/chapters/chapter-1/cloudformation).

Go ahead and run the `create.sh` script now, if you want. While you're waiting for the script to finish (it can take a couple of minutes), we'll have a look at the script itself.

The script starts with calling `aws cloudformation create-stack` to create the network stack:

```text
aws cloudformation create-stack \
  --stack-name stratospheric-basic-network \
  --template-body file://network.yml \
  --capabilities CAPABILITY_IAM

aws cloudformation wait stack-create-complete \
  --stack-name stratospheric-basic-network
```

We're passing the name for the stack, the path to our `network.yml` stack template and the capability `CAPABILITY_IAM` to allow the stack to make changes to IAM (Identity and Access Management) roles.

Since the `create-stack` command executes asynchronously, we call `aws cloudformation wait stack-create-complete` afterwards to wait until the stack is up and running.

Next, we're doing the same for the service stack:

```text
aws cloudformation create-stack \
  --stack-name stratospheric-basic-service \
  --template-body file://service.yml \
  --parameters \
    ParameterKey=NetworkStackName,ParameterValue=stratospheric-basic-network \
    ParameterKey=ServiceName,ParameterValue=todo-app-v1 \
    ParameterKey=ImageUrl,ParameterValue=docker.io/stratospheric/todo-app-v1:latest \
    ParameterKey=ContainerPort,ParameterValue=8080

aws cloudformation wait stack-create-complete \
  --stack-name stratospheric-basic-service
```

With `--parameters`, we're passing in all the parameters that we want different from the defaults. Specifically, we're passing `docker.io/stratospheric/todo-app-v1:latest` into the `ImageUrl` parameter to tell AWS to download our Docker image and run it.

After both stacks are up and running, we're using some AWS command-line magic to extract the public IP address of the running application:

```text
CLUSTER_NAME=$(
  aws cloudformation describe-stacks \
    --stack-name stratospheric-basic-network \
    --output text \
    --query 'Stacks[0].Outputs[?OutputKey==`ClusterName`].OutputValue | [0]'
)
echo "ECS Cluster:       " $CLUSTER_NAME

TASK_ARN=$(
  aws ecs list-tasks \
    --cluster $CLUSTER_NAME \
    --output text --query 'taskArns[0]'
)
echo "ECS Task:          " $TASK_ARN

ENI_ID=$(
  aws ecs describe-tasks \
    --cluster $CLUSTER_NAME \
    --tasks $TASK_ARN \
    --output text \
    --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value'
)
echo "Network Interface: " $ENI_ID

PUBLIC_IP=$(
  aws ec2 describe-network-interfaces \
    --network-interface-ids $ENI_ID \
    --output text \
    --query 'NetworkInterfaces[0].Association.PublicIp'
)
echo "Public IP:         " $PUBLIC_IP

echo "You can access your service at http://$PUBLIC_IP:8080"
```

We're using different AWS commands to get to the information we want. First, we output the network stack and extract the name of the ECS cluster. With the cluster name, we get the ARN (Amazon Resource Name) of the ECS task. With the task ARN, we get the ID of the network interface of that task. And with the network interface ID we finally get the public IP address of the application so we know where to go.

All commands use the AWS CLI to output the results as `text` and we extract certain information from that text with the `--query` parameter.

The output of the script should look something like that:

```text
StackId: arn:aws:cloudformation:.../stratospheric-basic-network/...
StackId: arn:aws:cloudformation:.../stratospheric-basic-service/...
ECS Cluster:        stratospheric-basic-network-ECSCluster-qqX6Swdw54PP
ECS Task:           arn:aws:ecs:.../stratospheric-basic-network-...
Network Interface:  eni-02c096ce1faa5ecb9
Public IP:          13.55.30.162
You can access your service at http://13.55.30.162:8080
```

Go ahead and copy the URL at the end into your browser and you should see the text "Welcome to the Todo application" on your screen.

Hooray! We've just deployed an app and all the infrastructure it needs to the cloud with a single CLI command! We're going to leverage that later to create a fully automated continuous deployment pipeline.

But first, let's inspect the infrastructure and application we've deployed.


## Inspecting the AWS Console

The AWS console is the cockpit for all things AWS. We can view the status of all the resources we're using, interact with them, and provision new resources.

We could have done everything we've encoded into the CloudFormation templates above by hand using the AWS console. But setting up infrastructure manually is error prone and not repeatable, so we're not going to look at how to do that.

However, **the AWS console is a good place to view the resources we've deployed, to check their status, and to kick off debugging if we need it**.

Go ahead and log in to the [AWS console](https://aws.amazon.com/console/) and let's take a quick tour!

After logging in, type "CloudFormation" into the "Find Services" box and select the CloudFormation service.

You should see a list of your CloudFormation stacks with a status for each. The list should contain at least the stacks `stratospheric-basic-service` and `stratospheric-basic-network` in status `CREATE_COMPLETE`. Click on the network stack.

In the detail view of a stack, we get a host of information about the stack. Click on the "Events" tab first.

Here, we see a list of events for this stack. Each event is a status change of one of the stack's resources. We can see the history of events: in the beginning, a bunch of resources were in status `CREATE_IN_PROGRESS` and transitioned into status `CREATE_COMPLETE` a couple of seconds later. Then, when the resources they depend on are ready, other resources started their life in the same way. And so on. CloudFormation takes care of the dependencies between resources and creates and deletes them in the correct sequence.

The "Events" tab is the place to go when the creation of a stack fails for some reason. It will show which resource failed and will (usually) show an error message that helps us to debug the problem.

Let's move on to the "Resources" tab. It shows us a list of the network stack's resources. The list shows all the resources we've included in the `network.yml` CloudFormation template:

For some resources, we get a link to the resource in the "Physical ID" column. Let's click on the ID of the `ECSCluster` resource to take a look at our application.

The link has brought us to the console of the ECS service. We can also get here by opening the "Services" dropdown at the top of the page and typing "ECS" into the search box.

The detail view of our ECS cluster shows that we have 1 service and 1 task running in this cluster. If we click on the "Tasks" tab, we see a list of running tasks, which should contain one entry only. Let's click on the link in the "Task" column to get a detail view of the task.

The detail view shows a lot of information we're not interested in, but it also shows the Public IP address of the task. This is the IP address that we extracted via AWS CLI commands earlier. You can copy it into your browser, append the port 8080, and you should see the hello message again.

Below the general information is a section called "Containers", which shows the container we've deployed with this task. Click on the little arrow on the left to expand it. In the "Log Configuration" section, click on the link "View logs in CloudWatch".

CloudWatch is Amazon's service for monitoring applications. In our service stack, we added a "LogGroup" resource and used the name of that log group in the logging configuration of the container definition. This is the reason why we can now see the logs of that app in CloudWatch.

After the "Events" tab in the CloudFormation UI, the logs are the second place to look at when (not if) something goes wrong.

This concludes our first experiment with AWS. Feel free to explore the AWS console a bit more to get a feel for how everything works. In the [book](https://stratospheric.dev), we'll go into more detail of different AWS services.

**When you're done, don't forget to run `delete.sh` to delete the stacks again**, otherwise they will incur costs at some point. You can also delete the stacks via the CloudFormation UI.

## Check out the Book!

<a href="https://stratospheric.dev"><img src="/assets/img/stratospheric/stratospheric-cover.jpg" alt="Stratospheric - From Zero to Production with Spring Boot and AWS" style="float:left; clear:both; padding-right: 15px; margin-bottom: 30px;"/></a>
This was a sample chapter from the book ["Stratospheric - From Zero to Production with Spring Boot and AWS"](https://stratospheric.dev). 

If you enjoyed this article, make sure to check out the book to learn more about building Spring Boot applications with AWS.




