---
title: API-First Development with Spring Boot and Swagger
categories: [spring-boot]
date: 2020-03-11 05:00:00 +1100
modified: 2020-03-11 05:00:00 +1100
excerpt: "What's the 'API-First' Approach? And how do we go about it with Swagger and Spring Boot? This guide shows how to make APIs a first-class citizen in our project."
author: petros
image:
  auto: 0056-colors
tags: ["api-first-approach", "swagger"]
---

Following an API-first approach, we specify an API before we start coding. Via API description languages, teams can collaborate without having implemented anything, yet.

Those description languages specify endpoints, security schemas, object schemas, and much more. Moreover, most of the time we can also generate code such a specification.

Often, an API specification also becomes the documentation of the API. 

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-openapi" %}

## Benefits of API-First

To start working on an integration between components or systems, a team needs a contract. In our case, the contract is the API specification. API-first helps teams to communicate with each other, without implementing a thing. **It also enables teams to work in parallel.**

Where the API-first approach shines is on building a **better API**. Focusing on the functionality that it is needed to provide and only that. Minimalistic APIs mean less code to maintain.

## Creating an API Spec with the Swagger Editor

Let's create our own OpenAPI specification in a YAML document. To make it easier to follow, we'll split the discussion into separate parts of the YAML document we're creating.

If you want to learn more details about the OpenAPI-Specification you can visit the [Github repository](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#versions).


### General Information

We start with some general information about our API at the top of our document:

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

Next, we'll describe some paths. A path holds information about an individual endpoint and its operations:

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

The [`$ref`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#fixed-fields-8) field allows us to refer to objects in a self-defined schema. In this case we refer to the `User` schema object (see the next section about [Components](#components)).

The `summary` is a short description of what the operation does.

With the [`operationId`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#fixed-fields-8), we can define a unique identifier for the operation. We can think about it as our method name.

Finally, the [`responses`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#responsesObject) object allows us to define the outcomes of an operation. We must define at least one successful response code for any operation call. 

### Components

The objects of the API are all described in the `components` section. The objects defined within the components object will not affect the API unless they are explicitly referenced from properties outside the components object, as we have seen above:

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

There two possible ways to make use of security schemes. 

First, we can add a security scheme to a specific operation using the `security` field:

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

In the above example we explicitly specify that the path /user/{username} is secured with the `api_key` scheme we defined above. 

However, if we want to apply security on the whole project, we just need to specify it as a top-level field:

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
Now, all of our paths should be secured with the `api_key` scheme.

## Generating Code From an API Specification

Having defined an API, we'll now create code from the [YAML document above](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-openapi/specification/src/main/resources/openapi.yml). 

We'll take a look at two different approaches to generating the code:

* using the [Swagger Editor](http://editor.swagger.io/) to generate code manually, and
* using the [OpenAPI Maven plugin](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin) to generate code from a Maven build.

### Generating Code from Swagger Editor

Although this is an approach that I wouldn't take, let's talk about it and discuss why I think it's a bad idea. 

Let's go over to Swagger Editor and paste our YAML file into it. Then, we select *Generate Server* from the menu and pick what kind of a server we'd like to generate (I went with "Spring").

So why is this a bad idea?

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
the OpenAPI Maven plugin:

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

For this tutorial, we're using the `spring` generator. 

**Simply running the command `./mvnw install` will generate code that implements our OpenAPI specification!**

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

The generator does not only generate the models but also the endpoints. Let's take a quick look at what we generated:

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

Of course, the generator cannot generate our business logic for us, but it does generate interfaces like `UserApiDelegate` above for us to implement.

It also creates a `UserApi` interface which delegates calls to `UserApiDelegate`:

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

The generator also creates a Spring controller for us that implements the `UserApi` interface:

```java
@javax.annotation.Generated(...)
@Controller
@RequestMapping("${openapi.reflectoring.base-path:/v2}")
public class UserApiController implements UserApi {

    private final UserApiDelegate delegate;

    public UserApiController(@Autowired(required = false) UserApiDelegate delegate) {
        this.delegate = Optional.ofNullable(delegate).orElse(new UserApiDelegate() {});
    }

    @Override
    public UserApiDelegate getDelegate() {
        return delegate;
    }
}
```

Spring will inject our implementation of `UserApiDelegate` into the controller's constructor if it finds it in the application context. Otherwise, the default implementation will be used.

Let's start our application and hit the GET endpoint `/v2/user/{username}`.

```shell script
curl -I http://localhost:8080/v2/user/Petros
HTTP/1.1 501
Content-Length: 0
```

But why do we get a 501 response (Not Implemented)?

Because we did not implement the `UserApiDelegate` interface and the  `UserApiController` used the default one, which returns `HttpStatus.NOT_IMPLEMENTED`.

Now let's implement the `UserApiDelegate`:

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

It's important to add a `@Service` or `@Component` annotation to the class so that Spring can pick it up and inject it into the `UserApiController`.

If we run `curl http://localhost:8080/v2/user/Petros` again now, we'll receive a valid JSON response:

```json
{
  "id": 123,
  "firstName": "Petros",
  // ... omit other properties
}
```

The `UserApiDelegate` is the single point of truth. That enables us to make fast changes in our API. For example, if we change the specification and generate it again, we only have to implement the newly generated methods.

The good thing is that if we won't implement them, our application doesn't break. By default, those endpoints would return HTTP status 501 (Not Implemented).

In my opinion, generating the OpenAPI Specification with Maven plugin instead of Swagger Editor is the better choice. 
That's because we have more control over our options. The plugin provides some configuration and with Git as a version control tool, we can safely track any changes in either `pom.xml` and `openapi.yml`.

## Conclusion

With OpenAPI we can create an API specification that we can share among teams to communicate contracts. The OpenAPI Maven plugin allows us to generate boilerplate code for Spring Boot from such a specification so that we only need to implement the business logic ourselves.

You can browse the example code on [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-openapi).