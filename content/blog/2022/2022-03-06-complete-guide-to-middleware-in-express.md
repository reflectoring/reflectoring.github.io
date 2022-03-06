---
authors: [pratikdas]
title: "Complete Guide to Middleware in Express"
categories: ["NodeJS"]
date: 2022-03-06 00:00:00 +1100
excerpt: "Middleware functions are an integral part of an application built with Express framework. Express middleware refers to a set of functions that execute during the processing of HTTP requests received by an Express application. In this article, we will understand and use different types of middleware functions in Express and also create our own functions using both JavaScript and TypeScript."
image: images/stock/0118-keyboard-1200x628-branded.jpg
url: complete-guide-to-middleware-in-express
---

Middleware functions are an integral part of an application built with Express framework (henceforth referred to as Express application). Express middleware refers to a set of functions that execute during the processing of HTTP requests received by an Express application. 

They access the HTTP request and response objects and can either terminate the HTTP request or forward it for further processing to another middleware function. 

This capability of executing the Express middleware functions in a chain allows us to create smaller potentially reusable components based on the [single responsibility principle(SRP)](https://en.wikipedia.org/wiki/Single-responsibility_principle).


In this article, we will understand the below concepts about Express middleware:
1. Different types of middleware functions in Express.
2. Create middleware functions using both JavaScript and TypeScript and attach them to one or more Express routes
3. Use the middleware functions provided by Express and many third-party libraries in our Express applications.
4. Use middleware functions as error handlers.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/express/middleware" %}}

## Prerequisites

A basic understanding of [Node.js](https://nodejs.org/en/docs/guides/getting-started-guide/) and components of the Express framework is advisable. 

Please refer to our earlier [article](https://reflectoring.io/getting-started-with-express/) for an introduction to Express.

## What is Express Middleware
Middleware in Express are functions that come into play **after the server receives the request and before the response is sent to the client**. They are arranged in a chain and are called in sequence. 

We can use middleware functions for different types of processing tasks required for fulfilling the request like database querying, making API calls, preparing the response, etc, and finally calling the next middleware function in the chain. 

Middleware functions take three arguments: the request object (`request`), the response object (`response`), and optionally the `next()` middleware function:

```js
const express = require('express');
const app = express();
function middlewareFunction(request, response, next){
  ...
  next()
}

app.use(middlewareFunction)
```

An exception to this rule is error handling middleware which takes an error object as the fourth parameter. We call `app.use()` to add a middleware function to our Express application.

Under the hood, when we call `app.use()`, Express adds our middleware function to its internal middleware stack. Express executes middleware in the order they are added, so if we make the calls in this order:

```js
const express = require('express');
const app = express();

app.use(function1)
app.use(function2)
```
Express will first execute `function1` and then `function2`.

Middleware functions in Express are of the following types:

- Application-level middleware which runs for all routes in an `app` object
- Router level middleware which runs for all routes in a router object
- Built-in middleware provided by Express like `express.static`, `express.json`, `express.urlencoded`
- Error handling middleware for handling errors
- Third-party middleware maintained by the community 

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

## Using Express' Built-in Middleware

Built-in Middleware functions are bundled with Express so we do not need to install any additional modules for using them.

Express provides the following Built-in middleware functions:

|Function|Description|
|-|-|
|express.static|serves static assets|
|express.json|parses JSON payloads|
|express.urlencoded|parses URL-encoded payloads|
|express.raw|parses payloads into a Buffer and makes them available under `req.body`|
|express.text|parses payloads into a string |

Let us see some examples of their use.

### Using `express.static` Built-in Middleware for Serving Static Assets

We use the `express.static` built-in middleware function to serve static files such as images, CSS files, and JavaScript files. Here is an example of using `express.static` to serve our HTML and image files:

```js
const express = require('express');

const app = express();
app.use(express.static('images'))  
app.use(express.static('htmls'))   

app.get('product', (request, response)=>{
  response.sendFile("productsample.html")
})
```
Here we have defined two static paths named `images` and `htmls` to represent two folders of the same name in our root directory. We have also defined multiple static assets directories by calling the express.static middleware function multiple times.

Express looks up the files in the order in which you set the static directories with the express.static middleware function.

Our root directory structure looks like this:

```shell
.
├── htmls
│   └── productsample.html
├── images
│   └── sample.jpg
├── index.js
├── node_modules

```

Next we have defined a route with url `product` to serve the static HTML file `productsample.html`. The HTML file contains an image referred only with the image name `sample.jpg`:

```html
<html>
<body>
    <h2>My sample product page</h2>
    <img src="sample.jpg" alt="sample"></img>
</body>
</html>
```
Express looks up the files relative to the static directory, so the name of the static directory is not part of the URL.


### Using `express.json` Built-in Middleware for Parsing JSON Payloads
We use the `express.json` built-in middleware function to JSON content received from the incoming requests. 

Let us suppose the route with URL `/products` in our Express application accepts `product` data from as `request` object in JSON format. So we will use Express' built-in middleware `express.json` for parsing the incoming JSON payload and attach it to our `router` object as shown in this code snippet:


```js
const express = require('express');

const app = express();

// Attach the express.json middleware to route "/products"
app.use('/products', express.json({ limit: 100 }))

// handle post request for path /products
app.post('/products', (request, response) => {
...
...
  response.json(...)
})

```
Here we are attaching the `express.json` middleware by calling the `use()` function on the `app` object. We have also configured a maximum size of `100` bytes for the JSON request.

We have used a slightly different signature of the `use()` function than the signature used before. The `use()` function invoked on the `app` object here takes the URL of the route to which the middleware function will get attached, as the first parameter. 

Now we can extract the fields from the JSON payload sent in the request body as shown in this route definition:

```js
const express = require('express')

const app = express()

// Attach the express.json middleware to route "/products"
app.use('/products', express.json({ limit: 100 }))

// handle post request for path /products
app.post('/products', (request, response) => {
  const products = []

  // sample JSON request
  // {"name":"furniture", "brand":"century", "price":1067.67}

  // JSON payload is parsed to extract 
  // the fields name, brand, and category

  // Extract name of product
  const name = request.body.name                

  // Extract brand of product
  const brand = request.body.brand
  
  // Extract category of product
  const category = request.body.category

  console.log(name + " " + brand + " " + category)
  
...
...
  response.json(...)
})

```
Here we are extracting the contents of the JSON request by calling `req.body.FIELD_NAME` before using those fields for adding a new `product`.

Similarly we can use express' built-in middleware `express.urlencoded()` to process URL encoded fields submitted through a HTTP form object:

```js
const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: false }));
``` 
After attaching the middleware: `express.urlencoded()` to the route, we can extract the field values of a submitted form in a handler function using `request.body.<fieldname>` as shown in the code snippet for earlier for extracting JSON fields.

## Adding Middleware Function to a Route
Let us now see how to create a middleware function of our own in an Express application. 

As an example, let us check for the presence of JSON content in the HTTP POST request body before allowing any further processing and send back an error response if the request body does not contain JSON content. 

Our middleware function for checking for the presence of JSON content looks like this:

```js
const requireJsonContent = (request, response, next) => {
  if (request.headers['content-type'] !== 'application/json') {
      response.status(400).send('Server requires application/json')
  } else {
    next()
  }
}

```
Here we are checking the value of the `content-type` header in the request. If the value of the `content-type` header does not match `application/json`, we are sending back an error response with status `400` accompanied by an error message thereby ending the request-response cycle. 

Otherwise, if the `content-type` header is `application/json`, the `next()` function is invoked to call the subsequent middleware present in the chain. 

Next we will add the middleware function: `requireJsonContent` to our desired route like this:

```js
const express = require('express')

const app = express()

// handle post request for path /products
app.post('/products', requireJsonContent, (request, response) => {
  ...
  ...
  response.json(...)
})

```

We can also attach more than one middleware function to a route to apply multiple stages of processing. 

Our route with multiple middleware functions attached will look like this:

```js
const express = require('express')

const app = express()

// handle post request for path /products
app.post('/products', 
  
  // first function in the chain will check for JSON content
  requireJsonContent,  
  
  // second function will check for valid product category 
  // in the request if the first function detects JSON 
  (request, response) => {  
                           
     // Allow to add only products in the category "Electronics"
     const category = request.body.category
     if(category != "Electronics") {
      response.status(400).send('Server requires application/json')
     } else {
        next()
     }
  ...
  ...
  // add the product and return a response in JSON
  response.json(
    {productID: "12345", 
    result: "success")}
  );

```
Here we have two middleware functions attached to the route with route path `/products`.

The first middleware function `requireJsonContent()` will pass the control to the next function in the chain if the `content-type` header in the HTTP request contains `application/json`. 

The second middleware function extracts the `category` field from the JSON request and sends back an error response if the value of the `category` field is not `Electronics`. 

Otherwise, it calls the `next()` function to process the request further which adds the product to a database for example, and sends back a response in JSON format to the caller.

We could have also attached our middleware function by using the use() function of the app as shown below:

```js
const express = require('express')

const app = express()

// first function in the chain will check for JSON content
app.use('/products', requireJsonContent)

// second function will check for valid product category 
// in the request if the first function detects JSON 
app.use('/products',  (request, response) => {  
                           
     // Allow to add only products in the category "Electronics"
     const category = request.body.category
     if(category != "Electronics") {
      response.status(400).send('Server requires application/json')
     } else {
        next()
     }
   })

// handle post request for path /products
app.post('/products', 
  (request, response) => {  
                           
  ...
  ...
  response.json(
    {productID: "12345", 
    result: "success"})
  })
```

## Understanding The `next()` Function

The `next()` function is a function in the Express router that, when invoked, executes the next middleware in the middleware stack.

If the current middleware function does not end the request-response cycle, it must call `next()` to pass control to the next middleware function. Otherwise, the request will be left hanging.

When we have multiple middleware functions, we need to ensure that each of our middleware functions either calls the `next()` function or sends back a response. Express will not throw an error if our middleware does not call the `next()` function and will simply hang.

The `next()` function is not a part of the Node.js or Express framework. The `next()` function could be named anything, but by convention, it is always named “next”. 

## Adding Middleware Functions for Processing All Requests
We might also want to perform some common processing for all the routes and specify them in one place instead of repeating them for all the route definitions. Examples of common processing are authentication, logging, common validations, etc.

Let us suppose we want to print the HTTP method (get, post, etc.) and the URL of every request sent to the Express application. Our middleware function for printing this information will look like this:

```js
const express = require('express');

const app = express();

const requestLogger = (request, response, next) => {
    console.log(`${request.method} url:: ${request.url}`);
    next()
}

app.use(requestLogger) 
```
This middleware function: `requestLogger` accesses the `method` and `url` fields from the `request` object to print the request URL along with the HTTP method to the console.

For applying the middleware function to all routes, we will attach the function to the `app` object that represents the `express()` function.

Since we have attached this function to the `app` object, it will get called for every call to the express application. Now when we visit `http://localhost:3000` or any other route in this application, we can see the HTTP method and URL of the incoming request object in the terminal window. 

## Adding Middleware Function for Error Handling 

Express comes with a default error handler that takes care of any errors that might be encountered in the application. The default error handler is added as a middleware function at the end of the middleware function stack.

We can change this default error handling behavior by adding a custom error handler which is a middleware function that takes an error parameter in addition to the parameters: `request`, `response`, and the `next()` function.

The basic signature of an error-handling middleware function in Express looks like this:

```js
function customeErrorHandler(err, request, response, next) {

  // Error handling middleware functionality

}
```
When we want to call an error-handling middleware, we pass on the error object by calling the `next()` function like this:

```js
const errorLogger = (err, request, response, next) => {
    console.log( `error ${err.message}`) 
    next(err) // calling next middleware
}
```

Let us define three middleware error handling functions and add them to our routes. We have also added a new route that will throw an error as shown below:

```js

// Error handling Middleware functions
const errorLogger = (error, request, response, next) => {
  console.log( `error ${error.message}`) 
  next(error) // calling next middleware
}

const errorResponder = (error, request, response, next) => {
response.header("Content-Type", 'application/json')
  
const status = error.status || 400
response.status(status).send(error.message)
}
const invalidPathHandler = (request, response, next) => {
response.status(400)
response.send('invalid path')
}
  
app.get('product', (request, response)=>{
  response.sendFile("productsample.html")
})

// handle get request for path /
app.get('/', (request, response) => {
    response.send('response for GET request');
})

app.post('/products', requireJsonContent, (request, response) => {
...
...
})

app.get('/productswitherror', (request, response) => {
  let error = new Error(`processing error in request at ${request.url}`)
  error.statusCode = 400
  throw error
})

app.use(errorLogger)
app.use(errorResponder)
app.use(invalidPathHandler)
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})

```
These middleware error handling functions perform different tasks: one of them logs the error message, the second sends the error response to the client, and the third one responds with a message for `invalid path` when a non-existing route is requested. 

We have next attached these three middleware functions for handling errors to the `app` object by calling the `use()` method.

To test how our application handles errors with the help of these error handling functions, let us invoke the route with URL: `localhost:3000/productswitherror`. 

Now instead of the default error handler, the first two error handlers get triggered. The first one logs the error message to the console and the second one sends the error message in the response. 

When we request a non-existent route, the third error handler is invoked giving us an error message: `invalid path`.

## Using Third-Party Middlewares
We can also use third-party middleware to add functionality built by the community to our Express applications. These are usually available as npm modules which we install by running the `npm install` command in our terminal window.
The following example illustrates installing and loading a third-party middleware named `Morgan` which is an HTTP request logging middleware for Node.js. 

```shell
npm install morgan
```
After installing the module containing the third-party middleware, we need to load the middleware function in our Express application as shown below:
```js
const express = require('express')
const morgan = require('morgan')

const app = express()

app.use(morgan('tiny'))

```
Here we are loading the middleware function `morgan` by calling `require()` and then attaching the function to our routes with the `use()` method of the `app` instance.

## Developing Express Middleware with TypeScript 
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

### Writing the Express Middleware Functions in TypeScript
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

