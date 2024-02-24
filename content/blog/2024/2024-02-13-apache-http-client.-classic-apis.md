---
authors: [sagaofsilence]
title: "Create a HTTP Client with Apache HTTP Client"
categories: ["Java"]
date: 2024-02-11 00:00:00 +1100
excerpt: "Classic APIs Offered by Apache HTTP Client."
image: images/stock/0063-interface-1200x628-branded.jpg
url: apache-http-client-classic-apis
---

In this article we are going to learn about classic APIs offered by Apache `HTTP` client APIs. We are going to explore the different ways Apache `HTTP` client enable developers to send and receive data over the internet in classic (synchronous) mode. From simple GET requests to complex multipart POSTs, we'll cover it all with real-world examples. So get ready to master the art of web communication with Apache `HTTP` client! 

## The "Create a HTTP Client with Apache HTTP Client" Series

This article is the second part of a series:

1. [Introduction to Apache HTTP Client](/create-a-http-client-wth-apache-http-client/)
2. [Apache HTTP Client Configuration](/apache-http-client-config/)
3. [Classic APIs Offered by Apache HTTP Client](/apache-http-client-classic-apis/)
4. [Async APIs Offered by Apache HTTP Client](/apache-http-client-async-apis/)
5. [Reactive APIs Offered by Apache HTTP Client](/apache-http-client-reactive-apis/)

{{% github "https://github.com/thombergs/code-examples/tree/master/create-a-http-client-wth-apache-http-client" %}}

Let us know learn how to use Apache `HTTP` client for web communication. We have grouped the examples under following categories of APIs: classic, async and reactive.

{{% info title="Reqres Fake Data CRUD API" %}}

We are going to use https://reqres.in server to test different `HTTP` methods. The reqres API is a free online API that can be used for testing and prototyping. It provides a variety of endpoints that can be used to test different `HTTP` methods. The reqres API is a good choice
 for testing CORS because it supports all of the `HTTP` methods that are allowed by CORS.

{{% /info %}}

## HttpClient (Classic APIs)
In this section of examples we are going to learn how to use `HttpClient` for sending requests and consuming responses in synchronous mode. The client code will wait until it receives response from the server.

{{% info title="HTTP and CRUD Operations" %}}
CRUD operations refer to Create, Read, Update, and Delete actions performed on data. In the context of `HTTP` endpoints for a `/users` resource:
1. **Create**: Use `HTTP` POST to add a new user. Example URL: `POST /users`
2. **Read**: Use `HTTP` GET to retrieve user data. Example URL: `GET /users/{userId}` for a specific user or `GET /users?page=1` for a list of users with pagination.
3. **Update**: Use `HTTP` PUT or PATCH to modify user data. Example URL: `PUT /users/{userId}`
4. **Delete**: Use `HTTP` DELETE to remove a user. Example URL: `DELETE /users/{userId}`
{{% /info %}}

\
Now let us learn processing `HTTP` responses using a response handler.

The motivation behind using a response handler in Apache `HTTP` client is to provide a structured and reusable way to process `HTTP` responses. 

Response handlers encapsulate the logic for extracting data from `HTTP` responses, allowing developers to define how to handle different types of responses in a modular and consistent manner. 

By using response handlers, developers can centralize error handling, data extraction, and resource cleanup, resulting in cleaner and more maintainable code. 

Additionally, response handlers promote code reusability, as the same handler can be used across multiple `HTTP` requests with similar response processing requirements. 

Overall, response handlers enhance the flexibility, readability, and maintainability of code that interacts with `HTTP` responses using Apache `HTTP` client.

### Executing `HTTP` `GET` Request to Get Paginated Records
We use `HTTP` `GET` request to retrieve a single record as well as records in bulk. We use pagination strategy to handle such bulk requests.

{{% info title="Pagination and Its Advantages" %}}
Pagination in `HTTP` request processing involves dividing large sets of data into smaller, manageable pages. Clients specify the page they want using parameters like `page=1`. The server processes the request, retrieves the relevant page of data, and returns it to the client, enabling efficient data retrieval and presentation. Advantages of pagination include improved performance, reduced server load, enhanced user experience, and efficient handling of large datasets.
{{% /info %}}

\
Let us now see how to execute a paginated `HTTP` `GET` request using a response handler:

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

The code defines a class named `UserSimpleHttpRequestHelper`, which extends the `BaseHttpRequestHelper` class and is responsible for handling `HTTP` requests related to user data. The `getPaginatedUsers()` method within this class is used to retrieve a list of users from an external API, specified by the request parameters map. 

Inside a try-with-resources block, a `CloseableHttpClient` is created using HttpClient's `createDefault()` to manage `HTTP` connections efficiently. The `requestParameters` map is processed to convert its entries into a list of `NameValuePairs`, which are used to construct the parameters for the `HTTP` `GET` request.

A `HttpGet` instance, representing the `GET` request, is created using the URIBuilder class to construct the request `URI` with the specified parameters. 

A `BasicHttpClientResponseHandler` is created to handle the `HTTP` response from the server. The HttpClient's `execute()` method is then invoked to execute the `GET` request, passing the `HttpHost`, `HttpGet`, and `handler` as arguments. The response body returned by the server is stored in the responseBody variable.

If any exceptions occur during the execution of the `HTTP` request, they are caught, and a `RequestProcessingException` is thrown with an appropriate error message. Finally, the responseBody, containing the response from the server, is returned to the caller.

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
Test class `UserSimpleHttpRequestHelperTests` responsible for testing the functionality of various user requests executed on a remote server using the `UserSimpleHttpRequestHelper` class.

The test method `executeGetPaginatedRequest()`, annotated with `@Test`, we attempt to execute an `HTTP` `GET` request to retrieve get the first page of paginated users.

First, we prepare the request parameters by creating a `Map<String, String>` named `params` containing a single entry with the key "page" and value "1". This indicates that we want to retrieve users from the first page.

Next, we invoke the `getPaginatedUsers()` method of the `UserSimpleHttpRequestHelper` instance, passing the prepared request parameters. This method executes the `HTTP` request and returns the response body as a string.

We then use assertions from the JUnit and AssertJ libraries to verify that the response body is not empty, indicating that users were successfully retrieved.

Any exceptions that occur during the execution of the test are caught, and the test fails with a descriptive message indicating the failure to execute the `HTTP` request if an exception occurs.

### Executing `HTTP` `GET` Request to Get Specific Record

Let us now see how to execute `HTTP` `GET` request to get a specific user record using a response handler:

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
      BasicHttpClientResponseHandler handler 
    = new BasicHttpClientResponseHandler();
      String responseBody 
    = httpClient.execute(httpHost, httpGetRequest, handler);

      return responseBody;
    } catch (Exception e) {
      throw new RequestProcessingException(
          MessageFormat.format("Failed to get user for ID: {0}", userId), e);
    }
  }
}

```

In this example, the `getUser()` method retrieves a user by its id. As we have learned in `getAllUsers()` code example, in this case also, we create a `HttpGet` request object, a `HttpHost` object  and response handler. Then we call `execute()` method on the client. Then we obtain the response in string form.

Now let us see how to call this functionality.

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
In this example, the we call `getUser()` method to get user with specific id and then check its response.

### Executing `HTTP` `HEAD` Request to Get Status of a Record
The `HEAD` method in `HTTP` can request information about a document without retrieving the document itself. It is similar to `GET` but it does not receive the response body. It's used for caching, resource existence, modification checks, and link validation. Faster than `GET`, it saves bandwidth by omitting response data, making it ideal for resource checks and link validation, optimizing network efficiency.

Let us now see how to execute `HTTP` `HEAD` request to get status of a specific user record using a response handler:

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

In this example we retrieve the status code of a user's `HTTP` request without fetching the response body. It sends a `HEAD` request to the specified user endpoint and retrieves the status code from the response. The status code indicates the success or failure of the request. Finally, it logs the obtained status code and returns it. If an error occurs during the process, it throws a `RequestProcessingException` with an appropriate message.

Now let us see how to call this functionality.

```java
/** Execute get specific request. */
@Test
void executeUserStatus() {
  try {
    // prepare
    final long userId = 2L;

    // execute
    final Integer userStatus = userHttpRequestHelper.getUserStatus(userId);

    // verify
    assertThat(userStatus).isEqualTo(HttpStatus.SC_OK);
  } catch (Exception e) {
    Assertions.fail("Failed to execute HTTP request.", e);
  }
}

```
This test method verifies the status returned by the HEAD method for a user. First, it prepares the user ID to be used in the request. Then, it executes the `getUserStatus()` method from the `UserSimpleHttpRequestHelper` class to fetch the status code for the specified user ID. Finally, it verifies that the obtained user status is equal to `HttpStatus.SC_OK` (200), indicating a successful request. If an exception occurs during the execution, it fails the test with an appropriate error message.

### Executing `HTTP` `POST` Request to Create a New Record
We use `HTTP` `POST` to create a new user. We need to provide details needed to create a new user.

Let us see how to do it:

```java
public String createUser(String firstName, 
                         String lastName, 
             String email, 
             String avatar) throws RequestProcessingException {
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
    }
  catch (Exception e) {
    throw new RequestProcessingException("Failed to create user.", e);
  }
}

```
The example illustrates a method for creating a new user by sending an `HTTP` `POST` request to the specified endpoint. Inside a try-with-resources block, it initializes a `CloseableHttpClient` to manage the `HTTP` connection. The method constructs a list of form parameters containing the user's details such as first name, last name, email, and avatar. These parameters are then encoded into a URL-encoded form entity using the `UrlEncodedFormEntity` class. Subsequently, an `HTTP` `POST` request is created with the constructed entity and executed using the `execute()` method of the `CloseableHttpClient` instance. The response body containing the created user's data is retrieved and returned as a `String`. Any exceptions encountered during the process are caught and rethrown as a `RequestProcessingException` to handle the failure scenario gracefully.

Now let us see how to call this functionality.

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

The unit test verifies the functionality of the `createUser()` method in the `UserSimpleHttpRequestHelper` class. Inside a try-catch block, the method calls the `createUser()` method with dummy user details (first name, last name, email, and avatar). The response represents the created user's data. Using assertions, the test verifies that the `createdUser` variable is not empty, indicating a successful creation of the user. If any exceptions occur during the execution of the test, they are caught and reported as a failure using the `fail()` method.

### Executing `HTTP` `PUT` Request to Update an Existing Record
We use `HTTP` `PUT` to update an existing user. We need to provide details needed to update the user.

Let us see how to do it:

```java
public String updateUser(long userId,
                         String firstName,
                         String lastName,
                         String email,
                         String avatar)
      throws RequestProcessingException {
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

The example above shows how to update a user's information via an `HTTP` `PUT` request. Inside a try-with-resources block, a `CloseableHttpClient` instance is created using HttpClient's `createDefault()` to manage `HTTP` connections. The method constructs the update request by creating a list of `NameValuePair` objects containing the user's updated details (first name, last name, email, and avatar). These parameters are then encoded into a `UrlEncodedFormEntity`. Using the `HTTP` `PUT` method, the request is sent to the specified user's endpoint (/api/users/{userId}). The response body from the server, indicating the success or failure of the update operation, is captured and returned as a string. Finally, it handles an exception if any.


Now let us see how to call this functionality.

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

The example is a test method designed to execute an `HTTP` `PUT` request to update a user's information. Inside a try-catch block, the method first prepares the necessary parameters for the update operation, including the user's ID and the updated details (first name, last name, email, and avatar). It then invokes the `updateUser()` method of the `userHttpRequestHelper` object, passing these parameters. The method captures the response from the server, indicating the success or failure of the update operation, and asserts that the response body is not empty to verify the update's success. If any exceptions occur during the execution of the method, they are caught, and the test fails with an appropriate error message.

### Executing `HTTP` `PATCH` Request to Partially Update an Existing Record
We use `HTTP` `PATCH` to update an existing user in a partial way. We need to provide details needed to update the user.

Let us see how to do it:

```java
public String patchUser(long userId,
                        String firstName,
                        String lastName)
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

The example above shows how to update a user's information via an `HTTP` `PATCH` request. Inside a try-with-resources block, a `CloseableHttpClient` instance is created using HttpClient's `createDefault()` to manage `HTTP` connections. The method constructs the patch request by creating a list of `NameValuePair` objects containing few of the user's updated details (first name and last name). These parameters are then encoded into a `UrlEncodedFormEntity`. Using the `HTTP` `PATCH` method, the request is sent to the specified user's endpoint (/api/users/{userId}). The response body from the server, indicating the success or failure of the update operation, is captured and returned as a string. Finally, it handles an exception if any.


Now let us see how to call this functionality.

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

The example is a test method designed to execute an `HTTP` `PATCH` request to partially update a user's information. Inside a try-catch block, the method first prepares the necessary parameters for the update operation, including the user's ID and few of the users details (first name and last name). It then invokes the `patchUser()` method of the `userHttpRequestHelper` object, passing these parameters. The method captures the response from the server, indicating the success or failure of the update operation, and asserts that the response body is not empty to verify the patch's success. If any exceptions occur during the execution of the method, they are caught, and the test fails with an appropriate error message.

### Executing `HTTP` `DELETE` Request to Delete an Existing Record
We use `HTTP` `DELETE` to delete an existing user. We need to user id to delete the user.

Let us see how to do it:

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

The example demonstrates how to implement an `HTTP` `DELETE` request to delete an existing user. Inside a try-with-resources block, the method first creates an instance of `CloseableHttpClient` using HttpClient's `createDefault()`. It then constructs the `URI` for the delete request by appending the `userId` to the base URI "/api/users/". Subsequently, it creates an `HttpDelete` object with the constructed `URI`. The method executes the `HTTP` DELETE request using `HttpClient` `execute()`, passing the `HttpDelete` request and a response handler. Finally, it captures the `null` response from the server, though the responseBody variable is not utilized further in this snippet. Finally it handles exceptions if any.

Now let us see how to call this functionality.

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

The provided test aims to verify the functionality of the `deleteUser()` method in the `UserSimpleHttpRequestHelper` class, which is responsible for deleting a user record via an `HTTP` `DELETE` request. Inside a try-catch block, the test prepares by specifying the userId of the user to be deleted, in this case, `userId = 2`. It then executes the `deleteUser()` method, passing the `userId` as an argument. If any exceptions occur during the execution of the `deleteUser()` method, they are caught, and the test fails with an appropriate error message indicating the failure to execute the `HTTP` request.

### Executing `HTTP` `OPTIONS` Request to Find out Request Methods Allowed by Server
The `HTTP` `OPTION` method is a type of `HTTP` call that explains what are the options for a target resource such as API endpoint. We use 'HTTP' `OPTION` to find out `HTTP` methods supported by the server `https://reqres.in`.

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

The response headers will include the necessary information. The `Allow` or `access-control-allow-methods` header indicates the `HTTP` methods supported for the requested resource.

{{% info title="HTTP `OPTIONS` facts" %}}

The `OPTION` method is used to make a preflightrequest to the server. A preflight request is a request that is sent to the server to determine if the actual request is allowed. The server will respond to the preflight request with a list of the `HTTP` methods that are allowed. The browser will then send the actual request if the requested method is in the list. The server also includes a message that indicates the allowed origin, methods, and headers.

The `Access-Control-Allow-Methods` header is required for cross-origin resource sharing (`CORS`). `CORS` is a security mechanism that prevents websites from accessing resources from other domains.

The `Access-Control-Allow-Methods` header tells the browser which `HTTP` methods are allowed when accessing the resource.

{{% /info %}}
\
Now lt us learn how to execute options method using `HTTP` client.

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
In this example, inside a try-with-resources block, a `CloseableHttpClient` is created using HttpClient's `createDefault()` to manage `HTTP` connections efficiently. 

A `HttpOptions` instance, representing the `OPTIONS` request, is created using the `URIBuilder` class to construct the request `URI`. 

A lambda expression is used to define a response handler for processing the `HTTP` response. The handler extracts the headers from the response and converts them into a `Map<String, String>` where the header name serves as the `key` and the header value serves as the `value`.

The HttpClient's `execute()` method is then invoked to execute the `OPTIONS` request. The response from the server is processed by the handler, and the resulting map of headers is returned to the caller.

If any exceptions occur during the execution of the `HTTP` request, they are caught, and a `RequestProcessingException` is thrown with an appropriate error message.

Now let us see how to call this functionality.

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
The provided test is designed to verify the headers returned by an `HTTP` `OPTIONS` request, specifically focusing on the presence of the `Allow` or `Access-Control-Allow-Methods` header. 

Within a try-catch block, the `executeOptions()` method of the `userHttpRequestHelper` is invoked to perform the `OPTIONS` request and retrieve the headers from the server. 

Using `assertThat()` it verifies that the keys of the 'headers' map contain at least one of the expected headers ('Allow' or 'Access-Control-Allow-Methods'). 

If the expected headers are not found in the response, an assertion failure occurs with an appropriate error message. 

Any exceptions that may occur during the execution of the HTTP request are caught, and the test fails with an error message indicating the failure to execute the request.

### Executing `HTTP` `TRACE` Request to Perform Diagnosis

The `HTTP` `TRACE` method performs a message loop-back test along the path to the target resource, providing a useful debugging mechanism. However, it is advised not to use this method as it can open the gates to the intruders.


{{% danger title="The Vulnerability of TRACE" %}}
As warned by OWASP in the documentation on [Test HTTP Methods](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/06-Test_HTTP_Methods) the `TRACE` method, or `TRACK` in Microsoft's systems, makes the server repeat what it receives in a request. This caused a problem known as `Cross-Site Tracing (XST)` in 2003, allowing access to cookies marked with the `HttpOnly` flag. Browsers and plugins have blocked `TRACE` for years, so this problem is no longer a risk. However, if a server still allows `TRACE`, it might indicate security weaknesses.
{{% /danger %}}

## Conclusion
In this article we got familiar with the classic APIs of Apache HTTP client, we explored a multitude of essential functionalities vital for interacting with web servers. From fetching paginated records to pinpointing specific data, and from determining server statuses to manipulating records, we learned a comprehensive array of HTTP methods. Understanding these capabilities equips us with the tools needed to navigate and interact with web resources efficiently and effectively. With this knowledge, our applications can communicate seamlessly with web servers, ensuring smooth data exchanges and seamless user experiences.
