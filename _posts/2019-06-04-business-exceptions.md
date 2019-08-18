---
title: "5 Reasons Why Business Exceptions Are a Bad Idea"
categories: [java]
modified: 2019-06-04
excerpt: "An article discussing some reasons why you shouldn't work with exceptions when validating business rules."
image: 0011-chairs
---

I recently had a conversation about exception handling. I argued that business exceptions are 
a good thing because they clearly mark the possible failures of a business method. If a rule is violated,
the business method throws a "business" exception that the client has to handle. 
If it's a checked exception, the business rule is even made 
apparent in the method signature - at least the cases in which it fails.

My counterpart argued that failing business rules shouldn't be exceptions because of multiple
reasons. Having thought
about it a bit more, I came to the conclusion that he was right. And I came up with 
even more reasons than he enumerated during our discussion. 

Read on to find out what distinguishes a business exception from a technical exception 
and why technical exceptions are the only true exceptions.

## Technical Exceptions

Let's start with technical exceptions. These exceptions are thrown when
something goes wrong that we cannot fix and usually cannot respond to in any
sensible way. 

An example is Java's built-in `IllegalArgumentException`. If someone provides
an argument to a method that does not follow the contract of that method,
the method may throw an `IllegalArgumentException`. 

When we call a method and get an `IllegalArgumentException` thrown into
our face, what can we do about it? 

We can only fix the code.

It's a programming error. 
If the illegal argument value comes from a user, it should have been validated earlier
and an error message provided to the user. If the illegal argument comes from 
somewhere else in the code, we have to fix it there. In any case, someone screwed up
somewhere else.

A technical exception is usually derived from Java's `RuntimeException`,
meaning that it doesn't have to be declared in a method signature.

## Business Exceptions

Now, what's a business exception? 

A business exception is thrown when a business rule within our application is
violated:

```java
class Rocket {

  private int fuel;

  void takeOff() throws NotEnoughFuelException {
    if (this.fuel < 50) {
      throw new NotEnoughFuelException();
    }
    lockDoors();
    igniteThrusters();
  }
  
}
``` 

In this example, the `Rocket` only takes off if it has enough fuel. 
If it doesn't have enough fuel, it throws an exception with the very imaginative name 
of `NotEnoughFuelException`.

It's up to the client of the above code to make sure that the business rule
(providing at least 50 units of fuel before takeoff) is satisfied. 
If the business rule is violated, the client 
has to to handle the exception (for example by filling the fuel tank and then
trying again).

Now that we're on the same page about technical and business 
exceptions, let's look at the reasons why business exceptions are a bad idea. 

## #1: Exceptions Should not be an Expected Outcome

First of all, just by looking at the meaning of the word "exception",
we'll see that a business exception as defined above isn't actually an exception.

Let's look at some definitions of the word "exception":

> A person or thing that is excluded from a general statement or does not follow a rule
> ([Oxford Dictionary](https://en.oxforddictionaries.com/definition/exception)).

> An instance or case not conforming to the general rule ([dictionary.com](https://www.dictionary.com/browse/exception)).

> Someone or something that is not included in a rule, group, or 
> list or that does not behave in the expected way ([Cambridge Dictionary](https://dictionary.cambridge.org/dictionary/english/exception)).

All three definitions say that an exception is something that *does not follow a 
rule* which makes it **unexpected**.

Coming back to our example, you could say that we have used the `NotEnoughFuelException` as an 
exception to the rule
"fuel tanks must contain at least 50 units of fuel". I say, however, that we have used
the `NotEnoughFuelException` *to define* the (inverted) rule "fuel tanks must not contain
less than 50 units of fuel".

After all, we have added the exception to the signature of the `takeOff()` method. What is
that if not defining some sort of expected outcome that's relevant for the client code to know about?  

To sum up, exceptions should be exceptions. **Exceptions should not be an expected outcome**. 
Otherwise we defy the english language.

## #2: Exceptions are Expensive

What should the client code do if it encounters a `NotEnoughFuelException`? 

Probably, it will fill the fuel tanks and try again:

```java
class FlightControl {

  void start(){
    Rocket rocket = new Rocket();
    try {
      rocket.takeOff();
    } catch (NotEnoughFuelException e) {
      rocket.fillTanks();
      rocket.takeOff();
    }
  }
  
}
```

As soon as the client code reacts to an exception by executing a different 
branch of business code, we have misused the concept of exceptions for flow control.

Using try/catch for flow control creates code that is 

* **expensive to understand** (because we need more time to understand it), and
* **expensive to execute** (because the JVM has to create a stacktrace for the 
  catch block).

And, unlike in fashion, expensive is usually bad in software engineering.

<div class="notice success">
  <h4>Exceptions without Stacktraces?</h4>
  <p>
    In a comment I was made aware that Java's exception constructors allow passing
    in a parameter <code>writableStackTrace</code> that, when set to <code>false</code>,
    will cause the exception not to create a stacktrace, thus reducing the performance
    overhead. Use at your own peril.  
  </p>
</div> 

## #3: Exceptions Hinder Reusability

The `takeOff()` method, as implemented above, will *always* check for fuel before igniting the
thrusters. 

Imagine that the funding for the space program has been reduced and we can't afford to fill the
fuel tanks anymore. We have to cut corners and start the rocket with less fuel (I hope
it doesn't work that way, but at least in the software industry this seems to be common
practice).

Our business rule has just changed. How do we change the code to reflect this? 
We want to be able to still execute the fuel check, so we don't have to change a lot of code
once the funding returns.

So, we could add a parameter to the method so that the `NotEnoughFuelException` is thrown
conditionally: 

```java
class Rocket {

  private int fuel;

  void takeOff(boolean checkFuel) throws NotEnoughFuelException {
    if (checkFuel && this.fuel < 50) {
      throw new NotEnoughFuelException();
    }
    
    lockDoors();
    igniteThrusters();
  }
  
}
``` 

Ugly, isn't it? And the client code still has to handle the `NotEnoughFuelException`
even if it passes `false` into the `takeOff()` method. 

**Using an exception for a business rule prohibits reusability in contexts where the
business rule should not be validated**. And workarounds like the one 
above are ugly and expensive to read.

## #4: Exceptions May Interfere with Transactions

If you have ever worked with Java's or Spring's `@Transactional` annotation to
demarcate transaction boundaries, you will probably have thought about how
exceptions affect transaction behavior. 

To sum up the way Spring handles exceptions: 

* If a *runtime exception* bubbles out of a method that is annotated with `@Transactional`,
  the transaction is marked for rollback.
* If a *checked exception* bubbles out of a method that is annotated with `@Transactional`,
  the transaction is *not* marked for rollback (= nothing happens).
  
The reasoning behind this is that **a checked exception is a valid return value of the method** 
(which makes a checked exception an expected outcome) while a runtime exception is unexpected.

Let's assume the `Rocket` class has a `@Transactional` annotation.

Because our `NotEnoughFuelException` is a checked exception, our try/catch from above
would work as expected, without rolling back the current transaction. 

If `NotEnoughFuelException` was a runtime exception instead, we could still try to handle
the exception like above, only to run into a `TransactionRolledBackException` or a similar 
exception as soon as the transaction commits.

Since the transaction
handling code is hidden away behind a simple `@Transactional` annotation, **we're not really
aware of the impact of our exceptions**. Imagine someone refactoring a checked exception
to a runtime exception. Every time this exception now occurs, the transaction will be rolled
back where it wasn't before. Dangerous, isn't it?  

## #5: Exceptions Evoke Fear

Finally, using exceptions to mark failing business rules invokes fear in 
developers that are trying to understand the codebase, especially if they're new to
the project. 

After all, each exception marks something that can go wrong, doesn't it? There are
so many exceptions to have in mind when working with the code, and we have
to handle them all! 

This tends to make developers very cautious (in the negative sense of the word).
Where they would otherwise feel free to refactor code, they will feel restrained
instead. 

How would you feel looking at an unknown codebase that's riddled with exceptions
and try/catch blocks, knowing you have to work with that code for the next couple years? 

## What to Do Instead of Business Exceptions?

The alternative to using business exceptions is pretty simple. Just use plain code 
to validate your business rules instead of exceptions:

```java
class Rocket {

  private int fuel;

  void takeOff() {
    lockDoors();
    igniteThrusters();
  }
  
  boolean hasEnoughFuelForTakeOff(){
    return this.fuel >= 50;
  }
  
}
```

```java
class FlightControl {

  void startWithFuelCheck(){
    Rocket rocket = new Rocket();
    
    if(!rocket.hasEnoughFuel()){
      rocket.fillTanks();
    }
    
    rocket.takeOff();
  }
  
  void startWithoutFuelCheck(){
    Rocket rocket = new Rocket();
    rocket.takeOff();
  }
  
}
```

Instead of forcing each client to handle a `NotEnoughFuelException`, we let the client
check if there is enough fuel available. With this simple change, we have achieved the following:

* If we stumble upon an exception, it really is an exception,
  as the expected control flow doesn't throw an exception at all ([#1](#1-exceptions-should-not-be-an-expected-outcome)).
* We have used normal code for normal control flow which is much better readable than
  try/catch blocks ([#2](#2-exceptions-are-expensive)).
* The `takeOff()` method is reusable in different contexts, like taking off with
  less than optimal fuel ([#3](#3-exceptions-hinder-reusability)).
* We have no exception that might or might not interfere with any database transactions ([#4](#4-exceptions-may-interfere-with-transactions)).
* We have no exception that evokes fear in the new guy that just joined the team ([#5](#5-exceptions-evoke-fear)).

You might notice that this solution moves the responsibility of checking 
for business rules one layer up,
from the `Rocket` class to the `FlightControl` class. This might feel like
we're giving up control of our business rules, since the clients of the 
`Rocket` class now have to check for the business rules themselves. 

You might notice, too, however, that the business rule itself is still
in the `Rocket` class, within the `hasEnoughFuel()` method. The client
only has to invoke the business rule, not know about the internals.

Yes, we have moved a responsibility away from our domain object. But we have gained
a lot of flexibility, readability, and understandability on the way.

## Conclusion

Using exceptions, both checked and unchecked, for marking failed business rules
makes code less readable and flexible due to several reasons. 

By moving the invocation of business rules out of a domain object and into a use case,
we can avoid having to throw an exception in the case a business rule fails. The use
case decides if the business rule should be validated or not, since there might
be valid reasons not to validate a certain rule.

What are your reasons to use / not to use business exceptions?
