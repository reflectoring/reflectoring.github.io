In this article, we'll understand one of the high-risk security vulnerabilities, that is, Cross-Site Registry Forgery (CSRF), what it is, how it impacts, attacks/works, and how to prevent/fix it using different techniques.

# What is Cross-Site Request Forgery?

**Cross-Site Request Forgery, also known as CSRF, Sea Surf, Session riding attacks or XSRF**, is a type of malicious attack of a website where unauthorized commands are transmitted from a user that the web application trusts. A CSRF attack forces users to carry out unwanted attacks on websites and applications within which they are already authenticated. This allows an attacker to craft malicious content to trick users who are already logged in and authenticated on a legitimate website to perform actions that they do not intend to and may remain unaware of. 

CSRF is considered a sleeping giant in the world of web application security. CSRF attacks are also very difficult to detect because they look very much like a legitimate request from a trusted user. It is also a common attack, which is why it has secured a place on the ``Open Web Application Security Project (OWASP) Top 10`` list several times in a row. However, an exploited [Cross-Site Scripting (XSS)](https://owasp.org/www-project-top-ten/2017/A7_2017-Cross-Site_Scripting_(XSS)) is more of a risk than any CSRF vulnerability because CSRF attacks a major limitation. 

In below section, we'll understand the difference between CSRF and XSS

# Difference Between CSRF and Cross-Site Scripting(XSS)

CSRF attacks are often confused with XSS (Cross-Site Scripting) attacks. Both attacks have some similarities, such as they are client-side attacks and require the user to complete an action like a wicked/atrocious link or visiting a site. However, some indefinite characteristics differentiate XSS and CSRF attacks.

**Cross-site Request Forgery(CSRF)** allows an attacker to instigate a victim user to perform malicious actions that they do not intend do.

On the other hand, **Cross-site Scripting(XSS)** allows an attacker to execute arbitary Javascript code within the browser of a victim user.

CSRF often only applies to a subset of actions that a user is able to perform. Conversely, a successful XSS exploit can normally provoke a user to perform any action that the user is able to perform, regardless of the functionality in which the vulnerability arises.

CSRF can be described as a **"one-way"** vulnerability, in that while an attacker can instigate the victim to issue an HTTP request, they cannot retrieve the response from that request. Conversely, XSS is **"two-way"**, in that the attacker's injected script can issue arbitrary script reqeuests, read the responses, and withdraw data to an external domain of the attacker's choosing.


# Possible Malicious Uses of CSRF

Cross-site request forgery attacks lie in the web application the user is logged into and mainly targeted at the credentials management flow. Below are the possible malicious uses of CSRF:

* CSRF attacks are often targeted, relying on [Social Engineering](https://wiki.owasp.org/index.php/Social_Engineering) like a phishing email, a chat link, or a fake alert to cause users to load the unauthorized request, which is then passed on to the site where they are authenticated.

* CSRF attacks generally focus on **state-changing requests** such as changing credentials, transferring funds from online banking, password change, or deleting an account that is vulnerable to CSRF. The inherent problem with CSRF attacks is that they use the HTTP protocol exactly as it was designed to work.

* For administrator-level users targeted with CSRF, this type of flaw can open vulnerabilities to a web application or site overall by adding new administrator accounts or changing administrator login information.

In next section, we'll understand how CSRF attacks work.

# How is Cross-Site Request Forgery Attacks Work?

CSRF attacks force web application while user authentication. Most web applications use cookies to identify logged in users. Once a webserver has authenticated a user successfully, the browser will get an unique identity login cookie representing the user's current session. This means that every request sent by their web browser to the targeted site will include those cookies or credentials, and it is an important part of the functionality of most sites that require a user to log in. 

The cookie is used to remember the user's logged-in status, so for every page they visit within the application does not requiring them to authenticate again with the user credentials. The session will be closed/removed when the user logs out of the web application, or they close the browser. Once web application or site is undercontrol of attacker, the browser to carry out some malicious actions that the user does not intend to do.

There are numerous ways in which an end user can be tricked into loading information from or submitting information to a web application. In order to execute an attack, we must first understand how to generate a valid malicious request for our victim to execute. 

Let us consider the following example: ``Tom`` wishes to transfer $1000 to ``Puneeth`` using the bank.com web application that is vulnerable to CSRF. ``James``, an attacker, wants to trick ``Tom`` into sending the money to his instead. The attack will comprise the following steps:

1. Building an exploit URL or script
2. Tricking Tom into executing the action with Social Engineering

## CSRF attack using HTTP GET Request

If the application was designed to primarily use GET requests to transfer parameters and execute actions, the money transfer operation might be reduced to a request like:
 
```
 GET http://bank.com/onlinetransfer?account=Puneeth&amount=1000 HTTP/1.1
```
James now decides to exploit this web application vulnerability using Tom as his victim. James first constructs the following exploit URL which will transfer $100,000 from Tom's account to his account. He takes the original command URL and replaces the beneficiary name with himself, raising the transfer amount significantly at the same time:

```
http://bank.com/onlinetransfer?account=JAMES&amount=100000
```
Next, James needs to trick Tom into clicking the above malicious URL. James can use various social engineering techniques to lure Tom into executing the URL when he's logged into the web banking application.

These are the common techniques he can use:
  * Embed the exploit URL into HTML content and send it to Tom through email
  * Planting an exploit URL or script on pages Tom often visits while logged into the online banking application

The malicious URL could be disguised as a normal link, instigating Tom to click it:

```
<a href="http://bank.com/onlinetransfer?account=JAMES&amount=100000">Click here now!</a>
```
Or as a fake image:

```
<img src="http://bank.com/onlinetransfer?account=JAMES&amount=100000" width="0" height="0" border="0">
```
If this image tag were included in the email, Tom wouldn't see anything. However, the browser *will still* submit the request to bank.com without any visual indication that the transfer has taken place.

One of the real time example occured with [Netflix in 2006](https://seclists.org/fulldisclosure/2006/Oct/316); if you used the "Remember Me" functionality and came across any web page that the had
```
<img src="http://www.netflix.com/AddToQueue?movieid=70011204" width="1" height="1" border="0">
```
embedding in it, a copy of "SpongeBob Squarepants" would be added to your Netflix queue

Another real life examples of CSRF attack on an application using GET was a [uTorrent exploit](https://www.ghacks.net/2008/01/17/dos-vulnerability-in-utorrent-and-bittorrent/) in 2008 that was used on a mass scale to download malware.

## CSRF attack using HTTP POST Request

The only difference between GET and POST attacks is how the attack is being executed by the victim. Let's assume the bank now uses POST and the vulnerable request looks like this:

```
POST http://bank.com/onlinetransfer HTTP/1.1

account=Puneeth&amount=10000

```
Such a request cannot be delivered using standard A or img tags, but can be delivered using a *form* tag:

```
<form action="<nowiki>http://bank.com/onlinetransfer</nowiki>" method="POST">
<input type="hidden" name="account" value="JAMES"/>
<input type="hidden" name="amount" value="100000"/>
<input type="submit" value="View my pictures"/>
</form>
```
This form will require the user to click on the submit button, but this can be also executed automatically using JavaScript:

```
<body onload="document.forms[0].submit()">
   <form action="http://bank.com/onlinetransfer" method="POST">
     <input type="hidden" name="account" value="JAMES"/>
     <input type="hidden" name="amount" value="$10000"/>
     <input type="submit" value="Click here now!"/>
   </form>
 </body>
 
```
## Other HTTP Methods

Modern web application API's frequently use other HTTP methods, such as PUT or DELETE. Let's assume the vulnerable bank uses PUT that takes a JSON block as an argument:

```
PUT http://bank.com/onlinetransfer HTTP/1.1

{ "account":"Puneeth", "amount":100000 }

```
Such requests can be executed with JavaScript embedded into an exploit page:

```
<script>
     function put() {
      var x = new XMLHttpRequest();
      x.open("PUT","http://bank.com/onlinetransfer",true);
      x.setRequestHeader("Content-Type", "application/json"); 
      x.send(JSON.stringify({"account":"Puneeth", "amount":10000})); 
     }
</script>
<body onload="put()">
```

By default, the most modern browsers enable the [same-origin policy](https://en.wikipedia.org/wiki/Same-origin_policy) restriction. The restriction is enabled unless the target web site explicitly opens up cross-origin requests from the attacker's origin by using [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) with the following header:

```
Access-Control-Allow-Origin: *
```
You can find more information at this link on [latest cross-site request forgery (CSRF) security news](https://portswigger.net/daily-swig/csrf)

In next section, we'll understand how to prevent/fix CSRF.

# How to Prevent/Fix CSRF Vulnerabilities?

We can implement different vulnerability techinques to strengthen our web applications's security and minimize in reducing the possibility of CSRF attacks. Most CRSF techniques work by embedding additional authentication data into requests the web application to detect requests from unauthorized locations.

Let's us discuss CSRF prevention techniques:

## Synchronized token pattern or CSRF Tokens

**Synchronizer token pattern (STP)** or CSRF token, is a technique where a token, secret and unique value for each request, is embedded by the web application in all HTML forms and verified on the server side. CSRF tokens should be:

 * Unique per user session
 * Secret
 * Unpredicatable (large random generated by a [secure method](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html#rule---use-cryptographically-secure-pseudo-random-number-generators-csprng))

CSRF tokens prevent CSRF because without token, attacker cannot create a valid requests to the backend server. **CSRF tokens should not be transmitted using cookies.**

The CSRF token can be added through hidden fields, headers, and can be used with forms, and Ajax calls.

Let's take a look at how our example would change. Assume the randomly generated token is present in an HTTP parameter named ``_csrf``. For example, the request to transfer money would look like this:


```html
POST /transfer HTTP/1.1
Host: bank.example.com
Cookie: JSESSIONID=randomid; Domain=bank.example.com; Secure; HttpOnly
Content-Type: application/x-www-form-urlencoded

amount=10000.00&routingNumber=1234&account=9876&_csrf=<secure-random>
```
We have added the ``_csrf`` parameter with a random value. Now the attacker website will not be able to guess the correct value for the ``_csrf`` parameter and the request will not proceed further. Because the server compares the actual token to the expected token.

CSRF token is the most compatible as it only relies on HTML, however it will burden on server side while validating of the token on each request. Hence by using session CSRF token instead of per request CSRF token will reduce the burden for server side.

There is an insightful explanation being discussed in [StackOverflow](https://stackoverflow.com/questions/16049721/how-is-using-synchronizer-token-pattern-to-prevent-csrf-safe).

## Cookie-to-header token

Major web applications that use JavaScript for the majority of their operations may use the cookie-to-header anti-CSRF technique:

* Since for the initial request we don't have an associated server session, the web application sets a cookie which is scoped appropriately so that it should be not be provided during CORS requests. Hence the cookie contains a random token which may remain the same for up the entire web session.

```javascript
Set-Cookie: __Host-csrf_token=i9BSjD4b8KVok4uw6RftR34Wgp2BFeeql; Expires=Thu, 29-Apr-2021 10:25:33 GMT; Max-Age=31449600; Path=/; SameSite=Lax; Secure
```
* Since JavaScript works on the client side, reads its value and copies it into a custom HTTP header sent with each transactional request.

```javascript
X-Csrf-Token: i9BSjD4b8KVok4uw6RftR34Wgp2BFeeql
```
* The server validates presence and integrity of the token and always expect a valid X-Csrf-Token header.

The CSRF token should be unique and unpredictable. It may be generated randomly, or it may derived from the session token using [HMAC](https://en.wikipedia.org/wiki/HMAC):

```html
csrf_token = HMAC(session_token, application_secret)
```
The CSRF token cookie must not have [httpOnly](https://en.wikipedia.org/wiki/HTTP_cookie#HttpOnly_cookie) flag, as it is intended to be read by the JavaScript by design. Most of the modern JavaScript frameworks, such as Angular, ReactJs has been implemented by this techinque. Because the token remains constant over the entire user session.

## Double Submit Cookie

In this technique, it won't involve JavaScript, a website can set a CSRF token as a cookie, and also embed it as a hidden field in each HTML form. So when the form is submitted, the website can check that the cookie token matches the form token. Since same-origin policy prevents an attacker from reading or setting cookies on the target domain, so they cannot put a valid token in their manual form.

The token does not need to be stored on the server, that is the main advantage over the Synchronizer token pattern.

## SameSite Cookie attribute

The same-site cookie attribute can be used to disable 3rd party usage for a specific cookie. It is set by the server when setting the cookie, and requests the browser to only send the cookie in a first-party context, i.e. when we are using the web application directly. When another site tries to request something from the web application, the cookie is not sent. Hence CSRF is impossible, because an attacker cannot use a user's session from his website anymore.

Below is the approach we will be doing it from serverside. The server can set a same-site cookie by adding the ``SameSite=...`` attribute to the ``Set-Cookie`` header:

```html
Set-Cookie: JSESSIONID=xxxxx; SameSite=Strict
Set-Cookie: JSESSIONID=xxxxx; SameSite=Lax
```
Possible values for the ``SameSite`` attribute: 

* Strict - This value will prevent the cookie from being sent by the browser to the target site in all cross-site browsing contexts, even when following a regular link. 
For example, the user will not be able to access a private GitHub project posted on a corporate discussion forum or email, because Github will not receive the session cookie. 
A bank website however most likely doesn't want to allow any transactional pages to be linked from external sites so the ``strict`` mode would be the most appropriate.

* Lax - In this mode, some cross-site usage is allowed. Specifically if the request is a GET request and the request is top-level. Top-level means that the URL in the address bar changes because of this navigation. However, this is not for iFrames, images or XMLHttpRequests.

The default value of the SameSite attribute differs with each browser, therefore it is advised to explicitly set the value of the attribute.

## Client-side safeguards

Browser extensions such as RequestPolicy can prevent CSRF by providing a default-deny policy for cross-site requests. However, this can significantly interfere with the normal operation of many websites. The CsFire extension can mitigate the impact of CSRF with less impact on normal browsing, by removing authentication information from cross-site requests.

The Self destructing cookies extension for Firefox does not directly protect from CSRF, but can minimize the attack window, by deleting cookies as soon they are no longer associated with an open tab.

'NoScript' is also a useful add-on that enables us to prevent and block scripts from running, particularly malicious scripts. Disabling scripting altogether is a common protection method used.

## Other techniques

There are various other techniques have been used for preventing CSRF:

* By verifying whether request's header contain ``X-Requested-With``, or checking the HTTP ``Referer`` header and/or HTTP ``Origin`` header. This verification is insecure a combination of browser plugins and redirects can allow an attacker to provide custom HTTP headers on a request to any website, hence allowing a forged request.
* By checking the HTTP ``Referer`` header to see if the request is coming from an authorized page.
* The Bearer Authentication is a good way to prevent CSRF, as there is no way for an attacker to know the value of a valid token of an authenticated user. 

# Conclusion

In this article, we looked at what is CSRF, how CSRF attack works and different preventing techniques for CSRF vulnerability. 

You can find concise information in the [CSRF Prevention CheatSheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

According to **Open Web Application Security Project** ([OWASP](https://owasp.org/)), 10 more high-risk vulnerabilities which is having more impact than CSRF. 

You can find more information in the [reference link](https://sucuri.net/guides/owasp-top-10-security-vulnerabilities-2021/)

