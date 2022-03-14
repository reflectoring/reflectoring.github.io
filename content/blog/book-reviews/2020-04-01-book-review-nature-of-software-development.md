---
authors: [tom]
title: "Book Notes: The Nature of Software Development"
categories: ["Book Notes"]
date: 2020-04-01T05:00:00
description: "My notes on 'The Nature of Software Development' by Ron Jeffries - a book about the 'natural way' of building software."
image: images/covers/nature-of-software-development-teaser.jpg
url: book-review-nature-of-software-development
---

## TL;DR: Read this Book, when...

* you're a manager, you don't know much about software development and want to learn about agile software development
* you haven't worked in an agile manner before and want to know the key methods
* you *have* worked in an agile manner before and want some re-affirmation that you're doing the right thing

## Book Facts

* **Title:** The Nature of Software Development
* **Author:** Ron Jeffries
* **Word Count:** ~ 20.000 (1.5 hours at 250 words / minute)
* **Reading Ease:** easy
* **Writing Style:** "grandfatherly advice" (i.e. telling how it's done it without going into too much detail)  

## Overview

{% include book-link.html book="nature-of-software-development" %} by Ron Jeffries is an opinionated piece about agile software development. Jeffries, as one of the founders of the Agile Manifesto, sees Agile as the "natural way" of creating software - the way with the least resistance towards getting good results.

The book is very short. It's even shorter than the 150 pages suggest, as many pages contain a doodle visualizing the current topic. Even then, many pages have a lot of white space, so don't expect an epic tale.

Instead, the book goes over all important topics of managing software development on a very(!) high level. You won't get very specific advice on how to develop software, but you'll get advice that might help high-level managers to appreciate the benefits of agile software development.

While I agree that Agile is a "natural" way of software development I miss some real-life tales that prove what Jeffries is stating in the book. The book is full of generic statements like "The nature of the work requires us to test and refactor" without going deep into the why and how of it. 

## Notes

Here are my notes, as usual with some comments in *italics*.

### Value
* software development must be driven by value
* value is only delivered by shipping features
* prioritize cheap features with high value

### Feature by Feature
* activity-based planning is "all-or-nothing" - it's hard to change things in later phases
* instead, deliver feature by feature
  * earlier results
  * more information to steer the project
  * more flexible to changing requirements
  
### Feature Teams
* organize teams so that a feature doesn't have to be handed over between teams (*I would add that teams should have clear code ownership of software components wherever possible and should only share code ownership of components if not otherwise possible*)
* create cross-team communities of practice to share expertise in certain disciplines

### Planning
* identify high-value features and plan them - defer low-value features
* set a time and money budget instead of a feature scope
* do the important stuff first
* the team works in intervals, taking as much work into each interval as they think they can do
* estimation is risky - we spend time trying to improve estimations and compare them to other estimates
* "Pressure is destructive. Avoid it."
* "Estimates are likely to be wrong, and they focus our attention on the cost of things rather than on value."

### Building
* it's critical to have a product vision and to refine it continuously - otherwise, we'll have a bad return on investment
* "done" must actually mean "done" so we can be transparent with our progress and build trust with our stakeholders
* be nearly bug-free at the end of each iteration to avoid a never-ending test phase at the end of the project

### Features and Foundation in Parallel
* "Everything we build must rest on a solid foundation" - Architecture, Design, Infrastructure
* build minimal versions of many features instead of full versions of few features to get feedback quickly
* build as much foundation as necessary  

### Bug-free and Well Designed
* prioritize fixing of defects because they reduce certainty and plannability
* have extensive test coverage to save time fixing bugs and building new features
* "Good designs go bad one decision at a time."
* "The nature of the work requires us to test and refactor."

### Value
* the definition of value is different in every project context and is not only monetary
* measuring value on a numerical scale is most often not accurate because we're only estimating
* instead, compare features and decide which one is more valuable in relation to other features - do that one first

### Teams
* the role "Product Owner" implies that a team doesn't own the software - a more fitting name would be "Product Champion"  
* let the team autonomously decide how to solve problems, but make sure they know the right problems to solve
* have the team show the software after each iteration
* an iterative process allows us to learn

### Management
* to work "the natural way" we need a commitment from the upper management
* managing "the natural way" is less about directing and more about staffing and budgeting decisions
* delegate instead of doing it yourself
* the job is not to manage according to a plan but to steer towards the best possible solution

### Whip the Ponies Harder
* "Under pressure, teams give up the wrong things."
* bad test coverage, bad code, and bugs will come from increased pressure
* we have to be able to say "no" to new features, otherwise, we're only order takers and not decision-makers
* instead of putting pressure on the team analyze the sources of delay

### To Speed Up, Build with Skill
* if the team says they can't deliver an increment in two weeks, give them one week instead to quickly uncover the problems
* be experts in Test-Driven Development and Acceptance Test-Driven Development to avoid bugs that destroy any planning

### Refactoring
* inherent difficulty comes from the problem to solve and can't be reduced
* accidental difficulty comes from a suboptimal solution
* we need refactoring to reduce accidental difficulty
* no refactoring leads to erratic progress leads to slower progress
* campground rule: leave the code a little cleaner than you found it

### Agile Methods
* don't let the agile framework control you 
* it should have room for unplanned interaction

### Scaling Agile
* "Scaling Agile is good business for scaling vendors. It's not necessarily good advice for you."
* before scaling, prove that you have more product ideas than a single can build
* start with a single team and add feature teams if necessary
* break the codebase into pieces among the feature teams

## Conclusion

As a software developer that has done agile projects, you won't get much out of this book for yourself. But you might learn some arguments for agile practices that you can use to defend your software development style against un-agile managers.  
