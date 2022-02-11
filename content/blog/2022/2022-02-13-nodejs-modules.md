---
title: "How to Use Modules in Your Nodejs Application?"
categories: ["NodeJS"]
date: 2022-02-13 00:00:00 +1100 
modified: 2022-02-13 00:00:00 +1100
authors: ["robert"]
description: "A **module system** allows you to split up your code in different parts or to include code written by 
other developers. We are going to have a look into CommonJS and ES Modules."
image: images/stock/0116-post-its-1200x628-branded.jpg
url: nodejs-modules-systems
---

A **module system** allows you to split up your code in different parts or to include code written by other developers. 
Since the very beginning of NodeJS the **CommonJS module system** is the default module system within the ecosystem. 
However, recently a new module system was added to NodeJS - **ES modules**. We are going to have a look on both of them, 
discuss why we need a new module system in the first place and when to use which.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/modules" %}}

### Why Do We Need a Module System in Nodejs?

Usually we want to split up our code into different files as soon as our code base grows. This way we can not only 
organize and reuse code in a structured manner. We can also control in which file which part of the code is accessible. 
While this is a fundamental part in most programming languages, this was not the case in JavaScript. Everything we write 
in JavaScript is global by default. This hasn't been a huge issue in the early beginnings of the language. 
As soon as developers began to write full-blown applications, it brought them into real trouble. This is why the NodeJS 
creators initially decided to include a default module system, which is CommonJS.

## The Default NodeJS Module System (CommonJS)

### Basics

In NodeJS each .js file is handled as a separate CommonJS module. This means, variables, functions, classes, etc. are 
not accessible to other files by default. You need to explicitly tell the module system, which parts of your code should 
be exported. This is done via the `module.exports` object or the `exports` shortcut, which are both available in every 
CommonJS module. Whenever you want to import code into a file, you use the `require(id)` function. Let's see how this 
all works together.

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

Here we import the http module in order to create a simple NodeJS server. The http module is identified by `require()` 
via the string "http" which always points to the NodeJS internal module. See, how the result of `require("http")` is 
just handled like every other function invocation. It is basically written to the local constant `http`. You can 
name it however you want to.

### Importing NPM dependencies

The same way you can import and use modules from NPM packages (aka the `node_modules` folder):

```js
const chalk = require("chalk"); // don't forget to install

console.log(chalk.blue("Hello world printed in blue"));
```

### Exporting and Importing own code

To import your own code you first need to tell CommonJS which aspects of your code should be accessible by other modules. 
Let's assume we want to write our own logging module to make logs look a bit more colorful:

```js
// logger.js
const chalk = require("chalk");

exports.logInfo = function (message) {
    console.log(chalk.blue(message));
};

exports.logError = function logError(message) {
    console.log(chalk.red(message));
};

exports.defaultMessage = "Hello World";
```

Again, we import chalk which will colorize the log output. Then we add `logInfo` and `logError` to the existing `exports` 
object, which makes it accessible to other modules. Also, we add `defaultMessage` with the string "Hello World" only to 
demonstrate, that exports can have various types. Now we want to use those in our index file:

```js
// index.js
const logger = require("./logger");

logger.logInfo(`${logger.defaultMessage} printed in blue`);
logger.logError("some error message printed in red");
```

As you can see, `require()` now receives a relative file path and returns whatever was put into the `exports` object.

### Using `module.exports` instead of `exports`

The `exports` object is readonly, which means it will always remain the same object instance and cannot be overwritten. 
However, it is only a shortcut to the `exports` property of the `module` object. We could rewrite our logger module like 
this:

```js
// logger.js
const chalk = require("chalk");

function info(message) {
    console.log(chalk.blue(message));
}

function error(message) {
    console.log(chalk.red(message));
}

const defaultMessage = "Hello World";

module.exports = {
    logInfo: info,
    logError: error,
    defaultMessage,
};

```
Now, instead of assigning functions directly to an object, we first declare everything and then create our own object,
which is assigned to `module.exports`. Note, that we have rewritten the internal function names from `logInfo` and 
`logError` to `info` and `error` respectively. This way we can truly separate the internal from the external API. 
However, the code often is simpler and more approachable if we keep internal and external naming the same.

{{% info title="Are `module.exports` and `require` Global Keywords?" %}}
Altough it seems like `module.exports`, `exports` and `require` are global, actually they are not. CommonJS wraps your
code in a function like this:
```js
(function(exports, require, module, __filename, __dirname) {
    // your code lives here
});
```
This way those keywords are always module specific. Have a look into the
[NodeJS modules documentation](https://nodejs.org/api/modules.html) to get a better understanding of the different
function parameters.
{{% /info %}}

### Importing Only Specific Properties

Often we only need certain aspects of the code we import. In this case we can make use of JavaScript's
[destructuring feature](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#object_destructuring):

```js
// index.js
const { logError } = require("./logger");

logError("some error message printed in red");
```

This basically says "Give me the property `logError` of the logger object and assign it a local constant with the same 
name". This might make our code look a bit cleaner.

### Exporting Not Only Objects

So far we only exported objects. What if we want to export something different? No problem! We can assign any type 
to `module.export`. For example, we can rewrite our logger to be a class:

```js
// logger.js
const chalk = require("chalk");

class Logger {
  static defaultMessage = "Hello World";

  static info(message) {
    console.log(chalk.blue(message));
  }

  static error(message) {
    console.log(chalk.red(message));
  }
}

module.exports = Logger;
```

As we changed the function names a bit, we need to modify our index file a bit:

```js
// index.js
const Logger = require("./logger");

Logger.info(`${logger.defaultMessage} printed in blue`);
Logger.error("some error message printed in red");
```

We also clarify that we are using a class by capitalizing its name.

Looks like we can now write clean and modular NodeJS code with the help of CommonJS. Why on earth do we need any other 
module system? Rest assured that there is a good reason for this...

## The New JavaScript Standard (ES Modules)

### Why Another Option for Imports?

As we already learned, CommonJS was initially chosen to be the default module system for NodeJS. At this time there was
no such thing as a built-in module system in JavaScript. Thanks to the enormous growth of the world-wide JavaScript 
usage, the language evolved a lot. Since the 2015 edition of the underlying standard (ES2015) we actually have a 
standardized module system in the language itself, which is simply called ES Modules. It took a while before the browser
vendors and the NodeJS maintainers actually implemented the standard. This was the case for NodeJS with version 14, 
when it first was stable. So, let's just dive into it!

### Export with ES Modules

To preserve comparability, we stay with our logging example. We need to rewrite it like this:

```js
// logger.mjs
import chalk from "chalk";

export class Logger {
  static defaultMessage = "Hello World";

  static info(message) {
    console.log(chalk.blue(message));
  }

  static error(message) {
    console.log(chalk.red(message));
  }
}
```

Instead of the `require()` function for importing modules, we now use a specific import syntax. Also, instead of a 
specific `module` object, we now use the `export` keyword in front of our class declaration. This tells the compiler,
which parts of the file should be accessible by other files. 

### Import with ES Modules

We need to change our index file as well:

```js
// index.mjs
import { Logger } from "./logger.mjs";

Logger.info(`${Logger.defaultMessage} printed in blue`);
Logger.error("some error message printed in red");
```

Note, how we use a slightly different import syntax compared to the logger file. Similar to the above-mentioned object 
destructuring, we explicitly choose the property we want to import from the logger module. While this was more of a 
special case with CommonJS, this is much more often seen with ES Modules.

### Exports vs. Default Exports

One reason, why this might be seen more often is the way how JavaScript separates between usual and default exports. 
You as an implementer may choose one specific declaration to be the default export of your module:

```js
export default class Logger {...}
```

If you put the `default` keyword behind any `export`, you basically say "treat this as the thing every module gets, 
if it doesn't ask for something specific". You can (but are not forced to) import it by leaving out the curly brackets:

```js
import Logger from "./logger.mjs";
```

As a consequence, you cannot declare more than one part of your code as the default export. 

However, you might declare no default at all. In this case every other module needs to explicitly specify what it wants 
to import just the way we have seen above.

### Exporting Not Only Objects

TODO:
- export and import not only objects
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