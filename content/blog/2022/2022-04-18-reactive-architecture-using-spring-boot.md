---
title: "A Reactive Architecture using Spring Boot"
categories: ["Spring"]
date: 2022-04-17 00:00:00 +1100 
modified: 2022-04-17 00:00:00 +1100
authors: [arpendu]
excerpt: "A comprehensive guide to migrate from a simple blocking call architecture to Reactive Streams and Message-driven architecture using Spring Boot microservices. A deep-dive to understand the Reactive Programming paradigm and their APIs. We will also adapt message-driven architecture along with Spring Webflux Reactive system."
image: images/stock/0122-blocks-4480x6720.jpg 
url: reactive-architecture-using-spring-boot
---

When we start building an application from scratch or try to build an application for a startup, we tend to build a single monolith application mapped to a single database. Over time, as the system adds more complexity, we tend to break that monolith into a group of small microservices. Now when that startup grows into a large-scale enterprise, we need to increase the adaptability, scalability, and speed of the same microservices. We might need to process the volume and the variety of the data with the ever-increasing competition of the velocity against other similar products in the market as well. Thus, in the digital era of competition, where change is constant, there is a high need to convert the simple monolith or microservices to a reactive system so that it can easily deliver adaptability, speed, efficiency, and organizational decentralization.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-reactive-architecture" %}}

## Brief Introduction to Reactive Systems

In microservices, each service practically takes care of its data and persistence. Then there is always an orchestration between these services and they interact with each other synchronously or asynchronously using their APIs. 

Since each service is isolated, they are independently scalable and resistant to failure. Microservices are explicitly designed to tackle failures so that they can be easily taken down without disturbing the overall system. 

Thus, it usually makes sense to bring atomicity within the services and make the interactions and network calls asynchronous to address the problem of handling the data-rich, interactive user experience. Hence, a bunch of prominent developers realized that they would need an approach to build a “reactive” systems architecture that would ease the processing of data *while streaming* and they signed a manifesto, popularly known as the [Reactive Manifesto](https://www.reactivemanifesto.org/).

The authors of the manifesto stated that a reactive system must be an *asynchronous* software that deals with *producers* who have the single responsibility to send messages to *consumers*. They introduced the following features to keep in mind:

- **Responsive**: Reactive systems must be fast and responsive so that they can provide a consistently high quality of service.
- **Resilient**: Reactive systems should be designed to anticipate system failures. Thus, they should be responsive through replication and isolation.
- **Elastic**: Reactive systems must be adaptive to shard or replicate components based upon their requirement. They should use predictive scaling to anticipate sudden ups and downs in their infrastructure.
- **Message-driven**: Since all the components in a reactive system are supposed to be loosely coupled, they must communicate across their boundaries by asynchronously exchanging messages.

Hence, a programming paradigm was introduced, popularly known as the *Reactive Programming Paradigm*. If you want to know in-depth about the various components in this paradigm, then have a look at our [WebFlux article](/getting-started-with-spring-webflux/#introducing-reactive-programming-paradigm).

In this chapter, we are going to build a microservice architecture that would be based upon the following design principles:

- Do one thing, and one thing well while defining service boundaries
- Isolate all the services
- Ensure that the services act autonomously
- Embrace asynchronous messaging between the services
- Stay mobile, but addressable
- Design for the required level of consistency

## Building a Synchronous Credit Card Transaction System

For this article, we are going to build a simple microservice that would receive continuous credit card transactions as a data stream and take necessary actions based on the decision of whether that particular transaction is valid or fraudulent. This architecture wouldn’t necessarily exhibit the characteristics of a reactive system. Rather we will make necessary changes in the design progressively to finally adopt a reactive characteristic.

{{% image alt="Spring Microservice" src="images/posts/spring-reactive-architecture/spring-microservice.png" %}}

- We will define four services:

  - **Banking Service** - This will receive the transaction request as an API call. Then it will orchestrate and send the transaction downstream based upon various criteria to take necessary actions.
  - **User Notification Service** - This will receive fraudulent transactions and notify or alert users to make them aware of the transaction attempt.
  - **Reporting Service** - This will receive any kind of transaction and report in case valid or fraudulent. It will also report to the bank and update or take necessary actions against the card or User Account.
  - **Account Management Service** - This will manage the user’s account and update it in case of valid transactions.

  All the above calls will be synchronous and driven by banking service. It would wait for the downstream applications to process the calls synchronously and finally update the result.

  We will be using MongoDB and create two tables, `Transaction`, and `User`. Each *transaction* would contain the following information:

  - **Card ID** - the user's card ID with which (allegedly) a purchase was made
  - **Amount** - the amount of the purchase transaction in dollars
  - **Transaction location** - the country in which that purchase has been made
  - **Transaction Date**
  - **Store Information**
  - **Transaction ID**

### Banking Service

We will first define a *banking microservice* that would receive a transaction. Based upon the transaction status, this service will play as an orchestrator to communicate between other services and take necessary actions. This will be a simple synchronous call that would wait until all the other services take necessary actions and update the final status. 

Let’s define a `Transaction` model to receive the incoming information:

```java
@Data
@Document
@ToString
@NoArgsConstructor
public class Transaction {

  @Id
  @JsonProperty("transaction_id")
  private String transactionId;
  private String date;

  @JsonProperty("amount_deducted")
  private double amountDeducted;

  @JsonProperty("store_name")
  private String storeName;

  @JsonProperty("store_id")
  private String storeId;

  @JsonProperty("card_id")
  private String cardId;

  @JsonProperty("transaction_location")
  private String transactionLocation;
  private TransactionStatus status;
}
```

Next, we will also create a `User` model which will have the User details and the card or Account info:

```java
@Data
@Document
@ToString
@NoArgsConstructor
public class User {

  @Id
  private String id;

  @JsonProperty("first_name")
  private String firstName;

  @JsonProperty("last_name")
  private String lastName;
  private String email;
  private String address;

  @JsonProperty("home_country")
  private String homeCountry;
  private String gender;
  private String mobile;

  @JsonProperty("card_id")
  private String cardId;

  @JsonProperty("account_number")
  private String accountNumber;

  @JsonProperty("account_type")
  private String accountType;

  @JsonProperty("account_locked")
  private boolean accountLocked;

  @JsonProperty("fraudulent_activity_attempt_count")
  private Long fraudulentActivityAttemptCount;

  @JsonProperty("valid_transactions")
  private List<Transaction> validTransactions;

  @JsonProperty("fraudulent_transactions")
  private List<Transaction> fraudulentTransactions;
}
```

Now let’s define a controller with a single endpoint:

```java
@Slf4j
@RestController
@RequestMapping("/banking")
public class TransactionController {

  @Autowired
  private TransactionService transactionService;

  @PostMapping("/process")
  public ResponseEntity<Transaction> process(@RequestBody Transaction transaction) {
    log.info("Process transaction with details: {}", transaction);
    Transaction processed = transactionService.process(transaction);
    if (processed.getStatus().equals(TransactionStatus.SUCCESS)) {
      return ResponseEntity.ok(processed);
    } else {
      return ResponseEntity.internalServerError().body(processed);
    }
  }
}
```

And finally, a service to encapsulate the business logic and orchestrate the information to other services.

```java
@Slf4j
@Service
public class TransactionService {
  
  private static final String USER_NOTIFICATION_SERVICE_URL = "http://localhost:8081/notify/fraudulent-transaction";
  private static final String REPORTING_SERVICE_URL = "http://localhost:8082/report/";
  private static final String ACCOUNT_MANAGER_SERVICE_URL = "http://localhost:8083/banking/process";

  @Autowired
  private TransactionRepository transactionRepo;

  @Autowired
  private UserRepository userRepo;

  @Autowired
  private RestTemplate restTemplate;

  public Transaction process(Transaction transaction) {

    Transaction firstProcessed;
    Transaction secondProcessed = null;
    transactionRepo.save(transaction);
    if (transaction.getStatus().equals(TransactionStatus.INITIATED)) {

      User user = userRepo.findByCardId(transaction.getCardId());

      // Check whether the card details are valid or not
      if (Objects.isNull(user)) {
        transaction.setStatus(TransactionStatus.CARD_INVALID);
      }

      // Check whether the account is blocked or not
      else if (user.isAccountLocked()) {
        transaction.setStatus(TransactionStatus.ACCOUNT_BLOCKED);
      }

      else {

        // Check if it's a valid transaction or not. The Transaction would be considered valid
        // if it has been requested from the same home country of the user, else will be considered
        // as fraudulent
        if (user.getHomeCountry().equalsIgnoreCase(transaction.getTransactionLocation())) {

          transaction.setStatus(TransactionStatus.VALID);

          // Call Reporting Service to report valid transaction to bank and deduct amount if funds available
          firstProcessed = restTemplate.postForObject(REPORTING_SERVICE_URL, transaction, Transaction.class);

          // Call Account Manager service to process the transaction and send the money
          if (Objects.nonNull(firstProcessed)) {
            secondProcessed = restTemplate.postForObject(ACCOUNT_MANAGER_SERVICE_URL, firstProcessed, Transaction.class);
          }

          if (Objects.nonNull(secondProcessed)) {
            transaction = secondProcessed;
          }
        } else {

          transaction.setStatus(TransactionStatus.FRAUDULENT);

          // Call User Notification service to notify for a fraudulent transaction
          // attempt from the User's card
          firstProcessed = restTemplate.postForObject(USER_NOTIFICATION_SERVICE_URL, transaction, Transaction.class);

          // Call Reporting Service to notify bank that there has been an attempt for fraudulent transaction
          // and if this attempt exceeds 3 times then auto-block the card and account
          if (Objects.nonNull(firstProcessed)) {
            secondProcessed = restTemplate.postForObject(REPORTING_SERVICE_URL, firstProcessed, Transaction.class);
          }

          if (Objects.nonNull(secondProcessed)) {
            transaction = secondProcessed;
          }
        }
      }
    } else {

      // For any other case, the transaction will be considered failure
      transaction.setStatus(TransactionStatus.FAILURE);
    }
    return transactionRepo.save(transaction);
  }
}
```

### User Notification Service

User Notification Service would be responsible to notify users if there is any suspicious or fraudulent transaction attempt in the system. We will send a mail to the User and alert them about the fraudulent transaction.

Let’s begin by defining a simple controller to expose an endpoint:

```java
@Slf4j
@RestController
@RequestMapping("/notify")
public class UserNotificationController {

  @Autowired
  private UserNotificationService userNotificationService;

  @PostMapping("/fraudulent-transaction")
  public ResponseEntity<Transaction> notify(@RequestBody Transaction transaction) {
    log.info("Process transaction with details and notify user: {}", transaction);
    Transaction processed = userNotificationService.notify(transaction);
    if (processed.getStatus().equals(TransactionStatus.SUCCESS)) {
      return ResponseEntity.ok(processed);
    } else {
      return ResponseEntity.internalServerError().body(processed);
    }
  }
}
```

Next, we will define the service layer to encapsulate our logic:

```java
@Slf4j
@Service
public class UserNotificationService {

  @Autowired
  private TransactionRepository transactionRepo;

  @Autowired
  private UserRepository userRepo;

  @Autowired
  private JavaMailSender emailSender;

  public Transaction notify(Transaction transaction) {

    if (transaction.getStatus().equals(TransactionStatus.FRAUDULENT)) {

      User user = userRepo.findByCardId(transaction.getCardId());

      // Notify user by sending email
      SimpleMailMessage message = new SimpleMailMessage();
      message.setFrom("noreply@baeldung.com");
      message.setTo(user.getEmail());
      message.setSubject("Fraudulent transaction attempt from your card");
      message.setText("An attempt has been made to pay " + transaction.getStoreName()
              + " from card " + transaction.getCardId() + " in the country "
              + transaction.getTransactionLocation() + "." +
              " Please report to your bank or block your card.");
      emailSender.send(message);
      transaction.setStatus(TransactionStatus.FRAUDULENT_NOTIFY_SUCCESS);
    } else {
      transaction.setStatus(TransactionStatus.FRAUDULENT_NOTIFY_FAILURE);
    }
    return transactionRepo.save(transaction);
  }
}
```

### Reporting Service

Reporting Service would check if there is a fraudulent transaction then it will update the User account with the fraudulent attempt. For the safety and security of the User’s account, it may take necessary actions to automatically lock the account if there are multiple attempts. If the transaction is valid, then it will store the transaction information and update his account.

Let’s define a controller to report a transaction:

```java
@Slf4j
@RestController
@RequestMapping("/report")
public class ReportingController {

  @Autowired
  private ReportingService reportingService;

  @PostMapping("/")
  public ResponseEntity<Transaction> report(@RequestBody Transaction transaction) {
    log.info("Process transaction with details: {}", transaction);
    Transaction processed = reportingService.report(transaction);
    if (processed.getStatus().equals(TransactionStatus.SUCCESS)) {
      return ResponseEntity.ok(processed);
    } else {
      return ResponseEntity.internalServerError().body(processed);
    }
  }
}
```

Then we will define a service layer to define our business logic:

```java
@Slf4j
@Service
public class ReportingService {

  @Autowired
  private TransactionRepository transactionRepo;

  @Autowired
  private UserRepository userRepo;

  public Transaction report(Transaction transaction) {

    if (transaction.getStatus().equals(TransactionStatus.FRAUDULENT_NOTIFY_SUCCESS)
        || transaction.getStatus().equals(TransactionStatus.FRAUDULENT_NOTIFY_FAILURE)) {

      // Report the User's account and take automatic action against User's account or card
      User user = userRepo.findByCardId(transaction.getCardId());
      user.setFraudulentActivityAttemptCount(user.getFraudulentActivityAttemptCount() + 1);
      user.setAccountLocked(user.getFraudulentActivityAttemptCount() > 3);
      user.getFraudulentTransactions().add(transaction);
      userRepo.save(user);

      transaction.setStatus(user.isAccountLocked() ? TransactionStatus.ACCOUNT_BLOCKED : TransactionStatus.FAILURE);
    }
    return transactionRepo.save(transaction);
  }
}
```

### Account Management Service

Finally, the Account Management Service will manage the user account and add the incoming transaction to the user’s account for further processing. It will return a message to the banking service that the transaction had been marked valid and successful.

Let’s define a Controller first:

```java
@Slf4j
@RestController
@RequestMapping("/banking")
public class AccountManagementController {

  @Autowired
  private AccountManagementService accountManagementService;

  @PostMapping("/process")
  public ResponseEntity<Transaction> manage(@RequestBody Transaction transaction) {
    log.info("Process transaction with details: {}", transaction);
    Transaction processed = accountManagementService.manage(transaction);
    if (processed.getStatus().equals(TransactionStatus.SUCCESS)) {
      return ResponseEntity.ok(processed);
    } else {
      return ResponseEntity.internalServerError().body(processed);
    }
  }
}
```

Finally, we will define a service layer to cover the business logic:

```java
@Slf4j
@Service
public class AccountManagementService {

  @Autowired
  private TransactionRepository transactionRepo;

  @Autowired
  private UserRepository userRepo;

  public Transaction manage(Transaction transaction) {
    if (transaction.getStatus().equals(TransactionStatus.VALID)) {
      transaction.setStatus(TransactionStatus.SUCCESS);
      transactionRepo.save(transaction);

      User user = userRepo.findByCardId(transaction.getCardId());
      user.getValidTransactions().add(transaction);
      userRepo.save(user);
    }
    return transaction;
  }
}
```

### Deploying the application

Once we have created all the individual microservices, we need to deploy them all and make them orchestrate so that they can communicate to each other seamlessly. For the sake of simplicity, we have defined a *Dockerfile* to build each of the microservice and will use Docker Compose to build and deploy the services. Our `docker-compose.yml` looks like below:

```yaml
version: '3'
services:
  mongodb:
    image: mongo:5.0
    ports:
      - 27017:27017
    volumes:
      - ~/apps/mongo:/data/db
  banking-service:
    build: ./banking-service
    ports:
      - "8080:8080"
    depends_on:
      - mongodb
      - user-notification-service
      - reporting-service
      - account-management-service
  user-notification-service:
    build: ./user-notification-service
    ports:
      - "8081:8081"
    depends_on:
      - mongodb
  reporting-service:
    build: ./reporting-service
    ports:
      - "8082:8082"
    depends_on:
      - mongodb
  account-management-service:
    build: ./account-management-service
    ports:
      - "8083:8083"
    depends_on:
      - mongodb
```

### Problems With A Synchronous Architecture

This is just a bunch of simple microservices interacting with each other, each one having a distinctive responsibility and a role to play. Still, this is far from real-time production-grade enterprise software. So let’s look into the present problems in this architecture and discuss further how we can transform it into a full-fledged reactive system.

- All the calls to the external systems and the internal embedded database are blocking in nature.
- When we need to handle a large stream of incoming data, most of the worker threads in each service would be busy completing their task. Whereas the servlet threads in each service reach a waiting state due to which some of the calls remain blocked until the previous ones are resolved.
- This makes our overall microservice slow in performance.
- Failure in any of these services could have a cascading effect and stop the entire system to function which is against the design of microservices.
- Present deployment may not be capable enough to become fault-tolerant or fluctuate loads automatically.

Blocking calls in any large-scale system often becomes a bottleneck waiting for things to work. This can occur with any API calls, database calls, or network calls. We must plan to make sure that the threads do not get into a waiting state and must create an event loop to circle back once the responses are received from the underlying system. So let’s try to convert this architecture into a reactive paradigm and try to yield better resource utilization.

## Converting to a Reactive Architecture

The overall objective of microservice architecture in comparison to monolith is about finding better ways to create more and more isolation between the services. Isolation reduces the coupling between the services, increases stability, and provides a framework to become fault-tolerant on its own. Thus, reactive microservices are isolated based on the following terms:

- **State** - The entry-point or accessibility to the state of this kind of microservices must be through APIs. It must not provide any backdoor access through the database. This in turn allows the microservices to evolve internally without affecting the layers exposed outside.
- **Space** - Each microservice must be deployed independently without caring much about the location or the deployment of the other microservices. This in turn would allow the service to be scaled up/down to meet the scalability demand.
- **Time** - Reactive microservices must be strictly non-blocking and asynchronous throughout so that they can be eventually consistent enough.
- **Failures** - A failure occurring in one of the microservice must not impact others or cause the service to go down. It must isolate failures to remote operational despite any kind of failures. 

Keeping this in mind, let’s try to convert our existing microservice to adapt Reactive frameworks. We will primarily use *Reactive Spring Data Mongo* which provides out-of-the-box support for reactive access through MongoDB Reactive Streams. It provides `ReactiveMongoTemplate` and `ReactiveMongoRepository` interface for mapping functionality.

We will also use Spring WebFlux which provides the reactive stack web framework for Spring Boot. It brings in Reactor as its core reactive library that enables us to write non-blocking code and Reactive Streams backpressure. It also embeds `WebClient` which can be used in place of `RestTemplate` for performing non-blocking nested HTTP requests.

These are the dependencies we add to our `pom.xml`:

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-data-mongodb-reactive</artifactId>
</dependency>
```

{{% image alt="Reactive Spring Microservice" src="images/posts/spring-reactive-architecture/reactive-spring-microservice.png" %}}

### Banking Service

We will consider the same service that we had defined earlier and then we will convert the Controller implementation to emit Reactive publishers"

```java
@Slf4j
@RestController
@RequestMapping("/banking")
public class TransactionController {

  @Autowired
  private TransactionService transactionService;

  @PostMapping(value = "/process", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
  public Mono<Transaction> process(@RequestBody Transaction transaction) {
    log.info("Process transaction with details: {}", transaction);
    return transactionService.process(transaction);
  }
}
```

Next, we will update the service layer implementation to make it reactive and use `WebClient` to invoke other API calls:

```java
@Slf4j
@Service
public class TransactionService {
  private static final String USER_NOTIFICATION_SERVICE_URL = "http://localhost:8081/notify/fraudulent-transaction";
  private static final String REPORTING_SERVICE_URL = "http://localhost:8082/report/";
  private static final String ACCOUNT_MANAGER_SERVICE_URL = "http://localhost:8083/banking/process";

  @Autowired
  private TransactionRepository transactionRepo;

  @Autowired
  private UserRepository userRepo;

  @Autowired
  private WebClient webClient;

  @Transactional
  public Mono<Transaction> process(Transaction transaction) {

    return Mono.just(transaction)
        .flatMap(transactionRepo::save)
        .flatMap(t -> userRepo.findByCardId(t.getCardId())
            .map(u -> {
              log.info("User details: {}", u);
              if (t.getStatus().equals(TransactionStatus.INITIATED)) {
                // Check whether the card details are valid or not
                if (Objects.isNull(u)) {
                  t.setStatus(TransactionStatus.CARD_INVALID);
                }

                // Check whether the account is blocked or not
                else if (u.isAccountLocked()) {
                  t.setStatus(TransactionStatus.ACCOUNT_BLOCKED);
                }

                else {
                  // Check if it's a valid transaction or not. The Transaction would be considered valid
                  // if it has been requested from the same home country of the user, else will be considered
                  // as fraudulent
                  if (u.getHomeCountry().equalsIgnoreCase(t.getTransactionLocation())) {
                    t.setStatus(TransactionStatus.VALID);

                    // Call Reporting Service to report valid transaction to bank and deduct amount if funds available
                    return webClient.post()
                        .uri(REPORTING_SERVICE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(BodyInserters.fromValue(t))
                        .retrieve()
                        .bodyToMono(Transaction.class)
                        .zipWhen(t1 ->
                                // Call Account Manager service to process the transaction and send the money
                                webClient.post()
                                  .uri(ACCOUNT_MANAGER_SERVICE_URL)
                                  .contentType(MediaType.APPLICATION_JSON)
                                  .body(BodyInserters.fromValue(t))
                                  .retrieve()
                                  .bodyToMono(Transaction.class)
                                  .log(),
                                  (t1, t2) -> t2
                        )
                        .log()
                        .share()
                        .block();
                  } else {
                    t.setStatus(TransactionStatus.FRAUDULENT);

                    // Call User Notification service to notify for a fraudulent transaction
                    // attempt from the User's card
                    return webClient.post()
                        .uri(USER_NOTIFICATION_SERVICE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(BodyInserters.fromValue(t))
                        .retrieve()
                        .bodyToMono(Transaction.class)
                        .zipWhen(t1 ->
                                // Call Reporting Service to notify bank that there has been an attempt for fraudulent transaction
                                // and if this attempt exceeds 3 times then auto-block the card and account
                                webClient.post()
                                  .uri(REPORTING_SERVICE_URL)
                                  .contentType(MediaType.APPLICATION_JSON)
                                  .body(BodyInserters.fromValue(t))
                                  .retrieve()
                                  .bodyToMono(Transaction.class)
                                  .log(),
                                  (t1, t2) -> t2
                        )
                        .log()
                        .share()
                        .block();
                  }
                }
              } else {
                // For any other case, the transaction will be considered failure
                t.setStatus(TransactionStatus.FAILURE);
              }
              return t;
            }));
  }
}
```

We are using the `zipWhen()` method in `WebClient` to make sure that once we receive a response from the first API call, we pick the payload and pass it to the second API. Finally, we will consider the response of the second API as the resulting response to be returned back as response for the initial API call.

### User Notification Service

Similarly, we will make changes in the endpoint of our User Notification service:

```java
@Slf4j
@RestController
@RequestMapping("/notify")
public class UserNotificationController {

  @Autowired
  private UserNotificationService userNotificationService;

  @PostMapping("/fraudulent-transaction")
  public Mono<Transaction> notify(@RequestBody Transaction transaction) {
    log.info("Process transaction with details and notify user: {}", transaction);
    return userNotificationService.notify(transaction);
  }
}
```

We will also make corresponding changes in the service layer to leverage the reactive streams implementation:

```java
@Slf4j
@Service
public class UserNotificationService {

  @Autowired
  private TransactionRepository transactionRepo;

  @Autowired
  private UserRepository userRepo;

  @Autowired
  private JavaMailSender emailSender;

  public Mono<Transaction> notify(Transaction transaction) {
    return userRepo.findByCardId(transaction.getCardId())
        .map(u -> {
          if (transaction.getStatus().equals(TransactionStatus.FRAUDULENT)) {

            // Notify user by sending email
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@baeldung.com");
            message.setTo(u.getEmail());
            message.setSubject("Fraudulent transaction attempt from your card");
            message.setText("An attempt has been made to pay " + transaction.getStoreName()
                + " from card " + transaction.getCardId() + " in the country "
                + transaction.getTransactionLocation() + "." +
                " Please report to your bank or block your card.");
            emailSender.send(message);
            transaction.setStatus(TransactionStatus.FRAUDULENT_NOTIFY_SUCCESS);
          } else {
            transaction.setStatus(TransactionStatus.FRAUDULENT_NOTIFY_FAILURE);
          }
          return transaction;
        })
        .onErrorReturn(transaction)
        .flatMap(transactionRepo::save);
  }
}
```

### Reporting Service

We will make similar changes in Reporting service endpoints to emit reactive publishers:

```java
@Slf4j
@RestController
@RequestMapping("/report")
public class ReportingController {

  @Autowired
  private ReportingService reportingService;

  @PostMapping("/")
  public Mono<Transaction> report(@RequestBody Transaction transaction) {
    log.info("Process transaction with details in reporting service: {}", transaction);
    return reportingService.report(transaction);
  }
}
```

Similarly, we will update the service layer implementation accordingly:

```java
@Slf4j
@Service
public class ReportingService {

  @Autowired
  private TransactionRepository transactionRepo;

  @Autowired
  private UserRepository userRepo;

  public Mono<Transaction> report(Transaction transaction) {
    return userRepo.findByCardId(transaction.getCardId())
        .map(u -> {
          if (transaction.getStatus().equals(TransactionStatus.FRAUDULENT)
              || transaction.getStatus().equals(TransactionStatus.FRAUDULENT_NOTIFY_SUCCESS)
              || transaction.getStatus().equals(TransactionStatus.FRAUDULENT_NOTIFY_FAILURE)) {

            // Report the User's account and take automatic action against User's account or card
            u.setFraudulentActivityAttemptCount(u.getFraudulentActivityAttemptCount() + 1);
            u.setAccountLocked(u.getFraudulentActivityAttemptCount() > 3);
            List<Transaction> newList = new ArrayList<>();
            newList.add(transaction);
            if (Objects.isNull(u.getFraudulentTransactions()) || u.getFraudulentTransactions().isEmpty()) {
              u.setFraudulentTransactions(newList);
            } else {
              u.getFraudulentTransactions().add(transaction);
            }
          }
          log.info("User details: {}", u);
          return u;
        })
        .flatMap(userRepo::save)
        .map(u -> {
          if (!transaction.getStatus().equals(TransactionStatus.VALID)) {
            transaction.setStatus(u.isAccountLocked()
                ? TransactionStatus.ACCOUNT_BLOCKED : TransactionStatus.FAILURE);
          }
          return transaction;
        })
        .flatMap(transactionRepo::save);
  }
}
```

### Account Management Service

Finally, we will update the Account Management service endpoints.

```java
@Slf4j
@RestController
@RequestMapping("/banking")
public class AccountManagementController {

  @Autowired
  private AccountManagementService accountManagementService;

  @PostMapping("/process")
  public Mono<Transaction> manage(@RequestBody Transaction transaction) {
    log.info("Process transaction with details in account management service: {}", transaction);
    return accountManagementService.manage(transaction);
  }
}
```

Next, we will update the service layer implementation to encapsulate the business logic as per reactive design:

```java
@Slf4j
@Service
public class AccountManagementService {

  @Autowired
  private TransactionRepository transactionRepo;

  @Autowired
  private UserRepository userRepo;

  public Mono<Transaction> manage(Transaction transaction) {
    return userRepo.findByCardId(transaction.getCardId())
        .map(u -> {
          if (transaction.getStatus().equals(TransactionStatus.VALID)) {
            List<Transaction> newList = new ArrayList<>();
            newList.add(transaction);
            if (Objects.isNull(u.getValidTransactions()) || u.getValidTransactions().isEmpty()) {
              u.setValidTransactions(newList);
            } else {
              u.getValidTransactions().add(transaction);
            }
          }
          log.info("User details: {}", u);
          return u;
        })
        .flatMap(userRepo::save)
        .map(u -> {
          if (transaction.getStatus().equals(TransactionStatus.VALID)) {
            transaction.setStatus(TransactionStatus.SUCCESS);
          }
          return transaction;
        })
        .flatMap(transactionRepo::save);
  }
}
```

## Using Message-driven Communication

The basic problem we had was synchronous communication between microservices, which caused delays and didn't use the processor resource to full effect. With the conversion of simple microservices to Reactive Architecture, it had allowed us to make the microservices adapt to the Reactive paradigm, where the communication between the services is still synchronous, though, because HTTP is a synchronous protocol. This kind of orchestration between the microservices with reactive APIs is never easy to maintain. It's quite prone to error and hard to debug to figure out the root cause of the failure in multiple downstream applications.

So, the final part of this solution is to make the overall communications asynchronous and we can achieve that by adapting a *message-driven architecture*. We will use a message broker like *Apache Kafka* as a medium or a middleware to facilitate service-to-service communication asynchronously and automatically as soon as the transaction message is published.

{{% image alt="Message-driven Reactive Microservice" src="images/posts/spring-reactive-architecture/message-driven-reactive-microservice.png" %}}

We will use the *Spring Cloud Stream Kafka* library in the same Reactive microservices to easily configure the publish-subscribe module with Kafka. We can modify the existing `pom.xml` and add the following:

```xml
<dependencyManagement>
	<dependencies>
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-dependencies</artifactId>
			<version>2020.0.3</version>
			<type>pom</type>
			<scope>import</scope>
		</dependency>
	</dependencies>
</dependencyManagement>

<dependencies>
	<dependency>
		<groupId>org.springframework.cloud</groupId>
		<artifactId>spring-cloud-starter-stream-kafka</artifactId>
	</dependency>
<dependencies>    
```

Next, we need to get an instance of Apache Kafka running and create a topic to publish messages. We will create a single topic named “transactions” to produce and consume by different consumer groups and process it by each service.

To integrate with Kafka through Spring Cloud Stream we need to define the following in each microservice. First, we will define the Spring Kafka cloud configurations in `application.yml` as below:

```yaml
# Configure Spring specific properties
spring:

  # Datasource Configurations
  data:
    mongodb:
      authentication-database: admin
      uri: mongodb://localhost:27017/reactive
      database: reactive

  # Kafka Configuration
  cloud:
    function:
      definition: consumeTransaction
    stream:
      kafka:
        binder:
          brokers: localhost:9092
          autoCreateTopics: false
      bindings:
        consumeTransaction-in-0:
          consumer:
            max-attempts: 3
            back-off-initial-interval: 100
          destination: transactions
          group: account-management
          concurrency: 1
      transaction-out-0:
        destination: transactions
```

Next, we will define a Producer implementation that would help us to produce the messages using `StreamBridge`:

```java
@Slf4j
@Service
public class TransactionProducer {

  @Autowired
  private StreamBridge streamBridge;

  public void sendMessage(Transaction transaction) {
    Message<Transaction> msg = MessageBuilder.withPayload(transaction)
        .setHeader(KafkaHeaders.MESSAGE_KEY, transaction.getTransactionId().getBytes(StandardCharsets.UTF_8))
        .build();
    log.info("Transaction processed to dispatch: {}; Message dispatch successful: {}",
        msg,
        streamBridge.send("transaction-out-0", msg));
  }
}
```

Now, we will take a look into each microservice to define the consumer implementation to process the transaction records and process it asynchronously and automatically as soon as the message is published into the Kafka topic.

### Banking Service

First, we will define a simple listener (consumer) to process the new messages that are being published on the topic:

```java
@Slf4j
@Configuration
public class TransactionConsumer {

  @Bean
  public Consumer<Transaction> consumeTransaction(TransactionService transactionService) {
    return transactionService::asyncProcess;
  }
}
```

Next, we will define our service layer that would process the record, set the status message for that transaction, and produce it back again to the Kafka topic.

```java
@Slf4j
@Service
public class TransactionService {

  @Autowired
  private TransactionRepository transactionRepo;

  @Autowired
  private UserRepository userRepo;

  @Autowired
  TransactionProducer producer;

  public void asyncProcess(Transaction transaction) {
    userRepo.findByCardId(transaction.getCardId())
        .map(u -> {
          if (transaction.getStatus().equals(TransactionStatus.INITIATED)) {
            log.info("Consumed message for processing: {}", transaction);
            log.info("User details: {}", u);
            // Check whether the card details are valid or not
            if (Objects.isNull(u)) {
              transaction.setStatus(TransactionStatus.CARD_INVALID);
            }

            // Check whether the account is blocked or not
            else if (u.isAccountLocked()) {
              transaction.setStatus(TransactionStatus.ACCOUNT_BLOCKED);
            }

            else {
              // Check if it's a valid transaction or not. The Transaction would be considered valid
              // if it has been requested from the same home country of the user, else will be considered
              // as fraudulent
              if (u.getHomeCountry().equalsIgnoreCase(transaction.getTransactionLocation())) {
                transaction.setStatus(TransactionStatus.VALID);
              } else {
                transaction.setStatus(TransactionStatus.FRAUDULENT);
              }
            }
            producer.sendMessage(transaction);
          }
          return transaction;
        })
        .filter(t -> t.getStatus().equals(TransactionStatus.VALID)
            || t.getStatus().equals(TransactionStatus.FRAUDULENT)
            || t.getStatus().equals(TransactionStatus.CARD_INVALID)
            || t.getStatus().equals(TransactionStatus.ACCOUNT_BLOCKED)
        )
        .flatMap(transactionRepo::save)
        .subscribe();
  }
}
```

### User Notification Service

The listener or the consumer logic in the User Notification or any other service can be written similarly as above. We will look into the service layer implementation for this service:

```java
@Slf4j
@Service
public class UserNotificationService {

  @Autowired
  private TransactionRepository transactionRepo;

  @Autowired
  private UserRepository userRepo;

  @Autowired
  private JavaMailSender emailSender;

  @Autowired
  private TransactionProducer producer;

  public void asyncProcess(Transaction transaction) {
    userRepo.findByCardId(transaction.getCardId())
        .map(u -> {
          if (transaction.getStatus().equals(TransactionStatus.FRAUDULENT)) {

            try {
              // Notify user by sending email
              SimpleMailMessage message = new SimpleMailMessage();
              message.setFrom("noreply@baeldung.com");
              message.setTo(u.getEmail());
              message.setSubject("Fraudulent transaction attempt from your card");
              message.setText("An attempt has been made to pay " + transaction.getStoreName()
                  + " from card " + transaction.getCardId() + " in the country "
                  + transaction.getTransactionLocation() + "." +
                  " Please report to your bank or block your card.");
              emailSender.send(message);
              transaction.setStatus(TransactionStatus.FRAUDULENT_NOTIFY_SUCCESS);
            } catch (MailException e) {
              transaction.setStatus(TransactionStatus.FRAUDULENT_NOTIFY_FAILURE);
            }
          }
          return transaction;
        })
        .onErrorReturn(transaction)
        .filter(t -> t.getStatus().equals(TransactionStatus.FRAUDULENT)
            || t.getStatus().equals(TransactionStatus.FRAUDULENT_NOTIFY_SUCCESS)
            || t.getStatus().equals(TransactionStatus.FRAUDULENT_NOTIFY_FAILURE)
        )
        .map(t -> {
          producer.sendMessage(t);
          return t;
        })
        .flatMap(transactionRepo::save)
        .subscribe();
  }
}
```

### Reporting Service

Next, we will take a look into the service layer implementation for the Reporting Service:

```java
@Slf4j
@Service
public class ReportingService {

  @Autowired
  private TransactionRepository transactionRepo;

  @Autowired
  private UserRepository userRepo;

  @Autowired
  private TransactionProducer producer;

  public void asyncProcess(Transaction transaction) {
    userRepo.findByCardId(transaction.getCardId())
        .map(u -> {
          if (transaction.getStatus().equals(TransactionStatus.FRAUDULENT)
              || transaction.getStatus().equals(TransactionStatus.FRAUDULENT_NOTIFY_SUCCESS)
              || transaction.getStatus().equals(TransactionStatus.FRAUDULENT_NOTIFY_FAILURE)) {

            // Report the User's account and take automatic action against User's account or card
            u.setFraudulentActivityAttemptCount(u.getFraudulentActivityAttemptCount() + 1);
            u.setAccountLocked(u.getFraudulentActivityAttemptCount() > 3);
            List<Transaction> newList = new ArrayList<>();
            newList.add(transaction);
            if (Objects.isNull(u.getFraudulentTransactions()) || u.getFraudulentTransactions().isEmpty()) {
              u.setFraudulentTransactions(newList);
            } else {
              u.getFraudulentTransactions().add(transaction);
            }
          }
          log.info("User details: {}", u);
          return u;
        })
        .flatMap(userRepo::save)
        .map(u -> {
          if (!transaction.getStatus().equals(TransactionStatus.VALID)) {
            transaction.setStatus(u.isAccountLocked()
                ? TransactionStatus.ACCOUNT_BLOCKED : TransactionStatus.FAILURE);
            producer.sendMessage(transaction);
          }
          return transaction;
        })
        .filter(t -> t.getStatus().equals(TransactionStatus.FAILURE)
            || t.getStatus().equals(TransactionStatus.ACCOUNT_BLOCKED)
        )
        .flatMap(transactionRepo::save)
        .subscribe();
  }
}
```

### Account Management Service

Finally, we will implement the service layer implementation for the Account Management service:

```java
@Slf4j
@Service
public class AccountManagementService {

  @Autowired
  private TransactionRepository transactionRepo;

  @Autowired
  private UserRepository userRepo;

  @Autowired
  private TransactionProducer producer;

  public void asyncProcess(Transaction transaction) {
    userRepo.findByCardId(transaction.getCardId())
        .map(u -> {
          if (transaction.getStatus().equals(TransactionStatus.VALID)) {
            List<Transaction> newList = new ArrayList<>();
            newList.add(transaction);
            if (Objects.isNull(u.getValidTransactions()) || u.getValidTransactions().isEmpty()) {
              u.setValidTransactions(newList);
            } else {
              u.getValidTransactions().add(transaction);
            }
          }
          log.info("User details: {}", u);
          return u;
        })
        .flatMap(userRepo::save)
        .map(u -> {
          if (transaction.getStatus().equals(TransactionStatus.VALID)) {
            transaction.setStatus(TransactionStatus.SUCCESS);
            producer.sendMessage(transaction);
          }
          return transaction;
        })
        .filter(t -> t.getStatus().equals(TransactionStatus.VALID)
            || t.getStatus().equals(TransactionStatus.SUCCESS)
        )
        .flatMap(transactionRepo::save)
        .subscribe();
  }
}
```

These consumer implementations are sufficient enough to achieve asynchronous communications within the applications. Note that this *asynchronous choreography* has a much simpler code in comparison to the implementation that we had seen above.

### Deploying the Message-driven System

Now that we have implemented all the services, we will try to achieve containerization of the services through *Docker* and manage dependencies between them using *Docker Compose*. We can define a `Dockerfile` for each microservice and build our jars for them and bundle it in the image. A simple `Dockerfile` would look something like this:

```dockerfile
FROM openjdk:8-jdk-alpine
COPY target/banking-service-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
```

Then we can update our previously created `docker-compose.yml` with all the images. That would manage the dependencies between each microservice and orchestrate the overall communication with a single command:

```bash
docker-compose up
```

The final `docker-compose.yml` looks like below:

```yaml
version: '3'
services:
  zookeeper:
    image: wurstmeister/zookeeper
    ports:
      - "2181:2181"
  kafka:
    image: wurstmeister/kafka
    ports:
      - "9092:9092"
    environment:
      KAFKA_ADVERTISED_HOST_NAME: 10.204.106.55
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_CFG_ZOOKEEPER_CONNECT: zookeeper:2181
      ALLOW_PLAINTEXT_LISTENER: "yes"
      KAFKA_CFG_LOG_DIRS: /tmp/kafka_mounts/logs
      KAFKA_CREATE_TOPICS: "transactions:1:2"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
  kafka-ui:
    image: provectuslabs/kafka-ui
    container_name: kafka-ui
    ports:
      - "8090:8080"
    depends_on:
      - zookeeper
      - kafka
    restart: always
    environment:
      - KAFKA_CLUSTERS_0_NAME=local
      - KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS=kafka:9092
      - KAFKA_CLUSTERS_0_ZOOKEEPER=zookeeper:2181
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - ~/apps/mongo:/data/db
  banking-service:
    build: ./banking-service
    ports:
      - "8080:8080"
    depends_on:
      - zookeeper
      - kafka
      - mongodb
      - user-notification-service
      - reporting-service
      - account-management-service
  user-notification-service:
    build: ./user-notification-service
    ports:
      - "8081:8081"
    depends_on:
      - zookeeper
      - kafka
      - mongodb
  reporting-service:
    build: ./reporting-service
    ports:
      - "8082:8082"
    depends_on:
      - zookeeper
      - kafka
      - mongodb
  account-management-service:
    build: ./account-management-service
    ports:
      - "8083:8083"
    depends_on:
      - zookeeper
      - kafka
      - mongodb
```

## Evaluating the Reactive Microservice Architecture

Now since we have completed the overall architecture let’s review and evaluate what we have built until now against the *Reactive Manifesto* and its four core features. 

- *Responsive* - Once we had adapted the reactive programming paradigm into our microservices, it has helped us to achieve an end-to-end non-blocking system which in turn proved to be a pretty responsive application.
- *Resilient* - The isolation of microservices provides a good amount of resiliency against various failures in the system. More resiliency can be achieved if we can move this deployment to Kubernetes and define ReplicaSet with the desired number of pods.
- *Elastic* - Already Reactive Spring Boot services are capable enough to handle a good amount of load and performance. Moving this system to Kubernetes or a cloud-managed service can easily support elasticity against unpredictable traffic loads.
- *Message-driven* - We have added a message broker like Kafka as a middleware system to handle asynchronous communication between each service.

This brings an end to our discussion regarding the need for a Reactive Architecture. While this looks quite promising, there is still scope for improvement by replacing Docker Compose with *Kubernetes cluster and resources*. It may also be quite difficult to manage so many components and their resiliency or traffic load. Thus, a managed cloud infrastructure can also help to manage and provide the necessary guarantee for each of these services or components.

## Conclusion

In this tutorial, we took a deep dive into the basics and need for a reactive system. We gradually built a microservice organically and made it adapt to a Reactive design or programming paradigm. We also went ahead and converted that to an asynchronous and automated message-driven architecture using Kafka. Lastly, we evaluated the resultant architecture to see if it adheres to the standards of the Reactive Manifesto.

This article not only introduces us to all the tools, frameworks, or patterns which can help us to create a reactive system but also introduces us to the journey towards the *Reactive* world.

You can refer to all the source code used in the article on [Github](https://github.com/thombergs/code-examples/tree/master/spring-reactive-architecture/).