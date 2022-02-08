---
authors: [tom]
title: "Book Review: Shape Up"
categories: ["Book Notes"]
date: 2019-09-11
description: "A review of the online Book 'Shape Up' by Ryan Singer, describing the set of techniques Basecamp uses to develop software."
image: images/covers/shape-up.png
url: book-review-shape-up
---

## TL;DR: Read this Book, when...

* you want to know how Basecamp builds software with bets instead of estimation
* you are interested in an agile process beyond Scrum & Co.
* you want inspiration on how to "shape" work before it can be implemented by programmers and designers

## Overview

In his book "Shape Up", Ryan Singer describes the workflow and set of techniques Basecamp has developed over the years to build their project management and collaboration software with the same name. 

"Shape Up" covers the process from "shaping" raw ideas into low-risk, time-boxed projects to finally implementing the solution in small teams within 6-week cycles. It also discusses how to fight scope creep and monitor progress during a cycle. 

While the term "agile" is not mentioned in a single word throughout the text, I consider this workflow to be a welcome opinion on agile that goes beyond Scrum & Co. and provides a sustainable way of building software. 

The book is [available online](https://basecamp.com/shapeup) for free, to be read in a browser, or to be downloaded as a PDF.

## Likes ~~and Dislikes~~

As a software engineer, I welcome the fact that the book has been programmed rather than written. It's nicely formatted for screen reading and keeps a bookmark where you have left off.

If you have done a couple of years of software development, you can relate very well to the problems of requirements engineering, estimation, and getting things done, for which "Shape Up" offers opinionated but logical solutions.

I like that "Shape Up" uses a set of very rich analogies like "shaping" instead of "requirements engineering", "appetite" instead of "allowed time frame", or "betting on pitches" instead of "planning projects". This makes it so much more interesting and easier to grasp.

The text is accompanied by hand-drawn figures which do a great job of explaining the concepts. 

## Key Takeaways

Here are my notes from reading the book, along with a map of some of the keywords that I have assembled while reading ....

![Keywords of "Shape Up"](images/covers/teasers/shape-up-1200x628.png)

### Introduction

* first focus on your ability to ship, then on shipping the right thing
* in a nutshell, Shape Up is to first shape a project, then bet on that it can be finished by a small, self-dependent team within six weeks

### Principles of Shaping

* wireframes are to concrete to shape work - they allow no creativity 
* words are too abstract to shape work - they don't describe well enough what should be built
* unshaped work is risky and unknown
* shaped work is rough, solved, and bounded
* shaping cannot be scheduled - keep it on a separate track from building so as not to let it delay the whole process
* shaping is done privately to give shapers the option to shelve things and get them back out later

### Set Boundaries

* shaping is influenced by an "appetite" defining how much time we're willing to spend on a certain set of features 
* an appetite starts with a number and ends with a design - opposite from an estimate
* part of shaping is to set a time boundary on the work done by a small team of 1 designer and 1-2 programmers
* a small batch means a project can be finished by a team in 2 weeks
* a big batch means a project can be finished by a team in 6 weeks
* the timebox forces the team to constantly make decisions to meet the appetite

### Find the Elements

* breadboarding is a technique used in electrical engineering to do the wiring without a chassis
* breadboarding can be used in software development by sketching places (web pages) and affordances (buttons etc.) and connecting them to mark transitions
* fat marker sketches can be used for visual problems as they make it impossible to add too much detail
* both shaping techniques avoid to add a bias to the shaped work and give room to the designers and programmers who will implement it

### Risks and Rabbit Holes

* go through a use case in slow motion to find holes in the shaping
* explicitly mark features as "out of bounds" if they threaten the appetite
* invite a technical expert to find any time bombs in the shaped work

### Write the Pitch

* the goal of a pitch is to present it to deciders who may bet upon it
* include the problem, the appetite (time frame), the solution, rabbit holes, and no-gos
* the problem makes it possible to evaluate the solution
* the appetite prevents discussion about out-of-scope solutions
* the solution can be presented with sketches or breadboards

### Bets, not Backlogs

* backlogs encourage constant reviewing, grooming, and organizing - you feel like you're behind all the time
* pitches are brought up by different people in different departments - everyone tracks the pitches they have interest in themselves
* there is no central backlog - important ideas will come back

### Bet Six Weeks

* the common two-week sprint is too short for the overhead it brings
* a six-week cycle is the result of Basecamp experimenting over the years
* there's a two-week "cooldown" phase after each cycle in which developers are free to follow up on work they're invested in
* teams change from cycle to cycle and consist of a designer, 1-2 programmers, and a tester
* the "betting table" is a conference call with the highest stakeholders to decide which pitches make it into the next cycle
* the highest stakeholders must place the bets so that there is no higher authority to veto the bets and waste time and effort in the process
* there are no interruptions during a cycle - if something comes up, it can usually wait until the next cycle
* the "circuit breaker" rule says that projects do not get an extension if they are not finished within the cycle 
* only one cycle is planned - a clean slate after each cycle avoids debts to carry around

### Hand Over Responsibility

* teams are assigned projects by the betting table
* teams need full autonomy to keep the big picture in mind and take responsibility for the whole thing
* a project is only done when it's deployed
* the first days of a cycle can be silent - the teams need to orient themselves

### Get One Piece Done

* make progress in vertical slices rather than horizontal layers - have something to show and try out early
* it doesn't have to be all or nothing - a simple UI may be enough to enable some backend work and vice versa
* prioritize work by their size (small things first) and their novelty (novel things first to reduce risks)

### Map the Scopes

* a "scope" is a vertical slice of a project - organized by feature and not by person or skill
* scopes provide a language to talk about the project where tasks are too granular
* scope mapping (grouping tasks into scopes) is done continuously during the project and not up-front - you cannot know the interdependencies in advance

### Show Progress

* work is like a hill: while going uphill you're not certain on unknowns yet; when finally going downhill you know what to do
* tasks can be visualized on a hill chart
* push the riskiest task uphill first
* push multiple tasks over the top of the hill before doing all the downhill work to reduce overall risks

### Decide When to Stop

* we have to live with the fact that shipping on time means shipping something imperfect
* compare the currently finished work to the baseline (what the user currently can do with the software) to decide when to stop
* don't compare the currently finished work to an ideal
* "scope grows like grass" - so the teams need to have the authority to cut the grass

### Move On

* don't commit to feature requests before they have been shaped  

## Conclusion

I believe Basecamp when they say they're using the "Shape Up" way of doing things successfully to create their software. After all, they have spent years tuning their process to come up with this. 

I also believe that - with some experimentation on parameters like cycle duration - "Shape Up" can be applied to other software development environments. Management must be 100% in on it, which is the main reason for process change to fail, I'm afraid. 

Even if you don't want to change your process you'll get some inspiration and some helpful tools out of the book - like using breadboarding for sketching user interactions or hill charts for monitoring progress.

In conclusion, this is a clear reading recommendation for anyone working in software development, and perhaps especially those who are currently struggling to adapt to an agile method.

