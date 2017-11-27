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
distributed components is essential for ensuring that the components
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
and a provider mock. In a test the consumer application is started up and triggered so that
it sends some requests to a provider mock. The provider mock checks if
the requests are listed in the contract and reports an error otherwise.

In the second set of tests a mock consumer is given the requests from the contract and simply
sends them against the provider application. The mock consumer then checks if the providers' 
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

E2E tests obviously aren't isolated tests since each test potentially calls a whole lot of components.
While I wouldn't call mock tests and CDC tests "isolated", they are definitely more
isolated than E2E tests since each test only tests a single component: either the provider or the consumer.

Using mock tests instead of E2E tests for testing interfaces between distributed components moves those tests
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

## Test Data 

Test data is always an issue when implementing tests of any sort. In E2E tests test data is especially troublesome
since you have potentially many components each with their own database. To set up a test environment for those
E2E tests you have to provide each of those databases with test data that match the expectations of your tests.

TODO: Image with multiple service containers and highlighted databases

The data in each database has to match to data in the other databases to enable valid testing scenarios across multiple
components. Beyond that, you have to implement a potentially complex automation to fire up your databases in a defined
state. 

In mock tests, on the other hand, you can define the data to be sent / returned directly in the consumer and provider mocks
without having to setup any database at all.

## Feedback Time

## Complexity

## Stability

## 3rd Party Components

## Well-Fittedness

## Unused Interfaces

## Unknown Consumers

## Test Results Quality
* Provider can run test for each consumer interaction

# Feature Overview
TODO: tabular overview over the features
CI-Friendlyness as Compound of Isolation, Test Data and Setup Complexity 


