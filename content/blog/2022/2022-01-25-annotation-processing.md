---
title: "Annotation Processing"
categories: ["Java"]
date: 2022-01-25 06:00:00 +1000
modified: 2022-01-15 06:00:00 +1000
authors: [syedaf]
description: "An Annotation is a construct associated with Java source code elements such as classes, methods and variables which provides information to the progam at compile-time or run-time based on which the program can take further action. The Annotation Processor processes these Annotations at compile time to provide functionality such as code generation, error checking etc. In this article we will discuss the topic of Annotations and the functionality that Annotation Processing provides."
---

## An Introduction to Annotations and Annotation Processing

An Annotation is a construct associated with Java source code elements such as classes, methods and variables which provides information to the progam at compile-time or run-time based on which the program can take further action. The Annotation Processor processes these Annotations at compile time to provide functionality such as code generation, error checking etc.  

The java.lang.annotation package provides the Core annotation functionality and also gives us the capability to create our own Custom annotations which can be processed with Annotation Processors.

In this article, we will discuss the topic of Annotations and demonstrate the power of Annotation Processors with a real-world example.


## Annotation Basics

An annotation is preceded by the @ sign. Some common examples of annotations are @Override and @Entity. 

@Override and @Entity are examples of Standard or built-in annotations provided by Java through the java.lang.annotations package. We can further extend the Core functionality to provide our own Custom annotations.

An Annotation by itself does not perform any action on the program. It simply provides information about the program that can be used at compile-time or run-time to perform further processing. @Override provides the functionality at compile time to trap typo errors by enforcing the rule for all overriding methods to have the same case sensitive name as the base method. The JUnit annotation @Test provides run-time functionality of distinguishing 'Test' methods in a class from helper or other methods.

### Standard Annotations

These are the some of the Standard annotations that Java provides as part of the java.lang.annotations package.
	
    @SuppressWarnings - Used to indicate that warnings on code compilation should be ignored. We may want to suppress warnings which clutter up the build output. 
    
        @SuppressWarnings("unchecked") for example suppresses warnings associated with raw types.
        
    @Deprecated - Used to indicate that a method or type has been replaced with newer functionality. IDEs make use of annotation processing to throw a warning at compile time.

        @Deprecated is used by JavaDoc to indicate that an element has been deprecated and replaced with a newer method. For eg.

        ```java
        public class Employee {

            /*** 
                * @Deprecated
                * This method is no longer used. It has been 
                * replaced with getDeptName.
                * 
            ***/
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

    now if you had 2 classes extending Employee such as

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
    
    @SafeVarargs - The varargs functionality allowed creation of methods with variable arguments. However, warnings were thrown when generics were used in the arguments. @SafeVarargs allowed for suppression of these warnings.
			
### Custom Annotations

These are Annotations that are custom created to serve a particular purpose. Some of the common uses for custom annotations are:
	
    1. Automate the generation of boiler plate code.
    
    2. Provide the capability to trap errors at compile time such as potential null pointer checks.
    
    3. Customize run-time behaviour based on the presence of custom annotations.

An example of a Custom annotation would be:

    ```java
    @Employee{
        name = "John Doe",
        department = "Sales"
    }
    public class Manager { .. }
    ```
Custom Annotations are used to provide custom functionality such as Code generation using Annotation Processing.

### Meta Annotations

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
    3. @Repeatable - Allows multiple repeating Custom Annotations on a method, class or field. For eg. if you had the Annotation @Role defined on Employee it could be used as:

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
    The various self explanatory element types are - ANNOTATION_TYPE, CONSTRUCTOR, FIELD, LOCAL_VARIABLE, METHOD, PACKAGE, PARAMETER, TYPE (Class).

    5. @Retention - Specifies when the annotation is discarded.
    
        SOURCE - The annotation is used at compile time and discarded at run-time.
        CLASS - The annotation is stored in the class file at compile time and discarded at run time.
        RUNTIME - The annotation is retained at run-time.

    If we needed an annotation to only provide error checking at compile time like @Override we would use SOURCE. If we need an annotation to provide functionality at run-time such as @Test in Junit we would use RUNTIME.

### Annotation Categories

	1. Marker Annotations - They do not contain any members or data. For eg. @Override or @Test.

    ```java
    public Class Employee {

        @Override
        public String getDeptName();
    }
    ```

	2. Single Value Annotations - They contain only one member and the parameter is the value of the member. For eg:
    
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
    
    @Target({ElementType.METHOD, ElementType.TYPE}) would apply the annotation both at the Method and Class level.

### Annotation Processing Overview

    Annotation processing is a built-in functionality provided by Java for scanning and processing annotations at compile time. Custom Processors can be developed based off AbstractProcessor which is the Java class providing the core functionality. They can be used to provide functionality such as automated code generation.

### Annotation Processing Implementation - A real-world example

    A Builder is a design pattern in Java which is used to provide a better alternative to constructors when there is a large number of parameters involved or there is a need for multiple constructors with optional parameters. We are going to be implementing an Annotation Processor which will generate a set of Builder classes for a given set of POJOs at compile time. The main procssing is as below:
    
        1. We create a Custom Annotation labeled '@Builder' and apply it to the POJOs in the project for which we want to create corresponding Builder classes. 
        2. Create the Annotation Processor module and include this as a library (JAR) in the Core module containing the POJOs. 
        3. Complie the Core module and this will generate the Builder source files in the build directory.
    
	The source code for this project is available at: 

    We will be creating a multi-module Maven project for this example including the following components:

        AnnotationProcessorDemo (the parent module)
        annotation-processor (the Annotation Processor itself which will be built to provide the JAR for use in creating the Builder source files)
        core (the Core module with the POJOs which will use the Annotation Processor JAR at compile-time to create the corresponding source Builder files for the POJOs)
	
    Once we create a barebone Maven multi-module project as above we will next start working on the 'annotation-processor' module.
    
   ### Annotation Processor

    1. Create the @Builder annotation which we will apply to the POJOs that require corresponding Builder source files. 

        @Target({ElementType.TYPE})
        @Retention(RetentionPolicy.SOURCE)
        public @interface Builder { ... }

        Since we wil be applying it only to Classes the ElementType is TYPE. Further since we only need it at compile-time the RetentionPolicy is Source.

    2. The main Class in AnnotationProcessorModule is BuilderProcessor which extends AbstractProcessor. This is a class provided by the java.lang.annotations package which provides all the core functionality which we extend and add custom functionality to. The functionality of the core pieces is as below:

        ```java	
        @SupportedAnnotationTypes("com.reflectoring.annotation.processor.Builder")				
        @SupportedSourceVersion(SourceVersion.RELEASE_11) 
        @AutoService(Processor.class) 
        public class BuilderProcessor extends AbstractProcessor {

                @Override
                public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {

                    for (TypeElement annotation : annotations) {

                    }
                }
            
                return true;
            }

        }
		```

        The Annotations used are:

            1. @SupportedAnnotationTypes("com.reflectoring.annotation.processor.Builder") - this specifies just the Annotations this Processor will be processing.					
            
            2. @SupportedSourceVersion(SourceVersion.RELEASE_11) - this specifies the Compiler version.
            
            3. @AutoService(Processor.class) - AutoService will automatically generate the file META-INF/services/javax.annotation.processing.Processor in the output classes folder. This file will contain:

                com.reflectoring.annotation.processor.BuilderProcessor

                If this metadata file is included in a jar, and that JAR is on the classpath then it gets loaded into the environment at compile time.

        The main function used is process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) - this is the core function provided by the AbstractProcessor method. It gives us 2 pieces of information that we can use to create our Custom Processor which will eventually generate the Builder source file for each class.
					
            'Set<? extends TypeElement> annotations' - this returns a Set of all Annotations as specified in @SupportedAnnotationTypes("com.reflectoring.annotation.processor.Builder"). We will be looping through these annotations and adding our custom functionality to these fields.

            RoundEnvironment roundEnv - the Annotations are processed in Rounds. The 1st round picks up 1st level annotations. The 2nd round picks up 2nd level annotations and so on till all annotations have been processed.
						
		So you would basically use these 2 components as follows to give you all the annotations to process:
						
            for (TypeElement annotation : annotations) {
                
                Set<? extends Element> annotatedElements = roundEnv.getElementsAnnotatedWith(annotation);

            Now 'annotatedElements' has everything we need for processing. By introspecting the type we know whether it is a Class or a Field.
            
            The function 'process' returns true if there is only 1 Annotation Processor. In case of multiples it returns false. In our case we return 'true' since we have only 1.
        
        In the process function above, after we have all the Annotation information we need in the Collection 'annotatedElements' we create a method for writing out the corresponding Builder source file for each class annotated with @Builder in our Core module.
					
			private void createBuilder(String className, List<String> fieldsToProcess) throws IOException {
					
			In this method we loop through a Map which has Key = <Every Class annotated with @Builder in the program> and Values = <Corresponding Fields annotated with @Builder>
						
			We call 'createBuilder' for each Class in a loop and generate the Builder using 2 approaches. One is the regular approach of building up a String dynamically using StringBuilder and the other is using the JavaPoet API which accomplishes the same task but keeps the code more concise and readable.

            Using the regular approach this is how we would basically go about getting the information we need and building the Builder source file of it:

                We filter the Class elements to get only the Fields since we will be building our Builder class based of this using the elements Package Name, ClassName, Fields, Setter Methods and the Build Method.

                ```java			
                
                for (Element typeElement : roundEnv.getElementsAnnotatedWith(Builder.class)) {

                    List<Element> fieldElements = typeElement.getEnclosedElements()
                                                    .stream()
                                                    .filter(e -> ElementKind.FIELD.equals(e.getKind()))
                                                    .collect(Collectors.toList());

            	String packageName = elementUtils.getPackageOf(typeElement).getQualifiedName().toString();
				String variableName = CaseUtils.toCamelCase(typeElement.getSimpleName().toString(), false, '_');
				
                ```

				Once we extract the information we need, we can go about writing the Builder source file for Class as below:

                    1. Write out the Package name and Class name.

                    2. Write out the Fields and their Setters.

                    3. Write out the Build function.

                    4. Output to a source file.
						
                The output function looks like this. It is self-explanatory. For purposes of clarity the code has been kept simple rather than making it concise.

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
                ```

                So basically we loop through the elements and print them out with the formatting needed.

                Though this gets the job done, the JavaPoet API offers a more convenient alternative to keeping the code cleaner and more concise. 
                
                JavaPoet has comprehensive getting started documentation on it's website, not just the API. 
					
					[JavaPoet](https://github.com/square/javapoet)
					
                In the function 'process()' in BuilderProcessor there are 2 functions provided for writing out the Builder - writeBuilderClass and writeJavaPoetBuilderClass which is commented out. Now, having coded the regular way, we can comment out writeBuilderClass see the way the code is implemented in JavaPoet by uncommenting the function writeJavaPoetBuilderClass.

                We have 2 main functions 

                So you have 2 main functions - generateFieldsAndSetters and generateBuildMethod. The methods are self-explanatory 

                There are 4 constructs we need to know about in the code below:

                $L for Literals
                $S for Strings
                $T for Types
                $N for Names

                ```java
                private void generateFieldsAndSetters(List<FieldSpec> fields, List<MethodSpec> fieldSetters, List<Element> fieldElements, ClassName builderType){

                    for (Element fieldElement : fieldElements) {

                        TypeName typeName = TypeName.get(fieldElement.asType());
                        String fieldName = getBaseName(fieldElement.getSimpleName().toString());

                        fields
                            .add(FieldSpec.builder(typeName, fieldName, Modifier.PRIVATE)
                            .build()
                        );

                        fieldSetters
                            .add(
                                MethodSpec
                                .methodBuilder(fieldName)
                                .addModifiers(Modifier.PUBLIC)
                                .returns(builderType)
                                .addParameter(typeName, fieldName)
                                .addStatement("this.$N = $N", fieldName, fieldName)
                                .addStatement("return this")
                                .build()
                            );
                    }
                }

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
    To sumarize:

        1. We build an Annotation Processor.
        
        2. We deploy this JAR file and include it in the project POM for which we want to create Builders for the POJOs.
        
        3. We compile the POJO project and that kicks off the Annotation Processor at compile-time which generates Builder source files for us in the output directory.

Conclusion: After running the project as specified in the Annotation Processor Overview we end up creating 2 Builder classes - EmployeeBuilder and DepartmentBuilder for the 2 core classes in the core module - Employee and Department. So if we had a few dozen classes the code generation capabilities of the Annotation Processor would save us a lot of time. Further the Builders could be used as follows to set only the parameters we need to set when constructing the objects. This helps us avoid the need to have multiple constructors for optional parameters.
			
        Employee employee = new EmployeeBuilder()
            .department("Sales")
            .build();
            
    In this case we skipped setting the Id but still constructed the object.
			
We have now got a solid understanding of how we can leverage the capabilities of the AnnotationProcessor class and the JavaPoet API to automate class generation. This was just one of the use cases for Annotation Processors. There is much more that can be achieved, for example Code Consistency processors etc. Hope this article has given you the knowledge you need to develop your own custom tools based off Annotation Processing.
        
               
