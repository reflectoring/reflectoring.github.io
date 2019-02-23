---
title: "Testing JPA Queries with `@DataJpaTest`"
categories: [java]
modified: 2019-02-03
last_modified_at: 2019-02-03
author: tom
tags: 
comments: true
ads: true
excerpt: "An in-depth tutorial about Spring Boot's support for testing JPA database queries."
sidebar:
  toc: true
---

{% include sidebar_right %}

Aside from unit tests, integration tests play a vital role in producing quality software.
A special kind of integration test deals with the integration between our code
and the database. 

With the `@DataJpaTest` annotation, Spring Boot provides a convenient way to set up
an environment with an embedded database to test our database queries against.

In this tutorial, we'll first discuss which types of queries are worthy of tests and then
discuss different ways of creating a database schema and database state to test against.

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-testing" %}

## The "Testing with Spring Boot" Series

This tutorial is part of a series:

1. [Unit Testing with Spring Boot](/unit-testing-spring-boot/)
2. [Testing Spring MVC Web Controllers with `@WebMvcTest`](/spring-boot-web-controller-test/)
3. [Testing JPA Queries with `@DataJpaTest`](/spring-boot-data-jpa-test/)
4. [Integration Tests with `@SpringBootTest`](/spring-boot-test/)

## Dependencies

In this tutorial, aside from the usual Spring Boot dependencies, 
we're using JUnit Jupiter as our testing framework and 
H2 as an in-memory database. 

```groovy
dependencies {
  compile('org.springframework.boot:spring-boot-starter-data-jpa')
  compile('org.springframework.boot:spring-boot-starter-web')
  runtime('com.h2database:h2')
  testCompile('org.springframework.boot:spring-boot-starter-test')
  testCompile('org.junit.jupiter:junit-jupiter-engine:5.2.0')
}
```
## What to Test?

The first question to answer to ourselves is what we need to test.
Let's consider a Spring Data repository responsible for `UserEntity`
objects:

```java
interface UserRepository extends CrudRepository<UserEntity, Long> {
  // query methods
}
```

We have different options to create queries. Let's look at some of those 
in detail to determine if we should cover them with tests.

### Inferred Queries

The first option is to create an *inferred query*:

```java
UserEntity findByName(String name);
```

We don't need
to tell Spring Data what to do, since it automatically infers the
SQL query from the name of the method name.

What's nice about this feature is that **Spring Data also automatically
checks if the query is valid at startup**. If we renamed the method
to `findByFoo()` and the `UserEntity` does not have a property `foo`,
Spring Data will point that out to us with an exception:

```
org.springframework.data.mapping.PropertyReferenceException: 
  No property foo found for type UserEntity!
```

**So, as long as we have at least one test that tries to start up the 
Spring application context
in our code base, we do not need to write an extra test for our inferred
query.**

Note that this is not true for queries inferred from long method
names like
`findByNameAndRegistrationDateBeforeAndEmailIsNotNull()`. 
This method name is hard to grasp and easy to get wrong, so we should
test if it really does what we intended. 

Having said this, it's good practice to rename such methods to a shorter,
more meaningful name and add a `@Query` annotation to provide a custom
JPQL query.

### Custom JPQL Queries with `@Query`

If queries become more complex, it makes sense to provide a custom JPQL
query:

```java
@Query("select u from UserEntity u where u.name = :name")
UserEntity findByNameCustomQuery(@Param("name") String name);
```

**Similar to inferred queries, we get a validity check for those
JPQL queries for free**. Using Hibernate as our JPA provider, 
we'll get a `QuerySyntaxException` on startup if it found an
invalid query:


```
org.hibernate.hql.internal.ast.QuerySyntaxException: 
  unexpected token: foo near line 1, column 64 [select u from ...]
```

Custom queries, however, can get a lot more complicated than
finding an entry by a single attribute. They might include
joins with other tables or return complex DTOs instead of an entity,
for instance. 

So, should we write tests for custom queries? The unsatisfying answer
is that **we have to decide for
ourselves if the query is complex enough to require a test.** 

### Native Queries with `@Query`

Another way is to use a *native query*:

```java
@Query(
  value = "select * from user as u where u.name = :name",
  nativeQuery = true)
UserEntity findByNameNativeQuery(@Param("name") String name);
```

Instead of specifying a JPQL query, which is an abstraction over SQL, we're 
specifying an SQL query directly. This query may use 
a database-specific SQL dialect. 

It's important to note that **neither Hibernate nor Spring Data
validate native queries at startup**. Since the query may contain
database-specific SQL, there's no way Spring Data or Hibernate
can know what to check for. 

So, native queries are prime candidates for integration tests. However,
if they really use database-specific SQL, those tests 
might not work with the embedded in-memory database, so we would 
have to provide a real database in the background (for instance 
in a docker container that is set up on-demand in the continuous integration 
pipeline). 
  
## `@DataJpaTest` in a Nutshell

To test Spring Data JPA repositories, or any other JPA-related components for 
that matter, Spring Boot provides the [`@DataJpaTest`](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/autoconfigure/orm/jpa/DataJpaTest.html)
annotation. We can just add it to our unit test and it will set up
a Spring application context: 

```java
@ExtendWith(SpringExtension.class)
@DataJpaTest
class UserEntityRepositoryTest {

  @Autowired private DataSource dataSource;
  @Autowired private JdbcTemplate jdbcTemplate;
  @Autowired private EntityManager entityManager;
  @Autowired private UserRepository userRepository;

  @Test
  void injectedComponentsAreNotNull(){
    assertThat(dataSource).isNotNull();
    assertThat(jdbcTemplate).isNotNull();
    assertThat(entityManager).isNotNull();
    assertThat(userRepository).isNotNull();
  }
}
```

<div class="notice--success">
  <h4><code>@ExtendWith</code></h4>
  <p>
  The code examples in this tutorial use the <code>@ExtendWith</code> annotation to tell
  JUnit 5 to enable Spring support. As of Spring Boot 2.1, we no longer need to
  load the `SpringExtension` because it's included as a meta annotation in the 
  Spring Boot test annotations like <code>@DataJpaTest</code>, <code>@WebMvcTest</code>, and 
  <code>@SpringBootTest</code>.
  </p>
</div> 

The so created application context will not contain the whole context
needed for our Spring Boot application, but instead only a "slice"
of it containing the components needed to initialize any JPA-related
components like our Spring Data repository.

We can, for instance, inject a `DataSource`, `@JdbcTemplate` or
`@EntityManager`into our test class if we need them. 
Also, we can inject any of the Spring Data repositories from our application.
All of the above components will be automatically configured 
to point to an embedded, in-memory database instead of the
"real" database we might have configured in `application.properties`
or `application.yml` files.

Note that by default the application context containing all these 
components, including the in-memory database, is shared between all
test methods within all `@DataJpaTest`-annotated test classes. 

This is why, by default, **each test method
runs in its own transaction, which is rolled back after the method
has executed**. This way, the database state stays pristine between tests
and the tests stay independent of each other.       

## Creating the Database Schema

Before we can test any queries to the database, we need to create an 
SQL schema to work with. Let's look at some different ways to do this.

### Using Hibernate's `ddl-auto` 

By default, `@DataJpaTest` will configure Hibernate to create the database
schema for us automatically. The property responsible for this is
`spring.jpa.hibernate.ddl-auto`, which Spring Boot sets to `create-drop` by default,
meaning that the schema is created before running the tests and
dropped after the tests have executed.  

So, if we're happy with Hibernate creating the schema for us, we don't
have to do anything.

### Using `schema.sql`

Spring Boot [supports executing a custom `schema.sql` file](https://docs.spring.io/spring-boot/docs/current/reference/html/howto-database-initialization.html#howto-initialize-a-database-using-spring-jdbc)
when the application starts up.

If Spring finds a `schema.sql` file in the classpath, this will be executed against
the datasource. This overrides the `ddl-auto` configuration of Hibernate
discussed above. 

We can control whether the `schema.sql` file should be executed with the property
`spring.datasource.initialization-mode`. The default value is `embedded`,
meaning it will only execute for an embedded database (i.e. in our tests).
If we set it to `always`, it will always execute. 

The following log output confirms that the file has been executed:

```
Executing SQL script from URL [file:.../out/production/resources/schema.sql]
```

It makes sense to set Hibernate's `ddl-auto` configuration to `validate` when
using a script to initialize the schema, so that Hibernate checks if the created schema
matches the entity classes on startup:

```java
@ExtendWith(SpringExtension.class)
@DataJpaTest
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=validate"
})
class SchemaSqlTest {
  ...
}
``` 

### Using Flyway

[Flyway](https://flywaydb.org/) is a [database migration](/database-refactoring-flyway-vs-liquibase/)
tool that allows to specify multiple SQL scripts to create a database
schema. It keeps track of which of these scripts have already been
executed on the target database, so that it executes only those that
have not been executed before.

To activate Flyway, we just need to drop the dependency into our
`build.gradle` file (similar if we'd use Maven):

```groovy
compile('org.flywaydb:flyway-core')
```

Hibernate's `ddl-auto` configuration will automatically back off if we
have not specifically configured it,
so that Flyway has precedence and will by default execute all SQL scripts
it finds in the folder `src/main/resources/db/migration` against our
in-memory test database.

Again, it makes sense to set `ddl-auto` to `validate`, to
let Hibernate check if the schema generated by Flyway matches 
the expectations of our Hibernate entities:

```java
@ExtendWith(SpringExtension.class)
@DataJpaTest
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=validate"
})
class FlywayTest {
  ...
}
```

<div class="notice--success">
  <h4>The Value of using Flyway in Tests</h4>
  <p>
  If we're using Flyway in production it's really nice if we can also
  use it in our JPA tests as described above. Only then do we know
  at test time that the flyway scripts work as expected. 
  </p><p>
  This only works, however,
  as long as the scripts contain SQL that is valid on <em>both</em> the production
  database and the in-memory database used in the tests (an H2 database 
  in our example). If this is not the case, we must disable Flyway
  in our tests by setting the <code>spring.flyway.enabled</code>
  property to <code>false</code> and the <code>spring.jpa.hibernate.ddl-auto</code>
  property to <code>create-drop</code> to let Hibernate generate
  the schema.
  </p><p> 
  In any case, let's make sure to set the <code>ddl-auto</code> property
  to <code>validate</code> in the production profile! It's our
  last line of defense against errors in our Flyway scripts!
  </p>
</div> 

### Using Liquibase

[Liquibase](https://www.liquibase.org/) is another [database migration](/database-refactoring-flyway-vs-liquibase/) tool that works similar to Flyway
but supports other input formats besides SQL. We can provide YAML or XML
files, for example, that define the database schema.

We activate it by simply adding the dependency:

```groovy
compile('org.liquibase:liquibase-core')
```

Liquibase will then automatically create the schema defined in
`src/main/resources/db/changelog/db.changelog-master.yaml` by default.

Yet again, it makes sense to set `ddl-auto` to `validate`:

```java
@ExtendWith(SpringExtension.class)
@DataJpaTest
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=validate"
})
class LiquibaseTest {
  ...
}
```

<div class="notice--success">
  <h4>The Value of using Liquibase in Tests</h4>
  <p>
  As Liquibase allows multiple input formats that act as an abstraction
  layer over SQL, the same scripts can be used across multiple databases,
  even if their SQL dialects differ. This makes it possible to use
  the same Liquibase scripts in our tests <em>and</em> in production.
  </p><p>
  The YAML format is very sensitive, though, and I recently had trouble
  maintaining a collection of big YAML files. This, and the fact that
  in spite of the abstraction we actually had to edit those files for different
  databases, ultimately led to a switch to Flyway.
  </p>
</div> 

## Populating the Database

Now that we have created a database schema for our tests, we can finally start
the actual testing. In database query tests, we usually add some data to
the database and then validate if our queries return the correct results.

Again, there are multiple ways of adding data to our in-memory database,
so let's discuss each of them.

### Using `data.sql`

Similar to `schema.sql`, we can use a `data.sql` file containing insert
statements to populate our database. The same rules apply as [above](#using-schemasql). 

<div class="notice--success">
  <h4>Maintainability</h4>
  <p>
  A <code>data.sql</code> file forces us to put all our <code>insert</code> statements
  into a single place. Every single test will depend on this one script to set up the 
  database state. This script will soon become very large and hard to maintain.
  And what if there are tests that require conflicting database states? 
  </p><p>
  This approach should therefore be considered with caution. 
  </p>
</div>

### Inserting Entities Manually

The easiest way to create a specific database state per test is 
to just save some entities in the test before running the query under test:

```java
@Test
void whenSaved_thenFindsByName() {
  userRepository.save(new UserEntity(
          "Zaphod Beeblebrox",
          "zaphod@galaxy.net"));
  assertThat(userRepository.findByName("Zaphod Beeblebrox")).isNotNull();
}
```

This is easy for simple entities like in the example above. But in real projects
those entities usually are a lot more complex to build and have relationships
to other entities. Also, if we want to test a more complex query than `findByName`,
chances are that we need to create more data than a single entity.
This quickly becomes very tiresome.

One way to tame this complexity is to create factory methods, perhaps in combination
with the [Objectmother and Builder](/objectmother-fluent-builder/) patterns.

The approach of "manually" programming the database population in Java code has
a big advantage over the other approaches in that **it's refactoring-safe**. 
Changes in the codebase
lead to compile errors in our test code. In all other approaches, we have to run the
tests to be notified about potential errors due to a refactoring.

### Using Spring DBUnit

[DBUnit](http://dbunit.sourceforge.net/) is a library that supports setting databases
into a certain state. [Spring DBUnit](https://springtestdbunit.github.io/spring-test-dbunit/index.html)
integrates DBUnit with Spring so that it automatically works with Spring's transactions, among
other things.

To use it, we need to add the dependencies to Spring DBUnit and DBUnit:

```groovy
compile('com.github.springtestdbunit:spring-test-dbunit:1.3.0')
compile('org.dbunit:dbunit:2.6.0')
``` 

Then, for each test we can create a custom XML file containing the
desired database state:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dataset>
    <user
        id="1"
        name="Zaphod Beeblebrox"
        email="zaphod@galaxy.net"
    />
</dataset>
```

By default, the XML file (let's name it `createUser.xml`) 
lie in the classpath next to the test class.

In the test class, we need to add two `TestExecutionListeners` to enable DBUnit support.
To set a certain database state we can then use `@DatabaseSetup` on a test method:

```java
@ExtendWith(SpringExtension.class)
@DataJpaTest
@TestExecutionListeners({
        DependencyInjectionTestExecutionListener.class,
        TransactionDbUnitTestExecutionListener.class
})
class SpringDbUnitTest {

  @Autowired
  private UserRepository userRepository;

  @Test
  @DatabaseSetup("createUser.xml")
  void whenInitializedByDbUnit_thenFindsByName() {
    UserEntity user = userRepository.findByName("Zaphod Beeblebrox");
    assertThat(user).isNotNull();
  }

}
```

For testing queries that change the database state we could even 
use `@ExpectedDatabase` to define 
the state the database is expected to be in *after* the test.

Note, however, that Spring DBUnit has [not been maintained since 2016](https://github.com/springtestdbunit/spring-test-dbunit/commits/master).

<div class="notice--success">
  <h4><code>@DatabaseSetup</code> not working?</h4>
  <p>
  In my tests I had the problem that the <code>@DatabaseSetup</code> annotation 
  was silently ignored. Turned out there was a <code>ClassNotFoundException</code>
  as some DBUnit class could not be found. This exception was swallowed, though.
  </p><p>  
  The reason was that I forgot to include the dependency to DBUnit, since I thought
  that Spring Test DBUnit included it transitively. So, if you have the same problem,
  check if you have included both dependencies.
  </p>
</div>

### Using `@Sql`

A very similar approach is using Spring's `@Sql` annotation. Instead of using XML 
to describe the database state, we're using SQL directly:

```sql
-- createUser.sql
INSERT INTO USER 
            (id, 
             NAME, 
             email) 
VALUES      (1, 
             'Zaphod Beeblebrox', 
             'zaphod@galaxy.net'); 
```

In our test, we can simply use the `@Sql` annotation to refer to the SQL file to
populate the database:

```java
@ExtendWith(SpringExtension.class)
@DataJpaTest
class SqlTest {

  @Autowired
  private UserRepository userRepository;

  @Test
  @Sql("createUser.sql")
  void whenInitializedByDbUnit_thenFindsByName() {
    UserEntity user = userRepository.findByName("Zaphod Beeblebrox");
    assertThat(user).isNotNull();
  }

}
```

If we need more than one script, we can use `@SqlGroup` to combine them.

## Conclusion

To test database queries we need the means to create a schema and populate it
with some data. Since tests should be independent of each other, it's best
to do this for each test separately.

For simple tests and simple database entities, it suffices to create the 
state manually by creating and saving JPA entities. For more complex scenarios,
`@DatabaseSetup` and `@Sql` provide a way to externalize the database state
in XML or SQL files. 

What experience have you made with the different approaches? 
Let me know in the comments!

 
