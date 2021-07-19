---
title: "Complete Guide to CSRF"
categories: [craft]
date: 2021-06-14 06:00:00 +1000
modified: 2021-06-13 06:00:00 +1000
author: pratikdas
excerpt: "In this article, we will understand a type of website attack called Cross Site Request Forgery (CSRF). We will look at the kind of websites which usually fall victim to CSRF attacks, how an attacker crafts a CSRF attack,  and some techniques to mitigate the risk of being compromised with a CSRF attack"
image:
  auto: 0074-stack
---

Protecting a web application against various security threats is vital for the health and security of a website. The process of protecting websites includes an assessment of these threats and building effective mechanisms to counter them.

Cross Site Request Forgery (CSRF) is a type of attack against certain website security vulnerabilities. With a successful CSRF attack, an attacker can mislead an authenticated user in a website to perform actions with inputs set by the attacker. 

This can lead to loss of user confidence in the website and even result in fraud or theft of financial resources if the website under attack belongs to a financial realm.

In this article, we will understand:
- What constitutes a Cross Site Request Forgery (CSRF) attack
- How attackers craft a CSRF attack
- What makes websites vulnerable to a CSRF attack
- What are some methods to secure websites from CSRF attack

## What is a CSRF?
A Cross Site Request Forgery attack is composed of two aspects:
1. Cross-site access from the attacker's website to a victim's website.
2. Sending a forged request to the victim's website.

An attacker launching a CSRF attack misleads a user into performing actions on his/her behalf. 

CSRF attacks target websites that trust some form of authentication by users before they perform any actions. Attackers exploit this trust and send forged requests on behalf of the authenticated user. 

Other commonly used names are Session Riding, Sea Surf, XSRF, and On-Click attack. 

An example will make this more clear:

1. Let us suppose a user logs in to a website `www.myfriendlybank.com` from a login page. The website is vulnerable to CSRF attacks.
2. The server authenticates the user and sends back a cookie in the response. The server populates the cookie with the information that the user is authenticated. As part of a web browser's behavior concerning cookie handling, it will send this cookie to the server for all subsequent interactions.
3. The user next visits a malicious website without logging out of `myfriendlybank.com`. This malicious site contains a banner that looks like this:
![CSRF Banner](/assets/img/posts/csrf/csrf-banner.png)

The HTML used to create the banner has the below contents:
```html
<h1>Congratulations. You just won a bonus of 1 million dollars!!!</h1>
  <form action="http://myfriendlybank.com/account/transfer" method="post">
    <input type="hidden" name="TransferAccount" value="9876865434" />
    <input type="hidden" name="Amount" value="1000" />
    <input type="submit" value="Click here to claim your bonus"/>
  </form>
```
We can notice in this HTML that the form action posts to the vulnerable website `myfriendlybank.com` instead of the malicious website. This represents the "cross-site" part of CSRF. The request sent to the vulnerable website is forged with values crafted by the attacker. In this example, the attacker sets the request parameters: `TransferAccount` and `Amount` to dubious values which are unknown to the actual user.

4. The user is enticed into visiting the malicious website and clicking the submit button. The browser sends the users's authentication cookie to the server that was received from the server after login in step 2.

5. Since the website is vulnerable to CSRF attack, the forged request with the user's authentication cookie is processed, and can do anything that an authenticated user is allowed to do. In this example, transfer the amount to the attacker's account.

Although this example requires the user to click the form button, the malicious page could just as easily run a script that submits the form automatically without the user knowing anything about it.

This example although very trivial can be extended to scenarios where an attacker can perform additional damaging actions like changing the user's password and registered email address which will block their access completely.

CSRF is considered a flaw in the OWASP Top ten Web Application Security Risks.

The OWASP website defines CSRF as:
> Cross-Site Request Forgery (CSRF) is an attack that forces an end user to execute unwanted actions on a web application in which they’re currently authenticated. With a little help from social engineering (such as sending a link via email or chat), an attacker may trick the users of a web application into executing actions of the attacker’s choosing.

## How does CSRF work?

There are two main parts to executing a Cross Site Request Forgery attack. The first one is tricking the victim into clicking a link or loading a page. This is normally done through social engineering and malicious links. The second part is sending a crafted, legitimate-looking request from the victim’s browser to the website. The request is sent with values chosen by the attacker including any cookies that the victim has associated with that website. This way, the website knows that this victim can perform certain actions on the website. Any request sent with these HTTP credentials or cookies will be considered legitimate, even though the victim would be sending the request on the attacker’s command.

Let us now understand how CSRF works in greater detail. 

### Hijacking the Session Cookie
A CSRF attack exploits the behavior of a type of cookies called session cookies shared between a browser and server. HTTP requests are stateless due to which the server cannot distinguish between two requests sent by a browser. 

But there are many scenarios where we want the server to be able to relate one HTTP request with another. For example, a login request followed by a request to check account balance or transfer funds. The server will only allow these requests if the login request was successful. We call this group of requests as belonging to a session. 

Cookies are used to hold this session information. The server packages the session information for a particular client in a cookie and sends it to the client's browser. For each new request, the browser re-identifies itself by sending the cookie (with the session key) back to the server.

The attacker hijacks this cookie to send requests to the server. 

There are many ways for an attacker to try and exploit a CSRF vulnerability. An attacker constructs a CSRF attack through the following steps:

![CSRF Attack Steps](/assets/img/posts/csrf/csrf-attack-steps.png)

### Identifying the Vulnerable site
Before planning a CSRF attack, the attacker needs to identify a site having CSRF vulnerabilities. Web applications that are vulnerable to CSRF attacks do not have mechanisms to differentiate between valid requests sent by a trusted user and forged requests sent by any fake source. 

The attacker also needs to know a valid URL in the website, along with the corresponding patterns of valid requests accepted by the URL.

This URL should cause a state-changing action in the target application. Some examples of state-changing actions are:
1. Update account balance
2. Create a customer record
3. Transfer money

In contrast to state-changing actions, an inquiry does not change any state in the server. For example, view user profile, view account balance, etc which do not update anything in the server.

The attacker also needs to find the right values for the URL parameters. Otherwise, the target application might reject the malicious request.

Let us assume that the attacker has identified a website at https://myfriendlybank.com to try a CSRF attack. From this website, the attacker has found a URL https://myfriendlybank.com/account/transfer with CSRF vulnerabilities which are used to transferring funds.

### Building an Exploit URL
The attacker will next try to build an exploit URL for sharing with the victim. Let us assume that the transfer function in the application is built using a GET method to submit a transfer request. Accordingly, a legitimate  request to transfer $100 to another account with account number `1234567` will look like this:

GET https://myfriendlybank.com/account/transfer?amount=100&accountNumber=1234567 

The attacker will create an exploit URL to transfer `$15,000` to another dubious account with account number `4567876` probably belonging to the attacker:

https://myfriendlybank.com/account/transfer?amount=15000&accountNumber=4567876

If the victim clicks this exploit URL, `$15,000` will get transferred to the attacker's account.
### Creating an Inducement for the Victim to Click the Exploit URL
After creating the exploit URL, the attacker must also trick the victim user into clicking it. For this, the attacker creates an inducement and uses any social engineering attack methods to trick the victim user into clicking the malicious URL. Some examples of these methods are:
- including exploit HTML image elements onto forms
- placing an exploit URL on pages that are often accessed by the victim user while being logged into the application
- sending the exploit URL through email.

The following is an example of an image with an exploit URL:

<img src=“https://samplebank.com/onlinebanking/transfer?amount=5000&accountNumber=425654” width=“0” height=“0”>

This scenario includes an image tag in an attacker-crafted email to the victim user. Upon receiving it, the victim user's browser application opens this URL automatically—without human intervention. As a result, without the victim user's permission, a malicious request is sent to the online banking application. If the victim user has an active session opened with `myfriendlybank.com`, the application would treat this as an authorized amount transfer request coming from the victim user. It would then transfer the amount to the account specified by an attacker.

### Presence of an Active Session
The victim user needs to have an active session with `myfriendlybank.com`. The success of a CSRF attack depends on a user’s session with a vulnerable application. The attack will only be successful if the user is in an active session with the vulnerable application.

## Preventing CSRF attacks
The main cause of a CSRF attack is that the vulnerable website cannot distinguish a legitimate request from a forged request sent by an authorized user's browser. So it fails to reject the forged requests crafted by an attacker.

To prevent a CSRF attack, web applications need to build mechanisms to determine if the source of the HTTP request is legitimately generated via the application’s user interface. 

### Send CSRF Token in the Request to Identify Legitimate Requests

The issue is that the HTTP request from the bank’s website and the request from the evil website are the same. This means there is no way to reject requests coming from the evil website and allow requests coming from the bank’s website. To protect against CSRF attacks we need to ensure there is something in the request that the evil site is unable to provide.

### CSRF Token
The best way to achieve this is through a CSRF token. A CSRF token is a secure random token (e.g., synchronizer token or challenge token) that is used to prevent CSRF attacks. The token needs to be unique per user session and should be of large random value to make it difficult to guess.

A CSRF secure application assigns a unique CSRF token for every user session. These tokens are inserted within hidden parameters of HTML forms related to critical server-side operations. They are then sent to client browsers.

It is the application team’s responsibility to identify which server-side operations are sensitive in nature. The CSRF tokens must be a part of the HTML form—not stored in session cookies. The easiest way to add a non-predictable parameter is to use a secure hash function (e.g. SHA-2) to hash the user’s session ID. To ensure randomness, the tokens must be generated by a cryptographically secure random number generator.

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

The third-party cookie setting in browsers controls the setting of cookies to control privacy. That is, if we load `example.com` and it makes a request to `xyz.com`, that second request is not allowed to set any new cookies.

The SameSite attribute is aimed at preventing CSRF, and thus affects when third-party cookies are sent. In the above bank example, either value (Lax or Strict) would send the request to mybank.com without any of the cookies stored in our browser for that domain that have that attribute set; the result would be that your bank wouldn't recognize your account, and thus would deny the transfer.

"By setting my browser to accept third party cookies, am I making myself more vulnerable to a CSRF attack?"

The answer is no. A CSRF attack, also known as "session riding," involves leveraging a cookie that already exists, e.g. a session cookie for a site that you are logged into. It does not involve creating new cookies; in fact, the attacker in a CSRF scenario has no idea what the cookie value is (which is why he must ride on someone else's cookie), and therefore has no means of setting one.

The main risk with third party cookies has to do with privacy. The ability for a site to set a third party cookie means that the first party can tell a third party where we have visited-- for example, Amazon can tell a marketing aggregator that we have browsed a specific product, and that aggregator can then cause ads for that product to appear on Facebook or other sites. This has considerable "creepiness" factor, although there is no actual communication between Amazon and Facebook, and no actual information is being stolen by a third party that wasn't invited to do so by one of the first parties.

## Conclusion

CSRF attacks comprise a good percentage of web-based attacks. It is easy to prevent these attacks by building proper CSRF defenses in our application.

I hope this article has given you a basic understanding of CSRF and help you to protect web applications against CSRF attacks.


