---
authors: [tom]
title: "What is Upstream and Downstream in Software Development?"
categories: ["WIP", "Software Craft"]
date: 2018-09-27
excerpt: "Wondering about what upstream and downstream means in the context
          of software development? This articles discusses several
          usages of these words and defines two simple rules
          to identify what is upstream and what is downstream in
          every context."
image:  images/stock/0028-stream-1200x628-branded.jpg
url: upstream-downstream
---



In the recent past, I stumbled a few times over the definition of the words "upstream" and
"downstream" in various software development contexts. Each time, I had to look up what
it meant. Reason enough to write about it to make it stick.

## Upstream and Downstream in a Production Process

Let's start with a simple production process, even though it has nothing to with software
development, so we can build on that to define upstream and downstream in
software development.

{{% image alt="Upstream and Downstream Process Steps" src="images/posts/upstream-downstream/production.png" %}}

In the above example, we have three steps: 

1. collecting parts
1. assembling the parts
1. painting the assembly

A production process is very similar to a river, so it's easy to grasp that 
**as the process goes from one step to the next, we're moving downstream**.

We can deduct the following rules:
1. **Dependency Rule**: each item depends on all the items upstream from its viewpoint
1. **Value Rule**: moving downstream, each step adds more value to the product

Now, let's try to apply these rules to different software development contexts. 

## Upstream and Downstream Software Dependencies

Most software components have dependencies to other components. 
So what's an upstream dependency and a downstream dependency?

Consider this figure: 

{{% image alt="Upstream and Downstream Software Dependencies" src="images/posts/upstream-downstream/dependencies.png" %}}

Component C depends on component B which in turn depends on component A.

Applying the Dependency Rule, we can safely say that component A is upstream
from component B which is upstream from component C (even though the 
arrows point in the other direction).

Applying the Value Rule here is a little more abstract, but we can say that
component C holds the most value since it "imports" all the features of 
components B and A and adds its own value to those features, 
making it the downstream component.

## Upstream and Downstream Open Source Projects

Another context where the words "upstream" and "downstream" are used a lot is in
open source development. It's actually very similar to the component
dependencies discussed above.

Consider the projects A and B, where A is an original project and B is 
a fork of A:

{{% image alt="Upstream and Downstream Software Projects" src="images/posts/upstream-downstream/fork.png" %}}

This is a rather common development style in open source projects: we 
create a fork of a project, fix a bug or add a feature in that fork and then
submit a patch to the original project.

In this context, the Dependency Rule makes project A the upstream project since
it can very well live without project B but project B (the fork) wouldn't even exist
without project A (the original project).

The Value Rule applies as well: since project B adds a new feature or bugfix,
it has added value to the original project A.

So, each time we contribute a patch to an open source project we can say **that we
have sent a patch upstream**.  

## Upstream and Downstream (Micro-)Services

In systems consisting of microservices (or just plain old distributed services for the old-fashioned),
there's also talk about upstream and downstream services.

{{% image alt="Upstream and Downstream Distributed Services" src="images/posts/upstream-downstream/services.png" %}}

Unsurprisingly, both the Dependency Rules and the Value Rule also apply to this context.

Service B is the upstream service since service A depends on it. And service A is the downstream
service since it adds to the value of service B.

Note that **the "stream"** defining what is upstream and what is downstream in this case **is not the
stream of data coming into the system** through service A but rather **the stream of data from the
heart of the system down to the user-facing services**. 

The closer a service is to the user (or any other end-consumer), the farther downstream it is.

## Conclusion

In any context where the concept of "upstream" and "downstream" is used, we can apply 
two simple rules to find out which item is upstream or downstream of another. 

**If an item adds value to another or depends on it in any other way, it's most certainly downstream.** 

