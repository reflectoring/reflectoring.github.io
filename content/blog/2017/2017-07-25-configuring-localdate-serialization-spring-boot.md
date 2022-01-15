---
authors: [tom]
title: Serializing LocalDate to JSON in Spring Boot
categories: ["Spring Boot"]
date: 2017-07-25
excerpt: "An extensive list of things to think through when starting a new Java-based software project."
image: images/stock/0043-calendar-1200x628-branded.jpg
url: configuring-localdate-serialization-spring-boot
---



Today, I stumbled (once again) over `LocalDate` in a Spring Boot application. `LocalDate` came with Java
8 and is part of the new standard API in Java for working with dates. However, if you want to effectively
use `LocalDate` over `Date` in a Spring Boot application, you need to take some extra care, since not all tools support 
`LocalDate` by default, yet.

## Serializing `LocalDate` with Jackson 

Spring Boot includes the popular [Jackson](https://github.com/FasterXML/jackson) library 
as JSON (de-)serializer. By default, Jackson serializes a `LocalDate` object to something like this:

```JSON
{
  "year": 2017,
  "month": "AUGUST",
  "era": "CE",
  "dayOfMonth": 1,
  "dayOfWeek": "TUESDAY",
  "dayOfYear": 213,
  "leapYear": false,
  "monthValue": 8,
  "chronology": {
      "id":"ISO",
      "calendarType":"iso8601"
   }
}
```

That's a very verbose representation of a date in JSON, wouldn't you say? We're only really
interested in the year, month and day of month in this case, so that's exactly what should be 
contained in the JSON. 

## The Jackson `JavaTimeModule`

To configure Jackson to map a `LocalDate` into a String like `1982-06-23`, you need to activate
the `JavaTimeModule`. You can register the module with a Jackson `ObjectMapper`
instance like this:

```java
ObjectMapper mapper = new ObjectMapper();
mapper.registerModule(new JavaTimeModule());
mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
```

The module teaches the `ObjectMapper` how to work with `LocalDate`s and the parameter 
`WRITE_DATES_AS_TIMESTAMPS` tells the mapper to represent a Date as a String in JSON.

The `JavaTimeModule` is not included in Jackson by default, so you have to include it as a dependency
(gradle notation):

```java
compile "com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.8.6"
```

## Mapping `LocalDate` in a Spring Boot application

When using Spring Boot, an `ObjectMapper` instance is already provided by default (see the 
[reference docs](https://docs.spring.io/spring-boot/docs/current-SNAPSHOT/reference/htmlsingle/#howto-customize-the-jackson-objectmapper)
on how to customize it in detail). 

However, you still need to add the dependency to `jackson-datatype-jsr310` to your project.
The `JavaTimeModule` is then activated by default. The only thing left to do is to set the following
property in your `application.yml` (or `application.properties`):

```yaml
spring:
  jackson:
    serialization:
      WRITE_DATES_AS_TIMESTAMPS: false
```
