---
title: "Complete Guide to CORS"
categories: [craft]
date: 2021-06-14 06:00:00 +1000
modified: 2021-06-13 06:00:00 +1000
author: pratikdas
excerpt: "We will understand cross-origin resource sharing (CORS), describe some common examples of cross-origin resource sharing vulnerabilities, and discuss how to protect against these attacks."
image:
  auto: 0074-stack
---

“CORS” stands for Cross-Origin Resource Sharing. CORS is a security standard implemented by browsers that enables controlled access to resources located outside of a given origin.

lays down a protocol that allows JavaScripts running in a web page to communicate with resources from a different origin. 

In this article, we will understand cross-origin resource sharing (CORS), describe some common examples of cross-origin resource sharing vulnerabilities, and suggest methods to protect against these attacks.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/cors" %}


## What is CORS

For understanding CORS, it is important to understand Same-Origin Policy (SOP).

### Same-Origin Policy
Browsers implement a default security policy called the Same-Origin Policy (SOP) which permits the browser to load resources only from a server hosted in the same `origin` as the browser. 

Without SOP, any web page would be able to access the document object model (DOM) of other pages and allow it to access potentially sensitive data as well as perform malicious actions on other web sites without user consent.

However the SOP security policy turned to be too restrictive for the new age applications where we often need to fetch different kind of resources from multiple origins.

SOP was conceived in the early years of the web which  CORS standard was defined with an objective of relaxing this restriction.

The Cross-origin resource sharing (CORS) standard implemented by browsers enables controlled access to resources located outside of the browser's origin. 

### Same Origin vs Cross Origin
Same-Origin Policy (SOP) which permits the browser to load resources only from a server hosted in the same `origin` as the browser. 
An `origin` in the context of CORS consists of a scheme, host, and port. We consider two URLs to be of same `origins` only if all three of them match.

Same Origin Request between HTML page at http://www.mydomain.com:8000 and a REST API endpoint at http://www.mydomain.com:8000/orders :

|Resource Type|-URL-|-Scheme-|-Host-|-Port-|
|HTML Page|http://www.mydomain.com:8000|http|mydomain|8000|
|REST API|http://www.mydomain.com:8000/orders|http|mydomain|8000|


Cross Origin Request between HTML page at http://www.mydomain.com:8000 and a REST API endpoint at http://www.otherdomain.com:8000/orders :

|Resource Type|-URL-|-Scheme-|-Host-|-Port-|
|HTML Page|http://www.mydomain.com:8000|http|mydomain|8000|
|REST API|http://www.otherdomain.com:8000/orders|http|otherdomain|8000|


### Scenarios for Sending CORS Requests

Here are some examples of CORS requests:

The front-end JavaScript code served from https://www.domain-1.com uses `XMLHttpRequest` to request https://www.domain-2.com/data.json. 

XMLHttpRequest (XHR) is used to interact with servers to retrieve data from a URL without having to do a full page refresh. This enables a Web page to perform a partial page refresh without disrupting what the user is doing. XMLHttpRequest is used heavily in AJAX programming. Despite its name, XMLHttpRequest can be used to retrieve any type of data, not just XML.


A Single Page Application (SPA) loaded from https://www.example.com  needs to send API requests to https://api.example.com.


## How Browsers Implement Cross-Origin Request

Browsers implement the Cross-Origin Resource Sharing standard by exchanging a set of headers with the server. Based on the header values returned from the server, the browser provides access the server response or blocks access with a CORS error. 

### Origin Header sent by Browser and Access-Control-Allow-Origin Header Sent by Server
The browser sending an `Origin` header with the request for cross-origin requests sent to the server. To serve the cross-origin request, the server needs to send back an `Access-Control-Allow-Origin` header in the response. 

The browser checks the value of the `Access-Control-Allow-Origin` header in the response and renders the response only if the value of the `Access-Control-Allow-Origin` header is the same as the `Origin` header sent in the request or a matching wild card ranging from `*` for all origins to partial matches with the source origin.

### CORS Failures
CORS failures cause errors but specifics about the error are not available to the browser for security reasons. The only way to determine know about the error is by looking at the browser's console for details of the error which is usually in following form:

```shell
Access to XMLHttpRequest at 'http://localhost:8000/orders' from origin 'http://localhost:9000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```
There are three types of CORS requests: simple, preflight, and requests with credentials depending on the kind of operations we want to perform with the server resource. 


Let's have a look at what that means in more detail in the next couple of sections.

### Simple Requests (GET, POST, and HEAD)
Simple requests are sent by the browser for server operations it considers safe because they do not change the state of any existing resource on the server. The request sent by the browser is simple if the one of the below conditions apply: These include GET, POST, and HEAD HTTP methods. 

- The HTTP request method is GET, POST, or HEAD
- A CORS safe-listed header Accept,Accept-Language,Content-Language,Content-Type.
- When using the Content-Type header, only the following values are allowed: application/x-www-form-urlencoded, multipart/form-data, or text/plain
- No event listeners are registered on any XMLHttpRequestUpload object
- No ReadableStream object is used in the request

The request is allowed to continue as normal if it meets these criteria, and the `Access-Control-Allow-Origin` header is checked when the response is returned.


### Preflight Requests
In contrast to simple requests, the browser sends preflight requests for operations which intend to change the state of existing resources in the server. We use the HTTP methods PUT, and DELETE for these operations. These requests are not considered safe so the web browser first makes sure that cross-origin communication is allowed by first sending a preflight request before sending the actual request. Requests which do not satisfy the criteria for simple request also fall under this category.

Preflight uses HTTP OPTIONS method which is sent automatically by the browser to the server hosting the cross-origin resource, to check that the server will permit the actual request. Along with the preflight request, the browser sends the following headers:

 that indicate the HTTP method and headers that will be used in the actual request. 

**Access-Control-Request-Method**: This is a list of HTTP methods of the request (e.g., GET, POST, PUT, DELETE)
**Access-Control-Request-Headers**: This is a list of headers that will be sent with the request
**Origin**: The origin header that contains the source origin of the request

The actual request to the server will not be sent, if the result of the `OPTIONS` method is that the request cannot be made,.

After the preflight request is complete, the actual PUT method with CORS headers is sent.

### CORS Requests with Credentials

For all practical purposes we need to send CORS requests loaded with some kind of access credentials which could be a `Authorization` header or cookies. The default behavior of cross-origin resource requests is for requests to be passed without any credentials like cookies and the `Authorization` header. 

If credentials are passed with the request, the browser will not allow access to the response unless the server sends a CORS header `Access-Control-Allow-Credentials` with a value of `true`.

## Example of Working with CORS
Let us run two web applications written in Node.Js which will communicate with each other with CORS:
1. A `OrderProcessor` web application containing a REST API with GET and PUT methods
2. A web application hosting the HTML page which will communicate with the REST APIs in the `OrderProcessor` application.

We can run these applications in our local machine using `npm` and `node`. The application hosting the HTML page is running on `http://localhost:9000`. This makes Ajax calls with the `XMLHttpRequest` to the `OrderProcessor` application running on `http://localhost:8000`. 

These are CORS requests since the HTML page and `OrderProcessor` application are running in different Origins (because of different port number 8000 and 9000 although they use same scheme: http and host: `localhost`).

### Server Side Handling CORS Requests in Node.Js
We are using a very simple Node.JS application named `OrderProcessor` built with Express as our server. We have created two REST APIs with a GET and PUT methods or fetching updating `orders`. 

This is a snippet of the GET method of our `OrderProcessor` application running on `localhost:8000`:

```js
app.get('/orders', (req, res) => {
  console.log('Returning orders');
  res.send(orders);
});

```
The `GET` method defined here is used to return a collection of `orders`.

### Client Side Sending CORS Requests from Javascript 
For sending requests to the `OrderProcessor` application described in the previous section, we will use a HTML page and package this inside another Node.JS application running on `localhost:9000`.

We will call the `GET` and `PUT` methods from this HTML page using the `XMLHttpRequest` javascript object:

```html
<html>
<head>
  <script>
       function load(domainURL) {
          var xhttp = new XMLHttpRequest();
          xhttp.onreadystatechange = function() {
              if (this.readyState == 4 && this.status == 200) {
              document.getElementById("demo").innerHTML = this.responseText;
              }
          };
          xhttp.open("GET", domainURL, true);
          xhttp.send();
        }  

        function loadFromCrossOrigin() {
            load("http://localhost:8000/orders")
        } 
  </script>
</head>
<body>            
  <div id="demo">
    <h2>Order Processing</h2>
    <div>
      <button type="button" 
              onclick="loadFromCrossOrigin()">
              ...
      </button>
    </div>
  </div>
</body>
</html>
```
The HTML shown here contains a button which have to click to trigger the CORS request from the javascript method `loadFromCrossOrigin`.

### CORS Error Due to Same Origin Policy
If we run these applications without any additional configurations(setting CORS headers) in the server, we will get a CORS error in our browser console as shown below:

![cors failure](/assets/img/posts/cors/cors-fail.png)

This is an error caused by the restriction of accessing cross origins due to the Same Origin Policy.  Access to XMLHttpRequest at 'http://localhost:8000/orders' from origin 'http://localhost:9000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

### Fixing the CORS Error For Simple Requests
As suggested in the CORS error description, let us modify the server side code to return the CORS header `Access-Control-Allow-Origin` in the response:

```js
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:9000");
  next();
});

app.get('/orders', (req, res) => {
  console.log('Returning orders');
  res.send(orders);
});
```
We are returning a CORS header `Access-Control-Allow-Origin` with a value of source origin `http://localhost:9000` to fix the CORS error.

The CORS relevant request headers and response headers from a simple request is shown below:

```
Request URL: http://localhost:8000/orders
Request Method: GET
Status Code: 200 OK

**Request Headers**
Host: localhost:8000
Origin: http://localhost:9000

**Response Headers**
Access-Control-Allow-Origin: http://localhost:9000

```
In this example, the HTML served from `http://localhost:9000` sends a cross-origin request to a REST API with URL `http://localhost:8000/orders`. This is a simple request since it is a `GET` request. We can see an `Origin` header sent in the request with a value of `http://localhost:9000` which is the origin URL of the browser. 

The server responds with a response header `Access-Control-Allow-Origin`.  The browser is able to render the response only since the response header `Access-Control-Allow-Origin` has the value `http://localhost:9000` which exactly matches the value of the `Origin` header sent in the request. We can also configure partial matches by using wild cards in the form of `*` or `http://*localhost:9000`.  


### CORS Handling for Preflight Request
Now we will modify our server side application to handle preflight request for calls made to the `PUT` method which looks like this:

```js
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:9000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE"
  );
  next();
});
app.put('/orders', (req, res) => {
  console.log('updating orders');
  res.send(orders);
});

```

For handling the preflight request, we are returning two more headers:
`Access-Control-Allow-Headers` containing the headers `Origin`, `X-Requested-With`, `Content-Type`, `Accept` the server should accept.
`Access-Control-Allow-Methods` containing the HTTP methods `GET`, `POST`, `PUT`, `DELETE` that the browser should send to the server.

When we send the PUT request from our HTML page, we can see two requests in the browser network log:

![cors preflight](/assets/img/posts/cors/preflight.png)

The preflight request with OPTIONS method is followed by the actual request with `PUT` method.

The request and response headers of the preflight request is shown:

```
Request URL: http://localhost:8000/orders
Request Method: OPTIONS
Status Code: 200 OK
..
..

Request Headers:
Accept: */*
Accept-Encoding: gzip, deflate, br
Accept-Language: en-US,en;q=0.9
Access-Control-Request-Headers: content-type
Access-Control-Request-Method: PUT
Connection: keep-alive
Host: localhost:8000
Origin: http://localhost:9000


Response Headers

Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Origin: http://localhost:9000
Allow: GET,HEAD,PUT
```

In this example, the browser served from `http://localhost:9000` sends a PUT request to a REST API with URL `http://localhost:8000/orders`. Since this is a PUT request which will change the state of an existing resource in the server, the browser sends a preflight request using the HTTP OPTIONS method. In response, the server informs the browser that GET,HEAD,PUT methods are allowed.

### CORS Handling for Request with Credentials
We will now send a credential in the form of a `Authorization` header in our CORS request:

```js
function sendAuthRequestToCrossOrigin() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          document.getElementById("demo").innerHTML = this.responseText;
        }
    };
    xhr.open('GET', "http://localhost:8000/orders", true);
    xhr.setRequestHeader('Authorization', 'Bearer rtikkjhgffw456tfdd');
    xhr.withCredentials = true;
    xhr.send();
}
```
Here we are sending a bearer token as the value of our `Authorization` header. To allow the browser to read the response, the server needs to send the `Access-Control-Allow-Credentials` header in the response:
```js
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:9000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE"
  );
  res.header("Access-Control-Allow-Credentials",true);
  next();
});
app.put('/orders', (req, res) => {
  console.log('updating orders');
  res.send(orders);
});

```

```shell
Request URL: http://localhost:8000/orders
Request Method: GET
Status Code: 200 OK

Request Headers:

Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Origin: http://localhost:9000

Response Headers:

Accept: */*
Accept-Encoding: gzip, deflate, br
Accept-Language: en-US,en;q=0.9
Authorization: Bearer rtikkjhgffw456tfdd

Origin: http://localhost:9000

```
We have modified our server side code to send a value `true` for the `Access-Control-Allow-Credentials` header so that the browser is able to read the response. We have also added the `Authorization` in the list of allowed request headers in the header `Access-Control-Allow-Headers`.

## Vulnerabilities Caused by CORS Misconfiguration 

Security Misconfiguration of websites caused by poorly configured CORS policy provides potential for cross-domain based attacks.
The most important response headers for security are:  

1. Access-Control-Allow-Origin : specifies which domains can access a domain’s resources. For instance, if requester.com want to access provider.com’s resources, then developers can use this header to securely grant requester.com access to provider.com’s resources.
2. Access-Control-Allow-Credentials specifies whether or not the browser will send cookies with the request. Cookies will only be sent if the allow-credentials header is set to true.
3. Access-Control-Allow-Methods specifies which HTTP request methods (GET, PUT, DELETE, etc.) can be used to access resources. This header lets developers further enhance security by specifying what methods are valid when requester.com requests access to provider.com’s resources.

1. Using wildcard (*) in CORS Headers
2. Partial Matching domain name
3. Using XSS to make requests to cross-origin sites

## How to Avoid CORS Security Vulnerabilities

To implement CORS securely, 
1. We need to associate a whitelist with Access-Control-Allow-Origin that identifies which specific domains can access resources. 
2. Then our application can validate against this list when a domain requests access. 
3. We should not define your `Access-Control-Allow-Origin` header as NULL, since an attacker can send a request with a NULL origin that will bypass other controls.
4. Similarly, with `Access-Control-Allow-Methods` we should specify exactly what methods are valid for approved domains to use. Some may only need to view resources, while others need to read and update them, and so on.
5. It is quite easy for a hacker to setup a traffic viewer and observe what requests are passing back and forth from our site and what the responses are. From this, they can determine whether our site is vulnerable to a CORS-based attack.
6. Therefore, we should be validating each and every domain that is requesting our site’s resources, as well as the methods other domains can use if their requests for access are granted. 
7. We can easily identify CORS security vulnerabilities by reviewing the above headers in the application’s response and validating the values of those headers. Using open source scanners is also a great way to discover CORS security vulnerabilities.



## Conclusion
Here is a summary of the topics we covered:
1. CORS is a security standard implemented by browsers to enable access to resources in a different origin. 
2. CORS requests are of three types: Simple, Preflight, and Request with Credentials.
3. Simple requests are used to perform safe operations like a HTTP GET method.
4. Preflighted requests are for performing operations with side-affects like PUT and DELETE methods.
5. CORS uses Headers to exchange information with servers. Important CORS headers are:
Origin
6. We looked at some CORS vulnerabilities and potential remediations like whitelist.



