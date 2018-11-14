---
title: "Implementing a Consumer-Driven Contract for a GraphQL Provider with Node and Express"
categories: [cdc]
modified: 2018-11-10
last_modified_at: 2018-11-10
author: tom
tags: 
comments: true
ads: true
excerpt: "In this tutorial, we're exploring how to create a GraphQL provider with Node and Express and
          how to implement a contract test with Pact that verifies that this GraphQL provider works
          as expected by the consumer-defined contract."
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
 
In this tutorial, we're going to create a GraphQL API provider with [Node](https://nodejs.org/en/) 
and [Express](https://expressjs.com/) that implements the Heroes query from the contract
created previously by a [GraphQL consumer](/pact-node-graphql-consumer). 

Then, we'll create a contract test
with the JavaScript version of [Pact](https://github.com/pact-foundation/pact-js) that 
verifies that our provider works as specified in the contract. 

This tutorial assumes you have a current version of Node installed.

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/pact/pact-node-provider" %}

## Creating an Express Server

If you have already followed the [previous tutorial about Node and Pact](/pact-node-provider), you can re-use the
Node Express server created there.

Otherwise, follow [the instructions in the previous tutorial](/pact-node-provider#creating-an-express-server)
to create an Express Server from scratch.

## Adding the Heroes GraphQL Endpoint

Having a base Express project, we're ready to implement a new GraphQL endpoint.

### The Contract

But first, let's have a look at the contract against which we're about to implement. 
The contract has been created
by the consumer in [this article](/pact-node-graphql-consumer):

```json
{
  "consumer": {
    "name": "graphql-hero-consumer"
  },
  "provider": {
    "name": "graphql-hero-provider"
  },
  "interactions": [
    {
      "description": "a GetHero Query",
      "request": {
        "method": "POST",
        "path": "/graphql",
        "headers": {
          "content-type": "application/json"
        },
        "body": {
          "operationName": "GetHero",
          "query": "\nquery GetHero($heroId: Int!) {\nhero(id: $heroId) {\nname\nsuperpower\n__typename\n}\n}",
          "variables": {
            "heroId": 42
          }
        },
        "matchingRules": {
          "$.body.query": {
            "match": "regex",
            "regex": "\\s*query\\s*GetHero\\(\\$heroId:\\s*Int!\\)\\s*\\{\\s*hero\\(id:\\s*\\$heroId\\)\\s*\\{\\s*name\\s*superpower\\s*__typename\\s*\\}\\s*\\}"
          }
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json; charset=utf-8"
        },
        "body": {
          "data": {
            "hero": {
              "name": "Superman",
              "superpower": "Flying",
              "__typename": "Hero"
            }
          }
        },
        "matchingRules": {
          "$.headers.Content-Type": {
            "match": "regex",
            "regex": "application\\/json; *charset=utf-8"
          },
          "$.body.data.hero.name": {
            "match": "type"
          },
          "$.body.data.hero.superpower": {
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
the consumer sends a POST request containing a GraphQL query to the `/graphql` HTTP endpoint. The expected
response to that request has HTTP status 200 and contains a hero JSON object.

In the following, we assume that the contract has been published on a [Pact Broker](https://github.com/pact-foundation/pact_broker)
by the consumer. But it's also possible to take the contract file from the consumer codebase and 
copy it into the provider code base (be careful, though, we're loosing the single source of truth!). 

### Adding an Express Route

To implement the GraphQL endpoint on the provider side, we create a new route in our express server:

```javascript
// ./routes/graphql.js
const graphqlHTTP = require('express-graphql');
const {buildSchema} = require("graphql");

const heroesSchema = buildSchema(`
  type Query {
    hero(id: Int!): Hero
  }

  type Hero {
    id: Int!
    name: String!
    superpower: String!
    universe: String!
  }
`);

const getHero = function () {
    return {
        id: 42,
        name: "Superman",
        superpower: "Flying",
        universe: "DC"
    }
};

const root = {
    hero: getHero
};

const router = graphqlHTTP({
    schema: heroesSchema,
    graphiql: true,
    rootValue: root
});

module.exports = router;
```

First, we're defining a GraphQL schema for querying heroes. Note that this schema must provide the 
query we have seen in the consumer-driven contract above. 

For a detailed discussion of GraphQL schemas, refer to the [GraphQL documentation](https://graphql.org/learn/schema/).

Next, we're providing a `getHero()` function that is responsible to find a hero. In this example, we're simply
always returning the same object. In the real world, this function would load a hero from an external resource
like a database depending on an ID that's passed in.

In the `root` object, we're defining the GraphQL root. Since we're only providing a GraphQL query for heroes,
the only root is `hero` which should resolve to a hero object, so we're using the `getHero` function
we have defined above. 

Using the `express-graphql` module, we're then creating a GraphQL HTTP resolver (I called it "router" in the
style of simple REST endpoints). We set the `graphiql` property to `true` in order to get access to a nice
GraphQL query web interface.

Finally, we have to make the new endpoint known to the express server by adding it in the `app.js` file:

```javascript
// ./app.js
const graphqlRouter = require('./routes/graphql');
app.use('/graphql', graphqlRouter);
```

### Testing the GraphQL Endpoint

We now have a working `/graphql` endpoint. We can test it by running `npm run start` and
type the URL `http://localhost:3000/graphql` into a browser.

We should see the graphiql interface that looks something like this:

![GraphiQL Web Interface](/assets/images/posts/pact-node-graphql-provider/graphiql.png) 

We can play around and enter a query like shown in the screenshot to check if the server responds
accordingly.

## Setting Up Pact

Now, we want to verify that our GraphQL endpoint works as expected by the contract. 

So, let's create a contract test that does the following:

1. start up our express server with the `/graphql` endpoint
2. send a request against the endpoint with a hero query
3. verify that the response matches the expectations expressed in the contract

Pact will do most of the work, but we need to set it up correctly.
 
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

### Creating a Provider-Side Contract Test

The actual contract testing is done by Pact. We simply have to make sure that our GraphQL endpoint 
is up and running and ready to receive requests. 

Let's create the script `pact/provider_tests_graphql.js` to configure Pact:

```javascript
const { Verifier } = require('@pact-foundation/pact');
const packageJson = require('../package.json');

let opts = {
    providerBaseUrl: 'http://localhost:3000',
    provider: 'graphql-hero-provider',
    pactBrokerUrl: 'https://adesso.pact.dius.com.au',
    pactBrokerUsername: process.env.PACT_USERNAME,
    pactBrokerPassword: process.env.PACT_PASSWORD,
    publishVerificationResult: true,
    providerVersion: packageJson.version,
};

new Verifier().verifyProvider(opts).then(function () {
    console.log("Pacts successfully verified!");
});
```

To make the script runnable via Node, we add some scripts to `package.json`:  

```json
// ./package.json
{
  "scripts": {
    "start": "node ./bin/www.js",
    "pact:providerTests:graphql": "node ./pact/provider_tests_graphql.js",
    "test:pact:graphql": "start-server-and-test start http://localhost:3000 pact:providerTests:graphql"
  }
}
```

The scripts are explained in detail in my [previous tutorial](/pact-node-provider/#starting-pact) on
creating a contract test for a Node REST provider.

We can now run the provider tests and they should be green:

```
npm run test:pact:graphql
``` 

## Conclusion

In this tutorial we went through the steps to create an Express server with a GraphQL
endpoint and enabled it to run provider contract tests against a Pact contract. 

You can look at the example code from this tutorial in my 
[github repo](https://github.com/thombergs/code-examples/tree/master/pact/pact-node-provider).
