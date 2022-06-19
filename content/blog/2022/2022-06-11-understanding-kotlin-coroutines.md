---
title: "Understanding Kotlin Coroutines"
categories: ["kotlin"]
date: 2022-05-20T05:00:00
modified: 2022-05-20T05:00:00
authors: [pratikdas]
excerpt: "We use a mix of two kinds of programming models when building applications : synchronous and asynchronous. Synchronous execution means the first task in a program must finish processing before moving on to executing the next task while asynchronous execution means a second task can begin executing in parallel, without waiting for an earlier task to finish. A coroutine is a concurrency design pattern used to write asynchronous programs. They are computations that run on top of threads that can be suspended and resumed. When a coroutine is suspended, the corresponding computation is paused, removed from the thread, and stored in memory leaving the thread free to execute other activities.
"
image: images/stock/0118-keyboard-1200x628-branded.jpg
url: understanding-kotlin-coroutines
---

We use a mix of two kinds of programming models when building applications : synchronous and asynchronous. 

Synchronous execution means the first task in a program must finish processing before moving on to executing the next task while asynchronous execution means a second task can begin executing in parallel, without waiting for an earlier task to finish.

A coroutine is a concurrency design pattern used to write asynchronous programs. They are computations that run on top of threads that can be suspended and resumed. When a coroutine is suspended, the corresponding computation is paused, removed from the thread, and stored in memory leaving the thread free to execute other activities.

In this post, we will understand how to use coroutines in Kotlin with the help of examples. 

{{% github "https://github.com/thombergs/code-examples/tree/master/kotlin/coroutines" %}}

## Adding the Dependencies for Coroutines
The Kotlin language gives us basic constructs for coroutines but more useful constructs built on top of the basic coroutines are available in the `kotlinx-coroutines-core` library. So let us add the dependency to the `kotlinx-coroutines-core` library:

Our build tool of choice is Gradle, so the dependency on the `kotlinx-coroutines-core` library will look like this:

```groovy
dependencies {
    implementation 'org.jetbrains.kotlin:kotlin-stdlib'
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.6.2'
}
```
Here we have added the dependency on the Kotlin standard library and the `kotlinx-coroutines-core` library.

## A Simple Coroutine in Kotlin
Coroutines are known as lightweight threads which means we can run code on coroutines similar to how we run code on threads. Let us see a simple example of running a block of code in a coroutine:
```java
fun main() = runBlocking{
    println("My program runs...: ${Thread.currentThread().name}")

    launch {
        longRunningTask()
    }

    println("My program run ends...: ${Thread.currentThread().name}")
}

suspend fun longRunningTask(){
    println("executing longRunningTask on...: ${Thread.currentThread().name}")
    delay(1000)
    println(
     "longRunningTask ends on thread ...: ${Thread.currentThread().name}")
}
```
Let us understand what this code does:
`launch` starts a new coroutine that runs concurrently with the rest of the code. 

`runBlocking` is a coroutine builder that means that the thread that runs it (in this case — the `main` thread) gets blocked for the duration of the call until all the coroutines inside the `runBlocking` block complete their execution. 

`longRunningTaskSuspended` is called a suspending function. It suspends the coroutine without blocking the underlying thread but allows other coroutines to run and use the underlying thread for their code.

When we run this program, we will get the following output:
```shell
My program runs...: main
My program run ends...: main
executing longRunningTask on...: main
longRunningTask ends on a thread ...: main

Process finished with exit code 0
```
We can see from this output that the program runs on the thread named `main`. It does not wait for the `longRunningTask` to finish and proceeds to execute the next statement and prints `My program run ends...: main`. The coroutine executes concurrently on the same thread as we can see from the output of the two print statements in the `longRunningTask` function.

## Introducing Suspending Functions
A suspending function is a function that can be paused and resumed at a later time. They are used to execute a long-running operation and wait for it to complete without blocking.

The syntax of a suspending function is similar to a regular function except for the addition of the `suspend` keyword as shown below: 
```java
suspend fun longRunningTask(){
    println("executing longRunningTask on...: ${Thread.currentThread().name}")
    delay(1000)
    println(
     "longRunningTask ends on thread ...: ${Thread.currentThread().name}")
}

fun main() = runBlocking{
  ...
  ...
    launch {
        // calling the suspending function
        longRunningTask()  
    }
  ...
  ...
}
```
Suspending functions can also take a parameter and have a return type but they can only be invoked by another suspending function or within a coroutine. In this example, the `longRunningTask` function is called from the `launch` coroutine builder which starts a new coroutine. The `delay` function called inside the `longRunningTask` function is also a suspending function provided by the `kotlinx-coroutines-core` library. 

## Coroutine Scopes and Builders

We use a coroutine builder to start a new coroutine and establish the corresponding scope to delimit the lifetime of the coroutine. The coroutine scope provides lifecycle methods for coroutines which allow us to start and stop the coroutines.

Kotlin provides three coroutine builders: `launch`, `async`, and `runBlocking`. We have already used the `launch` and `runBlocking` coroutine builders in our previous examples. The `launch`, and `async` coroutine builders are non-blocking while the `runBlocking` coroutine builder blocks the thread. 

Let us understand their differences in some more detail:

### `launch` coroutine builder (Fire and Forget)
The `launch` coroutine builder starts a new coroutine without blocking the current thread. 

```java
fun main() = runBlocking{
    println("My program runs...: ${Thread.currentThread().name}")

    // launch new coroutine and keep a reference to its Job
    val job:Job = launch { 
        longRunningTask()
    }

    job.join()  // wait until child coroutine completes

    println("My program run ends...: ${Thread.currentThread().name}")
}

suspend fun longRunningTask(){
    println(
     "executing longRunningTask on...: ${Thread.currentThread().name}")
    delay(1000)
    println(
     "longRunningTask ends on thread ...: ${Thread.currentThread().name}")
}
```
So launch starts the coroutine which will execute the `longRunningTask` function and returns a `Job` object immediately as a reference. We are calling the `join()` method on this `Job` object to make the thread wait until the coroutine execution completes.

We can also use the `Job` object to cancel the coroutine when the resulting job is canceled.

### runBlocking (Block the running Thread)
The `runBlocking` coroutine builder starts a coroutine in a blocking way. It is similar to how we block normal threads with the `Thread` class and notify blocked threads after certain events.
The runBlocking blocks the currently executing thread, until the coroutine (body between {}) gets completed.

```java
fun main() = runBlocking{
    println("My program runs...: ${Thread.currentThread().name}")

    launch {
        longRunningTask()
    }

    println(
     "My program run ends...: ${Thread.currentThread().name}")
}
```

`runBlocking` is a coroutine builder that means that the thread that runs it (in this case — the main thread) gets blocked for the duration of the call, until all the coroutines inside runBlocking { ... } complete their execution. `runBlocking` is often used at the top-level of the application and rarely inside the real code, since threads are expensive resources and blocking them is inefficient and is often not desired.

### async and await 
The `async` is another way to start a coroutine. Sometimes when we start a coroutine, we might need a value to be returned from that coroutine back to the thread that launched it.

`async` starts a coroutine in parallel similar to launch. But it waits one coroutine to complete before starting another coroutine as shown in this example:
```java
fun main() = runBlocking{
    println("Program runs...: ${Thread.currentThread().name}")

    // start the new coroutine and 
    // keep a reference to Deferred instance
    val taskDeferred = async { 
        generateUniqueID()
    }

    // Fetch the result from Deferred instance with await
    val taskResult = taskDeferred.await() 

    println("program run ends...:  
        ${taskResult}  ${Thread.currentThread().name}")
}

suspend fun generateUniqueID(): String{
    println("executing longRunningTask on...: ${Thread.currentThread().name}")
    delay(1000)
    println("longRunningTask ends on thread ...: 
        ${Thread.currentThread().name}")

    return UUID.randomUUID().toString()
}
```
In this example, we are generating a unique identifier in a suspending function: `generateUniqueID` which is called from a coroutine started with `async`. 
The `async` function returns an instance of `Deffered<T>`. The type of `T` is `Unit` by default. Here type of `T` is `String` since the suspending function `generateUniqueID` returns a value of type `String`. 
Next, we are calling the `await()` method on the deferred instance: `taskDeferred` to extract the result.

## Cancelling Coroutine Execution﻿
We might like to cancel long-running jobs before they finish. In an earlier example, we saw the launch function returning a `Job`. The `Job` object provides a `cancel` method to cancel a running coroutine:
```java
fun main() = runBlocking{
    println("My program runs...: ${Thread.currentThread().name}")

    val job:Job = launch {

        longRunningFunction()
    }
    delay(1500) // delay ending the program
    job.cancel() // cancel the job
    job.join()  // wait for the job to be cancelled

    // job.cancelAndJoin() // we can also call this in a single step

    println(
        "My program run ends...: ${Thread.currentThread().name}")
}

suspend fun longRunningFunction(){
    repeat(1000){ i ->
        println("executing :$i step on thread: ${Thread.currentThread().name}")
        delay(600)
    }
}
```
In this example, we are executing a print statement from the `longRunningFunction` after every `600` milliseconds. This simulates a long-running function with `1000` steps and executes the print statement at the end of every step. We get the following output when we run this program:
```shell
My program runs...: main
executing step 0 on thread: main
executing step 1 on thread: main
executing step 2 on thread: main
My program run ends...: main

Process finished with exit code 0
```
We can see the `longRunningFunction` executing till step 2 and then stopping after we call `cancel` on the `job` object. Instead of two statements for `cancel` and `join`, we can also use a Job extension function: `cancelAndJoin` that combines `cancel` and `join` invocations.

## Cancellable Coroutine
Coroutine cancellation is cooperative. A coroutine code has to cooperate to be cancellable. If a coroutine is in the middle of computation like reading a large file and does not check for cancellation, then it cannot be canceled. 

There are two approaches to making a coroutine code cancellable:

1. Periodically invoke a suspending function that checks for cancellation. This is done with the `yield` function. 

2. Explicitly check the cancellation status.

```java
fun main() = runBlocking{
    println("program runs...: ${Thread.currentThread().name}")

    val job:Job = launch {
        val files = File ("<File Path>").listFiles()
        var loop = 0

        while (loop < files.size-1 ) {
            if(isActive) { // check the cancellation status
                readFile(files.get(++loop))
            }
        }
    }
    delay(1500)
    job.cancelAndJoin()

    println("program run ends...: ${Thread.currentThread().name}")
}

suspend fun readFile(file: File) {
    println("reading file ${file.name}")
    if (file.isFile) {
        // process file
    }
    delay(100)
}
```
Here we are processing a set of files from a directory. We are checking for the cancellation status with `isActive` before processing each file.

## Coroutine Dispatchers
A coroutine dispatcher determines the thread or threads the corresponding coroutine uses for its execution. The coroutine dispatcher can confine coroutine execution to a specific thread, dispatch it to a thread pool, or let it run unconfined. It is part of the `CoroutineContext` which is defined in the Kotlin standard library. 

All coroutine builders like `launch` and `async` accept an optional `CoroutineContext` as parameter that can be used to explicitly specify the dispatcher for the new coroutine. Kotlin has multiple implementations of `CoroutineDispatchers` which we can specify when creating coroutines with coroutine builders like `launch` and `async`. Let us look at commonly used dispatchers:

### Inheriting the Dispatcher from the Parent
When `launch` is used without parameters, it inherits the context (and thus dispatcher) from the `CoroutineScope` it is being launched from:
```java
fun main() = runBlocking {
    launch { // will get its own new thread
        println(
         "newSingleThreadContext: running in  thread ${Thread.currentThread().name}")
        longTask()
    }
    println("completed tasks")
}
```
In this case, it inherits the context of the main `runBlocking` coroutine which runs in the main thread.

### Default Dispatcher for Running CPU-intensive Operations
The default dispatcher is used when no other dispatcher is explicitly specified in the scope. It is represented by `Dispatchers.Default` and uses a shared background pool of threads. It is designed to run CPU-intensive operations. It has a pool of threads with a size equal to the number of cores on the machine our code is running on with a minimum of `2` threads.

Let us run the following code to check this behavior:
```java
fun main() = runBlocking {
    repeat(1000) {
        launch(Dispatchers.Default) { // will get dispatched to DefaultDispatcher
            println("Default  : running in thread ${Thread.currentThread().name}")
            longTask()
        }
    }
}
```
Here is a snippet of the output showing the threads used by the coroutine:
```shell
Default  : running in thread DefaultDispatcher-worker-1
Default  : running in thread DefaultDispatcher-worker-2
Default  : running in thread DefaultDispatcher-worker-4
Default  : running in thread DefaultDispatcher-worker-3
Default  : running in thread DefaultDispatcher-worker-5
Default  : running in thread DefaultDispatcher-worker-6
Default  : running in thread DefaultDispatcher-worker-7
Default  : running in thread DefaultDispatcher-worker-8
Default  : running in thread DefaultDispatcher-worker-9
Default  : running in thread DefaultDispatcher-worker-10
Default  : running in thread DefaultDispatcher-worker-3
Default  : running in thread DefaultDispatcher-worker-2
Default  : running in thread DefaultDispatcher-worker-2
Default  : running in thread DefaultDispatcher-worker-6
Default  : running in thread DefaultDispatcher-worker-4
```
We can see `10` threads from the thread pool used for running the coroutines. We can use `limitedParallelism` to restrict the number of coroutines being actively executed in parallel:

```java
fun main() = runBlocking {
    repeat(1000) {
        // will get dispatched to DefaultDispatcher with 
        // limit to running 3 coroutines in parallel
        val dispatcher = Dispatchers.Default.limitedParallelism(3)
        launch(dispatcher) {
            println("Default  : running in thread ${Thread.currentThread().name}")
            longTask()
        }
    }
}
```
Here we have set a limit of `3` for running a maximum of `3` coroutines in parallel.

### Creating a New Thread with `newSingleThreadContext`
`newSingleThreadContext` creates a thread for the coroutine to run. This dispatcher guarantees that the coroutine is executed in a specific thread at all times:
```java
fun main() = runBlocking {
    launch(newSingleThreadContext("MyThread")) { // will get its own new thread MyThread
        println("newSingleThreadContext: running in  thread ${Thread.currentThread().name}")
        longTask()
    }
    println("completed tasks")
}
```
In this example, we are executing our coroutine in a dedicated thread named `MyThread` as can be seen in the output.

```shell
newSingleThreadContext: running in  thread MyThread

Process finished with exit code 0
```
A dedicated thread is an expensive resource. In a real application it must be either released, when no longer needed, using the close function, or stored in a top-level variable and reused throughout the application.

### Dispatchers.Unconfined
The `Dispatchers.Unconfined` coroutine dispatcher starts a coroutine in the caller thread, but only until the first suspension point. After suspension it resumes the coroutine in the thread that is fully determined by the suspending function that was invoked. 
```java
fun main() = runBlocking {
    launch(Dispatchers.Unconfined) { // not confined -- will work with main thread
        println("Unconfined : running in thread ${Thread.currentThread().name}")
        longTask()
    }
    println("completed tasks")
}
```
The unconfined dispatcher is appropriate for coroutines that neither consume CPU time nor update any shared data (like UI) confined to a specific thread.

This behavior is in contrast to the confined dispatchers where the dispatcher is inherited from the outer `CoroutineScope` by default. 

The default dispatcher for the runBlocking coroutine, in particular, is confined to the invoker thread, so inheriting it confines execution to this thread with predictable FIFO scheduling.

## Coroutines vs Threads
Coroutines are known as lightweight threads which means we can run code on coroutines similar to how we run code on threads. Let us understand this with an example of first running a block of code in a separate thread and then changing it to execute in a coroutine. 

Let us run a simple `main()` function inside which we will call a long-running function in another thread:
```java
import kotlin.concurrent.thread

fun main() {
    println("My program runs...: 
        ${Thread.currentThread().name}")

    thread {
        longRunningTask()
    }

    println("My program run ends...: 
        ${Thread.currentThread().name}")
}

fun longRunningTask(){
    println("executing longRunningTask on...: 
        ${Thread.currentThread().name}")
    Thread.sleep(1000)
    println("longRunningTask ends on thread ...: 
        ${Thread.currentThread().name}")
}
```
Here we are simulating the long-running behavior by calling `Thread.sleep()` inside the function: `longRunningTask()`.  We are calling this function inside the `thread` lambda function. This will allow the `main` thread to continue without waiting for the `longRunningTask()` function to complete. 

The `longRunningTask()` function will execute in a different thread as we can observe from the output of the `println` statements by running this program :
```shell
My program runs...: main
My program run ends...: main
executing longRunningTask on...: Thread-0
longRunningTask ends on thread ...: Thread-0

Process finished with exit code 0
```
As we can see, the program starts running on the thread: `main`. It executes the `longRunningTask()` on thread `Thread-0` but does not wait for it to complete and proceeds to execute the next `println()` statement again on the thread: `main`. However, the program ends with exit code `0` only after the `longRunningTask` finishes executing on `Thread-0`.

Let us now compare this behaviour of using Thread with coroutine by executing the `longRunningTask` in a coroutine:

```java
fun main() = runBlocking{
    println("My program runs...: ${Thread.currentThread().name}")

    launch {
        longRunningTask()
    }

    println(
        "My program run ends...: ${Thread.currentThread().name}")
}

suspend fun longRunningTask(){
    println("executing longRunningTask on...: 
        ${Thread.currentThread().name}")
    delay(1000)
    println("longRunningTask ends on thread ...: 
        ${Thread.currentThread().name}")
}
```
Here we are calling the same function: `longRunningTask()` but inside the `GlobalScope.launch` lambda function. The `GlobalScope.launch` lambda function creates a coroutine which runs on a background thread.

We can observe a slightly different behavior when we run this program:

```shell
My program runs...: main
My program run ends...: main
executing longRunningTask on...: main
longRunningTask ends on thread ...: main

Process finished with exit code 0
```
We can compare this output with the previous output of our program written with Threads. The coroutine executes concurrently on the same thread `main` as we can see from the output of the two print statements in the `longRunningTask` function.

**A thread gets blocked while a coroutine is suspended leaving the thread to continue execution**

## Conclusion 
In this article, we understood the different ways of using Coroutines in Kotlin. Here are some important points to remember:
1. A coroutine is a concurrency design pattern used to write asynchronous programs. 
2. Coroutines are computations that run on top of threads that can be suspended and resumed. 
3. When a coroutine is "suspended", the corresponding computation is paused, removed from the thread, and stored in memory leaving the thread free to execute other activities.
2. Coroutines are started by coroutine builders which also establish a scope.
3. `launch`, `async`, and `runBlocking` are three types of coroutine builders.
4. The `launch` function returns `job` using which can also cancel the coroutine.
5. The `async` function starts a coroutine in parallel, similar to the `launch` function. However, it waits for a coroutine to complete before starting another coroutine.
6. A coroutine dispatcher determines the thread or threads the corresponding coroutine uses for its execution. The coroutine dispatcher can confine coroutine execution to a specific thread, dispatch it to a thread pool, or let it run unconfined.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/kotlin/coroutines).