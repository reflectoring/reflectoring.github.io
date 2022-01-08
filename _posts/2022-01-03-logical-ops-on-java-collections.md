---
title: "Logical Operations on Java Collections"
categories: [java]
date: 2022-01-02 06:00:00 +1000
modified: 2022-01-02 06:00:00 +1000
author: pratikdas
excerpt: "Collections are containers to group multiple items in a single unit. For example, a collection can represent a stack of books, products of a category, a queue of text messages, etc. They are an essential feature of almost all programming languages, most of which support different types of collections such as List, Set, Queue, Stack, etc.
In this article, we will look at some logical operations on Java Collections."
image:
  auto: 0074-stack
---

Collections are containers to group multiple items in a single unit. For example, a collection can represent a stack of books, products of a category, a queue of text messages, etc. They are an essential feature of almost all programming languages, most of which support different types of collections such as `List`, `Set`, `Queue`, `Stack`, etc. 

Java also supports a rich set of collections packaged in the Java Collections Framework.

In this article, we will look at examples of performing some useful operations on one or more Java Collections. 

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/core-java/collectionops" %}

## Java Collections Framework
A Collections Framework is a unified architecture for representing and manipulating collections. The Java Collections Framework is one of the core parts of the Java programming language. It provides a set of interfaces and classes to implement various data structures and algorithms along with several methods to perform various operations on collections. 

The `Collection` interface is the root interface of the collections framework hierarchy.

Java does not provide direct implementations of the `Collection` interface but provides implementations of its subinterfaces like `List`, `Set`, and `Queue`. While the official documentation of the [Java Collection Interface](https://docs.oracle.com/javase/8/docs/api/java/util/Collection.html) is the go-to guide for everything related to collections, here we will look at some examples of performing common logical operations like addition (joining), subtraction (difference), union, and the intersection between two or more collections. 

## Adding one Collection to Another

Let us start with the simplest of all: addition or joining two collections.
![adding two collections](/assets/img/posts/logical-ops-java-coll/add.png)

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

Here we are concatenating two collections in the `add` method in the `CollectionHelper`class. For adding, we have used the `concat()` method of the `Stream` class. We can also use this method to join more than 2 collections at a time. 

The corresponding unit tests looks like this:

```java
class CollectionHelperTest {
    
    CollectionHelper collectionHelper;

    @BeforeEach
    void setUp() throws Exception {
        collectionHelper = new CollectionHelper();
    }
    
    @Test
    void testAddition() {
        List<Integer> sub = collectionHelper.add(
                List.of(9,8,5,4), 
                List.of(1,3,99,4,7));
        
        
        Assertions.assertArrayEquals(
                List.of(9,8,5,4,1,3,99,4,7).toArray(), 
                sub.toArray());
    }

}
```

## Adding Collections with Filter
We can enrich the previous example further to concatenate elements of a collection only if they meet certain criteria as shown below: 
```java
public class CollectionHelper {
    
    public List<Integer> addWithFilter(
        final List<Integer> collA, 
        final List<Integer> collB){

        return Stream.concat(collA.stream(), 
                collB.stream())
                .filter(element -> element > 2 )
        .collect(Collectors.toList());
    }    
}
```
Here we are concatenating two collections in the `addWithFilter()` method. In addition to the `concat()` method, we are also applying the `filter()` method of the `Stream` class to concatenate only elements that are greater than `2`.

The corresponding unit test looks like this:

```java
class CollectionHelperTest {
    
    CollectionHelper collectionHelper;

    @BeforeEach
    void setUp() throws Exception {
        collectionHelper = new CollectionHelper();
    }
    
    @Test
    void testAdditionWithFilter() {
        List<Integer> list = collectionHelper.addWithFilter(
                List.of(9,8,5,4), 
                List.of(1,3,99,4,7));
        
        
        Assertions.assertArrayEquals(
                List.of(9,8,5,4,3,99,4,7).toArray(), 
                list.toArray());
    }

}
```

## Union of Two Collections (OR)

The union of two collections `A` and `B` is a set containing all elements that are in `A` or `B` or both.

![union of two collections](/assets/img/posts/logical-ops-java-coll/union.png)

 
We can find the union of two collections by using the `Set` type collection of Java which can hold only distinct elements:
```java
public class CollectionHelper {
    public List<Integer> union(final List<Integer> collA, final List<Integer> collB){
        Set<Integer> set = new HashSet<>();
        set.addAll(collA);
        set.addAll(collB);
        
        return new ArrayList<>(set);
        
    }
}
```
Here we are first adding all the elements of each collection to a [Set](https://docs.oracle.com/javase/8/docs/api/java/util/Set.html). A collection of type `Set` does not contain any duplicate elements. 

The corresponding unit test looks like this:

```java
class CollectionHelperTest {
    
    private CollectionHelper collectionHelper;

    @BeforeEach
    void setUp() throws Exception {
        collectionHelper = new CollectionHelper();
    }

    @Test
    void testUnion() {
        List<Integer> union = collectionHelper.union(
                List.of(9,8,5,4,7), 
                List.of(1,3,99,4,7));
        
        
        Assertions.assertArrayEquals(
                List.of(1, 3, 99, 4, 5, 7, 8, 9).toArray(), 
                union.toArray());
        
    }
}
```

## Intersection of Two Collections (AND)

Next, we will use Java's `Stream` class for finding the intersection of two collections:

![intersection of two collections](/assets/img/posts/logical-ops-java-coll/intersection.png)

```java
public class CollectionHelper {
    public List<Integer> intersection(
                            final List<Integer> collA, 
                            final List<Integer> collB){

        List<Integer> intersectElements = collA.stream()
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

The corresponding unit test looks like this:

```java
class CollectionHelperTest {
    
    private CollectionHelper collectionHelper;

    @BeforeEach
    void setUp() throws Exception {
        collectionHelper = new CollectionHelper();
    }
    
    @Test
    void testIntersection() {
        List<Integer> intersection = collectionHelper.intersection(
                List.of(9,8,5,4,7, 15, 15), 
                List.of(1,3,99,4,7));
        
        Assertions.assertArrayEquals(
                List.of(4,7).toArray(), 
                intersection.toArray());
    }
}
```

## Subtracting one Collection from Another
In this example we are again using Java's `Stream` class to find the collection of different elements contained in two collections:

![subtracting two collections](/assets/img/posts/logical-ops-java-coll/minus.png)

```java
public class CollectionHelper {
    
    public List<Integer> subtract(
        final List<Integer> collA, 
        final List<Integer> collB){

        List<Integer> intersectElements = intersection(collA,collB);
        
        List<Integer> subtractedElements = collA.stream()
            .filter(element->!intersectElements
                .contains(element))
            .collect(Collectors.toList());
        
        if(!subtractedElements.isEmpty()) {
            return subtractedElements;
        }else {
            return Collections.emptyList();
        }
        
    }

    public List<Integer> intersection(
                            final List<Integer> collA, 
                            final List<Integer> collB){
        // see implementation above
    }
}
```

The difference between to collections is found in two steps:
1. Finding the common set of elements with the `intersection()` method seen above.
2. Applying the `filter()` method of the `Stream` class on the first collection to exclude those elements.

The corresponding unit test looks like this:

```java
class CollectionHelperTest {
    
    CollectionHelper collectionHelper;

    @BeforeEach
    void setUp() throws Exception {
        collectionHelper = new CollectionHelper();
    }

 
    @Test
    void testSubtraction() {
        List<Integer> sub = collectionHelper.subtract(
                List.of(9,8,5,4,7, 15, 15), 
                List.of(1,3,99,4,7));
        
        
        Assertions.assertArrayEquals(
                List.of(9,8,5,15,15).toArray(), 
                sub.toArray());
    }

}
```

## Extract Subset - Split a List into Two Sublists

Splitting a collection into multiple sub-collections is another common task. In this example we are splitting a collection from the center into two sub lists: 
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
Here we have used the `subList()` method of `List` to split the collection passed as input into two sublists and returned as an array of `List`. We can see the expected result in the following unit test:

```java
class CollectionHelperTest {
    
    private CollectionHelper collectionHelper;

    @BeforeEach
    void setUp() throws Exception {
        collectionHelper = new CollectionHelper();
    }

    @Test
    void testSplit() {
        List<Integer>[] subLists = collectionHelper.split(
                List.of(9,8,5,4,7, 15, 15));
             
        Assertions.assertArrayEquals(
                List.of(9,8,5,4).toArray(), 
                subLists[0].toArray());
        
        Assertions.assertArrayEquals(
                List.of(7,15,15).toArray(), 
                subLists[1].toArray());
    }
}
```

## Conclusion

In this short tutorial, we wrote methods in Java to perform logical operations between two or more Collections. Similar operations on collections are also available in open source libraries like the [Guava Library](https://github.com/google/guava/wiki/CollectionUtilitiesExplained) and [Apache Commons Collections](https://commons.apache.org/proper/commons-collections/).

When creating Java applications, we can use a judicious mix of using methods available in the open-source libraries or build custom functions to work with collections efficiently.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/core-java/collectionops).

