---
authors: [tom]
title: "Testing a Spring Message Producer and Consumer against a Contract with Pact"
categories: ["Spring Boot"]
date: 2018-09-13
excerpt: "A tutorial on using Spring and Pact to create a contract between a message
          producer and a message consumer and to verify if both producer and consumer
          work as expected by this contract."
image:  images/stock/0029-contract-1200x628-branded.jpg
url: cdc-pact-messages
---



Among other things, testing an interface between two systems with  
(consumer-driven) contract tests is [faster and more stable](/7-reasons-for-consumer-driven-contracts)
than doing so with end-to-end tests. This tutorial shows how to create a contract
between a message producer and a message consumer using the Pact framework and how to
test the producer and consumer against this contract.

## The Scenario

As an example to work with, let's say we have a user service that sends a 
message to a message broker each time a new user has been created. The message
contains a UUID and a user object.

In Java code, the message looks like this:

```java
@Data
public class UserCreatedMessage {

  @NotNull
  private String messageUuid;

  @NotNull
  private User user;

}

@Data
public class User {

  @NotNull
  private long id;

  @NotNull
  private String name;

}
```
In order to reduce boilerplate code, we use [Lombok's](https://projectlombok.org/) `@Data` annotation to
automatically generate getters and setters for us.

Java objects of type `UserCreatedMessage` are mapped into JSON strings before
we send them to the message broker. We use [Jackson's](https://github.com/FasterXML/jackson) `ObjectMapper` to do the mapping
from Java objects to JSON strings and back, since it's included in Spring Boot projects
by default.

Note the `@NotNull` annotations on the fields. This annotation is part of the standard 
Java Bean Validation annotations we'll be using to validate message objects later on.

## Consumer and Producer Architecture

Before diving into the consumer and producer tests, let's have a look at the architecture.
Having a clean architecture is important since we don't want to test the whole conglomerate of classes, but only
those classes that are responsible for consuming and producing messages.

The figure below shows the data flow through our consumer and provider code base.

{{% image alt="Architecture" src="images/posts/cdc-pact-messages/architecture.jpg" %}}

1. In the **domain logic** on the producer side, something happens that triggers a message.
1. The message is passed as a Java object to the **`MessageProducer`** class which transforms it into a JSON string.
1. The JSON string is passed on to the **`MessagePublisher`**, whose single responsibility is to send it to the message broker.
1. On the consumer side, the **`MessageListener`** class receives the message as a string from the broker.
1. The string message is passed to the **`MessageConsumer`**, which transforms it back into a Java object.
1. The Java object is passed into the **domain logic** on the consumer side to be processed.

In the contract between consumer and producer, we want to define the structure of
the exchanged JSON message. So, to verify the contract, we actually only need to check that

* `MessageProducer` correctly transforms Java objects into JSON strings
* `MessageConsumer` correctly transforms JSON strings into Java objects.

Since we're testing the `MessageProducer` and `MessageConsumer` classes in isolation,
we don't care what message broker we're using. **We're just verifying that these two classes
speak the same (JSON) language and can be sure that the contract between producer and
consumer is met**.

## Testing the Message Consumer

Since we're doing consumer-driven contract testing, we're starting with the consumer side.
You can find the code for the consumer in my [github repo](https://github.com/thombergs/code-examples/tree/master/pact/pact-message-consumer).

Our `MessageConsumer` class looks like this:

```java
public class MessageConsumer {

  private ObjectMapper objectMapper;
  
  public MessageConsumer(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public void consumeStringMessage(String messageString) throws IOException {
    UserCreatedMessage message = 
        objectMapper.readValue(messageString, UserCreatedMessage.class);
    
    Validator validator = 
        Validation.buildDefaultValidatorFactory().getValidator();
    
    Set<ConstraintViolation<UserCreatedMessage>> violations = 
        validator.validate(message);
    
    if(!violations.isEmpty()){
      throw new ConstraintViolationException(violations);
    }
    // pass message into business use case
  }

}
```

It takes a string message as input, interprets it as JSON and transforms it into
a `UserCreatedMessage` object with the help of `ObjectMapper`.

To check if all fields are valid, we use a Java Bean Validator. In our case,
the validator will check if all fields are set since we used the `@NotNull` 
annotation on all fields in the message class.

If the validation fails, we throw an exception. This is important since we need some kind of 
signal if the incoming string message is invalid. 

If everything looks good, we pass the message object into the business logic.

To test the consumer, we create a unit test similar as we would for a 
[plain REST consumer test](/consumer-driven-contract-feign-pact):

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class MessageConsumerTest {

  @Rule
  public MessagePactProviderRule mockProvider = 
    new MessagePactProviderRule(this);
  
  private byte[] currentMessage;

  @Autowired
  private MessageConsumer messageConsumer;

  @Pact(provider = "userservice", consumer = "userclient")
  public MessagePact userCreatedMessagePact(MessagePactBuilder builder) {
    PactDslJsonBody body = new PactDslJsonBody();
    body.stringType("messageUuid");
    body.object("user")
            .numberType("id", 42L)
            .stringType("name", "Zaphod Beeblebrox")
            .closeObject();

    return builder
            .expectsToReceive("a user created message")
            .withContent(body)
            .toPact();
  }

  @Test
  @PactVerification("userCreatedMessagePact")
  public void verifyCreatePersonPact() throws IOException {
    messageConsumer.consumeStringMessage(new String(this.currentMessage));
  }

  /**
   * This method is called by the Pact framework.
   */
  public void setMessage(byte[] message) {
    this.currentMessage = message;
  }

}
```

We use `@SpringBootTest` so we can let Spring create a `MessageConsumer` and `@Autowire` it
into our test. We could do without Spring and just create the `MessageConsumer` ourselves, though.

The `MessageProviderRule` takes care of starting up a mock provider that accepts
a message and validates if it matches the contract. 

The contract itself is defined in the method annotated with `@Pact`. The method annotated
with `@PactVerification` verifies that our `MessageConsumer` can read the message. 

For the verification, we simply pass the string message provided by Pact into the consumer
and if there is no exception, we assume that the consumer can handle the message. **This is
why it's important that the `MessageConsumer` class does all the JSON parsing and validation**. 

## Testing the Message Producer

Let's look at the producer side. You can find the producer source code in my 
[github repo](https://github.com/thombergs/code-examples/tree/master/pact/pact-message-producer).

The `MessageProducer` class looks something like this:

```java
class MessageProducer {

    private ObjectMapper objectMapper;

    private MessagePublisher messagePublisher;

    MessageProducer(
        ObjectMapper objectMapper,
        MessagePublisher messagePublisher) {
      this.objectMapper = objectMapper;
      this.messagePublisher = messagePublisher;
    }

    void produceUserCreatedMessage(UserCreatedMessage message)
        throws IOException {
      
      String stringMessage = 
          objectMapper.writeValueAsString(message);
      
      messagePublisher.publishMessage(stringMessage, "user.created");
    }

}
```

The central part is the method `produceUserCreatedMessage()`. It takes a `UserCreatedMessage`
object, transforms it into a JSON string, and then passes that string to the `MessagePublisher`
who will send it to the message broker.

The Java-to-JSON mapping is done with an `ObjectMapper` instance.

The test for the `MessageProducer` class looks like this:

```java
@RunWith(PactRunner.class)
@Provider("userservice")
@PactFolder("../pact-message-consumer/target/pacts")
public class UserCreatedMessageProviderTest {

    @TestTarget
    public final Target target = 
        new AmqpTarget(Collections.singletonList("io.reflectoring"));

    private MessagePublisher publisher = 
        Mockito.mock(MessagePublisher.class);

    private MessageProducer messageProvider = 
        new MessageProducer(new ObjectMapper(), publisher);

    @PactVerifyProvider("a user created message")
    public String verifyUserCreatedMessage() throws IOException {
      // given
      doNothing()
        .when(publisher)
        .publishMessage(any(String.class), eq("user.created"));

      // when
      UserCreatedMessage message = UserCreatedMessage.builder()
          .messageUuid(UUID.randomUUID().toString())
          .user(User.builder()
              .id(42L)
              .name("Zaphod Beeblebrox")
              .build())
          .build();
      messageProvider.produceUserCreatedMessage(message);

      // then
      ArgumentCaptor<String> messageCapture = 
        ArgumentCaptor.forClass(String.class);
      
      verify(publisher, times(1))
        .publishMessage(messageCapture.capture(), eq("user.created"));

      return messageCapture.getValue();
    }
}
```

With the `@PactFolder` and `@Provider` annotation, we tell Pact to load the contracts
for the provider named `userservice` from a certain folder. The contract must have been
created earlier by the consumer.

For each interaction in those contracts, we need a method annotated with `@PactVerifyProvider`,
in our case only one. In this method, we use Mockito to mock all dependencies of our
`MessageProducer` away and then pass to it an object of type `UserCreatedMessage`.

The `MessageProducer` will dutifully transform that message object into a JSON string
and pass that string to the mocked `MessagePublisher`. We capture the JSON string
that is passed to the `MessagePublisher` and return it. 

Pact will automatically send the produced string message to the `Target` field annotated with
`@TestTarget` (in this case an instance of `AmqpTarget`) where it will be checked against the
contract.

{% capture notice %}
#### Classpath Issues
I couldn't quite get the `AmqpTarget` class to work due to [classpath issues](https://github.com/DiUS/pact-jvm/issues/763). 
Hence, I created a [subclass](https://github.com/thombergs/code-examples/blob/master/pact/pact-message-provider/src/test/java/io/reflectoring/CustomAmqpTarget.java)
that overrides some of the reflection magic. Have a look at [the code](https://github.com/thombergs/code-examples/tree/master/pact/pact-message-provider/src/test/java/io/reflectoring)
if you run into the same problem.
{% endcapture %}

<div class="notice warning">{{ notice | markdownify }}</div>

## Conclusion

Due to a clean architecture with our components having single responsibilities, we can
reduce the contract test between a message producer and a message consumer to verifying
that the mapping between Java objects and JSON strings works as expected.
 
**We don't have to deal with the actual or even a simulated message broker to verify that
message consumer and message provider speak the same language**.


