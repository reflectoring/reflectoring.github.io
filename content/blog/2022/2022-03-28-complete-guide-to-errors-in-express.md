---
authors: [pratikdas]
title: "Error Handling in Express"
categories: ["NodeJS"]
date: 2022-03-28 00:00:00 +1100
excerpt: "Error handling functions in an application detect and capture multiple error conditions and take appropriate remedial actions to either recover from those errors or fail gracefully. This is the third article in the Express series where we will see how to handle errors in Node.js applications written using Express."
image: images/stock/0118-keyboard-1200x628-branded.jpg
url: guide-to-error-handling-in-express
---
 
Error handling functions in an application detect and capture multiple error conditions and take appropriate remedial actions to either recover from those errors or fail gracefully. Common examples of remedial actions are providing a helpful message as output, logging a message in an error log which can be used for diagnosis, or retrying the failed operation.

Express is a framework for developing web application in Node.js. In an earlier article we had introduced this Express with examples of using its powerful features which was followed by a second article on Express middleware. This is the third article in the Express series where we will see how to handle errors in Node.js applications written using Express.

In this article, we will understand the below concepts about handling errors in Express:
1. Checking behaviour of the default error handler provided by Express.
2. Creating custom error handlers to override the default error handling behaviour.
3. Handle errors thrown by asynchronous functions.
4. Handle errors by chaining error handling middleware functions to the routes defined in the Express application.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/express/errorhandling" %}}

## Prerequisites

A basic understanding of [Node.js](https://nodejs.org/en/docs/guides/getting-started-guide/) and components of the Express framework is advisable. 

Please refer to our earlier [article](https://reflectoring.io/getting-started-with-express/) for an introduction to Express.

## Type of Errors in an Express Application

An application can give rise to different kind of errors:
1. Recoverable error:
2. Non-recoverable errors: 
3. Temporary errors: Examples include a temporary outage in an external system.
4. Errors from business logic: Caused by 

 We can have an error caused by a invalid input from which we can recover from by changing the input. 
1. Calls to external resources like database, API, file systems.
2. Custom Errors defined in the application
3. Runtime errors


We will see examples of each of these types in the subsequent sections.

## Basic Setup for Running the Examples
We need to first set up a Node.js project for running our examples. Let us create a folder and initialize a Node.js project under it by running the `npm init` command:

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

We will now create a file named `index.js` and open the project folder in our favorite code editor. We are using [Visual Studio Code](https://code.visualstudio.com) as our source-code editor.

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

We have also defined two routes which will accept the requests at URLs: `/` and `/products`. For an elaborate explanation of routes and handler function, please refer to our earlier article for an introduction to Express.

We can run our application with the `node` command:

```shell
node index.js
```
This will start a server that will listen for requests in port `3000`.  We will now add middleware functions to this application in the following sections.

## Handling Errors in Route Handler Functions
The simplest way of handling errors in Express applications is by putting the error handling logic in the individual route handler functions. We can either check for specific error conditions or use a try/catch block for intercepting the error condition before invoking the logic for handling the error. Examples of error handling logic could be logging the error stack to a log file or returning an helpful error response. 

An example of a error handling in route a handler function is shown here: 

```js
const express = require('express')
const axios = require("axios")
const app = express()

// handle post request for path /products
app.post('/products', (request, response) => {
  const products = []

  const name = request.body.name                

  const brand = request.body.brand

  const category = request.body.category

  if(name == null){
    // log the error
    console.log("input error")

    // return error response
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
Here we are returning the error as a HTTP error response with error code 500 and an error message.

Here is one more example of handling error using a try/catch block:

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
  }catch(error){
    // return error response
    response
        .status(500)
        .json({ message: "Error in invocation of API: /products" })
  }

})

```
Here also we are handling the error in the route handler function by intercepting the error in a catch block and returning an error message in the HTTP response.

But this method of putting error handling logic in all routes is cumbersome since we need to repeat similar code across our application. Putting this logic in a single place is desirable where we can easily maintain this logic. We will try to achieve this using middleware functions of Express as explained in the subsequent sections.

## Handling Errors with Middleware Functions

Error handling in Express is done using middleware functions. The middleware functions that handle errors are defined in the same way as other middleware functions, but they accept the error object as input parameter in addition to the three input parameters: `request`, `response`, and `next` as shown below:

The signature of a middleware function which handles errors in Express looks like this:

```js
function errorHandler(error, request, response, next) {

  // Error handling middleware functionality

}
```

This error-handling middleware function is attached to the `app` instance after the route handler functions have been attached.
When we get an error in the application, the error object is passed to this error-handling middleware, by calling the `next()` function.

```js
const errorLogger = (err, request, response, next) => {
    console.log( `error ${err.message}`) 
    next(err) // calling next middleware
}
```
As we can see here, the `next()` function takes the error object which is passed on to the next middleware function where we build the intelligence to extract relevant information from the error object and send back an easily understandable error message to the caller.

## Default Built-in Error Handler of Express

When we use the Express framework to build our web applications, we get a error handler along with it that catches and processes all the errors thrown in the application. Let us check this behaviour with the help of this simple Express application with a route that throws an error:

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
When we invoke this route with URL `productswitherror` , we will get an error with a status code of `400` and contain an error message. But we don't have to handle this because it will be handled by the default error handler.

Let us call this route either by putting this URL in a browser or running a CURL command in a terminal window. 

We will get an error stack contained in an HTML format as output as shown:

```shell
Error: processing error in request at /productswitherror
    at /Users/pratikdas/pratik/node/storefront/js/index.js:43:15
    at Layer.handle [as handle_request] (/Users/pratikdas/pratik/node/storefront/node_modules/express/lib/router/layer.js:95:5)
    at next (/Users/pratikdas/pratik/node/storefront/node_modules/express/lib/router/route.js:137:13)
    at Route.dispatch (/Users/pratikdas/pratik/node/storefront/node_modules/express/lib/router/route.js:112:3)
    at Layer.handle [as handle_request] (/Users/pratikdas/pratik/node/storefront/node_modules/express/lib/router/layer.js:95:5)
    at /Users/pratikdas/pratik/node/storefront2/node_modules/express/lib/router/index.js:281:22
    at Function.process_params (/Users/pratikdas/pratik/node/storefront/node_modules/express/lib/router/index.js:341:12)
    at next (/Users/pratikdas/pratik/node/storefront/node_modules/express/lib/router/index.js:275:10)
    at SendStream.error (/Users/pratikdas/pratik/node/storefront/node_modules/serve-static/index.js:121:7)
    at SendStream.emit (node:events:390:28)
```
This is the error message sent by Express' default errorhandler. The default errorhandler is defined as a middleware function in Express and is attached at the end of the middleware function stack. Express catches this error for us and responds to the client with the error’s status code, message, and even the stack trace (for non-production environments).

The Express framework operates as a stack of middleware functions for processing a request. 

In this example, the error thrown by our handler function is associated with the route `/productswitherror`. This error gets propagated through the middleware stack and is handled by the last middleware function which is the default error handler.

However, this default error handler is not very elegant and user friendly giving scant information to the end user. We will improve this behaviour by adding a custom handler in the next section.

## Adding Middleware Functions for Error Handling 

Let us now add a custom error handler to change the default error handling behavior provided by the Express framework. We define a custom error handler function in Express as a middleware function that takes an error parameter in addition to the parameters: `request`, `response`, and the `next()` function.

As we can see here, the `next()` function takes the error object which is passed on to the next middleware function where we build the intelligence to extract relevant information from the error object and send back an easily understandable error message to the caller.

Let us define two middleware error handling functions and add them to our routes:

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

// Route with a handler function which throws an error
app.get('/productswitherror', (request, response) => {
  let error = new Error(`processing error in request at ${request.url}`)
  error.statusCode = 400
  throw error
})

// Attach the first Error handling Middleware
// function defined above (which logs the error)
app.use(errorLogger)

// Attach the second Error handling Middleware
// function defined above (which sends back the response)
app.use(errorResponder)

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})

```
These middleware error handling functions perform different tasks: the first middleware function `errorLogger` logs the error message, the second middleware function `errorResponder` sends the error response to the client. 

We have then attached these middleware functions after defining the route handler to the `app` object by calling the `use()` method.

To test how our application handles errors with the help of these error handling functions, let us invoke the route with URL: `localhost:3000/productswitherror`. 

Now instead of the default error handler, the two error handlers get triggered. The first one logs the error message to the console and the second one sends the error message as a JSON payload in the response as shown below:

```shell
processing error in request at /productswitherror
```

The default error handler of Express sends the response in HTML format.

## Handling Errors in Asynchronous Function Calls

If synchronous code throws an error, then Express will catch and process it. 

Calling asynchronous function which throw an error however need to be handled in a different way. The error from asynchronous functions are not handled by the default error handler in Express and result in the stopping the application. Let us check this behaviour with the help of this example:

```js
const express = require('express')

const app = express()

const asyncFunction = async (request,response,next)=>{
    throw new Error(`processing error in request `) 
}

app.get('/productswitherror', (request, response, next) => {
  
    // call the async function
    asyncFunction(request, response, next)
})
```
Running this application and invoking the route with URL: `productswitherror` results in stopping the application.

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
Here we are catching the error and passing the error to the `next()` function. The application will now run without interruption and invoke the default error handler or any custom error handler if we have defined.

## Error Handling while Calling Promise based Methods
Use promises to avoid the overhead of the try...catch block or when using functions that return promises. For example:

Since promises automatically catch both synchronous errors and rejected promises, you can simply provide next as the final catch handler and Express will catch errors, because the catch handler is given the error as the first argument.

You could also use a chain of handlers to rely on synchronous error catching, by reducing the asynchronous code to something trivial. For example:

## Developing Express Error Handling Middleware with TypeScript 
[TypeScript](https://www.typescriptlang.org) is an open-source language developed by Microsoft. It is a superset of JavaScript with additional capabilities, most notable being static type definitions making it an excellent tool for a better and safer development experience.

Let us first add support for TypeScript to our Node.js project and then see a snippet of the middleware functions written using the TypeScript language.  

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
The Express application is written in TypeScript language in a file named `app.ts`. Here is a snippet of the code:
```ts
import express, { Request, Response, NextFunction } from 'express'
import morgan from 'morgan'

const app = express()
const port: number = 3000

// Define the types to be used in the application
interface Product {
    name: string
    price: number
    brand: string
    category?: string
  }

interface ProductCreationResponse {
    productID: string 
    result: string
} 

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

app.use(express.static('images'))  
app.use(express.static('htmls'))  
app.use(requestLogger)  

app.use(morgan('tiny'))

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


const addProducts = (request: Request, response: Response, next: NextFunction) => {
    let products: Product[] = []
...
...
    const productCreationResponse: ProductCreationResponse = {productID: "12345", result: "success"}
    response.json(productCreationResponse)

    response.status(200).json(products);
}
app.post('/products', addProducts)

app.get('/productswitherror', (request: Request, response: Response) => {
    let error: AppError = new AppError(400, `processing error in request at ${request.url}`)
    
    throw error
  })
  
  app.use(errorLogger)
  app.use(errorResponder)
  app.use(invalidPathHandler)

app.listen(port, () => {
    console.log(`Server listening at port ${port}.`)
})
```
Here we have used the `express` module to create a server as we have seen before. With this configuration, the server will run on port `3000` and can be accessed with the URL: `http://localhost:3000`.

We have modified the import statement on the first line to import the TypeScript interfaces that will be used for the `request`, `response`, and `next` parameters inside the Express middleware.

Next, we have defined a type named `Product` containing attributes: `name`, `price`, `category`, and `brand`. After we have defined the handler function for returning an array of `products` and finally associated it with a route with route path `/products`.


### Running the Express Application Written in TypeScript

We run the Express application written in TypeScript code by using the below command:
```shell
npx ts-node app.ts
```
Running this command will start the HTTP server. We have used `npx` here which is a command-line tool that can execute a package from the `npm` registry without installing that package.

### Adding a Route with a Handler Function in TypeScript

Let us now modify the TypeScript code written in the earlier section to add a route for defining a REST API as shown below:
```ts
import express, { Request, Response, NextFunction } from 'express';

const app = express();
const port = 3000;

// Define a type for Product
interface Product {
    name: string;
    price: number;
    brand: string;
};

// Define a handler function
const getProducts = ( 
    request: Request, 
    response: Response, 
    next: NextFunction) => {

    // Defining a hardcoded array of product entities
    let products: Product[] = [
      {"name":"television", "price":112.34, "brand":"samsung"},
      {"name":"washing machine", "price": 345.34, "brand": "LG"},
      {"name":"Macbook", "price": 3454.34, "brand": "Apple"}
    ]

    // sending a JSON response
    response.status(200).json(products);
}

// Define the route with route path '/products'
app.get('/products', getProducts);

// Start the server
app.listen(port, () => {
    console.log(`Server listening at port ${port}.`);
});

```
We can now access the URL: `http://localhost:3000/products` from the browser or run a curl command and get a JSON response containing the `products` array.

## Conclusion

Here is a list of the major points for a quick reference:

1. Express middleware refers to a set of functions that execute during the processing of HTTP requests received by an Express application. 

2. Middleware functions access the HTTP request and response objects. They either terminate the HTTP request or forward it for further processing to another middleware function. 

3. We can add middleware functions to all the routes by using the `app.use(<middleware function>)`.

4. We can add middleware functions to selected routes by using the `app.use(<route url>, <middleware function>)`. 

5. Express comes with built-in middleware functions like:
* `express.static` for serving static resources like CSS, images, and HTML files.
* `express.json` for parsing JSON payloads received in the request body
* `express.urlencoded` for parsing URL encoded payloads received in the request body

6. Express middleware functions are also written and distributed as npm modules by the community. These can be integrated into our application as third-party middleware functions.

7. We perform error handling in Express applications by writing middleware functions that handle errors. These error handling functions take the error object as the fourth parameter in addition to the parameters: `request`, `response`, and the `next` function.

8. Express comes with a default error handler for handling error conditions. This is a default middleware function added by Express at the end of the middleware stack.

9. We also used TypeScript to define a Node.js server application containing an endpoint for a REST API.  

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/nodejs/express/middleware).

