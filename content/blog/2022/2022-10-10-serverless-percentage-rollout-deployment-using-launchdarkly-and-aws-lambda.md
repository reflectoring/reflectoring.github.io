---
title: "Serverless Percentage Rollout Deployment using LaunchDarkly and AWS Lambda"
categories: ["Node","AWS"]
date: 2022-10-10 00:00:00 +1100 
modified: 2022-10-10 00:00:00 +1100
authors: [arpendu]
excerpt: "This post demonstrates how to deploy an AWS Lambda serverless function to Lambda@Edge and connect LaunchDarkly to get the feature flags."
image: images/stock/0104-on-off-1200x628-branded.jpg
url: nodejs-feature-flag-launchdarkly-aws-lambda-serverless
---

Let me take you back to the days when server rooms included real equipment that was used to host applications. Companies constructed their own data centers back then. The procedure was laborious, challenging, and extremely demanding. Recently, a new era paved the way for running an application in the cloud. We are no longer required to consider the possibility of creating our own data centers.

We could just deploy applications in seconds and spin up servers across several regions in a matter of minutes. Provisioning, scalability, and monitoring of servers remained challenging tasks that we need to handle efficiently.

In the present world, a parallel development in cloud computing has come into limelight, which is termed *serverless*. It is sometimes also called *function-as-a-service(FAAS)*. Server provisioning, monitoring, logging, or managing the underlying infrastructure are not at all required in this mechanism. The overall emphasis is on your business logic, which is then divided into more manageable and specialized functions.

There are servers, hence the term *"serverless"* does not imply their absence. It simply implies that you are relieved of the responsibility of overseeing those servers. *Amazon Web Services* is one of the organizations in charge of looking after these servers, although there are many others in the market.

Since it has been available for a while, *AWS Lambda* continues to be the most well-liked option to test serverless technology. To get familiar with serverless, it's a development approach where the management, provisioning, and scaling of servers is separated from the development of the application. *Function-as-a-Service (FaaS)* products like *AWS Lambda* enable on-demand code execution in response to predefined events or requests.

In this article, we are going to deploy a NodeJS based function on AWS Lambda. We will also define feature flags and try to perform a percentage rollout to deploy our features to selected users or customers. Before we start, let’s quickly understand the various rollout strategies available to be adapted.

{{% github "https://github.com/thombergs/code-examples/tree/master/nodejs/nodejs-aws-lambda-launchdarkly" %}}

## Introduction to Different Rollout Strategies

There are different rollout strategies that can be adapted when we would like to release or publish a feature behind a feature flag:

- **Dark Launch** - Release of new features to a select group of users in order to solicit feedback is known as a *"dark launch"*. It is also called as *"dark release"*. Dark launching, which is similar to a soft launch, can be activated by feature flags to achieve a code deployment that poses less risk. Developers can use this method to see how people react to new features. This guarantees the best release possible. This interaction can be used by developers to decide whether they need to make any changes.
- **Global Rollout** - Organizations deploy their core applications across all of the nations in which they conduct business in global rollout scenarios. However, they frequently encounter a wide range of difficulties such as compliance with the law, peculiarities of the local culture, adoption, and legacy systems in other nations. This helps to rollback the new features after release if they cause any problem with no downtime.
- **Kill Switch** - We can divide release from deployment using kill switches. By encasing a feature in a feature flag, we can easily disable the feature if it creates issues and retest it before making it available to users. We may minimize any negative effects and avoid having to restart our application by simply altering the status of our feature flag. Additionally, if something goes wrong, any member of our team can utilize the kill switch to disable a feature. As a result, non-technical team members can disable a feature without consulting engineers, such as those in product and marketing.
- **Percentage Rollout** or **Canary Launch** - We can roll out new features gradually when we use percentage rollouts. Before making the feature available to a larger audience, it enables us to guarantee a positive user experience. We can choose who has access to a new feature using feature flags. We have the option to gradually roll out a feature to a particular proportion of our users, and we can also choose which consumers it will be rolled out to depending on factors like location, device kind, and more. From there, once a feature is made available to our user base, we can gauge its impact. This strategy is also known as *Canary Launch*.
- **Ring Deployment** - In order to reduce risk, ring deployment is a type of phased rollout in which new features are gradually made available to various user groups. It is called a ring because these user groups are shown as an expanding sequence of rings that start with a small subset of users and eventually include all users. Rings give programmers the ability to assess the effects on those users, often known as the *"blast radius"* through observation, testing, and user input.
- **A/B Test** - We wish to compare the performance of two or more different versions of a feature in an A/B test, often known as a *blue/green* or *red/black* deployment. Technical performance, such as how quickly a system responds, or business performance are both examples of *"performance"* (for example how a feature impacts conversion rate). Whatever the situation, it's evaluated using a metric we establish. We want to present one version of the functionality to one group of customers and another version to a different group of customers in order to compare the performance.

## Percentage Rollout Advantages

In this article, we are going to take a practical approach to understand more about *the Percentage Rollout* strategy, otherwise known as *Canary Deployment*. Some of the advantages of percentage rollout strategies are:

- ***A/B testing:*** We can perform A/B testing using the canary. In other words, we offer two options to the users and assess which is more well-received.
- ***Capacity test*** - Testing the capacity of a large production environment is not possible. There are capacity tests included with canary deployments. As we gradually transition the users to the canary, any performance difficulties we have in our system will start to become apparent.
- ***Feedback*** - We receive priceless suggestions from actual users. We can avoid cold starts because new systems can take some time to boot up. Percentage Rollout deployments gather speed gradually to avoid cold-start lag.
- ***No downtime*** - A percentage rollout deployment doesn't cause downtime, unlike blue-green deployments.
- ***Simple rollback*** - If something goes wrong, we can quickly return to an earlier version.

## Setup AWS for this Project

In this article, we are going to deploy our NodeJS serverless functions as part of AWS Lambda and then we will use LaunchDarkly flags and these Lambda functions to conditionally enable or modify server-side logic. In addition, we will also learn how to deploy this to [CloudFront](https://aws.amazon.com/cloudfront/), Amazon's content delivery network (CDN), as [Lambda@Edge](https://aws.amazon.com/lambda/edge/) so that we can use the flags to conditionally perform actions at the *"edge"*.

Users would be forwarded to a different version of a website using the function that we will write. We are going to route them using targeted users and percentage rollout feature flags in LaunchDarkly. So it is better to do this *"at the edge"* to limit any latency the user might experience during the request. We can intercept the request at the CDN level closest to the user and direct it to a specific version of the site rather than intercepting the request on the server and performing a server-side redirect or sending back a response that executes a client-side redirect. Identifying the user and serving them a flag variation from the edge means faster state changes to feature flags and no disruptions when the flag state changes from the default value to the targeted variation.

To start with, we need the following prerequisites:

- An AWS Account
- A LaunchDarkly Account
- VS Code to write our NodeJS code
- Mechanism to build and deploy this Lambda function

First, we will start by setting up AWS resources. We need the following resources:

- **S3 Bucket** - The static webpage used in this example can be stored and accessed using S3, Amazon's efficient storage option. It would host an index HTML page in the root as well as a /beta folder that contains the same page with the new branding.
- **CloudFront distribution** - We need this to run a Lambda function with *AWS's edge servers (Lambda@Edge)* on their CloudFront CDN.

{{% warning title="Note:" %}} In this article, I am using `eu-central-1` region while creating resources. But someone can choose any region of his/her choice.{{% /warning %}}

### Setting up an S3 Bucket

In order to set the S3 bucket, we need to follow the following steps:

* Search for *"S3"* in the AWS console and click **Create bucket**.

* Give the bucket a human-readable name, choose `EU Central` as the AWS Region, and disable the *"block public access"* option.

* Click **Upload** and then **Add folder**. Upload the `/site` folder containing both the existing site's `index.html` and a `/beta` folder containing the new site from the [source repository](https://github.com/thombergs/code-examples/tree/master/nodejs/nodejs-aws-lambda-launchdarkly). Click *"Upload"* and when the procedure completes, click *"Close"*.

* Select the `site` directory in your bucket. From the Actions menu, select "Make public", click to confirm and click **Close**.

* Click on the *"Properties"* tab for the S3 bucket. Scroll all the way down to *"Static website hosting"*. Click **Edit** and then choose *"Enable"*. Specify `index.html` as your index document and **Save changes**.

### Setting up CloudFront Distribution

Next, we will setup the CloudFront distribution. This is required to deploy the function to Lambda@Edge.

* In the AWS Console, search for *"CloudFront"* and click **Create a CloudFront Distribution**.

* For the *"Origin domain"*, choose the S3 bucket we just created.

* Scroll down and click **Create distribution**.

### Setup using CloudFormation Template

We can also try to setup the above resources in a much easier way using CloudFormation template that I have bundled in the code as well.

* In the AWS console, search for CloudFormation and then click **Create stack**.

* Choose the *"Template is Ready"* option and *"Upload a Template"*. Copy the below template content to the local machine and then select the `CloudFormationTemplate` file . Click **Next**.

  ```json
  {
      "AWSTemplateFormatVersion": "2010-09-09",
      "Description": "A sample template that creates an S3 bucket for website hosting and a CloudFront distribution.",
      "Mappings": {
          "Region2S3WebsiteSuffix": {
              "eu-north-1": {
                  "Suffix": ".s3-website-eu-north-1.amazonaws.com"
              }
          }
      },
      "Resources": {
          "S3BucketForWebsiteContent": {
              "Type": "AWS::S3::Bucket",
              "Properties": {
                  "AccessControl": "PublicRead",
                  "WebsiteConfiguration": {
                      "IndexDocument": "index.html",
                      "ErrorDocument": "error.html"
                  },
                  "PublicAccessBlockConfiguration":{
                      "BlockPublicAcls":false,
                      "IgnorePublicAcls":false,
                      "BlockPublicPolicy":false,
                      "RestrictPublicBuckets":false
                   }
              },
              "Metadata": {
                  "AWS::CloudFormation::Designer": {
                      "id": "d2032587-aa05-4b85-b517-3c67966fa3cd"
                  }
              }
          },
          "WebsiteCDN": {
              "Type": "AWS::CloudFront::Distribution",
              "Properties": {
                  "DistributionConfig": {
                      "Comment": "CDN for LaunchDarkly Example",
                      "Enabled": "true",
                      "DefaultCacheBehavior": {
                          "ForwardedValues": {
                              "QueryString": "true"
                          },
                          "TargetOriginId": "only-origin",
                          "ViewerProtocolPolicy": "allow-all"
                      },
                      "DefaultRootObject": "index.html",
                      "Origins": [
                          {
                              "CustomOriginConfig": {
                                  "HTTPPort": "80",
                                  "HTTPSPort": "443",
                                  "OriginProtocolPolicy": "http-only"
                              },
                              "DomainName" : { "Fn::Join" : ["", [{"Ref" : "S3BucketForWebsiteContent"},
                                  {"Fn::FindInMap" : [ "Region2S3WebsiteSuffix", {"Ref" : "AWS::Region"}, "Suffix" ]}]]},
                              "Id": "only-origin"
                          }
                      ]
                  }
              },
              "Metadata": {
                  "AWS::CloudFormation::Designer": {
                      "id": "4d10edd7-c0cd-48cc-b00d-f09b3cb0ab07"
                  }
              }
          }
      },
      "Outputs": {
          "WebsiteURL": {
              "Value": {
                  "Fn::GetAtt" : [ "WebsiteCDN" , "DomainName" ]
              },
              "Description": "The URL of the newly created website"
          },
          "BucketName": {
              "Value": {
                  "Ref": "S3BucketForWebsiteContent"
              },
              "Description": "Name of S3 bucket to hold website content"
          }
      },
      "Metadata": {
          "AWS::CloudFormation::Designer": {
              "d2032587-aa05-4b85-b517-3c67966fa3cd": {
                  "size": {
                      "width": 60,
                      "height": 60
                  },
                  "position": {
                      "x": 60,
                      "y": 90
                  },
                  "z": 1,
                  "embeds": []
              },
              "4d10edd7-c0cd-48cc-b00d-f09b3cb0ab07": {
                  "size": {
                      "width": 60,
                      "height": 60
                  },
                  "position": {
                      "x": 180,
                      "y": 90
                  },
                  "z": 1,
                  "embeds": []
              }
          }
      }
  }
  ```

  We can update the following section in the template if we are deploying in some other region:

  ```json
  "Mappings": {
          "Region2S3WebsiteSuffix": {
              "eu-north-1": {
                  "Suffix": ".s3-website-eu-north-1.amazonaws.com"
              }
          }
      }
  ```

  

* Give the stack a human-readable name and click **Next**.

* On the *"Configure stack options"* step, accept all the defaults and click **Next**.

* Review the details and click **Create stack**. Wait for creation to complete before you continue. This can take several minutes.

* When the S3 bucket is ready, search for "S3" in the AWS console and locate the bucket you created.

* Click **Upload** and then **Add folder**. Upload the `/site` folder containing both the existing site's `index.html` and a `/beta` folder containing the new site from the [source repository](https://github.com/arpendu11/code-examples/tree/master/nodejs/nodejs-aws-lambda-launchdarkly) . Click *"Upload"* and when the procedure completes, click *"Close"*.

* Select the `site` directory in your bucket. From the Actions pull down select *"Make public"*, click to confirm and then click *"Close"*.

We can view the template deployment in designer which should look as below:

{{% image alt="Cloudfront Designer" src="images/posts/nodejs-aws-lambda-launchdarkly/cloudfront_designer.png" %}}

### Creating a Lambda Function

Now we will create a Lambda function to add our code and execute the function:

* In the AWS console, search for *"Lambda"*.

* Click **Create function**.

* Choose *"Author from Scratch"*. Name the function *"awsLambdaLaunchDarklyExample"* and choose the Node.js runtime, which is the default. You can also leave all the other options as the defaults. Click **Create function**.

{{% image alt="Lambda Function" src="images/posts/nodejs-aws-lambda-launchdarkly/lambda_function.png" %}}

## Creating a simple Node.js Serverless Project

Now we will write a simple Node.js backend code that will retrieve a Boolean flag from LaunchDarkly using `launchdarkly-node-server-sdk` and forward the user to actual URL or beta URL. Firstly, we will create a folder in our local machine and name it as `awsLambdaLaunchDarklyExample`. Then we will go inside the folder and execute the following command:

```bash
npm install launchdarkly-node-server-sdk
```

Then we will define our `index.js`:

```javascript
const LaunchDarkly = require("launchdarkly-node-server-sdk");
const client = LaunchDarkly.init("sdk-********-****-****-****-************");

exports.handler = async (event) => {
  // Place your S3 bucket URL here. Don't forget to add /site/
  let URL =
    "https://arpendu-nodejs-lambda-s3bucketforwebsitecontent-236bs71h1km3.s3.eu-north-1.amazonaws.com/site/";

  await client.waitForInitialization();
  let viewBetaSite = await client.variation(
    "view-beta-website",
    { key: event.Records[0].cf.request.clientIp },
    false
  );
  console.log(`LaunchDarkly returned: ${viewBetaSite}`);

  if (viewBetaSite) URL += "beta/index.html";
  else URL += "index.html";
  return {
    status: "302",
    statusDescription: "Found",
    headers: {
      location: [
        {
          key: "Location",
          value: URL,
        },
      ],
    },
  };
};
```

We need to make sure that we copy the S3 bucket URL properly and append the `/site` at the end. Now we can again go to our previously created lambda function and upload this folder with name `awsLambdaLaunchDarklyExample`.

## Create Feature Flag in LaunchDarkly to Rollout Changes

[LaunchDarkly](https://launchdarkly.com/) is a feature management service that takes care of all the feature flagging concepts. The name is derived from the concept of a *“dark launch”*, which deploys a feature in a deactivated state and activates it when the time is right.

{{% image alt="LaunchDarkly Internal" src="images/posts/feature-flag-tools/launchdarkly.png" %}}

LaunchDarkly is a cloud-based service that provides a UI to manage everything about our feature flags. For each flag, we need to define one or more **variations**. The variation can be a *boolean*, an arbitrary *number*, a *string* value, or a *JSON* snippet.

We can define **targeting rules** to define which variation a feature flag will show to its users. By default, a targeting rule for a feature flag is deactivated. The simplest targeting rule is *“show variation X for all users”*. A more complex targeting rule is *“show variation A for all users with attribute X, variation B for all users with attribute Y, and variation C for all other users”*.

We can use the LaunchDarkly SDK in our code to access the feature flag variations. It provides a persistent connection to [LaunchDarkly's streaming infrastructure](https://launchdarkly.com/how-it-works/) to receive server-sent-events (SSE) whenever there is a change in a feature flag. If the connection fails for some reason, it falls back to default values.

Usually, AWS Lambda has various limitations in implementing canary deployments simply by using weighted aliases:

- Because it uses traffic-based routing, much more users than we expect may access the new code.
- Given that the user request is handled by many functions, propagating routing decisions along a call chain is not supported.
- We won't be able to track the performance of the two versions independently because Lambda does not disclose metrics for each of the versions.

So let’s just create a flag in [LaunchDarkly](https://app.launchdarkly.com/) by opening the dashboard and selecting our project (the default project works fine) and environment (either the default "Test" or "Production" is fine, just be sure to change the flag in the same environment later), then click on *"Create flag"*.

{{% image alt="LaunchDarkly Feature Flag" src="images/posts/nodejs-aws-lambda-launchdarkly/launchdarkly_feature_flag.png" %}}

After creating the flag, we need to set the *“Default Rule”* and choose *"A percentage rollout"* from the **Serve** menu. For this example, we will assign 50/50, but in a real-world scenario, we would likely start with a smaller distribution in the first variation and then increase that number over time.

{{% image alt="Percentage Rollout" src="images/posts/nodejs-aws-lambda-launchdarkly/percentage_rollout.png" %}}

After this, we would also need to enable *“Targeting”* as **ON**, so that it can be served with multiple users.

## Launch/Deploy the Function to AWS Lambda@Edge

A function running on Lambda@Edge receives a specific [event structure](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html). This allows us to give LaunchDarkly a key that will guarantee that while different users receive various flag combinations, the same user always ends up in the same group. No matter how many times a person loads the page, they will always receive versions A and B, for instance, for users 1 and 2, respectively. User 1 and User 2 will never receive Variation A or B, respectively.

The code below gets the value of the flag and, if the value is `true`, redirects them to the beta site. Otherwise, if the value is `false`, it redirects them to the original site. The code below gets the value of the flag and, if the value is `true`, redirects them to the beta site.

We can use the user's IP address as the key. While the IP isn't unique to an individual, it is the only identifying information we always have available for the user. This portion of the code makes sure that we use the user’s IP address:

```javascript
let viewBetaSite = await client.variation(
    "view-beta-website",
    { key: event.Records[0].cf.request.clientIp },
    false
  );
```

Our function now uses the Lambda@Edge event data and returns the correct redirect response, but we need to trigger it from the CloudFront distribution we created earlier. To do this, we will simply add a CloudFront trigger. Before that we need to update our permissions so that we can enable the CloudFront trigger:

* In the AWS console, search for *"Lambda"* and select your function.

* Go to the Configuration tab for the Lambda function, click **Permissions**, then under Execution role click **Edit**.

* In the *"Existing Role"* menu, select *"service-role/lambdaEdge"*.

* Click **Save**.

Next we will enable our trigger:

* Open our Lambda Function and click **Add trigger**.

* In the *"Select a trigger"* menu, search for *"CloudFront"* and then click the button to **Deploy to Lambda@Edge**.
* When we configure the CloudFront trigger, change the CloudFront event to *"Viewer request"*. This ensures that the Lambda will execute on every request before the cache is checked. If we use the default, which is *"Origin request"*, the cache would be checked first and then the flag will change after the initial run as it would be pulled from this cache. That means flag changes would not impact the redirect.
* Accept the defaults for the remaining properties and click *"Deploy"*. You may get asked to do this a second time. If you are, choose *"Viewer request"* both times.

## Test the Features

Next we would like to test our function. In order to do that, we will perform the following steps:

* Click the "CloudFront" box in the "Function Overview". **Configuration** > **Triggers settings** would appear.

* Click the link next to the CloudFront trigger that has our CloudFront distribution ID. The CloudFront distribution appears in a new tab.

* In the "Details" section of the CloudFront distribution tab, copy the URL for this distribution.

* If necessary, wait for the CloudFront distribution to finish deploying. If we paste this URL in the browser, it will direct us to either the old version of the page or the new one.

The old page would look something like this:

{{% image alt="Old Site" src="images/posts/nodejs-aws-lambda-launchdarkly/old_site.png" %}}

The new Beta site would look something like this:

{{% image alt="Beta site" src="images/posts/nodejs-aws-lambda-launchdarkly/beta_site.png" %}}

## Cleanup AWS

Finally, once we are done with our testing, we can cleanup our AWS by the following steps:

* Remove the CloudFront association by following the instructions in [Amazon's documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-delete-replicas.html).

* Navigate to the Behaviors tab of our CloudFront distribution, edit the behavior and remove the Function association for Lambda@Edge. After the distribution deploys, we can delete the Lambda function.

* Empty the S3 bucket and delete it.

* Disable the CloudFront distribution. After disabling it, wait for it to finish deploying and delete the distribution.

## Conclusion

In this article, we implemented a simple NodeJS-based code that can redirect the user to a site. We also examined how feature toggles can be used to build canary deployments and how they differ from the approach with weighted aliases. As part of this, we deployed this function as part of AWS Lambda and mapped it to CloudFront to host our site.

Finally, we defined a percentage-based rollout feature flag in LaunchDarkly that can propagate to the landing site based on the user’s IP address as the key. Thus, an equal number of users land either on the old site or the beta version of the new site. Thus, we took a holistic look into the serverless canary deployment with much ease.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/nodejs/nodejs-aws-lambda-launchdarkly).