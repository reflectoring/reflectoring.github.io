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

Database migration tools help us to track, version control, and automate database schema changes. They help us to have consistent schema across different environments. Refer to [this guide](https://reflectoring.io/database-migration-spring-boot-flyway/#why-do-we-need-database-migrations) for more details.

## Introduction to Liquibase

Liquibase facilitates database migrations with not only plain old SQL's, but also with different abstract, database-agnostic formats including XML, YAML, and JSON. When we use non-SQL formats for database migrations, it generates the database-specific SQL. It takes care of variations in data types and SQL syntax for different databases. It supports most of the famous [relational databases](https://www.liquibase.org/databases.html).

Liquibase allows enhancements for databases it currently supports through [Liquibase extensions](https://liquibase.jira.com/wiki/spaces/CONTRIB/overview). These extensions can be used to add support for additional databases as well. 


### Core concepts of Liquibase

- **ChangeSet**: ChangeSet is units of change that need to be applied to a database. Liquibase tracks the execution of changes at a changeSet level. Refer [changeSet](https://www.liquibase.org/documentation/changeset.html) documentation for more details.

- **ChangeType**: This describes the change that needs to be applied to the database. Liquibase provides several change types out of the box which are abstractions over the database SQL's needed to perform those changes. Refer [changetypes](https://www.liquibase.org/documentation/changes/index.html) documentation for more details.  

- **Changelog**: The file which has the list of database changeSets that needs to be applied. These changelog files can be in either SQL, YAML, XML, or JSON formats. See the [changelog](https://www.liquibase.org/documentation/databasechangelog.html) documentation for more details.

- **Preconditions**:  Preconditions are used to control the execution of changelogs or changeSets. They are used to define the state of the database under which the changeSets or changes logs need to be executed. Refer [Preconditions](https://www.liquibase.org/documentation/preconditions.html) documentation for more details.

- **Context**: A changeSet can be tagged with context expression. And this expression can be used to select the changeSets that need to be executed while running Liquibase based on the context values passed to Liquibase at runtime. Refer [Contexts](https://www.liquibase.org/documentation/contexts.html) documentation for more details.

- **Labels**: Labels are introduced in version 3.3, the purpose of it is similar to that of [context](https://www.liquibase.org/documentation/contexts.html). The difference being, changeSets are tagged with a list of labels (not expressions), and during runtime, label expression can be passed to choose the changeSets which match the expression. Refer to [Lables](https://www.liquibase.org/documentation/labels.html) documentation for more details.

- **Changelog Parameters**: Liquibase allows us to have place holders in changelogs, which can be dynamically substituted during runtime.
Refere [changelog parameters](https://www.liquibase.org/documentation/changelog_parameters.html)

Liquibase creates two tables `databasechangelog`  and `databasechangeloglock` when it runs in a database for the first time. It uses the `databasechangelog` table to keep track of the status of the execution of changeSets. It uses `databasechangeloglock` to prevent concurrent executions of Liquibase. Refer [how Liquibase works](https://www.liquibase.org/get_started/how-lb-works.html) for more details.

Now that we went through the basics of Liquibase let's see how to get Liquibase running in Spring Boot application.

## Liquibase with Spring Boot

### Setting up Liquibase in Spring Boot application

By default Spring Boot [auto configures Liquibase](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto-execute-liquibase-database-migrations-on-startup) when we add the following dependency to our build file.

For **maven** based Spring Boot project, add the following dependency in `pom.xml`.

   ```xml  
  <dependency>
    <groupId>org.liquibase</groupId>
    <artifactId>liquibase-core</artifactId>
    <version>3.8.8</version>
  </dependency>
   ```

For **Gradle** based Spring Boot project, add the following dependency in `build.gradle`.

  ```
  compile "org.liquibase:liquibase-core:3.8.8"
  ```

Spring Boot uses `DataSource` marked as `@Primary` to run Liquibase. In case you need to use a different `DataSource` mark that bean
as `@LiquibaseDataSource`. Alternatively `spring.liquibase.[url,user,password]`properties needs to be set, so that spring creates a Datasource on its own and uses it to auto-configure Liquibase.

**By default, Spring Boot runs Liquibase database migrations automatically on application startup**. It looks for a master changelog file in the folder `db/migration` within the classpath with the name `db.changelog-master.yaml`. If you prefer using other Liquibase changelog formats or use different file naming convention use `spring.liquibase.change-log` application property to set a master changelog file.

For example, to use `db/migration/my-master-change-log.json` as the master changelog file, set the following property in the application properties file, as shown below (for YAML application properties file).

```yaml
spring:
  liquibase:
    changeLog: "classpath:db/migration/my-master-change-log.json"
```
The master changelog can be used to [include](https://www.liquibase.org/documentation/include.html) other changelogs that need to run when the Spring boot application starts.

After adding required dependencies to our Spring Boot application, let's create our first database migration by following the below steps.
(Below demonstrates the creation of a new table `user_details` using Liquibase database migration)

- **Create the master changelog**:

    Create a file with name ```db.changelog-master.yaml``` and place it in `src/main/resources/db/changelog` folder(with content as below)
  ```yaml
  databaseChangeLog:
    - include:
        file: db/changelog/db.changelog-yaml-example.yaml
  ```

- **Create changelog with actual changeSet**:
    Create a changelog file `db.changelog-yaml-example.yaml` in the same directory where the master changelog created in the above step with the following content.

```yaml
databaseChangeLog:
  - changeSet:
      id: create-table-user
      author: liquibase-demo-service
      preConditions:
        - onFail: MARK_RAN
         # This preCondition checks that user_details table does not exists before
         # executing this change. If the table already exists, liquibase marks the
         # changeSet as run succuessfuly.      
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
<div class="notice success">
  In the above changeSet, we used changeType <b>createTable</b>, which abstracts the creation of a table. Liquibase will convert the above changeSet to appropriate SQL based on the database that application uses.
</div> 

Now that we added our first migration when Spring Boot application is run, it runs liquibase during the startup. Liquibase executes the changeSet which creates the `user_details` table with `user_pkey` as the primary key.

### Usage of Changelog parameters:

 Changelog parameters come in very handy when we want to abstract differences between environments while creating changelogs. These can be set using application property `spring.liquibase.paramaters`, which takes a map of key and value pairs. Below code demonstrates the usage of changelog parameters to select different data types while executing a changeSet in different environments.

The following application property file sets a liquibase parameter `textColumnType`. Spring profile `h2` defines
`VARCHAR(250)` as `textColumnType` and `docker` profile defines `TEXT` as `textColumnType`.

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
The changelog file below uses the liquibase parameter `textColumnType` to define the column type. When the application runs with `docker` profile it uses `TEXT` as the type and for `h2` profile it uses `VARCHAR(250)`.

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
<div class="notice warning">
 <h4>Warning</h4>
 <p>
  The code example assumes the usage of different types of databases in different environments for demonstrating the use of the changelog parameter. Please avoid using different types of databases for different staging environments, doing so will not help us to test code with the same environment as production in staging regions.
 </p> 
</div> 

### Usage of Liquibase context:
 
 As described earlier, context can be used to control which changeSets need to be run. The code example demonstrates the use of context in a changeSet, which is used to add test data load changeSet in a non-prod environment.

Below changeSet has context expression `test or local` with this the changeSet will be run when context is `test` or `local`.

 ```xml
<databaseChangeLog>
  <changeSet author="liquibase-docs" id="loadUpdateData-example" context="test or local">
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
Context values can be passed to liquibase using the property `spring.liquibase.contexts` as shown below 

```yaml
---
spring:
  profiles: docker
  liquibase:
    parameters:
      textColumnType: TEXT
    contexts: test
```


### Configure Liquibase in Spring Boot

Below is the list of all properties that Spring Boot provides to configure the behavior of Liquibase.

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

Enabling `INFO` level logging for liquibase will help to see the changeSets that liquibase executes during the start of the application. It also helps to identify that the application has not started yet because it is waiting to acquire changeloglock during the startup.


Add the following application property in the application properties file (yaml format is shown below).

```yaml
logging:
  level:
    "liquibase" : info
```

### Best practices while using Liquibase

- **Organizing Changelogs**: Create a master changelog file that does not have actual changeSets but includes other changelogs (only YAML, JSON, and XML support using include. It is not supported in SQL changelog). By doing so allows us to organize our changeSets in different changelog files. Every time we add a new feature to the application that requires a database change, we can create a new changelog file and include it in the master changelog.

Below is a sample directory structure to organize changelogs.

```
src:
 main:
  resources:
    db:
     changelog:
       db.changelog-master.yaml
       db.changelog-feature-1.yaml
       db.changelog-feature-2.yaml
       db.changelog-feature-3.yaml    
```
- **Changes per ChangeSet**: Have one change per changeSet, this allows easy rollback in case of a failure in applying the changeSet.

- **Modifying a ChangeSet**: Never modify a changeSet once it has been executed, add new changeSet if modifications are needed for the change that has been applied by an existing changeSet. Liquibase keeps track of the cksums of the changeSets that it already executed. If already executed changeSet is modified, liquibase by default will fail to execute that changeSet again, and it will not proceed with the execution of other changeSets.

- **ChangeSet Id**: Liquibase allows us to have a descriptive name for changeSets. Prefer using a unique descriptive name as the changeSetId instead of using a sequence number. They enable multiple developers to add different changeSets without worrying about the next sequence number they need to select for the changeSetId.

- **Reference data management**: Do use liquibase to populate reference data and code tables that the application needs. Doing so allows deploying application and configuration data it needs together.
Liquibase provides changeType [loadUpdateData](https://www.liquibase.org/documentation/changes/load_update_data.html) to support this.

- **Use Preconditions**: Have preconditions for changeSets. They ensure that liquibase checks the database state before applying the changes.

- **Test Migrations**: Make sure you always test the migrations that you have written locally before applying them in real nonproduction or production environment. Always use liquibase to run database migrations in nonproduction or production environment instead of manually performing database changes.


Running liquibase automatically during the Spring Boot application startup makes it easy to ship application code changes and database changes together. But in instances like adding indexes to existing database tables with lots of data, the application might take a longer time to start. One of the option is to pre-release the database migrations (releasing database changes ahead of code that needs it) and run them asynchronously. Jhipster demonstrates on how to run [liquibase asynchronously in Spring Boot application](https://github.com/jkutner/jhipster-example/blob/master/src/main/java/com/mycompany/myapp/config/liquibase/AsyncSpringLiquibase.java)

## Other ways of Running Liquibase

Liquibase supports a range of other options to run database migrations apart from Spring Boot integration:

* via [Maven plugin](https://www.liquibase.org/documentation/maven/index.html)
* via [Gradle plugin](https://github.com/liquibase/liquibase-gradle-plugin#usage)
* via [Command line](https://www.liquibase.org/documentation/command_line.html)
* via [JEE CDI Integration](https://www.liquibase.org/documentation/cdi.html)
* via [Servlet Listener](https://www.liquibase.org/documentation/servlet_listener.html)

Liquibase has [Java Api](https://www.liquibase.org/javadoc/index.html) that can be used in any java based application to perform database migrations.

## Conclusion

Liquibase helps to automate database migrations, and Spring Boot makes it easier to use liquibase. This guide
provides details on how to use liquibase in Spring Boot application and some best practices.

You can find the example code on [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/data-migration/liquibase).

Another popular alternative of Liquibase is [Flyway](https://flywaydb.org/), check this [guide on using flyway in Spring Boot](https://reflectoring.io/database-migration-spring-boot-flyway).