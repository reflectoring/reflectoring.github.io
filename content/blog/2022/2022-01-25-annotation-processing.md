---
title: "An Introduction to Annotations and Annotation Processing"
categories: ["Java"]
date: 2022-01-27 00:00:00 +1100 
modified: 2022-01-27 00:00:00 +1100
authors: [syedaf]
description: "An Introduction to Annotations and Annotation Processing"
image: 
url: 
---
[toc]

## An Introduction to Annotations and Annotation Processing 

An Annotation is a construct associated with Java source code elements such as classes, methods, and variables that provide information to the program at compile-time or run-time based on which the program can take further action. The Annotation Processor processes these Annotations at compile time to provide functionality such as code generation, error checking, etc.  

The java.lang.annotation package provides the Core annotation functionality and also gives us the capability to create our Custom annotations that can be processed with Annotation Processors.

In this article, we will discuss the topic of Annotations and demonstrate the power of Annotation Processing with a real-world example.

## Annotation Basics

An annotation is preceded by the @ sign. Some common examples of annotations are @Override and @Entity. These are Standard or built-in annotations provided by Java through the java.lang.annotations package. We can further extend the Core functionality to provide our custom annotations.

An Annotation by itself does not perform any action on the program. It simply provides information about the program that can be used at compile-time or run-time to perform further processing. For eg., if we had a Parent and Child class as below:

```java
public class ParentClass {

    public String getName() {..}
}

public class ChildClass extends ParentClass {

    @Override
    public String getname() {..}
}
```

If we were to run this program without the @Override annotation we would not get any error since  'getname' would just be an additional method to 'getName' in ParentClass. By adding the @Override annotation in ChildClass we enforce the rule that the overriding method in the child class should have the same case-sensitive name as that in the parent class, and so the program would throw an error at compile-time, thereby trapping an error which could have gone undetected even at run-time.



## Standard Annotations

Below are some of the most common Annotations in use. These are Standard annotations that Java provides as part of the java.lang.annotations package. In order to see their full effect it would be best to run the code snippets from the command line since most IDEs provide their custom options to suppress or elevate warnings.

### @SuppressWarnings 

**Use Case for @SuppressWarnings** - It is used to indicate that warnings on code compilation should be ignored. We may want to suppress warnings that clutter up the build output. @SuppressWarnings("unchecked") for example suppresses warnings associated with raw types. For eg., when we run the following code:

```java
public class SuppressWarningsDemo {

    public static void main(String[] args) {

        SuppressWarningsDemo swDemo = new SuppressWarningsDemo();
        swDemo.testSuppressWarning();
    }

    public void testSuppressWarning() {

        Map testMap = new HashMap();
        testMap.put(1, "Item_1");
        testMap.put(2, "Item_2");
        testMap.put(3, "Item_3");
    }
}
```

...from the command-line using the compiler switch -Xlint:unchecked to receive the full warning list, we get the following message:

```
javac -Xlint:unchecked .\com\reflectoring\SuppressWarningsDemo.java
Warning:
unchecked call to put(K,V) as a member of the raw type Map
```

The above code-block is an example of legacy Java code (prior to Java 5), where we could have Collections in which you could accidentally store mixed types of Objects. In order to introduce compile-time error checking Generics were introduced. So to get this legacy code to compile without error we would make the following change:

```java
change:
Map testMap = new HashMap();
to:
Map<Integer, String> testMap = new HashMap<>();
```

If we had a large legacy code base, we wouldn't want to go in and make lots of code changes since it would mean a lot of QA regression testing. The safer option would be to add the @SuppressWarning annotation to the Class so that the logs are not cluttered up with redundant warning messages. We would add the code as below:

```java
@SuppressWarnings({"rawtypes", "unchecked"})
public class SuppressWarningsDemo {
```

 Now if we compile the program, the console is free of warnings.

### @Deprecated

**Use Case for @Deprecated** - It is used to indicate that a method or type has been replaced with newer functionality. IDEs make use of annotation processing to throw a warning at compile-time, usually indicating the deprecated method with a strike-through. The following class declares a deprecated method. The attribute 'since' in the annotation tells us which version the element was deprecated, and 'forRemoval' indicates if the element is going to be removed in the next version.

```java
public class DeprecatedDemo {

    @Deprecated(since = "4.5", forRemoval = true)
    public void testLegacyFunction() {

        System.out.println("This is a legacy function");
    }
}
```

Now, calling the legacy method as below will trigger a compile-time warning indicating that the method call needs to be replaced:

```java
public class DeprecatedDemoTest {

    public static void main(String[] args) {

        DeprecatedDemo demo = new DeprecatedDemo();
        demo.testLegacyFunction();
    }
}

.\com\reflectoring\DeprecatedDemoTest.java:8: warning: [removal] testLegacyFunction() in DeprecatedDemo has been deprecated and marked for removal
        demo.testLegacyFunction();
            ^                     
1 warning
```

### @Override

**Use Case for @Override** - It is used to indicate that a method will be overriding the base class implementation. It is used to throw compile-time errors in cases such as typos in letter-casing.

So for example the base class could look like:

```java
public class Employee {

    public void getEmployeeStatus(){

        System.out.println("This is the Base Employee class");
    }
}
```

now if you had a Manager class extending Employee such as below with the initial 'e' in 'Employee' in 'getEmployeeStatus' in lower-case, the program would compile and run without an issue. 

```java
public class Manager extends Employee {

    public void getemployeeStatus(){

        System.out.println("This is the Manager class");
    }
}

public class OverrideTest {

    public static void main(String[] args) {

        Manager manager = new Manager();
        manager.getemployeeStatus();
    }
}
```

We now add the annotation @Override to the 'getemployeeStatus' method and we get a compile-time error, which forces us to correct the typo right away.

```java
public class Manager extends Employee {

    @Override
    public void getemployeeStatus(){

        System.out.println("This is the Manager class");
    }
}

.\com\reflectoring\Manager.java:5: error: method does not override or implement a method from a supertype
    @Override
    ^
1 error

```

### @FunctionalInterface 

**Use Case for @FunctionalInterface** - It is used to indicate that the interface cannot have more than one abstract method. The compiler throws an error in case there is more than one abstract method. Functional Interfaces were introduced in Java 8, to implement Lambda expressions and ensure that they didn't make use of more than one method. Even without the @FunctionalInterface annotation, the compiler will throw an error if you include more than one abstract method in the interface. So why do we need @FunctionalInterface if it is not mandatory? 

Let us take the example of the code below:

```java

@FunctionalInterface
interface Print {
    void printString(String testString);
}

public class FunctionalInterfaceTest {

    public static void main(String args[]) {
        Print testPrint = (String testString) -> System.out.println(testString);
        testPrint.printString("This is a String");
    }
}
```

If you add another method, 'printString2', to the Print interface, the compiler or the IDE will throw an error and this will be obvious right away. Now, what if the Print interface was in a separate module, and there was no @FunctionalInterface annotation. Some other developer could easily add another function to the interface, and break the code. By adding the @FunctionalInterface notation we get an immediate warning in the IDE, such as:

​	**Multiple non-overriding abstract methods found in interface com.reflectoring.Print**

So it is good practice to always include the @FunctionalInterface.

### @SafeVarargs

**Use Case for @SafeVarags** - The varargs functionality allowed the creation of methods with variable arguments. Prior to Java 5, the only option to creating methods with optional parameters was to create multiple methods, each with a different number of parameters. Varargs allowed us to create a single method to handle optional parameters with syntax as below:

```
void printStrings(String... stringList)

instead of ....void printStrings(String string1, String string2)
```

However, warnings were thrown when generics were used in the arguments. @SafeVarargs allowed for suppression of these warnings. For eg., consider the code below:

```
package com.reflectoring;

import java.util.Arrays;
import java.util.List;

public class SafeVarargsTest {

   private void printString(String test1, String test2) {

        System.out.println(test1);
        System.out.println(test2);
    }

    private void printStringVarargs(String... tests) {

        for (String test : tests) {

            System.out.println(test);
        }
    }

    private void printStringSafeVarargs(List<String>... testStringLists) {

        for (List<String> testStringList : testStringLists) {

            for (String testString : testStringList) {

                System.out.println(testString);
            }
        }
    }

    public static void main(String[] args) {

        SafeVarargsTest test = new SafeVarargsTest();

        test.printString("String1", "String2");
        test.printString("*******");

        test.printStringVarargs("String1", "String2");
        test.printString("*******");

        List<String> testStringList1 = Arrays.asList("One", "Two");
        List<String> testStringList2 = Arrays.asList("Three", "Four");

        test.printStringSafeVarargs(testStringList1, testStringList2);
    }
}

```

In the above code, 'printString' and 'printStringVarargs' achieved the same result. However, compiling the code gave a warning for printStringSafeVarargs, since it used Generics:

```java
javac -Xlint:unchecked .\com\reflectoring\SafeVarargsTest.java

.\com\reflectoring\SafeVarargsTest.java:28: warning: [unchecked] Possible heap pollution from parameterized vararg type List<String>
    private void printStringSafeVarargs(List<String>... testStringLists) {
                                                        ^
.\com\reflectoring\SafeVarargsTest.java:52: warning: [unchecked] unchecked generic array creation for varargs parameter of type List<String>[]
        test.printStringSafeVarargs(testStringList1, testStringList2);
                                   ^
2 warnings

```

By adding the SafeVarargs annotation as below, we could get rid of the error:

```java
@SafeVarargs
private void printStringSafeVarargs(List<String>... testStringLists) {
```



## Custom Annotations

These are Annotations that are custom created to serve a particular purpose. 

**Use Cases for Custom Annotations:**

1. Reduce repetition.
1. Automate the generation of boilerplate code.
2. Provide the capability to trap errors at compile time such as potential null pointer checks.
3. Customize run-time behavior based on the presence of custom annotations.

An example of a Custom annotation would be the @Company annotation below attached to the Employee class. When creating multiple instances of the Employee class we can skip adding the Company information in the constructor since those attributes would be automatically included.

```java
@Company{    
    name="ABC"
    city="XYZ"
}
public class CustomAnnotatedEmployee { .. }
```

To create a Custom annotation we need to declare it with the @interface keyword as below:

```java
public @interface Company{
}
```

In order to specify information about the scope of the annotation and the area it targets, such as compile-time or run-time, we need to add Meta-Annotations to the Custom Annotation. For eg., in order to specify that the Annotation applies to Classes only, we need to add @Target(ElementType.TYPE), which specifies that this annotation only applies to Classes, and @Retention(RetentionPolicy.RUNTIME), which specifies that this annotation only applies at run-time. We will discuss further details about Meta-Annotations once we get this basic example running.

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Company{
}
```

Next, we need to add the fields to the Custom annotation. In this case, we need 'name' and 'city'. So we add it as below:

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Company{
	String name() default "ABC";
	String city() default "XYZ";
}
```

Putting it all together, we create a CustomAnnotatedEmployee class and apply the annotation to it as below:

```java
@Company
public class CustomAnnotatedEmployee {

    private int id;
    private String name;

    public CustomAnnotatedEmployee(int id, String name) {
        this.id = id;
        this.name = name;
    }

    public void getEmployeeDetails(){

        System.out.println("Employee Id: " + id);
        System.out.println("Employee Name: " + name);
    }
}
```

Now we create a test class to test this out:

```java
import java.lang.annotation.Annotation;

public class TestCustomAnnotatedEmployee {

    public static void main(String[] args) {

        CustomAnnotatedEmployee employee = new CustomAnnotatedEmployee(1, "John Doe");
        employee.getEmployeeDetails();

        Annotation companyAnnotation = employee.getClass().getAnnotation(Company.class);
        Company company = (Company)companyAnnotation;

        System.out.println("Company Name: " + company.name());
        System.out.println("Company City: " + company.city());
    }
}
```

This would give the output below:

```java
Employee Id: 1
Employee Name: John Doe
Company Name: ABC
Company City: XYZ
```

So by introspecting the annotation at run-time we are able to access some common information of all employees and avoid the name for repetition.

Now, we will get into the details of Meta-Annotations, which we used in the example above:

### Meta Annotations

Meta Annotations are Annotations about Annotations provided by the java.lang.Annotations package that provide information about an annotation.

#### @Inherited

Normally an Annotation cannot be inherited but applying the @Inherited annotation to an annotation (meta annotation) allows it to be inherited. For eg:

```java
@Inherited
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Company{
    String name() default "ABC";
    String city() default "XYZ";
}
```

... since CustomAnnotatedEmployee below has the @Company annotation and CustomAnnotatedManager inherits from it, the CustomAnnotatedManager class does not need to include it. 

```java
@Company
public class CustomAnnotatedEmployee {

    private int id;
    private String name;

    public CustomAnnotatedEmployee(int id, String name) {
        this.id = id;
        this.name = name;
    }

    public void getEmployeeDetails(){

        System.out.println("Employee Id: " + id);
        System.out.println("Employee Name: " + name);
    }
}
```

Our CustomAnnotatedManager and  could be defined as follows:

```java
public class CustomAnnotatedManager extends CustomAnnotatedEmployee{

    public CustomAnnotatedManager(int id, String name) {
        super(id, name);
    }
}
```

Now if we run the test for the Manager class as below, we still get access to the annotation information, though the Manager class does not have the annotation.

```java
public class TestCustomAnnotatedManager {

    public static void main(String[] args) {

        CustomAnnotatedManager manager = new CustomAnnotatedManager(1, "John Doe");
        manager.getEmployeeDetails();

        Annotation companyAnnotation = manager.getClass().getAnnotation(Company.class);
        Company company = (Company)companyAnnotation;

        System.out.println("Company Name: " + company.name());
        System.out.println("Company City: " + company.city());
    }
}
```

#### @Documented

@Documented ensures that Custom Annotations show up in the JavaDocs.

Normally when we run JavaDoc on the class CustomAnnotatedManager the annotation information would not show up in the documentation. But when we use the @Documented annotation as below:

```
@Inherited
@Documented
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Company{
    String name() default "ABC";
    String city() default "XYZ";
}
```

 ...the annotation information would show up in the output too, as below:

```java
Package com.reflectoring
Class CustomAnnotatedEmployee

java.lang.Object
com.reflectoring.CustomAnnotatedEmployee

@Company
public class CustomAnnotatedEmployee
extends java.lang.Object

Constructor Summary
Constructors

Constructor	Description
CustomAnnotatedEmployee​(int id, java.lang.String name)
```

#### @Repeatable

@Repeatable allows multiple repeating Custom Annotations on a method, class, or field. In order to use a Repeatable Annotation, we need to wrap the Annotation in a Container class which refers to it as an array, as below:

```java
@Target(ElementType.TYPE)
@Repeatable(RepeatableCompanies.class)
@Retention(RetentionPolicy.RUNTIME)
public @interface RepeatableCompany {
    String name() default "Name_1";
    String city() default "City_1";
}
```

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface RepeatableCompanies {
    RepeatableCompany[] value() default{};
}
```

We declare our main Class as below:

```java
@RepeatableCompany
@RepeatableCompany(name =  "Name_2", city = "City_2")
public class RepeatedAnnotatedEmployee {
}
```

If we run a test on it as below:

```java
public class TestRepeatedAnnotation {

    public static void main(String[] args) {

        RepeatableCompany[] repeatableCompanies = RepeatedAnnotatedEmployee.class.getAnnotationsByType(RepeatableCompany.class);
        for (RepeatableCompany repeatableCompany : repeatableCompanies) {

            System.out.println("Name: " + repeatableCompany.name());
            System.out.println("City: " + repeatableCompany.city());
        }
    }
}
```

We get the following output which displays the value of multiple annotations:

```
Name: Name_1
City: City_1
Name: Name_2
City: City_2
```

#### @Target

@Target specifies at which element the Annotation can be used, for eg in the above example the annotation Company was defined only for TYPE and so it could only be applied to a Class.

```java
@Company
public class Employee {

    @Company
    public void getEmployeeStatus(){

        System.out.println("This is the Base Employee class");
    }
}
```

If we apply @Company to the method 'getEmployeeStatus' as above, we get a compiler error stating: "'@Company' not applicable to method."

The various self-explanatory Target types are:

​		ElementType.ANNOTATION_TYPE, 
​		ElementType.CONSTRUCTOR
​		ElementType.FIELD
​		ElementType.LOCAL_VARIABLE
​		ElementType.METHOD
​		ElementType.PACKAGE
​		ElementType.PARAMETER
​		ElementType.TYPE 

#### @Retention

@Retention specifies when the annotation is discarded.

​	  SOURCE - The annotation is used at compile-time and discarded at run-time.

​	  CLASS - The annotation is stored in the class file at compile time and discarded at run time.

​	  RUNTIME - The annotation is retained at run-time.

If we needed an annotation to only provide error checking at compile-time like @Override we would use SOURCE. If we need an annotation to provide functionality at run-time such as @Test in Junit we would use RUNTIME. To see a real example, create the following annotations in 3 separate files:

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.CLASS)
public @interface ClassRetention {
}

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.SOURCE)
public @interface SourceRetention {
}

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface RuntimeRetention {
}
```

Now create a class which uses all 3 annotations:

```java
@SourceRetention
@RuntimeRetention
@ClassRetention
public class EmployeeRetentionAnnotation {
}
```

In order to verify that only the run-time annotation is available at run-time, run a test as follows:

```java
public class RetentionTest {

    public static void main(String[] args) {

        SourceRetention[] sourceRetention = new EmployeeRetentionAnnotation().getClass().getAnnotationsByType(SourceRetention.class);
        System.out.println("Source Retentions at run-time: " + sourceRetention.length);

        RuntimeRetention[] runtimeRetention = new EmployeeRetentionAnnotation().getClass().getAnnotationsByType(RuntimeRetention.class);
        System.out.println("Run-time Retentions at run-time: " + runtimeRetention.length);

        ClassRetention[] classRetention = new EmployeeRetentionAnnotation().getClass().getAnnotationsByType(ClassRetention.class);
        System.out.println("Class Retentions at run-time: " + classRetention.length);
    }
}
```

The output would be as follows:

```
Source Retentions at run-time: 0
Run-time Retentions at run-time: 1
Class Retentions at run-time: 0
```

So we verified that only the RUNTIME annotation gets processed at run-time.

## Annotation Categories

#### Marker Annotations 

Marker Annotations do not contain any members or data. If we specified no parameters for the Company annotation in the Employee class below, it would process the default values.

```java

@Company
public class CustomAnnotatedEmployee {

    private int id;
    private String name;

    public CustomAnnotatedEmployee(int id, String name) {
        this.id = id;
        this.name = name;
    }

    public void getEmployeeDetails(){

        System.out.println("Employee Id: " + id);
        System.out.println("Employee Name: " + name);
    }
}
```

If we run the Test as below, it will print the default values:

```java
public class TestCustomAnnotatedEmployee {

    public static void main(String[] args) {

        CustomAnnotatedEmployee employee = new CustomAnnotatedEmployee(1, "John Doe");
        employee.getEmployeeDetails();

        Annotation companyAnnotation = employee.getClass().getAnnotation(Company.class);
        Company company = (Company)companyAnnotation;

        System.out.println("Company Name: " + company.name());
        System.out.println("Company City: " + company.city());
    }
}
```

We get the default output:

```
Employee Id: 1
Employee Name: John Doe
Company Name: ABC
Company City: XYZ
```

#### Single Value Annotations

Single Value Annotations contain only one member and the parameter is the value of the member. The single member has to be named '**value**'. 

Create a SingleMemberCompany Annotation which uses only the name field as below:

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface SingleMemberCompany {
    String value() default "ABC";
}
```

Create a class which uses the annotation as below.

```java
@SingleMemberCompany("XYZ")
public class SingleValueAnnotatedEmployee {

    private int id;
    private String name;

    public SingleValueAnnotatedEmployee(int id, String name) {
        this.id = id;
        this.name = name;
    }

    public void getEmployeeDetails(){

        System.out.println("Employee Id: " + id);
        System.out.println("Employee Name: " + name);
    }
}
```

Run a test as below:

```
public class TestSingleValueAnnotatedEmployee {

    public static void main(String[] args) {

        SingleValueAnnotatedEmployee employee = new SingleValueAnnotatedEmployee(1, "John Doe");
        employee.getEmployeeDetails();

        Annotation companyAnnotation = employee.getClass().getAnnotation(SingleMemberCompany.class);
        SingleMemberCompany company = (SingleMemberCompany)companyAnnotation;

        System.out.println("Company Name: " + company.value());
    }
}
```

The single value 'XYZ' overrides the default annotation value and the output is as below:

```
Employee Id: 1
Employee Name: John Doe
Company Name: XYZ
```

#### Full Annotations

They consist of multiple name value pairs. For eg. Company(name="ABC", city="XYZ"). Considering our original Company example:

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Company{
    String name() default "ABC";
    String city() default "XYZ";
}
```

Create the MultiValueAnnotatedEmployee class as below. Specify the parameters and values as below. The default values will be over-written.

```java
@Company(name = "AAA", city = "ZZZ")
public class MultiValueAnnotatedEmployee {
    
}
```

Run a test as below:

```java
public class TestMultiValueAnnotatedEmployee {

    public static void main(String[] args) {

        MultiValueAnnotatedEmployee employee = new MultiValueAnnotatedEmployee();

        Annotation companyAnnotation = employee.getClass().getAnnotation(Company.class);
        Company company = (Company)companyAnnotation;

        System.out.println("Company Name: " + company.name());
        System.out.println("Company City: " + company.city());
    }
}
```

The output is as below, and has overridden the default annotation values:

```
Company Name: AAA
Company City: ZZZ
```



## A real-world example

For our real-world example, we are going to simulate the functionality of the annotation @Test in JUnit. By marking our test functions with the @Test annotation we can determine at run-time, the methods in a class that need to be run as tests. 















