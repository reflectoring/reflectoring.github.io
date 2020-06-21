---
title: "One-stop Guide to Lombok"
date: 2020-06-21 10:00 +0500
modified: 2020-06-21 10:15 +0500
---

# What is it
Lombok is a Java library which makes Java less chatty whilst making your code more readable. Java is great language but when you use its features you have to write a lot of boilerplate code.

# Why to use Lombok

Lombok helps you with a set of annotations to make your code more readable without losing its functionality. You don’t need to write typical constructors, setters or getters. With the help of Lombok you can easily add logging feature to you class or create fully functional builder.

# Which the most popular features it has

## @Getter and @Setter annotations
These annotations generate setters and getters for a field respectively. These annotations can be applied as method level or class level.

Lombok annotated code

```java
@Getter
@Setter
public class Person {
  private String name;
  private boolean employed;
}
```

Generated Java code

```java
private String name;
private boolean employed;

public void setName(final String name) {
  this.name = name;
}

public void setEmployed(final boolean employed) {
    this.employed = employed;
}

public String getName() {
    return this.name;
}

public boolean isEmployed() {
    return this.employed;
}
```

## @EqualsAndHashCode annotation
This annotation generates both `equals` and `hashCode`. This is a class level annotation. By default any non static and non transient fields will participate in generating methods.
You can use `callSuper` parameter for calling `equals` method from superclass before considering any field in the current class. Also you can use `exclude` parameter to prevent a field to be used in the logic of the generating methods.

Lombok annotated code

```java
@EqualsAndHashCode(exclude = { "address", "company", "employed" })
public class Person {
    private String name;
    private Integer age;
    private boolean employed;
    private String address;
    private String company;
}
```

Generated Java code

```java
public class Person {
    private String name;
    private Integer age;
    private boolean employed;
    private String address;
    private String company;

    public boolean equals(final Object o) {
        if (o == this) {
            return true;
        } else if (!(o instanceof Person)) {
            return false;
        } else {
            Person other = (Person)o;
            if (!other.canEqual(this)) {
                return false;
            } else {
                Object this$name = this.name;
                Object other$name = other.name;
                if (this$name == null) {
                    if (other$name != null) {
                        return false;
                    }
                } else if (!this$name.equals(other$name)) {
                    return false;
                }

                Object this$age = this.age;
                Object other$age = other.age;
                if (this$age == null) {
                    if (other$age != null) {
                        return false;
                    }
                } else if (!this$age.equals(other$age)) {
                    return false;
                }

                return true;
            }
        }
    }

    protected boolean canEqual(final Object other) {
        return other instanceof Person;
    }

    public int hashCode() {
        int PRIME = true;
        int result = 1;
        Object $name = this.name;
        int result = result * 59 + ($name == null ? 43 : $name.hashCode());
        Object $age = this.age;
        result = result * 59 + ($age == null ? 43 : $age.hashCode());
        return result;
    }
}
```

## @RequiredArgsConstructor, @AllArgsConstructor, @NoArgsConstructor annotations
These annotations generate constructors with only required, i.e. with final keyword, fields. Or with all fields in a class or default constructor.

Lombok annotated code

```java
@RequiredArgsConstructor
public class Person {
    private final String name;
    private final Integer age;
}
```

Generated Java code

```java
public class Person {
    private final String name;
    private final Integer age;

    public Person(final String name, final Integer age) {
        this.name = name;
        this.age = age;
    }
}
```

Lombok annotated code

```java
@AllArgsConstructor
@NoArgsConstructor
public class Person {
    private String name;
    private Integer age;
}
```

Generated Java code

```java
public class Person {
    private String name;
    private Integer age;

    public Person(final String name, final Integer age) {
        this.name = name;
        this.age = age;
    }

    public Person() {
    }
}
```

## @NonNull annotation

The most useful Lombok feature is `@NonNull`. In that case Lombok adds null-checks in you code. It will look like:  
```java
if (name == null) {
  throw new NullPointerException("name is marked non-null but is null");
}
```

## @Slf4j annotation

One of the usefull Lombok features is `@Slf4j`. Lombok will generate static Slf4j Logger `log` property in your class which you can use to log something with choosen severity.  

```java
log.info("myMethod(): started");
log.debug("myMethod(): doing some calculations");
log.info("myMethod(): finished");
```

## @Builder annotation

If use often use Builder pattern you will like the next Lombok feature. It is `@Builder`. You can annotate your class with this feature and Lombok will generate all neccessery code.  

Lombok annotated code

```java
@Builder
public class Person {
    private String name;
    private Integer age;
}

```

Java generated code

```java
public class Person {
    private String name;
    private Integer age;

    Person(final String name, final Integer age) {
        this.name = name;
        this.age = age;
    }

    public static Person.PersonBuilder builder() {
        return new Person.PersonBuilder();
    }

    public static class PersonBuilder {
        private String name;
        private Integer age;

        PersonBuilder() {
        }

        public Person.PersonBuilder name(final String name) {
            this.name = name;
            return this;
        }

        public Person.PersonBuilder age(final Integer age) {
            this.age = age;
            return this;
        }

        public Person build() {
            return new Person(this.name, this.age);
        }

        public String toString() {
            return "Person.PersonBuilder(name=" + this.name + ", age=" + this.age + ")";
        }
    }
}
```

## @Data annotation
This annotation is used the most frequently amongst all other Lombok annotations. It combines the functionality of the next Lombok annotations: `@ToString`, `@EqualsAndHashCode`, `@Getter`, `@Setter`,
`@RequiredArgsConstructor`

# How to add the support of Lombok in your project

## Dependencies to add for Maven

To set up lombok with Maven, you have to specify that the lombok dependency is required to compile your source code, but does not need to be present when running/testing/jarring/otherwise deploying your code. Generally this is called a 'provided' dependency.  
Lombok is available in maven central, so you can easily add it in `dependencies` section of your `pom.xml` file.

```java
<dependencies>
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.12</version>
    <scope>provided</scope>
  </dependency>
</dependencies>
```

*N.B.* ~when adding lombok annotations make sure that you have imported them from correct package. This is the correct import for annotation `@Getter`  
`import lombok.Getter`~

If you use Jdk9+ you should add the following to the maven compiler plugin configuration section:  
```java
<annotationProcessorPaths>
  <path>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.12</version>
  </path>
</annotationProcessorPaths>
```

## Dependencies to add for Gradle

As with setting up lombok for Maven you have to specify lombok dependency in your `buiild.gradle`

In case you do not want to use Lombok Gradle plugin gradle has the built-in `compileOnly` scope, which can be used to tell Gradle to add lombok only during compilation.

```java
dependencies {
  compileOnly 'org.projectlombok:lombok:1.18.12'
  annotationProcessor 'org.projectlombok:lombok:1.18.12'
}
```

If you want to use lombok gradle plugin you can read more about it [https://plugins.gradle.org/plugin/io.freefair.lombok](here)

## Settings for IntelliJ Idea to activate Lombok preprocessing

To use Lobmok features you have to activate preprocessing of Lombok annotations. For Intellij you have to go to  
~`Settings > Build, Execution, Deployment > Compiler > Annotation Processors`~ and activate `Enable annotation processing`

The next popular features is `@EqualsAndHashCode`. With this feature usually `@EqualsAndHashCode.Exclude` used to exclude some fields from using in `equals()` and `hashCode()` methods.

# Caveats when using some features of Lombok

Using Lombok annotations is easy. But sometimes there are some caveats. They often can be met when you have extended from some superclass.
In those cases you can use some additional parameter like `callSuper=true`. This parameter can be used in such features like `@ToString, @EqualsAndHashCode etc.`. Using or not the parameter `callSuper` can be not such harmful in `@ToString` as it can be in `@EqualsAndHashCode`.
Also it's a best practice to manually exclude all the fields you do not want to be used by Lombok when generating the code. This can be done by `@ToString.Exclude` ot `@EqualsAndHashCode.Exclude` annotations.


# DeLombok

Lombok helps to focus you on the code you write and not to focus on creating typical constructors, setters, getters etc. It removes *a lot* of boilerplate code.
But it doesn't cover cases. You cannot plug lombok into javadoc or other tools which use java sources. Here you can use delombok. Delombok copies an entire directory into another directory, recursively, skiping class files and applying lombok transformations to any java source files it encounters.

# Conclusion

There are a lot of languages you can use to reach your goal. There are a lot of frameworks, libraries and tools which help you ease your way to that goal. And Lombok is one them. It make Java less chatty. It removes boilerplate code. It prevents you from the errors when writing typical pieces of the code. And annotations in Java used to makes your code more readable. So the Lombok does.
And with using Lombok Java becomes more powerful and pleasent to use language.
