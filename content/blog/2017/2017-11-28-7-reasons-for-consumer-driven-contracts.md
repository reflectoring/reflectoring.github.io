---
authors: [tom]
title: "7 Reasons to Choose Consumer-Driven Contract Tests Over End-to-End Tests"
categories: ["Software Craft"]
date: 2017-11-29
excerpt: "Find out why contracts should be defined by the API consumer and how to ease 
          integration testing APIs by using contract tests."
image: images/stock/0029-contract-1200x628-branded.jpg
url: reasons-for-consumer-driven-contracts
---



In a distributed system, testing the successful integration between  
distributed services is essential for ensuring that the services
won't fail in production just because they're not speaking the same language.
This article discusses three approaches to implementing integration tests
between distributed services and shows the advantages of
Consumer-Driven Contract tests.

## Strategies for Integration Testing

This article compares three testing strategies that can be used to implement
integration tests and then goes into describing how those strategies 
work with some usual testing issues.

Before we go into the details of those testing strategies, I want to define
the meaning of "integration test" in the context of this article:

> An integration test is a test between an API provider and an API consumer
> that asserts that the provider returns expected responses for a set of
> pre-defined requests by the consumer. The set of pre-defined requests and
> expected responses is called a contract.

Thus, with an integration test, we want to assert that consumer and provider
are speaking the same languange and that they understand each other syntactically
by checking that they both follow the rules of a mutual contract.

### End-to-End Tests

The most natural approach to testing interfaces between provider and consumer is
end-to-end testing. In end-to-end tests (E2E tests), real servers or containers are set up so
that provider and consumer (and all other services they require as dependencies,
such as databases) are available in a production-like runtime environment.

To execute our integration tests, the consumer is usually triggered by providing
certain input in the user interface. The consumer then calls the provider and the test
asserts (again in the UI) if the results meet the expectations defined in the contract.

### Mocking 

In a mock test, we no longer set up a whole runtime environment, but run isolated tests
between the consumer and a mock provider and between a mock consumer and the real provider.

{% capture img_mocks %}
{{% image alt="Mocks" src="images/posts/7-reasons-for-consumer-driven-contracts/mocks.jpg" %}}
{% endcapture %}

{% capture img_mocks_caption %}
In mock tests, consumer and provider each test against a mock that is fed with requests and
responses from a common API contract.
{% endcapture %}

<figure>
  {{ img_mocks | markdownify | remove: "<p>" | remove: "</p>" }}
  <figcaption>{{ img_mocks_caption | markdownify | remove: "<p>" | remove: "</p>" }}</figcaption>
</figure>

We now have two sets of tests instead of one. The first set of tests is between the consumer
and a provider mock.The consumer service is started up and triggered so that
it sends some requests to a provider mock. The provider mock checks if
the requests are listed in the contract and reports an error otherwise.

In the second set of tests a mock consumer is given the requests from the contract and simply
sends them against the provider service. The mock consumer then checks if the providers' 
responses meet the expectations defined in the contract.

### Consumer-Driven Contract Tests

Consumer-Driven Contract tests (CDC tests) are a specialization of mock tests as described above. They work just
like mock tests with the specialty that the interface contract is driven by the consumer and not,
as one would expect naturally, by the provider. This provides some interesting advantages 
we will come to later in this article.

{% capture img_cdc %}
{{% image alt="CDC" src="images/posts/7-reasons-for-consumer-driven-contracts/cdc.jpg" %}}
{% endcapture %}

{% capture img_cdc_caption %}
In Consumer-Driven Contract tests, the API consumer is the driving force that defines
the API contract between provider and consumer.
{% endcapture %}

<figure>
  {{ img_cdc | markdownify | remove: "<p>" | remove: "</p>" }}
  <figcaption>{{ img_cdc_caption | markdownify | remove: "<p>" | remove: "</p>" }}</figcaption>
</figure>

## Comparing the Integration Testing Strategies
Let's have a look at certain issues in testing and check how the testing strategies deal with them.

### Isolation
We've all been taught that isolation in tests is a good thing. This is highlighted in the 
famous testing pyramid (see image below). The base of the pyramid consists of isolated tests (you can also call
them unit tests, if you like). Thus, your test suite should consist of a high number of isolated tests
followed by few integration tests and even fewer end-to-end tests. The reason for this is simple: isolated tests are easy to execute and their results are easy to interpret, thus we should rely on them as long as it's possible.

{% capture img_pyramid %}
{{% image alt="Testing Pyramid" src="images/posts/7-reasons-for-consumer-driven-contracts/pyramid.jpg" %}}
{% endcapture %}

{% capture img_pyramid_caption %}
Your tests should have a large base of isolated unit tests, followed by fewer costly integration tests and
even fewer very costly end-to-end tests which are represented by the top of the pyramid. 
To save effort, we want to make our integration tests as isolated as possible and thus move them as far
to the bottom of the pyramid as possible.
{% endcapture %}

<figure>
  {{ img_pyramid | markdownify | remove: "<p>" | remove: "</p>" }}
  <figcaption>{{ img_pyramid_caption | markdownify | remove: "<p>" | remove: "</p>" }}</figcaption>
</figure>

E2E tests obviously aren't isolated tests since each test potentially calls a whole lot of services.
While I wouldn't call mock tests and CDC tests "isolated", they are definitely more
isolated than E2E tests since each test only tests a single service: either the provider or the consumer.

Using mock tests instead of E2E tests for testing interfaces between distributed services moves those tests
from the top of the testing pyramid at least one level down, so the point for isolation definitely goes
to mock tests and CDC tests.

### Testing Data Semantics
The correct semantics of data exchanged over an interface are, naturally, important for the data to be processed
correctly. However, mock tests usually only check the syntax of the data, e.g. if a credit card number is
syntactically correct but not if a credit card with that number actually exists. 

The semantics of data can best be tested with E2E tests, since here we have a full runtime environment
including the business logic that can check if the credit card actually exists. 

Reducing the test focus from semantics to syntax should be a conscious choice you make when implementing mock tests. 
You are no longer testing the business logic but you are concentrating your test efforts on the potentially
fragile interface structure (while covering your business logic with a separate set of isolated tests, I hope).

### Complexity

For an E2E runtime environment, you have to deploy containers running your services, their databases
and any other dependencies they might have, each in a specified versions (see image below). 

{% capture img_containers %}
{{% image alt="E2E Runtime Environment" src="images/posts/7-reasons-for-consumer-driven-contracts/containers.jpg" %}}
{% endcapture %}

{% capture img_containers_caption %}
A runtime environment for E2E test is potentially complex due to many services being deployed.
{% endcapture %}

<figure>
  {{ img_containers | markdownify | remove: "<p>" | remove: "</p>" }}
  <figcaption>{{ img_containers_caption | markdownify | remove: "<p>" | remove: "</p>" }}</figcaption>
</figure>

Nowadays, tools like Docker and 
kubernetes make this a lot easier than it was when services were hosted on bare metal. However,
you have to implement an automatism that executes this deployment when the tests are to be run. You
do not have this kind of complexity with mock tests.

### Test Data Setup

Test data is always an issue when implementing tests of any sort. In E2E tests test data is especially troublesome
since you have potentially many services each with their own database (see image in the previous
section). To set up a test environment for those
E2E tests you have to provide each of those databases with test data that match the expectations of your tests.

If cross-references between databases exist, the data in each database has to match the data in the other databases to enable valid testing scenarios across multiple
services. Beyond that, you have to implement a potentially complex automation to fire up your databases in a defined
state. 

In mock tests, on the other hand, you can define the data to be sent / returned directly in the consumer and provider mocks
without having to setup any database at all.

### Feedback Time

Another important issue in testing is the time it takes from starting your tests until you get the results and
can act on them by fixing a bug or modifying a test. The shorter this feedback time, the more productive you can
be. 

Due to their integrative nature, E2E tests usually have a rather long feedback time. One cause for this is the time
it takes to set up a complete E2E runtime environment. The other cause is that once you have set up that environment
you probably won't just run a single test but rather a complete suite of tests, which tends to take some time.

Mock tests have a much shorter feedback cycle, since you can run them any time, especially from a developer machine
and get feedback rather quickly (not as quickly as for usual unit tests, but quicker than for E2E tests for sure).

### Stability

Due to the complexity, potentially erroneous test data and a whole lot of other potential factors, E2E tests may fail.
If an E2E test fails, it does not necessarily mean that you found a bug in the code or in the test. It may mean that
the runtime environment was badly configured and a service could not be reached or that a certain service
was deployed in the wrong version or any other reason. That means that E2E tests are inherently less stable than
tests that are better isolated like mock tests. 

Unstable tests lead to dangerous mindsets like "A couple tests failed, but 90% successfull tests are OK, so let's deploy to production.".

Also, when setting up an E2E runtime environment, some of the deployed services may be developed by another 
team or even completely outside of your organization. You probably don't have a lot of influence on those services.
If one of those services fails, it may be a cause for a failing test and adds to the potential instability.

### Reveal Unused Interfaces

Usually, an API is defined by the API provider. Consumers then may choose which operations of the API they want to
use and which not. Thus, the provider does not really know which operations of its API are used by which consumer.
This may lead to a situation where an operation of the API is not used by any consumer.

{% capture img_unused %}
{{% image alt="Unused Interface" src="images/posts/7-reasons-for-consumer-driven-contracts/unused-interface.jpg" %}}
{% endcapture %}

{% capture img_unused_caption %}
If the provider defines the API contract, some of the API operations may not be used by any consumer.
{% endcapture %}

<figure>
  {{ img_unused | markdownify | remove: "<p>" | remove: "</p>" }}
  <figcaption>{{ img_unused_caption | markdownify | remove: "<p>" | remove: "</p>" }}</figcaption>
</figure>

We obviously want to find out which operations of an API are not used so that we can throw away unneeded code 
cluttering our codebase. Running E2E tests or even plain mock tests, however, you cannot easily find out which operations of an
API are not used.

When using CDC tests, on the other hand, if a consumer decides that a certain
API operation is no longer needed, it removes that operation from the consumer tests and thus from the contract.
This leads to a failing provider test and you will automatically be notified by your CI when an API operation is no longer needed and 
you can act accordingly.

### Well-Fittedness

A very similar issue is the issue of well-fittedness of the API operations for a certain consumer. If a provider dictates 
an API contract, it may not fit certain use cases of certain consumers optimally. If the consumer defines the contract,
it may be defined to fit its use case better.

{% capture img_well_fittedness %}
{{% image alt="Unused Interface" src="images/posts/7-reasons-for-consumer-driven-contracts/well-fittedness.jpg" %}}
{% endcapture %}

{% capture img_well_fittedness_caption %}
If the provider defines the API contract, a consumer may use an API operation that was designed for
a different purpose since it doesn't find an operation that better suits its use case.
{% endcapture %}

<figure>
  {{ img_well_fittedness | markdownify | remove: "<p>" | remove: "</p>" }}
  <figcaption>{{ img_well_fittedness_caption | markdownify | remove: "<p>" | remove: "</p>" }}</figcaption>
</figure>

With E2E tests and plain provider-dicated mock tests, the consumer has no real say in matters of well-fittedness. 
Only consumer-driven contracts allow the consumer to match the API to his needs.

### Unknown Consumers

Some APIs are public or semi-public and thus developed for an unknown group of consumers. In a setting like this,
CDC tests obviously don't work, since unknown consumers cannot define a contract. 

Simple mock tests still work though. Instead of two sets of tests (one for testing the provider and one for testing 
each consumer) you only have one set of tests for testing the provider, since there are no known consumers
to test. You just create a mock consumer that represents all the unknown consumers out
there to test the provider. 

"Real" E2E test are also not possible with unknown consumers since you cannot test end to end without
a consumer. However, you could argue that it's still an E2E test in the context of your application if 
you setup your provider in an E2E runtime environment and hit it with mocked requests from your contract.

## Feature Overview

Here's an overview table of the features of the different testing strategies discussed above.

{% capture plus %}
<i class="fa fa-plus" style="color:green" title="plus"></i>
{% endcapture %}

{% capture minus %}
<i class="fa fa-minus" style="color:red" title="minus"></i>
{% endcapture %}

|                                                       |  E2E Tests                                                    |   Mock Tests                                                  |  CDC Tests                                                   |
|-------------------------------------------------------|---------------------------------------------------------------|---------------------------------------------------------------|--------------------------------------------------------------|
| **[Isolation](#isolation)**                           |  <i class="fa fa-minus" style="color:red" title="minus"></i>  | <i class="fa fa-plus" style="color:green" title="plus"></i>   | <i class="fa fa-plus" style="color:green" title="plus"></i>  |
| **[Complexity](#complexity)**                         |  <i class="fa fa-minus" style="color:red" title="minus"></i>  | <i class="fa fa-plus" style="color:green" title="plus"></i>   | <i class="fa fa-plus" style="color:green" title="plus"></i>  |
| **[Test Data Setup](#test-data-setup)**               |  <i class="fa fa-minus" style="color:red" title="minus"></i>  | <i class="fa fa-plus" style="color:green" title="plus"></i>   | <i class="fa fa-plus" style="color:green" title="plus"></i>  |
| **[Testing Data Semantics](#testing-data-semantics)** |  <i class="fa fa-plus" style="color:green" title="plus"></i>  | <i class="fa fa-minus" style="color:red" title="minus"></i>   | <i class="fa fa-minus" style="color:red" title="minus"></i>  |
| **[Feedback Time](#feedback-time)**                   |  <i class="fa fa-minus" style="color:red" title="minus"></i>  | <i class="fa fa-plus" style="color:green" title="plus"></i>   | <i class="fa fa-plus" style="color:green" title="plus"></i>  |
| **[Stability](#stability)**                           |  <i class="fa fa-minus" style="color:red" title="minus"></i>  | <i class="fa fa-plus" style="color:green" title="plus"></i>   | <i class="fa fa-plus" style="color:green" title="plus"></i>  |
| **[Reveal Unused Interfaces](#reveal-unused-interfaces)**           |  <i class="fa fa-minus" style="color:red" title="minus"></i>  | <i class="fa fa-minus" style="color:red" title="minus"></i>   | <i class="fa fa-plus" style="color:green" title="plus"></i>  |
| **[Well-Fittedness](#well-fittedness)**               |  <i class="fa fa-minus" style="color:red" title="minus"></i>  | <i class="fa fa-minus" style="color:red" title="minus"></i>   | <i class="fa fa-plus" style="color:green" title="plus"></i>  |
| **[Unknown Consumers](#unknown-consumers)**           |  <i class="fa fa-plus" style="color:green" title="plus"></i>  | <i class="fa fa-plus" style="color:green" title="plus"></i>   | <i class="fa fa-minus" style="color:red" title="minus"></i>  |

As you can see, there are good reasons to implement Consumer-Driven Contract tests to test interfaces
between services in a distributed system like a microservice architecture. If you are interested
in implementing CDC tests, have a look at the [Pact](http://pact.io) framework or at
[Spring Cloud Contract](https://cloud.spring.io/spring-cloud-contract/). For an example
on how to use Pact, have a look at [this blog post](/consumer-driven-contracts-with-pact-feign-spring-data-rest/).
