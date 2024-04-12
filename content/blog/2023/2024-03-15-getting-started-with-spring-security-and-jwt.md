---
title: "Getting started with Spring Security and JWT"
categories: ["Spring"]
date: 2024-02-15 00:00:00 +0000
modified: 2024-02-15 00:00:00 +0000
authors: ["ranjani"]
description: "Getting started with Spring Security and JWT"
image: images/stock/0101-keylock-1200x628-branded.jpg
url: spring-security-jwt
---

**[Spring Security](https://docs.spring.io/spring-security/reference/index.html)** provides a comprehensive set of security features for Java applications, covering authentication, authorization, session management, and protection against common security threats such as [CSRF (Cross-Site Request Forgery)](https://reflectoring.io/spring-csrf/).
The Spring Security framework is highly customizable and allows developers to curate security configurations depending on their application needs.
It provides a flexible architecture that supports various authentication mechanisms. The most widely used ones are **Basic Authentication, JWT and OAuth.** 
Spring Security provides Basic Authentication out of the box. 

To understand in detail about Spring Security basics and how it allows us to customize authentication and authorization, refer to [this article](https://reflectoring.io/spring-security/).
In the current article, we will understand how JWT works and how we can configure it with spring security.

## What is JWT
**JWT (JSON Web Token)** is a secure means of passing a JSON message between two parties. It is a standard defined in [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519).
The information contained in a JWT token can be verified and trusted because it is digitally signed. JWTs can be signed using a secret (with the HMAC algorithm) or a public/private key pair using RSA or ECDSA.

## JWT Structure
In this section, we will take a look at a sample JWT structure.
A JSON Web Token consists of three parts:
- **Header**
- **Payload**
- **Signature**

### JWT Header
The header consists of two parts: the type of the token i.e. JWT and the signing algorithm being used such as HMAC SHA 256 or RSA.
Sample JSON header:
````json
{
  "alg": "HS256",
  "typ": "JWT"
}
````
This JSON is then Base64 encoded thus forming the first part of the JWT token.

### JWT Payload
The payload is the body that contains the actual data. The data could be user data or any information that needs to be transmitted securely.
This data is also referred to as `claims`. There are three types of claims: **registered, public and private claims**.

#### Registered Claims
**They are a set of predefined, three character claims as defined in [RFC7519]**(https://datatracker.ietf.org/doc/html/rfc7519#section-4.1).
Some frequently used ones are **iss (Issuer Claim)**, **sub (Subject Claim)**, **aud (Audience Claim)**, **exp (Expiration Time Claim)**, **iat (Issued At Time)**, **nbf(Not Before)**.
Let's look at each of them in detail:
- **iss**: This claim is used to specify the issuer of the JWT. It is used to identify the entity that issued the token such as the authentication server or identity provider.
- **sub**: This claim is used to identify the subject of the JWT i.e. the user or the entity for which the token was issued.
- **aud**: This claim is used to specify the intended audience of the JWT. This is generally used to restrict the token usage only for certain services or applications.
- **exp**: This claim is used to specify the expiration time of the JWT after which the token is no longer considered valid. Represented in seconds since Unix Epoch.
- **iat**: Time at which the JWT was issued. Can be used to determine age of the JWT. Represented in seconds since Unix Epoch.
- **nbf**: Identifies the time before which JWT can not be accepted for processing.

To view a full list of registered claims [here](https://www.iana.org/assignments/jwt/jwt.xhtml#claims).
In the further sections, we will look at a few examples of how to use them.

#### Public Claims
Unlike registered claims that are reserved and have predefined meanings, these claims can be customized depending on the requirement of the application.
Most of the public claims fall under the below categories:
- **User/Client Data**: Includes username, clientId, email, address, roles, permissions, scopes, privileges and any user/client related information used for authentication or authorization.
- **Application Data**: Includes session details, user preferences(e.g. language preference), application settings or any application specific data.
- **Security Information**: Includes additional security-related information such as keys, certificates, tokens and others.

#### Private Claims
Private claims are custom claims that are specific to a particular organization. They are not standardized by the official JWT specification but are defined by the parties involved in the JWT exchange.

{{% info title="JWT Claims Recommended Best Practices" %}}
- Use standard claims defined in JWT specification whenever possible. They are widely recognized and have well-defined meanings.
- The JWT payload should have only the minimum required claims for better maintainability and limit the token size. 
- Public claims should have clear and descriptive names.
- Follow a consistent naming convention to maintain consistency and readability.
- Avoid including PII information to minimize the risk of data exposure.
- Ensure JWTs are encrypted with the [recommended algorithms](https://www.iana.org/assignments/jose/jose.xhtml#web-signature-encryption-algorithms) specified under the `alg` registered claim. The `none` value in the `alg` claim indicates the JWT is not signed and is not recommended.
{{% /info %}}

### JWT Signature
To create the signature, we encode the header, encode the payload, and use a secret to sign the elements with an algorithm specified in the header.
The resultant token will have three Base64 URL strings separated by dots.
A pictorial representation of a JWT is as shown below:
![JWT]({{ base }}/assets/img/posts/spring-security-and-jwt/jwt.png)

The purpose of the signature is to verify the message wasn't changed along the way.
Since they are also signed with a private key, it can verify that the sender of the JWT is who it claims to be.


## Common Use Cases of JWT
JWTs are versatile and can be used in a variety of scenarios as discussed below:
- **User Authentication and Authorization**: When a user logs into an application, the server issues a JWT token that contains user information such as UserId, role and permissions.
All the subsequent requests made by the client will include this token in the **Authorization** header. This allows the server to authenticate and authorize the user without the need to maintain sessions.
- **Single Sign-On**: JWTs facilitate Single Sign-On (SSO) by allowing authentication across multiple services or applications. 
After a user logs in to one application, he receives a JWT that can be used to access other services without needing to log in again.
- **API Authentication**: JWTs are commonly used to authenticate and authorize access to APIs. Clients include the JWT token in the **Authorization** header of an API request to validate their access to the API.
The APIs will then decode the JWT to grant or deny access.
- **Stateless Sessions**: JWTs help provide stateless session management as the session information is stored in the token itself.
- **Information Exchange**: Since JWTs are secure and reliable, they can be used to exchange not only user information but any information that needs to be transmitted securely between two parties.
- **Microservices**: JWTs are one of the most preferred means of API communication in a microservice ecosystem via User authentication and/or API roles and permissions.

## Caveats of Using JWT

Now that we understand the benefits that JWT provides, let look at the downside of using JWT. The idea here is for the developer to weigh the options in hand and make an informed decision about using a token-based architecture within the application.
- In cases where JWTs replace sessions, if we end up using a big payload, the JWT token can bloat. On top of it, if we add cryptographic signature, it can cause overall performance overhead. This would end up being an overkill for storing a simple user session.
- JWTs expire at certain intervals post which the token needs to be refreshed and a new token will be made available. This is great from a security standpoint, but the expiry time needs to be carefully considered. For instance, an expiry time of 24 hours would be a bad design consideration.

Now, that we've looked at the focus points, we will be able to make an informed decision around how and when to use JWTs.
In the next section, we will try to create a simple JWT token in Java.

## Creating a JWT Token in Java

[JJWT](https://github.com/jwtk/jjwt) is the most commonly used Java library to create JWT tokens in Java and Android.
We will begin by adding its dependencies in our application.

### Configure JWT Dependencies

*Maven dependency:*
````xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.1</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.11.1</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.11.1</version>
    <scope>runtime</scope>
</dependency>
````

*Gradle dependency*:
````groovy
compile 'io.jsonwebtoken:jjwt-api:0.11.1'
runtime 'io.jsonwebtoken:jjwt-impl:0.11.1'
runtime 'io.jsonwebtoken:jjwt-jackson:0.11.1'
````
Our Java application is based on Maven, so we will add the above Maven dependencies to our **pom.xml**

### Creating JWT token
We will use the `Jwts` class from the `io.jsonwebtoken` package. We can specify claims (both registered and public) and other JWT attributes and create a token as below:

````java

public static String createJwt() {
        return Jwts.builder()
                .claim("id", "abc123")
                .claim("role", "admin")
                /*.addClaims(Map.of("id", "abc123",
                        "role", "admin"))*/
                .setIssuer("TestApplication")
                .setIssuedAt(java.util.Date.from(Instant.now()))
                .setExpiration(Date.from(Instant.now().plus(10, ChronoUnit.MINUTES)))
                .compact();
    }
    
````
This method creates a JWT token as below:

````text
eyJhbGciOiJub25lIn0.eyJpZCI6ImFiYzEyMyIsInJvbGUiOiJhZG1pbiIsImlzcyI6IlRlc3RBcHBsaWNhdGlvbiIsImlhdCI6MTcxMTY2MTA1MiwiZXhwIjoxNzExNjYxNjUyfQ.
````
Next, let's take a look at the Builder methods used to generate the token:
- `claim`: Allows us to specify any number of custom name-value pair claims. We can also use `addClims` method to add a Map of claims as an alternative.
- `setIssuer`: This method corresponds to the registered claim `iss`.
- `setIssuedAt`: This method corresponds to the registered claim `iat`. This method takes `java.util.Date` as a parameter. Here we have set this value to the current instant.
- `setExpiration`: This method corresponds to the registered claim `exp`. This method takes `java.util.Date` as a parameter. Here we have set this value to 10 minutes from the current instant.

Let's try to decode this JWT using an online [JWT Decoder](https://jwt.is/)
Its decoded values looks like this:
![JWT Decode]({{ base }}/assets/img/posts/spring-security-and-jwt/JWTDecode.png)

If we closely look at the header, we see `alg:none`. This is because we haven't specified any algorithm to be used.
As we have already seen earlier, it is recommended that we use an algorithm to generate the signature.

So, let's use the **HMAC SHA256 algorithm** in our method:

````java
public static String createJwt() {
        // Recommended to be stored in Secret
        String secret = "5JzoMbk6E5qIqHSuBTgeQCARtUsxAkBiHwdjXOSW8kWdXzYmP3X51C0";
        Key hmacKey = new SecretKeySpec(Base64.getDecoder().decode(secret),
                SignatureAlgorithm.HS256.getJcaName());
        return Jwts.builder()
                .claim("id", "abc123")
                .claim("role", "admin")
                .setIssuer("TestApplication")
                .setIssuedAt(java.util.Date.from(Instant.now()))
                .setExpiration(Date.from(Instant.now().plus(10, ChronoUnit.MINUTES)))
                .signWith(hmacKey)
                .compact();
    }
````

The resultant token created looks like this:
````text
eyJthbGciOiJIUzI1NiJ9.eyJpZCI6ImFiYzEyMyIsInJvbGUiOiJhZG1pbiIsImlzcyI6IlRlc3RBcHBsaWNhdGlvbiIsImlhdCI6MTcxMjMyODQzMSwiZXhwIjoxNzEyMzI5MDMxfQ.pj9AvbLtwITqBYazDnaTibCLecM-cQ5RAYw2YYtkyeA
````
Decoding this JWT gives us:
![JWT Decode]({{ base }}/assets/img/posts/spring-security-and-jwt/JWT2.png)

### Parsing JWT Token
Now that we have created the JWT, let's look at how to parse the token to extract the claims.
We can ony parse the token if we know the secret key that was used to create the JWT in the first place.
The below code can be used to achieve this:
````java
public static Jws<Claims> parseJwt(String jwtString) {
        // Recommended to be stored in Secret
        String secret = "5JzoMbk6E5qIqHSuBTgeQCARtUsxAkBiHwdjXOSW8kWdXzYmP3X51C0";
        Key hmacKey = new SecretKeySpec(Base64.getDecoder().decode(secret),
                SignatureAlgorithm.HS256.getJcaName());

        Jws<Claims> jwt = Jwts.parserBuilder()
                .setSigningKey(hmacKey)
                .build()
                .parseClaimsJws(jwtString);

        return jwt;
    }
````
Here, the method `parseJwt` takes the JWT token as a String argument. Using the same secret key (used for creating the token) this token can be parsed to retrieve the claims.
This can be verified using the below test:

````java
@Test
    public void testParseJwtClaims() {
        String jwtToken = JWTCreator.createJwt();
        assertNotNull(jwtToken);
        Jws<Claims> claims = JWTCreator.parseJwt(jwtToken);
        assertNotNull(claims);
        Assertions.assertAll(
                () -> assertNotNull(claims.getSignature()),
                () -> assertNotNull(claims.getHeader()),
                () -> assertNotNull(claims.getBody()),
                () -> assertEquals(claims.getHeader().getAlgorithm(), "HS256"),
                () -> assertEquals(claims.getBody().get("id"), "abc123"),
                () -> assertEquals(claims.getBody().get("role"), "admin"),
                () -> assertEquals(claims.getBody().getIssuer(), "TestApplication")
        );
    }
````
For a full list of the available parsing methods, refer [the documentation](https://javadoc.io/doc/io.jsonwebtoken/jjwt-api/0.11.2/io/jsonwebtoken/JwtParser.html)

### Comparing Basic Authentication and JWT in Spring Security
Before we dive into the implementation of JWT in a sample Spring Boot application, let's look at a few points of comparison between BasicAuth and JWT.

1. Authorization Headers
- Both Basic Auth and JWT send data in the **Authorization** headers with each request. 
- Sample Basic Auth Header: **Authorization: Basic xxx**. Sample JWT Header: **Authorization: Bearer xxx**.

2. Validity and expiration
- Basic Authentication credentials are configured once and the same credentials need to be passed with every request. It never expires.
- With JWT token, we can set validity/expiry using the `exp` registered claim after which the token throws a `io.jsonwebtoken.ExpiredJwtException`.
- This makes JWT more secure as the token validity is short. The user would have to resend the request to generate a new token.

3. Data
- Basic Authentication is meant to handle only credentials (typically username-password).
- JWT can include additional information such as id, roles, etc. Once the signature is validated, the server can trust the data sent by the client thus avoiding any additional lookups that maybe needed otherwise.

## Implementing JWT in a Spring Boot Application
Now that we understand JWT better, let's try to implement it in a simple Spring Boot application.
In our pom.xml, let's add the below dependencies:

````xml
<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-security</artifactId>
		</dependency>
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-api</artifactId>
			<version>0.11.1</version>
		</dependency>
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-impl</artifactId>
			<version>0.11.1</version>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-jackson</artifactId>
			<version>0.11.1</version>
			<scope>runtime</scope>
		</dependency>
````
We have created a simple spring boot Library application that uses in-memory H2 database to store data.
The application is configured to run on port 8083. To run the application:

````text
mvnw clean verify spring-boot:run (for Windows)
./mvnw clean verify spring-boot:run (for Linux)
````
### Intercepting the Spring Security Filter Chain for JWT

The application has a REST endpoint `/library/books/all` to get all the books stored in the DB. Let's try making this GET call via Postman.
We see `401 UnAuthorized error`
![Error]({{ base }}/assets/img/posts/spring-security-and-jwt/Postman401.png)
This is because, the `spring-boot-starter-security` dependency added in our `pom.xml`, automatically brings in Basic authentication to all the endpoints created.
Since we haven't specified any credentials in Postman we get the `UnAuthorized` error.
For the purpose of this article, we need to replace Basic Authentication with JWT-based authentication.
We know that Spring provides security to our endpoints, by triggering a chain of filters that handle authentication and authorization for every request.
The [`org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter`](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/web/authentication/UsernamePasswordAuthenticationFilter.html).
is responsible for validating the credentials for every request. Let's create a new `Filter` called `JwtFilter` and add it before `UsernamePasswordAuthenticationFilter` in the filter chain. This will make sure that `JwtFilter` will be used to validate if the token sent with the request is valid.

A basic `JwtFilter` class looks like below:
````java
````


