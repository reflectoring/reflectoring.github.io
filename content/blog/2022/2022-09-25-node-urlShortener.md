---
title: "Building a Url Shortener With Node.Js"
categories: ["Node"]
date: 2022-09-25 00:00:00 +1100
authors: ["ajibade"]
description: "Building A MERN stack Url Shortener Application"
image: images/stock/0043-calendar-1200x628-branded.jpg
url: node-url-shortener
---


The best URL shortening service depends on your needs and what you want it to do. There are a lot of simple, fast, and free URL shortening services. Some provide detailed information about who is clicking your links, the number of times they are clicked and even options to add a [call to action](https://en.wikipedia.org/wiki/Call_to_action_(marketing)) to links. URL shorteners like [bitly](https://bitly.com/) and [cutt.ly](https://cutt.ly/) are popular examples.

This tutorial will walk you through how to develop a URL shortener application using the `MERN stack`. Developing `REST APIs` with `Node.js` and `MongoDB` and then integrating them into `React.js` frontend applications. This is a common coding interview question and an excellent practice project for new `Node.js` and `React` developers.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/url-shortener" %}}

## Urlshortner Behind the Scene
A URL shortener service allows users to enter long URLs and generate shorter, unique URLs in return. When the user lookup generated short URLs, they are redirected to the original long URL content.

First, a URL shortener service selects a short domain name as a placeholder. Such as `goo.gl` `tinyurl.com` or `bit.ly`  Then a  unique shortcode or id is generated. For example, the URL https://reflectoring.io/schedule-cron-job-in-node/ can be shortened to https://lnkd.in/dFZXFq2T.

These generated shortcodes are stored alongside the domain name.

And then mapped to the long URL.

When we visit the newly generated short URL. A database lookup is performed using the shortcode as a key, and if it is found, we are redirected to the long URL's content.

URL shortener service simply uses a URL redirect. However, scaling, monitoring, URL filtering, spam prevention, URL verification, and other required features can result in more advanced logics.

## Setting up `Node.Js` Application

To begin, move into a new root directory where we want our application to live.

Enter the following command into the terminal:
```
mkdir urlbackend
```
And this:
```
cd urlbackend
```
The folder `urlbackend` is created here. Then we moved our terminal directory to `urlbackend`, which is where our `Node.js` server lives.

Run the command below in the terminal to initialize our `Node.js` application.
```
npm init -y
```
Then open your `Node.js` application in your preferred IDE. 

Using the terminal run the following command. Ensure you are in the `urlbackend` directory:

```
npm install cors dotenv express mongoose shortid
```
Here, we're setting up the required dependencies for our backend, which include:
- cors: Cross-origin resource sharing (CORS) allows AJAX requests to skip the Same-origin policy and access resources from remote hosts. Comes in handy while connecting to our react application.
- dotenv: Loads environment variables from a .env file into process.env
- express: `Node.Js` framework
- mongoose: An object modeling tool aids in connecting to and communicating with `MongoDB`.
- shortid: Generates non-sequential short unique ids

Next, create an `index.js` and a  `.env` file.

Our application should be structured like this:
{{% image alt="We want to deploy our application into a staging and a production environment" src="images/posts/designing-a-aws-cdk-project/serverapp.png" %}}

In the `index.js` file, paste this to create a simple`Node.Js` server:
```javascript
const express = require('express');
const app = express();

// Server Setup
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Server is running at PORT: ${PORT}`);
});
```
In the code above, we created an express server by importing and instantiating the express package into the index.js file. Making it listen on our custom PORT `3333`.

Then next in our `.env` file we are going to store our `DOMAIN_URL` and `MongoDB_URI`. For the time being, the `DOMAIN_URL` in this application will be our `localhost` server location. 

To get our `MongoDB_URI` we have to create a MongoDB atlas cluster

## Creating MongoDB Atlas Cluster
Follow these steps to create a MongoDB altas cluster:
- [Go here](https://account.mongodb.com/account/register)  to sign up for a new MongoDB Atlas account.
- Fill in the registration form with your information and click  **Sign up**.
- Click on Deploy a shared cloud database for `Free`
- Click on Create a Shared Cluster
- Next, click on **Database access** on the sidebar and Add New Database User
- Select Password then enter in a username and password detail for your user.
- `Built-in Role` select `Atlas Admin`
- Click the **Add User** button to create your new user
- Next, click on **Network Access** on the sidebar.
To Allow Access From All IP Addresses
- Click on Add IP Address button
- Select `ALLOW ACCESS FROM ANYWHERE`
- Click the **Confirm**  button.
- Next, click on **Database** on the sidebar
- Click the  **Connect**  button for your cluster
- In the popup modal, click on  **Connect your application**.
- **Copy** the URI on the clipboard
- Lastly, all you need to do is replace the `<password>` field with the password you created previously.

Our MongoDB atlas is all set and ready for use. Otherwise, click [here](https://www.freecodecamp.org/news/get-started-with-mongodb-atlas/) for a more in-depth guide on how to set up a MongoDB cluster.

We can now, store our `DOMAIN_URL` and `MongoDB_URI` in `.env`:
```
MONGO_URI= mongodb+srv://<username>:<password>@cluster0.oq1hdin.mongodb.net/?retryWrites=true&w=majority
DOMAIN_URL=http://localhost:3333
```

Enter the following code into the terminal to Start our Node.js server:
```
node index.js
```
Output:
```
Server is running at PORT: 3333
```
## Creating MongoDB Schema
Everything in Mongoose starts with a Schema. Each schema maps to a MongoDB collection and defines the shape of the documents within that collection. We will need to create a Schema for our Urls. 

Create a `Url.js` file in the `urlbackend` folder.

To create our schema, paste the following code into `Url.js` file:
```javascript
const mongoose = require("mongoose");

const UrlSchema = new mongoose.Schema({
  urlId: {
    type: String,
    required: true,
  },
  origUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
  },
  clicks: {
    type: Number,
    required: true,
    default: 0,
  },
  date: {
    type: String,
    default: Date.now,
  },
});

module.exports = mongoose.model("Url", UrlSchema);
```
In the above code we use mongoose to create a schema this will structure how the `Urls` are saved in our MongoDB database. To use schema definition, we converted our UrlSchema into a Model. By passing it into 

`mongoose.model(modelName, schema)`

## Create Helper Function To Validate Url Links

Following that, we'll write a simple helper function. This will be used to validate that the URLs entered are in the right format. Create an `Util` folder and an `util.js` file in it.

In the `util/util.js` file, add the following code:

```javascript
function validateUrl(value) {
  var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
	    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
	    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
	    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
	    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
	    '(\\#[-a-z\\d_]*)?$','i');

      return !!urlPattern.test(value);
}

module.exports = { validateUrl };
``` 
## Connecting to Database and Creating Endpoints
In this section, we will connect the node js application to our database. And add all of the necessary endpoints to our application's `index.js` file.

In the `index.js` file, paste the following code:

```javascript
const  dotenv = require("dotenv");
const  express = require("express");
const  cors = require("cors");
const  mongoose = require("mongoose");
const  shortid = require("shortid");
const  Url = require("./Url");
const  utils = require("./Util/util");

// configure dotenv
dotenv.config();
const app = express();

// cors for cross-origin requests to the frontend application
app.use(cors());
// parse requests of content-type - application/json
app.use(express.json());

// Database connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`Db Connected`);
  })
  .catch((err) => {
    console.log(err.message);
  });

// get all saved URLs 
app.get("/all", async (req, res) => {
  Url.find((error, data) => {
    if (error) {
      return next(error);
    } else {
      res.json(data);
    }
  });
})

// URL shortener endpoint
app.post("/short", async (req, res) => {
  console.log("HERE",req.body.url);
  const { origUrl } = req.body;
  const base = `http://localhost:3333`;

  const urlId = shortid.generate();
  if (utils.validateUrl(origUrl)) {
    try {
      let url = await Url.findOne({ origUrl });
      if (url) {
        res.json(url);
      } else {
        const shortUrl = `${base}/${urlId}`;

        url = new Url({
          origUrl,
          shortUrl,
          urlId,
          date: new Date(),
        });

        await url.save();
        res.json(url);
      }
    } catch (err) {
      console.log(err);
      res.status(500).json('Server Error');
    }
  } else {
    res.status(400).json('Invalid Original Url');
  }
});

// redirect endpoint
app.get("/:urlId", async (req, res) => {
  try {
    const url = await Url.findOne({ urlId: req.params.urlId });
    console.log(url)
    if (url) {
      url.clicks++;
      url.save();
      return res.redirect(url.origUrl);
    } else res.status(404).json("Not found");
  } catch (err) {
    console.log(err);
    res.status(500).json("Server Error");
  }
});

// Port Listenning on 3333
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
});
```
First, in the code above, we imported all of the dependencies our application requires, as well as the schema and our helper function for validating entered urls.

Then we configured dotenv and Instantiated the `cor()` cross origin request for our server.

Following that, we used mongoose to establish a database connection to our mongoDb cluster.

Then we also created our application endpoints to:
- get all URLs,
- shorten URLs,
- and endpoint to redirect short URLs to the original URLs.

Run the following command in the terminal to start our server.
```
node index.js
```
Output:
```
Server is running at PORT 3333
Db Connected
```
Our Rest APIs and database are now operational. Next, we will configure our React application and test our endpoints:

## Setting Up React Project

To create our new react application. 
**Change the terminal directory to the project's root folder**.

In the terminal, enter the following code:
```
npx create-react-app urlfrontend
```

Once the React application has been successfully created, type the following in the terminal to move the terminal directory to our React `urlfrontend` folder:

```
cd urlfrontend
```
Installing necessary dependencies:

```
npm install axios bootstrap
```
Here, we installed the required packages for our React application:
- axios: to make calls to REST APIs.
- bootstrap: to style our application, and helps create an elegant responsive layout.

Then open your `React` application in your preferred IDE. 

To use Bootstrap, include the bootstrap CSS in the main `src/App.js` file.

```
import "bootstrap/dist/css/bootstrap.min.css";
```

## Create Url Components

In this section, we will create two URL components.

Create a new folder called `components` in the `src` folder of the application.

Create two new files in our newly created components folder. Create two new files called `AddUrlComponent.js` and `ViewUrlComponent.js`.

This is the structure of our project now:
{{% image alt="We want to deploy our application into a staging and a production environment" src="images/posts/designing-a-aws-cdk-project/mern-stack-structure.png" %}}


Next, paste the following code in the `AddUrlComponent` file:
```javascript
import React, { useState } from 'react'
import axios from "axios";

const AddUrlComponent = () => {
    const [url, setUrl] = useState("");

    
    const onSubmit = (e)=> {
        e.preventDefault();

        if (!url) {
          alert("please enter something");
          return;
        }

        axios
          .post("http://localhost:3333/short", {origUrl: url})
          .then(res => {
            console.log(res.data);
          })
          .catch(err => {
            console.log(err.message);
          });

        setUrl("")
    }
    console.log(url)

  return (
    <div>
      <main>
        <section className="w-100 d-flex flex-column justify-content-center align-items-center">
          <h1 className="mb-2 fs-1">URL Shortener</h1>
          <form className="w-50" onSubmit={onSubmit}>
            <input
              className="w-100 border border-primary p-2 mb-2 fs-3 h-25"
              type="text"
              placeholder="http://samplesite.com"
              value={url}
              onChange={({ target }) => setUrl(target.value)}
            />
            <div class="d-grid gap-2 col-6 mx-auto">
            <button type="submit" className="btn btn-danger m-5">
              Shorten!
            </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default AddUrlComponent;
```
The component we just created in the snippet above `AddUrlComponent`, has a straightforward form for accepting the entered URLs in our applications and uses the axios dependency to send a `POST` request to our server endpoint API.

To save our state changes, we used the React `useState` hook. Also, take note of how we styled the component using a couple of Bootstrap classes.

Next, paste the following in the `ViewUrlComponent` file:

```javascript
import React, { useEffect, useState } from 'react'
import axios from "axios"

const ViewUrlComponent= () => {
    const [urls, setUrls] = useState([]);

    useEffect(() => {
      const fetchUrlAndSetUrl = async () => {
        const result = await axios.get("http://localhost:3333/all");
        setUrls(result.data);
      };
      fetchUrlAndSetUrl();
    }, [urls]);

  return (
    <div>
      <table className="table">
        <thead className="table-dark">
          <tr>
            <th>Original Url</th>
            <th>Short Url</th>
            <th>Click Count</th>
          </tr>
        </thead>
        <tbody>
          {urls.map((url, idx) => (
            <tr key={idx}>
              <td>{url.origUrl}</td>
              <td>
                <a href={`${url.shortUrl}`}>{url.shortUrl}</a>
              </td>
              <td>{url.clicks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ViewUrlComponent;
```

The axios dependency is used in the `ViewUrlComponent` to make a `GET` request to our `urlbackend` server to fetch all saved URLs data.

Using the react `useState` hook to store our fetched data and then display it in a table.

We also used React `useEffect` hook to automatically reload our page view when the url state changed.

In the `src/App.js` file add the following code snippet:

```javascript
import "bootstrap/dist/css/bootstrap.min.css";
import AddUrlComponent from "./components/AddUrlComponent";
import ViewUrlComponent from "./components/ViewUrlCommpnent";

function App() {
  return (
    <div className="App container mt-5">
      <AddUrlComponent />
      <ViewUrlComponent />
    </div>
  );
}

export default App;
```
In the code above, we simply included the AddUrlComponent and ViewUrlComponent components in the App component.

## Start React Application
This is the final but most important step in successfully launching our MERN stack application. First ensure that the node server is up and listening on PORT: 3333

Finally, run this command to start the react app.
```
npm start
```
Your application should run on port 3000 and look exactly like this:
{{% image alt="mern stack project url shortener application" src="images/posts/designing-a-aws-cdk-project/mern-stack-structure.png" %}}

# Conclusion
In this tutorial, we explored how to build a URL shortening service API from scratch. And we integrated it with a React frontend. Building a MERN stack URL shortener service. I hope you enjoyed reading this article and learned something new. The complete source code can be found [here](https://github.com/thombergs/code-examples/tree/master/nodejs/url-shortener).