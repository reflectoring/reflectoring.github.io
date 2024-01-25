---
title: "Serialize and Deserialize with Jackson's @JsonCreator in a Spring Boot Application"
categories: ["Spring"]
date: 2023-12-31 00:00:00 +1100
authors: ["ranjani"]
description: "Deserialize with JsonCreator annotation"
image: images/stock/0112-decision-1200x628-branded.jpg
url: jackson-jsoncreator
---

The FasterXML Jackson library is the most popular JSON parser in Java. Spring internally uses this API for JSON parsing. In the previous
article we covered the [@JsonView annotation](https://reflectoring.io/jackson-jsonview-tutorial/). In this article, we will look at how to use the **@JsonCreator** annotation.
For details on other commonly used Jackson annotations, refer [this article](https://reflectoring.io/jackson/).

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/jackson-jsoncreator" %}}

## What is @JsonCreator

The @JsonCreator annotation is a part of the [Jackson API](https://fasterxml.github.io/jackson-annotations/javadoc/2.13/com/fasterxml/jackson/annotation/JsonCreator.html) helps during deserialization. Deserialization is a process of converting a JSON string into a java object.
This is especially useful when we have multiple constructors/static factory methods for object creation. With the @JsonCreator annotation we can specify which constructor/static factory method to use during the deserialization process.

## Working with @JsonCreator annotation

In this section, we will look at a few use-cases of how this annotation works.
### Deserializing immutable objects
Java encourages creating immutable objects since they are thread-safe and easy to maintain. To get a better understanding of how to use immutable objects in java, refer to [this article.](https://reflectoring.io/java-immutables/)
Deserialization is the process of converting a stream of bytes into an Object.
Let's try to deserialize an immutable object `UserData` which is defined as below:
````java

@JsonIgnoreProperties(ignoreUnknown=true)
public class UserData {

    private final long id;

    private final String firstName;

    private final String lastName;

    private final String city;

    private LocalDate createdDate;


    public UserData(long id, String firstName, String lastName, String city) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.city = city;
        this.createdDate = LocalDate.now();
    }

    public UserData(long id, String firstName, String lastName, String city, LocalDate createdDate) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.city = city;
        this.createdDate = createdDate;
    }
    
    // Getters here...
}
````
Next, let's try to deserialize the object with Jackson's **ObjectMapper** class:
````java

    @Test
    public void deserializeImmutableObjects() throws JsonProcessingException {
        String userData = objectMapper.writeValueAsString(MockedUsersUtility.getMockedUserData());
        System.out.println("USER: " + userData);
        UserData user = objectMapper.readValue(userData, UserData.class);
        assertNotNull(user);

    }
    
````
we see this error:
````text
com.fasterxml.jackson.databind.exc.InvalidDefinitionException: Cannot construct instance of `com.reflectoring.userdetails.model.UserData` (no Creators, like default constructor, exist): cannot deserialize from Object value (no delegate- or property-based Creator)
 at [Source: (String)"{"id":100,"firstName":"Ranjani","lastName":"Harish","city":"Sydney","createdDate":"2024-01-16"}"; line: 1, column: 2]
````
This is because the ObjectMapper class by default looks for a no-arg constructor to set the values. **Since our java class is immutable, it has neither a no-arg constructor
nor setter methods to set values**. Also, we see that the `UserData` class has multiple constructors. Therefore, we would need a way to 
instruct the `ObjectMapper` class to use the right constructor for deserialization.
Let's modify our code to use the `@JsonCreator` annotation as:
````java
@JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public UserData(@JsonProperty("id") long id, @JsonProperty("firstName") String firstName,
                    @JsonProperty("lastName") String lastName, @JsonProperty("city") String city) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.city = city;
        this.createdDate = LocalDate.now();
    }
````
Now, when we run our test again, we can see that the deserialization is successful.
Let's look at the additional annotation we've added to get this working.
- By applying the `@JsonCreator` annotation to the constructor, the Jackson serializer knows which constructor is to be picked.
- `JsonCreator.Mode.PROPERTIES` indicates that the creator should match the incoming object with the constructor arguments. This is the most commonly used JsonCreator Mode.
- We annotate all the constructor arguments with `@JsonProperty` for the creator to map the arguments.

### Understanding all the available JsonCreator modes:
- JsonCreator.Mode.PROPERTIES : This is the most commonly used mode where every constructor/factory argument is annotated with either `@JsonProperty` or `@JacksonInject` to indicate the name of the property to bind to.
- JsonCreator.Mode.DELEGATING : Single-argument constructor/factory method without JsonProperty annotation for the argument. Here, Jackson first binds JSON into type of the argument, and then calls creator. This is often used in conjunction with JsonValue (used for serialization).
- JsonCreator.Mode.DEFAULT : If no mode or DEFAULT mode is chosen, Jackson internally decides which of PROPERTIES / DELEGATING mode to choose from.
- JsonCreator.Mode.DISABLED : This mode indicates the creator method is not to be used.


In the further sections, we will take a look at examples and how to use them effectively.

### Additional usecases:
**1. Only a single `@JsonCreator` annotation with the same mode can be applied in the same class**
Let's add `@JsonCreator` annotation with the same mode to two constructors in the same class as below:
````java
@JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public UserData(@JsonProperty("id") long id, @JsonProperty("firstName") String firstName,
                    @JsonProperty("lastName") String lastName, @JsonProperty("city") String city) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.city = city;
        this.createdDate = LocalDate.now();
    }

    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public UserData(@JsonProperty("id") long id, @JsonProperty("firstName") String firstName,
                    @JsonProperty("lastName") String lastName, @JsonProperty("city") String city, @JsonProperty("createdDate") LocalDate createdDate) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.city = city;
        this.createdDate = createdDate;
    }
````
When we try to run our test, it will fail with error:
````text
com.fasterxml.jackson.databind.exc.InvalidDefinitionException: Conflicting property-based creators: already had explicitly marked creator [constructor for `com.reflectoring.userdetails.model.UserData` (4 args), annotations: {interface com.fasterxml.jackson.annotation.JsonCreator=@com.fasterxml.jackson.annotation.JsonCreator(mode=PROPERTIES)}, encountered another: [constructor for `com.reflectoring.userdetails.model.UserData` (5 args), annotations: {interface com.fasterxml.jackson.annotation.JsonCreator=@com.fasterxml.jackson.annotation.JsonCreator(mode=PROPERTIES)}
 at [Source: (String)"{"id":100,"firstName":"Ranjani","lastName":"Harish","city":"Sydney","createdDate":"2024-01-16"}"; line: 1, column: 1]
````

**2. Using @JsonProperty with @JsonCreator for the PROPERTIES mode**
To understand this lets remove the @JsonProperty annotation set to the constructor arguments:
````java
@JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public UserData(long id, String firstName,
                    String lastName, String city) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.city = city;
        this.createdDate = LocalDate.now();
    }
````
When we run our test, we see this error:
````text
com.fasterxml.jackson.databind.exc.InvalidDefinitionException: Invalid type definition for type `com.reflectoring.userdetails.model.UserData`: Argument #0 of constructor [constructor for `com.reflectoring.userdetails.model.UserData` (4 args), annotations: {interface com.fasterxml.jackson.annotation.JsonCreator=@com.fasterxml.jackson.annotation.JsonCreator(mode=PROPERTIES)} has no property name (and is not Injectable): can not use as property-based Creator
 at [Source: (String)"{"id":100,"firstName":"Ranjani","lastName":"Harish","city":"Sydney","createdDate":"2024-01-16"}"; line: 1, column: 1]
````
which indicates that adding the `@JsonProperty` annotation is mandatory. As we can see the Json property names and the deserialized object property names are exactly the same.
In such cases there is an alternative way, where we can skip using the `@JsonProperty` annotation. Let's modify our `ObjectMapper` bean:
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
Now if we run our tests, we can see that the test passes even without the use of `@JsonProperty`. This is because we registed the Jackson Parameters module by adding
**mapper.registerModule(new ParameterNamesModule())**. This is a Jackson module that allows accessing parameter names without explicitly specifying the `@JsonProperty` annotation.
{{% info title="Additional Notes" %}}
Another option is to register the `Jdk8Module` which includes the `ParameterNamesModule` as mentioned [in the documentation](https://github.com/FasterXML/jackson-modules-java8)
  {{% /info %}}

**3. Apply @JsonCreator to static factory methods**
Another way of creating immutable java objects is via static factory methods. We can apply the `@JsonCreator` annotations to static factory methods too.
````java
    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public static UserData getUserData(long id, String firstName,
                                       String lastName, String city) {
        return new UserData(id, firstName, lastName, city, LocalDate.now());
    }
````
Here, since we've registered the `ParametersNamesModule`, we need not add the `@JsonProperty` annotation.

**4. Use a DELEGATING JsonCreator mode**
Let's see how to deserialize an object using the DELEGATING JsonCreator Mode.
````java
@JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public UserData(Map<String,String> map) throws JsonProcessingException {
        this.id = Long.parseLong(map.get("id"));
        this.firstName = map.get("firstName");
        this.lastName = map.get("lastName");
        this.city = map.get("city");
    }
````
When we pass a serialized Map object to the `ObjectMapper` class, it will automatically make use of the DELEGATING mode to create the `UserData` object.
````java
    public static Map<String, String> getMockedUserDataMap() {
        return Map.of("id", "100", "firstName","Ranjani", "lastName","Harish", "city","Sydney");
    }
        
    @Test
    public void jsonCreatorWithDelegatingMode3() throws JsonProcessingException {
        String userDataJson = objectMapper.writeValueAsString(getMockedUserDataMap());
        assertNotNull(userDataJson);
        UserData data = objectMapper.readValue(userDataJson, UserData.class);
    }
````

