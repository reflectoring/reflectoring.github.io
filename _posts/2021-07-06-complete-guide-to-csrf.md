---
title: "Complete Guide to CSRF"
categories: [craft]
date: 2021-06-14 06:00:00 +1000
modified: 2021-06-13 06:00:00 +1000
author: pratikdas
excerpt: "In this article, we will understand a type of website attack called Cross Site Request Forgery (CSRF). We will look at the kind of websites which usually fall victim to CSRF attacks, how an attacker crafts a CSRF attack, and some techniques to mitigate the risk of being compromised with a CSRF attack"
image:
  auto: 0074-stack
---

Protecting a web application against various security threats and attacks is vital for the health and security of a website. The process of protecting websites includes an assessment of these threats and building effective mechanisms to counter them and falling victim to any attack.

Cross Site Request Forgery (CSRF) is a type of attack on websites. With a successful CSRF attack, an attacker can mislead an authenticated user in a website to perform actions with inputs set by the attacker. 

This can have serious consequences like the loss of user confidence in the website and even fraud or theft of financial resources if the website under attack belongs to any financial realm.

In this article, we will understand:
- What constitutes a Cross Site Request Forgery (CSRF) attack
- How attackers craft a CSRF attack
- What makes websites vulnerable to a CSRF attack
- What are some methods to secure websites from CSRF attack

## What is CSRF?

New-age websites often need to fetch data from other websites for various purposes. For example, the website might call a Google Map API to display a map of the user's current location or render a video from youtube. These are examples of cross-site requests and can also be a target of CSRF attacks. 

When a website requests data from another website on behalf of a user, there are no security concerns when the request is unauthenticated.

CSRF attacks target websites that trust some form of authentication by users before they perform any actions. Attackers exploit this trust and send forged requests on behalf of the authenticated user. This illustration shows the making of a CSRF attack:

![CSRF intro](/assets/img/posts/csrf/csrf-intro.png)

As represented in this diagram, a Cross Site Request Forgery attack is roughly composed of two parts:

1. **Cross-Site**: The user is logged into a website and is tricked into clicking a link in a different website that belongs to the attacker or an email opened in the same browser. The link is crafted by the attacker in a way that it will submit a request to the website the user is logged in to. This represents the "cross-site" part of CSRF. 

2. **Request Forgery**: The request sent to the user's website is forged with values crafted by the attacker. When the victim user opens the link in the same browser, a forged request is sent to the website with values set by the attacker along with all the cookies that the victim has associated with that website. 

CSRF is considered a flaw in the [OWASP Top ten](https://owasp.org/www-project-top-ten/) Web Application Security Risks. OWASP Top Ten represents a broad consensus about the most critical security risks to web applications.

The OWASP website defines CSRF as:
> Cross-Site Request Forgery (CSRF) is an attack that forces an end user to execute unwanted actions on a web application in which they’re currently authenticated. With a little help from social engineering (such as sending a link via email or chat), an attacker may trick the users of a web application into executing actions of the attacker’s choosing.

## Example of CSRF Attack
Let us now understand the anatomy of a CSRF attack with the help of an example:

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
We can notice in this HTML that the form action posts to the vulnerable website `myfriendlybank.com` instead of the malicious website. In this example, the attacker sets the request parameters: `TransferAccount` and `Amount` to values that are unknown to the actual user.

4. The user is enticed into visiting the malicious website and clicking the submit button. The browser sends the user's authentication cookie to the server that was received from the server after login in step 2.

5. Since the website is vulnerable to CSRF attack, the forged request with the user's authentication cookie is processed, and can do anything that an authenticated user is allowed to do. In this example, transfer the amount to the attacker's account.

Although this example requires the user to click the submit button, the malicious website could have run JavaScript to submit the form without the user knowing anything about it.

This example although very trivial can be extended to scenarios where an attacker can perform additional damaging actions like changing the user's password and registered email address which will block their access completely.

## How does CSRF work?

A CSRF attack leverages the implicit trust placed in user session cookies by many web applications. these applications, once the user authenticates to an application and a session cookie is created on the user's system, all following transactions for that session are authenticated using that cookie including potential actions initiated by an attacker and simply "riding" the existing session cookie.
Let us now understand how CSRF works in greater detail. 

### Hijacking the Session Cookie
A CSRF attack exploits the behavior of a type of cookies called session cookies shared between a browser and server. HTTP requests are stateless due to which the server cannot distinguish between two requests sent by a browser. 

But there are many scenarios where we want the server to be able to relate one HTTP request with another. For example, a login request followed by a request to check account balance or transfer funds. The server will only allow these requests if the login request was successful. We call this group of requests as belonging to a session. 

Cookies are used to hold this session information. The server packages the session information for a particular client in a cookie and sends it to the client's browser. For each new request, the browser re-identifies itself by sending the cookie (with the session key) back to the server.

The attacker hijacks this cookie to send requests to the server. 

There are many ways for an attacker to try and exploit a CSRF vulnerability. An attacker constructs a CSRF attack through the following steps:

1. Identifying the Vulnerable site
2. Building an Exploit URL
3. Creating an Inducement for the Victim to Click the Exploit URL

### Identifying the Vulnerable site
Before planning a CSRF attack, the attacker needs to identify pieces of functionality that are of interest for example fund transfers. The attacker also needs to know a valid URL in the website, along with the corresponding patterns of valid requests accepted by the URL.

This URL should cause a state-changing action in the target application. Some examples of state-changing actions are:
- Update account balance
- Create a customer record
- Transfer money

In contrast to state-changing actions, an inquiry does not change any state in the server. For example, view user profile, view account balance, etc which do not update anything in the server.

The attacker also needs to find the right values for the URL parameters. Otherwise, the target application might reject the malicious request.

Some common techniques used to explore the vulnerable site are:

- **View HTML Source**: Check the HTML source of web pages to identify links or buttons that contain actions of interest.
- **Web Application Debugging Tools**: Analyze the information exchanged between the client and the server using web application debugging tools such as WebScarab, Tamper Data, or TamperIE
- **Network Sniffing Tools**: Analyze the information exchanged between the client and the server with a network sniffing tool such as Wireshark. 

Let us assume that the attacker has identified a website at https://myfriendlybank.com to try a CSRF attack. From this website, the attacker has found a URL https://myfriendlybank.com/account/transfer with CSRF vulnerabilities which is used to transfer funds.

### Building an Exploit URL
The attacker will next try to build an exploit URL for sharing with the victim. Let us assume that the transfer function in the application is built using a GET method to submit a transfer request. Accordingly, a legitimate  request to transfer 100 USD to another account with account number `1234567` will look like this:

GET https://myfriendlybank.com/account/transfer?amount=100&accountNumber=1234567 

The attacker will create an exploit URL to transfer `15,000` USD to another dubious account with account number `4567876` probably belonging to the attacker:

https://myfriendlybank.com/account/transfer?amount=15000&accountNumber=4567876

If the victim clicks this exploit URL, `15,000` USD will get transferred to the attacker's account.

### Creating an Inducement for the Victim to Click the Exploit URL
After creating the exploit URL, the attacker must also trick the victim user into clicking it. For this, the attacker creates an inducement and uses any social engineering attack methods to trick the victim user into clicking the malicious URL. Some examples of these methods are:
- including exploit HTML image elements onto forms
- placing an exploit URL on pages that are often accessed by the victim user while being logged into the application
- sending the exploit URL through email.

The following is an example of an image with an exploit URL:

<img src=“http://myfriendlybank.com/account/transfer?amount=5000&accountNumber=425654” width=“0” height=“0”>

This scenario includes an image tag in an attacker-crafted email to the victim user. Upon receiving it, the victim user's browser application opens this URL without any human intervention. As a result, without the victim user's permission, a forged request crafted by the attacker is sent to the web application at `myfriendlybank.com`. 

If the victim user has an active session opened with `myfriendlybank.com`, the application would treat this as an authorized amount transfer request coming from the victim user. It would then transfer an amount of `5000` to the account `425654` specified by an attacker.

### Presence of an Active Session
The victim user needs to have an active session with `myfriendlybank.com`. The success of a CSRF attack depends on a user’s session with a vulnerable application. The attack will only be successful if the user is in an active session with the vulnerable application.

## Preventing CSRF attacks

To prevent CSRF attacks, web applications need to build mechanisms to distinguish a legitimate request from a trusted user of a website from a forged request crafted by an attacker but sent by the trusted user. 

All the solutions to build defenses against CSRF attacks are built around this principle of sending something in the request that the forged request is unable to provide. Let us look at a few of those.

### Identifying Legitimate Requests with Anti-CSRF Token

An anti-CSRF token is a type of server-side CSRF protection. It is a random string shared between the user’s browser and the web application. An attacker creating a forged request will not have any knowledge about the anti-CSRF token. So the web application will reject the requests which do not have a matching value of anti-CSRF token which it had shared with the browser. 

Let us look at two common implementation techniques known as :
1. Synchronizer Token Pattern 
2. Double Submit Cookie

These two techniques essentially differ on whether the web application is stateful with the state saved on the server versus being stateless.

#### Synchronizer Token Pattern
A random token is generated by the web application and sent to the browser.The token can be generated once per user session or for each request. Per-request tokens are more secure than per-session tokens as the time range for an attacker to exploit the stolen tokens is minimal.

![CSRF token synchronizer](/assets/img/posts/csrf/csrf-token-synchronizer.png)

#### Double Submit Cookie

In this technique, the web application sets the token in a cookie instead of storing the token.The browser should be able to read the token from the cookie and send it as a request parameter.  On receiving the request, the web application verifies if the cookie value and the value sent as request parameter match. This cookie must be stored separately from the cookie used as session identifier.

When a user visits (even before authenticating to prevent login CSRF), the site should generate a (cryptographically strong) pseudorandom value and set it as a cookie on the user's machine separate from the session identifier. 

The site then requires that every transaction request include this pseudorandom value as a hidden form value (or other request parameter/header). If both of them match at server side, the server accepts it as legitimate request and if they don't, it would reject the request.

![CSRF token double submit](/assets/img/posts/csrf/csrf-token-double-submit.png)


The anti-CSRF token is usually stored inside a session variable. On a page, it is typically in a hidden field that is sent with the request.

If the values of the session variable and the hidden form field match, the web application accepts the request. If they do not match, the request is dropped. In this case, the attacker does not know the exact value of the hidden form field that is needed for the request to be accepted, so he cannot launch a CSRF attack. In fact, due to the same-origin policy, the attacker cannot even read the response that contains the token.

### Using the SameSite Flag in Cookies

The SameSite flag in cookies is a relatively new method of preventing CSRF attacks and improving web application security. In the above example, we saw that the malicious site could send a request to https://myfriendlybank.com/ together with a session cookie. This session cookie is unique for every user, so the web application uses it to distinguish users and to determine if they are logged in.

If the session cookie is marked as a SameSite cookie, it is only sent along with requests that originate from the same domain. Therefore, when `http://myfriendlybank.com` wants to make a POST request to `http://myfriendlybank/transfer`, it is allowed. However, the malicious website with a domain like `http://malicious.com/` cannot send `POST` requests to `http://myfriendlybank.com/transfer`. Since the session cookie originates from a different domain, it is not sent with the request.

## Defenses against CSRF 
As users, we can defend ourselves from falling victim to a CSRF attack by cultivating two simple web browsing habits:

1. We should log off from a website after using it. This will invalidate the cookies which the attacker sends in the exploit URL.
2. We should use different browsers, for example, one browser for accessing sensitive sites and another browser for random surfing.

As developers, we can use the following best practices other than the anti-CSRF token described earlier:
1. Configure lower session time out value invalidate the session after a period of inactivity
2. Logoff the user, after a period of inactivity and invalidate the session cookie. 
3. Seek confirmation from the user before processing any state-changing action with a confirmation dialog or a captcha.
5. Make it difficult for an attacker to know the structure of the URLs to attack


## Conclusion

CSRF attacks comprise a good percentage of web-based attacks. It is crucial to be aware of the vulnerabilities that could make our website a potential target for CSRF attacks and prevent these attacks by building proper CSRF defenses in our application.


