---
authors: [sagaofsilence]
title: "One Stop Guide to Java Functional Interfaces"
categories: ["Java"]
date: 2024-06-11 00:00:00 +1100
excerpt: "Get familiar with Java Functional Interfaces."
image: images/stock/0088-jigsaw-1200x628-branded.jpg
url: one-stop-guide-to-java-functional-interfaces
---

## Introduction to Functional Programming  

Functional programming is a paradigm that focuses on the use of functions to create clear and concise code. Instead of modifying data and maintaining state like in traditional imperative programming, functional programming treats functions as first-class citizens. That makes it possible to assign them to variables, pass as arguments, and return from other functions. This approach can make code easier to understand and reason about.

{{% github "https://github.com/thombergs/code-examples/tree/master/core-java/functional-programming/functional-interfaces" %}}

### History of Functional Programming

Lambda calculus, also known as *λ-calculus*, is a formal system in mathematical logic used to express computation through function abstraction and application with variable binding and substitution. Alonzo Church, a mathematician, introduced it in the 1930s as part of his mathematical foundations research.

John McCarthy created Lisp, the initial high-level functional programming language, in the late 1950s at Massachusetts Institute of Technology (MIT) for the IBM 700/7000 series of scientific computers. Lisp introduced many concepts central to functional programming, like first-class functions and recursion. Lisp influenced many modern functional languages.

Moving forward, in the 1970s, languages like ML (Meta Language) and Scheme built on these ideas, introducing features like type inference and lazy evaluation. Haskell, another pivotal language introduced in the 1990s, brought pure functional programming to the forefront with its strong emphasis on immutability and function composition.

These languages laid the groundwork for many features we see in Java 8. Inspired by these pioneers, Java adopted functional programming principles to enhance its expressiveness and conciseness. Lambda expressions, method references, and a rich set of functional interfaces like `Function`, `Predicate`, and `Consumer` are now part of Java’s repertoire.

### Competition from Scala and Python

Scala and Python are indeed strong competitors in the functional programming space.

Scala combines object-oriented and functional programming paradigms. It gained traction among Java developers looking for more powerful abstractions. Its compatibility with the JVM and expressive syntax made it a compelling alternative.

Python’s simplicity, readability, and support for functional programming through features like list comprehensions, lambda functions, and higher-order functions made it a favorite for many developers, especially in the fields of data science and web development.

By integrating functional programming features, Java aimed to provide its existing user base with modern tools without needing to switch languages, ensuring it remained a versatile and powerful choice for a wide range of applications.

### Functional Programming in Java  

In recent years, functional programming has gained popularity due to its ability to help manage complexity, especially in large-scale applications. It emphasizes immutability, avoiding side effects, and working with data in a more predictable and modular way. This makes it easier to test and maintain code.

Java, traditionally an object-oriented language, adopted functional programming features in Java 8. The following factors triggered this move:

- **Simplifying Code**: Functional programming can reduce boilerplate code and make code more concise, leading to easier maintenance and better readability.

- **Concurrency and Parallelism**: Functional programming works well with modern multicore architectures, enabling efficient parallel processing without worrying about shared state or side effects.

- **Expressiveness and Flexibility**: By embracing functional interfaces and lambda expressions, Java gained a more expressive syntax, allowing us to write flexible and adaptable code.

Functional programming in Java revolves around several key concepts and idioms:

- **Lambda Expressions**: Use these compact functions wherever we need to provide a functional interface. They help reduce boilerplate code.

- **Method References**: These are a shorthand way to refer to methods, making code even more concise and readable.

- **Functional Interfaces**: These are interfaces with a single abstract method, making them perfect for lambda expressions and method references. Common examples include `Predicate`, `Function`, `Consumer`, `Supplier`, and `Operator`.

### Advantages and Disadvantages of Functional Programming  

Functional programming in Java brings many advantages but also has its share of disadvantages and challenges.

**One of the key benefits of functional programming is that it improves code readability.** Functional code tends to be concise, thanks to lambda expressions and method references, leading to reduced boilerplate and easier code maintenance. This focus on immutability—where data structures remain unchanged after creation—helps to reduce side effects and prevents bugs caused by unexpected changes in state.

**Another advantage is its compatibility with concurrency and parallelism.** Since functional programming promotes immutability, operations can run in parallel without the usual risks of data inconsistency or race conditions. This results in code that's naturally better suited for multithreaded environments.

**Functional programming also promotes modularity and reusability.** With functions being first-class citizens, we create small, reusable components, leading to cleaner, more maintainable code. The abstraction inherent in functional programming reduces overall complexity, allowing us to focus on the essential logic without worrying about implementation details.

However, these advantages come with potential drawbacks. The learning curve for functional programming can be steep, especially for us accustomed to imperative or object-oriented paradigms. **Concepts like higher-order functions and immutability might require a significant mindset shift.**

**Performance overheads are another concern**, particularly due to frequent object creation and additional function calls in functional programming. This could impact performance in resource-constrained environments. **Debugging functional code can also be challenging** due to the abstractions involved, and understanding complex lambda expressions might require a deeper understanding of functional concepts.

**Compatibility issues may arise when integrating with legacy systems** or libraries that aren't designed for functional programming, potentially causing integration problems. Finally, functional programming's focus on immutability and side-effect-free functions **may reduce flexibility in scenarios that require mutability or complex object manipulations.**

Ultimately, while functional programming offers significant benefits like improved readability and easier concurrency, it also comes with challenges. **We need to consider both the advantages and disadvantages to determine how functional programming fits into our Java applications.**

## Understanding Functional Interfaces  

The `@FunctionalInterface` annotation in Java is a special marker that makes an interface a functional interface. **A functional interface is an interface with a single abstract method (SAM).** That makes it possible to use it as a target for lambda expressions or method references.

This annotation serves as a way to document our intention for the interface and provides a layer of protection against accidental changes. By using `@FunctionalInterface`, we indicate that the interface should maintain its single-method structure. If we add more abstract methods, the compiler will generate an error, ensuring the functional interface's integrity.

Functional interfaces are central to Java's support for functional programming. They allow us to write cleaner, more concise code by using lambda expressions, reducing boilerplate code, and promoting reusability. Common examples of functional interfaces include `Predicate`, `Consumer`, `Function`, and `Supplier`.

Using the `@FunctionalInterface` annotation isn't strictly necessary. Any interface with a single abstract method is inherently a functional interface. But it's a good practice. It improves code readability, enforces constraints, and helps others to understand our intentions, contributing to better maintainability and consistency in our codebase.

## Creating Custom Functional Interfaces

We now know that a functional interface in Java is an interface with a single abstract method.

Let's consider a simple calculator example that takes two integers and returns the result of an arithmetic operation. To implement this, we can define a functional interface called `ArithmeticOperation`, which has a single method to perform the operation.

Here's the definition of the functional interface:

```java
@FunctionalInterface
interface ArithmeticOperation {
    int operate(int a, int b);
}
```

Consider the `ArithmeticOperation` interface, marked with `@FunctionalInterface`. This annotation makes it clear that the interface is functional, emphasizing that it should only contain one abstract method.

The `ArithmeticOperation` interface defines a single method, `operate()`, that takes two integers and returns an integer result. The use of this annotation documents that the interface is functional.

With this functional interface, we create different arithmetic operations, like addition, subtraction, multiplication, and division, using lambda expressions.

Let's build a basic calculator with this setup:

```java
@Test
void operate() {
  // Define operations
  ArithmeticOperation add = (a, b) -> a + b;
  ArithmeticOperation subtract = (a, b) -> a - b;
  ArithmeticOperation multiply = (a, b) -> a * b;
  ArithmeticOperation divide = (a, b) -> a / b;

  // Verify results
  assertEquals(15, add.operate(10, 5));
  assertEquals(5, subtract.operate(10, 5));
  assertEquals(50, multiply.operate(10, 5));
  assertEquals(2, divide.operate(10, 5));
}
```

The test `operate()` verifies if the defined arithmetic operations get accurate outcomes. Using the `ArithmeticOperation` functional interface, it begins by generating lambda expressions for the four fundamental arithmetic operations of addition, subtraction, multiplication, and division. After that, it uses assertions to confirm that the results of these operations on the integers 5 and 10 match the expected values.

## Built-in Functional Interfaces

Here's an overview of some of the most common built-in functional interfaces in Java 8, along with their typical use cases and examples:

| Functional Interface | Description                                                                                                                                                          | Example Use Cases                                                                                                                            |
|----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `Predicate<T>` | Represents a function that takes an input of type `T` and returns a `boolean`. Commonly used for filtering and conditional checks.                                   | <ul><li>Checking if a number is even</li><li>Filtering a list of strings based on length</li><li>Validating user inputs</li></ul>            |
| `Function<T, R>` | Represents a function that takes an input of type `T` and returns a result of type `R`. Often used for transformation or mapping operations.                         | <ul><li>Converting a string to uppercase</li><li>Mapping employee objects to their salaries</li><li>Parsing a string to an integer</li></ul> |
| `Consumer<T>` | Represents a function that takes an input of type `T` and performs an action, without returning a result. Ideal for side-effect operations like printing or logging. | <ul><li>Printing a list of numbers</li><li>Logging user actions</li><li>Updating object properties</li></ul>                                 |
| `Supplier<T>` | Represents a function that provides a value of type `T` without taking any arguments. Useful for lazy initialization and deferred computation.                       | <ul><li>Generating random numbers</li><li>Providing default values</li><li>Creating new object instances</li></ul>                           |
| `UnaryOperator<T>` | Represents a function that takes an input of type `T` and returns a result of the same type. Often used for simple transformations or operations.                    | <ul><li>Negating a number</li><li>Reversing a string</li><li>Incrementing a value</li></ul>                                                  |
| `BinaryOperator<T>` | Represents a function that takes two inputs of type `T` and returns a result of the same type. Useful for combining or reducing operations.                          | <ul><li>Adding two numbers</li><li>Concatenating strings</li><li>Finding the maximum of two values</li></ul>                                 |

These built-in functional interfaces in Java 8 provide a foundation for functional programming, enabling us to work with lambda expressions and streamline code. Due to their versatility, we can use them in a wide range of applications, from data transformation to filtering and beyond.

## Lambda Expressions Explained  

**Lambda expressions are a key feature of Java 8, allowing us to create compact, anonymous functions in a clear and concise manner.** They are a cornerstone of functional programming in Java and provide a way to represent functional interfaces in a simpler form.

The general syntax of a lambda expression is as follows:

```java
(parameters) -> { body }
```

Parameters represent a comma-separated list of input parameters to the lambda function. If there's only one parameter, we can omit the parentheses. The arrow operator separates the parameters from the body of the lambda expression. Finally, the body contains the function logic. If there's only one statement, we can omit the braces. Typically, the logic in the body will be concise. But it can be complex, multiline logic as per requirements.

Example of crisp lambda expression:

```java
Function<String, String> toUpper = s -> s == null ? null : s.toUpperCase();
```

Example of complex lambda expression:

```java
IntToLongFunction factorial =
        n -> {
          long result = 1L;
          for (int i = 1; i <= n; i++) {
            result *= i;
          }
          return result;
        };
```

We can use lambda expressions to create anonymous functions. That allows us to write inline logic without the need for additional class definitions. We can use such anonymous functions where it requires us to pass functional interfaces.

{{% info title="Inner Workings of Lambda Expressions" %}}
Have you ever wondered what a lambda expression looks like in Java code and inside the JVM? It's quite fascinating! In Java, we have two types of values: primitive types and object references. Now, lambdas are definitely not primitive types, which means they must be something else. Well, a lambda expression is actually a special kind of expression that returns an object reference. Isn't that intriguing?

Let's decode it. We start by writing a lambda expression in our source code.

For example:

```java
public class Lambda {
  LongFunction<Double> squareArea = side -> (double) (side * side);
}
```

When we compile it and check its bytecode using `javap` command:

```bash
javap -c -p Lambda.class
Compiled from "Lambda.java"
public class Lambda {
java.util.function.LongFunction<java.lang.Double> squareArea;

public Lambda();
Code:
  0: aload_0
  1: invokespecial #1      // Method java/lang/Object."<init>":()V
  4: aload_0
  5: invokedynamic #7,0//InvokeDynamic #0:apply:()Ljava/util/function/LongFunction;
10: putfield      #11 // Field squareArea:Ljava/util/function/LongFunction;
13: return

private static java.lang.Double lambda$new$0(long);
Code:
  0: lload_0
  1: lload_0
  2: lmul
  3: l2d
  4: invokestatic  #17 // Method java/lang/Double.valueOf:(D)Ljava/lang/Double;
  7: areturn
}
```

Did you notice that the bytecode starts with a `invokedynamic` call? Imagine it as a call to a unique factory method. This method returns an instance of a type that implements `Runnable`. The compiler does not define the specific type in the bytecode and knowing the exact type is not important. It generates the type at runtime when needed, not during compilation.

- **Compilation**: When we compile the code, the Java compiler transforms the lambda expression into a form that the Java Virtual Machine (JVM) can understand. Instead of generating a new anonymous inner class, the compiler uses a technique called *invokedynamic* introduced in Java 7.

- **InvokeDynamic**: The *invokedynamic* bytecode instruction supports dynamic languages on the JVM. For lambdas, it allows the JVM to defer the decision of how to create the lambda instance until runtime. This provides more flexibility and efficiency compared to traditional anonymous inner classes.

- **Lambda Metafactory**: When runtime encounters the *invokedynamic* instruction, it calls a special method called `LambdaMetafactory.metafactory()`. This method is responsible for creating the actual implementation of the lambda expression. The JVM uses this metafactory method to generate a lightweight class or method handle that represents the lambda.

- **Instance Creation**: The `LambdaMetafactory` dynamically creates an instance of the lambda expression. This instance is typically a singleton if the lambda is stateless (i.e., it doesn't capture any variables from the enclosing scope). If the lambda captures variables, it creates a new instance with those captured values.

- **Execution**: It executes the lambda expression as if it were an instance of an anonymous inner class implementing the functional interface. The JVM ensures that the lambda conforms to the expected functional interface's single abstract method.

{{% /info %}}
\
Here are a few examples demonstrating how to use lambda expressions without relying on built-in functional interfaces:

### Example 1: Implementing a Custom Functional Interface

We have already seen a custom functional interface for arithmetic operation:

```java
interface ArithmeticOperation {
    int operate(int a, int b);
}
```

we create lambda expressions to implement this interface:

```java
ArithmeticOperation add = (a, b) -> a + b;
ArithmeticOperation subtract = (a, b) -> a - b;
```

### Example 2: Anonymous Comparator

It is not mandatory to define a custom functional interface and then use it to declare lambdas:

```java
List<String> words = Arrays.asList("apple", "banana", "cherry");
Collections.sort(words, (s1, s2) -> Integer.compare(s1.length(), s2.length()));
```

In this example, we created an anonymous comparator to sort a list of strings by length.

### Example 3: `Runnable` for a Thread

We can also use lambda expressions to create a `Runnable` for threads:

```java
Thread thread = new Thread(() -> {
    System.out.println("Running in a lambda!");
});
thread.start();
```

This example demonstrates how we create an executable using lambda.

These examples demonstrate how we can use lambda expressions to define simple, concise functions without explicitly creating additional classes. They are powerful tools for streamlining code and making functional programming in Java more accessible and expressive.

### Lambda Expressions and Var

You cannot also use var with lambda expressions because they require an explicit target type. The following assignment will fail:

```java
var addAsVar = (a, b) -> a + b;
```

It gives the error: Cannot infer type: lambda expression requires an explicit target type.

The code is incorrect because we cannot use `var` to infer the type of lambda expression itself. We can use the `var` only for local variable type inference, not for lambda expressions or method return types.

Let's now see how we can use `var` in lambda expressions:

```java
ArithmeticOperation add = (var a, var b) -> a + b;
```

The lambda expression (var a, var b) -> a + b defines a lambda that takes two parameters a and b, both using the var keyword to indicate that the types should be inferred by the compiler. This lambda performs addition on the two parameters.

We can also use bean validation annotations:

```java
ArithmeticOperation addNullSafe = (@NotNull var a, @NotNull var b) -> a + b;
```

Similar to the previous example, this lambda also takes two parameters with `var`. Additionally, it uses the `@NotNull` annotation from bean validation library. This ensures that the parameters `a` and `b` should not be `null`.

## Method References  

**Method references are a shorthand way to refer to existing methods by their name.** Instead of using lambda expressions, use method references to write code that is more concise and easier to read. Use method references to pass executable logic. Such deferred method invocation makes them ideal for functional programming scenarios and stream processing.

Java 8 provides four types of method references:

1. Reference to a Static Method
1. Reference to an Instance Method of a Particular Type
1. Reference to an Instance Method of an Arbitrary Object of a Particular Type
1. Reference to a Constructor

Let's learn about them.

### Reference to a Static Method

**A static method reference refers to a static method in a class.** It uses the class name followed by `::` and the method name:

```java
ContainingClass::staticMethodName
```

Let's see an example of static reference:

```java
public class MethodReferenceTest {
  @Test
  void staticMethodReference() {
    List<Integer> numbers = List.of(1, -2, 3, -4, 5);
    List<Integer> positiveNumbers = numbers.stream().map(Math::abs).toList();
    positiveNumbers.forEach(number -> Assertions.assertTrue(number > 0));
  }
}
```

The test `staticMethodReference` in the `MethodReferenceTest` class verifies the use of a static method reference. It creates a list of integers, `numbers`, containing both positive and negative values. Using a stream, it applies the `Math::abs` method reference to convert each number to its absolute value, resulting in a new list, `positiveNumbers`. The test then checks that each element in `positiveNumbers` is positive.

### Reference to an Instance Method of a Particular Type

**This type of method reference refers to an instance method of a specific type.**

There are two primary syntaxes for referencing instance methods: using a containing class or using a specific object instance.

**Using a Containing Class**:

```java
ContainingClass::instanceMethodName
```

The `ContainingClass::instanceMethodName` syntax denotes an instance method belonging to a particular class. This method reference is not for a specific object instance but rather signifies that any object of that class can use the method. We commonly use it in stream operations, where we know the object instance at runtime.

For example, we can use `String::toLowerCase` to refer to the `toLowerCase()` method on any `String` object. Use it in a stream operation like `.map(String::toLowerCase)` to apply it to each string in the stream.

Containing class instance method reference example:

```java
@Test
void containingClassInstanceMethodReference() {
  List<String> numbers = List.of("One", "Two", "Three");
  List<Integer> numberChars = numbers.stream().map(String::length).toList();
  numberChars.forEach(length -> Assertions.assertTrue(length > 0));
}
```

The `containingClassInstanceMethodReference` test verifies the use of an instance method reference. It creates a list of strings, `numbers`, containing "One", "Two", and "Three". Using a stream, it applies the `String::length` method reference to convert each string into its length, resulting in a new list, `numberChars`. The test checks that each element in `numberChars` is greater than zero, ensuring that all strings have a positive length.

**Using a Specific Object**:

```java
containingObject::instanceMethodName
```

The syntax `containingObject::instanceMethodName` refers to an instance method of a specific object. It binds this method reference to a particular object, allowing us to call its method directly when needed.

For example, if we have an instance `str` of `String`, we can refer to its `length()` method with `str::length`. This approach is useful when we need to use a specific object's method in a lambda expression or a stream operation.

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
  Assertions.assertEquals(expected, sorted);
}
```

The code snippet sorts a list of strings using an instance method reference. The `StringNumberComparator` class defines a comparison logic for strings. The `comparator::compare` is a method reference that references the `compare` method of the `StringNumberComparator` instance. It passes method reference to `sorted()`, allowing the stream to sort the `numbers` list according to the specified comparison logic. The test checks if the sorted list matches the expected order.

**Comparison of two syntaxes**:
Both syntaxes are useful in different scenarios. The class-based method reference is more flexible, allowing us to reference methods without tying them to a specific object. The object-based method reference, on the other hand, is helpful when we want to use a method tied to a specific object instance. Both approaches provide a more concise way to call instance methods without the need for traditional anonymous classes or explicit lambda expressions.

### Reference to an Instance Method of an Arbitrary Object of a Particular Type

This type also refers to an instance method, but it determines the exact object at runtime, allowing flexibility when dealing with collections or stream operations:

```java
@Test
void instanceMethodArbitraryObjectParticularType() {
  List<Number> numbers = List.of(1, 2L, 3.0f, 4.0d);
  List<Integer> numberIntValues = numbers.stream().map(Number::intValue).toList();
  
  Assertions.assertEquals(List.of(1, 2, 3, 4), numberIntValues);
}
```

The `instanceMethodArbitraryObjectParticularType` test checks the use of method reference to instance method for an arbitrary object of a particular type. It creates a list of `Number` objects (`numbers`) containing various types of numeric values: a `int`, a `long`, a `float`, and a `double`.

Using a stream, it maps each `Number` to its integer value using the `Number::intValue` method reference, resulting in a list of integers (`numberInvValues`). The test then compares this list with the expected result.

### Reference to a Constructor

**A constructor reference refers to a class constructor, allowing us to create new instances through a method reference.**

Its syntax is as follows:

```java
ContainingClass::new
```

The `ContainingClass::new` points to the constructor of a specific class, allowing us to create new instances.

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
  
  Assertions.assertEquals(expected, numberMapping);
}
```

The `constructorReference` test demonstrates the use of a constructor reference in a stream operation. It creates a list of strings (`numbers`) containing "1", "2", and "3". Using a stream, it maps each string to a `BigInteger` object by referencing the `BigInteger` constructor with `BigInteger::new`.

The test then collects the resulting `BigInteger` objects into a `Map`, where the keys are the original strings, and the values are the corresponding `BigInteger` instances. It uses `Collectors.toMap` with a lambda expression (`BigInteger::toString`) to create the keys and `Function.identity()` for the values.

Finally, the test compares it with an expected map (`expected`) containing the same key-value pairs.

Let's summarize the use cases for method references, along with descriptions and examples:

| Type of Method Reference                                | Description                                             | Example                                                 |
|---------------------------------------------------------|---------------------------------------------------------|---------------------------------------------------------|
| Reference to a Static Method                            | Refers to a static method in a class. This type of method reference uses the class name followed by `::` and the method name. | <code>Function<Integer, Integer> square = MathOperations::square;</code>|
| Reference to an Instance Method of a Particular Object  | Refers to an instance method of a specific object. The instance must be explicitly defined before using the method reference. | <code>Supplier<String> getMessage = stringUtils::getMessage;</code>|
| Reference to an Instance Method of an Arbitrary Object of a Particular Type | Refers to an instance method of an arbitrary object of a specific type. We commonly use this type in stream operations, where Java determines the object type at runtime. | <code>List<String> uppercasedWords = words.stream()<br>.map(String::toUpperCase)<br>.collect(Collectors.toList());<code>|
| Reference to a Constructor                              | Refers to a class constructor, allowing us to create new instances. This type is useful when we need to create objects without explicitly calling a constructor. | <code>Supplier<Car> carSupplier = Car::new;<code>|

## Predicates

**Predicates are functional interfaces in Java that represent boolean-valued functions of a single argument.** They are commonly used for filtering, testing, and conditional operations.

The `Predicate` functional interface is part of the `java.util.function` package and defines a functional method `test(T t)` that returns a `boolean`.  It also provides default methods that allow combining two predicates:

```java
@FunctionalInterface
public interface Predicate<T> {
    boolean test(T t);
    // default methods
}
```

The `test()` method evaluates the predicate on the input argument and determines whether it satisfies the condition defined by the predicate.

We often use predicates with the `stream()` API for filtering elements based on certain conditions. Pass them as arguments to methods like `filter()` to specify the criteria for selecting elements from a collection.

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

In the test `testFiltering()` method, first we populate a list of integers. Then we define a predicate `isEven` to check if a number is even. Using `stream()` and `filter()` methods, we filter the list to contain only even numbers. Finally, we compare the filtered list to the expected list.

### Combining Predicates

**We can combine predicates using logical operators such as `and()`, `or()`, `negate()` and `not()` to create complex conditions.**

Let's see how to combine the practices:

```java
@Test
void testPredicate() {
  List<Integer> numbers = List.of(-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5);
  Predicate<Integer> isZero = num -> num == 0;
  Predicate<Integer> isPositive = num -> num > 0;
  Predicate<Integer> isNegative = num -> num < 0;
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

In this test, we have combined predicates to filter a list of numbers. `isPositiveOrZero` combines predicates for positive numbers or zero. `isPositiveAndOdd` combines predicates for positive and odd numbers. `isNotPositive` negates the predicate for positive numbers. `isNotZero` negates the predicate for zero. `isAlsoZero` shows us how to chain predicates. We apply each combined predicate to the list, and verify the expected results.

### Predicate Evaluation Order

When we combine multiple predicates, we need to pay attention to the order the predicates are evaluated.

Consider the following example:

```java
Predicate<Integer> isPositive = x -> x > 0;
Predicate<Integer> isDiv3 = x -> x % 3 == 0;
Predicate<Integer> isOdd = x -> x % 2 != 0;
```

Following table explains the evaluation order.

| Predicate Expression | Evaluation Order                                                | Description |
|-----|-----------------------------------------------------------------|-----|
|Predicate<Integer> test1 = isPositive.or(isDiv3).and(isOdd)| <ol><li>isPositive or isDiv3</li><li>Result and isOdd</li></ol> | First checks if the number is positive or divisible by 3, then checks if the result is odd.|
|Predicate<Integer> test2 = isPositive.and(isOdd).or(isDiv3)| <ol><li>isPositive and isOdd</li><li>Result or isDiv3</li></ol> |First checks if the number is positive and odd, then checks if the result is true or if the number is divisible by 3.|
|Predicate<Integer> test3 = (isPositive.and(isOdd)).or(isDiv3)| <ol><li>isPositive and isOdd</li><li>Result or isDiv3</li></ol> | Same as test2, checks if the number is positive and odd, then checks if the result is true or if the number is divisible by 3.|
|Predicate<Integer> test4 = isPositive.and((isOdd).or(isDiv3))| <ol><li>isOdd or isDiv3</li><li>isPositive and result</li></ol> | First checks if the number is odd or divisible by 3, then checks if the number is positive and the previous result is true.|

Let's deep dive into the evaluation order of the first test:
`Predicate<Integer> test1: isPositive.or(isDiv3).and(isOdd);`

First, it evaluates the `isPositive` or `isDiv3` condition. If `isPositive` is true, then the result is true. If `isPositive` is false, proceed to check `isDiv3`. Then, if `isDiv3` is true, the result is true. Finally, if both `isPositive` and `isDiv3` are false, the result is false.

Next, take the result from the first step and evaluate it with `isOdd`. If the result from the first step is true, check the `isOdd` condition. If the result from the first step is false, the final result is false.

Similarly, it evaluates the order for other predicates given in the table above.

### BiPredicates

The `BiPredicate<T, U>` takes two arguments of types `T` and `U` and returns a boolean result. It's common to use them for testing conditions involving two parameters. For instance, we use `BiPredicate` to check if one value is greater than the other or if two objects satisfy a specific relationship. We may validate if a person's age and income meet certain eligibility criteria for a financial service.

`BiPredicate` defines a `test()` method with two arguments, and it returns a `boolean`. It also provides default methods that allow combining two predicates:

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

In the test, first, we defined an array of workers with their respective ages. We have created two `BiPredicate` instances: `juniorCarpenterCheck` and `juniorWelderCheck`. These predicates evaluate if a worker is within a certain age range (18 to 40) based on their occupation (Carpenter or Welder). Then we use these predicates to filter the array of workers using the `test()` method. Finally, we count the workers meeting the criteria for junior carpenters and junior welders and verify if they match the expected counts.

Now let's learn to use the default methods used to combine and negate:

```java
  @Test
  void testBiPredicateDefaultMethods() {
    // junior carpenters
    BiPredicate<String, Integer> juniorCarpenterCheck =
            (worker, age) -> "C".equals(worker) && (age >= 18 && age <= 40);
    // groomed carpenters
    BiPredicate<String, Integer> groomedCarpenterCheck =
            (worker, age) -> "C".equals(worker) && (age >= 30 && age <= 40);
    // all carpenters
    BiPredicate<String, Integer> allCarpenterCheck =
            (worker, age) -> "C".equals(worker) && (age >= 18);
    // junior welders
    BiPredicate<String, Integer> juniorWelderCheck =
            (worker, age) -> "W".equals(worker) && (age >= 18 && age <= 40);
    // junior workers
    BiPredicate<String, Integer> juniorWorkerCheck 
      = juniorCarpenterCheck.or(juniorWelderCheck);
    // junior groomed carpenters
    BiPredicate<String, Integer> juniorGroomedCarpenterCheck =
            juniorCarpenterCheck.and(groomedCarpenterCheck);
    // all welders
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

The test demonstrates default methods in `BiPredicate`. It defines predicates for various worker conditions, like junior carpenters and welders. Using default methods `or()`, `and()`, and `negate()`, it creates new predicates for combinations like all junior workers, groomed carpenters, and non-carpenters. We apply these predicates to filter workers, and verify the counts. This showcases how default methods enhance the functionality of `BiPredicate` by enabling logical operations like OR, AND, and negation.

### IntPredicate

**`IntPredicate` represents a predicate (boolean-valued function) that takes a single integer argument and returns a `boolean` result.**

```java
@FunctionalInterface
public interface IntPredicate {
    boolean test(int value);
    // default methods
}
```

This is the int-consuming primitive type specialization of Predicate.

Use `IntPredicate` to filter collections of primitive integer values or evaluate conditions based on integer inputs. It provides several default methods for composing predicates, including `and()`, `or()`, and `negate()`, allowing for logical combinations of predicates.

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

Like `IntPredicate`, we also have `LongPredicate` and `DoublePredicate`. These can be used to handle `long` and `double` values.

## Functions

**The `Function` functional interface in Java represents a single-valued function that takes one argument and produces a result.** It's part of the `java.util.function` package.

### The Function Interface and Its Variants

**The `Function` interface contains a single abstract method called `apply()`, which takes an argument of type `T` and returns a result of type `R`.**

```java
@FunctionalInterface
public interface Function<T, R> {
  R apply(T t);
  // default methods
}
```

This interface enables developers to define and use functions that transform input values into output values, facilitating various data processing tasks. With `Function` we create reusable and composable transformations, making code more concise and expressive. We widely use it for mapping, filtering, and transforming data streams.

`Function` interface has several variants like `BiFunction`, `IntFunction`, and more. We'll also learn about them in sections to follow.

Let's witness the power of `Function` in action:

```java

@Test
void simpleFunction() {
  Function<String, String> toUpper = s -> s == null ? null : s.toUpperCase();
  Assertions.assertEquals("JOY", toUpper.apply("joy"));
  Assertions.assertNull(toUpper.apply(null));
}
```

The test applies a `Function` to convert a string to uppercase. It asserts the converted value and also checks for `null` input handling.

### Function Composition

**Function composition is a process of combining multiple functions to create a new function.** The `compose()` method in the `Function` interface combines two functions by applying the argument function first and then the caller function. Conversely, the `andThen()` method applies the caller function first and then the argument function.

For example, if we have two functions: one to convert a string to upper case and another to remove vowels from it, we can compose them using `compose()` or `andThen()`. If we use `compose()`, it first converts the string to uppercase and then removes vowels from it. Conversely, if we use `andThen()`, it first removes vowels from it and then converts the string to uppercase.

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

In the `functionComposition` test, we compose two functions to manipulate a string. The first function converts the string to uppercase, while the second one removes vowels. Using `compose()`, it first removes vowels and then converts to uppercase. Using `andThen()`, it first converts to uppercase and then removes vowels. We verify the results using assertion.

### BiFunction

**The `BiFunction` interface represents a function that accepts two arguments and produces a result.** It's similar to the Function interface, but it operates on two input parameters instead of one:

```java
@FunctionalInterface
public interface BiFunction<T, U, R> {
  R apply(T t, U u);
  // default methods
```

This is the specialized version of `Function` with two arguments. It is a functional interface that defines the `apply(Object, Object)` functional method.

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

### IntFunction

**The `IntFunction` interface represents a function that takes an integer as input and produces a result of any type.**

```java
@FunctionalInterface
public interface IntFunction<R> {
  R apply(int value);
}
```

This represents the int-consuming specialization for `Function`. It is a functional interface with a functional method named `apply(int)`.

We can define custom logic based on integer inputs and return values of any type, making it versatile for various use cases in Java programming.

Let's witness the `IntFunction` in action:

```java
@Test
void intFunction() {
  IntFunction<Integer> square = number -> number * number;
  Assertions.assertEquals(100, square.apply(10));
}
```

The test applies a `IntFunction` to compute the square of an integer. It ensures that the square function correctly calculates the square of the input integer.

Similarly, we have `LongFunction` and `DoubleFunction` that accept `long` and `double` results respectively.

### IntToDoubleFunction

**The `IntToDoubleFunction` interface represents a function that accepts an int-valued argument and produces a double-valued result.**

```java
@FunctionalInterface
public interface IntToDoubleFunction {
  double applyAsDouble(int value);
}
```

This is the specialized int-to-double conversion for the `Function` interface. It is a functional interface with a method called `applyAsDouble(int)`.

Let's explore the implementation of `IntToDoubleFunction`:

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

Similarly, we have `IntToLongFunction`, `LongToIntFunction`, `LongToDoubleFunction`, `DoubleToIntFunction` and `DoubleToLongFunction` to map the input to respective result types.

{{% info title="Functions and Stream Operations" %}}
Functional interfaces like `IntToDoubleFunction` and `IntToLongFunction` are particularly useful when working with streams of primitive data types. For instance, if we have a stream of integers, and we need to perform operations that require converting those integers to doubles or longs, we can use these functional interfaces within stream operations like `mapToInt`, `mapToDouble`, and `mapToLong`. This allows us to efficiently perform transformations on stream elements without the overhead of autoboxing and unboxing.
{{% /info %}}

### ToIntFunction

**The `ToIntFunction` interface represents a function that produces an int-valued result.**

```java
@FunctionalInterface
public interface ToIntFunction<T> {
  int applyAsInt(T t);
}
```

This is the integer-producing primitive specialization for the `Function` interface. It provides a template for functions that take an argument and return a result. Its specialization, `applyAsInt(Object)`, is a functional method specifically designed to produce an integer result. Its purpose is to allow for operations on data that return a primitive integer, thereby improving performance by avoiding unnecessary object wrappers. This specialization is an essential tool in functional programming paradigms within Java, allowing developers to write cleaner and more efficient code.

Let's see how we can use the `ToIntFunction` in action:

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

Similarly, we have `ToLongFunction` and `ToDoubleFunction` that produce `long` and `double` results respectively.

### ToIntBiFunction

**The `ToIntBiFunction` interface represents a function that accepts two arguments and produces an int-valued result.**

```java
@FunctionalInterface
public interface ToIntBiFunction<T, U> {
  int applyAsInt(T t, U u);
}
```

The int-producing primitive specialization for `BiFunction` is a functional interface that contains a single abstract method called `applyAsInt()`, which takes two input parameters of type `Object` and returns a `int`.

Let's discover how to use `ToIntBiFunction`:

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

This test calculates discounts based on the season and quantity. If it's winter or the quantity exceeds 100, we apply a 40% discount, otherwise, it's 10%. The test validates discounts for winter with 50 items, summer with 150 items, and fall with 50 items, expecting 40, 40, and 10, respectively.

Similarly, we have `ToLongBiFunction` and `ToDoubleBiFunction` that produce `long` and `double` results respectively.

## Operators

We'll now explore operators, fundamental functional interfaces in Java. **We commonly use operators to perform operations on data, such as mathematical calculations, comparisons, or logical operations.** Furthermore, we use operators to transform or manipulate data in our programs. These interfaces provide a way to encapsulate these operations, making our code more concise and readable. Whether it's adding numbers, checking for equality, or combining conditions, operators play a crucial role in various programming scenarios, offering flexibility and efficiency in our code.

Let's learn about unary and binary operators.

### UnaryOperator

**The `UnaryOperator` interface represents an operation on a single operand that produces a result of the same type as its operand.**

```java
@FunctionalInterface
public interface UnaryOperator<T> extends Function<T, T> {
  // helper methods
}
```

**This is a specialization of `Function` for the case where the operand and result are of the same type.** This is a functional interface whose functional method is `apply(Object)`.

Let's check out an example of `UnaryOperator`:

```java
public class OperatorTest {
  @Test
  void unaryOperator() {
    UnaryOperator<String> trim = value -> value == null ? null : value.trim();
    UnaryOperator<String> upperCase 
      = value -> value == null ? null : value.toUpperCase();
    Function<String, String> transform = trim.andThen(upperCase);

    Assertions.assertEquals("joy", trim.apply("  joy "));
    Assertions.assertEquals("  JOY ", upperCase.apply("  joy "));
    Assertions.assertEquals("JOY", transform.apply("  joy "));
  }
}
```

In the `OperatorTest`, unary operators trim and convert strings. The transform function combines them, trimming white space and converting to uppercase. Tests verify individual and combined functionalities.

### IntUnaryOperator

**The `IntUnaryOperator` interface represents an operation on a single int-valued operand that produces an int-valued result.**

```java
@FunctionalInterface
public interface IntUnaryOperator {
  int applyAsInt(int operand);
  // helper methods
}
```

This represents the primitive type specialization of `UnaryOperator` for integers. It's a functional interface featuring a method named `applyAsInt(int)`.

Let's learn how to use the `IntUnaryOperator`:

```java
void intUnaryOperator() {
  // formula y = x^2 + 2x + 1
  IntUnaryOperator formula = x -> (x * x) + (2 * x) + 1;
  Assertions.assertEquals(36, formula.applyAsInt(5));

  IntStream input = IntStream.of(2, 3, 4);
  int[] result = input.map(formula).toArray();
  Assertions.assertArrayEquals(new int[] {9, 16, 25}, result);

  // the population doubling every 3 years, one fifth migrate and 10% mortality
  IntUnaryOperator growth = number -> number * 2;
  IntUnaryOperator migration = number -> number * 4 / 5;
  IntUnaryOperator mortality = number -> number * 9 / 10;
  IntUnaryOperator population = growth.andThen(migration).andThen(mortality);
  Assertions.assertEquals(1440000, population.applyAsInt(1000000));
}
```

This test defines an IntUnaryOperator to calculate a quadratic formula, then applies it to an array. It also models population growth, migration, and mortality rates, calculating the population size.

Similarly, we have `LongUnaryOperator` and `DoubleUnaryOperator` that produce `long` and `double` results respectively.

### BinaryOperator

**The `BinaryOperator` interface represents operation upon two operands of the same type, producing a result of the same type as the operands.**

```java
@FunctionalInterface
public interface BinaryOperator<T> extends BiFunction<T,T,T> {
  // helper methods
}
```

`BiFunction` is a specialized functional interface. We use it when the operands and the result are all the same type. It has a functional method called `apply()` that takes two objects as input and produces an object of the same type as the operands.

Let's try out `BinaryOperator`:

```java
@Test
void binaryOperator() {
  LongUnaryOperator factorial =
      n -> {
        long result = 1L;
        for (int i = 1; i <= n; i++) {
          result *= i;
        }
        return result;
      };
  // Calculate permutations
  BinaryOperator<Long> npr 
    = (n, r) -> factorial.applyAsLong(n) / factorial.applyAsLong(n - r);
  // Verify permutations
  // 3P2: the number of permutations of 2 that can be achieved from a choice of 3.
  Long result3P2 = npr.apply(3L, 2L);
  Assertions.assertEquals(6L, result3P2);

  // Add two prices
  BinaryOperator<Double> addPrices = Double::sum;
  // Apply discount
  UnaryOperator<Double> applyDiscount = total -> total * 0.9; // 10% discount
  // Apply tax
  UnaryOperator<Double> applyTax = total -> total * 1.07; // 7% tax
  // Composing the operation
  BiFunction<Double, Double, Double> finalCost =
      addPrices.andThen(applyDiscount).andThen(applyTax);

  // Prices of two items
  double item1 = 50.0;
  double item2 = 100.0;
  // Calculate cost
  double cost = finalCost.apply(item1, item2);
  // Verify the calculated cost
  Assertions.assertEquals(144.45D, cost, 0.01);
}
```

In this test, we define a factorial function and use it to compute permutations (nPr). For pricing, we combine `BinaryOperator<Double>` for summing prices with `UnaryOperator<Double>` for applying discount and tax, and then validate the cost calculations.

### IntBinaryOperator

**The `IntBinaryOperator` interface represents an operation upon two int-valued operands and produces an int-valued result.**

```java
@FunctionalInterface
public interface IntBinaryOperator {
  int applyAsInt(int left, int right);
}
```

This is the primitive type specialization of `BinaryOperator` for numbers. It's a special type of interface that has a functional method called `applyAsInt()`, which takes two numbers as input and returns an integer.

Here's an example of how to use the `IntBinaryOperator`. Check it out:

```java
@Test
void intBinaryOperator() {
  IntBinaryOperator add = Integer::sum;
  Assertions.assertEquals(10, add.applyAsInt(4, 6));

  IntStream input = IntStream.of(2, 3, 4);
  OptionalInt result = input.reduce(add);
  Assertions.assertEquals(OptionalInt.of(9), result);
}
```

In this test, we use `IntBinaryOperator` to sum two integers. We use it to add two numbers and apply it to a stream to sum all elements. We validate both operations. The `reduce()` method with `IntBinaryOperator` is useful for operations like summing, finding the maximum or minimum, or other cumulative operations on stream elements.

Similarly, we have `LongBiaryOperator` and `DoubleBiaryOperator` that produce `long` and `double` results respectively.

## Consumers

**A `Consumer` is a functional interface that represents an operation that accepts a single input argument and returns no result.** It is part of the `java.util.function` package. Unlike most other functional interfaces, we use it to perform side-effect operations on an input, such as printing, modifying state, or storing values.

### Consumer

The `Consumer` Represents an operation that accepts a single input argument and returns no result:

```java
@FunctionalInterface
public interface Consumer<T> {
  void accept(T t);
  // default methods
}
```

`Consumer` is a unique functional interface that stands out from the rest because it operates through side effects. **It performs actions rather than returning a value.** The functional method of `Consumer` is `accept(Object)`, which allows it to accept an object and perform some operation on it.

Consumers are particularly useful in functional programming and stream processing, where we perform operations on elements of collections or streams in a concise and readable manner. They enable us to focus on the action to be performed rather than the iteration logic.

Example showcasing use of `Consumer`:

```java
@Test
void consumer() {
  Consumer<List<String>> trim =
      strings -> {
        if (strings != null) {
          strings.replaceAll(s -> s == null ? null : s.trim());
        }
      };
  Consumer<List<String>> upperCase =
      strings -> {
        if (strings != null) {
          strings.replaceAll(s -> s == null ? null : s.toUpperCase());
        }
      };

  List<String> input = null;
  input = Arrays.asList(null, "", " Joy", " Joy ", "Joy ", "Joy");
  trim.accept(input);
  Assertions.assertEquals(Arrays.asList(null, "", "Joy", "Joy", "Joy", "Joy"), input);

  input = Arrays.asList(null, "", " Joy", " Joy ", "Joy ", "Joy");
  trim.andThen(upperCase).accept(input);
  Assertions.assertEquals(Arrays.asList(null, "", "JOY", "JOY", "JOY", "JOY"), input);
}
```

The test demonstrates the use of the `Consumer` interface to perform operations on a list of strings. The consumer `trim` trims white space from each string and the consumer `upperCase` converts them to uppercase. It shows the composition of consumers using `andThen` to chain operations.

### BiConsumer

**The `BiConsumer` represents an operation that accepts two input arguments and returns no result.**

```java
@FunctionalInterface
public interface BiConsumer<T, U> {
  void accept(T t, U u);
  // default methods
}
```

This is the special version of `Consumer` that takes two arguments. Unlike other functional interfaces, `BiConsumer` results in side effects. It is a functional interface with a functional method called `accept(Object, Object)`.

We're going to figure out how to utilize `BiConsumer` in following example:

```java
@Test
void biConsumer() {
  BiConsumer<List<Double>, Double> discountRule =
      (prices, discount) -> {
        if (prices != null && discount != null) {
          prices.replaceAll(price -> price * discount);
        }
      };
  BiConsumer<List<Double>, Double> bulkDiscountRule =
      (prices, discount) -> {
        if (prices != null && discount != null && prices.size() > 2) {
          // 20% discount cart has 2 items or more
          prices.replaceAll(price -> price * 0.80);
        }
      };

  double discount = 0.90; // 10% discount
  List<Double> prices = null;
  prices = Arrays.asList(20.0, 30.0, 100.0);
  discountRule.accept(prices, discount);
  Assertions.assertEquals(Arrays.asList(18.0, 27.0, 90.0), prices);

  prices = Arrays.asList(20.0, 30.0, 100.0);
  discountRule.andThen(bulkDiscountRule).accept(prices, discount);
  Assertions.assertEquals(Arrays.asList(14.4, 21.6, 72.0), prices);
}
```

This test demonstrates the use of the `BiConsumer` interface to apply discounts to a list of prices. The `BiConsumer` applies a standard discount and a bulk discount if there are more than two items in the list.

Next, we'll explore various specializations of consumers and provide examples to illustrate their use cases.

### IntConsumer

**The `IntConsumer` an operation that accepts a single int-valued argument and returns no result.**

```java
@FunctionalInterface
public interface IntConsumer {
  void accept(int value);
  // default methods
}
```

`IntConsumer` is a specialized type of `Consumer` for integers. Unlike most other functional interfaces, `IntConsumer` produces side effects. It is a functional interface with a method called `accept(int)`.

Here is an illustration of how to use the `IntConsumer` interface:

```java
@ParameterizedTest
@CsvSource({
  "15,Turning off AC.",
  "22,---",
  "25,Turning on AC.",
  "52,Alert! Temperature not safe for humans."
})
void intConsumer(int temperature, String expected) {
  AtomicReference<String> message = new AtomicReference<>();
  IntConsumer temperatureSensor =
      t -> {
        message.set("---");
        if (t <= 20) {
          message.set("Turning off AC.");
        } else if (t >= 24 && t <= 50) {
          message.set("Turning on AC.");
        } else if (t > 50) {
          message.set("Alert! Temperature not safe for humans.");
        }
      };

  temperatureSensor.accept(temperature);
  Assertions.assertEquals(expected, message.toString());
}
```

This test verifies a `IntConsumer` handling temperature sensor responses. Depending on the temperature, it sets a message indicating if the AC should be turned off, turned on, or if we need an alert. The `@ParameterizedTest` runs multiple scenarios, checking the expected message for each temperature input.

Similarly, we have `LongConsumer` and `DoubleConsumer` that consume `long` and `double` inputs respectively.

### ObjIntConsumer

**The `ObjIntConsumer` an operation that accepts an object-valued and an int-valued argument, and returns no result.**

```java
@FunctionalInterface
public interface ObjIntConsumer<T> {
  void accept(T t, int value);
}
```

`ObjIntConsumer` interface is a special type of `BiConsumer`. Unlike most other functional interfaces, `ObjIntConsumer` is designed to work by directly changing the input. Its functional method is `accept(Object, int)`.

Let's now check how to use `ObjIntConsumer`:

```java
@Test
void objIntConsumer() {
  AtomicReference<String> result = new AtomicReference<>();
  ObjIntConsumer<String> trim =
      (input, len) -> {
        if (input != null && input.length() > len) {
          result.set(input.substring(0, len));
        }
      };

  trim.accept("123456789", 3);
  Assertions.assertEquals("123", result.get());
}
```

The test applies a `ObjIntConsumer` to trim a string if its length exceeds a given limit. It asserts the trimmed string.

Similarly, we have `ObjLongConsumer` and `ObjDoubleConsumer` that consume `long` and `double` inputs respectively.

## Suppliers

**The `Supplier` functional interface represents a supplier of results.** Unlike other functional interfaces like `Function` or `Consumer`, the `Supplier` doesn't accept any arguments. Instead, it provides a result of a specified type when called. This makes it particularly useful in scenarios where we need to generate or supply values without any input.

We commonly use suppliers for lazy evaluation to enhance performance by postponing expensive computations until necessary. We can use suppliers in factory methods to create new object instances, in dependency injection frameworks, or to encapsulate object creation logic. Suppliers also retrieve cached values, generate missing values, and store them in the cache. Additionally, suppliers provide default configurations, fallback values, or mock data for testing isolated components.

### Supplier

**`Supplier` represents a supplier of results.**

```java
@FunctionalInterface
public interface Supplier<T> {
    T get();
}
```

**Each time we invoke a supplier, it may return a distinct result or predefined result.** This is a functional interface whose functional method is `get()`.

Let's consider a simple example where we generate a random number:

```java
public class SupplierTest {
  @Test
  void supplier() {
      // Supply random numbers
      Supplier<Integer> randomNumberSupplier = () -> new Random().nextInt(100);
      int result = randomNumberSupplier.get();
      Assertions.assertTrue(result >=0 && result < 100);
  }
}
```

In this test, `randomNumberSupplier` generates a random number between 0 and 99. The test verifies that the generated number is within the expected range.

{{% info title="Lazy Initialization" %}}
Traditionally, we populate the needed data first and then pass it to the processing logic. With suppliers, that is no longer needed. We can now defer it to the point when it is actually needed. The supplier would generate the data when we call `get()` method on it. We may not use the input due to conditional logic. Sometimes such preparations are costly e.g., file resource, network connection. In such cases, we could even avoid such eager preparation of costly inputs.

{{% /info %}}

### IntSupplier

**`IntSupplier` represents a supplier of int-valued results.**

```java
@FunctionalInterface
public interface IntSupplier {
    int getAsInt();
}
```

This specialized version of `Supplier` produces `int` values. It offers the flexibility to return a distinct result for each invocation. As a functional interface, it provides the `getAsInt()` functional method as its core functionality.

Here is an example showcasing the use of `IntSupplier`:

```java
@Test
void intSupplier() {
  IntSupplier nextWinner = () -> new Random().nextInt(100, 200);
  int result = nextWinner.getAsInt();
  Assertions.assertTrue(result >= 100 && result < 200);
}
```

In this test, `nextWinner` generates a random number between 100 and 199. The test verifies that the generated number is within this range by asserting the result is at least 100 and less than 200.

Similarly, we have `LongSupplier`, `DoubleSupplier` and `BooleanSupplier` that produce `long`, `double` and `boolean` results respectively.

{{% info title="`BooleanSupplier` Use Cases" %}}

While it's true that a boolean value can only be `true` or `false`, a `BooleanSupplier` can be useful in scenarios where the `boolean` value needs to be determined dynamically based on some conditions or external factors. Here are a few practical use cases:

- **Feature Flags:** In applications with feature toggles, use a `BooleanSupplier` to check whether a feature is on or off.
- **Conditional Execution:** Use it to decide whether to execute certain logic based on dynamic conditions.
- **Health Checks:** In microservices, determine the health status of a service or component using it.
- **Security:** It can check if a user has the necessary permissions to access a resource or perform an action.

{{% /info %}}

## Conclusion

In this article, we learned functional interfaces, and how functional programming and lambda expressions bring a new level of elegance and efficiency to our code. We began by understanding the core concept of functional programming, where functions are first-class citizens, allowing us to pass and return them just like any other variable.

Then we dip dived into `Function` interfaces, which enable us to create concise and powerful transformations of data. Method references provided a shorthand for lambda expressions, making our code even cleaner and more readable.

Predicates, as powerful boolean-valued functions, helped us filter and match conditions seamlessly. We then moved on to operators, which perform operations on data, and consumers, which act on data without returning any result. This is particularly useful for processing lists and other collections in a streamlined manner.

Lastly, we explored suppliers, which generate data on demand, perfect for scenarios requiring dynamic data creation, such as random number generation or data sampling.

Each of these functional interfaces has shown us how to write more modular, reusable, and expressive code. By leveraging these idioms, we've learned to tackle complex tasks with simpler, more readable solutions. Embracing these concepts helps us become more effective Java developers, capable of crafting elegant and efficient code.

Happy coding! 🚀
