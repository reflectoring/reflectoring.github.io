---

title: "5 Good Reasons to Use a Log Server"
categories: [architecture]
modified: 2018-08-13
last_modified_at: 2018-08-13
author: tom
tags: [transparency, logging, log, server]
comments: true
ads: true
excerpt: "Logging to files and analyzing them by hand is not the way to go anymore.
          This article explains the reasons why a log server is the way to go
          for collecting and analyzing log data."
sidebar:
  nav: logging
  toc: true
---

{% include sidebar_right %}

Logging to files and analyzing them by hand is not the way to go anymore.
This article explains the reasons why a log server is the way to go
for collecting and analyzing log data.

## A Motivating Story

Imagine we have successfully released our application, which is happily serving real users. But there's this bug that
prevents users from finishing an important use case under certain conditions. If we only knew which conditions lead
to the bug ... but that information should be available in the logs, right?

**Day 1:**  
Ok, let's write an e-mail to the ops people to request the logs from today! Wait, they're not allowed
to send us just any logs due to privacy concerns. We need to specify some filter for the data we need. 
Ok then, let's filter the logs by date (we only need today's logs) and by component (we suspect the bug in a certain
component). 

**Day 2:**  
The ops people get clearance for the log request and send us a log excerpt.
But, *damn*, the log excerpt doesn't help us. The component we suspected wasn't responsible for the bug after all. 
Let's widen the search to another component and try again... .

**Day n:**
We finally found the information we needed to fix the bug after playing e-mail ping pong with the ops people for n days.

**No need to say that this kind of turnaround makes fixing evasive bugs an unproductive task that no one really
wants to be involved in.**

Let's have a look at some reasons why a log server would help us in this situation.

## Reason #1: Centralization

The main reason for a log server is that the log data is being centralized with the log server as a single point of
entry. All other reasons mentioned in this article depend on the log data being centrally available.

In a distributed environment, every service simply
sends its log events to the log server where it is aggregated and made available for log analysis. No need for
ops people to semi-automatically gather log files from across all services. 

**Log aggregation, filtering, searching, monitoring and alerting are done at a single place**. A straight forward
implementation of the [DRY principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself).    

**Even for a monolithic application, centralized log data is a great benefit**. 

One might argue that log data
in a monolithic application is already centralized, since we have only this one application. But it's very likely that we have
multiple instances of the application running for scalability and availability so that the same arguments apply as for
distributed environments.

## Reason #2: Searchability

Searching through log files is no fun. 

Really, it sucks. 

Even when we have mastered *awk*, *sed* and *grep* to filter and transform log data into a form
that is more helpful for the task at hand.

**A main feature of log servers is to provide search capabilities across the collected log data**. To trace a bug reported
by a user, we can simply type in the correlation id that was shown on the user's screen and voilá, we will probably
see an error message in the log that allows us to analyze the bug (of course we have implemented a correlation id mechanism).

OK, we can do this with *grep* just as well, provided we can *grep* across distributed log files.

But how about this: we want to see all log events across all threads in all services that were involved in
processing a certain asynchronous message to trace that message through the distributed system.

This is easy for a log server, since

* it has **access to the log events of all services**
* it can **index and efficiently search structured data** appended to the log events, such as a trace id.  

With clever use of such [structured log data](/structured-log-data) for providing [context information](/logging-context),
we can make the data flow through our application easily visible.

## Reason #3: Accessability

Every developer should have access to the logs. 

This should be a fundamental right for software developers.

Looking through the logs regularly makes our relationship to the application much more intimate, and we learn to read
her little aches and pains and get better in soothing them.

A log server is way more easily accessible than logging on a host per SSH and grepping the log files because:

* it's just plain **easier to fire up a browser and log in to a log server logging onto a host with SSH**
* in today's containerized world **we might not even know the address to the SSH host** we're looking for   
* **not every developer has enough unix skills** to use *grep* and consorts efficiently to sift through log files (shame on them!).

**Now, our organization's privacy agent might get a heart attack when confronted with our request to grant production
log access to all developers**. And he or she has a point.

Especially in the EU, data privacy is a big thing and after all we don't want break our users' trust.

The solution to this is to separate log data that contains personal data from technical log data. **The technical log
data should be available on the log server for analysis and bug fixing, while the personal log data may be stored
somewhere more private**. 

A separation of log data like this may take some planning in our security architecture 
and careful code reviews, but it's worth the effort when it means that we can access at least part of the production logs.

## Reason #4: Monitoring & Alerting

Especially in the early age of an application, right after going to production, we want to monitor it
like we would monitor an infant in the next room with a baby monitor.

Part of that monitoring is to check the log files for certain kinds of messages. 

A log server usually provides functionality to automatically filter and visualize certain log messages on a dashboard.
**So, if we get anxious and want to know if the baby's still breathing, we can have a look at the dashboard an be at ease**.

Going further, some log events are urgent enough that they [should trigger an alarm](/logging-levels#alert--adapt).
This is less like a baby monitor and more like a heart rate alarm in a hospital's intensive care. 

This is another feature provided by most log servers. 

Again, **we have a central place where we can monitor our application's health and define rules for alerting**. All without
having to handle log files in any form.

## Reason #5: Minimal Effort

The most frequent excuse for not doing something, when we know we should, is: "*it costs too much*". 

In the best case we have planned the setup of a log server into the project backlog from day 1 (who doesn't use a log server 
in a new project these days anyways?). Then, we can insist on setting up the log server by pointing to the backlog.

**If a log server hasn't been planned into the budget, we have to pitch it to the people responsible for the project budget.**
We usually don't bother with that, because we know the answer will be "no".

But will it really?

Setting up a log server is really nothing special. **We can have one running on our local machine in minutes**.

Yes, it has to be set up in all our test and production environments. But **with today's container technology this
shouldn't be much of a pain**. 

## Conclusion

Using a log server should be a default for the development and operation of most server applications. 

It's not hard to set up and brings a lot of advantages. If you're having trouble convincing the right people
to be allowed to use one, try to apply the above reasons in your argumentation.

Do you know other reasons why we should (or perhaps should not) use a log server? Let me know in the comments!
