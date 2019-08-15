---

title: "3 Use Cases Where Structured Log Data Really Helps"
categories: [architecture]
modified: 2018-08-19
last_modified_at: 2018-08-19
author: tom
tags: [transparency, logging, log, structured]
comments: true
ads: true
excerpt: "Log data should contain more than just text. This article discusses some
          example use cases where adding structured properties to log events
          helps when debugging. Get inspired to use structured logging in your own use cases!"
sidebar:
  nav: logging
  toc: true
---

{% include sidebar_right %}

Log data should contain more than just text. This article discusses some
example use cases where adding structured properties to log events
helps when debugging. Get inspired to use structured logging in your own use cases!

## Logging is more than Text

The times when logging meant producing large and hard-to-search text files are over
since at least when software systems became more and more distributed and the need
for [log servers](/log-server) arose.

Log servers are capable of processing log events that contain more than text. We no longer
have a file containing text, but a stream of log events that is persisted in a structured
manner and made searchable along that structure.

Most log servers provide a way to add [context information](/logging-context) in the form of key/value pairs
to our log events (let's call them *properties*). This enables us to perform targeted searches 
for certain property values.

Many applications I see don't make use of this. Either because they're not using a log server, or
because the developers haven't seen the benefit of structured log data yet.

Let's have a look at a couple use cases in which structured log data makes a lot of sense.  

## Use Case #1: Trace ID

Especially in distributed systems, it's necessary to correlate log events over service boundaries. 

If a browser calls Service A and Service A in turn calls Service B to complete the request, 
we want all log events produced in that exchange to be assigned the same trace ID.

![Log Events across service calls](/assets/img/posts/tips/structured-log-data/browser-servicea-serviceb.jpg)

Now, we could just add the trace ID to the log text, like this (it's the hex value in the square brackets):

```
2018-08-19 15:31:29.189  INFO [903c472a08e5cda0] PROCESSING REQUEST...
``` 

And yes, a full-text search for `903c472a08e5cda0` would show us all log events associated with this
exchange.

But how much easier would it be for a log server when it received a property named `traceId` with each
log event? 

The log server could just store the values for this property in a certain index and when we ask it for
all log events with `traceId=903c472a08e5cda0`, **it could just look into that index instead of sifting 
through large amounts of text** to serve us some search results.

Modern tracing tools do exactly this, by the way. If you're interested in Tracing with Java and Spring,
read [my article on Spring Cloud Sleuth](/tracing-with-spring-cloud-sleuth).

## Use Case #2: Scheduled Jobs

Another use case where structured log data comes in handy is analyzing and bugfixing scheduled jobs.

A scheduled job is a piece of code that is triggered automatically when a certain time 
constraint has been met.

By definition, a scheduled job is not triggered by a human. This fact makes analyzing and fixing bugs
a little harder because no one was actually present when the job was executed.

All the more reason to provide some meaningful log events during the execution of 
a scheduled job.

Now, we could again just provide some [context information](/logging-context#batch-jobs) in text form:

```
Starting job 42.
Found 23 records to be processed by job 42.
Processed 23 records in job 42.
Job 42 finished with status 'SUCCESS'.

Starting job 4711.
Found 13 records to be processed by job 4711.
Processed 2 records in job 4711.
Job 4711 finished with status 'FAILURE'.
```

Imagine we want to answer these questions:

* which jobs finished in Status `SUCCESS` but have not processed all records that should have been processed?
* which jobs have finished in status `FAILURE` but have actually processed all records that should have been processed?
* how many records have not been processed by jobs that finished in status `FAILURE`?
* ...

I bet there are people out there who can produce some `sed`, `awk` and `grep` magic
on distributed log files that provides answers in a couple minutes... . 

But even if I *could* do that **I would rather type in queries like these into my log server's search field**:

* `job_status=SUCCESS and (job_records_processed < job_records_found)`
* `job_status=FAILURE and (job_records_processed = job_records_found)`
* `sum(job_records_found - job_records_processed) by job_status=FAILURE`
* ...

The query language for the above queries is fictitious, but it should prove the point.

So, **by providing just a few properties with each log event
we get searchable data that may even provide answers to questions
we don't have yet**.

## Use Case #3: Business Processes

At least as important as scheduled job are what I call "business processes".

A business process is a workflow within the system that has a certain state. Examples for such
processes are:

* checking out a shopping cart in a shop system
* handling the shipping of an order in a shop system
* publishing an article in a blogging system

Each of these processes lasts potentially longer than a browser session. Their state must be persisted
so that the workflow can be picked up in another session at a later time.

Such stateful processes are kind of hard to debug. If we set a breakpoint for remote debugging 
somewhere in this process, **we don't exactly know how the current state of the process came to be**. 

So, why not log some state information at each step of the process so that we can trace what happened
when? 

In any case, we should include a `process_id` in each log event so that we can group log events by 
the process they were emitted from. 

In the shopping cart example we could also add:

* **shopping_cart_size**: how many items are currently in the shopping cart?
* **shopping_cart_value**: what is the current value of all the items in the shopping cart?
* **shopping_cart_items**: which items are currently in the shopping cart?
* ...

In the blogging example we could also add:

* **article_size**: how long is the article (number of characters)? 
* **article_status**: what is the current status of the article (e.g. `DRAFT`, `REVIEW`, or `PUBLISHED`)
* **article_revision_number**: what is the current revision number of the article?
* ...

If all this information is logged, we could then ask our log server for all log events of a certain process and would get **a full history
of all the state properties we included**. This will very likely make debugging a lot easier.

## Conclusion

Structured log data can be applied to many use cases to make our lives easier when looking for bugs. 

Our logging framework should do most of the work, so **we actually only have to give some thought as to which
properties might help us and then add them to our log events**.

However, we need a [log server](/log-server) to make real use of structured log data.

Do you know any other use cases where structured log data helps? Let me know in the comments!  

