---
 authors: [pratikdas]
 title: "Organizing Code in Node.js Application"
 categories: ["Node"]
 date: 2023-05-07 00:00:00 +1100
 excerpt: "Node.js is a popular server-side runtime engine based on JavaScript used to build and run web applications. Organizing our source code right from the start is a crucial initial step for building large applications. Otherwise, the code soon becomes unwieldy and very hard to maintain. Node.js does not have any prescriptive framework for organizing code. So let us look at some commonly used patterns of organizing code in a Node.js application. "
 image: images/stock/0117-queue-1200x628-branded.jpg
 url: organize-code-with-nodejs
---
Node.js is a popular server-side runtime engine based on JavaScript to build and run web applications. Organizing our source code right from the start is a crucial initial step for building large applications. 

Otherwise, the code soon becomes unwieldy and very hard to maintain. Node.js does not have any prescriptive framework for organizing code. So let us look at some commonly used patterns of organizing the source code in a Node.js application. 

## Leveraging Node.js Modules as the Unit of Organizing Code
Modules are the fundamental construct for organizing code in Node.js. A module in Node.js is a standalone set of potentially reusable functions and variables. They are imported by other applications or modules which need to use the functions defined in the imported modules. 

This approach makes it easier to reuse code and maintain consistency across our application. We should use the principle of DRY when defining modules. Whenever we see a possibility of code reuse we should package them in a module. The module can be scoped to our application or could be made public.

## Exporting Blocks of Reusable Code  
We specify the functions and variables to be exposed by a module using the `module.exports`. 

This is an example of a module: `orderInquiryController.js`:

```js
const getOrderByID = ((req, res) => {
    const orderID = Number(req.params.orderID)
    const order = orders.find(order => order.orderID === orderID)

        if (!order) {
        return res.status(404).send('Order not found')
    }
    res.json(order)
})

const getOrderStatus = ((req, res) => {
    const orderID = Number(req.params.orderID)
    const order = orders.find(order => order.orderID === orderID)

        if (!order) {
        return res.status(404).send('Order not found')
    }
    res.json(order)
})

module.exports = {getOrders,getOrderByID,getOrderStatus}

```    
In this example, we are exporting two functions: `getOrderByID` and `getOrderStatus`. Other applications or modules can use these functions by importing the module as explained in the next section.

## Importing Blocks of Reusable Code  
We can import one or more modules into other modules or applications which want to use the functions defined in those modules. 

Let us import the module created in the previous section in another module: `orderRoutes.js` by using the `require` function:
```js
const express = require('express')
const router = express.Router()


// Import the orderInquiryController module 
const  { 
    getOrders,getOrderByID,getOrderStatus
} = require('../controllers/orderInquiryController.js')

router.get('/', getOrders)
router.get('/:orderId', getOrderByID)
router.post('/:orderId/status', getOrderStatus)
```
In this code snippet, we have imported the module: `orderInquiryController`. We have used a relative path: `../controllers/orderInquiryController.js` to specify the location of the module.

We can also publish modules in a shared module registry, and other applications or modules can use them by installing from the shared module registry using the npm package manager. These installed modules reside in the `node_modules` folder.

## Applying the Principle of Separation of Concerns for Organizing Code
Separation of concerns is a principle of software design used to break down an application into independent units with minimal overlap between the functions of the individual units.
In Node.js, we can separate our code into different files and directories based on their functionality. 

For example, we can keep all our controllers in a `controllers` directory, and all your routes in a `routes` directory. This approach makes it easier to locate specific pieces of logic in a huge codebase thereby making the code readable and maintainable.

This is an example of grouping files and folders using the principle of Separation of Concerns by roles:

```shell
│   ├── app.js
│       ├── controllers
│       │   ├── inquiryController.js
│       │   └── updateController.js
│       ├── dbaccessors
│       │   └── dataAccessor.js
│       ├── models
│       │   └── order.js
│       ├── routes
│       │   └── routes.js
│       └── services
│           └── inquiryService.js
```
As we can see, the controller files: `inquiryController.js` and `updateController.js` are in one folder: `controllers`. Similarly, we have created folders for putting other types of files like `routes`, `models`, `services`, and `dbaccessors`. 

This method of grouping by roles should be used for smaller codebases typically in a granular microservice built around 1 feature or domain. 

For larger codebases with multiple features or domains, we should organize the code by features rather than by roles as explained in the next section.

## Separation of Concerns by Features for Organizing Code 
Some Node.js applications could also be composed of multiple features or domains. For example an ecommerce application could have features: `orders`, `account`, `inventory`, `warehouse`, etc. Each feature will have a set of APIs which we will build by using a distinct set of `controllers` and `routes`. 

For these applications, we should organize the code by features to make it more readable. 

This is an example of organizing the code of a project by features: `accounts` and `orders`.
```shell
│   ├── app.js
│   ├── accounts
│   │   ├── controllers
│   │   │   └── accountController.js
│   │   └── routes
│   │       ├── accountRoutes.js
│   │       ├── catalogRoutes.js
│   └── orders
│       ├── controllers
│       │   ├── orderInquiryController.js
│       │   └── orderUpdateController.js
│       ├── dbaccessors
│       │   └── orderDataAccessor.js
│       ├── models
│       │   └── order.js
│       ├── routes
│       │   └── orderRoutes.js
│       └── services
│           └── orderInquiryService.js
```
Here the files for the features: `accounts` and `orders` are placed under folders named: `accounts` and `orders`. Under each feature, we have organized the files by the roles like `controllers`, and  `routes`.

This type of organization makes it easier to locate the code for a particular feature. For example, if we need to check the request handler for the `orders` API, we can go into the `orders` folder and look for the `controllers` kept in that folder. 

## Using Separate Folders for APIs and Views
The express framework in Node.js allows us to integrate template engines for rendering HTML pages. Whenever we use template engines, it helps to have separate folders for views and APIs:
```shell
│    ├── app.js
│         ├── apis
│    │    ├── accounts
│    │    │   ├── controllers
│    │    │   │   └── AccountController.js
│    │    │   └── routes
│    │    │       ├── AccountRoutes.js
│    │    │       ├── CatalogRoutes.js
│    │    └── orders
│    │   ├── controllers
│    │   │   ├── OrderInquiryController.js
│    │   │   └── OrderUpdateController.js
│    │   ├── dbaccessors
│    │   │   └── OrderDataAccessor.js
│    │   ├── models
│    │   │   └── Order.js
│    │   ├── routes
│    │   │   └── OrderRoutes.js
│    │   └── services
│    │          └── OrderInquiryService.js
│         ├── views
```

## Using Separate Folders Placing Code for Every Supported Version of API
Whenever we are supporting multiple versions of APIs we should have separate folders for the modules of each version. In this example, we have two versions: `v1` and `v2`:
```shell
│    ├── app.js
│         ├── apis
│    │    ├── accounts
│         │    │    ├──v1
│    │    │    │   ├── controllers
│    │    │    │   │  └── AccountController.js
│    │    │    │   └── services
│    │    │    │           └── AccountInquiryService.js
│         │    │    └──v2
│    │    │       ├── controllers
│    │    │       │  └── AccountController.js
│    │    │       └── services
│    │    │               └── AccountInquiryService.js
│    │    └── routes
│         │          └── accountRoutes.js
│    │    └── orders
│    │   ├── controllers
```
The controller and service modules of `version1` are placed under the folder: `v1` and the corresponding modules of `version2` are placed under the folder: `v2`.

## Placing All Configurations in a Config Folder
Configurations help to prevent hard coding and make it easy to set up the system for different environments. 
Files with modules containing configurations should be under a folder: `config` so that it is easy to find and adjust the configuration values in one place.
```shell
│    ├── app.js
│         ├── apis
│    │    ├── accounts
│    │    │   ├── controllers
          .    .
          .    .
│    │    └── orders
│    │   ├── controllers
          .
          .
│         ├── config <- Place all config files under this folder
                 ├── dbconfig.test.js
                 └── dbConfig.dev.js
```

## Separate Helpers Folder for Third-party Integration and Common Reusable Code
We always have code that is common to all features for example integration with third-party APIs from Cloud, database connectivity information, utilities like masking information, etc. 

These modules should be kept in a separate folder: `helpers`:

```shell
│    ├── app.js
│         ├── apis
│    │    ├── accounts
│    │    │   ├── controllers
│    │    │   │ └── AccountController.js 
│    │    │   └── routes
│    │    │     ├── AccountRoutes.js
│         │    │          └── CatalogRoutes.js 
│    │    └── orders
│    │   ├── controllers
│    │   │   ├── OrderInquiryController.js
│    │   │   └── OrderUpdateController.js
│    │   ├── dbaccessors
│    │   │   └── OrderDataAccessor.js
│    │   ├── models
│    │   │   └── Order.js
│    │   ├── routes
│    │   │   └── OrderRoutes.js
│    │   └── services
│    │          └── OrderInquiryService.js
│         ├── helpers  <- Store code reusable across the project here
│         │       ├── awsServices.js
│         │       └── jwtService.js 

```
In this example, we have put the modules for connecting to the AWS cloud and utilities for JWT tokens under the `helpers` folder. If we have too many such files, we can further group them under specialized sub-folders such as `integration`, `authentication`, `signing`, etc.

## Separate Folder for Tests for each Feature
Beyond verifying actual and expected results, tests also provide useful information about how the functions exported by the module can be used by the consuming applications.
For this reason, test files for modules should be kept under the folder for modules as shown in this example:

```shell
│    ├── app.js
│         ├── apis
│    │    ├── accounts
          .
          .
          .
│    │    └── orders
│    │   ├── controllers
          .
          .
          .
│    │   └── orders.spec.js  <- Module specific tests
│         ├── tests  <- Common Tests
│    │    ├── orders
│    │    │   │   └── order_placement.spec.js
│    │    ├── accounts
│    │    │   │   └── account_open.spec.js
│
```
In this project, the test file for the modules under the `orders` folder is kept in the same folder. Additional test files are kept in a separate test folder.

## Grouping All Shell Scripts in Separate Folder for Scripts
We often use scripts for configuring the run time environment and dependent systems. Examples of configuration scripts are database initialization scripts, setting up values of environment variables, etc. All such these scripts should be in a separate folder: `scripts`


```shell
│    ├── app.js
│         ├── apis
│    │    ├── accounts
│    │    │   ├── controllers
│    │    │   │       └── accountController.js
│    │    │   ├── routes
          .
          .
          .

│         ├── scripts  <- All the scripts are kept here
│    │ ├── setup_server.js
│    │ └── setup_db.js
│        
```
In this folder structure, we have stored the scripts for setting up the server: `setup_server.js` and database: `setup_db.js` under the folder: `scripts`.

## Enforcing Code Quality with Linters
A linter is a tool that analyzes our code and checks for syntax errors, coding style, and other issues. A linter helps to maintain consistent code quality across our entire codebase. Some popular linters for Node.js are ESLint and JSHint.

## Periodic Reorganizing of Code
We should revisit the organization of code periodically because the assumptions and demands on the codebase keep changing as an application evolves to fulfill business needs.
Some examples of these changes are the introduction of new features requiring the use of a new flavor of a database, and integration with external APIs.

## Using a Consistent Naming Convention 
Apart from the rules around organizing code, we should also use a consistent naming convention for our files, folders, and functions. Consistent naming helps to increase the readability of our code. We can use a variety of naming conventions, like camelCase, PascalCase, and snake_case. However,  irrespective of our choice,  we should ensure that the naming is consistent across our entire codebase.

## Conclusion
Organizing code in a Node.js application is crucial for improving the readability, maintainability, and extendability of our code. 
Here are the main techniques for code organization: 
1. Modules are the fundamental unit of organizing code in Node.js.
2. Modules are imported by other applications or modules which need to use the functions defined in the imported modules. 
3. We apply the principle of Separation of Concerns for Organizing Code.
4. For small projects like granular microservices built around 1 feature or domain, we should organize by roles like `controllers`, `routes`, etc. For bigger projects with multiple features or domains, we should organize by features and then by roles.
5. Whenever we are supporting multiple versions of APIs we should have separate folders for the modules of each version.
6. Files with modules containing configurations should be under a folder: `config` so that it is easy to find and adjust the configuration values in one place.
7. Whenever we use template engines, it helps to have separate folders for views and APIs
8. We should revisit the organization of code periodically because the assumptions and demands on the codebase keep changing as an application evolves to fulfill business needs.
9. We should also use a consistent naming convention for our files, folders, and functions. Consistent naming helps to increase the readability of our code.
