---
title: The Liskov Substitution Principle Explained
categories: [craft]
date: 2020-06-27 05:00:00 +1100
modified: 2020-06-27 05:00:00 +1100
author: saajan
excerpt: "LSP is a very useful idea both when developing new applications and modifying existing ones. This article explains what it is, why it's important and how to use it."
image:
  auto: 0071-disk
---

This article gives a quick intro to the Liskov Substitution Principle (LSP), why it's important, and how we can use it to validate our object-oriented designs. We'll also see some examples and learn how to correctly identify violations of LSP.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/solid" %}

## What is LSP?

In simple terms, **LSP states that in an object-oriented program, if we substitute a superclass object reference with an object of *any* of its subclasses, the program should not break.** 

Essentially, if we had a method that used a superclass object reference to do something in some class, like below:

```java
public class SomeClass {
    void aMethod(SuperClass superClassReference) {
        doSomething(superClassReference);
    }
  
    // defintion of doSomething() omitted
}
```

this should work as expected for *every* possible `subclassObject` that is passed to it. If substituting a superclass object with a subclass object changes the application behavior in unexpected ways, we can say that LSP is violated.

LSP is applicable when there's a supertype-subtype inheritance relationship either by extending a class or by implementing an interface. **We can think of the methods defined in the supertype as defining a contract. Every subtype is expected to stick to this contract. If a subclass does not adhere to the superclass's contract, it is a violation of LSP.**

This makes sense intuitively - a class's contract tells its clients what to expect. If a subclass extends or overrides the behavior of the superclass in unintended ways, it would break the clients.

**How can a method in a subclass break a superclass method's contract?** Below are three possible ways:

1. Returning an object that is incompatible with the object returned by the superclass method
2. Throwing a new exception that is not thrown by the superclass method
3. **Changing the semantics or introducing side effects that are not part of the superclass's contract**

Statically-typed languages like Java prevent 1 and 2 (for checked exceptions) by flagging them at compile-time. It is still possible to violate LSP in these languages via the third way above.

## Importance of LSP

**LSP violation is a design smell. We may have generalized a concept prematurely and created a superclass.** There may be other possibilities for the concept which don't fit the class hierarchy we have created. 

If client code cannot substitute a superclass reference with a subclass object freely, it would be forced to do `instanceof` checks and specially handle some subclasses. If this kind of conditional code is spread across the codebase, it will be difficult to maintain. 

**Every time we add or modify a subclass, we would have to comb through the codebase and change multiple places. This is difficult and error-prone.** **It also defeats the purpose of introducing the supertype abstraction in the first place** which is to make it easy to enhance the program.

It may not even be possible to identify and change all the places - we may not own or control the client code. We could be developing our functionality as a library and providing them to external users, for example. 

## Example

Suppose we were building the payment module for our eCommerce website. Customers order products on our website and pay using payment instruments like a credit card or a debit card. 

When a customer provides their card details, let's say we want to validate it, run it through a third-party fraud detection system,  and then send the details to a payment gateway for processing. While some basic validations are required on all cards, there are additional validations needed on credit cards. Once the payment is done, we record it in our database. Because of various security and regulatory reasons, we don't store the actual card details in our database, but a fingerprint identifier for it that's returned to us by the payment gateway.

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
    // send details to payment gateway (PG) and save the fingerprint
    // received from PG
    this.fingerprint = UUID.randomUUID().toString();
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

A different area in our codebase where we process a payment might look something like below:

```java
class PaymentProcessor {
  void process(OrderDetails orderDetails, PaymentInstrument paymentInstrument) {
    try {
      paymentInstrument.validate();
      paymentInstrument.runFraudChecks();
      paymentInstrument.sendToPaymentGateway();
      saveToDatabase(orderDetails, paymentInstrument);
    } catch (PaymentInstrumentInvalidException e) {
      e.printStackTrace();
    } catch (FraudDetectedException e) {
      e.printStackTrace();
    } catch (PaymentFailedException e) {
      e.printStackTrace();
    }
  }

  void saveToDatabase(OrderDetails orderDetails, PaymentInstrument paymentInstrument) {
    String fingerprint = paymentInstrument.getFingerprint();
    // save fingerprint and order details in DB
  }
}
```

Of course, in an actual production system, there would be many complex aspects to handle. The single processor class above might well be a bunch of classes in multiple packages across service and repository layers.

All is well and our system is processing payments as expected. At some point as the business grows, the marketing team decides to introduce reward points to increase customer loyalty. Customers get a small number of reward points on each purchase. They can use the points to buy products on the website. Now there's a business need to support Rewards Card as a payment instrument in our payment system.

Since Rewards Card is just another type of payment instrument, ideally we should be able to just add a `RewardsCard` class that extends `PaymentInstrument` and be done with it. But we find that adding it violates LSP! 

There are no fraud checks against third-party systems for Rewards Cards. Details are not sent to payment gateways and there is no concept of fingerprint identifier for a Rewards Card. `PaymentProcessor` breaks as soon as we add `RewardsCard`.

To continue using our current class hierarchy, we might end up force-fitting this new class by overriding and providing empty, do-nothing implementations for `runFraudChecks()` and `sendToPaymentGateway()`. 

This would still break the application - we would get a `NullPointerException` from the repository layer `saveToDatabase` method since the fingerprint would be `null`. We might be able to handle this just this one time as a special case in `saveToDatabase` by doing an `instanceof` check on the `PaymentInstrument` argument. But we know that it will never be this one time and it will never be this one place. 

Soon our payment module codebase will be strewn with multiple checks and special cases to handle the problems created by the incorrect class model. We can imagine the pain this will cause each time we want to enhance the payment module. 

For example, what if the business decides to accept bitcoins or some other cryptocurrency tomorrow? Or what if a new payment mode like Cash on Delivery is introduced?

## How to Identify LSP Violation?

Below are some good indicators that can help us tell if the code we are working with is probably violating LSP:

1. **Conditional logic (using the `instanceof` operator or `object.getClass().getName()` to identify the actual type of the subclass) in client code** 
2. **Empty, do-nothing implementations of one or more methods in subclasses** 
3. **Throwing an `UnsupportedOperationException` or some other unexpected exception from a subclass method** 

We should note that for point 3 above, the exception needs to be unexpected from the superclass's contract perspective. So **if our superclass method's signature explicitly specified that subclasses or implementations could throw an `UnsupportedOperationException`, then we would not consider it as a violation of LSP.**

A good example of this is the `java.util.List<E>` interface's `add(E e)` method. Now since `java.util.Arrays.asList(T ...)` returns an unmodifiable list, client code which adds an element to a `List` would break if it were passed a `List` returned by `Arrays.asList`. 

Is this a violation of LSP? It is not an LSP violation since the `List.add(E e)` method's signature says that implementations can throw an `UnsupportedOperationException`. So it is part of the superclass or supertype's contract. Clients should expect this exception to be thrown when using the `List.add(E e)` method.

## Conclusion

LSP is a very useful idea to keep in mind both when developing a new application and when enhancing or modifying an existing one. 

When designing our class hierarchy the first time around for a new application, **LSP helps us make sure that we are not prematurely generalizing concepts in our problem domain.** 

When enhancing an existing application by adding a new subclass or changing the implementation of an existing subclass, being mindful of **LSP helps us ensure that our changes are in line with the superclass's contract and that the client code's expectations continue to be met**.

You can play around with a complete Spring Boot application illustrating these ideas using the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/solid). 

## References

[Liskov, B.](https://en.wikipedia.org/wiki/Barbara_Liskov) (May 1988). "Keynote address - data abstraction and hierarchy". *ACM SIGPLAN Notices*. **23** (5): 17–34. [doi](https://en.wikipedia.org/wiki/Doi_(identifier)):[10.1145/62139.62141](https://doi.org/10.1145%2F62139.62141). A keynote address in which Liskov first formulated the principle.



  

  





