---
title: Run Your Maven Build Anywhere with the Maven Wrapper
categories: ["Java"]
date: 2020-07-29T05:00:00
modified: 2020-07-29T05:00:00
authors: [saajan]
excerpt: "A short article about Maven Wrapper - what problem it solves, how to set it up, and how it works"
image: images/stock/0076-airmail-1200x628-branded.jpg
url: maven-wrapper
---

In this article, we'll learn about the [Maven Wrapper](https://github.com/takari/maven-wrapper) - what problem it solves, how to set it up, and how it works.

## Why Do We Need the Maven Wrapper?

Years ago, I was on a team developing a desktop-based Java application. We wanted to share our artifact with a couple of business users in the field to get some feedback. It was unlikely they had Java installed. Asking them to download, install, and configure version 1.2 of Java (yes, this was that long ago!) to run our application would have been a hassle for them. 

Looking around trying to find how others had solved this problem, I came across this idea of "bundling the JRE". The idea was to include within the artifact itself the Java Runtime Environment that our application depended on. Then users don't need to have a particular version or even any version of Java pre-installed - a neat solution to a specific problem. 

Over the years I came across this idea in many places. Today when we containerize our application for cloud deployment, it's the same general idea: **encapsulate the dependent and its dependency into a single unit to hide some complexity**. 

What's this got to do with the Maven Wrapper? Replace "business users" with "other developers" and "Java" with "Maven" in my story and it's the same problem that the Maven Wrapper solves - we use it to encapsulate our source code and Maven build system. **This lets other developers build our code without having Maven pre-installed**.

The Maven Wrapper makes it easy to build our code on any machine, including CI/CD servers. **We don't have to worry about installing the right version of Maven on the CI servers anymore!**

## Setting Up the Maven Wrapper

From the project's root directory (where `pom.xml` is located), we run this Maven command:

```text
mvn -N io.takari:maven:0.7.7:wrapper
```

If we wanted to use a particular Maven version, we can specify it like this:

```text
mvn -N io.takari:maven:wrapper -Dmaven=3.6.3
```

This creates two files (`mvnw`, `mvnw.cmd`) and a hidden directory (`.mvn`). `mvnw` can be used in Unix-like environments and `mvnw.cmd` can be used in Windows. 

**Along with our code, we check in the two files and the `.mvn` directory and its contents into our source control system like Git**. Here's how other developers can now build the code:

```text
./mvnw clean install
```

Instead of the usual `mvn` command, they would use `mvnw`. 

Alternatively, we can set up the wrapper by copying over the `mvn`, `mvnw.cmd` files and `.mvn` directory from an existing project.

**Starting from 3.7.0 version of Maven, the Wrapper will be included as [a feature within core Maven itself](https://www.infoq.com/news/2020/04/maven-wrapper/)** making it even more convenient. 

## How Does the Maven Wrapper Work?

The `.mvn/wrapper` directory has a jar file `maven-wrapper.jar` that downloads the required version of Maven if it's not already present. It installs it in the `./m2/wrapper/dists` directory under the user's home directory.

Where does it download Maven from? This information is present in the `mvn/wrapper/maven-wrapper.properties` file:

```text
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.5.2/apache-maven-3.5.2-bin.zip
wrapperUrl=https://repo.maven.apache.org/maven2/io/takari/maven-wrapper/0.5.6/maven-wrapper-0.5.6.jar
```

## Conclusion

In this article, we learned what problem the Maven Wrapper solves, how to use it, and how it works.