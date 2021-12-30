---
title: "Logical Operations Between Java Collections"
categories: [java]
date: 2022-01-03 06:00:00 +1000
modified: 2022-01-03 06:00:00 +1000
author: pratikdas
excerpt: "Collections are in important feature of all programming languages. In this article, we will look at the some logical operations on Java Collections."
image:
  auto: 0074-stack
---

Collections are an important feature of all programming languages. In this article, we will look at the following logical operations on Java Collections.

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/resttemplate" %}

## Adding Two Collections

```java
public class CollectionHelper {
    
    public List<Integer> add(final List<Integer> collA, final List<Integer> collB){

        return Stream.concat(collA.stream(), 
                collB.stream())
        .collect(Collectors.toList());
        
        
    }   
}

class CollectionHelperTest {
    
    CollectionHelper collectionHelper;

    /**
     * @throws java.lang.Exception
     */
    @BeforeEach
    void setUp() throws Exception {
        collectionHelper = new CollectionHelper();
    }

 
    
    @Test
    void testAddition() {
        List<Integer> sub = collectionHelper.add(
                List.of(9,8,5,4), 
                List.of(1,3,99,4,7));
        
        
        Assertions.assertArrayEquals(
                List.of(9,8,5,4,1,3,99,4,7).toArray(), 
                sub.toArray());
    }

    
    @Test
    void testSubtraction() {
        List<Integer> sub = collectionHelper.subtract(
                List.of(9,8,5,4,7, 15, 15), 
                List.of(1,3,99,4,7));
        
        
        Assertions.assertArrayEquals(
                List.of(9,8,5,15,15).toArray(), 
                sub.toArray());
    }

}

```


## Subtracting Two Collections

```java
public class CollectionHelper {
    
    public List<Integer> subtract(final List<Integer> collA, final List<Integer> collB){
        List<Integer> intersectElements = intersection(collA,collB);
        
        List<Integer> subtractedElements = collA.stream().filter(element->!intersectElements.contains(element)).collect(Collectors.toList());
        
        if(!subtractedElements.isEmpty()) {
            return subtractedElements;
        }else {
            return Collections.emptyList();
        }
        
    }
}

class CollectionHelperTest {
    
    CollectionHelper collectionHelper;

    @BeforeEach
    void setUp() throws Exception {
        collectionHelper = new CollectionHelper();
    }

 
    @Test
    void testSubtraction() {
        List<Integer> sub = collectionHelper.subtract(
                List.of(9,8,5,4,7, 15, 15), 
                List.of(1,3,99,4,7));
        
        
        Assertions.assertArrayEquals(
                List.of(9,8,5,15,15).toArray(), 
                sub.toArray());
    }

}

```
## Intersection of Two Collections (AND)


## Union of Two Collections (OR)


## Conclusion

Here is a list of the major points for a quick reference:

1. RestTemplate is a synchronous client for making REST API calls over HTTP
2. RestTemplate has generalized methods like `execute()` and `exchange()` which take the HTTP method as a parameter. `execute()` method is most generalized since it takes request and response callbacks which can be used to add more customizations to the request and response processing.
3. RestTemplate also has separate methods for making different HTTP methods like `getForObject()` and `getForEntity()`.
4. We have the option of getting the response body in raw JSON format which needs to be further processed with a JSON parser or a structured POJO that can be directly used in the application.
5. Request body is sent by wrapping the POJOs in a `HttpEntity` class.
6. `RestTemplate` can be customized with an HTTP client library, error handler, and message converter.
7. Lastly, calling `RestTemplate` methods results in blocking the request thread till the response is received. Reactive `WebClient` is advised to be used for new applications.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-boot/resttemplate).

