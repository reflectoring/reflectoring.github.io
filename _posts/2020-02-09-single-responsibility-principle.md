This article explains the Single Responsibility Principle (SRP): what does it practically mean, when and how to apply it.

### What does Single Responsibility Principle say?
Single Responsibility Principle may feel a bit vague at first. Let's try to deconstruct it and look at what does it actually mean.

Single Responsibility Principle applies to the software that we develop on different levels: to methods, classes, module, and services (collectively, I'll call all these things *components* later in this article). So, on each level, we can phrase the principle like the following:

 - Each method (function) should have a single responsibility.
 - Each class (object) should have a single responsibility.
 - Each module (subsystem) should have a single responsibility.
 - Each service should have a single responsibility.

These phrases are now more concrete, but they still don't explain what a *responsibility* is and *how small or large a responsibility should be* for each particular method, class, module, or service.

#### Types of responsibilities
Instead of defining a *responsibility* in abstract terms, it may be more intuitive to list the actual types of responsibilities. Here are some examples:

1. **Business logic**, for example, extracting a phone number from text, converting XML document into JSON, or classifying a money transaction as fraud. On the level of methods, such a responsibility presents itself as a single time the logic is applied, for example, extract a phone number from one given text. On the level of classes and above, it's *knowing how to do* (or encapsulating) the business function: for example, a class knowing how to convert XML documents into JSON, or a service encapsulating the detection of fraud transactions.
2. **External integration.** On the lowest level, this can be an integration between modules within the application, such as putting a message into a `Queue` which is processed by another subsystem. Then, there are integrations with the system, such as logging or checking the system time (`System.currentTimeMillis`). Finally, there are integrations with external systems, such as database transactions, reading from or writing to a distributed message queue such as Kafka, or RPC calls to other services. On the level of methods, these responsibilities present themselves as a single transaction with the external part: for example, put a single message into a queue. On the level of classes, modules, and services, it's *knowing how to integrate* (or encapsulating integration with) the external part: for example, a class knowing how to read the system time (which is exactly what [`java.time.Clock`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/time/Clock.html) is), or a service encapsulating talking with an external API.
3. **Data**: a profile of a person on a website, a JSON document, a message. Obviously, embodying a piece of data could only be a responsibility of a class (object), but not of a method, module, or service. A specific kind of data is **configuration**: a collection of parameters for some other method, class, or system.
4. A piece of application's **control flow, execution, or data flow** model.  One example are methods that glue together calls to other methods:
    ```
    void processTransaction(Transaction t) {
      if (isFraud(t)) { // Business logic
        // External integration: logging
        logger.info("Detected fraud transaction {}", t);
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

(These types are derived from Adam Warski's classification of objects in applications which he coined in his thought-provoking post about [dependency injection in Scala](https://blog.softwaremill.com/zio-environment-meets-constructor-based-dependency-injection-6a13de6e000).)

#### How small or large a responsibility should be?
I hope the examples above gave you some grounded sense of what a responsibility of a method, class, module, or service could be. However, they still provide no actionable guidance on how to finely you should chop responsibilities between the components of your system. For example:

 - Should conversion from XML to JSON be a responsibility of a single method (or a class), or it should be split between two methods: one translates XML into a tree, and another serializes a tree into JSON? Or these should be separate methods belonging to a single class?
 - Should individual types of interactions with an external service (such as different RPC operations) be responsibilities of separate classes,  or they should all belong to a single class? Or, perhaps, interactions should be grouped, such as read operations going to one class and write operations going to another?
 - How small parts of control flow should be encapsulated in individual methods?
 - What kinds of responsibilities should be split between different (micro)services?
