---
title: API-First
categories: [spring-boot]
date: 2020-02-11 05:00:00 +1100
modified: 2020-02-11 05:00:00 +1100
excerpt: "APIs have been around quite a long time, but in the last years the concept of ""API-First"" seems to gain a lot of popularity. But, what is the ""API-First"" Approach? Simply put, it means to make our APIs first-class citizens in our project life-cycle."
image:
  auto: 0056-colors
tags: ["api-first-approach", "swagger"]
---

An API-First Approach involves developing APIs, which are reusable, consistent and understandable from any member of the team. Via API description languages, teams can collaborate without going over the implementation.

{% include github-project.html url="{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-openapi" %}" %}

## Benefits of API-First Approach

To start working on an integration between components or systems, a team needs a contract. In our case, the contract is the API. API-First helps different teams communicate with each other, without implementing a thing. **It also enables teams to work in parallel.**

Where the API-First Approach shines is on building a **better API**. Focusing on the functionality that it is needed to provide and only that. Minimalistic API means also less code to maintain.

## Tools 

To create our specification, we will be using the OpenAPI specification. 

Quoting the [Swagger website](https://swagger.io/docs/specification/about/), the OpenAPI spec is:

> an API description format for REST APIs. An OpenAPI file allows you to describe your entire API, including:
>
> * Available endpoints (/users) and operations on each endpoint (GET /users, POST /users)
> * Operation parameters Input and output for each operation
> * Authentication methods
> * Contact information, license, terms of use and other information.

When using OpenAPI, we can use JSON or YAML to write an API specification. Luckily, the community provides tools to make it easier to build such a specification. These tools include:

* [Swagger Editor](http://editor.swagger.io/), the official tool from Swagger.
* [Swagger Viewer](https://marketplace.visualstudio.com/items?itemName=Arjun.swagger-viewer), which is a VSCode plugin.
* [OpenAPI (Swagger) Editor](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi), which adds rich support (IntelliSense, linting, schema enforcement, etc...) for OpenAPI development.
* [openapi-lint](https://marketplace.visualstudio.com/items?itemName=mermade.openapi-lint), a linter for OpenAPI.

In this tutorial, we'll be using VSCode, therefore I have installed [OpenAPI (Swagger) Editor](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi).

## Creating an API Spec with the Swagger Editor

Let's create our own OpenAPI specification in a YAML document. To make it easier to follow, we'll split the discussion into separate parts of the YAML document we're creating.

If you want to learn more details about the OpenAPI-Specification you can visit the [Github repository](https://github.com/OAI/OpenAPI-Specification/blob/master/vtersions/3.0.2.md#versions).


### General Information

We start off with some general information about our API at the top of our document:

```yaml
openapi: 3.0.2
info:
  title: Reflectoring
  description: "Tutorials on Spring Boot and Java, thoughts about the Software Craft, and relevant book reviews. Because it's just as important to understand the Why as it is to understand the How. Have fun!"
  termsOfService: http://swagger.io/terms/
  contact:
    email: petros.stergioulas94@gmail.com
  license:
    name: Apache 2.0
    url: http://www.apache.org/licenses/LICENSE-2.0.html
  version: 0.0.1-SNAPSHOT
externalDocs:
  description: Find out more about Reflectoring
  url: https://reflectoring.io/about/
servers:
- url: https://reflectoring.swagger.io/v2
```

The [`openapi`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#openapi-object) field allows us to define the version of the OpenAPI spec that our document follows.

Within the [`info`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#infoObject) section, we add some information about our API. The fields should be pretty self-explanatory.

Finally, in the [`servers`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#serverObject) section, we provide a list of servers that implement the API.

### Tags

Then comes some additional metadata about our API.

```yaml
tags:
- name: user
  description: Operations about user
  externalDocs:
    description: Find out more about our store
    url: http://swagger.io
```

* The [`tags`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#fixed-fields) section, provide additional metadata, which can be used to make our API more readable and easier to follow. Each tag should be unique.

### Paths

Here we will describe some paths, to make it clean how we can create our own. But, what are paths? Relative paths holds the information  to the individual endpoints and their operations.

```yaml
paths:
  /user:
    post:
      tags:
      - user
      summary: Create user
      description: Create user functionality
      operationId: createUser
      requestBody:
        description: Created user object
        content:
          '*/*':
            schema:
              $ref: '#/components/schemas/User'
        required: true
      responses:
        default:
          description: successful operation
          content: {}
      x-codegen-request-body-name: body
  /user/{username}:
    get:
      tags:
      - user
      summary: Get user by user name
      operationId: getUserByName
      parameters:
      - name: username
        in: path
        description: 'The name that needs to be fetched. Use user1 for testing. '
        required: true
        schema:
          type: string
      responses:
        200:
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        404:
          description: User not found
          content: {}
```

* First the [`ref`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#fixed-fields-7) field, allows us to refer own defined Schema. In this case the User schema.
* Then the `summary`, which is optional and is intended to apply to all operations in this path.
* Next is the [`operationId`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#fixed-fields-8), which is a unique string and is used to identify the operation. Think about it as our method name.
* Last the [`responses`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#responsesObject) object.It must define at least one successful response code for an operation call. 

### Components

The objects of the API are all described here. The objects defined within the components object will have no effect on the API unless they are explicitly referenced from properties outside the components object.

```yaml
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          format: int64
        username:
          type: string
        firstName:
          type: string
        lastName:
          type: string
        email:
          type: string
        password:
          type: string
        phone:
          type: string
        userStatus:
          type: integer
          description: User Status
          format: int32
  securitySchemes:
    reflectoring_auth:
      type: oauth2
      flows:
        implicit:
          authorizationUrl: http://reflectoring.swagger.io/oauth/dialog
          scopes:
            write:users: modify users
            read:users: read users
    api_key:
      type: apiKey
      name: api_key
      in: header
```

* First the [`schemas`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schema-object) field, allows the definition of our DTOs.
* And last the [`securitySchemes`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#security-scheme-object), and it defines a security scheme that can be used by the operations.

## Generating Code From an API Specification

Having defined an API, we'll now create code from the YAML document above. 

We'll take a look at two different approaches to generating the code:

1. Using [Swagger Editor](http://editor.swagger.io/) to generate code manually, and
2. Using the [OpenAPI Maven plugin](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin) to generate code from a Maven build.

### Generating Code from Swagger Editor

Although that's an approach which I wouldn't take, I must introduce it. 

So, let's go over to [Swagger Editor](http://editor.swagger.io/) and paste our `<specification>.yml` into it. Then, we select *Generate Server* from the menu and pick what kind of a server we'd would like to generate (I went with Spring).

As I said before, I wouldn't use this approach. But why?

First, the code that was generated for me is using Java 7 and Spring Boot 1.5.22.RELEASE, both of which are quite old now. 

Second, if we make a change to the specification (and changes happen all the time), we'd have to copy-and-paste the files that were changed. 

 ### Generating Code with the OpenAPI Maven plugin
 
 A better alternative is to generate the code from within a Maven build with the [OpenAPI Maven plugin](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin). 
 
  Let's take a look at the folder structure. I chose to use a multi-module maven project, where we have two projects:
 
 1. `app`, an application that implements the API from our specification.
 2. `specification`, whose only job is to provide the API Specification for our app.  
 
 The folder structure looks like this:
 
```text
spring-boot-openapi
├── app
│   └── pom.xml
│   └── src
│       └── main
│           └── java
│               └── io.reflectoring
│                   └── OpenAPIConsumerApp.java
├── specification
│   └── pom.xml
│   └── src
│       └── resources
│           └── openapi.yml
├── pom.xml
```

For the shake of simplicity, we omit the test folders.

Our `app` is a simple Spring Boot project that we can automatically generate on [start.spring.io](https://start.spring.io), so let's focus on the `pom.xml` from the `specification` module, where we configure 
the [OpenAPI Maven plugin](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin):

```xml
<plugin>
    <groupId>org.openapitools</groupId>
    <artifactId>openapi-generator-maven-plugin</artifactId>
    <version>4.2.3</version>
    <executions>
        <execution>
            <goals>
                <goal>generate</goal>
            </goals>
            <configuration>
                <inputSpec>${project.basedir}/src/main/resources/openapi.yml</inputSpec>
                <generatorName>spring</generatorName>
                <apiPackage>io.reflectoring.api</apiPackage>
                <modelPackage>io.reflectoring.model</modelPackage>
                <supportingFilesToGenerate>ApiUtil.java</supportingFilesToGenerate>
                <configOptions>
                    <delegatePattern>true</delegatePattern>
                </configOptions>
            </configuration>
        </execution>
    </executions>
</plugin>
```

You can see the full `pom.xml` file [on GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-openapi/specification/pom.xml).

For this tutorial, we'll use the `spring` generator. The [OpenAPI Maven plugin](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin) comes with a lot of options. To see the full set of options you can go over to the [official site](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin) of the plugin. 

Simply running the command `mvnw install` will generate code that implements our OpenAPI specification!

If you take a quick look under `target/generated-sources/openapi/src/main/java/io/reflectoring/model`, you will find the User model defined in `openapi.yml`!

```java
@javax.annotation.Generated(value = "org.openapitools.codegen.languages.SpringCodegen", date = "2020-02-07T19:50:29.578+01:00[Europe/Berlin]")

public class User   {
  @JsonProperty("id")
  private Long id;

  @JsonProperty("username")
  private String username;

  @JsonProperty("firstName")
  private String firstName;

  @JsonProperty("lastName")
  private String lastName;

  @JsonProperty("email")
  private String email;

  @JsonProperty("password")
  private String password;

  @JsonProperty("phone")
  private String phone;

  @JsonProperty("userStatus")
  private Integer userStatus;
}
// omit getters and setters
```

Now let's implement the `UserApi`, which comes from our generated specification.

```java
@RestController
public class UserController implements UserApi {
}
```

If we test our API without having implemented a method of `UserApi`, we'll get a 501 response (Not Implemented). Why?

```shell script
curl -I http://localhost:8080/user/Petros
HTTP/1.1 501
Content-Length: 0
```

Because in UserApi says so:

```java
default ResponseEntity<User> getUserByName(String username) {
    getRequest().ifPresent(request -> {
        for (MediaType mediaType: MediaType.parseMediaTypes(request.getHeader("Accept"))) {
            if (mediaType.isCompatibleWith(MediaType.valueOf("application/json"))) {
                String exampleString = "{ \"firstName\" : \"firstName\", \"lastName\" : \"lastName\", \"password\" : \"password\", \"userStatus\" : 6, \"phone\" : \"phone\", \"id\" : 0, \"email\" : \"email\", \"username\" : \"username\" }";
                ApiUtil.setExampleResponse(request, "application/json", exampleString);
                break;
            }
        }
    });
    return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);

}
```

Let's now just implement our actual GET method:

```java
@Override
public ResponseEntity<User> getUserByName(String username) {
    User user = new User();

    user.setId(123L);
    user.setFirstName("Petros");
    user.setLastName("S");
    user.setUsername("Petros");
    user.setEmail("petors.stergioulas94@gmail.com");
    user.setPassword("secret");
    user.setPhone("+123 4567890");
    user.setUserStatus(0);

    return ResponseEntity.ok(user);
}
```
Running now: `curl http://localhost:8080/user/Petros`

You will receive a valid response!

```json
{
  "id": 123,
  "username": "Petros",
  "firstName": "Petros",
  "lastName": "S",
  "email": "petors.stergioulas94@gmail.com",
  "password": "secret",
  "phone": "+123 4567890",
  "userStatus": 0
}
```

In my opinion, generating the OpenAPI Specification with Maven plugin instead of Swagger Editor is a better choice. 
That's because you both have more control over your options and you can safely track any changes.

## Conclusion

The API-First Approach is easy to use, but it's difficult to master. 

To be able to do it right, we should know **what** we have to build. Working in an agile environment might it make it more difficult, while things are changing faster.

As always, communication accross teams is a must. A product was never built without a proper communication.