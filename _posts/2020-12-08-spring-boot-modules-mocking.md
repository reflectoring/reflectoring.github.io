---
title: "Building Reusable Mock Modules with Spring Boot"
categories: ["Spring Boot"]
date: 2020-12-08 00:00:00 +1100
modified: 2020-12-08 20:00:00 +1100
author: default
excerpt: "Having a modular codebase is nice, but wouldn't it be nicer to have a mock module for each real module to use in tests? Let's discuss a way to do that with Spring Boot!"
image:
  auto: 0088-jigsaw
---

Wouldn't it be nice to have a codebase that is cut into loosely coupled modules, with each module having a dedicated set of responsibilities? 

This would mean we can easily find each responsibility in the codebase to add or modify code. It would mean that the codebase is easy to grasp because we would only have to load one module into our brain's working memory at a time. 

And, since each module has its own API, it would mean that **we can create a reusable mock for each module**. When writing an integration test, we just import a mock module and call its API to start mocking away. We no longer have to know every detail about the classes we're mocking.

In this article, we're going to look at creating such modules, discuss why mocking whole modules is better than mocking single beans, and then introduce a simple but effective way of mocking complete modules for easy test setup with Spring Boot.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-mocking-modules" %}

## What's a Module?

When I talk about "modules" in this article, what I mean is this:
 
> A module is a set of highly cohesive classes that have a dedicated API with a set of associated responsibilities.

We can combine multiple modules to bigger modules and finally to a complete application. 

A module may use another module by calling its API.

You could also call them "components", but in this article, I'm going to stick with "module".

## How Do I Build a Module?

When building an application, I suggest doing a little up-front thinking about how to modularize the codebase. What are going to be the natural boundaries within our codebase? 

Do we have an external system that our application needs to talk to? That's a natural module boundary. **We can build a module whose responsibility it is to talk to that external system!**.

Have we identified a functional "bounded context" of use cases that belong together? This is another good module boundary. **We'll build a module that implements the use cases in this functional slice of our application!**.

There are more ways to split an application into modules, of course, and often it's not easy to find the boundaries between them. They might even change over time! All the more important to have a clear structure within our codebase so we can easily move concepts between modules!

**To make the modules apparent in our codebase, I propose the following package structure**:

* each module has its own package
* each module package has a sub-package `api` that contains all classes that are exposed to other modules
* each module package has a sub-package `internal` that contains:
   * all classes that implement the functionality exposed by the API
   * a Spring configuration class that contributes the beans to the Spring application context that are needed to implement that API
* like a Matryoshka doll, each module's `internal` sub-package may contain packages with sub-modules, each with their own `api` and `internal` packages
* classes within a given `internal` package may only be accessed by classes within that package.

This makes for a very clear codebase that is easy to navigate. Read more about this code structure in my article about [clear architecture boundaries](/java-components-clean-boundaries/) or look at some code in the [code examples](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-mocking-modules).

Now, that's a nice package structure, but what does that have to do with testing and mocking? 

## What's Wrong With Mocking Single Beans?

As I said in the beginning, we want to look at mocking whole modules instead of single beans. But what's wrong with mocking single beans in the first place?

Let's take a look at a very common way of creating integration tests with Spring Boot. 

Let's say we want to write an integration test for a REST controller that is supposed to create a repository on GitHub and then send an email to the user. 

The integration test might look like this:

```java
@WebMvcTest
class RepositoryControllerTestWithoutModuleMocks {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private GitHubMutations gitHubMutations;

  @MockBean
  private GitHubQueries gitHubQueries;

  @MockBean
  private EmailNotificationService emailNotificationService;

  @Test
  void givenRepositoryDoesNotExist_thenRepositoryIsCreatedSuccessfully() 
      throws Exception {
  
    String repositoryUrl = "https://github.com/reflectoring/reflectoring";
    
    given(gitHubQueries.repositoryExists(...)).willReturn(false);
    given(gitHubMutations.createRepository(...)).willReturn(repositoryUrl);
    
    mockMvc.perform(post("/github/repository")
      .param("token", "123")
      .param("repositoryName", "foo")
      .param("organizationName", "bar"))
      .andExpect(status().is(200));
    
    verify(emailNotificationService).sendEmail(...);
    verify(gitHubMutations).createRepository(...);
  }

}
```

This test actually looks quite neat, and I have seen (and written) many tests like it. But the devil is in the details, as they say.

We're using the `@WebMvcTest` annotation to set up a Spring Boot application context for [testing Spring MVC controllers](/spring-boot-web-controller-test/). The application context will contain all the beans necessary to get the controllers working and nothing else. 

But our controller needs some additional beans in the application context to work, namely `GitHubMutations`, `GitHubQueries`, and `EmailNotificationService`. So, we add mocks of those beans to the application context via the `@MockBean` annotation.

In the test method, we define the state of these mocks in a couple of `given()` statements, then call the controller endpoint we want to test, and then `verify()` that certain methods have been called on the mocks. 

So, what's wrong with this test? Two main things come to mind:

First, to set up the `given()` and `verify()` sections, the test needs to know which methods on the mocked beans the controller is calling. **This low-level knowledge of implementation details makes the test vulnerable to modifications**. Each time an implementation detail changes, we have to update the test as well. This dilutes the value of the test and makes maintaining tests a chore rather than a "sometimes routine".

Second, the `@MockBean` annotations will cause Spring to create a new application context for each test (unless they have exactly the same fields). **In a codebase with more than a couple of controllers, this will increase the test runtime considerably**.
 
If we invest a bit of effort into building a modular codebase like outlined in the previous section, we can get around both of these disadvantages by building reusable mock modules.

Let's find out how by looking at a concrete example.

## A Modular Spring Boot Application

Ok, let's look at how we can implement reusable mock modules with Spring Boots. 

Here's the folder structure of an example application. You can find the code [on GitHub](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-mocking-modules) if you want to follow along:

```text
├── github
|   ├── api
|   |  ├── <I> GitHubMutations
|   |  ├── <I> GitHubQueries
|   |  └── <C> GitHubRepository
|   └── internal
|      ├── <C> GitHubModuleConfiguration
|      └── <C> GitHubService
├── mail
|   ├── api
|   |  └── <I> EmailNotificationService
|   └── internal
|      ├── <C> EmailModuleConfiguration
|      ├── <C> EmailNotificationServiceImpl
|      └── <C> MailServer
├── rest
|   └── internal
|       └── <C> RepositoryController
└── <C> DemoApplication
```

The application has 3 modules:

* the `github` module provides an interface to interact with the GitHub API,
* the `mail` module provides email functionality,
* and the `rest` module provides a REST API to interact with the application.
 
 
Let's look into each module in a bit more detail.

### The GitHub Module

The `github` module provides two interfaces (marked with `<I>`) as part of its API: 

* `GitHubMutations`, which provides some write operations to the GitHub API, 
* and `GitHubQueries`, which provides some read operations on the GitHub API. 

This is what the interfaces look like:

```java
public interface GitHubMutations {

    String createRepository(String token, GitHubRepository repository);

}

public interface GitHubQueries {

    List<String> getOrganisations(String token);

    List<String> getRepositories(String token, String organisation);

    boolean repositoryExists(String token, String repositoryName, String organisation);

}
```

It also provides the class `GitHubRepository`, which is used in the signatures of those interfaces.

Internally, the `github` module has the class `GitHubService`, which implements both interfaces, and the class `GitHubModuleConfiguration`, which is a Spring configuration the contributes a `GitHubService` instance to the application context:

```java
@Configuration
class GitHubModuleConfiguration {

  @Bean
  GitHubService gitHubService(){
    return new GitHubService();
  }

}
```

Since `GitHubService` implements the whole API of the `github` module, this one bean is enough to make the module's API available to other modules in the same Spring Boot application.

### The Mail Module

The `mail` module is built similarly. Its API consists of a single interface `EmailNotificationService`:

```java
public interface EmailNotificationService {

    void sendEmail(String to, String subject, String text);

}
```

This interface is implemented by the internal bean `EmailNotificationServiceImpl`. 

Note that I'm using a different naming convention in the `mail` module than in the `github` module. While the `github` module has an internal class ending with `*Service`, the `mail` module has a `*Service` class as part of its API. While the `github` module doesn't use the ugly `*Impl` suffix, the `mail` module does. 

I did this on purpose to make the code a bit more realistic. Have you ever seen a codebase (that you didn't write by yourself) that uses the same naming conventions all over the place? I haven't. 

But if you build modules like we do in this article, it doesn't really matter much. The ugly `*Impl` class is hidden behind the module's API anyway.

Internally, the `mail` module has the `EmailModuleConfiguration` class that contributes implementations for the API to the Spring application context:

```java
@Configuration
class EmailModuleConfiguration {

  @Bean
  EmailNotificationService emailNotificationService() {
    return new EmailNotificationServiceImpl();
  }

}
```

### The REST Module

The `rest` module consists of a single REST controller:

```java
@RestController
class RepositoryController {

  private final GitHubMutations gitHubMutations;
  private final GitHubQueries gitHubQueries;
  private final EmailNotificationService emailNotificationService;

  // constructor omitted

  @PostMapping("/github/repository")
  ResponseEntity<Void> createGitHubRepository(
      @RequestParam("token") String token,
      @RequestParam("repositoryName") String repoName,
      @RequestParam("organizationName") String orgName
  ) {

    if (gitHubQueries.repositoryExists(token, repoName, orgName)) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }
    
    String repoUrl = gitHubMutations.createRepository(
        token, 
        new GitHubRepository(repoName, orgName));
    
    emailNotificationService.sendEmail(
        "user@mail.com", 
        "Your new repository", 
        "Here's your new repository: " + repoUrl);

    return ResponseEntity.ok().build();
  }

}
```

The controller calls the `github` module's API to create a GitHub repository and then sends a mail via the `mail` module's API to let the user know about the new repository.

## Mocking the GitHub Module

Now, let's see how we can build a reusable mock for the `github` module. We create a `@TestConfiguration` class that provides all the beans of the module's API:

```java
@TestConfiguration
public class GitHubModuleMock {

  private final GitHubService gitHubServiceMock = Mockito.mock(GitHubService.class);

  @Bean
  @Primary
  GitHubService gitHubServiceMock() {
    return gitHubServiceMock;
  }

  public void givenCreateRepositoryReturnsUrl(String url) {
    given(gitHubServiceMock.createRepository(any(), any())).willReturn(url);
  }

  public void givenRepositoryExists(){
    given(gitHubServiceMock.repositoryExists(
        anyString(), 
        anyString(),
        anyString())).willReturn(true);
  }

  public void givenRepositoryDoesNotExist(){
    given(gitHubServiceMock.repositoryExists(
        anyString(), 
        anyString(),
        anyString())).willReturn(false);
  }

  public void assertRepositoryCreated(){
    verify(gitHubServiceMock).createRepository(any(), any());
  }

  public void givenDefaultState(String defaultRepositoryUrl){
    givenRepositoryDoesNotExist();
    givenCreateRepositoryReturnsUrl(defaultRepositoryUrl);
  }

  public void assertRepositoryNotCreated(){
    verify(gitHubServiceMock, never()).createRepository(any(), any());
  }

}
```

Additionally to providing a mocked `GitHubService` bean, we have added a bunch of `given*()` and `assert*()` methods to this class. 

The `given*()` methods allow us to set the mock into a desired state and the `verify*()` methods allow us to check if some interaction with the mock has happened or not after having run a test. 

The `@Primary` annotation makes sure that if both the mock and the real bean are loaded into the application context, the mock takes precedence.

## Mocking the Email Module 

We build a very similar mock configuration for the `mail` module:

```java
@TestConfiguration
public class EmailModuleMock {

  private final EmailNotificationService emailNotificationServiceMock = 
      Mockito.mock(EmailNotificationService.class);

  @Bean
  @Primary
  EmailNotificationService emailNotificationServiceMock() {
    return emailNotificationServiceMock;
  }

  public void givenSendMailSucceeds() {
    // nothing to do, the mock will simply return
  }

  public void givenSendMailThrowsError() {
    doThrow(new RuntimeException("error when sending mail"))
        .when(emailNotificationServiceMock).sendEmail(anyString(), anyString(), anyString());
  }

  public void assertSentMailContains(String repositoryUrl) {
    verify(emailNotificationServiceMock).sendEmail(anyString(), anyString(), contains(repositoryUrl));
  }

  public void assertNoMailSent() {
    verify(emailNotificationServiceMock, never()).sendEmail(anyString(), anyString(), anyString());
  }

}
```

## Using the Mock Modules in a Test

Now, with the mock modules in place, we can use them in the integration test of our controller:

```java
@WebMvcTest
@Import({
    GitHubModuleMock.class,
    EmailModuleMock.class
})
class RepositoryControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private EmailModuleMock emailModuleMock;

  @Autowired
  private GitHubModuleMock gitHubModuleMock;

  @Test
  void givenRepositoryDoesNotExist_thenRepositoryIsCreatedSuccessfully() throws Exception {

    String repositoryUrl = "https://github.com/reflectoring/reflectoring.github.io";

    gitHubModuleMock.givenDefaultState(repositoryUrl);
    emailModuleMock.givenSendMailSucceeds();

    mockMvc.perform(post("/github/repository")
        .param("token", "123")
        .param("repositoryName", "foo")
        .param("organizationName", "bar"))
        .andExpect(status().is(200));

    emailModuleMock.assertSentMailContains(repositoryUrl);
    gitHubModuleMock.assertRepositoryCreated();
  }

  @Test
  void givenRepositoryExists_thenReturnsBadRequest() throws Exception {

    String repositoryUrl = "https://github.com/reflectoring/reflectoring.github.io";

    gitHubModuleMock.givenDefaultState(repositoryUrl);
    gitHubModuleMock.givenRepositoryExists();
    emailModuleMock.givenSendMailSucceeds();

    mockMvc.perform(post("/github/repository")
        .param("token", "123")
        .param("repositoryName", "foo")
        .param("organizationName", "bar"))
        .andExpect(status().is(400));

    emailModuleMock.assertNoMailSent();
    gitHubModuleMock.assertRepositoryNotCreated();
  }

}
```

We use the `@Import` annotation to import the mocks into the application context. 

Note that the `@WebMvcTest` annotation will cause the real modules to be loaded into the application context as well. That's why we used the `@Primary` annotation on the mocks so that the mocks take precedence.

<div class="notice warning">
  <h4>What To Do About Misbehaving Modules?</h4>
  <p>A module may misbehave by trying to connect to some external service during startup. The <code>mail</code> module, for example, may create a pool of SMTP connections on startup. This naturally fails when there is no SMTP server available. This means that when we load the module in an integration test, the startup of the Spring context will fail.</p>
  <p>
  To make the module behave better during tests, we can introduce a configuration property <code>mail.enabled</code>. Then, we annotate the module's configuration class with <code>@ConditionalOnProperty</code> to tell Spring not to load this configuration if the property is set to <code>false</code>.  
  </p>
  <p>
  Now, during a test, only the mock module is being loaded. 
  </p>
</div>

Instead of mocking out the specific method calls in the test, we now call the prepared `given*()` methods on the mock modules. This means **the test no longer requires internal knowledge of the classes the test subject is calling.** 

After executing the code, we can use the prepared `verify*()` methods to verify if a repository has been created or a mail has been sent. Again, without knowing about the specific underlying method calls.

If we need the `github` or `mail` modules in another controller, we can use the same mock modules in the test for that controller.

If we later decide to build another integration that uses the real version of some modules, but the mocked versions of other modules, it's a matter of a couple of `@Import` annotations to build the application context we need. 

**This is the whole idea of modules: we can take the real module A and the mock of module B, and we'll still have a working application that we can run tests against.**

The mock modules are our central place for mocking behavior within that module. They can translate high-level mocking expectations like "make sure that a repository can be created" into low-level calls to mocks of the API beans.

## Conclusion

By being intentional about what is part of a module's API and what is not, we can build a properly modular codebase with little chance of introducing unwanted dependencies. 

Since we know what is part of the API and what is not, we can build a dedicated mock for the API of each module. We don't care about the internals, we're only mocking the API. 

A mock module can provide an API to mock certain states and to verify certain interactions. By using the API of the mock module instead of mocking each single method call, our integration tests become more resilient to change. 