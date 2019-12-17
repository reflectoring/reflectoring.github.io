---

title: Database Migration in Self Contained Systems
categories: [craft]
modified: 2019-12-16
author: artur
excerpt: "A tutorial on how to migrate databases in SCS"
image:
  auto: 0066-database-migration
---

When you develop a application nowadays, you as programmer just want to get the database and 
to add new scripts without thinking about database maintenance. This problem is already solved
by frameworks like [flyway](https://flywaydb.org/) or [liquibase](https://www.liquibase.org/). 
The database is provided to you in this case or you have to take care about this.

If you develop a self contained system (SCS), it could have a database within. In this 
article we are going to have a look how to deliver a database with the SCS and how to have the migration
control over the database and not over the business data only.          

{% include github-project.html url="https://github.com/arkuksin/scs-db-versioning" %}

## General Approach
First we create the database and set the admin user by creating the database. Then we create database
configuration for the application, that we working on. It means creation a scheme, a user, privileges and so on.
After that we start the application and connect the database with created configuration. Let's look how can we automate 
this. I created a example project to show this in action.


## Project Structure

This example is based on three technologies:
* Docker as container engine
* Kubernetes as container orchestration system
* Spring Boot as our application  

The project is a SCS with a [Postgresql](https://www.postgresql.org/) Database and a very simple
Spring Boot Application called `User Service`. According to these components the project consists of two parts:
* `k8s` folder with Kubernetes manifest files
* `src` with source code for `User Service`

A build pipeline is supposed to exist and it should 
* build the application as a Docker image,
* publish the image to a Private Docker Registry,
* apply Kubernetes manifest files,

but we let the pipeline out of scope in this article.    
 
## Kubernetes Objects
 
Let's look at Kubernetes Configuration. 
 
### Base Configuration
 
 In the folder ``k8s/base`` we create a `ConfigMap` and `Secret` with Connection Properties for the `User Service`.
 It looks like 
 
 ConfigMap
 ````yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: user-configmap
  namespace: migration
data:
  spring.datasource.username: user_service
  spring.datasource.driver-class-name: org.postgresql.Driver
  spring.datasource.url: jdbc:postgresql://postgres:5432/user_service
````
Secret
````yaml
apiVersion: v1
kind: Secret
metadata:
  name: user-secret
  namespace: migration
type: Opaque
data:
  spring.datasource.password: bXlfc2VydmljZV9wYXNzd29yZA== #my_service_password
````     

These data are used in two cases:
   * creation of database user for the application,
   * connection database from the application.
   
The point is that we have the single source of data in both cases.

### Database
With the scripts from ``k8s/postgres`` we create a Postgresql Database as `StatefulSet` with an admin user. The password for
the user is read from another secret:

`````yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres
  namespace: migration
type: Opaque
data:
  password: bXlzZWNyZXQ= #mysecret
````` 

This password is needed later to access the database for setting our configuration
 for ``User Service``.

### Migration
Now let's look at the most interesting part of kubernetes configuration.
Our goal is to automate the creation of schema,
users, privileges and so on. We can create all of this with SQL scripts.
Fortunately we can use [flyway](https://flywaydb.org/) to migrate SQL scripts 
as we know it by migration from an application!

First we create a ``ConfigMap`` with the SQL scripts

````yaml
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
````     

Next we create a ``Job``, that migrates these scripts into the database. Since we use Kubernetes,
we can use [flyway docker container](https://hub.docker.com/r/boxfuse/flyway/)
to start the migration. The `Job` mounts the `ConfigMap`
as a ``Volume``. 
After that the flyway tool can see the scripts as files on the filesystem.
You see some placeholder in the scripts. The `Job` replaces the placeholder with values from `ConfigMap` and 
``Secret``, that are created for `User Service`. Flyway supports the
[placeholders](https://flywaydb.org/documentation/placeholders) in the scripts and can replace them 
by values, which are read from [environment variables](https://flywaydb.org/documentation/envvars#FLYWAY_PLACEHOLDER_REPLACEMENT). 

````yaml
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
                  name: user-configmap
                  key: spring.datasource.username
            - name: FLYWAY_PLACEHOLDERS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: user-secret
                  key: spring.datasource.password
          volumeMounts:
            - mountPath: /flyway/sql
              name: sql
      volumes:
        - name: sql
          configMap:
            name: postgres-configmap
      restartPolicy: Never
````

So the ``ConfigMap`` is mounted to the path `/flyway/sql`, which is the default path for SQL migration
with flyway. Environment variables ``FLYWAY_USER`` and `FLYWAY_PASSWORD` define the user for connecting the database,
who is the admin user. The variable ``FLYWAY_PLACEHOLDER_REPLACEMENT`` enables the placeholder replacement.
The variable ``FLYWAY_PLACEHOLDERS_USERNAME`` is set to the username of `User Service` und the variable
``FLYWAY_PLACEHOLDERS_PASSWORD`` to its password.

After these scripts have been running, the database for the user, the user und the privileges are created and are under
flyway control. So if you want to change you database configuration, you have to add a new SQL script to the 
``ConfigMap`` and start the `Job` again. Ideally the pipeline does it. You just have to push the changes of 
`ConfigMap` to your repository.

That always works, when you want to set up new environments with your SMSs. The SCM will create
the database and configure it for the application automatically.

If you have many environments in your delivery pipeline you have configure it once and it works on every
environment.

### Deployment of Application
To access the database from the application, it has to read the database configuration from ``ConfigMap``
and ``Secret``. Of course there is a `spring-boot-starter` for this goal.

These dependencies should be added to your ``build.gradle``

````groovy
    implementation 'org.springframework.cloud:spring-cloud-starter-kubernetes-config:1.0.4.RELEASE'
    implementation 'org.springframework.cloud:spring-cloud-starter-kubernetes:1.0.4.RELEASE'
```` 

Then we have to reference the names of the ``ConfigMap`` and `Secret` in `bootstrap.yml`. Not `application.yml`!

````yaml
spring:
  application:
    name: user-service
  cloud:
    kubernetes:
      config:
        name: user-configmap
      secrets:
        name: user-secret
````

That's it. The values

 * `` spring.datasource.username``
 * `` spring.datasource.driver-class-name ``
 * ``spring.datasource.url``
 * `` spring.datasource.password``
 
 are read from Kubernetes Object and Spring Boot can use them. The same values were used by the ``Job``
 to create a user in the database. This application starts its database migration too and uses 
 the flyway tool for that again, but this time for migrating business data. It is easily made by adding a dependency
 to ``build.gradle``
 
 ````groovy
implementation 'org.flywaydb:flyway-core'
```` 

## Notes
* I used [minikube](https://github.com/kubernetes/minikube) to run the SCS locally.
* For more security don't put secrets in plain to the files in repository.

## Conclusion
There is a way to deliver the database with self contained system and have version control over
configuration of the database. It is possible to achieve this with Kubernetes, Flyway tool and Spring Boot
Application.
