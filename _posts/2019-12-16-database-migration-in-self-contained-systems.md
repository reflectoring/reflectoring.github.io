---

title: Automated Configuration of Database in Self-Contained Systems with Kubernetes
categories: [craft]
modified: 2019-12-16
author: artur
excerpt: "A tutorial on how to configure databases in SCS automatically"
image:
  auto: 0066-database-migration
---

When we develop a self-contained system (SCS), we often want to have the whole database inside the SCS in order to avoid tight coupling
to other systems. If we want to deliver an SCS, then our goal is to start the SCS with one click. To achieve this goal, we have to do the following steps:
 1. Set up an empty database,
 2. Configure the database for using it from the application, that we deliver with this SCS,
 3. Deploy the application and connect to the database from the application.

If we want to deliver the SCS to the customer we have to automate all these steps. Since we have such technologies as Docker, we can easily set up
an empty database from step 1. Also, we can deploy an application with business logic as a docker container from step 3. But how can we automatically
configure the database and how can we control the versions of configuration?
Using Kubernetes as a container orchestration system with its declarative approach, we can easily build up the automated process to deliver the SCS.
It means, that we can just declare our desire state of components like a database or business logic application and Kubernetes takes care of the rest.
But it is not possible to declare the desire database configuration like schemas, users, privileges and so on, because it is the internal configuration
of the database.

Imagine we have a pipeline to deliver our SCS. This pipeline does the three steps from the list above.
If we start the pipeline first time, the database will be created, the database will be configured and the application will be deployed.
If we later make a change in the business logic, the pipeline will run these steps und Kubernetes will not detect any changes on the database, but on the business logic application.
In this case, Kubernetes is responsible for updating our application. It works fine with Kubernetes. 

But we want also to be able to make changes on one script for the database configuration. After that we want, that this change is detected and
the database configuration will be updated.

In this article, we will have a look at how to configure the database in a continuous way and how to have control over the version of the database configuration.
It means, we want to be able to update the database configuration in the continuous delivery process. 


{% include github-project.html url="https://github.com/arkuksin/scs-db-versioning" %}

## General Approach
It is possible to configure a database with SQL scripts. It means we can code the configuration of the database and use this code
in the delivery process. Thank the tools like [Flyway](https://flywaydb.org/) or [Liquibase](https://www.liquibase.org/) we can have
version control for these SQL configuration scripts. Note, it is not about the migration *from business logic application* like creating the tables
for the data model, constraints and so on. In this article we consider the possibility to configure the database automatically before the
application with business logic is started.
To show how to implement it I created an example project.    

## Project Structure

The project is an SCS with a [PostgreSQL](https://www.postgresql.org/) Database and a very simple
Spring Boot Application called `Post Service`. According to these components, the project consists of two parts:
* `k8s` folder with Kubernetes manifest files
* `src` with source code for `Post Service`

## Kubernetes Objects
 
Let's look at the Kubernetes Configuration.
 
### Base Configuration
 
In the folder `k8s/base` we create a [ConfigMap](https://cloud.google.com/kubernetes-engine/docs/concepts/configmap)
and [Secret](https://cloud.google.com/kubernetes-engine/docs/concepts/secret) with the connection properties for the `Post Service`.
A `ConfigMap` is a Kubernetes object, where we can put our external configuration and it can be applied to the systems at runtime.
A `Secret` is a Kubernetes Object for storing sensitive data. These data can be read at runtime too. 
 
ConfigMap
 ```yaml
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
Secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: post-secret
  namespace: migration
type: Opaque
data:
  spring.datasource.password: bXlfc2VydmljZV9wYXNzd29yZA== #my_service_password
```    

As we can see, the data from `post-configmap` and the password from `post-secret` are the data for connecting to the database
with the user `post_service`. It means, after deploying the Spring Boot application, these data should be read and used by it.  

### Database
With the scripts from `k8s/postgres` we create a PostgreSQL Database as
[StatefulSet](https://cloud.google.com/kubernetes-engine/docs/concepts/statefulset) with an admin user. The password for
the user is read from another secret. `StatefulSet` is a Kubernetes Object, that defines a system with unique, persistent identities 
and with persistent disk storage. A database is exactly the case, where we should use a `StatefulSet`. 

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres
  namespace: migration
type: Opaque
data:
  password: bXlzZWNyZXQ= #mysecret
```

This password is needed later to run the migration of SQL scripts for database configuration by admin user.

### Migration
Now let's look at the most interesting part of Kubernetes files.
Our goal is to automate the creation of the schema,
users, privileges and other configuration. We can create all of this with SQL scripts.
Fortunately, we can use [Flyway](https://flywaydb.org/) as a docker container
to migrate the _SQL configuration scripts_. Since we are now in the world of containers we can use the official
[Flyway Docker Container](https://hub.docker.com/r/boxfuse/flyway/).

First, we create a `ConfigMap` with the SQL scripts.

```yaml
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

As we can see we have SQL scripts in a `ConfigMap`. To be able to use it we can mount this `postgres-configmap` as 
a [Persitence Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/), so that the values from this `ConfigMap`
are seen as files by [Flyway Docker Container](https://hub.docker.com/r/boxfuse/flyway/).

Next, we create a Kubernetes [Job](https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion/). 
A `Job` is a Kubernetes Object, that includes a docker container, it runs only once and terminates immediately after
the container is finished. This exactly what we need for the migration of SQL configuration scripts. The Job includes the 
[Flyway Docker Container](https://hub.docker.com/r/boxfuse/flyway/) and runs it by starting. The `postgres-configmap` is mounted to the `Job`.
It means, the `Flyway` will find scripts on the filesystem and start the migration. After this migration,
the schema and the user will be created in the database.
  
There are some placeholders in the SQL scripts. The `Flyway` replaces the placeholder with values from `post-configmap` and 
`post-secret`, which are created for `Post Service`. It means, that `Flyway` will create a schema and a user with the data,
that we already prepared to build the connection between the `Post Service` and the database. These data are in the `post-configmap`
and `post-secret`. `Flyway` supports the [placeholders](https://flywaydb.org/documentation/placeholders) in the scripts and
can replace them by values, which are read from [environment variables](https://flywaydb.org/documentation/envvars#FLYWAY_PLACEHOLDER_REPLACEMENT).

```yaml
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

So the `post-configmap` is mounted to the path `/flyway/sql`, which is the default path for SQL migration
with `Flyway`. Environment variables `FLYWAY_USER` and `FLYWAY_PASSWORD` define the user for connecting the database,
who is the admin user. This is the user, who starts the migration of SQL configuration scripts.
The variable `FLYWAY_PLACEHOLDER_REPLACEMENT` enables the placeholder replacement.
The variable `FLYWAY_PLACEHOLDERS_USERNAME` is set to the username of `Post Service` und the variable
`FLYWAY_PLACEHOLDERS_PASSWORD` to its password. Again, these data are read from `post-configmap` and `post-secret`.
In this case, we use the data to prepare and configure the database. Later the Spring Boot application `Post Service`
can use the data to connect to the database. 

After these scripts were migrated, the database for the user, the user, and the privileges are created and are under
flyway control. So if we want to change our database configuration, we have to add a new SQL script to the 
`postgres-configmap` and start the `Job` again. Ideally, the pipeline does it. We just have to push the changes of 
`postgres-configmap` to our repository.

If the `Job` runs first time at all and the database is not configured, then the SQL scripts will be applied and 
the schema, the user and the privileges will be created.

Assume, the Job was triggered again by the pipeline, the database is already created and configured. There are no changes
in the `postgres-configmap` with SQL scripts. The `Flyway` migration will run anyway, but `Flyway` will not detect any changes.

And now assume, the Job was triggered again by the pipeline, the database is already created and configured. The `postgres-configmap`
with SQL scripts has a new SQL script. The `Flyway` migration will run and apply the changes.

So with this approach, we can control the version of configuration scripts for the database.
This migration is done with the admin user and supposed to prepare the database for use by the Spring Boot application. 

### Deployment of Application
Now everything in the database is prepared to be used from our Spring Boot application. The schema and the user are created. 
To access the database from the Spring Boot application, it has to read the datasource configuration from `post-configmap`
and `post-configmap`. Of course, there is a `spring-boot-starter` for this.

These dependencies should be added to `build.gradle`

````groovy
    implementation 'org.springframework.cloud:spring-cloud-starter-kubernetes-config:1.0.4.RELEASE'
    implementation 'org.springframework.cloud:spring-cloud-starter-kubernetes:1.0.4.RELEASE'
```` 

Then we have to reference the names of the `post-configmap` and `post-secret` in `bootstrap.yml`. Not `application.yml`!

````yaml
spring:
  application:
    name: post-service
  cloud:
    kubernetes:
      config:
        name: post-configmap
      secrets:
        name: post-secret
````

That's it. The values

 * `spring.datasource.username`
 * `spring.datasource.driver-class-name `
 * `spring.datasource.url`
 * `spring.datasource.password`
 
are read from `post-configmap` and `post-secret` and Spring Boot can use them. The same values were used by the `Job` with `Flyway` migration
to create a user in the database.
By the way, this Spring Boot application starts its database migration too and uses the `Flyway` tool for that again,
but this time with Spring Boot support. The application just creates a table with the name `Post`.
It is easily made by adding a dependency to `build.gradle`
 
 ````groovy
implementation 'org.flywaydb:flyway-core'
```` 

## Notes
* I used [minikube](https://github.com/kubernetes/minikube) to run the SCS locally.
* For more security don't put secrets in the plain to the files in the repository.

## Conclusion
There is a way to configure the database automatically and with version control of configuration when we deliver a self-contained system.
With [Flyway](https://flywaydb.org/) tool it is possible to integrate continuous migration of SQL configuration scripts in the delivery process.
We can automate the database configuration for the case when we want to start an SCS from scratch. Also, we can use the version control for updating
the database configuration for running SCS. When we have many environments in the pipeline and our SCS runs in each of them,
then we can update the database configuration of this SCS on every environment with one commit.