---
title: "Implementing a Consumer-Driven Contract for a Node Express Server with Pact"
categories: [programming]
modified: 2018-10-28
excerpt: "A tutorial that shows how to implement a REST provider with a Node Express Server
          using the Pact framework."
image:
  auto: 0026-signature
---



Consumer-driven contract (CDC) tests are a technique to test integration
points between API providers and API consumers without the hassle of end-to-end tests (read it up in a 
[recent blog post](/7-reasons-for-consumer-driven-contracts/)).
A common use case for consumer-driven contract tests is testing interfaces between 
services in a microservice architecture. 

In this tutorial, we're going to create a REST provider with [Node](https://nodejs.org/en/) 
and [Express](https://expressjs.com/) that implements the Heroes endpoints from the contract
created in [this article](/pact-react-consumer). 

Then, we'll create a contract test
with the JavaScript version of [Pact](https://github.com/pact-foundation/pact-js) that 
verifies that our provider works as specified in the contract. 

This tutorial assumes you have a current version of Node installed.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/pact/pact-node-provider" %}

## Creating an Express Server

Let's start by creating an Express server from scratch.

Since we don't want to do this by hand, we'll install the `express-generator`:

```text
npm install -g express-generator 
```

Then, we simply call the generator to create a project template for us:

```text
express --no-view pact-node-provider
```

We're using the `--no-view` parameter since we're only implementing REST endpoint and thus 
don't need any templating engine. 

Don't forget to call `npm install` in the created project folder now to install the dependencies. 

## Adding the Heroes Endpoint

Having a base Express project, we're ready to implement a new REST endpoint.

### The Contract

But first, let's have a look at the contract against which we're about to implement. 
The contract has been created
by the consumer in [this article](/pact-react-consumer):

```json
{
  "consumer": {
    "name": "hero-consumer"
  },
  "provider": {
    "name": "hero-provider"
  },
  "interactions": [
    {
      "description": "a POST request to create a hero",
      "providerState": "provider allows hero creation",
      "request": {
        "method": "POST",
        "path": "/heroes",
        "headers": {
          "Accept": "application/json; charset=utf-8",
          "Content-Type": "application/json; charset=utf-8"
        },
        "body": {
          "name": "Superman",
          "superpower": "flying",
          "universe": "DC"
        },
        "matchingRules": {
          "$.headers.Accept": {
            "match": "regex",
            "regex": "application\\/json; *charset=utf-8"
          },
          "$.headers.Content-Type": {
            "match": "regex",
            "regex": "application\\/json; *charset=utf-8"
          }
        }
      },
      "response": {
        "status": 201,
        "headers": {
          "Content-Type": "application/json; charset=utf-8"
        },
        "body": {
          "id": 42,
          "name": "Superman",
          "superpower": "flying",
          "universe": "DC"
        },
        "matchingRules": {
          "$.headers.Content-Type": {
            "match": "regex",
            "regex": "application\\/json; *charset=utf-8"
          },
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

The contract contains a single request / response pair, called an "interaction". In this interaction,
the consumer sends a POST request with a Hero-JSON-object in the body and the provider
is expected to return a response with HTTP status 201 which again contains the hero in the body,
this time with an ID that was added by the server.

In the following, we assume that the contract has been published on a [Pact Broker](https://github.com/pact-foundation/pact_broker)
by the consumer. But it's also possible to take the contract file from the consumer codebase and 
access it directly in the provider code base. 

### Adding an Express Route

We now want to implement the contract on the provider side. 

For this, we create a new POST route that expects a hero JSON object as payload:

```javascript
// ./routes/heroes.js
const express = require('express');
const router = express.Router();

router.route('/')
    .post(function (req, res) {
        res.status(201);
        res.json({
            id: 42,
            superpower: 'flying',
            name: 'Superman',
            universe: 'DC'
        });
    });

module.exports = router;
```

**I highly recommend to add some kind of validation to check the incoming request (e.g. check that the
body contains all expected fields).** I explained [here](/pact-react-consumer#improving-contract-quality-with-validation)
why validation immensely improves the quality of our contract tests.

Now we have to make the new route available to the Express application by adding
it in `app.js`:

```javascript
// ./app.js
const heroesRouter = require('./routes/heroes');
app.use('/heroes', heroesRouter);
```

We just implemented the provider side of the contract. We can check if it works by calling `npm run start` and
sending a POST request to `http://localhost:3000/heroes` with a REST client tool. Or, we can just
type the URL into your browser. However, we'll get HTTP status 405 then, because the browser sends
a GET request and a POST request is expected.

**Now we have to prove that the provider actually works as expected by the contract.**

## Setting Up Pact

So, let's set up Pact to implement a provider test that verifies our endpoint against
the contract.

The provider test reads the interactions from a contract and for each interaction,
does the following:

1. put the provider into a state that allows to respond accordingly 
2. send the request to the provider
3. validate that the response from the provider matches the response from the contract.

Pact does most of the work here, we just need to set it up correctly. 

### Dependencies

First, we add some dependencies to `package.json`:

```json
// ./package.json
{
  "devDependencies": {
    "@pact-foundation/pact": "7.0.3",
    "start-server-and-test": "^1.7.5"
  }
}
```

* we use [`pact`](https://www.npmjs.com/package/@pact-foundation/pact) to interpret a given contract file and create a provider test for us
* we use [`start-server-and-test`](https://www.npmjs.com/package/start-server-and-test) to allow us to start up the Express server and the provider test at once.

### Adding a Provider State Endpoint

The first step of the provider test for each interaction is to put the provider into a certain state,
called "provider state" in Pact lingo. 

In [the contract](#the-contract) above the provider state for our single interaction 
is called "provider allows hero creation".

**Provider states can be used by the provider to mock database queries, for example**. When the provider
is notified to go into the state "provider allows hero creation" it knows which database queries
are needed and can set up mocks that simulate the database accordingly. 

Thus, we don't need to spin up a database during the test. **A major advantage of CDC tests is to be able to execute them
without spinning up a whole server farm with a database and other dependencies**. Hence, we should make
use of mocks that react to the provider states.

You can read more about provider states in the [Pact docs](https://docs.pact.io/getting_started/provider_states).

In order to put the provider into a certain state, it needs a POST endpoint that accepts the `consumer` and
`state` query parameters:

```javascript
// ./routes/provider_state.js
const express = require('express');
const router = express.Router();

router.route('/')
    .post(function (req, res) {
        const consumer = req.query['consumer'];
        const providerState = req.query['state'];
        // imagine we're setting the server into a certain state
        res.send(`changed to provider state "${providerState}" for consumer "${consumer}"`);
        res.status(200);
    });

module.exports = router;
```

Note that the endpoint implementation above is just a dummy implementation. We don't have any database access in
our `/heroes` endpoint, hence we don't need to mock anything. 

Next, we make the endpoint available to the Express app:

```javascript
// ./app.js
var providerStateRouter = require('./routes/provider_state');

if (process.env.PACT_MODE === 'true') {
    app.use('/provider-state', providerStateRouter);
}
```

**We only activate the endpoint when the environment variable `PACT_MODE` is set to `true`, since we
don't want this endpoint in production.** 
 
Make sure to set this environment variable when running the test later. 

Providing an endpoint that is only needed in tests is quite invasive. There's a [feature proposal](https://github.com/pact-foundation/pact-js/issues/209)
that provides "state handlers" that can react to provider states within your provider test. This way, we can
mock external dependencies depending on the provider state 
more cleanly within the test, instead of "polluting" our application
with a dedicated endpoint. However, this feature has not made it into Pact, yet.

### Creating a Provider-Side Contract Test

Now we create a script `pact/provider_tests.js` to use Pact to do the actual testing:

```javascript
// ./pact/provider_tests.js
const { Verifier } = require('@pact-foundation/pact');
const packageJson = require('../package.json');

let opts = {
    providerBaseUrl: 'http://localhost:3000',
    pactBrokerUrl: 'https://adesso.pact.dius.com.au',
    pactBrokerUsername: process.env.PACT_USERNAME,
    pactBrokerPassword: process.env.PACT_PASSWORD,
    provider: 'hero-provider',
    publishVerificationResult: true,
    providerVersion: packageJson.version,
    providerStatesSetupUrl: 'http://localhost:3000/provider-state'
};

new Verifier().verifyProvider(opts).then(function () {
    console.log("Pacts successfully verified!");
});
```

In the script we define some options and pass them to a `Verifier` instance
that executes the three steps (provider state, send request, validate response).

The most important options are:

* **pactBroker...**: coordinates to the pact broker instance where Pact can download the
  contracts. Username and password are read from environment variables since we don't
  want to include them in code.
* **provider**: we tell pact to download only contracts for the provider we're currently
  implementing, which in this case is `hero-provider`.
* **providerBaseUrl**: base url of the provider to which the requests are going to be
  sent. In our case, we're starting the Express server locally on port 3000.
* **providerStatesSetupUrl**: the url to change provider states. This refers to the endpoint
  we have created above. In our case, we could actually leave this option out, since our provider state
  endpoint doesn't really do anything.
  
Instead of providing the coordinates to a pact broker, we could also provide a
`pactUrls` option pointing directly to local pact files. 

A full description of the options can be found 
[here](https://github.com/pact-foundation/pact-js#provider-api-testing).

If the script is run, it will load all contracts for the provider `hero-provider` 
from the specified Pact Broker and then call Pact's `Verifier`. For each interaction defined
int the loaded contracts the `Verifier` will send a request to `http://localhost:3000` and
check if the response matches the expectations expressed in the contract.  

To make the script runnable via Node, we add some scripts to `package.json`:  

```json
// ./package.json
{
  "scripts": {
    "start": "node ./bin/www.js",
    "pact:providerTests": "node ./pact/provider_tests.js",
    "test:pact": "start-server-and-test start http://localhost:3000 pact:providerTests"
  }
}
```

The `start` script has already been added by the Express generator.

The script `pact:providerTests` runs the `provider_tests.js` script from above. However,
this will only work when the Express server is already running.

So we create a third script `test:pact` that uses the `start-server-and-test` tool we
added to our dependencies earlier to start up the Express server first and then run the
provider tests. 

We tell the tool to run the `start` task first and run the server on `localhost:3000` before
running the `pact:providerTests` task.

We can now run the provider tests and they should be green:

```text
npm run test:pact
``` 

## Conclusion

In this tutorial we went through the steps to create an Express server from scratch
and enabled it to run provider tests against a Pact contract. 

You can look at the example code from this tutorial in my 
[github repo](https://github.com/thombergs/code-examples/tree/master/pact/pact-node-provider).
