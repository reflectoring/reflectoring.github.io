---

title: "Git Rebase Vs Git Merge: Which One Is Better?"
categories: [craft]
modified: 2021-01-05
excerpt: "If you are new to Git and/or GitHub, it's easy to get overwhelmed by the different workflow models you can use. 
          This post explains the basic fork and pull workflow model that is used on a lot of GitHub repositories." 
image:
  auto: 0050-git
---

In this article we are going to discuss some very important commands from [git](https://git-scm.com/) and [GitHub](https://github.com), and how they make the life of developers easy - working individually or in a team. We will compare Git `rebase` with Git `merge` and explore some ways of using them in our Git workflow. We will start from the very basic and level up with each section.

If you are a beginner to Git or GitHub and are looking to understand some of the basic commands used with git like fork, pull, checkout and commit then you should definitely give this [amazing article](https://reflectoring.io/github-fork-and-pull/) a read.

## Introduction to Git

Git is an **open-source distributed version control system**. We can break that work down into the following pieces:

* **Control System:** Git can be used to store content – it is usually used to store code, but other content can also be stored.
* **Version Control System:** Git helps in maintaining a history of changes and supports working on the same files in parallel by providing features like branching and merging.
* **Distributed Version Control System:** The code is present in two types of repositories – the local repository, and the remote repository.

## What is Git Rebase?

Let's have a look at the concept of Git `rebase`. A `rebase` is the way of migrating or combining a sequence of commits to a new base commit. If we consider it in the context of feature branching workflow, then it is more useful and easily visualized. The figure given below describes the general process of rebasing with Git:

![Git Rebasing](/assets/img/posts/git-rebase-merge/git-rebasing-basic.png)

Let's understand the working of Git `rebase` by looking a history with a topic branch off another topic branch. For example, we have branched a topic branch (server) from the mainline , and added some server-side functionality to our project, and then made a commit. Now, we branch off the `server` branch to make some client-side changes. Finally, we go back to the server-side branch and commit a few more changes:

![Git Rebase Example](/assets/img/posts/git-rebase-merge/git-rebase-working1.png)

Now suppose that we have decided to merge the client-side changes to the mainline for the release, but we also want to hold the server-side changes until they are tested further. 

With Git `rebase`, we can "replay" the changes in the `client` branch (that are not in the `server` branch, i.e. C8 and C9), and then replay them on the master branch by using the –onto option of git rebase:

```
git rebase --onto master server client
```

It gives us a bit complex but a pretty cool result:

![Git Rebase Example](/assets/img/posts/git-rebase-merge/git-rebase-working2.png)


Now it is time to fast forward our master branch. We will use the following commands to do this,

```
git checkout master

git merge client
```

![Git Rebase Done](/assets/img/posts/git-rebase-merge/git-rebase-working3.png)

## What is Git Merge?

Now it's time to have a look at Git `merge`. A `merge` is a way to put a forked history back together. The git `merge` command lets us take independent branches of development and combine them into a single branch.

It's important to note that while using the Git `merge`, the current branch will be updated to reflect the merge, but the target branch remains untouched. 

`git merge` is often used in combination with `git checkout` for the selection of the current branch, and `git branch -d` for deleting the obsolete target branch.

`git merge` is used for combining the multiple sequences of commits into one unified history. In the most common cases, we use `git merge` to combine two branches. 

Let's take an example in which we will mainly focus on branch merging patterns. In the scenario which we have taken, `git merge` takes two commit pointers, and tries to find the common base commit between them. 

Once Git has found a common base commit, it will create a new "merge commit", that will combine the changes of each queued merge commit sequence.

![Git Merge combining branches](/assets/img/posts/git-rebase-merge/git-merge-working1.png)

![Git Merge with Common Base](/assets/img/posts/git-rebase-merge/git-merge-working2.png)

## Example Usecase

Now it is time to get a hands-on practical example. The code we are going to write will create a new branch, add two commits to it, and finally, it will integrate it to the mainline by using fast-forward merge.

### Start working on a new feature

```
 git checkout -b new-feature master

 # Edit some files

 git add filename

 git commit -m "Start a feature"

 # Edit some files

 git add filename

 git commit -m "Finish a feature"

 # Merge in the new-feature branch

 git checkout master

 git merge new-feature

 git branch -d new-feature
```

It is to be noted that this is a common workflow for short-lived topic branches, that can be utilized for independent development as compared to an organizational tool for longer-running features.

Since the new features are now accessible from the master branch, therefore, Git shouldn't complain about the git branch -d.

If we require a merge commit during the fast forward merge for record-keeping purposes, then the git merge can be executed with the --no-ffoption.

The command given below can be very useful if one wants to merge the specified branch into the current branch, but it is worth mentioning that it will always generate a merge commit. It can be very helpful for the documentation of all merges that occur in the repository.

```
git merge --no-ff <branch>
```

## Git Rebase vs Git Merge

Now let's go through the difference between `git rebase` and `git merge`. 

When we merge, the branch we merge into will always preserve the ancestry of each commit history by generating a new commit:

![Git Merge Preserving commit history](/assets/img/posts/git-rebase-merge/git-merge-history.png)

If we want to update the branch pointer to the last commit, then the fast-forward merge is the best option.

We use `git rebase` to *re-write* the changes of one branch onto another branch without the creation of a merge commit. A new commit will be created on top of the branch we rebase onto, for every commit that is in the source branch, and not in the target branch. It will be just like all commits have been written on top of the master branch all along.

![Git Rebase updating history](/assets/img/posts/git-rebase-merge/git-rebase-history.png)

### Arguments for Using `git merge`

- It is a very simple Git methodology to use and understand.
- It helps in maintaining the original context of the source branch.
- If one needs to maintain the history graph semantically correct, then Git Merge preserve the commit history.
- The source branch commits are separated from the other branch commits. It can be very helpful in extracting the useful feature and merging later into another branch.

### Arguments for Using `git rebase`

Since a lot of developers are working on the same branch in parallel, therefore the history can be intensely populated by lots of merge commits. It can create a very messy look of the visual charts, which can create hurdles in extracting useful information.

![Difficult to Debug](/assets/img/posts/git-rebase-merge/debugging.png)

### Choosing the Right Method

When the team chooses to go for a feature-based workflow, then `git merge` is the right choice because of the following reasons,

- It helps in preserving the commit history, and we need not worry about the changing history and commits.
- Avoids unnecessary git reverts or resets.
- A complete feature branch can easily be re-integrated with the help of a `merge`.

Contrary to this, if we want a more linear history, then `git rebase` is the best option. It helps to avoid unnecessary commits by keeping the changes linear and more centralized.

We need to be very careful while applying a rebase because if it is done incorrectly, it can cause some serious issues.

## Dangers of Rebasing

When it comes to rebasing and merging, most people hesitate to use `git rebase` as compared to `git merge`. 

The basic purpose of `git rebase` and `git merge` is the same, i.e. they help us to bring changes from one branch into another. The difference is that **`git rebase` re-writes the commit history**: 

![Git Rebase Rewrites Commit History](/assets/img/posts/git-rebase-merge/git-rebase-history.png)

So, **if someone else checks out your branch before we rebase yours then it would be really hard to figure out what the history of each branch is**.

To summarize:

- `rebase` replays your commits on top of the new base.
- `rebase` rewrites history by creating new commits.
- `rebase` keeps the Git history clean.

Some of the key points to keep in mind are:

- `rebase` only your own local branches.
- Don't rebase public branches.
- Undo rebase with git reflog.

## Conclusion

Let's summarize what we have discussed so far. 

For repositories where multiple people work on the same branches, `git rebase` is not the most suitable option because the feature branch keeps on changing.

For individuals, on the other hand, rebasing provides a lot of ease. If one wants to maintain the history track, then one must go for the merging option because merging preserves the history while rebase just overwrites it.

However, if we have a complex history and we want to streamline it, then interactive rebasing can be very useful. It can help us to remove undesirable commits, squash two or more commits into each other, also providing the option to edit commit messages. 

Rebase focuses on presenting one commit at a time, whereas merging focuses on presenting all at once. But we should keep in mind that reverting a rebase is much more difficult than reverting a merge if there are many conflicts.

## Further Reading
* [Merging vs. Rebasing](https://www.atlassian.com/git/tutorials/merging-vs-rebasing)
* [Git Rebasing](https://git-scm.com/book/en/v2/Git-Branching-Rebasing)
