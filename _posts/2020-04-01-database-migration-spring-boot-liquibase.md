---
title: One-Stop Guide to Database Migration with Liquibase and Spring Boot
categories: [spring-boot]
date: 2020-04-01 05:00:00 -0400
author: prabhakar
excerpt: "A comprehensive guide for database migrations using Liquibase with Spring Boot."
image:
  auto: 0060-data
tags: ["data migration", "spring-boot", "liquibase"]
---

Spring Boot provides integration with database migration tools [Liquibase](https://www.liquibase.org) and [Flyway](https://flywaydb.org/). This guide provides an overview of Liquibase and how to use it in a Spring Boot application for managing and applying database schema changes.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/data-migration/liquibase" %}


## Why Do We Need Database Migration tools?

Database migration tools help us to track, version control, and automate database schema changes. They help us to have a consistent schema across different environments. 

Refer to [this guide](https://reflectoring.io/database-migration-spring-boot-flyway/#why-do-we-need-database-migrations) for more details and to [this guide](/database-refactoring-flyway-vs-liquibase/) for a quick comparison of Liquibase and Flyway.

## Introduction to Liquibase

Liquibase facilitates database migrations with not only plain old SQL scripts, but also with different abstract, database-agnostic formats including XML, YAML, and JSON. When we use non-SQL formats for database migrations, Liquibase generates the database-specific SQL for us. It takes care of variations in data types and SQL syntax for different databases. It supports most of the popular [relational databases](https://www.liquibase.org/databases.html).

Liquibase allows enhancements for databases it currently supports through [Liquibase extensions](https://liquibase.jira.com/wiki/spaces/CONTRIB/overview). These extensions can be used to add support for additional databases as well. 


## Core Concepts of Liquibase

Let's have a look at the vocabulary of Liquibase:

- **ChangeSet**: A [changeSet](https://www.liquibase.org/documentation/changeset.html) is a set of changes that need to be applied to a database. Liquibase tracks the execution of changes at a ChangeSet level.

- **Change**: A [change](https://www.liquibase.org/documentation/changes/index.html) describes a single change that needs to be applied to the database. Liquibase provides several change types like "create table" or "drop column" out of the box which are each an abstraction over a piece of SQL. 

- **Changelog**: The file which has the list of database changeSets that needs to be applied is called a [changelog](https://www.liquibase.org/documentation/databasechangelog.html). These changelog files can be in either SQL, YAML, XML, or JSON format.

- **Preconditions**:  [Preconditions](https://www.liquibase.org/documentation/preconditions.html) are used to control the execution of changelogs or changeSets. They are used to define the state of the database under which the changeSets or changes logs need to be executed. 

- **Context**: A changeSet can be tagged with a [context](https://www.liquibase.org/documentation/contexts.html) expression. Liquibase will evaluate this expression to determine if a changeSets should be executed at runtime, given a specific context. You could compare a context expression with environment variables. 

- **Labels**: The purpose of [Labels](https://www.liquibase.org/documentation/labels.html) is similar to that of [contexts](https://www.liquibase.org/documentation/contexts.html). The difference is that changeSets are tagged with a list of labels (not expressions), and during runtime, we can pass a label expression to choose the changeSets which match the expression.

- **Changelog Parameters**: Liquibase allows us to have [placeholders](https://www.liquibase.org/documentation/changelog_parameters.html) in changelogs, which it dynamically substitutes during runtime.

Liquibase creates two tables `databasechangelog`  and `databasechangeloglock` when it runs in a database for the first time. It uses the `databasechangelog` table to keep track of the status of the execution of changeSets. It uses `databasechangeloglock` to prevent concurrent executions of Liquibase. Refer to the [docs](https://www.liquibase.org/get_started/how-lb-works.html) for more details.

## Liquibase with Spring Boot

Now that we went through the basics of Liquibase let's see how to get Liquibase running in a Spring Boot application.

### Setting Up Liquibase in Spring Boot

By default Spring Boot auto-configures Liquibase when we add the [Liquibase dependency](https://search.maven.org/artifact/org.liquibase/liquibase-core) to our build file.

Spring Boot uses the primary `DataSource` to run Liquibase (i.e. the one annotated with `@Primary` if there is more than one). In case we need to use a different `DataSource` we can mark that bean
as `@LiquibaseDataSource`. 

Alternatively, we can set the `spring.liquibase.[url,user,password]`properties, so that spring creates a Datasource on its own and uses it to auto-configure Liquibase.

**By default, Spring Boot runs Liquibase database migrations automatically on application startup**. 

It looks for a master changelog file in the folder `db/migration` within the classpath with the name `db.changelog-master.yaml`. If we want to use other Liquibase changelog formats or use different file naming convention, we can configure the `spring.liquibase.change-log` application property to point to a different master changelog file.

For example, to use `db/migration/my-master-change-log.json` as the master changelog file, we set the following property in `application.yml`:

```yaml
spring:
  liquibase:
    changeLog: "classpath:db/migration/my-master-change-log.json"
```

The master changelog can [include](https://www.liquibase.org/documentation/include.html) other changelogs so that we can split our changes up in logical steps.

### Running Our First Database Migration

After setting everything up, let's create our first database migration. We'll create the database table `user_details` in this example. 


Let's create a file with name ```db.changelog-master.yaml``` and place it in `src/main/resources/db/changelog`:

```yaml
databaseChangeLog:
  - include:
      file: db/changelog/db.changelog-yaml-example.yaml
```

The master file is just a collection of includes that points to changelogs with the actual changes.

Next, we create the changelog with the first actual changeset and put it into the file `src/main/resources/db/changelog-yaml-example.yaml`:

```yaml
databaseChangeLog:
  - changeSet:
      id: create-table-user
      author: liquibase-demo-service
      preConditions:
        - onFail: MARK_RAN
          not:
            tableExists:
              tableName: user_details
      changes:
        - createTable:
            columns:
              - column:
                  autoIncrement: true
                  constraints:
                    nullable: false
                    primaryKey: true
                    primaryKeyName: user_pkey
                  name: id
                  type: BIGINT
              - column:
                  constraints:
                    nullable: false
                  name: username
                  type: VARCHAR(250)
              - column:
                  constraints:
                    nullable: false
                  name: first_name
                  type: VARCHAR(250)
              - column:
                  name: last_name
                  type: VARCHAR(250)
            tableName: user_details
```

In the above changeSet, we used the changeType <b>createTable</b>, which abstracts the creation of a table. Liquibase will convert the above changeSet to the appropriate SQL based on the database that our application uses.

The `preCondition` checks that `user_details` table does not exist before executing this change. If the table already exists, Liquibase marks the changeSet as having run successfully.
 

Now, when we run the Spring Boot application, Liquibase executes the changeSet which creates the `user_details` table with `user_pkey` as the primary key.

### Using Changelog Parameters

Changelog parameters come in very handy when we want to abstract differences between environments while creating changelogs. We can set these parameters using the application property `spring.liquibase.parameters`, which takes a map of key/value pairs: 

```yaml
spring:
  profiles: docker
  liquibase:
    parameters:
      textColumnType: TEXT
    contexts: local
---
spring:
  profiles: h2
  liquibase:
    parameters:
      textColumnType: VARCHAR(250)
    contexts: local    
```

Above, we set the Liquibase parameter `textColumnType` to `VARCHAR(250)` when Spring Boot starts in the `h2` profile and to `TEXT` when it starts in the `docker` profile (assuming that the docker profile starts up a "real" database). 

We can now use this parameter in a changelog:

```yaml
databaseChangeLog:
  - changeSet:
     ...
      changes:
        - createTable:
            columns:
             ...
              - column:
                  constraints:
                    nullable: false
                  name: username
                  type: ${textColumnType}
```

Now, when the Spring Boot application runs in the `docker` profile, it uses `TEXT` as column type and in the `h2` profile it uses `VARCHAR(250)`.

<div class="notice warning">
 <h4>Warning</h4>
 <p>
  The code example assumes the usage of different types of databases in different environments for demonstrating the use of the changelog parameter. Please avoid using different types of databases for different staging environments. Doing so will cause hard-to-debug errors caused  by different environments.
 </p> 
</div> 

### Usage Liquibase Context
 
As described earlier, context can be used to control which changeSets should run. Let's use this to add test data in the `test` and `local` environments:
 ```xml
<databaseChangeLog>
  <changeSet 
    author="liquibase-docs" 
    id="loadUpdateData-example" 
    context="test or local">
    <loadUpdateData
      encoding="UTF-8"
      file="db/data/users.csv"
      onlyUpdate="false"
      primaryKey="id"
      quotchar="'"
      separator=","
      tableName="user_details">
    </loadUpdateData>
  </changeSet>
</databaseChangeLog>
```

We're using the expression `test or local` so it runs for these contexts, but not in production.

We now need to pass the context to Liquibase using the property `spring.liquibase.contexts`: 

```yaml
---
spring:
  profiles: docker
  liquibase:
    parameters:
      textColumnType: TEXT
    contexts: test
```

### Configuring Liquibase in Spring Boot

As a reference, here's a list of all properties that Spring Boot provides to configure the behavior of Liquibase.

| Property                                                            | Description |
| -------------------------------------------------------------------------- | ------------ | 
| spring.liquibase.changeLog | Master Change log configuration path. Defaults to classpath:/db/changelog/db.changelog-master.yaml |
| spring.liquibase.contexts | Comma-separated list of runtime contexts to use. |
| spring.liquibase.defaultSchema | Schema to use for managed database objects and Liquibase control tables.           |
| spring.liquibase.liquibaseSchema | Schema for Liquibase control tables.           |
| spring.liquibase.liquibaseTablespace | Tablespace to use for Liquibase objects.           |
| spring.liquibase.databaseChangeLogTable  | To Specify a different table to use for tracking change history. Default is DATABASECHANGELOG. |
| spring.liquibase.databaseChangeLogLockTable  | To Specify a different table to use for tracking concurrent Liquibase usage. Default is DATABASECHANGELOGLOCK. |
| spring.liquibase.dropFirst | Indicates whether to drop database schema before running the migration. Do not use this in prod. Default is false. |
| spring.liquibase.user | Login user that needs to be used.          |
| spring.liquibase.password | Login password of the database to migrate.           |
| spring.liquibase.url | JDBC URL of the database to migrate. If not set, the primary configured data source is used.|
| spring.liquibase.labels | Label expression to be used while running liquibase. |
| spring.liquibase.parameters | Parameters map that needs to be passed to liquibase. |
| spring.liquibase.rollbackFile | File to which rollback SQL is written when an update is performed. |
| spring.liquibase.testRollbackOnUpdate | Whether rollback should be tested before the update is performed. Default is false.  |

### Enable logging for Liquibase in Spring Boot

Enabling `INFO` level logging for Liquibase will help to see the changeSets that Liquibase executes during the start of the application. It also helps to identify that the application has not started yet because it is waiting to acquire changeloglock during the startup.

Add the following application property in `application.yml` to enable INFO logs:

```yaml
logging:
  level:
    "liquibase" : info
```

### Best Practices Using Liquibase

- **Organizing Changelogs**: Create a master changelog file that does not have actual changeSets but includes other changelogs (only YAML, JSON, and XML support using include, SQL does not). Doing so allows us to organize our changeSets in different changelog files. Every time we add a new feature to the application that requires a database change, we can create a new changelog file, add it to version control, and include it in the master changelog.

- **One Change per ChangeSet**: Have only one change per changeSet, as this allows easier rollback in case of a failure in applying the changeSet.

- **Don't Modify a ChangeSet**: Never modify a changeSet once it has been executed. Instead, add a new changeSet if modifications are needed for the change that has been applied by an existing changeSet. Liquibase keeps track of the checksums of the changeSets that it already executed. If an already run changeSet is modified, Liquibase by default will fail to run that changeSet again, and it will not proceed with the execution of other changeSets.

- **ChangeSet Id**: Liquibase allows us to have a descriptive name for changeSets. Prefer using a unique descriptive name as the changeSetId instead of using a sequence number. They enable multiple developers to add different changeSets without worrying about the next sequence number they need to select for the changeSetId.

- **Reference data management**: Use Liquibase to populate reference data and code tables that the application needs. Doing so allows deploying application and configuration data it needs together.
Liquibase provides changeType [loadUpdateData](https://www.liquibase.org/documentation/changes/load_update_data.html) to support this.

- **Use Preconditions**: Have preconditions for changeSets. They ensure that Liquibase checks the database state before applying the changes.

- **Test Migrations**: Make sure you always test the migrations that you have written locally before applying them in real nonproduction or production environment. Always use Liquibase to run database migrations in nonproduction or production environment instead of manually performing database changes.


Running Liquibase automatically during the Spring Boot application startup makes it easy to ship application code changes and database changes together. But in instances like adding indexes to existing database tables with lots of data, the application might take a longer time to start. One option is to pre-release the database migrations (releasing database changes ahead of code that needs it) and [run them asynchronously](https://github.com/jkutner/jhipster-example/blob/master/src/main/java/com/mycompany/myapp/config/liquibase/AsyncSpringLiquibase.java)

## Other Ways of Running Liquibase

Liquibase supports a range of other options to run database migrations apart from Spring Boot integration:

* via [Maven plugin](https://www.liquibase.org/documentation/maven/index.html)
* via [Gradle plugin](https://github.com/liquibase/liquibase-gradle-plugin#usage)
* via [Command line](https://www.liquibase.org/documentation/command_line.html)
* via [JEE CDI Integration](https://www.liquibase.org/documentation/cdi.html)
* via [Servlet Listener](https://www.liquibase.org/documentation/servlet_listener.html)

Liquibase has a [Java Api](https://www.liquibase.org/javadoc/index.html) that we can use in any Java-based application to perform database migrations.

## Conclusion

Liquibase helps to automate database migrations, and Spring Boot makes it easier to use Liquibase. This guide
provided details on how to use Liquibase in Spring Boot application and some best practices.

You can find the example code on [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/data-migration/liquibase).

We also have a guide on using [Flyway](/database-migration-spring-boot-flyway), another popular alternative for database migrations.