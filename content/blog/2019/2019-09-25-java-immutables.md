---
authors: [tom]
title: Immutables in Java - Are Setters Allowed?
categories: ["WIP", "Java", "Software Craft"]
date: 2019-09-25 00:00:00 +1100
modified: 2021-10-22 00:00:00 +1100  
excerpt: "Why are immutable objects a way to create safer software that is easier to maintain? And what are best practices to implement them? This article provides answers."
image:  images/stock/0053-rock-wave-1200x628-branded.jpg
url: java-immutables
---

In short, no. Feel free to jump right ahead to the section on [bad practices](#immutable-bad-practices). If you want to read a bit more on the why and how of immutables, have a look at the rest of this article.

Immutable objects are a way to create safer software that is easier to maintain. Why is that? And what should we do and what not when implementing them? This article provides answers.

{{% github "https://github.com/thombergs/code-examples/tree/master/patterns" %}}

## What's an Immutable?

The definition of an immutable object is rather short:

 > An object whose state cannot be changed after construction is called an immutable object. 

However clear this definition is, there are still enough questions to write a 2000+-word article about immutables.

In this article, we'll explore why immutable objects are a good idea, how to (and how not to) implement them, and finally discuss some use cases in which they shine.

## Why Should I Make an Object Immutable?

It's good to know what an immutable object is, but why should we use them? Here is a (most certainly incomplete) list of reasons why immutable objects are a good idea. Let me know in the comments if you find more reasons.

### You Know What to Expect from an Immutable

Since the state of an immutable cannot change, we know what to expect from it. If we follow some of the best practices below, we know that the state of the object is valid throughout the object's lifetime. 

Nowhere in the code can the state be changed to potentially introduce inconsistencies that may lead to runtime errors.

### An Immutable Is a Gate Keeper for Valid State

If implemented correctly, an immutable object validates the state it is constructed with and only lets itself be instantiated if the state is valid.

This means that no one can create an instance of an immutable in an invalid state. This goes back to the first reason: we can not only expect the immutable object to have the same state through its lifetime, but also a *valid* state.

No more null-checks or other validations strewn across the codebase. All those validations take place within the immutable object.

### Compilers Love Immutables

Because immutables are so predictable, compilers love them.

Since immutable fields usually use the `final` keyword, compilers can tell us when such a field has not been initialized.

And since the whole state of an immutable object has to be passed into the constructor, the compiler can tell us when we forget to pass a certain field. This is especially handy when we're adding a field to an existing immutable object. The compiler will point out all the places where we have to add that new field in the client code.

Because compilers love immutables, we should love them, too.

## Immutable Best Practices

Let's have a look at how to implement an immutable.

### A Basic Immutable

A very basic immutable class looks like this:

```java
class User {

  private final Long id;
  private final String name;

  User(Long id, String name) {
    this.id = id;
    this.name = name;
  }

}
```

The main features are that **the fields are final**, telling the compiler that their values must not change once initialized and that **all field values are passed into the constructor**.

### Use Lombok's @RequiredArgsConstructor

Instead of writing the constructor by hand, we can use [Lombok](https://projectlombok.org/) to generate the constructor for us:

```java
@RequiredArgsConstructor
class User {

  private final Long id;
  private final String name;

}
```

`@RequiredArgsConstructor` generates a constructor that takes values for all `final` fields as parameters. 

Note that **if we change the order of the fields, Lombok will automatically change the order of the parameters**. This is the price to pay for automatic code generation.

### A Factory Method for Each Valid Combination of Fields

An immutable object may have fields that are optional so that their value is null. Passing null into a constructor is a code smell, however, because we assume knowledge of the inner workings of the immutable. Instead, the immutable should provide a factory method for each valid combination of fields:

```java
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
class User {

  private final Long id;
  private final String name;
  
  static User existingUser(Long id, String name){
    return new User(id, name);
  }
  
  static User newUser(String name){
    return new User(null, name);
  }
  
}
```

The `User` class may have an empty ID because we somehow have to instantiate users that have not been saved to the database yet. 

Instead of providing a single constructor into which we would have to pass a `null` ID, we have created **a static factory method to which we only have to pass the name**. Internally, the immutable then passes a `null` ID to the private constructor.

We can give names to the factory methods like `newUser` and `existingUser`, to make clear their intent. 

### Make Optional Fields Obvious

In the `User` class from above, the ID is an optional field and may be null. We don't want every client of the `User` class fall prey to potential `NullPointerExceptions`, so **we can make the getter return an `Optional`**:

```java
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
class User {

  private final Long id;
  private final String name;

  static User existingUser(Long id, String name){
    return new User(id, name);
  }

  static User newUser(String name){
    return new User(null, name);
  }

  Optional<Long> getId() {
    return Optional.ofNullable(id);
  }
}
```

Any client calling `getId()` will immediately know that the value might be empty and will act accordingly. 

<div class="notice success">
  <h4>Don't Use <code>Optional</code> as a Field or Argument Type</h4>
  <p>
     Instead of using <code>Long</code> as the field type for the user ID, we could have used <code>Optional&lt;Long&gt;</code>, right? This would make it obvious at a glance at the field declarations that the ID may be empty. 
  </p>
  <p>
  This is bad practice, however, since an <code>Optional</code> may also be <code>null</code>. This would mean that each time we work with the value of the ID field within the <code>User</code> class, we would have to first check if the <code>Optional</code> is <code>null</code> and <em>then</em> check if it has a value or is empty.
  </p>
  <p>
  The same argument holds for passing an <code>Optional</code> as a parameter into a method.
  </p>
</div>

### Self-Validate

To only allow valid state, an immutable may check within its constructor(s) if the passed-in values are valid according to the business rules of the class:

```java
class User {

  private final Long id;
  private final String name;

  User(Long id, String name) {
    if(id < 0) {
      throw new IllegalArgumentException("id must be >= 0!");
    }
    
    if(name == null || "".equals(name)) {
      throw new IllegalArgumentException("name must not be null or empty!");
    }
    
    this.id = id;
    this.name = name;
  }

  // additional methods omitted ...
}
```

This way **we can always be certain that we have an object with a valid state in our hands**.

Also, the validation is very close to the validated fields (as opposed to the validation code being in some service at the other end of the codebase), making it easy to find and maintain together with the fields.

### Self-Validate with Bean Validation

Instead of validating our immutable by hand as we did above, we can also take advantage of the declarative approach of the Bean Validation library:

```java
class User extends SelfValidating<User>{

  @Min(0)
  private final Long id;

  @NotEmpty
  private final String name;

  User(Long id, String name) {
    this.id = id;
    this.name = name;
    this.validateSelf();
  }

}
```

We simply add Bean Validation annotations to mark validation rules and then call `validateSelf()` as the last statement in the constructor.

The `validateSelf()` method is implemented in the parent class `SelfValidating` and might look like this:

```java
public abstract class SelfValidating<T> {

  private Validator validator;

  public SelfValidating() {
    ValidatorFactory factory = 
        Validation.buildDefaultValidatorFactory();
    validator = factory.getValidator();
  }

  /**
   * Evaluates all Bean Validations on the attributes of this
   * instance.
   */
  protected void validateSelf() {
    Set<ConstraintViolation<T>> violations = 
        validator.validate((T) this);
    if (!violations.isEmpty()) {
      throw new ConstraintViolationException(violations);
    }
  }
}
```

If you're not familiar with all the ins and outs of Bean Validation, have a look at my articles about [Bean Validation](/bean-validation-with-spring-boot/) and [validation anti-patterns](/bean-validation-anti-patterns/). 

## Immutable Bad Practices

Some patterns don't work well with immutables. Let's discuss some of them.

### Don't Use Builders

A builder is a class whose goal it is to make object instantiation easy. Instead of calling a constructor which takes all field values as arguments, we call fluid builder methods to set the state of an object step-by-step:

```java
User user = User.builder()
            .id(42L)
            .build();
```

This is especially helpful if we have a lot of fields since its better readable than a call to a constructor with many parameters.

Using a builder to create an immutable object instance is not a good idea, however. Look at the code above: we called the `build()` method after only initializing the `id` field. The `name` field is still empty.

If the `User` class also requires a value for the `name` field, the builder will probably simply pass `null` into the constructor and **object instantiation will fail at runtime**. If we have not implemented any kind of validation, object validation won't even fail at all and we have an immutable with an unexpected `null` value. 

We have just tricked the compiler into believing that we're creating a valid object. Had we used the [factory methods](#a-factory-method-for-each-valid-combination-of-fields) from above, the compiler would know which combinations of fields are valid and which are not *at compile time*. 

### Don't Use Withers

If you search the web for immutables, you may come across the pattern of using so-called "wither" methods to "change the state" of an immutable:

```java
@RequiredArgsConstructor
class User {

  private final Long id;
  private final String name;

  User withId(Long id) {
    return new User(id, this.name);
  }

  User withName(String name) {
    return new User(this.id, name);
  }

}
```

Wither methods are similar to setters, except that they usually start with the `with...` prefix. 

The class in the code above is still technically immutable since its fields are final and the wither methods each return a new object instead of manipulating the state of the current object. 

This pattern works against the idea of an immutable, though. **We're using an immutable as if it were mutable**. If we see wither methods like this used on an immutable, we should check if the class should rather be mutable because that's what the code implies.

There may be valid use cases for immutables with wither methods, but I would at least be skeptical if I found an immutable using this pattern.

### Don't Use Setters

It's obvious that an immutable shouldn't have a setter, because its fields are final and cannot be changed. However, similar to withers described above, we might implement setters so that they return a new object:

```java
@RequiredArgsConstructor
class User {

  private final Long id;
  private final String name;

  User setId(Long id) {
    return new User(id, this.name);
  }

  User setName(String name) {
    return new User(this.id, name);
  }

}
```

Don't do this. At first glance, the class looks like it's mutable. And it might be used like a mutable class.

If you find yourself using setter methods like this often, the class should probably be mutable after all.

### Don't Provide Getters by Default

Often, it's no more than a reflex to have the IDE (or Lombok) create getters and setters for us. Setters are out of the question for an immutable object, but what about getters?

Let's look at a different version of our `User` class:

```java
@Getter
@RequiredArgsConstructor
class User {

  private final Long id;
  private final List<String> roles;

}
```

Instead of a name, the user now has a list of roles. We have also added Lombok's `@Getter` annotation to create getters for us.

Now, we work with this class:

```java
User user = new User(42L, Arrays.asList("role1", "role2"));
user.getRoles().add("admin");
```

Even though we did not provide setters and made all fields final, this `User` class is not immutable. **We can simply access the list of roles via its getter and change its state**.

So, we should not provide getters by default. If we *do* provide getters, we should make that the type of the field is immutable (like `Long` or `String`) or that we return a copy of the field value instead of a reference to it.

For this reason, we should use Lombok's `@Value` annotation (which is intended to be used for creating immutable [value objects](#value-objects)) with care because it creates getters for all fields by default.

## Use Cases for Immutables

Now that we've talked a lot about why and how to build immutables, let's discuss some actual use cases where they shine.

### Concurrency

If we're working with concurrent threads that access the same objects, it's best if those objects are immutable. This way, we can not introduce any bugs that arise from accidentally modifying the state of an object in one of the threads.

**In concurrency code, we should make objects mutable only if we have to**.

### Value Objects

Value objects are objects that represent a certain value and not a certain entity. Thus, they have a value (which may consist of more than one field) and no identity.

Examples for value objects are:

* Java's wrappers of primitives like `Long` and `Integer`
* a `Money` object representing a certain amount of money
* a `Weight` object representing a certain weight
* a `Name` object representing the name of a person
* a `UserId` object representing a certain numerical User-ID
* a `TaxIdentificationNumber` object representing a ... wait for it ... tax identification number
* ...

**Since value objects represent a specific value, that value must not change. So, they must be immutable.** 

Imagine passing a `Long` object with value `42` to a third-party method only to have that method change the value to `13` ... scary, isn't it? Can't happen with an immutable.

### Data Transfer Objects

Another use case for immutables is when we need to transport data between systems or components that do not share the same data model. In this case, we can create a shared Data Transfer Object (DTO) that is created from the data of the source component and then passed to the target component. 

Although DTOs don't necessarily have to be immutable, it helps to keep the state of a DTO in a single place instead of scattered over the codebase.

Imagine we have a large DTO with tens of fields which are set and re-set over hundreds of lines of code, depending on certain conditions, before the DTO is sent over the line to a remote system (I've seen it happen!). In case of an error, we'll have a hard time finding out where the value of a specific field came from.

**If we make the DTO immutable** (or close to immutable) instead, with dedicated factory methods for valid state combinations, **there are only a few entry points for the state of the object**, easing debugging and maintenance considerably.

### Domain Objects

Even domain objects can benefit from the concepts of immutability. 

Let's define a domain object as an object with an identity that is loaded from the database, manipulated for a certain use case, and then stored back into the database, usually within a database transaction. There are certainly more general and complete definitions of a domain object out there, but for the sake of discussion, this should do.

**A domain object is most certainly not immutable, but we will benefit from making it as immutable as possible**.

As an example, let's look at this `Account` class from my [clean architecture example application "BuckPal"](https://github.com/thombergs/buckpal):

```java
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Account {

  private final AccountId id;
  private final Money baselineBalance;

  @Getter
  private final ActivityWindow activityWindow;

  public static Account withoutId(
          Money baselineBalance, 
          ActivityWindow activityWindow) {
    return new Account(null, baselineBalance, activityWindow);
  }

  public static Account withId(
          AccountId accountId, 
          Money baselineBalance, 
          ActivityWindow activityWindow) {
    return new Account(accountId, baselineBalance, activityWindow);
  }

  public Optional<AccountId> getId(){
    return Optional.ofNullable(this.id);
  }

  public Money calculateBalance() {
    // calculate balance from baselineBalance and ActivityWindow
  }

  public boolean withdraw(Money money, AccountId targetAccountId) {
    // add a negative Activity to the ActivityWindow
  }

  public boolean deposit(Money money, AccountId sourceAccountId) {
    // add a positive Activity to the ActivityWindow
  }

}
```

An `Account` can collect an unbounded number of `Activity`s over the years, which can either be positive (deposits) or negative (withdrawals). For the use case of depositing or withdrawing money to/from the account, we're not loading the complete list of activities (which might be too large for processing), but instead only load the latest 10 or so activities into an `ActivityWindow`. To still be able to calculate the total account balance, the account has the field `baselineBalance` with the balance the account had just before the oldest activity in the window.

All fields are final, so an `Account` seems to be immutable at first glance. The `deposit()` and `withdraw()` methods manipulate the state of the associated `AccountWindow`, however, so it's not immutable after all. These methods are better than standard getters and setters, though, because they provide very targeted entry points for manipulation that may even contain business rules that would otherwise be scattered over some services in the codebase.

In short, **we're making as many of the domain object's fields as possible immutable and provide focused manipulation methods if we cannot get around it**. An architecture style that supports this kind of domain objects is the Hexagonal Architecture explained hands-on in my [book about clean architecture](/get-your-hands-dirty-on-clean-architecture/).

### "Stateless" Service Objects

Even so-called "stateless" service objects usually have some kind of state. Usually, a service has dependencies to components that provide database access for loading and updating data: 

```java
@RequiredArgsConstructor
@Service
@Transactional
public class SendMoneyService {

  private final LoadAccountPort loadAccountPort;
  private final UpdateAccountStatePort updateAccountStatePort;
  
  // stateless methods omitted
}
```

In this service, the objects in `loadAccountPort` and `updateAccountStatePort` provide database access. These fields don't make the service "stateful", though, because their value doesn't usually change during the runtime of the application. 

If the values don't change, why not make them immutable from the start? We can simply make the fields final and provide a matching constructor (in this case with Lombok's `@RequiredArgsConstructor`). **What we get from this is the compiler complaining about missing dependencies at compile time instead of the JRE complaining later at runtime**.

## Conclusion

Every time we add a field to a class we should make it immutable (i.e. final) by default. If there is a reason to make it mutable, that's fine, but unnecessary mutability increases the chance of introducing bugs and maintainability issues by unintentionally changing state.

What's your take on immutables?

The example code is available on [GitHub](https://github.com/thombergs/code-examples/tree/master/patterns).
