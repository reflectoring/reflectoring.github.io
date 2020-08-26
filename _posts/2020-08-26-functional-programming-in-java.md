---
title: Functional Programming in Java 8
categories: [java]
date: 2020-07-22 05:00:00 +1100
modified: 2020-07-22 05:00:00 +1100
author: sam
excerpt: 'How to implement functional programming approaches in Java 8'
---

In this article, we'll go through the basic Functional Programming paradigms and look into different ways to achieve them in Java 8. We'll also prove our point with working code examples.

{% include github-project.html url="" %}

## Functional Programming: What, Why and When

Functional programming is a programming paradigm that make programming easy and predictable by eliminating side-effects and avoiding shared state. Functional Programming makes use of mathematical expressions and conditions, makes functions run as independent unit - therefore, reduces complexity and increases efficiency. Modular code makes it easier to debug. 

## Major Concepts

Let's look into the key concepts of Functional Programming:

- **Pure Functions**: Given the same input, these functions will always return the same result. They also produce **no side-effects** - no effects on global state, no change of the argument values. Pure Functions are the pillars of Functional Programming.
- **Referential Transparency**: Since the input arguments do not change, Pure Functions alwys return a predictable result. Therefore, a Pure Function that has run once, can be replaced by its return value (which is predictable). This helps avoid unnecessary recalculation of already executed expressions.
- **Higher-order Functions**: Functions that can accept one or more functions as arguments, or, can return a function as its result, or both. This leads to Functional Composition.
- **Functional Composition**: Combination of multiple of Pure Functions can constitute a more **complex expression**. A Pure Function, serving single-purpose, can be tiny and reusable. A complex chain of Pure Functions can be used to complete a task, instead of serving a single-purpose.
- **Immutability**: Since **avoiding side-effects** is a key paradigm of Functional Programming, states or data structures are kept immutable i.e not modified once they are initialized. If we need to change the state of a variable, we will just create a new variable.
- **Recursion**: Recursion is the act of calling a function from itself, until a certain condition is satisfied (unless you want to sacrifice your code to an infinite loop).

## Functional Programming in Java 8

Can we reconcile the above concepts in Java? Well, Java is not a "Functional Programming" language. But, leveraging the features of Java 8, we can mimic the major Functional Programming approaches. For example:

Streams and Lambda Expressions: Java 8 provides the Streams API which can take a data structure (Arrays, Lists etc) as the source, and, pass it through a pipeline of functional-styled operations. These operations do not change the source but produces a new output stream (therefore, fulfilling the **no-side effect, immutability** condition of Functional Programming.

For example, we can have a list of Strings. But, we need to get the Strings having the length of 4. Using streams, this becomes easy.

```java
// Our original list
List<String> strList = new ArrayList<String>();
// Let's assume we have added 5 elements in the array: "Golf", "Stoic", "Planet", "Mars", "Moon".
strList = strList.stream().filter(str -> str.toString().length()==4).collect(Collectors.toList());
```

The filtered list does not affect the original list, unless we assign it to that (like we're doing here). The ()-> notation in the 'filter' method is called Lambda expression.

Functional Interfaces: An interface with only one abstract method is a Functional Interface. Let's see how we can define one.

```java
@FunctionalInterface
interface FullName 
{ 
    int getFullName(String firstName, String lastName); 
} 
```

All we need to do is implement the getFullName method. How do we do it? Here, too, lambda expressions come to the rescue. We can directly declare an object of the Functional Interface Name and assign an implementation of the getFullName method.

```java
FullName fullName = (String firstName, String lastName)->firstName + ' ' + lastName; 
```

Now, we can call the implemented method on the object. It will return the full name String.

```java
String resultFullName = fullName.getFullName("John","Doe"); 
```

That's the easiest way to make a Pure Function. See, the result will always be predictable for the same set of inputs. But, what about Higher-order functions? How would we compose a chain of functions? Well, that's what we'll do by creating a command-line mock banking application. Java 8 provides built-in Functional Interfaces that take functions as input - exactly what we need.

## Bringing It All Together

Java 8's java.util.Function package provides a few Functional Interface that can help us mimic Functional Programming:

- **Consumer**: Takes a single input and consumes it, i.e, returns no output. We can make use of its 'accept' and 'andThen methods to consume and compose function chains.
- **Function**: Its 'apply' method takes an argument of one type and returns a result of another type. The 'map' method of Streams uses this.
- **BiFunction**: As the name suggests, the  'apply' method takes two arguments and returns a result of another type.
- **Predicate**: Uses the 'test' method to accept an argument and to return a boolean value (BiPredicates do the same, but take two input arguments). The 'filter' method of Streams takes a predicate as argument.

Let's see how we can make use of these to make our mock banking application. A bank app will normally have features to create an account, withdraw money, deposit money, get details of an account, get all accounts. 

First, we'll create an entity class for a bank account.

```java
public class Account {
	private long id;
	private String customerName, mobileNo;
	private double balance;
}
```

We'll create a  parameterized constructor, getters and a toString method. Setters aren't required, since we are going to make objects **immutable**. For creating an account, we'll make use of BiFunction. We'll take the list of accounts (representing all bank accounts), the newly created account object as inputs. The result will be an updated list of accounts with the new account added to it.

```java
public static BiFunction<List<Account>, Account, WeakReference<List<Account>>> CreateAccount = (List<Account> accountList,
		Account account) -> {
		List<Account> accountListNew = accountList.stream().collect(Collectors.toList());
		accountListNew.add(account);
		WeakReference<List<Account>> wRef = new WeakReference<>(accountListNew);
		return wRef;
};
```
In the same way, we'll use a BiFunction to deposit money to an account. Inputs: the account object, the deposit amount. Result: the updated account.

```java
public static BiFunction<Account, Double, Account> DepositBalance = (Account account, Double amount) -> new Account(
			account.getId(), account.getCustomerName(), account.getMobileNo(), account.getBalance() + amount);
```

Now we need a method to withdraw money from the account. But, we need to check whether the account has sufficient balance for withdrawal or not. We'll write a simple BiPredicate to do that. 

```java
public static BiPredicate<Account, Double> insufficientBalance = (account,
			withdrawalAmount) -> (account.getBalance() - withdrawalAmount) < 0 ? true : false;
```

So, we have our balance checker ready. Now, we'll write a method to withdraw balance. We'll take the account object, the withdrawal amount and the above BiPredicate as inputs. The output will be the updated account object. But, wait, how can we take three inputs in a BiFunction? We can't. That's why we'll create a Functional Interface on our own: TriFunction.

```java
@FunctionalInterface
public interface TriFunction<F, S, T, R> {
	public R apply(F first, S second, T third);
}
```

The 'apply' method in this interface will take as inputs arguments of type F,S,T and return a result of type R. So, our withdrawal method will be like:

```java
public static TriFunction<Account, Double, BiPredicate, Optional<Account>> WithdrawBalance = (account, amount,
			balancePredicate) -> balancePredicate.test(account, amount) ? Optional.ofNullable(null)
					: Optional.ofNullable(new Account(account.getId(), account.getCustomerName(), account.getMobileNo(),
							account.getBalance() - amount));
```

We'll have other methods as well. You can find them in the detailed code example. For now, we'll create another method for viewing all accounts. We'll use a Consumer for this.

```java
public static Consumer<List<Account>> ViewAllAccounts = accounts -> {
		accounts.forEach(a -> System.out.println(a));
	};
```
Here comes the next part. How will we call these methods? Simple. We'll call the respective Functional Interface methods as necessary. For account creation, we will receive a new list of accounts once the account is created. 

```java
accounts = (List<Account>) BankService.CreateAccount
					.apply(accounts, new Account(accounts.size() + 1, customerName, contactNo, balance)).get();
```
We are passing the list of accounts and a new account object (by passing parameters in the constructor: id, name, contact and balance). The result is WeakReference, so we need to execute the get() method on it.

Similarly, for deposit, we'll call the BiFunction method.

```java
Account account = BankService.DepositBalance.apply(myAccount.get(), depositAmount);
```
For withdrawal:

```java
Optional<Account> account = BankService.WithdrawBalance.apply(myAccount.get(), sc.nextDouble(),
						Checkers.insufficientBalance);
```
The insufficientBalance is the BiPredicate that checks if the account has enough balance for withdrawal.


## Conclusion

In this article, we went through the common Functional Programming approaches that we can implement in Java. Java was not meant to be a Functional Programming language. But, as we saw, we can make use of Functional Interfaces to fit our purpose. 

You can go ahead and explore the code example.
