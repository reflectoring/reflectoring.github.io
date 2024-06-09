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

The `Assertions.assertsThrows()` method asserts that execution of the supplied executable throws an expected exception and return the exception.

If the logic does not throw any exception, or throws a different exception, then this method will fail.

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
  List<Long> numbers = Arrays.asList(100L, 200L, 50L, 300L);
  int delay = 2;
  Executable checkSorting
    = () -> assertEquals(List.of(50L, 100L, 200L, 300L), numbers);

  // execution does not complete within expected duration
  assertAll(
      () ->
          assertThrows(
              AssertionFailedError.class,
              () ->
                  assertTimeout(
                      Duration.ofSeconds(1),
                      () -> {
                        TimeUnit.SECONDS.sleep(delay);
                        numbers.sort(Long::compareTo);
                      })),
      checkSorting);

  // execution completes within expected duration
  assertAll(
      () ->
          assertDoesNotThrow(
              () ->
                  assertTimeout(
                      Duration.ofSeconds(5),
                      () -> {
                        TimeUnit.SECONDS.sleep(delay);
                        numbers.sort(Long::compareTo);
                      })),
      checkSorting);
}
```

The `testAssertTimeoutWithExecutable()` method shows how to use the `assertTimeout` method with a `Executable`.

It starts by creating a list of `long` numbers: 100L, 200L, 50L, and 300L, and sets a delay of 2 seconds. The `checkSorting` executable checks if the sorted list matches the expected order: 50L, 100L, 200L, and 300L. The test uses `assertAll()` to group assertions.

In the first `assertAll()` block, it asserts that the execution throws a `AssertionFailedError` when sorting the list with a timeout of 1 second. The `assertTimeout()` method attempts to sleep for the 2-second delay before sorting the numbers. Since the delay exceeds the 1-second timeout, the assertion fails, and results in `AssertionFailedError`. The `checkSorting` executable verifies that the original numbers are in ascending order.

In the second `assertAll()` block, it asserts that the execution does not throw an exception when sorting the list with a timeout of 5 seconds. Again, the `assertTimeout()` method attempts to sleep for the 2-second delay before sorting the numbers. This time, the delay is within the 5-second timeout, so does not throw any exception. The `checkSorting` executable verifies that the original numbers are in ascending order.

This indicates that the execution keeps carrying out its operations. In case it goes beyond the anticipated timeframe, we get an exception.

Moreover, it demonstrated how we can combine multiple assertion techniques to carry out verification.

### Using Executables in `assertTimeoutPreemptively()`

The `Assertions.assertTimeoutPreemptively()` method asserts that execution of the supplied executable completes before the given timeout. Furthermore, it aborts the execution of the executable preemptively if it exceeds timeout.

Let's see how preemptive timeout works for the same scenario:

```java
@Test
void testAssertTimeoutPreemptivelyWithExecutable() {
  List<Long> numbers = Arrays.asList(100L, 200L, 50L, 300L);
  int delay = 2;
  Executable checkSorting
    = () -> assertEquals(List.of(50L, 100L, 200L, 300L), numbers);
  Executable noChanges
    = () -> assertEquals(List.of(100L, 200L, 50L, 300L), numbers);

  // execution does not complete within expected duration
  assertAll(
      () ->
          assertThrows(
              AssertionFailedError.class,
              () ->
                  assertTimeoutPreemptively(
                      Duration.ofSeconds(1),
                      () -> {
                        TimeUnit.SECONDS.sleep(delay);
                        numbers.sort(Long::compareTo);
                      })),
      noChanges);

  // execution completes within expected duration
  assertAll(
      () ->
          assertDoesNotThrow(
              () ->
                  assertTimeoutPreemptively(
                      Duration.ofSeconds(5),
                      () -> {
                        TimeUnit.SECONDS.sleep(delay);
                        numbers.sort(Long::compareTo);
                      })),
      checkSorting);
}
```

The `testAssertTimeoutPreemptivelyWithExecutable()` method demonstrates how to use the `assertTimeoutPreemptively()` method with two executables to verify the sorting of a list of numbers. The method starts by defining a list of `long` numbers: 100L, 200L, 50L, and 300L, and sets a delay of 2 seconds. The `checkSorting` executable checks if the sorted list matches the expected order: 50L, 100L, 200L, and 300L, while the `noChanges` executable verifies that the list remains in its initial order.

In the first `assertAll()` block, the method asserts that the execution throws a `AssertionFailedError` when sorting the list with a preemptive timeout of 1 second. The `assertTimeoutPreemptively()` method attempts to sleep for the 2-second delay before sorting the numbers. Since the delay exceeds the 1-second timeout, the assertion fails, and it throws the `AssertionFailedError`. The `noChanges` executable then verifies that the list remains unchanged, confirming that `assertTimeoutPreemptively()` preemptively stopped the sorting operation.

In the second `assertAll` block, the method asserts that we do not get any exception when sorting the list with a preemptive timeout of 5 seconds. The `assertTimeoutPreemptively()` method again attempts to sleep for the 2-second delay before sorting the numbers. This time, the delay is within the 5-second timeout, it does not throw any exception. Finally, `checkSorting` executable confirms that the execution has sorted the list correctly.

## Using ThrowingConsumer

The `ThrowingConsumer` interface serves as a functional interface that enables the implementation of a generic block of code capable of consuming an argument and potentially throwing a `Throwable`. Unlike the `Consumer` interface, `ThrowingConsumer` allows for the throwing of any type of exception, including checked exceptions.

The `ThrowingConsumer` interface can be particularly useful in scenarios where we need to test code that might throw checked exceptions. This interface allows us to write more concise and readable tests by handling checked exceptions seamlessly.

Here are some typical use cases.

### Testing Methods That Throw Checked Exceptions

When we have methods that throw checked exceptions, using `ThrowingConsumer` can simplify our test code. Instead of wrapping our test logic in `try-catch` blocks, we can use `ThrowingConsumer` to write clean and straightforward assertions.

First, let's define a validation exception our logic would use:

```java
public class ValidationException extends Throwable {
  public ValidationException(String message) {
    super(message);
  }
}
```

Now, write a test illustrating the use of `ThrowingConsumer`:

```java
public class ThrowingConsumerTest {

  @ParameterizedTest
  @CsvSource({"50,true", "130,false", "-30,false"})
  void testMethodThatThrowsCheckedException(int percent, boolean valid) {
    // acceptable percentage range: 0 - 100
    ValueRange validPercentageRange = ValueRange.of(0, 100);
    final Function<Integer, String> message =
        input ->
            MessageFormat.format(
                "Percentage {0} should be in range {1}", 
                input, validPercentageRange.toString());

    ThrowingConsumer<Integer> consumer =
        input -> {
          if (!validPercentageRange.isValidValue(input)) {
            throw new ValidationException(message.apply(input));
          }
        };

    if (valid) {
      assertDoesNotThrow(() -> consumer.accept(percent));
    } else {
      assertAll(
          () -> {
            ValidationException exception =
                assertThrows(ValidationException.class, 
                             () -> consumer.accept(percent));
            assertEquals(exception.getMessage(), message.apply(percent));
          });
    }
  }
}
```

In this test, we are validating percentage values against an acceptable range of 0 to 100 using a `ThrowingConsumer`. The test method `testMethodThatThrowsCheckedException()` is parameterized, taking an integer `percent` and a boolean `valid` as input. We use a `ValueRange` object to define the valid range for percentages. A `Function` named `message` is used to generate an error message for invalid inputs.

Then we define a `ThrowingConsumer` consumer to check if the input percentage is within the valid range. If the input is not valid, it throws a `ValidationException` with an appropriate error message.

During the test, if the input percentage is valid (as indicated by the `valid` boolean), the test asserts that the `consumer.accept(percent)` method does not throw any exception else it checks for `ValidationException`. Additionally, it verifies that the exception's message matches the expected message generated by the `message` function.

The test cases cover three scenarios: a valid percentage (50), an invalid percentage above the range (130), and an invalid percentage below the range (-30). The assertions ensure that the `ThrowingConsumer` correctly handles both valid and invalid inputs according to the defined percentage range.

### Dynamic Tests with ThrowingConsumer

JUnit 5 offers a powerful feature called dynamic tests, allowing us to create tests at runtime rather than at compile time. This can be especially useful when we don't know the number of tests or the test data set beforehand.

A common scenario where dynamic tests are beneficial is when you need to validate a series of inputs and their expected outcomes. `ThrowingConsumer` allows us to define test logic that can throw checked exceptions.

Let's define a dynamic test for the percentage validation and verify the results:

```java
// Helper record to represent a test case
record TestCase(int percent, boolean valid) {}

@TestFactory
Stream<DynamicTest> testDynamicTestsWithThrowingConsumer() {
  // acceptable percentage range: 0 - 100
  ValueRange validPercentageRange = ValueRange.of(0, 100);
  final Function<Integer, String> message =
      input ->
          MessageFormat.format(
              "Percentage {0} should be in range {1}", 
              input, validPercentageRange.toString());

  // Define the ThrowingConsumer that validates the input percentage
  ThrowingConsumer<TestCase> consumer =
      testCase -> {
        if (!validPercentageRange.isValidValue(testCase.percent)) {
          throw new ValidationException(message.apply(testCase.percent));
        }
      };

  ThrowingConsumer<TestCase> executable =
      testCase -> {
        if (testCase.valid) {
          assertDoesNotThrow(() -> consumer.accept(testCase));
        } else {
          assertAll(
              () -> {
                ValidationException exception =
                    assertThrows(ValidationException.class, 
                                 () -> consumer.accept(testCase));
                assertEquals(exception.getMessage(), message.apply(testCase.percent));
              });
        }
      };
  // Test data: an array of test cases with inputs and their validity
  Collection<TestCase> testCases =
      Arrays.asList(new TestCase(50, true), 
                    new TestCase(130, false), 
                    new TestCase(-30, false));

  Function<TestCase, String> displayNameGenerator =
      testCase -> "Testing percentage: " + testCase.percent;

  // Generate dynamic tests
  return DynamicTest.stream(testCases.stream(), displayNameGenerator, executable);
}
```

First, let's understand the dynamic test.

```java
class DynamicTest
    public static <T> Stream<DynamicTest> stream(
            Iterator<T> inputGenerator,
            Function<? super T,String> displayNameGenerator,
            ThrowingConsumer<? super T> testExecutor)
    // other variants of stream
}
```

A [`DynamicTest`](https://junit.org/junit5/docs/5.9.0/api/org.junit.jupiter.api/org/junit/jupiter/api/DynamicTest.html) is a test case generated at runtime. It is composed of a display name and an Executable. We annotate our test with `@TestFactory` so that the factory generates instances of `DynamicTest`.

The `stream()` method generates a stream of dynamic tests based on the given generator and test executor. Use this method when the set of dynamic tests is nondeterministic in nature or when the input comes from an existing Iterator.

The given `inputGenerator` is responsible for generating input values. A `DynamicTest` will be added to the resulting stream for each dynamically generated input value, using the given `displayNameGenerator` and `testExecutor`.

In this test case, we create dynamic tests using `ThrowingConsumer` to validate percentage inputs. The `ValueRange` object defines the acceptable range of 0 to 100. A message template provides a detailed error message when a percentage falls outside this range.

We define a `ThrowingConsumer` that checks if the percentage is within the valid range. If not, it throws a `ValidationException` with the formatted message. Another `ThrowingConsumer`, named `executable`, uses assertions to test the validation logic. If the percentage is valid, it asserts that for valid percentages, execution does not throw any exception. For invalid percentages, it asserts that execution throws a `ValidationException`, and the exception message matches the expected message.

We have defined the test cases in a collection, each containing a percentage and a boolean indicating whether it is valid. A function generates display names for the dynamic tests based on the percentage values.

Finally, the `DynamicTest.stream` method creates a stream of dynamic tests using the test cases, display name generator, and the executable consumer. This setup allows us to dynamically generate and run tests, ensuring that the validation logic is correctly handling both valid and invalid percentage values.

In summary, using `ThrowingConsumer` in your JUnit tests can greatly simplify the process of testing methods that throw checked exceptions, manage resources, validate inputs, handle callbacks, and process complex data. It allows you to write cleaner and more concise test code by removing the need for extensive try-catch blocks, making your tests easier to read and maintain.

## Using ThrowingSupplier

`ThrowingSupplier` is a functional interface that enables the implementation of a generic block of code that returns an object and may throw a `Throwable`.

## Conclusion

In this article we got familiar with JUnit 5 functional interfaces.
