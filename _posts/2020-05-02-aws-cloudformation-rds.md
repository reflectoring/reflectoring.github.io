---
title: "The AWS Journey Part 3: Connecting a Spring Boot Application to an AWS RDS Instance with CloudFormation"
categories: [craft]
date: 2020-05-02 05:00:00 +1000
modified: 2020-05-02 05:00:00 +1000
author: default
excerpt: "TODO"
image:
  auto: 0061-cloud
---

## Creating a Docker Image to Test RDS Connectivity

## Creating the Network Stack

* a DB subnet group must span at least 2 subnets in different AZs

## Troubleshooting

### I Can't Access the RDS Instance
* make sure that the route table of the subnet, the ACL of the VPC include a rule to let in traffic from 0.0.0.0/0 to port 5432
* when creating an RDS instance, it's set to "public accessibility" = "no"
  * change that by clicking on "modify" and set public accessibility to "yes"