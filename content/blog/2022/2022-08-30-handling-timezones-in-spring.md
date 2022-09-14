
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

It is common to encounter applications that run on different timezones. Handling date and time operations consistently across multiple layers of an application can be tricky.

In this article, we will try to understand the options available in Java and apply them in the context of a Spring application to effectively handle timezones.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/timezones" %}}

## Understanding GMT, UTC and DST
- **Greenwich Mean Time (GMT)** is a timezone used in some parts of the world, mainly Europe and Africa.
It was recommended as the prime meridian of the world in 1884 and eventually became the basis for global system of timezones.
However, the United Nations officially adopted UTC as a standard in 1972 since it was more accurate than GMT for setting clocks.
- **Universal Coordinated Time (UTC)** is not a timezone. It is a universally preferred standard that can be used to display timezones.
- **Daylight Savings Time (DST)** is the practice of setting clocks forward by one hour in the summer months
and back again in the fall, to make better use of natural daylight. **Neither GMT or UTC get affected by DST**. To account for DST changes,
countries or states usually switch to another timezone. For instance in Australian summer, the states that observe DST will move from
Australian Eastern Standard Time (AEST) to Australian Eastern Daylight Time (AEDT).

Operations around dates, time and timezones can be confusing and prone to errors. To understand some problems around dates refer to this [article.](https://yourcalendricalfallacyis.com/)
We will deep-dive into various aspects of handling timezones in the further sections.

## Drawbacks of Legacy `java.util` Date Classes

Let's look at a few reasons why you should avoid the date and time classes in the `java.util` package when developing applications.

### Missing Timezone Information

````java
    @Test
    public void testCurrentDate() {
        Date now = new Date();
        Date before = new Date(1661832030000L);
        assertThat(now).isAfter(before);
        }

````

- `java.util.Date` represents an instant in time. 
- Also, it has no timezone information. So, **it considers any given date to be in the default system timezone** which could differ from location to location.
For instance, if a person runs this test from another country, they might see a different date and time derived from the given milliseconds.

### Creating Date Objects
````java
@Test
public void testCustomDate() {
        System.out.println("Create date for 17 August 2022 23:30");
        int year = 2022-1900;
        int month = 8-1;
        Date customDate = new Date(year, month, 17, 23, 30);
        assertThat(customDate.getYear()).isEqualTo(year);
        assertThat(customDate.getMonth()).isEqualTo(month);
        assertThat(customDate.getDate()).isEqualTo(17);
        }
````

- Creating a custom date with this API is very inconvenient. Firstly, the year starts with 1900, hence we must
subtract 1900 so that the right year is considered.
- Also to derive the months we need to use indexes 0-11. In this example, to create a date in August we would use 7 and not 8.

### Mutable Classes

````java
 @Test
public void testMutableClasses() {
        System.out.println("Create date for 17 August 2022 23:30");
        int year = 2022-1900;
        int month = 8-1;
        Date customDate = new Date(year, month, 17, 23, 30);
        assertThat(customDate.getHours()).isEqualTo(23);
        assertThat(customDate.getMinutes()).isEqualTo(30);
        customDate.setHours(20);
        customDate.setMinutes(50);
        assertThat(customDate.getHours()).isEqualTo(20);
        assertThat(customDate.getMinutes()).isEqualTo(50);

        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Australia/Sydney"));
        assertThat(calendar.getTimeZone()).isEqualTo(TimeZone.getTimeZone("Australia/Sydney"));
        calendar.setTimeZone(TimeZone.getTimeZone("Europe/London"));
        assertThat(calendar.getTimeZone()).isEqualTo(TimeZone.getTimeZone("Europe/London"));
        }
````

- Immutability is a key concept that ensures that java objects are thread-safe and concurrent access does not lead to an inconsistent state.
- The Date API **provides mutators** such as `setHours()`, `setMinutes()`, `setDate()`. 
- Similarly, the `Calendar` class also has setter methods `setTimeZone()`, `add()` which allows an object to be modified.
- Since the date objects are mutable, **it becomes the responsibility
  of the developer to clone the object before use**.

### Formatting Dates

````java
@Test
public void testDateFormatter() {
        TimeZone zone = TimeZone.getTimeZone("Europe/London");
        DateFormat dtFormat = new SimpleDateFormat("dd/MM/yyyy HH:mm");
        Calendar cal = Calendar.getInstance(zone);
        Date date = cal.getTime();
        String strFormat = dtFormat.format(date);
        assertThat(strFormat).isNotNull();

        }
````

With the `Date` API, formatting can be quite tedious and the process involves numerous steps. 
As seen in the example above, there are various flaws in this process:
- The `Date` API itself does not store any formatting information. Therefore, we need to use it in combination with the `SimpleDateFormat`.
- The `SimpleDateFormat` class is not thread-safe so it **cannot be used in multithreaded applications without proper synchronization**.
- As the Date API **does not have timezone information**, we have to use the `Calendar` class. However, it cannot be formatted, 
so we extract the date from `Calendar` for formatting.

#### SQL Dates

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/sqlDates.JPG" %}}

- The API demonstrates poor design choice as `java.sql.Date`, `java.sql.Time` and `java.sql.Timestamp` all extend `java.util.Date` class.
Due to differences between the subclasses and java.util.Date, the [documentation](https://docs.oracle.com/javase/7/docs/api/java/sql/Timestamp.html) itself suggests to not use 
the Date class generically thus violating the [Liskov Substitution Principle](https://reflectoring.io/lsp-explained/).

{{% info title="Deprecated methods" %}}
- Most of the methods in the `java.util.Date` class are [deprecated](https://docs.oracle.com/javase/7/docs/api/deprecated-list.html#method). However, they are not officially removed from the JDK library to support legacy applications.
- To overcome the shortcomings of `java.util` classes, Java 8 introduced the new **`DateTime` API** in the `java.time` package. 
{{% /info %}}

## Java8 `DateTime` API

The [`DateTime` API](https://docs.oracle.com/javase/8/docs/api/java/time/package-summary.html) is heavily influenced by the [Jodatime](https://www.joda.org/joda-time/) library which was the defacto standard prior to Java 8.
In this section, we will look at some commonly used date-time classes and its corresponding operations in this section.

### `LocalDate`

**[java.time.LocalDate](https://docs.oracle.com/javase/8/docs/api/java/time/LocalDate.html)** is an immutable date object that does not store time or timezone information. However, we can pass the `java.time.ZoneId` object to get the local date in a particular timezone.

Examples:  

````java
@Test
public void testLocalDate() {
        LocalDate today = LocalDate.now(clock);
        assertThat(today.get(ChronoField.MONTH_OF_YEAR)).isPositive();
        assertThat(today.get(ChronoField.YEAR)).isPositive();
        assertThat(today.get(ChronoField.DAY_OF_MONTH)).isPositive();
        Assertions.assertThrows(UnsupportedTemporalTypeException.class, () -> {
        today.get(ChronoField.HOUR_OF_DAY);
        });

        LocalDate customDate = LocalDate.of(2022, Month.SEPTEMBER, 2);
        assertThat(customDate.getYear()).isEqualTo(2022);
        assertThat(customDate.getMonth()).isEqualTo(Month.SEPTEMBER);
        assertThat(customDate.getDayOfMonth()).isEqualTo(2);
        Assertions.assertThrows(UnsupportedTemporalTypeException.class, () -> {
        customDate.get(ChronoField.HOUR_OF_DAY);
        });

        assertThat(clock.getZone()).isEqualTo(ZoneId.of("Australia/Sydney"));
        LocalDate zoneDate = LocalDate.now(ZoneId.of("America/Anchorage"));
        assertThat(today).isCloseTo(zoneDate, within(1, ChronoUnit.DAYS));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
        assertThat(zoneDate).isEqualTo(LocalDate.parse(zoneDate.format(formatter), formatter));

        Assertions.assertThrows(DateTimeException.class, () -> {
        LocalDate.of(2022, Month.SEPTEMBER, 31);
        });
        }
````

### `LocalTime`

**[java.time.LocalTime](https://docs.oracle.com/javase/8/docs/api/java/time/LocalTime.html)** is an immutable object that stores time up to nanosecond precision. It does not store date or timezone information. However, `java.time.ZoneId` can be used to get the time at a specific timezone.

Sample Conversion Examples:

````java
@Test
public void testLocalTime() {
        LocalTime now = LocalTime.now(clock);
        assertThat(now.get(ChronoField.HOUR_OF_DAY)).isPositive();
        assertThat(now.get(ChronoField.MINUTE_OF_DAY)).isPositive();
        assertThat(now.get(ChronoField.SECOND_OF_DAY)).isPositive();
        Assertions.assertThrows(UnsupportedTemporalTypeException.class, () -> {
        now.get(ChronoField.MONTH_OF_YEAR);
        });

        LocalTime customTime = LocalTime.of(21, 40, 50);
        assertThat(customTime.get(ChronoField.HOUR_OF_DAY)).isEqualTo(21);
        assertThat(customTime.get(ChronoField.MINUTE_OF_HOUR)).isEqualTo(40);
        assertThat(customTime.get(ChronoField.SECOND_OF_MINUTE)).isEqualTo(50);

        LocalTime zoneTime = LocalTime.now(ZoneId.of("America/Anchorage"));
        assertThat(now).isCloseTo(zoneTime, within(18, ChronoUnit.HOURS));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss");
        assertThat(LocalTime.parse(zoneTime.format(formatter))).isCloseTo(zoneTime, within(1, ChronoUnit.SECONDS));
        System.out.println("Formatted Date : " + zoneTime.format(formatter));

        Assertions.assertThrows(DateTimeException.class, () -> {
        LocalTime.of(25, 40, 50);
        });
        }
````

### LocalDateTime

**[java.time.LocalDateTime](https://docs.oracle.com/javase/8/docs/api/java/time/LocalDateTime.html)** is an immutable object that is a combination of both `java.time.LocalDate` and `java.time.LocalTime`.

Sample Conversion examples:

````java
@Test
public void testLocalDateTime() {
        LocalDateTime currentDateTime = LocalDateTime.now(clock);
        assertThat(currentDateTime.get(ChronoField.DAY_OF_MONTH)).isPositive();
        assertThat(currentDateTime.get(ChronoField.MONTH_OF_YEAR)).isPositive();
        assertThat(currentDateTime.get(ChronoField.YEAR)).isPositive();
        assertThat(currentDateTime.get(ChronoField.HOUR_OF_DAY)).isPositive();
        assertThat(currentDateTime.get(ChronoField.MINUTE_OF_DAY)).isPositive();
        assertThat(currentDateTime.get(ChronoField.SECOND_OF_DAY)).isPositive();

        LocalDateTime currentUsingLocals = LocalDateTime.of(LocalDate.now(clock), LocalTime.now(clock));
        assertThat(currentDateTime).isCloseTo(currentUsingLocals, within(5, ChronoUnit.SECONDS));

        LocalDateTime customDateTime = LocalDateTime.of(2022, Month.SEPTEMBER, 1, 10, 30, 59);
        assertThat(customDateTime.get(ChronoField.DAY_OF_MONTH)).isEqualTo(1);
        assertThat(customDateTime.get(ChronoField.MONTH_OF_YEAR)).isEqualTo(Month.SEPTEMBER.getValue());
        assertThat(customDateTime.get(ChronoField.YEAR)).isEqualTo(2022);
        assertThat(customDateTime.get(ChronoField.HOUR_OF_DAY)).isEqualTo(10);
        assertThat(customDateTime.get(ChronoField.MINUTE_OF_HOUR)).isEqualTo(30);
        assertThat(customDateTime.get(ChronoField.SECOND_OF_MINUTE)).isEqualTo(59);

        LocalDateTime zoneDateTime = LocalDateTime.now(ZoneId.of("+02:00"));
        assertThat(currentUsingLocals).isCloseTo(zoneDateTime, within(9, ChronoUnit.HOURS));

        String currentDateTimeStr = "20-02-2022 10:30:45";
        DateTimeFormatter format = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");
        LocalDateTime parsedTime = LocalDateTime.parse(currentDateTimeStr, format);
        assertThat(parsedTime.get(ChronoField.DAY_OF_MONTH)).isEqualTo(20);
        assertThat(parsedTime.get(ChronoField.MONTH_OF_YEAR)).isEqualTo(Month.FEBRUARY.getValue());
        assertThat(parsedTime.get(ChronoField.YEAR)).isEqualTo(2022);
        assertThat(parsedTime.get(ChronoField.HOUR_OF_DAY)).isEqualTo(10);
        assertThat(parsedTime.get(ChronoField.MINUTE_OF_HOUR)).isEqualTo(30);
        assertThat(parsedTime.get(ChronoField.SECOND_OF_MINUTE)).isEqualTo(45);

        Assertions.assertThrows(ZoneRulesException.class, () -> {
        LocalDateTime.now(ZoneId.of("Europ/London"));
        });
        }

````

### ZonedDateTime

**[java.time.ZonedDateTime](https://docs.oracle.com/javase/8/docs/api/java/time/ZonedDateTime.html)** is an immutable representation of date, time and timezone. It automatically handles Daylight Saving Time(DST) clock changes via the `java.time.ZoneId` which internally resolves the zone offset.

Sample conversion example:

````java
@Test
public void testZonedDateTime() {
        ZonedDateTime currentZoneDateTime = ZonedDateTime.now(clock);
        assertThat(currentZoneDateTime.getZone()).isEqualTo(ZoneId.of("Australia/Sydney"));
        assertThat(currentZoneDateTime.get(ChronoField.DAY_OF_MONTH)).isPositive();
        assertThat(currentZoneDateTime.get(ChronoField.MONTH_OF_YEAR)).isPositive();
        assertThat(currentZoneDateTime.get(ChronoField.YEAR)).isPositive();
        assertThat(currentZoneDateTime.get(ChronoField.HOUR_OF_DAY)).isPositive();
        assertThat(currentZoneDateTime.get(ChronoField.MINUTE_OF_HOUR)).isPositive();
        assertThat(currentZoneDateTime.get(ChronoField.SECOND_OF_MINUTE)).isPositive();

        ZonedDateTime withLocalDateTime = ZonedDateTime.of(LocalDateTime.now(clock), ZoneId.of("Australia/Sydney"));
        assertThat(currentZoneDateTime).isCloseTo(withLocalDateTime, within(5, ChronoUnit.SECONDS));

        ZonedDateTime withLocals = ZonedDateTime.of(LocalDate.now(clock), LocalTime.now(clock), clock.getZone());
        assertThat(withLocalDateTime).isCloseTo(withLocals, within(5, ChronoUnit.SECONDS));

        ZonedDateTime customZoneDateTime = ZonedDateTime.of(2022, Month.FEBRUARY.getValue(), MonthDay.now(clock).getDayOfMonth(), 20, 45, 50, 55, ZoneId.of("Europe/London"));
        assertThat(customZoneDateTime.getZone()).isEqualTo(ZoneId.of("Europe/London"));
        assertThat(customZoneDateTime.get(ChronoField.DAY_OF_MONTH)).isEqualTo(MonthDay.now(clock).getDayOfMonth());
        assertThat(customZoneDateTime.get(ChronoField.MONTH_OF_YEAR)).isEqualTo(Month.FEBRUARY.getValue());
        assertThat(customZoneDateTime.get(ChronoField.YEAR)).isEqualTo(2022);
        assertThat(customZoneDateTime.get(ChronoField.HOUR_OF_DAY)).isEqualTo(20);
        assertThat(customZoneDateTime.get(ChronoField.MINUTE_OF_HOUR)).isEqualTo(45);
        assertThat(customZoneDateTime.get(ChronoField.SECOND_OF_MINUTE)).isEqualTo(50);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss a");
        String timeStamp1 = "2022-03-27 10:15:30 AM"; // This String has no timezone information. Hence we need to provide one for it to be successfully parsed.
        ZonedDateTime parsedZonedTime1 = ZonedDateTime.parse(timeStamp1, formatter.withZone(ZoneId.of("Europe/London")) );
        ZonedDateTime parsedZonedTime2 = parsedZonedTime1.withZoneSameInstant(ZoneId.of("Australia/Sydney"));
        assertThat(parsedZonedTime1).isCloseTo(parsedZonedTime2, within(9, ChronoUnit.HOURS));
        }
````

### OffsetDateTime

**[java.time.OffsetDateTime](https://docs.oracle.com/javase/8/docs/api/java/time/OffsetDateTime.html)** is an immutable representation of `java.time.Instant` that represents an instant in Time along with an offset from UTC/GMT.
**When zone information needs to be saved in the database this format is preferred as it would always represent the same instant on the timeline** (especially when the server and database represent different timezones, conversion that represents time at the same instant would be required).  

Sample conversion example:

````java
@Test
public void testOffsetDateTime() {
        OffsetDateTime currentDateTime = OffsetDateTime.now(clock);
        Assertions.assertTrue(Stream.of(ZoneOffset.of("+10:00"), ZoneOffset.of("+11:00")).anyMatch(zo ->
        zo.equals(currentDateTime.getOffset())));
        assertThat(currentDateTime.get(ChronoField.DAY_OF_MONTH)).isPositive();
        assertThat(currentDateTime.get(ChronoField.MONTH_OF_YEAR)).isPositive();
        assertThat(currentDateTime.get(ChronoField.YEAR)).isPositive();
        assertThat(currentDateTime.get(ChronoField.HOUR_OF_DAY)).isPositive();
        assertThat(currentDateTime.get(ChronoField.MINUTE_OF_HOUR)).isPositive();
        assertThat(currentDateTime.get(ChronoField.SECOND_OF_MINUTE)).isPositive();

        ZoneOffset zoneOffSet= ZoneOffset.of("+01:00");
        OffsetDateTime offsetDateTime = OffsetDateTime.now(zoneOffSet);
        assertThat(currentDateTime).isCloseTo(offsetDateTime, within(9, ChronoUnit.HOURS));

        OffsetDateTime fromLocals = OffsetDateTime.of(LocalDate.now(clock), LocalTime.now(clock), currentDateTime.getOffset());
        Assertions.assertTrue(Stream.of(ZoneOffset.of("+10:00"), ZoneOffset.of("+11:00")).anyMatch(zo ->
        zo.equals(fromLocals.getOffset())));
        assertThat(currentDateTime).isCloseTo(fromLocals, within(5, ChronoUnit.SECONDS));

        OffsetDateTime fromLocalDateTime = OffsetDateTime.of(LocalDateTime.of(2022, Month.NOVEMBER, 1, 10, 10, 10), currentDateTime.getOffset());
        Assertions.assertTrue(Stream.of(ZoneOffset.of("+10:00"), ZoneOffset.of("+11:00")).anyMatch(zo ->
        zo.equals(fromLocalDateTime.getOffset())));
        assertThat(fromLocalDateTime.get(ChronoField.DAY_OF_MONTH)).isEqualTo(1);
        assertThat(fromLocalDateTime.get(ChronoField.MONTH_OF_YEAR)).isEqualTo(Month.NOVEMBER.getValue());
        assertThat(fromLocalDateTime.get(ChronoField.YEAR)).isEqualTo(2022);
        assertThat(fromLocalDateTime.get(ChronoField.HOUR_OF_DAY)).isEqualTo(10);
        assertThat(fromLocalDateTime.get(ChronoField.MINUTE_OF_HOUR)).isEqualTo(10);
        assertThat(fromLocalDateTime.get(ChronoField.SECOND_OF_MINUTE)).isEqualTo(10);

        OffsetDateTime fromLocalsWithDefinedOffset = OffsetDateTime.of(LocalDate.now(clock), LocalTime.now(clock), ZoneId.of("Australia/Sydney").getRules().getOffset(LocalDateTime.of(2022, Month.NOVEMBER, 1, 10, 10, 10)));
        assertThat(fromLocalsWithDefinedOffset.getOffset()).isEqualTo(ZoneOffset.of("+11:00"));

        OffsetDateTime sameInstantDiffOffset = currentDateTime.withOffsetSameInstant(ZoneOffset.of("+01:00"));
        assertThat(currentDateTime).isCloseTo(sameInstantDiffOffset, within(9, ChronoUnit.HOURS));

        OffsetDateTime dt = OffsetDateTime.parse("2011-12-03T10:15:30+01:00", DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'");
        assertThat(fmt.format(dt)).contains("Z");

        ZonedDateTime currentZoneDateTime = ZonedDateTime.now(clock);
        OffsetDateTime convertFromZoneToOffset = currentZoneDateTime.toOffsetDateTime();
        assertThat(currentDateTime).isCloseTo(convertFromZoneToOffset, within(5, ChronoUnit.SECONDS));
        }
````

## Compatibility with the legacy API

As a part of the Date/Time API, **methods have been introduced to convert from legacy classes to the newer API objects**.

Sample conversion examples:

````java
@Test
public void testWorkingWithLegacyDateInJava8() {
        Date date = new Date();
        Instant instant = date.toInstant();
        assertThat(instant).isNotEqualTo(clock.instant());

        ZonedDateTime zdt = instant.atZone(clock.getZone());
        assertThat(zdt.getZone()).isEqualTo(ZoneId.of("Australia/Sydney"));

        LocalDate ld = zdt.toLocalDate();
        assertThat(ld).isEqualTo(LocalDate.now(clock));
        ZonedDateTime zdtDiffZone = zdt.withZoneSameInstant(ZoneId.of("Europe/London"));
        assertThat(zdtDiffZone.getZone()).isEqualTo(ZoneId.of("Europe/London"));
        }

@Test
public void testWorkingWithLegacyCalendarInJava8() {
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone(clock.getZone()));
        assertThat(calendar.getTimeZone()).isEqualTo(TimeZone.getTimeZone("Australia/Sydney"));

        Date calendarDate = calendar.getTime();
        Instant instant = calendar.toInstant();
        assertThat(calendarDate.toInstant()).isEqualTo(calendar.toInstant());

        ZonedDateTime instantAtDiffZone = instant.atZone(ZoneId.of("Europe/London"));
        assertThat(instantAtDiffZone.getZone()).isEqualTo(ZoneId.of("Europe/London"));

        LocalDateTime localDateTime = instantAtDiffZone.toLocalDateTime();
        LocalDateTime localDateTimeWithZone = LocalDateTime.now(ZoneId.of("Europe/London"));
        assertThat(localDateTime).isCloseTo(localDateTimeWithZone, within(5, ChronoUnit.SECONDS));

        }
````

As we can see in the examples, methods are provided to convert to `java.time.Instant` which represents a timestamp at a particular instant.

## Advantages of the new DateTime API
- Operations such as formatting, parsing, timezone conversions can be easily performed.
- Exception handling with classes `java.time.DateTimeException`, `java.time.zone.ZoneRulesException` are well-detailed and easy to comprehend.
- All classes are immutable making them thread-safe.
- Each of the classes provides a variety of utility methods that help compute, extract, modify date-time information thus catering to most common use cases.
- Additional complex date computations are available in conjunction with `java.time.Temporal` package, `java.time.Period` and `java.time.Duration` classes.
- Methods are added to the legacy APIs to convert objects to `java.time.Instant` and let the legacy code use the newer APIs.

## Dealing with timezones in a Spring Boot application

In this section, we will take a look at how to handle timezones when working with Spring Boot and JPA.

### Introduction to the sample Spring Boot application

For demonstration purposes, we will use [this application](https://github.com/thombergs/code-examples/tree/master/spring-boot/timezones/SpringWebApplication) to look at how timezone conversions apply. This application is a Spring Boot application with MySQL as the underlying database.
First, let's look at the database.

**According to Oracle official documentation**:
> You can change the database time zone manually but Oracle recommends that you keep it as UTC (the default) to avoid data conversion and improve performance when data is transferred among databases. 
> This configuration is especially important for distributed databases, replication, and export and import operations.

This applies to all databases, so conforming with the preferred practice, we will configure MySQL to use UTC as default when working with JPA.
This removes the complication of converting between timezones. Now we just need to handle timezones at the server.

For this to apply, we will configure the below properties in `application.yml`
````yaml
spring:
  jpa:
    database-platform: org.hibernate.dialect.MySQL8Dialect
    properties:
      hibernate:
        jdbc:
          time_zone: UTC
````

### Mapping MySQL Date Types to Java

Let's take a quick look at some [MySQL date types](https://dev.mysql.com/doc/refman/8.0/en/date-and-time-types.html):

- **`DATE`** : The `DATE` type is used for values with a date part but no time part. MySQL retrieves and displays DATE values in 'YYYY-MM-DD' format.
- **`DATETIME`** - The `DATETIME` type is used for values that contain both date and time parts. MySQL retrieves and displays `DATETIME` values in `YYYY-MM-DD hh:mm:ss` format.
- **`TIMESTAMP`** - The format for TIMESTAMP is similar to `DATETIME`. The only difference being TIMESTAMP by default stores values in UTC.
- **`TIME`** - The `TIME` type stores the time in `hh:mm:ss` format. But it can also store time up to microseconds (6 digits precision).

Now that we understand the supported data types, let's look at how to map them with the Java Date/Time API.

The MySQL table is defined as follows:
````sql
CREATE TABLE IF NOT EXISTS `timezonedb`.`date_time_tbl` (
`id`INT NOT NULL AUTO_INCREMENT,
`date_str` VARCHAR(500) NULL,
`date_time` DATETIME NULL,
`local_time` TIME NULL,
`local_date`  DATE NULL,
`local_datetime_dt` DATETIME NULL,
`offset_datetime` TIMESTAMP NULL,
`zoned_datetime` TIMESTAMP NULL,
`created_at` TIMESTAMP NOT NULL,

PRIMARY KEY (`id`));
````

The corresponding JPA entity is as below:
````java
    @Entity
    @Table(name = "date_time_tbl")
    public class DateTimeEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "date_str")
    private String dateStr;

    @Column(name = "date_time")
    private Date date;

    @Column(name = "local_date")
    private LocalDate localDate;

    @Column(name = "local_time")
    private LocalTime localTime;

    @Column(name = "local_datetime_dt")
    private LocalDateTime localDateTime;

    @Column(name = "local_datetime_ts")
    private LocalDateTime localDateTimeTs;

    @Column(name = "offset_datetime")
    private OffsetDateTime offsetDateTime;

    @Column(name = "zoned_datetime")
    private ZonedDateTime zonedDateTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

````

### Understanding the server timezone setup

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/TZ.JPG" %}}

As seen, the database should store the timestamp in UTC (+00:00). We will run our Spring Boot application to the custom timezones **Europe/London** and **Europe/Berlin**.
Since these timezones have offset +01:00 and +02:00 respectively, we can easily compare the timestamps stored and retrieved.

To start the Spring application in Europe/London timezone we specify the timezone in the arguments as :
````text
mvnw clean verify spring-boot:run \
  -Dspring-boot.run.jvmArguments="-Duser.timezone=Europe/London"
````

Similarly, to start the application in Europe/Berlin timezone we would specify the arguments as :
````text
mvnw clean verify spring-boot:run \
  -Dspring-boot.run.jvmArguments="-Duser.timezone=Europe/Berlin"
````

We have configured two endpoints in the controller class:
- `http://localhost:8083/app/v1/timezones/default` stores the current date/time in the timezone specified by the JVM argument.
- `http://localhost:8083/app/v1/timezones/dst` stores a custom date/time in the jvm arguments specified timezone. This endpoint indicates
the end of DST in the specific timezone. This will help understand how the application handles DST changes.

{{% info title="`Daylight Savings Time`" %}}
As on 8th September 2022, both the timezones **Europe/London** and **Europe/Berlin** are on DST. Their corresponding timezones are **British Summer Time (BST) (UTC+1)** and **Central European Summer Time (CEST) (UTC+2)**.

After 30th October 2022, the DST will end and they will be back to **Greenwich Mean Time (GMT) (UTC)** and **Central European Time (CET) (UTC+1)** respectively.
{{% /info %}}

### Comparing results from both timezones

Lets's compare the output in Postman for the REST endpoint with the data stored in the DB For **Europe/London** at the **current date/time** :

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/spring_tz_1.JPG" %}}
{{% image alt="settings" src="images/posts/handling-timezones-in-spring/db_tz_1.JPG" %}}

On comparison, we can make note of the following points:
- `VARCHAR` representation of date (column `date_str`) in the database is not recommended, since it stores the date in the format and the zone it was sent. This could result in inconsistent date formats and the final date stored will not be in UTC making it difficult to convert back in the application.
- `java.util.Date` stored in the DB (column `date_time`) has no zone information making it difficult to represent the right date-time format in the application.
- Similarly, the `DATE` and `TIME` columns (columns `local_date` and `local_time`) need additional information especially when working with timezones.
- `LocalDateTime` (column `local_datetime_dt`) although represents the correct date-time still needs additional information when working with timezones.
- As we can see, `OffsetDateTime` and `ZonedDateTime` (columns `offset_datetime` and `zoned_datetime`) give all the required information for the dates to be stored in UTC and retrieved in the right format.
Therefore, we can conclude that `DATETIME` and `TIMESTAMP` should be the preferred choice when storing date-time in MySQL databases.

Now, let's consider another timezone **Europe/Berlin** and compare its output in Postman to the data stored in the DB at the **current date/time** :

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/spring_tz_2.JPG" %}}
{{% image alt="settings" src="images/posts/handling-timezones-in-spring/db_tz_2.JPG" %}}

The results in this timezone are consistent with the points noted above.

Next, lets see what happens when the timezone is set to **Europe/Berlin** and when the **DST ends on 30th October 2022**. **The custom date considered here is 8th November 2022**.

{{% image alt="settings" src="images/posts/handling-timezones-in-spring/spring_tz_3.JPG" %}}
{{% image alt="settings" src="images/posts/handling-timezones-in-spring/db_tz_3.JPG" %}}

When DST ends, Europe/Berlin will shift to UTC+1 timezone and this is consistent with the results as seen the output above.
In all above cases, `OffsetDateTime` and `ZonedDateTime` show the same results. This is because, the **`OffsetDateTime` is derived from `ZoneId`**. All DST rules apply to ZoneId
and hence `OffsetDateTime` gives the correct representation that includes DST changes. As discussed in the API section that details differences between OffsetDateTime and ZonedDateTime,
we could use the one that best suits our use-case.

## Testing timezones in a Spring Boot application

When working with timezones and unit testing applications, we might want to control the timezone, dates and make them agnostic of the system timezone.
The Date/Time API provides [`java.time.Clock`](https://docs.oracle.com/javase/8/docs/api/java/time/Clock.html) that can be used for achieving this.
According to the official documentation:
> Use of a Clock is optional. All key date-time classes also have a now() factory method that uses the system clock in the default time zone. The primary purpose of this abstraction is to allow alternate clocks to be plugged in as and when required. 
> Applications use an object to obtain the current time rather than a static method. This can simplify testing.

With this approach, we could define a Clock object in the desired timezone and pass it to any of the Date/Time API classes 
to get the corresponding date-time.

````java
@TestConfiguration
public class ClockConfiguration {

    @Bean
    public Clock clock() {
        return Clock.system(ZoneId.of("Europe/London"));
    }
}
````

Now in order to get timezone specific information, we can use
````java
OffsetDateTime current = OffsetDateTime.now(clock);
````

Further, we could also fix the clock to set it to a particular instant in a timezone
````java
Clock.fixed(Instant.parse("2022-11-08T09:10:20.00Z"), ZoneId.of("Europe/Berlin"));
````
With this set, `OffsetDateTime.now(clock)` will always return the same time.

To always apply the default system timezone, we could use:
````java
Clock.systemDefaultZone();
````

By setting the clock parameter, testing the same application in different timezones, with or without DST becomes much easier.

## Best practices for storing timezones in the Database
- Most databases support date and timestamp fields. Always store dates in the corresponding column types and never use `VARCHAR`.
- Recommended practice is to store timestamps in UTC to help handle zone conversions better.
- Column types like `DATE` and `TIME` should not be preferred since they do not have zone information. In most cases you would want to store data with timezone that will cater to multiple timezones making the application less prone to time conversion errors.


## Conclusion
As discussed, we have seen the numerous advantages of the DateTime API and how it efficiently lets us save and retrieve timestamp information when working with databases.
We have also seen a few examples of testing the created endpoints across timezones by manipulating the `Clock` in our unit tests.
