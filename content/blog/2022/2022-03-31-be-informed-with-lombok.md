---
title: "Be informed with Project Lombok"
categories: ["Java"]
date: 2022-03-31 00:00:00 +1100
modified: 2022-03-31 00:00:00 +1100
authors: ["ranjani"]
description: "A brief on how to and how not to use Project Lombok"
image: images/stock/0010-gray-lego-1200x628-branded.jpg
url: be-informed-with-project-lombok
---

[Project Lombok](https://projectlombok.org/) is a popular library that **helps us to write clear, concise and less repetitive code**.
However, among the developer community, it has been both embraced and criticised for reasons I would like to elaborate here.

In this article, we will focus on factors that will help you make an informed decision about using the library effectively
and being wary of its consequences.

## Code Example

This article is accompanied by working code examples that demonstrates commonly used Lombok features on [Github](https://github.com/thombergs/code-examples).


## What is Lombok?

According to official docs, "Project Lombok is a java library that automatically plugs into your editor and build tools, spicing up your Java."

This library provides a set of user-friendly annotations that generate the code at compile-time, helping the developers **save time, space and improving code readability**.

## IDE Support 

All popular IDEs support Lombok via a plugin. We need to ensure annotation processing is enabled as in the example configuration of IntelliJ below.
{{% image alt="settings" src="images/posts/lombok/settings.PNG" %}}
Annotation processing makes it possible for the IDE to evaluate the Lombok annotations and generate the source code from them at compile-time.

### Setting Up a Project with Lombok

To use the Lombok features in a new or an existing project, **add a compile-time dependency to `lombok`** as below. 
It makes the Lombok libraries available to the compiler but is not a dependency on the final deployable jar:

With Maven:
```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.20</version>
    <scope>provided</scope>
</dependency>
```

With Gradle:
```groovy
compileOnly group: 'org.projectlombok', name: 'lombok', version: '1.18.20'
```

As an example, consider the below java class:

 ```java
public class Book {
    private String isbn;

    private String publication;

    private String title;

    private List<Author> authors;

    public Book(
            String isbn, 
            String publication, 
            String title,
            List<Author> authors) {
        // Constructor logic goes here
    }

    // All getters and setters are explicitly defined here    

    public String toString() {
        return "Book(isbn=" + this.getIsbn() 
                + ", publication=" + this.getPublication() 
                + ", title=" + this.getTitle() 
                + ", authors=" + this.getAuthors() 
                + ", genre=" + this.getGenre() + ")";
    }
}
```

Using Lombok, we can simplify the above plain Java class to this:

```java
@Getter
@Setter
@AllArgsConstructor
@ToString
public class Book {
    private String isbn;

    private String publication;

    private String title;

    private List<Author> authors;
}
```
The above code looks much cleaner and easier to write and understand.

## How Lombok Works

All annotations in Java are processed during compile time by a set of annotation processors. 
The Java specification publicly does not allow us to modify the Abstract Syntax Tree (AST). 
It only mentions that annotation processors generate new files and documentation. 

Since the Java Compiler Specification does not prevent annotation processors from modifying source files, 
Lombok developers have cleverly used this loophole to their advantage. 
For more information on how annotation processing in Java works, [refer here](https://reflectoring.io/java-annotation-processing/).

## Advantages of Lombok

Let's look at some of the most prominent benefits of using Lombok.

### Clean Code

With Lombok, we can replace boiler-plate code with meaningful annotations. They help the developer focus on business logic.
Lombok also provides some annotations that combine multiple other annotations (like `@Data` combines `@ToString`, `@EqualsAndHashCode`, `@Getter` / `@Setter` and `@RequiredArgsConstructor` together), so we don't have to "pollute" our code with too many annotations.

Since the code is more concise, modifying and adding new fields doesn't require so much typing.
A list of all available annotations is available [here](https://projectlombok.org/features/all). 

### Simple Creation of Complex Objects

**The Builder pattern is used when we need to create objects that are complex and flexible** (in constructor arguments). 
With Lombok, this is achieved using `@Builder`.

Consider the below example:

```java
@Builder
public class Account {
    private String acctNo;
    private String acctName;
    private Date dateOfJoin;
    private String acctStatus;
}
```
 Let's use Intellij's "Delombok" feature to understand the code written behind the scenes.

 {{% image alt="delombok example" src="images/posts/lombok/delombok.png" %}}

```java
public class Account {
    private String acctNo;
    private String acctName;
    private String dateOfJoin;
    private String acctStatus;

    Account(String acctNo, String acctName, String dateOfJoin, String acctStatus) {
        this.acctNo = acctNo;
        this.acctName = acctName;
        this.dateOfJoin = dateOfJoin;
        this.acctStatus = acctStatus;
    }

    public static AccountBuilder builder() {
        return new AccountBuilder();
    }

    public static class AccountBuilder {
        private String acctNo;
        private String acctName;
        private String dateOfJoin;
        private String acctStatus;

        AccountBuilder() {
        }

        public AccountBuilder acctNo(String acctNo) {
            this.acctNo = acctNo;
            return this;
        }

        public AccountBuilder acctName(String acctName) {
            this.acctName = acctName;
            return this;
        }

        public AccountBuilder dateOfJoin(String dateOfJoin) {
            this.dateOfJoin = dateOfJoin;
            return this;
        }

        public AccountBuilder acctStatus(String acctStatus) {
            this.acctStatus = acctStatus;
            return this;
        }

        public Account build() {
            return new Account(acctNo, acctName, dateOfJoin, acctStatus);
        }

        public String toString() {
            return "Account.AccountBuilder(acctNo=" + this.acctNo + ", acctName=" + this.acctName + ", dateOfJoin=" + this.dateOfJoin + ", acctStatus=" + this.acctStatus + ")";
        }
    }
}
```
The code written with Lombok is much easier to understand than the one above which is too verbose. 
As we can see, **all the complexity of creating the Builder class is hidden from the developer, making the code more precise.**
Now, we can create objects easily.
```java
 Account account = Account.builder().acctName("Savings")
     .acctNo("A001090")
     .build();
```

### Creating Immutable Objects Made Easy

Once created, an immutable object cannot be modified. The concept of immutability is vital when creating a Java application. 
Some of its benefits include thread safety, ease of caching, ease of object maintainability. 
To understand why it is a good idea to make classes immutable refer to [this article](https://reflectoring.io/java-immutables/).

Lombok provides the `@Value` annotation to create immutable classes:

```java
@Value
public class Person {
    private String firstName;
    private String lastName;
    private String socialSecurityNo;
    private List<String> hobbies;
}
```

Delomboked version is as below:
 
```java
public final class Person {
  private final String firstName;
  private final String lastName;
  private final String socialSecurityNo;
  private final List<String> hobbies;

  public Person(String firstName, String lastName, String socialSecurityNo, List<String> hobbies) {
     this.firstName = firstName;
     this.lastName = lastName;
     this.socialSecurityNo = socialSecurityNo;
     this.hobbies = hobbies;
  }

  public String getFirstName() {
     return this.firstName;
  }

  public String getLastName() {
     return this.lastName;
  }

  public String getSocialSecurityNo() {
     return this.socialSecurityNo;
  }

  public List<String> getHobbies() {
     return this.hobbies;
  }

  public boolean equals(final Object o) {
     // Default equals implementation
  }

  public int hashCode() {
     // default hashcode implementation
  }

  public String toString() {
     return "Person(firstName=" + this.getFirstName() + ", lastName=" + this.getLastName() + ", socialSecurityNo=" + this.getSocialSecurityNo() + ", hobbies=" + this.getHobbies() + ")";
  }
}
```
The `@Value` annotation ensures the state of the object is unchanged once created.
 - it makes the class final
 - it makes the fields final
 - it generates only getters and not setters
 - it creates a constructor that takes all fields as an argument

In other words, the `@Value` annotation is a shorthand for using all of these annotations:
* `@Getter`, 
* `@FieldDefaults(makeFinal=true, level=AccessLevel.PRIVATE)`,
* `@AllArgsConstructor`, 
* `@ToString`, and
* `@EqualsAndHashCode`.

We can further enforce immutability in the above example by adding `@AllArgsConstructor(access = AccessLevel.PRIVATE)` to make the constructor private and force object creation via the Builder pattern.

If you're looking for a library that generates immutable objects, you should also have a look at the [immutables library](/immutables-library/).

## Caveats with Lombok

Above are some benefits of using Lombok. By now you would have realised the value these annotations can provide to your code.
However, in my experience of using Lombok, I have noticed developers misusing these annotations and using them across the whole codebase, making the code messy and prone to errors**.

Let's look at some  situations where Lombok could be used incorrectly.

### Using Lombok with JPA Entities

Although using Lombok to generate boilerplate code for entities is attractive, it **does not work well with JPA and Hibernate entities**.
Below are a few examples of what could go wrong when using Lombok with JPA.

#### Avoid `@ToString`
**The seemingly harmless @ToString could do more harm to our application than we would expect.**
Consider the below entity classes:

````java
@Entity
@Table(name = "BOOK")
@Getter
@Setter 
@ToString
public class Book {
    @Id
    private long id;

    private String name;

    @ManyToMany(cascade = CascadeType.PERSIST, fetch = FetchType.LAZY)
    @JoinTable(name = "publisher_book", joinColumns = @JoinColumn(name = "book_id", referencedColumnName = "id"), inverseJoinColumns = @JoinColumn(name = "publisher_id", referencedColumnName = "id"))
    private Set<Publisher> publishers;
}

````
````java

@Entity
@Getter
@Setter
@Builder
@ToString
public class Publisher implements Serializable {

    @Id
    private long id;

    private String name;

    @ManyToMany(mappedBy = "publishers")
    private Set<Book> books;
}

````
As we can see, there is a `@ManyToMany` relationship that requires a `JOIN` with another table to fetch data.
The Repository class that fetches data from the table is as below:

````java
@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
}
````
There are **three** main problems here:
1. In an entity class, not all attributes of an entity are initialized. If an attribute has a `FetchType` of `LAZY`,
it gets invoked only when used in the application. However, **`@ToString` requires all attributes 
of an entity and would trigger the lazy loading, making one or multiple database calls. This can unintentionally cause performance issues**.
2. Further, if we **call `toString()` on the entity outside of the scope of a transaction**, it could lead to a`LazyInitializationException`.
3. In the case of associations like `@ManyToMany` between 2 entities, **logging the entity data could result in evaluating circular references and causing a `StackOverflowError`**. In the example above, the `Book` entity 
will try to fetch all authors of the book. The `Author` entity in turn will try to find all books of the author. This process will keep repeating until it results in an error.

#### Avoid `@EqualsAndHashCode`
Lombok uses all non-final attributes to evaluate and override default equals and hashCode. This isn't always desirable in the case of entities due to the following reasons:
1. Most primary keys in the database are auto-generated by the database 
during insertion. **This can cause issues in the hashCode computation process
as the `ID` is not available before the entity has been persisted, causing unexpected results**.
2. **Every database record is uniquely identified by its primary key**. In such cases using the Lombok implementation of `@EqualsAndHashCode` might not be ideal. 

Although Lombok allows us to include and exclude attributes, for the sake of brevity it might be a **better option to 
override these methods (toString(), equals(), hashcode()) ourselves** and not rely on Lombok.

### Lombok Annotations Hide Violations
Consider a model class in the example below:
```java
@Data
@Builder
@AllArgsConstructor
public class CustomerDetails {

    private String id;
    private String name;
    private String buildingNm;
    private String blockNo;
    private String streetNm;
    private String city;
    private int postcode;
    private String state;
    private String country;
    private Gender gender;
    private String dateOfBirth;
    private String email;
    private String phoneNo;
    private String drivingLicenseNo;
    private String licenseIssueState;
}
```
The above class has the following flaws:
1. It is a poorly designed model class. We could consider restructuring the fields to create separate classes to store Address and LicenseDetails.
2. **`@Builder` hides the complexity of autowiring instances** especially if custom objects 
having multiple dependencies are added to the class. This affects code readability and destroys the concept of the [Single Responsibility Principle](https://reflectoring.io/single-responsibility-principle/).
3. **Using these annotations can hide errors and warnings produced by static analyzers such as CheckStyle or Sonar** which is not desirable.
This is shown in the sample below:
   {{% image alt="delombok example" src="images/posts/lombok/checkstyle.png" %}}
   {{% image alt="delombok example" src="images/posts/lombok/checkstyle_err.png" %}}
4. With `@AllArgsConstructor` referring to multiple same-type parameters, it is easy to accidentally define parameters out of order. 
It affects code readability and introduces bugs that can be difficult to trace.

In my experience, I have seen huge complex objects having multiple dependencies.
Developers tend to use these annotations to escape Sonar checks making it difficult to maintain the code.

### Application Logic Should Not Depend on the Generated Code

Apart from following good programming practices, developers try to generalize features to ensure re-usability. 
However, these features should _NEVER_ depend on the code that Lombok generates. 

For instance, consider we create a base feature that uses reflection to create objects. 
The DTOs use `@Builder`, and we use the Lombok-generated code in it. If someone decides to create new DTOs 
that use `@Builder(setterPrefix = "with")`, this could be catastrophic in huge, complex applications, because the feature using reflection will be broken. 

Since Lombok provides a lot of flexibility in the way objects are created, we should be equally responsible and use them appropriately.

### `@SneakyThrows` Can Be Evil

Let's first consider this example:
````java
public interface DataProcessor {
    void dataProcess();
}   
````
Without `@SneakyThrows` an implementation of DataProcessor would be like this:
````java
public class FileDataProcessor implements DataProcessor {
    @Override
    public void dataProcess() {
        try {
            processFile();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void processFile() throws IOException {
        File file = new File("sample.txt");
        throw new IOException(); // forcibly throw
    }
}
````
With `@SneakyThrows` the code gets simplified
````java
public class FileDataProcessor implements DataProcessor {
    @Override
    @SneakyThrows
    public void dataProcess() {
       processFile();
    }

    private void processFile() throws IOException {
        File file = new File("sample.txt");
        throw new IOException();
    }
}
````
As we can see, **`@SneakyThrows` avoids the hassle of catching or throwing checked exceptions**. In other words, it treats a checked exception like an unchecked one.

This can be useful, especially when writing lambda functions making the code concise and clean. However, since the annotation swallows the checked exception we cannot catch them explicitly. 

Instead, we usually want to bubble up exceptions to be handled by a global exception handler.
Therefore, **use `@SneakyThrows` only when you don't intend to process the code selectively depending on the kind of Exception it throws**.
**Ensure it is used cautiously and not as an alternative to bypass checked exceptions.**

## Use Lombok with Caution

The power of Lombok cannot be underestimated or ignored. However, I would like to summarise the key points
that will help you use Lombok in a better way.
1. **Avoid using Lombok with JPA entities**. It will be much easier generating the code yourself than debugging issues later.
2. When designing POJO's **use only the Lombok annotations you require** (use shorthand annotations sparingly).
I would recommend using the Delombok feature to understand the code generated better.
3. **Do not add too many dependencies in the POJOs**. Keep the classes relevant to the responsibility they are designed for. 
It is easy to lose track of dependent objects with Lombok.
4. Since `@Builder` gives a lot of flexibility in object creation it **can cause objects to be in an invalid state**. 
Therefore, make sure all the required attributes are assigned values during object creation.
5. **DO NOT write code that could have a huge dependency on the background code Lombok generates**.
6. When using test coverage tools like Jacoco, Lombok can cause problems since **Jacoco cannot distinguish between Lombok generated code and normal source code**. 
You might want to consider **excluding Lombok generated code for Jacoco test coverage**. More information on this is available [here](https://github.com/jacoco/jacoco/pull/495)
7. **Use `@SneakyThrows` for checked exceptions that you don't intend to selectively catch**. Otherwise, wrap them in runtime exceptions that you throw instead.
8. **Overusing @SneakyThrows** in an application could make it **difficult to trace and debug errors**.


