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



## Creating the Lambda Functions for Invoking from the State Machine
We will add the first step to the state machine for fetching customer. We will use a AWS lambda function to fetch the customer data which looks like the following:

```js
exports.handler = async (event, context, callback) => {
    console,log(`input: ${event.customer_id}`)
    // TODO fetch from database
    callback(null,
                {
                    customer_id: event.customer_id, 
                    customer_name: "John Doe", 
                    payment_pref: "Credit Card",
                    email: "john.doe@yahoo.com", 
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
After defining the lambda functions and getting an understanding of the basic structure of a state machine, let us now define our Checkout Process. 

Let us create the state machine from the AWS management console. We can either choose to use the visual workflow editor or ASL for defining our state machine. 
{{% image alt="checkout process" src="images/posts/aws-step-function/basic-workflow.png" %}}

We have given a name and a description and used the defaut type: `standard`.

Each step of the Checkout Process will be a state in the state machine.
Let us now add the steps for fetching the customer and fetching the price to the state machine. These two processes are not dependent on each other. So we can call them in parallel. Our state machine with these two steps looks like this in the visual editor:

{{% image alt="checkout process with 2 steps" src="images/posts/aws-step-function/2-steps.png" %}}

As we can see in this visual, our state machine consists of 2 states: `fetch customer` and `fetch price`. These are defined as 2 branches of a state of type `parallel` which makes them execute in parallel. 

The `fetch price` state is called from a `Map` state which iterates over each item in the cart to fetch their price. We have added a `pass` state of type : `pass` after the parallel step. 

The `pass` type state acts as a placeholder and we can manipulate the output from the parallel state. 

We also have a start and end.


## Processing Inputs with InputPath and Parameters 
The input to a Step Functions is sent in JSON format which is then passed to the first state in the state machine. Each state in the state machine receives JSON data as input and usually generate JSON as output to be passed to the next state. 

We filter and manipulate this data through using JSONPath expressions through the following stages:

1. InputPath takes JSONPath attribute to extract only the parts of the input which is required by the state.
2. Parameters: Parameters field enables us to pass a collection of key-value pairs, where the values are either static values that we define in our state machine definition, or that are selected from the input using a path.


Let us add these as this information flows from one state to the next state. 

### Input to the State Machine 
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


The lambda function: `fetchcustomer` needs an input in the form `"customer_id" : "343434"`. For this we need to prepare our input before calling the lambda function. We do this using `inputPath` and `parameters`. 
inputPath: `$.checkout_request.customer_id`

```json
{
  "customer_id.$": "$"
}
```

inputPath: `$.checkout_request.cart_items`

```json
{
  "item_no.$": "$.item_no"
}
```

### Output from the State Machine 
Here is the output after executing the state machine.

```json
[
  {
    "customer_id": "C6238485",
    "customer_name": "John Doe",
    "email": "john.doe@yahoo.com",
    "mobile": "677896678"
  },
  [
    {
      "item_no": "I1234",
      "price": "123.45",
      "lastUpdated": "2022-06-12"
    },
    {
      "item_no": "I1235",
      "price": "123.45",
      "lastUpdated": "2022-06-12"
    },
    {
      "item_no": "I1236",
      "price": "123.45",
      "lastUpdated": "2022-06-12"
    }
  ]
]
```
The output of the state machine consists of outputs from the individual branches of the parallel state combined into an array. 
## Processing Outputs with OutputPath, ResultSelector, and ResultPath 
We can further manipulate the results of the state execution using the following fields :
1. ResultSelector: This field filters the task result to construct a new JSON object using selected elements of the task result.
2. The ResultPath filter lets you add the task result into the original state input. Use ResultPath if you need a state to output both its input and it's result.
3. OutputPath filter to select a portion of the effective state output to pass to the next state. It is often used with Task states to filter the result of an API response

To see their usage let us add two more steps for processing payment and placing an order if the payment succeeds. Here is our state machine in the visual editor after adding these two steps:

{{% image alt="checkout process with all steps" src="images/posts/aws-step-function/workflow-full.png" %}}

We have also added a choice type task to fail the execution if the payment processing fails.

Let us apply the transformations:

First we transform the output of the parallel state in the `pass` state by applying the following `parameter` field:

```json
{
  "customer.$": "$[0]",
  "items.$": "$[1]"
}
```
In this parameters filter We are assigning the first element of the array to a tag named `customer` and second element of the array to a tag named `items`. The tags are appended `.$` to reference a node in the state's JSON input. For example "key2.$": "$.inputValue"). 
The parameters fileter set in the visual editor lloks like this:
{{% image alt="parameters filter" src="images/posts/aws-step-function/parameters_filter.png" %}}

This will transform the input data of our `pass` state to:

```json
"customer" : {
    "customer_id": "C6238485",
    "customer_name": "John Doe",
    "email": "john.doe@yahoo.com",
    "mobile": "677896678"
  },
"items" :   [
    {
      "item_no": "I1234",
      "price": "123.45",
      "lastUpdated": "2022-06-12"
    },
    {
      "item_no": "I1235",
      "price": "123.45",
      "lastUpdated": "2022-06-12"
    },
    {
      "item_no": "I1236",
      "price": "123.45",
      "lastUpdated": "2022-06-12"
    }
  ]
```

This is also the output of the `pass` state since we have not set any output filter.

The output of the `pass` state is the input of the next state: `process payment` which also invokes a lambda function: `processPayment`. This lambda function takes an input of the form `{"payment_type" : "", "items" : []}`.

To prepare this input we will set the following parameters filter in the `process payment` state:

```json
{
  "payment_type.$": "$.customer.payment_pref",
  "items.$": "$.items"
}
```
{{% image alt="checkout process with all steps" src="images/posts/aws-step-function/sm_with_data.png" %}}

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



