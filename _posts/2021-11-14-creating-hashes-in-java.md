---
title: "Creating Hashes in Java"
categories: [java]
date: 2021-10-28 06:00:00 +1000
modified: 2021-10-28 06:00:00 +1000
author: pratikdas
excerpt: "Hypertext Transfer Protocol (HTTP) is an application-layer protocol widely used for transmitting hypermedia documents like HTML, and API payloads. It is commonly used for communication between applications which publish their capabilities in the form of REST APIs. Applications built with Java rely on some form of HTTP client to make API invocations on other applications. This post provides an overview of some of the major libraries that are used as HTTP clients by Java applications for making HTTP calls."
image:
  auto: 0074-stack
---
A hash is a piece of text computed with a cryptographic hashing function. It is used for various purposes in the security domain like creating a checksum of a data file and securely storing a piece of data as a digest instead of in plain text.

Most cryptographic hash functions take a string of any arbitrary length as input and produce a fixed-length value called the hash. It is a one-way function, that is, a function for which it is practically infeasible to invert or reverse the computation.

In this post, we will look at various types of hashes and how they are created in Java.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/java-hashes" %}

## Features of Hash Functions

The essential features of hash functions are:

- These functions are one-directional. They cannot be reversed.
- Size of the digest or hash is always fixed and does not depend on the size of the data.
- It is always unique, no two distinct data set are able to produce a similar hash.

## Types of Hash

We will look at the following types of Hash in this post :

1. MD-5
2. SHA
3. PBKDF2WithHmacSHA1

## MD-5
The MD5, defined in [RFC 1321](https://tools.ietf.org/html/rfc1321), is a hash algorithm to turn inputs into a fixed 128-bit (16 bytes) length of the hash value.

The below example uses MD5 to produce a hash value from a String.

```java
public class HashCreator {

    public String createMD5Hash(final String input) {
        String hashtext = null;
        try {
          MessageDigest md = MessageDigest.getInstance("MD5");
              // digest() method is called to calculate message digest
              //  of the input
              byte[] messageDigest = md.digest(input.getBytes());

              hashtext = convertToHex(messageDigest);
        } catch (NoSuchAlgorithmException e) {
          e.printStackTrace();
          return null;
        }
        return hashtext;
    }

    private String convertToHex(byte[] messageDigest) {
        String hashtext = null;
        BigInteger no = new BigInteger(1, messageDigest);
            hashtext = no.toString(16);
            while (hashtext.length() < 32) {
                hashtext = "0" + hashtext;
            }
        return hashtext;
    }
}

```


The MD5 Message-Digest Algorithm is a widely used cryptographic hash function that produces a 128-bit (16-byte) hash value. It’s very simple and straight forward; the basic idea is to map data sets of variable length to data sets of a fixed length.

## SHA
The SHA (Secure Hash Algorithm) is one of the popular cryptographic hash functions.  In this tutorial, let's have a look at how we can perform SHA-256 and SHA3-256 hashing operations using various Java libraries.

The SHA-256 algorithm generates an almost-unique, fixed-size 256-bit (32-byte) hash. This is a one-way function, so the result cannot be decrypted back to the original value.
The SHA (Secure Hash Algorithm) is a family of cryptographic hash functions. It is very similar to MD5 except it generates more strong hashes.

```java
public class HashCreator {

    public String createSHAHash(String input){ 
        String hashtext = null;
        try {
             // Static getInstance method is called with hashing SHA 
             MessageDigest md = MessageDigest.getInstance("SHA3-224");
             byte[] messageDigest =  md.digest(input.getBytes(StandardCharsets.UTF_8)); 
             
             hashtext = convertToHex(messageDigest);
        }catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
            return null;
        }
        return hashtext;
    }

    private String convertToHex(byte[] messageDigest) {
        String hashtext = null;
        BigInteger no = new BigInteger(1, messageDigest);
            hashtext = no.toString(16);
            while (hashtext.length() < 32) {
                hashtext = "0" + hashtext;
            }
        return hashtext;
    }
}

```


Java supports the following SHA-2 algorithms:

- SHA-224
- SHA-256
- SHA-384
- SHA-512
- SHA-512/224
- SHA-512/256

The SHA-256 produces a 256-bit output, 32 bytes, while SHA-512 produces a 512-bit output, 64 bytes.

Java supports the following SHA-3 algorithms:

- SHA3-224
- SHA3-256
- SHA3-384
- SHA3-512


## Securing Hash with Salt
## PBKDF2WithHmacSHA1
MD5 and SHA algorithms generate secure hashes and can be made more secure with the help of salt. But due to available faster hardware, hashes can still be cracked with brute force attacks. We can mitigate this by making the brute force attack slower. 

The PBKDF2WithHmacSHA1 algorithm uses the same concept. It slows down the hashing method to delay the attacks but still fast enough to not cause any significant delay in generating the hash. An example of generating the hash with PBKDF2WithHmacSHA1 is given below:

```java

```

Here we have configured the algorithm with follwoing parameters:

This is often used for hashing passwords and before storing them in a secure storage.

## Generating Checksum

## Uses of Hash
Finding Duplicates: Simple rule of hashing is that the same input generates the same hash. Thus, if two hashes are same, then it means the inputs are also the same (assuming hashing methods are collision resistant).

Verify Integrity: Data integrity is used to check whether the data at rest or during transit between two environments has been tampered. For this we generate a hash of the data called the checksum before storing or transfering. The hash is generated again before using the data. If the two hashes match, we determine that the integrity check is passed and the data is not tampered. We generated a checksum of a file in an earlier example.

Data Structures: Hash tables are extensively used in data structures. Almost all data structures that support key-value pairs use hash tables. For example, HashMap and HashSet in Java, map, and unordered_map in C++ use hash tables.

## Conclusion

In this post, we looked at the different types of hashes and how they can be generated in Java applications. 

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/java-hashes).