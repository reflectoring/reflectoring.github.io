---
title: Why You Should Use Constructor Injection in Spring
categories: ["Spring Boot"]
date: 2020-03-28 05:00:00 +1100
modified: 2020-03-28 05:00:00 +1100
authors: [vasudha]
excerpt: 'Dependency injection is a common approach to implement loose coupling among the classes in an application. There are different ways of injecting dependencies and this article explains why constructor injection should be the preferred way.'
image: images/stock/0068-injection-1200x628-branded.jpg
url: constructor-injection
---  

Dependency injection is an approach to implement loose coupling among the classes in an application. 

There are different ways of injecting dependencies and this article explains why constructor injection should be the preferred way.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/dependency-injection" %}}

## What is Dependency Injection?

* **Dependency**: An object usually requires objects of other classes to perform its operations. We call these objects dependencies.
* **Injection**: The process of providing the required dependencies to an object.

Thus dependency injection helps in implementing inversion of control (IoC). This means that the responsibility of object creation and injecting the dependencies is given to the framework (i.e. Spring) instead of the class creating the dependency objects by itself.

We can implement dependency injection with:

* constructor-based injection, 
* setter-based injection, or
* field-based injection.

## Constructor Injection

In constructor-based injection, the dependencies required for the class are provided as arguments to the constructor:

```java
@Component
class Cake {

  private Flavor flavor;

  Cake(Flavor flavor) {
    Objects.requireNonNull(flavor);
    this.flavor = flavor;
  }

  Flavor getFlavor() {
    return flavor;
  }
  ...
}
```

Before Spring 4.3, we had to add an `@Autowired` annotation to the constructor. With newer versions, this is optional if the class has only one constructor.

In the `Cake` class above, since we have only one constructor, we don't have to specify the `@Autowired` annotation. Consider the below example with two constructors:

```java
@Component
class Sandwich {

  private Topping toppings;
  private Bread breadType;

  Sandwich(Topping toppings) {
    this.toppings = toppings;
  }

  @Autowired
  Sandwich(Topping toppings, Bread breadType) {
    this.toppings = toppings;
    this.breadType = breadType;
  }
  ...
}
```

When we have a class with multiple constructors, we need to explicitly add the `@Autowired` annotation to any one of the constructors so that Spring knows which constructor to use to inject the dependencies.

## Setter Injection

In setter-based injection, we provide the required dependencies as field parameters to the class and the values are set using the setter methods of the properties. We have to annotate the setter method with the `@Autowired` annotation.

The `Cake` class requires an object of type `Topping`. The `Topping` object is provided as an argument in the setter method of that property:

```java
@Component
class Cookie {

  private Topping toppings;

  @Autowired
  void setTopping(Topping toppings) {
    this.toppings = toppings;
  }

  Topping getTopping() {
    return toppings;
  }
  ...
}
```

Spring will find the `@Autowired` annotation and call the setter to inject the dependency.

## Field Injection

With field-based injection, Spring assigns the required dependencies directly to the fields on annotating with `@Autowired` annotation. 

In this example, we let Spring inject the `Topping` dependency via field injection:

```java
@Component
class IceCream {

  @Autowired
  private Topping toppings;

  Topping getToppings() {
    return toppings;
  }

  void setToppings(Topping toppings) {
    this.toppings = toppings;
  }

}
```

## Combining Field and Setter Injection

What will happen if we add `@Autowired` to both, a field *and* a setter? Which method will Spring use to inject the dependency?

```java
@Component
class Pizza {

  @Autowired
  private Topping toppings;

  Topping getToppings() {
    return toppings;
  }

  @Autowired
  void setToppings(Topping toppings) {
    this.toppings = toppings;
  }
}
```

In the above example, we have added the `@Autowired` annotation to both the setter and the field. In this case, Spring injects dependency using the setter injection method.

Note that it's bad practice to mix injection types on a single class as it makes the code less readable.

## Why Should I Use Constructor Injection?

Now that we have seen the different types of injection, let's go through some of the advantages of using constructor injection.

### All Required Dependencies Are Available at Initialization Time

We create an object by calling a constructor. If the constructor expects all required dependencies as parameters, then we can be 100% sure that the class will never be instantiated without its dependencies injected.

**The IoC container makes sure that all the arguments provided in the constructor are available before passing them into the constructor**. This helps in preventing the infamous `NullPointerException`.

Constructor injection is extremely useful since we do not have to write separate business logic everywhere to check if all the required dependencies are loaded, thus simplifying code complexity.

<div class="notice success">
 <h4>What About Optional Dependencies?</h4>
 <p>With setter injection, Spring allows us to specify optional dependencies by adding <code>@Autowired(required = false)</code> to a setter method. This is not possible with constructor injection since the <code>required=false</code> would be applied to <strong>all</strong> constructor arguments.</p>
 <p>
 We can still provide optional dependencies with constructor injection using Java's <code>Optional</code> type.
 </p>  
</div>

### Identifying Code Smells

Constructor injection helps us to identify if our bean is dependent on too many other objects. If our constructor has a large number of arguments this may be a sign that our class has too many [responsibilities](/single-responsibility-principle). We may want to think about refactoring our code to better address proper separation of concerns.

### Preventing Errors in Tests

Constructor injection simplifies writing unit tests. The constructor forces us to provide valid objects for all dependencies. Using mocking libraries like Mockito, we can create mock objects that we can then pass into the constructor.

We can also pass mocks via setters, of course, but if we add a new dependency to a class, we may forget to call the setter in the test, potentially causing a `NullPointerException` in the test.

Constructor injection ensures that our test cases are executed only when all the dependencies are available. It's not possible to have half created objects in unit tests (or anywhere else for that matter).

### Immutability

Constructor injection helps in creating [immutable objects](/java-immutables) because a constructor’s signature is the only possible way to create objects. Once we create a bean, we cannot alter its dependencies anymore. With setter injection, it's possible to inject the dependency after creation, thus leading to mutable objects which, among other things, may not be thread-safe in a multi-threaded environment and are harder to debug due to their mutability.

## Conclusion

Constructor injection makes code more robust. It allows us to create immutable objects, preventing `NullPointerException`s and other errors.

You can find the code example [on GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/dependency-injection).
