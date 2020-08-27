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

Release 2.3 of Spring Boot provided support for building OCI images with a mechanism called buildpack. This article looks at containerizing Spring Boot application :
- by building Docker Image with Dockerfile,
- by building OCI image from source code with Cloud-Native buildpack 
- and optimizing the image by splitting parts of the jar into different layers using  layered tools. 


{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-logging-2" %}

## What is An OCI Image
The [Open Container Initiative (OCI)](https://opencontainers.org/about/overview/) defines industry standards for container image formats and runtimes to ensure that all container runtimes can run images produced by any build tool. The original image format of Docker has become the OCI Image Specification, and is supported by various open-source build tools. 

The 2.3 release of Spring Boot provides support for building OCI images. We will first build a Spring Boot image in the conventional way and then generate optimized images and compare the two

## Building Docker Images In Conventional Way
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
We run the generated image with dive to see the .

 ![dive screenshot](/assets/img/posts/springboot-docker-image/dive1.png)

```
docker images 
```

```shell
REPOSITORY          TAG                 SIZE
usersignup          v1                  249MB
adoptopenjdk        11-jre-hotspot      229MB
```

## Motivations And Techniques for Optimized Images

We have two main motivaitions: 
Performance : Large sized images result in long scheduling times in container orchestration systems, long build times in CI pipelines.

Security: Large sized images also have a greater surface area for vulnerabilities. 

A Docker Image is composed of a stack of layers each representing an instruction in our Dockerfile. Each layer is a delta of the changes over the underlying layer. When we pull the Docker Image from the registry, it is pulled by layers and cached in the host. 

When we inspect the fat jar, we can see that the application forms a very small part of the entire jar. This is the part which changes most frequently. The remaining part is composed of the Spring Framework dependencies. The optimization formula centers around isolating the application into a separate layer from the Spring Framework dependencies. The dependencies layer forming the bulk of the fat jar is downloaded only once and cached in the host system. Only the thin layer of application is pulled during application updates and container scheduling.



#### Creating OCI Image With Buildpack Using Spring Boot Plugins
[Buildpacks](https://buildpacks.io/) has been a generic term used by various PAAS offerings to build container image from source code. It was coined by Heroku and since been adopted by Cloud Foundry,Google App Engine, Gitlab, Knative.

Cloud-Native Buildpacks aims to bring a standardization across platforms by supporting the OCI(Open container initiative) image format and related capabilities like cross-repository blob mounting and image layer “rebasing” on Docker API v2 registries."

Spring Boot supports buildpack by providing Maven and Gradle plugins with the `build-image` goal to build the OCI image. The Paketo Spring Boot Buildpack is a Cloud Native Buildpack that contributes Spring Boot dependency information and slices an application into multiple layers.

Let us run the build-image command. This does not use any docker file.

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
#### From Spring Boot's Fat Jars to Layered Jars


Spring Boot uses fat jar as its default packaging format. Release 2.3 supports layering by extracting parts of this fat jar in separate layers. The distribution is based on the change cadence of the components. 
Content that is least likely to change should be added first, followed by layers that are more likely to change.


The default layers are:
| Library Name        | Contents           | 
| --------------------- |:-------------|
| `dependencies`     | any dependency whose version does not contain SNAPSHOT |
| `spring-boot-loader`      | jar loader classes      | 
| `snapshot-dependencies` | any dependency whose version contains SNAPSHOT     |
| `application` | application classes and resources      |

The layers are defined in a `layers.idx` file in the order that they should be added to the Docker Image. The order is important as it determines how likely previous layers are to be cached when part of the application changes. During pull, only the application layer is downloaded which is faster because of the reduced size


The layering feature is explicitly enabled with the Spring Boot Maven plugin:

```xml
  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
        <configuration>
          <layers>
            <enabled>true</enabled>
          </layers>
        </configuration> 
      </plugin>
    </plugins>
  </build>
```

#### Jarmode to Extract The Layers
We use a system property - `jarmode` set to `layertools` to launch the jar. It allows the bootstrap code to run something entirely different from your application. For example, something that extracts the layers.

Here’s how you can launch your jar with a layertools jar mode:
```shell
java -Djarmode=layertools -jar target/usersignup-0.0.1-SNAPSHOT.jar
```

```shell
Usage:
  java -Djarmode=layertools -jar usersignup-0.0.1-SNAPSHOT.jar

Available commands:
  list     List layers from the jar that can be extracted
  extract  Extracts layers from the jar for image creation
  help     Help about any command

```

```shell
java -Djarmode=layertools -jar target/usersignup-0.0.1-SNAPSHOT.jar list
```
```shell
dependencies
spring-boot-loader
snapshot-dependencies
application
```
#### Build The Image With Layers
These are called [multi-stage builds](https://docs.docker.com/develop/develop-images/multistage-build/#use-multi-stage-builds). Dockerfile using the builder pattern. Describe 2 stage build

Example of docker file
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


#### Customization with layers
We can further customize the layers by specifying by grouping the dependencies and layers in a xml file named `layers.idx`.

```
- "dependencies":
  - "BOOT-INF/lib/"
- "spring-boot-loader":
  - "org/"
- "snapshot-dependencies":
- "application":
  - "BOOT-INF/classes/"
  - "BOOT-INF/classpath.idx"
  - "BOOT-INF/layers.idx"
  - "META-INF/"

```

## Conclusion

In this article, we saw how to build small sized Docker images of Spring Boot Applications.. 

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-logging-2).