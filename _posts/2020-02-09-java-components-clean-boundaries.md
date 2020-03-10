---
title: Clean Architecture Boundaries with Spring Boot and ArchUnit
categories: [spring-boot]
date: 2020-02-03 05:00:00 +1100
modified: 2020-02-03 05:00:00 +1100
author: default
excerpt: ""
image:
  auto: 0065-boundary
---

When we're building software, we want to build for "-ilities": understandability, maintainability, extensibility, and - trending right now - decomposibility (so we can decompose a monolith into microservices if the need arises). Add your favorite "-ility" to that list.

Most - perhaps even all - of those "ilities" go hand in hand with clean dependencies between components. If a component depends on all other components, we don't know what side effects changes to one component will have, making the codebase hard to maintain and even harder to extend and decompose. 

Over time, many codebases deteriorate. Bad dependencies creep in and make it harder to work with the code. This has all kinds of bad effects. But most notably, development gets slower.

How can we protect our codebase from unwanted dependencies? With careful design and persistent enforcement of component boundaries. This article shows a set of practices that help in both regards when working with Spring Boot.   

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot-boundaries" %}

## Restricting Visibility to Package-Private 

What helps with enforcing component boundaries? Reducing visibility. 

If we use package-private visibility on "internal" classes, only classes in the same package can have access. This makes it harder to add unwanted dependencies from outside of the package.

So, just put all classes of a component into the same package and make only those classes public that are needed by the outside. Problem solved?

Not in my opinion. 

**It doesn't work if we need sub-packages within our component.** 

We'd have to make classes in sub-packages public so they can be used in other sub-packages, opening them up to the whole world.

I don't want to be restricted to a single package for my component. Maybe my component has sub-components which I don't want to expose to the outside. Or maybe I just want to sort the classes into separate buckets to make the codebase easier to navigate. I need to use sub-packages for that!

So, yes, package-private visibility helps in avoiding unwanted dependencies, but it's a half-assed solution at best.

## An Approach to Clean Boundaries

What can we do about it? Let's look at an holistic approach for keeping our codebase clean of unwanted dependencies.  

### Example Use Case

We discuss the approach alongside of an example use case. Say we're building a billing component that looks like this:

![A modules with external and internal dependencies](/assets/img/posts/clean-boundaries/components.jpg)

The billing component exposes an invoice calculator to the outside. The invoice calculator generates an invoice for a certain user and time period.

For the invoice calculator to work, it needs to synchronize data from an external order system in a daily batch job. This batch job pulls the data from an external source and puts it into the database.

Our component has three sub-components: the invoice calculator, the batch job, and the database code. All of those components potentially consist of a couple of classes. We want the batch job and the database code not to be accessible from the outside. 

### API Classes vs. Internal Classes

Let's take at the look at the package structure I propose for our billing component:

```
billing
├── api
└── internal
    ├── batchjob
    |   └── internal
    └── database
        ├── api
        └── internal
```

Each component and sub-component has an `internal` package containing, well, internal classes, and an optional `api` package containing, you guessed right, API classes that are meant to be used by other components. 

This package separation between `internal` and `api` gives us a couple of advantages:

* We can easily nest components within one another.
* It's easy to guess that classes within an `internal` package are not to be used from outside of it.
* It's easy to guess that classes within an `internal` package may be used from within its sub-packages.
* The `api` and `internal` packages give us a handle to enforce dependency rules with ArchUnit (more on that [later](#enforcing-boundaries-with-archunit)).
* We can use as many classes or sub-packages within an `api` or `internal` package as we want and we still have our component boundaries cleanly defined.

Classes within an `internal` package should be package-private if possible. But even if they are public (and they need to be public if we use sub-packages), the package structure defines clean and easy to follow boundaries.

Instead of relying on Java's insufficient support of package-private visibility, we have created an architecturally expressive package structure that can easily be enforced by tools.

Now, let's look into those packages.

### Inverting Dependencies to Expose Package-Private Functionality

Let's start with the `database` sub-component:

```
database
├── api
|   ├── + LineItem
|   ├── + ReadLineItems
|   └── + WriteLineItems
└── internal
    └── o BillingDatabase
```

The `database` component exposes an API with two interfaces `ReadLineItems` and `WriteLineItems`, which allow to read and write line items from a customer's order from and to the database, respectively. The `LineItem` domain type is also part of the API.

Internally, the `database` component has a class `BillingDatabase` which implements the two interfaces. There may be some helper classes around this implementation, but they're not relevant to us. 

Note that this is an application of the Dependency Inversion Principle. **Instead of the `api` package depending on the `internal` package, the dependency is the other way around**. This gives us the freedom to do in the `internal` package whatever we want, as long as we implement the interfaces in the `api` package. 

In the case of the `database` component, for instance, we don't care what database technology is used to query the database.

Let's have a peek into the `batchjob` component, too:

```
batchjob
└── internal
    └── o LoadInvoiceDataBatchJob
```  

The `batchjob` component doesn't expose an API to other components. It simply has a class `LoadInvoiceDataBatchJob` (and potentially some helper classes), that loads data from an external source on a daily basis, transforms it, and feeds it into the billing component's database via the `WriteLineItems` interface.

Finally, the content of the top-level `billing` component:

```
billing
├── api
|   ├── + Invoice
|   └── + InvoiceCalculator
└── internal
    ├── batchjob
    ├── database
    └── o BillingService
```

The `billing` component exposes the `InvoiceCalculator` interface and `Invoice` domain type. Again, the `InvoiceCalculator` interface is implemented by an internal class, called `BillingService` in the example. `BillingService` accessed the database via the `ReadLineItems` database API to create a customer invoice from multiple line items.

Now that we have a clean structure in place, we need dependency injection to wire it all together. 

### Wiring It Together with Spring Boot

To wire everything together to an application, we make use of Spring's Java Config feature and some of Spring Boot's auto-configuration.

```
billing
└── internal
    ├── batchjob
    |   └── internal
    |       └── o BatchJobConfiguration
    ├── database
    |   └── internal
    |       └── o BillingDatabaseConfiguration
    └── o BillingConfiguration
```

## Enforcing Boundaries with ArchUnit

### Marking Internal Packages

### Verifying That Internal Packages are Indeed Internal

### Making the Architecture Rules Refactoring-Safe
* check that the packages we're verifying actually exist

## Conclusion
* If you're working with Spring Boot, have a look at Moduliths, which provides some tooling around an opinionated way of structuring packages.

