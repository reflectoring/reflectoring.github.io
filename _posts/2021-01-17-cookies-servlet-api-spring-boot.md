---
title: "Setting Cookies with the Servlet API and Spring"
categories: [spring-boot]
date: 2021-01-17 00:00:00 +1100
modified: 2021-01-17 00:00:00 +1100
author: godeortela
excerpt: "This article demonstrates various ways to handle cookies in a Spring Boot Application" 
image:
  auto: 
---

## Introduction

This article is about cookies and different ways we can implement them in Spring Boot. We are going to have a short overview of what cookies are, how they work, and how we can handle them using the Servlet API and Spring Boot.

If you are building a web application then you probably reached the point where there's the need to implement cookies. If you haven't, you will!

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/cookie-demo" %}

## What are Cookies?

Simply put, cookies are nothing but a piece of information that is stored on the client-side (i.e. in the browser). The client sends them to the server with each request and servers can tell the client which cookies to store. 

They are commonly used to track the activity of a website, to customize user sessions, and for servers to recognize users between requests. Another scenario is to store a JWT token in a cookie so that the server can recognize that the user is authenticated or not in every request.

## How Do Cookies Work?

Cookies are created by the server upon connection. Data stored inside the cookie is labeled with a name, which has to be unique otherwise it would overwrite the existing cookie. When a connection is created, the server stores the cookie in the client(user's browser). In the next request done to the server the cookie is rotated back and based on the cookie name the server knows what information to serve.

## Handling Cookies with the Servlet API

### Creating a Cookie

For creating a cookie using the Servlet API we use the `Cookie` class which is defined inside the `javax.servlet.http` package and has two constructors:

```java
Cookie()

Cookie(String name, String value)
```
After creating it we will need to send it to the client. To do so we add the cookie to the response(`HttpServletResponse`) and we are done. Yes, it is as simple as that.

```java
Cookie servletCookie = new Cookie("cookie-name", "servlet-cookie");

response.addCookie(servletCookie)
```

This code creates a cookie with name "cookie-name" and value "servlet-cookie". But, there is more to the API so let's explore it.

#### Set Cookie Expiration Date

A cookie is expired when the expiration date has passed and it is not valuable anymore. We can set the cookie's expiration time by using the following method:

```java
servletCookie.setMaxAge(60);
```
In this case, our servlet cookie will expire after 60 seconds, which means that a browser should remove the cookie from its storage after that time. 

If we set max age a negative value or don't set it at all, browsers will not persist it at all and it will be deleted immediately after the browser is closed.


#### Set Cookie Domain

`setDomain(String)` is another important method of the Cookie API. We use it when we want to specify a domain for our cookie:

```java
servletCookie.setDomain("example.com");
```

By doing this we are telling the client to which domain it should send the cookie. A browser will only send a cookie to servers from that domain.

Setting the domain to "example.com" not only will send the cookie to the "example.com" domain but also its subdomains "foo.example.com" and "bar.example.com". 

**If we don't set the domain explicitly, it will be set only to the domain that created the cookie, but not to its subdomains.** 

#### Set Cookie Path

Another important method of the Cookie API is `setPath(String)`. The path specifies where a cookie will be delivered inside that domain. Let's set the path:

```java
servletCookie.setPath("/");
```
**By setting path explicitly, the cookie will be delivered to the specified URL and all of its subdirectories.**

#### Secure Cookie

In cases when we store sensitive information inside the cookie and we want it to be sent only in secure connections then method `setSecure(true)` comes to our rescue.

```java
servletCookie.setSecure(true);
```

By setting secure to `true`, we make sure our cookie is only transmitted over HTTPS, and it will not be sent over unencrypted connections.

#### HttpOnly Cookie

We want the client to send the cookie to the server but do not have access to it? Then we set httpOnly to true like below:

```java
servletCookie.setHttpOnly(true);
```
In this case, the client scripts cannot access the cookie. This way we are making sure that the cookie is only read and edited by the server.


### Reading a Cookie
After adding the cookie to a response, the server will need to read the cookies sent by the client in every request. 

The method `getCookies()` returns an array of cookies that are sent with the request(`HttpServletRequest`). We can identify our cookie by the cookie name.

In the following snippet of code, we are iterating through the array, searching by cookie name, and returning the value of the match.

```java
public Optional<String> readServletCookie(HttpServletRequest request, String name){
  return Arrays.stream(request.getCookies())
    .filter(cookie->name.equals(cookie.getName()))
    .map(Cookie::getValue)
    .findAny();
}
```

### Deleting a Cookie

To delete a cookie we will need to create another instance of the `Cookie` with the same name and `maxAge` 0 and add it again to the response as below:

```java
Cookie deleteServletCookie = new Cookie("cookie-name", null);
deleteServletCookie.setMaxAge(0);
response.addCookie(deleteServletCookie);
```

Going back to our use case where we save the JWT token inside the cookie, we would need to delete the cookie when the user logs out. Keeping the cookie alive after the user logs out can seriously compromise the security.

Now that we know how to handle a cookie using Servlet API, let's check how we can do the same using Spring Framework.

## Handling Cookies with Spring

### Creating a Cookie
In this section we will create a cookie with the same properties that we did using the Servlet API.

We will use the class `ResponseCookie` for the cookie and class `ResponseEntity` for setting the cookie in the response. They are both defined inside `org.springframework.http` package. 

`ResponseCookie` has a static method `from(final String name, final String value)` which returns a builder(`ResponseCookieBuilder`) initialized with name and value of the cookie. 

We can add all the properties that we need and use the method `build()` of the builder to create the `ResponseCookie` as below:

```java
 ResponseCookie springCookie = ResponseCookie.from("cookie-name", "spring-cookie")
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .maxAge(60)
                    .domain("example.com")
                    .build();
```
After creating it we add the cookie in the header of the response like this:

```java
 ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, springCookie.toString()).build();
```

### Reading a Cookie
Spring Framework provides an annotation to read any cookie by specifying the name without needing to iterate over all the cookies fetched from the request.

#### @CookieValue Annotation
`@CookieValue` is an annotation that is used in a controller method and maps the value of a cookie to a method parameter:

```java
@GetMapping("/read-spring-cookie")
public String readCookie(
    @CookieValue(name = "cookie-name", defaultValue = "default-spring-cookie") String cookieName) {
    return cookieName;
}
```
In cases where the cookie with the name "cookie-name" does not exist, the controller will return the default value defined with `defaultValue = "spring-cookie"`. If we do not set the default value and Spring fails to find the cookie in the request then it will throw `java.lang.IllegalStateException` exception.


### Deleting a Cookie
To delete a cookie, we will need to create the cookie with the same name and maxAge to 0 and set it to the response header:

```java
 ResponseCookie deleteSpringCookie = ResponseCookie.from("cookie-name", null)
                    .build();

 ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, deleteSpringCookie.toString()).build();
```

## Conclusion

Cookies provide a way to exchange domain-specific information between a server and client (browser) to manage sessions, track the website's activity, or remember user preferences.
Spring Boot provides different ways of handling them.

* Servlet API
    * `Cookie` class to create the cookie and `HttpServletResponse` to set it to the client.
    * To read all the cookies we can use `HttpServletRequest` and it's method `getCookies()`
    * `setMaxAge(60)` to set an expiration date to the cookie
    * `setDomain("example.com")` to make cookie accessible by the domain specified and all its subdomains
    * `setPath("/")` to make the cookie accessible from the URL specified and all its subdirectories
    * `setSecure(true)` forcing the cookie to be transmitted only over secure connections HTTPS
    * `setHttpOnly(true)` preventing the client to access or edit the cookie
    * Set `maxAge` to 0 to delete a cookie
* Spring Framework
    * We use `ResponseCookie` class to create a cookie and `ResponseEntity` class to add it to the header of the response.
    * `@CookieValue` annotation to map the value of a cookie to a controller's method parameter
    * Set `maxAge` to 0 to delete a cookie

