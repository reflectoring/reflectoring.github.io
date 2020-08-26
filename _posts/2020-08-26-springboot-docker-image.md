---
title: "Optimized Docker Images Of Spring Boot Applications"
categories: [spring-boot]
date: 2020-08-26 06:00:00 +1100
modified: 2020-08-26 06:00:00 +1100
author: pratikdas
excerpt: "Smaller sized Docker images are important for performance and security "
image:
  auto: 0074-stack
---
 
Off late containerization has emerged as a standard way of building an application with all software and operating system dependencies and then shipping that across diifferent environments. The first step in containerizing an application is packaging our application inside a container image. The container runtime unpacks the image and runs the application inside it. Docker happens to be the most commonly used container implementations so all subsequent reference to container will mean Docker. 

It is very easy to create Docker images of Spring Boot applications by using the conventional method of using a base JRE image and applying customizations over that to package the fat uber jar. But the resulting Docker image is unnecessarily large. 

Release 2.3 of Spring Boot provided support for building OCI images. This article looks at different ways of reducing the size of the Docker image containing a Spring Boot application.


{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-logging-2" %}

## The OCI Image
The Open Container Initiative (OCI) defines industry standards for container image formats and runtimes to ensure that all container runtimes can run images produced by any build tool. The original image format of Docker has become the OCI Image Specification, and is supported by various open-source build tools. 

The 2.3 release of Spring Boot provides support for building optimized OCI images. We will first build a Spring Boot image in the conventional way and then generate optimized images and compare the two

## Building Docker Images Following Conventional Way
We create our Spring Boot application from [start.spring.io](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.3.3.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik.users&artifactId=usersignup&name=usersignup&description=Demo%20project%20for%20Spring%20Boot%20Container&packageName=io.pratik.users&dependencies=web,actuator,lombok) with dependencies for web, lombok and actuator. We also add a rest controller to expose an API with GET method. Next, we  containerize this application by adding a Dockerfile with  

```
FROM adoptopenjdk:11-jre-hotspot
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} application.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/application.jar"]
```
This contains a base image over which we copy our jar file.
We first build the application with maven.
Create Docker image with docker build.

```shell
docker build . -t usersignup:v1
```
We run the generated image with dive.
// Add dive screenshot
 ![dive screenshot](/assets/img/posts/springboot-docker-image/dive1.png)

```
docker images 
```

```shell
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
usersignup          v1                  5a4302371234        20 minutes ago      249MB
adoptopenjdk        11-jre-hotspot      2eb37d403188        6 days ago          229MB
```


Run with docker run
```shell
docker run
``` 
Check the size at runtime...

### Motivations for Smaller Sized Images
Performance : 
CI builds, container scanning, container scheduling times.

Security:
Large size, greater surface area for vulnerabilities. Pack only the things we need at runtime.

### Techniques for Building Smaller Sized Images
Look inside the docker image using `dive`

#### BuildPack
Source to image using sensible defaults
We run the build-image command. This does not use any docker file.

```shell
mvn spring-boot:build-image
```
This will produce the output:
```shell
[INFO] --- spring-boot-maven-plugin:2.3.3.RELEASE:build-image (default-cli) @ usersignup ---
[INFO] Building image 'docker.io/library/usersignup:0.0.1-SNAPSHOT'
[INFO] 
[INFO]  > Pulling builder image 'gcr.io/paketo-buildpacks/builder:base-platform-api-0.3' 0%
.
.
.
[INFO]     [creator]     Adding label 'org.springframework.boot.version'
[INFO]     [creator]     *** Images (07f6d3a25551):
[INFO]     [creator]           docker.io/library/usersignup:0.0.1-SNAPSHOT
[INFO] 
[INFO] Successfully built image 'docker.io/library/usersignup:0.0.1-SNAPSHOT'
```

Next we check the size of image by running the command :
```shell
docker images -a
```
Outout:
```shell
REPOSITORY                         SIZE
paketobuildpacks/run                84.3MB
gcr.io/paketo-buildpacks/builder   648MB
usersignup                         281MB
```
#### Builder Pattern
Describe 2 stage build

Example of docker file

Build image

Check size of image

Check size of container

#### Customization with layers



## Conclusion

In this article, we saw how to build small sized Docker images of Spring Boot Applications.. 

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-logging-2).