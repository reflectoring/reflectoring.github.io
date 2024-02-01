---
title: "Inheritance, Polymorphism, and Encapsulation in Kotlin"
categories: ["Kotlin"]
date: 2024-01-02 00:00:00 +1100
authors: [ezra]
excerpt: "In this tutorial, we'll discuss what object oriented is and see various example"
image: images/stock/0104-on-off-1200x628-branded.jpg
url: kotlin-object-oriented-programming
---

In the realm of object-oriented programming (OOP), Kotlin stands out as an expressive language that seamlessly integrates modern features with a concise syntax. Inheritance, polymorphism and encapsulation play a crucial role in object-oriented code. In this blog post, we'll delve into these concepts in the context of Kotlin, exploring how they enhance code reusability, flexibility, and security.

## Object-Oriented Programming

Object-oriented programming OOP is a programming paradigm that organizes software design around the concept of objects, which can be thought of as instances of classes. A class is a blueprint for creating objects, and it defines a set of attributes and methods or rather functions that operate on these attributes.

## Inheritance in Kotlin
Inheritance is a concept of OOP, allowing one class to inherit properties and behaviors from another. Kotlin supports both single and multiple inheritance through the use of classes and interfaces. Let's consider a scenario where we have a base class `Vehicle`:

```kotlin
open class Vehicle(val brand: String, val model: String) {
    fun start() {
        println("The $brand $model is starting.")
    }

    fun stop() {
        println("The $brand $model has stopped.")
    }
}
```

Now, we can create a derived class `Car` that inherits from the `Vehicle` class:

```kotlin
class Car(brand: String, model: String, val color: String) 
    : Vehicle(brand, model) {

      fun drive() {
          println("The $color $brand $model is on the move.")
      }
}
```

Here, the `Car` class inherits the `start()` and `stop()` methods from the `Vehicle` class showcasing the simplicity and effectiveness of inheritance in Kotlin.

## Polymorphism in Kotlin

Polymorphism, a Greek term meaning "many forms," enables a single interface to represent different types. Kotlin supports polymorphism through interfaces and abstract classes. Let's extend our example by introducing an interface `Drivable`:

```kotlin
interface Drivable {
    fun drive()
}
```

Now, we can modify the `Car` class to implement the `Drivable` interface:

```kotlin
class Car(brand: String, model: String, val color: String) 
    : Vehicle(brand, model), Drivable {
        
      override fun drive() { 
        println("The $color $brand $model is smoothly cruising.")
      }
}
```

With this implementation, a `Car` object can now be treated as a `Drivable` allowing for more flexibility in our code. Polymorphism facilitates code extensibility and maintenance by decoupling the implementation details from the interfaces.

## Encapsulation in Kotlin

Encapsulation involves bundling data and methods that operate on that data within a single unit, known as a class. This concept ensures that the internal workings of a class are hidden from the outside world promoting data integrity and security. In Kotlin, encapsulation is achieved through access modifiers such as `private`, `protected`, `internal` and public.

Let's modify our Vehicle class to encapsulate its properties:

```kotlin
open class Vehicle(private val brand: String, private val model: String) {
    fun start() {
        println("The $brand $model is starting.")
    }

    fun stop() {
        println("The $brand $model has stopped.")
    }

    fun getBrandModel(): String {
        return "$brand $model"
    }
}
```

In this example, the `brand` and `model` properties are marked as private, restricting their access to within the `Vehicle` class. The `getBrandModel()` method acts as a getter method allowing controlled access to the encapsulated data.

## Conclusion

In this exploration of inheritance, polymorphism and encapsulation in Kotlin, we've witnessed how these OOP principles contribute to code organization, reusability and flexibility. By leveraging these principles, developers can create robust and extensible codebases, fostering a modular and collaborative development environment.