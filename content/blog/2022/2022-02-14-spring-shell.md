## Spring Shell
[Spring Shell](https://spring.io/projects/spring-shell) allows us to build a command line application (Shell) using Spring's framework and all the advantages it provides.

## What Is A Shell Anyways?
A shell provides us with an interface to a system (usually an OS) to which we give commands and parameters. The shell in turn does some useful tasks for us and provides an output.

## Let's Create A Basic Shell
Since it's a Spring application, our main method has to be annotated with `@SpringBootApplication`
```java
@SpringBootApplication
public class SpringShellApplication {
  public static void main(String[] args) {
    SpringApplication.run(SpringShellApplication.class, args);
  }
}
```

Now, let's create our first shell command which simulates an SSH:
```java
@ShellComponent  
public class SSHCommand {  
    Logger log = Logger.getLogger(SSHCommand.class.getName());  
  
    @ShellMethod(value = "connect to remote server")  
    public void ssh(@ShellOption(value = "-s") String remoteServer)  
    {  
        log.info(format("Logged to machine '%s'", remoteServer));  
    }  
}
```

The annotation `@ShellComponent` as defined by the Spring team:

> Indicates that an annotated class may contain shell methods (themselves annotated with ShellMethod) that is, methods that may be invoked reflectively by the shell

As for the `@ShellMethod` annotation:

    Used to mark a method as invokable via Spring Shell.
We can also see the `value` property which is used to describe the command.

The `@ShellOption` annotation simply states that this command takes a parameter named `-s`.

So as a result when we run the application we get a shell that has a command called `ssh` which takes a parameter `-s` and all it does is logging the passed parameter value to the command line:

```bash
shell:>ssh -s my-machine
2022-02-11 15:44:04.065  INFO 5648 --- [           main] j.t.springshell.command.SSHCommand       : Logged to machine 'my-machine'
shell:>
```

## Deeper Look Into Spring Shell
### Command Name
The default naming convention for Spring Shell, as we've seen, is taking the method name `ssh` and turning it into the command name.
- If we wrote the name in camel case Spring would turn camelCase humps into "-".
- So `customSsh` would translate to `custom-ssh`.

We can also add a name of our own using the `key` property of the `ShellMethod` annotation:

```java 
@ShellMethod(key = "my-ssh", value = "connect to remote server")  
public void ssh(@ShellOption(value = "-s") String remoteServer)  
{  
    log.info(format("Logged to machine '%s'", remoteServer));  
}
```

### Command Parameters

#### Parameter Naming
As we've seen from the previous example, command parameters are expressed through method parameters.

We can specify the name of the parameter using the `value` property of the `@ShellOption` annotation.

If we don't specify the value however, Spring Shell assigns it a default value of parameter name "-" separated prefixed by `ShellMethod.prefix()`.
- The `ShellMethod.prefix()` default value is "--" unless changed in the `@ShellMethod` annotation:
```java
@ShellMethod(key = "my-ssh", prefix = "-", value = "connect to remote server")  
public void ssh(@ShellOption String remoteServer)  
{  
    log.info(format("Logged to machine '%s'", remoteServer));  
}
```
- In the above example the parameter name will be `-remote-server`.

#### Default Parameters Values
We can assign default values to parameters in case the user doesn't specify any. Doing this also allows the user to treat those parameters as optional:
```java
@ShellMethod(value = "connect to remote server")  
public void ssh(@ShellOption(value = "--s", defaultValue = "default-server") String remoteServer)  
{  
    log.info(format("Logged to machine '%s'", remoteServer));  
}
```
Typing only `ssh` to the console will give us:
```bash
shell:>ssh
2022-02-11 19:55:05.133  INFO 4700 --- [           main] j.t.springshell.command.SSHCommand       : Logged to machine 'default-server'
```

#### Multi-valued Parameters
We can specify multiple values for a single parameter by using the `arity()` attribute of the `@ShellOption` annotation. Simply use a collection or array for the parameter type, and specify how many values are expected":
```java
@ShellMethod(value = "add keys")  
public void sshAdd(@ShellOption(value = "--k", arity = 2) String[] keys)  
{  
    log.info(format("Adding keys '%s' '%s'", keys[0], keys[1]));  
}
```

Let's try the command out in the shell:

```bash
shell:>ssh-add --k test1 test2
2022-02-12 18:27:00.301  INFO 4928 --- [           main] j.t.springshell.command.SSHCommand       : Adding keys 'test1' 'test2'
```

#### Boolean Parameters
Boolean parameters receive a special treatment by command-line utilities. The absence of the parameter in the command indicates a false value. On the other hand, its existence indicates true value:
```java
@ShellMethod(value = "sign in")  
public void sshLogin(@ShellOption(value = "--r") boolean rememberMe)  
{  
    log.info(format("remember me option is '%s'", rememberMe));  
}
```
Let's check it out in the command line:
```bash
shell:>ssh-login --r
2022-02-12 18:41:34.903  INFO 10044 --- [           main] j.t.springshell.command.SSHCommand       : remember me option is 'true'
shell:>ssh-login
2022-02-12 18:41:44.606  INFO 10044 --- [           main] j.t.springshell.command.SSHCommand       : remember me option is 'false'
```
#### Validating Command Parameters
According to the Spring Shell team

> Spring Shell integrates with the  [Bean Validation API](https://beanvalidation.org/)  to support automatic and self documenting constraints on command parameters.
> Annotations found on command parameters as well as annotations at the
> method level will be honored and trigger validation prior to the
> command executing.

Let's try this in action by adding a `@Size` annotation to the method parameter:
```java
@ShellMethod(value = "ssh agent")  
public void sshAgent(  
        @ShellOption(value = "--a")  
        @Size(min = 2, max = 10) String agent)  
{  
    log.info(format("adding agent '%s'", agent));  
}
```
Now, if we try to pass a parameter value with a length of 1 we will get an error stating the reason:
```bash
shell:>ssh-agent --a t
The following constraints were not met:
	--a string : size must be between 2 and 10 (You passed 't')
```

Note that the `@Size` annotation is a part of the [Jakarta Bean Validation](https://beanvalidation.org/) which offers many more validation options like `@NotEmpty` `@Max`.


## Dynamic Command Availability
Some commands only make sense when certain pre-conditions are met. For example, a `sign-out` command should be available only if a `sign-in` command has been issued, and if the user tries to run the `sign-out` command we want to warn them that it's not possible.

Spring Shell offers us three ways to achieve our goal.

Let's explore the **first way** which checks our class for a method with a special name and with a return type of `Availability`.
The special name has to be in the format `command-to-checkAvailability`:
```java
@ShellComponent  
public class SSHLoggingCommand {  
    Logger log = Logger.getLogger(SSHLoggingCommand.class.getName());  
    private boolean signedIn;  
  
    @ShellMethod(value = "sign in")  
    public void signIn()  
    {  
        this.signedIn = true;  
        log.info("Signed In!");  
    }  
  
    @ShellMethod(value = "sign out")  
    public void signOut()  
    {  
        this.signedIn = false;  
        log.info("Signed out!");  
    }  
    // note the naming   
	public Availability signOutAvailability()  
    {  
        return signedIn ?  
                Availability.available() : Availability.unavailable("Must be signed in first");  
    }  
}
``` 
So if we try to run the `sign-out` command without first signing in we will get the following message:
```bash
shell:>sign-out
Command 'sign-out' exists but is not currently available because Must be signed in first
Details of the error have been omitted. You can use the stacktrace command to print the full stacktrace.
shell:>
```

The **Second way**, is to use the `@ShellMethodAvailability` annotation, in which we specify the method name we want to use to Availability check:
```java
@ShellMethod(value = "sign out")  
@ShellMethodAvailability("signOutCheck")  
public void signOut()  
{  
    this.signedIn = false;  
    log.info("Signed out!");  
}
 
public Availability signOutCheck()  
{  
    return signedIn ?  
            Availability.available() : Availability.unavailable("Must be signed in first");  
}
``` 
The **third** and final way is to have several methods attached to a single availability method.
We are going to use the annotation `ShellMethodAvailability` with an array of the **commands names (not method names)**:

```java
@ShellMethod(value = "sign out")  
public void signOut()  
{  
    this.signedIn = false;  
    log.info("Signed out!");  
}  
  
@ShellMethod(value = "Change password")  
public void changePass(@ShellOption String newPass)  
{  
    log.info(format("Changed password to '%s'", newPass));  
}  
  
@ShellMethodAvailability({"sign-out", "change-pass"})  
public Availability signOutCheck()  
{  
    return signedIn ?  
            Availability.available() : Availability.unavailable("Must be signed in first");  
}
```

## Other Cool Features In Spring Shell
Since Spring Shell builds on top of [JLine](https://github.com/jline/jline3) it inherits a lot of its features. Let's look at some of them:

### Tab Completion

### Built In Commands

- help:
  - lists all the commands known to the shell, including the built-in commands and commands we wrote.

- script:
  - accepts a local file as an argument and will replay commands found there, one at a time.


## Styling The Shell
We can do so by registering a bean of type `PromptProvider` which includes information on how to render the Shell prompt.
For example, let's change the prompt text to `Cool Machine==> ` with a green color for the text:
```java
@Component  
public class CustomPromptProvider implements PromptProvider {  
    @Override  
  public AttributedString getPrompt() {  
            return new AttributedString(  
                    "Cool Machine" + "==> ",  
                    AttributedStyle.DEFAULT.background(AttributedStyle.GREEN));  
    }  
}
```

## Running Spring Shell JAR File
To build a JAR file from our Spring Shell project we have two paths depending on the building tool we are using, let's explore them both.
Please note that we are doing this using command line instructions. If you are using an IDE it will take care of this for you when running the project.

### Maven
Using Maven we have to run the command `mvn clean package` in our root directory (the directory with the `pom.xml` file). This will produce a JAR file in the `build` directory.


### Gradle
As for Gradle we have to invoke the build task. Using Windows the command will be `./gradlew build`. This will also build the JAR file in the `build` directory.

After obtaining the JAR file we run it using the command `java -jar our-spring-shell-jar-name.jar`. This will open our shell in the command line and have it ready for us to type in commands.


## Summary
- The Shell allows us to interface with a system using commands.

- Spring Shell introduces a simple and quick way to build a Shell leveraging all the good sides of the Spring framework.

- The three main building blocks of Spring Shell are `ShellComponent` `ShellMethod` `ShellOption`.
- Spring Shell is built on top of **JLine** which offers useful features like tab completion and built in commands.
- We can choose to make some commands available based on certain conditions.
- We can style the command line as we like.

