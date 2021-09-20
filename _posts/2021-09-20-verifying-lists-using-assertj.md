---
title: "Verifying Lists Using AssertJ"
categories: [spring-boot]
date: 2021-09-20 06:00:00 +1000
modified: 2021-09-20 06:00:00 +1000
author: mateo
excerpt: "AssertJ"
image: 
  auto: 0032-dashboard
---
# Verifying Lists Using AssertJ

## AssertJ - What Is It and How to Set It Up

You finished coding for today or you need to write bit more tests? AssertJ can help you with that. Its ease of use and straightforward setup put it on top of Java testing libraries. In this article, we will go through all features in AssertJ that are related to lists.

Let’s start with setting it up.

### Maven Setup

If you are using Maven and not using Spring or Spring Boot dependencies, you can just import assertj-core dependency into your project and you are ready.
```
<dependencies>
    <dependency>
      <groupId>org.assertj</groupId>
      <artifactId>assertj-core</artifactId>
      <version>3.20.2</version>
    </dependency>
</dependencies>
```
If you are using Spring ecosystem, you can import spring-boot-starter-test as a dependency and start writing your unit test.
```
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <version>2.5.4</version>
    </dependency>
  </dependencies>
```
### Gradle Setup

If you like Gradle more, or your project just uses Gradle as a build tool, you can import assertJ-core like this


```
dependencies {
	testImplementation 'org.assertj:assertj-core:3.11.1'
}
```
Or, if you are working with Spring:
```
dependencies {
	testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```
### Use Case Description

For this article, we will build a backend for a simple gym buddy app. You will pick a set of workouts that you do, add several sets and number of reps on each set.Also, you can add friends as your gym buddies and see their workout sessions. We will build a separate API to fetch all previous workouts sessions from the current user.

After implementing this simple backend we will focus on unit testing to show AssertJ ability.
{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/testing/assertj" %}

## Filtering Lists
### Filtering Using Predicate
In this chapter, I will write several examples showing how to use filters using predicates. This kind of filtering is the most common and intuitive one since it resembles lambda expression.

The next example shows the ease of use when we are dealing with simple conditions:
```
  @Test
  void checkIfTonyIsInList_basicFiltering(){
    assertThat(personService.getAll())
      .filteredOn(person -> person.getName().equals("Tony").isNotEmpty();
  }
```
Let up take a look into next test with multiple conditions to filter:
```
  @Test
  void filterOnNameContainsOAndNumberOfFriends_complexFiltering(){
    assertThat(personService.getAll())
            .filteredOn(person -> person.getName().contains("o") 
                                    && person.getFriends().size() > 1)
            .hasSize(1);
  }
```
It is pretty straightforward, but you can see that, with more complex conditions, our filtering statement will grow ever bigger.

Next tests shows predicate filtering with nested properties:
```
  @Test
  void filterOnAllSessionsThatAreFromToday_nestedFiltering() {
    assertThat(personService.getAll())
        .map(person -> 
          person.getSessions()
            .stream()
            .filter(session -> session.getStart().isAfter(LocalDateTime.now().minusHours(1))).count())
        .filteredOn(session -> session > 0).size().isEqualTo(4);
  }
```
I wanted to find all persons that had their workout done today. You can see that time of the session is a nested object inside a person, and a person contains a list of sessions. So, I had to create this, not so nice, piece of code to do this. We will show how to make this more readable using other AssertJ features.

### Field Filtering
AssertJ provides us a more elegant way to assert on list or nested objects inside the list. We call this field filtering. In the next examples, we will see how we can use field filtering and what are downsides of using it.

Here is a basic example of how to use basic field filtering:
```
  @Test
  void checkIfTonyIsInList_basicFieldFiltering(){
    assertThat(personService.getAll()).filteredOn("name", "Tony").isNotEmpty();
  }
```
You can see that name of the attribute is hard-coded as a string. This can cause problems in the future. If someone changes the name of attribute, this test will fail with
 __java.lang.IllegalArgumentException: Cannot locate field "attribute_name" on class "class_name".__

Now, let us have a look into next piece of code:
```
  @Test
  void filterOnNameContainsOAndNumberOfFriends_complexFieldFiltering() {
    assertThat(personService.getAll())
            .filteredOn("name", in("Tony","Carol"))
            .filteredOn(person -> person.getFriends().size() > 1)
            .hasSize(1);
  }
```
In this example, we can see two things. The first one is that field filtering can use __in, not, notIn__ filters that should help us in constructing our conditions. The second thing that you want to notice is that we cannot do any complex filtering using field filters. The second part of our chained filters is filtering using predicates.
### Predicates Vs Field Filtering - Null Values
In this subchapter, I will show how predicate and field filtering work in situations where one parent of nested objects is null and we want to assert something against that object.

First, let us go with predicate filtering:
```
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
            }
    ).collect(Collectors.toList());

    assertThat(sessions)
      .filteredOn(session -> session.getPerson().getName().equals("Tony")).isEmpty();
  }
```
__This code will throw NullPointerException since we are trying to call .getName() on null object.__

When we run this code:
```
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
            }
    ).collect(Collectors.toList());

    assertThat(sessions).filteredOn("person.name","Tony").isEmpty();
  }
```
__We will not face NullPointerException.__ Field filtering consider that every call on null value is null. Since “person” field is null “person.name” is also null and it satisfies the condition that there is no “Tony” inside this list of names.

### Using Custom Conditions

The next feature that I want to go through is creating custom conditions. You can create custom conditions in one place. This will make them easier to follow and understand. Each condition should have a meaningful name, so it is easier to follow. You can use conditions for a simple use case, but that would be small overkill. If you need basic examples, you can always use predicate or field filtering.
Now, let't take a look into one condition:
```
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
You can also create it as an extension of Condition class. I am more fond of this approach since you will have all conditions in one place and you can use them throughout all tests if needed:
```
  public class SessionStartedTodayCondition extends Condition<Person> {

      @Override
      public boolean matches(Person person){
          return 
            person.getSessions().stream()
                  .anyMatch(session -> session.getStart().isAfter(LocalDateTime.now().minusHours(1)));
      }
  }

  @Test
  void filterOnAllSessionsThatAreFromToday_customConditionFiltering() {
    Condition<Person> sessionStartedToday = new SessionStartedTodayCondition();
    assertThat(personService.getAll())
            .filteredOn(sessionStartedToday)
            .hasSize(4);
  }
```

## Extracting Fields

### Basic Field Extracting

In some use cases, we want to check only small portion of attributes inside objects in the list. Luckily AssertJ can help us there as well. If you want to check if the list contains objects, you can create a full object and check if it is in the list. On the other side, most likely you will need to check only certain attributes, e.g. check if the list contains provided names. We can do this in two ways.

The first one is old fashion way, where we extract a list of desired attributes beforehand and assert on that list. Like in our next example:
```
    @Test
    void checkByName_NotUsingExtracting(){
        assertThat(personService.getAll().stream().map(person -> person.getName()).collect(Collectors.toList()))
                .contains("Tony", "Bruce", "Carol","Natalia")
                .doesNotContain("Peter","Steve");
    }
```
In this example, we use stream API to remap the whole list into containing only person's names.
If you want to check on multiple attributes, you can do it using tuples:
```
    @Test
    void checkByNameAndLastname_NotUsingExtracting(){
        assertThat(personService.getAll().stream().map(person -> tuple(person.getName(), person.getLastname())).collect(Collectors.toList()))
                .contains(tuple("Tony","Stark"), tuple("Carol", "Danvers"), tuple("Bruce", "Banner"),tuple("Natalia","Romanova"))
                .doesNotContain(tuple("Peter", "Parker"), tuple("Steve","Rogers"));
    }
```

You can predict why this approach can be a little tiresome. Using AssertJ we can do this far easier. There is a method that will help us extract desired attributes.

Next examples show us how to use __.extracting()__ method:
```
    @Test
    void checkByName_UsingExtracting(){
        assertThat(personService.getAll())
                .extracting("name")
                .contains("Tony","Bruce","Carol","Natalia")
                .doesNotContain("Peter","Steve");
    }

    @Test
    void checkByNameAndLastname_UsingExtracting(){
        assertThat(personService.getAll())
                .extracting("name","lastname")
                .contains(tuple("Tony","Stark"), tuple("Carol", "Danvers"), tuple("Bruce", "Banner"),tuple("Natalia","Romanova"))
                .doesNotContain(tuple("Peter", "Parker"), tuple("Steve","Rogers"));
    }
```
As you can see, AssertJ allow us to write it far easier and with better readability.

__Extracting on null objects behaves same as field filtering.__

Here are two examples of it:
```
   @Test
    void checkByNestedAtrribute_UsingExtracting(){
        assertThat(sessionService.getAll())
                .filteredOn(session -> session.getStart().isAfter(LocalDateTime.now().minusHours(1)))
                .extracting("person.name")
                .contains("Tony","Bruce","Carol","Natalia");
    }

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

### Flatmap and Method Call Extracting

Our previous example where we wanted to find persons that had workout sessions done today was complex to implement using predicates, for such use cases flatmap comes to help.

Flatmap is a method for extracting child of an object, which is a list, and proceeding to do further assertions on that list. We can use flatmap in two ways. If you want to extract some property and you have a getter for that property, you can just state the name of that property:
```
    @Test
    void filterOnAllSessionsThatAreFromToday_flatMapExtracting(){
        assertThat(personService.getAll()).flatExtracting("sessions")
                .filteredOn(session -> ((Session)session).getStart().isAfter(LocalDateTime.now().minusHours(1)))
                .extracting("person.name")
                .contains("Tony", "Carol","Bruce","Natalia");
    }
```
On the other hand, if you want to create a real extractor that will do some logic on top of the extracted list, you can create it using Java functions:

```
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
And call it like this:
```
    @Test
    void filterOnAllSessionsThatAreFromToday_flatMapExtractingMethod(){
        assertThat(personService.getAll()).flatExtracting(PersonExtractors.sessions())
                .filteredOn(session -> session.getStart().isAfter(LocalDateTime.now().minusHours(1)))
                .extracting("person.name")
                .contains("Tony", "Carol","Bruce","Natalia");
    }
```
Method call extracting is similar to flatmap extracting. It allows us to call the method on top of each object in the list and create a new list on it, which we will continue our assertion. Simply call __.extractResultOf(“method name”)__ and continue with the assertion as needed.

## Soft Assertions

Let us go through the last part of this article. Imagine a situation where you want to check on several conditions and all of those assertions have to pass. You write your test and run it. You made a small mistake on the first assert and the console log shows it. You proceed with fixing it and you are all ready to leave your desk when you run tests again. Now, you have an error in the next assert. You fix that one too, but now the console shows that one more assert is failing. All frustrated, you decide to shut down everything and go for a run.

Hopefully, there is a solution to this exhaustive testing. It is called a soft assertion.

AssertJ allows us to write soft assertions which we can run all at once and collect all failing ones, not only the first one. Knowing all failing tests can give us a bigger picture and help us understand the mistake in our flow.

Let us go to examples of how to use soft assertions:
```
    @Test
    void softAssertionExample(){
        SoftAssertions softAssertions = new SoftAssertions();
        List<Person> persons = personService.getAll();
        softAssertions.assertThat(persons).hasSize(4);
        softAssertions.assertThat(persons).extracting("name","lastname")
                .contains(tuple("Tony Stark"),tuple("Peter Parker"));
        softAssertions.assertThat(persons).flatExtracting(PersonExtractors.sessions()).
                filteredOn(session -> session.getStart().isAfter(LocalDateTime.now().minusHours(1)))
                .extracting("person.name")
                .contains("Tony", "Carol","Bruce","Natalia");
        softAssertions.assertThat(persons).extracting("lastname").contains("Rogers");

        softAssertions.assertAll();
    }
```
This test will show that we have 2 failures and will show us exact failures.
```
org.assertj.core.error.AssertJMultipleFailuresError: 
Multiple Failures (2 failures)
-- failure 1 --
Expecting ArrayList:
  [("Tony", "Stark"),
    ("Bruce", "Banner"),
    ("Carol", "Danvers"),
    ("Natalia", "Romanova")]
to contain:
  [("Tony Stark"), ("Peter Parker")]
but could not find the following element(s):
  [("Tony Stark"), ("Peter Parker")]

at SoftAssertionTests.softAssertionExample(SoftAssertionTests.java:247)
-- failure 2 --
Expecting ArrayList:
  ["Stark", "Banner", "Danvers", "Romanova"]
to contain:
  ["Rogers"]
but could not find the following element(s):
  ["Rogers"]

at SoftAssertionTests.softAssertionExample(SoftAssertionTests.java:252)
```
You can avoid calling __.assertAll()__ manually by using one of there implementations:
  - JUnitSoftAssertions and Junit Rule
  - AutoClosableSoftAssertions
  - static assertSoftly method

I will show two examples, ones without having to introduce another dependency:
```
    @Test
    void softAssertionsExample_AutoClosableSoftAssertions(){
        List<Person> persons = personService.getAll();
        try (AutoCloseableSoftAssertions softAssertions = new AutoCloseableSoftAssertions()){
            softAssertions.assertThat(persons).hasSize(4);
            softAssertions.assertThat(persons)
                .extracting("name","lastname")
                .contains(tuple("Tony","Stark"),tuple("Peter","Parker"));
            softAssertions.assertThat(persons)
                .flatExtracting(PersonExtractors.sessions())
                .filteredOn(session -> session.getStart().isAfter(LocalDateTime.now().minusHours(1)))
                .extracting("person.name")
                .contains("Tony", "Carol","Bruce","Natalia");
            softAssertions.assertThat(persons)
                .extracting("lastname")
                .contains("Rogers");
        }
    }
```
```
    @Test
    void softAssertionsExample_staticMethod(){
        List<Person> persons = personService.getAll();

        SoftAssertions.assertSoftly(softAssertions -> {
            softAssertions.assertThat(persons).hasSize(4);
            softAssertions.assertThat(persons)
                .extracting("name","lastname")
                .contains(tuple("Tony","Stark"),tuple("Peter","Parker"));
            softAssertions.assertThat(persons)
                .flatExtracting(PersonExtractors.sessions())
                .filteredOn(session -> session.getStart().isAfter(LocalDateTime.now().minusHours(1)))
                .extracting("person.name")
                .contains("Tony", "Carol","Bruce","Natalia");
            softAssertions.assertThat(persons)
                .extracting("lastname")
                .contains("Rogers");
        });
    }
```
# Conclusion
Here are key takeaways from this article:
-  AssertJ provides us full functionality on asserting lists. We can split them into two groups:
    - Filtering
    - Extracting
- Filtering
  - We can filter in three ways::
      - Predicate
      - Field filtering
      - Custom conditions
  - The predicate will throw NullPointerException while field filtering will consider every child of null as null value
  - We should use the custom condition for more complex situations
- Extracting 
  - We can extract in three ways:
    - Basic extracting using field names
    - Flatmap extracting
    - Method call extracting
- We should use soft assertions when we have multiple assertions. It can give us the bigger picture of how the system behaves and why is our test failing.
