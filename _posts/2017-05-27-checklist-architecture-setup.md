---

title: 'A Checklist for setting up a Java-based Software Architecture'
categories: [methodology]
modified: 2017-05-27
author: tom
tags: [software, architecture, setup, checklist, technology, stack, microservice, monolith]
comments: true
ads: false
---

I recently had the opportunity to propose the architecture for a new large-scale software
project. While it's fun being paid for finding the technologies that best fit to
the customer's requirements (of which only a fraction is available at the time, of course), it may 
also be daunting having to come up with a solution that is future-proof and scales with expectations.

To ease this task in the future, I compiled a list of concerns you should think about
when setting up a new software project. For most of those concerns in the list below, I offer one or more technologies that
are a possible solution to that concern.

Note that this list is not 
complete and weighs heavily towards Java technologies, so you should use this list with the
caution that the task of selecting the best architecture for your customer deserves.

Some of the concerns are inspired by [arc42](http://www.arc42.de/) which provides a template
that I often use as a basis for documenting a software architecture.

I hope this helps any readers who are setting up a new Java-based software architecture.

# Architecture Style

Which should be the basic architecture style of the application? There are of course more
styles that are listed here. However, monoliths and micro-services seem to be the most
discussed architecture styles these days.

| **Monolithic**              | A monolithic architecture contains all of its functionality in a single deployment unit. Might not support a flexible release cycle but doesn't need potentially fragile distributed communication.
| **(Micro-) Services**       | Multiple, smaller deployment units that make use of distributed communication to implement the application's functionality. May be more flexible for creating smaller and faster releases and scales with multiple teams, but comes at the cost of distributed communication problems.


# Back-End Concerns

What things should you think about that concern the back-end of the application you
want to build?

| **Logging**                 | Use [SLF4J](https://www.slf4j.org/) with either [Logback](https://logback.qos.ch/) or [Log4J2](https://logging.apache.org/log4j/2.x/) underneath. Not really much to think on, nowadays. You should however think about using a central log server (we will come to that later).|
| **Application Server**      | Where should the software be hosted? A distributed architecture may work well with [Spring Boot](https://projects.spring.io/spring-boot/) while a monolithic architecture might better be served from a full-fledged application server like [Wildfly](http://wildfly.org/). Choice of application server is often predetermined for you, since corporate operations like to define a default server for all applications they have to run.|
| **Job Execution**           | Almost every medium-to-large sized application will need to execute scheduled jobs like cleaning up a database or batch-importing third-party data. Spring offers [basic job scheduling features](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/scheduling.html). For more sophisticated needs, you may want to use [Quartz](http://www.quartz-scheduler.org/), which integrates into a Spring application nicely as well. 
| **Database Refactoring**    | You should think about how to update the structure of your relational database between two versions of your software. In small projects, manual execution of SQL scripts may be acceptable, in medium-to-large projects you may want to use a database refactoring framework like [Flyway](https://flywaydb.org/) or [Liquibase](http://www.liquibase.org/) (see my [previous blog post](/database-refactoring-flyway-vs-liquibase/). If you are using a schemaless database you don't really need a database refactoring framework (you should still think about which changes you can do to your data in order to stay backwards-compatible, though).
| **API Technology**          | Especially when building a distributed architecture, you need to think about how your deployment units communicate with each other. They may communicate asynchronously via a messaging middleware like [Kafka](https://kafka.apache.org/) or synchronously, for example via REST using [Spring MVC](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/mvc.html) and [Feign](https://github.com/OpenFeign/feign). 
| **API Documentation**       | The internal and external APIs you create must be documented in some form. For REST APIs you may use [Swagger](http://swagger.io/)'s heavy-weight annotations or use [Spring Rest Docs](https://projects.spring.io/spring-restdocs/) for a more flexible (but more manual) approach (see my [previous blog post](/spring-restdocs/)). When using no framework at all, document your APIs by hand using a markup format like [Markdown](https://de.wikipedia.org/wiki/Markdown) or [Asciidoctor](https://de.wikipedia.org/wiki/AsciiDoc).
| **Measuring Metrics**       | Are there any metrics like thoughput that should be measured while the application is running? Use a metric framework like [Dropwizard Metrics](http://metrics.dropwizard.io) (see my [previous blog post](/transparency-with-spring-boot/)) or the [Prometheus Java Client](https://github.com/prometheus/client_java).
| **Authentication**          | How will users of the application prove that they are who they claim to be? Will users be asked to provide username and password or are there additional credentials to check? With a client-side single page app, you need to issue some kind of token like in [OAuth](https://oauth.net/2/) or [JWT](https://jwt.io/) (also see [this blog post](/openid-connect/) about OpenID). In other web apps, a session id cookie may be enough. 
| **Authorization**           | Once authenticated, how will the application check what the user is allowed to do and what is prohibited? On the server side, [Spring Security](https://projects.spring.io/spring-security/) is a framework that supports implementation of different authorization mechanisms.
| **Database Technology**     | Does the application need a structured, schema-based database? Use a relational database. Is it storing document-based structures? Use [MongoDB](https://www.mongodb.com/). Key-Value Pairs? [Redis](https://redis.io/). Graphs? [Neo4J](https://neo4j.com/).
| **Persistence Layer**       | When using a relational database, [Hibernate](http://hibernate.org/) is the de-facto default technology to map your objects into the database. You may want to use [Spring Data JPA](http://projects.spring.io/spring-data-jpa/) on top of Hibernate for easy creation of repository classes. Spring Data JPA also supports many NoSQL databases like Neo4J or MongoDB. However, there are alternative database-accessing technologies like [iBatis](http://ibatis.apache.org/) and [jOOQ](https://www.jooq.org/).

# Frontend Concerns

What concerns are there to think about that affect the frontend architecture? 

| **Frontend Technology**     | Is the application required to be hosted centrally as a web application or should it be a fat client? If a web application, will it be a client-side single page app (use [Angular](https://angular.io/)) or a server-side web framework (I would propose using [Apache Wicket](http://wicket.apache.org/) or [Thymeleaf](http://www.thymeleaf.org/) / Spring MVC over frameworks like [JSF](https://de.wikipedia.org/wiki/JavaServer_Faces) or [Vaadin](https://vaadin.com/home), unless you have a very good reason). If a fat client, are the requirements in favor of a Swing or JavaFX-based client or something completely different like Electron?
| **Client-side Database**    | Do the clients need to store data? In a web application you can use [Local Storage](https://de.wikipedia.org/wiki/Web_Storage) and [IndexedDB](https://en.wikipedia.org/wiki/Indexed_Database_API). In a fat client you can use some small-footprint database like [Derby](https://db.apache.org/derby/).
| **Peripheral Devices**      | Do the clients need access to some kind of peripheral devices like card readers, authentication dongles or any hardware that does external measurements of some sort? In a fat client you may access those devices directly, in a web application you may have to provide a small client app which accesses the devices and makes their data available via a http server on localhost which can be integrated into the web app within the browser. 
| **Design Framework**        | How will the client app be layouted and designed? In a HTML-based client, you may want to use a framework like [Bootstrap](http://getbootstrap.com/). For fat clients, the available technologies may differ drastically.
| **Measuring Metrics**       | Are there any events (errors, client version, ...) that the client should report to a central server? How will those events be communicated to the server? 
| **Offline Mode**            | Are the clients required to work offline? Which use cases should be available offline and which not? How will client side data be synchronized with the server once the client is online?

# Operations Concerns

What you definitely should discuss with the operations team before proposing your 
architecture to anyone.

| **Servers**                 | Will the application be hosted on real hardware or on virtual machines? [Docker](https://www.docker.com/) is a popular choice for virtualization nowadays.
| **Network Infrastructure**  | How is the network setup? Are there any communication obstacles between different parts of the application or between the application and third party applications? 
| **Load Balancing**          | How will the load on the application be balanced between multiple instances of the software? Is there a hardware load balancer? Does it have to support sticky sessions? Does the app need a reverse proxy that routes requests to different deployment units of the application (you may want to use Zuul)?
| **Monitoring**              | How is the health of the server instances monitored and alarmed ([Icinga](https://www.icinga.com/) may be a fitting tool)? Who will be alarmed? Should there be a central dashboard where all kinds of metrics like thoughput etc. are measured ([Prometheus](https://prometheus.io/) + [Grafana](https://grafana.com/) may be the tools of choice).
| **Service Registry**        | When building a (Micro-)Service Architecture, you may need a central registry for your services so that they find each other. [Eureka](https://github.com/Netflix/eureka) and its integration in Spring Boot may be a tool to look into.
| **Central Log Server**      | Especially in a distributed architecture with many deployment units, but also in a monolithic application (which also should have at least two instances running), a central log server may make bug hunting easier. The [Elastic Stack](https://www.elastic.co/de/products) (Elastic Search, Logstash, Kibana) is popular, but heavy to set up. [Graylog 2](https://www.graylog.org/) is an alternative.
| **Database Operations**     | What are the requirements towards the database? Does it need to support hot failover and / or load balancing between database instance? Does it need online backup? [Oracle RAC](https://www.oracle.com/database/real-application-clusters/) is a pretty default (but expensive) technology here, but other databases support similar requirements. 

# Development Concerns

Things that the whole development team has to deal with every day. Definitely discuss these
points with the development team before starting development.

| **IDE**                     | What's the policy on using IDE's? Is each developer allowed to use his/her IDE of choice? Making a specific IDE mandatory may reduce costs for providing several parallel solutions while letting each developer use his favorite IDE may reduce training costs. I'm a follower of [IntelliJ](https://www.jetbrains.com/idea/) and would try to convert all Eclipsians when starting a new project ;).
| **Build Tool**              | Which tool will do the building? Both [Maven](https://maven.apache.org/) and [Gradle](https://gradle.org/) are popular choices, while I would chose Gradle for it's customizability in form of Groovy Code.
| **Unit Testing**            | Which parts of the code should be unit tested? Which frameworks will be used for this? [JUnit4](http://junit.org/junit4/) and [Mockito](http://site.mockito.org/) are a reasonable starting point (note that JUnit 5 is currently on the way).
| **End-to-End Tests**        | Which parts of the code should be tested with automated end-to-end tests? [Selenium](http://www.seleniumhq.org/) is a popular choice to remote control a browser. When working on a single page application with Angular and [angular-cli](https://cli.angular.io/), [Protractor](http://www.protractortest.org/) is setup by default. Have a look at [this blog post](https://dzone.com/articles/lightweight-e2e-testing-for-spring-boot-angular-ap) for a proposal on how to create end-to-end tests with Selenium while still having access to the database internals. 
| **Version Control**         | Where will the source code be hosted? [Git](https://git-scm.com/) is quickly becoming the de-facto standard, but [Subversion](https://subversion.apache.org/) has a better learning curve.
| **Coding Conventions**      | How are classes and variables named? Is code and javadoc in english or any other language? I would propose to choose an existing code formatter and a [Checkstyle](http://checkstyle.sourceforge.net/) rule set and include it as a build breaker into the build process to make sure that only code that adheres to your conventions are committed to the code base.
| **Code Quality**            | How will you measure code quality? Are the coding conventions enough or will you run additional metrics on the code? How will those metrics be made visible? You may want to setup a central code quality server like [SonarQube](https://www.sonarqube.org/) for all to access.
| **Code Reviews**            | Will you perform code reviews during development (I highly recommend this)? How will thos code reviews be supported by software? There are code review tools like [Review Board](https://www.reviewboard.org/). Some version control tools like [GitLab](https://gitlab.com/) support workflows in which each user works on his own branch until he is ready to merge his changes. A merge request is a perfect opportunity for code reviews.
| **Continuous Integration**  | How will the build process be executed on a regular basis? There are cloud providers like [CircleCI](https://circleci.com/) or [Travis](https://travis-ci.org/) or you may install a local [Jenkins](https://jenkins.io/) server. 
| **Continuous Deployment**   | Are there automatic tasks that deploy your application to a development, staging or production environment? How will these tasks be executed?
| **Logging Guidelines**      | Which information should be logged when? You should provide a guideline for developers to help them include the most valuable information in the log files.
| **Documentation**           | Which parts of the application should be documented how? What information should be documented in a wiki like Confluence and what should be put into Word documents? If there is a chance, use a markup format like Markdown ord AsciiDoc instead of Word.
