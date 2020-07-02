---
title: "One-stop Guide to Lombok"
categories: [craft]
date: 2020-06-21 10:00:00 +0500
modified: 2020-07-02 11:06:00 +0500
author: yalalovsm
excerpt: "What the Lombok is and why we should use it"
---

## What Is It
Lombok is a Java library that makes Java less chatty whilst making our code more readable. In short, this is a compile-time dependency that allows us to replace a typical boilerplate code with useful annotations. Since Java 6 the annotation processing API has been available. Annotation processing is a tool build in javac that scans and process annotations at compile time. Lombok has its implementation of the annotation processor for its annotations. This processor takes java code and generates .java files.

## Why to Use Lombok

Java is a great language but when we use it we have to write a lot of boilerplate code. For instance, we create a class with some fields. Further, we want to initialize that class and set the fields to some values or get the values of the fields in that class. To do that we have to explicitly create a constructor with or without parameters, setters, and getters. What if we want to use a builder pattern. We have to create lots of code. It worth mentioning the situation when our class needs an implementation of `equals()` and `hashCode()` methods. If we have lots of fields in our class the methods mentioned above can grow extremely large. Lombok offers to automate generating constructors, setters, getters, builders, and a lot of typical routine tasks using its annotations and let us focus on our task. Using Lombok can decrease the size of our source files significantly. For example, using `@Data` and `@EqualsAndHashCode` annotations in a class with about thirty fields decreases the size of the source java file in twice from about 16Kb to 8Kb.

## Which the Most Popular Features Lombok Has

### Generating Setters and Getters

With `@Setter` annotation we can set the values of the fields of the class. With `@Getter` annotation we can retrieve the values of the fields. These annotations can be applied to the class or fields.

```java
Person person1 = new Person();
person1.setFirstName("John");
person1.setLastName("Doe");
person1.setAge(30);

System.out.println(person.getFirstName() + " " + person.getLastName() + 
    " is " + person.getAge() + " years old.");
```

### Using Builder Pattern

`@Builder` annotation helps us to use [Builder pattern](https://refactoring.guru/design-patterns/builder).

```java
Ticket ticket = Ticket.builder()
    .number(ThreadLocalRandom.current().nextInt(1, 1000 + 1))
    .source("Berlin")
    .destination("Leipzig")
    .transportType("Train")
    .price(BigDecimal.valueOf(100))
    .owner(person)
    .build();
```

### Generating Various Types of the Constructors

Lombok has annotations that generate various types of constructors: the default constructor without any arguments, the constructor with all arguments, the constructor with only required arguments.
These are `@NoArgsConstructor`, `@AllArgsConstructor`, `@RequiredArgsConstructor`. We have to remember that `@RequiredArgsConstructor` annotations generate the constructor only for the fields marked as `final`

```java
Task task = new Task("House cleaning", "clean my table and wash dishes", LocalDateTime.now().plusHours(1));

Person person2 = new Person();
Person person3 = new Person("John", "Doe", 30, "555-1234");
```

### Generating `equals()` and `hashcode()` Methods

`@EqualsAndHashCode` annotation generates the implementation of the `equals(Object other)` and `hashCode()` methods. We can mark which fields to use by marking type members with `@EqualsAndHashCode.Include` or `@EqualsAndHashCode.Exclude` annotations.

```java
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode
public class Person {
    private String firstName;
    private String lastName;
    private Integer age;

    @EqualsAndHashCode.Exclude
    private String phone;
}
```

```java
@Test
public void testEqualsAndHashCode() {
    Person person1 = new Person("John", "Doe", 30, "555-1234");
    Person person2 = new Person("John", "Doe", 30, "555-1234");

    // objects are equal
    assertThat(person1.equals(person2), is(true));

    // the phone property is excluded
    person2.setPhone("555-4321");
    assertThat(person1.equals(person2), is(true));

    // modify the property which is included in equals() method
    person2.setAge(31);
    assertThat(person1.equals(person2), is(false));
}
```

### Checking the fields for null values

One of the useful Lombok features is `@NonNull`. This annotation can be applied to the parameter of the method or constructor or on the field of the class. Lombok generates a null-check statement for us.

```java
@Test
public void testNonNull() {
    try {
        Ticket ticket = Ticket.builder()
                .source("Berlin")
                .destination("Leipzig")
                .transportType("Train")
                .price(BigDecimal.valueOf(100))
                .build();
    } catch (Exception e) {
        final String expectedMsg = "number is marked non-null but is null";
        assertThat(e.getMessage(), equalTo(expectedMsg));
    }
}
```

### Add Logging Support

Using the annotation `@Slf4j` we can tell Lombok to generate static Slf4j Logger `log` field in our class. We can now log something with the chosen severity.

```java
@Slf4j
public class Person {
    private Integer age;

    public void setAge(final Integer age) {
        if (age < 0) {
            log.warn("Age is less than zero. Set to zero");
            this.age = 0;
        } else {
            this.age = age;
        }
    }
}
```

### Using the Combination of Annotations

When we work with the fields of the classes in Java we usually need setters, getters, constructors. If we compare the objects of our classes, we need `equals()` and `hashCode()` methods. And quite often we need `toString()` method to stringify information about our object. For the actions above we can use a few Lombok annotations: `@Setter`, `@Getter`, `@RequiredArgsConstructor`, `@EqualsAndHashCode`, and `@ToString`. We can combine them and use a shortcut annotation `@Data` that bundles all these features.

```java
@Data
public class Task {
    private final String name;
    private final String description;
    private final LocalDateTime ends;
}
```

## How to Add the Support of Lombok in Our Project

### Maven Build Tool

The only thing we have to do is to add Lombok dependency in `pom.xml` as `provided`. It means that this dependency will be used only on compiling out source code and will not be present when running/testing/jarring/otherwise deploying our code.

```java
<dependencies>
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.12</version>
    <scope>provided</scope>
  </dependency>
</dependencies>
```

### Gradle Build Tool

To use Lombok with Gradle we have to add Lombok dependency in our `build.gradle` file. Gradle has the built-in `compileOnly` scope, which can be used to tell Gradle to add Lombok only during compilation.

```java
repositories {
    mavenCentral()
}

dependencies {
  compileOnly 'org.projectlombok:lombok:1.18.12'
  annotationProcessor 'org.projectlombok:lombok:1.18.12'
}
```

There is also a plugin for Gradle that is recommended for use. It can be found [here](https://plugins.gradle.org/plugin/io.freefair.lombok).

### Ant Build Tool

When use Ant we have to ensure that Lombok is on the classpath if our `<javac>` task. Assuming that we've put lombok.jar in a lib dir, our javac task would have to look like:  
```java
<javac srcdir="src" destdir="build" source="1.8">
    <classpath location="lib/lombok-1.18.12.jar" />
</javac>
```

It is not convenient and it is recommended to use `ivy`, the ant add-on that lets us fetch dependencies from the internet automatically. In that case assuming that we have configuration named `build` we can easily add:
```java
<dependencies>
    <dependency org="org.projectlombok" name="lombok" rev="1.18.12" conf="build->master" />
</dependencies>
```

### Settings for Intellij Idea to Activate the Lombok Preprocessing

The Jetbrains IntelliJ IDEA is compatible with Lombok. To add Lombok support for IntelliJ we have to add the [Lombok IntelliJ plugin](https://plugins.jetbrains.com/plugin/6317). To compile our project successfully in IntelliJ IDEA we have to enable annotation processing that is disabled by default. To do that use dialog `Preferences > Project Settings > Compiler > Annotation Processors` and check `Enable annotation processing`


### Add Support of Lombok in Eclipse

Download `lombok-1.18.12.jar` file from the Maven Central repository. Next, we can run the jar with `java -jar lombok-1.18.12.jar`. This starts the Eclipse UI installer which finds all installations of Eclipse and offers to install Lombok into these Eclipse installations. We can choose the Eclipse installation where we want to install Lombok and press the _Install_ button. After installing the plugin and exiting the installer we need to restart the Eclipse to ensure that Lombok is configured properly.

## Caveats When Using Lombok

Lombok is a very popular library that helps us to eliminate the amount of boilerplate code. But sometimes we overuse its features.

- Moving the logic outside the getters and setters.  
We use annotations `@Setter` and `@Getter` for generating setters and getters and we forget sometimes that we do not need to expose all the fields of our class. Also, we take an attribute with the getter and do some logic with it instead of moving that logic into the domain object. Thus we violate the [TellDontAsk principle](https://martinfowler.com/bliki/TellDontAsk.html).
- Not correct use of `@Builder` annotation.  
It is very convenient to use `@Builder` annotation even if we a couple of fields in the class. But the Builder pattern is intended to use when we have lots of fields and constructor becomes too big.
- We must be very careful with annotations that generate constructors. `@NoArgsConstructor` allows creating an object in an invalid state. `@AllArgsConstructor` generate constructor with all the fields in the class. But the order of the parameters in constructor various according to the declaration of the class attributes.
- When we use `@EqualsAndHashCode` we have to be very careful especially when we deal [with databases](https://vladmihalcea.com/the-best-way-to-implement-equals-hashcode-and-tostring-with-jpa-and-hibernate/). It's better to explicitly set the attributes that will be considered in `equals()` and `hashCode()` methods or add `@EqualsAndHashCode.Exclude` annotation with the attributes which we want to exclude from considering.

## Delombok

Using the Lombok annotations in our Java objects will generate boilerplate code at compile time. Delombok will show us how the generated code looks like because the Lombok generated code is available in `.class` files and we cannot look into the code directly. Delombok is often used when we decided to decline using Lombok in our project and we want to keep all the features we had when had used Lombok.
To use delombok features we have to add the next configuration in `pom.xml` under `build -> plugins` section:

```java
<plugin>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok-maven-plugin</artifactId>
    <version>1.18.12.0</version>
    <executions>
        <execution>
            <id>delombok</id>
            <phase>generate-sources</phase>
            <goals>
                <goal>delombok</goal>
            </goals>
            <configuration>
                <addOutputDirectory>false</addOutputDirectory>
                <sourceDirectory>src/main/java</sourceDirectory>
            </configuration>
        </execution>
    </executions>
</plugin>

```

## Conclusion

There are a lot of languages we can use to reach our goals. There are a lot of frameworks, libraries, and tools which help us ease our way to that goal. And Lombok is one of them. It makes Java less chatty. It removes boilerplate code. It prevents us from errors when writing typical pieces of the code. And annotations in Java used to makes our code more readable. So the Lombok does.
And with using Lombok Java becomes more powerful and pleasant to use language.
