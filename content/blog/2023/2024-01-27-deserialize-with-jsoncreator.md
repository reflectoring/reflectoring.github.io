---
title: "Deserialize with Jackson's @JsonCreator in a Spring Boot Application"
categories: ["Spring"]
date: 2024-01-27 00:00:00 +1100
authors: ["ranjani"]
description: "Deserialize with JsonCreator annotation"
image: images/stock/0112-decision-1200x628-branded.jpg
url: spring-jsoncreator
---

The FasterXML Jackson library is the most popular JSON parser in Java. Spring internally uses this API for JSON parsing.
For details on other commonly used Jackson annotations, refer to [this article](https://reflectoring.io/jackson/).
Also, you can deep dive into another useful Jackson annotation [@JsonView](https://reflectoring.io/jackson-jsonview-tutorial/). In this article, we will look at how to use the **@JsonCreator** annotation.
Subsequently, we will also take a look at a specific use case of using this annotation in the context of a Spring Boot application.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/jackson-jsoncreator" %}}

## What is @JsonCreator

The `@JsonCreator` annotation is a part of the [Jackson API](https://fasterxml.github.io/jackson-annotations/javadoc/2.13/com/fasterxml/jackson/annotation/JsonCreator.html) that helps in deserialization. **Deserialization is a process of converting a JSON string into a Java object.**
This is especially useful when we have multiple constructors/static factory methods for object creation. With the `@JsonCreator` annotation we can specify which constructor/static factory method to use during the deserialization process.

## Working With @JsonCreator Annotation

In this section, we'll look at a few use-cases of how this annotation works.
### Deserializing Immutable Objects
Java encourages creating immutable objects since they are thread-safe and easy to maintain. To get a better understanding of how to use immutable objects in java, refer to [this article.](https://reflectoring.io/java-immutables/)
Let's try to deserialize an immutable object `UserData` which is defined as below:
````java

@JsonIgnoreProperties(ignoreUnknown=true)
public class UserData {

    private final long id;

    private final String firstName;

    private final String lastName;

    private LocalDate createdDate;


    public UserData(long id, String firstName, String lastName) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.createdDate = LocalDate.now();
    }

    public UserData(long id, String firstName, String lastName, 
                  LocalDate createdDate) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.createdDate = createdDate;
    }
    
    // Getters here...
}
````
Next, let's try to deserialize the object with Jackson's **ObjectMapper** class:
````java

    @Test
    public void deserializeImmutableObjects() throws JsonProcessingException {
        String userData = 
            objectMapper.writeValueAsString(MockedUsersUtility.getMockedUserData());
        System.out.println("USER: " + userData);
        UserData user = objectMapper.readValue(userData, UserData.class);
        assertNotNull(user);
    }
    
````
In the above example the `writeValueAsString()` serializes the `UserData` object to a String.
The `readValue()` method is responsible for deserializing the String Object back to the `UserData` object.
When we run the test above, we see this error:
````text
com.fasterxml.jackson.databind.exc.InvalidDefinitionException: 
Cannot construct instance of `com.reflectoring.userdetails.model.UserData` 
(no Creators, like default constructor, exist): 
cannot deserialize from Object value (no delegate- or property-based Creator)
 at [Source: (String)"{"id":100,"firstName":"Ranjani","lastName":"Harish",
 createdDate":"2024-01-16"}"; line: 1, column: 2]
````
**The error message explicitly states that the test could not run successfully as there was an error during deserialization**.
This is because the `ObjectMapper` class, by default, looks for a no-arg constructor to set the values. **Since our Java class is immutable, it has neither a no-arg constructor
nor setter methods to set values**. Also, we see that the `UserData` class has multiple constructors. Therefore, we would need a way to 
instruct the `ObjectMapper` class to use the correct constructor for deserialization.
Let's modify our code to use the `@JsonCreator` annotation as :
````java
    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public UserData(@JsonProperty("id") long id, 
                    @JsonProperty("firstName") String firstName,
                    @JsonProperty("lastName") String lastName) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.createdDate = LocalDate.now();
    }
````
Now, when we run our test again, we can see that the deserialization is successful.
Let's look at the additional annotation we've added to get this working.
- By applying the `@JsonCreator` annotation to the constructor, the Jackson deserializer knows which constructor needs to be used.
- `JsonCreator.Mode.PROPERTIES` indicates that the creator should match the incoming object with the constructor arguments. This is the most commonly used JsonCreator Mode.
- We annotate all the constructor arguments with `@JsonProperty` for the creator to map the arguments.

### Understanding All Available JsonCreator Modes

We can pass one of these four values as parameters to this annotation:
- **JsonCreator.Mode.PROPERTIES** : This is the most commonly used mode where every constructor/factory argument is annotated with either `@JsonProperty` to indicate the name of the property to bind to.
- **JsonCreator.Mode.DELEGATING** : Single-argument constructor/factory method without JsonProperty annotation for the argument. Here, Jackson first binds JSON into type of the argument, and then calls the creator. Most commonly, we want to use this option in conjunction with JsonValue (used for serialization).
- **JsonCreator.Mode.DEFAULT** : If we do not choose any mode or the DEFAULT mode, Jackson decides internally which of the PROPERTIES / DELEGATING modes are applied.
- **JsonCreator.Mode.DISABLED** : This mode indicates the creator method is not to be used.


In the further sections, we will take a look at examples and how to use them effectively.

### Additional Use Cases
Let's look at a few scenarios that will help us understand how and when to use the `@JsonCreator` annotation.


#### Single `@JsonCreator` in a Class

To understand this, let's first add `@JsonCreator` annotation with the same mode to two constructors in the same class as below:
````java
    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public UserData(@JsonProperty("id") long id, @JsonProperty("firstName") String firstName,
                    @JsonProperty("lastName") String lastName) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.createdDate = LocalDate.now();
    }

    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public UserData(@JsonProperty("id") long id, @JsonProperty("firstName") String firstName,
                    @JsonProperty("lastName") String lastName, @JsonProperty("createdDate") LocalDate createdDate) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.createdDate = createdDate;
    }
````
When we try to run our test, it will fail with an error:
````text
com.fasterxml.jackson.databind.exc.InvalidDefinitionException: 
Conflicting property-based creators: already had explicitly marked creator 
[constructor for `com.reflectoring.userdetails.model.UserData` (3 args), 
annotations: {interface com.fasterxml.jackson.annotation.JsonCreator=
@com.fasterxml.jackson.annotation.JsonCreator(mode=PROPERTIES)}, 
encountered another: [constructor for `com.reflectoring.userdetails.model.UserData` 
(4 args), annotations: {interface com.fasterxml.jackson.annotation.JsonCreator=
@com.fasterxml.jackson.annotation.JsonCreator(mode=PROPERTIES)}
 at [Source: (String)"{"id":100,"firstName":"Ranjani","lastName":"Harish"
 ,"createdDate":"2024-01-16"}"; line: 1, column: 1]
````
As we can see, the error mentions **"Conflicting property-based creators"**. That indicates that the Jackson deserializer could not resolve the constructor to be used during deserialization
as we have annotated both the constructors with `@JsonCreator`. When we remove one of them, the test runs successfully.


#### Using @JsonProperty with @JsonCreator for the PROPERTIES Mode

To understand this let's remove the `@JsonProperty` annotation set to the constructor arguments:
````java
@JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public UserData(long id, String firstName,
                    String lastName) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.createdDate = LocalDate.now();
    }
````
When we run our test, we see this error:
````text
com.fasterxml.jackson.databind.exc.InvalidDefinitionException: 
Invalid type definition for type `com.reflectoring.userdetails.model.UserData`: 
Argument #0 of constructor 
[constructor for `com.reflectoring.userdetails.model.UserData` (3 args), 
annotations: {interface com.fasterxml.jackson.annotation.JsonCreator=
@com.fasterxml.jackson.annotation.JsonCreator(mode=PROPERTIES)} 
has no property name (and is not Injectable): 
can not use as property-based Creator
 at [Source: (String)"{"id":100,"firstName":"Ranjani","lastName":"Harish"
 ,"createdDate":"2024-01-16"}"; line: 1, column: 1]
````
which indicates that adding the `@JsonProperty` annotation is mandatory. **As we can see the JSON property names and the deserialized object property names are exactly the same.
In such cases there is an alternative way, where we can skip using the `@JsonProperty` annotation**. Let's modify our `ObjectMapper` bean :
````java
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        mapper.registerModule(new JavaTimeModule());
        mapper.registerModule(new ParameterNamesModule());
        return mapper;
    }
````
If we run our tests now, we can see that the test passes even without the use of `@JsonProperty`. This is because we registed the Jackson Parameters module by adding
**mapper.registerModule(new ParameterNamesModule())**. This is a Jackson module that allows accessing parameter names without explicitly specifying the `@JsonProperty` annotation.
{{% info title="Additional Notes" %}}
Another option is to register the `Jdk8Module` which includes the `ParameterNamesModule` along with other modules.
Refer to [the documentation for its usage.](https://github.com/FasterXML/jackson-modules-java8)
  {{% /info %}}



#### Apply @JsonCreator to Static Factory Methods


Another way of creating immutable java objects is via static factory methods. We can apply the `@JsonCreator` annotations to static factory methods as well:
````java
    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public static UserData getUserData(long id, String firstName,String lastName) {
        return new UserData(id, firstName, lastName, LocalDate.now());
    }
````
Here, since we've registered the `ParametersNamesModule`, we need not add the `@JsonProperty` annotation.


#### Use a DELEGATING JsonCreator mode

Let's see how to deserialize an object using the DELEGATING JsonCreator Mode:
````java
@JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public UserData(Map<String,String> map) throws JsonProcessingException {
        this.id = Long.parseLong(map.get("id"));
        this.firstName = map.get("firstName");
        this.lastName = map.get("lastName");
    }
````
When we pass a serialized Map object to the `ObjectMapper` class, it will automatically make use of the DELEGATING mode to create the `UserData` object:
````java
    public static Map<String, String> getMockedUserDataMap() {
        return Map.of("id", "100", "firstName","Ranjani", "lastName","Harish");
    }
        
    @Test
    public void jsonCreatorWithDelegatingMode3() throws JsonProcessingException {
        String userDataJson = 
            objectMapper.writeValueAsString(getMockedUserDataMap());
        assertNotNull(userDataJson);
        UserData data = objectMapper.readValue(userDataJson, UserData.class);
    }
````

Now that we understand how to use the `@JsonCreator` annotation in Java, let's look at a specific use case where this annotation is required in a Spring Boot application.

## Using @JsonCreator In a Spring Boot Application
Let's create a basic Spring Boot application with Rest endpoints that support pagination. **Pagination is the concept of dividing a large number of records in parts/slices. It is particularly useful, when we have to create REST endpoints to be consumed by a front end application.
The Spring paging framework converts this data for us which makes retrieving data easier.**
This [sample application](https://github.com/thombergs/code-examples/tree/master/spring-boot/jackson-jsoncreator) only demonstrates the usage of `@JsonCreator`. To understand how pagination works in Spring Boot, refer [this article.](https://reflectoring.io/spring-boot-paging/)

This sample User Application uses H2 database to store and retrieve data. 
The application is configured to run on port 8083, so let's start our application first:
````text
mvnw clean verify spring-boot:run (for Windows)
./mvnw clean verify spring-boot:run (for Linux)
````

### Create Paginated Data Using Spring REST
Let's understand how `@JsonCreator` can be used to create paginated data in Spring. For this purpose, we will first create a GET endpoint that returns a paged object.
Here, we have converted the `List<User>` returned from the DB into a paged object:
````java
    @GetMapping("/userdetails/page")
    public ResponseEntity<Page<UserData>> getPagedUser(
                    @RequestParam(defaultValue = "0") int page,
                    @RequestParam(defaultValue = "20") int size) {
        List<UserData> usersList = userService.getUsers();

        // First let's split the List depending on the pagesize
        int totalCount = usersList.size();
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalCount);

        List<UserData> pageContent = usersList.subList(startIndex, endIndex);

        Page<UserData> employeeDtos = 
                new PageImpl<>(pageContent, PageRequest.of(page, size), totalCount);

        return ResponseEntity.ok()
                .body(employeeDtos);
    }
````
Here, the `Page` class is an interface in the `org.springframework.data.domain` package.
When we make a GET request to the endpoint `http://localhost:8083/data/userdetails/page`, we see the JSON response as below:
````json
{
    "content": [
        {
            "id": 1000,
            "firstName": "Abel",
            "lastName": "Doe",
            "createdDate": "2024-01-26"
        },
        {
            "id": 1001,
            "firstName": "Abuela",
            "lastName": "Marc",
            "createdDate": "2024-01-26"
        }
        // 18 more elements here
    ],
    "pageable": {
        "sort": {
            "empty": true,
            "sorted": false,
            "unsorted": true
        },
        "offset": 0,
        "pageNumber": 0,
        "pageSize": 20,
        "paged": true,
        "unpaged": false
    },
    "last": false,
    "totalElements": 45,
    "totalPages": 3,
    "size": 20,
    "number": 0
    // More paged elements
}
````
The endpoint returned us some pagination metadata like the `totalElements`, `totalPages`, `sort`, `size`.
**Here, we see that the application has a total of 45 records, which is divided into 3 pages where each page has a maximum of 20 records.
This JSON response gives us the first 20 elements from the List.**
As we can see, we were able to create paginated data successfully. In the next section, let's look at how to test this GET endpoint. 

### Testing Paginated Data using TestRestTemplate
In this section, let's write a Spring Boot test to understand how `@JsonCreator` helps us with deserialization when we call the GET endpoint using `TestRestTemplate`.
Here, the Spring Boot test uses the same H2 database to retrieve data:
````java
    @Test
    void givenGetData_whenRestTemplateExchange_thenReturnsPageOfUser() {

        ResponseEntity<Page<UserData>> responseEntity = 
        restTemplate.exchange(
                "http://localhost:" + port + "/data/userdetails/page", 
                HttpMethod.GET, null,
                new ParameterizedTypeReference<Page<UserData>>() {
                });

        assertEquals(200, responseEntity.getStatusCodeValue());
        Page<UserData> restPage = responseEntity.getBody();
        assertNotNull(restPage);

        assertEquals(45, restPage.getTotalElements());
        assertEquals(20, restPage.getSize());
    }
````
When we run this test, we see an error as below:
````text
org.springframework.http.converter.HttpMessageConversionException: 
Type definition error: [simple type, class org.springframework.data.domain.Page]; 
nested exception is com.fasterxml.jackson.databind.exc.InvalidDefinitionException: 
Cannot construct instance of `org.springframework.data.domain.Page` 
(no Creators, like default constructor, exist): 
abstract types either need to be mapped to concrete types, have custom deserializer, 
or contain additional type information
 at [Source: (org.springframework.util.StreamUtils$NonClosingInputStream); 
 line: 1, column: 1]
````
The error indicates that the response couldn't be mapped to concrete types.

Next, let's update the test to use `PageImpl` which is a concrete implementation of the `Page` interface as below:
````java
    @Test
    void givenGetData_whenRestTemplateExchange_thenReturnsPageOfUser() {

        addDataToDB();
        ResponseEntity<PageImpl<UserData>> responseEntity = restTemplate.exchange(
                "http://localhost:" + port + "/data/userdetails/page", 
                HttpMethod.GET, null,
                new ParameterizedTypeReference<PageImpl<UserData>>() {
                });

        assertEquals(200, responseEntity.getStatusCodeValue());
        PageImpl<UserData> restPage = responseEntity.getBody();
        assertNotNull(restPage);

        assertEquals(45, restPage.getTotalElements());
    }
````
When we run this test, we see this error now:
````text
org.springframework.http.converter.HttpMessageConversionException: 
Type definition error: [simple type, class org.springframework.data.domain.PageImpl]; 
nested exception is com.fasterxml.jackson.databind.exc.InvalidDefinitionException: 
Cannot construct instance of `org.springframework.data.domain.PageImpl` 
(no Creators, like default constructor, exist): cannot deserialize from Object value 
(no delegate- or property-based Creator)
 at [Source: (org.springframework.util.StreamUtils$NonClosingInputStream); line: 1]

````
The Jackson API was not able to map the pagination metadata into the `PageImpl` class. 
**This is because the `PageImpl` class provided by Spring Data does not provide a constructor that Jackson can use to directly map the pagination metadata.**


### @JsonCreator to the Rescue
To resolve this issue, let's create a class that implements `PageImpl` and use the `@JsonCreator` annotation and explicitly specify the mapping:
````java
@JsonIgnoreProperties(ignoreUnknown = true)
public class RestPageImpl<T> extends PageImpl<T> {

    
    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public RestPageImpl(@JsonProperty("content") List<T> content, 
                        @JsonProperty("number") int number,
                        @JsonProperty("size") int size, 
                        @JsonProperty("totalElements") Long totalElements,
                        @JsonProperty("pageable") JsonNode pageable, 
                        @JsonProperty("last") boolean last,
                        @JsonProperty("totalPages") int totalPages, 
                        @JsonProperty("sort") JsonNode sort,
                        @JsonProperty("numberOfElements") int numberOfElements) {
      super(content, PageRequest.of(number, numberOfElements), totalElements);
    }

}
````
Let's update the test to make use of the `RestPageImpl` class and rerun the test again:

````java
@Test
    void givenGetData_whenRestTemplateExchange_thenReturnsPageOfUser() {

        ResponseEntity<RestPageImpl<UserData>> responseEntity = restTemplate.exchange(
                "http://localhost:" + port + "/data/userdetails/page", 
                HttpMethod.GET, null,
                new ParameterizedTypeReference<RestPageImpl<UserData>>() {
                });

        assertEquals(200, responseEntity.getStatusCodeValue());
        RestPageImpl<UserData> restPage = responseEntity.getBody();
        assertNotNull(restPage);

        assertEquals(45, restPage.getTotalElements());
        assertEquals(20, restPage.getSize());
    }
````
Now, test runs successfully.

### Addressing Similar Scenarios
Another scenario where we would need to follow a similar approach is when we use a Spring client such as `RestTemplate` to consume an API 
that returns a paged response.
In such a case, we can use the `@JsonCreator` annotation explained in the example above to help Jackson deserialize the response.

## Conclusion
In this article, we took a closer look at how to make use of the `@JsonCreator` annotation including some examples.
Also, we created a simple Spring Boot application that uses pagination to demo how this annotation comes handy during the deserialization process.