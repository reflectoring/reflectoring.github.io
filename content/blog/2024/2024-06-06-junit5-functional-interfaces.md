---
authors: [sagaofsilence]
categories: [Java]
date: 2024-06-06 00:00:00 +1100
excerpt: Guide to JUnit 5 Functional Interfaces.
image: images/stock/0041-adapter-1200x628-branded.jpg
title: Guide to JUnit 5 Functional Interfaces
url: junit5-functional-interfaces
---

In this article, we would get familiar with JUnit 5 functional interfaces. JUnit 5 significantly advanced from its predecessors. Features like functional interfaces can greatly simplify our work once we grasp their functionality.

## Quick Introduction to Java Functional Interfaces

Functional interface are a fundamental concept in Java functional programming. Java 8 specifically designed them to allow the assignment of lambda expressions or method references while processing data streams. In the Java API, specifically in the `java.util.function` package, you will find a collection of functional interfaces. The main characteristic of a functional interface is that it contains only one abstract method. Although it can have default methods and static methods, these do not count towards the single abstract method requirement. Functional interfaces serve as the targets for lambda expressions or method references.

## JUnit 5 Functional Interfaces

JUnit functional interfaces belong to `org.junit.jupiter.api.function` package. It defines three functional interfaces: `Executable`, `ThrowingConsumer<T>` and `ThrowingSupplier<T>`.  We use them typically with `Assertions` utility class.

Understanding the functionality of these interfaces can significantly enhance your testing strategies. Functional interfaces enable you to create tests that are easier to read and understand. They minimize the need for repetitive code when dealing with exceptions. Incorporating these interfaces allows you to articulate intricate test scenarios in a more concise and transparent manner.

Let's learn how to use these function interfaces.

## Using Executable

The `Executable` is a functional interface that enables the implementation of any generic block of code that may potentially throw a `Throwable`.

## Using ThrowingConsumer

`ThrowingConsumer` represents a functional interface that enables the implementation of a generic block of code to consume an argument and possibly throw a `Throwable`.

## Using ThrowingSupplier

`ThrowingSupplier` is a functional interface that enables the implementation of a generic block of code that returns an object and may throw a `Throwable`.

## Conclusion

In this article we got familiar with JUnit 5 functional interfaces.
