---
title: "Asserting Lists with AssertJ"
categories: [spring-boot]
date: 2021-10-04 06:00:00 +1000
modified: 2021-10-04 06:00:00 +1000
author: mateo
excerpt: "Asserting lists in unit tests can be painful. AssertJ provides handy support for lists that we're going to explore in this article."
image: 
  auto: 0019-magnifying-glass
---

In tests, we need to add assertions to make sure that a result is the expected result. For this, we can make use of the AssertJ assertion library.

To assert that an object equals the expected object, we can simply write `assertThat(actualObject).isEqualTo(expectedObject)`.

When we're working with lists, however, things quickly get complicated. How can we extract certain elements out of a list to assert them?

This article shows how to work with lists in AssertJ.

Let’s start with setting it up.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/testing/assertj" %}

## Setting up AssertJ
### Maven Setup

If you are using Maven and not using Spring or Spring Boot dependencies, you can just import the `assertj-core` dependency into your project:
```java
<dependencies>
  <dependency>
    <groupId>org.assertj</groupId>
    <artifactId>assertj-core</artifactId>
    <version>3.20.2</version>
  </dependency>
</dependencies>
```
If you are using Spring Boot, you can import `spring-boot-starter-test` as a dependency and start writing your unit test:
```java
<dependencies>
  <dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <version>2.5.4</version>
  </dependency>
</dependencies>
```
### Gradle Setup

If you like Gradle more, or your project just uses Gradle as a build tool, you can import `assertj-core` like this:

```java
dependencies {
	testImplementation 'org.assertj:assertj-core:3.11.1'
}
```
Or, if you are working with Spring:
```java
dependencies {
	testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

## Example Use Case

For this article, we will build a backend for a simple gym buddy app. We will pick a set of workouts that we want to do, add several sets and the number of reps on each set. Also, we will add friends as our gym buddies and see their workout sessions. You can see the example code [on GitHub](https://github.com/thombergs/code-examples/tree/master/testing/assertj).

## Filtering Lists

The main issue with asserting lists is to get the correct elements of the list to assert against. AssertJ provides some filtering options that we're going to explore.

### Filtering with Basic Conditions

Let's say we want to fetch all persons currently in the application and assert that there is a person named “Tony”:
```java
@Test
void checkIfTonyIsInList_basicFiltering(){
  assertThat(personService.getAll())
    .filteredOn(person -> person.getName().equals("Tony").isNotEmpty();
}
```
To do this, we used `filteredOn()` with a predicate. Predicates use lambda expressions syntax and are easy to write ad-hoc.

### Filtering with Multiple Basic Conditions

Let's combine multiple conditions. 

From the list of all persons, we want to make sure that there is only one person who

* has the letter "o" in their name, and 
* has more than one friend:

```java
@Test
void filterOnNameContainsOAndNumberOfFriends_complexFiltering(){
  assertThat(personService.getAll())
    .filteredOn(person -> person.getName().contains("o") 
                && person.getFriends().size() > 1)
    .hasSize(1);
}
```
The implementation is pretty straightforward, but you can see that, with more complex conditions, our filtering statement will grow ever bigger. This could cause issues like lack of readability with more than two conditions.

### Filtering on Nested Properties

How can we assert on something that is a property of a property of an object that we have in the list? 

Now, we want to assert that there are four persons in the application that had their workout done today:
```java
@Test
void filterOnAllSessionsThatAreFromToday_nestedFiltering() {
  assertThat(personService.getAll())
    .map(person -> 
      person.getSessions()
      .stream()
      .filter(session -> session.getStart().isAfter(LocalDateTime.now().minusHours(1)))
        .count())
    .filteredOn(sessions -> sessions > 0)
    .hasSize(4);
}
```
The entities were modeled so that the session contains the time, and we are provided with a list of persons where each of them contains a list of sessions. 

As an answer to this issue, we had to count all sessions that are done today, and group them by their owners. Then, we could use predicate filtering to assert that four persons have at least one workout session done today. We will look at how to make this more readable using other AssertJ features.

## Field Filtering

AssertJ provides us a more elegant way to assert on the list. We call this field filtering. In the next examples, we will see how we can use field filtering and what the upsides and downsides of using it are.

### Field Filtering with Basic Condition

Previously, [we wanted to assert that there is a person in our application that is named “Tony”](#filtering-with-basic-conditions). This example will show us how we can do this using field filtering:

```java
@Test
void checkIfTonyIsInList_basicFieldFiltering(){
  assertThat(personService.getAll())
    .filteredOn("name", "Tony")
    .isNotEmpty();
}
```
Again, we are using `filteredOn()`. But this time there is no predicate. We are providing just the name of the property as a method argument. The name of the property is hard-coded as a string and this can cause problems in the future. If someone changes the name of the property to something else, and forgets to change the test also, this test will fail with: `java.lang.IllegalArgumentException: Cannot locate field “attribute_name” on class “class_name”.`

### Field Filtering with Complex Conditions

Now, we want to assert that only Tony or Carol have more than one gym buddy:

```java
@Test
void filterOnNameContainsOAndNumberOfFriends_complexFieldFiltering() {
  assertThat(personService.getAll())
    .filteredOn("name", in("Tony","Carol"))
    .filteredOn(person -> person.getFriends().size() > 1)
    .hasSize(1);
}
```
For the first filter, we use field filtering as in the previous example. Here we can see the usage of `in()` to check if our property value is part of provided list. 

Aside from `in()`, we can use:

* `notIn()`: to check if an item is not in a list
* `not()`: to check if an item does not equal the provide value.

One more thing that we notice is that we cannot do any complex filtering using field filters. That is why the second part of our chained filters is filtering using predicates.

## Handling Null Values
Now, one more thing that we need to go over is the behavior of these two types of filtering when it comes to `null` values in some properties.

### Predicate Filtering with Null Values

We want to assert that there is no workout session for Tony inside our application. Since we want to check behavior with `null` values, we want to change the `person` property into `null` for our Tony.

First, let us go with predicate filtering:

```java
@Test
void checkIfTonyIsInList_NullValue_basicFiltering(){
  List<Session> sessions = sessionService.getAll().stream().map(
    session -> {
      if(session.getPerson().getName().equals("Tony")){
      return new Session.SessionBuilder()
          .id(session.getId())
          .start(session.getStart())
          .end(session.getEnd())
          .workouts(session.getWorkouts())
          .person(null)
          .build();
      }
      return session;
    })
    .collect(Collectors.toList());

assertThat(sessions)
  .filteredOn(session -> session.getPerson().getName().equals("Tony")).isEmpty(); // <-- NullPointer!
}
```
The first thing that we do is to replace all of Tony’s sessions with a new session where the `person` property is set to `null`. After that, we use standard predicate filtering, as explained [above](#filtering-with-basic-conditions). The output of running this part of code will be a `NullPointerException` since we want to call `getName()` on a `null` object.

### Field Filtering with Null Values

Here, we want to do the same thing as above. We want to assert that there is no workout session for Tony in our application:

```java
@Test
void checkIfTonyIsInList_NullValue_basicFieldFiltering(){
  List<Session> sessions = sessionService.getAll().stream().map(
    session -> {
      if(session.getPerson().getName().equals("Tony")){
      return new Session.SessionBuilder()
          .id(session.getId())
          .start(session.getStart())
          .end(session.getEnd())
          .workouts(session.getWorkouts())
          .person(null)
          .build();
      }
      return session;
    })
    .collect(Collectors.toList());

  assertThat(sessions).filteredOn("person.name","Tony").isEmpty(); // <-- no NullPointer!
}
```
After setting `person` properties to `null` for all Tony’s sessions, we do field filtering on `person.name`. In this example, **we will not face a `NullPointerException`**. Field filtering is null-safe and `isEmpty()` will return `false`.

## Using Custom Conditions

The next feature that we want to go through is creating custom conditions. We will have a separate package for custom conditions. That way we will have them all in one place. Each condition should have a meaningful name, so it is easier to follow. We can use custom conditions for basic conditions, but that would be a bit of an overkill. In that cases we can always use a [predicate](#filtering-lists-using-predicate) or [field filtering](#field-filtering).

### Creating Ad-Hoc Conditions
Again, we will use a same example as before. We assert that there is only one person who has the letter "o" inside their name and more than one friend. We already showed this example using a [predicate](#filtering-with-multiple-basic-conditions) and something similar using [field filtering](#field-filtering-with-complex-conditions). Let us go through it once again:

```java
@Test
void filterOnNameContainsOAndNumberOfFriends_customConditionFiltering(){
    
  Condition<Person> nameAndFriendsCondition = new Condition<>(){
    @Override
    public boolean matches(Person person){
    return person.getName().contains("o") 
        && person.getFriends().size() > 1;
    }
  };
  
  assertThat(personService.getAll())
      .filteredOn(nameAndFriendsCondition)
      .hasSize(1);
}
```
Here we created the custom condition `nameAndFriendsCondition`. We can see that the filtering code is the same as we did with [predicate filtering](#filtering-with-multiple-basic-conditions). We created conditions inside our test method using an anonymous class. This way is good when you know you will have a just couple of custom conditions and you will not need to share them with another test.

### Creating a Condition in a Separate Class

This example is something similar to [predicate filtering on nested properties](#filtering-on-nested-properties). We are trying to assert that there are four persons in our application that had their workout session today. Let us first check how we create this condition:

```java
public class SessionStartedTodayCondition extends Condition<Person> {

  @Override
  public boolean matches(Person person){
    return 
    person.getSessions().stream()
        .anyMatch(session -> session.getStart().isAfter(LocalDateTime.now().minusHours(1)));
  }
}
```

An important note is that this condition is created as its own class in a separate package, so we can share it between different tests.

The only thing that we needed to do is to extend `Condition` class and override its `matches()` method. Inside that method we write filtering that will return a `boolean` value depending on our condition.

Our next example is showing usage of created condition:
```java
@Test
void filterOnAllSessionsThatAreFromToday_customConditionFiltering() {
  Condition<Person> sessionStartedToday = new SessionStartedTodayCondition();
  assertThat(personService.getAll())
    .filteredOn(sessionStartedToday)
    .hasSize(4);
}
```
We first need to create an instance of our condition. Then, we call `filteredOn()` with the given condition as the parameter. Important note is that **the condition is validated on each element of the list, one by one.**

## Extracting Fields

Assume we want to check if all desired values of the object’s property are in our list. We can use field filtering, and that was explained in previous examples, but there is one other way to do it.

### Checking a Single Property Using Field Extracting

We want to check if there is Tony, Bruce, Carol, and Natalia in our list of persons and that there is no Peter or Steve on the same list. Our next examples will show how to use field extracting with single values:

```java
@Test
void checkByName_UsingExtracting(){
  assertThat(personService.getAll())
      .extracting("name")
      .contains("Tony","Bruce","Carol","Natalia")
      .doesNotContain("Peter","Steve");
}
```

We are calling `extracting()` with the name of the property as a parameter. On that, we call `contains()` method to check if the list of extracted names contains provided values. After that, we call `doesNotContain()` to assert that there are no Peter or Steve in our list of names.

With field extracting, we face the downside of hard-coded values for property names.

### Checking Multiple Properties Using Field Extracting

Now, we know that there are Tony, Bruce, Carol and Natalia on our list of persons. But, are they the ones that we really need? Can we specify a bit more who they are?

Let us agree that name and last name are enough to distinguish two persons in our application. We want to find out if our application contains Tony Stark, Carol Danvers, Bruce Banner, and Natalia Romanova. Also, we want to make sure that Peter Parker and Steve Rogers are not among people in this list:

```java
@Test
void checkByNameAndLastname_UsingExtracting(){
  assertThat(personService.getAll())
      .extracting("name","lastname")
      .contains(tuple("Tony","Stark"), tuple("Carol", "Danvers"), tuple("Bruce", "Banner"),tuple("Natalia","Romanova"))
      .doesNotContain(tuple("Peter", "Parker"), tuple("Steve","Rogers"));
}
```
We implemented it, again, using `extracting()`, but this time we wanted to extract two properties at the same time. In `contains()` and `doesNotContain()` we are using `tuple()` to represent a tuple of name and last name.

### Extracting Null Values

We want to check if Bruce, Carol, and Natalia are part of our list, but first, we need to exclude Tony and let all of his sessions have a `null` value as person property:
```java
@Test
void checkByNestedAtrribute_PersonIsNUll_UsingExtracting(){
    List<Session> sessions = sessionService.getAll().stream().map(
      session -> {
        if(session.getPerson().getName().equals("Tony")){
          return new Session.SessionBuilder()
              .id(session.getId())
              .start(session.getStart())
              .end(session.getEnd())
              .workouts(session.getWorkouts())
              .person(null)
              .build();
        }
        return session;
      }
  ).collect(Collectors.toList());

  assertThat(sessions)
      .filteredOn(session -> session.getStart().isAfter(LocalDateTime.now().minusHours(1)))
      .extracting("person.name")
      .contains("Bruce","Carol","Natalia");
}
```
Extracting properties on `null` values behaves the same as in [field filtering](#field-filtering-behavior). All properties that we try to extract from `null` object are considered `null`. No `NullPointerException` is thrown in this case.

## Flatmap and Method Call Extracting
We saw in [this example](#filtering-on-nested-properties) that finding persons who had their workout session done today was pretty complex. Let’s find out a better way of asserting the list inside the list.

### Flatmap Extracting on Basic Properties
 
Explaining `flatmap` is best done on actual example. In our use case, we want to assert that Tony, Carol, Bruce, and Natalia have at least one workout session that started today. Let’s see how it is done using flatmap extracting:

```java
@Test
void filterOnAllSessionsThatAreFromToday_flatMapExtracting(){
  assertThat(personService.getAll())
      .flatExtracting("sessions")
      .filteredOn(session -> ((Session)session).getStart().isAfter(LocalDateTime.now().minusHours(1)))
      .extracting("person.name")
      .contains("Tony", "Carol","Bruce","Natalia");
}
```
After fetching all persons we want to find sessions that started today. In our example, we start by calling `flatExtracting()` on the session property of a person. Now, our list is changed from list of persons to list of sessions, and we are doing our further assertion on that new list. Since we have the list of sessions that started today, we can extract names of persons that own that session, and assert the desired values are among them.

### Flatmap Extracting Using Extractor
If we want to have a more complex extractor and reuse it across our code, we can implement an extractor class:
```java
public class PersonExtractors {
  public PersonExtractors(){}

  public static Function<Person, List<Session>> sessions(){
    return new PersonSessionExtractor();
  }

  private static class PersonSessionExtractor implements Function<Person, List<Session>> {
    @Override
    public List<Session> apply(Person person) {
      return person.getSessions();
    } 
  }
}
```
We need to create a class that will have a static method that returns a Java `Function`. It will return a static object that implements the `Function` interface and where we set our desired input type and desired output type. In our use case, we are taking one person and returning a list of sessions to that person. Inside that new static function, we override method `apply()`.

Let’s see an example of how to use the extractor class:

```java
@Test
void filterOnAllSessionsThatAreFromToday_flatMapExtractingMethod(){
  assertThat(personService.getAll())
      .flatExtracting(PersonExtractors.sessions())
      .filteredOn(session -> session.getStart().isAfter(LocalDateTime.now().minusHours(1)))
      .extracting("person.name")
      .contains("Tony", "Carol","Bruce","Natalia");
}
```
Extracting itself is done inside `flatExtracting()` method into which we pass the static function called `PersonExtractors.sessions()`.

### Method Call Extracting

Instead of asserting on properties of objects in the list, sometimes, we want to assert the method result of the same properties. A new list is created from those results and our assertion continues on that list. 

Let’s say we want to check how many sessions are there that lasted less than two hours and we don’t save that variable in the database, so it is not inside the entity. Our next test shows that use case:

```java
@Test
void filterOnAllSesionThatAreFomToday_methodCallExtractingMethod(){
  assertThat(sessionService.getAll())
      .extractingResultOf("getDurationInMinutes", Long.class)
      .filteredOn(duration -> duration < 120l)
      .hasSize(1);
}
```
After fetching all sessions, we call a method called `getDurationInMinutes()` using `extractingResultOf()`. This method has to be an inside class we are filtering on. After that, we get the list of outputs on that method, in our use case we get a list of durations of all sessions. Now, we can filter on that one and assert that there is only one session that is shorter than two hours. We passed another argument to `extractingResultOf()` that represents the type that we expect back. If we don’t provide it method will return `Object.class` type.


# Conclusion

AssertJ provides us full functionality on asserting lists. We can split them into two groups:
  
  - Filtering lists and asserting on the filtered list
  - Extracting properties from items in the list and asserting on those

This makes working with lists in tests much simpler.
