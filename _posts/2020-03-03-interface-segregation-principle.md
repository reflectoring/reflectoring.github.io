---
title: "Interface Segregation Principle: Everything You Need to Know"
categories: ["Software Craft"]
date: 2020-03-03 06:00:00 +1100
modified: 2021-10-24 07:44:00 +1100
author: mukul
excerpt: "A practical guide to understand and apply the Interface Segregation Principle, one of the SOLID principles."
image:
  auto: 0063-interface
tags: ["Interface Segregation Principle", "ISP", "SOLID", "Principles of software development"]
---

> "Clients should not be forced to depend upon interfaces that they do not use." — Robert Martin, paper "[The Interface Segregation Principle](https://web.archive.org/web/20150905081110/http://www.objectmentor.com/resources/articles/isp.pdf)"

Abstraction is the heart of object-oriented design. It allows the client to be unconcerned with the implementation details of functionality. In Java, abstraction is achieved through abstract classes and interfaces. This article explains the idea of the Interface Segregation Principle, which is the "I" in the [SOLID](https://en.wikipedia.org/wiki/SOLID) principles.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/solid" %}

## What Is an Interface?
An Interface is a set of abstractions that an implementing class must follow. We define the behavior but don't implement it:

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

## What Is the Interface Segregation Principle?
The Interface Segregation Principle (ISP) states that **a client should not be exposed to methods it doesn't need**. Declaring methods in an interface that the client doesn't need pollutes the interface and leads to a "bulky" or "fat" interface.

## Reasons to Follow the Interface Segregation Principle
Let's look at an example to understand why the Interface Segregation Principle is helpful.
 
We'll create some code for a burger place where a customer can order a burger, fries or a combo of both:

```java
interface OrderService {
    void orderBurger(int quantity);
    void orderFries(int fries);
    void orderCombo(int quantity, int fries);
}
```

Since a customer can order fries, or a burger, or both, we decided to put all order methods in a single interface.

Now, **to implement a burger-only order, we are forced to throw an exception in the `orderFries()` method**:

```java
class BurgerOrderService implements OrderService {
    @Override
    public void orderBurger(int quantity) {
        System.out.println("Received order of "+quantity+" burgers");
    }

    @Override
    public void orderFries(int fries) {
        throw new UnsupportedOperationException("No fries in burger only order");
    }

    @Override
    public void orderCombo(int quantity, int fries) {
        throw new UnsupportedOperationException("No combo in burger only order");
    }
}
```text
Similarly, **for a fries-only order, we'd also need to throw an exception in `orderBurger()` method**.

And this is not the only downside of this design. The `BurgerOrderService` and `FriesOrderService` classes will also have unwanted side effects whenever we make changes to our abstraction. 

Let's say we decided to accept an order of fries in units such as pounds or grams. In that case, we most likely have to add a `unit` parameter in `orderFries()`. **This change will also affect `BurgerOrderService` even though it's not implementing this method!**

By violating the ISP, we face the following problems in our code:
 
 * Client developers are confused by the methods they don't need.
 * Maintenance becomes harder because of side effects: a change in an interface forces us to change classes that don't implement the interface.

Violating the ISP also leads to violation of [other principles](#the-interface-segregation-principle-and-other-solid-principles) like the [Single Responsibility Principle](/single-responsibility-principle/).

## Code Smells for ISP Violations and How to Fix Them
Whether working solo or in larger teams, it helps to identify problems in code early. So, let's discuss some code smells which could indicate a violation of the ISP.

### A Bulky Interface
**In bulky interfaces, there are too many operations, but for most objects, these operations are not used**. The ISP tells us that we should need most or all methods of an interface, and in a bulky interface, we most commonly only need a few of them in each case. Also, when testing a bulky interface, we have to identify which dependencies to mock and potentially have a giant test setup.

### Unused Dependencies
Another indication of an ISP violation is when we have to pass `null` or equivalent value into a method.  In our example, we can use `orderCombo()` to place a burger-only order by passing zero as the `fries` parameter. This client does not require the `fries` dependency, so we should have a separate method in a different interface to order fries.

### Methods Throwing Exceptions
As in our burger example, if we encounter an `UnsupportedOperationException`, a `NotImplementedException`, or similar exceptions, it smells like a design problem related to the ISP. It might be a good time to refactor these classes.


### Refactoring Code Smells

For example, we can refactor our burger place code to have separate interfaces for `BurgerOrderService` and `FriesOrderService`:

```java
interface BurgerOrderService {
    void orderBurger(int quantity);
}

interface FriesOrderService {
    void orderFries(int fries);
}
```text
In case when we have an external dependency, we can use the [adapter pattern](https://en.wikipedia.org/wiki/Adapter_pattern) to abstract away the unwanted methods, which makes two incompatible interfaces compatible by using an adapter class.

For example, let's say that `OrderService` is an external dependency that we can't modify and needs to use to place an order. We will use the [Object Adapter Pattern](https://en.wikipedia.org/wiki/Adapter_pattern#Object_adapter_pattern) to adapt `OrderService` to our target interface i.e. `BurgerOrderService`. For this, we will create the `OrderServiceObjectAdapter` class which holds a reference to the external `OrderService`.

```java
class OrderServiceObjectAdapter implements BurgerOrderService {
    private OrderService adaptee;
    public OrderServiceObjectAdapter(OrderService adaptee) {
        super();
        this.adaptee = adaptee;
    }

    @Override
    public void orderBurger(int quantity) {
        adaptee.orderBurger(quantity);
    }
}
```

Now when a client wants to use `BurgerOrderService`, we can use the `OrderServiceObjectAdapter` to wrap the external dependency:

```java
class Main{
    public static void main(String[] args){
        OrderService orderService = ...;
        BurgerOrderService burgerService = 
          new OrderServiceObjectAdapter(new ComboOrderService());
        burgerService.orderBurger(4);
    }
}
```

As we can see, we are still using the methods provided by the `OrderService` interface, but the client now only depends on the method `orderBurger()`. We are using the `OrderService` interface as an external dependency, but we have successfully restructured code to avoid the side effects of an ISP violation.

## So, Should Interfaces Always Have a Single Method?
Applying the ISP to the extreme will result in single-method interfaces, also known as role interfaces.

This solution will solve the problem of ISP violation. Still, it can result in a violation of cohesion in interfaces, resulting in the scattered codebase that is hard to maintain. For example, the `Collection` interface in Java has many methods like `size()` and `isEmpty()` which are often used together, so it makes sense for them to be in a single interface.

## The Interface Segregation Principle and Other Solid Principles
The SOLID principles are closely related to one another. The ISP is particularly closely associated with the [Liskov Substitution Principle](https://en.wikipedia.org/wiki/Liskov_substitution_principle) (LSP) and the [Single Responsibility Principle](/single-responsibility-principle) (SRP).

In our burger place example, we have thrown an `UnsupportedOperationException` in `BurgerOrderService`, which is a violation of the LSP as the child is not actually extending the functionality of the parent but instead restricting it.

The SRP states that **a class should only have a single reason to change**. If we violate the ISP and define unrelated methods in the interface, the interface will have multiple reasons to change - one for each of the unrelated clients that need to change. 

Another interesting relation of the ISP is with the Open/Closed Principle (OCP), which states that **a class should be open for extension but closed for modification**. In our burger place example, we have to modify `OrderService` to add another order type. Had we implemented `OrderService` to take a generic `Order` object as a parameter, we would not only have saved ourselves from potential OCP violation but also have solved the ISP violation as well: 

```java
interface OrderService {
    void submitOrder(Order order);
}
```

## Conclusion
The ISP is a straightforward principle that is also easy to violate by adding methods to existing interfaces that the clients don't need. ISP is also closely related to other SOLID principles.

There are many code smells that can help us to identify and then fix ISP violations. Still, we have to remember that an overly aggressive implementation of any principle can lead to other issues in the codebase.

The example code used in this article is available on [GitHub](https://github.com/thombergs/code-examples/tree/master/solid).
