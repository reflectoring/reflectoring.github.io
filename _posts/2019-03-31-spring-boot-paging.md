---
title: "Paging with Spring Boot"
categories: [spring-boot]
modified: 2019-03-31
last_modified_at: 2019-03-31
author: tom
tags: 
comments: true
ads: true
excerpt: "An in-depth look at the paging support provided by Spring Data for querying
          Spring Web MVC controllers and Spring Data repositories."
sidebar:
  toc: true
---

{% include sidebar_right %}

As a user of a web application we're expecting pages to load quickly and only show
the information that's relevant to us. **For pages that show a list of items, this means
only displaying a portion of the items, and not all of them at once**.

Once the first page has loaded quickly, the UI can provide options like filters,
sorting and pagination that help the user to quickly find the items he or
she is looking for. 

In this tutorial, we're examining Spring Data's paging support and create examples of how to use
and configure it along with some information about how it works under the covers.

{% include github-project url="https://github.com/thombergs/code-examples/tree/master/spring-boot/paging" %}

## Paging vs. Pagination
The terms "paging" and "pagination" are often used as synonyms. They don't exactly mean the same,
however. After consulting various web dictionaries, I've cobbled together the following definitions,
which I'll use in this text:

**Paging** is the act of loading one page of items after another from a database, in order to 
preserve resources. This is what most of this article is about.

**Pagination** is the UI element that provides a sequence of page numbers to let the user choose
which page to load next.

## Initializing the Example Project

We're using Spring Boot to bootstrap a project in this tutorial. You can
create a similar project by using [Spring Initializr](https://start.spring.io/) 
and choosing the following dependencies:

* Web
* JPA
* H2
* Lombok

I additionally replaced JUnit 4 with JUnit 5, so that the resulting dependencies
look like this (Gradle notation): 

```groovy
dependencies {
  implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
  implementation 'org.springframework.boot:spring-boot-starter-web'
  compileOnly 'org.projectlombok:lombok'
  annotationProcessor 'org.projectlombok:lombok'
  runtimeOnly 'com.h2database:h2'
  testImplementation('org.junit.jupiter:junit-jupiter:5.4.0')
  testImplementation('org.springframework.boot:spring-boot-starter-test'){
    exclude group: 'junit', module: 'junit'
  }
}
```

## Spring Data's `Pageable`

No matter if we want to do conventional pagination, infinite scrolling or simple "previous"
and "next" links, the implementation in the backend is the same. 

If the client only wants to display a "slice" of a list of items, it needs to provide 
some input parameters that describe this slice. In Spring Data, these parameters are bundled within
the `Pageable` interface. It provides the following methods, among others (comments are mine):

```java
public interface Pageable {
    
  // number of the current page  
  int getPageNumber();
  
  // size of the pages
  int getPageSize();
  
  // sorting parameters
  Sort getSort();
    
  // ... more methods
}
```

Whenever we want to load only a slice of a full list of items, we can use a `Pageable` instance
as an input parameter, as it provides
the number of the page to load as well as the size of the pages. Through the `Sort` class,
it also allows to define fields to sort by and the direction in which they 
should be sorted (ascending or descending).

The most common way to create a `Pageable` instance is to use the `PageRequest` implementation:

```java
Pageable pageable = PageRequest.of(0, 5, Sort.by(
    Order.asc("name"),
    Order.desc("id")));
```

This will create a request for the first page with 5 items ordered first
by name (ascending) and second by id (descending). **Note that the page index is zero-based by default!**

<div class="notice--success">
  <h4>Confusion with <code>java.awt.print.Pageable</code>?</h4>
  <p>
  When working with <code>Pageable</code>, you'll notice that your IDE will sometimes 
  propose to import <code>java.awt.print.Pageable</code> instead of Spring's <code>Pageable</code>
  class. Since we most probably don't need any classes from the <code>java.awt</code> package, we can
  tell our IDE to ignore it alltogether.   
  </p>
  <p>
  <strong>In IntelliJ</strong>, go to "General -> Editor -> Auto Import" in the settings and add 
  <code>java.awt.*</code> to the list labelled "Exclude from import and completion".
  </p>
  <p>
  <strong>In Eclipse</strong>, go to "Java -> Appearance -> Type Filters" in the preferences and
  add <code>java.awt.*</code> to the package list.
  </p>
</div>

## Spring Data's `Page` and `Slice`

While `Pageable` bundles the *input* parameters of a paging request, the `Page` and `Slice` interfaces
provide metadata for a page of items that is *returned to the client* (comments are mine):

```java
public interface Page<T> extends Slice<T>{
  
  // total number of pages
  int getTotalPages();
  
  // total number of items
  long getTotalElements();
  
  // ... more methods
  
}
```

```java
public interface Slice<T> {
  
  // current page number
  int getNumber();
    
  // page size
  int getSize();
    
  // number of items on the current page
  int getNumberOfElements();
    
  // list of items on this page
  List<T> getContent();
  
  // ... more methods
  
}
```

With the data provided by the `Page` interface, the client has all the information it needs
to provide a pagination functionality. 

We can use the `Slice` interface instead, if we don't
need the total number of items or pages, for instance if we only want to provide 
"previous page" and "next page" buttons and have no need for "first page" and "last page"
buttons. 

The most common implementation of the `Page` interface is provided by the `PageImpl` class:

```java
Pageable pageable = ...;
List<MovieCharacter> listOfCharacters = ...;
long totalCharacters = 100;
Page<MovieCharacter> page = 
    new PageImpl<>(listOfCharacters, pageable, totalCharacters);
```

## Paging in a Web Controller

If we want to return a `Page` (or `Slice`) of items in a web controller, it needs to accept
a `Pageable` parameter that defines the paging parameters, pass it on to the database,
and then return a `Page` object to the client.

### Activating Spring Data Web Support

Paging has to be supported by the underlying persistence layer in order to 
deliver paged answers to any queries. This is why
**the `Pageable` and `Page` classes originate from the Spring Data module**, and not, as one might
suspect, from the Spring Web module.

**In a Spring Boot application** with auto-configuration enabled (which is the default), we don't have 
to do anything since it will load the `SpringDataWebAutoConfiguration` by default, which
includes the `@EnableSpringDataWebSupport` annotation that loads the necessary beans.

**In a plain Spring application** without Spring Boot, we have to use `@EnableSpringDataWebSupport`
on a `@Configuration` class ourselves:

```java
@Configuration
@EnableSpringDataWebSupport
class PaginationConfiguration {
}
```

If we're using `Pageable` or `Sort` arguments in web controller methods *without having 
activated Spring Data Web support*, we'll get exceptions like these:

```
java.lang.NoSuchMethodException: org.springframework.data.domain.Pageable.<init>()
java.lang.NoSuchMethodException: org.springframework.data.domain.Sort.<init>()
```

These exceptions mean that Spring tries to create a `Pageable` or `Sort` instance 
and fails because they don't have a default constructor. 

This is fixed by the Spring Data Web support, since it adds the [`PageableHandlerMethodArgumentResolver`](https://github.com/spring-projects/spring-data-commons/blob/master/src/main/java/org/springframework/data/web/PageableHandlerMethodArgumentResolver.java) 
and [`SortHandlerMethodArgumentResolver`](https://github.com/spring-projects/spring-data-commons/blob/master/src/main/java/org/springframework/data/web/SortHandlerMethodArgumentResolver.java) beans to
the application context, which are responsible for finding web controller method arguments
of types `Pageable` and `Sort` and **populating them with the values of the `page`, `size`, and `sort`
query parameters**.
 
### Accepting a `Pageable` Parameter

With the Spring Data Web support enabled, we can simply use a `Pageable` as an input parameter
to a web controller method and return a `Page` object to the client:

```java
@RestController
@RequiredArgsConstructor
class PagedController {

  private final MovieCharacterRepository characterRepository;

  @GetMapping(path = "/characters/page")
  Page<MovieCharacter> loadCharactersPage(Pageable pageable) {
    return characterRepository.findAllPage(pageable);
  }
  
}
```

An [integration tests](/spring-boot-web-controller-test/) shows that the query parameters `page`, `size`, and `sort` are now evaluated
and "injected" into the `Pageable` argument of our web controller method: 

```java
@WebMvcTest(controllers = PagedController.class)
class PagedControllerTest {

  @MockBean
  private MovieCharacterRepository characterRepository;

  @Autowired
  private MockMvc mockMvc;

  @Test
  void evaluatesPageableParameter() throws Exception {

    mockMvc.perform(get("/characters/page")
        .param("page", "5")
        .param("size", "10")
        .param("sort", "id,desc")   // <-- no space after comma!
        .param("sort", "name,asc")) // <-- no space after comma!
        .andExpect(status().isOk());

    ArgumentCaptor<Pageable> pageableCaptor = 
        ArgumentCaptor.forClass(Pageable.class);
    verify(characterRepository).findAllPage(pageableCaptor.capture());
    PageRequest pageable = (PageRequest) pageableCaptor.getValue();

    assertThat(pageable).hasPageNumber(5);
    assertThat(pageable).hasPageSize(10);
    assertThat(pageable).hasSort("name", Sort.Direction.ASC);
    assertThat(pageable).hasSort("id", Sort.Direction.DESC);
  }
}
```  

The test captures the `Pageable` parameter passed into the repository method and verifies
that it has the properties defined by the query parameters. 

Note that I used [a custom
AssertJ assertion](https://github.com/thombergs/code-examples/blob/master/spring-boot/pagination/src/test/java/io/reflectoring/pagination/PageableAssert.java)
to create readable assertions on the `Pageable` instance.

Also note that in order to sort by multiple fields, we must provide the `sort` query parameter 
multiple times. Each may consist of simply a field name, assuming ascending order,
or a field name with an order, separated by a comma without spaces. **If there is a space
between the field name and the order, the order will not be evaluated**. 
  
### Accepting a `Sort` Parameter

Similarly, we can use a standalone `Sort` argument in a web controller method:

```java
@RestController
@RequiredArgsConstructor
class PagedController {

  private final MovieCharacterRepository characterRepository;

  @GetMapping(path = "/characters/sorted")
  List<MovieCharacter> loadCharactersSorted(Sort sort) {
    return characterRepository.findAllSorted(sort);
  }
}
```

Naturally, a `Sort` object is populated only with the value of the `sort` query parameter,
as this test shows:

```java
@WebMvcTest(controllers = PagedController.class)
class PagedControllerTest {

  @MockBean
  private MovieCharacterRepository characterRepository;

  @Autowired
  private MockMvc mockMvc;

  @Test
  void evaluatesSortParameter() throws Exception {

    mockMvc.perform(get("/characters/sorted")
        .param("sort", "id,desc")   // <-- no space after comma!!!
        .param("sort", "name,asc")) // <-- no space after comma!!!
        .andExpect(status().isOk());

    ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
    verify(characterRepository).findAllSorted(sortCaptor.capture());
    Sort sort = sortCaptor.getValue();

    assertThat(sort).hasSort("name", Sort.Direction.ASC);
    assertThat(sort).hasSort("id", Sort.Direction.DESC);
  }
}
```
### Customizing Global Paging Defaults

If we don't provide the `page`, `size`, or `sort` query parameters when calling a 
controller method with a `Pageable` argument, it will be populated with
default values.

Spring Boot uses 
[the `@ConfigurationProperties` feature](/spring-boot-configuration-properties/) to
bind the following properties to a bean of type `SpringDataWebProperties`: 

```
spring.data.web.pageable.size-parameter=size
spring.data.web.pageable.page-parameter=page
spring.data.web.pageable.default-page-size=20
spring.data.web.pageable.one-indexed-parameters=false
spring.data.web.pageable.max-page-size=2000
spring.data.web.pageable.prefix=
spring.data.web.pageable.qualifier-delimiter=_
```

The values above are the default values. 
Some of these properties are not self-explanatory, so here's what they do:

* with `size-parameter` we can change the name of the `size` query parameter
* with `page-parameter` we can change the name of the `page` query parameter 
* with `default-page-size` we can define the default of the `size` parameter if no value is given
* with `one-indexed-parameters` we can choose if the `page` parameter starts with 0 or with 1
* with `max-page-size` we can choose the maximum value allowed for the `size` query parameter (values larger than this will be reduced)
* with `prefix` we can define a prefix for the `page` and `size` query parameter names (not for the `sort` parameter!) 

The `qualifier-delimiter` property is a *very* special case. We can use the `@Qualifier` annotation on
a `Pageable` method argument to provide a local prefix for the paging query parameters:

```java
@RestController
class PagedController {

  @GetMapping(path = "/characters/qualifier")
  Page<MovieCharacter> loadCharactersPageWithQualifier(
      @Qualifier("my") Pageable pageable) {
    ...
  }

}
```

This has a similar effect to the `prefix` property from above, but it also applies to the
`sort` parameter. The `qualifier-delimiter` is used to delimit the prefix from the 
parameter name. In the example above, only the query parameters `my_page`, `my_size` and `my_sort`
are evaluated.

<div class="notice--success">
  <h4><code>spring.data.web.*</code> Properties are not evaluated?</h4>
  <p>
  If changes to the configuration properties above have no effect, the <code>SpringDataWebProperties</code>
  bean is probably not loaded into the application context.  
  </p>
  <p>
  One reason for this could be that you have used <code>@EnableSpringDataWebSupport</code>
  to activate the pagination support. This will override <code>SpringDataWebAutoConfiguration</code>,
  in which the <code>SpringDataWebProperties</code> bean is created. Use <code>@EnableSpringDataWebSupport</code>
  only in a <em>plain</em> Spring application.
  </p>
</div>

### Customizing Local Paging Defaults

Sometimes we might want to define default paging parameters for a single controller method only.
For this case, we can use the `@PagableDefault` and `@SortDefault` annotations:

```java
@RestController
class PagedController {

  @GetMapping(path = "/characters/page")
  Page<MovieCharacter> loadCharactersPage(
      @PageableDefault(page = 0, size = 20)
      @SortDefault.SortDefaults({
          @SortDefault(sort = "name", direction = Sort.Direction.DESC),
          @SortDefault(sort = "id", direction = Sort.Direction.ASC)
      }) Pageable pageable) {
    ...
  }
  
}
```

If no query parameters are given, the `Pageable` object will now be populated with
the default values defined in the annotations.

Note that the `@PageableDefault` annotation also has a `sort` property, but if we want
to define multiple fields to sort by in different directions, we have to use `@SortDefault`. 

## Paging in a Spring Data Repository

Since the pagination features described in this article come from Spring Data,
it doesn't surprise that Spring Data has complete support for pagination. This support is, however,
explained very quickly, since we only have to add the right parameters and return values
to our repository interfaces. 

### Passing Paging Parameters

We can simply pass a `Pageable` or `Sort` instance into any Spring Data repository method:

```java
interface MovieCharacterRepository 
        extends CrudRepository<MovieCharacter, Long> {

  List<MovieCharacter> findByMovie(String movieName, Pageable pageable);
  
  @Query("select c from MovieCharacter c where c.movie = :movie")
  List<MovieCharacter> findByMovieCustom(
      @Param("movie") String movieName, Pageable pageable);
  
  @Query("select c from MovieCharacter c where c.movie = :movie")
  List<MovieCharacter> findByMovieSorted(
      @Param("movie") String movieName, Sort sort);

}
```

**Even though Spring Data provides a `PagingAndSortingRepository`, we don't have to
use it to get paging support.** It merely
provides two convenience `findAll` methods, one with a `Sort` and one with a `Pageable` 
parameter.

### Returning Page Metadata

If we want to return page information to the client instead of a simple list, 
we simply let our repository methods simply return a `Slice` or a `Page`:

```java
interface MovieCharacterRepository 
        extends CrudRepository<MovieCharacter, Long> {

  Page<MovieCharacter> findByMovie(String movieName, Pageable pageable);

  @Query("select c from MovieCharacter c where c.movie = :movie")
  Slice<MovieCharacter> findByMovieCustom(
      @Param("movie") String movieName, Pageable pageable);

}
```
Every method returning a `Slice` or `Page` must have exactly one `Pageable` parameter, otherwise
Spring Data will complain with an exception on startup.

## Conclusion

The Spring Data Web support makes paging easy in plain Spring applications as well as in Spring 
Boot applications. It's a matter of activating it and then using the right input and output
parameters in controller and repository methods.

With Spring Boot's configuration properties, we have fine-grained control over the defaults 
and parameter names.

There are some potential catches though, some of which I have described in the text above, so
you don't have to trip over them. 

**If you're missing anything about paging with Spring in this
tutorial, let me know in the comments.**

You can find the example code used in this article [on github](https://github.com/thombergs/code-examples/tree/master/spring-boot/paging). 








