---
title: "Book Review: Java by Comparison"
categories: [book-review]
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
    - href: //www.kqzyfj.com/click-9137796-13660345?url=https%3A//www.ebooks.com/cj.asp%3FIID%3D96173656%26fc%3DUS&cjsku=96173656
      alt:  Java by Comparison
      img:  //i1.ebkimg.com/previews/096/096173/096173656/096173656-hq-168-80.jpg
---

{% include sidebar_right %}

## TL;DR: Read this Book, when...

* you are starting with Java and want some advice for producing quality code
* you are teaching Java and want your students to learn best practices
* you are working with junior developers and want them to get them up to speed

{% include affiliate-disclosure.html %}

## Overview

In a nutshell, <a href="//www.kqzyfj.com/click-9137796-13660345?url=https%3A//www.ebooks.com/cj.asp%3FIID%3D96173656%26fc%3DUS&cjsku=96173656" rel="nofollow">*Java by Comparison*</a> by Simon Harrer, Jörg Lenhard, and Linus Dietz
teaches best practices in the Java programming language. It's aimed at Java beginners
and intermediates. As the name suggest, the book compares code snippets that have 
room for improvement with revised versions that have certain best practices applied.

Among other things, the book covers best practices on 

* basic language features,
* usage of comments,
* naming things,
* exception handling,
* test assertions, and
* working with streams. 

Each chapter covers one comparison of code snippets. The starting code snippet
is displayed on one page and the revised edition on the next page, so both
are visible to the reader at the same time (at least in the print and pdf versions). 
The improvements between the starting code and the revised code 
are discussed in the text.

The last chapter deviates from this structure in that it explains aspects
of software development that are important for "real live" software projects
that cannot be explained alongside of code examples. Among others, these topics
include 

* static code analysis,
* continuous integration, and
* logging.
        
## Likes

The book is very strictly structured with every chapter having the same rigid pattern
of an initial code snippet and a revised version of this code snippet along with a 
discussion of what has been improved.
This appeals to my nerd's sense of symmetry.

The chapters are each very short. There is no chapter that should take more
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

I missed mention of two basic tools I have used in every-day Java development
for a couple of years know. 

The first is [AssertJ](http://joel-costigliola.github.io/assertj/),
which is the de-facto standard library to create highly readable
assertions.
The chapter about assertions discusses the JUnit framework, but does not mention
AssertJ. I think AssertJ might even have deserved its own chapter, comparing
unreadable assertions with beautiful AssertJ assertions.

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
to Java, <a href="http://www.kqzyfj.com/click-9137796-13660345?url=https%3A//www.ebooks.com/cj.asp%3FIID%3D96173656%26fc%3DUS&cjsku=96173656" rel="nofollow">*Java by Comparison*</a>
is definitely worth its money.

As the authors themselves do in the preface of the book, 
**I explicitly suggest reading the PDF or print version and *not* the eBook 
version**. The eBook version is no fun since you cannot see more than one code
snippet at a time and often have to scroll back-and-forth.
