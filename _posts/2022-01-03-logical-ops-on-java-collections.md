---
title: "Common Operations on Java Collections"
categories: [java]
date: 2022-01-02 06:00:00 +1000
modified: 2022-01-02 06:00:00 +1000
author: pratikdas
excerpt: "Collections are containers to group multiple items in a single unit. They are an essential feature of almost all programming languages, most of which support different types of collections such as List, Set, Queue, Stack, etc. Java also supports a rich set of collections packaged in the Java Collections Framework. In this article, we will look at some common operations on Java Collections."
image:
  auto: 0074-stack
---

Collections are containers to group multiple items in a single unit. For example, a collection can represent a stack of books, products of a category, a queue of text messages, etc. They are an essential feature of almost all programming languages, most of which support different types of Collections such as `List`, `Set`, `Queue`, `Stack`, etc. 

Java also supports a rich set of collections packaged in the Java Collections Framework.

In this article, we will look at some examples of performing common operations on collections like addition (joining), splitting, finding the union, and the intersection between two or more collections. 

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/core-java/collectionops" %}

## Java Collections Framework
A Collections Framework is a unified architecture for representing and manipulating collections. The Java Collections Framework is one of the core parts of the Java programming language. It provides a set of interfaces and classes to implement various data structures and algorithms along with several methods to perform various operations on collections. 

The `Collection` interface is the root interface of the Collections framework hierarchy.

Java does not provide direct implementations of the `Collection` interface but provides implementations of its subinterfaces like `List`, `Set`, and `Queue`. The official documentation of the [Java Collection Interface](https://docs.oracle.com/javase/8/docs/api/java/util/Collection.html) is the go-to guide for everything related to collections. Here, we will cover the methods to perform common operations between one or more collections.

We have divided the common operations on collections which  we will look at here, into two groups:
* Logical Operations: AND, OR, NOT, and XOR between two collections
* Other Operations on Collections based on class methods of the `Collection` and `Stream` classes.

## Logical Operations on Collections
We will cover the following logical Operations between two collections :
* **OR**: for getting a union of elements in two collections
* **AND**: for getting an intersection of elements in two collections
* **XOR**: exclusive OR for finding mismatched elements from two collections
* **NOT**: for finding elements of one collection not present in a second collection

### OR - Union of Two Collections

The union of two collection `A` and `B` is a set containing all elements that are in `A` or `B` or both.

![union of two Collections](/assets/img/posts/logical-ops-java-coll/union.png)

We can find the union of two collections by using the collection of type `Set` which can hold only distinct elements:
```java
public class CollectionHelper {
    public List<Integer> union(
        final List<Integer> collA, 
        final List<Integer> collB){

        Set<Integer> set = new LinkedHashSet<>();

        // add all elements of collection A
        set.addAll(collA);

        // add all elements of collection B
        set.addAll(collB);
        
        return new ArrayList<>(set);
        
    }
}
```
Here we are first adding all the elements of each collection to a [Set](https://docs.oracle.com/javase/8/docs/api/java/util/Set.html), which excludes any repeating elements by its property of not containing any duplicate elements. 

We have used the `LinkedHashSet` implementation of the `Set` interface to preserve the order of the elements in the resulting collection.

The output of running this `union()` method on a sample data of two collections looks like this:

Collection A: [9, 8, 5, 4, 7] 
Collection B: [1, 3, 99, 4, 7] 
   A union B: [9, 8, 5, 4, 7, 1, 3, 99]


### AND - Intersection of Two Collections

Next, we will use Java's `Stream` class for finding the intersection of two collections:

![intersection of two collections](/assets/img/posts/logical-ops-java-coll/intersection.png)

```java
public class CollectionHelper {
    public List<Integer> intersection(
                            final List<Integer> collA, 
                            final List<Integer> collB){

        List<Integer> intersectElements = collA
                                            .stream()
                                            .filter(collB :: contains)
                                            .collect(Collectors.toList());
        
        if(!intersectElements.isEmpty()) {
            return intersectElements;
        }else {
            return Collections.emptyList();
        }
        
    }
}
```
For finding the intersection of two collections, we run the `filter()` method on the first collection to identify and collect the matching elements from the second collection. 

The intersection of two Collections [9, 8, 5, 4, 7] and [1, 3, 99, 4, 7] results in a single collection : [ 4, 7].


### XOR - Finding Different Elements from Two Collections
XOR (eXclusive OR) is a boolean logic operation that returns `0` or false if the bits are the same and 1 or true for different bits. Our XOR function for collections will exclude matching elements from two collections:

Collection A: [1, 2, 3, 4, 5, 6]
Collection B: [3, 4, 5, 6, 7, 8, 9]
     A XOR B: [1, 2, 7, 8, 9] - matching elements 3, 4, 5, and 6 are excluded.

```java
public class CollectionHelper {

    public List<Integer> xor(final List<Integer> collA, 
                             final List<Integer> collB){
          
          // Filter elements of A not in B
          List<Integer> listOfAnotInB = collA
                                          .stream()
                                          .filter(element->{
                                              return !collB.contains(element);
                                          })
                                          .collect(Collectors.toList());
          
          // Filter elements of B not in A
          List<Integer> listOfBnotInA = collB
                                          .stream()
                                          .filter(element->{
                                              return !collA.contains(element);
                                          })
                                          .collect(Collectors.toList());
          
          // Concatenate the two filtered lists
          return Stream.concat(
                  listOfAnotInB.stream(), 
                  listOfBnotInA.stream())
                .collect(Collectors.toList());
    }
}
    


```
Here we are first using the `filter()` method to include only the elements in the first collection which are not present in the second collection. Then we perform a similar operation on the second collection to include only the elements which are not present in the first collection followed by concatenating the two filtered collections.

### NOT - Collection of elements of one Collection Not Present in the Second Collection

We use the NOT function to select elements from one collection which are not present in the second collection as shown in this example:

Collection A: [1,2,3,4,5,6]
Collection B: [3,4,5,6,7,8,9]
     A NOT B: [1, 2, 7, 8, 9] - elements of A not in B 
     B NOT A: [7, 8, 9]       - elements of B not in A 

```java
public class CollectionHelper {
    public List<Integer> not(final List<Integer> collA, 
                             final List<Integer> collB){
          
          List<Integer> notList = collA
                                  .stream()
                                  .filter(element->{
                                      return !collB.contains(element);
                                  })
                                  .collect(Collectors.toList());
          
          return notList;
    }
}

```
Here we are using the `filter()` method to include only the elements in the first collection which are not present in the second collection.

## Other Common Operations on Collections
We will now look at some more operations on collections mainly involving splitting and joining.

### Splitting a Collection in Two Parts

Splitting a collection into multiple sub-collections is a very common task when building applications. In this example, we are splitting a collection from the center into two sub lists: 
```java
class CollectionHelper {
    public <T> List<T>[] split(List<T> listToSplit){

        // determine the endpoints to use in `list.subList()` method
      int[] endpoints = {0, (listToSplit.size() + 1)/2, listToSplit.size()};
     
        List<List<T>> sublists =
                IntStream.rangeClosed(0, 1)
                        .mapToObj(i -> listToSplit.subList(endpoints[i], endpoints[i + 1]))
                        .collect(Collectors.toList());
     
        // return an array containing both lists
        return new List[] {sublists.get(0), sublists.get(1)};
    }
}
```
Here we have used the `subList()` method of the `List` interface to split the list passed as input into two sublists and returned the output as an array of `List` elements.

When we run the `subList()` method over a collection with elements `[9, 8, 5, 4, 7, 15, 15]`, we get the elements split into two collections in the output: `[9, 8, 5, 4`] and `[7, 15, 15]`. 

### Splitting a Collection into n Equal Parts
We can generalize the previous method to partition a collection into equal parts each of a specified chunk size: 
```java
public class CollectionHelper {

    // partition collection into size equal to chunkSize
    public Collection<List<Integer>> partition(

        final List<Integer> collA, 
        final int chunkSize){

        final AtomicInteger counter = new AtomicInteger();

        final Collection<List<Integer>> result = 
                            collA
                            .stream()
                            .collect(
                                Collectors.groupingBy(
                                    it -> counter.getAndIncrement() / chunkSize))
                            .values();

        return result;
        
    }
}

```

If we run this function over a Collection with elements `[9, 8, 5, 4, 7, 15, 15]` with a chunk size of `2`, we get the output: `[[9, 8], [5, 4], [7, 15], [15]]`. 

### Removing Duplicates from a Collection

Removing duplicate elements from a collection is another frequently used operation in applications. In this example, the `removeDuplicates()` method removes any values that exist more than once in the collection, leaving only one instance of each value in the output:

```java
public class CollectionHelper {
    public List<Integer> removeDuplicates(final List<Integer> collA){
      List<Integer> listWithoutDuplicates = new ArrayList<>(
         new LinkedHashSet<>(collA));
      
      return listWithoutDuplicates;
    }
}

```
When we run this function over a collection with elements `[9, 8, 5, 4, 7, 15, 15]`, we get the output:
`[9, 8, 5, 4, 7, 15]`. Duplicate occurrence of `15` is removed in the output.

### Joining one or more Collections

The [Stream](https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html) class introduced since Java 8 provides useful methods for supporting sequential and parallel aggregate operations. In this example, we are performing the concatenation of elements from two collections using the `Stream` class:
```java
public class CollectionHelper {
    
    public List<Integer> add(final List<Integer> collA, 
                             final List<Integer> collB){

        return Stream.concat(
                collA.stream(), 
                collB.stream())
            .collect(Collectors.toList());     
    }   
}
```

Here we are concatenating two collections in the `add` method of the `CollectionHelper`class. For adding, we have used the `concat()` method of the `Stream` class. We can also extend this method to join more than two collections at a time. 

Here is the output of running this method over these two collections:

Collection A: [9, 8, 5,  4]
Collection B: [1, 3, 99, 4, 7]
      Output: [9, 8, 5,  4, 1, 3, 99, 4, 7].
The output is an aggregation of the elements from the two collections.  



## Joining Collections by Applying a Condition
We can enrich the previous example further to concatenate elements of a collection only if they meet certain criteria as shown below: 
```java
public class CollectionHelper {
    
    public List<Integer> addWithFilter(
        final List<Integer> collA, 
        final List<Integer> collB){

        return Stream.concat(
                    collA.stream(), 
                    collB.stream())
                .filter(element -> element > 2 )
                .collect(Collectors.toList());
    }    
}
```
Here we are concatenating two collections in the `addWithFilter()` method. In addition to the `concat()` method, we are also applying the `filter()` method of the `Stream` class to concatenate only elements that are greater than `2`.

Here is the output of running this method over these two collections:

Collection A: [9, 8, 5,  4]
Collection B: [1, 3, 99, 4, 7]
      Output: [9, 8, 5,  4, 3, 99, 4, 7].
Element `1` in collection B is excluded from the output since it does not meet the filter criteria.      

## Conclusion

In this short tutorial, we wrote methods in Java to perform many common operations between two or more collections. Similar operations on collections are also available in open source libraries like the [Guava Library](https://github.com/google/guava/wiki/CollectionUtilitiesExplained) and [Apache Commons Collections](https://commons.apache.org/proper/commons-collections/).

When creating Java applications, we can use a judicious mix of using methods available in the open-source libraries or build custom functions to work with collections efficiently.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/core-java/collectionops).

