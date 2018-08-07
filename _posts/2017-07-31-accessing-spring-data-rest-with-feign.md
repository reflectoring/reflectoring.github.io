---

title: "Accessing a Spring Data REST API with Feign"
categories: [hacks]
modified: 2017-07-31
author: tom
tags: [spring, boot, feign, data, rest]
comments: true
ads: false
sidebar:
  nav: spring-data-rest
---


[Spring Data REST](https://projects.spring.io/spring-data-rest/) is a framework that automatically exposes a REST API for Spring Data repositories, thus
potentially saving a lot of manual programming work. [Feign](https://github.com/OpenFeign/feign) is a framework that allows easy creation of REST
clients and is well integrated into the [Spring Cloud ecosystem](http://projects.spring.io/spring-cloud/spring-cloud.html#spring-cloud-feign). Together, both frameworks seem to be a
natural fit, especially in a microservice environment.

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/spring-cloud/feign-with-spring-data-rest" %}

However, they don't play along by default. This blog post shows what has to be done in order to be able
to access a Spring Data REST API with a Spring Boot Feign client.

## The Symptom: Serialization Issues

When accessing a Spring Data REST API with a Feign client you may trip over serialization issues like this one:

```
Can not deserialize instance of java.util.ArrayList out of START_OBJECT token
```

This error occurs when Feign tries to deserialize a JSON object provided by a Spring Data REST server. The cause for this
is simply that Spring Data REST by default creates JSON in a Hypermedia format called [HAL](https://en.wikipedia.org/wiki/Hypertext_Application_Language)
and Feign by default does not know how to parse it. The response Spring Data REST creates for a GET request to a collection resource 
like `http://localhost:8080/addresses` may look something like this:

```JSON
{
  "_embedded" : {
    "addresses" : [ {
      "street" : "Elm Street",
      "_links" : {...}
      }
    }, {
      "street" : "High Street",
      "_links" : {...}
    } ]
  },
  "_links" : {
    "self" : {
      "href" : "http://localhost:8080/addresses/"
    },
    "profile" : {
      "href" : "http://localhost:8080/profile/addresses"
    }
  }
}
```

The deserialization issue comes from the fact that Feign by default expects a simple array of address objects
and instead gets a JSON object.

## The Solution: Help Feign understand Hypermedia

To enable Feign to understand the HAL JSON format, we have to take the following steps.

### Add Dependency to Spring HATEOAS
 
Spring Data REST uses [Spring HATEOAS](http://projects.spring.io/spring-hateoas/) to generate the HAL format on the 
server side. Spring HATEOAS can just as well be used on the client side to deserialize the HAL-formatted JSON. Thus,
simply add the following dependency to your client (Gradle notation):

```text
compile('org.springframework.boot:spring-boot-starter-hateoas')
```

### Enable Spring Boot's Hypermedia Support

Next, we have to tell our Spring Boot client application to configure its JSON parsers to use Spring HATEOAS.
This can be done by simply annotating your Application class with the `@EnableHypermedia` annotation:

```java
@EnableHypermediaSupport(type = EnableHypermediaSupport.HypermediaType.HAL)
@SpringBootApplication
@EnableFeignClients
public class DemoApplication {
  public static void main(String[] args) {
    SpringApplication.run(DemoApplication.class, args);
  }
}
```

### Use `Resource` and `Resources` instead of your Domain objects

Feign will still not be able to map HAL-formatted JSON into your domain objects. That's because your domain object
most likely don't contain properties like `_embedded` or `_links` that are part of that JSON. 
To make these properties known to a JSON parser, Spring HATEOAS provides the two generic 
classes `Resource<?>` and `Resources<?>`.

So, in your Feign client, instead of returning domain objects like `Address` or `List<Address>`
return `Resource<Address` or `Resources<Address>` instead:

```java
@FeignClient(value = "addresses", path = "/addresses")
public interface AddressClient {

  @RequestMapping(method = RequestMethod.GET, path = "/")
  Resources<Address> getAddresses();

  @RequestMapping(method = RequestMethod.GET, path = "/{id}")
  Resource<Address> getAddress(@PathVariable("id") long id);

}
```

Feign will then be able to successfully parse the HAL-formatted JSON into the `Resource` 
or `Resources` objects.

## Accessing and Manipulating Associations between Entities with Feign

Once feign is configured to play along with Spring Data REST, simple CRUD operations are just a matter
of creating the correct methods annotated with `@RequestMapping`.

However, there is still the question of how to access and create associations between entities with Feign, since 
managing associations with Spring Data Rest is not self-explanatory (see [this blog post](/relations-with-spring-data-rest)).

The answer to that is actually also just a matter of creating the correct `@RequestMapping`. Assuming that 
`Address` has a `@ManyToOne` relationship to `Customer`, creating an association to an (existing) `Customer`
can be implemented with a PUT request of Content-Type `text/uri-list` to the [association resource](https://docs.spring.io/spring-data/rest/docs/current/reference/html/#repository-resources.association-resource) 
`/addresses/{addressId}/customer` as shown below. The other way around, reading 
the `Customer` associated to an `Address` can be done with a GET request to the endpoint `/addresses/{addressId}/customer`. 

```java
@FeignClient(value = "addresses", path = "/addresses")
public interface AddressClient {

  @RequestMapping(method = RequestMethod.PUT, consumes = "text/uri-list", path="/{addressId}/customer")
  Resource<Address> associateWithCustomer(@PathVariable("addressId") long addressId, @RequestBody String customerUri);

  @RequestMapping(method = RequestMethod.GET, path="/{addressId}/customer")
  Resource<Customer> getCustomer(@PathVariable("addressId") long addressId);

}
```

