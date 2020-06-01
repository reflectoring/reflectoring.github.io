---
title: "Developer Habits: Take Code Reviews Seriously"
categories: [craft]
date: 2020-05-19 05:00:00 +1000
modified: 2020-05-19 05:00:00 +1000
author: default
excerpt: "TODO"
image:
  auto: 0061-cloud
---

I've thought about habits a lot lately and have come up with a list of habits that I find very valuable in my every-day software developer life. To think more deeply about them and improve my follow-through in these habits, I'm writing about them in this series.

First up is the habit of taking code reviews seriously. How often do we just skim a code review because we don't seem to have time or because we're just too lazy to really understand the code that has been changed? How often do we submit code to a review just because it's expected of us, without putting any effort in helping the reviewers to understand it? 

Let's see why taking code reviews seriously is beneficial for both the reviewee and the reviewer. 

## Why Are We Doing Code Reviews in the First Place?

Code reviews often perceived as a quality gate. The more people look over a piece of code, the more issues with the code will be flushed out.

While it's true that code reviews can (and should) improve the quality of the inspected code, I think that code reviews are more valuable from a learning perspective. The reviewee will learn from the feedback of the reviewer and the reviewer will learn from the reviewee's patterns and coding style as well as learn about the context they are working on.

Code reviews should be about learning first. Quality automatically comes with learning.

## What About Pair and Mob Programming?

Pair programming and, more recently, mob programming, are practices where two or more people work together on a piece of code. Not just for a brief period, to solve a concrete problem together, but as the default mode of working on code. How do these practices relate to code reviews?

When the goal of code reviews is learning, the value of code reviews is reduced with each person that participates in creating the code. The learning has already taken place while programming together. 

If pair or mob programming works in our working environment, we don't need code reviews. But not every team is working in this style. The prime example is open source development, which is highly asynchronous in nature. A (potentially unknown) contributor works on a piece of code and submits a pull request. A maintainer reviews the pull request and gives feedback. The contributor acts on the feedback, and so on.

Many teams have chosen a similar asynchronous style for their work, with all the pros and cons that entails. And for exactly these teams, it's important to take code reviews seriously to get the most from them.

## Reviewee

Let's start with looking at some of the things the reviewee, i.e. the person that submits some code to a review, should do to make the most of code reviews.

### Only ask for a review when it's ready

* wastes reviewers time if it's not ready
* build is green
* no one likes to review code with a red build, because it means it's not finished and they would have to review again
* if you have questions about how to do something, they can be asked in reviews, but don't expect a quick answer, I prefer discussing questions in person (Slack, Zoom, or in pair programming)
* there is an inherent danger for pull requests to get dragged over many days if they are used as a platform for discussions
 

### Add comments to give context to your own PR
* go through the code with the eyes of a reviewer 
* add comments to any place that might need some context for the reviewer (the prime directive is learning, and these comments will help the reviewer to learn about what you did and why)
* don't write anything in review comments that can be written in code comments
* don't write anything in code comments that can be expressed in code
* going through the code like that will help getting the comments on the right level
* to check if

### Actively Ask for a review (Andon Cord)

### Ask to pair up
* To avoid discussions on the PR

## Reviewer 

### Check out the code

### Answer all comments

### Only give a review when it's ready
 
### Point out Nitpicks Sparingly
* beware: reviewee may feel they have to act on them!


### Point out what you like

### Be clear about when you can do the review