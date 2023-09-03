---
 authors: [kanake]
 title: "Code Formatting with Ktlint"
 categories: ["Kotlin"]
 date: 2023-09-02 00:00:00 +1100
 excerpt: "Formatting our code before every commit ot a push change to our remote repository is a vitable step to keep our code clean, in this article we shall discuss how to use Ktlint to format our Kotlin code"
 image: images/reflecting_kt.png
 url: code-format-with-ktlint
---

In this tutorial, we are going to learn about Ktlint, a linting tool for Kotlin. Ktlint checks the style of our code and also helps us to format it against some guidelines. This ensures that our code is clean, and easy to read, understand, and maintain.


## What Is Linting?
Linting refers to the process of analyzing our code for any potential errors, typos or defects in formatting. The term "linting" originally means "removing dust" and is now a common term in programming. Linting is achieved by using a lint tool/ static code analyzer.

## What Can We Do with Ktlint?
The following are some of the tasks Ktlint can handle for us:
 * **Formatting code**: We can use Ktlint to reformat our code to meet the coding rules and styles specified for us.
 * **Code Analysis**: This being the main task for this tool, we can use Ktlint to check through our entire project where the code written has not met the official Kotlin coding conventions and style guides.
 * **Error reporting**: After analyzing our project, Ktlint also has the capability to report back to us where it found errors in our project.

## Benefits of Using Ktlint
The following are some of the benefits developers enjoy from using Ktlint:
  * **Improved readability**: By consistently formatting our code, Ktlint makes our code more readable and understandable. This makes it easier for developers to write code since they don't have to struggle with varying indentation, spacing or any formatting issues.
  * **Saving time in code reviews**: Since Ktlint automatically checks and formats our code to our defined rules and guidelines, it reduces the time that would have been used for manual style review hence saving us time.
  * **Consistent codebase**: Following our defined guidelines via Ktlint, developers in the same team are able to follow and use the same formatting rules leading to a uniform and readable code.
  * **Customizable rules**: While the Ktlint tool itself comes with its default standard rules and guidelines, we can customize our own rules that match our preferred style. This flexibility allows us to enforce the specified rules we would like to follow and use.
  * **Automated checks**: We also have the capability to integrate Ktlint into our Continuous Integration pipeline, this means that every pull request or commit by developers can be automatically checked to determine whether it meets our coding standards helping us catch issues early in the development process.

## Adding Ktlint to a Gradle Project
  To add Ktlint to a Gradle project we use the [Ktlint Gradle Plugin](https://github.com/JLLeitschuh/ktlint-gradle). This plugin is easier to work with and also provides developers with commands to run in order to check and format code. Here are the steps we'll follow:

### Adding the Ktlint Gradle Plugin
  To add the Gradle plugin to our project, we add the dependencies in our root level *build.gradle*  file.
  Let's take a look at how we achieve this:
```groovy
plugins {
    id "org.jlleitschuh.gradle.ktlint" version "11.0.0"
}
```
In the above code, we're using version *11.0.0* which we can replace with our version of choice.

### Applying the Ktlint Plugin to Other Modules
Let's also add Ktlint to our modules within the same project to ensure that the code in them is also checked and formatted. Note that this is only applicable if our project is a multi-module project. To achieve this task, we add the plugin in the `allprojects` block found in `build.gradle` file:

```groovy
allprojects {
    apply plugin: "org.jlleitschuh.gradle.ktlint"
}
```
## Analyzing and Formatting Code
Let's look at which commands the Ktlint plugin provides:
* `./gradlew ktlintCheck`:
We use this command to tell Ktlint that it should go through our entire project and **check which files in our codebase violate the provided guidelines. After checking, this will result in a report indicating the file with errors that need to be corrected**, if there isn't any code violation the check passes.
* `./gradlew ktlintFormat`:
This command **automatically updates the code to follow the configured coding style**.

## Adding Ktlint to a Maven Project
In order to integrate Ktlint into our Maven project, we add the Maven plugin to our `pom.xml` file:

```xml 
<build>
    <plugins>
        <plugin>
            <groupId>com.github.shyiko</groupId>
            <artifactId>ktlint-maven-plugin</artifactId>
            <version>RELEASE</version> 
            <executions>
                <execution>
                    <id>format</id>
                    <goals>
                        <goal>format</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

By default, after we add the Maven plugin to our project, it's using the official standard Kotlin style guide. If we want to modify and create our own rules to use in our project, we can create a `ktlint.yml` file in the root directory of our project and configure our rules in this file.

The file may look like this:

```yaml
max_line_length: 120
indent_size: 4
```

The rules in this example mean the following:

- `max_line_length`: This rule specifies the maximum allowed length for our single line of code. If a line of code exceeds 120 in length, ktlint will flag this as a violation of our style rules.
- `indent_size`: This sets the size of an indentation level. In our case, it's set to 4 spaces, which means that each nested block of code should be indented by 4 spaces.

Finally, after we configure the plugin to our project and add the yml file in which we provided our own style guide, we navigate to our project's root directory and execute the `mvn ktlint:format` command in our terminal to ensure our code is formatted.

## Integrate Ktlint with our Maven Build Process
To ensure that our project's code is properly formatted during our build process, we add a plugin execution to the `verify` phase in the `pom.xml` file of our project:

```xml
<plugin>
    <groupId>com.github.shyiko</groupId>
    <artifactId>ktlint-maven-plugin</artifactId>
    <version>RELEASE</version>
    <executions>
        <execution>
            <id>format</id>
            <goals>
                <goal>format</goal>
            </goals>
        </execution>
        <execution>
            <id>verify</id>
            <goals>
                <goal>check</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```
## Conclusion
In this tutorial, we have gone through the benefits of using Ktlint and how we can add it to our Kotlin and Maven projects.

The full implementation of this tutorial can be found over on [github repository](https://github.com/thombergs/code-examples/tree/master/kotlin).
