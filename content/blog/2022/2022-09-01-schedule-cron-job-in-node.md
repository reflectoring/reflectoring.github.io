---
title: "Schedule Job On Node.js"
categories: ["Node"]
date: 2022-08-25 00:00:00 +1100
authors: ["ajibade"]
description: "Quick guide to scheduling cron jobs in Node.js applications"
image: images/stock/0031-matrix-1200x628-branded.jpg
url: schedule-cron-job-in-node
---

Have you ever wanted to perform a specific task on your application server at specific times without physically running them yourself? Or you'd rather spend your time on more important tasks than remember to periodically clear or move data from one part of the server to another. Cron Job schedulers can be used to achieve this easily.

Cron job scheduling is a common practice in modern applications; it provides a level of autonomy in our applications. Cron is a [daemon](https://en.wikipedia.org/wiki/Daemon_(computing)), which means that it only needs to be started once, and will 
lay dormant until it is required. Another example of a deamon is the web server. The web server remains idle until a request for a web page is made. 

## Using Node Cron in Node.Js
In this article, we'll use the [node-cron](https://www.npmjs.com/package/node-cron) library to schedule cron jobs in node.js and build several demo applications. Node-cron is a node module that is made available by npm.

To schedule jobs using `node-cron`, you need to invoke the cron `.schedule` method.

Now let's look at how to use the node-cron `.schedule` method and it's syntax:  

### Cron Schedule Method Syntax
```
cron.schedule(expression , function, options);
```
As shown above, the cron `.schedule` method takes in three arguments where :

#### Cron Expression
This is the first argument of the cron `.schedule` method, it is also known as crontab. This expression is used to specify when a cron job is to be executed. The cron expression used here can be represented using Asterix (*),  which are wildcard characters representing the scheduled time for cron jobs.

The cron expression by default will be in the format `* * * * * *`.

Here's a quick reference to the cron expression, Indicating what each asterisks represents.
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
You can replace each asterisk with an appropriate number (or character) such that the expression describes the time the job will be executed.

Cron expression has some special characters like:
- `*` Asterisk operator this is a wildcard and acts as a placeholder. It means a value or always. Eg. If the asterisk symbol is in the month field, it means performing these specified tasks every month.
- `,` The comma operator allows you to specify a list of values for repetition. Eg. If you have `1, 3, 5` in the `month field`, the task will run on days of `month 1, 3, and 5`.
- `-` The hyphen operator allows you to specify a range of values. Eg. If you have 1-5 in the `Day of the week field`, the task will run every weekday (From Monday to Friday).
- `/` The slash operator allows you to specify values that will be repeated over a certain interval between them. Eg. if you have */4 in the Hour field, It means the action will be performed every 4 hours.

Each field can have one or more values separated by commas, or a range of values separated by hyphens.

If you're unsure about manually writing cron syntax, you can, use free tools like [Crontab Generator](https://crontab-generator.org/) or [Crontab.guru](https://crontab.guru/#*_*_*_*_*) to generate the exact time date you want for your cron expression.

#### Cron Function
This is the second argument of the cron `.schedule` method. It is a function or task executed at intervals, when the time specified in your cron expression is reached.

You can do whatever you want in this function. You can send an email, make a database backup, or download data. This function gets executed when the current system time is the same as the time provided in the first argument.

#### Cron Options
The cron options this is the third argument of the  cron `.schedule` method, this argument is optional. It is used to add additional options to our scheduled jobs. Cron Options are configuration object.

Here is an example of what cron options object looks like.
```javascript
{
   scheduled: false,
   timezone: "America/Sao_Paulo"
}
```
the scheduled option here is a boolean to indicate whether the task created is scheduled (default is true).

while the timezone option can be used to provide consistency in your scheduled jobs, by forcing them to adhere to a specific timezone or area.

## Setting up Your Node.Js Application
Installing dependencies and creating our node application.

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
Run the command below to initialize the project. This will generate a `package.json` file which can be used to keep track of all dependencies installed in our project.
```
npm init -y
```

Next, we will install `node-cron` and other modules used later in this article.
```
npm install node-cron node-mailer 
```
After installation, the dependencies can be required in our node applications

## What We Will Be Building
To demonstrate the functionality of the node-cron library, we will build `4` sample applications using node.js.

### 1. Scheduling a Simple Task with Node Cron.
Any task of your choosing can be automated and run at a specific time using cron job schedulers. In this section, we'll write a simple function that logs to the terminal at our specified time.

Input the following code into the `index.js` file to create our simple task scheduler:
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
  console.log("application listening.....");
});
```
In the code block above we are making a simple log to the application's terminal.

Run `node index.js` in the terminal.

`output`
```
application listening.....
---------------------
running a task every 15 second
```


### 2. Scheduling Email Using Node Cron
Emailing is a common feature of modern applications. Cron jobs can be used to accomplish this. For instance, a job schedule can be set to automatically send users an email each month with the most recent information from a blog or a product.

Here we are using google's email service provider `gmail`, if you have a Gmail account insert it in the code below to test out our newly created email scheduler.

Note: To use node-mailer with Gmail, you must first create an [app password](https://support.google.com/mail/answer/185833?hl=en-GB) for Gmail to allow third-party access.

Set up your Gmail app password following these steps:
- First head to your Gmail Account.
- Click on the profile image to the right
- Next click on `Manage your Google Account`, then click `Security`.
- In the `Signing in to Google` section select `App password` option.
- If the `App password` option is unavailable, set up 2-Step Verification for your account.
- Select the app (mail) and the current device you want to generate the app password for.
- Click Generate.
- Copy the generated 16-character code in the yellow bar on your device.

To create our email scheduler application Insert the following code into the `index.js` file:
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
      console.log("error occured", err.message);
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
In the above code we are using the node-mailer and node-cron dependencies we installed earlier. The `node-mailer` dependency gives us the feature of sending e-mails from our Node.js applications, using any email service of your choice.

We scheduled our mail to be sent at `At 1 minute` interval using Gmail.

Run the script `node index.js`

`output:`
```
application listening.....
---------------------
email sent successfully
```
Check your inbox to confirm the email is sent.

### 3. Monitoring Server Resources Over Time
Cron jobs can be used to schedule logging tasks and monitor server resources in our node.js applications. Let's say something happened, like a network delay or a warning message. We can schedule a cron job to log at a specific time or interval to track our server status, this can act as an automatic monitor over time.

In this section, we will log the application's server resources in `csv` format, this makes our logged data more machine-readable. The generated `.csv` file can be imported into a spreadsheet to create graphs for more advanced use cases.

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
  let heap = process.memoryUsage().heapUsed / 1000000;
  let data = new Date().toISOString();
  const freeMemory = Math.round((os.freemem() * 100) / os.totalmem()) + "%";

  //                 date | heap used | free memory
  let csv = `${dataa}, ${heap}, ${freeMemory}\n`;

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
In the code block above, we are using the node.js `fs` module. `fs` enables interaction with the file system allowing us to create a log file, and the `OS` module gives access to the application's Operating System (OS) and the `process` module, provides details about, the current Node.js process. 

We are using the method  `process.heapUsed` . The `heapUsed` refer to V8's memory use by our application. And `os.freemem()` shows available RAM, `os.totalmem()` show entire memory capacity.

The log is saved in `.csv` format, with the date/time in the first column, memory usage in the second, and the memory available in the third. These data are recorded and saved in a generated `demo.csv` file at 15-second intervals.

Run the script: `node index.js`

Allow your application to run, you will notice a file named `demo.csv` is generated with content similar to the following:

```csv
2022-08-31T00:19:45.912Z, 8.495856, 10%
2022-08-31T00:20:00.027Z, 7.083216, 10%
2022-08-31T00:20:15.133Z, 7.139864, 9%
2022-08-31T00:20:30.219Z, 7.188568, 12%
2022-08-31T00:20:45.414Z, 7.23724, 11%
```

### 4. Deleting / Refreshing a Log File
Consider a scenario where we are working with a large application that records the status of all activity in the log file. The log status file would eventually grow large and out of date. You can routinely delete the log file from the server. For instance, we could routinely delete the log status file using a job scheduler on the 25th of every month.

In this example, you will be deleting the log status file that was previously created:
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

Checking the application directory. You will notice the logstatus.txt file has been deleted.

## Conclusion
This article demonstrates how to schedule tasks on the Node.js server using node-cron, and the concept of using node-cron jobs to automate and schedule repetitive or future tasks. You can use this idea in both current and upcoming projects.

There are other job scheduler tools accessible to node.js applications such as node-schedule, Agenda, Bree, Cron, and Bull. Be sure to assess each one to find the best fit for your specific project.