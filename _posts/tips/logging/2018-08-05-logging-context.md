---

title: "Tip: Provide Contextual Information in Log Messages"
categories: [architecture]
modified: 2018-08-05
author: tom
tags: [transparency, logging, log, context]
comments: true
ads: true
excerpt: "A guide to which contextual information is helpful in which 
          logging situation."
sidebar:
  nav: logging
  toc: true
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

You can probably imagine my frustration. I had to guess what to change and then start the
"upload and tweak" cycle once again.

The log didn't answer any of my questions:

* the connection to *what URL* timed out?
* *how long* is the configured timeout?
* *which component* is responsible for setting the timeout?
* *which configuration parameter* can be adjusted to modify the timeout?

**Adding one or more of the context information snippets above would have helped me a lot
in finding out how to fix the problem**. 

In order to minimize frustration with our own code, let's have a look at some 
more typical cases where some contextual information can be of great help.

## "Not Found" Errors

There are always cases where something is requested by a client but our application
cannot serve it because it's not there.

If these "not found" errors are being logged, the log should contain:

* the parameters for the search query (often, this is the ID of an entity)
* the type of whatever was not found.

**Bad Example**:

```
User not found.
```

**Good Examples**:

```
User with ID '42' was not found.
No Contract found for client '42'.
```

## Exceptions

Logging Exceptions is a whole topic in itself, but we can identify some contextual
information that should be contained when logging an exception: 

* the data constellation that led to the exception
* the root exception (if any) that led to the exception.

**Bad Example**:

```
Registration failed.
```

**Good Examples**:

```
Registration failed because the user name 'superman42' is already taken.
Registration failed due to database error: 
  (stacktrace of root exception)
```

## Validation Errors

Input data from a user or an external system should usually be validated so that our application
can safely work with it.

If such a validation fails, it helps tremendously to add the following context information
to the log output:

* the use case during which validation failed
* the name of the field whose validation failed
* the reason why validation failed
* the value of the field that was responsible for the validation failure.

Also, we should make sure to include all validation errors in the log and not only
the first error.

Usually, the information above should not only be logged but included in the response so that the
client can directly see what went wrong. But even then, clients will ask questions, so 
we can be prepared by having set up good logging.

**Bad Examples**:
```
Validation failed.
Validation failed for field "name".
Validation failed: field must not be null.
```

**Good Examples**:
```
Registration failed: field "name" must not be null.
Registration failed due to the following reasons: 
  "age" must be a number; 
  "name" must not be null.
```

## Status Changes

When an entity from our application moves from one state into another, the following information can
help in a log message:

* the id of the affected entity
* the type of the affected entity
* the previous state of the entity
* the new state of the entity.

**Bad Examples**:
```
Status changed.
Status changed to "PROCESSED".
```

**Good Example**:
```
Status of Job "42" changed from "IN_PROGRESS" to "PROCESSED".
```

## Configuration Parameters

On application startup it can be of great help to print out the current configuration
of the application, including:

* the name of each configuration parameter
* the value of each configuration parameter
* the default fallback value if the parameter was not explicity set.

When a configuration parameter changes during the life time of the application
it should be logged just like a [status change](#status-changes). 

**Bad Example**:
```
Parameter "waitTime" has not been set.
Parameter "timeout" has been set.
```

**Good Examples**:
```
Parameter "waitTime" falls back to default value "5".
Parameter "timeout" set to "10". 
```

## Method Tracing

When we're tracing method invocations it should be self-evident to provide some contextual
information:

* the fully-qualified name of the method or job that is being traced
* the duration of the execution time, preferably in human-readable form (i.e. "3m 5s 354ms" instead of "185354ms")
* the values of method parameters (only if they have an impact on execution time).

Note that if the trace log is automatically processed to gather statistics about execution times,
it's obviously better to log the execution time in milliseconds instead of human-readable form. 

**Bad Example**:
```
Took 543ms to finish.
```
(Yes, I actually stumble over log messages like that in production code from time to time... .)

**Good Example**:
```
Method "FooBar.myMethod()" took "1s 345ms" to finish.
FooBar.myMethod() processed "432" records in "1s 345ms".
```

## Batch Jobs

Batch Jobs usually process a number of records in one way or another. Adding the following contextual information
to the log can help when analyzing them:

* the start time of the job
* the end time of the job
* the duration of the job  
* the number of records that have been touched by the job
* the number of records that have NOT been touched by the job and the reason why (i.e. because they don't match 
  the filter defined by the batch job
* the type of records that are being processed.
* the processing status of the job (waiting / in progress / processed)
* the success status of the job (success / failure)

**Bad Examples**:
```
Batch Job finished.
Batch Job "SendNewsletter" finished in 5123ms.
```

**Good Examples**:
```
Batch Job "SendNewsLetter" sent "3456" mails in "5s 123ms". 
  324 mails were not sent due to an invalid mail address.  
```


## What If the Contextual Information Is Not Passed into My Code?

There are times when we're actually thinking about adding contextual information
to a log message but the information we would like to add is not available to us
because it has not been passed into the method we're currently working on.

When the calling code is our responsibility, it's easy to fix, since **we can just
change the calling code to pass on the information we want to add to the log**.

One might argue that adding method parameters only to provide information
in log messages pollutes the code. Yes, it does. But the benefit is worth it!

Even if the calling code is outside of our own code base, we can do something:
talk to the team / project that owns the code. Perhaps they will change their
code accordingly.

## Conclusion

Adding some helpful contextual information to log messages is usually not 
a lot of effort, but it may even pay off to change some method
signatures to pass in contextual data just for logging.

Note that providing context information as [structured data](/structured-log-data) instead of just text
makes it even easier for us to find the information we're looking for.

Have you encountered cases that are not listed in this article? I would
like to hear about them and add them here!
