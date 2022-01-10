---
authors: [tom]
title: "Book Review: Clean Code"
categories: ["Book Notes"]
date: 2019-11-19T06:00:00
excerpt: "Everyone is talking about Clean Code, so I finally took the time to read it. So here's my review of Uncle Bob's 'Clean Code'."
image: images/covers/clean-code-teaser.jpg
url: book-review-clean-code
---

## TL;DR: Read this Book, when...

* you're new to programming and want to learn some coding best practices
* you're a coding veteran and want to confirm your own coding best practices
* you met a "Clean Code" fanatic and want to check out if the book really is as black-and-white as they are preaching (this was my main reason to read it) 

## Overview

I guess {% include book-link.html book="clean-code" %} by Robert C. Martin doesn't need an introduction. I knew the book well before I read it. Even though I'm quite comfortable with my own coding best practices, I read it to confirm my coding practices and to be able to discuss it with any fanatic "Clean Code" disciple I happen to meet. 

The book contains mostly small and easily digestible chapters, which get (a lot) longer and (a lot) more tiring towards the end of the book. It uses Java for most code examples and even some Java-specific frameworks in the discussions, so you get the most of it if you're familiar with Java.

The book starts with isolated coding practices around naming and functions and becomes more broad and general in the end, discussing systems, concurrency and code smells.

## Likes and Dislikes

I agree with most of the clean code practices discussed in the book. However, they should be applied with common sense instead of being followed dogmatically. 

Some quotes from the book are very black-and-white, like

> "Duplication may be the root of all evil",

or

> "Comments are always failures".

Taken out of context, these quotes may very well recruit "Clean Code" fanatics that split all of their code into one-line methods and argue about every comment in your code, even if they are justified.

In most cases, though, Martin softens up the meaning of those rules and explains when it makes sense to break them.

The book contains a lot of quotes about coding, however, that are very valid even when taken out of context. This is my favorite: 

> "To write clean code, you must first write dirty code and then clean it."

This is exactly how I create clean code :).

The first half of the book is very concise and fun to read, as it explains clean coding practices. 

The second half is tiresome to read as it contains a lot of very long code examples that are hard to follow. Most of the value of the book is in the first half, though.

## Key Takeaways

Here are my notes of the book in my own words. I added some comments in *italics*.

### Clean Code

* code will always be needed to translate vague requirements into "perfectly executed programs"
* bad code can bring a whole company down due to maintenance nightmares
* it's our responsibility to create clean code even if deadlines are looming - communication is key
* we usually won't make a deadline by cutting corners
* "bad code tempts the mess to grow" (*this is an instance of the "Broken Windows" Theory - learn about broken windows in my [article about code coverage](/100-percent-test-coverage/#broken-windows-cracks-in-your-code-coverage) and in my [book](/book)*)

### Meaningful Names

* meaningful names matter because programming is a social activity and we have to be able to talk about it
* keep interface names clean (i.e. without prefixed "I", for instance) and prefer to rename the implementation instead (call it "...Impl", if you must) - we don't want clients to know that they're using an interface

### Functions

* functions should be short
* functions should not mix levels of abstraction
* a way to hide big switch statements is to hide them in a factory and use polymorphism to implement behavior that depends on the switch value
* functions should have as few parameters as possible - understandability suffers with each added parameter
* functions should not have side effects
* functions should not need a double-take to understand
* functions should avoid output parameters
* functions should separate commands from queries
* code is *refactored* into small functions - it's not *created* that way

### Comments

* inaccurate comments are worse than no comments at all - and comments tend to become inaccurate over time
* we cannot always avoid comments - sometimes we need comments that are informative, explaining, warning, or amplifying intent
* there are many more types of bad comments than of good comments
* javadoc should not be seen as mandatory - it often only adds clutter
* commented-out source code creates questions, not answers, so it should be deleted
* a comment should not require further explanation (to explain the comment)

### Formatting

* a source file should read like a newspaper article - starting with the general idea and increasing in detail as you read on
* use vertical distance (empty lines) to separate thoughts and vertical density to group things together
* most formatting can and should be automated with tools 

### Objects and Data Structures

* don't add getters and setters by default - instead, provide an abstract interface to the data so that you can modify the implementation without having to think about the clients
* adding a new data structure to procedural code is hard because all functions have to change
* adding a new function to object-oriented code is hard because all objects have to change
* an object hides its internals, a data structure doesn't 
* objects expose behavior and hide data (i.e. adding or changing behavior is hard while adding or changing the underlying data is easy)
* data structures have no behavior and expose data (i.e. adding behavior is easy while adding or changing data is hard)
* we don't need objects all the time - sometimes a data structure will do

### Error Handling

* error handling should not obscure the business logic
* checked exceptions violate the Open/Closed Principle - every method between the throwing method and the handling method needs to declare it


### Boundaries

* wrap third-party code so as not to expose its externals to your system
* use "learning tests" to try out third-party code before integrating it into your codebase
* integration of third-party code should be covered by "boundary tests" so that we know if a new version of the library will work as expected

### Unit Tests

* the bulk of unit tests created when practicing TDD can become a management problem
* dirty tests are worse than no tests - they will reduce understanding and take more time to change than the production code
* the causal chain of dirty tests:
  * dirty tests
  * developers complain
  * developers throw tests away
  * developers fear changes in production code
  * production code rots
  * defect rate climbs
* tests enable change
* test code must be made to read
* don't stick to the "one assertion per test" rule dogmatically
* a good test follows the FIRST rules:
  * fast
  * independent
  * reliable
  * self-validating
  * timely
  
### Classes

* a class should have a single reason to change
* "A system with many small classes has no more moving parts than a system with a few large classes."
* classes are maximally cohesive if every method manipulates or accesses each instance variable
* if a class loses cohesion, split it

### Systems

* separate bootstrapping logic from business logic (*you might like the chapter "Assembling the Application" in my own [book](/book/)*)
* systems can grow iteratively if we maintain proper separation of concerns
* the rest of this chapter is just a sequence of shallow discussions on EJB, AOP, and other concepts.

### Emergence

* making sure the system is testable helps us create better designs because we're building small classes that are easy to test
* refactor to remove duplication
* refactor to separate responsibilities
* take pride in workmanship to improve code continuously - the design will emerge

### Concurrency

* concurrency is hard to get right, so clean code is especially important
* concurrency is a responsibility and should be separated from other responsibilities
* to avoid concurrency issues restrict scope, return object copies, and make threads independent
* keep synchronized methods small

### Successive Refinement

* "To write clean code, you must first write dirty code and then clean it."
* *this chapter contains 60 pages with code examples making it a chore to read - I skipped most of it...*

### JUnit

* refactoring is iterative - each refactoring may invalidate a previous refactoring
* *this chapter contains very long code examples, making it a chore to read - I skipped most of it...*

### Refactoring SerialDate

* *a rather boring discussion about how Uncle Bob refactored the `SerialDate` class into clean code*

### Smells and Heuristics

* *this chapter contains a valuable list of code smells which don't make sense to include in this summary*
* *I believe that this chapter violates the Single Responsibility Principle by explaining both smells and heuristics ... why not two separate chapters?* 

## Conclusion

The first half of "Clean Code" is a worthy read and helps to establish or confirm good coding practices. It's easy - even fun - to read about the reasoning behind the clean coding practices.

You might want to skip the second half, though, as it feels like a chore to read and, in my opinion, doesn't bring as much value.

Be careful with out-of-context quotes from this book, as they tend to be very black-and-white.