---

title: Monitoring the Error Rate of a Spring Boot Web Application
categories: [frameworks]
modified: 2017-05-07
author: tom
tags: [spring, java, boot, monitoring, error, rate, metric, metrics, dropwizard, exception, counter, mvc]
comments: true
ads: true
sidebar:
  nav: monitoring
---

In my previous blog posts about [creating monitoring metrics with Dropwizard Metrics](/transparency-with-spring-boot/) and 
[exposing them for the Prometheus monitoring application](/monitoring-spring-boot-with-prometheus/) we already have
gained a little insight into why monitoring is important and how to implement it.

However, we have not looked into monitoring specific and meaningful metrics yet. For one such metric, the error rate,
I would like to go into a little detail in this blog post. The error rate is important for any kind of
application that processes requests of some sort. Some applications, like GitHub, even publicly display
their error rate to show that they are able to handle the load created by the users (have a look at the 'Exception Percentage' 
on their [status page](https://status.github.com/)).

The error rate is a good indicator for the health of a system since the occurrence of errors most certainly 
indicates something is wrong. But what exactly is the definition of 
error rate and how can we measure it in a Spring Boot application?

## Definitions of "Error Rate"

For the definition of our application's error rate we can borrow from Wikipedia's definition
of [bit error rate](https://en.wikipedia.org/wiki/Bit_error_rate): 

> The bit error rate (BER) is the number of bit errors per time unit.

Although our application sends and receives bits, the bit error rate is a little too low-level
for us. Transferring that definition to the application level however, we come up with something
like this:

> The application error rate is the number of requests that result in an error per time unit.

It may also be interesting to measure errors in percentage instead of time units, so for the sake of this blog post,
we add another definition:

> The application error percentage is the number of requests that result in an error compared
> to the total number of requests.

For our Spring Boot application "resulting in an error" means that some kind of internal error was caused that prevented
the request from being processed successfully (i.e. HTTP status 5xx). 

## Counting Errors

Using Spring MVC, counting errors in an application is as easy as creating a central exception handler using
the `@ControllerAdvice` annotation:

```java
@ControllerAdvice
public class ControllerExceptionHandler {

  private MetricRegistry metricRegistry;

  @Autowired
  public ControllerExceptionHandler(MetricRegistry metricRegistry){
    this.metricRegistry = metricRegistry;
  }
  
  @ResponseStatus(value = HttpStatus.INTERNAL_SERVER_ERROR)
  @ExceptionHandler(Exception.class)
  @ResponseBody
  public String handleInternalError(Exception e) {
    countHttpStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    logger.error("Returned HTTP Status 500 due to the following exception:", e);
    return "Internal Server Error";
  }
  
  private void countHttpStatus(HttpStatus status){
    Meter meter = metricRegistry.meter(String.format("http.status.%d", status.value()));
    meter.mark();
  }
  
}
```

In this example, we're catching all Exceptions that are not caught by any other exception handler
and increment a Dropwizard meter called `http.status.500` (refer to my [previous blog post](/transparency-with-spring-boot/)
to learn how to use Dropwizard Metrics).

## Counting Total Requests

In order to calculate the error percentage, we also want to count
the total number of HTTP requests processed by our application. One way to do this is by implementing
a `WebMvcConfigurerAdapter` and registering it within our `ApplicationContext` like this:

```java
@Configuration
public class RequestCountMonitoringConfiguration extends WebMvcConfigurerAdapter {

  private Meter requestMeter;

  @Autowired
  public RequestCountMonitoringConfiguration(MetricRegistry metricRegistry) {
    this.requestMeter = metricRegistry.meter("http.requests");
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(new HandlerInterceptorAdapter() {
      @Override
      public void afterCompletion(HttpServletRequest request,
          HttpServletResponse response, Object handler, Exception ex)
          throws Exception {
        requestMeter.mark();
      }
    });
  }
}
```

This will intercept all incoming requests and increment a `Meter` called `http.requests` after the
request has been processed, regardless of an exception being thrown or not.

## Monitoring the Error Rate with Prometheus

If we translate the Dropwizard metrics into the Prometheus data format (see my [previous blog post](/monitoring-spring-boot-with-prometheus/)),
we will see the following metrics when typing "/prometheus" into the browser:

```
http_requests_total 13.0
http_status_500_total 4.0
```

Now, we have a prometheus metric called `http_status_500_total` that counts unexpected errors within our application
and a metric called `http_requests_total` that counts the total number of processed requests. 

### Setting up Prometheus
Once Prometheus is setup we can play around with these metrics using Prometheus' querying language. 

To set up Prometheus, simply install it and edit the file `prometheus.yml` to add your application's 
url to `targets` and add `metrics_path: '/prometheus'` if your application's prometheus metrics are 
exposed via the `/prometheus` endpoint. Once started, you can access the Prometheus web interface
via `localhost:9090` by default.

### Querying Metrics in Prometheus' Web Interface
In the web interface, you can now provide a query and press the "execute" button to show a graph of
the metrics you queried.

To get the average rate of errors per second within the last minute, we can use the `rate()` function like this:

```
rate(http_status_500_total [1m])
```

Likewise we can query the average rate of total requests per second:

```
rate(http_http_requests_total [1m])
```

And finally, we can relate both metrics by calculating the percentage of erroneously processed requests 
within the last minute

```
rate(http_status_500_total [1m]) / rate(http_requests_total [1m])
```

The result of the last query looked something like this in the Prometheus web interface, once I manually
created some successful requests and some errors:

![Error Percentage]({{ base }}/assets/images/posts/error_percentage.png)

## Wrap-Up

By simply counting all requests and counting those requests that return an HTTP status 500 
(internal server error) and exposing those counters via Dropwizard Metrics we can set up a monitoring
with Prometheus that alerts us when the application starts creating errors for some reason.
Though pretty easy to calculate, the error rate is a very meaningful indicator of our application's health at
any time and should be present in every monitoring setup.  

 
