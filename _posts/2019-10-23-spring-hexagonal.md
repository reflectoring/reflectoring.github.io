---
title: Hexagonal Architecture with Java and Spring
categories: [java, craft]
modified: 2017-10-25
excerpt: "TODO"
image:
  auto: 0054-bee
tags: ["architecture", "hexagonal"]
---

The term "Hexagonal Architecture" has been around for a long time. Long enough that the [primary source](https://alistair.cockburn.us/hexagonal-architecture/) on this topic has been offline for a while and has only recently been rescued from the archives. I found, however, that there are very few resources about how to actually implement an application in this architecture style. The goal of this article is to provide an opinionated way of implementing a web application in the hexagonal style with Java and Spring. 

If you'd like to dive deeper into the topic, have a look at my [book](/book/).

{% include github-project.html url="https://github.com/thombergs/buckpal" %}

## What is "Hexagonal Architecture"?

The main feature of "Hexagonal Architecture", as opposed to the common layered architecture style, is that the dependencies between our components point "inward", towards our domain objects: 

![Hexagonal Architecture](/assets/img/posts/spring-hexagonal/hexagonal-architecture.png)

The hexagon is just a fancy way to describe the core of the application that is made up of domain objects, use cases that operate on them, and input and output ports that provide an interface to the outside world.

Let's have a look at each of the stereotypes in this architecture style.

### Domain Objects

In a domain rich with business rules, domain objects are the lifeblood of an application. Domain objects can contain both state and behavior. The closer the behavior is to the state, the easier the code will be to understand and reason about. 

Domain objects don't have any outward dependency. They're pure Java and provide an API for use cases to operate on them.

Because domain objects have no dependencies to other layers of the application, changes in other layers don't affect them. They can evolve free of dependencies. This is a prime example of the Single Responsibility Principle (the "S" in "SOLID"), which states that components should have only one reason to change. For our domain object, this reason is a change in business requirements.

The evolvability of domain objects without dependencies makes the hexagonal architecture style perfect for when you're practicing DDD.

### Use Cases

### Input and Output Ports

If you're familiar with the SOLID principles, this is an application of the Dependency Inversion Principle (the "D" in SOLID).

### Adapters

## Building a Domain Object

## Building a Use Case

## Building a Web Adapter

## Building a Persistence Adapter

## Is it Worth the Effort?
* link fowler's blog post "the cost of quality"

## Get the Book