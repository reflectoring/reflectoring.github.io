---
title: "Merge sort in Kotlin"
categories: ["Kotlin"]
date: 2024-01-18 00:00:00 +1100 
authors: [ezra]
excerpt: "In this tutorial, we'll discuss merge sort algorithm."
image: images/stock/0096-tools-1200x628-branded.jpg
url: merge sort in kotlin
---
## Introduction
Sorting is a fundamental operation that plays a crucial role in various applications. Among the many sorting algorithms, merge sort stands out for its efficiency and simplicity. In this blog post, we will delve into the details of merge sort and implement it in Kotlin.

## Merge Sort Algorithm
Merge Sort is a popular sorting algorithm that follows the divide and conquer paradigm. It was developed by John von Neumann in 1945. The basic idea behind Merge Sort is to divide the array into two halves, recursively sort each half and then merge the sorted halves to produce a sorted array.

Here are the main steps of the Merge Sort algorithm:

`Divide`: Divide the unsorted array into two halves until each sub-array contains only one element.
`Conquer`: Recursively sort each sub-array.
`Merge`: Merge the sorted sub-arrays to produce a single sorted array.

The merging process is a crucial step in Merge Sort. It involves comparing elements from the two sorted sub-arrays and merging them into a new sorted array.

### Kotlin Implementation
Now, let's dive into the implementation of Merge Sort in Kotlin. We'll start by defining a function for the merging process:

```kotlin
fun merge(left: IntArray, right: IntArray): IntArray {
    var i = 0
    var j = 0
    val merged = IntArray(left.size + right.size)
    
    for (k in 0 until merged.size) {
        when {
            i >= left.size -> merged[k] = right[j++]
            j >= right.size -> merged[k] = left[i++]
            left[i] <= right[j] -> merged[k] = left[i++]
            else -> merged[k] = right[j++]
        }
    }
    
    return merged
}
```
In this function, we compare elements from the left and right subarrays, merging them into a single sorted array.

Now, let's implement the recursive Merge Sort function:

```kotlin
fun mergeSort(arr: IntArray): IntArray {
    if (arr.size <= 1) return arr
    
    val mid = arr.size / 2
    val left = arr.copyOfRange(0, mid)
    val right = arr.copyOfRange(mid, arr.size)
    
    return merge(mergeSort(left), mergeSort(right))
}
```

In this code, the mergeSort function recursively divides the array into halves and calls itself until the base case is reached when the array size is 1 or empty. Then, it merges the sorted subarrays using the previously defined merge function.

### Testing the Merge Sort Implementation
Let's test our merge sort implementation with a sample array:
```kotlin
fun main() {
    val unsortedArray = intArrayOf(64, 34, 25, 12, 22, 11, 90)
    val sortedArray = mergeSort(unsortedArray)
    
    println("Original Array: ${unsortedArray.joinToString()}")
    println("Sorted Array: ${sortedArray.joinToString()}")
}
```
This program initializes an array, performs the merge sort and prints both the original and sorted arrays.

## Analysis of Merge Sort Algorithm
Merge Sort is a sorting algorithm that follows the divide-and-conquer paradigm. Let's analyze its key aspects.

### Time Complexity
Merge Sort guarantees a consistent time complexity of O(n log n) for the worst, average and best cases. This efficiency is achieved by dividing the array into halves and recursively sorting them before merging resulting in a logarithmic depth and linear work at each level.

#### Divide Phase
Dividing the array into halves requires O(log n) operations. This is because the array is continually divided until each subarray contains only one element.

#### Merge Phase
Merging two sorted arrays of size n/2 takes O(n) time. Since there are log n levels in the recursive tree, the total merging time is O(n log n).

The overall time complexity is dominated by the merging phase, making merge sort particularly efficient for large datasets. It outperforms algorithms with higher time complexities, such as Bubble Sort or Insertion Sort.

### Space Complexity
Merge Sort has a space complexity of O(n) due to the need for additional space to store the temporary merged arrays during the merging phase. Each recursive call creates new subarrays, and the merging process involves creating a new array that stores the sorted elements.

#### Temporary Arrays

During the merging phase, temporary arrays are created to store the sorted subarrays. The size of these arrays is proportional to the size of the input.

#### Recursive Stack

The recursive calls contribute to the space complexity. In the worst case, the maximum depth of the recursion tree is log n, which determines the space required for the function call stack.
Despite the additional space requirements, merge sort's stability, predictable performance and ease of parallelization make it a viable choice in scenarios where memory usage is not a critical concern.

### Stability and Parallelization
Merge sort is a stable sorting algorithm, meaning that equal elements maintain their relative order in the sorted output. This stability is essential in applications where the original order of equal elements should be preserved.

Additionally, merge sort is inherently parallelizable. The divide-and-conquer nature of the algorithm allows for straightforward parallel implementations. Each subarray can be sorted independently and the merging process can be parallelized leading to potential performance gains on multi-core architectures.

## Conclusion
Merge Sort is a highly efficient and predictable sorting algorithm with a consistent time complexity of O(n log n). Its stability and parallelizability make it a popular choice in various applications, especially when dealing with large datasets. While it incurs a space overhead due to the need for temporary arrays, the trade-off in terms of time complexity and reliability often justifies its use in practical scenarios. 
