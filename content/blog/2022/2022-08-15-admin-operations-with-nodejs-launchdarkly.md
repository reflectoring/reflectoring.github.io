---
title: "Admin Operations with Node.js and LaunchDarkly"
categories: ["Node"]
date: 2022-08-15 00:00:00 +1100 
modified: 2022-08-15 00:00:00 +1100
authors: [arpendu]
excerpt: "A simple article to understand various admin perspective use-cases of Feature flags that can be achieved with LaunchDarkly."
image: images/stock/0104-on-off-1200x628-branded.jpg
url: nodejs-admin-feature-flag-launchdarkly
---

Whenever we think of deploying a new version of an existing service or application, we fear a lot whether the new features would work or whether it would be liked by the users or not. Thus, here comes the concept of *“Feature Flag”* which helps us in providing the power of switching a feature *on/off* with something just like a *toggle button* or a *switch*.

The concept of *feature flag* can be considered as a tool that is being used predominantly in the case of software development to manage a particular functionality by enabling or disabling it remotely. New features can be deployed without making them visible to users. Thus, feature flags help us to decouple deployment from release which in turn also lets us to manage the overall lifecycle of new capability or a feature.

The whole purpose is to control the usage and access of a particular feature. It also eliminates the urge to maintain multiple branches in our code and rather allows us to commit everything in the primary branch and enable it only when the feature is ready.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/nodejs-backend-feature-flag-launchdarkly" %}}

## Use-cases of Feature Flags

Feature flags or feature management is commonly used in various companies to perform the following operations:

- Reduce the number of rollbacks in the existing code due to failure or breakage.
- Gradually roll or publish out new features or functionality to users.
- Minimize the risk of a release by first releasing something like a beta version to a limited groups of users.
- Test various kinds of user acceptance.
- Perform admin specific tasks to change application behavior dynamically at runtime or while server bootstrap.

Often companies who rely mostly on Continuous Integration(CI), Continuous Delivery(CD) or Progressive Delivery use these feature flags to roll out features. Teams basically define a process through which they roll out releases smartly wrapped with feature flags to minimize the risk to company. If someone would like to understand various types of rollouts that needs to be explored, then please refer  this article [for various deployment rollout use-cases](https://reflectoring.io/java-feature-flags/#feature-flagging-use-cases).

In this article we are going to explore some of the administrative tasks that can be performed by a System Admin persona in an organization using these feature flags. Usually some of the activities that can be performed by the admins using feature flag are:

* **Setting Application Log Level**: We can set the application log level as a flag, then load it during server bootstrap or listen to its changing events and update it dynamically in the backend.
* **Update or Manage Batch Jobs**: Usually servers are configured with a default batch size and then based upon the usage it requires to update the size count. Now this can be achieved using database but it needs server reload to load the updated count. LaunchDarkly uses streaming events due to which we can load this value dynamically during runtime without any server restart.
* **Rate Limit API calls**: Often applications those hosted as part of premium API packages often try to limit the number of calls so that they can encourage the users to opt for paid services. This value can be updated dynamically based upon the traffic and their usage at runtime.
* **Maintain blacklisted IPs or Geolocation of Users**: Applications or websites that serve restricted or secure data can manage the IPs or geolocation of incoming traffic to filter out the content or restrict some of the content. This could have been achieved using admin APIs to upload the list in database. But we can easily define a JSON array and list all the values in LaunchDarkly.
* **Schedule or Update execution time for Cron Jobs**: Usually scheduled jobs are configured as cron in a server that would perform scheduled tasks like report generation, healthchecks, etc. The Cron schedule patterns are usually static but that can be made dynamic and loaded from LaunchDarkly as a feature flag.
* **System Reporting or Metrics Gathering**: We can schedule or define rules to gather system metrics to check and evaluate system performance. These rules can be triggered or modified using feature flags dynamically whenever we need to perform any kind of maintenance.
* **Hide/Restrict Personal Identifiable Information(PII)**: We can target to define various fields that require restriction to expose sensitive data during API calls dynamically based upon the incoming User or Role information. This helps us to regulate PII rules dynamically using a feature flag in LaunchDarkly.

As part of this article, we will be discussing about various ways to read logs of an application. Then we will take a brief look into API rate limiter and management of cron jobs. Finally, we will also take a look on how to retrieve all the flags from LaunchDarkly to show or persist the flags.

## Introducing LaunchDarkly

[LaunchDarkly](https://launchdarkly.com/) is an overall feature management service or app that takes care of all the feature flagging concepts. The name is derived from the concept of a *“dark launch”*, which deploys a feature in a deactivated state and activates it when the time is right.

{{% image alt="LaunchDarkly Internal" src="images/posts/feature-flag-tools/launchdarkly.png" %}}

It is a cloud-based service and it provides a UI to manage everything about the feature flags. For each flag, we need to define one or more **variations**. The variation can be a *boolean*, arbitrary *number*, *string* values, or *JSON* snippets.

We can define **targeting rules** to define which variation a feature flag will show to its user. By default, a targeting rule for a feature flag is deactivated. The simplest targeting rule is *“show variation X for all users”*. A more complex targeting rule is *“show variation A for all users with attribute X, variation B for all users with attribute Y, and variation C for all other users”*.

LaunchDarkly SDK usually relies on persistent connection to their streaming APIs to receive server-sent-events(SSE) whenever there is any change or update in feature flag.

{{% image alt="LaunchDarkly SSE" src="images/posts/nodejs-backend-launchdarkly/LaunchDarkly_SSE.png" %}}

Source: [https://launchdarkly.com/how-it-works/](https://launchdarkly.com/how-it-works/)

## Initial Setup in Node.js

LaunchDarkly supports lots of clients with different coding languages. For NodeJs, they have created an npm library with the name **[launchdarkly-node-server-sdk](https://github.com/launchdarkly/node-server-sdk)**. We will use this library as a dependency in our code. 

In order to create our backend service, we need to first initiate the repo by simply executing:

```bash
npm init
```

Then we can try installing all the packages at once by simply executing the following command:

```bash
npm install launchdarkly-node-server-sdk express
```

We are going to use `launchdarkly-node-server-sdk` for connecting to the LaunchDarkly server to fetch the variations. Then we would need *express* to create a server that would listen in a particular port and host our APIs.

Next, we need to create an account in LaunchDarkly UI. You can also signup for a free trial [here](https://app.launchdarkly.com/signup). After signing up, we would be assigned an *SDK Key* under default project and default environment that the client can use to authenticate into the server. We will use a static user *“admin”* as our user to fetch or retrieve any of these feature flags.

{{% image alt="LaunchDarkly Keys" src="images/posts/nodejs-backend-launchdarkly/LaunchDarkly_Keys.png" %}}

## Server-side Bootstrapping with LaunchDarkly

Firstly, we would try a very simple use-case where we can fetch a feature flag from LaunchDarkly and use it as part of our server side bootstrap code and subscribe to it before it starts serving the traffic for API. Let’s first add few libraries like `date-fns` and `lodash` to design our custom logger:

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

{{% image alt="Backend Log Level Feature Flag" src="images/posts/nodejs-backend-launchdarkly/Simple_Log_Level.png" %}}

Next we will subscribe to the log level flag before we initiate the `express` app to serve our APIs:

```javascript
import util from 'util';
import express from 'express';
import LaunchDarkly from 'launchdarkly-node-server-sdk';
import Logger from './logger.js';

const PORT = 5000;
const app = express();
const simpleLogger = new Logger('SimpleLogging');

const LD_SDK_KEY = 'sdk-d2432dc7-e56a-458b-9f93-0361af47d578';
const LOG_LEVEL_FLAG_KEY = 'backend-log-level';
const client = LaunchDarkly.init(LD_SDK_KEY);
const asyncGetFlag = util.promisify(client.variation);

client.once('ready', async () => {
  const user = {
    anonymous: true
  };
  const initialLogLevel = await asyncGetFlag(LOG_LEVEL_FLAG_KEY, user, 'debug');
  Logger.setLogLevel(initialLogLevel);

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

In order to know whether the client is ready or not we can use one of the two mechanisms: *event* or *promise*. Usually the client emits a `ready` event which receives the initial flags from LaunchDarkly. We can listen for this event to know when the client is ready to execute next set of actions.

The SDK supports two methods as part of promise: `waitUntilReady()` or `waitForInitialization()`. The behavior of `waitUntilReady()` is equivalent to the `ready` event. The promise resolves when the client receives its initial flag data. As with all promises, you can either use `.then()` to provide a callback, or use `await` if you are writing asynchronous code. The other method that returns a promise, `waitForInitialization()`, is similar to `waitUntilReady()` except that it also tells you if initialization fails by rejecting the promise.

Here we have used the `ready` event for our code. Thus, we are calling `client.once()` and wait for the ready event before we can start the server.

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

### Change Log Level Dynamically without Restarting the Server

The first flag type we can start with is to use the same log-level concept that we saw earlier. In the above section, we just retrieved the log level flag and started our server. But if we need to change the log level, we might need to restart our server for the changes to get affected. Thus in this section, we would update our Logger class so that whenever we update the log level in LaunchDarkly UI, the code will dynamically switch the log level in the application.

So first of all, we will define a multivariate which will define the following string variations:

* debug
* error
* info
* warn

{{% image alt="Multivariate log-level" src="images/posts/nodejs-backend-launchdarkly/Log_Level_Variations.png" %}}

Next we can define targeting values that would deliver one of the above defined multivariate strings.

{{% image alt="Multivariate targeting rule" src="images/posts/nodejs-backend-launchdarkly/Targeting_Log_Level.png" %}}

Now once we have our multivariate feature flag defined, we can start with our code. We will update our existing logger class with a new implementation that would read the log-level from the variation and print accordingly:

```javascript
import chalk from 'chalk';

class LdLogger {
 
	constructor ( ldClient, flagKey, user ) { 
		this.ldClient = ldClient;
		this.flagKey = flagKey;
		this.user = user;
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

		const minLogLevel = await this.ldClient.variation(
			this.flagKey,
			{
				key: this.user
			},
			'debug' // Default / fall-back value if LaunchDarkly unavailable.
		);
 
		if ( minLogLevel !== this.previousLevel ) { 
			console.log( chalk.bgGreen.bold.white( `Switching to log-level: ${ minLogLevel }` ) ); 
		}
		
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
const userName = 'admin';
const launchDarklyClient = LaunchDarkly.init( LD_SDK_KEY );
const logger = new LdLogger( launchDarklyClient, flagKey, userName );
let loop = 0;

launchDarklyClient.once('ready', async () => { 
		setTimeout( executeLoop, 1000 ); 
	}
);

//Fake node status reader randomized to throw errors.
function readNodeStatus() { 
	const nodeStatus = ( Math.random() * 100 ).toFixed( 1 ); 
	if ( nodeStatus <= 30 ) { 
		throw new Error( 'IOError' ); 
	} 
	return nodeStatus; 
}

function executeLoop () {
		console.log( chalk.dim.italic( `Loop ${ ++loop }` ) ); 
		logger.debug( 'Executing loop.' ); 
		try { 
			logger.debug( 'Checking number of nodes that are busy.' );
			const nodeCount = readNodeStatus();
			logger.info( `Number of Nodes that are busy: ${ nodeCount }%` ); 
			if ( nodeCount >= 50 ) { 
				logger.warn( 'More than half of the nodes are busy. We should'
				+ ' think of adding more nodes to the cluster.' ); 
			} 
		} catch ( error ) { 
			logger.error( `Node count could not be read: ${ error.message }` );
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

### API Rate Limiter

*Rate Limiting* is a technique used for regulating the volume of incoming or outgoing traffic within a network. In this context, network refers to the line of communication between a client (e.g., a web browser) and our server (e.g., an API).

For instance, we might wish to set a daily cap of 100 queries for a public API from an unsubscribed user. If the user goes over that threshold, we can ignore the request and throw an error to let people know they've gone over their limit.

There are various algorithms for implementing rate limiting, each having advantages and disadvantages, just like with most engineering challenges. Some of them are:

* Fixed Window Counter
* Sliding Logs
* Sliding Window Counter
* Token Bucket
* Leaky Bucket

Out of this, sliding window counter is one of the most efficient ways to implement rate limiter. Thus we will try to implement a pretty simple middleware and add it to the `express` app. 

To implement this, we will use a third-party library, [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit). So, to install it, run:

```bash
npm install express-rate-limit
```

First, we will define a simple express app to host a server:

```javascript
import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import LaunchDarkly from 'launchdarkly-node-server-sdk';
import LdLogger from './ld_logger.js';

// Initiating LaunchDarkly Client
const LD_SDK_KEY = 'sdk-d2432dc7-e56a-458b-9f93-0361af47d578';
const userName = 'admin';
const launchDarklyClient = LaunchDarkly.init( LD_SDK_KEY );

// Initiating the Logger
const flagKey = 'backend-log-level';
let logger;
launchDarklyClient.once('ready', async () => {
    logger = new LdLogger( launchDarklyClient, flagKey, userName );
    serverInit();
  }
);

const serverInit = async () => {
    // Essential globals
    const app = express();

    // Initialize API
    app.get('/hello', function (req, res) {
        return res.send('Hello World')
    });

    // Initialize server
    app.listen(5000, () => {
        logger.info('Starting server on  port 5000');
    });
};
```

Now we will look at the JSON type flags as these feature flag values are pretty open-ended. LaunchDarkly supports a JSON type right out of the box. This allows us to pass Object and Array data structures to our application which can then be used to implement lightweight administrative and operational functionality in our web application. In this case, we will define a feature flag that will take the sliding window counter config and use it in our middleware.

{{% image alt="Rate Limiter Flag" src="images/posts/nodejs-backend-launchdarkly/Rate_Limiter_Flag.png" %}}

{{% image alt="Rate Limiter Variation" src="images/posts/nodejs-backend-launchdarkly/Rate_Limiter_Variation.png" %}}

Next we will define a middleware and pass it to the `express` app before starting the server:

```javascript
// Initialize Rate Limit Midlleware
const rateLimiterConfig = await launchDarklyClient.variation(
    'rate-limiter-config',
    {
        key: userName // The static "user" for this task.
    },
    {
        windowMs: 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
        max: 100, // Limit each IP to 100 requests per `window` (here, per 24 hours).
        // Set it to 0 to diable rateLimiter
        message: 'You have exceeded 100 requests in 24 hrs limit!', 
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
     } // Default/fall-back value
);
app.use(rateLimit(rateLimiterConfig));
```

Next we can define the script as part of `package.json`:

```json
{
	"scripts": {
    	"rateLimiter": "nodemon rate_limiter.js"
  	}
}
```

Then we can execute the following command to run our app:

```bash
npm run rateLimiter
```

Now when an unsubscribed user hits the APIs within the defined limit he will get to see:

{{% image alt="Normal API" src="images/posts/nodejs-backend-launchdarkly/Normal_API_Call.png" %}}

But when the threshold limit exceeds for that user, he will see the following error:

{{% image alt="Rate Limit Error" src="images/posts/nodejs-backend-launchdarkly/Rate_Limiter_Error.png" %}}

### Schedule Cron Jobs Dynamically

Sometimes System Admins need to schedule *cron* jobs to perform various tasks like gathering system metrics, generate important report,  clearing or archiving logs, taking backup, etc. Usually, this cron jobs are scheduled using `cronTime` which is understood by cron executors. If there is a sudden need to change the `cronTime` of a particular job, then we can define it in LaunchDarkly and use it whenever the cron runs.

For this, first we will run:

```bash
npm install cron
```

Then, we will define a variation in LaunchDarkly with string parameters which will take `cronTime` as desired values.

{{% image alt="Rate Limit Error" src="images/posts/nodejs-backend-launchdarkly/Cron_Variation.png" %}}

Next, we will define our cron job code which will retrieve the config from Launchdarkly and schedule the cron:

```javascript
import cron from 'cron';
import LaunchDarkly from 'launchdarkly-node-server-sdk';

const CronJob = cron.CronJob;
const CronTime = cron.CronTime;

// Initiating LaunchDarkly Client
const LD_SDK_KEY = 'sdk-d2432dc7-e56a-458b-9f93-0361af47d578';
const userName = 'admin';
const launchDarklyClient = LaunchDarkly.init( LD_SDK_KEY );

launchDarklyClient.once('ready', async () => {    
    const cronConfig = await launchDarklyClient.variation(
      'cron-config',
      {
          key: userName
      },
      '*/4 * * * *' // Default fall-back variation value.
    );

    const job = new CronJob(cronConfig, function() {
      run();
    }, null, false)

    let run = () => {
      console.log('scheduled task called');
    }

    let scheduler = () => {
      console.log('CRON JOB STARTED WILL RUN AS PER LAUNCHDARKLY CONFIG');
      job.start();
    }

    let schedulerStop = () => {
      job.stop();
      console.log('scheduler stopped');
    }

    let schedulerStatus = () => {
      console.log('cron status ---->>>', job.running);
    }

    let changeTime = (input) => {
      job.setTime(new CronTime(input));
      console.log('changed to every 1 second');
    }

    scheduler();
    setTimeout(() => {schedulerStatus()}, 1000);
    setTimeout(() => {schedulerStop()}, 9000);
    setTimeout(() => {schedulerStatus()}, 10000);
    setTimeout(() => {changeTime('* * * * * *')}, 11000);
    setTimeout(() => {scheduler()}, 12000);
    setTimeout(() => {schedulerStop()}, 16000);
  }
);
```

Next we can define the script as part of `package.json`:

```json
{
	"scripts": {
    	"cron": "nodemon cron_job.js"
  	}
}
```

Then we can execute the following command to run our app:

```bash
npm run cron
```



## Retrieve All Flags set in LaunchDarkly

Lastly, we can try to retrieve all the flags being set in LaunchDarkly. As a developer, we would always be curious to know how the feature flags look like or the format in which these data is being returned by the SDK. So in order to retrieve all the flags from the LaunchDarkly for a given account, we will define a simple file `index.js`:

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
const userName = 'admin';
let client;

async function init() {
  if (!client) {
    client = LaunchDarkly.init(sdkKey);
    await client.waitForInitialization();
  }

  const user = {
    key: userName
  };
  const allFlagsState = await client.allFlagsState(user);
  const flags = allFlagsState.allValues();
  return flags;
}
```

We can simply initiate a client using `LaunchDarkly.init(sdkKey)` and then we can wait to initialize. After that we can call `allFlagsState` method that captures the state of all feature flag keys with regard to a specific user. This includes their values, as well as other metadata.

Finally we can bind all of this to an API using `app.get()` method so that it would get printed as a response whenever we hit the API with the endpoint http://localhost:8080.

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
  "backend-log-level": "debug",
  "cron-config": "* * * * * *",
  "rate-limiter-config": {
    "message": "You have exceeded 200 requests in 24 hrs limit!",
    "standardHeaders": true,
    "windowMs": 86400000,
    "legacyHeaders": false,
    "max": 200
  }
}
```

## Conclusion

As you can see LaunchDarkly as a cloud service is pretty powerful on its own and it allows us to dynamically change the runtime behavior of the application. We can also rollout or take back new features as per our convenience. This allows us to squeeze our performance and get rid of various dependencies on database related layers.

LaunchDarkly is a full-blown feature management platform that supports many programming languages. It allows us to define flexible targeting rules and scales to an almost limitless number of feature flags without impacting overall performance. If we have an enterprise which needs to manage multiple codebases having various programming languages, then this could prove a very useful tool.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/nodejs/nodejs-backend-feature-flag-launchdarkly).
