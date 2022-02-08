---
authors: [tom]
title: "Publishing Open Source Releases with Gradle"
categories: ["Java"]
date: 2017-12-04
description: "When working on an open source Java project, you always come to the point where 
          you want to share your work with the developer community. This article gives a 
          step-by-step guide on how to publish your artifacts Bintray."
image: images/stock/0038-package-1200x628-branded.jpg
url: guide-publishing-to-bintray-with-gradle
---



When working on an open source Java project, you always come to the point where 
you want to share your work with the developer community (at least that should be the goal). 
In the Java world
this is usually done by publishing your artifacts to a publicly accessible
Maven repository. This article gives a step-by-step guide on how to publish 
your artifacts to your own Maven Repository on Bintray.


{{% github "https://github.com/thombergs/diffparser" %}}

## Bintray vs. Maven Central
You might be asking why you should publish your artifacts to a custom repository
and not to [Maven Central](https://search.maven.org/), because Maven Central is THE Maven repository
that is used by default in most Maven and Gradle builds and thus is much more
accessible. The reason for this is that you can play around with your publishing
routine in your own repository first and THEN publish it to Maven Central from there
(or [JCenter](https://bintray.com/bintray/jcenter), for that matter, which is another well-known Maven repository).
Publishing from your own Bintray repository to Maven Central is supported by Bintray,
but will be covered in a follow-up article.

Another reason for uploading to Bintray and not to Maven Central is that you still
have control over your files even after uploading and publishing your files
whereas in Maven Central you lose all control after publishing (however, you should
be careful with editing already-published files!). 

## Create a Bintray Account
To publish artifacts on [Bintray](https://bintray.com), you naturally need an account there. I'm not going to describe
how to do that since if you're reading this article you should possess the skills
to sign up on a website by yourself :). 

## Create a Repository
Next, you need to create a repository. A repository on Bintray is actually just a smart
file host. When creating the repository, make sure that you select the type "Maven"
so Bintray knows that it's supposed to handle the artifacts we're going to upload as Maven artifacts.

## Obtain your API key
When signed in on Bintray, go to the "edit profile" page and click on "API Key" in the
menu. You will be shown your API key which we need later in the Gradle scripts to automatically
upload your artifacts.

## Set up your `build.gradle`
In your `build.gradle` set up some basics:

```groovy
plugins {
  id "com.jfrog.bintray" version "1.7.3"
  id "maven-publish"
  id "java"
}
    
buildscript {
  repositories {
    mavenLocal()
    mavenCentral()
    jcenter()
  }
}

repositories {
  mavenLocal()
  mavenCentral()
  jcenter()
}

version = '1.0.0'
```

The important parts are the [bintray plugin](https://github.com/bintray/gradle-bintray-plugin)
and the [maven-publish](https://docs.gradle.org/current/userguide/publishing_maven.html) plugin. 

The two `repositories` closures simply list the Maven repositories to be
searched for our project's dependencies and have nothing to do with publishing our artifacts.

## Build Sources and Javadoc Artifacts
When publishing an open source projects, you will want to publish a JAR containing the sources
and another JAR containing the javadoc together with your normal JAR. This helps developers using
your project since IDEs support downloading those JARs and displaying the sources directly
in the editor. Also, providing sources and javadoc is a requirement for publishing
on Maven Central, so we can as well do it now.

Add the following lines to your `build.gradle`:

```groovy
task sourcesJar(type: Jar, dependsOn: classes) {
    classifier = 'sources'
    from sourceSets.main.allSource
}

javadoc.failOnError = false
task javadocJar(type: Jar, dependsOn: javadoc) {
    classifier = 'javadoc'
    from javadoc.destinationDir
}

artifacts {
    archives sourcesJar
    archives javadocJar
}
```

A note on `javadoc.failOnError = false`: by default, the javadoc task will fail on things like 
empty paragraphs (`</p>`) which can be very annoying. All IDEs and tools support
them, but the javadoc generator still fails. Feel free to keep this check and fix all your Javadoc "errors", if you feel 
masochistic today, though :).

## Define what to publish
Next, we want to define what artifacts we actually want to publish and provide some metadata
on them.

```groovy
def pomConfig = {
    licenses {
        license {
            name "The Apache Software License, Version 2.0"
            url "http://www.apache.org/licenses/LICENSE-2.0.txt"
            distribution "repo"
        }
    }
    developers {
        developer {
            id "thombergs"
            name "Tom Hombergs"
            email "tom.hombergs@gmail.com"
        }
    }

    scm {
        url "https://github.com/thombergs/myAwesomeLib"
    }
}

publishing {
    publications {
        mavenPublication(MavenPublication) {
            from components.java
            artifact sourcesJar {
                classifier "sources"
            }
            artifact javadocJar {
                classifier "javadoc"
            }
            groupId 'io.reflectoring'
            artifactId 'myAwesomeLib'
            version '1.0.0'
            pom.withXml {
                def root = asNode()
                root.appendNode('description', 'An AWESOME lib. Really!')
                root.appendNode('name', 'My Awesome Lib')
                root.appendNode('url', 'https://github.com/thombergs/myAwesomeLib')
                root.children().last() + pomConfig
            }
        }
    }
}
```

In the `pomConfig` variable, we simply provide some metadata that is put into the `pom.xml` when publishing.
The interesting part is the `publishing` closure which is provided by the `maven-publish` plugin we applied
before. Here, we define a publication called `BintrayPublication` (choose your own name if you wish). This
publication should contain the default JAR file (`components.java`) as well as the sources and the javadoc
JARs. Also, we provide the Maven coordinates and add the information from `pomConfig` above.

## Provide Bintray-specific Information
Finally, the part where the action is. Add the following to your `build.gradle` to enable the publishing
to Bintray: 

```groovy
bintray {
	user = System.getProperty('bintray.user')
	key = System.getProperty('bintray.key')
	publications = ['mavenPublication']

	pkg {
		repo = 'myAwesomeLib'
		name = 'myAwesomeLib'
		userOrg = 'reflectoring'
		licenses = ['Apache-2.0']
		vcsUrl = 'https://github.com/thombergs/my-awesome-lib.git'
		version {
			name = '1.0.0'
			desc = '1.0.0'
			released  = new Date()
		}
	}

}
```

The `user` and `key` are read from system properties so that you don't have to add them in your script
for everyone to read. You can later pass those properties via command line.

In the next line, we reference the `mavenPublication` we defined earlier, thus giving the bintray
plugin (almost) all the information it needs to publish our artifacts.

In the `pkg` closure, we define some additional information for the Bintray "package". A package in Bintray is
actually nothing more than a "folder" within your repository which you can use to structure your
artifacts. For example, if you have a multi-module build and want to publish a couple of them
into the same repository, you could create a package for each of them. 

## Upload!
You can run the build and upload the artifacts on Bintray by running

```text
./gradlew bintrayUpload -Dbintray.user=<YOUR_USER_NAME> -Dbintray.key=<YOUR_API_KEY>
```
 
## Publish!

The files have now been uploaded to Bintray, but by default they have not been published to the Maven repository yet.
You can do this manually for each new version on the Bintray site. Going to the site, you should see
a notice like this:

{{% image alt="Notice" src="images/posts/guide-publishing-to-bintray-with-gradle/notice.png" %}}

Click on publish and your files should be published for real and be publicly accessible.

Alternatively, you can set up the bintray plugin to publish the files automatically after uploading, by setting `publish = true`.
For a complete list of the plugin options have a look at the [plugin DSL](https://github.com/bintray/gradle-bintray-plugin#plugin-dsl).

## Access your Artifacts from a Gradle Build
Once the artifacts are published for real you can add them as dependencies in a Gradle build.
You just need to add your Bintray Maven repository to the repositories. In the case of the 
example above, the following would have to be added:

```groovy
repositories {
    maven {
        url  "https://dl.bintray.com/thombergs/myAwesomeLib" 
    }
}

dependencies {
    compile "io.reflectoring:myAwesomeLib:1.0.0"
}
```  

You can view the URL of your own repository on the Bintray site by clicking the button "Set Me Up!".

## What next?
Now you can tell everyone how to access your personal Maven repository to use your library.
However, some people are sceptical to include custom Maven repositories into their builds.
Also, there's probably a whole lot of companies out there which have a proxy that simply
does not allow any Maven repository to be accessed.

So, as a next step, you might want to publish your artifacts to the well-known JCenter or Maven Central
repositories. And to have it automated, you may want [integrate the publishing step 
into a CI tool](/fully-automated-open-source-release-chain/) (for example, to publish snapshots
with every CI build). 
