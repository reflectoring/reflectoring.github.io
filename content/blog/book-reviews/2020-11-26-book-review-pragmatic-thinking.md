---
authors: [tom]
title: "Book Notes: Pragmatic Thinking & Learning"
categories: ["Book Notes"]
date: 2020-11-26T05:00:00
excerpt: "My notes on 'Pragmatic Thinking & Learning' by Andy Hunt - a book about understanding our brain and making the most of it."
image: images/covers/pragmatic-thinking-teaser.jpg
url: book-review-pragmatic-thinking
---

## TL;DR: Read this Book, when...

* you want to become a more structured learner
* you need some tips and tricks on tapping your creativity
* you want to become more self-aware of your proficiency

## Book Facts

* **Title:** Pragmatic Thinking & Learning
* **Authors:** Andy Hunt
* **Word Count:** ~ 80.000 (5.5 hours at 250 words / minute)
* **Reading Ease:** easy
* **Writing Style:** conversational, rather long chapters, practical 

## Overview

{% include book-link.html book="pragmatic-thinking" %} is all about our brain and how we can make the most of it. Andy Hunt often relates to computer programming in the book, so it's best read as a software developer.

The book provides guidance on how to tap our creativity, how to focus, and how to learn deliberately and successfully.

I've been applying some of the methods described in this book before even reading it, so it's great to have them confirmed by the book. 


## Notes

Here are my notes, as usual with some comments in *italics*.

### Introduction

* "We tend to make programming much harder on ourselves than we need."

### Journey from Novice to Expert

* the Dreyfus Model of Proficiency categorizes learners into five categories:
  * Novice
    * needs rules to follow to produce results
    * is not necessarily inclined to learn
    * cannot always succeed because not everything can be put into rules
  * Advanced Beginner
    * can work on some tasks on their own
    * doesn't have the big picture, yet
    * has problems with troubleshooting
  * Competent
    * exercises deliberate planning
    * solves new problems
  * Proficient
    * able to self-improve
    * learns from others' experience
    * understands and applies maxims
  * Expert
    * relies on their intuition
    * fails if you impose rules on them
    * needs to have access to the big picture
* "The only path to a more correct self-assessment is to improve the individual's skill level."  
* it takes 10 years of deliberate practice to become an expert

### This Is Your Brain

* the brain has two modes
  * R-mode (rich mode): a rich, intuitive, non-verbal, unconscious, and largely uncontrollable mode that operates in the background (*this is what Kahneman calls "system 1" in his book "Thinking, Fast and Slow"*)
  * L-mode (linear mode): a linear, step-by-step, verbal, conscious mode of thinking (*this is what Kahneman calls "system 2"*)
* since the R-mode is uncontrollable and generates ideas at inconvenient times, always take something to write with you
* we learn better by synthesis (building things, involves R-mode) than by analysis (only involves L-mode) - *this is so true for us as developers! I learn best when "playing around" with a new technology*
* positive emotions make you more creative
* negative emotions hurt creativity
* good design fosters positive emotions and thus creativity (*my takeaway: we should always take the time for well-designed software!*) 

### Get In Your Right Mind

* involve multiple senses to enrich creativity
* let the R-mode lead and follow up with L-mode
* in writing text or code: create an ugly first draft drawing on R-mode and then go over it again with L-mode
* pair programming is effective because the driver is in verbal L-mode, explaining what they're doing, while the navigator is free to draw on their R-mode
* step away from the keyboard from time to time to allow your R-mode to produce ideas
* metaphors are a powerful creativity tool because they combine R-mode with L-mode
* try to harvest ideas from the unconscious R-mode
  * Morning Pages: write some journal pages first thing every morning to harvest R-mode ideas while you're not yet fully awake 
  * go for a walk and think of nothing to let the unconscious R-mode chime in
  * defocus: "bear the problem in mind", but don't actively try to solve it
  * try a "whack on the head": change perspective, turn the problem around, invert the problem, imagine you are part of the problem - this may trigger ideas from the R-mode    

### Debug Your Mind

* our mind is bugged with biases
  * anchoring effect: something has been mentioned, and our mind "anchors" to that thought
  * need for closure: we want to finish something - better defer a decision until you have more information
  * confirmation bias: we believe information that confirms our suspicions more than other information
  * exposure effect: the longer we're exposed to some idea, the more we think of it
  * Hawthorne effect: we behave differently when we feel we're observed by others
  * generational bias: depending on which generation we belong to, we have different tendencies (*there's an 8-pages-long discussion of different American generations from the "GI generation" to the "Homeland generation", which I found odd rather than helpful*)
* know your biases
* "Trust your intuition, but verify"
* get feedback for your intuitive ideas 

### Learn Deliberately

* "Learning isn't done to you, it's something you do."
* a common form of training is "sheep dip" training
  * sheep are regularly dipped into a parasite-killing fluid, head and all, to clean them up - a very unpleasant experience
  * humans are regularly "dipped" into short, context-free trainings to learn about some topic - a very ineffective way of learning
* you need continuous goals and feedback to learn
* have SMART goals to increase the chance of success
* have a "Pragmatic Investment Plan"
  * have a concrete plan
  * diversify - don't learn only one topic, but look to the left and right
  * active investment - re-evaluate your investment regularly
  * invest regularly
* a more effective way of learning is peer study groups
* "Reading is the least effective way of learning." (*that's why I take notes and write them down in this blog!*)
* read deliberately with the SQR3 system
  * survey: do a quick scan of a topic/book
  * question: write down some questions you have about the topic
  * read: read the book
  * recite: while reading, take notes
  * review: re-read sections, discuss it with others
* use mind maps to explore a topic
  * activates R-mode, because it makes use of multiple senses
  * do it on paper to increase the R-mode experience
  * digital tools are more suited for documentation rather than for exploration
* to create a mind map:
  * dump your brain without too much thinking
  * put it aside, but add things when they come to mind
  * re-write the mind map with a little more thinking and structure
* "Documenting is more important than documentation."

### Gain Experience

* exploring/playing with something should come before studying facts about it
* "Build to learn, not learn to build."  
* "Play more in order to learn more."
* when faced with a problem, raise your awareness to that problem
  * close your eyes and imagine the problem
  * then, imagine a solution
  * "First be aware of the what, then think about the how." (*This is very helpful for debugging! I like to become really aware of a nasty bug by creating an "investigation page" in a wiki where I collect all the facts (the "what"). Then, I think about possible causes and how to fix then (the "how")*)
* "Trying too hard is a guarantee for failure."
  * pressure kills cognition - it shuts off the R-mode because you're too hectic to listen to it
  * you are least creative when under pressure
  * pressure leads to bad decisions
  * you no longer see options
  * *this is a strong parallel to Carol Dweck's ["Mindset"](/book-review-mindset): if you are in a "fixed mindset" environment you are expected to deliver, no matter what - if you are in a "growth mindset" environment, you are allowed to fail and learn*
* "If it's OK to fail, you won't."
* "If failure is costly, there will be no experimentation."
* imagining success will make success more likely - we can condition our minds to be more successful

### Manage Focus

* focus on the now, pay attention to what you're doing *now*
* allocate your attention, not your time
* meditation exercises increase your attention ability
  * meditation technique: think of nothing, and let go of thoughts as they come
* schedule "thinking time" to just meditate and unconsciously think of solutions and ideas
* have a place to collect ideas - for example, a paper notebook
  * this is an "exocortex" because is extends our brain's memory
  * once you have a place to collect thoughts and ideas, your brain will automatically create connections between them and create new ideas (*I can confirm that once I have a list for a certain category in my paper notebook, ideas keep on coming - I have way more ideas than I have time to pursue*)
* transcribing raw notes into a cleaner space reinforces learning and creativity (*again, I can confirm this - I often transcribe notes about a certain topic onto a new page to "start over" and it generates new ideas*)
* increase the physical cost of context switching to stay in context
  * make it harder to leave the room
  * make it hard to check email/social media
* leave a trail of "breadcrumbs" so you can easily re-enter your context when you're interrupted
* create a desktop space on your computer for each task
  * one for coding
  * one for writing
  * one for reading 
  * ...

### Beyond Expertise

* "Always keep a beginner's mind."
* stay curious

## Conclusion

The book didn't introduce any ideas that were completely new to me, but it reinforced what I've read in other books and experienced myself and put everything into the context of a software developer.

The R-mode/L-mode metaphor is very similar to the system 1/system 2 metaphor that Daniel Kahneman writes about in "Thinking, Fast and Slow". It's nice to read about it in a different context. I have experienced myself often enough that my R-mode/system 1 generates ideas when I'm least prepared for them, so I'm not leaving the house without my paper notebook anymore. 

In conclusion, there's some good advice in this book!

 

