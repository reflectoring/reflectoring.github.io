---
title: "X Ways to Write Meaningful Commit Messages"
categories: [craft]
date: 2021-01-22 00:00:00 +1100
modified: 2021-01-22 00:00:00 +1100
excerpt: "This article discuss some important items that make a commit message, a good and understandable message"
author: hoorvash
image:
  auto: 0027-cover
---

Writing suitable commit messages can save a lot of time in producing applications and answers to many "why" and "how" questions.

## Why is a good commit message important?
Commit messages are a way of **communication between team members**. Let's say there's a bug in the application which was not there before. To find out what caused the problem, reading the commit messages could be handy. The proper commit message can **save a great deal of time** finding the recent changes related to the bug.

Being a new member of a team and working on projects you haven't seen before has its challenges. If you have a task to add some logic to some part of the code, previous good commit messages can help you find out **where and how** to add it.

If you fix a bug and write: "Fixed the bug!". What happens is that you will probably completely forget about it a month or two later. It's not a good idea to think that if it's not clear for others, they can ask about it. It can waste a lot of time and energy as well.

## What is a good commit message?

Good commit messages can be written in many different styles. The trick is to pick the best that suits you, the team, and the project and then stick to it. Like in so many other things, **being consistent in your commit message produces compound results over time**.

The perfect commit message should have certain qualities:

- **It should be understandable** even by seeing only the header of the message (we'll talk about the header soon).
- **It should be just enough**, and not too detailed.
- **It should be unambiguous**.

There are many styles we can follow to implement these standards. The style suggested by the Angular team is one of them and we're going to explain later in this article.

All styles and our commits should have some specific qualities to form a structured commit message which we’re going to explain now.

### Atomic Commit:
Although using a proper style is a good practice, it's not enough. Discipline is crucial. **Our commits should be reasonably small and atomic**. 

If the commit consists of multiple changes that make the message too long or inefficient, it's good practice to **separate it into several commits**. In other words: you don't want to commit a change that changes too much.

If you commit two changes together, for example a bug fix and a minor refactoring, it might not cause a very long commit message, but it can cause some other problems. 

Let's say the bug fix created some other bugs. In that case, you should roll back to your recent commit. It results in the loss of the refactoring as well. It's not efficient, and it's not atomic.

### Short and Unambiguous:
The message should describe what changes your commit makes to the behavior of the code, not what changed in the code. We can see what changed in the diff with the previous commit, so we don't need to repeat it in the commit message. But to understand what behavior changed, a commit message can be helpful.

It should answer the question: **"What happens if the changes are applied?"**. If the answer can't be short, it might be because the commit is not atomic, and it's too much change in one commit.

#### Active Voice:
 Use the **imperative, present tense**. It is easier to read and skim.
> **Right**: Add feature for a user to upload pictures
>
> **Wrong**: Added feature ... (passive voice, past tense)

#### Detailed Enough:
Super-detailed commit messages are frustrating as well. You can find that level of detail in the code. For example, if your version control is Git, you can see all the changed files in Git, so you don't have to list them. 

So, instead of answering "what are the changes?", it's better to answer **"What are the changes for?"**.

### Formatting:
Below, we describe a simplified format of what Angular suggests.
This format consists of a header, a body, and a footer with a blank line between each section.

Header: Mandatory - Up to 50 characters (as Git suggests)

> (type) (scope): (short summary)

Description: Mandatory (except for docs) - at least 20 characters
> (body)

Footer: Optional
> (footer)

The header consists of a type and a summary part. Some add scope in between. But since it's optional, we only discuss it briefly.

#### Type:
The type of commit message says that the change was made for a particular problem. For example, if we've fixed a bug or added a feature, or maybe changed something related to the docs, the type would be "Fix", "Add", or "Doc". It could be whatever you and your teammates decide as long as it's understandable and consistent. It's better to be capitalized.

#### Scope:
It's the package or module that is affected by the change. As mentioned before, it's optional.

#### Summary:
As Angular suggests: "It should be present tense. Not capitalized. No period in the end.", and **imperative like the type**.
As [Chris Beams](https://chris.beams.io/posts/git-commit/) mentions here, the summary should always be able to complete the following sentence: 

**If applied, this commit will** 
add authorization for document access

Let's look at an example of the summary:
> **Right**: Fix: add authorization for document access
> 
> **Wrong**: Fix: Add authorization for document access (Capitalized)
>
> **Wrong**: Fix: added authorization for document access (Not present tense)
>
> **Wrong**: Fix: add authorization for document access. (Used period in the end)

In this example, "Fix" is the type, and the sentence after that is the summary.

#### Body:
The format should be just like the summary, but the content goal is different. It should explain the motivation for the change.

In other words, it should be an imperative sentence explaining why you're changing the code, **compared to what it was before**.

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
You can even mix the type and description and write the message like this:
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
