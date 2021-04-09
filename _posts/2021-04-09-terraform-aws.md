---
title: "Using Terraform to Deploy AWS Resources"
categories: [craft]
date: 2020-07-27 06:00:00 +1000
modified: 2020-07-27 06:00:00 +1000
author: pratikdas
excerpt: "Developing a Spring Boot App Against AWS Services with LocalStack"
image:
  auto: 0074-stack
---
Provisioning infrastructure has historically been a time consuming and costly manual process. Now infrastructure management has moved away from physical hardware in data centers to virtualization, containers, and cloud computing. 

With cloud computing, the number of infrastructure components has grown, more applications are being released to production on a daily basis, and infrastructure needs to be able to be spun up, scaled, and taken down frequently. Without an IaC practice in place, it becomes increasingly difficult to manage the scale of today’s infrastructure.


{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/localstack" %}

## What is IAC?
Infrastructure as Code (IaC) is the managing and provisioning of infrastructure through code instead of through manual processes.

With IaC, configuration files are created that contain your infrastructure specifications, which makes it easier to edit and distribute configurations. It also ensures that you provision the same environment every time.

By codifying and documenting your configuration specifications, IaC aids configuration management and helps you to avoid undocumented, ad-hoc configuration changes.

Version control is an important part of IaC, and your configuration files should be under source control just like any other software source code file. 

Deploying your infrastructure as code also means that you can divide your infrastructure into modular components that can then be combined in different ways through automation.



## IAC with Terraform

Terraform is an open-source infrastructure as code software tool that provides a consistent CLI workflow to manage hundreds of cloud services. Terraform codifies cloud APIs into declarative configuration files.

## Terraform Basic Concepts

We first install the LocalStack package using pip:

```
pip install localstack
```
We then start localstack with the "start" command as shown below:

```
localstack start
```
This will start LocalStack inside a Docker container.

### Examples
We can also run LocalStack directly as a Docker image either with the Docker run command or with `docker-compose`.

We will use `docker-compose`. For that, we download the base version of `docker-compose.yml` from the [GitHub repository of LocalStack](https://github.com/localstack/localstack/blob/master/docker-compose.yml) and customize it as shown in the next section or run it without changes if we prefer to use the default configuration:

```
TMPDIR=/private$TMPDIR docker-compose up
```

This starts up LocalStack. The part `TMPDIR=/private$TMPDIR` is required only in MacOS. 



## Conclusion

IaC can help your organization manage IT infrastructure needs while also improving consistency and reducing errors and manual configuration.

Benefits:

Cost reduction
Increase in speed of deployments
Reduce errors 
Improve infrastructure consistency
Eliminate configuration drift
IaC tool examples
Server automation and configuration management tools can often be used to achieve IaC. There are also solutions specifically for IaC. 

These are a few popular choices:

Chef
Puppet
Red Hat Ansible Automation Platform
Saltstack
Terraform 
AWS CloudFormation

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/localstack).