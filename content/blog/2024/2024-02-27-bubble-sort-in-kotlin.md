---
title: "Bubble Sort in Kotlin"
categories: ["Kotlin"]
date: 2024-02-27 00:00:00 +1100 
authors: [ezra]
excerpt: "In this tutorial, we'll discuss bubble sort algorithm"
image: images/stock/0118-keyboard-1200x628-branded.jpg
url: bubble-sort-in-kotlin
---


## Introduction

Bubble Sort, a basic yet instructive sorting algorithm, takes us back to the fundamentals of sorting. In this tutorial, we'll delve into the Kotlin implementation of Bubble Sort, understanding its simplicity and exploring its limitations. While not the most efficient sorting algorithm, Bubble Sort serves as an essential stepping stone for grasping fundamental sorting concepts.

## Bubble Sort Implementation

```kotlin
fun bubbleSort(arr: IntArray) {
    val n = arr.size

    for (i in 0 until n - 1) {
        for (j in 0 until n - i - 1) {
            if (arr[j] > arr[j + 1]) {
                val temp = arr[j]
                arr[j] = arr[j + 1]
                arr[j + 1] = temp
            }
        }
    }
}

fun main() {
    val array = intArrayOf(64, 34, 25, 12, 22, 11, 90)
    
    println("Original Array: ${array.joinToString(", ")}")
    
    bubbleSort(array)
    
    println("Sorted Array: ${array.joinToString(", ")}")
}
```

In this code:
`arr`: The input array that needs to be sorted.
`n`: The length of the array.

The sorting process involves two nested loops. The outer loop `(i)` iterates through each element of the array, and the inner loop `(j)` iterates from 0 to n - i - 1. This nested loop structure is fundamental to the Bubble Sort algorithm. Within these loops, the function checks whether the current element `arr[j]` is greater than the next element arr[j + 1]. If this condition is true, the elements are swapped. This swapping mechanism ensures that the largest element "bubbles" to the end of the array during each pass through the loops. The entire process is repeated until the entire array is sorted in ascending order.

The main function serves to demonstrate the application of the bubbleSort function. It initializes an array with a set of unsorted values, providing a practical input for the sorting algorithm. After printing the original array, the function calls bubbleSort to sort the array in-place. Finally, the sorted array is printed, allowing us to observe the transformation of the initial unsorted state to the sorted state as a result of the Bubble Sort algorithm. This structure provides a clear and concise way to visualize and understand the working of Bubble Sort within the Kotlin programming language.

## Bubble Sort Complexity

Bubble Sort's simplicity comes at the cost of efficiency. Let's analyze its time complexity:

Worst-Case Time Complexity (O(n²))

In the worst-case scenario, when the array is in reverse order, Bubble Sort's time complexity is O(n²). The algorithm's need for multiple passes through the entire array makes it impractical for large datasets.
Average-Case Time Complexity (O(n²)):

On average, Bubble Sort exhibits a time complexity of O(n²). Its nature of indiscriminate element comparisons and swaps results in quadratic time complexity as the input size increases.
Best-Case Time Complexity (O(n)):

The best-case scenario occurs when the array is already sorted, yielding a time complexity of O(n). However, even in the best case, multiple passes are required, making Bubble Sort less efficient compared to other algorithms designed for pre-sorted or partially sorted data.

## Conclusion

In conclusion, Bubble Sort provides a foundational understanding of sorting but falls short when efficiency is crucial. Its quadratic time complexity, especially in worst and average cases, makes it unsuitable for large datasets. While valuable for educational purposes, practical sorting scenarios often demand more efficient algorithms like QuickSort or MergeSort. Exploring Bubble Sort sets the stage for comprehending the trade-offs and optimizations employed in advanced sorting algorithms.
