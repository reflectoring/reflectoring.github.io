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

If we want a string representation of an `LocalDate` object, we can use the method `format()` which takes as argument
a `DateTimeFormatter`. Like mentioned in the other sections above, exists predefined instances of the
class `DateTimeFormatter` like `BASIC_ISO_DATE` or `ISO_LOCAL_DATE`.
instances to format a date.
In the list below, we will use these instances to format a date.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2022, 3, 13);
        System.out.println(date.format(DateTimeFormatter.BASIC_ISO_DATE)); // 20220313
        System.out.println(date.format(DateTimeFormatter.ISO_LOCAL_DATE)); // 2022-03-13
    }
}
```

We can even create our own formatter by using the static method `ofPattern()` of the class `DateTimeFormatter`.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2022, 3, 13);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        System.out.println(date.format(formatter)); // 13/03/2022
    }
}
```

Here we have used a custom formatter of pattern `dd/MM/yyyy`. When we print the date on the console, the output
is `13/03/2022`, as expected to be.

## Working With `LocalTime`

An instance of `LocalTime` holds the information about the time but not of the date. Let's see how to create an instance
of `LocalTime`.

### How To Create a `LocalTime` Object

To create an instance of the `LocalTime` class, we can use one of the static factory methods `of()`, like in the sample
below.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalTime time = LocalTime.of(22, 33, 13);
        System.out.println("The time is: " + time); // The time is: 22:33:13
    }
}
```

Here we have an object of type `LocalTime`. The first argument is the hour, the
second are the minutes, and the third are the seconds.

In case we would like to get the current time, we can use the static method `now()`:

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalTime time = LocalTime.now();
    }
}
```

When we need to get some information about the time, like the hour, the minutes or the seconds, we can use the
methods `getHour()`, `getMinute()` and `getSecond()`. Let's see how to use these methods with an example.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalTime time = LocalTime.of(22, 13, 45);
        int hour = time.getHour(); // 22
        int minute = time.getMinute(); // 13
        int second = time.getSecond(); // 45
    }
}
```

Exists another method to get the same information by passing a `TemporalField` and is called `get()`. Using this method,
let's try to gather the same information as in the example above:

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalTime time = LocalTime.of(22, 13, 45);
        int hour = time.get(ChronoField.HOUR_OF_DAY); // 22
        int minute = time.get(ChronoField.MINUTE_OF_HOUR); // 13
        int second = time.get(ChronoField.SECOND_OF_MINUTE); // 45
    }
}
```

The `ChronoField` is an enumeration that implements the `TemporalField` interface. It has different elements, in our
case we have just used three of them: `ChronoField.HOUR_OF_DAY`, `ChronoField.MINUTE_OF_HOUR`
and `ChronoField.SECOND_OF_MINUTE` to get the information about the hour, minute and second.

### Parsing a `LocalTime` Object

When we need to parse a `String` representation and create an instance of `LocalTime`
class. We can use the method `parse()` to achieve this. This method takes as arguments the time we want to parse and an
instance of `DateTimeFormatter`. The class `DateTimeFormatter` can be found at `java.time.format` package. Let's see an
example of how it works.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalTime time = LocalTime.parse("22:12:45", DateTimeFormatter.ISO_LOCAL_TIME);
        System.out.println("The time is: " + time); // The time is: 22:12:45
    }
}
```

In this case, we are using `ISO_LOCAL_TIME` which is a predefined instance of the `DateTimeFormatter` class. If we want
a custom formatter, we can create our own by using the static method `ofPattern()`, like shown below.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("H:mm:ss");
        LocalTime time = LocalTime.parse("3:30:45", dateTimeFormatter);
        System.out.println("The time is: " + time); // The date is: 03:30:45
    }
}
```

Here we have used the static method `ofPattern()` of the `DateFormatter` class passing the pattern `H:mm:ss`. Using
this pattern, we have created a LocalTime instance which is the representation of the string `3:30:45`.

### `LocalTime` Arithmetic

To manipulate a `LocalTime` instance, we can use one of the methods this class offers. To mention some of these methods,
we can use `withHour()` which changes the hour part of the time. Another method is `withMinute()` which changes the
minute part. To understand better, let's look at the following example.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalTime time = LocalTime.of(22, 13, 45); // 22:13:45
        LocalTime time2 = time.withHour(21); // 21:13:45
        LocalTime time3 = time.withMinute(10); // 22:10:45
        LocalTime time4 = time.withSecond(20); // 22:13:20
    }
}
```

Using the `LocalTime` class, we created an instance in the first line that we will manipulate in the following lines. In
the second line, we changed the hour by using the `withHour()` method. In the third line, we changed the minute part by
using the `withMinute()` method and in the last line we changed the seconds by calling the method `withSecond()`.

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

### Formatting a `LocalTime` Object

An `LocalTime` object can be formatted using the method `format()`, which takes as argument a `DateTimeFormatter`. 
Exist predefined instances of the class `DateTimeFormatter` such as `ISO_LOCAL_TIME` or `ISO_TIME`.
These instances will be used to format a time based on the list below.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalTime time = LocalTime.of(22, 43, 25);
        System.out.println(time.format(DateTimeFormatter.ISO_LOCAL_TIME)); // 22:43:25
        System.out.println(time.format(DateTimeFormatter.ISO_TIME)); // 22:43:25
    }
}
```

The static method `ofPattern()` in the class `DateTimeFormatter` can also be used to create our own formatter.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalTime time = LocalTime.of(22, 13, 43);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH.mm.ss");
        System.out.println(time.format(formatter)); // 22.13.43
    }
}
```

We are using the custom formatter `HH.mm.ss` here. When we print the time on the console, we get `22.13.43` as expected.

## Working With `LocalDateTime`

Up to this point, we have learned how to create instances of the classes `LocalDate` and `LocalTime`. In this section,
we will learn how to combine the two classes into one, called `LocalDatetime`.

### How To Create a `LocalDateTime` Object

As shown below, we can create an instance of the `LocalDateTime` class with one of its static factory methods `of()`.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalDateTime localDateTime = LocalDateTime.of(2022, 3, 13, 22, 13, 45); // The date and time is: 2022-03-13T22:13:45
        System.out.println("The date and time is: " + localDateTime);
    }
}
```

An object of type `LocalDateTime` represents 13 March 2022 at 22:13:45. The year, the month, and the date are the first
three arguments, while the hour, the minute, and the seconds are the other three.

The static method `now()` can be used to retrieve the current date:

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalDateTime now = LocalDateTime.now();
    }
}
```

We can use the methods `getYear()`, `getMonth()` and `getDayOfMonth()` to get information about the date, such as the
year, the month or the day of the month. Let's see how they work with an example.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalDateTime dateTime = LocalDateTime.of(2022, Month.MARCH, 13, 22, 13, 45);
        int year = dateTime.getYear();
        Month month = dateTime.getMonth();
        int day = dateTime.getDayOfMonth();
        int hour = time.getHour();
        int minute = time.getMinute();
        int second = time.getSecond();
    }
}
```

There is another method to get the same information by passing a `TemporalField`. This method is called `get()`.

 ```java
public class DateAndTimeDemo {
    public static void main(String[] args) {
        LocalDateTime dateTime = LocalDateTime.of(2022, Month.MARCH, 13, 22, 13, 45);
        int year = date.get(ChronoField.YEAR);
        int month = date.get(ChronoField.MONTH_OF_YEAR);
        int day = date.get(ChronoField.DAY_OF_MONTH);
        int hour = time.get(ChronoField.HOUR_OF_DAY); 
        int minute = time.get(ChronoField.MINUTE_OF_HOUR); 
        int second = time.get(ChronoField.SECOND_OF_MINUTE);
    }
}
```

The `ChronoField` is an enumeration that implements the `TemporalField` interface. It consists of different elements, in
our case we have used some of them: `ChronoField.YEAR`, `ChronoField.MONTH_OF_YEAR` and `ChronoField.DAY_OF_MONTH` to
get the information about the year, month and day.

### Parsing a `LocalDateTime` Object

In order to work with dates, we may need to parse a string representation and create an instance of the `LocalDateTime`
class using the method `parse()`. This method takes a date and an instance of a `DateTimeFormatter` as arguments. 
Here is an example of how to use the class `DateTimeFormatter` from the `java.time.format` package.

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
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy H.mm.ss");
        LocalDateTime dateTime = LocalDateTime.parse("13/03/2022 22.43.14", dateTimeFormatter);
        System.out.println("The date and time are: " + dateTime); // The date and time are: 2022-03-13T22:43:14
    }
}
```

As shown here, we used the static method `ofPattern()` of the `DateFormatter` class, passing the string `dd/MM/yyyy H.mm.ss`.
Using this pattern, we create a `LocalDateTime` instance, which represents the string `13/03/2022 22.43.14`.

### `LocalDateTime` Arithmetic


### Formatting a `LocalDateTime` Object

## Working With `Instant` and `Duration`
## Working With Different Time Zones
