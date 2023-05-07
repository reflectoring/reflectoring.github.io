---
 authors: [pratikdas]
 title: "Organizing Code in Node.js Application"
 categories: ["Node"]
 date: 2023-05-07 00:00:00 +1100
 excerpt: "Node.js is a popular server side runtime engine based on JavaScript that is used to build and run web applications. When we build large applications with Node.js, it becomes very important to organize our source code right from the start. Otherwise the code soon becomes unweildy and very hard to maintain. Node.js does not have any prescriptive framework for organizing code. So let us look at some commonly used patterns of code organization in a Node.js application. "
 image: images/stock/0117-queue-1200x628-branded.jpg
 url: organize-code-with-nodejs
---
Node.js is a popular server side runtime engine based on JavaScript that is used to build and run web applications. When we build large applications with Node.js, it becomes very important to organize our source code right from the start. Otherwise the code soon becomes unweildy and very hard to maintain. Node.js does not have any prescriptive framework for organizing code. So let us look at some commonly used patterns of code organization in a Node.js application. 

## Leveraging Node.js Modules as the Unit of Organizing Code
Modules are the fundamental construct for organizing code in Node.js. A module in Node.js is a standalone set of potentially reusable functions which can be packaged in a file. Module contain specific functionality that can be imported in othet applications which need this functionality. This approach makes it easier to reuse code and maintain consistency across our application. We should use the principle of DRY when defining modules. Whenever we see a possibility of code reuse we should package them in a module. The module can be scoped to our application or could be made public.

## Exporting and Importing blocks of Reusable Code  
We specify the functions and variables to be exposed by a module using the `module.exports`. We can then import this module in other applications for reusing the functions and variables defined in the module. 

This is an example of a module: `OrderInquiryController.js`:

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
In this example, we are exporting two functions: `getOrderByID` and `getOrderStatus`.

We are importing this module in another module: `OrderRoutes.js` by using the `require` function:
```js
const express = require('express')
const router = express.Router()

const  { 
    getOrders,getOrderByID,getOrderStatus
} = require('../controllers/OrderInquiryController.js')

router.get('/', getOrders)
router.get('/:orderId', getOrderByID)
router.post('/:orderId/status', getOrderStatus)
```

Importing a module using a relative path:
When importing a module in Node.js, we can use a relative path to specify the location of the module. In our example, we have specified the path: `../controllers/OrderInquiryController.js` relative to the  directory of the current module in `OrderRoutes.js` file.

We can also publish modules containing reusable code in a shared module registry and other applications/modules can use them by installing from the module registry using the npm package manager. These installed modules reside in the node_modules folder.


## Applying the Principle of Separation of Concerns for Organizing Code
Separation of concerns is a principle of software design used to break down an application into independent units with minimal overlap between the functions of the individual units.
In Node.js, we can separate our code into different files and directories based on their functionality. For example, we can keep all our controllers in a `controllers` directory, and all your routes in a `routes` directory. This approach makes it easier to locate specific pieces of logic in a huge codebase thereby making the code readable and maintainable.

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
As we can see, the controller files: `OrderInquiryController.js` and `OrderUpdateController.js` are in one folder: `controllers`. Similarly, we have created folders for putting other type of files like `routes` , `models`, `services`, and `dbaccessors`. 

This method of grouping by roles should be used for smaller codebases typically less than 4 features. For more than 4 features we should organize by features rather than by roles as explained in the next section.

## Separation of Concerns by Features for Organizing Code 
For large codebases we should organize by features. This is also the recommended style if we are unsure about the number of features to be added in future.
Organizing Files Around Features, Not Roles
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
## Using a Consistent Naming Convention
Using a consistent naming convention for our files, directories, and functions is essential for improving the readability of our code. You can use a variety of naming conventions, including camelCase, PascalCase, and snake_case. Whatever naming convention you choose, make sure it's consistent across your entire codebase.

## Avoiding Global Variables
Global variables create unwanted dependencies and make our code difficult to test and maintain. Instead, using modules to encapsulate our code and keep our variables local to the module.

## Leveraging Third-party Modules for Common Tasks
Node.js has a vast ecosystem of third-party modules that can help you reduce the amount of code you need to write. You can use modules for tasks such as handling HTTP requests, connecting to databases, and logging. However, make sure you choose modules from reputable sources and maintain them regularly.

## Enforcing Code Organization with Linters
A linter is a tool that analyzes our code and checks for syntax errors, coding style, and other issues. Using a linter can help you maintain consistent code quality across your entire codebase. Some popular linters for Node.js include ESLint and JSHint.

## Use comments
Comments can help us to explain our code and make it easier to understand for developers other than us and even for ourselves if we are seeing it after a log duration. Use comments sparingly and only where necessary. Avoid adding comments that merely repeat what the code is doing.

## Separate Folder for APIs and Views
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
## Separate Folder for Config

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
│         ├── config
```

## Separate Folder for Helpers and other Middlewares

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
│         ├── middlewares
```

## Separate Folder for Tests for each Feature

```shell
│    ├── app.js
│         ├── apis
│    │    ├── accounts
│    │    │   ├── controllers
│    │    │   │       └── accountController.js
│    │    │   ├── routes
│    │    │   │  └── accountRoutes.js
│    │    │   └── services
│    │    │      └── accountInquiryService.js
│    │    └── orders
│    │   ├── controllers
│    │   │ ├── orderInquiryController.js
│    │   │ └── orderUpdateController.js
│    │   ├── dbaccessors
│    │   │ └── orderDataAccessor.js
│    │   ├── routes
│    │   │ └── orderRoutes.js
│    │   └── services
│    │          └── orderInquiryService.js
│         ├── tests
│    │    ├── orders
│    │    │   ├── services
│    │    │   │ └── orderInquiryServiceTests.js
│    │    ├── accounts
│    │    │   ├── services
│    │    │   │ └── accountInquiryServiceTests.js
```


## Separate Folder for Scripts and Environment Variables

```shell
│    ├── app.js
│         ├── apis
│    │    ├── accounts
│    │    │   ├── controllers
│    │    │   │       └── accountController.js
│    │    │   ├── routes
│    │    │   │  └── accountRoutes.js
│    │    │   └── services
│    │    │      └── accountInquiryService.js
│    │    └── orders
│    │   ├── controllers
│    │   │ ├── orderInquiryController.js
│    │   │ └── orderUpdateController.js
│    │   ├── dbaccessors
│    │   │ └── orderDataAccessor.js
│    │   ├── routes
│    │   │ └── orderRoutes.js
│    │   └── services
│    │          └── orderInquiryService.js
│         ├── tests
│    │    ├── orders
│    │    │   ├── services
│    │    │   │ └── orderInquiryServiceTests.js
│    │    ├── accounts
│    │    │   ├── services
│    │    │   │ └── accountInquiryServiceTests.js
│         ├── scripts
│         ├── env
```

## Continuous Reorganizing


## Conclusion
Organizing code in a Node.js application is crucial for improving the readability, maintainability, and extendability of our code. By using a modular structure, separating concerns, using a consistent naming convention, avoiding global variables, using third-party modules, using a linter, and adding comments, we can create a well-structured and maintainable codebase.