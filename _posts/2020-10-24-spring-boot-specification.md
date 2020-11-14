---
title: "Getting Started with Spring Data Specifications"
categories: [spring-boot]
date: 2020-10-24 00:00:00 +1100
modified: 2020-10-24 20:00:00 +1100
author: mmr
excerpt: "All you need to know about Spring Data JPA Specifications"
image:
  auto: 0084-search
---

If you are looking for a better way to manage your queries or want to generate queries dynamically in a typesafe manner then you
might find your solution in Spring Data JPA Specifications.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/specification" %}

## What Are Specifications?

Spring Data JPA Specifications is yet another tool at our disposal to perform queries in Spring Boot.

`Specification` is an interface which is part of the Spring Data JPA 2.0 module, and it allows us to execute JPA 
[Criteria API](https://docs.jboss.org/hibernate/stable/orm/userguide/html_single/Hibernate_User_Guide.html#criteria).

Specifications are built on top of Criteria API. When building Criteria Query 
we are required to build and manage `Root`, `CriteraQuery`, and `CriteriaBuilder` objects by ourselves. But, in the case 
of Specification that responsibly is taken up by Spring itself.

For instance, following is just the setup which would be required before we even start writing queries with Criteria API:

```java
...
EntityManager entityManagr = getEntityManager();

CriteriaBuilder builder = entityManager.getCriteriaBuilder();

CriteriaQuery<Product> productQuery = builder.createQuery(Product.class);

Root<Person> personRoot = productQuery.from( Product.class );
...
```
In contrast, with Specifications we simply need to implement the `Specification` interface:

```java
interface Specification<T>{
 
  Predicate toPredicate(Root<T> root, 
                        CriteriaQuery<?> query, 
                        CriteriaBuilder criteriaBuilder);

}
```

Spring JPA Specifications is inspired by Domain Driven Design's Specification pattern. 

Using Specifications we can build 
atomic predicates, and it further allows us to even combine those predicates to build compound queries. 

## Why Do We Need Specifications?

One of the most common ways to perform queries in the Spring boot is by using [Query Methods](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#jpa.query-methods). But, the problem with query 
method is that as we can only specify a fixed number of criteria, the number of query methods can increase rapidly as the 
use cases increases.

For instance consider the following `JpaRepository` for the `Product` entity:

```java
interface ProductRepository extends JpaRepository<Product, String>, 
                                    JpaSpecificationExecutor<Product> {
    
  List<Product> findAllByNameLike(String name);
  
  List<Product> findAllByNameLikeAndPriceLessThanEqual(
                                  String name, 
                                  Double price
                                  );
  
  List<Product> findAllByCategoryInAndPriceLessThanEqual(
                                  List<Category> categories, 
                                  Double price
                                  );
  
  List<Product> findAllByCategoryInAndPriceBetween(
                                  List<Category> categories,
                                  Double bottom, 
                                  Double top
                                  );
  
  List<Product> findAllByNameLikeAndCategoryIn(
                                  String name, 
                                  List<Category> categories
                                  );
  
  List<Product> findAllByNameLikeAndCategoryInAndPriceBetween(
                                  String name, 
                                  List<Category> categories,
                                  Double bottom, 
                                  Double top
                                  );
}
```  
You can notice that there are many overlapping criteria and if there is a change in any one of those we will need to make
 changes in multiple Query Methods. 

Also, the length of the Query Method might increase sufficiently when we have long field names and have multiple criteria
in our query. Plus, it may take a while for someone to understand such a lengthy query, and it's purpose.

```java
List<Product> findAllByNameLikeAndCategoryInAndPriceBetweenAndManufacturingPlace_State(String name,
                                                                                       List<Category> categories,
                                                                                       Double bottom, Double top,
                                                                                       STATE state);
```

With Specifications, we can tackle these issues by creating atomic predicates, and by giving those predicates a 
meaningful name we can clearly specify its intent. We will see how we can convert the above into a much meaningful query in 
[Writing Queries With Specification section](#writing-queries-with-specification).

Specifications allow us to write queries programmatically and because of this fact, we can build dynamic queries based 
on user input. We will see it in more detail in [Dynamic Queries With Specification section](#dynamic-queries-with-specification).

## Setting Things Up

```groovy
...
implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
annotationProcessor 'org.hibernate:hibernate-jpamodelgen'
...
```

First, we need to have Spring Data Jpa dependency in our `build.gradle` file. 

Next, we will add the `hibernate-jpamodelgen` annotation processor
dependency which will generate static metamodel classes of our entities using which we will be able to write queries in 
a strongly-typed manner.

For instance the metamodel class of `Distributor` entity would look like the following:
```java
@Entity
public class Distributor {
  @Id
  private String id;

  private String name;

  @OneToOne
  private Address address;
  //Getter setter ignored for brevity 

}
```

```java
@Generated(value = "org.hibernate.jpamodelgen.JPAMetaModelEntityProcessor")
@StaticMetamodel(Distributor.class)
public abstract class Distributor_ {

  public static volatile SingularAttribute<Distributor, Address> address;
  public static volatile SingularAttribute<Distributor, String> name;
  public static volatile SingularAttribute<Distributor, String> id;
  public static final String ADDRESS = "address";
  public static final String NAME = "name";
  public static final String ID = "id";

}
```

We then can use `Distributor_.name` in our criteria queries instead of directly using string field names of our entities. 
One major benefit of this is that if we change the name of a field in our entity then we will directly get a compile-time error.

## Writing Queries With Specifications

Let's convert one of the query method mentioned above into the `Specification`. Let's take:

```java
List<Product> findAllByNameLike(String name);
```  

An equivalent `Specification` of this Query Method is:

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
    return (root, query, criteriaBuilder) 
            -> criteriaBuilder.like(root.get(Product_.NAME), "%"+name+"%");
}
```

We can also write it in-line in our function itself:

```java
...
Specification<Product> nameLike = 
            (root, query, criteriaBuilder) -> 
                   criteriaBuilder.like(root.get(Product_.NAME), "%"+name+"%");
...
```
But, this defeats our purpose of reusability, so let's avoid this unless our use case requires it.

To execute Specifications we need to extend the `JpaSpecificationExecutor` interface in our Jpa repository:

```java
interface ProductRepository extends JpaRepository<Product, String>, 
                                    JpaSpecificationExecutor<Product> {
}
```

`JpaSpecificationExecutor` interface adds required functions which will allow us to execute the `Specification`.

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

`Specification` interface also has some public static helper methods - `and`, `or`, `where` - that allows us to combine 
multiple specifications. Also, a `not` method which allows us to do negation of a `Specification`.

Let's look at an example:

```java
public List<Product> getPremiumProducts(List<Category> categories) {
  return productRepository.findAll(where(belongsToCategory(categories))
                                                    .and(isPremium()));
}

private Specification<Product> belongsToCategory(List<Category> categories){
  return (root, query, criteriaBuilder)-> 
            criteriaBuilder.in(root.get(Product_.CATEGORY)).value(categories);
}

private Specification<Product> isPremium() {
  return (root, query, criteriaBuilder) ->
          criteriaBuilder.and(
                  criteriaBuilder.equal(
                          root.get(Product_.MANUFACTURING_PLACE).get(Address_.STATE),
                          STATE.CALIFORNIA),
                  criteriaBuilder.greaterThanOrEqualTo(
                          root.get(Product_.PRICE), PREMIUM_PRICE));
}
```

Here, we have combined `belongsToCategory` and `isPremium` specifications into one using `where` and `and` helper functions. 
This also reads really nice right? Also, notice how `isPrimium` is giving more meaning to the query.

Currently `isPremium` is combining two predicates, but if we want we can create separate Specifications for each of those 
and combine again with `Specification`'s `and`. For now, we will keep it as is as the predicates used in `isPremium` are very 
specific to that query, and if in the future we need to use them in other queries too then we can always split them up without 
impacting the clients of `isPremium` function.

## Dynamic Queries With Specifications

Let's say we want to create an API which allows our clients to fetch all the products and also filter them based on a number 
of properties such as categories, price, color, etc. Here we do not know beforehand what combination of properties client 
is going to use, to filter the product. 

One way to handle this is to write query methods for all possible combinations but 
that would require writing a lot of query methods. And that number would further increase as we introduce new fields.

A better solution is to take predicates directly from clients and convert them to database queries using Specifications. Client has to simply provide us the list 
of `Filter`s, and our backend will take care of the rest. Let's see how.

First, let's create an input object to take filters from the clients:

```java
public class Filter {
  private String field;
  private QueryOperator operator;
  private String value;
  private List<String> values;//Used in case of IN operator
}
```

We will expose this object to our clients via rest APIs.

Second, we need to write a function that will convert `Filter` to a `Specification`:

```java
private Specification<Product> createSpecification(Filter input) {
  switch (input.getOperator()){
    case EQUALS:
       return (root, query, criteriaBuilder) -> 
              criteriaBuilder.equal(root.get(input.getField()),
               castToRequiredType(root.get(input.getField()).getJavaType(), 
                                                        input.getValue()));
    case NOT_EQUALS:
       return (root, query, criteriaBuilder) -> 
              criteriaBuilder.notEqual(root.get(input.getField()),
               castToRequiredType(root.get(input.getField()).getJavaType(), 
                                                        input.getValue()));
    case GREATER_THAN:
       return (root, query, criteriaBuilder) -> 
              criteriaBuilder.gt(root.get(input.getField()),
               (Number) castToRequiredType(
                                root.get(input.getField()).getJavaType(), 
                                                        input.getValue()));
    case LESS_THAN:
       return (root, query, criteriaBuilder) -> 
              criteriaBuilder.lt(root.get(input.getField()),
               (Number) castToRequiredType(
                                root.get(input.getField()).getJavaType(), 
                                                        input.getValue()));
    case LIKE:
      return (root, query, criteriaBuilder) -> 
              criteriaBuilder.like(root.get(input.getField()), 
                                                "%"+input.getValue()+"%");
    case IN:
      return (root, query, criteriaBuilder) -> 
              criteriaBuilder.in(root.get(input.getField()))
              .value(castToRequiredType(
                                root.get(input.getField()).getJavaType(), 
                                input.getValues()));
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
private Specification<Product> getSpecificationFromFilters(List<Filter> filter){
    Specification<Product> specification = 
                        where(createSpecification(queryInput.remove(0)));
    for (Filter input : filter) {
        specification = specification.and(createSpecification(input));
    }
    return specification;
}
```

Let's try to fetch all the products belonging to the `MOBILE` and `TV APPLIANCE` category and whose prices are below 1000 using 
our new shiny dynamic Specifications query generator.

```java
Filter categories = Filter.builder()
         .field("category")
         .operator(QueryOperator.IN)
         .values(List.of(Category.MOBILE.name(), 
                         Category.TV_APPLIANCES.name()))
         .build();

Filter lowRange = Filter.builder()
        .field("price")
        .operator(QueryOperator.LESS_THAN)
        .value("1000")
        .build();

List<Filter> filters = new ArrayList<>();
filters.add(lowRange);
filters.add(categories);

productAdapter.getQueryResult(filters);
```

The above code snippets should do for most filter cases but there is still a lot of room for improvement. Such as allowing queries 
based on nested entity properties (`manufacturingPlace.state`), limiting the fields on which want to allow filters, etc. 
Consider this as an open-end problem.

## Conclusion

Specifications provide us with a way to write reusable queries and also fluent APIs with which we can combine and build more
sophisticated queries.

One question that comes to mind is that if we can write any query with Specification then when do we prefer query methods? or should we ever prefer them?
I believe there are a couple of cases where Query Methods could come in handy. Let's say our entity has only a handful of fields, and it only needs to be queried in a certain way then why bother writing Specification when we can 
simply write a query method. And if in future requirements come in for more queries for the given entity then we can always refactor it to use Specifications. Also, Specifications won't be helpful in cases where we want to use database-specific 
features in a query say performing JSON queries in the case of Postgres DB.

All in all, Spring JPA Specifications is a great tool whether we want to create reusable predicates or want to generate typesafe queries 
programmatically.

Thank you for reading! You can find the working code at [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/specification).