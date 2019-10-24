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

In a domain rich with business rules, domain objects are the lifeblood of an application. Domain objects can contain both state and behavior. The closer the behavior is to the state, the easier the code will be to understand, reason about, and maintain. 

Domain objects don't have any outward dependency. They're pure Java and provide an API for use cases to operate on them.

Because domain objects have no dependencies to other layers of the application, changes in other layers don't affect them. They can evolve free of dependencies. This is a prime example of the Single Responsibility Principle (the "S" in "SOLID"), which states that components should have only one reason to change. For our domain object, this reason is a change in business requirements.

Having a single responsibility lets us evolve our domain objects without having to take external dependencies in regard. This evolvability makes the hexagonal architecture style perfect for when you're practicing Domain-Driven Design. While developing, we just follow the natural flow of dependencies: we start coding in the domain objects and go outward from there. If that's not Domain-Driven, then I don't know what is.

### Use Cases

We know use cases as abstract descriptions of what users are doing with out software. In the hexagonal architecture style, it makes sense to promote use cases to first-class citizens of our code base. 

A use case in this sense is a class that handles everything around, well, a certain use case. As an example let's consider the use case "Transfer Money" in a banking application. We'd create a class `TransferMoneyUseCase` with a distinct API that allows a user to transfer money. The code contains all the business rule validations and logic that are specific to the use case and thus cannot be implemented within the domain objects. Everything else is delegated to the domain objects (there might be a domain object `BankAccount`, for instance).

Similar to the domain objects, a use case class has no dependency to outward components. When it needs something from outside of the hexagon, we create an output port.

### Input and Output Ports

The domain objects and use cases are within the hexagon, i.e. within the core of the application. Every communication to and from the outside happens through dedicated "ports".

An input port is a simple interface that can be called by outward components and that is implemented by a use case. The component calling such an input port is called an input adapter or "driving" adapter.

An output port is again a simple interface that can be called by our use cases if they need something from the outside (database access, for instance). This interface is designed to fit the needs of the use cases, but it's implemented by an outside component called an output or "driven" adapter. If you're familiar with the SOLID principles, this is an application of the Dependency Inversion Principle (the "D" in SOLID), because we're inverting the dependency from the use cases to the output adapter using an interface.

With input and output ports in place, we have very distinct places where data enters and leaves our system, making it easy to reason about the architecture. 

### Adapters

The adapters form the outer layer of the hexagonal architecture. They are not part of the core, but interact with it.

Input adapters or "driving" adapters call the input ports to get something done. An input adapter could be a web interface, for instance. When a use clicks a button in a browser, the web adapter calls a certain input port to call the corresponding use case. 

Output adapters or "driven" adapters are called by our use cases and might for instance provide data from a database. An output adapter implements a set of output port interfaces. Note that the interfaces are dictated by the use cases and not the other way around.

The adapters make it easy to exchange a certain layer of the application. If the application should be usable from a fat client additionally to the web, we add a fat client input adapter. If the application needs a different database, we add a new persistence adapter implementing the same output port interfaces as the old one.

## Show Me Some Code!

### Building a Domain Object

### Building a Use Case

### Building a Web Adapter

### Building a Persistence Adapter

## Is it Worth the Effort?
* link fowler's blog post "the cost of quality"

## Get the Book