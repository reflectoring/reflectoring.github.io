---
title: "Implementing a Consumer-Driven Contract between a Node Message Consumer and a Node Message Producer"
categories: [cdc, testing]
modified: 2018-11-14
last_modified_at: 2018-11-14
author: tom
tags: 
comments: true
ads: true
excerpt: "In this tutorial, we're exploring how to implement a consumer-driven contract
          with Pact between a message consumer and provider both based on Node."
sidebar:
  nav: cdc
  toc: true
---



Consumer-driven contract (CDC) tests are a technique to test integration
points between API providers and API consumers without the hassle of end-to-end tests (read it up in a 
[recent blog post](/7-reasons-for-consumer-driven-contracts/)).
A common use case for consumer-driven contract tests is testing interfaces between 
services in a microservice architecture. 

In this article, we're going to create a contract between a [Node](https://nodejs.org/en/)-based consumer and provider
of asynchronous messages with [Pact](https://pact.io).

We'll then create a consumer and a provider test verifying that both the consumer and provider
work as defined by the contract.

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/pact/pact-node-messages" %}

## Setting Up a Node Project

Let's start by setting up a Node project from scratch that will later contain both, the message consumer and the
message provider.

Note that in the real world, the consumer and producer will most likely be in completely different projects.

To set up the project, we create a `package.json` file with the following content: 

```json
// package.json
{
  "name": "pact-node-messages",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test:pact:consumer": "mocha src/consumer/*.spec.js --exit",
    "test:pact:provider": "mocha src/provider/*.spec.js --exit",
    "publish:pact": "node pact/publish.js"
  },
  "author": "Zaphod Beeblebrox",
  "license": "MIT",
  "devDependencies": {
    "@pact-foundation/pact": "^7.0.3",
    "mocha": "^5.2.0"
  }
}
```

Noteworthy in the `package.json` file are the `scripts` and `devDependencies` sections.

In the `devDependencies` section, we pull in the following dependencies used only in tests:

* we use `@pact-foundation/pact` as the framework to facilitate our contract tests, both for the consumer
  and provider side
* we use `mocha` as the testing framework to drive the contract tests.

In the `scripts` section, we have created three scripts:

* with `npm test:pact:consumer`, we tell `mocha` to run the consumer-side contract tests
* with `npm publish:pact`, we can publish the contract file created by the consumer-side contract test
* with `npm test:pact:provider`, we can then tell `mocha` to run the provider-side contract tests against the
  previously published contracts

Note the `--exit` in both test scripts. This is added to tell `mocha` to kill the process after
having run all tests, instead of waiting for changes in the source files and then automatically
re-running the tests. This is needed to make the tests runnable within a CI pipeline. 

## Defining the Message Structure 

Since we want to exchange a message between a consumer and a provider, the next step is to define the
message structure.

As an example to work with, we'll use the "Hero" domain. The message provider wants to express that a new Hero has been created, so we create
a class named `HeroCreatedEvent` that both the consumer and the provider can use to send and receive a message (the
terms "event" and "message" are used interchangably in the rest of this tutorial):

```javascript
// ./src/common/hero-created-event.js
class HeroCreatedEvent {

    constructor(name, superpower, universe, id) {
        this.id = id;
        this.name = name;
        this.superpower = superpower;
        this.universe = universe;
    }

    static validateUniverse(event) {
        if (typeof event.universe !== 'string') {
            throw new Error(`Hero universe must be a string! Invalid value: ${event.universe}`)
        }
    }

    static validateSuperpower(event) {
        if (typeof event.superpower !== 'string') {
            throw new Error(`Hero superpower must be a string! Invalid value: ${event.superpower}`)
        }
    }

    static validateName(event) {
        if (typeof event.name !== 'string') {
            throw new Error(`Hero name must be a string! Invalid value: ${event.name}`);
        }
    }

    static validateId(event) {
        if (typeof event.id !== 'number') {
            throw new Error(`Hero id must be a number! Invalid value: ${event.id}`)
        }
    }
}

module.exports = HeroCreatedEvent;
```

**The class simply contains a couple of attributes and a method to validate each attribute**. We'll talk about
why validation is important later. 

There are probably a lot of other, not-so-verbose, ways of doing validation in Javascript, but bear with
me here :). 

## Implementing the Message Consumer

When doing consumer-driven contracts we start with the consumer-side. So let's see how to implement
the consumer.

### Message Handler

Our message consumer should receive a `HeroCreatedEvent`, so we're simply building an event handler
with a function that takes an object and validates if it really is a `HeroCreatedEvent`:

```javascript
// ./src/consumer/hero-event-handler.js
const HeroCreatedEvent = require('../common/hero-created-event');

exports.HeroEventHandler = {
    handleHeroCreatedEvent: (message) => {

        HeroCreatedEvent.validateId(message);
        HeroCreatedEvent.validateName(message);
        HeroCreatedEvent.validateSuperpower(message);
        HeroCreatedEvent.validateUniverse(message);

        // ... pass the event into domain logic
    }
};
```

Again, such an event handler can be implemented in a myriad of other ways, **it's just important that it takes
an event as an argument and validates that it really has all attributes expected of such an event**.

The handler should then forward the event to the domain logic that actually processes the event. 

**The handler should
not implement that domain logic itself**. Instead, in the context of the upcoming contract test,
the domain logic should be mocked away, for example by using dependency injection. 

This way, we don't have
to pull up a database and whatever other dependencies our consumer application needs to function properly.

### What About My Messaging Middleware?

You might be wondering where the messaging middleware comes into play. We might use an on-premise messaging
platform like Kafka or RabbitMQ or we could use a cloud provider like Amazon Kinesis.

**However, for our contract tests, the messaging middleware is irrelevant**. We want to verify that provider and 
consumer speak the same language (i.e. use the same message structure). We don't want to test 
connectivity to our messaging middleware.

To be able to test the message structure without the messaging middleware, we need a clean architecture
for our message handler. 

**In production, there will be a message listener in front of our handler that 
actually connects to the middleware and forwards the plain message to the handler**. 

The handler in turn 
forwards the validated message to the domain logic, which we can mock away in the contract test.

### Consumer-Side Contract Test

Let's create the consumer-side contract test next:

```javascript
// ./src/consumer/hero-event-handler.spec.js
const {MessageConsumerPact, Matchers, synchronousBodyHandler}  
    = require('@pact-foundation/pact');
const {HeroEventHandler} = require('./hero-event-handler');
const path = require('path');

describe("message consumer", () => {

    const messagePact = new MessageConsumerPact({
        consumer: "node-message-consumer",
        provider: "node-message-provider",
        dir: path.resolve(process.cwd(), "pacts"),
        pactfileWriteMode: "update",
        logLevel: "info",
    });

    describe("'hero created' message Handler", () => {

        it("should accept a valid hero created message", (done) => {
            messagePact
                .expectsToReceive("a hero created message")
                .withContent({
                    id: Matchers.like(42),
                    name: Matchers.like("Superman"),
                    superpower: Matchers.like("flying"),
                    universe: Matchers.term({generate: "DC", matcher: "^(DC|Marvel)$"})
                })
                .withMetadata({
                    "content-type": "application/json",
                })
                .verify(synchronousBodyHandler(HeroEventHandler.handleHeroCreatedEvent))
                .then(() => done(), (error) => done(error));
        }).timeout(5000);
    });
});
```

In the test, we create a `MessageConsumerPact` and provide some metadata for the contract:

* the `consumer` option defines the name of the consumer application
* the `provider` option defines the name of the provider application we're receiving the message from
* with the `dir` option we can point to the directory where Pact should create the contract files ("pact files")
* the `pactfileWriteMode` option defines if existing pact files should be updated or overwritten
* the `logLevel` option finally defines the granularity of Pact's logging output.

We're using the `MessageConsumerPact` object in the test to define a message interaction between
the provider and consumer. In this interaction, we define the structure of the message, i.e. 
the attributes of a `HeroCreatedEvent`. 

**This is our contract definition and will be stored
in a pact file later**.

Next, we're passing our event handler into the `verify` function. Depending on whether our event handler
returns synchronously or asynchronously (i.e. returns a `Promise`), we have to wrap it into a `synchronousBodyHandler` or a 
`asynchronousBodyHandler`.

Pact will now create a message from the contract we have defined above 
and pass it into the handler. Since the handler verifies incoming messages, the test will fail
if the contract defines a different structure from the structure the handler expects. 

**This is why
the validation in the handler is so important.** If the validation step was missing, the test might 
be green even for messages not matching the domain logic's expectations, leading to painful errors
in production.

We can now run the test with the command `npm run test:pact:consumer` and it should pass and create a 
pact file in the `./pacts` folder.

### Publishing the Contract

Since the provider needs the contract for testing, we need to publish it. We can do so with a simple
script:

```javascript
// ./pact/publish.js
let publisher = require('@pact-foundation/pact-node');
let path = require('path');

let opts = {
    pactFilesOrDirs: [path.resolve(process.cwd(), 'pacts')],
    pactBroker: 'BROKER_URL',
    pactBrokerUsername: process.env.PACT_USERNAME,
    pactBrokerPassword: process.env.PACT_PASSWORD,
    consumerVersion: '2.0.0'
};

publisher.publishPacts(opts).then(
  () => console.log("Pacts successfully published"));
```

When this script is called, it will send all pacts in the `./pacts` folder to the specified 
[Pact Broker](https://github.com/pact-foundation/pact_broker). A Pact Broker serves as neutral
ground between the consumer and provider that both can access from a CI pipeline.

We can now publish the pact created earlier with the command `npm run publish:pact`. 

## Implementing the Message Provider

Now that the Pact is published, we can implement and test the message provider.

### Message Producer

Similar to the message handler on the consumer side, the message producer has a very
specific responsibility, namely being the single instance in the provider application
that creates `HeroCreatedEvents`:

```javascript
// ./src/provider/hero-event-producer.js
const HeroCreatedEvent = require('../common/hero-created-event');

exports.CreateHeroEventProducer = {
    produceHeroCreatedEvent: () => {
        return new Promise((resolve, reject) => {
            resolve(new HeroCreatedEvent("Superman", "Flying", "DC", 42));
        });
    }
};
```

I'll stress it again to make the importance clear: **the above event producer must be the single
place in the whole provider application where events of Type `HeroCreatedEvent` are created**. 

This way we're making sure that in our provider test, we're testing against the message structure
that is actually used in the provider code base.

Also similar to the consumer side, the message producer needs no connection to the messaging middleware. 
In production, the domain logic will call our producer to create an event and then pass it to the 
messaging middleware.

If you desing the message producer to send the events to the messaging middleware directly, make
sure to mock that dependency away in the upcoming contract test.

### Provider-Side Contract Test

Let's verify that our message producer implementation actually creates messages that satisfy
the contract's dependencies.

For this, we create another test:

```javascript
// ./src/provider/hero-event-producer.spec.js
const {MessageProviderPact} = require('@pact-foundation/pact');
const {CreateHeroEventProducer} = require('./hero-event-producer');
const path = require('path');

describe("message producer", () => {

    const messagePact = new MessageProviderPact({
        messageProviders: {
            "a hero created message": 
                () => CreateHeroEventProducer.produceHeroCreatedEvent(),
        },
        log: path.resolve(process.cwd(), "logs", "pact.log"),
        logLevel: "info",
        provider: "node-message-provider",
        pactBrokerUrl: "BROKER_URL",
        pactBrokerUsername: process.env.PACT_USERNAME,
        pactBrokerPassword: process.env.PACT_PASSWORD
    });

    describe("'hero created' message producer", () => {

        it("should create a valid hero created message", (done) => {
            messagePact
                .verify()
                .then(() => done(), (error) => done(error));
        }).timeout(5000);

    });

});
```

First, we're creating an instance of `MessageProviderPact` and again provide some metadata:

* in the `messageProviders` map, we define a message producer for each interaction of the contracts
  we're testing; this is where we pass in our producer implementation
* the `log` option allows to specify the path to a log file (definitely check this log file when
  running into errors!)
* the `provider` option allows us to define the name of our provider; Pact will verify the provider
  against all contracts from the Pact Broker that it finds with this provider name
* with the `pactBroker*` options we define the connection to the Pact Broker

Note that due to [a bug or configuration error](https://github.com/pact-foundation/pact-js/issues/248) I was not able 
to successfully run the provider test against a pact broker (in fact, the test always succeeded, even
if the message producer produced a message with an invalid structure). 
Instead, [I use the `pactUrls` option](https://github.com/thombergs/code-examples/blob/master/pact/pact-node-messages/src/provider/hero-event-producer.spec.js#L15)
to load the contract from a file until the issue is solved.

In the actual test, we're simply calling the `verify()` function on the `MessageProviderPact` instance. 
Pact will then run through all contracts associated with the provider and call our message producer
to create an event. Pact will then check that the structure of that event matches to the
structure defined in the contract.

We can now run the provider test with the command `npm run test:pact:provider` and it should succeed. If
we change the event producer to return an invalid event it should fail. 

## Conclusion

In this tutorial, we have created a messaging consumer and provider based on Node and tested them
against a contract created with Pact. 

We learned that for those contract tests **we don't need a connection
to the actual messaging middleware** and that **it's important to validate incoming messages on the 
consumer side and to have a single point of responsibility for creating messages on the provider side**.

You can access the code examples on my [github repo](https://github.com/thombergs/code-examples/tree/master/pact/pact-node-messages).
