---
title: "Bloody Beginner's Guide to Java: Building a Robot Arena"
categories: [java]
date: 2021-03-26 00:00:00 +1100
modified: 2021-03-26 00:00:00 +1100
author: default
excerpt: "This article gets you started with the Java programming languages. It starts at zero and levels up throughout the article."
image:
  auto: 0088-jigsaw
---



{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/core-java/service-provider-interface" %}

## Getting Ready to Code

Before we can start writing code, we have to set up our development environment. Don't worry, this is not going to be complicated. The only thing we need for now is to install an IDE or "Integrated Development Environment". An IDE is a program that we'll use for programming (it's programs all the way down... :)).

When I'm working with Java, IntelliJ is my IDE of choice. You can use whatever IDE you're comfortable with, but for this tutorial, I'll settle with instructions on how to work with IntelliJ.

So, if you haven't already, download and install the free community edition of IntelliJ for your operating system [here](https://www.jetbrains.com/idea/download/). I'll wait while you're downloading it.

IntelliJ is installed and ready? Let's get started, then!

Before we get our hands dirty on code, we create a new Java project in IntelliJ. When you start IntelliJ for the first time, you should see a dialog something like this:

![First time starting IntelliJ](/assets/img/posts/robot-arena/first-start.png)

Click on "New project", to open this dialog:

![New project dialog](/assets/img/posts/robot-arena/new-project.png)

If you have a different IntelliJ project open already, you can reach the "New project" dialog through the option "File -> New -> Project".

If the "Project SDK" drop down box shows "No JDK", select the option "Download JDK" in the dropdown box to install a JDK (Java Development Kit) before you continue.

Then, click "Next", click "Next" again, enter "robot-arena" as the name of the project, and finally click "Finish".

Congratulations, you have just created a Java project! Now, it's time to actually create some code!

## Level 1 - Hello World

Let's start with the simplest possible program, the infamous "Hello World". The goal is to create a program that simply prints "Hello World" in a console.

In your fresh Java project, you should see the following folder structure on the left: 

![Empty project structure](/assets/img/posts/robot-arena/empty-project-structure.png)

There are folders named `.idea` and `out`, in which IntellJ stores some configuration and compiled Java classes ... we don't bother with them for now.

The folder we're interested in is the `src` folder, which stands short for "source", or rather "source code". This is where we put our Java files.

In this folder, create a new package by right-clicking on it and selecting "New -> Package". Call the package "level1".

<div class="notice info">
  <h4>Packages</h4>
  <p>
  In Java, source code files are organized into so-called "packages". A package is just a folder in your file system and can contain files and other packages, just like a normal file system folder. 
  </p>
  <p>
  Depending on which package a source file is in, it may or may not access source files in other packages, depending on their access modifiers. We're going to use the <code>public</code> modifier in this tutorial, so the files can be accessed from any package.
  </p>
</div>

In the package `level1`, go ahead and create a new Java file by right-clicking on it and selecting "New -> Java Class". Call this new class "Application".

Copy the following code block into your new file (replacing what is already there):

```java
package level1;

public class Application {
  public static void main(String[] arguments){
    System.out.println("Hello World");
  }
}
```

Java programs are organized into "classes", where each class is usually in its own separate Java file with the same name of the class (more about classes later). You will see that IntelliJ has created a file with the name `Application.java` and the class within is also called `Application`. Each class is in a certain package, which is declared with `package level1;` in our case above. 

Our `Application` class contains a *method* called `main()`. A class can declare many methods like that with names that we choose - we'll see how later in this tutorial. A method is a unit of code that we can execute. It can have an input in the form of arguments and an output. Our `main()` method takes an array of `String`s as input and returns a `void` output, which means it returns no output.

A method named `main()` with the `public` and `static` modifiers is a special method, because it's considered the entry point into our program. When we tell the operating system to run our program, it will execute this `main()` method.

Let's do this now. Run the program by right-clicking the `Application` class in the project explorer on the left side and select "Run 'Application.main()'" from the context menu.

IntelliJ should now open up a console and run the program for us. You should see the output "Hello World" in the console.

Congratulations! You have just run your first Java program! We executed the `main()` method which printed out some text. Feel free to play around a bit, change the text, and run the application again to see what happens.

Let's now explore some more concepts of the Java language in the next level.

## Level 2 - Personalized Greeting

Let's modify our example somewhat to get to know about some more Java concepts. The goal in this level, is to make the program more flexible, so it can greet the person executing the program.

First, create a new package `level2`, and create a new class named `Application` in it. Paste the following code into that class:

```java
package level2;

public class Application {
  public static void main(String[] arguments){
    String name = arguments[0];
    System.out.println("Hello, " + name);
  }
}
```

Let's inspect this code before we execute it. We added the line `String name = arguments[0];`, but what does it mean?

With `String name;`, we would declare a *variable* of type `String`. A variable is a placeholder that can hold a certain value. In this case, this value is of the type `String`, which is a string of characters (you can think of it as "text").

With `String name = "Bob";`, we would declare a String variable that holds the value "Bob". You can read the equals sign as "is assigned the value of".

With `String name = arguments[0];`, we declare a String variable that holds the value of the first entry in the `arguments` variable. The `arguments` variable is passed into the `main()` method as an input parameter. It is of type `String[]`, which means it's an array of `String` variables, so it can contain more than one string. With `arguments[0]`, we're telling Java that we want to take the first `String` variable from the array.

Then, with `System.out.println("Hello, " + name);`, we print out the string "Hello, " and add the value of the `name` variable to it with the "+" operator. 

What do you think will happen when you execute this code? Try it out and see if you're right.

Most probably, you will get an error message like this:

```json
Exception in thread "main" java.lang.ArrayIndexOutOfBoundsException: Index 0 out of bounds for length 0
	at level2.Application.main(Application.java:5)
```

The reason for this error is that in line 5, we're trying to get the first value from the `arguments` array, but the `arguments` array is empty. There is no first value to get. Java doesn't like that and tells us with this error.

To solve this, we need to pass at least one argument to our program, so that the `arguments` array will actually contain at least one value. 

To add an argument to the program call, right-click on the `Application` class again, and select "Modify Run Configuration". In the field "Program arguments", enter your name. Then, execute the program again. The program should now greet you with your name!

Change the program argument to a different name and run the application again to see what happens.

## Level 3 - Play Rock, Paper, Scissors with a Robot

```java
class Robot {

    String name;
    Random random = new Random();

    Robot(String name) {
        this.name = name;
    }

    String rockPaperScissors() {
        int randomNumber = random.nextInt(3);
        if (randomNumber == 0) {
            return "rock";
        } else if (randomNumber == 1) {
            return "paper";
        } else if (randomNumber == 2) {
            return "scissors";
        } else{
            throw new IllegalStateException("random number must be between 0 and 2 (inclusive)!");
        }
    }

}
```

* this might be too much for a total beginner, so I'll mention codegym as a way to get caught up
* go through the code example and explain the concepts of:
  * classes and objects
  * if/else
  * equality
* explain that you can get info about available classes like `Random` in the Javadocs

## Level 4 - A Robot Arena

* similar to the previous section, this might be a bit too much for complete beginners, so I'll link out to codegym, saying something like "if you want to dive deeper into the concepts of variables, methods, and operators, before moving forward with Classes and Objects, have a look at codegym".
* build a robot arena where two robots play "rock,paper,scissors" against each other:

```java
class Application {

    public static void main(String[] args) {
        Robot bender = new Robot("Bender");
        Robot r2d2 = new Robot("R2D2");

        Arena arena = new Arena(bender, r2d2);
        Robot winner = arena.startDuel();
        if (winner == null) {
            System.out.println("Draw!");
        } else {
            System.out.println(winner.name + " wins!");
        }
    }

}
```

* go through the code example and explain the concepts of:
  * constructors and `this`
  * if/else
  * class attributes
  * Random number generation
  * exceptions

```java
class Arena {

    Robot robot1;
    Robot robot2;

    Arena(Robot robot1, Robot robot2) {
        this.robot1 = robot1;
        this.robot2 = robot2;
    }

    Robot startDuel() {
        String robot1Shape = robot1.rockPaperScissors();
        String robot2Shape = robot2.rockPaperScissors();

        System.out.println(robot1.name + ": " + robot1Shape);
        System.out.println(robot2.name + ": " + robot2Shape);

        if (robot1Shape.equals("rock") && robot2Shape.equals("scissors")) {
            return robot1;
        } else if (robot1Shape.equals("paper") && robot2Shape.equals("rock")) {
            return robot1;
        } else if (robot1Shape.equals("scissors") && robot2Shape.equals("paper")) {
            return robot1;
        } else if (robot2Shape.equals("rock") && robot1Shape.equals("scissors")) {
            return robot2;
        } else if (robot2Shape.equals("paper") && robot1Shape.equals("rock")) {
            return robot2;
        } else if (robot2Shape.equals("scissors") && robot1Shape.equals("paper")) {
            return robot2;
        } else {
            return null;
        }
    }
}
```

* go through the code example and explain the concepts of:
  * `&&` operator
  * method return values
  * `null`


## Level 4 - Cleaning Up the Arena

* clean up the previous code example to production-grade code, as you would write it as a professional programmer, m
* introduce the concept of enums to model the ROCK, PAPER, SCISSOR shapes to get rid of the ugly if/else construct
* introduce the concept of lists to avoid returning a null value as the winner

## Summing Up - What You Learned in This Article

* a table or similar summary of all the concepts that were explained in this article

## Where to Go From Here?

* "If you liked this article, you will also like codegym..."
* list of some more Java concepts and links where to learn them
