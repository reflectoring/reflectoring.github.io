---
authors: [tom]
title: "Book Review: Your Code as a Crime Scene"
categories: ["Book Notes"]
date: 2019-02-17
excerpt: "A review of the Book 'Your Code as a Crime Scene' by Adam Tornhill."
image: images/stock/0014-handcuffs-1200x628-branded.jpg
url: book-review-your-code-as-a-crime-scene
---

## TL;DR: Read this Book, when...

* you are interested in metrics by which to evaluate a codebase or even organizational
  behavior of a development team
* you want to know how to gather those metrics
* you have a certain codebase that you want to analyze

## Overview

<a href="https://www.kqzyfj.com/click-9137796-13660345?url=https%3A//www.ebooks.com/cj.asp%3FIID%3D95960873%26fc%3DUS&cjsku=95960873" rel="nofollow">*Your Code as a Crime Scene*</a> by Adam Tornhill 
is a book 
that aims to apply 
criminal investigation techniques to a codebase in order to gain insights about the structure and 
quality of the code. 

Tornhill has created a [command-line tool](https://github.com/adamtornhill/code-maat)
that allows to create certain reports from a Git repository. He uses this tool 
to create visualizations of patterns in a code base. Every step can be reproduced
by the reader, if he or she wishes.

The book not only explains the visualized metrics but also goes into detail about
how they can be interpreted. 

## Likes

The book describes a wealth of interesting code metrics and techniques to
visualize those metrics in a way that allows to get the most out of them.

What's different from other books about code metrics is that all metrics explained 
in the book are extracted from a Git repository,
which has a lot more information that just the code itself.

In summary, I found the metrics explained in the book very interesting.

The book is written in a very conversational style, making it easy to read.
It has rather short chapters with a lot of helpful visualizations, making it possible to read a 
chapter in a short amount of time. 

If you want to execute the code examples on your own machine
to create the visualizations yourself, you need a bit more time, though (I actually didn't do it).

## Key Takeaways

The book starts with finding **finding hotspots of a certain metric** (like complexity, for 
instance)
and visualizing them in a 3-dimensional city map in order to get a sense of
the metric's distribution within your code base. Ironically, this is exactly what
a student of me [did in his bachelor's thesis](https://github.com/pschild/CodeRadarVisualization)
based on [coderadar](https://github.com/reflectoring/coderadar), 
a tool I've started (but never completed) a couple years ago.

The book then describes how to extract data from a Git repository to create 
line diagrams that show the **trend of a metric over time**.

An interesting concept is the metric of **temporal coupling**, i.e. how often certain
parts of the code are modified together. This can be used to find unintended
couplings in the codebase.

Simple, but still interesting, was the use of **a word cloud of commit messages**
to get a sense of what's happening in the codebase. 

In the last part, the book goes into organizational metrics like **the number of authors
on a certain part of the code within a certain time frame**. Assuming that a high
number of authors means a high probability of defects, this metric can point out
spots in the code that deserve attention.

Later, the book also introduces the similar concept of **code churn**, meaning **the degree of
change of a certain part of the code**. The more lines are added or deleted in a certain
file, the higher its code churn. 

A Git repository also provides information about the knowledge distribution within
a team. The books explains how to create a **knowledge distribution map** of a codebase,
showing which authors know about which parts of the code. What's even more interesting
is to visualize **knowledge loss**, i.e. which parts of the code have not been
touched by an active developer within a certain time frame.

## Dislikes

The only thing I didn't really like about the book was that the analogies between
criminal investigation and code analysis seemed a little far-fetched to me in many places. 
Here and there, Tornhill writes a couple of pages about criminal psychology and
investigation techniques that, in my opinion, don't have that much to do with 
the code metrics he discussed afterwards. 

For me, the gems within the book are the code metrics, not the connection to
criminal investigation. But I don't like crime shows in TV much, either... . 
       
## Conclusion

<a href="https://www.kqzyfj.com/click-9137796-13660345?url=https%3A//www.ebooks.com/cj.asp%3FIID%3D95960873%26fc%3DUS&cjsku=95960873" rel="nofollow">*Your Code as a Crime Scene*</a> introduces very interesting code metrics, so if
you're interested in measuring or visualizing code, this book is definitely
worth to spend your time on.

The book is very hands-on in that it provides step-by-step examples you can
follow to create visualizations of your own codebase, so it's even more
worthwhile if you want to actively analyze a certain codebase. 
