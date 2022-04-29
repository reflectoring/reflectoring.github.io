---
title: "Comprehensive Guide to Java Streams"
categories: ["java"]
date: 2022-04-24T05:00:00
modified: 2022-04-24T05:00:00
authors: [pratikdas]
excerpt: "Comprehensive Guide to Java Streams"
image: images/stock/0019-magnifying-glass-1200x628-branded.jpg
url: comprehensive-guide-to-java-streams
---

A stream is a sequence of elements on which we can perform different kind of sequential and parallel operations. The Stream API was introduced in Java 8 and is used to process collections of objects. Unlike collections, a Java stream is not a data structure instead it takes input from Collections, Arrays or I/O channels (like files).

In this post we will look at the various types of operations which we can perform on Java Streams.

{{% github "https://github.com/thombergs/code-examples/tree/master/java/streams" %}}

## Java Stream Classes
The `java.util.stream` package contains the the interfaces and classes to support functional-style operations on streams of elements. In addition to the `Stream` interface , which is a stream of object references, there are primitive specializations: `IntStream` for stream of elements of type: `Int`, `LongStream` for stream of elements of type: `Long`, and `DoubleStream` for stream of elements of type: `Double`.

## Creating a Stream from a Source

We can obtain Streams in a number of ways from different type of data sources:

### Obtaining Stream From an Array
We can obtain a stream from an array using the `stream()` method of the `Arrays` class:
```java
import java.util.Arrays;
import java.util.stream.DoubleStream;

public class StreamingApp {

  public void createStreamFromArray() {
    double[] elements = {3.0, 4.5, 6.7, 2.3};
    
    DoubleStream stream = Arrays.stream(elements);
    
    stream.forEach(e->System.out.println(e));
  }

}
```
In this example, we are creating a stream of double elements from an array and printing them by calling a `forEach()` function on the stream. 
### Obtaining Stream From a Collection

We can obtain a stream from a collection using the `stream()` and `parallelStream()` methods:

```java
import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;

public class StreamingApp {
  
  public void createStreamFromCollection() {
    Double[] elements = {3.0, 4.5, 6.7, 2.3};
    List<Double> elementsInCollection = Arrays.asList(elements);
    
    Stream<Double> stream = elementsInCollection.stream();
    
    Stream<Double> parallelStream = elementsInCollection.parallelStream();
    
    stream.forEach(e->System.out.println(e));
    
    parallelStream.forEach(e->System.out.println(e));
  }

}
```
Here we are creating two streams of double elements using the `stream()` and `parallelStream()` methods the from a collection of type `List` and printing them by calling a `forEach()` function on the streams. The elements in the `stream` object are processed in serial while those in the object `parallelStream` will be processed in parallel. 

We will understand parallel streams in a subsequent section. 

### Obtaining Stream From Static Factory Methods on the Stream Classes
We can construct stream by calling static factory methods on the stream classes as shown in this example: 
```java
import java.util.stream.Stream;

public class StreamingApp {
  
  public void createStreams() {
    Stream<Integer> stream = Stream.of(3, 4, 6, 2);
    
    IntStream integerStream = IntStream.of(3, 4, 6, 2);
    
    LongStream longStream = LongStream.of(3l, 4l, 6l, 2l);

    DoubleStream doubleStream = DoubleStream.of(3.0, 4.5, 6.7, 2.3);    
  }
}
```
In this example, we are creating streams of `integer`, `long`, and `double` elements using the static factory method `of()` on the `Stream` classes. We have also used the different types of Streams starting with the `Stream` abstraction followed by the primitive specializations: `IntStream`, `LongStream`, and `DoubleStream`.

### Obtaining Stream From Files
The lines of a file can be obtained from BufferedReader.lines();
Streams of file paths can be obtained from methods in Files;
Streams of random numbers can be obtained from Random.ints();
Numerous other stream-bearing methods in the JDK, including BitSet.stream(), Pattern.splitAsStream(java.lang.CharSequence), and JarFile.stream().

Streams have a BaseStream.close() method and implement AutoCloseable, but nearly all stream instances do not actually need to be closed after use. Generally, only streams whose source is an IO channel (such as those returned by Files.lines(Path, Charset)) will require closing. Most streams are backed by collections, arrays, or generating functions, which require no special resource management. (If a stream does require closing, it can be declared as a resource in a try-with-resources statement.)

## Type of Operations on Streams
The Operations we can perform on Stream classes are broadly categorized into two types:

1. **Intermediate operations**: Intermediate operations transform one stream to another stream. Example of an Intermediate operation is a `map()` which transforms one element into another by applying a function (called a predicate) on each element.

2. **Terminal operations**: Terminal operations are applied on a stream to get a single result like a primitive or object or collection or may not return anything. Example of a Terminal operation is a `count()` which counts the total number of elements in a stream.


Let us look at the different intermediate and terminal operations in the subsequent sections. We have grouped these operations into the following categories:

* **Mapping Operations**: These are intermediate operations and transform each element of a stream by applying a function and put them in a new stream for further processing.
* **Ordering Operations**: These are terminal operations which 
* **Matching and Filtering Operations**:
* **Reduction Operations**:

## Stream Mapping Operations
Mapping Operations are intermediate operations and transform each element of a stream with the help of a predicate function:
### map Operation
The map function returns a stream consisting of the results of applying the given function to the elements of a stream. In this example, we use the `map()` operation to get a stream of the numeric category codes of a stream of category names:
```java
public class StreamingApp {
  public void mapStream() {
    Stream<String> productCategories = Stream.of("washing machine", "Television", "Laptop", "grocery", "essentials");
  
    List<String> categoryCodes = productCategories.map(element->{
       String code = null;
       switch (element) {
        case "washing machine" : code = "1";break;
        case "Television" : code = "2";break;
        case "Laptop" : code = "3";break;
        case "grocery" : code = "4";break;
        case "essentials" : code = "5";break;
        case "default" : code = "6";
      } 
      return code;}).collect(Collectors.toList());

      categoryCodes.forEach(logger::info);  
    }
}

```
Here in the mapping function we are converting each category name to a numeric value so that the the `map()` operation on the stream returns a stream of category codes.
### flatMap Operation
We should use the `flatMap()` method, if we have a stream where every element has its own sequence of elements and we want to create a single stream of these inner elements:

```java
public class StreamingApp {
  public void flatmapStream() {

    List<List<String>> productByCategories = Arrays.asList( 
      Arrays.asList("washing machine", "Television"), 
      Arrays.asList("Laptop", "Camera", "Watch"), 
      Arrays.asList("grocery", "essentials"));

    List<String> products = productByCategories
                                .stream()
                                .flatMap(Collection::stream)
                                .collect(Collectors.toList());

    logger.info("flattened elements::" + products); 
  }
    
}

```    
In this example, each element of the stream is a list. We are apply the `flatMap()` operation to get a list of all the inner elements as shown in this output:
```shell
INFO: flattened elements::[washing machine, Television, Laptop, Camera, Watch, grocery, essentials]
```
## Ordering Operations
Ordering operations on a stream include:
1. `sorted()` which sorts the stream elements according to natural order 
2. an overriden method `sorted(comparator)` which sorts the stream elements according to a provided `Comparator` instance.

```java
public class StreamOrderingApp {

    public void sortElements() {
        Stream<Integer> productCategories = Stream.of(4,15,8,7,9,10);
        Stream<Integer>  sortedStream = productCategories.sorted();
        sortedStream.forEach(System.out::println);
    }

    public void sortElementsWithComparator() {
        Stream<Integer> productCategories = Stream.of(4,15,8,7,9,10);
        Stream<Integer>  sortedStream = productCategories.sorted((o1, o2) -> o2 - o1);
        sortedStream.forEach(System.out::println);
    }
}
```
In the `sortElements()` function we are sorting the integer elements in their natural order.
In the `sortElementsWithComparator()` function we are sorting the integer elements by using a comparator function to sort them in a descending order. The comparator function should return positive or negative value.

Both methods are intermediate operations so we still need to call a terminal operation to trigger the sorting.

## Matching and Filtering Operations
The Stream interface provides methods to detect whether the elements of a stream comply to a condition (called the predicate) specified as input:

### `anyMatch()` 

With `anyMatch()` operation, we determine whether any of the elements comply to the condition specified as the predicate as shown in this example:

```java
public class StreamMatcherApp {
    private final Logger logger = Logger.getLogger(StreamMatcherApp.class.getName());

    public void findAnyMatch(){
        Stream<String> productCategories = Stream.of(
                                                    "washing machine", 
                                                    "Television", 
                                                    "Laptop", 
                                                    "grocery", 
                                                    "essentials");
      
        boolean isPresent = productCategories.anyMatch(e->e.equals("Laptop")); 
        logger.info("isPresent::"+isPresent);

    }
    
}
```
Here we are checking whether the stream contains an element with value `Laptop`. Since one of the values in the stream is `Laptop`, we get result of the `anyMatch()` operation as `true`. 

We would have received a `false` result if we were checking for a value for example `e->e.equals("Shoes") ` in our predicate function, which is not present in the stream.
### `allMatch()`
With `allMatch()` operation, we determine whether all of the elements comply to the condition specified as the predicate as shown in this example:
```java
public class StreamMatcherApp {
    private final Logger logger = Logger.getLogger(StreamMatcherApp.class.getName());

    public void findAllMatch(){
        Stream<Integer> productCategories = Stream.of(4,5,7,9,10);
      
        boolean allElementsMatch = productCategories.allMatch(e->e < 11);
        logger.info("allElementsMatch::"+allElementsMatch);

    }    
}
```

### noneMatch
With `noneMatch()` operation, we determine whether none of the elements comply to the condition specified as the predicate as shown in this example:
```java
public class StreamMatcherApp {
    private final Logger logger = Logger.getLogger(StreamMatcherApp.class.getName());

    public void findNoneMatch(){
        Stream<Integer> productCategories = Stream.of(4,5,7,9,10);
      
        boolean noElementsMatch = productCategories.noneMatch(e->e < 4);
        logger.info("noElementsMatch::"+noElementsMatch);
    }
}
```
All of these methods are terminal operations that return a boolean:

### filter

```java
public class StreamingApp {
  public void processStream() {
      Double[] elements = {3.0, 4.5, 6.7, 2.3};
      
      Stream<Double> stream = Stream.of(elements);
      
      stream
      .map(e->e.intValue())
      .filter(e->e > 3 )
      .forEach(e->System.out.println(e));
                
    }
}

```

### findFirst
findFirst() returns an Optional for the first entry in the stream:
```java
public class StreamingApp {
  public void findFromStream() {
    Stream<String> productCategories = Stream.of(
                                              "washing machine", 
                                              "Television", 
                                              "Laptop", 
                                              "grocery", 
                                              "essentials");

    Optional<String> category = productCategories.findFirst();

    if(category.isPresent()) logger.info(category.get());
    }
}
```

## Reduction Operations
The Stream class has many terminal operations (such as average, sum, min, max, and count) that return one value by combining the contents of a stream. These operations are called reduction operations. The JDK also contains reduction operations that return a collection instead of a single value. Many reduction operations perform a specific task, such as finding the average of values or grouping elements into categories. However, the JDK provides you with the general-purpose reduction operations reduce and collect, 

### reduce Operation
The Stream.reduce method is a general-purpose reduction operation that combines the elements of a stream to produce a single value. The signature of a reduce method looks like this:

```java
T reduce(T identity, BinaryOperator<T> accumulator);
```
In this signature:
* identity: default or initial value.
* BinaryOperator: functional interface that takes two inputs to produce a new value.

Here is An example of a reduce operation that adds the elements of a stream:

```java
   public void sumElements(){
        int[] numbers = {5, 2, 8, 4,55, 9};
        int sum = Arrays.stream(numbers).reduce(0, (a, b) -> a + b);
        int sumWithMethodRef = Arrays.stream(numbers).reduce(0, Integer::sum); 

        logger.info(sum + " " + sumWithMethodRef);
    }

    public void joinString(final String separator){
        String[] strings = {"a", "b", "c", "d", "e"};

        String joined = Arrays.stream(strings).reduce("", (a, b) -> {
            return !"".equals(a)?  a + separator + b : b;
           });

        // a|b|c|d|e , better uses the Java 8 String.join :)
        //String joined = String.join(separator, strings);

        logger.info(joined);
    }
```

Please note there is already a String method:`join` for joing strings.


```java
String joined = String.join(separator, strings);

```
Another overriden method of reduce takes only the accumulator as input parameter:
```java
Optional<T> reduce(BinaryOperator<T> accumulator);
```

### Specialized Reduction Functions

```java
public class ReduceStreamingApp {
  public void aggregateElements(){
      int[] numbers = {5, 2, 8, 4,55, 9};
      int sum = Arrays.stream(numbers).sum();
      OptionalInt max = Arrays.stream(numbers).max();
      OptionalInt min = Arrays.stream(numbers).max();
      long count = Arrays.stream(numbers).count();

      OptionalDouble average  = Arrays.stream(numbers).average();
  }
}

```
In this signature, there is no default or initial value, and it returns an optional.
### collect

`collect()` is a commonly used operation to get the elements from a stream after completing all the processing:

```java
public class StreamingApp {
  public void collectFromStream() {
    
      List<String> productCategories = Stream.of(
                                                "washing machine", 
                                                "Television", 
                                                "Laptop", 
                                                "grocery", 
                                                "essentials")
                                              .collect(Collectors.toList());

      productCategories.forEach(logger::info);                 
  }
}
```

### forEach
The `forEach()` operation loops over the stream elements, calling the supplied function on each element.

```java
public class StreamingApp {
 public void printStream() {
    Stream<String> productCategories = Stream.of(
                                              "washing machine", 
                                              "Television", 
                                              "Laptop", 
                                              "grocery", 
                                              "essentials");
  
    productCategories.forEach(logger::info);   
  }
}
```

## Chaining Operation in a Pipeline
Operations on streams are commonly chained together to form a pipeline as shown in this code snippet:

```java
public class StreamingApp {
  public void processStream() {
    Double[] elements = {3.0, 4.5, 6.7, 2.3};
    
    Stream<Double> stream = Stream.of(elements);
    
    // Pipeline of stream operations
    int numberOfElements = stream
    .map(e->e.intValue())
    .filter(e->e >3 )
    .count();           
  }
}
```
In this example, We have created a pipeline of two intermmediate operations `map()` and `filter()` chained together with a terminal operation `count()`.
Intermediate operations are present in the middle of the pipeline. Terminal operations are attached to the end of the pipeline. Intermediate operations are lazily loaded and executed when the terminal operation is called on the stream. 


## Handling Nullable Streams
In some earlier examples we used the static factory method of Stream: Stream.of to create a stream with elements. Now if any of the values in that list is null, we will get a nullpointerexception. The isNullable method was introduced in Java 9 to mitigate this behaviour.

It creates a Stream with the supplied elements and if the value is null an empty Stream is created as shown in this example:

```java
public class StreamingApp {
  public void createFromNullable() {
    Stream<String> productCategories = Stream.ofNullable(null);

    long count = productCategories.count();

    logger.info("size=="+count);
  }
}

```

## Unbounded Streams

The `generate()` method returns an infinite sequential unordered stream where each element is generated by the provided Supplier. This is suitable for generating constant streams, streams of random elements, etc.

### generate
```java
public class UnboundedStreamingApp {
    private final Logger logger = Logger.getLogger(
                                   UnboundedStreamingApp.class.getName());

    public void generateStreamingData(){
        Stream.generate(()->UUID.randomUUID().toString())
        .limit(10)
        .forEach(logger::info);
    }
}

```
Here, we pass Math::random() as a Supplier, which returns the next random number.

With infinite streams, we need to provide a condition to eventually terminate the processing. One common way of doing this is using limit(). In above example, we limit the stream to 5 random numbers and print them as they get generated.

Please note that the Supplier passed to generate() could be stateful and such stream may not produce the same result when used in parallel.

### iterate
iterate() takes two parameters: an initial value, called seed element and a function which generates next element using the previous value. iterate(), by design, is stateful and hence may not be useful in parallel streams:

```java

public class UnboundedStreamingApp {
   private final Logger logger = Logger.getLogger(
                                  UnboundedStreamingApp.class.getName());

   public void iterateStreamingData(){
        Stream<Double> evenNumStream = Stream.iterate(
                                           2.0, 
                                           element -> Math.pow(element, 2.0));

        List<Double> collect = evenNumStream
        .limit(5)
        .collect(Collectors.toList());

        collect.forEach(element->logger.info("value=="+element));
    }
}

```    
Here, we have set `2` as the seed value, which becomes the first element of our stream. This value is passed as input to the lambda, which returns `4`. This value, in turn, is passed as input in the next iteration.

This continues until we generate the number of elements specified by limit() which acts as the terminating condition.

## Parallel Streams

We can execute streams in serial or in parallel. When a stream executes in parallel, the Java runtime partitions the stream into multiple substreams. Aggregate operations iterate over and process these substreams in parallel and then combine the results.

When we create a stream, it is serial stream by default. We create a parallel stream by invoking the operation `parallelStream()` on the `Collection` or the `BaseStream` interface. For example, the following statement calculates the average age of all male members in parallel:

```java
public class ParallelStreamingApp {

    public void processParallelStream(){
        List<String> list = List.of("washing machine", "Television", "Laptop", "grocery");
        
        list.parallelStream().forEach(System.out::println);
        
        list.parallelStream().forEachOrdered(System.out::println);
    }
    
}

```

The third and fourth pipelines print the elements of the list in an apparently random order. Remember that stream operations use internal iteration when processing elements of a stream. Consequently, when you execute a stream in parallel, the Java compiler and runtime determine the order in which to process the stream's elements to maximize the benefits of parallel computing unless otherwise specified by the stream operation.
The fifth pipeline uses the method forEachOrdered, which processes the elements of the stream in the order specified by its source, regardless of whether you executed the stream in serial or parallel. Note that you may lose the benefits of parallelism if you use operations like forEachOrdered with parallel streams.

## Conclusion 
In this article, we introduced streams in Java. 