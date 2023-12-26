---
title: "Design Patterns in Kotlin"
categories: ["Kotlin"]
date: 2023-11-20 00:00:00 +1100
authors: [ezra]
excerpt: "In this tutorial, we'll discuss what design patterns are and discuss a few examples."
image: images/stock/0104-on-off-1200x628-branded.jpg
url: desing patterns in kotlin
---

A design pattern is a general repeatable solution to a commonly occurring problem in software design. In this blog post, we will delve into various design patterns and explore how they can be effectively implemented in Kotlin.

## Advantages of Using Design Patterns

### Reusability
Design patterns promote the reuse of proven solutions to common problems. By applying design patterns, we can use established templates to solve recurring design issues, saving time and effort in development.

### Maintainability
Design patterns enhance code maintainability by providing a clear and organized structure. When developers are familiar with common design patterns, it becomes easier for them to understand and modify the code, reducing the chances of introducing bugs during maintenance.

### Scalability
Design patterns contribute to the scalability of a codebase by providing modular and extensible solutions. As our application evolves, we can add new features or modify existing ones without having to overhaul the entire codebase.

### Abstraction and Encapsulation
Design patterns often involve abstraction and encapsulation, which help in hiding the complexity of the implementation details. This separation allows developers to focus on high-level design decisions without getting bogged down by low-level details.

### Flexibility
Design patterns make code more flexible and adaptable to change. When the structure of our software is based on well-established patterns, it becomes easier to introduce new functionality or modify existing behavior without affecting the entire system.

### Code Understandability
Design patterns provide a common vocabulary for developers. When a developer sees a particular pattern being used, they can quickly understand the intent and functionality without delving deeply into the implementation details.

### Testability
Code that follows design patterns is often more modular and, therefore, more easily testable. This makes it simpler to write unit tests and ensures that changes to one part of the codebase do not inadvertently break other components.

## Builder Pattern

The Builder design pattern is used for constructing complex objects by separating the construction process from the actual representation. It is particularly useful when an object has a large number of parameters, and we want to provide a more readable and flexible way to construct it.

Here's an example of implementing the Builder design pattern in Kotlin:

```kotlin
// Product class
data class Computer(
    val cpu: String,
    val ram: String,
    val storage: String,
    val graphicsCard: String
)

// Concrete builder class
class ComputerBuilder {
    private var cpu: String = ""
    private var ram: String = ""
    private var storage: String = ""
    private var graphicsCard: String = ""

    fun cpu(cpu: String): ComputerBuilder {
        this.cpu = cpu
        return this
    }

    fun ram(ram: String): ComputerBuilder {
        this.ram = ram
        return this
    }

    fun storage(storage: String): ComputerBuilder {
        this.storage = storage
        return this
    }

    fun graphicsCard(graphicsCard: String): ComputerBuilder {
        this.graphicsCard = graphicsCard
        return this
    }

    fun build(): Computer {
        return Computer(cpu, ram, storage, graphicsCard)
    }
}

fun main() {
    // Build the computer with a specific configuration
    val builder = ComputerBuilder()
    val gamingComputer = builder
        .cpu("Intel Core i9")
        .ram("32GB DDR4")
        .storage("1TB SSD")
        .graphicsCard("NVIDIA RTX 3080")
        .build()
}
```

In this code, the `Computer` class serves as the product to be built, encapsulating attributes like CPU, RAM, storage, and graphics card. The `ComputerBuilder` interface declares methods for configuring each attribute, while the `ComputerBuilder` class implements this interface, progressively setting the values. In the client code within the main function, a ComputerBuilder instance is utilized to construct a Computer object with a specific configuration by method chaining. This approach enhances readability and flexibility, especially when dealing with objects with numerous optional or interchangeable components, as the Builder pattern facilitates a step-by-step construction process.

Note that the Builder pattern is not as commonly used in Kotlin as it is in Java, for example, because Kotlin provides named parameters, which can be used in a constructor to a very similar effect to a Builder:

```kotlin
fun main() {
     // Without using the Builder pattern
    val simpleComputer = Computer(
        cpu = "Intel Core i5",
        ram = "16GB DDR4",
        storage = "512GB SSD",
        graphicsCard = "NVIDIA GTX 1660"
    )
}
```

Using named parameters in a constructor as in the example above is better for null safety, because it doesn't accept `null` values and the values do not have to be set to empty strings (`""`) as in the Builder example.

## Singleton Pattern

The Singleton design pattern ensures that a class has only one instance and provides a global point of access to that instance. Every single place where it is used will make use of the same instance, hence reducing memory usage and ensuring consistency. It is useful when exactly one object is needed to coordinate actions across the system, such as managing a shared resource or controlling a single point of control (e.g., a configuration manager or a logging service). The pattern typically involves a private constructor, a method to access the instance, and lazy initialization to create the instance only when it's first requested.

In Kotlin, the Singleton design pattern can be implemented in several ways. Here are two common approaches.

### Object Declaration

The most straightforward way to implement a Singleton in Kotlin is by using an object declaration. An object declaration defines a singleton class and creates an instance of it at the same time. The instance is created lazily when it's first accessed.

Here is a code example of using the object declaration methos:

```kotlin
object MySingleton {
    // Singleton properties and methods go here
    fun doSomething() {
        println("Singleton is doing something")
    }
}
```

To use our singleton:

```kotlin
MySingleton.doSomething()
```

### Companion Object

Another approach is to use a companion object within a class. This approach allows us to have more control over the initialization process, and we can use it when we need to perform some additional setup.

Let's see how we can make use of the companion object method:

```kotlin
class MySingleton private constructor() {

    companion object {
        private val instance: MySingleton by lazy { MySingleton() }

        fun getInstance(): MySingleton {
            return instance
        }
    }

    // Singleton properties and methods go here

    fun doSomething() {
        println("Singleton is doing something")
    }
}
```

To use the singleton:

```kotlin
val singletonInstance = MySingleton.getInstance()
singletonInstance.doSomething()
```

By using `by lazy`, the `instance` is created only when it's first accessed, making it a lazy-initialized singleton.

## Adapter Pattern

The Adapter design pattern allows the interface of an existing class to be used as another interface. It is often used to make existing classes work with others without modifying their source code.

In Kotlin, we can implement the Adapter pattern using either class-based or object-based adapters.

Here's an example of the class-based Adapter pattern:

```kotlin
// Target interface that the client expects
interface Printer {
    fun print()
}

// Adaptee (the class to be adapted)
class ModernPrinter {
    fun startPrint() {
        println("Printing in a modern way")
    }
}

// Class-based Adapter
class ModernPrinterAdapter(private val modernPrinter: ModernPrinter) : Printer {
    override fun print() {
        modernPrinter.startPrint()
    }
}

// Client code
fun main() {
    val modernPrinter = ModernPrinter()
    val legacyPrinter: Printer = ModernPrinterAdapter(modernPrinter)

    legacyPrinter.print()
}
```

In this example:

- `Printer` is the target interface that the client expects.
- `ModernPrinter` is the class to be adapted (Adaptee).
- `ModernPrinterAdapter` is the class-based adapter that adapts the `ModernPrinter` to the `Printer` interface.

## Decorator Pattern

The decorator design pattern allows behavior to be added to an individual object, either statically or dynamically without affecting the behavior of other objects from the same class. In Kotlin, we can implement the decorator pattern using interfaces and classes.

Here's a simple example of the decorator pattern in Kotlin:

```kotlin
// Component interface
interface Car {
    fun drive()
}

// Concrete component
class BasicCar : Car {
    override fun drive() {
        println("Move from A to B")
    }
}

// Decorator abstract class
abstract class CarDecorator(private val decoratedCar: Car) : Car {
    override fun drive() {
        decoratedCar.drive()
    }
}

// Concrete decorator
class OffroadCar(decoratedCar: Car) : CarDecorator(decoratedCar) {
    override fun drive() {
        initialiseDrivingMode()
        super.drive()
    }

    private fun initialiseDrivingMode() {
        println("Configure offroad driving mode")
    }
}

fun main() {
    // Create a basic car
    val myBasicCar: Car = BasicCar()

    // Decorate it to make it an offroad car
    val offroadCar: Car = OffroadCar(myBasicCar)

    // Drive the offroad car
    offroadCar.drive()
}

```

In this example, `Car` is the component interface with the `drive` method and `BasicCar` is the concrete component implementing the Car interface. `CarDecorator` is the abstract class implementing the Car interface and delegating the drive operation to the decorated car.

`OffroadCar` is a concrete decorator that extends `CarDecorator` and adds its own behavior (initialiseDrivingMode) before calling the drive method of the decorated car.In the `main` function, a basic car is decorated to become an offroad car, and then the offroad car is driven.

The output for this code example will be:

```text
Configure offroad driving mode
Move from A to B
```

## Facade Pattern

The Facade design pattern provides a simplified interface to a set of interfaces in a subsystem, making it easier to use. It involves creating a class that represents a higher-level, unified interface that makes it easier for clients to interact with a subsystem. This can help simplify the usage of complex systems by providing a single entry point.

Let's create a simple example of the Facade pattern in Kotlin. Consider a subsystem with multiple classes that handle different aspects of a computer system, CPU, Memory, and Hard Drive.

We'll create a ComputerFacade class to provide a simple interface for the client to interact with the subsystem:

```kotlin
// Subsystem classes
class CPU {
   fun processData() {
       println("Processing data...")
   }
}

class Memory {
   fun load() {
       println("Loading data into memory...")
   }
}

class HardDrive {
   fun readData() {
       println("Reading data from hard drive...")
   }
}

// Facade class
class ComputerFacade(
   private val cpu: CPU,
   private val memory: Memory,
   private val hardDrive: HardDrive
) {
   fun start() {
       println("ComputerFacade starting...")
       cpu.processData()
       memory.load()
       hardDrive.readData()
       println("ComputerFacade started successfully.")
   }
}

// Client code
fun main() {
   // Create subsystem components
   val cpu = CPU()
   val memory = Memory()
   val hardDrive = HardDrive()

   // Create facade and pass subsystem components to it
   val computerFacade = ComputerFacade(cpu, memory, hardDrive)

   // Client interacts with the subsystem through the facade
   computerFacade.start()
}
```

In this example, the `ComputerFacade` class serves as a simplified interface for starting the computer system. The client interacts with the subsystem (CPU, Memory, and HardDrive) through the `ComputerFacade` without needing to know the details of each subsystem component.

By using the Facade pattern, the complexity of the subsystem is hidden from the client, and the client can interact with the system through a more straightforward and unified interface provided by the facade. This can be especially useful when dealing with large and complex systems.

## Observer Pattern

The Observer design pattern is a behavioral design pattern where an object, known as the subject, maintains a list of its dependents, known as observers, that are notified of any state changes. This pattern is often used to implement distributed event handling systems.

Here's a simple example:

```kotlin
// Define an interface for the observer
interface Observer {
   fun update(value: Int)
}

// Define a concrete observer that implements the Observer interface
class ValueObserver(private val name: String) : Observer {
   override fun update(value: Int) {
       println("$name received value: $value")
   }
}

// Define a subject that emits values and notifies observers
class ValueSubject {
   private val observers = mutableListOf<Observer>()

   fun addObserver(observer: Observer) {
       observers.add(observer)
   }

   fun removeObserver(observer: Observer) {
       observers.remove(observer)
   }

   private val observable: Flow<Int> = flow {
       while (true) {
           emit(Random.nextInt(0..1000))
           delay(100)
       }
   }

   fun startObserving() {
       val observerJob = coroutineScope.launch {
           observable.collect { value ->
               notifyObservers(value)
           }
       }
   }

   private fun notifyObservers(value: Int) {
       for (observer in observers) {
           observer.update(value)
       }
   }
}
```

In summary, this code sets up a system where multiple observers can be attached to a subject `ValueSubject`. The subject emits random values in a continuous stream and each attached observer `ValueObserver` is notified whenever a new value is emitted. The observer then prints a message indicating that it received the new value.

## Strategy Pattern

The Strategy design pattern is a behavioral design pattern that defines a family of algorithms, encapsulates each algorithm and makes them interchangeable. It allows a client to choose an algorithm from a family of algorithms at runtime without modifying the client code.

Here's an example:

```kotlin
// Define the strategy interface
interface PaymentStrategy {
   fun pay(amount: Double)
}

// Concrete implementation of a payment strategy: Credit Card
class CreditCardPaymentStrategy(private val cardNumber: String,
                                private val expiryDate: String,
                                private val cvv: String)
: PaymentStrategy {
   override fun pay(amount: Double) {
       // Logic for credit card payment
       println("Paid $amount using credit card $cardNumber")
   }
}

// Concrete implementation of a payment strategy: PayPal
class PayPalPaymentStrategy(private val email: String) : PaymentStrategy {
   override fun pay(amount: Double) {
       // Logic for PayPal payment
       println("Paid $amount using PayPal with email $email")
   }
}

// Context class that uses the strategy
class ShoppingCart(private val paymentStrategy: PaymentStrategy) {
   fun checkout(amount: Double) {
       paymentStrategy.pay(amount)
   }
}

fun main() {
   // Client code
   val creditCardStrategy = CreditCardPaymentStrategy("1234-5678-9012-3456", "12/24", "123")
   val payPalStrategy = PayPalPaymentStrategy("john.doe@example.com")

   val shoppingCart1 = ShoppingCart(creditCardStrategy)
   val shoppingCart2 = ShoppingCart(payPalStrategy)

   shoppingCart1.checkout(100.0)
   shoppingCart2.checkout(50.0)
}
```

In this example, the `PaymentStrategy` interface defines the contract for payment strategies and `CreditCardPaymentStrategy` and `PayPalPaymentStrategy` are concrete implementations of the strategy. The `ShoppingCart` class represents the context that uses the selected payment strategy.

By using the Strategy Design Pattern, we can easily add new payment strategies without modifying the existing code. We can create new classes that implement the `PaymentStrategy` interface and use them interchangeably in the `ShoppingCart` context.

## Abstract Pattern

The abstract design pattern provides an interface for creating families of related or dependent objects without specifying their concrete classes. This pattern is often used when a system needs to be independent of how its objects are created, composed, represented and the client code should work with multiple families of objects.In Kotlin, you can implement the abstract design pattern using interfaces, abstract classes, and concrete classes.

Let's look at a simple example to illustrate the abstract design pattern:

```kotlin
// Abstract Product A
interface ProductA {
    fun operationA(): String
}

// Concrete Product A1
class ConcreteProductA1 : ProductA {
    override fun operationA(): String {
        return "Product A1"
    }
}

// Concrete Product A2
class ConcreteProductA2 : ProductA {
    override fun operationA(): String {
        return "Product A2"
    }
}

// Abstract Product B
interface ProductB {
    fun operationB(): String
}

// Concrete Product B1
class ConcreteProductB1 : ProductB {
    override fun operationB(): String {
        return "Product B1"
    }
}

// Concrete Product B2
class ConcreteProductB2 : ProductB {
    override fun operationB(): String {
        return "Product B2"
    }
}

// Abstract Factory
interface AbstractFactory {
    fun createProductA(): ProductA
    fun createProductB(): ProductB
}

// Concrete Factory 1
class ConcreteFactory1 : AbstractFactory {
    override fun createProductA(): ProductA {
        return ConcreteProductA1()
    }

    override fun createProductB(): ProductB {
        return ConcreteProductB1()
    }
}

// Concrete Factory 2
class ConcreteFactory2 : AbstractFactory {
    override fun createProductA(): ProductA {
        return ConcreteProductA2()
    }

    override fun createProductB(): ProductB {
        return ConcreteProductB2()
    }
}

// Client Code
fun main() {
    val factory1: AbstractFactory = ConcreteFactory1()
    val productA1: ProductA = factory1.createProductA()
    val productB1: ProductB = factory1.createProductB()

    println(productA1.operationA()) // Output: Product A1
    println(productB1.operationB()) // Output: Product B1

    val factory2: AbstractFactory = ConcreteFactory2()
    val productA2: ProductA = factory2.createProductA()
    val productB2: ProductB = factory2.createProductB()

    println(productA2.operationA()) // Output: Product A2
    println(productB2.operationB()) // Output: Product B2
}

```

In this example, `AbstractFactory` declares the creation methods for two types of products `ProductA` and `ProductB`. Concrete factories `ConcreteFactory1` and `ConcreteFactory2` implement these creation methods to produce specific products `ConcreteProductA1`, `ConcreteProductA2`, `ConcreteProductB1` and `ConcreteProductB2`. The client code can then use a specific factory to create products without needing to know the concrete classes of those products.

This structure allows for easy extension of the system by introducing new products and factories without modifying the existing client code.

## Factory Design Pattern

The Factory Design Pattern is a creational pattern that provides an interface for creating objects in a super class but allows subclasses to alter the type of objects that will be created. This pattern is often used when a class cannot anticipate the class of objects it must create.

Here's an example of a simple Factory Design Pattern in Kotlin:

```kotlin
// Product interface
interface Product {
    fun create(): String
}

// Concrete Product A
class ConcreteProductA : Product {
    override fun create(): String {
        return "Product A"
    }
}

// Concrete Product B
class ConcreteProductB : Product {
    override fun create(): String {
        return "Product B"
    }
}

// Factory interface
interface ProductFactory {
    fun createProduct(): Product
}

// Concrete Factory A
class ConcreteFactoryA : ProductFactory {
    override fun createProduct(): Product {
        return ConcreteProductA()
    }
}

// Concrete Factory B
class ConcreteFactoryB : ProductFactory {
    override fun createProduct(): Product {
        return ConcreteProductB()
    }
}

// Client code
fun main() {
    val factoryA: ProductFactory = ConcreteFactoryA()
    val productA: Product = factoryA.createProduct()
    println(productA.create())

    val factoryB: ProductFactory = ConcreteFactoryB()
    val productB: Product = factoryB.createProduct()
    println(productB.create())
}

```

In this example, we have a `Product` interface representing the product to be created. We have two concrete product classes, `ConcreteProductA` and `ConcreteProductB`, which implement the Product interface. We also have a `ProductFactory` interface with a method `createProduct()` and two concrete factory classes, `ConcreteFactoryA` and `ConcreteFactoryB` which implement this interface and return instances of the respective concrete products.

## Conclusion

In this article, we learnt what a design pattern is in kotlin , the advantages that design patterns offer in our software development processes and the various design patterns that Kotlin offers.
