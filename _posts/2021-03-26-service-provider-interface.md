---
title: "Implementing Plugins with Java's Service Provider Interface"
categories: [java]
date: 2021-03-26 00:00:00 +1100
modified: 2021-03-26 00:00:00 +1100
author: bakic
excerpt: "This article explains the Service Provider Interface with an example."
image:
  auto: 0088-jigsaw
---

In this article, we are going to talk about Java's Service Provider Interface (SPI). We will have a short overview of what the SPI is and describe some cases where we can use it. Then we will give an implementation of an SPI for a practical use case.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/core-java/service-provider-interface" %}

## Overview
**The Service Provider Interface was introduced to make applications more extensible**. 

It gives us a way to enhance specific parts of a product without modifying the core application. All we need to do is provide a new implementation of the service that follows certain rules and plug it into the application. Using the SPI mechanism, the application will load the new implementation and work with it.

## Terms and Definitions

To work with extensible applications, we need to understand the following terms:

- **Service Provider Interface**: A set of interfaces or abstract classes that a service defines. It represents the classes and methods available to your application.
-  **Service Provider**: Called also `Provider`, is a specific implementation of a service. It is identified by placing the provider configuration file in the resources directory  `META-INF/services`. It must be available in the application's classpath.
- **ServiceLoader**: The main class used to discover and load a service implementation lazily. The `ServiceLoader` maintains a cache of services already loaded. Each time we invoke the service loader to load services, it first lists the cache's elements in instantiation order, then discovers and instantiates the remaining providers.

## How Does `ServiceLoader` Work?
We can describe the SPI as a discovery mechanism since it automatically loads the different providers defined in the classpath.

The `ServiceLoader` is the main tool used to do that by providing some methods to allow this discovery :

- `iterator()`: Creates an iterator to lazily load and instantiate the available providers. At this moment, the providers are not instantiated yet, that's why we called it a lazy load. The instantiation is done when calling the methods `next()` or `hasNext()` of the iterator. The `iterator` maintains a cache of these providers for performance reasons so that they don't get loaded with each call.
  A simple way to get the providers instantiated is through a loop:

  ```java
  Iterator<ServiceInterface> providers = loader.iterator();
  while (providers.hasNext()) {
    ServiceProvider provider = providers.next();
    //actions...
  }
  ```
  
- `stream()`: Creates a stream to lazily load and instantiate the available providers. The stream elements are of type `Provider`. The providers are loaded and instantiated when invoking the `get()` method of the `Provider` class.

  In the following example we can see how to use the `stream()` method to get the providers:

  ```java
  Stream<ServiceInterface> providers = 
  ServiceLoader.load(ServiceInterface.class)
        .stream()
        .map(Provider::get);
  ```

- `reload()`: Clears the loader's provider cache and reloads the providers. This method is used in situations in which new service providers are installed into a running JVM.

Apart from the service providers implemented and the service provider interface created, we need to register these providers so that the `ServiceLoader` can identify and load them. **The configuration files need to be created in the folder `META-INF/services`.**

![META-INF](/assets/img/posts/spi/spi-meta-inf.png)

We should name these files with the fully qualified class name of the service provider interface. Each file will contain the fully qualified class name of one or many providers, one provider per line.

For example, if we have a service provider interface called `InterfaceName`, to register the service provider `ServiceProviderImplementation`, we create a text file named `package.name.InterfaceName`. This file contains one line:

```markdown
package.name.ServiceProviderImplementation
```

We can note that there will be many configuration files with the same name in the classpath. For this reason, the `ServiceLoader` uses `ClassLoader.getResources()` method to get an enumeration of all the configuration files to identify each provider.

## Exploring the `Driver` Service in Java

By default, Java includes many different service providers. One of them is the `Driver` used to load database drivers.

Let's go further with the `Driver` and try to understand how the database drivers are loaded in our applications.

If we examine the PostgreSQL JAR file, we will find a folder called `META-INF/services` containing a file named `java.sql.Driver`. This configuration file holds the name of the implementation class provided by PostgreSQL for the Driver interface, in this case: `org.postgresql.Driver`.

We note the same thing with the MySQL driver: The file with the name `java.sql.Driver` located in `META-INF/services` contains `com.mysql.cj.jdbc.Driver` which is the MySQL implementation of the `Driver` interface.

If the two drivers are loaded in the classpath, the `ServiceLoader` will read the implementation class names from each file, then calls `Class.forName()` with the class names and then `newInstance()` to create an instance of the implementation classes.

Now that we have two implementations loaded, how will the connection to the database work?

In the `getConnection()` method of the `DriverManager` class from the `java.sql` package, we can see how the connection to the database is established when different drivers are available.

Here is the code of the `getConnection()` method:

```java
for (DriverInfo aDriver : registeredDrivers) {
  if (isDriverAllowed(aDriver.driver, callerCL)) {
  try {
    println("trying " + aDriver.driver.getClass().getName());
    Connection con = aDriver.driver.connect(url, info);
    if (con != null) {
    // Success!
    println("getConnection returning " + 
      aDriver.driver.getClass().getName());
    return (con);
    }
  } catch (SQLException ex) {
    if (reason == null) {
    reason = ex;
    }
  }
  } else {
  println("skipping: " + aDriver.getClass().getName());
  }
}
```

As we can see, the algorithm goes through the `registeredDrivers` and tries to connect to the database using the database URL. If the connection to the database is established, the connection object is returned, otherwise, the other drivers are given a try until all the drivers are covered.

## Implementing a Custom Service Provider
Now that we have an understanding of the SPI concepts, let's create an example of an SPI and load providers using the `ServiceLoader` class.

Let's say that we have a librarian who needs an application to check whether a book is available in the library or not when requested by customers.
We can do this by defining a service represented by a class named `LibraryService` and a service provider interface called `Library`.

The `LibraryService` provides a singleton `LibraryService` object. This object retrieves the book from `Library` providers.

The library service client which is in our case the application that we are building gets an instance of this service, and the service will search, instantiate and use `Library` service providers.

The application developers may in the first place use a standard list of books that can be available in all libraries. Other users who deal with computer science books may require a different list of books for their library (another library provider). In this case, it would be better if the user can add the new library with the desired books to the existing application without modifying its core functionality. **The new library will just be plugged into the application**.

### Overview of Maven Modules
We start by creating a Maven root project that will contain all our sub-modules. We will call it `service-provider-interface`.
The sub-modules will be:

- **`library-service-provider`**: Contains the Service Provider Interface `Library` and the service class to load the providers.
- **`classics-library`**: The provider for a library of classic books chosen by the developers.
- **`computer-science-library`**: The provider for a library of computer science books required by users.
- **`library-client`**: An application to put all together and create a working example.

The following diagram shows the dependencies between each module:

![Modules](/assets/img/posts/spi/spi-modules.png)

Both, the `classics-library` and the `computer-science-library` implement the `library-service-provider`. The `library-client` module then uses the `library-service-provider` module to find books. The `library-client` doesn't have a compile-time dependency to the library implementations!

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
package org.library.spi;

public interface Library {
  String getCategory();
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

  public Optional<Book> getBook(String name) {
    Book book = null;
    Iterator<Library> libraries = loader.iterator();
    while (book == null && libraries.hasNext()) {
      Library library = libraries.next();
      book = library.getBook(name);
    }
    return Optional.ofNullable(book);
  }
  
  public Optional<Book> getBook(String name, String category) {
    return loader.stream()
        .map(ServiceLoader.Provider::get)
        .filter(library -> 
                library.getCategory().equals(category))
        .map(library -> library.getBook(name))
        .filter(Objects::nonNull)
        .findFirst();
  }
}
```

Using the `getInstance()` method, the clients will get a singleton `LibraryService` object to retrieve the books they need.

In the constructor, `LibraryService` invokes the static factory method `load()` to get an instance of `ServiceLoader` that can retrieve `Library` implementations.

In `getBook(String name)`, we iterate through all available `Library` implementations using the `iterate()` method and call their `getBook()` methods to find the book we are looking for.

In `getBook(String name, String category)` we are looking for a book from a specific library category. This method uses a different approach to fetch the book by invoking the `stream()` method to load the providers and then call the `getBook()` method to find the book.


### The `classics-library` Module
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
package org.library;

public class ClassicsLibrary implements Library {
  
  public static final String CLASSICS_LIBRARY = "CLASSICS";
  private final Map<String, Book> books;

  public ClassicsLibrary() {
    books = new TreeMap<>();
    Book nineteenEightyFour = new Book("Nineteen Eighty-Four",
        "George Orwell", "Description");
    Book theLordOfTheRings = new Book("The Lord of the Rings",
        "J. R. R. Tolkien", "Description");

    books.put("Nineteen Eighty-Four", nineteenEightyFour);
    books.put("The Lord of the Rings", theLordOfTheRings);
  }
  
  @Override
  public String getCategory() {
    return CLASSICS_LIBRARY;
  }

  @Override
  public Book getBook(String name) {
    return books.get(name);
  }
}
```
This implementation provides access to two books through the `getBook()` method.
Finally, we should create a folder called `META-INF/services` in the resources directory with a file named `org.library.spi.Library`. This file will contain the full class name of the implementation that will be used by the `ServiceLoader` to instantiate it. In our case, it will be `org.library.ClassicsLibrary`.

### The `computer-science-library` Module
The `computer-science-library` submodule has the same structure and requirements as the `classics-library` submodule. However, the implementation of the Library SPI, the file name, and the class name that will be created in the `META-INF/services` folder will change.

The code of the  `computer-science-library` submodule is available on [GitHub](https://github.com/thombergs/code-examples/tree/master/core-java/service-provider-interface/computer-science-library).

### The `library-client` Module
In this submodule, we will call the `LibraryService` to get information about some books.
In the beginning, we will use only the `classics-library` as a library for our demo, then we will see how we can add more capabilities to our demo project by adding the `computer-science-library` jar file to the classpath. The `ServiceLoader` will then load and instantiate our provider.

To start, let's add the `classics-library` submodule to the library-client`pom.xml` file:
```xml
<dependency>
  <groupId>org.library</groupId>
  <artifactId>classics-library</artifactId>
  <version>1.0-SNAPSHOT</version>
</dependency>
```
Then, we try to get information about two books:
```java
public class LibraryClient {

  public static void main(String[] args) {
    LibraryService libraryService = LibraryService.getInstance();
    requestBook("Clean Code", libraryService);
    requestBook("The Lord of the Rings", libraryService);
    requestBook("The Lord of the Rings", "COMPUTER_SCIENCE", libraryService);
  }

  private static void requestBook(String bookName, LibraryService library) {
    library.getBook(bookName)
      .ifPresentOrElse(
        book -> System.out.println("The book '" + bookName +
          "' was found, here are the details:" + book),
        () -> System.out.println("The library doesn't have the book '"
          + bookName + "' that you need."));
  }
  
  private static void requestBook(
      String bookName,
      String category, 
      LibraryService library) {
    library.getBook(bookName, category)
      .ifPresentOrElse(
        book -> System.out.println("The book '" + bookName + 
          "' was found in  " + category + ", here are the details:" + book),
        () -> System.out.println("The library " + category + " doesn't have the book '" 
          + bookName + "' that you need."));
  }
  
}
```
The output for this program will be:
```markdown
The library doesn't have the book 'Clean Code' that you need.
The book 'The Lord of the Rings' was found, here are the details:Book{name='The Lord of the Rings',...}
The library COMPUTER_SCIENCE doesn't have the book 'The Lord of the Rings' that you need.
```

As seen above, the book "The Lord of the Rings" is available in the classics library, but not in the computer science library which is expected behavior. 

The  "Clean Code" book is not available in the classics library. In order to get it, we can add our `computer-science-library` which contains the required book. All that we have to do is to add the dependency to the library-client`pom` file:

```xml
<dependency>
  <groupId>org.library</groupId>
  <artifactId>computer-science-library</artifactId>
  <version>1.0-SNAPSHOT</version>
</dependency>
```
When we run the demo application we get this output:
```markdown
The book 'Clean Code'was found, here are the details:Book{name='Clean Code...}
The book 'The Lord of the Rings' was found, here are the details: Book{name='The Lord of ...}
The library COMPUTER_SCIENCE doesn't have the book 'The Lord of the Rings' that you need.
```
Finally, we get the requested books. **We only had to plug-in a provider to add extra behavior to our program**.

The book "The Lord of the Rings" is not found in the 'COMPUTER_SCIENCE' category when we choose the wrong library during the fetch.

## Conclusion
In this article, we described the capabilities of the Service Provider Interface and how it works.

We gave examples of some SPI in the java ecosystem like the `Driver` provider used to connect to a database.

We also implemented a library application where we learned how to:

- define a service provider interface,
- implement the providers and the configuration file that should be created in`META-INF/services` folder for the `ServiceLoader`.
- use the `ServiceLoader` to find the different providers and instantiate them.


Find the complete code of the example application on [GitHub](https://github.com/thombergs/code-examples/tree/master/core-java/service-provider-interface).
