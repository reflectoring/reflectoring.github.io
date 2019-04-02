---
title: "Implementing a Consumer-Driven Contract for a React App with Pact and Jest"
categories: [cdc, testing]
modified: 2018-10-25
last_modified_at: 2018-11-10
author: tom
tags: 
comments: true
ads: true
excerpt: "A tutorial that shows how to implement a REST consumer with Axios, build a 
          a consumer-driven contract for it with the Pact framework, and 
          validate the consumer against the contract using Jest as the testing framework."
sidebar:
  nav: cdc
  toc: true
---

{% include sidebar_right %}

Consumer-driven contract (CDC) tests are a technique to test integration
points between API providers and API consumers without the hassle of end-to-end tests (read it up in a 
[recent blog post](/7-reasons-for-consumer-driven-contracts/)).
A common use case for consumer-driven contract tests is testing interfaces between 
services in a microservice architecture.

This article leads through the steps of setting up a fresh React app which calls a backend
REST service using [Axios](https://github.com/axios/axios). We'll then see how to create and publish 
a consumer-driven contract for the REST interaction between the React consumer and the API provider
and how to verify our REST client against that contract
using the [Jest](https://jestjs.io/) testing framework. 

**Note that this is not a tutorial on React, but rather on how to create a REST client with Axios
and using Pact in combination with Jest to implement consumer-driven contracts.** 
But since the [create-react-app bootstrapper](https://github.com/facebook/create-react-app)
uses Jest as the default testing framework, this tutorial describes a way to implement
CDC tests for your React app.

The core of this tutorial stems from [an example](https://github.com/pact-foundation/pact-js/tree/master/examples/jest)
in the pact-js repository.

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/pact/pact-react-consumer" %}

## Creating a React App

Let's start by creating our react app. I'm assuming you have a current version of [Node](https://nodejs.org/en/download/)
installed. 

First, we need to install the `create-react-app` bootstrapper, then we can use it to create
a project template containing a minimal React app for us:

```
npm install -g create-react-app
create-react-app pact-consumer
```

You can choose whatever name you wish for your project instead of `pact-consumer`.

## Adding Dependencies

At this stage, our `package.json` already declares some dependencies to React libraries.

However, for the rest of this tutorial to work, we need additional dependencies:

```json
{
  "dependencies": {
    "axios": "0.18.0"
  },
  "devDependencies": {
    "@pact-foundation/pact": "7.0.1",
    "@pact-foundation/pact-node": "6.20.0",
    "cross-env": "^5.2.0"
  }
}
```

* [axios](https://www.npmjs.com/package/axios) provides REST client capabilities
* [pact-node](https://www.npmjs.com/package/@pact-foundation/pact-node) provides the pact mock server 
  that receives and checks our REST client's requests during the contract test
* [pact](https://www.npmjs.com/package/@pact-foundation/pact) is an easier-to-use wrapper around pact-node
* [cross-env](https://www.npmjs.com/package/cross-env) allows to create npm command lines that are independent of the operating system 

Don't forget to run `npm install` after changing the contents of `package.json`. 

The details on how to use the libraries follow in the sections below.

## Setting Up Jest

We want to create a contract that defines how the REST client (consumer) and REST server (provider)
interact with one another. The contract is created from within a unit test, so we have to set up the Jest testing framework
to cooperate with Pact.

### Initializing the Pact Mock Provider

Within the unit test for our REST client, we want to create a contract and verify that 
the REST client works as defined in the contract. 

For the verification step, we let our REST client send a request to a local mock provider. 
We have to take some steps to set up this mock provider.

This is where the `pact` dependency from above comes into play. In a separate
javascript file `pact/setup.js`, we configure the Pact mock provider:

```javascript
// ./pact/setup.js
const path = require('path');
const Pact = require('@pact-foundation/pact').Pact;

global.port = 8080;
global.provider = new Pact({
    cors: true,
    port: global.port,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    loglevel: 'debug',
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'update',
    consumer: 'hero-consumer',
    provider: 'hero-provider',
    host: '127.0.0.1'
});
```

Later, we'll include this file in the test runs, so that it will be executed before any test 
is run and so that all tests can rely upon the fact that the mock provider is configured correctly.

The provider instance is made globally available for later access in the tests. 

We configured some important things:
* the path where pact will put a log file (`./logs/pact.log`)
* the path where pact will put contract files (`./pacts`)
* the `pactfileWriteMode` is set to `update` so that the contract files will not be created anew
  for each test, but rather added to
* the consumer and provider names

### Starting and Stopping the Pact Mock Provider

Next, we have to tell Jest to start the mock provider before the tests start and to
kill it after the tests are finished. We do this in the script `pact/jest-wrapper.js`:

```javascript
// ./pact/jest-wrapper.js
beforeAll((done) => {
    global.provider.setup().then(() => done());
});

afterAll((done) => {
    global.provider.finalize().then(() => done());
});
```

The call to `setup()` will start up the mock provider with the configuration from
above (i.e. we'll have a real HTTP server running on `localhost:8080` that behaves as
defined in a certain contract).

The call to `finalize()` will trigger the mock provider to create contract files for 
all interactions it has received during the test run in the `pacts` folder. 

We'll include this script in the Jest config in the next step.

### Creating an NPM Task to Run the Pact Tests

Now that we have created two scripts to tell Jest what to do, we have to make those scripts
known to Jest.

We do this by creating a new NPM script command `test:pact` in `package.json` that executes
our pact tests:

```json
// package.json
{
  "scripts": {
    "test:pact": "cross-env CI=true react-scripts test 
       --runInBand 
       --setupFiles ./pact/setup.js 
       --setupTestFrameworkScriptFile ./pact/jest-wrapper.js 
       --testMatch \"**/*.test.pact.js\""
  }
}
```

Note that the line breaks above actually make the JSON invalid and have only been added for better
readability.

The options in detail:

* With `cross-env CI=true`, we tell Jest to run in CI mode, meaning the tests should only run once
  and not in watch mode (this is optional, but I had some problems with zombie processes in watch mode).
* `--runInBand` tells Jest to run the tests sequentially instead of in parallel. This is necessary
  for the Pact provider to be properly started and stopped.
* With `--setupFiles`, we make sure that Jest executes our `setup.js` from above before every test run.
* Similarly, with `--setupTestFrameworkScriptfile`, we make sure that Jest calls the `beforeAll()`
  and `afterAll()` functions from `jest-wrapper.js` before and after all tests.
* With `--testMatch`, we tell Jest to only execute tests that end with `test.pact.js`. 

Now, we can run the tests:

```
npm run test:pact
```

This will only execute the pact tests. It's a good idea to run pact tests separately from other unit tests,
since they have some special needs, as we can see in all the configuration above.

## The Hero REST Client

Up until now, it was all configuration. Let's implement a REST client for which we'll
later create a consumer-driven contract.

For the sake of simplicity, the REST client only has a single operation which allows us
to store a Hero resource on the server.

### The Hero Class

A hero resource has an id, a name, a superpower and it belongs to a certain universe (e.g. "DC" or "Marvel"):

```javascript
// hero.js
class Hero {
    constructor(name, superpower, universe, id) {
        this.name = name;
        this.superpower = superpower;
        this.universe = universe;
        this.id = id;
    }
}

export default Hero;
```

Strictly, we don't need to declare a class for our hero objects, since we can just use 
plain JSON objects instead. However, having a Java background, I couldn't resist the urge to 
fake type safety ;).

### The Hero REST Client Service

Our REST client simply provides a method to POST a hero object to the provider:

```javascript
// hero.service.js
import Hero from "./hero";
const axios = require('axios');
import adapter from 'axios/lib/adapters/http';

class HeroService {

    constructor(baseUrl, port){
        this.baseUrl = baseUrl;
        this.port = port;
    }

    createHero(hero) {
        return axios.request({
            method: 'POST',
            url: `/heroes`,
            baseURL: `${this.baseUrl}:${this.port}`,
            headers: {
                'Accept': 'application/json; charset=utf-8',
                'Content-Type': 'application/json; charset=utf-8'
            },
            data: hero
        }, adapter);
    };

}

export default HeroService;
```

We use Axios to submit a POST request to a certain url and port containing a hero object as payload.

Note that we use the Axios http adapter to make sure that the requests are made just as they would
in a browser, even in a Node environment.

We can use this service in our React components now and it should work. 

## Implementing a Contract Test

Next, let's create a test for our REST client. 

Within this test, we want to:

* define the contract between the REST client and the REST provider
* verify that our REST client works as defined in the contract.

### The Test Template

The test structure will look like this:

```javascript
// hero.service.test.pact.js
import HeroService from './hero.service';
import * as Pact from '@pact-foundation/pact';
import Hero from './hero';

describe('HeroService API', () => {

    const heroService = new HeroService('http://localhost', global.port);

    describe('createHero()', () => {

        beforeEach((done) => {
           // ...
        });

        it('sends a request according to contract', (done) => {
           // ...
        });

    });

});
```

We see the usual `describe()` and `it()` functions popular in javascript testing frameworks.

Also, we create an instance of our `HeroService` REST client and tell it to please send its
requests to `localhost:8080`. 

We'll fill the `beforeEach()` and `it()` functions next. 

### Defining the Contract

Within `beforeEach()`, we'll define our contract and make it known to the pact mock provider:

```javascript
beforeEach((done) => {
  
    const contentTypeJsonMatcher = Pact.Matchers.term({
        matcher: "application\\/json; *charset=utf-8",
        generate: "application/json; charset=utf-8"
    });
  
    global.provider.addInteraction({
        state: 'provider allows hero creation',
        uponReceiving: 'a POST request to create a hero',
        withRequest: {
            method: 'POST',
            path: '/heroes',
            headers: {
                'Accept': 'application/json',
                'Content-Type': contentTypeJsonMatcher
            },
            body: new Hero(null, 'Superman', 'flying', 'DC')
        },
        willRespondWith: {
            status: 201,
            headers: {
                'Content-Type': contentTypeJsonMatcher
            },
            body: Pact.Matchers.somethingLike(
                new Hero(42, 'Superman', 'flying', 'DC'))
        }
     }).then(() => done());
});
```

**A request / response pair is called an "interaction" in Pact lingo.** 

By calling `provider.addInteraction()`, we pass such a request / response pair
to the mock provider. If the mock provider afterwards receives a request that matches 
the request of that pair, it will respond with the response paired with that request.

Also, when calling `provider.verify()` (as we'll do later), the provider will
check if all requests that have been passed into `addInteraction()` earlier have been 
received and will fail if any are missing. 
 
The JSON structure of an interaction is pretty self-explanatory. For a list of all options
refer to the [dsl implementation](https://github.com/pact-foundation/pact-js/blob/master/src/dsl/interaction.ts).

**Note, however, that we're not expecting the response body to match exactly**.

Instead, we're expecting the response body to contain a JSON object that looks like
a Hero object by using `Pact.Matchers.somethingLike()`. This matcher will **check that
the body contains all fields of a hero and that each field has the correct type**.

We're using another matcher on the content type. This is a simple regex matcher
that ignores the white space in `application/json; charset=utf-8`. This is necessary
for the test to work with some servers that seem to forget this whitespace.

The matchers decouple our contract from the provider test because the provider does not
have to return the exact object specified in the contract. In turn, this will make
our tests much more stable through changes that might happen over time.

### Verifying the REST Client

All we have left to do is to verify that our REST client works as the contract
expects it to. We do this in the actual test method `it()`: 

```javascript
it('sends a request according to contract', (done) => {
    heroService.createHero(new Hero('Superman', 'flying', 'DC'))
        .then(response => {
            const hero = response.data;
            expect(hero.id).toEqual(42);
        })
        .then(() => {
            global.provider.verify()
                .then(() => done(), error => {
                    done.fail(error)
                })
        });
});
```

Here, we simply call our `HeroService` and pass it the Hero object we want
to send to the server. 

Since the `HeroService` is configured to send the requests against the mock provider
on `localhost:8080`, the mock provider will receive it and check if any previously
registered interaction matches to this request. 

If the mock provider finds a match, it returns the associated response. If not, it will
return a HTTP 500 error and the test will fail.

By calling `provider.verify()` we also make sure
that the test fails if the `HeroService` doesn't send any request at all or a request that
did not match any of the registered interactions. 

We can now run our test with `npm run test:pact` and it should be green. Also, it should
have created a contract file in the `pacts` folder that can be published so that the provider
can test against it, too.

## Improving Contract Quality with Validation

Once the test we created above is green, we have successfully proved that our `HeroService`
sends valid Hero objects to the provider.

Have we really?

If we give the `createHero()` method a closer look, we'll see that it simply passes on
the `hero` parameter it gets from outside:  

```javascript
// hero.service.js
class HeroService {
    createHero(hero) {
        return axios.request({
          data: hero
          // ...
          }
        );
    };
}
```

**What happens if some client code passes an invalid hero object
into the `createHero()` method?** The REST provider will most certainly interpret it
as a bad request and return HTTP error status 400.

Also, **what if we have forgotten to add the Hero 
attribute `capeColor` into our contract but we're happily using it in 
our consumer code base?** The REST provider will certainly not include
this attribute in its responses since it's not part of the contract, which
may lead to errors in the client application.

**The test is green, but in production anything can still go wrong!** 

This is a problem we can solve by adding some validation logic to our `HeroService`: 

```javascript
class HeroService {
    createHero(hero) {
        this._validateHeroForCreation(hero);
        return axios.request({
            // ...
        }).then((response) => {
            const hero = response.data;
            return new Promise((resolve, reject) => {
                try {
                    this._validateIncomingHero(hero);
                    resolve(hero);
                } catch (error) {
                    reject(error);
                }
            });
        });
    };
}
```

Now, before we even submit the request, we pass the incoming hero object
into `_validateHeroForCreation()` where it will be validated for the use case
of creating a hero. Within this method we can include whatever validation logic
we deem necessary and throw an error if the object is invalid.

**This forces the client code using `HeroService` to send valid objects.**

On the response side, we do the same by passing the response data into
`_validateIncomingHero()` to validate the response object before returning
it to the client code wrapped into a `Promise`.

**This ensures that the test is red if the response we get from the mock provider during the test
returns an object that does not satisfy our validations.** In turn, this ensures that
the contract is specified according to our validation rules and that the
real REST provider will return valid objects, too, since it's going to be verified
against the contract.

**Adding validation to a provider-facing service class is not only good
software design, but also plainly and simply necessary for creating high-quality contracts
that help our software to behave as it's expected to.**

## Debugging 

As with a lot of other tests, it can be time-consuming to search for the cause of a test failure with Pact.
Here are some hints that help along the way.

If a pact test fails, have a look at the log file Pact creates (`logs/pact.log` in the configuration used above).

Also, those async promises can be a pain. Make sure to call the `done` function at the proper places, otherwise
this may lead to errors which are very hard to isolate.

Finally, I sometimes had problems with zombie node and ruby processes on my windows machine and
had to kill them manually (the ruby process is the Pact mock provider).

## Publishing the Contract

Now that we have successfully created a contract and verified our consumer against it, we need
to publish the contract so that the provider can do its own verification.

For this, Pact provides the [Pact Broker](https://docs.pact.io/getting_started/sharing_pacts), which
is a web application that serves as a registry for pacts. 

To publish the pact we created from the test above, we use yet another script:

```javascript
// ./pact/publish.js
let publisher = require('@pact-foundation/pact-node');
let path = require('path');

let opts = {
    providerBaseUrl: 'http://localhost:8080',
    pactFilesOrDirs: [path.resolve(process.cwd(), 'pacts')],
    pactBroker: 'https://adesso.pact.dius.com.au/',
    pactBrokerUsername: process.env.PACT_USERNAME,
    pactBrokerPassword: process.env.PACT_PASSWORD,
    consumerVersion: '2.0.0'
};

publisher.publishPacts(opts).then(() => console.log("Pacts successfully published"));
``` 

Also, we add this script to our `package.json`:

```json
{
  "scripts": {
    "publish:pact": "node pact/publish.js"
  }
}
```

After setting the environment variables `PACT_USERNAME` and `PACT_PASSWORD` (how to do this
depends on your operating system), we can publish the pact with this command:

```
npm run publish:pact
```

This task can be nicely integrated in a CI build so that the pact files on the broker
always represent the current state of the consumer. 

## Conclusion

In this tutorial, we used Pact to create a contract from within a Jest unit test and Axios
to create a REST client that is tested against this contract. 

Since Jest is the default test
framework for React apps (at least if you use the create-react-app bootstrapper), the described
setup is well applicable to implements CDC for a REST-consuming React app.

The generated contract can now be used to create a REST provider, for example with 
[Spring Boot](/consumer-driven-contract-provider-pact-spring) or [Node](/pact-node-provider).

The code for this tutorial can be found on 
[github](https://github.com/thombergs/code-examples/tree/master/pact/pact-react-consumer). 
