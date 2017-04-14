---
layout: article
title: Digital Signature in Java
categories: [hacks]
modified: 2017-04-14
author: artur
tags: [generated, number, programming, project, software, engineering, cryptography]
comments: true
ads: false
image:
  feature:
  teaser: teaser/signature.jpg
  thumb:
---

Often you have to sign data in your application.
It gives you integrity and authenticity by sending the data.
So what do you need to sign the data? First, you need an asymmetric key pair. It consists of a private key,
that only signer can access to and a public key or better a certificate.
The public key or certificate is available for everyone. The simple way to produce a signature looks like this

```java
import java.security.Signature;

Signature ecdsaSignature = Signature.getInstance("SHA256withECDSA");
ecdsaSignature.initSign(eccPrivateKey);
ecdsaSignature.update(dataToSign);
byte[] signature = ecdsaSignature.sign();
```

By this code you got a raw signature. It means, a hash value of the data was calculated and this hash value was
encrypted with the private key. So if you like to check, if the data was manipulated, you just have to calculate the
hash value of the data to be checked, to decrypt the signature and to compare the results. It is called verification and looks like this

```java
import java.security.Signature;

Signature ecdsaSignature = Signature.getInstance("SHA256withECDSA");
ecdsaSignature.initVerify(certificate);
ecdsaSignature.update(dataToVerify);
boolean isValide = ecdsaSignature.verify(rawSignature);
```

What are advantages of this way? The signature is small, the code is small and clear. It can be used, if you have a requirement to keep 
the signature simple and quick, for example by signing a URL, if you want to add signature to your URL. What disadvantages did you get by
this way? First, the verifier has to know which certificate he or she should use to verify the signature. Second, the verifier has to know
what signature algorithm he or she has to use to verify the data. Third, the signer and the verifier have to bind the data and signature. It means you can use this kind 
of signature very well inside of one system.

To avoid these disadvantages it is helpful to use a standard formats of signature. The standard is *Cryptographic Message Syntax (CMS)* defined in
[RFC5652](https://tools.ietf.org/html/rfc5652). CMS describes several standards of cryptographic data, but we are interested in *Signed-data* format.
The signed data in this format has a lot of information, that can help us to verify the signature. So how can you create such data structure?
Native java means are not enough in this case. That is why you have to chose a cryptographic library. [BouncyCastle](https://www.bouncycastle.org/java.html) is a good choice. It is a JCE-Provider
and has a lot cryptographic functions of high abstract level. The code to create a signature can look like this (JavaDoc of BouncyCastle)

```java
import org.bouncycastle.cert.jcajce.JcaCertStore;
import org.bouncycastle.cms.CMSException;
import org.bouncycastle.cms.CMSProcessableByteArray;
import org.bouncycastle.cms.CMSSignedData;
import org.bouncycastle.cms.CMSSignedDataGenerator;
import org.bouncycastle.cms.CMSTypedData;
import org.bouncycastle.cms.jcajce.JcaSignerInfoGeneratorBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.OperatorCreationException;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.operator.jcajce.JcaDigestCalculatorProviderBuilder;
import org.bouncycastle.util.Store;

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

Note, that you can define, if also the data and not only signature should be in the CMS-Container.
With this container you got the signature,
the certificate, that can be used for verifying, digital algorithm, probably the signed data etc.
It is also possible to create several signatures for the data and put them in the container. It means you can send this kind of signature
to a third party, for instance, you can sign data, that are provided by a web service and the consumer wants to verify the signature.
The code to verify a *CMSSignedData* (again JavaDoc of BounceCastle)

```java
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cms.CMSException;
import org.bouncycastle.cms.CMSSignedData;
import org.bouncycastle.cms.SignerInformation;
import org.bouncycastle.cms.SignerInformationStore;
import org.bouncycastle.cms.jcajce.JcaSimpleSignerInfoVerifierBuilder;
import org.bouncycastle.operator.OperatorCreationException;
import org.bouncycastle.util.Store;

Store certStore = cmsSignedData.getCertificates();
SignerInformationStore signers = cmsSignedData.getSignerInfos();
Collection c = signers.getSigners();
Iterator it = c.iterator();

while (it.hasNext())
  {
    SignerInformation signer = (SignerInformation)it.next();
    Collection certCollection = certStore.getMatches(signer.getSID());
    Iterator certIt = certCollection.iterator();
    X509CertificateHolder cert = (X509CertificateHolder)certIt.next();
    if (signer.verify(new JcaSimpleSignerInfoVerifierBuilder().build(cert))) {
           verified++;
       }
   }
```

If you want to use the whole functionality of a JCE implementation you have to install unrestricted policy files for the JVM. If you don't,
you'll get something like this
```java
java.lang.SecurityException: Unsupported keysize or algorithm parameters" or "java.security.InvalidKeyException: Illegal key size
```

As you guess it is not a big problem to get and install the unrestricted policy files for *your* JVM. But what if you 
want to distribute you application. It can be pretty difficult for some users to solve this problem. The BouncyCastle library
has a solution for this problem. It provides light weight version of cryptographic operation. It means, that these operations don't use any JCE
provider. That's why it is not necessary to install unrestricted policy files. Maybe you already saw, that some classes of the BouncyCastle
begin with _Jce_  (Java Cryptography Extension) or with _Jca_(Java Cryptography Architecture). These classes use JCE-Provider.
The light weight classes begin with _Bc_.
The code for signing with light weight version would look like this

```java
import org.bouncycastle.asn1.x509.AlgorithmIdentifier;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cms.CMSException;
import org.bouncycastle.cms.CMSProcessableByteArray;
import org.bouncycastle.cms.CMSSignedData;
import org.bouncycastle.cms.CMSSignedDataGenerator;
import org.bouncycastle.cms.CMSTypedData;
import org.bouncycastle.cms.SignerInfoGenerator;
import org.bouncycastle.cms.SignerInfoGeneratorBuilder;
import org.bouncycastle.crypto.params.AsymmetricKeyParameter;
import org.bouncycastle.crypto.util.PrivateKeyFactory;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.DefaultDigestAlgorithmIdentifierFinder;
import org.bouncycastle.operator.DefaultSignatureAlgorithmIdentifierFinder;
import org.bouncycastle.operator.OperatorCreationException;
import org.bouncycastle.operator.bc.BcDigestCalculatorProvider;

X509Certificate certificate = ...;

X509CertificateHolder x509CertificateHolder = new X509CertificateHolder(certificate.getEncoded());
String certAlgorithm = certificate.getPublicKey().getAlgorithm();

CMSTypedData message = new CMSProcessableByteArray(dataToSign);

AlgorithmIdentifier sigAlgId = new DefaultSignatureAlgorithmIdentifierFinder().find("SHA256WithECDSA");

AlgorithmIdentifier digAlgId = new DefaultDigestAlgorithmIdentifierFinder().find(sigAlgId);
AsymmetricKeyParameter privateKeyParameter = PrivateKeyFactory.createKey(softCert.getPrivateKey().getEncoded());

ContentSigner signer = new BcECDSAContentSignerBuilder(sigAlgId, digAlgId).build(privateKeyParameter);

SignerInfoGeneratorBuilder signerInfoGeneratorBuilder = new SignerInfoGeneratorBuilder(new BcDigestCalculatorProvider());
SignerInfoGenerator infoGenerator = signerInfoGeneratorBuilder.build(signer, x509CertificateHolder);

CMSSignedDataGenerator dataGenerator = new CMSSignedDataGenerator();
dataGenerator.addSignerInfoGenerator(infoGenerator);

dataGenerator.addCertificate(x509CertificateHolder);

CMSSignedData signedData = dataGenerator.generate(message, true);
```

You get the same CMS container without installing some patches. You can verify the data with this code

```java
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cms.CMSException;
import org.bouncycastle.cms.SignerId;
import org.bouncycastle.cms.SignerInformation;
import org.bouncycastle.cms.SignerInformationVerifier;
import org.bouncycastle.operator.OperatorCreationException;
import org.bouncycastle.operator.bc.BcDigestCalculatorProvider;
import org.bouncycastle.util.Store;

Collection<SignerInformation> signers = cmsSignedData.getSignerInfos().getSigners();
List<SignerInformation> signerList = new ArrayList<>(signers);
SignerInformation signerFromCMS = signerList.get(0);
SignerId sid = signerFromCMS.getSID();

Store store = cmsSignedData.getCertificates();
Collection<X509CertificateHolder> certificateCollection = store.getMatches(sid);
ArrayList<X509CertificateHolder> x509CertificateHolders = new ArrayList<>(certificateCollection);
// we use the first certificate
X509CertificateHolder x509CertificateHolder = x509CertificateHolders.get(0);

BcECSignerInfoVerifierBuilder verifierBuilder = new BcECSignerInfoVerifierBuilder(new BcDigestCalculatorProvider());
SignerInformationVerifier verifier = verifierBuilder.build(x509CertificateHolder);
boolean result = signerFromCMS.verify(verifier);
```

## Conclusion
There are two ways to create signature and to verify it. The first way creates small signature and is very clear. But it does not have enough 
information about signing process. The second way is little more complicated, but provides powerful tools to work with signatures.  
