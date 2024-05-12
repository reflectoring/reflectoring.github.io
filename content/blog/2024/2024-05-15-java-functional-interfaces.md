---
authors: [sagaofsilence]
title: "One Stop Guide to Java Functional Interfaces"
categories: ["Java"]
date: 2024-05-01 00:00:00 +1100
excerpt: "Get familiar with Java Functional Interfaces."
image: images/stock/0088-jigsaw-1200x628-branded.jpg
url: one-stop-guide-to-java-functional-interfaces
---

## Introduction to Functional Programming  

Functional programming is a paradigm that focuses on the use of functions to create clear and concise code. Instead of modifying data and maintaining state like in traditional imperative programming, functional programming treats functions as first-class citizens, allowing us to be assigned to variables, passed as arguments, and returned from other functions. This approach can make code easier to understand and reason about.

### Functional Programming in Java  

In recent years, functional programming has gained popularity due to its ability to help manage complexity, especially in large-scale applications. It emphasizes immutability, avoiding side effects, and working with data in a more predictable and modular way. This makes it easier to test and maintain code.

Java, traditionally an object-oriented language, adopted functional programming features in Java 8. This move was driven by several factors:

- **Simplifying Code**: Functional programming can reduce boilerplate code and make code more concise, leading to easier maintenance and better readability.

- **Concurrency and Parallelism**: Functional programming works well with modern multi-core architectures, enabling efficient parallel processing without worrying about shared state or side effects.

- **Expressiveness and Flexibility**: By embracing functional interfaces and lambda expressions, Java gained a more expressive syntax, allowing us to write flexible and adaptable code.

Functional programming in Java revolves around several key concepts and idioms:

- **Lambda Expressions**: These are compact functions that can be used wherever a functional interface is expected. They help reduce boilerplate code.

- **Functional Interfaces**: These are interfaces with a single abstract method, making us perfect for lambda expressions and method references. Common examples include `Predicate`, `Function`, `Consumer`, `Supplier`, and `Operator`.

- **Method References**: These are a shorthand way to refer to methods, making code even more concise and readable.

### Advantages and Disadvantages of Functional Programming  

Functional programming in Java brings many advantages but also has its share of disadvantages and challenges.

**One of the key benefits of functional programming is improved code readability.** Functional code tends to be concise, thanks to lambda expressions and method references, leading to reduced boilerplate and easier code maintenance. This focus on immutability—where data structures remain unchanged after creation—helps to reduce side effects and prevents bugs caused by unexpected changes in state.

**Another advantage is its compatibility with concurrency and parallelism.** Since functional programming avoids mutable state, operations can run in parallel without the usual risks of data inconsistency or race conditions. This results in code that's naturally better suited for multi-threaded environments.

**Functional programming also promotes modularity and reusability.** With functions being first-class citizens, us can create small, reusable components, leading to cleaner, more maintainable code. The abstraction inherent in functional programming reduces overall complexity, allowing us to focus on the essential logic without worrying about implementation details.

However, these advantages come with potential drawbacks. The learning curve for functional programming can be steep, especially for us accustomed to imperative or object-oriented paradigms. **Concepts like higher-order functions and immutability might require a significant mindset shift.**

**Performance overheads are another concern**, particularly due to frequent object creation and additional function calls inherent in functional programming. This could impact performance in resource-constrained environments. **Debugging functional code can also be challenging** due to the abstractions involved, and understanding complex lambda expressions might require a deeper understanding of functional concepts.

**Compatibility issues may arise when integrating with legacy systems** or libraries that aren't designed for functional programming, potentially causing integration problems. Finally, functional programming's focus on immutability and side-effect-free functions **may reduce flexibility in scenarios that require mutable state or complex object manipulations.**

Ultimately, while functional programming offers significant benefits like improved readability and easier concurrency, it also comes with challenges. **us need to consider both the advantages and disadvantages to determine how functional programming fits into their Java applications.**

## Understanding Functional Interfaces  

The `@FunctionalInterface` annotation in Java is a special marker that indicates a particular interface is intended to be a functional interface. A functional interface is an interface with a single abstract method (SAM), meaning it can be used as a target for lambda expressions or method references. 

This annotation serves as a way to document our intention for the interface and provides a layer of protection against accidental changes. By using `@FunctionalInterface`, we indicate that the interface should maintain its single-method structure. If we add more abstract methods, the compiler will generate an error, ensuring the functional interface's integrity.

Functional interfaces are central to Java's support for functional programming. They allow us to write cleaner, more concise code by using lambda expressions, reducing boilerplate code, and promoting reusability. Common examples of functional interfaces include `Predicate`, `Consumer`, `Function`, and `Supplier`.

Using the `@FunctionalInterface` annotation isn't strictly necessary. Any interface with a single abstract method is inherently a functional interface. But it's a good practice. It improves code readability, enforces constraints, and helps other us understand our intentions, contributing to better maintainability and consistency in our codebase.

## Creating Custom Functional Interfaces

We know know that a functional interface in Java is an interface with a single abstract method. This design allows functional interfaces to be used with lambda expressions or method references, which makes us ideal for building compact and expressive code. 

Let's consider a simple calculator example that takes two integers and returns the result of an arithmetic operation. To implement this, we can define a functional interface called `ArithmeticOperation`, which has a single method to perform the operation.

Here's the definition of the functional interface:

```java
@FunctionalInterface
interface ArithmeticOperation {
    int operate(int a, int b);
}
```

In Java, the `@FunctionalInterface` annotation designates an interface with a single abstract method (often abbreviated as SAM). This unique characteristic allows it to serve as a target for lambda expressions and method references, facilitating concise and expressive functional-style programming. The presence of `@FunctionalInterface` acts as a safeguard against accidentally adding more abstract methods, which would compromise its functional nature.

Consider the `ArithmeticOperation` interface, marked with `@FunctionalInterface`. This annotation makes it clear that the interface is intended to be functional, emphasizing that it should only contain one abstract method.

The `ArithmeticOperation` interface defines a single method, `operate`, that takes two integers and returns an integer result. The use of this annotation not only documents that the interface is functional but also enables the use of lambda expressions and method references to implement it, providing flexibility and simplicity.

In a calculator context, the `operate` method represents a basic arithmetic operation between two numbers, like addition, subtraction, multiplication, or division. By using `@FunctionalInterface`, we can create different lambda expressions to define the behavior of this method, making it easier to change and maintain the codebase.

The `@FunctionalInterface` annotation ensures clarity and adherence to the functional programming paradigm, helping us avoid unintended modifications that could disrupt the interface's functionality. In the case of `ArithmeticOperation`, this annotation guarantees that the interface can be used in a functional programming context, allowing us to leverage Java 8's lambda expressions and other functional constructs with ease.

With this functional interface, we can create different arithmetic operations, like addition, subtraction, multiplication, and division, using lambda expressions. Let's build a basic calculator with this setup:

```java
@Test
void operate() {
  // Define operations
  ArithmeticOperation add = (a, b) -> a + b;
  ArithmeticOperation subtract = (a, b) -> a - b;
  ArithmeticOperation multiply = (a, b) -> a * b;
  ArithmeticOperation divide = (a, b) -> a / b;

  // Use the operations
  int addition = add.operate(10, 5); // Returns 15
  int subtraction = subtract.operate(10, 5); // Returns 5
  int multiplication = multiply.operate(10, 5); // Returns 50
  int division = divide.operate(10, 5); // Returns 2

  // Verify results
  assertEquals(15, addition, "Result of addition is not correct.");
  assertEquals(5, subtraction, "Result of subtraction is not correct.");
  assertEquals(50, multiplication, "Result of multiplication is not correct.");
  assertEquals(2, division, "Result of division is not correct.");
}
```

The test `operate()` checks if the defined arithmetic operations produce correct results. It starts by creating lambda expressions for four basic arithmetic operations: addition, subtraction, multiplication, and division, using the `ArithmeticOperation` functional interface.

Next, it applies these operations to the numbers 10 and 5, storing the results in corresponding variables.

The test then verifies that these outcomes match the expected values, using assertions.

## Built-in Functional Interfaces in Java 8  

Here's an overview of some of the most common built-in functional interfaces in Java 8, along with their typical use cases and examples, presented in tabular format:

| Functional Interface | Description | Example Use Cases |
|----------------------|-------------|-------------------|
| `Predicate<T>` | Represents a function that takes an input of type `T` and returns a boolean. Commonly used for filtering and conditional checks. | - Checking if a number is even<br>- Filtering a list of strings based on length<br>- Validating user inputs |
| `Function<T, R>` | Represents a function that takes an input of type `T` and returns a result of type `R`. Often used for transformation or mapping operations. | - Converting a string to uppercase<br>- Mapping employee objects to their salaries<br>- Parsing a string to an integer |
| `Consumer<T>` | Represents a function that takes an input of type `T` and performs an action, without returning a result. Ideal for side-effect operations like printing or logging. | - Printing a list of numbers<br>- Logging user actions<br>- Updating object properties |
| `Supplier<T>` | Represents a function that provides a value of type `T` without taking any arguments. Useful for lazy initialization and deferred computation. | - Generating random numbers<br>- Providing default values<br>- Creating new object instances |
| `UnaryOperator<T>` | Represents a function that takes an input of type `T` and returns a result of the same type. Often used for simple transformations or operations. | - Negating a number<br>- Reversing a string<br>- Incrementing a value |
| `BinaryOperator<T>` | Represents a function that takes two inputs of type `T` and returns a result of the same type. Useful for combining or reducing operations. | - Adding two numbers<br>- Concatenating strings<br>- Finding the maximum of two values |

These built-in functional interfaces in Java 8 provide a foundation for functional programming, enabling us to work with lambda expressions and streamline code. Due to their versatility we can use them in a wide range of applications, from data transformation to filtering and beyond.

## Lambda Expressions Explained  

Lambda expressions are a key feature of Java 8, allowing us to create compact, anonymous functions in a clear and concise manner. They are a cornerstone of functional programming in Java and provide a way to represent functional interfaces in a simpler form.

The general syntax of a lambda expression is as follows:
```java
(parameters) -> { body }
```
Parameters represent a comma-separated list of input parameters to the lambda function. If there's only one parameter, parentheses can be omitted. Arrow Operator separates the parameters from the body of the lambda expression. Finally, the body contains the function logic. If there's only one statement, braces can be omitted.

Lambda expressions can be used to create anonymous functions, allowing us to write inline logic without the need for additional class definitions.

We can use lambda expressions to implement anonymous functions where functional interfaces are required. Here are three examples demonstrating how to use lambda expressions without relying on built-in functional interfaces:

### Example 1: Implementing a Custom Functional Interface

We have already seen a custom functional interface for arithmetic operation:
```java
interface ArithmeticOperation {
    int operate(int a, int b);
}
```

We can create lambda expressions to implement this interface:
```java
ArithmeticOperation add = (a, b) -> a + b;
ArithmeticOperation subtract = (a, b) -> a - b;
```

### Example 2: Anonymous Comparator

It is not mandatory to define a custom functional interface and then use it to declare lambdas. In following example, we create an anonymous comparator to sort a list of strings by length:
```java
List<String> words = Arrays.asList("apple", "banana", "cherry");
Collections.sort(words, (s1, s2) -> Integer.compare(s1.length(), s2.length()));
```

### Example 3: Runnable for a Thread

We can also use lambda expressions to create a `Runnable` for threads:
```java
Thread thread = new Thread(() -> {
    System.out.println("Running in a lambda!");
});
thread.start();
```

These examples demonstrate how we can use lambda expressions to define simple, concise functions without explicitly creating additional classes. They are powerful tools for streamlining code and making functional programming in Java more accessible and expressive.

## Method References  

Method references in Java 8 are a shorthand way to refer to existing methods by their name. Use them instead of lambda expressions, offering more concise and readable code. Method references allow us to reference methods without invoking them, making them ideal for functional programming scenarios and stream processing.

Java 8 provides four types of method references:

### Reference to a Static Method

A static method reference refers to a static method in a class. It uses the class name followed by `::` and the method name:
```java
ContainingClass::staticMethodName	
```

Let's see example of static Reference:
```java
public class MethodReferenceTest {
  @Test
  void staticMethodReference() {
    List<Integer> numbers = List.of(1, -2, 3, -4, 5);
    List<Integer> positiveNumbers = numbers.stream().map(Math::abs).toList();
    positiveNumbers.forEach(
      number -> Assertions.assertTrue(number > 0, "Number should be positive."));
  }
}
```
The test `staticMethodReference` in the `MethodReferenceTest` class verifies the use of a static method reference. It creates a list of integers, `numbers`, containing both positive and negative values. Using a stream, it applies the `Math::abs` method reference to convert each number to its absolute value, resulting in a new list, `positiveNumbers`.

The test then checks that each element in `positiveNumbers` is greater than zero, indicating that the absolute value conversion was successful. It uses assertions to ensure that every number in the list is positive. If any number is not positive, the assertion fails, providing a relevant error message.

### Reference to an Instance Method of a Particular Object

This type of method reference refers to a method of a specific instance.

In Java, method references are a concise way to refer to methods without explicitly calling them. There are two primary syntaxes for referencing instance methods: using a containing class or using a specific object instance.

**Using a Containing Class**:
```java
ContainingClass::instanceMethodName
```
The syntax `ContainingClass::instanceMethodName` refers to an instance method of a specific class. This type of method reference doesn't refer to a specific object instance; instead, it indicates that any object of that class can use this method. It's often used in stream operations, where the object instance is derived at runtime.

For example, `String::toLowerCase` can be used to reference the `toLowerCase()` method on any `String` object. When used in a stream operation like `.map(String::toLowerCase)`, it applies the method to each string in the stream.

**Using a Specific Object**:
```java
containingObject::instanceMethodName
```
The syntax `containingObject::instanceMethodName` refers to an instance method of a specific object. This method reference is bound to a particular object, allowing us to call its method directly when needed.

For example, if we have an instance `str` of `String`, we can refer to its `length()` method with `str::length`. This approach is useful when we need to use a specific object's method in a lambda expression or a stream operation.

Both syntaxes are useful in different scenarios. The class-based method reference is more flexible, allowing us to reference methods without tying them to a specific object. The object-based method reference, on the other hand, is helpful when we want to use a method tied to a specific object instance. Both approaches provide a more concise way to call instance methods without the need for traditional anonymous classes or explicit lambda expressions.

Containing class instance method reference example:
```java
  @Test
  void containingClassInstanceMethodReference() {
    List<String> numbers = List.of("One", "Two", "Three");
    List<Integer> numberChars = numbers.stream().map(String::length).toList();
    numberChars.forEach(
      length -> Assertions.assertTrue(length > 0, "Number text is not empty."));
  }

```
The `containingClassInstanceMethodReference` test verifies the use of an instance method reference. It creates a list of strings, `numbers`, containing "One", "Two", and "Three". Using a stream, it applies the `String::length` method reference to convert each string into its length, resulting in a new list, `numberChars.

The test checks that each element in `numberChars` is greater than zero, ensuring that all strings have a positive length. It uses assertions to confirm this condition, providing a message if a length is not positive. This test validates that the instance method reference to `String.length()` is functioning as expected.

Now let's see how to use containing object method reference:
```java
// Custom comparator
class StringNumberComparator implements Comparator<String> {
  @Override
  public int compare(String o1, String o2) {
    if (o1 == null) {
      return o2 == null ? 0 : 1;
    } else if (o2 == null) {
      return -1;
    }
    return o1.compareTo(o2);
  }
}
  
@Test
void containingObjectInstanceMethodReference() {
  List<String> numbers = List.of("One", "Two", "Three");
  StringNumberComparator comparator = new StringNumberComparator();
  List<String> sorted = numbers.stream().sorted(comparator::compare).toList();
  List<String> expected = List.of("One", "Three", "Two");
  Assertions.assertEquals(expected, sorted, "Incorrect sorting.");
}
```
The code snippet sorts a list of strings using an instance method reference. The `StringNumberComparator` class defines a comparison logic for strings. The `comparator::compare` is a method reference that references the `compare` method of the `StringNumberComparator` instance. This method reference is passed to `sorted()`, allowing the stream to sort the `numbers` list according to the specified comparison logic. The test checks if the sorted list matches the expected order, asserting equality between the two lists. If the actual and expected results differ, the test fails, indicating incorrect sorting.

### Reference to an Instance Method of an Arbitrary Object of a Particular Type

This type refers to an instance method, but the exact object is determined at runtime, allowing flexibility when dealing with collections or stream operations.

```java
@Test
void instanceMethodArbitraryObjectParticularType() {
  List<Number> numbers = List.of(1, 2L, 3.0f, 4.0d);
  List<Integer> numberIntValues = numbers.stream().map(Number::intValue).toList();
  
  Assertions.assertEquals(
    List.of(1, 2, 3, 4), numberIntValues, "Int values are not same.");
}
```

The `instanceMethodArbitraryObjectParticularType` test checks the use of an instance method reference for an arbitrary object of a particular type. It creates a list of `Number` objects (`numbers`) containing various types of numeric values: an `int`, a `long`, a `float`, and a `double`. 

Using a stream, it maps each `Number` to its integer value using the `Number::intValue` method reference, resulting in a list of integers (`numberInvValues`). The test then compares this list with the expected result, `List.of(1, 2, 3, 4)`, using assertions to ensure they are the same. If the lists don't match, the assertion fails, providing a relevant message. This test demonstrates how instance method references work with arbitrary objects of a particular type in Java.

### Reference to a Constructor

A constructor reference refers to a class constructor, allowing us to create new instances through a method reference.

Its syntax is as follows:
```java
ContainingClass::new
```
The `ContainingClass::new` syntax is a constructor reference. It points to the constructor of a specific class, allowing us to create new instances.

Let's now see how to use constructor reference:

```java
@Test
void constructorReference() {
  List<String> numbers = List.of("1", "2", "3");
  Map<String, BigInteger> numberMapping =
      numbers.stream()
          .map(BigInteger::new)
          .collect(Collectors.toMap(BigInteger::toString, Function.identity()));
  
  Map<String, BigInteger> expected =
      new HashMap<>() {
        {
          put("1", BigInteger.valueOf(1));
          put("2", BigInteger.valueOf(2));
          put("3", BigInteger.valueOf(3));
        }
      };
  
  Assertions.assertEquals(expected, numberMapping, "Mapped numbers do not match.");
}
```
The `constructorReference` test demonstrates the use of a constructor reference in a stream operation. It creates a list of strings (`numbers`) containing "1", "2", and "3". Using a stream, it maps each string to a `BigInteger` object by referencing the `BigInteger` constructor with `BigInteger::new`.

The test then collects the resulting `BigInteger` objects into a `Map`, where the keys are the original strings, and the values are the corresponding `BigInteger` instances. It uses `Collectors.toMap` with a lambda expression (`BigInteger::toString`) to create the keys and `Function.identity()` for the values.

To ensure the `numberMapping` is correct, the test compares it with an expected map (`expected`) containing the same key-value pairs. If the maps don't match, the assertion fails with a descriptive message. This test effectively checks if the constructor reference is working as expected, transforming a list of strings into a map of `BigInteger` objects.

Let's summarize the use cases for method references, along with descriptions and examples:

| Type of Method Reference                                | Description                                             | Example                                                 |
|---------------------------------------------------------|---------------------------------------------------------|---------------------------------------------------------|
| Reference to a Static Method                            | Refers to a static method in a class. This type of method reference uses the class name followed by `::` and the method name. | <code>Function<Integer, Integer> square = MathOperations::square;</code>|
| Reference to an Instance Method of a Particular Object  | Refers to an instance method of a specific object. The instance must be explicitly defined before using the method reference. | <code>Supplier<String> getMessage = stringUtils::getMessage;</code>|
| Reference to an Instance Method of an Arbitrary Object of a Particular Type | Refers to an instance method of an arbitrary object of a specific type. This type is commonly used in stream operations, where the object is determined at runtime. | <code>List<String> uppercasedWords = words.stream()<br>.map(String::toUpperCase)<br>.collect(Collectors.toList());<code>|
| Reference to a Constructor                              | Refers to a class constructor, allowing us to create new instances. This type is useful when we need to create objects without explicitly calling a constructor. | <code>Supplier<Car> carSupplier = Car::new;<code>|

## Predicates

Predicates are functional interfaces in Java that represent boolean-valued functions of a single argument. They are commonly used for filtering, testing, and conditional operations.

The `Predicate` functional interface is part of the `java.util.function` package and defines a functional method `test(T t)` that returns a `boolean`.  It also provides default methods that allow combine two predicates.

```java
@FunctionalInterface
public interface Predicate<T> {
    boolean test(T t);
    // default methods
}
```
This method evaluates the predicate on the input argument and determines whether it satisfies the condition defined by the predicate.

Predicates are often used with the `stream()` API for filtering elements based on certain conditions. Passe them as arguments to methods like `filter()` to specify the criteria for selecting elements from a collection.

Let's see filtering in action:
```java
public class PredicateTest {
  @Test
  void testFiltering() {
    List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    Predicate<Integer> isEven = num -> num % 2 == 0;
    
    List<Integer> actual = numbers.stream().filter(isEven).toList();
    List<Integer> expected = List.of(2, 4, 6, 8, 10);
    
    Assertions.assertEquals(expected, actual);
  }
}
```
In the test `testFiltering()` method, a list of integers is created. A predicate `isEven` is defined to check if a number is even. Using `stream()` and `filter()` methods, the list is filtered to contain only even numbers. The filtered list is compared against the expected list.

### Combining Predicates

Predicates can be combined using logical operators such as `and()`, `or()`, `negate()` and `not()` to create complex conditions.

Let's see how to combine the practices:

```java
@Test
void testPredicate() {
  List<Integer> numbers = List.of(-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5);
  Predicate<Integer> isZero = num -> num == 0;
  Predicate<Integer> isPositive = num -> num > 0;
  Predicate<Integer> isOdd = num -> num % 2 == 1;

  Predicate<Integer> isPositiveOrZero = isPositive.or(isZero);
  Predicate<Integer> isPositiveAndOdd = isPositive.and(isOdd);
  Predicate<Integer> isNotPositive = Predicate.not(isPositive);
  Predicate<Integer> isNotZero = isZero.negate();
  Predicate<Integer> isAlsoZero = isPositive.negate().and(isNegative.negate());

  // check zero or greater
  Assertions.assertEquals(List.of(0, 1, 2, 3, 4, 5), 
                          numbers.stream().filter(isPositiveOrZero).toList());
  // check greater than zero and odd
  Assertions.assertEquals(List.of(1, 3, 5), 
                          numbers.stream().filter(isPositiveAndOdd).toList());
  // check less than zero and negative
  Assertions.assertEquals(List.of(-5, -4, -3, -2, -1, 0), 
                          numbers.stream().filter(isNotPositive).toList());
  // check not zero
  Assertions.assertEquals(List.of(-5, -4, -3, -2, -1, 1, 2, 3, 4, 5), 
                          numbers.stream().filter(isNotZero).toList());
  // check neither positive nor negative
  Assertions.assertEquals(numbers.stream().filter(isZero).toList(), 
                          numbers.stream().filter(isAlsoZero).toList());
}
```
In this test, predicates are combined to filter a list of numbers. `isPositiveOrZero` combines predicates for positive numbers or zero. `isPositiveAndOdd` combines predicates for positive and odd numbers. `isNotPositive` negates the predicate for positive numbers. `isNotZero` negates the predicate for zero. `isAlsoZero` shows us how to chain predicates. Each combined predicate is applied to the list, verifying the expected results.
 
## BiPredicates

The `BiPredicate<T, U>` takes two arguments of types `T` and `U` and returns a boolean result. It's commonly used for testing conditions involving two parameters. For instance, a `BiPredicate` can be used to check if one value is greater than the other or if two objects satisfy a specific relationship. An example would be validating if a person's age and income meet certain eligibility criteria for a financial service.

`BiPredicate` defines a `test()` method with two arguments, and it returns a `boolean`. It also provides default methods that allow combine two predicates.
 
```java
@FunctionalInterface
public interface BiPredicate<T, U> {
    boolean test(T t, U u);
    // default methods
}
```

Let's now learn how to use the `BiPredicate`:

```java
public class PredicateTest {
  // C = Carpenter, W = Welder
  private Object[][] workers 
      = {{"C", 24}, {"W", 32}, {"C", 35}, {"W", 40}, {"C", 50}, {"W", 44}, {"C", 30}};

  @Test
  void testBiPredicate() {

    BiPredicate<String, Integer> juniorCarpenterCheck =
        (worker, age) -> "C".equals(worker) && (age >= 18 && age <= 40);

    BiPredicate<String, Integer> juniorWelderCheck =
        (worker, age) -> "W".equals(worker) && (age >= 18 && age <= 40);

    long juniorCarpenterCount = Arrays.stream(workers).filter(person ->
      juniorCarpenterCheck.test((String) person[0], (Integer) person[1])).count();
    Assertions.assertEquals(3L, juniorCarpenterCount);

    long juniorWelderCount = Arrays.stream(workers).filter(person -> 
      juniorWelderCheck.test((String) person[0], (Integer) person[1])).count();
    Assertions.assertEquals(2L, juniorWelderCount);
  }
}

```
In the test, an array of workers with their respective ages is defined. Two `BiPredicate` instances are created: `juniorCarpenterCheck` and `juniorWelderCheck`. These predicates evaluate if a worker is within a certain age range (18 to 40) based on their occupation (Carpenter or Welder). The predicates are then used to filter the array of workers using the `test()` method. Finally, the number of workers meeting the criteria for junior carpenters and junior welders is counted and asserted against the expected counts.

Now let's learn to use the default methods used to combine and negate.

```java
  @Test
  void testBiPredicateDefaultMethods() {

    BiPredicate<String, Integer> juniorCarpenterCheck =
            (worker, age) -> "C".equals(worker) && (age >= 18 && age <= 40);

    BiPredicate<String, Integer> groomedCarpenterCheck =
            (worker, age) -> "C".equals(worker) && (age >= 30 && age <= 40);

    BiPredicate<String, Integer> allCarpenterCheck =
            (worker, age) -> "C".equals(worker) && (age >= 18);

    BiPredicate<String, Integer> juniorWelderCheck =
            (worker, age) -> "W".equals(worker) && (age >= 18 && age <= 40);
    
    BiPredicate<String, Integer> juniorWorkerCheck 
      = juniorCarpenterCheck.or(juniorWelderCheck);

    BiPredicate<String, Integer> juniorGroomedCarpenterCheck =
            juniorCarpenterCheck.and(groomedCarpenterCheck);

    BiPredicate<String, Integer> allWelderCheck = allCarpenterCheck.negate();

    // test or()
    long juniorWorkerCount = Arrays.stream(workers).filter(person -> juniorWorkerCheck
                                   .test((String) person[0], (Integer) person[1]))
                                   .count();
    Assertions.assertEquals(5L, juniorWorkerCount);

    // test and()
    long juniorGroomedCarpenterCount 
      = Arrays.stream(workers).filter(person -> juniorGroomedCarpenterCheck
              .test((String) person[0], (Integer) person[1])).count();
    Assertions.assertEquals(2L, juniorGroomedCarpenterCount);

    // test negate()
    long allWelderCount = Arrays.stream(workers).filter(person -> allWelderCheck
                                .test((String) person[0], (Integer) person[1]))
                                .count();
    Assertions.assertEquals(3L, allWelderCount);
  }
```
The test demonstrates default methods in `BiPredicate`. It defines predicates for various worker conditions, like junior carpenters and welders. Using default methods `or()`, `and()`, and `negate()`, it creates new predicates for combinations like all junior workers, groomed carpenters, and non-carpenters. These predicates are then applied to filter workers, and the counts are asserted. This showcases how default methods enhance the functionality of `BiPredicate` by enabling logical operations like OR, AND, and negation.

## IntPredicate

`IntPredicate` represents a predicate (boolean-valued function) that takes a single integer argument and returns a `boolean` result.

```java
@FunctionalInterface
public interface IntPredicate {
    boolean test(int value);
    // default methods
}
```
This is the int-consuming primitive type specialization of Predicate.

`IntPredicate` is commonly used when filtering collections of primitive integer values or when evaluating conditions based on integer inputs. It provides several default methods for composing predicates, including `and()`, `or()`, and `negate()`, allowing for logical combinations of predicates.

Here's a simple example:

```java
@Test
void testIntPredicate() {
  IntPredicate isZero = num -> num == 0;
  IntPredicate isPositive = num -> num > 0;
  IntPredicate isNegative = num -> num < 0;
  IntPredicate isOdd = num -> num % 2 == 1;

  IntPredicate isPositiveOrZero = isPositive.or(isZero);
  IntPredicate isPositiveAndOdd = isPositive.and(isOdd);
  IntPredicate isNotZero = isZero.negate();
  IntPredicate isAlsoZero = isPositive.negate().and(isNegative.negate());

  // check zero or greater
  Assertions.assertArrayEquals(new int[] {0, 1, 2, 3, 4, 5}, 
    IntStream.range(-5, 6).filter(isPositiveOrZero).toArray());

  // check greater than zero and odd
  Assertions.assertArrayEquals(new int[] {1, 3, 5}, 
    IntStream.range(-5, 6).filter(isPositiveAndOdd).toArray());

  // check not zero
  Assertions.assertArrayEquals(new int[] {-5, -4, -3, -2, -1, 1, 2, 3, 4, 5},
    IntStream.range(-5, 6).filter(isNotZero).toArray());

  // check neither positive nor negative
  Assertions.assertArrayEquals(
      IntStream.range(-5, 6).filter(isZero).toArray(),
      IntStream.range(-5, 6).filter(isAlsoZero).toArray());
}
```

The `testIntPredicate()` method demonstrates various scenarios using `IntPredicate`. Predicates like `isZero`, `isPositive`, and `isNegative` check specific conditions on integers. Combined predicates like `isPositiveOrZero` and `isPositiveAndOdd` perform logical operations. Tests verify filtering of integer ranges based on these predicates, ensuring correct outcomes for conditions like zero or greater, greater than zero and odd, not zero, and neither positive nor negative. Each assertion validates the filtering results against expected integer arrays, covering a wide range of scenarios.

## LongPredicate

`LongPredicate` represents a predicate (boolean-valued function) that takes a single long argument and returns a `boolean` result.

```java
@FunctionalInterface
public interface LongPredicate {
    boolean test(long value);
    // default methods
}
```
 This is the long-consuming primitive type specialization of Predicate.

`LongPredicate` is commonly used when filtering collections of primitive long values or when evaluating conditions based on long inputs. It provides several default methods for composing predicates, including `and()`, `or()`, and `negate()`, allowing for logical combinations of predicates.

Here's a simple example:

```java
@Test
void testLongPredicate() {
  IntPredicate isZero = num -> num == 0;
  IntPredicate isPositive = num -> num > 0;
  IntPredicate isNegative = num -> num < 0;
  IntPredicate isOdd = num -> num % 2 == 1;

  IntPredicate isPositiveOrZero = isPositive.or(isZero);
  IntPredicate isPositiveAndOdd = isPositive.and(isOdd);
  IntPredicate isNotZero = isZero.negate();
  IntPredicate isAlsoZero = isPositive.negate().and(isNegative.negate());

  // check zero or greater
  Assertions.assertArrayEquals(new int[] {0, 1, 2, 3, 4, 5}, 
    IntStream.range(-5, 6).filter(isPositiveOrZero).toArray());

  // check greater than zero and odd
  Assertions.assertArrayEquals(new int[] {1, 3, 5}, 
    IntStream.range(-5, 6).filter(isPositiveAndOdd).toArray());

  // check not zero
  Assertions.assertArrayEquals(new int[] {-5, -4, -3, -2, -1, 1, 2, 3, 4, 5},
    IntStream.range(-5, 6).filter(isNotZero).toArray());

  // check neither positive nor negative
  Assertions.assertArrayEquals(
      IntStream.range(-5, 6).filter(isZero).toArray(),
      IntStream.range(-5, 6).filter(isAlsoZero).toArray());
}
```

The `testIntPredicate()` method demonstrates various scenarios using `IntPredicate`. Predicates like `isZero`, `isPositive`, and `isNegative` check specific conditions on integers. Combined predicates like `isPositiveOrZero` and `isPositiveAndOdd` perform logical operations. Tests verify filtering of integer ranges based on these predicates, ensuring correct outcomes for conditions like zero or greater, greater than zero and odd, not zero, and neither positive nor negative. Each assertion validates the filtering results against expected integer arrays, covering a wide range of scenarios.

## DoublePredicate

`DoublePredicate` represents a predicate (boolean-valued function) that takes a single double argument and returns a `boolean` result.

```java
@FunctionalInterface
public interface DoublePredicate {
    boolean test(double value);
    // default methods
}
```
This is the double-consuming primitive type specialization of `Predicate`.

`DoublePredicate` is commonly used when filtering collections of primitive double values or when evaluating conditions based on double inputs. It provides several default methods for composing predicates, including `and()`, `or()`, and `negate()`, allowing for logical combinations of predicates.

Let's understand it with an example:

```java
@Test
void testDoublePredicate() {
  // weight categories (weight in lbs)
  DoublePredicate underweight = weight -> weight <= 125;
  DoublePredicate healthy = weight -> weight >= 126 && weight <= 168;
  DoublePredicate overweight = weight -> weight >= 169 && weight <= 202;
  DoublePredicate obese = weight -> weight >= 203;
  DoublePredicate needToLose = weight -> weight >= 169;
  DoublePredicate notHealthy = healthy.negate();
  DoublePredicate alsoNotHealthy = underweight.or(overweight).or(obese);
  DoublePredicate skipSugar = needToLose.and(overweight.or(obese));

  // check need to lose weight
  Assertions.assertArrayEquals(new double[] {200D}, 
    DoubleStream.of(100D, 140D, 160D, 200D).filter(needToLose).toArray());

  // check need to lose weight
  Assertions.assertArrayEquals(new double[] {100D, 200D},
    DoubleStream.of(100D, 140D, 160D, 200D).filter(notHealthy).toArray());

  // check negate()
  Assertions.assertArrayEquals(
    DoubleStream.of(100D, 140D, 160D, 200D).filter(notHealthy).toArray(),
    DoubleStream.of(100D, 140D, 160D, 200D).filter(alsoNotHealthy).toArray());

  // check and()
  Assertions.assertArrayEquals(new double[] {200D}, 
    DoubleStream.of(100D, 140D, 160D, 200D).filter(skipSugar).toArray());
}
```
The `testDoublePredicate()` method demonstrates scenarios using `DoublePredicate` for weight categories. Predicates like `underweight`, `healthy`, `overweight`, and `obese` define weight ranges. Combined predicates handle complex conditions like needing to lose weight, not being healthy, and avoiding sugar. Assertions validate filtering results for specific weight conditions, ensuring correct categorization of individuals based on their weight. Each test case covers different scenarios, such as identifying individuals needing to lose weight, those not being healthy, and those needing to avoid sugar, ensuring accurate filtering outcomes.
 
## Functions

The `Function` functional interface in Java represents a single-valued function that takes one argument and produces a result. It's part of the `java.util.function` package.

### The Function Interface and Its Variants

The `Function` interface contains a single abstract method called `apply()`, which takes an argument of type `T` and returns a result of type `R`. 

```java
@FunctionalInterface
public interface Function<T, R> {
  R apply(T t);
  // default methods
}
```
This interface enables developers to define and use functions that transform input values into output values, facilitating various data processing tasks. With Function, we can create reusable and composable transformations, making code more concise and expressive. It's widely used in functional programming paradigms for mapping, filtering, and transforming data streams.

`Function` interface has several variants like `BiFunction`, `IntFunction`, and more. We'll also learn about them in sections to follow.

Let's see `Function` in action:
```java
@Test
void simpleFunction() {
  Function<String, String> toUpper = s -> s == null ? null : s.toUpperCase();
  Assertions.assertEquals("JOY", toUpper.apply("joy"));
  Assertions.assertNull(toUpper.apply(null));
}
```
The test applies a `Function` to convert a lowercase string to uppercase. It asserts the converted value and also checks for `null` input handling.

## Function Composition

Function composition is a process of combining multiple functions to create a new function. The `compose` method in Function interface combines two functions by applying the argument function first and then the caller function. Conversely, the `andThen` method applies the caller function first and then the argument function.

For example, if we have two functions: one to convert a string to upper case and another to remove vowels from it, we can compose them using `compose` or `andThen`. If we use `compose`, it first converts the string to uppercase and then removes vowels from it. Conversely, if we use `andThen`, it first removes vowels from it and then converts the string to uppercase.

Let's verify function composition:

```java
void functionComposition() {
  Function<String, String> toUpper = s -> s == null ? null : s.toUpperCase();
  Function<String, String> replaceVowels =
      s ->
          s == null
              ? null
              : s.replace("A", "")
                  .replace("E", "")
                  .replace("I", "")
                  .replace("O", "")
                  .replace("U", "");
  Assertions.assertEquals("APPLE", toUpper.compose(replaceVowels).apply("apple"));
  Assertions.assertEquals("PPL", toUpper.andThen(replaceVowels).apply("apple"));
}
```
In the `functionComposition` test, two functions are composed to manipulate a string. The first function converts the string to uppercase, while the second one removes vowels. Using `compose`, it first removes vowels and then converts to uppercase. Using `andThen`, it first converts to uppercase and then removes vowels. We verify the results using assertion.

## BiFunction

The `BiFunction` interface represents a function that accepts two arguments and produces a result. It's similar to the Function interface, but it operates on two input parameters instead of one.

```java
@FunctionalInterface
public interface BiFunction<T, U, R> {
  R apply(T t, U u);
  // default methods
```

For example, suppose we have a `BiFunction` that takes two integers as input and returns the bigger number. 

Let's define it and test the results:
```java
@Test
void biFunction() {
  BiFunction<Integer, Integer, Integer> bigger =
      (first, second) -> first > second ? first : second;
  Function<Integer, Integer> square = number -> number * number;

  Assertions.assertEquals(10, bigger.apply(4, 10));
  Assertions.assertEquals(100, bigger.andThen(square).apply(4, 10));
}
```
The `BiFunction` interface combines two input values and produces a result. In this test, `bigger` selects the larger of two integers. `square` then calculates the square of a number. The result of `bigger` is passed to `square`, which squares the larger integer.

## IntFunction

The `IntFunction` interface represents a function that takes an integer as input and produces a result of any type.

```java
@FunctionalInterface
public interface IntFunction<R> {
  R apply(int value);
}
```

It's a specialized version of the `Function` interface tailored for integers. We can define custom logic based on integer inputs and return values of any type, making it versatile for various use cases in Java programming.

Let's see the `IntFunction` in action:
```java
@Test
void intFunction() {
  IntFunction<Integer> square = number -> number * number;
  Assertions.assertEquals(100, square.apply(10));
}
```

The test applies an `IntFunction` to compute the square of an integer. It ensures that the square function correctly calculates the square of the input integer.

### IntToDoubleFunction

The `IntToDoubleFunction` interface represents a function that accepts an int-valued argument and produces a double-valued result. This is the int-to-double primitive specialization for `Function`.
```java
@FunctionalInterface
public interface IntToDoubleFunction {
  double applyAsDouble(int value);
}
```
This is a functional interface whose functional method is `applyAsDouble(int)`.

Let's see how to use `IntToDoubleFunction`:
```java
@Test
void intToDoubleFunction() {
  int principalAmount = 1000; // Initial investment amount
  double interestRate = 0.05; // Annual interest rate (5%)

  IntToDoubleFunction accruedInterest = principal -> principal * interestRate;
  Assertions.assertEquals(50.0, accruedInterest.applyAsDouble(principalAmount));
}
```
In this example, `IntToDoubleFunction` is used to define a function `accruedInterest` that calculates the interest accrued based on the principal amount provided as an integer input. Then the test verifies the calculated interest.

### IntToLongFunction

The `IntToLongFunction` interface represents a function that accepts an int-valued argument and produces a long-valued result. This is the int-to-long primitive specialization for `Function`.
```java
@FunctionalInterface
public interface IntToLongFunction {
  double applyAsLong(int value);
}
```
This is a functional interface whose functional method is `applyAsLong(int)`.

Functional interfaces like `IntToDoubleFunction` and `IntToLongFunction` are particularly useful when working with streams of primitive data types. For instance, if we have a stream of integers and we need to perform operations that require converting those integers to doubles or longs, we can use these functional interfaces within stream operations like `mapToInt`, `mapToDouble`, and `mapToLong`. This allows us to efficiently perform transformations on stream elements without the overhead of autoboxing and unboxing.

Let's see how `IntToLongFunction` helps us do clean coding:
```java
@Test
void intToLongFunction() {
  IntToLongFunction factorial =
      n -> {
        long result = 1L;
        for (int i = 1; i <= n; i++) {
          result *= i;
        }
        return result;
      };
  IntStream input = IntStream.range(1, 6);
  long[] result = input.mapToLong(factorial).toArray();
  Assertions.assertArrayEquals(new long[] {1L, 2L, 6L, 24L, 120L}, result);
}
```
This test utilizes an `IntToLongFunction` to calculate factorials for a given range of integers. Each integer in the range is mapped to its factorial as a long value, which is then collected into an array for verification against the expected results.

## LongFunction

The `LongFunction` interface represents a function that takes an long as input and produces a result of any type.
```java
@FunctionalInterface
public interface LongFunction<R> {
  R apply(long value);
}
```
It's a specialized version of the `Function` interface tailored for longs. We can define custom logic based on long inputs and return values of any type, making it versatile for various use cases in Java programming.

Let's see example of `LongFunction`:
```java
@Test
void longFunction() {
  LongFunction<Double> squareArea = side -> (double) (side * side);
  Assertions.assertEquals(400d, squareArea.apply(20L));
}
```
The test applies an `LongFunction` to compute the area of a square figure. It ensures that the function correctly calculates the area of square from the side in long.

### LongToDoubleFunction

The `LongToDoubleFunction` interface represents a function that accepts an long-valued argument and produces a double-valued result. This is the long-to-double primitive specialization for `Function`.
```java
@FunctionalInterface
public interface LongToDoubleFunction {
  double applyAsDouble(long value);
}
```
This is a functional interface whose functional method is `applyAsDouble(long)`.

Let's see an example of how to use `LongToDoubleFunction`:

```java
@Test
void longToDoubleFunction() {
  LongToDoubleFunction squareArea = side -> (double) (side * side);
  Assertions.assertEquals(400d, squareArea.applyAsDouble(20L));

  LongStream input = LongStream.range(1L, 6L);
  double[] result = input.mapToDouble(squareArea).toArray();
  Assertions.assertArrayEquals(new double[] {1.0, 4.0, 9.0, 16.0, 25.0}, result);
}
```

The test uses a `LongToDoubleFunction` to calculate the area of a square given its side length. It then asserts the result of applying the function to a specific side length. Finally, it maps a `LongStream` of side lengths to a `DoubleStream` of square areas and verifies the calculated values. It demonstrates that special interfaces like `LongToDoubleFunction` can be used directly as well as in stream processing.

### LongToIntFunction

The `LongToIntFunction` interface represents a function that accepts an long-valued argument and produces a integer-valued result. This is the long-to-integer primitive specialization for `Function`.
```java
@FunctionalInterface
public interface LongToIntFunction {
  int applyAsInt(long value);
}
```
This is a functional interface whose functional method is `applyAsInt(long)`.

Let's learn how to use `LongToIntFunction`:
```java
@Test
void longToIntFunction() {
  LongToIntFunction digitCount = number -> String.valueOf(number).length();
  LongStream input = LongStream.of(1L, 120, 15L, 12345L);
  int[] result = input.mapToInt(digitCount).toArray();
  Assertions.assertArrayEquals(new int[] {1, 3, 2, 5}, result);
}
```
The test utilizes a `LongToIntFunction` to count the number of digits in a given long value. It applies the function to each value in a `LongStream`, converting them to an `IntStream` of digit counts. Finally, it verifies the calculated digit counts against the expected values.

## DoubleFunction

The `DoubleFunction` interface represents a function that accepts a double-valued argument and produces a result.

```java
@FunctionalInterface
public interface DoubleFunction<R> {
  R apply(double value);
}
```
This is the double-consuming primitive specialization for `Function`. This is a functional interface whose functional method is apply(double).
 
Let's example showing how to use `DoubleFunction`:
```java
@Test
void doubleFunction() {
  // grouping separator like a comma for thousands
  //  exactly two digits after the decimal point
  DoubleFunction<String> numberFormatter = number -> String.format("%1$,.2f", number);
  Assertions.assertEquals("999,999.12", numberFormatter.apply(999999.123));
}
```
The test uses a `DoubleFunction` to format a `double` number with a comma for thousands and two decimal places, asserting that the result is "999,999.12".

### DoubleToIntFunction

The `DoubleToIntFunction` interface represents a function that accepts a double-valued argument and produces an int-valued result.

```java
@FunctionalInterface
public interface DoubleToIntFunction {
  int applyAsInt(double value);
}
```
This is the double-to-int primitive specialization for `Function`. This is a functional interface whose functional method is `applyAsInt(double)`.
 
Here is an example showing how to use `DoubleToIntFunction`:
```java
@Test
void doubleToIntFunction() {
  DoubleToIntFunction wholeNumber = number -> Double.valueOf(number).intValue();
  DoubleStream input = DoubleStream.of(1.0, 12.34, 99.0, 101.444);
  int[] result = input.mapToInt(wholeNumber).toArray();
  Assertions.assertArrayEquals(new int[] {1, 12, 99, 101}, result);
}
```
The test converts double numbers to integers using a `DoubleToIntFunction`. It asserts that the result is [1, 12, 99, 101] when applied to the input [1.0, 12.34, 99.0, 101.444].

### DoubleToLongFunction

The `DoubleToLongFunction` interface represents a function that accepts a double-valued argument and produces an long-valued result.

```java
@FunctionalInterface
public interface DoubleToLongFunction {
  int applyAsLong(double value);
}
```
This is the double-to-long primitive specialization for `Function`. This is a functional interface whose functional method is `applyAsLong(double)`.
 
Example showing how to use `DoubleToLongFunction`:
```java
@Test
void doubleToLongFunction() {
  DoubleToLongFunction celsiusToFahrenheit 
    = celsius -> Math.round(celsius * 9 / 5 + 32);
  DoubleStream input = DoubleStream.of(0.0, 25.0, 100.0);
  long[] result = input.mapToLong(celsiusToFahrenheit).toArray();
  Assertions.assertArrayEquals(new long[] {32, 77, 212}, result);
}
```
This test converts Celsius temperatures to Fahrenheit using a `DoubleToLongFunction`. It then verifies the results match the expected Fahrenheit temperatures.

## Specialized Functions

Now let's get familiar with specialized functions.

### ToDoubleFunction

The `ToDoubleFunction` interface represents a function that produces a double-valued result.
```java
@FunctionalInterface
public interface ToDoubleFunction<T> {
  double applyAsDouble(T t);
}
```
This is the double-producing primitive specialization for `Function`. This is a functional interface whose functional method is `applyAsDouble(Object)`. 

Let's try to use `ToDoubleBiFunction`:
```java
@Test
void toDoubleFunction() {
  ToDoubleFunction<Integer> fahrenheitToCelsius =
      (fahrenheit) -> (double) ((fahrenheit - 32) * 5) / 9;
  Assertions.assertEquals(0.0, fahrenheitToCelsius.applyAsDouble(32));
  Assertions.assertEquals(25.0, fahrenheitToCelsius.applyAsDouble(77));
  Assertions.assertEquals(100.0, fahrenheitToCelsius.applyAsDouble(212));
}
```
This test converts Fahrenheit temperatures to Celsius using the formula `(Fahrenheit - 32) * 5/9`. It verifies conversions for temperatures 32°F, 77°F, and 212°F, checking if they match the expected Celsius values: 0.0, 25.0, and 100.0, respectively.

### ToDoubleBiFunction

The `ToDoubleBiFunction` interface represents a function that accepts two arguments and produces a double-valued result.

```java
@FunctionalInterface
public interface ToDoubleBiFunction<T, U> {
  double applyAsDouble(T t, U u);
}
```
This is the double-producing primitive specialization for `BiFunction`. This is a functional interface whose functional method is `applyAsDouble(Object, Object)`.
 
Let's try to use `ToDoubleBiFunction`:
```java
@Test
void toDoubleBiFunction() {
  // 30% discount when it is SALE else 10% standard discount
  ToDoubleBiFunction<String, Double> discountedPrice =
      (code, price) -> "SALE".equals(code) ? price * 0.7 : price * 0.9;
  Assertions.assertEquals(14.0, discountedPrice.applyAsDouble("SALE", 20.0));
  Assertions.assertEquals(18.0, discountedPrice.applyAsDouble("OFF_SEASON", 20.0));
}
```
This test calculates discounted prices based on a code. If the code is "SALE," a 30% discount is applied; otherwise, a 10% discount is applied. It verifies the discounted prices for both scenarios.

### ToIntFunction

The `ToIntFunction` interface represents a function that produces an int-valued result.

```java
@FunctionalInterface
public interface ToIntFunction<T> {
  int applyAsInt(T t);
}
```
This is the int-producing primitive specialization for `Function`. This is a functional interface whose functional method is `applyAsInt(Object).`

Let's check how to put `ToIntFunction` to use:

```java
@Test
void toIntFunction() {
  ToIntFunction<String> charCount = input -> input == null ? 0 : input.trim().length();

  Assertions.assertEquals(0, charCount.applyAsInt(null));
  Assertions.assertEquals(0, charCount.applyAsInt(""));
  Assertions.assertEquals(3, charCount.applyAsInt("JOY"));
}
```
This test counts the characters in a string using a function. It verifies the character count for null, empty string, and "JOY", expecting 0, 0, and 3, respectively. The function handles null inputs gracefully, returning 0, and trims white space before counting characters.

### ToIntBiFunction

The `ToIntBiFunction` interface represents a function that accepts two arguments and produces an int-valued result.

```java
@FunctionalInterface
public interface ToIntBiFunction<T, U> {
  int applyAsInt(T t, U u);
}
```

This is the int-producing primitive specialization for `BiFunction`. This is a functional interface whose functional method is `applyAsInt(Object, Object)`.

Let's learn to use `ToIntBiFunction`:

```java
@Test
void toIntBiFunction() {
  // discount on product
  ToIntBiFunction<String, Integer> discount =
      (season, quantity) -> "WINTER".equals(season) || quantity > 100 ? 40 : 10;

  Assertions.assertEquals(40, discount.applyAsInt("WINTER", 50));
  Assertions.assertEquals(40, discount.applyAsInt("SUMMER", 150));
  Assertions.assertEquals(10, discount.applyAsInt("FALL", 50));
}
```
This test calculates discounts based on the season and quantity. If it's winter or the quantity exceeds 100, a 40% discount is applied; otherwise, it's 10%. The test validates discounts for winter with 50 items, summer with 150 items, and fall with 50 items, expecting 40, 40, and 10, respectively.

### ToLongFunction

The `ToLongFunction` interface represents a function that produces an long-valued result.

```java
@FunctionalInterface
public interface ToLongFunction<T> {
  long applyAsLong(T t);
}
```
This is the long-producing primitive specialization for `Function`. This is a functional interface whose functional method is `applyAsLong(Object).`

Let's implement a `ToLongFunction` expression:

```java
@Test
void toLongFunction() {
  ToLongFunction<Date> elapsedTime =
      input -> input == null ? 0 : input.toInstant().toEpochMilli();

  Assertions.assertEquals(0L, elapsedTime.applyAsLong(null));
  long now = System.currentTimeMillis();
  Date nowDate = Date.from(Instant.ofEpochMilli(now));
  Assertions.assertEquals(now, elapsedTime.applyAsLong(nowDate));
}
```
This test calculates the elapsed time in milliseconds using `ToLongFunction`. It checks if the input date is null and returns 0, otherwise, it converts the date to milliseconds since the epoch. The test verifies the result for both null input and the current time.
   
### ToLongBiFunction

The `ToLongBiFunction` interface represents a function that accepts two arguments and produces an long-valued result.

```java
@FunctionalInterface
public interface ToLongBiFunction<T, U> {
  long applyAsLong(T t, U u);
}
```

This is the long-producing primitive specialization for `BiFunction`. This is a functional interface whose functional method is `applyAsLong(Object, Object)`.

Let's see example of `ToLongBiFunction`:

```java
@Test
void toLongBiFunction() {
  // discount on product
  ToLongBiFunction<LocalDateTime, ZoneOffset> elapsed =
      (localDateTime, zoneOffset) ->
          zoneOffset == null
              ? localDateTime.toEpochSecond(ZoneOffset.UTC)
              : localDateTime.toEpochSecond(zoneOffset);

  long now = System.currentTimeMillis();
  LocalDateTime nowLocalDateTime = LocalDateTime.ofEpochSecond(now, 0, ZoneOffset.UTC);
  Assertions.assertEquals(now, elapsed.applyAsLong(nowLocalDateTime, null));

  long later = now + 1000;
  ZoneOffset offset = ZoneOffset.ofHours(5);
  LocalDateTime laterLocalDateTime = LocalDateTime.ofEpochSecond(later, 0, offset);
  Assertions.assertEquals(later, elapsed.applyAsLong(laterLocalDateTime, offset));
}
```
This test calculates the elapsed time in seconds using `ToLongBiFunction`, considering the zone offset. It verifies the result for both a null offset and a specified offset. The test ensures correctness by comparing the calculated elapsed time with the expected value.

## Operators  
   - Unary and binary operators
   - UnaryOperator<T>
   - IntUnaryOperator
   - LongUnaryOperator
   - DoubleUnaryOperator
   - BinaryOperator<T>
   - IntBinaryOperator
   - LongBinaryOperator
   - DoubleBinaryOperator

## Consumers  
   - Implementing `Consumer` and `BiConsumer`
   - Consumer<T>
   - BiConsumer<T,U>
   - IntConsumer
   - LongConsumer
   - DoubleConsumer
   - ObjIntConsumer<T>
   - ObjLongConsumer<T>
   - ObjDoubleConsumer<T>

## Suppliers  
   - Creating and using suppliers
   - Lazy initialization and other applications
   - Supplier<T>
   - IntSupplier
   - LongSupplier
   - DoubleSupplier
   - BooleanSupplier

## Conclusion
In this article, we learned how Java records make data class construction easier by reducing repetitive code and 
automating functions such as `equals()`, `hashCode()`, and `toString()`. Following best practices promotes effective use, 
focusing on appropriate scenarios and preserving code readability. Adopting records results in more efficient and manageable Java codebases.

Equipped with the knowledge of Java records, go, create, innovate, and let the code shape the future! 

Happy coding! 🚀
