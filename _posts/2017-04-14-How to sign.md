---

title: Digital Signature in Java
categories: [java]
modified: 2017-04-14
author: artur
tags: [java, generated, number, programming, project, software, engineering, cryptography, jce, bouncycastle, signature, digital]
comments: true
ads: true
---

{% include sidebar_right %}

Often you come across the requirement to validate integrity and authenticity 
of data that was sent digitally. Digital signatures are the solution to this requirement.
So what do you need to sign the data? First, you need an asymmetric key pair. It consists of a private key,
that only the signer can access, and a public key or even better, a certificate.
The public key or the certificate is available for everyone. 

## Plain Java Signature
The simple way to produce a signature in Java 
looks like this:

```java
Signature ecdsaSignature = Signature.getInstance("SHA256withECDSA");
ecdsaSignature.initSign(eccPrivateKey);
ecdsaSignature.update(dataToSign);
byte[] signature = ecdsaSignature.sign();
```

Using this code you get a raw signature. It means that a hash value of the data was calculated and this hash value was
encrypted with the private key. So to check if the data was manipulated, you just have to calculate the
hash value of the data to be checked, decrypt the signature and to compare the results. This is called signature 
verification and looks like this:

```java
Signature ecdsaSignature = Signature.getInstance("SHA256withECDSA");
ecdsaSignature.initVerify(certificate);
ecdsaSignature.update(dataToVerify);
boolean isValide = ecdsaSignature.verify(rawSignature);
```

What are the advantages of doing it this way? The signature is small, the code is short and clear. It can be used if you have a requirement to keep 
the signature simple and quick. What disadvantages did you get by
this way? First, the verifier has to know which certificate he or she should use to verify the signature. Second, the verifier has to know
what signature algorithm he or she has to use to verify the signature. Third, the signer and the verifier have to bind the data and the signature.
It means you can use this kind of signature very well inside of one system.

## Cryptographic Message Syntax (CMS)
To avoid these disadvantages it is helpful to use a standard signature format. The standard is *Cryptographic Message Syntax (CMS)* defined in
[RFC5652](https://tools.ietf.org/html/rfc5652). CMS describes several standards of cryptographic data, but we are interested in the *Signed-data* format here.
The signed data in this format has a lot of information, that can help you to verify the signature. So how can you create such a data structure?

With JCE (Java Cryptography Extension), Java provides an interface for cryptographic operations. It's best practice to use this interface for cryptographic
operations. Implementations of JCE are called JCE providers. Your JDK already has a JCE provider named
[SUN](http://docs.oracle.com/javase/8/docs/technotes/guides/security/SunProviders.html#SUNProvider). 

However, JCE does not provide an interface for the Cryptographic Message Syntax.
That is why you have to use a different cryptographic library.
[BouncyCastle](https://www.bouncycastle.org/java.html) is a good choice. It is a JCE provider
and has a lot of additional cryptographic functionality on a high level of abstraction. The code to create a signature wit CMS and BouncyCastle can look like this (JavaDoc of BouncyCastle):

```java
List certList = new ArrayList();
CMSTypedData  msg = new CMSProcessableByteArray("Hello world!".getBytes());
certList.add(signCert);
Store certs = new JcaCertStore(certList);
CMSSignedDataGenerator gen = new CMSSignedDataGenerator();
ContentSigner sha256Signer = new JcaContentSignerBuilder("SHA256withECDSA").build(signKP.getPrivate());

gen.addSignerInfoGenerator(
  new JcaSignerInfoGeneratorBuilder(
    new JcaDigestCalculatorProviderBuilder().build())
      .build(sha256Signer, signCert));

gen.addCertificates(certs);
CMSSignedData sigData = gen.generate(msg, false);
```

Note that you can define if the data should be put into the CMS container alongside the data or not. With other words you can choose to create either 
an _attached_ or a _detached_ signature.
The CMS container contains the following:

* the signature
* the certificate that can be used for verifying
* the digital algorithm
* possibly the signed data itself.

It is also possible to create several signatures for the data and put them in the same container. That means several signers can sign the data and send
all their signatures in the same container.
The code to verify a *CMSSignedData* (again JavaDoc of BouncyCastle):

```java
Store certStore = cmsSignedData.getCertificates();
SignerInformationStore signers = cmsSignedData.getSignerInfos();
Collection c = signers.getSigners();
Iterator it = c.iterator();

while (it.hasNext()){
  SignerInformation signer = (SignerInformation)it.next();
  Collection certCollection = certStore.getMatches(signer.getSID());
  Iterator certIt = certCollection.iterator();
  X509CertificateHolder cert = (X509CertificateHolder)certIt.next();
  if (signer.verify(new JcaSimpleSignerInfoVerifierBuilder().build(cert))) {
    // successfully verified
  }
}
```

## Light Weight
If you want to use the whole functionality of a JCE implementation you have to install the "unlimited strength jurisdiction policy files" for the JVM. If you don't,
you'll get something like this

```
java.lang.SecurityException: Unsupported keysize or algorithm parameters 
or java.security.InvalidKeyException: Illegal key size
```

The reason for this exception is the restriction of the export of cryptographic technologies from the United States until 2000.
These restrictions limited the key length. Unfortunately, the JDK still does not have unrestricted implementation after the default installation,
and that's why you have to install the unrestricted policy files additionally.

As you guess it is not a big problem to get and to install the unrestricted policy files for *your* JVM. But what if you 
want to distribute your application? It can be pretty difficult for some users to solve this problem. The BouncyCastle library
has again a solution. It provides a light weight version of cryptographic operations. It means, that these operations don't use any JCE
provider. That's why it is not necessary to install unrestricted policy files. Maybe you already saw that some classes of the BouncyCastle
begin with _Jce_  (Java Cryptography Extension) or with _Jca_(Java Cryptography Architecture). These classes use JCE provider.
The light weight classes begin with _Bc_ and as said above don't use a JCE provider.
The code for signing with light weight version would look like this: 

```java
X509Certificate certificate = ...;

X509CertificateHolder x509CertificateHolder = new X509CertificateHolder(certificate.getEncoded());
String certAlgorithm = certificate.getPublicKey().getAlgorithm();

CMSTypedData message = new CMSProcessableByteArray(dataToSign);

AlgorithmIdentifier sigAlgId = new DefaultSignatureAlgorithmIdentifierFinder().find("SHA256WithECDSA");

AlgorithmIdentifier digAlgId = new DefaultDigestAlgorithmIdentifierFinder().find(sigAlgId);
AsymmetricKeyParameter privateKeyParameter = PrivateKeyFactory.createKey(
                                                      softCert.getPrivateKey().getEncoded());

ContentSigner signer = new BcECDSAContentSignerBuilder(sigAlgId, digAlgId).build(privateKeyParameter);

SignerInfoGeneratorBuilder signerInfoGeneratorBuilder = 
                       new SignerInfoGeneratorBuilder(new BcDigestCalculatorProvider());
SignerInfoGenerator infoGenerator = signerInfoGeneratorBuilder.build(signer, x509CertificateHolder);

CMSSignedDataGenerator dataGenerator = new CMSSignedDataGenerator();
dataGenerator.addSignerInfoGenerator(infoGenerator);

dataGenerator.addCertificate(x509CertificateHolder);

CMSSignedData signedData = dataGenerator.generate(message, true);
```

You get the same CMS container without installing any patches. You can verify the data with this code:

```java
Collection<SignerInformation> signers = cmsSignedData.getSignerInfos().getSigners();
List<SignerInformation> signerList = new ArrayList<>(signers);
SignerInformation signerFromCMS = signerList.get(0);
SignerId sid = signerFromCMS.getSID();

Store store = cmsSignedData.getCertificates();
Collection<X509CertificateHolder> certificateCollection = store.getMatches(sid);
ArrayList<X509CertificateHolder> x509CertificateHolders = new ArrayList<>(certificateCollection);
// we use the first certificate
X509CertificateHolder x509CertificateHolder = x509CertificateHolders.get(0);

BcECSignerInfoVerifierBuilder verifierBuilder = new BcECSignerInfoVerifierBuilder(
                                                      new BcDigestCalculatorProvider());
SignerInformationVerifier verifier = verifierBuilder.build(x509CertificateHolder);
boolean result = signerFromCMS.verify(verifier);
```

## Conclusion
There are two ways to create signature and to verify it. The first is to create a raw signature. This way is very short clear. But it does not provide enough 
information about signing process. The second way is to create a CMS container and is a little more complicated, but provides powerful tools to work with signatures. If you don't want 
to use any JCE provider, you can use the light weight version of cryptographic operations provided by BouncyCastle.
