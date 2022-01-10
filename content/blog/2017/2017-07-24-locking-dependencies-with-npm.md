---
authors: [tom]
title: Locking transitive Dependencies with NPM 
categories: ["WIP", "Node.js"]
date: 2017-07-24
excerpt: "A tutorial on how to lock the version of your NPM dependencies to create a reproducible build."
image: images/stock/0044-lock-1200x628-branded.jpg
url: locking-dependencies-with-npm
---



As a developer I am [lazy](http://blogoscoped.com/archive/2005-08-24-n14.html). I don't build everything by myself
because others have done it already. So, when I come upon a problem someone has already solved and that someone
put that solution into some library, I simply pull that library into my own - I declare a dependency to that library.

This post describes an important caveat when declaring "soft" dependencies using NPM and how to lock these dependencies
to avoid problems.
 
## `package.json`
In the javascript world, NPM is the de-facto standard package manager which takes care of pulling my
dependencies from the web into my own application. Those dependencies are declared in a file called `package.json`
and look like this (example from an angular app):
 
```json
"dependencies": {
    "@angular/animations": "~4.2.4",
    "@angular/common": "^4.0.0",
    ...
  }
```

## Unstable Dependencies

In the `package.json` you can declare a dependency using certain matchers:

* `"4.2.4"` matches exactly version 4.2.4
* `"~4.2.4` matches the latest 4.2.x version
* `"^4.2.4` matches the latest 4.x.x version
* `"latest"` matches the very latest version
* `">4.2.4"` / `"<=4.2.4"` matches the latest version greater than / less or equal to 4.2.4)
* `*` matches any version.

Matchers like `~` and `^` provide a mechanism to declare a dependency to a *range* of versions instead of a 
*specific* version. This can be very dangerous, since the maintainer of your dependency might update to a version that does no longer work
with your application. The next time you build your app, it might fail - and the reasons for that failure will be
very hard to find.

## Stable Dependencies with `package-lock.json`

Each time I create a javascript app whose dependencies are managed by NPM, 
the first thing I'm doing is to remove all matchers in `package.json` and define the *exact* versions 
of the dependencies I'm using.
 
Sadly, that alone does not solve the "unstable dependencies" problem. My dependencies can have their own dependencies.
And those may have used one of those matchers to match a version *range* instead of a *specific* version. Thus, even though
I declared explicit versions for my direct dependencies, versions of my transitive dependencies might change
from one build to another.

To lock even the versions of my transitive dependencies to a *specific* version, NPM has introduced 
[package locks](https://docs.npmjs.com/files/package-locks) with version 5.

When calling `npm install`, npm automatically generates a file called `package-lock.json` which contains all
dependencies with the specific versions that were resolved at the time of the call. Future calls of `npm run build`
will then use those specific versions instead of resolving any version ranges. 

Simply check-in `package-lock.json` into version control and you will have stable builds.

## Not Working?
NPM doesn't generate a `package-lock.json`? Or the versions in `package-lock.json` are not honored when calling
`npm run build`? Make sure that your NPM version is 5 or above and if it isn't, call `npm install npm@latest`
(you may also provide a *specific* version to `npm install`, if you prefer :)).
