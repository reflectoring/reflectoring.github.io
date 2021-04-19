---
title: "Creating and analyzing Thread Dumps"
categories: [craft]
date: 2021-04-09 06:00:00 +1000
modified: 2021-04-09 06:00:00 +1000
author: pratikdas
excerpt: "Thread"
image:
  auto: 0074-stack
---
A thread is a basic path of execution in a program.  Most of the applications we build today execute in a multi-threaded environment. As such a program running perfectly in development environment may encounter thread related issues when promoted to higher environments for serving multiple concurrent requests. A multi-threaded program contains two or more parts that can run concurrently and each part can handle a different task at the same time making optimal use of the available resources specially when your computer has multiple CPUs.

By definition, multitasking is when multiple processes share common processing resources such as a CPU. Multi-threading extends the idea of multitasking into applications where you can subdivide specific operations within a single application into individual threads. Each of the threads can run in parallel. The OS divides processing time not only among different applications, but also among each thread within an application.

Multi-threading enables us to write in a way where multiple activities can proceed concurrently in the same program.A program becomes unresponsive if the thread executing at that point of time is stuck due to various reasons. A thread dump provides a snapshot of all the threads in a program executing at a specific instant.

For this reason, it is a vital tool for understanding issues related to application slowness, an application becoming unresponsive, or deadlock situations. 

In this post we will look at different thread dumps and understanding the information they contain to diagnose application threading issues.


{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/aws-terraform" %}



## What is Thread Dump

For understanding thread dump it is essential to know the life cycle of a thread. A thread goes through multiple states. This schemata represents all the states a thread can assume along with their transition paths:


As we can see a thread goes through five states:

1. **New**: Initial state of a thread when we create an instance of `Runnable`. It remains in this state until the program starts the thread.

2. **Runnable**:After a newly born thread is started, the thread becomes runnable. A thread in this state is considered to be executing its task.

3. **Waiting**: Sometimes, a thread transitions to the waiting state while the thread waits for another thread to perform a task. A thread transitions back to the runnable state only when another thread signals the waiting thread to continue executing.

4. **Timed Waiting**: A runnable thread can enter the timed waiting state for a specified interval of time. A thread in this state transitions back to the runnable state when that time interval expires or when the event it is waiting for occurs.

5. **Terminated (Dead)** A runnable thread enters the terminated state after it finishes its task.


A thread dump is a snapshot of the state of all threads that are part of the process. The state of each thread is accompanied by a stack trace containing the contents of a thread's stack. Some of the threads belong to the running application, while others are internal threads of JVM.

## Generating a Thread Dump
We will now generate some thread dumps by running a simple java program. 

### Running an Example Program
We will capture the thread dump of an application which simulates a web server. The `main` method of our application looks like this:
```java
public class App {

    public static void main( String[] args ) throws Exception {
        try (ServerSocket serverSocket = new ServerSocket(8080)) {
            System.out.println("Server started. Listening for requests on 8080");
            while (true) {
                try (Socket client = serverSocket.accept()) {
                    System.out.println("Processing request from client "+
                      client.getInetAddress().getHostAddress());
                    handleClientRequest(client);
                }
            }
        }
    }
    ...
    ...
}
```
Here we instantiate a `ServerSocket` class which listens on port 8080 for incoming client requests and does some processing on the same `main` thread.

Let us build this program with Maven and then run this program as a java executable with the command:
```shell
java -jar target/ServerApp-1.0-SNAPSH.jar
```

### Generating the Thread Dump
We will now generate the thread dump of the application we started in the previous step using a utility name `jcmd`. The [jcmd](https://docs.oracle.com/javase/8/docs/technotes/guides/troubleshoot/tooldescr006.html) utility is used to send diagnostic command requests to the JVM, where these requests are useful for controlling Java Flight Recordings, troubleshoot, and diagnose JVM and Java Applications. It must be used on the same machine where the JVM is running, and have the same effective user and group identifiers that were used to launch the JVM.

For this we will first find the pid

Let us find the `pid` by running ps -a and then capture the thread dump by running jstack command:

```shell
jps -l
```

```shell
1410 target/ServerApp-1.0-SNAPSHOT.jar
1864 jdk.jcmd/sun.tools.jps.Jps
```

```shell
jcmd 1410 Thread.print > threadDump.txt
```

```shell
jstack -l <PID>
```
We can see the thread dump in the console.
```shell
2021-04-18 15:54:38
Full thread dump OpenJDK 64-Bit Server VM (14.0.1+7 mixed mode, sharing):
...

"main" #1 prio=5 os_prio=31 cpu=125.58ms elapsed=209.41s tid=0x00007f8bbc805000 nid=0x1f03 runnable  [0x0000700000a36000]
   java.lang.Thread.State: RUNNABLE
  at sun.nio.ch.Net.accept(java.base@14.0.1/Native Method)
  ...
  ...
  at java.net.ServerSocket.accept(java.base@14.0.1/ServerSocket.java:540)
  at io.pratik.App.main(App.java:18)

   Locked ownable synchronizers:
  - <0x0000000787f6cad0> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)


"VM Thread" os_prio=31 cpu=16.01ms elapsed=209.36s tid=0x00007f8bbd0c2000 nid=0x4603 runnable  

"GC Thread#0" os_prio=31 cpu=0.24ms elapsed=209.40s tid=0x00007f8bbd025000 nid=0x3103 runnable  
...
...
```
We can see the `main` thread in the `runnable` state with a thread id(tid), cpu time and priority. 


## Taking a Thread Dump
There are other methods of taking the heap dump, other than taking the thread dumps with the `jcmd` utility which we used earlier. Some of these methods are:

1. **jstack**: `jstack` is a popular method of taking thread dumps. 
```shell
sudo su java-service jstack <pid>
```
`jcmd` utility was introduced with release of JDK 8 and Oracle suggests using it for taking thread dumps instead of the previous `jstack` utility for enhanced diagnostics and reduced performance overhead.

2. Visual VM

3. jmc

## Manual Analysis

## Analyzing Thread Dump with Tools
fastThread](https://fastthread.io/) is one of the available tools for analyzing thread dumps.

Let us upload our thread dump file to [fastThread](https://fastthread.io/) tool and see the results.

## Using Thread Dumps for Application Troubleshooting

### Detecting Deadlocks

### Processing Bottlenecks

### Viewing the Run-time Profile of an Application
By making several consecutive thread dumps, you can get an overview of the parts of your Java application that are used the most. Click the Threads tab in JRockit Management Console for more detailed information about the workload on the different parts of your application.

## Conclusion

In this post, we started with the five states of a java thread of during its lifecycle and described thread dumps as a snapshot of thread states. We then ran a simple java application to simulate a web server and took its thread dump with `jcmd` tool. After that we introduced tools to analyze thread dumps and ended with some use cases and best practices of thread dumps. Thread dump is often used in combination with [heap dump]() and GC log to diagnose java applications. I hope this will enable you to use thread dumps for the use cases described here and also find other areas where it can be put to use like automation with Ci/CD.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/aws-terraform).