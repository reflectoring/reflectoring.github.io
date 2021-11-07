---
title: "Java 8 to 17 - what has changed?"
categories: [Java]
date: 2021-11-05 06:00:00 +1000
modified: 2021-11-05 06:00:00 +1000
author: mateo
excerpt: "Examples of key language changes in each major release from Java 8 to 17."
image: 
  auto: 0065-java
---
With history like Javas it would be almost impossible to write down and explain all changes made to language. 

In this article we will show all key language changes from Java 8 to Java 17. 

Intention of this article is to be single stop point for all major features that we want to go through.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/core-java/versions" %}

## Java 8

Java 8 was such a revolutionary release that it put Java back on the pedistal of programming languages. Its new features helped with the productivity, ease of use and the readability of the code. 
In this chapter we will go through some of the most important changes made to the Java language in the Java 8 release:

* [Lambda expressions](#lambda-expression)
* [Method Reference](#method-reference)
* [Default Methods](#default-methods)
* [Type Annotations](#type-annotations)
* [Repeating Annotations](#repeating-annotations)
* [Method Parameter Reflection](#method-parameter-reflection)

### Lambda Expressions
`Lambda expressions` is the new feature in Java 8 that put us a bit closer to functional programming. Java was always known for having a lot of boilerplate code, and with release of Java 8 this statement became less true. In our next examples we will see how can we use lambdas in few different scenarios. Let us begin.

#### World before lambda expressions

We own car dealership buisness and we happen to be a software developer at the same time. To discard all the paperwork we created the webpage that should help us find all, currently available, cars. Each of our car has its model and distance run. Let us take a look how we would implement function for something like this in naive way:
```java
  public static List<Car> findCarsOldWay(List<Car> cars){
      List<Car> selectedCars = new ArrayList<>();
      for (Car car: cars) {
          if(car.kilometers < 50000){
              selectedCars.add(car);
          }
      }
      return selectedCars;
  }
```
To implement this we created static function which accepts a `List` of cars. Then, it goes through each of the car and check if distance run is below desired amount. If so we want to add that car into the new list. This new list is returned to whoever called our method.
Even though we did what we intened to, our solution will present problematic as soon as we want to add new criteria for selecting cars. We would need to write new method or find all occurances of this code and change it according with the new requirement.

#### Expanding function with new criteria
If we want to expand our selection process and say that we want only Mercedes Benz cars our function will look something like this:
```java
  public static List<Car> findCarsWithModelOldWay(List<Car> cars){
      List<Car> selectedCars = new ArrayList<>();
      for(Car car: cars){
          if(car.kilometers < 50000 && car.model.equals("Mercedes")){
              selectedCars.add(car);
          }
      }
      return selectedCars;
  }
```
We added new condition into our `if` statement. This example help us move into our next set of examples where we will see how to use `lambda expressions` on the stream API and as the method argument.

#### World after lambda expressions
We have same problem as in the [previous example](#world-before-lambda-expressions). Our client wants to find all cars with some criteria. Let us see little less rigid solution to this problem:
```java
  public interface Criteria<T>{
      boolean evaluate(T t);
  }

  public static List<Car> findCarsUsingLambdaCriteria(List<Car> cars, Criteria<Car> criteria){
      List<Car> selectedCars = new ArrayList<>();
      for(Car car: cars){
          if(criteria.evaluate(car)){
              selectedCars.add(car);
          }
      }
      return selectedCars;
  }

  List<Car> criteriaLambda = findCarsUsingLambdaCriteria(cars,
      (Car car) -> car.kilometers < 500000 && car.model.equals("Mercedes"));
```
First thing that we want to create is functional interface. We can pass that functional interface as parameter to our filtering function and call upon its method to evalueate criteria. Last row of our code shows how can we use `lambda expressions` to pass implementation of functional interface method.
More about lambda expressions can be found on [oracle page.](https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html)

### Method Reference
#### Usecase Showcase
Our next examples will show us how to use `method reference` in Java 8. We still own our car dealership shop and we want to print out all of the cars that we have in our shop. For that we will be using `method reference`. `Method reference` allows us to call functions in classes using special kind of syntax `::`. Let us see how it is done using standard method call:
```java
  List<String> withoutMethodReference = cars.stream()
                                            .map(car -> car.toString())
                                            .collect(Collectors.toList());
```
We used `lambda expressions` to map car objects into their `string`variant. 
#### Method Reference Example
Now, let us see how to use `method reference` in same situation:
```java
  List<String> methodReference = cars.stream()
                                     .map(Car::toString)
                                     .collect(Collectors.toList());

```
Here we are , again, using `lambda expressions` but now, we are calling `toString()` method by `method reference`. We can see how it is more concise and easier to read. To read more about method reference please look into [oracle page.](https://docs.oracle.com/javase/tutorial/java/javaOO/methodreferences.html)

### Default Methods
Let's say that, in our company, build library for logging. It allows us to have *contract* for logging throughout all applications inside our company. 
Since we started as small startup it was enough just to provide `log(String message)` method that will print out message where we want. After growing we realized that we want to be able provide the timestamp of our message, so it is easily searchable throughout logs. Obviously we don't want to introduce this change and make everyone use it as soon as it is available. Every service should use it as soon as possible but , maybe, there are more important stuff to deal with that moment. 
#### Usecase showcase
For that scenario we can use `default methods` introduced in Java 8. `Default methods` allows us to fallback to default implementation if developer didn't provide implementation in the class.
Let us see how our contract looks:
```java
  public interface Logging{
      void log(String message);
  }

  public class LoggingImplementation implements Logging{

      @Override
      public void log(String message) {
          System.out.println(message);
      }
  }
```

We are creating simple interface with just one method and implementing it in `LoggingImplementation` class. 
#### Default methods usage
If we want to introduce new method inside `Logging`interface compiler will fail with exception: `Class 'LoggingImplementation' must either be declared abstract or implement abstract method 'log(String, Date)' in 'Logging'`. In our next example we can see solution to this using `default methods`: 
```java
  public interface Logging{
      void log(String message);

      default void log(String message, Date date){
          System.out.println(date.toString() + ": " + message);
      }
  }
```
We used `default` keyword on method definition and put the implementation of that method inside our interface. Now, our `LoggingImplementation` class does not fail with compiler error even though we didn't implement this new method inside of it. 
To read more about `default methods` please refer to the [oracle page](https://docs.oracle.com/javase/tutorial/java/IandI/defaultmethods.html)

### Type Annotations
Type annotations are one more feature introduced in Java 8. Even though we had annotations available before now we can use them wherever we use type. This means that we can use them on:
- local variable definition 
- constructor call
- type casting
- generics 
- throw clauses and more
For more informations about type annotations please refer to [oracle page.](https://docs.oracle.com/javase/tutorial/java/annotations/type_annotations.html)
#### Creating New Annotation
We will show several examples of how to use type annotations. First let us build the `@NotNull` annotations since we are not using any library for this:
```java
  @Target(value={TYPE_USE})
  @Retention(value=RUNTIME)
  public @interface NotNull{}
```
Here we have example of one basic annotations. For now, this annotation will do nothing, since we don't have any checking module. `TYPE_USE` target allows us to use this annotation at local variable.
#### Local Variable Definition
We have several arguments comming from command line when our app is called. First of that arguments we expect to be the desired username and we want save it into our variable called `userName`. Let us see how to ensure that our local variable doesn't end up as `null`value:
```java
  @NotNull String userName = args[0];
```
This is annotation on local variable definition and it is allowed because we used `TYPE_USE` target on our `@NotNull` annotation definition.
#### Constructor Calling
Let us imagine we want to create list of strings from our input from the command line. We want to make sure that our new list is not empty. For that we can use `@NotNull` annotation:
```java
  List<String> request = new @NotEmpty ArrayList<>(Arrays.stream(args).toList());
```
This annotation will ensure that our, newly created, list is not empty. This is perfect example of how to use type annotations on constructor.

#### Generic Type
Our application is acceppting set of strings as argument, and we want save them into new `List<String> emails`. One of our requirements is that each email has to be in right format `<name>@<company>.com`. We can ensure this in two ways. First of which is by looping through all of our incoming strings and ensuring that each of those values corresponds with our desired format. 
But, if we use type annotations, we can do it really easy:
```java
  List<@Email String> emails;
```
This here is our definition of local variable emails which will accepts incoming strings in one point in time. We created, or used already created, `@Email` annotation that ensures that every record inside this list is in desired format.

### Repeating Annotations
#### Creating Repeating Annotation
Sometime annotations represents actions that we want to do on different occasions. Let us imagine we have an application with the fully implemented security. It is internal tool that we use in our company. There are different levels of the authorization and not all users can do all actions. Even though we implemented everyting carefully we want to make sure that we log every attempt of trying to do something that user is not authorized to. On each of those occasions we want to send email to owner of company and to our security admin group email. 
This is where we can use repeatable annotations:
```java
  @Repeatable(Notifications.class)
  public @interface Notify{
      String email();
  }

  public @interface  Notifications{
      Notify[] value();
  }
```
The first thing that we want to do is to create `repeating annotation`. We create it as regular annotation but we provide `@Repeatable` annotation to our definitions.

Next, let us see how is our `repeating annotation` used:
```java
  @Notify(email="admin@company.com")
  @Notify(email="owner@company.com")
  public class UserNotAllowedForThisActionException extends RuntimeException{
      final String user;

      public UserNotAllowedForThisActionException(String user){
          this.user = user;

      }
  }
```
We have our custom exception class that we will throw whenever user tries to do something that he/she is not allowed to. Our annotations to this class says that we want to notify two emails when code throws this exception.
To read more about repeating annotations please refer to [oracle page.](https://docs.oracle.com/javase/tutorial/java/annotations/repeating.html)

## Java 9
Java 9 introduced next features:
* [Java Module System](#java-module-system)
* [Try-with-resources](#try-with-resources-improvement)
* [Diamond Syntax with Inner Anonymous Classes](#diamond-syntax-with-inner-anonymous-classes)
* [Private Interface Methods](#private-interface-methods)
### Java Module System
Module is group of packages,their dependencies and resources. It provides bigger set of functionalities than packages. 
When creating the new module we need to provide several informations:
* Name
* Dependencies 
* Public Packages - by default, all packages are module private
* Services Offered
* Services Consumed
* Reflection Permissions

Without going into much of the details let us craete our first module. Inside our example we will show several options and keywords that one can use when creating module.

#### Creating Modules Inside IntelliJ
First, we will go with a simple example. We will build Hello World application where we print "Hello" from one module and we call second module to print "World!". Since I am working in the IntelliJ IDEA there is something that we need to understand first. IntelliJ IDEA supports its own modules. For Java modules to work each module has to correspond to the IntelliJ module. 

![Package structure!](../assets/img/posts/java-release-notes/package-structure.png "Package structure")

Here we see how we structured our packages and modules. We have two modules: `hello.module` and `world.module`. They corresponds to `hello` and `world` IntelliJ modules repectively. Inside each of them we  have created the `have module-info.java` file. This very file is defining our Java module. Inside of it we need to declare which packages we need to export and on which modules are we dependen upon.

#### Defining our First Module

For this example we are going to use the `hello` module to print "Hello". Inside of it we will call method inside `world` module, which will print "World !". First thing that we need to do is to declare export of the package containing our `World.class`  inside `module-info.java`:
```java
  module world.module {
      exports com.reflectoring.io.app.world;
  }
```
We can see how one module is created. First we have keyword `module` that is followed by name of our module. We will use this name, later, for referencing this module. Next keywork that we use is `exports`. It tells us that we are making our `com.reflectoring.io.app.world` package visible outside of our module. 

There are several other keywords that can be used:
* requires
* requires transitive
* exports to
* uses
* provdies with
* open
* opens
* opens to

Out of these we will show only `requires` declaration. Others can be found on [the link.](https://www.oracle.com/corporate/features/understanding-java-9-modules.html)

#### Defining our Second Module
After we created and exported our `world` module we can proceed with creating `hello` module that will use previously created module and call it from its code:

```java
  module hello.module {
      requires world.module;
  }
```
After defining name of module we define our dependencies using `requires` keyword. We are referencing our, newly created, `hello.module`. Since we are not exporting anything from this module all packages are module private and cannot be seen from outside of the module. 

#### Using Java Modules Inside of the Code
Now that we have showns how to create modules and dependencies between them, let us show how to use those modules inside of the code. We have main method inside `hello.module` that prints "Hello" to the console. We want to call method from `world.module` to print out " World!" to the console:
```java
  package com.reflectoring.io.app.hello;

  import com.reflectoring.io.app.world.World;

  public class Hello {
      public static void main(String[] args) {
          System.out.println("Hello");
          World.print();
      }
  }
```
Since `com.reflectoring.io.app.world` is exported from its module and set as required to `hello.module` we can call it as if it is inside our module. Just for reference here is how `World.print()` method looks:
```java
  package com.reflectoring.io.app.world;

  public class World {
      public static void print() {
          System.out.println(" World!");
      }
  }
```
To read more about Java module system please refer to [oracle page.](https://openjdk.java.net/jeps/261)

### Try-with-resources Improvement
`Try-with-resources` is feature that enables us to declare new resource on `try-catch` block which will autoclose upon completion.
#### Manual Closing of Resource
Before Java 8 we had to do our resource closing manually. Let us say that we want to read some `string` using `BufferedReader`. `BufferedReader` is, by its nature, closable resource so we need to make sure that it is properly closed after use. Before Java 8 we would do it like this:
```java
  BufferedReader br = new BufferedReader(new StringReader("Hello world example!"));
  try {
      System.out.println(br.readLine());
  } catch (IOException e) {
      e.printStackTrace();
  }finally {
      try {
          br.close();
      } catch (IOException e) {
          e.printStackTrace();
      }
  }
```
After using it, we would, in `finally` block call `close()` method upon our `BufferedReader`. Since `finally` block is always triggered we are sure that , even if exception pops out, our reader will be properly closed. Since our `close()` method can throw exception we need to make sure to surround it with `try-catch` block.

#### Improvement on Autoclosable
Java 8 introduced try with resource feature that enable us to declare our resource inside `try` definition. This will ensure that our closable is closed properly every time. Let us take a look into same example of using the `BufferedReader` to read string:
```java
 final BufferedReader br3 = new BufferedReader(new StringReader("Hello world example3!"));
  try(BufferedReader reader = br3){
      System.out.println(reader.readLine());
  }catch (IOException e){
      System.out.println("Error happened!");
  }
```
Inside our `try` definition we assigned our, previously created, reader to the new variable. Now we know that our reader will get closed everytime.
#### Improvement upon Try-with-resource
How can we example [above](#improvement-on-autoclosable) improve ? Well, defining variable in one place only to reassign it to another inside `try` definition is a little bit of pain in the eye.
Hopefully Java 9 introduced some changes with which we can avoid that scenario. We will be looking into the same example of reading input string through `BufferedReader`:
```java
  final BufferedReader br2 = new BufferedReader(new StringReader("Hello world example2!"));
  try(br2){
      System.out.println(br2.readLine());
  }
  catch (IOException e){
      System.out.println("Error happened!");
  }
```
Now we don't need to create new variable only to be able to autoclose it inside `try-catch` block. We are using the same one from original definition.

To read more about `try-with-resources` feature please refer to [oracle page.](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html)
### Diamond Syntax with Inner Anonymous Classes
#### What Java 9 Fixed
Before Java 9 we could use diamond operators but couldn't use them inside inner Anonymous classes.
For our example we will try to create abstract class that has only one method, method for appending two strings with `-` between them. 
Since this is abstact class we will use the anonymous class for providing the implementation for `append()` method:
```java
  public static void main(String[] args) {
          AppendingString<String> appending = new AppendingString<>() {
              @Override
              public String append(String a, String b) {
                  return new StringBuilder(a).append("-").append(b).toString();
              }
          };

          String result = appending.append("Reflectoring", "Blog");
          System.out.println(result);
      }

      public abstract static class AppendingString<T>{
          public abstract T append(String a, String b);
      }
```
We are using diamond operator to tell our method which type we expect.
Since we are using Java 8 in this example we will get next compiler time error:

```java
java: cannot infer type arguments for com.reflectoring.io.java9.DiamondOperator.AppendingString<T>
  reason: '<>' with anonymous inner classes is not supported in -source 8
    (use -source 9 or higher to enable '<>' with anonymous inner classes)
```

### Private Interface Methods
We already mentioned how can we use default methods in interfaces. What happens when we have, relatively, complex implementation and we want to split it into several methods?
When working with classes we can achieve it using private methods. Could that be the solution in our case ? As of Java 9 yes. We can create private methods inside our interfaces.

#### Usage of Private Interface Methods
For our next example we want to print out set of names. That list of names should come from a database. Since our app is up and running for quite some time, and we have sevaral clients using our code, we wanted to make sure that our app doesn't break after introducing new method to this interface.
That is the reason why we moved forward with the default method implementation.
If client doesn't implement this method we still want to return something. Since we don't know any implementation details of our client one thing that we can do is provide set of predefined names.

```java
  public class PrivateInterfaceMethods {
      public static void main(String[] args) {
          TestingNames names = new TestingNames();
          System.out.println(names.fetchInitialData());
      }

      public static class TestingNames implements NamesInterface{
          public TestingNames(){}
      }
      public interface NamesInterface{
          default List<String> fetchInitialData(){
              try(BufferedReader br = new BufferedReader(new InputStreamReader(this.getClass().getResourceAsStream("/names.txt")))) {
                  return readNames(br);
              } catch (IOException e) {
                  e.printStackTrace();
                  return null;
              }
          }
          private List<String> readNames(BufferedReader br) throws IOException {
              ArrayList<String> names = new ArrayList<>();
              String name;
              while((name = br.readLine()) != null){
                  names.add(name);
              }
              return names;
          }
      }
  }
```
We used `BufferedReader` to read file containing default names that we want to share with client.
To encapsulate our code, and, possibly, make it reusable in other methods, we decided to move code for reading and saving names into `List` to the separate method.
This method is private and , now, we can use it anywhere inside our interface. 
As mentioned, main benefit of this feature inside Java 9 is better encapsulation and reusability of the code.
## Java 10
### Local Variable Type Inference
Java has always needed explicity types on local variables. This was always then double edged sword.
When writing and reading code one could always know which type is asked for and what to expect, but, on the other hand, a lot of the code is just types with no real usability.
#### Old Way of Working
Let us look into the example here. We want to create small set of people, put everything in one list and then go through that list in the for loop to print out their name and lastname:
```java
  public void explicitTypes(){
      Person Roland = new Person("Roland", "Deschain");
      Person Susan = new Person("Susan", "Delgado");
      Person Eddie = new Person("Eddie", "Dean");
      Person Detta = new Person("Detta", "Walker");
      Person Jake = new Person("Jake", "Chambers");

      List<Person> persons = List.of(Roland, Susan, Eddie, Detta, Jake);

      for(Person person : persons){
          System.out.println(person.name + " - " + person.lastname);
      }
  }
```
This is the type of the code that we can see in most cases in Java. We use explicity types to make sure that we know what is expeceted and sent into methods.
#### Using var as Type
Now, we will look into same example, but with `var` type introduced in the Java 10. We still want to create sevaral persons and put the into the list. After that we will go through that list and print out the name of each person:
```java
public void varTypes(){
        var Roland = new Person("Roland", "Deschain");
        var Susan = new Person("Susan", "Delgado");
        var Eddie = new Person("Eddie", "Dean");
        var Detta = new Person("Detta", "Walker");
        var Jake = new Person("Jake", "Chambers");

        var persons = List.of(Roland, Susan, Eddie, Detta, Jake);

        for(var person : persons){
            System.out.println(person.name + " - " + person.lastname);
        }
    }
```
We can se some of the most typical examples of using `var` type on local variables. First, we can use them on defining local variable. It can be standalon object or even list with diamond operator. 
From now on, Java will know how to handle it. We can also use it when we define variable inside `for-each` loop.
There are several more usecases. For more details about local type inference please visit [oracle page.](https://docs.oracle.com/en/java/javase/17/language/local-variable-type-inference.html)
## Java 11
### Local Variable Type in Lambda Expressions
Java 11 introduced improvement on, previously mentioned, [local type inference](#local-variable-type-inference). This allowed us to use `var` inside lambda expresions.
#### Using var in Lambda
For our example we will, again, create list of persons, collect them into the list and filter out all that don't have 'a' inside their name:
```java
  public void explicitTypes(){
      var Roland = new Person("Roland", "Deschain");
      var Susan = new Person("Susan", "Delgado");
      var Eddie = new Person("Eddie", "Dean");
      var Detta = new Person("Detta", "Walker");
      var Jake = new Person("Jake", "Chambers");

      var filteredPersons = List.of(Roland, Susan, Eddie, Detta, Jake)
              .stream().filter((var x) -> x.name.contains("a")).collect(Collectors.toList());;
      System.out.println(filteredPersons);
  }
```
Inside `filter()` method we are using `var` as type for object on which we are going to filter. Please note that it doesn't make difference if we use `var` or type inference without it. It will work same for both.
## Java 14
### Switch Expressions
#### Old Way of Switch Statements
To avoid using multiple nested `if-else` statements we are using `switch-case`. Let's imagine that we have method where client provides desired month and we return number of days inside that month. First thing that comes to our mind is to build it with `switch-case` statements:
```java
  switch (month){
      case JANUARY, MARCH,MAY, JULY, AUGUST,OCTOBER,DECEMBER:
          days=31;
          break;
      case FEBRUARY:
          days=28;
          break;
      case APRIL, JUNE, SEPTEMBER,NOVEMBER:
          days = 30;
          break;
      default:
          throw new IllegalStateException();
  }
```
We need to make sure that we put break statement inside our `case` code block so we don't continue checking on another conditions after first one is matched. 
#### Using Switch Expressions
Java 14 introduces us with switch expressions that allows us to omit `break` statement. It helps with readibiliy of code and better understanding.
We are going to look into same method as before. User wants to send the month and get number of days in that month:
```java
  days = switch (month){
            case JANUARY, MARCH,MAY, JULY, AUGUST,OCTOBER,DECEMBER -> 31;
            case FEBRUARY -> 28;
            case APRIL, JUNE, SEPTEMBER,NOVEMBER ->  30;
            default -> throw new IllegalStateException();
        };
```
We can see that we are using a bit different notation in our `case` block. We are using `->` instead of colon.
This will do same thing as code shown in [previous example](#old-way-of-switch-statements).
#### Introduction of yield keyword
Our logic inside `case` block can be a bit more complicated then just returning value. For example, we want to log which month user did user send us:
```java
  days = switch (month){
      case JANUARY, MARCH,MAY, JULY, AUGUST,OCTOBER,DECEMBER -> {
          System.out.println(month);
          yield 31;
      }
      case FEBRUARY -> {
          System.out.println(month);
          yield 28;
      }
      case APRIL, JUNE, SEPTEMBER,NOVEMBER -> {
          System.out.println(month);
          yield 30;
      }
      default -> throw new IllegalStateException();
  };
```
To this to work we had to put `yield` keyword at end or our code block. We can say that this will return value and break out of our `switch-case` statement.
To read more about using switch expressions please refer to [oracle page.](https://docs.oracle.com/en/java/javase/14/language/switch-expressions.html)
## Java 15
### Text Blocks
#### Example Without Using Text Blocks
We have the string that spans into multiple lines that we want to store into the variable. First example that comes into my mind is some simple html document, so let't start with that. We want to show simple html document into out page, e.g email template. 
For this to work we need to store template into a variable:
```java
  System.out.println(
          "<!DOCTYPE html>\n" +
          "<html>\n" +
          "     <head>\n" +
          "        <title>Example</title>\n" +
          "    </head>\n" +
          "    <body>\n" +
          "        <p>This is an example of a simple HTML page with one paragraph.</p>\n" +
          "    </body>\n" +
          "</html>\n");
```
Standard way that we can do is to format our string like example above. Here we need to take care about new line, special syntax to append line to another one etc. Java 15 introduced easier way of doing this. It is called the `text block`.
#### Example of Using Text Blocks
Let us look into same example of html template for email. We want to send example email with some straightforward html formatting. This time we will use the text block:
```java
  System.out.println(
          """
          <!DOCTYPE html>
          <html>
              <head>
                  <title>Example</title>
              </head>
              <body>
                  <p>This is an example of a simple HTML page with one paragraph.</p>
              </body>
          </html>      
          """
  );
```
We used special syntaxt for openning quotes: `"""`. Creating these openning quotes allows us to treat our string as if we are writing it in standard .txt file.
There are some rules that we need to abide to when using text blocks. We need to make sure that we put new line after our openning quotes or our compiler will throw error: `Illegal text block start: missing new line after opening quotes`.
If we want to end our string with `\n` we can do it by putting new line before closing `"""` like in example above.
To read more about text blocks please refer to [oracle page.](https://docs.oracle.com/en/java/javase/15/text-blocks/index.html)
## Java 16
### Pattern Matching of instanceof

#### Example without pattern matching
Let us imagine that we built application for car dealership buissness. Among other things, we build the method for calculating price of vehicle depending on type of the car. We have base class called `Vehicle` and two classes that extend that one: `Car` and `Bicycle`.
Code for that is omitted and you can look it up on the [github page](https://github.com/thombergs/code-examples/tree/master/core-java/versions). Our algorithm for calculating prices is depending on the instance of vehicle that is sent to it:
```java
  public static double priceOld(Vehicle v){
      if(v instanceof Car){
          Car c = (Car)v;
          return 10000 - c.kilomenters*0.01 - (Calendar.getInstance().get(Calendar.YEAR) - c.year)*100;
      }else if(v instanceof Bicycle){
          Bicycle b = (Bicycle)v;
          return 1000 + b.wheelSize*10;
      }else throw new IllegalArgumentException();
  }
```
Since we are not using pattern matching we need to make sure to cast vehicle into correct type inside each `if-else` block. As we can se, it is typical example of boilerplate code for which Java is notoriously familiar.
#### Working with pattern matching
Now, we will se how can we discard boilerplate part from example [above](#example-without-pattern-matching):
```java
  public static double price(Vehicle v){
      if(v instanceof Car c){
          return 10000 - c.kilomenters*0.01 - (Calendar.getInstance().get(Calendar.YEAR) - c.year)*100;
      }else if(v instanceof Bicycle b){
          return 1000 + b.wheelSize*10;
      }else throw new IllegalArgumentException();
  }
```
Pattern matching on the `instanceof` allows us to cast our variable inline and use it inside desired `if-else` block. One thing to note is the scope of casted variable. We can see it in any part of the code that can be reached only if `instanceof` is true.
For more information about pattern matching in `instanceof` method please refer to [oracle page.](https://docs.oracle.com/en/java/javase/16/language/pattern-matching-instanceof-operator.html)
### Record Classes
Let us start this chapter with question.
How many times have you started to work on the new project and realize that, for next few days, you will be writing nothing but POJO(Plain Old Java Object) classes?
Well, i can answer for myself: "To many times!".
We all know how Java had bad reputation about boilerplate code , to be honest, that reputation follows Java today also.
After many years of writing all of those getters, setters, constructors etc. Lombok came for the help. We realized that it is much more fun to work on new project without to worry about did we put all getters, setters etc.
Lombok provided us with many more features but this one is what people form Java fondation tried to tackle in `Record class`.
Record class is nothing more then regular POJO for most of code is generated out of definition.

#### Plain Old Java Object definition
Let us look into example of POJO class before introducing `record` in Java 16:
```java
public class Vehicle {
    String code;
    String engineType;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getEngineType() {
        return engineType;
    }

    public void setEngineType(String engineType) {
        this.engineType = engineType;
    }

    public Vehicle(String code, String engineType) {
        this.code = code;
        this.engineType = engineType;
    }

    @Override
    public boolean equals(Object o) ...

    @Override
    public int hashCode() ...

    @Override
    public String toString() ...
}
```
As we can see, there are almost 50 lines of code for object that contains only two properties. To be honest, this code was generated using IDE , but still it is there, it is inside our class.
#### Record Definition
Definition of vehicle, with same two properties, can be done in just one line:
```java
  public record VehicleRecord(String code, String engineType) {}
```
This one line has all same getters, setters, constructors etc. as from example [above](#plain-old-java-object-definition).
One thing to note is that `record` class is, by default, final and we need to comply with that. That means we cannot extand a `record` class, but most of other things is available for us.

To read more about record classes please refer to [oracle page.](https://docs.oracle.com/en/java/javase/16/language/records.html);
## Java 17
### Sealed Classes
To not allow class to be extended we need to add `final` modifier to its definiton. What about when we want to be able to extend class but only by some classes.
This behaviour can be desired when we are writing a library that is going to be used by other developers.
We are back at our car dealership business. We are so proud of our algorythm for calculating prices that we want to expose it to other developers through library, but we don't want them use our Vehicle representation, since it is valid just for our buisness. 
We can see a bit problem here. We need to expose class but constrain it also. 
This is where Java 17 comes into play with `sealed` classes. Sealed class allows us to make class effectively final for everyone expect explicitly mentioned classes.
```java
  public sealed class Vehicle permits Bicycle, Car {...}
```
We added `sealed` modifier to our Vehicle class and needed to add `permits` keyword with list of classes that we allow to extend it. 
After this change we are still getting errors from compiler. There is one more thing that we need to do here. We need to add `final`, `sealed` or `non-sealed` modifiers to classes that are going to extend our class.

```java
  public final class Bicycle extends Vehicle {...}
```
#### Constraints 
There are several constraint that has to be met for sealed class to work. We are just mention them , for more details please go to official documentation:
* Permitted subclasses must be accessible by the sealed class as compile time
* Permitted subclasses must directly extend the sealed class
* Permitted subclasses must have one of following modifiers:
  * final
  * sealed
  * non-sealed
* Permitted subclasses must be in same Java module
More details about sealed classes can be found on [oracle page.](https://docs.oracle.com/en/java/javase/17/language/sealed-classes-and-interfaces.html)
