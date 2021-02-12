---
title: "Create and Analyze Heap Dump"
categories: [spring-boot]
date: 2021-01-20 06:00:00 +1000
modified: 2021-01-20 06:00:00 +1000
author: pratikdas
excerpt: "This post looks at investigating memory problems in a Java Application by capturing a heap dump and then analyzing it with memory analyzer tools. "
image:
  auto: 0001-network
---

As Java developers, we are familiar with our applications throwing OutOfMemory exceptions or our server monitoring tools throwing alerts complaining about high JVM Memory utilization in the Java Virtual Machine (JVM). 

For investigating these problems, JVM Heap Memory is often the first place to look at. 

To see this in action, we will first trigger an OutOfMemoryException, and then capture the heap dump. We will next analyze this heap dump to identify the potential objects which could be the cause of the memory leak. 

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/graphql" %}

## What is a Heap Dump
Whenever we create a Java object by creating an instance of a class, it is always placed in an area known as the heap. Classes of the Java runtime are also created in this heap. 

The heap gets created when the JVM starts up. The heap expands or collapses when the application runs to accommodate the objects created or destroyed while running the application. 

When the heap becomes full, the garbage collection process is run to collect the objects with no reference. More information on memory management can be found in the [Oracle docs](https://docs.oracle.com/cd/E13150_01/jrockit_jvm/jrockit/geninfo/diagnos/garbage_collect.html). 

**Heap dumps contain a snapshot of all the live objects that are being used by a running Java application on the Java heap.** We can obtain detailed information for each object instance, such as the address, type, class name, or size, and whether the instance has references to other objects.

Heap dumps have two formats: the classic format and the Portable Heap Dump (PHD) format. PHD is the default format. The classic format is readable since it is in ASCII text, but the PHD format is binary and should be processed by appropriate tools for analysis.


## Sample Program to Generate OutofMemoryException
To explain the analysis of heap dump, we will use a simple Java program to generate an OutofMemoryException:
```java
public class OOMGenerator {

  /**
   * @param args
   * @throws Exception 
   */
  public static void main(String[] args) throws Exception {
    
    System.out.println("Max JVM memory: " + Runtime.getRuntime().maxMemory());
    try {
      ProductManager productManager = new ProductManager();
      productManager.populateProducts();
      
    } catch (OutOfMemoryError outofMemory) {
      System.out.println("Catching out of memory error");
      // Log the information,so that we can generate the statistics (latter on).
      throw outofMemory;
    }
  }
}
```

```java

public class ProductManager {
  private static ProductGroup regularItems = new ProductGroup();

  private static ProductGroup discountedItems = new ProductGroup();

  public void populateProducts() {

    int dummyArraySize = 1;
    for (int loop = 0; loop < Integer.MAX_VALUE; loop++) {
      if(loop%2 == 0) {
        createObjects(regularItems, dummyArraySize);
      }else {
        createObjects(discountedItems, dummyArraySize);
      }
      System.out.println("Memory Consumed till now: " + loop + "::"+ regularItems + " "+discountedItems );
      dummyArraySize *= dummyArraySize * 2;
      //Thread.sleep(5000);
    }
  }
 
  private void createObjects(ProductGroup productGroup, int dummyArraySize) {
    for (int i = 0; i < dummyArraySize; ) {
      productGroup.add(createProduct());
    }
  }
  
  private AbstractProduct createProduct() {
        int randomIndex = (int) Math.round(Math.random() * 10);
        switch (randomIndex) {
          case 0:
            return  new ElectronicGood();
          case 1:
            return  new BrandedProduct();
          case 2:
            return new GroceryProduct();
          case 3:
            return new LuxuryGood();
          default:
            return  new BrandedProduct();
        }
    
  }

}

```
Running this program will trigger an OutOfMemoryError. In this program, we are creating and adding objects inside a `for` loop, which is exhausting heap memory storage. 

We keep on allocating the memory by running a `for` loop until a point is reached, when JVM does not have enough memory to allocate, resulting in an OutOfMemoryError being thrown. 

## Finding the Cause of OutofMemory Error
We will now find the cause of this error by doing a heap dump analysis. This is done in two steps:
1. Capture the heap dump 
2. Analyze the heap dump file to locate the suspected reason. 

We can capture heap dump in multiple ways.Let us capture the heap dump for our example first with `jmap` and then by passing a `VM` argument in the command line:

### Generating Heap Dump on Demand with jmap
`jmap` is packaged with JDK and extracts the heap dump to a specified file location. 

For generating heap dump with `jmap`, we first find the process ID of our running Java program with the `jps` tool to list down all the running Java processes on our local machine:

```shell
...:~ fab$ jps
10514 
24007 
41927 OOMGenerator
41949 Jps
```
After running the `jps` command, we can see the processes are listed in the format “<pid> <MainClass>”.

Next, we run the `jmap` command to generate the heap dump file:
```shell
jmap -dump:live,file=mydump.hprof 41927
```
After running this command the heap dump file with extension `hprof` is created. 

The option live is used to collect only the live objects that still have a reference in the running code. With the live option, a full GC is triggered to sweep away unreachable objects and then dump only the live objects.

### Generating Heap Dump at the Point of Crash with VM argument HeapDumpOnOutOfMemoryError

This option is used to capture heap dump at the point where OutOfMemoryError occurred. This helps to diagnose the problem because we can see what objects were sitting in memory and what percentage of memory they were occupying when java.lang.OutOfMemoryError occurred.

We will use this option for our example, since we are more interested in the cause of the crash. Let us run the program with this `VM` option from the command line or our favorite IDE to generate the heap dump file.
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
Some of the other methods of generating a heap dump are:
 
1. jcmd
jcmd tool is used to send diagnostic command requests to the JVM. It is packaged as part of JDK. It can be found in \bin folder.

2. JVisualVM
Usually analyzing heap dump takes more memory than the actual heap dump size. This could be problematic if we are trying to analyze heap dump from a large server on a development machine. 

For example, a server may have crashed with a heap dump of size 24 GB and our local machine may only have 16 GB of memory. Therefore, tools like MAT will not be able to load the heap dump file. In this case, we should either analyze the heap dump on the same server machine if it does not have any memory constraint or use live memory sampling tools provided by VisualVM.



### Analyzing the Heap Dump
Some of the answers we look for by analyzing the heap dump are :
1. Objects with high memory usage
2. Object graph to identify objects of not releasing memory
3. Reachable and unreachable objects

Eclipse Memory Analyzer Tool (MAT) is one of the best tools to analyze Java heap dumps.
Let us understand the basic concepts of Java heap dump analysis with MAT by analyzing the heap dump file we generated earlier. 

We will first start the Memory Analyzer Tool and open the heap dump file. In Eclipse MAT, two types of object sizes are reported:

**Shallow heap size**: The shallow heap of an object is its size in the memory
**Retained heap size**: Retained heap is the amount of memory that will be freed when an object is garbage collected. 

#### Overview Section in MAT
After opening the heap dump, we will see an overview of the applications memory usage.
The piechart shows the biggest objects by retained size in the `overview` tab as shown here:

![PieChart](/assets/img/posts/heapdump/piechart.png)

For our application, this information in the overview means if we could dispose a particular instance of `java.lang.Thread` we will save 1.7 GB, and almost all of the memory used in this application. 

#### Histogram View
While that might look promising, java.lang.Thread is unlikely to be the real problem here. To get a better insight of what objects currently exist, we will use the Histogram view:

![histogram](/assets/img/posts/heapdump/histogram.png)

We have filtered the histogram with a regular expression "io.pratik.* " to show only the classes that match the pattern. With this view, we can see the number of live objects: for example, 243 `BrandedProduct` objects, and 309 `Price` Objects are alive in the system. We can also see the amount of memory each object is using. 

There are two calculations, Shallow Heap and Retained Heap.  Shallow heap is the amount of memory consumed by one object. An Object requires 32 (or 64 bits, depending on the architecture) for each reference. Primitives such as integers and longs require 4 or 8 bytes, etc… While this can be interesting, the more useful metric is the Retained Heap.

#### Retained Heap Size
The retained heap size is computed by adding the size all the objects in the retained set. A retained set of X is the set of objects which would be removed by the GC when X is collected.

The retained heap can be calculated in two different ways, using the quick approximation or the precise retained size:

![retainedheap](/assets/img/posts/heapdump/retainedheap.png)

By calculating the Retained Heap we can now see that io.pratik.ProductGroup is holding the majority of the memory, even though it is only 32 bytes(shallow heap size) by itself. By finding a way to free up this object, we can certainly get our memory problem under control.

#### Dominator Tree
 The dominator tree is produced by the complex object graph generated at runtime and helps to identify the largest memory graphs. An Object X is said to dominate an Object Y if every path from the Root to Y must pass through X. Looking at the dominator tree for our example, we can start to see where the bulk of our memory is leaking.
![dominatortree](/assets/img/posts/heapdump/dominatortree.png)
By looking at the dominator tree, we can easily see that the `ProductGroup` object  holds the memory instead of the `Thread` object. We can probably fix the memory problem by releasing these objects. 

#### Object References
`ProductGroup` and `ProductManager` are the biggest objects with retained sizes of 1 GB and 650 MB respectively.

We will now see the objects present in the heap by selecting `ProductGroup` in the piechart and then selecting `List Objects` -> `with outgoing references` from the context menu:
![path to list objects](/assets/img/posts/heapdump/pathtolistobjects.png)
![Objects in heap](/assets/img/posts/heapdump/objectsinheap.png)

Here we can see our `ArrayList` element named `products` as the outgoing reference for `ProductGroup` which appears in our code as:

```java
public class ProductGroup {
  
  private List<AbstractProduct> products = 
           new ArrayList<AbstractProduct>();
  
  public void add(AbstractProduct product) {
    products.add(product);
  }
}
``` 

#### Leak Suspects Report
We can also generate a "Leak Suspects Report" to find suspected big object or set of objects. This report presents the findings in a HTML page and is also saved in a zip file next to the heap dump file. 

Due to its smaller size, it is preferable to share "Leak Suspects Report" report with teams specialized in performing analysis tasks instead of the raw heap dump file.

The report has a pie chart, which gives the size of the suspected objects: 

![leakssuspectPieChart](/assets/img/posts/heapdump/leaksuspectpiechart.png)

For our example, we have one suspect labelled as "Problem Suspect 1" which is further described with a short description:

![leakssuspects](/assets/img/posts/heapdump/leaksuspects.png)


## Conclusion
In this post, we introduced heap dump as a snapshot of a Java application's object memory graph at runtime. To illustrate heap dump, we captured the heap dump from a program which threw an OutOfMemory error at runtime. 

We then looked at some of the basic concepts of heap dump analysis with Eclipse Memory Analyzer like large objects, GC roots, shallow vs. retained heap, and dominator tree, all of which together will help us to identify the root cause of specific memory issues.

