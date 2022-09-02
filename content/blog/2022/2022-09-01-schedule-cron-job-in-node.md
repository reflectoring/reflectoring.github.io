---
title: "Scheduling Jobs with Node.js"
categories: ["Node"]
date: 2022-08-25 00:00:00 +1100
authors: ["ajibade"]
description: "Quick guide to scheduling cron jobs in Node.js applications"
image: images/stock/0043-calendar-1200x628-branded.jpg
url: schedule-cron-job-in-node
---

Have you ever wanted to perform a specific task on your application server at specific times without physically running them yourself? Or we'd rather spend your time on more important tasks than remember to periodically clear or move data from one part of the server to another.

We can use cron job schedulers to automate such tasks.

Cron job scheduling is a common practice in modern applications. The original `cron` is a [daemon](https://en.wikipedia.org/wiki/Daemon_(computing)), which means that it only needs to be started once, and will 
lay dormant until it is required. Another example of a deamon is the web server. The web server remains idle until a request for a web page is made.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/job-scheduler" %}}

## Using `node-cron`
In this article, we'll use the [`node-cron`](https://www.npmjs.com/package/node-cron) library to schedule cron jobs in several Node.js demo applications. `node-cron` is a Node module that is made available by npm.

To schedule jobs using `node-cron`, we need to invoke the method `cron.schedule()` method.

### `cron.schedule()` Method Syntax

The signature of the `cron.schedule()` method looks like this:

```
cron.schedule(expression, function, options);
```

Let's explore each of the arguments.

#### Cron Expression
This is the first argument of the `cron.schedule()` method. This expression is used to specify the schedule on which a cron job is to be executed. The expression is sometimes also called a "crontab" expression, from the command-line tool [`crontab`](https://www.man7.org/linux/man-pages/man5/crontab.5.html), which can schedule multiple jobs in one "crontab" file. 

The cron expression is made up of 6 elements, separated by a space. 

Here's a quick reference to the cron expression, Indicating what each element represents.

```
 ┌────────────── second (0 - 59) (optional)
 │ ┌──────────── minute (0 - 59) 
 │ │ ┌────────── hour (0 - 23)
 │ │ │ ┌──────── day of the month (1 - 31)
 │ │ │ │ ┌────── month (1 - 12)
 │ │ │ │ │ ┌──── day of the week (0 - 6) (0 and 7 both represent Sunday)
 │ │ │ │ │ │
 │ │ │ │ │ │
 * * * * * * 
```
We can replace each asterisk with one of the following characters so that the expression describes the time we want the job to be executed:

- `*`: An asterisk means "every interval". For example, if the asterisk symbol is in the "month" field, it means the task is run every month.
- `,`: The comma allows us to specify a list of values for repetition. For example, if we have `1, 3, 5` in the "month" field, the task will run in months 1, 3, and 5 (January, March, and May).
- `-`: The hyphen allows us to specify a range of values. If we have `1-5` in the "day of the week" field, the task will run every weekday (from Monday to Friday).
- `/`: The slash allows us to specify expressions like "every xth interval". If we have `*/4` in the "hour" field, it means the action will be performed every 4 hours.

The "seconds" element can be left out. In this case, cron expression will only consist of 5 elements and the first elements describes the minutes and not the seconds.

If you're unsure about manually writing cron ex[ressions, you can use free tools like [Crontab Generator](https://crontab-generator.org/) or [Crontab.guru](https://crontab.guru/#*_*_*_*_*) to generate a cron expression for us.

#### Cron Function
This is the second argument of the `cron.schedule()` method. This argument is the function that will be executed every time when the cron expression triggers.

We can do whatever we want in this function. We can send an email, make a database backup, or download data. 

#### Cron Options
In the third argument of the `cron.schedule()` method we can provide some options. This argument is optional. 

Here is an example of what cron options object looks like.
```javascript
{
   scheduled: false,
   timezone: "America/Sao_Paulo"
}
```
The `scheduled` option here is a boolean to indicate whether the job is enabled or not (default is `true`).

With the timezone option we can define the timezone in which the cron expression should be evaluated.

## Setting Up a Node.Js Application

Let's set up a Node.js application to play around with `node-cron`.

To begin, we create a new folder:
```
mkdir node-cron-demo
```

Next, we change into the new project's directory
```
cd node-cron-demo
```
We will need to create a file `index.js` here. This is where we'll be writing all our code:
```
touch index.js
```
Run the command below to initialize the project. This will generate a `package.json` file which can be used to keep track of all dependencies installed in our project.
```
npm init -y
```

Next, we will install `node-cron` and other modules used later in this article.
```
npm install node-cron node-mailer 
```


## Implementing Cron Jobs with `node-cron`
To demonstrate the functionality of the node-cron library, we will build `4` sample applications using node.js.

### 1. Scheduling a Simple Task with `node-cron`
Any task of our choosing can be automated and run at a specific time using cron job schedulers. In this section, we'll write a simple function that logs to the terminal at our specified time.

Input the following code into the `index.js` file to create our simple task scheduler:
```javascript
const cron = require("node-cron");
const express = require("express");

const app = express();

cron.schedule("*/15 * * * * *", function () {
  console.log("---------------------");
  console.log("running a task every 15 seconds");
});

app.listen(3000, () => {
  console.log("application listening.....");
});
```
In the code block above we are making a simple log to the application's terminal.

Run `node index.js` in the terminal and you'll get the following output:

`output:`
```
application listening.....
---------------------
running a task every 15 second
```


### 2. Scheduling Email Using `node-cron`
Emailing is a common feature of modern applications. Cron jobs can be used to accomplish this. For instance, a job schedule can be set to automatically send users an email each month with the most recent information from a blog or a product.

In the example, we will be using Google's email service provider Gmail. If you have a Gmail account insert it in the code below to test out our newly created email scheduler.

To use `node-mailer` with Gmail, you must first create an [app password](https://support.google.com/mail/answer/185833?hl=en-GB) for Gmail to allow third-party access.

Set up your Gmail app password following these steps:
- First head to your Gmail Account.
- Click on the profile image to the right.
- Click on `Manage your Google Account`, then click `Security`.
- In the `Signing in to Google` section select the `App password` option.
- If the `App password` option is unavailable, set up 2-Step Verification for your account.
- Select the app (mail) and the current device we want to generate the app password for.
- Click Generate.
- Copy the generated 16-character code from the yellow bar on your device.

To create our email scheduler application insert the following code into the `index.js` file:
```javascript
const express = require("express");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
app = express();

//send email after 1 minute
cron.schedule("1 * * * *", function () {
  mailService();
});

function mailService() {
  let mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "<your-email>@gmail.com",
// use generated app password for gmail
      pass: "***********",
    },
  });

  // setting credentials
  let mailDetails = {
    from: "<your-email>@gmail.com",
    to: "<user-email>@gmail.com",
    subject: "Test Mail using Cron Job",
    text: "Node.js Cron Job Email Demo Test from Reflectoring Blog",
  };

  // sending email
  mailTransporter.sendMail(mailDetails, function (err, data) {
    if (err) {
      console.log("error occurred", err.message);
    } else {
      console.log("---------------------");
      console.log("email sent successfully");
    }
  });
}

app.listen(3000, () => {
  console.log("application listening.....");
});

```
In the above code we are using the `node-mailer` and `node-cron` modules we have installed earlier. The `node-mailer` dependency allows us to send e-mails from our Node.js application using any email service of our choice.

With the expression `1 * * * *`, we scheduled our mail to be sent once every minute using Gmail.

Run the script `node index.js` and you'll get the following output:

`output:`
```
application listening.....
---------------------
email sent successfully
```
Check your inbox to confirm the email is sent.

### 3. Monitoring Server Resources Over Time
Cron jobs can be used to schedule logging tasks and monitor server resources in our Node.js applications. Let's say something happened, like a network delay or a warning message. We can schedule a cron job to log at a specific time or interval to track our server status. This can act as an automatic monitoring over time.

In this section, we will log the application's server resources in `csv` format. This makes our log data more machine-readable. The generated `.csv` file can be imported into a spreadsheet to create graphs for more advanced use cases.

Insert the following code into the `index.js` file to generate the `.csv` file at the scheduled time:
```javascript
const process = require("process");
const fs = require("fs");
const os = require("os");
const cron = require("node-cron");
const express = require("express");

app = express();

// setting a cron job for every 15 seconds
cron.schedule("*/15 * * * * *", function () {
  let heap = process.memoryUsage().heapUsed / 1024 / 1024;
  let date = new Date().toISOString();
  const freeMemory = Math.round((os.freemem() * 100) / os.totalmem()) + "%";

  //                 date | heap used | free memory
  let csv = `${date}, ${heap}, ${freeMemory}\n`;

  // storing log In .csv file
  fs.appendFile("demo.csv", csv, function (err) {
    if (err) throw err;
    console.log("server details logged!");
  });
});

app.listen(3000, () => {
  console.log("application listening.....");
});
```
In the code block above, we are using the Node.js `fs` module. `fs` enables interaction with the file system allowing us to create a log file.

The `OS` module gives access to the application's Operating System (OS) and the `process` module, provides details about, the current Node.js process. 

We are using the method  `process.heapUsed` . The `heapUsed` refer to V8's memory use by our application. And `os.freemem()` shows available RAM, `os.totalmem()` show entire memory capacity.

The log is saved in `.csv` format, with the date/time in the first column, memory usage in the second, and the memory available in the third. These data are recorded and saved in a generated `demo.csv` file at 15-second intervals.

Run the script: `node index.js`

Allow your application to run, we will notice a file named `demo.csv` is generated with content similar to the following:

```csv
2022-08-31T00:19:45.912Z, 8.495856, 10%
2022-08-31T00:20:00.027Z, 7.083216, 10%
2022-08-31T00:20:15.133Z, 7.139864, 9%
2022-08-31T00:20:30.219Z, 7.188568, 12%
2022-08-31T00:20:45.414Z, 7.23724, 11%
```

### 4. Deleting / Refreshing a Log File
Consider a scenario where we are working with a large application that records the status of all activity in the log file. The log status file would eventually grow large and out of date. we can routinely delete the log file from the server. For instance, we could routinely delete the log status file using a job scheduler on the 25th of every month.

In this example, we will be deleting the log status file that was previously created:
```javascript
const express = require("express");
const cron = require("node-cron");
const fs = require("fs");

app = express();

// remove the demo.csv file every twenty-first day of the month.
cron.schedule("0 0 25 * *", function () {
  console.log("---------------------");
  console.log("deleting logged status");
  fs.unlink("./demo.csv", err => {
    if (err) throw err;
    console.log("deleted successfully");
  });
});

app.listen(3000, () => {
  console.log("application listening.....");
});
```

Notice the pattern used: `0 0 25 * *`.

- minutes and hours as `0` and `0` (“00:00” - the start of the day).
- specific day of the month as `25`.
- month or day of the week isn't defined.

Now, run the script: `node index.js`

On the 25th of every month, your log status will be deleted with:

`output:`
```
application listening.....
---------------------
log status deleting
deleted successfully
```
Switch cron expression to a shorter time interval - like every minute. To verify the task is been executed.

Checking the application directory. we will notice the demo.csv file has been deleted.

## Conclusion
This article uses various examples to demonstrate how to schedule tasks on the Node.js server and the concept of using the `node-cron` schedule method to automate and schedule repetitive or future tasks. we can use this idea in both current and upcoming projects. The source code for each example can be found [here](https://github.com/thombergs/code-examples/tree/master/nodejs/job-scheduler).

There are other job scheduler tools accessible to node.js applications such as node-schedule, Agenda, Bree, Cron, and Bull. Be sure to assess each one to find the best fit for your specific project.
