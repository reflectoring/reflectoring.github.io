---
title: Hexagonal Architecture with Java and Spring
categories: [java, craft]
date: 2019-11-03 10:00:00 +1100
modified: 2019-11-03
excerpt: "The term "Hexagonal Architecture" has been around for a long time. But would you know how to implement this architecture style in actual code? This article provides such a way."
image:
  auto: 0054-bee
tags: ["architecture", "hexagonal"]
---

The term "Hexagonal Architecture" has been around for a long time. Long enough that the [primary source](https://alistair.cockburn.us/hexagonal-architecture/) on this topic has been offline for a while and has only recently been rescued from the archives. 

I found, however, that there are very few resources about how to actually implement an application in this architecture style. The goal of this article is to provide an opinionated way of implementing a web application in the hexagonal style with Java and Spring. 

If you'd like to dive deeper into the topic, have a look at my [book](/book/).

{% include github-project.html url="https://github.com/thombergs/buckpal" %}

## What is "Hexagonal Architecture"?

The main feature of "Hexagonal Architecture", as opposed to the common layered architecture style, is that the dependencies between our components point "inward", towards our domain objects: 

![Hexagonal Architecture](/assets/img/posts/spring-hexagonal/hexagonal-architecture.png)

The hexagon is just a fancy way to describe the core of the application that is made up of domain objects, use cases that operate on them, and input and output ports that provide an interface to the outside world.

Let's have a look at each of the stereotypes in this architecture style.

### Domain Objects

In a domain rich with business rules, domain objects are the lifeblood of an application. Domain objects can contain both state and behavior. The closer the behavior is to the state, the easier the code will be to understand, reason about, and maintain. 

Domain objects don't have any outward dependency. They're pure Java and provide an API for use cases to operate on them.

Because domain objects have no dependencies on other layers of the application, changes in other layers don't affect them. They can evolve free of dependencies. This is a prime example of the Single Responsibility Principle (the "S" in "SOLID"), which states that components should have only one reason to change. For our domain object, this reason is a change in business requirements.

Having a single responsibility lets us evolve our domain objects without having to take external dependencies in regard. This evolvability makes the hexagonal architecture style perfect for when you're practicing Domain-Driven Design. While developing, we just follow the natural flow of dependencies: we start coding in the domain objects and go outward from there. If that's not Domain-Driven, then I don't know what is.

### Use Cases

We know use cases as abstract descriptions of what users are doing with our software. In the hexagonal architecture style, it makes sense to promote use cases to first-class citizens of our codebase. 

A use case in this sense is a class that handles everything around, well, a certain use case. As an example let's consider the use case "Send money from one account to another" in a banking application. We'd create a class `SendMoneyUseCase` with a distinct API that allows a user to transfer money. The code contains all the business rule validations and logic that are specific to the use case and thus cannot be implemented within the domain objects. Everything else is delegated to the domain objects (there might be a domain object `Account`, for instance).

Similar to the domain objects, a use case class has no dependency on outward components. When it needs something from outside of the hexagon, we create an output port.

### Input and Output Ports

The domain objects and use cases are within the hexagon, i.e. within the core of the application. Every communication to and from the outside happens through dedicated "ports".

An input port is a simple interface that can be called by outward components and that is implemented by a use case. The component calling such an input port is called an input adapter or "driving" adapter.

An output port is again a simple interface that can be called by our use cases if they need something from the outside (database access, for instance). This interface is designed to fit the needs of the use cases, but it's implemented by an outside component called an output or "driven" adapter. If you're familiar with the SOLID principles, this is an application of the Dependency Inversion Principle (the "D" in SOLID), because we're inverting the dependency from the use cases to the output adapter using an interface.

With input and output ports in place, we have very distinct places where data enters and leaves our system, making it easy to reason about the architecture. 

### Adapters

The adapters form the outer layer of the hexagonal architecture. They are not part of the core but interact with it.

Input adapters or "driving" adapters call the input ports to get something done. An input adapter could be a web interface, for instance. When a user clicks a button in a browser, the web adapter calls a certain input port to call the corresponding use case. 

Output adapters or "driven" adapters are called by our use cases and might, for instance, provide data from a database. An output adapter implements a set of output port interfaces. Note that the interfaces are dictated by the use cases and not the other way around.

The adapters make it easy to exchange a certain layer of the application. If the application should be usable from a fat client additionally to the web, we add a fat client input adapter. If the application needs a different database, we add a new persistence adapter implementing the same output port interfaces as the old one.

## Show Me Some Code!

After the brief introduction to the hexagonal architecture style above, let's finally have a look at some code. Translating the concepts of an architecture style into code is always subject to interpretation and flavor, so please don't take the following code examples as given, but instead as inspiration to creating your own style.

The code examples are all from my "BuckPal" example application [on GitHub](https://github.com/thombergs/buckpal) and revolve around the use case of transferring money from one account to another. Some code snippets are slightly modified for the purpose of this blog post, so have a look at the repo for the original code.

### Building a Domain Object

We start by building a domain object that serves our use case. We create an `Account` class that manages withdrawals and deposits to an account:

```java
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Account {

  @Getter private final AccountId id;

  @Getter private final Money baselineBalance;

  @Getter private final ActivityWindow activityWindow;

  public static Account account(
          AccountId accountId,
          Money baselineBalance,
          ActivityWindow activityWindow) {
    return new Account(accountId, baselineBalance, activityWindow);
  }

  public Optional<AccountId> getId(){
    return Optional.ofNullable(this.id);
  }

  public Money calculateBalance() {
    return Money.add(
        this.baselineBalance,
        this.activityWindow.calculateBalance(this.id));
  }

  public boolean withdraw(Money money, AccountId targetAccountId) {

    if (!mayWithdraw(money)) {
      return false;
    }

    Activity withdrawal = new Activity(
        this.id,
        this.id,
        targetAccountId,
        LocalDateTime.now(),
        money);
    this.activityWindow.addActivity(withdrawal);
    return true;
  }

  private boolean mayWithdraw(Money money) {
    return Money.add(
        this.calculateBalance(),
        money.negate())
        .isPositiveOrZero();
  }

  public boolean deposit(Money money, AccountId sourceAccountId) {
    Activity deposit = new Activity(
        this.id,
        sourceAccountId,
        this.id,
        LocalDateTime.now(),
        money);
    this.activityWindow.addActivity(deposit);
    return true;
  }

  @Value
  public static class AccountId {
    private Long value;
  }

}
```

An `Account` can have many associated `Activity`s that each represents a withdrawal or a deposit to that account. Since we don't always want to load *all* activities for a given account, we limit it to a certain `ActivityWindow`. To still be able to calculate the total balance of the account, the `Account` class has the `baselineBalance` attribute containing the balance of the account at the start time of the activity window.

As you can see in the code above, we build our domain objects completely free of external dependencies. We're free to model the code how we see fit, in this case creating a "rich" behavior that is very close to the state of the model to make it easier to understand.

The `Account` class now allows us to withdraw and deposit money to a single account, but we want to transfer money between two accounts. So, we create a use case class that orchestrates this for us.  

### Building an Input Port

Before we actually implement the use case, however, we create the external API to that use case, which will become an input port in our hexagonal architecture:

```java
public interface SendMoneyUseCase {

  boolean sendMoney(SendMoneyCommand command);

  @Value
  @EqualsAndHashCode(callSuper = false)
  class SendMoneyCommand extends SelfValidating<SendMoneyCommand> {

    @NotNull
    private final AccountId sourceAccountId;

    @NotNull
    private final AccountId targetAccountId;

    @NotNull
    private final Money money;

    public SendMoneyCommand(
        AccountId sourceAccountId,
        AccountId targetAccountId,
        Money money) {
      this.sourceAccountId = sourceAccountId;
      this.targetAccountId = targetAccountId;
      this.money = money;
      this.validateSelf();
    }
  }

}
```

By calling `sendMoney()`, an adapter outside of our application core can now invoke this use case.

We aggregated all the parameters we need into the `SendMoneyCommand` value object. This allows us to do the input validation in the constructor of the value object. In the example above we even used the Bean Validation annotation `@NotNull`, which is validated in the `validateSelf()` method. This way the actual use case code is not polluted with noisy validation code.

Now we need an implementation of this interface.

### Building a Use Case and Output Ports

In the use case implementation we use our domain model to make a withdrawal from the source account and a deposit to the target account:

```java
@RequiredArgsConstructor
@Component
@Transactional
public class SendMoneyService implements SendMoneyUseCase {

  private final LoadAccountPort loadAccountPort;
  private final AccountLock accountLock;
  private final UpdateAccountStatePort updateAccountStatePort;

  @Override
  public boolean sendMoney(SendMoneyCommand command) {

    LocalDateTime baselineDate = LocalDateTime.now().minusDays(10);

    Account sourceAccount = loadAccountPort.loadAccount(
        command.getSourceAccountId(),
        baselineDate);

    Account targetAccount = loadAccountPort.loadAccount(
        command.getTargetAccountId(),
        baselineDate);

    accountLock.lockAccount(sourceAccountId);
    if (!sourceAccount.withdraw(command.getMoney(), targetAccountId)) {
      accountLock.releaseAccount(sourceAccountId);
      return false;
    }

    accountLock.lockAccount(targetAccountId);
    if (!targetAccount.deposit(command.getMoney(), sourceAccountId)) {
      accountLock.releaseAccount(sourceAccountId);
      accountLock.releaseAccount(targetAccountId);
      return false;
    }

    updateAccountStatePort.updateActivities(sourceAccount);
    updateAccountStatePort.updateActivities(targetAccount);

    accountLock.releaseAccount(sourceAccountId);
    accountLock.releaseAccount(targetAccountId);
    return true;
  }

}
```

Basically, the use case implementation loads the source and target account from the database, locks the accounts so that no other transactions can take place at the same time, makes the withdrawal and deposit, and finally writes the new state of the accounts back to the database.

Also, by using `@Component`, we make this service a Spring bean to be injected into any components that need access to the `SendMoneyUseCase` input port without having a dependency on the actual implementation.

For loading and storing the accounts from and to the database, the implementation depends on the output ports `LoadAccountPort` and `UpdateAccountStatePort`, which are interfaces that we will later implement within our persistence adapter. 

The shape of the output port interfaces is dictated by the use case. While writing the use case we may find that we need to load certain data from the database, so we create an output port interface for it. Those ports may be re-used in other use cases, of course. In our case, the output ports look like this:

```java
public interface LoadAccountPort {

  Account loadAccount(AccountId accountId, LocalDateTime baselineDate);

}
```

```java
public interface UpdateAccountStatePort {

  void updateActivities(Account account);

}
```

### Building a Web Adapter

With the domain model, use cases, and input and output ports, we have now completed the core of our application (i.e. everything within the hexagon). This core doesn't help us, though, if we don't connect it with the outside world. Hence, we build an adapter that exposes our application core via a REST API:

```java
@RestController
@RequiredArgsConstructor
public class SendMoneyController {

  private final SendMoneyUseCase sendMoneyUseCase;

  @PostMapping(path = "/accounts/send/{sourceAccountId}/{targetAccountId}/{amount}")
  void sendMoney(
      @PathVariable("sourceAccountId") Long sourceAccountId,
      @PathVariable("targetAccountId") Long targetAccountId,
      @PathVariable("amount") Long amount) {

    SendMoneyCommand command = new SendMoneyCommand(
        new AccountId(sourceAccountId),
        new AccountId(targetAccountId),
        Money.of(amount));

    sendMoneyUseCase.sendMoney(command);
  }

}
```

If you're familiar with Spring MVC, you'll find that this is a pretty boring web controller. It simply reads the needed parameters from the request path, puts them into a `SendMoneyCommand` and invokes the use case. In a more complex scenario, the web controller may also check authentication and authorization and do more sophisticated mapping of JSON input, for example.

The above controller exposes our use case to the world by mapping HTTP requests to the use case's input port. Let's now see how we can connect our application to a database by connecting the output ports.

### Building a Persistence Adapter

While an input port is implemented by a use case service, an output port is implemented by a persistence adapter. Say we use Spring Data JPA as the tool of choice for managing persistence in our codebase. A persistence adapter implementing the output ports `LoadAccountPort` and `UpdateAccountStatePort` might then look like this:

```java
@RequiredArgsConstructor
@Component
class AccountPersistenceAdapter implements
    LoadAccountPort,
    UpdateAccountStatePort {

  private final AccountRepository accountRepository;
  private final ActivityRepository activityRepository;
  private final AccountMapper accountMapper;

  @Override
  public Account loadAccount(
          AccountId accountId,
          LocalDateTime baselineDate) {

    AccountJpaEntity account =
        accountRepository.findById(accountId.getValue())
            .orElseThrow(EntityNotFoundException::new);

    List<ActivityJpaEntity> activities =
        activityRepository.findByOwnerSince(
            accountId.getValue(),
            baselineDate);

    Long withdrawalBalance = orZero(activityRepository
        .getWithdrawalBalanceUntil(
            accountId.getValue(),
            baselineDate));

    Long depositBalance = orZero(activityRepository
        .getDepositBalanceUntil(
            accountId.getValue(),
            baselineDate));

    return accountMapper.mapToDomainEntity(
        account,
        activities,
        withdrawalBalance,
        depositBalance);

  }

  private Long orZero(Long value){
    return value == null ? 0L : value;
  }

  @Override
  public void updateActivities(Account account) {
    for (Activity activity : account.getActivityWindow().getActivities()) {
      if (activity.getId() == null) {
        activityRepository.save(accountMapper.mapToJpaEntity(activity));
      }
    }
  }

}
```

The adapter implements the `loadAccount()` and `updateActivities()` methods required by the implemented output ports. It uses Spring Data repositories to load data from and save data to the database and an `AccountMapper` to map `Account` domain objects into `AccountJpaEntity` objects which represent an account within the database.

Again, we use `@Component` to make this a Spring bean that can be injected into the use case service above. 

## Is it Worth the Effort?

People often ask themselves whether an architecture like this is worth the effort (I include myself here). After all, we have to create port interfaces and we have x to map between multiple representations of the domain model. There may be a domain model representation within the web adapter and another one within the persistence adapter.

So, is it [worth the effort](https://martinfowler.com/articles/is-quality-worth-cost.html)?

As a professional consultant my answer is of course "it depends". 

If we're building a CRUD application that simply stores and saves data, an architecture like this is probably overhead. If we're building an application with rich business rules that can be expressed in a rich domain model that combines state with behavior, then this architecture really shines because it puts the domain model in the center of things. 

## Dive Deeper

The above only gives an idea of what a hexagonal architecture might look like in real code. There are other ways of doing it, so feel free to experiment and find the way that best fits your needs. Also, the web and persistence adapters are just examples of adapters to the outside. There may be adapters to other third party systems or other user-facing frontends.

If you want to dive deeper into this topic, have a look at my [book](/book/) which goes into much more detail and also discusses things like testing, mapping strategies, and shortcuts.