---
title: Clean Architecture Boundaries with Java Packages and ArchUnit
categories: [java]
date: 2020-02-03 05:00:00 +1100
modified: 2020-02-03 05:00:00 +1100
author: default
excerpt: ""
image:
  auto: 0058-motorway-junction
---

## Restricting Access with Package-Private Visibility 

* code example with an api and an internal package
* everything in the internal package is package-private

## Inverting Dependencies to Expose Package-Private Functionality

* create an interface in the API package, implement it in the internal package, inject it with DI

## The Shortcomings of Package-Private Visibility

* all this breaks apart when the internal package has sub-packages
* if your component needs sub-packages, classes in those sub-packages must be public so that the parent package can access them
* good only for small components with a few classes

## Enforcing Boundaries with ArchUnit

### Defining Architecture Rules
```java
@AnalyzeClasses(packages = {"io.blogtrack", "io.reflectoring"})
class ArchitectureTests {

  @ArchTest
  static final ArchRule noAccessingInternalClassesFromGoogleAuth = noClasses()
      .that().resideInAPackage("io.blogtrack..")
      .should().accessClassesThat().resideInAPackage("io.reflectoring.googleauth.internal..");

}
```

### Making Architecture Rules Refactoring-Safe
* check that the packages we're verifying actually exist

### Providing Architecture Rules To Your Clients
* is there a way to bundle architecture rules to your clients so they can check that they don't access internal packages?


## Conclusion
* If you're working with Spring Boot, have a look at Moduliths, which provides some tooling around an opinionated way of structuring packages.

