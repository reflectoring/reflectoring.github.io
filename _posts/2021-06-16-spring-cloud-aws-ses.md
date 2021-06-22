---
title: "Sending E-Mails with AWS SES and Spring Cloud AWS"
categories: [craft]
date: 2021-06-14 06:00:00 +1000
modified: 2021-06-13 06:00:00 +1000
author: pratikdas
excerpt: "Apache Camel is an integration framework with a programming model for integrating a wide variety of applications. In this article, we will look at using Apache Camel for building integration logic in microservice applications built with Spring Boot with the help of code examples."
image:
  auto: 0074-stack
---

Notification by email is a common way to implement notification use cases like sending OTP, transaction or low balance alerts. 

Amazon Simple Email Service (SES) is an email platform that provides an easy and cost-effective way to send and receive emails.

[Spring Cloud for Amazon Web Services(AWS)](https://spring.io/projects/spring-cloud-aws) is a sub-project of [Spring Cloud](https://spring.io/projects/spring-cloud) which makes it easy to integrate with AWS services using Spring idioms and APIs familiar to Spring developers.

In this article, we will look at using Spring Cloud AWS for interacting with AWS [Simple Email Service (SES)](https://aws.amazon.com/ses/) to send emails with the help of some code examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/spring-cloud-ses" %}


## What is SMTP and Email
Simple mail transfer protocol (SMTP) is the communication protocol for sending emails, receiving emails, and relaying outgoing mail between email senders and receivers. When we send an email, the SMTP server processes our email, decides which server to send the message to, and relays the message to that server.

## How does SES Send Email
An email sent using SES goes through the following steps:

The email sender makes a request to Amazon SES to send email to one or more recipients.
SES first validates the request and if successful, creates an email message with the request parameters. The email message is compliant with the Internet Message Format specification ([RFC 5322](https://www.ietf.org/rfc/rfc5322.txt)) and consists of header, body and envelope. SES also scans the message for malicious content and then sends it over the internet using Simple Mail Transfer Protocol (SMTP) to the recipient's receiver ISP. After this the following outcomes are possible:

1. Successful delivery : The email is accepted by the ISP, and the ISP delivers the email to the recipient.
2. Hard Bounce: The email is rejected by the ISP because of a persistent condition or rejected by Amazon SES because the email address is on the Amazon SES suppression list. An email address is on the Amazon SES suppression list if it has recently caused a hard bounce for any Amazon SES customer. A hard bounce with an ISP can occur because the recipient's address is invalid. A hard bounce notification is sent from the ISP back to Amazon SES, which notifies the sender through email or through Amazon Simple Notification Service (Amazon SNS), depending on the sender's setup
3. Soft Bounce : The ISP cannot deliver the email to the recipient because of a temporary condition, such as the ISP is too busy to handle the request or the recipient's mailbox is full. A soft bounce can also occur if the domain does not exist. The ISP sends a soft bounce notification back to Amazon SES, or, in the case of a nonexistent domain, Amazon SES cannot find an email server for the domain. In either case, Amazon SES retries the email for an extended period of time. If Amazon SES cannot deliver the email in that time period, it sends you a bounce notification through email or through Amazon SNS.
4. Complaint : The recipient marks the email as spam in his or her email client. If Amazon SES has a feedback loop set up with the ISP, then a complaint notification is sent to Amazon SES, which forwards the complaint notification to the sender.
5. Auto response: The receiver ISP sends an automatic response such as an out of office message to Amazon SES, which forwards the auto response notification to the sender. 

When a delivery fails, Amazon SES will respond to the sender with an error and will drop the email.

## Sending Methods
We use Amazon SES for sending emails by specifying the email contents and source and recipient emails. The exact information we need to provide depends on how we call Amazon SES:
- SES does the formatting: We can provide a minimal amount of information and have Amazon SES take care of all of the formatting . 
- if we want to do something more advanced like sending an attachment, we can provide the raw message. 

### SMTP Interface
When we access Amazon SES through the SMTP interface, our SMTP client application assembles the message. At a minimum, the SMTP exchange between a client and a server requires a source address, a destination address, and message data. If you are using the SMTP interface and have feedback forwarding enabled, then your bounces, complaints, and delivery notifications are sent to the "MAIL FROM" address. Any "Reply-To" address that we specify is not used.

## SES Sandbox
The Amazon SES sandbox is an area where new users can test the capabilities of Amazon SES. When our account is in the sandbox, we can only send email to verified identities. A verified identity is an email addresses or domain that we have proven that we own. Before you can send email from your email address through Amazon SES, you must show Amazon SES that you own the email address by verifying it.

Additionally, when our account is in the sandbox, there are limits to the volume of email you can send each day, and to the number of messages you can send each second.


## SES as Mail Server
Amazon SES provides an SMTP interface for seamless integration with applications that can send email via SMTP. You can connect directly to this SMTP interface from your applications, or configure your existing email server to use this interface as an SMTP relay.

In order to connect to the Amazon SES SMTP interface, you have to create SMTP credentials. 

## Spring and SMTP
The Spring Framework provides a helpful utility library for sending email that shields the user from the specifics of the underlying mailing system and is responsible for low level resource handling on behalf of the client.

The org.springframework.mail package is the root level package for the Spring Framework's email support. The central interface for sending emails is the MailSender interface; a simple value object encapsulating the properties of a simple mail such as from and to (plus many others) is the SimpleMailMessage class. This package also contains a hierarchy of checked exceptions which provide a higher level of abstraction over the lower level mail system exceptions with the root exception being MailException. Please refer to the JavaDocs for more information on the rich mail exception hierarchy.

The org.springframework.mail.javamail.JavaMailSender interface adds specialized JavaMail features such as MIME message support to the MailSender interface (from which it inherits). JavaMailSender also provides a callback interface for preparation of JavaMail MIME messages, called org.springframework.mail.javamail.MimeMessagePreparator

## Spring Cloud AWS

Spring Cloud AWS supports the Amazon SES as an implementation of the Spring Mail abstraction.

As a result Spring Cloud AWS we can decide to use the Spring Cloud AWS implementation of the Amazon SES service or use the standard Java Mail API based implementation that sends e-mails via SMTP to Amazon SES.

## Introducing the Classes of Interest
The SES module of Spring Cloud AWS provides two classes: `SimpleEmailServiceMailSender` and `SimpleEmailServiceJavaMailSender` for sending emails. Both of these implement the `MailSender` interface from Spring Mail abstraction :

![SES classes](/assets/img/posts/aws-ses-spring-cloud/ses-classes.png)

As we can see from this diagram `SimpleEmailServiceJavaMailSender` extends from the `SimpleEmailServiceMailSender` which implements the `MailSender` interface. The
`SimpleEmailServiceMailSender`  sends E-Mails with the Amazon Simple Email Service. This implementation has no dependencies to the Java Mail API. It can be used to send a simple mail messages that does not have any attachment and therefore only consist of atext body.
An SES message is represented by the `Message` interface. 

SimpleEmailServiceJavaMailSender that allows to send {@link MimeMessage} using the Simple E-Mail Service. In contrast to `SimpleEmailServiceMailSender` this class also allows the use of attachment and other mime parts inside mail messages.

## Setting up the Environment

With this basic understanding of SES and the involved classes, let us work with a few examples by first setting up our environment.

Let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.4.5.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=springcloudsqs&name=springcloudsqs&description=Demo%20project%20for%20Spring%20cloud%20sqs&packageName=io.pratik.springcloudsqs&dependencies=web,lombok), and then open the project in our favorite IDE.


For configuring Spring Cloud AWS, let us add a separate Spring Cloud AWS BOM in our `pom.xml` file using this `dependencyManagement` block :

```xml
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>io.awspring.cloud</groupId>
        <artifactId>spring-cloud-aws-dependencies</artifactId>
        <version>2.3.0</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
```
For adding the support for email, we need to include the module dependency for Spring Cloud AWS SES into our Maven configuration.  We do this by adding the starter module`spring-cloud-starter-aws-ses`:

```xml
    <dependency>
      <groupId>io.awspring.cloud</groupId>
      <artifactId>spring-cloud-starter-aws-ses</artifactId>
    </dependency>
```
`spring-cloud-starter-aws-ses` includes the transitive dependencies for `spring-cloud-starter-aws`, and `spring-cloud-aws-ses`.



## Sending Emails in Spring Boot
Let us understand this with the help of an example. We will set up a simple REST API for sending email.

Let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.5.1.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=springses&name=springses&description=Demo%20project%20for%20Sending%20email%20with%20SES&packageName=io.pratik.springses&dependencies=web), and then open the project in our favorite IDE.

Spring Cloud AWS provides `SimpleEmailServiceMailSender` and  to configure a Spring org.springframework.mail.MailSender implementation for the client to be used. 
`SimpleEmailServiceMailSender` sends emails with the Amazon Simple Email Service in AWS Java SDK.
 So it does not have dependencies on the Java Mail API. It can be used to send simple mail messages in plain text without any attachment. A configuration with the necessary elements will look like this:

### Configuring the MailSender
Let us first set up the `MailSender` in a Spring `configuration` class:
```java
@Configuration
public class MailConfig {
    @Bean
    public AmazonSimpleEmailService amazonSimpleEmailService() {

      return AmazonSimpleEmailServiceClientBuilder.standard()
          .withCredentials(new ProfileCredentialsProvider("pratikpoc"))
          .withRegion(Regions.US_EAST_1)
          .build();
    }
    
    @Bean
    public MailSender mailSender(AmazonSimpleEmailService amazonSimpleEmailService) {
      return new SimpleEmailServiceMailSender(amazonSimpleEmailService);
    }
}

```
Here we are setting up the `AmazonSimpleEmailService` bean with credentials for our AWS account using the `ProfileCredentialsProvider`. After that we are uing this `AmazonSimpleEmailService` bean for creating the `SimpleEmailServiceMailSender` bean.

### Sending Simple Email 
We will now inject the `SimpleEmailServiceMailSender` bean in our service class from where we will send the email:

```java
@Service
public class NotificationService {
  
    @Autowired
    private MailSender mailSender;
    
    @Autowired
    private JavaMailSender javaMailSender;

    public void sendMailMessage(final SimpleMailMessage simpleMailMessage) {
        System.out.println("mailSender "+mailSender.getClass().getName());
        this.mailSender.send(simpleMailMessage);
    }
}

```
Here we are calling the `send` method on the `mailSender` reference to send our email.

We test this by setting up a test class :

```java
@SpringBootTest
class NotificationServiceTest {
  
  @Autowired
  private NotificationService notificationService;

  @Test
  void testSendMail() {
      SimpleMailMessage simpleMailMessage = new SimpleMailMessage();
      simpleMailMessage.setFrom("pratikd2000@gmail.com");
      simpleMailMessage.setTo("pratikd2027@gmail.com");
      simpleMailMessage.setSubject("test subject");
      simpleMailMessage.setText("test text");
        
      notificationService.sendMailMessage(simpleMailMessage);
  }
  
 
}

```

Here we are using two test mails as our `from` and `to` email address. As explained before, we are using a sandbox environment which will only work with verified email addresses. 

### Verify Emails
Let us verify the emails by follwing the below steps from the AWS console.

![SES classes](/assets/img/posts/aws-ses-spring-cloud/email-verify.png)

### Send Email with Attachments

Let us update our configuration by setting up `JavaMailSender`

```java
@Configuration
public class MailConfig {
    @Bean
    public AmazonSimpleEmailService amazonSimpleEmailService() {

      return AmazonSimpleEmailServiceClientBuilder.standard()
          .withCredentials(new ProfileCredentialsProvider("pratikpoc"))
          .withRegion(Regions.US_EAST_1)
          .build();
    }

    @Bean
    public JavaMailSender javaMailSender(AmazonSimpleEmailService amazonSimpleEmailService) {
      return new SimpleEmailServiceJavaMailSender(amazonSimpleEmailService);
    }
    
    @Bean
    public MailSender mailSender(AmazonSimpleEmailService amazonSimpleEmailService) {
      return new SimpleEmailServiceMailSender(amazonSimpleEmailService);
    }
}

```
We will now inject the `JavaMailSender` in our service class:

```java
@Service
public class NotificationService {
  
     @Autowired
     private MailSender mailSender;
    
     @Autowired
     private JavaMailSender javaMailSender;

     public void sendMailMessageWithAttachments() {
        this.javaMailSender.send(new MimeMessagePreparator() {

            @Override
            public void prepare(MimeMessage mimeMessage) throws Exception {
                  MimeMessageHelper helper =
                    new MimeMessageHelper(mimeMessage, true, "UTF-8");
                  helper.addTo("foo@bar.com");
                  helper.setFrom("bar@baz.com");
                  
                  InputStreamSource data = new ByteArrayResource("".getBytes());

                  helper.addAttachment("test.txt", data );
                  helper.setSubject("test subject with attachment");
                  helper.setText("mime body", false);
                }
            });
     }
}

```



## Conclusion

In this article, we looked at the important concepts of Apache Camel and used it to build integration logic in a Spring Boot application. Here is a summary of the things we covered:
1. Apache Camel is an integration framework providing a programming model along with implementations of many Enterprise Integration Patterns.
2. We use different types of Domain Specific Languages (DSL) to define the routing rules of the message. 
3. A Route is the most basic construct which we specify with a DSL to define the path a message should take while moving from source to destination.
4. CamelContext is the runtime container for executing Camel routes.
5. We built a route with the Splitter and Aggregator Enterprise Integration Patterns and invoked it from a REST DSL.
6. Finally we looked at some scenarios where using Apache Camel will benefit us.


I hope this post has given you a good introduction of Apache Camel and we can use Camel with Spring Boot applications. This should help you to get started with building applications using Spring with Apache Camel. 

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/spring-boot-camel).