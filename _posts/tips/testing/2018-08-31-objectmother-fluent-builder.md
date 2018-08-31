---

title: "Combining Object Mother and Fluent Builder for the Ultimate Test Data Factory"
categories: [tip, testing]
modified: 2018-08-31
last_modified_at: 2018-08-31
author: tom
tags: [testing, test data, generator]
comments: true
ads: true
excerpt: "Combining the Object Mother Pattern with the Fluent Builder Pattern allows to create
          Test Data Factories that reduce code duplication and promote the Single Responsibility Principle.
          Learn why and how in this tutorial." 
sidebar:
  nav: testing
  toc: true
---

{% include sidebar_right %}

To test our business code we always need some kind of test data. This tutorial explains how to do just that with the 
Object Mother pattern and why we should combine it with a Fluent Builder to create test data factories that
are fun to work with.

{% include github-project url="https://github.com/thombergs/code-examples/blob/master/patterns/src/test/java/io/reflectoring/objectmother/ObjectMotherClient.java" %}

## What do we Need a Test Data Factory For?

Let's imagine that we want to create some tests around `Invoice` objects that are structured as shown in the figure below.

![Invoice UML](/assets/images/posts/tips/objectmother-fluent-builder/invoice.jpg)

An `Invoice` has a target `Address` and zero or more `InvoiceItems`,
each containing the amount and price of a certain product that is billed with the invoice.

Now, we want to test our invoice handling business logic with a couple of test cases:

1. a test verifying that invoices with an abroad invoice address are sent to an invoicing service specialized on 
  foreign invoicing
2. a test verifying that a missing house number in an invoice address leads to a validation error
3. a test verifying that an invoice with a negative total price is forwarded to a refund service

**For each of these test cases, we obviously need an `Invoice` object in a certain state**: 

1. an invoice with an address in another country,
2. an invoice with an address with a missing house number, 
3. and an invoice with a negative total price.

How are we going to create these `Invoice` instances? 

Of course, we can go ahead an create the needed `Invoice` instance locally in each test case. But, alas, creating an `Invoice`
requires creating some `InvoiceItems` and an `Address`, too ... that seems like a lot of boiler plate code.

## Apply the Object Mother Pattern to Reduce Duplication

The example classes used in this article are rather simple. In the real world, classes like `Invoice`, `InvoiceItem` 
or `Address` can easily contain 20 or more fields each.

**Do we really want to have code that initializes such complex object graphs in multiple places of our test code base?**

Bad test code structure hinders the development of new features just as much as bad production code,
as Robert C. Martin's [Clean Architecture](//geni.us/oBgB) has once more brought to my attention 
(link points to Amazon; read my [book review](/review-clean-architecture/)).

So, **let's try to keep test code duplication to a minimum by applying the [Object Mother](https://martinfowler.com/bliki/ObjectMother.html) pattern**.

The Object Mother pattern is essentially a special case of the Factory pattern used for creating test objects.
It provides one or more factory methods that each create an object in a specific, meaningful configuration.

In a test, we can call one of those factory methods and work with the object created for us. 
If the pre-defined object returned by the Object Mother doesn't fully meet our test requirements, 
**we can go ahead and change some fields of that object locally** so that it meets the requirements of our test.

In our example, the Object Mother might provide these factory methods for pre-defined `Invoice` objects:

* `InvoiceMother.complete()`: creates a complete and valid `Invoice` object including sensibly configured `InvoiceItems` 
  and a valid `Address`
* `InvoiceMother.refund()`: creates a complete and valid `Invoice` object with a negative total price

For our three test cases, we can then use these factory methods:

1. To create an `Invoice` with an abroad address, we call `InvoiceMother.complete()` and change the `country` field of the address locally
2. To create an `Invoice` with a missing house number, we call `InvoiceMother.complete()` and remove the house number from the address locally
3. To create an `Invoice` with a negative total price, we simply call `InvoiceMother.refund()`

**The goal of the Object Mother pattern is not to provide a factory method for every single test requirement we might have** 
but instead to provide ways to create a few functionally meaningful versions of an object that can be easily adapted
within a concrete test.

Even with that goal in mind, **over time, an Object Mother might degrade to the code equivalent of a termite queen, birthing new objects for 
each and every use case we might have**. In every test case, we'd have a dependency to our Object Mother to create 
objects just right for the requirements at hand.

Each time we change one of our test cases, we would also have to change the factory method in our Object Mother.
**This violates the [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single_responsibility_principle)
since the Object Mother must be changed for a lot of different reasons**. 

We stated above that we want to keep our test code base clean, so how can we reduce the risk for violating the 
Single Responsibility Principle?

## Introduce the Fluent Builder Pattern to Promote the Single Responsibility Principle

That's where the [Builder](https://en.wikipedia.org/wiki/Builder_pattern) pattern comes into play.

A Builder is an object with methods that allow us to define the parameters for creating a certain object.
It also provides a factory method that creates an object from these parameters.

Instead of returning readily initialized objects, the factory methods of our Object Mother now return Builder objects 
that can be further modified by the client to meet the requirements of the specific use case.

The code for creating an Invoice with a modified address might look like this:

```java
Invoice.InvoiceBuilder invoiceBuilder = InvoiceMother.complete();
Address.AddressBuilder addressBuilder = AddressMother.abroad();
invoiceBuilder.address(addressBuilder.build());
Invoice invoice = invoiceBuilder.build();
```

So far, we haven't really won anything over the pure Object Mother approach described in the previous section. 
Our `InvoiceMother` now simply returns instances of `InvoiceBuilder` instead of directly returning `Invoice` objects.

Let's introduce a fluent interface to our Builder. A [fluent interface](https://martinfowler.com/bliki/FluentInterface.html)
is a programming style that allows to chain multiple method calls in a single statement and is perfectly suited
for the Builder pattern. 

The code from above can now be changed to make use of this fluent interface:

```java
Invoice invoice = InvoiceMother.complete()
  .address(AddressMother.abroad()
    .build())
  .build();
```

**But why should this reduce the chance for violating the Single Responsibility Principle in an Object Mother class?**

With a fluent API and an IDE that supports code completion, **we can let the API guide us in creating
the object we need**. 

Having this power at our fingertips we'll more likely configure the specific `Invoice`
we need in our test code and **we'll less likely create a new factory method in our Object Mother that is probably
only relevant four our current test**.

Thus, combining the Object Mother pattern with a fluent Builder **reduces the potential of violating the 
Single Responsibility Principle by making it easier to do the right thing**.

## May a Factory Method Call Another Factory Method?

When creating an Object Mother (or actually any other kind of factory), a question that often arises is: 
"May I call another factory method from the factory method I'm currently coding?".

My answer to this question is a typical "yes, but...".

Of course, we may take advantage of other existing Object Mothers. For instance, in the code of `InvoiceMother`,
we may happily call `AddressMother` and `InvoiceItemMother`:

```java
class InvoiceMother {

  static Invoice.InvoiceBuilder complete() {
    return Invoice.Builder()
        .id(42L)
        .address(AddressMother.complete()
          .build())
        .items(Collections.singletonList(
          InvoiceItemMother.complete()
        	    .build()));
  }
	
}
```

But the same rules apply as in our client test code.
**We don't want to add responsibilities to our factory method that don't belong there**. 

So, before creating a custom
factory method in an Object Mother we want to call from the factory method we're currently coding, let's think about
whether we should rather use one of the pre-defined factory methods and customize the returned builder via fluent API to
suit our requirements. 
 
## Conclusion

The Object Mother pattern by itself is a big help in quickly getting pre-defined objects
to use in tests.

By returning Builders with a fluent API instead of directly returning object instances, we add a lot of flexibility
to our test data generation, which makes creating new test objects for any given requirement a breeze. It supports the
Single Responsibility Principle by making it easy to adjust created objects locally.

## Further Reading

* [Clean Architecture](//geni.us/oBgB) by Robert C. Martin, chapter 28 about the quality of test code 
  (link points to Amazon)
* Martin Fowler on [Object Mother](https://martinfowler.com/bliki/ObjectMother.html)
* Object Mother at [java-design-patterns.com](http://java-design-patterns.com/patterns/object-mother/)
* TestDataBuilder at [wiki.c2.com](http://wiki.c2.com/?TestDataBuilder)

{% include github-project url="https://github.com/thombergs/code-examples/blob/master/patterns/src/test/java/io/reflectoring/objectmother/ObjectMotherClient.java" %}
