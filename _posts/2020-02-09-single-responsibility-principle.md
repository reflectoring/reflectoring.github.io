This article explains the Single Responsibility Principle (SRP): what does it practically mean, when and how to apply it.

### What does Single Responsibility Principle say?
Single Responsibility Principle may feel a bit vague at first. Let's try to deconstruct it and look at what does it actually mean.

Single Responsibility Principle applies to the software that we develop on different levels: to methods, classes, modules, and services (collectively, I'll call all these things *components* later in this article). So, on each level, we can phrase the principle like the following:

 - Each method (function) should have a single responsibility.
 - Each class (object) should have a single responsibility.
 - Each module (subsystem) should have a single responsibility.
 - Each service should have a single responsibility.

These phrases are now more concrete, but they still don't explain what a *responsibility* is and *how small or large a responsibility should be* for each particular method, class, module, or service.

#### Types of responsibilities
Instead of defining a *responsibility* in abstract terms, it may be more intuitive to list the actual types of responsibilities. Here are some examples (they are derived from Adam Warski's classification of objects in applications which he coined in his thought-provoking post about [dependency injection in Scala](https://blog.softwaremill.com/zio-environment-meets-constructor-based-dependency-injection-6a13de6e000)):

1. **Business logic**, for example, extracting a phone number from text, converting XML document into JSON, or classifying a money transaction as fraud. On the level of methods, such a responsibility presents itself as a single time the logic is applied, for example, extract a phone number from one given text. On the level of classes and above, it's *knowing how to do* (or encapsulating) the business function: for example, a class knowing how to convert XML documents into JSON, or a service encapsulating the detection of fraud transactions.
2. **External integration.** On the lowest level, this can be an integration between modules within the application, such as putting a message into a `Queue` which is processed by another subsystem. Then, there are integrations with the system, such as logging or checking the system time (`System.currentTimeMillis`). Finally, there are integrations with external systems, such as database transactions, reading from or writing to a distributed message queue such as Kafka, or RPC calls to other services. On the level of methods, these responsibilities present themselves as a single transaction with the external part: for example, put a single message into a queue. On the level of classes, modules, and services, it's *knowing how to integrate* (or encapsulating integration with) the external part: for example, a class knowing how to read the system time (which is exactly what [`java.time.Clock`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/time/Clock.html) is), or a service encapsulating talking with an external API.
3. **Data**: a profile of a person on a website, a JSON document, a message. Obviously, embodying a piece of data could only be a responsibility of a class (object), but not of a method, module, or service. A specific kind of data is **configuration**: a collection of parameters for some other method, class, or system.
4. A piece of application's **control flow, execution, or data flow**.  One example are methods that glue together calls to other methods:
    ```
    void processTransaction(Transaction t) {
      if (isFraud(t)) { // Business logic
        // External integration: logging
        logger.log("Detected fraud transaction {}", t);
        // Integration with external service
        alertingService.sendAlert(new FraudTransactionAlert(t));
      }
    }
    ```
    Another example may be a `BufferedLogger` class which buffers logging statements in memory and manages a separate background thread that takes statements from the buffer and writes them to actual external logger:
    ```
    class BufferedLogger implements Logger {
      private final Logger delegate;
      private final ExecutorService backgroundWorker;
      private final BlockingQueue<Statement> buffer;

      BufferedLogger(Logger delegate) {
        this.delegate = delegate;
        this.backgroundWorker = newSingleThreadExecutor();
        this.buffer = new ArrayBlockingQueue<>(100);
        backgroundWorker.execute(this::writeStatementsInBackground);
      }
      
      @Override public void log(Statement s) {
        putUninterruptibly(buffer, s);
      }

      private void writeStatementsInBackground() {
        while (true) {
          Statement s = takeUninterruptibly(buffer);
          delegate.log(s);
        }
      }
    }
    ```
   `BufferedLogger` is an [active object](https://en.wikipedia.org/wiki/Active_object). Method `writeStatementsInBackground` itself has control flow responsibility.
 
   In a distributed system, examples of services with this type of responsibility could be a proxy, a load balancer, or a service transparently caching responses from or buffering requests to some other service.

#### How small or large a responsibility should be?
I hope the examples above give some more grounded sense of what a responsibility of a method, class, module, or service could be. However, they still provide no actionable guidance on how finely you should chop responsibilities between the components of your system. For example:

 - Should conversion from XML to JSON be a responsibility of a single method (or a class), or should it be split between two methods: one translates XML into a tree, and another serializes a tree into JSON? Or should these be separate methods belonging to a single class?
 - Should individual types of interactions with an external service (such as different RPC operations) be responsibilities of separate classes,  or they should all belong to a single class? Or, perhaps, should interactions be grouped, such as read operations going to one class and write operations going to another?
 - How small should the parts of a control flow should be encapsulated in individual methods?
 - What kinds of responsibilities should be split between different (micro)services?

Uncle Bob Martin (who first proposed Single Responsibility Principle) suggests that components should be broken down until each one has only one *reason to change*. However,  to me, this criterion still doesn't feel very instructive. Consider the `processTransaction()` method above. There may be many reasons to change it:
 - Add a counter to gather statistics of normal and fraud transactions.
 - Enrich or reformat the logging statement.
 - Add error handling that logs when `sendAlert()` throws an exception.
 
Does this mean that `processTransaction()` is too large and we should split it further into smaller methods? According to Uncle Bob, [we probably should](https://sites.google.com/site/unclebobconsultingllc/one-thing-extract-till-you-drop), but many other people may think that `processTransaction` is already small enough.

Let's return to the purpose of using Single Responsibility Principle. Obviously, it's to improve the overall quality of the codebase and of its production behavior (Carlo Pescio calls these [artifact space and run-time space](http://www.carlopescio.com/2010/06/notes-on-software-design-chapter-6.html), respectively).

So, what will ultimately help us to apply the Single Responsibility Principle effectively is **more clarity into how using the principle affects the quality of the code and the running application**. The optimal scope of the responsibility for a component highly depends on the context:
 - The responsibility itself (i. e. what does the component actually do)
 - The non-functional requirements to the application or the component we're developing
 - How long we plan to support the code in the future
 - How many people will work with this code
 - Etc.

However, this shouldn't intimidate us. **We should just split (or merge) components while we see that the certain software quality aspects keep improving.**

Thus, the next step is to analyze how the Single Responsibility Principle affects the specific software qualities.

### What software qualities does Single Responsibility Principle impact?

#### Understandability and Learning Curve
When we split responsibilities between smaller methods and classes, usually the system becomes easier to learn overall. We can learn bite-sized components one at a time, iteratively. When we jump into a new codebase, we can learn fine-grained components as we need them, ignoring the internals of the other components which are not yet relevant for us.

If you have ever worked with code where the Single Responsibility Principle was not regarded much, you probably remember the frustration when you stumble upon a three hundred-line method or a thousand-line class about which you need to understand something, probably a little thing, but in order to figure that out you are forced to read through the whole method or the class. This not only takes a lot of time and mental energy, but also fills the "memory cache" of your brain with junk information that is completely irrelevant at the moment.

It is possible, however, to take the separation of concerns so far that it might become harder to understand the logic. Returning to the `processTransaction()` example, consider the following way of implementing it:

```
class TransactionProcessor {
    private final TransactionInstrumentation instrumentation;
    
    ...
    
    void processTransaction(Transaction t) {
      if (isFraud(t)) {
        instrumentation.detectedFraud(t);
      }
    }
}

class TransactionInstrumentation {
  private final Logger logger;
  private final AlertingService alertingService;

  ...

  void detectedFraud(Transaction t) {
    logger.log("Detected fraud transaction {}", t);
    alertingService.sendAlert(new FraudTransactionAlert(t));
  }
}
```
This approach is not unreasonable. Compared to the original version, it aids the *flexibility* and the *testability* of the code, as we will discuss below in this article. (In fact, I took the idea directly from the excellent article about [domain-oriented observability](https://martinfowler.com/articles/domain-oriented-observability.html) by Pete Hodgson.)

On the other hand, it smears the logic so thin across multiple classes and methods that it would take longer to learn it than the original, at least for me. [1]

Extracting responsibilities into separate modules or services (rather than just classes) doesn't help to further improve understandability per se, however it may help with the *discoverability* of the functionality (for example, through service API discovery) and the *operability* of the system, which we will discuss below.

As a software quality, understandability itself is somewhat less important when we work on the code alone, rather than in a team. But don't abuse this - we tend to underestimate how quickly we forget the details of the code on which we worked just a little while ago and how hard it could be to relearn them :)


[1] For code understandability, the crossing point might actually depend on  individual cognitive features of the developer: attention, the tendency to control things more tightly or more loosely, the habits of working with code. I suspect this may the crux of the debate around the Robert Martin's hard "[extract till you drop](https://sites.google.com/site/unclebobconsultingllc/one-thing-extract-till-you-drop)" recommendation.
