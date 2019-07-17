---

title: "Documenting a Spring Data REST API with Springfox and Swagger"
categories: [tools]
modified: 2017-08-02
author: tom
tags: [spring, boot, data, rest, swagger, springfox, documentation, document]
comments: true
ads: true
sidebar:
  nav: spring-data-rest
excerpt: "A tutorial on how to document a REST API created with Spring Data REST using Springfox and Swagger."
---

{% include sidebar_right %}

With [Spring Data REST](https://projects.spring.io/spring-data-rest/) you can rapidly create a REST API
that exposes your Spring Data repositories and thus provides CRUD support and more. However, in serious API
development, you also want to have an automatically generated and up-to-date API documentation. 

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/spring-data/spring-data-rest-springfox" %}

[Swagger](http://swagger.io) provides a specification for documenting REST APIs. And with 
[Springfox](https://github.com/springfox/springfox) we have a tool that serves as a bridge between
Spring applications and Swagger by creating a Swagger documentation for certain Spring beans and annotations.

Springfox also recently added a feature that [creates a Swagger documentation for a Spring Data REST
API](https://springfox.github.io/springfox/docs/current/#springfox-spring-data-rest). This feature is
incubating yet, but I nevertheless played around with it a little to evaluate if it's ready to use
in real projects yet. Because if it is, the combination of Spring Data REST and Springfox would allow
rapid development of a well-documented REST API.

**Note that as of now (version 2.7.0), the Springfox integration for Spring Data REST is still in incubation
and has some serious bugs and missing features (see [here](https://github.com/springfox/springfox/issues/1962) 
and [here](https://github.com/springfox/springfox/issues/1963), for example). 
Thus, the descriptions and code examples below are based on the current 2.7.1-SNAPSHOT version in 
which this is remedied considerably.**

## Enabling Springfox in a Spring Boot / Spring Data REST application 

In order to enable Springfox to create a Swagger documentation for our Spring Data REST API, you have to 
take the following steps.

### Add Springfox dependencies

Add the following dependencies to your application (gradle notation):

```text
compile('io.springfox:springfox-swagger2:2.7.0')
compile('io.springfox:springfox-data-rest:2.7.0')
compile('io.springfox:springfox-swagger-ui:2.7.0')
```

* `springfox-swagger2` contains the core features of Springfox that allow creation of an API documentation with Swagger 2.
* `springfox-data-rest` contains the integration that automatically creates a Swagger documentation for Spring Data REST repositories.
* `springfox-swagger-ui` contains the Swagger UI that displays the Swagger documentation at `http://localhost:8080/swagger-ui.html`.

### Configure the Application class

The Spring Boot application class has to be configured as follows:

```java
@SpringBootApplication
@EnableSwagger2
@Import(SpringDataRestConfiguration.class)
public class DemoApplication {
  
  public static void main(String[] args) {
    SpringApplication.run(DemoApplication.class, args);
  }
  
}
```

* The `@EnableSwagger2` annotation enables Swagger 2 support by registering certain beans into the Spring application context. 
* The `@Import` annotation imports additional classes into the Spring application context that are needed to automatically
  create a Swagger documentation from our Spring Data REST repositories.
  
### Create a `Docket` bean

You can optionally create a Spring bean of type [`Docket`](http://springfox.github.io/springfox/javadoc/2.7.0/springfox/documentation/spring/web/plugins/Docket.html).
This will be picked up by Springfox to configure some of the swagger documentation output.

<a name="docket"></a>
```java
@Configuration
public class SpringfoxConfiguration {
  
  @Bean
  public Docket docket() {
    return new Docket(DocumentationType.SWAGGER_2)
      .tags(...)
      .apiInfo(...)
      ...
  }
  
}
```

### Annotate your Spring Data repositories

Also optionally, you can annotate the Spring Data repositories exposed by Spring Data REST using the [`@Api`](http://docs.swagger.io/swagger-core/v1.5.0/apidocs/io/swagger/annotations/Api.html),
[`@ApiOperation`](http://docs.swagger.io/swagger-core/v1.5.0/apidocs/io/swagger/annotations/ApiOperation.html) and
[`@ApiParam`](http://docs.swagger.io/swagger-core/v1.5.0/apidocs/io/swagger/annotations/ApiParam.html) annotations.
More details below.

### The Output

In the end, you should be able to view the Swagger documentation of your Spring Data REST API by accessing
`http://localhost:8080/swagger-ui.html` in your browser. The result should look something like the image below.

![Swagger UI]({{ base }}/assets/images/posts/spring-data-rest-springfox.png)

## Customizing the Output

The numbers on the image above show some places where things in the generated API documentation can be customized.
The following sections describe some customizations that I deemed important. You can probably customize more
than I have found out so feel free to add a comment if you found something I missed!

### General API Information (1)

Information like the title, description, licence and more can be configured by creating a `Docket` bean
as in the [code snippet above](#docket) and using its setters to change the settings you want.

### Repository Description (2)

The description for a repository can be changed by creating a tag named exactly like the default API name 
("Address Entity" in the example), providing a description to this Tag in the `Docket` object and connecting
the repository with that Tag using the `@Api` annotation. I have found no way to change the name of the 
repository itself so far.

```java
@Configuration
public class SpringfoxConfiguration {
  
  @Bean
  public Docket docket() {
    return new Docket(DocumentationType.SWAGGER_2)
      .tags(new Tag("Address Entity", "Repository for Address entities"));
  }
  
}

@Api(tags = "Address Entity")
@RepositoryRestResource(path = "addresses")
public interface AddressRepository extends CrudRepository<Address, Long> {
  // methods omitted
}
```

### Operation Description (3)

The description of a single API operation can be modified by the `@ApiOperation` annotation like so:

```java
public interface AddressRepository extends PagingAndSortingRepository<Address, Long> {
  
  @ApiOperation("find all Addresses that are associated with a given Customer")
  Page<Address> findByCustomerId(@Param("customerId") Long customerId, Pageable pageable);
  
}
```

### Input Parameters (4)

The names and descriptions of input parameters can be configured using the `@ApiParam` annotation.
Note that as of Springfox 2.7.1 the parameter names are also read from the `@Param` annotation provided
by Spring Data.
  
```java
public interface AddressRepository extends PagingAndSortingRepository<Address, Long> {
  
  Page<Address> findByCustomerId(@Param("customerId") @ApiParam(value="ID of the customer") Long customerId, Pageable pageable);

}
```

### Responses (5)

The different response statuses and their payloads can be tuned using the `@ApiResponses` and `@ApiResponse` annotations:

```java
public interface AddressRepository extends PagingAndSortingRepository<Address, Long> {
	
  @Override
  @ApiResponses({@ApiResponse(code=201, message="Created", response=Address.class)})
  Address save(Address address);
  
}
```

## Conclusion

Spring Data REST allows you to produce fast results when creating a database-driven REST API. Springfox
allows you to quickly produce automated documentation for that API. However, the API docs generated
by Springfox do not match the actual API in every detail. Some manual fine-tuning with annotations is 
necessary, like described in the customization section above.

One such example is that the JSON of example requests and responses is not rendered correctly
in every case, since Spring Data REST uses the HAL format and Springfox only does in a few cases. 
With manual work involved, it will be hard to keep the API documentation up-to-date for
every detail.

My conclusion is that the combination of Spring Data REST and Springfox is a good starting point
to quickly produce a REST API whose documentation is good enough for most use cases, especially when the API
is developed and used in a closed group of developers. For a public API, details matter a little more and
it may be frustrating to keep the Swagger annotations and Springfox configuration up-to-date for every
detail. 

