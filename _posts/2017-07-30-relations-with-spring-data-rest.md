---

title: "Handling associations between entities with Spring Data Rest"
categories: [hacks]
modified: 2017-07-30
author: tom
tags: [spring, data, jpa, rest, relation, association, onetomany, manytoone, unidirectional, bidirectional]
comments: true
ads: false
---

{% include further_reading nav="spring-data-rest" %}

[Spring Data Rest](https://projects.spring.io/spring-data-rest/) allows to rapidly create a REST API to manipulate
and query a database by exposing Spring Data repositories via its [`@RepositoryRestResource`](http://docs.spring.io/autorepo/docs/spring-data-rest/current/api/org/springframework/data/rest/core/annotation/RepositoryRestResource.html) annotation.
 
Managing associations between entities with Spring Data Rest isn't quite self-explanatory. That's why in this post
I'm writing up what I learned about managing associations of different types with Spring Data Rest.

## The Domain Model

For the sake of example, we will use a simple domain model composed of `Customer` and `Address` entities. A `Customer`
may have one or more `Address`es. Each `Address` may or may not have one `Customer`. This relationship can
be modelled in different variants with JPA's `@ManyToOne` and `@OneToMany` annotations. For each
of those variants we will explore how to associate `Address`es and `Customer`s with Spring Data Rest.

Before associating two entities, Spring Data Rest assumes that both entities already exist. So for the
next sections, we assume that we already have created at least one `Address` and `Customer` entity. 
When working with Spring Data Rest, this implies that a Spring Data repository must exist for both entities.

<a name="manyToOne"></a>
## Associating entities from a unidirectional `@ManyToOne` relationship 

The easiest variant is also the cleanest and most maintainable. `Address` has a `Customer` field annotated with
`@ManyToOne`. A `Customer` on the other hand doesn't know anything about his `Address`es.

```java
@Entity
public class Address {
  @Id
  @GeneratedValue 
  private Long id;
  @Column
  private String street;
  @ManyToOne
  private Customer customer;
  // getters, setters omitted
}

@Entity
public class Customer {
  @Id
  @GeneratedValue
  private long id;
  @Column
  private String name;
  // getters, setters omitted
}
```

The following request will associate the `Customer` with ID 1 with the `Address` with ID 1:   

```text
PUT /addresses/1/customer HTTP/1.1
Content-Type: text/uri-list
Host: localhost:8080
Content-Length: 33

http://localhost:8080/customers/1
```

We send a `PUT` request to the [association resource](https://docs.spring.io/spring-data/rest/docs/current/reference/html/#repository-resources.association-resource)
between an `Address` and a `Customer`.
Note that the Content-Type is `text/uri-list` so valid payload must be a list of URIs. We provide the URI to
the customer resource with ID 1 to create the association in the database. The response for this result will
be a HTTP status 204 (no content).

## Associating entities from a unidirectional `@OneToMany` relationship

Coming from the other end of the relationship, we have a `Customer` that has a list of `Addresses` and the `Addresses` don't know about
the `Customer`s they are associated with.

```java
@Entity
public class Address {
  @Id
  @GeneratedValue 
  private Long id;
  @Column
  private String street;
  // getters, setters omitted
}

@Entity
public class Customer {
  @Id
  @GeneratedValue
  private long id;
  @Column
  private String name;
  @OneToMany(cascade=CascadeType.ALL)
  private List<Address> addresses;
  // getters, setters omitted
}
```

Again, a `PUT` request to the association resource will create an association between a customer and 
one or more addresses. The following request associates two `Address`es with the `Customer` with ID 1: 

<a name="manyToOne-request"></a>
```text
PUT customers/1/addresses HTTP/1.1
Content-Type: text/uri-list
Host: localhost:8080
Content-Length: 67

http://localhost:8080/addresses/1
http://localhost:8080/addresses/2
```

Note that a `PUT` request will remove all associations that may have been created before so that only those
associations remain that were specified in the uri list. A `POST` request, on the other hand, will add the
associations specified in the uri list to those that already exist.

## Associating entities in a bidirectional `@OneToMany`/`@ManyToOne` relationship

When both sides of the association know each other, we have a bidirectional association, which looks like this in 
JPA:

```java
@Entity
public class Address {
  @Id
  @GeneratedValue 
  private Long id;
  @Column
  private String street;
  @ManyToOne
  private Customer customer;
  // getters, setters omitted
  
}

@Entity
public class Customer {
  @Id
  @GeneratedValue
  private long id;
  @Column
  private String name;
  @OneToMany(cascade=CascadeType.ALL, mappedBy="customer")
  private List<Address> addresses;
  // getters, setters omitted
}
```

From the address-side (i.e. the `@ManyToOne`-side) of the relationship, this will work as [above](#manyToOne).

From the customer-side, however, a `PUT` request [like the one above](#manyToOne-request) that contains one or more links to an `Address`, will
not work. The association will not be stored in the database. That's because Spring Data Rest simply puts a 
list of `Address`es into the `Customer` object and tells Hibernate to store it. Hibernate, however, only
stores the associations in a bidirectional relationship if all `Address`es also know the `Customer` they
belong to (also see [this post](https://stackoverflow.com/questions/30464782/how-to-maintain-bi-directional-relationships-with-spring-data-rest-and-jpa)
on Stackoverflow). Thus, we need to add this information manually, for example with the following method
on the `Customer` entity:

```java
@PrePersist
@PreUpdate
public void updateAddressAssociation(){
  for(BidirectionalAddress address : this.addresses){
    address.setCustomer(this);
  }
}
```

Even then, it does not behave as in the unidirectional `@OneToMany` case. A `PUT` request will not delete 
all previously stored associations and a `POST` request will do nothing at all.

## Wrap Up

The thing to learn from this is not to use bidirectional associations in JPA. They are hard to handle
with and without Spring Data Rest. Stick with unidirectional associations and make explicit repository
calls for each use case you are implementing instead of counting on the supposed ease-of-use of
a bidirectional association.

## Example Code

Examples in code can be found in my [GitHub repo](https://github.com/thombergs/code-examples/tree/master/spring-data-rest-associations).
