---

title: Everything you need to know about Interface Segregation Principle
categories: [craft]
date: 2020-01-31 06:00:00 +1100
modified: 2020-02-01 07:44:00 +1100
author: mukul
excerpt: "This is one stop practical guide to understand and apply the Interface Segregation Principle, which is one of the SOLID principle."
image:
  auto: 0018-cogs
tags: ["Interface Segregation Principle", "ISP", "SOLID", "Principles of software development"]
---


> "Clients should not be forced to depend upon interfaces that they do not use." — Robert Martin, paper "[ The Interface Segregation Principle](https://web.archive.org/web/20150905081110/http://www.objectmentor.com/resources/articles/isp.pdf)"

Abstraction is the heart of object-oriented design. It allows the client to be unconcerned with the implementation details of functionality. In Java, abstraction is achieved through abstract classes and interfaces. This article explains the idea of the Interface Segregation Principle which is the "I" in the [SOLID](https://en.wikipedia.org/wiki/SOLID) principles.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/solid" %}

## What is an Interface?
An Interface is a set of abstractions which an implementing class must follow. Basically, we define the behaviour but don't implement it:

```java
interface Dog {
  void bark();
}
```

Taking the interface as a template, we can then implement the behavior: 

```java
class Poodle implements Dog {
  
  public void bark(){
    // poodle-specific implementation    
  }

}
```

## What is the Interface Segregation Principle?
The Interface Segregation Principle (ISP) states that **a client should not be exposed to methods it doesn't need**. Declaring methods in an interface which the client doesn't need pollutes the interface and leads to a "bulky" or "fat" interface.

## Reasons to Follow the Interface Segregation Principle
Let's look at an example to understand why the Interface Segregation Principle is helpful.
 
We'll create some code for a burger place where a customer can order a burger, fries or a combo of both:

```java 
public interface IOrder {
    void orderBurger(int quantity);
    void orderFries(int fries);
}
```

Since a customer can order fries, or a burger, or both, we decided to put both order methods in a single interface. 

Now, **to implement a burger-only order, we are forced to throw an exception in the `orderFries()` method**:

```java
class BurgerOrder implements IOrder {
    @Override
    public void orderBurger(int quantity) {
      // code for ordering a burger ...
    }

    @Override
    public void orderFries(int fries) {
        throw new UnsupportedOperationException("No fries in Burger only order");
    }
}
```
Similarly, **for a fries-only order we'd also need to throw an exception in `orderBurger()` method**. 

And this is not the only downside of this design. The `BurgerOrder` and `FriesOrder` classes will also have unwanted side effects whenever we make changes to our abstraction. Let's say we decided to accept an order of fries in with unit such as pounds or grams. In that case we most likely have to add a `unit` parameter in `orderFries()`. *This change will also affect `BurgerOrder` even though it's not really implementing this method!* 

By violating the ISP, we face the following problems in our code:
1. Client developers are confused by methods they don't need.
2. Maintenance becomes harder because of side effects: a change in an interface forces us to change classes that don't really implement the interface.
3. Violating the ISP leads to violation of [other principles](#the-interface-segregation-principle-and-other-solid-principles) like the Single Responsibility Principle. 

## Code Smells for ISP Violations and How to Fix Them
Whether working solo or in larger teams, it helps to identify problems in code early. So, here are some code smells which could possibly indicate a violation of the ISP:

### A Bulky Interface    
A bulky interface might be a good indicator for ISP violation, although it's not always the case.

### Methods Throwing Exceptions

As in our burger example, if we encounter a `UnsupportedOperationException`, a `NotImplementedException`, or similar exceptions, it could be a design problem related to the ISP. It might be a good time to refactor these classes. 

For example, we can refactor our burger place code to have separate interfaces for `BurgerOrder` and `FriesOrder`:

```java
interface IBurgerOrder{
    void orderBurger(int quantity);
}

interface IFriesOrder {
    void orderFries(int quantity);
}
```
We could also use the [adapter pattern](https://en.wikipedia.org/wiki/Adapter_pattern) to abstract away the unwanted methods:

```java
interface IAdapterOrderForBurger {
    void orderBurger(int quantity);
}
```
```java
interface IAdapterOrderForFries {
    void orderFries(int quantity);
}
```
We have created independent interfaces which will only have the methods needed from the **IOrder.java** interface
```java
class AdaptedBurgerOrder implements IAdapterOrderForBurger {
    private IOrder burgerOrder;
    public AdaptedBurgerOrder(IOrder burgerOrder){
        this.burgerOrder = burgerOrder;
    }

    @Override
    public void orderBurger(int quantity) {
        burgerOrder.orderBurger(quantity);
    }
}
```
As we can see in above code, we are still using the methods provided by the `IOrder` interface but we are only implementing the methods that the concrete class actually needs.

This is useful when we are using an external dependency. In the above example we are using order interface as an external dependency but we have successfully restructured code to avoid side effects. 

### Too Many Dependencies to Mock in a Test
If a class has a lot of dependencies but each method only uses a few of them, it's an indication for an ISP violation.

### Too Many Wrapper Classes    
As wrapper classes add no additional functionality in the code, having a lot of them indicates that the codebase needs to be refactored. Having too many wrapper classes will also increase complexity and thus maintenance effort in a codebase.

## So, Should Interfaces Always Have a Single Method?
Applying the ISP to the extreme will result in one method interfaces also known as role interfaces. 

This solution will definitely solve the problem of ISP violation but it can result in SRP (Single Responsibility Principle) violation. For example, the `Collection` interface in java has many methods like `size()` and `isEmpty()` which are often used together, so it makes sense for them to be in a single interface.

## The Interface Segregation Principle and Other Solid Principles
The SOLID principles are closely related to one another. The ISP is particularly closely related to the [Liskov Substitution Principle](https://en.wikipedia.org/wiki/Liskov_substitution_principle) (LSP) and the [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single_responsibility_principle) (SRP).

In our burger place example, we have to throw an `UnsupportedOperationException` in our interface implementations. This  is actually a violation of the LSP since the child is not actually extending the functionality of the parent but instead restricting it. 

This is also true in case of the SRP. While the SRP forces the developers to actually increase the bulkiness of an interface but it only does so for relevant methods and it advises us not to include unrelated methods in an interface which we have violated in our burger place code leading to ISP violation

Another interesting relation of the ISP is with the Open/Closed Principle, which states that classes should be open to extension but should be closed for modification. In our burger place example we did not only have to implement unwanted methods, but also carries side effects of changes done in parent i.e. `IOrder` interface.


## Conclusion
The ISP is a really simple principle which is also easy to violate by adding methods to existing interfaces that the clients don't really need. Violating it can easily lead to unwanted dependencies in our code. 

Violating the ISP also easily leads to violations of other SOLID principles. In our small example alone we have seen a violation of 4 SOLID principles.

There are many code smells which can help us to identify and then fix ISP violations by refactoring or applying the adapter pattern.

The example code used in this article is available on [GitHub](https://github.com/thombergs/code-examples/tree/master/solid).
