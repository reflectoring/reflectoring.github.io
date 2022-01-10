---
title: "Managing Multiple JDK Installations With SDKMAN!"
categories: ["Java"]
date: 2020-11-07 00:00:00 +1100
modified: 2020-11-07 00:00:00 +1100
authors: [petros]
excerpt: "As Java developers, we often need to switch between different versions of the JDK for different projects. SDKMAN! makes this easy."
image: images/stock/0087-hammers-1200x628-branded.jpg
url: manage-jdks-with-sdkman
---

In the world of microservices and the 6-month release cycle of Java, we often have to change between Java versions multiple times a day.

**SDKMAN! is a tool that helps us to manage multiple JDK installations (and installations of other SDKs) and to configure each codebase to use a specific JDK version without the hassle of changing the `JAVA_HOME` environment variable.**

Make sure to also check out the [article about jEnv](/manage-jdks-with-jenv/) which is an alternative tool for the same purpose.

## Installing SDKMAN!

SDKMAN! is easy to install on any platform. The only thing you need is a terminal.

For installing and running SDKMAN! on Windows consider using [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10).

To install SDKMAN! follow the official [installation guide](https://sdkman.io/install).

## Installing a JDK From the SDKMAN! Repository

SDKMAN! offers multiple JDK vendors such as AdoptOpenJDK, Alibaba, Amazon, etc...

To see all the available JDKs simply run: `sdk list java`.

```text
================================================================================
Available Java Versions
================================================================================
 Vendor        | Use | Version      | Dist    | Status     | Identifier
--------------------------------------------------------------------------------
 AdoptOpenJDK  |     | 15.0.1.j9    | adpt    |            | 15.0.1.j9-adpt
               |     | 15.0.1.hs    | adpt    |            | 15.0.1.hs-adpt
               |     | 13.0.2.j9    | adpt    |            | 13.0.2.j9-adpt
               |     | 13.0.2.hs    | adpt    |            | 13.0.2.hs-adpt
               |     | 12.0.2.j9    | adpt    |            | 12.0.2.j9-adpt
               |     | 12.0.2.hs    | adpt    |            | 12.0.2.hs-adpt
               |     | 11.0.9.open  | adpt    |            | 11.0.9.open-adpt
               |     | 11.0.9.j9    | adpt    |            | 11.0.9.j9-adpt
               | >>> | 11.0.9.hs    | adpt    | installed  | 11.0.9.hs-adpt
               |     | 8.0.272.j9   | adpt    |            | 8.0.272.j9-adpt
               |     | 8.0.272.hs   | adpt    |            | 8.0.272.hs-adpt
 Alibaba       |     | 11.0.8       | albba   |            | 11.0.8-albba
               |     | 8u262        | albba   |            | 8u262-albba
 Amazon        |     | 15.0.1       | amzn    |            | 15.0.1-amzn
               |     | 11.0.9       | amzn    |            | 11.0.9-amzn
               |     | 8.0.272      | amzn    |            | 8.0.272-amzn
================================================================================
```

To install the JDK of our choice run: `sdk install java <candidate>`. For example: `sdk install java 15.0.1.j9-adpt`.

SDKMAN! will now download the desired JDK and will ask us if we want to set it as default.

```text
Downloading: java 15.0.1.j9-adpt

In progress...

Do you want java 15.0.1.j9-adpt to be set as default? (Y/n):
```

If we run `sdk list java` again now, we should now see the `installed` status in the version we have just installed:
```text
================================================================================
Available Java Versions
================================================================================
 Vendor        | Use | Version      | Dist    | Status     | Identifier
--------------------------------------------------------------------------------
 AdoptOpenJDK  | >>> | 15.0.1.j9    | adpt    |  installed | 15.0.1.j9-adpt
```

## Setting the Global JDK

With the 6-month version JDK cycle that is now being released, we might want to add a global (default) JDK for our computer that is sensible - for example an LTS version.

To do so run: `sdk default java <candidate>`. For example: `sdk default java 11.0.9.hs-adpt`.

```text
Default java version set to 11.0.9.hs-adpt
```

## Setting the Local JDK

Sometimes, we might want to try out the new Java version, but not set it globally.
To achieve that, **we can apply the new Java version only on the current shell session**.

This is easy with SDKMAN!. Simply run: `sdk use java <candidate>`. For example: `sdk use java 11.0.9.hs-adpt`

```text
Using java version 11.0.9.hs-adpt in this shell.
```

Running `java --version` verifies that we are indeed using the desired version:
```text
openjdk version "11.0.9" 2020-10-20
OpenJDK Runtime Environment AdoptOpenJDK (build 11.0.9+11)
OpenJDK 64-Bit Server VM AdoptOpenJDK (build 11.0.9+11, mixed mode)
```

## Setting Per Project JDK Usage

When we often change versions between different projects we might want to create an env file where we define the desired JDK version for the project.

Running the command `sdk env init`, we can generate a file named `.sdkmanrc`:

```text
# Enable auto-env through the sdkman_auto_env config
# Add key=value pairs of SDKs to use below
java=11.0.9.hs-adpt
```

For now, it defaults to our default java version. But let's say that we want to use JDK 15 for this project.
Just change the value of the java key to `15.0.0.hs-adpt`:

```text
java=15.0.0.hs-adpt
```

To apply this we just run the `sdk env` command in the folder with the `.sdkmanrc` file:

```text
Using java version 15.0.0.hs-adpt in this shell
``` 

If we want to automatically apply the `sdk env` command when navigating to the directory, 
we can change the SDKMAN! configuration which is located under `~/.sdkman/etc/config`. Changing the value of `sdkman_auto_env` key from `false` to `true` will do the trick.

## Upgrading to a Newer JDK

The `sdk upgrade` command makes it easy to upgrade to a newer version of a JDK. For example, we want to upgrade our JDK 11 Version from 11.0.8.hs-adpt to 11.0.9.hs-adpt SDK:

```text
Upgrade:
java (15.0.0.hs-adpt, 8.0.265.hs-adpt, 11.0.8.hs-adpt < 11.0.9.hs-adpt)

Upgrade candidate(s) and set latest version(s) as default? (Y/n): Y

Downloading: java 11.0.9.hs-adpt

In progress...

Installing: java 11.0.9.hs-adpt
Done installing!


Setting java 11.0.9.hs-adpt as default.
```

## More Than a JDK Manager

SDKMAN! is not just a JDK manager, it supports many more SDKs such as Maven, Gradle, Springboot, Micronaut, etc...

To see all available SDKs just run the command `sdk list`.

## Conclusion

SDKMAN! is a great tool to manage the versions of our favorite tools. To explore all the features of the SDKMAN! visit the [official site](https://sdkman.io/).

