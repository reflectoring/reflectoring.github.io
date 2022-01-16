---
authors: [tom]
title: Getting the current Subversion Revision Number in Gradle
categories: ["Java"]
date: 2016-11-26
excerpt: "A tutorial showing how to use the subversion Revision number in a Gradle build."
image: images/stock/0050-git-1200x628-branded.jpg
url: getting-svn-revision-in-gradle
---



A common use case for build tools like Ant, Maven or Gradle is to retrieve the current revision number of the project sources in the Version Control System (VCS), in many cases Subversion (SVN). This revision number is then used in the file names of the build artifacts, for example. As mature build tools, Ant and Maven provide plugins to access the current revision number of the SVN working copy. But how about Gradle?
Having recently moved from Ant to Gradle in a ~500.000 LOC Java project, I can say that Gradle offers a lot of well-thought-out features that make life easier. However, getting the Subversion revision number of a project workspace is not one of them. It's remarkably easy to do it yourself, though, as shown in the code snippet below.

```groovy
import org.tmatesoft.svn.core.wc.*

buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {
        classpath group: 'org.tmatesoft.svnkit', name: 'svnkit', version: '1.7.11'
    }
}

def getSvnRevision(){
    ISVNOptions options = SVNWCUtil.createDefaultOptions(true);
    SVNClientManager clientManager = SVNClientManager.newInstance(options);
    SVNStatusClient statusClient = clientManager.getStatusClient();
    SVNStatus status = statusClient.doStatus(projectDir, false);
    SVNRevision revision = status.getRevision();
    return revision.getNumber();
}

allprojects {
    version = '1.2.3.' + getSvnRevision()
}
```

Using the `buildscript` closure you can define dependencies that are only available in your build script (i.e. these dependencies do not spill into the dependencies of your project). Using this way, you can add the dependency to tmatesoft's SVNKit to your build. SVNKit provides a Java API to Subversion funcionality.

By defining a function (named `getSvnRevision()` in the snippet above), you can then simply use SVNKit to retrieve the current SVN revision number from your working copy. This function can then be called anywhere in your Gradle build script. In the case of the snippet above, I used it to append the revision number to a standard major/minor/bugfix versioning pattern. This complete version number can then be used in Gradle subprojects.
