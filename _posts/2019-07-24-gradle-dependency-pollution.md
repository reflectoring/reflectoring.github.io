---
title: Pollution-free Dependency Management with Gradle
categories: [tools]
modified: 2017-07-24
author: tom
tags: [gradle, maven, scope, configuration]
comments: true
ads: true
excerpt: "An explanation and comparison of Maven scopes and Gradle configurations to declare dependencies in a build file."
sidebar:
  toc: true
---

{% include sidebar_right %}

## What's Dependency Pollution?

![Transitive dependencies are implicit dependencies.](/assets/images/posts/gradle-dependency-pollution/implicit-dependency.jpg)

## Accidental Dependencies

* we don't know what the consumer has access to
* consumer C may accidentally use a class from  library A and will be bound to this library
* if library A is external, we just lost control over changes in C
* changes in A cause changes in C
 
![Transitive dependencies are implicit dependencies.](/assets/images/posts/gradle-dependency-pollution/explicit-dependency-error.jpg) 

## Unnecessary Re-Compiles

* each dependency is a reason to change
* single responsibility problem violated: more reasons to change
* if a dependency changes, we have to re-compile the consumer
* longer build times

## Gradle's Solution

* use the `implementation` configuration
* only expose libraries that are really necessary via `api` configuration

![Transitive dependencies are implicit dependencies.](/assets/images/posts/gradle-dependency-pollution/explicit-dependency.jpg)

## Migrating from Gradle's deprecated `compile` Configuration

* replace `compile` with `implementation` and see how it goes
* if you run into compile errors, you have used a transient dependency
* in this case, replace with `api` or introduce dependency explicitly in the consumer

## Conclusion

* scope your dependencies as narrow as possible
* See [this twitter discussion](https://twitter.com/CedricChampeau/status/1148145289519357953) for context.
