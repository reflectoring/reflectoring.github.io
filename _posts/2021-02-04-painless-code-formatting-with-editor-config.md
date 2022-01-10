---
title: "Painless Code Formatting with EditorConfig"
categories: ["Java"]
date: 2021-02-15 00:00:00 +1100
modified: 2021-02-15 00:00:00 +1100
author: zeddysoft
excerpt: "As Java developers working in a team on a project, we need a consistent coding style in our project to enhance readability and make our code a lot cleaner and uniform - that's where EditorConfig comes into play"
image:
  auto: 0096-tools
---

Are you working on a project with other developers where reading code is not as fun as you would want because of inconsistent coding styles? In this article, we'll have a look at how to achieve painless code formatting with EditorConfig.

## The Challenges of Code Formatting

I joined a new team almost a year ago and after my onboarding with other engineers across several of their codebases, it was time to start making code contributions. I was using IntelliJ IDEA since most of the codebases I'm working on revolve around Java.

My initial pull request had a few bugs which I fixed but the ones that seemed distracting were comments around spacing and tabs. I was always having PR comments on spacing/indentation and it became a headache when in one of my PRs, I had several such comments.

The issue here was that some files in the repository I worked with use space indentation while the newer files use tab indentation. But after checking out the code with my IDE whose default setting is tabs, all of my changes in any file used that same tab indentation and that was where the problem started.

It wasn't too much of an issue for me while working locally in my IDE but since I work in a team where other Engineers would need to review my code, having consistent coding styles across files became very important.

As a short-term fix, I would always confirm the indentation style being used by each file I made changes to and then tweak my IDE indentation style to be the same. This amounts to unnecessary extra work and when you add up the time spent doing this per PR that has indentation issues, you would realize it's a lot of time that could have been spent doing more productive tasks.

This problem is exactly what EditorConfig solves.

**EditorConfig allows us to define commonly used coding styles** in a file that can easily be used across several IDEs to enforce consistent coding styles among several developers working on the same codebase, thus leading to less friction in your team.

## Using EditorConfig

With EditorConfig, we can define whether we want our indentation style to be tabs or spaces, what should be the indentation size (the most common size I have seen is 4), and other properties that we will be discussing in the next section.

Since there are lot of IDEs and we cannot touch all of them, I have selected two IDEs: 

* IntelliJ IDEA, which comes with native support for EditorConfig and
* Eclipse, which requires a plugin to be downloaded for it to work properly. 

For a complete list of supported IDEs (those requiring plugins and those with native support), please check the [official website](https://editorconfig.org/).

### Using EditorConfig with IntelliJ

IntelliJ comes with native support for EditorConfig, which means that we do not have to install a plugin to make it work. To get started, we need to create a file named `.editorconfig` in the root folder of our project and define the coding styles we need.

Since I would like my Java code to use tab indentation with a tab size of 4, the UTF-8 character set, and trim any trailing whitespaces in my code, I will define the following properties in the `.editorconfig` file to achieve this:

```
# Topmost editor config file
root = true

# Custom Coding Styles for Java files
[*.java]

# The other allowed value you can use is space
indent_style = tab 

# You can play with this value and set it to how
# many characters you want your indentation to be
indent_size = 4

# Character set to be used in java files.
charset = utf-8 
trim_trailing_whitespace = true
```

In the snippet above, we have defined two major sections: the root section and the Java style section. 

We have specified the **root** value to be *true* which means that when a file is opened, editorConfig will start searching for `.editorconfig` files starting from the current directory going upwards in the directory structure. The search will only stop when it has reached the root directory of the project or when it sees a `.editorconfig` file with root value set to true.

EditorConfig applies styles in a top down fashion, so if we have several `.editorconfig` files in our project with some duplicated properties, the closest `.editorconfig` file takes precedence.

For the Java section, we have defined a pattern `[*.java]` to apply the config to all java files. If your requirement is to match some other type of files with a different extension, a complete list of wildcard patterns is available on the [official website](https://editorconfig.org/).

To apply the EditorConfig styles to all Java classes in our IntelliJ project, as shown in the screenshots below, we click on the *Code* tab and select *Reformat Code* from the list of options. A dialog box should appear, and we can click on the *Run* button to apply our style changes. 

Step 1:
![IntelliJ Reformat Window]({{ base }}/assets/img/posts/painless-code-formatting-with-editor-config/intellij-reformat.png)

Step 2:
![IntelliJ Reformat Window]({{ base }}/assets/img/posts/painless-code-formatting-with-editor-config/intellij-run.png)

Once done, we should see all our Java source files neatly formatted according to the styles we have defined in `.editorconfig` file.

A complete list of universally supported properties across IDEs can be found in the [official reference](https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#current-universal-properties).

### Using EditorConfig with Eclipse
Since Eclipse does not support EditorConfig out of the box, we have to install a plugin to make this work. Fortunately, it's not too much of a hassle.

To install the EditorConfig plugin in Eclipse, follow the [official installation guide](https://github.com/ncjones/editorconfig-eclipse#installation). Once it is installed in our workspace, we can go ahead to create a `.editorconfig` file in the root folder of our java project and apply the same coding styles as discussed in the IntelliJ section above.

To apply the editorconfig format to all java classes in our project, as shown in the screenshot below, we would right click on the project from the **Package Explorer** tab on the top-left corner of Eclipse and select *Source*, then click on *Format*. This will format all our java files using the coding styles in the `.editorconfig` file.

![Eclipse Reformat Window]({{ base }}/assets/img/posts/painless-code-formatting-with-editor-config/eclipse.png)
