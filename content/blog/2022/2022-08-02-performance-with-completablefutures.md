---
title: "How to use CompletableFuture for better performance during API calls"
categories: ["Java"]
date: 2022-02-08T11:00:00 
authors: [Bledi]
excerpt: "In this article we will see ho to increase the performance of our application using the class
CompletableFuture for remote API calls."
url: api-calls-performance-with-completable-future
---

# How to use CompletableFuture for better performance during API calls

## What is a Future ?

The _Future_ is a Java interface that was introduced in Java 5 to represent some value that will be available in a
second moment. The advantages of using it are enormous because we could do some very intensive computation
asynchronously without blocking the Thread that in the meantime can do some other useful job. We can think of it as
going to the restaurant. During the time that the chef is preparing our dinner, we can do other things, like talking to
friends or drinking a glass of wine and when in a second moment the chef has finished the preparation, we can finally
eat. Another advantage is that using the Future interface is much more friendly than working with Threads.

## CompletableFuture vs. Future

The Future interface comes with its limitations. Let's see the most important ones :

- We cannot complete manually the operation by providing a value
- We cannot combine one or more asynchronous operations
- There is no way to react to the completion of the asynchronous operation without blocking the thread by
  invoking [get](https://docs.oracle.com/javase/7/docs/api/java/util/concurrent/Future.html#get())
  method of the _Future_ interface

All the above limitations are made possible by the new class _CompletableFuture_ that was introduced with  
version 8 of Java. CompletableFuture implements both Future
and _[CompletionStage](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletionStage.html)_ interfaces.
Using this class we can now create a pipeline of asynchronous operations. Let's see a simple example of how to do it :

```java
class Demo {
    public static void main(String[] args) {

        CompletableFuture.supplyAsync(() -> "hello completable future")
                .thenApply(String::toUpperCase)
                .thenAccept(System.out::println);
    }

}
```

In the example above we can notice how simple is to create such a pipeline. We are firstly calling the `supplyAsync`
method which takes a `Supplier` and returns a new CompletableFuture, we are then transforming the result to uppercase
String by calling `thenApply` method and in the end, we just print the value on the console using `thenAccept` that
takes a Consumer as the argument. If we think for a moment, working with CompletableFuture is very similar to Java
Streams.

## Calling remote APIs without using CompletableFuture (Synchronously)

In this section we will build a simple application which given a list of bank transactions with call an external service
to categorize the transactions in base of their description. We will simulate the call of the external service by using
a method that adds some delay before returning the category of the transaction. In the next sections we will
incrementally change the implementation of our client application to improve the performance by using CompletableFuture.
Let's start implementing our categorization service that declares a method called `categorizeTransaction` :

```java
public class CategorizationService {

    public static Category categorizeTransaction(Transaction transaction) {
        delay();
        return new Category("Category_" + transaction.getId());
    }

    public static void delay() {
        try {
            Thread.sleep(1000L);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}

public class Category {
    private final String category;

    public Category(String category) {
        this.category = category;
    }

    @Override
    public String toString() {
        return "Category{" +
                "category='" + category + '\'' +
                '}';
    }
}

public class Transaction {
    private String id;
    private String description;

    public Transaction(String id, String description) {
        this.id = id;
        this.description = description;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
```

To test this implementation we will build a client application that tries to categorize three transactions, as follows :

```java
public class Demo {

    public static void main(String[] args) {
        long start = System.currentTimeMillis();
        var categories = Stream.of(
                        new Transaction("1", "description 1"),
                        new Transaction("2", "description 2"),
                        new Transaction("3", "description 3"))
                .map(CategorizationService::categorizeTransaction)
                .collect(Collectors.toList());
        long end = System.currentTimeMillis();

        System.out.printf("The operation took %s ms%n", end - start);
        System.out.println("Categories are: " + categories);
    }
}
```

After running the code, it prints on the console the total time taken to categorize the three transactions, and on my
machine it is saying :

```
The operation took 3039 ms
Categories are: [Category{category='Category_1'}, Category{category='Category_2'}, Category{category='Category_3'}]
```

The result is obvious because we are categorizing each transaction in sequence and the time needed to categorize one
transaction is one second. In the next section, we will try to refactor our client application using a parallel Stream.

## Using parallel Stream to categorize the transactions

Our client application now looks like :

```java
public class Demo {

    public static void main(String[] args) {
        long start = System.currentTimeMillis();
        var categories = Stream.of(
                        new Transaction("1", "description 1"),
                        new Transaction("2", "description 2"),
                        new Transaction("3", "description 3"))
                .parallel()
                .map(CategorizationService::categorizeTransaction)
                .collect(Collectors.toList());
        long end = System.currentTimeMillis();

        System.out.printf("The operation took %s ms%n", end - start);
        System.out.println("Categories are: " + categories);
    }
}
```

Is identical like before, apart from that here we are using parallel `Stream`. If we run this method now, it will print
the following output:

```
The operation took 1037 ms
Categories are: [Category{category='Category_1'}, Category{category='Category_2'}, Category{category='Category_3'}]
```

The difference is huge, now our application runs almost three times faster, but this is not the whole story. This
solution can scale until we reach the limit of the number of processors, after that the performance doesn't change
because internally the parallel Stream use a Thread pool that has a fixed number of threads that is equal to
`Runtime.getRuntime().availableProcessors()`. In my machine, I have 8 processors, so if we run the code above with ten
transactions it will take more than 2 seconds. The out is the following :

```
The operation took 2030 ms
Categories are: [Category{category='Category_1'}, Category{category='Category_2'}, Category{category='Category_3'}, 
Category{category='Category_4'}, Category{category='Category_5'}, Category{category='Category_6'}, 
Category{category='Category_7'}, Category{category='Category_8'}, Category{category='Category_9'}, Category{category='Category_10'}]
```

We see that the operation took 2030 ms, as predicted. Can we do something to increase even more the performance of our
application? YES!

## Using CompletableFuture with a custom Executor

Now will refactor our client application to take advantage of CompletableFuture and because we have now ten transactions
to categorize, we will use an `Executor` with a fixed thread pool of ten Threads.

```java
public class Demo {

    public static void main(String[] args) {
        Executor executor = Executors.newFixedThreadPool(10);
        long start = System.currentTimeMillis();
        var futureCategories = Stream.of(
                        new Transaction("1", "description 1"),
                        new Transaction("2", "description 2"),
                        new Transaction("3", "description 3"),
                        new Transaction("4", "description 4"),
                        new Transaction("5", "description 5"),
                        new Transaction("6", "description 6"),
                        new Transaction("7", "description 7"),
                        new Transaction("8", "description 8"),
                        new Transaction("9", "description 9"),
                        new Transaction("10", "description 10")
                )
                .map(transaction -> CompletableFuture.supplyAsync(() -> CategorizationService.categorizeTransaction(transaction), executor))
                .collect(toList());

        var categories = futureCategories.stream()
                .map(CompletableFuture::join)
                .collect(toList());
        long end = System.currentTimeMillis();

        System.out.printf("The operation took %s ms%n", end - start);
        System.out.println("Categories are: " + categories);
    }
}
```

Our client application is trying to call the categorization service by using the method `supplyAsync` that takes as
arguments a `Supplier` and an `Executor`. Because now we have ten transactions and a custom Executor that has a pool of
ten threads, we expect that the operation should take around one second. Indeed, the output confirms the expected
result :

```
The operation took 1040 ms
Categories are: [Category{category='Category_1'}, Category{category='Category_2'}, Category{category='Category_3'}, 
Category{category='Category_4'}, Category{category='Category_5'}, Category{category='Category_6'}, 
Category{category='Category_7'}, Category{category='Category_8'}, Category{category='Category_9'}, Category{category='Category_10'}]
```
