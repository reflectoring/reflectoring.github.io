---
authors: [tom]
title: "Why You Should Enforce 100% Code Coverage*"
categories: ["Software Craft"]
date: 2018-09-01
description: "Everyone knows that aiming for 100% code coverage is bullshit. This article re-defines code coverage
          to make 100% a meaningful and worthwhile goal."
image: images/stock/0027-cover-1200x628-branded.jpg
url: percent-test-coverage
---



Yeah, I know. Everyone says aiming for 100% code coverage is bullshit.

**And the way test coverage is usually defined, I fully agree!**

As the asterisk in the title suggests, there's a little fine print here that will
introduce a new definition of "code coverage" (or "test coverage") to help explain why 
aiming at 100% code coverage might be the right thing to do.  

## The Problem with 100% Actual Code Coverage

Let's stick for a minute with the usual definition of code coverage and call it 
"actual code coverage":

> Actual code coverage is the percentage of lines of code that are executed
> during an automated test run.

Actually, we can replace "lines of code" with "conditional branches", "files", "classes",
or whatever we want to take as a basis for counting.

Why is it bullshit to aim for 100% actual code coverage? 

Because 100% code coverage [does not mean that there are no more bugs in the code](https://jeroenmols.com/blog/2017/11/28/coveragproblem/#app-coverage).
And because [people would write useless tests to reach that 100%](https://martinfowler.com/bliki/TestCoverage.html).
And for a lot more reasons I'm not going to discuss here. 

So, back to the question: why would I promote to enforce 100% code coverage? 
Let's discuss some criminal psychology! 

## Broken Windows: Cracks in Your Code Coverage

In 1969, Philip Zimbardo, an American psychologist, conducted an experiment where he put an unguarded car
on a street in a New York problem area and another one in a better neighborhood in California.

After a short time, a passerby broke a window of the New York car. Rapidly after the window had been broken,
the car was vandalized completely. 

The car in California wasn't damaged for a couple days, so he smashed a window himself. The same effect occurred
as with the New York car: the car was rapidly vandalized as soon as a broken window was visible.

**This experiment shows that once some sign of disorder is visible, people tend to give in to this disorder**, independent
of their surroundings.

Let's transfer this to our code coverage discussion: **as soon as our code coverage shows cracks,
chances are that developers will not care much if they introduce untested code that further lowers
the code coverage of the code base**.

I have actually observed this on myself.

**Here's where we could argue that we need to enforce 100% actual code coverage so as not to let things slip
due to the [Broken Windows Theory](https://en.wikipedia.org/wiki/Broken_windows_theory)**.

But as stated above: aiming for 100% actual code coverage is bullshit.

So how can we avoid the Broken Windows effect without aiming at 100% actual code coverage?

## Avoid Broken Windows by Excluding False Positives

**The answer is to remove false positives from the actual code coverage**, so 100% code coverage becomes a worthwhile
and meaningful target.

What's a false positive?

> A false positive is a line of code that is not required to be covered with a test
> and is not executed during an automated test run.

If code is not covered by a test, but shows up in a coverage report as "not being covered", it's a false positive.

Again, we can replace "lines of code" with "conditional branches" or another basis for counting.

A false positive in this sense might be:

* a trivial getter or setter method 
* a facade method that solely acts as a trivial forwarding mechanism
* a class or method for which automated tests are considered too costly (not as good a reason as the others)  
* ...

If we have a way to exclude false positives from our actual code coverage, we have a new
coverage metric, which I will call "cleaned code coverage" for lack of a better term:

> Cleaned code coverage is the percentage of lines of code that are 
> required to be covered by a test and that are executed
> during an automated test run.

What have we gained by applying the cleaned code coverage metric instead of the actual code coverage?

## Enforce Cleaned Code Coverage to Keep Coverage High

Granted, 100% cleaned code coverage still doesn't mean that there are no bugs in the code. **But 100%
clean code coverage has a lot more meaning than 100% actual code coverage, because we no longer
have to interpret what it really means**.

Thus, we can aim at 100% and reduce the Broken Windows effect.

**We can even enforce 100% by setting up a test coverage tool to break the build if we don't have 100%
cleaned code coverage** (provided the tool supports excluding false positives).

This way, each time a developer introduces new code that is not covered with tests, a breaking
build will make her aware of missing tests. 

Usually, test coverage tools create a report of which lines of code have not been covered by tests.
The developer can just look at this report and will directly see what part of her newly
introduced code is not covered with tests. **If the report worked with actual code coverage, this information
would be drowned in false positives**!

Looking at the report, the developer can then decide whether she should add a test to cover the code or
if she should mark it as a false positive to be excluded from actual code coverage.

**Excluding lines of code from the cleaned code coverage thus becomes a conscious decision**. This decision is an obstacle that
we don't have when just looking at the actual code coverage and deciding that a reduction in code coverage is OK. 

## Monitor Actual Code Coverage to Find Untested Code

But, as good as our intentions are, it still may happen that due to criminal intent or external pressure we excluded a
little too much code from our code coverage metric. 

In the extreme, we may have 100% cleaned code coverage and 0% actual code coverage (when we defined all code as
false positives). 

**That's why the actual code coverage should still be monitored.**

Cleaned code coverage should be used for automated build breaking to get the developer's attention and reduce
the Broken Windows effect.

Actual code coverage should still be regularly inspected to identify pockets of code that are not tested but perhaps
should be. 

## Tooling

Let's define our requirements for a code coverage tool to support the practice discussed in this article.

The code coverage tool must:

1. allow us to define exclusions / false positives 
2. create a report about cleaned code coverage (i.e. taking into regard the exclusions)
3. create a report about actual code coverage (i.e. disregarding the exclusions)
4. allow to break a build at <100% cleaned code coverage

[JaCoCo](/jacoco) is a tool that supports all of the above bullet points except creating a coverage report
about the actual code coverage when we have defined exclusions.

If you know of a tool that supports all of the above features, let me know in the comments!

## Conclusion

Naively aiming at 100% code coverage is bullshit. 

However, if we allow excluding code 
that doesn't need to be tested from the coverage metric, aiming at 100% becomes much more meaningful and it
becomes easier to keep a high test coverage due to psychological effects. 

What's your take on 100% code coverage?
