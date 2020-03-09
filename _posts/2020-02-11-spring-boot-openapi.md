---
title: API-First Development with Spring Boot and Swagger
categories: [spring-boot]
date: 2020-02-11 05:00:00 +1100
modified: 2020-02-11 05:00:00 +1100
excerpt: "What's the 'API-First' Approach? And how do we go about it with Swagger and Spring Boot? This guide shows how to make APIs a first-class citizen in our project."
author: petros
image:
  auto: 0056-colors
tags: ["api-first-approach", "swagger"]
---

Following an API-first approach, we specify an API before we start coding. Via API description languages, teams can collaborate without having implement anything, yet.
Those description languages, specify endpoints, security schemas, object schemas, and much more. Moreover, most of the time we can also generate everuthing that we specified in those specification.

Most of the time, an API specification becomes also the documentation of the API. 

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-openapi" %}

## Benefits of API-First

To start working on an integration between components or systems, a team needs a contract. In our case, the contract is the API specification. API-first helps teams to communicate with each other, without implementing a thing. **It also enables teams to work in parallel.**

Where the API-first Approach shines is on building a **better API**. Focusing on the functionality that it is needed to provide and only that. Minimalistic APIs mean less code to maintain.

## Creating an API Spec with the Swagger Editor

Let's create our own OpenAPI specification in a YAML document. To make it easier to follow, we'll split the discussion into separate parts of the YAML document we're creating.

If you want to learn more details about the OpenAPI-Specification you can visit the [Github repository](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#versions).


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

Then comes some additional metadata about our API:

```yaml
tags:
- name: user
  description: Operations about user
  externalDocs:
    description: Find out more about our store
    url: http://swagger.io
```

The [`tags`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#fixed-fields) section provides fields for additional metadata which we can use to make our API more readable and easier to follow. We can add multiple tags, but each tag should be unique.

### Paths

Next, we'll describe some paths. A paths holds information about individual endpoints and their operations:

```yaml
paths:
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

The [`$ref`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#fixed-fields-8) field allows us to refer to objects in a self-defined schema. In this case we refer to the `User` schema object (see next section).

The `summary` is a short description, of what the operation does.

With the [`operationId`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#fixed-fields-8), we can define a unique identifier for the operation. We can think about it as our method name.

Finally, the [`responses`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#responsesObject) object allows us to define the outcomes of an operation. We must define at least one successful response code for an operation call. 

### Components

The objects of the API are all described in the `components` section. The objects defined within the components object will have no effect on the API unless they are explicitly referenced from properties outside the components object, as we have seen above:

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
        ... more attributes
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

The [`schemas`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schema-object) section allows us to define the objects we want to use in our API.

In the [`securitySchemes`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#security-scheme-object) section, we can define security schemes that can be used by the operations.

There two possible ways to make use of the use security schemes. One to add on an specific operation for example  in a GET request like:

```yaml
paths:
  /user/{username}:
    get:
      tags:
      - user
      summary: Get user by user name
      security: 
        - api_key: []
```

In the above example we explicit specify that the path /user/{username} is secured with an api key. 

However, if we want to apply security on the whole project, we just need to specify it as a field in the yaml like:

```yaml
paths:
  /user/{username}:
    get:
      tags:
      - user
      summary: Get user by user name
security: 
  - api_key: []
```
Now, all of our paths should be secured with an api key.

## Generating Code From an API Specification

Having defined an API, we'll now create code from the [YAML document above](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-openapi/specification/src/main/resources/openapi.yml). 

We'll take a look at two different approaches to generating the code:

* using the [Swagger Editor](http://editor.swagger.io/) to generate code manually, and
* using the [OpenAPI Maven plugin](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin) to generate code from a Maven build.

### Generating Code from Swagger Editor

Although this is an approach which I wouldn't take, let's talk about it and discuss why I think it's a bad idea. 

So, let's go over to Swagger Editor and paste our YAML file into it. Then, we select *Generate Server* from the menu and pick what kind of a server we'd like to generate (I went with "Spring").

As I said before, I wouldn't use this approach. But why?

First, the code that was generated for me is using Java 7 and Spring Boot 1.5.22, both of which are quite outdated. 

Second, if we make a change to the specification (and changes happen all the time), we'd have to copy-and-paste the files that were changed manually. 

### Generating Code with the OpenAPI Maven plugin
 
A better alternative is to generate the code from within a Maven build with the OpenAPI Maven plugin. 
 
Let's take a look at the folder structure. I chose to use a multi-module maven project, where we have two projects:
 
 * `app`, an application that implements the API from our specification.
 * `specification`, whose only job is to provide the API Specification for our app.  
 
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
└── pom.xml
```

For the sake of simplicity, we omit the test folders.

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

For this tutorial, we're using the `spring` generator. The [OpenAPI Maven plugin](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin) comes with a lot of options. To see the full set of options you can go over to the [official site](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin) of the plugin. 

Simply running the command `./mvnw install` will generate code that implements our OpenAPI specification!

Taking a look into the folder `target/generated-sources/openapi/src/main/java/io/reflectoring/model`, we find the code for the `User` model we defined in our YAML:

```java
@javax.annotation.Generated(...)
public class User   {
  @JsonProperty("id")
  private Long id;

  @JsonProperty("username")
  private String username;

  @JsonProperty("firstName")
  private String firstName;
  
  // ... more properties

  @JsonProperty("userStatus")
  private Integer userStatus;

  // ... getters and setters

}
```

The generator does not only generate the models but also the endpoints. Let's take a quick look what we generated:

```java
public interface UserApiDelegate {

    default Optional<NativeWebRequest> getRequest() {
        return Optional.empty();
    }

    /**
     * POST /user : Create user
     * Create user functionality
     *
     * @param body Created user object (required)
     * @return successful operation (status code 200)
     * @see UserApi#createUser
     */
    default ResponseEntity<Void> createUser(User body) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);

    }
  // ... omit deleteUser, getUserByName and updateUser
}
```

The `UserApiDelegate` should be implemented by our application. Also, the class that implements it, should be annotated as a bean.

```java
@Validated
@Api(value = "user", description = "the user API")
public interface UserApi {

    default UserApiDelegate getDelegate() {
        return new UserApiDelegate() {};
    }

    /**
     * POST /user : Create user
     * Create user functionality
     *
     * @param body Created user object (required)
     * @return successful operation (status code 200)
     */
    @ApiOperation(value = "Create user", nickname = "createUser", notes = "Create user functionality", tags={ "user", })
    @ApiResponses(value = { 
        @ApiResponse(code = 200, message = "successful operation") })
    @RequestMapping(value = "/user",
        method = RequestMethod.POST)
    default ResponseEntity<Void> createUser(@ApiParam(value = "Created user object" ,required=true )  @Valid @RequestBody User body) {
        return getDelegate().createUser(body);
    }
    
    // ... omit deleteUser, getUserByName and updateUser
}
```

Above in the `createUser` method, we see the use of the `UserApiDelegate`. By default, an empty `UserApiDelegate` is created.

```java
@javax.annotation.Generated(value = "org.openapitools.codegen.languages.SpringCodegen", date = "2020-02-11T20:57:13.223+01:00[Europe/Berlin]")

@Controller
@RequestMapping("${openapi.reflectoring.base-path:/v2}")
public class UserApiController implements UserApi {

    private final UserApiDelegate delegate;

    public UserApiController(@org.springframework.beans.factory.annotation.Autowired(required = false) UserApiDelegate delegate) {
        this.delegate = Optional.ofNullable(delegate).orElse(new UserApiDelegate() {});
    }

    @Override
    public UserApiDelegate getDelegate() {
        return delegate;
    }
}
```

The `UserApiController` is used to inject any implementation of the `UserApiDelegate`, if not, initializes the default.

Let's start our application and hit the GET endpoint `/v2/user/{username}`.

```shell script
curl -I http://localhost:8080/v2/user/Petros
HTTP/1.1 501
Content-Length: 0
```

But why do we get a 501 response (Not Implemented)?

Because we did not implement a `UserApiDelegate` and the  `UserApiController` used the default one.

```java
public interface UserApiDelegate {

    // ... omit other methods

    default ResponseEntity<User> getUserByName(String username) {
        // ... some code
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }
}
```

Now let's implement the `UserApiDelegate`.

```java
@Service
public class UserApiDelegateImpl implements UserApiDelegate {

    @Override
    public ResponseEntity<User> getUserByName(String username) {
        User user = new User();
        user.setId(123L);
        user.setFirstName("Petros");
        
        // ... omit other initialization

        return ResponseEntity.ok(user);
    }
}
```

If we run `curl http://localhost:8080/v2/user/Petros` again now, we'll receive a valid JSON response:

```json
{
  "id": 123,
  "firstName": "Petros",
  // ... omit other properties
}
```

As we see, the `UserApiDelegate` is the single point of truth. Where everything happens. That enables us to make fast changes in our API. For example, if we change the specification and generate it again, we have only to implement the newly generated methods.
The good thing is, that if we won't implement them, our application doesn't break. By default, those endpoints would send 501 (Not Implemented) response code.

In my opinion, generating the OpenAPI Specification with Maven plugin instead of Swagger Editor is the better choice. 
That's because you have more control over your options. The plugin provides a handful of configuration and with git as a version control tool we can safely track any changes, that may find a place in either on `pom.xml` or `openapi.yml`.

## Conclusion

The API-first approach is easy to use, but it's difficult to master, while you have to have the Big Picture of the product.  
If not, the specification will keep changing, so the API and when an API changes, dependencies are broken. Then the teams must adopt the new API. 
It's also a challenge on how this change will be communicated.

If we are not what we are building, or how our API is gonna look like, we may want to use a Code-first API development approach. Which is exactly the opposite of API-first, the contact is generated out of the code.