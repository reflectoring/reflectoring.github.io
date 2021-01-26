---
title: "Handling Cookies with Spring Boot and the Servlet API"
categories: [spring-boot]
date: 2021-02-01 00:00:00 +1100
modified: 2021-02-01 00:00:00 +1100
author: godeortela
excerpt: "This article demonstrates how to handle cookies in a Spring Boot or Servlet-based application."
image:
  auto: 0093-cookie
---

This article is about cookies and different ways we can implement them in Spring Boot. We are going to have a short overview of what cookies are, how they work, and how we can handle them using the Servlet API and Spring Boot.

If you are building a web application then you have probably already reached the point where there's the need to implement cookies. If you haven't, you will!

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/cookie-demo" %}

## What are Cookies?

Simply put, cookies are nothing but a piece of information that is stored on the client-side (i.e. in the browser). The client sends them to the server with each request and servers can tell the client which cookies to store.

They are commonly used to track the activity of a website, to customize user sessions, and for servers to recognize users between requests. Another scenario is to store a JWT token or the user id in a cookie so that the server can recognize if the user is authenticated with every request.

## How Do Cookies Work?

Cookies are sent to the client by the server in an HTTP response and are stored in the client (user's browser).

The server sets the cookie in the HTTP response header named `Set-Cookie`. A cookie is made of a key /value pair, plus other optional attributes, which we'll look at later.

Let's imagine a scenario where a user logs in. The client sends a request to the server with the user's credentials. The server authenticates the user, creates a cookie with a user id encoded, and sets it in the response header. The header `Set-Cookie` in the HTTP response would look like this:

```sh
Set-Cookie: user-id=c2FtLnNtaXRoQGV4YW1wbGUuY29t
```

Once the browser gets the cookie, it can send the cookie back to the server. To do this, the browser adds the cookie to an HTTP request by setting the header named `Cookie`:

```sh
Cookie: user-id=c2FtLnNtaXRoQGV4YW1wbGUuY29t
```

The server reads the cookie from the request verifies if the user has been authenticated or not, based on the fact if the user-id is valid.

As mentioned, a cookie can have other optional attributes, so let's explore them.

### Cookie Max-Age and Expiration Date

The attributes `Max-Age` and/or `Expires` are used to make a cookie persistent. By default, the browser removes the cookie when the session is closed unless `Max-Age` and/or `Expires` are set. These attributes are set like so:

```sh
Set-Cookie: user-id=c2FtLnNtaXRoQGV4YW1wbGUuY29t; Max-Age=86400; Expires=Thu, 21-Jan-2021 20:06:48 GMT
```

This cookie will expire 86400 seconds after being created or when the date and time specified in the `Expires` is passed.

When both attributes are present in the cookie, `Max-Age` has precedence over `Expires`.

### Cookie Domain

`Domain` is another important attribute of the Cookie. We use it when we want to specify a domain for our cookie:

```sh
Set-Cookie: user-id=c2FtLnNtaXRoQGV4YW1wbGUuY29t; Domain=example.com; Max-Age=86400; Expires=Thu, 21-Jan-2021 20:06:48 GMT
```

By doing this we are telling the client to which domain it should send the cookie. A browser will only send a cookie to servers from that domain.

Setting the domain to "example.com" not only will send the cookie to the "example.com" domain but also its subdomains "foo.example.com" and "bar.example.com".

**If we don't set the domain explicitly, it will be set only to the domain that created the cookie, but not to its subdomains.**

### Cookie Path

The `Path` attribute specifies where a cookie will be delivered inside that domain. The client will add the cookie to all requests to URLs that match the given path. This way we narrow down the URLs where the cookie is valid inside the domain.

Let's consider that the backend sets a cookie for its client when a request to `http://example.com/login` is executed:

```sh
Set-Cookie: user-id=c2FtLnNtaXRoQGV4YW1wbGUuY29t; Domain=example.com; Path=/user/; Max-Age=86400; Expires=Thu, 21-Jan-2021 20:06:48 GMT
```

Notice that the `Path` attribute is set to `/user/`. Now let's visit two different URLs and see what we have in the request cookies.

When we execute a request to `http://example.com/user/`, the browser will add the following header in the request:

```sh
Cookie: user-id=c2FtLnNtaXRoQGV4YW1wbGUuY29t
```

As expected, the browser sends the cookie back to the server.

When we try to do another request to `http://example.com/contacts/` the browser will not include the `Cookie` header, because it doesn't match the `Path` attribute.

When the path is not set during cookie creation, it defaults to `/`.

**By setting the `Path` explicitly, the cookie will be delivered to the specified URL and all of its subdirectories.**

### Secure Cookie

In cases when we store sensitive information inside the cookie and we want it to be sent only in secure (HTTPS) connections, then the `Secure` attribute comes to our rescue:

```sh
Set-Cookie: user-id=c2FtLnNtaXRoQGV4YW1wbGUuY29t; Domain=example.com; Max-Age=86400; Expires=Thu, 21-Jan-2021 20:06:48 GMT; Secure
```

By setting `Secure`, we make sure our cookie is only transmitted over HTTPS, and it will not be sent over unencrypted connections.

### `HttpOnly` Cookie

`HttpOnly` is another important attribute of a cookie. It ensures that the cookie is not accessed by the client scripts. It is another form of securing a cookie from being changed by malicious code or XSS attacks.

```sh
Set-Cookie: user-id=c2FtLnNtaXRoQGV4YW1wbGUuY29t; Domain=example.com; Max-Age=86400; Expires=Thu, 21-Jan-2021 20:06:48 GMT; Secure; HttpOnly
```

**Not all browsers support the `HttpOnly` flag**. The good news is most of them do, but if it doesn't, it will ignore the `HttpOnly` flag even if it is set during cookie creation. Cookies should always be `HttpOnly` unless the browser doesn't support it or there is a requirement to expose them to clients' scripts.

Now that we know what cookies are and how they work let's check how we can handle them in spring boot.

## Handling Cookies with the Servlet API

Now, let's take a look at how to set cookies on the server-side with the Servlet API. 

### Creating a Cookie

For creating a cookie with the Servlet API we use the `Cookie` class which is defined inside the `javax.servlet.http` package. 

The following snippet of code creates a cookie with name `user-id` and value `c2FtLnNtaXRoQGV4YW1wbGUuY29t` and sets all the attributes we discussed:

```java
Cookie jwtTokenCookie = new Cookie("user-id", "c2FtLnNtaXRoQGV4YW1wbGUuY29t");

jwtTokenCookie.setMaxAge(86400);
jwtTokenCookie.setSecure(true);
jwtTokenCookie.setHttpOnly(true);
jwtTokenCookie.setPath("/user/");
jwtTokenCookie.setDomain("example.com");
```

Now that we created the cookie, we will need to send it to the client. To do so, we add the cookie to the response(`HttpServletResponse`) and we are done. Yes, it is as simple as that:

```java
response.addCookie(jwtTokenCookie);
```

### Reading a Cookie

After adding the cookie to the response header, the server will need to read the cookies sent by the client in every request.

The method `HttpServletRequest#getCookies()` returns an array of cookies that are sent with the request. We can identify our cookie by the cookie name.

In the following snippet of code, we are iterating through the array, searching by cookie name, and returning the value of the matched cookie:

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
Cookie deleteServletCookie = new Cookie("user-id", null);
deleteServletCookie.setMaxAge(0);
response.addCookie(deleteServletCookie);
```

Going back to our use case where we save the JWT token inside the cookie, we would need to delete the cookie when the user logs out. Keeping the cookie alive after the user logs out can seriously compromise the security.

## Handling Cookies with Spring

Now that we know how to handle a cookie using the Servlet API, let's check how we can do the same using the Spring Framework.

### Creating a Cookie

In this section, we will create a cookie with the same properties that we did using the Servlet API.

We will use the class `ResponseCookie` for the cookie and `ResponseEntity` for setting the cookie in the response. They are both defined inside `org.springframework.http` package.

`ResponseCookie` has a static method `from(final String name, final String value)` which returns a `ResponseCookieBuilder` initialized with the name and value of the cookie.

We can add all the properties that we need and use the method `build()` of the builder to create the `ResponseCookie`:

```java
 ResponseCookie springCookie = ResponseCookie.from("user-id", "c2FtLnNtaXRoQGV4YW1wbGUuY29t")
    .httpOnly(true)
    .secure(true)
    .path("/")
    .maxAge(60)
    .domain("example.com")
    .build();
```

After creating the cookie, we add it to the header of the response like this:

```java
 ResponseEntity
    .ok()
    .header(HttpHeaders.SET_COOKIE, springCookie.toString())
    .build();
```

### Reading a Cookie with `@CookieValue`

Spring Framework provides the `@CookieValue` annotation to read any cookie by specifying the name without needing to iterate over all the cookies fetched from the request.

`@CookieValue` is used in a controller method and maps the value of a cookie to a method parameter:

```java
@GetMapping("/read-spring-cookie")
public String readCookie(
    @CookieValue(name = "user-id", defaultValue = "default-user-id") String userId) {
    return userId;
}
```

In cases where the cookie with the name "user-id" does not exist, the controller will return the default value defined with `defaultValue = "default-user-id"`. If we do not set the default value and Spring fails to find the cookie in the request then it will throw `java.lang.IllegalStateException` exception.

### Deleting a Cookie

To delete a cookie, we will need to create the cookie with the same name and `maxAge` to 0 and set it to the response header:

```java
 ResponseCookie deleteSpringCookie = ResponseCookie
        .from("cookie-name", null)
        .build();

 ResponseEntity
        .ok()
        .header(HttpHeaders.SET_COOKIE, deleteSpringCookie.toString())
        .build();
```

## Conclusion

In this article, we looked at what cookies are and how they work.

All in all, cookies are simple text strings that carry some information and are identified with a name.

We checked some of the optional attributes that we can add to cookies to make them behave a certain way. We saw that we can make them persistent with `Max-Age` and `Expires`, narrow down their scope with `Domain` and `Path`, have them transmitted only over HTTPS with `Secure`, and hide them from client scripts with `HttpOnly`.

Finally, we looked into two ways of handling cookies using the Servlet API and Spring.
Both of these APIs offer the required methods for creating (with attributes), reading, and deleting cookies.

They are easy to implement and developers can choose either of them to implement cookies.

You can play around with the example code of this article on [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/cookie-demo).
