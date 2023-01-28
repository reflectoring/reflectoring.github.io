---
title: "JUnit 5 Parameterized tests"
categories: ["Java"]
date: 2023-01-25 00:00:00
authors: ["pralhad"]
description: "Parameterized tests with JUnit 5."
image: //TODO
url: JUnit5 parameterized tests
---

## Introduction

If you’re reading this article, it means you’re already well-versed with `JUnit`.

Let me give you a summary on `JUnit` - In software development, we developers write code which does something simple as designing a person’s profile (where you left/right swipe 😉) or as complex as making a payment (in a banking system).
When we develop these features, we tend to write unit tests. As the name suggests, the only purpose of the unit tests is to make sure the smallest of small parts of the code are behaving the way we expected. If the execution of the unit test fails for any reason, it means we have modified the desired functionality (or we like to call it broken functionality). One such tool available for writing unit tests is JUnit. These unit tests are tiny programs, yet so powerful and execute in a (Thanos) snap. If you like to learn more about `JUnit5` (also known as JUnit Jupiter), please check out - [junit5 article here](https://reflectoring.io/junit5/)

Now that we know about JUnits. Let us now concentrate on the topic (for which you started to read this blog) - Parameterized tests in JUnit5. The development teams like to write reusable, loosely coupled source code using methods or classes.
The behaviour of your source code depends on the parameters passed. For example - The sum method in a `Calculator` class can work with integer and float values.

`JUnit5` has built the parameterized tests capability on a similar thought process, where we are testing the source code by writing a single test case that can accept different inputs. For the above case, we write a single sum test case that takes integer and float inputs (compared to 2 test cases for sum_integer and sum_float in prior versions of JUnit5).

{{% github "https://github.com/thombergs/code-examples/tree/master/core-java/junit5-parameterized-tests" %}}

## Setup

Just like the mad titan Thanos who is fond of accessing powers, you can access the power of parameterized tests in JUnit5 using the below maven dependency

```xml
<dependency>
	<groupId>org.junit.jupiter</groupId>
	<artifactId>junit-jupiter-params</artifactId>
	<version>5.9.2</version>
	<scope>test</scope>
</dependency>
```

Let’s do some coding, shall we?

## Our First Parameterized Test

Now, I would like to introduce you to a new annotation `@ParameterizedTest`. As the name suggests, it tells the JUnit engine to run this test with different input values.

```java
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

public class ValueSourceTest {

	@ParameterizedTest
	@ValueSource(ints = { 2, 4 })
	void checkEvenNumber(int number) {
		assertEquals(0, number % 2, 
		             "Supplied number is not an even number");
	}
}
```

In the above example, the annotation `@ValueSource` provides multiple inputs to the `checkAlphanumeric()` method. Let's say we are writing the same using JUnit4, we had to write 2 test cases to cover the inputs 2 and 4 even though their result (assertion) is exactly the same.

When we execute test ValueSourceTest, what we see -

```
ValueSourceTest
|_ checkEvenNumber
    |_ [1] 2
    |_ [2] 4
```

It means that the `checkEvenNumber()` method is executed with 2 input values.

In the next section, let’s learn about the various arguments sources provided by the JUnit5 framework.

## Sources Of Arguments

JUnit5 offers a number of source annotations. The following sections provide a brief overview and an example for some of these annotations.

### @ValueSource

It is one of the simple sources. It accepts a single array of literal values. The literal values supported by `@ValueSource` are - `short, byte, int, long, float, double, char, boolean, String and Class`.

```java
@ParameterizedTest
@ValueSource(strings = { "a1", "b2" })
void checkAlphanumeric(String word) {
	assertTrue(StringUtils.isAlphanumeric(word), 
			   "Supplied word is not alpha-numeric");
}
```

### @NullSource & @EmptySource

Let's say when verifying if the user has supplied all the required fields (username and password in a login function). We check the provided fields are not null, not empty or not blank using the annotations

- `@NullSource` & `@EmptySource` in unit tests will help us supply the source code with null, empty and blank values and verify the behaviour of your source code.

```java
@ParameterizedTest
@NullSource
void checkNull(String value) {
	assertEquals(null, value);
}

@ParameterizedTest
@EmptySource
void checkEmpty(String value) {
	assertEquals("", value);
}
```

- We can also combine the passing of null and empty inputs using `@NullAndEmptySource`.

```java
@ParameterizedTest
@NullAndEmptySource
void checkNullAndEmpty(String value) {
	assertTrue(value == null || value.isEmpty());
}
```

- Another trick to pass `null`, `empty` and `blank` input values is to combine the `@NullAndEmptySource` and `@ValueSource(strings = { " ", " " })` to cover all possible negative scenarios.

```java
@ParameterizedTest
@NullAndEmptySource
@ValueSource(strings = { " ", "   " })
void checkNullEmptyAndBlank(String value) {
	assertTrue(value == null || value.isBlank());
}
```

### @MethodSource

This annotation allows us to load the inputs from one or more factory methods of the test class or external classes. Each factory method must generate a stream of arguments.

- **Explicit method source** - The test will try to load the supplied method.

```java
// Note: The test will try to load the supplied method
@ParameterizedTest
@MethodSource("checkExplicitMethodSourceArgs")
void checkExplicitMethodSource(String word) {
   assertTrue(StringUtils.isAlphanumeric(word), 
              "Supplied word is not alpha-numeric");
}

static Stream<String> checkExplicitMethodSourceArgs() {
   return Stream.of("a1", 
                    "b2");
}
```

- **Implicit method source** - The test will search for the source method that matches the test-case method name.

```java
// Note: The test will search for the source method 
// that matches the test-case method name
@ParameterizedTest
@MethodSource
void checkImplicitMethodSource(String word) {
	assertTrue(StringUtils.isAlphanumeric(word), 
               "Supplied word is not alpha-numeric");
}

static Stream<String> checkImplicitMethodSource() {
  return Stream.of("a1", 
                   "b2");
}
```

- **Multi-argument method source** - We must pass the inputs as a Stream of Arguments. The test will automatically map arguments based on the index.

```java
// Note: The test will automatically map arguments based on the index
@ParameterizedTest
@MethodSource
void checkMultiArgumentsMethodSource(int number, String expected) {
	assertEquals(StringUtils.equals(expected, "even") ? 0 : 1, number % 2);
}

static Stream<Arguments> checkMultiArgumentsMethodSource() {
  	return Stream.of(Arguments.of(2, "even"), 
	                 Arguments.of(3, "odd"));
}
```

- **External method source** - The test will try to load the external method.

```java
// Note: The test will try to load the external method
@ParameterizedTest
@MethodSource(
"source.method.ExternalMethodSource#checkExternalMethodSourceArgs")
void checkExternalMethodSource(String word) {
	assertTrue(StringUtils.isAlphanumeric(word), 
               "Supplied word is not alpha-numeric");
}
```

```java
package source.method;
import java.util.stream.Stream;

public class ExternalMethodSource {
	static Stream<String> checkExternalMethodSourceArgs() {
		return Stream.of("a1", 
		                 "b2");
	}
}
```

### @CsvSource

This annotation will allow us to pass argument lists as comma-separated values (i.e. CSV String literals). Each CSV record results in one execution of the parameterized test. There is also a possibility of skipping the CSV header using the attribute `useHeadersInDisplayName`.

```java
@ParameterizedTest
@CsvSource({ "2, even", 
             "3, odd"})
void checkCsvSource(int number, String expected) {
	assertEquals(StringUtils.equals(expected, "even") 
	             ? 0 : 1, number % 2);
}
```

### @CsvFileSource

This annotation lets us use comma-separated value (CSV) files from the `classpath` or the local file system. Similar to @CsvSource, here also, each CSV record results in one execution of the parameterized test. It also supports various other attributes - `numLinesToSkip`, `useHeadersInDisplayName`, `lineSeparator`, `delimiter` etc.

```java
@ParameterizedTest
@CsvFileSource(
  files = "src/test/resources/csv-file-source.csv", 
  numLinesToSkip = 1)
void checkCsvFileSource(int number, String expected) {
	assertEquals(StringUtils.equals(expected, "even") 
				 ? 0 : 1, number % 2);
}
```

**src/test/resources/csv-file-source.csv**

```
NUMBER, ODD_EVEN
2, even
3, odd
```

### @EnumSource

This annotation provides a convenient way to use `Enum` constants as test-case arguments.
Attributes supported -

- value - The enum class type, example - `ChronoUnit.class`
```java
package java.time.temporal;

public enum ChronoUnit implements TemporalUnit {
	SECONDS("Seconds", Duration.ofSeconds(1)),
	MINUTES("Minutes", Duration.ofSeconds(60)),
    HOURS("Hours", Duration.ofSeconds(3600)),
	DAYS("Days", Duration.ofSeconds(86400)),
	//12 other units
}
```
The `ChronoUnit` is an enum type that contains standard date period units.

```java
@ParameterizedTest
@EnumSource(ChronoUnit.class)
void checkEnumSourceValue(ChronoUnit unit) {
   assertNotNull(unit);
}
```
`@EnumSource` will pass all 16 `ChronoUnit` enums as an argument in this example.

- names - The names of enum constants to provide, or regular expression to select the names, example - `DAYS` or `^.*DAYS$`

```java
@ParameterizedTest
@EnumSource(names = { "DAYS", "HOURS" })
void checkEnumSourceNames(ChronoUnit unit) {
	assertNotNull(unit);
}
```

### @ArgumentsSource

This annotation provides a custom, reusable `ArgumentsProvider`. The implementation of `ArgumentsProvider` must be an external or a static nested class.

- **External arguments provider**

```java
public class ArgumentsSourceTest {

	@ParameterizedTest
	@ArgumentsSource(ExternalArgumentsProvider.class)
	void checkExternalArgumentsSource(int number, String expected) {
		assertEquals(StringUtils.equals(expected, "even") 
					? 0 : 1, number % 2, 
					"Supplied number " + number + 
					" is not an " + expected + " number");
	}
}

public class ExternalArgumentsProvider implements ArgumentsProvider {

	@Override
	public Stream<? extends Arguments> provideArguments(
		ExtensionContext context) throws Exception {

		return Stream.of(Arguments.of(2, "even"), 
			             Arguments.of(3, "odd"));
	}
}
```

- **Static nested arguments provider**

```java
public class ArgumentsSourceTest {

	@ParameterizedTest
	@ArgumentsSource(NestedArgumentsProvider.class)
	void checkNestedArgumentsSource(int number, String expected) {
		assertEquals(StringUtils.equals(expected, "even") 
                    ? 0 : 1, number % 2,
			     	"Supplied number " + number + 
					" is not an " + expected + " number");
	}

	static class NestedArgumentsProvider implements ArgumentsProvider {

		@Override
		public Stream<? extends Arguments> provideArguments(
			ExtensionContext context) throws Exception {

			return Stream.of(Arguments.of(2, "even"),
                         	 Arguments.of(3, "odd"));
		}
	}
}
```

### Argument Conversion

Different argument conversions made available by the JUnit5 are

- **Widening Primitive Conversion** - 

```java
@ParameterizedTest
@ValueSource(ints = { 2, 4 })
void checkWideningArgumentConversion(long number) {
	assertEquals(0, number % 2);
}
```
The parameterized test annotated with `@ValueSource(ints = { 1, 2, 3 })` can be declared to accept an argument of type int, long, float, or double.

- **Implicit Conversion** - 

```java
@ParameterizedTest
@ValueSource(strings = "DAYS")
void checkImplicitArgumentConversion(ChronoUnit argument) {
	assertNotNull(argument.name());
}
```
JUnit5 provides several built-in implicit type converters. The conversion depends on the declared method argument type. Example - The parameterized test annotated with `@ValueSource(strings = "DAYS")` converted implicitly to an argument type `ChronoUnit`.

- **Fallback String-to-Object Conversion** - 

```java
@ParameterizedTest
@ValueSource(strings = { "Name1", "Name2" })
void checkImplicitFallbackArgumentConversion(Person person) {
	assertNotNull(person.getName());
}

public class Person {
	private String name;
	public Person(String name) {
		this.name = name;
	}
	//Getters & Setters
}
```
JUnit5 provides a fallback mechanism for automatic conversion from a `String` to a given `target type` if the target type declares exactly one suitable factory method or a factory constructor. Example - The parameterized test annotated with `@ValueSource(strings = { "Name1", "Name2" })` can be declared to accept an argument of type `Person` that contains a single field `name` of type string.

- **Explicit Conversion** - 

```java
@ParameterizedTest
@ValueSource(ints = { 100 })
void checkExplicitArgumentConversion(
	@ConvertWith(StringSimpleArgumentConverter.class) String argument) {
	assertEquals("100", argument);
}

public class StringSimpleArgumentConverter extends SimpleArgumentConverter {

	@Override
	protected Object convert(Object source, Class<?> targetType) 
		throws ArgumentConversionException {
		return String.valueOf(source);
	}
}
```
For a reason, if you don't want to use the implicit argument conversion, then you can use `@ConvertWith` annotation to define your argument converter. Example - The parameterized test annotated with `@ValueSource(ints = { 100 })` can be declared to accept an argument of type String using `StringSimpleArgumentConverter.class` which converts an integer to string type.

### Argument Aggregation

#### @ArgumentsAccessor

By default, each argument provided to a `@ParameterizedTest` method corresponds to a single method parameter. Due to this, when argument sources that supply a large number of arguments can lead to large method signatures.
To solve this problem, we can use `ArgumentsAccessor` instead of declaring multiple parameters. The type conversion is supported as discussed in Implicit conversion above.

```java
@ParameterizedTest
@CsvSource({ "John, 20", 
		     "Harry, 30" })
void checkArgumentsAccessor(ArgumentsAccessor arguments) {
	Person person = new Person(arguments.getString(0), 
							   arguments.getInteger(1));
	assertTrue(person.getAge() > 19, person.getName() + " is a teenager");
}
```

#### Custom Aggregators

We saw using an `ArgumentsAccessor` can access the @ParameterizedTest method’s arguments directly. What if we want to declare the same ArgumentsAccessor in multiple tests? JUnit5 solves this by providing custom, reusable aggregators.

- **@AggregateWith** - 

```java
@ParameterizedTest
@CsvSource({ "John, 20", 
			 "Harry, 30" })
void checkArgumentsAggregator(
	@AggregateWith(PersonArgumentsAggregator.class) Person person) {
	assertTrue(person.getAge() > 19, person.getName() + " is a teenager");
}

public class PersonArgumentsAggregator implements ArgumentsAggregator {

	@Override
	public Object aggregateArguments(ArgumentsAccessor arguments, 
		ParameterContext context) throws ArgumentsAggregationException {

		return new Person(arguments.getString(0),       
                          arguments.getInteger(1));
	}
}
```
Implement the `ArgumentsAggregator` interface and register it via the `@AggregateWith` annotation in the @ParameterizedTest method. When we execute the test, it provides the aggregation result as an argument for the corresponding test. The implementation of ArgumentsAggregator can be an external class or a static nested class.

## Bonus
Since you have read the article to the end, I would like to give you a bonus - If you're using assertion frameworks like - [Fluent assertions for java](https://joel-costigliola.github.io/assertj/) you can pass the `java.util.function.Consumer` as an argument that holds the assertion itself.

```java
@ParameterizedTest
@MethodSource("checkNumberArgs")
void checkNumber(int number, Consumer<Integer> consumer) {
	consumer.accept(number);	
}

static Stream<Arguments> checkNumberArgs() {	
	Consumer<Integer> evenConsumer = 
			i -> Assertions.assertThat(i % 2).isZero();
	Consumer<Integer> oddConsumer = 
			i -> Assertions.assertThat(i % 2).isEqualTo(1);

	return Stream.of(Arguments.of(2, evenConsumer), 
		             Arguments.of(3, oddConsumer));
}
```

## Summary

JUnit5 parameterized tests help us avoid duplicate tests and provide the ability to execute the same test several times using different inputs. I hope you can explore further and achieve great things.

Always remember -

```
"With great power comes great responsibility" 
- Stan Lee
```

