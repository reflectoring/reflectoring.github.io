---
authors: [pratikdas]
title: "Getting Started with AWS CDK"
categories: ["spring-boot"]
date: 2022-01-05 06:00:00 +1000
modified: 2022-01-05 06:00:00 +1000
excerpt: "AWS Cloud Development Kit (CDK) is a framework for defining cloud infrastructure in code and provisioning it through AWS CloudFormation. It lets us build reliable, scalable, and cost-effective applications in the cloud with the expressive power of a programming language. In this article, we will introduce AWS CDK, understand its core concepts and work through some examples."
image: images/stock/0115-2021-1200x628-branded.jpg
url: getting-started-with-aws-cdk
---

Infrastructure as Code (IaC) is the managing and provisioning of infrastructure through code instead of through manual processes.

AWS provides native support for IaC  the Azure Resource Manager. Teams can define declarative templates that specify the infrastructure required to deploy their solutions.

AWS Cloud Development Kit (CDK) is a framework for defining cloud infrastructure in code and provisioning it through AWS CloudFormation. It lets us build reliable, scalable, and cost-effective applications in the cloud with the expressive power of a programming language. 

In this article, we will introduce AWS CDK, understand its core concepts and work through some examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-i18n" %}

## What is AWS CDK
AWS CDK, a framework for defining cloud infrastructure in code and provisioning it through AWS CloudFormation. It lets us build reliable, scalable, and cost-effective applications in the cloud with the expressive power of a programming language. We can define our cloud infrastructure as code in one of the supported programming languages. The CDK actually builds on AWS CloudFormation and uses it as the engine for provisioning AWS resources. Rather than using a declarative language like JSON or YAML to define your infrastructure, the CDK lets you do that in your favorite imperative programming language. 
CDK is that it is designed to support multiple programming languages. The core of the system is written in TypeScript, but bindings for other languages can be added.

## Quick Start - Provision a VM and a S3 Bucket with CDK

Define a VM in code

```java

```

Synthesize Cloudformation Template

Deploy Cloudformation Template

Destroy the infrastructure


## Concepts

## Construct - the basic building block
Constructs are the basic building blocks of AWS CDK apps. A construct represents a "cloud component" and encapsulates everything AWS CloudFormation needs to create the component.

## App - the Application
We use the App construct to define a stack within the scope of an application. The following example app instantiates a MyFirstStack and produces the AWS CloudFormation template that the stack defined.

## Stack - Unit of Deployment
A stack is the unit of deployment in the AWS CDK. All AWS resources defined within the scope of a stack are provisioned as a single unit.
We can define any number of stacks in our AWS CDK app. Any instance of the Stack construct represents a stack, and can be either defined directly within the scope of the app, like the MyFirstStack example shown previously, or indirectly by any construct within the tree.

For example, the following code defines an AWS CDK app with two stacks.

```java
App app = new App();

new MyFirstStack(app, "stack1");
new MySecondStack(app, "stack2");

app.synth();

```


## Conclusion

Here is a list of the major points for a quick reference:


You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-i18n).

