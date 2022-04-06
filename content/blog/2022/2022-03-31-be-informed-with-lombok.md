---
title: "Should I Use Project Lombok or Not?"
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

All popular IDEs support Lombok. For example, Intellij version 2020.3 and above is compatible with Lombok without a plugin. For earlier versions, plugins can be installed from [here](https://plugins.jetbrains.com/plugin/6317-lombok/).
Once installed, we need to ensure annotation processing is enabled as in the example configuration below.
{{% image alt="settings" src="images/posts/lombok/settings.PNG" %}}
Annotation processing makes it possible for the IDE to evaluate the Lombok annotations and generate the source code from them at compile-time.

For Eclipse, install the Lombok plugin downloaded from this [location](https://search.maven.org/search?q=g:org.projectlombok%20AND%20a:lombok&core=gav). 

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

As an example, consider the below Java class:

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

## Benefits of Lombok

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

This is the code that Lombok generates for the `Account` class with the `@Builder` annotation:
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
As we can see, **all the complexity of creating the Builder class is hidden from the developer, making the code more concise.**
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
However, in my experience of using Lombok, I have noticed developers misusing these annotations and using them across the whole codebase, making the code messy and prone to errors.

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
There are some problems here:
1. In an entity class, not all attributes of an entity are initialized. If an attribute has a `FetchType` of `LAZY`,
it gets fetched from the database only when the getter is called. However, **`@ToString` uses the getters of the entity and triggers lazy loading, making one or multiple database calls. This can unintentionally cause performance issues**.
2. Further, if we **call `toString()` on the entity outside of the scope of a transaction**, it could lead to a `LazyInitializationException`.
3. In the case of associations like `@ManyToMany` between 2 entities, **logging the entity data could result in evaluating circular references and causing a `StackOverflowError`**. In the example above, the `Book` entity 
will try to fetch all authors of the book. The `Author` entity in turn will try to find all books of the author. This process will keep repeating until it results in an error.

#### Avoid `@EqualsAndHashCode`
Lombok uses all non-final attributes to evaluate and override default equals and hashCode. This isn't always desirable in the case of entities due to the following reasons:
1. Most primary keys in the database are auto-generated by the database 
during insertion. **This can cause issues in the `hashCode()` computation process
as the `ID` is not available before the entity has been persisted, causing unexpected results**.
2. **Every database record is uniquely identified by its primary key**. In such cases using the Lombok implementation of `@EqualsAndHashCode` might not be ideal. 

Although Lombok allows us to include and exclude attributes, for the sake of brevity it might be a **better option to 
override these methods (`toString()`, `equals()`, `hashcode()`) ourselves** and not rely on Lombok.

### Lombok Hides Coding Violations
Consider a snippet of the model class as below:
```java
@Data
@Builder
@AllArgsConstructor
public class CustomerDetails {

   private String id;
   private String name;
   private Address address;
   private Gender gender;
   private String dateOfBirth;
   private String age;
   private String socialSecurityNo;
   private Contact contactDetails;
   private DriverLicense driverLicense;
}
```
For the project, we have configured a static code analyzer CheckStyle that runs as a part of the maven `verify` step.
In case of the above example (that uses Lombok) the code builds without any issues.
{{% image alt="settings" src="images/posts/lombok/checkstyle_no_errors.JPG" %}}

In constrast, let's replace the same class with its Delomboked version. After the annotations get replaced with its corresponding constructors, we see issues with the static code analyzer as below.
{{% image alt="settings" src="images/posts/lombok/checkstyle_with_errors.JPG" %}}

In my experience, I have seen developers use these annotations to escape such violations making it difficult to maintain the code.

### Additional Configuration Required With Code Coverage Tools

Tools such as **JaCoCo** help create better quality software, as they point out areas of low test coverage in their reports.
Using Lombok that generates code behind the scenes, greatly affects its code coverage results.
[Additional configuration](https://reflectoring.io/jacoco/#excluding-code-generated-by-lombok) is required to exclude Lombok-generated code.

### `@AllArgsConstructor` May Introduce Errors When Refactoring

Consider an example class:
```java
@AllArgsConstructor
public class Customer {
   private String id;
   private String name;
   private Gender gender;
   private String dateOfBirth;
   private String age;
   private String socialSecurityNo;
}
```
Let's create an object of Customer class
```java
Customer c = new Customer(
        "C001",
        "Bryan Rhodes", 
        Gender.MALE, 
        "1986/02/02", 
        "36", 
        "07807789");
```
Here, we see that most of the attributes have `String` as its type. It is easy to mistakenly create an object
whose params are out of order like this:
```java
Customer c = new Customer(
        "C001", 
        "Bryan Rhodes", 
        Gender.MALE,  
        "36", 
        "1986/02/02", 
        "07807789");
```
If validations are not in place for the attributes, this object might propagate as is in the application and cause errors in other places (or worse: it might go undetected).

Using `@Builder` might avoid such errors.

### @Builder Allows Creation of Invalid Objects

Consider a model as below:
```java
    @Builder
    public class Job {
        private String id;
        
        private JobType jobType;
    }

    public enum JobType {
        PLUMBER,
        BUILDER,
        CARPENTER
    }
```
For this class, we could construct an object as 
```java
    Job job = Job.builder().id("5678").build();
```
Although the code compiles, the object `job` here is in an invalid state because we do not know its `JobType`.
Therefore, along with using the `@Builder` annotation, it is also important to enforce required attributes to have a value.

To do this we could consider using Lombok's `@NonNull` annotation. 
With this annotation in place we now get the below error:
{{% image alt="settings" src="images/posts/lombok/builder_err.JPG" %}}

An object successfully created with this approach would now be considered valid.

### Application Logic Should Not Depend on the Generated Code

Apart from following good programming practices, developers try to generalize features to ensure re-usability. 
However, these features should _NEVER_ depend on the code that Lombok generates. 

For instance, consider we create a base feature that uses reflection to create objects. 
The DTOs use `@Builder`, and we use the Lombok-generated code in it. If someone decides to create new DTOs 
that use `@Builder(setterPrefix = "with")`, this could be catastrophic in huge, complex applications, because the feature using reflection will be broken. 

Since Lombok provides a lot of flexibility in the way objects are created, we should be equally responsible and use them appropriately.

### Use `@SneakyThrows` cautiously

`@SneakyThrows` can be used to sneakily re-throw a checked exception without declaring it in the "throws" clause.
Lombok achieves this by faking out the compiler. It relies on the fact that the forced check applies only to the compiler and not the JVM.
Therefore, it modifies the generated class file to disable the check at compile time thus treating checked exceptions as unchecked.

To understand better, let's first consider this example:
````java
public interface DataProcessor {
    void dataProcess();
}   
````
Without `@SneakyThrows` an implementation of `DataProcessor` would be like this:
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
        File file = new ClassPathResource("sample.txt").getFile();
        log.info("Check if file exists: {}", file.exists());
        return FileUtils.readFileToString(file, "UTF-8");
    }
}
````
With `@SneakyThrows` the code gets simplified
````java
public class FileDataProcessor implements DataProcessor {
    @Override
    public void dataProcess() {
       processFile();
    }

    @SneakyThrows
    private void processFile() {
        File file = new ClassPathResource("sample.txt").getFile();
        log.info("Check if file exists: {}", file.exists());
        return FileUtils.readFileToString(file, "UTF-8");
    }
}
````
As we can see, **`@SneakyThrows` avoids the hassle of catching or throwing checked exceptions**. In other words, it treats a checked exception like an unchecked one.

This can be useful, especially when writing lambda functions making the code concise and clean. 

However, **use `@SneakyThrows` only when you don't intend to process the code selectively depending on the kind of Exception it throws**.
For instance, if we try to catch `IOException` after applying `@SneakyThrows`, we would get the below compile-time error
{{% image alt="settings" src="images/posts/lombok/sneakyThrows.png" %}}

The invisible IOException gets propagated, but the compiler doesn't realize it and so it complains.

If we want to handle the exception specifically, we have to resort to reflection, which is what Spring does under the covers, for example:
{{% image alt="settings" src="images/posts/lombok/exception.png" %}}

Further, we could build logic to read the content of a file and parse it to dates which might result in `DateTimeParseException`. Bubbling up of such 
checked exceptions and using `@SneakyThrows` to escape its handling might make it difficult to trace errors.

Therefore, be careful when using this annotation to escape multiple checked exceptions. 

## Use Lombok with Caution

The power of Lombok cannot be underestimated or ignored. However, I would like to summarise the key points
that will help you use Lombok in a better way.
1. **Avoid using Lombok with JPA entities**. It will be much easier generating the code yourself than debugging issues later.
2. When designing POJOs **use only the Lombok annotations you require** (use shorthand annotations sparingly).
I would recommend using the Delombok feature to understand the code generated better.
3. `@Builder` gives a lot of flexibility in object creation. This **can cause objects to be in an invalid state**. 
Therefore, make sure all the required attributes are assigned values during object creation.
4. **DO NOT write code that could have a huge dependency on the background code Lombok generates**.
5. When using test coverage tools like Jacoco, Lombok can cause problems since **Jacoco cannot distinguish between Lombok generated code and normal source code** and
configure them accordingly.
6. **Use `@SneakyThrows` for checked exceptions that you don't intend to selectively catch**. Otherwise, wrap them in runtime exceptions that you throw instead.
7. **Overusing @SneakyThrows** in an application could make it **difficult to trace and debug errors**.


