---
title: "All You Need To Know About Testing Spring Data JPA Repositories"
categories: [java]
modified: 2019-01-28
last_modified_at: 2019-01-29
author: tom
tags: 
comments: true
ads: true
excerpt: "An in-depth look at the responsibilities of a Spring Boot web controller and how
          to cover those responsibilities with meaningful tests."
sidebar:
  toc: true
---

{% include sidebar_right %}

TODO

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-testing" %}

# The "Testing with Spring Boot" Series

This tutorial is part of a series:

1. [Unit Tests with Spring Boot](/unit-testing-spring-boot/)
2. [Testing Web Controllers](/spring-boot-web-controller-test/)
3. Testing Spring Data Repositories
4. Integration Tests with Spring Boot

# Dependencies

In this tutorial, aside from the usual Spring Boot dependencies, 
we're using Flyway to bootstrap our database schema, Lombok
to reduce boilerplate code and H2 as an in-memory database. 

JUnit Jupiter is our testing framework,
so we're also including Mockito's JUnit Jupiter support: 

```groovy
dependencies {
	compile('org.springframework.boot:spring-boot-starter-data-jpa')
	compile('org.springframework.boot:spring-boot-starter-web')
  compile('org.flywaydb:flyway-core')
	compileOnly('org.projectlombok:lombok')
	runtime('com.h2database:h2')
	testCompile('org.springframework.boot:spring-boot-starter-test')
	testCompile 'org.junit.jupiter:junit-jupiter-engine:5.2.0'
	testCompile('org.mockito:mockito-junit-jupiter:2.23.0')
}
```
# What to Test?

The first question to answer to ourselves is what we need to test.
Let's consider a Spring Data repository responsible for `UserEntity`
objects:

```java
interface UserRepository extends CrudRepository<UserEntity, Long> {

  UserEntity findByName(String name);

  @Query("select u from UserEntity u where u.name = :name")
  UserEntity findByNameCustomQuery(@Param("name") String name);

  @Query(
     value = "select * from user as u where u.name = :name",
     nativeQuery = true)
  UserEntity findByNameNativeQuery(@Param("name") String name);

}
```

This repository provides three queries, each using a slightly different
way to achieve the same result. Let's look at each one in detail to 
determine if we have to test it.

## Inferred Queries

The first query, `findByName()`, is an *inferred query*. We don't need
to tell Spring Data what to do, since it automatically infers the
SQL query from the name of the method name.

What's nice about this feature is that **Spring Data also automatically
checks if the query is valid at startup**. If we rename the method
to `findByFoo()` and the `UserEntity` does not have a property `foo`,
Spring Data will tell us with an exception:

```
org.springframework.data.mapping.PropertyReferenceException: 
  No property foo found for type UserEntity!
```

**So, as long as we have a test that tries to start up the Spring application context
in our code base, we do not need to write an extra test for our inferred
query.**

Note that this is not true for queries inferred from long method
names like
`findByNameAndRegistrationDateBeforeAndEmailIsNotNull`. 
This method name is hard to grasp and easy to get wrong, so we need
to test if it works as expected.

Having said this, I would rather rename the query to a shorter,
meaningful name and add a `@Query` annotation to provide a custom
JPQL query.

## Custom JPQL Queries with `@Query`

The second query, `findByNameCustomQuery()`, provides a `@Query` 
annotation including a custom query in JPA's query language (JPQL).

**Similar to inferred queries, we get a validity check for those
JPQL queries for free**. If we use Hibernate as our JPA provider, 
we'll get a `QuerySyntaxException` on startup if we have an error in the
query: 

```
org.hibernate.hql.internal.ast.QuerySyntaxException: 
  unexpected token: foo near line 1, column 64 [select u from ...]
```

Custom queries, however, can get a lot more complicated than
the finding an entry by a single attribute. It might include
joins with other tables or return complex DTOs instead of an entity,
for instance. **We have to decide for
ourselves if the query is complex enough to require a test.**

## Custom Native Queries with `@Query`

The third query, `findByNameNativeQuery()` is a *native* query.
This means that it does not specify a JPQL query, but a standard SQL
query that may even use a database-specific SQL dialect. 

It's important to note that **neither Hibernate nor Spring Data
validate native queries at startup**. Since the query may contain
database-specific SQL, there's no way Spring Data or Hibernate
can know what to check for. 

So, native queries are prime candidates for integration tests. However,
if they really use database-specific SQL, those tests need a real
database running in the background. 
  
# `@DataJpaTest` in a Nutshell

To test Spring Data JPA repositories, or any other JPA-related components, for 
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

The so created application context will not contain the whole context
needed for our Spring Boot application, but instead only a "slice"
of it containing the components needed to initialize any JPA-related
components like our Spring Data repository.

We can, for instance, inject a `DataSource`, `@JdbcTemplate` or
`@EntityManager`into our test class if we want to test direct database access. 
Or, we can inject any of the Spring Data repositories from our application.
All of the above components will be automatically configured 
to point to an embedded, in-memory database instead of the
database we might have configured in `application.properties`
or `application.yml` files.

Note that by default the application context containing all these 
components, including the in-memory database, is shared between all
test methods within all `@DataJpaTest`-annotated test classes. 

This is why, by default, **each test method
runs in its own transaction, which is rolled back after the method
has executed**. This way, the database state stays pristine between tests
and the tests stay independent of each other.       

# Creating the Database Schema

Before we can test any queries to the database, we need to create the 
SQL schema. Let's look at some different ways to do this:

## Using Hibernate's `ddl-auto` 

By default, `@DataJpaTest` will configure Hibernate to create the database
schema for us automatically. The property responsible for this is
`spring.jpa.hibernate.ddl-auto`, which Spring Boot sets to `create-drop` by default,
meaning that at the schema is created before running the tests and
dropped after the tests have executed.  

So, if we're happy with Hibernate creating the schema for us, we don't
have to do anything.

## Using `schema.sql`

Spring Boot [supports executing a custom `schema.sql` file](https://docs.spring.io/spring-boot/docs/current/reference/html/howto-database-initialization.html#howto-initialize-a-database-using-spring-jdbc)
when the application starts up.

If Spring finds a `schema.sql` file in the classpath, this will be executed against
the datasource. This overrides the `ddl-auto` configuration of Hibernate
discussed above. 

If a `schema.sql` file is found, it will be executed, no matter what.
I have found no configuration property to disable it.   

The following log output confirms that the file has been executed:

```
Executing SQL script from URL [file:.../out/production/resources/schema.sql]
```

It makes sense to set Hibernate's `ddl-auto` configuration to `validate` when
using a script to initialize the schema, so that Hibernate checks if the schema
matches the entity classes:

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

## Using Flyway

* simply include in build.gradle: 

```groovy
compile('org.flywaydb:flyway-core')
```

* Hibernate's `ddl-auto` will automatically back off
* but it will not validate anymore, so definitely set it to validate!

```java
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=validate")
```

# Populating the Database

## Inserting Entities Manually
* factory classes!
* no control over IDs
* only way for really refactoring-safe database population

## Using Spring DBUnit

* not maintained since 2016

## Using `@Sql`

* full control over IDs

## Using `data.sql`

* not recommended
* similar approach: 
* `spring.datasource.data`???

```java
new EmbeddedDatabaseBuilder()
  .setType(...)
  .addScript("your-script.sql").build();
```


