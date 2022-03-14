---
title: "The Open-Closed Principle Explained"
categories: ["Software Craft"]
date: 2021-01-25T00:00:00
modified: 2021-01-25T00:00:00
authors: [skempken]
description: "An explanation of the Open-Closed Principle and its limitations alongside some code examples."
image: images/stock/0093-open-closed-1200x628-branded.jpg
url: open-closed-principle-explained
---

Robert C. Martin, maybe better known to you as „Uncle Bob“, has defined a set of principles for software engineering and software architecture.

Together, they are known as the **SOLID Principles**. 
One of them is the **Open-Closed Principle**, which we’ll explain in this post.

## A SOLID Background
The Open-Closed Principle is the "O" in SOLID. 
It was, however, originally stated by Bertrand Meyer in 1988 already. 

According to Robert Martin, it says that:

> A software artifact - such as a class or a component - should be _open_ for extension but _closed_ for modification.

In this article, **I'd like to explain the implications of the Open-Closed Principle, why it is beneficial to good design, and how we may apply it in practice**.


## Saving The Value Of Software
Software in the context of the SOLID principles has more than one value. 

First, there is the _functionality_: Software is used to store, process and display data, compute results, and so on.

Second, software makes a promise that it can be _flexible_ in case of new of changed requirements. 
It claims to be easy to change (that's why it's called _soft_ware).

In order to hold that promise, the software’s design should follow a set of principles, one of them being the Open-Closed Principle. 

The promise here is that, if the design is in accordance with said principle, its behavior and functionality can be easily changed by just _extending_ what is already present - instead of _modifying_ the present code.

## Inheritance
Meyer's original approach was to use inheritance as a core mechanism to achieve this feat. 

At a first glance, this is easy to understand: If a behavior coded in a class needs to be changed, a way of doing that is to create a subclass and override methods as necessary.

No change to the superclass is necessary, just new code in the subclass. 

Let's look at an example. The following class greets the world:

```java
public class Greeter {

    public void greet() {
        System.out.println("Hello, World!");
    }
}
```

It is used by the following application:
```java
public class GreeterApp {

    public static void main(String[] args) {
        Greeter greeter = new Greeter();
        greeter.greet();
    }
}
```

While pondering about the greeting of all people in the world, we notice that not everyone speaks the same language. 

Therefore, we decide that we need to _extend_ our `Greeter` for additional languages. 

Following what we've already learned about the Open-Closed Principle, we create a new subclass to do so:

```java
public class FrenchGreeter extends Greeter {

    @Override
    public void greet() {
        System.out.println("Bonjour!");
    }
}
```

But how do we integrate the new behaviour into our present application? 

We would need to introduce some kind of "switch", wouldn't we? How could we do that without modifying the present code?

This situation already shows the limitations of Inheritance - it only takes us so far. 

## Abstraction and Composition
Furthermore, inheritance introduces tight coupling between the affected classes - if the superclass changes, subclasses may need to be modified, too.

Let's say we want to generalize our example a bit, so that the output can be redirected towards a given `PrintStream`.

```java
import java.io.PrintStream;

public class Greeter {

    private PrintStream target;
    
    public Greeter(PrintStream target) {
        this.target = target;
    }

    public void greet() {
        target.println("Hello, World!");
    }
}
```

This breaks our subclass `FrenchGreeter`, which needs to be adapted to call the constructor of the superclass. 

How could we avoid this? 

**We can use abstraction instead of inheritance.**

To do so, we first introduce an abstract interface:

```java
public interface GreeterService {
    
    void greet();
    
}
```

The default greeter as well as the localised one should now implement this interface instead of inheriting from each other:

```java
public class Greeter implements GreeterService{

    private PrintStream target;
    
    public Greeter(PrintStream target) {
        this.target = target;
    }

    public void greet() {
        target.println("Hello, World!");
    }
}
```

```java
public class FrenchGreeter implements GreeterService {

    @Override
    public void greet() {
        System.out.println("Bonjour!");
    }
}
```

This breaks up the tight coupling between the two classes, allowing us to develop them independently.

## The Whole Truth

What happens if we want to extend the behaviour even further? Can we do that with our new class hierarchy?

In our example, let's say that we want to greet the user by name.

In a first step, we'd need to modify the `GreeterService` interface and introduce a name parameter:

```java
public interface GreeterService {
    
    void greet(String name);
}
```

Alas, this is already a modification of the present code!

We see another limitation of the Open-Closed Principle - we need to already anticipate which extensions we could want to make in the future in the original design.

## Summary and Conclusion

The Open-Closed Principle is one of the five SOLID principles. It requires that a software artifact should be _open for extension_, but _closed for modification_. 

To fulfil this requirement, we could apply inheritance or better yet, introduce a layer of abstraction with different implementations in our design to avoid tight coupling between particular classes.

We also learned that the Open-Closed Principle has two limitations:

* we still need some kind of toggle mechanism to switch between the original and extended behaviour, which could require modification of the present code, and
* the design needs to support the particular extension that we want to make - we cannot design our code in a way that ANY modification is possible without touching it.

Nevertheless, it is worthwhile to follow the Open-Closed Principle as far as possible, as it encourages us to develop cohesive, loosely coupled components. 

## Further Reading
* [The Open-Closed Principle](https://cleancoders.com/episode/clean-code-episode-10)
