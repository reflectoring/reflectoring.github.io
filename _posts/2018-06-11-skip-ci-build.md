---
title: "Skipping a CI Build for non-code changes"
categories: [tools]
modified: 2018-06-11
author: tom
tags: [ci, travis]
comments: true
ads: true
---

{% include sidebar_right %}

Skipping a CI build is like purposefully not brushing your teeth every morning and evening.
You know it should not be skipped and you feel guilty when you do it anyways.
However, there are some cases when you have only changed some supplementary files
(like documentation) that have no impact whatsoever on your build pipeline and you don't want to wait for a
long-running build. Here are two ways how to skip a CI build in this case.

# Using the Commit Message `[skip ci]` 

The easiest way to skip a CI build is to add `[skip ci]` or `[ci skip]` to your
commit message. Many CI providers support this:

* [Travis CI](https://docs.travis-ci.com/user/customizing-the-build#Skipping-a-build)
* [GitLab](https://docs.gitlab.com/ee/ci/yaml/#skipping-jobs)
* [BitBucket](https://confluence.atlassian.com/bitbucket/bitbucket-pipelines-faq-827104769.html)
* [CircleCI](https://circleci.com/docs/1.0/skip-a-build/#1-ci-skip-in-commit-title)

This solution has two major drawbacks, though. 

Firstly, **it pollutes the git commit messages** with meta information that is only relevant
to the CI system and brings no value to the commit history.

Secondly, the above commit message will cause the CI system to **ignore the push / pull request
completely**, i.e. it will not even register in your CI history. **This will cause
any hooks you have installed to your build pipeline not to run.** 

You're screwed, for example, if you have protected the branches of your GitHub 
repository, so that pull requests can only be merged when the CI build for the pull request has successfully run.
This will never happen using `[skip ci]`, so you can never merge the pull request... .

# Using a Git Diff in the CI Build

So, we actually want the CI build to start - only to immediately exit when only non-code changes
were made.

I've found a nice script for Travis CI [on GitHub](https://github.com/google/EarlGrey/pull/383/files/3b38a5dea36a88aba42a42931e77a7c5429a1837)
and modified it a little:

```bash
if ! git diff --name-only $TRAVIS_COMMIT_RANGE | grep -qvE '(.md$)'
then
  echo "Only docs were updated, not running the CI."
  exit
fi
```

This script creates a diff of all commits within the `$TRAVIS_COMMIT_RANGE` (i.e. [within the current push or pull request](https://docs.travis-ci.com/user/environment-variables/)) and exits the build
if it only includes markdown files (*.md). We could modify the regular expression to include
more than just markdown files. It can be included into a build, like I did in my [code examples](https://github.com/thombergs/code-examples/blob/master/.travis.yml) repository.

However, of the big CI providers, only Travis CI currently supports the necessary "commit range" environment
variable: 

* GitLab doesn't support a commit range variable, but it's [requested as a feature](https://gitlab.com/gitlab-org/gitlab-ce/issues/37863)
* BitBucket doesn't support a commit range variable, but it's [requested as a feature](https://bitbucket.org/site/master/issues/15892/present-a-commit-range-environment)
* CircleCI doesn't support a commit range variable, but there is a [workaround](https://discuss.circleci.com/t/get-list-of-commits-in-build/15725)

# A Word of Caution

Use wisely and with caution. The build should never be skipped when a file changed that has any impact
on the build. So, if your markdown files are part of your build, don't skip the build.  
