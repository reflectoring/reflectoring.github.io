---
title: "Working with Dates in Java"
categories: ["Java"]
date: 2022-02-27 00:00:00 +1100
authors: ["nukajbl"]
excerpt: "In this article, we will explore the new Java time API and will learn how to use the new classes that are
located on `java.time` package."
image: images/stock/0111-clock-1200x628-branded.jpg
url: java-date
---

In this article, we will learn how to properly use the new Java API for manipulating Date and Time. In particular, we
will explore `LocalDate`, `LocalTime`, `LocalDateTime`, `Instant` and `Duration`. All the mentioned classes are
immutable, once created the instance, cannot be changed. A famous immutable class in Java is the `String` class.

## Working With `LocalDate`

`LocalDate` is the most used class from the new API. It represents a date without any information about the time. Like
we mentioned above, this is an immutable class and has, so any operation on it will return a new instance with the new
value.

### How To Create a `LocalDate` Object

To create an instance of the `LocalDate` class, we can use one of the static factory methods `of()`, like in the sample
below.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2022, 3, 13);
        System.out.println("The date is: " + date);
    }
}
```

Here we have an object of type `LocalDate` that represents the 13 March 2022. The first argument is the year, the
second the month and the third is the day. If we try to run the `main()` method, it will print the following
information:

`The date is: 2022-03-13`

There is an overloaded version of this method that instead of the index of the month, takes an instance of the `Month`
enum. We can write the same example as:

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2022, Month.MARCH, 13);
        System.out.println("The date is: " + date);
    }
}
```

In case we would like to get the current date, we can use the static method `now()`:

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalDate currentDate = LocalDate.now();
    }
}
```

When we need to get some information about the date, like the year, the month or the day of the month, we can use the
methods `getYear()`, `getMonth()` and `getDayOfMonth()`. Let's see how to use these methods with an example.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2022, Month.MARCH, 13);
        int year = date.getYear();
        Month month = date.getMonth();
        int day = date.getDayOfMonth();
    }
}
```

Exists another method to get the same information by passing a `TemporalField` and is called `get()`. Using this method,
let's try to gather the same information as in the example above:

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2022, Month.MARCH, 13);
        int year = date.get(ChronoField.YEAR);
        int month = date.get(ChronoField.MONTH_OF_YEAR);
        int day = date.get(ChronoField.DAY_OF_MONTH);
    }
}
```

The `ChronoField` is an enumeration that implements the `TemporalField` interface. It has different elements, in our
case we have just used three of them: `ChronoField.YEAR`, `ChronoField.MONTH_OF_YEAR` and `ChronoField.DAY_OF_MONTH` to
get the information about the year, month and day.

### Parsing a `LocalDate` Object  

When working with dates, very often we need to parse a `String` representation and create an instance of `LocalDate`
class. We can use the method `parse()` to achieve this. This method takes as arguments the date we want to parse and an
instance of `DateTimeFormatter`. The class `DateTimeFormatter` can be found at `java.time.format` package. The instances
of this class are now thread-safe. Let's see an example of how it works.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalDate date = LocalDate.parse("2022-03-13", DateTimeFormatter.ISO_LOCAL_DATE);
        System.out.println("The date is: " + date);
    }
}
```

In this case, we are using `ISO_LOCAL_DATE` which is a predefined instance of the `DateTimeFormatter` class. If we want
a custom formatter, we can create our own by using the static method `ofPattern()`, like shown below.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        LocalDate date = LocalDate.parse("13/03/2022", dateTimeFormatter);
        System.out.println("The date is: " + date);
    }
}
```

Here we have used the static method `ofPattern()` of the `DateFormatter` class passing the pattern `dd/MM/yyyy`. Using
this pattern, we have created a LocalDate instance which is the representation of the string `13/03/2022`.

### `LocalDate` Arithmetic

To manipulate a LocalDate instance, we can use one of the methods this class offers. To mention some of these methods,
we can use `withYear()` which changes the year part of the date. Another method is `withDayOfMonth()` which of course
changes the day of the month.
To understand better, let's look at the following example.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2022, 3, 13); // 2022-3-13
        LocalDate date2 = date.withYear(2021); // 2021-3-13
        LocalDate date3 = date.withDayOfMonth(24); // 2022-3-24
        LocalDate date4 = date.withMonth(5); // 2022-5-13 
    }
}
```

In the first line, we have created an instance of `LocalDate` class that we will manipulate in the next lines. In the
second line, we have changed the year by using `withYear()` method. In the third line, we have changed the day of the
month by using the method `withDayOfMonth()`, so now the day is 24 and not anymore 13, like the original one. And
finally, we have changed the month by using the method `withMonth()`.
Exist a more generic method which is called `with()` that takes as first argument a `TemporalField`.
We will use the same example as above, but now using only the generic method `with()`.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2022, 3, 13);
        LocalDate date2 = date.with(ChronoField.YEAR,2021); // 2021-3-13
        LocalDate date3 = date.with(ChronoField.DAY_OF_MONTH,24); // 2022-3-24
        LocalDate date4 = date.with(ChronoField.MONTH_OF_YEAR,5); // 2022-5-13
    }
}
```

### Formatting a `LocalDate` Object

## Working With `LocalTime`
### Different Ways To Create a `LocalTime` Object
### `LocalTime` Arithmetic
### Formatting a `LocalTime` Object

## Working With `LocalDateTime`
### Different Ways To Create a `LocalDateTime` Object
### `LocalDateTime` Arithmetic
### Formatting a `LocalDateTime` Object

## Working With `Instant` and `Duration`
## Working With Different Time Zones
