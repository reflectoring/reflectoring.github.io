---
title: "Complete Guide to CSRF"
categories: [craft]
date: 2021-06-14 06:00:00 +1000
modified: 2021-06-13 06:00:00 +1000
author: pratikdas
excerpt: "In this article, we will understand cross-origin resource sharing (CORS), different types of CORS requests, CORS headers, and describe some common examples of security vulnerabilities caused by CORS misconfigurations along with best practices for secure CORS implementations."
image:
  auto: 0074-stack
---

Cross-site request forgery, also called CSRF or XSRF, is a type of web security vulnerability. With a successful CSRF attack, an attacker can impersonate an authenticated user in an website and perform malicious actions without their knowledge. 

CSRF vulnerablities can be easily exploited causing loss of customer confidence on the targetted website, and even result in fraud or theft of financial resources.

In this article, we will understand :
- What constitutes a Cross-site Request Forgery (CSRF) attack
- What makes Websites vulnerable to a CSRF attack
- What are some methods to secure Websites from CSRF attack

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/cors" %}

## What is CSRF?

CSRF attacks websites which trust some form of authentication by users before they perform any actions. Attackers exploit this trust of the website on an authenticated user and send forged requests on behalf of the user. An example will make this more clear:

Let us suppose an user Alice logs in to a website xyz.com which is vulnerable to a CSRF attack. After authentication with her credentials the user can make payments to different parties added by the her. She does this by filling up some fields and clicking a URL: xyz.com?toAccount=yyyyy.

The attacker can create a forged request of the form xyz.com?toAccount=attacker's-AccountNumber and send this URL in an email to Alice with an inducement like "click here to win 1000 USD". If Alice clicks this link in the same browser, the request will go through and the amount will get transferred to the attacker's account.

This example although very trivial can be extended to scenarios where an attacker can performing other actions with more damaging potential like changing Alice's password and registered email which will block her access completely.

Attackers often use social engineering websites to launch a CSRF attack by sending maliciously crafted URLs with attractive inducements. When the victim user clicks this URL, the user’s browser then sends the maliciously crafted request to the targeted Web application. The request will be processed, if the Web application is vulnerable to CSRF attack.

CSRF is considered a flaw under the [A5 category]((https://owasp.org/www-community/attacks/csrf)) in the OWASP Top ten Web Application Security Risks.

The OWASP website defines CSRF as:
> Cross-Site Request Forgery (CSRF) is an attack that forces an end user to execute unwanted actions on a web application in which they’re currently authenticated. With a little help of social engineering (such as sending a link via email or chat), an attacker may trick the users of a web application into executing actions of the attacker’s choosing.

## How does CSRF work?
After understanding the extent of damage a CSRF attack can cause, let us understand how CSRF works in greater detail. 

### Hijacking the Session Cookie
A CSRF attack exploits the behavior of a type of cookies called session cookies shared between a browser and server. HTTP requests are stateless due to which the server cannot distinguish between two requests sent by a browser. 

But there are many scenarios where we want the server to be able to relate one HTTP request with another. For example, a login request followed by a request to check account balance or transfer funds. The server will only allow these requests if the login request was successful. We call this group of requests as belonging to a session. 

Cookies are used to hold this session information.The server packages the session information for a particular client in a cookie and sends it to the client's browser. For each new request, the browser re-identifies itself by sending the cookie (with the session key) back to the server.

The attacker hijacks this cookie to send requests to the server. 

There are many ways for an attacker to try and exploit a CSRF vulnerability. An attacker constructs a CSRF attack through the following steps:

### Identify Vulnerable site
Before planning a CSRF attack, the attacker needs to identify a site having CSRF vulnerabilities. Web applications which are vulnerable to CSRF attack do not have mechanisms to differentiate between valid requests sent by a trusted user and forged requests sent by any fake source. 

The attacker also needs to know a valid URL in the website, along with the corresponding patterns of valid requests accepted by the URL.

This URL should cause a state-changing action in the target application. Some examples of state-changing actions are:
1. Update account balance
2. Create a customer record
3. Transfer money

In contrast to state-changing actions, any inquiry is a non-state changing action. For example, view user profile, view account balance, etc which do not update anything in the server.

The attacker also needs to find the right values for the URL parameters. Otherwise, the target application might reject the malicious request.

Let us assume that the attacker has zeroed in on an website at https://myfriendlybank.com to try a CSRF attack. From this website he finds a URL https://myfriendlybank.com/account/transfer with CSRF vulnerabilities.

### Build an Exploit URL
The attacker will next try to build an exploit URL. Let us assume that the transfer function in the application is built using a GET method to submit a request for transfer. Accordingly, a legitimate  request to transfer $100 to another account with account number `1234567` will look like this:

GET https://myfriendlybank.com/account/transfer?amount=100&accountNumber=1234567 

The attacker will create an exploit URL to transfer `$15,000` to another dubious account with account number `4567876` probably belonging to the attacker:

https://myfriendlybank.com/account/transfer?amount=15000&accountNumber=4567876

### Create an Inducement for the Victim to Click the Exploit URL
The attacker must also trick the victim user into clicking the exploit URL. For this, the attacker sends an inducement through an email or uses any social engineering attack methods to trick Bob into loading the malicious URL. This can be achieved in various ways. For instance, including malicious HTML image elements onto forms, placing a malicious URL on pages that are often accessed by users while logged into the application, or by sending a malicious URL through email.

The following is an example of a disguised URL:

<img src=“https://samplebank.com/onlinebanking/transfer?amount=5000&accountNumber=425654” width=“0” height=“0”>

Consider the scenario that includes an image tag in an attacker-crafted email to Bob. Upon receiving it, Bob’s browser application opens this URL automatically—without human intervention. As a result, without Bob’s permission, a malicious request is sent to the online banking application. If Bob has an active session with samplebank.com, the application would treat this as an authorized amount transfer request coming from Bob. It would then transfer the amount to the account specified by an attacker.

### Active Session
Bob needs to have an active session with samplebank.com. There are some limitations. To carry out a successful CSRF attack, consider the following:

The success of a CSRF attack depends on a user’s session with a vulnerable application. The attack will only be successful if the user is in an active session with the vulnerable application.


To give an example, let’s say that Bob has an online banking account on samplebank.com. He regularly visits this site to conduct transactions with his friend Alice. Bob is unaware that samplebank.com is vulnerable to CSRF attacks. Meanwhile, an attacker aims to transfer $5,000 from Bob’s account by exploiting this vulnerability. To successfully launch this attack:


## Preventing CSRF attacks
To defeat a CSRF attack, applications need a way to determine if the HTTP request is legitimately generated via the application’s user interface. 

### CSRF Token
The best way to achieve this is through a CSRF token. A CSRF token is a secure random token (e.g., synchronizer token or challenge token) that is used to prevent CSRF attacks. The token needs to be unique per user session and should be of large random value to make it difficult to guess.

A CSRF secure application assigns a unique CSRF token for every user session. These tokens are inserted within hidden parameters of HTML forms related to critical server-side operations. They are then sent to client browsers.

It is the application team’s responsibility to identify which server-side operations are sensitive in nature. The CSRF tokens must be a part of the HTML form—not stored in session cookies. The easiest way to add a non-predictable parameter is to use a secure hash function (e.g., SHA-2) to hash the user’s session ID. To ensure randomness, the tokens must be generated by a cryptographically secure random number generator.

Whenever a user invokes these critical operations, a request generated by the browser must include the associated CSRF token. This will be used by the application server to verify the legitimacy of the end-user request. The application server rejects the request if the CSRF token fails to match the test.

## Defenses against CSRF 
As users, we can defend ourselves from falling victim to a CSRF attack by cultivating two simple web browsing habits:

1. We should logoff from a website after using it. This will invalidate the cookies which the attacker sends in the exploit URL.
2. We should use different browsers, for example, one browser for accessing sensitive sites and another browser for random surfing.

As developers, we can apply the following best practices:
1. Session time outs: 
2. After some period of inactivity, logoff the user
3. Confirmation pages
 - Are you sure you want to transfer $1000?
 - CAPTCHA
4. Add Session-related information to URLs
5. Makes it extremely difficult for an attacker to know/predict the structure of the URLs to attack
6. Random, One-time tokens in forms

## Third Party Cookies and CSRF
Third-party cookies are cookies belonging to a domain different from the domain we are currently visiting.

The third-party cookie setting in browsers controls the setting of cookies to control privacy. That is, if you load example.com and it makes a request to cool-analytics.com, that secondary request is not allowed to set any new cookies.

The proposed SameSite attribute is instead aimed at preventing CSRF, and thus affects when third-party cookies are sent. In the above bank example, either value (Lax or Strict) would send the request to mybank.com without any of the cookies stored in your browser for that domain that have that attribute set; the result would be that your bank wouldn't recognize your account, and thus would deny the transfer.

"By setting my browser to accept third party cookies, am I making myself more vulnerable to a CSRF attack?"

The answer is no. A CSRF attack, also known as "session riding," involves leveraging a cookie that already exists, e.g. a session cookie for a site that you are logged into. It does not involve creating new cookies; in fact, the attacker in a CSRF scenario has no idea what the cookie value is (which is why he must ride on someone else's cookie), and therefore has no means of setting one.

The main risk with third party cookies has to do with privacy. The ability for a site to set a third party cookie means that the first party can tell a third party where we have visited-- for example, Amazon can tell a marketing aggregator that we have browsed a specific product, and that aggregator can then cause ads for that product to appear on Facebook or other sites. This has considerable "creepiness" factor, although there is no actual communication between Amazon and Facebook, and no actual information is being stolen by a third party that wasn't invited to do so by one of the first parties.

## Conclusion

CSRF attacks comprise a good percentage of web-based attacks. Fortunately, it is easy to prevent and thwart attacks before they even happen.

I hope this guide will help you to get started with implementing CORS securely and fixing CORS errors.


