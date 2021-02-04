---
title: "Painless Code Formatting with EditorConfig"
categories: [java]
date: 2021-02-04 00:00:00 +0100
modified: 2021-02-04 00:00:00 +0100
author: zeddysoft
excerpt: "As Java developers working as a team on a project, we need consistent coding styles in our project to enhance readability and make our code a lot cleaner and uniform, that's where EditorConfig shines"
image:
  auto: 0087-hammers
---

Have you worked on a project with other developers where reading code was not as fun as you would want because of inconsistent coding styles? In this article, I will take you through how to achieve painless code formatting with EditorConfig.

## The Challenges of Code Formatting

I joined a new team almost a year ago and after my onboarding with other Engineers across several of their codebases, it was time to start making code contributions. I was using IntelliJ IDEA since most of the codebases I will be working on revolves around java.

My initial pull request had a few bugs which I fixed but the ones that seemed distracting were comments around spacing and tabs. I was always having PR comments on spacing/indentation and it became a headache when in one of my PRs, I had several such comments.

The issue here was that some files in the repository I worked with use space indentation while the newer files use tab indentation. But after checking out the code with my IDE whose default setting is tabs, all of my changes in any file used that same tab indentation and that was where the problem started.

It was not too much of an issue for me while working locally in my IDE but since I work in a team where other Engineers would need to review my code, having consistent coding styles across files became very important.

As a short-term fix, I would always confirm the indentation style being used by each file I made changes to and then tweak my IDE indentation style to be the same. This amount to unnecessary extra work and when you add up the time spent doing this per PR that has indentation issues, you would realize its a lot of time that could have been spent doing some more productive task.

This problem is exactly what EditorConfig solves.

## Shared Code Format with editorconfig

EditorConfig allows you to define commonly used coding styles in a file which can easily be used across several IDEs to enforce consistent coding styles among several developers working on the same codebase, thus leading to less friction in your team.

## Using editorconfig

With EditorConfig, you can define whether you want your indentation style to be tab or space, what should be the indentation size (the most common size I have seen is 4), and other properties that we will be discussing in the next section.

Since there lot of IDEs and we cannot touch all of them, I have selected two IDEs: IntelliJ IDEA which comes with native support for EditorConfig and Eclipse which requires a plugin to be downloaded for it to work properly. 

For a complete list of supported IDEs (those requiring plugin and those with native support), please check the [official website](https://editorconfig.org/).

## Using editorconfig with IntelliJ

IntelliJ comes with native support for EditorConfig, which means that we do not have to install a plugin to make it work. To get started, you need to create a file named .editorconfig in the root folder of your project and define the coding styles you need.

Since I would like my java code to use tab indentation with a tab size of 4, utf-8 character set and trim any trailing whitespaces in my code. I will define the following properties in the .editorconfig file to achieve this:

```
# Topmost editor config file
root = true

# Custom Codng Styles for Java files
[*.java]

# The other allowed value you can use is space
indent_style = tab 

# You can play with this value and set it to how big you want your tab to be
indent_size = 4

# Character set to be used in java files.
charset = utf-8 
trim_trailing_whitespace = true
```

In the snippet above, I have defined two major sections: root definition section and the Java style section. 

I have specified the **root** value to be *true* and what this means is that when a file is opened, editorConfig plugin will start searching for .editorConfig files starting from the current directory. The search will only stop when it has reached the root directory or when it sees a .editorConfig file with root value set to true.

EditorConfig plugin applies styles in a top down fashion, so if you have several .editorConfig files in your project with some duplicated properties, the closet .editorConfig file takes precedence.

For the Java section, I have defined a pattern **[*.java]** to match all java files. If your requirement is to match some other type of files with a different extension, a complete list of Wildcard Pattern is available in the [official website](https://editorconfig.org/)

You can use the Editor and Preview button at the top-right corner of IntelliJ to view the effect of the styles in realtime.

A complete list of universally supported properties across IDEs can be found in the  [official reference](https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties#current-universal-properties)

## Conclusion
In this article, we learned how to use EditorConfig to achieve consistent coding styles by using universal properties that are supported across IDEs and EditorConfig plugins. 