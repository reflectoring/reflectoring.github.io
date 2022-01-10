---
title: "Start Clean!"
categories: ["Simplify!"]
date: 2021-06-21T09:00:00
modified: 2021-06-21T09:00:00
authors: [tom]
excerpt: "Start clean to battle technical debt from the start and have a good conscience."
image:  images/stock/0103-blank-1200x628-branded.jpg
url: start-clean
---

As software developers, we're painfully aware of technical debt.

Usually, we curse our predecessors for taking shortcuts, making wrong decisions, and for *just not working professionally in general*.

That's unfair, of course. Whoever wrote a piece of code that is technical debt in our eyes had to work with the knowledge and in the constraints of the time when they wrote that code. There probably were time constraints and technical constraints (among other constraints) that we have collectively forgotten about today.

But still, when we get the chance to start a new codebase or a new module within a codebase, we say to ourselves that we're going to do it better. We're going to build something that our successors will praise us for. We even proudly put our name in the header of the source files!

But then the constraints hit us. People start asking us when it's done. The API we're using turns out to suck and we need to build workarounds.

That's life. We can't control everything. **But that's not a reason to give up on the things that we *can* control**.

When we start something new, we have a responsibility to make things as good as we can, within the constraints that we can't control. **If we skimp on the things that we can control, our successors are right to accuse us of being unprofessional**.

Here are some things that we can usually control when starting a new project.

## Document Decisions

With every decision, think about whether this decision is an important information for the developer you're going to hand over to at some point. Does it provide context? Does it explain something that would otherwise surprise a new developer? If in doubt, document the decision.

## Explain the high-level architecture

There are few things as frustrating as sitting in front of an unfamiliar codebase and not having a clue what the code is about. This is very easily fixed by providing a high-level architecture overview in a README file. A simple boxes and arrows diagram does wonders for understanding! And it doesn't have to be very detailed, so it's easy to keep up-to-date!

## Structure the code into modules

When you're starting a fresh codebase, even if it's just a few sourcecode files, yet, split the code into modules or packages. This will make your life easier to understand the code and it will make it so much easier for the next person to understand it. Having clear modules from the start will make it easier to draw a high-level architecture diagram, making it even easier to understand for newcomers.

## Leave a README in the code repository
As mentioned above, a README can contain a high-level architecture diagram. But it can also contain instructions how to set up the local developer environment and any tips and tricks on how to deal with the codebase. Open source projects usually do a good job of providing a README because many people without much context are working on the code. Why should a README be exclusive to open source? It will help just as much (or even more) in internal codebases where people are working on the code every day.
  
## Polish the code

Once you're done with the initial design of a new codebase, make a polishing pass over it. Now is the time that you still have the context of project and you can make improvements. There will never be a better time to do this. If you don't do this, you will open up the codebase to instant pollution because other developers will add code in the same style as the code that is there already. Every line of code we're creating is legacy code for the next developer. Take the time and review your own code after a day or two and ask yourself what you would want the code to look like if you had to work on it a year from now.

## Good Conscience
Doing these things, chances are that your successors will still curse you for the things that you didn't have control over, but at least you can sleep at night, knowing you did everything within your control to make things as good as they can be.
