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


>Clients should not be forced to depend upon interfaces that they do not use." — Robert Martin, ISP paper [Principles of OOD ](https://web.archive.org/web/20150905081110/http://www.objectmentor.com/resources/articles/isp.pdf)

Abstraction is the heart of object-oriented design which allows the client to be unconcerned with the implementation details of functionality. In Java, abstraction is achieved through abstract classes and Interface. This article explains the idea of the Interface Segregation Principle which is one of  the [SOLID](https://en.wikipedia.org/wiki/SOLID) principles

{% include github-project.html url="https://github.com/mukul-s/code-examples/tree/master/craft/interface%20segregation%20principle" %}

## What is an Interface?
An Interface is a set of abstractions which implementing class must follow. Basically, you define the behaviour but not implement them.
For e.g. You can define them in Java as below:
```java
interface Dog{
  void bark();
}

class Poodle implements dog{
  // Poodle class needs to implement dog otherwise we will get a compilation error
  public void bark(){
    
  }
}
```

## What is the Interface Segregation Principle (ISP)
ISP states that **A Client should not be exposed to methods that they don't need**. Declaring methods in an interface which it doesn't need pollutes the interface and leads to the bulky interface also called a fat interface.

## Why you need ISP in your code?
Lets taken an example to understand this - Below is code for **Burgerpoint** where a customer can order burger, fries or a combo.
``` java 
/**
 * IOrder.java
 **/
public interface IOrder {
    void orderBurger(int quantity);
    void orderFries(int fries);
}
```
Since a customer can order fries or burger both, we decided to put both of them in a single interface. Now to support a burger only order, we have to throw an exception in **orderFries** method.
```java
/**
 * BurgerOrder.java
 **/
public class BurgerOrder implements IOrder {
    @Override
    public void orderBurger(int quantity) {

    }

    @Override
    public void orderFries(int fries) {
        throw new UnsupportedOperationException("No fries in Burger only order");
    }
}

// Similarly for FriesOrder.java
```
Similarly, for fries only order you also need to throw an exception in **orderBurger** method. This is not the only downside of this design, these classes will also have unwanted side effects, whenever you make changes to your abstraction. Let's say you decided to accept an order of fries in multiple units such as pounds or grams. In that case we most likely we have to add a parameter for the unit in orderFries method. This change will also affect the **BurgerOrder.java** even when it doesn't really support the ordering of fries. 

By not following the ISP, we face the following problems in our code:
1. We have unwanted methods in client classes
2. Since we need to explicitly handle access to methods which client does not need, maintenance has become harder because of the side effect of ISP violation which will only be going to increase for a large codebase
3. Availability of methods which client does not use or need confuses the client as well
4. We will also see further how ISP violation will lead to violation of other SOLID principles as well.

## Code smells for ISP violations and how to fix them
Whether working solo or in larger teams, it helps to identify problems earlier in code, here are some code smells which could possibly indicate ISP violation:

1. A bulky interface    
A bulky interface might be a good indicator for ISP violation, although it's not always the case

2. UNSupportedMethod Exception
As in our burger example, if you encounter too many **Unsupported Operation Exception** it could be a design problem related to ISP. It might be a good time to refactor these classes, for example, we can refactor our BurgerPoint code to have separate interfaces for Burger order and Fries order.
```java
/**
 * IBurgerOrder.java
 **/
public interface IBurgerOrder{
    void orderBurger(int quantity);
}
```
```java
/**
 * IFriesOrder.java
 **/
public interface IFriesOrder {
    void orderFries(int quantity);
}
```
You could also use [Adapter pattern](https://en.wikipedia.org/wiki/Adapter_pattern). Adapter patten is used to abstract the unwanted methods like below:
```java
/**
 * IAdapterOrderForBurger.java
 **/
interface IAdapterOrderForBurger {
    void orderBurger(int quantity);
}
```
```java
/**
 * IAdapterOrderForFries.java
 **/
interface IAdapterOrderForFries {
    void orderFries(int quantity);
}
```
We have created independent interfaces which will only have the methods needed from the **IOrder.java** interface
```java
/**
 * AdaptedBurgerOrder.java
 **/
public class AdaptedBurgerOrder implements IAdapterOrderForBurger {
    private IOrder burgerOrder;
    public AdaptedBurgerOrder(IOrder burgerOrder){
        this.burgerOrder = burgerOrder;
    }

    @Override
    public void orderBurger(int quantity) {
        burgerOrder.orderBurger(quantity);
    }
}
// Similarly for fries order
```
As we can see in above code, we are still using the methods provided by **IOrder.java** interface but we are only implementing the methods that the concrete class actually needs.
This is useful when you are using an external dependency. In the above example  we are using order interface as an external dependency but we have successfully restructured code to avoid side effects. 

3. Too many dependencies to mock for JUnit    
If your class have too many dependencies while methods only needed few, this might indicate for ISP violation which leads to minimal dependency

4. Too many wrapper classes    
As wrapper classes add no additional functionality in the code rather is a design choice, having too many of them indicates for refactoring of the codebase. Having too many of wrapper classes will also need maintenance and further increases complexity in codebase

## Why always only having a single method interface is not a good idea?
Applying ISP to the extreme will result in one method interfaces also known as **role-interfaces**. 

This solution will definitely solve the problem for ISP violation but it can result in SRP (Single Responsibility Principle) violation. For example, the **Collection** interface in java has more than one methods e.g. **size()** and **isEmpty()** which are support methods and it make sense for them to be in a single interface

## Interface segregation and other SOLID principles
SOLID principles are closely related to one another. In this case, ISP is particularly seemed closely related to [Liskov substitution principle](https://en.wikipedia.org/wiki/Liskov_substitution_principle) and [Single responsibility principle](https://en.wikipedia.org/wiki/Single_responsibility_principle)

As in our **BurgerPoint** example, we have to throw **UnsupportedOperationException** in subinterfaces which is actually a violation of LSP since the child is not actually extending the functionality of parent rather restricting it. 

This is also true in case of SRP, while SRP forces the developers to actually increase the bulkiness of an interface but it only does so for relevant methods and it advises us not to include unrelated methods in an interface which we have violated in **BurgerPoint** application code leading to ISP violation

Another interesting relation of ISP is with **Open/Closed Principle**, which states that classes should be open to extension but should be closed for modification but in our **BurgerPoint** example we did not only have to implement unwanted methods, it also carries side effects of changes done in parent i.e. **IOrder.java** interface


## Conclusion
We can say that ISP is a really simple principle which is easy to avoid as well, but avoiding it can easily lead to unwanted complexity in our code. Not only that it might lead to violation of other SOLID principles, in our small example itself we have seen a violation of 4 SOLID principles.

There are many code smells which can help us in identifying ISP violations and then we can fix them by using various methods such as Adapter pattern and refactoring which is presented in this article.

The example code used in this article is available on [github](https://github.com/mukul-s/code-examples/tree/master/craft/interface%20segregation%20principle).
