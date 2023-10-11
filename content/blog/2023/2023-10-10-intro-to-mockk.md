---
title: "Testing with Mockk"
categories: ["Kotlin"]
date: 2023-10-10 00:00:00 +1100 
authors: [ezra]
excerpt: "In this tutorial, we'll discuss Mockk library which is used for unit testing."
image: images/stock/0104-on-off-1200x628-branded.jpg
url: introduction-to-Mockk
---

Mocking in software development is a technique used to simulate the behavior of external dependencies or components within a system during the testing phase. It allows developers to isolate the code being tested and control the inputs and outputs of these dependencies. Mock objects or functions are used to mimic the expected behavior of real components without actually invoking them. This helps ensure that the focus of the test is solely on the specific code being tested, without relying on the real external dependencies, which might be complex, slow, or unreliable.

## The Importance of Effective Testing
**Bug Detection**: Testing helps us to identify and catch bugs and issues in our software early in the development process. By isolating and controlling dependencies through mocking, developers can thoroughly test different scenarios and uncover potential problems.

**Regression Prevention**: Testing helps us to prevent regressions, where new code changes inadvertently and ends up introducing issues in existing functionality. By having a comprehensive suite of tests, we can ensure that existing features continue to work as expected.

**Documentation**: Tests serve as documentation for the expected behavior of the software. They provide clear examples of how different parts of the system should function, making it easier for developers to understand and maintain the codebase.

**Refactoring and Continuous Integration**: Effective testing enables developers to confidently refactor code and make improvements without the fear of breaking existing functionality. It also supports continuous integration and deployment practices by ensuring that changes don't introduce defects into the production environment.

**Quality Assurance**: Testing and mocking contribute to delivering higher-quality software by reducing the likelihood of defects reaching the end users, which can lead to improved user satisfaction and trust.

## Mockk Installation

To install the Mockk library in our project, we usually add the following dependencies.
### Using Gradle:

Inside the dependencies block, add the following line to include the MockK library as a dependency:

```kotlin
dependencies {
    testImplementation "io.mockk:mockk:1.12.0"
}
```
Make sure to replace 1.12.0 with the latest version of MockK.

### Using Maven:
Inside our `pom.xml` file,  add the following XML to include the MockK library as a dependency:
```xml
<dependency>
    <groupId>io.mockk</groupId>
    <artifactId>mockk</artifactId>
    <version>1.12.0</version>
    <scope>test</scope>
</dependency>
```
## Testing With Mockk

In this example, we'll use a simple class `Calculator` that depends on a `MathService`, which we will mock using MockK:
```kotlin
interface MathService {
    fun add(a: Int, b: Int): Int
}

class Calculator(private val mathService: MathService) {
    fun addTwoNumbers(a: Int, b: Int): Int {
        return mathService.add(a, b)
    }
}

class CalculatorTest {
    @Test
    fun testAddTwoNumbers() {
        val mathService = mockk<MathService>()
        every { mathService.add(5, 3) } returns 8
        val calculator = Calculator(mathService)
        val result = calculator.addTwoNumbers(5, 3)
        verify { mathService.add(5, 3) }
        assert(result == 8)
    }
}
```

We're testing the `addTwoNumbers` method of the `Calculator` class, which calls the `add` method of the `MathService`. We use MockK to create a mock `MathService` and configure its behavior to return a specific value when the `add` method is called. The test verifies that the add method was called as expected and asserts the result of the `addTwoNumbers` method.

## Mockk Annotations
MockK library provides annotations to simplify and streamline the process of creating and managing mock objects in Kotlin. These annotations are particularly helpful when writing unit tests. Here are some key MockK annotations:

**@MockK**: This annotation is used to declare a property as a mock object. It's typically applied to a property that represents a dependency or collaborator we want to mock.

```kotlin
@MockK
lateinit var mathService: MathService
```
Remember we'll need to ensure that we've initialized the property using `mockk()` in our test setup.

**@RelaxedMockK**: This annotation is similar to `@MockK`, but it creates a relaxed mock, which means that by default, the relaxed mock won't throw exceptions if we call methods that haven't been specifically stubbed. This can be useful for testing when we're not concerned about verifying interactions. 

```kotlin
@RelaxedMockK
lateinit var relaxedService: SomeService
```

**@SpyK**: The `@SpyK` annotation is used to create a partial mock, allowing us to use real implementations for some methods of a class while mocking others.
```kotlin
@SpyK
val calculator = Calculator()
```

**@UnmockK**: This annotation is used to unmock a property or object that was previously declared as a mock using `@MockK` or similar annotations. This is useful when we need to revert a mock back to its original behavior. 

```kotlin
@UnmockK
lateinit var unmockedService: SomeService
```

## Mockk Keywords

When using the MockK library for mocking and verifying interactions in Kotlin tests, there are several essential keywords and functions we should be familiar with. Here are some of the most commonly used keywords and functions in MockK:

| Keyword | Description |
|--------|---------------------------|
|mockk()        | Usually creates a mock object of a given class or interface |
|every{}        | Defines a behavior for mock object methods. We can specify what a method should return when invoked|
|justRun{}    | Defines a behavior for a method without returning a value. Useful for methods with a Unit return type|
|slot{}         | Captures arguments passed to a mocked method. We can use this to verify arguments later|
|verify{}       | Verify that a method was called with specific arguments and a certain number of times|
|atLeast(),atMost(),exactly()         | These keywords are used with `verify` to specify the number of times a method should be called.|
|verifyOrder{}  | Verify the order in which methods were called on mock objects|
|confirmVerified()| Ensures that all interactions with the mock have been verified. This is useful to prevent false positives in our tests|
|clearMocks()   | Used to reset the verification state of one or more mock objects|
|unmockkAll()   | Used to unmock all the mock objects created with the `mockk()` annotation|

## Combining Mockk With Other Testing Libraries
Combining JUnit and MockK is a popular approach for testing Kotlin code. JUnit is a widely used testing framework for Java and Kotlin, while MockK is a mocking library specifically designed for Kotlin. Together, they allow us to write comprehensive unit tests for our Kotlin code with mock objects. Here's how we can use JUnit and MockK for testing Kotlin code:
```kotlin
class CalculatorTest {
    private lateinit var calculator: Calculator

    private lateinit var mathService: MathService

    @BeforeEach
    fun setUp() {
        mathService = mockk()
        calculator = Calculator(mathService)
    }

    @Test
    fun testAddTwoNumbers() {
        every { mathService.add(2, 3) } returns 5
        val result = calculator.addTwoNumbers(2, 3)
        //using JUnit assertions 
        assert(result == 5)
    }
}
```
In this test class, we've created a mock `MathService` using MockK and defined its behavior using `every`. We specify that when mathService.add(2, 3) is called, it should `return` 5. Then, we test the `addTwoNumbers` method of the `Calculator` class, and finally, we `assert` that the result is as expected.
### Using Spek
Let's take a look at how we can combine MockK with Spek to test the `Calculator` class.

 Here's how to do it:
 ```kotlin 
class CalculatorSpec : Spek({
    val mathService by memoized { mockk<MathService>() }
    val calculator by memoized { Calculator(mathService) }
    describe("Calculator") {
        it("should add two numbers correctly") {
            every { mathService.add(2, 3) } returns 5
            val result = calculator.addTwoNumbers(2, 3)
            // Verify that the result is as expected
            assert(result == 5)
        }
    }
})
 ```

 ## Conclusion
 In this tutorial, we took a look at the Mockk library used to test Kotlin code, the various keywords associated with Mockk, combining Mockk with other testing libraries such as JUnit and Spek and finally we went through the annotation provided by Mockk.