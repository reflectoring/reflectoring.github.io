---
title: Why You should Use Constructor Injection in Spring
categories: [spring-boot]
date: 2020-02-16 05:00:00 +1100
modified: 2020-02-16 05:00:00 +1100
author: default
excerpt: "Dependency injection is one of the common approaches to implement loose coupling among the classes in an application. There are different ways of injecting dependencies and this article explains why constructor injection is the preferred way."
image:
  auto: 0059-cloud
---

Dependency injection is a one of the common approaches to implement loose coupling among the classes in an application. There are different ways of injecting dependencies and this article explains why constructor injection is the preferred way.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/dependency-injection" %}

## What Is Dependency Injection?

* **Dependency**: An object usually requires objects of other classes to perform its operations. We call these objects dependencies.
* **Injection**: The process of providing the required dependencies to an object.

Thus dependency injection helps in implementing inversion of control. This means that the responsibility of object creation and injecting the dependencies is given to the framework (i.e. Spring) instead of the class creating the dependency objects by itself.

We can implement dependency injection with:

* constructor-based injection,
* field-based injection, or
* setter-based injection.

## Constructor Injection

In constructor-based injection, the dependencies required for the class are provided in the constructor, i.e. the required dependencies are passed as arguments to the constructor.

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

After Spring 4.3, **it's optional to specify `@Autowired` if the class has only one constructor defined**. However, if we have a class with multiple constructors, we need to explicitly add the `@Autowired` annotation to any one of the constructors for the container to create beans.

# Setter/Field Injection

In setter-based injection, we provide the required dependencies as field parameters to the class and values are set using the setter methods of the properties. We need to annotate the setter methods with the `@Autowired`  annotation. Similarly, in field-based injection, Spring assigns the required dependencies directly to the fields annotated with `@Autowired` annotation. 

Let's assume the `Cake` class requires a `Topping` and a `Flavor`:

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

The `Flavor` object is provided as an argument in the setter method of that property and the `Topping` object is provided as field value to the Cake class.

## Why Should I Use Constructor Injection?

Now that we have seen the different types of injection, let's go through some of the advantages of using constructor injection.

### All Required Dependencies Are Available at Initialization Time

If we specify all the required dependencies in the constructor during instance creation, then we can be 100% sure that the class will never be instantiated without its dependencies injected.

**The IoC container makes sure all the arguments provided in the constructor are available before bean creation**. This helps in preventing `NullPointerException`s.

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

**In setter injection, these dependencies are initialized using setter methods only after the constructor invocation.** Using setter injection, we can override the existing values of the object and provide different values. This kind of injection is preferable when we have optional dependencies.

Constructor injection is extremely useful since we do not have to write separate business logic everywhere to check if the all the required dependencies are loaded thus simplifying code complexity.

### Identifying Code Smells

Constructor injection can help us to identify if our bean is dependent on other classes. If our constructor has a large number of arguments, then we can be sure that our class has too many responsibilities. This implies that we should refactor it to better address proper separation of concerns.

Constructor injection can also help us **to find circular dependencies in the code**. If it exists, Spring would throw a `BeanCurrentlyInCreationException`. This forces us to remove these circular dependencies.

### Preventing `NullPointerException`s

Constructor injection simplifies writing unit test cases for any spring application. Using `Mockito`, we can create complete mock objects with required dependencies.

You may ask why can't I mock objects created with setter injection. **Mockito unlike Spring fails with a `NullPointerException` if it cannot inject any of the dependencies**.

Let's consider an example test case for the `Cake` class that uses setter injection: 
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

Let's consider the `Cake` example with constructor injection:

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

### Immutability

Constructor injection helps in creating immutable objects, because a constructor is the only possible way to inject state. Once we create a bean, we cannot alter its dependencies at any point in time. With setter injection, it's possible to change the dependencies at any time, thus leading to mutable objects which may not be safe to use in a multi-threaded environment.


## Conclusion

In general, Spring recommends to use constructor injection. Setter injection is preferable in case of optional dependencies. Contrarily, for mandatory dependencies, constructor injection is better.
