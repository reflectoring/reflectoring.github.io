---
title: "One-Stop Guide to Mapping with MapStruct"
categories: ["Java"]
date: 2022-05-26 00:00:00 +1100 
modified: 2022-05-26 00:00:00 +1100
authors: [arpendu]
excerpt: "A comprehensive guide to implement easy and fast mapping between the Java beans at compile time."
image: images/stock/0123-mind-map-1200x628.jpg
url: one-stop-guide-mapstruct
---

When we define multi-layered architectures, we often tend to represent data differently at each layer. The interactions between each layer become quite tedious and cumbersome. Let us consider if we have a client-server application that requires us to pass different objects at different layers, then it would simply require a lot of boilerplate code to handle the interactions, data-type conversions, etc. If we have an object or payload that takes few fields, then this boilerplate code would be fine to implement once. But if we have an object that accepts more than 20-30 fields and many nested objects with a good amount of fields again within it, then this code becomes quite tedious.

{{% github "https://github.com/thombergs/code-examples/tree/master/mapstruct" %}}

## Why should we use a Mapper?

The problem discussed above can be reduced by introducing the *DTO(Data Transfer Object)* pattern, which requires defining simple classes to transfer data between layers. A server can define a DTO that would return the API response payload which can be different from the persisted *Entity* objects so that it doesn’t end up exposing the schema of the *Data Access Object* layer. Thus client applications can accept a data object in a custom-defined DTO with required fields. Still, the DTO pattern heavily depends on the mappers or the logic that converts the incoming data into DTO or vice-versa. This involves boilerplate code and introduces overheads that can’t be overlooked, especially when dealing with large data.

This is where we seek for annotation processor which can easily convert the Java beans by automating it as much as possible. In this article, we will take a look at *MapStruct*, which is an annotation processor plugged into the Java compiler that can automatically generate mappers at build-time. In comparison to other Mapping frameworks, MapStruct generates bean mappings at compile-time which ensures high performance and enables fast developer feedback and thorough error checking.

## MapStruct Dependency Setup

MapStruct is a Java-based annotation processor which can be configured using Maven, Gradle, or Ant. It comprises the following libraries:

* `org.mapstruct:mapstruct`: This takes care of the core implementation behind the primary annotation of  `@Mapping`.
* `org.mapstruct:mapstruct-processor`: This is the annotation processor which generates mapper implementations for the above mapping annotations.

### Maven

To configure MapStruct for a Maven based project, we need to add following into the `pom.xml`:

```xml
    <properties>
        <org.mapstruct.version>1.4.2.Final</org.mapstruct.version>
        <maven.compiler.source>8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>${org.mapstruct.version}</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>1.8</source>
                    <target>1.8</target>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.mapstruct</groupId>
                            <artifactId>mapstruct-processor</artifactId>
                            <version>${org.mapstruct.version}</version>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>
        </plugins>
    </build>
```

### Gradle

In order to configure MapStruct in a Gradle project, we need to add following to the `build.gradle` file:

```groovy
plugins {
    id 'net.ltgt.apt' version '0.20'
}
1.4.2.Final
apply plugin: 'net.ltgt.apt-idea'
apply plugin: 'net.ltgt.apt-eclipse'

ext {
    mapstructVersion = "1.4.2.Final"
}

dependencies {
    ...
    implementation "org.mapstruct:mapstruct:${mapstructVersion}"
    annotationProcessor "org.mapstruct:mapstruct-processor:${mapstructVersion}"

    // If we are using mapstruct in test code
    testAnnotationProcessor "org.mapstruct:mapstruct-processor:${mapstructVersion}"
}
```

The `net.ltgt.apt` plugin is responsible for the annotation processing. We can apply the `apt-idea` and `apt-eclipse` plugins depending on the IDE that we are using.

### Configuration Options

MapStruct allows to pass various annotation processor options or arguments to javac directly in the form `-Akey=value`. The Maven based configuration accepts build definitions with compiler args being passed explicitly:

```xml
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>1.8</source>
                    <target>1.8</target>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.mapstruct</groupId>
                            <artifactId>mapstruct-processor</artifactId>
                            <version>${org.mapstruct.version}</version>
                        </path>
                    </annotationProcessorPaths>
                    <!-- due to problem in maven-compiler-plugin, for verbose mode 
						add showWarnings -->
                    <showWarnings>true</showWarnings>
                    <compilerArgs>
                        <arg>
                            -Amapstruct.suppressGeneratorTimestamp=true
                        </arg>
                        <arg>
                            -Amapstruct.suppressGeneratorVersionInfoComment=true
                        </arg>
                        <arg>
                            -Amapstruct.verbose=true
                        </arg>
                        <arg>
                            -Amapstruct.defaultComponentModel=default
                        </arg>
                    </compilerArgs>
                </configuration>
            </plugin>
        </plugins>
    </build>
```

Similarly, Gradle accepts compiler arguments in the following format:

```groovy
compileJava {
    options.compilerArgs += [
        '-Amapstruct.suppressGeneratorTimestamp=true',
        '-Amapstruct.suppressGeneratorVersionInfoComment=true',
        '-Amapstruct.verbose=true'
        '-Amapstruct.defaultComponentModel=default'
    ]
}
```

We just took four example configurations here. But it supports a lot of other configuration options as well. Let’s look at these four options:

* `mapstruct.suppressGeneratorTimestamp`: the creation of a time stamp in the `@Generated` annotation in the generated mapper classes is suppressed with this option.
* `mapstruct.suppressGeneratorVersionInfoComment`: the creation of the comment attribute in the `@Generated` annotation in the generated mapper classes is suppressed with this option.
* `mapstruct.verbose`: It logs its major decisions based upon this option.
* `mapstruct.defaultComponentModel`: It accepts component models like *default*, *cdi*, *spring*, or *jsr330* based on which mapper the code needs to be generated finally at compile time.

### Third-Party API Integration with Lombok

Most of us would like to use MapStruct alongside *Project Lombok* to take advantage of automatically generated getters, setters, and constructors to generate the mapper implementation. But Lombok 1.18.16 introduced breaking changes due to which we face compilation issues of Lombok and MapStruct modules. Hence an additional annotation processor lombok-mapstruct-binding must be added otherwise MapStruct stops working with Lombok.

So a final Maven based configuration with Lombok would something like below:

```xml
    <properties>
        <org.mapstruct.version>1.4.2.Final</org.mapstruct.version>
        <org.projectlombok.version>1.18.24</org.projectlombok.version>
        <maven.compiler.source>8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>${org.mapstruct.version}</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>${org.projectlombok.version}</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>1.8</source>
                    <target>1.8</target>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.mapstruct</groupId>
                            <artifactId>mapstruct-processor</artifactId>
                            <version>${org.mapstruct.version}</version>
                        </path>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                            <version>${org.projectlombok.version}</version>
                        </path>
                        <!-- additional annotation processor required as of Lombok 1.18.16 -->
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok-mapstruct-binding</artifactId>
                            <version>0.2.0</version>
                        </path>
                    </annotationProcessorPaths>
                    <!-- due to problem in maven-compiler-plugin, for verbose mode add showWarnings -->
                    <showWarnings>true</showWarnings>
                    <compilerArgs>
                        <arg>
                            -Amapstruct.suppressGeneratorTimestamp=true
                        </arg>
                        <arg>
                            -Amapstruct.suppressGeneratorVersionInfoComment=true
                        </arg>
                        <arg>
                            -Amapstruct.verbose=true
                        </arg>
                        <arg>
                            -Amapstruct.defaultComponentModel=default
                        </arg>
                    </compilerArgs>
                </configuration>
            </plugin>
        </plugins>
    </build>
```

Similarly, a final `build.gradle`  would look something like below:

```groovy
plugins {
    id 'net.ltgt.apt' version '0.20'
}
1.4.2.Final
apply plugin: 'net.ltgt.apt-idea'
apply plugin: 'net.ltgt.apt-eclipse'

ext {
    mapstructVersion = "1.4.2.Final"
    projectLombokVersion = "1.18.24"
}

compileJava {
    options.compilerArgs += [
        '-Amapstruct.suppressGeneratorTimestamp=true',
        '-Amapstruct.suppressGeneratorVersionInfoComment=true',
        '-Amapstruct.verbose=true'
        '-Amapstruct.defaultComponentModel=default'
    ]
}

dependencies {
    implementation "org.mapstruct:mapstruct:${mapstructVersion}"
    implementation "org.projectlombok:lombok:${projectLombokVersion}"
    annotationProcessor "org.projectlombok:lombok-mapstruct-binding:0.2.0"
    annotationProcessor "org.mapstruct:mapstruct-processor:${mapstructVersion}"
    annotationProcessor "org.projectlombok:lombok:${projectLombokVersion}"
}
```

## Mapper Definition

We will now take a look into various types of bean mappers using MapStruct and try out whatever options are available.

### Basic Mapping Example

Let’s start with a very basic mapping example. We will define two Objects, one with the name `BasicUser` and another with the name `BasicUserDTO`:

```java
@Data
@Builder
@ToString
public class BasicUser {
    private int id;
    private String name;
}
```

```java
@Data
@Builder
@ToString
public class BasicUserDTO {
    private int id;
    private String name;
}
```

Now to create a mapper between the two, we will simply define an interface named `BasicMapper` and annotate it with `@Mapper` annotation so that MapStruct would automatically be aware that it needs to create a mapper implementation between the two objects.

```java
@Mapper
public interface BasicMapper {
    BasicMapper INSTANCE = Mappers.getMapper(BasicMapper.class);
    BasicUserDTO convert(BasicUser user);
}
```

The `INSTANCE` is the entry-point to our mapper instance once the implementation is auto-generated. We have simply defined a `convert` method in the interface which would accept a `BasicUser` object and return a `BasicUserDTO` object after conversion. As we can notice both the objects have the same object property names and data type, this is enough for the MapStruct to map between them. If a property has a different name in the target entity, its name can be specified via the `@Mapping` annotation. We will look at this in our upcoming examples.

When we compile/build the application, the MapStruct annotation processor plugin will pick the `BasicMapper` interface and create an implementation for it which would look something like the below:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class BasicMapperImpl implements BasicMapper {

    @Override
    public BasicUserDTO convert(BasicUser user) {
        if ( user == null ) {
            return null;
        }

        BasicUserDTOBuilder basicUserDTO = BasicUserDTO.builder();

        basicUserDTO.id( user.getId() );
        basicUserDTO.name( user.getName() );

        return basicUserDTO.build();
    }
}
```

We might have noticed that the `BasicMapperImpl` has picked up the builder method since it’s annotated in the object. But if that is not defined then it will instantiate with the `new` keyword and a constructor.

Now we just need to instantiate the conversion mapping by something like the below:

```java
log.info("MapStruct Basic Mapping conversion started !!");

BasicUser user = BasicUser
        .builder()
        .id(1)
        .name("John Doe")
        .build();
log.info("User details: {}", user);

BasicUserDTO dto = BasicMapper.INSTANCE.convert(user);
log.info("UserDTO details: {}", dto);

log.info("MapStruct Basic Mapping conversion completed !!");
```

### Adding Custom Method inside Mappers

Sometimes we would like to implement a specific mapping manually by defining our logic while transforming from one object to another. For that, we can implement those custom methods directly in our mapper interface by defining a `default` method.

Let’s define a DTO object which is different from a `User` object. We will name it `PersonDTO`:

```java
@Data
@Builder
@ToString
public class PersonDTO {
    private String id;
    private String firstName;
    private String lastName;
}
```

As we can notice the data type for the id field is different from the User object and the name field needs to be broken into `firstName` and `lastName`. Hence, we will define our custom default method in the previous mapper interface directly with our logic:

```java
@Mapper
public interface BasicMapper {
    BasicMapper INSTANCE = Mappers.getMapper(BasicMapper.class);
    BasicUserDTO convert(BasicUser user);
    default PersonDTO convertCustom(BasicUser user) {
        return PersonDTO
                .builder()
                .id(String.valueOf(user.getId()))
                .firstName(user.getName().substring(0, user.getName().indexOf(" ")))
                .lastName(user.getName().substring(user.getName().indexOf(" ") + 1))
                .build();
    }
}
```

Now when we instantiate the mapper, this gets converted to a `PersonDTO` object.

```java
PersonDTO personDto = BasicMapper.INSTANCE.convertCustom(user);
```

As an alternative, a mapper can also be defined as an abstract class and implement the above custom method directly in that class. MapStruct will still generate an implementation method for all the abstract methods:

```java
@Mapper
public abstract class BasicMapper {

    public abstract BasicUserDTO convert(BasicUser user);

    public PersonDTO convertCustom(BasicUser user) {
        return PersonDTO
                .builder()
                .id(String.valueOf(user.getId()))
                .firstName(user.getName().substring(0, user.getName().indexOf(" ")))
                .lastName(user.getName().substring(user.getName().indexOf(" ") + 1))
                .build();
    }
}
```

 An added advantage of this strategy over declaring default methods is that additional fields can be declared directly in the mapper class.

### Mapping with Several Source Fields

Suppose if we want to combine several entities into a single data transfer object, then MapStruct supports the mapping method with several source fields. For example, we will create two objects additionally like `Education` and `Address`:

```java
@Data
@Builder
@ToString
public class Education {
    private String degreeName;
    private String institute;
    private Integer yearOfPassing;
}
```

```java
@Data
@Builder
@ToString
public class Address {
    private String houseNo;
    private String landmark;
    private String city;
    private String state;
    private String country;
    private String zipcode;
}
```

Now we will map these two objects along with User object to `PersonDTO` entity:

```java
@Mapping(source = "user.id", target = "id")
@Mapping(source = "user.name", target = "firstName")
@Mapping(source = "education.degreeName", target = "educationalQualification")
@Mapping(source = "address.city", target = "residentialCity")
@Mapping(source = "address.country", target = "residentialCountry")
PersonDTO convert(BasicUser user, Education education, Address address);
```

When we build the code now, the mapstruct annotation processor will generate the following method:

```java
    @Override
    public PersonDTO convert(BasicUser user,
                             Education education,
                             Address address) {
        if ( user == null
            && education == null
            && address == null ) {
            return null;
        }

        PersonDTOBuilder personDTO = PersonDTO.builder();

        if ( user != null ) {
            personDTO.id(String.valueOf(user.getId()));
            personDTO.firstName(user.getName());
        }
        if ( education != null ) {
            personDTO.educationalQualification(education.getDegreeName());
        }
        if ( address != null ) {
            personDTO.residentialCity(address.getCity());
            personDTO.residentialCountry(address.getCountry());
        }

        return personDTO.build();
    }
```

### Mapping Nested Bean to Target Field

We would often see that larger POJOs not only have primitive data types but other classes, lists, or sets as well. Thus we need to map those nested beans into the final DTO.

Let’s define a few more DTOs and add all of this to `PersonDTO`:

```java
@Data
@Builder
@ToString
public class ManagerDTO {
    private int id;
    private String name;
}
```

```java
@Data
@Builder
@ToString
public class PersonDTO {
    private String id;
    private String firstName;
    private String lastName;
    private String educationalQualification;
    private String residentialCity;
    private String residentialCountry;
    private String designation;
    private long salary;
    private EducationDTO education;
    private List<ManagerDTO> managerList;
}
```

Now we will define an entity named `Manager` and add it to the `BasicUser` entity:

```java
@Data
@Builder
@ToString
public class Manager {
    private int id;
    private String name;
}
```

```java
@Data
@Builder
@ToString
public class BasicUser {
    private int id;
    private String name;
    private List<Manager> managerList;
}
```

Before we update our `UserMapper` interface, let’s define the `ManagerMapper` interface to map the `Manager` entity to `ManagerDTO` class:

```java
@Mapper
public interface ManagerMapper {
    ManagerMapper INSTANCE = Mappers.getMapper(ManagerMapper.class);
    ManagerDTO convert(Manager manager);
}
```

Now we can update our `UserMapper` interface to include list of managers for a given user.

```java
@Mapper(uses = {ManagerMapper.class})
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);
    ...

    @Mapping(source = "user.id", target = "id")
    @Mapping(source = "user.name", target = "firstName")
    @Mapping(source = "education.degreeName", target = "educationalQualification")
    @Mapping(source = "address.city", target = "residentialCity")
    @Mapping(source = "address.country", target = "residentialCountry")
    PersonDTO convert(BasicUser user, Education education, Address address);
}
```

As we can see we have not added any `@Mapping` annotation to map managers. Instead, we have set the `uses` flag for `@Mapper` annotation so that while generating the mapper implementation for the `UserMapper` interface, MapStruct will also convert the `Manager` entity to `ManagerDTO`. This creates the following implementation class for the `UserMapper` interface:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class UserMapperImpl implements UserMapper {

    private final ManagerMapper managerMapper = Mappers.getMapper( ManagerMapper.class );

    ...

    @Override
    public PersonDTO convert(BasicUser user,
                             Education education,
                             Address address,
                             Employment employment) {
        if ( user == null && education == null
            && address == null ) {
            return null;
        }

        PersonDTOBuilder personDTO = PersonDTO.builder();

        if ( user != null ) {
            personDTO.id( String.valueOf( user.getId() ) );
            personDTO.firstName( user.getName() );
            personDTO.managerList(
                managerListToManagerDTOList( user.getManagerList() ) );
        }
        if ( education != null ) {
            personDTO.education( educationToEducationDTO( education ) );
            personDTO.educationalQualification(
                education.getDegreeName() );
        }
        if ( address != null ) {
            personDTO.residentialCity( address.getCity() );
            personDTO.residentialCountry( address.getCountry() );
        }

        return personDTO.build();
    }

    protected List<ManagerDTO> managerListToManagerDTOList(List<Manager> list) {
        if ( list == null ) {
            return null;
        }

        List<ManagerDTO> list1 = new ArrayList<ManagerDTO>( list.size() );
        for ( Manager manager : list ) {
            list1.add( managerMapper.convert( manager ) );
        }

        return list1;
    }
}
```

Now we can see that a new mapper - `managerListToManagerDTOList()` has been auto-generated along with `convert()` mapper. This has been added explicitly since we have added `ManagerMapper` to the `UserMapper` interface.

Let’s suppose we have to map an object to an internal object of the final payload, then we can define `@Mapping` with direct reference to source and target. For example, we will create `EmploymentDTO` which would look something like the below:

```java
@Data
@Builder
@ToString
public class EducationDTO {
    private String degree;
    private String college;
    private Integer passingYear;
}
```

Now we need to map this to `education` field in `PersonDTO`. For that we will update our mapper in the following way:

```java
@Mapping(source = "user.id", target = "id")
@Mapping(source = "user.name", target = "firstName")
@Mapping(source = "education.degreeName", target = "educationalQualification")
@Mapping(source = "address.city", target = "residentialCity")
@Mapping(source = "address.country", target = "residentialCountry")
@Mapping(source = "education.degreeName", target = "education.degree")
@Mapping(source = "education.institute", target = "education.college")
@Mapping(source = "education.yearOfPassing", target = "education.passingYear")
PersonDTO convert(BasicUser user, Education education, Address address, Employment employment);
```

If we see the implementation class after compiling/building the application we would see that a new mapper `educationToEducationDTO()` is added along side other mappers:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class UserMapperImpl implements UserMapper {

    private final ManagerMapper managerMapper = Mappers.getMapper( ManagerMapper.class );

    ...

    @Override
    public PersonDTO convert(BasicUser user,
                             Education education,
                             Address address,
                             Employment employment) {
        if ( user == null && education == null
            && address == null && employment == null ) {
            return null;
        }

        PersonDTOBuilder personDTO = PersonDTO.builder();

        if ( user != null ) {
            personDTO.id( String.valueOf( user.getId() ) );
            personDTO.firstName( user.getName() );
            personDTO.managerList(
                managerListToManagerDTOList( user.getManagerList() ) );
        }
        if ( education != null ) {
            personDTO.education( educationToEducationDTO( education ) );
            personDTO.educationalQualification(
                education.getDegreeName() );
        }
        if ( address != null ) {
            personDTO.residentialCity( address.getCity() );
            personDTO.residentialCountry( address.getCountry() );
        }
        if ( employment != null ) {
            personDTO.designation( employment.getDesignation() );
            personDTO.salary( employment.getSalary() );
        }

        return personDTO.build();
    }

    protected EducationDTO educationToEducationDTO(Education education) {
        if ( education == null ) {
            return null;
        }

        EducationDTOBuilder educationDTO = EducationDTO.builder();

        educationDTO.degree( education.getDegreeName() );
        educationDTO.college( education.getInstitute() );
        educationDTO.passingYear( education.getYearOfPassing() );

        return educationDTO.build();
    }

    protected List<ManagerDTO> managerListToManagerDTOList(List<Manager> list) {
        if ( list == null ) {
            return null;
        }

        List<ManagerDTO> list1 = new ArrayList<ManagerDTO>( list.size() );
        for ( Manager manager : list ) {
            list1.add( managerMapper.convert( manager ) );
        }

        return list1;
    }
}
```

Sometimes we won’t explicitly name all properties from nested source bean. In that case MapStruct allows to use `"."` as target. This will tell the mapper to map every property from source bean to target object. This would look something like below:

```java
@Mapping(source = "user.id", target = "id")
@Mapping(source = "user.name", target = "firstName")
@Mapping(source = "education.degreeName", target = "educationalQualification")
@Mapping(source = "address.city", target = "residentialCity")
@Mapping(source = "address.country", target = "residentialCountry")
@Mapping(source = "education.degreeName", target = "education.degree")
@Mapping(source = "education.institute", target = "education.college")
@Mapping(source = "education.yearOfPassing", target = "education.passingYear")
@Mapping(source = "employment", target = ".")
PersonDTO convert(BasicUser user, Education education, Address address, Employment employment);
```

This kind of notation can be very useful when mapping hierarchical objects to flat objects and vice versa.

### Updating Existing Instances

Sometimes, we would like to update an existing DTO with mapping at a later point of time. In those cases, we need mappings which do not create a new instance of the target type. Instead it updates an existing instance of that similar type. This sort of mapping can be achieved by adding a parameter for the target object and marking this parameter with `@MappingTarget` something like below:

```java
@Mapping(source = "user.id", target = "id")
@Mapping(source = "user.name", target = "firstName")
@Mapping(source = "education.degreeName",
         target = "education.degree")
@Mapping(source = "education.institute",
         target = "education.college")
@Mapping(source = "education.yearOfPassing",
         target = "education.passingYear")
@Mapping(source = "employment", target = ".")
PersonDTO convert(BasicUser user,
                  Education education,
                  Address address,
                  Employment employment);

@Mapping(source = "education.degreeName",
         target = "educationalQualification")
@Mapping(source = "address.city", target = "residentialCity")
@Mapping(source = "address.country", target = "residentialCountry")
void updateExisting(BasicUser user,
                    Education education,
                    Address address,
                    Employment employment,
                    @MappingTarget PersonDTO personDTO);
```

Now this will create the following implementation with the `updateExisting()` interface:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class UserMapperImpl implements UserMapper {

    private final ManagerMapper managerMapper = Mappers.getMapper(
        ManagerMapper.class );

    ...

    @Override
    public PersonDTO convert(BasicUser user,
                             Education education,
                             Address address,
                             Employment employment) {
        if ( user == null && education == null
            && address == null && employment == null ) {
            return null;
        }

        PersonDTOBuilder personDTO = PersonDTO.builder();

        if ( user != null ) {
            personDTO.id( String.valueOf( user.getId() ) );
            personDTO.firstName( user.getName() );
            personDTO.managerList(
                managerListToManagerDTOList( user.getManagerList() ) );
        }
        if ( education != null ) {
            personDTO.education( educationToEducationDTO( education ) );
        }
        if ( employment != null ) {
            personDTO.designation( employment.getDesignation() );
            personDTO.salary( employment.getSalary() );
        }

        return personDTO.build();
    }

    @Override
    public void updateExisting(BasicUser user,
                               Education education,
                               Address address,
                               Employment employment,
                               PersonDTO personDTO) {
        if ( user == null && education == null
            && address == null && employment == null ) {
            return;
        }

        if ( user != null ) {
            personDTO.setId( String.valueOf( user.getId() ) );
            if ( personDTO.getManagerList() != null ) {
                List<ManagerDTO> list = managerListToManagerDTOList(
                    user.getManagerList() );
                if ( list != null ) {
                    personDTO.getManagerList().clear();
                    personDTO.getManagerList().addAll( list );
                }
                else {
                    personDTO.setManagerList( null );
                }
            }
            else {
                List<ManagerDTO> list = managerListToManagerDTOList(
                    user.getManagerList() );
                if ( list != null ) {
                    personDTO.setManagerList( list );
                }
            }
        }
        if ( education != null ) {
            personDTO.setEducationalQualification( education.getDegreeName() );
        }
        if ( address != null ) {
            personDTO.setResidentialCity( address.getCity() );
            personDTO.setResidentialCountry( address.getCountry() );
        }
        if ( employment != null ) {
            personDTO.setDesignation( employment.getDesignation() );
            personDTO.setSalary( employment.getSalary() );
        }
    }
    
    ...
}
```

If someone wants to call this method then this can be defined in the following way:

```java
PersonDTO personDTO = UserMapper.INSTANCE.convert(user,
                                                  education,
                                                  address,
                                                  employment);
UserMapper.INSTANCE.updateExisting(user,
                                   education,
                                   address,
                                   employment,
                                   personDTO);
```

### Inherit Configuration

In continuation with the above example, instead of repeating the configurations for both the mappers, we can use  the `@InheritConfiguration` annotation. By annotating a method with the `@InheritConfiguration` annotation, MapStruct will look for an already configured method whose configuration can be applied to this one as well. Typically, this annotation is used to update methods after a mapping method is defined:

```java
@Mapper
public interface ManagerMapper {
    ManagerMapper INSTANCE = Mappers.getMapper(ManagerMapper.class);
    ManagerDTO convert(Manager manager);

    @InheritConfiguration
    void updateExisting(Manager manager, @MappingTarget ManagerDTO managerDTO);
}
```

This will generate an implementation something like below:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class ManagerMapperImpl implements ManagerMapper {

    @Override
    public ManagerDTO convert(Manager manager) {
        if ( manager == null ) {
            return null;
        }

        ManagerDTOBuilder managerDTO = ManagerDTO.builder();

        managerDTO.id( manager.getId() );
        managerDTO.name( manager.getName() );

        return managerDTO.build();
    }

    @Override
    public void updateExisting(Manager manager, ManagerDTO managerDTO) {
        if ( manager == null ) {
            return;
        }

        managerDTO.setId( manager.getId() );
        managerDTO.setName( manager.getName() );
    }
}
```

### Inverse Mappings

If we want to define a bi-directional mapping like Entity to DTO and DTO to Entity and if the mapping definition for the forward method and the reverse method is the same, then we can simply inverse the configuration by defining `@InheritInverseConfiguration` annotation in the following pattern:

```java
@Mapper
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);
    BasicUserDTO convert(BasicUser user);

    @InheritInverseConfiguration
    BasicUser convert(BasicUserDTO userDTO);
}
```

This can be used for straightforward mappings between entity and DTO.

### Exception Handling during Mapping

Exceptions are unavoidable, hence, MapStruct provides support to handle exceptions by making the life of developers quite easy. Let’s say if we want to validate the id field for any invalid values, then we can define a utility class named as `Validator` :

```java
public class Validator {
    public int validateId(int id) throws ValidationException {
        if(id == -1){
            throw new ValidationException("Invalid ID value");
        }
        return id;
    }
}
```

Next, we can define an exception class, `ValidationException` which we will use in our mapper:

```java
public class ValidationException extends RuntimeException {

    public ValidationException(String message, Throwable cause) {
        super(message, cause);
    }

    public ValidationException(String message) {
        super(message);
    }
}
```

Finally, we will update our `UserMapper` by including the `Validator` class and throw `ValidationException` wherever we are mapping the id fields:

```java
@Mapper(uses = {ManagerMapper.class, Validator.class})
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);
    BasicUserDTO convert(BasicUser user) throws ValidationException;

    @InheritInverseConfiguration
    BasicUser convert(BasicUserDTO userDTO) throws ValidationException;
    ...
}
```

The implementation class after generation would look something like below:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class UserMapperImpl implements UserMapper {

    private final ManagerMapper managerMapper = Mappers.getMapper(
        ManagerMapper.class );
    private final Validator validator = new Validator();

    @Override
    public BasicUserDTO convert(BasicUser user) throws ValidationException {
        if ( user == null ) {
            return null;
        }

        BasicUserDTOBuilder basicUserDTO = BasicUserDTO.builder();

        basicUserDTO.id( validator.validateId( user.getId() ) );
        basicUserDTO.name( user.getName() );

        return basicUserDTO.build();
    }

    @Override
    public BasicUser convert(BasicUserDTO userDTO) throws ValidationException {
        if ( userDTO == null ) {
            return null;
        }

        BasicUserBuilder basicUser = BasicUser.builder();

        basicUser.id( validator.validateId( userDTO.getId() ) );
        basicUser.name( userDTO.getName() );

        return basicUser.build();
    }
    
    ...
}
```

MapStruct has automatically set the id of the mapper objects with the result of the `Validator` instance. It has added a `throws` clause for the method as well.

## Mapper Retrieval Strategies

To execute and call the mapper methods, we need to instantiate the mapper instance or the constructor. MapStruct provides various strategies to instantiate and access the generated mappers. Let’s look into each of them.

### Mappers Factory

If we are not using MapStruct as a Dependency Injection framework, then the mapper instances can be retrieved using the `Mappers` class. We need to invoke the `getMappers()` method from the factory passing the interface type of the mapper:

```java
UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);
```

This pattern is one of the simplest ways to access the mapper methods. It can be accessed in the following way:

```java
PersonDTO personDTO = UserMapper.INSTANCE.convert(user,
                                                  education,
                                                  address,
                                                  employment);
```

One thing to note is that the mappers generated by MapStruct are stateless and thread-safe. Thus it can be safely retrieved from several threads at the same time.

### Dependency Injection

If we want to use MapStruct in a dependency injection framework, then we need to access the mapper objects via dependency injection strategies and not use the `Mappers` class. MapStruct supports the component model for *CDI*(Contexts and Dependency Injection for Java EE) and the *Spring framework*.

Let’s update our `UserMapper` class to work with Spring:

```java
@Mapper(componentModel = "spring", uses = {ManagerMapper.class, Validator.class})
public interface UserMapper {
    
    ...
}
```

Now the generated implementation class would have `@Component` annotation automatically added:

```java
@Component
public class UserMapperImpl implements UserMapper {
	...
}
```

Now when we define our Controller or Service layer, we can `@Autowire` it to access its methods:

```java
@Controller
public class UserController() {
    @Autowired
    private UserMapper userMapper;
}
```

Similarly, if we are not using Spring framework, MapStruct has the support for [CDI](https://docs.oracle.com/javaee/6/tutorial/doc/giwhl.html) as well:

```java
@Mapper(componentModel = "cdi", uses = {ManagerMapper.class, Validator.class})
public interface UserMapper {
    
    ...
}
```

Then the generated mapper implementation will be annotated with `@ApplicationScoped` annotation:

```java
@ApplicationScoped
public class UserMapperImpl implements UserMapper {
	...
}
```

Finally, we can obtain the constructor using the `@Inject` annotation:

```java
@Inject
private UserMapper userMapper;
```

## Data Type Conversion

We won’t always find a mapping attribute in a payload having the same data type for the source and target fields. For example, we might have an instance where we would need to map an attribute of type `int` to `String` or `long`. We will take a quick look at how we can deal with such types of data conversions.

### Implicit Type Conversion

MapStruct explicitly takes care of type conversion automatically. If we want to transform an attribute of type `int` to `String`, then MapStruct converts it without defining anything in the mapper interface using `String.valueOf(int)` method. Similarly, it takes care of type conversion between primitive and wrapper types, enum types, and String, or `BigDecimal/BigInteger` type to `String`.

Sometimes we would like to define a particular format while converting between certain types. For example, let us say we want to convert the field `salary` from `long` to `String` in the decimal form of US dollars:

```java
@Mapping(source = "employment.salary",
         target = "salary",
         numberFormat = "$#.00")
PersonDTO convert(BasicUser user,
                  Education education,
                  Address address,
                  Employment employment);
```

Then the generated mapper implementation class would be something like below:

```java
personDTO.setSalary( new DecimalFormat( "$#.00" ).format(
                employment.getSalary() ) );
```

Similarly, let’s say if we want to convert a date type in `String` format to `LocalDate` format, then we can define a mapper in the following format:

```java
@Mapping(source = "dateOfBirth",
         target = "dateOfBirth",
         dateFormat = "dd/MMM/yyyy")
ManagerDTO convert(Manager manager);
```

Then the generated mapper implementation would be something like below:

```java
managerDTO.setDateOfBirth(
    new SimpleDateFormat( "dd/MMM/yyyy" )
    .parse( manager.getDateOfBirth() ) );
```

If we don’t mention the `dateFormat` property in above mapper then this would generate an implementation method something like below:

```java
managerDTO.setDateOfBirth( new SimpleDateFormat().parse(
    manager.getDateOfBirth() ) );
```

### Mapping Collections

Mapping *Collections* in MapStruct works in the same way as mapping any other bean types. But it provides various options and customizations which can be used based on our needs. The generated implementation mapper code will contain a loop that would iterate over the source collection, convert each element, and put it into the target collection. If a mapping method for the collection element types is found in the given mapper or the mapper it uses, this method is automatically invoked to perform the element conversion.

#### Set

Let’s say if we want to convert a set of `Long` values to `String`, then we can simply define a mapper as below:

```java
@Mapper
public interface CollectionMapper {
    CollectionMapper INSTANCE = Mappers.getMapper(CollectionMapper.class);

    Set<String> convert(Set<Long> ids);
}
```

The generated implementation method would first initiate an instance of `HashSet` and then iterate through the loop to map and convert the values:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class CollectionMapperImpl implements CollectionMapper {

    @Override
    public Set<String> convert(Set<Long> ids) {
        if ( ids == null ) {
            return null;
        }

        Set<String> set = new HashSet<String>( Math.max( (int) ( ids.size() / .75f ) + 1, 16 ) );
        for ( Long long1 : ids ) {
            set.add( String.valueOf( long1 ) );
        }

        return set;
    }
    
    ...
}    
```

Now if we try to convert a set of one entity type to another then we can simply define a mapper as below:

```java
@Mapper
public interface CollectionMapper {
    CollectionMapper INSTANCE = Mappers.getMapper(CollectionMapper.class);

    Set<EmploymentDTO> convertEmployment(Set<Employment> employmentSet);
}
```

We will notice in the generated implementation that MapStruct has automatically created an extra mapping method to convert between the entities as their fields are identical to each other:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class CollectionMapperImpl implements CollectionMapper {

   	...
        
    @Override
    public Set<EmploymentDTO> convertEmployment(Set<Employment> employmentSet) {
        if ( employmentSet == null ) {
            return null;
        }

        Set<EmploymentDTO> set = new HashSet<EmploymentDTO>(
            Math.max( (int) ( employmentSet.size() / .75f ) + 1, 16 ) );
        for ( Employment employment : employmentSet ) {
            set.add( employmentToEmploymentDTO( employment ) );
        }

        return set;
    }
    
    protected EmploymentDTO employmentToEmploymentDTO(Employment employment) {
        if ( employment == null ) {
            return null;
        }

        EmploymentDTOBuilder employmentDTO = EmploymentDTO.builder();

        employmentDTO.designation( employment.getDesignation() );
        employmentDTO.salary( employment.getSalary() );

        return employmentDTO.build();
    }
    
    ...
}

```

#### List

`List` are mapped in the same way as `Set` in MapStruct. But if we want to convert between entities that require custom mapping, then we must define a conversion method between the entities first and then define the mapper between `List` or `Set`:

```java
@Mapper
public interface CollectionMapper {
    CollectionMapper INSTANCE = Mappers.getMapper(CollectionMapper.class);

    @Mapping(source = "degreeName", target = "degree")
    @Mapping(source = "institute", target = "college")
    @Mapping(source = "yearOfPassing", target = "passingYear")
    EducationDTO convert(Education education);
    List<EducationDTO> convert(List<Education> educationList);
}
```

Now the generated implementation method would look something like below:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class CollectionMapperImpl implements CollectionMapper {

	...
    @Override
    public EducationDTO convert(Education education) {
        if ( education == null ) {
            return null;
        }

        EducationDTOBuilder educationDTO = EducationDTO.builder();

        educationDTO.degree( education.getDegreeName() );
        educationDTO.college( education.getInstitute() );
        educationDTO.passingYear( education.getYearOfPassing() );

        return educationDTO.build();
    }

    @Override
    public List<EducationDTO> convert(List<Education> educationList) {
        if ( educationList == null ) {
            return null;
        }

        List<EducationDTO> list = new ArrayList<EducationDTO>( educationList.size() );
        for ( Education education : educationList ) {
            list.add( convert( education ) );
        }

        return list;
    }
    
    ...
}
```

#### Map

MapStruct provides additional annotation for mapping Maps. It is annotated as `MapMapping` and it accepts custom definitions to define various formats for key-value pairs:

```java
@Mapper
public interface CollectionMapper {
    CollectionMapper INSTANCE = Mappers.getMapper(CollectionMapper.class);

    @MapMapping(keyNumberFormat = "#L", valueDateFormat = "dd.MM.yyyy")
    Map<String, String> map(Map<Long, Date> dateMap);
}
```

This would generate an automated implementation method something like below:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class CollectionMapperImpl implements CollectionMapper {
    
    ...
    @Override
    public Map<String, String> map(Map<Long, Date> dateMap) {
        if ( dateMap == null ) {
            return null;
        }

        Map<String, String> map = new HashMap<String, String>(
            Math.max( (int) ( dateMap.size() / .75f ) + 1, 16 ) );

        for ( java.util.Map.Entry<Long, Date> entry : dateMap.entrySet() ) {
            String key = new DecimalFormat( "#L" ).format( entry.getKey() );
            String value = new SimpleDateFormat( "dd.MM.yyyy" )
                .format( entry.getValue() );
            map.put( key, value );
        }

        return map;
    }
    
    ...
}

```

#### Mapping Strategies

In case, if we need to map data types with the parent-child relationship, then MapStruct offers a way to define a strategy to set or add the children to the parent type. The `@Mapper` annotation supports a `collectionMappingStrategy` attribute which takes the following enums:

* `ACCESSOR_ONLY`
* `SETTER_PREFERRED`
* `ADDER_PREFERRED`
* `TARGET_IMMUTABLE`

The default value is `ACCESSOR_ONLY`, which means that only accessors can be used to set the *Collection* of children. This option helps us when the adders for a Collection type field are defined instead of setters. For example, let’s revisit the `Manager` to `ManagerDO` entity conversion in `PersonDTO`. The `PersonDTO` entity has a child field of type `List`:

```java
public class PersonDTO {
    ...
    private List<ManagerDTO> managerList;
    
    public List<ManagerDTO> getManagerList() {
        return managers;
    }

    public void setManagerList(List<ManagerDTO> managers) {
        this.managers = managers;
    }

    public void addManagerList(ManagerDTO managerDTO) {
        if (managers == null) {
            managers = new ArrayList<>();
        }

        managers.add(managerDTO);
    }
    
    // other getters and setters
}
```

Note that we have both the setter method, `setManagers`, and the adder method, `addManagerList` and we are responsible to initiate the collection for the adder. Then we have defined the default mapper the implementation looks something like the below:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class UserMapperImpl implements UserMapper {

    @Override
    public PersonDTO map(Person person) {
        if (person == null) {
            return null;
        }

        PersonDTO personDTO = new PersonDTO();

        personDTO.setManagerList(personMapper.map(person.getManagerList()));

        return personDTO;
    }
}
```

As we can see, MapStruct uses setter method to set the `PersonDTO` instance. Since MapStruct uses the `ACCESSOR_ONLY` collection mapping strategy. But if we pass and attribute in `@Mapper` to use the `ADDER_PREFERRED` collection mapping strategy then it would look something like the below:

```java
@Mapper(collectionMappingStrategy = CollectionMappingStrategy.ADDER_PREFERRED,
       uses = ManagerMapper.class)
public interface PersonMapperAdderPreferred {
    PersonDTO map(Person person);
}
```

The generated implementation method would look something like the below:

```java
public class PersonMapperAdderPreferredImpl implements PersonMapperAdderPreferred {

    private final ManagerMapper managerMapper = Mappers.getMapper( ManagerMapper.class );
    
    @Override
    public PersonDTO map(Person person) {
        if ( person == null ) {
            return null;
        }

        PersonDTO personDTO = new PersonDTO();

        if ( person.getManagerList() != null ) {
            for ( Manager manager : person.getManagerList() ) {
                personDTO.addManagerList( managerMapper.convert( manager ) );
            }
        }

        return personDTO;
    }
}
```

In case the adder was not available, the setter would have been used.

### Mapping Streams

Mapping Streams are similar to mapping collections. The only difference is that the auto-generated implementation would return a `Stream` from a provided `Iterable`:

```java
@Mapper
public interface CollectionMapper {
    CollectionMapper INSTANCE = Mappers.getMapper(CollectionMapper.class);

    Set<String> convertStream(Stream<Long> ids);

    @Mapping(source = "degreeName", target = "degree")
    @Mapping(source = "institute", target = "college")
    @Mapping(source = "yearOfPassing", target = "passingYear")
    EducationDTO convert(Education education);
    List<EducationDTO> convert(Stream<Education> educationStream);
}
```

The implementation methods would look something like below:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class CollectionMapperImpl implements CollectionMapper {

    ...

    @Override
    public Set<String> convertStream(Stream<Long> ids) {
        if ( ids == null ) {
            return null;
        }

        return ids.map( long1 -> String.valueOf( long1 ) )
        .collect( Collectors.toCollection( HashSet<String>::new ) );
    }


    @Override
    public List<EducationDTO> convert(Stream<Education> educationStream) {
        if ( educationStream == null ) {
            return null;
        }

        return educationStream.map( education -> convert( education ) )
        .collect( Collectors.toCollection( ArrayList<EducationDTO>::new ) );
    }

    protected EmploymentDTO employmentToEmploymentDTO(Employment employment) {
        if ( employment == null ) {
            return null;
        }

        EmploymentDTOBuilder employmentDTO = EmploymentDTO.builder();

        employmentDTO.designation( employment.getDesignation() );
        employmentDTO.salary( employment.getSalary() );

        return employmentDTO.build();
    }
}
```

### Mapping Enums

MapStruct allows the conversion of one `Enum` to another `Enum` or `String`. Each constant from the enum at the source is mapped to a constant with the same name in the target. But in the case of different names, we need to annotate `@ValueMapping` with source and target enums.

For example, we will define an enum named `DesignationCode`:

```java
public enum DesignationCode {
    CEO,
    CTO,
    VP,
    SM,
    M,
    ARCH,
    SSE,
    SE,
    INT
}
```

This will be mapped to `DesignationConstant` enum:

```java
public enum DesignationConstant {
    CHIEF_EXECUTIVE_OFFICER,
    CHIEF_TECHNICAL_OFFICER,
    VICE_PRESIDENT,
    SENIOR_MANAGER,
    MANAGER,
    ARCHITECT,
    SENIOR_SOFTWARE_ENGINEER,
    SOFTWARE_ENGINEER,
    INTERN,
    OTHERS
}
```

Now we can define an Enum mapping in the following way:

```java
@Mapper
public interface UserMapper {    
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);
    
	@ValueMappings({
            @ValueMapping(source = "CEO", target = "CHIEF_EXECUTIVE_OFFICER"),
            @ValueMapping(source = "CTO", target = "CHIEF_TECHNICAL_OFFICER"),
            @ValueMapping(source = "VP", target = "VICE_PRESIDENT"),
            @ValueMapping(source = "SM", target = "SENIOR_MANAGER"),
            @ValueMapping(source = "M", target = "MANAGER"),
            @ValueMapping(source = "ARCH", target = "ARCHITECT"),
            @ValueMapping(source = "SSE", target = "SENIOR_SOFTWARE_ENGINEER"),
            @ValueMapping(source = "SE", target = "SOFTWARE_ENGINEER"),
            @ValueMapping(source = "INT", target = "INTERN"),
            @ValueMapping(source = MappingConstants.ANY_REMAINING, target = "OTHERS"),
            @ValueMapping(source = MappingConstants.NULL, target = "OTHERS")
    })
    DesignationConstant convertDesignation(DesignationCode code);
}    
```

This generates an implementation with a switch-case. It throws an error in case a constant of the source enum type does not have a corresponding constant with the same name in the target type and also is not mapped to another constant via `@ValueMapping`. The generated mapping method will throw an IllegalStateException if for some reason an unrecognized source value occurs.

MapStruct too has a mechanism to map any unspecified mappings to a default. This can be used only once in a set of value mappings and only applies to the source. It comes in two flavors: `<ANY_REMAINING>` and `<ANY_UNMAPPED>`. But they can’t be used at the same time.

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class UserMapperImpl implements UserMapper {

    private final ManagerMapper managerMapper = Mappers.getMapper( ManagerMapper.class );
        
    @Override
    public DesignationConstant convertDesignation(DesignationCode code) {
        if ( code == null ) {
            return DesignationConstant.OTHERS;
        }

        DesignationConstant designationConstant;

        switch ( code ) {
            case CEO: designationConstant = DesignationConstant.CHIEF_EXECUTIVE_OFFICER;
            break;
            case CTO: designationConstant = DesignationConstant.CHIEF_TECHNICAL_OFFICER;
            break;
            case VP: designationConstant = DesignationConstant.VICE_PRESIDENT;
            break;
            case SM: designationConstant = DesignationConstant.SENIOR_MANAGER;
            break;
            case M: designationConstant = DesignationConstant.MANAGER;
            break;
            case ARCH: designationConstant = DesignationConstant.ARCHITECT;
            break;
            case SSE: designationConstant = DesignationConstant.SENIOR_SOFTWARE_ENGINEER;
            break;
            case SE: designationConstant = DesignationConstant.SOFTWARE_ENGINEER;
            break;
            case INT: designationConstant = DesignationConstant.INTERN;
            break;
            default: designationConstant = DesignationConstant.OTHERS;
        }

        return designationConstant;
    }

}    
```

Sometimes we need to deal with the enum constants with the same names followed by prefix or suffix pattern. MapStruct supports a few out-of-the-box strategies to deal with those patterns:

- `suffix` - Applies a suffix on the source enum
- `stripSuffix` - Strips a suffix from the source enum
- `prefix` - Applies a prefix on the source enum
- `stripPrefix` - Strips a prefix from the source enum

For example, let’s say we want to add a prefix to a stream of degree objects named as `DegreeStream`:

```java
public enum DegreeStream {
    MATHS,
    PHYSICS,
    CHEMISTRY,
    BOTANY,
    ZOOLOGY,
    STATISTICS,
    EDUCATION
}
```

with `DegreeStreamPrefix`:

```java
public enum DegreeStreamPrefix {
    MSC_MATHS,
    MSC_PHYSICS,
    MSC_CHEMISTRY,
    MSC_BOTANY,
    MSC_ZOOLOGY,
    MSC_STATISTICS,
    MSC_EDUCATION
}
```

Then we can define an enum mapping in the following way:

```java
@Mapper
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);
        
    @EnumMapping(nameTransformationStrategy = "prefix", configuration = "MSC_")
    DegreeStreamPrefix convert(DegreeStream degreeStream);

    @EnumMapping(nameTransformationStrategy = "stripPrefix", configuration = "MSC_")
    DegreeStream convert(DegreeStreamPrefix degreeStreamPrefix);
}
```

It generates an implementation as follows:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class UserMapperImpl implements UserMapper {

    private final ManagerMapper managerMapper = Mappers.getMapper( ManagerMapper.class );
    
    @Override
    public DegreeStreamPrefix convert(DegreeStream degreeStream) {
        if ( degreeStream == null ) {
            return null;
        }

        DegreeStreamPrefix degreeStreamPrefix;

        switch ( degreeStream ) {
            case MATHS: degreeStreamPrefix = DegreeStreamPrefix.MSC_MATHS;
            break;
            case PHYSICS: degreeStreamPrefix = DegreeStreamPrefix.MSC_PHYSICS;
            break;
            case CHEMISTRY: degreeStreamPrefix = DegreeStreamPrefix.MSC_CHEMISTRY;
            break;
            case BOTANY: degreeStreamPrefix = DegreeStreamPrefix.MSC_BOTANY;
            break;
            case ZOOLOGY: degreeStreamPrefix = DegreeStreamPrefix.MSC_ZOOLOGY;
            break;
            case STATISTICS: degreeStreamPrefix = DegreeStreamPrefix.MSC_STATISTICS;
            break;
            case EDUCATION: degreeStreamPrefix = DegreeStreamPrefix.MSC_EDUCATION;
            break;
            default: throw new IllegalArgumentException(
                "Unexpected enum constant: " + degreeStream );
        }

        return degreeStreamPrefix;
    }

    @Override
    public DegreeStream convert(DegreeStreamPrefix degreeStreamPrefix) {
        if ( degreeStreamPrefix == null ) {
            return null;
        }

        DegreeStream degreeStream;

        switch ( degreeStreamPrefix ) {
            case MSC_MATHS: degreeStream = DegreeStream.MATHS;
            break;
            case MSC_PHYSICS: degreeStream = DegreeStream.PHYSICS;
            break;
            case MSC_CHEMISTRY: degreeStream = DegreeStream.CHEMISTRY;
            break;
            case MSC_BOTANY: degreeStream = DegreeStream.BOTANY;
            break;
            case MSC_ZOOLOGY: degreeStream = DegreeStream.ZOOLOGY;
            break;
            case MSC_STATISTICS: degreeStream = DegreeStream.STATISTICS;
            break;
            case MSC_EDUCATION: degreeStream = DegreeStream.EDUCATION;
            break;
            default: throw new IllegalArgumentException(
                "Unexpected enum constant: " + degreeStreamPrefix );
        }

        return degreeStream;
    }

}
```

### Defining Default Values or Constants

Default values can be specified in MapStruct to set a predefined value to a target property if the corresponding source property is `null`.  Constants can be specified to set such a predefined value in any case. These default values and constants are specified as Strings. MapStruct also supports `numberFormat` to define a pattern for the numeric value.

```java
@Mapper(collectionMappingStrategy = CollectionMappingStrategy.ADDER_PREFERRED,
        uses = {CollectionMapper.class, ManagerMapper.class, Validator.class},
        imports = UUID.class )
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    @Mapping(source = "user.name", target = "firstName")
    @Mapping(source = "education.degreeName", target = "education.degree")
    @Mapping(source = "education.institute", target = "education.college")
    @Mapping(source = "education.yearOfPassing", target = "education.passingYear",
             defaultValue = "2001")
    @Mapping(source = "employment", target = ".")
    PersonDTO convert(BasicUser user,
                      Education education,
                      Address address,
                      Employment employment);

    @Mapping(source = "education.degreeName", target = "educationalQualification")
    @Mapping(source = "address.city", target = "residentialCity")
    @Mapping(target = "residentialCountry", constant = "US")
    @Mapping(source = "employment.salary", target = "salary", numberFormat = "$#.00")
    void updateExisting(BasicUser user,
                        Education education,
                        Address address,
                        Employment employment,
                        @MappingTarget PersonDTO personDTO);
}    
```

This generates an implementation which looks like below:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class UserMapperImpl implements UserMapper {

    private final ManagerMapper managerMapper = Mappers.getMapper( ManagerMapper.class );

    @Override
    public PersonDTO convert(BasicUser user,
                             Education education,
                             Address address,
                             Employment employment) {
        if ( user == null && education == null
            && address == null && employment == null ) {
            return null;
        }

        PersonDTOBuilder personDTO = PersonDTO.builder();

        if ( user != null ) {
            personDTO.id( String.valueOf( user.getId() ) );
            personDTO.firstName( user.getName() );
            personDTO.managerList( managerListToManagerDTOList( user.getManagerList() ) );
        }
        if ( education != null ) {
            personDTO.education( educationToEducationDTO( education ) );
        }
        if ( employment != null ) {
            personDTO.designation( convertDesignation( employment.getDesignation() ) );
            personDTO.salary( String.valueOf( employment.getSalary() ) );
        }

        return personDTO.build();
    }

    @Override
    public void updateExisting(BasicUser user,
                               Education education,
                               Address address,
                               Employment employment,
                               PersonDTO personDTO) {
        if ( user == null && education == null
            && address == null && employment == null ) {
            return;
        }

        if ( user != null ) {
            personDTO.setId( String.valueOf( user.getId() ) );
            if ( personDTO.getManagerList() != null ) {
                List<ManagerDTO> list = managerListToManagerDTOList( user.getManagerList() );
                if ( list != null ) {
                    personDTO.getManagerList().clear();
                    personDTO.getManagerList().addAll( list );
                }
                else {
                    personDTO.setManagerList( null );
                }
            }
            else {
                List<ManagerDTO> list = managerListToManagerDTOList(
                    user.getManagerList() );
                if ( list != null ) {
                    personDTO.setManagerList( list );
                }
            }
        }
        if ( education != null ) {
            personDTO.setEducationalQualification( education.getDegreeName() );
        }
        if ( address != null ) {
            personDTO.setResidentialCity( address.getCity() );
        }
        if ( employment != null ) {
            personDTO.setSalary( new DecimalFormat( "$#.00" )
                                .format( employment.getSalary() ) );
            personDTO.setDesignation( convertDesignation(
                employment.getDesignation() ) );
        }
        personDTO.setResidentialCountry( "US" );
    }
}
```

### Defining Default Expressions

MapStruct supports default expressions which is a combination of default values and expressions. They can only be used when the source attribute is `null`. But whenever we define an expression that object class needs to be imported in `@Mapper` annotation.

```java
@Mapper( imports = UUID.class )
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    @Mapping(source = "user.id", target = "id",
             defaultExpression = "java( UUID.randomUUID().toString() )")
    PersonDTO convert(BasicUser user,
                      Education education,
                      Address address,
                      Employment employment);
}
```

## Mapping Customization

We would often face various situations where we might need to apply custom business logic or conversion before or after mapping methods. MapStruct provides two ways for defining customization:

* *Decorators* - This pattern allows for type-safe customization of specific mapping methods.
* *`@BeforeMapping`/`@AfterMapping`* - This allows for generic customization of mapping methods with given source or target types.

### Implementing a Decorator

Sometimes we would like to customize a generated mapping implementation by adding our custom logic. MapStruct allows to define a *Decorator* class and annotate it with `@DecoratedWith` annotation. The decorator must be a sub-type of the decorated mapper type. We can define it as an abstract class that allows us to only implement those methods of the mapper interface which we want to customize. For all the other non-implemented methods, a simple delegation to the original mapper will be generated using the default implementation.

For example, let’s say we want to divide the `name` in the `User` class to `firstName` and `lastName` in `PersonDTO`, we can define this by adding a Decorator class as follows:

```java
public abstract class UserMapperDecorator implements UserMapper {

    private final UserMapper delegate;

    protected UserMapperDecorator (UserMapper delegate) {
        this.delegate = delegate;
    }

    @Override
    public PersonDTO convert(BasicUser user, Education education, Address address, Employment employment) {
        PersonDTO dto = delegate.convert(user, education, address, employment);
        if (user.getName().split("\\w+").length > 1) {
            dto.setFirstName(user.getName().substring(0, user.getName().lastIndexOf(' ')));
            dto.setLastName(user.getName().substring(user.getName().lastIndexOf(" ") + 1));
        }
        else {
            dto.setFirstName(user.getName());
        }
        return dto;
    }
}
```

We can pass this decorator class as part of the `UserMapper` as follows:

```java
@Mapper
@DecoratedWith(UserMapperDecorator.class)
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);
    
    PersonDTO convert(BasicUser user, Education education, Address address, Employment employment);
}
```

### Usage of `@BeforeMapping` and `@AfterMapping` hooks

Suppose we have a use-case where we would like to execute some logic before or after each mapping, then MapStruct provides additional control for customization using `@BeforeMapping` and `@AfterMapping` annotation. Let’s define those two methods:

```java
@Mapper
@DecoratedWith(UserMapperDecorator.class)
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    @BeforeMapping
    default void validateMangers(BasicUser user, Education education, Address address, Employment employment) {
        if (Objects.isNull(user.getManagerList())) {
            user.setManagerList(new ArrayList<>());
        }
    }

    @Mapping(source = "user.id", target = "id",
             defaultExpression = "java( UUID.randomUUID().toString() )")
    @Mapping(source = "education.degreeName", target = "education.degree")
    @Mapping(source = "education.institute", target = "education.college")
    @Mapping(source = "education.yearOfPassing",
             target = "education.passingYear", defaultValue = "2001")
    @Mapping(source = "employment", target = ".")
    PersonDTO convert(BasicUser user,
                      Education education,
                      Address address,
                      Employment employment);

    @Mapping(source = "education.degreeName", target = "educationalQualification")
    @Mapping(source = "address.city", target = "residentialCity")
    @Mapping(target = "residentialCountry", constant = "US")
    @Mapping(source = "employment.salary", target = "salary",
             numberFormat = "$#.00")
    void updateExisting(BasicUser user,
                        Education education,
                        Address address,
                        Employment employment,
                        @MappingTarget PersonDTO personDTO);

    @AfterMapping
    default void updateResult(BasicUser user,
                              Education education,
                              Address address,
                              Employment employment,
                              @MappingTarget PersonDTO personDTO) {
        personDTO.setFirstName(personDTO.getFirstName().toUpperCase());
        personDTO.setLastName(personDTO.getLastName().toUpperCase());
    }
}
```

Now when the implementation is generated we would be able to see that the `validateManagers()` is called before mapping execution and `updateResult()` method is called after mapping execution:

```java
@Generated(
    value = "org.mapstruct.ap.MappingProcessor"
)
public class UserMapperImpl_ implements UserMapper {

    private final ManagerMapper managerMapper = Mappers.getMapper( ManagerMapper.class );

    @Override
    public PersonDTO convert(BasicUser user,
                             Education education,
                             Address address,
                             Employment employment) {
        validateMangers( user, education, address, employment );

        if ( user == null && education == null
            && address == null && employment == null ) {
            return null;
        }

        PersonDTOBuilder personDTO = PersonDTO.builder();

        if ( user != null ) {
            personDTO.id( String.valueOf( user.getId() ) );
            personDTO.managerList( managerListToManagerDTOList(
                user.getManagerList() ) );
        }
        if ( education != null ) {
            personDTO.education( educationToEducationDTO( education ) );
        }
        if ( employment != null ) {
            personDTO.designation( convertDesignation(
                employment.getDesignation() ) );
            personDTO.salary( String.valueOf( employment.getSalary() ) );
        }

        return personDTO.build();
    }

    @Override
    public void updateExisting(BasicUser user,
                               Education education,
                               Address address,
                               Employment employment,
                               PersonDTO personDTO) {
        validateMangers( user, education, address, employment );

        if ( user == null && education == null
            && address == null && employment == null ) {
            return;
        }

        if ( user != null ) {
            personDTO.setId( String.valueOf( user.getId() ) );
            if ( personDTO.getManagerList() != null ) {
                List<ManagerDTO> list = managerListToManagerDTOList(
                    user.getManagerList() );
                if ( list != null ) {
                    personDTO.getManagerList().clear();
                    personDTO.getManagerList().addAll( list );
                }
                else {
                    personDTO.setManagerList( null );
                }
            }
            else {
                List<ManagerDTO> list = managerListToManagerDTOList(
                    user.getManagerList() );
                if ( list != null ) {
                    personDTO.setManagerList( list );
                }
            }
        }
        if ( education != null ) {
            personDTO.setEducationalQualification( education.getDegreeName() );
        }
        if ( address != null ) {
            personDTO.setResidentialCity( address.getCity() );
        }
        if ( employment != null ) {
            personDTO
                .setSalary( new DecimalFormat( "$#.00" )
                           .format( employment.getSalary() ) );
            personDTO
                .setDesignation( convertDesignation(
                    employment.getDesignation() ) );
        }
        personDTO.setResidentialCountry( "US" );

        updateResult( user, education, address, employment, personDTO );
    }
}
```

## Conclusion

In this article, we took a deep dive into the world of MapStruct and created a mapper class from basic level to custom methods and wrappers. We also looked into different options provided by MapStruct which include data type mappings, enum mappings, dependency injection, and expressions.

MapStruct provides a powerful integration plugin that reduces the amount of code a user has to write. It makes the process of creating bean mappers pretty easy and fast.

We can refer to all the source codes used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/mapstruct). 

