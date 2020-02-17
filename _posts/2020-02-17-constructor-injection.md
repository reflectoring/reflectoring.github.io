---
title: Why You should use Constructor Injection in Spring
categories: [spring-boot]
date: 2020-02-16 05:00:00 +1100
modified: 2020-02-16 05:00:00 +1100
author: default
excerpt: 'Dependency injection is a one of the common approaches to implement loose coupling among the classes in an application. It ensures that classes are independent and the required dependencies are provided by an external framework.'
image:
auto: 0058-motorway-junction
---
Dependency injection is a one of the common approaches to implement loose coupling among the classes in an application. It ensures that classes are independent and the required dependencies are provided by an external framework.
### What is dependency injection?

`Dependency` - Every object of a class requires some dependencies to perform its operation. These dependencies can be objects of other classes.

`Injection` - Providing required dependencies to object.

Thus dependency injection helps in implementing inversion of control meaning, the responsibility of object creation and injecting the dependencies is given to the framework (i.e. Container in Spring) instead of the class creating the dependent objects by itself.

We can implement this in three ways:

 1. Constructor based injection
 2. Field based injection
 3. Setter based injection

You can find the code of the example demonstrated in the below git URL.
{% include github-project.html url="https://github.com/vasudhavenkatesan/DependencyInjectionExample" %}

# Constructor Injection

In constructor based injection, the dependencies required for the class are provided in the constructor, i.e. the required dependencies are passed as arguments to the constructor.

```java
@Component
public class Cake {

	private static Logger LOGGER = LoggerFactory.getLogger(Cake.class);


	private Flavor flavor;

	public Cake(Flavor flavor) throws IllegalAccessException {
		
		//check if the required dependency is not null
		if (flavor != null) {
			this.flavor = flavor;
			LOGGER.info("Flavor from Constructor Injection : " + flavor);
		} else {
			throw new IllegalArgumentException("Cake cannot be created with null flavor object");
		}
	}
	...
}
```

After Spring 4.3, **it is optional to specify `@Autowired` if the class has only one constructor defined**. However, if we have a class with multiple constructors, we need to explicitly mention `@Autowired` annotation to any one of the constructors for the container to create beans.

# Setter/Field based injection

In setter-based injection, we can provide the required dependencies as field parameters to the class and values are set using the setter methods of the properties. We need to annotate the setter methods with `@Autowired`  annotation. Similarly, in field-based injection, Spring assigns the required dependencies directly to the fields on annotating with `@Autowired` annotation. 

For example, here the `Cake` class requires an object of `Topping` and `Flavor` class. The `Flavor` object is provided as an argument in the setter method of that property and `Topping` object is provided as field value to the Cake class.
```java
@Component
public class Cake {

	private Logger LOGGER = LoggerFactory.getLogger(Cake.class);
	
	private Flavor flavor;
	
	@Autowired
	private Topping toppings;
	
	public Cake() {
		LOGGER.info("Flavor from setter Injection : " + this.flavor);
	}
	
	@Autowired
	public void setFlavor(Flavor flavor) {
		LOGGER.info("Initialising flavor object using setter injection");
		this.flavor = flavor;
	}
	...
}

```

# Why should I use constructor injection?

Now that we have seen the different types of injection, let us go through some of the advantages of using constructor injection.

## All required dependencies are available at initialization time

Every class has a default constructor unless we explicitly create a constructor and its object is created by calling respective constructor. If we specify all the required dependencies in the constructor during instance creation, then we can be 100% sure that the class will never be instantiated without its dependencies injected.

The **IoC container makes sure all the arguments provided in the constructor are available before bean creation**. This helps in preventing the infamous `NullPointerException`.
```java
@Component
public class Cake {

	private static Logger LOGGER = LoggerFactory.getLogger(Cake.class);

	private Flavor flavor;

	public Cake(Flavor flavor) throws IllegalAccessException {
		
		//check if the required dependency is not null
		if (flavor != null) {
			this.flavor = flavor;
			LOGGER.info("Flavor from Constructor Injection : " + flavor);
		} else {
			throw new IllegalArgumentException("Cake cannot be created with null flavor object");
		}
	}
	
	...
}
```

In setter injection, these dependencies are initialized using setter methods only after the constructor invocation. Using setter injection, we can override the existing values of the object and provide different values. This kind of injection is preferable when we have optional dependencies.

Constructor injection is extremely useful since we do not have to write separate business logic everywhere to check if the all the required dependencies are loaded thus simplifying code complexity.

## Identifying Code smells

Constructor injection can help us identify if our bean is dependent many other classes. If our constructor has large number of arguments, then we can be sure that our class has too many responsibilities. It is not a sign of quality code implying it should be refactored to better address proper separation of concerns.

Constructor injection can help us find out circular dependencies in the code. If it exists, Spring would throw `BeanCurrentlyInCreationException` . This can help the developer identify classes that have circular dependency.

## Preventing NullPointerException

Constructor injection simplifies writing unit test cases for any spring application. Using `Mockito`, we can create complete mock objects with required dependencies.

You may ask why can't I mock objects created with setter injection. **Mockito unlike Spring fails with a null pointer exception if it cannot inject any of the dependencies**.

Let us consider an example test case for Cake class that uses setter injection. Here the test works fine. 
```java
@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest(classes = ExampleApplicationSI.class)
public class TestCakeClassSetterInjection {

	@Autowired
	Cake cake;

	@Test
	public void testSetterInjection() {
		String testColor = cake.getFlavor().getColor();
		Assert.assertEquals(testColor, " White ");
		String toppingsName=cake.getToppings().getToppingName();
		
		//check if the dependency is not null
		if(toppingsName!=null) {
			Assert.assertEquals(toppingsName, "gems");
		}
		
		...
}
``` 
In future if someone adds additional dependencies to this class, the unit test silently fails with a null pointer exception. It is very difficult to find the reason because the new dependencies is not within the visibility for Cake’s client classes.

Let us consider the Cake class example created using constructor injection.
```java
@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest(classes = ExampleApplicationCI.class)
public class TestCakeClassConstructorInjection {

	@Autowired
	Cake cake;
	
	@Test
	public void testConstructorInjection() {	
		String testColor=cake.getFlavor().getColor();
		Assert.assertEquals(testColor, " White ");
	}
	
	...
}
```

Now when we need a new dependency, we add it to the constructor. Thus, whenever we create an object of this class, we make sure that all its dependencies are present. This is a big gain since we do not have test with half created objects.

## Immutability

Constructor injection helps in creating immutable objects, because a constructor’s signature is the only possible way to create objects. Once we create a bean, we cannot alter its dependencies at any point of time. In setter injection, it is possible to inject the dependency as and when wherever it is required, thus leading to mutable objects which may not be thread safe in a multi-threaded environment.


# Conclusion

In general, Spring recommends to use constructor injection. Setter injection is preferable in case of optional dependencies. Contrarily, for mandatory dependencies, constructor injection is better.
