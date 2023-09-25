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

## Testing on JVM
In this step, we're going to learn how we can test our Kotlin code using Kotest. Before writing the tests, we shall first have to add Kotest framework dependencies in our project. 

Let's take a look at how we add the dependencies to our *pom.xml* file:

```groovy
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
Onto our next step which is writing the tests, we normally create a Kotlin test file ending with the suffix like *Test.kt*. In this example, we'll use the *DescribeSpec* style to define a suite of tests.

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
In this Kotest test, we first define a test class *MyTestClass* that uses the Kotest testing framework, specifically the *DescribeSpec* style. Within the class's initializer block, we describes a test suite titled *My test suite* and contains two individual tests defined using the *it* function. The first test checks whether adding 1 and 2 results in 3, and the second test verifies that concatenating two strings *Hello*, " and *World*! results in the string *Hello, World!*. The *shouldBe* function is used to assert that the actual result matches the expected value in each test.
### Using Behavior Spec Style
Let's take a look at how we can write tests using the *BehaviorSpec* style in Kotest:

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
In our example, we have a *given* block that sets up a context, a *when* block that represents an action, and a *then* block that contains assertions about the expected behavior.

### Using Should Spec style

While using the *ShouldSpec* block, we use the *should* keyword to define our test cases and describe the expected behavior of our code:

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
In this step, we shall use the *feature* and *scenario* functions to define features and scenarios respectively. Our *feature* represents a higher-level feature, and *scenarios* describe specific behaviors or test cases within our feature.

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
In our example, we've defined two features *Calculator* and *String Manipulation*, each containing scenarios that describe specific behaviors.

## Kotest Assertions
Kotest framework provides us with several *matcher* functions that help us write fluent assertions in our tests.These matchers are designed to help us verify various conditions and expectations in a concise and readable manner.

 Here are some of the commonly used Kotest matchers:

 | Assertion | Description |
|--------|---------------------------|
|**@shouldBe**         |Asserts that value shouldBe the expected value|
|**@shouldNotBe**      |Asserts that value shouldNotBe the unexpectedValue |
|**@shouldBeLessThan** |Asserts that value shouldBeLessThan maxValue|
|**@shouldBeLessThanOrEqual** | Asserts that value shouldBeLessThanOrEqual maxValue |
|**@shouldBeGreaterThan** |Asserts that value shouldBeGreaterThan minValue |
|**@shouldBeGreaterThanOrEqual** |Asserts that value shouldBeGreaterThanOrEqual minValue |
|**@shouldBeNull** |Asserts that value shouldBeNull() |
|**@shouldNotBeNull** |Asserts that value value shouldNotBeNull() |
|**@shouldBeInstanceOf** |Asserts that value shouldBeInstanceOf String::class |
|**@shouldNotBeInstanceOf** |Asserts that value value shouldNotBeInstanceOf Int::class |
|**@shouldBeOfType** |This matcher is used to check if an object is of a specific type and optionally matches its properties. |
|**@shouldContain** |Asserts that a collection shouldContain an element  |
|**@shouldNotContain** |Asserts that a collection shouldNotContain element |
|**@shouldHaveSize** |Asserts that a collection shouldHaveSize expectedSize |
|**@shouldNotContain** |Asserts that a collection shouldBeEmpty() |
|**@shouldNotBeEmpty** |Asserts that a string shouldNotBeEmpty() |
|**@shouldStartWith** |Asserts that a string shouldStartWith "should_start_with" |
|**@shouldEndWith**   |Asserts that a string shouldEndWith "should_end_with" |
|**@shouldContainSubstring**|This matcher checks if a string contains a specific substring.|
|**@shouldThrow**   |This matcher is used to check if a specific exception is thrown during the execution of a block of code. |
|**@shouldNotThrow**   |This matcher checks that a block of code does not throw an exception. |

## Lifecycle Hooks
In Kotest framework, we can use lifecycle hooks to perform setup and teardown operations before and after our tests. Generally, these hooks allow us to prepare our test environment, set up resources and finally clean up after our tests have been executed.

Here are the most commonly used lifecycle hooks in Kotest:

 | Hook | Description |
|--------|---------------------------|
|**@beforeSpec**       |This hook runs once before all the tests in spec|
|**@afterSpec**        |This hook runs once after all the tests in spec|
|**@beforeTest**       |This hook runs before each individual test within a spec.|
|**@afterTest**        |This hook runs after each individual test within a spec.|
|**@beforeContainer**  |This hook runs before each nested container within a spec|
|**@afterContainer**   |This hook runs after each nested container within a spec|

## Data Driven Testing in Kotest

Data-driven testing is a testing approach where we parameterize our tests with different sets of data, allowing us to run the same test logic with multiple input values to ensure that our code works correctly in various scenarios.

In order to achieve data-driven testing in Kotest, we use the *withData* function.

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

In this example, *Car* is a data class representing the input data for our tests. It includes properties for make, model, year, and expectedPrice. Inside the *CarPricingTests* test class, we are using the *withData* function to define sets of input data as instances of the Car data class.
For each set of input data, a test is created. This test invokes the *calculateCarPrice* function with the provided input values (make, model, and year) and checks if the result matches the expectedPrice.

## Grouping Kotest Tests with Tags
Another amazing feature of Kotest is its ability to group tests with tags. This allows us to categorize our tests and run specific groups of tests based on these tags. Tags are helpful for organizing our test suite, especially when we have a large number of tests and want to run only a subset of them, such as smoke tests, regression tests, or tests for a specific module of our application.

To tag our tests, we can use the *Tags* annotation provided by Kotest:

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

In this example, the *MyTestSuite* test class is tagged with both *smoke* and *regression* tags.

To run tests based on our tags, we can use the *--kotest.tags* command-line option when executing our test suite.

```groovy
./gradlew test --tests * --kotest.tags="smoke"
```

## Conclusion
In this tutorial, we have gone through the Kotest framework, its various testing styles, how we can group Kotest tests using tags and the various assertions Kotest supports inclusive of the lifecycle hooks.