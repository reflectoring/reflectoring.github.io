---

title: A Random pitfall
categories: [java]
modified: 2017-02-16
author: rudi
tags: [random, performance, threadLocalRandom, math, generated, number, programming, project, software, engineering]
comments: true
ads: true
---

{% include sidebar_right %}

From time to time we need a randomly generated Number in Java. In this case we are normally using [java.util.Random](https://docs.oracle.com/javase/7/docs/api/java/util/Random.html) which provides a stream of pseudo generated Numbers. But there are some use cases in which the direct usage may cause some unexpected problems.

This is the ordinary way to generate a Number:

```java
// Random
Random random = new Random();
random.nextInt();//nextDouble(), nextBoolean(), nextFloat(), ...
```

Alternatively, we can use the Math Class:

```java
// Math
Math.random();
```

Whereby the Math class just holds an instance of Random to generating Numbers.

```java
// Math
public static double random() {
    Random rnd = randomNumberGenerator;
    if (rnd == null) rnd = initRNG(); // return a new Random Instance
    return rnd.nextDouble();
}
```

According to the Javadoc, the usage of java.util.Random is thread safe. But the concurrent use
of the same Random instance across different threads may cause contention and consequently poor performance.
The reason for this is the usage of so called Seeds for the generation of random numbers. A Seed is a simple number which provides the basis for the generation of new random numbers. This happens within the method `next()` which is used within Random:

```java
// Random
protected int next(int bits) {
    long oldseed, nextseed;
    AtomicLong seed = this.seed;
    do {
        oldseed = seed.get();
        nextseed = (oldseed * multiplier addend) & mask;
    } while (!seed.compareAndSet(oldseed, nextseed));
    return (int)(nextseed >>> (48 - bits));
}
```

First, the old seed and a new one are stored over two auxiliary variables. The principle by which the new seed is created is not important at this point.
To save the new seed, the `compareAndSet()` method is called. This replaces the old seed with the next new seed, but  only under the condition that the old seed corresponds to the seed currently set.
If  the value in the meantime was manipulated by a concurrent thread, the method return false, which means that the old value did not match the excepted value.
This is done within a loop till the variables matches the excepted values. And this is the point which could cause poor performance and contention.


Thus, if more threads are actively generating new random numbers with the same instance of Random, the higher the probability that the above mentioned case occurs.
For programs that generate many (very many) random numbers, this procedure is not recommended. In this case you should use [ThreadLocalRandom](https://docs.oracle.com/javase/7/docs/api/java/util/concurrent/ThreadLocalRandom.html) instead, which was added to Java in version 1.7.


ThreadLocalRandom extends Random and adds the option to restrict its use to the respective thread instance.
For this purpose, an instance of ThreadLocalRandom is held in an internal map for the respective thread and returned by calling `current()`.

```java
ThreadLocalRandom.current().nextInt()
```

## Conclusion

The pitfall described above does not mean that it's forbidden to share a Random Instance between several threads. There is no problem with turning one or two extra rounds in a loop, but if you generate a huge amount of random numbers in different threads, just bear the above mentioned solution in mind. This could save you some debug time :)
