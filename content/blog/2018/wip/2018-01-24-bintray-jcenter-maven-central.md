---
title: "Publishing Open Source Releases to JCenter and Maven Central"
categories: ["Software Craft"]
modified: 2018-01-24
excerpt: "For your open source projects to be accessible, it's worthwile to publish them   
          to JCenter and / or Maven Central. This article explains how to
          publish a release from your Bintray repository to JCenter and Maven Central."
image:
  auto: 0038-package
---



In previous articles, I discussed [how to publish snapshots](/publish-snapshots-with-gradle/) 
to oss.jfrog.org and [how to publish releases to Bintray](/guide-publishing-to-bintray-with-gradle/) using 
Gradle as a build tool. While this is very helpful already, you can get better exposure  
for your release by publishing it to the [JCenter](https://bintray.com/bintray/jcenter)
and / or [Maven Central](https://search.maven.org/) repositories
because those are widely known and supported by build tools. This article explains how to
publish a release from your Bintray repository to JCenter and Maven Central.

{% capture notice %}
You can see a working example of the setup described in this article in my 
[diffparser](https://github.com/thombergs/diffparser) project on Github!

{% endcapture %}
{% assign text = notice | markdownify %}
{% include github-project.html text=text %}

## JCenter vs. Maven Central
Before we go into the details of publishing to JCenter and Maven Central, let's disuss the difference
between the two. Both are publicly available Maven repositories that host releases of open source
libraries. 

Maven Central is operated by Sonatype, the company behind the Nexus software that
is widely used to host Maven repositories (and hosts Maven Central itself). 

JCenter is operated
by JFrog, the company that created Bintray and Artifactory (which is used to host JCenter). 
JCenter is younger than Maven Central, giving it an edge in terms of user experience and 
simple workflows because the developers had more time to learn.

Since JCenter is a mirror of Maven Central that contains everything Maven Central contains plus some
extra, you could simply include JCenter into your build tools and get access to all releases you could wish for.
However, Maven Central is still more widely known and supported out-of-the-box in more build tools,
so you might want to publish your release in both repositories.

In the following, we will discuss the steps necessary to synchronize a repository on Bintray 
with JCenter and Maven Central so that all releases to that repository are automatically published 
to both public repositories. If you don't have uploaded your release to Bintray yet,
read [this article](/guide-publishing-to-bintray-with-gradle/) which explains the necessary steps.

## Publish to JCenter

Syncing a Bintray repository to JCenter is easy as pie. Simply go to your package in the Bintray UI and
klick the button "Add to JCenter". In the dialog you can also check the checkbox "host my snapshot artifacts on
oss.jfrog.org" to be able to publish snapshots (more on snapshots [here](/publish-snapshots-with-gradle/)). 

Submit the form and wait until you get a response. This may take a working day or so, since the approval is a
manual process. Then, you'll find a response in your inbox on Bintray and you're ready to publish to JCenter.
Every time you publish an artifact to Bintray, it will automatically be mirrored to JCenter without anything 
else to do. 

To publish **manually**, click the "Publish" link shown below after you uploaded some files.

![publish manually](/assets/img/posts/bintray-jcenter-maven-central/bintray-publish-manually.png)

To publish **automatically** from a Gradle build, add the `publish` flag to the bintray configuration:

```groovy
bintray {
    ...
    pkg {
      ...
    }
    publish = true
}
``` 

## Publish to Maven Central

Syncing with Maven Central requires a little more effort. Here's what to do:

### Set up a Sonatype Account

Maven Central is hosted on a Nexus instance that requires a login to publish releases.
Thus, you need to register and request the group name you want to publish your artifacts
under. [This guide](http://central.sonatype.org/pages/ossrh-guide.html) 
explains the necessary steps. There is a manual process involved on Sonatype's side so
be patient :). 

### Link Your Bintray Account with Your Sonatype Account

Next, you can add your Sonatype credentials to your Bintray Account under "Edit Profile -> Accounts".

If you're not comfortable with trusting your Sonatype credentials to Bintray, you can also
enter the credentials each time you want to sync your repository in the step "[Sync with Maven Central](#sync-with-maven-central)".

Next, we need to sign our artifacts, since that is a requirement for all artifacts published on
Maven Central. 

### Sign with Bintray's Key

The easy way to sign your artifacts is to let Bintray do the work. Simply check 
"GPG sign uploaded files using Bintray's public/private key pair." in the settings of
your Bintray repository. Done.

### Sign with your own Key

If you want to sign your artifacts with your own key, you first need to 
[create a GPG key pair](https://www.gnupg.org/gph/en/manual/c14.html) and add the public
and private keys to your Bintray profile under "Edit Profile -> GPG Signing".

Additionally, we need to add the `gpg` closure to the Bintray gradle plugin so that
when gradle publishes artifacts to Bintray, they are automatically signed with
the private key associated to your Bintray profile:

```groovy
bintray {
    ...
    pkg {
        ...
        version {
            ...
            gpg {
                sign = true
            }
        }
    }

    publish = true
}
```

For a full example have a look at my [diffparser project](https://github.com/thombergs/diffparser/blob/master/build.gradle).

Note that the key pair you upload to your Bintray profile should be a special key pair for exactly the purpose
of publishing your artifacts through Bintray. You're giving away your private key, after all, so you don't want
it to be a key that is also used for something else.

Again, if you don't feel comfortable with providing a private key to Bintray, you can use a Gradle plugin
like the [Signing Plugin](https://docs.gradle.org/current/userguide/signing_plugin.html) to create the 
signatures from the Gradle build on your machine or your CI server (however, then you still have to provide the private key
to the CI server, which probably is not much better...).

### Sync with Maven Central

Once the above steps are taken, navigate to the package you want to publish in the Bintray UI. Open
the "Maven Central" tab and click on "Sync". You may have to wait a couple minutes and then the Bintray
UI shows if the syncing was successful. Note that you have to hit this button manually each time you want to
release a new version to Maven Central.

## Conclusion

This article discussed the steps necessary to sync a Bintray package to JCenter and Maven Central
to get the best exposure for your open source releases. Syncing to JCenter is easier than
syncing to Maven Central, but to get even more exposure, it might still be worth it to take the steps to 
also publish to Maven Central.
