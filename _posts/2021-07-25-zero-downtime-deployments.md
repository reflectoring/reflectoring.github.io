---
title: "Zero Downtime Database Changes with Feature Flags - Step by Step"
categories: [spring-boot]
date: 2021-07-22 00:00:00 +1100
modified: 2021-07-22 00:00:00 +1100
excerpt: ""
image:
  auto: 0018-cogs
---


## The Problem: Coordinating Database Changes with Code Changes

Whenever we make a change in our database schema, we also have to make a change in the code that uses that database schema.

When we add a new column to the database, we need to change the code to use that new column.

When we delete a column from the database, we need to change the code to not use that column anymore.

If we release both the change of the database and the change of the code at the same time, we double the risk that something goes wrong. We have coupled the risk of the database change with the risk of the code change.

Usually, our application runs on multiple nodes and during a new release the new code is deployed to one node at a time. This is often called a rolling or round-robin deployment with the goal of zero downtime. During the deployment there will be nodes with the old code that is not compatible to the new database schema! How can we handle this?

What do we do when the deployment of the code change failed, because we have introduced a bug? We have to roll back to the old version of the code. But the old version of the code may not be compatible with the database anymore, because we have already applied the database change! So we have to rollback the database change, too! The rollback in itself bears some risk of failure, because a rollback is often not a well-planned and well-rehearsed activity. How can we improve this situation?

The answer to these questions is to decouple the database changes from the code changes using feature flags. 

With feature flags, we can deploy database changes and code any time we want, and activate them at any time after the deployment.

This tutorial provides a step-by-step guide on how to release database changes and the corresponding code changes safely and with no downtime using Spring Boot, Flyway, and feature flags implemented with [LaunchDarkly](https://launchdarkly.com).

## Example Use Case: Splitting One Database Column into Two

As the example use case we're going to split a database column into two. 

Initially, our application looks like this:

![Initial state](/assets/img/posts/zero-downtime/initial-state.png)

We have a `CustomerController` that provides a REST API for our Customer entities. It uses the `CustomerRepository`, which is a Spring Data repository that maps entries in the `CUSTOMER` database table to objects of type `Customer`. The `CUSTOMER` table has the columns `id`, and `address` for our example.

The `address` column contains both the street name and street number in the same field. Imagine that due to some new requirements, we have to split up the `address` column into two columns: `streetNumber` and `street`. 

In this guide, we'll go through all the changes we need to do to the database and the code and how to release them as safely as possible using feature flags and multiple deployments.

  
## Step 1: Decouple Database Changes from Code Changes

Before we even start with changing code or the database schema, we'll want to decouple the execution of database changes from the deployment of a Spring Boot app.

By default, Flyway executes database migration on application startup. This is very convenient, but gives us little control. What if the database change is incompatible with the old code? During the rolling deployment, there may be nodes with the old codes still using the database!

We want full control over when we execute our database schema changes! With a little tweak to our Spring Boot application, we can achieve this.

First, we disable Flyway's default to execute database migrations on startup:

```java
@Configuration
class FlywayConfiguration {

    private final static Logger logger = LoggerFactory.getLogger(FlywayConfiguration.class);

    @Bean
    FlywayMigrationStrategy flywayStrategy() {
        return flyway -> logger.info("Flyway migration on startup is disabled! Call the endpoint /flywayMigrate instead.");
    }

}
```

Instead of executing all database migrations that haven't been executed, yet, it will now just print a line to the log saying that we should call an HTTP endpoint instead.

But we also have to implement this HTTP endpoint:

```java
@RestController
class FlywayController {

    private final Flyway flyway;

    public FlywayController(Flyway flyway) {
        this.flyway = flyway;
    }

    @GetMapping("/flywayMigrate")
    String flywayMigrate() {
        flyway.migrate();
        return "success";
    }

}
```

Whenever we call `/flywayMigrate` via HTTP get now, Flyway will run all migration scripts that haven't been executed, yet. Note that you should protect this endpoint in a real application, so that not everyone can call it.

With this change in place, we can deploy a new version of the code without changing the database schema just yet.

## Step 2: Deploy the New Code

![State 1](/assets/img/posts/zero-downtime/state-1.png)

## Step 3: Add the New Database Columns
![State 2](/assets/img/posts/zero-downtime/state-2.png)

## Step 4: Activate Writes into the New Columns
![State 2](/assets/img/posts/zero-downtime/state-3.png)

## Step 5: Migrate Data into the New Columns
![Database migration](/assets/img/posts/zero-downtime/migration.png)

## Step 6: Activate Reads from the New Columns
![State 3](/assets/img/posts/zero-downtime/state-4.png)

## Step 7: Remove the Old Code and Column
![Final state](/assets/img/posts/zero-downtime/final-state.png)