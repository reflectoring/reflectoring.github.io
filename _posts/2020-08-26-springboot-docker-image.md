---
title: "Optimized Docker Images Of Spring Boot Applications"
categories: [spring-boot]
date: 2020-08-26 06:00:00 +1100
modified: 2020-08-26 06:00:00 +1100
author: pratikdas
excerpt: "Optimized Docker images are important for performance and security "
image:
  auto: 0074-stack
---
 
Off late containerization has emerged as a standard way of packaging an application with all software and operating system dependencies and then shipping that across different environments. The first step in containerizing is packaging our application inside a container image. The container runtime unpacks the image and runs the application inside it. Docker happens to be the most commonly used container implementations so all subsequent reference to a container in this article will mean Docker. 

It is very easy to create Docker images of Spring Boot applications. We build an executable jar and then copy that over a base JRE image after applying customizations over that to package the [fat uber jar](https://docs.spring.io/spring-boot/docs/current/reference/html/appendix-executable-jar-format.html#executable-jar-jar-file-structure). But the resulting Docker image is unnecessarily large. 

Release 2.3 of Spring Boot aims to provide tools to help manage the containerization process at build time and runtime. This article looks at the steps required for containerizing a Spring Boot application :
- by building Docker Image with Dockerfile,
- by building an OCI image from source code with Cloud-Native Buildpack 
- and optimizing the image at runtime by splitting parts of the jar into different layers using layered tools. 


{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-docker" %}

## What is An OCI Image
The [Open Container Initiative (OCI)](https://opencontainers.org/about/overview/) defines industry standards for container image formats and runtimes to ensure that all container engines can run images produced by any build tool. The original image format of Docker has become the OCI Image Specification and is supported by various open-source build tools. 

The 2.3 release of Spring Boot provides support for building OCI images. We will first conventionally build a Spring Boot image by specifying instructions in a Docker file. and then generate optimized images and compare the two

## Building Docker Images In Conventional Way
We create our Spring Boot application from [start.spring.io](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.3.3.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik.users&artifactId=usersignup&name=usersignup&description=Demo%20project%20for%20Spring%20Boot%20Container&packageName=io.pratik.users&dependencies=web,actuator,lombok) with dependencies for `web`, `lombok`, and `actuator`. We also add a rest controller to expose an API with the `GET` method. 

Next, we  containerize this application by adding a Dockerfile :

```
FROM adoptopenjdk:11-jre-hotspot
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} application.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/application.jar"]
```
This contains a base image over which we copy our jar file.
We first build the application with Maven or Gradle. We are using Maven here:
```shell
mvn clean package
```
This creates an executable jar of the application. Then we put this executable jar in a Docker image by running the `docker build` command:

```shell
docker build . -t usersignup:v1
```
We can see our image listed with the command:
```
docker images 
```
The output of the above command includes our image `usersignup` along with the base image `adoptopenjdk` specified in our Docker file.
```shell
REPOSITORY          TAG                 SIZE
usersignup          v1                  249MB
adoptopenjdk        11-jre-hotspot      229MB
```
Let us see the stack of layers inside the image. We are using the [dive tool](https://github.com/wagoodman/dive) to view the layers. Here is part of the output from Dive :

 ![dive screenshot](/assets/img/posts/springboot-docker-image/dive1.png)

As we can see the application layer forms the bulk of the image size. We will aim to reduce the size of this layer in the following sections as part of our optimization.

#### Building OCI Image (Docker Compatible) With Buildpack Using Spring Boot Plugins

[Buildpacks](https://buildpacks.io/) is a generic term used by various Platform as a Service(PAAS) offerings to build a container image from source code. It was started by Heroku in 2011 and since been adopted by Cloud Foundry, Google App Engine, Gitlab, Knative, and some others. 

One main advantage of using Buildpack for building images is that **changes to the image configuration can be managed in a centralized place (the builder) and propagated to all applications which are using the builder.**

Buildpacks were tightly coupled to the platform. **Cloud-Native Buildpacks bring standardization across platforms by supporting the OCI(Open container initiative) image format which ensures the image can be run by a Docker engine.**

The plugin creates OCI images from Spring Boot executable jar using a Buildpack. Images are built using the `bootBuildImage task(Gradle)` or `spring-boot:build-image goal(Maven)` and a local Docker installation. 

We can customize the name of the image required for pushing to the Docker registry by specifying the name in the `image tag`:
```xml
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
        <configuration>
          <image>
            <name>docker.io/pratikdas/${project.artifactId}:v1</name>
          </image>
        </configuration>
      </plugin>
``` 

Let us use Maven to run the `build-image goal` to build the application and create the container image. We are not using any docker file now.

```shell
mvn spring-boot:build-image
```
Running this will produce an output similar to:
```shell
[INFO] --- spring-boot-maven-plugin:2.3.3.RELEASE:build-image (default-cli) @ usersignup ---
[INFO] Building image 'docker.io/pratikdas/usersignup:v1'
[INFO] 
[INFO]  > Pulling builder image 'gcr.io/paketo-buildpacks/builder:base-platform-api-0.3' 0%
.
.
[INFO]     [creator]     Adding label 'org.springframework.boot.version'
[INFO]     [creator]     *** Images (c311fe74ec73):
[INFO]     [creator]           docker.io/pratikdas/usersignup:v1
[INFO] 
[INFO] Successfully built image 'docker.io/pratikdas/usersignup:v1'
```
From the output, we can see the `paketo Cloud-Native buildpack` being used to build a runnable OCI image. As we did earlier, we can see the image listed as a Docker image by running the command:

```shell
docker images 
```
Output:
```shell
REPOSITORY                             SIZE
paketobuildpacks/run                  84.3MB
gcr.io/paketo-buildpacks/builder      652MB
pratikdas/usersignup                  257MB
```
## Motivations And Techniques for Optimized Images

We have two main motivations for optimization: 
Performance: Large-sized images result in long scheduling times in container orchestration systems, long build times in CI pipelines.

Security: Large-sized images also have a greater surface area for vulnerabilities. 

**A Docker Image is composed of a stack of layers each representing an instruction in our Dockerfile.** Each layer is a delta of the changes over the underlying layer. When we pull the Docker Image from the registry, it is pulled by layers and cached in the host. 

Spring Boot uses `fat jar` as its default packaging format. When we inspect the `fat jar`, we can see that the application forms a very small part of the entire jar. This is the part that changes most frequently. The remaining part is composed of the Spring Framework dependencies. 

The optimization formula centers around isolating the application into a separate layer from the Spring Framework dependencies. The dependencies layer forming the bulk of the fat jar is downloaded only once and cached in the host system. Only the thin layer of application is pulled during application updates and container scheduling.

#### From Spring Boot's Fat Jars to Layered Jars

Spring Boot uses fat jar as its default packaging format. If we inspect the jar produced after running maven build, we get this output:

```
META-INF/
META-INF/MANIFEST.MF
org/
.
org/springframework/boot/loader/
.
BOOT-INF/
BOOT-INF/classes/
.
BOOT-INF/lib/
BOOT-INF/classpath.idx
```
Release 2.3 supports layering by extracting parts of this fat jar in separate layers.

The layering feature is explicitly enabled with the Spring Boot Maven plugin:

```xml
<plugin>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-maven-plugin</artifactId>
  <configuration>
    <layers>
      <enabled>true</enabled>
    </layers>
  </configuration> 
</plugin>
```
The contents of the resulting jar is shown: 
```
META-INF/
.
BOOT-INF/lib/
.
BOOT-INF/lib/spring-boot-jarmode-layertools-2.3.3.RELEASE.jar
BOOT-INF/classpath.idx
BOOT-INF/layers.idx
```
The output shows an additional jar named `spring-boot-jarmode-layertools` and a `layer.idx` file. The layering feature is provided by `spring-boot-jarmode-layertools` as explained in the next section.


#### Using Jarmode to Extract The Layers

In this step, we will extract dependencies into separate layers. We will use a system property - `jarmode` set to a value - `layertools` to launch our executable jar created in the previous step. This allows the bootstrap code to redirect the request to the spring-boot-jarmode-layertools jar instead of the application.

Let us launch our jar with a `layertools jar mode` system property:
```shell
java -Djarmode=layertools -jar target/usersignup-0.0.1-SNAPSHOT.jar
```
Running this command produces the output containing available command options:
```shell
Usage:
  java -Djarmode=layertools -jar usersignup-0.0.1-SNAPSHOT.jar

Available commands:
  list     List layers from the jar that can be extracted
  extract  Extracts layers from the jar for image creation
  help     Help about any command

```
The output shows the commands `list`, `extract` and `help` with `help` being the default. Let us run the command with `list` option :
```shell
java -Djarmode=layertools -jar target/usersignup-0.0.1-SNAPSHOT.jar list
```
```shell
dependencies
spring-boot-loader
snapshot-dependencies
application
```
This shows the list of dependencies that can be added as layers. 

The default layers are:

| Library Name        | Contents           | 
| :------------------------ |:-----------------|
| `dependencies`     | any dependency whose version does not contain SNAPSHOT |
| `spring-boot-loader`      | jar loader classes      | 
| `snapshot-dependencies` | any dependency whose version contains SNAPSHOT     |
| `application` | application classes and resources      |

The layers are defined in a `layers.idx` file in the order that they should be added to the Docker Image. The order is important as it determines how likely previous layers are to be cached when part of the application changes. During the pull, only the application layer is downloaded which is faster because of the reduced size

#### Building The Image With Layers Of Dependencies

We proceed to build the final image in two stages using a method called [multi-stage build](https://docs.docker.com/develop/develop-images/multistage-build/#use-multi-stage-builds). In the first stage, we extract the dependencies and in the second stage, we copy the extracted dependencies to the final image.

We modify our docker file for multi-stage build:
```
# the first stage of our build will extract the layers
FROM adoptopenjdk:14-jre-hotspot as builder
WORKDIR application
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} application.jar
RUN java -Djarmode=layertools -jar application.jar extract

# the second stage of our build will copy the extracted layers
FROM adoptopenjdk:14-jre-hotspot
WORKDIR application
COPY --from=builder application/dependencies/ ./
COPY --from=builder application/spring-boot-loader/ ./
COPY --from=builder application/snapshot-dependencies/ ./
COPY --from=builder application/application/ ./
ENTRYPOINT ["java", "org.springframework.boot.loader.JarLauncher"]

```
We save our multi-stage build configuration in a separate file named `Dockerfile2`.
Next we build our image by running the command :
```shell
docker build -f Dockerfile2 -t userssignup:v1 .

```

```
Sending build context to Docker daemon  20.41MB
Step 1/12 : FROM adoptopenjdk:14-jre-hotspot as builder
14-jre-hotspot: Pulling from library/adoptopenjdk
.
.
Successfully built a9ebf6970841
Successfully tagged userssignup:v1
```
Let us now check the size of the layers once more with Dive.
```
dive usersignup:v1
```
Here is the output from our Dive command.

![dive screenshot](/assets/img/posts/springboot-docker-image/dive2.png)

As we can see the layer containing the application is just 11 KB now.
#### Customization with layers

We can further reduce the applicatiion layer size by customize the layers by extracting any custom dependencies in a separate layer instead of packaging with the application in a `yml` like file named `layers.idx`:

```layers.idx
- "dependencies":
  - "BOOT-INF/lib/"
- "spring-boot-loader":
  - "org/"
- "snapshot-dependencies":
- "custom-dependencies":
  - "io/myorg/"
- "application":
  - "BOOT-INF/classes/"
  - "BOOT-INF/classpath.idx"
  - "BOOT-INF/layers.idx"
  - "META-INF/"

```
In this `layers.idx` file we have added a custom dependency with name io.myorg containing organization dependencies.

## Conclusion

In this article, we looked at using Cloud-Native Buildpacks to create the container image directly from source code. This is an alternative to building the container image using the conventional way, by first building the fat executable jar and then package it in a container image by specifying the instructions in a Dockerfile. 

We also looked at optimizing our container at runtime by extracting the dependencies in separate layers that get cached in the host and the thin layer of application is downloaded during scheduling in container runtime engines. We built the final image in two stages using a multi-stage build. The first stage extracts the dependencies and the second stage copies the extracted dependencies to the final image. 

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-docker).