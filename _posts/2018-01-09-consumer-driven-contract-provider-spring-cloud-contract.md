---
title: "Testing a Spring Boot REST API against a Contract with Spring Cloud Contract"
categories: [spring]
modified: 2018-01-01
author: tom
tags: [gradle, snapshot, bintray]
comments: true
ads: false
header:
 teaser: /assets/images/posts/consumer-driven-contract-provider-spring-cloud-contract/contract.jpg
 image: /assets/images/posts/consumer-driven-contract-provider-spring-cloud-contract/contract.jpg
sidebar:
  nav: cdc
---

Consumer-driven contract tests are a technique to test integration
points between API providers and API consumers without the hassle of end-to-end tests (read it up in a 
[recent blog post](/7-reasons-for-consumer-driven-contracts/)).
A common use case for consumer-driven contract tests is testing interfaces between 
services in a microservice architecture. In the Java ecosystem, [Spring Boot](https://projects.spring.io/spring-boot/)
is a widely used technology for implementing microservices. [Spring Cloud Contract](https://cloud.spring.io/spring-cloud-contract/)
is a framework that facilitates consumer-driven contract tests. 
So let's have a look at how to test a REST API provided by a Spring Boot application 
against a contract previously defined by the API consumer using Spring Cloud Contract.

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/spring-cloud/spring-cloud-contract-provider" %}

# In this Article

Instead of testing API consumer and provider in an end-to-end manner, with consumer-driven contract tests
we split up the test of our API into two parts: 

* a consumer test testing against a mock provider and
* a provider test testing against a mock consumer 

This article focuses on the provider side. A consumer of our API has created a contract in advance and
we want to verify that the REST API provided by our Spring Boot Service matches the expectations of that contract.

In this article we will:

* have a look at the API contract created in advance by an API consumer
* create a Spring MVC controller providing the desired REST API
* set up Spring Cloud Contract to automatically generate JUnit tests that verify the controller against the contract 

# The Contract

In Spring Cloud Contract contracts are defined with a [DSL](http://cloud.spring.io/spring-cloud-contract/single/spring-cloud-contract.html#_contract_dsl) in a Groovy file. The contract we're using in this article
looks like this:

```groovy
package userservice

import org.springframework.cloud.contract.spec.Contract

Contract.make {
  description("When a POST request with a User is made, the created user's ID is returned")
  request {
    method 'POST'
    url '/user-service/users'
    body(
      firstName: "Arthur",
      lastName: "Dent"
    )
    headers {
      contentType(applicationJson())
    }
  }
  response {
    status 201
    body(
      id: 42
    )
    headers {
      contentType(applicationJson())
    }
  }
}
```

Each contract defines a single request / response pair. The contract above defines an API provided by `user-service` 
that consists of a `POST` request to the URL `/user-service/users` containing 
some user data in the body and an expected response to that request returning HTTP code `201` and
the newly created user's database id as body.

For later usage, the contract file is expected to be filed under
`src/test/resources/contracts/userservice/shouldSaveUser.groovy`.

# The Spring Controller

A Spring controller that obeys the above contract is easily created:

```java
@RestController
public class UserController {

  private UserRepository userRepository;

  @Autowired
  public UserController(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @PostMapping(path = "/user-service/users")
  public ResponseEntity<IdObject> createUser(@RequestBody @Valid User user) {
    User savedUser = this.userRepository.save(user);
    return ResponseEntity
      .status(201)
      .body(new IdObject(savedUser.getId()));
  }

}
```

`IdObject` is a simple bean that has the single field `id`.

# The Provider Test

Next, let's set up Spring Cloud Contract to verify that the above controller really 
obeys the contract. We're going to use Gradle as build tool (but Maven is supported
as well).

## Test Base
To verify an API provider (the Spring controller in our case), Spring Cloud Contract 
automatically generates JUnit tests from a given contract. In order to give these
automatically generated tests a working context, we need to create a base test class
which is subclassed by all generated tests:

```java
@RunWith(SpringRunner.class)
@SpringBootTest(classes = DemoApplication.class)
public abstract class UserServiceBase {

  @Autowired
  WebApplicationContext webApplicationContext;

  @MockBean
  private UserRepository userRepository;

  @Before
  public void setup() {
    User savedUser = new User();
    savedUser.setFirstName("Arthur");
    savedUser.setLastName("Dent");
    savedUser.setId(42L);
    when(userRepository.save(any(User.class))).thenReturn(savedUser);
    RestAssuredMockMvc.webAppContextSetup(webApplicationContext);
  }
}
``` 

In this base class, we're setting up a Spring Boot application with `@SpringBootTest` and are
mocking away the `UserRepository` so that it always returns the user specified in the contract.
Then, we set up RestAssured so that the generated tests can simply use RestAssured to send
requests against our controller.

Note that the contract DSL allows to specify matchers instead of static content, so that the user name
defined in our contract does not have to be "Arthur Dent" but may for example be any String.

## Setting up the `build.gradle`

Spring Cloud Contract provides a Gradle plugin that takes care of generating the tests for us:

```groovy
apply plugin: 'spring-cloud-contract'
```

The plugin needs the following dependencies withing the `buildscript` scope:
```groovy
buildscript {
  repositories {
    // ...
  }
  dependencies {
    classpath "org.springframework.boot:spring-boot-gradle-plugin:1.5.9.RELEASE"
    classpath "org.springframework.cloud:spring-cloud-contract-gradle-plugin:1.2.2.BUILD-SNAPSHOT"
  }
}
```

In the `contracts` closure, we define some configuration for the plugin:

```groovy
contracts {
  baseClassMappings {
    baseClassMapping(".*userservice.*", "io.reflectoring.UserServiceBase")
  }
}
```

The mapping we defined above tells Spring Cloud Contract that the tests generated for any contracts it finds in `src/test/resources/contracts`
that contain "userservice" in their path are to be subclassed from our test base class `UserServiceBase`. We could define
more mappings if different tests require different setups (i.e. different base classes). 

In order for the automatically generated tests to work, we need to include some further dependencies in the 
`testCompile` scope:

```groovy
dependencies {
  // ...
  testCompile('org.codehaus.groovy:groovy-all:2.4.6')
  testCompile("org.springframework.cloud:spring-cloud-starter-contract-verifier:${verifier_version}")
  testCompile("org.springframework.cloud:spring-cloud-contract-spec:${verifier_version}")
  testCompile("org.springframework.boot:spring-boot-starter-test:${springboot_version}")
}
``` 

## The Generated Test

Once we call `./gradlew generateContractTests`, the Spring Cloud Contract Gradle plugin will now generate a JUnit
test in the folder `build/generated-test-sources`:

```java
public class UserserviceTest extends UserServiceBase {

   @Test
   public void validate_shouldSaveUser() throws Exception {
      // given:
         MockMvcRequestSpecification request = given()
               .header("Content-Type", "application/json")
               .body("{\"firstName\":\"Arthur\",\"lastName\":\"Dent\"}");

      // when:
         ResponseOptions response = given().spec(request)
               .post("/user-service/users");

      // then:
         assertThat(response.statusCode()).isEqualTo(201);
         assertThat(response.header("Content-Type")).matches("application/json.*");
      // and:
         DocumentContext parsedJson = JsonPath.parse(response.getBody().asString());
         assertThatJson(parsedJson).field("['id']").isEqualTo(42);
   }
   
}
```

As you can see, the generated test sends the request specified in the contract an validates
that the controller returns the response expected from the contract.

The Gradle task `generateContractTests` is automatically included within the `build` task so that
a normal build will generate and then run the tests.

# Bonus: Generating Tests from a Pact

Above, we used a contract defined with the Spring Cloud Contract DSL. However, Spring Cloud Contract
currently only supports JVM languages and you might want to verify a contract generated by a non-JVM
consumer like an Angular application. 
In this case you may want to use [Pact](http://pact.io) on the consumer side since Pact 
supports other languages as well. You can read up how to create a contract with
Pact from an Angular client in [this article](/consumer-driven-contracts-with-angular-and-pact/).

## Spring Cloud Contract Pact Support

Luckily, Spring Cloud Contract supports the Pact contract format as well. To automatically generate
tests from a pact file, you need to put the pact file (which is a JSON file) into the folder `src/test/contracts`
and add these dependencies to your `build.gradle`:

```groovy
buildscript {
    repositories {
      // ...
    }
    dependencies {
        // other dependencies ...
        classpath "org.springframework.cloud:spring-cloud-contract-spec-pact:${verifier_version}"
        classpath 'au.com.dius:pact-jvm-model:2.4.18'
    }
}
```

Spring Cloud Contract then automatically picks up the pact file and generated tests for it just like for
the "normal" contract files.

## Matching Issue

If you're using Spring Cloud Contract 1.2.1 or below, you should not use the `somethingLike` matcher on the 
response body in your pact file when generating the contract via `pact-web`:

```json
willRespondWith: {
  body: Matchers.somethingLike({
    id: 42
  }),
}
```

This runs into an error when Spring Cloud Contract tries to generate the tests. Instead, use the matcher
on each field of the body object separately:

```json
willRespondWith: {
  body: {
    id: Matchers.somethingLike(42)
  },
}
```

Note that this [issue](https://github.com/spring-cloud/spring-cloud-contract/issues/511) is resolved in 
Spring Cloud Contract 1.2.2.
 
# Conclusion

In this article, we set up a Gradle build using Spring Cloud Contract to auto-generate tests that 
verify that a Spring REST controller obeys a certain contract. Details about Spring Cloud Contract can be looked up in the 
[reference manual](http://cloud.spring.io/spring-cloud-contract/spring-cloud-contract.html). Also, check the 
[github repo](https://github.com/thombergs/code-examples/tree/master/spring-cloud/spring-cloud-contract-provider) 
containing the example code to this article.
