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
## Introduction
- Spring Boot vs. Spring

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/beginners-guide" %}}

## Our First Project

Let us imagine that we got a job at the local bookstore. We need to build them an application that will allow them to keep track of borrowed books. The application is simple, and we started to design it.

We need two types of entities:
- User
- Book

### The User Entity
The user can register to the application, see all books and borrow them. 

Each user will have to provide the name, last name, email, and password for the application.

The bookstore wants to constraint each user to borrow only three books at one time. 

### The Book Entity

The book contains information about the author, date of publication, and a number of instances of that book currently available in the store.

Each book needs to have a list of users that currently own the book.

### Technologies Used

We need to decide which technologies we are going to use. 

Since we are building a relatively small application for the local bookstore, we are safe to create the Spring MVC application.
The Spring MVC framework is designed around the idea of sending incoming requests to the controller. The controller handles the request and sends it further down the application pipeline. The Spring MVC framework allows us to build RESTful applications.

We also need a way to store our data. For the sake of the example, we will use the H2 database. The H2 database is an in-memory or file-based database that we can run on our local machine with minimal configuration. The H2 database allows us to have our application up and running in no time. When moving to the production environment, we should change to something more stable and persistent - Oracle, PostgreSQL, etc.

We went over technologies that we will use, and now, we will see how to set up everything we need to develop our application.

## Setting up the Project
We will show two ways how to generate a new Spring Boot project:
- [using the IntelliJ IDE](#generation-through-ide)
- [using the Spring Initializr](#generation-through-spring-initializr)

Any of the ways to generate the project is correct. There are differences, except in the UI of the generator.

### Generation Through IDE

In the IntelliJ IDE, we can go to the __File -> New -> Project...__. We will get the next screen:
{{% image alt="Spring Boot initialization through IDE" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-IDE.png" %}}

After defining the project on this screen, we can move forward to the next screen:

{{% image alt="Spring Boot initialization through IDE" src="images/posts/spring-boot-begginer-guide/spring-boot-initialize-IDE-2.png" %}}

We will select several dependencies:
- [Spring Web](#the-spring-web-dependency)
- [Spring Data JPA](#the-spring-data-jpa-dependency)
- [H2 Database](#the-h2-database-dependency) 

#### The Spring Web Dependency
The Spring web dependency provides the embedded Tomcat container to run our application. 

If we run the application, we will see that the process starts, and we can access the application on `http://localhost:8080`.
We won't see much, but the application will be up and running.

#### The Spring Data JPA Dependency
The Spring data JPA dependency allows us to create the data access layer almost without effort. 
Building the data access layer can be cumbersome, and Spring data JPA data gives us everything that we need to start creating our first entity.
With the Spring data JPA, we can use the Hibernate as our Object Relational Mapping framework. 
We will present the entities, constraints, and relations using annotations. This way leaves us with readable and functional code.

After importing the spring data JPA dependency, we can create the repository interfaces and leverage everything Spring offers. We can use JPQL language, method names, or plain old SQL to build our queries towards the database. 
We will talk more about this when we start building the repository layer.

#### The H2 Database Dependency

This dependency offers us the ability to define the H2 database. We can define it as an in-memory or file-based database. 

The in-memory database is excellent for fast iteration when we don't care what will happen with data when we shut down the application.

In the development environment, when we want to keep the data for easier access and testing different use cases, we want to configure the file-based database. The data will remain permanent at the desired location.
We can access the data each time we start the application. It won't get flushed when we shut down the process.

### Generation Through Spring Initializr

On the [Spring Initilizr page](https://start.spring.io/), we can generate the Spring Boot project:

{{% image alt="Spring Boot initialization online" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-online.png" %}}

Even though the page looks different, we need to provide the same information as in the [previous chapter](#generation-through-ide). 

After defining all necessary information, we can go and add our dependencies. By clicking on the button on the top right corner, we can see the next screen:

{{% image alt="Spring Boot initialization online" src="images/posts/spring-boot-begginer-guide/spring-boot-initializr-online-2.png" %}}

After selecting desired dependencies, we can generate our project by clicking the "Generate" button on the lower-left corner of the screen. 

We will download the zip file onto our machine, and we need to unpack the provided zip file and import it into the IDE.

### Generated Files
The initialization process creates several files and folders:

{{% image alt="Spring Boot initialization online" src="images/posts/spring-boot-begginer-guide/spring-boot-generated-files.png" %}}

Let us look into the pom.xml that Spring Boot generated for us:

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
The dependency is the package that contains the peace of the code that our project needs to run successfully.

The pom.xml defines all dependencies that we are using in our project. Each dependency has its pom.xml. The inner pom.xml declares what does it bring into the application. 

We can see that most of our dependencies have keyword `starter`. The `starter` keyword means that this dependency is built for the Spring Boot framework and comes with premade configurations that we can use out of the box.
Before the `starter` dependency, the user had to provide all dependencies that now come in one. Also, we had to create our own configuration for most things. 
The new approach helps us to start the development process much faster.

It is important to note that the configurations that come with the `starter` dependencies are not invasive. We can create custom configurations only where we need them.
## Building The Domain Objects
We will start with building domain objects.

We will show how to:
- [start with sketching the database](#sketching-the-domain-objects)
- [create the Book Entity](#creating-the-book-entity)
- [create the User Entity](#creating-the-user-entity)
- [configure Hibernate for table generation](#configuring-hibernate) 

The domain object represents the direct link with the database tables. After sketching which data tables need to contain, we will create those objects in the Java code.

### Sketching the Domain Objects
We will build the database diagram for our application:

{{% image alt="Sketching the Domain Objects" src="images/posts/spring-boot-begginer-guide/spring-boot-database-diagram.png" %}}

We have three tables in the database:
- user
- book
- borrowed_books

The user table contains the id, name, last name, email, and password. The id is our primary key, and the database will autogenerate it. We will show how to do it in the [next chapter](#creating-the-entity).

The book table has the id, title, author, publication, and number of instances in the bookstore.

The borrowed_books table represents the `many-to-many` relationship. The `many-to-many` relationship means that one user can borrow several books and that one book can be borrowed several times.

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
We annotate the class with the `@Entity` annotation indicating that it is JPA an entity.. The name attribute inside the annotation indicates how is the table called. 
Defining the name attribute is not mandatory, but if we do not set the name attribute, the Spring will assume that the table name is the same as the class name.

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
When defining a class as an entity we need to provide the __id__ column. When defining a class as an entity, we need to provide the id column. The id column will be the primary key of that table.

We need to decide how will the id column be generated. Using the `@GeneratedValue` annotation we can define several different strategies:
- (IDENTITY)[#identity-generation-strategy]
- (SEQUENCE)[#sequence-generation-strategy]
- (TABLE)[#table-generation-strategy]
- (AUTO)[#defining-the-primary-keys]

We used the `AUTO` strategy, which leverages whatever the database prefers. Most databases prefer to use the `SEQUENCE` strategy for their primary key definition.

#### Identity Generation Strategy
The `IDENTITY` strategy allows the database to autoincrement the id value when we insert a new row.
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
We define the identity generation type in the strategy attribute of the `@GeneratedValude`. While the IDENTITY strategy is highly efficient for the database, it doesn't perform well with the Hibernate ORM.
The Hibernate expects that every managed entity has its id set, so it needs to go and call the database to insert the id.

The identity strategy is excellent for fast iteration and the early stages. When we move to the development environment, we should move to something more stable and with better performance.

#### Sequence Generation Strategy
The `SEQUENCE` strategy benefits from using the sequences inside the databases:

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
To define the sequence generator, we annotate the field with the `@SequenceGenerator`. We declare the name for the Hibernate, the sequence name, and the initial value.
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
We provide the generator name to the `generator` attribute inside the `@GeneratedValude` annotation.

The table generator uses

### Defining the Column
We define the table column with the `@Column` annotation and the name of the column inside the `name` attribute:
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
If we do not provide the name attribute, the Hibernate will assume that the column name is the same as the variable name inside the Java class.

It is always better to be safe and set the name attribute so that things do not start crashing when someone accidentally changes the variable name.

### Defining the ManyToMany Relationship

We define the many-to-many relationship with the `@ManyToMany` annotation

Each relationship has two sides:
- the owner 
- the target

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
After setting the `@ManyToMany` annotation, we need to define the table that will connect the user and book tables.
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
We set the configuration in the Spring Boot framework through the `application.properties` file.

Even though the Spring Boot framework comes with the autoconfiguration for most things, we need to tap into those configurations and change them.
The excellent thing about autoconfiguration is that it is non-invasive, and we can change only those things that we need.

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

Please note that we should use the H2 only for the development phase. When going to the production environment, move to something more production-ready ( Oracle, PostgreSQL, etc.).

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

#### Defining Schema Creation
We can set the configuration to autocreate the schema for us:
```text
spring.jpa.hibernate.ddl-auto=create
spring.jpa.generate-ddl=true

# Rest of the configuration is omitted
```
The Hibernate DDL is used to generate the schema using the entity definitions. With the `ddl-auto`, we set that we want to destroy and recreate the schema on each run.

## Building the Data Access Layer
After creating entities, we can develop the data access layer. The data access layer allows us to use methods to manipulate the data in the database. We will build the data access layer using the repository pattern.

The repository pattern is the design pattern that leverages the usage of interfaces for connection to the database. The repository interface hides all implementation details of connecting to the database, maintaining the connection, transactions, etc.

We will show how to create the repository for the entity and explain how we use it.

### Creating the Book Repository
```java
@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
   // Rest of the code is omitted 
}
```
The `@Repository` annotation creates the repository bean for the application context to control. 
With this annotation, we are sure that the dependency injection will provide the instance of this interface where ever it is asked using the `@Autowired` annotation.

Even though we can create our connections to the database, we will leverage the Spring JPA classes. Our repository can extend several different interfaces:
- CrudRepository
- PagingAndSortingRepository
- JpaRepository

The CrudRepository contains CRUD (Create, Read, Update, Delete) methods. It is the most basic one, and we should use it when we do not need anything besides those four methods.

The PagingAndSortingRepository extends the CrudRepository and contains every method from a later one. Besides CRUD methods, we can fetch results in pages from the database and sort them with simple interface methods.

The JpaRepository extends the PagingAndSortingRepository. Except for methods from the PagingAndSortingRepository and the CrudRepository, we can flush and delete in batch.

Besides queries from the repository interface, we can create custom queries. We can do it in several ways:
- [native SQL query](#native-sql-queries)
- [JPQL query](#jpql-queries)
- [named method query](#named-method-queries)
### Native SQL Queries

```java
@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    @Query(nativeQuery = true, value = "SELECT * FROM Book " +
            "book WHERE book.currentlyAvailableNumber > 5 ")
    List<Book> findWithMoreInstancesThenFive();
    
    // Rest of the code is omitted
}
```
We create the query by annotating the method with the `@Query` annotation. If we set the `nativeQuery` attribute to `true`, we can leverage the syntax from the underlying database.

Please note that we should use native queries only in specific use cases like Postgis syntax for the PostgreSQL database. Using the native SQL, we are bound to a chosen database. The convention is that our code should not depend on any third-party technology.

### JPQL Queries
The solution to the dependence on the database whose syntax we use is the JPQL syntax. 
Let us see how can we create the JPQL query:
```java
@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    @Query( value = "SELECT b FROM book b where b.numberOfInstances > 5")
    List<Book> findWithMoreInstancesThenFiveJPQL();

    // Rest of the code is omitted
}
```
We define the query with the `@Query` annotation, and the `nativeQuery` is, by default, set to false.

The JPQL syntax allows us to change the underlying database while the query stays the same.

### Named Method Queries
The Spring framework provides one more feature regarding queries. We can build queries by setting the method name in a specific format:
```java
@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findAllByNumberOfInstancesGreaterThan(long limit);

    // Rest of the code is omitted
}
```
Using the attribute names and special keywords, we can create queries. The Spring JPA will generate the proper queries according to our definition.

More about the method names query we can find in the [official documentation](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#jpa.query-methods.named-queries)
## Building Controllers
After discussing about generation process let us create our first controller in the application.

The imported `spring-boot-starter-web` contains everything that we need for the controller. We have the Spring MVC autoconfigured and the embedded Tomcat server ready to use.

The Spring MVC is a Spring framework which is used to create Model View Controller web applications. With the Spring MVC we can define a controller with the `@Controller` or `@RestController` annotation so it can handle incoming requests.

### Creating a Endpoint With the @RestController
We are going to create our first endpoint. We want to fetch all books that the bookstore owns.
Let us look into the codebase:
```java
@RestController
@RequestMapping("/books")
public class BooksRestController {
    BookResponse sandman = BookResponse.builder()
            .title("The Sandman Vol. 1: Preludes & Nocturnes")
            .author("Neil Gaiman")
            .publishedOn("19/10/2010")
            .currentlyAvailableNumber(4)
            .build();
    BookResponse lotr = BookResponse.builder()
            .title("The Lord Of The Rings Illustrated Edition")
            .author("J.R.R. Tolkien")
            .publishedOn("16/11/2021")
            .currentlyAvailableNumber(1)
            .build();
    List<BookResponse> books = new ArrayList(List.of(sandman, lotr));

    @GetMapping
    List<BookResponse> fetchAllBooks(){
        return books;
    }
}
```
To make our class the controller bean we need to annotate it with the `@RestController` or with the `@Controller`. The difference between these two is that the `@RestController` automatically wraps return object into the `ResponseEntity<>`. 

We went with the `@RestController` because it is easier to follow the code without transformation code.

The `@RequestMapping("/books")` annotation maps our bean to this path. If we start this code locally we can access this enpoint on the `http://localhost:8080/books`. 

We annotated the `fetchAllBooks()` method with the `@GetMapping` annotation to define that this is the GET method. Since we didn't define additional path on the `@GetMapping` annotation we are using the path from the `@RequestMapping` definitions.

### Creating an Endpoint With the @Controller
Instead with the `@RestController` we can define our controller bean with the `@Controller` annotation:
```java
@Controller
@RequestMapping("/controllerBooks")
public class BooksController {
    BookResponse sandman = BookResponse.builder()
            .title("The Sandman Vol. 1: Preludes & Nocturnes")
            .author("Neil Gaiman")
            .publishedOn("19/10/2010")
            .currentlyAvailableNumber(4)
            .build();
    BookResponse lotr = BookResponse.builder()
            .title("The Lord Of The Rings Illustrated Edition")
            .author("J.R.R. Tolkien")
            .publishedOn("16/11/2021")
            .currentlyAvailableNumber(1)
            .build();
    List<BookResponse> books = new ArrayList(List.of(sandman, lotr));

    @GetMapping
    ResponseEntity<List<BookResponse>> fetchAllBooks(){
        return ResponseEntity.ok(books);
    }
}
```
When using the `@Controller` annotation we need to make sure that we wrap our result in the `ResponseEntity<>` class.

This approach gives us more freedom when returning objects. Let us imagine we are rewriting some legacy backend code to the Spring Boot project. One of requirements was that the current frontend applications work as they should. Previous code always returned the 200 code but the body would differ if some error occured. In those kind of scenarios we can use the `@Controller` annotation and control what is returned to the user.

### Calling an Endpoint
After we build our first enpoint we want to test it and see what do we get as the result. Since we don't have any frontend we can use command line tools or the [Postman](#https://www.postman.com/). 
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
### Creating a POST Endpoint
The POST method is used when we want to create a new resource in the database.

Now, let us take a look how we can create new data:
```java
@RestController
@RequestMapping("/books")
public class BooksRestController {
    List<BookResponse> books = new ArrayList(List.of(sandman, lotr));

    @PostMapping
    List<BookResponse> create(@RequestBody BookRequest request){
        BookResponse book = BookResponse.builder()
                .title(request.getTitle())
                .author(request.getAuthor())
                .publishedOn(request.getPublishedOn())
                .currentlyAvailableNumber(request.getCurrentlyAvailableNumber())
                .build();
        books.add(book);
        return books;
    }
}
```
The `@PostMapping` defines that this is the POST method and that we want to create a new resource through it.

The `@RequestBody` annotation defines that we are expecting the data inside the HTTP requests body. That date should be serializable to the `BookRequest` instance.

If we want to call the enpoind through the cURL:

```text
curl --location --request POST 'http://localhost:8080/books'
        --header 'Content-Type: application/json'
        --data-raw '{
                        "author":"Stephen King",
                        "title": "The Institute",
                        "publishedOn": "10/09/2019",
                        "currentlyAvailableNumber": 1
                    }'
```

We see that the request method is the POST method and the data is sent as the application/json.

### Creating a PUT Endpoint
The PUT method is used when we want to update the resource that is already in the database:
```java
@RestController
@RequestMapping("/books")
public class BooksRestController {
    List<BookResponse> books = new ArrayList(List.of(sandman, lotr));

    @PutMapping("/{id}")
    BookResponse update(@PathVariable("id") long id,
                        @RequestBody BookRequest request){
        BookResponse book =
                books.stream().filter(x -> x.getId()==id).findFirst().orElseThrow(() -> new RuntimeException());
        books.remove(book);
        book = BookResponse.builder()
                .id(id)
                .author(request.getAuthor())
                .title(request.getTitle())
                .publishedOn(request.getPublishedOn())
                .currentlyAvailableNumber(request.getCurrentlyAvailableNumber())
                .build();
        books.add(book);
        return book;
    }
}
```
In the `@PutMapping` annotation we define the path that continues on the one defined with the `@RequestMapping` at the top of the class. With this our path looks like this:
`http://localhost:8080/books/{id}`.

The `id` variable is called the path variable and can be passed into method using the `@PathVariable("id")` annotation on the method argument. We need to be careful that the value inside the `@PathVariable` matches the value inside the `@PutMapping`.

The body of the method is defined with the `@RequestBody` annotation and is passed as the json object inside the HTTP request.

Let us look how can we call this endpoint using the cURL commands:
```text
curl --location --request PUT 'http://localhost:8080/books/1' 
                --header 'Content-Type: application/json' 
                --data-raw '    {
                                    "title": "The Sandman Vol. 1",
                                    "author": "Neil Gaiman",
                                    "publishedOn": "19/10/2010",
                                    "currentlyAvailableNumber": 2
                                }'
```
We can see that the `{id}` path variable that we defined in our controller is replaced with the real value. This value will be passed into the `id` argument from our method inside the controller.

### Creating a DELETE Endpoint
The DELETE method is used to delete the resource from the database:
```java
@RestController
@RequestMapping("/books")
public class BooksRestController {
    List<BookResponse> books = new ArrayList(List.of(sandman, lotr));

    @DeleteMapping("/{id}")
    void delete(@PathVariable("id") long id){
        BookResponse book = books.stream().filter(x -> x.getId()==id).findFirst().orElseThrow(() -> new RuntimeException());
        books.remove(book);
    }
}
```
With the `@DeleteMapping("/{id}")` we define which resource we want to delete. We can se that the path is the same as in the [PUT endpoint](#creating-a-put-endpoint) but the HTTP method is different. The paths have to be unique for the same HTTP method. 

Let us look how can we call this endpoint using the cURL command:
```text
curl --location --request DELETE 'http://localhost:8080/books/1'
```
The method that we call is the DELETE method and the `{id}` placeholder was replaced with the real value.