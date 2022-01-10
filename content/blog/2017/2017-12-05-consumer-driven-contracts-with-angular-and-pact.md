---
authors: [tom]
title: "Creating a Consumer-Driven Contract with Angular and Pact"
categories: ["WIP", programming]
date: 2017-12-10
excerpt: "A tutorial on testing an Angular REST client against a contract with the Pact framework."
image: images/stock/0029-contract-1200x628-branded.jpg
url: consumer-driven-contracts-with-angular-and-pact
---



Consumer-driven contract tests are a technique to test integration
points between API providers and API consumers without the hassle of end-to-end tests (read it up in a 
[recent blog post](/7-reasons-for-consumer-driven-contracts/)).
A common use case for consumer-driven contract tests is testing interfaces between 
services in a microservice architecture. However, another interesting use case is
testing interfaces between the user client and those services. With [Angular](https://angular.io/)
being a widely adopted user client framework and [Pact](https://pact.io) being a polyglot
contract framework that allows consumer and provider to be written in different languages,
this article takes a look on how to 
create a contract from an Angular client that consumes a REST API.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/pact/pact-angular" %}

## The Big Picture

The big picture of Consumer-Driven Contract tests is shown in the figure below.

![Mocking Overview](/assets/img/posts/consumer-driven-contracts-with-angular-and-pact/mocks.jpg)

Instead of testing consumer and provider in an end-to-end manner, which requires a [complex
server environment](/7-reasons-for-consumer-driven-contracts/#complexity),
we split the test of our API into two parts: a consumer test and a provider test.
Each of these tests runs against a mock of the interface counterpart instead of against the real
thing, in order to reduce complexity and gain some [other advantages](/7-reasons-for-consumer-driven-contracts/#feature-overview).

The consumer mock and provider mock both have access to a contract that specifies
a set of valid request / response pairs (also called "interactions") so that they are able to verify the
requests and responses of the real consumer and provider.

## In this Article

This article focuses on the consumer side. Our consumer is an Angular application 
that accesses some remote REST API. The provider of this API is of no concern to us
yet, since the API contract is created from the consumer-side (hence "consumer-driven"). 
Stay tuned for an upcoming blog post that tests a Spring Boot API provider against the contract
we're creating here.

What we will do in this article:

* create an Angular service accessing a REST API
* create a contract for that REST API from an Angular test 
* verify that the Angular service obeys the contract
* publish the contract on a [Pact Broker](https://github.com/pact-foundation/pact_broker) so it can later be accessed by the API provider 

A prerequisite for this article is an Angular app skeleton created with Angular CLI. If you
don't want to create one yourself, clone the [code repository](https://github.com/thombergs/code-examples/tree/master/pact/pact-angular).

## The API Consumer: UserService

The API we want to create a contract for is an API to create a user resource.
The consumer of this API is an Angular service called `UserService` living in the file `user.service.ts`:

```typescript
@Injectable()
export class UserService {

  private BASE_URL = '/user-service/users';

  constructor(private httpClient: HttpClient) {
  }

  create(resource: User): Observable<number> {
    return this.httpClient
    .post(this.BASE_URL, resource)
    .map(data => data['id']);
  }
  
}
```

`UserService` uses the Angular [`HttpClient`](https://angular.io/guide/http) to 
send a `POST` request containing a User JSON object to the URI `/user-service/users`.
The response is expected to contain an `id` field containing the ID of the newly
created user.

## Pact Dependencies

In order to get Pact up and running in our Angular tests, we need to include the
following dependencies as `devDependencies` in the `package.json` file:

```text
"devDependencies": {
  ...
  "@pact-foundation/pact-node": "6.5.0",
  "@pact-foundation/karma-pact": "2.1.3",
  "@pact-foundation/pact-web": "5.3.0"
 }
```

[`pact-node`](https://github.com/pact-foundation/pact-node) is a wrapper around the 
original Ruby implementation of Pact that, among other things, allows to run a mock provider and create 
contract files - or "pacts", as they are called when using Pact - from Javascript code.

[`karma-pact`](https://github.com/pact-foundation/karma-pact) is a plugin for the Karma
test runner framework that launches a mock provider via `pact-node` before running the
actual tests.

[`pact-web`](https://github.com/pact-foundation/pact-js) (also called PactJS) is a Javascript library that provides an API
to define contract fragments by listing request / response pairs ("interactions") and
sending them to a `pact-node` mock server. This enables us to implement consumer-driven contract
tests from our Angular tests.

## Configure Karma

Before starting into our test, we need to configure Karma to start up a mock provider each time we
start a test run. For this, we add the following lines to `karma.conf.js`:

```javascript
module.exports = function (config) {
  config.set({
    // ... other configurations
    pact: [{
      cors: true,
      port: 1234,
      consumer: "ui",
      provider: "userservice",
      dir: "pacts",
      spec: 2
    }],
    proxies: {
      '/user-service/': 'http://127.0.0.1:1234/user-service/'
    }
  });
};   
```

Basically, we only tell the `karma-pact` plugin some information like on which port to start 
the mock server. Additionally, I found that it's necessary to add the `proxies` configuration.
In the case above, we tell Karma to redirect all requests coming from within our tests and pointing to a URL starting with `/user-service/` 
to port `1234`, which is our mock provider. This way, we can be sure that
the requests our `UserService` sends during the test will be received by the mock provider.  

## Set up the Pact Test

Now, we're ready to set up a test that defines a contract and verifies our `UserService` against
this contract. We name the file `user.service.pact.spec.ts` to make clear that it's 
a Pact test. You can find the whole file in the [demo repository](https://github.com/thombergs/code-examples/blob/master/pact/pact-angular/src/app/user.service.pact.spec.ts).

To start off, we need to import the usual suspects from the Angular test framework, 
as well as our own files and the Pact files:

```typescript
import {TestBed} from '@angular/core/testing';
import {HttpClientModule} from '@angular/common/http';
import {UserService} from './user.service';
import {User} from './user';
import {PactWeb, Matchers} from '@pact-foundation/pact-web';
```

Next, in the `beforeAll()` function, we create a provider object that can then be used
by all test cases defined in the test file.

```typescript
beforeAll(function (done) {
  provider = new PactWeb({
    consumer: 'ui',
    provider: 'userservice',
    port: 1234,
    host: '127.0.0.1',
  });

  // required for slower CI environments
  setTimeout(done, 2000);

  // Required if run with `singleRun: false`
  provider.removeInteractions();
});
```

The provider object connects to the mock server we configured in `karma.conf.js` so take care
that `consumer`, `provider` and `port` are the same as in the Karma config. Via this provider object, we can
later add interactions (i.e. request/response pairs that define the API contract) to the mock server.
To make sure that no interactions from a previous test run linger in the mock server, we call
`removeInteractions()`.

Finally, in the `afterAll()` function we call `provider.finalize()`, which tells the mock server
to write all currently available interactions into a contract file.

```typescript
afterAll(function (done) {
  provider.finalize()
  .then(function () {
    done();
  }, function (err) {
    done.fail(err);
  });
});
```

## Create a Pact

Now to the test. The following code shows how to add an interaction to a contract
and then verify if the requests our `UserService` sends are valid according
to this contract.

```typescript
describe('create()', () => {

  const expectedUser: User = {
    firstName: 'Arthur',
    lastName: 'Dent'
  };

  const createdUserId = 42;

  beforeAll((done) => {
    provider.addInteraction({
      state: `provider accepts a new person`,
      uponReceiving: 'a request to POST a person',
      withRequest: {
        method: 'POST',
        path: '/user-service/users',
        body: expectedUser,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      willRespondWith: {
        status: 201,
        body: Matchers.somethingLike({
            id: createdUserId
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    }).then(done, error => done.fail(error));
  });

  it('should create a Person', (done) => {
    const userService: UserService = TestBed.get(UserService);
    userService.create(expectedUser).subscribe(response => {
      expect(response).toEqual(createdUserId);
      done();
    }, error => {
      done.fail(error);
    });
  });

});
```text
By calling `provider.addInteraction()` we send a request / response pair to the mock server.
This request / response pair is then considered to be part of the API contract. Since the `UserService`
is the consumer of that API, we're creating a real consumer-driven contract here.

In the test (within the `it()` function), we then call `userService.create()` to send a 
real request to the mock server. The mock server checks this request against all interactions
it has received before. If it finds an interaction with that request, it returns the response
associated to it. If it does not find a matching interaction, the test fails. Thus, if the
test passes, we have verified that `UserService` follows the rules of the contract fragment we
created above.
 
## The Pact

After `provider.finalize()` has been called, i.e. when all tests have finished, the mock server
creates a pact file from all interactions that it has been fed during the test run. A pact
file is simply a JSON structure that contains the request / response pairs and some metadata.

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

## Bonus: Publish the Pact on a Pact Broker

We just created a pact from an Angular test that tests an API consumer! But what about the
provider of that API? The developers of that API provider will need the pact in order to
build the correct API.   

Thus, we should publish the pact somehow. For this, you can set up a [Pact Broker](https://github.com/pact-foundation/pact_broker),
which acts as a repository for pacts. Here's a [script](https://github.com/thombergs/code-examples/blob/master/pact/pact-angular/publish-pacts.js) that publishes all pact files within a folder
to a Pact Broker.    

```typescript
let projectFolder = __dirname;
let pact = require('@pact-foundation/pact-node');
let project = require('./package.json');

let options = {
  pactFilesOrDirs: [projectFolder + '/pacts'],
  pactBroker: 'https://your.pact.broker.url',
  consumerVersion: project.version,
  tags: ['latest'],
  pactBrokerUsername: 'YOUR_PACT_BROKER_USER',
  pactBrokerPassword: 'YOUR_PACT_BROKER_PASS'
};

pact.publishPacts(options).then(function () {
  console.log("Pacts successfully published!");
});
```

You can integrate this script into your npm build by adding it to the `scripts` section of your `package.json`:

```json
"scripts": {
  ...
  "publish-pacts": "node publish-pacts.js"
 }
```

The script can then be executed by running `npm run publish:pacts` either from your machine or from your CI build 
to publish the pacts every time the tests ran successfully.

## Wrap Up
In this article, we created an API contract and verified that our Angular service (i.e. the API consumer) abides by that 
contract, all from within an Angular test. This article has not covered the provider side yet. In an upcoming blog post,
we'll have a look at how to create an API provider with Spring Boot and how to 
test that provider against the contract we just created. 
