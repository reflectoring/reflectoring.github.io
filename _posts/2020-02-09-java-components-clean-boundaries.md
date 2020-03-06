---
title: Clean Architecture Boundaries with Spring Boot and ArchUnit
categories: [spring-boot]
date: 2020-02-03 05:00:00 +1100
modified: 2020-02-03 05:00:00 +1100
author: default
excerpt: ""
image:
  auto: 0065-boundary
---

## Restricting Access with Package-Private Visibility 

* code example with an api and an internal package
* everything in the internal package is package-private

## The Shortcomings of Package-Private Visibility

* all this breaks apart when the internal package has sub-packages
* if your component needs sub-packages, classes in those sub-packages must be public so that the parent package can access them
* good only for small components with a few classes

## An Approach to Clean Boundaries

### Splitting API and Internal Resources

### Inverting Dependencies to Expose Package-Private Functionality
* create an interface in the API package, implement it in the internal package, inject it with DI

### Wiring It Together with Spring Boot

## Enforcing Boundaries with ArchUnit

### Marking Internal Packages

### Verifying That Internal Packages are Indeed Internal

### Making the Architecture Rules Refactoring-Safe
* check that the packages we're verifying actually exist

## Conclusion
* If you're working with Spring Boot, have a look at Moduliths, which provides some tooling around an opinionated way of structuring packages.

