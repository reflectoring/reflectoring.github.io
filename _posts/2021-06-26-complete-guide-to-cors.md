---
title: "Complete Guide to CORS"
categories: [craft]
date: 2021-06-14 06:00:00 +1000
modified: 2021-06-13 06:00:00 +1000
author: pratikdas
excerpt: "Amazon Simple Email Service (SES) provides an email platform for sending and receiving emails. Spring Cloud AWS makes it convenient to integrate applications with different AWS services. In this article, we will look at using Spring Cloud AWS for working with Amazon Simple Email Service (SES) with the help of some basic concepts of SES along with code examples."
image:
  auto: 0074-stack
---

 Most web applications we build today need to communicate with separately hosted or even third-party sites for fetching various resources like images, fonts, maps, data and also send data for processing. Asynchronous Javascript (Ajax) is the most common method of doing this. Although it gives powerful capabilities of composing sites by assembling a set of readymade assets managed separately, it also opens up security vulnerabilities that can be exploited by sending malicious requests.

 “CORS” stands for Cross-Origin Resource Sharing that lays down the standard for communication between browser and server hosted in different origins. A web application executes a cross-origin HTTP request when it requests a resource that has a different origin (domain, protocol, and port). Cross-origin Resource Sharing (CORS) is a mechanism that uses additional HTTP headers to tell a browser to let a web application running at one origin (domain) have permission to access selected resources from a server at a different origin.


In this article, we will understand cross-origin resource sharing (CORS), describe some common examples of cross-origin resource sharing vulnerabilities, and discuss how to protect against these attacks.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/spring-cloud-ses" %}


## What is CORS
Cross-origin resource sharing (CORS) is a browser mechanism that enables controlled access to resources located outside of a given domain. 
CORS is a security standard created to control communication through URLs or scripts running in a browser with servers residing in a different origin.

It is implemented by browsers that allow the browser to load resources hosted in a server that is in a different `origin` than its own.  It is a controlled relaxation of the default browser security policy called the Same-Origin Policy (SOP) which permits the browser to load resources only from a server hosted in the same `origin` as the browser. 

An `origin` in this context consists of a scheme, host, and port. We consider two `origins` as same only if all of them match.

Same Origin Request between HTML page at http://www.mydomain.com:8000 and a REST API endpoint at http://www.mydomain.com:8000/orders :

|Resource Type|-URL-|-Scheme-|-Host-|-Port-|
|HTML Page|http://www.mydomain.com:8000|http|mydomain|8000|
|REST API|http://www.mydomain.com:8000/orders|http|mydomain|8000|


Cross Origin Request between HTML page at http://www.mydomain.com:8000 and a REST API endpoint at http://www.otherdomain.com:8000/orders :

|Resource Type|-URL-|-Scheme-|-Host-|-Port-|
|HTML Page|http://www.mydomain.com:8000|http|mydomain|8000|
|REST API|http://www.otherdomain.com:8000/orders|http|otherdomain|8000|

Here are some examples of CORS requests:
The front-end JavaScript code served from https://www.domain-1.com uses `XMLHttpRequest` to request https://www.domain-2.com/data.json. XMLHttpRequest (XHR) is used to interact with servers to retrieve data from a URL without having to do a full page refresh. This enables a Web page to perform a partial page refresh without disrupting what the user is doing. XMLHttpRequest is used heavily in AJAX programming. Despite its name, XMLHttpRequest can be used to retrieve any type of data, not just XML.


A Single Page Application (SPA) loaded from https://www.example.com  needs to send API requests to https://api.example.com.


## Types of Cross-Origin Request

There are three types of CORS request: "simple" requests, and "preflight" requests, and it's the browser that determines which is used. As the developer, you don't normally need to care about this when you are constructing requests to be sent to a server. However, you may see the different types of requests appear in your network log and, since it may have a performance impact on your application, it may benefit you to know why and when these requests are sent.

Browsers implement the Cross-Origin Resource Sharing standard by sending an `Origin` header with the request for cross-origin requests sent to the server. To serve the cross-origin request, the server needs to send back an `Access-Control-Allow-Origin` header in the response. The browser checks the value of the `Access-Control-Allow-Origin` header in the response and renders the response only if the value of the `Access-Control-Allow-Origin` header is the same as the `Origin` header sent in the request or a matching wild card ranging from `*` for all origins to partial matches with the source origin.

CORS failures cause errors but specifics about the error are not available to the browser for security reasons. The only way to determine know about the error is by looking at the browser's console for details of the error which is usually in following form:

```shell
Access to XMLHttpRequest at 'http://localhost:8000/orders' from origin 'http://localhost:9000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

There are three types of CORS requests: simple, preflight, and requests with credentials depending on the kind of operations we want to perform with the server resource. These three scenarios demonstrate how Cross-Origin Resource Sharing works. All these examples use XMLHttpRequest, which can make cross-origin requests in any supporting browser.

Let's have a look at what that means in more detail in the next couple of sections.

### Simple Requests (GET, POST, and HEAD)
Simple requests are sent by the browser for server operations it considers safe because they do not change the state of any existing resource on the server. The request sent by the browser is simple if the one of the below conditions apply: These include GET, POST, and HEAD HTTP methods. 

- The HTTP request method is GET, POST, or HEAD
- A CORS safe-listed header Accept,Accept-Language,Content-Language,Content-Type.
- When using the Content-Type header, only the following values are allowed: application/x-www-form-urlencoded, multipart/form-data, or text/plain
- No event listeners are registered on any XMLHttpRequestUpload object
- No ReadableStream object is used in the request

The request is allowed to continue as normal if it meets these criteria, and the Access-Control-Allow-Origin header is checked when the response is returned.


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

In this example, the browser served from `http://localhost:9000` sends a cross-origin request to a REST API with URL `http://localhost:8000/orders`. This is a simple request since it is a `GET` request. We can see an `Origin` header sent in the request with a value of `http://localhost:9000` which is the origin URL of the browser. The server responds with a response header `Access-Control-Allow-Origin`.  The browser is able to render the response only since the response header `Access-Control-Allow-Origin` has the value `http://localhost:9000` which exactly matches the value of the `Origin` header sent in the request. We can also have partial matches using wild cards like `*` or `http://*localhost:9000.` 


### Preflight Requests
In contrast to simple requests, the browser sends preflight requests for operations which intend to change the state of existing resources in the server. We use the HTTP methods PUT,and DELETE for these operations. These requests are not considered safe so the web browser first makes sure that cross-origin communication is allowed by first sending a preflight request before sending the actual request. Requests which do not satisfy the criteria for simple request also also fall under this category.

Preflight uses HTTP OPTIONS method which is sent automatically by the browser to the server hosting the cross-origin resource, to check that the server will permit the actual request. Along with the preflight request, the browser sends headers that indicate the HTTP method and headers that will be used in the actual request. 

Access-Control-Request-Method: The intended method of the request (e.g., GET or POST)
Access-Control-Request-Headers: An indication of the custom headers that will be sent with the request
Origin: The usual origin header that contains the script's current origin

If the result of the OPTIONS method is that the request cannot be made, the actual request to the server will not be executed.

An example of request and response headers of a preflight request is shown below:

```
Request URL: http://localhost:8000/orders
Request Method: OPTIONS
Status Code: 200 OK
Remote Address: [::1]:8000
Referrer Policy: strict-origin-when-cross-origin

Request Headers:
Accept: */*
Accept-Encoding: gzip, deflate, br
Accept-Language: en-US,en;q=0.9
Access-Control-Request-Method: PUT


Response Headers

Allow: GET,HEAD,PUT
```

In this example, the browser served from `http://localhost:9000` sends a PUT request to a REST API with URL `http://localhost:8000/orders`. Since this is a PUT request which will change the state of an existing resource in the server, the browser sends a preflight request using the HTTP OPTIONS method. In response, the server informs the browser that GET,HEAD,PUT methods are allowed.

After the preflight request is complete, the actual PUT method with CORS headers is sent.


### CORS Requests with Credentials

By default, CORS does not include cookies on cross-origin requests. To include credentials on cross-origin requests, you must change the CORS settings.

In this scenario we can send CORS requests loaded with access credentials. The default behavior of cross-origin resource requests is for requests to be passed without any credentials like cookies and the Authorization header. However, the cross-domain server can permit reading of the response when credentials are passed to it by setting the CORS Access-Control-Allow-Credentials header to true.

like HTTP cookies and HTTP Authentication information. By default, in cross-site XMLHttpRequest or Fetch invocations, browsers will not send credentials. A specific flag has to be set on the XMLHttpRequest object or the Request constructor when it is invoked.

In this example, content originally loaded from http://foo.example makes a simple GET request to a resource on http://bar.other which sets Cookies. Content on foo.example might contain JavaScript like this:



Then the browser will permit the requesting website to read the response, because the Access-Control-Allow-Credentials response header is set to true. Otherwise, the browser will not allow access to the response.

## Example of CORS Configuration
Let us run two web applications written in Node.Js which will communicate with each other with CORS:
1. A `OrderProcessor` web application containing a REST API with GET and PUT methods
2. A web application hosting the HTML page which will communicate with the REST APIs in the `OrderProcessor` application.

We can run these applications in our local machine using npm and node. The application hosting the HTML page is running on http://localhost:8000. This makes Ajax calls with the `XMLHttpRequest` to the `OrderProcessor` application.

Here is a snippet of our server side GET method running on `localhost:8000`:

```js
app.get('/orders', (req, res) => {
  console.log('Returning orders');
  res.send(orders);
});

```
We will call this `GET` method from an HTML page running on `localhost:9000` using the `XMLHttpRequest` javascript object:

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
Here we click the button in our HTML page to trigger the CORS request.
We will get a CORS error in our browser console as shown below:

![cors failure](/assets/img/posts/cors/cors-fail.png)

Let us modify the server side code to return the CORS header `Access-Control-Allow-Origin` as shown:

```javascript
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

Now we will make a preflight request to a PUT method which looks like this:

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
  next();
});
app.put('/orders', (req, res) => {
  console.log('updating orders');
  res.send(orders);
});

```

We have added a PUT method and returning few more headers.
Access-Control-Allow-Headers: Allowed headers
Access-Control-Allow-Methods: Allowed methods

![cors failure](/assets/img/posts/cors/preflight.png)

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
1. We need to associate a whitelist with Access-Control-Allow-Origin that identifies which specific domains (e.g., your company’s other domains) can access resources. 
2. Then your application can validate against this list when a domain requests access. 
3. You also don’t want to define your Access-Control-Allow-Origin header as NULL, as an attacker can send a request with a NULL origin that would bypass other controls.
4. Similarly, with Access-Control-Allow-Methods you should specify exactly what methods are valid for approved domains to use. Some may only need to view resources, while others need to read and update them, and so on.
5. It is quite easy for a hacker to setup a traffic viewer and observe what requests are passing back and forth from your site and what the responses are. From this, they can determine whether your site is vulnerable to a CORS-based attack.
6. Therefore, you should be validating each and every domain that is requesting your site’s resources, as well as the methods other domains can use if their requests for access are granted. Y
7. ou can easily identify CORS security vulnerabilities by reviewing the above headers in the application’s response and validating the values of those headers. Using open source scanners is also a great way to discover CORS security vulnerabilities.



## Conclusion

