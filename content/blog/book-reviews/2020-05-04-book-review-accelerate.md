---
authors: [tom]
title: "Book Notes: Accelerate"
categories: ["Book Notes"]
date: 2020-05-15 05:00:00 +1100
excerpt: "My notes on 'Accelerate' by Nicole Forsgren, Jez Humble, and Gene Kim - a book about research on the factors contribute to the performance in software development."
image: images/covers/accelerate-teaser.jpg
url: book-review-accelerate
---

## TL;DR: Read this Book, when...

* you want to know what makes software teams (and their companies) successful
* you need arguments for moving towards DevOps
* you are interested in the science behind a survey

## Book Facts

* **Title:** Accelerate
* **Authors:** Nicole Forsgren, Jez Humble, and Gene Kim
* **Word Count:** ~ 55.000 (3.5 hours at 250 words / minute)
* **Reading Ease:** medium
* **Writing Style:** sometimes dry discussion of survey results

## Overview

{% include book-link.html book="accelerate" %} explains the data from 4 years of surveys conducted for the yearly "State of DevOps Report".

The questions were designed to model certain "constructs" like "continuous delivery", "lean management", or "software delivery performance" and were evaluated to find the correlations between those constructs. 

A clustering algorithm identified low, medium, and high performers in software delivery.

The book is a data-driven discussion of which constructs lead to high-performing software development teams and a successful company overall.

The book is written in a sober, data-driven manner, making it a chore to read at some points. The key facts of the book are very clear, however, since the survey data leads to satisfyingly clear and easy-to-understand statements like "continuous delivery increases software development performance".

The authors also explain the survey methodology and science behind it. A little too much, in my opinion, because they kept explaining why this and that is indeed true based on the surveys instead of moving all the discussion about it to the end, where they dedicated some chapters to the survey methodology anyways. 
 
The content of the book is very clear and actionable, though.

## Notes

Here are my notes, as usual with some comments in *italics*.

### Summary: Practices that Improve Software Delivery Performance

* continuous delivery
* infrastructure-as-code
* test data management
* short-lived VCS branches
* loosely coupled architectures
* building internal tools with good UX
* continuous security
* limit WIP
* make work visible
* transformational leadership
* experimentation
* ... (*some others I didn't catch*)

### Accelerate

* "Maturity models focus on helping an organization arrive at a mature state and then declare themselves done with their journey." (*this makes a maturity model a "fixed mindset" tool, see my review of ["Mindset"](/book-review-mindset)*)
* instead of focusing on maturity, organizations should focus on their capabilities 

### Measuring Performance

* bad idea: rewarding dev teams for throughput and ops teams for stability - this  creates a **wall of confusion**: dev throws poor quality software over the wall and ops will implement a painful change management process to protect stability
* **lead time** is the time from committing source code into a VCS and the time the code is deployed to production
* **deployment frequency** is how often an organization delivers changes to production (this is the equivalent of **batch size** in production - the smaller the batch size, the higher the deployment frequency)
* **time to restore** is the time it takes to restore a service after an incident
* **change failure rate** is the percentage of production deployments that fail for some reason
* there is no tradeoff between moving fast and other performance metrics - **high performers improve all performance metrics**
* software delivery performance has an impact on organizational performance in general
* measure these metrics responsibly and without blame - otherwise, they may be misused to judge rather than to learn (*again, fixed mindset vs. growth mindset*)
* *when talking about **"performance"** below, it means being good in the metrics above*

### Measuring and Changing Culture

* continuous delivery has an impact on culture - it drives culture from "pathological" or "bureaucratic" to "generative" (*i.e. an open-minded, innovative, growth-mindset culture*)

### Technical Practices

* "Cease dependence on inspection to achieve quality. Eliminate the need for inspection on a mass basis by building quality into the product in the first place."
* give developers the time and resources to invest in the process and to fix problems
* continuous delivery helps to make work more sustainable
* continuous delivery reduces unplanned work due to higher quality code and less unforeseen fixes
* having infrastructure-as-code is highly correlated to software delivery performance
* having tests maintained by an outside party (i.e. a dedicated test team) is not correlated to performance
* having test data management in place is correlated to performance
* the shorter VCS branches live the better the performance

### Architecture

* loosely coupled architectures are correlated to performance
* working on outsourced software correlates negatively to performance
* having separately testable and deployable artifacts increases performance
* **"Inverse Conway maneuver"**: change your team structure to get a loosely coupled architecture
* a modular architecture allows to scale team size -> more deploys for each developer added
* internal tools with good UX increase performance
* "Architects should focus on engineers and outcomes, not tools or technologies"

### Integrating Infosec into the Delivery Lifecycle

* shifting left on security (i.e. doing it earlier in the project, or even better, doing it continuously) increases performance
* security teams should provide tools and training to developers instead of conducting security reviews

### Management Practices for Software

* limits to WIP (work-in-progress) make bottlenecks visible and can therefore lead to improvements in throughput
* a visual display of work, quality metrics, and productivity metrics improve performance and team culture
* a process requiring approval by a manager or board is worse than having no change process at all - do peer reviews instead

### Product Development

* lean product management (small batches, MVPs, regular customer feedback) improves performance , and vice versa (!) 

### Making Work Sustainable

* **"deployment pain"**: the fear and anxiety felt by developers when they deploy changes to production
* applying CI/CD reduces the deployment pain
* causes for deployment pain include the system being intolerant to configuration changes, manual changes, and handoffs between teems

### Employee Satisfaction, Identity, and Engagement

* we can measure employee satisfaction with the "net promoter score" by asking "how likely would you recommend this employer to a friend?" on a scale of 1-10
* net promoter score is the percentage of promoters (answered 9-10) minus the percentage of detractors (answered 0-6)
* continuous delivery increases employees' identity with the company
* "The best thing you can do for your products, your company, and your people is institute a culture of experimentation and learning, and invest in the technical and management capabilities that enable it."

### Leaders and Managers

* transformational leadership is leadership with a clear vision, giving inspiration, and supporting the employees
* transformational leadership increases performance
* DevOps can be driven bottom-up, but good leadership makes success more likely

### The Science Behind This Book

* the research in this book is quantitative and inferential (i.e. it infers things from a set of survey results)
* having a hypothesis helps avoid "fishing for data" and thus to avoid finding random correlations
* low, medium, and high performers were identified in the data by a clustering algorithm

### Introduction to Psychometrics

* create a construct of what you want to model
* write one survey question for each aspect of that construct
* the averages of all answers to a construct's questions provide a single score for the construct  

### Why Use a Survey

* we could instead get data from the systems we use (i.e. CI/CD tools, VCS tools, ...)
* the systems' metrics may not be complete! 
* people provide valuable data from outside of the systems
* a survey protects against "bad actors" (i.e. respondents who deliberately give false answers) because the majority answers truthfully

### The Data for the Project

* *a bunch of tables and numbers that I didn't find too interesting*

## Conclusion

The book provides valuable insights into what makes companies with a software development team successful. We can use this insight to measure our "DevOps metrics" (deployment frequency, lead time, mean time to restore, change failure rate). 

Knowing that increasing these metrics means increasing our software delivery performance will make it so much easier to decide on budget, staffing, and other important decisions in our company.