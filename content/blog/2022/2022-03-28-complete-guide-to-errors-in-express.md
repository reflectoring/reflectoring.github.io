---
authors: [pratikdas]
title: "Error Handling in Express"
categories: ["NodeJS"]
date: 2022-03-28 00:00:00 +1100
excerpt: "Error handling functions in an application detect and capture multiple error conditions and take appropriate remedial actions to either recover from those errors or fail gracefully. This is the third article in the Express series where we will see how to handle errors in Node.js applications written using Express."
image: images/stock/0118-keyboard-1200x628-branded.jpg
url: guide-to-error-handling-in-express
---
 
Error handling functions in an application detect and capture multiple error conditions and take appropriate remedial actions to either recover from those errors or fail gracefully. Common examples of remedial actions are providing a helpful message as output, logging a message in an error log that can be used for diagnosis, or retrying the failed operation.

Express is a framework for developing a web application in Node.js. In an earlier [article](https://reflectoring.io/getting-started-with-express/) we had introduced the Express framework with examples of using its powerful features which was followed by a second [article](https://reflectoring.io/express-middleware/) on middleware functions in Express. In both of those articles, we had briefly explained error handling using middleware functions. 

This is the third article in the Express series where we will focus on handling errors in Node.js applications written using Express and understand the below concepts:

1. Handling errors with the default error handler provided by Express.
2. Creating custom error handlers to override the default error handling behavior.
3. Handling errors thrown by asynchronous functions invoked in the routes defined in the Express application.
4. Handling errors by chaining error-handling middleware functions.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/errorhandling" %}}

## Prerequisites

A basic understanding of [Node.js](https://nodejs.org/en/docs/guides/getting-started-guide/) and components of the Express framework is advisable. 

Please refer to our earlier [article](https://reflectoring.io/getting-started-with-express/) for an introduction to Express.

## Basic Setup for Running the Examples
We need to first set up a Node.js project for running our examples of handling errors in Express applications. Let us create a folder and initialize a Node.js project under it by running the `npm init` command:

```shell
mkdir storefront
cd storefront
npm init -y
```
Running these commands will create a Node.js project containing a `package.json` file. 

We will next install the Express framework using the `npm install` command as shown below:

```shell
npm install express --save
```
When we run this command, it will install the Express framework and also add it as a dependency in our `package.json` file.

We will now create a file named `index.js` under a folder: `js` and open the project folder in our favorite code editor. We are using [Visual Studio Code](https://code.visualstudio.com) as our source-code editor.

Let us now add the following lines of code to `index.js` for running a simple HTTP server:

```js
const express = require('express');

const app = express();

// Route for handling get request for path /
app.get('/', (request, response) => {
    response.send('response for GET request');
})

// Route for handling post request for path /products
app.post('/products', (request, response) => {
  ...
  response.json(...)
})

// start the server
app.listen(3000, 
   () => console.log('Server listening on port 3000.'))
```
In this code snippet, we are importing the `express` module and then calling the `listen()` function on the `app` handle to start our server. 

We have also defined two routes that will accept the requests at URLs: `/` and `/products`. For an elaborate explanation of routes and handler functions, please refer to our earlier [article](https://reflectoring.io/getting-started-with-express/) for an introduction to Express.

We can run our application with the `node` command:

```shell
node js/index.js
```
This will start a server that will listen for requests in port `3000`.  

We have also defined a server application in a file: `js/server.js` which we can run to simulate an external service. We can run the server application with the command:

```js
node js/server.js
```
This will start the server application on port `3001` where we can access a REST API on a URL: `http://localhost:3001/products`. We will call this service in some of our examples to test errors related to an external API call.

The application in `index.js` does not contain any error handling code as yet. Node.js applications crash when they encounter unhandled exceptions. So we will next add code to this application for simulating different error conditions and handling them in the subsequent sections.

## Handling Errors in Route Handler Functions
The simplest way of handling errors in Express applications is by putting the error handling logic in the individual route handler functions. We can either check for specific error conditions or use a `try-catch` block for intercepting the error condition before invoking the logic for handling the error. 

Examples of error handling logic could be logging the error stack to a log file or returning a helpful error response. 

An example of a error handling in a route handler function is shown here: 

```js
const express = require('express')
const app = express()

app.use('/products', express.json({ limit: 100 }))

// handle post request for path /products
app.post('/products', (request, response) => {
  const name = request.body.name                
  ...
  ...

  // Check for error condition
  if(name == null){
    // Error handling logic: log the error
    console.log("input error")

    // Error handling logic: return error response
    response
      .status(500)
      .json({ message: "Mandatory field: name is missing. " })
  }else{
    // continue with normal processing             
    const productCreationResponse = { result: "success"}

    // return success response
    response.json(productCreationResponse)
  }
})
```
Here we are checking for the error condition by checking for the presence of a mandatory input in the request payload and returning the error as an HTTP error response with error code 500 and an error message as part of the error handling logic.

Here is one more example of handling error using a `try-catch` block:

```js
const express = require('express')
const axios = require("axios")
const app = express()

app.get('/products', async (request, response)=>{
  try{
    const apiResponse = await axios.get("http://localhost:3001/products")

    const jsonResponse = apiResponse.data
    console.log("response "+jsonResponse)
    
    response.send(jsonResponse)
  }catch(error){ // intercept the error in catch block
    // return error response
    response
        .status(500)
        .json({ message: "Error in invocation of API: /products" })
  }

})

```
Here also we are handling the error in the route handler function. We are intercepting the error in a catch block and returning an error message with an error code of `500` in the HTTP response.

But this method of putting error handling logic in all the route handler functions is not clean. We will try to handle this more elegantly using the middleware functions of Express as explained in the subsequent sections.

## Default Built-in Error Handler of Express

When we use the Express framework to build our web applications, we get an error handler by default that catches and processes all the errors thrown in the application. 

Let us check this behavior with the help of this simple Express application with a route that throws an error:

```js
const express = require('express')

const app = express()

app.get('/productswitherror', (request, response) => {
  let error = new Error(`processing error in request at ${request.url}`)
  error.statusCode = 400
  throw error
})

const port = 3000
app.listen(3000, 
     () => console.log(`Server listening on port ${port}.`));
```
When we invoke this route with URL `productswitherror`, we will get an error with a status code of `400` and contain an error message. But we do not have to handle this error since it is handled by the default error handler of the Express framework.

When we call this route either by putting this URL in a browser or by running a CURL command in a terminal window, we will get an error stack contained in an HTML format as output as shown:

```shell
Error: processing error in request at /productswitherror
    at /.../storefront/js/index.js:43:15
    at Layer.handle [as handle_request] (/.../storefront/node_modules/express/lib/router/layer.js:95:5)
    at next (/.../storefront/node_modules/express/lib/router/route.js:137:13)
    at Route.dispatch (/.../storefront/node_modules/express/lib/router/route.js:112:3)
    at Layer.handle [as handle_request] (/.../storefront/node_modules/express/lib/router/layer.js:95:5)
    at /.../storefront/node_modules/express/lib/router/index.js:281:22
    at Function.process_params (/.../storefront/node_modules/express/lib/router/index.js:341:12)
    at next (/.../storefront/node_modules/express/lib/router/index.js:275:10)
    at SendStream.error (/.../storefront/node_modules/serve-static/index.js:121:7)
    at SendStream.emit (node:events:390:28)
```
This is the error message sent by the Express framework's default error handler. Express catches this error for us and responds to the caller with the error’s status code, message, and stack trace (only for non-production environments). But this behavior applies only to synchronous functions.

Asynchronous functions called from route handlers that throw an error however need to be handled differently. The error from asynchronous functions are not handled by the default error handler in Express and result in the stopping(crashing) of the application.

To prevent this behaviour, we need to pass the error thrown by any asynchronous function invoked by route handlers and middleware, to the `next()`function as shown below: 

```js
const asyncFunction = async (request,response,next)=>{
  try{
    throw new Error(`processing error in request `)
  }catch(error){
    next(error)
  }  
}

```
Here we are catching the error and passing the error to the `next()` function. Now the application will be able to run without interruption and invoke the default error handler or any custom error handler if we have defined it.

However, this default error handler is not very elegant and user-friendly giving scant information about the error to the end-user. We will improve this behavior by adding custom error handling functions in the next sections.

## Handling Errors with Error Handling Middleware Functions
An Express application is essentially a series of middleware function calls. We define a set of middleware functions and attach them as a stack to one or more route handler functions. We call the next middleware function by calling the `next()` function. 

The error handling middleware functions are defined in the same way as other middleware functions and attached as a separate stack of functions:

{{% image alt="Express Error Handling Middleware Functions" src="images/posts/express-error-handling/error-mw.png" %}}

When an error occurs, we call the `next(error)` function and pass the error object as input. The Express framework will process this by skipping all the functions in the middleware function stack and triggering the functions in the error handling middleware function stack. 

The error handling middleware functions are defined in the same way as other middleware functions, but they accept the error object as the first input parameter followed by the three input parameters: `request`, `response`, and `next` accepted by the other middleware functions as shown below:

```js
const express = require('express')
const app = express()

const errorHandler = (error, request, response, next) {
  // Error handling middleware functionality
}

// route handlers
app.get(...)
app.post(...)

// attach error handling middleware functions after route handlers
app.use(errorHandler)
```
These error-handling middleware functions are attached to the `app` instance after the route handler functions have been defined. 

The built-in default error handler of Express described in the previous section is also an error-handling middleware function and is attached at the end of the middleware function stack if we do not define any error-handling middleware function.

Any error in the route handlers gets propagated through the middleware stack and is handled by the last middleware function which can be the default error handler or one or more custom error-handling middleware functions if defined.

## Calling the Error Handling Middleware Function

When we get an error in the application, the error object is passed to the error-handling middleware, by calling the `next(error)` function as shown below:

```js
const express = require('express')
const axios = require("axios")
const app = express()

const errorHandler = (error, request, response, next) {
  // Error handling middleware functionality
  console.log( `error ${error.message}`) // log the error
  const status = error.status || 400
  // send back an easily understandable error message to the caller
  response.status(status).send(error.message)
}

app.get('/products', async (request, response)=>{
  try{
    const apiResponse = await axios.get("http://localhost:3001/products")

    const jsonResponse = apiResponse.data
    
    response.send(jsonResponse)
  }catch(error){
    next(error) // calling next error handling middleware
  }

})
app.use(errorHandler)
```
As we can see here, the `next(error)` function takes the error object in the `catch` block as input which is passed on to the next error-handling middleware function where we can potentially put the logic to extract relevant information from the error object, log the error, and send back an easily understandable error message to the caller.

## Adding Multiple Middleware Functions for Error Handling 

We can chain multiple error-handling middleware functions similar to what we do for other middleware functions.

Let us define three middleware error handling functions and add them to our routes:

```js

// Error handling Middleware function for logging the error message
const errorLogger = (error, request, response, next) => {
  console.log( `error ${error.message}`) 
  next(error) // calling next middleware
}

// Error handling Middleware function reads the error message 
// and sends back a response in JSON format
const errorResponder = (error, request, response, next) => {
  response.header("Content-Type", 'application/json')
    
  const status = error.status || 400
  response.status(status).send(error.message)
}

const invalidPathHandler = (request, response, next) => {
  response.status(400)
  response.send('invalid path')
}

// Route with a handler function which throws an error
app.get('/productswitherror', (request, response) => {
  let error = new Error(`processing error in request at ${request.url}`)
  error.statusCode = 400
  throw error
})

app.get('/products', async (request, response)=>{
  try{
    const apiResponse = await axios.get("http://localhost:3001/products")

    const jsonResponse = apiResponse.data
    
    response.send(jsonResponse)
  }catch(error){
    next(error) // calling next error handling middleware
  }

})

// Attach the first Error handling Middleware
// function defined above (which logs the error)
app.use(errorLogger)

// Attach the second Error handling Middleware
// function defined above (which sends back the response)
app.use(errorResponder)

// Attach the third Error handling Middleware
// function defined above (which sends back the response for invalid paths)
app.use(invalidPathHandler)

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})

```
These middleware error handling functions perform different tasks: 
* `errorLogger` logs the error message
* `errorResponder` sends the error response to the caller
* `invalidPathHandler` sends the error response if any invalid URL is requested. 

We have then attached these three error-handling middleware functions to the `app` object, after the definitions of the route handler functions by calling the `use()` method on the `app` object.

To test how our application handles errors with the help of these error handling functions, let us invoke the with URL: `localhost:3000/productswitherror`. The error raised from this route causes the first two error handlers to be triggered. The first one logs the error message to the console and the second one sends the error message `processing error in request at /productswitherror` in the response. 

When we request a non-existent route in the application for example: `http://localhost:3000/productswitherrornew`, the third error handler is invoked giving us an error message: `invalid path`.

## Error Handling while Calling Promise based Methods
Lastly, it will be worthwhile to look at the best practices for handling errors in JavaScript promise blocks. A promise is a JavaScript object which represents the eventual completion (or failure) of an asynchronous operation and its resulting value. 

We can enable Express to catch errors in promises by providing `next` as the final catch handler as shown in this example:

```js
app.get('/product',  (request, response, next)=>{
 
    axios.get("http://localhost:3001/product")
    .then(response=>response.json)
    .then(jsonresponse=>response.send(jsonresponse))
    .catch(next)
})

```
Here we are calling a REST API with the `axios` library which returns a promise and catches any error in the API invocation by providing `next()` as the final catch handler.

## Developing Express Error Handling Middleware with TypeScript 
[TypeScript](https://www.typescriptlang.org) is an open-source language developed by Microsoft. It is a superset of JavaScript with additional capabilities, most notable being static type definitions making it an excellent tool for a better and safer development experience.

Let us first add support for TypeScript to our Node.js project and then see a snippet of the error handling middleware functions written using the TypeScript language.  

### Installing TypeScript and other Configurations

For adding TypeScript, we need to perform the following steps:
1. Install Typescript and ts-node with npm:

```shell
npm i -D typescript ts-node
```
2. Create a JSON file named `tsconfig.json` with the below contents in our project’s root folder to specify different options for compiling the TypeScript code as shown here:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es6",
    "rootDir": "./",
    "esModuleInterop": true
  }
}
```
3. Install the type definitions of the Node APIs and Express to be fetched from the `@types` namespace by installing the `@types/node` and `@types/express` packages as a development dependency:
```shell
npm i -D @types/node @types/express
```

### Writing the Express Error Handling Middleware Functions in TypeScript
After enabling the project for TypeScript, we have written the same application built earlier in TypeScript. The files for TypeScript are kept under the folder: `ts`. Here is a snippet of the code in file `app.ts` containing routes and error handling middleware functions:
```ts
  import express, { Request, Response, NextFunction } from 'express'

  const app = express()
  const port: number = 3000


  // Error object used in error handling middleware function
  class AppError extends Error{
      statusCode: number;

      constructor(statusCode: number, message: string) {
        super(message);
    
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = Error.name;
        this.statusCode = statusCode;
        Error.captureStackTrace(this);
      }
  }

  const requestLogger = (request: Request, response: Response, next: NextFunction) => {
      console.log(`${request.method} url:: ${request.url}`);
      next()
  }

  app.use(requestLogger)  

  app.use('/products', express.json({ limit: 100 }))

  // Error handling Middleware functions
  const errorLogger = (
        error: Error, 
        request: Request, 
        response: Response, 
        next: NextFunction) => {
          console.log( `error ${error.message}`) 
          next(error) // calling next middleware
    }
    
  const errorResponder = (
      error: AppError, 
      request: Request, 
      response: Response, 
      next: NextFunction) => {
          response.header("Content-Type", 'application/json')
            
          const status = error.statusCode || 400
          response.status(status).send(error.message)
    }

  const invalidPathHandler = (
    request: Request, 
    response: Response, 
    next: NextFunction) => {
      response.status(400)
      response.send('invalid path')
  }
  
  
  
  app.get('product', (request: Request, response: Response)=>{
      response.sendFile("productsample.html")
  })
  
  // handle get request for path /
  app.get('/', (request: Request, response: Response) => {
      response.send('response for GET request');
  })
  
  
  const requireJsonContent = (request: Request, response: Response, next: NextFunction) => {
    if (request.headers['content-type'] !== 'application/json') {
        response.status(400).send('Server requires application/json')
    } else {
      next()
    }
  }


  app.get('/products', async (request: Request, response: Response, next: NextFunction)=>{
    try{
      const apiResponse = await axios.get("http://localhost:3001/products")

      const jsonResponse = apiResponse.data
      console.log("response "+jsonResponse)
      
      response.send(jsonResponse)
    }catch(error){
      next(error)
    }

  })

  app.get('/product',  (request: Request, response: Response, next: NextFunction)=>{
   
      axios.get("http://localhost:3001/product")
      .then(jsonresponse=>response.send(jsonresponse))
      .catch(next)
  })

  app.get('/productswitherror', (request, response) => {
    let error:AppError = new AppError(400, `processing error in request at ${request.url}`)
    error.statusCode = 400
    throw error
  })

  app.get('/productswitherror', (request: Request, response: Response) => {
      let error: AppError = new AppError(400, `processing error in request at ${request.url}`)
      
      throw error
  })
    
  app.use(errorLogger)
  app.use(errorResponder)
  app.use(invalidPathHandler)

  app.listen(port, () => {
      console.log(`Server listening at port ${port}.`)
  }
)
```
Here we have used the `express` module to create a server as we have seen before. With this configuration, the server will run on port `3000` and can be accessed with the URL: `http://localhost:3000`.

We have modified the import statement on the first line to import the TypeScript interfaces that will be used for the `request`, `response`, and `next` parameters inside the Express middleware.

### Running the Express Application Written in TypeScript

We run the Express application written in TypeScript code by using the below command:
```shell
npx ts-node ts/app.ts
```
Running this command will start the HTTP server. We have used `npx` here which is a command-line tool that can execute a package from the `npm` registry without installing that package.


## Conclusion

Here is a list of the major points for a quick reference:

1. We perform error handling in Express applications by writing middleware functions that handle errors. These error handling functions take the error object as the fourth parameter in addition to the parameters: `request`, `response`, and the `next()` function.

2. Express comes with a default error handler for handling error conditions. This is a default middleware function added by Express at the end of the middleware stack.

3. We call the error handling middleware by passing the error object to the `next(error)` function. 

4. We can define a chain of multiple error-handling middleware functions to one or more routes and attach them at the end of Express route definitions.

5. We can enable Express to catch errors in JavaScript promises by providing `next` as the final catch handler.

6. We also used TypeScript to author an Express application with route handler and error-handling middleware functions.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/nodejs/errorhandling).

