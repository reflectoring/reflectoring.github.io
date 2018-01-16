---
title: Autostart for your Spring Boot Application
categories: [frameworks]
modified: 2018-01-14
author: david
tags: [winsw, spring, windows, autostart]
comments: true
ads: false
---
A few months ago I was asked to find a solution for starting and stopping a Spring Boot application under Windows **automatically** together with the computer this application was running on. After doing some research I found a nice fitting and open source solution with [**WinSW**](https://github.com/kohsuke/winsw).

As you can read on the Github page of WinSW it "is an executable binary, which can be used to wrap and manage a custom process as a Windows service". This windows service can be used to automatically start/stop your application on computer startup/shutdown. After downloading the binary (you can find it [here](http://repo.jenkins-ci.org/releases/com/sun/winsw/winsw/)) you have to perform the following simple steps to install your own custom windows service.

# Name your Service
First you take the downloaded **winsw-2.1.2-bin.exe** file and rename it to the name of your service. In this example I will call this **MyCustomService.exe**. 

# Configuration File
Next, you have to create a new **MyCustomService.xml** file and place it right next to the executable (it is mandatory that the file name is the same). This xml file holds all the configuration for your custom windows service. It could look like the following example:

```xml
<service>
    <id>MyCustomService</id> <!-- must be unique -->
    <name>MyCustomService</name>
    <description>This service runs my custom service.</description>
    <executable>java</executable>
    <arguments>-jar "%BASE%\myCustomService.jar"</arguments>
    <logpath>%BASE%\log</logpath>
    <log mode="roll-by-time">
    <pattern>yyyyMMdd</pattern>
    <download from="http://www.example.de/spring-application/myCustomService.jar" 
        to="%BASE%\myCustomService.jar"
        auth="basic" unsecureAuth="true"
        user="aUser" password="aPassw0rd"/>
    </log>
</service>
```

This configurations basically tells the windows service to:

1. Download the jar file from the given URL and place it in the current folder
2. Execute the just downloaded jar by executing the command `java -jar myCustomService.jar`
3. Save all logs into the `log` folder (for more details about logging [click here](https://github.com/kohsuke/winsw/blob/master/doc/loggingAndErrorReporting.md))

# Install the Service
To finally install the service as a Windows service you open your command line in the current folder and execute `MyCustomService.exe install`. After the installation you can directly test your service by executing `MyCustomService.exe test`. Now you can manage this service like any other default windows service. To put it in the autostart you have to navigate to your Windows services, select the newly service and set the **Startup type** to **Automatic**.

# Conclusion
As seen in this short example **WinSW** can be used not only for executing java programs automatically on Windows startup but also for updating your programs automatically. In case you need to update this jar file on multiple Windows clients this can be a pretty neat feature, because you only have to replace the jar hosted on `http://www.example.de/spring-application/myCustomService.jar` and restart the computers.
