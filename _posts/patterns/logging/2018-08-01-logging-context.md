---

title: "Tip: Provide Context Information in Log Messages"
categories: [tip, logging]
modified: 2018-07-28
author: tom
tags: [transparency, logging, log, context]
comments: true
ads: false
header:
  teaser: /assets/images/posts/patterns/logging-levels/logging-levels.jpg
  image: /assets/images/posts/patterns/logging-levels/logging-levels.jpg
---

Have you ever had a situation where you stared at en error message in a log 
and wondered "*how the hell is this supposed to help me?*". You probably have.
And you probably cursed whoever added that particular log message to the code base.
This tip provides some rules as to what context information should be contained
in a log message in which case.  

## A Motivating Story

I once tried to deploy a Java application to one of the big cloud providers.
The application should connect to a SQL database which was in the cloud
as well. 

After a lot of uploading the application, tweaking some configuration and
uploading it again, I finally got the application deployed...only to find 
out that it couldn't create 
the connection to the cloud database.

The root cause information I got from the log was this:

```
Caused by: java.net.SocketTimeoutException: connect timed out
        at java.net.PlainSocketImpl.socketConnect(Native Method) ~[na:1.8.0_171]
        at java.net.AbstractPlainSocketImpl.doConnect(AbstractPlainSocketImpl.java:350) ~[na:1.8.0_171]
```

You can probably imagine my frustration. The log didn't answer any of my questions:

* the connection to *what URL* timed out?
* *how long* is the configured timeout?
* *which component* is responsible for setting the timeout?
* *which configuration parameter* can be adjusted to modify the timeout?

Adding one or more of the context information above would have helped me a lot
in finding out how to fix the problem. 

In order to minimize frustration with our own code, let's have a look at some 
more typical cases where some contextual information can be of great help.

## Error Log Messages

Since error messages have the biggest potential for frustration, let's look at
them first. 

### "Not Found" Error

There are always cases where something is requested by a client but our application
cannot serve it because it's not there.

If these "not found" errors are being logged, the log should contain

* the query data (often, this is the ID of an entity)
* the type of whatever was not found

Examples:

```
User with ID '42' was not found.
No Contract found for client '42'.
```

# Exceptions
provide a description of when it happened
provide information what entities were involved
provide the root cause

# Validation Errors
provide the field name and the reason
log them even if they don't go out to the client
log all errors, not only the first!

## Informational Log Messages

# Status changes
provide the previous status and the new status and the id of the changed entity

# Configuration Parameters
log the initial configuration value
log changes to the configuration value (old value, new value)

# Tracing
provide the duration
provide the name of what is being measured

# Batch Jobs
log how many things have been touched

# Do I Have to pass around objects for logging purposes only?
Definitely! 
