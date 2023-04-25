---
authors: [pratikdas]
title: "Structured Logging with Amazon CloudWatch"
categories: ["AWS"]
date: 2022-11-07 00:00:00 +1100
excerpt: "Logging is an essential part of any application. The primary purpose of logging in applications is to debug and trace one or more root causes of an unexpected behavior.Approaches to logging takes myriad forms from developers putting ad-hoc print statements in their code to using sophisticated libraries available in different programming languages. Irrespective of which approach is taken a log without any pre-defined structure is rarely useful to find the root cause of problems. This is where we need to use Structured Logging."
image: images/stock/0117-queue-1200x628-branded.jpg
url: struct-log-with-cw
---

The primary purpose of logging in applications is to debug and trace one or more root causes of an unexpected behavior. We take various approaches to logging from putting ad-hoc print statements to embedding sophisticated logging libraries in our code. Irrespective of which approach we take, a log can only be useful if we get context information like which method, who invoked, without any pre-defined structure is often of limited use to find the root cause of problems. 

When we use structured logging we produce logs in a consistent format composed of fields which can give contextual information like how was the function invoked, and by whom along with the request payload. 

Amazon CloudWatch is a managed monitoring and logging service which is used as a centralized log storage. It can also run queries on structured logs to extract valuable information. 

In this article, we will understand:
- how to produce structured logs from applications and supporting infrastructure.
- methods to feed structured logs to the Amazon CloudWatch service
- how to run queries on the captured logs to extract useful insights


## CloudWatch Logging Concepts: Log Streams, Log Groups, Insights
Before going further, let us understand the CloudWatch concepts which we will be using in this article.

Log Streams: a stream of log events that is emitted by a AWS services or any custom application configured as a source of logs events. Each log statement printed is called as log event. Yes, be it in INFO mode, or DEBUG mode, when you use the logger in your Java code to print some log, it is called as a log event.

Log Groups: Log streams are grouped into Log Groups

Insights: provides a UI and a powerful query language to search through one or more log groups. We will use Insights to query the structured logs produced by our Spring Boot Application.

Here we will configure a Spring Boot application to produce structured logs and then send those logs to CloudWatch.


## What is Structured Logging
Before going further, let us understand Structured logging in bit more detail. 

"Structured logging is a methodology to log information in a consistent format that allows logs to be treated as data rather than text. "

While writing logs, instead of just logging a line of text, we log a structured object, most often as JSON. This help us to search the logs using filters on different fields and run analytical functions with log analyzer tools.

Here is an example of a structured log:

```json

```


 
 
## Producing Structured Logs from a Spring Boot Application
We produce structured logs in applications most often by using logging libraries in different programming languages. Some examples of structured logging libraries are:
| Java |Log4j2|
| dotnet c# |serilog|
|python|structlog|

Here we will use a spring boot application for generating structured logs. 
Let us create the initial application set up of our application from the [spring boot starter ](https://start.spring.io/#!type=maven-project&language=java&platformVersion=3.0.5&packaging=jar&jvmVersion=17&groupId=io.pratik&artifactId=accountProcessor&name=accountProcessor&description=Sample%20Spring%20Boot%20project%20to%20produce%20structured%20logs&packageName=io.pratik.accountProcessor&dependencies=lombok,web) and open it in our favourite IDE.

We will use log4j to generate structured logs. The snippet of the `FileAppender` of our Log4j configuration in `log4j2.xml` looks like this:

```xml
<File name="FileAppender" fileName="/home/ec2-user/accountprocessor/logs/accountprocessor-logging-dev.log">
    <JsonLayout complete="false" compact="true" eventEol="true" properties="true"  >
        <KeyValuePair key="appName" value="AccountsProcessor" />
        <KeyValuePair key="version" value="release1.0" />
        <KeyValuePair key="accountNo" value="${ctx:accountNo}"/>
    </JsonLayout>
</File>

```
We have used `JsonLayout` to generate the logs in JSON format. We have added additional fields: `appName`, `version`, and `accountNo` to add useful context around the log events. 

We have also added a sample API to which we will send our requests and our application will use the log4j configuration to produce structured logs.

```java
@RestController
@RequestMapping("/accounts")
public class AccountInquiryController {

    private AccountService accountService;

    private static final Logger LOG = 
        LogManager.getLogger(AccountInquiryController.class);


    public AccountInquiryController(final AccountService accountService){
        this.accountService = accountService;
    }

    @GetMapping("/{accountNo}")
    @ResponseBody
    public AccountDetail getAccountDetails(
        @PathVariable("accountNo") String accountNo) {

        ThreadContext.put("accountNo", accountNo);
        LOG.info("fetching account details for account ");

        Optional<AccountDetail> accountDetail = accountService.getAccount(accountNo);

        LOG.info("Details of account {}", accountDetail);
        ThreadContext.clearAll();
        return accountDetail.orElse(AccountDetail.builder().build());
    }
}
```
Here we have added two logger statements to print the request's path parameter `accountNo` and the response from the service class.


When we run this application and send some requests to the endpoint `http://localhost:8080/accounts/5678888`, we can see the logs in the console as well as in a file. In the next section we will run this application in an EC2 instance and send the structured logs to CloudWatch.


## Sending logs to Amazon CloudWatch 
We will next run the Spring Boot application in an EC2 instance and ship our application logs to CloudWatch. We can either create the EC2 instance from the AWS console or any of the IaC services: Terraform, CloudFormation, CDK. Terraform scripts are included in the source code. We can use the following script to install JDK.  Next we will transfer our spring boot application to EC2 instance using scp and run it the Jar file w=with the well known java -jar <spring boot>.jar.

We can see the application logs in the file configured in the fileappender. Next we will configure cloudwatch agent to ship the logs to cloudwatch.

```shell
sudo yum install amazon-cloudwatch-agent    
```

Next we need to create a configuration for cloudwatch agent to send the log files to cloudwatch. We have used the cloudwatch agent wizard to create the config file and the started the cloudwatch agent.




Let us now create an EC2 instance and install open jdk. We will next configure the cloudwatch agent. 

  see in this method, 
for fetching accoun method in our controller class to 


 
 We can also use AWS client libraries to generate embedded metric format logs.

 

## Schema
In order to treat logs as data we must create a structure that enables us to express logs as data. We can also create a class to encapsulate our data.

user-id
correlation-id
user-agent


## Parsing Unstructured Logs
CloudWatch Insights provides the capability of parsing unstructured logs.
 ## CloudWatch Log Groups and Log Streams

 ## Running Queryies with CloudWatch Insights

 ## Structured logging example

 In order to treat logs as data we must create a structure that enables us to express logs as data. There are packages such as Python JSON Logger that provide a mechanism to transform logs into JSON, but we can also create a class to encapsulate your data.

 ## Conclusion

 Here is a list of the major points for a quick reference: