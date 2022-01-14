---
authors: [tom]
title: "Testing Time-Based Features with Feature Flags"
categories: ["Spring Boot", "Software Craft"]
date: 2022-01-09T00:00:00 
excerpt: "Time-based featured are a pain to test. With feature flags, it gets easier!"
image: images/stock/0043-calendar-1200x628-branded.jpg
url: date-time-feature-flags
---

Time-based features in a software application are a pain to test. To test such a feature, you can (and should) write
unit tests, of course. But like most other features, you probably want to test them by running the application and see
if everything is working as expected.

To test a time-based feature, you usually want to travel into the future to check if the expected thing happens at the
expected time.

**The easiest (but most time-consuming) way to travel into the future is to wait**, of course. But having to wait is
boring and quite literally a waste of time. Sometimes, you would have to wait for days, because a certain batch job only
runs once a week, for example. That's not an option.

Another option is to **change the system date of the application server** to a date in the future. However, changing the
system date may have unexpected results. It affects the whole server, after all. Every single feature of the
application (and any supporting processes) will work with the new date. That's quite a big blast radius.

Instead, in this article, we will look at **using a feature flag to control a date**. Instead of having to wait, we can
just set the value of the feature flag to the date to which we want to travel. And instead of affecting the whole
application server, we can target a feature flag at a specific feature that we want to test. An additional benefit is
that we can test the feature in production without affecting any other users by activating the feature flag just for
us. **We can control the time for each user separately**!

In this article, we're going to use [LaunchDarkly](https://launchdarkly.com) as a feature flagging platform to implement
time-based feature flags.

{{% github "https://github.com/thombergs/code-examples/tree/master/spring-boot/feature-flags" %}}

## Use Cases

Before we go into the details of time travel with feature flags, let's look at some example use cases to make it easier
to talk about the topic.

### Showing a Welcome Message Depending on the Time of Day

The first category of time-based features is an action that is **triggered by a user**.

For example, let's say that the application has a web interface and we want to show a time-based welcome message to the
user each time they open the web interface in their browser.

In the morning, we want to show the message "Good morning", during the day we want to show "Good day", and in the
evening we want to show "Good evening".

**The user is triggering this feature by loading the web page from their browser**.

When the feature is triggered, it checks the current time and based on that decides which message to show to the user.

Other features triggered by a user action might be triggered by a click on a button in the UI, or by visiting a web page
that hasn't been visited before, or by entering a certain text into a form.

The common thing for all these features is that **they happen in the context of a specific user** and if we want to make
them time-based, we can just check the current time and decide what to do.

### Sending Emails Depending on the Registration Date

Another common category of time-based features is **scheduled actions**. These actions are not triggered by a user but
by the system at regular intervals.

Let's say we want to send a welcome email sequence to each user that registers with the application. We want to send an
email 1 day after registration, 7 days after registration, and 14 days after registration.

We have a regular job that collects all the customers that need to get an email and then sends those emails.

The difference to the user-triggered featured from above is that in a scheduled job, **we don't have a user context**.
To get the user context, we have to load the users from the database. And ideally, we would only want to load those
users from the database that should receive an email.

If we use SQL, our database query would look something like this:

```sql
select 
  * 
from 
  user 
where 
  (
    hasReceivedDay1Email = false
    and (registrationDate <= now() - interval '1 days'
  )
  or 
  (
    hasReceivedDay7Email = false
    and registrationDate <= now() - interval '7 days'
  )
  or 
  (
    hasReceivedDay14Email = false
    and registrationDate <= now() - interval '14 days'
  )
```

This only loads the users from the database that we know should receive an email. The problem with this is that **the
database now controls the time**. If we wanted to travel in time, we would have to change the time of the database,
which might have a lot of side effects.

This is easily remedied by passing the current time into the query as a parameter like this:

```sql
select 
  * 
from 
  user 
where 
  (
    hasReceivedDay1Email = false
    and (registrationDate <= :now - interval '1 days'
  )
  ...
```

However, this still means that **the database makes the decision to include a user in the result or not**. The
parameter `:now` that we pass into the query is used for *all* users.

We would like to control time *for each user separately*, though. Only then can we test time-based featured in
production using a feature flag without affecting other users.

So, we remove the time constraint from the database query so that we can make the time-based decision in our application
code:

```sql
select 
  * 
from 
  user 
where 
  hasReceivedDay1Email = false
  or hasReceivedDay7Email = false
  or hasReceivedDay14Email = false
```

This will return all users who haven't received an email, yet. In the application code, we go through the list of users
and can now compare each user against a time. And **if we use a feature flag to control time, we can control time for
each user separately**.

This workaround is not applicable in every circumstance, however. Sometimes, we can't just load all the data from the
database and then make decisions in our code because there is too much data to go through. In those cases, we have to
test the old-fashioned way by waiting until the time comes. For the remainder of this article, we assume that for our
use case, it's acceptable to load more data than we need and make the time-based decision in the application code
instead of in the database.

## Implementing a Time-Based Feature Flag

To implement the time-based feature flag, we're going to build a `FeatureFlagService` based
on [LaunchDarkly](https://launchdarkly.com), a managed feature flag platform (you can get a more detailed introduction
to LaunchDarkly in [my article about LaunchDarkly and Togglz](/java-feature-flags/)).

First, we create an interface that returns the values for the two feature flags we need:

```java
public interface FeatureFlagService {

    /**
     * Returns the current time to be used by the welcome message feature. 
     */
    Optional<LocalDateTime> currentDateForWelcomeMessage();

    /**
     * Returns the current time to be used by the welcome email feature. 
     */
    Optional<LocalDateTime> currentDateForWelcomeEmails();

}
```

The method `currentDateForWelcomeMessage()` shall return the current date that we want to use for our "welcome message"
feature and the method `currentDateForWelcomeEmails()` shall return the current date that we want to use for our "
sending emails" feature.

This interface already hints at the power of this solution: each feature can have its own time!

Both methods return an `Optional<LocalDateTime>` which can have these values:

- **An empty `Optional`** means that we haven't set a date for this feature flag. We can use this state to mark the
  feature as "toggled off". If there is no date, we're not going to show the welcome message and not going to send an
  email at all. We can use this state to "dark launch" new features in a disabled state, and then enable them for
  progressively bigger user segments over time.
- **An `Optional` containing a `LocalDateTime`** means that we have set a date for this feature flag, and we can use it
  to determine the time of day for our welcome message or the number of days since registration for our email feature.

Let's look an implementation of the `FeatureFlagService` using [LaunchDarkly](https://launchdarkly.com):

```java

@Component
public class LaunchDarklyFeatureFlagService implements FeatureFlagService {

    private final Logger logger = LoggerFactory.getLogger(LaunchDarklyFeatureFlagService.class);
    private final LDClient launchdarklyClient;
    private final UserSession userSession;
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    public LaunchDarklyFeatureFlagService(LDClient launchdarklyClient, UserSession userSession) {
        this.launchdarklyClient = launchdarklyClient;
        this.userSession = userSession;
    }


    @Override
    public Optional<LocalDateTime> currentDateForWelcomeMessage() {
        String stringValue = launchdarklyClient.stringVariation("now-for-welcome-message", getLaunchdarklyUserFromSession(), "false");

        if ("false".equals(stringValue)) {
            return Optional.empty();
        }

        if ("now".equals(stringValue)) {
            return Optional.of(LocalDateTime.now());
        }

        try {
            return Optional.of(LocalDateTime.parse(stringValue, dateFormatter));
        } catch (DateTimeParseException e) {
            logger.warn("could not parse date ... falling back to current date", e);
            return Optional.of(LocalDateTime.now());
        }
    }

    @Override
    public Optional<LocalDateTime> currentDateForWelcomeEmails() {
        // ... similar implementation
    }

    private LDUser getLaunchdarklyUserFromSession() {
        return new LDUser.Builder(userSession.getUsername())
                .build();
    }
}
```

We're using [LaunchDarkly's Java SDK](https://docs.launchdarkly.com/sdk/server-side/java), more specifically the
classes `LDClient` and `LDUser`, to interact with the LaunchDarkly server.

To get the value of a feature flag, we call the `stringVariation()` method of the LaunchDarkly client and then transform that
into a date. LaunchDarkly doesn't support date types out of the box, so we use a string value instead.

If the string value is `false`, we interpret the feature as "toggled off" and return an empty `Optional`.

If the string value is `now`, it means that we haven't set a specific date for a given user and that user just gets the current date and time - the "normal" behavior.

If the string value is a valid ISO date, we parse it to a date and time and return that.

Another aspect of the power of this solution becomes visible with the code above: **the feature flags can have different
values for different users**!

In the code, we're getting the name of the current user from a `UserSession` object, putting that into an `LDUser` object,
and then passing it into the `LDClient` when the feature flag is evaluated. In the LaunchDarkly UI, we can then select
different feature flag values for different users:

{{% image src="images/posts/date-time-feature-flags/launchdarkly.png" alt="Configuring feature flags in the LaunchDarkly UI." %}}

Here we have activated the feature flag for the users `ben`, `hugo`, and `tom`. `hugo` and `ben` will get the real date
and time when the feature flag is evaluated, and only `tom` will get a specified time in the future (at the time of
writing). All other users will get `false` as a value, meaning that they shouldn't see the feature at all.

## Using the Time-Based Feature Flags

Now that we have built a `FeatureFlagService` that returns time-based feature flags for us, let's see how we can use
them in action.

### Showing a Welcome Message

The time-based welcome message we could implement something like this:

```java

@Controller
public class DateFeatureFlagController {

    private final UserSession userSession;
    private final FeatureFlagService featureFlagService;

    DateFeatureFlagController(UserSession userSession, FeatureFlagService featureFlagService) {
        this.userSession = userSession;
        this.featureFlagService = featureFlagService;
    }

    @GetMapping(path = {"/welcome"})
    ModelAndView welcome() {

        Optional<LocalDateTime> date = featureFlagService.currentDateForWelcomeMessage();

        if (date.isEmpty()) {
            return new ModelAndView("/welcome-page-without-message.html");
        }

        LocalTime time = date.get().toLocalTime();
        String welcomeMessage = "";

        if (time.isBefore(LocalTime.NOON)) {
            welcomeMessage = "Good Morning!";
        } else if (time.isBefore(LocalTime.of(17, 0))) {
            welcomeMessage = "Good Day!";
        } else {
            welcomeMessage = "Good Evening!";
        }

        return new ModelAndView("/welcome-page.html", Map.of("welcomeMessage", welcomeMessage));
    }

}
```

The controller serves a welcome page under the path `/welcome`. From `FeatureFlagService.currentDateForWelcomeMessage()`
, we get the date that we have set for the current user in the LaunchDarkly UI.

If the date is empty, we show the page `welcome-page-without-message.html`, which doesn't contain the welcome message
feature at all.

If the date is not empty, we set the `welcomeMessage` property to a value depending on the time of day, and then pass it
into the `welcome-page.html` template, which displays the welcome message to the user.

### Sending a Scheduled Email

Sending a welcome email is triggered by a scheduled task and not by a user action, so we approach the problem a little
differently:

```java

@Component
public class EmailSender {

    private final Logger logger = LoggerFactory.getLogger(EmailSender.class);
    private final FeatureFlagService featureFlagService;

    public EmailSender(FeatureFlagService featureFlagService, UserSession userSession) {
        this.featureFlagService = featureFlagService;
    }

    @Scheduled(fixedDelay = 10000)
    public void sendWelcomeEmails() {
        for (User user : getUsers()) {
            Optional<LocalDateTime> now = featureFlagService.currentDateForWelcomeEmails(user.name);
            if (now.isEmpty()) {
                logger.info("not sending email to user {}", user.name);
                continue;
            }
            if (user.registrationDate.isBefore(now.get().minusDays(14L).toLocalDate())) {
                sendEmail(user, "Welcome email after 14 days");
            } else if (user.registrationDate.isBefore(now.get().minusDays(7L).toLocalDate())) {
                sendEmail(user, "Welcome email after 7 days");
            } else if (user.registrationDate.isBefore(now.get().minusDays(1L).toLocalDate())) {
                sendEmail(user, "Welcome email after 1 day");
            }
        }
    }
}
```

We have a scheduled method `sendWelcomeEmails()` that runs every 10 seconds in our example code. In it, we iterate
through all users in the database so that we can check the value of the feature flag for each user.

With `currentDateForWelcomeEmails()` we get the value of the feature flag for the user. Note that we overloaded the
method here so that we can pass the user name into it because we don't have a `UserSession` to get the name from like in the
welcome message use case above. That means that the feature flag service can't get the user name from the session and we have to pass it in specifically. If we don't pass in the name, LaunchDarkly won't know which user to evaluate the feature
flag for.

If the feature flag is empty, we don't send an email at all - the feature is disabled.

If the feature flag has a value, we compare it with the user's registration date to send the appropriate welcome email.
Note that there should be some logic to avoid sending duplicate emails, but I skipped it for the sake of simplicity.

The drawback for feature flag evaluations from a scheduled task is that we have to iterate through all users to evaluate
the feature flag for each of them, as discussed [above](#sending-emails-depending-on-the-registration-date).

## Conclusion

Without a way to "travel through time", testing time-based feature is a pain. Feature flags provide such a way to travel
through time. Even better, **feature flags provide a way for each user to travel to a different point in time**.

If we use a feature flag with three possible values (off, now, specific date), we can use the same feature flag for
toggling the whole feature on or off and controlling the date for each user separately.

This allows us to test time-based features even in production.
