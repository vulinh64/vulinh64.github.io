---
slug: how-to-use-aop-annotations-correctly
title: How to Use AOP Annotations Correctly
authors: [ vulinh64 ]
tags: [ java, spring boot ]
description: Don't annotate irresponsibly!
image: ./thumbnails/2026-03-13-how-to-use-aop-annotations-correctly.png
thumbnail: 2026-03-13-how-to-use-aop-annotations-correctly.png
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

So you've discovered the magical world of `@Transactional`, `@Async`, `@Cacheable`, and their friends? Wonderful. You're living in the future now.

Under the hood, Spring AOP works by wrapping your beans in **proxy objects**. Those fancy annotations only fire when a call passes through that proxy. Break the rules and Spring silently does nothing: no error, no warning, just broken behavior at 2 AM while your on-call phone buzzes and the server fans spin up to jet engine levels.

{/* truncate */}

## The Uncompromised Rules

### Must Be a Spring-Managed Bean

No bean, no proxy. No proxy, no magic. It's really that simple.

```java
// ❌ Plain instantiation -> annotation silently ignored
OrderService svc = new OrderService();
svc.processPayment();

// ✅ Spring-managed -> proxy is active, magic is real
@Autowired
OrderService svc;
```

:::warning[A blessing disguised as a curse]

If Spring Boot refuses to start because your bean isn't wired correctly, consider it a gift. It's saving you from silent production failures and very strongly worded customer emails.

:::

### Method Must Not Be `private`

Spring's proxy can only intercept ***public*** methods. As of Spring 6, `protected` and package-private join the party too, but `private` is always a dead end, no exceptions.

```java
@Transactional
private void saveOrder(Order order) { ... }  // ❌ Silently ignored. Tragic.

@Transactional
public void saveOrder(Order order) { ... }   // ✅ Happy proxy noises
```

:::tip[Magic for private methods?]

Need AOP on private methods? You'd need AspectJ compile-time or load-time weaving. Trust me, that's ugly, and not worth your effort. Just make it public.

:::

### No Self-Invocation, Seriously!

This is the classic trap. When a method calls another method **within the same class**, it's a direct `this.method()` call, and it bypasses the proxy entirely. Spring looks at you with disappointed eyes and says: **nope, no magic for you.**

<Tabs>

<TabItem value="good" label="The Better Way">

```java
@Service
@RequiredArgsConstructor
public class OrderService {

  private final OrderProcessor processor;

  public void processOrder(Order order) {
    processor.saveOrder(order); // ✅ Goes through the proxy. Peace restored.
  }
}

@Component
public class OrderProcessor {

  @Transactional
  public void saveOrder(Order order) {
    // Happy proxy noises
    orderRepository.save(order);
  }
}
```

</TabItem>

<TabItem value="bad" label="The Eww Way">

```java
@Service
public class OrderService {

  // ❌ Self-invocation trap -> @Transactional is completely ignored
  public void processOrder(Order order) {
    this.saveOrder(order); // Calling internally? No transaction!
  }

  @Transactional
  public void saveOrder(Order order) {
    // Angry database noises
    orderRepository.save(order);
  }
}
```

</TabItem>

</Tabs>

### Don't Try to Inject Yourself

Use `ApplicationContext` instead.

Self-injection (`@Autowired` on the same class) is another workaround for self-invocation, but it [breaks by default in Spring Boot 2.6+](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.6-Release-Notes#circular-references-prohibited-by-default) because circular references are disabled. Committing this gets you a startup crash and a ticket in the backlog of shame.

```java
// ❌ Circular reference -> Spring Boot 2.6+ will not tolerate this heresy
@Autowired
private OrderService self;
```

The safe workaround is resolving the proxy via `ApplicationContext`:

```java
@Service
@RequiredArgsConstructor
public class OrderService {

  private final ApplicationContext applicationContext;

  public void processOrder(Order order) {
    applicationContext.getBean(OrderService.class).saveOrder(order); // ✅
  }

  @Transactional
  public void saveOrder(Order order) {
    orderRepository.save(order);
  }
}
```

`ApplicationContext` is a framework dependency, and Spring doesn't treat it as a circular reference. Problem sidestepped, dignity preserved.

:::tip[Still want to run in circle?]

You *can* re-enable circular references via `spring.main.allow-circular-references=true`. Please don't. It's a code smell and future-you will not be happy about it.

:::

### Don't Make It `final` (CGLIB Will Cry)

When your class doesn't implement an interface, Spring uses **CGLIB** to subclass it at runtime. A `final` class or `final` method can't be subclassed or overridden. Therefore, CGLIB gives up, and so does your annotation.

```java
@Service
public final class OrderService { ... }     // ❌ CGLIB can't subclass this

@Transactional
public final void saveOrder() { ... }       // ❌ CGLIB can't override this
```

:::warning[CGLIB Annotations]

If your class implements an interface, Spring uses a **JDK dynamic proxy** instead, which is less picky about `final` on the class itself, but annotated methods still can't be `final`.

:::

### Flip the Right Switch First

Each AOP feature needs to be explicitly enabled. Spring Boot auto-configuration covers most of these, but in a custom setup you have to declare them yourself, or wonder why nothing works.

| Annotation                                 | Required Enabler                                                                                           |
|--------------------------------------------|------------------------------------------------------------------------------------------------------------|
| `@Transactional`                           | `@EnableTransactionManagement`, which should be on by default if you use auto configuration for datasource |
| `@Async`                                   | `@EnableAsync`                                                                                             |
| `@Cacheable` / `@CachePut` / `@CacheEvict` | `@EnableCaching`                                                                                           |
| `@Scheduled`                               | `@EnableScheduling`                                                                                        |
| Custom `@Aspect`                           | `@EnableAspectJAutoProxy`                                                                                  |

### Know Your Rollback Rules (`@Transactional`)

`@Transactional` only rolls back on **unchecked exceptions** and **errors** (`RuntimeException` and `Error`) by default. Checked exceptions? Silent commit. Your data is gone and the transaction is nowhere to be found.

```java
// ❌ IOException is checked, and the transaction COMMITS despite the exception
@Transactional
public void process() throws IOException { ... }

// ✅ Explicitly tell it what to roll back on
@Transactional(rollbackFor = IOException.class)
public void process() throws IOException { ... }
```

## When Everything Burns

Get any of the above wrong and the failures are **completely silent**. No exception. No warning. Your code compiles, runs, and quietly betrays you:

- **`@Transactional` ignored** → no rollback on failure, data corruption, fun incident reports.

- **`@Cacheable` ignored** → every call hammers the database; that third-party API you're calling? You're basically DDoS-ing them now.

- **`@Async` ignored** → methods run synchronously like it's 1999, threads blocked, throughput drops faster than you can say "throughput".

- **Custom AOP ignored** → security checks, audit logs, rate limiting, etc... all silently skipped, all your problem now!

Beautiful chaos. Total and utter heresy.

## This Applies to Your Custom Annotations Too

Don't think you can outsmart the proxy gods with a custom `@Aspect`. The same rules apply, no exceptions, they're always watching.

```java
@Aspect
@Component
public class AuditAspect {

  @Around("@annotation(Audited)")
  public Object audit(ProceedingJoinPoint pjp) throws Throwable {
    // This only runs if ALL the rules above are respected
    return pjp.proceed();
  }
}
```

Private method? Ignored. Self-invocation? Ignored. Not a bean? You already know.

## The Checklist (Annotate Responsibly)

Before you open a Stack Overflow tab in desperation, run through this:

<details>

* Is the object a Spring-managed bean (not created with `new`)?

* Is the method public (or at least non-private in Spring 6+)?

* Is the call coming from outside the bean, and no self-invocation?

* If working around self-invocation, using `ApplicationContext.getBean()` and not self-injection?

* Are the class and method non-final (especially with CGLIB proxies)?

* Is the required `@Enable*` annotation present?

* For `@Transactional`: does the exception type actually trigger a rollback?

</details>

Still broken after all that? Enable debug logging and let Spring confess:

```properties
logging.level.org.springframework.aop=DEBUG
logging.level.org.springframework.transaction=DEBUG
```

Now go forth and annotate responsibly.