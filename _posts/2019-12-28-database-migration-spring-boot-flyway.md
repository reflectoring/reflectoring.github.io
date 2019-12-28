---
title: One-Stop Guide to Database Migration with Spring Boot and Flyway
categories: [spring-boot]
date: ${date}
author: Petromir Dzhunev
excerpt: "A comprehensive guide for database migrations using Spring Boot and its support of
 Flyway."
image:
  auto: ${image}
tags: ["data migration", "spring-boot", "flyway"]
---

Spring Boot siplifies database migrations by providing integration with one of the most widely used tool [Flyway](https://flywaydb.org/). This guide will present various options of using Flyway as part of Spring Boot application. We'll also show in practice the main advantages of having [Database Refactoring Done Right](https://reflectoring.io/tool-based-database-refactoring/). **Put some words about CI here**

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/data-migration/flyway" %}

## Why We Need Database Migrations/ Importance of Database Migration

## Setting up Flyway

### As a Spring Boot configuration

https://docs.spring.io/spring-boot/docs/current/reference/html/appendix-application-properties.html#data-migration-properties

### Using Maven/Gradle plugin

### Tips

* swithing mindset to incremental changes
* how to fix broken checksums
* lack of support of undo operations in community version

### Handling Database migration with CI builds

More and more companies are trying to automate the process of delivering database changes to different environments. 

### Conclusion

few word about benefits after integrating Flyway, like automating the process and confidence when
 handling database changes. Also mentioning Liquibase as a popular alternative.
