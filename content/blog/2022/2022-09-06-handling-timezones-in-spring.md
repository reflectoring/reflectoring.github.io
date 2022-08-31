
---
title: "Handling timezones in a Spring Boot Application"
categories: ["Spring"]
date: 2022-09-06 00:00:00 +1100
modified: 2022-09-06 00:00:00 +1100
authors: ["ranjani"]
description: "Handling timezones in a Spring Boot Application"
image: images/stock/0111-clock-1200x628-branded.jpg
url: spring-timezones
---

With most modern day applications deployed on the cloud, it is quite common for the different layers of the application 
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

### java.util.Date API

#### Timezone missing

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/date.JPG" %}}

- java.util.Date represents an instant in time. 
- Also, it has no timezone information. So, it considers a default system timezone which could differ from location to location.
If a person runs this test in another city, he might see a different date and time derived from the given milliseconds.

#### Custom Date creation
{{% image alt="settings" src="images/posts/handling-timezones-in-spring/customDate.JPG" %}}

- Creating a custom date with this API is very inconvenient. Firstly, the year starts with 1900, hence we must
subtract 1900 so that the right year is considered.
- Also to derive the months we should use indexes 0-11. Here since we need to create a date in August we would use 7 and not 8.

#### Mutable Classes

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/mutableDate.JPG" %}}

- Unlike the String API, the Date API allows methods such as setHours, setMinutes, setDate etc. Therefore, it becomes the responsibility
of the developer to clone the object and return it and not mutate the existing object.
- Similarly, the Calendar object also has setter methods setTimeZone, add which allows the object to be modified.

#### Format Dates

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/dateFormat.JPG" %}}

With the Date API, formatting can be quite tedious and the process involves numerous steps. 
As seen in the example above, there are various flaws in this process
- The SimpleDateFormat class is not thread-safe so it cannot be used in multi-threaded applications without proper synchronization.
- Since the Date API does not have timezone information, here we use the Calendar class. However, the Calendar class cannot be formatted. 
So we extract date from the Calendar and use it for formatting.
- The TimeZone class has timezones represented as String. This makes it more prone to runtime errors since the compiler cannot flag it at compile-time.

#### SQL Dates

- The API demonstrates poor design choice as java.sql.Date, java.sql.Time and java.sql.Timestamp all extend java.util.Date class.
Due to differences between the subclasses and java.util.Date, the [documentation](https://docs.oracle.com/javase/7/docs/api/java/sql/Timestamp.html) itself suggests to not use 
the Date class generically thus violating the Liskov Substitution Principle.


