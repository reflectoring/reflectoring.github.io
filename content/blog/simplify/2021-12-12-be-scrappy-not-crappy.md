---
title: "Be Scrappy, Not Crappy"
categories: ["Simplify!"]
date: 2021-12-12 09:00:00 +1100
modified: 2021-12-12 09:00:00 +1100
authors: [tom]
excerpt: "Don't use 'being scrappy' as an excuse to writing crappy code."
image:  images/stock/0114-scrap-1200x628-branded.jpg
url: be-scrappy-not-crappy
---

It's not so long ago that I learned the term "scrappy". Someone was looking to build a "scrappy" team of software engineers to build the next big thing, and build it fast.

Not being an English native speaker, I had to look up the word "scrappy" and was confronted with two definitions:

1. "consisting of disorganized, untidy, or incomplete parts."
2. "determined, argumentative, or pugnacious"

Why would anyone want to be part of a scrappy team? I don't enjoy working in a disorganized team and even less in a team with argumentative people. Do you?

## False Scrappiness

The intended definition of "scrappy", of course, was to describe the spirit of iterating quickly and only doing the necessary to get to product-market fit and make the product successful.

And those are good and valid agile principles to build upon.

I feel, however, that terms like "scrappy", "iterating quickly", or even "agile" are more often than not an excuse for writing crappy code.

In reality, it often means that the team skips engineering best practices to get ahead faster:

* we don't write abstractions because it costs time. 
* we don't write tests because the code evolves so fast that it's not worth the time. 
* we drop junior developers into the cold water to develop important code without enough guidance, because it's going to be rewritten by "real developers" later, anyway.

It's all about saving time. And it's all false assumptions.

**With a small investment of time now, we can avoid an enormous investment of time later**, be it to clean up the mess we made or to live with the mess (which usually costs more time than cleaning it up).

Here are a couple of things you can do to avoid false scrappiness.

## Start Clean

When starting a new project or codebase, [start clean](/start-clean). Set the expectations toward the new codebase. Establish the rules of engagement with the codebase. Write about the decisions you made. 

Let everyone know that this code is worth caring about because that means that working on the code will be faster and less error-prone (your managers will love that argument).

## Manage the Architecture

Before starting to code, think about the architecture. It doesn't matter if it's a small codebase. Every codebase has some structure. The question is whether this structure is hidden in heaps of code without abstractions or visible in plain sight to help the next developer working on the next feature. 

What components will the codebase have? How do they communicate? A simple boxes-and-arrows diagram goes a long way. 

Once the code has been written, write tests that assert that the dependencies between those components go in the right direction (you can get some inspiration from [this article about clean boundaries](/java-components-clean-boundaries)). Avoiding unwanted dependencies is like vaccinating your codebase against sprawl.

## Pair Up

Pair up with different developers to spread the vision of the codebase. Documenting architecture is one thing. But sitting next to someone with a vision while coding is quite a bit more impactful. 

Pairing up will avoid long code review cycles and establish a common understanding of the codebase at the same time. Especially junior developers benefit from pairing, of course, but even experienced developers will learn a thing or two. 

In any case, after a few pairing sessions, the team will have a shared vision and can communicate better because of their common understanding.

## Be Proactive
Friends don't let friends write crappy code. 

If you see something that's not to your standard, show how it can be done better. Don't be pedantic about it, however. Don't block people's code because of minor style issues. Do block people's code because of major architecture issues. 

In any case, speak up if something doesn't feel right.

## Don't Wait for Later
We can prevent a big investment of time to clean up messy code LATER by investing just a little time NOW. Sadly, it seems like we humans are blind to the future, as is evident in the way we handle climate change and even the current epidemic.

Be scrappy, but responsibly so.