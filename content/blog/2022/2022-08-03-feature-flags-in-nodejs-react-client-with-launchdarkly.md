---
title: "Feature Flags in Node.js React client with LaunchDarkly"
categories: ["Node"]
date: 2022-08-21 00:00:00 +1100 
modified: 2022-08-21 00:00:00 +1100
authors: [arpendu]
excerpt: "A simple article to understand various use cases of Feature flags that can be achieved with LaunchDarkly in React UI."
image: images/stock/0104-on-off-1200x628-branded.jpg
url: nodejs-feature-flag-launchdarkly-react
---

We have often seen various websites release new experimental features directly in the production UI and test whether their users like those feature or not. It gives them a lot of exposure to understand the likes and dislikes of users from various regions or countries and gather feedback around it. Sometimes they also like to check any performance glitch due to huge traffic for a new feature. If any of this causes any kind of problem, then they roll back that particular feature without any downtime.

In this article, we are going to discuss few of these functionalities and see how we can manage our features dynamically at runtime. We will use the concept of *“Feature Flag”* which helps us in managing our features in UI with something just like a toggle button or a switch. This would help us to rollout a new feature dynamically in production at runtime.

A *feature flag* is a technique that is being used predominantly in the case of software development to manage a particular functionality by enabling or disabling it remotely. New features can be deployed in the production UI without even making them visible to users. Thus, feature flags help us to perform usability or beta testing directly in the UI by real users.

The whole purpose is to check if we can have wide-scale acceptance for a new feature and make necessary changes as and when someone provides feedback without waiting for the whole release cycle.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/nodejs-react-feature-flag-launchdarkly" %}}

## Use Cases of Feature Flags in Web UI

Feature flags or feature management is commonly used in web UI to perform the following operations:

- Gradually roll or publish out new features or functionality to users.
- Rollback existing feature due to failure or breakage.
- Minimize the risk of a release by first releasing something like a beta version to a limited group of users.
- Test various kinds of user acceptance.

Some of the most common use cases where we can use feature flags are:

- **Progressive Delivery** - It is a practice that gives businesses the ability to decide when and how to roll out new software features. Feature flag management and deployment tactics like blue-green and canary deployments are built upon in this method. Progressive delivery, in the end, blends software development and delivery processes and enables businesses to deliver with control.
- **Beta Testing and Qualitative Feedback** - Before deploying a feature to the full user base, feature flags are a wonderful way to test it with a beta tester group, gather user feedback, and assess performance. Before the product is ready for prime time, developers must seek consumer feedback on performance, usability, and functionality in this area of progressive delivery. We can target particular individuals or groups using the granular control provided by feature flags to collect their opinion on the experience.
- **Kill Switches** - A kill switch is a device that does exactly what it says: it stops something immediately. This could imply that we suddenly start receiving several bug reports regarding a feature in the context of feature flags. We can just turn off the one problematic feature rather than having to roll back and potentially damage other features in the release.
- **Release Progressions** - Teams can deploy new features using canary launches, percentage deployments, and ring deployments with the use of release progressions. There is a lot less risk involved in using these targeted, incremental release strategies than in rolling out features to all users at once.
- **A/B Testing** - Let's stick with a fairly straightforward description since this is one of the most typical uses for feature flags. Consider adding a new button to our website and testing whether it receives more clicks when it is red or blue. Using feature flags, we could deploy feature A (the red button) to 50% of our consumers and feature B (the blue button) to the remaining 50%. Then we may gather data to determine if A or B performed better.
- **Faster Incident Resolution** - Although we don't typically consider it, feature flags can speed up issue resolution. In fact, using feature flags can fully stop problems from ever occurring. We present real-world use cases and examples of how feature flags can be used to solve problems in our article on faster incident resolution. Feature flags might be viewed in this regard as the first line of defense if something goes wrong during production.

## Different Types of Feature Flags/Toggles in UI

It's tempting to want to group all feature flag use cases, but it's more beneficial to see flags as a means of accomplishing goals and as having different types of use cases.

The various types of flags that could be used in a system are demonstrated by the following examples:

- **Release features** - Using flags to avoid the need for intricate technical deployment coordination, the proper individuals can choose who and when to activate a feature.
- **Experiment** - Use flags to experiment and discover how a modification affects many aspects of the world. This might be a user experiment, like examining how a new button affects conversion, or it can be a technical experiment, like examining how a new user interface affects server load.
- **Ops flags** - These flags provide you permanent control over important portions of your feature, allowing you to turn them on and off as needed without starting a brand-new deployment cycle. This is a reliable technique to manage who has access to alter your production application when RBAC is added.
- **Control access** - Control access via managing betas, early adopter lists, trial access, and other things with flags.

## Introducing LaunchDarkly and its Features

[LaunchDarkly](https://launchdarkly.com/) is a feature management service that takes care of all the feature flagging concepts. The name is derived from the concept of a *“dark launch”*, which deploys a feature in a deactivated state and activates it when the time is right.

{{% image alt="LaunchDarkly Internal" src="images/posts/feature-flag-tools/launchdarkly.png" %}}

LaunchDarkly is a cloud-based service and provides a UI to manage everything about our feature flags. For each flag, we need to define one or more **variations**. The variation can be a *boolean*, an arbitrary *number*, a *string* value, or a *JSON* snippet.

We can define **targeting rules** to define which variation a feature flag will show to its user. By default, a targeting rule for a feature flag is deactivated. The simplest targeting rule is *“show variation X for all users”*. A more complex targeting rule is *“show variation A for all users with attribute X, variation B for all users with attribute Y, and variation C for all other users”*.

We can use the LaunchDarkly SDK in our code to access the feature flag variations. It provides a persistent connection to [LaunchDarkly's streaming infrastructure](https://launchdarkly.com/how-it-works/) to receive server-sent-events (SSE) whenever there is a change in a feature flag. If the connection fails for some reason, it falls back to default values.

## Differences Between Client-side and Server-side SDKs

In the previous [article](https://reflectoring.io/nodejs-admin-feature-flag-launchdarkly/), we had used *server-side SDK* which is used keeping in mind environments that are being used by multi-user. These SDKs are designed to be used in a secure environment, such as web server. But in this article, we will use *client-side SDK* which includes mobile SDK as well. Client-side SDKs are intended to be used for desktop, mobile, and embedded applications that would have only one user. These SDKs are designed to be used in system that may be less secure.

Server-side SDKs work with applications that have a server architecture and are hosted on your own network or a reliable cloud network. These SDKs can safely receive flag data and rulesets without needing to filter out sensitive data because server-based applications have restricted access.

On the other hand, when a flag evaluation is required, client-side SDKs assign the flag evaluation to LaunchDarkly on behalf of the particular user, and then the services are in charge of determining whether the flag rules apply to the user or not. LaunchDarkly then notifies the SDK of the evaluation results via the SDK's streaming or polling connections.

Client-side SDKs will be unable to download and store an entire ruleset due to security concerns. They are vulnerable to users investigating SDK content by unpacking the SDK on a mobile device or examining its behavior in a browser because they typically run on customers' own devices. The client-side SDKs confirm and update flag rules by contacting LaunchDarkly servers via streaming connections or REST API requests rather than storing potentially sensitive data.

For a client-side or mobile SDK to evaluate our feature flags, we must expose them if we are using one of those SDKs. According to the [documentation](https://docs.launchdarkly.com/home/getting-started/feature-flags#making-flags-available-to-client-side-and-mobile-sdks), we need to enable the *"SDKs using Client-side ID"* option for React UI or any Javascript UI. We will therefore retrieve the *Client-Side ID* in this instance from the LaunchDarkly Projects page and define it in the code. Additionally, we need to confirm that the flag's targeting option is turned on after creating the flag.

## Create a Simple React App

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

{{% image alt="React UI" src="images/posts/nodejs-frontend-launchdarkly/React_Logo.png" %}}

Next we will add the [launchdarkly-js-client-sdk](https://github.com/launchdarkly/js-client-sdk) package to use client-side methods to fetch the feature flag variations:

```bash
npm install launchdarkly-js-client-sdk
```



## Enable/Disable a Feature on the Fly

In our first use case, let’s try to simply define a string feature flag in LaunchDarkly UI. We will simply define a feature button in UI and show it based upon the user whether that matches the one set in our Launchdarkly UI. It would be pretty simple but enough to understand how we can enable/disable a feature in web UI.

The feature flag defined in LaunchDarkly UI would look something like this:

{{% image alt="String Feature Flag LaunchDarkly" src="images/posts/nodejs-frontend-launchdarkly/Hide_User.png" %}}

As discussed above, we will fetch the *Client-Side ID* and add it in the code.

{{% image alt="LaunchDarkly Keys" src="images/posts/nodejs-frontend-launchdarkly/LaunchDarkly_Keys.png" %}}

Next we will update our `App.js` to fetch the feature flag variations from LaunchDarkly and display that button: 

```javascript
import React, { Component } from 'react';
import styled from "styled-components";
import './App.css';
import * as LDClient from 'launchdarkly-js-client-sdk';

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
  alert("You clicked me!");
};

class App extends Component {
  constructor() {
    super()
    this.state = {}
  }
  componentDidMount() {
    const user = {
      // UI based user
      key: 'user_a'
    }
    // SDK requires Client-side ID for UI call
    this.ldclient = LDClient.initialize('62e*********************', user);
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
        <div>{ 
            this.state.featureFlags.hideUser !== 'John Doe'
              ? <Button theme='blue' onClick={clickMe}>Shiny New Feature</Button>
              : '' }
        </div>
    );
  }
}

export default App;
```

To execute code only when the LaunchDarkly client is ready, we have two mechanisms: an *event* or a *promise*.

With `this.ldclient.on('ready', ...)`, we subscribe to the `ready` event which will fire once the LaunchDarkly client has received the state of all feature flags from the server.

With `this.ldclient.on('change', ...)`, we subscribe to the `change` event which will fire once the LaunchDarkly client has received the state of all feature flags that has got updated or changed in the LaunchDarkly UI.

For the promise mechanism, the SDK supports two methods: `waitUntilReady()` and `waitForInitialization()`. The behavior of `waitUntilReady()` is equivalent to the `ready` event. The promise resolves when the client receives its initial flag data. As with all promises, you can either use `.then()` to provide a callback, or use `await` if you are writing asynchronous code. The other method that returns a promise, `waitForInitialization()`, is similar to `waitUntilReady()` except that it also tells you if initialization fails by rejecting the promise.

Next we can run the following command to start the UI:

```bash
npm start
```

When the user is not set in the LaunchDarkly UI, our React UI looks like below:

{{% image alt="React User List" src="images/posts/nodejs-frontend-launchdarkly/Button.png" %}}

Now we will define “John Doe” as name in LaunchDarkly feature flag variation. Once that is saved, our UI will hide this button. In a real production implementation, this name will be fetched from the logged-in session of the user and matched in Launchdarkly with its ID or username.

## Sorting of Data using Flags

Next we will try to sort our content in the UI using our feature flags. Since our  users are added with some date stamp, we can easily sort our data naturally or based upon the time when that particular user is added in our system. We will create a feature flag variation in LaunchDarkly UI with a boolean type and try to use it in our code.

{{% image alt="Boolean Feature Flag LaunchDarkly" src="images/posts/nodejs-frontend-launchdarkly/User_List_Sorting.png" %}}

Then we will add the sorting logic in our same `App.js`and use it with a switch in the UI. The UI will display either *Natural Sorting* or *Time Sorting*. By default, if the flag is set to true then Time Sorting takes place otherwise Natural Sorting:

```javascript
import React, { Component } from 'react';
import './App.css';
import * as LDClient from 'launchdarkly-js-client-sdk';

const isNewer = (a, b) => Date.parse(a.added) - Date.parse(b.added);

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
      // UI based user
      key: 'user_a'
    }
    // SDK requires Client-side ID for UI call
    this.ldclient = LDClient.initialize('62e*********************', user);
    this.ldclient.on('ready', this.onLaunchDarklyUpdated.bind(this));
    this.ldclient.on('change', this.onLaunchDarklyUpdated.bind(this));
  }
  onLaunchDarklyUpdated() {
    this.setState({
      featureFlags: {
        defaultSortingIsAdded: this.ldclient.variation('user-list-default-sorting-check', true),
        hideUser: this.ldclient.variation('hidden-user', '')
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
             <div>{ user.name }</div>
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

{{% image alt="Final UI" src="images/posts/nodejs-frontend-launchdarkly/Final_UI.png" %}}

## Conclusion

As you can see, feature flags enable us to dynamically alter the application's runtime behavior. Additionally, we can introduce or remove additional functionalities as per requirement. By doing so, we may improve performance and eliminate various reliance on layers connected to databases.

A comprehensive feature management platform like LaunchDarkly, as we saw in this article supports a wide range of programming languages. Without affecting overall speed, it scales to virtually an infinite number of feature flags and enables us to build flexible targeting criteria. This might be a very helpful solution for businesses that need to manage many codebases using different programming languages.

Feature flags are frequently viewed as either an engineering tool or product manager tool. The truth is that it's both. Flags can assist product managers in better control releases, coordinating launch times, and building a feedback loop more effectively. They can also help software development and DevOps teams reduce overhead and boost velocity.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/nodejs/nodejs-react-feature-flag-launchdarkly/).
