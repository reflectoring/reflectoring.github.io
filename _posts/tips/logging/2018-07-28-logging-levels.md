---

title: "Tip: Use Logging Levels Consistently"
categories: [architecture]
modified: 2018-07-28
author: tom
tags: [transparency, logging, log, level]
comments: true
ads: true
header:
  teaser: /assets/images/posts/tips/logging-levels/logging-levels.jpg
  image: /assets/images/posts/tips/logging-levels/logging-levels.jpg
excerpt: "A guide to using which logging level in which logging situation."
sidebar:
  nav: logging
  toc: true
---



When searching for a bug, or just trying to get a feel for an application,
it helps a lot if we know which information we can expect
to find in the logs. But we will only know what to expect if we have followed a convention
while programming the log statements. This article describes the set of logging conventions
I have found useful while programming Java applications.

## Logging Levels

In this article, we will have a look at the most commonly used logging levels. By accident,
these are exactly the logging levels that [SLF4J](https://www.slf4j.org/) provides - the de-facto
standard logging framework in the java world: ERROR, WARN, INFO, DEBUG and TRACE.

Note that other logging frameworks have even more logging levels like FATAL or FINER, but the 
less logging levels we use, the easier it is to follow some conventions to use them 
consistently. Hence, we'll stick with the de-facto default logging levels.

## Why Logging Levels should be used consistently

Logging levels exist for a reason. They allow us to put a log message into one of several buckets, sorted
by urgency. This in turn allows us to filter the messages of a production log by the level of urgency.

Since urgent messages in a production log often mean that something is wrong and we're currently 
losing money because of that, this filter should be very important to us!

Now, imagine, we have found the instruction manual for building one of those big Lego figures and a truck load of
mixed Lego bricks on the attic. For each step in the manual we would have to sift through the bricks to find the ones
we need. How much easier would it be if they were sorted into actual buckets by color? 

The same is true for log messages. **If we mix urgent log messages with informational log messages in the same
bucket, we're not going to find the messages we're looking for** because they're drowned in others.

Let's have a look at when to put the log messages into which bucket.  

## ERROR

The ERROR level should only be used when the application really is in trouble. **Users are being affected
without having a way to work around the issue**. 

Someone must be alerted to fix it immediately, even if it's 
in the middle of the night. **There must be some kind of alerting in place for ERROR log events in the production
environment**.

Often, the only use for the ERROR level within a certain application is **when a valuable business 
use case cannot be completed** due to technical issues or a bug. 

Take care **not to use this logging level too generously** because that would add too much noise
to the logs and reduce the significance of a single ERROR event. You wouldn't want to be woken
in the middle of the night due to something that could have waited until the next morning, would you? 

## WARN

The WARN level should be used when **something bad happened, but the application still has the
chance to heal itself or the issue can wait a day or two** to be fixed. 

Like ERROR events, WARN events
should be attended to by a dev or ops person, so **there must be some kind
of alerting in place for the production environment**.

A concrete example for a WARN message is when **a system failed to connect to an
external resource but will try again automatically**. It might ultimately result in an ERROR log
message when the retry-mechanism also fails.

**The WARN level is the level that should be active in production systems by default**,
so that only WARN and ERROR messages are being reported, thus saving storage
capacity and performance. 

If storage and performance are not a problem and our log server provides good search 
capabilities we can actually report even INFO and DEBUG events and just filter them
out when we're only interested in the important stuff.

## INFO

The INFO level should be used to **document state changes in the application or some
entity within the application**. 

This information
can be helpful during development and sometimes even in production to track what is 
actually happening in the system. 

Concrete examples for using the INFO level are:

* the application has started with configuration parameter x having the value y
* a new entity (e.g. a user) has been created or changed its state 
* the state of a certain business process (e.g. an order) has changed from "open" to "processed"
* a regularly scheduled batch job has finished and processed z items.

## DEBUG

It's harder for to define what information to log on DEBUG level than defining it
for the other levels. 

In a nutshell, we want to **log any information that helps us 
identify what went wrong** on DEBUG level.

Concrete examples for using the DEBUG level are:

* error messages when an incoming HTTP request was malformed, 
  resulting in a 4xx HTTP status
* variable values in business logic.

The DEBUG level may be used more generously than the above levels, but the code 
should not be littered with DEBUG statements as it reduces readability and
pollutes the log.

## TRACE

Compared to DEBUG, it's pretty easy to define what to log on TRACE. As the name
suggests, we want to log **all information that helps us to trace the processing of 
an incoming request through our application**.

This includes:

* start or end of a method, possibly including the processing duration
* URLs of the endpoints of our application that have been called
* start and end of the processing of an incoming request or scheduled job.

## Alert & Adapt

Even with a convention in place, in a team of several developers we probably won't get the logging
level for all messages right the first time. 

There will be ERROR messages that should be WARN messages because nothing is
broken yet. And there will be errors hidden in INFO messages, giving us a
false sense of security.

**That's why there must be some kind of alerting on the WARN and ERROR levels
and someone responsible to act on it.**

Even in a pre-production environment, we want to know what is being reported
on WARN and ERROR in order to be able fix things before they
go into production. 

## Conclusion

The above conventions provide a first step towards searchable and understandable
log data that allows us to quickly find the information we need in a situation where each
second might cost us a lot of money.

To keep our conventions sharp, we should set up an alerting on WARN and ERROR messages
on a test environment and act on them by either adapting our conventions or changing
the level of a message. 

