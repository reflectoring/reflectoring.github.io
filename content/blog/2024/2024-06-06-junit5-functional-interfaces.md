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

Functional interface are a fundamental concept in Java functional programming. Java 8 specifically designed them to allow the assignment of lambda expressions or method references while processing data streams. In the Java API, specifically in the `java.util.function` package, you will find a collection of functional interfaces. **The main characteristic of a functional interface is that it contains only one abstract method.** Although it can have default methods and static methods, these do not count towards the single abstract method requirement. Functional interfaces serve as the targets for lambda expressions or method references.

## JUnit 5 Functional Interfaces

JUnit functional interfaces belong to `org.junit.jupiter.api.function` package. **It defines three functional interfaces: `Executable`, `ThrowingConsumer<T>` and `ThrowingSupplier<T>`.**  We use them typically with `Assertions` utility class.

Knowing how these interfaces work can greatly improve your testing methods. They make it easier to write and comprehend tests, reducing the amount of repetitive code needed for handling exceptions. By using these interfaces, you can describe complex test scenarios more clearly and concisely.

Let's learn how to use these function interfaces.

## Using `Executable`

**The `Executable` is a functional interface that enables the implementation of any generic block of code that may potentially throw a `Throwable`.**

JUnit 5 defines the `Executable` interface as follows::

```java
@FunctionalInterface
public interface Executable {
    void execute() throws Throwable;
}
```

**The `Executable` interface defines a single method called execute, which does not have any parameters and does not return anything.** It can throw different types of exceptions, making it flexible for handling exceptional situations.

It is particularly useful for writing tests to validate if specific code paths throw specific exceptions.

One common scenario where we use the `Executable` with the `Assertions.assertThrows()` method. This method takes a `Executable` as an argument, executes it, and checks if it throws the expected exception.

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

**The `Assertions.assertsAll()` method asserts that all supplied executables do not throw exceptions.**

Let's now see how to use `assertAll()` and executables:

```java
public class ExecutableTest {
  private List<Long> numbers = Arrays.asList(100L, 200L, 50L, 300L);
  private Executable sorter =
      () -> {
        TimeUnit.SECONDS.sleep(2);
        numbers.sort(Long::compareTo);
      };
  private Executable checkSorting =
      () -> assertEquals(List.of(50L, 100L, 200L, 300L), numbers);
  private Executable noChanges = 
      () -> assertEquals(List.of(100L, 200L, 50L, 300L), numbers);
  // tests
}
```

In the `ExecutableTest` class, we define several tests to demonstrate the usage of the `Executable` functional interface with JUnit's timeout assertions.

We start by initializing a list of `Long` numbers (numbers) and defining two `Executable` lambdas: `sorter` and `checkSorting`. The `sorter` lambda simulates a time-consuming operation by sleeping for 2 seconds and then sorting the list. The `checkSorting` lambda verifies that the list is in correct sort order. Additionally, we define another `Executable` lambda, `noChanges`, which checks that the list remains in its initial unsorted state.

Consider following example that shows how to use `assertAll` with executable:

```java
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
```

In `testAssertAllExecutable()` method, `Assertions.assertAll()` groups 3 assertions. The first checks if sum of `num1` and `num2` equals `sum`. The second verifies if string input starts with `prefix`. Finally, the third checks if `count` is less than 0, asserts that creating `ArrayList` with count will throw `IllegalArgumentException`, otherwise asserts that string `arg` repeated count times equals result.

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

**The `Assertions.assertDoesNotThrow()` method asserts that execution of the supplied executable does not throw any kind of exception.** Thus, we can explicitly verify that the logic under test executes without encountering any exception. It is useful assertion method we can use to test the *happy paths*.

Here's a simple example:

```java
@ParameterizedTest
@CsvSource({"one,0,o", "one,1,n"})
void testAssertDoesNotThrowWithExecutable(String input, int index, char result) {
    assertDoesNotThrow(() -> assertEquals(input.charAt(index), result));
}
```

The test `testAssertDoesNotThrowWithExecutable()` annotated `@ParameterizedTest` and `@CsvSource`, runs the test with different sets of parameters. The `@CsvSource` annotation specifies two sets of parameters: (“one”, 0, 'o') and (“one”, 1, 'n'). For each set of parameters, the test method checks that execution does not throw an exception when verifying that the character at the specified index in the input string matches the expected result.

### Using Executables in `assertThrows()`

**The `Assertions.assertsThrows()` method asserts that execution of the supplied executable throws an expected exception and return the exception.**

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

The `testAssertThrowsWithExecutable()` method tests the `assertThrows()` method with a `Executable`.

It begins by creating a list of strings containing the values “one”, “”, “three”, `null`, and “five”. Using `assertThrows()` method it checks that executing the lambda expression throws a `IllegalArgumentException`.

The lambda iterates through the list, and for each string, it checks if the value is `null` or blank. If it finds a `null` or blank value, it throws a `IllegalArgumentException` with the message “Got invalid value".

The assertion confirms that the thrown exception and verifies that the exception message matches the expected “Got invalid value”.

### Using Executables in `assertTimeout()`

**The `Assertions.assertTimeout()` method asserts that execution of the supplied executable completes before the given timeout.** The execution can continue even after it exceeds the timeout. The assertion will throw an exception in case it exceeds the timeout duration.

This is useful to verify if the execution completes within bounds expected duration.

Here is an example showcasing the use of `assertTimeout()`:

```java
@Test
void testAssertTimeoutWithExecutable() {
  // execution does not complete within expected duration
  assertAll(
    () ->
    assertThrows(
      AssertionFailedError.class, () -> assertTimeout(Duration.ofSeconds(1), sorter)),
    checkSorting);

  // execution completes within expected duration
  assertAll(() -> 
    assertDoesNotThrow(
        () -> assertTimeout(Duration.ofSeconds(5), sorter)), checkSorting);
}
```

The `testAssertTimeoutWithExecutable()` method demonstrates the usage of `assertTimeout()` with a `Executable`.

In the first `assertAll()` block, it checks if sorting the list throws a `AssertionFailedError` within a 1-second timeout. The `assertTimeout()` method tries to sleep for 2 seconds before sorting. Since it exceeds the timeout, a `AssertionFailedError` occurs. The `checkSorting` executable confirms the numbers are in ascending order.

In the second `assertAll()` block, it verifies that sorting the list within a 5-second timeout does not throw an exception. The `assertTimeout()` method still sleeps for 2 seconds before sorting. This time, it falls within the 5-second limit, so there is no exception. The `checkSorting` executable again confirms the numbers are in ascending order.

This shows that the execution continues as expected, but if it takes too long, there is an exception.

Additionally, it illustrates combining multiple assertion techniques for verification.

### Using Executables in `assertTimeoutPreemptively()`

**The `Assertions.assertTimeoutPreemptively()` method asserts that execution of the supplied executable completes before the given timeout.** Furthermore, it aborts the execution of the executable preemptively if it exceeds timeout.

Let's see how preemptive timeout works for the same scenario:

```java
@Test
void testAssertTimeoutPreemptivelyWithExecutable() {
  // execution does not complete within expected duration
  assertAll(
      () ->
          assertThrows(
              AssertionFailedError.class,
              () -> assertTimeoutPreemptively(Duration.ofSeconds(1), sorter)),
      noChanges);

  // execution completes within expected duration
  assertAll(
      () -> assertDoesNotThrow(() -> assertTimeoutPreemptively(Duration.ofSeconds(5), 
                               sorter)),
      checkSorting);
}
```

The `testAssertTimeoutPreemptivelyWithExecutable()` method demonstrates how to use the `assertTimeoutPreemptively()` method with two executables to verify the sorting of a list of numbers.

In the first `assertAll()` block, the method asserts that the execution throws a `AssertionFailedError` when sorting the list with a preemptive timeout of 1 second. The `assertTimeoutPreemptively()` method attempts to sleep for the 2-second delay before sorting the numbers. Since the delay exceeds the 1-second timeout, the assertion fails, and it throws the `AssertionFailedError`. The `noChanges` executable then verifies that the list remains unchanged, confirming that `assertTimeoutPreemptively()` preemptively stopped the sorting operation.

In the second `assertAll` block, the method asserts that we do not get any exception when sorting the list with a preemptive timeout of 5 seconds. The `assertTimeoutPreemptively()` method again attempts to sleep for the 2-second delay before sorting the numbers. This time, the delay is within the 5-second timeout, it does not throw any exception. Finally, `checkSorting` executable confirms that the execution has sorted the list correctly.

## Using `ThrowingConsumer`

**The `ThrowingConsumer` interface serves as a functional interface that enables the implementation of a generic block of code capable of consuming an argument and potentially throwing a `Throwable`.** Unlike the [`Consumer`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/function/Consumer.html) interface, `ThrowingConsumer` allows for the throwing of any type of exception, including checked exceptions.

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
    Function<Integer, String> message =
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

In this test, we validate percentage values in the range of 0 to 100 using a `ThrowingConsumer`. The test method `testMethodThatThrowsCheckedException()` takes an integer percent and a `boolean` valid as input. We define a `ValueRange` object to specify the valid range for percentages.

If the input percentage is not within the valid range, it throws a `ValidationException` with an appropriate error message. The test covers scenarios for a valid percentage (50), an invalid percentage above the range (130), and an invalid percentage below the range (-30).

The assertions verify that the `ThrowingConsumer` handles both valid and invalid inputs according to the defined percentage range.

### Dynamic Tests with `ThrowingConsumer`

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
  Function<Integer, String> message =
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

**The `stream()` method generates a stream of dynamic tests based on the given generator and test executor.** Use this method when the set of dynamic tests is nondeterministic in nature or when the input comes from an existing Iterator.

The `inputGenerator` generates input values, and adds a `DynamicTest` to the resulting stream for each dynamically generated input value. It uses `ThrowingConsumer` to validate percentage inputs falling within the range of 0 to 100. It defines dynamic tests using a collection of percentages and a boolean indicating validity, with display names generated based on the percentage values. This setup allows for dynamically generating and running tests to ensure correct handling of both valid and invalid percentage values.

`ThrowingConsumer` simplifies testing methods that throw checked exceptions, manage resources, validate inputs, handle callbacks, and process complex data by eliminating extensive try-catch blocks in test code.

## Using `ThrowingSupplier`

**`ThrowingSupplier` is a functional interface that enables the implementation of a generic block of code that returns an object and may throw a `Throwable`.** It is similar to [`Supplier`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/function/Supplier.html), except that it can throw any kind of exception, including checked exceptions.

[`Assertions`](https://junit.org/junit5/docs/5.9.0/api/org.junit.jupiter.api/org/junit/jupiter/api/Assertions.html) class has many assertion methods accepting throwing supplier:

```java
static <T> T assertDoesNotThrow(ThrowingSupplier<T> supplier)
// other variants of assertDoesNotThrow accepting supplier

static <T> T assertTimeout(Duration timeout, ThrowingSupplier<T> supplier)
// other variants of assertTimeout accepting supplier

static void assertTimeoutPreemptively(Duration timeout, ThrowingSupplier<T> supplier)
// other variants of assertTimeoutPreemptively accepting supplier
```

Let's learn about these methods one by one.

### Using `ThrowingSupplier` in `assertDoesNotThrow()`

**The method `assertDoesNotThrow()` asserts that execution of the supplied supplier does not throw any kind of exception.**

If the assertion passes, it returns the supplier's result. It is useful for testing *happy paths*.

Let's explore the implementation of test using throwing supplier:

```java
public class ThrowingSupplierTest {
  @ParameterizedTest
  @CsvSource({"25.0d,5.0d", "36.0d,6.0d", "49.0d,7.0d"})
  void testDoesNotThrowWithSupplier(double input, double expected) {
    ThrowingSupplier<Double> findSquareRoot =
        () -> {
          if (input < 0) {
            throw new ValidationException("Invalid input");
          }
          return Math.sqrt(input);
        };
    assertEquals(expected, assertDoesNotThrow(findSquareRoot));
  }
}
```

In this parameterized test, we use `ThrowingSupplier` to check if code throws exceptions and verify the return value. The test method, `testDoesNotThrowWithSupplier()`, performs a square root calculation. The negative input results in a `ValidationException`. Otherwise, it returns the square root. The test verifies that the `ThrowingSupplier` executes without exceptions and the return value matches the expected result.

### Using `ThrowingSupplier` in `assertTimeout()`

**The method `assertTimeout()` checks that execution of the supplied executable completes before the given timeout.** The executable will continue to even after timeout duration. If duration exceeds, the method will throw `AssertionFailedError`.

Let's now check how to use `assertTimeout()` with supplier:

```java
@Test
void testAssertTimeoutWithSupplier() {
  List<Long> numbers = Arrays.asList(100L, 200L, 50L, 300L);
  int delay = 2;

  Consumer<List<Long>> checkSorting 
        = list -> assertEquals(List.of(50L, 100L, 200L, 300L), list);

  ThrowingSupplier<List<Long>> sorter =
      () -> {
        if (numbers == null || numbers.isEmpty() || numbers.contains(null)) {
          throw new ValidationException("Invalid input");
        }
        TimeUnit.SECONDS.sleep(delay);
        return numbers.stream().sorted().toList();
      };

  // slow execution
  assertThrows(AssertionFailedError.class, 
               () -> assertTimeout(Duration.ofSeconds(1), sorter));

  // fast execution
  assertDoesNotThrow(
      () -> {
        List<Long> result = assertTimeout(Duration.ofSeconds(5), sorter);
        checkSorting.accept(result);
      });

  // reset the number list and verify if the supplier validates it
  Collections.fill(numbers, null);

  ValidationException exception =
      assertThrows(ValidationException.class, 
                   () -> assertTimeout(Duration.ofSeconds(1), sorter));
  assertEquals("Invalid input", exception.getMessage());
}
```

In this test, we use `ThrowingSupplier` and `assertTimeout()` to verify a sorting operation on a list of numbers. The test method `testAssertTimeoutWithSupplier()` works with a list of Long numbers and introduces a delay to simulate slow execution.

We test slow and fast execution scenarios and validate the input using `assertThrows()` and `assertDoesNotThrow()`. Finally, we demonstrate how to use `ThrowingSupplier` for operations that may throw checked exceptions and how to verify execution time constraints and input validation using JUnit’s assert methods.

### Using `ThrowingSupplier` in `assertTimeoutPreemptively()`

**The method `assertTimeoutPreemptively()` asserts that execution of the supplied supplier completes before the given timeout.** It returns the supplier's result if the assertion passes. If the timeout exceeds, it will abort the supplier preemptively.

Let's see an example of `assertTimeoutPreemptively()` with supplier:

```java
public class ThrowingSupplierTest {
  private List<Long> numbers = Arrays.asList(100L, 200L, 50L, 300L);
  private Consumer<List<Long>> checkSorting =
      list -> assertEquals(List.of(50L, 100L, 200L, 300L), list);

  private ThrowingSupplier<List<Long>> sorter =
      () -> {
        if (numbers == null || numbers.isEmpty() || numbers.contains(null)) {
          throw new ValidationException("Invalid input");
        }
        TimeUnit.SECONDS.sleep(2);
        return numbers.stream().sorted().toList();
      };
}
```

In this `ThrowingSupplierTest` class, we define several tests to demonstrate the usage of `ThrowingSupplier` and JUnit's timeout assertions.

We start by initializing a list of `Long` numbers (`numbers`) and a `Consumer<List<Long>>` (`checkSorting`) that checks if the list is in sorted order. We also define a `ThrowingSupplier<List<Long>>` named `sorter`, which sorts the list after a delay of 2 seconds. If the list is `null`, empty, or contains `null` values, the `sorter` throws a `ValidationException`.

Let's consider a simple example to use supplier when the test does not throw any exception:

```java
@ParameterizedTest
@CsvSource({"25.0d,5.0d", "36.0d,6.0d", "49.0d,7.0d"})
void testDoesNotThrowWithSupplier(double input, double expected) {
  ThrowingSupplier<Double> findSquareRoot =
      () -> {
        if (input < 0) {
          throw new ValidationException("Invalid input");
        }
        return Math.sqrt(input);
      };
  assertEquals(expected, assertDoesNotThrow(findSquareRoot));
}
```

In the `testDoesNotThrowWithSupplier()` method, we use `@ParameterizedTest` with `CsvSource` to test the calculation of square roots for different inputs. We define a `ThrowingSupplier<Double>` named `findSquareRoot`, which throws a `ValidationException` for negative inputs. The test uses `assertDoesNotThrow` to verify that the square root of the input matches the expected value.

Here is an example showcasing the use of timeout with supplier:

```java
@Test
void testAssertTimeoutWithSupplier() {
  // slow execution
  assertThrows(AssertionFailedError.class, 
               () -> assertTimeout(Duration.ofSeconds(1), sorter));

  // fast execution
  assertDoesNotThrow(
      () -> {
        List<Long> result = assertTimeout(Duration.ofSeconds(5), sorter);
        checkSorting.accept(result);
      });

  // reset the number list and verify if the supplier validates it
  Collections.fill(numbers, null);

  ValidationException exception =
      assertThrows(ValidationException.class, 
                   () -> assertTimeout(Duration.ofSeconds(1), sorter));
  assertEquals("Invalid input", exception.getMessage());
}
```

In the `testAssertTimeoutWithSupplier()` method, we test the sorting operation with different timeout durations. First, we verify that the sorting operation fails to complete within 1 second, using `assertThrows()` to expect a `AssertionFailedError`.

Then, we test the same operation with a 5-second timeout, using `assertDoesNotThrow()` to ensure it completes successfully, and the result is in sorted order by the `checkSorting` consumer.

Next, we reset the `numbers` list to contain `null` values and verify that the `sorter` throws a `ValidationException` when executed. We use `assertThrows()` to check that the exception message matches the expected “Invalid input”.

Let's learn to preemptively timeout execution of a supplier:

```java
@Test
void testAssertTimeoutPreemptivelyWithSupplier() {
  // slow execution
  assertThrows(
      AssertionFailedError.class, 
      () -> assertTimeoutPreemptively(Duration.ofSeconds(1), sorter));

  // fast execution
  assertDoesNotThrow(
      () -> {
        List<Long> result = assertTimeoutPreemptively(Duration.ofSeconds(5), sorter);
        checkSorting.accept(result);
      });
}
```

Finally, in the `testAssertTimeoutPreemptivelyWithSupplier()` method, we repeat the timeout tests with `assertTimeoutPreemptively()`. We verify that the sorting operation fails to complete within 1 second, expecting a `AssertionFailedError`. We then test the same operation with a 5-second timeout to ensure it completes successfully, and the list is in sorted order.

## Conclusion

In this article we got familiar with JUnit 5 functional interfaces, focusing on `Executable`, `ThrowingConsumer`, and `ThrowingSupplier`. These interfaces enhance the flexibility and readability of our test code by allowing us to leverage lambda expressions and method references.

We started with `Executable`, which encapsulates code that may throw any `Throwable`. We explored its usage in various JUnit assertions like `assertAll`, `assertTimeout`, and `assertTimeoutPreemptively`, demonstrating how we can use it to group multiple assertions and test time-sensitive operations efficiently.

Next, we examined `ThrowingConsumer<T>`, which represents an operation that accepts a single input argument and can throw checked exceptions. This interface is particularly useful for scenarios where we need to validate inputs or perform operations that may result in exceptions. We also explored its integration with dynamic tests, showcasing how it can streamline the creation of complex, parameterized test cases.

Finally, we looked at `ThrowingSupplier<T>`, which provides a value and can throw checked exceptions. This interface simplifies the testing of methods that generate values and might throw exceptions. We demonstrated its use in various timeout assertions, illustrating how it can validate the timely execution of operations and the correctness of generated results.

By understanding and using these functional interfaces, we can write more concise, expressive, and maintainable test code in JUnit 5, ultimately improving the robustness and reliability of our test suites.
