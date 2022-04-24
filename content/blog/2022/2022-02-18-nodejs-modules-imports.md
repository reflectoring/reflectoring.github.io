---
title: "CommonJS vs. ES Modules: Modules and Imports in NodeJS"
categories: ["Node"]
date: 2022-02-18 00:00:00 +1100 
modified: 2022-02-18 00:00:00 +1100
authors: ["robert"]
description: "A **module system** allows you to split up your code in different parts or to include code written by 
other developers. We are going to have a look into CommonJS and ES Modules."
image: images/stock/0118-module-1200x628-branded.jpg
url: nodejs-modules-imports
---

A **module system** allows us to split up our code in different parts or to include code written by other developers. 

Since the very beginning of NodeJS, the **CommonJS module system** is the default module system within the ecosystem. 
However, recently a new module system was added to NodeJS - **ES modules**. 

We are going to have a look at both of them, 
discuss why we need a new module system in the first place and when to use which.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/modules" %}}

## Why Do We Need a Module System in NodeJS?

Usually, we want to split up our code into different files as soon as our code base grows. This way, we can not only 
organize and reuse code in a structured manner. We can also control in which file which part of the code is accessible. 

While this is a fundamental part in most programming languages, this was not the case in JavaScript. Everything we write 
in JavaScript is global by default. This hasn't been a huge issue in the early beginnings of the language. 
As soon as developers began to write full-blown applications in JavaScript, however, it got them into real trouble. 

This is why the NodeJS 
creators initially decided to include a default module system, which is CommonJS.

## CommonJS: The Default NodeJS Module System

In NodeJS each `.js` file is handled as a separate CommonJS module. This means that variables, functions, classes, etc. are 
not accessible to other files by default. You need to explicitly tell the module system which parts of your code should 
be exported. 

This is done via the `module.exports` object or the `exports` shortcut, which are both available in every 
CommonJS module. Whenever you want to import code into a file, you use the `require()` function. Let's see how this 
all works together.

### Importing Core NodeJS Modules

Without writing or installing any module, you can just start by importing any of NodeJS's built-in modules:   

```js
const http = require("http");

const server = http.createServer(function (_req, res) {
  res.writeHead(200);
  res.end("Hello, World!");
});
server.listen(8080);
```

Here we import the http module in order to create a simple NodeJS server. The http module is identified by `require()` 
via the string "http" which always points to the NodeJS internal module. 

Note how the result of `require("http")` is 
handled like every other function invocation. It is basically written to the local constant `http`. We can 
name it however we want to.

### Importing NPM Dependencies

The same way, we can import and use modules from NPM packages (i.e. from the `node_modules` folder):

```js
const chalk = require("chalk"); // don't forget to run npm install

console.log(chalk.blue("Hello world printed in blue"));
```

### Exporting and Importing Your Own Code

To import our own code, we first need to tell CommonJS which aspects of our code should be accessible by other modules. 
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

Again, we import chalk which will colorize the log output. Then we add `logInfo()` and `logError()` to the existing `exports` 
object, which makes them accessible to other modules. Also, we add `defaultMessage` with the string "Hello World" only to 
demonstrate that exports can have various types. 

Now we want to use those exported artifacts in our index file:

```js
// index.js
const logger = require("./logger");

logger.logInfo(`${logger.defaultMessage} printed in blue`);
logger.logError("some error message printed in red");
```

As you can see, `require()` now receives a relative file path and returns whatever was put into the `exports` object.

### Using `module.exports` Instead of `exports`

The `exports` object is read-only, which means it will always remain the same object instance and cannot be overwritten. 
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
which is assigned to `module.exports`. 

Note that we have rewritten the internal function names from `logInfo` and 
`logError` to `info` and `error` respectively. This way, we can truly separate the internal from the external API. 
However, the code is often simpler and more approachable if we keep internal and external naming the same.

{{% info title="Where Do `module.exports` and `require()` Come From?" %}}
Although at first glance it may seem like `module.exports`, `exports` and `require` are global, actually they are not. 
CommonJS wraps your code in a function like this:
```js
(function(exports, require, module, __filename, __dirname) {
    // your code lives here
});
```
This way, those keywords are always module specific. Have a look into the
[NodeJS modules documentation](https://nodejs.org/api/modules.html) to get a better understanding of the different
function parameters.
{{% /info %}}

### Importing Only Specific Properties

Typically, we only need certain aspects of the code we import. In this case, we can make use of JavaScript's
[destructuring feature](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#object_destructuring):

```js
// index.js
const { logError } = require("./logger");

logError("some error message printed in red");
```

This basically says "give me the property `logError` of the logger object and assign it a local constant with the same 
name". This might make our code look a bit cleaner.

### Exporting Not Only Objects

So far, we only exported objects. What if we want to export something different? No problem. We can assign any type 
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

As we changed the function names a bit, we need to modify our index file:

```js
// index.js
const Logger = require("./logger");

Logger.info(`${logger.defaultMessage} printed in blue`);
Logger.error("some error message printed in red");
```

We also clarify that we are using a class by capitalizing its name.

Looks like we can now write clean and modular NodeJS code with the help of CommonJS. Why on earth do we need any other 
module system? Rest assured that there is a good reason for this.

## ES Modules: The ECMAScript Standard

So, why would we need another option for imports?

As we already learned, CommonJS was initially chosen to be the default module system for NodeJS. At this time there was
no such thing as a built-in module system in JavaScript. Thanks to the enormous growth of the world-wide JavaScript 
usage, the language evolved a lot. 

Since the 2015 edition of the underlying ECMAScript standard (ES2015) we actually 
have a standardized module system in the language itself, which is simply called ES Modules.

It took a while before the 
browser vendors and the NodeJS maintainers actually fully implemented the standard. This was finally the case for NodeJS with 
version 14, when it first got stable. So, let's just dive into it!

### Export with ES Modules

To preserve comparability, we stay with our logging example. We need to rewrite our `Logger` class example like this:

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

Instead of the `require()` function for importing modules, we now use a specific `import` syntax. 

Also, instead of a 
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

One reason why this might be seen more often is the way how JavaScript separates between usual and default exports. 
We as implementers may choose one specific declaration to be the default export of your module:

```js
export default class Logger {...}
```

If we put the `default` keyword behind any `export`, we basically say "treat this as the thing every module gets, 
if it doesn't ask for something specific". We can (but are not forced to) import it by leaving out the curly brackets:

```js
import Logger from "./logger.mjs";
```

As a consequence, we cannot declare more than one part of our code as the default export. 

However, we might declare no default at all. In this case, we cannot use the default import syntax. The most obvious 
solution is then to explicitly specify what we want to import, just the way we have seen above. 

### Named Imports

There is another import option. We can simply say "give me everything the module exports and give it the namespace xyz".
To demonstrate this, we move the `defaultMessage` from the class to an exported constant declaration.

```js
// logger.mjs
import chalk from "chalk";

export const defaultMessage = "Hello World";

export class Logger {
  static info(message) {
    console.log(chalk.blue(message));
  }

  static error(message) {
    console.log(chalk.red(message));
  }
}
```

Now we export two declarations from our file: `defaultMessage` and `Logger`, none of them is a default export. If we 
still want to import all of it, we would use a named import:

```js
// index.mjs
import * as LoggerModule from "./logger.mjs"

LoggerModule.Logger.info(`${LoggerModule.defaultMessage} printed in blue`);
LoggerModule.Logger.error("some error message printed in red");
```

This way, everything from `logger.mjs` is put into a namespace with the name `LoggerModule`. Often we see this syntax as
a fallback solution for imports from non ES Modules files.

{{% info title="Named Default Imports" %}}
The default import we used above actually is also a named import:
```js
import Logger from "./logger.mjs";
```
Under the hood, this is a shortcut for:
```js
import { default as Logger } from "./logger.mjs";
```
Anyway, most times we use the shortcut as it is simpler to read and follow.
{{% /info %}}

### Importing CommonJS Modules from ES Modules

Currently, we quickly might run into the need to import CommonJS modules as many NPM packages are not available
as ES Modules. This is not an issue at all. **NodeJS allows us to import CommonJS modules from ES Modules**. If we would 
like to import our CommonJS class export example from above, our ES Module import would look like this:

```js
// index.mjs
import Logger from "./logger.js";

Logger.info(`${Logger.defaultMessage} printed in blue`);
Logger.error("some error message printed in red");
```

In this case, `module.exports` is simply treated as the default export which you might import as such.

## Differences Between CommonJS and ES Modules

There are a few key differences which you need to keep in mind when working with the two different NodeJS module systems.
We are going to highlight the most important ones here.

### File Extensions

As you might already have noticed, in all of our ES modules imports we explicitly added the file extension to all file
imports. This is mandatory for ES Modules (as opposed to e.g. CommonJS, Webpack or TypeScript).

This is significant as NodeJS distinguishes between CommonJS modules and ES Modules via the file extension.
By default, files with the `.js` extension will be treated as CommonJS modules, while files with the `.mjs` extension
are treated as ES Modules. 

However, you might want to configure your NodeJS project to use ES Modules as the default module system. Please consult the 
[NodeJS documentation on file extensions](https://nodejs.org/api/packages.html#packagejson-and-file-extensions) to find 
out how to correctly configure your project.

As we already have seen, ES Modules can import CommonJS modules. Vice versa is not the case. **CommonJS modules cannot
import ES Modules**. You are not able to import `.mjs` files from `.js` files. This is due to the different nature 
of the two systems. 

### Dynamic vs. Static

The two module systems do not only have a different syntax. They also differ in the way how imports and exports are 
treated. 

**CommonJS imports are dynamically resolved at runtime**. The `require()` function is simply run at the time our code 
executes. As a consequence, you can call it everywhere in your code.

**With ES Modules, imports are static, which means they are executed at parse time**. This is why
imports are "hoisted". They are implicitly moved to the top of the file. Therefore, we cannot use the import syntax we
have seen above just in the middle of your code. The upside of this is that errors can be caught upfront and developer
tools can better support us with writing valid code.

There might be cases where we really need to dynamically import modules at runtime. There is a solution:
The dynamic `import()` function. As we really should treat this as a special use case, we did not cover it in this article.
You may consult the [NodeJS documentation](https://nodejs.org/api/esm.html#import-expressions) if you want to know more.

## When to Use Which?

We have now learned about the two module system options in NodeJS. We have seen how we can create and import modules in
CommonJS. We have also seen how to accomplish the same things with ES Modules.

Now you might wonder which module system you should use. Of course, the answer is: it depends. My personal advice is the
following:

**If you are starting a new project, use ES Modules**. It has been standardized for many years now. NodeJS has stable support
for it since version 14, which was released in April 2020. You can find a lot of documentation and examples out there.
Many package maintainers already published their libraries with ES Modules support. There is no reason not to use it.

**Things may be different if you are maintaining an existing NodeJS project which uses CommonJS**. The most important
fact is that currently there is no pressure to migrate your existing code. CommonJS is still the default module system
of NodeJS and there are no signs that this will change soon. However, you might migrate to the
ES Modules syntax while using CommonJS under the hood. This can be accomplished by tools like Babel or TypeScript and
allows you to decide to more easily switch to ES Modules at a later point in time.

Whatever you choose, you won't make a huge mistake. Both options are valid options, and this is the beauty of the
JavaScript ecosystem. As we have just seen, it has evolved a lot in the past decade, and you have options for nearly 
anything you want to achieve.