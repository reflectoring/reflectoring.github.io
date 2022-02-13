---
authors: [pratikdas]
title: "Getting Started with Express"
categories: ["Node"]
date: 2022-01-20T00:00:00
excerpt: "Express is a web application framework for Node.js. We can use this framework to build APIs, serve web pages, and other static assets and use it as a lightweight HTTP server and backend for our applications. In this article, we will introduce the Express framework and learn to use it to build HTTP servers, REST APIs, and web pages using both JavaScript and TypeScript."
image: images/stock/0115-2021-1200x628-branded.jpg
url: getting-started-with-express
---

Express is a web application framework for Node.js. We can use this framework to build APIs, serve web pages, and other static assets and use it as a lightweight HTTP server and backend for our applications.

In this article, we will introduce the Express framework and learn to use it to build HTTP servers, REST APIs, and web pages using both JavaScript and TypeScript.

{{% github "https://github.com/thombergs/code-examples/tree/master/node/express/getting-started" %}}

## Introducing Node.js
A basic understanding of [Node.js](https://nodejs.org/en/docs/guides/getting-started-guide/) is essential for working with Express. 

`Node.js` is an open-source runtime environment for executing server-side JavaScript applications. A unique feature of Node.js runtime is that it is a non-blocking, event-driven input/output(I/O) request processing model.

`Node.js` uses the [V8 JavaScript Runtime](https://v8.dev/docs) engine which is also used by Google Chrome web browser developed by Google. This makes the runtime engine much faster and hence enables faster processing of requests. 

To use Express, we have to first install `Node.js` and [npm](https://www.npmjs.com/package/npm) in our development environment. `npm` is a JavaScript Package Manager. `npm` is bundled with `Node.js` by default. 

We can refer to the [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) site for the installation instructions for `npm`. Similarly, we can find the installation instructions for `Node.js` on its [official website](https://nodejs.org/en/download/). 

## What is Express?

Express is a popular Node.js framework for authoring web applications. Express provides methods to specify the function to be called for a particular HTTP verb (GET, POST, SET, etc.) and URL pattern ("Route"). 

A typical Express application looks like this:

```js
// Import the express function
const express = require('express')
const app = express()

// Define middleware for all routes
app.use((request, response, next) => {
  console.log(request)
  next()})

// Define route for GET request on path '/'
app.get('/', (request, response) => {
  response.send('response for GET request');
});

// Start the server on port 3000
app.listen(
   3000, 
   () => console.log(`Server listening on port 3000.`));
```
When we run this application in `Node.js`, we will have an HTTP server listening on port `3000` which can receive a GET request sent from the URL: `http://localhost:3000/` and respond with a text message: `response for GET request`.

We can observe the following components in this application:

1. A server that listens for HTTP requests on a port
2. The `app` object representing the Express function
3. Routes that define URLs or paths to receive the HTTP request with different HTTP verbs
4. Handler functions associated with each route are called by the framework when a request is received on a particular route.
5. Middleware functions that perform processing on the request in different stages of a request handling pipeline

While Express itself is fairly minimalist, there is a wealth of utilities created in the community in the form of middleware packages that can address almost any web development problem. 


## Installing Express

Let us start by first installing Express. 

Before that let us create a folder and initialize a `Node.js` project under it by running the `npm init` command:

```shell
mkdir storefront
cd storefront
npm init -y
```
Running these commands will create a `Node.js` project containing a `package.json` file resulting in this output:

```shell
Wrote to /.../storefront/package.json :

{
  "name": "storefront",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```
The Express framework is published as a `Node.js` module and made available through the `npm` registry.

Installation of the framework is done using the `npm install` command as shown below:

```shell
npm install express --save
```
Running this command will install the Express framework and add it as a dependency in the dependencies list in a `package.json` file as shown below:

```json
{
  "name": "storefront",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.17.2"
  }
}
``` 
In this `package.json` file, we can see the Express framework added as a dependency: `"express": "^4.17.2"` .

## Running a Simple Web Server
Now that Express is installed, let us create a new file named `index.js` and open the project folder in our favorite code editor. We are using [Visual Studio Code](https://code.visualstudio.com) as our source-code editor.

Let us now add the following lines of code to `index.js`:

```js
const express = require('express');

const app = express();

// start the server
app.listen(3000, 
   () => console.log('Server listening on port 3000.'));
```
The first line here is importing the `express` module from the Express framework package we installed earlier. This module is a function, which we are running on the second line to assign its handle to a variable named `app`. Next, we are calling the `listen()` function on the `app` handle to start our server. 

The `listen()` function takes a port number as the first parameter on which the server will listen for the requests from clients. 

The second parameter to the `listen()` function is optional. It is a function
that runs after the server starts up. Here we are setting the port number as `3000` and a function which will print a message to the console about the server starting up. 

Let us run our application with the `node` command:

```shell
node index.js
```
We can see the message in our `listen()` function appearing in our terminal window:
```shell
Server listening on port 3000.
```
Our server is running now and listening for requests in port `3000`. 
When we can visit the URL: `localhost:3000` in our web browser we will get a message: `Cannot GET /`. This means that the server recognizes it as an HTTP `GET` request on the root path `/` but fails to give any response. 

We will fix this in the next section where we will add some routes to our server which will enable it to give appropriate responses by detecting the request path sent in the browser URL.


## Adding our First Route for Handling Requests
A route in express helps us to determine how our application will respond to a client request sent to a particular URL or path made with a specific HTTP request method like GET, POST, PUT, and so on. 

We define a route by associating it with one or more callback functions called handler functions, which are executed when the application receives a request to the specified route (endpoint) and the HTTP method is matched.

Let us now add a route to tell our Express application that will enable it to handle a GET request to our server sent to the root path: `/`:

```js
const express = require('express');

const app = express();

// handle get request
app.get('/', (request, response) => {
  // send back a response in plain text
  response.send('response for GET request');
});

// start the server
app.listen(3000, 
   () => console.log('Server listening on port 3000.'));
```
We have added the route just after the declaration of the `app` variable. In this route, we tell our Express server how to handle a GET request sent to the server. 

This function takes two parameters:  
- **Route Path**: The route path is sent as the first parameter. It is in the form of a URL that will be matched with the URL of the HTTP request received by the server. In this case, we are using a route path: `/`, which is the root of our website. This route will match GET requests sent from URL: `localhost:3000`. Instead of using fixed URLs, we can also use string patterns, or regular expressions to define route paths. 

- **Handler Function**: The second parameter is a function with two arguments: `request`, and `response`, also called the `Handler Function`. The first argument of the handler function: `request` represents the HTTP request that was sent to the server. We can use this object to extract information about the HTTP request like request headers, and request parameters sent as a query string, path parameters, request body, etc. The second argument: `response` represents the HTTP response that we will be sending back to the client. 

Here, we are calling the `send()` method on the `response` object to send back a response in plain text: `response for GET request`. 

## Adding Parameters to Routes 

A route as we saw earlier is identified by a route path in combination with a request method which defines the endpoints at which requests can be made. 

Route paths are often accompanied by route parameters and take this form:
 `/products/:brand`

Let us define a route containing a route parameter as shown below. For simplicity of this example, we are reading from a hardcoded in-memory `products` array. In a real-world application, we will want to replace the hardcoded data with data residing in a database:

```js
let products = [
  {"name":"television", "price":112.34, "brand":"samsung"},
  {"name":"washing machine", "price": 345.34, "brand": "LG"},
  {"name":"Macbook", "price": 3454.34, "brand": "Apple"}
];

// handle get request for fetching products
// belonging to a particular brand
app.get('/products/:brand', (request, response) => {

  // read the captured value of route parameter named: brand
  const brand = request.params.brand

  console.log(`brand ${brand} `)
  
  const productsFiltered = products.filter(product=> product.brand == brand)               

  response.json(productsFiltered)
});
```
Here we have used a route parameter named `brand`.
Route parameters are named URL segments that are used to capture the values specified at their position in the URL. The captured values are populated in the `request.params` object, with the name of the route parameter specified in the path as their respective keys. 

In this example, the name of the route parameter is `brand` and is read with the construct `request.params.brand`.

## Modularizing Routes with Express Router
Defining all the routes in a single file becomes unwieldy in real-life projects. We can add modularity to the routes with the help of Express's `Router` class. This class can be used to create modular route handlers. 

An instance of the `Router` class is a complete middleware and routing system. Let us define our routes in a separate file and name it `routes.js`. We will define our routes using the `Router` class like this:

```js
// routes.js
const express = require('express')

const router = express.Router()

// handle get request for path /products
router.get('/products', (request, response) => {
...
});

// handle get request for path /products/:brand
router.get('/products/:brand', (request, response) => {
...
...
});

module.exports = router
```

We will next define our server in another file: `server.js` and import the routes defined in the file: `routes.js`. The server code looks much more concise like this:

```js
// server.js
const express = require('express')
const routes = require('./routes');

const app = express()
const PORT = process.env.PORT || 3000


app.use(routes)

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})
```
We have also used an environment variable to define the server port which will default to `3000` if the port is not supplied. 

Let us run this file with the `node` command:

```shell
node server.js
```
We will use this file: `server.js` henceforth to run our HTTP server instead of `index.js`.

## Adding Middleware for Processing Requests
Middleware in Express are functions that come into play **after the server receives the request and before the response is sent to the client**. They are arranged in a chain and are called in sequence. 

We can use middleware functions for different types of processing tasks required for fulfilling the request like database querying, making API calls, preparing the response, etc, and finally calling the next middleware function in the chain. 

Middleware functions take three arguments: the request object (`request`), the response object (`response`), and optionally the `next()` middleware function :

```js
function middlewareFunction(request, response, next){
  ...
  next()
}
```

Middleware functions in Express are of the following types:

- Application-level middleware which runs for all routes in an `app` object
- Router level middleware which runs for all routes in a router object
- Built-in middleware provided by Express like `express.static`, `express.json`, `express.urlencoded`
- Error handling middleware for handling errors
- Third-party middleware maintained by the community 

### Adding Application-Level Middleware for Processing All Requests

We will define our middleware functions in a file: `middleware.js`.

Let us define a simple middleware function which prints the request to the console:

```js
const requestLogger = (request, response, next) => {
  console.log(request);
  next();
};
```
As we can see the middleware function takes the request and the response objects as the first two parameters and the `next()` function as the third parameter. 


Let us attach this middleware function to the `app` object by calling the `use()` method:

```js
const express = require('express');

const app = express();

const requestLogger = (request, response, next) => {
  console.log(request);
  next();
};

app.use(requestLogger);

```
Since we have attached this function to the `app` object, it will get called for every call to the express application. Now when we visit `http://localhost:3000`, we can see the output of the incoming request object in the terminal window. 

### Using Express' Built-in Middleware for some more Processing

Express also offers middleware functions called [built-in middleware](https://expressjs.com/en/guide/using-middleware.html#middleware.built-in). 

To demonstrate the use of Express' built-in middleware, let us create a route for the HTTP POST method for adding a new `product`. The handler function for this route will accept `product` data from the `request` object in JSON format. As such we require a JSON parser to parse the fields of the new `product`.  

For this we will use Express' built-in middleware for parsing JSON and attach it to our `router` object like this:

```js
// routes.js
const express = require('express')
const { requireJsonContent } = require('./middleware')

const router = express.Router()

// use express' json middleware and 
// Set the body size limit of JSON payload 100 bytes
router.use(express.json({ limit: 100 }))

```
We have also configured a maximum size of `100` bytes for the JSON request.

Now we can extract the fields from the JSON payload sent in the request body as shown in this route definition:

```js
// routes.js
const express = require('express')

const router = express.Router()
let products = []
// handle post request for path /products
router.post('/products', (request, response) => {
  
  // sample JSON request
  // {"name":"furniture", "brand":"century", "price":1067.67}

  // Extract name of product
  const name = request.body.name               

  const brand = request.body.brand

  console.log(name + " " + brand)
  
  products.push({
    name: request.body.name, 
    brand: request.body.brand, 
    price: request.body.price
  })              
 
  const productCreationResponse = {
    productID: "12345", 
    result: "success"
  }
  
  response.json(productCreationResponse)
})
```
Here we are extracting the contents of the JSON request by calling `req.body.FIELD_NAME` before using those fields for adding a new `product`.

Similarly we will use express' `urlencoded()` middleware to process URL encoded fields submitted through a HTTP form object:

```js
app.use(express.urlencoded({ extended: false }));
``` 

### Adding Middleware for a Single Route
Next, let us define another middleware function that will apply to a specific route only. We will attach this to the route instead of the `app` object. 

As an example, let us validate the existence of JSON content in the HTTP POST request before performing any further processing and instead send back an error response if JSON content is not received. 

Our middleware function for performing this check will look like this:

```js
// middleware.js

const requireJsonContent = (request, response, next) => {
    if (request.headers['content-type'] !== 'application/json') {
      response.status(400).send('Server requires application/json')
    } else {
      next()
    }
}

module.exports = { requireJsonContent }
```
Here we are checking for the existence of a `content-type` header with a value of `application/json` in the request. We are sending back an error response with status `400` accompanied by an error message if this header is not present. Otherwise, the `next()` function is invoked to call the subsequent middleware present in the chain. 

Our route for the HTTP `POST` method with the `requireJsonContent()` middleware function attached will look like this:

```js
// handle post request for path /products
router.post('/products', 
  requireJsonContent,     // first function in the chain will 
                          // check for JSON content
  (request, response) => { // second function will process the request
                           // if first function detects the content as jSON
  // process json request
  ...
  ...
  response.json(
    {productID: "12345", 
    result: "success")}
  );

```
Here we have two middleware functions attached to the route with route path `/products`.

The first middleware function `requireJsonContent()` will pass the control to the next function in the chain if the `content-type` header in the HTTP request contains `application/json`. The second middleware function processes the request further and sends back a response in JSON format to the caller.

### Adding Error Handling Middleware

Express comes with a default error handler that takes care of any errors that might be encountered in the app. This default error handler is a middleware function that is added at the end of the middleware function stack.

When an error is encountered in a synchronous code, Express catches it automatically. Here is an example of a route handler function where we simulate an error condition by throwing an error:

```js
const express = require('express')

const router = express.Router()

router.get('/productswitherror', (request, response) => {
  let err = new Error("processing error ")
  err.statusCode = 400
  throw err
});

```
Here we are throwing an error with status code 400 and an error message `processing error `. 

When this route is invoked with URL: `localhost:3000/productswitherror`, Express catches this error for us and responds with the error’s status code, message, and the stack trace of the error (for non-production environments) as shown below:

```text
Error: processing error!
    at ...storefront/routes.js:68:9
    at Layer.handle [as handle_request] (...storefront/node_modules/express/lib/router/layer.js:95:5)
    at next (...storefront/node_modules/express/lib/router/route.js:137:13)
    at Route.dispatch (...storefront/node_modules/express/lib/router/route.js:112:3)
    at Layer.handle [as handle_request] (...storefront/node_modules/express/lib/router/layer.js:95:5)
    at ...storefront/node_modules/express/lib/router/index.js:281:22
...
...

```

We can change this default error handling behavior by adding a custom error handler.

The custom error handling in Express works by adding an error parameter into a middleware function in addition to the parameters: `request`, `response`, and the `next()` function.

The basic signature of Express Middleware which handles errors appears as:

```js
function customeErrorHandler(err, request, response, next) {

  // Error handling middleware functionality here

}
```

When we want to call an error-handling middleware, we pass on the error object by calling the `next()` function like this:

```js
const errorLogger = (err, request, response, next) => {
    console.log( `error ${err.message}`) 
    next(err) // calling next middleware
}
```

Let us define three middleware error handling functions in a separate file: `errormiddleware.js` as shown below:

```js
// errormiddleware.js
const errorLogger = (err, request, response, next) => {
    console.log( `error ${err.message}`) 
    next(err) // calling next middleware
}
  
const errorResponder = (err, request, response, next) => {
    response.header("Content-Type", 'application/json')
    
    response.status(err.statusCode).send(err.message)
}

const invalidPathHandler = (request, response, next) => {
    response.status(400)
    response.send('invalid path')
}
  
module.exports = { errorLogger, errorResponder, invalidPathHandler }
```

These middleware error handling functions perform different tasks: one of them logs the error message, the second sends the error response to the client, and the third one responds with a message for `invalid path` when a non-existing route is requested. 

Next, let us import these error handling middleware functions into our `server.js` file and attach them in our application:

```js
// server.js
const express = require('express')
const routes = require('./routes')

const { errorLogger, errorResponder, invalidPathHandler } 
                           = require('./errormiddleware')

const app = express()
const PORT = process.env.PORT || 3000

app.use(requestLogger)
app.use(routes)

// adding the error handlers
app.use(errorLogger)
app.use(errorResponder)
app.use(invalidPathHandler)

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})
```

Here we have attached the three middleware functions for handling errors to the `app` object by calling the `use()` method.

To test how our application handles errors with the help of these error handling functions, let us invoke the same route we invoked earlier with URL: `localhost:3000/productswitherror`. 

Now instead of the default error handler, the first two error handlers get triggered. The first one logs the error message to the console and the second one sends the error message in the response. 

When we request a non-existent route, the third error handler is invoked giving us an error message: `invalid path`.

## Creating Dynamic HTML with a Template Engine
We can create dynamic HTML pages using Express from our server-side applications by configuring a template engine.

A template engine works by creating a template file with placeholders mapped to variables. We assign values to the variables declared in our template file in our application which will then return a response to the web browser, often dynamically creating an HTML page for the browser to display by inserting the retrieved data into placeholders.

Let us generate HTML for a home page using the [Pug](https://pugjs.org/api/reference.html) template engine. For that we need to first install the Pug template engine using `npm`:

```shell
npm install pug --save
``` 
Next, we will set the following properties in our `app` object defined in the `server.js` file to render the template files:

```js
// server.js
const express = require('express')

const app = express()
app.set('view engine', 'pug')
app.set('views', './views')
```
The `views` property defines the directory where the template files are located. Let us define a folder named `views` in the root project directory and create a template file named `home.pug` with the following contents:

```html
html
  head
    title= title
  body
    h1= message
    div
      p Generated by express at 
        span= sysdate

```
This is a Pug template with three placeholders represented by the variables: `title`, `message`, and `sysdate`.

We set the values of these variables in a handler function associated with a route as shown below:

```js
const express = require('express')

const router = express.Router()

router.get('/home',  (request, response) => {
  res.render("home", { 
   title: "Home", 
   message: "My home page" , 
   sysdate: new Date().toLocaleString()
  })
})
```
Here we are invoking the `render()` method on the res object to render the template named `Home` and assigned the values of the three variables in the template file. When we browse the route with URL: `http://localhost:3000/home`, we can see the HTML rendered from the template in the browser.

Other than Pug, some other template engines supported by Express are [Mustache](https://mustache.github.io) and [EJS](https://ejs.co). The complete list can be found in the website of [express](https://expressjs.com/en/resources/template-engines.html).

## Developing Express Applications with TypeScript 
So far we have written all our code in JavaScript. However, a major downside of JavaScript is the lack of support for types like string, number, etc. The types are interpreted at runtime. As such unintentional type-related errors are only be detected during runtime making it unfavorable for building enterprise applications. The TypeScript language seeks to address this limitation.

[TypeScript](https://www.typescriptlang.org) is an open-source language developed by Microsoft. It is a superset of JavaScript with additional capabilities, most notable being static type definitions making it an excellent tool for a better and safer development experience.

Let us look at the steps for building an Express application using the TypeScript language.  

### Installing TypeScript and other Configurations

We will enrich the project we have used till now to add support for TypeScript by starting with the installation of TypeScript.

We will install TypeScript as an `npm` package called `typescript` along with another package: `ts-node`:

```shell
npm i -D typescript ts-node

```
The `typescript` package transforms the code written in TypeScript language to JavaScript using a process called [transcompiling](https://en.wikipedia.org/wiki/Source-to-source_compiler) or transpiling. 

The `ts-node` `npm` package enables running TypeScript files from the command line in `Node.js` environments.

The -D, also known as the --dev option, means that both the packages are installed as development dependencies. After the installation, we will have the `devDependencies` property inside the `package.json` populated with these packages as shown below:

```json
{
  "name": "storefront",
...
...
  "devDependencies": {
    "ts-node": "^10.5.0",
    "typescript": "^4.5.5"
  }
}
```
Next, let us create a JSON file named `tsconfig.json` in our project’s root folder. We can define different options for compiling the TypeScript code inside the project as shown here:

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
Here we have specified four basic compiler options for the module system to be used in the compiled JavaScript code, targeted JavaScript version of the compiled code, root location of typescript files inside the project, and a flag that enables default imports for TypeScript modules with `export =` syntax.

Next, we will need the type definitions of the Node APIs and Express to be fetched from the `@types` namespace. For this we will need to install the `@types/node` and `@types/express` packages as a development dependency:
```shell
npm i -D @types/node @types/express
```
Our setup for TypeScript is now complete with the options for transpiling the TypeScript set and the types from Node.js and Express framework installed. We will use this setup to create our server and routes in TypeScript in the next sections.

### Running the Server Created with TypeScript
Let us create a file named `app.ts` which will contain the code written in TypeScript language for running the server application in the root directory. The TypeScript code for running the server application looks like this:

```ts
import express from 'express';

const app = express();
const port = 3000;

app.listen(port, () => {
    console.log(`Server listening at port ${port}.`);
  });

```
Here we have used the `express` module to create a server as we have seen before. With this configuration, the server will run on port `3000` and can be accessed with the URL: `http://localhost:3000`.

Let us next install the utility package `Nodemon` as another development dependency, which will speed up development by automatically restarting the server after each change:

```shell
npm i -D nodemon
```
We will next add a script named `serve` with `nodemon app.ts` command inside the scripts property in our project's `package.json` file:
```json

"scripts": {
    "serve": "nodemon app.ts"
  }

```
This script is used to start the server. The `ts-node` package installed earlier makes this possible under the hood, as normally we will not be able to run TypeScript files from the command line.

Now we can start our server by running the following command:
```shell
npm run serve
```
The output in the console after running the server looks like this:
```shell
[nodemon] 2.0.15
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: ts,json
[nodemon] starting `ts-node app.ts`
Server listening at port 3000.
```
We can choose not to use `Nodemon` and instead run the application using the below command:
```shell
npx ts-node app.ts
```
Running this command will start the server and result in a similar output as before. We have used `npx` here which is a command-line tool that can execute a package from the `npm` registry without installing that package.

### Adding a Route with a Handler Function Written in TypeScript

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
const getProducts = ( request: Request, 
                      response: Response, 
                      next: NextFunction) => {

    // Defining a hardcoded array of product entities
    let products: Product[] = [
      {"name":"television", "price":112.34, "brand":"samsung"},
      {"name":"washing machine", "price": 345.34, "brand": "LG"},
      {"name":"Macbook", "price": 3454.34, "brand": "Apple"}
    ]

    // sending a JSON response
    response.status(200)
            .json(products);
}

// Define the route with route path '/products'
app.get('/products', getProducts);

// Start the server
app.listen(port, () => {
    console.log(`Server listening at port ${port}.`);
  });

```
We have modified the import statement on the first line to import the TypeScript interfaces that will be used for the `request`, `response`, and `next` parameters inside the Express middleware.

Next, we have defined a type named `Product` containing attributes: `name`, `price`, and `brand`. After we have defined the handler function for returning an array of `products` and finally associated it with a route with route path `/products`.

We can now access the URL: `http://localhost:3000/products` from the browser or run a curl command and get a JSON response containing the `products` array.

## Conclusion

Here is a list of the major points for a quick reference:

1. Express is a lightweight framework for building web applications on Node.js

2. Express is installed as an `npm` module in a `Node.js` project

3. We define Routes in Express by associating handler functions with URL paths also called route paths.

4. We use one or more middleware functions to perform intermediate processing between the time the request is received and the response is sent.

5. Express comes with a default error handler for handling error conditions. Beyond this, we can define custom error handlers as middleware functions.

6. We can create dynamic HTML pages using Express from our server-side applications by configuring template engines like Pug, Mustache, and EJS.

7. In this article, we built a web application containing GET and POST endpoints for a REST API and another endpoint for rendering an HTML.

8. We also used TypeScript to define a `Node.js` server application containing an endpoint for a REST API.  

9. The code of our web application is distributed across the following files :
    - `routes.js` contains all the route handler functions for the REST API along with another route to render the dynamic HTML based on a Pug template.
    - `middleware.js` contains all the middleware functions.
    - `errormiddleware.js` contains all the custom error handlers.
    - `server.js` which uses functions from the above files and runs the Express application.   
    - `app.ts` which contains the code written in TypeScript for running a server application with a REST API endpoint.  

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/node/express/getting-started).

