---
title: Custom Web Controller Arguments with Spring MVC and Spring Boot
categories: [spring-boot]
date: 2020-02-27 06:00:00 +1100
modified: 2020-02-27 07:44:00 +1100
author: default
excerpt: "Spring MVC provides a convenient programming model for creating web controllers. We can make it even more convenient by letting Spring pass custom objects from our domain into controller methods so we don't have to map them each time."
image:
  auto: 0064-java
tags: ["Spring MVC"]
---

Spring MVC provides a very convenient programming model for creating web controllers. We declare a method signature and the method arguments will be resolved auomatically by Spring. If it doesn't work for some reason, Spring will automatically return a proper HTTP error code. 

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/argumentresolver" %}

## Why Would I Want Custom Method Arguments?

We can take advantage of this programming model to support our own types in controller method signatures. 

Let's say we're building an application managing Git repositories similar to GitHub.

To identify a certain `Repository` entity, we use a `RepositoryId` value object instead of a simple `Long` value. This way, we cannot accidentally confuse a repository ID with a user ID, for example.

Now, **we'd like to use a `RepositoryId` instead of a `Long` in the method signatures of our web controllers** so we don't have to do that conversion ourselves.

Another use case is when **we want to extract some context object from the URL path for all our controllers**. For example, think of the repository name on GitHub: every URL starts with a repository name. 

So, each time we have a repository name in a URL, we'd like to have Spring automatically convert that repository name to a full-blown `Repository` entity that we can then use for further processing.   

In the following sections, we're looking at a solution for each of these use cases.

## Converting Primitives into Value Objects with a `Converter`

Let's start with the simple one.

### Using a Custom Value Object in a Controller Method Signature

We want Spring to automatically convert a path variable into a `RepositoryId` object:

```java
@RestController
class RepositoryController {

  @GetMapping("/repositories/{repositoryId}")
  String getSomething(@PathVariable("repositoryId") RepositoryId repositoryId) {
    // ... load and return repository
  }

}
```

We're binding the `repositoryId` method parameter to the `{repositoryId}` path variable.

Our `RepositoryId` is a simple value object:

```java
@Value
class RepositoryId {
  private final long value;
}
```

We use the Lombok annotation `@Value` so we don't have to create constructors and getters ourselves.

### Creating a Test

Let's practice Test-Driven Development and create a test before building the actual solution:

```java
@WebMvcTest(controllers = RepositoryController.class)
class RepositoryIdConverterTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void resolvesRepositoryId() throws Exception {
    mockMvc.perform(get("/repositories/42"))
        .andExpect(status().isOk());
  }

}
```

This test performs a `GET` request to the endpoint `/repositories/42` and checks is the response HTTP status code is `200` (OK).

By running the test before having the solution in place, we can make sure that we actually have a problem to solve. It turns out, we do, because running the test will result in an error like this:

```
Failed to convert value of type 'java.lang.String' to required type '...RepositoryId';
  nested exception is java.lang.IllegalStateException: 
  Cannot convert value of type 'java.lang.String' to required type '...RepositoryId': 
  no matching editors or conversion strategy found
```  

### Building a Converter

Fixing this is rather easy. All we need to do is to implement a custom `Converter`:

```java
@Component
class RepositoryIdConverter implements Converter<String, RepositoryId> {

  @Override
  public RepositoryId convert(String source) {
    return new RepositoryId(Long.parseLong(source));
  }
}
```

Since all input from HTTP requests is considered a `String`, we need to build a `Converter` that converts a `String` value to a `RepositoryId`.

By adding the `@Component` annotation, we make this converter known to Spring. Spring will then automatically apply this converter to all controller method arguments with of type `RepositoryId`. 

If we run the test now, it's green.

## Resolving Custom Arguments with a `HandlerMethodArgumentResolver`

The above solution with the `Converter` only works because we're using Spring's `@PathVariable` annotation to bind the method parameter to a variable in the URL path.

Now, let's say that ALL our URLs start with the name of a Git repository (called a URL-friendly "slug") and we want to minimize boilerplate code:
 
* We don't want to pollute our code with lots of `@PathVariable` annotations.
* We don't want every controller to have to check if the repository slug in the URL is valid. 
* We don't want every controller to have to load the repository data from the database. 

We can achieve this by building a custom `HandlerMethodArgumentResolver`.

### Using a Custom Object in a Controller Method Signature

Let's start with how we expect the controller code to look:

```java
@RestController
@RequestMapping(path = "/{repositorySlug}")
class RepositoryController {

  @GetMapping("/listContributors")
  String listContributors(Repository repository) {
    // list the contributors of the Repository ...
  }

  // more controller methods ...

}
```

In the class-level `@RequestMapping` annotation, we define that all requests start with a `{repositorySlug}` variable. 

In the `listContributors` method, we require a `Repository` object as argument. 

We now want to create some code that will be applied to ALL controller methods and

* checks the database if a repository with the given `{repositorySlug}` exists
* if the repository doesn't exist, return a HTTP status code 404 
* if the repository exists, hydrate a `Repository` object with the repositories data and pass that into the controller method.    

### Creating a Test

Again, let's start with a test to define our requirements:

```java
@WebMvcTest(controllers = RepositoryController.class)
class RepositoryArgumentResolverTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private RepositoryFinder repositoryFinder;

  @Test
  void resolvesSiteSuccessfully() throws Exception {

    given(repositoryFinder.findBySlug("my-repo"))
        .willReturn(Optional.of(new Repository(1L, "my-repo")));

    mockMvc.perform(get("/my-repo/listContributors"))
        .andExpect(status().isOk());
  }

  @Test
  void notFoundOnUnknownSlug() throws Exception {

    given(repositoryFinder.findBySlug("unknownSlug"))
        .willReturn(Optional.empty());

    mockMvc.perform(get("/unknownSlug/listContributors"))
        .andExpect(status().isNotFound());
  }

}
```

We have two test cases:

The first checks the happy path. If the `RepositoryFinder` finds a repository with the given slug, we expect the HTTP status code to be 200 (OK).

The second test checks the error path. If the `RepositoryFinder` doen't find a repository with the given slug, we expect the HTTP status code to be 404 (NOT FOUND).

If we run the test without doing anything, we'll get an error like this:

```
Caused by: java.lang.AssertionError: 
Expecting actual not to be null
```

This means that the `Repository` object passed into the controller methods is null. 

### Creating a `HandlerMethodArgumentResolver`

Let's fix that. We do this by implementing a custom `HandlerMethodArgumentResolver`:

```java
@RequiredArgsConstructor
class RepositoryArgumentResolver implements HandlerMethodArgumentResolver {

  private final RepositoryFinder repositoryFinder;

  @Override
  public boolean supportsParameter(MethodParameter parameter) {
    return parameter.getParameter().getType() == Repository.class;
  }

  @Override
  public Object resolveArgument(
      MethodParameter parameter,
      ModelAndViewContainer mavContainer,
      NativeWebRequest webRequest,
      WebDataBinderFactory binderFactory) {

    String requestPath = ((ServletWebRequest) webRequest).getRequest().getPathInfo();

    String slug = requestPath
        .substring(0, requestPath.indexOf("/", 1))
        .replaceAll("^/", "");
    
    Optional<Repository> repository = repositoryFinder.findBySlug(slug);

    if (repository.isEmpty()) {
      throw new NotFoundException();
    }

    return repository.get();
  }
}
```

In `resolveArgument()`, we get the first segment of the request path, which should contain our repository slug.

Then, we feed this slug into `RepositoryFinder` to load the repository from the database.

If `RepositoryFinder` doesn't find a repository with that slug, we throw a custom `NotFoundException`, otherwise, we return the `Repository` object we found in the database. 

### Register the `HandlerMethodArgumentResolver`

Now, we have to make our `RepositoryArgumentResolver` known to Spring Boot:

```java
@Component
@RequiredArgsConstructor
class RepositoryArgumentResolverConfiguration implements WebMvcConfigurer {

  private final RepositoryFinder repositoryFinder;

  @Override
  public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
    resolvers.add(new RepositoryArgumentResolver(repositoryFinder));
  }

}
```

We implement the `WebMvcConfigurer` interface and add our `RepositoryArgumentResolver` to the list of resolvers. Don't forget to make this configurer known to Spring Boot by adding the `@Component` annotation.

### Mapping `NotFoundException` to HTTP Status 404

Finally, we want to map our custom `NotFoundException` to the HTTP status code 404. We do this by creating a controller advice: 

```java
@ControllerAdvice
class ErrorHandler {

  @ExceptionHandler(NotFoundException.class)
  ResponseEntity<?> handleHttpStatusCodeException(NotFoundException e) {
    return ResponseEntity.status(e.getStatusCode()).build();
  }

}
``` 

The `@ControllerAdvice` annotation will register the `ErrorHandler` class to be applied to all web controllers. 

In `handleHttpStatusCodeException()` we return a `ResponseEntity` with HTTP status code 404 in case of a `NotFoundException`.

## Conclusion

With `Converter`s, we can convert web controller method arguments annotated with `@PathVariable`s or `@RequestParam`s to value objects.

With a `HandlerMethodArgumentResolver`, we can resolve any method argument type. This is used heavily by the Spring framework itself, for example to resolve method arguments annotated with `@ModelAttribute` or `@PathVariable` or to resolve arguments of type `RequestEntity` or `Model`.

You can view the example code on [GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/argumentresolver).




