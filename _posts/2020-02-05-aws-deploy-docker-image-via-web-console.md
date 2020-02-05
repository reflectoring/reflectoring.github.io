---
title: Deploying Your First Docker Image to AWS
categories: [java]
date: 2020-02-03 05:00:00 +1100
modified: 2020-02-03 05:00:00 +1100
author: default
excerpt: "TODO"
image:
  auto: 0059-cloud
---

Amazon Web Services is a beast. It offers so many different cloud services that my natural reaction was to be intimidated. But not for long! I intend to tame that beast one blog post at a time!

We'll start off this series by creating a small win to boost our motivation: we'll deploy a Docker image  using the AWS Management Console. In a real world scenario with multiple images, we'd want to automate deployments using scripts and the AWS command-line interface. But using the web-based Management Console is a good way to get our bearings.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/aws-hello-world" %}

## Prerequisites

Before we start, there are some things to set up to get this tutorial going smoothly.

First, **you need to have an account at [hub.docker.com](https://hub.docker.com/)**. Once logged in, you need to create a repository. You can give it any name you want, but `aws-hello-world` is a good candidate. We'll later use this repository to publish our Docker image so that AWS can load it from there.

You can also use a different Docker registry ([Amazon ECR](https://docs.aws.amazon.com/ecr/?id=docs_gateway), [Artifactory](https://www.jfrog.com/confluence/display/RTF/Docker+Registry), Docker's own [Registry](https://docs.docker.com/registry/), or any of a list of other products), but we'll use the public Docker Hub in this tutorial. 

Second, **you'll obviously need an AWS account**. Go to [aws.amazon.com/console/](https://aws.amazon.com/console/) and sign up. 

Note that, as of yet, I find Amazon's pricing for its cloud services very intransparent. I can't guarantee that this tutorial won't incur costs for your AWS account, but it hasn't for me.

## Preparing a Docker Image

### Creating the Docker Image

docker build -t reflectoring/aws-hello-world:latest .

check with docker images | grep reflectoring

### Testing the Docker Image

docker run -p 8081:8080 reflectoring/aws-hello-world:latest

Forwards port 8081 to port 8080 within the container

8081 is the host port, 8080 is the container port

### Publishing the Docker Image 

the image must be published to AWS to be used in EC/2

can the image also be published in a public docker registry?

how can I publish the image only to be used by my company?

if you need a private repository, you have to pay

docker login

if you keep getting “denied: requested access to the resource is denied” make sure you have created a docker repository on docker.io and you’re using your own username (or an organization’s name that you have permission for)

## AWS Concepts

* ECS
* Cluster
* Task
* Service

## Deploying the Docker Image

restriction: no port forwarding from 80 to 8080: we must expose port 8080 externally

we’ll be using the “First Run Wizard”

what is FARGATE?

https://docs.aws.amazon.com/AmazonECS/latest/developerguide/launch_types.html

https://ap-southeast-2.console.aws.amazon.com/ecs/home?region=ap-southeast-2#/firstRun

### Configuring the Container

### Configuring the Task

Port Mapping:

container port: the port within the container (8080)

host port: the port exposed by the host (80)

we can only specify the container port, because “Your containers in the task will share an ENI using a common network stack. Port mappings can only specify container ports (any existing host port specifications will be removed).”

### Configuring the Service

### Configuring the Cluster

### Testing the Service

how do I know the URL under which it’s available?

I can only see the URL when I have configured a loadbalancer?

Cluster->Task->ENI-ID: copy the IPv4 Public IP to the browser to check the application

## Questions For Future Articles

how can I see what’s happening on my application (article about monitoring)

how can I access other AWS resources (article about SQS / database)

what do AWS acronyms mean (article about AWS overview)

how can I balance the load to my application?

how can I deploy a private docker image?

how can I bind a domain to my service?

how can I access the logs of my service?

Cluster->Task->Containers → expand ->Log Configuration → View logs in CloudWatch

or: Cluster->Task-> Logs tab

how can I test my docker container with AWS locally?

https://aws.amazon.com/de/blogs/compute/a-guide-to-locally-testing-containers-with-amazon-ecs-local-endpoints-and-docker-compose/

## Conclusion



