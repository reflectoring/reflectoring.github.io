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

{% include github-project.html url="https://github.com/arkuksin/code-examples/tree/testcontainers" %}

## Common practice
There is a very good approach for testing migration with Flyway at build time. It is a combination of 
Flyway migration support in Spring Boot and an In-Memory database like `H2`. In this case, the migration begins
whenever the Spring Context starts, and the SQL scripts are migrated to an `H2` database with Flyway.
It is easy and fast.

## Problem of In-Memory Database 
`H2` is not the database in the production or on another production-like environment. When we test the migration
with the `H2` database, we have no idea about how the migration would run in the production environment.

<div class="notice success">
  <h4>In-Memory Database in Production</h4>
  <p>
  If we use an In-Memory database in production, we can just test the application with an integrated database like `H2`.
  These tests are completely valid and meaningful.  
  </p>
</div>

`H2` database has compatibilities modes to other databases, that can be used in production, but there are still differences. It means, the SQL code for a 
`H2` can look different from the code for `PostgresSQL`.

Let's imagine we have an SQL script.

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
in this column. We can write an SQL script for migrating `registration_timestamp`.

````sql
ALTER TABLE car
  ALTER COLUMN registration_timestamp SET DATA TYPE timestamp with time zone
     USING
       timestamp with time zone 'epoch' +
            registration_timestamp * interval '1 second';
````

This script **will not work** for `H2`, because the `USING` clause doesn't work with `ALTER TABLE` for `H2`.
Depending on the database, that we have in production, we can have database-specific features in the SQL script.
For example, we can build table inheritance in `PostgreSQL` using the keyword `INHERITS`, but it doesn't work in 
other databases.
At this moment we could take a not clean way and create two sets of SQL scripts for migration.
It could look like this.

![Two sets of SQL scripts.](/assets/img/posts/testcontainers/two_sets_of_sql_scripts.png)

Now we :
 * have to configure Spring Boot profiles for different folders with scripts,
 * have to maintain two sets of scripts,
 * are not able to test scripts from the folder `postgresql` at build time.
 
If we want to write a new script with some features, that are not supported by `H2`,
we have to write another script for `H2` and find a way to achieve the same results with both
scripts.

If we test the migration with `H2` database, and our test is green, we don't know anything about the script `V1_2__change_columnt_type.sql` from
folder `postgresql`.

Again, even when we don't have different sets of scripts for the migration, the green test doesn't mean, that they can run
on the `PostgresSQL` database.

## Using Production-Like Environment for Migration Tests 
There is another approach for testing database migration. First, we can test migration with `H2` database at build time.
After that, we can deploy our application in a production-like environment and let the migration run on this environment with 
the database like in production, for example, `PostgreSQL`.

This approach has a couple of drawbacks:

* Bugs are discovered too late,
* it is hard to find errors.

Let's imagine, we test the migration with `H2` database during building the application, and the tests are green.
The next step is delivering and deploying the application to a test environment. It takes time. If the migration on the test environment fails,
we know it too late, maybe several minutes later. It slows down the development cycle.

Also, this situation is very confusing, because we can't debug this error with our unit test. But our unit test with `H2` was green.

## Solution with Testcontainers
With [Tescontainers](https://www.testcontainers.org/) we can test the database migration with [Docker](https://www.docker.com/) from our code.
`Tescontainers` is a Java library, that provides unit testing with Docker.
Of course, we have to install Docker wherever we want to build the application. After that we can create an initialization code for testing:

````java
@ContextConfiguration(initializers 
                               = AbstractIntegrationTest.Initializer.class)
public class AbstractIntegrationTest {

    static class Initializer
            implements ApplicationContextInitializer
                        <ConfigurableApplicationContext> {

        static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>();

        public static Map<String, String> getProperties() {
            Startables.deepStart(Stream.of(postgres)).join();
            // we can add further containers here like rabbitmq
            //or other database

            return Map.of(
                    "spring.datasource.url", postgres.getJdbcUrl(),
                    "spring.datasource.username", postgres.getUsername(),
                    "spring.datasource.password", postgres.getPassword()
            );
        }


        @Override
        public void initialize(ConfigurableApplicationContext
                                           applicationContext) {
            ConfigurableEnvironment environment 
                                = applicationContext.getEnvironment();
            MapPropertySource testcontainers = new MapPropertySource(
                    "testcontainers",
                    (Map) getProperties()
            );
            environment.getPropertySources().addFirst(testcontainers);
        }
    }
}
```` 
The class `AbstractIntegrationTest` is an abstract class, that defines a `PostgreSQL` database and configures 
the connection to this database. Other classes can extend this class and use the database for tests. 

In the `@ContextConfiguration` annotation we define how to load and configure an `ApplicationContext` for integration tests.
Then, we implement the `ApplicationContextInitializer` interface for initializing a Spring Context.
In this implementation, we create a `PostgresSQL` database, configure the connection to the database,
and add this configuration to the Spring Context, that should be loaded for the tests.

In the method `initialize` we set the properties of the Spring Context. The method `addFirst`
adds the properties to the contexts with the highest precedence.

The method `getProperties` makes two important steps:
* starts the docker container with `PostgeSQL` database,
* creates a `Map` with the properties for connecting this database.

The method `deepStart` starts all items of the `Stream` recursively and asynchronously. It can be many different
docker containers, for instance, `RabbitMQ`, `Keycloak`, or another database. To keep it simple, let's start only one
docker container with the `PostgreSQL`.

**The URL to the database, username, and password are created by the `Tescontainers` automatically**. Hence, we don't need to configure it.
But we have to read this configuration and add it to the current context. We do it by creating the `Map` in the method
`getProperties`. It is also possible to set these parameters manually in the code, but it is better to let generate them.
When we generate the `jdbcUrl`, it includes the port of the database connection. The random port provides 
stability and avoid possible conflicts on the machine of another developer or a build server.

The code will first start all containers, we defined in the method `deepStart` and after that start the 
Spring Boot application with configured connection to the containers. In our case, the `PostgreSQL` database.
This docker container can be reused from all unit tests.

Now, if we want to test migration, we have to extend the class and create a unit test.

````java
@SpringBootTest
class TestcontainersApplicationTests extends AbstractIntegrationTest {

    @Test
    void migrate() {
        // migration starts automatically
    }

}
````
 
The class `AbstractIntegrationTest` can be used not only for migration test but also for JPA tests or for starting 
the application locally with all dependencies without `docker-compose`.
 
Now we can test the migration of SQL scripts with Flyway by using a `PostgreSQL` database at build time. 
**We have all dependencies in our code**
 
## Drawbacks
 
As we mentioned above, we have to install the docker on every machine, where we want to build the application.
It could be a laptop of a developer, or a CI build server.

The test for migration with `Tescontainers` is slower than the same test with an In-Memory database.

But it improves the stability of the build, and the quality of the tests significant.

## Conclusion

`Testcontainer` supports testing the application with unit tests using docker containers with minimal effort.
The migration test with `Testcontainers` provides behavior like on the production environment. There is no need to use
an In-Memory database for tests, that is not used in production.   
 

