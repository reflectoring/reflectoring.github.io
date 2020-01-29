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

Spring Boot siplifies database migrations by providing integration with one of the most widely used tool [Flyway](https://flywaydb.org/). This guide will present various options of using Flyway as part of Spring Boot application, as well as running it within a CI build. We'll also cover main advantages of having [Database Migrations Done Right](https://reflectoring.io/tool-based-database-refactoring/).

```
{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/data-migration/flyway" %}
```

## Why We Need Database Migrations

I've worked in a project where all database changes were deployed manually. More people joined and naturally they start asking:

* What state is the database in on this environment?
* Has specific script already been applied or not?
* Has hot-fix in production been deployed in other environments afterwards?
* How a new database instance can be set up to specific or latest state?

Ansering these questions required one of us to check for a change which was part of the sql script, e.g. adding a column, a stored procedure etc. If we multiply all these checks to number of environments plus the work required to align the state, then we get decent amount of time lost.

Database migrations allow you to:

* Create a database from scratch.
* Have a single source of truth for database version.
* Have reproducible state of the database in local and remote environments.
* Automate database changes deployment, which helps minimizing human errors.

### Why Flyway

Flyway facilitates the above while providing:

1. Well stuctured and easy to read documentation.
2. An option to integrate with existing database.
3. Support for almost all known databases.
4. Wide variety of running and configuration options.

## Setting up Flyway

For the purpose of this post we use H2 database in `in-memory` mode. Spring Boot auto-configures [Flyway](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto-execute-flyway-database-migrations-on-startup) and [H2](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-embedded-database-support) as long as we add the following dependencies to our build file (Gradle notation):

```
implementation 'org.flywaydb:flyway-core'
runtimeOnly 'com.h2database:h2:1.4.199'
```

This is enough for Spring Boot to initializes a specific implementation of `DataSource` called `EmbeddedDatabase`. It is  then used by Flyway to execute the given migrations. All configuration options can be found at [Spring Boot applcation properties reference](https://docs.spring.io/spring-boot/docs/current/reference/html/appendix-application-properties.html)

In case we prefer to use one of the build tool plugins, an additional definition is required in our build file (Gradle notation):

```gradle
plugins {

  // Other plugins...
 
  id "org.flywaydb.flyway" version "6.2.0"
}

flyway {
  url = 'jdbc:h2:mem:'
}
```

## Writing our first database migration

Flyway has own [naming convention](https://flywaydb.org/documentation/migrations#sql-based-migrations) which can be adjusted to our needs using the following [configurations](https://docs.spring.io/spring-boot/docs/current/reference/html/appendix-application-properties.html#data-migration-properties):

```
spring.flyway.sql-migration-prefix
spring.flyway.sql-migration-separator
spring.flyway.sql-migration-suffixes
```

Here is the `V1__init.sql` file used in our [code examples repository](https://github.com/thombergs/code-examples/tree/master/spring-boot) **TODO: Put actual link here when the code is approved**:

```sql
CREATE TABLE auth_user(
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL unique
);
```

## Running Flyway

Choosing the right running option depends on our needs and FLyway tries to cover almost all of them - [command-line](https://flywaydb.org/documentation/commandline/), [Java/Android API](https://flywaydb.org/documentation/api/), [Maven](https://flywaydb.org/documentation/maven/)/[Gradle](https://flywaydb.org/documentation/gradle/) plugins, [Docker](https://hub.docker.com/r/flyway/flyway) and decent list of [community plugins and integrations](https://flywaydb.org/documentation/plugins/).

By default, Spring Boot runs Flyway database migrations on [startup](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto-execute-flyway-database-migrations-on-startup) by looking at `classpath:db/migration` folder. We can modify this location by passing comma-separated list of one or more `classpath:` or `filesystem:` locations to `spring.flyway.locations` property.

When Gradle plugin is preferred, we can call the following command in our terminal: 

```bash
./gradlew flywayMigrate -i
```

## Tips

* [Placehodlers](https://flywaydb.org/documentation/placeholders) come very handy when we want to abstract differences between environments. By default, Ant-style is used, e.g. `${database_name}`

* Swithing our mindset to incremental changes

Flyway tries to enforces writing of incremental database changes. That means we shouldn't update already applied migrations, except [repeatable](https://flywaydb.org/documentation/migrations#repeatable-migrations) ones. This rule is also applicable when `spring.flyway.out-of-order` is used.

* Fix broken checksums

Sometimes we have to do manual changes, directly to the database server, but we want to have them in our migraitons scripts as well. Once a certain migration is applied, any further updates would produce different checksum. Fixing this is easy, by simply calling [repair](https://flywaydb.org/documentation/command/repair) command

* Lack of support of undo operations in community edition

I guess we all have been in a situation when latest production database changes should be reverted. We should be aware that Flyway doens't support its [undo](https://flywaydb.org/documentation/command/undo) command in the community edition. There is an open-source [project](https://github.com/Majitek/strata-db-versioning) which handles this case for PostgreSQL database.

## Database migration as part of CI/CD process

> "If it can be automated, it should be automated" - Unknown

The above quote is also applicable to delivering of database changes to different environments (test, stage, prod etc.).

We need to make sure that our local database changes will work on all other servers. Most common approach is to use CI/CD build to emulate real deployement. 

One of the most widely used CI/CD server is [Jenkins](https://jenkins.io/). We can use both options from [Running Flyway section](#running-flyway) as part of our job/pipeline definition. In addition to that, Jenkins provides hundreds of plugins to support various technologies and [Flyway](https://plugins.jenkins.io/flyway-runner) is no exception. 

## Conclusion

Implementing the above would make us the confident when dealing with database changes and their distribution to desired environments. 

Another popular alternative of Flyway is [Liquibase](https://www.liquibase.org/), which will be a subject of a future blog post :blush:
