---
title: Deploying a Spring Boot App from a CI/CD Pipeline with AWS CloudFormation
categories: [craft]
date: 2020-04-13 05:00:00 +1100
modified: 2020-04-13 05:00:00 +1100
author: default
excerpt: "TODO"
image:
  auto: 0035-switchboard
---

## Quick Intro to Cloudformation

## Creating a Simple Cloudformation Stack

## Deploying a Cloudformation Stack with AWS CLI

### Configuring the AWS CLI

run `aws configure`

### Uploading the Stack File to S3

`aws s3 cp stack-simple-ec2.yml s3://reflectoring-cloudformation-bucket/stack-simple-ec2.yml`

### Creating a Key Pair

### Creating the Stack
`aws cloudformation create-stack --stack-name reflectoring-simple-stack --template-url https://reflectoring-cloudformation-bucket.s3-ap-southeast-2.amazonaws.com/stack-simple-ec2.yml --parameter ParameterKey=KeyName,ParameterValue=reflectoring-keypair`

### Checking the Stack via CLI

run `aws cloudformation describe-stacks`

connect via SSH `ssh -v -i reflectoring-keypair.pem ec2-user@13.210.150.78`

### Checking the Stack via AWS Web Console

If something went wrong, the stack may be rolled back and eventually end up in status `ROLLBACK_COMPLETE`. In that case, have a look at the "Events" tab in the detail view of your stack in Cloudformation web console.

```
No default VPC for this user
```

This means you have probably deleted your default VPC. Go to "VPC", click the "Actions" Button and on "Create default VPC"

<div class="notice success">
  <h4>ECSService stuck in CREATE_IN_PROGRESS?</h4>
  Most likely the corresponding ECSTask is still in status PENDING. Check this on the ECS page. Click on the "Tasks" tab and under "Containers" expand the container. There, under "Details" you should see the reason for the task not starting.
  
  In my case the reason was "CannotPullContainerError: Error response from daemon: Get https://registry-1.docker.io/v2/: net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)" -> Solution: provide ECS access to the internet.
</div>

Next Problem: Tasks keep being stopped and restarted with error "Exit Code	143". Something to do with health checks? Yes: "Task failed ELB health checks" is shown in the "Last status" column of the stopped tasks.

Next question: how can I change the ELB health check (or remove the ELB completely?).


### Deleting the Stack
`aws cloudformation delete-stack --stack-name reflectoring-simple-stack`

## Automating it with Github Actions

Internet Gateway: https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html
