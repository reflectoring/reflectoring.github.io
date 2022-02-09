---
title: "How to Use Modules in Your Nodejs Application?"
categories: ["NodeJS"]
date: 2022-02-13 00:00:00 +1100 
modified: 2022-02-13 00:00:00 +1100
authors: ["robert"]
description: "A **module system** allows you to split up your code in different parts or to include code written by other developers. We are going to have a look into CommonJS and ES Modules."
image: images/stock/0116-post-its-1200x628-branded.jpg
url: nodejs-modules-systems
---

A **module system** allows you to split up your code in different parts or to include code written by other developers. Since the very beginning of NodeJS the **CommonJS module system** is the default module system within the eco system. However, recently a new module system was added to NodeJS - **ES modules**. We are going to have a look on both of them, discuss why we need a new module system in the first place and when to use which.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/modules" %}}

### Why Do We Need a Module System in Nodejs?

- Why modules? (as short as possible)
    - everything global in JS by default (is a bad idea for larger apps)
    - modules for splitting and reusing code

## Default Module System (CommonJS)

### Basics

- each .js file is handled as a separate module
- import modules via require()
- export modules via exports or module.exports

### Usage

- requiring core Node modules (e.g. 'fs')
- requiring Node modules (from node_modules folder)
- export and require a single function
- export and require an object with a function
- export and require other things, e.g. a class instance
- require with object destructuring

## The New JavaScript Standard (ES Modules)

### Why another option for imports?

- What is CommonJS and why does it exist?
    - CommonJS was chosen by NodeJS as the default module system when JS had no own module system
- Why ES Modules?
    - JS has grown and is now used in large applications
    - standardized module system for the JS language

### Usage

- import keyword
- export keyword
- export default keyword
- import default (import { default as someName } from ... and import someName from ...)
- TODO: named import (import * as)
- TODO: import CommonJS modules from ES Module


## Differences to notice

### File Extensions
- .js is treated as CommonJS and is NodeJS default
- .mjs flags file as ES Module
- .js files cannot require .mjs files (https://nodejs.org/api/modules.html#the-mjs-extension)
- .mjs files can import both
- file extension is mandatory in ES Module imports (as opposed to e.g. in CommonJS, Webpack or TypeScript)

### Dynamic vs. Static
- imports only on top of file vs. require() can be called everywhere (a bit advanced but good to know -> maybe info box?)
    - require is dynamic / executed at runtime
        - pros: can be called everywhere in your code
    - import is static / executed at parse time
        - imports are hoisted / always automatically moved to the top of the file 
        - pros: errors can be caught upfront, tools can better support
        - dynamic import() as option

## When to Use Which?

- ES Modules are standardized since ES 2015 (https://tc39.es/ecma262/#sec-modules)
- ES Modules are stable in Node since version 14 (Release: 2020-04-21)
- no pressure to migrate existing code
    - CommonJS is still the standard
    - there is no deprecation of CommonJS
    - however, tools (such as Babel) can be used to write ES Modules Syntax but use CommonJS under the hood as possible migration path
- suggested to use ESM on new projects because it is now the language standard

## What Did We Learn?
- short conclusion