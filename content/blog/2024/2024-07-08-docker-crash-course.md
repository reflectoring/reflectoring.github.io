---
title: "Crash Course: Integrating Docker with Node.js"
categories: ["Node"]
date: 2024-07-08 00:00:00 +1100
modified: 2024-07-08 00:00:00 +1100
authors: ["ajibade"]
description: "Discover how Docker can transform your Node.js projects. This article explains how to easily use Docker with Node.js for reliable environments, easier deployments, and simple scaling. Whether you're new to Docker or have used it before, you'll learn how to improve your Node.js projects and take advantage of modern development techniques."
image: images/stock/0137-speed-1200x628-branded.jpg
url: node-docker-app-server
---

Developers usually face significant challenges when setting up their development environments. Each team member has to manually install all necessary services and dependencies directly on their operating system. For instance, if they are developing a Javascript application that requires PostgreSQL and Redis, each developer on the team would need to individually install, configure, and run these services locally.

This installation method differs based on the developer's operating system, resulting in different procedures and a larger risk of problems and delays. Setting up a new development environment can be time-consuming, particularly for complicated projects that require several services.

Docker simplifies development by eliminating the need for direct installations on the developer's OS. It uses isolated Linux-based images to package everything needed, such as specific versions of PostgreSQL or Redis, into single containers. These containers can be downloaded and run from Docker Hub with a single command, regardless of the developer's OS, making the setup of multiple services straightforward and efficient.

In this post, we'll explore Docker's importance, its uses, architecture, managing multi-container applications with Docker Compose, and how to integrate it into a Node.js application.

# Prerequisites
Before we begin, make sure you have the following prerequisites:
- Docker [installed](https://docs.docker.com/engine/install/) on your machine.
- Basic knowledge of Node.js and JavaScript.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/docker-app" %}}

# What is Docker
Docker is a powerful, open-source containerization platform that has transformed application development, deployment, and management. By encapsulating applications in containers, Docker ensures consistency across environments, streamlining and simplifying setup and deployment. Each container includes the application and its dependencies, making Docker an industry standard for reliable and predictable software development.

# Why we should consider Docker?
Docker containerization technology improves software development and deployment by maintaining consistency across environments and increasing security through isolation.

This isolation improves security while also ensuring that apps are lightweight and portable.

Docker also improves resource scalability and simplifies dependency management. Docker enables rapid deployment and CI/CD. It makes collaborating easier and provides a robust environment for new and legacy applications.

# When to Use Docker
Docker is versatile and supports a wide range of use cases, including:

- **Microservices architecture**: Docker allows for the creation and deployment of smaller, manageable bits of functionality independently, resulting in minimum to zero downtime.
- **Local Development**: Generates a local replica of production environments, making configuration easier and more consistent.
- **Quick Start with Pre-built Images**: Docker Hub provides new users with access to a wide pool of pre-built Docker images. This enables people to easily get started with popular technology without having to learn all of the underlying complexities.
- **Continuous Integration and Continuous Deployment (CI/CD)**: Docker excels at CI/CD because it swiftly creates and manages containers, making the process more efficient and dependable.
- **Consistency Across Development and Production Environments**: Eliminating "It Works on My Machine" difficulties: Docker ensures that programs execute consistently across all environments, decreasing the number of problems and difficulties caused by environment variances.

# Docker Architecture & Concepts
Let's look at some of the main architecture and concepts of docker

## Docker Engine
Docker Engine is the industry’s de facto container runtime that runs on various Linux (CentOS, Debian, Fedora, RHEL, and Ubuntu) and Windows Server operating systems. Docker creates simple tooling and a universal packaging approach that bundles up all application dependencies inside a container which is then run on Docker Engine.

This is the core software responsible for managing the life cycle of a docker container. It provides the infrastructure for creating, running, and orchestrating docker containers. The docker engine interacts with the host kernel to allocate resources and enforce isolation between containers. And this is done through two things

- **cgroups (contol group)**: They allocate resources among processes.
- **Namespaces**: Restricts container access and visibility to other resources on the system. Ensuring that each container has its isolated environment.

## Docker Images
These are a lightweight, standalone, and executable package that includes everything we need to run a piece of software eg; software code, runtime, the system tools, the libraries, and any settings that we need as well.

Already made Docker images can be pulled from the Docker hub using various methods such as Docker CLI, Docker Compose, Docker SDKs, etc. And Dockerfiles are used to build images.

Pulling `pull` and building `build` Docker images are fundamental aspects of working with Docker. Pulling allows us to quickly obtain ready-made images from [dockerhub](https://hub.docker.com/) registry while building gives us the flexibility to create custom images tailored to your specific requirements. Both processes are essential for developing, deploying, and managing containerized applications.

### Image Commands
- **`docker pull`**: Downloads the specified image from Docker Hub to our local Docker environment.
  ```bash
  docker pull ubuntu:latest
  ```
- **`docker build`**: Creates an image from the Dockerfile in the current directory (`.`).
  ```bash
  docker build -t <image_name>:latest .
  ```
- **`docker images`**: Lists all Docker images in your local Docker environment.
  ```bash
  docker images
  ```
- **`docker rmi`**: Removes one or more specified Docker images
  ```bash
  docker rmi <image_id>
  ```
- **`docker tag`**: Creates a new tag for an existing Docker image, assigning it a new name.
  ```bash
  docker tag <image_id> <image_name>:latest
  ```
- **`docker push`**: Once an image is built locally using `docker build`, This command is used to push (or upload) the built image to a remote container registry, such as Docker Hub or a private registry. This makes the image accessible to others for deployment or further use
  ```bash
  docker push <image_name>:latest
  ```

## Dockerfile
A docker file is an instruction file for taking a Docker image and building it into a container. It is used to automate the building of Docker images and ensure that they are consistent and reproducible across different environments.

### Dockerfile Keywords
Here are some common Dockerfile keywords:

- **FROM**: specifies the base image for the Dockerfile.
- **RUN**: executes a command in a new layer on top of the image and commits the changes.
- **ADD/COPY**: copies files from the host to the container.
- **CMD**: specifies the default command to run when starting a container from the image.
- **ENTRYPOINT**: configures the container to run as an executable.
- **ENV**: sets environment variables for the container.
- **EXPOSE**: specifies the network ports that the container listens on at runtime.
- **VOLUME**: creates a mount point for a volume.
- **USER**: sets the user for the container.
- **WORKDIR**: sets the working directory for the container.

## Docker Containers
Docker containers are created using Docker images as blueprints. These containers are instances of Docker images running in the Docker engine. Each container is isolated and self-sufficient, containing only the essential components needed to run a specific application. Containers can be started, stopped, and restarted quickly.

### Container Commands
- **`docker run`**: Create and run a new container from a specified Docker image.
  ```bash
  docker run image_name
  ```

- **`docker ps`**: Returns a list all running Docker containers
  ```bash
  docker ps
  ```
- **`docker ps -a`**: Returns a list of all Docker containers (including running, stopped, and exited containers).
  ```bash
  docker ps -a
  ```
- **`docker stop`**: stops one or more specified running Docker containers
  ```bash
  docker stop <container_id>
  ```
- **`docker start`** starts one or more specified stopped Docker containers.
  ```bash
  docker start <container_id>
  ```

- **`docker restart`**: This restarts one or more running Docker containers.
  ```bash
  docker restart <container_id>
  ```

- **`docker rm`**: deletes one or more specified Docker containers from our system
  ```bash
  docker rm <container_id>
  ```

- **`docker exec`**: is used to execute a command inside a running Docker container (e.g., open a bash shell).
  This command is particularly useful for interacting directly with a containerized application or for performing administrative tasks within the container environment.
  ```bash
  docker exec -it <container_id> /bin/bash
  ```

## Docker Networks
Docker networks facilitate communication between containers and external services. By default, containers are connected to the Docker bridge network. Docker offers several types of networks to support various use cases and deployment scenarios:

- **Bridge Network**: Default network type that allows communication between containers on the same host.
- **Host Network**: Containers share the host's network stack, providing higher performance but less isolation.
- **Overlay Network**: Enables communication between containers on different Docker hosts within a Swarm cluster.
- **Macvlan Network**: Assigns a MAC address to a container, making it appear as a physical device on the network.
- **None Network**: No network connectivity, providing complete isolation.
- **Custom Plugins**: Integrate with third-party network solutions for advanced networking capabilities.

### Network Command
- **`docker network ls`**: returns a list of all Docker networks.
  ```bash
  docker network ls
  ```
- **`docker network create`**: By default, this command creates a user-defined bridge network unless otherwise specified with additional options to create other network types.
  ```bash
  docker network create <network_name>
  ```

- **`docker network inspect`**: returns detailed information about a specified Docker network
  ```bash
  docker network inspect <network_name>
  ```

- **`docker network rm`**: Removes one or more specified Docker networks from your system
  ```bash
  docker network rm <network_name>
  ```

## Docker Volumes
Containers in Docker are designed to be temporary and stateless. This means that when a container is stopped or deleted, any data stored within it is also lost. This ephemeral nature is beneficial for consistency and scalability, but it poses challenges for applications that need to persist data across container restarts or recreations, such as databases or user-uploaded files.

Docker offers the concept of volumes. By using volumes, persistent data such as databases or user uploads can be safely stored outside of the container, ensuring that it remains accessible even if the container is stopped or recreated. Volumes are directories or files that reside on the host file system and can be mounted into one or more containers.

### Volume Command
- **`docker volume ls`**: This returns a list of all Docker volumes on the system.
  ```bash
  docker volume ls
  ```
- **`docker volume create`**: Creates a new Docker volume for storing persistent data outside of containers.
  ```bash
  docker volume create <volume_name>
  ```
- **`docker run --volume`**:
  Running the database container with the volume mounted, to ensure data persistence in Docker containers, volumes can be mapped when starting a container using the `--volume` or `-v` flag. This allows us to create and manage storage that persists beyond the container's lifecycle.
  ```bash
  docker run -d -v db_data:/var/lib/postgresql/data postgres
  ```

  In the above example:
  - `docker run`: command to run our Docker container.
  - `-d`: This flag tells Docker to run our container in a detached mode, meaning it runs in the background.
  - `--volume db_data:/var/lib/postgresql/data`: This option mounts a Docker volume named `db_data` to the `/var/lib/postgresql/data` directory inside the container.
  - `postgres`: This is the name of the Docker image from which to create the container. In this case, it's the official PostgreSQL image from Docker Hub.

  Volumes exist outside the container’s lifecycle and can be shared between multiple containers. This is useful for scenarios where multiple containers need access to the same data. We can run multiple containers with the same volume name and path:
  ```bash
  docker run -d -v <volume_name>:/path/in/container my_image
  docker run -d -v <volume_name>:/path/in/container another_image
  ```

  This way, both containers will have access to the same data stored in the `<volume_name>`.

- **`docker volume inspect`**: command provides detailed information about a Docker volume
  ```bash
  docker volume inspect <volume_name>
  ```
- **`docker volume rm`**: is used to remove one or more Docker volumes that are no longer in use.
  ```bash
  docker volume rm <volume_name>
  ```

# Managing Multi-Container Docker Applications with Docker Compose
Docker Compose simplifies managing multi-container Docker applications by defining all services in a single `docker-compose.yml` file. This file acts as a blueprint for the entire application, facilitating easy management of services with commands for starting, stopping, and rebuilding. Docker Compose handles networking between services for seamless communication and provides straightforward volume management for data storage.

## How Docker Compose Helps with Networking and Linking
Docker Compose simplifies networking and linking between services in multi-container Docker applications by automatically creating a default network for the containers defined in the `docker-compose.yml` file. . This default network allows services to communicate with each other using their service names as hostnames.

Additionally, Docker Compose supports custom networks, allowing for finer control over network configuration and isolation for different parts of the application.

## Docker-Compose Commands
- **`docker-compose up`**: Starts all services defined in `docker-compose.yml`, handling building, recreation, and attachment of containers. It also configures networking and volumes as specified in the file.
  ```bash
  docker-compose up
  ```
- **`docker-compose run`**: To run a one-off command in a service container
  ```bash
  docker-compose run <service-name> <command>
  ```
- **`docker-compose down`**: Stops and removes containers, networks, and services created by `docker-compose up`, freeing up resources and cleaning the environment. Volumes associated with containers are not removed by default.
  ```bash
  docker-compose down
  ```
- **`docker-compose ps`**: Provides a quick overview of the status of all services managed by Docker Compose in `docker-compose.yml`.
  ```bash
  docker-compose ps
  ```
- **`docker-compose build`**: Builds or rebuilds Docker images defined in `docker-compose.yml`, using configurations from the file. Useful for updating images after making changes to Dockerfiles or application build contents.
  ```bash
  docker-compose build
  ```
- **`docker-compose logs`**: Displays aggregated logs for all services defined in `docker-compose.yml`, useful for troubleshooting and monitoring application output.
  ```bash
  docker-compose logs
  ```
  To view logs for a specific service:
  ```bash
  docker-compose logs <service-name>
  ```

# Integrate Docker into a Nodejs Application
Now let’s see what integrating Docker into a Node.js application looks like in practice. Here, we will build a simple CRUD Node.js application using a PostgreSQL database and Sequelize ORM to save and create `Users` information. Once our application is complete, we will integrate Docker into it using Docker Compose, allowing us to run the application in a containerized environment without needing to install PostgreSQL on our local machine.

Let's start by creating our basic Node.js app. Run the following commands in a terminal within a directory of choice:

```bash
mkdir docker-app
cd docker-app
npm init -y
```

The above commands create a new directory named `docker-app`, navigates into it, and initialize a Node.js project with default settings.

Next, we will create all necessary files and folders needed in our application by running:

```bash
mkdir routes
touch app.js database.js database.test.js .env routes/users.js
```

Then, install all required dependencies using the below command:

```bash
npm install dotenv express pg sequelize jest
```

These dependencies will be used for:

- **dotenv**: Loads environment variables from a `.env` file into `process.env`.
- **Express**: A web application framework for building APIs and web servers.
- **pg**: PostgreSQL client for Node.js, enabling interaction with PostgreSQL databases.
- **sequelize**: A promise-based ORM (Object-Relational Mapper) for Node.js, supporting various SQL dialects including PostgreSQL.
- **jest**: A testing framework for JavaScript, used for unit and integration tests.

Our application is set up, we are ready to start building. We will begin by setting up our application's server.

Head to the `app.js` file, copy and paste the following there:

```javascript
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const UserRouter = require("./routes/users");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send({ data: { message: "Welcome to Docker Crash Course!!!" } });
});

app.use("/users", UserRouter);

app.listen(3000, () => {
  console.log("Running on port 3000");
});
```

The above code sets up a server that listens on port `3000`. Also creates Middlewares to handle JSON and URL-encoded requests. We also define a `/users` endpoint that routes to our CRUD methods and a root endpoint `/` that returns a JSON welcome message.

Next head to the `routes/users.js` file, this will contain all our application's CRUD logic using the Sequelize Model to create and query for `Users` information.

Paste the following code in `routes/users.js`:

```javascript
const express = require("express");
const router = express.Router();
const db = require("../database");

router.get("/all", function (req, res) {
  db.Users.findAll()
    .then(users => {
      res.status(200).send(users);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

router.get("/:id", function (req, res) {
  db.Users.findByPk(req.params.id)
    .then(user => {
      res.status(200).send(user);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

router.post("/", function (req, res) {
  db.Users.create({
    name: req.body.name,
    age: req.body.age,
    id: req.body.id,
  })
    .then(user => {
      res.status(200).send(user);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

router.delete("/:id", function (req, res) {
  db.Users.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then(() => {
      res.status(200).send({ messsage: "User record deleted successfully" });
    })
    .catch(err => {
      res.status(500).send(JSON.stringify(err));
    });
});

module.exports = router;
```

Next for our Database configuration using Postgres and Sequelize copy and paste the following in the `./database.js`:

```javascript=
const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  process.env.DB_SCHEMA,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: {
      ssl: process.env.DB_SSL == "true",
    },
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });

const Users = sequelize.define("Users", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  age: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
});

sequelize
  .sync({ force: false }) // `force: true` will drop the table if it already exists
  .then(() => {
    console.log("Database tables created!");
  })
  .catch(error => {
    console.error("Unable to create tables:", error);
  });

module.exports = { sequelize, Users };
```

To spice things up, we'll include test logic in our application that can be run from our Docker container.

To include a test logic in the application, copy and paste the following into `database.test.js`:

```javascript
const db = require("./database");

beforeAll(async () => {
  await db.sequelize.sync({ force: false });
});

test("Add new User", async () => {
  expect.assertions(1);
  const user = await db.Users.create({
    id: 1234,
    name: "Denver Mike",
    age: 18,
  });
  expect(user.id).toEqual(1234);
});

test("Get a User", async () => {
  expect.assertions(2);
  const user = await db.Users.findByPk(1234);
  expect(user.name).toEqual("Denver Mike");
  expect(user.age).toEqual(18);
});

test("Delete state", async () => {
  expect.assertions(1);
  await db.Users.destroy({
    where: {
      id: 1234,
    },
  });
  const user = await db.Users.findByPk(1234);
  expect(user).toBeNull();
});

afterAll(async () => {
  await db.sequelize.close();
});
```

Next, we will store all of our application sensitive data and database configuration information in the `./env` file:

```bash
NODE_ENV=production
API_URL=https://api.example.com
DB_SCHEMA= postgres
DB_USER= postgres
DB_PASSWORD= postgres
DB_HOST= localhost
DB_HOST= postgres
DB_PORT= 5432
```

These database configurations are required and provided by the [Postgres Docker image](https://hub.docker.com/_/postgres).

Our Node.js application is all set and ready to start creating and querying for `Users` information. However, we need a PostgreSQL database to connect to. Next, we will begin our Docker integration.

First, create a `.dockerignore` file in the root directory. This file will contain the names of files that we do not need to include in the Docker container:

```env
.git
.gitignore
node_modules/
```

To ensure our application is containerized effectively, we'll create a `Dockerfile` file that defines our Docker setup. This file will handle the installation of all necessary dependencies and the configuration of the container environment.

In the root directory create a file named `Dockerfile`, and copy and paste the below commands in it:

```dockerfile
FROM node:18.16.0-alpine3.17
WORKDIR /opt/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3333
CMD [ "npm", "start"]
```

Our above Dockerfile sets up a Node.js environment using the Alpine Linux base image. It specifies the working directory inside the container.

Then copies `package.json` and `package-lock.json` files from the host to the container, then installs dependencies and copy the remaining application files.
The container listens on port `3333`.

Next, we will create a `docker-compose.yml` file. Using docker-compose in our application is beneficial since we want to manage multi-container Docker applications. In our case, we want to use PostgreSQL with our application `server`.

`docker-compose.yml` file allows us to define and run both applications within Docker.

To do this copy and paste the following in the `docker-compose.yml` file:

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:latest
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - server-db:/var/lib/postgresql/data

  server:
    build:
      context: .
    env_file:
      - .env
    depends_on:
      - postgres
    ports:
      - "3333:3333"

volumes:
  server-db:
```

Our `docker-compose.yml` file defines two services:

- **postgres:** Uses the latest PostgreSQL image from Docker Hub. It sets up environment variables for the PostgreSQL database (`POSTGRES_USER` and `POSTGRES_PASSWORD`), exposes port `5432` for database connections, and mounts a volume (`docker-node-server-db`) to persist PostgreSQL data.
- **server:** This builds an image from the current directory (`.`), loads environment variables from our `.env`. To ensure appropriate startup order, the `server` depends on the 'postgres' service to be completely created before building.

Docker Compose configures and runs the postgres service container along with our application container (server), managing the dependencies and settings as specified in our YAML file.

## Testing
Our Docker setup is complete, we can build our application Docker images and begin testing our application's test cases and CRUD API endpoints.

### Building the Application Docker Images
To create our application Docker images, run the following command in the terminal:

```bash
docker-compose build
```

This command will create Docker images for all services specified in the `docker-compose.yml` file.

### Running Jest Tests Manually
To run our test cases manually on Docker, run the following command:

```bash
docker-compose run server npm test
```

{{% image alt="npm-versioning" src="images/posts/docker-app/docker-node-server-test.png" %}}

The above command will start a new container from our `docker-node-server` service and run the `npm test` command within it, executing all our set test cases. We can see all our test was runned and passed successly.

### Starting Services and Running the Application
To start our services (database and 'docker-node-server'). Run:

```bash
docker-compose up -d
```

This will check our current directory for our `docker-compose` YAML file, and it is going to start all the services in detach mode `-d`.

{{% image alt="docker-node-server-up" src="images/posts/docker-app/docker-node-server-up.png" %}}

This runs the Postgres database service and the 'docker-node-server' application in our Docker environment.

We can run `docker container ls` command, to see a list of all running containers

{{% image alt="docker-node-server-list" src="images/posts/docker-app/docker-node-server-list.png" %}}

We can see that it expose our `docker-node-server` on port `3333:3333`. If we go the the browser/test-tool then [localhost:3333](http://localhost:3333/) we can see our server welcome response message. This shows our Docker compose is working properly.

{{% image alt="docker-node-server-browser" src="images/posts/docker-app/docker-node-server-browser.png" %}}

For further testing, you can try creating and querying User data using the /users endpoint.

# Conclusion
In conclusion, While mastering Docker may not be mandatory for every programmer, having a fundamental understanding can prove invaluable, particularly in scenarios requiring efficient deployment, scaling applications, or ensuring seamless collaboration among teams. Whether deploying complex microservices architectures or simplifying local development setups, Docker's adaptability enables developers to innovate faster and more reliably, making it an essential tool in the modern programmer's toolbox.
