---
title: Bean Validation Anti-Patterns
categories: [spring-boot, java]
modified: 2017-08-30
excerpt: "Some thoughts about validation in general, Bean Validation in particular, and why I consider some applications of validation an anti-pattern."
image:
  auto: 0039-start
tags: ["bean validation", "anti-pattern", "best practice"]
---

## Anti-Pattern #1: Validate only in the Persistence Layer

It's very easy to set up Bean Validation in the persistence layer. Say we have an entity with some bean validation annotations and an associated Spring Data repository:

```java
@Entity
public class Input {

  @Id
  @GeneratedValue
  private Long id;

  @Min(1)
  @Max(10)
  private int numberBetweenOneAndTen;

  // getters and setters omitted

}
```

```java
public interface ValidatingRepository extends CrudRepository<Input, Long> {

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

## Anti-Pattern #2: Validate in Every Layer

* shotgun, not scalpel
* not so much a problem with bean validation, but with its application
* defensive programming to the extreme
* validate in web layer, then in service layer, then in persistence layer
* we spend a lot of time hunting validation errors (we'll have a stack trace, but we will always have to interpret the error message...the deeper it's nested, the harder to find the validation rule)

## Anti-Pattern #3: Validation Groups

* code example with link to validation article
* validation errors are hardest to track (which use case were we in?)
* it's a violation of the Single Responsibility Principle by design: the domain model knows about the use cases...it does validation for more than one use case
* better to create a separate model per use case 
* link to chapter "Mapping" in book
* code example with @ConvertGroup

## Anti-Pattern #4: Validate Business Rules

* code doesn't read from top to bottom, you have to know that there is a validation on the input parameter
* declarative usage is good for recurring validations...business rules are usually depending on the use case

## Validate Consciously

* validate only in dedicated places
    * validate input in web layer (link to section in bean validation article)
    * perhaps validate input to the service layer
* don't sprinkle validation all over the codebase
* separate model for separate use cases
