---

title: Github's Fork & Pull Workflow for Git Beginners
categories: [opensource]
modified: 2017-01-02
author: tom
tags: [git, github, pull request, branch, fork, howto, guide, pull]
comments: true
ads: false
excerpt: "If you are new to Git and/or GitHub, it's easy to get overwhelmed by the different workflow models you can use. 
          This post explains the basic fork and pull workflow model that is used on a lot of GitHub repositories." 
sidebar:
  nav: opensource
  toc: true
---

{% include sidebar_right %}

If you are new to [git](https://git-scm.com/) and/or [GitHub](https://github.com), 
it's easy to get overwhelmed by the different workflow models you can use 
to contribute code to a repository. At least, I was overwhelmed and it took 
some time for me to open up to new workflows and to get over the things 
I learned using good old SVN.

This post explains the basic [fork and pull](https://help.github.com/articles/about-collaborative-development-models/)
workflow model that is used on a lot of GitHub repositories. For each step
in the workflow, I will list the necessary git commands and describe
them briefly. Thus, this post is aimed at git beginners that have yet 
hesitated to contribute on GitHub.

## Fork & Pull
Thinking about it, "Fork & Pull" is a pretty concise name for this workflow. 

1. Create a personal fork of the repository you want to contribute to 
1. Edit the fork to make the changes you want to contribute
1. Create a pull request from the fork to propose your changes to the 
   repository owner for merging

For the sake of simplicity, we can consider a fork to be a personal copy 
of the repository that can be edited by you even when you cannot edit the 
original repository. Creating a fork on GitHub is as easy as clicking the
"fork" button on the repository page.

The fork will then appear in the list of your repositories on GitHub where you
can clone it to your local machine and edit it. Once you are done editing, you
push your commits back to the fork on GitHub.

Lastly, you submit a request to the owner of the original repository to pull 
your changes into the original repository - a pull request. This can be done by 
simply clicking the pull request button on the GitHub page of your fork. The owner 
of the original repository will then be notified of your changes and may merge 
them. In the best case (when there are no merge conflicts), he can do this by 
simply clicking the "merge" button.

## Git Commands for a Simple Workflow
The following steps are enough for creating a pull request if you don't need to 
work on multiple pull requests to the same repository at once.

1. **Create a Fork**  
   Simply click on the "fork" button of the repository page on GitHub.

2. **Clone your Fork**  
   The standard `clone` command creates a local git repository from your remote fork on GitHub. 

   ```
   git clone https://github.com/USERNAME/REPOSITORY.git
   ```

3. **Modify the Code**  
   In your local clone, modify the code and commit them to your local clone 
   using the `git commit` command.

4. **Push your Changes**  
   In your workspace, use the `git push` command to upload your changes to your
   remote fork on GitHub.

5. **Create a Pull Request**  
   On the GitHub page of your remote fork, click the "pull request" button. Wait
   for the owner to merge or comment your changes and be proud when it is merged :).
   If the owner suggests some changes before merging, you can simply push these
   changes into your fork by repeating steps #3 and #4 and the pull request is 
   updated automatically.

## Additional Git Commands
The commands listed above are enough for a simple pull request. In some cases, however
you need to know a couple more commands.

### Updating your Fork
Other developers don't sleep while you are coding. Thus, it may happen that while you
are editing your fork (step #3) other changes are made to the original repository.
To fetch these changes into your fork, use these commands in your fork workspace:

```
# add the original repository as remote repository called "upstream"
git remote add upstream https://github.com/OWNER/REPOSITORY.git

# fetch all changes from the upstream repository
git fetch upstream

# switch to the master branch of your fork
git checkout master

# merge changes from the upstream repository into your fork
git merge upstream/master
```

### Working on multiple Pull Requests at once
If you are working on multiple features you want to push them isolated from each
other. Thus, you need to create a separate pull request for each feature. A pull
request is always bound to a branch of a git repository, so you have to create
a separate branch for each feature. 

```
# change to the master branch so the master serves as source branch for the 
# next command
git checkout master

# create and switch to a new branch for your feature
git checkout -b my-feature-branch

# upload the branch and all committed changes within it to the remote fork
git push --set-upstream origin my-feature-branch
``` 

Create a branch like this for each feature you are working on. To switch between branches,
simply use the command `git checkout BRANCHNAME`. To create a pull request from a branch,
go to the GitHub page of that branch and click the "pull request" button. GitHub automatically
creates a pull request from the selected branch.

### Updating a Feature Branch
You may want to pull changes made to the original repository into a local feature branch.
As described in [Updating your Fork](#updating-your-fork) above, merge the upstream repository
to your master branch. Then `rebase` your feature branch from the updated master branch:

```
# switch to your feature branch
git checkout my-feature-branch

# commit all changes in your feature-branch
git commit -m MESSAGE

# update your feature branch from the master branch
git rebase master
```

## Conclusion
The steps and commands described above should provide enough information to start 
using pull requests. Of course, there are more sophisticated workflows and git 
commands yet, but starting small reduces the fear of doing something wrong ;). So, start
contributing pull requests to your favorite GitHub project today!

## Further Reading
* [GitHub Standard Fork & Pull Request Workflow](https://gist.github.com/Chaser324/ce0505fbed06b947d962)
* [About collaborative development models](https://help.github.com/articles/about-collaborative-development-models/)
* [About Pull Requests](https://help.github.com/articles/about-pull-requests/)

