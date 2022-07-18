---
authors: [pratikdas]
title: "Getting Started with Amazon Step Functions"
categories: ["AWS"]
date: 2022-02-10 00:00:00 +1100
excerpt: "Amazon Simple Queue Service (SQS) is a fully managed message queuing service. We can send, store, and receive messages at any volume, without losing messages or requiring other systems to be available. In this article, we will introduce Amazon SQS, understand its core concepts and work through some examples."
image: images/stock/0117-queue-1200x628-branded.jpg
url: getting-started-with-aws-step-functions
---

We often encounter use cases with complex functions in real life. Among the smarter methods of solving complex functions is by breaking the them into several smaller and simpler functions.The simpler functions ideally carry out a single task, a concept called the single responsibility principle (SRP). 

However the individual tasks still need to coordinate among each other. They might execute in sequence or in parallel or a mix of two and exchange their computed results. This act of coordination between these smaller tasks to achieve a single result for the complex function is called orchestration. 

We see the use of orchestration in many problem areas like coordinating between microservices, data processing, or machine learning workflows.

AWS Step Functions is a serverless orchestration service which we can use to perform different kinds of orchestration between individual functions. The smaller functions could be a AWS Lambda and any other AWS service. 


AWS Step Functions is a serverless orchestration service by which we can combine AWS Lambda functions and other AWS services to build complex business applications. We can author the orchestration logic in a declarative style using a JSON based format called the Amazon States Language(ASL). AWS Step functions also provides a powerful graphical console where we can visualize our application’s workflow as a series of steps. 

In this article we will introduce the concepts of AWS Step Functions and understand its working with the help of an example.

{{% github "https://github.com/thombergs/code-examples/tree/master/aws/step-functions" %}}

## Introducing The Example: Checkout Process
Let us take an example of a checkout process in an application. This checkout process will typically consist of the following steps:

|Function|Input|Output|Description|
|-|-|-|-|
|`fetchCustomer`|customer ID|Customer Data: email, mobile|Fetching Customer information|
|`fetchPrice`|cart items|Price of each item|Fetching Price of cart items|
|`processPayment`|cart items|Price of each item|Fetching Price of cart items|
|`updateInventory`|cart items|`success/failure`|Fetching Price of cart items|
|`notifyCustomer`|customer email,mobile|`success/failure`|Notify customer|

We can execute `fetchCustomer` and `fetchPrice` in parallel. Once these two are complete, we will execute `processPayment`. If it fails, we end the process with an error. If it succeeds, we update the inventory and also notify the customer. Bith these functions can execute asynchronously in parallel and retry on failures.

We will use AWS Step Function to represent this orchestration in the next section.


## Introducing the State Machine Implemented by Step Functions
A state machine is a mathematical model of computation consisting of different states connected with transitions. AWS Step functions also implement a State Machine to represent the orchestration logic. Each step of the orchestration is represented by a state. 

We can use a state machine to represent our checkout process. We define a State machine in JSON format in a structure known as the Amazon States Language (ASL) as shown below:

```json
{
  "StartAt": "state1",
  "States": {
    "state1": {...},
    "state2": {...},
    "state3": {...}
  }
}
```
This structure represents collection of `3` state objects with names: `state1`, `state2`, `state3`. The state machine starts execution from the state named `state1`. 

The state object represents a task for execution. It contains the following atributes:
`Type`: A state can be of type: `Task`
`Resource` : ARN of the resource to be executed
`Next` : Name of the next state which should be executed after the current state finishes execution

This way the state machine executes one state after another till it has no more states to execute.

Each state takes an input and generates an output. The output of a state is fed as the input of the next state. We also have mechanisms for transforming the inputs and the outputs with JSONpath expressions. We will understand these concepts further by implementing the checkout process with a state machine. 

## Input for the Checkout Process
The checkout process will take the checkout request as input in the following JSON format:

```json
{
    "checkout_request": {
        "customer_id" : "C6238485",
        "cart_items": [
            {
                "item_no": "I1234",
                "shipping_date": "",
                "shipping_address": "address_1"
            },
            {
                "item_no": "I1235",
                "shipping_date": "",
                "shipping_address": "address_2"
            },
            {
                "item_no": "I1236",
                "shipping_date": "",
                "shipping_address": "address_3"
            }
        ]
    }
}
```
The input `checkout_request` consists of a cusomer identifier: `customer_id` and items in `cart_items`.

## Creating the Lambda Functions for Invoking from the State Machine
We will add the first step to the state machine for fetching customer. We will use a AWS lambda function to fetch the customer data which looks like the following:

```js
exports.handler = async (event, context, callback) => {
    console,log(`input: ${event.customer_id}`)
    // TODO fetch from database
    callback(null,
                {
                    customer_id: event.customer_id, 
                    customer_name: "pratik", 
                    payment_pref: "Credit Card",
                    email: "pratikd@yahoo.com", 
                    mobile: "677896678"
                }
            )
};

```
This lambda takes `customer_id` as input and returns a customer record corresponding to the `customer_id`. Since the lambda function is not the focus of this post, we are returning a hardcoded value of customer data instead of fetching it from the database.

Similarly our lambda function for fetching price looks like this:

```js
exports.handler = async (event, context, callback) => {
    const item_no = event.item_no
    console.log(`item::: ${item_no}`)
   
   // TODO fetch price from database
    const price = {item_no: item_no, price: "123.45", lastUpdated: "2022-06-12"}
    callback(null, price)
}

```
This lambda takes `item_no` as input and returns a pricing record corresponding to the `item_no`. 

## Defining the Checkout Process with a State Machine
After an understanding of the basic structure of a state machine, let us now use it to define our Checkout Process. Each step of the Checkout Process will be a state.

Let us create the state machine from the AWS management console. We can either choose to use the visual workflow editor or ASL. 
{{% image alt="checkout process" src="images/posts/aws-step-function/basic-workflow.png" %}}

We have given a name and a description and used the defaut type: `standard`.

Let us now add the steps for fetching the customer and fetching the price to the state machine. These two processes are not dependent on each other. So we can call them in parallel. Our state machine with these two steps looks like this in the visual editor:

{{% image alt="checkout process with 2 steps" src="images/posts/aws-step-function/2-steps.png" %}}

As we can see in this visual, the state machine consists of 2 states: `fetch customer` and `fetch price`. The `fetch price` state is called from a `Map` state which iterates to fetch price for different items in the cart.

We will use the visual editor and used the lambda invoker from the `action` toolbox.
The lambda function needs an input in the form `"customer_id" : "343434"`. For this we need to prepare our input before calling the lambda function. We do this using `inputPath` and `parameters`. InputPath takes JSONPath attribute to extract parts of the in

We have given a name to the state

checkout process will have the following states:
 1. `fetchCustomer`: This will be a state of type `Task` which will fetch customer record from a database. 


After `state1` finishes execution,the state machine moves to the next state. A state object consists of the fields: `Type`, `Resource`, `Next`, and `Comment`.

```json
{
  "StartAt": "fetchCustomer",
  "States": {
    "fetchCustomer": {...},
    "fetchPrice": {...},
    "processPayment": {...}
  }
}
```
## Adding the Input and Output
A state object consists of the fields: `Type`, `Resource`, `Next`, and `Comment`.

```json
{
  "StartAt": "fetchCustomer",
  "States": {
    "fetchCustomer": {
        "Type" : "Task",
        "Resource" : "",
        "Next" : "",
        "Comment" : ""
    },
    "fetchPrice": {...},
    "processPayment": {...}
  }
}
```

A state machine is composed of different types of states:


We can compose it visually or using text in JSON format known as ASL. 

A state machine in AWS Step Function consists of two types of constructs:
1. Actions
2. Flows



We have a start and end.

## Managing the Inputs and Outputs
The same checkout process when developed using the Step function service looks like this: 


We can see a visual representation of the checkout process with multiple steps. Let us understand some of the key elements of this representation:

### Inputs
customerID
shopping cart
  items:[
    item_ID
    shipping_address
    delivery_date
    item_price
  ]

### Outputs
order_ID
shippable_items: [
   items:[]
   shipping_address
   delivery_date
   delivery_status
]
invoice_url

  

### State

fetchCustomer
InputPath: $.checkout_request.customer_id
State input after InputPath: 
ResultSelector: {
    "customer_email.$": "$.Payload.customer.email"
  }
ResultPath: $.checkout_request.customer_email
OutputPath: $.checkout_request
Selected output after OutputPath:
```json
{
  "customer_id": "C6238485",
  "cart_items": [
    {
      "item_no": "I1234",
      "shipping_date": "",
      "shipping_address": "address_1"
    },
    {
      "item_no": "I1235",
      "shipping_date": "",
      "shipping_address": "address_2"
    },
    {
      "item_no": "I1236",
      "shipping_date": "",
      "shipping_address": "address_3"
    }
  ],
  "customer_email": {
    "customer_email": "tyyuu@gggg.com"
  }
}
```


## Handling Errors in Step Function Workflows



## Step Function States and Amazon States Language



## Types of Step Functions
Step Functions are of two types:

Standard Workflow
Express Workflow

## Conclusion

Here is a list of the major points for a quick reference:




You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/sqs).



