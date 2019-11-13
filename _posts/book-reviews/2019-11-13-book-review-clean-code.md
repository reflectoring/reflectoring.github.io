---
title: "Book Review: Clean Code"
categories: [book-reviews]
date: 2019-11-13 06:00:00 +1100
modified: 2019-11-13 06:00:00 +1100
excerpt: "Everyone is talking about Clean Code, so I finally took the time to read it. So here's my review of Uncle Bob's 'Clean Code'."
image:
  teaser: /assets/img/teasers/shape-up-1200x628.png
  opengraph: /assets/img/teasers/shape-up-1200x628-branded.png
---

## TL;DR: Read this Book, when...

## Overview

## Likes and Dislikes

## Key Takeaways

### Clean Code

* code will always be needed to translate vague requirements into "perfectly executed programs"
* bad code can bring a whole company down due to maintenance nightmares
* it's our responsibility to create clean code even if deadlines are looming - communication is key
* we usually won't make a deadline by cutting corners
* "bad codes tempts the mess to grow" - it's an instance of the "Broken Windows" Theory (learn about broken windows in my [article about code coverage](/100-percent-test-coverage/#broken-windows-cracks-in-your-code-coverage) and in my [book](/book))

### Meaningful Names

* meaningful names matter because programming is a social activity and we have to be able to talk about it
* keep interface names clean (i.e. without prefixed "I", for instance) and prefer to rename the implementation instead (call it "...Impl", if you must) - we don't want clients to know that they're using an interface

### Functions

* functions should be short
* functions should not mix levels of abstraction
* a way to hide big switch statements is to hide them in a factory and use polymorphism to implement behavior that depends on the switch value
* functions should have a s few parameters as possible - understandability suffers with each added parameter
* functions should not have side effects
* functions should not need a double-take to understand
* functions should avoid output parameters
* functions should separate commands from queries
* code is *refactored* into small functions - it's not *created* that way

## Conclusion
