---
title: One-Stop Guide to Database Migration with Flyway and Spring Boot
categories: ["Spring Boot"]
date: 2020-02-21T05:00:00
authors: [petromir]
excerpt: "A comprehensive guide for database migrations using Flyway with and without Spring Boot."
image: images/stock/0060-data-1200x628-branded.jpg
url: database-migration-spring-boot-flyway
---

Spring Boot simplifies database migrations by providing integration with [Flyway](https://flywaydb.org/), one of the most widely used database migration tools. This guide presents various options of using Flyway as part of a Spring Boot application, as well as running it within a CI build. We'll also cover the main advantages of having [Database Migrations Done Right](https://reflectoring.io/tool-based-database-refactoring/).

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/data-migration/flyway" %}}

## Why Do We Need Database Migrations?

I've worked on a project where all database changes were deployed manually. Over time, more people joined and, naturally, they started asking questions:

* What state is the database in on this environment?
* Has a specific script already been applied or not?
* Has this hotfix in production been deployed in other environments afterward?
* How can I set up a new database instance to a specific or the latest state?

Answering these questions required one of us to check the SQL scripts to find out if someone has added a column, modified a stored procedure, or similar things. If we multiply the time spent on all these checks with the number of environments and add the time spent on aligning the database state, then we get a decent amount of time lost.

Automatic database migrations with Flyway or similar tools allow us to:

* Create a database from scratch.
* Have a single source of truth for the version of the database state.
* Have a reproducible state of the database in local and remote environments.
* Automate database changes deployment, which helps to minimize human errors.

## Enter Flyway

Flyway facilitates database migration while providing:

* Well structured and easy-to-read [documentation](https://flywaydb.org/documentation/).
* An option to integrate with an [existing database](https://flywaydb.org/documentation/existing).
* Support for almost all known schema-based databases.
* A wide variety of running and configuration options.

Let's see how to get Flyway running.

## Writing Our First Database Migration

Flyway tries to find user-provided migrations both on the filesystem and on the Java classpath. By default, it loads all files in the folder `db/migration` within the classpath that conform to the configured naming convention. We can change this behavior by configuring the [locations](https://flywaydb.org/documentation/commandline/migrate#locations) property.

### SQL-based Migration

Flyway has a [naming convention](https://flywaydb.org/documentation/migrations#naming) for database migration scripts which can be adjusted to our needs using the following [configuration properties](https://docs.spring.io/spring-boot/docs/current/reference/html/appendix-application-properties.html#data-migration-properties) in `application.properties` (or `application.yml`):

```text
spring.flyway.sql-migration-prefix=V
spring.flyway.repeatable-sql-migration-prefix=R
spring.flyway.sql-migration-separator=__
spring.flyway.sql-migration-suffixes=.sql
```

Let's create our first migration script `V1__init.sql`:

```sql
CREATE TABLE test_user(
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
);
```

`test_user` is just an example table that stores some user details. 

The SQL we're using in this article will run in an H2 in-memory database, so keep in mind that it might not work with other databases.

### Java-Based Migration

If we have a case that requires more dynamic database manipulation, we can create a Java-based migration. This is handy for modifying BLOB & CLOB columns, for instance, or for bulk data changes like generating random data or recalculating column values.

File naming rules are similar to SQL-based migrations, but overriding them requires us to implement the [JavaMigration](https://flywaydb.org/documentation/api/javadoc/org/flywaydb/core/api/migration/JavaMigration) interface.

Let's create `V2__InsertRandomUsers.java` and have a look at its extended capabilities:

```java
package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

public class V2__InsertRandomUsers extends BaseJavaMigration {

  public void migrate(Context context) {

    final JdbcTemplate jdbcTemplate = new JdbcTemplate(
        new SingleConnectionDataSource(context.getConnection(), true));

    // Create 10 random users
    for (int i = 1; i <= 10; i++) {
      jdbcTemplate.execute(String.format("insert into test_user" 
          + " (username, first_name, last_name) values" 
          + " ('%d@reflectoring.io', 'Elvis_%d', 'Presley_%d')", i, i, i));
    }
  }
}
```

We can execute any logic we want within a Java migration and thus have all the flexibility to implement more dynamic database changes.
 
## Running Flyway

We use an H2 database in `in-memory` mode for this article, so we can simplify database access settings. We need to add its dependency to our build file (Gradle notation):

```gradle
runtimeOnly 'com.h2database:h2'
```

Flyway supports a range of different options to run database migrations:

* via [command line](#command-line)
* via [Java API](#java-api), 
* via Maven and [Gradle](#gradle-plugin) plugins, and
* via [community plugins and integrations](https://flywaydb.org/documentation/plugins/) including [Spring Boot](#spring-boot-auto-configuration). 

Let's have a look at each of them and discuss their pros and cons.

### Spring Boot Auto-Configuration

Having a supported `DataSource` implementation as a dependency in the classpath is enough for Spring Boot to instantiate that `DataSource` and make it available for running database queries. This `DataSource` is automatically passed on to auto-configure [Flyway](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto-execute-flyway-database-migrations-on-startup) when we add the following dependency to our build file (Gradle notation):

```gradle
implementation 'org.flywaydb:flyway-core'
```

**By default, Spring Boot runs Flyway database migrations automatically on application startup**. 

In case we put our migrations in different locations from the default folder, we can provide a comma-separated list of one or more `classpath:` or `filesystem:` locations in the `spring.flyway.locations` property in `application.properties`:

```text
spring.flyway.locations=classpath:db/migration,filesystem:/another/migration/directory
```

Using Spring Boot auto-configuration is the simplest approach and requires minimal effort to support database migrations out of the box.

### Java API

Non-Spring applications can still benefit from Flyway. Again, we need to add flyway as a dependency (Gradle notation):

```gradle
implementation 'org.flywaydb:flyway-core'
```

Now we only need to configure and run the core class [Flyway](https://flywaydb.org/documentation/api/javadoc/org/flywaydb/core/Flyway) as part of application initialization:

```java
import org.flywaydb.core.Flyway;

public class MyApplication {
  public static void main(String[] args) {
    DataSource dataSource = ... 
    Flyway flyway = Flyway.configure().dataSource(dataSource).load();
    flyway.migrate();

    // Start the rest of the application
  }
}
```

Calling `flyway.migrate()` will now execute all database migrations that haven't been executed before.

### Gradle Plugin

We can use the Flyway Gradle plugin for Spring-based applications as well as for plain Java applications if we don't want to run migrations automatically at startup. The plugin takes all the configuration out of our application and into the Gradle script:

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

Here we use [Gradle Wrapper](https://docs.gradle.org/current/userguide/gradle_wrapper.html) to call the `flywayMigrate` task which executes all previously not-run database migrations. The `--info` parameter sets Gradle log level to `info`, which allows us to see Flyway output. 

The Gradle plugin supports [all Flyway commands](https://flywaydb.org/documentation/gradle/#tasks) by providing corresponding tasks, following the pattern `flyway<Command>`.

### Command Line

We can also run Flyway via command line. This option allows us to have an independent tool which doesn't require installation or integration with our application. 

First, we need to download the relevant [archive](https://flywaydb.org/documentation/commandline/) for our operating system and extract it.

Next, we should create our SQL-based migrations in a folder named `sql` or `jars` in case of Java-based migrations. The `jar` folder must contain our Java migrations packed into `jar` files.
 
As with other running options, we can override the default configuration by modifying the `flyway.conf` file located in the `conf` folder. Here is a minimal configuration for H2 database:

```text
flyway.url=jdbc:h2:mem:
flyway.user=sa
```

Calling the Flyway executable is different for each operating system. On macOS/Linux we must call:

```text
cd flyway-<version>
./flyway migrate
```

On Windows:

```text
cd flyway-<version>
flyway.cmd migrate
```

## Placeholders
[Placeholders](https://flywaydb.org/documentation/placeholders) come in very handy when we want to abstract from differences between environments. A good example is using a different schema name in development and production environments:

```sql
CREATE TABLE ${schema_name}.test_user(
...
);
```

By default, we can use Ant-style placeholders, but when we run Flyway with Spring Boot, we can easily override it by changing the following properties in `application.properties`:

```text
spring.flyway.placeholder-prefix=${
spring.flyway.placeholder-replacement=true
spring.flyway.placeholder-suffix=}
# spring.flyway.placeholders.*
spring.flyway.placeholders.schema_name=test
```

## Tips

Basic usage of Flyway is simple, but database migration can get complicated. Here are some thoughts about how to get database migration right.

### Incremental Mindset

Flyway tries to enforce incremental database changes. That means we shouldn't update already applied migrations, except [repeatable](https://flywaydb.org/documentation/migrations#repeatable-migrations) ones. By default, we should use versioned migrations that will only be run once and will be skipped in subsequent migrations.

Sometimes we have to do manual changes, directly to the database server, but we want to have them in our migrations scripts as well so we can transport them to other environments. So, we change a flyway script after it has already been applied. If we run another migration sometime later, we get the following error:

```bash
* What went wrong:
Execution failed for task ':flywayMigrate'.
> Error occurred while executing flywayMigrate
  Validate failed: 
  Migration checksum mismatch for migration version 1
  -> Applied to database : -883224591
  -> Resolved locally    : -1438254535
```

This is because we changed the script and Flyway has a different checksum recorded for it.  

Fixing this is easy, by simply calling the [repair](https://flywaydb.org/documentation/command/repair) command, which generates the following output:

```bash
Repair of failed migration in Schema History table "PUBLIC"."flyway_schema_history" not necessary. No failed migration detected.
Repairing Schema History table for version 1 (Description: init, Type: SQL, Checksum: -1438254535)  ...
Successfully repaired schema history table "PUBLIC"."flyway_schema_history" (execution time 00:00.026s).
Manual cleanup of the remaining effects the failed migration may still be required.
```

Flyway now has updated the checksum of migration script version 1 to the local value so that future migrations won't cause this error again.

### Support of Undo

I guess we all have been in a situation when the latest production database changes should be reverted. We should be aware that Flyway supports the [undo](https://flywaydb.org/documentation/command/undo) command in the professional edition only. Undo migrations are defined with the `U` prefix, which can be changed via the `undoSqlMigrationPrefix` property. The undo script to our migration script from above would look like this:

```sql
DROP TABLE test_user;
```

Executing the above migration would produce this output:

```bash
Current version of schema "PUBLIC": 1
Undoing migration of schema "PUBLIC" to version 1 - init
Successfully undid 1 migration to schema "PUBLIC" (execution time 00:00.024s).
```

I've created a [free alternative](https://github.com/Majitek/strata-db-versioning), which is capable to handle the rollback of previously applied changes for a PostgreSQL database.

## Database Migration as Part of a CI/CD Process

> "If it can be automated, it should be automated" - Unknown

This quote is also applicable to delivering database changes to different environments (test, stage, prod, etc.).

We need to make sure that our local database changes will work on all other servers. The most common approach is to use a CI/CD build to emulate a real deployment. 

One of the most widely used CI/CD servers is [Jenkins](https://jenkins.io/). Let's define a [pipeline](https://jenkins.io/doc/book/pipeline) using the Flyway Gradle plugin to execute the database migrations:

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

We call `./gradlew flywayMigrate` to run the SQL scripts against the database. We have to make sure, of course, that the Flyway Gradle plugin is configured against the correct database. We could even create multiple configurations so that we can migrate to different databases (staging, production, ...) in different CI/CD pipelines.

The same command can easily be integrated in pipelines of other CI/CD tools than Jenkins.

## Conclusion

Implementing automated database migration with Flyway makes us confident when dealing with database changes and their distribution to target environments. 

Another popular alternative of Flyway is [Liquibase](https://www.liquibase.org/), which will be the subject of a future blog post.

You can find the example code on [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/data-migration/flyway).
