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

## The Problem: Tangled Code

## The Shortcoming of Package Private Visibility
* only works for single packages 
* if your component needs sub-packages, classes in those sub-packages must be public so that the parent package can access them
* good only for small components with a few classes

## Clean Boundaries with Packages and ArchUnit

### Separate API Code From Internal Code
* a clear package `api` and `internal`
* the problem of package private still remains, though, but can be solved with ArchUnit checks

### Verify That No One Accesses Internal Code
```java
@AnalyzeClasses(packages = {"io.blogtrack", "io.reflectoring"})
class ArchitectureTests {

  @ArchTest
  static final ArchRule noAccessingInternalClassesFromGoogleAuth = noClasses()
      .that().resideInAPackage("io.blogtrack..")
      .should().accessClassesThat().resideInAPackage("io.reflectoring.googleauth.internal..");

}
```

### Verify That API Code Does Not Depend On Internal Code
```java
@AnalyzeClasses(packages = {"io.blogtrack", "io.reflectoring"})
class ArchitectureTests {

  @ArchTest
  static final ArchRule apiDoesNotDependOnInternal = noClasses()
      .that().resideInAPackage("io.reflectoring.googleauth.api..")
      .should().accessClassesThat().resideInAPackage("io.reflectoring.googleauth.internal..");

}
```

## Conclusion
* If you're working with Spring Boot, have a look at Moduliths, which provides some tooling around an opinionated way of structuring packages.

