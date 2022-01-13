---
authors: [tom]
title: "Laws and Principles of Software Development"
categories: ["Software Craft"]
date: 2021-10-31T06:00:00
modified: 2021-10-31T06:00:00
excerpt: "Read about the most often cited laws and principles in software development and what we can learn from them."
image: images/stock/0111-hammer-1200x628-branded.jpg
url: laws-and-principles-of-software-development
---

In discussions around software development, it's almost impossible to avoid quoting a law or two.

"This won't work because of 'The Law of X'!" you might have heard people say. Or "Don't you know 'The Y Principle'? What kind of software developer are you?".

There are many laws and principles to quote and most of them are based on truth. Applying them blindly using absolute statements like above is a sure path toward bruised egos and failure, however.

This article enumerates some of the most popular laws and principles that can be applied to software development. For each law, we will quickly discuss its main proposition and then explore how we can apply it to software development (and maybe when we shouldn't).

## Pareto Principle (80/20 Rule)
### What Does It Mean?

The Pareto Principle states that more often than not **80% of the results come from 20% of the causes**. The numbers 80 and 20 are not exact by any means, but the general idea of the principle is that the results are often not evenly distributed.

We can observe this rule in many areas of life, for example:

- the world's richest 20% make 80% of the world's income,
- 80% of crimes are commited by 20% of the criminals, and
- since 2020 we know that 80% of virus transmissions come from 20% of the infected population.

### How Does It Help in Software Development?

The main benefit we can take from the Pareto Principle is focus. It can help us to focus on the important things (the 20%) instead of wasting time and effort on the unimportant things (the other 80%). The unimportant things often seem important to us because there are so many (and they seem urgent). But the best results are often achieved by focusing on the important few.

In software development, we can use it to put our focus on building the right features, for example:

- focus on the 20% of product features that make up 80% of the product's value,
- focus on the 20% of the bugs that cause 80% of user frustration,
- focus on the 80% of product features take 20% of the total time to build,
- ...

Just asking "what is the most important thing to build right now?" can help to build the next most important thing instead of the next most urgent thing.

Modern development methodologies like Agile and DevOps help in gaining that focus, by the way! Quick iterations with regular user feedback allow for data-driven decisions on what is important. Practices like trunk-based development with feature-flagging (for example with [LaunchDarkly](https://launchdarkly.com)) help software teams to get there.

## Broken Windows Theorem

### What Does It Mean?
A broken window invites vandalism so that it doesn't take long until all windows are broken.

In general: **chaos invites more chaos**.

If our environment is pristine, we are motivated to keep it that way. The more chaos creeps into the environment, the lower is our threshold to add to the chaos. After all there is already chaos ... who cares if we add a bit more to it?

The main benefit we can take from this rule is that we should be aware of the chaos around us. If it reaches a level where people get so used to it that they don't care about it anymore, it might be best to bring some order into the chaos.

### How Does It Help in Software Development?

In software development, we can apply it to code quality: every code smell we let into our codebase reduces our threshold to add more code smells. We should [[Start Clean]] and keep the code base clean to avoid this from happening. The reason that many codebases are so hard to understand and maintain is that a Broken Window has crept in and hasn't been fixed quickly enough.

We can apply the principle to test coverage as well: as soon as a certain amount of code has crept into the codebase that is not covered with tests, more uncovered code will be added. This is an argument to maintain [100% code coverage](https://reflectoring.io/100-percent-test-coverage/) (of the code that *should* be covered) so we can see the cracks before a window breaks.


## Occam's Razor
### What Does It Mean?
A philosophical razor is a principle that helps to explain certain things by eliminating (or "shaving off") unlikely explanations.

Occam's Razor states that if there are multiple hypotheses, **we should choose the hypothesis with the fewest assumptions** (which will most likely be the hypothesis with the simples explanation).

### How Does It Help in Software Development?
We can apply Occam's Razor in incident analysis. You probably have been there: a user reported an issue with your app, but you have no clue what caused the issue. So you're searching through logs and metrics, trying to find the root cause.

The next time a user reports an error, maintain an incident investigation document. Write down your hypotheses for what caused the issue.
Then, for each hypothesis, list the facts and assumptions. If an assumption proved true, label it as a fact. If an assumption proved false, remove it from the document or label it as false. At any time, you can now focus your time on the most probable hypothesis, instead of wasting time chasing red herrings.

## Dunning-Kruger Effect
### What Does It Mean?
The Dunning-Kruger Effect states that **inexperienced people tend to overestimate their abilities and experienced people tend to underestimate their abilities**.

If you're bad at something you think you're good at it. If you're good at something, you think you're bad at it - this can result in Impostor Syndrome which makes you doubt your own abilities so much that you're uncomfortable among other people with similar skill - unnecessarily afraid to be exposed as a fraud.

### How Does It Help in Software Development?
Being aware of this cognitive bias is a good step in the right direction already. It will help you evaluate your own skills better so that you can either ask for help, or overcome your self-doubts and do it yourself.

**A practice that helps to dull the Dunning-Kruger Effect and Impostor Syndrome is pair or mob programming**. Instead of working by yourself, basking in your self-doubts or thoughts of superiority, you work closely with other people, exchanging ideas, learning and teaching while you work.

This only works in a safe environment, though. In an environment where individualism is glorified, pair or mob programming can lead to increased self-doubts or increased delusions of superiority.

## Peter Principle
### What Does It Mean?
The Peter Principle states that **you are promoted as long as your are successful until you end up with a job in which you are incompetent**. Since you are not successful anymore, you will not be promoted any more, meaning you will live with a job that doesn't bring you satisfaction or success, often for the rest of your working life.

A grim outlook.

### How Does It Help in Software Development?

In software development, the Peter Principle often applies when you switch roles from a developer career into a management career. Being a good developer doesn't necessarily mean that you are a good manager, however. Or you might be a good manager, but just don't derive the satisfaction from the manager job that you got from the developer job, meaning that you don't put all your effort into it (this was the case for me). In any case, you're miserable and don't see any future growth in the career path ahead of you.

In this case, take a step back and decide what you want your career to look like. Then, switch roles (or companies, if need be) to get the role you want.

## Parkinson's Law
### What Does It Mean?
Parkinson's Law states that **work will always fill the time that is allotted for it**. If your project has a deadline in two weeks, the project will not be finished before then. It may take longer, yes, but never less than the time we allotted for it, because we're filling the time with unnecessary work or procrastination.

### How Does It Help in Software Development?
The main drivers of Parkinson's Law are:

- procrastination ("the deadline is so far away, so I don't need to hustle right now..."), and
- scope creep ("sure, we can add this little feature, it won't cost us too much time...").

To fight procrastination, we can [set deadlines in days instead of weeks or months](https://www.atlassian.com/blog/productivity/what-is-parkinsons-law). What needs to be done in the next 2-3 days to move towards the goal? A (healthy!) deadline can give us the right amount of motivation to not fall into a procrastination slump.

To keep scope creep at bay, we should have a very clear picture of what we're trying to achieve with the project. What are the metrics for success? Does this new feature add to those metrics? Then we should add it if everybody understands that the work will take longer. If the new feature doesn't match the mission statement, leave it be.

## Hofstadter's Law
### What Does It Mean?
Hofstadter's law states that **"It always takes longer than you expect, even when you take into account Hofstadter's Law".

Even when you know about this law, and increase the allotment of time for a project, it will still take longer than you expect. This is closely related to Parkinson's Law, which says that work will always fill the time allotted for it. Only that Hofstadter's law says that it fill more than the time allotted.

This law is backed by psychology. We're prone to the so-called "Planning Fallacy" that states that when estimating work we usually don't take all available information into account, even if we think we did. Our estimates are almost always subjective and very seldom correct.

### How Does It Help in Software Development?

In software development (and in any other project-based work, really), our human optimism gets the best of us. Estimates are almost always too optimistic.

To reduce the effect of Hofstadter's law, we can try to make an estimate as objective as possible.

Write down assumptions and facts about the project. Mark each item as an assumption or a fact to make the quality of the data visible and manage expectations.

Don't rely on gut feel, because it's different for each person. Write down estimates to get your brain thinking about them. Compare them with estimates from other people and then discuss the differences.

Even then, it's still just an estimate that very likely does not reflect reality. If an estimate is not based on statistics or other historical data, it has a very low value, so it's always good to manage expectations with whoever asked you for an estimate - it's always going to be wrong. It's just going to be less wrong if you make it as objective as possible.

## Conway's Law
### What Does It Mean?

Conway's Law states that **any system created by an organization will resemble this organization's team and communication structure**. The system will have interfaces where the teams building the system have interfaces. If you have 10 teams working on a system, you'll most likely get 10 subsystems that communicate with each other.

### How Does It Help in Software Development?
We can apply what is called the [Inverse Conway Maneuver](https://www.thoughtworks.com/radar/techniques/inverse-conway-maneuver): create the organizational structure that best supports the architecture of the system we want to build.

Don't have a fix team structure, but instead be flexible enough to create and disband teams as is best for the current state of the system.

## Murphy's Law
### What Does It Mean?
Murphy's well-known law says that **whatever can go wrong, will go wrong**. It's often cited after something unexpected happened.

### How Does It Help in Software Development?
Software development is a profession where a lot of things go wrong. The main source of things going wrong are bugs. There is no software that doesn't have bugs or incidents that test the users' patience.

We can defend against Murphy's Law by building habits into our daily software development practices that reduce the effect of bugs. We can't avoid bugs altogether, but we can and should reduce their impact to the users.

The most helpful practice to fight Murphy’s Law is feature flagging. If we use a feature flagging platform like [LaunchDarkly](https://launchdarkly.com), we can deploy a change into production behind a feature flag. Then, we can use a targeted rollout to activate the flag for internal dogfooding before activating it for a small number of friendly beta users and finally releasing it to all users. This way, we can get feedback about the change from increasingly critical user groups. If a change goes wrong (and it will, at some point), the impact is minimal, because only a small user group will be affected by it. And, the flag can be quickly toggled off.

## Brook's Law
### What Does It Mean?
In the classic book "The Mythical Man Month", Fred Brook famously states that **adding manpower to a late project makes it later**.

Even though the book is talking about software projects, it applies to most kinds of projects, even outside of software development.

The reason that adding people doesn't increase the velocity of a project is that projects have a communication overhead that increases exponentially with each person that is added to the project. Where 2 people have 1 communication path, 5 people already have 5! = 120 possible communication paths. It takes time for new people to settle in and identify the communication paths they need, which is why a late project will be later when adding new people to the project.

### How Does It Help in Software Development?

Pretty simple. Change the deadline instead of adding people to an already late project.

Be realistic about the expectations of adding new people to a software project. Adding people to a project probably increases the velocity at some point, but not always, and certainly not immediately. People and teams need time to settle into a working routine and at some point work just can't be parallelized enough so adding more people doesn't make sense. Think hard about what tasks a new person should do and what you expect when adding that person to a project.

## Postel's Law
### What Does It Mean?
Postel's law is also called the robustness principle and it states that you should "**be conservative in what you do and liberal in what you accept from others"**.

In other words, you can accept data in many different forms to make your software as flexible as possible, but you should be very careful in working with that data, so as not to compromise your software due to invalid or hostile data.

### How Does It Help in Software Development?
This law originates from software development, so it's very directly applicable.

Interfaces between your software and other software or humans should allow different forms of input for robustness:

- for backwards compatibility, a new version of the interface should accept the data in the form of the old version as well as the new,
- for better user experience, a form in a UI should accept data in different formats so that the user doesn't have to worry about the format.

However, if we are liberal in accepting data in different formats, we have to be conservative in processing this data. We have to vet it for invalid values and make sure that we don't compromise the security of our system by allowing too many different formats. SQL injection is one possible attack which is enabled by being too liberal with user input.

## Kerchkhoff's Principle
### What Does It Mean?
Kerchkhoff's principle states that **a crypto system should be secure, even if its method is public knowledge**. Only the key you use to decrypt something should need to be private.

### How Does It Help in Software Development?
It's simple, really. Never trust a crypto system that requires its method to be private. This is called "security by obscurity". A system like that is inherently insecure. Once the method is exposed to the public, it's vulnerable to attacks.

Instead, rely on publicly vetted and trusted symmetric and asymmetric encryption systems, implemented in open-source packages that can be publicly reviewed. Everyone who wants to know how they work internally can just look at the code and validate if they're secure.

## Linus's Law
### What Does It Mean?
In his book "The Cathedral & the Bazaar" about the development of the Linux Kernel, Eric Raymond wrote that "**given enough eyballs, all bugs are shallow**". He called this "Linus's Law" in honor of Linus Torvalds.

The meaning is that bugs in code can be better exposed if many people look at the code than if few people look at the code.

### How Does It Help in Software Development?
If you want to get rid of bugs, have other people look at your code.

A common practice that stems from the open source community is to have a developer raise a pull request with the code changes, and then have other developers review that pull request before it is merged into the main branch. This practice has found its way into closed-source development as well, but according to Linus's law, pull requests are less helpfpul in a closed-source environment (where only a few people look at it) than in an open-source environment (where potentially a lot of contributors look at it).

Other practices to add more eyeballs to code are pair programming and mob programming. At least in a closed-source environment, these are more effective in avoiding bugs than a pull request review, because everyone takes part in the inception of the code, which gives everyone a better context to understand the code and potential bugs.

## Wirth's Law
### What Does It Mean?
Wirth's law states that **software is getting slower more rapidly than hardware is getting faster**.

### How Does It Help in Software Development?

Don't rely on the hardware being powerful enough to run badly-performing code. Instead, write code that is optimized to perform well.

This has to be balanced against the adage of [[Laws of Software Development#Knuth's Optimization Principle]], which is saying that "premature optimization is the root of all evil". Don't spend more energy on making code run fast than you spend on building new features for your users.

As so often, this is a balancing act.

## Knuth's Optimization Principle
### What Does It Mean?
In one of his works, Donald Knuth wrote the sentence "**premature optimization is the root of all evil**", which is often taken out of context and used as an excuse not to care about optimizing code at all.

### How Does It Help in Software Development?
According to Knuth's law, we should not waste effort to optimize code prematurely. Yet, according to Wirth's law, we also should not rely on hardware being fast enough to execute badly optimized code.

In the end, this is what I take away from these principles:

- optimize code where it can be done easily and without much effort: for example, write a couple lines of extra code to avoid going through a loop of potentially a lot of items
- optimize code in code paths that are executed all the time
- other than that, don't put a lot of effort in optimizing code, unless you've identified a performance bottleneck.

## Stay Doubtful

Laws and principles are good to have. The allow us to evaluate certain situations from a certain perspective that we might not have had without them.

Blindly applying laws and principles to every situation won't work however. Every situation brings subtleties that may mean that a certain principle cannot or should not be applied.

Stay doubtful about the principles and laws you encounter. The world is not black and white.

