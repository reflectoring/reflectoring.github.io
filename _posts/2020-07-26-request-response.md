---
title: Request-Response Pattern with Spring AMQP
categories: [spring-boot]
date: 2020-07-26 05:00:00 +1100
modified: 2020-07-26 05:00:00 +1100
author: artur
excerpt: "TODO"
image:
  auto: 0071-disk
---

The Request-Response pattern is well-known and widely used. This article shows how to implement 
this pattern with a message broker using AMQP protocol and Spring Boot.  

{% include github-project.html url="https://github.com/thombergs/code-examples/tree/master/spring-boot/cache" %}

## What is the Request-Response pattern?
The request-response interaction between two parties is pretty easy. The client sends the request to the
server, the server starts the procession and sends the response to the client, when the procession is done.
The most known example of this interaction is the communication over HTTP protocol, where the request and response are sent through the same channel.
Normally the client sends the request directly to the server.
In this case, the client has to know the API of the server. 

## Why do we need the Response-Request pattern.
A software enterprise system often consists of many components.
These components communicate with each other. Sometimes it is enough just to fire the event. But some components need to get the response to the request.
When we use direct synchronous communication, the client has to know the
API of the server. With a big number of the component we can build tight coupling between
them, and the whole picture can become unclear. We can use a message broker as a central component
for communication between the client and the server.

## Asynchronous Communication
Since we use messaging for the requests and responses, the communication is working asynchronously.
Let's have a look at how to implement the request-response communication with its asynchronous nature. 
These steps should be done:
1. The client sends the request to the request channel.
2. The server consumes the request from the requests channel.
3. The server sends the response to the response channel.
4. The client consumes the response from the response channel.

When the client sends a request, it waits for the response and listens to the response channel.
If the client sends many requests, then it expects a response for every request. But in this case,
the client would not be able to assign the obtained responses to the sent requests. To solve this problem,
the client should send a correlation identifier along to the request. The server should obtain this identifier and
add it to the response. Now the client is able to assign a response to its request.

![Response Request with Message Broker](/assets/img/posts/request-response/request-response.png)

It's important to do two steps.

* Create two channels. One for requests and one for the response.
* Use correlation id on both ends of the communication.

Another point we have to note is that the client has to have a state.
The clients generate a unique correlation id, for example `my unique id`.
Then the client sends the request to the channel and keeps the correlation id in the memory.
After that, the client waits for the responses in the response channel. 
Every response from the channel has a correlation id, and the client has to compare
this correlation id with that in memory to proceed with the response according to the request.

On other hand, the server is still stateless. The server just reads the correlation id from the request channel
and sends it to the response channel back.
   

### Remote Procedure Call with AMQP
Now let's see how we can implement this asynchronous communication with Spring Boot as client and server, and RabbitMQ
as a message broker. 
Let's create two Spring Boot applications. A client application, that sends the request to the server and waits for 
the response and a server application, that accept the request, processes it, and sent the response back to the client.
We will also use Spring AMQP framework for sending and receiving messages.

#### Client
First, we have to add the AMQP starter to the dependencies (Gradle notation)
````groovy
implementation 'org.springframework.boot:spring-boot-starter-amqp:2.3.2.RELEASE'
````   

Second, we create the configuration of the client application.

````java
@Configuration
public class ClientConfiguration {


    @Bean
    public DirectExchange directExchange() {
        return new DirectExchange("reflectoring.cars");
    }

    @Bean
    public MessageConverter jackson2MessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
````

The `DirectExchange` supports binding to different queues depending on the routing key.
In this case, we create an exchange `reflectoring.cars`. By sending a message to this exchange,
the client has to provide a routing key. The message broker will forward the message to the queue,
that is bound to the exchange with the given routing key.

We declare `Jackson2JsonMessageConverter` as default `MessageConverter` to send 
the messages to the message broker in JSON format.

Now we are ready to send a request message.

```java
@Component
public class StatefulBlockingClient {


    private final RabbitTemplate template;
    private final DirectExchange directExchange;
    public static final String ROUTING_KEY = "old.car";

    public void send() {
        CarDto carDto = CarDto.builder()
                        // ...
                        .build();
        RegistrationDto registrationDto = 
                        template.convertSendAndReceiveAsType(
                            directExchange.getName(),
                            ROUTING_KEY,
                            carDto,
                            new ParameterizedTypeReference<>() {
                            });
    }
}
```

The Spring AMQP provides the support for response-request pattern.
If we use the method `convertSendAndReceiveAsType` of `RabbitTemplate`,
Spring AMQP takes care of the request-response scenario. It creates a callback channel for the response, generates a correlation id, configures
the message broker, and receives the response from the server.
The information about the callback queue and correlation id will be sent to the
server too. It is transparent for the caller.
 
Since we configured `MessageConverter` in the configuration above,
it will be used by the template and the `carDto` will be sent as JSON to the channel.

#### Server
Now let's create a server application to proceed with the request and create the response.
First, we create a configuration for the server.

````java
@Configuration
public class ServerConfiguration {

    @Bean
    public DirectExchange directExchange() {
        return new DirectExchange("reflectoring.cars");
    }

    @Bean
    public Queue queue() {
        return new Queue("request");
    }

    @Bean
    public Binding binding(DirectExchange directExchange,
                           Queue queue) {
        return BindingBuilder.bind(queue)
                .to(directExchange)
                .with("old.car");
    }

    @Bean
    public MessageConverter jackson2MessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
````

We declare the same exchange as on the client-side. Then we create a queue for the request
and bind it to the exchange by the routing key `old.car`. All messages, that are sent to the exchange
with this routing key will be forwarded to the queue `request`. We have to note, that we don't
configure the callback queue or response configuration at all.
Spring AMQP will detect this from the message properties of the request
and configure everything automatically.

Now we have to implement the listener, that listens to the request queue.

````java
@Component
public class Consumer {

    @RabbitListener(queues = "#{queue.name}", concurrency = "3")
    public Registration receive(Car car) {
        return Registration.builder()
                .id(car.getId())
                .date(new Date())
                .owner("Ms. Rabbit")
                .signature("Signature of the registration")
                .build();
    }
}
````

This listener gets messages from the queue `request`.
We declare the `Jackson2JsonMessageConverter` in the configuration. This converter will convert the payload of the message to the object `Car`.
The method `receive` starts the business logic and return the object `Registration`.
The Spring AMQP takes care of the rest again. It will convert the `Registration` to
JSON set the correlation id of this request to the message of the response and send
it to the response queue. We don't even know the name of the response queue or
the value of the correlation id.

The client will get this response from the callback queue, read the correlation id, and continue working.
If we have several threads on the client-side, that are working in parallel and sending requests,
or if we have several methods, that use the same response channel, or even if we have many instances of the 
client, the Spring AMQP will always correlate the response message to the sender.

That's it. Now the client can call a method and start with it the procession on the server-side.
From the client perspective, it is a normal blocking remote call.

### Retrieving a Aynchronous Result Later

Normally the APIs are fast, and the client expects the response after a few milliseconds or seconds.
But there are cases when the server takes longer to send the response. It can be because of security policies,
high load, or some other long operations on the server-side.
During waiting for the response, the client could start further steps and get the response later.
We can use `AsyncRabbitTemplate` to achieve this.

````java
@Configuration
public class ClientConfiguration {

    @Bean
    public AsyncRabbitTemplate asyncRabbitTemplate(
                             RabbitTemplate rabbitTemplate){
        return new AsyncRabbitTemplate(rabbitTemplate);
    }
    // Other methods omitted.
}
````

We have to declare the bean of `AsyncRabbitTemplate` in the configuration. We pass the `rabbitTemplate`
bean to the constructor, because Spring AMQP configured it for us, and we just want to use it asynchronously.

After that, we can use it for sending messages.

```java
@Component
public class StatefulFutureClient {
   
   public void sendWithFuture() {
        CarDto carDto = CarDto.builder()
                 // ...
                .build();

        ListenableFuture<RegistrationDto> listenableFuture =
                asyncRabbitTemplate.convertSendAndReceiveAsType(
                        directExchange.getName(),
                        ROUTING_KEY,
                        carDto,
                        new ParameterizedTypeReference<>() {
                        });
        // non blocking part
        try {
            RegistrationDto registrationDto = listenableFuture.get();
        } catch (InterruptedException | ExecutionException e) {
            // ...
        }
    }
}
``` 

We use the method with the same signature as with `RabbitTemplate`, but this method returns
an implementation of `ListenableFuture` interface. After calling the method `convertSendAndReceiveAsType()` we
can execute other code and then call the method `get()` on the `ListenableFuture` to obtain
the response from the server. If we call the method `get` and the response is not returned,
we still have to wait and cannot execute further code.

### Registering Callback
To avoid blocking call we can register a callback, that is called asynchronously when the response message
is received. The `AsyncRabbitTemplate` supports this approach.

```java
@Component
public class StatefulCallbackClient {
  public void sendAsynchronouslyWithCallback() {
      CarDto carDto = CarDto.builder()
               // ...
              .build();
     RabbitConverterFuture<RegistrationDto> rabbitConverterFuture =
                     asyncRabbitTemplate.convertSendAndReceiveAsType(
                             directExchange.getName(),
                             ROUTING_KEY,
                             carDto,
                             new ParameterizedTypeReference<>() {});
      rabbitConverterFuture.addCallback(new ListenableFutureCallback<>() {
          @Override
          public void onFailure(Throwable ex) {
              // ...
          }

          @Override
          public void onSuccess(RegistrationDto registrationDto) {
              LOGGER.info("Registration received {}", registrationDto);
          }
      });
  }
}
```

We declare `RabbitConverterFuture` as return type of the method `convertSendAndReceiveAsType()`.
Then we add an `ListenableFutureCallback` to the `RabbitConverterFuture`.
From this place, we can continue proceeding without waiting for the response. The `ListenableFutureCallback`
will be called, when the response is in the queue.

Both approaches with using a `ListenableFuture` and registering a callback doesn't require
changes on the server-side. 

### Delayed Response with Separated Listener. 

All these approaches work fine with Spring AMQP and RabbitMQ, but there are cases when they have a drawback.
The client always has a state. It means if the client sends a response, the client has to keep the correlation id in memory
and assign the response to the request. 

**It means, only the sender of the request can get the response.**

Let's say we have many instances of the client. One instance sends a response to the server and this instance, unfortunately,
crashes for some
reasons and is not available anymore. The response cannot be proceeded anymore and is lost.
Also, the server can take longer than usually for proceeding request and clients
gets a timeout. In this case, the response is lost again.

To solve this problem we have to let other instances proceed with the response.
To achieve this, we have to do some manual work.
**We create the request sender and the response listener separately.** 
First, we have to create a response queue and set up a listener, that is listening to this queue on the client-side.
Second, we have to take care about the correlation between requests and responses.

We declare the response queue in the client configuration.

````java
@Configuration
public class ClientConfiguration {

    @Bean
    public Queue response(){
        return new Queue("response");
    }
    // other methods omitted.
}
````

Now we send the request to the same exchange as in the example above.

````java
@Component
public class StatelessClient {

    public void sendAndForget() {
     CarDto carDto = CarDto.builder()
                 // ...
                .build();
        UUID correlationId = UUID.randomUUID();

        registrationService.saveCar(carDto, correlationId);

        MessagePostProcessor messagePostProcessor = message -> {
            MessageProperties messageProperties 
                              = message.getMessageProperties();
            messageProperties.setReplyTo(replyQueue.getName());
            messageProperties.setCorrelationId(correlationId.toString());
            return message;
        };
        template.convertAndSend(directExchange.getName(),
                "old.car",
                carDto,
                messagePostProcessor);
    }
}
````
First different to the approach with remote procedure call is, that we generate a correlation id
in the code and don't delegate it to Spring AMQP anymore.
In the next step, we save the correlation id to the database. After that other instance of the client, that
use the same database, can read it later.
Now we use the method `convertAndSend()` and not `convertSendAndReceiveAsType()`, because
we don't wait for the response after the call. We send messages in fire-and-forget manner.

It is important to add the information about the correlation id and the response queue to the message.
The server will read this information and send the response to the response queue.
We do it by using the `MessagePostProcessor`.  With `MessagePostProcessor` we can change
the header if the message or message properties after the conversation. In this case,
we add the correlation id we saved in the database and the name of the repose queue.

**The request message has all data to proceed on the server-side properly, so we don't nee change
anything on the server-side**

Now we implement the listener, that listening to the response queue.

````java
@Component
public class ReplyConsumer {

    @RabbitListener(queues = "#{response.name}")
    public void receive(RegistrationDto registrationDto, Message message){
        String correlationId 
               = message.getMessageProperties().getCorrelationId();
        registrationService.saveRegistration(
                            UUID.fromString(correlationId),
                            registrationDto);
    }
}
````
 
We use the annotation `@RabbitListener` for the listener to the response queue. In the method
`receive` we need the payload of the message and the meta information of the message to
read the correlation id. We easily do it by adding the `Message` as the second parameter.
Now we can read the correlation id from the message, find the correlated data in the database 
and proceed with the business logic.

Since we split the message sender and the listener for responses, we can scale the client
application. One instance can send the request and another instance of the client can proceed with the response.
With this approach both sides of the interaction are scalable. 

## Conclusion
Spring AMQP provides support for implementing the request-response pattern with
a message broker in a synchronous and asynchronous way. With minimal effort, it is possible
to create scalable and reliable applications.



  
 
  
 




