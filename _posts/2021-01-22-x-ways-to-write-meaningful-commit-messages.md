---
title: "X Ways to Write Meaningful Commit Messages"
categories: [craft]
date: 2021-01-22 00:00:00 +1100
modified: 2021-01-22 00:00:00 +1100
excerpt: "This article discuss some important items that make a commit message, a good and understandable message"
image:
  auto: 0027-cover
---

Writing suitable commit messages can save a lot of time in producing applications and answers to many "why" and "how" questions.

## Why is a good commit message important?
Commit messages are a way of **communication between team members**. Let's say there's a bug in the application which was not there before. To find out what made the problem, reading the commit messages could be handy. The proper commit message can **save a great deal of time** finding the recent changes related to the bug.

Being a new member of a team and working on projects you haven't seen before has its challenges. If you have a task to add some logic to some part of the code, previous good commit messages can help you find out **where and how** to add it.

If you fix a bug and write: "Fixed the bug!". What happens is that you will probably completely forget about it a month or two later. So it's not feasible to think if it's not clear for others, they can ask about it. It can waste a lot of time and energy as well.

## What is a good commit message?

Writing suitable commit messages can be defined as many styles. The trick is to pick the best that suits you and then stick to it. It means being **consistent** in using the format in all commits.

The perfect commit message should have certain qualities:
  - **Understandable** even by seeing only the header of the message (We'll talk about the header soon)
  - Not too much detailed, but **just enough**
  - **Unambiguous**

Writing suitable commit messages can be defined as many models. The trick is to pick the best that suits you and then stick to it. It means being consistent in using the format in all commits.

There are many styles we can follow to reach these standards. Angular suggested style is one of them that we're going to explain a simplified version of it later in this article.

All styles and our commits should have some specific qualities to form a structured commit message which we’re going to explain now.

### Atomic Commit:
Although using a proper style is a good practice, but it's not enough. The discipline is crucial. The commits should be **reasonable and atomic**. If the commit consists of multiple changes that make the message too long or inefficient, it's good practice to **separate it into several commits**. In other words, you don't want to commit a code that does nothing or does too much, or maybe it's broken.

If you commit two changes together, for example, a bug fix, and a minor refactoring, It might not cause a very long commit message, but it can cause some problems. Let's say the bug fix made some other bugs. In that case, you should roll back to your recent commit. It results in the loss of that refactoring as well. It's not efficient, and It's not atomic.

### Short and Unambiguous:
The message should describe what changes your code makes to the base code. It should answer the question: **"What happens if the changes are applied?"**. If you can not be short, it might be because the commit is not atomic, and it's too much change in one commit.

#### Active Voice:
 Use the **imperative, present tense**. It is easier to read and skim.
> **Right**: Add feature for a user to upload pictures
>
> **Wrong**: Added feature ... (passive voice, past tense)

#### Detailed Enough:
Super-detailed commit messages are frustrated as well. You can find that much detail in the system. For example, If your version control is Git, you can see all the changed files in Git. So instead of answering "what are the changes? ", it's better to answer **"What are the changes for?"**.

### Formatting:
Bellow, we describe a simplified format of what Angular suggests.
This format consists of a header, a body, and a footer with a blank line between each section.

Header: Mandatory - Up to 50 characters (as Git suggests)

> (type) (scope): (short summary)

Description: Mandatory (except for docs) - at least 20 characters
> (body)

Footer: Optional
> (footer)

The header consists of a type and a summary part. Some add scope in between. But since it's optional, we only discuss it briefly.

#### Type:
The type of commit message is that change made for a particular problem. For example, if you've fixed a bug or add a feature, or maybe changed something related to the docs, the type would be Fix, Add, or Doc. It could be whatever you and your teammates decide to be as long as it's understandable and consistent. It's better to be capital.

#### Scope:
It's the package or module that is affected by the change. As mentioned before, it's optional.

#### Summary:
As Angular suggests: "It should be present tense. Not capitalized. No period in the end." And imperative like the type.
As [Chris Beams](https://chris.beams.io/posts/git-commit/) mentions here, the summary should always be able to complete the following sentence: 

If applied, this commit will ...

**If applied, this commit will** 
add authorization for document access

Bellow, part "Fix" is the type, and the sentence after ":" is the summary.
> **Right**: Fix: add authorization for document access
> 
> **Wrong**: Fix: Add authorization for document access (Capitalized)
>
> **Wrong**: Fix: added authorization for document access (Not present tense)
>
> **Wrong**: Fix: add authorization for document access. (Used period in the end)

#### Body:
The format should be just like the summary, but the content goal is different. I should explain the motivation for the change.
In other words, it should be an imperative sentence explaining why you're changing the code, compared to what it was before.

#### Footer: 
You can mention the related task URL or the issue number in this section.

### Consistency in the format:
All the rules above are beneficial only if you keep doing it in all your commits. If the structure changes in each commit,
the Git log would be unstructured and unreadable over time. Which misses the whole point of making these rules.

## Examples:
#### Commit message 1:
> 
> Doc: fix typo in tutorial
>
> change colour to color in the introduction
>
> Document-130
>


#### Commit message 2:
>
>Test: add negative test for payment
>
>add test scenario of user with zero credit
>
>Payment-145 (or you can use the URL)

#### Commit message 3:
You can even mix the type and description and wrtie the message like this:
>
>Fix typo in tutorial
>
>change colour to color in the introduction
>
>Document-130

## Conclusion:

A great format for writing commit messages can be different in each team. The most important aspect is to keep it simple, readable, and consistent.

## References:

> [Angular](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit) ,
> [Chris Beams](https://chris.beams.io/posts/git-commit/) , 
> [Joe Parker Henderson](https://github.com/joelparkerhenderson/git_commit_message) , 
> [Dan Goslen](https://medium.com/better-programming/you-need-meaningful-commit-messages-d869e44e98d4)
