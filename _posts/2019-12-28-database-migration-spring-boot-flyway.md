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

Spring Boot siplifies database migrations by providing integration with one of the most widely used tool [Flyway](https://flywaydb.org/). This guide will present various options of using Flyway as part of Spring Boot application, as well as running it within our CI builds. We'll also cover main advantages of having [Database Refactoring Done Right](https://reflectoring.io/tool-based-database-refactoring/).

```
{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/data-migration/flyway" %}
```

## Why We Need Database Migrations

I've worked in a project where all database changes were deployed manually. More people joined and naturally they start asking:

1. What state is the database in on this environment?
2. Has specific script already been applied or not?
3. Has hot-fix in production been deployed in other environments afterwards?
4. How a new database instance can be set up to specific or latest state?

Ansering these questions required one of us to check for a change which was part of the sql script, e.g. adding a column, a stored procedure etc. If we multiply all these checks to number of environments plus the work required to align the state, then we get decent amount of time lost.

Database migrations allow you to:

1. Create a database from scratch.
2. Have a single source of truth for database version.
3. Have reproducible state of the database in local and remote environments.
3. Automate database changes deployment, which helps minimizing human errors.

### Why Flyway

Flyway facilitates the above while providing:

1. Well stuctured and easy to read documentation.
2. An option to integrate with existing database.
3. Support for almost all known databases.
4. Wide variety of running and configuration options.

## Setting up Flyway

Among all configuration options, we will focus on those exposed by [Spring Boot](https://docs.spring.io/spring-boot/docs/current/reference/html/appendix-application-properties.html#data-migration-properties), but first let's add the following dependency to our build file (Gradle notation):

```
implementation 'org.flywaydb:flyway-core'
```

Spring Boot is quite flexible in terms of properties definitions, but let's see how a tipical Flyway configuration looks like in `application.yml` file.

```
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/test

  flyway:
    url: "${spring.datasource.url}"
    user: test
    password: test
    schemas: public
```

**TODO: Should we use H2 for the sake of the example**

## Running Flyway

**TODO: Mentions all possible options for running Flyway and describe one suitable for local development and point out one recomended for CI builds.**

## Tips

**TODO: Ask if it's a good idea to put each of these in a green box**

* swithing mindset to incremental changes
* how to fix broken checksums
* lack of support of undo operations in community version

## Database migration as part of CI build

> "If it can be automated, it should be automated" - Unknown

The above quote is also applicable to delivering of database changes to different environments (test, stage, prod etc.).

We need to make sure that our local database changes will work on all other servers. Most common approach is to use CI build to emulate real deployement.

**TODO: Describe one option of using Flyway as part of CI build (CI server agnostic)**

**TODO: Should we mention [Flyway Jekins Plugin](https://plugins.jenkins.io/flyway-runner)**


## Conclusion

Implementing the above would make us the confident when dealing with database changes and their distribution to desired environments. 

Another popular alternative of Flyway is [Liquibase](https://www.liquibase.org/), which will be a subject of a future blog post.
