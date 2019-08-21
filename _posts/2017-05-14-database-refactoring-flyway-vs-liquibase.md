---

title: 'Tool-based Database Refactoring: Flyway vs. Liquibase'
categories: [java]
modified: 2017-05-14
excerpt: "A comparison of Flyway and Liquibase - the two most popular tools for database refactoring."
image: 0046-rack
---



In a [previous blog post](/tool-based-database-refactoring/) I discussed the term "database refactoring" and some concepts that allow
database refactoring to be supported by tools with the result of having a database schema that is 
versioned just like your software is. In this post I would like to discuss [Flyway](https://flywaydb.org/)
and [Liquibase](http://www.liquibase.org/) - 
both popular java-based tools that support database refactoring. The goal of this post is to
find out which tool is better suited in which scenario.

## Flyway
Flyway's concept centers around [six different commands](https://flywaydb.org/documentation/)
to provide support for automated database refactoring and versioning. These commands can be 
executed from the command line, from a build process (e.g. with Maven or Gradle) or directly
from Java code, using the API. When executing a command you have to provide the database
connection parameters (url, username, password) of the target database that you want to
refactor. 

The main command is named `migrate` and does exactly what database refactoring is all about:
it looks in a specified folder full of sql scripts (each with a version number in the file name)
and checks which of these scripts has already been applied to the target database. It then 
executes those scripts that have not yet been applied. In case of inconsistencies, e.g. when
a script that has already been applied has been changed in the meantime, Flyway aborts processing
with an error message.

A unique feature of Flyway is that you can provide migration scripts not only in SQL format
but also as Java code. This way, you can implement complex and dynamic database migrations.
This feature should be used with caution, however, since the dynamic database migrations are
hard to debug if anything goes wrong.

The central `migrate` command is supplemented by a set of additional commands that make
the database refactoring life a little easier. 

The `info` command
shows all currently available migration scripts from the specified folder and lists which scripts
have already been applied and which are still due to be applied on the target database.
 
To check if the migration scripts that were applied to the target database have been changed 
in the meantime, you can run the `validate` command. We want to know if a script in the script folder has been
changed since being applied to the target database, because this may mean that the script has been
applied to different databases in different versions, which is a source of trouble.

If you decide that your scripts should be applied in spite of a failing `validate` command, you can
run the `repair` command. This command resets the database table used by Flyway to store which
scripts have been applied (this table is called SCHEMA_VERSION by default).

Last but not least, the `clean` command empties the target schema completely (should only be used on test 
databases, obviously).

## Liquibase

Liquibase follows a different concept to implement database refactoring. While Flyway supports 
migration scripts in SQL and Java format only, Liquibase abstracts away from SQL completely and
thus decouples database refactoring from the underlying database technology.

Instead of SQL scripts, Liquibase supports migration scripts in XML, YAML and JSON format.
In these scripts you define the changes to a database on an abstract level. For each change,
Liquibase supports a corresponding element in YML, YAML and JSON. A change that creates a new
database table in YAML format looks like this, for example:

```yaml
createTable:
    tableName: Customer      
    columns:
      - column:
          name: name
          type: varchar(255)
      - column:
          name: address
          type: varchar(255)
```

Changes like "add column", "create index" or "alter table" and many others are available
in a similar fashion.

When executed, Liquibase automatically applies all scripts that have not yet been
applied and stores the metadata for all applied scripts in a special database table - very similar to Flyway.
Also very similar to Flyway, Liquibase can be called via command line, build tools or directly
via its Java API.

## When to use which Tool?

Both Flyway and Liquibase support all features that you need for professional database refactoring and
versioning, so you will always know which version of the database schema you are
dealing with and if it matches to the version of your software. Both tools are integrated in
Maven or Gradle build scripts and in the Spring Boot ecosystem so that you can fully automate
database refactoring.
 
Flyway uses SQL to define database changes, and thus you can tailor your SQL scripts to work
well with the underlying database technology like Oracle or PostgreSQL. With Liquibase on the other
hand, you can introduce an abstraction layer by using XML, YAML or JSON to define your database changes.
Thus, Liquibase is better suited to be used in a software product that is installed in different
environments with different underlying database technologies. If you want to have full control
over your SQL, however, Flyway is the tool of choice since you can change the database with
fully tailored SQL or even Java code.

The catch with both tools is that both are mainly maintained by a single person and not by a
large team. This may have a negative impact on future development of both tools, but doesn't have
to. At the time of this writing, activity in [Flyway's GitHub repository](https://github.com/flyway) is higher that in the
[Liquibase repository](https://github.com/liquibase), however.
 



