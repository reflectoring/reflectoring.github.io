---
title: "Common Operations on Java Collections"
categories: ["Java"]
date: 2022-01-15 06:00:00 +1000
modified: 2022-01-15 06:00:00 +1000
authors: [pratikdas]
excerpt: "Collections are containers to group multiple items in a single unit. For example, a collection can represent a stack of books, products of a category, a queue of text messages, etc. They are an essential feature of almost all programming languages, most of which support different types of collections such as List, Set, Queue, Stack, etc. In this article, we will look at some logical operations on Java Collections."
image: images/stock/0074-stack-1200x628-branded.jpg
url: common-operations-on-java-collections
---

Collections are containers to group multiple items in a single unit. For example, a collection can represent a stack of books, products of a category, a queue of text messages, etc. 

They are an essential feature of almost all programming languages, most of which support different types of collections such as `List`, `Set`, `Queue`, `Stack`, etc. 

Java also supports a rich set of collections packaged in the Java Collections Framework.

In this article, we will look at some examples of performing common operations on collections like addition (joining), splitting, finding the union, and the intersection between two or more collections. 

{{% github "https://github.com/thombergs/code-examples/tree/master/core-java/collectionops" %}}

## Java Collections Framework
A Collections Framework is a unified architecture for representing and manipulating collections and is one of the core parts of the Java programming language. It provides a set of interfaces and classes to implement various data structures and algorithms along with several methods to perform various operations on collections. 

The `Collection` interface is the root interface of the Collections framework hierarchy.

Java does not provide direct implementations of the `Collection` interface but provides implementations of its subinterfaces like `List`, `Set`, and `Queue`. 

The official documentation of the [Java Collection Interface](https://docs.oracle.com/javase/8/docs/api/java/util/Collection.html) is the go-to guide for everything related to collections. Here, we will cover only the methods to perform common operations between one or more collections.

We have divided the common operations on collections which  we will look at here, into two groups:
* [Logical Operations](#logical-operations-on-collections): AND, OR, NOT, and XOR between two collections
* [Other Operations](#other-common-operations-on-collections) on Collections based on class methods of the `Collection` and `Stream` classes.

## Logical Operations on Collections
We will look at the following logical Operations between two collections :

* **OR**: for getting a union of elements in two collections
* **AND**: for getting an intersection of elements in two collections
* **XOR**: exclusive OR for finding mismatched elements from two collections
* **NOT**: for finding elements of one collection not present in a second collection

### OR - Union of Two Collections

The union of two collections `A` and `B` is a set containing all elements that are in `A` or `B` or both:

| Collection | Elements |
|------------|----------|
| A | `[9, 8, 5, 4, 7]`|
| B | `[1, 3, 99, 4, 7]` |
| A OR B | `[9, 8, 5, 4, 7, 1, 3, 99]` |

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

### AND - Intersection of Two Collections

The intersection of two collections contains only those elements that are in both collections:

| Collection | Elements         |
|------------|------------------|
| A          | `[9, 8, 5, 4, 7]`  |
| B          | `[1, 3, 99, 4, 7]` |
| A AND B    | `[4, 7]`        |

We will use Java's `Stream` class for finding the intersection of two collections:


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

### XOR - Finding Different Elements from Two Collections
XOR (eXclusive OR) is a boolean logic operation that returns `0` or `false` if the bits are the same and 1 or true for different bits. With collections, the `XOR` operation will contain all elements that are in one of the collections, but not in both:


| Collection | Elements         |
|-----------|------------------|
| A         | `[1, 2, 3, 4, 5, 6]`  |
| B         | `[3, 4, 5, 6, 7, 8, 9]` |
| A XOR B   | `[1, 2, 7, 8, 9]`        |

The Java code for an XOR operation may look something like this:

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

Here we are first using the `filter()` method of the `Stream` interface to include only the elements in the first collection which are not present in the second collection. Then we perform a similar operation on the second collection to include only the elements which are not present in the first collection followed by concatenating the two filtered collections.

### NOT - Elements of one Collection Not Present in the Second Collection

We use the NOT operation to select elements from one collection which are not present in the second collection as shown in this example:


| Collection | Elements        |
|------------|-----------------|
| A          | `[1, 2, 3, 4, 5, 6]` |
| B          | `[3, 4, 5, 6, 7, 8, 9]` |
| A NOT B    | `[1, 2]`        |
| B NOT A    | `[7, 8, 9]`        |

To calculate this in JAva, we can again take advantage of filtering:

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

### Splitting a Collection into Two Parts

Splitting a collection into multiple sub-collections is a very common task when building applications. 

We want to have a result something like this:

| Collection       | Elements       |
|------------------|----------------|
| A                | `[9, 8, 5, 4, 7, 15, 15]` |
| First half of A  | `[9, 8, 5, 4]` |
| Second half of A | `[7, 15, 15]`       |

In this example, we are splitting a collection from the center into two sub lists: 
```java
class CollectionHelper {
    public <T> List<T>[] split(List<T> listToSplit){

        // determine the endpoints to use in `list.subList()` method
      int[] endpoints = {0, 
              (listToSplit.size() + 1)/2, 
               listToSplit.size()};
     
      List<List<T>> sublists =
                IntStream.rangeClosed(0, 1)
                        .mapToObj(
                            i -> listToSplit
                                   .subList(
                                        endpoints[i], 
                                        endpoints[i + 1]))
                        .collect(Collectors.toList());
     
        // return an array containing both lists
        return new List[] {sublists.get(0), sublists.get(1)};
    }
}
```
Here we have used the `subList()` method of the `List` interface to split the list passed as input into two sublists and returned the output as an array of `List` elements.


### Splitting a Collection into n Equal Parts
We can generalize the previous method to partition a collection into equal parts each of a specified chunk size:

| Collection             | Elements               |
|------------------------|------------------------|
| A                      | `[9, 8, 5, 4, 7, 15, 15]` |
| First chunk of size 2  | `[9, 8]`               |
| Second chunk of size 2 | `[5,4]`                |
| Third chunk of size 2  | `[7,15]`               |
| Fourth chunk of size 2 | `[15]`                 |

The code for this looks like this:

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

### Removing Duplicates from a Collection

Removing duplicate elements from a collection is another frequently used operation in applications.:

| Collection                  | Elements               |
|-----------------------------|------------------------|
| A                           | `[9, 8, 5, 4, 7, 15, 15]` |
| After removal of duplicates | `[9, 8, 5, 4, 7, 15, ]`               |


In this example, the `removeDuplicates()` method removes any values that exist more than once in the collection, leaving only one instance of each value in the output:

```java
public class CollectionHelper {
    public List<Integer> removeDuplicates(final List<Integer> collA){
      List<Integer> listWithoutDuplicates = new ArrayList<>(
         new LinkedHashSet<>(collA));
      
      return listWithoutDuplicates;
    }
}

```

### Concatenating (Joining) Two or More Collections

Sometimes, we want to join two or more collections to a single big collection:

| Collection               | Elements           |
|--------------------------|--------------------|
| A                        | `[9, 8, 5, 4]` |
| B                        | `[1, 3, 99, 4, 7]` |
| Concatenation of A and B | `[9, 8, 5, 4, 1, 3, 99, 4, 7]`           |

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

Here we are concatenating two collections in the `add()` method of the `CollectionHelper`class. For adding, we have used the `concat()` method of the `Stream` class. We can also extend this method to join more than two collections at a time.


### Joining Collections by Applying a Condition

If we only want to concatenate values for which a condition is true (for example, they have to be > 2), it would look like this:

| Collection                                | Elements           |
|-------------------------------------------|--------------------|
| A                                         | `[9, 8, 5, 4]` |
| B                                         | `[1, 3, 99, 4, 7]` |
| Concatenation of A and B for elements > 2 | `[9, 8, 5, 4, 3, 99, 4, 7]`           |

To code this, we can enrich the previous example further to concatenate elements of a collection only if they meet certain criteria as shown below: 
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

## Conclusion

In this tutorial, we wrote methods in Java to perform many common operations between two or more collections. Similar operations on collections are also available in open source libraries like the [Guava Library](https://github.com/google/guava/wiki/CollectionUtilitiesExplained) and [Apache Commons Collections](https://commons.apache.org/proper/commons-collections/).

When creating Java applications, we can use a judicious mix of using methods available in the open-source libraries or build custom functions to work with collections efficiently.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/core-java/collectionops).

