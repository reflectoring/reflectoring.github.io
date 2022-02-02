---
authors: [pratikdas]
title: "Getting Started with Express"
categories: ["aws"]
date: 2022-01-20T00:00:00
excerpt: "Express is a minimal and flexible Node.js web application framework. We can use this framework to build APIs, serve web pages, and other static assets and use it as a light weight HTTP server and backend for our applications. In this article, we will introduce the Express framework and learn to use it to build HTTP servers, REST APIs and web pages."
image: images/stock/0115-2021-1200x628-branded.jpg
url: getting-started-with-express
---

Express is a minimal and flexible Node.js web application framework. We can use this framework to build APIs, serve web pages, and other static assets and use it as a light weight HTTP server and backend for our applications.

In this article, we will introduce the Express framework and learn to use it to build HTTP servers, REST APIs and web pages.

{{% github "https://github.com/thombergs/code-examples/tree/master/node/express/getting-started" %}}

## Introducing Node.js
Node.js is an open-source runtime environment for executing JavaScript applications in the server. It was launched in 2009 and has quickly gained popularity among developers for building server side applications. 

Some of the key features of Node.js are:

- **Asynchronous, Non-blocking, event-driven IO**:  When a request is received by Node server for an Input/Output operation, it will execute the operation in the background in a seperate thread and continue with processing other requests.

- **V8 JavaScript Engine**: Node uses the V8 JavaScript Runtime engine which is also used by Google Chrome. This makes the runtime engine much faster and hence enables faster processing of requests.

- **Handling of concurrent requests**: – Another key functionality of Node is the ability to handle concurrent connections with a very minimal overhead on a single process.

- **The Node.js library uses JavaScript** – This is another important aspect of development in Node.js. A major part of the development community is already well versed in javascript, and hence, development in Node.js becomes easier for a developer who knows javascript.

There is an active and vibrant community for the Node.js framework. Because of the active community, there are always keys updates made available to the framework. This helps to keep the framework always up-to-date with the latest trends in web development.

## What is Express

Express is a popular Node.js framework for authoring web applications. Express provides  :
1. methods to specify the function to be called for a particular HTTP verb (GET, POST, SET, etc.) and URL pattern ("Route"), 
2. what template ("view") engine is used, where template files are located, and what template to use to render a response. 
3. middleware to add support for cookies, sessions, and users, getting POST/GET parameters, etc. 
4. Default Error handler


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
When we run this application in Node.js, we will have a HTTP server listening on port `3000` which can receive a GET request on http://localhost:3000/ and respond with a text message: `response for GET request`.

We can observe the following components in this application:

1. A server which listens for HTTP requests on a port
2. The app object representing the Express function
3. Routes which define URLs or path to receive the HTTP request with different HTTP verbs
4. Handler functions associated with each route which are called by the framework when request is received on a particular route.
5. Middleware functions which perform processing on the request in different stages of a request handling pipeline

While Express itself is fairly minimalist, there is a wealth of utilities created by the community in the form of middleware packages which can address almost any web development problem. 


## Installing Express

To generate, apply and test Express Middleware, you should have certain things installed prior. Firstly, install Node and NPM using the following syntax:

npm -v && node –v
Before you install, have a check whether you are installing the right versions of the Node and NPM versions.

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
This will install the Express framework and add it as a dependency in the dependencies list in package.json file as shown below:

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


This will the express dependency to `package.json` file.

## Running a Simple Web Server
Now that Express is installed, let us create a new file named `index.js` and open the project folder in our favourite code editor. We will be using VS Code as our IDE for our project.

Then, we will add the following lines of code to `index.js`:

```js
const express = require('express');

const app = express();

// start the server
app.listen(3000, 
   () => console.log('Server listening on port 3000.'));

```

The first line here is importing the main Express module from the package we installed earlier. This module is a function, which we are running on the second line to create a variable named `app`. Next we are calling the `listen()` function on the `app` to start the server. 

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
When we can visit the URL: `localhost:3000` in our web browser we will get a message `Cannot GET /`. This means that the server recognizes it as a HTTP `GET` request on the root path `/` but fails to give any response. 

We will fix this in the next section where we will add some routes to our server which will enable it to give appropriate responses based on the request path sent in the browser URL.


## Adding our First Route for Handling Requests
A route in express helps us to determine how our application will respond to a client request sent to a particular URL or path made with a specific HTTP request method like GET, POST, PUT, and so on. 

We define a route by associating it with one or more handler functions, which are executed when the route is matched.

Next let us add a route to tell our Express application which can handle a GET request to our server sent to the root path: `/`:

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

This function takes two parameters:  The first is the URL for this function to act upon. In this case, we are targeting '/', which is the root of our website: in this case, localhost:3000.

The second parameter is a function with two parameters: `req`, and `res`. `req` represents the request that was sent to the server. We can use this object to read data about what the client is requesting to do. `res` represents the response that we will be send back to the client.

Here, we are calling the `send()` function on the `res` object to send back a response in plain text: 'response for GET request'.

## Creating REST API with Express

Let us add some routes to build APIs conforming to the REST architectural style (REST API). 

Let us add a GET method method to create a REST API which will return a JSON response


```js
const express = require('express');

const app = express();

// handle get request for path /products
app.get('/products', (req, res) => {

  const products = [{"name":"television", "price":112.34, "brand":"samsung"},
                    {"name":"washing machine", "price": 345.34, "brand": "LG"}];

  res.json(products);
});

// start the server
app.listen(3000, 
   () => console.log('Server listening on port 3000.'));

```
Here we have created a REST API with GET method which will return a list of products in JSON format.

Let us next add a GET method method which will return a `product` based on a request path parameter:

```js
// handle get request for path /products
app.get('/products/:brand', (req, res) => {

  const products = [{"name":"television", "price":112.34, "brand":"samsung"},
                    {"name":"washing machine", "price": 345.34, "brand": "LG"},
                    {"name":"Macbook", "price": 3454.34, "brand": "Apple"}];

  const brand = req.params.brand;

  console.log("brand " + brand);
  
  const productsFiltered = products.filter(product=> product.brand == brand);                  

  res.json(productsFiltered);
});

```
Here we have sent a path parameter in the request URL like http://localhost:3000/products/samsung. We extract the path parameter by calling `req.params.brand`. Similarly we can extract query parameter with req.query.params.

Finally, once we’ve set up our requests, we must start our server!

## Adding Middleware to Handle Requests
Middleware in Express are functions that come into play after the server receives the request and before the response is sent to the client. They are arranged in a chain are called in a sequence.

Let us define a simple middleware function which prints the request to the console:

```js
const requestLogger = (req, res, next) => {
                          console.log(req);
                          next();
                        };
```
As we can see the middleware function takes the request and the response objects as first two parameters and a `next()` funcion as a third parameter. 

We can use middleware functions for different type of processing tasks required for fulfilling the request like database querying, making API calls, preparing the response, etc and finally calling the `next()` for invoking the next middleware function in the chain.

Let us attach this middleware function to the app object by calling the `use()` method:

```js
const express = require('express');

const app = express();

const requestLogger = (req, res, next) => {
  console.log(req);
  next();
};

app.use(requestLogger);

```
Since we have attached this function to the app object, it will get called for every call to the express application. Now when we visit `http://localhost:3000`, we can see the output of the incoming request object in the terminal window. 

Next let us attach a second middleware function which will apply a constraint of sending specific headers with the incoming requests. The requests will be allowed if the headers are sent and rejected otherwise:

```js
const allowJsonContent = (req, res, next) => {
  if (req.headers['sender'] !== 'testclient') {
    res.status(400).send('Invalid sender')
    
  } else {
    next()
  }
};
```
This function mandates sending a header named `sender` with a value of `testclient` to allow requests to be processed.

The complete code with these two middleware functions attached looks like this:

```js
onst express = require('express');

const app = express();

const requestLogger = (req, res, next) => {
  console.log(req);
  next();
};

const allowJsonContent = (req, res, next) => {
  if (req.headers['sender'] !== 'testclient') {
    res.status(400).send('Invalid sender')
    
  } else {
    next()
  }
};

app.use(requestLogger);
app.use(allowJsonContent);


```

Two aspects of middleware functions to keep in mind are:

They are triggered sequentially (top to bottom) based on their sequence in code.
They operate until the process exits, or the response has been sent back to the client.


Middleware functions take three arguments: the request object (req), the response object (res), and optionally the next middleware function. The next middleware function is commonly denoted by a variable named next.


With Express, we can write and use middleware functions, which have access to all HTTP requests coming to the server. These functions can:

Execute any code.
Make changes to the request and the response objects.
End the request-response cycle.
Call the next middleware function in the stack.
We can write our own middleware functions or use third-party middleware by importing them the same way we would with any other package.

## Types of express middleware

Application level middleware app.use
Router level middleware router.use
Built-in middleware express.static,express.json,express.urlencoded
Error handling middleware app.use(err,req,res,next)
Thirdparty middleware bodyparser,cookieparser
Here is an example of a middleware function which runs for all requests:

```js

```

## Error Handling
Express comes with a default error handler that takes care of any errors that might be encountered in the app. This default error handler is a middleware function which is added at the end of the middleware function stack.

When an error is encountered in a synchronous code, Express catches it automatically. Here is an example of a route handler function where we simulate an error condition by throwing an error:

```js
app.get('/products/error', (req, res) => {
  throw new Error("processing error!")
});

app.get('/', (req, res, next) => {
  try {
      throw new Error("Hello error!")
  }
  catch (error) {
      next(error)
  }
})

```

Express catches this error for us and responds to the client with the error’s status code, message, and the stack trace (for non-production environments).

```shell
Error: processing error!
    at ...storefront/index.js:35:9
    at Layer.handle [as handle_request] (...storefront/node_modules/express/lib/router/layer.js:95:5)
    at next (...storefront/node_modules/express/lib/router/route.js:137:13)
    at Route.dispatch (...storefront/node_modules/express/lib/router/route.js:112:3)
    at Layer.handle [as handle_request] (...storefront/node_modules/express/lib/router/layer.js:95:5)
    at Users/pratikdas/pratik/node/...storefront/node_modules/express/lib/router/index.js:281:22
...
...

```
We can add custom error handler by adding middleware functions.

Custom error handler works by adding an error parameter in addition to the parameters of the request, response and the `next()` function

The basic signature of Express Middleware which handles errors appears as:

```js


app.use((err, req, res, next) => {

  // Error handling middleware functionality here

})
```

When we want to call an error-handling middleware, we pass on the error by calling the `next()` function in the following format:

app.get('/my-other-thing', (req, res, next) => {

  next(new Error('I am passing you an error!'));

});

```js
app.use((err, req, res, next) => {

  console.log(err);    

  if(!res.headersSent){

    res.status(500).send(err.message);

  }

});

```

In this code, the error handling middleware present at the end of the pipeline handles the error. The res.headersSent function efficiently checks whether the response has already sent the headers to the client. If it fails to send the headers, it updates a 500 HTTP status and the error message to the client.

You can even handle multiple types of error handling by chaining the error handling middleware.

For handling errors raised during asynchronous code execution in Express (versions < 5.x), developers need to themselves catch their errors and invoke the in-built error handler middleware using the next() function. Here’s how:

```js
app.get('/', (req, res, next) => {
  setTimeout(() => {
      try {
          console.log("Async code example.")
          throw new Error("Hello Error!")
      } catch (error) { // manually catching
          next(error) // passing to default middleware error handler
      }
  }, 1000)
})

```
Express 5.0 (currently in alpha) can automatically catch errors (and rejections) thrown by returned Promises. 


Here, we have add three middleware functions – one for logging errors, one for sending the error to the client, and one for redirecting a user from an invalid route to an error landing page. Now let’s import these into our main file and use them in our application.

## Refactoring and Modularizing of an Express Application

So far we have written all our code in a single file `index.js`. In real-life projects, this quickly becomes unwieldy. So let us break down the code in `index.js` and distribute them across the following  files :
- `routes.js` which will contain all the route handler functions.
- `middleware.js` which will have all the middleware functions.
- `errormiddleware.js` containing all the custom error handlers.
- `server.js` which will use functions from the above files and run the Express application.

The express.Router class can be used to create modular mountable route handlers. A Router instance is a complete middleware and routing system; for this reason it is often referred to as a “mini-app”.

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

```js
// routes.js
const express = require('express')

const router = express.Router()

// handle get request for path /products
router.get('/products', (req, res) => {
...
});

// handle get request for path /products
router.get('/products/:brand', (req, res) => {
...
...
});

// handle get request for path /products
router.post('/products', (req, res) => {
...
...
});


router.get('/error', (req, res) => {
    res.send("The URL you are trying to reach does not exist.")
})

module.exports = router

```


We need to understand the following building blocks when writing an express application:
- Server

- App

- Middleware

- 
In a traditional data-driven website, a web application listens for HTTP requests which are usually sent from a web browser or any other web client. 

When a request is received the web application maps an action for fulfilling the request based on the URL pattern and information contained in POST data or GET data. 

Depending on what is required it may then read or write information from a database or perform other tasks required to satisfy the request. 

The application will then return a response to the web browser, often dynamically creating an HTML page for the browser to display by inserting the retrieved data into placeholders in an HTML template.



## Conclusion

Here is a list of the major points for a quick reference:

1. Express is a light weight framework for building web application on Node.js

2. Express is installed as an npm module in a Node.js project

3. We define Routes in Express associating handler functions with url paths.

4. We use one or more middleware functions to perform intermmediate processing between the time the request is received and the response is sent.

5. Express comes with a default error handler for handling error conditions. Beyong this we can define our custom error handler as a middleware function.



You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/node/express/getting-started).

