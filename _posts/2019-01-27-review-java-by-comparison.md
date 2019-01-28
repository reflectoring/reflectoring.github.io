---
title: "Book Review: Java by Comparison"
categories: [java]
modified: 2019-01-28
last_modified_at: 2019-01-28
author: tom
tags: 
comments: true
ads: true
excerpt: "A review of the Book 'Java by Comparison' by Simon Harrer, Jörg Lenhard, and Linus Dietz."
sidebar:
  toc: true
---

{% include sidebar_right %}

## Overview

In a nutshell, *Java by Comparison* by Simon Harrer, Jörg Lenhard, and Linus Dietz
teaches best practices in the Java programming language. It's aimed at Java beginners
and intermediates. As the name suggest, the book compares code snippets that have 
room for improvement with revised versions that have certain best practices applied.

<div class="notice--success">
  This review is based upon version P1.0 of the book, which is from March 2018.
</div>

The book covers best practices on basic language 
features over usage of comments, naming things, exception handling and test assertions to
working with streams, among other things. 

Each chapter covers one comparison of code snippets. The starting code snippet
is displayed on one page and the revised edition on the next page, so both
are visible to the reader at the same time (at least in the print and pdf versions). 
The improvements are discussed in the text.

The last chapter deviates from this structure in that it explains aspects
of software development that are important for "real live" software projects
that cannot be explained alongside of code examples. These topics
include static code analysis, continuous integration, or logging.
        
## Likes

The book is very strictly structured with every chapter having the same rigid pattern
of a starting and revised code snippet and a discussion of what has been improved.
This appeals to my sense of symmetry.

The chapters are each very short, there is not a chapter that should take more
than about 5 minutes to read. I like short chapters very much, since that tends
to pull me through a book faster than long chapters would. 

I like the idea of direct comparison of code examples. In the print and PDF versions,
you can see both the original and the improved code examples at a glance, which
makes the changes much easier to grasp.

The best practices described in the book are directly applicable to every-day 
programming, so the contents will stick best if you read it while you
*are* programming every day.   

The last chapter about things like continuous integration, logging,
and static code analysis is very valuable for beginners. In my experience,
students fresh from college don't know anything about such things. 
Just knowing the basic ideas explained in this book should help them get along 
better in job interviews.

## Suggestions for Improvement

As I have no real "dislikes" about this book, I named this section 
"Suggestions for Improvement".

First, I missed mention of two basic tools I use in every-day Java development
for a couple years know. Why not mention [AssertJ](http://joel-costigliola.github.io/assertj/)
in the chapter about assertions 
in unit tests? It makes for so much more readable assertions. It might even deserve
its own chapter.

Second, in the chapter about static code analysis, I would have mentioned
[spotless](https://github.com/diffplug/spotless) alongside Google Java Format 
as a tool for enforcing the same code format in a team. This might be
my personal taste, though. 

In the chapter about combining state with behavior, I would have expected a mention
of DDD and rich domain models. Just as a pointer for further research, so that
the reader can connect the dots.

## My Key Takeaways

Having more than 10 years of Java experience under my belt, I really did not learn
very much from this book. As advertised, it's a book for beginners.

I did learn two things I was not aware of, though.

First, I learned that integer and long values in Java may contain underscores
to use as thousands separators, for instance. It's not discussed in a single word
but used in many of the code snippets.

Second, I was not aware of the chaining potential of `Optional`'s 
stream-like functional methods like `orElseThrow()` and `get()`. 

## Conclusion

The book did not contain a single best practice I did not agree with, so **I 
definitely recommend it to anyone starting off with Java**. If you have more than 
a couple years of practice with Java, though, you should not expect
to learn too much from this book.

As the authors themselves do in the preface of the book, 
**I explicitly suggest reading the PDF or print version and *not* the e-book 
version**. The e-Book version is no fun, since you cannot see more than one code
snippet at once and often have to scroll back-and-forth.
