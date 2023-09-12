---
title: "Introduction to KDoc"
categories: ["Kotlin"]
date: 2023-09-07 00:00:00 +1100 
authors: [ezra]
excerpt: "In this tutorial, we'll discuss KDoc which is a documentation langunage for Kotlin code."
image: images/stock/0104-on-off-1200x628-branded.jpg
url: introduction-to-kDoc
---

In this article, we'll discuss all that entails <em>KDoc</em> in Kotlin. [KDoc](https://kotlinlang.org/docs/kotlin-doc.html#links-to-elements) is simply language used to document code written using Kotlin specifically. KDoc allows us to provide documentation comments for classes, functions, properties and other elements in our code. It's the same as <em>Javadoc</em> which is used to document JAVA language. Essentially, <em>KDoc</em> combines syntax in <em>Javadoc </em>for the block tags and markdown for inline markup.
## 2. KDoc Syntax
Same as <em>javadoc, </em>KDoc comments usually start with /** and end with */.

Let’s see an example of KDoc:
```groovy
/**
 * Calculates the sum of two numbers.
 *
 * @param a The first number.
 * @param b The second number.
 * @return The sum of the two numbers.
 */
fun sum(a: Int, b: Int): Int {
    return a + b
}
```
KDoc in our example is written above our <em>sum</em> function. In this case, KDoc explains what task our function performs and also documents the parameters <em>a</em> and <em>b</em> which the function takes inclusive of the expected return value.

## 3. Block Tags
Block tags are used to provide documentation for larger sections of code or to describe multi-line content within KDoc.They are usually placed on separate lines.

These are the block tags supported by KDoc:

**@param**:This tag is used to document a value parameter of a function.

**@return**: Used to document the return value of a function.

**@constructor**: Used to document the primary constructor of a class.

**@receiver**: Documents the receiver of an extension function.

**@property**: This tag is used to document the property of a class that has the specified name.

**@throws, @exception**: Used to document exceptions that can be thrown by a method.

**@sample**:Used to embed the body of a function that has the specified qualified name into the documentation for the current element so as to show an example of how the particular element can be put into use.

**@see**: Used to add a link to a specific class or method.

**@author**: Used to specify the author of the element that is being documented.

**@since**:Used to specify the version of the software in which the element under documentation was introduced.

**KDoc does not support the <code class="code ">@deprecated</code> tag. Instead, please use the <code class="code ">@Deprecated</code> annotation.**

Code block example with block tags supported by KDoc:

```groovy
/**
 * A list of movies.
 *
 * This class is just a **documentation example**.
 *
 * @param T the type of movie in this list.
 * @property name the name of this movie list.
 * @constructor creates an empty movie list.
 * @see https://en.wikipedia.org/wiki/Inception
 * @sample https://www.thetoptens.com/movies/best-movies/
 */
class MovieList<T>(private val name: String) {

    private var movies: MutableList<T> = mutableListOf()

    /**
     * Adds a [movie] to this list.
     * @return the new number of movies in the list.
     */
    fun add(movie: T): Int {
        movies.add(movie)
        return movies.size
    }
}

/**
 * A movie with a title.
 *
 * @property title the title of this movie.
 * @constructor creates a movie with a title.
 */
data class Movie(private val title: String)

private fun movieListSample() {
    val movieList = MovieList<Movie>("My Favorite Movies")
    val movieCount = movieList.add(Movie("Inception"))
}
```

## 6. Conclusion
In this article, we discussed KDoc which is the documentation language for Kotlin code. We also went through the KDOc's syntax and the various tags it supports.