---
title: "Feature Flags in Node.js React client with LaunchDarkly"
categories: ["Node"]
date: 2022-08-03 00:00:00 +1100 
modified: 2022-08-03 00:00:00 +1100
authors: [arpendu]
excerpt: "A simple article to understand various use-cases of Feature flags that can be achieved with LaunchDarkly in React UI."
image: images/stock/0104-on-off-1200x628-branded.jpg
url: nodejs-feature-flag-launchdarkly-react
---

We might have often seen various apps or websites release new experimental features directly in the production UI and then test if the users like this new feature or not. It gives them a lot of exposure to users from various regions or countries. Sometimes they also like to see if there is any glitch or any blockage due to huge traffic for a particular feature. If any of this causes any kind of problem, then they roll back that particular feature without any downtime.

In this article, we are going to discuss exactly a few of these functionalities and see how we can manage our features dynamically at runtime. We will use the concept of *“Feature Flag”* which helps us in managing our features in UI with something just like a toggle button or a switch. This would help us in case that particular feature is not liked by the users or if it has some glitch.

A *feature flag* is a technique that is being used predominantly in the case of software development to manage a particular functionality by enabling or disabling it remotely. New features can be deployed in the production UI without even making them visible to users. Thus, feature flags help us to perform usability or beta testing directly in the UI by real users.

The whole purpose is to check if we can have wide-scale acceptance for a new feature and make necessary changes as and when someone provides feedback without waiting for the whole release cycle.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/nodejs-react-feature-flag-launchdarkly" %}}

## Use-Cases of Feature Flags in Web UI

* Feature flags or feature management is commonly used in web UI to perform the following operations:

  - Reduce the number of rollbacks in the existing code due to failure or breakage.
  - Gradually roll or publish out new features or functionality to users.
  - Minimize the risk of a release by first releasing something like a beta version to a limited group of users.
  - Test various kinds of user acceptance.

  Some of the most common use-cases where we can use feature flags are:

  - **Progressive Delivery** - It is a practice that gives businesses the ability to decide when and how to roll out new software features. Feature flag management and deployment tactics like blue-green and canary deployments are built upon in this method. Progressive delivery, in the end, blends software development and delivery processes and enables businesses to deliver with control.
  - **Beta Testing and Qualitative Feedback** - Before deploying a feature to the full user base, feature flags are a wonderful way to test it with a beta tester group, gather user feedback, and assess performance. Before the product is ready for prime time, developers must seek consumer feedback on performance, usability, and functionality in this area of progressive delivery. We can target particular individuals or groups using the granular control provided by feature flags to collect their opinion on the experience.
  - **Kill Switches** - A kill switch is a device that does exactly what it says: it stops something immediately. This could imply that we suddenly start receiving several bug reports regarding a feature in the context of feature flags. We can just turn off the one problematic feature rather than having to roll back and potentially damage other features in the release.
  - **Release Progressions** - Teams can deploy new features using canary launches, percentage deployments, and ring deployments with the use of release progressions. There is a lot less risk involved in using these targeted, incremental release strategies than in rolling out features to all users at once.
  - **A/B Testing** - Let's stick with a fairly straightforward description since this is one of the most typical uses for feature flags. Consider adding a new button to our website and testing whether it receives more clicks when it is red or blue. Using feature flags, we could deploy feature A (the red button) to 50% of our consumers and feature B (the blue button) to the remaining 50%. Then we may gather data to determine if A or B performed better.
  - **Faster Incident Resolution** - Although we don't typically consider it, feature flags can speed up issue resolution. In fact, using feature flags can fully stop problems from ever occurring. We present real-world use cases and examples of how feature flags can be used to solve problems in our article on faster incident resolution. Feature flags might be viewed in this regard as the first line of defense if something goes wrong during production.

## Different Types of Feature Flags/Toggles in UI

- It's tempting to want to group all feature flag use cases, but it's more beneficial to see flags as a means of accomplishing goals and as having different types of use cases.

  The various types of flags that could be used in a system are demonstrated by the following examples:

  - **Release features** - Using flags to avoid the need for intricate technical deployment coordination, the proper individuals can choose who and when to activate a feature.
  - **Experiment** - Use flags to experiment and discover how a modification affects many aspects of the world. This might be a user experiment, like examining how a new button affects conversion, or it can be a technical experiment, like examining how a new user interface affects server load.
  - **Ops flags** - These flags provide you permanent control over important portions of your feature, allowing you to turn them on and off as needed without starting a brand-new deployment cycle. This is a reliable technique to manage who has access to alter your production application when RBAC is added.
  - **Control access** - Control access via managing betas, early adopter lists, trial access, and other things with flags.

## Introducing LaunchDarkly and its Features

[LaunchDarkly](https://launchdarkly.com/) is a SaaS application that allows developers to control feature flags. It enables developers to test their code live in production, gradually roll out features to groups of users, and manage flags over a flag's full lifecycle by separating feature rollout and code deployment. This makes it safer for developers to deliver superior software.

{{% image alt="LaunchDarkly Internal" src="images/posts/feature-flag-tools/launchdarkly.png" %}}

It is essentially a cloud-based service that offers a UI for managing all feature flags. We must define one or more **variations** for each flag. Boolean, arbitrary numbers, textual values, or JSON snippets are all acceptable variations.

To specify which variation a feature flag will show to its user, we can set **targeting rules**. A targeting rule for a feature flag is inactive by default. The most straightforward targeting criterion is "display variation X to all users." Show variation A for all users with attribute X, variation B for all users with attribute Y, and variation C for all other users is a more intricate targeting rule.

Instead of a polling design, LaunchDarkly makes use of a [streaming architecture](https://launchdarkly.com/blog/launchdarklys-evolution-from-polling-to-streaming/). From a scalability point of view, this architecture is beneficial so that our application doesn't have to make a network call each time we need to analyze or fetch a feature flag. Furthermore, feature flag evaluation will continue to function even if the LaunchDarkly server has stopped responding to our calls, which is beneficial for resilience.

## Create a simple React App

Let’s start by creating a simple React UI application. We will build this using one of the most popular npm libraries, [create-react-app](https://create-react-app.dev/). It is one of the simplest methods to start a new React project, making it a great option for both serious, large-scale apps and your own, individual projects.

We will use the tool npx which gives us the ability to use the `create-react-app` package without having to first install it on our computer, which is very convenient. It also ensures that we are always using the latest version of `create-react-app`.

```bash
npx create-react-app nodejs-react-feature-flag-launchdarkly
```

This will create a folder with the name “nodejs-react-feature-flag-launchdarkly” and automatically install all the required packages inside that folder. The folder tree would look something like below:

```bash
nodejs-react-feature-flag-launchdarkly
├── README.md
├── node_modules
├── package.json
├── .gitignore
├── public
└── src
```

Now we can simply run our app and see a dev server starting up and opening a UI with the React logo:

```bash
npm start
```

The development server will start up at http://localhost:3000 and we can see the home page.

{{% image alt="React UI" src="images/posts/nodejs-launchdarkly/React_Logo.png" %}}

Next we will add the [launchdarkly-js-client-sdk](https://github.com/launchdarkly/js-client-sdk) package to use client-side methods to fetch the feature flag variations:

```bash
npm install launchdarkly-js-client-sdk
```



## String based Feature Flag to hide/display content on the Fly

In our first use-case, let’s try to simply define a string feature flag in LaunchDarkly UI. We will simply list some users in the React UI. If any of the users matches the user name defined in the feature flag variation, then we will encrypt that user name in the UI. It would be pretty simple but enough to understand how we can enable/disable a feature in web UI.

The feature flag defined in LaunchDarkly UI would look something like this:

{{% image alt="String Feature Flag LaunchDarkly" src="images/posts/nodejs-launchdarkly/Hide_User.png" %}}

We need to fetch the *Client-Side ID* from LaunchDarkly Projects page and define it as part of the code. We should also make sure that the targeting option is enabled for the flag.

{{% image alt="LaunchDarkly Keys" src="images/posts/nodejs-launchdarkly/LaunchDarkly_Keys.png" %}}

Next we will update our `App.js` to fetch the feature flag variations from LaunchDarkly and display the list of users. 

```javascript
import React, { Component } from 'react';
import './App.css';
import * as LDClient from 'launchdarkly-js-client-sdk';

class App extends Component {
  constructor() {
    super()
    this.state = {
      selectedSortOrder: null,
      users: [
        { name: 'John Doe', added: new Date('2022-7-27') },
        { name: 'Allen Witt', added: new Date('2022-6-30') },
        { name: 'Cheryl Strong', added: new Date('2022-7-02') },
        { name: 'Marty Byrde', added: new Date('2022-5-03') },
        { name: 'Wendy Byrde', added: new Date('2022-6-03') },
      ]
    }
  }
  componentDidMount() {
    const user = {
      key: 'aa0ceb'
    }
    this.ldclient = LDClient.initialize('62e9289ade464c10d842c2b3', user);
    this.ldclient.on('ready', this.onLaunchDarklyUpdated.bind(this));
    this.ldclient.on('change', this.onLaunchDarklyUpdated.bind(this));
  }
  onLaunchDarklyUpdated() {
    this.setState({
      featureFlags: {
        hideUser: this.ldclient.variation('hidden-user', '')
      }
    })
  }
  render() {
    if (!this.state.featureFlags) {
      return <div className="App">Loading....</div>
    }
    
    return (
      <div className="App">
        <div style ={{ fontWeight: 'bold' }}><h1>Users List</h1></div>
        <ul>
          {this.state.users.map(user =>
             <div>{ this.state.featureFlags.hideUser === 'John Doe'
              && user.name === 'John Doe' ? '*********' : user.name }</div>
          )}
        </ul>
      </div>
    );
  }
}

export default App;
```

Then we can run the following command to start the UI:

```bash
npm start
```

When the user is not set in the LaunchDarkly UI, our React UI looks like below:

{{% image alt="React User List" src="images/posts/nodejs-launchdarkly/React_User_List_simple.png" %}}

Now we will define “John Doe” as name in LaunchDarkly feature flag variation. Once that is saved, our UI will immediately render the user as encrypted in our list.

{{% image alt="React User List Encrypted" src="images/posts/nodejs-launchdarkly/React_User_list_encrypted.png" %}}

## Sorting of Data using Flags

Next we will try to sort our content in the UI using our feature flags. Since our  users are added with some date stamp, we can easily sort our data naturally or based upon the time when that particular user is added in our system. We will create a feature flag variation in LaunchDarkly UI with a boolean type and try to use it in our code.

{{% image alt="Boolean Feature Flag LaunchDarkly" src="images/posts/nodejs-launchdarkly/User_List_Sorting.png" %}}

Then we will add the sorting logic in our same `App.js`and use it with a switch in the UI. The UI will display either *Natural Sorting* or *Time Sorting*. By default, if the flag is set to true then Time Sorting takes place otherwise Natural Sorting:

```javascript
import React, { Component } from 'react';
import './App.css';
import * as LDClient from 'launchdarkly-js-client-sdk';

const isNewer = (a, b) => Date.parse(a.added) < Date.parse(b.added);

class App extends Component {
  constructor() {
    super()
    this.state = {
      selectedSortOrder: null,
      users: [
        { name: 'John Doe', added: '2022-7-27' },
        { name: 'Allen Witt', added: '2022-6-30' },
        { name: 'Cheryl Strong', added: '2022-7-02' },
        { name: 'Marty Byrde', added: '2022-5-03' },
        { name: 'Wendy Byrde', added: '2022-6-03' },
      ]
    }
  }
  componentDidMount() {
    const user = {
      key: '61af594df3ad1f8aaecd952d'
    }
    this.ldclient = LDClient.initialize('sdk-011395da-18bd-4e71-87f6-fc462c8b32e9', user);
    this.ldclient.on('ready', this.onLaunchDarklyUpdated.bind(this));
    this.ldclient.on('change', this.onLaunchDarklyUpdated.bind(this));
  }
  onLaunchDarklyUpdated() {
    this.setState({
      featureFlags: {
        defaultSortingIsAdded: this.ldclient.variation('new-feature-flag'),
        hideUser: this.ldclient.variation("hidden-user")
      }
    })
  }
  render() {
    if (!this.state.featureFlags) {
      return <div className="App">Loading....</div>
    }

    let sorter;
    if (this.state.selectedSortOrder) {
      if (this.state.selectedSortOrder === 'added') {
        sorter = isNewer
      } else if (this.state.selectedSortOrder === 'natural') {
        sorter = undefined
      }
    } else {
      if (this.state.featureFlags.defaultSortingIsAdded) {
        sorter = isNewer
      } else {
        sorter = undefined
      }
    }
    return (
      <div className="App">
        <div style ={{ fontWeight: 'bold' }}><h1>Users List</h1></div>
        <div
            style={{ fontWeight: sorter === undefined ? 'bold' : 'normal'}}
            onClick={() => this.setState({ selectedSortOrder: 'natural' })}>Natural sorting</div>
        <div
          style={{ fontWeight: sorter === isNewer ? 'bold' : 'normal'}}
          onClick={() => this.setState({ selectedSortOrder: 'added' })}>Time sorting</div>
        <ul>
          {this.state.users.slice().sort(sorter).map(user =>
             <div>{this.state.featureFlags.hideUser !== 'John Doe' ? user.name : '*********'}</div>
          )}
        </ul>
      </div>
    );
  }
}

export default App;
```

Then we can run the app again by executing the following command:

```bash
npm start
```

Now our UI looks something like below:

{{% image alt="Final UI" src="images/posts/nodejs-launchdarkly/Final_UI.png" %}}

## Conclusion

As you can see, LaunchDarkly is a rather potent cloud service on its own and enables us to dynamically alter the application's runtime behavior. Additionally, we can introduce or remove additional functionalities as needed. By doing so, we may improve performance and eliminate various reliance on layers connected to databases.

A comprehensive feature management platform, LaunchDarkly supports a wide range of programming languages. Without affecting overall speed, it scales to virtually an infinite number of feature flags and enables us to build flexible targeting criteria. This might be a very helpful solution for businesses that need to manage many codebases using different programming languages.

Feature flags are frequently viewed as either an engineering tool or product manager tool. The truth is that it's both. Flags can assist product managers in better control releases, coordinating launch times, and building a feedback loop more effectively. They can also help software development and DevOps teams reduce overhead and boost velocity.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/nodejs/nodejs-react-feature-flag-launchdarkly/).
