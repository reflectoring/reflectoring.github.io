---
title: One-Stop Guide to Database Migration with Spring Boot and Flyway
categories: [spring-boot]
date: 2020-01-30 05:00:00 +1100
author: Petromir Dzhunev
excerpt: "A comprehensive guide for database migrations using Spring Boot and its support of
 Flyway."
image:
  auto: 0018-cogs
tags: ["data migration", "spring-boot", "flyway"]
---

Spring Boot simplifies database migrations by providing integration with one of the most widely used tools: [Flyway](https://flywaydb.org/). This guide presents various options of using Flyway as part of a Spring Boot application, as well as running it within a CI build. We'll also cover main advantages of having [Database Migrations Done Right](https://reflectoring.io/tool-based-database-refactoring/).

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/data-migration/flyway" %}

## Why We Need Database Migrations

I've worked in a project where all database changes were deployed manually. Over time, more people joined and, naturally, they start asking questions:

* What state is the database in on this environment?
* Has a specific script already been applied or not?
* Has this hot fix in production been deployed in other environments afterwards?
* How can I set up a new database instance to a specific or the latest state?

Answering these questions required one of us to check the SQL scripts to find out if someone added a column modified a stored procedure, or similar. If we multiply the time spent on all these checks with the number of environments plus the time spent on aligning the database state, then we get a decent amount of time lost.

Database migrations allow us to:

* Create a database from scratch.
* Have a single source of truth for the version of the database state.
* Have reproducible state of the database in local and remote environments.
* Automate database changes deployment, which helps to minimize human errors.

## Enter Flyway

Flyway facilitates the above while providing:

1. Well structured and easy to read documentation.
2. An option to integrate with an existing database.
3. Support for almost all known schema-based databases.
4. Wide variety of running and configuration options.

Let's see how to get Flyway running with Spring Boot.

### Writing Our First Database Migration

Flyway tries to find user provided migrations both on the filesystem and on the Java classpath. By default, recursively loads all files in `db/migration` folder within the classpath, which conform the configured naming convention. This behavior can be changed by setting [locations](https://flywaydb.org/documentation/commandline/migrate#locations) property.

## SQL-based

Flyway has a [naming convention](https://flywaydb.org/documentation/migrations#naming) for database migration scripts which can be adjusted to our needs using the following [configuration properties](https://docs.spring.io/spring-boot/docs/current/reference/html/appendix-application-properties.html#data-migration-properties) (Spring notation):

```
spring.flyway.sql-migration-prefix=V
# two underscores
spring.flyway.sql-migration-separator=__
spring.flyway.sql-migration-suffixes=.sql
```

Let's create `V1__init.sql` file, which can be used as a base for our database migrations.

```sql
CREATE TABLE auth_user(
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
);
```

`auth_user` is just an example table which stores details of authenticated users.

## Java-based

Java-based migration is preferred for cases which are harder to write in SQL, e.g:

1. BLOB & CLOB changes
2. Advanced bulk data changes like generating random data, recalculations, advanced format changes etc.

File naming rules are similar to SQL-based migrations, but overriding them requires implementation of [JavaMigration](https://flywaydb.org/documentation/api/javadoc/org/flywaydb/core/api/migration/JavaMigration) interface.

Let's create `V1__init.java` file and see its extended capabilities:

```java
package db.migration;

import java.text.MessageFormat;
import java.util.Random;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

/**
 * Example of a Java-based migration using Spring {@link JdbcTemplate}.
 */
public class V2__InsertRandomUsers extends BaseJavaMigration {

  private Random random = new Random();

  public void migrate(Context context) {

    final JdbcTemplate jdbcTemplate = new JdbcTemplate(new SingleConnectionDataSource(context.getConnection(), true));

    // Create 10 random users
    for (int i = 0; i < 10; i++) {
      final int randomNumber = random.nextInt(1000);
      jdbcTemplate
          .execute(MessageFormat.format(
              "insert into auth_user values(1, '{0}@reflectoring.io', 'Elvis_{0}', 'Presley_{0}')",
              randomNumber
          ));
    }
  }
}
```
 
### Setting up and Running Flyway

We use a H2 database in an `in-memory` mode for this post, so we can simplify database access settings. We need to add its dependency to our build file (Gradle notation):

```gradle
runtimeOnly 'com.h2database:h2'
```

Choosing the right running option depends on our needs and Flyway tries to cover almost all of them - [command-line](https://flywaydb.org/documentation/commandline/), [Java API](https://flywaydb.org/documentation/api/), [Maven](https://flywaydb.org/documentation/maven/)/[Gradle](https://flywaydb.org/documentation/gradle/) plugins and a decent list of [community plugins and integrations](https://flywaydb.org/documentation/plugins/) including [Spring Boot](https://flywaydb.org/documentation/plugins/springboot). Let's have a look at each of them and see their pros and cons.

#### Spring Boot Auto-Configuration

Having [H2](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-embedded-database-support) as a dependency is enough for Spring Boot to initialize a specific implementation of `DataSource` called `EmbeddedDatabase`. This `DataSource` is then used to auto-configure [Flyway](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto-execute-flyway-database-migrations-on-startup) as long as we add the following dependencies to our build file (Gradle notation):

```gradle
implementation 'org.flywaydb:flyway-core'
```

By default, Spring Boot runs Flyway database migrations on application startup. In case we put our migrations in a different location, we can provide a comma-separated list of one or more `classpath:` or `filesystem:` locations to `spring.flyway.locations` property:

```
spring.flyway.locations=classpath:db/migration,filesystem:/another/migration/directory
```

Using Spring Boot auto-configuration is the simplest approach and requires minimal efforts to support database migrations out of the box.

#### Java API

Non-Spring application can still benefit from Flyway, using similar to Spring Boot set-up (Gradle notation):

```gradle
implementation 'org.flywaydb:flyway-core'
```

Now, we only need to configure and run the core class [Flyway](https://flywaydb.org/documentation/api/javadoc/org/flywaydb/core/Flyway) as part of applicaiton initialization:

```java
import org.flywaydb.core.Flyway;

public class MyApplication {
  public static void main(String[] args) {
    // Set up DataSource

    Flyway flyway = Flyway.configure().dataSource(dataSource).load();
    flyway.migrate();

    // Start the rest of the application
  }
}
```

#### Gradle plugin

Gradle plugin could be helpful when Spring and non-Spring applications are developed, but without the need of programatic congiguration. Here is the definition in our build file (Gradle notation):

```gradle
plugins {

  // Other plugins...
 
  id "org.flywaydb.flyway" version "6.2.0"
}

flyway {
  url = 'jdbc:h2:mem:'
}
```

After successful configuration we can call the following command in our terminal: 

```bash
./gradlew flywayMigrate --info
```

Here we use [Gradle Wrapper](https://docs.gradle.org/current/userguide/gradle_wrapper.html) to call `flywayMigrate` task which executes created database migrations. The `--info` parameter sets Gradle log level to `info`, which allows us to see Flyway output. 

Gradle plugin suppots all Flyway commands by providing corresponding tasks, following the pattern `flyway<Command>`.

#### Command-line tool

This option allows us to have independent tool which doesn't require installation or integration with our application. We only need to download the relevant [binary](https://flywaydb.org/documentation/commandline/) for our operating system.


**TODO: Describe how to configure it**

Once downloaded we can execute the following in our terminal:

```
cd flyway-<version>

```

## Tips

### Placeholders
[Placeholders](https://flywaydb.org/documentation/placeholders) come in very handy when we want to abstract differences between environments. By default, Ant-style is used, e.g. `${database_name}`

### Incremental Mindset

Flyway tries to enforce writing of incremental database changes. That means we shouldn't update already applied migrations, except [repeatable](https://flywaydb.org/documentation/migrations#repeatable-migrations) ones. This rule is also applicable when `spring.flyway.out-of-order` is used.

### Fixing Broken Checksums

Sometimes we have to do manual changes, directly to the database server, but we want to have them in our migrations scripts as well. Once a certain migration is applied, any further updates would produce different checksum. Fixing this is easy, by simply calling the [repair](https://flywaydb.org/documentation/command/repair) command

### Support of Undo

I guess we all have been in a situation when the latest production database changes should be reverted. We should be aware that Flyway doesn't support its [undo](https://flywaydb.org/documentation/command/undo) command in the community edition. There is an open-source [project](https://github.com/Majitek/strata-db-versioning) which handles this case for PostgreSQL database.

## Database Migration as Part of a CI/CD Process

> "If it can be automated, it should be automated" - Unknown

The above quote is also applicable to delivering database changes to different environments (test, stage, prod etc.).

We need to make sure that our local database changes will work on all other servers. The most common approach is to use a CI/CD build to emulate a real deployment. 

One of the most widely used CI/CD servers is [Jenkins](https://jenkins.io/). Let's define a pipeline using two of the most popular [running](#running-flyway) options:

### Gradle plugin

```gradle
pipeline {
  agent any
  
  stages {
    checkout scm

    stage('Apply Database Migrations') {
      steps {
        script {
          if (isUnix()) {
           sh '/gradlew flywayMigrate -i'
          } else {
           bat 'gradlew.bat flywayMigrate -i'
          }
        }
      }
    }
  }
}
```

## Conclusion

Implementing the above would make us confident when dealing with database changes and their distribution to desired environments. 

Another popular alternative of Flyway is [Liquibase](https://www.liquibase.org/), which will be a subject of a future blog post.
