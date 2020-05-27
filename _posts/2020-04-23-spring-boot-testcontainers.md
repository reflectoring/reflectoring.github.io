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

Database migration with tools like [Flyway](/database-migration-spring-boot-flyway/) requires creating SQL scripts.
Although the database is an external dependency, we have to test the SQL scripts, because it is our code.
But this code doesn't run in the application that we develop. That's why this code cannot be tested with unit tests.
This article shows how to test database migration scripts with Flyway and Testcontainers in a Spring Boot application and to keep the tests close to production.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/testcontainers" %}

## Common Practice
There is a very common and convenient approach for testing database migration scripts with Flyway at build time. 

It's a combination of 
Flyway migration support in Spring Boot and an in-memory database like `H2`. In this case, the database migration begins
whenever the Spring application context starts, and the SQL scripts are run on an `H2` database with Flyway.

It's easy and fast. But is it good?

## The Problem of Using an in-memory Database for Tests
`H2` is usually not the database we use in production or in other production-like environments. When we test the SQL scripts
with the `H2` database, we have no idea about how the migration would run in the production environment.

<div class="notice success">
  <h4>in-memory Database in Production</h4>
  <p>
  If we use an in-memory database in production, this approach is fine. We can just test the application with an integrated database like <code>H2</code>.
  In this case, these tests are completely valid and meaningful.  
  </p>
</div>

`H2` has compatibility modes to disguise as other databases. This may include our production database. With these modes we can
start the `H2` database and it will, for example, behave like a `PostgreSQL` database. 

But there are still differences. The SQL code for a `H2` might still look different from the code for `PostgresSQL`.

Let's look at this SQL script:

```sql
CREATE TABLE car
(
  id  uuid PRIMARY KEY,
  registration_number VARCHAR(255),
  name  varchar(64) NOT NULL,
  color varchar(32) NOT NULL,
  registration_timestamp INTEGER
);
``` 
This script can run on an `H2` as well as on a `PostgreSQL` database. 

Now we want to change the type
of the column `registration_timestamp` from `INTEGER` to `timestamp with time zone` and of course we want to migrate the data
in this column. So, we write an SQL script for migrating the `registration_timestamp` column:

````sql
ALTER TABLE car
  ALTER COLUMN registration_timestamp SET DATA TYPE timestamp with time zone
   USING
     timestamp with time zone 'epoch' +
      registration_timestamp * interval '1 second';
````

This script **will not work** for `H2` with `PostgreSQL` mode, because the `USING` clause doesn't work with `ALTER TABLE` for `H2`.

Depending on the database we have in production, we might have database-specific features in the SQL scripts.
Another example would be using table inheritance in `PostgreSQL` with the keyword `INHERITS`, which isn't supported in
other databases.

We could, of course, maintain two sets of SQL scripts, one for `H2`, to be used in the tests, and one for `PostgreSQL`, to be used in production:

![Two sets of SQL scripts.](/assets/img/posts/testcontainers/two_sets_of_sql_scripts.png)

But now, we:
 * have to configure Spring Boot profiles for different folders with scripts,
 * have to maintain two sets of scripts,
 * and most importantly, **are not able to test scripts from the folder `postgresql` at build time**.
 
If we want to write a new script with some features that are not supported by `H2`,
we have to write two scripts, one for `H2` and one for `PostgreSQL`. Also,
we have to find a way to achieve the same results with both
scripts.

If we test the database scripts with the `H2` database, and our test is green, we don't know anything about the script `V1_2__change_column_type.sql` from the
folder `postgresql`.

These tests would give us a false sense of security!

## Using a Production-Like Environment for Testing Database Scripts
There is another approach for testing database migration: we can test database migration with `H2` database at build time.

After that, we can deploy our application in a production-like environment and let the migration run on this environment with 
the production-database like, for example, `PostgreSQL`.

This approach still has drawbacks:

* Bugs are discovered too late,
* it is hard to find errors,
* and we still have to maintain two sets of SQL scripts.

Let's imagine that we test the migration with the `H2` database during build-time of the application, and the tests are green.
The next step is delivering and deploying the application to a test environment. It takes time. If the migration on the test environment fails,
we get to know it too late, maybe several minutes later. It slows down the development cycle.

Also, this situation is very confusing for developers, because we can't debug errors like in our unit test.
Our unit test with `H2` was green, after all, and the error only happened on the test environment.

## Using Testcontainers 
With [Tescontainers](https://www.testcontainers.org/) we can test the database migration against a [Docker](https://www.docker.com/) container of the production database from our code. On the developer machine or on the CI server.

`Tescontainers` is a Java library, that makes it easy to start up a Docker container from within our tests.

Of course, we'll have to install Docker to run it. After that we can create an initialization code for testing:

````java
@ContextConfiguration(
  initializers=AbstractIntegrationTest.Initializer.class)
public class AbstractIntegrationTest {

  static class Initializer
      implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>();

    public static Map<String, String> getProperties() {
      Startables.deepStart(Stream.of(postgres)).join();
      // we can add further containers here like rabbitmq
      // or other databases

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
          (Map) getProperties());

      environment.getPropertySources().addFirst(testcontainers);
    }
  }
}
```` 
The class `AbstractIntegrationTest` is an abstract class that defines a `PostgreSQL` database and configures 
the connection to this database. Other classes can extend this class and use the database for tests. 

In the `@ContextConfiguration` annotation we define how to load and configure an `ApplicationContext` for integration tests.
Then, we implement the `ApplicationContextInitializer` interface for initializing a Spring context.
In this implementation, we create a `PostgresSQL` database, configure the connection to the database,
and add this configuration to the Spring context, so that Spring knows which database to connect to in the tests.

In the method `initialize()` we set the properties of the Spring Context. The method `addFirst()`
adds the properties to the contexts with the highest precedence.

The method `getProperties()` does two important things:
* it starts the Docker container with `PostgeSQL` database, and
* it creates a `Map` with the properties for connecting this database.

The method `deepStart()` starts all items of the `Stream` in parallel. It can be many different
Docker containers, for instance, `RabbitMQ`, `Keycloak`, or another database. To keep it simple, let's start only one
Docker container with the `PostgreSQL`.

**The URL to the database, username, and password are created by the `Tescontainers` automatically**. Hence, we don't need to configure them ourselves.
But we have to read this configuration and add it to the Spring context. We do this by creating the `Map` in the method
`getProperties()` and passing it on to Spring in `initialize()`. 

It's also possible to set these parameters manually in the code, but it's better to let Testcontainers generate them.
When we let Testcontainers generate the `jdbcUrl`, it includes the port of the database connection. The random port provides 
stability and avoids possible conflicts on the machine of another developer or a build server.

The code will first start all containers we defined in the method `deepStart()` and after that start the 
Spring Boot application with the configured connection to the containers. In our case, the `PostgreSQL` database.
This Docker container can be reused from all unit tests.

Now, if we want to test migration, we have to extend the class and create a unit test.

````java
@SpringBootTest
class TestcontainersApplicationTests extends AbstractIntegrationTest {

  @Test
  void migrate() {
    // migration starts automatically, since Spring Boot runs the Flyway scripts on startup
  }

}
````
 
The class `AbstractIntegrationTest` can be used not only for migration test but also for JPA tests or for starting 
the application locally with all dependencies without having to run `docker-compose` manually.
 
Now we can test the migration of SQL scripts with Flyway by using a `PostgreSQL` database at build time. 

**We have all dependencies in our code**.
 
## Drawbacks
 
As we mentioned above, we have to install Docker on every machine where we want to build the application.
It could be a laptop of a developer, or a CI build server.

Also, tests interacting with `Tescontainers` are slower than the same test with an in-memory database, because the Docker container has to be spun up.

## Conclusion

`Testcontainer` supports testing the application with unit tests using Docker containers with minimal effort.

Database migration tests with `Testcontainers` provide production-like database behavior and improve the quality of the tests significantly.
 
There is no need to use an in-memory database for tests, that is not used in production.   
 

