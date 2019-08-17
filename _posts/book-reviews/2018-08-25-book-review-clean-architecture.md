---

title: "Book Review: Clean Architecture by Robert C. Martin"
categories: [book-reviews]
modified: 2018-08-25
excerpt: "A review of Robert C. Martin's book on 'Clean Architecture'. "
image: 0008-glasses
---



## TL;DR: Read this Book, when...

* you are interested in building maintainable software
* you need arguments to persuade your stakeholders to take some more time 
  for creating quality software 
* you want some inspiration on building applications in a different way than the
  default "3-layer architecture"

{% include affiliate-disclosure.html %}

## Overview

As the name suggests, <a href="//www.kqzyfj.com/click-9137796-13660345?url=https%3A//www.ebooks.com/cj.asp%3FIID%3D95862666%26fc%3DUS&cjsku=95862666" rel="nofollow">Clean Architecture - A Craftsman's Guide to Software Structure and Design</a> 
by Robert C. Martin ("Uncle Bob") takes a step back from the details of programming and discusses the bigger picture.

The "prequels" <a href="//www.jdoqocy.com/click-9137796-13660345?url=https%3A//www.ebooks.com/cj.asp%3FIID%3D726365%26fc%3DUS&cjsku=726365" rel="nofollow">Clean Code</a> and <a href="//www.jdoqocy.com/click-9137796-13660345?url=https%3A//www.ebooks.com/cj.asp%3FIID%3D726181%26fc%3DUS&cjsku=726181" rel="nofollow">The Clean Coder</a> have been must-reads for a
software engineer, so I expected a lot from this new book. 

The book has about 320 pages in 34 chapters, not counting the appendix. Few chapters are longer than 10 pages.

In my opinion, the book starts and ends weakly with a strong middle part.

Part I of the book gives a motivation of the topic by defining architecture as the means to facilitate the 
development, deployment, operation, and maintenance of a software and *not* as the means to make the software work.
**Thus, good architecture will minimize the lifetime cost of a software.**    

Parts II-IV cover the three programming paradigms (structured programming, functional programming,
and object-oriented programming) and a recap of the [SOLID principles](https://en.wikipedia.org/wiki/SOLID)
that Martin himself has introduced in one of his papers back when I was just graduating from school. Also, Martin discusses
some Component Principles around cohesion and coupling.

Part V is titled "Architecture" and brings the most value. 
The main topics of this part are boundaries and dependencies. 
Most of the chapters in this part discuss how to structure
your code in order to adhere to the SOLID principles and keep your software flexible.

Part VI discusses frameworks as mere details to the overall architecture and that it should be treated
as such by holding them at arm's length from your precious domain code.

Finally, in part VII, titled "Architecture Archaeology", Martin describes some of the software projects
he's been working on the last 45 years and the lessons he learned from them. I admit that I only read the
first couple pages. I found the pictures of room-filling computers with giant disk storage alongside a 
dry explanation of the software projects around those computers rather boring. 

To Martin's defense: this last part is in the appendix, so he probably expected people to skip it.
 
## My Key Takeaways

For me, often being in the role of a software architect, the book reminded me again of some architecture principles 
I hadn't consciously thought about in a while sparking some new ideas.
 
One key thing I'm taking away is the statement **that we should defer decisions on certain details
(like which database to use) to the latest possible moment**. 
This way, we don't have to consider these details in our every-day programming routine, saving time and money
in the long run.

I realized I'm doing this quite often, but not often enough and will do so much more consciously from now on.

The next thing I'm taking away is the dependency inversion principle. I've known it but reading again that
**we can point our dependencies in the direction we would like them to** will make me think again the next
time that I'm introducing some kind of dependency into my code. 

Coming with the dependency inversion is the plugin architecture or "Clean Architecture" Martin promotes. The domain code sits in
the center of the architecture, surrounded by details that implement plugins for the domain code. **All
dependencies point inward, against the control flow.** 

Another thing that provoked some thoughts is that **tests should be considered as part of
the system and should be just as easily maintainable**, otherwise they hinder the development just as
badly designed production code would. Thus, tests should not depend on volatile things like a GUI,
rather they should use an API specifically designed for tests.

Finally, my understanding of the word "firmware" broadened. I always thought of it as software embedded
on devices. It is that, but **Martin argues that the software we're writing every day also "degrades"
to firmware** (= software that's hard to change) if we don't take care of its architecture. 

## Dislikes

Though I liked the book and read through it about a chapter a day, there are some things I didn't like.

Martin describes a Clean Architecture and provides diagrams to highlight certain boundary-techniques. 
But I'm missing a hands-on, real-life example that applies this architecture. Chapter 33 attempts
to do that with a case study on a video sales application, but the example feels rather
artificial. 

What's more, in the case study chapter, he promotes boundaries between the layers of the application
without discussing functional boundaries (slices), which is a popular method to organize code. This also seems
to contradict his own "Screaming Architecture" metaphor from chapter 21, which says that an architecture
should "scream out" which use cases it supports.

"The Missing Chapter" (chapter 34) by Simon Brown has also disappointed me. It promises a solution
for using the package structure to promote the architecture that's different from the usual "package by layer"
and "package by feature" approaches. However, that solution amounts to "put everything that belongs together
into the same package". Yes, this allows us to use package-private visibility, but at the cost of 
code organization.

## Conclusion

In conclusion, **I recommend reading this book**. 

Especially software engineers that want to take a step
toward more senior development roles will find value in it. 

For more experienced software engineers, most of the content will not be new, but it will probably spark
some ideas for current and upcoming software projects, as it has for me. 
