---
title: "Complete Guide to the Immutables Java Library"
categories: ["Java"]
date: 2022-01-10 00:00:00 +1100 
modified: 2022-01-10 00:00:00 +1100 
authors: [mateo]
excerpt: "Example-rich guide to the Immutables library."
image: images/stock/0065-java-1200x628-branded.jpg 
url: immutables-library
---

Immutability means that an object's state is constant after the initialization. It cannot change afterward.

When we pass an object into a method, we actually pass the reference to that object. The parameter of the method and the
original object now reference the same value on the heap.

This can cause multiple side effects. For example, in a multi-threaded system, one thread can change the value under
reference, and it will cause other threads to misbehave.

The [Immutables](https://immutables.github.io/) library generates classes that are immutable, thread-safe, and
null-safe, and help us avoid these side effects. Aside from creating immutable classes, the library helps us write
readable and clean code.

We will go through several examples showing key functionalities and how to use them properly.

{{% github "https://github.com/thombergs/code-examples/tree/master/immutables" %}}

# Setting up Immutables with Maven

Adding the immutables is as simple as can be. We just need to add the dependency:

```xml

<dependencies>
    <dependency>
        <groupId>org.immutables</groupId>
        <artifactId>value</artifactId>
        <version>2.8.8</version>
    </dependency>
</dependencies>
```

## Example Use Case

Let us start building a webpage for creating and reading news articles. There are two entities that we want to write:

- `User`
- `Article`

Each user can write multiple articles, and each article has to have an author of type `User`. We won't go into more
details about the logic of the application.

### The User Entity

```java
public class UserWithoutImmutable {

    private final long id;

    private final String name;

    private final String lastname;

    private final String email;

    private final String password;

    private final Role role;

    private List<ArticleWithoutImmutable> articles;

    private UserWithoutImmutable(
            long id,
            String name,
            String lastname,
            String email,
            String password,
            Role role,
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

The code shows a manually created `User` class. Each user has a couple of attributes and a list of articles they wrote.

**We can see how much code is needed to write a POJO (Plain old Java object) class that doesn't contain any business logic.**

We added the builder pattern for easier object initializtion.

### The Article Entity

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

We built the `Article` entity by hand to present how much code we needed for a relatively simple entity class.

The article class is a standard POJO (Plain old java object) class that doesn't contain any business logic.

## Creating a Basic Immutable Entity

Let's now look at how the Immutables library makes it simple to create an immutable entity without that much boilerplate code. We will only look at the `Article` entity, because it will be very similar for the `User` entity.

### Immutable `Article` Definition

In the [standard article implementation](#the-article-entity), we saw how much code we need for creating a simple POJO
class. Thankfully, with Immutables, we can get all that for free by annotating an abstract class: 

```java

@Value.Immutable
public abstract class Article {

    abstract long getId();

    abstract String getTitle();

    abstract String getContent();

    abstract long getUserId();
}
```

The `@Value.Immutable` annotation says to the annotation processor that it should generate an implementation for this
class.

It is important to mention that we can place the `@Value.Immutable` annotation on a class, an interface or an annotation
type.

### Immutable `Article` Implementation

Let's look at what the Immutables library generates from the definition above:

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

The annotation processor generates the implementation class from the skeleton that we defined. The naming convention
is "Immutable" followed by the name of the annotated class.

The implementation class contains each of the methods we defined on the annotated class or interface, backed by attribute values. 

If we name our methods `get*`, the implementation will strip the "get" part and take the rest as the attribute name.
Every other naming will take the full method name as the attribute name.

In the basic implementation, there is no constructor. The annotation processor generates a builder by default. We omitted
the implementation code for the builder class to save some space. If you want to look into the implementation details,
please refer to the [Github repo](https://github.com/thombergs/code-examples/tree/master/immutables).

For working with the immutable objects, the annotation processor created `wither*` methods that help us to build a
new object from the current one. Each attribute has its own `with` method.

We can see how it is easy to create a class that provides us with all the perks of immutability. We didn't have to write
any boilerplate code.

## Using a Builder

Even though the constructor is the standard way for creating the object instance, the builder pattern makes things
easier. The builder pattern allows optional and default attributes.

### Default Builder

The immutable library comes with the builder pattern by default. We don't need to add anything specific to the class
definition:

```java

@Value.Immutable
public abstract class Article {

    abstract long getId();

    abstract String getTitle();

    abstract String getContent();

    abstract long getUserId();
}
```

The class definition is the same as in our previous examples. The `@Value.Immutable` annotation defines the builder on
this entity.

### Strict Builder

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

The `@Value.Style` annotation is a meta-annotation for defining what will the annotation processor generate. We set the
strictBuilder attribute to true, meaning that generated builder should be strict.

A strict builder means that we cannot set the value to the same variable twice inside building steps. We are making the
builder implementation immutable:

```java
public class BuildersService {
    public static StrictBuilderArticle createStrictArticle() {
        return ImmutableStrictBuilderArticle.builder()
                .id(0)
                .id(1)
                .build();
    }
}
```

Here, we are setting the `id` attribute twice, producing the following error:

```java
Exception in thread"main"java.lang.IllegalStateException:
        Builder of StrictBuilderArticle is strict,attribute is already set:id
```

If we were
to use a regular builder, the code above wouldn't throw this error.

### Staged builder

If we want to make sure that all required attributes are provided to the builder before we create the actual instance,
we can use a staged builder:

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

The staged builder is a strict builder by implication.

## Using a Constructor

Some use cases require that we use the regular constructor. As mentioned, the Immutables library creates a builder by
default, leaving the constructor in the private scope.

Let's look at how to define a class that generates a constructor for us, instead:

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

By setting the `@Value.Immutable` annotation we defined that we are building the immutable class.

To define the constructor, we need to annotate each attribute that should be part of that constructor with
the `@Value.Parameter` annotation.

If we would look into the generated implementation we would see that the constructor has the public scope.

### Using the `of()` Method

By default, the Immutables library provides the `of()` method to create a new immutable object:

```java
public class ConstructorService {
    public static ConstructorArticle createConstructorArticle() {
        return ImmutableConstructorArticle.of(0, "Lorem ipsum article!", "Lorem ipsum...");
    }
}
```


### Using the `new` Keyword

If we want to use the plain public constructor with the `new` keyword, we need to define it through the `@Value.Style`
annotation:

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

First, we define that our class should be immutable. Then we annotate which attribute should be part of the public
constructor.

The last thing that we need to do is to add `@Value.Style(of="new")` annotation to the class definition.

## Optional and Default Attributes

All attributes in the immutable class are mandatory by default. If we want to create a field where we can omit the
value, we can approach it in two different ways:

- use Java's `Optional` type
- use a default provider

### `Optional` Attributes

The Immutables library supports Java's `Optional` type. If we want to make some fields optional, we can just wrap them into an `Optional` object:

```java

@Value.Immutable
abstract class OptionalArticle {

    abstract Optional<Long> getId();

    abstract Optional<String> getTitle();

    abstract Optional<String> getContent();
}
```

By wrapping each object into the `Optional`, we are sure that the code will not fail if we don't provide the value.

We need to be careful not to overuse this approach. We should wrap only those attributes that should be optional.
Everything else, by default, should go as a mandatory attribute.

### Default Attributes

If we want to provide default values to the attributes that are not set using the builder or the constructor we can use
the `@Value.Default` annotation:

```java

@Value.Immutable
abstract class DefaultArticle {

    abstract Long getId();

    @Value.Default
    String getTitle() {
        return "Default title!";
    }

    abstract String getContent();

}
```

The methods annotated with the `@Value.Default` annotation should then return the default value.

## Derived and Lazy Attributes

### Derived Attributes

If we need to create a default value from other attributes, we can use the `@Value.Derived` annotation:

```java

@Value.Immutable
abstract class DerivedArticle {

    abstract Long getId();

    abstract String getTitle();

    abstract String getContent();

    @Value.Derived
    String getSummary() {
        String summary = getContent().substring(0,
                getContent().length() > 50 ? 50 :
                        getContent().length());
        return summary.length() == getContent().length() ? summary
                : summary + "...";
    }
}
```

Again, we first annotated the abstract class with the `@Value.Immutable` annotation.

The `summary` attribute should be derived from the value of the `content` attribute. We want to take only first fifty characters
from the content. After creating the method for getting the summary we need to annotate it with the `@Value.Derived`
annotation.

### Lazy Attributes

Deriving the value can be expensive operation we might want to do it only once and only when it is needed. To do this we
can use the `@Value.Lazy` annotation:

```java

@Value.Immutable
abstract class LazyArticle {

    abstract Long getId();

    abstract String getTitle();

    abstract String getContent();

    @Value.Lazy
    String summary() {
        String summary = getContent().substring(0,
                getContent().length() > 50 ? 50 :
                        getContent().length());
        return summary.length() == getContent().length() ? summary
                : summary + "...";
    }
}
```

After initializing the method with the `@Value.Lazy` we are sure that this value will be computed only when it is used
the first time.

## Working with Collections

### The `User` Entity

Our user entity has a list of articles. When I started writing this article, I was wondering how do collections behave
with immutability.

```java

@Value.Immutable
public abstract class User {

    public abstract long getId();

    public abstract String getName();

    public abstract String getLastname();

    public abstract String getEmail();

    public abstract String getPassword();

    public abstract List<Article> getArticles();
}
```

The `User` entity was built as any other immutable entity we created in this article. We annotated the class with
the `@Value.Immutable` annotation and created abstract methods for attributes that we wanted.

### Adding to a Collection

Let us see how, and when, can we add values to the articles list inside the user entity:

```java
public class CollectionsService {

    public static void main(String[] args) {

        Article article1 = ...;

        Article article2 = ...;

        Article article3 = ...;
        
        User user = ImmutableUser.builder()
                .id(1l)
                .name("Mateo")
                .lastname("Stjepanovic")
                .email("mock@mock.com")
                .password("mock")
                .addArticles(article1)
                .addArticles(article2)
                .build();

        user.getArticles().add(article3);

    }
}
```

After creating several articles, we can move on to user creation. The Immutables library provided us with the
method `addArticles()`. The method allows us to add articles one by one, even when we use the strict builder.

But what happens when we try to add a new article on an already built user?

```java
Exception in thread"main"java.lang.UnsupportedOperationException
        at java.base/java.util.Collections$UnmodifiableCollection.add(Collections.java:1060)
        at com.reflectoring.io.immutables.collections.CollectionsService.main(CollectionsService.java:45)
```

After adding the new article on the already built user, we get an `UnsupportedOperationException`. After building, the
list is immutable, and we cannot add anything new to it. If we want to expand this list, we need to create a new user.

## Styles

The `@Value.Style` is the annotation with which we control what code the annotation processor will generate. So far, we have used the `@Value.Style` annotation to generate the standard constructor
format.

We can use the annotation on several levels:

- on the package level
- on the top class level
- on the nested class level
- on the annotation level

The package level annotation will apply the style to the whole package.

The class level will take effect on the class where we placed it and on all nested classes.

Used on an annotation as a meta-annotation, all classes annotated with that annotation will use the given style.

__Note: It is the recommendation to use one or more meta-annotations instead of class or package level__

There are several things that we need to be aware of:

- If there is mixing in the applied styles they will be selected indeterministically. Styles are never merged.
- A style can be a powerful tool, and we need to be careful when using them.
- Styles are cached. When changing something on the style, we need to rebuild the project or even restart the IDE.

## Creating a Style Meta Annotation

Let's look at how to define new meta-annotation with a given style:

```java

@Target({ElementType.PACKAGE, ElementType.TYPE})
@Retention(RetentionPolicy.CLASS)
@Value.Style(
        of = "new",
        strictBuilder = true,
        allParameters = true,
        visibility = Value.Style.ImplementationVisibility.PUBLIC

)
public @interface CustomStyle {
}
```

After defining `@Target` and `@Retention` as usual with an annotation, we come to the `@Value.Style` annotation. The first value defined
that we want to use the `new` keyword. The next thing that we define is that we want to use the `strictBuilder` and
that all attributes should be annotated with the `@Value.Parameter` annotation. The last style defined is that the
implementation visibility will be public.

For more information about style possibilities, please refer to
the [official documentation.](https://immutables.github.io/style.html)

## Conclusion

We saw how the Immutables library helps us build immutable, thread-safe, and null-safe domain objects. It helps us build
clean and readable POJO classes.

Since it is a powerful tool we need to be careful how to use it. We can easily stray down the wrong path and overuse its
features.

The last thing that I want to point out is the `@Value.Style` annotation. The `@Value.Immutable` annotation tells *what*
will be generated, while the `@Value.Style` tells *how* it will be generated. This annotation can be a slippery slope, and we
need to be careful and go outside of the default setting only when we are certain that we need to.

For deeper reading on the Immutables library please refer to the [official page](https://immutables.github.io/).
   
