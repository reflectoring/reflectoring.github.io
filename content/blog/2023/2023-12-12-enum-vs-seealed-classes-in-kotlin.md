---
title: "Sealed classes vs Enum classes in Kotlin"
categories: ["Kotlin"]
date: 2023-12-12 00:00:00 +1100
authors: [ezra]
excerpt: "In this tutorial, we'll discuss differences between sealed classes and enum classes in Kotlin"
image: images/stock/0104-on-off-1200x628-branded.jpg
url: sealed vs enum classses in kotlin
---

Kotlin, a modern programming language brings a range of features to enhance expressiveness and conciseness. Two key constructs in Kotlin that contribute to its versatility are sealed classes and enum classes. In this blog post, we'll delve into the characteristics, use cases and differences between sealed classes and enum classes.

## Sealed Classes:
Sealed classes in Kotlin offer a powerful tool for defining restricted class hierarchies. When a class is marked as sealed, it means that the class hierarchy is finite and every subclass must be declared within the same file. This restriction allows the compiler to perform exhaustive checks when used in a when expression, ensuring that all possible subclasses are covered.

A typical use case for sealed classes is modeling hierarchical data structures, such as expressions in a compiler or states in a finite state machine. By sealing the class hierarchy, developers can guarantee that they handle all possible cases, making the code more robust and less prone to bugs.

Here's an example of a sealed class representing mathematical expressions:

```kotlin
sealed class MathExpression {
    data class Value(val value: Double) : MathExpression()
    data class Addition(val left: MathExpression, val right: MathExpression) : MathExpression()
    data class Subtraction(val left: MathExpression, val right: MathExpression) : MathExpression()
    object Undefined : MathExpression()
}

```

### Enum Classes
Enum classes, short for enumerated classes, are another feature that Kotlin inherits from Java but enhances significantly. Enum classes allow developers to define a fixed set of values, each of which is an instance of the enum class. Enums are particularly useful when modeling a closed set of related constants.

Let's consider an example of an enum class representing the days of the week:
```kotlin
enum class DayOfWeek {
    SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY
}

```
Unlike sealed classes, enum classes can't have subclasses, and the set of values is predetermined at compile time. This makes enum classes suitable for scenarios where a predefined set of options is expected, like representing days, months, or error states.

### Differences and Use Cases
While sealed classes and enum classes share some similarities, such as restricting the set of possible values, they serve distinct purposes and are suitable for different scenarios.

| Sealed classes | Enum classes |
|--------|---------------------------|
|Sealed classes are ideal for modeling hierarchies where a base class has multiple possible subclasses, providing a structured way to represent complex data structures.      | Enum classes, on the other hand, are perfect for scenarios where a fixed set of distinct values is needed, such as representing days, colors, or options in a menu. |
|Sealed classes shine when exhaustive checks are required. The compiler ensures that all possible subclasses are considered when using a sealed class in a when expression, reducing the likelihood of runtime errors.|Enum classes, with their fixed set of values, provide a concise way to represent and work with predefined options, making them a natural choice for situations where the set is closed and known in advance.|


### Conclusion
Sealed classes and enum classes in Kotlin are powerful tools for modeling different types of data structures. Sealed classes are suitable for hierarchies with multiple subclasses, enabling exhaustive checks and enhancing code safety. Enum classes, on the other hand, excel in representing closed sets of values, providing a concise and readable way to work with predefined options. By understanding the strengths and use cases of these constructs, developers can make informed decisions when designing their Kotlin applications, leading to more maintainable and robust code.