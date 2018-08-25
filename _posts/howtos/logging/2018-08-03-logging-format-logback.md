---

title: How to Configure a Human-Readable Logging Format with Logback and Descriptive Logger
categories: [howto, logging]
modified: 2018-08-11
last_modified_at: 2018-08-11
author: tom
tags: [transparency, logging, log, format]
comments: true
ads: false
header:
  teaser: 
  image: 
excerpt: "A guide to configuring Logback to use a human-readable logging format."
sidebar:
  nav: logging
  toc: true
---

{% include sidebar_right %}

In a [previous Tip](/logging-format), I proposed to use a human-readable logging format
so that we can quickly scan a log to find the information we need. This article
shows how to implement this logging format with the [Logback](https://logback.qos.ch/)
and [Descriptive Logger](https://github.com/thombergs/descriptive-logger) libraries.

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/logging" %}

## The Target Logging Format

The Logging format we want to achieve looks something like this:

```
2018-07-29 | 21:10:29.178 | thread-1  | INFO  | com.example.MyService         | 000425 | Service started in 3434 ms.
2018-07-29 | 21:10:29.178 | main      | WARN  | some.external.Configuration   |        | Parameter 'foo' is missing. Using default value 'bar'!
2018-07-29 | 21:10:29.178 | scheduler | ERROR | com.example.jobs.ScheduledJob | 000972 | Scheduled job cancelled due to NullPointerException! 
... Stacktrace ...
```

We have distinct columns so we can quickly scan the log messages for the information we need.
The columns contain the following information:

* the date
* the time
* the name of the thread
* the level of the log message
* the name of the logger
* the unique ID of the log message for quick reference of the log message in the code 
  (log messages from third party libraries won't have an ID, since we can't control it)
* the message itself
* potentially a stacktrace.

Let's look at how we can configure our application to create log messages that look like this.

## Adding a Unique ID to each Log Message

First, we need to collect all the information contained in the log messages. Every information except the
unique ID is pretty much default so we don't have to do anything to get it. 

But in order to add a unique ID to each log message, we have to provide such an ID. For this, we use the 
[Descriptive Logger](https://github.com/thombergs/descriptive-logger) library, a small wrapper on top
of SLF4J I created.

We need to add the following dependency to our build:

```groovy
dependencies {
    compile("io.reflectoring:descriptive-logger:1.0")
}
```

Descriptive Logger is a library that allows us to descriptively define log messages with the help annotations. 

For each 
associated set of log messages we create an interface annotated with `@DescriptiveLogger`:

```java
@DescriptiveLogger
public interface MyLogger {

  @LogMessage(level=Level.DEBUG, message="This is a DEBUG message.", id=14556)
  void logDebugMessage();

  @LogMessage(level=Level.INFO, message="This is an INFO message.", id=5456)
  void logInfoMessage();

  @LogMessage(level=Level.ERROR, 
    message="This is an ERROR message with a very long ID.", id=1548654)
  void logMessageWithLongId();

}
```

Each method annotated with `@LogMessage` defines a log message. Here's where we can also define the unique ID for each
message by setting the `id` field. This ID will be added to the Mapped Diagnostic Context (MDC) which we can later use 
when we're defining our Logging Pattern for Logback.

In our application code we let the `LoggerFactory` create an implementation of the above interface and simply
call the log methods to output the log messages:  

```java
public class LoggingFormatTest {

  private MyLogger logger = LoggerFactory.getLogger(MyLogger.class, 
    LoggingFormatTest.class);

  @Test
  public void testLogPattern(){
    Thread.currentThread().setName("very-long-thread-name");
    logger.logDebugMessage();
    Thread.currentThread().setName("short");
    logger.logInfoMessage();
    logger.logMessageWithLongId();
  }
}
```

In between the messages we change the thread name to test the log output with thread names of different lengths.

## Configuring the Logging Format with Logback

Now that we can create log output with all the information we need, we can configure logback with the desired logging format. 
The configuration is located in the file `logback.xml`:

```xml
<configuration>

  <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>%d{yyyy-MM-dd} | %d{HH:mm:ss.SSS} | %thread | %5p | %logger{25} | %12(ID: %8mdc{id}) | %m%n</pattern>
      <charset>utf8</charset>
    </encoder>
  </appender>

  <root level="DEBUG">
    <appender-ref ref="CONSOLE"/>
  </root>
</configuration>
```

Within the `<pattern>` xml tag, we define the logging format. The formats that have been used here can be looked up in the 
[Logback documentation](https://logback.qos.ch/manual/layouts.html).

However, if we try out this logging format, it will not be formatted properly:

```
2018-08-03 | 22:04:29.119 | main | DEBUG | o.s.a.f.JdkDynamicAopProxy | ID:          | Creating JDK dynamic proxy: target source is EmptyTargetSource: no target class, static
2018-08-03 | 22:04:29.133 | very-long-thread-name | DEBUG | i.r.l.LoggingFormatTest | ID:    14556 | This is a DEBUG message.
2018-08-03 | 22:04:29.133 | short |  INFO | i.r.l.LoggingFormatTest | ID:     5456 | This is an INFO message.
2018-08-03 | 22:04:29.133 | short | ERROR | i.r.l.LoggingFormatTest | ID:  1548654 | This is an ERROR message with a very long ID.
```

**The thread and logger name columns don't have the same width in each line**. 

To fix this, we could try to use Logback's padding feature, which allows us to pad a column with spaces up to a certain number
by adding `%<number>` before the format in question. This way, we could try `%20thread` instead of just `%thread` to pad the thread name
to 20 characters. 

**If the thread name is longer than these 20 characters, though, the column will overflow.**

So, we need some way to truncate the thread and logger names to a defined maximum of characters.

## Truncating Thread and Logger Names

Luckily, Logback provides an option to truncate fields.

If we change the patterns for thread and logger to `%-20.20thread` and `%-25.25logger{25}`, Logback will
pad the values with spaces if they are shorter than 20 or 25 characters and truncate them from the start
if they are longer than 20 or 25 characters.

The final pattern looks like this:
```xml
<pattern>%d{yyyy-MM-dd} | %d{HH:mm:ss.SSS} | %-20.20thread | %5p | %-25.25logger{25} | %12(ID: %8mdc{id}) | %m%n</pattern>
```

Now, if we run our logging code again, we have the output we wanted, **without any overflowing columns**:

```
2018-08-11 | 21:31:20.436 | main                 | DEBUG | .s.a.f.JdkDynamicAopProxy | ID:          | Creating JDK dynamic proxy: target source is EmptyTargetSource: no target class, static
2018-08-11 | 21:31:20.450 | ery-long-thread-name | DEBUG | i.r.l.LoggingFormatTest   | ID:    14556 | This is a DEBUG message.
2018-08-11 | 21:31:20.450 | short                |  INFO | i.r.l.LoggingFormatTest   | ID:     5456 | This is an INFO message.
2018-08-11 | 21:31:20.450 | short                | ERROR | i.r.l.LoggingFormatTest   | ID:  1548654 | This is an ERROR message with a very long ID.
```

Actually, the ID column may still overflow if we provide a very high ID number for a log message. However, an ID
should never be truncated and since we're controlling those IDs we can constrict them to a maximum number 
so that the column does not overflow.

## Have we Lost Information by Truncating?

One might argue that we mustn't truncate the logger or thread name since we're losing information.
But have we really lost information? 

How often do we need the full name of a logger or a thread? These cases are very rare, I would say. Most
of the times, it's enough to see the last 20 or so characters to know enough to act upon it.

Even if truncated, the information isn't really lost. It's still contained in the log events!

**If we're logging to a log server, the information will still be there.** It has just been removed from the 
string representation of the log message.

We might configure the above logging format for local development only. Here, a human-readable
logging format is most valuable, since we're probably logging to a file or console and not to a log server
like we're doing in production.

## Conclusion

Logback has to be tweaked a bit to provide a column-based logging format that allows for quick scanning,
but it can be done with a little customization. 

Using [Descriptive Logger](https://github.com/thombergs/descriptive-logger), we can easily add a unique
ID to each log message for quick reference into the code. 

The code used in this article is available on [github](https://github.com/thombergs/code-examples/tree/master/logging). 

 
