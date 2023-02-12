---
title: "Getting started with Spring Security"
categories: ["Spring"]
date: 2022-10-27 00:00:00 +1100
modified: 2022-10-27 00:00:00 +1100
authors: ["ranjani"]
description: "Getting started with Spring Security"
image: images/stock/0101-keylock-1200x628-branded.jpg
url: spring-security
---

**[Spring Security](https://docs.spring.io/spring-security/reference/index.html)** is a framework that helps secure enterprise applications.
By integrating with Spring MVC, Spring Webflux or Spring Boot, we can create a powerful and highly customizable authentication and access-control framework. 
In this article, we will deep-dive into the core concepts and take a closer look at
the defaults that Spring Security provides and how they work. We will further try to customise them and look at its impact on the application.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/csrf" %}}

# Creating a sample application

We will begin by building an application from scratch and look at how spring configures and provides security to it.
Let's create an application from [spring starter](https://start.spring.io/) and add the minimum required dependencies.

{{% image alt="settings" src="images/posts/getting-started-with-spring-security/initializr.JPG" %}}

Let's generate the project and import it in our IDE and configure it to run on port 8083.
````text
mvnw clean verify spring-boot:run (for Windows)
./mvnw clean verify spring-boot:run (for Linux)
````
Once the application has successfully started, we should see a login page on startup.

{{% image alt="settings" src="images/posts/getting-started-with-spring-security/login.JPG" %}}

The console logs print the default password that was randomly generated as a part of the default security configuration:
{{% image alt="settings" src="images/posts/getting-started-with-spring-security/login-logs.JPG" %}}
With the default username as `user` and the default password as printed in the logs, we should be able to login to the application.
We can override these defaults in our `application.yml`:
````yaml
spring:
  security:
    user:
      name: admin
      password: passw@rd
````
With this configuration, we should now be able to login with user as `admin` and password as `passw@rd`.

{{% info title="Starter dependency versions" %}}
Here, we have used **Spring Boot version 2.7.5**. Based on this version, Spring Boot internally resolves **Spring Security version as 5.7.4**. 
However, we can override these versions if required in our `pom.xml` as below:
````xml
<properties>
    <spring-security.version>5.2.5.RELEASE</spring-security.version>
</properties>
````
{{% /info %}}

## Understanding the default security configuration

To understand how the default configuration works, we first need to take a look at the following:
- **Servlet Filters**
- **Authentication**
- **Authorization**

### Filters
If we take a closer look at the console logs on application startup, we can see that the `DefaultSecurityChain` triggers
a chain of filters that are called **before the request reaches the `DispatcherServlet`.**
````text
o.s.s.web.DefaultSecurityFilterChain     : Will secure any request with 
[org.springframework.security.web.session.DisableEncodeUrlFilter@2fd954f, 
org.springframework.security.web.context.request.async.WebAsyncManagerIntegrationFilter@5731d3a, 
org.springframework.security.web.context.SecurityContextPersistenceFilter@5626d18c, 
org.springframework.security.web.header.HeaderWriterFilter@52b3bf03, 
org.springframework.security.web.csrf.CsrfFilter@30c4e352, 
org.springframework.security.web.authentication.logout.LogoutFilter@37ad042b, 
org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter@1e60b459, 
org.springframework.security.web.authentication.ui.DefaultLoginPageGeneratingFilter@29b40b3, 
org.springframework.security.web.authentication.ui.DefaultLogoutPageGeneratingFilter@6a0f2853, 
org.springframework.security.web.authentication.www.BasicAuthenticationFilter@254449bb, 
org.springframework.security.web.savedrequest.RequestCacheAwareFilter@3dc95b8b, 
org.springframework.security.web.servletapi.SecurityContextHolderAwareRequestFilter@2d55e826, 
org.springframework.security.web.authentication.AnonymousAuthenticationFilter@1eff3cfb, 
org.springframework.security.web.session.SessionManagementFilter@462abec3, 
org.springframework.security.web.access.ExceptionTranslationFilter@6f8aba08, 
org.springframework.security.web.access.intercept.FilterSecurityInterceptor@7ce85af2]
````

To understand how the `FilterChain` works, let's check out the flowchart from the [Spring Security documentation](https://docs.spring.io/spring-security/reference/servlet/architecture.html#servlet-securityfilterchain)
{{% image alt="settings" src="images/posts/getting-started-with-spring-security/filterChain.JPG" %}}
Let's look at some core components that take part in the filter chain:
1. [DelegatingFilterProxy](https://docs.spring.io/spring-security/reference/servlet/architecture.html#servlet-delegatingfilterproxy)
It is a **servlet filter** provided by the Spring framework that acts as a **bridge between the Servlet container and the Spring Application Context**. The `DelegatingFilterProxy` class is responsible
for wiring any class that implements `javax.servlet.Filter` into the filter chain.
2. [FilterChainProxy](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/FilterChainProxy.html)
Spring security internally creates a `FilterChainProxy` **bean** named `springSecurityFilterChain` wrapped in `DelegatingFilterProxy`.
The `FilterChainProxy` is a filter that chains multiple filters that are created by Spring based on the security configuration.
Thus, the `DelegatingFilterProxy` delegates request to the `FilterChainProxy` which determines the filters that need to be invoked.
3. [SecurityFilterChain](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/SecurityFilterChain.html):
The security filters in the `SecurityFilterChain` are beans registered with `FilterChainProxy`. An application can have multiple `SecurityFilterChain`.
`FilterChainProxy` uses the `RequestMatcher` interface on `HttpServletRequest` to determine which `SecurityFilterChain` needs to be called.


{{% info title="Additional Notes on Spring Security Chain" %}}
- The default fallback filter chain in a Spring Boot application has a request matcher /** meaning it will apply to all requests.
- The default filter chain has a predefined `@Order` **SecurityProperties.BASIC_AUTH_ORDER**.
- We can exclude this complete filter chain to be called by setting **security.basic.enabled=false.**
- We can define the ordering of multiple filter chains. For instance, to call a custom filter chain before the default one, we need to set a lower `@Order`. Example `@Order(SecurityProperties.BASIC_AUTH_ORDER - 10)`.
- We can plugin a custom filter within the existing filter chain (to be called at all times or for specific URL patterns) using the `FilterRegistrationBean` or by extending `OncePerRequestFilter`.
- For the defined custom filter, if no @Order is specified, it gets the default order which is at the end of the security chain. (Has the default order `LOWEST_PRECEDENCE`.)
- We can also use methods `addFilterAfter()`, `addFilterAt()` and `addFilterBefore()` to have more control over the ordering of our defined custom filter.

We will take a look at how to define custom filters and filter chain in the later sections.
{{% /info %}}

Now that we know that Spring Security provides us with a default filter chain that calls a set of predefined filters in a specified order, let's try to briefly understand the roles of a few important ones in the chain.
1. **[org.springframework.security.web.csrf.CsrfFilter](https://docs.spring.io/spring-security/site/docs/4.0.x/apidocs/org/springframework/security/web/csrf/CsrfFilter.html)** : 
This filter applies CSRF protection by default to all REST endpoints. To learn more about CSRF capabilities in spring boot and spring security, refer to this [article](https://reflectoring.io/spring-csrf/).
2. **[org.springframework.security.web.authentication.logout.LogoutFilter](https://docs.spring.io/spring-security/site/docs/4.0.x/apidocs/org/springframework/security/web/authentication/logout/LogoutFilter.html)** : 
This filter gets called when the user logs out of the application. The default registered instances of `LogoutHandler` are called that are responsible for invalidating the session and clearing the `SecurityContext`.
Next, the default implementation of `LogoutSuccessHandler` redirects the user to a new page (`/login?logout`).
3. **[org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/authentication/UsernamePasswordAuthenticationFilter.html)** : 
Validates the username and password for the URL (`/login`) with the default credentials provided at startup.
4. **[org.springframework.security.web.authentication.ui.DefaultLoginPageGeneratingFilter](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/authentication/ui/DefaultLoginPageGeneratingFilter.html)** : 
Generates the default login page html at `/login`
5. **[org.springframework.security.web.authentication.ui.DefaultLogoutPageGeneratingFilter](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/authentication/ui/DefaultLogoutPageGeneratingFilter.html)** : 
Generates the default logout page html at `/login?logout`
6. **[org.springframework.security.web.authentication.www.BasicAuthenticationFilter](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/authentication/www/BasicAuthenticationFilter.html)** : 
This filter is responsible for processing any request that has an HTTP request header of **Authorization**, **Basic Authentication scheme**, **Base64 encoded username-password**.
On successful authentication, the `Authentication` object will be placed in the `SecurityContextHolder`.
7. **[org.springframework.security.web.savedrequest.RequestCacheAwareFilter](https://docs.spring.io/spring-security/site/docs/4.0.x/apidocs/org/springframework/security/web/savedrequest/RequestCacheAwareFilter.html)** : 
Spring Security stores requests made in a `RequestCache` object. Its default implementation `HttpSessionRequestCache` stores the last request made in an `HttpSession`.
To access it from the session, we can use the default attribute name `SPRING_SECURITY_SAVED_REQUEST`. This filter is called when the previous request and the current request matches.
8. **[org.springframework.security.web.authentication.AnonymousAuthenticationFilter](https://docs.spring.io/spring-security/site/docs/4.0.x/apidocs/org/springframework/security/web/authentication/AnonymousAuthenticationFilter.html)** : 
If no `Authentication` object is found in the `SecurityContext`, it creates one with the principal `anonymousUser` and role `ROLE_ANONYMOUS`.
9. **[org.springframework.security.web.access.ExceptionTranslationFilter](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/access/ExceptionTranslationFilter.html)** : 
Handles `AccessDeniedException` and `AuthenticationException` thrown within the filter chain. In case of `AuthenticationException` instances of `AuthenticationEntryPoint` are required to handle responses.
In case  of `AccessDeniedException`, this filter will delegate to `AccessDeniedHandler` whose default implementation is `AccessDeniedHandlerImpl`.
10. **[org.springframework.security.web.access.intercept.FilterSecurityInterceptor](https://docs.spring.io/spring-security/site/docs/6.0.0/api/org/springframework/security/web/access/intercept/FilterSecurityInterceptor.html)** : 
This filter is responsible for authorising every request that passes through the filter chain before the request hits the controller.

### Authentication
Authentication is a process of verifying a user's credentials and ensuring his validity.
Let's understand how the spring framework validates the default credentials created:

**Step.1**: `UsernamePasswordAuthenticationFilter` gets called as a part of the security filter chain when FormLogin is enabled i.e when the request is made to the URL `/login`.
This class is a specific implementation of the base [`AbstractAuthenticationProcessingFilter`](https://docs.spring.io/spring-security/site/docs/6.0.0-M4/api/org/springframework/security/web/authentication/AbstractAuthenticationProcessingFilter.html).
When an authentication attempt is made, the filter forwards the request to an `AuthenticationManager`.

**Step.2**: `UsernamePasswordAuthenticationToken` is an implementation of [`Authentication`](https://docs.spring.io/spring-security/site/docs/3.0.x/apidocs/org/springframework/security/core/Authentication.html) interface.
This class specifies that the authentication mechanism must be via username-password.

**Step.3**: With the authentication details obtained, an `AuthenticationManger` tries to authenticate the request with the help of an appropriate implementation of 
`AuthenticationProvider` and a fully authenticated `Authentication` object is returned. The default implementation is the `DaoAuthenticationProvider` which retrieves user details from `UserDetailsService`.
If authentication fails, `AuthenticationException` is thrown.

**Step.4**: The  `loadUserByUsername(username)` method of the `UserDetailsService` returns `UserDetails` object that contains user data.
If no user is found with the given username, `UsernameNotFoundException` is thrown.

**Step.5**: On successful authentication, `SecurityContext` is updated with the currently authenticated user.

To understand the outlined steps above, let's take a look at the authentication architecture as defined in the [Spring Security documentation](https://docs.spring.io/spring-security/reference/6.0.0-M4/servlet/authentication/architecture.html#servlet-authentication-providermanager).

{{% image alt="settings" src="images/posts/getting-started-with-spring-security/providerManager.JPG" %}}

The `ProviderManager` is the most common implementation of `AuthenticationManager`. As seen in the diagram, the `ProviderManager`
delegates the request to a list of configured `AuthenticationProvider` each of which is queried to see if it can perform the authentication.
If the authentication fails with `ProviderNotFoundException`, which is a special type of `AuthenticationException`, it indicates that
the `ProviderManager` does not support the type of `Authentication` passed.
**This architecture allows us to configure multiple authentication types within the same application**.

The `AuthenticationEntryPoint` is an interface that acts as a point of entry for authentication that determines if the client
has included valid credentials when requesting for a resource. If not, an appropriate implementation of the interface
is used to request credentials from the client.

Now, let's understand how the `Authentication` object ties up the entire authentication process.
The `Authentication` interface serves the following purposes:
1. Provides user credentials to the `AuthenticationManager`.
2. Represents the current authenticated used in `SecurityContext`.
Every instance of `Authentication` must contain
- `principal` - This is an instance of `UserDetails` that identifies an user.
- `credentials`
- `authorities` - Instances of [`GrantedAuthority`](https://docs.spring.io/spring-security/site/docs/6.0.0/api/org/springframework/security/core/GrantedAuthority.html)
`GrantedAuthority` play an important role in the authorization process.


{{% info title="Additional Notes on Spring Authentication" %}}
- There could be scenarios where we need Spring Security to be used in case of Authorization alone since it has already
been reliably authenticated by an external system before our application was accessed. Refer to the [pre-authentication](https://docs.spring.io/spring-security/reference/servlet/authentication/preauth.html)
documentation to understand how to configure and handle such scenarios.
- Spring allows various means to [customise the authentication mechanism](https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/storage.html) 
We will take a look at a couple of them in the later sections.
{{% /info %}}

### Authorization
Authorization is a process of ensuring that the user or a system accessing a resource has valid permissions.

In the Spring security filter chain, the `FilterSecurityInterceptor` triggers the authorization check. As seen from the order of filter execution,
authentication runs before authorization. Hence, the filter checks for valid permissions after the user has been successfully authenticated.
In case authorization fails, `AccessDeniedException` is thrown.

#### Granted Authority
As seen in the previous section, every user instance holds a list of `GrantedAuthority` objects.
GrantedAuthority is an interface that has a single method:
````java
public interface GrantedAuthority extends Serializable {
    String getAuthority();
}
````
Spring security by default calls the concrete `GrantedAuthority` implementation, `SimpleGrantedAuthority`.
The `SimpleGrantedAuthority` allows us to specify roles as String, automatically mapping them into `GrantedAuthority` instances.
The `AuthenticationManager` is responsible for inserting `GrantedAuthority` object list into the `Authentication` object.
The `AccessDecisionManager` then uses the `getAuthority()` to decide if authorization is successful.

#### Granted Authorities vs Roles
Spring Security provides authorization support via both granted authorities and roles using the `hasAuthority()` and `hasRole()` methods respectively.
For most cases, both the methods can be interchangeably used, the most notable difference being the `hasRole()` need not specify the ROLE prefix while the `hasAuthority()` needs the complete string to be explicity specified.
For instance, `hasAuthority("ROLE_ADMIN")` and `hasRole("ADMIN")` perform the same task.

{{% info title="Additional Notes on Spring Authorization" %}}
- Spring allows us to configure method level securities using `@PreAuthorize` and `@PostAuthorize` annotations. 
As the name specifies, they allow us to authorize the user before and after the method execution. Conditions for authorization check can be specified in Spring Expression Language (SpEL). 
We will look at a few examples in the further sections.
  {{% /info %}}


## Common exploit protection
The default spring security configuration comes with a protection against variety of attacks enabled by default.
We will not cover the details of those in this article. You can refer to the [Spring documentation](https://docs.spring.io/spring-security/reference/features/exploits/index.html)
for a detailed guide. However, to understand in-depth spring security configuration on CORS and CSRF refer to these articles:
- [CORS in Spring Security](https://reflectoring.io/spring-cors/)
- [CSRF in Spring Security](https://reflectoring.io/spring-csrf/)

## Implementing the Security Configuration 
Now that we are familiar with the details of how Spring Security works, let's understand the configuration setup in our application to handle the various scenarios 
we briefly touched upon in the previous sections.

### Default configuration

````java
class SpringBootWebSecurityConfiguration {
    @ConditionalOnDefaultWebSecurity
    static class SecurityFilterChainConfiguration {
        SecurityFilterChainConfiguration() {
        }

        @Bean
        @Order(2147483642)
        SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
            ((AuthorizedUrl) http.authorizeRequests().anyRequest()).authenticated();
            http.formLogin();
            http.httpBasic();
            return (SecurityFilterChain) http.build();
        }
    }
}
````
The `SpringBootWebSecurityConfiguration` class provides a default set of **spring security configurations for spring boot applications**.
To create the default `SecurityFilterChainBean` the following configurations are applied:
1. `authorizeRequests()` restricts access based on `RequestMatcher` implementations. Here `authorizeRequests().anyRequest()` will allow all requests.
To have more control over restricting access, we can specify URL patterns via `antMatchers()`.
2. `authenticated()` requires that all endpoints called be authenticated before proceeding in the filter chain.
3. `formLogin()` calls the default `FormLoginConfigurer` class that loads the login page to authenticate via username-password and accordingly redirects to corresponding
failure or success handlers. For a diagrammatic representation of how form login works, refer to the detailed notes in the [Spring documentation](https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/form.html).
4. `httpBasic()` calls the `HttpBasicConfigurer` that sets up defaults to help with basic authentication. To understand in detail, refer to the [Spring documentation](https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/basic.html). 


{{% info title="Spring Security with `SecurityFilterChain`" %}}
- From Spring Security 5.7.0-M2, the `WebSecurityConfigurerAdapter` has been deprecated and replaced with `SecurityFilterChain`, 
thus moving into component based security configuration.
- To understand the differences, refer to this [Spring blog post](https://spring.io/blog/2022/02/21/spring-security-without-the-websecurityconfigureradapter).
- All examples in this article, will make use of the newer configuration that uses `SecurityFilterChain`.
  {{% /info %}}


Now that we understand how the spring security defaults work, lets look at a few commonly encountered usecases and customize the configurations accordingly.

#### Customise default configuration
````java
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    public static final String[] ENDPOINTS_WHITELIST = {
            "/css/**",
            "/",
            "/login",
            "/home"
    };
    public static final String LOGIN_URL = "/login";
    public static final String LOGOUT_URL = "/logout";
    public static final String LOGIN_FAIL_URL = LOGIN_URL + "?error";
    public static final String DEFAULT_SUCCESS_URL = "/home";
    public static final String USERNAME = "username";
    public static final String PASSWORD = "password";

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeRequests(request -> request.antMatchers(ENDPOINTS_WHITELIST).permitAll()
                        .anyRequest().authenticated())
                .csrf().disable()
                //.formLogin(Customizer.withDefaults())
                .formLogin(form -> form
                        .loginPage(LOGIN_URL)
                        .loginProcessingUrl(LOGIN_URL)
                        .failureUrl(LOGIN_FAIL_URL)
                        .usernameParameter(USERNAME)
                        .passwordParameter(PASSWORD)
                        .defaultSuccessUrl(DEFAULT_SUCCESS_URL));
        return http.build();
    }
}
````

Instead of using the spring security login defaults, we can customise every aspect of login:
- `loginPage` - Customize the default login Page. In this case we have created a custom `login.html` and corresponding `LoginController` class.
- `loginProcessingUrl` - The URL that validates username and password.
- `failureUrl` - The URL to direct to in case the login fails.
- `defaultSuccessUrl` - The URL to direct to on successful login. Here, we have created a custom `homePage.html` and corresponding `HomeController` class.
- `antmatchers()` - to filter out the URLs that will be a part of the login process.
Similarly, we can customise the logout process too.
````java
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeRequests(request -> request.antMatchers(ENDPOINTS_WHITELIST).permitAll()
                        .anyRequest().authenticated())
                .csrf().disable()
                //.formLogin(Customizer.withDefaults())
                .formLogin(form -> form
                        .loginPage(LOGIN_URL)
                        .loginProcessingUrl(LOGIN_URL)
                        .failureUrl(LOGIN_FAIL_URL)
                        .usernameParameter(USERNAME)
                        .passwordParameter(PASSWORD)
                        .defaultSuccessUrl(DEFAULT_SUCCESS_URL))
                //.logout(Customizer.withDefaults())
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessUrl(LOGIN_URL + "?logout"));
        return http.build();
    }
````
Here, when the user logs out, the http session gets invalidated, however the session cookie does not get cleared.
Hence, it is a good idea to `deleteCookies("JSESSIONID")` explicitly to avoid session based conflicts.
Further, we can manage and configure sessions via Spring Security. 
````java
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeRequests(request -> request.antMatchers(ENDPOINTS_WHITELIST).permitAll()
                        .anyRequest().authenticated())
                .csrf().disable()
                //.formLogin(Customizer.withDefaults())
                .formLogin(form -> form
                        .loginPage(LOGIN_URL)
                        .loginProcessingUrl(LOGIN_URL)
                        .failureUrl(LOGIN_FAIL_URL)
                        .usernameParameter(USERNAME)
                        .passwordParameter(PASSWORD)
                        .defaultSuccessUrl(DEFAULT_SUCCESS_URL))
                //.logout(Customizer.withDefaults())
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessUrl(LOGIN_URL + "?logout"))
                //.sessionManagement(Customizer.withDefaults())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.ALWAYS)
                        .invalidSessionUrl("/invalidSession.htm")
                        .maximumSessions(1)
                        .maxSessionsPreventsLogin(true));


        return http.build();
    }
````
It provides us various values for session creation policies attribute `sessionCreationPolicy`:
1. SessionCreationPolicy.STATELESS - No session will be created or used.
2. SessionCreationPolicy.ALWAYS - A session will always be created if it does not exist.
3. SessionCreationPolicy.NEVER - A session will never be created. But if a session exists, it will be used.
4. SessionCreationPolicy.IF_REQUIRED - A session will be created if required.(**Default Configuration**)
Other options include:
- `invalidSessionUrl` - the URL to redirect to when an invalid session is detected.
- `maximumSessions` - limits the number of active sessions that a single user can have concurrently.
- `maxSessionsPreventsLogin` - Default value is `false`, which indicates that the authenticated user is allowed access while the existing user's session expires.
`true` indicates that the user will not be authenticated when `SessionManagementConfigurer.maximumSessions(int)` is reached. In this case, it will
redirect to `/invalidSession` when multiple logins are detected.


#### Configure Multiple Filter Chains
Spring Security allows us to have more than one mutually exclusive security configuration which gives us more control over the application.
To demonstrate this, in addition to the login config, lets create REST endpoints for a Library application that uses H2 database to store books based on genre.
Our `BookController` class will have an endpoint defined as below:
````java
@GetMapping("/library/books")
    public ResponseEntity<List<BookDto>> getBooks(@RequestParam String genre) {
        return ResponseEntity.ok().body(bookService.getBook(genre));
    }
````

In order to secure this endpoint, lets use basic auth and configure details in our `SecurityConfiguration` class:
````java
package com.reflectoring.security.config;

import com.reflectoring.security.exception.UserAuthenticationErrorHandler;
import com.reflectoring.security.exception.UserForbiddenErrorHandler;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(BasicAuthProperties.class)
public class SecurityConfiguration {

    private final BasicAuthProperties props;

    public SecurityConfiguration(BasicAuthProperties props) {
        this.props = props;
    }

    @Bean
    @Order(1)
    public SecurityFilterChain bookFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf().disable()
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .antMatcher("/library/**")
                .authorizeRequests()
                .antMatchers(HttpMethod.GET, "/library/**").hasRole("USER").anyRequest().authenticated()
                .and()
                .httpBasic()
                .and()
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(userAuthenticationErrorHandler())
                        .accessDeniedHandler(new UserForbiddenErrorHandler()));

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager(props.getUserDetails());
    }

    @Bean
    public AuthenticationEntryPoint userAuthenticationErrorHandler() {
        UserAuthenticationErrorHandler userAuthenticationErrorHandler =
                new UserAuthenticationErrorHandler();
        userAuthenticationErrorHandler.setRealmName("Basic Authentication");
        return userAuthenticationErrorHandler;
    }

    public static final String[] ENDPOINTS_WHITELIST = {
            "/css/**",
            "/login",
            "/home"
    };
    public static final String LOGIN_URL = "/login";
    public static final String LOGIN_FAIL_URL = LOGIN_URL + "?error";
    public static final String DEFAULT_SUCCESS_URL = "/home";
    public static final String USERNAME = "username";
    public static final String PASSWORD = "password";

    @Bean
    @Order(1)
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // Requests
        http.authorizeRequests(request -> request.antMatchers(ENDPOINTS_WHITELIST).permitAll()
                        .anyRequest().authenticated())
                // CSRF
                .csrf().disable()
                .antMatcher("/login")
                //.formLogin(Customizer.withDefaults())
                .formLogin(form -> form
                        .loginPage(LOGIN_URL)
                        .loginProcessingUrl(LOGIN_URL)
                        .failureUrl(LOGIN_FAIL_URL)
                        .usernameParameter(USERNAME)
                        .passwordParameter(PASSWORD)
                        .defaultSuccessUrl(DEFAULT_SUCCESS_URL))
                //.logout(Customizer.withDefaults())
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessUrl(LOGIN_URL + "?logout"))
                //.sessionManagement(Customizer.withDefaults())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.ALWAYS)
                        .invalidSessionUrl("/invalidSession")
                        .maximumSessions(1)
                        .maxSessionsPreventsLogin(true));

        return http.build();
    }
}
````
Let's take a closer look at the changes made:
1. Two SecurityFilterChain methods `bookFilterChain()` and `filterChain()` methods with `@Order(1)` and `@Order(2)` have been added.
Both these filter chains will be separately executed in the mentioned order.
2. Since both filter chains cater to separate endpoints, different credentials have been created in `application.yml`
````yaml
auth:
  users:
    loginadmin:
      role: admin
      password: loginpass
    bookadmin:
      role: user
      password: bookpass
````
For Spring Security to consider these credentials, we will customize the `UserDetailsService` as :
````java
@Bean
    public UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager(props.getUserDetails());
    }
````
3. To cater to `AuthenticationException` and `AccessDeniedException`, we have customized `exceptionHandling()` and configured custom classes
`UserAuthenticationErrorHandler` and `UserForbiddenErrorHandler`.

With this configuration, the postman response for the REST endpoint looks like this:
**SUCCESS**

{{% image alt="settings" src="images/posts/getting-started-with-spring-security/postman01.JPG" %}}

**UNAUTHORISED**

{{% image alt="settings" src="images/posts/getting-started-with-spring-security/postman-unauth.JPG" %}}

**FORBIDDEN**

{{% image alt="settings" src="images/posts/getting-started-with-spring-security/postman-forbidden.JPG" %}}

#### Additional endpoints secured by default
Once spring security is configured for a request matcher, additional endpoints added get secured by default.
For instance, let's add an endpoint to the `BookController` class
````java
@GetMapping("/library/books/all")
    public ResponseEntity<List<BookDto>> getAllBooks() {
        return ResponseEntity.ok().body(bookService.getAllBooks());
    }
````
For this endpoint to be called successfully, we need to provide basic auth credentials.
**NO CREDENTIALS**

{{% image alt="settings" src="images/posts/getting-started-with-spring-security/postman-nocreds.JPG" %}}

**SUCCESS**

{{% image alt="settings" src="images/posts/getting-started-with-spring-security/postman-creds.JPG" %}}

#### Unsecure Specific Endpoints
Among a list of endpoints that match the request pattern, we can specify a list of endpoints that need to be excluded from the security configuration.
To achieve this, let's first add another endpoint to our `BookController` class and add the configuration:
````java
@GetMapping("/library/info")
    public ResponseEntity<LibraryInfo> getInfo() {
        return ResponseEntity.ok().body(bookService.getLibraryInfo());
    }
````

````java
@Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring().antMatchers("/library/info");
    }
````
Now, we should be able to hit the endpoint from postman without passing credentials:

{{% image alt="settings" src="images/posts/getting-started-with-spring-security/unsecure.JPG" %}}

#### Custom Filters
Spring Security provides all the security by executing a sequence of filters in a chain. There might be cases where we might need to add additional check to the request
before it reaches the controller. In order to facilitate this, Spring provides us with the below methods that help us add a custom filter at the desired position in the chain
- **addFilterBefore(Filter filter, Class<? extends Filter> beforeFilter)** : This method lets us add the custom filter before the specified filter in the chain.
- **addFilterAfter(Filter filter, Class<? extends Filter> afterFilter)** : This method lets us add the custom filter after the specified filter in the chain.
- **addFilterAt(Filter filter, Class<? extends Filter> atFilter)** : This method lets us add the custom filter at the specified filter in the chain.

Let's take a look at its configuration:
````java
@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(BasicAuthProperties.class)
public class SecurityConfiguration {

    private final BasicAuthProperties props;

    public SecurityConfiguration(BasicAuthProperties props) {
        this.props = props;
    }

    @Bean
    @Order(1)
    public SecurityFilterChain bookFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf().disable()
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .antMatcher("/library/**")
                .authorizeRequests()
                .antMatchers(HttpMethod.GET, "/library/**").hasRole("USER").anyRequest().authenticated()
                .and()
                .httpBasic()
                .and()
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(userAuthenticationErrorHandler())
                        .accessDeniedHandler(new UserForbiddenErrorHandler()));

        http.addFilterBefore(customHeaderValidatorFilter(), BasicAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CustomHeaderValidatorFilter customHeaderValidatorFilter() {
        return new CustomHeaderValidatorFilter();
    }
}
````

In order to write a custom filter, we will create a class `CustomHeaderValidatorFilter` that extends a special filter `OncePerRequestFilter` created for this purpose.
This makes sure that our filter gets invoked only once for every request.

````java
public class CustomHeaderValidatorFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(CustomHeaderValidatorFilter.class);
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        log.info("Custom filter called...");
        if (StringUtils.isEmpty(request.getHeader("X-Application-Name"))) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getOutputStream().println(new ObjectMapper().writeValueAsString(CommonException.headerError()));
        } else {
            filterChain.doFilter(request, response);
        }
    }
}

````
Here, we have overridden the `doFilterInternal()` and added our logic. We can verify that this filter gets wired to our `SecurityConfiguration` class from the logs

````text
Will secure Ant [pattern='/library/**'] with [org.springframework.security.web.session.DisableEncodeUrlFilter@669469c9,
 org.springframework.security.web.context.request.async.WebAsyncManagerIntegrationFilter@7f39ad3f,
 org.springframework.security.web.context.SecurityContextPersistenceFilter@1b901f7b,
 org.springframework.security.web.header.HeaderWriterFilter@64f49b3,
 org.springframework.security.web.authentication.logout.LogoutFilter@628aea61,
 com.reflectoring.security.CustomHeaderValidatorFilter@3d40a3b4,
 org.springframework.security.web.authentication.www.BasicAuthenticationFilter@8d23cd8,
 org.springframework.security.web.savedrequest.RequestCacheAwareFilter@1a1e38ab,
 org.springframework.security.web.servletapi.SecurityContextHolderAwareRequestFilter@5bfdabf3,
 org.springframework.security.web.authentication.AnonymousAuthenticationFilter@7524125c,
 org.springframework.security.web.session.SessionManagementFilter@3dc14f80,
 org.springframework.security.web.access.ExceptionTranslationFilter@58c16efd,
 org.springframework.security.web.access.intercept.FilterSecurityInterceptor@5ab06829]
````

Here the filter gets called for all endpoints `/library/**`. To further restrict it to cater to specific endpoints, we can modify the Filter class as :
````java
@Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();// return all string of URL right after the PORT!!=> must be a context path also.
        return path.startsWith("/library/books/all");
    }
````
With this change, for the endpoint `/library/books/all` the `doFilterInternal()` method will not be executed.
The same concept applies to filters added using `addFilterAt()` and `addFilterAfter()` methods.




