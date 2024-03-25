---
authors: [sagaofsilence]
title: "Async APIs Offered by Apache HTTP Client"
categories: ["Java"]
date: 2024-02-11 00:00:00 +1100
excerpt: "Async APIs Offered by Apache HTTP Client."
image: images/stock/0075-envelopes-1200x628-branded.jpg
url: apache-http-client-async-apis
---

In this article we are going to learn about async APIs offered by Apache HTTP client APIs. We are going to explore the different ways Apache HTTP client enable developers to send and receive data over the internet in asynchronous mode. From simple GET requests to complex multipart POSTs, we'll cover it all with real-world examples. So get ready to learn to implement HTTP interactions with Apache HTTP client! 

## The "Create a HTTP Client with Apache HTTP Client" Series

This article is the fourth part of a series:

1. [Introduction to Apache HTTP Client](/create-a-http-client-with-apache-http-client/)
2. [Apache HTTP Client Configuration](/apache-http-client-config/)
3. [Classic APIs Offered by Apache HTTP Client](/apache-http-client-classic-apis/)
4. [Async APIs Offered by Apache HTTP Client](/apache-http-client-async-apis/)
5. [Reactive APIs Offered by Apache HTTP Client](/apache-http-client-reactive-apis/)

{{% github "https://github.com/thombergs/code-examples/tree/master/create-a-http-client-wth-apache-http-client" %}}

\
Let us now learn how to use Apache HTTP client for web communication. We have grouped the examples under following categories of APIs: classic, async and reactive. In this article we will learn about the async APIs offered by Apache HTTP Client.


{{% info title="Reqres Fake Data CRUD API" %}}
We are going to use [Reqres API Server](https://reqres.in) to test different HTTP methods. It is a free online API that can be used for testing and prototyping. It provides a variety of endpoints that can be used to test different HTTP methods. The reqres API is a good choice
 for testing CORS because it supports all of the HTTP methods that are allowed by CORS.
{{% /info %}}

## HttpClient (Async APIs)
In this section of examples we are going to learn how to use `HttpClient` for sending requests and consuming responses in asynchronous mode. The client code will wait until it receives response from the server.

{{% info title="HTTP and CRUD Operations" %}}
CRUD operations refer to Create, Read, Update, and Delete actions performed on data. In the context of HTTP endpoints for a `/users` resource:
1. **Create**: Use HTTP POST to add a new user. Example URL: `POST /users`
2. **Read**: Use HTTP GET to retrieve user data. Example URL: `GET /users/{userId}` for a specific user or `GET /users?page=1` for a list of users with pagination.
3. **Update**: Use HTTP PUT or PATCH to modify user data. Example URL: `PUT /users/{userId}`
4. **Delete**: Use HTTP DELETE to remove a user. Example URL: `DELETE /users/{userId}`
{{% /info %}}

\

## Conclusion
In this article we got familiar with the async APIs of Apache HTTP client, we explored a multitude of essential functionalities vital for interacting with web servers. From fetching paginated records to pinpointing specific data, and from determining server statuses to manipulating records, we learned a comprehensive array of HTTP methods. Understanding these capabilities equips us with the tools needed to navigate and interact with web resources efficiently and effectively. With this knowledge, our applications can communicate seamlessly with web servers, ensuring smooth data exchanges and seamless user experiences.
