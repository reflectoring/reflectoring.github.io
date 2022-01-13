---
title: "Immutables Library"
categories: [java]
date: 2022-01-10 00:00:00 +1100
modified: 2022-01-10 00:00:00 +1100
author: mateo
excerpt: "Examples rich guide of Immutables library."
image: 
  auto: 0065-java
---
# Introduction

The immutable object means that the object's state is constant after the initialization.

Java, by definition, passes parameters as values. When we pass a primitive, we pass the value of that primitive. On the other hand, passing an object passes the reference as a value. The parameter of the method and the original object now reference the same value on the heap.

Behavior like this can cause multiple side effects. For example in a multithreaded system, one thread can change the value under reference, and it will cause other threads to misbehave. 

The immutables library generates classes that are immutable, thread-safe, and null-safe. Aside from creating immutable class, the library helps us write readable and clean code.

We will go through several examples showing key functionalities and how to use them properly.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/immutables" %}
# Setting up Immutables
## Maven Setup
```xml
  <dependencies>
    <dependency>
        <groupId>org.immutables</groupId>
        <artifactId>value</artifactId>
        <version>2.8.8</version>
    </dependency>
  </dependencies>
```

# Use-case
Let us start building a webpage for creating and reading news articles. There are two entities that we want to write:
- user
- article

Each user can write multiple articles, and each article has to have its author. We won't go into more details about the logic of the application.

## The User Entity
```java
public class UserWithoutImmutable {

    private final long id;

    private final String name;

    private final String lastname;

    private final String email;

    private final String password;

    private final Role role;

    private List<ArticleWithoutImmutable> articles;

    private UserWithoutImmutable(long id, String name,
                                 String lastname, String email,
                                 String password, Role role,
                                 List<ArticleWithoutImmutable> articles) {
        this.id = id;
        this.name = name;
        this.lastname = lastname;
        this.email = email;
        this.password = password;
        this.role = role;
        this.articles = new ArrayList<>(articles);
    }

    public long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getLastname() {
        return lastname;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public Role getRole() {
        return role;
    }

    public List<ArticleWithoutImmutable> getArticles() {
        return articles;
    }

    public UserWithoutImmutable addArticle(
            ArticleWithoutImmutable article) {
        this.articles.add(article);
        return this;
    }

    public UserWithoutImmutable addArticles(
            List<ArticleWithoutImmutable> articles) {
        this.articles.addAll(articles);
        return this;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserWithoutImmutable that = (UserWithoutImmutable) o;
        return id == that.id && email.equals(that.email) &&
                password.equals(that.password);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, email, password);
    }

    @Override
    public String toString() {
        return "UserWithoutImmutable{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", lastname='" + lastname + '\'' +
                ", role= '" + role + '\'' +
                ", email='" + email + '\'' +
                ", password= *****'" +
                ", articles=" + articles +
                '}';
    }

    public static UserWithoutImmutableBuilder builder() {
        return new UserWithoutImmutableBuilder();
    }

    public static class UserWithoutImmutableBuilder {
        private long id;

        private String name;

        private String lastname;

        private Role role;

        private String email;

        private String password;

        private List<ArticleWithoutImmutable> articles;

        public UserWithoutImmutableBuilder id(long id) {
            this.id = id;
            return this;
        }

        public UserWithoutImmutableBuilder name(String name) {
            this.name = name;
            return this;
        }

        public UserWithoutImmutableBuilder lastname(String lastname) {
            this.lastname = lastname;
            return this;
        }

        public UserWithoutImmutableBuilder role(Role role) {
            this.role = role;
            return this;
        }

        public UserWithoutImmutableBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserWithoutImmutableBuilder password(String password) {
            this.password = password;
            return this;
        }

        public UserWithoutImmutableBuilder articles(
                List<ArticleWithoutImmutable> articles) {
            this.articles = articles;
            return this;
        }

        public UserWithoutImmutable build() {
            return new UserWithoutImmutable(id, name, lastname, email,
                    password, role, articles);
        }
    }
}
```
The code shows a manually created User.java class. Each user has:
- id
- name
- last name
- email
- password
- list of articles

We implemented the builder pattern to avoid Java issues with default and optional constructor parameters.

We can see how much code is needed to write POJO(Plain old Java object) class that doesn't contain any business logic.

## The Article Entity
```java
public class ArticleWithoutImmutable {

    private final long id;

    private final String title;

    private final String content;

    private final long userId;

    private ArticleWithoutImmutable(long id, String title,
                                    String content, long userId) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.userId = userId;
    }

    public long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public long getUserId() {
        return userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ArticleWithoutImmutable that = (ArticleWithoutImmutable) o;
        return id == that.id && Objects.equals(title, that.title) &&
                Objects.equals(content, that.content);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, title, content);
    }

    public static ArticleWithoutImmutableBuilder builder() {
        return new ArticleWithoutImmutableBuilder();
    }

    public static class ArticleWithoutImmutableBuilder {
        private long id;

        private String title;

        private String content;

        private long userId;

        public ArticleWithoutImmutableBuilder id(long id) {
            this.id = id;
            return this;
        }

        public ArticleWithoutImmutableBuilder title(String title) {
            this.title = title;
            return this;
        }

        public ArticleWithoutImmutableBuilder content(
                String content) {
            this.content = content;
            return this;
        }

        public ArticleWithoutImmutableBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public ArticleWithoutImmutable build() {
            return new ArticleWithoutImmutable(id, title, content,
                    userId);
        }
    }
}

```
We built the article entity by hand to present how much code we needed for a relatively simple entity class. This class is a standard POJO (Plain old java object) class that doesn't contain any business logic.

# Creating a Basic Immutable Entity
We will show how to create a simple immutable entity. One more perk of using the immutable library is writing the clean code. We will omit the creation of the user entity since it is the same as for the article entity.
## Immutable Article Entity
In the [standard article implementation](#the-article-entity), we saw how much code we need for creating a simple POJO class. Thankfully, there is a solution to this problem:
```java
@Value.Immutable
public abstract class Article {

    abstract long getId();

    abstract String getTitle();

    abstract String getContent();

    abstract long getUserId();
}
```
The first thing that we notice is the special annotation. The `@Value.Immutable` annotation says to the annotation processor that it should generate an implementation for this class.

It is important to mention that we can place the `@Value.Immutable` annotation on the class, interface or annotation type. 

## Immutable Article Entity Implementation
[The previous chapter](#immutable-article-entity) showed us how to define the immutable class. Now, let's look into generated implementation:
```java
@Generated(from = "Article", generator = "Immutables")
@SuppressWarnings({"all"})
@javax.annotation.processing.Generated(
        "org.immutables.processor.ProxyProcessor")
public final class ImmutableArticle extends Article {
    private final long id;
    private final String title;
    private final String content;
    private final long userId;

    private ImmutableArticle(long id, String title, String content,
                             long userId) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.userId = userId;
    }
    @Override
    long getId() {
        return id;
    }

    @Override
    String getTitle() {
        return title;
    }

    @Override
    String getContent() {
        return content;
    }

    @Override
    long getUserId() {
        return userId;
    }

    public final ImmutableArticle withId(long value) {
        if (this.id == value) return this;
        return new ImmutableArticle(value, this.title, this.content,
                this.userId);
    }

    public final ImmutableArticle withTitle(String value) {
        String newValue = Objects.requireNonNull(value, "title");
        if (this.title.equals(newValue)) return this;
        return new ImmutableArticle(this.id, newValue, this.content,
                this.userId);
    }

    public final ImmutableArticle withContent(String value) {
        String newValue = Objects.requireNonNull(value, "content");
        if (this.content.equals(newValue)) return this;
        return new ImmutableArticle(this.id, this.title, newValue,
                this.userId);
    }

    public final ImmutableArticle withUserId(long value) {
        if (this.userId == value) return this;
        return new ImmutableArticle(this.id, this.title, this.content,
                value);
    }

    @Override
    public boolean equals(Object another) {
        // Implementation omitted
    }

    private boolean equalTo(ImmutableArticle another) {
        // Implementation omitted
    }

    @Override
    public int hashCode() {
        // Implementation omitted
    }

    @Override
    public String toString() {
        // Implementation omitted
    }

    public static ImmutableArticle copyOf(Article instance) {
        if (instance instanceof ImmutableArticle) {
            return (ImmutableArticle) instance;
        }
        return ImmutableArticle.builder()
                .from(instance)
                .build();
    }

    public static ImmutableArticle.Builder builder() {
        return new ImmutableArticle.Builder();
    }

    @Generated(from = "Article", generator = "Immutables")
    public static final class Builder {
        // Implementation omitted
    }
}
```
The annotation processor generates the implementation class from the skeleton that we defined. The naming convention is, "Immutable" followed by the abstract class name.

The implementation class contains each abstract method as the attribute. Each getter method in the implementation class was the abstract method inside the skeleton code.
If we name our methods in pattern "get.*" implementation will strip the "get" part and take the rest as the attribute name. Every other naming will take the full method name as the attribute name.

In the basic implementation, there is no constructor. The annotation processor generates the builder pattern. We omitted the implementation code for the builder class to save some space. If you want to look into the implementation details, please refer to the [Github page.](https://github.com/thombergs/code-examples/tree/master/immutables)

Since we are working with the immutable objects, the annotation processor created withers methods that help us build the new object from the current one. Each attribute has its own "with" method.

# The Builder Implementation
The Java constructor is not that powerful as in other languages. 
Since we cannot have the default or optional argument, we need to use the builder pattern.

## Default Builder
The immutable library comes with the builder pattern by default. We don't need to add anything specific to the class definition:
```java
@Value.Immutable
public abstract class Article {

    abstract long getId();

    abstract String getTitle();

    abstract String getContent();

    abstract long getUserId();
}
```
The class definition is the same as in our previous examples. The `@Value.Immutable` annotation defines the builder on this entity.

## Strict Builder
The builder class is not immutable by default. If we want to use an immutable builder, we can use the strict builder:
```java
@Value.Immutable
@Value.Style(strictBuilder = true)
abstract class StrictBuilderArticle {
    abstract long getId();

    abstract String getTitle();

    abstract String getContent();
}
```
After defining the immutable class we, need to add one more annotation to the class definition. The `@Value.Style` annotation is a meta-annotation for defining what will the annotation processor generate. We set the strictBuilder attribute to true, meaning that generated builder should be strict.

### Strict Builder Usage
Strict builder means that we cannot set the value to the same variable twice inside building steps. We are making the builder implementation immutable.

```java
public class BuildersService {
    public static StrictBuilderArticle createStrictArticle(){
        return ImmutableStrictBuilderArticle.builder()
                .id(0)
                .id(1)
                .build();
    }
}
```
We are setting the id attribute twice, producing the error:

```java
Exception in thread "main" java.lang.IllegalStateException: 
Builder of StrictBuilderArticle is strict, attribute is already set: id
```

## Staged builder
If we want to make sure that all required attributes are provided to the builder before we create the actual instance, we can use the stage builder:
```java
@Value.Immutable
@Value.Style(stagedBuilder = true)
abstract class StagedBuilderArticle {

    abstract long getId();

    abstract String getTitle();

    abstract String getContent();
}
```
We use the `@Value.Style` annotation to tell the annotation processor that we need the staged builder generated.

__Note: The staged builder is, implicitely, strict__

# The Constructor
Some use-cases requir that we use the regular constructor. As mentioned, the immutable library created the builder by default, leaving the constructor in the private scope. 

Let us look at how to define the class, so it generated the constructor for us:
```java
@Value.Immutable
public abstract class ConstructorArticle {
    @Value.Parameter
    public abstract long getId();
    @Value.Parameter
    public abstract String getTitle();
    @Value.Parameter
    public abstract String getContent();
}
```
By setting the `@Value.Immutable` annotation we defined that are building the immutable class. To define the constructor, we need to annotate each attribute that should be part of that constructor with the `@Value.Parameter` annotation.

If we would look into the generated implementation we would see that the constructor has the public scope.

## Using the of() Method
By default, the immutable library forces us to create the instance using the `of()` method:
```java
public class ConstructorService{
    public static ConstructorArticle createConstructorArticle(){
        return ImmutableConstructorArticle.of(0,"Lorem ipsum article!", "Lorem ipsum...");
    }
}
```
We need to call the static `of()` method to create the object instance.

## Using the new Method
If we want to use the plain public constructor with the `new` keyword, we need to define it through the `@Value.Style` annotation:
```java
@Value.Immutable
@Value.Style(of = "new")
public abstract class PlainPublicConstructorArticle {
    @Value.Parameter
    public abstract long getId();
    @Value.Parameter
    public abstract String getTitle();
    @Value.Parameter
    public abstract String getContent();
}
```
First, we define that our class should be immutable. Then we annotate which attribute should be part of the public constructor. The last thing that we need to do is to add `@Value.Style(of="new")` annotation to the class definition.

# Optional and Default Attributes
All attributes in the immutable class are mandatory by default. If we want to create a field where we can omit the value, we can approach it in two different ways:
- Optional API
- Default provider

## Optional Attributes
The immutable library supports the Optional API. If we want to make sure some fields can be "null", we can mark them optional. The optional wrapper will not put the null value but create the empty instance of the optional object.  
It is highly discouraged to create nullable objects at all.

```java
@Value.Immutable
abstract class OptionalArticle {

    abstract Optional<Long> getId();

    abstract Optional<String> getTitle();

    abstract Optional<String> getContent();
}
```
By wrapping each object into the Optional, we are sure that the code will not fail if we don't provide the value. 

We need to be careful with using this approach. Make as optional only those variables that should be optional.

## Default Attributes
If we want to provide default values to the attributes that are not set using the builder or the constructor we can use the `@Value.Default` annotation:
```java
@Value.Immutable
abstract class DefaultArticle {

    abstract Long getId();

    @Value.Default
    String getTitle(){
        return "Default title!";
    }

    abstract String getContent();

}
```
Since our method has the implementation it will not be an abstract method. After putting the `@Value.Default` annotation we can create the logic of how will our title be generated.

# Derived and Lazy Attributes
## Derived Attributes
In the [default attributes chapter](#default-attributes), we saw the creation of a default value inside the attribute. If we need to create the value from other attributes, we can use `@Value.Derived` annotation:
```java
@Value.Immutable
abstract class DerivedArticle {

    abstract Long getId();

    abstract String getTitle();

    abstract String getContent();

    @Value.Derived
    String getSummary(){
        String summary = getContent().substring(0,
                getContent().length()>50 ? 50 :
                        getContent().length());
        return summary.length() == getContent().length() ? summary
                : summary+"...";
    }
}
```
Again, we first annotated the abstract class with the `@Value.Immutable` annotation. 

The summary attribute should be derived from the value inside the content. We want to take only first fifty charaters from the content.

After creating the method for getting the summary we need to annotate it with the `@Value.Derived` annotation.

## Lazy Attributes
Deriving the value can be expensive operation we might want to do it only once and only when it is needed. To do this we can use the `@Value.Lazy` annotation:
```java
@Value.Immutable
abstract class LazyArticle {

    abstract Long getId();
    
    abstract String getTitle();

    abstract String getContent();

    @Value.Lazy
    String summary(){
        String summary = getContent().substring(0,
                getContent().length()>50 ? 50 :
                        getContent().length());
        return summary.length() == getContent().length() ? summary
                : summary+"...";
    }
}
```

After initializing the method with the `@Value.Lazy` we are sure that this value will be computed only when it is used the first time.

# Styles
The `@Value.Style` is the annotation with which we control what will the annotation process generate. In the [prevous example](#using-the-new-method), we used the `@Value.Style` annotation to generate the standard constructor format. 

We can use the annotation on several levels:
- on the package level
- on the top class level
- on the nested class level
- on the annotation level

The package level annotation will apply the used style to the whole package. 

The class level will take effect on the class where we placed it and on all nested classes. 

The annotation level class will create the new annotation as the meta-annotation. We can then use this new meta-annotation for class levels.

__Note: It is the recommendation to use one or more meta-annotations instead of class or package level__

There are several things that we need to be aware of:
- If there is mixing in the applied styles they will be selected indeterministic. They are never merged.
- Style can be a powerful tool, and we need to be careful when using them.
- Styles are cached. When changing something on the style, we need to rebuild the project or even restart the IDE.

## Style Meta-annotation Definition
Let us look how to define new meta-annotation:
```java
@Target({ElementType.PACKAGE,ElementType.TYPE})
@Retention(RetentionPolicy.CLASS)
@Value.Style(
        of = "new",
        strictBuilder = true,
        allParameters = true,
        visibility = Value.Style.ImplementationVisibility.PUBLIC

)
public @interface CustomStyle {}
```
After defining `@Target` and `@Retention` annotation, we come to the `@Value.Style` annotation. The first value defined that we want to use the `new` constructor. The next thing that we define is that we want to use the strictBuilder and that all attributes should be annotated with the `@Value.Parameter` annotation. The last style defined is that the implementation visibility will be public.

For more information about style possibilities, please refer to the [official documentation.](https://immutables.github.io/style.html)

# Conclusion
We saw how the immutable library helps us in several different ways.
   
