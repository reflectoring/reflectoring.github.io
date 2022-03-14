---
authors: [tom]
title: "Robust Java Object Mapping With Minimal Testing Overhead Using reMap"
categories: ["Java"]
date: 2017-10-01
description: "An intro to the reMap Java mapping library that has a focus on minimal testing overhead."
image: images/stock/0041-adapter-1200x628-branded.jpg
url: autotmatic-refactoring-safe-java-mapping
---



Object mapping is a necessary and often unloved evil in software development projects. 
To communicate between layers of your application, you have to create and test mappers between
a multitude of types, which can be a very cumbersome task, depending on the mapper library
that is used. This article introduces [reMap](https://github.com/remondis-it/remap), 
yet another Java object mapper that has a unique focus on robustness and minimal testing overhead.

## Specifying a Mapper

Rather than creating a mapper via XML or annotations as in some other mapping libraries, with reMap you create 
a mapper by writing a few
good old lines of code. The following mapper maps all fields from a `Customer` object to a 
`Person` object.

```java
Mapper<Customer, Person> mapper = Mapping
    .from(Customer.class)
    .to(Person.class)
    .mapper();
```

However, the above mapper specification expects `Customer` and `Person` to have *exactly the same fields with the
same names and the same types*. Otherwise, calling `mapper()` will throw an exception.

Here, we already come across a main philosophy of reMap:

> In your specification of a mapper, **all fields that are different in the source
and destination classes have to be specified**. 

Identical fields in the source and destination
classes are automatically mapped and thus specified implicitly. Different fields have to be specified
explicitly as described in the following sections. The reasoning behind this is simply robustness as 
discussed in more detail [below](#robustness).

Once you have a mapper instance, you can map a `Customer` object into a `Person` object by simply calling the `map()`
method:

```java
Customer customer = ...
Person person = mapper.map(customer);
```

### Omitting fields

Say `Customer` has the field `address` and `Person` does not. Vice versa, `Person` has a field `birthDate`
that is missing in `Customer`.
 
In order to create a valid mapper for this scenario, you need to tell reMap to omit those fields:

```java
Mapper<Customer, Person> mapper = Mapping
    .from(Customer.class)
    .to(Person.class)
    .omitInSource(Customer::getAddress)
    .omitInDestination(Person::getBirthDate)
    .mapper();
```

Note that instead of referencing fields with Strings containing the field names, you use references of
the corresponding getter methods instead. This makes the mapping code very readable and refactoring-safe.

Also note that this feature comes at the "cost" that mapped classes have to follow the Java Bean conventions, 
i.e. they must have a default constructor and a getter and setter for all fields. 

Why do I have to specify fields that should be omitted? Why doesn't reMap just skip those fields? The 
simple reason for this is [robustness](#robustness) again. I don't want to let a library outside of my control decide which
fields to map and which not. I want to explicitly specify what to map from here to there. Only then 
can I be sure that things are mapped according to my expectations at runtime.

### Mapping fields with different names

Source and target objects often have fields that have the same meaning but a different name. By using 
the `reassign` specification, we can tell reMap to map one field into another field of the same type. In this 
example, `Customer` has a field `familyName` that is mapped to the `name` field in `Person`. Both fields are
of the same type `String`.

```java
Mapper<Customer, Person> mapper = Mapping
    .from(Customer.class)
    .to(Person.class)
    .reassign(Customer:getFamilyName)
      .to(Person::getName)
    .mapper();
```
 
### Mapping fields with different types

What if I need to convert a field to another type? Say `Customer` has a field `registrationDate`
of type `Calendar` that should be mapped to the field `regDate` of type `Date` in `Person`?

```java
private Mapper<Customer, Person> createMapper(){ 
 return Mapping
    .from(Customer.class)
    .to(Person.class)
    .replace(Customer::getRegistrationDate, Person::regDate)
      .with(calendarToDate())
    .mapper();
}

private Transform<Date, Calendar> calendarToDate() {
    return source -> {
      if(source == null){
        return null;
      }
      return source.getTime();
    };
  }
```
 
By implementing a `Transform` function that converts one type to another, we can use the `replace`
specification to convert a field value.
 
### Nested Mapping

Another often-required feature of a mapper is nested mapping. Let's say our `Customer` class has a field
of type `CustomerAddress` and our `Person` class has a field of type `PersonAddress`. First, we create
a mapper to map `CustomerAddress` to `PersonAddress`. Then we tell our Customer-to-Person mapper to
use this address mapper when it comes across fields of type `CustomerAddress` by calling `useMapper()`:

```java
Mapper<CustomerAddress, PersonAddress> addressMapper = 
  Mapping
    .from(CustomerAddress.class)
    .to(PersonAddress.class)
    .mapper();

Mapper<Customer, Person> mapper = Mapping
    .from(Customer.class)
    .to(Person.class)
    .useMapper(addressMapper)
    .mapper();
```

## Key Philosophies 

reMap has some more features that can best be looked up in the project's [documentation](https://github.com/remondis-it/remap).
However, I would like to point out some "meta-features" that make out the philosophy behind the development of reMap.

### Robustness

A main goal of reMap is to create robust mappers. That means that a mapper must be refactoring-safe. A mapper must
not break if a field name changes. This is why
getter method references are used to specify fields instead of simple Strings. 

A nice effect of this is that the
compiler already checks most of your mapping specification. It won't allow you to specify a `reassign()`
for fields of a different type, for example. Another nice effect is that the compiler will tell you if you broke
a mapper by changing the type of a field. 

But a mapper can be broken even if the compiler has nothing to fret about. For example, you might have overlooked a
field when specifying the mapper. This is why each mapper is validated at the earliest possible moment during runtime, 
which is when calling the `mapper()` factory method.

### Testing

This leads us to testing. A major goal of reMap is to reduce testing effort to a minimum. Mapping is a tedious task,
so we don't want to add another tedious task by creating unit tests that manually check if each field was mapped
correctly. Due to the rather brainless nature of this work, those unit tests are very error prone 
(in my experience, at least).

Since all validation of a mapper is done by the compiler and the `mapper()` factory method, all you have to do 
to test a mapper is to create an instance of the mapper using the `mapper()` method. If this produces
an exception (for example when you overlooked a field or a type conversion) the test will fail.

If you want to create a fixture for regression testing, reMap supports asserting a mapper by creating an
`AssertMapping` like this:

```java
AssertMapping.of(mapper)
    .expectOmitInSource(Customer::getAddress)
    .expectOmitInDestination(Person::getBirthDate)
    // ... other expectations
    .ensure();
```

Calling `ensure()` will throw an `AssertionError` if the `AssertMapping` does not match the specification of the
mapper. Having a unit test with such an assertion in place, you will notice if the specification of the mapper
does not match your expectations. This also allows test-driven development of a mapper.

Note that if you created a custom `Transform` function as described [above](#mapping-fields-with-different-types)
you should include an explicit test for this transformation in your test suite, since it cannot be validated
automatically by reMap.

### Performance

Performance was actually not a goal at all when developing reMap. Robustness and minimal test effort were valued much higher. 
However, reMap seems to be faster than some other popular mappers like [Dozer](https://github.com/DozerMapper/dozer) and 
[ModelMapper](http://modelmapper.org/). 
The following performance test results were created on my local machine with a 
[testing framework](https://github.com/frank-rahn/performance) created by Frank Rahn for his 
[mapper comparison blog post](https://www.frank-rahn.de/java-bean-mapper/) (beware of German language!).
 
| Mapper | Average Mapping Time (ms) |
|--------|---------------------------|
|JMapper      | 0,01248 |
|ByHand       | 0,01665 |
|MapStruct    | 0,21591 |
|Orika        | 0,37756 |
|Selma        | 0,44576 |
|reMap        | 2,56231 |
|ModelMapper  | 4,71332 |
|Dozer        | 6,12523 |

## Summary

[reMap](https://github.com/remondis-it/remap) is yet another object mapper for Java but has a different philosophy
from most of the other mappers out there. It values robustness above all else and minimal testing overhead a strong second.
reMap is not the fastest mapper but plays in league of some of the other popular mappers performance-wise. 

reMap is very young yet, and probably not feature-complete, so
we'd love to hear your feedback and work out any bugs you might find and discuss any features you might
miss. Simply drop us an issue on [Github](https://github.com/remondis-it/remap).
