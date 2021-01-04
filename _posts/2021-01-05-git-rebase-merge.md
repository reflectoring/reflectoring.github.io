---

title: "Git Rebase Vs Git Merge: Which One Is Better?"
categories: [craft]
modified: 2021-01-05
excerpt: "If you are new to Git and/or GitHub, it's easy to get overwhelmed by the different workflow models you can use. 
          This post explains the basic fork and pull workflow model that is used on a lot of GitHub repositories." 
image:
  auto: 0050-git
---

In this article we are going to discuss some of the very important commands from [git](https://git-scm.com/) and [GitHub](https://github.com), and how they make the life of developers easy working individually or working in a team, and when to utilize each of them. We will be comparing Git Rebase and Git Merge, and further, we will explore the potential opportunities to incorporate the basic workflow of Git. We will start from the very basic, and then will keep on leveling up.

If you are a beginner to git or GitHub and are looking to understand some of the basic commands used with git like fork, pull, checkout and commit then you should definitely give this [amazing article](https://reflectoring.io/github-fork-and-pull/) a read.



- Introduction to Git
- What is Git Rebase?
- Working of Git Rebase
- What is Git Merge?
- Working of Git Merge
- Git Rebase vs Git Merge
- Merging Pros and Cons
- Choosing the Right Method
- Common Myths
- Summary

So bear with me. I hope this will be fun and a learning experience for all those getting their hands dirty with Git 😊

## Introduction to Git

An **Open-Source Distributed Version Control System** is known as Git. It can be broken down into the following major components,

**Control System:** It acts as a content tracker for Git. So, basically, Git can be used to store content – it is usually used to store the code, but the other content can also be stored.

**Version Control System:** Since the developers code in parallel so the version control system helps in maintaining a history of changes by providing the features like branches and merges.

**Distributed Version Control System:** The code in the case of Git is present in two types of repositories – the local, and the central. Managing and synchronizing the local and central repositories comes under the shelter of a Distributed Version Control System.

## What is Git Rebase?

Let's have a look at the concept of Git Rebase. It is the way of migrating or combining a sequence of commits to a new base commit. If one considers it in the context of feature branching workflow, then it is more useful and easily visualized. The figure given below describes the general process of Git Rebasing.

![Git Rebasing](/assets/img/posts/git-rebase-merge/git-rebasing-basic.png)

## Working of Git Rebase

Let's understand the working of Git Rebase by taking a history like A history with a topic branch off another topic branch, for example, we have branched a topic branch (server), and added some server-side functionality to our project, and then made a commit. Now it's time to branch off to make client-side changes by committing a few times. Finally, we go back to the server-side branch and commit a few more changes.

![Git Rebase Example](/assets/img/posts/git-rebase-merge/git-rebase-working1.png)

Now suppose that we have decided to merge the client-side changes to the mainline for the release, but we also want to hold the server-side changes until it is tested further. Git rebase provides us the option to make the changes on the client that is not on the server (C8 and C9), and then replay them on the master branch by using the –onto option of git rebase:

```
git rebase --onto master server client
```

It gives us a bit complex but a pretty cool result. It states "Take the client branch, and figure out the potential patches, since the divergence is done from the server branch, and finally replay these patches in the client branch as it was based directly off the master branch instead".

![Git Rebase Example](/assets/img/posts/git-rebase-merge/git-rebase-working2.png)

Now it is time to fast forward our master branch. We will use the following commands to do this,

```
git checkout master

git merge client
```

![Git Rebase Done](/assets/img/posts/git-rebase-merge/git-rebase-working3.png)

## What is Git Merge?

Now it's time to have a look at Git Merge. It is a way to put a forked history back together again. The git merge command provides us the opportunity to take the independent lines of development formulated by the git branch and combine them as a single branch.

It is important to note that while using the Git Merge, the current branch will be updated to reflect the merge, but the target branch remains untouched and un-reflected. The git merge is often used in combination with git checkout for the selection of the current branch, and git branch -d for deleting the obsolete target branch.

## Working of Git Merge

Git Merge is basically used for combining the multiple sequences of commits into one unified history. In the most frequently occurring cases, git merge is used to combine two branches. Let's take an example in which we will mainly focus on branch merging patterns. In the scenario which we have taken, the git merge takes two commit pointers, usually known as the branch tips, and we will manage to find the common base commit between them. Once the git has a common base commit, it will create a new "merge commit", that will combine the changes of each queued merge commit sequence.

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

Now let us go through the difference between the Git Rebase and Git Merge. When we create the Git Merge the head branch will always preserve the ancestry of each commit history by generating a new commit.

![Git Merge Preserving commit history](/assets/img/posts/git-rebase-merge/git-merge-history.png)

If we want to update the branch pointer to the last commit, then the fast-forward merge is the best option.

The Git Rebase is used to re-write the changes of one branch to another without the creation of a new commit. A new commit will be created on top of the master, for every commit that is a feature branch, and not in the master. It will be just like all commits are written on top of the master branch all along.

![Git Rebase updating history](/assets/img/posts/git-rebase-merge/git-rebase-history.png)

# Merging Pros and Cons

### Pros

- It is a very simple Git methodology to use and understand.
- It helps in maintaining the original context of the source branch.
- If one needs to maintain the history graph semantically correct, then Git Merge preserve the commit history.
- The source branch commits are separated from the other branch commits. It can be very helpful in extracting the useful feature and merging later into another branch.

### Cons

Since a lot of developers are working on the same branch in parallel, therefore the history can be intensely populated by lots of merge commits. It can create a very messy look of the visual charts, which can create hurdles in extracting useful information.

![Difficult to Debug](/assets/img/posts/git-rebase-merge/debugging.png)

## Choosing the Right Method

When the team chooses to go for feature-based workflow, then the git merge is the right choice because of the following reasons,

- It helps in preserving the commit history, and one needs not to worry about the changing history and commits.
- Avoids un-necessary git reverts o resets.
- A complete feature branch can easily be re-integrated with the help of it.

Contrary to this, if one wants a more linear history then the git rebase is the best option. It helps in avoiding un-necessary commits by keeping the changes linear and more centralized.

One needs to be very careful while applying the rebase because if it is considered incorrectly, it can cause some serious issues.

## Common Myths

While it comes to rebasing and merging, most people hesitate to use git rebase as compared to merge. So we will figure out some common myths about git rebase and then compare it with merge, and we will also demonstrate when to use either one of them.

So the basic purpose of Git Rebase and Git Merge is the same i.e. they help us to bring changes from other branches into ours. The following two visuals demonstrate the working of two developers while they are using git merge and git rebase respectively.

![Git Merge Commit](/assets/img/posts/git-rebase-merge/git-merge-commit.png)

![Git Rebase Commit](/assets/img/posts/git-rebase-merge/git-rebase-commit.png)

Now we will have a look at the dangerous part about the git rebasing, it can be seen from the visual given below that it re-writes the history. So if someone else checkout your branch before we rebase yours then it would be really hard to figure out what the history of each branch is.

![Git Rebase Rewrites Commit History](/assets/img/posts/git-rebase-merge/git-rebase-history.png)

Just to summarize,

- Rebase replays your commits on top of the new base.
- Rebase rewrites history by creating new commits.
- Rebase keeps the Git history clean.

Some of the key points to keep in mind are,

- Rebase your own local branches.
- Don't rebase public branches – master.
- Undo rebase with git reflog.

## Conclusion

Now it is time to summarize what we have discusses so far. For inconsistent repositories git rebase is not the most suitable option because the feature branch keeps on changing but for individuals rebasing provides a lot of ease. If one wants to maintain the history track, then one must go for the merging option because merging preserves the history while rebase just overwrites it.

However, if we have a complex history and we want to streamline it, then interactive rebasing can be very useful. It can help us to remove undesirable commits, squash two or more commits into each other, also providing the option to commit messages. Rebase focuses on presenting one commit at a time, whereas merging focuses on presenting all at once. But it should be kept in mind that reverting rebase is much more difficult than reverting merge if there are many conflicts.

## Further Reading
* [Merging vs. Rebasing](https://www.atlassian.com/git/tutorials/merging-vs-rebasing)
* [Git Rebasing](https://git-scm.com/book/en/v2/Git-Branching-Rebasing)
