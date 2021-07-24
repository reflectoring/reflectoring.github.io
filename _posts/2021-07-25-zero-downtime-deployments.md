---
title: "Zero Downtime Database Changes with Feature Flags"
categories: [spring-boot]
date: 2021-07-22 00:00:00 +1100
modified: 2021-07-22 00:00:00 +1100
excerpt: ""
image:
  auto: 0018-cogs
---


## The Problem: Coordinating Database Changes with Code Changes

- add a column: the new code expects the new database column
- rename a column: the old code expects the old column, the new code expects the new column
- delete a column: the old code still expects the column to exist
- problems:
  - what if a deployment goes south? do we have to roll back the database change?
  - what if one application node is still running the old code and one is already running the new code (which may happend during a rolling, no-downtime deployment)


## Example Use Case: Splitting One Database Column into Two

![Initial state](/assets/img/posts/zero-downtime/initial-state.png)
  
## Step 1: Decouple Database Changes from Code Changes

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

## Step 2: Deploy New Code

![State 1](/assets/img/posts/zero-downtime/state-1.png)

## Step 3: Add New Database Columns
![State 2](/assets/img/posts/zero-downtime/state-2.png)

## Step 4: Activate Writes into the New Columns
![State 2](/assets/img/posts/zero-downtime/state-3.png)

## Step 5: Migrate Data into the New Columns
![Database migration](/assets/img/posts/zero-downtime/migration.png)

## Step 6: Activate Reads from the New Columns
![State 3](/assets/img/posts/zero-downtime/state-4.png)

## Step 7: Remove the Old Code and Column
![Final state](/assets/img/posts/zero-downtime/final-state.png)