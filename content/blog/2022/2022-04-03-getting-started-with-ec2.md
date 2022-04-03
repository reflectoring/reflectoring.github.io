---
authors: [pratikdas]
title: "Getting Started with Amazon EC2"
categories: ["aws"]
date: 2022-03-03T00:00:00
excerpt: "Amazon Elastic Compute (EC2) is a compute service from AWS with which we can create virtual machines in the Amazon Web Services (AWS) Cloud with varying characteristics. The computing capacity provided by EC2 is scalable and allows us to scale up or down to handle changes in requirements or spikes in popularity, reducing your need to forecast the load and traffic for investing in hardware upfront. In this article, we will introduce EC2 and understand some of its core concepts like instances, instance types, disk storage, networking, elastic capabilities, and security etc by working through some examples."
image: images/stock/0115-2021-1200x628-branded.jpg
url: getting-started-with-Amazon-EC2
---
Amazon Elastic Compute Cloud (EC2) is a compute service from AWS with which we can create virtual machines in the Amazon Web Services (AWS) Cloud with varying characteristics. The computing capacity provided by EC2 is scalable and allows us to scale up or down to handle changes in requirements or spikes in popularity, reducing your need to forecast the load and traffic for investing in hardware upfront. 

In this article, we will introduce EC2 and understand some of its core concepts like instances, instance types, disk storage, networking, elastic capabilities, and security etc by working through some examples.
{{% github "https://github.com/thombergs/code-examples/tree/master/aws/kinesis" %}}

## Creating an Amazon EC2 Instance

Let us get a flavour of the EC2 service by creating what we call an instance. 

An instance is a virtual server in the cloud. An instance will need a configuration like machine type. These configurations are available as templates called AMI. We associate a configuration with the instance by selecting from a set of AMIs.

An instance is an AWS resource. Like most AWS resources we can create an EC2 instance from the AWS administration console, CLI, or by leveraging IaC services: Cloudformation and AWS CDK. Creating an instance uses the steps shown in this diagram:

{{% image alt="Create EC2 instance" src="images/posts/aws-ec2/create-ec2.png" %}}

While creating the instance,

## Storage

## Networking

## Security

## Load Balancer

## Auto Scaling

## Instance Types


## Conclusion

Here is a list of the major points for a quick reference:

1. Streaming data is a pattern of data being generated continuously (in a stream) by multiple data sources which typically send the data records simultaneously. Due to its continuous nature, streaming data is also called unbounded data as opposed to bounded data handled by batch processing systems.
2. Amazon Kinesis is a family of managed services for collecting and processing streaming data in real-time.
3. Amazon Kinesis includes the following services each focussing on different stages of handling  streaming data :
* Kinesis Data Stream for ingestion and storage of streaming data
* Kinesis Firehose for delivery of streaming data
* Kinesis Analytics for running analysis programs over the ingested data for deriving analytical insights
* Kinesis Video Streams for ingestion and storage of video data
4. The Kinesis Data Streams service is used to collect and process streaming data in real-time.
5. The Kinesis Data Stream is composed of multiple data carriers called shards. Each shard provides a fixed unit of capacity.
6. Kinesis Data Firehose is a fully managed service that is used to deliver streaming data to a destination. 
7. Kinesis Data Analytics is used to analyze streaming data in real-time. It provides a fully managed service for running Apache Flink applications. Apache Flink is a Big Data processing framework for building applications that can process a large amount of data efficiently. Kinesis Data Analytics sets up the resources to run Flink applications and scales automatically to handle any volume of incoming data.
8. Kinesis Video Streams is a fully managed AWS service that we can use to ingest streaming video, audio, and other time-encoded data from various capturing devices using an infrastructure provisioned dynamically in the AWS Cloud.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/kinesis).

