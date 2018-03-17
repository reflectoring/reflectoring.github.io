---
title: "Creating a Consumer-Driven Contract with Feign and Pact"
categories: [spring]
modified: 2018-03-17
author: tom
tags: [consumer, feign, pact]
comments: true
ads: false
header:
 teaser: /assets/images/posts/consumer-driven-contract-consumer-spring-cloud-contract/contract.jpg
 image: /assets/images/posts/consumer-driven-contract-consumer-spring-cloud-contract/contract.jpg
---

Consumer-driven contract tests are a technique to test integration
points between API providers and API consumers without the hassle of end-to-end tests (read it up in a 
[recent blog post](/7-reasons-for-consumer-driven-contracts/)).
A common use case for consumer-driven contract tests is testing interfaces between 
services in a microservice architecture. In the Java ecosystem, [Feign](https://github.com/OpenFeign/feign) in combination
with [Spring Boot](https://projects.spring.io/spring-boot/) 
is a popular stack for creating API clients in a distributed architecture. [Pact](https://docs.pact.io/)
is a polyglot framework that facilitates consumer-driven contract tests. 
So let's have a look at how to create a contract with Feign and Pact and test a Feign client against that contract.

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/pact/pact-feign-consumer" %}

{% include further_reading nav="cdc" %}

# In this Article

Instead of testing API consumer and provider in an end-to-end manner, with consumer-driven contract tests
we split up the test of our API into two parts: 

* a consumer test testing against a mock provider and
* a provider test testing against a mock consumer 

This article focuses on the consumer side. 

In this article we will:

* define an API contract with the Pact DSL
* create a client against that API with Feign
* verify the client against the contract within an integration test
* publish the contract to a Pact Broker

# Define the Contract

Unsurprising, a contract is called a "pact" within the Pact framework. In order to create a pact
we need to include the pact library: 

```groovy
dependencies {
    ...
    testCompile("au.com.dius:pact-jvm-consumer-junit_2.11:3.5.2")
}
```

The `pact-jvm-consumer-junit_2.11` library is part of `pact-jvm`, a collection of libraries facilitating 
consumer-driven-contracts for various frameworks on the JVM. 

As the name suggests, we're generating a contract from a JUnit test. 

Let's create a test class called `UserServiceConsumerTest` and add the following method to it:

```java
@Pact(provider = "userservice", consumer = "userclient")
public RequestResponsePact createPersonPact(PactDslWithProvider builder) {
  return builder
          .given("provider accepts a new person")
          .uponReceiving("a request to POST a person")
            .path("/user-service/users")
            .method("POST")
          .willRespondWith()
            .status(201)
            .matchHeader("Content-Type", "application/json")
            .body(new PactDslJsonBody()
                  .integerType("id", 42))
          .toPact();
}
```

This method defines a single interaction between a consumer and a provider, called a "fragment" of a pact. 
A test class can contain multiple such fragments which together make up a complete pact. 

The fragment we're defining here should define the use case of creating a new `User` resource. 

The `@Pact` annotation tells Pact that we want to define a pact fragment. It contains the names of the
consumer and the provider to uniquely identify the contract partners.

Within the method, we make use of the Pact DSL to create the contract. In the first two lines we describe
the state the provider should be in to be able to answer this interaction ("given") and the
request the consumer sends ("uponReceiving").

Next, we define how the request should look like. In this example, we define a URI and the HTTP method `POST`.

Having defined the request, we go on to define the expected response to this request. Here, we expect HTTP status 201, the content type
`application/json` and a JSON response body containing the id of the newly created `User` resource. 

Note that the test will not run successfully yet, since we have not defined and `@Test` methods yet. We will do that in
the section [Verify the Client against the Contract](#verify-the-client-against-the-contract).

# Create a Client against the API
We choose [Feign](https://cloud.spring.io/spring-cloud-netflix/multi/multi_spring-cloud-feign.html) as the technology
to create a client against the API defined in the contract. 

We need to add the Feign dependency to the Gradle build:
```groovy
dependencies {
    compile("org.springframework.cloud:spring-cloud-starter-feign:1.4.1.RELEASE")
    // ... other dependencies
}
```

Next, we create the actual client and the data classes used in the API:
```java
@FeignClient(name = "userservice")
public interface UserClient {

  @RequestMapping(method = RequestMethod.POST, path = "/user-service/users")
  IdObject createUser(@RequestBody User user);
}

public class User {
	private Long id;
	private String firstName;
	private String lastName;
	// getters / setters / constructors omitted
}

public class IdObject {
	private long id;
	// getters / setters / constructors omitted
}
```
The `@FeignClient` annotation tells Spring Boot to create an implementation of the `UserClient` interface
that should run against the host that configured under the name `userservice`. The `@RequestMapping` and `@RequestBody`
annotations specify the details of the POST request and the corresponding response defined in the contract.  

# Verify the Client against the Contract

Let's go back to our JUnit test class `UserServiceConsumerTest` and extend it so that it verifies that the Feign
client we just created actually works as defined in the contract:

```java
@RunWith(SpringRunner.class)
@SpringBootTest(properties = {
        "userservice.ribbon.listOfServers: localhost:8888"
})
public class UserServiceConsumerTest {

  @Rule
  public PactProviderRuleMk2 stubProvider = new PactProviderRuleMk2("userservice", "localhost", 8888, this);

  @Autowired
  private UserClient userClient;
  
  @Pact(provider = "userservice", consumer = "userclient")
  public RequestResponsePact createPersonPact(PactDslWithProvider builder) {
    ... // see code above
  }
  
  @Test
  @PactVerification(fragment = "createPersonPact")
  public void verifyCreatePersonPact() {
    User user = new User();
    user.setFirstName("Zaphod");
    user.setLastName("Beeblebrox");
    IdObject id = userClient.createUser(user);
    assertThat(id.getId()).isEqualTo(42);
  }
  
}
```

We start off using the standard `SpringRunner` and `SpringBootTest` annotations. Important to note is that
we configure our Feign client to send its requests against `localhost:8888`.

Using the JUnit rule `PactProviderRuleMk2`, we tell pact to start a mock API provider on `localhost:8888`.
This mock provider will return responses according to all pact fragments from the `@Pact` methods within the test class.

The actual verification of our Feign client is implemented in the method `verifyCreatePersonPact()`. The `@PactVerification`
annotation defines which pact fragment we want to test (the `fragment` property must be the name of a 
method annotated with `@Pact` within the test class).

Here, we create a `User` object, put it into our Feign client and assert that the result contains the user ID 
we entered as an example into our pact fragment earlier.

If the request the client sends to the mock provider looks as defined in the pact, the according response will
be returned and the test will pass. If the client does something differently, the test will fail, meaning that
we do not meet the contract. 

Once the test has passed, a pact file will be created in the `target` folder.

# Publish the Contract to a Pact Broker

The pact file created from our test now has to be made available to the provider side so that the provider
can also test against the contract.

Pact provides a Gradle plugin that we can use for this purpose. Let's include this plugin into our Gradle build:

```groovy
plugins {
    id "au.com.dius.pact" version "3.5.13"
}

pact {
    publish {
        pactDirectory = 'target/pacts'
        pactBrokerUrl = 'URL'
        pactBrokerUsername = 'USERNAME'
        pactBrokerPassword = 'PASSWORD'
    }
}
```

We can now run `./gradlew pactPublish` to publish all pacts generated from our tests to the specified Pact Broker.
The API provider can get the pact from there to validate his own code against the contract. 

We can integrate this task into a CI build to automate publishing of the pacts.

# Conclusion

This article gave a quick tour of the consumer-side workflow of Pact. We created a contract and verified our
Feign client against this contract from a JUnit test class. Then we published the pact to a Pact Broker that
is accessible by our API provider so that he can test against the contract as well.
