
This article explains the Single Responsibility Principle (SRP): what does it practically mean, when and how to apply it.

## What does Single Responsibility Principle say?
Single Responsibility Principle may feel a bit vague at first. Let's try to deconstruct it and look at what does it actually mean.

Single Responsibility Principle applies to the software that we develop on different levels: to methods, classes, modules, and services (collectively, I'll call all these things *components* later in this article). So, on each level, we can phrase the principle like the following:

 - Each method (function) should have a single responsibility.
 - Each class (object) should have a single responsibility.
 - Each module (subsystem) should have a single responsibility.
 - Each service should have a single responsibility.

These phrases are now more concrete, but they still don't explain what a *responsibility* is and *how small or large a responsibility should be* for each particular method, class, module, or service.

### Types of responsibilities
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

### How small or large a responsibility should be?
I hope the examples above give some more grounded sense of what a responsibility of a method, class, module, or service could be. However, they still provide no actionable guidance on how finely we should chop responsibilities between the components of your system. For example:

 - Should conversion from XML to JSON be a responsibility of a single method (or a class), or it should be split between two methods: one translates XML into a tree, and another serializes a tree into JSON? Or these should be separate methods belonging to a single class?
 - Should individual types of interactions with an external service (such as different RPC operations) be responsibilities of separate classes,  or they should all belong to a single class? Or, perhaps, interactions should be grouped, such as read operations going to one class and write operations going to another?
 - How should we split responsibilities across (micro)services?

Uncle Bob Martin (who first proposed Single Responsibility Principle) suggests that components should be broken down until each one has only one *reason to change*. However,  to me, this criterion still doesn't feel very instructive. Consider the `processTransaction` method above. There may be many reasons to change it:
 - Increment counters of normal and fraud transactions to gather statistics.
 - Enrich or reformat the logging statement.
 - Wrap sending an alert into error-handling `try-catch` and log a failure to send an alert.
 
Does this mean that `processTransaction` method is too large and we should split it further into smaller methods? According to Uncle Bob, [we probably should](https://sites.google.com/site/unclebobconsultingllc/one-thing-extract-till-you-drop), but many other people may think that `processTransaction` is already small enough.

Let's return to the purpose of using Single Responsibility Principle. Obviously, it's to improve the overall quality of the codebase and of its production behavior (Carlo Pescio calls these two domains [artifact space and runtime space](http://www.carlopescio.com/2010/06/notes-on-software-design-chapter-6.html), respectively).

So, what will utimately help us to apply Single Responsibility Principle effectively is **more clarity into how using the principle affects the quality of the code and the running application**. The optimal scope of the responsibility for a component highly depends on the context:
 - The responsibility itself (i. e. what does the component actually do)
 - The non-functional requirements to the application that we develop, or the given component
 - How long we plan to support the code in the future
 - How many people will work with this code
 - Etc.

However, this shouldn't intimidate us. **We should just split (or merge) components while we see that the software qualities in which we are interested keep improving.**

Thus, the next step is to analyze how Single Responsibility Principle affects the specific software qualities.

## The impact of Single Responsibility Principle on different software qualities

### Understandability and Learning Curve
**When we split responsibilities between smaller methods and classes, usually the system becomes easier to learn overall.** We can learn bite-sized components one at a time, iteratively. When we jump into a new codebase, we can learn fine-graned components as we need them, ignoring the internals of the other components which are not yet relevant for us.

If you have ever worked with code where Single Responsibility Principle was not regarded much, you probably remember the frustration when you  stumble upon a three hundred-line method or a thousand-line class about which you need to understand something, probably a little thing, but in order to figure that out you are forced to read through the whole method or the class. This not only takes a lot of time and mental energy, but also fills the "memory cache" of your brain with junk information that is completely irrelevant at the moment.

However, **it is possible to take the saparation of concerns so far that it might actually become harder to understand the logic.** Returning to the `processTransaction()` example, consider the following way of implementing it:

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
We extracted the observation part of the logic into a separate `TransactionInstrumentation` class. This approach is not unreasonable. Compared to the original version, it aids the *flexibility* and the *testability* of the code, as we will discuss below in this article. (In fact, I took the idea directly from the excellent article about [domain-oriented observability](https://martinfowler.com/articles/domain-oriented-observability.html) by Pete Hodgson.)

On the other hand, it smears the logic so thin across multiple classes and methods that it would take longer to learn it than the original, at least for me. [1]

Extracting responsibilities into separate modules or services (rather than just classes) doesn't help to further improve understandability per se, however it may help with other qualities related the learning curve: the *discoverability* of the functionality (for example, through service API discovery) and the *operability* of the system, which we will discuss below.

**Understandability itself is somewhat less important when we work on the code alone, rather than in a team.** But don't abuse this - we tend to underestimate how quickly we forget the details of the code on which we worked just a little while ago and how hard it could be to relearn them :)

### Flexibility
We can easily combine independent components (via separate *control flow* components) in different ways for different purposes, or depending on configuration. Let's take `TransactionProcessor` again:
```
class TransactionProcessor {
  private final AlertingService alertingService;

  ...
    
  void processTransaction(Transaction t) {
    if (isFraud(t)) {
      logger.log("Detected fraud transaction {}", t);
      alertingService.sendAlert(new FraudTransactionAlert(t));
    }
  }

  private boolean isFraud(Transaction t) { ... }
}
```
To allow the operators of the system to disable alerting, we can add a `NoOpAlertingService` and make it configurable for `TransactionProcessor` via dependency injection. On the other hand, if `sendAlert()` responsibility was not separated out into the `AlertingService` interface, but rather was just a method in `TransactionProcessor`, to make alerting configurable we would have to add a boolean field `sendAlerts` to the class.

Imagine now that we want to analyze historical transactions in a framework like Spark. Since `isFraud()` method (that is, the fraud detection responsibility) is a part of `TransactionProcessor`, we must use this class for batch processing. If online and batch processing require different initialization logic, it would go into different constructors of `TransactionProcessor`. On the other hand, if fraud detection was a sole concern of a separate `FraudDetection` class, that would prevent `TransactionProcessor` from swelling.

We can notice a pattern: **it is still possible to support different use cases and configuration for a component with multiple responsibilities, but only by increasing the size and the complexity of the component itself**, like adding flags and conditional logic. Little by little, this is how [big ball of mud](https://en.wikipedia.org/wiki/Big_ball_of_mud) systems (aka monoliths), and [runaway methods](https://michaelfeathers.typepad.com/michael_feathers_blog/2012/09/runaway-methods.html) and classes emerge. When each component has a single responsibility, we can keep the complexity of any single one of them limited.

What about the "lean" approach of splitting responsibilities only when we actually need to make them configurable? I think this is a good strategy, if applied with moderation. It is similar to the Martin Fowler's idea of [preparatory refactoring](https://www.martinfowler.com/articles/preparatory-refactoring-example.html). Keep in mind, however, that **if we don't keep responsibilities separate from early on, they may "fuse" into one another as the code evolves, so it might take much more effort to split them apart further down the road.** To do this, we might also need to spend time relearning the workings of the code in more detail than we would otherwise like to.

### Reusability

**When a component has a single, narrow responsibility, it's easier to reuse it.** `FraudDetection` class from the previous section is an example of this: we could reuse it in online processing and batch processing components. To do this in the *artifact space*, we could pull it into a shared library. Another direction is to move fraud detection into a separate microservice, which we can think about as reusability in the *runtime space*. The `FraudDetection` class within our application will then turn from having business logic responsibility to do external integration with the new service.

**Most methods with a narrow responsibility shouldn't have side effects and shouldn't depend on the state of the class**, which enables sharing and calling them from any place. In other words, Single Responsibility Principle nudges us toward [functional programming](https://en.wikipedia.org/wiki/Functional_programming) style.

***
Pro tip: thinking about responsibilities helps to notice [unrelated subproblems](https://learning.oreilly.com/library/view/the-art-of/9781449318482/ch10.html) hiding in our methods and classes. When we extract them, we can then see opportunities to reuse them in other places. Moving unrelated subproblems out of the way keeps a component at the [single level or abstraction](http://principles-wiki.net/principles:single_level_of_abstraction), which makes easier to understand the logic of the component.
***

### Testability

**It's easier to test methods and classes with focused, independent concerns.** This is what [Humble Object](http://xunitpatterns.com/Humble%20Object.html) pattern is all about. Let's continue playing with `TransactionProcessor`:
```
class TransactionProcessor {
    
  void processTransaction(Transaction t) {
    boolean isFraud;
    // logic detecting that the transaction is fraud, many
    // line of code omitted
    ...
    
    if (isFraud) {
      logger.log("Detected fraud transaction {}", t);
      alertingService.sendAlert(new FraudTransactionAlert(t));
    }
  }
}
```
In this variant, there is no separate `isFraud()` method. `processTransaction()` conflates the fraud detection and the reporting logic. Then, to test the fraud detection, we either need to mock the `alertingService`, which pollutes the test code with boilerplate, or to intercept and check the logging output, which is also cumbersome, and may also hinder our ability to execute tests in parallel.

It's simpler to test a separate `isFraud()` method. But we would still need to construct a `TransactionProcessor` object and to pass some dummy `Logger` and `AlertingService` objects into it. So it's still easier to test the variant with `FraudDetection` class. Notice that to test the intermediate version without separate `FraudDetection` class, we often find ourselves changing the visibility of the method under test (`isFraud()`, in this example) from private to default (package-private). **Use changing visibility of a method and `@VisibleForTesting` annotation as clues to think if we should split the responsibilities of the enclosing class.**

The article about domain-oriented observability referenced above also explains how extracting observability into a separate class (like `TransactionInstrumentation`) [enables clearer, more focused tests](https://martinfowler.com/articles/domain-oriented-observability.html#DomainProbesEnableCleanerMore-focusedTests).

[1] For code understandability, the crossing point might actually depend on  individual cognitive features of the developer: attention, the tendency to control things more tightly or more loosely, the habits of working with code. I suspect this may the crux of the debate around the Robert Martin's hard "[extract till you drop](https://sites.google.com/site/unclebobconsultingllc/one-thing-extract-till-you-drop)" recommendation.
