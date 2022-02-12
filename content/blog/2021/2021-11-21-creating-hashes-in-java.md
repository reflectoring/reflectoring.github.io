---
title: "Creating Hashes in Java"
categories: ["Java"]
date: 2021-11-21T06:00:00
modified: 2021-11-14T06:00:00
authors: [pratikdas]
description: "A hash is a piece of text computed with a cryptographic hashing function. It is used for various purposes mainly in the security realm like securely storing sensitive information and safeguarding data integrity. In this post, we will illustrate the creation of common types of hashes in Java along with examples of using hashes for generating checksums of data files and for storing sensitive data like passwords and secrets."
image: images/stock/0044-lock-1200x628-branded.jpg
url: creating-hashes-in-java
---

A hash is a piece of text computed with a cryptographic hashing function. It is used for various purposes mainly in the
security realm like securely storing sensitive information and safeguarding data integrity.

In this post, we will illustrate the creation of common types of hashes in Java along with examples of using hashes for
generating checksums of data files and for storing sensitive data like passwords and secrets.

{{% github "https://github.com/thombergs/code-examples/tree/master/java-hashes" %}}

## Features of Hash Functions

Most cryptographic hash functions take a string of any arbitrary length as input and produce the hash as a fixed-length
value.

A hashing function is a one-way function, that is, a function for which it is practically infeasible to invert or
reverse the computation to produce the original plain text from the hashed output.

Apart from being produced by a unidirectional function, some of the essential features of a hash are:

- The size of the hash is always fixed and does not depend on the size of the input data.
- A hash of data is always unique. No two distinct data sets are able to produce the same hash. If it does happen, it's
  called a collision. Collision resistance is one of the measures of the strength of a hashing function.

## Hash Types

We will look at the following types of hash in this post :

1. MD5 Message Digest
2. Secure Hash Algorithm (SHA)
3. Password-Based Key Derivative Function with Hmac-SHA1 (PBKDF2WithHmacSHA1)

## MD5 Message Digest Algorithm

The MD5 is defined in [RFC 1321](https://tools.ietf.org/html/rfc1321), as a hashing algorithm to turn inputs of any
arbitrary length into a hash value of the fixed length of 128-bit (16 bytes).

The below example uses the MD5 hashing algorithm to produce a hash value from a String:

```java
import java.security.MessageDigest;

public class HashCreator {

   public String createMD5Hash(final String input)
           throws NoSuchAlgorithmException {

      String hashtext = null;
      MessageDigest md = MessageDigest.getInstance("MD5");

      // Compute message digest of the input
      byte[] messageDigest = md.digest(input.getBytes());

      hashtext = convertToHex(messageDigest);

      return hashtext;
   }

   private String convertToHex(final byte[] messageDigest) {
      BigInteger bigint = new BigInteger(1, messageDigest);
      String hexText = bigint.toString(16);
      while (hexText.length() < 32) {
         hexText = "0".concat(hexText);
      }
      return hexText;
   }
}
```

Here we have used the `digest()` method of the `MessageDigest` class from the `java.security` package to create the MD5
hash in bytes and then converted those bytes to hex format to generate the hash as text.

Some sample hashes generated as output of this program look like this:


| Input | Hash | 
| - | - | 
| aristotle | 51434272DDCB40E9CA2E2A3AE6231FA9 | 
| MyPassword | 48503DFD58720BD5FF35C102065A52D7 | 
| password123 | 482C811DA5D5B4BC6D497FFA98491E38 |


**The MD5 hashing function has been found to suffer from extensive vulnerabilities**. However, it remains suitable for
other non-cryptographic purposes, for example for determining the partition key for a particular record in a partitioned
database.

MD5 is a preferred hashing function in situations which require lower computational resources than the more recent
Secure Hash Algorithms (SHA) algorithms covered in the next section.

## Secure Hash Algorithm (SHA)

The SHA (Secure Hash Algorithm) is a family of cryptographic hash functions very similar to MD5 except it generates stronger hashes.


We will use the same `MessageDigest` class as before to produce a hash value using the SHA-256 hashing algorithm:

```java
public class HashCreator {

   public String createSHAHash(String input  
          throws NoSuchAlgorithmException {

      String hashtext = null;
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] messageDigest =
              md.digest(input.getBytes(StandardCharsets.UTF_8));

      hashtext = convertToHex(messageDigest);
      return hashtext;
   }

   private String convertToHex(final byte[] messageDigest) {
      BigInteger bigint = new BigInteger(1, messageDigest);
      String hexText = bigint.toString(16);
      while (hexText.length() < 32) {
         hexText = "0".concat(hexText);
      }
      return hexText;
   }
}
```

Other than the name of the algorithm, the program is exactly the same as before. Some sample hashes generated as output
of this program look like this:

| Input | Hash | 
| - | - | 
| aristotle | 9280c8db01b05444ff6a26c52efbe639b4879a1c49bfe0e2afdc686e93d01bcb | 
| MyPassword| dc1e7c03e162397b355b6f1c895dfdf3790d98c10b920c55e91272b8eecada2a | 
| password123 |ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f |

As we can see, the hashes produced by SHA-256 are 32 bytes in length. Similarly, SHA-512 produces hashes of length 64 bytes.

Java supports the following SHA-2 algorithms:

- SHA-224
- SHA-256
- SHA-384
- SHA-512
- SHA-512/224
- SHA-512/256

SHA-3 is considered more secure than SHA-2 for the same hash length. Java supports the following SHA-3 algorithms from Java 9 onwards:

- SHA3-224
- SHA3-256
- SHA3-384
- SHA3-512

Here are some sample hashes generated as output using SHA3-224 as the hashing function:

| Input | Hash | 
| - | - | 
| aristotle | d796985fc3189fd402ad5ef7608c001310b525c3f495b93a632ad392 | 
| MyPassword | 5dbf252c33ce297399aefedee5db51559d956744290e9aaba31069f2 |
| password123 |cc782e5480878ba3fb6bb07905fdcf4a00e056adb957ae8a03c53a52 |

We will encounter a `NoSuchAlgorithmException` exception if we try to use an unsupported algorithm.

## Securing a Hash with a Salt

A salt is a random piece of data that is used as an input in addition to the data that is passed into the hashing
function. The goal of salting is to defend against dictionary attacks or attacks against hashed passwords using a
rainbow table.

Let us create a salted MD5 hash by enriching the hash generation method we used in the earlier section:

```java
public class HashCreator {

   public String createPasswordHashWithSalt(final String textToHash) {
      try {
         byte[] salt = createSalt();
         return createSaltedHash(textToHash, salt);
      } catch (Exception e) {
         e.printStackTrace();
      }
      return null;
   }

   private String createSaltedHash(String textToHash, byte[] salt)
           throws NoSuchAlgorithmException {

      String saltedHash = null;
      // Create MessageDigest instance for MD5
      MessageDigest md = MessageDigest.getInstance("MD5");

      //Add salted bytes to digest
      md.update(salt);

      //Get the hash's bytes 
      byte[] bytes = md.digest(textToHash.getBytes());

      //Convert it to hexadecimal format to
      //get complete salted hash in hex format
      saltedHash = convertToHex(bytes);
      return saltedHash;
   }


   //Create salt
   private byte[] createSalt()
           throws NoSuchAlgorithmException,
           NoSuchProviderException {

      //Always use a SecureRandom generator for random salt
      SecureRandom sr = SecureRandom.getInstance("SHA1PRNG", "SUN");
      //Create array for salt
      byte[] salt = new byte[16];
      //Get a random salt
      sr.nextBytes(salt);
      //return salt
      return salt;
   }
}
```

Here we are generating a random salt using Java's `SecureRandom` class. We are then using this salt to update
the `MessageDigest` instance before calling the `digest` method on the instance to generate the salted hash.

## Password Based Key Derivative Function with HmacSHA1 (PBKDF2WithHmacSHA1)

PBKDF2WithHmacSHA1 is best understood by breaking it into its component parts :

* PBKDF2
* Hmac
* SHA1

Any cryptographic hash function can be used for the calculation of an HMAC (hash-based message authentication code). The resulting MAC algorithm is termed HMAC-MD5 or HMAC-SHA1 accordingly.

In the earlier sections, we have seen that the MD5 and SHA algorithms generate hashes which can be made more secure with the help of a salt. But due to the ever-improving computation capabilities of the hardware, hashes can still be cracked with brute force attacks. We can mitigate this by making the brute force attack slower.

The PBKDF2WithHmacSHA1 algorithm uses the same concept. It slows down the hashing method to delay the attacks but still fast enough to not cause any significant delay in generating the hash for normal use cases.

An example of generating the hash with PBKDF2WithHmacSHA1 is given below:

```java
public class HashCreator {

   public String generateStrongPasswordHash(final String password)
           throws NoSuchAlgorithmException,
           InvalidKeySpecException,
           NoSuchProviderException {
      int iterations = 1000;
      byte[] salt = createSalt();

      byte[] hash = createPBEHash(password, iterations, salt, 64);

      // prepend iterations and salt to the hash
      return iterations + ":"
              + convertToHex(salt) + ":"
              + convertToHex(hash);
   }

   //Create salt
   private byte[] createSalt()
           throws NoSuchAlgorithmException,
           NoSuchProviderException {

      //Always use a SecureRandom generator for random salt
      SecureRandom sr = SecureRandom.getInstance("SHA1PRNG", "SUN");

      //Create array for salt
      byte[] salt = new byte[16];

      //Get a random salt
      sr.nextBytes(salt);

      //return salt
      return salt;
   }

   //Create hash of password with salt, iterations, and keylength
   private byte[] createPBEHash(
           final String password,
           final int iterations,
           final byte[] salt,
           final int keyLength)
           throws NoSuchAlgorithmException,
           InvalidKeySpecException {

      PBEKeySpec spec = new PBEKeySpec(password.toCharArray(),
              salt, iterations, keyLength * 8);

      SecretKeyFactory skf = SecretKeyFactory
              .getInstance("PBKDF2WithHmacSHA1");

      return skf.generateSecret(spec).getEncoded();
   }
}
```

Here we have configured the algorithm with `1000` iterations and a random salt of length `16`. The iterations and salt value is prepended to the hash in the last step. We will need these values for verifying the hash as explained below.

This algorithm is used for hashing passwords before storing them in secure storage.

A sample password hash generated with this program looks like this:

```shell
1000:de4239996e6112a67fb89361def4933f:a7983b33763eb754faaf4c87f735b76c5a1410bb4a81f2a3f23c8159eab67569916e3a86197cc2c2c16d4af616705282a828e0990a53e15be6b82cfa343c70ef
```

If we observe the hash closely, we can see the password hash is composed of three parts containing the number of
iterations, salt, and the hash which are separated by `:`.

We will now verify this hash using the below program:

```java
public class HashCreator {


   private boolean validatePassword(final String originalPassword,
                                    final String storedPasswordHash)
           throws NoSuchAlgorithmException,
           InvalidKeySpecException {

      // Split the string by :
      String[] parts = storedPasswordHash.split(":");

      // Extract iterations, salt, and hash 
      // from the stored password hash
      int iterations = Integer.valueOf(parts[0]);
      byte[] salt = convertToBytes(parts[1]);
      byte[] hash = convertToBytes(parts[2]);

      byte[] originalPasswordHash = createPBEHash(
              originalPassword,
              iterations,
              salt,
              hash.length);

      int diff = hash.length ^ originalPasswordHash.length;
      for (int i = 0; i < hash.length
              && i < originalPasswordHash.length; i++) {

         diff |= hash[i] ^ originalPasswordHash[i];
      }

      return diff == 0;
   }

   //Create hash of password with salt, iterations, and keylength
   private byte[] createPBEHash(
           final String password,
           final int iterations,
           final byte[] salt,
           final int keyLength)
           throws NoSuchAlgorithmException,
           InvalidKeySpecException {

      PBEKeySpec spec = new PBEKeySpec(password.toCharArray(),
              salt, iterations, keyLength * 8);

      SecretKeyFactory skf = SecretKeyFactory
              .getInstance("PBKDF2WithHmacSHA1");

      return skf.generateSecret(spec).getEncoded();
   }
}
```

The `validatePassword` method in this code snippet takes the password in plain text which we want to verify against the stored hash of the password generated in the previous step.

In the first step, we have split the stored hash to extract the iterations, salt, and the hash and then used these values to regenerate the hash for comparing with the stored hash of the original password.

## Generating a Checksum for Verifying Data Integrity

Another common utility of hashes is for verifying whether the data (or file) at rest or during transit between two environments has been tampered with, a concept known as data integrity.

Since the hash function always produces the same output for the same given input, we can compare a hash of the source file with a newly created hash of the destination file to check that it is intact and unmodified.

For this, we generate a hash of the data called the checksum before storing or transferring. We generate the hash again before using the data. If the two hashes match, we determine that the integrity check is passed and the data has not been tampered with.


Here is a code snippet for generating a checksum of a file:

```java
public class HashCreator {
    public String createChecksum(final String filePath)
            throws FileNotFoundException,
            IOException,
            NoSuchAlgorithmException {

        MessageDigest md = MessageDigest.getInstance("SHA-256");
        try (DigestInputStream dis = new DigestInputStream(
                new FileInputStream(filePath), md)) {
            while (dis.read() != -1) ;
            md = dis.getMessageDigest();
        }

        String checksum = convertToHex(md.digest());
        return checksum;
    }
}
```

The `createChecksum()` method in this code snippet generates a SHA-256 hash of a file stored in a disk. A sample checksum for textual data stored in a csv file looks like this:

```shell
bcd7affc0dd150c42505513681c01bf6e07a039c592569588e73876d52f0fa27
```

The hash is generated again before using the data. If the two hashes match, we determine that the integrity check is passed and the data in the file has not been tampered with.


MD5 hashes are also used to generate checksums files because of their higher computation speed.

## Some Other Uses for Hashes

**Finding Duplicates:** Simple rule of hashing is that the same input generates the same hash. Thus, if two hashes are the same, then it means the inputs are also the same.

**Data Structures:** Hash tables are extensively used in data structures. Almost all data structures that support key-value pairs use hash tables. For example, `HashMap` and `HashSet` in Java, `map`, and `unordered_map` in C++ use hash tables.


## Conclusion

In this post, we looked at the different types of hashes and how they can be generated in Java applications.

Here are some key points from the post:

1. A hash is a piece of text computed with a hashing function that is a one-way function for which it is practically infeasible to reverse the computation to produce the original plain text from the hashed output.
2. No two distinct data sets are able to produce the same hash. This behavior is called a collision. Collision resistance is one of the measures of the strength of a hashing function.
3. The SHA (Secure Hash Algorithm) family of cryptographic hash functions generate stronger hashes than the hashes generated by MD5.
4. We can make a hash more secure by adding a random piece of data called salt to the data that is inputted into the hashing function.
5. The goal of salting is to defend against dictionary attacks or attacks against hashed passwords using a rainbow table.
6. We also saw the usage of hashes for verifying the data integrity of files during transfer and for storing sensitive data like passwords.


You can refer to all the source code used in the article
on [Github](https://github.com/thombergs/code-examples/tree/master/java-hashes).