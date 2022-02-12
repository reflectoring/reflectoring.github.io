---
title: "Managing Multiple JDK Installations With jEnv"
categories: ["Java"]
date: 2020-10-24T00:00:00
modified: 2020-10-24T20:00:00
authors: [tom]
description: "As Java developers, we often need to switch between different versions of the JDK for different projects. jEnv makes this easy."
image: images/stock/0085-numbers-1200x628-branded.jpg
url: manage-jdks-with-jenv
---

As developers, we're often working on different codebases at the same time. Especially in environments with microservices, we may be switching codebases multiple times a day.

In the days when a new Java version was published every couple of years, this was often not a problem, because most codebases needed the same Java version.

This changed when the Java release cadence changed to every 6 months. Today, if we're working on multiple codebases, chances are that each codebase is using a different Java version.

**jEnv is a tool that helps us to manage multiple JDK installations and configure each codebase to use a specific JDK version without having to change the `JAVA_HOME` environment variable.**

Make sure to check out the [article about SDKMAN!](/manage-jdks-with-sdkman/), an alternative tool for managing JDKs (and other tools).

## Installing jEnv

jEnv supports Linux and MacOS operating systems. If you're working with Windows, you'll need to install the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10) (or a bash emulator like [GitBash](https://gitforwindows.org/)) to use it.

Follow the installation instructions on the [jEnv homepage](https://www.jenv.be/) to install jEnv.

## Installing a JDK

If you're reading this article, chances are that you want to set up a new JDK for a codebase you're working on. Let's download a JDK from the [AdoptOpenJDK website](https://adoptopenjdk.net/releases.html).

Choose the version you want and download it. Extract the `.tar.gz` file wherever you want.

**The good thing about jEnv is that we don't need to install the JDK via a package manager like brew, yum, or apt**. We can just download a JDK and put it into a folder somewhere.

You can still use brew, yum, or apt to install your JDKs, you just need to find out the folder where your package manager has put the JDK afterward.   

## Adding a JDK to jEnv

To use the new JDK with jEnv, we need to tell jEnv where to find it. Let's check first which versions of the JDK jEnv already knows about with the command `jenv versions`:

```text
* system (set by /home/tom/.jenv/version)
  11
  11.0
  11.0.8
  13
  13.0
  13.0.2
  14
  14.0
  14.0.2
  openjdk64-11.0.8
  openjdk64-13.0.2
  openjdk64-14.0.2
```

In my case, I have the JDKs 11, 13, and 14 already installed. Each version is available under three different names.

Let's say we've downloaded JDK 15 and extracted it into the folder `~/software/java/jdk-15+36`.

Now, we add the new JDK to jEnv:

```text
jenv add /home/tom/software/java/jdk-15+36/
```

If we run `jenv versions` again, we get the following output:

```
  11
  11.0
  11.0.8
  13
  13.0
  13.0.2
  14
  14.0
  14.0.2
  15
  openjdk64-11.0.8
  openjdk64-13.0.2
  openjdk64-14.0.2
  openjdk64-15
```

The JDK 15 has been added under the names `15` and `openjdk64-15`.

## Local vs. Global JDK

jEnv supports the notion of a global JDK and multiple local JDKs. 

The global JDK is the JDK that will be used if we type `java` into the command line anywhere on our computer.

A local JDK is a JDK that is configured for a specific folder only. If we type `java` into the command line in this folder, it will not use the global JDK, but the local JDK instead.

We can use this to configure different JDKs for different projects (as long as they live in different folders). 
  
### Setting the Global JDK

First, we check the version of the global JDK:

```text
jenv global
```

The output in my case is:

```text
system
```

This means that the system-installed JDK will be used as a global JDK. The name `system` is not very helpful because it doesn't say which version it is. Let's change the global JDK to a more meaningful JDK with a version number:

```text
jenv global 11
```

This command has changed the globally used JDK version to 11. In my case, this was the same version as before, but if I type `jenv global`, I will now see which JDK version is my global version.
 
### Setting the Local JDK

Remember the JDK 15 we've downloaded? The reason we downloaded it is probably that we're working on a new project that needs JDK 15 to run.

Let's say this project lives in the folder `~/shiny-project`. Let's `cd` into this folder.

If I type `java -version` now, I get the following result:

```text
openjdk version "11.0.8" 2020-07-14
OpenJDK Runtime Environment (build 11.0.8+10-post-Ubuntu-0ubuntu118.04.1)
OpenJDK 64-Bit Server VM (build 11.0.8+10-post-Ubuntu-0ubuntu118.04.1, mixed mode, sharing)
```

That is because JDK 11 is my global JDK.

Let's change it to JDK 15 for this project:

```text
jenv local 15
```

Now, type `java -version` again, and the output will be:

```text
openjdk version "15" 2020-09-15
OpenJDK Runtime Environment AdoptOpenJDK (build 15+36)
OpenJDK 64-Bit Server VM AdoptOpenJDK (build 15+36, mixed mode, sharing)
```

Calling `java` in this folder will now always call Java 15 instead of Java 11.
 
How does this work? 

After using the `jenv local` command, you'll find a file called `.java-version` in the current folder. This file contains the version number of the local JDK. 

During installation, jEnv overrides the `java` command. Each time we call `java` now, jEnv looks for a `.java-version` file and if it finds one, starts the JDK version defined in that file. If it doesn't find a `.java-version` file, it starts the globally configured JDK instead.

## Working with Maven and Gradle

So, if we call `java` via the command line, it will pick up a locally configured JDK now. Great!

But tools like Maven or Gradle still use the system version of the JDK! 

Let's see what we can do about that.

### Configure jEnv to Work With Maven

Making Maven work with the local JDK defined by jEnv is easy. We just need to install the `maven` plugin:

`jenv enable-plugin maven`

If we run `mvn -version` in our `~/shiny-project` folder from above now, we'll get the following output:

```text
Maven home: .../apache-maven-3.6.3
Java version: 15, vendor: AdoptOpenJDK, runtime: /home/tom/software/java/jdk-15+36
Default locale: en_AU, platform encoding: UTF-8
OS name: "linux", version: "5.4.0-52-generic", arch: "amd64", family: "unix"
```

Maven is using the new JDK 15 now. Yay!

### Configure jEnv to Work With Gradle

**In my case, Gradle picked up jEnv's locally configured JDK automatically!**

If it doesn't work out of the box for you, you can install the gradle plugin analogously to the Maven plugin above:

```text
jenv enable-plugin gradle
```

If we run `gradle -version` in our `~/shiny-project` folder from above now, we'll get the following output:

```text
------------------------------------------------------------
Gradle 6.5
------------------------------------------------------------

Build time:   2020-06-02 20:46:21 UTC
Revision:     a27f41e4ae5e8a41ab9b19f8dd6d86d7b384dad4

Kotlin:       1.3.72
Groovy:       2.5.11
Ant:          Apache Ant(TM) version 1.10.7 compiled on September 1 2019
JVM:          15 (AdoptOpenJDK 15+36)
OS:           Linux 5.4.0-52-generic amd64
```

## Conclusion

jEnv is a handy tool to manage multiple JDK versions between different projects. With `jenv local <version>` we can configure a JDK version to be used in the current folder.