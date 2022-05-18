---
title: "Complete Guide to Axios HTTP Client"
categories: ["node"]
date: 2022-04-24T05:00:00
modified: 2022-04-24T05:00:00
authors: [pratikdas]
excerpt: "Making API calls is integral to most applications and while doing this we use an HTTP client usually available as an external library. Axios is a popular HTTP client available as a JavaScript library with more than 22 million weekly downloads. We can make API calls with Axios from JavaScript applications irrespective of whether the JavaScript is running on front-end like a browser or on the server-side.

In this article, we will understand Axios and use its capabilities to make different types of REST API calls from JavaScript applications."
image: images/stock/0019-magnifying-glass-1200x628-branded.jpg
url: guide-to-axios
---

Making API calls is integral to most applications and while doing this we use an HTTP client usually available as an external library. Axios is a popular HTTP client available as a JavaScript library with more than 22 million weekly downloads. We can make API calls with Axios from JavaScript applications irrespective of whether the JavaScript is running on the front-end like a browser or the server-side.

In this article, we will understand Axios and use its capabilities to make different types of REST API calls from JavaScript applications.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/axios" %}}

## Why do we need Axios
Let us first understand why do we need to use a library like Axios. JavaScript already provides built-in objects: `XMLHttpRequest` and the `Fetch API` for interacting with APIs.

Axios in contrast to these built-in objects is an open-source library that we need to include in our application for making API calls over HTTP. It is similar to the `Fetch API` and returns a JavaScript `Promise` object but also includes many powerful features. 

One of the important capabilities of Axios is its isomorphic nature which means it can run in the browser as well as in server-side Node.js applications with the same codebase. 

Axios is also a promise-based HTTP client that can be used in plain JavaScript and advanced JavaScript frameworks like React, Vue.js, and Angular.
It supports all modern browsers, including support for IE 8 and higher.

In the following sections, we will look at examples of using these features of Axios in our applications.

## Installing Axios and Other Prerequisites For the Examples

We have created the following applications to simulate the behavior of applications running on a server and the client-side interacting with REST APIs published by an API server:
1. `apiserver`: This is a Node.js application written using the Express Framework that will have REST APIs.
2. `serversideapps`:  This is also a Node.js written in Express that will call the REST APIs exposed by the `apiserver` application using the `Axios` HTTP client.
3. `reactapp`: This is a front-end application written in React which will also call the REST APIs exposed by the `apiserver` application.

Instead of Express, we could have used any other JavaScript framework or even raw JavaScript applications. To understand Express, please refer to our Express series of articles starting with [Getting started on Express](https://reflectoring.io/getting-started-with-express/).

We will need to install the Axios library in two of these applications: `serversideapps` and `reactapp` which will be making API calls. Let us change to these directories one by one and install Axios using `npm`:
```shell
npm install axios
```

After setting up our applications, let us now get down to invoking the APIs exposed by the `apiserver` from the `serversideapp` and the `reactapp` using the Axios HTTP client in the following sections.

## Sending Requests with the Axios Instance
Let us start by invoking a `GET` method with the Axios HTTP client from our `serversideapp`. 

For this, we will add an Express route handler function with URL: `/products`. From the route handler function, we will fetch the list of products by calling an API from our `apiserver` with the URL: `http://localhost:3002/products`. 

We will use the default instance provided by the Axios HTTP client for doing this:

```js
const express = require('express')

// Get the default instance
const axios = require('axios')

const app = express()

// Express route handler with URL: '/products' and a handler function
app.get('/products', (request, response) => {

  // Make the GET call by passing a config object to the instance
  axios({
    method: 'get',
    url: 'http://localhost:3002/products'
  }).then(apiResponse => {
     // process the response
     const products = apiResponse.data
     response.json(products)
  })
  
})
```
In this example, we are first getting an instance: `axios` set up with default configuration when we call `require('axios')`.   

Then we are passing a configuration argument to the `axios` instance containing the HTTP method: `get` and the URL of the REST endpoint: `http://localhost:3002/products`.  

This method returns a JavaScript `Promise` which means the program does not wait for the method to complete before moving and trying to execute the next statement. We are processing the response in the `then` block where we are extracting the list of `products` by calling `apiResponse.data`.

Similarly, a POST request for adding a new `product` made with the `axios` default instance will like this:

```js
const express = require('express')

// Get the default instance
const axios = require('axios')

const app = express()

// Express route handler with URL: '/products/new' and a handler function
app.post('/products/new', async (request, response) => {

  const name = request.body.name
  const brand = request.body.brand

  const newProduct = {name: name, brand:brand}

  // Make the POST call by passing a config object to the instance
  axios({
    method: 'post',
    url: 'http://localhost:3002/products',
    data: newProduct,
    headers: {'Authorization': 'XXXXXX'}
  }).then(apiResponse=>{
     const products = apiResponse.data
     response.json(products)
  })
})
```
In this example, in addition to what we did for calling the `GET` method, we have set the `data` element containing the JSON representation of the new `Product` along with an `Authorization` header. We are processing the response in the `then` block of the `Promise` response where we are extracting the API response data by calling `apiResponse.data`. 

The elements of the response returned by the API call made with `axios` are:
- **data**: Response that was provided by the server
- **status**: HTTP status code from the server response
- **statusText**: HTTP status message from the server response
- **headers**: HTTP headers received in the API response
- **config**: config that was provided to `axios` instance for sending the request
- **request**: Request that generated this response. It is the last ClientRequest instance in node.js (in redirects) and an XMLHttpRequest instance in the browser.


## Sending Requests with the Convenience Instance Methods of Axios
Axios also provides convenience methods for all the HTTP methods like:`axios.get()`, `axios.post()`, `axios.post()`, `axios.put()`, etc

Let us make a `GET` request using the convenience method to an API with `axios.get()` as shown below:
```js
const express = require('express')

// Get the default instance
const axios = require('axios')

const app = express()

// // Express route handler for making a request for fetching a product
app.get('/products/:productName', (request, response) => {

  const productName = request.params.productName  

  axios.get(`http://localhost:3002/products/${productName}`)
  .then(apiResponse => {
     const product = apiResponse.data
     response.json(product)
  })   
})
```
In this example, in the Express route handler function we are calling the `get()` method on the default instance of `axios` and passing a configuration argument the URL of the REST API endpoint.

Similar to our earlier examples, the `get()` method is returning a JavaScript `Promise` object where we are extracting the list of `products` in a `then` block.

Instead of appending the request query parameter in the URL in the previous example, we could have passed the request parameter in a separate method argument: `params` as shown below:

```js
const axios = require('axios')
axios.get(`http://localhost:3002/products/`, {
    params: {
      productName: productName
    }
  })
  .then(apiResponse => {
     const product = apiResponse.data
     response.json(product)
  })   
```

We could have also used the `async/await` syntax to call the `get()` method:

```js
const express = require('express')
const axios = require('axios')

const app = express()

app.get('/products/async/:productName', async (request, response) => {
  const productName = request.params.productName  

  const apiResponse = await axios.get(`http://localhost:3002/products/`, {
    params: {
      productName: productName
    }
  })

  const product = apiResponse.data
  response.json(product)
})
```
`async/await` is part of ECMAScript 2017 and is not supported in older browsers like IE.

Let us next make a `POST` request to an API with the convenience method `axios.post()`:

```js
const express = require('express')
const axios = require('axios')

const app = express()

app.post('/products', async (request, response) => {

    const name = request.body.name
    const brand = request.body.brand

    const newProduct = {name: name, brand:brand}

    const apiResponse = await axios.post(`http://localhost:3002/products/`, newProduct)

    const product = apiResponse.data
    response.json({result:"OK"})
})
```
Here we are using the `async/await` syntax to make a `POST` request with the `axios.post()` method. We are passing the new `product` to be created as a JSON as the second parameter of the `post()` method.

## Sending Multiple Concurrent Requests
In many situations, we need to combine the results from multiple APIs to get a consolidated result. With the Axios HTTP client, we can make concurrent requests to multiple APIs as shown in this example:

```js
const express = require('express')

// get the default axios instance
const axios = require('axios')

const app = express()

// Route Handler
app.get('/products/:productName/inventory', (request, response) => {

  const productName = request.params.productName

  // Call the first API for product details
  const productApiResponse = axios
            .get(`http://localhost:3002/products/${productName}`)

  // Call the second API for inventory details
  const inventoryApiResponse = axios
            .get(`http://localhost:3002/products/${productName}/itemsInStock`)

  // Consolidate results into a single result
  Promise.all([productApiResponse, inventoryApiResponse])
  .then(results=>{
      const productData = results[0].data
      const inventoryData = results[1].data
      let aggregateData = productData
      aggregateData.unitsInStock = inventoryData.unitsInStock
      response.send(aggregateData)
    
  })
})

```
In this example, we are making requests to two APIs using the `Promise.all()` method. This method takes an iterable of promises returned by the two APIs as input and returns a single Promise that resolves to an array of the results of the input promises. This returned promise will resolve when all of the input promises have been resolved, or if the input iterable contains no promises.

## Overriding the default Instance of Axios
In all the examples we have seen so far, we used the `require('axios')` to get an instance of `axios` which is configured with default parameters. If we want to add a custom configuration like a timeout of `2` seconds, we need to use `Axios.create()` where we can pass the custom configuration as an argument.

An Axios instance created with `Axios.create()` with a custom config helps us to reuse the provided configuration for all the API invocations made by that particular instance. 

Here is an example of an `axios` instance created with `Axios.create()` and used to make a `GET` request:

```js
const express = require('express')
const axios = require('axios')

const app = express()

// Express Route Handler
app.get('/products/deals', (request, response) => {
  
  // Create a new instance of axios
  const instance = axios.create({
    baseURL: 'http://localhost:3002/products',
    timeout: 1000,
    headers: {
      'Accept': 'application/json',
      'Authorization': 'XXXXXX'
    }
  })

  instance({
    method: 'get',
    url: '/deals'
  }).then(apiResponse => {
     const products = apiResponse.data
     response.json(products)
  })
  
})
```
In this example, we are using `axios.create()` to create a new instance of Axios with a custom configuration that has a base URL of `http://localhost:3002/products` and a timeout of `1000` milliseconds. The configuration also has an `Accept` and `Authorization` headers set depending on the API being invoked.

The `timeout` configuration specifies the number of milliseconds before the request times out. If the request takes longer than the `timeout` interval, the request will be aborted.


## Intercepting Requests and Responses
We can intercept requests or responses of API calls made with Axios by setting up interceptor functions. Interceptor functions are of two types: 
- Request interceptor for intercepting requests before the request is sent to the server. 
- Response interceptor for intercepting responses received from the server.

Here is an example of an `axios` instance configured with a request interceptor for capturing the start time and a response interceptor for computing the time taken to process the request:

```js
const express = require('express')
const axios = require('axios')

const app = express()

// Request interceptor for capturing start time
axios.interceptors.request.use(
   (request) => {
    request.time = { startTime: new Date() }
    return request
  },
  (err) => {
    return Promise.reject(err)
  }
)

// Response interceptor for computing duration
axios.interceptors.response.use(
   (response) => {
    response.config.time.endTime = new Date()
    response.duration =
           response.config.time.endTime - response.config.time.startTime
    return response
  },
  (err) => {
    return Promise.reject(err);
  }
)

// Express route handler
app.get('/products', (request, response) => {

  axios({
    method: 'get',
    url: 'http://localhost:3002/products'
  }).then(apiResponse=>{
     const products = apiResponse.data

     // Print duration computed in the response interceptor
     console.log(`duration ${apiResponse.duration}` )
     response.json(products)
  })
  
})
```
In this example, we are setting the `request.time` to the current time in the request interceptor. In the response interceptor, we are capturing the current time in `response.config.time.endTime` and computing the duration by deducting from the current time, the start time captured in the request interceptor.

## Handling Errors in Axios
The response received from Axios is a JavaScript `promise` which has a `then()` function for promise chaining, and a `catch()` function for handling errors. So for handling errors, we should add a `catch()` function at the end of one or more `then()` functions as shown in this example:

```js
const express = require('express')
const axios = require('axios')

const app = express()

// Express route handler
app.post('/products/new', async (request, response) => {

  const name = request.body.name
  const brand = request.body.brand

  const newProduct = {name: name, brand: brand}

  axios({
    method: 'post',
    url: 'http://localhost:3002/products',
    data: newProduct,
    headers: {'Authorization': 'XXXXXX'}
  }).then(apiResponse=>{
     const products = apiResponse.data
     response.json(products)
  }).catch(error => {
    if (error.response) {
        console.log("response error")
    } else if (error.request) {
        console.log("request error")
    } else {
      console.log('Error', error.message);
    }
    response.send(error.toJSON())
  })
})
```
In this example, we have put the error handling logic in the `catch()` function. The callback function in the `catch()` takes the `error` object as input. We come to know about the source of the error by checking for the presence of the `response` property and `request` property in the `error` object with `error.response` and `error.request`. 

An `error` object with a `response` property indicates that our server returned a `4xx/5xx` error and accordingly return a helpful error message in the response. 

In contrast, An `error` object with a `request` property indicates network errors, a non-responsive backend, or errors caused by unauthorized or cross-domain requests.

The error object may not have either a response or request object attached to it. This indicates errors related to setting up the request, which eventually triggered the error. An example of this condition is an URL parameter getting omitted while sending the request.

## Cancelling Initiated Requests
We can also cancel or abort a request when we no longer require the requested data for example, when the user navigates from the current page to another page. To cancel a request, we use the [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) class as shown in this code snippet from our React application:
```js
import React, { useState } from 'react'
import axios from 'axios'

export default function ProductList(){
    const [products, setProducts] =  useState([])

    const controller = new AbortController()

    const abortSignal = controller.signal
    const fetchProducts = ()=>{
       axios.get(`http://localhost:3001/products`, {signal: abortSignal})
      .then(response => {
        const products = response.data
        setProducts(products)
      })      
      controller.abort()
    }

    return (
        <>
          ...
          ...
        </>
    )
}

```
As we can see in this example, we are first creating a controller object using the `AbortController()` constructor, then storing a reference to its associated `AbortSignal` object using the `signal` property of the `AbortController`.

When the `axios` request is initiated, we pass in the `AbortSignal` as an option inside the request's options object: `{signal: abortSignal}`. This associates the signal and `controller` with the `axios` request and allows us to abort the request by calling the `abort()` method on the `controller`.

## Conclusion 
In this article, we looked at the different capabilities of Axios. Here is a summary of the important points from the article:

1. Axios is an HTTP client for calling REST APIs from JavaScript programs running in the server as well as in web browsers.
2. We create default instance of `axios` by calling `require('axios')`
3. We can override the default instance of `axios` with the `create()` method of `axios` to create a new instance and configure properties like 'timeout'.
4. Axios allows us to attach request and response interceptors to the `axios` instance.
5. Errors are handled in the `catch()` block of the `Promise` response.
6. We can cancel requests by calling the `abort()` method of the `AbortController` class.

You can refer to all the source code used in the article
on [Github](https://github.com/thombergs/code-examples/tree/master/nodejs/axios).