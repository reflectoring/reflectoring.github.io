---
title: "Guide to Sorting in Kotlin"
categories: ["Kotlin"]
date: 2023-11-23 00:00:00 +1100
authors: [ezra]
excerpt: "In this tutorial, we'll discuss what sorting is and discuss the various methods we can use to sort various elements."
image: images/stock/0104-on-off-1200x628-branded.jpg
url: sorting in kotlin
---

Sorting refers to the process of arranging elements in a specific order. The order could be ascending or descending based on certain criteria such as numerical or lexicographical order. In this guide, we'll explore various sorting techniques and functions available in Kotlin, unveiling the simplicity and flexibility the Kotlin language offers.

## Basic Sorting in Kotlin

Let's take a look at how we can sort lists in Kotlin:

```kotlin
fun main() {
    val numbers = listOf(4, 2, 8, 1, 5)

    val sortedNumbers = numbers.sorted()
    println("Sorted numbers: $sortedNumbers")

    val descendingNumbers = numbers.sortedDescending()
    println("Descending numbers: $descendingNumbers")
}
```

In this code, we first create a list of `numbers`, sort them in ascending order using `sorted()` and then sort them in descending order using `sortedDescending()`.

Here is another example of how we can sort arrays in Kotlin:

```kotlin
fun main() {
    val numbersArrays = arrayOf(4, 2, 8, 1, 5)

    val sortedArrayNumbers = numbers.sorted()
    println("Sorted numbers: ${sortedNumbers.contentToString()}")

    val descendingNumbers = numbers.sortedDescending()
    println("Descending numbers: ${descendingNumbers.contentToString()}")
}

```

In our code above, we initialize an array named `numbersArrays` with integers and demonstrate sorting operations. First, it employs the sorted() function to create a new array `sortedArrayNumbers` containing the elements of numbers in ascending order. The sorted array is then printed to the console using contentToString(). Subsequently, the sortedDescending() function is applied to obtain another array, descendingNumbers, with the elements sorted in descending order and this array is printed as well.


## SortBy

The sortBy function in Kotlin is used to sort a collection for example a list or an array based on a specified key or custom sorting criteria.

 Here's an example using sortBy:

 ```kotlin
 data class Person(val name: String, val position: Int)

fun main() {
    val people = listOf(
        Person("John", 1),
        Person("Doe", 1),
        Person("Mary",3)
    )

    // Sorting people by position in ascending order
    val sortedPeople = people.sortedBy { it.position }
    println("Sorted by position: $sortedPeople")

    // Sorting people by position in descending order
    val reverseSortedPeople = people.sortedByDescending { it.position }
    println("Reverse sorted by position: $reverseSortedPeople")
}
 ```

 In this example, a `Person` data class is defined with a `name` and `position`. The people list is then sorted using the `sortedBy` function specifying that the sorting should be based on the position property. The result is a new list sortedPeople, where the people are sorted in ascending order of position. Similarly, `sortedByDescending` is used to sort in descending order.

 ## sortWith

 The sortWith function in Kotlin allows us to provide a custom comparator to define how elements in a collection should be compared and sorted.

 Here's an example using sortWith:
 ```kotlin
 data class Book(val title: String, val author: String, val publicationYear: Int)

fun main() {
    val books = listOf(
        Book("The Great Gatsby", "F. Scott Fitzgerald", 1925),
        Book("To Kill a Mockingbird", "Harper Lee", 1960),
        Book("1984", "George Orwell", 1949),
        Book("The Catcher in the Rye", "J.D. Salinger", 1951)
    )

    // Sorting books by publication year in ascending order using sortWith and a custom comparator
    val sortedBooks = books.sortedWith(compareBy { it.publicationYear })
    println("Books sorted by publication year: $sortedBooks")

    // Sorting books by publication year in descending order using sortWith and a custom comparator
    val reverseSortedBooks = books.sortedWith(compareByDescending { it.publicationYear })
    println("Books reverse sorted by publication year: $reverseSortedBooks")
}

 ```

 In this example, the `Book` data class represents books with information about their `title`, `author` and `publicationYear`. The `sortWith` function is then used with `compareBy` and `compareByDescending` to sort the books based on their publication years in both ascending and descending order. This demonstrates how we can apply custom sorting to different types of data.

 ## Conclusion

In this article we went through the basic of sort and also discussed the various mthods we can use to sort a list or an array inclusive of the sort(),sortWith and sortBy methods.