---
title: "Intro to Specifications"
categories: [spring-boot]
date: 2020-10-24 00:00:00 +1100
modified: 2020-10-24 20:00:00 +1100
author: mmr
excerpt: "All you need to know about spring boot specification"
image:
  auto: 0084-search
---

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/specification" %}

## What Are Specifications?

Specification is yet another tool at our disposal to perform queries in Spring Boot.

Specification is an interface which is part of the Spring Data JPA 2.0 module, and it allows us to execute JPA 
criteria API.

```java
interface Specification<T>{
 
  Predicate toPredicate(Root<T> root, 
                        CriteriaQuery<?> query, 
                        CriteriaBuilder criteriaBuilder);

}
```

When building criteria query we are required to build and manage `Root`, `CriteraQuery`, and `CriteriaBuilder` objects by ourselves. 
But, in the case of Specification that responsibly is taken up by Spring itself.

Spring JPA Specification is inspired by Domain Driven Design's Specification pattern. 

Using specification we can build 
atomic predicates, and it further allows us to even combine those predicates to build compound queries. 

## Why Do We Need Specifications?

One of the most common ways to perform queries in the Spring boot is by using [Query Methods](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#jpa.query-methods). But, the problem with query 
method is that as we can only specify a fixed number of criteria, the number of query methods can increase rapidly as the 
use cases increases.

For instance consider the following `JpaRepository` for the `Product` entity:

```java
List<Product> findAllByNameLike(String name);
List<Product> findAllByNameLikeAndPriceLessThanEqual(String name, 
                                                     Double price);
List<Product> findAllByCategoryInAndPriceLessThanEqual(List<Category> categories, 
                                                       Double price);
List<Product> findAllByCategoryInAndPriceBetween(List<Category> categories,
                                                 Double bottom, 
                                                 Double top);
List<Product> findAllByNameLikeAndCategoryIn(String name, 
                                            List<Category> categories);
List<Product> findAllByNameLikeAndCategoryInAndPriceBetween(String name, 
                                                            List<Category> categories,
                                                            Double bottom, 
                                                            Double top);
```  
You can notice that there are many overlapping criteria and if there is a change in any one of those we will need to make
 changes in multiple query methods. 

Also, the length of the query method might increase sufficiently when we have long field names and have multiple criteria
in our query. Plus, it may take a while for someone to understand such a lengthy query, and it's purpose.

```java
List<Product> findAllByNameLikeAndCategoryInAndPriceBetweenAndManufacturingPlace_State(String name,
                                                                                       List<Category> categories,
                                                                                       Double bottom, Double top,
                                                                                       STATE state);
```

With specification, we can tackle these issues by creating atomic predicates, and by giving those predicates a 
meaningful name we can clearly specify its intent. We will see how we can convert the above into a much meaningful query in 
[Writing Queries With Specification section](#writing-queries-with-specification).

Specification allows us to write queries programmatically and because of this fact, we can build dynamic queries based 
on user input. We will see it in more detail in [Dynamic Queries With Specification section](#dynamic-queries-with-specification).

## Setting Things Up

First, we need to have Spring Data Jpa dependency in our `build.gradle` file. 

Next, we will add the `hibernate-jpamodelgen` annotation processor
dependency which will allow writing queries in a strongly-typed manner, utilizing so-called static metamodel classes.

```java
...
implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
annotationProcessor 'org.hibernate:hibernate-jpamodelgen'
...
```

## Writing Queries With Specification

Let's convert one of the query method mentioned above into the Specification. Let's take:

```java
List<Product> findAllByNameLike(String name);
```  

An equivalent Specification of this Query Method is:

```java
private Specification<Product> nameLike(String name){
    return new Specification<Product>() {
        @Override
        public Predicate toPredicate(Root<Product> root, 
                                     CriteriaQuery<?> query, 
                                     CriteriaBuilder criteriaBuilder) {
            return criteriaBuilder.like(root.get(Product_.NAME), "%"+name+"%");
        }
    };
}
``` 

With Java 8 Lambda we can simplify the above to the following:

```java
private Specification<Product> nameLike(String name){
    return (root, query, criteriaBuilder) -> criteriaBuilder.like(root.get(Product_.NAME), "%"+name+"%");
}
```

We can also write it in-line in our function itself:

```java
...
Specification<Product> = (root, query, criteriaBuilder) -> 
                            criteriaBuilder.like(root.get(Product_.NAME), "%"+name+"%");
...
```
But, this defeats our purpose of reusability, so let's avoid this unless our use case requires it.

To execute Specification we need to extend the `JpaSpecificationExecutor` interface in our Jpa repository:

```java
interface ProductRepository extends JpaRepository<Product, String>, 
                                    JpaSpecificationExecutor<Product> {
}
```

`JpaSpecificationExecutor` interface adds required functions which will allow us to execute the Specification.

To mention a few:

```java
List<T> findAll(Specification<T> spec);

Page<T> findAll(Specification<T> spec, Pageable pageable);

List<T> findAll(Specification<T> spec, Sort sort);
```

Finally, to execute our query we can simply call:

```java
List<Product> products = productRepository.findAll(namelike("reflectoring"));
```

We can also take benefit of `findAll` functions overloaded with `Pageable` and `Sort` in case we are expecting a large number of records in the result or
want records in sorted order.

Specification interface also has some public static helper methods - `and`, `or`, `where` - that allows us to combine 
multiple specifications. Also, a `not` method which allows us to do negation of a specification.

Let's look at an example:

```java
public List<Product> getPremiumProducts(List<Category> categories) {
  return productRepository.findAll(where(belongsToCategory(categories)).and(isPremium()));
}

private Specification<Product> belongsToCategory(List<Category> categories){
  return (root, query, criteriaBuilder)-> criteriaBuilder.in(root.get(Product_.CATEGORY)).value(categories);
}

private Specification<Product> isPremium() {
  return (root, query, criteriaBuilder) ->
          criteriaBuilder.and(
                  criteriaBuilder.equal(root.get(Product_.MANUFACTURING_PLACE).get(Address_.STATE),
                          STATE.CALIFORNIA),
                  criteriaBuilder.greaterThanOrEqualTo(root.get(Product_.PRICE), PREMIUM_PRICE));
}
```

Here, we have combined `belongsToCategory` and `isPremium` specifications into one using `where` and `and` helper functions. 
This also reads really nice right? Also, notice how `isPrimium` is giving more meaning to the query.

Currently `isPremium` is combining two predicates, but if we want we can create separate Specification for each of those 
and combine again with Specification `and`. For now, we will keep it as is as the predicates used in `isPremium` are very 
specific to that query, and if in the future we need to use them in other queries too then we can always split them up without 
impacting the clients of `isPremium` function.

## Dynamic Queries With Specification

Let's say we want to allow our users to filter the products based on a number of properties such as categories, price, color, 
etc. Here we do not know beforehand what combination of properties our user is going to use, to filter the product. One way 
to handle this is to write query methods for all possible combinations but that would require writing a lot of query methods. And that number would further increase as we introduce new fields.

A better solution is to generate queries dynamically using the specification. Let's see how.

First, let's create an input object to take filters from the clients:

```java
public class QueryInput {
  private String field;
  private QueryOperator operator;
  private String value;
  private List<String> values;//Used in case of IN operator
  private boolean isOptional;
}
```

We will expose this object to our clients via rest APIs.

Second, we need to write a function that will convert `QueryInput` to a Specification:

```java
private Specification<Product> createSpecification(QueryInput input) {
  switch (input.getOperator()){
    case EQ:
       return (root, query, criteriaBuilder) -> 
              criteriaBuilder.equal(root.get(input.getField()),
               castToRequiredType(root.get(input.getField()).getJavaType(), input.getValue()));
    case NOT_EQ:
       return (root, query, criteriaBuilder) -> 
              criteriaBuilder.notEqual(root.get(input.getField()),
               castToRequiredType(root.get(input.getField()).getJavaType(), input.getValue()));
    case GT:
       return (root, query, criteriaBuilder) -> 
              criteriaBuilder.gt(root.get(input.getField()),
               (Number) castToRequiredType(root.get(input.getField()).getJavaType(), input.getValue()));
    case LT:
       return (root, query, criteriaBuilder) -> 
              criteriaBuilder.lt(root.get(input.getField()),
               (Number) castToRequiredType(root.get(input.getField()).getJavaType(), input.getValue()));
    case LIKE:
      return (root, query, criteriaBuilder) -> 
              criteriaBuilder.like(root.get(input.getField()), "%"+input.getValue()+"%");
    case IN:
      return (root, query, criteriaBuilder) -> 
              criteriaBuilder.in(root.get(input.getField()))
              .value(castToRequiredType(root.get(input.getField()).getJavaType(), input.getValues()));
    default:
      throw new RuntimeException("Operation not supported yet");
  }
}
```

As you can we here we have supported a number of operations such as Equals(EQ), Less than(LT), In (IN), etc. We can also 
add more based on your requirement.

Now, as we know criteria API allows us to write typesafe queries. So, the values that we provide must be of the type compatible with the type of our field. `QueryInput` takes the value as `String` type which means we will have to cast the values to a required type 
before passing it to `CriteriaBuilder`. 

```java
private Object castToRequiredType(Class fieldType, String value) {
  if(fieldType.isAssignableFrom(Double.class)){
      return Double.valueOf(value);
  }else if(fieldType.isAssignableFrom(Integer.class)){
      return Integer.valueOf(value);
  }else if(Enum.class.isAssignableFrom(fieldType)){
      return Enum.valueOf(fieldType, value);
  }
  return null;
}

private Object castToRequiredType(Class fieldType, List<String> value) {
  List<Object> lists = new ArrayList<>();
  for (String s : value) {
      lists.add(castToRequiredType(fieldType, s));
  }
  return lists;
}
```

Finally, we add a function that will combine multiple Specifications:

```java
private Specification<Product> getSpecificationFromQuery(List<QueryInput> queryInput) {
    Specification<Product> specification = where(createSpecification(queryInput.remove(0)));
    for (QueryInput input : queryInput) {
        if(input.isOptional()){
            specification = specification.or(createSpecification(input));
        }else {
            specification = specification.and(createSpecification(input));
        }
    }
    return specification;
}
```

Let's try to fetch all the products belonging to the `MOBILE` and `TV APPLIANCE` category and whose prices are below 1000 using 
our new shiny dynamic specification query generator.

```java
QueryInput categories = QueryInput.builder()
         .field("category")
         .operator(QueryOperator.IN)
         .values(List.of(Category.MOBILE.name(), Category.TV_APPLIANCES.name()))
         .isOptional(false)
         .build();

QueryInput lowRange = QueryInput.builder()
        .field("price")
        .operator(QueryOperator.LT)
        .value("1000")
        .isOptional(false)
        .build();

List<QueryInput> queries = new ArrayList<>();
queries.add(lowRange);
queries.add(categories);

productAdapter.getQueryResult(queries);
```

The above code snippets should do for most filter cases but there is still a lot of room for improvement. Such as allowing queries 
based on nested entity properties (`manufacturingPlace.state`), limiting the fields on which want to allow filters, etc. 
Consider this as an open-end problem.

## Conclusion

Specification provides us with a way to write reusable queries and also fluent APIs with which we can combine and build more
sophisticated queries.

One question that comes to mind is that if we can write any query with Specification then should we never use query methods? I would say no. If our entity has only 
handful of fields, and it only needs to be queried in a certain way then why bother writing Specification when we can 
simply write a query method. And if in future requirements come in for more queries we always refactor to us Specification. Also, Specification won't be helpful in cases where we want to use database-specific 
features in a query say performing JSON queries in Postgres DB.

All in all, Specification is a great tool whether we want to create reusable predicates or want to generate typesafe queries 
programmatically.

Thank you for reading! You can find the working code at [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/specification).

