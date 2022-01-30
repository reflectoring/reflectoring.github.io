---
wtitle: "An Introduction to Annotations and Annotation Processing"
categories: ["Java"]
date: 2022-01-27 00:00:00 +1100 
modified: 2022-01-27 00:00:00 +1100
authors: [syedaf]
description: "Overview of annotations. Implementation of a real-world example of an Annotation Processor"
image: 
url: 
---
[toc]

## An Introduction to Annotations and Annotation Processing 

An Annotation is a construct associated with Java source code elements such as classes, methods, and variables that provide information to the program at compile-time or run-time based on which the program can take further action. The Annotation Processor processes these Annotations at compile time to provide functionality such as code generation, error checking, etc.  

The java.lang.annotation package provides the Core annotation functionality and also gives us the capability to create our Custom annotations that can be processed with Annotation Processors.

In this article, we will discuss the topic of Annotations and demonstrate the power of Annotation Processors with a real-world example.

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

 The method in the Developer sub-class 'getempName' would throw an error at compile-time stating that the method getEmpName was not overridden and hence we would be able to catch the error due to a typo.

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

In the above code, 'printString' and 'printStringVarargs' achieved the same result. However, compiling the code gave a warning:

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

... since @Company is inherited the CustomAnnotatedManager class does not need to include it. Our CustomAnnotatedManager could be defined as follows:

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

Ensures that Custom Annotations show up in the JavaDocs.

Normally when we run JavaDoc on the class CustomAnnotatedManager the annotation information would not show up in the documentation. But when we use the @Documented annotation as below the annotation information would show up in the output too, as below:

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

If we apply @Company to the method 'getEmployeeStatus', we get a compiler error stating: "'@Company' not applicable to method."

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

If we needed an annotation to only provide error checking at compile-time like @Override we would use SOURCE. If we need an annotation to provide functionality at run-time such as @Test in Junit we would use RUNTIME.

## Annotation Categories

1. Marker Annotations - They do not contain any members or data. For eg. @Override or @Test.
   
   ```java
   public Class Employee {
   
   @Override
   public String getDeptName();
   }
   ```

2. Single Value Annotations - They contain only one member and the parameter is the value of the member. For eg: Company(name="ABC")

   ```java
   @Company("XYZ")
   public Class Employee {
   
       @Override
       public String getDeptName();
   }
   ```

3. Full Annotations - They consist of multiple name value pairs. For eg. Company(name="ABC", city="XYZ")

   ```java
   @Company(name="ABC", city="XYZ")
   public Class Employee {
   
   @Override
   public String getDeptName();
   }
   ```

4. Type Annotations - They are declared with @Target and specify at which element the Annotation can be used, for eg. 

   @Target({ElementType.METHOD, ElementType.TYPE}) would apply the 		annotation both at the Method and Class level.























## Annotation Processing Overview

Annotation processing is a built-in functionality provided by Java for scanning and processing annotations at compile time. Custom Processors can be developed based on AbstractProcessor which is the Java class providing the core functionality. They can be used to provide functionality such as automated code generation.

## Annotation Processing Implementation - A real-world example

A Builder is a design pattern in Java that is used to provide a better alternative to constructors when there is a large number of parameters involved or there is a need for multiple constructors with optional parameters. We are going to be implementing an Annotation Processor which will generate a set of Builder classes for a given set of POJOs at compile time.

### Core Module

We will start off with a 'core' Maven module, that has the POJOs we will need to create the Builders for.

For example, the Employee class in the main package is as below:

```java
package com.reflectoring.annotation.processor;

public class Employee {

    private int id;
    private String department;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }
}
```

Since we want to demonstrate the Processor processing multiple POJOs at compile-time with the appropriate annotation, we include a similar Department class in the same package.

```java
package com.reflectoring.annotation.processor;

public class Department {

    private int id;
    private String name;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
```

### Annotation Processor Module

Since the Annotation Processor is used at compile-time to generate code, we need to first build the Annotation Processor module and use it as a dependency in the Core module. When the Core module is compiled, it kicks off the Annotation Processor which generates the Builder source files.

We first need to create the @Builder annotation which we will apply to the POJOs that require corresponding Builder source files. This is our Builder interface:

```java
package com.reflectoring.annotation.processor;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.SOURCE)
public @interface Builder {
}
```

Next we need to create the AnnotationProcessor class which will process all POJOs in the Core class which have the @Builder annotation applied to them. The main Class in the Annotation Processor module is BuilderProcessor which extends AbstractProcessor. This is an abstract class provided by the java.lang.annotations package which provides all the core functionality which we extend and add custom functionality to. 

```java
package com.reflectoring.annotation.processor;

import com.google.auto.service.AutoService;
import com.squareup.javapoet.*;
import org.apache.commons.text.CaseUtils;

import javax.annotation.processing.*;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.Element;
import javax.lang.model.element.ElementKind;
import javax.lang.model.element.Modifier;
import javax.lang.model.element.TypeElement;
import javax.lang.model.type.TypeMirror;
import javax.lang.model.util.Elements;
import javax.tools.Diagnostic;
import javax.tools.JavaFileObject;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@SupportedAnnotationTypes("com.reflectoring.annotation.processor.Builder")
@SupportedSourceVersion(SourceVersion.RELEASE_11)
@AutoService(Processor.class)
public class BuilderProcessor extends AbstractProcessor {

    private Filer filer;
    private Messager messager;
    private Elements elementUtils;

    @Override
    public synchronized void init(ProcessingEnvironment processingEnv) {

        super.init(processingEnv);
        filer = processingEnv.getFiler();
        messager = processingEnv.getMessager();
        elementUtils = processingEnv.getElementUtils();
    }

    @Override
    public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {

        for (Element typeElement : roundEnv.getElementsAnnotatedWith(Builder.class)) {

            List<Element> fieldElements = typeElement.getEnclosedElements()
                						.stream()
                						.filter(e ->ElementKind.FIELD.equals(e.getKind()))
                						.collect(Collectors.toList());

            String packageName = elementUtils.getPackageOf(typeElement).getQualifiedName().toString();
            String className = typeElement.getSimpleName().toString();
            String builderName = String.format("%sBuilder", typeElement.getSimpleName().toString());
            String classVariableName = CaseUtils.toCamelCase(typeElement.getSimpleName().toString(), false, '_');

            try {
                writeBuilderClass(packageName, className, classVariableName, builderName, fieldElements);
                //writeJavaPoetBuilderClass(packageName, className, classVariableName, builderName, fieldElements, typeElement);
            } catch (IOException e) {
                messager.printMessage(Diagnostic.Kind.ERROR, "Failed to write file for element", typeElement);
            }
        }

        return true;
    }

    private String getBaseName(String name) {

        int lastPeriodIndex = name.lastIndexOf('.');
        if (lastPeriodIndex > 0) {
            name = name.substring(lastPeriodIndex + 1);
        }

        return name;
    }

    private void writeBuilderClass(String packageName, String className, String classVariableName, String builderName,
                                   List<Element> fieldElements) throws IOException {
		(...details below)
    }
}
```

### init(...)

The 'init' method is one of the core pieces of the module. 

```java
 @SupportedAnnotationTypes("com.reflectoring.annotation.processor.Builder")				
 @SupportedSourceVersion(SourceVersion.RELEASE_11) 
 @AutoService(Processor.class) 
 public class BuilderProcessor extends AbstractProcessor {

     @Override
     public synchronized void init(ProcessingEnvironment processingEnv) {

        super.init(processingEnv);
        filer = processingEnv.getFiler();
        messager = processingEnv.getMessager();
        elementUtils = processingEnv.getElementUtils();
    }
    ...
}
```

The 'init' method makes use of the ProcessingEnvironment interface to give us some core functionality such as:

Filer - the file creation object for creating new Source files.

Messager - the messager for reporting errors, warnings, etc

Elements - returns the main elements of the objects being processed.

### process()

The 'process' method is the other core function provided by the AbstractProcessor method. It gives us 2 pieces of information that we can use to create our Custom Processor which will eventually generate the Builder source file for each class:
			
'Set<? extends TypeElement> annotations' - returns a Set of all Annotations as specified in 	@SupportedAnnotationTypes("com.reflectoring.annotation.processor.Builder"). 

RoundEnvironment roundEnv - the Annotations are processed in Rounds. The 1st round picks up 1st level annotations. The 2nd round picks up 2nd level annotations and so on till all annotations have been processed.

```java
for (Element typeElement : roundEnv.getElementsAnnotatedWith(Builder.class)) {

    List<Element> fieldElements = typeElement.getEnclosedElements().stream().filter(e -> ElementKind.FIELD.equals(e.getKind())).collect(
            Collectors.toList());

    String packageName = elementUtils.getPackageOf(typeElement).getQualifiedName().toString();
    String className = typeElement.getSimpleName().toString();
    String builderName = String.format("%sBuilder", typeElement.getSimpleName().toString());
    String classVariableName = CaseUtils.toCamelCase(typeElement.getSimpleName().toString(), false, '_');

    try {
        writeBuilderClass(packageName, className, classVariableName, builderName, fieldElements);
        
        //writeJavaPoetBuilderClass(packageName, className, classVariableName, builderName, fieldElements);
    } catch (IOException e) {
        messager.printMessage(Diagnostic.Kind.ERROR, "Failed to write file for element", typeElement);
    }
```
We extract all the classes annotated with @Builder using:

```java
for (Element typeElement : roundEnv.getElementsAnnotatedWith(Builder.class)) {
```

Next we get all the relevant information we need to create the Builder using the code below:

```java
 List<Element> fieldElements = typeElement.getEnclosedElements().stream().filter(e -> ElementKind.FIELD.equals(e.getKind())).collect(
            Collectors.toList());

    String packageName = elementUtils.getPackageOf(typeElement).getQualifiedName().toString();
    String className = typeElement.getSimpleName().toString();
    String builderName = String.format("%sBuilder", typeElement.getSimpleName().toString());
    String classVariableName = CaseUtils.toCamelCase(typeElement.getSimpleName().toString(), false, '_');
```

We finally call the writeBuilderClass method. The details of the writeBuilderClass method are below. We pass in the base parameters including the field elements and use this information to write out the Source Builder file using PrintWriter and the Filer object.

```java
private void writeBuilderClass(String packageName, String className, String classVariableName, String builderName,
                               List<Element> fieldElements) throws IOException {

    JavaFileObject builder = processingEnv.getFiler().createSourceFile(builderName);

    try (PrintWriter out = new PrintWriter(builder.openWriter())) {

        // Write the Package name
        out.print("package ");
        out.print(packageName);
        out.println(";");
        out.println();

        // Write the Class name
        out.print("public final class ");
        out.print(builderName);
        out.println(" {");
        out.println();

        // Write the Field names
        for (Element fieldElement : fieldElements) {

            TypeMirror typeMirror = fieldElement.asType();

            String fieldTypeName = getBaseName(typeMirror.toString());
            String fieldName = getBaseName(fieldElement.getSimpleName().toString());

            out.print("private ");
            out.print(fieldTypeName);
            out.print(" ");
            out.print(fieldName);
            out.print(";");
            out.println();
        }

        out.println();

        // Write the Setters
        for (Element fieldElement : fieldElements) {

            TypeMirror typeMirror = fieldElement.asType();

            String fieldTypeName = getBaseName(typeMirror.toString());
            String fieldName = getBaseName(fieldElement.getSimpleName().toString());

            out.print("public ");
            out.print(" ");
            out.print(builderName);
            out.print(" ");
            out.print(fieldName);
            out.print("(");
            out.print(fieldTypeName);
            out.print(" ");
            out.print(fieldName);
            out.print(") {");
            out.println();
            out.print("     this.");
            out.print(fieldName);
            out.print(" = ");
            out.print(fieldName);
            out.print(";");
            out.println();
            out.print("     return this;");
            out.println();
            out.print("}");
            out.println();
            out.println();
        }

        // Write the build function
        out.print("public ");
        out.print(" ");
        out.print(className);
        out.print(" build() {");
        out.println();
        out.print("     ");
        out.print(className);
        out.print(" ");
        out.print(classVariableName);
        out.print(" = new ");
        out.print(className);
        out.print("();");
        out.println();

        for (Element fieldElement : fieldElements) {

            TypeMirror typeMirror = fieldElement.asType();

            String fieldTypeName = getBaseName(typeMirror.toString());
            String fieldName = getBaseName(fieldElement.getSimpleName().toString());

            out.print("     ");
            out.print(classVariableName);
            out.print(".set");
            out.print(CaseUtils.toCamelCase(fieldName, true, '_'));
            out.print("(this.");
            out.print(fieldName);
            out.println(");");
        }

        out.println();
        out.print("     return ");
        out.print(classVariableName);
        out.print(";");
        out.println();
        out.println("   }");
        out.println("}");
    }
}
```

The final output of the Builder class for the Employee POJO is below:

```java
package com.reflectoring.annotation.processor;

import java.lang.String;

public final class EmployeeBuilder {
  private int id;

  private String department;

  public EmployeeBuilder id(int id) {
    this.id = id;
    return this;
  }

  public EmployeeBuilder department(String department) {
    this.department = department;
    return this;
  }

  public Employee build() {
    Employee employee = new Employee();
    employee.setId(this.id);
    employee.setDepartment(this.department);
    return employee;
  }
}
```

Though this gets the job done, the JavaPoet API offers a more convenient alternative to keeping the code cleaner and more concise. 

JavaPoet has comprehensive getting started documentation on its website, not just the API. 

	[JavaPoet](https://github.com/square/javapoet)

In the function 'process()' in BuilderProcessor there are 2 functions provided for writing out the Builder - writeBuilderClass and writeJavaPoetBuilderClass (commented out). Now, having coded the regular way, we can comment out writeBuilderClass and see the way the code is implemented in JavaPoet by uncommenting the function writeJavaPoetBuilderClass.

The code snippet for the writeJavaPoetBuilderClass method and its helper methods is below:

```java
private void writeJavaPoetBuilderClass(String packageName, String className, String classVariableName, String builderName,
                               List<Element> fieldElements, Element typeElement) throws IOException {

    ClassName builderType = ClassName.get(packageName, builderName);

    List<FieldSpec> fields = new ArrayList<>(fieldElements.size());
    List<MethodSpec> fieldSetters = new ArrayList<>(fieldElements.size());

    // Generate the fields and field setters
    generateFieldsAndSetters(fields, fieldSetters, fieldElements, builderType);

    TypeName targetType = TypeName.get(typeElement.asType());

    // Generate the build method
    MethodSpec buildMethod = generateBuildMethod(targetType, classVariableName, fields);

    TypeSpec builder = TypeSpec.classBuilder(builderType)
            .addModifiers(Modifier.PUBLIC, Modifier.FINAL)
            .addFields(fields)
            .addMethods(fieldSetters)
            .addMethod(buildMethod).build();

    JavaFile file = JavaFile.builder(builderType.packageName(), builder.toBuilder().build()).build();

    file.writeTo(filer);
}

private void generateFieldsAndSetters(List<FieldSpec> fields, List<MethodSpec> fieldSetters, List<Element> fieldElements, ClassName builderType){

    for (Element fieldElement : fieldElements) {

        TypeName typeName = TypeName.get(fieldElement.asType());
        String fieldName = getBaseName(fieldElement.getSimpleName().toString());

        fields.add(FieldSpec.builder(typeName, fieldName, Modifier.PRIVATE).build());

        fieldSetters.add(
                MethodSpec.methodBuilder(fieldName)
                        .addModifiers(Modifier.PUBLIC)
                        .returns(builderType)
                        .addParameter(typeName, fieldName)
                        .addStatement("this.$N = $N", fieldName, fieldName)
                        .addStatement("return this").build());
    }
}

private MethodSpec generateBuildMethod(TypeName targetType, String variableName, List<FieldSpec> fields) {

    MethodSpec.Builder buildMethodBuilder = MethodSpec.methodBuilder("build")
            .addModifiers(Modifier.PUBLIC)
            .returns(targetType)
            .addStatement("$1T $2N = new $1T()", targetType, variableName);

    for (FieldSpec field : fields) {

        buildMethodBuilder.addStatement("$1N.set$2N(this.$3N)", variableName, CaseUtils.toCamelCase(field.name, true, '_'), field.name);
    }

    buildMethodBuilder.addStatement("return $N", variableName);

    return buildMethodBuilder.build();
}
```

The code below gives us the name of the corresponding Builder class. We pass in the field elements and a couple of arrays for holding the field and field setter info.

    ClassName builderType = ClassName.get(packageName, builderName);
     
    List<FieldSpec> fields = new ArrayList<>(fieldElements.size());
    List<MethodSpec> fieldSetters = new ArrayList<>(fieldElements.size());
    
    // Generate the fields and field setters
    generateFieldsAndSetters(fields, fieldSetters, fieldElements, builderType);

The generateFieldsAndSetters method uses the information above along with the JavaPoet API to generate the fields and setters for the Builder class.

```java
private void generateFieldsAndSetters(List<FieldSpec> fields, List<MethodSpec> fieldSetters, List<Element> fieldElements, ClassName builderType){

    for (Element fieldElement : fieldElements) {

        TypeName typeName = TypeName.get(fieldElement.asType());
        String fieldName = getBaseName(fieldElement.getSimpleName().toString());

        fields.add(FieldSpec.builder(typeName, fieldName, Modifier.PRIVATE).build());

        fieldSetters.add(
                MethodSpec.methodBuilder(fieldName)
                        .addModifiers(Modifier.PUBLIC)
                        .returns(builderType)
                        .addParameter(typeName, fieldName)
                        .addStatement("this.$N = $N", fieldName, fieldName)
                        .addStatement("return this").build());
    }
}
```
MethodSpec, which itself is a Builder utility, takes in the input parameters and builds the method. $N is used for substituting the field name.

There are 4 constructs which JavaPoet uses:

	$L for Literals
	$S for Strings
	$T for Types
	$N for Names

The output of the generateFieldsAndSetters method would be:

```java
private int id;
private String department;

public  EmployeeBuilder id(int id) {
     this.id = id;
     return this;
}

public  EmployeeBuilder department(String department) {
     this.department = department;
     return this;
}
```

Next, we generate the build() method for the Builder source file using the generateBuildMethod helper method to which we pass in the Class name (targetType) and the Class variable parameter 'variableName' which is basically the Class name in lower camel-case. The code for the generateBuildMethod is as below:

```java
 private MethodSpec generateBuildMethod(TypeName targetType, String variableName, List<FieldSpec> fields) {

        MethodSpec.Builder buildMethodBuilder = MethodSpec.methodBuilder("build")
                .addModifiers(Modifier.PUBLIC)
                .returns(targetType)
                .addStatement("$1T $2N = new $1T()", targetType, variableName);

        for (FieldSpec field : fields) {

            buildMethodBuilder
            .addStatement("$1N.set$2N(this.$3N)", variableName, CaseUtils.toCamelCase(field.name, true, '_'), field.name);
        }

        buildMethodBuilder.addStatement("return $N", variableName);

        return buildMethodBuilder.build();
    }
```

The output of generateBuildMethod would be:

```java
public Employee build() {
     Employee employee = new Employee();
     employee.setId(this.id);
     employee.setDepartment(this.department);

     return employee;
   }
```

Finally we take the fields, the field setters, the build method generated above, generate the final class and write it out using the Filer object.

```java
TypeSpec builder = TypeSpec.classBuilder(builderType)
        .addModifiers(Modifier.PUBLIC, Modifier.FINAL)
        .addFields(fields)
        .addMethods(fieldSetters)
        .addMethod(buildMethod).build();

JavaFile file = JavaFile.builder(builderType.packageName(), builder.toBuilder().build()).build();

file.writeTo(filer);
```

Now that we have the Annotation Processor completed, we include the module as a dependency in the Core module as below:

```
<dependencies>
    <dependency>
        <groupId>com.reflectoring.annotation.processor</groupId>
        <artifactId>annotation-processor</artifactId>
        <version>1.0</version>
    </dependency>
</dependencies>
```

Now compile the Core module and it will generate the Builder source file in the 'target/generated-sources' directory. 

```
package com.reflectoring.annotation.processor;

import java.lang.String;

public final class EmployeeBuilder {
  private int id;

  private String department;

  public EmployeeBuilder id(int id) {
    this.id = id;
    return this;
  }

  public EmployeeBuilder department(String department) {
    this.department = department;
    return this;
  }

  public Employee build() {
    Employee employee = new Employee();
    employee.setId(this.id);
    employee.setDepartment(this.department);
    return employee;
  }
}
```

The source code for this project is available at: 

We create a multi-module Maven project for this example including the following components:

1.     AnnotationProcessorDemo (the parent module)
2.     annotation-processor (the Annotation Processor itself which will be built to provide the JAR for use in creating the Builder source files)
3.     core (the Core module with the POJOs which will use the Annotation Processor JAR at compile-time to create the corresponding source Builder files for the POJOs)

To summarize:

1. We build an Annotation Processor.

2. We deploy this JAR file and include it in the project POM for which we want to create Builders for the POJOs.

3. We compile the POJO project and that kicks off the Annotation Processor at compile-time which generates Builder source files for us in the output directory.

## Conclusion

After running the project as specified in the Annotation Processor Overview we end up creating 2 Builder classes - EmployeeBuilder and DepartmentBuilder for the 2 core classes in the core module - Employee and Department. So if we had a few dozen classes the code generation capabilities of the Annotation Processor would save us a lot of time. Further, the Builders could be used as follows to set only the parameters we need to set when constructing the objects. This helps us avoid the need to have multiple constructors for optional parameters.

```java
Employee employee = new EmployeeBuilder()
                    .department("Sales")
                    .build();
```

In this case, we skipped setting the Id but still constructed the object.

We have now got a solid understanding of how we can leverage the capabilities of the AnnotationProcessor class and the JavaPoet API to automate class generation. This was just one of the use cases for Annotation Processors. There is much more that can be achieved, for example, Code Consistency processors, etc. 