---
title: "Test and Automate Features behind the Flags using Cypress Tests"
categories: ["Node"]
date: 2022-10-04 00:00:00 +1100 
modified: 2022-10-04 00:00:00 +1100
authors: [arpendu]
excerpt: "A complete walkthrough to define sample unit or automated tests in React UI using Cypress tests to test features behind feature flags using LaunchDarkly."
image: images/stock/0104-on-off-1200x628-branded.jpg
url: nodejs-feature-flag-launchdarkly-react-cypress
---

Development teams, nowadays, can deliver quick value to consumers with far less risk with the help of *feature flag-driven development*. However, it also makes testing more complicated in the long run. So in this article, we'll talk about some of the difficulties that testing presents in the age of feature flags and offer some suggestions on how to overcome them.

We will outline five different sorts of tests that could be included in our testing plan in order to help structure the discussion:

- **Unit Tests:** Testing separate functions with *unit* tests.
- **Integration Tests:** Verifying how different modules work together.
- **End-to-End Tests:** *End-to-end* tests, also known as *functional* tests, examine how a real user might navigate our website.
- **Quality Assurance (QA) Testing:** Testing procedure that ensures functionality satisfies requirement is termed as *quality assurance (QA)* testing.
- **User Acceptance Testing (UAT):** Testing procedure to get stakeholders' approval that the functionality satisfies specifications.

The first three test types defined above are often executed automatically when using the *Continuous Integration (CI)* technique. QA testing, which can involve both manual and automated tests, may occasionally be performed by a specialised QA team. While the first four test types help determine whether anything was built correctly, UAT helps to determine if the product is acceptable and fit for the purpose.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/react-cypress-launchdarkly-feature-flag-test" %}}

## Different Options for Automation Tests

As we've seen, using feature flags while performing traditional automated integration testing may be very difficult. We really shouldn't advocate attempting to manage every scenario that could arise. Instead, the following are a few suggestions that we can try:

* Constantly write unit tests for code coverage.
* Tests scenarios that can occur due to any unknown disaster.
* Always check the state of production at any point in time.
* Test different user personas and their features.
* Sometimes we can test various combinations.

We can use different [LaunchDarkly SDKs](https://launchdarkly.com/features/sdk/) to achieve all of this functionality with a lot of ease. Performing integration tests against the current production state will always provide us some assurance that everything will largely still work once we deploy our application into production. To do this, we can direct the SDK to our production environment when it starts up. Alternatively, we can also use our API to simulate the requests by downloading the current production state.

We may find it helpful to develop some testing personas to employ in our end-to-end tests if the feature flag rules benefit from user targeting. We can accomplish this by making sure our user object contains legitimate attributes that the LaunchDarkly SDK will analyze.

## Why should we Perform Beta Tests in Production?

We discuss testing in production a lot. Testing in production does not imply releasing code without tests and crossing one's fingers. Instead, it refers to the capacity to test actual features with real data in a real environment using real people.

Because they have given their QA and UAT teams the freedom to test features in a genuine production environment before making them available to the rest of their user base, some of our most productive users can deploy directly to production multiple times per day. There is no impact on other users and no need to perform a complete rollback when QA or UAT tester finds a bug.

The real strength of feature flags lies in this. No matter how many times you test your software using automation, you will never be able to detect every fault. But the confidence to be able to continue delivering features to consumers securely and quickly comes from being able to turn a feature off when you discover an issue in production in real-time.

Some of the important advantages of performing beta tests are:

- Even before the product is released, it provides quick input on the product, which helps to raise its quality and increase consumer satisfaction.
- The application can be tested for dependability, usability, and robustness, and testers can provide feedback and suggestions to developers to help them make improvements that will better fulfill consumer needs.
- Based on recommendations made by the testers, who are the actual users, it assists various organizational teams in making judgments about a product that is well-informed.
- Since the product is tested by actual users in a production environment, it provides accurate insight into what customers like and dislike about it.
- It helps to address software bugs that might not have been addressed or missed during any testing cycles.
- It reduces the probability of a product failing because it has previously been tested before going to production.

## How to Control the Lifeline of a Feature

One must be careful not to break any current tests while introducing a new experiment behind the feature flag. What I believe a feature lifetime should be is as follows:

- **Experimental:** To enable the new behavior, a new feature flag should be created. The functionality can purely be opt-in at first because the developer is testing the behavior. The current default behavior can still be experienced by all current users.
- **Prototype:** The new feature can now be used if it appears to be successful. The team can prepare to release it. The feature can be activated and the new feature flow can be tested using a few end-to-end tests that employ the LaunchDarkly implementation. The old behavior can still be visible in all running tests because that is the default behavior.
- **Alternate Approach:** At this point, the new functionality is being more widely used, and the previous behavior will eventually be eliminated. We can now change the current tests to explicitly allow the old behavior. As a result, some tests opt-in and test the new feature, while other tests do the opposite.
- **Kill Switch:** The majority of users if not all have the feature switched on by default. The tests created while the functionality was being developed now work without opt-in. The outdated tests are still active and use the outdated behavior.
- **Feature Removal:** Both the previous behavior and all previous testing can be disabled. The feature flag would now consistently denote the altered behavior.

## Brief Introduction to LaunchDarkly and its Features

[LaunchDarkly](https://launchdarkly.com/) is a feature management service that takes care of all the feature flagging concepts. The name is derived from the concept of a *“dark launch”*, which deploys a feature in a deactivated state and activates it when the time is right.

{{% image alt="LaunchDarkly Internal" src="images/posts/feature-flag-tools/launchdarkly.png" %}}

LaunchDarkly is a cloud-based service and provides a UI to manage everything about our feature flags. For each flag, we need to define one or more **variations**. The variation can be a *boolean*, an arbitrary *number*, a *string* value, or a *JSON* snippet.

We can define **targeting rules** to define which variation a feature flag will show to its user. By default, a targeting rule for a feature flag is deactivated. The simplest targeting rule is *“show variation X for all users”*. A more complex targeting rule is *“show variation A for all users with attribute X, variation B for all users with attribute Y, and variation C for all other users”*.

We can use the LaunchDarkly SDK in our code to access the feature flag variations. It provides a persistent connection to [LaunchDarkly's streaming infrastructure](https://launchdarkly.com/how-it-works/) to receive server-sent-events (SSE) whenever there is a change in a feature flag. If the connection fails for some reason, it falls back to default values.

## Create a Simple React Application

In this article, we will focus on covering test cases of a React UI. For this, we will define a pretty simple React application and focus primarily on writing different test cases with feature flags. To demonstrate such power to control the feature flags from Cypress tests, we will just grab an existing copy of LaunchDarkly’s example React application.

We can clone and create our copy using the command:

```bash
npx degit launchdarkly/react-client-sdk/examples/hoc react-cypress-launchdarkly-feature-flag-test
```

We are using [degit](https://github.com/Rich-Harris/degit#readme) command to copy the repo to our local directory.

We will first create a new LanuchDarkly project with name “Reflectoring.io” and define two environments. We will now use “Production” environment.

{{% image alt="LaunchDarkly Project" src="images/posts/nodejs-cypress-test-launchdarkly/LaunchDarkly_Keys.png" %}}

Then we will define a new String feature flag *test-greeting-from-cypress* with three variations.

{{% image alt="Launchdarkly String Feature Variation" src="images/posts/nodejs-cypress-test-launchdarkly/Testing_With_Cypress.png" %}}

Now, since we want to test different flags for different users, we will also switch on the “Targeting” option.

{{% image alt="LaunchDarkly Targeting option" src="images/posts/nodejs-cypress-test-launchdarkly/Cypress_Targeting.png" %}}

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
  key: 'CYPRESS_TEST_1234'
};
export default withLDProvider({ clientSideID: '63**********************', user })(App);

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
    <Heading>{flags.testGreetingFromCypress}, World !!</Heading>
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

{{% image alt="React Home UI" src="images/posts/nodejs-cypress-test-launchdarkly/React_Home_UI.png" %}}

## Setup Cypress Tests

A breakthrough front-end testing framework called *Cypress* makes it simple to create effective and adaptable tests for your online apps. With features like simple test configuration, practical reporting, an appealing dashboard interface, and with lot more, it makes it possible to perform advanced testing for both unit tests and integration tests.

The main benefit of Cypress is that it is created in JavaScript, the most used language for front-end web development. Since it was first made available to the public for the community, it has gained a sizable following among developers and QA engineers (about 32K GitHub stars).

*Cypress* is an open-source testing framework based on JavaScript that supports web application testing. Contrary to *Selenium*, Cypress does not require driver binaries to function fully on a real browser. The shared platform between the automated code and the application code provides total control over the application being tested.

Let's look into Cypress' high-level architecture to explain the backstory behind it. To execute the application and test code in the same event loop, Cypress operates on a NodeJS server that connects with the test runner (Browser). This in turn allows the Cypress code to mock and even change the JavaScript object on the fly. This is one of the primary reasons why Cypress tests are expected to execute faster than corresponding Selenium tests.

To start writing our tests, let’s start by installing Cypress test runner:

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

As we can see that every task is prefixed with `cypress-ld-control:` string and every command takes zero or a single options object as an argument. Finally, every command returns either an object or a null, but never `undefined`.

### Define Cypress Tasks

In order to change the values of the feature flags and individual user targets, we need to first generate an access token in LaunchDarkly UI.

{{% image alt="Access Token" src="images/posts/nodejs-cypress-test-launchdarkly/Access_Token.png" %}}

Then we can note the Project key from the Projects page under Account Settings.

{{% image alt="Project Key" src="images/posts/nodejs-cypress-test-launchdarkly/Project_Key.png" %}}

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

#### Test Greetings

Next we can start writing our Cypress tasks using `cy.task()` function. So consider if the test is to see a casual greeting header, we can simply write:

```javascript
before(() => {
  expect(Cypress.env('launchDarklyApiAvailable'), 'LaunchDarkly').to.be.true
})

const featureFlagKey = 'testing-launch-darkly-control-from-cypress'
const userId = 'USER_1234'

it('shows a casual greeting', () => {
  // target the given user to receive the first variation of the feature flag
  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey,
    userId,
    variationIndex: 0,
  })
  cy.visit('/')
  cy.contains('h1', 'Hello, World !!').should('be.visible')
});
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
});

const featureFlagKey = 'test-greeting-from-cypress';
const userId = 'CYPRESS_TEST_1234';

it('shows a casual greeting', () => {
  // target the given user to receive the first variation of the feature flag
  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey,
    userId,
    variationIndex: 0,
  })
  cy.visit('/')
  cy.contains('h1', 'Hello, World !!').should('be.visible')
});

it('shows a formal greeting', () => {
  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey,
    userId,
    variationIndex: 1,
  })
  cy.visit('/')
  cy.contains('h1', 'Good Morning, World !!').should('be.visible')
});

it('shows a vacation greeting', () => {
  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey,
    userId,
    variationIndex: 2,
  })
  cy.visit('/')
  cy.contains('h1', 'Hurrayyyyy, World').should('be.visible')

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
});

it('shows all greetings', () => {
  cy.visit('/')
  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey,
    userId,
    variationIndex: 0,
  })
  cy.contains('h1', 'Hello, World !!')
    .should('be.visible')
    .wait(1000)

  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey,
    userId,
    variationIndex: 1,
  })
  cy.contains('h1', 'Good Morning, World !!').should('be.visible').wait(1000)

  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey,
    userId,
    variationIndex: 2,
  })
  cy.contains('h1', 'Hurrayyyyy, World !!').should('be.visible')
});

after(() => {
  cy.task('cypress-ld-control:removeUserTarget', { featureFlagKey, userId })
});
```

We are also defining a task at the end to remove any user targets being created as part of this tasks. Finally, we can see all the test output being populated in Cypress UI dashboard. We can launch the Cypress UI and click on “Run” option, where we can see all the task execution with variations being printed.

{{% image alt="Cypress Test UI variation" src="images/posts/nodejs-cypress-test-launchdarkly/Cypress_Test_Result.png" %}}

#### Test Target User Button

In our previous [article](/nodejs-feature-flag-launchdarkly-react/), we had represented a button in UI which would be populated based upon the logged-in user. Considering the same, we can add the same button here and add test-cases using Cypress to cover the functionality of clicking the button and validating the popup alert.

For this, we will update our home page logic:

```javascript
const theme = {
  blue: {
    default: "#3f51b5",
    hover: "#283593"
  }
};

const Button = styled.button`
    background-color: ${(props) => theme[props.theme].default};
    color: white;
    padding: 5px 15px;
    border-radius: 5px;
    outline: 0;
    text-transform: uppercase;
    margin: 10px 0px;
    cursor: pointer;
    box-shadow: 0px 2px 2px lightgray;
    transition: ease background-color 250ms;
    &:hover {
      background-color: ${(props) => theme[props.theme].hover};
    }
    &:disabled {
      cursor: default;
      opacity: 0.7;
    }
  `;

const clickMe = () => {
  alert("A new shiny feature pops up!");
};

const Home = ({ flags }) => (
  <Root>
    <Heading>{flags.testGreetingFromCypress}, World !!</Heading>
    <div>
      This is a LaunchDarkly React example project. The message above changes the greeting,
      based on the current feature flag variation.
    </div>
    <div>
    {flags.showShinyNewFeature ? 
      <Button id='shiny-button' theme='blue' onClick={clickMe}>Shiny New Feature</Button>: ''}
    </div>
    <div>
      {flags.showShinyNewFeature ? 'This button will show new shiny feature in UI on clicking it.': ''}
    </div>
  </Root>
);
```

Now the user attribute in `app.js` needs to be updated to “John Doe”. Thus, when John logs in, he will see the shiny new button, whereas others won’t.

```javascript
const user = {
  key: 'john_doe'
};
```

Similarly, we will add a task in existing spec to validate the click event of a button and its outcome alert of the popup:

```javascript
it('click a button', () => {
  cy.task('cypress-ld-control:setFeatureFlagForUser', {
    featureFlagKey: 'show-shiny-new-feature',
    userId: 'john_doe',
    variationIndex: 0,
  })
  cy.visit('/');
  var alerted = false;
  cy.on('window:alert', msg => alerted = msg);

  cy.get('#shiny-button').should('be.visible').click().then(
    () => expect(alerted).to.match(/A new shiny feature pops up!/));
});
```

Finally, we can see all the test output being populated in Cypress UI dashboard. We can launch the Cypress UI and click on “Run” option, where we can see all the task execution with variations being printed.

{{% image alt="Cypress Test UI variation" src="images/posts/nodejs-cypress-test-launchdarkly/Cypress_Final_Test_Result.png" %}}

## Deploy Tests as CI

Next, we can use *GitHub Actions* to run the same tests on CI. The workflows provided by CI using GitHub Actions allow us to create the code in our repository and run our tests. Workflows can run on virtual machines hosted by GitHub or on our servers. Using the repository dispatch webhook, we may set up our CI workflow to launch whenever a GitHub event takes place (for instance, if new code is pushed to your repository), on a predetermined timetable, or in response to an outside event.

For us to determine whether the change in our branch produces an error, GitHub executes our CI tests and includes the results of each test in the pull request. The changes we pushed are prepared to be evaluated by a team member or merged once all CI tests in a workflow pass. If a test fails, then we can easily get to know that one of our changes may have caused the failure.

We will use [cypress-io/GitHub-action](https://github.com/cypress-io/github-action) to install the dependencies, cache Cypress, start the application, and run the tests. We can define the environment variables in the repo and then use them.

{{% image alt="Repository Secrets" src="images/posts/nodejs-cypress-test-launchdarkly/Github_Repository_Secret.png" %}}

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
