
## What is AOP

Aspect Oriented Programming (AOP) is a programming paradigm aiming to extract cross-cutting functionalities, such as logging, into what's known as Aspects.

This is achieved by adding behavior (Advice) to existing code without changing the code itself. We specify which code we want to add the behavior to using special expressions (Pointcuts).

For example, we can tell the AOP framework to log all method calls happening in the system without us having to add the log statement in every method call manually.

## Spring AOP
AOP is one of the main components in the Spring framework, it provides declarative services for us, such as declarative transaction management (the famous @Transactional annotation).
Moreover, it offers us the ability to implement custom Aspects and utilize the power of AOP in our applications.


Spring AOP uses either JDK dynamic proxies or CGLIB to create the proxy for a given target object. JDK dynamic proxies are built into the JDK, whereas CGLIB is a common open-source class definition library (repackaged into  `spring-core`).

If the target object to be proxied implements at least one interface, a JDK dynamic proxy is used. All of the interfaces implemented by the target type are proxied. If the target object does not implement any interfaces, a CGLIB proxy is created.

## AOP Basic Terminologies
The terminologies we will discuss are not Spring specific, they are general AOP concepts that Spring implements.

Let's start by introducing the four main building blocks of any AOP example in Spring.
### JoinPoint
Simply put, a JoinPoint is a point in the execution flow of a method where an Aspect (new behavior) can be plugged in.

### Advice
It's the behavior that addresses system-wide concerns (logging, security checks, etc...). This behavior is represented by a method to be executed at a JoinPoint.
This behavior can be executed Before, After, or Around the JoinPoint according to the Advice type as we will see later.

### Pointcut
A Pointcut is an expression that defines at what JoinPoints, a given Advice should be applied.

### Aspect
Aspect is a class in which we define Pointcuts and Advices.

## Spring AOP Example
And now let's put those definitions into a coding example where we create a `Log` annotation that logs out a message to the console before the execution of the method starts.

First, let's include Spring's AOP and test starters dependencies.
```xml
<dependencies>  
	 <dependency> 
		 <groupId>org.springframework.boot</groupId>  
		 <artifactId>spring-boot-starter-test</artifactId>  
		 <scope>test</scope>  
	 </dependency>  
	 
	 <dependency> 
		 <groupId>org.springframework.boot</groupId>  
		 <artifactId>spring-boot-starter-aop</artifactId>  
		 <version>2.7.4</version>  
	 </dependency>
 </dependencies>
```
Now, let's create the `Log` annotation we want to use.
 ```java
import java.lang.annotation.ElementType;  
import java.lang.annotation.Retention;  
import java.lang.annotation.RetentionPolicy;  
import java.lang.annotation.Target;  
  
@Target(ElementType.METHOD)  
@Retention(RetentionPolicy.RUNTIME)  
public @interface Log {  
}
```
What this does is create an annotation that is only applicable to methods and gets processed at runtime.

The next step is creating the Aspect class with a Pointcut and Advice.

```java
import org.aspectj.lang.annotation.Aspect;  
import org.aspectj.lang.annotation.Before;  
import org.aspectj.lang.annotation.Pointcut;  
import org.springframework.stereotype.Component;  
  
@Component  
@Aspect  
public class LoggingAspect {  
    @Pointcut("@annotation(Log)")  
    public void logPointcut(){  
    }  
    @Before("logPointcut()")  
    public void logAllMethodCallsAdvice(){  
        System.out.println("In Aspect");  
  }  
}
```
Linking this to the definitions we introduced up top we notice the `@Aspect` annotation which marks the `LoggingAspect` class as a source for `@Pointcut` and Advice (`@Before`). Note as well that we annotated the class as a `@Component` to allow Spring to manage this class as a Bean.

Moreover, we used the expression`@Pointcut("@annotation(Log)")` to describe which potential methods (JoinPoints) are affected by the corresponding Advice method.

This brings us to `@Before("logPointcut()")` that executes the annotated method `logAllMethodCallsAdvice` before the execution of any method annotated with `@Log`.

Now, let's create a Spring Service that will utilize the aspect we defined.
```java
import org.springframework.stereotype.Service;

@Service  
public class ShipmentService {  
  @Log  
  // this here is what's called a join point  
  public void shipStuff(){  
        System.out.println("In Service");  
  }  
}
```
And let's test it out in a `@SpringBootTest`
 ```java
import org.junit.jupiter.api.Test;  
import org.springframework.beans.factory.annotation.Autowired;  
import org.springframework.boot.test.context.SpringBootTest;  
  
@SpringBootTest  
class AopApplicationTests {  
	  @Autowired  
	  ShipmentService shipmentService;  
	  
	  @Test  
	  void testBeforeLog() {  
	      shipmentService.shipStuff();  
	  }  	  
}
```
This will spin up a Spring context and load the `LoggingAspect` and the `ShipmentService`. Next, in the test method, we call the `shipStuff()` method which was annotated by `@Log`.

If we check the console we should see
```
In Aspect
In Service
```
This means that the `logAllMethodCallsAdvice` method was indeed executed before the `shipStuff()` method.

## Deeper Look Into Spring AOP's Annotations
Let's explore the full range of capabilities offered by Spring's AOP annotations.

### Pointcut
Pointcut expressions start with a Pointcut Designator (PCD), which specifies what methods to be targeted by our Advice.

#### execution
This is used to match a joinPoint method's signature.

```java
@Component  
@Aspect  
public class LoggingAspect {  
    ...
    @Pointcut("execution(public void io.reflectoring.springboot.aop.ShipmentService.shipStuffWithBill())")  
    public void logPointcutWithExecution(){}  
}
```
The above Pointcut will match the method named `shipStuffWithBill` with the signature `public void` that lives in the class `io.reflectoring.springboot.aop.ShipmentService`.

Now, let's add Advice matching the above Pointcut
```java
@Component  
@Aspect  
public class LoggingAspect {  
    ...  
    @Pointcut("execution(public void io.reflectoring.springboot.aop.ShipmentService.shipStuffWithBill())")  
    public void logPointcutWithExecution(){}  
  
    @Before("logPointcutWithExecution()")  
    public void logMethodCallsWithExecutionAdvice() {  
        System.out.println("In Aspect from execution");  
  }  
}
```
And let's put it to the test.
```java
@SpringBootTest  
class AopApplicationTests {  
   @Autowired  
  ShipmentService shipmentService;  
  
  ... 
  @Test  
  void testBeforeLogWithBill() {  
      shipmentService.shipStuffWithBill();  
  }  
}
```
This should print out
```
In Aspect from execution
In Service with Bill
```

Note, that we can also use Wildcards to write a more flexible expression. For example, the expression
```
execution(public void io.reflectoring.springboot.aop.ShipmentService.*())
```
will match any public void method that doesn't take parameters in `ShipmentService`.


Moreover, the expression
```
execution(public void io.reflectoring.springboot.aop.ShipmentService.*(..))
```
will match any public void method that takes zero or more parameters in `ShipmentService`.

#### within
This is used to match all the JoinPoint methods in a given class, package, or sub-package.

```java
@Component  
@Aspect  
public class LoggingAspect {
    ...
    @Pointcut("within(io.reflectoring.springboot.aop.BillingService)")  
	public void logPointcutWithin() {}  
	  
	@Before("logPointcutWithin()")  
	public void logMethodCallsWithinAdvice() {  
	    System.out.println("In Aspect from within");  
	}
}
```
Let's introduce a new Service, called the BillingService.
```java
@Service  
public class BillingService {  
    public void createBill() {  
        System.out.println("Bill created");  
  }  
}
```
And putting it to the test
```java
@SpringBootTest  
class AopApplicationTests {  
  ...
  @Autowired  
  BillingService billingService;
  
  @Test  
  void testWithin() {  
	 billingService.createBill();  
   }
}
```
This will give us
```
In Aspect from within
Bill created
```
Note that we can also use Wildcards to be more flexible. For example, let's write an expression to match all methods in the package `io.reflectoring.springboot.aop`
```
within(io.reflectoring.springboot.aop.*)
``` 

#### args
This is used to match arguments of JointPoint methods.
```java
@Component  
@Aspect  
public class LoggingAspect {
	...
	@Pointcut("execution(public void io.reflectoring.springboot.aop.BillingService.createBill(Long))")  
    public void logPointcutWithArgs() {}  
  
    @Before("logPointcutWithArgs()")  
    public void logMethodCallsWithArgsAdvice() {  
        System.out.println("In Aspect from Args");  
    }
}
```
Now, let's add a method that takes a Long argument.
```java
@Service  
public class BillingService {
	...
	public void createBill(Long price) {  
       System.out.println("Bill Created: " + price);  
   }
}
```
And the test
```java
@SpringBootTest  
class AopApplicationTests {
	@Test  
	void testWithArgs() {  
	   billingService.createBill(10L);  
	}
}
```
This should output
```
In Aspect from Args
Bill Created: 10
```

#### @annotation
This is used to match a JointPoint method annotated with a given annotation.
We used it in our first example of AOP.
```java
@Component  
@Aspect  
public class LoggingAspect {  
    ...
    @Pointcut("@annotation(Log)")  
    public void logPointcut(){  
    }  
    @Before("logPointcut()")  
    public void logAllMethodCallsAdvice(){  
        System.out.println("In Aspect");  
  }  
  ...
}
``` 
Then, we annotated a method with it
```java
@Service  
public class ShipmentService {  
  @Log  
  // this here is what's called a join point  
  public void shipStuff(){  
        System.out.println("In Service");  
  }  
}
```
With the test
 ```java
@SpringBootTest  
class AopApplicationTests {  
	  @Autowired  
	  ShipmentService shipmentService;  
      ...
	  @Test  
	  void testBeforeLog() {  
	      shipmentService.shipStuff();  
	  }
	  ...
}
```
Which should output
```
In Aspect
In Service
```

#### Combining PointCut Expressions
We can combine more than a single PointCut expression using logical operators, which are **&&** (and), **||** (or) and **!** (not) operators.

Say we have an `OrderService`.
```java
@Service  
public class OrderService {  
  
    public String orderStuff() {  
        System.out.println("Ordering stuff");  
		return "Order";  
    }  
    public void cancelStuff() {  
        System.out.println("Canceling stuff");  
    }  
}
```
Now, let's write a PointCut that matches all the methods in `OrderService` and that has a return type of `String`.

```java
@Component  
@Aspect  
public class LoggingAspect {
	...
	@Pointcut("within(io.reflectoring.springboot.aop.OrderService) && execution(public String io.reflectoring.springboot.aop.OrderService.*(..))")  
	public void logPointcutWithLogicalOperator(){}  
	  
	@Before("logPointcutWithLogicalOperator()")  
	public void logPointcutWithLogicalOperatorAdvice(){  
	    System.out.println("In Aspect from logical operator");  
	}
}
```
And as a test
```java
@SpringBootTest  
class AopApplicationTests {    
  ...
  @Autowired  
  OrderService orderService;
    ...
	@Test  
	void testOrderWithLogicalOperator() {  
	   orderService.orderStuff();  
	}  
	  
	@Test  
	void testCancelWithLogicalOperator() {  
	   orderService.cancelStuff();  
	}

}
```
The `testOrderWithLogicalOperator` method should print out
```
In Aspect from logical operator
Ordering stuff
```

While the method `testCancelWithLogicalOperator` should print out
```
Canceling stuff
```

### Advice Annotations
So far we have been using the `@Before` Advice annotation simply. Spring AOP, however, provides more interesting functionalities.

#### @Before
We can capture the JoinPoint at the `@Before` annotated method which offers us much useful information like the method name, method arguments, and [many more](https://www.eclipse.org/aspectj/doc/released/runtime-api/org/aspectj/lang/JoinPoint.html).
For example, let's can log the name of the method.

```java
@Component
@Aspect
public class LoggingAspect {
    @Pointcut("@annotation(Log)")
    public void logPointcut(){}

    @Before("logPointcut()")
    public void logAllMethodCallsAdvice(JoinPoint joinPoint){
        System.out.println("In Aspect at " + joinPoint.getSignature().getName());
    }
}
```
And testing it
```java
@SpringBootTest
class AopApplicationTests {
    @Autowired
    ShipmentService shipmentService;

    @Test
    void testBeforeLog() {
        shipmentService.shipStuff();
    }
}
```
Will print out
```
In Aspect at shipStuff
In Service
```

#### @After
This advice is run after the method finishes running, this could be by normally returning or by throwing an exception.

Let's introduce a new annotation
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AfterLog {}
```
```java
@Component
@Aspect
public class LoggingAspect {
	...
    @Pointcut("@annotation(AfterLog)")
    public void logAfterPointcut(){}

    @After("logAfterPointcut()")
    public void logMethodCallsAfterAdvice(JoinPoint joinPoint) {
        System.out.println("In After Aspect at " + joinPoint.getSignature().getName());
    }
}
```

And let's modify our service to use the new annotation
```java
@Service
public class OrderService {
	...
    @AfterLog
    public void checkStuff() {
        System.out.println("Checking stuff");
    }
}
```
And as for the test
```java
@SpringBootTest
class AopApplicationTests {
	...
    @Test
    void testCheckingStuffWithAfter() {
        orderService.checkStuff();
    }
}
```
This should output
```
Checking stuff
In After Aspect at checkStuff
```

#### @AfterReturning
This is similar to `@After` but it's run only after a normal execution of the method.

#### @AfterThrowing
This is similar to `@After` but it's run only after an exception is thrown while executing the method.


#### @Around
This annotation allows us to take actions either before or after a JoinPoint method is run. We can use it to return a custom value or throw an exception or simply let the method run and return normally.

Let's start by defining a new `ValidationService`
```java
@Service
public class ValidationService {
    public void validateNumber(int argument) {
        System.out.println(argument + " is valid");
    }
}
```
And a new Aspect class
```java
@Component
@Aspect
public class ValidationAspect {
    @Pointcut("within(io.reflectoring.springboot.aop.ValidationService)")
    public void validationPointcut(){}

    @Around("validationPointcut()")
    public void aroundAdvice(ProceedingJoinPoint joinPoint) throws Throwable {
        System.out.println("In Around Aspect");
        int arg = (int) joinPoint.getArgs()[0];
        if (arg < 0)
            throw new RuntimeException("Argument should not be negative");
        else
            joinPoint.proceed();
    }
}
```
The above `Pointcut` expression with capture all methods that are in the class `ValidationService`. Then, the `aroundAdvice()` advice will check the first argument of the method if it's negative it will throw an exception, otherwise it will allow the method to execute and return normally.

```java
@SpringBootTest
class AopApplicationTests {
	...
    @Autowired
    ValidationService validationService;

    @Test
    void testValidAroundAspect() {
        validationService.validateNumber(10);
    }
}
```
This will print out
```
In Around Aspect
10 is valid
```
And now let's try a case where we will get an exception.
```java
@SpringBootTest
class AopApplicationTests {
	...
    @Autowired
    ValidationService validationService;
	...
    @Test
    void testInvalidAroundAspect() {
        validationService.validateNumber(-4);
    }
}
```
This should output
```
In Around Aspect

java.lang.RuntimeException: Argument should not be negative
...
```

## Conclusion
Aspect Oriented Programming (AOP) allows us to address cross-cutting problems by coding our solutions into Aspects that are invoked by the Spring AOP framework.

It forms one of the main building blocks of the Spring framework allowing it to hide complexity behind Aspects.

The framework offers us a powerful collection of annotations that we covered and ran through examples testing each one of them.