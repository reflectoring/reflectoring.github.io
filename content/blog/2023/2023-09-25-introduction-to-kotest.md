---
title: "Introduction to Kotest"
categories: ["Kotlin"]
date: 2023-09-25 00:00:00 +1100 
authors: [ezra]
excerpt: "In this tutorial, we'll discuss Kotest which is a testing Framework  written in Kotlin."
image: images/stock/0104-on-off-1200x628-branded.jpg
url: introduction-to-Kotest
---



Kotest is simply a multi-platiform framework used for testing and it's written in Kotlin.In this tutorial, we shall cover the following sub-topics related to the Kotest framework: testing with Kotest, testing styles used, grouping Kotest tests with tags, the lifecycle hooks and assertions supported by Kotest.

## Testing with Kotest
We're going to learn how we can test our Kotlin code using Kotest. Before writing the tests, we shall first have to add Kotest framework dependencies in our project. 

Let's take a look at how we add the dependencies to our <code>pom.xml</code> file:

```xml
<dependency>
	<groupId>io.kotest</groupId>
	<artifactId>kotest-runner-junit5-jvm</artifactId>
	<version>5.5.4</version>
	<scope>test</scope>
</dependency>
<dependency>
	<groupId>io.kotest</groupId>
	<artifactId>kotest-assertions-core-jvm</artifactId>
	<version>5.5.4</version>
	<scope>test</scope>
</dependency>
```
### Using Describe Spec Style
To write our tests, we normally create a Kotlin test file ending with the suffix like <code>Test.kt</code>. In this example, we'll use the <code>DescribeSpec</code> style to define a suite of tests.

```groovy
class MyTestClass : DescribeSpec() {
    init {
        describe("My test suite") {
            it("should add two numbers") {
                val result = 1 + 2
                result shouldBe 3
            }
            it("should concatenate two strings") {
                val result = "Hello, " + "World!"
                result shouldBe "Hello, World!"
            }
        }
    }
}
```
In this Kotest test, we first define a test class <code>MyTestClass</code> that uses the Kotest testing framework, specifically the <code>DescribeSpec</code> style. Within the class's initializer block, we describes a test suite titled <code>My test suite</code> and contains two individual tests defined using the <code>it</code> function. The first test checks whether adding 1 and 2 results in 3, and the second test verifies that concatenating two strings <code>Hello</code>, and <code>World!</code> results in the string <code>Hello, World!<c/ode>. The <code>shouldBe</code> function is used to assert that the actual result matches the expected value in each test.
### Using Behavior Spec Style
Let's take a look at how we can write tests using the <code>BehaviorSpec</code> style in Kotest:

```groovy
class MyBehaviorSpec : BehaviorSpec({
    given("a calculator") {
        val calculator = Calculator()
        when("adding two numbers") {
            val result = calculator.add(2, 3)
            then("it should return the correct sum") {
                result shouldBe 5
            }
        }
        when("subtracting two numbers") {
            val result = calculator.subtract(5, 2)
            then("it should return the correct difference") {
                result shouldBe 3
            }
        }
    }
})
```
In our example, we have a <code>given</code> block that sets up a context, a <code>when</code> block that represents an action, and a <code>then</code> block that contains assertions about the expected behavior.

### Using Should Spec style

While using the <code>ShouldSpec</code> block, we use the <code>should</code>keyword to define our test cases and describe the expected behavior of our code:

```groovy
class MyShouldSpec : ShouldSpec({
    should("return the correct sum when adding two numbers") {
        val result = Calculator().add(2, 3)
        result shouldBe 5
    }
    should("return the correct difference when subtracting two numbers") {
        val result = Calculator().subtract(5, 2)
        result shouldBe 3
    }
})
```

### Using Feature Spec Style
We shall use the <code>feature</code> and <code>scenario</code> functions to define features and scenarios respectively. Our <code>feature</code> represents a higher-level feature, and <code>scenarios</code> describe specific behaviors or test cases within our feature.

Example code using Feature Spec would be:

```groovy
class MyFeatureSpec : FeatureSpec({
    feature("Calculator") {
        scenario("addition") {
            val result = Calculator().add(2, 3)
            then("it should return the correct sum") {
                result shouldBe 5
            }
        }
        scenario("subtraction") {
            val result = Calculator().subtract(5, 2)
            then("it should return the correct difference") {
                result shouldBe 3
            }
        }
    }
    feature("String Manipulation") {
        scenario("concatenation") {
            val result = StringUtil.concat("Hello", "World")
            then("it should concatenate strings correctly") {
                result shouldBe "HelloWorld"
            }
        }
        scenario("length") {
            val result = StringUtil.getLength("Kotlin")
            then("it should return the correct length") {
                result shouldBe 6
            }
        }
    }
})
```
In our example, we've defined two features <code>Calculator</code> and <code>String Manipulation</code>, each containing scenarios that describe specific behaviors.

## JUnit vs Kotest
Choosing between Kotest and JUnit frameworks for a Kotlin project depends on our specific project requirements and preferences. Both Kotest and JUnit frameworks have their own advantages and may be better suited for different use cases. Here are some reasons why we might consider using Kotest over JUnit in a Kotlin project:
**Kotlin native support** Kotest is designed with Kotlin and provides native support for Kotlin features, such as coroutines, property-based testing, and DSLs, making it more natural to work with Kotlin codebases.
**Rich assertion library** Kotest comes with a powerful and extensible assertion library that allows developers to write expressive and concise assertions in a Kotlin idiomatic style. It provides a wide range of assertion functions that can make our tests more readable and maintainable.
**Property-Based testing** Kotest supports property-based testing, which allows us to define properties that our code should satisfy, and then it generates test cases to check those properties.This can help us discover edge cases and unexpected behavior in our code.
**Test configuration and hooks** Kotest provides flexible ways to configure our test suite and define test lifecycle hooks. We can also set up custom behavior before and after tests, which can be useful for tasks like database setup and teardown.
**Concurrent testing** Kotest offers built-in support for running tests concurrently, which can significantly speed up test execution, especially in projects with a large number of tests.
**Test case nesting** Kotest allows us to nest test cases and groups, which helps us to organize our tests more hierarchically and logically, making it easier to manage complex test suites.
**Integration with other libraries** Kotest integrates well with other libraries and frameworks commonly used in Kotlin projects, such as MockK for mocking, Koin for dependency injection, and kotlinx.coroutines for coroutine testing.

## Kotest Assertions
Kotest framework provides us with several <code>matcher</code> functions that help us write fluent assertions in our tests.These matchers are designed to help us verify various conditions and expectations in a concise and readable manner.

 Here are some of the commonly used Kotest matchers:

 | Assertion | Description |
|--------|---------------------------|
|<code>@shouldBe</code>          |Asserts that value shouldBe the expected value|
|<code>@shouldNotBe</code>       |Asserts that value shouldNotBe the unexpectedValue |
|<code>@shouldBeLessThan</code>  |Asserts that value shouldBeLessThan maxValue|
|<code>@shouldBeLessThanOrEqual</code>  | Asserts that value shouldBeLessThanOrEqual maxValue |
|<code>@shouldBeGreaterThan</code>  |Asserts that value shouldBeGreaterThan minValue |
|<code>@shouldBeGreaterThanOrEqual</code>  |Asserts that value shouldBeGreaterThanOrEqual minValue |
|<code>@shouldBeNull</code>  |Asserts that value shouldBeNull() |
|<code>@shouldNotBeNull</code>  |Asserts that value value shouldNotBeNull() |
|<code>@shouldBeInstanceOf</code>  |Asserts that value shouldBeInstanceOf String::class |
|<code>@shouldNotBeInstanceOf</code>  |Asserts that value value shouldNotBeInstanceOf Int::class |
|<code>@shouldBeOfType</code>  |This matcher is used to check if an object is of a specific type and optionally matches its properties. |
|<code>@shouldContain</code>  |Asserts that a collection shouldContain an element  |
|<code>@shouldNotContain</code>  |Asserts that a collection shouldNotContain element |
|<code>@shouldHaveSize</code>  |Asserts that a collection shouldHaveSize expectedSize |
|<code>@shouldNotContain</code>  |Asserts that a collection shouldBeEmpty() |
|<code>@shouldNotBeEmpty</code>  |Asserts that a string shouldNotBeEmpty() |
|<code>@shouldStartWith</code>  |Asserts that a string shouldStartWith "should_start_with" |
|<code>@shouldEndWith</code>    |Asserts that a string shouldEndWith "should_end_with" |
|<code>@shouldContainSubstring</code> |This matcher checks if a string contains a specific substring.|
|<code>@shouldThrow</code>    |This matcher is used to check if a specific exception is thrown during the execution of a block of code. |
|<code>@shouldNotThrow</code>   |This matcher checks that a block of code does not throw an exception. |

## Lifecycle Hooks
In Kotest framework, we can use lifecycle hooks to perform setup and teardown operations before and after our tests. Generally, these hooks allow us to prepare our test environment, set up resources and finally clean up after our tests have been executed.

Here are the most commonly used lifecycle hooks in Kotest:

 | Hook | Description |
|--------|---------------------------|
|<code>@beforeSpec</code>        |This hook runs once before all the tests in spec|
|<code>@afterSpec</code>         |This hook runs once after all the tests in spec|
|<code>@beforeTest</code>        |This hook runs before each individual test within a spec.|
|<code>@afterTest</code>  |This hook runs after each individual test within a spec.|
|<code>@beforeContainer</code>   |This hook runs before each nested container within a spec|
|<code>@afterContainer</code>    |This hook runs after each nested container within a spec|

## Data Driven Testing in Kotest

Data-driven testing is a testing approach where we parameterize our tests with different sets of data, allowing us to run the same test logic with multiple input values to ensure that our code works correctly in various scenarios.

In order to achieve data-driven testing in Kotest, we use the <code>withData</code>function.

Let's see an example of this concept:

```groovy
data class Car(val make: String, val model: String, val year: Int, val expectedPrice: Int)

class CarPricingTests : FunSpec({
    withData(
        Car("Toyota", "Camry", 2020, 25000),
        Car("Honda", "Civic", 2021, 22000),
        Car("Ford", "Focus", 2019, 18000)
    ) { (make, model, year, expectedPrice) ->
        val actualPrice = calculateCarPrice(make, model, year)
        actualPrice shouldBe expectedPrice
    }
})

fun calculateCarPrice(make: String, model: String, year: Int): Int {
    return when (make) {
        "Toyota" -> 25000
        "Honda" -> 22000
        "Ford" -> 18000
        else -> 0 
    }
}
```

In this example, <code>Car</code> is a data class representing the input data for our tests. It includes properties for make, model, year, and expectedPrice. Inside the <code>CarPricingTests</code> test class, we are using the <code>withData</code> function to define sets of input data as instances of the Car data class.
For each set of input data, a test is created. This test invokes the <code>calculateCarPrice</code> function with the provided input values (make, model, and year) and checks if the result matches the expectedPrice.

## Grouping Kotest Tests with Tags
Another amazing feature of Kotest is its ability to group tests with tags. This allows us to categorize our tests and run specific groups of tests based on these tags. Tags are helpful for organizing our test suite, especially when we have a large number of tests and want to run only a subset of them, such as smoke tests, regression tests, or tests for a specific module of our application.

To tag our tests, we can use the <code>Tags</code> annotation provided by Kotest:

```groovy
@Tags("smoke", "regression")
class MyTestSuite : FunSpec({
    test("Test case 1") {
        // Test logic here
    }

    test("Test case 2") {
        // Test logic here
    }
})
```

In this example, the <code>MyTestSuite</code> test class is tagged with both <code>smoke</code> and <code>regression</code> tags.

To run tests based on our tags, we can use the <code>--kotest.tags</code> command-line option when executing our test suite.

```yaml
./gradlew test --tests * --kotest.tags="smoke"
```

## Conclusion
In this tutorial, we have gone through the Kotest framework, its various testing styles, how we can group Kotest tests using tags and the various assertions Kotest supports inclusive of the lifecycle hooks.