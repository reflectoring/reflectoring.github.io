---
authors: "saikat"
title: "Exposing Application Information Using Spring Boot"
categories: ["Spring Boot"]
date: 2022-03-10 00:00:00 +1100
excerpt: "A guide on how to expose useful application information using Spring Boot Actuator"
url: spring-boot-application-info
---

In a distributed, fast-paced environment, dev teams often want to find out **various application information such as at what time they deployed the app, what version of the app they deployed, what is the Git commit ID, etc.**

Spring Boot Actuator helps us monitor and manage the application. It exposes various endpoints that provide app health, metrics, and other relevant information.

In this article, we will find out how to use Spring Boot Actuator and the Maven/Gradle build plugins to add such information to our projects.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-app-info" %}}

## Enabling Spring Boot Actuator
Spring Boot Actuator is a sub-project of Spring Boot. In this section, we will quickly see how to bootstrap the sample project and enable the `info` endpoint. If you want to know more about Spring Boot Actuator, there is already a great [tutorial](https://reflectoring.io/exploring-a-spring-boot-app-with-actuator-and-jq/).

Let's quickly create a Spring Boot project using the [Spring Initializr](https://start.spring.io/). We will require the following dependencies:

| Dependency           | Purpose                                                      |
|----------------------|--------------------------------------------------------------|
| Spring Boot Actuator | To expose the application management endpoints e.g. `info`. |
| Spring Web           | To enable the web app behaviors.                             |

If it helps, here is a link to the pre-populated projects in [Maven](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.6.4&packaging=jar&jvmVersion=11&groupId=io.reflectoring&artifactId=demo&name=Demo%20Application&description=Demo%20project%20for%20Spring%20Boot%20Application%20Info&packageName=io.reflectoring.demo&dependencies=web,actuator) and [Gradle](https://start.spring.io/#!type=gradle-project&language=java&platformVersion=2.6.4&packaging=jar&jvmVersion=11&groupId=io.reflectoring&artifactId=demo&name=Demo%20Application&description=Demo%20project%20for%20Spring%20Boot%20Application%20Info&packageName=io.reflectoring.demo&dependencies=web,actuator).

After the project is built we will expose the built-in `info` endpoint over HTTP. 
**By default the `info` web endpoint is disabled**. We can simply enable it by adding the the `management.endpoints.web.exposure.include` property in the `application.properties` configuration:
```properties
management.endpoints.web.exposure.include=health,info
```

{{% warning title="Securing Endpoints" %}}
If you are exposing the endpoints publicly, please make sure to [secure](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator.endpoints.security) them as appropriate. We should not expose any sensitive information unknowingly.
{{% /warning %}}

Let's run the Spring Boot application and open the `http://localhost:8080/actuator/info` URL in a browser. Nothing useful will be visible yet as we still have to make a few config changes. In the next section, we will see how we can add informative build information in this response.

## Spring Boot Application Info
Spring collects useful application information from various [`InfoContributor`](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/actuate/info/InfoContributor.html) beans defined in the application context. Below is a summary of the default `InfoContributor` beans:

| ID      | Bean Name                    | Usage                                                                      |
|---------|------------------------------|----------------------------------------------------------------------------|
| `build` | `BuildInfoContributor`       | Exposes build information.                                                 |
| `env`   | `EnvironmentInfoContributor` | Exposes any property from the `Environment` whose name starts with `info.` |
| `git`   | `GitInfoContributor`         | Exposes Git related information.                                           |
| `java`  | `JavaInfoContributor`        | Exposes Java runtime information.                                          |

**By default, the `env` and `java` contributors are disabled.**

First, we will enable the `java` property by adding the following key-value pair in `application.properties`:
```properties
management.info.java.enabled=true
```

Let's rerun the application. Now, we'll open the actuator `info` endpoint in a browser. Then an output similar to below should appear:
```json
{
  "java": {
    "vendor": "Eclipse Adoptium",
    "version": "11.0.14",
    "runtime": {
      "name": "OpenJDK Runtime Environment",
      "version": "11.0.14+9"
    },
    "jvm": {
      "name": "OpenJDK 64-Bit Server VM",
      "vendor": "Eclipse Adoptium",
      "version": "11.0.14+9"
    }
  }
}
```
You are likely to see different values based on the installed Java version.

Now, it's time to display environment variables. Spring picks up any environment variable with a property name starting with `info`. To see this in action, let's add the following properties in the `application.properties` file:
```properties
management.info.env.enabled=true
info.app.website=reflectoring.io
```

Upon restarting the app, we will start seeing the following information added to the actuator `info` endpoint:
```json
{
  "app": {
    "website": "reflectoring.io"
  }
}
```
Feel free to add as many info variables you want :) 

In the following sections, we will see how to add Git and application build specific information.

## Adding Build Info
Adding useful [build information](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.build.generate-info) helps to quickly identify the build artifact name, version, time created, etc. It could come in handy to check if the team deployed the relevant version of the app. Spring Boot allows easy ways to add this using Maven or Gradle build plugins.

### Using Maven Plugin
The Spring Boot Maven Plugin comes bundled with plenty of useful features such as creating executable jar or war archives, running the application, etc. It also provides a way to add application build info. 

Spring Boot Actuator will show build details if a valid `META-INF/build-info.properties` file is present. **Spring Boot Maven plugin has a `build-info` goal to create this file.** 

This plugin will be by default present in the `pom.xml` if you bootstrapped the project using Spring Initializr. We just have to add the `build-info` goal for execution as shown below:
```xml
<plugin>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-maven-plugin</artifactId>
  <version>2.6.4</version>
  <executions>
    <execution>
      <goals>
        <goal>build-info</goal>
      </goals>
    </execution>
  </executions>
</plugin>
```

If we run the command `./mvnw spring-boot:run` (for Linux/macOS) or `mvnw.bat spring-boot:run` (for Windows) now, the required file would be created in `target/classes/META-INF/build-info.properties`. 

**The file content will be similar to this:**
```properties
build.artifact=spring-boot-build-info
build.group=io.reflectoring
build.name=spring-boot-build-info
build.time=2022-03-06T05\:53\:45.236Z
build.version=0.0.1-SNAPSHOT
```

**We can also add custom properties to this list** using the `additionalProperties` attribute:
```xml
<execution>
  <goals>
    <goal>build-info</goal>
  </goals>
  <configuration>
    <additionalProperties>
      <custom.key1>value1</custom.key1>
      <custom.key2>value2</custom.key2>
    </additionalProperties>
  </configuration>
</execution>
```
If we run the app now and open the `http://localhost:8080/actuator/info` endpoint in the browser, we will see a response similar to below:
```json
{
  "build": {
    "custom": {
      "key2": "value2",
      "key1": "value1"
    },
    "version": "0.0.1-SNAPSHOT",
    "artifact": "spring-boot-build-info",
    "name": "spring-boot-build-info",
    "time": "2022-03-06T06:34:30.306Z",
    "group": "io.reflectoring"
  }
}
```

**If you want to exclude any of the properties** that too is possible using the `excludeInfoProperties`. Let's see how to exclude the `artifact` property:
```xml
<configuration>
  <excludeInfoProperties>
    <infoProperty>artifact</infoProperty>
  </excludeInfoProperties>
</configuration>
```
 Please refer to the official Spring Boot [documentation](https://docs.spring.io/spring-boot/docs/current/maven-plugin/reference/htmlsingle/#goals-build-info) to know more.

Now, it's time to see how we can achieve the same output using the Spring Boot Gradle plugin.

### Using Gradle Plugin
The easiest way to add the build info is using the plugin DSL. In the `build.gradle` file, we need to add the following block:
```gradle
springBoot {
  buildInfo()
}
```

If we sync the Gradle project now, we can see a new task `bootBuildInfo` is available for use. Running the task will generate similar `build/resources/main/META-INF/build-info.properties` file with build info (derived from the project). Using the DSL we can customize existing values or add new properties:
```gradle
springBoot {
  buildInfo {
    properties {
      name = 'Sample App'
      additional = [
        'customKey': 'customValue'
      ]
    }
  }
}
```

Time to run the app using `./gradlew bootRun` (for macOS/Linux) or `gradlew.bat bootRun` (for Windows) command. Once the app is running, we can open the `http://localhost:8080/actuator/info` endpoint in the browser and find the response as:
```json
{
  "build": {
    "customKey": "customValue",
    "version": "0.0.1-SNAPSHOT",
    "artifact": "spring-boot-build-info",
    "name": "Sample App",
    "time": "2022-03-06T09:11:53.380Z",
    "group": "io.reflectoring"
  }
}
```

We can exclude any default properties from the generated build information by setting its value to `null`. For example:
```gradle
properties {
  group = null
}
```

To know more about the plugin, you can refer to the official Spring Boot [documentation](https://docs.spring.io/spring-boot/docs/current/gradle-plugin/reference/htmlsingle/#integrating-with-actuator)

## Adding Git Info
[Git information](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.build.generate-git-info) comes handy to quickly identify if the relevant code is present in production or if the distributed deployments are in sync with expectations. Spring Boot can easily include Git properties in the Actuator endpoint using the Maven and Gradle plugins. 

Using this plugin we can generate a `git.properties` file. The presence of this file will auto-configure the [`GitProperties`](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/info/GitProperties.html) bean to be used by the [`GitInfoContributor`](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/actuate/info/GitInfoContributor.html) bean to collate relevant information.

**By default the following information will be exposed:**
- `git.branch`
- `git.commit.id`
- `git.commit.time`

The following management application properties control the Git related information:
| Application Property                | Purpose                                                        |
|-------------------------------------|----------------------------------------------------------------|
| `management.info.git.enabled=false` | Disables the Git information entirely from the `info` endpoint |
| `management.info.git.mode=full`     | Displays all the properties from the `git.properties` file     |

### Using Maven Plugin
The [Maven Git Commit ID plugin](https://github.com/git-commit-id/git-commit-id-maven-plugin) is managed via the `spring-boot-starter-parent` pom. To use this we have to edit the `pom.xml` as below:
```xml
<plugin>
  <groupId>pl.project13.maven</groupId>
  <artifactId>git-commit-id-plugin</artifactId>
</plugin>
```
If we run the project and open the `/actuator/info` endpoint in the browser, it will present us with the Git related information:
```json
{
  "git": {
    "branch": "main",
    "commit": {
      "id": "5404bdf",
      "time": "2022-03-06T10:34:16Z"
    }
  }
}
```
We can also inspect the generated file under `target/classes/git.properties`. Here is how it looks like for me:
```properties
#Generated by Git-Commit-Id-Plugin
git.branch=main
git.build.host=mylaptop
git.build.time=2022-03-06T23\:22\:16+0530
git.build.user.email=user@email.com
git.build.user.name=user
git.build.version=0.0.1-SNAPSHOT
git.closest.tag.commit.count=
git.closest.tag.name=
git.commit.author.time=2022-03-06T22\:46\:56+0530
git.commit.committer.time=2022-03-06T22\:46\:56+0530
git.commit.id=e9fa20d4914367c1632e3a0eb8ca4d2f32b31a89
git.commit.id.abbrev=e9fa20d
git.commit.id.describe=e9fa20d-dirty
git.commit.id.describe-short=e9fa20d-dirty
git.commit.message.full=Update config
git.commit.message.short=Update config
git.commit.time=2022-03-06T22\:46\:56+0530
git.commit.user.email=saikat@email.com
git.commit.user.name=Saikat
git.dirty=true
git.local.branch.ahead=NO_REMOTE
git.local.branch.behind=NO_REMOTE
git.remote.origin.url=Unknown
git.tags=
git.total.commit.count=2
```

This plugin comes with lot of [configuration](https://github.com/git-commit-id/git-commit-id-maven-plugin/blob/master/docs/using-the-plugin.md) options. For example, to include/exclude specific properties we can add a `configuration` section like this:
```xml
<configuration>
  <excludeProperties>
    <excludeProperty>time</excludeProperty>
  </excludeProperties>
  <includeOnlyProperties>
    <property>git.commit.id</property>
  </includeOnlyProperties>
</configuration>
```

It will generate an output like below:
```json
{
  "git": {
    "commit": {
      "id": "5404bdf"
    }
  }
}
```

Let's now find out what options are available for Gradle users.

### Using Gradle Plugin
In the `build.gradle` we will add the [`gradle-git-properties`](https://github.com/n0mer/gradle-git-properties) plugin:

```gradle
plugins {
  id 'com.gorylenko.gradle-git-properties' version '2.4.0'
}
```
Let's build the Gradle project now. We can see `build/resources/main/git.properties` file is created. And, the actuator `info` endpoint will display the same data:
```json
{
  "git": {
    "branch": "main",
    "commit": {
      "id": "5404bdf",
      "time": "2022-03-06T10:34:16Z"
    }
  }
}
```

This plugin too provides multiple ways to configure the output using the attribute `gitProperties`. For example, let's limit the keys to be present by adding below:
```gradle
gitProperties {
  keys = ['git.commit.id']
}
```

Rerunning the app will now show limited Git info:
```json
{
  "git": {
    "commit": {
      "id": "5404bdf"
    }
  }
}
```

## Conclusion
In this article, we learned how to use Spring Actuator to expose relevant information about our application. We found out how the build, environment, Git, and Java information could be added to the Actuator `info` endpoint. We also looked at how all this information can be configured and controlled by the Maven/Gradle build plugins.

You can play around with a complete application illustrating these ideas using the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-app-info).
