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

Finally, if you want to create and publish your own Docker image, you need to have Docker installed.

## Preparing a Docker Image

Let's start with creating and publishing a Docker image which we can deploy. If you want to skip this part, you can just use the docker image `reflectoring/aws-hello-world:latest`, which is available [here](https://hub.docker.com/r/reflectoring/aws-hello-world).

### Creating the Docker Image

For this tutorial, we'll create a simple Docker image from a Hello World application I created. You can pull it [from GitHub](https://github.com/thombergs/code-examples/tree/master/aws/aws-hello-world) to build the Docker image yourself. 

The example application is a simple Hello World application that prints "Hello World", when you open the "/hello" endpoint in a browser.

To build a Docker image, the application has a `Dockerfile`:

```docker
FROM openjdk:8-jdk-alpine
ARG JAR_FILE=build/libs/*.jar
COPY ${JAR_FILE} app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
EXPOSE 8080
```

This is a Docker file wrapping our Spring Boot application. It starts with an OpenJDK on top of a Linux alpine distribution and takes the path to a JAR file as an argument. It then copies this JAR file into `app.jar` within its own filesystem and runs `java -jar app.jar` to start the application. Finally, we're telling Docker that the application exposes port 8080, which is for documentation purposes more than for real effect.

Next, we have to build the Java application with `./gradlew clean build`. This will create the file `build/libs/aws-hello-world-0.0.1-SNAPSHOT.jar`, which Docker pick up by default, because we specified `build/libs/*.jar` as the default value for the `JAR_FILE` argument in our Docker file.

Now, we can build the docker image. From the folder containing the `Dockerfile`, we run:

```
docker build -t reflectoring/aws-hello-world:latest .
```

To check if everything worked out, we can run 

```
docker images | grep aws-hello-world
```

which will display all Docker images available locally that contain `aws-hello-world` in their name.

### Testing the Docker Image

Let's check if the Docker image we just built actually works. We start the image up with `docker run`:

```
docker run -p 8081:8080 reflectoring/aws-hello-world:latest
```

With `-p` we define that whatever is available on port 8080 within the container, Docker will make available via the port 8081 on the host computer. In other words, requests to port 8081 on the host computer (the host port) will be fowarded to port 8080 within the container (the container port).

Without specifying these ports, Docker won't expose a port on which we can access the application.

When the docker container has successfully started up, we should see a log output similar to this:

```
... Tomcat started on port(s) 8080 (http) with context path ''
... Started AwsHelloWorldApplication in 3.222 seconds ...
```

Once we see this output, we can type `http://localhost:8081/hello` into a browser and should be rewarded with a "Hello World" message.

### Publishing the Docker Image 

To deploy a Docker image to AWS, it needs to be available in a Docker registry, so that AWS can download it from there. So, let's publish our image.

We can choose to publish our Docker image in any Docker registry we want, even our own, as long as AWS can reach it from the internet. We'll publish it to [Docker Hub](https://hub.docker.com/), which is Docker's official registry.

For business critical applications that you we don't want to share with the world, we should have our own private Docker registry, but for the purposes of this tutorial, we'll just share the docker image publicly.

First, we need to login with docker:

```
docker login registry-1.docker.io
```

We're prompted to enter the credentials to our Docker Hub account.

We can leave out the `registry-1.docker.io` part because Docker will use this as a default. If we want to publish to a different registry, we need to replace this address.

Next, we push the Docker image to the registry:

```
docker push reflectoring/aws-hello-world:latest
```

<div class="notice success">
  <h4>Requested Access to the Resource is Denied?</h4>
  <p>
  If you get errors like <code>denied: requested access to the resource is denied</code> when pushing to Docker Hub this means that you don't have permission to the account you want to publish the image under. Make sure that the account name (the name before the "/") is correct and that it's either your account name or the name of an organization that you have access to.
  </p>
</div>

## AWS Concepts

So, we've got a Docker image ready to be deployed to AWS. Before we start working with AWS, let's learn some high-level AWS vocabulary that we'll need.

### ECS - Elastic Container Service

ECS is the "entry point" service that allows us to run Docker containers on AWS infrastructure. Under the hood, it uses a bunch of other AWS services to get things done.  

### Task

A task is AWS domain language for a wrapper around one or more containers. A task instance is what AWS considers an instance of our application. 

### Service

A service wraps a task and provides access security rules and potentially load balancing rules across multiple task instances.

### Cluster

A cluster provides a network and scaling rules for the tasks of a service.

## Deploying a Docker Image Using the Management Console

We'll configure a task, service, and cluster using the "Get Started" wizard provided in the web-based management console. **This wizard is very convenient to use, but it's very limited in it's feature set**. We don't have all configuration options available.

Also, by definition, **deploying containers via the web-based wizard is a manual process and cannot be automated**. In real-world scenarios, we want to automate deployments and will need to use the AWS CLI.  

If you want to follow along, open the [ECS start page](https://console.aws.amazon.com/ecs/home) in your browser and click on the "Get started" button. It should take no more than a couple minutes to get a container up and running!

### Configuring the Task

First, we configure the task, which wraps our Docker image:

![Configuring a Task](/assets/img/posts/aws-deploy-docker-image-via-web-console/task.jpg)

We can select a pre-defined docker image, or choose our own. We want to use the Docker image from above, so we'll click on the "Configure" button in the "custom" box to open the "Edit container" form:

![Configuring a Container](/assets/img/posts/aws-deploy-docker-image-via-web-console/container.jpg)

We fill the form as follows:

* **Container name:** An arbitrary name for the container.
* **Image:** The URL to the Docker image. If you have published your image in a Docker registry different from Docker Hub, check with that registry what the URL to your image looks like.
* **Private repository authentication:** if the Docker image is private, we need to provide authentication credentials here. We'll skip this, as our image is public.
* **Memory Limits:** We'll leave the default (i.e. no memory limits). This should definitely be thought out and set in a production deployment, though!
* **Port mappings:** Here we can define the *container port*, i.e. the port that our application exposes. The Spring Boot application in the `aws-hello-world` Docker image exposes port 8080, so we have to put this port here. The container port doubles as *host port* and I have found no way of changing that using the web wizard. This means that we have to add `:8080` when we want to access our application later.

In the `Advanced container configuration` section we could configure more, but we'll leave everything else in the default configuration for now. 

Let's save everything and hit the "Next" button to move on.

### Configuring the Service


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



