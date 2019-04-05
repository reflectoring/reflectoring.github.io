---

title: Documenting your REST API with Spring Rest Docs
categories: [tools]
modified: 2016-12-19
author: tom
tags: [spring, rest, api, documentation, mvc, controller, integration, test, docs, junit]
comments: true
ads: true
---

{% include sidebar_right %}

The first impression counts. When you're developing an API of any kind, chances are 
that the first impression is gained from a look into the API docs. If that first impression
fails to convince, developers will go on looking for another API they can use instead.
 
## Why not Swagger?
Looking for a tool to document a RESTful API, the first tool you probably come across
is [Swagger](http://swagger.io/). Among other things, Swagger provides tooling for a lot of different programming
languages and frameworks and allows automated creation of an API documentation and even of a 
[web frontend that can interact with your API](http://swagger.io/swagger-ui/). Also, Swagger is well established as a tool
supporting the development of RESTful APIs.

But at least if you're familiar to Java, there's a compelling reason to use 
[Spring Rest Docs](https://projects.spring.io/spring-restdocs/) instead of or at least 
additionally to Swagger: Spring Rest Docs integrates directly into your integration tests.
Tests will fail if you forget to document a field that you have just added to your API
or if you removed a field that is still part your API docs. This way, your documentation 
is always up-to-date with your implementation.

This article explains the basics of Spring Rest Docs along
the lines of some code examples. If you want to see it in action, you may want to check out 
the [coderadar](https://github.com/reflectoring/coderadar) project on github.

## Snippet-Generating Integration Tests
The following code snippet shows a simple integration test of a Spring MVC controller that
exposes a REST API to create a `project` resource.

```java
@Test
public void createProjectSuccessfully() throws Exception {
    ProjectResource projectResource = ...
    mvc().perform(post("/projects")
            .content(toJson(projectResource))
            .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andDo(document("projects/create");
}
```

Let's have a look at the details: `mvc()` is a helper method that creates a `MockMvc` 
object that we use to submit a POST request to the URL `/projects`. The result of the
request is passed into the `document()` method to automatically create documentation
for the request. The `document()` method is statically imported from the class
`MockMvcRestDocumentation` to keep the code readable.

The `MockMvc` object returned by the method `mvc()` is initialized with a `JUnitRestDocumentation` object, as shown in the next code snippet. 
This way, the `MockMvc` object is instrumented to create [Asciidoctor](http://asciidoctor.org/)
snippets into the folder `build/generated-snippets`.

```java

@Rule
public JUnitRestDocumentation restDocumentation = new JUnitRestDocumentation("build/generated-snippets");

protected MockMvc mvc() {
    return MockMvcBuilders.webAppContextSetup(applicationContext)
                .apply(MockMvcRestDocumentation.documentationConfiguration(this.restDocumentation))
                .build();
}

```

When the test is executed, Spring Rest Docs will now generate snippets into the snippets folder
that contain an example request and an example response. The following snippets would be generated
into the folder `build/generated-snippets/projects/create`.

http-request.adoc:

```
[source,http,options="nowrap"]
----
POST /projects HTTP/1.1
Content-Type: application/json
Host: localhost:8080
Content-Length: 129

{
  "name" : "name",
  "vcsType" : "GIT",
  "vcsUrl" : "http://valid.url",
  "vcsUser" : "user",
  "vcsPassword" : "pass"
}
----
```

http-response.adoc:

```
[source,http,options="nowrap"]
----
HTTP/1.1 201 Created
Content-Type: application/hal+json;charset=UTF-8
Content-Length: 485

{
  "name" : "name",
  "vcsType" : "GIT",
  "vcsUrl" : "http://valid.url",
  "vcsUser" : "user",
  "vcsPassword" : "pass",
  "_links" : {
    "self" : {
      "href" : "http://localhost:8080/projects/1"
    },
    "files" : {
      "href" : "http://localhost:8080/projects/1/files"
    },
    "analyzers" : {
      "href" : "http://localhost:8080/projects/1/analyzers"
    },
    "strategy" : {
      "href" : "http://localhost:8080/projects/1/strategy"
    }
  }
}
----
```

These examples already go a long way to documenting your REST API. Examples are the best way
for developers to get to know your API. The snippets automatically generated from your test
don't help when they rot in your snippets folder, though, so we have to expose them by 
including them into a central documentation of some sorts.

## Creating API Docs with Asciidoctor
With the snippets at hand, we can now create our API documentation. The snippets are in 
[Asciidoctor](http://asciidoctor.org/) format by default. Asciidoctor is a markup language 
similiar to Markdown, but much more powerful. You can now simply create an Asciidoctor 
document with your favorite text editor. That document will provide the stage for including the 
snippets. An example document would look like this:

```asciidoctor
= My REST API
v{version}, Tom Hombergs, {date}
:doctype: book
:icons: font
:source-highlighter: highlightjs
:highlightjs-theme: github
:toc: left
:toclevels: 3
:sectlinks:
:sectnums:

[introduction]
== Introduction
... some warm introductory words... .

== Creating a Project

=== Example Request
include::{snippets}/projects/create/http-request.adoc[]

=== Example Response
include::{snippets}/projects/create/http-response.adoc[]

```

The document above includes the example HTTP request and response snippets that are generated by
the integration test above. While it could yet be fleshed 
out with a little more text, the documentation above is already worth its weight in gold 
(imagine each byte weighing a pound or so...). Even if you change
your implementation, you will not have to touch your documentation, since the example snippets 
will be generated fresh with each build and thus be up-to-date at all times! You still have to 
include the generation of your snippets into your build though, which we will have a look at
in the next section

## Integrating Documentation into your Build
The integration tests should run with each build. Thus, our documentation snippets are generated
with each build. The missing step now is to generate human-readable documentation from your
asciidoctor document.

This can be done using the [Asciidoctor Gradle Plugin](http://asciidoctor.org/docs/asciidoctor-gradle-plugin/)
when you're using Gradle as your build tool or the [Asciidoctor Maven Plugin](http://asciidoctor.org/docs/asciidoctor-maven-plugin/)
when you're using Maven. The following examples are based on Gradle.

In your `build.gradle`, you will first have to define a dependency to the plugin:

```groovy
buildscript {
    repositories {
        jcenter()
        maven {
            url "https://plugins.gradle.org/m2/"
        }
    }

    dependencies {
        classpath "org.asciidoctor:asciidoctor-gradle-plugin:1.5.3"
    }
}
```

Next, you create a task that calls the plugin to parse your asciidoctor document and transforms
it into a human-readable HTML document. Note, that in the following example, the asciidoctor document 
must be located in the folder `src/main/asciidoc` and that the resulting HTML document is created
at `build/docs/html5/<name_of_your_asciidoc>.html`.

```groovy
ext {
    snippetsDir = file("build/generated-snippets")
}

asciidoctor {
    attributes "snippets": snippetsDir,
            "version": version,
            "date": new SimpleDateFormat("yyyy-MM-dd").format(new Date()),
            "stylesheet": "themes/riak.css"
    inputs.dir snippetsDir
    dependsOn test
    sourceDir "src/main/asciidoc"
    outputDir "build/docs"
}
```

Next, we include the `asciidoctor` task to be run when we execute the `build` task, so that it is automatically
run with each build.

```groovy
build.dependsOn asciidoctor
```

## Wrap-Up
Done! We just created an automated documentation that is updated with each run of our build. Let's
sum up a few facts:

* Documentation of REST endpoints that are covered with a documenting integration test is automatically
  updated with each build and thus stays up-to-date to your implementation
* Documentation of new REST endpoints is only added once you have created a documenting integration test
  for the endpoint
* You should have 100% test coverage of REST endpoints and thus 100% of your REST endpoints documented 
  (this does not necessarily mean 100% line coverage!)
* You have to do a little manual documentation to create the frame that includes the automatically
  generated snippets
* You have your documentation right within your IDE and thus always at hand to change it if necessary

There's more you can do with Spring Rest Docs, which will be covered in future posts: 

* document the fields of a request or response
* document field type constraints 
* document hypermedia (HATEOAS) links
* ...

If you want to see these features in a live example, have a look at the [coderadar REST API](http://www.reflectoring.io/coderadar/1.0.0-SNAPSHOT/docs/restapi.html)
or at the [coderadar sources at github](https://github.com/reflectoring/coderadar). If you want
to dive deeper into the features of Spring Rest Docs have a look at the good [reference documentation](http://docs.spring.io/spring-restdocs/docs/1.1.2.RELEASE/reference/html5/).

Any questions? Drop a comment!
