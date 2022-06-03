---
title: "Distribute Static Content with Amazon CloudFront"
categories: ["aws"]
date: 2022-05-20T05:00:00
modified: 2022-05-20T05:00:00
authors: [pratikdas]
excerpt: "Amazon CloudFront is a fast content delivery network (CDN) service that securely delivers data, videos, applications, and APIs to customers globally with low latency. A Content delivery network (CDN) consists of a globally-distributed network of servers that can cache static content, like images, media, stylesheets, JS files, etc, or other bulky media, in locations close to consumers. This helps in improving the downloading speed of these static contents.
In this tutorial, we will store a single page application (SPA) in an S3 bucket and configure CloudFront to deliver this application globally."
image: images/stock/0118-keyboard-1200x628-branded.jpg
url: distribute-static-content-with-cloudfront
---

Amazon CloudFront is a fast content delivery network (CDN) service that securely delivers data, videos, applications, and APIs to customers globally with low latency. A Content delivery network (CDN) consists of a globally-distributed network of servers that can cache static content, like images, media, stylesheets, JS files, etc, or other bulky media, in locations close to consumers. This helps in improving the downloading speed of these static contents.

In this tutorial, we will store the contents of a Single page application (SPA) in an S3 bucket and configure CloudFront to deliver this application globally. 

## Creating a Single Page Application as Static Content

We can create a Single Page Application with one of the many frameworks available like Angular, React, Vue, etc.
Let us create a SPA with the React framework by running the following NPM command:

```shell
 npx create-react-app mystore
```
Running this command bootstraps a `react` project under a folder: `mystore` with the following files in a folder: `src`.

```js
src
├── App.css
├── App.js
├── App.test.js
├── index.css
├── index.js
├── logo.svg
├── reportWebVitals.js
└── setupTests.js
```
Let us run this application with the below commands:

```shell
cd mystore
npm start
```
This will launch the default react app in a browser.

We can evolve this application further to build useful features but for this tutorial, we will deploy this react app using CloudFront.

For deployment, we will first build the project by running:

```shell
npm build
```
This will package the application in a build directory with the below contents:

```shell
build
├── asset-manifest.json
├── favicon.ico
├── index.html
├── logo192.png
├── logo512.png
├── manifest.json
├── robots.txt
└── static
    ├── css
    │   ├── main.073c9b0a.css
    │   └── main.073c9b0a.css.map
    ├── js
    │   ├── 787.dd20aa60.chunk.js
    │   ├── 787.dd20aa60.chunk.js.map
    │   ├── main.fa9c6efd.js
    │   ├── main.fa9c6efd.js.LICENSE.txt
    │   └── main.fa9c6efd.js.map
    └── media
        └── logo.6ce24c58023cc2f8fd88fe9d219db6c6.svg
```
These are a set of static files which we can host on any HTTP server for serving our web content. For our tutorial, we will copy these static contents to an S3 bucket as explained in the next section.

## Hosting the Static Content in an S3 Bucket
Amazon Simple Storage Service (S3) is a service for storing and retrieving any kind of files called `objects` in S3 parlance. 
Buckets are containers for storing objects in S3. We upload files to an S3 bucket where it is stored as an S3 object. We will upload all the files under the build folder to an S3 bucket that was created after building the react project in the previous section.

### Creating the S3 Bucket
Let us create the S3 bucket from the AWS administration console.
{{% image alt="Create Bucket" src="images/posts/aws-cloudfront/create-bucket.png" %}}

For creating the S3 bucket we are providing a name and selecting the region as `us-east` where the bucket will be created.

We will allow public access to the bucket by unchecking the checkbox for `Block all public access` as shown below:
{{% image alt="Create Bucket" src="images/posts/aws-cloudfront/allow-public-access.png" %}}

This will allow public access to the S3 bucket which will make the files in the bucket accessible with a public URL over the internet. This is however not a secure practice which we will address in a later section.

After creating the bucket, we will configure the bucket for hosting web assets by modifying the bucket property for static web hosting:
{{% image alt="Bucket Properties" src="images/posts/aws-cloudfront/bucket-props.png" %}}
{{% image alt="Static web content" src="images/posts/aws-cloudfront/web-enabled.png" %}}

### Enabling the Static Web Hosting Property on the S3 Bucket
We will enable the property: `static web hosting` of the bucket as shown below:
{{% image alt="Bucket Properties" src="images/posts/aws-cloudfront/enable-web-hosting.png" %}}

We have also set the `Index document` and `Error document` to `index.html`.

After we enable the static web hosting, the section under our static web hosting property of our S3 bucket will look like this:

{{% image alt="static web hosting enabled" src="images/posts/aws-cloudfront/static-web-hosting-enabled.png" %}}

We can see a property `Bucket website endpoint` which contains the URL to be used for navigating to our website after copying the static files to the S3 bucket. 

### Types of S3 Bucket Endpoints
Since we will be configuring the S3 bucket URL as the origin when we create a CloudFront distribution in subsequent sections, it will be useful to understand the two types of endpoints provided by S3:

1. **REST API endpoint**: This endpoint is in the format: `{bucket-name}.s3-{region}.amazonaws.com`. In our example, the Bucket Website Endpoint` is http://io.myapp.s3-us-east-1.amazonaws.com`. 

The characteristics of Bucket Website Endpoint are:
* Supports SSL connections
* Provides End to end encryption
* Can use Origin Access Identity (OAl)
* Supports Private/Public content

2. **Bucket Website Endpoint**: This endpoint is generated when we enable static website hosting on the bucket and is in the format: `{bucket-name}-website.s3.amazonaws.com`. In our example, the Bucket Website Endpoint` is http://io.myapp.s3-website-us-east-1.amazonaws.com`. 

The characteristics of Bucket Website Endpoint are:
* Does not support SSL connections
* Supports Redirect requests
* Cannot use Origin Access Identity (OAI)
* Serves default index document (Default page)
* Supports only publicly readable content

### Attaching a Bucket Policy
We also need to attach a bucket policy to our S3 bucket. The bucket policy, written in JSON, provides access to the objects stored in the bucket:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Statement1",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::io.myapp/*"
        }
    ]
}
```
This bucket policy provides read-only access to all the objects stored in our bucket as represented by the resource ARN: `arn:aws:s3:::io.myapp/*`.

### Uploading Static Content to our S3 Bucket
After finishing all the configurations of our bucket, we will upload all our static content under the `build` folder of our project in our local machine to our S3 bucket:

{{% image alt="file upload to Bucket" src="images/posts/aws-cloudfront/file-upload.png" %}}

We can see the upload status of all the files after the upload is completed as shown below:

{{% image alt="file uploading to Bucket" src="images/posts/aws-cloudfront/file-uploading.png" %}}
{{% image alt="file uploaded to Bucket" src="images/posts/aws-cloudfront/file-uploaded.png" %}}

### Serving the Web Site from the S3 Bucket 
With all the files uploaded we will be able to see our application by navigating to the bucket website endpoint: `http://io.myapp.s3-website-us-east-1.amazonaws.com`.

{{% image alt="file uploaded to Bucket" src="images/posts/aws-cloudfront/browser-s3.png" %}}

Assuming we have customers accessing this website from all parts of the globe, they will all be downloading the static contents from the same S3 bucket in the `us-east` region in our example. This will give a different experience to customers depending on their location. Customers closer to the `us-east` region will experience a lower latency compared to the customers who are accessing this website from other continents. We will improve this behavior in the next section with the help of Amazon's CloudFront service.

## Advantages of Using CloudFront

Serving your website using SSL (HTTPS)
The request will be cached
Increase website performance
The ability to set common security headers

## Creating the CloudFront Distribution
When we want to use CloudFront to distribute our content, we need to create a distribution and choose the configuration settings you want. For example:


We create a CloudFront distribution to specify the location of the content that we want to deliver from CloudFront along with the configuration to track and manage its delivery.

Let us create a CloudFront Distribution from the AWS Management Console:
{{% image alt="file uploading to Bucket" src="images/posts/aws-cloudfront/cf-distrib1.png" %}}

We have set the origin domain to the bucket website endpoint of our S3 bucket created in the previous section and left all other configurations as default. The distribution takes a few minutes to change to `enabled` status. 

After it is active, we can now navigate to our website using the CloudFront distribution domain name: `https://d4l1ajcygy8jp.cloudfront.net/`:

{{% image alt="browser" src="images/posts/aws-cloudfront/browser-cf.png" %}}

## Securing Access to Content
In the earlier sections, we used static assets residing in a public S3 bucket which makes it insecure by making all the content accessible to users if the S3 bucket URL is known to them. CloudFront provides many configurations to secure access to content. For this example, we will use an Origin Access Identity (OAI) to restrict access to the contents of the S3 bucket. 

Origin Access Identity (OAI) is a special CloudFront user that is associated with our distributions. We can restrict access to the S3 bucket by updating the bucket policy to provide read permission to the OAI defined as the `Principal` in the policy definition as shown below:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
            "Sid": "2",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity <OAI>"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::<S3 bucket name>/*"
        }
  ]
}
```
Let us create another CloudFront Distribution but configured to use an OAI to access the contents in the S3 bucket:
{{% image alt="browser" src="images/posts/aws-cloudfront/oai.png" %}}

This time we have chosen the S3 bucket URL from the selection box as the origin domain instead of the bucket website endpoint. In the section for S3 bucket access, we have selected `Yes use OAI` and created an OAI: `my-oai` to associate with this distribution. We have also chosen the option of updating the bucket policy manually after creating the distribution.

After creating the distribution, let us update the bucket policy of our S3 bucket to look like this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
            "Sid": "1",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity E32V87I09SD18I"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::io.myapp/*"
    }
  ]
}
```
This bucket policy grants the CloudFront origin access identity (OAI) with id: `E32V87I09SD18I` permission to get (read) all objects in our Amazon S3 bucket. We have set the `Principal` to the OAI id which can be found from the [AWS management console](https://console.aws.amazon.com/cloudfront/v3/home#/oai). 

We have also disabled the public access to the bucket and the static web hosting property. 

After the CloudFront distribution is deployed and active, we can navigate to our website using the CloudFront distribution domain name: `https://d4l1ajcygy8jp.cloudfront.net/index.html`:

{{% image alt="browser" src="images/posts/aws-cloudfront/browser-cf-oai.png" %}}


Some of the other ways we can secure access to content with CloudFront are:

1. Encrypting Connections to CloudFront:
CloudFront uses HTTPS protocol (Hypertext Transfer Protocol Secure) a secure version of the HTTP protocol that uses the SSL/TLS protocol for encryption.
2. 
We can configure CloudFront to mandate that viewers always use the HTTPS protocol for communicating with CloudFront. We can also configure CloudFront to use HTTPS protocol for communicating with the origin. Communication over the HTTPS protocol ensures that the connection is encrypted and therefore secured from being eavesdropped on.


## Conclusion 
In this article, we configured Amazon CloudFront to distribute static Content stored in an S3 bucket. Here is a summary of the steps for our quick reference:

1. We created an S3 bucket with public access.
2. We enable static web hosting on the S3 bucket and got a bucket website endpoint.
3. We added an S3 bucket policy to allow access to the contents of the S3 bucket for all users (`*`).
4. We uploaded some static contents in the form of JavaScript, images, HTML, and CSS files of a Single Page Application (SPA) built using the React library.
5. With this setup, we could view the website in our browser using the S3 bucket website endpoint.
6. We finally created a CloudFront distribution and configured the S3 bucket website endpoint as the origin.
7. After the CloudFront distribution was deployed, we could view the website in a browser using the CloudFront URL.
8. Next we secured the S3 bucket by removing public access.
9. We disabled static web hosting on the S3 bucket.
10. We created another CloudFront distribution with the S3 Rest API endpoint.
11. We created an Origin Access Identity (OAI) and associated it with the bucket.
12. We updated the S3 bucket policy to allow access only to the OAI coming from CloudFront.
13. After this CloudFront distribution was deployed, we could view the website in a browser using the CloudFront URL.
