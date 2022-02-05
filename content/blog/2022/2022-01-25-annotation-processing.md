---
title: "An Introduction to Annotations and Annotation Processing in Java"
categories: ["Java"]
date: 2022-01-27 00:00:00 +1100 
modified: 2022-01-27 00:00:00 +1100
authors: ["syedaf"]
description: "An Introduction to Annotations and Annotation Processing"
image: images/stock/0116-post-its-1200x628-branded.jpg
url: java-annotation-processing
---

An **annotation** is a construct associated with Java source code elements such as classes, methods, and variables. Annotations provide information to a program at compile time or at runtime based on which the program can take further action. An **annotation processor** processes these annotations at compile time or runtime to provide functionality such as code generation, error checking, etc.  

The `java.lang` package provides some core annotations and also gives us the capability to create our custom annotations that can be processed with annotation processors.

In this article, we will discuss the topic of annotations and demonstrate the power of annotation processing with a real-world example.

{{% github "https://github.com/thombergs/code-examples/tree/master/core-java/annotation-processing/introduction-to-annotations" %}}

## Annotation Basics

An annotation is preceded by the `@` symbol. Some common examples of annotations are `@Override` and `@SuppressWarnings`. These are built-in annotations provided by Java through the `java.lang` package. We can further extend the core functionality to provide our custom annotations.

An annotation by itself does not perform any action. It simply provides information that can be used at compile time or runtime to perform further processing. 

Let's look at the `@Override` annotation as an example:

```java
public class ParentClass {
  public String getName() {...}
}

public class ChildClass extends ParentClass {
  @Override
  public String getname() {...}
}
```

We use the `@Override` annotation to mark a method that exists in a parent class, but that we want to override in a child class. The above program throws an error during compile time because the `getname()` method in `ChildClass` is annotated with `@Override` even though it doesn't override a method from `ParentClass` (because there is no `getname()` method in `ParentClass`). 

By adding the `@Override` annotation in `ChildClass`, the compiler can enforce the rule that the overriding method in the child class should have the same case-sensitive name as that in the parent class, and so the program would throw an error at compile time, thereby catching an error which could have gone undetected even at runtime.

## Standard Annotations

Below are some of the most common annotations available to us. These are standard annotations that Java provides as part of the `java.lang` package. To see their full effect it would be best to run the code snippets from the command line since most IDEs provide their custom options that alter warning levels.

### `@SuppressWarnings`

We can use the `@SuppressWarnings` annotation to indicate that warnings on code compilation should be ignored. We may want to suppress warnings that clutter up the build output. `@SuppressWarnings("unchecked")`, for example, suppresses warnings associated with raw types.

Let's look an example where we might want to use `@SuppressWarnings`:
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

If we run this program from the command-line using the compiler switch `-Xlint:unchecked` to receive the full warning list, we get the following message:

```text
javac -Xlint:unchecked ./com/reflectoring/SuppressWarningsDemo.java
Warning:
unchecked call to put(K,V) as a member of the raw type Map
```

The above code-block is an example of legacy Java code (prior to Java 5), where we could have collections in which we could accidentally store mixed types of objects. To introduce compile time error checking generics were introduced. So to get this legacy code to compile without error we would change:

```java
Map testMap = new HashMap();
```

to

```java
Map<Integer, String> testMap = new HashMap<>();
```

If we had a large legacy code base, we wouldn't want to go in and make lots of code changes since it would mean a lot of QA regression testing. So we might want to add the `@SuppressWarning `annotation to the class so that the logs are not cluttered up with redundant warning messages. We would add the code as below:

```java
@SuppressWarnings({"rawtypes", "unchecked"})
public class SuppressWarningsDemo {
  ...
}
```

 Now if we compile the program, the console is free of warnings.

### `@Deprecated`

We can use the `@Deprecated` annotation to mark that a method or type has been replaced with newer functionality. 

IDEs make use of annotation processing to throw a warning at compile time, usually indicating the deprecated method with a strike-through to tell the developer that they shouldn't use this method or type any more. 

The following class declares a deprecated method:

```java
public class DeprecatedDemo {

  @Deprecated(since = "4.5", forRemoval = true)
  public void testLegacyFunction() {

    System.out.println("This is a legacy function");
  }
}
```

The attribute `since` in the annotation tells us in which version the element was deprecated, and `forRemoval` indicates if the element is going to be removed in the next version.

Now, calling the legacy method as below will trigger a compile time warning indicating that the method call needs to be replaced:

```java
./com/reflectoring/DeprecatedDemoTest.java:8: warning: [removal] testLegacyFunction() in DeprecatedDemo has been deprecated and marked for removal
    demo.testLegacyFunction();
      ^           
1 warning
```

### `@Override`

We already had a look at the `@Override` annotation above. We can use it to indicate that a method will be overriding the method with the same signature in a parent class. It is used to throw compile time errors in cases such as typos in letter-casing as in this code example:

```java
public class Employee {
  public void getEmployeeStatus(){
    System.out.println("This is the Base Employee class");
  }
}

public class Manager extends Employee {
  public void getemployeeStatus(){
    System.out.println("This is the Manager class");
  }
}
```

We intended to override the `getEmployeeStatus()` method but instead we misspelled the method name. This can lead to serious bugs. The program above would compile and run without issue without catching that bug.

If we add the annotation `@Override` to the `getemployeeStatus()` method, we get a compile time error, which causes a compile error and forces us to correct the typo right away:

```text
./com/reflectoring/Manager.java:5: error: method does not override or implement a method from a supertype
  @Override
  ^
1 error

```

### `@FunctionalInterface `

The `@FunctionalInterface` annotation is used to indicate that an interface cannot have more than one abstract method. The compiler throws an error in case there is more than one abstract method. Functional interfaces were introduced in Java 8, to implement Lambda expressions and to ensure that they didn't make use of more than one method. 

Even without the `@FunctionalInterface` annotation the compiler will throw an error if you include more than one abstract method in the interface. So why do we need `@FunctionalInterface` if it is not mandatory? 

Let us take the example of the code below:

```java
@FunctionalInterface
interface Print {
  void printString(String testString);
}
```

If we add another method `printString2()` to the `Print` interface, the compiler or the IDE will throw an error and this will be obvious right away. 

Now, what if the `Print` interface was in a separate module, and there was no `@FunctionalInterface` annotation? The developers of that other module could easily add another function to the interface and break your code. Further, now we have to figure out which of the two is the right function in our case. By adding the `@FunctionalInterface` annotation we get an immediate warning in the IDE, such as this:

```text
Multiple non-overriding abstract methods found in interface com.reflectoring.Print
````

So it is good practice to always include the `@FunctionalInterface` if the interface should be usable as a Lambda.

### `@SafeVarargs`

The varargs functionality allows the creation of methods with variable arguments. Prior to Java 5, the only option to create  methods with optional parameters was to create multiple methods, each with a different number of parameters. Varargs allows us to create a single method to handle optional parameters with syntax as below:

```java
// we can do this:
void printStrings(String... stringList)

// instead of having to do this:
void printStrings(String string1, String string2)
```

However, warnings are thrown when generics are used in the arguments. `@SafeVarargs` allows for suppression of these warnings:

```java
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

In the above code, `printString()` and `printStringVarargs()` achieve the same result. Compiling the code, however, produces a warning for `printStringSafeVarargs()` since it used generics:

```text
javac -Xlint:unchecked ./com/reflectoring/SafeVarargsTest.java

./com/reflectoring/SafeVarargsTest.java:28: warning: [unchecked] Possible heap pollution from parameterized vararg type List<String>
  private void printStringSafeVarargs(List<String>... testStringLists) {
                            ^
./com/reflectoring/SafeVarargsTest.java:52: warning: [unchecked] unchecked generic array creation for varargs parameter of type List<String>[]
    test.printStringSafeVarargs(testStringList1, testStringList2);
                   ^
2 warnings
```

By adding the SafeVarargs annotation as below, we can get rid of the warning:

```java
@SafeVarargs
private void printStringSafeVarargs(List<String>... testStringLists) {
```

## Custom Annotations

These are annotations that are custom created to serve a particular purpose. We can create them ourselves. We can use custom annotations to

1. reduce repetition,
2. automate the generation of boilerplate code,
3. catch errors at compile time such as potential null pointer checks,
4. customize runtime behavior based on the presence of a custom annotation.

An example of a custom annotation would be this `@Company` annotation:

```java
@Company{  
  name="ABC"
  city="XYZ"
}
public class CustomAnnotatedEmployee { 
  ... 
}
```

When creating multiple instances of the `CustomAnnotatedEmployee` class, all instances would contain the same company `name` and `city`, so wouldn't need to add that information to the constructor anymore.

To create a custom annotation we need to declare it with the `@interface` keyword:

```java
public @interface Company{
}
```

To specify information about the scope of the annotation and the area it targets, such as compile time or runtime, we need to add meta annotations to the custom annotation. 

For example, to specify that the annotation applies to classes only, we need to add `@Target(ElementType.TYPE)`, which specifies that this annotation only applies to classes, and `@Retention(RetentionPolicy.RUNTIME)`, which specifies that this annotation must be available at runtime. We will discuss further details about meta annotations once we get this basic example running. 

With the meta annotations, our annotation looks like this:

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Company{
}
```

Next, we need to add the fields to the custom annotation. In this case, we need `name` and `city`. So we add it as below:

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Company{
	String name() default "ABC";
	String city() default "XYZ";
}
```

Putting it all together, we can create a `CustomAnnotatedEmployee` class and apply the annotation to it as below:

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

Now we can create a test class to read the `@Company` annotation at runtime:

```java
import java.lang.annotation.Annotation;

public class TestCustomAnnotatedEmployee {

  public static void main(String[] args) {

    CustomAnnotatedEmployee employee = new CustomAnnotatedEmployee(1, "John Doe");
    employee.getEmployeeDetails();

    Annotation companyAnnotation = employee
            .getClass()
            .getAnnotation(Company.class);
    Company company = (Company)companyAnnotation;

    System.out.println("Company Name: " + company.name());
    System.out.println("Company City: " + company.city());
  }
}
```

This would give the output below:

```text
Employee Id: 1
Employee Name: John Doe
Company Name: ABC
Company City: XYZ
```

So by introspecting the annotation at runtime we can access some common information of all employees and avoid a lot of repetition if we had to construct a lot of objects.


## Meta Annotations

Meta annotations are annotations applied to other annotations that provide information about the annotation to the compiler or the runtime environment.

Meta annotations can answer the following questions about an annotation:

1. Can the annotation be inherited by child classes?
2. Does the annotation need to show up in the documentation?
3. Can the annotation be applied multiple times to the same element?
4. What specific element does the annotation apply to, such as class, method, field, etc.?
5. Is the annotation being processed at compile time or runtime?

### `@Inherited`

By default an annotation is not inherited from a parent class to a child class. Applying the `@Inherited` meta annotation to an annotation allows it to be inherited:

```java
@Inherited
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Company{
  String name() default "ABC";
  String city() default "XYZ";
}

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

public class CustomAnnotatedManager extends CustomAnnotatedEmployee{
  public CustomAnnotatedManager(int id, String name) {
    super(id, name);
  }
}
```

Since `CustomAnnotatedEmployee` has the `@Company` annotation and `CustomAnnotatedManager` inherits from it, the `CustomAnnotatedManager` class does not need to include it.


Now if we run the test for the Manager class, we still get access to the annotation information, even though the Manager class does not have the annotation:

```java
public class TestCustomAnnotatedManager {

  public static void main(String[] args) {
    CustomAnnotatedManager manager = new CustomAnnotatedManager(1, "John Doe");
    manager.getEmployeeDetails();

    Annotation companyAnnotation = manager
            .getClass()
            .getAnnotation(Company.class);
    Company company = (Company)companyAnnotation;

    System.out.println("Company Name: " + company.name());
    System.out.println("Company City: " + company.city());
  }
}
```

### `@Documented`

`@Documented` ensures that custom annotations show up in the JavaDocs.

Normally, when we run JavaDoc on the class `CustomAnnotatedManager` the annotation information would not show up in the documentation. But when we use the `@Documented` annotation, it will:

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

### `@Repeatable`

`@Repeatable` allows multiple repeating custom annotations on a method, class, or field. To use the `@Repeatable` annotation we need to wrap the annotation in a container class which refers to it as an array:

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

We declare our main class as below:

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

    RepeatableCompany[] repeatableCompanies = RepeatedAnnotatedEmployee.class
            .getAnnotationsByType(RepeatableCompany.class);
    for (RepeatableCompany repeatableCompany : repeatableCompanies) {
      System.out.println("Name: " + repeatableCompany.name());
      System.out.println("City: " + repeatableCompany.city());
    }
  }
}
```

We get the following output which displays the value of multiple `@RepeatableCompany` annotations:

```text
Name: Name_1
City: City_1
Name: Name_2
City: City_2
```

### `@Target`

`@Target` specifies on which elements the annotation can be used, for example in the above example the annotation `@Company` was defined only for `TYPE` and so it could only be applied to a class.

Let's see what happens if we apply the `@Company` annotation to a method:

```java
@Company
public class Employee {

  @Company
  public void getEmployeeStatus(){
    System.out.println("This is the Base Employee class");
  }
}
```

If we applied the `@Company` annotation to the method `getEmployeeStatus()` as above, we get a compiler error stating: `'@Company' not applicable to method.`

The various self-explanatory target types are:

* `ElementType.ANNOTATION_TYPE`
* `ElementType.CONSTRUCTOR`
* `ElementType.FIELD`
* `ElementType.LOCAL_VARIABLE`
* `ElementType.METHOD`
* `ElementType.PACKAGE`
* `ElementType.PARAMETER`
* `ElementType.TYPE`

### `@Retention`

`@Retention` specifies when the annotation is discarded.

* `SOURCE` - The annotation is used at compile time and discarded at runtime.

* `CLASS` - The annotation is stored in the class file at compile time and discarded at run time.

* `RUNTIME` - The annotation is retained at runtime.

If we needed an annotation to only provide error checking at compile time like `@Override` does, we would use `SOURCE`. If we need an annotation to provide functionality at runtime such as `@Test` in Junit we would use `RUNTIME`. To see a real example, create the following annotations in 3 separate files:

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

Now create a class that uses all 3 annotations:

```java
@SourceRetention
@RuntimeRetention
@ClassRetention
public class EmployeeRetentionAnnotation {
}
```

To verify that only the runtime annotation is available at runtime, run a test as follows:

```java
public class RetentionTest {

  public static void main(String[] args) {

    SourceRetention[] sourceRetention = new EmployeeRetentionAnnotation()
            .getClass()
            .getAnnotationsByType(SourceRetention.class);
    System.out.println("Source Retentions at runtime: " + sourceRetention.length);

    RuntimeRetention[] runtimeRetention = new EmployeeRetentionAnnotation()
            .getClass()
            .getAnnotationsByType(RuntimeRetention.class);
    System.out.println("Run-time Retentions at runtime: " + runtimeRetention.length);

    ClassRetention[] classRetention = new EmployeeRetentionAnnotation()
            .getClass()
            .getAnnotationsByType(ClassRetention.class);
    System.out.println("Class Retentions at runtime: " + classRetention.length);
  }
}
```

The output would be as follows:

```text
Source Retentions at runtime: 0
Run-time Retentions at runtime: 1
Class Retentions at runtime: 0
```

So we verified that only the `RUNTIME` annotation gets processed at runtime.

## Annotation Categories

Annotation categories distinguish annotations based on the number of parameters that we pass into them. By categorizing annotations as parameter-less, single value or multi-value, we are able to reason about annotations in a more concise manner. 

### Marker Annotations 

Marker annotations do not contain any members or data. The `isAnnotationPresent()` method is used at run-time to determine the presence or absence of the annotation, based on which further decisions can be made. For example, if our company had several clients with different data transfer mechanisms, we could annotate the class with an annotation indicating the method of data transfer as below:

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface CSV {
}
```

The client class could use the annotation as below:

```java
@CSV
public class XYZClient {

}
```

If we run the Test as below, we can take a decision on whether to write out the information to CSV or an Excel file, based on the presence of the annotation:

```java
public class TestMarkerAnnotation {

  public static void main(String[] args) {

  XYZClient client = new XYZClient();
  Class clientClass = client.getClass();

    if (clientClass.isAnnotationPresent(CSV.class)){
        System.out.println("Write client data to CSV.");
    } else {
        System.out.println("Write client data to Excel file.");
    }
  }
}
```

We get the output:

```text
Write client data to CSV.
```

### Single-Value Annotations

Single-value annotations contain only one member and the parameter is the value of the member. The single member has to be named `value`. 

Let's create a `SingleValueAnnotationCompany` annotation that uses only the value field for the name, as below:

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface SingleValueAnnotationCompany {
  String value() default "ABC";
}

```

Create a class which uses the annotation as below.

```java
@SingleValueAnnotationCompany("XYZ")
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

```java
public class TestSingleValueAnnotatedEmployee {

  public static void main(String[] args) {
    SingleValueAnnotatedEmployee employee = new SingleValueAnnotatedEmployee(1, "John Doe");
    employee.getEmployeeDetails();

    Annotation companyAnnotation = employee
            .getClass()
            .getAnnotation(SingleValueAnnotationCompany.class);
    SingleValueAnnotationCompany company = (SingleValueAnnotationCompany)companyAnnotation;

    System.out.println("Company Name: " + company.value());
  }
}
```

The single value 'XYZ' overrides the default annotation value and the output is as below:

```text
Employee Id: 1
Employee Name: John Doe
Company Name: XYZ
```

### Full Annotations

They consist of multiple name value pairs. For example `Company(name="ABC", city="XYZ")`. Considering our original Company example:

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Company{
  String name() default "ABC";
  String city() default "XYZ";
}
```

Let's create the `MultiValueAnnotatedEmployee` class as below. Specify the parameters and values as below. The default values will be overwritten.

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

```text
Company Name: AAA
Company City: ZZZ
```



## Building a Real-World Annotation Processor

For our real-world annotation processor example, we are going to do a simple simulation of the annotation `@Test` in JUnit. By marking our functions with the `@Test` annotation we can determine at runtime which of the methods in a test class need to be run as tests. 

We first create the annotation as a marker annotation for methods:

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD) 
public @interface Test {
}
```

Next, we create a class `AnnotatedMethods`, to which we will apply the `@Test` annotations to the method `test1()`. This will enable the method to be executed at runtime. The method `test2()` does not have an annotation, and should not be executed at runtime.

```java
public class AnnotatedMethods {

  @Test
  public void test1() {
    System.out.println("This is the first test");
  }

  public void test2() {
    System.out.println("This is the second test");
  }
}

```

Now we create the test to run the `AnnotatedMethods` class: 

```java
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;

public class TestAnnotatedMethods {

  public static void main(String[] args) throws Exception {

    Class<AnnotatedMethods> annotatedMethodsClass = AnnotatedMethods.class;

    for (Method method : annotatedMethodsClass.getDeclaredMethods()) {

      Annotation annotation = method.getAnnotation(Test.class);
      Test test = (Test) annotation;

      // If the annotation is not null
      if (test != null) {

        try {
          method.invoke(annotatedMethodsClass
                  .getDeclaredConstructor()
                  .newInstance());
        } catch (Throwable ex) {
          System.out.println(ex.getCause());
        }

      }
    }
  }
}
```

By calling `getDeclaredMethods()`, we're getting the methods of our `AnnotatedMethods` class. Then, we're iterating through the methods and checking each method if it is annotated with the`@Test` annotation. Finally, we perform a runtime invocation of the methods that were identified as being annotated with `@Test`.

We want to verify the `test1()` method will run since it is annotated with `@Test`, and `test2()` will not run since it is not annotated with `@Test`.

The output is:

```text
This is the first test
```

So we verified that `test2()`, which did not have the` @Test` annotation, did not have its output printed. 

## Conclusion

We did an overview of annotations, followed by a simple real-world example of annotation processing. 

We can further use the power of annotation processing to perform more complex automated tasks such as creating builder source files for a set of POJOs at compile time. A builder is a design pattern in Java that is used to provide a better alternative to constructors when there is a large number of parameters involved or there is a need for multiple constructors with optional parameters.  If we had a few dozen POJOs, the code generation capabilities of the annotation processor would save us a lot of time by creating the corresponding builder files at compile time. 

By fully leveraging the power of annotation processing we will be able to skip a lot of repetition and save a lot of time.

You can play around with the code examples from this articles [on GitHub](https://github.com/thombergs/code-examples/tree/master/core-java/annotation-processing/introduction-to-annotations).





