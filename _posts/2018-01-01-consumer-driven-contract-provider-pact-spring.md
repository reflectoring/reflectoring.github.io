---
title: "Testing a Spring Boot REST API against a Consumer-Driven Contract with Pact"
categories: [open source]
modified: 2018-01-01
author: tom
tags: [gradle, snapshot, bintray]
comments: true
ads: false
header:
  teaser: /assets/images/posts/consumer-driven-contract-provider-pact-spring/contract.jpg
  image: /assets/images/posts/consumer-driven-contract-provider-pact-spring/contract.jpg
---

Consumer-driven contract tests are a technique to test integration
points between API providers and API consumers without the hassle of end-to-end tests (read it up in a 
[recent blog post](/7-reasons-for-consumer-driven-contracts/)).
A common use case for consumer-driven contract tests is testing interfaces between 
services in a microservice architecture. In the Java ecosystem, [Spring Boot](https://projects.spring.io/spring-boot/)
is a widely used technology for implementing microservices. [Pact](https://pact.io) 
is a framework that facilitates consumer-driven contract tests. 
So let's have a look at how to test a REST API provided by a Spring Boot application 
against a contract previously defined by the API consumer.

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/pact/pact-spring-provider" %}

{% include further_reading nav="cdc" %}

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
* verify that the controller against the contract within a JUnit test
* modify our test to load the contract file from a Pact Broker

Fo an overview of the big picture of consumer-driven contract testing, have a look at 
[this article](/7-reasons-for-consumer-driven-contracts/). 

# The Pact
Since we're using the Pact framework as facilitator for our consumer-driven contract tests,
contracts are called "pacts". We'll use the following pact that was created by an Angular consumer in 
[another article](/consumer-driven-contracts-with-angular-and-pact/):

```json
{
  "consumer": {
    "name": "ui"
  },
  "provider": {
    "name": "userservice"
  },
  "interactions": [
    {
      "description": "a request to POST a person",
      "providerState": "provider accepts a new person",
      "request": {
        "method": "POST",
        "path": "/user-service/users",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "firstName": "Arthur",
          "lastName": "Dent"
        }
      },
      "response": {
        "status": 201,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "id": 42
        },
        "matchingRules": {
          "$.body": {
            "match": "type"
          }
        }
      }
    }
  ],
  "metadata": {
    "pactSpecification": {
      "version": "2.0.0"
    }
  }
}
```

As you can see, the pact contains a single POST request to `/user-service/users` 
with a user object as payload and an associated response that 
is expected to have the status code `201` and should contain the ID of the created user.
A request / response pair like this is called an *interaction*.

# The Spring Controller

It's pretty easy to create a Spring controller that should obey that contract:

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

The controller works, we can test it by manually sending requests against it using Postman, for example.
But now, we want to verify that it actually obeys the contract specified above. This verification should
be done in every build, so doing this in a JUnit tests seems a natural fit.

## Pact Dependencies

To create that JUnit test, we need to add the following dependencies to our project:

```groovy
dependencies {
  testCompile('au.com.dius:pact-jvm-provider-spring_2.12:3.5.11')
  testCompile('junit:junit:4.12')
  // Spring Boot dependencies omitted
}
```

## Set up the JUnit Test

Next, we create a JUnit test that:

* starts up our Spring Boot application providing the REST API
* starts up a mock consumer that sends all requests from our pact to that API
* fails if the response does not match the response from the pact  

```java
@RunWith(SpringRestPactRunner.class)
@PactFolder("../pact-angular/pacts")
@Provider("userservice")
@SpringBootTest(
  webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, 
  properties = {"server.port=8080"}
)
public class UserControllerProviderTest {

  @TestTarget
  public final Target target = new HttpTarget(8080);

  @MockBean
  private UserRepository userRepository;

  @State({"provider accepts a new person"})
  public void toCreatePersonState() {
    User user = new User();
    user.setId(42L);
    user.setFirstName("Arthur");
    user.setLastName("Dent");
    when(userRepository.findOne(eq(42L))).thenReturn(user);
    when(userRepository.save(any(User.class))).thenReturn(user);
  }

}
```

The test is run with the `SpringRestPactRunner` which allows Pact to take control of the test.

With `@PactFolder` we tell Pact where to look for pact files that serve as the base for our
contract test. Note that there are other options for loading pact files such as the [`@PactBroker`](https://github.com/DiUS/pact-jvm/blob/master/pact-jvm-provider-junit/src/main/java/au/com/dius/pact/provider/junit/loader/PactBroker.java)
annotation.

`@Provider("userservice")` tells pact that we're testing the provider called "userservice". Pact will
automatically filter out all interactions from the loaded pact files that are not addressed at the 
provider "userservice".

The `@SpringBootTest` annotation is a standard annotation from Spring Boot that starts up the Spring Boot 
application. We're configuring it to start on a fixed port `8080`.

Since Pact creates a mock consumer for us that "replays" all requests from the pact files, 
it needs to know where to send those requests. With `@TestTarget` we mark a field of type
`Target` that provides exactly this information. In our case, we tell Pact to send the requests
via HTTP to `localhost:8080`, since we started the Spring Boot application on the same port.  

`@MockBean` is another standard annotation from Spring Boot that - in our case - replaces the real `UserRepository`
with a Mockito mock. We do this so that we do not have to initialize the database and any other dependencies
our controller may have. With our consumer-driven contract test, we want to test that consumer and provider
can talk to each other - we do not want to test the business logic behind the API. That's what unit tests are for.

Finally, we create a method that puts our Spring Boot application into a defined state that is suitable 
to respond to the mock consumer's requests. In our case, the pact file defines a single `providerState`
named `provider accepts a new person`. In this method, we set up our mock repository so that it returns 
a suitable `User` object that fits the object expected in the contract.

When this JUnit test is run, Pact will automatically fire up a test for each request in the processed
pact files and check the results against the associated responses. It even provides some human-readable 
output on the console:

```
Verifying a pact between ui and userservice
  Given provider accepts a new person
  a request to POST a person
    returns a response which
      has status code 201 (OK)
      includes headers
        "Content-Type" with value "application/json" (OK)
      has a matching body (OK)
```

# Load the Contract from a Pact Broker

Consumer-Driven contracts loose their value if you have multiple versions of the same
contract file in the consumer and provider codebase. We need a single source of truth for the contract files.

For this reason, the Pact team has developed a web application called [Pact Broker](https://github.com/pact-foundation/pact_broker)
which serves as a repository for pact files.

Our test from above can be modified to load the pact file directly from a Pact Broker instead of 
a local folder by using the `@PactBroker` annotation instead of the `@PactFolder` annotation:

```java

@PactBroker(host = "host", port = "80", protocol = "https",
        authentication = @PactBrokerAuth(username = "username", password = "password"))
public class UserControllerProviderTest {
  ...
}
``` 

# Conclusion

In this article, we created a JUnit test that verified a REST API against a contract
[previously created](/consumer-driven-contracts-with-angular-and-pact/) by a consumer of that API.
This test can now run in every CI build and we can sleep well knowing that consumer and provider
still speak the same language.   
