---
authors: [sagaofsilence]
categories: [Java]
date: 2024-06-06 00:00:00 +1100
excerpt: Guide to JUnit 5 Functional Interfaces.
image: images/stock/0041-adapter-1200x628-branded.jpg
title: Guide to JUnit 5 Functional Interfaces
url: junit5-functional-interfaces
---

In this article, we would get familiar with JUnit 5 functional interfaces. JUnit 5 significantly advanced from its predecessors. Features like functional interfaces can greatly simplify our work once we grasp their functionality.

## Quick Introduction to Java Functional Interfaces

Functional interface are a fundamental concept in Java functional programming. Java 8 specifically designed them to allow the assignment of lambda expressions or method references while processing data streams. In the Java API, specifically in the `java.util.function` package, you will find a collection of functional interfaces. The main characteristic of a functional interface is that it contains only one abstract method. Although it can have default methods and static methods, these do not count towards the single abstract method requirement. Functional interfaces serve as the targets for lambda expressions or method references.

## JUnit 5 Functional Interfaces

JUnit functional interfaces belong to `org.junit.jupiter.api.function` package. It defines three functional interfaces: `Executable`, `ThrowingConsumer<T>` and `ThrowingSupplier<T>`.  We use them typically with `Assertions` utility class.

Understanding the functionality of these interfaces can significantly enhance your testing strategies. Functional interfaces enable you to create tests that are easier to read and understand. They minimize the need for repetitive code when dealing with exceptions. Incorporating these interfaces allows you to articulate intricate test scenarios in a more concise and transparent manner.

Let's learn how to use these function interfaces.

## Using Executable

The `Executable` is a functional interface that enables the implementation of any generic block of code that may potentially throw a `Throwable`.

JUnit 5 defines the `Executable` interface as follows::

```java
@FunctionalInterface
public interface Executable {
    void execute() throws Throwable;
}
```

The `@FunctionalInterface` annotation signifies that the interface is a functional interface, having only one abstract method. This makes it suitable target for a lambda expression or method reference.

The `Executable` interface specifies a single abstract method called execute. This method does not take any parameters and returns nothing. It can throw various types of exceptions, offering versatility in handling exceptional situations.

The `Executable` interface represents a code block that may throw an exception when executed. It is especially helpful when writing tests to check if certain code paths throw specific exceptions.

One of the most common use cases of `Executable` is with the `Assertions.assertThrows()` method. This method takes a `Executable` as a parameter, executes it, and verifies that it throws the expected exception.

[`Assertions`](https://junit.org/junit5/docs/5.9.0/api/org.junit.jupiter.api/org/junit/jupiter/api/Assertions.html) class has many assertion methods accepting executable:

```java
static void assertAll(Executable... executables)
// other variants of assertAll accepting executables

static void assertDoesNotThrow(Executable executable)
// other variants of assertDoesNotThrow accepting executables

static <T extends Throwable> T assertThrows(Class<T> expectedType, 
                                            Executable executable)
// other variants of assertThrows accepting executables

static <T extends Throwable> T assertThrowsExactly(Class<T> expectedType, 
                                                   Executable executable)
// other variants of assertThrowsExactly accepting executables

static void assertTimeout(Duration timeout, Executable executable)
// other variants of assertTimeout accepting executables

static void assertTimeoutPreemptively(Duration timeout, Executable executable)
// other variants of assertTimeoutPreemptively accepting executables
```

Let's learn about these methods one by one.

### Using Executables in `assertAll()`

The `Assertions.assertsAll()` method asserts that all supplied executables do not throw exceptions.

Let's now see how to use `assertAll()` and executables:

```java
public class ExecutableTest {

  @ParameterizedTest
  @CsvSource({"1,1,2,Hello,H,bye,2,byebye", 
              "4,5,9,Good,Go,Go,-10,", 
              "10,21,31,Team,Tea,Stop,-2,"})
  void testAssertAllWithExecutable(int num1, int num2, int sum, 
                                   String input, String prefix, 
                                   String arg, int count, String result) {
    assertAll(
        () -> assertEquals(sum, num1 + num2),
        () -> assertTrue(input.startsWith(prefix)),
        () -> {
          if (count < 0) {
            assertThrows(
                IllegalArgumentException.class,
                () -> {
                  new ArrayList<>(count);
                });
          } else {
            assertEquals(result, arg.repeat(count));
          }
        });
  }
}
```

In the `ExecutableTest` class, the `testAssertAllExecutable()` method is a parameterized test.

The `Assertions.assertAll()` method groups three assertions to be executed together. The first assertion checks if the sum of `num1` and `num2` equals `sum`. The second assertion verifies if the string `input` starts with the string `prefix`. The third assertion checks if `count` is less than 0, it asserts that creating a `ArrayList` with `count` will throw a `IllegalArgumentException`, otherwise it asserts that the string `arg` repeated `count` times equals `result`.

The empty parentheses () indicate that this lambda expression does not take any parameters. Recall that a `Executable` has single `execute()` method, and it does not take any parameters and return nothing. It may throw an exception. This lambda expression succinctly encapsulates the assertion logic to be executed as part of a `Executable` interface implementation, making the code more readable and concise.

This test method checks all three assertions for each set of input data provided by the `@CsvSource`, allowing for comprehensive validation of the conditions described.

{{% info title="Lambda Expression Conversion Behind the Scenes" %}}

Modern Java versions (starting from Java 8) use the `invokedynamic` instruction to handle lambda expressions more efficiently than creating anonymous classes.

Here's an explanation of what happens behind the scenes:

**Lambda Expression Creation**:
When we write a lambda expression such as `() -> assertEquals(sum, num1 + num2)`, we define the behavior we want to execute later.

**Type Inference**:
The Java compiler infers that the lambda expression must be compatible with the `Executable` interface, which has a single abstract method `execute()`.

**`invokedynamic` Instruction**:
Instead of generating an anonymous inner class, the Java compiler generates a call to the `invokedynamic` instruction. Java 7 introduced `invokedynamic` bytecode instruction. It improves the performance and flexibility of dynamic language implementations on the JVM.

**Lambda `Metafactory`**:
The `invokedynamic` instruction links to a `LambdaMetafactory` at runtime, which is responsible for creating the actual implementation of the lambda. This factory uses a combination of method handles and dynamic class generation to create an instance of the functional interface. This approach avoids the overhead associated with creating anonymous classes for each lambda expression.

**Method Handle**:
It creates a *method handle* to the target method (the body of the lambda expression). This method handle is an optimized way to invoke methods dynamically.

**Efficient Execution**:
When the JVM executes the lambda expression, it uses the method handle to invoke the method directly. Java has greatly optimized this procedure. It results in lower overhead when contrasted with the utilization of conventional anonymous inner classes.

{{% /info %}}

### Using Executables in `assertDoesNotThrow()`

The `Assertions.assertDoesNotThrow()` method asserts that execution of the supplied executable does not throw any kind of exception. Thus, we can explicitly verify that the logic under test executes without encountering any exception. It is useful assertion method we can use to test the *happy paths*.

Here's a simple example:

```java
@ParameterizedTest
@CsvSource({"one,0,o", "one,1,n"})
void testAssertDoesNotThrowWithExecutable(String input, int index, char result) {
    assertDoesNotThrow(() -> assertEquals(input.charAt(index), result));
}
```

The test `testAssertDoesNotThrowWithExecutable()` annotated `@ParameterizedTest` and `@CsvSource`, runs the test with different sets of parameters. The `@CsvSource` annotation specifies two sets of parameters: (“one”, 0, 'o') and (“one”, 1, 'n'). For each set of parameters, the test method checks that execution does not throw an exception when verifying that the character at the specified index in the input string matches the expected result. If the assertions pass without throwing any exceptions, the `assertDoesNotThrow()` method confirms the successful execution of the test.

### Using Executables in `assertThrows()`

The `Assertions.assertsThrows()` method asserts that execution of the supplied executable throws an exception of the expected type and return the exception.

If the logic does not throw any exception, or throws an exception of a different type, then this method will fail.

We can perform additional checks on the exception instance we get in return value.

It is useful assertion method we can use to test the *failure paths*.

Let's see how we can use the `assertThrows()` in action:

```java
@Test
void testAssertThrowsWithExecutable() {
    List<String> input = Arrays.asList("one", "", "three", null, "five");
    IllegalArgumentException exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> {
                for (String value : input) {
                if (value == null || value.isBlank()) {
                    throw new IllegalArgumentException("Got invalid value");
                }
                // process values
                }
            });
    assertEquals("Got invalid value", exception.getMessage());
}
```

The `testAssertThrowsWithExecutable()` method tests the `assertThrows()` method with a `Executable`. It begins by creating a list of strings containing the values “one”, “”, “three”, `null`, and “five”. Using `assertThrows()` method it checks that executing the lambda expression throws a `IllegalArgumentException`. The lambda iterates through the list, and for each string, it checks if the value is `null` or blank. If it finds a `null` or blank value, it throws a `IllegalArgumentException` with the message “Got invalid value". The assertion confirms that the thrown exception and verifies that the exception message matches the expected “Got invalid value”.

### Using Executables in `assertTimeout()`

The `Assertions.assertTimeout()` method asserts that execution of the supplied executable completes before the given timeout. The execution can continue even after it exceeds the timeout. The assertion will throw an exception in case it exceeds the timeout duration.

This is useful to verify if the execution completes within bounds expected duration.

Here is an example showcasing the use of `assertTimeout()`:

```java
@Test
void testAssertTimeoutWithExecutable() {
  List<Long> numbers = Arrays.asList(100L, 200L, 50L, 300L, 5L, 0L, 12L, 80L);
  int delay = 2;
  
  // execution does not complete within expected duration
  assertThrows(
      AssertionFailedError.class,
      () ->
          assertTimeout(
              Duration.ofSeconds(1),
              () -> {
                numbers.sort(Long::compareTo);
                TimeUnit.SECONDS.sleep(delay);
              }));

  // execution completes within expected duration
  assertDoesNotThrow(
      () ->
          assertTimeout(
              Duration.ofSeconds(5),
              () -> {
                numbers.sort(Long::compareTo);
                TimeUnit.SECONDS.sleep(delay);
              }));
}
```

The `testAssertTimeoutWithExecutable()` method demonstrates the `assertTimeout()` method using a `Executable`. It starts with a list of `long` numbers and a delay of 2 seconds.

The first part of the test expects a `AssertionFailedError` to be thrown because the `assertTimeout()` is set to 1 second, which is less than the delay. Inside the `assertTimeout()`, we sort the numbers list, and the thread sleeps for the specified delay. We have used delay to simulate a long-running execution.  Because the delay is 2 seconds, exceeding the 1-second timeout, the assertion fails as expected.

The second part of the test uses `assertDoesNotThrow()` with `assertTimeout()` set to 5 seconds. It performs the same actions: sorting the numbers list and sleeping for the delay. Since the delay of 2 seconds is within the 5-second timeout, the assertion passes, confirming that it does not get exception within the specified duration.

### Using Executables in `assertTimeoutPreemptively()`

The `Assertions.assertTimeoutPreemptively()` method asserts that execution of the supplied executable completes before the given timeout. Furthermore, it aborts the execution of the executable preemptively if it exceeds timeout.



## Using ThrowingConsumer

`ThrowingConsumer` represents a functional interface that enables the implementation of a generic block of code to consume an argument and possibly throw a `Throwable`.

## Using ThrowingSupplier

`ThrowingSupplier` is a functional interface that enables the implementation of a generic block of code that returns an object and may throw a `Throwable`.

## Conclusion

In this article we got familiar with JUnit 5 functional interfaces.
