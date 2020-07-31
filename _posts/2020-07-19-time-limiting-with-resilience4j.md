---
title: Implementing Tate Limiting with Resilience4j
categories: [java]
date: 2020-07-31 05:00:00 +1100
modified: 2020-07-31 05:00:00 +1100
author: saajan
excerpt: "Continuing the Resilience4j journey, this article on TimeLimiter shows when and how to use it to build resilient applications."
image:
  auto: 0073-broken
---

In this series so far, we have learned about Resilience4j and its Retry and RateLimiter modules. In this article, we will continue exploring Resilience4j with a look into its TimeLimiter module. We will find out what it does, when and how to use it, and also look at some examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/resilience4j/timelimiter" %}

## When to Use TimeLimiter?

TimeLimiter can be used to set a limit on how long we are willing to wait to get a result from a non-blocking, asynchronous remote operation. 





## Resilience4j TimeLimiter Concepts

There are two configurations we deal with when using `TimeLimiter`. `timeoutDuration` is the amount of time we are willing to wait for the operation to complete. Usually if the operation is taking too long, we would return an error or possibly some default value to our client. But the request that we made would still be running on a separate thread. We can cancel the operation by setting the `cancelRunningFuture` configuration. 

## Using the Resilience4j TimeLimiter Module

## TimeLimiter Events

## TimeLimiter Metrics

## Gotchas and Good Practices When Implementing Time Limiting

## Conclusion

You can play around with a complete application illustrating these ideas using the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/resilience4j/ratelimiter). 