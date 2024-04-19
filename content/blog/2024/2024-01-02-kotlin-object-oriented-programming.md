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
In Kotlin, the `open` keyword plays a crucial role in class and function inheritance. By default, all classes in Kotlin are "closed" for inheritance, which means they cannot be subclassed. This design choice enhances the safety and integrity of your code by preventing unintended modifications through inheritance.

When we want a class or function to be inheritable, we need to explicitly mark it with the open keyword.
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

Let's show an example of Polymorphism while using an abstract class:
abstract class Shape {
    // Define an abstract method `area()` that must be overridden in subclasses
    abstract fun area(): Double
    
    // A non-abstract method to print the area
    fun printArea() {
        println("The area is: ${area()}")
    }
}

class Circle(private val radius: Double) : Shape() {
    override fun area(): Double {
        return Math.PI * radius * radius
    }
}

class Rectangle(private val width: Double, private val height: Double) : Shape() {
    override fun area(): Double {
        return width * height
    }
}
```
In the example above, we define an abstract class `Shape` with an abstract method `area()`. The classes `Circle` and `Rectangle` inherit from the abstract class `Shape` and provide their own implementations for the area() method.

## Encapsulation in Kotlin

Encapsulation involves bundling data and methods that operate on that data within a single unit, known as a class. This concept ensures that the internal workings of a class are hidden from the outside world promoting data integrity and security. In Kotlin, encapsulation is achieved through access modifiers such as `private`, `protected`, `internal` and public.

Let's us briefly learn about these modifiers:

Let's modify our Vehicle class to encapsulate its properties:

`private`: When we mark a declaration (such as a class, function, or property) as private, it is accessible only within the same file in which it is declared. Other classes, functions, or properties outside of the file cannot access it. This is the most restrictive visibility modifier.

`protected`: The protected modifier is similar to private, but it also allows subclasses to access the declaration. This means that the declaration is accessible within its own class and by subclasses. For example:

```kotlin
open class Base {
    protected fun protectedFunction() {
        // This function can be accessed within this class and subclasses
    }
}

class Derived : Base() {
    fun useProtectedFunction() {
        protectedFunction()  // Allowed because Derived is a subclass of Base
    }
}
```

`internal`: The internal modifier restricts access to declarations within the same module (a module is a set of Kotlin files compiled together, such as a library or an application). Anything marked as internal is visible to other code in the same module but not to code in other modules.

`public`: This is the default visibility in Kotlin. When a declaration is marked as public (or if no visibility modifier is specified), it is accessible from any other code. In most cases, you won't need to explicitly use the public modifier, as it's the default.

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