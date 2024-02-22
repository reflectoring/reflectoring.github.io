---
authors: [sagaofsilence]
title: "Create a `HTTP` Client with Apache `HTTP` Client"
categories: ["Java"]
date: 2024-02-11 00:00:00 +1100
excerpt: "Get familiar with the Apache `HTTP` Client."
image: images/stock/0063-interface-1200x628-branded.jpg
url: create-a-http-client-wth-apache-http-client
---

In this article we're diving deep into the world of Apache `HTTP` client APIs. We are going to explore the different ways Apache `HTTP` client enable developers to send and receive data over the internet. From simple GET requests to complex multipart POSTs, we'll cover it all with real-world examples. So get ready to master the art of web communication with Apache `HTTP` client! 

## Why Should We Care About `HTTP` Client?
Have you ever wondered how your favorite apps seamlessly fetch data from the internet or communicate with servers behind the scenes? That's where `HTTP` clients come into play – they're the silent heroes of web communication, doing the heavy lifting so you don't have to.

Imagine you're using a weather app to check the forecast for the day. Behind the scenes, the app sends an `HTTP` request to a weather service's server, asking for the latest weather data. The server processes the request, gathers the relevant information, and sends back an `HTTP` response with the forecast. All of this happens in the blink of an eye, thanks to the magic of `HTTP` clients.

HTTP clients are like digital messengers, facilitating communication between client software and web servers across the internet. They handle all the nitty-gritty details of making connection to server, sending `HTTP` requests and processing responses, so you can focus on building great software without getting bogged down in the complexities of web communication.

So why should you care about `HTTP` clients? Well, imagine if every time you wanted to fetch data from a web server or interact with a web service, you had to manually craft and send `HTTP` requests, then parse and handle the responses – it would be a nightmare! `HTTP` clients automate all of that for you, making it easy to send and receive data over the web with just a few lines of code.

Whether you're building a mobile app, a web service, or anything in between, `HTTP` clients are essential tools for interacting with the vast digital landscape of the internet. So the next time you're building software that needs to communicate over the web, remember to tip your hat to the humble `HTTP` client – they're the unsung heroes of web development!

{{% info title="Examples of `HTTP` Clients" %}}

There are many Java `HTTP` clients available. Check this article on [Comparison of Java `HTTP` Clients](https://reflectoring.io/comparison-of-java-http-clients/) for more details.

{{% /info %}}

## Brief Overview of Apache `HTTP` Client
Apache HttpClient is a powerful Java library that excels at sending `HTTP` requests and handling `HTTP` responses. It has gained popularity due to its open-source nature and its rich set of features that align with the latest `HTTP` standards.

One of the key strengths of Apache HttpClient is its support for various authentication mechanisms, allowing developers to easily integrate secure authentication into their applications. Additionally, the library offers connection pooling, which can greatly enhance performance by reusing existing connections instead of establishing new ones.

Another notable feature of Apache HttpClient is its ability to intercept requests and responses. This enables developers to modify or inspect the data being sent or received, providing flexibility and control over the communication process.

Furthermore, Apache HttpClient offers seamless integration with other Apache libraries, making it a versatile tool for Java developers. It also provides robust support for the fundamental `HTTP` methods, ensuring compatibility with a wide range of web services.

## Why Should We Use Apache `HTTP` Client for `HTTP` Requests?
Apache HttpClient is often preferred over other Java `HTTP` clients for several reasons:

1. **Robustness and Stability**: Apache HttpClient has a long history of development and has been thoroughly tested in various environments. It's known for its stability and reliability, making it a trusted choice for mission-critical applications.

2. **Feature-rich**: Apache HttpClient offers a comprehensive set of features for handling `HTTP` requests and responses. It supports various `HTTP` methods, authentication mechanisms, connection pooling, request and response interception, and much more.

3. **Flexibility**: Apache HttpClient provides a flexible and extensible architecture that allows developers to customize and extend its functionality as needed. It supports pluggable components such as connection managers, request interceptors, response interceptors, and authentication schemes.

4. **Community Support**: Being part of the Apache Software Foundation, Apache HttpClient benefits from a vibrant and active community of developers and users. This community provides support, documentation, and ongoing development, ensuring that the library stays up-to-date and relevant.

5. **Backward Compatibility**: Apache HttpClient maintains backward compatibility with older versions, ensuring that existing applications can upgrade to newer versions without major code changes. This stability is crucial for long-term maintenance and support of applications.

Overall, Apache HttpClient is a mature and reliable `HTTP` client library that offers a rich set of features, flexibility, and community support, making it a top choice for Java developers.

{{% github "https://github.com/thombergs/code-examples/tree/master/create-a-http-client-wth-apache-http-client" %}}

<p>

`HttpClient` is a HTTP/1.1 compliant `HTTP` agent implementation based on HttpCore. It also provides reusable components for client-side authentication, `HTTP` state management, and `HTTP` connection management.

Let us know learn how to use Apache `HTTP` client for web communication. We have grouped the examples under following categories of APIs: classic, async and reactive.

## HttpClient (Classic APIs)
In this section of examples we are going to learn how to use `HttpClient` for sending requests and consuming responses in synchronous mode. The client code will wait until it receives response from the server.

{{% info title="HTTP and CRUD Operations" %}}
CRUD operations refer to Create, Read, Update, and Delete actions performed on data. In the context of HTTP endpoints for a `/users` resource:
1. **Create**: Use HTTP POST to add a new user. Example URL: `POST /users`
2. **Read**: Use HTTP GET to retrieve user data. Example URL: `GET /users/{userId}` for a specific user or `GET /users?page=1` for a list of users with pagination.
3. **Update**: Use HTTP PUT or PATCH to modify user data. Example URL: `PUT /users/{userId}`
4. **Delete**: Use HTTP DELETE to remove a user. Example URL: `DELETE /users/{userId}`
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
Pagination in HTTP request processing involves dividing large sets of data into smaller, manageable pages. Clients specify the page they want using parameters like `page=1`. The server processes the request, retrieves the relevant page of data, and returns it to the client, enabling efficient data retrieval and presentation. Advantages of pagination include improved performance, reduced server load, enhanced user experience, and efficient handling of large datasets.
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

If any exceptions occur during the execution of the HTTP request, they are caught, and a `RequestProcessingException` is thrown with an appropriate error message. Finally, the responseBody, containing the response from the server, is returned to the caller.

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
      Assertions.fail("Failed to execute `HTTP` request.", e);
    }
  }
}
```
Test class `UserSimpleHttpRequestHelperTests` responsible for testing the functionality of various user requests executed on a remote server using the `UserSimpleHttpRequestHelper` class.

The test method `executeGetPaginatedRequest()`, annotated with `@Test`, we attempt to execute an `HTTP` `GET` request to retrieve get the first page of paginated users.

First, we prepare the request parameters by creating a `Map<String, String>` named params containing a single entry with the key "page" and value "1". This indicates that we want to retrieve users from the first page.

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

In this example, the `getUser()` method retrieves a user by its id. As we have leanred in `getAllUsers()` code example, in this case also, we create a `HttpGet` request object, a `HttpHost` object  and response handler. Then we call `execute()` method on the client. Then we obtain the response in string form.

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
We use `HTTP` `PUT` to upate an existing user. We need to provide details needed to upate the user.

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
        String responseBody = httpClient.execute(httpHost, httpPutRequest, handler	);

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

The example demonstrates how to implement an `HTTP` `DELETE` request to delete an existing user. Inside a try-with-resources block, the method first creates an instance of `CloseableHttpClient` using HttpClient's `createDefault()`. It then constructs the `URI` for the delete request by appending the `userId` to the base URI "/api/users/". Subsequently, it creates an `HttpDelete` object with the constructed `URI`. The method executes the HTTP DELETE request using `HttpClient` `execute()`, passing the `HttpDelete` request and a response handler. Finally, it captures the `null` response from the server, though the responseBody variable is not utilized further in this snippet. Finally it handles exceptions if any.

Now let us see how to call this functionality.

```java
@Test
void executeDeleteRequest() {
  try {
    // prepare
    final int userId = 2;

    // execute
    userHttpRequestHelper.deleteUser(userId);
  } catch (Exception e) {
    Assertions.fail("Failed to execute HTTP request.", e);
  }
}
```

The provided test aims to verify the functionality of the `deleteUser()` method in the `UserSimpleHttpRequestHelper` class, which is responsible for deleting a user record via an `HTTP` `DELETE` request. Inside a try-catch block, the test prepares by specifying the userId of the user to be deleted, in this case, `userId = 2`. It then executes the `deleteUser()` method, passing the `userId` as an argument. If any exceptions occur during the execution of the `deleteUser()` method, they are caught, and the test fails with an appropriate error message indicating the failure to execute the HTTP request.