---
title: Testing Database Migration with Spring Boot and Testcontainers
categories: [spring-boot]
date: 2020-04-23 05:00:00 +1100
modified: 2020-04-23 05:00:00 +1100
author: artur
excerpt: "Testcontainers"
image:
  auto: 0069-testcontainers
---

Database migration with tools like Flyway requires creating SQL scripts.
Although the database is an external dependency, we have to test the SQL scripts, because it is our code.
But this code doesn't run in the application, that we develop. That's why it is hard to test this code with unit tests.
This article shows how to test migration with Flyway in a Spring Boot application and to keep the tests close to production.

## Common practice
There is a very good approach for testing migration with Flyway at build time. It is a combination of 
Flyway migration support in Spring Boot and an In-Memory database like `H2`. In this case, the migration begins
whenever the spring context starts, and the SQL scripts are migrated to an `H2` database with Flyway.
It is easy and fast.

## Problem
`H2` is not the database in the production or on another production-like environment. When we test the migration
with the `H2` database, we have no idea about how the migration would run in the production environment.

<div class="notice success">
  <h4>In-Memory Database in Production</h4>
  <p>
  If we use an in-memory database in production, we can just test the application with an integrated database like `H2`.
  These tests are completely valid and meaningful.  
  </p>
</div>

`H2` database has compatibilities modes to other databases, that can be used in production, but there are still differences. It means, the SQL code for a 
`H2` can look different from the code for PostgresSQL.

Imagine we have an SQL script:

```sql
CREATE TABLE car
(
    id    uuid PRIMARY KEY,
    registration_number VARCHAR(255),
    name  varchar(64) NOT NULL,
    color varchar(32) NOT NULL,
    registration_timestamp INTEGER
);
``` 
This script can run as well with `H2` as with `PostgreSQL`. Now we wan to change the type
of the column `registration_timestamp` from `INTEGER` to `timestamp with time zone` and of course we want to migrate the data
in this column. We can write an SQL script for migrating `registration_timestamp`:

````sql
ALTER TABLE car
  ALTER COLUMN registration_timestamp SET DATA TYPE timestamp with time zone
     USING
       timestamp with time zone 'epoch' +
            registration_timestamp * interval '1 second';
````

This script **will not work** for `H2`, because the `USING` clause doesn't work with `ALTER TABLE` for `H2`. 
At this moment we could take a not clean way and create two sets of SQL scripts for migration.
It could look like this: 

![Two sets of SQL scripts.](/assets/img/posts/testcontainers/two_sets_of_sql_scripts.png)

Now we :
 * have to maintain two sets of scripts,
 * are not able to test scripts from the folder `postgresql` at runtime.
    

