---
title: "Unit Testing with Spring Boot"
categories: [meta]
modified: 2018-12-31
last_modified_at: 2018-12-31
author: tom
tags: 
comments: true
ads: true
excerpt: ""
sidebar:
  toc: true
---

{% include sidebar_right %}

# Creating a Testable Spring Bean

* Field Injection vs. Constructor Injection
* don't pollute your code with `@Autowired` (no longer needed with Spring 5)
* make dependencies final
* use Lomboks `@RequiredArgsConstructor` to reduce boilerplate
* we may even remove the `@Component` annotation to make it completely Spring-agnostic

# The Cost of @SpringBootRun

* example with `@SpringBootRun`
* builds a whole ApplicationContext each time
* measure time: how long does it take even with a minimal example?
* Spring builds a new context each time it changes
  * code
* conclusion: don't use it for unit tests

# Mocking Dependencies with Mockito
* Mockito.mock()
* MockitoJunitRunner und @Mock

# Creating Readable Assertions with assertJ
* transform assertions from above into assertJ
* write your own assertion

# Naming Test Classes and Methods
* test classes should be named *Tests not *Test
* method names should express what is tested
  * given_when_then
  
# Navigating Between Test and Production Code
* shortcut in Intellij: CTRL+SHIFT+T
* have the production code on the second screen

# Conclusion
