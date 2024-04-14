---
title: "Quick Sort in Kotlin"
categories: ["Kotlin"]
date: 2024-02-27 00:00:00 +1100 
authors: [ezra]
excerpt: "In this tutorial, we'll discuss quick sort algorithm"
image: images/stock/0135-sorted-1200x628-branded.jpg
url: quick-sort-in-kotlin
---

Sorting is a fundamental operation in computer science and Quick Sort stands out as one of the most efficient sorting algorithms. In this blog, we will explore the Quick Sort algorithm in Kotlin, understanding its principles, implementation and performance characteristics. Quick Sort's elegance lies in its divide-and-conquer strategy making it a go-to choice for efficient sorting in various applications.

## Quick Sort Overview
Quick Sort follows the divide-and-conquer paradigm, breaking down the sorting process into three main steps: partitioning, sorting and combining.

### Partitioning

The algorithm selects a pivot element from the array and rearranges the array elements so that elements smaller than the pivot element are on the left, and elements greater are on the right.
The pivot element is now in its final sorted position.

### Sorting 

The algorithm now recursively applies the same process to the sub-arrays on the left and right of the initial pivot element.
Each recursive call involves selecting a new pivot element and partitioning the sub-array around it.

### Combining

The sorted sub-arrays are combined to produce the final sorted array.

## Implementation in Kotlin

Let's take a look at an implementation in Kotlin:

```kotlin
fun quickSort(arr: IntArray, low: Int, high: Int) {
    if (low < high) {
        val pivotIndex = partition(arr, low, high)
        quickSort(arr, low, pivotIndex - 1)
        quickSort(arr, pivotIndex + 1, high)
    }
}

fun partition(arr: IntArray, low: Int, high: Int): Int {
    val pivot = arr[high]
    var i = low - 1

    for (j in low until high) {
        if (arr[j] <= pivot) {
            i++
            swap(arr, i, j)
        }
    }

    swap(arr, i + 1, high)
    return i + 1
}

fun swap(arr: IntArray, i: Int, j: Int) {
    val temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
}

fun main() {
    val array = intArrayOf(64, 34, 25, 12, 22, 11, 90)
    
    println("Original Array: ${array.joinToString(", ")}")
    
    quickSort(array, 0, array.size - 1)
    
    println("Sorted Array: ${array.joinToString(", ")}")
}
```
In this code,  the `quickSort()` function recursively divides the input array into sub-arrays and sorts them. It checks if the range specified by the parameters low and high is valid (i.e., low is less than high). If so, it determines the pivot element's final position using the partition function and then recursively applies the `quickSort()` function to the sub-arrays on the left and right of the pivot. The `partition()` function plays a crucial role by selecting a pivot element (in this case, the last element) and rearranging the array such that elements smaller than the pivot are on the left and those greater are on the right. The function returns the index where the pivot element is now in its sorted position. The `swap()` function facilitates the swapping of elements within the array. 

The `main()` function showcases the algorithm by initializing an array with unsorted values, printing the original array, calling the `quickSort()` function to sort the array and finally printing the sorted array. 

Overall, the code elegantly demonstrates the divide-and-conquer strategy of Quick Sort providing an efficient solution for sorting arrays in Kotlin.

## Quick Sort Complexity

### Time Complexity

On average, Quick Sort achieves an O(n log n) time complexity, making it highly efficient.
In the worst-case scenario, when a poor pivot choice consistently leads to unbalanced partitions, the time complexity degrades to O(n²). However, such cases are rare in practice.

### Space Complexity

Quick Sort is an in-place sorting algorithm, meaning it doesn't require additional memory proportional to the input size.

## Conclusion
In conclusion, Quick Sort stands as a powerful sorting algorithm with impressive average-case performance. Its divide-and-conquer strategy, combined with efficient in-place sorting, makes it a preferred choice for applications demanding fast and reliable sorting. While understanding the intricacies of the algorithm, developers can appreciate the balance it strikes between simplicity and efficiency. Incorporating Quick Sort into our toolkit empowers us to handle sorting tasks with elegance and speed a crucial skill in the realm of algorithmic problem-solving.