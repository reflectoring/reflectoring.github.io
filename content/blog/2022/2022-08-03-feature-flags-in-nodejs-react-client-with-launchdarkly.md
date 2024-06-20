---
title: "Feature Flags with React and LaunchDarkly"
categories: ["Node"]
date: 2022-08-21 00:00:00 +1100 
modified: 2022-08-21 00:00:00 +1100
authors: [arpendu]
excerpt: "A simple article to understand various use cases of Feature flags that can be achieved with LaunchDarkly in React UI."
image: images/stock/0104-on-off-1200x628-branded.jpg
url: nodejs-feature-flag-launchdarkly-react
---

We often see various web apps release new experimental features directly in the production UI to test whether their users like those features or not. These features get exposure to a variety of users and the developers can gather feedback around those features without rolling them out to everybody. 

Rolling out features slowly to more and more users also allows us to catch any performance glitches early. If any issue comes up, then we roll back that particular feature without any downtime.

In this article, we'll discuss the concept of feature flags to manage our frontend features dynamically at runtime. We will use LaunchDarkly as a feature management platform, which allows us to manage our features in a UI by defining targeting rules. We will connect to LaunchDarkly directly from a React web app.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/nodejs-react-feature-flag-launchdarkly" %}}

## Use Cases of Feature Flags in Web UI

Feature flags are commonly used in a web UI to perform the following operations:

- Gradually roll out new features to users.
- Roll back existing features because they broke something.
- Minimize the risk of a release by first releasing something like a beta version to a limited group of users.
- Test various kinds of user acceptance.

Some of the most common use cases where we can use feature flags are:

- **Progressive delivery** - This is a practice that gives teams the ability to decide when and how to roll out new software features. It means rolling out features early, iterating on them, and progressively rolling them out to more and more users over time.
- **Beta testing and qualitative feedback** - Before deploying a feature to the full user base, feature flags are a wonderful way to test it with a beta tester group. This way, we can gather user feedback, and assess performance. Before the product is ready for prime time, developers must seek consumer feedback on performance, usability, and functionality in this area of progressive delivery. We can target individual users or groups using the granular control provided by feature flags to collect their opinion on the experience.
- **Kill switches** - A kill switch is a mechanism that does exactly what it says: it stops something immediately. If we start receiving several bug reports just after rolling out a feature, we can just turn off the feature rather than having to roll back to another version and potentially damage other features by a new deployment.
- **A/B testing** - Consider adding a new button to our website and testing whether it receives more clicks when it is red or blue. Using feature flags, we could deploy feature A (the red button) to 50% of our consumers and feature B (the blue button) to the remaining 50%. Then we may gather data to determine if A or B performed better.

Read more about [different rollout strategies with feature flags](/rollout-strategies-with-feature-flags) in our dedicated article.

## Introducing LaunchDarkly and its Features

[LaunchDarkly](https://launchdarkly.com/) is a feature management service that takes care of all the feature flagging concepts. The name is derived from the concept of a *“dark launch”*, which deploys a feature in a deactivated state and activates it when the time is right.

{{% image alt="LaunchDarkly Internal" src="images/posts/feature-flag-tools/launchdarkly.png" %}}

LaunchDarkly is a cloud-based service that provides a UI to manage everything about our feature flags. For each flag, we need to define one or more **variations**. The variation can be a *boolean*, an arbitrary *number*, a *string* value, or a *JSON* snippet.

We can define **targeting rules** to define which variation a feature flag will show to its user. By default, a targeting rule for a feature flag is deactivated. The simplest targeting rule is *“show variation X for all users”*. A more complex targeting rule is *“show variation A for all users with attribute X, variation B for all users with attribute Y, and variation C for all other users”*.

We can use the LaunchDarkly SDK in our code to access the feature flag variations. It provides a persistent connection to [LaunchDarkly's streaming infrastructure](https://launchdarkly.com/how-it-works/) to receive server-sent-events (SSE) whenever there is a change in a feature flag. If the connection fails for some reason, it falls back to default values.

## Client-side and Server-side Feature Flags

In the previous article [about feature flags in Node.js](/admin-operations-with-nodejs-launchdarkly), we used LaunchDarkly's *server-side SDK* which is built for multi-user server environments. In this article, we will use the *client-side SDK* which is built for client-side web apps, desktop apps, embedded apps, and mobile apps that have exactly one (local) user where security is less of a concern.

LaunchDarkly's server-side SDKs work with server-side apps that are hosted on your own network or a reliable cloud network. These SDKs can safely receive flag data without needing to filter out sensitive data that is potentially contained in targeting rules because the server is secured. Targeting rules are evaluated in our server application.

With client-side SDKs, on the other hand, targeting rules are evaluated on the LaunchDarkly server on behalf of the local user to keep sensitive targeting rules secure.

Client-side SDKs will be unable to download and store an entire ruleset due to those security concerns. They are vulnerable to users investigating SDK content by unpacking the SDK on a mobile device or examining its behavior in a browser because they typically run on customers' own devices. The client-side SDKs confirm and update flag rules by contacting LaunchDarkly servers via streaming connections or REST API requests rather than storing potentially sensitive targeting data.

For a client-side or mobile SDK to evaluate our feature flags, the SDK needs to authenticate against the LaunchDarkly server. According to the [documentation](https://docs.launchdarkly.com/home/getting-started/feature-flags#making-flags-available-to-client-side-and-mobile-sdks), we need to enable the *"SDKs using Client-side ID"* option for each feature flag that we want to access from a client-side UI. We will therefore retrieve the *Client-Side ID* from the LaunchDarkly "Projects" page and paste it into our code. Additionally, we need to confirm that the flag's targeting option is turned on after creating the flag.

## Creating a Simple React App

Let’s start by creating a simple React UI application. We will build this using one of the most popular npm libraries, [`create-react-app`](https://create-react-app.dev/). It is one of the simplest methods to start a new React project, making it a great option for both serious, large-scale apps and your own, individual projects.

We will use the tool `npx` which gives us the ability to use the `create-react-app` package without having to first install it on our computer, which is very convenient. It also ensures that we are always using the latest version of `create-react-app`:

```bash
npx create-react-app nodejs-react-feature-flag-launchdarkly
```

This will create a folder with the name `nodejs-react-feature-flag-launchdarkly` and automatically install all the required packages inside that folder. The folder tree would look something like this:

```bash
nodejs-react-feature-flag-launchdarkly
├── README.md
├── node_modules
├── package.json
├── .gitignore
├── public
└── src
```

Now we can simply run our app with this command:

```bash
npm start
```

The development server will start up at http://localhost:3000 and we can see the home page:

{{% image alt="React UI" src="images/posts/nodejs-frontend-launchdarkly/React_Logo.png" %}}

Next, we add the [`launchdarkly-js-client-sdk`](https://github.com/launchdarkly/js-client-sdk) package to use client-side methods to fetch the feature flag variations:

```bash
npm install launchdarkly-js-client-sdk
```

## Toggling a Feature on the Fly

In our first use case, let’s try to simply define a Boolean feature flag in the LaunchDarkly UI. 

We will simply define a feature button in the UI and show it to the user or not, depending on the targeting rules defined in Launchdarkly.

The feature flag we define in LaunchDarkly UI looks something like this:

{{% image alt="String Feature Flag LaunchDarkly" src="images/posts/nodejs-frontend-launchdarkly/Show_Shiny_New_Feature.png" %}}

Then we will define “*Target users who match these rules*” for that feature flag and assign a rule that enables the flag for a specific user as shown below. In our example, we will simply set it to `true` for the user `john_doe` because that is the user we're assuming is using our UI. In a real implementation, this would be driven by the session id of the logged-in user of this UI.

{{% image alt="String Feature Flag LaunchDarkly Targeting Rule" src="images/posts/nodejs-frontend-launchdarkly/Targeting.png" %}}

As discussed above, we will fetch the *Client-Side ID* and add it to the code.

{{% image alt="LaunchDarkly Keys" src="images/posts/nodejs-frontend-launchdarkly/LaunchDarkly_Keys.png" %}}

Next, we will update our `App.js` to fetch the feature flag variations from LaunchDarkly and display that button: 

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
  alert("A new shiny feature pops up!");
};

class App extends Component {
  constructor() {
    super()
    this.state = {}
  }
  componentDidMount() {
    const user = {
      // UI based logged-in user
      key: 'john_doe'
    }
    // SDK requires Client-side ID for UI call
    this.ldclient = LDClient.initialize('62e*********************', user);
    this.ldclient.on('ready', this.onLaunchDarklyUpdated.bind(this));
    this.ldclient.on('change', this.onLaunchDarklyUpdated.bind(this));
  }
  onLaunchDarklyUpdated() {
    this.setState({
      featureFlags: {
        showShinyNewFeature: this.ldclient.variation('show-shiny-new-feature', false)
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
            this.state.featureFlags.hideUser
              ? <Button theme='blue' onClick={clickMe}>Shiny New Feature</Button>
              : '' }
        </div>
    );
  }
}

export default App;
```

To execute code only when the LaunchDarkly client is ready, we use the `ldclient.on()` function.

With `this.ldclient.on('ready', ...)`, we subscribe to the `ready` event which will fire once the LaunchDarkly client has received the state of all feature flags from the server.

With `this.ldclient.on('change', ...)`, we subscribe to the `change` event which will fire once the LaunchDarkly client has received the state of all feature flags that has got updated or changed in the LaunchDarkly UI.

Next, we can run the following command to start the UI:

```bash
npm start
```

When the user is not set in the LaunchDarkly UI, our React UI looks like the below:

{{% image alt="React User List" src="images/posts/nodejs-frontend-launchdarkly/Button.png" %}}

Now based on the user information, this flag will return true if the key of the user is `john_doe`. It will return `false` for any other user who would try to access this UI and it would show a blank screen. In a real production implementation, this name will be fetched from the logged-in session of the user and matched in Launchdarkly with its ID or username.

## Sorting Data Using Feature Flags

Next, we will try to sort our content in the UI using our feature flags. 

Let's imagine we have a list of users, each with a timestamp. We can sort the users naturally or based on that timestamp. We will create a feature flag variation in LaunchDarkly UI with a string type and try to use it in our code.

{{% image alt="Boolean Feature Flag LaunchDarkly" src="images/posts/nodejs-frontend-launchdarkly/Sort_Order.png" %}}

Then we will add the sorting logic in our same `App.js` and use it with a switch in the UI. The UI will display either *Natural Sorting* or *Time-based Sorting*. By default, if the flag is set to “*timestamp*” then Time-based Sorting takes place otherwise Natural Sorting:

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
      // UI based logged-in user
      key: 'john_doe'
    }
    // SDK requires Client-side ID for UI call
    this.ldclient = LDClient.initialize('62e*********************', user);
    this.ldclient.on('ready', this.onLaunchDarklyUpdated.bind(this));
    this.ldclient.on('change', this.onLaunchDarklyUpdated.bind(this));
  }
  onLaunchDarklyUpdated() {
    this.setState({
      featureFlags: {
        defaultSortingType: this.ldclient.variation('sort-order', "natural")
      }
    })
  }
  render() {
    if (!this.state.featureFlags) {
      return <div className="App">Loading....</div>
    }

    let sorter;
    if (this.state.selectedSortOrder) {
      if (this.state.selectedSortOrder === 'timestamp') {
        sorter = isNewer
      } else if (this.state.selectedSortOrder === 'natural') {
        sorter = undefined
      }
    } else {
      if (this.state.featureFlags.defaultSortingType === 'timestamp') {
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
          onClick={() => this.setState({ selectedSortOrder: 'timestamp' })}>Time sorting</div>
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

Now our UI looks something like the below:

{{% image alt="Final UI" src="images/posts/nodejs-frontend-launchdarkly/Final_UI.png" %}}

## Conclusion

As you can see, feature flags enable us to dynamically alter the application's runtime behavior. Additionally, we can introduce or remove additional functionalities as per requirement. By doing so, we may improve performance and eliminate various reliance on layers connected to databases.

A comprehensive feature management platform like LaunchDarkly, as we saw in this article supports a wide range of programming languages. Without affecting overall speed, it scales to virtually an infinite number of feature flags and enables us to build flexible targeting criteria. This might be a very helpful solution for businesses that need to manage many codebases using different programming languages.

Feature flags are frequently viewed as either an engineering tool or a product manager tool. The truth is that it's both. Flags can assist product managers in better controlling releases, coordinating launch times, and building a feedback loop more effectively. They can also help software development and DevOps teams reduce overhead and boost velocity.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/nodejs/nodejs-react-feature-flag-launchdarkly/).
