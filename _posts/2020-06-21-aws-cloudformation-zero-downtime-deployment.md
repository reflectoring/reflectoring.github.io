---
title: "The AWS Journey Part 4: Zero-Downtime Deployment with CloudFormation and ECS"
categories: [craft]
date: 2020-05-19 05:00:00 +1000
modified: 2020-05-19 05:00:00 +1000
author: default
excerpt: "TODO"
image:
  auto: 0061-cloud
---

The AWS journey started with [deploying a Spring Boot application in a Docker container manually](/aws-deploy-docker-image-via-web-console/) and we continued with [automatically deploying it with CloudFormation](/aws-cloudformation-deploy-docker-image/) and [connecting it to an RDS database instance](/aws-cloudformation-rds).

On the road to a production-grade, continuously deployable system, we now want to find out **how we can deploy a new version of our Docker image without any downtime**.

## Code Example

TODO

## Recap: The CloudFormation Stacks

In the previous blog posts of this series, we have created a set of CloudFormation stacks that we'll reuse in this article:

* a [network stack](https://reflectoring.io/aws-cloudformation-deploy-docker-image/#designing-the-network-stack) that creates a virtual private cloud (VPC) network, a load balancer, and all the wiring that's neccessary to deploy a Docker container with Amazon's ECS service,
* a [service stack](https://reflectoring.io/aws-cloudformation-deploy-docker-image/#designing-the-service-stack) that takes a Docker image as input and creates an ECS service and task to deploy that image into the VPC created by the network stack.

You can review both stacks in YML format [on Github](https://github.com/thombergs/code-examples/tree/master/aws/cloudformation/ecs-in-two-public-subnets).

We can spin up the stacks using the AWS CLI with these commands: 

```bash
aws cloudformation create-stack \
  --stack-name reflectoring-hello-world-network \
  --template-body file://network.yml \
  --capabilities CAPABILITY_IAM

aws cloudformation wait stack-create-complete --stack-name reflectoring-hello-world-network

aws cloudformation create-stack \
  --stack-name reflectoring-hello-world-service \
  --template-body file://service.yml \
  --parameters \
      ParameterKey=StackName,ParameterValue=reflectoring-hello-world-network \
      ParameterKey=ServiceName,ParameterValue=reflectoring-hello-world \
      ParameterKey=ImageUrl,ParameterValue=docker.io/reflectoring/aws-hello-world:latest \
      ParameterKey=ContainerPort,ParameterValue=8080 \
      ParameterKey=HealthCheckPath,ParameterValue=/hello \
      ParameterKey=HealthCheckIntervalSeconds,ParameterValue=90

aws cloudformation wait stack-create-complete --stack-name reflectoring-hello-world-service
```

The stacks are fairly well configurable, so we can play around with the parameters to deploy any Docker container. 

Being able to deploy an application by creating CloudFormation stacks is nice and all, but **to implement a continuous deployment pipeline, we need to deploy new versions of the Docker image without downtime**.

How can we do that? 

## Options for Updating a CloudFormation Stack

There are three options to update a running CloudFormation stack:

The first option is to simply [update the stack](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks.html) using CloudFormations `update` command. We modify the template and/or the parameters and then run the `update` command.

A more secure approach is to use a [change set](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html). This way, we can preview the changes CloudFormation will do and can execute the changes once we're satisfied that CloudFormation will only apply intended changes.

The final solution is to delete a stack and the re-create it.   
 
Let's investigate how we can use each of these options to deploy a new version of a Docker image into our service stack. 

## Option 1: Updating the Service Stack

* simply update the service stack with a new docker image URL
* Danger! Only change the docker image! If we change anything else, we can wreak havoc on our production stacks!

## Option 2: Avoid Unintentional Changes with Change Sets

### Creating a Change Set

### Viewing a Change Set in AWS Console

### Validating a Change Set from the Command Line

### Executing a Change Set

## Option 3: Delete and Recreate a Granular Stack
* that's the reason we split up our deployment into a network and a service stack so that we don't accidentally change the network. If push comes to shove, we can delete the service stack and restart a new service stack while all the network configuration (and potentially associated IP addresses and DNS entries) stay the same. 


## The AWS Journey

By now, we have successfully deployed a highly available Spring Boot application and a (not so highly available) PostgreSQL instance all with running a few commands from the command line.

But there's more to do on the road to a production-ready, continuously deployable system.

Here's a list of the questions I want to answer on this journey. If there's a link, it has already been answered with a blog post! If not, stay tuned!

* [How can I deploy an application from the web console?](/aws-deploy-docker-image-via-web-console/)
* [How can I deploy an application from the command line?](/aws-cloudformation-deploy-docker-image/)
* [How can I implement high availability for my deployed application?](/aws-cloudformation-deploy-docker-image#public-subnets)
* [How do I set up load balancing?](/aws-cloudformation-deploy-docker-image/#load-balancer)
* [**How can I deploy a database in a private subnet and access it from my application?**](/aws-cloudformation-rds) (this article)
* How can I deploy my application from a CI/CD pipeline?
* How can I deploy a new version of my application without downtime?
* How can I deploy my application into multiple environments (test, staging, production)?
* How can I auto-scale my application horizontally on high load?
* How can I implement sticky sessions in the load balancer (if I'm building a session-based web app)?
* How can I monitor what’s happening on my application?
* How can I bind my application to a custom domain?
* How can I access other AWS resources (like SQS queues and DynamoDB tables) from my application?
* How can I implement HTTPS?
