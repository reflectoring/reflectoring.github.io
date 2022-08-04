---
title: "Feature Flags in Node.js Backend Server with LaunchDarkly"
categories: ["Node"]
date: 2022-08-03 00:00:00 +1100 
modified: 2022-08-03 00:00:00 +1100
authors: [arpendu]
excerpt: "A simple article to understand various use-cases of Feature flags that can be achieved with LaunchDarkly."
image: images/stock/0104-on-off-1200x628-branded.jpg
url: nodejs-feature-flag-launchdarkly
---

Whenever we think of deploying a new version of an existing service or application, we fear a lot whether the new features would work or whether it would be liked by the users or not. Thus, here comes the concept of *“Feature Flag”* which helps us in achieving all of that with something just like a toggle button or a switch.

A *feature flag* is a process used predominantly in the case of software development to manage a particular functionality by enabling or disabling it remotely. New features can be deployed without making them visible to users. Thus, feature flags help us to decouple deployment from release which in turn lets us manage the full lifecycle of a feature.

The whole purpose is to control the usage and access of a particular feature. It also eliminates the urge to maintain multiple branches in our code and rather allows us to commit everything in the primary branch and enable it only when the feature is ready.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/nodejs-backend-feature-flag-launchdarkly" %}}

## Use-cases of Feature Flags

Feature flags or feature management is commonly used in various companies in order to perform following operations:

- Reduce the number of rollbacks in the existing code due to failure or breakage.
- Gradually roll or publish out new features or functionality to users.
- Minimize the risk of a release by first releasing something like a beta version to a limited groups of users.
- Test various kinds of user acceptance.

Often companies who rely mostly on Continuous Integration(CI), Continuous Delivery(CD) or Progressive Delivery use these feature flags to roll out features. Teams basically define a process through which they roll out releases smartly wrapped with feature flags to minimize the risk to company.

Following are some of the most common use-cases for feature flagging:

* **Global Rollout**: If we want to enable or disable a certain feature for all the users in a system, then this is one of the simplest option that can be opted.
* **Percentage Rollout**: This feature allows us to enable a feature for a given percentage of users and then can be enhanced or decreased based upon its need.
* **User-attribute Based Rollout**: This is a targeted rollout defined based upon a user attribute or its behavior. A user attribute could be something like location, demographic or application specific like user session, etc.

## Introducing LaunchDarkly

[LaunchDarkly](https://launchdarkly.com/) is an overall feature management service or app that takes care of all the feature flagging concepts. The name is derived from the concept of a *“dark launch”*, which deploys a feature in a deactivated state and activates it when the time is right.

{{% image alt="LaunchDarkly Internal" src="images/posts/feature-flag-tools/launchdarkly.png" %}}

It is a cloud-based service and it provides a UI to manage everything about the feature flags. For each flag, we need to define one or more **variations**. The variation can be a *boolean*, arbitrary *number*, *string* values, or *JSON* snippets.

We can define **targeting rules** to define which variation a feature flag will show to its user. By default, a targeting rule for a feature flag is deactivated. The simplest targeting rule is *“show variation X for all users”*. A more complex targeting rule is *“show variation A for all users with attribute X, variation B for all users with attribute Y, and variation C for all other users”*.

LaunchDarkly uses a [streaming architecture](https://launchdarkly.com/blog/launchdarklys-evolution-from-polling-to-streaming/) instead of a polling architecture. This architecture is good from a scalability perspective so that our application doesn’t have to make a network call every time whenever we need to evaluate or fetch a feature flag. It’s also good for resiliency because feature flag evaluation will still work if the LaunchDarkly server has stopped and is not responding to our calls anymore.

## Initial Setup in Node.js

LaunchDarkly supports lots of clients with different coding languages. For NodeJs, it has created an npm library with the name **[launchdarkly-node-server-sdk](https://github.com/launchdarkly/node-server-sdk)**. We will use this library as a dependency in our code. 

In order to create our backend service, we need to first initiate the repo by simply executing:

```bash
npm init
```

Then we can try installing all the packages at once by simply executing the following command:

```bash
npm install launchdarkly-node-server-sdk express
```

We are going to use `launchdarkly-node-server-sdk` for connecting to the LaunchDarkly server to fetch the variations. Then we would need *express* to create a server that would listen in a particular port and host our APIs.

Next, we need to create an account in LaunchDarkly UI. You can also signup for a free trial [here](https://app.launchdarkly.com/signup). After signing up, we would be assigned an *SDK Key* that the client can use to authenticate into the server. We will use *Mobile Key* as our user to fetch or retrieve the feature flags.

{{% image alt="LaunchDarkly Keys" src="images/posts/nodejs-launchdarkly/LaunchDarkly_Keys.png" %}}

## Retrieve All Flags set in LaunchDarkly

The first thing that we can try is to retrieve all the flags being set in LaunchDarkly. In order to do that we will define a simple file `index.js`:

```javascript
import LaunchDarkly from 'launchdarkly-node-server-sdk';
import express from 'express';

const app = express();

app.get("/", async (req, res) => {
  const flags = await init();
  res.send(flags);
});
app.listen(8080);

const sdkKey = 'sdk-d2432dc7-e56a-458b-9f93-0361af47d578';
const buyerKey = 'mob-b9d6d4d4-4300-46fa-9b13-d9eac89f9794';
let client;

async function init() {
  if (!client) {
    client = LaunchDarkly.init(sdkKey);
    await client.waitForInitialization();
  }

  const user = {
    key: buyerKey
  };
  const allFlagsState = await client.allFlagsState(user);
  const flags = allFlagsState.allValues();
  return flags;
}
```

We can simply initiate a client using `LaunchDarkly.init(sdkKey)` and then we can wait to initialize. After that we can call `allFlagsState` method that captures the state of all feature flag keys with regard to a specific user. This includes their values, as well as other metadata.

Finally we can bind all of this to an API using express so that it would get printed as a response whenever we hit the API with the endpoint http://localhost:8080.

Next we can define the script as part of `package.json`:

```json
{
	"scripts": {
    	"start": "node index.js"
  	}
}
```

Then we can execute the following command to run our app:

```bash
npm run start
```

When we hit the endpoint we can see the following output:

```json
{
  "backend-log-level": "log",
  "ip-blacklisted-list": [
    "192.168.100.10",
    "192.168.100.40"
  ],
  "tasks-batch-size-count": 100
}
```

## Server-side Bootstrapping with LaunchDarkly

Next we can try some server side bootstrap code which can take some pretty common environment variable like a log level for our service and start our app by subscribing to those flag variables. Let’s first add few libraries like `date-fns` and `lodash`:

```bash
npm install date-fns lodash
```

Then we will create a `Logger` class which will have a constructor and some static and normal methods defined for each log level:

```javascript
import { format } from 'date-fns';
import padEnd from 'lodash/padEnd.js';
import capitalize from 'lodash/capitalize.js';

const LEVELS = { debug: 10, log: 20, warn: 30, error: 40 };
let LD_LOG_LEVEL = LEVELS['debug'];

class Logger {
  constructor(module) {
    this.module = module ? module : '';

    this.debug = this.debug.bind(this);
    this.log = this.log.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
    this.consoleWriter = this.consoleWriter.bind(this);
  }

  static setLogLevel(level) {
    LD_LOG_LEVEL = LEVELS[level];
  }

  static get(module) {
    return new Logger(module);
  }

  consoleWriter(level, message, context = '') {
    if (LEVELS[level] >= LD_LOG_LEVEL) {
      const dateTime = format(new Date(), 'MM-dd-yyyy HH:mm:ss:SSS');
      const formattedLevel = padEnd(capitalize(level), 5);
      const formattedMessage = `${dateTime} ${formattedLevel} [${
        this.module
      }] ${message}`;
      console[level](formattedMessage, context);
    }
  }

  debug(message, context) {
    this.consoleWriter('debug', message, context);
  }

  log(message, context) {
    this.consoleWriter('log', message, context);
  }

  warn(message, context) {
    this.consoleWriter('warn', message, context);
  }

  error(message, context) {
    this.consoleWriter('error', message, context);
  }
}

export default Logger;
```

Then we will define a flag in LaunchDarkly with the name *“backend-log-level”* where we can add a default variation as *“debug”*. We can then change it later to whatever we need.

{{% image alt="Backend Log Level Feature Flag" src="images/posts/nodejs-launchdarkly/Simple_Log_Level.png" %}}

Next we can define a similar kind of code that we did it earlier but we will subscribe to the log level changes before we initiate the `express` app:

```javascript
import util from 'util';
import express from 'express';
import LaunchDarkly from 'launchdarkly-node-server-sdk';
import Logger from './logger.js';

const PORT = 5000;
const app = express();
const simpleLogger = new Logger('Backend');

const LD_SDK_KEY = 'sdk-d2432dc7-e56a-458b-9f93-0361af47d578';
const LOG_LEVEL_FLAG_KEY = 'backend-log-level';
const buyerKey = 'mob-b9d6d4d4-4300-46fa-9b13-d9eac89f9794';
const client = LaunchDarkly.init(LD_SDK_KEY);
client.waitForInitialization();
const asyncGetFlag = util.promisify(client.variation);

const subscribeToChanges = () => {
  client.on(`update:${LOG_LEVEL_FLAG_KEY}`, (_, newValue) => {
    const {
      fallthrough: { variation },
      variations
    } = newValue;
    const newLogLevel = variations[variation];
    console.log(`${LOG_LEVEL_FLAG_KEY} updated to '${newLogLevel}'`);
    Logger.setLogLevel(newLogLevel);
  });
};

client.once('ready', async () => {
  const user = { key: buyerKey, anonymous: true };
  const initialLogLevel = await asyncGetFlag(LOG_LEVEL_FLAG_KEY, user, 'debug');
  Logger.setLogLevel(initialLogLevel);

  subscribeToChanges();

  app.get('/', (req, res) => {
    simpleLogger.debug('detailed debug message');
    simpleLogger.log('simple log message');
    simpleLogger.warn('Warning warning do something');
    simpleLogger.error('ERROR! ERROR!');
    res.sendStatus(200);
  });

  app.listen(PORT, () => {
    simpleLogger.log(`Server listening on port ${PORT}`);
  });
});
```

Next we can define the script as part of `package.json`:

```json
{
	"scripts": {
    	"bootstrap": "node bootstrap.js"
  	}
}
```

Then we can execute the following command to run our app:

```bash
npm run bootstrap
```

Finally when we hit the API with the endpoint http://localhost:5000 we get to see the following log message being printed:

```bash
info: [LaunchDarkly] Initializing stream processor to receive feature flag updates
info: [LaunchDarkly] Opened LaunchDarkly stream connection
07-26-2022 11:54:58:193 Debug [Backend] detailed debug message
07-26-2022 11:54:58:195 Log   [Backend] simple log message
07-26-2022 11:54:58:196 Warn  [Backend] Warning warning do something
07-26-2022 11:54:58:197 Error [Backend] ERROR! ERROR!
```

## Perform Admin Specific Operations using Multivariate Flags in LaunchDarkly

LaunchDarkly supports something named *“multivariate”* flag apart from the simple boolean, String or JSON values. A multivariate feature flag could be a list of different strings, numbers or booleans. So let’s try defining few long-lived operational flag that would update our application feature dynamically.

### Change Log Level on the Fly without Restarting the Server

The first flag type we can start with is to use the same log-level concept that we saw earlier. We will define a multivariate with will define the following string variations:

* debug
* error
* info
* warn

{{% image alt="Multivariate log-level" src="images/posts/nodejs-launchdarkly/Log_Level_Variations.png" %}}

Next we can define targeting values that would deliver one of the above defined multivariate strings.

{{% image alt="Multivariate targeting rule" src="images/posts/nodejs-launchdarkly/Targeting_Log_Level.png" %}}

Now once we have our multivariate feature flag defined, we can start with our code. We will update our existing logger class with a new implementation that would read the log-level from the variation and print accordingly:

```javascript
import chalk from 'chalk';

class LdLogger {
 
	constructor ( ldClient, flagKey, buyerKey ) { 
		this.ldClient = ldClient;
		this.flagKey = flagKey;
		this.buyerKey = buyerKey;
		this.previousLevel = null; 
	}
 
	async debug( message ) { 
		if ( await this._presentLog( 'debug' ) ) {
			console.log( chalk.grey( chalk.bold( 'DEBUG:' ), message ) ); 
		} 
	}
 
	async error( message ) { 
		if ( await this._presentLog( 'error' ) ) {
			console.log( chalk.red( chalk.bold( 'ERROR:' ), message ) ); 
		} 
	}
 
	async info( message ) { 
		if ( await this._presentLog( 'info' ) ) {
			console.log( chalk.cyan( chalk.bold( 'INFO:' ), message ) ); 
		} 
	}
 
	async warn( message ) { 
		if ( await this._presentLog( 'warn' ) ) {
			console.log( chalk.magenta( chalk.bold( 'WARN:' ), message ) ); 
		}
	}
 
	async _presentLog( level ) {
 
		// Get the minimum log-level from the given LaunchDarkly client. Since this is
		// an OPERATIONAL flag, not a USER flag, the "key" needs to indicate the current
		// application context. In this case, I'm calling the app, "backend-log-level". If I
		// want to get more granular, I could use something like machine ID. But, for
		// this particular setting, I think app-name makes sense.
		const minLogLevel = await this.ldClient.variation(
			this.flagKey,
			{
				key: this.buyerKey
			},
			'debug' // Default / fall-back value if LaunchDarkly unavailable.
		);
 
		if ( minLogLevel !== this.previousLevel ) { 
			console.log( chalk.bgGreen.bold.white( `Switching to log-level: ${ minLogLevel }` ) ); 
		}
 
		// Given the minimum log level, determine if the level in question can be logged.
		switch ( this.previousLevel = minLogLevel ) {
			case 'error':
				return level === 'error';
			case 'warn':
				return level === 'error' ||	level === 'warn';
			case 'info':
				return level === 'error' || level === 'warn' || level === 'info';
			default:
				return true;
		} 
	} 
}

export default LdLogger;
```

Next we will define the logic to subscribe to this log-level and execute some operations in a loop. For this testing, we can simply define a fake memory reader that will generate some random number and print message accordingly:

```javascript
import chalk from 'chalk';
import LaunchDarkly from 'launchdarkly-node-server-sdk';
import LdLogger from './ld_logger.js';

const LD_SDK_KEY = 'sdk-d2432dc7-e56a-458b-9f93-0361af47d578';
const flagKey = 'backend-log-level';
const buyerKey = 'mob-b9d6d4d4-4300-46fa-9b13-d9eac89f9794';
const launchDarklyClient = LaunchDarkly.init( LD_SDK_KEY );
launchDarklyClient.waitForInitialization();
const logger = new LdLogger( launchDarklyClient, flagKey, buyerKey );
let loop = 0;
 
launchDarklyClient.once('ready', async () => { 
		setTimeout( executeLoop, 1000 ); 
	}
);
 
//Fake memory reader randomized to throw errors.
function readMemory() { 
	const memory = ( Math.random() * 100 ).toFixed( 1 ); 
	if ( memory <= 30 ) { 
		throw new Error( 'IOError' ); 
	} 
	return memory; 
}

function executeLoop () {
		console.log( chalk.dim.italic( `Loop ${ ++loop }` ) ); 
		logger.debug( 'Executing loop.' ); 
		try { 
			logger.debug( 'Checking free memory.' );
			const memoryUsed = readMemory();
			logger.info( `Memory used: ${ memoryUsed }%` ); 
			if ( memoryUsed >= 50 ) { 
				logger.warn( 'More than half of free memory has been allocated.' ); 
			} 
		} catch ( error ) { 
			logger.error( `Memory could not be read: ${ error.message }` );
		} 
		setTimeout( executeLoop, 1000 ); 
}
```

Next we can define the script as part of `package.json`:

```json
{
	"scripts": {
    	"dynamic": "node dynamic_logging.js"
  	}
}
```

Then we can execute the following command to run our app:

```bash
npm run dynamic
```

Finally when we run the above command it will print something like below:

```bash
info: [LaunchDarkly] Initializing stream processor to receive feature flag updates
info: [LaunchDarkly] Opened LaunchDarkly stream connection
Loop 1
Switching to log-level: debug
DEBUG: Executing loop.
DEBUG: Checking free memory.
INFO: Memory used: 68.2%
WARN: More than half of free memory has been allocated.
Loop 2
DEBUG: Executing loop.
DEBUG: Checking free memory.
ERROR: Memory could not be read: IOError
Loop 3
DEBUG: Executing loop.
DEBUG: Checking free memory.
INFO: Memory used: 67.4%
WARN: More than half of free memory has been allocated.
```

### Manage blacklisted Users or IPs on the Fly

Now we can take a brief look at the JSON type flags as these feature flag values are pretty open-ended. LaunchDarkly supports a JSON type right out of the box. This allows us to pass Object and Array data structures to our application which can then be used to implement lightweight administrative and operational functionality in our web application.

Let’s consider that we have a server that watches the network IPs that are trying to access the server and somehow it would like to check for blacklisted IPs and then block them from our server. So if we think about it on a very bare minimum we would need the following:

- a database to store the IP address.
- an Admin UI to update those IP addresses periodically.
- a User Access Control around those User Interfaces.
- a data-access layer as an abstraction to update the database.
- finally, a REST API to integrate with the UI.

All of this looks tedious and need a lot of effort to maintain just a list of IP address. Well, LaunchDarkly provides us with all of this functionality with almost no effort at all. We can just define a flexible data structure and pass those values to be fetched dynamically. In this case, we can create an Array of IP addresses as part of JSON variation. This helps us to maintain a history of IP-address configuration rather than changing the same value. A type of this feature flag would look something like:

{{% image alt="JSON multivariate feature flag" src="images/posts/nodejs-launchdarkly/IP_Blacklist.png" %}}

Next we will define the code to consume this feature flag variation dynamically and block the IP:

```javascript
import chalk from 'chalk';
import LaunchDarkly from 'launchdarkly-node-server-sdk';

const LD_SDK_KEY = 'sdk-d2432dc7-e56a-458b-9f93-0361af47d578';
const launchDarklyClient = LaunchDarkly.init( LD_SDK_KEY );
 
// We're just going to mock some traffic to a
// mock function that handles mock request /
// response structures mock all the things!
(async function sendMockHttpRequest() { 
	try {
		await launchDarklyClient.waitForInitialization(); 
		await mockHandleHttpRequest({
			ip: "192.168.100.40"
		}); 
	} catch ( error ) { 
		console.warn( "Error sending mock HTTP request." );
		console.error( error ); 
	} 
	setTimeout( sendMockHttpRequest, 1000 );
 
})();

async function mockHandleHttpRequest( request ) {
 
	// Get the collection of blocked IP-addresses. Internally, we've defined our feature
	// flag value as a JSON (JavaScript Object Notation) type. This means that
	// LaunchDarkly automatically handles the stringification, streaming, and parsing of
	// it for us. In other words, this .variation() call doesn't return a JSON payload -
	// it returns the original data structure that we provided in the LD dashboard.
	var ipBlacklist = await launchDarklyClient.variation(
		'ip-blacklisted-list',
		{
			key: 'mob-b9d6d4d4-4300-46fa-9b13-d9eac89f9794' // The static "user" for this task.
		},
		// Since the JSON type is automatically parsed by the LaunchDarkly client, our
		// default value should be the same type as the intended payload. In other words,
		// the default value is NOT a JSON STRING but, rather, AN ARRAY. In this case,
		// we're defaulting to the empty array so the site can FAIL OPEN.
		[]
	);
 
	// Check to see if the incoming request IP should be blocked.
	if ( ipBlacklist.includes( request.ip ) ) { 
		console.log( chalk.red( 'Blocking IP', chalk.bold( request.ip ) ) );
		console.log( chalk.red.italic( `... blocking one of ${ ipBlacklist.length }`
		+ ` known IP addresses.` ) ); 
	} else { 
		console.log( chalk.green( 'Allowing IP', chalk.bold( request.ip ) ) ); 
	} 
}
```

Next we can define the script as part of `package.json`:

```json
{
	"scripts": {
    	"blacklist": "nodemon blacklist_check.js"
  	}
}
```

Then we can execute the following command to run our app:

```bash
npm run blacklist
```

Finally when we run the above command it will print something like below:

```bash
info: [LaunchDarkly] Initializing stream processor to receive feature flag updates
info: [LaunchDarkly] Opened LaunchDarkly stream connection
Allowing IP 192.168.100.40
Allowing IP 192.168.100.40
Allowing IP 192.168.100.40
Allowing IP 192.168.100.40
Allowing IP 192.168.100.40
```

Now we can go to the UI, add this IP and redeploy the variation. We will immediately see dynamically the app has picked the blocked IP and start printing it out something like below:

```bash
info: [LaunchDarkly] Initializing stream processor to receive feature flag updates
info: [LaunchDarkly] Opened LaunchDarkly stream connection
Allowing IP 192.168.100.40
Allowing IP 192.168.100.40
Allowing IP 192.168.100.40
Allowing IP 192.168.100.40
Allowing IP 192.168.100.40
Blocking IP 192.168.100.40
... blocking one of 2 known IP addresses.
Blocking IP 192.168.100.40
... blocking one of 2 known IP addresses.
Blocking IP 192.168.100.40
... blocking one of 2 known IP addresses.
Blocking IP 192.168.100.40
... blocking one of 2 known IP addresses.
Blocking IP 192.168.100.40
... blocking one of 2 known IP addresses.
Blocking IP 192.168.100.40
... blocking one of 2 known IP addresses.
```

So this helped us to minimistically add an administrative feature to our existing microservice.

### Update Batch Size while Performing Batch Operations on the Fly

Consider that you have a batch task or job that needs to be executed. But we might need to update or somehow ramp-up the number of operations as per the need. So, if we think about it, we might need to first run this job behind some kind of scheduler and then we might need to pass some environment variables. Now if we want to update that number we always would need to restart our application.

But we can just make use of our multivariate options in LaunchDarkly to define a batch size. We can dynamically change this values so that it reflects in the code accordingly.

{{% image alt="Batch Multivariate option" src="images/posts/nodejs-launchdarkly/Batch_Size_Count.png" %}}

Next we can define a `BatchRunner` to get batch size and execute the batch process in a loop:

```javascript
import chalk from 'chalk';
import LaunchDarkly from 'launchdarkly-node-server-sdk';
 
class BatchRunner {
 
	constructor( launchDarklyClient, flagKey, buyerKey ) { 
		this._launchDarklyClient = launchDarklyClient;
		this._flagKey = flagKey;
		this._buyerKey = buyerKey;
	}

	async run() {
 
		while ( true ) { 
			// We're going to check how many records we should be processing for 
			// each batch. This allows us to gradually ramp-up the batch size while
			// we monitor the mock database to see how it is handling the demand.
			var batchSize = await this._getBatchSize();
			var batch = await this._getNextBatch( batchSize );
			if ( ! batch.length ) { 
				break;
			}

			if (batchSize < 1000) {
				console.log( chalk.cyan( 'Processing', chalk.bold( batchSize, 'records.' ) ) ); 
			} else {
				console.log( chalk.redBright( 'Processing', chalk.bold( batchSize, 'records.' ) ) ); 
			}
			
			await this._processBatch( batch ); 
		}
 
	}

	async _getBatchSize() {
		await this._launchDarklyClient.waitForInitialization();
		var batchSize = await this._launchDarklyClient.variation(
			this._flagKey,
			{
				key: this._buyerKey
			},
			100 // Default fall-back variation value.
		); 
		return( batchSize ); 
	}

	async _getNextBatch( batchSize ) { 
		return( new Array( batchSize ).fill( 0 ) ); 
	}

	async _processBatch( batch ) { 
		await new Promise(
			( resolve, reject ) => { 
				setTimeout( resolve, 1000 ); 
			}
		); 
	} 
}

const LD_SDK_KEY = 'sdk-d2432dc7-e56a-458b-9f93-0361af47d578';
const LD_FLAG_KEY = 'tasks-batch-size-count';
const LD_BUYER_KEY = 'mob-b9d6d4d4-4300-46fa-9b13-d9eac89f9794';
const launchDarklyClient = LaunchDarkly.init( LD_SDK_KEY );
 
new BatchRunner( launchDarklyClient, LD_FLAG_KEY, LD_BUYER_KEY ).run();
```

Next we can define the script as part of `package.json`:

```json
{
	"scripts": {
    	"batch": "nodemon batch_task.js"
  	}
}
```

Then we can execute the following command to run our app:

```bash
npm run batch
```

Finally when we run the above command it will print something like below:

```bash
info: [LaunchDarkly] Initializing stream processor to receive feature flag updates
info: [LaunchDarkly] Opened LaunchDarkly stream connection
Processing 100 records.
Processing 100 records.
Processing 100 records.
Processing 100 records.
Processing 100 records.
```

Now if we go back and update our batch size to 1000 records and save it, then you would immediately see that the code has retrieved the latest batch size and updated it dynamically.

```bash
info: [LaunchDarkly] Initializing stream processor to receive feature flag updates
info: [LaunchDarkly] Opened LaunchDarkly stream connection
Processing 100 records.
Processing 100 records.
Processing 100 records.
Processing 100 records.
Processing 100 records.
Processing 1000 records.
Processing 1000 records.
Processing 1000 records.
```

## Conclusion

As you can see LaunchDarkly as a cloud service is pretty powerful on its own and it allows us to dynamically change the runtime behavior of the application. We can also rollout or take back new features as per our convenience. This allows us to squeeze our performance and get rid of various dependencies on database related layers.

LaunchDarkly is a full-blown feature management platform that supports many programming languages. It allows us to define flexible targeting rules and scales to an almost limitless number of feature flags without impacting overall performance. If we have an enterprise which needs to manage multiple codebases having various programming languages, then this could prove a very useful tool.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/nodejs/nodejs-backend-feature-flag-launchdarkly).
