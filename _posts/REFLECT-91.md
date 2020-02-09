# API-First

APIs have been around quite a long time, but the last years the concept of "API-First" seems to gain a lot of popularity. 
But, what is the "API-First" approach? Simply to say, when following the methodology our APIs are being first-class citizens in our project life-cycle.

# Benefits of API-First

* Teams can work in parallel
  * A team to start working needs a contract. In our case, the contract is the API. API-First helps different teams communicate with each other, without implementing a thing.
* Better API Design
  * Starting a task, with first implementing the API, you may realize, that it's something is missing or better, that this API is not needed.
* Documented-First API
  * The specification of the API, is not only the contract between teams and developers but also documentation that is available to every developer.

# Tools 

To create our specification, we will be using the OpenAPI specification. 

Quoting [swagger.io][swagger-spec] the OpenAPI spec is:

> an API description format for REST APIs. An OpenAPI file allows you to describe your entire API, including:
>
> * Available endpoints (/users) and operations on each endpoint (GET /users, POST /users)
> * Operation parameters Input and output for each operation
> * Authentication methods
> * Contact information, license, terms of use and other information.

When using OpenAPI, you can use JSON or YAML to write it. Luckily, the community has build tools around it to make it easier to build an OpenAPI specification. Such tools are:

* [Swagger Editor][swagger-editor], the official tool from swagger.
* [Swagger Viewer][swagger-viewer], which is a VSCode plugin.
* [OpenAPI (Swagger) Editor][openapi-swagger-editor], which adds rich support ( IntelliSense, linting, schema enforcement, etc...) for OpenAPI development.
* [openapi-lint][openapi-lint], is a linter build for OpenAPI.

In this tutorial, I will be using VSCode, therefore I have installed [OpenAPI (Swagger) Editor][openapi-swagger-editor].

# Creating an API Spec with the Swagger Editor

Now we will create our OpenAPI specification. To make it easier to follow, we will split it into five parts:

1. General
2. Tags
3. Paths
4. Components
5. Security

If you want to learn more about the OpenAPI-Specification you can visit the [Github repository][openapi-spec-github].


## General

* [`openapi`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#openapi-object), This is the root document object of the OpenAPI document.
* [`info`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#infoObject), The object provides metadata about the API. The metadata MAY be used by the clients if needed, and MAY be presented in editing or documentation generation tools for convenience
* [`contact`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#contactObject), contact information for the exposed API.
* [`licence`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#licenseObject), license information for the exposed API.
* [`servers`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#serverObject), is an object representing a Server.
  

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
## Tags

A list of tags used by the specification with additional metadata.

* [`tags`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#fixed-fields), A list of tags used by the specification with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools. Each tag name in the list MUST be unique.


```yaml
tags:
- name: user
  description: Operations about user
  externalDocs:
    description: Find out more about our store
    url: http://swagger.io
```
## Paths

Here we will describe some paths, to make it clean how you can create your own. But, what are paths? Relative paths holds the information  to the individual endpoints and their operations.

* [`ref`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#fixed-fields-7), Allows for an external definition of this path item. The referenced structure MUST be in the format of a Path Item Object. If there are conflicts between the referenced definition and this Path Item's definition, the behavior is undefined.
* `summary`, An optional, string summary, intended to apply to all operations in this path.
* [`operationId`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#fixed-fields-8), Unique string used to identify the operation. The id MUST be unique among all operations described in the API. The operationId value is case-sensitive. Tools and libraries MAY use the operationId to uniquely identify an operation, therefore, it is RECOMMENDED to follow common programming naming conventions.
* [`responses`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#responsesObject), The Responses Object MUST contain at least one response code, and it SHOULD be the response for a successful operation call.

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
## Components

The objects of the API are all descrived here. The objects defined within the components object will have no effect on the API unless they are explicitly referenced from properties outside the components object.

* [`schemas`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schema-object), allows the definition of input and output data types. These types can be objects, but also primitives and arrays.
* [`securitySchemes`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#security-scheme-object), defines a security scheme that can be used by the operations. Supported schemes are HTTP authentication, an API key (either as a header, a cookie parameter or as a query parameter), OAuth2's common flows

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

We will know move on how to actually generate code.

# Generating Code from an API Specification

We will take a look at two approaches to generating the code:
1. Going over to [Swagger Editor][swagger-editor] and
2. The [OpenAPI Maven plugin][openapi-maven-plugin].

## Generating Code from Swagger Editor

Although that's an approach which I wouldn't take, I must introduce it. 
So, Go over to [Swagger Editor][swagger-editor] and copy your `<specification>.yml` (or just use the predefined one) then select from the menu *Generate Server* and pick what kind of a server you would like to generate (I went with spring).

As I said before, I wouldn't use this approach. But why?
First, the code that I got generated was using Java 7 and Spring Boot 1.5.22.RELEASE (which both are quite old now). 
Second, if you make a change on the specification (and changes happen all the time), you would have to copy-paste the files that were changed. 

So now I will introduce you to the second approach.
 
 ## Generating Code with OpenAPI Maven plugin
 
 Here we will use the [OpenAPI Maven plugin][openapi-maven-plugin].
 Let's now introduce you to the folder structure. I opted out to use a multi-module maven project, where we will have two projects:
 
 1. `app`, the one who builds an API around the API Specification.
 2. `specification`, which its only job is to generate the API Specification for our app.  
 
 The folder structure looks like this:
 
 ```text
reflect-91(root)
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

Our `app` is a simple Spring Boot project, so let us focus on the pom.xml from the `specification`.

Caution: Using only the plugin won't produce you a valid project, while you need to also add other dependencies (like jackson).

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

In the above code snippet, you can see us defining the [OpenAPI Maven plugin][openapi-maven-plugin]. 
For this tutorial, we will use the `spring` generator. [OpenAPI Maven plugin][openapi-maven-plugin] comes with a lot of options. To see the full set of options you can go over to the [official site][openapi-maven-plugin] of the plugin. 

Running the command: `mvnw install`, will generate our OpenAPI Specification!
If you take a quick look under `target/generated-sources/openapi/src/main/java/io/reflectoring/model`, you will find the User model defined in the `openapi.yml`!

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

Now let us implement the `UserApi`, which comes from our generated specification.

```java
@RestController
public class UserController implements UserApi {
}
```

If we test our API like this you will notice that you get a 501 response (Not Implemented). Why?

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

# Conclusion

API-First approach is easy to use, but it's difficult to master it. 

To be able to do it right, you should:
 - Know what you have to build, it may be difficult when you are working in an agile environment
 - Communication is a must. Because the API will be used by different teams.

[swagger-editor]: http://editor.swagger.io/

[swagger-spec]: https://swagger.io/docs/specification/about

[swagger-viewer]: https://marketplace.visualstudio.com/items?itemName=Arjun.swagger-viewer

[openapi-swagger-editor]: https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi

[openapi-lint]: https://marketplace.visualstudio.com/items?itemName=mermade.openapi-lint

[openapi-spec-github]: https://github.com/OAI/OpenAPI-Specification/blob/master/vtersions/3.0.2.md#versions

[openapi-maven-plugin]: https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin