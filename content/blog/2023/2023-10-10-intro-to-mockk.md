---
title: "Testing with Mockk"
categories: ["Kotlin"]
date: 2023-10-10 00:00:00 +1100 
authors: [ezra]
excerpt: "In this tutorial, we'll discuss Mockk library which is used for unit testing."
image: images/stock/0104-on-off-1200x628-branded.jpg
url: introduction-to-Mockk
---

Mocking in software development is a technique used to simulate the behavior of external dependencies or components within a system during testing. This approach allows developers to isolate the code under test, controlling the inputs and outputs of these dependencies without invoking the actual components. Mock objects or functions are employed to mimic the expected behavior of real components, ensuring that the focus of the test remains solely on the specific code being examined. This is particularly valuable when working with complex, slow, or unreliable external dependencies.

Moreover, it's important to introduce Mockk, a specific mocking framework commonly used in Kotlin. Mockk is a robust and flexible mocking library that simplifies the creation and configuration of mock objects, making it easier to isolate the code under test and control interactions during testing. Widely embraced in the Kotlin community, Mockk's user-friendly syntax and powerful mocking capabilities make it a valuable tool for test-driven development and guaranteeing the reliability and correctness of Kotlin applications.

## The Importance of Effective Testing
**Bug Detection**: Testing helps us to identify and catch bugs and issues in our software early in the development process. By isolating and controlling dependencies through mocking, developers can thoroughly test different scenarios and uncover potential problems.

**Regression Prevention**: Testing helps us to prevent regressions, where new code changes inadvertently and ends up introducing issues in existing functionality. By having a comprehensive suite of tests, we can ensure that existing features continue to work as expected.

**Documentation**: Tests serve as documentation for the expected behavior of the software. They provide clear examples of how different parts of the system should function, making it easier for developers to understand and maintain the codebase.

**Refactoring and Continuous Integration**: Effective testing enables developers to confidently refactor code and make improvements without the fear of breaking existing functionality. It also supports continuous integration and deployment practices by ensuring that changes don't introduce defects into the production environment.

**Quality Assurance**: Testing and mocking contribute to delivering higher-quality software by reducing the likelihood of defects reaching the end users, which can lead to improved user satisfaction and trust.

## Mockk Installation

To install the Mockk library in our project, we usually add the following dependencies.
### Using Gradle

Inside the dependencies block, add the following line to include the MockK library as a dependency:

```kotlin
dependencies {
    testImplementation "io.mockk:mockk:1.12.0"
}
```
Make sure to replace 1.12.0 with the [latest version](https://github.com/mockk/mockk/releases) of MockK.

### Using Mavenmockk
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

We're testing the `addTwoNumbers()` method of the `Calculator` class, which calls the `add()` method of the `MathService`. We use MockK to create a mock `MathService` and configure its behavior to return a specific value when the `add()` method is called. The test verifies that the add method was called as expected and asserts the result of the `addTwoNumbers()` method.

The `every` is a function provided by Mockk that sets up an expectation for a specific method call on a mock object `mathService` in this case. It specifies that when the add method of mathService is called with arguments 5 and 3, it should return 8. This configuration is setting the expected behavior of the mock object.

The `verify` function is used to ensure that a specific method call on a mock object occurred. In this case, it checks if the `add()` method of mathService was called with arguments 5 and 3. If the method was called, the test will pass; otherwise, it will fail.

In summary, the `every` keyword is used to set up the expected behavior of a mock object, specifying what it should return when certain methods are called. The `verify` keyword, on the other hand, is used to check whether specific method calls on the mock object have occurred during the test.
We're going to discuss more of these Mockk keywords further below.

## Mockk Annotations
The MockK library provides annotations to simplify the process of creating and managing mock objects in Kotlin. These annotations are particularly helpful when writing unit tests. Here are some key MockK annotations:

### @MockK
 This annotation is used to declare a property as a mock object. It's typically applied to a property that represents a dependency or collaborator we want to mock.

```kotlin
@MockK
lateinit var mathService: MathService
```
Remember we'll need to ensure that we've initialized the property using `mockk()` in our test setup.

### @RelaxedMockK
 This annotation is similar to `@MockK`, but it creates a relaxed mock, which means that by default, the relaxed mock won't throw exceptions if we call methods that haven't been specifically stubbed. This can be useful for testing when we're not concerned about verifying interactions. 

```kotlin
@RelaxedMockK
lateinit var relaxedService: SomeService
```

### @SpyK
 The `@SpyK` annotation is used to create a partial mock, allowing us to use real implementations for some methods of a class while mocking others.
```kotlin
@SpyK
val calculator = Calculator()
```

### @UnmockK**
 This annotation is used to unmock a property or object that was previously declared as a mock using `@MockK` or similar annotations. This is useful when we need to revert a mock back to its original behavior. 

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


Let's take a look at code examples of each of these Mockk keywords:
### Mockk()
```kotlin
@Test
    fun mockkExample() {
        val mock = mockk<MyClass>()
    }
```

### every{}
```kotlin
@Test
    fun everyExample() {
        val mock = mockk<MyClass>()
        every { mock.doSomething() } returns "Mocked result"
    }
```

### justRun{}  
```kotlin
@Test
    fun justRunExample() {
        val mock = mockk<MyClass>()
        justRun { mock.doSomething() }
    }
```

### slot{} 
```kotlin
@Test
    fun slotExample() {
        val mock = mockk<MyClass>()
        val capturedArg = slot<String>()
        every { mock.doSomething(capture(capturedArg)) } just Runs
        // our test code using the mock object and captured arguments
    }
```

### verify{}  
```kotlin
@Test
    fun verifyExample() {
        val mock = mockk<MyClass>()
        verify { mock.doSomething("Specific Argument") }
    }
```

### atLeast(),atMost(),exactly() 
```kotlin
@Test
    fun atLeastAtMostExactlyExamples() {
        val mock = mockk<MyClass>()
        verify(atLeast = 2) { mock.doSomething() }
        verify(atMost = 3) { mock.doSomething() }
        verify(exactly = 4) { mock.doSomething() }
    }
```

### verifyOrder{} 
```kotlin
 @Test
    fun verifyOrderExample() {
        val mock = mockk<MyClass>()
        verifyOrder {
            mock.doSomething()
            mock.anotherMethod()
        }
    }
```

### confirmVerified()
```kotlin
 @Test
    fun confirmVerifiedExample() {
        val mock = mockk<MyClass>()
        // our test code calling the mock object
        verify { mock.doSomething() }
        confirmVerified(mock)
    }
```

### clearMocks()
```kotlin
 @Test
    fun clearMocksExample() {
        val mock1 = mockk<MyClass>()
        val mock2 = mockk<AnotherClass>()
        clearMocks(mock1, mock2)
    }
```

### unmockkAll()
```kotlin
 @Test
    fun unmockkAllExample() {
        val mock1 = mockk<MyClass>()
        val mock2 = mockk<AnotherClass>()
        unmockkAll()
    }
```

## Combining Mockk With Other Testing Libraries
### Using JUnit
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
In this test class, we've effectively integrated MockK with JUnit to create a testing environment.

Here's a breakdown of the key points in this integration:

**@BeforeEach**

This annotation is provided by JUnit and marks a method `setUp()` in this case that is executed before each test method within the test class. In the `setUp()` method, we initialize the `mathService` as a mock and create an instance of the `Calculator` class, setting the stage for the test.
**@Test:**
fasfas
Another JUnit annotation, `@Test` marks a method as a test case. In the `testAddTwoNumbers()` method, we define the expected behavior of the mathService using MockK's every function, stating that when `mathService.add(2, 3)` is called, it should return 5.
**assert(result == 5)**

Here, we are using JUnit's assertion to check whether the result of `calculator.addTwoNumbers(2, 3)` matches the expected value, which is 5. If the assertion fails, the test will fail.

This combination of JUnit and MockK provides a clear and effective way to structure and run unit tests. JUnit handles the test lifecycle and assertions, while MockK facilitates mocking and defining expected behavior, ensuring that the code under test behaves as intended during the test. This integration streamlines the testing process and helps ensure the correctness of our code.
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

Spek is a behavior-driven development (BDD) testing framework for Kotlin. It provides a way to structure our tests in a natural language format and helps us to organize our test cases into descriptive blocks. It's designed to make our tests more readable and expressive. For example in our code above, we're using Spek to describe the behavior of the `Calculator` class.

In our code above:
`val mathService by memoized { mockk<MathService>() }` is used to create a mock object of the `MathService` class using MockK. The memoized feature ensures that the same instance of the mock is reused across all test cases within the same scope.`val calculator by memoized { Calculator(mathService) } `creates a memoized instance of the Calculator class, which we want to test. It takes the mathService mock as a constructor parameter. This setup ensures that the Calculator class uses the mocked mathService during testing.The `describe("Calculator") { ... }` block provided by Spek describes the behavior we want to test.The `it("should add two numbers correctly") { ... }` block defines an individual test case. This specific test case checks whether the addTwoNumbers method of the Calculator class correctly adds two numbers.This `every { mathService.add(2, 3) } returns 5` uses MockK to define the expected behavior of the mathService mock.`val result = calculator.addTwoNumbers(2, 3)`invokes the `addTwoNumbers` method of the Calculator class with the given arguments. Finally, `assert(result == 5)` verifies the result of the test. The `assert` statement checks whether the actual result of `calculator.addTwoNumbers(2, 3)` is equal to the expected result, which is 5.

 ## Conclusion
 In this tutorial, we took a look at the Mockk library used to test Kotlin code, the various keywords associated with Mockk, combining Mockk with other testing libraries such as JUnit and Spek and finally we went through the annotation provided by Mockk.