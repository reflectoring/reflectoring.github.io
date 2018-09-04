---

title: Exposing Metrics of a Spring Boot Application for Prometheus
categories: [frameworks]
modified: 2017-05-01
author: tom
tags: [spring, java, boot, monitoring, metric, metrics, prometheus, dropwizard, summary, counter]
comments: true
ads: true
sidebar:
  nav: monitoring
---

{% include sidebar_right %}

Monitoring is an important quality requirement for applications that claim to be production-ready.
In a [previous blog post](/transparency-with-spring-boot/)
I discussed how to expose metrics of your Spring Boot application with the 
help of the [Dropwizard Metrics](http://metrics.dropwizard.io/) library. This blog
post shows how to expose metrics in a format that Prometheus understands.
 
## Why Prometheus?

[Prometheus](https://prometheus.io) represents the newest generation of monitoring tools.
It contains a time-series database that promises efficient storage of monitoring 
metrics and provides a query language for sophisticated queries of those metrics.
Prometheus [promises to be better suited to modern, dynamically changing microservice
architectures](https://prometheus.io/docs/introduction/comparison/) than other monitoring tools.

An apparent drawback of Prometheus is that it does not provide a dashboard UI where you
can define several metrics you want to monitor and see their current and historical values.
Prometheus developers argue that there are tools that already do that pretty good. [Grafana](https://grafana.com/)
is such a tool that provides a datasource for Prometheus data off-the-shelf.
However, Prometheus does provide a simple UI you can use to do adhoc queries 
to your monitoring metrics.

That being said, Prometheus was on my list of tools to check out, so that's the main reason
I'm having a look at how to provide monitoring data in the correct format :).

## Prometheus Data Format

Prometheus can scrape a set of endpoints for monitoring metrics. Each server node in your 
system must provide such an endpoint that returns the node's metrics in a [text-based data format that
Prometheus understands](https://prometheus.io/docs/instrumenting/exposition_formats/). 
At the time of this writing, the current version of that format is 0.0.4. Prometheus takes
care of regularly collecting the monitoring metrics from all configured nodes and storing them
in the time-series database for later querying.

The data format looks pretty simple on first look. A simple `counter` can be expressed like this:
 
```
# HELP counter_name A human-readable help text for the metric
# TYPE counter_name counter
counter_name 42
```

On second look, however, the data format is a lot more expressive and complex. The following snippet
exposes a `summary` metric that defines the duration of certain requests in certain quantiles
(a quantile of 0.99 meaning that 99% of the requests took less that the value and the other 1% 
took more):

```
# HELP summary_metric A human-readable help text for the metric
# TYPE summary_metric summary
summary_metric{quantile="0.5",} 5.0
summary_metric{quantile="0.75",} 6.0
summary_metric{quantile="0.95",} 7.0
summary_metric{quantile="0.98",} 8.0
summary_metric{quantile="0.99",} 9.0
summary_metric{quantile="0.999",} 10.0
summary_metric_count 42
```

The key-value pairs within the parentheses are called 'labels' in Prometheus-speech. You can define
any labels you would later like to query, the label `quantile` being a special label used
for the `summary` metric type.

Further details of the Prometheus data format can be looked up at the [Prometheus website](https://prometheus.io/docs/instrumenting/exposition_formats/).

## Producing the Prometheus Data Format with Spring Boot 

If you read my [previous blog post](/transparency-with-spring-boot/), you know how to expose 
metrics in a Spring Boot application using Dropwizard metrics and the Spring Boot Actuator plugin.
The data format exposed by Spring Boot Actuator is a simple JSON format, however, that cannot
be scraped by Prometheus. Thus, we need to transform our metrics into the Prometheus format.

### Prometheus Dependencies

First off, we need to add the following dependencies to our Spring Boot application
(Gradle notation):

```
compile "io.prometheus:simpleclient_spring_boot:0.0.21"
compile "io.prometheus:simpleclient_hotspot:0.0.21"
compile "io.prometheus:simpleclient_dropwizard:0.0.21"
```

### Configuring the Prometheus Endpoint

```java
@Configuration
@EnablePrometheusEndpoint
public class PrometheusConfiguration {

  private MetricRegistry dropwizardMetricRegistry;

  @Autowired
  public PrometheusConfiguration(MetricRegistry dropwizardMetricRegistry) {
    this.dropwizardMetricRegistry = dropwizardMetricRegistry;
  }

  @PostConstruct
  public void registerPrometheusCollectors() {
    CollectorRegistry.defaultRegistry.clear();
    new StandardExports().register();
    new MemoryPoolsExports().register();
    new DropwizardExports(dropwizardMetricRegistry).register();
    ... // more metric exports
  }
}
```

The `simpleclient_spring_boot` library provides the `@EnablePrometheusEndpoint` annotation
which we add to a class that is also annotated with Spring's `@Configuration` annotation
so that it is picked up in a Spring component scan. By default, this creates an HTTP
endpoint accessible via `/prometheus` that exposes all registered metrics in the Prometheus
data format.

In a `@PostConstruct` method we register all metrics that we want to have exposed via the Prometheus
endpoint. The `StandardExports` and `MemoryPoolExports` classes are both provided by the `simpleclient_hotspot`
library and expose metrics concerning the server's memory. The `DropwizardExports` class is provided by the `simpleclient_dropwizard` library
and registers all metrics in the specified Dropwizard `MetricRegistry` object to the new
Prometheus endpoint and takes care of translating them into the correct format.

Note that the call to `CollectorRegistry.defaultRegistry.clear()` is a workaround for 
unit tests failing due to 'metric already registered' errors. This error occurs 
since `defaultRegistry` is static and the Spring context is fired up multiple times during
unit testing. I would have wished that a `CollectorRegistry` simply ignored the fact that
a metric is already registered... .

For a list of all available libraries that provide or translate metrics for Java applications,
have a look at the [GitHub repo](https://github.com/prometheus/client_java). They are not
as well documented as I would have hoped, but they mostly contain only a few classes so that
a look under the hood should help in most cases.

After firing up your application, the metrics should be available in Prometheus format
at http://localhost:8080/prometheus.
