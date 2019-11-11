---
title: Static Data with Spring Boot
categories: [spring-boot]
date: 2019-11-12 06:00:00 +1100
modified: 2019-11-12 06:00:00 +1100
excerpt: "Sometimes we need some structured, static data in our application. Spring Boot provides an easy way to maintain and access such data without the need of a database."
image:
  auto: 0031-matrix
tags: ["configuration"]
---

Sometimes we need some structured, static data in our application. Perhaps the static data is a workaround until we have built the full feature that stores the data in the database and allows users to maintain the data themselves. Or we just need a way to easily maintain and access rarely changing data without the overhead of storing it in a database.

Use cases might be:

* maintaining a large enumeration containing structured information that changes every once in a while - we don't want to use enums in code because we don't want to recompile the whole application for each change, or
* displaying static data in an application, like the name and address of the CEO in the letterhead of an invoice or a "Quote of the Day" on a web page, or
* using any structured data you can think of that you don't want to maintain in code nor in the database.

With its [`@ConfigurationProperties` feature](/spring-boot-configuration-properties), Spring Boot supports access to structured data from one or more configuration files. 

In this article, we'll have a look at:
 * how to create a configuration file with the data,
 * how to create an integration test that verifies the setup, and
 * how to access the data in the application.
 
We'll take the "Quote of the Day" use case as an example (I actually built that a couple weeks back as a farewell present to my previous team :)).

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/static" %}

## Storing Static Data in a Config File

First, we create a YAML file `quotes.yml` that contains our static data:

```yml
static:
  quotes:
  - text: "A clever person solves a problem. A wise person avoids it."
    author: "Albert Einstein"
  - text: "Adding manpower to a late software project makes it later."
    author: "Fred Brooks"
```

If you prefer properties files over YAML, you can use that instead. It's just easier to represent nested data structures with YAML.

In our case, each quote has a text and an author. Each quote will later be represented in a `Quote` object. 

Note that we prefixed the data with `static:quotes`. **This is necessary to create a unique namespace** because Spring Boot will later merge the content of this config file with the rest of its configuration.

## Making Spring Boot Aware of the Config File

Now we have to make Spring Boot aware of this configuration file. We can do this by setting the system property `spring.config.location` each time we start the Spring Boot application: 

```
-Dspring.config.location=./,./quotes.yml
```

This tells Spring Boot to search for an `application.properties` or `application.yml` file in the current folder (which is the default) and to additionally load the file `quotes.yml`. 

This is all we need to do for Spring Boot to load our YAML file and expose the content within our application.

## Accessing the Static Data

Now to the code.

First off, we need a `Quote` data structure that serves as a vessel for the configuration data:

```java
public class Quote {

  private String text;
  private String author;

  public Quote() {
  }

  // getters and setters omitted
}
```

The `Quote` class only has simple `String` properties. If we have more complex data types, we can make use of [custom converters](/spring-boot-configuration-properties/#custom-types) to convert the configuration parameters (which are always `String`s) to the custom types. 

Then we take advantage of Spring Boot's `@ConfigurationProperties` feature to bind the static data to a `QuotesProperties` object:

```java
@Component
@ConfigurationProperties("static")
public class QuotesProperties {

  private final List<Quote> quotes;

  public QuotesProperties(List<Quote> quotes) {
    this.quotes = quotes;
  }

  public List<Quote> getQuotes(){
    return this.quotes;
  }

}
```

This is where our namespace prefix comes into play. The `QuotesProperties` class is bound to the namespace `static` and the `quotes` prefix in the config file binds to the field of the same name.  

<div class="notice success">
  <h4>Getting a "Binding failed" error?</h4>
  <p>
   Spring Boot is a little intransparent in the error messages when the binding of a configuration property fails. You might get an error message like <code>Binding to target ... failed ... property was left unbound</code> without knowing the root cause.
  </p>
  <p>
  In my case, the root cause was always that I did not provide <strong>a default constructor and getters and setters</strong> in one of the classes that act as a data structure for the configuration properties (<code>Quote</code>, in this case). Spring Boot needs a no-args constructor and getters and setters to populate the data.
  </p>
</div>

## Verifying  Access to the Static Data

To test if our static data works as expected, we can create a simple [integration test](/spring-boot-test/):

```java
@SpringBootTest(
  properties = { "spring.config.location = ./,file:./quotes.yml" }
)
class QuotesPropertiesTest {

  @Autowired
  private QuotesProperties quotesProperties;

  @Test
  void staticQuotesAreLoaded() {
    assertThat(quotesProperties.getQuotes()).hasSize(2);
  }

}
```

The most important part of this test is setting the `spring.config.location` property to tell Spring Boot to pick up our `quotes.yml` file.

Then, we can simply inject the `QuotesProperties` bean and assert that it contains the quotes we expect.

## Accessing the Static Data

Finally, having the `QuotesProperties` bean in place and tested, we can now simply inject it into any other bean to do whatever we need with our quotes. For instance, we can build a scheduler that logs a random quote every 5 seconds:

```java
@Configuration
@EnableScheduling
public class RandomQuotePrinter {

  private static final Logger logger = 
    LoggerFactory.getLogger(RandomQuotePrinter.class);
  private final Random random = new Random();
  private final QuotesProperties quotesProperties;

  public RandomQuotePrinter(QuotesProperties quotesProperties) {
    this.quotesProperties = quotesProperties;
  }

  @Scheduled(fixedRate = 5000)
  void printRandomQuote(){
    int index = random.nextInt(quotesProperties.getQuotes().size());
    Quote quote = quotesProperties.getQuotes().get(index);
    logger.info("'{}' - {}", quote.getText(), quote.getAuthor());
  }
}
```

## Conclusion

With `@ConfigurationProperties`, Spring Boot makes it easy to load configuration from external sources, especially from local configuration files. These files can contain [custom complex data structures](/spring-boot-configuration-properties/#complex-property-types) and thus are ideal for static data that we don't want to maintain within our source code or the database.

You can find the code to this article [on github](https://github.com/thombergs/code-examples/tree/master/spring-boot/static).