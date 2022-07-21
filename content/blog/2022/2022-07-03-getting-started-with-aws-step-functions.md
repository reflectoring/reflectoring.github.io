---
authors: [pratikdas]
title: "Getting Started with Amazon Step Functions"
categories: ["AWS"]
date: 2022-02-10 00:00:00 +1100
excerpt: "Amazon Simple Queue Service (SQS) is a fully managed message queuing service. We can send, store, and receive messages at any volume, without losing messages or requiring other systems to be available. In this article, we will introduce Amazon SQS, understand its core concepts and work through some examples."
image: images/stock/0117-queue-1200x628-branded.jpg
url: getting-started-with-aws-step-functions
---

AWS Step Functions is a serverless orchestration service by which we can combine AWS Lambda functions and other AWS services to build complex business applications. We can author the orchestration logic in a declarative style using a JSON-based format called the Amazon States Language(ASL). AWS Step functions also provide a powerful graphical console where we can visualize our application’s workflow as a series of steps.

In this article, we will introduce the concepts of AWS Step Functions and understand its working with the help of an example.

{{% github "https://github.com/thombergs/code-examples/tree/master/aws/step-functions" %}}

## Step Functions: Basic Concepts

### State Machine, State, and Transitions
A state machine is a mathematical model of computation consisting of different states connected with transitions. AWS Step functions also implement a State Machine to represent the orchestration logic. Each step of the orchestration is represented by a state in the state machine and connected to one or more states through transitions.

### Amazon State Language (ASL)
We define a State machine in JSON format in a structure known as the Amazon States Language (ASL) as shown below:

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
This structure represents a collection of `3` state objects with the names: `state1`, `state2`, and `state3`. The state machine starts execution from the state named `state1`. 

### Types of State Machine: Standard vs Express
We can create two types of state machine. State machine executions differ based on the type. The type of state machine cannot be changed after the state machine is created.
1. **Standard**: These are ideal for long-running, durable, and auditable workflows
2. **Express**: ideal for high-volume, event-processing workloads such as IoT data ingestion, streaming data processing and transformation, and mobile application backends. They can run for up to five minutes.

### State
States receive input, perform actions to produce some output, and pass the output to other states. States are of different types which determine the nature of the functions a state can perform. Some of the commonly used types are:
1. **Task**: A state of type `task` represents a single unit of work performed by a state machine. All the work in a state machine is performed by tasks. The work is performed by using an activity or an AWS Lambda function, or by passing parameters to the API actions of other services.
2. **Parallel**: Begin parallel branches of execution 
3. **Map**: Dynamically iterate steps
4. **Choice**: Make a choice between branches of execution
5. **Fail or Succeed**: Stop execution with a failure or success

The state object represents a task for execution.  It contains the following attributes:
`Type`: A state can be of type: `Task`
`Resource`: ARN of the resource to be executed
`Next`: Name of the next state which should be executed after the current state finishes execution

This way the state machine executes one state after another till it has no more states to execute.

Each state takes an input and generates an output. The output of a state is fed as the input of the next state. We also have mechanisms for transforming the inputs and the outputs with JSONpath expressions. We will understand these concepts further by implementing a sample `checkout` process of an e-commerce application with a state machine. 

## Introducing The Example: Checkout Process
Let us take an example of a `checkout` process in an application. This `checkout` process will typically consist of the following steps:

|Function|Input|Output|Description|
|-|-|-|-|
|`fetch customer`|customer ID|Customer Data: email, mobile|Fetching Customer information|
|`fetch price`|cart items|Price of each item|Fetching Price of each item in the cart|
|`process payment`|payment type, cart items|Price of each item|Fetching Price of cart items|
|`create order`|cstomer ID, cart items with price|`success/failure`|Create order if payment is successful|
|`notifyCustomer`|customer email,mobile|`success/failure`|Notify customer|

When we design the order in which to execute these steps, we need to consider which steps can execute in parallel and which ones are in sequence. 

We can execute the steps for `fetch customer` and `fetch price` in parallel. Once these two steps are complete, we will execute the step for `process payment`. If the payment fails, we will end the checkout process with an error. If the payment succeeds, we will create an order for the customer. The step for `process payment` can be retried a specific number of times on failures.

We will use AWS Step Function to represent this orchestration in the next section.

## Creating the Lambda Functions for Invoking from the State Machine
Let us define skeletal Lambda functions for each of the steps of the `checkout` process. Our Lambda function to fetch the customer data looks like the following:

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

Similarly, our Lambda function for fetching price looks like this:

```js
exports.handler = async (event, context, callback) => {
    const item_no = event.item_no
    console.log(`item::: ${item_no}`)
   
   // TODO fetch price from database
    const price = {item_no: item_no, price: "123.45", lastUpdated: "2022-06-12"}
    callback(null, price)
}

```
This Lambda takes `item_no` as input and returns a pricing record corresponding to the `item_no`. 

We will use similar Lambda functions for the other steps of the `checkout` process. All of them will have skeletal code similar to the `fetch customer` and `fetch price`.

## Defining the Checkout Process with a State Machine
After defining the Lambda functions and getting an understanding of the basic concepts of the Step Function service, let us now define our `checkout` Process. 

Let us create the state machine from the AWS management console. We can either choose to use the visual workflow editor or ASL for defining our state machine. 
{{% image alt="checkout process" src="images/posts/aws-step-function/create_state_machine.png" %}}

We have selected the type of state machine as `standard` in the first step. In the second step, we have added an empty `pass` state to the state machine. In the last step, we have given the name: `checkout` to our state machine and added an IAM role that defines which resources our state machine has permission to access during execution. Our role definition is associated with the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```
This policy will allow the state machine to invoke any Lambda function. We will next add the steps of the `checkout` process in the state machine.

## Adding the States in the State Machine
Each step of the `checkout` process will be a state in the state machine. 

Let us add the steps of the `checkout` process as different states in the state machine. We will define these states as of type `task` and will call the API: `Lambda: Invoke `. 

The configuration of the state for the `fetch customer` step looks like this in the visual editor:

{{% image alt="State definition" src="images/posts/aws-step-function/state-defn.png" %}}

As we can see we have specified the name of the state as `fetch customer`,  defined the API as `Lambda:invoke`, and selected the integration type as `Optimized`. We have provided the ARN of the Lambda function as the API parameter. The corresponding definition of the state in Amazon States Language (ASL) looks like this:

```json
{
  "Comment": "state machine for checkout process",
  "StartAt": "fetch customer",
  "States": {
    "fetch customer": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "OutputPath": "$.Payload",
      "Parameters": {
        "Payload.$": "$",
        "FunctionName": "arn:aws:lambda:us-east-1:926501103602:function:fetchCustomer:$LATEST"
      },
      "End": true
    }
  }
}
```
We will add the other steps with similar configurations for invoking the corresponding Lambda functions. 

The first two steps: `fetch customer` and `fetch price` are not dependent on each other. So we can call them in parallel. Our state machine after adding these two steps looks like this in the visual editor:

{{% image alt="checkout process with 2 steps" src="images/posts/aws-step-function/2-steps.png" %}}

As we can see in this visual, our state machine consists of `2` states: `fetch customer` and `fetch price`. We have defined these steps as `2` branches of a state of type `parallel` which allows the state machine to execute them in parallel. 

We have put the `fetch price` state as a child state of a `map` state. The `map` state allows the state machine to iterate over each item in the cart to fetch their price by executing the task state: `fetch price`. We have next added a state of type: `pass` after the parallel step. 

The `pass` type state acts as a placeholder where we will manipulate the output from the parallel state. 

Let us add two more steps for processing payment and placing an order if the payment succeeds. Here is our state machine in the visual editor after adding these two steps:

{{% image alt="checkout process with all steps" src="images/posts/aws-step-function/workflow-full.png" %}}

We have also added a state of type `choice` with `2` branches. Each branch has a rule. The branch will execute only if the result of the rule evaluation is true.  


## Processing Inputs and Outputs in a State Machine
The input to a Step Functions is sent in JSON format which is then passed to the first state in the state machine. Each state in the state machine receives JSON data as input and usually generates JSON as output to be passed to the next state. We can associate different kinds of filters to manipulate data in each state both before and after the task processing.

### Input Filters: InputPath and Parameters 
We use the InputPath and Parameters fields to manipulate the data before task processing: 

1. InputPath takes a JSONPath attribute to extract only the parts of the input which is required by the state.
2. Parameters: Parameters field enables us to pass a collection of key-value pairs, where the values are either static values that we define in our state machine definition, or that are selected from the input using a path.

### Output Filters: OutputPath, ResultSelector, and ResultPath 
We can further manipulate the results of the state execution using the following fields :
1. ResultSelector: This field filters the task result to construct a new JSON object using selected elements of the task result.
2. The ResultPath filter lets you add the task result into the original state input. Use ResultPath if you need a state to output both its input and its result.
3. OutputPath filter to select a portion of the effective state output to pass to the next state. It is often used with Task states to filter the result of an API response

todo: add diagram...
Let us add these as this information flows from one state to the next state. 


## Processing Outputs with OutputPath, ResultSelector, and ResultPath 
We can further manipulate the results of the state execution using the following fields :
1. ResultSelector: This field filters the task result to construct a new JSON object using selected elements of the task result.
2. The ResultPath filter lets you add the task result into the original state input. Use ResultPath if you need a state to output both its input and its result.
3. OutputPath filter to select a portion of the effective state output to pass to the next state. It is often used with Task states to filter the result of an API response

To see their usage let us add two more steps for processing payment and placing an order if the payment succeeds. Here is our state machine in the visual editor after adding these two steps:

{{% image alt="checkout process with all steps" src="images/posts/aws-step-function/workflow-full.png" %}}

We have also added a `choice` type task to fail the execution if the payment processing fails.

Let us apply the transformations:

First, we transform the output of the parallel state in the `pass` state by applying the following `parameter` field:

```json
{
  "customer.$": "$[0]",
  "items.$": "$[1]"
}
```
In this parameters filter, We are assigning the first element of the array to a tag named `customer` and a second element of the array to a tag named `items`. The tags are appended `.$` to reference a node in the state's JSON input. For example "key2.$": "$.inputValue"). 
The parameters filter set in the visual editor looks like this:
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
Our state machine with the input and output filters is shown in the diagram:
{{% image alt="checkout process with all steps" src="images/posts/aws-step-function/sm_with_data.png" %}}

## Data Transformations through the Checkout Process State Machine
Let us look at how our input data changes by applying input and output filters as we transition through each state. 

Input to State Machine:
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
This is the input to our checkout process which is composed of a `customer_id` and an array of items in the shopping cart.

1. State: `Parallel`

State: fetch customer
Input: Same input as state machine
Data after filtering with InputPath: `$.checkout_request.customer_id`
`C6238485`
Data after applying parameter filter: `{"customer_id.$": "$"}`
```json
{"customer_id" : "C6238485"}
```
2. State: iterate
Input: Same input as state machine
Data after filtering with InputPath: `$.checkout_request.cart_items`
`[
            {
                "item_no": "I1234",
                ...
            },
            {
                "item_no": "I1235",
                ..
            },
            {
                "item_no": "I1236",
                ..
            }
]`

3. State: fetch price (for each element of the array: `cart_items`)
Input: Each element of the array: `cart_items`
Data after applying parameter filter: `{"item_no.$": "$.item_no"}`
```json
{"item_no" : "I1234"}
```

4. State: Pass

5. State: `process payment`

6. State: `payment success?`

7. State: `create order`

8. Output of state machine

## Handling Errors in Step Function Workflows
Let us understand some of the ways we handle errors in Step functions: 

When a state reports an error, the state machine execution fails by default.
States of type `task`, `parallel`, and `map` provide fields for configuring error handling:
{{% image alt="Error handling" src="images/posts/aws-step-function/error-handling.png" %}}
We can handle errors by retrying the operation or by a fallback to another state.

### Retrying on Error
We can retry a task when errors occur by specifying one or more retry rules, called "retriers".
{{% image alt="Error handling Retry" src="images/posts/aws-step-function/retry-error.png" %}}
Here we have defined a `retrier` for `3` types of errors: `Lambda.ServiceException`, `Lambda.AWSLambdaException`, and `Lambda.SdkClientException` with the following retry settings:
* **Interval**: The number of seconds before the first retry attempt. It can take values from `1` which is default to `99999999`.
* **Max Attempts**: The maximum number of retry attempts. The task will not be retried after the number of retries exceeds this value. MaxAttempts has a default value of `3` and maximum value of `99999999`.
* **Backoff Rate**: It is the multiplier by which the retry interval increases with each attempt.

### Falling Back to a Different State on Error
We can catch and revert to a fallback state when errors occur by specifying one or more catch rules, called "catchers".
{{% image alt="Error handling Retry" src="images/posts/aws-step-function/catch-error.png" %}}
In this example, we are defining a `prepare error` state to which the `process payment` state can fall back if it encounters an error of type: `States.TaskFailed`.

The state machine with a `catcher` defined for the `process payment` step looks like this in the visual editor.
{{% image alt="Error handling catcher in workflow" src="images/posts/aws-step-function/workflow-with-catch.png" %}}

### Handling Lambda Service Exceptions
As a best practice, we should proactively handle transient service errors in AWS Lambda functions that result in a `500` error, such as `ServiceException`, `AWSLambdaException`, or `SdkClientException`. We can handle these exceptions by retrying the Lambda function invocation, or by catching the error.

## Integration with AWS Services
When we configure a state of type `task` we need to specify an integration type:

{{% image alt="Error handling catcher in workflow" src="images/posts/aws-step-function/integration-type.png" %}}

We can integrate Step Function with AWS services through two types of service integrations: 

### Optimized Integrations
When we are calling an AWS service with optimized integration, Step Functions provide some additional functionality when the service API is called. For example, the invocation of the Lambda service converts its output from an escaped JSON string to a JSON object similar to the format:
```json
{
  "ExecutedVersion": "$LATEST",
  "Payload": {
    ...
  },
  "SdkHttpMetadata": {
    ...
  },
  "SdkResponseMetadata": {
    "RequestId": "ac79dacd-7c6f-41c7-bfcf-eea70b43e141"
  },
  "StatusCode": 200
}
```
We had used optimized integration for invoking our Lambda functions in the state machine of the `checkout` process.
### AWS SDK Integrations
AWS SDK integrations allow us to make a standard API call on an AWS service from the state machine. When we use AWS SDK integrations, we specify the service name and API call with optionally, a service integration pattern (explained in the next section). The syntax for specifying the AWS service looks like this:
`arn:aws:states:::aws-sdk:serviceName:apiAction.[serviceIntegrationPattern]`

### Integration Patterns
Step functions integrate with AWS services using three types of service integration patterns. The service integration pattern is specified by appending a suffix in the Resource URL in the task configuration.

* **Request Response**: When we specify a service in the "Resource" string of your task state, and you only provide the resource, Step Functions will wait for an HTTP response and then progress to the next state. Step Functions will not wait for a job to complete.

Call service and let Step Functions progress to the next state immediately after it gets an HTTP response.

* **Running a Job**: Step Functions wait for a request to complete before progressing to the next state. specify the "Resource" field in your task state definition with the .sync suffix appended after the resource URI.

* **Waiting for a Callback with a Task Token**: A task might need to wait for various reasons like seeking human approval, integrating with a third-party workflow, or calling legacy systems. In these situations, we can pause Step Functions indefinitely, and wait for an external process or workflow to complete. We pass a task token to the AWS SDK service integrations, and also to some Optimized integrations integrated services during service invocation. The task will pause until it receives that task token back with a `SendTaskSuccess` or `SendTaskFailure` call.


## Conclusion

Here is a list of the major points for a quick reference:




You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/aws/sqs).



