---
title: "Schedule Job On Node.js"
categories: ["Node"]
date: 2022-08-25 00:00:00 +1100
authors: ["ajibade"]
description: "Quick guide to scheduling cron jobs in Node.js applications"
image: images/stock/0031-matrix-1200x628-branded.jpg
url: schedule-cron-job-in-node
---

Have you ever wanted to perform a specific task on your application server at specific times without physically running them yourself? Or you'd rather spend your time on more important tasks than remembering to periodically clear or move data from one part of the server to another. Cron Job schedulers can be used to achieve this easily.

Cron job scheduling is a common practice in applications; it provides a level of autonomy in our applications.

## Using node cron In node.Js
In this article, we'll use the [node-cron](https://www.npmjs.com/package/node-cron) library to schedule cron jobs in a Node.js application.

Cron is a [daemon](https://en.wikipedia.org/wiki/Daemon_(computing)), which means that it only needs to be started once, and will 
lay dormant until it is required. Another example of deamon is the web server, it remains idle until a request for a web page is made. The cron daemon remains idle until the time specified in its configuration files, or crontabs is reached.


### Node cron syntax
```
cron.schedule(expression , function, options);
```
- **The first argument** passed to the node-cron syntax is a cron-expression (crontab). This expression is used to specify when a cron job is to be executed.

    The cron expression used here can be represented using Asterix  (*),  which are wildcard characters representing the scheduled time for cron jobs. The expression by default will be in the format `* * * * * *`.

Here's a quick reference to the cron expression, with asterisks indicating what each one represents.

```
 # ┌────────────── second (0 - 59) (optional)
 # │ ┌──────────── minute (0 - 59) 
 # │ │ ┌────────── hour (0 - 23)
 # │ │ │ ┌──────── day of the month (1 - 31)
 # │ │ │ │ ┌────── month (1 - 12)
 # │ │ │ │ │ ┌──── day of the week (0 - 6) (0 and 7 both represent Sunday)
 # │ │ │ │ │ │
 # │ │ │ │ │ │
 # *  * * * * *  command to execute
```
You can replace each asterisk with an appropriate number (or character) such that the expression describe the time the job will be executed.

The first field (second) is optional. Each field can have one or more values separated by commas, or a range of values separated by hyphens.

- `*` Asterisk operator this is a wildcard and acts as a placeholder. It means a value or always. Eg. If the asterisk symbol is in the month field, it means performing these specified tasks every month.
- `,` The comma operator allows you to specify a list of values for repetition. For example, If you have `1, 3, 5` in the `month field`, the task will run on days of `month 1, 3, and 5`.
- `-` The hyphen operator allows you to specify a range of values. If you have 1-5 in the `Day of the week field`, the task will run every weekday (From Monday to Friday).
- `/` The slash operator allows you to specify values that will be repeated over a certain interval between them. For example, if you have */4 in the Hour field, It means the action will be performed every 4 hours. 

A single asterisk means the specified job will run for every instance of that unit of time it represents. 

Eg. cron expressions are started with five asterisks `* * * * *` by default this means: 

Perform the specified task `at every minute`, `of every hour`, `of every day`, `of every month`, `and of every day of the week`.

If you're unsure about manually writing cron syntax, you can, use free tools like [Crontab Generator](https://crontab-generator.org/) or [Crontab.guru](https://crontab.guru/#*_*_*_*_*) to generate the exact time date you want for cron expression.

- **The second argument** specifies a function. This is the task that executes at intervals.  When the time specified in the first argument is reached, this function is called.

- **The third argument** is a configuration object for the scheduled jobs, which is optional.

#### The available options are:
- scheduled: boolean to indicate whether the task created is scheduled (default is true).
- timezone: because timezones differ depending on location, this option provides consistency in scheduled jobs by forcing them to adhere to a specific timezone or area.

## Setting up your Node.Js application
Installing dependencies and creating a node application.

To begin, open your terminal and create a new folder.
```
mkdir node-cron-demo
```

Next change into the new project's directory
```
cd node-cron-demo
```
You will need to create a file index.js here, this is where we'll be writing all our codes.
```
touch index.js
```
Now run the command below to initialize the project. This will generate a `package.json` file which you can use to keep track of all project dependencies.
```
npm init -y
```

Next, let's add node-cron and other modules used later in this post.
```
npm install node-cron node-mailer 
```

## What we will be building
To demonstrate the functionality of the node-cron library, we will build `4` sample applications.

### 1. Scheduling a simple task with node cron.
Any task of your choosing can be automated and run at a specific time using cron job schedulers. In this section, we'll write a simple function that logs to the terminal at the our specified time.

```javascript
const cron = require("node-cron");
const express = require("express");

const app = express();

cron.schedule("*/15 * * * * *", function () {
  console.log("---------------------");
  console.log("running a task every 15 seconds");
  //replace simple tasks
});

app.listen(3000, () => {
  console.log("Application Listening.....");
});
```
Run `node index.js` in the terminal.

`output`
```
Application Listening.....
---------------------
running a task every 15 second
```


### 2. Scheduling email using node cron
Emailing is a common feature of modern applications. Cron jobs can be used to accomplish this; for instance, a job schedule can be set to automatically send users an email each month with the most recent information from a blog or a product.

```javascript
const express = require("express");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
app = express();

//Send email after 1 minute
cron.schedule("1 * * * *", function () {
  mailService();
});

function mailService() {
  let mailTransporter = nodemailer.createTransport({
    service: "outlook",
    auth: {
      user: "<your-email>@gmail.com",
      pass: "***********",
    },
  });

  // Setting credentials
  let mailDetails = {
    from: "<your-email>@gmail.com",
    to: "<user-email>@gmail.com",
    subject: "Test Mail using Cron Job",
    text: "Node.js Cron Job Email Demo Test from Reflectoring Blog",
  };

  // Sending Email
  mailTransporter.sendMail(mailDetails, function (err, data) {
    if (err) {
      console.log("Error Occurs", err.message);
    } else {
      console.log("---------------------");
      console.log("Email sent successfully");
    }
  });
}

app.listen(3000, () => {
  console.log("Application Listening.....");
});

```
>**N:B** Gmail has stopped third-party access read [here](https://support.google.com/mail/answer/185833?hl=en-GB) on how to sign in using app passwords 

Now, run the script `node index.js`

*Output:*
```
Application Listening.....
---------------------
Email Sent Successfully
```


### 3. Writing to a log file
Cron jobs can be used to schedule logging tasks in a system. Let's say something happened, like a network delay or a warning message. To track server status, we can keep a log for a specific period of time.

```javascript
const cron = require("node-cron");
const express = require("express");
const fs = require("fs");

app = express();

// Setting a cron job for every 15 seconds
cron.schedule("*/15 * * * * *", function () {
  // Info to log
  let data = `${new Date().toUTCString()} 
                : Server is working\n`;

  // storing data to log
  fs.appendFile("logstatus.txt", data, function (err) {
    if (err) throw err;
    console.log("Status Logged!");
  });
});

app.listen(3000, () => {
  console.log("Application Listening.....");
});
```
Run the script: `node index.js`

Allow your application to run, you will notice a file named `logstatus.txt` is generated with content similar to the following:

```
Tue, 23 Aug 2022 21:36:15 GMT 
                : Server is working
Tue, 23 Aug 2022 21:36:30 GMT 
                : Server is working
Tue, 23 Aug 2022 21:36:45 GMT 
                : Server is working
```

### 4. Deleting / Refreshing A log file
Consider a scenario where we are working with a large application that records the status of all activity in the log file. The log status file would eventually grow large and out of date. You can routinely delete the log file from the server. For instance, we could routinely delete the log status file using a job scheduler on the 25th of every month.

In this example, you will be deleting the log status file that was previously created.

```javascript
const express = require("express");
const cron = require("node-cron");
const fs = require("fs");

app = express();

// Remove the error.log file every 25th day of the month.
cron.schedule("0 0 25 * *", function () {
  console.log("---------------------");
  console.log("Deleting Log Status");
  fs.unlink("./logstatus.txt", err => {
    if (err) throw err;
    console.log("Error file successfully deleted");
  });
});

app.listen(3000, () => {
  console.log("Application Listening.....");
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
Application Listening.....
---------------------
Running Cron Job
Error file successfully deleted
```

Switch cron expression to a shorter time interval - like every minute. To verify the task is been executed.

Checking the application directory. The logstatus.txt file has be deleted.

## Conclusion
This article demonstrates how to schedule tasks on a Node.js server using node-cron. The idea of consistently and predictably automating repetitive tasks using cron jobs to email users, record log status, and remove old records. You can use this idea in both your current and upcoming projects.

There are other job scheduler tools accessible to node.js applications such as node-schedule, Agenda, Bree, Cron, and Bull. Be sure to assess each one to find the best fit for your specific project.