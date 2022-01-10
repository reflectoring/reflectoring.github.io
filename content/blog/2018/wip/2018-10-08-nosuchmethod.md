---
title: "3 Steps to Fix NoSuchMethodErrors and NoSuchMethodExceptions"
categories: ["Java"]
modified: 2018-10-08
excerpt: "A tutorial on how identify the root cause of NoSuchMethodErrors and NoSuchMethodExceptions."
image:
  auto: 0011-exception
---



A [*NoSuchMethodError*](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/NoSuchMethodError.html) occurs
when we're calling a method that does not exist at runtime. 

The method **must have existed at compile time**, since otherwise the compiler would have refused
to compile the class calling that method with an `error: cannot find symbol`.


## Common Causes and Solutions
Let's discuss some common situations that cause a *NoSuchMethodError*.

### Breaking Change in a 3rd Party Library 

The potential root cause for a `NoSuchMethodError` is that **one of the libraries we use in our project
had a breaking change from one version to the next**. This breaking change removed a method from the
code of that library.

However, since our own code calling the method in question has been successfully compiled, 
**the classpath must be different during compile time and runtime**. 

At compile time we use the correct version of the library while at runtime we somehow included a different version 
that does not provide the method in question. This indicates a problem in our build process.

### Overriding a 3rd Party Library Version

Imagine we're using a 3rd party library (A) as described above, but we're not calling it directly. Rather, **it's a 
dependency of another 3rd party library** (B) that we use (i.e. A is a transitive dependency to our project).

In this case, **which is the most common cause for NoSuchMethodErrors in my experience**, we probably have a version conflict in our build system. There probably is a third library (C)
which also has a dependency on B, but on a different version. 

Build systems like Gradle and Maven usually
resolve a version conflict like this by simply choosing one of the versions, opening the door for a *NoSuchMethodError*.  

### Breaking Change in Our Own Module

The same can happen in multi-module builds, though this is less common. We have removed a certain method from the code
in one module (A) and during runtime the code of another module (B) fails with a *NoSuchMethodError*.

This indicates an error in our build pipeline since module B obviously has not been compiled against the new version
of module A.

## Fixing a NoSuchMethodError

There are a lot of different flavors of `NoSuchMethodError`s, but **they all boil down to the fact that
the compile time classpath differs from the runtime classpath**.

The following steps will help to pinpoint the problem:

### Step 1: Find Out Where the Class Comes From

First, we need to find out where the class containing the method in question comes from. We find this information
in the error message of the `NoSuchMethodError`:

```text
Exception in thread "main" java.lang.NoSuchMethodError: 
  io.reflectoring.nosuchmethod.Service.sayHello(Ljava/lang/String;)Ljava/lang/String;
```

Now, we can search the web or within the IDE to find out which JAR file contains this class. In the case
above, we can see that it's the `Service` class from our own codebase and not a class from another library. 

If we have trouble finding the JAR file of the class, we can add the Java option `-verbose:class` when running
our application. **This will cause Java to print out all classes and the JARs they have been loaded from**:

```text
[Loaded io.reflectoring.nosuchmethod.Service from file:
  /C:/daten/workspaces/code-examples2/patterns/build/libs/java-1.0.jar]

``` 

### Step 2: Find Out Who Calls the Class

Next, we want find out where the method is being called. This information is available in the first element of
the stack trace:

```text
Exception in thread "main" java.lang.NoSuchMethodError: 
  io.reflectoring.nosuchmethod.Service.sayHello(Ljava/lang/String;)Ljava/lang/String;
  at io.reflectoring.nosuchmethod.ProvokeNoSuchMethodError.main(ProvokeNoSuchMethodError.java:7)
``` 

Here, the class `ProvokeNoSuchMethodError` tries to call a method that does not exist at runtime. We should now
find out which library this file belongs to. 

### Step 3: Check the Versions

Now that we know where the `NoSuchMethodError` is provoked and what method is missing, we can act.

**We should now list all of our project dependencies**. 

In Gradle, we can call:

```text
./gradlew dependencies > dependencies.txt
```

If we're using Maven, a similiar result can be achieved with: 

``` 
mvn dependency:list > dependencies.txt`
```

In this file, **we can search for the libraries that contain the class with the missing method and the class
that tries to call this method**.

Usually we'll find an output like this somewhere:

```text
\--- org.springframework.retry:spring-retry:1.2.2.RELEASE
|     \--- org.springframework:spring-core:4.3.13.RELEASE -> 5.0.8.RELEASE
``` 

The above means that the `spring-retry` library depends on `spring-core` in version 4.3.13, but some other
library also depends on `spring-core` in version 5.0.8 and overrules the dependency version. 

We can now search our `dependencies.txt` file for `5.0.8.RELEASE` to find out which library introduces the 
dependency to this version. 

**Finally, we need to decide which of the two versions we actually need to satisfy both dependencies**. Usually, this is
the newer version since most frameworks are backwards compatible to some point. However, it can be the other way
around or we might even not be able to resolve the conflict at all.
  
## And What About NoSuchMethodException?

`NoSuchMethodException` is related to `NoSuchMethodError`, but occurs in another context. While a `NoSuchMethodError`
occurs when some JAR file has a different version at runtime that it had at compile time, a `NoSuchMethodException`
occurs during reflection when we try to access a method that does not exist.

This can be easily provoked with the following code:

```java
String.class.getMethod("foobar");
```

Here, we're trying to access the method `foobar()` of class `String`, which does not exist.

**The steps to find the cause of the exception and to fix it are pretty much the same as those for the `NoSuchMethodError`**.

## Conclusion

This article went through some common causes of `NoSuchMethodError`s and `NoSuchMethodException`s and walked through some steps
that can help to fix them. 

We need to find out where the error is caused and who causes it before we can compare versions and try to fix the problem.

 
