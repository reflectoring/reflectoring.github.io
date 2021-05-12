---
title: "Working with AWS RDS and Spring Cloud"
categories: [craft]
date: 2021-04-25 06:00:00 +1000
modified: 2021-04-25 06:00:00 +1000
author: pratikdas
excerpt: "AWS Relational Database Service (RDS) is a managed database service in AWS Cloud. Spring Cloud AWS provides convenient configurable components to integrate applications with the RDS service. In this article, we will look at using Spring Cloud AWS for working with AWS RDS with the help of some code examples"
image:
  auto: 0074-stack
---

Spring always had good support for database access technologies built on top of JDBC. By configuring the datasource through dependency injection and by the use of JdbcTemplates, the application code is decoupled from any database specific constructs. Spring Cloud AWS uses the same principles to provide integration with AWS RDS service through the jdbc module. 

In this post, we will look at using Spring Cloud AWS to integrate with AWS RDS service.

A majority of the applications work with data which is persisted to a database. Databases come in various shapes and types. AWS provides the RDS service for relational databases. [Spring Cloud for Amazon Web Services(AWS)](https://spring.io/projects/spring-cloud-aws) 
Spring Cloud is a suite of projects containing many of the services required to make an application cloud-native by conforming to the [12-Factor](https://12factor.net/) principles. 

[Spring Cloud for Amazon Web Services(AWS)](https://spring.io/projects/spring-cloud-aws) is a sub-project of [Spring Cloud](https://spring.io/projects/spring-cloud) which makes it easy to integrate with AWS services using Spring idioms and APIs familiar to Spring developers.

In this article, we will look at using Spring Cloud AWS for interacting with AWS [Simple Queue Service (SQS)](https://aws.amazon.com/sqs/) with the help of some basic concepts of the queue and messaging along with code examples.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/aws/springcloudrds" %}


## AWS RDS Concepts
Amazon Relational Database Service (Amazon RDS) is a managed service for a set of supported relational databases. As of today the supported datases are:  Amazon Aurora, PostgreSQL, MySQL, MariaDB, Oracle Database, and SQL Server. Apart from providing a reliable infrastructure and scalable capacity, AWS takes care of all the database administration tasks like taking back ups and applying database patches leaving us free to focus on building our applications.

### DB Instance
An RDS DB instance is the basic building block of Amazon RDS. It is an isolated database environment in the cloud and is accessed using the same database specific client tools used to access on-premise databases. Each DB instance has a DB instance identifier used to uniquely identify the DB instance when interacting with the Amazon RDS service using the API or AWS CLI commands.

### DB Instance Class
The DB instance class is used to specify the computate and storage capacity of the RDS DB instance. RDS supports three types of instance classes: 
**Standard**: These are general-purpose instance classes that deliver balanced compute, memory, and networking for a broad range a general purpose workloads.
**Memory Optimized**: These class of instances are optimized for memory-intensive applications offering both high compute capacity and a high memory footprint. 
**Burstable Performance**: These instance classes provide a baseline performance level, with the ability to burst to full CPU usage.

### Storage Types
DB instances for Amazon RDS use Amazon Elastic Block Store (Amazon EBS) volumes for database and log storage. Amazon RDS provides three storage types: 
General Purpose SSD (also known as gp2), 
Provisioned IOPS SSD (also known as io1), and 
magnetic (also known as standard) which differ in performance characteristics and price. General Purpose SSD volumes offer cost-effective storage that is ideal for a broad range of workloads. Provisioned IOPS storage is designed to meet the needs of I/O-intensive workloads, particularly database workloads, that require low I/O latency and consistent I/O throughput.
![RDS DB Storage Classes](/assets/img/posts/aws-rds-spring-cloud/storage-classes.png)

### HA 
Amazon RDS provides high availability and failover support for DB instances using Multi-AZ deployments. In a Multi-AZ deployment, Amazon RDS automatically provisions and maintains a synchronous standby replica in a different Availability Zone. The primary DB instance is synchronously replicated across Availability Zones to a standby replica to provide data redundancy, eliminate I/O freezes, and minimize latency spikes during system backups. Running a DB instance with high availability can enhance availability during planned system maintenance, and help protect your databases against DB instance failure and Availability Zone disruption. 


### Failover Support
In the event of a planned or unplanned outage of your DB instance, Amazon RDS automatically switches to a standby replica in another Availability Zone if you have enabled Multi-AZ. 


## Features of Spring Cloud JDBC
Spring Cloud AWS enables application developers to re-use their JDBC technology of choice and access the Amazon Relational Database Service with a declarative configuration. The main support provided by Spring Cloud AWS for JDBC data access are:

1. Automatic data source configuration and setup based on the Amazon RDS database instance.
2. Automatic read-replica detection and configuration for Amazon RDS database instances.
3. Retry-support to handle exception during Multi-AZ failover inside the data center.

## Setting up the Environment
After a basic understanding of AWS RDS and Spring Cloud AWS JDBC, we will now get down to using these concepts in an example. Let us first create a Spring Boot project with the help of the [Spring boot Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.4.5.RELEASE&packaging=jar&jvmVersion=11&groupId=io.pratik&artifactId=springcloudsqs&name=springcloudrds&description=Demo%20project%20for%20Spring%20cloud%20rds&packageName=io.pratik.springcloudrds&dependencies=web,lombok) with the required dependencies (Spring Web, and Lombok), and then open the project in our favorite IDE.

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

## Creating the RDS Instance in AWS
Let us create a DB instance To launch a DB instance using the AWS Management Console, click "RDS" then the Launch DB Instance button on the Instances tab. From there, you can specify the parameters for your DB instance including DB engine and version, license model, instance type, storage type and amount, and master user credentials.

You also have the ability to change your DB instance’s backup retention policy, preferred backup window, and scheduled maintenance window. 
![RDS DB Instance Creation](/assets/img/posts/aws-rds-spring-cloud/create-db-instance.png)

## Connecting to RDS Instance
After the DB instance is available, we can retrieve its endpoint via the DB instance description in the AWS Management Console, DescribeDBInstances API or describe-db-instances command. Using this endpoint we can construct the connection string required to connect directly with our DB instance using your favorite database tool or programming language. 

```shell
mysqlsh -h testinstance.cfkcguht5mdw.us-east-1.rds.amazonaws.com -P 3306 -u pocadmin
```

```shell
 MySQL  testinstance.cfkcguht5mdw.us-east-1.rds SQL > SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
+--------------------+
3 rows in set (0.1955 sec)
 MySQL  testinstance.cfkcguht5mdw.us-east-1.rds SQL > USE mysql;
Default schema set to `mysql`.
Fetching table and column names from `mysql` for auto-completion... Press ^C to stop.
 MySQL  testinstance.cfkcguht5mdw.us-east-1 mysql  SQL > SELECT CURRENT_DATE FROM DUAL;
+--------------+
| CURRENT_DATE |
+--------------+
| 2021-05-11   |
+--------------+
1 row in set (0.1967 sec)

```

## Configuring the Data Source
A datasource is a factory for obtaining connections to a physical data source. include the module dependency for Spring Cloud AWS JDBC into our Maven configuration.  If we were to use the JDBC module of Spring we would have added a dependency on `spring-boot-starter-jdbc` module:
```xml
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-jdbc</artifactId>
    </dependency>
```
We will not need this now, since we are using AWS RDS with Sping cloud. We will instead add a dependency on `spring-cloud-starter-aws-jdbc` for configuring database source for AWS RDS:

```xml
    <dependency>
      <groupId>io.awspring.cloud</groupId>
      <artifactId>spring-cloud-starter-aws-jdbc</artifactId>
    </dependency>
```
We further configure this datasource by configuring properties in a resource file `Application.properties`:

```.properties
cloud.aws.credentials.profile-name=pratikpoc
cloud.aws.region.auto=false
cloud.aws.region.static=us-east-1

cloud.aws.rds.instances[0].db-instance-identifier=testinstance
cloud.aws.rds.instances[0].username=pocadmin
cloud.aws.rds.instances[0].password=pocadmin
cloud.aws.rds.instances[0].databaseName=mysql
```
The first three properties are used to specify the security credentials for connecting to AWS and the region as `us-east-1`. The next four properties are used to specify the AWS RDS instance name, user name, password and the database name. We had specified the AWS RDS instance name when we created our DB instance in RDS along with user name and password. Database name is the name of the database we create after connecting to the instance.

Our repository class with the JdbcTemplate looks like this: 

```java
@Service
public class SystemRepository {
  
   private final JdbcTemplate jdbcTemplate;

   @Autowired
   public SystemRepository(DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
   }
  
  public String getCurrentDate() {
    String result = jdbcTemplate.queryForObject("SELECT CURRENT_DATE FROM DUAL", new RowMapper<String>(){

      @Override
      public String mapRow(ResultSet rs, int rowNum) throws SQLException {
        return rs.getString(1);
      }     
    });
    return result;
  }

}

```
As we can see here, it is completely decoupled from the database configuration. We can easily change the database configuration or the database itself(mysql ro postgres or Oracle) in RDS without any change to the code.

## Running the Example
We will run this example with jUnit:

```java
@SpringBootTest
class SpringcloudrdsApplicationTests {
  
  @Autowired
  private SystemRepository systemRepository;

  @Test
  void testCurrentDate() {
    String currentDate = systemRepository.getCurrentDate();
    System.out.println("currentDate "+currentDate);
  }
}

```
Once again, nothing specific to Spring Cloud here. We are invoking our repository class method to print the current date. The output log is shown below:
```shell
 :: Spring Boot ::                (v2.4.5)

... : Starting SpringcloudrdsApplicationTests using Java 14.0.1 
...
...
Loading class `com.mysql.jdbc.Driver'. This is deprecated. The new driver class is `com.mysql.cj.jdbc.Driver'...
currentDate 2021-05-12
... : Shutting down ExecutorService 'applicationTaskExecutor'

```
We get a warning thrown for using a deprecated driver class which can be ignored. We have not specified any driver class here. The driver class `com.mysql.jdbc.Driver` is registered based on the metadata read from the database connection to AWS RDS. 

## Read-Replica Configuration
Replication is a process by which we can copy data from one database server (also known as source database) to be copied to one or more database servers (known as replicas). It is a feature of the database engines of MariaDB, Microsoft SQL Server, MySQL, Oracle, and PostgreSQL DB which can be configured with AWS RDS. 

Amazon RDS uses this built-in replication feature of these databases to create a special type of DB instance called a read replica from a source DB instance. The source DB instance plays the role of the primary DB instance and updates made to the primary DB instance are asynchronously copied to the read replica. This way we can increase the overall throughput of the database by reducing the load on our primary DB instance by routing read queries from your applications to the read replica.

Spring Cloud AWS supports the use of read-replicas with the help of Spring Framework's declarative transaction support with the read-only transactions. We do this by enable read-replica support in our datasource configuration. When enabled, any read-only transaction will be routed to a read-replica instance and the primary database will be used only for write operations.

We enable read-replica support by setting a property `readReplicaSupport`:

Our `application.properties` with this property set looks like this:

```properties
cloud.aws.credentials.profile-name=pratikpoc
cloud.aws.region.auto=false
cloud.aws.region.static=us-east-1

cloud.aws.rds.instances[0].db-instance-identifier=testinstance
cloud.aws.rds.instances[0].username=pocadmin
cloud.aws.rds.instances[0].password=pocadmin
cloud.aws.rds.instances[0].databaseName=mysql

cloud.aws.rds.instances[0].readReplicaSupport=true
```
Here we have set the `readReplicaSupport` to true to enable read-replica support.

Our service class with a read only method looks like this:

```java
@Service
public class SystemRepository {
  
   private final JdbcTemplate jdbcTemplate;

   @Autowired
   public SystemRepository(DataSource dataSource) {
    this.jdbcTemplate = new JdbcTemplate(dataSource);
   }
  
  
  @Transactional(readOnly = true)
  public List<String> getUsers(){
    List<String> result = jdbcTemplate.query("SELECT USER() FROM DUAL", new RowMapper<String>(){

      @Override
      public String mapRow(ResultSet rs, int rowNum) throws SQLException {
        return rs.getString(1);
      }
      
    });
    return result;     
  }

}

```
Here we have decorated the method `getUsers` with `Transactional(readOnly = true)`. At runtime, all the invocations of this method will be sent to the read-replica.


## Fail-over Support with the Retry Interceptor
High availability environment in AWS RDS is provided by creating the DB instance in multiple Availability Zones. This type of deployment also called Multi-AZ deployment provides failover support for the DB instances if one availability zone is not available due to an outage of the primary instance. This replication is synchronous as compared to the read-replica described in the previous section.

Spring Cloud AWS JDBC module supports the Multi-AZ failover with a retry interceptor which can be associated with a method  to retry any failed transactions during a Multi-AZ failover. The retry mechanism is supported by the following classes:

SqlRetryPolicy: Checks for retriable database errors and also permanent exceptions related to a database connection. This is useful because Amazon RDS database instances might
be retryable even if there is a permanent error. This is typically the case in a primary a/z failover where the source instance might not be available but a second attempt might succeed because the DNS record has been updated to the failover instance.

RdbmsRetryOperationsInterceptor: checks that there is no transaction available while starting a retryable operation.

However, it is better to provide direct feedback to a user in online transactions instead of trying potentially long and frequent retries. Therefore the fail-over support is mainly useful for batch application where the responsiveness of a service call is not important.


## Conclusion

We saw how to use Spring Cloud AWS JDBC for accessing the database of our applications with the AWS RDS service. A summary of the things we covered:
1. Message, QueueMessageTemplate, QueueMessageChannel, MessageBuilder are some of the important classes used.
2. SQS messages are built using MessageBuilder class where we specify the message payload along with message headers and other message attributes.
3. QueueMessageTemplate and QueueMessageChannel are used to send messages.
4. Applying `SqsListener` annotation to a method enables receiving of SQS messages from a specific SQS queue, sent by other applications.
5. Methods annotated with `SqsListener` can take both `string` and complex objects. For receiving complex objects, we need to configure a custom converter.

I hope this will help you to get started with building applications using Spring Cloud AWS using AWS RDS as the data source.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/springcloudrds).