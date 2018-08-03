---

title: Provide Context Information in Log Messages
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

Always think of what information would help me if I had to sift through the logs.

Caused by: java.net.SocketTimeoutException: connect timed out
        at java.net.PlainSocketImpl.socketConnect(Native Method) ~[na:1.8.0_171]
        at java.net.AbstractPlainSocketImpl.doConnect(AbstractPlainSocketImpl.java:350) ~[na:1.8.0_171]

# "Not Found" messages
provide the ID and the type

# Status changes
provide the previous status and the new status and the id of the changed entity

# Exceptions
provide a description of when it happened
provide information what entities were involved
provide the root cause

# Validation Errors
provide the field name and the reason
log them even if they don't go out to the client
log all errors, not only the first!

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
