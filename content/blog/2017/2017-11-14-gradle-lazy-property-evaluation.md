---
title: "Lazy Evaluation of Gradle Properties"
categories: ["Java"]
date: 2017-11-14
authors: [matthias]
excerpt: "A guide on lazy evaluation in Gradle scripts and when it makes sense to use it."
image: images/stock/0040-hammock-1200x628-branded.jpg
url: gradle-lazy-property-evaluation
---



Writing Gradle build tasks is often easy and straight forward, but as soon as you start to write more generic tasks for multiple modules or projects it can get a little tricky.

## Why Lazy Evaluation?

Recently I wrote a task to configure a docker build for different Java modules. Some of them are packaged as JAR and some as WAR artifacts.
Now this configuration was not that complicated, but I really hate duplicating stuff. So I wondered how to write a generic configuration and let each module override some parts of this config? That's where lazy property evaluation comes in very handy.

## Lazy Evaluation of String Properties

Let's check this simple project configuration, which logs the the evaluated properties to the console using the build-in [Gradle Logger](https://docs.gradle.org/current/userguide/logging.html).
```groovy
allprojects {
    version = '1.0.0'

    ext {
        artifactExt = "jar"
        dockerArtifact = "${name}-${version}.${artifactExt}"
    }
}

subprojects {
    task printArtifactName {
        doLast {
            logger.lifecycle "Artifact  ${dockerArtifact}"
        }
    }
}

project('A') {
    // using default configuration
}

project('B') {
    artifactExt = 'war'
}

```

The above code should do exactly what we want:
```text
./gradlew printArtifactName
:A:printArtifactName
Artifact  A-1.0.0.jar
:B:printArtifactName
Artifact  B-1.0.0.jar
```

Wait, didn't we override the default `artifactExt` property within module B? Gradle seems to ignore the overridden property!

Let's modify the example task to get a deeper insight:

```groovy
task printArtifactName {
    doLast {
        logger.lifecycle dockerArtifact
        logger.lifecycle artifactExt
    }
}
```

```text
./gradlew printArtifactName
:A:printArtifactName
Artifact  A-1.0.0.jar
Extension jar
:B:printArtifactName
Artifact  B-1.0.0.jar
Extension war
```

Looks like the property `artifactExt` gets overridden correctly. The problem is caused by the evaluation time of the property `dockerArtifact`. Within Gradles configuration phase `dockerArtifact` gets evaluated directly, but at that time `artifactExt` is defined with it's default value `jar`. Later when configuring project B, `dockerArtifact` is already set and overriding `artifactExt` does not affect the value of `dockerArtifact` anymore. So we have to tell Gradle to evaluate the property `artifactExt` at execution time.

We can do that by turning the property into a `Closure` like that:
```groovy
dockerArtifact = "${name}-${version}.${-> artifactExt}"
```

Now Gradle evaluates `name` and `version` properties eagerly but `artifactExt` gets evaluated lazily **each time** `dockerArtifact` is used.
Running the modified code again gives us the expected result:
```text
./gradlew printArtifactName
:A:printArtifactName
Artifact  A-1.0.0.jar
Extension jar
:B:printArtifactName
Artifact  B-1.0.0.war
Extension war
```

This simple hack can come in quite handy, but can only be used within Groovy Strings, as it uses Groovys build-in [Lazy String Evaluation](http://docs.groovy-lang.org/latest/html/documentation/#_special_case_of_interpolating_closure_expressions). Note that [Groovy Strings](http://docs.groovy-lang.org/latest/html/documentation/#_double_quoted_string) are those Strings wrapped in double quotes, whereas regular [Java Strings](http://docs.groovy-lang.org/latest/html/documentation/#_single_quoted_string) are wrapped in single quotes.

## Lazy Evaluation of non-String Properties

Using Closures you can also use lazy evaluation for other property types like shown below.

Let's define another property called `maxMemory` as a Closure. 

```groovy
allprojects {
    version = '1.0.0'

    ext {
        artifactExt = "jar"
        dockerArtifact = "${name}-${version}.${-> artifactExt}"

        minMemory = 128
        // use a Closure for maxMemory calculation
        maxMemory = { minMemory * 2 }
    }
}

subprojects {
    task printArtifactName {
        doLast {
            logger.lifecycle "Artifact  ${dockerArtifact}"
            logger.lifecycle "Extension ${artifactExt}"
            logger.lifecycle "Min Mem   ${minMemory}"
            // running maxMemory Closure by invoking it
            logger.lifecycle "Max Mem   ${maxMemory()}"
        }
    }
}

project('B') {
    artifactExt = 'war'
    minMemory = 512
}
```

As you can see the real difference to lazy String evaluation is how the closure gets invoked at execution time. We invoke the Closure by adding parenthesis to the property name.

Running the modified code again gives us the expected result:

```text
./gradlew printArtifactName
:A:printArtifactName
Artifact  A-1.0.0.jar
Extension jar
Min Mem   128
Max Mem   256
:B:printArtifactName
Artifact  B-1.0.0.war
Extension war
Min Mem   512
Max Mem   1024
```

As you can see lazy evaluation of properties is really simple and allows more complex configurations without the need of duplicating code.
