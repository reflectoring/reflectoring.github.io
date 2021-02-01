---
title: "Create and Analyze Heap Dump"
categories: [spring-boot]
date: 2021-01-20 06:00:00 +1000
modified: 2021-01-20 06:00:00 +1000
author: pratikdas
excerpt: "We will introduce GraphQL and explain it alongside of an example implementation in Java and Spring Boot"
image:
  auto: 0001-network
---

As Java developers, we are familiar with our applications throwing OutOfMemory exception or our server monitoring tools throwing alerts complaining about high JVM Memory utilization in the Java Virtual Machine (JVM). For investigating these problems, JVM Heap Memory is often the first place to look at. 

Diagnosing the JVM Heap Memory is a two step process: first we generate a heap dump on the server and then try to identify memory leak by analyzing all the objects on the heap. To see this in action, we will first trigger an OutOfMemoryException, and then capture the heap dump. We will next analyze this heap dump to identify the cause of the momory leak. 

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/graphql" %}

## What is a Heap Dump
Whenever we create a Java object by creating an instance of a class , it is always placed in an area known as the heap. Classes of the Java runtime are also created in this heap. The heap gets created when the JVM starts up and expands or collapses when the application runs to accommodate the objects created or destroyed while running the application. 

When the heap becomes full, garbage collection process is run to collect the objects with no reference. More information on memory management can be found in the [Oracle docs](https://docs.oracle.com/cd/E13150_01/jrockit_jvm/jrockit/geninfo/diagnos/garbage_collect.html). 

**Heap dumps contain a snapshot of all the live objects that are being used by a running Java™ application on the Java heap.** We can obtain detailed information for each object instance, such as the address, type, class name, or size, and whether the instance has references to other objects.

Heap dumps have two formats: the classic format and the Portable Heap Dump (PHD) format. PHD is the default format. The classic format is readable since it is in ascii text, but the PHD format is binary and should be processed by appropriate tools for analysis.


## Sample Program to Generate OutofMemoryException
To explain the analysis of heap dump, we will use a simple Java program to generate an OutofMemoryException:
```java
public class OOMGenerator {

  /**
   * @param args
   * @throws Exception 
   */
  public static void main(String[] args) throws Exception {
 
        int dummyArraySize = 15;
        System.out.println("Max JVM memory: " + Runtime.getRuntime().maxMemory());
        long memoryConsumed = 0;
        try {
            ElectronicGood[] memoryAllocated = null;  
            for (int loop = 0; loop < Integer.MAX_VALUE; loop++) {
                memoryAllocated = new ElectronicGood[dummyArraySize];
                memoryAllocated[0] = new ElectronicGood();
                memoryConsumed += dummyArraySize * Long.SIZE;
                System.out.println("Memory Consumed till now: " + memoryConsumed);
                dummyArraySize *= dummyArraySize * 2;
                Thread.sleep(5000);
            }
        } catch (OutOfMemoryError outofMemory) {
            System.out.println("Catching out of memory error");
            //Log the information,so that we can generate the statistics (latter on).
            throw outofMemory;
        }
  }
}

```
Running this program will trigger an OutOfMemoryError. In this program, we are allocating a large chunk of memory, which is exhausting heap memory storage.
We keep on allocating the memory by running a `for` loop until a point is reached, when JVM does not have enough memory to allocate, resulting in an OutOfMemoryError being thrown. 

## Finding the Cause of Outofmemory
We will now find the cause of this error by doing a Heap Dump analysis. This is done in two steps. First we capture the heap dump and then analyze the heap dump file to locate the suspected reason. We can capture heap dump in multiple ways.

Let us capturing the heap map for our example first with jmap and then with a `VM` argument:

### Generating Heap Dump on Demand with jmap
jmap is packaged with JDK and extracts the heap dump to a specified file location. 

For generating heap dump with `jmap`, we first find the process ID of our running Java program with the `jps` tool to list down all the running Java processes on our local machine:

```shell
...:~ fab$ jps
10514 
24007 
41927 OOMGenerator
41949 Jps
```
After running the `jps` command, we can see the processes are listed in the format “<pid> <MainClass>”.

Next we run the `jmap` command to generate the heap dump file:
```shell
jmap -dump:live,file=mydump.hprof 41927
```
After running this command the heap dump file with extension `hprof` is created. The option live is used to collect only the live objects that still have a reference in the running code. With the live option, a full GC is triggered to sweep away unreachable objects and then dump only the live objects.

### Generating Heap Dump at the Point of Crash with VM argument HeapDumpOnOutOfMemoryError

This option is used to capture heap dump at the point where OutOfMemoryError occured. This helps to diagnose the problem because we can see what objects were sitting in memory and what percentage of memory they were occupying when java.lang.OutOfMemoryError occurred.

We will use this option for our example, since we are more interested in the cause of the crash. Let us run the program with this VM option from the command line or our favourite IDE to generate the heap dump file.
 ```shell
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=<File path>hdump.hprof
```
After running our Java program with these `VM` arguments, we get the output:
```shell
Max JVM memory: 2147483648
Memory Consumed till now: 960
Memory Consumed till now: 29760
Memory Consumed till now: 25949760
java.lang.OutOfMemoryError: Java heap space
Dumping heap to <File path>/hdump.hprof ...
Heap dump file created [17734610 bytes in 0.031 secs]
Catching out of memory error
Exception in thread "main" java.lang.OutOfMemoryError: Java heap space
  at io.pratik.OOMGenerator.main(OOMGenerator.java:25)

```
As we can see from the output, the heap dump file with name : `hdump.hprof` is created when the `OutOfMemoryError` occurs.

### Other Methods of Generating Heap Dump
Some of the other methods of genertaing Heap Dump are:
 
1. jcmd
jcmd tool is used to send diagnostic command requests to the JVM. It is packaged as part of JDK. It can be found in \bin folder.

2. JVisualVM
Usually analyzing heap dump takes more memory than the actual heap dump size. This could be problematic if we are trying to analyze heap dump from a large server on a development machine. For instance, a server may have crashed with a heap dump of size 24 GB and your local machine may only have 16 GB of memory. Therefore, tools like MAT, Jhat won’t be able to load the heap dump file. In this case, you should either analyze the heap dump on the same server machine which doesn’t have memory constraint or use live memory sampling tools provided by VisualVM.

3. JMX

4. Programmatic

### Analyzing the Heap Dump
Eclipse Memory Analyzer Tool (MAT) is one of the best tools to analyze Java Heap Dumps.
Let us understand the basic concepts of Java heap dump analysis with MAT by analyzing the heap dump file we generated earlier. 

We will first start the Memory Analyzer Tool and open the heap dump file. In Eclipse MAT, two types of object sizes are reported:

Shallow Size: The shallow heap of an object is its size in the memory
Retained Size: Retained heap is the amount of memory that will be freed when an  object is garbage collected. 

After opening the heap dump, we see a piechart of the biggest objects by retained size as shown here:

![PieChart](/assets/img/posts/heapdump/piechart.png)

`ProductGroup` and `ProductManager` are the biggest objects with retained sizes 1 GB and 650 MB.

We can also see the objects present in the heap :
![PieChart](/assets/img/posts/heapdump/objectsinheap.png)

### Leak Suspects Report
Next we generate the "Leak Suspects Report" by clicking the “Leak Suspects” link in the overview or by choosing this option from the menu.

Before generating this report the Memory Analyzer Tool tries to find suspected big object or set of objects and presents the findings in a HTML report. The HTML report is also saved in a zip file next to the heap dump file. Due to its smaller size, it is preferable to share this report with specialized teams instead of the raw heap dump file.

The first thing in the report is the pie chart, which gives the size of the suspect (the darker color). 

![leakssuspectPieChart](/assets/img/posts/heapdump/leaksuspectpiechart.png)

For our example, it is more than 90%(31.5 out of 32.3 MB) of the whole heap.

Then follows a short description, which tells us that One instance of "io.pratik.models.ProductGroup" loaded by "jdk.internal.loader.ClassLoaders$AppClassLoader @ 0x758627ae8" occupies 1,09,58,18,944 (61.63%) bytes. The memory is accumulated in one instance of "java.lang.Object[]", loaded by "<system class loader>", which occupies 1,09,58,18,904 (61.63%) bytes.

![leakssuspectPieChart](/assets/img/posts/heapdump/leaksuspects.png)

So, the report gives a short description of where the problem is:
1. the name of the class keeping the memory, 
2. the component to which this class belongs, 
3. how much memory is kept, and 
4. where exactly the memory is accumulated.

### Finding the Leak Suspect
When the heap dump is opened for the first time, several index files get created, which enable us to access the data efficiently afterwards. A dominator tree is also built out of the object graph.

The dominator tree models the keep alive dependencies among the objects in the heap. In this tree, every object is keeping alive all of its descendants. This means that if an object would be removed from the heap, then all of its descendants in the dominator tree would be garbage collected. The size of the object and all other objects it keeps alive we call retained size. 

the dominator tree can show us the biggest objects in the heap. Using the property from the previous point it is very easy to compute the retained size for every single object. Then ordering the objects by size is trivial.

It presents a part of the dominator tree and the size of the circles represents the retained size of the objects: the bigger the circle, the bigger the object.

We simply treat all objects with size over a certain threshold as suspects. Then we go down the dominator tree and try to reach an object all of whose children are significantly smaller in size. This is what we call the “accumulation point”. Then we just take these two objects - the suspect and the accumulation point - and use them to describe the problem.

### Reachability
GC is perfomed in two steps:
1. Mark all objects reachable from GC root. These are called reachable
2. Sweep all objects not reachable from GC root.


The GC roots are the objects accessible from outside the heap. The GC algorithms build a tree of live objects starting from these GC roots.
Some GC roots are:

System Class: Class loaded by bootstrap/system class loader.
Thread Block: Objects referred to from currently active thread blocks. (Basically all objects in active thread blocks when a GC is happening are GC roots)
Thread: Active Threads
Java Local: All local variables (parameters, objects or methods in thread stacks)
JNI Local: Local variables in native code
JNI Global: Global variables in native code


### Java Agent
Java agents are a special type of class which can be used to profile our Java applications. They use the Java Instrumentation API to intercept applications running on the JVM and modify their bytecode. 

## Conclusion
In this post we introduced Heap Dump as a snapshot of Java's object memory graph. We then saw different ways of capturing a Heap Dump.  We also looked at some of basic concepts of heap dump analysis with Eclipse Memory Analyzer using a sample application. I covered some basics of generating heap dumps, reachability, GC roots, shallow vs. retained heap, and dominator tree.
There are many more things that I haven’t covered. For example, the Object Query Language (OQL). The OQL is an SQL-like language. When comparing with SQL, we can consider classes as tables, objects as rows and fields as columns. I didn’t use OQL with the sample application, but there are many cases that OQL will be very useful. Eclipse MAT’s help is the best place to start learning OQL.

