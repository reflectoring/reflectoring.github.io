---

title: Continuous Database Configuration with Flyway and Kubernetes
categories: [craft]
modified: 2019-12-16
author: artur
excerpt: "Combining Kubernetes and Flyway provides us with a powerful tool for automated database configuration that we can include into a continuous delivery pipeline."
image:
  auto: 0066-database-migration
---

Self-contained systems (SCS) are systems that have no tight coupling to other systems. They can be developed, deployed and operated on their own.
With continuous delivery mechanisms, we can easily deploy an application. But what if our SCS contains a database and we want to deliver 
a change to its configuration?

This article shows a way of implementing continuous delivery for database configuration using Kubernetes and Flyway. 

{% include github-project.html url="https://github.com/arkuksin/scs-db-versioning" %}

## The Problem

When developing a self-contained system (SCS), we may want to have the whole database inside the SCS to avoid tight coupling
to other systems. If we want to deliver an SCS, then our goal is to start the SCS with one click. To achieve this goal, we have to:

 1. set up an empty database,
 2. configure the database for access by the application,
 3. deploy the application and connect the application to the database.

We'll want to automate all these steps to create a smooth delivery pipeline to the customer. Technologies like docker make it easy 
to set up an empty database for step 1. Also, we can easily deploy an application as a docker container for step 3. But how can we automatically
configure the database and how can we control different versions for this configuration?

Using the declarative approach of Kubernetes as a container orchestration system, we can easily build up the automated process to deliver the SCS.
We can just declare the desired state of components like a database or application and Kubernetes takes care of the rest.
But it's not possible to declare the desired database configuration with its schemas, users, privileges and so on, because it is the *internal* configuration
of the database.

Imagine we have a continuous delivery pipeline for our SCS. This pipeline does the three steps from the list above.
When we start the pipeline for the first time, it will create and configure the database and deploy the application.
If we later make a change in the business logic, the pipeline will run these steps and Kubernetes will not detect any changes on the database, but on the business logic application.
In this case, Kubernetes is responsible for updating our application. It works fine with Kubernetes. 

**But we also want to be able to make changes to the database configuration (e.g. to change some permissions) and have that change deploy automatically**.

Let's find out how to do that with Kubernetes and Flyway.

## General Approach

It's possible to configure a database with SQL scripts. This means we can code the configuration of the database and use this code
in the delivery process. Thanks to tools like [Flyway](https://flywaydb.org/) or [Liquibase](https://www.liquibase.org/) we can use
version control systems for these SQL configuration scripts. 

Note that we're not talking about SQL scripts that create the tables
for the data model, but about scripts that change the configuration of the database itself.

## Project Structure

The example project is an SCS with a [PostgreSQL](https://www.postgresql.org/) Database and a very simple
Spring Boot application called "Post Service". The project consists of two parts:

* a `k8s` folder with Kubernetes manifest files
* a `src` folder with source code for the Post Service

## Kubernetes Objects
 
Let's have a look at the Kubernetes configuration.
 
### Base Configuration
 
In the folder `k8s/base` we create a [ConfigMap](https://cloud.google.com/kubernetes-engine/docs/concepts/configmap)
and [Secret](https://cloud.google.com/kubernetes-engine/docs/concepts/secret) with the connection properties for the Post Service application.

A `ConfigMap` is a Kubernetes object where we can put our external configuration so that Kubernetes can apply this configuration to our system at runtime:

```yaml
# base/configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: post-configmap
  namespace: migration
data:
  spring.datasource.username: post_service
  spring.datasource.driver-class-name: org.postgresql.Driver
  spring.datasource.url: jdbc:postgresql://postgres:5432/post_service
```

A `Secret` is a Kubernetes Object for storing sensitive data. Similar to a `ConfigMap`, a `Secret` can also be read at runtime: 

```yaml
# base/secret.yml
apiVersion: v1
kind: Secret
metadata:
  name: post-secret
  namespace: migration
type: Opaque
data:
  spring.datasource.password: bXlfc2VydmljZV9wYXNzd29yZA==
```    

The data from `configmap.yml` and the password from `secret.yml` are the data for connecting to the database
with the user `post_service`. After deploying the Spring Boot application, our application and database should be connected and ready to use.

### Database Configuration

With the scripts from `k8s/postgres`, we create a PostgreSQL Database as a
[StatefulSet](https://cloud.google.com/kubernetes-engine/docs/concepts/statefulset) with an admin user.
A `StatefulSet` is a Kubernetes Object that defines components with unique, persistent identities 
and with persistent disk storage. A database is a prime use case for a `StatefulSet`. 

The password for the user is read from another secret:

```yaml
# postgres/postgres-secret.yml
apiVersion: v1
kind: Secret
metadata:
  name: postgres
  namespace: migration
type: Opaque
data:
  password: bXlzZWNyZXQ=
```

We need this password later to run the SQL scripts in the name of the admin user.

### Database Scripts

Now let's look at the most interesting part of the Kubernetes files.
Our goal is to automate the creation of the schema,
users, privileges and other configuration. We can create all of this with SQL scripts.

Fortunately, we can use Flyway as a docker container
to execute the SQL configuration scripts. Since we are now in the world of containers we can use the official
[Flyway Docker Container](https://hub.docker.com/r/boxfuse/flyway/).

First, we create a `ConfigMap` with the SQL scripts:

```yaml
# migration/migration_configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-configmap
  namespace: migration
data:
  V1_1__create_user.sql: |
    CREATE USER ${username} WITH
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      INHERIT
      NOREPLICATION
      CONNECTION LIMIT -1
      ENCRYPTED PASSWORD '${password}';
  V1_2__create_db.sql: |
    CREATE DATABASE ${username} WITH
      OWNER = ${username}
      ENCODING  = 'UTF8'
      CONNECTION LIMIT = -1;
  V1_3__grant_privileges.sql: |
    GRANT ALL ON DATABASE ${username} TO ${username}
```     

To be able to use this `ConfigMap`, we can mount it as 
a [Persistence Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) so that the Flyway Docker container can see it as files.

### Database Migration Job

Next, we create a Kubernetes [Job](https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion/). 
A `Job` is a Kubernetes Object that includes a docker container. It runs only once and terminates immediately after
the container is finished, which is exactly what we need for the execution of the SQL configuration scripts:

```yaml
# migration/migration-job.yml
apiVersion: batch/v1
kind: Job
metadata:
  name: migration-job
  namespace: migration
spec:
  template:
    spec:
      containers:
        - name: flyway
          image: boxfuse/flyway:5.2.4
          args:
            - info
            - repair
            - migrate
            - info
          env:
            - name: FLYWAY_URL
              value: jdbc:postgresql://postgres:5432/postgres
            - name: FLYWAY_USER
              value: admin
            - name: FLYWAY_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres
                  key: password
            - name: FLYWAY_PLACEHOLDER_REPLACEMENT
              value: "true"
            - name: FLYWAY_PLACEHOLDERS_USERNAME
              valueFrom:
                configMapKeyRef:
                  name: post-configmap
                  key: spring.datasource.username
            - name: FLYWAY_PLACEHOLDERS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: post-secret
                  key: spring.datasource.password
          volumeMounts:
            - mountPath: /flyway/sql
              name: sql
      volumes:
        - name: sql
          configMap:
            name: postgres-configmap
      restartPolicy: Never
```

The Job includes the Flyway Docker container and runs it by starting. The `postgres-configmap` is mounted to the `Job`.
This means that Flyway will find scripts on the filesystem and start the migration. After this migration,
the schema and the user will be created in the database.
  
You might have noticed that there are some placeholders in the SQL scripts. In the Job, we expose values from the `post-configmap` and `post-secret` ConfigMaps we have created above as environment variables. We then make use of Flyway's feature to replace [placeholders](https://flywaydb.org/documentation/placeholders) with values from [environment variables](https://flywaydb.org/documentation/envvars#FLYWAY_PLACEHOLDER_REPLACEMENT). We activate this by setting the `FLYWAY_PLACEHOLDER_REPLACEMENT` environment variable to `true`.

In the Job, the `post-configmap` is mounted to the path `/flyway/sql`, which is the default path for SQL migrations
with Flyway. The environment variables `FLYWAY_USER` and `FLYWAY_PASSWORD` define the user executing the scripts,
which is the admin user. 

### Subsequent Database Migrations

After the initial database scripts have been executed, the database, user, and privileges are created and are under
Flyway's control. If we want to change our database configuration in the future, we just have to add a new SQL script to the 
`postgres-configmap` and start the `Job` again. Ideally, our CD pipeline does this automatically. We then just have to push changes to the `postgres-configmap` to our code repository.

Let's assume that the Job was triggered again by the pipeline. The database is already created and configured. There are no changes
in the `postgres-configmap` containing our SQL scripts. The Flyway migration will run anyway, but Flyway will not detect any changes, and thus do nothing.

**Flyway will only execute scripts that have not been executed on the database before, so we can run the Job as often as we want**. Flyway will only do something if there are new scripts in the `postgres-configmap`.

## Deploying the Application

Now the database is prepared to be used from our Spring Boot application. 
To access the database from the Spring Boot application, it has to read the data source configuration from `post-configmap`
and `post-secret`. Luckily, there is a Spring Boot starter for this.

To use the starter, we need to add these dependencies to our application (Gradle notation):

```groovy
    implementation 'org.springframework.cloud:spring-cloud-starter-kubernetes-config:1.0.4.RELEASE'
    implementation 'org.springframework.cloud:spring-cloud-starter-kubernetes:1.0.4.RELEASE'
``` 

Then we have to tell Spring Boot to load the  properties from the `post-configmap` and `post-secret` Kubernetes objects in the configuration file `bootstrap.yml`:

```yaml
# bootstrap.yml
spring:
  application:
    name: post-service
  cloud:
    kubernetes:
      config:
        name: post-configmap
      secrets:
        name: post-secret
```

Don't confuse `bootstrap.yml` with `application.yml`!

That's it. The values

 * `spring.datasource.username`,
 * `spring.datasource.driver-class-name `,
 * `spring.datasource.url`, and
 * `spring.datasource.password`
 
are read from `post-configmap` and `post-secret` and Spring Boot can use them. The same values are used by the Flyway Job.

By the way, this Spring Boot application starts its own database migration with Flyway,
but this time with Spring Boot support instead of Kubernetes support. The application should only create and modify tables,
though, and leave the lower-level configuration to the Kubernetes job. 

## Notes
* I used [minikube](https://github.com/kubernetes/minikube) to run the SCS locally.
* For more security don't put unencrypted secrets into the files in the repository!

## Conclusion

When delivering a self-contained system, we can take advantage of Flyway and Kubernetes to automate database creation and configuration. Flyway enables us to implement a continuous migration of SQL configuration scripts within the delivery process.
We can automate the database configuration for the case when we want to start an SCS from scratch and use the same mechanism for updating the configuration in an already existing database. This is helpful when we have different environments with different database states. 