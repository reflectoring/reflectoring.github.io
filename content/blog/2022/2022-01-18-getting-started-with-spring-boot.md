---
title: "Getting Started with Spring Boot"
categories: ["Spring"]
date: 2022-01-18 00:00:00 +1100 
modified: 2022-01-18 00:00:00 +1100
authors: [mateo]
excerpt: "A comprehensive entry level guide through Spring Boot"
image: images/stock/0012-pages-1200x628-branded.jpg 
url: getting-started-with-spring-boot
---

In this article, we will build a production-grade application with Spring Boot. The goal is to answer two questions:
- How do we use Spring Boot features?
- Why do we use Spring Boot the way we use it?

After understanging the use case and requirements, we will implement the application layer by layer.

Let us dive into the requirements for the application so we can understand what are we building.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/beginners-guide" %}}

## Requirements
We need to build an application for the local bookstore that will allow them to keep track of borrowed books.

The bookstore wants to have these functionalities in the application:
- The application should be accessible through the web browser.
- The user has to provide their name, last name, email, and password.
- Each book has information about the author, date of publication, number of instances, and users that currently own the book.
- The user can see all available books.
- The user can borrow a book.
- Each user can borrow only three books at one point in time.
- The admin user can add new book into the bookstore.
- The admin user can delete a book from the bookstore.
- The admin user can update information about a book in the bookstore.

## High-level Architecture

We want to make sure that we understand desired requirements fully before we develop anything, so let's create a diagram of our application:

{{% image alt="Spring Boot High-level arch " src="images/posts/spring-boot-begginer-guide/SpringApplication.png" %}}

Typing `www.bookstore.loc` in the browser will guide the user to the homepage.
The homepage triggers the request to load all books available in the bookstore.

We decided to build the backend application using Spring Boot. Inside the __Spring Boot Application__ box, we can see layers we will implement through this article.

Controller classes accept the request from the browser and send it further down layers.

Methods inside the service layers contain all business logic.
The service methods contact the repository layer to access the database.

We store the data about the books and the users in the database. For this article, we chose the in-memory H2 database.

## Setting up the Project
Spring provides the Spring Initializr project which creates an application skeleton for us to jumpstart our development and let us dive into the code and write business logic.

We will look at two ways how to create a new Spring Boot project:
- [Creating the project using Spring Initializr](#creating-the-project-with-spring-initializr)
- [Creating the project using the IntelliJ IDE](#create-the-project-with-intellij)

Both ways use the Spring Initializt project underneath and you can choose whichever way works best for you.

### Creating the Project with Spring Initializr

On the [Spring Initilizr page](https://start.spring.io/), we can create a new Spring Boot project:

{{% image alt="Spring Boot initialization online" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-online.png" %}}

On this page, we provide the metadata about the application.

After defining all necessary information, we can go and add our dependencies. 

By clicking on the button on the top right corner, we can see the dependency selection screen:

{{% image alt="Spring Boot initialization online" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-online-2.png" %}}

We will select several dependencies:
- [Spring Web](#the-spring-web-dependency)
- [Spring Data JPA](#the-spring-data-jpa-dependency)
- [H2 Database](#the-h2-database-dependency) 

After selecting desired dependencies, we can generate our project by clicking the "Generate" button on the lower-left corner of the screen. 

Clicking the button will download the zip file onto our machine, and we need to unpack the provided zip file and import it into the IDE.

#### The Spring Web Dependency
The Spring Web dependency provides everything needed to build a Spring MVC application. 

Spring MVC is how Spring implements the Model-View-Controller design pattern. 
A controller is the front part of the application that takes incoming requests and relays them to the right destination. 
Model is the object or collection that holds our data.
View represents the pages that the browser renders.

Let us look into the high-level architecture again and determine what does the Spring Web dependency provides:

{{% image alt="Spring Boot High-level arch " src="images/posts/spring-boot-begginer-guide/SpringApplication-springWeb.png" %}}

The Spring Web dependency provides the core Spring features (Inversion of Control, Spring MVC, server container for local running, etc.).

With the Spring Web dependency, we can create `@RestController`, `@Service`, and `@Repository` classes from the image above. We can not access anything in the Spring Data JPA dependency.

If we run the application, we will see that the process starts, and we can access the application on `http://localhost:8080`.
We won't see much, but the application will be up and running.

#### The Spring Data JPA Dependency
The Spring Data JPA dependency allows us to create the data access layer almost without effort.

Let us look into the application diagram to see which parts do we get with Spring Data JPA:

{{% image alt="Spring Boot High-level arch " src="images/posts/spring-boot-begginer-guide/SpringApplication-springData.png" %}}

Building the data access layer can be cumbersome, and Spring Data JPA data gives us everything we need to start creating our first entity.

With Spring Data JPA, we can use the `@Entity` annotation to create database entities.

The database entity is the direct connection between the application and the table in the database. We can present constraints and relationships using annotations.

Spring Data JPA provides the repository interfaces:
- `CrudRepository`
- `PagingAndSortingRepository`
- `JpaRepository`

Repositories are interfaces that hide the logic required for accessing the database. Extending the interface gives us the ability to call methods towards the database.

We will talk more about this when we start building the repository layer.
{{% info title="Spring Data JPA Alternatives" %}}
Spring Data JPA is only one of many different alternatives of data access layers.

To read more about the alternative approach like Spring Data JDBC or Spring Data Neo4J please refer to the [official page.](https://spring.io/projects/spring-data-jdbc)
{{% /info %}}
#### The H2 Database Dependency
The in-memory database is excellent for fast iteration when we don't care what will happen with data when we shut down the application.

{{% image alt="Spring Boot High-level arch " src="images/posts/spring-boot-begginer-guide/SpringApplication-springH2.png" %}}

This dependency offers us the ability to define the H2 database shown in the image above. We can define it as an in-memory or file-based database. 

In the development environment, when we want to keep the data for easier access and testing different use cases, we want to configure the file-based database. The data will remain permanent at the desired location.
We can access the data each time we start the application. It won't get flushed when we shut down the process.

{{% warning title="The H2 database" %}}
We should use the H2 database only in the prototyping phase. For later development and production, we should use something more stable and production-ready (e.g. Oracle, PostgreSQL, MySQL, etc.)
{{% /warning %}}

### Creating the Project with IntelliJ

In the IntelliJ IDE, we can go to the __File -> New -> Project...__. We will get the next screen:
{{% image alt="Spring Boot initialization through IDE" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-IDE.png" %}}

After defining the project on this screen, we can move forward to the next screen:

{{% image alt="Spring Boot initialization through IDE" src="images/posts/spring-boot-begginer-guide/spring-boot-initialize-IDE-2.png" %}}

We will choose the same dependencies as in the previous chapter. 

After choosing the dependencies, we can click the finish button to create the project and start developing.


### Generated Files
The initialization process creates several files and folders. One of those files is the `pom.xml`.

The `pom.xml` defines all dependencies that we are using in our project. Each dependency has its `pom.xml`. The inner `pom.xml` declares what does it bring into the application. 

The dependency is the package that contains the peace of the code that our project needs to run successfully.

Let us look into the `pom.xml` that Spring Boot generated for us:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.6.2</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.reflectoring</groupId>
    <artifactId>begginers-guide</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>begginers-guide</name>
    <description>begginers-guide</description>
    <properties>
        <java.version>11</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
            <version>2.6.3</version>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <version>2.1.210</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```
We can see that most of our dependencies have keyword `starter`. The `starter` keyword means that this dependency is built for Spring Boot and comes with premade configurations that we can use out of the box.
Before the `starter` dependency, the user had to provide all dependencies that now come in one. Also, we had to create our configuration for most things. 
The new approach helps us to start the development process much faster.

It is important to note that the configurations that come with the `starter` dependencies are not invasive. We can create custom configurations only where we need them.
## Building The Database Entities
{{% image alt="Spring Boot High-level arch " src="images/posts/spring-boot-begginer-guide/SpringApplication-entity.png" %}}

The database entity represents the direct link with the database tables. Entity classes represent columns, relationships between different tables, and constraints.

While creating database entities, we have to think about requirements from the beginning of the article:
- The user has to provide their name, last name, email, and password.
- Each book has information about the author, date of publication, number of instances, and users that currently own the book.
- The user can see all books and borrow them.

After sketching which data tables need to contain, we will create those objects in the Java code.

### Sketching the Database Entities

We will build the database diagram for our application:

{{% image alt="Sketching the database entities" src="images/posts/spring-boot-begginer-guide/spring-boot-database-diagram.png" %}}

We have three tables in the database:
- `user`
- `book`
- `borrowed_books`

The `user` table contains the id, name, last name, email, and password. The id is our primary key, and the database will autogenerate it. We will show how to do it in the [next chapter](#creating-the-entity).

The `book` table has the id, title, author, publication, and number of instances in the bookstore.

The `borrowed_books` table represents the `many-to-many` relationship. The `many-to-many` relationship means that one user can borrow several books and that one book can be borrowed several times.

We can read more about relationships between entities in the [Handling Associations Between Entities with Spring Data REST](https://reflectoring.io/relations-with-spring-data-rest/) article.
### Creating the Entity
After we define the database, we can start implementing entity classes.
The entity class is the direct connection to the table in the database:
```java
@Entity(name = "book")
public class Book {

    //The rest of the class omitted

}
```
The `@Entity` annotation indicates that the annotated class is a JPA entity. The `name` attribute inside the annotation indicates the table name. 
Defining the name attribute is not mandatory, but if we do not set the `name` attribute, Spring will assume that the table name is the same as the class name.

### Defining a Primary Key
```java
@Entity(name = "book")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;
    //The rest of the class omitted

}
```
When defining a class as an entity, we need to provide the id column. The id column will be the primary key of that table.

We need to decide how will the id column be generated. Using the `@GeneratedValue` annotation we can define several different strategies:
- [IDENTITY](#identity-generation-strategy)
- [SEQUENCE](#sequence-generation-strategy)
- [TABLE](#table-generation-strategy)
- [AUTO](#defining-the-primary-keys)

We used the `AUTO` strategy, which leverages whatever the database prefers. Most databases prefer to use the `SEQUENCE` strategy for their primary key definition.

#### Identity Generation Strategy
The `GenerationType.IDENTITY` strategy allows the database to autoincrement the id value when we insert a new row.
Let us look into the example of using the identity generation strategy:
```java
@Entity(name = "book")
public class Book {

    @Id
    @GeneratedValue( strategy = GenerationType.IDENTITY)
    private long id;
    
    // Rest of the code omitted
}
```
We define the identity generation type in the strategy attribute of the `@GeneratedValue`. While the identity strategy is highly efficient for the database, it doesn't perform well with the Hibernate ORM.
Hibernate expects that every managed entity has its id set, so it needs to go and call the database to insert the id.

The identity strategy is excellent for fast iteration and the early stages. When we move to the development environment, we should move to something more stable and with better performance.

#### Sequence Generation Strategy
The `GenerationType.SEQUENCE` strategy benefits from using the sequences inside the databases:

```java
@Entity(name = "book")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, 
            generator = "book_generator")
    @SequenceGenerator(name = "book_generator",
            sequenceName = "book_seq",
            initialValue = 10)
    private long id;
}
```
To define the sequence generator, we annotate the field with the `@SequenceGenerator` annotation. We declare the name for Hibernate, the sequence name, and the initial value.
After defining the generator, we need to connect it to the `@GeneratedValue` annotation by setting its name in the `generator` attribute. 

The sequence strategy uses the sequences from the databases to determine which primary key to chose next.

#### Table Generation Strategy
Similar to the sequence generator, the table strategy uses the table to keep track of which primary key can be next:
```java
@Entity(name = "book")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.TABLE,
            generator = "book_generator")
    @TableGenerator(name = "book_generator", table = "book_id_table")
    private long id;
}
```
We need to define the `@TableGenerator` annotation with the name and table attributes.
We provide the generator name to the `generator` attribute inside the `@GeneratedValue` annotation.

The table generator uses

### Defining the Column
We define each table column with the `@Column` annotation and the name of the column inside the `name` attribute:
```java
@Entity(name = "book")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;

    @Column(name = "title")
    private String title;

    @Column(name = "author")
    private String author;

    @Column(name = "publication")
    private Date publication;

    @Column(name = "numberOfInstances")
    private int numberOfInstances;

    //The rest of the class omitted

}
```
If we do not provide the `name` attribute, the Hibernate will assume that the column name is the same as the variable name inside the Java class.

It is always better to be safe and set the `name` attribute so that things do not start crashing when someone accidentally changes the variable name.

### Defining the ManyToMany Relationship

We define the many-to-many relationship with the `@ManyToMany` annotation

Each relationship has two sides:
- the owner - the table that has the foreign key
- the target - the table to which one the owner is refering to with foreign key

#### The Owner of the Relationship
One side of that relationship needs to be the owning side and define the join table.
We decided that it will be the User side:
```java
@Entity(name = "_user")
public class User {
    // Rest of the code omitted

    @ManyToMany
    @JoinTable(
            name = "borrowed_books",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "book_id")
    )
    private List<Book> borrowedBooks;

    // Rest of the code omitted
}
```
After setting the `@ManyToMany` annotation, we need to define the table that will connect the `user` and `book` tables.
In the `@JoinTable` annotation, we declare the name, foreign key, and inverse foreign key.

We define the foreign and the inverse foreign key with the `@JoinColumn` annotation.

#### The Target Side

```java
@Entity(name = "book")
public class Book {
    // Rest of the code omitted

    @ManyToMany(mappedBy = "borrowedBooks")
    private List<User> users;

    // Rest of the code omitted
}
```
We defined the target side with the `@ManyToMany` annotation `mappedBy` attribute. We set the `mappedBy` attribute to the name on the owning side.

### Configuring the Database
We said that the entity class represents the direct link to the table in the database.
We set the configuration in Spring Boot through the `application.properties` file.

Even though the Spring Boot framework comes with the configurations for most things, we need to tap in and change them.
The excellent thing about provided configurations is that they are non-invasive, and we can change only those things that we need.

In this example, we will show how to configure the database. The H2 database can be an in-memory or persistent file-based database, and we will show how to set them up.

#### Defining the Database URL
Let us look how we define the URL for the in-memory database.
```text
spring.datasource.url=jdbc:h2:mem:localdb
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.datasource.driver-class-name=org.h2.Driver
# Rest of the configuration is omitted
```
After defining the keywords `jdbc` and the `h2`to note that we are using the H2 database, we are defining that we are using the in-memory database with the `mem` keyword.
The `localdb` is the database name and can be whatever we want.

The in-memory database is good for fast iterations and prototyping, but we need something more persistent when we go into full development.
Let us see how to define the file-based H2 database:

```text
spring.datasource.url=jdbc:h2:file:/Users/mateostjepanovic/Documents/git/code-examples/spring-boot/begginers-guide/src/main/resources/data/demo;AUTO_SERVER=true
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.datasource.driver-class-name=org.h2.Driver
# Rest of the configuration is omitted
```
After defining the `jdbc` and the `h2` keywords, we note that we want to use a file-based H2 database with the `file` keyword. The last part of the URL is the absolute path to the folder where we want to save our database.

{{% info title="The H2 database" %}}
Please note that we should use the H2 only for the development phase. When going to the production environment, move to something more production-ready ( Oracle, PostgreSQL, etc.).
{{% /info %}}

#### Defining the Database Login Information
After we defined the URL for the database we need the login informations for that database:

```text
spring.datasource.username=username
spring.datasource.password=password
spring.h2.console.enabled=true

# Rest of the configuration is omitted
```
We define the username and password for the database.

Please define that the password and username should be externalized and encrypted in the production environment.

More about externalizing configurations can be found in the [Build Once, Run Anywhere: Externalize Your Configuration](https://reflectoring.io/externalize-configuration/) article.

#### Defining Schema Creation
We can set the configuration to autocreate the schema for us:
```text
spring.jpa.hibernate.ddl-auto=create
spring.jpa.generate-ddl=true

# Rest of the configuration is omitted
```
The Hibernate DDL is used to generate the schema using the entity definitions. With the `ddl-auto`, we set that we want to destroy and recreate the schema on each run.

## Building the Data Access Layer

{{% image alt="Spring Boot High-level arch " src="images/posts/spring-boot-begginer-guide/SpringApplication-dataAccessLayer.png" %}}

After creating entities, we can develop the data access layer. The data access layer allows us to use methods to manipulate the data in the database. We will build the data access layer using the repository pattern.

The repository pattern is the design pattern that leverages the usage of interfaces for connection to the database. The repository interface hides all implementation details of connecting to the database, maintaining the connection, transactions, etc.

We will show how to create the repository for the entity and explain how we use it.

### Creating the Book Repository
```java
public interface BookRepository extends JpaRepository<Book, Long> {
   // Rest of the code is omitted 
}
```
Extending `JpaRepository` turns our interface into the repository bean for the application context to control. 
The primary job of the application context is to manage beans lifecycle.

When a class is a Spring Bean we are sure that we will get the instance the class where ever it is asked using the `@Autowired` annotation.

Even though we can create our connections to the database, we will leverage Spring JPA repositories. Our repository can extend several different interfaces:
- `CrudRepository`
- `PagingAndSortingRepository`
- `JpaRepository`

The `CrudRepository` contains CRUD (Create, Read, Update, Delete) methods. It is the most basic one, and we should use it when we do not need anything besides those four methods.

The `PagingAndSortingRepository` extends the `CrudRepository` and contains every method from a later one. Besides CRUD methods, we can fetch results in pages from the database and sort them with simple interface methods.

The `JpaRepository` extends the `PagingAndSortingRepository`. Except for methods from the `PagingAndSortingRepository` and the `CrudRepository`, we can flush and delete in batch.

Besides queries from the repository interface, we can create custom queries. We can do it in several ways:
- [Creating native SQL query](#native-sql-queries)
- [Creating JPQL query](#jpql-queries)
- [Creating named method query](#named-method-queries)
### Native SQL Queries

```java
public interface BookRepository extends JpaRepository<Book, Long> {

    @Query(nativeQuery = true, value = "SELECT * FROM Book " +
            "book WHERE book.currentlyAvailableNumber > 5 ")
    List<Book> findWithMoreInstancesThenFive();
    
    // Rest of the code is omitted
}
```
We create the query by annotating the method with the `@Query` annotation. If we set the `nativeQuery` attribute to `true`, we can leverage the syntax from the underlying database.
{{% info title="Using native query" %}}
Please note that we should use native queries only in specific use cases like Postgis syntax for the PostgreSQL database. 

Using the native SQL, we are bound to a chosen database. The convention is that our code should not depend on any third-party technology.
{{% /info %}}

### JPQL Queries
The solution to the dependence on the database whose syntax we use is the JPQL syntax. 
Let us see how can we create the JPQL query:
```java
public interface BookRepository extends JpaRepository<Book, Long> {

    @Query( value = "SELECT b FROM book b where b.numberOfInstances > 5")
    List<Book> findWithMoreInstancesThenFiveJPQL();

    // Rest of the code is omitted
}
```
We define the query with the `@Query` annotation, and the `nativeQuery` is, by default, set to false.

The JPQL syntax allows us to change the underlying database while the query stays the same.

### Named Method Queries
Spring framework provides one more feature regarding queries. We can build queries by setting the method name in a specific format:
```java
public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findAllByNumberOfInstancesGreaterThan(long limit);

    // Rest of the code is omitted
}
```
Using the attribute names and special keywords, we can create queries. Spring JPA will generate the proper queries according to our definition.

More about the method names query we can find in the [official documentation](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#jpa.query-methods.named-queries)

## Building the Business Layer

The business layer is the core part of the application. 

{{% image alt="Spring Boot High-level arch " src="images/posts/spring-boot-begginer-guide/SpringApplication-businessLayer.png" %}}

The business layer is where we should write the business logic. It should contain the code for the requirement that one user can borrow a maximum of three books. Each service class contains the business logic for part of the application. 

We split our business layer in two ways. The first one is that each entity has its service class (e.g., `BookService`, `UserService` ). After we split the layer by entities, we split them by use case.
The end product of splitting is that we have the `GetBookService.java` class. By reading the name of the class, we can conclude that the code for fetching the books will be inside this class.

### Defining the Service Class
We will show what does it mean to implement business logic in this layer. 
One of the requirements is that the user can borrow three books maximum at one point in time. This check should be done in the business layer.

Let us look at how in the implementation class:
```java
@Service
public class UpdateBookService {
    private final GetUserService getUserService;
    private final BookRepository bookRepository;

    public UpdateBookService(
            GetUserService getUserService,
            BookRepository bookRepository) {
        this.getUserService = getUserService;
        this.bookRepository = bookRepository;
    }

    public void borrow(long bookId, long userId){
        User user = getUserService.getById(userId);
        if(user.getBorrowedBooks().stream()
                .anyMatch(book -> book.getId()== bookId)){
            throw new IllegalStateException("User already borrowed " +
                    "the book");
        }
        if(user.getBorrowedBooks().size() >= 3){
            throw new IllegalStateException("User already has " +
                    "maximum number of books borrowed!");
        }
        Book book =
                bookRepository.findById(bookId)
                            .orElseThrow(() -> new EntityNotFoundException());

        if(book.getNumberOfInstances()-1 < 0){
            throw new IllegalStateException("There are no available" +
                    " books!");
        }
        book.getUsers().add(user);
        book.numberOfInstances(book.getNumberOfInstances()+1);
        bookRepository.save(book);
    }
    // Rest of the code is omitted
}
```
The `@Service` annotation transforms our class into a Spring Bean controlled by the `ApplicationContext`.
The primary task of ApplicationContext is to control the lifecycles of each Spring Bean and provide them when they are needed.

After fetching the user that wants to borrow the book, we check if the user borrowed the book already.
If that check passes, we can check our requirement of a maximum of three books at one point in time.
Before allowing the user to borrow the book, we need to make sure that there is an instance of the book available.

### Injecting the Repository Class
The dependency injection is the pattern where objects does not construct objects it need but let the controller do it. The ApplicationContext is Springs implementation of the controller that makes sure that every dependency is properly injected.

We use the dependency injection to obtain required classes into the `GetBookService.class`. For now, we only need the `BookRepository.class`

We can inject the `GetBookRepository.class` using three methods:
- [field-based injection](#field-based-injection)
- [setter-based injection](#setter-based-injection)
- [constructor-based injection](#constructor-based-injection)

More about types of dependency injection we can look at [the article](https://reflectoring.io/constructor-injection/).
#### Field-based Injection
Let us look at how to use the field-based injection:
```java
@Service
public class GetBookService {
    @Autowired
    private final BookRepository bookRepository;

    // Rest of the code is omitted
}
```

Spring recognizes the `@Autowired` annotation and makes sure that the `BookRepository` is provided.
#### Setter-based Injection
```java
@Service
public class GetBookService {

    private BookRepository bookRepository;

    @Autowired
    private void setBookRepository(BookRepository bookRepository){
        this.bookRepository = bookRepository;
    }

    // Rest of the code is omitted
}
```

We can put the `@Autowired` annotation on the setter method. The setter-based injection does not allow us to mark the variable as final.
#### Constructor-based Injection
```java
@Service
public class GetBookService {

    private final BookRepository bookRepository;

    @Autowired
    public GetBookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    // Rest of the code is omitted
}
```
For the constructor-based annotation, we should set the `@Autowired` annotation on the constructor. 

We are sure that the IoC container will provide all constructor arguments.

More about dependency injection and why to use the constructor-based injection we can find in the [article.](https://reflectoring.io/constructor-injection/)

## Building Controllers
After creating entities, repositories, and services let us create our first controller that is solving the requirement that the application should be accessable through the browser.

{{% image alt="Spring Boot High-level arch " src="images/posts/spring-boot-begginer-guide/SpringApplication-webLayer.png" %}}

The imported `spring-boot-starter-web` contains everything that we need for the controller. We have Spring MVC autoconfigured and the local server ready to use.

With Spring MVC, we can define a controller with the `@Controller` or `@RestController` annotation so it can handle incoming requests.

### Creating an Endpoint With the @RestController
We are going to create our first endpoint. We want to fetch all books that the bookstore owns. This is the endpoint that will be called from the homepage.

Let us look into the codebase:
```java
@RestController
@RequestMapping("/books")
public class BooksRestController {

    private final GetBookService getBookService;

    @Autowired
    public BooksRestController(GetBookService getBookService) {
        this.getBookService = getBookService;
    }

    @GetMapping
    List<BookResponse> fetchAllBooks(){
        return getBookService.getAllBooks();
    }

    // Rest of the code 
}
```
To make our class the controller bean we need to annotate it with `@RestController` or with `@Controller`.
The difference between these two is that `@RestController` automatically wraps the object into `ResponseEntity<>`. 

We went with `@RestController` because it gives cleaner and more readable code.

The `@RequestMapping("/books")` annotation maps our bean to this path. 
If we start the application locally we can access the endpoint on the `http://localhost:8080/books`. 

We annotated the `fetchAllBooks()` method with the `@GetMapping` annotation to define that this is the `GET` method. 
Since we didn't define additional path on the `@GetMapping` annotation we are using the path from the `@RequestMapping` definitions.

### Creating an Endpoint With the `@Controller` Annotation

Instead with the `@RestController` we can define the controller bean with the `@Controller` annotation:
```java
@Controller
@RequestMapping("/controllerBooks")
public class BooksController {

    private final GetBookService getBookService;

    @Autowired
    public BooksController(GetBookService getBookService) {
        this.getBookService = getBookService;
    }

    @GetMapping
    ResponseEntity<List<BookResponse>> fetchAllBooks(){
        return ResponseEntity.ok(getBookService.getAllBooks());
    }
    // Rest of the code omitted

}
```
When using the `@Controller` annotation we need to make sure that we wrap the result in the `ResponseEntity<>` class.

This approach gives us more freedom when returning objects than the `@RestController`. 
Let us imagine we are rewriting some legacy backend code to the Spring Boot project. 
One of requirements was that the current frontend applications work as they should. 
Previous code always returned the 200 code but the body would differ if some error occured. 
In those kind of scenarios we can use the `@Controller` annotation and control what is returned to the user.

### Creating a POST Endpoint
The `POST` method is used when we want to create a new resource in the database. 

With this `POST` method we will cover the requirement "The admin user can add new book into the bookstore". 

Now, let us take a look how we can create new data:
```java
@RestController
@RequestMapping("/admin/books")
public class AdminBooksRestController {
    
    private final CreateBookService createBookService;

    @Autowired
    public AdminBooksRestController(CreateBookService createBookService) {
        this.createBookService = createBookService;
    }

    @PostMapping
    BookResponse create(@RequestBody BookRequest request){
        return createBookService.createBook(request);
    }

    // Rest of the code omitted

}
```
The `@PostMapping` defines that this is the `POST` method and that we want to create a new resource through it.

The `@RequestBody` annotation defines that we are expecting the data inside the HTTP requests body. That date should be serializable to the `BookRequest` instance.

### Creating a PUT Endpoint
The `PUT` method is used when we want to update the resource that is already in the database. With this endpoint we are allowing the admin user to update infromation about a book:
```java
@RestController
@RequestMapping("/admin/books")
public class AdminBooksRestController {
    
    private final CreateBookService createBookService;

    private final UpdateBookService updateBookService;

    private final DeleteBookService deleteBookService;

    @Autowired
    public AdminBooksRestController(CreateBookService createBookService,
                                    UpdateBookService updateBookService,
                                    DeleteBookService deleteBookService) {
        this.createBookService = createBookService;
        this.updateBookService = updateBookService;
        this.deleteBookService = deleteBookService;
    }


    @PutMapping("/{id}")
    BookResponse update(@PathVariable("id") long id,
                        @RequestBody BookRequest request){
        return updateBookService.updateBook(id,request);
    }

    // Rest of the code omitted
}
```
In the `@PutMapping` annotation we define the path that continues on the one defined with the `@RequestMapping` at the top of the class.
The path looks like this:
`http://localhost:8080/admin/books/{id}`.

The `id` variable is called the path variable and we can pass it into the method using the `@PathVariable("id")` annotation on the method argument. 
We need to be careful that the value inside the `@PathVariable` matches the value inside the `@PutMapping`.

The body of the method is defined with the `@RequestBody` annotation and we pass it as the json object inside the HTTP request.

### Creating a DELETE Endpoint
With the `DELETE` endpoint we are meeting the requirement that admin user can delete a book from the bookstore:
```java
@RestController
@RequestMapping("/admin/books")
public class AdminBooksRestController {
    

    private final CreateBookService createBookService;

    private final UpdateBookService updateBookService;

    private final DeleteBookService deleteBookService;

    @Autowired
    public AdminBooksRestController(CreateBookService createBookService,
                               UpdateBookService updateBookService,
                               DeleteBookService deleteBookService) {
        this.createBookService = createBookService;
        this.updateBookService = updateBookService;
        this.deleteBookService = deleteBookService;
    }

    @DeleteMapping("/{id}")
    void delete(@PathVariable("id") long id){
        deleteBookService.delete(id);
    }

    // Rest of the code omitted

}
```
With the `@DeleteMapping("/{id}")` we define which resource we want to delete. 
We can see that the path is the same as in the [PUT endpoint](#creating-a-put-endpoint) but the HTTP method is different. 
The paths have to be unique for the same HTTP method. 

### Calling an Endpoint
After we build our endpoints we want to test them and see what do we get as the result. Since we don't have any frontend we can use command line tools or the [Postman](#https://www.postman.com/). 
If we are using the command line tools like cURL we can call the endpoint as follows:

```curl --location --request GET 'http://localhost:8080/books'```

The result the we got was:
```json
[
    {
        "title": "The Sandman Vol. 1: Preludes & Nocturnes",
        "author": "Neil Gaiman",
        "publishedOn": "19/10/2010",
        "currentlyAvailableNumber": 4
    },
    {
        "title": "The Lord Of The Rings Illustrated Edition",
        "author": "J.R.R. Tolkien",
        "publishedOn": "16/11/2021",
        "currentlyAvailableNumber": 1
    }
]
```
## Conclusion
After deciding which dependencies we needed and generating the project, we showed how to create a functional application.

We showed how to build the basic Spring Boot application. We went through several concepts:
- [creating the entity](#building-the-database-entities)
- [creating the repository](#building-the-data-access-layer)
- [creating the service](#building-the-business-layer)
- [creating the controller](#building-controllers)

