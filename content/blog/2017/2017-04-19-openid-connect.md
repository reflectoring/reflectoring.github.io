---
title: OpenID Connect
categories: ["WIP", "Software Craft"]
date: 2017-04-19
authors: [david]
excerpt: "A short introduction to OpenID Connect - the standard for Identity Management and Single-Sign-On."
image: images/stock/0048-passport-1200x628-branded.jpg
url: openid-connect
---



You may have already heard about OpenID Connect as the new standard for single sign-on and identity provision on the internet. If not, I am sure that you have at least already used it by clicking on any of these "Log In With Google" buttons. **But what is OpenID Connect and why would you want to use it for your own applications?** In this post I want to give a simple answer to these questions.

### Motivation

When thinking about **authentication** (`Who is the user?`) and **authorization** (`What is the user allowed to do?`) for your application, the first approach might be to store your users in a local database and create a custom login that checks against this database. This works fine for small apps in small environments. For big enterprises though, it quickly becomes hard to manage all the users if you have myriad different applications with numerous different roles. The solution to this problem could be to centralize the identification by creating a single service that is only responsible for authentication and authorization, called **Identity Provider** (ID Provider).

### Introducing OpenID Connect

**OpenID Connect** (OIDC) is a standard for creating such an ID Provider (and more). It basically adds an authentication layer to **OAuth 2.0** (an authorization framework). Technically spoken OIDC specifies a RESTful HTTP API, that is using the [**JSON Web Token**](https://jwt.io/) (JWT) standard. In the following I will try to explain these and more technical terms concerning OIDC with the help of a simple example.

### A Simple Example

Imagine the following situation: You have created a cool new app but don't want to have anything to do with storing information about all the users of your app (maybe because you don't know how to do this absolutely secure). On the other hand, you don't want to give access to everyone out there. Therefore, you want to give your users the option to log into your app with their google accounts. Within this example you already have all the three important roles in the OIDC world:

1. Your app is the **Client** (denoted as **Relying Party** in OIDC)
2. "Google" is the **Authorization Server** (denoted as **OpenID Provider** in OIDC)
3. Your users are the **Resource Owners**.

In OIDC there are different ways (flows) to authenticate a user. The **Authorization code flow** is the most commonly used one and works like this:

A user opens your app for the first time. As he isn't already logged in, your app redirects him to google. There the user logs in with his google credentials. Google authenticates him and creates a one-time, short-lived, temporary code. The user gets redirected back to your app with this code attached. Your app extracts the code and makes a background REST invocation to google for an **Identity Token** (ID token), **Access Token** and **Refresh Token**. The most important one is the ID token, targeted to identify the user within the client. After your client validates this ID token (to make sure that it hasn't been changed during transport), the user is successfully logged in. Moreover, your client can use the access token to ask the OpenID Provider (the userinfo endpoint to be exact) for additional information about your user. Because the access token usually expires after a few minutes the refresh token can be used to obtain a new access token.

A quite interesting fact here is that OpenID Connect doesn't specify **how** the user gets authenticated by the OpenID Provider. That means that it doesn't necessarily need to be a username and password, but could also be for example a code, that is sent to the users email address or anything else you can imagine. In addition, these mechanisms can be changed easily depending on the degree of security you require and without the need to change any of the secured applications.

### JSON Web Token (JWT)

As seen in the example, the app finally gets three different tokens: the ID token, access token and refresh token. Because your application hasn't saved any information about your user, it has to extract them from the ID token or request additional details from the OpenID Provider with the help of the access token. As mentioned earlier the ID token is indeed a [JWT](https://jwt.io/) (pronounced like the English word "jot"). 

A JWT is basically a JSON-based, cryptographically signed, base-64 encoded and URL-safe string. It is separated by dots into three different parts. In this post I don't want to get into details of JWT, but if you are interested I would suggest reading [this blog post](https://medium.com/vandium-software/5-easy-steps-to-understanding-json-web-tokens-jwt-1164c0adfcec) or [this great talk](https://www.youtube.com/watch?v=67mezK3NzpU).

>header.payload.signature

The interesting information is within the payload (decoded example of a payload):

```json
{ 
  "exp": 1491392499,
  "iat": 1491392199,
  "sub": "41f97c0d-66c7-47c0-9f06-13e48332e2cc",
  "iss": "http://localhost/auth/realms/demo", 
  "aud": "demoClient",
  "typ": "ID",
  "azp": "demoClient",
  "session_state": "802f8a0d-a329-4b7f-9d1e-ba518a481ba2",
  "name": "max mustermann",
  "family_name": "mustermann",
  "email": "max@test.com"
}
```

The cool thing about ID tokens as JWTs is that you don't need to save sessions within your application. Instead you just need to make sure that the JWT hasn't been changed, by validating it.

### Summary

As you have seen in this short example, your app could be secured without storing any user information yourself. Instead you delegated this concern to Google. Centralizing user management to one OpenID Provider can make things a lot easier. By the way, you are not limited to use any big provider like Google. Consider using [Keycloak](http://www.keycloak.org/) as your own custom OpenID Provider.

There are a lot more advantages of using OpenID Connect that I haven't mentioned in this short blog post. Easy realization of Single-Sign-On or minimizing password security risks are just two of them.
