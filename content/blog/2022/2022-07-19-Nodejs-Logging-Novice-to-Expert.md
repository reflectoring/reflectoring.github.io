---
title: "Node.js Logging: Novice to Expert"
categories: ["Node"]
date: 2022-07-19 00:00:00 +1100
authors: ["ajibade"]
description: "Introducing Node Js Developers to Logging Using Winston Loggers"
image: images/stock/0125-nodejs-logging.jpg
url: logging
---

Logging is used to provide accurate context about what occurs in our application, it is the documentation of all events that happen within an application. Logging is a great way to retrace all steps taken prior to an error/event in applications to understand them better.

Large scale applications should have error/event logs, especially for significant and high-volume activity.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/logging-file" %}}

## What Should I Log In My Application?

Most Applications use logs for the purpose of debugging and troubleshooting. However, logs can be used for a variety of things including studying application systems, improving business logic and decisions, customer behavioural study, data mining, etc.

Here is a list of possible events that our application should log.

- **Requests**: This records the execution of services in our application. Services like authentication, authorizations, system access, data access, and application access.

- **Resource**: Exhausted resources, exceeded capacities, and connectivity issues are all resource-related issues to log.

- **Availability**: It is recommended to include a log statement to check the application runtime when the application session starts/stops.
  Availability logs contain faults and exceptions like the system's availability and stability.

- **Threats**: Invalid inputs and security issues are common threats to log out, such as invalid API keys, failed security verification, failed authentication, and other warnings triggered by the application’s security features.

- **Events/Changes**: Button click, changing context, etc. System or application changes, data changes (creation and deletion). These are all important messages to log out in our applications

## Logging Option In Node Js

The default logging tool in Node.js is the `console` method. Using the console module we can log messages on both the [stdout](<https://en.wikipedia.org/wiki/Standard_streams#Standard_output_(stdout)>) and [stderr](<https://en.wikipedia.org/wiki/Standard_streams#Standard_error_(stderr)>).

`console.log('some msg')` will print msg to the standard output (stdout).

`console.error('some error')` will print error to the standard error (stderr).

This method has some limitations, such as the inability to structure it or add log levels. The console module cannot perform many custom configurations.

Node.js NPM provides us with several other logging options, which are more structured, and easy to configure and customize. Here are some popularly used ones:

- Winston
- Morgan
- Pino etc.

This post will focus on how to set up and use the Winston dependency to generate logging messages.

## Winston Logger

Winston is one of the best and most widely used Node.js logging options, we are using it because it is very flexible, open-source, and has a great and supportive community, with approximately 4,000,000 weekly downloads.

## Setting Up Winston Logging.

In this section, we'll go over how to install Winston and configure Winston with an express server.

### Set Up Express.js Server

We will begin by creating a simple express application.

Make a directory folder called `logging-file`. open and enter the following command into the directory terminal.

```bash
npm init -y
npm i express winston
```

Next Open the project in your preferred code editor. VS Code here.

Create new file `app.js` and enter the following code to create a simple port and server:

```javascript
const express = require("express");
const app = express();

app.get("/", (req, res, next) => {
  console.log("debug", "Hello, Winston!");
  console.log("The is the home '/' route.");
  res.status(200).send("Logging Hello World..");
});

app.get("/event", (req, res, next) => {
  try {
    throw new Error("Not User!");
  } catch (error) {
    console.error("Events Error: Unauthenticated user");
    res.status(500).send("Error!");
  }
});

app.listen(3000, () => {
  console.log("Server Listenning On Port 3000");
});
```

Run `node app.js` to start the server.

In the above example:

- Server starts and runs on `http://localhost:3000`.
- created a `/` and `/event` route
- And will print the above log messages on our stdout and stderr when we visit each route.

## Using Winston for logging

Winston was installed above. Now let's include it in our project.

_Create a new file `logger.js` Insert the following code into the file:_

```javascript
const winston = require("winston");

const logger = winston.createLogger({
  level: "debug",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
```

In the code above, what we are doing is:

- Importing the Winston module into our project
- Creating a logger using `Winston.createLogger()` method.

Winston loggers can be generated using the default logger `winston()`, but the simplest method with more options is to create your own logger using the `winston.createLogger()` method.

In subsequent sections, we'll examine all the options provided to us by the `createLogger` to customize our loggers.

But first, lets see the Winston library in action. Returning to our `app.js`. Here we can replace all `console` statements with our newly created `logger`:

_change code in app.js to this:_

```javascript
const express = require("express");
const logger = require("./logger");
const app = express();

app.get("/", (req, res, next) => {
  logger.log("debug", "Hello, Winston!");
  logger.debug("The is the home '/' route.");
  res.status(200).send("Logging Hello World..");
});

app.get("/event", (req, res, next) => {
  try {
    throw new Error("Not User!");
  } catch (error) {
    logger.error("Events Error: Unauthenticated user");
    res.status(500).send("Error!");
  }
});

app.listen(3000, () => {
  logger.info("Server Listenning On Port 3000");
});
```

Run `node app.js` to start the server.

When we access the above routes via the paths `/` and `/event`, we get logs in JSON format.

```bash
{"level":"info","message":"Server Listenning On Port 3000"}
{"level":"debug","message":"Hello, Winston!"}
{"level":"debug","message":"The is the home '/' route."}
{"level":"error","message":"unauthenticated user failed"}
```

## Winston Method Options
As seen above the `winston.createLogger()` method gives us a number of options to help format and transport our logs.

Let us visit each option and examine the properties and features they offers.

## **Winston Level**
Log level is the piece of information in our code that indicates the importance of a specific log message. Using appropriate log levels is one of the best practices for application logging.

'winston' by default uses [npm logging levels](https://github.com/winstonjs/winston#logging-levels). Here the severity of all levels is prioritized from the most important to least important from 0 to 6 (highest to lowest).

*where:*
- **0 - error**: is a serious problem or failure, that halts current activity but leaves the application in a recoverable state with no effect on other operations. The application can continue working
- **1 - warn**:  A non-blocking warning about an unusual system exception. These logs provide context for a possible error. it logs warning signs that should be investigated.
- **2 - Info**: This denotes major events and informative messages about the application's current state. Useful For tracking the flow of the application.
- **3 - http**: This logs out HTTP request-related messages. HTTP transactions ranging from the host, path, response, requests, etc.
- **4 - verbose**: Records detailed messages that may contain sensitive information.
- **5 - debug**: Developers and internal teams should be the only ones to see these log messages. They should be disabled in production environments. These logs will help us debug our code.
- **6 - silly**: The current stack trace of the calling function should be printed out when silly messages are called. This information can be used to help developers and internal teams debug problems.

Another option is to **explicitly** configure `winston` to use levels severity as specified by [Syslog Protocol](https://datatracker.ietf.org/doc/html/rfc5424#page-11).

- **0 -  Emergency**: system is unusable
- **1 - Alert**: action must be taken immediately
- **2 - Critical**: critical conditions
- **3 - Error**: error conditions
- **4 - Warning**: warning conditions
- **5 - Notice**: normal but significant condition
- **6 - Informational**: informational messages
- **7 - Debug**: debug-level messages

If we do not **explicitly** state our `winston` level, `npm` levels will be used.

When we specify a level we can only log anything at that level or higher.

For example, looking at our `logger.js` file, the level there is set to `debug`. Hence we can only log `debug` and higher levels (`info`, `warn` and `error`).

Any level lower than `debug` would not be displayed/output when we call our `logger` method in `app.js`.

There are two ways to assign levels to log messages.

- Provide the logger method with the name of the logging level as a string.
  `logger.log("debug", "Hello, Winston!");`

- Call the level on the method directly.
  `logger.debug("info","The '/' route.")`

When we look at our previous output, we can see that debug level was logged twice, using these different ways.

## **Winston format**

Winston output is in JSON format by default, with predefined fields `level` and `message`. It's formatting feature allows us to customize logged messages.
If you are keen on aesthetics and design format of your logs.

Winston comes with a number of built-in formats. Next, we'll look at the format styles using `printf()` and `prettyPrint()`.

### **Formatting with printf()**

_Change code in `logger.js` to this:_

```javascript
const { format, createLogger, transports } = require("winston");

const { combine, timestamp, label, printf } = format;
const CATEGORY = "winston custom format";

//Using the printf format.
const customFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  level: "debug",
  format: combine(label({ label: CATEGORY }), timestamp(), customFormat),
  transports: [new transports.Console()],
});

module.exports = logger;
```

In the code snippet above

- Notice we imported some extra format methods from winston.format.
- label, combine and timestamp are log form properties.
- We defined a function `customFormat` and passed it into the combine method. Any number of formats can be passed into a single format using the `format.combine` method. It is used to combine multiple formats.

_Run `node app.js` to display logs:_

```bash
2022-07-10T00:30:49.559Z [winston custom format] info: Server Listenning On Port 3000
2022-07-10T00:30:57.484Z [winston custom format] debug: Hello, Winston!
2022-07-10T00:30:57.485Z [winston custom format] debug: This is the home '/' route.
2022-07-10T00:31:03.311Z [winston custom format] error: Events Error: Unauthenticated user
```

_When we access the above routes via the paths `/` and `/event`, we get our logs written in `printf()` format_

### **Formatting with prettyPrint()**

Similarly using the `format.combine` we can display messages in `prettyPrint` format.

_Change code in `logger.js` to display prettyPrint format:_

```javascript
const { format, createLogger, transports } = require("winston");
const { combine, timestamp, label, printf, prettyPrint } = format;
const CATEGORY = "winston custom format";

const logger = createLogger({
  level: "debug",
  format: combine(
    label({ label: CATEGORY }),
    timestamp({
      format: "MMM-DD-YYYY HH:mm:ss",
    }),
    prettyPrint()
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
```

In the above code

- we set the timestamp to a datetime value of our choice, and the message format to prettyPrint().

_Run `node app.js` to display log messages:_

```
{
  message: 'Server Listenning On Port 3000',
  level: 'info',
  label: 'winston custom format',
  timestamp: 'Jul-10-2022 02:02:03'
}
{
  level: 'debug',
  message: 'Hello, Winston!',
  label: 'winston custom format',
  timestamp: 'Jul-10-2022 02:02:08'
}
{
  message: "This is the home '/' route.",
  level: 'debug',
  label: 'winston custom format',
  timestamp: 'Jul-10-2022 02:02:08'
}
{
  message: 'Events Error: Unauthenticated user',
  level: 'error',
  label: 'winston custom format',
  timestamp: 'Jul-10-2022 02:02:14'
}
```

_When we access the above routes via the paths `/` and `/event`, we get our logs written in `prettyPrint()` format_

## **Winston transports:**

This is a Winston feature that makes use of the Node.js networking, stream, and non-blocking i/o properties.

Transport in Winston refers to the location where our log entries are stored/displayed. Winston gives us a number of options for where we want our log messages to be stored/displayed.

Here are the built-in transport options in Winston.

- Console
- File
- Http
- Stream

We've been using the Console transport by default to display log messages. Let's look at how to use the File option.

Visit this [page](https://github.com/winstonjs/winston/blob/HEAD/docs/transports.md#stream-transport) to learn more about Winston transport options.

### **Storing Winston Log Message to File**

Using the file transport option, we can save generated log messages to any file we want.

To accomplish this, the transport field in our code must either point to or generate a file.

In the `transport` section let's replace the `new transports.Console()` in our `logger.js` to `new transports.File()` as show below:

```javascript
const { createLogger, transports, format } = require("winston");

const logger = createLogger({
  level: "debug",
  format: format.json(),
  //logger method...
  transports: [
    //new transports:
    new transports.File({
      filename: "logs/example.log",
    }),
  ],
  //...
});

module.exports = logger;
```

In the above code, we are explicitly specifying that all logs generated should be saved in `logs/example.log`.

After switching the transport section with the code above

_Run `node app.js`_

When you go to your file directory, you will see that a new file `example.log` has been generated in a `logs` folder.

![](https://i.imgur.com/dGhBSxK.png)

In large applications, recording every log message into a single file is not a good idea. This makes tracking specific issues difficult. Using multiple transports is one possible solution.

Winston allows us to use **Multiple Transports**. It is common for applications to send the same log output to multiple locations.

To use **Multiple Transports** change the code in `logger.js` file:

```javascript
const { format, createLogger, transports } = require("winston");
const { combine, timestamp, label, printf, prettyPrint } = format;
const CATEGORY = "winston custom format";

const logger = createLogger({
  level: "debug",
  format: combine(
    label({ label: CATEGORY }),
    timestamp({
      format: "MMM-DD-YYYY HH:mm:ss",
    }),
    prettyPrint()
  ),
  transports: [
    new transports.File({
      filename: "logs/example.log",
    }),
    new transports.File({
      level: "error",
      filename: "logs/error.log",
    }),
    new transports.Console(),
  ],
});

module.exports = logger;
```

With these changes in place, this shows how flexible Winston is, Letting us create 3 transports with different display/store locations.

All messages would be saved in an `example.log` file, while only the error messages would be saved in an `error.log` file and the console transport will log messages to the console.

![](https://i.imgur.com/4JP76N0.png)

Each transport definition can contain configuration settings such as `levels`, `filename`, `maxFiles`, `maxsize`,`handleExceptions` and much [more](https://github.com/winstonjs/winston/blob/HEAD/docs/transports.md#file-transport).

### **Log rotation Winston**

In the production environment, a lot of activities occurs, and storing log message in files can get out of hand very quickly, even when using multiple transports. Over time log messages become large and bulky to manage.

To solve these issues Logs can be rotated based on size, limit and date. log rotation removes old logs based on count, relevance or elapsed day.

Winston provides the `winston-daily-rotate-file` module. It is an external transport used for file rotation, To keep our logs up to date.

For example, We can choose to auto-delete old log messages every 30-day intervals.

`winston-daily-rotate-file` is a transport maintained by [winston contributors](https://github.com/winstonjs/winston/blob/HEAD/docs/transports.md#maintained-by-winston-contributors).

Let's go ahead and install it, type the following terminal command in the project directory:

```bash
npm install winston-daily-rotate-file
```

Open your logger.js file and replace its content with the following code:

```javascript
const { format, createLogger, transports } = require("winston");
const { combine, label, json } = format;
require("winston-daily-rotate-file");

//Label
const CATEGORY = "Log Rotation";

//DailyRotateFile func()
const fileRotateTransport = new transports.DailyRotateFile({
  filename: "logs/rotate-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d",
});

const logger = createLogger({
  level: "debug",
  format: combine(label({ label: CATEGORY }), json()),
  transports: [fileRotateTransport, new transports.Console()],
});

module.exports = logger;
```

In the above code:

- First we created a `fileRotateTransport` function using `DailyRotateFile` method.
- filename: this is the file name to be used for storing logs. The name can include `%DATE%` placeholder, stating the date created and the format datePattern.
- datePattern: represents a date format, to be used for rotating.
- maxFiles: maximum number of logs to keep. If it is not set no log will be removed. The above log is set to delete in 14 days.
- insert `fileRotateTransport` into logger transport option.

_Run `node app.js`_

This generates a new `rotate-%DATE%.log` file in our `logs` folder and a `JSON()` file containing our rotate settings

There are more [option settings](https://github.com/winstonjs/winston-daily-rotate-file#options) to use in the `winston-daily-rotate-file` transport.

### **Winston Transports**

Winston provides more helpful modules, it supports the ability to create custom transports or leverage transports actively supported by [winston contributors](https://github.com/winstonjs/winston/blob/HEAD/docs/transports.md#maintained-by-winston-contributors) and [members of the community](https://github.com/winstonjs/winston/blob/HEAD/docs/transports.md#maintained-by-winston-contributors)
Here are some popularly used custom transport to check out:

- [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file)
- [winston-syslog](https://www.npmjs.com/package/winston-syslog)
- [winston-cloudwatch](https://www.npmjs.com/package/winston-cloudwatch)
- [winston-mongodb](https://www.npmjs.com/package/winston-mongodb)
- [winston-elasticsearch](https://www.npmjs.com/package/winston-elasticsearch)

## Logging best Practices

To derive great value from logging messages in applications, We should adhere to some widely accepted logging practices. This makes our logs easier to understand and ensures that we are logging relevant and useful information.

In light of this, let's look at a list of some best practices for Node.js application logging.

### Choose Standard Logging Option

There are many third parties logging frameworks available to choose from. It is important to ensure that our chosen logging options are simple to use, configurable and extensible enough to meet the need of our application.

Winston, Multer, Pino, and Bunyan are some of the most popular ones.

### Log using a Structured Format:

Logs are one of the most valuable toolsets for application developers when it comes to bug fixing and monitoring applications in the production environment.

Log entries should be simple to read and include important details like event description, date and time of the event, application resource, severity level, and so on. Sometimes we want to use an algorithm to index, search, and categorize our log file based on certain parameters (date, user) or automate the log reviewing process. Our logs must Be Structured to support these characteristics easily.

Structured logging is the process of using a predetermined message format for application logs, which allows logs to be treated as data sets rather than text. In Structure logging we display/output log entries as simple relational data sets, making them easy to search and analyze.

We introduce structure logging to help clarify the meaning of log messages making them readable for machines. Structured logs contain the same information as unstructured logs, but in a more structured format mostly in `JSON()` format.

```json
{
"level": "debug",
"label": "winston custom format",
"timestamp": "Jul-10-2022 02:02:08"
"host": "192.168.0.1",
"pid": "11111",
"message": "This is the home '/' route.",
}
```

Most developers now use structured logging to allow application users to interact with log files in an automated manner.

### Use the correct log level:

The appropriate severity of each event that takes place in our application should be indicated with the correct log level. To deliver the best degree of information for every possible circumstance.

Having the right log level makes it easy to set up an automated alerting system that notifies us when the application produces a log entry that demands immediate attention. This makes it easier to read logs and trace faults in our code.

### Include a timestamp

It is very important to include timestamps in log entries. This help distinguishes between logs that were recorded a few minutes ago from ones that were recorded weeks ago.

Timestamps in logs make it easier to debug issues and help us predict how recent an issue is.

### Be as descriptive as possible:

When composing a log message, make sure you stick to clear and concise words, describing the event that occurred as detailed and concise as required and always utilising a widely recognised character set.

We may not be able to gather enough information to establish the context of each logged event if our log message is not very detailed.

Each log message should be useful and relevant to the event and always keep it concise and straight to the point.

### Don't log sensitive information

Sensitive and confidential user Information should never make it into your log entries, especially in production. So that they are not at risk of being used maliciously.

If an attacker can retrieve confidential information from our log, Apart from putting users at risk of being attacked, there are fines or legal data compliance laws that can be enforced against such applications.

Sensitive information varies from personal identifiable data, health data, financial data, passwords, IP addresses etc

## Conclusion

In this article, we covered a number of techniques that will make it easier to create logs for our Node.js applications. Exploring various logging concepts and how to create an efficient logging strategy for our application, while covering several best logging practices.

As a result, our applications will be more reliable and usable.

Start Logging Today!!!
