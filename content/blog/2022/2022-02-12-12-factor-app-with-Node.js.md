---
authors: [pratikdas]
title: "12 Factor app with Node.js"
categories: ["node"]
date: 2022-01-20T00:00:00
excerpt: "Amazon Kinesis is a fully managed service for collecting and processing streaming data in real-time. Examples of streaming data are data collected from web site click-streams, marketing and financial information, social media feeds, iot sensors, and monitoring and operational logs. In this article, we will introduce Amazon Kinesis, understand its core concepts of the creating data streams, sending, and receiving data from streams and deriving analytical insights using different service variants: Kinesis Data Stream, firehose, Analytics, and Video Streams."
image: images/stock/0115-2021-1200x628-branded.jpg
url: getting-started-with-aws-kinesis
---



The twelve-factor methodology is not specific to Node.js and much of these tips are already general enough for any application.


In this article, we will walk through the twelve-factor methodology with specific examples of how we would implement them in Node.js. Although application that demonstrates the principles is not implemented yet, but we can link to specific line numbers to see a working app, with working code implementing best practices.

{{% github "https://github.com/thombergs/code-examples/tree/master/aws/kinesis" %}}

## What is 12-Factor


## I. Codebase - Single Codebase Under Version Control for All Environments

One codebase tracked in revision control, many deploys.

This helps to establish clear ownership of an application with a single individual or group. The application has a single codebase that evolves with new features, defect fixes, and upgrades to existing features. The application owners are accountable for building different versions and deploying to multiple environments like test, stage, and production during the lifetime of the application.

This principle advocates having a single codebase that can be built and deployed to multiple environments. Each environment has specific resource configurations like database, configuration data, and API URLs. To achieve this, we need to separate all the environment dependencies into a form that can be specified during the build and run phases of the application.

This helps to achieve the first two goals of the Twelve-Factor App - maximizing portability across environments using declarative formats.

Following this principle, we’ll have a single Git repository containing the source code of our Spring Boot application. This code is compiled and packaged and then deployed to one or more environments.

We configure the application for a specific environment at runtime using Spring profiles and environment-specific properties.

We’re breaking this rule if we have to change the source code to configure it for a specific environment or if we have separate repositories for different environments like development and production.


How we do it

This code is tracked on github. Git flow can be used to manage branches for releases.


## II. Dependencies

Explicitly declare and isolate dependencies.

How we do it

package.json declare and lock dependencies to specific versions. npm installs modules to a local node_modules dir so each application's dependencies are isolated from the rest of the system.

## Config

Store config in the environment.

How we do it

Configuration is stored in enviornment variables and supplied through the manifest.yml.

Secrets are also stored in environment variables but supplied through a Cloud Foundry User Provided Service. When setting up the app, they are created with a one-time command cf create-user-provided-service tfn-secrets -p '{"SECRET_KEY": "your-secret-key"}'.

Connection configuration to Cloud Foundry Services, like our database, are provided through the VCAP_SERVICES environment variable.

## Backing services

Treat backing services as attached resources.

How we do it

We connect to the database via a connection url provided by the VCAP_SERVICES environment variable. If we needed to setup a new database, we would simply create a new database with cf create-service and bind the database to our application. After restaging with cf restage, the VCAP_SERVICES environment will be updated with the new connection url and our app would be talking to the new database.

We use a library which handles the database connection. This library abstracts away the differences between different SQL-based databases. This makes it easier to migrate from one database provider to another.

We expect to be using a database hosted on Cloud Foundry, but using this strategy we could store the connection url in a separate environment variable which could point to a database outside of the Cloud Foundry environment and this strategy would work fine.

Of course, how you handle migrating your data from one database to another can be complicated and is out of scope with regard to the twelve factor app.

## Build, release, run

Strictly separate build and run stages.

How we do it

package.json allows to configure "scripts" so that we can codify various tasks. npm run build is used to build this application and produces minified javascript and css files to be served as static assets.

npm start is used to start the application. The nodejs_buildpack runs this command by default to start your application.

## Processes

Execute the app as one or more stateless processes.

How we do it

We listen to SIGTERM and SIGINT to know it's time to shutdown. The platform is constantly being updated even if our application is not. Machines die, security patches cause reboots. Server resources become consumed. Any of these things could cause the platform to kill your application. Don't worry though, Cloud Foundry makes sure to start a new process on the new freshly patched host before killing your old process.

By listening to process signals, we know when to stop serving requests, flush database connections, and close any open resources.

## Port binding

Export services via port binding.

How we do it

Cloud Foundry assigns your application instance a port on the host machine and exposes it through the PORT environment variable.

## Logs

Treat logs as event streams.

How we do it

We use winston as our logger. We use logging levels to provide feedback about how the application is working. Some of this feedback could warrant a bug fix.

Warnings are conditions that are unexpected and might hint that a bug exists in the code.

## Admin processes

Run admin/management tasks as one-off processes.

How we do it

Any one-off tasks are added as npm scripts. The meat of these tasks is added to the tasks directory. Some take inputs which can be specified when running the task npm run script -- arguments. Note that by default, we avoid writing interactive scripts. If configuration is complex, the task can accept a configuration file or read a configuration from stdin.

## Conclusion

Here is a list of the major points for a quick reference:


You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/sqs).

