---
authors: [pratikdas]
title: "Structured Logging with AWS CloudWatch"
categories: ["AWS"]
date: 2022-07-24 00:00:00 +1100
excerpt: "AWS Step Functions is a serverless orchestration service by which we can combine AWS Lambda functions and other AWS services to build complex business applications. We can author the orchestration logic in a declarative style using a JSON-based format called the Amazon States Language(ASL). AWS Step functions also provides a Workflow Studio where we can define and run our workflows. In this article, we will introduce the concepts of AWS Step Functions and understand how it works with the help of some examples."
image: images/stock/0117-queue-1200x628-branded.jpg
url: getting-started-with-aws-step-functions
---

The primary purpose of logging in applications is to debug and trace one or more root causes of an unexpected behavior.  Approaches to logging takes myriad forms from developers putting ad-hoc print statements in their code to using sophisticated libraries available in different programming languages. Irrespective of which approach is taken a log without any pre-defined structure is rarely useful to find the root cause of problems. This is where we need to use Structured Logging.

AWS CloudWatch is the observability service with logging as one of its key capabilities.

In this article, we will understand structured logging in AWS CloudWatch as a way to scale logging efforts and provide a consistent way to consume logs.

## CloudWatch Logging Concepts: Log Streams, Log Groups, Insights


## What is Structured Logging
Structured logging is a methodology to log information in a consistent format that allows logs to be treated as data rather than text. Structured logs are often expressed in JSON which allows developers the ability to efficiently store, retrieve and analyze logs.

Structured logging is where instead of just logging a line of text, you log a structured object, most often as JSON. This will allow you to search the logs more easily.

The easiest way to use structured logging is to log in JSON.
You can add whatever information is necessary or useful for you. We’ll see how to search structured logs below. First, let’s look at how CloudWatch logging is actually organized.

Some of the main benefits that enable faster debugging include…

Better search – By leveraging the JSON format we can create queries on fields without having to rely on brittle regex patterns of raw text
Better integration – By using a consistent JSON format, applications can ingest the data easily for downstream tasks such as dashboards or analysis.
Better readability – By leveraging a consistent format, consumers of logs such as system administrators can parse data much more effectively than reading raw text files.
In this post, I’ll walk through an example in Python highlighting the differences between unstructured and structured logging on a simple AWS Lambda Function.

## Pitfalls of Unstructured Logging

## CloudWatch Log Groups and Log Streams

## CloudWatch Insights

## Structured logging example

In order to treat logs as data we must create a structure that enables us to express logs as data. There are packages such as Python JSON Logger that provide a mechanism to transform logs into JSON, but you can also create a class to encapsulate your data.

## Conclusion

Here is a list of the major points for a quick reference:
