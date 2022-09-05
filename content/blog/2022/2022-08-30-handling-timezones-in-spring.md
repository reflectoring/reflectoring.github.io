
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

## Drawbacks of legacy time-based java.util classes

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
- Also to derive the months we need to use indexes 0-11. In this example, to create a date in August we would use 7 and not 8.

### Mutable Classes

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/mutableDate.JPG" %}}

- Immutability is a key concept that ensures that java objects are thread-safe and concurrent access does not lead to an inconsistent state.
- The Date API allows mutable methods such as `setHours`, `setMinutes`, `setDate`. Therefore, it becomes the responsibility
of the developer to clone the object before use.
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

## Java8 DateTime API

The [DateTime API](https://docs.oracle.com/javase/8/docs/api/java/time/package-summary.html) is heavily influenced by the [Jodatime](https://www.joda.org/joda-time/) library which was the defacto standard prior to Java8.
In this section, we will look at some commonly used date-time classes and its corresponding operations in this section.

### LocalDate

[java.time.LocalDate](https://docs.oracle.com/javase/8/docs/api/java/time/LocalDate.html) is an immutable date object that does not store time or timezone information. However, we can pass the `java.time.ZoneId` object to get the local date in a particular timezone.

Sample conversion examples: 

````java

        LocalDate today = LocalDate.now();
        System.out.println("Today's Date in the dafault format : " + today);

        LocalDate customDate = LocalDate.of(2022, Month.SEPTEMBER, 2);
        System.out.println("Custom Date in the default format : " + customDate);

        LocalDate invalidDate = LocalDate.of(2022, Month.SEPTEMBER, 31);
        System.out.println("Invalid Date with Exception : java.time.DateTimeException: " +
                "Invalid date 'SEPTEMBER 31' : " + invalidDate);

        LocalDate defaultZoneDate = LocalDate.now();
        System.out.println("Default Zone: " + ZoneId.systemDefault());
        LocalDate zoneDate = LocalDate.now(ZoneId.of("Europe/London"));
        System.out.println("Custom zone: " + zoneDate);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
        System.out.println("Formatted Date : " + defaultZoneDate.format(formatter));

````

Output:

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/localDateOutput.JPG" %}}

### LocalTime

[java.time.LocalTime](https://docs.oracle.com/javase/8/docs/api/java/time/LocalTime.html) is an immutable object that stores time upto nanosecond precision. It does not store date or timezone information. However, `java.time.ZoneId` can be used to get the time at a specific timezone.

Sample Conversion Examples:

````java

        LocalTime now = LocalTime.now();
        System.out.println("Current Time in default format : " + now);

        LocalTime customTime = LocalTime.of(21, 40, 50);
        System.out.println("Custom Time: " + customTime);

        LocalTime invalidTime = LocalTime.of(25, 40, 50);
        System.out.println("Invalid Time: java.time.DateTimeException: " +
                "Invalid value for HourOfDay (valid values 0 - 23): 25 :=" + invalidTime);

        LocalTime zoneTime = LocalTime.now(ZoneId.of("Europe/London"));
        System.out.println("Zone-specific time : " + zoneTime);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        System.out.println("Formatted Date : " + zoneTime.format(formatter));
````

Output:

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/localTimeOutput.JPG" %}}

### LocalDateTime

[java.time.LocalDateTime](https://docs.oracle.com/javase/8/docs/api/java/time/LocalDateTime.html) is an immutable object that is a combination of both `java.time.LocalDate` and `java.time.LocalTime`.

Sample Conversion examples:

````java
        LocalDateTime currentDateTime = LocalDateTime.now();
        System.out.println("Current Date/Time in system default timezone : " + currentDateTime);

        LocalDateTime currentUsingLocals = LocalDateTime.of(LocalDate.now(), LocalTime.now());
        System.out.println("Current Date/Time with LocalDate and LocalTime in system timezone : " + currentUsingLocals);

        LocalDateTime customDateTime = LocalDateTime.of(2022, Month.SEPTEMBER, 1, 10, 30, 59);
        System.out.println("Custom Date/Time with custom date and custom time : " + customDateTime);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");
        System.out.println("Formatted Date/Time : " + LocalDateTime.now().format(formatter));

        LocalDateTime zoneDateTime = LocalDateTime.now(ZoneId.of("+02:00"));
        System.out.println("Zoned Date Time : " + zoneDateTime);

        String currentDateTimeStr = "20-02-2022 10:30:45";
        DateTimeFormatter format = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");
        System.out.println("Parsed From String to Object : " + LocalDateTime.parse(currentDateTimeStr, format));

        LocalDateTime invalidZoneDateTime = LocalDateTime.now(ZoneId.of("Europ/London"));
        System.out.println("Invalid Zone with Exception : java.time.zone.ZoneRulesException: " +
                "Unknown time-zone ID: Europ/London: " + invalidZoneDateTime);
````

Output:

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/localDateTimeOutput.JPG" %}}

### ZonedDateTime

[java.time.ZonedDateTime](https://docs.oracle.com/javase/8/docs/api/java/time/ZonedDateTime.html) is an immutable representation of date, time and timezone. It automatically handles Daylight Saving Time(DST) clock changes via the `java.time.ZoneId` which internally resolves the zone offset.

Sample conversion example:

````java
        ZonedDateTime currentZoneDateTime = ZonedDateTime.now();
        System.out.println("Current system zone date/time : " + currentZoneDateTime);

        ZonedDateTime withLocalDateTime = ZonedDateTime.of(LocalDateTime.now(), ZoneId.systemDefault());
        System.out.println("Convert LocalDateTime to ZonedDateTime : " + withLocalDateTime);

        ZonedDateTime withLocals = ZonedDateTime.of(LocalDate.now(), LocalTime.now(), ZoneId.systemDefault());
        System.out.println("ZonedDateTime from LocalDate and LocalTime : " + withLocals);

        ZonedDateTime customZoneDateTime = ZonedDateTime.of(2022, Month.FEBRUARY.getValue(), MonthDay.now().getDayOfMonth(), 20, 45, 50, 55, ZoneId.of("Europe/London"));
        System.out.println("ZonedDateTime Custom : " + customZoneDateTime);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss a");
        String timeStamp1 = "2022-03-27 10:15:30 AM"; // This String has no timezone information. Hence we need to provide one for it to be successfully parsed.
        ZonedDateTime parsedZonedTime = ZonedDateTime.parse(timeStamp1, formatter.withZone(ZoneId.of("Europe/London")) );
        System.out.println("String to ZonedTimeStamp for Europe/London : " + parsedZonedTime);

        ZonedDateTime sameInstantDiffTimezone = parsedZonedTime.withZoneSameInstant(ZoneId.of("Asia/Calcutta"));
        System.out.println("Change from 1 timezone to another : " + sameInstantDiffTimezone);
````

Output:

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/zonedDateTimeOutput.JPG" %}}


### OffsetDateTime

[java.time.OffsetDateTime](https://docs.oracle.com/javase/8/docs/api/java/time/OffsetDateTime.html) is an immutable representation of `java.time.Instant` that represents an instant in Time along with an offset from UTC/GMT.
When zone information needs to be saved in the Database this format is preferred as it would always represent the same instant on the timeline (especially when the server and database represent different timezones, conversion that represents time at the same instant would be required).  

Sample conversion example:

````java
        OffsetDateTime currentDateTime = OffsetDateTime.now();
        System.out.println("System default timezone current zone offset date/time : " + currentDateTime);

        // Check for format difference
        ZonedDateTime currentZoneDateTime = ZonedDateTime.now();
        System.out.println("Current system zone date/time : " + currentZoneDateTime);

        ZoneOffset zoneOffSet= ZoneOffset.of("+01:00");
        OffsetDateTime offsetDateTime = OffsetDateTime.now(zoneOffSet);
        System.out.println("Europe/London zone offset date/time : " + offsetDateTime);

        OffsetDateTime fromLocals = OffsetDateTime.of(LocalDate.now(), LocalTime.now(), currentDateTime.getOffset());
        System.out.println("Get Offset date/time from Locals : " + fromLocals);

        OffsetDateTime fromLocalDateTime = OffsetDateTime.of(LocalDateTime.of(2022, Month.NOVEMBER, 1, 10, 10, 10), currentDateTime.getOffset());
        System.out.println("Get Offset date/time from LocalDateTime with Offset at the current Instant considered " +
                "(does not consider DST at custom date): " + fromLocalDateTime);

        OffsetDateTime fromLocalsWithDefinedOffset = OffsetDateTime.of(LocalDate.now(), LocalTime.now(), ZoneOffset.systemDefault().getRules().getOffset(LocalDateTime.of(2022, Month.NOVEMBER, 1, 10, 10, 10)));
        System.out.println("Get Offset date/time from Local with offset for custom LocalDateTime considered " +
                "(Considers DST at custom date) : " + fromLocalsWithDefinedOffset);

        OffsetDateTime sameInstantDiffOffset = currentDateTime.withOffsetSameInstant(ZoneOffset.of("+01:00"));
        System.out.println("Same instant at a different offset : " + sameInstantDiffOffset);

        OffsetDateTime dt = OffsetDateTime.parse("2011-12-03T10:15:30+01:00", DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'");
        System.out.println("OffsetDateTime parsed and formatted" + fmt.format(dt));

        OffsetDateTime convertFromZoneToOffset = currentZoneDateTime.toOffsetDateTime();
        System.out.println("Convert from ZonedDateTime to OffsetDateTime : " + convertFromZoneToOffset);

````

Output:

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/offsetDateTimeOutput.JPG" %}}

## Compatibility with the legacy API

As a part of the Date/Time API, methods have been introduced in the legacy classes to convert to the newer API objects.

Sample Code Conversion:

````java

    @Test
    public void testWorkingWithLegacyDateInJava8() {
        Date date = new Date();
        System.out.println("java.util.Date : " + date);
        Instant instant = date.toInstant();
        System.out.println("Convert java.util.Date to Instant : " + instant);

        ZonedDateTime zdt = instant.atZone(ZoneId.systemDefault());
        System.out.println("Use Instant to convert to ZonedDateTime : " + zdt);

        LocalDate ld = zdt.toLocalDate();
        System.out.println("Convert to LocalDate : " + ld);

        ZonedDateTime zdtDiffZone = zdt.withZoneSameInstant(ZoneId.of("Europe/London"));
        System.out.println("ZonedDateTime of a different zone : " + zdtDiffZone);
    }

    @Test
    public void testWorkingWithLegacyCalendarInJava8() {
        Calendar calendar = Calendar.getInstance();
        System.out.println("java.util.Calendar : " + calendar);

        Date calendarDate = calendar.getTime();
        System.out.println("Calendar Date : " + calendarDate);

        Instant instant = calendar.toInstant();
        System.out.println("Convert java.util.Calendar to Instant : " + instant + " for timezone : " + calendar.getTimeZone());

        ZonedDateTime instantAtDiffZone = instant.atZone(ZoneId.of("Europe/London"));
        System.out.println("Instant at a different zone : " + instantAtDiffZone);

        LocalDateTime localDateTime = instantAtDiffZone.toLocalDateTime();
        System.out.println("LocalDateTime value : " + localDateTime);

    }

````

As we can see in the examples, methods are provided to convert to `java.time.Instant` which represents a timestamp at a particular instant.

Output: 

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/compatibilityOutput.JPG" %}}

## Advantages of the new DateTime API
- Considering the examples of both legacy and new API, we see that with the Date/Time API, formatting, parsing, timezone conversions can be easily performed.
- Also, exception handling with classes `java.time.DateTimeException`, `java.time.zone.ZoneRulesException` are well-detailed and easy to comprehend.
- All classes are immutable making them thread-safe.
- Each of the classes provide a variety of utility methods that help compute, extract, modify date-time information thus catering to most commonly needed usecases.
- Additional complex date computations are available with `java.time.Temporal` package, `java.time.Period` and `java.time.Duration` classes.
- Methods are added to the legacy APIs to convert objects to `java.time.Instant` and let the legacy code use the newer APIs.