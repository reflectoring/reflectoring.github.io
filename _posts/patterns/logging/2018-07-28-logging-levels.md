---

title: Use Logging Levels Consistently
categories: [patterns]
modified: 2018-07-28
author: tom
tags: [transparency, logging, log, level]
comments: true
ads: false
header:
  teaser: /assets/images/posts/patterns/logging-levels/logging-levels.jpg
  image: /assets/images/posts/patterns/logging-levels/logging-levels.jpg
---

When searching for a bug, or just trying to get a feel for an application,
 it helps a lot if we know which information we can expect
to find in the logs. But we will only know what to expect if we have followed a convention
while programming the log statements. This article describes the set of logging conventions
I have found useful while programming Java applications.

### Logging Levels

In this article, we will have a look at the most commonly used logging levels. By accident,
these are exactly the logging levels that [SLF4J](https://www.slf4j.org/) provides - the de-facto
standard logging framework in the java world.

Note that other logging frameworks have even more logging levels like FATAL, but the less logging levels
we use, the easier it is to follow some conventions to use them consistently. Hence, we'll stick
with the de-facto default logging levels.

### ERROR

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

### WARN

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

### INFO

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

### DEBUG

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

### TRACE

Compared to DEBUG, it's pretty easy to define what to log on TRACE. As the name
suggests, we want to log **all information that helps us to trace the processing of 
an incoming request through our application**.

This includes:

* start or end of a method, possibly including the processing duration
* URLs of the endpoints of our application that have been called
* start and end of the processing of an incoming request or scheduled job.

### Alert & Adapt

**We won't get logging right if we don't have any kind of alerting on the WARN
and ERROR levels**. 

WARN and ERROR should trigger some kind of alert even in
a pre-production environment and someone should be responsible to act on them.
Maybe just to reconsider a log event and reduce it's level from WARN to INFO.  
