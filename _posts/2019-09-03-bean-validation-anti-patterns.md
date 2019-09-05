---
title: Bean Validation Anti-Patterns
categories: [spring-boot, java]
modified: 2017-09-05
excerpt: "Some thoughts about validation in general, Bean Validation in particular, and why I consider some applications of Bean Validation an anti-pattern."
image:
  auto: 0019-magnifying-glass
tags: ["bean validation", "anti-pattern", "best practice"]
---

Bean Validation is the de-facto standard for implementing validation logic in the Java eco system and it's a great tool to have around.

In recent projects, however, I have been thinking a bit deeper about Bean Validation and have come up with some anti-patterns.

As with every discussion about patterns and anti-patterns, there's some opinion and personal experience involved. An anti-pattern in one context may very well be a best practice in another context (and vice-versa), so please don't take the discussion below as hard-and-fast rules to fight over but as a trigger for thinking and constructive discussion of the topic.

## Anti-Pattern #1: Validating Only in the Persistence Layer

It's very easy to set up Bean Validation in the persistence layer. Say we have an entity with some bean validation annotations and an associated Spring Data repository:

```java
@Entity
public class Person {

  @Id
  @GeneratedValue
  private Long id;

  @NotEmpty
  private String name;

  @NotNull
  @Min(0)
  private int age;

  // getters and setters omitted

}
```

```java
public interface PersonRepository extends CrudRepository<Person, Long> {

  // default CRUD methods provided by CrudRepository

}
```

As long as we have a bean validation implementation like Hibernate Validator on the classpath, each call to the `save()` method of the repository will [trigger a validation](/bean-validation-with-spring-boot/#validating-jpa-entities). If the state of the passed-in `Input` object is not valid according to the bean validation annotations, a `ConstraintViolationException` will be thrown.

So far, so good. This is pretty easy to set up and with the knowledge that everything will be validated before it's sent to the database, we gain a sense of safety. 

But is the persistence layer the right place to validate? 

**I think it should at least not be the only place to validate**.

In a common web application, the persistence layer is the bottom-most layer. We usually have a business layer and a web layer above. Data flows into the web layer, through the business layer and finally arrives in the persistence layer.

If we only validate in the persistence layer, **we accept the risk that the web and business layer work with invalid data**! 

Invalid data may lead to severe errors in the business layer (if we expect the data in the business layer to be valid) or to ultra-defensive programming with manual validation checks sprinkled all over the business layer (once we have learned that the data in the business layer cannot be trusted).

In conclusion, the input to the business layer should be validated. Validation in the persistence layer can then act as an additional safety net, but not as the only place for validation.

## Anti-Pattern #2: Validating with a Shotgun

Instead of validating too little, however, we can certainly validate too much. This is not a problem specific to Bean Validation, but with validation in general.

Data is validated using Bean Validation before it enters the system through [the web layer](/bean-validation-with-spring-boot/#validating-input-to-a-spring-mvc-controller). The web controller transforms the incoming data into an object that it can pass to a business service. The business service doesn't trust the web layer, so [it validates this object again](/bean-validation-with-spring-boot/#validating-input-to-a-spring-service-method) using Bean Validation. 

Before executing the actual business logic, the business service then programmatically checks every single constraint we can think of so that absolutely nothing can go wrong. Finally, the persistence layer validates the data again before it's stored in the database. 

This "shotgun validation" may sound like a good defensive approach to validation, but, in my experience, leads to problems.

First, if we use Bean Validation in a lot of places, we'll have Bean Validation annotations everywhere. **If in doubt, we'll add Bean Validation annotations to an object even though it might not be validated after all**. In the end, we're spending time on adding and modifying validation rules that might not even be executed after all. 

Second, **validating everywhere leads to well-intentioned, but ultimately wrong validation rules**. Imagine we're validating a person's first and last name to have a minimum of three characters. No specification has defined this validation, but we added it nevertheless, because in other places of the codebase we also validate everything (by the way, when developers on your team justify a decision with "we've always done it this way" you have my permission to slap them - be gentle the first time). Some day we'll get an error report that says that a person named "Ed Sheeran" has failed to register in our system and has just started a shit storm on Twitter.  

Third, **validating everywhere slows down development**. If we have validation rules sprinkled all over the code base, some in Bean Validation annotations and some in plain code, some of them might be in the way of a new feature we're building. But we cannot just remove those validations, can we? Someone must have put them there for a reason, after all. If we use validation rules inflationary, this reason is often "because we've always done it this way", but we can't be sure. We're slowed down because we have to think through each validation before we can apply our changes.  

Finally, with validation rules are all over the code, **if we come across an unexpected validation error, we don't know where to look to fix it**. We have to find out where the validation was triggered, which can be hard if we're using Bean Validation declaratively with `@Validated` and `@Valid`. Then, we need to search through our objects to find the responsible Bean Validation annotation. This is especially hard with nested objects.   

In short, instead of validating everything, everywhere, **we should have a clear and focused validation strategy**.

## Anti-Pattern #3: Using Validation Groups for Use Case Validations

The Bean Validation JSR provides a feature called [validation groups](/bean-validation-with-spring-boot/#using-validation-groups-to-validate-objects-differently-for-different-use-cases). This feature allows us to associate validation annotations to certain groups, so that we can choose which group to validate:

```java
public class Person {

  @Null(groups = ValidateForCreate.class)
  @NotNull(groups = ValidateForUpdate.class)
  private Long id;

  @NotEmpty
  private String name;

  @NotNull
  @Min(value = 18, groups = ValidateForAdult.class)
  @Min(value = 0, groups = ValidateForChild.class)
  private int age;

  // getters and setters omitted

}
```

When a `Person` is validated for creation, the `id` field is expected to be null. If it's validated for update, the `id` field is expected not to be null. 

Similarly, when a `Person` is validated in a use case that expects the person to be adult, it is expected to have a minimum age of 18. If it's validated as a child, the age is expected to be greater than 0 instead.

These validations are triggered in a use case by stating which groups we want to validate:

```java
@Service
@Validated
class RegisterPersonService {

  @Validated({ValidateForAdult.class, ValidateForCreate.class})
  void registerAdult(@Valid Person person) {
    // do something
  }

  @Validated({ValidateForChild.class, ValidateForCreate.class})
  void registerChild(@Valid Person person) {
    // do something
  }

}
```

The `@Validated` annotation is a Spring annotation that validates the input to a method before it's actually called, but validation groups can just as well be used without Spring.

So, what's wrong with validation groups?

First of all, we're deliberately violating the Single Responsibility Principle. The `Person` model class knows the validation rules for all the use cases it is validated for. The model class has to change if a validation specific to a certain use case changes.

Second, it's plain hard to read. The example above is simple yet, but you can imagine that it grows hard to understand with more use cases and more fields. It grows even harder to read if we use the [`@ConvertGroup` annotation](https://beanvalidation.org/latest-draft/spec/#constraintdeclarationvalidationprocess-groupsequence-groupconversion), which allows to convert one group into another for a nested object.

Instead of using validation groups, I propose the following:

* Use Bean Validation annotations only for syntactic validation that is applicable to *all* use cases.
* Add query methods for semantic information to the model class. In the case above, we would add the methods `hasId()` and `isAdult()`.
* In the use case code, call these query methods to validate the data semantically for the use case.

This way, the use case specific semantics are validated in the use case code where they belong and the model code is free of the dependency to the use case. At the same time, the business rules are still encoded in a "rich" domain model class and accessible via query methods.  

## Validate Consciously

Bean Validation is a great tool to have at our fingertips, but with great tools comes great responsibility (sounds a bit trite but it's spot-on, if you ask me).

Instead of using Bean Validation for everything and validating everywhere, we should have a clear validation strategy that tells us where to validate and when to use which tool for validation. 

We should definitely separate syntactic validation from semantic validation. Syntactic validation is a perfect use case for the declarative style supported by Bean Validation annotations, while semantic validation is better readable in plain code.

If you're interested in a deeper discussion of validation in the context of software architecture, have a look at my [book](/e-book/).

Let me know your thoughts about validation in the comments.