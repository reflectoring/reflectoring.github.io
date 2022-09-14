---
title: "Configuring CSRF with Spring Boot and Spring Security"
categories: ["Spring"]
date: 2022-09-13 00:00:00 +1100
modified: 2022-09-13 00:00:00 +1100
authors: ["ranjani"]
description: "Configuring CSRF with Spring Boot and Spring Security"
image: images/stock/0044-lock-1200x628-branded.jpg
url: spring-csrf
---

**Cross-site Request Forgery (CSRF)** is an attack that can trick an end-user using a web application to unknowingly execute actions that can compromise security.
To understand what constitutes a CSRF attack, refer to [this introductory article](https://reflectoring.io/complete-guide-to-csrf/).
Framework such as Spring have a built-in CSRF support. This article will focus on how to enable and configure CSRF in a Spring Boot application that uses Spring Security.
To understand the detailed guidelines around preventing CSRF vulnerabilities, refer to the [OWASP Guide](https://owasp.org/www-community/attacks/csrf).

# Ways to protect against CSRF
The standard recommended to have CSRF protection enabled is when we create a service that could be processed by browsers. 
If the created service is exclusively for non-browser clients we could disable CSRF protection.
Spring provides two mechanisms to protect against CSRF attack.
  - Synchronizer Token Pattern
  - Specifying the SameSite attribute on your session cookie
Let us understand how each of them work.

## Synchronizer Token Pattern
In this attack mitigation approach, a CSRF token is generated on the server-side(per request OR per session). Every request from the client needs to send this token.
The server will validate this token before processing the request.
