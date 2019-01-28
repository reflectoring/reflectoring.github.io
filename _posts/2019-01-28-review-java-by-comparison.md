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
  books:
    - href: //geni.us/java-by-comparison
      alt:  Java by Comparison
      img:  //ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=US&ASIN=1680502875&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_&tag=reflectoring-20
---

{% include sidebar_right %}

## Overview

In a nutshell, <a href="http://geni.us/java-by-comparison" rel="nofollow">*Java by Comparison*</a> by Simon Harrer, Jörg Lenhard, and Linus Dietz
teaches best practices in the Java programming language. It's aimed at Java beginners
and intermediates. As the name suggest, the book compares code snippets that have 
room for improvement with revised versions that have certain best practices applied.

<div class="notice--success">
  <strong>Disclaimer:</strong> This page contains affiliate links to books on Amazon. 
  If this review helped you, consider buying a book by following one of these links. Thanks! :)
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
of an initial code snippet and a revised code version of this snippet along with a 
discussion of what has been improved.
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

I missed mention of two basic tools I use in every-day Java development
for a couple years know. The first is [AssertJ](http://joel-costigliola.github.io/assertj/).
In the chapter about assertions JUnit is discussed but AssertJ is the library for 
programming readable assertions? Why not mention it? It might even deserve
its own chapter.

Second, in the chapter about static code analysis, I would have mentioned
[spotless](https://github.com/diffplug/spotless) alongside Google Java Format 
as a tool for enforcing the same code format in a team. It's more flexible in that
it does not restrict you to the Google Code Format, but this might just be
my personal taste, since there is a point in not having much freedom
in code style. 

In the chapter about combining state with behavior, I would have expected a mention
of DDD and rich domain models. Just as a pointer for further research, so that
the reader can connect the dots.

## My Key Takeaways

Having more than 10 years of Java experience under my belt, I really did not learn
very much from this book. As advertised, it's a book for beginners. I would have
profited greatly from the book, however, had it been available 8-10 years ago. 

I did learn two things I was not aware of, though.

First, I learned that integer and long values in Java may contain underscores
to use as thousands separators, for instance (i.e. `1_000_000`). It's not discussed in a single word
in the book but used in enough of the code snippets to have made me google it.

Second, I was not aware of the chaining potential of `Optional`'s 
stream-like functional methods like `orElseThrow()` and `get()`. This had a welcome
impact in my programming style. 

## Conclusion

The book did not contain a single best practice I did not agree with, so **I 
definitely recommend it to anyone starting off with Java**. If you have more than 
a couple years of practice with Java, though, you should not expect
to learn too much from this book.

If you are a college student learning Java or a seasoned programmer switching
to Java, <a href="http://geni.us/java-by-comparison" rel="nofollow">*Java by Comparison*</a>
is definitely worth its money.

As the authors themselves do in the preface of the book, 
**I explicitly suggest reading the PDF or print version and *not* the e-book 
version**. The e-Book version is no fun since you cannot see more than one code
snippet at a time and often have to scroll back-and-forth.
