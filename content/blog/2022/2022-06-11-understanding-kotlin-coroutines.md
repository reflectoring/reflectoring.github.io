---
title: "Understanding Kotlin Coroutines"
categories: ["kotlin"]
date: 2022-05-20T05:00:00
modified: 2022-05-20T05:00:00
authors: [pratikdas]
excerpt: "Coroutines are a design pattern for writing asynchronous programs for running multiple tasks concurrently. Conventionally we execute multiple tasks in parallel on separate threads. But threads are an expensive resource and too many threads lead to performance overhead. Coroutines are an alternate way of writing asynchronous programs but are much more lightweight compared to threads. They are computations that run on top of threads. We can suspend a coroutine to allow other coroutines to run on the same thread. We can further resume the coroutine to run on the same or a different thread. In this post, we will understand how to use coroutines in Kotlin.
"
image: images/stock/0118-keyboard-1200x628-branded.jpg
url: understanding-kotlin-coroutines
---
Coroutines are a design pattern for writing asynchronous programs for running multiple tasks concurrently. 

In asynchronous programs, multiple tasks execute in parallel on separate threads without waiting for the other tasks to complete. Threads are an expensive resource and too many threads lead to a performance overhead due to high memory consumption and CPU usage. 

Coroutines are an alternate way of writing asynchronous programs but are much more lightweight compared to threads. They are computations that run on top of threads. 

We can suspend a coroutine to allow other coroutines to run on the same thread. We can further resume the coroutine to run on the same or a different thread. 

When a coroutine is suspended, the corresponding computation is paused, removed from the thread, and stored in memory leaving the thread free to execute other activities. This way we can run many coroutines concurrently using only a small pool of threads thereby using very limited system resources.

In this post, we will understand how to use coroutines in Kotlin. 

{{% github "https://github.com/thombergs/code-examples/tree/master/kotlin/coroutines" %}}

## Adding the Dependencies for Coroutines
The Kotlin language gives us basic constructs for writing coroutines but more useful constructs built on top of the basic coroutines are available in the `kotlinx-coroutines-core` library. So we need to add the dependency to the `kotlinx-coroutines-core` library before starting to write coroutines:

Our build tool of choice is Gradle, so the dependency on the `kotlinx-coroutines-core` library will look like this:

```groovy
dependencies {
    implementation 'org.jetbrains.kotlin:kotlin-stdlib'
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.6.2'
}
```
Here we have added the dependency on the Kotlin standard library and the `kotlinx-coroutines-core` library.

## Running a Concurrent Program with Thread
Let us start by running a program that will execute some statements and also call a long-running function:
```java
//Todo: statement1
//Todo: call longRunningFunction
//Todo: statement2
...
...
```
If we execute all the statements in sequence on a single thread, the `longRunningFunction` will block the thread from executing the remaining statements and the program as a whole will take a long time to complete. 

To make it more efficient, we will execute the `longRunningFunction` in a separate thread and let the program continue executing on the main thread:

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
Here we are simulating the long-running behavior by calling `Thread.sleep()` inside the function: `longRunningTask()`.  We are calling this function inside the `thread` function. This will allow the `main` thread to continue executing without waiting for the `longRunningTask()` function to complete. 

The `longRunningTask()` function will execute in a different thread as we can observe from the output of the `println` statements by running this program :
```shell
My program runs...: main
My program run ends...: main
executing longRunningTask on...: Thread-0
longRunningTask ends on thread ...: Thread-0

Process finished with exit code 0
```
As we can see in the output, the program starts running on the thread: `main`. It executes the `longRunningTask()` on thread `Thread-0` but does not wait for it to complete and proceeds to execute the next `println()` statement again on the thread: `main`. However, the program ends with exit code `0` only after the `longRunningTask` finishes executing on `Thread-0`.

We will change this program to run using coroutines in the next section.

## A Simple Coroutine in Kotlin
Coroutines are known as lightweight threads which means we can run code on coroutines similar to how we run code on threads.
Let us change the earlier program to run the long running function in a coroutine instead of a separate thread as shown below:
```java
fun main() = runBlocking{
    println("My program runs...: ${Thread.currentThread().name}")

    launch { // starting a coroutine
        longRunningTask()  // calling the long running function
    }

    println("My program run ends...: ${Thread.currentThread().name}")
}

suspend fun longRunningTask(){
    println("executing longRunningTask on...: ${Thread.currentThread().name}")
    delay(1000)  // simulating the slow behavior by adding a delay
    println(
     "longRunningTask ends on thread ...: ${Thread.currentThread().name}")
}
```
Let us understand what this code does:
`launch{}` function starts a new coroutine that runs concurrently with the rest of the code. 

`runBlocking{}` also starts a new coroutine but blocks the current thread: `main` for the duration of the call until all the code inside the `runBlocking{}` function body complete their execution. 

`longRunningTask` function is called a suspending function. It suspends the coroutine without blocking the underlying thread but allows other coroutines to run and use the underlying thread for their code.

We will understand more about starting new coroutines using functions like `launch{}` and `runBlocking{}` in a subsequent section on coroutine builders and scopes.

When we run this program, we will get the following output:
```shell
My program runs...: main
My program run ends...: main
executing longRunningTask on...: main
longRunningTask ends on a thread ...: main

Process finished with exit code 0
```
We can see from this output that the program runs on the thread named `main`. It does not wait for the `longRunningTask` to finish and proceeds to execute the next statement and prints `My program run ends...: main`. The coroutine executes concurrently on the same thread as we can see from the output of the two print statements in the `longRunningTask` function.

We will next understand the different components of a coroutine in the following sections.

## Introducing Suspending Functions
A suspending function is the main building block of a coroutine. It is just like any other regular function which can optionally take one or more inputs and return an output. The thread running a regular function blocks other functions from running till the execution is complete. This will cause a negative performance impact if the function is a long-running function probably pulling data with an external API over a network. 

To mitigate this, we need to change the regular function into a suspending function and call it from a coroutine scope
Calling the suspending function will pause/suspend the function and allow the thread to perform other activities. The paused/suspended function can resume after some time to run on the same or a different thread.

The syntax of a suspending function is also similar to a regular function with the addition of the `suspend` keyword as shown below: 
```java
suspend fun longRunningTask(){
    ...
    ...
}
```
Functions marked with the suspend keyword are transformed at compile time and made asynchronous. Let is look at an example of calling a suspending function along with some regular functions:

```java
fun main() = runBlocking{
    println("${Instant.now()}: My program runs...: ${Thread.currentThread().name}")

    val productId = findProduct()

    launch (Dispatchers.Unconfined) { // start a coroutine
        val price = fetchPrice(productId) // call the suspending function
    }
    updateProduct()

    println("${Instant.now()}: My program run ends...: " +
            "${Thread.currentThread().name}")
}

suspend fun fetchPrice(productId: String) : Double{
    println("${Instant.now()}: fetchPrice starts on...: 
        ${Thread.currentThread().name} ")
    delay(2000) // simulate the slow function by adding a delay
    println("${Instant.now()}: fetchPrice ends on...: 
        ${Thread.currentThread().name} ")
    return 234.5
}

fun findProduct() : String{
    println("${Instant.now()}: findProduct on...: ${Thread.currentThread().name}")
    return "P12333"
}

fun updateProduct() : String{
    println("${Instant.now()}: updateProduct on...: ${Thread.currentThread().name}")
    return "Product updated"
}
```

As we can see in this example, the `findProduct()` and `updateProduct()` functions are regular functions. The `fetchPrice()` function is a slow function which we have simulated by adding a `delay()` function. 

In the `main()` function we are first calling the `findProduct()` function and then calling the `fetchPrice()` suspending function with the `launch{}` function. After suspension it resumes the coroutine in the thread  After that we are calling the `updateProduct()` function. 

The `launch{}` function starts a coroutine as explained earlier. We are passing a coroutine dispatcher: `Dispatchers.Unconfined` to the `launch` function which controls the threads on which the coroutine will start and resume. We will understand more about coroutine dispatchers in the subsequent sections.

Let us run this program to observe how the coroutine suspends and allows the thread to run the other regular functions: 
```shell
2022-06-24T04:09:40.065300Z: My program runs...: main
2022-06-24T04:09:40.068720Z: findProduct on...: main
2022-06-24T04:09:40.070836Z: fetchPrice starts on...: main
2022-06-24T04:09:40.086331Z: updateProduct on...: main
2022-06-24T04:09:40.086440Z: My program run ends...: main
2022-06-24T04:09:42.097901Z: fetchPrice ends on...: kotlinx.coroutines.DefaultExecutor

Process finished with exit code 0
```
As we can see the from the output, the `findProduct()` and `updateProduct()` functions are called on the `main` thread. The `fetchPrice()` function starts on the `main` thread and is suspended to allow execution of the `findProduct()` and `updateProduct()` functions on the `main` thread. The `fetchPrice()` function resumes on a different thread to execute the `println()` statement.

It is also important to understand that suspending functions can only be invoked by another suspending function or from a coroutine. The `delay()` function called inside the `fetchPrice()` function is also a suspending function provided by the `kotlinx-coroutines-core` library. 

## Coroutine Scopes and Builders
As explained in the previous sections, we can run suspending functions only in coroutine scopes started by coroutine builders like `launch{}`. 

We use a coroutine builder to start a new coroutine and establish the corresponding scope to delimit the lifetime of the coroutine. The coroutine scope provides lifecycle methods for coroutines that allow us to start and stop them.

Let us understand three coroutine builders in Kotlin: `runBlocking{}`, `launch{}`, and `async{}` : 

### Starting Coroutines by Blocking the Running Thread with `runBlocking`
Coroutines are more efficient than threads because they are suspended and resumed instead of blocking execution. However, we need to block threads in some specific use cases. For example, in the `main()` function, we need to block the thread, otherwise, our program will end without waiting for the coroutines to complete. 

The `runBlocking` coroutine builder starts a coroutine by blocking the currently executing thread, till all the code in the coroutine is completed. 

The signature of `runBlocking` functions looks like this:

```java
expect fun <T> runBlocking(context: CoroutineContext = EmptyCoroutineContext, 
                           block: suspend CoroutineScope.() -> T): T
```
The function takes two parameters :
1. `context`: Provides the context of the coroutine represented by the `CoroutineContext` interface which is an indexed set of `Element` instances.
2. `block`: The coroutine code which is invoked. It takes a function type: `suspend CoroutineScope.() -> Unit`


The `runBlocking{}` coroutine builder is designed to bridge regular blocking code to libraries that are written in suspending style. So the most appropriate situation of using `runBlocking{}` in main functions and in JUnit tests. 

A `runBlocking{}` function called from a `main()` function looks like this:
```java
fun main() = runBlocking{
    ...
    ...
}
```
We have used `runBlocking{}` to block execution in all the `main()` functions in our earlier examples. 

Since `runBlocking{}` blocks the executing thread, it is rarely used inside the code in function bodies since threads are expensive resources, and blocking them is inefficient and not desired.

### Starting Coroutines in `Fire and Forget` Mode with `launch` 
The `launch{}` function starts a new coroutine that will not return any result to the caller. It does not block the current thread. The signature of the `launch{}` function is:

```java
fun CoroutineScope.launch(
    context: CoroutineContext = EmptyCoroutineContext, 
    start: CoroutineStart = CoroutineStart.DEFAULT, 
    block: suspend CoroutineScope.() -> Unit
): Job
```
The function takes three parameters and returns a `Job` object:
1. `context`: Provides the context of the coroutine represented by the `CoroutineContext` interface which is an indexed set of `Element` instances.
2. `start`: Start option for the coroutine. The default value is `CoroutineStart.DEFAULT` which immediately schedules the coroutine for execution. We can set the start option to `CoroutineStart.LAZY` to start the coroutine lazily. 
3. `block`: The coroutine code which is invoked. It takes a function type: `suspend CoroutineScope.() -> Unit`

A new coroutine started using the `launch{}` function looks like this:
```java
fun main() = runBlocking{
    println("My program runs...: ${Thread.currentThread().name}")

    // calling launch passing all 3 parameters
    val job:Job = launch (EmptyCoroutineContext, CoroutineStart.DEFAULT){
        longRunningTask()
    }

    // Another way of calling launch passing only the block parameter
    // context and start parameters are set to their default values
    val job1:Job = launch{longRunningTask()} 
    
    job.join()

    println("My program run ends...: ${Thread.currentThread().name}")
}

suspend fun longRunningTask(){
    println("executing longRunningTask on...: ${Thread.currentThread().name}")
    delay(1000)
    println("longRunningTask ends on thread ...: ${Thread.currentThread().name}")
}
```
Here `launch{}` function is called inside the `runBlocking{}` function. The `launch{}` function starts the coroutine which will execute the `longRunningTask` function and return a `Job` object immediately as a reference. We are calling the `join()` method on this `Job` object which suspends the coroutine leaving the current thread free to do whatever it pleases (like executing another coroutine) in the meantime.

We can also use the `Job` object to cancel the coroutine when the resulting job is canceled.

### Return Result of suspending Function to the Launching Thread with `async`
The `async` is another way to start a coroutine. Sometimes when we start a coroutine, we might need a value to be returned from that coroutine back to the thread that launched it.

`async` starts a coroutine in parallel similar to launch. But it waits one coroutine to complete before starting another coroutine. The signature of async is shown below:

```java
fun <T> CoroutineScope.async(
    context: CoroutineContext = EmptyCoroutineContext, 
    start: CoroutineStart = CoroutineStart.DEFAULT, 
    block: suspend CoroutineScope.() -> T
): Deferred<T>
```

The `async{}` function takes the same three parameters as a `launch{}` function but returns a `Deferred<T>` instance instead of `Job`. We can fetch the result of the computation performed in the coroutine from the `Deferred<T>` instance by calling the `await()` method.


We can use `async` as shown in this example:
```java
fun main() = runBlocking{
    println("program runs...: ${Thread.currentThread().name}")

    val taskDeferred = async {
        generateUniqueID()
    }

    val taskResult = taskDeferred.await()

    println("program run ends...:  ${taskResult}  ${Thread.currentThread().name}")
}

suspend fun generateUniqueID(): String{
    println("executing generateUniqueID on...: ${Thread.currentThread().name}")
    delay(1000)
    println("generateUniqueID ends on thread ...: ${Thread.currentThread().name}")

    return UUID.randomUUID().toString()
}
```
In this example, we are generating a unique identifier in a suspending function: `generateUniqueID` which is called from a coroutine started with `async`. The `async` function returns an instance of `Deffered<T>`. The type of `T` is `Unit` by default. 

Here type of `T` is `String` since the suspending function `generateUniqueID` returns a value of type `String`. 

Next, we are calling the `await()` method on the deferred instance: `taskDeferred` to extract the result. 

We get the following output by running the program:
```shell
program runs...: main
executing generateUniqueID on...: main
generateUniqueID ends on thread ...: main
program run ends...:  f18ac8c7-25ef-4755-8ab8-73c8219aadd3  main

Process finished with exit code 0
```
Here we can see the result of the suspended function printed in the output.

## Coroutine Dispatchers

A coroutine dispatcher determines the thread or thread pool the corresponding coroutine uses for its execution. All coroutines execute in a context represented by the `CoroutineContext` interface. The `CoroutineContext` is an indexed set of elements and is accessible inside the coroutine through the property: `CoroutineContext`. The coroutine dispatcher is an important element of this indexed set.

The coroutine dispatcher can confine the execution of a coroutine to a specific thread, dispatch it to a thread pool, or allow it to run unconfined. 

As we have seen in the previous section, all coroutine builders like `launch{}` and `async{}` accept an optional `CoroutineContext` as a parameter in their signature:
```java
fun <T> CoroutineScope.async(
    context: CoroutineContext = EmptyCoroutineContext, 
    start: CoroutineStart = CoroutineStart.DEFAULT, 
    block: suspend CoroutineScope.() -> T
): Deferred<T>
```
The `CoroutineContext` is used to explicitly specify the dispatcher for the new coroutine. Kotlin has multiple implementations of `CoroutineDispatchers` which we can specify when creating coroutines with coroutine builders like `launch` and `async`. Let us look at some of the commonly used dispatchers:

### Inheriting the Dispatcher from the Parent Coroutine
When the `launch{}` function is used without parameters, it inherits the `CoroutineContext` (and thus the dispatcher) from the `CoroutineScope` it is being launched from. Let us observe this behavior with the help of the example below:
```java
fun main() = runBlocking {
    launch {
        println(
            "launch default: running in  thread ${Thread.currentThread().name}")
        longTask()
    }
}

suspend fun longTask(){
    println("executing longTask on...: ${Thread.currentThread().name}")
    delay(1000)
    println("longTask ends on thread ...: ${Thread.currentThread().name}")
}
```
Here the `launch{}` coroutine builder inherits the context and hence the dispatcher of the `runBlocking` coroutine scope which runs in the `main` thread. Hence the coroutine started by the `launch{}` coroutine builder also uses the same dispatcher which makes the coroutine run in the main thread.

When we run this program, we can observe this behavior in the below output:
```shell
completed tasks
launch default: running in  thread main
executing longTask on...: main
longTask ends on thread ...: main

Process finished with exit code 0
```
As we can see in the output, the coroutine started by the `launch{}` coroutine builder also runs in the `main` thread.

### Default Dispatcher for Running CPU-Intensive Operations
The default dispatcher is used when no other dispatcher is explicitly specified in the scope. It is represented by `Dispatchers.Default` and uses a shared background pool of threads. The pool of threads has a size equal to the number of cores on the machine where our code is running with a minimum of `2` threads.

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
We can see `10` threads from the thread pool used for running the coroutines. 

We can also use `limitedParallelism` to restrict the number of coroutines being actively executed in parallel as shown in this example:

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
`newSingleThreadContext` creates a new thread which will be solely dedicated for the coroutine to run. This dispatcher guarantees that the coroutine is executed in a specific thread at all times:
```java
fun main() = runBlocking {
    launch(newSingleThreadContext("MyThread")) { // will get its own new thread MyThread
        println("newSingleThreadContext: running in  thread ${Thread.currentThread().name}")
        longTask()
    }
    println("completed tasks")
}
```
In this example, we are executing our coroutine in a dedicated thread named `MyThread` as can be seen in the output obtained by running the program:

```shell
newSingleThreadContext: running in  thread MyThread

Process finished with exit code 0
```
However, a dedicated thread is an expensive resource. In a real application, the thread must be either released, when no longer needed, using the close function, or reused throughout the application by storing its reference in a top-level variable.

### Dispatchers.Unconfined
The `Dispatchers.Unconfined` coroutine dispatcher starts a coroutine in the caller thread, but only until the first suspension point. After suspension, it resumes the coroutine in the thread that is fully determined by the suspending function that was invoked. 

Let us modify our previous example to pass a parameter: `Dispatchers.Unconfined` to the `launch{}` function:
```java
fun main() = runBlocking {
    launch(Dispatchers.Unconfined) { // not confined -- will work with main thread
        println("Unconfined : running in thread ${Thread.currentThread().name}")
        longTask()
    }
    println("completed tasks")
}
```
When we run this program, we get the following output:
```shell
Unconfined : running in thread main
executing longTask on...: main   // coroutine starts
completed tasks  // printed by main thread with the coroutine suspended
longTask ends on thread ...: kotlinx.coroutines.DefaultExecutor  // coroutine resumes

Process finished with exit code 0
```
As we can see from the output, the coroutine starts running in the `main` thread as soon as it is called. It is suspended to allow the `main` thread to run. The coroutine resumes on a different thread: `kotlinx.coroutines.DefaultExecutor` to execute the `println` statement in the `longTask` function.

The unconfined dispatcher is appropriate for coroutines that neither consume CPU time nor update any shared data (like UI) confined to a specific thread. The unconfined dispatcher should not be used in general code. It is helpful in situations where some operation in a coroutine must be performed immediately. 

## Cancelling Coroutine Execution﻿
We might like to cancel long-running jobs before they finish. An example of a situation when we would want to cancel a job will be: when we have navigated to a different screen in a UI-based application (like Android) and are no longer interested in the result of the long-running function. 

Another example will be: we want to exit a process due to some exception and we want to perform a clean-up by canceling all the long-running jobs which are still running.

In an earlier example, we have already seen the `launch{}` function returning a `Job`. The `Job` object provides a `cancel()` method to cancel a running coroutine which we can use as shown in this example:
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
We can see the `longRunningFunction` executing till step `2` and then stopping after we call `cancel` on the `job` object. Instead of two statements for `cancel` and `join`, we can also use a Job extension function: `cancelAndJoin` that combines `cancel` and `join` invocations.

## Canceling Coroutines
As explained in the previous section, we need to cancel coroutines to avoid doing more work than needed to save on memory and processing resources. We need to ensure that we control the life of the coroutine and cancel it when it is no longer needed.

A coroutine code has to cooperate to be cancellable. We need to ensure that all the code in a coroutine is cooperative with cancellation, by checking for cancellation periodically or before beginning any long-running task. 

There are two approaches to making a coroutine code cancellable:

### Periodically Invoke a Suspending Function `yield`
We can periodically invoke a suspending function like `yield` to check for the cancellation status of a coroutine and yield the thread (or thread pool) of the current coroutine to allow other coroutines to run on the same thread (or thread pool):
```java
fun main() = runBlocking{
    try {
        val job1 = launch {
            repeat(20){
                println(
                 "processing job 1: ${Thread.currentThread().name}")
                yield()
            }
        }

        val job2 = launch {
            repeat(20){
                println(
                 "processing job 2: ${Thread.currentThread().name}")
                yield()
            }
        }

        job1.join()
        job2.join()

    } catch (e: CancellationException) {
        // clean up code

    }
}
```
Here we are running two coroutines with each of them calling the `yield` function to allow the other coroutine to run on the `main` thread.
The output snippet of running this program is shown below:
```shell
processing job 1: main
processing job 2: main
processing job 1: main
processing job 2: main
processing job 1: main
```
We can see the output from the first coroutine after which it calls `yield`. This suspends the first coroutine and allows the second coroutine to run. Similarly, the second coroutine is also calling the `yield` function and allowing the first coroutine to resume execution.

When the cancellation of a coroutine is accepted, a `kotlinx.coroutines.JobCancellationException` exception is thrown. We can catch this exception and run all clean-up code here.

### Explicitly Check the Cancellation Status with `isActive`
We can also explicitly check for the cancellation status of a running coroutine with `isActive` which is an extension property available inside the coroutine via the `CoroutineScope` object:
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
Here we are processing a set of files from a directory. We are checking for the cancellation status with `isActive` before processing each file. The `isActive` property returns `true` when the current job is still active (not completed and not canceled yet).

## Conclusion 
In this article, we understood the different ways of using Coroutines in Kotlin. Here are some important points to remember:
1. A coroutine is a concurrency design pattern used to write asynchronous programs. 
2. Coroutines are computations that run on top of threads that can be suspended and resumed. 
3. When a coroutine is "suspended", the corresponding computation is paused, removed from the thread, and stored in memory leaving the thread free to execute other activities.
4. Coroutines are started by coroutine builders which also establish a scope.
5. `launch{}`, `async{}`, and `runBlocking{}` are different types of coroutine builders.
6. The `launch` function returns `job` using which can also cancel the coroutine. The `async` function returns a `Deferred<T>` instance. We can fetch the result of the computation performed in the coroutine from the `Deferred<T>` instance by calling the `await()` method.
7. Coroutine cancellation is cooperative. A coroutine code has to cooperate to be cancellable. Otherwise, we cannot cancel it midway during its execution even after calling `Job.cancel()`.
8. The `async` function starts a coroutine in parallel, similar to the `launch{}` function. However, it waits for a coroutine to complete before starting another coroutine.
9. A coroutine dispatcher determines the thread or threads the corresponding coroutine uses for its execution. The coroutine dispatcher can confine coroutine execution to a specific thread, dispatch it to a thread pool, or let it run unconfined.
10. Coroutines are lightweight compared to threads. A thread gets blocked while a coroutine is suspended leaving the thread to continue execution, thus allowing the same thread to be used for running multiple coroutines.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/kotlin/coroutines).