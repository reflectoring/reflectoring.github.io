---
title: "Writing Meaningful Commit Messages"
categories: ["WIP","Software Craft"]
date: 2021-02-22T05:00:00
modified: 2021-02-22T05:00:00
excerpt: "This article discusses different methods of formatting and writing meaningful commit messages."
authors: [hoorvash]
image: images/stock/0016-pen-1200x628-branded.jpg
url: meaningful-commit-messages
---

Writing meaningful commit messages can save a lot of time answering many "why?" and "how?" questions, and thus gives us more time in the day to do productive work.

## Why Is a Good Commit Message Important?
**Commit messages are a way of communication between team members**. Let's say there's a bug in the application which was not there before. To find out what caused the problem, reading the commit messages could be handy. **The proper commit message can save a great deal of time finding the recent changes related to a bug**.

Being a new member of a team and working on projects we haven't seen before has its challenges. If we have a task to add some logic to some part of the code, **previous good commit messages can help us find out where and how to add the code**.

If we fix a bug or add a feature we will probably completely forget about it a month or two later. It's not a good idea to think that if it's not clear for others, they can ask us about it. Instead, we should provide proper commit messages for people to use as a resource in their daily work.

## What Is a Good Commit Message?

Good commit messages can be written in many different styles. The trick is to pick the best style that suits the team and the project and then stick to it. Like in so many other things, **being consistent in our commit message produces compound results over time**.

The perfect commit message should have certain qualities:

- **It should be understandable** even by seeing only the header of the message (we'll talk about the header soon).
- **It should be just enough**, and not too detailed.
- **It should be unambiguous**.

Let's explore some things we should keep in mind when creating commit messages.
 
### Atomic Commits
Although using a proper style is a good practice, it's not enough. Discipline is crucial. **Our commits should be reasonably small and atomic**. 

If the commit consists of multiple changes that make the message too long or inefficient, **it's good practice to separate it into several commits**. In other words: we don't want to commit a change that changes too much.

If we commit two changes together, for example, a bug fix and a minor refactoring, it might not cause a very long commit message, but it can cause some other problems. 

Let's say the bug fix created some other bugs. In that case, we need to roll back the production code to the previous. This will result in the loss of the refactoring as well. It's not efficient, and it's not atomic.

Also, if someone searches the commit history for the changes made for the refactoring, they have to figure out which files were touched for the refactoring and which for the bugfix. This will cost more time than necessary.

### Short and Unambiguous
The commit message should describe what changes our commit makes to the behavior of the code, not what changed in the code. We can see *what* changed in the diff with the previous commit, so we don't need to repeat it in the commit message. But to understand what behavior changed, a commit message can be helpful.

**It should answer the question: "What happens if the changes are applied?"**. If the answer can't be short, it might be because the commit is not atomic, and it's too much change in one commit.

### Active Voice
 **Use the imperative, present tense**. It is easier to read and scan quickly:

```text
Right: Add feature to alert admin for new user registration
Wrong: Added feature ... (past tense)
```

We use an imperative verb because it's going to complete the sentence "If applied, this commit will ..." (e.g. "If applied, this commit will add a feature to alert admin for new user registration"). 

Using present tense and not past tense in commit messages has made a big [thread](https://news.ycombinator.com/item?id=2079612) of discussions between developers over the question "Why should it be present tense?".

The reason behind using present tense is that the commit message is answering the question "What will happen after the commit is applied?".
If we think of a commit as an independent patch, it doesn't matter if it applied in the past. What matters is that this patch is always supposed to make that particular change when it's applied.

### Detailed Enough
Super-detailed commit messages are frustrating as well. We can find that level of detail in the code. For example, if our version control is Git, we can see all the changed files in Git, so we don't have to list them. 

So, instead of answering "what are the changes?", **it's better to answer "What are the changes for?"**.

### Formatting
Let's start with Git conventions. Other conventions usually have the Git conventions in their core. 

**Git suggests a commit message should have three parts including a subject, a description, and a ticket number.** 
Let's see the exact template mentioned on [Git's website](https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration):

```text
Subject line (try to keep under 50 characters)

Multi-line description of commit,
feel free to be detailed. (Up to 72)

[Ticket: X]
```

**The subject is better to be less than 50 characters** to get a clean output when executing the command `git log --oneline`. **The description is better to be up to 72 characters.**

Preslav Rachev [in his article](https://p5v.medium.com/what-s-with-the-50-72-rule-8a906f61f09c) explains the reason for the 50/72 rule. The ideal size of a git commit summary is around 50 characters in length. Analyzing the average length of commit messages in the Linux kernel suggests this number. The 72 character rule is to center the description on an 80-column terminal in the git log since it adds four blank spaces at the left when displaying the commit message, so we want to add space for four more blank spaces on the right side.

## Conventional Commit Messages

Let's now have a look at [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), a specification that gives opinionated guardrails to format commit messages.

The Conventional Commits format goes hand in hand with semantic versioning, so let's talk about that first.
 
### Semantic Versioning
As described on the [Semantic Versioning website](https://semver.org/), semantic versioning consists of three numbers: MAJOR, MINOR, and PATCH. Each number is incremented in different circumstances:

- the MAJOR version when we make incompatible API changes,
- the MINOR version when we add functionality in a backward-compatible manner, and
- the PATCH version when we make backward-compatible bug fixes. 

As we'll see, if we follow semantic versioning consistently, generating the version number can be automated based on the commit messages. 

### Conventional Commits Structure
The general structure of a conventional commit message is this:

```text
[type] [optional scope]: [description]

[optional body]

[optional footer(s)]
```

Each commit has a type that directly matches semantic versioning practice:

- `fix`: patches a bug in our codebase (correlates with PATCH in semantic versioning)
- `feat`: introduces a new feature to the codebase (correlates with MINOR in semantic versioning)
- `refactor!`: introduces a breaking API change by refactoring because of the "!" symbol (correlating with MAJOR in semantic versioning)
  
The symbol **"!"** can be used with any type. It signifies a breaking change that correlates with MAJOR in semantic versioning.

Using `BREAKING CHANGE` in the footer introduces a breaking API change as well (correlating with MAJOR in semantic versioning).

The [Angular commit message format](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit) is another conventional format. It suggests that a commit message should
consist of a header, a body, and a footer with a blank line between each section because tools like `rebase` in Git 
get confused if we run them together without space.

```text
[type] [optional scope]: [short summary]

[body] - at least 20 characters up to 72, optional only for docs

[optional footer]
```

The header consists of a type and a summary part. Some add an optional "scope" in between.

### Type
The type of commit message says that the change was made for a particular problem. For example, if we've fixed a bug or added a feature, or maybe changed something related to the docs, the type would be "fix", "feat", or "docs".
 
This format allows multiple types other than "fix:" and "feat:" mentioned in the previous part about conventional messages.
Some other Angular's type suggestions are: "build:", "chore:", "ci:", "docs:", "style:", "refactor:", "perf:", "test:", and others.

### Scope
The scope is the package or module that is affected by the change. As mentioned before, it's optional.

### Summary
As Angular [suggests](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit): "It should be present tense. Not capitalized. No period in the end.", and **imperative like the type**.

As Chris Beams mentions [in his article about commit messages](https://chris.beams.io/posts/git-commit/), the summary should always be able to complete the following sentence: 

**If applied, this commit will...** add authorization for document access

Let's look at some summary examples:
```text
Right: fix: add authorization for document access
Wrong: fix: Add authorization for document access (capitalized)
Wrong: fix: added authorization for document access (not present tense)
Wrong: fix: add authorization for document access. (period in the end)
```

In this example, "fix" is the type, and the sentence after that is the summary.

### Body
The format of the body should be just like the summary, but the content goal is different. It should explain the motivation for the change.

In other words, **it should be an imperative sentence explaining why we're changing the code, compared to what it was before**.

### Footer
In the footer, we can mention the related task URL or the number of the issue that we worked on:

### Consistency in the Format
**All the rules above are beneficial only if we keep doing it in all our commits**. If the structure changes in each commit,
the Git log would be unstructured and unreadable over time, which misses the whole point of making these rules.

## Examples

Let's have a look at some examples.
In each Example, we describe a scenario and then show the shape of the commit message based on formats discussed previously in the article.

### Example One
We added a feature to the codebase. It gets the mobile number from the user and adds it to the user table.
All positive and negative tests are ready except one. It should check that a user is not allowed to enter characters as the mobile number. We add this test scenario and then commit it with this message:

```text
test: add negative test for entering mobile number

add test scenario to check if entering character as mobile number is forbidden 

TST-145
```

### Example Two
We realized that getting a parameter from the API output is going to clean up our code. 
So we did the refactoring and now the new input is mandatory. This means the client should send this specific input or
the API does not respond. This refactoring made a MAJOR change that is not backward-compatible. We commit our change with
this commit message:

```text
refactor!: add terminal field in the payment API  

BREAKING CHANGE: add the terminal field as a mandatory field to be able to buy products by different terminal numbers

the terminal field is mandatory and the client needs to send it or else the API does not work

PAYM-130
```


### Example Three
We add another language support to our codebase. We can use a scope in our commit message like this:

```text
feat(lang): add french language
```

The available scopes must be defined for a codebase beforehand. Ideally, they match a component within the architecture of our code.

## Conclusion

A great format for writing commit messages can be different in each team. The most important aspect is to keep it simple, readable, and consistent.

## Useful Links

* [https://github.com/joelparkerhenderson/git_commit_message](https://github.com/joelparkerhenderson/git_commit_message)  
* [https://medium.com/better-programming/you-need-meaningful-commit-messages-d869e44e98d4](https://medium.com/better-programming/you-need-meaningful-commit-messages-d869e44e98d4)
* [https://medium.com/@auscunningham/enforcing-git-commit-message-style-b86a45380b0f](https://medium.com/@auscunningham/enforcing-git-commit-message-style-b86a45380b0f)
* [https://www.conventionalcommits.org/en/v1.0.0/](https://www.conventionalcommits.org/en/v1.0.0/)
