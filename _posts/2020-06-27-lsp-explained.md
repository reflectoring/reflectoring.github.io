---
title: The Liskov Substitution Principle Explained
categories: [craft]
date: 2020-06-27 05:00:00 +1100
modified: 2020-06-27 05:00:00 +1100
author: saajan
excerpt: "The Liskov Substitution Principle is a very useful idea both when developing new applications and modifying existing ones. This article explains what it is, why it's important and how to use it."
image:
  auto: 0071-disk
---

This article gives a quick intro to the Liskov Substitution Principle (LSP), why it's important, and how to use it to validate object-oriented designs. We'll also see some examples and learn how to correctly identify and fix violations of the LSP.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/solid/lsp" %}

## What is LSP?

At a high level, **the LSP states that in an object-oriented program, if we substitute a superclass object reference with an object of *any* of its subclasses, the program should not break.** 

Say we had a method that used a superclass object reference to do something:

```java
class SomeClass {
  
  void aMethod(SuperClass superClassReference) {
    doSomething(superClassReference);
  }
  
  // definition of doSomething() omitted
}
```

This should work as expected for *every possible subclass object of `SuperClass` that is passed to it*. If substituting a superclass object with a subclass object changes the program behavior in unexpected ways, the LSP is violated.

The LSP is applicable when there's a supertype-subtype inheritance relationship by either extending a class or implementing an interface. **We can think of the methods defined in the supertype as defining a contract. Every subtype is expected to stick to this contract. If a subclass does not adhere to the superclass's contract, it's violating the LSP.**

This makes sense intuitively - a class's contract tells its clients what to expect. If a subclass extends or overrides the behavior of the superclass in unintended ways, it would break the clients.

**How can a method in a subclass break a superclass method's contract?** There are several possible ways:

1. Returning an object that's incompatible with the object returned by the superclass method.
2. Throwing a new exception that's not thrown by the superclass method.
3. Changing the semantics or introducing side effects that are not part of the superclass's contract.

Java and other statically-typed languages prevent 1 (unless we use very generic classes like `Object`) and 2 (for checked exceptions) by flagging them at compile-time. It's still possible to violate LSP in these languages via the third way.

## Why is the LSP Important?

**LSP violations are a design smell. We may have generalized a concept prematurely and created a superclass where none is needed.** Future requirements for the concept might not fit the class hierarchy we have created. 

If client code cannot substitute a superclass reference with a subclass object freely, it would be forced to do `instanceof` checks and specially handle some subclasses. If this kind of conditional code is spread across the codebase, it will be difficult to maintain. 

**Every time we add or modify a subclass, we would have to comb through the codebase and change multiple places**. This is difficult and error-prone. 

**It also defeats the purpose of introducing the supertype abstraction in the first place** which is to make it easy to enhance the program.

It may not even be possible to identify all the places and change them - we may not own or control the client code. We could be developing our functionality as a library and providing them to external users, for example. 

## Violating the LSP - An Example

Suppose we were building the payment module for our eCommerce website. Customers order products on the site and pay using payment instruments like a credit card or a debit card. 

When a customer provides their card details, we want to 

* validate it, 
* run it through a third-party fraud detection system,  
* and then send the details to a payment gateway for processing. 

While some basic validations are required on all cards, there are additional validations needed on credit cards. Once the payment is done, we record it in our database. Because of various security and regulatory reasons, we don't store the actual card details in our database, but a fingerprint identifier for it that's returned by the payment gateway.

Given these requirements, we might model our classes as below:

```java
class PaymentInstrument {
  String name;
  String cardNumber;
  String verificationCode;
  Date expiryDate;
  String fingerprint;

  void validate() throws PaymentInstrumentInvalidException {
    // basic validation on name, expiryDate etc.
    if (name == null || name.isEmpty()) {
      throw new PaymentInstrumentInvalidException("Name is invalid");
    }
    // other validations
  }

  void runFraudChecks() throws FraudDetectedException {
    // run checks against a third-party system
  }

  void sendToPaymentGateway() throws PaymentFailedException {
    // send details to payment gateway (PG) and set fingerprint from PG response
  }  
}
```

```java
class CreditCard extends PaymentInstrument {

  @Override
  void validate() throws PaymentInstrumentInvalidException {
  super.validate();
  // additional validations for credit cards
  }  
  // other credit card-specific code
}
```

```java
class DebitCard extends PaymentInstrument { 
  // debit card-specific code
}
```

A different area in our codebase where we process a payment might look something like this:

```java
class PaymentProcessor {
  void process(OrderDetails orderDetails, PaymentInstrument paymentInstrument) {
    try {
      paymentInstrument.validate();
      paymentInstrument.runFraudChecks();
      paymentInstrument.sendToPaymentGateway();
      saveToDatabase(orderDetails, paymentInstrument);
    } catch (...){
        // exception handling
    }
  }

  void saveToDatabase(OrderDetails orderDetails, PaymentInstrument paymentInstrument) {
    String fingerprint = paymentInstrument.getFingerprint();
    // save fingerprint and order details in DB
  }
}
```

Of course, in an actual production system, there would be many complex aspects to handle. The single processor class above might well be a bunch of classes in multiple packages across service and repository layers.

All is well and our system is processing payments as expected. At some point, the marketing team decides to introduce reward points to increase customer loyalty. Customers get a small number of reward points for each purchase. They can use the points to buy products on the site. 

Ideally, we should be able to just add a `RewardsCard` class that extends `PaymentInstrument` and be done with it. But we find that adding it violates LSP! 

There are no fraud checks for Rewards Cards. Details are not sent to payment gateways and there is no concept of a fingerprint identifier. `PaymentProcessor` breaks as soon as we add `RewardsCard`.

**We might try force-fitting `RewardsCard` into the current class hierarchy by overriding `runFraudChecks()` and `sendToPaymentGateway()` with empty, do-nothing implementations**. 

This would still break the application - we might get a `NullPointerException` from the `saveToDatabase()` method since the fingerprint would be `null`. Can we handle it just this once as a special case in `saveToDatabase()` by doing an `instanceof` check on the `PaymentInstrument` argument? 

But we know that if we do it once, we'll do it again. Soon our codebase will be strewn with multiple checks and special cases to handle the problems created by the incorrect class model. We can imagine the pain this will cause each time we enhance the payment module. 

For example, what if the business decides to accept Bitcoins? Or marketing introduces a new payment mode like Cash on Delivery?

## Fixing the Design

Let's revisit the design and **create supertype abstractions only if they are general enough to create code that is flexible to requirement changes**. We will also use the following object-oriented design principles:

1. Program to interface, not implementation
2. Encapsulate what varies
3. Prefer composition over inheritance

To start with, what we can be sure of is that our application needs to collect payment - both at present and in the future. It's also reasonable to think that we would want to validate whatever payment details we collect. Almost everything else could change. So let's define the below interfaces:

```java
interface IPaymentInstrument  {
  void validate() throws PaymentInstrumentInvalidException;
  PaymentResponse collectPayment() throws PaymentFailedException;
}
```

```java
class PaymentResponse {
  String identifier;
}
```

`PaymentResponse` encapsulates an `identifier` - this could be the fingerprint for credit and debit cards or the card number for rewards cards. It could be something else for a different payment instrument in the future. The encapsulation ensures `IPaymentInstrument` can remain unchanged if future payment instruments have more data.

`PaymentProcessor` class now looks like this:

```java
class PaymentProcessor {
  void process(OrderDetails orderDetails, IPaymentInstrument paymentInstrument) {
    try {
      paymentInstrument.validate();
      PaymentResponse response = paymentInstrument.collectPayment();
      saveToDatabase(orderDetails, response.getIdentifier());
    } catch (...) {
      // exception handling
    }
  }

  void saveToDatabase(OrderDetails orderDetails, String identifier) {
    // save the identifier and order details in DB
  }
}
```

There are no `runFraudChecks()` and  `sendToPaymentGateway()` calls in `PaymentProcessor` anymore - **these are not general enough to apply to all payment instruments**.

Let's add a few more interfaces for other concepts which seem general enough in our problem domain:

```java
interface IFraudChecker {
  void runChecks() throws FraudDetectedException;
}
```

```java
interface IPaymentGatewayHandler {
  PaymentGatewayResponse handlePayment() throws PaymentFailedException;
}
```

```java
interface IPaymentInstrumentValidator {
  void validate() throws PaymentInstrumentInvalidException;
}
```

```java
class PaymentGatewayResponse {
  String fingerprint;
}
```

And here are the implementations:

```java
class ThirdPartyFraudChecker implements IFraudChecker {
  // members omitted
  
  @Override
  void runChecks() throws FraudDetectedException {
    // external system call omitted
  }
}
```

```java
class PaymentGatewayHandler implements IPaymentGatewayHandler {
  // members omitted
  
  @Override
  PaymentGatewayResponse handlePayment() throws PaymentFailedException {
    // send details to payment gateway (PG), set the fingerprint
    // received from PG on a PaymentGatewayResponse and return
  }
}
```

```java
class BankCardBasicValidator implements IPaymentInstrumentValidator {
  // members like name, cardNumber etc. omitted

  @Override
  void validate() throws PaymentInstrumentInvalidException {
    // basic validation on name, expiryDate etc.
    if (name == null || name.isEmpty()) {
      throw new PaymentInstrumentInvalidException("Name is invalid");
    }
    // other basic validations
  }
}
```

Let's build `CreditCard` and `DebitCard` abstractions by **composing the above building blocks in different ways**. We first define a class that implements `IPaymentInstrument` :

```java
class BaseBankCard implements IPaymentInstrument {
  // members like name, cardNumber etc. omitted
  // below dependencies will be injected at runtime
  IPaymentInstrumentValidator basicValidator;
  IFraudChecker fraudChecker;
  IPaymentGatewayHandler gatewayHandler;

  @Override
  void validate() throws PaymentInstrumentInvalidException {
    basicValidator.validate();
  }

  @Override
  PaymentResponse collectPayment() throws PaymentFailedException {
    PaymentResponse response = new PaymentResponse();
    try {
      fraudChecker.runChecks();
      PaymentGatewayResponse pgResponse = gatewayHandler.handlePayment();
      response.setIdentifier(pgResponse.getFingerprint());
    } catch (FraudDetectedException e) {
      // exception handling
    }
    return response;
  }
}
```

```java
class CreditCard extends BaseBankCard {
  // constructor omitted
  
  @Override
  void validate() throws PaymentInstrumentInvalidException {
    basicValidator.validate();
    // additional validations for credit cards
  }
}
```

```java
class DebitCard extends BaseBankCard {
  // constructor omitted
}
```

Though `CreditCard` and `DebitCard` extend a class, it's not the same as before. Other areas of our codebase now depend only on the `IPaymentInstrument` interface, not on `BaseBankCard`. Below snippet shows `CreditCard` object creation and processing:

```java
IPaymentGatewayHandler gatewayHandler = 
  new PaymentGatewayHandler(name, cardNum, code, expiryDate);

IPaymentInstrumentValidator validator = 
  new BankCardBasicValidator(name, cardNum, code, expiryDate);

IFraudChecker fraudChecker = 
  new ThirdPartyFraudChecker(name, cardNum, code, expiryDate);

CreditCard card = 
  new CreditCard(
    name,
    cardNum,
    code,
    expiryDate,
    validator,
    fraudChecker,
    gatewayHandler);

paymentProcessor.process(order, card);
```

**Our design is now flexible enough to let us add a `RewardsCard`** - no force-fitting and no conditional checks. We just add the new class and it works as expected.

```java
class RewardsCard implements IPaymentInstrument {
  String name;
  String cardNumber;

  @Override
  void validate() throws PaymentInstrumentInvalidException {
    // Rewards card related validations
  }

  @Override
  PaymentResponse collectPayment() throws PaymentFailedException {
    PaymentResponse response = new PaymentResponse();
    // Steps related to rewards card payment like getting current rewards balance,
    // updating balance etc.
    response.setIdentifier(cardNumber);
    return response;
  }
}
```

And here's client code using the new card:

```
RewardsCard card = new RewardsCard(name, cardNum);
paymentProcessor.process(order, card);
```

## Advantages of The New Design

The new design not only fixes LSP violation but also gives us a loosely-coupled, flexible set of classes to handle changing requirements. For example, adding new payment instruments like Bitcoin and Cash on Delivery is easy - we just add new classes that implement `IPaymentInstrument`.

Business needs debit cards to be processed by a different payment gateway? No problem - we add a new class that implements `IPaymentGatewayHandler` and inject it into `DebitCard`. If `DebitCard`'s requirements begin to diverge a lot from `CreditCard`'s, we can have it implement `IPaymentInstrument` directly instead of extending `BaseBankCard` - no other class is impacted.

If we need an in-house fraud check for `RewardsCard`, we add an `InhouseFraudChecker` that implements `IFraudChecker`, inject it into `RewardsCard` and only change `RewardsCard.collectPayment()`.

## How to Identify LSP Violations?

Some good indicators to identify LSP violations are:

1. Conditional logic (using the `instanceof` operator or `object.getClass().getName()` to identify the actual subclass) in client code 
2. Empty, do-nothing implementations of one or more methods in subclasses 
3. Throwing an `UnsupportedOperationException` or some other unexpected exception from a subclass method 

For point 3 above, the exception needs to be unexpected from the superclass's contract perspective. So, **if our superclass method's signature explicitly specified that subclasses or implementations could throw an `UnsupportedOperationException`, then we would not consider it as an LSP violation.**

Consider `java.util.List<E>` interface's `add(E e)` method. Since `java.util.Arrays.asList(T ...)` returns an unmodifiable list, client code which adds an element to a `List` would break if it were passed a `List` returned by `Arrays.asList`. 

Is this an LSP violation? No - the `List.add(E e)` method's contract says implementations may throw an `UnsupportedOperationException`. Clients are expected to handle this when using the method.

## Conclusion

The LSP is a very useful idea to keep in mind both when developing a new application and when enhancing or modifying an existing one. 

When designing the class hierarchy for a new application, **the LSP helps make sure that we are not prematurely generalizing concepts in our problem domain.** 

When enhancing an existing application by adding or changing a subclass, being mindful of **LSP helps ensure that our changes are in line with the superclass's contract and that the client code's expectations continue to be met**.

You can play around with a complete application illustrating these ideas using the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/solid/lsp). 

## References

**A keynote address in which Liskov first formulated the principle:** [Liskov, B.](https://en.wikipedia.org/wiki/Barbara_Liskov) (May 1988). ["Keynote address - data abstraction and hierarchy"](https://doi.org/10.1145%2F62139.62141). *ACM SIGPLAN Notices*. **23** (5): 17–34.