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
  * 
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

# Generating Code from an API Spec

Please use the generated code with caution. The one I generated was using Java 7 and Spring Boot 1.5.22.RELEASE. So I would not recommend building a project around it.

Although, if you want you can generate it by going over to [Swagger Editor][swagger-editor]. Then selecting from menu *Generate Server* and pick the server you would like.

Let's now take a look at the generated code.

Below, you can see how the General information is in code.

```java
@Configuration
public class SwaggerDocumentationConfig {

    ApiInfo apiInfo() {
        return new ApiInfoBuilder()
            .title("Reflectoring")
            .description("Tutorials on Spring Boot and Java, thoughts about the Software Craft, and relevant book reviews. Because it's just as important to understand the Why as it is to understand the How. Have fun!")
            .license("Apache 2.0")
            .licenseUrl("http://www.apache.org/licenses/LICENSE-2.0.html")
            .termsOfServiceUrl("")
            .version("0.0.1-SNAPSHOT")
            .contact(new Contact("","", "petros.stergioulas94@gmail.com"))
            .build();
    }
```

# Things to Keep in Mind with API-First

In an API-First approach, it's quite difficult to keep up with the changes. I would recommend not changing the generated code because you will lose the consistency between the YAML file and your code. 

With the Swagger Editor, it's difficult to generate always the code. It involves a lot of copy-pasting.

I would recommend for Java-based projects to use the [OpenAPI Maven plugin](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin), which generates the code based on the YAML file. But, caution, this code is generated and it cannot be changed.

# Conclusion

API-First approach is easy to use, but it's difficult to master it. 

To be able to do it right, you should:
 - Know what you actually have to build, it may be difficult when you are working in an agile environment
 - Communication is a must. Because the API will be used by different teams.

[swagger-editor]: http://editor.swagger.io/

[swagger-spec]: https://swagger.io/docs/specification/about

[swagger-viewer]: https://marketplace.visualstudio.com/items?itemName=Arjun.swagger-viewer

[openapi-swagger-editor]: https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi

[openapi-lint]: https://marketplace.visualstudio.com/items?itemName=mermade.openapi-lint

[openapi-spec-github]: https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#versions
