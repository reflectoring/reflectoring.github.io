---
title: "Run Your Gradle Build Anywhere with the Gradle Wrapper"
categories: ["Java"]
date: 2022-07-04 00:00:00 +1100 
modified: 2022-07-04 00:00:00 +1100
authors: [saikat]
description: "A short article about the Gradle Wrapper - what problem it solves, how to set it up, and how it works"
image: images/stock/0076-airmail-1200x628-branded.jpg
url: gradle-wrapper
---

[Gradle](https://gradle.org/) is a build automation tool that supports multi-language development. It is helpful to build, test, publish, and deploy software on any platform. In this article, we will learn about the [Gradle Wrapper](https://docs.gradle.org/current/userguide/gradle_wrapper.html) - what it is, when to use it, how to use it, etc.

## What Is the Gradle Wrapper?

The Gradle Wrapper is basically a script. It will **ensure that the required version of Gradle is downloaded and used for building the project**. This is the recommended approach to executing Gradle builds.

## When To Use the Gradle Wrapper?

The Wrapper is an **effective way to make the build environment independent**. No matter where the end-user is building the project, it will always download the appropriate version of Gradle and use it accordingly. 

As a result, developers can get up and running with a Gradle project quickly and reliably **without following manual installation processes**. The standardized build process makes it easy to provision a new Gradle version to different execution environments.

# How the Gradle Wrapper Works

Once the user builds the project using Gradle Wrapper, then the following steps will happen:
- The Wrapper script will download the required Gradle distribution from the server if necessary.
- Then, it will store and unpack the distribution under the Gradle user home location (default location is `.gradle/wrapper/dists` under the user home).
- We are all set to start building the project using the Wrapper script.

{{% info title="Please Note" %}}
The Wrapper will not download the Gradle distribution if it is already cached in the system.
{{% /info %}}

## How To Use the Gradle Wrapper

There are mainly three scenarios for Gradle Wrapper usage. Let's learn more about these.

### Setting Up the Gradle Wrapper for a New Project

First, we need to install Gradle to invoke the Wrapper task. You can refer to the official [installation guide](https://docs.gradle.org/current/userguide/installation.html). Once the installation is complete, we are good to go for the next step. 

**In this tutorial, we will use Gradle version 7.4.2.**

Now, let's open the terminal, navigate to the required folder/directory and run the command `gradle init`. 

After starting the `init` command, we choose the project type, build script DSL, and project name. Let's go ahead with the default options that will look something like this:

```text
$ gradle init

Select type of project to generate:
  1: basic
  2: application
  3: library
  4: Gradle plugin
Enter selection (default: basic) [1..4]  

Select build script DSL:
  1: Groovy
  2: Kotlin
Enter selection (default: Groovy) [1..2] 

Generate build using new APIs and behavior (some features may change in the next minor release)? (default: no) [yes, no] 
Project name (default: gradle-wrapper-demo): 

> Task :init
Get more help with your project: Learn more about Gradle by exploring our samples at https://docs.gradle.org/7.4.2/samples

BUILD SUCCESSFUL in 3m 25s
2 actionable tasks: 2 executed
```
If we now check the file structure in this directory, we will see:
```text
.
├── build.gradle
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
└── settings.gradle
```
{{% warning title="Please Note" %}}
We need to commit these files into version control so that the Wrapper script becomes accessible to other developers in the team.
{{% /warning %}}

**We will explore the file contents in the next section.**

We just tried the first way to create the Wrapper. Let's move on to the next.

### Setting Up the Gradle Wrapper for an Existing Project

You may also want to create the Wrapper for your existing Gradle projects. There is a `wrapper` task available for this use case. The only pre-requisite is that you already have a `settings.gradle` file in your project directory. 

Now, when we run the command `gradle wrapper` from that directory, it will create the Wrapper specific files:

```text
$ gradle wrapper

BUILD SUCCESSFUL in 697ms
1 actionable task: 1 executed
```

If you need help on the Wrapper task, then the `gradle help --task wrapper` command is all you need.

### Executing a Gradle Build Using the Wrapper

Once we have a project bootstrapped with the Wrapper files, running the Gradle build is straightforward.

- For Linux/macOS users, the `gradlew` script can be run from the terminal.
- For Windows users, the `gradlew.bat` script can be run from the terminal/command prompt.

Here is a sample output of the script when run from Linux/macOS:

```text
$ ./gradlew

> Task :help

Welcome to Gradle 7.4.2.

To run a build, run gradlew <task> ...

To see a list of available tasks, run gradlew tasks

To see more detail about a task, run gradlew help --task <task>

To see a list of command-line options, run gradlew --help

For more detail on using Gradle, see https://docs.gradle.org/7.4.2/userguide/command_line_interface.html

For troubleshooting, visit https://help.gradle.org

BUILD SUCCESSFUL in 980ms
1 actionable task: 1 executed
```

As you can see, by default, when we don't pass the task name in the command, the default `help` task is run. 

To build the project, we can use the `build` task, i.e., `./gradlew build` or `gradlew.bat build`. Using the Wrapper script, you can now execute any Gradle command without having to install Gradle separately.

{{% info title="Please Note" %}}
We will use `./gradlew` in the following examples. Please use `gradlew.bat` instead of `./gradlew` if you are on a Windows system.
{{% /info %}}

## What Does the Gradle Wrapper Contain?

In a typical Wrapper setup, you will encounter the following files:

|File Name                    | Usage                                                                                                                                                        |
|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`gradle-wrapper.jar`         | The Wrapper JAR file containing code to download the Gradle distribution.                                                                                    |
|`gradle-wrapper.properties`  | The properties file configuring the Wrapper runtime behavior. Most importantly, this is where you can control the version of Gradle that is used for builds. |
|`gradlew`                    | A shell script for executing the build.                                                                                                                      |
|`gradlew.bat`                | A Windows batch script for running the build.                                                                                                                |

Normally the `gradle-wrapper.properties` contains the following data:
```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-7.4.2-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

## How to Update the Gradle Version?

You might have to update the Gradle version in the future. We can achieve this by running the command `./gradlew wrapper --gradle-version <required_gradle_version>` from a project containing Wrapper scripts. 

Then, we can check if the version is duly updated by running the `./gradlew --version` command.

You can also change the version number in the `distributionUrl` property in the `gradle-wrapper.properties` file. The next time `./gradlew` is called, it will download the new version of Gradle.

## How to Use a Different Gradle URL?

Sometimes we may have to download the Gradle distribution from a different source than the one mentioned in the default configuration. In such cases, we can use the `--gradle-distribution-url` flag while generating the Wrapper, e.g., `./gradlew wrapper --gradle-distribution-url <custom_gradle_download_url>`.

## Conclusion

In this article, we learned what problem the Gradle Wrapper solves, how to use it, and how it works. 
You can read a similar article on this blog on [Maven Wrapper](https://reflectoring.io/maven-wrapper/).
