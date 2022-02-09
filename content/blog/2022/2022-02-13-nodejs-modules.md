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

Usually we want to split up our code into different files when our code base grows. This way we can not only organize and reuse code in a structured manner.
We can also control in which file which part of the code is accessible. While this is a fundamental part in most programming languages, this was not the case in JavaScript. By default, everything we write in a JavaScript application is global by default. This hasn't been a huge problem in the early beginnings of the language. As soon as developers began to write actual applications, it brought them into real trouble. This why the NodeJS creators initially decided to use a module system by default, which is CommonJS.

## The Default NodeJS Module System (CommonJS)

### Basics

In NodeJS each .js file is handled as a separate CommonJS module. This means, variables, functions, classes, etc. are not accessible to other files by default. You need to explicitly tell the module system, which parts of your code should be exported. This is done via the `module.exports` object or the `exports` shortcut, which are both available in every CommonJS module. Whenever you want to import code into a filem, you use the `require(id)` function. Let's see how this all works together.

### Importing Core NodeJS modules

Without writing or installing any module you can just start by importing any of NodeJS's built-in modules:   

```js
const http = require("http");

const server = http.createServer(function (_req, res) {
  res.writeHead(200);
  res.end("Hello, World!");
});
server.listen(8080);
```

Here we import the http module in order to create a simple NodeJS server. The http module is identified by `require()` via the string "http" which always points to the NodeJS internal module. See, how the result of `require("http")` is just handled like every other function invocation. It is basically written to the local constant `http`. But you can name it however you want to.

### Importing NPM dependencies

The same way you can import and use modules from NPM packages (aka the `node_modules` folder):

```js
const chalk = require("chalk");

console.log(chalk.blue("Hello world printed in blue"));
```

### Exporting and Importing own code

To import your own code you first need to tell CommonJS which aspects of your code should by accessible by other modules. Let's assume we want to write our own logging function to make logs look a bit more colorful:

```js
// logger.js
const chalk = require("chalk");

exports.logInfo = function (message) {
  console.log(chalk.blue(message));
};

exports.defaultMessage = "Hello World";
```

Again, we import chalk which will colorize the log output. Then we add `logInfo` to the existing `exports` object, which makes it accesible to other modules. Also we add `defaultMessage` with the string "Hello World" to `exports` only to demonstrate, that exports can have various types. Now we want to use those in our index file:

```js
// index.js
const logger = require("./logger");

logger.logInfo(`${logger.defaultMessage} printed in blue`);
```

As you can see, `require()` now receives a relative file path and returns whatever was put into the `exports` object.

### Using `module.exports` instead of `exports`

The `exports` object is readonly, which means it will always remain the same object instance and cannot be overwritten. However, it is only a shortcut to the `exports` property of the `module` object. We could rewrite our logger module like this:

```js
// logger.js
const chalk = require("chalk");

const defaultMessage = "Hello World";

function logInfo(message) {
  console.log(chalk.blue(message));
}

function logError(message) {
  console.log(chalk.red(message));
}

module.exports = {
  defaultMessage,
  info: logInfo,
  error: logError,
};
```

For demonstration purposes we changed a few bits... TODO




- export and require an object with a function
- require with object destructuring

### Exporting Not Only Objects
- export and require other things, e.g. a class instance


{{% info title="Are `module.exports` and `require` Global Keywords?" %}}
Altough it seems like `module.exports`, `exports` and `require` are global, actually they are not. CommonJS wraps your code in a function like this:
```js
(function(exports, require, module, __filename, __dirname) {
    // your code lives here
});
```
This way those keywords are always module specific. Have a look into the [NodeJS modules documentation](https://nodejs.org/api/modules.html) to get a better understanding of the different function parameters.
{{% /info %}}

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