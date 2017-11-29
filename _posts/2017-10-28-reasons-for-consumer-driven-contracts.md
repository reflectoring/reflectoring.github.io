---
title: "Why to choose Consumer-Driven Contract Tests over End-to-End Tests"
categories: [frameworks]
modified: 2017-10-01
author: tom
tags: [microservice, integration, testing, distributed, architecture]
comments: true
ads: false
---

In a distributed system, testing the successful integration between  
distributed services is essential for ensuring that the services
won't fail in production just because they're not speaking the same language.
This article presents some approaches to performing such integration tests
and describes their pros and cons.

# Strategies for Integration Testing

This article compares different testing strategies that can be used to implement
integration tests and explains which strategy has which features.

Before we go into the details of those testing strategies, I want to define
the meaning of "integration test" in the context of this article:

> An integration test is a test between an API provider and an API consumer
> that asserts that the provider returns expected responses for a set of
> pre-defined requests by the consumer. The set of pre-defined requests and
> expected responses is called a contract.

Thus, with an integration test, we want to assert that consumer and provider
are speaking the same languange and that they understand each other syntactically
by checking that they both follow the rules of a mutual contract.

## End-to-End Tests

The most natural approach to testing interfaces between provider and consumer is
end-to-end testing. In end-to-end tests (E2E tests), real servers or containers are set up so
that provider and consumer (and all other services they require as dependencies,
such as databases) are available in a production-like runtime environment.

TODO: Image of containers with dependencies from slides

To execute our integration tests, the consumer is triggered for example by providing
certain input in the user interface. The consumer then calls the provider and the test
asserts (again in the UI) if the results meet the expectations defined in the contract.

## Mocking 

In a mock test, we no longer set up a whole runtime environment, but run isolated tests
between the consumer and a mock provider and between a mock consumer and the real provider.

TODO: Image of consumer, provider, mocks, contract from slides

In mock tests, we now have to sets of tests instead of one. The first set of tests is between the consumer
and a provider mock. In a test the consumer service is started up and triggered so that
it sends some requests to a provider mock. The provider mock checks if
the requests are listed in the contract and reports an error otherwise.

In the second set of tests a mock consumer is given the requests from the contract and simply
sends them against the provider service. The mock consumer then checks if the providers' 
responses meet the expectations defined in the contract.

## Consumer-Driven Contract Tests

Consumer-Driven Contract Tests (CDC tests) are a specialization of mock tests as described above. They work just
like mock tests with the specialty that the interface is driven by the consumer and not,
as one would expect naturally, by the provider. This provides some interesting advantages 
that are described below.

# Comparing the Integration Testing Strategies
Let's have a look at certain issues in testing and check how the testing strategies deal with them.

## Isolation
We've all been taught that isolation in tests is a good thing. This is highlighted in the 
famous testing pyramid (see image below). The base of the pyramid consists of isolated tests (you can also call
them unit tests, if you like). Thus, your test suite should consist of a high number of isolated tests
followed by few integration tests and even fewer end-to-end tests.

TODO: image of testing pyramid

The reason for this is simple: isolated tests are easy to execute and their results are easy to interpret, thus
we should rely on them as long as it's possible.

E2E tests obviously aren't isolated tests since each test potentially calls a whole lot of services.
While I wouldn't call mock tests and CDC tests "isolated", they are definitely more
isolated than E2E tests since each test only tests a single service: either the provider or the consumer.

Using mock tests instead of E2E tests for testing interfaces between distributed services moves those tests
from the top of the testing pyramid at least one level down, so the point for isolation definitely goes
to mock tests and CDC tests.

## Data Semantics
The correct semantics of data exchanged over an interface are, naturally, important for the data to be processed
correctly. However, mock tests usually only check the syntax of the data, e.g. if a credit card number is
syntactically correct but not if a credit card with that number actually exists. 

The semantics of data can best be tested with E2E tests, since here we have a full runtime environment
including the business logic that can check if the credit card actually exists. 

Reducing the test focus from semantics to syntax should be a conscious choice you make when implementing mock tests. 
You are no longer testing the business logic but you are concentrating your test efforts on the potentially
fragile interface structure (while covering your business logic with isolated tests, I hope).

## Complexity

For an E2E runtime environment, you have to deploy containers running your services, their databases
and any other dependencies they might have, each in a specified versions. Nowadays, tools like Docker and 
kubernetes make this a lot easier than it was when services were hosted on bare metal. However,
you have to implement an automatism that executes this deployment when the tests are to be run. You
do not have this kind of complexity with mock tests.

## Test Data 

Test data is always an issue when implementing tests of any sort. In E2E tests test data is especially troublesome
since you have potentially many services each with their own database. To set up a test environment for those
E2E tests you have to provide each of those databases with test data that match the expectations of your tests.

TODO: Image with multiple service containers and highlighted databases

The data in each database has to match to data in the other databases to enable valid testing scenarios across multiple
services. Beyond that, you have to implement a potentially complex automation to fire up your databases in a defined
state. 

In mock tests, on the other hand, you can define the data to be sent / returned directly in the consumer and provider mocks
without having to setup any database at all.

## Feedback Time

Another important issue in testing is the time it takes from starting your tests until you get the results and
can act on them by fixing a bug or modifying a test. The shorter this feedback time, the more productive you can
be. 

Due to their itegrative nature, E2E tests usually have a rather long feedback time. One cause for this is the time
it takes to setup a complete E2E runtime environment. The other cause is that once you have setup that environment
you probably won't just run a single test but rather a complete suite of tests, which tends to take some time.

Mock tests have a much shorter feedback cycle, since you can run them any time, especially from a developer machine
and get feedback rather quickly (not as quickly as for usual unit tests, but quicker than for E2E tests for sure).

## Stability

Due to the complexity, potentially erroneous test data and a whole lot of other potential factors, E2E tests may fail.
If an E2E test fails, it does not necessarily mean that you found a bug in the code or in the test. It may mean that
the runtime environment was badly configured and an service could not be reached or that a certain service
was deployed in the wrong version or any other reason. That means that E2E tests are inherently less stable than
tests that are better isolated like mock tests. 

Unstable tests lead to dangerous mindsets like "A couple tests failed, but 90% are OK, so let's deploy to production.".

Also, when setting up an E2E runtime environment, some of the deployed services may be developed by another 
team or even completely outside of your organization. You probably don't have a lot of influence on those services.
If one of those services fails, it may be a cause for a failing test and adds to the potential instability.

## Well-Fittedness



## Unused Interfaces

## Unknown Consumers

## Test Results Quality
* Provider can run test for each consumer interaction

# Feature Overview
TODO: tabular overview over the features
CI-Friendlyness as Compound of Isolation, Test Data and Setup Complexity 


