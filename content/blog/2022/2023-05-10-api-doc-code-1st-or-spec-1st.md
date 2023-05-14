---
authors: [pratikdas]
title: "API Documentation: API-First vs. Code-First"
categories: ["Software Craft"]
date: 2023-04-25 00:00:00 +1100
excerpt: "An application programming interface (API) is a form of a real life contract between two  software programs or applications describing and laying down the rules that they should follow to communicate with one another. 
OAS is the most accepted standard for publishing API contracts for REST APIs, still many informal means of communinicating API contracts are prevalent in the industry. However a good documentation for an API is a must have to make the API easy to understand and consume by the consumers."
image: images/stock/0117-queue-1200x628-branded.jpg
url: struct-log-with-cw
---

An application programming interface (API) is a form of a real life contract between two  software programs or applications describing and laying down the rules that they should follow to communicate with one another. 
OAS is the most accepted standard for publishing API contracts for REST APIs, still many informal means of communinicating API contracts are prevalent in the industry. However a good documentation for an API is a must have to make the API easy to understand and consume by the consumers. 

APIs have traditionally been built by first writing the implementation code in a programming language and then publishing the API contract. This is called the code first approach. In contrast to this method, we can also create the API contract first and then write the implementation code for the API. This is called the design first approach of creating APIs. The documentation of the API can accordingly evolve starting from the code or the contract depending on which approach is chosen. 

In this article, we will understand this code first approach versus the design first approach of writing the API documentation and which method should be preferred in which situations.

## Common Contents of an API Documentation
API documentation consists of a description of the API explaining what it can do along with the instructions on how to use and integrate the API. It can also include release updates with regard to the API’s lifecycle such as new versions or impending retirement. Some aspects of API documentation, in particular the functional interface, can be generated automatically using Swagger, OAS or similar specifications.
 
## The Design-First Process

In design-first API documentation process, we design and document the API contract before writing any implementation code. The API contract is treated as a first class citizen.
The API is treated as a product and the contract is designed with a focus on making it easy to use by the consumers. The API contract is developed through multiple stages. Consumers provide feedback at each stage and the API contract is matured by incorporating those feedbacks. Once the API contract is finalized, it is published in a registry and the consumers and producers work against this contract independently.
 and follows a product lifecylce.

 API definitions are typically writeen in yaml following the OAS. A sample of an OAS file looks like this:

 ```yaml
openapi: 3.0.3
info:
  title: Swagger Petstore - OpenAPI 3.0
  description: |-
    This is a sample Pet Store Server based on the OpenAPI 3.0 specification.  You can ...
  termsOfService: http://swagger.io/terms/
  contact:
    email: apiteam@swagger.io
  license:
    name: Apache 2.0
    url: http://www.apache.org/licenses/LICENSE-2.0.html
  version: 1.0.11
externalDocs:
  description: Find out more about Swagger
  url: http://swagger.io
servers:
  - url: https://petstore3.swagger.io/api/v3
tags:
  - name: product
    description: Everything about your Products
    externalDocs:
      description: Find out more
      url: http://swagger.io
  - name: inventory
    description: Access to Petstore orders
    externalDocs:
      description: Find out more about our store
      url: http://swagger.io
  - name: order
    description: Operations about user
paths:
  /products:
    put:
      tags:
        - product
      summary: Update an existing product
      description: Update an existing product by Id
      operationId: updateProduct
      requestBody:
        description: Update an existing product in the store
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Product'
          application/xml:
            schema:
              $ref: '#/components/schemas/Product'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/Product'
        required: true
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'          
            application/xml:
              schema:
                $ref: '#/components/schemas/Pet'
        '400':
          description: Invalid ID supplied
        '404':
          description: Pet not found
        '405':
          description: Validation exception
      security:
        - petstore_auth:
            - write:pets
            - read:pets
    post:
      tags:
        - pet
      summary: Add a new pet to the store
      description: Add a new pet to the store
      operationId: addPet
      requestBody:
        description: Create a new pet in the store
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
          application/xml:
            schema:
              $ref: '#/components/schemas/Pet'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/Pet'
        required: true
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'          
            application/xml:
              schema:
                $ref: '#/components/schemas/Pet'
        '405':
          description: Invalid input
      security:
        - petstore_auth:
            - write:pets
            - read:pets
  /pet/findByStatus:
    get:
      tags:
        - pet
      summary: Finds Pets by status
      description: Multiple status values can be provided with comma separated strings
      operationId: findPetsByStatus
      parameters:
        - name: status
          in: query
          description: Status values that need to be considered for filter
          required: false
          explode: true
          schema:
            type: string
            default: available
            enum:
              - available
              - pending
              - sold
      responses:
        '200':
          description: successful operation
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'          
            application/xml:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
        '400':
          description: Invalid status value
      security:
        - petstore_auth:
            - write:pets
            - read:pets
  /pet/findByTags:
    get:
      tags:
        - pet
      summary: Finds Pets by tags
      description: Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
      operationId: findPetsByTags
      parameters:
        - name: tags
          in: query
          description: Tags to filter by
          required: false
          explode: true
          schema:
            type: array
            items:
              type: string
      responses:
        '200':
          description: successful operation
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'          
            application/xml:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
        '400':
          description: Invalid tag value
      security:
        - petstore_auth:
            - write:pets
            - read:pets
  /pet/{petId}:
    get:
      tags:
        - pet
      summary: Find pet by ID
      description: Returns a single pet
      operationId: getPetById
      parameters:
        - name: petId
          in: path
          description: ID of pet to return
          required: true
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'          
            application/xml:
              schema:
                $ref: '#/components/schemas/Pet'
        '400':
          description: Invalid ID supplied
        '404':
          description: Pet not found
      security:
        - api_key: []
        - petstore_auth:
            - write:pets
            - read:pets
    post:
      tags:
        - pet
      summary: Updates a pet in the store with form data
      description: ''
      operationId: updatePetWithForm
      parameters:
        - name: petId
          in: path
          description: ID of pet that needs to be updated
          required: true
          schema:
            type: integer
            format: int64
        - name: name
          in: query
          description: Name of pet that needs to be updated
          schema:
            type: string
        - name: status
          in: query
          description: Status of pet that needs to be updated
          schema:
            type: string
      responses:
        '405':
          description: Invalid input
      security:
        - petstore_auth:
            - write:pets
            - read:pets
    delete:
      tags:
        - pet
      summary: Deletes a pet
      description: delete a pet
      operationId: deletePet
      parameters:
        - name: api_key
          in: header
          description: ''
          required: false
          schema:
            type: string
        - name: petId
          in: path
          description: Pet id to delete
          required: true
          schema:
            type: integer
            format: int64
      responses:
        '400':
          description: Invalid pet value
      security:
        - petstore_auth:
            - write:pets
            - read:pets
  /pet/{petId}/uploadImage:
    post:
      tags:
        - pet
      summary: uploads an image
      description: ''
      operationId: uploadFile
      parameters:
        - name: petId
          in: path
          description: ID of pet to update
          required: true
          schema:
            type: integer
            format: int64
        - name: additionalMetadata
          in: query
          description: Additional Metadata
          required: false
          schema:
            type: string
      requestBody:
        content:
          application/octet-stream:
            schema:
              type: string
              format: binary
      responses:
        '200':
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponse'
      security:
        - petstore_auth:
            - write:pets
            - read:pets
  /store/inventory:
    get:
      tags:
        - store
      summary: Returns pet inventories by status
      description: Returns a map of status codes to quantities
      operationId: getInventory
      responses:
        '200':
          description: successful operation
          content:
            application/json:
              schema:
                type: object
                additionalProperties:
                  type: integer
                  format: int32
      security:
        - api_key: []
  /store/order:
    post:
      tags:
        - store
      summary: Place an order for a pet
      description: Place a new order in the store
      operationId: placeOrder
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Order'
          application/xml:
            schema:
              $ref: '#/components/schemas/Order'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/Order'
      responses:
        '200':
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
        '405':
          description: Invalid input
  /store/order/{orderId}:
    get:
      tags:
        - store
      summary: Find purchase order by ID
      description: For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
      operationId: getOrderById
      parameters:
        - name: orderId
          in: path
          description: ID of order that needs to be fetched
          required: true
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'          
            application/xml:
              schema:
                $ref: '#/components/schemas/Order'
        '400':
          description: Invalid ID supplied
        '404':
          description: Order not found
    delete:
      tags:
        - store
      summary: Delete purchase order by ID
      description: For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
      operationId: deleteOrder
      parameters:
        - name: orderId
          in: path
          description: ID of the order that needs to be deleted
          required: true
          schema:
            type: integer
            format: int64
      responses:
        '400':
          description: Invalid ID supplied
        '404':
          description: Order not found
  /user:
    post:
      tags:
        - user
      summary: Create user
      description: This can only be done by the logged in user.
      operationId: createUser
      requestBody:
        description: Created user object
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
          application/xml:
            schema:
              $ref: '#/components/schemas/User'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        default:
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
            application/xml:
              schema:
                $ref: '#/components/schemas/User'
  /user/createWithList:
    post:
      tags:
        - user
      summary: Creates list of users with given input array
      description: Creates list of users with given input array
      operationId: createUsersWithListInput
      requestBody:
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/User'
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'          
            application/xml:
              schema:
                $ref: '#/components/schemas/User'
        default:
          description: successful operation
  /user/login:
    get:
      tags:
        - user
      summary: Logs user into the system
      description: ''
      operationId: loginUser
      parameters:
        - name: username
          in: query
          description: The user name for login
          required: false
          schema:
            type: string
        - name: password
          in: query
          description: The password for login in clear text
          required: false
          schema:
            type: string
      responses:
        '200':
          description: successful operation
          headers:
            X-Rate-Limit:
              description: calls per hour allowed by the user
              schema:
                type: integer
                format: int32
            X-Expires-After:
              description: date in UTC when token expires
              schema:
                type: string
                format: date-time
          content:
            application/xml:
              schema:
                type: string
            application/json:
              schema:
                type: string
        '400':
          description: Invalid username/password supplied
  /user/logout:
    get:
      tags:
        - user
      summary: Logs out current logged in user session
      description: ''
      operationId: logoutUser
      parameters: []
      responses:
        default:
          description: successful operation
  /user/{username}:
    get:
      tags:
        - user
      summary: Get user by user name
      description: ''
      operationId: getUserByName
      parameters:
        - name: username
          in: path
          description: 'The name that needs to be fetched. Use user1 for testing. '
          required: true
          schema:
            type: string
      responses:
        '200':
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'          
            application/xml:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Invalid username supplied
        '404':
          description: User not found
    put:
      tags:
        - user
      summary: Update user
      description: This can only be done by the logged in user.
      operationId: updateUser
      parameters:
        - name: username
          in: path
          description: name that need to be deleted
          required: true
          schema:
            type: string
      requestBody:
        description: Update an existent user in the store
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
          application/xml:
            schema:
              $ref: '#/components/schemas/User'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        default:
          description: successful operation
    delete:
      tags:
        - user
      summary: Delete user
      description: This can only be done by the logged in user.
      operationId: deleteUser
      parameters:
        - name: username
          in: path
          description: The name that needs to be deleted
          required: true
          schema:
            type: string
      responses:
        '400':
          description: Invalid username supplied
        '404':
          description: User not found
components:
  schemas:
    Order:
      type: object
      properties:
        id:
          type: integer
          format: int64
          example: 10
        petId:
          type: integer
          format: int64
          example: 198772
        quantity:
          type: integer
          format: int32
          example: 7
        shipDate:
          type: string
          format: date-time
        status:
          type: string
          description: Order Status
          example: approved
          enum:
            - placed
            - approved
            - delivered
        complete:
          type: boolean
      xml:
        name: order
    Customer:
      type: object
      properties:
        id:
          type: integer
          format: int64
          example: 100000
        username:
          type: string
          example: fehguy
        address:
          type: array
          xml:
            name: addresses
            wrapped: true
          items:
            $ref: '#/components/schemas/Address'
      xml:
        name: customer
    Address:
      type: object
      properties:
        street:
          type: string
          example: 437 Lytton
        city:
          type: string
          example: Palo Alto
        state:
          type: string
          example: CA
        zip:
          type: string
          example: '94301'
      xml:
        name: address
    Category:
      type: object
      properties:
        id:
          type: integer
          format: int64
          example: 1
        name:
          type: string
          example: Dogs
      xml:
        name: category
    User:
      type: object
      properties:
        id:
          type: integer
          format: int64
          example: 10
        username:
          type: string
          example: theUser
        firstName:
          type: string
          example: John
        lastName:
          type: string
          example: James
        email:
          type: string
          example: john@email.com
        password:
          type: string
          example: '12345'
        phone:
          type: string
          example: '12345'
        userStatus:
          type: integer
          description: User Status
          format: int32
          example: 1
      xml:
        name: user
    Tag:
      type: object
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
      xml:
        name: tag
    Product:
      required:
        - name
        - photoUrls
      type: object
      properties:
        id:
          type: integer
          format: int64
          example: 10
        name:
          type: string
          example: television
        category:
          $ref: '#/components/schemas/Category'
        photoUrls:
          type: array
          xml:
            wrapped: true
          items:
            type: string
            xml:
              name: photoUrl
        tags:
          type: array
          xml:
            wrapped: true
          items:
            $ref: '#/components/schemas/Tag'
        status:
          type: string
          description: pet status in the store
          enum:
            - available
            - pending
            - sold
      xml:
        name: pet
    ApiResponse:
      type: object
      properties:
        code:
          type: integer
          format: int32
        type:
          type: string
        message:
          type: string
      xml:
        name: '##default'
  requestBodies:
    Pet:
      description: Pet object that needs to be added to the store
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Pet'
        application/xml:
          schema:
            $ref: '#/components/schemas/Pet'
    UserArray:
      description: List of user object
      content:
        application/json:
          schema:
            type: array
            items:
              $ref: '#/components/schemas/User'
  securitySchemes:
    petstore_auth:
      type: oauth2
      flows:
        implicit:
          authorizationUrl: https://petstore3.swagger.io/oauth/authorize
          scopes:
            write:pets: modify pets in your account
            read:pets: read your pets
    api_key:
      type: apiKey
      name: api_key
      in: header
 ```

In this model, the API specification is the artifact used to drive the rest of the development process.

Proponents of this process believe that focusing on designing the API using an OpenAPI description before any implementation is done allows you to get early feedback from API consumers who can view the documentation before the API is built.

In theory, a design-first process can help catch potential problems with the API early and avoids wasting time and money writing code which is not going to solve a problem.

API Description First involves writing your API description document as the very first step in the development process. You can use this description document to create a mock server early in the development process, get feedback from your customers, and then commit to the final API description before starting an official implementation.

With the API description document in hand, you can kick start the implementation by leveraging code generation projects that generation portions of the server and allow you to focus on implementing the business logic.

Focusing on the API description document first helps establish API design as a first class priority of engineering teams. This framing creates a lot of benefits in how teams think about APIs a core feature of the product they are developing.

The main negative I’ve found when developing API description documents is that it involves writing out a large amount of boilerplate and special keywords in YAML or JSON. This is a tedious and error-prone proposition when done by hand. For example, we can take the ubiquitous Petstore example from the OpenAPI project.

## The Code-First Process

A code-first API process focuses on implementing the API first, and then creating the API description document after the implementation. In this model, the API implementation is the source of truth for the API and drives the rest of the development process.
Proponents of this process believe that writing and maintaining an API description document is difficult and error prone, and that it slows down the development process and time to market for new APIs and new product features.

## Code First
In the code-first method, we write the API implementation code in a programming language without thinking about how the API documentation will look like.
Once the API implementation code is complete and tested, we document the API using an API description format like OpenAPI using the code as the reference.

With this code-first method, it is possible for us to start implementing the API much faster if they start coding the API directly from the product requirements document. Libraries supporting scaffolding server code, functional testing, and deployment automation can make the implementation first method quick to get started and end up with good results. When developing internal APIs that aren’t exposed as a product to customers, the implementation first approach offers speed, automation and reduced process complexity.

The issue with Implementation First is that it can be a lot of work to go back and write documentation for an existing API. It can especially feel like a chore when the documentation will get out of date with the implementation as you make new changes to the API.

The primary criticism’s that most people have with a Code First API development process are that:
- there isn’t enough care put into API design 
- the API description will get out-of-sync with the implementation. 
When reviewing these problems against this modified continuum of API development methodologies you can see that only the very last method, which I am calling Implementation First suffers from these problems.

## API first or Code first

## Different Types of APIs
APIs are not all equal, however. Developers can work with an assortment of API types, protocols and architectures that suit the unique needs of different applications and businesses.
APIs come in several types depending on the intent of their use:
**Public API**: Example of public API are APIs from 

## Conclusion

Here is a list of the major points for a quick reference:

