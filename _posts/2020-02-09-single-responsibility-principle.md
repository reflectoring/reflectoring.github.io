
This article explains the Single Responsibility Principle (SRP): what does it practically mean, when and how to apply it.

## What Does the Single Responsibility Principle Say?
The Single Responsibility Principle may feel a bit vague at first. Let's try to deconstruct it and look at what does it actually mean.

The Single Responsibility Principle applies to the software that we develop on different levels: methods, classes, modules, and services (collectively, I'll call all these things *components* later in this article). So, SRP states that each *component* should have a single responsibility.

This phrase is a little more concrete, but it still doesn't explain what a *responsibility* is and *how small or large a responsibility should be* for each particular method, class, module, or service.

### Types Of Responsibilities
Instead of defining a *responsibility* in abstract terms, it may be more intuitive to list the actual types of responsibilities. Here are some examples (they are derived from Adam Warski's classification of objects in applications which he coined in his thought-provoking post about [dependency injection in Scala](https://blog.softwaremill.com/zio-environment-meets-constructor-based-dependency-injection-6a13de6e000)):

1. **Business logic**, for example, extracting a phone number from text, converting XML document into JSON, or classifying a money transaction as fraud. On the level of classes and above, a business logic responsibility is *knowing how to do* (or encapsulating) the business function: for example, a class knowing how to convert XML documents into JSON, or a service encapsulating the detection of fraud transactions.

2. **External integration.** On the lowest level, this can be an integration between modules within the application, such as putting a message into a `Queue` which is processed by another subsystem. Then, there are integrations with the system, such as logging or checking the system time (`System.currentTimeMillis`). Finally, there are integrations with external systems, such as database transactions, reading from or writing to a distributed message queue such as Kafka, or RPC calls to other services.

On the level of classes, modules, and services, a external integration responsibility is *knowing how to integrate* (or encapsulating integration with) the external part: for example, a class knowing how to read the system time (which is exactly what [`java.time.Clock`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/time/Clock.html) is), or a service encapsulating talking with an external API.

3. **Data**: a profile of a person on a website, a JSON document, a message. Obviously, embodying a piece of data could only be a responsibility of a class (object), but not of a method, module, or service. A specific kind of data is **configuration**: a collection of parameters for some other method, class, or system.

4. A piece of application's **control flow, execution, or data flow**. An example of this responsibility is a method that orchestrates calls to components that each have other responsibilities:
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
    On the level of classes, an example of a data flow responsibility may be a `BufferedLogger` class which buffers logging statements in memory and manages a separate background thread that takes statements from the buffer and writes them to actual external logger:
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
   Method `writeStatementsInBackground()` itself has a control flow responsibility.
 
   In a distributed system, examples of services with a control or data flow responsibility could be a proxy, a load balancer, or a service transparently caching responses from or buffering requests to some other service.

### How Small Or Large a Responsibility Should Be?
I hope the examples above give some more grounded sense of what a responsibility of a method, class, module, or service could be. However, they still provide no actionable guidance on how finely we should chop responsibilities between the components of your system. For example:

 - Should conversion from XML to JSON be a responsibility of a single method (or a class), or should it be split between two methods: one translates XML into a tree, and another serializes a tree into JSON? Or should these be separate methods belonging to a single class?
 - Should individual types of interactions with an external service (such as different RPC operations) be responsibilities of separate classes,  or they should all belong to a single class? Or, perhaps, should interactions be grouped, such as read operations going to one class and write operations going to another?
 - How should we split responsibilities across (micro)services?

Uncle Bob Martin (who first proposed the Single Responsibility Principle) suggests that components should be broken down until each one has only one *reason to change*. However,  to me, this criterion still doesn't feel very instructive. Consider the `processTransaction` method above. There may be many reasons to change it:
 - Increment counters of normal and fraud transactions to gather statistics.
 - Enrich or reformat the logging statement.
 - Wrap sending an alert into error-handling `try-catch` and log a failure to send an alert.
 
Does this mean that the `processTransaction()` method is too large and we should split it further into smaller methods? According to Uncle Bob, [we probably should](https://sites.google.com/site/unclebobconsultingllc/one-thing-extract-till-you-drop), but many other people may think that `processTransaction` is already small enough.

Let's return to the purpose of using the Single Responsibility Principle. Obviously, it's to improve the overall quality of the codebase and of its production behavior (Carlo Pescio calls these two domains [artifact space and runtime space](http://www.carlopescio.com/2010/06/notes-on-software-design-chapter-6.html), respectively).

So, what will ultimately help us to apply the Single Responsibility Principle effectively is **making clearer for ourselves how SRP affects the quality of the code and the running application**. The optimal scope of the responsibility for a component highly depends on the context:
 - The responsibility itself (i. e. what does the component actually do)
 - The non-functional requirements to the application or the component we're developing
 - How long we plan to support the code in the future
 - How many people will work with this code
 - Etc.

However, this shouldn't intimidate us. **We should just split (or merge) components while we see that the software qualities in which we are interested keep improving.**

Thus, the next step is to analyze how the Single Responsibility Principle affects the specific software qualities.

## The Impact Of the Single Responsibility Principle On Different Software Qualities

### Understandability and Learning Curve
**When we split responsibilities between smaller methods and classes, usually the system becomes easier to learn overall.** We can learn bite-sized components one at a time, iteratively. When we jump into a new codebase, we can learn fine-grained components as we need them, ignoring the internals of the other components which are not yet relevant for us.

If you have ever worked with code in which the Single Responsibility Principle was not regarded much, you probably remember the frustration when you  stumble upon a three hundred-line method or a thousand-line class about which you need to understand something, probably a little thing, but in order to figure that out you are forced to read through the whole method or the class. This not only takes a lot of time and mental energy, but also fills the "memory cache" of your brain with junk information that is completely irrelevant at the moment.

However, **it is possible to take the separation of concerns so far that it might actually become harder to understand the logic.** Returning to the `processTransaction()` example, consider the following way of implementing it:

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

Extracting responsibilities into separate modules or services (rather than just classes) doesn't help to further improve understandability per se, however it may help with other qualities related the learning curve: the *discoverability* of the functionality (for example, through service API discovery) and the *observability* of the system, which we will discuss below.

Understandability itself is somewhat less important when we work on the code alone, rather than in a team. But don't abuse this - we tend to underestimate how quickly we forget the details of the code on which we worked just a little while ago and how hard it could be to relearn them :)

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
To allow the operators of the system to disable alerting, we can create a `NoOpAlertingService` and make it configurable for `TransactionProcessor` via dependency injection. On the other hand, if `sendAlert()` responsibility was not separated out into the `AlertingService` interface, but rather was just a method in `TransactionProcessor`, to make alerting configurable we would have to add a boolean field `sendAlerts` to the class.

Imagine now that we want to analyze historical transactions in a batch process. Since `isFraud()` method (that is, the fraud detection responsibility) is a part of `TransactionProcessor`, we must use this class for batch processing. If online and batch processing require different initialization logic, `TransactionProcessor` has to provide a different constructor for each use case. On the other hand, if fraud detection was a concern of a separate `FraudDetection` class, we could prevent `TransactionProcessor` from swelling.

We can notice a pattern: **it is still possible to support different use cases and configuration for a component with multiple responsibilities, but only by increasing the size and the complexity of the component itself**, like adding flags and conditional logic. Little by little, this is how [big ball of mud](https://en.wikipedia.org/wiki/Big_ball_of_mud) systems (aka monoliths), and [runaway methods](https://michaelfeathers.typepad.com/michael_feathers_blog/2012/09/runaway-methods.html) and classes emerge. When each component has a single responsibility, we can keep the complexity of any single one of them limited.

What about the "lean" approach of splitting responsibilities only when we actually need to make them configurable? I think this is a good strategy, if applied with moderation. It is similar to Martin Fowler's idea of [preparatory refactoring](https://www.martinfowler.com/articles/preparatory-refactoring-example.html). Keep in mind, however, that **if we don't keep responsibilities separate from early on, the code for them may grow to have many subtle interdependencies, so it might take much more effort to split them apart further down the road.** And to do this, we might also need to spend time relearning the workings of the code in more detail than we would like to.

### Reusability
**It becomes possible to reuse components when component when they have a single, narrow responsibility.** The `FraudDetection` class from the previous section is an example of this: we could reuse it in online processing *and* batch processing components. To do this in the *artifact space*, we could pull it into a shared library. Another direction is to move fraud detection into a separate microservice: we can think about this as reusability in the *runtime space*. The `FraudDetection` class within our application will then turn from having business logic responsibility to do external integration with the new service.

**Most methods with a narrow responsibility shouldn't have side effects and shouldn't depend on the state of the class**, which enables sharing and calling them from any place. In other words, the Single Responsibility Principle nudges us toward a  [functional programming](https://en.wikipedia.org/wiki/Functional_programming) style.

***
Pro tip: thinking about responsibilities helps to notice [unrelated subproblems](https://learning.oreilly.com/library/view/the-art-of/9781449318482/ch10.html) hiding in our methods and classes. When we extract them, we can then see opportunities to reuse them in other places. Moving unrelated subproblems out of the way keeps a component at the [single level or abstraction](http://principles-wiki.net/principles:single_level_of_abstraction), which makes easier to understand the logic of the component.
***

### Testability

**It's easier to write and maintain tests for methods and classes with focused, independent concerns.** This is what the [Humble Object](http://xunitpatterns.com/Humble%20Object.html) pattern is all about. Let's continue playing with `TransactionProcessor`:
```
class TransactionProcessor {
    
  void processTransaction(Transaction t) {
    boolean isFraud;
    // Some logic detecting that the transaction is fraud,
    // many lines of code omitted
    ...
    
    if (isFraud) {
      logger.log("Detected fraud transaction {}", t);
      alertingService.sendAlert(new FraudTransactionAlert(t));
    }
  }
}
```
In this variant, there is no separate `isFraud()` method. `processTransaction()` conflates the fraud detection and the reporting logic. Then, to test the fraud detection, we may need to mock the `alertingService`, which pollutes the test code with boilerplate. **Not only it takes effort to setup mocks in the first place, mock-based tests tend to break every time we change anything in the production code.** Such test become a permanent maintenance burden.

Alternatively, to test the fraud detection logic in the example above, we could intercept and check the logging output. However, this is also cumbersome, and it hinders the ability to execute tests in parallel.

It's simpler to test a separate `isFraud()` method. But we would still need to construct a `TransactionProcessor` object and to pass some dummy `Logger` and `AlertingService` objects into it. So it's even easier to test the variant with the `FraudDetection` class. Notice that to test the intermediate version without separate `FraudDetection` class, we often find ourselves changing the visibility of the method under test (`isFraud()`, in this example) from private to default (package-private). **Use changing visibility of a method and `@VisibleForTesting` annotation as clues to think about whether it's better to split the responsibilities of the enclosing class.**

Pete Hodgson also explains how extracting observability into a separate class (like `TransactionInstrumentation`) [enables clearer, more focused tests](https://martinfowler.com/articles/domain-oriented-observability.html#DomainProbesEnableCleanerMore-focusedTests).

In contrast to methods and classes, **smaller services complicate the local setup for integration testing.** [Docker Compose](https://docs.docker.com/compose/) is a godsend, but it doesn't solve the problem fully.

### Debuggability
When methods and classes are focused on a single concern, we can write equally focused tests for them. **If tests execute only a single production method or class, when they fail, we immediately know where the bug is, and thus we don't need to debug.** Sometimes, debugging may become a large portion of the development process: for example, Michael Malis [reports](https://malisper.me/how-to-improve-your-productivity-as-a-working-programmer/) that for him, it used to take as much as a quarter of the total time.

When we still have to debug, it helps to make the debugging loop shorter when we test isolated pieces of functionality and don't need to build a large graph of objects through dependency injection or to spin up a database in [Testcontainers](https://www.testcontainers.org/).

However, keep in mind that many bugs are due to one component incorrectly using another. [Mistakes happen exactly in the integration of real components](https://phauer.com/2019/focus-integration-tests-mock-based-tests/). So, **it's important to have *both* narrowly focused unit tests to quickly fix certain types of errors without lengthy debugging, and more integration-like tests to check that components use each other properly.**

### Observability and Operability
Similar to how we are able to quickly find bugs in methods and classes with a single concern, **we should also be able to quickly pinpoint performance problems because results of profiling become more informative**: we see the exact responsibilities of the culprit methods from the top of the profiler's output.

When components (not only methods and classes, but also modules and distributed services) are connected with queues (either in-memory, in-process `Queue`s, or distributed message brokers such as Kafka), we can easily monitor the sizes of the backlogs of the queues in the pipeline. Matt Welsh, the guy who proposed the [staged event-driven architecture](https://en.wikipedia.org/wiki/Staged_event-driven_architecture), regarded this observability of load and resource bottlenecks as [the most important contribution of SEDA](http://matt-welsh.blogspot.com/2010/07/retrospective-on-seda.html).

Decoupled services could be scaled up and down independently in response to the changing load, without overuse of resources. Within an application, we can control the distribution of CPU resources between method, class, and module responsibilities by sizing the corresponding thread pools. `ThreadPoolExecutor` even supports dynamic reconfiguration in runtime via [`setCorePoolSize()`]([https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html#setCorePoolSize(int)](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html#setCorePoolSize(int))) method.

**When microservices have focused responsibilities, it also helps to investigate incidents.** If we monitor the request success rates and health status of each service, and see that one service which connects to a particular database is failing or unavailable, we may assume that the root problem of lies in this database rather than any other part of the system.

However, despite of the advantages of finer-grained monitoring and scaling, **splitting responsibilities between smaller services generally increases the burden of operating the system.** Smaller services mean more work:
- Setting up and operating intermediate message queues (like Kafka) between the services.
 - DevOps: setting up and managing separate delivery pipelines, monitoring, configuration, machine and container images.
 - Deployment and orchestration: Kubernetes doesn't fully alleviate it.
 - To ensure [rollback safety](https://aws.amazon.com/builders-library/ensuring-rollback-safety-during-deployments/), the deployments should be multi-phase, shared state and messages sent between services should be versioned.

### Reliability
Reliability is the first software quality in the list that we mostly hurt, not aid when we split smaller responsibilities between the components. Although, if engineered properly, microservices can imporve availability: when one service is sick, others might still serve something for the users, the inherent [fallability of distributed systems](https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing) hits harder. Also, "if engineered properly" is an important caveat :)

Discussing the pros and cons of microservices is not the main goal of this article, but there are plenty of good materials on this topic, the reliability aspect in particular: [1](https://www.martinfowler.com/articles/microservice-trade-offs.html), [2](https://dwmkerr.com/the-death-of-microservice-madness-in-2018/), [3](https://developer.ibm.com/technologies/microservices/articles/challenges-and-benefits-of-the-microservice-architectural-style-part-1/).

### Code Size
Smaller responsibility of each component means that there are more components in total in the system.

Each method needs a signature declaration. Each class needs constructors, static factory methods, field declarations, and other ceremony. Each module needs a separate configuration class and a depedendency injection setup. Each service needs separate configuration files, startup scripts, CI/CD/orchestration infrastructure, and so on.

Therefore, **the more focused responsibilities of the components we make, the more code we will need to write.** This impacts the long-term maintainability much less than all the qualities discussed above: undertandability, flexibility, reusability, etc. However, it means that **it takes more time and effort to develop the first version of the application with finely separated responsibilites than with larger components**, especially if thorough testing is not the first priority as well.

### Performance
This shouldn't be a concern normally, but for the sake of completeness, we should note that a large number of smaller classes may impact the application startup time. [An entry in the Spring blog](https://spring.io/blog/2018/12/12/how-fast-is-spring) has a nice chart illustrating this:
![JVM startup vs. classes](https://docs.google.com/spreadsheets/d/e/2PACX-1vR8B4l5WkWf-9gZWmIYTkmBWM7YWf5bRg852OakrV0G2-vtfM_UkVNRC3cTVk1079HagnMVHYZnvbib/pubchart?oid=976086548&format=image)

Having lots of small methods taxes the application performance through method calls and returns. This is not a problem at hotspots thanks to [method inlining](https://www.baeldung.com/jvm-method-inlining), but in applications with a "flat" performance profile (no obvious hotspots) an excessive number of method calls might considerably affect the cumulative thoughput.

**The size of services might significantly impact the efficiency of the distributed system due to the costs of RPC calls and message serialization.**

## Summary
The Single Responsibility Principle applies to software components on all levels: methods, classes, modules, and distributed services.

The Single Responsibility Principle itself doesn't include guidance about how large or small a responsibility for a component should be. The optimal size depends on the specific component, the type of the application, the current development priorities, and other context.

We should analyze how making responsibilities of components smaller or larger affects the *qualities* of the code and the system that we are developing.

If we are writing proof-of-concept or throwaway code, or the relative cost of time to market / penalty for missing some deadline is super high, it's important to keep in mind that following the Single Responsibility Principle "properly" requires more effort and therefore may delay the delivery time.

In other cases, we should split up responsibilities into separate methods and classes as long as the flexibility, reusability, testability, debuggability, and observability of the software keep improving, and while the code doesn't bloat too much and we still see the "forest" of the logic behind the "trees" of small methods and classes (in more formal language, the understandability of the code doesn't begin to deteriorate).

This may sound overwhelming, but of course this analysis shouldn't be done for each and every method and class in separation, but instead done infrequently to establish a guideline on the project, or just to train our intuition.

On the level of the distributed system, the tradeoff is much less in favor of extracting (micro)services with more narrow responsibilities: discoverability, flexibility, reusability, and observability improves, but testability, operability, reliability, and performance mostly decline. On the other hand, Single Reponsibility Principle probably shouldn't be the first thing to consider when sizing microservices. Most people in the industry think that it's more important to follow the [team boundaries](https://martinfowler.com/articles/microservices.html#OrganizedAroundBusinessCapabilities), [bounded contexts](https://martinfowler.com/bliki/BoundedContext.html), and [aggregates](https://www.martinfowler.com/bliki/DDD_Aggregate.html) (the last two are concepts from Domain-Driven Design).


[1] For code understandability, the crossing point might actually depend on  individual cognitive features of the developer: attention, the tendency to control things more tightly or more loosely, the habits of working with code. I suspect this may the crux of the debate around the Robert Martin's hard "[extract till you drop](https://sites.google.com/site/unclebobconsultingllc/one-thing-extract-till-you-drop)" recommendation.
