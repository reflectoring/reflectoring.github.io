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

#### SQL-based

Flyway has a [naming convention](https://flywaydb.org/documentation/migrations#naming) for database migration scripts which can be adjusted to our needs using the following [configuration properties](https://docs.spring.io/spring-boot/docs/current/reference/html/appendix-application-properties.html#data-migration-properties) (Spring notation):

```
spring.flyway.sql-migration-prefix=V
spring.flyway.repeatable-sql-migration-prefix=R
# two underscores
spring.flyway.sql-migration-separator=__
spring.flyway.sql-migration-suffixes=.sql
```

Let's create `V1__init.sql` file, which can be used as a base for our database migrations (H2 notation):

```sql
CREATE TABLE test_user(
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
);
```

`test_user` is just an example table which stores user details.

#### Java-based

Java-based migration is preferred for cases which are harder to write in SQL, e.g:

1. BLOB & CLOB changes
2. Advanced bulk data changes like generating random data, recalculations, advanced format changes etc.

File naming rules are similar to SQL-based migrations, but overriding them requires implementing of [JavaMigration](https://flywaydb.org/documentation/api/javadoc/org/flywaydb/core/api/migration/JavaMigration) interface.

Let's create `V2__InsertRandomUsers.java` file and see its extended capabilities:

```java
package db.migration;

import java.text.MessageFormat;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

/**
 * Example of a Java-based migration using Spring {@link JdbcTemplate}.
 */
public class V2__InsertRandomUsers extends BaseJavaMigration {

  public void migrate(Context context) {

    final JdbcTemplate jdbcTemplate = new JdbcTemplate(new SingleConnectionDataSource(context.getConnection(), true));

    // Create 10 random users
    for (int i = 1; i <= 10; i++) {
      jdbcTemplate.execute(String.format("insert into test_user(username, first_name, last_name) " 
                                             + "values('%d@reflectoring.io', 'Elvis_%d', 'Presley_%d')", i, i, i));
    }
  }
}
```
 
### Setting up and Running Flyway

We use an H2 database in an `in-memory` mode for this post, so we can simplify database access settings. We need to add its dependency to our build file (Gradle notation):

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

#### Gradle Plugin

Gradle plugin could be helpful when Spring and non-Spring applications are developed, but without the need of programatic congiguration. Here is the definition in our build file (Gradle notation):

```gradle
plugins {

  // Other plugins...
 
  id "org.flywaydb.flyway" version "6.2.3"
}

flyway {
  url = 'jdbc:h2:mem:'
  locations = [
      // Add this when Java-based migrations are used
      'classpath:db/migration'
  ]
}
```

After successful configuration we can call the following command in our terminal: 

```bash
./gradlew flywayMigrate --info
```

Here we use [Gradle Wrapper](https://docs.gradle.org/current/userguide/gradle_wrapper.html) to call `flywayMigrate` task which executes created database migrations. The `--info` parameter sets Gradle log level to `info`, which allows us to see Flyway output. 

Gradle plugin suppots all Flyway commands by providing corresponding tasks, following the pattern `flyway<Command>`.

#### Command-line tool

This option allows us to have independent tool which doesn't require installation or integration with our application. 

First, we need to download the relevant [archive](https://flywaydb.org/documentation/commandline/) for our operating system and extract it.
Next we should create our SQL-based migrations in `sql` folder and Java-based in `jars` folder (packed in `jar` files). 
As with other running options, we can override default configuration by changing `flyway.conf` file located in `conf` folder. Here is a minimal configuration for H2 database:

```
flyway.url=jdbc:h2:mem:
flyway.user=sa
```

Calling Flyway executable is different for each operating system. On macOS/Linux we must call:

```
cd flyway-<version>
./flyway migrate
```

On Windows:

```
cd flyway-<version>
flyway.cmd migrate
```

### Placeholders
[Placeholders](https://flywaydb.org/documentation/placeholders) come in very handy when we want to abstract differences between environments. A good example is using different schema name in development and production environment:

```sql
CREATE TABLE ${schema_name}.test_user(
-- Columns definition
);
```

By default, Ant-style is used for placeholder definition, but we can easily override it by changing the following properties (Spring notation):

```
spring.flyway.placeholder-prefix=${
spring.flyway.placeholder-replacement=true
spring.flyway.placeholder-suffix=}
# spring.flyway.placeholders.*
spring.flyway.placeholders.schema_name=test
```

## Tips

### Incremental Mindset

Flyway tries to enforce writing of incremental database changes. That means we shouldn't update already applied migrations, except [repeatable](https://flywaydb.org/documentation/migrations#repeatable-migrations) ones.

Sometimes we have to do manual changes, directly to the database server, but we want to have them in our migrations scripts as well. Once a certain migration is applied, any further updates would produce different checksum:

```bash
* What went wrong:
Execution failed for task ':flywayMigrate'.
> Error occurred while executing flywayMigrate
  Validate failed: 
  Migration checksum mismatch for migration version 1
  -> Applied to database : -883224591
  -> Resolved locally    : -1438254535
```

Fixing this is easy, by simply calling the [repair](https://flywaydb.org/documentation/command/repair) command, which generates the following output:

```bash
Repair of failed migration in Schema History table "PUBLIC"."flyway_schema_history" not necessary. No failed migration detected.
Repairing Schema History table for version 1 (Description: init, Type: SQL, Checksum: -1438254535)  ...
Successfully repaired schema history table "PUBLIC"."flyway_schema_history" (execution time 00:00.026s).
Manual cleanup of the remaining effects the failed migration may still be required.
```

Flyway allows migrations to be run "out of order" by setting `spring.flyway.out-of-order` property to `true`.
This is useful when we would like to use the issue number as a prefix name, e.g. `REFLECT-2-Init.sql`, so different migration can be applied randomly regardless the version number.

### Support of Undo

I guess we all have been in a situation when the latest production database changes should be reverted. We should be aware that Flyway supports [undo](https://flywaydb.org/documentation/command/undo) command in the professional edition only. Undo migrations are defined with `U` prefix, which can be changed with `undoSqlMigrationPrefix` property. This is how such migration would look like:

```sql
DROP TABLE test_user;
```

Executing the above migration would produce this output:

```bash
Current version of schema "PUBLIC": 1
Undoing migration of schema "PUBLIC" to version 1 - init
Successfully undid 1 migration to schema "PUBLIC" (execution time 00:00.024s).
```

There is a [free alternative](https://github.com/Majitek/strata-db-versioning), which is capable to handle rolling back of applied changes for PostgreSQL database.

## Database Migration as Part of a CI/CD Process

> "If it can be automated, it should be automated" - Unknown

The above quote is also applicable to delivering database changes to different environments (test, stage, prod etc.).

We need to make sure that our local database changes will work on all other servers. The most common approach is to use a CI/CD build to emulate a real deployment. 

One of the most widely used CI/CD servers is [Jenkins](https://jenkins.io/). Let's define a [pipeline](https://jenkins.io/doc/book/pipeline) using two of the most widely used options:

### Using Gradle Build

```
pipeline {
  agent any

  stages {
    checkout scm

    stage('Gradle Build') {
      steps {
        script {
          if (isUnix()) {
            sh './gradlew clean build --info'
          } else {
            bat 'gradlew.bat clean build --info'
          }
        }
      }
    }
  }
}
```

The pipeline above builds the project and runs the tests, which initialize Spring context and execute Flyway migrations.

### Using Gradle Plugin

```gradle
pipeline {
  agent any
  
  stages {
    checkout scm

    stage('Apply Database Migrations') {
      steps {
        script {
          if (isUnix()) {
            sh '/gradlew flywayMigrate --info'
          } else {
            bat 'gradlew.bat flywayMigrate --info'
          }
        }
      }
    }
  }
}
```

Defining pipeline in this way helps us to separate building and testing the project from Flyway migrations execution.

## Conclusion

Implementing the above would make us confident when dealing with database changes and their distribution to desired environments. 

Another popular alternative of Flyway is [Liquibase](https://www.liquibase.org/), which will be a subject of a future blog post.
