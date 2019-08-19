---
title: "Testing a Spring Boot REST API Consumer against a Contract with Spring Cloud Contract"
categories: [spring-boot]
modified: 2018-01-18
excerpt: "A guide on how to implement a consumer-driven contract test with Spring Cloud Contract that verifies that a REST consumer based on
          Feign and Spring Boot works as defined in the contract."
image: 0025-signature
---



Consumer-driven contract tests are a technique to test integration
points between API providers and API consumers without the hassle of end-to-end tests (read it up in a 
[recent blog post](/7-reasons-for-consumer-driven-contracts/)).
A common use case for consumer-driven contract tests is testing interfaces between 
services in a microservice architecture. In the Java ecosystem, [Spring Boot](https://projects.spring.io/spring-boot/)
is a widely used technology for implementing microservices. [Spring Cloud Contract](https://cloud.spring.io/spring-cloud-contract/)
is a framework that facilitates consumer-driven contract tests. 
So let's have a look at how to verify a Spring Boot REST client against a contract
with Spring Cloud Contract.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-cloud/spring-cloud-contract-consumer" %}

# In this Article

Instead of testing API consumer and provider in an end-to-end manner, with consumer-driven contract tests
we split up the test of our API into two parts: 

* a consumer test testing against a mock provider and
* a provider test testing against a mock consumer 

This article focuses on the consumer side. 

In this article we will:

* define an API contract with Spring Cloud Contract's DSL
* create a client against that API with Feign
* publish the contract to the API provider
* generate a provider stub against which we can verify our consumer code
* verify the consumer against the stub locally
* verify the consumer against the stub online

# Define the Contract

With Spring Cloud Contract, contracts are defined with a Groovy DSL:

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

The above contract defines an HTTP POST request to `/user-service/users` with a user object as body that is
supposed to save that user to the database and should be answered with HTTP status 201 and the id of the
newly created user.

We'll store the contract in a file called `shouldSaveUser.groovy` for later usage.

The details of the DSL can be looked up in the [Spring Cloud Contract Reference](http://cloud.spring.io/spring-cloud-contract/single/spring-cloud-contract.html#_contract_dsl).

# Create a Client against the API
We choose [Feign](https://cloud.spring.io/spring-cloud-netflix/multi/multi_spring-cloud-feign.html) as the technology
to create a client against the API defined in the contract. 

We need to add the Feign dependency to the Gradle build:
```groovy
dependencies {
    compile("org.springframework.cloud:spring-cloud-starter-openfeign:2.0.1.RELEASE")
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
```

```java
public class User {
	private Long id;
	private String firstName;
	private String lastName;
	// getters / setters / constructors omitted
}
```

```java
public class IdObject {
	private long id;
	// getters / setters / constructors omitted
}
```

The `@FeignClient` annotation tells Spring Boot to create an implementation of the `UserClient` interface
that should run against the host that configured under the name `userservice`. The `@RequestMapping` and `@RequestBody`
annotations specify the details of the POST request and the corresponding response defined in the contract.  

# Publish the Contract to the Provider
The next thing we - as the API consumer - want to do, is to verify that our client code works exactly as the contract
specifies. For this verification, Spring Cloud Contracts provides a Stub Runner that takes a contract as input
and provides a runtime stub against which we can run our consumer code.

That stub is created via the Spring Cloud Contract Gradle plugin on the provider side. Thus, we need to make
the contract available to the provider.

So, we simply clone the provider codebase and put the contract into the file 
`src/test/resources/contracts/userservice/shouldSaveUser.groovy` in the provider codebase and push it as
a pull request for the provider team to take up.

Note that although we're still acting as the consumer of the API, in this step and the next, **we're 
editing the provider's codebase**! 

# Generate a Provider Stub
Next, we want to generate the stub against which we can verify our consumer code. For this, the Spring
Cloud Contract Verifier Gradle plugin has to be set up in the provider build. You can read up on this setup
in [this article about the provider side](/consumer-driven-contract-provider-spring-cloud-contract/).

Additionally to the setup from the article above, in order to publish the stub into a Maven repository,
we need to add the maven-publish plugin to the `build.gradle`:

```groovy
apply plugin: 'maven-publish'
```

We want to control the `groupId`, `version` and `artifactId` of the stub so that we can later use these coordinates
to load the stub from the Maven repository. For this, we add some information to
`build.gradle`:

```groovy
group = 'io.reflectoring'
version = '1.0.0'
```

The `artifactId` can be set up in `settings.gradle` (unless you're OK with it being the name of the 
project directory, which is the default):

```groovy
rootProject.name = 'user-service'
```

Then, we run `./gradlew publishToMavenLocal` which should create and publish the artifact `io.reflectoring:user-service:1.0.0-stubs`
to the local Maven repository on our machine. If you're interested what this artifact looks like, look into the 
file `build/libs/user-service-1.0.0-stubs.jar`. Basically, it contains a JSON representation of the contract
that can be used as input for a stub that can act as the API provider.

# Verify the Consumer Code Locally
After the trip to the provider's code base, let's get back to our own code base (i.e. the consumer code base).
Now, that we have the stub in our local Maven repository, we can use the Stub Runner to verify that our consumer code
works as the contract expects. 

For this, we need to add the Stub Runner as a dependency to the Gradle build:

```groovy
dependencies {
    testCompile("org.springframework.cloud:spring-cloud-starter-contract-stub-runner:2.0.1.RELEASE")
    // ... other dependencies
}
```

With the Stub Runner in place, we create an integration test for our consumer code:

```java
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureStubRunner(
    ids = "io.reflectoring:user-service:+:stubs:6565", 
    stubsMode = StubRunnerProperties.StubsMode.LOCAL)
public class UserClientTest {

  @Autowired
  private UserClient userClient;

  @Test
  public void createUserCompliesToContract() {
    User user = new User();
    user.setFirstName("Arthur");
    user.setLastName("Dent");
    IdObject id = userClient.createUser(user);
    assertThat(id.getId()).isEqualTo(42L);
  }

}
```

With the `@AutoConfigureStubRunner` annotation we tell the Stub Runner to load the Maven artifact with 

* the groupId `io.reflectoring`, 
* the artifactId `user-service`, 
* of the newest version (`+`) and 
* with the `stubs` qualifier

from a Maven repository, extract the contract from it and pass it into the Stub Runner who then acts as the
API provider on port 6565. 

The `stubsMode` is set to `LOCAL` meaning that the artifact should be resolved
against the local Maven repository on our machine for now. And since we have published the stub to our local
Maven repository, it should resolve just fine.  

When running the test, you may run into the following exception:

```
com.netflix.client.ClientException: Load balancer does not have available server for client: userservice
```

This is because we need to tell the Stub Runner which Maven artifact it is supposed to be used as a stub 
for which service. Since our Feign client runs against the service named `userservice` and our artifact 
has the artifactId `user-service` (with "-"), we need to add the following config to our `application.yml`:  

```yaml
stubrunner:
  idsToServiceIds:
    user-service: userservice
```

# Verify the Consumer Code Online
Having verified the consumer code against a stub in our local Maven repository is well and good, but once we push
the consumer code to the CI, the build will fail because the stub is not available in an online Maven repository.

Thus, we have to wait until the provider team is finished with implementing the contract and the provider code
is pushed to the CI. The provider build pipeline should be configured to automatically publish the stub to 
an online Maven repository like a Nexus or Artifactory installation. 

Once the provider build has passed the CI build pipeline, we can adapt our test and set the `stubsMode` to `REMOTE`
so that the stub will be loaded from our Nexus or Artifactory server:

```java
@AutoConfigureStubRunner(
  ids = "io.reflectoring:user-service:+:stubs:6565",
  stubsMode = StubRunnerProperties.StubsMode.REMOTE)
public class UserClientTest {
  //...
}
```

In order for the Stub Runner to find the online Maven repository, we need to tell it where to look in the `application.yml`:

```yaml
stubrunner:
  repositoryRoot: http://path.to.repo/repo-name
```

Now, we can push the consumer code and be certain that the consumer and provider are compatible to each other.

# Conclusion

This article gave a quick tour of the consumer-side workflow of Spring Cloud Contract. We created a Feign client and 
verified it against a provider stub which is created from a contract. The workflow requires good communication between
the consumer and provider teams, but that is the nature of integration tests. Once the workflow is understood by all
team members, it lets us sleep well at night since it protects us from syntactical API issues between
consumer and provider.





