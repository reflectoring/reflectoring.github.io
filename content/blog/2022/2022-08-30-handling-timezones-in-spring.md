
---
title: "Handling timezones in a Spring Boot Application"
categories: ["Spring"]
date: 2022-08-30 00:00:00 +1100
modified: 2022-08-30 00:00:00 +1100
authors: ["ranjani"]
description: "Handling timezones in a Spring Boot Application"
image: images/stock/0111-clock-1200x628-branded.jpg
url: spring-timezones
---

With most modern day applications deployed on the cloud, it is quite common for different layers of the application 
to run on different timezones. In this article, we will try to understand the options available in Java and map it in the 
context of a Spring application to effectively handle timezones.

## Understanding GMT, UTC and DST
- **Greenwich Mean Time (GMT)** is a timezone used in some parts of the world, mainly Europe and Africa.
GMT was replaced as the international standard time in 1972 by UTC.
- **Universal Coordinated Time (UTC)** is not a timezone. It is a universally preferred standard that can be used to display timezones.
- **Daylight Savings Time (DST)** is the practice of setting clocks forward by one hour in the summer months
and back again in the fall, to make better use of natural daylight. Neither GMT or UTC get affected by DST. To account for DST changes,
countries or states usually switch to another timezone. For instance in Australian summer, the states that observe DST will move from
Australian Eastern Standard Time (AEST) to Australian Eastern Daylight Time (AEDT).

Operations around dates, time and timezones can be confusing and prone to errors. To understand some problems around dates refer to this [article.](https://yourcalendricalfallacyis.com/)
In the further sections, we will take a look at the various options available to handle timezones when developing an application.

## Understanding the drawbacks of legacy time-based java.util classes

Let's look at a few reasons why you should choose to avoid the date-time classes in the java.util package when developing applications.

### Missing Timezone information

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/date.JPG" %}}

- `java.util.Date` represents an instant in time. 
- Also, it has no timezone information. So, it considers a **default system timezone** which could differ from location to location.
For instance, if a person runs this test from another country, he might see a different date and time derived from the given milliseconds.

### Custom Date creation
{{% image alt="settings" src="images/posts/handling-timezones-in-spring/customDate.JPG" %}}

- Creating a custom date with this API is very inconvenient. Firstly, the year starts with 1900, hence we must
subtract 1900 so that the right year is considered.
- Also to derive the months we need to use indexes 0-11. Here, since we need to create a date in August we would use 7 and not 8.

### Mutable Classes

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/mutableDate.JPG" %}}

- Immutability is a key concept that ensures that java objects are thread-safe and concurrent access does not lead to an inconsistent state.
- The Date API allows mutable methods such as `setHours`, `setMinutes`, `setDate`. Therefore, it becomes the responsibility
of the developer to clone the object and return it and not modify the existing object.
- Similarly, the Calendar object also has setter methods `setTimeZone`, `add` which allows an object to be modified.

### Format Dates

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/dateFormat.JPG" %}}

With the Date API, formatting can be quite tedious and the process involves numerous steps. 
As seen in the example above, there are various flaws in this process:
- The Date API itself does not store any formatting information. Therefore, we need to use it in combination with the SimpleDateFormat.
- The `SimpleDateFormat` class is not thread-safe so it cannot be used in multithreaded applications without proper synchronization.
- As the Date API does not have timezone information, we have to use the Calendar class. However, the Calendar object cannot be formatted, 
so we extract date from `Calendar` for formatting.

#### SQL Dates

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/sqlDates.JPG" %}}

- The API demonstrates poor design choice as java.sql.Date, java.sql.Time and java.sql.Timestamp all extend java.util.Date class.
Due to differences between the subclasses and java.util.Date, the [documentation](https://docs.oracle.com/javase/7/docs/api/java/sql/Timestamp.html) itself suggests to not use 
the Date class generically thus violating the **Liskov Substitution Principle.**

{{% info title="Deprecated methods" %}}
- Most of the methods in the `java.util.Date` class are [deprecated](https://docs.oracle.com/javase/7/docs/api/deprecated-list.html#method). However, they are not officially removed from the JDK library to support legacy applications.
- To overcome the shortcomings of java.util classes, Java8 introduced the new **DateTime API** in the `java.time` package. 
{{% /info %}}

### Java8 DateTime API

The [DateTime API](https://docs.oracle.com/javase/8/docs/api/java/time/package-summary.html) is heavily influenced by the [Jodatime](https://www.joda.org/joda-time/) library which was the defacto standard prior to Java8.
In this section, we will look at some commonly used date-time classes introduced with Java8. The utility methods used with the classes
simplify common time based operations.

| Class                      | Features                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|----------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `java.time.LocalDate`      | - Default format 'yyyy-MM-dd'. <br/> - Easy to create custom dates. java.util.Month can to used to specify pre-defined months.<br/> - Throws java.time.DateTimeException if invalid date is provided.<br/> - To get the LocalDate in a particular timezone, we need to pass java.time.ZoneId object.                                                                                                                                                           |
| `java.time.LocalTime`      | - Default format 'hh:mm:ss.zzz'. <br/> - Invalid time values provided to create a custom object leads to java.time.DateTimeException. <br/> - java.time.ZoneId object can be passed to create a zone-specific time.                                                                                                                                                                                                                                            |
| `java.time.LocalDateTime`  | - Default format 'yyyy-MM-dd-HH-mm-ss.zzz'. <br/> - Factory methods available that take LocalDate and LocalTime to create an instance of LocalDateTime. <br/> - Invalid inputs results java.time.DateTimeException and invalid ZoneId causes java.time.zone.ZoneRulesException.                                                                                                                                                                                |
| `java.time.ZonedDateTime`  | - By passing a ZoneId to a LocalDateTime object, we can create a ZonedDateTime instance. This will help us easily create zone-specific date time at the same instant. <br/> - If we take a closer look at the ZonedDateTime instance, we can see that the ZoneOffset is included which means DST is automatically handled as applicable in the respective timezones. <br/> - Stores date, time (precision upto nanoseconds), zone and zone offset information. |
| `java.time.OffsetDateTime` | - Stores date, time(precision of nanoseconds) and offset from UTC/GMT. <br/> - Since this object represents an Instant and an offset which allows local date-time to be obtained, it is a [preferred choice](https://docs.oracle.com/javase/8/docs/api/java/time/OffsetDateTime.html) when this value needs to be stored in a database.                                                                                                                                                                                               |

As seen from above, there are various advantages of using this API
1. All the classes discussed above have numerous utility methods that can compare, add, subtract, extract specific information while maintaining immutability.
2. Classes in the [`java.time.temporal`](https://docs.oracle.com/javase/8/docs/api/java/time/temporal/package-summary.html) package seamlessly work with the above classes to access, manipulate and perform complex date time operations.
3. The [`java.time.format.DateTimeFormatter`](https://docs.oracle.com/javase/8/docs/api/java/time/format/DateTimeFormatter.html) can be used with all Date-Time classes to format dates.
4. Allows backward compatibility with the legacy java.util classes so that they can be converted into the newer DateTime API.

Examples covering the features mentioned in this section are available here.