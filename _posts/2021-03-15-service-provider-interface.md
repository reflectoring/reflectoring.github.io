---
title: "Implementing Plugins with Java's Service Provider Interface"
categories: [java]
date: 2021-03-15 00:00:00 +1100
modified: 2021-03-15 00:00:00 +1100
author: bakic
excerpt: "This article explains the Service Provider Interface with an example."
image:
  auto: 0088-jigsaw
---

# Service Provider Interface

In this article, we are going to talk about Java's Service Provider Interface (SPI). We will have a short overview of what the SPI is and describe some cases where we can use it. Then we will give an implementation of an SPI for a practical use case.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/core-java/service-provider-interface" %}

## Overview
**The Service Provider Interface was introduced to make applications more extensible**. 

It gives us a way to enhance specific parts of a product without modifying the core application. All we need to do is provide a new implementation of the service that follows certain rules and plug it into the application. Using the SPI mechanism, the application will load the new implementation and work with it.

## Terms and Definitions

To work with extensible applications, we need to understand the following terms:

- **Service**: A set of interfaces or classes (usually abstract classes) that provide access to some specific application functionality. It defines the contract but doesn't provide the implementation. The Service Provider provides the implementation.
-  **Service Provider**: A specific implementation of a service. It is identified by placing the provider configuration file in the resources directory  `META-INF/services`. It must be available in the application's classpath.
- **Service Provider Interface**: A set of interfaces or abstract classes that a service defines. It represents the classes and methods available to your application.
- **ServiceLoader**: The main class used to discover and load a service implementation lazily. The `ServiceLoader` maintains a cache of services already loaded. Each time we invoke the service loader to load services, it first lists the cache's elements in instantiation order, then discovers and instantiates the remaining providers.

## Discovering Service Implementations with `ServiceLoader`
The `ServiceLoader` provides some methods to discover with the service providers:

- `iterator()`: Lazily loads the available providers of the service loader.
- `reload()`: Clears the cache and load all the providers.

## Service Provider Interface Examples in Java

Java by default includes many different service providers. Here is a list of some of them:

- **`ResourceBundleProvider`**: Used by service providers to load resource bundles for named modules.
- **`CurrencyNameProvider`**: Used by service providers that provide localized currency symbols and display names for the `Currency` class.
- **`Driver`**: Used by service providers to load database drivers.

Let's go further with the `Driver` and try to understand how the database drivers are loaded in our applications. For example, if we examine the PostgreSQL JAR file we will find a folder called `META-INF/services` which contains a file named `java.sql.Driver`. This configuration file contains the name of the implementation class provided by PostgreSQL for the Driver interface, in this case: `org.postgresql.Driver`.

We note the same thing with the MySQL driver: The file with the name `java.sql.Driver` located in `META-INF/services` contains `com.mysql.cj.jdbc.Driver` which is the MySQL implementation of the `Driver` interface.

If the two drivers are loaded in the classpath, the `ServiceLoader` will read the implementation class names from each file, then calls `Class.forName()` with the class names and then `newInstance()` to create an instance of the implementation classes.

## Implementing a Custom Service Provider
Now that we have an understanding of the SPI concepts, let's create an example of an SPI and load providers using the `ServiceLoader` class.

Let's say that we have a librarian who needs an application to check whether a book is available in the library or not when requested by customers.
We can do this by defining a service represented by a class named `LibraryService` and a service provider interface called `Library`.

The `LibraryService` provides a singleton `LibraryService` object. This object retrieves the book from `Library` providers.

The library service client which is in our case the application that we are building gets an instance of this service, and the service will search, instantiate and use `Library` service providers.

The application developers may in the first place use a standard list of books that can be available in all libraries. Other users who deal with computer science books may require a different list of books for their library (another library provider). In this case, it would be better if **the user can add the new library with the desired books to the existing application without modifying its core functionality. **The new library will just be plugged into the application**.

### Overview of Maven Modules
We start by creating a Maven root project that will contain all our sub-modules. We will call it `library-service-provider-example`.
The sub-modules will be:
- **`library-service-provider`**: Contains the Service Provider Interface `Library` and the service class to load the providers.
- **`library-demo`**: An application to put all together and create a working example.
- **`standard-library`**: The provider for a standard library chosen by the developers.
- **`custom-library`**: The provider for a custom library required by users who deal with computer science books.

### The `library-service-provider` Module

First, let's create a model class that represents a book:
```java
public class Book {
  String name;
  String author;
  String description;
}
```
Then, we define the service provider interface for our service:
```java
public interface Library {
  Book getBook(String name);
}
```
Finally, we create the `LibraryService` class that the client will use to get the books from the library:
```java
public class LibraryService {
  private static LibraryService libraryService;
  private final ServiceLoader<Library> loader;

  public static synchronized LibraryService getInstance() {
    if (libraryService == null) {
      libraryService = new LibraryService();
    }
    return libraryService;
  }

  private LibraryService() {
    loader = ServiceLoader.load(Library.class);
  }

  public Book getBook(String name) {
    Book book = null;
    Iterator<Library> libraries = loader.iterator();
    while (book == null && libraries.hasNext()) {
      Library library = libraries.next();
      book = library.getBook(name);
    }
    return book;
  }
}
```

Using the `getInstance()` method, the clients will get a singleton `LibraryService` object to retrieve the books they need.

In the constructor, `LibraryService` invokes the static factory method `load()` to get an instance of `ServiceLoader` that can retrieve `Library` implementations.

In `getBook()`, we then iterate through all available `Library` implementations using the `iterate()` method and call their `getBook()` methods to find the book we are looking for.
  

### The `standard-library` Module
First, we include the dependency to the service API provider in the `pom.xml` file of this submodule:
```xml
<dependency>
  <groupId>org.library</groupId>
  <artifactId>library-service-provider</artifactId>
  <version>1.0-SNAPSHOT</version>
</dependency>
```
Then we create a class that implements the Library SPI:
```java
public class StandardLibrary implements Library {

  private final Map<String, Book> books;

  public StandardLibrary() {
    books = new TreeMap<>();
    Book nineteenEightyFour = new Book("Nineteen Eighty-Four", 
            "George Orwell", "Description");
    Book theLordOfTheRings = new Book("The Lord of the Rings", 
            "J. R. R. Tolkien", "Description");

    books.put("Nineteen Eighty-Four", nineteenEightyFour);  
    books.put("The Lord of the Rings", theLordOfTheRings);  
  }

  @Override
  public Book getBook(String name) {
    return books.get(name);
  }
}
```
This implementation provides access to two books through the `getBook()` method.
Finally, we should create a folder called `META-INF/services` in the resources directory with a file named `org.library.spi.Library`. This file will contain the full class name of the implementation that will be used by the `ServiceLoader` to instantiate it. In our case, it will be `org.library.StandardLibrary`.

### The `custom-library` Module
The `custom-library` submodule has the same structure and requirements as the `standard-library` submodule. However, the implementation of the Library SPI, the file name, and the class name that will be created in the `META-INF/services` folder will change.

### The `library-demo` Module
In this submodule, we will call the `LibraryService` to get information about some books.
In the beginning, we will use only the standard library as a library for our demo, then we will see how we can add more capabilities to our demo project by adding the custom-library jar file to the classpath. The `ServiceLoader` will then load and instantiate our provider.

To start, let's add the standard-library submodule to the library-demo `pom.xml` file:
```xml
<dependency>
  <groupId>org.library</groupId>
  <artifactId>standard-library</artifactId>
  <version>1.0-SNAPSHOT</version>
</dependency>
```
Then, we try to get information about two books:
```java
public class LibraryDemo {
    
  public static void main(String[] args) {
    LibraryService libraryService = LibraryService.getInstance();
    manageBookRequest("Clean Code", libraryService);
    manageBookRequest("The Lord of the Rings", libraryService);
  }

  private static void manageBookRequest(String bookName, LibraryService library) {
    Book book = library.getBook(bookName);
    if (book == null) {
      System.out.println("The library doesn't have the book '" +
              bookName + "' that you need.");
    } else {
      System.out.println("The book '" + bookName +
              "' was found, here are the details:" + book);
    }
  }
}
```
The output for this program will be:
```
The library doesn't have the book 'Clean Code' that you need.
The book 'The Lord of the Rings' was found, here are the details:Book{name='The Lord of the Rings',...}
```

As seen above, the book "The Lord of the Rings" is available in the standard library, but not the "Clean Code" book.
In order to get that book, we can add our `custom-library` which contains the required book. All that we have to do is to add the dependency to the library-demo `pom.xml` file:
```xml
<dependency>
  <groupId>org.library</groupId>
  <artifactId>custom-library</artifactId>
  <version>1.0-SNAPSHOT</version>
</dependency>
```
When we run the demo application we get this output:
```
The book 'Clean Code' was found, here are the details:Book{name='Clean Code...}
The book 'The Lord of the Rings' was found, here are the details: Book{name='The Lord of ...}
```
Finally, we get the requested books. **We only had to plug-in a provider to add extra behavior to our program**.

## Conclusion
In this article, we described the capabilities of the Service Provider Interface and how it works.

We gave examples of some SPI in the java ecosystem like the `Driver` provider used to connect to a database.

We also implemented a library application where we learned how to:

- define a service provider interface,
- implement the providers and the configuration file that should be created in`META-INF/services` folder for the `ServiceLoader`.
- use the `ServiceLoader` to find the different providers and instantiate them.


Find the complete code of the example application on [GitHub](https://github.com/thombergs/code-examples/tree/master/core-java/service-provider-interface).
