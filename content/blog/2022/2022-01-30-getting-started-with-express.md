---
authors: [pratikdas]
title: "Getting Started with Express"
categories: ["Node"]
date: 2022-01-20T00:00:00
excerpt: "Express is a web application framework for Node.js. We can use this framework to build APIs, serve web pages, and other static assets and use it as a lightweight HTTP server and backend for our applications. In this article, we will introduce the Express framework and learn to use it to build HTTP servers, REST APIs, and web pages."
image: images/stock/0115-2021-1200x628-branded.jpg
url: getting-started-with-express
---

Express is a web application framework for Node.js. We can use this framework to build APIs, serve web pages, and other static assets and use it as a lightweight HTTP server and backend for our applications.

In this article, we will introduce the Express framework and learn to use it to build HTTP servers, REST APIs, and web pages.

{{% github "https://github.com/thombergs/code-examples/tree/master/node/express/getting-started" %}}

## Introducing Node.js
A basic understanding of Node.js is essential for working with Express. 

Node.js is an open-source runtime environment for executing server-side JavaScript applications. A unique feature of Node.js runtime is that it's a non-blocking, event-driven I/O request processing model.

Node.js uses the V8 JavaScript Runtime engine which is also used by Google Chrome. This makes the runtime engine much faster and hence enables faster processing of requests. 

In order to use Express, we should first install Node.js and the Node Package Manager (npm) in our development environment. You can find download and installation instructions for Node.js on the [official website](https://nodejs.org/en/download/). Similarly, you can refer to the [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) site for the installation instructions of npm.

## What is Express?

Express is a popular Node.js framework for authoring web applications. Express provides methods to specify the function to be called for a particular HTTP verb (GET, POST, SET, etc.) and URL pattern ("Route"). 

A typical Express application looks like this:

```js
// Import the express function
const express = require('express')
const app = express()

// Define middleware for all routes
app.use((req, res, next) => {
  console.log(req)
  next()})

// Define route for GET request on path '/'
app.get('/', (req, res) => {
  res.send('response for GET request');
});

// Start the server on port 3000
app.listen(
   3000, 
   () => console.log(`Server listening on port 3000.`));
```
When we run this application in Node.js, we will have an HTTP server listening on port `3000` which can receive a GET request to http://localhost:3000/ and respond with a text message: `response for GET request`.

We can observe the following components in this application:

1. A server that listens for HTTP requests on a port
2. The `app` object representing the Express function
3. Routes that define URLs or paths to receive the HTTP request with different HTTP verbs
4. Handler functions associated with each route are called by the framework when a request is received on a particular route.
5. Middleware functions that perform processing on the request in different stages of a request handling pipeline

While Express itself is fairly minimalist, there is a wealth of utilities created by the community in the form of middleware packages that can address almost any web development problem. 


## Installing Express

Let us start by first installing Express. 

Before that let us create a folder and initialize a Node.js project under it by running the npm init command:

```shell
mkdir storefront
cd storefront
npm init -y
```
Running these commands will create a Node.js project with `package.json` file resulting in this output:

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

The Express framework is published as a Node.js module and made available through the npm registry.

Installation is done using the npm install command:

```shell
npm install express --save
```
This will install the Express framework and add it as a dependency in the dependencies list in a `package.json` file as shown below:

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


This will add the express dependency to the `package.json` file.

## Running a Simple Web Server
Now that Express is installed, let us create a new file named `index.js` and open the project folder in our favorite code editor. We will be using VS Code as our IDE for our project.

Then, we will add the following lines of code to `index.js`:

```js
const express = require('express');

const app = express();

// start the server
app.listen(3000, 
   () => console.log('Server listening on port 3000.'));
```

The first line here is importing the Express module from the package we installed earlier. This module is a function, which we are running on the second line to create a variable named `app`. Next, we are calling the `listen()` function on the `app` to start the server. 

The `listen()` function takes a port number as the first parameter on which the server will listen for the requests from clients. The second parameter to the `listen()` function is optional. It is a function
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
When we can visit the URL: `localhost:3000` in our web browser we will get a message `Cannot GET /`. This means that the server recognizes it as an HTTP `GET` request on the root path `/` but fails to give any response. 

We will fix this in the next section where we will add some routes to our server which will enable it to give appropriate responses based on the request path sent in the browser URL.


## Adding our First Route for Handling Requests
A route in express helps us to determine how our application will respond to a client request sent to a particular URL or path made with a specific HTTP request method like GET, POST, PUT, and so on. 

We define a route by associating it with one or more callback functions called handler functions, which are executed when the application receives a request to the specified route (endpoint) and the HTTP method is matched.

Next, let us add a route to tell our Express application which can handle a GET request to our server sent to the root path: `/`:

```js
const express = require('express');

const app = express();

// handle get request
app.get('/', (req, res) => {
  res.send('response for GET request');
});

// start the server
app.listen(3000, 
   () => console.log('Server listening on port 3000.'));
```
We have added the route just after the declaration of the `app` variable. In this route, we tell our Express server how to handle a GET request sent to our server. 

This function takes two parameters:  The first is the URL for this function to act upon also called the route path. In this case, we are targeting `/`, which is the root of our website: in this case, `localhost:3000`. We can also use string patterns, or regular expressions to define route paths. 

The second parameter is a function with two parameters: `req`, and `res`. `req` represents the request that was sent to the server. We can use this object to read data about what the client is requesting to do. `res` represents the response that we will be sending back to the client.

Here, we are calling the `send()` function on the `res` object to send back a response in plain text: 'response for GET request'. 

## Adding Parameters to Routes 

A route as we saw earlier is identified by a route path in combination with a request method which defines the endpoints at which requests can be made. 

Route paths are often accompanied by route parameters and take this form:
 `/products/:brand`

Let us define a route containing a route parameter as shown below. For simplicity, we are reading from a `products` array here instead of a database:

```js
let products = [
  {"name":"television", "price":112.34, "brand":"samsung"},
  {"name":"washing machine", "price": 345.34, "brand": "LG"},
  {"name":"Macbook", "price": 3454.34, "brand": "Apple"}
];

// handle get request for fetching products
// belonging to a particular brand
app.get('/products/:brand', (req, res) => {

  // read the captured value of route parameter named: brand
  const brand = req.params.brand

  console.log(`brand ${brand} `)
  
  const productsFiltered = products.filter(product=> product.brand == brand)               

  res.json(productsFiltered)
});
```
Here we have used a route parameter named `brand`.
Route parameters are named URL segments that are used to capture the values specified at their position in the URL. The captured values are populated in the `req.params` object, with the name of the route parameter specified in the path as their respective keys. 

In this example, the name of the route parameter is `brand` and is read with the construct `req.params.brand`.

## Modularizing Routes with Express Router
Defining all the routes in a single file becomes unwieldy in real-life projects. We can add modularity to the routes with the help of the Express's `Router` class. This class can be used to create modular route handlers. 

An instance of `Router` class is a complete middleware and routing system. Let us define our routes in a separate file and name it `routes.js`. We will define our routes using the `Router` class like this:

```js
// routes.js
const express = require('express')

const router = express.Router()

// handle get request for path /products
router.get('/products', (req, res) => {
...
});

// handle get request for path /products/:brand
router.get('/products/:brand', (req, res) => {
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
We have also used an environment variable to define the server port which will default to `3000` if the port is not supplied. Let us run this file with the node command:

```shell
node server.js
```
We will use this file henceforth to run our HTTP server instead of `index.js`.

## Adding Middleware for Processing Requests
Middleware in Express are functions that come into play **after the server receives the request and before the response is sent to the client**. They are arranged in a chain and are called in sequence. 

We can use middleware functions for different types of processing tasks required for fulfilling the request like database querying, making API calls, preparing the response, etc, and finally calling the next middleware function in the chain. 

Middleware functions take three arguments: the request object (`req`), the response object (`res`), and optionally the `next()` middleware function :

```js
function middlewareFunction(req, res, next){
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

We will define our middleware functions in a file `middleware.js`.

Let us define a simple middleware function which prints the request to the console:

```js
const requestLogger = (req, res, next) => {
  console.log(req);
  next();
};
```
As we can see the middleware function takes the request and the response objects as the first two parameters and the `next()` function as the third parameter. 


Let us attach this middleware function to the `app` object by calling the `use()` method:

```js
const express = require('express');

const app = express();

const requestLogger = (req, res, next) => {
  console.log(req);
  next();
};

app.use(requestLogger);

```
Since we have attached this function to the `app` object, it will get called for every call to the express application. Now when we visit `http://localhost:3000`, we can see the output of the incoming request object in the terminal window. 

### Using Express' Built-in Middleware for some more Processing

Express also offers middleware functions called built-in middleware. 

To demonstrate the use of Express' built-in middleware, let us create a route for the HTTP POST method for adding a new `product`. The handler function for this route will accept `product` data from the `req` object in JSON format. As such we require a JSON parser to parse the fields of the new `product`.  

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
We have also configured maximum size of 100 bytes for the JSON request.

Now we can extract the fields from the JSON payload sent in the request body as shown in this route definition:

```js
// routes.js
const express = require('express')

const router = express.Router()
let products = [];
// handle post request for path /products
router.post('/products', (req, res) => {
  
  // sample JSON request
  // {"name":"furniture", "brand":"century", "price":1067.67}

  // Extract name of product
  const name = req.body.name  ;                

  const brand = req.body.brand;

  console.log(name + " " + brand);
  
  products.push({
    name: req.body.name, 
    brand: req.body.brand, 
    price: req.body.price
  });               
 
  const productCreationResponse = {
    productID: "12345", 
    result: "success"
  };
  
  res.json(productCreationResponse);
});
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

const requireJsonContent = (req, res, next) => {
    if (req.headers['content-type'] !== 'application/json') {
      res.status(400).send('Server requires application/json')
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
router.post('/products', requireJsonContent, (req, res) => {
  // process json request
  ...
  ...
});

```
The `requireJsonContent()` middleware function will pass the control to the next function in the chain if the `content-type` header in the HTTP request contains `application/json`. The next function processes the request further and sends back a successful response after adding the product as shown earlier.

### Adding Error Handling Middleware

Express comes with a default error handler that takes care of any errors that might be encountered in the app. This default error handler is a middleware function that is added at the end of the middleware function stack.

When an error is encountered in a synchronous code, Express catches it automatically. Here is an example of a route handler function where we simulate an error condition by throwing an error:

```js
const express = require('express')

const router = express.Router()

router.get('/productswitherror', (req, res) => {
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
    at Users/pratikdas/pratik/node/...storefront/node_modules/express/lib/router/index.js:281:22
...
...

```

We can change this default error handling behavior by adding a custom error handler.

The custom error handling in Express works by adding an error parameter into a middleware function in addition to the parameters: request, response, and the `next()` function.

The basic signature of Express Middleware which handles errors appears as:

```js
function customeErrorHandler(err, req, res, next) {

  // Error handling middleware functionality here

}
```

When we want to call an error-handling middleware, we pass on the error object by calling the `next()` function like this:

```js
const errorLogger = (err, req, res, next) => {
    console.log( `error ${err.message}`) 
    next(err) // calling next middleware
}
```

Let us define three middleware error handling functions in a separate file: `errormiddleware.js` as shown below:

```js
// errormiddleware.js
const errorLogger = (err, req, res, next) => {
    console.log( `error ${err.message}`) 
    next(err) // calling next middleware
}
  
const errorResponder = (err, req, res, next) => {
    res.header("Content-Type", 'application/json')
    
    res.status(err.statusCode).send(err.message)
}

const invalidPathHandler = (req, res, next) => {
    res.status(400)
    res.send('invalid path')
}
  
module.exports = { errorLogger, errorResponder, invalidPathHandler }
```

These middleware error handling functions perform different tasks: one of them logs the error message, the second sends the error response to the client, and the third one responds with a message for `invalid path` when a non-existing route is requested. 

Next, let us import these error handling middleware functions into our `server.js` file and attach them in our application:

```js
// server.js
const express = require('express')
const routes = require('./routes')

const { errorLogger, errorResponder, invalidPathHandler } = require('./errormiddleware')

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

Let us generate HTML for a home page using the Pug template engine. For that we need to first install the pug template engine using npm:

```shell
npm install pug --save
``` 
Next we will set the following properties in our `app` object defined in the `server.js` file to render the template files:

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

router.get('/home',  (req, res) => {
  res.render("home", { 
   title: "Home", 
   message: "My home page" , 
   sysdate: new Date().toLocaleString()
  })
})
```
Here we are invoking the `render()` method on the res object to render the template named `Home` and assigned the values of the three variables in the template file. When we browse the route with URL: `http://localhost:3000/home`, we can see the HTML rendered from the template in the browser.

Other than Pug, some other template engines supported by Express are Mustache and EJS.




## Conclusion

Here is a list of the major points for a quick reference:



1. Express is a lightweight framework for building web applications on Node.js

2. Express is installed as an npm module in a Node.js project

3. We define Routes in Express associating handler functions with URL paths.

4. We use one or more middleware functions to perform intermediate processing between the time the request is received and the response is sent.

5. Express comes with a default error handler for handling error conditions. Beyond this, we can define custom error handlers as middleware functions.

6. We can create dynamic HTML pages using Express from our server-side applications by configuring template engines like Pug, Mustache, and EJS.

7. In this article, we built a web application containing GET and POST endpoints for a REST API and another endpoint for rendering an HTML.

8. The code of our web application is distributed across the following files :
    - `routes.js` contains all the route handler functions for the REST API along with another route to render the dynamic HTML based on a Pug template.
    - `middleware.js` contains all the middleware functions.
    - `errormiddleware.js` contains all the custom error handlers.
    - `server.js` which uses functions from the above files and runs the Express application.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/node/express/getting-started).

