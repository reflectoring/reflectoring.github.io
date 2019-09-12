---
title: "Implementing a Consumer-Driven Contract for a GraphQL Consumer with Node and Apollo"
categories: [programming]
modified: 2018-11-10
excerpt: "In this tutorial, we're exploring how to create a GraphQL consumer with Node and Apollo. We're then going to create a contract for this GraphQL Consumer and a test that validates that the consumer works accoring to the contract."
image:
  auto: 0025-signature
---



Consumer-driven contract (CDC) tests are a technique to test integration
points between API providers and API consumers without the hassle of end-to-end tests (read it up in a 
[recent blog post](/7-reasons-for-consumer-driven-contracts/)).
A common use case for consumer-driven contract tests is testing interfaces between 
services in a microservice architecture. 

This article explains the steps of setting up a GraphQL client (or "consumer") using the [Apollo](https://www.apollographql.com/)
framework. We'll then create and publish a consumer-driven contract for the GraphQL interaction 
between the GraphQL client and the API provider and implement a contract test that validates that
our consumer is working as expected by the contract. For this, we're using the Node version of the 
[Pact](https://pact.io) framework.

This tutorial builds upon a [recent tutorial](/pact-react-consumer) about creating a React
consumer for a REST API, so you'll find some links to that tutorial for more detailed explanations.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/pact/pact-react-consumer" %}

## Creating the Node App

To set up a Node app, follow [the instructions in the previous tutorial](/pact-react-consumer/#creating-a-react-app).
There, we're using the `create-react-app` tool to create a React client that already has [Jest](https://jestjs.io/) set up as
a testing framework.

However, since we're not using React in this tutorial, you can also create a plain Node app. Then you have
to set up a test framework manually, though.

## Adding Dependencies

In our `package.json`, we need to declare some additional dependencies:

```json
{
  "dependencies": {
    "apollo-cache-inmemory": "^1.3.9",
    "apollo-client": "^2.4.5",
    "apollo-link-http": "^1.5.5",
    "graphql": "^14.0.2",
    "graphql-tag": "^2.10.0",
    "node-fetch": "^2.2.1"
    }
}
```

* [apollo-client](https://www.npmjs.com/package/apollo-client) provides Apollo's GraphQL client implementation
* [apollo-cache-inmemory](https://www.npmjs.com/package/apollo-cache-inmemory) contains Apollo's implementation of an 
  in-memory-cache that is used to cache GraphQL query results to reduce the number of requests to the server
* [apollo-link-http](https://www.npmjs.com/package/apollo-link-http) allows us to use GraphQL over HTTP
* [graphql](https://www.npmjs.com/package/graphql) and [graphql-tag](https://www.npmjs.com/package/graphql-tag)
  provide the means to work with GraphQL queries
* [node-fetch](https://www.npmjs.com/package/node-fetch) implements the global `fetch` operation that is available 
  in browsers, but not in a Node environment.
  
Don't forget to run `npm install` after changing the dependencies.

## Setting Up Jest

We're using Jest as the testing framework for our contract tests.

Follow [the instructions in the previous tutorial](/pact-react-consumer/#setting-up-jest)
to set up Jest. If you want the code of the previous tutorial and the code of this tutorial to exist in parallel,
note these changes:

* copy the file `pact/setup.js` to `pact/setup-graphql.js` and use different consumer and provider names
* in `package.json` add a script `test:pact:graphql` referring to `pact/setup-graphql.js` and using
  `--testMatch \"**/*.test.graphql.pact.js\"` in order to only execute our graphQL client tests

Now, we can run the pact tests with this command:

```
npm run test:pact:graphql
```

We just don't have a test to run, yet.

## The Hero GraphQL Client

Let's implement a GraphQL client that we can test.

We're going to create a client that allows us to query heroes from a GraphQL server.

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

### The Hero GraphQL Client Service

For loading a hero from the server via GraphQL, we're creating the `GraphQLHeroService` class:

```javascript
import {ApolloClient} from "apollo-client"
import {InMemoryCache} from "apollo-cache-inmemory"
import {HttpLink} from "apollo-link-http"
import gql from "graphql-tag"
import Hero from "hero";

class GraphQLHeroService {

    constructor(baseUrl, port, fetch) {
        this.client = new ApolloClient({
            link: new HttpLink({
                uri: `${baseUrl}:${port}/graphql`,
                fetch: fetch
            }),
            cache: new InMemoryCache()
        });
    }

    getHero(heroId) {
        if (heroId == null) {
            throw new Error("heroId must not be null!");
        }
        return this.client.query({
            query: gql`
              query GetHero($heroId: Int!) {
                hero(id: $heroId) {
                  name
                  superpower
                }
              }
            `,
            variables: {
                heroId: heroId
            }
        }).then((response) => {
            return new Promise((resolve, reject) => {
                try {
                    const hero = new Hero(response.data.hero.name, 
                        response.data.hero.superpower, 
                        null, 
                        heroId);
                    Hero.validateName(hero);
                    Hero.validateSuperpower(hero);
                    resolve(hero);
                } catch (error) {
                    reject(error);
                }
            })
        });
    };

}

export default GraphQLHeroService;
```

First, we're creating a new `ApolloClient` that is pointed to a certain URL and port.

In the constructor, we're passing a `fetch` function. In a browser environment, this is a globally
available function. However, we're going to run our tests in a Node environment where this function
is not available by default. So, to make our service compatible to both environments, we're taking
a fetch function as a parameter and pass it on to be used by the GraphQL client.

In the `getHero` function, we're using `gql` to create a GraphQL query.

## Implementing a Contract Test

In this test, we're going to:

* create a contract between our GraphQL client and GraphQL provider
* verify that our GraphQL client works as defined in the contract.

### The Test Template

The test structure will look like this:

```javascript
// hero.service.test.graphql.pact.js
import GraphQLHeroService from './hero.service.graphql';
import * as Pact from '@pact-foundation/pact';
import fetch from 'node-fetch';

describe('HeroService GraphQL API', () => {

    const heroService = new HeroService('http://localhost', global.port, fetch);

    describe('getHero()', () => {

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

Also, we create an instance of our `GraphQLHeroService` GraphQL client and tell it to please send its
requests to `localhost:8080`. 

Additionally, we're importing the `fetch` function from `node-fetch` to pass it into our `GraphQLHeroService` to
make it compatible within the Node environment.

We'll fill in the `beforeEach()` and `it()` functions next. 

### Defining the Contract

Within the `beforeEach` function, we're defining our contract:

```javascript
// hero.service.test.graphql.pact.js
beforeEach((done) => {
  
    const contentTypeJsonMatcher = Pact.Matchers.term({
        matcher: "application\\/json; *charset=utf-8",
        generate: "application/json; charset=utf-8"
    });

    global.provider.addInteraction(new Pact.GraphQLInteraction()
        .uponReceiving('a GetHero Query')
        .withRequest({
            path: '/graphql',
            method: 'POST',
        })
        .withOperation("GetHero")
        .withQuery(`
            query GetHero($heroId: Int!) {
              hero(id: $heroId) {
                  name
                  superpower
                  __typename
              }
            }`)
        .withVariables({
            heroId: 42
        })
        .willRespondWith({
            status: 200,
            headers: {
                'Content-Type': contentTypeJsonMatcher
            },
            body: {
                data: {
                    hero: {
                        name: Pact.Matchers.somethingLike('Superman'),
                        superpower: Pact.Matchers.somethingLike('Flying'),
                        __typename: 'Hero'
                    }
                }
            }
        }))
        .then(() => done());
});
```

By calling `provider.addInteraction()`, we're passing a request / response pair to the
pact mock server (which has been started by the `jest-wrapper.js` script we defined above).

Since we want to create a GraphQL interaction, we're using Pact's `GraphQLInteraction` class
to describe this interaction.

The differences to a standard REST interaction are the `.withOperation()`, `.withQuery()` and
`.withVariables()` functions. These we can use to define the name of the GraphQL operation (if
we have defined a name in the query), the GraphQL query itself and the variables used within the query.

For a discussion of the GraphQL Syntax, refer to the [GraphQL documentation](https://graphql.org/learn/).

Note the `__typename` field in the query. We have not defined such a field in our `Hero` class.
However, the Apollo GraphQL client adds this field by itself, so we need to include it into our
contract.   

Also note that whitespaces are not important in the GraphQL query. If the GraphQL client 
adds whitespaces and line breaks in a different manner, it doesn't matter.   

### Verifying the GraphQL Client

Now, we want to make sure that our `GraphQLHeroService` works as expected by the contract.
We do this in the actual test method `it()`:

```javascript
// hero.service.test.graphql.pact.js
it('sends a request according to contract', (done) => {
    heroService.getHero(42)
        .then(hero => {
            expect(hero.name).toEqual('Superman');
        })
        .then(() => {
            global.provider.verify()
                .then(() => done(), error => {
                    done.fail(error)
                })
        });
});
```

We're calling our `heroService` to fetch a hero for us. Since the `heroService`
is configured to send requests to the Pact mock provider, Pact can check
if the request matches a certain request / response pair.

In our case, we have only defined a single request / response pair, so if the
request does not match the request we have defined in our `before()` function above,
we'll get an error.

If the request matches, the Pact mock provider will return the response we have 
provided in the contract. To prove that, we assert that the heroes `name` is the
one we provided in the contract.

By calling `provider.verify()` we also make sure
that the test fails if the `heroService` doesn't send any request at all or a request that
did not match any of the registered interactions. 

We can now run our test with `npm run test:pact:graphql` and it should be green. Also, it should
have created a contract file in the `pacts` folder that can be published so that the provider
can test against it, too.

## Improving Contract Quality with Validation

Read [this discussion](/pact-react-consumer/#improving-contract-quality-with-validation) in my previous tutorial.

## Debugging
Read [this discussion](/pact-react-consumer/#debugging) in my previous tutorial.

## Publishing the Contract
Read [this discussion](/pact-react-consumer/#publishing-the-contract) in my previous tutorial.

## Conclusion
In this tutorial, we have successfully created a GraphQL client with Node and Apollo. We have
also defined a contract for this client and verified that this client works as expected by the contract.

The contract can now be used to verify that a certain GraphQL provider works as expected.

The code for this tutorial can be found on 
[github](https://github.com/thombergs/code-examples/tree/master/pact/pact-react-consumer).
