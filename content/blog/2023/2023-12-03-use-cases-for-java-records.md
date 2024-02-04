---
authors: [sagaofsilence]
title: "Use Cases for Java Records"
categories: ["Java"]
date: 2023-12-03 00:00:00 +0530
excerpt: "Get familiar with the Java records."
image: images/stock/0069-testcontainers-1200x628-branded.jpg
url: beginner-friendly-guide-to-java-records
---

Java Records introduce a simple syntax for creating data-centric classes, making our code more concise, expressive, and maintainable.

In this guide, we'll explore the key concepts and practical applications of Java Records, providing a step-by-step guide to creating records and sharing best practices for using them effectively in projects. We'll cover everything from defining components and constructors to accessing components, overriding methods, and implementing additional methods. Along the way, we'll compare Java Records with traditional Java classes, highlighting the reduction in boilerplate code and showcasing the power and efficiency of records.

> Out of clutter, find simplicity   --- Albert Einstein.

Java records offer a cleaner, hassle-free way to handle our data. Say goodbye to verbose classes and hello to a world where our code expresses intentions with crystal clarity. Java records are like the wizard's tool, magically generating essential methods, leaving us with more time to focus on the business logic! 🎩✨

<a name="example-code" />
{{% github "https://github.com/thombergs/code-examples/tree/master/core-java/records" %}}

# Get Familiar With Java Records
In the constantly changing world of Java programming, simplicity is the most desired approach. Java records transform the way we manage data classes. It simplifies the way we implement the data classes by taking out the verbosity.

## What are Java Records?
Java records are a special kind of class introduced in Java 14. They are tailored for simplicity, designed to encapsulate data without the clutter of boilerplate code. **With a concise syntax, records enable us to create immutable data holders effortlessly.**

{{% info title="Comparison to Lombok and Kotlin" %}}
**Lombok:**
Lombok simplifies Java development by reducing boilerplate code. It offers annotations like `@Data` for automatic generation of methods, akin to Java records. While providing flexibility, Lombok requires external dependencies and may lack the language-level support and immutability guarantees inherent in Java records.

**Kotlin:**
Kotlin, as a modern, concise language for the JVM, incorporates data classes that share similarities with Java records. Kotlin's data classes automatically generate `equals()`, `hashCode()`, and `toString()` methods, enhancing developer productivity. Unlike Java records, Kotlin's data classes support default parameter values and additional features within a concise syntax, providing expressive and powerful data modeling capabilities.

{{% /info %}}

## Why Records?
Traditionally, Java classes representing data structures contained repetitive code for methods such as equals(), hashCode(), toString(), getter/setter methods, and public constructors. This resulted in bloated classes, making the codebase more difficult to read, understand, maintain, and extend. Java records were introduced as a solution, simplifying the creation of data-centric classes and addressing the issues of verbosity and redundancy.

There are several benefits to using Java records:

### Simplicity
One of the key advantages of records is their ability to create simple data objects without the need for writing extensive boilerplate code. With records, we can define the structure of our data concisely and straightforwardly.

### Immutability by Default
Java records are immutable by default, meaning that once we create a record, we cannot modify its fields. This immutability ensures data integrity and makes it easier to reason about the state of the objects.

### Conciseness and Readability
Java records offer a more concise and readable syntax compared to traditional Java classes. The streamlined syntax of records allows us to define our data fields and their types in a compact and visually appealing way, making it easier to understand and maintain our code.

In summary, Java records provide a powerful and efficient way to create data-centric classes. They simplify the process of defining and working with data objects, promote immutability, and enhance code readability. By leveraging the benefits of records, we can write cleaner and more maintainable code in our Java projects.

## The Evolution of Java Records
- *Java 14 (March 2020):* Records made their first appearance as a preview feature, giving us a glimpse into the exciting future of simplified Java programming.
- *Java 15 and 16:* Records kept evolving and improving, thanks to the valuable feedback from the community.
- *Java 16 (March 2021):* Records were officially established as a standard feature, indicating their readiness to shine in Java applications.

With Java records, we can experience a shift from complexity to clarity in Java programming.

In the following sections, we will dive into the details of Java records, including their syntax, use cases, and how they can bring elegance to our code.

{{% info title="Notes on Perview Enablement And Why We Need To Know It" %}}

- For Java versions before 14, records are not available as a language feature.
- For Java versions 14, 15, or between 14 and 16, we need to use the `--enable-preview` flag to use records.
- For Java versions 16 and above, records are a standard feature, and the `--enable-preview` flag is not required for using records.

*Preview features are introduced in a specific Java version but are not considered part of the official language specification until they are finalized in a subsequent release.*

Here's how we can use `--enable-preview`:

**Compilation:**
```bash
javac --enable-preview --release 14 SomeFile.java
```

**Execution:**
```bash
java --enable-preview SomeClass
```

In the above commands:
- `--enable-preview` enables preview features during compilation and execution.
- `--release 14` specifies the Java version we are targeting. Replace `14` with the appropriate version number if we are using a different version of Java.

It is important to note that when using preview features, we might encounter changes or improvements in subsequent Java versions, and the syntax or behavior of these features could be refined before they become permanent parts of the language.

👉 Always check the official Java documentation and release notes for the specific version we are using to understand the details of the preview features and any changes made in subsequent releases.

The configurations for IDEs depend on the IDE we are using.

👉 Refer IDE documentation for specific details on code generation and other developer tools provided for implementing records.

{{% /info %}}

Let's explore the challenges we face and how Java records can help solve them. We'll also take a closer look at the syntax of Java records to gain a better understanding.

## Challenges Faced by Developers

Creating and maintaining data-centric classes in Java traditionally required substantial effort.

### Verbosity Overload
   Traditional Java classes required us to write verbose code for basic functionalities like `constructor`, `gettter`, `setter`, `equals()`, `hashCode()`, and `toString()`. This verbosity cluttered the code, making it difficult to write, read and understand.

```java
// Verbose Java class
public class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    @Override
    public boolean equals(Object obj) {
        // Manually written equals() method
        // ...
    }

    @Override
    public int hashCode() {
        // Manually written hashCode() method
        // ...
    }

    @Override
    public String toString() {
        // Manually written toString() method
        // ...
    }
    
    // getters and setters
}
```

### Boilerplate Fatigue
Writing repetitive boilerplate code was not only time-consuming but also error-prone. Any change in the class structure meant manually updating multiple methods, leading to maintenance nightmares.

### Immutability Hassles
Ensuring immutability, a key aspect of data integrity, demanded additional effort. We had to meticulously design classes to make them immutable, often leading to complex and convoluted code.

## How Does Java Records Address These Issues?

Java Records, with their concise syntax, automate essential method generation, eliminating boilerplate code. They prioritize immutability by default, ensuring data integrity without manual enforcement. Automatic generation of methods like `equals()`, `hashCode()`, and `toString()` simplifies development, enhancing code readability and maintainability. Classes become concise, improving clarity and facilitating quick comprehension.

## Syntax of Java Records

Let's dive into the syntax of Java records, covering its key elements, various types of constructors, methods, and how records compare with traditional Java classes.

Let's explore the basic syntax of Java records:

```java
public record Person(String name, int age) {
    // Constructor and methods are automatically generated.
}
```

In this example, `Person` is a Java record with two components: `name` (a `String`) and `age` (an `int`). The `record` keyword signifies the creation of a record class. 

A record acquires these members automatically:
- A private final field for each of its components
- A public read accessor method for each component with the same name and type of the component; in this example, these methods are `Person::name()` and `Person::age()`
- A public constructor whose signature is derived from the record components list. The constructor initializes each private field from the corresponding argument.
- Implementations of the `equals()` and `hashCode()` methods, which specify that two records are equal if they are of the same type and their corresponding record components are equal
- An implementation of the `toString()` method that includes the string representation of all the record's components, with their names

Records extend `java.lang.Record`, are final, and cannot be extended.

Here's a breakdown of the essential components.

### Types of Constructors

#### Canonical Constructor
When we declare the record, canonical constructor is automatically generated behind the scene.

```java
public record Person(String name, int age) {
    // autogenerated code
    // private final String name;
    // private final int age;
    // public Person(String name, int age) {
    //     this.name = name;
    //     this.age = age;
    // }
}
```

`public Person(String name, int age)` is the canonical construcor (all-arguments construcor) generated for us.

#### Compact Constructor

A compact constructor enables developers to add custom logic during object initialization. This constructor is explicitly declared within the record and can perform additional operations beyond the simple initialization.

However, unlike a class constructor, a record constructor doesn't have a formal parameter list; this is called a *compact constructor*.

By providing an opportunity to perform custom operations during initialization, developers can ensure that their objects are correctly and completely initialized before they are used. For example, we can implement data validation rules before initializing the fields.

Example:
```java
public record Person(String name, int age) {
    // consturctor defined by the developer
    // Remember that it not like a standard constructor
    // We do not declare the constructor arguments
    // Just add body with custom logic
    public Person {
        // do not accept bad input
        if (age < 0) {
            throw new IllegalArgumentException("Age must be greater than zero.");
        }
    }
}

// Usage
Person person = new Person("Alice", 30); // Valid
Person invalidPerson = new Person("Bob", -5); // Throws IllegalArgumentException
```

For example, the record `Person` has fields `name` and `age`. Its custom constructor checks if the `age` is negative. If yes, it throws a `IllegalArgumentException`.


#### Default Constructor
Records can have a default constructor that initializes all components to their default values. This must delegate, directly or indirectly, to the canonical constructor.
   
Example:
```java
public record Person(String name, int age) {
    public Person() {
        // we must call the canonical constructor
        this("Foo", 50);
    }

}

// Usage
Person person = new Person(); // Components initialized to "Foo" and 50
```

In this example, it will generate the no-arguments constructor (Java's standard default initialization for the object state):

```java
// autogenerated cannonical constructor
public Person(String name, int age) {
    this.name = name;
    this.age = age;
}

public Person() {
    this("Foo", 50);
}
```

#### Custom Constructor
We can create custom constructors with subset of parameters, allowing flexibility in object creation.
This must delegate, directly or indirectly, to the canonical constructor.
   
Example:
```java
public record Person(String name, int age) {
    public Person {
        if (name == null) {
            throw new IllegalArgumentException("Name cannot be null.");
        }
    }

    public Person(int age) {
        this("Bob", age);
    }
}

// Usage
Person person = new Person("Alice", 30); // Valid
Person unknownPerson 
    = new Person(25); // Uses custom constructor with default name "Bob"
```
In this example, we can create a custom constructor that only takes in the `age` parameter. This means that when we create an instance of the `Person` class, we only need to provide the `age` value. The other properties will be set to their default values.

This feature is especially useful when dealing with large and complex classes that have many properties. It allows developers to create objects quickly and efficiently without having to specify all the properties every time.

### Accessing Components

- Components in a record are implicitly `final`, making them immutable.
- Records automatically generate getters for components, providing read-only access.

```java
Person person = new Person("Alice", 30);
String name = person.name(); // Getter for 'name'
int age = person.age(); // Getter for 'age'
```

When working with records in Java, it is important to understand how to access their components. Components are the individual fields or properties that make up a record. For example, in the code above, the `Person` record has two components: `name` and `age`. 

To access the components of a record, we first need to create an instance of the record using the `new` keyword. In this case, we are creating a new `Person` record and assigning it to a variable called `person`. The values `Alice` and `30` are passed as arguments to the `Person` constructor, which initializes the `name` and `age` components of the record. 

Once we have an instance of the record, we can access its components using getters. Getters are methods that are automatically generated by the Java compiler for each component of a record. In the code above, we are using the `name()` and `age()` getters to retrieve the values of the `name` and `age` components, respectively. As these are read only properties, there are no setters available for `name` and `age`.

### Overriding Methods

Records automatically generate methods like `equals()`, `hashCode()`, and `toString()` based on components. We can customize these methods if needed.

Example:
```java
public record Person(String name, int age) {
    // Automatically generated methods can be overridden
    @Override
    public String toString() {
        return String.format("Person{name='%s', age=%d}", name, age);
    }
}

// Usage
Person person = new Person("Alice", 30);
System.out.println(person); // Output: Person{name='Alice', age=30}
```
### Delegating Methods

Record methods can delegate behavior to other methods within the record or external methods. This enables code reuse and modular design.

Example:
```java
public record Person(String name, int age) {
    public Person withName(String name) {
        return new Person(name, age);
    }
}

// Usage
Person person = new Person("Alice", 50); // Person[name=Alice, age=50]
Person newPerson = person.withName("Tom"); // Person[name=Tom, age=50]
```
### Implementing Methods

We can add additional methods to records, allowing them to encapsulate behavior related to the data.

Example:
```java
public record Person(String name, int age) {
    public boolean isAdult() {
        return age >= 18;
    }
}

// Usage
Person person = new Person("Alice", 30);
System.out.println(person.isAdult()); // Output: true
```

## One-to-one Comparison

Let's compare a record with a traditional Java class to highlight the reduction in boilerplate code:

```java
// Traditional Java class
public class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    @Override
    public boolean equals(Object obj) {
        // Manually written equals() method
        // ...
    }

    @Override
    public int hashCode() {
        // Manually written hashCode() method
        // ...
    }

    @Override
    public String toString() {
        // Manually written toString() method
        // ...
    }
}
```

The equivalent Java record achieves the same functionality with significantly less code:

```java
// Java record
public record Person(String name, int age) {}
```

Java records not only enhance readability and maintainability but also promote a more expressive and concise coding style, allowing us to focus on the core logic of their applications.


## Examples of Records

### Using Enum as a Component

   ```java
   public record Student(String name, int age, Grade grade) {
       // Record body
   }

   public enum Grade {
       A, B, C, D, F
   }
   ```

### Nested Records

   ```java
   public record Address(String city, String state) {
       // Record body
   }

   public record Person(String name, int age, Address address) {
       // Record body
   }
   ```

### Complex Objects

Records maintain immutability even when dealing with complex objects. If a record contains non-primitive or mutable components, ensure that these components are also immutable or use defensive copies to maintain the overall immutability of the record.

```java
public record Address(String city, List<String> streets) {
    // Automatically generated methods ensure immutability, but caution with mutable components
}

List<String> streets = new ArrayList<>();
streets.add("Street 1");
streets.add("Street 2");

Address address = new Address("City", List.copyOf(streets));
streets.add("Street 3");

System.out.println(address.streets()); // Output: [Street 1, Street 2]
```

Let's explore best practices for using Java records effectively in projects, guidelines for maintaining code consistency and readability, and practical applications and conclusions.

## Best Practices for Using Java Records

### Choose Appropriate Use Cases
Choosing the appropriate use cases for Java records is paramount. Utilize records for simple data carriers where immutability and value semantics are crucial. However, refrain from employing records for classes with complex business logic or abundant behavior.

### Avoid Overcomplication
Avoid overcomplicating records. Resist the temptation to overload them with unnecessary methods. Embrace simplicity, letting records manage fundamental operations like `equals()`, `hashCode()`, and `toString()`.

### Ensure Immutability
Ensuring immutability is key to leveraging the benefits of Java records. Keep components final to enforce immutability. In cases where a component is mutable, such as a collection, create defensive copies during construction to maintain the desired immutability.

### Avoid Business Logic in Records
Steer clear of embedding business logic within records. Maintain the focus of records on data representation and delegate business logic to separate classes. This approach enhances maintainability and adheres to the principle of separation of concerns.

### Maintain Readability
To maintain readability, adhere to consistent naming conventions for both record classes and their components. Meaningful names for records and components contribute to code clarity, making it easier for developers to understand the structure and purpose of the classes.

### Document with Comments
Documenting records with comments is a good practice, particularly for complex or non-intuitive logic within records. Comments provide insights into the rationale behind certain decisions or implementations. Additionally, document any assumptions or constraints associated with record components to facilitate a better understanding of their usage.

## Mastering Java Records

### Recap of Key Concepts
- Java records simplify data-centric classes, promoting immutability and value semantics.
- Records automatically generate methods like equals(), hashCode(), and toString() for consistent behavior.
- Best practices ensure effective use, including appropriate use cases and maintaining readability.

### Next Steps
- **Apply the Concepts Learned:** Do not just stop at understanding — implement records in projects. Create immutable, clean, and readable data classes.
- **Experiment and Refine:** Play with different scenarios and refine understanding. Experimentation leads to mastery.
- **Share and Collaborate:** Share knowledge with peers, and collaborate on projects to learn from real-world use cases.

### Further Reading and Resources
- **Official Java Documentation:** Dive deep into the [official documentation](https://docs.oracle.com/en/java/javase/14/index.html) to explore advanced topics and nuances.

Equipped with the knowledge of Java records, go, create, innovate, and let the code shape the future!

Happy coding! 🚀
