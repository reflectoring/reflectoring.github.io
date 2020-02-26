---
title: Why You should use Constructor Injection in Spring
categories: [spring-boot]
date: 2020-02-17 05:00:00 +1100
modified: 2020-02-25 05:00:00 +1100
author: vasudha
excerpt: 'Why You should use Constructor Injection in Spring'
image:
  auto: 0058-motorway-junction
---

Dependency injection is one of the common approaches to implement loose coupling among the classes in an application. It ensures that classes are independent and the required dependencies are provided by an external framework.

### What is dependency injection?

`Dependency` - Every object of a class requires some dependencies to perform its operation. These dependencies can be objects of other classes.

`Injection` - Providing required dependencies to object.

Thus dependency injection helps in implementing inversion of control meaning, the responsibility of object creation and injecting the dependencies is given to the framework (i.e. Container in Spring) instead of the class creating the dependent objects by itself.

We can achieve this in three ways:

1.  Constructor based injection
2.  Field based injection
3.  Setter based injection

You can find the code of the example demonstrated in the below git URL.
{% include github-project.html url="https://github.com/vasudhavenkatesan/DependencyInjectionExample" %}

# Constructor Injection

In constructor based injection, the dependencies required for the class are provided in the constructor, i.e. the required dependencies are passed as arguments to the constructor.

```java
@Component
public class Cake {

	private Flavor flavor;

	Cake(Flavor flavor) {

		// check if the required dependency is not null
		if (Objects.requireNonNull(flavor) != null) {
			this.flavor = flavor;
		} else {
			throw new IllegalArgumentException("Cake cannot be created with null flavor object");
		}
	}

	public Flavor getFlavor() {
		return flavor;
	}
	...
}
```

After Spring 4.3, **it is optional to specify `@Autowired` if the class has only one constructor defined**.

For example in `Cake` class, since we have only one constructor, we don't have to specify the `@Autowired` annotation. Consider the below example with multiple constructors.

```java
@Component
public class Sandwich {

	Topping toppings;
	Bread breadType;

	Sandwich(Topping toppings) {
		this.toppings = toppings;
	}

	@Autowired
	Sandwich(Topping toppings, Bread breadType) {
		this.toppings = toppings;
		this.breadType = breadType;
	}
	...
}
```

If we have a class with multiple constructors, we need to explicitly mention `@Autowired` annotation to any one of the constructors for the container to create beans.

# Setter based injection

In setter-based injection, we can provide the required dependencies as field parameters to the class and values are set using the setter methods of the properties. We need to annotate the setter or getter methods with `@Autowired` annotation.

For example, here the `Cake` class requires an object of `Topping` class. The `Topping` object is provided as an argument in the setter method of that property.

```java
@Component
public class Cookie {

	private Topping toppings;

	@Autowired
	public void setTopping(Topping toppings) {
		this.toppings = toppings;
	}

	public Topping getTopping() {
		return toppings;
	}
	...
}

```

# Field based Injection

In field-based injection, Spring assigns the required dependencies directly to the fields on annotating with `@Autowired` annotation.
In this example, Spring lets us set the `Topping` dependency as a field parameter to the `IcreCream` object.

```java
@Component
public class IceCream {

	@Autowired
	Topping toppings;

	public Topping getToppings() {
		return toppings;
	}

	public void setToppings(Topping toppings) {
		this.toppings = toppings;
	}
	...
}
```

Suppose we inject a dependency with both setter and field injection, which method will Spring use to inject dependency?

```java
@Component
public class Pizza {

	@Autowired
	Topping toppings;

	public Topping getToppings() {
		return toppings;
	}

	@Autowired
	public void setToppings(Topping toppings) {
		System.out.println("Using field injection");
		this.toppings = toppings;
	}
}
```

In the above example, we have injected `Topping` dependency using both setter and field injection. In this case, Spring injects dependency using setter injection method.

# Why should I use constructor injection?

Now that we have seen the different types of injection, let us go through some of the advantages of using constructor injection.

## All required dependencies are available at initialization time

Every class has a default constructor unless we explicitly create a constructor and its object is created by calling respective constructor. If we specify all the required dependencies in the constructor during instance creation, then we can be 100% sure that the class will never be instantiated without its dependencies injected.

The **IoC container makes sure all the arguments provided in the constructor are available before bean creation**. This helps in preventing the infamous `NullPointerException`.

In setter injection, these dependencies are initialized using setter methods only after the constructor invocation.
You may ask, why cant I initialize optional dependencies with null in the constructor, instead of setter injection.

Using setter injection, we can override the existing values of the object and provide different values at different point of time. This kind of injection is preferable when we have optional dependencies.

Constructor injection is extremely useful since we do not have to write separate business logic everywhere to check if the all the required dependencies are loaded thus simplifying code complexity.

## Identifying Code smells

Constructor injection can help us identify if our bean is dependent many other classes. If our constructor has large number of arguments, then we can be sure that our class has too many responsibilities. It is not a sign of quality code implying it should be refactored to better address proper separation of concerns.

## Preventing `NullPointerException`

Constructor injection simplifies writing unit test cases for any spring application. Using `Mockito`, we can create complete mock objects with required dependencies.

You may ask why can't I mock objects created with setter injection. **Mockito unlike Spring fails with a `NullPointerException` if it cannot inject any of the dependencies**.

Let us consider an example test case for Cake class that uses setter injection.

```java
@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest(classes = ExampleApplicationSI.class)
public class TestCookieClassSetterInjection {

	@Autowired
	Cookie cookie;

	@Test
	public void testSetterInjection() {
		String testColor = cookie.getTopping().getToppingName();
		Assert.assertEquals(testColor, "White");
	}
	...
}
```

Here since the Cookie class has null value for `Topping` , the test case fails with a `NullPointerException`. We need to explicitly initialize the Topping object to test.

Similarly in future if someone adds additional dependencies to this class, the unit test silently fails with a `NullPointerException`. It is very difficult to find the reason because the new dependencies is not within the visibility for `Cookie`'s client classes.

Let us consider the Cake class example created using constructor injection.

```java
@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest(classes = ExampleApplicationCI.class)
public class TestCakeClassConstructorInjection {

	@Autowired
	Cake cake;

	@Test
	public void testConstructorInjection() {
		String testColor = cake.getFlavor().getColor();
		Assert.assertEquals(testColor, "White");
	}
	...
}
```

Now when we need a new dependency, we add it to the constructor. Thus, whenever we create an object of this class, we make sure that all its dependencies are present. This is a big gain since we do not have test with half created objects.

## Immutability

Constructor injection helps in creating immutable objects, because a constructor’s signature is the only possible way to create objects. Once we create a bean, we cannot alter its dependencies at any point of time. In setter injection, it is possible to inject the dependency as and when wherever it is required, thus leading to mutable objects which may not be thread safe in a multi-threaded environment.

# Conclusion

In general, Spring recommends to use constructor injection. As we have seen in the examples, setter injection is preferable in case of optional dependencies, i.e, Setter injection is useful when it is optional to provide values for the dependent properties during object creation as the object will be in valid state even without the dependent properties . Contrarily, we use constructor injection when the object cannot be created without the dependent properties, i.e, object is invalid without the mandatory dependencies.

You can find the code examples [on GitHub](https://github.com/vasudhavenkatesan/DependencyInjectionExample)