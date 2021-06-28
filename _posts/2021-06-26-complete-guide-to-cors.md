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

 Most web applications we build today need to communicate with separately hosted or even third-party sites for fetching various resources like images, maps, data and also send data for processing. Asynchronous Java script (Ajax) is the most common method of doing this. Although it gives powerful capabilities of composing sites by assembling a set of readymade assets managed separately, it also opens up security vulnerabilties which can be exploited by sending malicious requests.

 “CORS” stands for Cross-Origin Resource Sharing that lays down the standard for communication between browser and server hosted in different origins. 


In this article, we will understand cross-origin resource sharing (CORS) , describe some common examples of cross-origin resource sharing vulnerabilitires, and discuss how to protect against these attacks.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/spring-cloud-ses" %}


## What is CORS
Cross-origin resource sharing (CORS) is a browser mechanism which enables controlled access to resources located outside of a given domain. 
CORS is a security standard created with an objective to control the communication through URL or scripts running in a browser with servers residing in a different origin.

It is implemented by browsers that allows the browser to load resources hosted in a server which is in a different `origin` than its own.  It is a controlled relaxation of the default browser security policy called the Same-Origin Policy (SOP) which permits the browser to load resources only from a server hosted in the same `origin` as the browser. 

A `origin` in this context consists of a scheme, host, and port. We consider two `origins` as same only if all of them match.

Same Origin Request between HTML page at http://www.mydomain.com:8000 and a REST API endpoint at http://www.mydomain.com:8000/orders :

|Resource Type|-URL-|-Scheme-|-Host-|-Port-|
|HTML Page|http://www.mydomain.com:8000|http|mydomain|8000|
|REST API|http://www.mydomain.com:8000/orders|http|mydomain|8000|


Cross Origin Request between HTML page at http://www.mydomain.com:8000 and a REST API endpoint at http://www.otherdomain.com:8000/orders :

|Resource Type|-URL-|-Scheme-|-Host-|-Port-|
|HTML Page|http://www.mydomain.com:8000|http|mydomain|8000|
|REST API|http://www.otherdomain.com:8000/orders|http|otherdomain|8000|

Here are some examples of CORS requests:
The front-end JavaScript code served from https://www.domain-1.com uses `XMLHttpRequest` to make a request for https://www.domain-2.com/data.json. XMLHttpRequest (XHR) is used to interact with servers to retrieve data from a URL without having to do a full page refresh. This enables a Web page to perform a partial page refresh without disrupting what the user is doing. XMLHttpRequest is used heavily in AJAX programming. Despite its name, XMLHttpRequest can be used to retrieve any type of data, not just XML.


An Single Page Application (SPA) loaded from https// www.example.com  needs to send API requests to  https://api.example.com.

## How Cross-Origin Requests Work

Browsers implement the Cross-Origin Resource Sharing standard by adding new HTTP headers to the request sent to the server. These headers allow the server to specify which origins are allowed to read that information from a web browser. For HTTP request methods that can modify existing resources on server,  the browsers sends a "preflight" request to fetch the supported methods from the server with the HTTP OPTIONS request method, and then, upon "approval" from the server, sends the actual request. Servers can also inform clients whether "credentials" (such as Cookies and HTTP Authentication) should be sent with requests.

CORS failures result in errors, but for security reasons, specifics about the error are not available to JavaScript. All the code knows is that an error occurred. The only way to determine what specifically went wrong is to look at the browser's console for details.

Whenever a browser makes a cross-origin request to server, it sends an `Origin` header with the request. To serve the cross-origin request, the server needs to send back a `Access-Control-Allow-Origin` header in the response. The browser checks the value of `Access-Control-Allow-Origin` header in the response and renders the response only if the value of `Access-Control-Allow-Origin` header is same as the `Origin` header sent in the request or a matching wild card ranging from `*` for all origins to partial matches with the source origin.

## Patterns of Cross-Origin Requests
Browsers implement the CORS standard by adding new HTTP headers to the request sent to the server. These headers allow the server to specify which origins are allowed to read that information from a web browser. 

### CORS Errors

We will now get a CORS error in the response, :

```shell
Access to XMLHttpRequest at 'http://localhost:8000/orders' from origin 'http://localhost:9000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```
### Fixing the CORS Error

For fixing the CORS error, the server needs to return a response header named `Access-Control-Allow-Origin` with a value of :
1. `*` : Wild-card
2. Same value as request header named `Origin`. In our example, the value of `Origin` header is `http://localhost:9000`.

Let us run our server again by modifying the server code to return a response header with a value of `*`

Now the we can see the response rendered in the browser:

```shell

Request URL: http://localhost:8000/orders
Request Method: GET
Status Code: 200 OK

Response Headers

Access-Control-Allow-Origin: http://localhost:9000
Connection: keep-alive
Content-Length: 166
Content-Type: application/js

Request Headers

Host: localhost:8000
Origin: http://localhost:9000

```

There are three scenarios of CORS requests depending on the type of operations we want to perform with the server resource. These three scenarios that demonstrate how Cross-Origin Resource Sharing works. All these examples use XMLHttpRequest, which can make cross-origin requests in any supporting browser.

### Simple Requests
This scenario applies to requests that the browser considers as safe because they do not change the state of any existing resource on the server. These include GET, POST, and HEAD HTTP methods. A request header `Origin` containing URL of the source is sent to the server. The server returns the response header `Access-Control-Allow-Origin`.  The browser is able to render the response only if the value of the response header contains * or value contained in the origin header sent in the request. 

Request URL: http://localhost:8000/orders
Request Method: GET
Status Code: 200 OK

**Request Headers**
Host: localhost:8000
Origin: http://localhost:9000

**Response Headers**
Access-Control-Allow-Origin: http://localhost:9000
Connection: keep-alive
Content-Length: 166
Content-Type: application/js


### Preflighted Requests
In contrast to simple requests, this scenario applies to requests which change the state of existing resources. HTTP methods which do this are PUT, DELETE. The requests are considered risky so the web browser first makes sure that cross-origin communication is allowed using a special preflight request. Preflight is required in the following cases:
Browsers make a “preflight” request to the server hosting the cross-origin resource, in order to check that the server will permit the actual request. 
In preflight requests, the browser sends headers that indicate the HTTP method and headers that will be used in the actual request.

If there is a custom HTTP header present in the request (any other header except Accept, Accept-Language, Content-Language, Content-Type, DPR, Downlink, Save-Data, Viewport-Width, Width).
If the method of the request is PUT, DELETE, CONNECT, OPTIONS, TRACE, or PATCH.
If the request is a POST request but the Content-Type is not text/plain, multipart/form-data, or application/x-www-form-urlencoded.
If the XMLHttpRequestUpload has at least one event listener registered on it.
If you use a ReadableStream object in the request.
The preflight request is an OPTIONS request with CORS headers:

Request URL: http://localhost:8000/orders
Request Method: OPTIONS
Status Code: 200 OK
Remote Address: [::1]:8000
Referrer Policy: strict-origin-when-cross-origin
In response, the server informs the browser what methods are allowed, whether it accepts the headers, and for how long is the preflight request valid:

Allow: GET,HEAD,PUT
Connection: keep-alive
Content-Length: 12
After preflight is complete, regular requests with CORS headers may be sent.


### Requests with Credentials

The most interesting capability exposed by both XMLHttpRequest or Fetch and CORS is the ability to make "credentialed" requests that are aware of HTTP cookies and HTTP Authentication information. By default, in cross-site XMLHttpRequest or Fetch invocations, browsers will not send credentials. A specific flag has to be set on the XMLHttpRequest object or the Request constructor when it is invoked.

In this example, content originally loaded from http://foo.example makes a simple GET request to a resource on http://bar.other which sets Cookies. Content on foo.example might contain JavaScript like this:



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

