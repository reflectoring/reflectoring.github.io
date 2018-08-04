---

title: Tip: Use a Human-Readable Logging Format
categories: [tips]
modified: 2018-07-30
author: tom
tags: [transparency, logging, log, format]
comments: true
ads: false
header:
  teaser: 
  image: 
---

Application logs are all about finding the right information in the least
amount of time. Automated log servers may help us in finding and filtering log messages. 
But in the end it's us - the humans - who have to be able to
interpret a log message. This article discusses how the format of a log
message helps us and what such a format should look like.

{% include further_reading nav="logging" %}

## Why Log Messages should be Human-Readable

In our digital age, one might argue that something like acting on a message
in an application log should be automated. 

But have you ever seen a system that automatically acts on ERROR messages
(other than just re-starting a service or alerting us humans that something is wrong, that is)?

It's nice when log messages are machine-readable so they can be automatically parsed and 
processed and refined. But **the ultimate goal of every automation around log messages
is to prepare the data in a way that makes it easy for us to understand it**.

So, why not format the log messages in a way that makes it easy for us
in the first place?

## What makes a Log Message Human-Readable?

A log message is human-readable in the definition of this article if the contained information
can be grasped completely at a glance. We don't want to look at a log message and first have to 
figure out what information it actually contains. 

Let's consider this log excerpt:
```
2018-07-29 21:10:29.178 thread-1 INFO com.example.MyService Service started in 3434 ms.
2018-07-29 21:10:29.178 main WARN some.external.Configuration parameter 'foo' is missing. Using default value 'bar'!
2018-07-29 21:10:29.178 scheduler ERROR com.example.jobs.ScheduledJob Scheduled job cancelled due to NullPointerException!
```

Now, we humans are extraordinarily good at recognizing patterns. That ability is maybe even the 
only thing that distinguishes us from machines. After all, we have to prove our humanness by solving
captchas every other day.

But what patterns do we see in the above log excerpt? We quickly grasp that each line starts with a date
followed by what is probably a thread name, the logging level and then our pattern recognition fails us.

Only on second or third glance do we see the pattern in the rest of each message. 
But wouldn't it be nice to grasp a log message at first glance?

Here's another example with the same content, only formatted differently:

```
2018-07-29 | 21:10:29.178 | thread-1  | INFO  | com.example.MyService         | Service started in 3434 ms.
2018-07-29 | 21:10:29.178 | main      | WARN  | some.external.Configuration   | Parameter 'foo' is missing. Using default value 'bar'!
2018-07-29 | 21:10:29.178 | scheduler | ERROR | com.example.jobs.ScheduledJob | Scheduled job cancelled due to NullPointerException!
... Stacktrace ...
```

We can clearly distinguish the different information blocks at a glance and know in which column to look for 
the information we're currently searching. 

That's pattern recognition on steroids. And it even makes the log easier to process for our machines.

## Which Information to Include

Let's keep in mind that we want to grasp a log message at first glance, so
there any single log message actually should not contain that much information.

Here's a list of the things that should definitely be included in any proper log message:

* **Date & Time should always be included** in any log message. We need it to correlate it
  with other events. 

* If we're building a multi-threaded application (which most of us probably do), **the thread name
  should be included**, because it allows us to quickly deduce information (e.g. "it happened
  in the scheduler thread, so it cannot have been triggered by an incoming user request").

* **The logging level must be included**. It's simply needed to quickly [sort messages into different buckets](/logging-levels) 
  by urgency, helping us to quickly filter the data.

* There should be some information available that tells us **where the log message
  comes from**. This is usually referred to as the "name" of a logger.
  
* An even quicker way to find the code responsible for a certain log message is to **include a 
  message ID** that is unique to each type of message. When we encounter such an ID in a log, we 
  can just do a full text search for this ID in the code base and be sure that it's the right spot. 
  
* There is **the message itself** that must be included. It contains the actual information whereas
  the other information is simply meta-data that helps us in sorting and filtering.
  
* Finally, if the log message is an error, **it should contain a stack trace** to help us find where the
  error occured.
  
Including any more information should we well thought-out, because it hinders our ability
to quickly grasp it. 

There's always the option to add more information to a log message that is not directly 
visible in its text representation (in the Java world, the mechanism used for this is called "Mapped Diagnostic Context").
This additional information may be visible at second glance in the search result of a log server, for example, but
that's a topic for another article.
 
## A Human-Readable Logging Format

With the information above, the final log format I propose is this: 

```
2018-07-29 | 21:10:29.178 | thread-1  | INFO  | com.example.MyService         | 000425 | Service started in 3434 ms.
2018-07-29 | 21:10:29.178 | main      | WARN  | some.external.Configuration   |        | Parameter 'foo' is missing. Using default value 'bar'!
2018-07-29 | 21:10:29.178 | scheduler | ERROR | com.example.jobs.ScheduledJob | 000972 | Scheduled job cancelled due to NullPointerException! 
... Stacktrace ...
```

* Each column is **separated by a distinct character** so it actually looks like a table.
* It includes **a unique message id** for quick reference within the code (`000425` and `000972`).
* Since third party libraries usually don't define a message id, **we still include the logger
  name** (e.g. `some.external.Configuration`) to be able to correlate the log message
  with the code of that library.
  
## What about Log Servers?

When using a log server, a log is no longer a text file, but a stream of searchable log events
each containing structured data rather than text. 
It might seem then that the textual structure of a log message isn't as important anymore. 

However, it's still good practice to provide a well-structured textual representation of log messages.
After all, when developing locally, we usually don't send our logs to a log server but to a local
text file.  

## Conclusion

Since we're primed for pattern recognition, we should provide clear patterns within our log messages.
This, and the fact that we only include the most important information, 
allows us to quickly grasp a message and save a lot of time analyzing logs.

The argument for a clearly-structured text representation of log messages loses a little
weight when using a log server, but it's still a good idea to provide a structured logging format
for those cases where the logs are still being written in a file (for example local development). 


