---
title: "The AWS Journey Part 4: Zero-Downtime Deployment with CloudFormation and ECS"
categories: ["AWS"]
date: 2020-07-13T06:00:00
modified: 2020-07-13T06:00:00
authors: [tom]
description: "Having automated scripts to deploy an application via AWS CloudFormation is nice, but we want to replace the application with a new version every now and then, don't we? This article discusses some options for replacing a Docker image with a new version when using ECS and Fargate in combination with CloudFormation."
image: images/stock/0061-cloud-1200x628-branded.jpg
url: aws-cloudformation-ecs-deployment
widgets: ["simplify-form", "gyhdoca-ad", "stratospheric-ad"]
---

The AWS journey started with [deploying a Spring Boot application in a Docker container manually](/aws-deploy-docker-image-via-web-console/) and we continued with [automatically deploying it with CloudFormation](/aws-cloudformation-deploy-docker-image/) and [connecting it to an RDS database instance](/aws-cloudformation-rds).

On the road to a production-grade, continuously deployable system, we now want to find out **how we can deploy a new version of our Docker image without any downtime** using CloudFormation and ECS.

{{% stratospheric %}}
This article gives only a first impression of what you can do with CloudFormation and ECS.

If you want to go deeper and learn how to deploy a Spring Boot application to the AWS cloud and how to connect it to cloud services like RDS, Cognito, and SQS, make sure to check out the book [Stratospheric - From Zero to Production with Spring Boot and AWS](https://stratospheric.dev?utm_source=reflectoring&utm_content=in_content)!
{{% /stratospheric %}}

{{% github "https://github.com/thombergs/code-examples/tree/master/aws/cloudformation/ecs-zero-downtime-deployment" %}}

## Recap: The CloudFormation Stacks

In the previous blog posts of this series, we have created a set of CloudFormation stacks that we'll reuse in this article:

* a [network stack](https://reflectoring.io/aws-cloudformation-deploy-docker-image/#designing-the-network-stack) that creates a virtual private cloud (VPC) network, a load balancer, and all the wiring that's necessary to deploy a Docker container with Amazon's ECS service,
* a [service stack](https://reflectoring.io/aws-cloudformation-deploy-docker-image/#designing-the-service-stack) that takes a Docker image as input and creates an ECS service and task to deploy that image into the VPC created by the network stack.

You can review both stacks in YML format [on Github](https://github.com/thombergs/code-examples/tree/master/aws/cloudformation/ecs-in-two-public-subnets).

We can spin up the stacks using the AWS CLI with this Bash script: 

```bash
aws cloudformation create-stack \
  --stack-name reflectoring-network \
  --template-body file://network.yml \
  --capabilities CAPABILITY_IAM

aws cloudformation wait stack-create-complete --stack-name reflectoring-network

aws cloudformation create-stack \
  --stack-name reflectoring-service \
  --template-body file://service.yml \
  --parameters \
      ParameterKey=StackName,ParameterValue=reflectoring-network \
      ParameterKey=ServiceName,ParameterValue=reflectoring-hello-world \
      ParameterKey=ImageUrl,ParameterValue=docker.io/reflectoring/aws-hello-world:latest \
      ParameterKey=ContainerPort,ParameterValue=8080 \
      ParameterKey=HealthCheckPath,ParameterValue=/hello \
      ParameterKey=HealthCheckIntervalSeconds,ParameterValue=90

aws cloudformation wait stack-create-complete --stack-name reflectoring-service
```

The stacks are fairly well configurable, so we can play around with the parameters to deploy any Docker container. 

Being able to deploy an application by creating CloudFormation stacks is nice and all, but to implement a continuous deployment pipeline, **we need to deploy new versions of the Docker image without downtime**.

How can we do that? 

## Options for Updating a CloudFormation Stack

We'll discuss four options to update a running CloudFormation stack:

* The first option is to simply [update the stack](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks.html) **using CloudFormations `update` command**. We modify the template and/or the parameters and then run the `update` command.
* A more secure approach is to **use a [changeset](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html)**. This way, we can preview the changes CloudFormation will do and can execute the changes once we're satisfied that CloudFormation will only apply intended changes.
* Another option is to **delete a stack and then re-create it**.
* Finally, we can **use the ECS API to replace the ECS task** with a new one carrying the new Docker image.
 
Let's investigate how we can use each of these options to deploy a new version of a Docker image into our service stack. 

## Option 1: Updating the Service Stack

Let's say we have started our service stack with the `aws cloudformation create-stack` command from above. We passed the Docker image `docker.io/reflectoring/aws-hello-world:latest` into the `ImageUrl` parameter. The stack has spun up an ECS cluster running 2 Docker containers with that image (2 is the default `DesiredCount` in the [service stack](https://reflectoring.io/aws-cloudformation-deploy-docker-image/#designing-the-service-stack)).

Now, let's say we have published a new version of our Docker image and want to deploy this new version. We can simply run an `update-stack` command:

```text
aws cloudformation update-stack \
  --stack-name reflectoring-service \
  --use-previous-template \
  --parameters \
      ParameterKey=ImageUrl,ParameterValue=docker.io/reflectoring/aws-hello-world:v3 \
      ... more parameters

aws cloudformation wait stack-update-complete --stack-name reflectoring-service
```

To make sure that we haven't accidentally changed anything in the cloudformation template, we're using the parameter `--use-previous-template`, which takes the template from the previous call to `create-stack`.

We have to be careful to **only change the parameters we want to change**. In this case, we have only changed the `ImageUrl` parameter to `docker.io/reflectoring/aws-hello-world:v3`.
 
**We cannot use the popular `latest` tag to specify the latest version of a Docker image**, even though it would point to the same version. That's because CloudFormation compares the input parameters of the update call to the input parameters we used when we created the stack to identify if there was a change. If we used `docker.io/reflectoring/aws-hello-world:latest` in both cases, CloudFormation wouldn't identify a change and do nothing. 

Once the update command has run, ECS will spin up two Docker containers with the new image version, drain any connections from the old two containers, send new requests to the new containers and finally remove the old ones. 

All this works because we have configured a `DesiredCount` of 2 and a `MaximumPercent` of 200 in our ECS service configuration. This allows a maximum of 200% (i.e. 4) of the desired instances to run during the update.

That's it. The stack has been updated with a new version of the Docker image.

This method is easy, but it has the drawback of being error-prone. **We might accidentally change one of the other 5 parameters or have made a change in the stack `yml` file**. All these unwanted changes would automatically be applied!

## Option 2: Avoid Accidental Changes with Changesets

If we want to make sure not to apply accidental changes during an `aws cloudformation update-stack` command, we can use [changesets](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html).

To create a changeset, we use the `create-change-set` command:

```text
aws cloudformation create-change-set \
  --change-set-name update-reflectoring-service \
  --stack-name reflectoring-service \
  --use-previous-template \
  --parameters \
      ParameterKey=ImageUrl,ParameterValue=docker.io/reflectoring/aws-hello-world:v4 \
      ... more parameters
```

This command calculates any changes to the currently running stack and stores them for our approval. 

Again, we pass the `--use-previous-template` parameter to avoid accidental changes to the stack template. We could just as well pass a template file, however, and any changes in that template compared to the one we previously used would be reflected in the changeset.

After having created a changeset, we can review it in the AWS console or with this CLI command:  

```text
aws cloudformation describe-change-set \
  --stack-name reflectoring-service \
  --change-set-name update-reflectoring-service
```

This outputs a bunch of JSON or YAML (depending on your preferences), which lists the resources that would be updated when we execute the changeset.

When we're happy with the changes, we can execute the changeset:

```text
aws cloudformation execute-change-set \
  --stack-name reflectoring-service \
  --change-set-name update-reflectoring-service
```

Now, the stack will be updated, same as with the `update-stack` command, and the Docker containers will be replaced with new ones carrying the new Docker image.

While I get the idea of having a manual review step before deploying changes, I find that the changesets are hard to interpret. They list the resources that are being changed, but they don't highlight the attributes of the resources that changed. I imagine it to be very hard to properly review a changeset for potential errors.

Also, ** a manual review changesets defeats the purpose of continuous delivery**. We don't want any manual steps in between merging the code to the main branch and the actual deployment.

I guess we could build some fancy automation that validates a changeset for us, but what validations would we program into it? That smells of too much of a maintenance overhead for me, so I'm opting out of changesets for my purposes. 

## Option 3: Delete and Re-create a Granular Stack

The third, and most destructive, option to deploy a new version of our app is to simply delete and then re-create a CloudFormation stack.

In the case of the network and service stack above, **that would mean we have a downtime**, though! If we delete the service stack, the currently running Docker containers would be deleted as well. Only after the new stack with the new Docker image has been created would the application be available again.

In some cases, it might be possible to split the CloudFormation stacks into multiple, more granular pieces and then delete and re-create one of the stacks in isolation without causing a downtime. But this doesn't work with ECS and the Fargate deployment option. We'd have to delete the `ECS::Service` resource and that means a downtime. 

**This is not a solution when we want to update a Docker image with ECS and Fargate without downtime**.

## Option 4: Update the ECS Service via the API

The last option is to call the ECS API directly to update the ECS task (credit for researching this option goes to [Philip Riecks](https://rieckpil.de/), with whom I'm currently creating an AWS training resource). 

For this option, we need to create a JSON file describing the ECS task we want to update. That looks something like this (this file is from a different project than the stacks discussed earlier, so it won't match up):

```json
{
  "family": "aws101-todo-app",
  "cpu": "256",
  "memory": "512",
  "requiresCompatibilities": [
    "FARGATE"
  ],
  "networkMode": "awsvpc",
  "executionRoleArn": "<ROLE_ARN>",
  "containerDefinitions": [
    {
      "cpu": 256,
      "memory": 512,
      "name": "aws101-todo-app",
      "image": "<IMAGE_URL>",
      "portMappings": [
        {
          "containerPort": 8080
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "aws101-todo-app",
          "awslogs-region": "eu-central-1",
          "awslogs-stream-prefix": "aws101-todo-app"
        }
      }
    }
  ]
}
```

To create the above file, we need to research some parameters from the CloudFormation stacks like the ARN of the IAM role that we want to assign to the task. 

Then, we register the task with ECS:

```text
aws ecs register-task-definition --cli-input-json file://ecs-task.json
```

And finally, we update the ECS service that we created with the CloudFormation stack and replace the existing ECS task with the new one:  

```text
aws ecs update-service \
  --cluster <ecs-cluster-name> \
  --service <ecs-service-name> \
  --task-definition <ecs-task-arn> \
```

This requires the ECS service to be running already, naturally, so we'd need to have created the CloudFormation stack before running this command.

Also, we need to find out the name of the ECS cluster and the ECS Service as well as the ARN (Amazon Resource Name) of the ECS task that we just created.

Calling the API directly gives us ultimate control over our resources, but I don't particularly like the idea of modifying resources that we have previously created via a CloudFormation stack. 

While this example is probably harmless, **if we're using APIs to modify resources that we have created with CloudFormation too much, we might put a CloudFormation stack in a state where we can't update it via CloudFormation any more**. 

I guess that's not a problem when you're not planning to run updates via CloudFormation anyways, but I like the fact that CloudFormation is managing the resources for me and don't want to interfere with that unless I must.

## Conclusion

So many different ways to update an ECS task to replace one Docker image with another! Most of the options discussed provide a way to deploy a new version without downtime.

I'll take advantage of CloudFormation's resource management for now, so I'll stick with the simple `update-stack` option, at least until I find a reason why that's not working anymore.

## The AWS Journey

By now, we have successfully deployed a highly available Spring Boot application and a (not so highly available) PostgreSQL instance all with running a few commands from the command line. In this article, we have discussed some options to deploy a new version of a Docker image without downtime.

But there's more to do on the road to a production-ready, continuously deployable system.

Here's a list of the questions I want to answer on this journey. If there's a link, it has already been answered with a blog post! If not, stay tuned!

* [How can I deploy an application from the web console?](/aws-deploy-docker-image-via-web-console/)
* [How can I deploy an application from the command line?](/aws-cloudformation-deploy-docker-image/)
* [How can I implement high availability for my deployed application?](/aws-cloudformation-deploy-docker-image#public-subnets)
* [How do I set up load balancing?](/aws-cloudformation-deploy-docker-image/#load-balancer)
* [How can I deploy a database in a private subnet and access it from my application?](/aws-cloudformation-rds/) 
* [**How can I deploy a new version of my application without downtime?**](/aws-cloudformation-ecs-deployment/) (this article)
* How can I deploy my application from a CI/CD pipeline?
* How can I deploy my application into multiple environments (test, staging, production)?
* How can I auto-scale my application horizontally on high load?
* How can I implement sticky sessions in the load balancer (if I'm building a session-based web app)?
* How can I monitor what’s happening on my application?
* How can I bind my application to a custom domain?
* How can I access other AWS resources (like SQS queues and DynamoDB tables) from my application?
* How can I implement HTTPS?

{{% stratospheric %}}
This article gives only a first impression of what you can do with CloudFormation and ECS.

If you want to go deeper and learn how to deploy a Spring Boot application to the AWS cloud and how to connect it to cloud services like RDS, Cognito, and SQS, make sure to check out the book [Stratospheric - From Zero to Production with Spring Boot and AWS](https://stratospheric.dev?utm_source=reflectoring&utm_content=in_content)!
{{% /stratospheric %}}
