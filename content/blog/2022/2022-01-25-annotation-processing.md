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


# An Introduction to Annotations and Annotation Processing 

An Annotation is a construct associated with Java source code elements such as classes, methods, and variables that provide information to the program at compile-time or run-time based on which the program can take further action. The Annotation Processor processes these Annotations at compile time to provide functionality such as code generation, error checking, etc.  

The java.lang.annotation package provides the Core annotation functionality and also gives us the capability to create our Custom annotations that can be processed with Annotation Processors.

In this article, we will discuss the topic of Annotations and demonstrate the power of Annotation Processors with a real-world example.

## Annotation Basics

An annotation is preceded by the @ sign. Some common examples of annotations are @Override and @Entity. These are Standard or built-in annotations provided by Java through the java.lang.annotations package. We can further extend the Core functionality to provide our custom annotations.

An Annotation by itself does not perform any action on the program. It simply provides information about the program that can be used at compile-time or run-time to perform further processing. For eg:

@Override provides the functionality at compile time to trap typo errors by enforcing the rule for all overriding methods to have the same case-sensitive name as the base method. The JUnit annotation @Test provides run-time functionality of distinguishing 'Test' methods in a class from helper or other methods.

## Standard Annotations

These are some of the Standard annotations that Java provides as part of the java.lang.annotations package.

@SuppressWarnings - Used to indicate that warnings on code compilation should be ignored. We may want to suppress warnings that clutter up the build output. 

​	@SuppressWarnings("unchecked") for example suppresses warnings associated with raw types.

@Deprecated - Used to indicate that a method or type has been replaced with newer functionality. IDEs make use of annotation processing to throw a warning at compile time.

​	@Deprecated is used by JavaDoc to indicate that an element has been deprecated and replaced with a newer method. For eg.

```java
public class Employee {

    /*** 
     * @Deprecated
     * This method is no longer used. It has been replaced with getDeptName.
     ****/
    @Deprecated
    public int getDeptNum { ... }
}
```

@Override - Used to indicate that a method will be overriding the base class implementation. It is used to throw compile-time errors in cases such as typos in letter casing.

So for example the base class could look like:

```java
public class Employee {

    public String getEmpName() {..}
}
```

now if you had 2 classes extending Employee such as:

```java
public class Manager extends Employee {

    @Override
    public String getEmpName() {..}
}

public class Developer extends Employee {

    @Override
    public String getempName() {..}
}
```

 The method in the Developer sub-class 'getempName' would throw an error at compile-time stating that the method getEmpName was not overridden and hence we would be able to catch the error due to a typo.

@FunctionalInterface - Used to indicate that the interface cannot have more than one abstract method. The compiler throws an error in case there is more than one abstract method.

@SafeVarargs - The varargs functionality allowed the creation of methods with variable arguments. However, warnings were thrown when generics were used in the arguments. @SafeVarargs allowed for suppression of these warnings.

## Custom Annotations

These are Annotations that are custom created to serve a particular purpose. Some of the common uses for custom annotations are:

1. Automate the generation of boilerplate code.
2. Provide the capability to trap errors at compile time such as potential null pointer checks.
3. Customize run-time behavior based on the presence of custom annotations.

An example of a Custom annotation would be:

```java
@Employee{
    name = "John Doe",
    department = "Sales"
}
public class Manager { .. }
```

Custom Annotations are used to provide custom functionality such as Code generation using Annotation Processing.

## Meta Annotations

Meta Annotations are Annotations about Annotations provided by the java.lang.Annotations package that provide information about an annotation.

1. @Inherited - Normally an Annotation cannot be inherited but applying the @Inherited annotation to an annotation (meta annotation) allows it to be inherited. For eg:

```java
@Inherited
public @interface EmployeeType {
}

@EmployeeType
public class Employee { ...}

public class Manager extends Employee {...}
```

... since @EmployeeType is inherited the Manager class does not need to include it.

2. @Documented - Ensures that Custom Annotations show up in the JavaDocs.

Normally when we run JavaDoc on a program the annotation @Inherited would not show up in the documentation. But when we use the @Documented annotation as below '@Inherited' would show up in the output too.

```java
@Documented
@EmployeeType
public class Employee { ...}
```

3. @Repeatable - Allows multiple repeating Custom Annotations on a method, class, or field. For eg. if you had the Annotation @Role defined on Employee it could be used as:

```java
@Repeatable
public @interface Role { .. }

@Role("Manager")
@Role("Analyst")
public class Employee { ...}
```

4. @Target - Specifies at which element the Annotation can be used, for eg in the above example if the annotation Role was defined only for TYPE, then it could only be applied to a Class.

```java
@Target({ElementType.TYPE})
public @interface Role { .. }
```

The various self-explanatory element types are - ANNOTATION_TYPE, CONSTRUCTOR, FIELD, LOCAL_VARIABLE, METHOD, PACKAGE, PARAMETER, TYPE (Class).

5. @Retention - Specifies when the annotation is discarded.

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