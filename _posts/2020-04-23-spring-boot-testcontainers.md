---
title: Testing Database Migration with Spring Boot and Testcontainers
categories: [spring-boot]
date: 2020-04-23 05:00:00 +1100
modified: 2020-04-23 05:00:00 +1100
author: artur
excerpt: "Testcontainers"
image:
  auto: 0064-password
---

Database migration with tools like Flyway requires creating SQL scripts.
Although the database is an external dependency, we have to test the SQL scripts, because it is our code.
But this code doesn't run in the application, that we develop. That's why it is hard to test this code with unit tests.
This article shows how to test a migration with Flyway in a Spring Boot application and to keep the tests production close.

## Common practice
There is a very good approach for testing migration with Flyway at build time. It is combination of 
Flyway migration support in Spring Boot and an In-Memory database like `H2`. In this case the migration begins
every time when the spring context starts, and the SQL scripts are migrated to a `H2` database with Flyway.
It is easy and fast.

## Problem
`H2` is not the database in the production or on another production-like environment. When we test the migration
with `H2` database, we have no idea about how the migration would run in the production environment.

<div class="notice success">
  <h4>In-Memory Database in Production</h4>
  <p>
  If we use a in-memory database in production, we can just test the application with the integrated database like `H2`.
  These tests are completely valid and meaningful.  
  </p>
</div>

`H2` database has compatibilities modes to other databases, that can be used in production, but there are still differences. It means the SQL code for a 
`H2` can look different from the code for PostgresSQL. At this moment we could take a not clean way and create two sets of SQL scripts for migration. 

    

