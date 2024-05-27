---
authors: [sagaofsilence]
categories: [Java]
date: 2024-04-23 00:00:00 +1100
excerpt: Classic APIs Offered by Apache HttpClient.
image: images/stock/0077-request-response-1200x628-branded.jpg
title: Classic APIs Offered by Apache HttpClient
url: apache-http-client-classic-apis
---

In this article we are going to learn about the classic APIs offered by Apache HttpClient. We are going to explore the different ways Apache HttpClient helps us to send and receive data over the internet in classic (synchronous) mode. From simple GET requests to complex multipart POST requests, we'll cover it all with real-world examples. So get ready to learn how to implement HTTP interactions with Apache HttpClient!

## The "Create an HTTP Client with Apache HttpClient" Series

This article is the third part of a series:

1. [Introduction to Apache HttpClient](/create-a-http-client-with-apache-http-client/)
2. [Apache HttpClient Configuration](/apache-http-client-config/)
3. [Classic APIs Offered by Apache HttpClient](/apache-http-client-classic-apis/)
4. [Async APIs Offered by Apache HttpClient](/apache-http-client-async-apis/)
5. [Reactive APIs Offered by Apache HttpClient](/apache-http-client-reactive-apis/)

{{% github "https://github.com/thombergs/code-examples/tree/master/create-a-http-client-wth-apache-http-client" %}}

  
We have grouped the examples under following categories of APIs: classic, async and reactive. In this article we will learn about the classic APIs offered by Apache HttpClient.

{{% info title="Reqres Fake Data CRUD API" %}}
We are going to use [Reqres API Server](https://reqres.in) to test different HTTP methods. It is a free online API that can be used for testing and prototyping. It provides a variety of endpoints that can be used to test different HTTP methods. The Reqres API is a good choice
for testing CRUD operations because it supports all the HTTP methods that CRUD allows.
{{% /info %}}

## HttpClient (Classic APIs)

In this section of examples we are going to learn how to use `HttpClient` for sending requests and consuming responses in synchronous mode. The client code will wait until it receives a response from the server.

{{% info title="HTTP and CRUD Operations" %}}
CRUD operations refer to Create, Read, Update, and Delete actions performed on data. In the context of HTTP endpoints for a `/users` resource:

- **Create**: Use HTTP POST to add a new user: `POST /users`
- **Read**: Use HTTP GET to retrieve user data: `GET /users/{userId}` for a specific user or `GET /users?page=1` for a list of users with pagination.
- **Update**: Use HTTP PUT or PATCH to modify user data: `PUT /users/{userId}`
- **Delete**: Use HTTP DELETE to remove a user: `DELETE /users/{userId}`
   {{% /info %}}

  
Now let's learn to process HTTP responses using a response handler.

The motivation behind using a response handler in Apache HttpClient is to provide a structured and reusable way to process HTTP responses.

Response handlers encapsulate the logic for extracting data from HTTP responses, allowing developers to define how to handle different types of responses in a modular and consistent manner.

By using response handlers, developers can centralize error handling, data extraction, and resource cleanup, resulting in cleaner and more maintainable code.

Additionally, response handlers promote code reusability, as the same handler can be used across multiple HTTP requests with similar response processing requirements.

Overall, response handlers enhance the flexibility, readability, and maintainability of code that interacts with HTTP responses using Apache HttpClient.

## Overview of Executing and Testing HTTP Methods

Before we start going through the code snippet, let's understand the general structure of the logic to execute HTTP methods and unit test to verify the logic.
Here is the sample code to execute an HTTP method:

```java
public class UserSimpleHttpRequestHelper extends BaseHttpRequestHelper {
 public String executeHttpMethod(Map<String, String> optionalRequestParameters)
      throws RequestProcessingException {

    try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
      // Create request
      HttpHost httpHost = HttpHost.create("https://reqres.in");
      
      // Populate NameValuePair list from optionalRequestParameters
      // Populate URI
      // Populate HTTP request
      
      // Create a response handler
      BasicHttpClientResponseHandler handler = new BasicHttpClientResponseHandler();
      String responseBody = httpClient.execute(httpHost, httpRequest, handler);

      return responseBody;
    } catch (Exception e) {
      throw new RequestProcessingException("Failed to execute HTTP request.", e);
    }
  }
}  

```

We define a class `UserSimpleHttpRequestHelper` that extends `BaseHttpRequestHelper`. It contains a method `executeHttpMethod()` that takes optional request parameters as input and returns the response body as a string.

Inside the method, we create an HTTP client using `HttpClients.createDefault()`. Then we create an HTTP host object representing the target host. Next, we prepare the HTTP request by populating parameters such as name-value pairs, URI, and HTTP method.

After preparing the request, we create a response handler of type `BasicHttpClientResponseHandler` to handle the response. Finally, we execute the HTTP request using the HTTP client, passing the host, request, and handler, and returns the response body as a string. If any exception occurs during this process, we throw a `RequestProcessingException` with an appropriate error message.

Here is a test case to verify this functionality:

```java
public class UserSimpleHttpRequestHelperTests extends BaseClassicExampleTests {

  private UserSimpleHttpRequestHelper userHttpRequestHelper =
      new UserSimpleHttpRequestHelper();

  /** Execute HTTP request. */
  @Test
  void executeHttpMethod() {
    try {
      // prepare optional request parameters
      Map<String, String> params = Map.of("page", "1");

      // execute
      String responseBody = userHttpRequestHelper.executeHttpMethod(params);

      // verify
      assertThat(responseBody).isNotEmpty();
    } catch (Exception e) {
      Assertions.fail("Failed to execute HTTP request.", e);
    }
  }
}

```

Inside the test method, we first prepare the optional request parameters, creating a map containing key-value pairs. These parameters might include details such as the page number for pagination.

Then, we invoke the `executeHttpMethod()` method of the `UserSimpleHttpRequestHelper`, passing the prepared parameters. This method executes an HTTP request using the Apache HttpClient and returns the response body as a string.

After executing the HTTP request, the test verifies the response body. It asserts that the response body is not empty, ensuring that the HTTP request was successful and returned some data.

If any exception occurs during the execution of the test, the test fails and provides details about the failure, including the exception message. This ensures that any errors encountered during the test execution are properly reported.

## HTTP Methods Used to Create Records

There'e one CRUD method to create records: POST.

### Executing an HTTP `POST` Request to Create a New Record

We use HTTP `POST` to create a new user. We need to provide details needed to create a new user.

Here's the code to create a new record:

```java
public String createUser(
  String firstName, String lastName, String email, String avatar
) throws RequestProcessingException {
  
  try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
    // Create request
    List<NameValuePair> formParams = new ArrayList<NameValuePair>();
    formParams.add(new BasicNameValuePair("first_name", firstName));
    formParams.add(new BasicNameValuePair("last_name", lastName));
    formParams.add(new BasicNameValuePair("email", email));
    formParams.add(new BasicNameValuePair("avatar", avatar));
    
  try (UrlEncodedFormEntity entity =
        new UrlEncodedFormEntity(formParams, StandardCharsets.UTF_8)) {
        
    HttpHost httpHost = HttpHost.create("https://reqres.in");
    URI uri = new URIBuilder("/api/users/").build();
    HttpPost httpPostRequest = new HttpPost(uri);
    httpPostRequest.setEntity(entity);
    
    // Create a response handler
    BasicHttpClientResponseHandler handler = new BasicHttpClientResponseHandler();
    String responseBody = httpClient.execute(httpHost, httpPostRequest, handler);
    
    return responseBody;
  } catch (Exception e) {
    throw new RequestProcessingException("Failed to create user.", e);
  }
}


```

The example illustrates a method for creating a new user by sending an HTTP `POST` request to the specified endpoint. We construct a list of form parameters containing the user's details such as first name, last name, email, and avatar. Then call the `execute()` method and receive a response body containing the created user's data.

And here's test:

```java
@Test
void executePostRequest() {
  try {
    // execute
    String createdUser =
        userHttpRequestHelper.createUser(
            "DummyFirst", "DummyLast", "DummyEmail@example.com", "DummyAvatar");
    // verify
    assertThat(createdUser).isNotEmpty();
  } catch (Exception e) {
    Assertions.fail("Failed to execute HTTP request.", e);
  }
}

```

The unit test verifies the functionality of the `createUser()` method. It calls the `createUser()` method with dummy user details (first name, last name, email, and avatar). The response represents the created user's data. Using assertions, the test verifies the response.

## HTTP Methods Used to Read Records

The CRUD methods to read records are: GET, HEAD, OPTIONS, and TRACE.

### Executing an HTTP GET Request to Get Paginated Records

We use an HTTP GET request to retrieve a single record as well as records in bulk. Furthermore, we can use pagination to split requests that return large responses into multiple requests.

{{% info title="Pagination, Its Advantages, Disadvantages and Complexities" %}}
Pagination in HTTP request processing involves dividing large sets of data into smaller, manageable pages. Clients specify the page they want using parameters like `page=1`. The server processes the request, retrieves the relevant page of data, and returns it to the client, enabling efficient data retrieval and presentation. Advantages of pagination include improved performance, reduced server load, enhanced user experience, and efficient handling of large datasets.

Pagination in HTTP REST calls can cause complexities on both server and client sides. Server-side complexities include additional logic for managing paginated data, increased resource usage for deep pagination, potential data consistency issues due to changing underlying data, and scalability challenges in distributed systems.

On the client side, complexities arise from managing pagination state, handling additional network overhead due to more HTTP requests, ensuring a smooth user experience with pagination controls, and managing errors during pagination. These factors can impact performance, user experience, and scalability, requiring careful design and error handling on both server and client sides.

{{% /info %}}

  
Let's implement a paginated HTTP GET request using a response handler:

```java
public class UserSimpleHttpRequestHelper extends BaseHttpRequestHelper {
 
 public String getPaginatedUsers(Map<String, String> requestParameters)
      throws RequestProcessingException {
    try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
      // Create request
      HttpHost httpHost = HttpHost.create("https://reqres.in");
      
      List<NameValuePair> nameValuePairs = requestParameters.entrySet().stream()
      .map(entry -> new BasicNameValuePair(entry.getKey(), entry.getValue()))
    .map(entry -> (NameValuePair) entry)
    .toList();
      URI uri = new URIBuilder("/api/users/").addParameters(nameValuePairs).build();  
      HttpGet httpGetRequest = new HttpGet(uri);
      
      // Create a response handler
      BasicHttpClientResponseHandler handler = new BasicHttpClientResponseHandler();
      String responseBody = httpClient.execute(httpHost, httpGetRequest, handler);

      return responseBody;
    } catch (Exception e) {
      throw new RequestProcessingException("Failed to get paginated users.", e);
    }
  }
}  

```

The code defines `getPaginatedUsers()` method to retrieve a list of users from an external API, specified by the request parameters map.  The `requestParameters` are mapped into a list of `NameValuePairs`. Then we create `HttpGet` instance, representing the GET request and call HttpClient's `execute()` method. The response body returned by the server is stored in the `responseBody` variable.

Here is a test case to verify this functionality:

```java
public class UserSimpleHttpRequestHelperTests extends BaseClassicExampleTests {

  private UserSimpleHttpRequestHelper userHttpRequestHelper =
      new UserSimpleHttpRequestHelper();

  /** Execute get paginated request. */
  @Test
  void executeGetPaginatedRequest() {
    try {
      // prepare
      Map<String, String> params = Map.of("page", "1");

      // execute
      String responseBody = userHttpRequestHelper.getAllUsers(params);

      // verify
      assertThat(responseBody).isNotEmpty();
    } catch (Exception e) {
      Assertions.fail("Failed to execute HTTP request.", e);
    }
  }
}

```

In test method `executeGetPaginatedRequest()`, we populate the request parameter (page=1) and execute an HTTP GET request to retrieve the first page of paginated users and verify the response.

### Executing an HTTP GET Request to Get a Specific Record

Let's execute HTTP GET request to get a specific user record using a response handler:

```java
public class UserSimpleHttpRequestHelper extends BaseHttpRequestHelper {
 
 /** Gets user for given user id. */
 public String getUser(long userId) throws RequestProcessingException {
    
    try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
      // Create request
      HttpHost httpHost = HttpHost.create("https://reqres.in");
      HttpGet httpGetRequest 
        = new HttpGet(new URIBuilder("/api/users/" + userId).build());
      
      // Create a response handler
      BasicHttpClientResponseHandler handler = new BasicHttpClientResponseHandler();
      String responseBody = httpClient.execute(httpHost, httpGetRequest, handler);

      return responseBody;
    } catch (Exception e) {
      throw new RequestProcessingException(
          MessageFormat.format("Failed to get user for ID: {0}", userId), e);
    }
  }
}


```

In this example, the `getUser()` method retrieves a user by its `id`. As we have learned in `getAllUsers()` code example, in this case also, we create a `HttpGet` request object, a `HttpHost` object and response handler. Then we call `execute()` method on the client. Then we obtain the response in string form.

Test case that verifies execute specific request:

```java
/** Execute get specific request. */
@Test
void executeGetSpecificRequest() {
  try {
    // prepare
    long userId = 2L;
    // execute
    String existingUser = userHttpRequestHelper.getUser(userId);
    // verify
    assertThat(existingUser).isNotEmpty();
  } catch (Exception e) {
    Assertions.fail("Failed to execute HTTP request.", e);
  }
}

```

In this example, we call `getUser()` method to get user with specific `id` and then check its response.

### Executing an HTTP `HEAD` Request to Get the Status of a Record

The `HEAD` method in HTTP can request information about a document without retrieving the document itself. It is similar to GET, but it does not receive the response body. It's used for caching, resource existence, modification checks, and link validation. Faster than GET, it saves bandwidth by omitting response data, making it ideal for resource checks and link validation, optimizing network efficiency.

Here is the code to execute HTTP `HEAD` request to get status of a specific user record using a response handler:

```java
public Integer getUserStatus(long userId) throws RequestProcessingException {
  
  try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
    // Create request
    HttpHost httpHost = HttpHost.create("https://reqres.in");
    URI uri = new URIBuilder("/api/users/" + userId).build();
    HttpHead httpHeadRequest = new HttpHead(uri);

    // Create a response handler, lambda to implement
    // HttpClientResponseHandler::handleResponse(ClassicHttpResponse response)
    HttpClientResponseHandler<Integer> handler = HttpResponse::getCode;
    Integer code = httpClient.execute(httpHost, httpHeadRequest, handler);

    log.info("Got response status code: {}", code);
    return code;
  } catch (Exception e) {
    throw new RequestProcessingException(
        MessageFormat.format("Failed to get user for ID: {0}", userId), e);
  }
}

```

In this example we send a `HEAD` request to the user endpoint to retrieve the status code of an HTTP request without fetching the response body.

Test for this functionality:

```java
/** Execute get specific request. */
@Test
void executeUserStatus() {
  try {
    // prepare
    long userId = 2L;
    // execute
    Integer userStatus = userHttpRequestHelper.getUserStatus(userId);
    // verify
    assertThat(userStatus).isEqualTo(HttpStatus.SC_OK);
  } catch (Exception e) {
    Assertions.fail("Failed to execute HTTP request.", e);
  }
}


```

This test method verifies the status returned by the HEAD method for a user. First, it prepares the user ID to be used in the request. Then, it executes the `getUserStatus()` method from the `UserSimpleHttpRequestHelper` class to fetch the status code for the specified user ID. Finally, it verifies that the obtained user status is equal to `HttpStatus.SC_OK` (200), indicating a successful request.

### Executing an HTTP `OPTIONS` Request to Find out Request Methods Allowed by Server

The HTTP `OPTION` method is a type of HTTP call that explains what are the options for a target resource such as an API endpoint. We can use `OPTION` to find out which HTTP methods are supported by the server.

Here is command line example to execute it:

```bash
curl https://reqres.in -X OPTIONS -i


```

We can also find out allowed methods for specific URI path.

```bash
curl https://reqres.in/api/users/ -X OPTIONS -i

```

We get response from the server as below:

```bash
HTTP/2 204
date: Sat, 24 Feb 2024 05:02:34 GMT
report - to: {
    "group": "heroku-nel",
    "max_age": 3600,
    "endpoints": [{
            "url": "https://nel.heroku.com/reports
                    ?ts=1708750954&sid=c4c9725f-1ab0-44d8-820f-430df2718e11
                    &s=Yy4ohRwVOHU%2F%2FK7CXkQCt4qraPmzmqEwLt50qhzv1jg%3D"
        }
    ]
}
reporting-endpoints: 
  heroku-nel=https://nel.heroku.com/reports
             ?ts=1708750954&sid=c4c9725f-1ab0-44d8-820f-430df2718e11
             &s=Yy4ohRwVOHU%2F%2FK7CXkQCt4qraPmzmqEwLt50qhzv1jg%3D
nel: {
    "report_to": "heroku-nel",
    "max_age": 3600,
    "success_fraction": 0.005,
    "failure_fraction": 0.05,
    "response_headers": ["Via"]
}
x-powered-by: Express
access-control-allow-origin: *
access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE
vary: Access-Control-Request-Headers
via: 1.1 vegur
cf-cache-status: DYNAMIC
server: cloudflare
cf-ray: 85a52838ff1f2e32-BOM

```

In this command output, there is a line `access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE` that tells us all 'HTTP' methods allowed by the server.

The response headers will include the necessary information. The `Allow` or `access-control-allow-methods` header indicates the HTTP methods supported for the requested resource.

{{% info title="HTTP `OPTIONS` Facts" %}}

The `OPTION` method is used to make a preflight request to the server. A preflight request is a request that is sent to the server to determine if the actual request is allowed. The server will respond to the preflight request with a list of the HTTP methods that are allowed. The browser will then send the actual request if the requested method is in the list. The server also includes a message that indicates the allowed origin, methods, and headers.

The `Access-Control-Allow-Methods` header is required for cross-origin resource sharing (`CORS`). `CORS` is a security mechanism that prevents websites from accessing resources from other domains.

The `Access-Control-Allow-Methods` header tells the browser which HTTP methods are allowed when accessing the resource.

{{% /info %}}
  
Here's how we can send an OPTIONS request using HTTP client:

```java
public Map<String, String> executeOptions() throws RequestProcessingException {
    
  try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
    
    HttpHost httpHost = HttpHost.create("https://reqres.in");
    
    URI uri = new URIBuilder("/api/users/").build();
    HttpOptions httpOptionsRequest = new HttpOptions(uri);
    
    // Create a response handler, lambda to implement
    // HttpClientResponseHandler::handleResponse(ClassicHttpResponse response)
    HttpClientResponseHandler<Map<String, String>> handler =
        response ->
            StreamSupport.stream(
                    Spliterators.spliteratorUnknownSize(
                        response.headerIterator(), Spliterator.ORDERED),
                    false)
                .collect(Collectors.toMap(Header::getName, Header::getValue));
    
    return httpClient.execute(httpHost, httpOptionsRequest, handler);
  } catch (Exception e) {
    throw new RequestProcessingException("Failed to execute the request.", e);
  }
}

```

In this example, we populate the `HttpOptions` request and call the `HttpClient.execute()` method. The response from the server is processed by the handler, and the resulting map of headers is returned to the caller.

Let's now test the OPTIONS request:

```java
@Test
void executeOptions() {
  try {
    // execute
    Map<String, String> headers = userHttpRequestHelper.executeOptions();
    assertThat(headers.keySet())
        .as("Headers do not contain allow header")
        .containsAnyOf("Allow", "Access-Control-Allow-Methods");
  } catch (Exception e) {
    Assertions.fail("Failed to execute HTTP request.", e);
  }
}

```

The test calls `executeOptions()` to perform the `OPTIONS` request and retrieve the headers from the server. Then it verifies that the keys of the 'headers' map contain at least one of the expected headers ('Allow' or 'Access-Control-Allow-Methods').

### Executing an HTTP `TRACE` Request to Perform Diagnosis

The HTTP `TRACE` method performs a message loop-back test along the path to the target resource, providing a useful debugging mechanism. However, it is advised not to use this method as it can open the gates to the intruders.

{{% danger title="The Vulnerability of TRACE" %}}
As warned by OWASP in the documentation on [Test HTTP Methods](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/06-Test_HTTP_Methods) the `TRACE` method, or `TRACK` in Microsoft's systems, makes the server repeat what it receives in a request. This caused a problem known as `Cross-Site Tracing (XST)` in 2003, allowing access to cookies marked with the `HttpOnly` flag. Browsers and plugins have blocked `TRACE` for years, so this problem is no longer a risk. However, if a server still allows `TRACE`, it might indicate security weaknesses.
{{% /danger %}}

## HTTP Methods Used to Update Records

The CRUD methods to update records are: PUT, PATCH.

### Executing an HTTP `PUT` Request to Update an Existing Record

We use HTTP `PUT` to update an existing user. We need to provide details needed to update the user.

Implementation for updating an existing user:

```java
public String updateUser(
    long userId, String firstName, String lastName, String email, String avatar
  ) throws RequestProcessingException {
    
    try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
      // Update request
      List<NameValuePair> formParams = new ArrayList<NameValuePair>();
      formParams.add(new BasicNameValuePair("first_name", firstName));
      formParams.add(new BasicNameValuePair("last_name", lastName));
      formParams.add(new BasicNameValuePair("email", email));
      formParams.add(new BasicNameValuePair("avatar", avatar));

      try (UrlEncodedFormEntity entity =
          new UrlEncodedFormEntity(formParams, StandardCharsets.UTF_8)) {
        HttpHost httpHost = HttpHost.create("https://reqres.in");
        URI uri = new URIBuilder("/api/users/" + userId).build();
        
        HttpPut httpPutRequest = new HttpPut(uri);
        httpPutRequest.setEntity(entity);

        // Create a response handler
        BasicHttpClientResponseHandler handler = new BasicHttpClientResponseHandler();
        String responseBody = httpClient.execute(httpHost, httpPutRequest, handler);

        return responseBody;
      }
    } catch (Exception e) {
      throw new RequestProcessingException("Failed to update user.", e);
    }
  }

```

The example above shows how to update a user's information via an HTTP `PUT` request. The method constructs the update request by creating a list of `NameValuePair` objects containing the user's updated details (first name, last name, email, and avatar). Then we send request to the specified user's endpoint (/api/users/{userId}). The response body from the server, indicating the success or failure of the update operation, is captured and returned as a string.

Let's test update user workflow:

```java
@Test
void executePutRequest() {
  try {
    // prepare
    int userId = 2;
    // execute
    String updatedUser =
        userHttpRequestHelper.updateUser(
            userId,
            "UpdatedDummyFirst",
            "UpdatedDummyLast",
            "UpdatedDummyEmail@example.com",
            "UpdatedDummyAvatar");
    // verify
    assertThat(updatedUser).isNotEmpty();
  } catch (Exception e) {
    Assertions.fail("Failed to execute HTTP request.", e);
  }
}

```

In this example we execute an HTTP `PUT` request to update a user's information. The method first prepares the necessary parameters for the update operation, including the user's ID and the updated details (first name, last name, email, and avatar). It then invokes the `updateUser()` method of the `userHttpRequestHelper` object, passing these parameters. The method captures the response from the server, indicating the success or failure of the update operation, and asserts that the response body is not empty to verify the update's success.

### Executing an HTTP `PATCH` Request to Partially Update an Existing Record

We use HTTP `PATCH` to update an existing user in a partial way. We need to provide details needed to update the user.

Logic to update an existence user partially:

```java
public String patchUser(long userId, String firstName, String lastName)
      throws RequestProcessingException {
      
  try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
    // Update request
    List<NameValuePair> formParams = new ArrayList<NameValuePair>();
    formParams.add(new BasicNameValuePair("first_name", firstName));
    formParams.add(new BasicNameValuePair("last_name", lastName));
    
    try (UrlEncodedFormEntity entity =
        new UrlEncodedFormEntity(formParams, StandardCharsets.UTF_8)) {
      
      HttpHost httpHost = HttpHost.create("https://reqres.in");
      
      URI uri = new URIBuilder("/api/users/" + userId).build();
      HttpPatch httpPatchRequest = new HttpPatch(uri);
      httpPatchRequest.setEntity(entity);

      // Create a response handler
      BasicHttpClientResponseHandler handler = new BasicHttpClientResponseHandler();
      String responseBody = httpClient.execute(httpHost, httpPatchRequest, handler);

      return responseBody;
    }
  } catch (Exception e) {
    throw new RequestProcessingException("Failed to patch user.", e);
  }
}

```

The example above shows how to update a user's information via an HTTP `PATCH` request. The method constructs the patch request by creating a list of `NameValuePair` objects containing few of the user's updated details (first name and last name). Then we send the request to the specified user's endpoint (/api/users/{userId}). The response body from the server, indicating the success or failure of the update operation, is captured and returned as a string.

Test to verify patch request:

```java
@Test
void executePatchRequest() {
  try {
    // prepare
    int userId = 2;
    // execute
    String patchedUser =
        userHttpRequestHelper.patchUser(
            userId,
            "UpdatedDummyFirst",
            "UpdatedDummyLast");
    // verify
    assertThat(patchedUser).isNotEmpty();
  } catch (Exception e) {
    Assertions.fail("Failed to execute HTTP request.", e);
  }
}

```

In this example we execute an HTTP `PATCH` request to partially update a user's information. It first prepares the necessary parameters for the update operation, including the user's ID and few of the users details (first name and last name). It then invokes the `patchUser()`, passing these parameters. The method captures the response from the server, indicating the success or failure of the update operation, and asserts that the response body is not empty to verify the patch's success.

## HTTP Methods Used to Delete Records

There's one CRUD method to delete a record: DELETE.

### Executing an HTTP `DELETE` Request to Delete an Existing Record

We use HTTP `DELETE` to delete an existing user. We need user ID to delete the user.

Let's implement delete user logic:

```java
public void deleteUser(long userId) throws RequestProcessingException {

  try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
    
    HttpHost httpHost = HttpHost.create("https://reqres.in");
    
    URI uri = new URIBuilder("/api/users/" + userId).build();
    HttpDelete httpDeleteRequest = new HttpDelete(uri);
    
    // Create a response handler
    BasicHttpClientResponseHandler handler = new BasicHttpClientResponseHandler();
    String responseBody = httpClient.execute(httpHost, httpDeleteRequest, handler);
  } catch (Exception e) {
    throw new RequestProcessingException("Failed to update user.", e);
  }
}

```

The example demonstrates how to implement an HTTP `DELETE` request to delete an existing user. It constructs the `URI` for the delete request and calls `execute()`, passing the `HttpDelete` request and a response handler. Finally, it captures the `null` response from the server.

Test case verifying delete functionality:

```java
@Test
void executeDeleteRequest() {
  try {
    // prepare
    int userId = 2;
    // execute
    userHttpRequestHelper.deleteUser(userId);
  } catch (Exception e) {
    Assertions.fail("Failed to execute HTTP request.", e);
  }
}

```

The provided test aims to verify the functionality of the `deleteUser()` method. It prepares by specifying the user ID of the user to be deleted, in this case, `userId = 2`. It then executes the `deleteUser()` method, passing the `userId` as an argument.

## Using User Defined Type in Request Processing

So far we have used built-in Java types like `String`, `Integer` in requests and responses. But we are not limited to use those built-in types.

### User Defined Request and Response

We can use Plain Old Java Objects (POJO objects) in requests sent using HttpClient `execute()`. However, we typically do not directly use a POJO as the request entity. Instead, we convert the POJO into a format that can be sent over HTTP, such as `JSON` or `XML`, and then include that data in the request entity.

The `HttpEntity` interface represents an entity in an HTTP message, but it typically encapsulates raw data, such as text, binary content, or form parameters. While we cannot directly use a POJO as a `HttpEntity`, we can serialize the POJO into a suitable format and then create a `HttpEntity` instance from that serialized data.

### Custom HTTP Response Handler

For example, if we want to send a POJO as `JSON` in an HTTP request, we would first serialize the POJO into a `JSON` string, and then create a `StringEntity` instance with that `JSON` string as the content.

Here's an example using Jackson `ObjectMapper` to serialize a POJO into `JSON` and include it in the request entity:

```java
/** Generic HttpClientResponseHandler */
public class DataObjectResponseHandler<T> 
    extends AbstractHttpClientResponseHandler<T> {
    
  private ObjectMapper objectMapper = new ObjectMapper();

  @NonNull private Class<T> realType;

  public DataObjectResponseHandler(@NonNull Class<T> realType) {
    this.realType = realType;
  }

  @Override
  public T handleEntity(HttpEntity httpEntity) throws IOException {

    try {
      return objectMapper.readValue(EntityUtils.toString(httpEntity), realType);
    } catch (ParseException e) {
      throw new ClientProtocolException(e);
    }
  }
}

// Get user using custom HttpClientResponseHandler
public class UserTypeHttpRequestHelper extends BaseHttpRequestHelper {

  public User getUser(long userId) throws RequestProcessingException {
    
    try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
      // Create request
      HttpHost httpHost = userRequestProcessingUtils.getApiHost();

      URI uri = userRequestProcessingUtils.prepareUsersApiUri(userId);
      HttpGet httpGetRequest = new HttpGet(uri);

      // Create a response handler
      HttpClientResponseHandler<User> handler 
        = new DataObjectResponseHandler<>(User.class);
      return httpClient.execute(httpHost, httpGetRequest, handler);
    } catch (Exception e) {
      throw new RequestProcessingException(
          MessageFormat.format("Failed to get user for ID: {0}", userId), e);
    }
  }
}

```

The `DataObjectResponseHandler` is a generic HTTP response handler that deserializes JSON into specified POJO using the Jackson ObjectMapper. It converts the HTTP response entity to a JSON string using `EntityUtils.toString()`, then deserializes it into a POJO of the given type. This design reduces code duplication, enhancing reusability and maintainability.

The `UserTypeHttpRequestHelper` class has a method `getUser()` that retrieves a user from a server using a custom `HttpGet` request. The response is processed by `DataObjectResponseHandler`, which deserializes the server's JSON response into a `User` object. We catch the errors during execution and thrown them again as `RequestProcessingException`.

Test case to get a user:

```java
@Test
void executeGetUser() {
  try {
    // prepare
    long userId = 2L;
    // execute
    User existingUser = userHttpRequestHelper.getUser(userId);
    // verify
    ThrowingConsumer<User> responseRequirements =
        user -> {
          assertThat(user).as("Created user cannot be null.").isNotNull();
          assertThat(user.getId()).as("ID should be positive number.")
                                  .isEqualTo(userId);
          assertThat(user.getFirstName()).as("First name cannot be null.")
                                         .isNotEmpty();
          assertThat(user.getLastName()).as("Last name cannot be null.")
                                        .isNotEmpty();
          assertThat(user.getAvatar()).as("Avatar cannot be null.").isNotNull();
        };
    assertThat(existingUser).satisfies(responseRequirements);
  } catch (Exception e) {
    Assertions.fail("Failed to execute HTTP request.", e);
  }
}


```

It prepares by defining the `userId` variable, executes the method using the `userHttpRequestHelper`, and verifies the response received from the server. If exceptions occur, the test fails with an error message.

{{% info title="Choosing User Defined Type Vs Built-in Type" %}}

Typed classes offer advantages such as enhanced type safety, allowing for better code readability and preventing type-related errors. They also facilitate better code organization and maintainability by encapsulating related functionality within specific classes. However, they may introduce complexity and require additional effort for implementation. In contrast, built-in types like String offer simplicity and ease of use but may lack the specific functionality and type safety provided by custom typed classes. The choice between typed classes and built-in types depends on factors such as project requirements, complexity, and maintainability concerns.

{{% /info %}}

## Conclusion

In this article we got familiar with the classic APIs of Apache HttpClient, we explored a multitude of essential functionalities vital for interacting with web servers. From fetching paginated records to pinpointing specific data, and from determining server statuses to manipulating records, we learned a comprehensive array of HTTP methods. Understanding these capabilities equips us with the tools needed to navigate and interact with web resources efficiently and effectively. With this knowledge, our applications can communicate seamlessly with web servers, ensuring smooth data exchanges and seamless user experiences.
