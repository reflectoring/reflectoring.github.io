---
title: "Test and Automate Features behind the Flags using Cypress Tests"
categories: ["Node"]
date: 2022-08-03 00:00:00 +1100 
modified: 2022-08-03 00:00:00 +1100
authors: [arpendu]
excerpt: "A complete walkthrough to define sample unit or automated tests in React UI using Cypress tests to test features behind feature flags using LaunchDarkly."
image: images/stock/0104-on-off-1200x628-branded.jpg
url: nodejs-feature-flag-launchdarkly-react-cypress
---

Development teams can deliver value to consumers much more quickly and with far less risk; thanks to *feature flag-driven development*. However, it also makes testing more complicated in the long run. In this article, we'll talk about some of the difficulties testing presents in the age of feature flags and offer some suggestions on how to overcome them.

We will outline five different sorts of tests that could be included in our testing plan in in order to help structure the discussion:

* **Unit Tests:** Testing separate functions with *unit* tests.

* **Integration Tests:** Verifying how different modules or functions work together.

* **End-to-End Tests:** *End-to-end* tests, also known as *functional* tests, examine how a real user might navigate our website.

* **Quality Assurance (QA) Testing:** Testing to ensure that functionality satisfies requirements is termed as *quality assurance (QA)* testing.

* **User Acceptance Testing (UAT):** Testing to get stakeholders' approval that the functionality satisfies specifications.

The *Continuous Integration (CI)* approach typically includes the automatic execution of the first three test types. A specialist QA team may occasionally carry out QA testing, which can include both human and automated tests. The first four test types aid in determining whether anything was built correctly, whereas UAT aids in determining whether something was built correctly.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/react-cypress-launchdarkly-feature-flag-test" %}}

## Different Options for Automation Tests

As we've seen, using feature flags while performing traditional automated integration testing may be very difficult. We really shouldn't advocate attempting to manage every scenario that could arise. Instead, some of the following are a few suggestions that we can try:

* Constantly write unit tests for code coverage.
* Tests scenarios that can occur due to any unknown disaster
* Always check the state of production at any point of time
* Test different user persona and its features
* Sometimes we can test various combinations

We can use different [LaunchDarkly SDK](https://launchdarkly.com/features/sdk/) to achieve all of this functionality with a lot of ease. Performing integration tests against the current production state will always provide us some assurance that everything will largely still work once we deploy our application into production. To do this, we can direct the SDK at our production environment when it starts up, or use our API to simulate the requests by downloading the current production state.

We may find it helpful to develop some testing personas to employ in our end-to-end tests if the feature flag rules benefit from user targeting. We can accomplish this by making sure our user object contains legitimate attributes that the LaunchDarkly SDK will analyze.

## Why should we Perform Beta Tests in Production?

We discuss testing in production a lot. Testing in production does not imply releasing code without tests and crossing one's fingers. Instead, it refers to the capacity to test actual features with real data in a real environment using real people.

Because they have given their QA and UAT teams the freedom to test features in a genuine production environment before making it available to the rest of their user base, some of our most productive users are able to deploy to production multiple times per day. There is no impact on other users and no need to perform a complete rollback when QA or UAT finds a bug.

The real strength of feature flags lies in this. No matter how many times you test your software using automation, you will never be able to detect every fault. But the confidence to be able to continue delivering features to consumers securely and quickly comes from being able to turn a feature off when you discover an issue in production in real-time.

Some of the important advantages of performing beta tests are:

* Even before the product is released, it provides quick input on the product, which helps to raise its quality and increase consumer satisfaction.
* The application can be tested for dependability, usability, and robustness, and testers can provide feedback and suggestions to developers to help them make improvements that will better fulfil consumer needs.
* Based on recommendations made by the testers, who are the actual users, it assists various organisational teams in making judgments about a product that are well-informed.
* Since the product is tested by actual users in a production environment, it provides accurate insight into what customers like and dislike about it.
* It helps to address software bugs that might not have been addressed or missed during any testing cycles.
* It reduces the probability of a product failing because it has previously been tested before going to production.

## How to Control the Lifeline of a Feature

One must be careful not to break any current tests while introducing a new experiment behind the feature flag. What I believe the feature lifetime should be is as follows:

* ***Experimental:*** To enable the new behavior, a new feature flag should be created. The functionality can purely be opt-in at first because the developer is testing the behavior. The current default behavior can still be experienced by all current users.
* ***Prototype:*** The new feature can now be used if it appears to be successful. The team can prepare to release it. The feature can be activated and the new feature flow can be tested using a few end-to-end tests that employ the LaunchDarkly implementation. The old behavior can still be visible in all running tests because that is the default behavior.
* ***Alternate Approach:*** At this point, the new functionality is being more widely used, and the previous behavior will eventually be eliminated. We can now change the current tests to explicitly allow the old behavior. As a result, some tests opt-in and test the new feature, while other tests do the opposite.
* ***Kill Switch:*** The majority of users if not all have the feature switched on by default. The tests created while the functionality was being developed now works without opt-in. The outdated tests are still active and using the outdated behavior.
* ***Feature Removal:*** Both the previous behavior and all previous testing can be disabled. The feature flag would now consistently denote the altered behavior.

## Brief Introduction to LaunchDarkly and its features

A SaaS based product called [LaunchDarkly](https://launchdarkly.com/) enables developers to manage feature flags. By separating feature rollout and code deployment, it enables developers to test their code live in production, gradually roll out features to groups of users, and manage flags across a flag's whole lifecycle. This gives developers more security to produce top-notch applications.

It functions as a cloud-based service in essence and provides a UI for managing all feature flags. For each flag, we must define one or more **variations**. All acceptable alternatives include a Boolean, arbitrary numbers, textual values, and JSON snippets. We can establish **targeting rules** to indicate which variation a feature flag will display to its user. By default, a targeting rule for a feature flag is inactive. 

LaunchDarkly uses a [streaming architecture](https://launchdarkly.com/blog/launchdarklys-evolution-from-polling-to-streaming/) in place of a polling design. This approach helps with scalability by preventing the requirement for network calls every time our application has to analyze or fetch a feature flag. Additionally, for robustness, feature flag evaluation will still work even if the LaunchDarkly server is no longer responding to our requests.

## Create a Simple React Application

In this article, we will focus on to cover test cases of a React UI. For this, we will define a pretty simple React application and focus primarily on writing different test cases with feature flags. To demonstrate such power to control the feature flags from Cypress tests, we will just grab an existing copy of the LaunchDarkly’s example React application.

We can clone and create our own copy using the command:

```bash
npx degit launchdarkly/react-client-sdk/examples/hoc react-cypress-launchdarkly-feature-flag-test
```

We are using [degit](https://github.com/Rich-Harris/degit#readme) command to copy the repo to our local directory.

We will first create a new LanuchDarkly project with name “Reflectoring.io” and define two environments. We will now use “Production” environment.

{{% image alt="LaunchDarkly Project" src="images/posts/nodejs-launchdarkly/LaunchDarkly_Keys.png" %}}

Then we will define a new String feature flag *testing-launch-darkly-control-from-cypress* with three variations.

{{% image alt="Launchdarkly String Feature Variation" src="images/posts/nodejs-launchdarkly/Testing_With_Cypress.png" %}}

Now, since we want to test different flags for different users, we will also switch on the “Targeting” option.

{{% image alt="LaunchDarkly Targeting option" src="images/posts/nodejs-launchdarkly/Cypress_Targeting.png" %}}

Now we will update our code to define the Client SDK ID and show the current greeting using the feature flag value. This can be changed in `app.js`:

```javascript
import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { withLDProvider } from 'launchdarkly-react-client-sdk';
import SiteNav from './siteNav';
import Home from './home';
import HooksDemo from './hooksDemo';

const App = () => (
  <div>
    <SiteNav />
    <main>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/home">
          <Redirect to="/" />
        </Route>
        <Route path="/hooks" component={HooksDemo} />
      </Switch>
    </main>
  </div>
);

// Set clientSideID to your own Client-side ID. You can find this in
// your LaunchDarkly portal under Account settings / Projects
// https://docs.launchdarkly.com/sdk/client-side/javascript#initializing-the-client
const user = {
  key: 'USER_1234'
};
export default withLDProvider({ clientSideID: '62e9289ade464c10d842c2b3', user })(App);
```

Then the Home page would simply use the value of the flag to show the greeting:

```javascript
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withLDConsumer } from 'launchdarkly-react-client-sdk';

const Root = styled.div`
  color: #001b44;
`;
const Heading = styled.h1`
  color: #00449e;
`;
const Home = ({ flags }) => (
  <Root>
    <Heading>{flags.testingLaunchDarklyControlFromCypress}, World</Heading>
    <div>
      This is a LaunchDarkly React example project. The message above changes the greeting,
      based on the current feature flag variation.
    </div>
  </Root>
);

Home.propTypes = {
  flags: PropTypes.object.isRequired,
};

export default withLDConsumer()(Home);
```

Now when we start our application using the following command we see the following UI:

```bash
npm start
```

{{% image alt="React Home UI" src="images/posts/nodejs-launchdarkly/React_Home_UI.png" %}}

## Setup Cypress Tests

A breakthrough front-end testing framework called *Cypress* that makes it simple to create effective and adaptable tests for your online apps. With features like simple test configuration, practical reporting, an appealing dashboard interface, and with lot more, it makes it possible to perform advanced testing for both unit tests and integration tests.

The main benefit of Cypress is that it is created in JavaScript, the most used language for front-end web development. Since it was first made available to the public for the community, it has gained a sizable following among developers and QA engineers (about 32K GitHub stars).

*Cypress* is an open-source testing framework based on JavaScript that supports web application testing. Contrary to *Selenium*, Cypress does not require driver binaries in order to function fully on a real browser. The shared platform between the automated code and the application code provides total control over the application being tested.

Let's look into Cypress' high-level architecture in order to explain the backstory behind it. In order to execute the application and test code in the same event loop, Cypress operates on a NodeJS server that connects with the test runner (Browser). This in turn allows the Cypress code to mock and even change the JavaScript object on the fly. This is one of the primary reasons why Cypress tests are expected to execute faster than corresponding Selenium tests.

In order to start writing our tests, let’s start by installing Cypress test runner:

```bash
npm install --save-dev cypress
```

### Setup Plugin

LaunchDarkly flags will need to be managed using HTTP calls. Although making HTTP requests from Node and Cypress is simple, LaunchDarkly uses higher-level logic that makes changing feature flags a hassle. To reduce the complexity, we can abstract all the requirements for adding individual user targets into a plugin called [cypress-ld-control](https://github.com/bahmutov/cypress-ld-control) that Cypress tests can utilize. Let's put this plugin in place and use it:

```bash
npm install --save-dev cypress-ld-control
```

In order to use this plugin, we need to understand some of the functions defined by their API and how we can add them as part of the cypress tasks:

* `getFeatureFlag`:

  Returns a particular value for a defined feature flag:

  ```javascript
  cy.task('cypress-ld-control:getFeatureFlag', 'my-flag-key').then(flag => {...})
  ```

* `setFeatureFlagForUser`:

  This uses user-level targeting feature to set flag for a given user:

  ```javascript
  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey: 'my-flag-key',
    userId: 'string user id',
    variationIndex: 1 // must be index to one of the variations
  })
  ```

* `removeUserTarget`:

  This removes the user target that we have set in the above function:

  ```javascript
  cy.task('cypress-ld-control:removeUserTarget', { featureFlagKey, userId })
  ```

As we can see that every task is prefixed with `cypress-ld-control:` string and every command takes zero zero or a single options object as an argument. Finally, every command returns either an object or a null and never `undefined`.

### Define Cypress tasks

In order to change the values of the feature flags and individual user targets, we need to first generate an access token in LaunchDarkly UI.

{{% image alt="Access Token" src="images/posts/nodejs-launchdarkly/Access_Token.png" %}}

Then we can note the Project key from the Projects page under Account Settings.

{{% image alt="Project Key" src="images/posts/nodejs-launchdarkly/Project_Key.png" %}}

Next we can load the plugin with environment variables:

```javascript
const { initLaunchDarklyApiTasks } = require('cypress-ld-control');
require('dotenv').config();
module.exports = (on, config) => {
  const tasks = {
    // add your other Cypress tasks if any
  }

  if (
    process.env.LAUNCH_DARKLY_PROJECT_KEY &&
    process.env.LAUNCH_DARKLY_AUTH_TOKEN
  ) {
    const ldApiTasks = initLaunchDarklyApiTasks({
      projectKey: process.env.LAUNCH_DARKLY_PROJECT_KEY,
      authToken: process.env.LAUNCH_DARKLY_AUTH_TOKEN,
      environment: 'production', // the name of your environment to use
    })
    // copy all LaunchDarkly methods as individual tasks
    Object.assign(tasks, ldApiTasks)
    // set an environment variable for specs to use
    // to check if the LaunchDarkly can be controlled
    config.env.launchDarklyApiAvailable = true
  } else {
    console.log('Skipping cypress-ld-control plugin')
  }

  // register all tasks with Cypress
  on('task', tasks)

  // IMPORTANT: return the updated config object
  return config
}
```

Next we can start writing our Cypress tasks using `cy.task()` function. So consider if the test is to see a casual greeting header, we can simply write:

```javascript
before(() => {
  expect(Cypress.env('launchDarklyApiAvailable'), 'LaunchDarkly').to.be.true
})

const featureFlagKey = 'testing-launch-darkly-control-from-cypress'
const userId = 'USER_1234'

it('shows the casual greeting', () => {
  // target the given user to receive the first variation of the feature flag
  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey,
    userId,
    variationIndex: 0,
  })
  cy.visit('/')
  cy.contains('h1', 'Hello, World').should('be.visible')
})
```

Then we can run our tests by defining a script in `package.json` as follows:

```json
"scripts": {
    "start": "node src/server/index.js",
    "test": "start-test 3000 'cypress open'"
  }
```

Then we can simply execute:

```bash
npm run test
```

Next we can define few more variations and cover some more test cases as follows:

```javascript
/// <reference types="cypress" />

before(() => {
  expect(Cypress.env('launchDarklyApiAvailable'), 'LaunchDarkly').to.be.true
})

const featureFlagKey = 'testing-launch-darkly-control-from-cypress'
const userId = 'USER_1234'

it('shows the casual greeting', () => {
  // target the given user to receive the first variation of the feature flag
  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey,
    userId,
    variationIndex: 0,
  })
  cy.visit('/')
  cy.contains('h1', 'Hello, World').should('be.visible')
})

it('shows formal greeting', () => {
  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey,
    userId,
    variationIndex: 1,
  })
  cy.visit('/')
  cy.contains('h1', 'How are you doing, World').should('be.visible')
})

it('shows vacation greeting', () => {
  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey,
    userId,
    variationIndex: 2,
  })
  cy.visit('/')
  cy.contains('h1', 'Yippeeee, World').should('be.visible')

  // print the current state of the feature flag and its variations
  cy.task('cypress-ld-control:getFeatureFlag', featureFlagKey)
    .then(console.log)
    // let's print the variations to the Command Log side panel
    .its('variations')
    .then((variations) => {
      variations.forEach((v, k) => {
        cy.log(`${k}: ${v.name} is ${v.value}`)
      })
    })
})

it('shows all greetings', () => {
  cy.visit('/')
  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey,
    userId,
    variationIndex: 0,
  })
  cy.contains('h1', 'Hello, World')
    .should('be.visible')
    .wait(1000)

  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey,
    userId,
    variationIndex: 1,
  })
  cy.contains('h1', 'How are you doing, World').should('be.visible').wait(1000)

  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey,
    userId,
    variationIndex: 2,
  })
  cy.contains('h1', 'Yippeeee, World').should('be.visible')
})

after(() => {
  cy.task('cypress-ld-control:removeUserTarget', { featureFlagKey, userId })
})
```

We are also defining a task at the end to remove any user targets being created as part of this tasks. Finally, we can see all the test output being populated in Cypress UI dashboard. We can launch the Cypress UI and click on “Run” option, where we can see all the task execution with variations being printed.

{{% image alt="Cypress Test UI variation" src="images/posts/nodejs-launchdarkly/Cypress_Test_Result.png" %}}

## Deploy Tests as CI

Next we can use *GitHub Actions* to run the same tests on CI. The workflows provided by CI using GitHub Actions allows us to create the code in our repository and run our tests. Workflows can run on virtual machines hosted by GitHub or on our own servers.
Using the repository dispatch webhook, we may set up our CI workflow to launch whenever a GitHub event takes place (for instance, if new code is pushed to your repository), on a predetermined timetable, or in response to an outside event.

In order for us to determine whether the change in our branch produces an error, GitHub executes our CI tests and includes the results of each test in the pull request. The changes we pushed are prepared to be evaluated by a team member or merged once all CI tests in a workflow pass. If a test fails, then we can easily get to know that one of our changes may have caused the failure.

We will use [cypress-io/github-action](https://github.com/cypress-io/github-action) to install the dependencies, cache Cypress, start the application, and run the tests. We can define the environment variables in the repo and then use it.

{{% image alt="Repository Secrets" src="images/posts/nodejs-launchdarkly/Github_Repository_Secret.png" %}}

We can then define a yaml configuration to run our CI tests:

```yaml
name: ci
on: push
jobs:
  test:
    runs-on: ubuntu-20.04
    steps:
      - name: Checkout 🛎
        uses: actions/checkout@v2

      - name: Run tests 🧪
        # https://github.com/cypress-io/github-action
        uses: cypress-io/github-action@v3
        with:
          start: 'yarn start'
        env:
          LAUNCH_DARKLY_PROJECT_KEY: ${{ secrets.LAUNCH_DARKLY_PROJECT_KEY }}
          LAUNCH_DARKLY_AUTH_TOKEN: ${{ secrets.LAUNCH_DARKLY_AUTH_TOKEN }}
```

## Conclusion

We discussed how we can define conditional Cypress tests based on feature flags as part of this article. We also made use of `cypress-ld-control` to set and remove flags for certain users. We have also used the LaunchDarkly client instance in Cypress tests to read the flag value for specific users. We also saw how these features support the two primary test techniques of conditional execution and controlled flag. In this blog post, we predominantly saw how we can target features using individual user IDs. 

Feature flags are frequently seen as either a tool for product managers or engineers. In actuality, it's both. Flags can help product managers better manage releases by synchronizing launch timings and enhancing the effectiveness of the feedback loop. DevOps and software development teams can benefit from their ability to cut costs and increase productivity.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/nodejs/react-cypress-launchdarkly-feature-flag-test/).
