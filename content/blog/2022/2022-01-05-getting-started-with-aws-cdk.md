---
authors: [pratikdas]
title: "Getting Started with AWS CDK"
categories: ["AWS"]
date: 2022-01-20 06:00:00 +1000
modified: 2022-01-20 06:00:00 +1000
description: "AWS Cloud Development Kit (CDK) is a framework for defining cloud infrastructure in code and provisioning it through AWS CloudFormation. It helps us to build applications in the cloud with the expressive power of a programming language. In this article, we will introduce AWS CDK, understand its core concepts and work through some examples."
image: images/stock/0061-cloud-1200x628-branded.jpg
url: getting-started-with-aws-cdk
---

Infrastructure as Code (IaC) is the managing and provisioning of infrastructure through code instead of through a manual process.

AWS provides native support for IaC through the [CloudFormation service](/getting-started-with-aws-cloudformation). With CloudFormation, teams can define declarative templates that specify the infrastructure required to deploy their solutions.

AWS Cloud Development Kit (CDK) is a framework for defining cloud infrastructure with the expressive power of a programming language and provisioning it through AWS CloudFormation. 

In this article, we will introduce AWS CDK, understand its core concepts and work through some examples.

{{% stratospheric %}}
This article gives only a first impression of what you can do with AWS CDK.

If you want to go deeper and learn how to deploy a Spring Boot application to the AWS cloud and how to connect it to cloud services like RDS, Cognito, and SQS, make sure to check out the book [Stratospheric - From Zero to Production with Spring Boot and AWS](https://stratospheric.dev?utm_source=reflectoring&utm_content=in_content)!

Also check out the sample chapters from the book about [deploying a Spring Boot application with CDK](/deploy-spring-boot-app-with-aws-cdk) and [how to design a CDK project](/designing-a-aws-cdk-project).
{{% /stratospheric %}}

{{% github "https://github.com/thombergs/code-examples/tree/master/aws/cdkv2" %}}

## What is AWS CDK
The AWS Cloud Development Kit (AWS CDK) is an open-source framework for defining cloud infrastructure as code with a set of supported programming languages. It is designed to support multiple programming languages. The core of the system is written in [TypeScript](https://www.typescriptlang.org), and bindings for other languages can be added.

AWS CDK comes with a Command Line Interface (CLI) to interact with CDK applications for performing different tasks like:

 - listing the infrastructure stacks defined in the CDK app
 - synthesizing the stacks into CloudFormation templates
 - determining the differences between running stack instances and the stacks defined in our CDK code, and 
 - deploying changes in stacks to any AWS Region.

## Primer on CloudFormation - the Engine underneath CDK
The CDK is built on top of the AWS CloudFormation service and uses it as the engine for provisioning AWS resources. So it is very important to have a good understanding of CloudFormation when working with CDK.

**AWS CloudFormation is an infrastructure as code (IaC) service for modeling, provisioning, and managing AWS and third-party resources.**

We work with templates and stacks when using AWS CloudFormation. **We create templates in YAML or JSON format to describe our AWS resources with their properties.** A sample template for hosting a web application might look like this:

```yaml
Resources:
  WebServer:
    Type: 'AWS::EC2::Instance'
    Properties:
      SecurityGroups:
        - !Ref WebServerSecurityGroup
      KeyName: mykey
      ImageId: 'ami-08e4e35cccc6189f4'

  Database:
    Type: AWS::RDS::DBInstance
    Properties:
          AllocatedStorage: 20
          ...
          Engine: 'mysql'
          
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      SecurityGroupIngress:
      - CidrIp: 0.0.0.0/0
        FromPort: 80
        IpProtocol: tcp

```

This template specifies the resources that we want for hosting a website:
1. an Amazon EC2 instance 
2. an RDS MySQL database for storage
3. An Amazon EC2 security group to control firewall settings for the Amazon EC2 instance.

You can browse the [CloudFormation reference documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) for a list of all the resources that are available for use in CloudFormation templates.

**A CloudFormation stack is a collection of AWS resources that we can create, update, or delete as a single unit.** The stack in our example includes all the resources required to run the web application: such as a web server, a database, and firewall rules.

When creating a stack, CloudFormation provisions the resources that are described in our template by making underlying service calls to AWS.

**AWS CDK allows us to define our infrastructure in our favorite programming language instead of using a declarative language like JSON or YAML as in CloudFormation.**

## Setting up the Prerequisites for CDK

To work through some examples, let us first set up our development environment for writing AWS CDK apps.
We need to complete the following activities for working with CDK:

1. **Configure programmatic access to an AWS account**:  We will need access to an AWS account where our infrastructure will be created. We need access keys to make [programmatic calls to AWS](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html). We can create access keys from the [AWS IAM console](https://console.aws.amazon.com/iam/) and set that up in our credentials file.

2. **Install the CDK Toolkit**: The AWS CDK Toolkit is the primary tool for interacting with the AWS CDK app through the CLI command `cdk`. It is an open-source project in [GitHub](https://github.com/aws/aws-cdk). Among its capabilities are producing and deploying the AWS CloudFormation templates generated by the AWS CDK. 

    We can install the AWS CDK globally with [npm](https://www.npmjs.com):
    ```shell
    npm install -g aws-cdk
     ```
    This will install the latest version of the CDK toolkit in our environment which we can verify with:

    ```shell
    cdk --version
    ```

3. **Set up language-specific prerequisites**: CDK supports multiple languages. We will be using Java in our examples here. We can create AWS CDK applications in Java using the language's familiar tools like the JDK (Oracle's, or an OpenJDK distribution such as Amazon Corretto) and Apache Maven. Prerequisites for other languages can be found in the official documentation.


## Creating a New CDK Project
Let's create a new CDK project using the CDK CLI using the `cdk init` command:
```shell
 mkdir cdk-app 
 cd cdk-app
 cdk init --language java
```
Here we have created an empty directory `cdk-app` and used the `cdk init` command to create a [Maven](https://maven.apache.org/)-based CDK project in Java language.

Running the `cdk init` command also displays the important CDK commands as shown here:
```shell 
Applying project template app for java
# Welcome to your CDK Java project!
...
...

## Useful commands

 * `mvn package`     compile and run tests
 * `cdk ls`          list all stacks in the app
 * `cdk synth`       emits the synthesized CloudFormation template
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk docs`        open CDK documentation

```

The following files are generated by the CDK toolkit arranged in this folder structure: 
```shell
├── README.md
├── cdk.json
├── pom.xml
└── src
    ├── main
    │   └── java
    │       └── com
    │           └── myorg
    │               ├── CdkAppApp.java
    │               └── CdkAppStack.java
    └── test
        └── java
            └── com
                └── myorg
                    └── CdkAppTest.java

```
We can see two Java classes `CdkAppApp` and `CdkAppStack` have been generated along with a test class in a Maven project. The `CdkAppApp` class  contains the `main()` method and is the entry point of the application. Its name is a bit funny because it's generated from the fol;der name `cdk-app` and CDK automatically adds the `App` suffix again. 

We will understand more about the function of the `App` and the `Stack` classes and build on this further to define our infrastructure resources in the following sections.


## Introducing Constructs - the Basic Building Blocks
Before working any further with the files generated in our project, we need to understand the concept of constructs which are the basic building blocks of an AWS CDK application. 

Constructs are reusable components in which we bundle a bunch of infrastructure resources that can be further composed together for building more complex pieces of infrastructure. 

A construct can represent a single AWS resource, such as an Amazon S3 bucket, or it can be a higher-level abstraction consisting of multiple AWS-related resources. Constructs are represented as a tree starting with a root construct and multiple child constructs arranged in a hierarchy.

In all CDK-supported languages, a construct is represented as a base class from which all other types of constructs inherit.


## Structure of a CDK Application
A CDK project is composed of an `App` construct and one or more constructs of type `Stack`. When we generated the project by running `cdk init`, one `App` and one `Stack` construct were generated. 

### The App Construct - the CDK Application
The `App` is a construct that represents an entire CDK app. This construct is normally the root of the construct tree. We define an `App` instance as the entry point of our CDK application and then define the constructs where the `App` is used as the parent scope.

We use the `App` construct to define one or more stacks within the scope of an application as shown in this code snippet: 
```java
public class MyCdkApp {
   public static void main(final String[] args) {
      App app = new App();

      new MyFirstStack(app, "myStack", StackProps.builder()
         .env(Environment.builder()
            .account("********")
            .region("us-east-1")
            .build())
         .build());
 
      app.synth();
   }
}
```

In this example, the `App` instantiates a stack named `myStack` and sets the AWS account and region where the resources will be provisioned.

### The Stack Construct - Unit of Deployment
A stack is the unit of deployment in the AWS CDK. All AWS resources defined within the scope of a stack are provisioned as a single unit.
We can define any number of stacks within a CDK app.

For example, the following code defines an AWS CDK app with two stacks:

```java
public class MyCdkApp {
   public static void main(final String[] args) {
      App app = new App();

      new MyFirstStack(app, "stack1");
      new MySecondStack(app, "stack2");

      app.synth();
   }
}
```

Here we are defining two stacks named `stack1` and `stack2` and calling the `synth()` method on the `app` instance to generate the CloudFormation template. The call to `app.synth()` always has to be the last step in a CDK app. In this step, CDK "synthesizes" CloudFormation templates (i.e. JSON files) from the CDK code.

## Defining the Infrastructure with CDK
After understanding the `App` and the `Stack` constructs, let us return to the project we generated earlier for creating our infrastructure resources. 

We will first change the `App` class in our project to specify the stack properties: the AWS account and the region where we want to create our infrastructure. We do this by specifying these values in an environment object as shown here:

```java
public class CdkAppApp {
   public static void main(final String[] args) {
      App app = new App();

      new CdkAppStack(app, "CdkAppStack", StackProps.builder()
        .env(Environment.builder()
          .account("**********")
          .region("us-east-1")
          .build())
        .build());

      app.synth();
   }
}
```

We have defined the region as `us-east-1` along with our AWS account in the `env()` method.

Next, we will modify our stack class to define some infrastructure resources: an [AWS EC2](https://aws.amazon.com/ec2/) instance with a [security group](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html) in the default [VPC](https://aws.amazon.com/vpc/) of the AWS account:

```java
public class CdkAppStack extends Stack {
   public CdkAppStack(final Construct scope, final String id) {
      this(scope, id, null);
   }

   public CdkAppStack(
           final Construct scope,
           final String id,
           final StackProps props) {
      super(scope, id, props);

      // Look up the default VPC
      IVpc vpc = Vpc.fromLookup(
              this,
              "vpc",
              VpcLookupOptions
                      .builder()
                      .isDefault(true)
                      .build());

      // Create a SecurityGroup which will allow all outbound traffic      
      SecurityGroup securityGroup = SecurityGroup
              .Builder
              .create(this, "sg")
              .vpc(vpc)
              .allowAllOutbound(true)
              .build();

      // Create EC2 instance of type T2.micro
      Instance.Builder.create(this, "Instance")
              .vpc(vpc)
              .instanceType(InstanceType.of(
                      InstanceClass.BURSTABLE2,
                      InstanceSize.MICRO))
              .machineImage(MachineImage.latestAmazonLinux())
              .blockDevices(List.of(
                      BlockDevice.builder()
                              .deviceName("/dev/sda1")
                              .volume(BlockDeviceVolume.ebs(50))
                              .build(),
                      BlockDevice.builder()
                              .deviceName("/dev/sdm")
                              .volume(BlockDeviceVolume.ebs(100))
                              .build()))
              .securityGroup(securityGroup)
              .build();

   }
}
```

In this code snippet, we are first looking up the default VPC in our AWS account. After that, we are creating a security group in this VPC that will allow all outbound traffic. Finally, we are creating the EC2 instance with properties: `instanceType`, `machineImage`, `blockDevices`, and `securityGroup` and put it into the security group defined earlier.

## Synthesizing a Cloudformation Template
Synthesizing is the process of executing our CDK app to generate the equivalent of our CDK code as a CloudFormation template. We do this by running the `synth` command as follows:
```shell
cdk synth
```

If our app contained more than one `Stack`, we need to specify which Stack(s) to synthesize. We don't have to specify the `Stack` if it contains only one Stack.


The `cdk synth` command executes our app, which causes the resources defined in it to be translated into an AWS CloudFormation template. The output of `cdk synth` is a YAML-format template. The beginning of our app's output is shown below:

```shell
> cdk synth
Resources:
  sg29196201:
    Type: AWS::EC2::SecurityGroup
    Properties:
  ...
  ...
  InstanceC1063A87:
    Type: AWS::EC2::Instance
    Properties:
      AvailabilityZone: us-east-1a
      BlockDeviceMappings:
        - DeviceName: /dev/sda1
      ...
      ...
      InstanceType: t2.micro
      SecurityGroupIds:
      ...
      ...
```
The output is the CloudFormation template containing the resources defined in the stack under our CDK app.
## Deploying the Cloudformation Template
At last, we proceed to deploy the CDK app with the `deploy` command when the actual resources are provisioned in AWS. Let us run the `deploy` command by specifying our AWS credentials stored under a profile created in our environment:

```shell
cdk deploy --profile pratikpoc
```

The output of the deploy command looks like this:
```shell
✨  Synthesis time: 8.18s

This deployment will make potentially sensitive changes according to your current security approval level (--require-approval broadening).
Please confirm you intend to make the following modifications:

IAM Statement Changes
┌───┬──────────────────────────────┬────────┬────────────────┬───────────────────────────┬───────────┐
│   │ Resource                     │ Effect │ Action         │ Principal                 │ Condition │
├───┼──────────────────────────────┼────────┼────────────────┼───────────────────────────┼───────────┤
│ + │ ${Instance/InstanceRole.Arn} │ Allow  │ sts:AssumeRole │ Service:ec2.amazonaws.com │           │
└───┴──────────────────────────────┴────────┴────────────────┴───────────────────────────┴───────────┘
Security Group Changes
┌───┬───────────────┬─────┬────────────┬─────────────────┐
│   │ Group         │ Dir │ Protocol   │ Peer            │
├───┼───────────────┼─────┼────────────┼─────────────────┤
│ + │ ${sg.GroupId} │ Out │ Everything │ Everyone (IPv4) │
└───┴───────────────┴─────┴────────────┴─────────────────┘
(NOTE: There may be security-related changes not in this list. See https://github.com/aws/aws-cdk/issues/1299)

Do you wish to deploy these changes (y/n)? y
CdkAppStack: deploying...
[0%] start: Publishing 7815fc615f7d50b22e75cf1d134480a5d44b5b8b995b780207e963a44f27e61b:675153449441-us-east-1
[100%] success: Published 7815fc615f7d50b22e75cf1d134480a5d44b5b8b995b780207e963a44f27e61b:675153449441-us-east-1
CdkAppStack: creating CloudFormation changeset...






 ✅  CdkAppStack

✨  Deployment time: 253.98s

Stack ARN:
arn:aws:cloudformation:us-east-1:675153449441:stack/CdkAppStack/b9ab5740-7919-11ec-9cad-0a05d9e5c641

✨  Total time: 262.16s


```
CDK first creates a changeset of the resources that need to change and then we can confirm whether we want to proceed or not.

## Destroying the Infrastructure
When we no longer need the infrastructure, we can dispose of all the provisioned resources by running the `cdk destroy` command:

```shell
> cdk destroy --profile pratikpoc
Are you sure you want to delete: CdkAppStack (y/n)? y
CdkAppStack: destroying...



 ✅  CdkAppStack: destroyed


```
As a result of running the `destroy` command, all the resources under the stack are destroyed as a single unit.



## Construct Library and the Construct Hub
The AWS CDK contains the [AWS Construct Library](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html), which includes constructs that represent all the resources available on AWS. This library has three levels of constructs :

- **Level 1 (L1) Constructs**: These are low-level constructs also called CFN Resources which directly represent all resources available in AWS CloudFormation. They are named `CfnXyz`, where `Xyz` is the name of the resource. We have to configure all the properties of the L1 constructs. For example, we will define an EC2 instance with CfnInstance class and configure all its properties.

- **Level 2 (L2) Constructs**: These are slightly higher level, more opinionated constructs than the L1 constructs. L2 constructs have some defaults so that we don't have to set certain properties in our CDK apps. The `Instance` class that we used in our example to provision an EC2 instance is an L2 construct and comes with default properties set.

- **Level 3 (L3) Constructs**: These constructs are also called "patterns". They are designed to help us complete common tasks in AWS, often involving multiple kinds of resources. For example, the [aws-ecs-patterns](https://docs.aws.amazon.com/cdk/api/v2//docs/aws-cdk-lib.aws_ecs_patterns-readme.html) provides higher-level Amazon ECS constructs which follow common architectural patterns for application and network Load Balanced Services, Queue Processing Services, and Scheduled Tasks (cron jobs).

Similarly, the [Construct Hub](https://constructs.dev/) is a resource to help us discover additional constructs from AWS, third parties, and the open-source CDK community.

## Writing Custom Constructs

We can also write our own constructs by extending the `Construct` base class as shown here:

```java
public class MyStorageBucket extends Construct {

   public MyStorageBucket(final Construct scope, final String id) {
      super(scope, id);
      Bucket bucket = new Bucket(this, "mybucket");

      LifecycleRule lifecycleRule = LifecycleRule.builder()
              .abortIncompleteMultipartUploadAfter(Duration.minutes(30))
              .enabled(false)
              .expiration(Duration.minutes(30))
              .expiredObjectDeleteMarker(false)
              .id("myrule")
              .build();

      bucket.addLifecycleRule(lifecycleRule);

   }
}
```
This construct can be used for creating an S3 bucket construct with a lifecycle rule attached.

We can also create constructs by composing multiple lower-level constructs. This way we can define reusable components and share them with other teams like any other code. 

For example, in an organization setup, a team can define a construct to enforce security best practices for an AWS resource like EC2 or S3 and share it with other teams in the organization. Other teams can now use this construct when provisioning their AWS resources without breaking the organization's security policies. 



## Conclusion

Here is a list of the major points for a quick reference:
1. AWS Cloud Development Kit (CDK) is a framework for defining cloud infrastructure in code and provisioning it through AWS CloudFormation.
2. Multiple programming languages are supported by CDK.
2. Constructs are the basic building blocks of CDK.
3. The `App` construct represents the main construct of a CDK application.
4. We define the resources which we want to provision in the Stack construct. 
5. There are three levels of constructs: L1, L2, and L3 (from low to high abstraction).
6. The [Construct Hub](https://constructs.dev/) is a resource to help us discover additional constructs from AWS, third parties, and the open-source CDK community
7. We can curate our constructs usually by composing lower-level constructs. This way we can define reusable components and share them with other teams like any other code. 
8. As with all frameworks, AWS CDK has recommended [best practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html) that should be followed for building CDK applications. 
9. Important cdk commands:
    ```shell
    cdk init app --language java    // Generate the CDK project
    cdk synth      // Generate the CloudFormation Template
    cdk diff       // Finding the difference between deployed resources and new resources
    cdk deploy     // Deploy the app to provision the resources
    cdk destroy    // Dispose of the infrastructure
    ```


You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/cdkv2).

{{% stratospheric %}}
This article gives only a first impression of what you can do with AWS CDK.

If you want to go deeper and learn how to deploy a Spring Boot application to the AWS cloud and how to connect it to cloud services like RDS, Cognito, and SQS, make sure to check out the book [Stratospheric - From Zero to Production with Spring Boot and AWS](https://stratospheric.dev?utm_source=reflectoring&utm_content=in_content)!

Also check out the sample chapters from the book about [deploying a Spring Boot application with CDK](/deploy-spring-boot-app-with-aws-cdk) and [how to design a CDK project](/designing-a-aws-cdk-project).
{{% /stratospheric %}}

