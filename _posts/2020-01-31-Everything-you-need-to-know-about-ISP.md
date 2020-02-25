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

Abstraction is the heart of object-oriented design. It allows the client to be unconcerned with the implementation details of functionality. In Java, abstraction is achieved through abstract classes and interfaces. This article explains the idea of the Interface Segregation Principle, which is the "I" in the [SOLID](https://en.wikipedia.org/wiki/SOLID) principles.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/solid" %}

## What Is an Interface?
An Interface is a set of abstractions which an implementing class must follow. We define the behaviour but don't implement it:

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
The Interface Segregation Principle (ISP) states that **a client should not be exposed to methods it doesn't need**. Declaring methods in an interface which the client doesn't need pollutes the interface and leads to a "bulky" or "fat" interface.

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
```
Similarly, **for a fries-only order, we'd also need to throw an exception in `orderBurger()` method**.

And this is not the only downside of this design. The `BurgerOrderService` and `FriesOrderService` classes will also have unwanted side effects whenever we make changes to our abstraction. Let's say we decided to accept an order of fries in with units such as pounds or grams. In that case, we most likely have to add a `unit` parameter in `orderFries()`. *This change will also affect `BurgerOrderService` even though it's not implementing this method!*

By violating the ISP, we face the following problems in our code:
1. Client developers are confused by the methods they don't need.
2. Maintenance becomes harder because of side effects: a change in an interface forces us to change classes that don't implement the interface.
3. Violating the ISP leads to violation of [other principles](#the-interface-segregation-principle-and-other-solid-principles) like the Single Responsibility Principle.

## Code Smells for Isp Violations and How to Fix Them
Whether working solo or in larger teams, it helps to identify problems in code early. So, here are some code smells which could indicate a violation of the ISP:

### A Bulky Interface
**In bulky interfaces there are too many operations, but for most objects, these operations are not used**. ISP leads us to minimal dependency in our interface, and bulky interfaces are anti-pattern for ISP. Also, when testing a bulky interface, we have to identify which dependencies to mock or need to have a giant test setup, which is another indication of ISP violation.

### Unrequired Dependencies in a Class
Another indication of ISP violation is when we have to pass `null` or equivalent value to a method.  In our example, the client can use we can use `orderCombo` to place only a burger-only order by passing zero to `fries` parameter. This client does not require the `fries` dependency; we should have a separate method in a different interface to order fries.

### Methods Throwing Exceptions
As in our burger example, if we encounter a `UnsupportedOperationException`, a `NotImplementedException`, or similar exceptions, it could be a design problem related to the ISP. It might be a good time to refactor these classes.

For example, we can refactor our burger place code to have separate interfaces for `BurgerOrderService` and `FriesOrderService`:

```java
interface BurgerOrderService {
    void orderBurger(int quantity);
}

interface FriesOrderService {
    void orderFries(int fries);
}
```
In case when we have an external dependency, we can use the [adapter pattern](https://en.wikipedia.org/wiki/Adapter_pattern) to abstract away the unwanted methods, which makes two incompatible interfaces compatible by using an adapter class.

For example, let's say that `OrderService` is an external dependency that we can't modify and needs to use to place an order. We will use [Object Adapter Pattern](https://en.wikipedia.org/wiki/Adapter_pattern#Object_adapter_pattern) to adapt `OrderService` to our target interface i.e. `BurgerOrderService` . For this, we will create  `OrderServiceObjectAdapter` class which holds a reference to the adaptee, i.e. `OrderService` class object.

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
class ComboOrderService implements OrderService{
    @Override
    public void orderBurger(int quantity) {
        System.out.println("Received order of "+quantity+" burgers");
    }

    @Override
    public void orderFries(int fries) {
        System.out.println("Received order of "+fries+ " fries");
    }

    @Override
    public void orderCombo(int quantity, int fries) {
        System.out.println("Received order of "+quantity+" burgers and "+ fries+" fries");
    }
}

```

```java
class Main{
    public static void main(String[] args){
        ComboOrderService comboOrderService = new ComboOrderService();
        comboOrderService.orderCombo(4,5);
        OrderServiceObjectAdapter orderServObjectAdapter = new OrderServiceObjectAdapter(new ComboOrderService());
        orderServObjectAdapter.orderBurger(4);
    }
}
```

As we can see, we are still using the methods provided by the `OrderService` interface, but the client only depends on the method `orderBurger`. We are using `OrderService` interface as an external dependency, but we have successfully restructured code to avoid side effects of ISP violation.

## So, Should Interfaces Always Have a Single Method?
Applying the ISP to the extreme will result in one method interfaces, also known as role interfaces.

This solution will solve the problem of ISP violation. Still, it can result in a violation of cohesion in interfaces, resulting in the scattered codebase that is hard to maintain. For example, the `Collection` interface in Java has many methods like `size()` and `isEmpty()` which are often used together, so it makes sense for them to be in a single interface.

## The Interface Segregation Principle and Other Solid Principles
The SOLID principles are closely related to one another. The ISP is particularly closely associated with the [Liskov Substitution Principle](https://en.wikipedia.org/wiki/Liskov_substitution_principle) (LSP) and the [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single_responsibility_principle) (SRP).

In our burger place example, we have thrown `UnsupportedOperationException` in `BurgerOrderService`, which is a violation of the LSP as the child is not actually extending the functionality of the parent but instead restricting it.

SRP states that **a class should only have a single reason to change**. If we violate ISP and define unrelated methods in the interface, then there would be more than one actor on implementing class as well, which will violate SRP. ISP is more focused on how the client is consuming the interface while SRP is more focused on the design of implementing class

Another interesting relation of the ISP is with the Open/Closed Principle, which states that **a class should be open to extension but should be closed for modification**. In our Burger Place example, we have to modify `OrderService` to add another order type, instead if we have implemented `OrderService` as
```java
interface OrderService {
    void submitOrder(Order order);
}
```
We would not only have saved ourselves from potential OCP violation but also have solved the problem for ISP violation as well

## Conclusion
The ISP is a straightforward principle which is also easy to violate by adding methods to existing interfaces that the clients don't need. ISP is also closely related to other SOLID principles as well.

There are many code smells which can help us to identify and then fix ISP violations. Still, we have to remember that the aggressive implementation of any principle can lead to other issues in the codebase.

The example code used in this article is available on [GitHub](https://github.com/thombergs/code-examples/tree/master/solid).