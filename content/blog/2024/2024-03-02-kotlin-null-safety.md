---
title: "Understanding Null Safety in Kotlin"
categories: ["Kotlin"]
date: 2024-03-02 00:00:00 +1100
authors: [ezra]
excerpt: "In this tutorial, we'll discuss null safety in kotlin"
image: images/stock/0136-ring-1200x628-branded.jpg
url: kotlin-null-safety
---

One of the standout features that sets Kotlin apart is its robust approach to null safety. Null safety is a critical aspect of programming languages, aiming to eliminate the notorious null pointer exceptions that often plague developers. In this blog post, we will delve into the core concepts of null safety in Kotlin, exploring nullable types, non-null types, safe calls, the Elvis operator, the `!!` operator, and the safe cast operator `as?`.

## Nullable Types and Non-Null Types

In Kotlin, every variable has a type, and these types can be categorized into nullable and non-null types. A nullable type is denoted by appending a question mark (?) to the type declaration. For example, `String?` represents a nullable `String`, meaning it can either hold a valid string or be null.

On the other hand, a non-null type, without the question mark, signifies that the variable cannot hold null values. For instance, `String` denotes a non-null string type. This clear distinction allows Kotlin to enforce null safety at compile-time, reducing the likelihood of null pointer exceptions during runtime.

Null safety is a crucial feature in programming languages, and Kotlin addresses it comprehensively for several reasons:

- Null safety contributes to the overall reliability and stability of the codebase. By explicitly specifying whether a variable can be null or not, Kotlin encourages developers to handle null cases more consciously. This explicitness results in code that is less error-prone and easier to reason about.

- Null safety in Kotlin aims to eradicate NPEs (null pointer exceptions) by enforcing a clear distinction between nullable and non-nullable types. This distinction helps developers catch potential nullability issues at compile-time, preventing unexpected crashes during runtime.

Kotlin's null safety features are primarily enforced at compile-time. This means that potential nullability issues are identified and flagged by the compiler _before_ the code is executed. This proactive approach helps catch errors early in the development process, reducing the likelihood of bugs in production.

## Safe Calls Operator `?.`

```kotlin
fun main() {
    val nullableString: String? = "Hello, Kotlin!"
    val length: Int? = nullableString?.length
    println("Length: $length")
}
```

In this Kotlin code, we begin by declaring a nullable string variable named `nullableString`, initialized with the value "Hello, Kotlin!". The type is explicitly set as `String?`, indicating that it can hold either a valid string or a null value. Subsequently, another variable named `length` is declared as an optional integer (`Int?`). We access the _length_ property of `nullableString` using the safe call operator `?.`. If `nullableString` is not null, the length is retrieved. If `nullableString` is `null`, `length` is assigned a null value. 

If we tried this code without the safe call operator (i.e. `nullableString.length`), the compiler would not allow this and complain that `nullableString` could be null.

## The Elvis Operator `?:`

While safe calls provide a graceful way to handle nullability, there are scenarios where we might want to provide a default value or perform an alternative action when the variable is null. This is where the Elvis operator comes into play.

```kotlin
fun main() {
    val nullableString: String? = null
    val length: Int = nullableString?.length ?: 0
    println("Length: $length")
}
```

In this example, if `nullableString` is null, the expression evaluates to 0 because we added `?: 0` to the end. Otherwise, it returns the length of the string. The Elvis operator simplifies the code and makes it more readable by providing a default value in case of null.

## The Not Null Assertion Operator `!!`

While Kotlin encourages null safety, there might be situations where you, as a developer, are certain that a nullable variable is non-null at a particular point in your code. In such cases, you can use the not-null assertion operator to tell the compiler that you are taking responsibility for the null check.

```kotlin
fun main() {
    val nullableString: String? = "Hello, Kotlin!"
    val length: Int = nullableString!!.length
    println("Length: $length")
}
```
Using `!!` essentially asserts to the compiler that `nullableString` is non-null, and it proceeds with the operation. However, if `nullableString` _is_ null, a `NullPointerException` will be thrown at runtime. Therefore, it should be used judiciously and only when you are confident about the non-null status.

## Safe Cast Operator `as?`

The safe cast operator in Kotlin provides a safe way to attempt type casting without risking a `ClassCastException`. This operator is declared as an infix function, allowing for a more readable syntax when used.

Consider the following example:

```kotlin
fun main() {
    val y: Any? = "Hello, Kotlin!"
    val x: String? = y as? String
    if (x != null) {
        println("Casting successful. x is a String: $x")
    } else {
        println("Casting failed. x is null.")
    }
}
```

In this example, if `y` is indeed a String, the safe cast succeeds, and `x` contains the casted value. If `y` is `null` or not of type String, `x` is assigned null. This way, we can gracefully handle different cases without encountering runtime exceptions.

## Conclusion

Null safety is a fundamental aspect of Kotlin that significantly enhances the reliability and robustness of code. By incorporating nullable types, non-null types, safe calls, the Elvis operator, the `!!` operator, and the safe cast operator `as?`, Kotlin empowers developers to write code that is less prone to null pointer exceptions.

Embracing these null safety features not only improves the overall quality of code but also contributes to a smoother development experience. As Kotlin continues to evolve, its emphasis on null safety remains a key factor in its appeal to developers seeking a modern and pragmatic programming language.