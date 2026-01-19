---
slug: spring-boot-tips-and-tricks
title: Spring Boot's Coding Tips and Tricks
authors: [vulinh64]
tags: [java, spring boot]
description: Don't shoot yourself in the foot (or your teammates) in Spring Boot!
thumbnail: 2025-09-07-spring-boot-tips-and-tricks.png
image: ./thumbnails/2025-09-07-spring-boot-tips-and-tricks.png
---

Wanna have fun with Spring Boot? Check those tips and tricks out!

For more dedicated coding tips and tricks in general, see [this article](2025-08-22-java-coding-tips-and-tricks.md).

<!-- truncate -->

## Use Java Records for Configuration Properties

~~Because Life's Too Short for Boilerplate~~

If you're lucky enough to be running Spring Boot 3+ (which demands Java 17+ like a bouncer at an exclusive club), then it's time to embrace the sheer elegance of [Java Records](2025-08-01-java-road-to-21.md#java-records)!

### Step 1: Define Your `application.yaml` File

`.yaml` or `.yml` is the future, and `.properties` files belong in a museum next to floppy disks:

```yaml
application-properties:
  s3-bucket-name: 'my-s3-bucket'
  sqs-topics:
    - 'my-topic-1'
    - 'my-topic-2'
  no-privilege-method-urls:
    - { method: DELETE, url: '/auth/logout/**' }
    - { method: POST, url: '/auth/login/**' }
  security:
    jwt-expiration-time: 15m
    password-reset-code-duration: 1d
```

### Step 2: Create Your Record (The Magic Happens Here)

```java
@ConfigurationProperties(prefix = "application-properties")
public record ApplicationProperties(
    String s3BucketName,
    List<String> sqsTopics,
    List<MethodUrl> noPrivilegeMethodUrls,
    Security security) {

  // Implicitly static - no need to spam "static" everywhere like it's 2005
  public record MethodUrl(org.springframework.http.HttpMethod method, String url) {}

  // Another implicitly static nested record, because we're fancy like that
  public record Security(Duration jwtExpirationTime, Duration passwordResetCodeDuration) {}
}
```

**Binding Magic Explained** (for the curious minds):

<details>

Spring Boot is surprisingly smart about this stuff:

* Write your YAML in `kebab-case` (the-cool-way), code your record fields in `camelCase` (theCoolWay). Spring Boot handles the translation like a diplomatic genius.

* `s3-bucket-name` is just text, so it becomes a `String`. Easy peasy.

* `sqs-topics` is a list of strings, so we use `List<String>`. You could also use `Collection<String>` or `Set<String>` if you're feeling adventurous.

* `no-privilege-method-urls` is where things get spicy - it's a list of objects with `method` (an enum) and `url` (a string) fields. We create a custom `List<MethodUrl>` where `MethodUrl` is our inner record. Nested records are like Russian dolls, but useful.

* `security` is a parent property with two child properties, so we create a `Security` record with `Duration jwtExpirationTime` and `Duration passwordResetCodeDuration`.

    * **Bonus points**: Spring Boot automatically converts human-readable time strings (`2m`, `3d`, `4h30m`) into proper `Duration` objects. It's like having a personal assistant for your time conversions!

</details>

### Step 3: Register with the Main Class (The Grand Finale)

Just slap an `@EnableConfigurationProperties` on your main class like this and call it a day:

```java
@SpringBootApplication
@EnableConfigurationProperties(ApplicationProperties.class)
public class MySpringBootApplication {

  public static void main(String[] args) {
    SpringApplication.run(MySpringBootApplication.class, args);
  }
}
```

:::warning[When You Can Use This Feature]

You can actually use Java Records to be your configuration properties since Spring Boot 2.6, but some projects will still be using JDK 8 or JDK 11, and thus, Java Records are not available to them.

:::

Want the full tutorial with all the bells and whistles? Check out this excellent [Baeldung article](https://www.baeldung.com/configuration-properties-in-spring-boot) where they explain everything with the patience of a saint.

## Prefer Constructor Injection Over Setter or Field Injection

This advice appears in many blog posts, so I'll keep it brief: use constructor injection everywhere. If your class has more than 255 dependencies (the hard limit number of parameters a method can have before Java refuses to compile), consider whether your class violates the Single Responsibility Principle, or reconsider your career choices.

One thing I'd like to add: if you're using Lombok in your project (which is likely), use this:

```java
@Service
@RequiredArgsConstructor
public class MyCoolService {

  private final MyCoolRepository myCoolRepository;
}
```

instead of the manually written all-args constructor like this:

```java
@Service
public class MyCoolService {

  private final MyCoolRepository myCoolRepository;
  
  public MyCoolService(MyCoolRepository myCoolRepository) {
    this.myCoolRepository = myCoolRepository;
  }
}
```

There are cases where you need to use a manual constructor, for example, if the beans have their own `@Qualifier` (though you'd be better off restructuring your bean configuration than manually using the `@Qualifier` annotation), or when writing integration tests (where you'll have to use `@Autowired` because there are no other options). But for most purposes, `@RequiredArgsConstructor` is sufficient to keep your classes clean, neat, and beautiful.

### Benefits

* You cannot accidentally reassign dependencies because you can use `final` fields.

* The app will fail-fast instead of blowing up in the middle of an important transaction due to a nasty `NullPointerException`. Constructor injection ensures that you cannot start the app if even one required bean is configured incorrectly.

* Along the same lines, it helps detect circular dependencies.

* You'll have an easier time mocking (assuming you use Mockito): add `@Mock` to your dependencies, then `@InjectMocks` to the class you want to test. It's the easiest way to write unit tests.

* Using Lombok can hide the SonarQube warning about having more than 7 constructor parameters, but seriously, if that is the case, then that's a good sign that your class is becoming overburdened and refactoring should be done to adhere to the Single Responsibility Principle.

## Handle Exceptions for Request in Spring Boot

See the [full article](./2025-12-22-spring-boot-exception-handler.md) for some sweet juice!

## Cute Annotations? Remember Where to Put It

So you've started learning the magical world of Spring annotations like `@Transactional`, `@Async`, or the one that makes your cache dreams come true, `@Cacheable`? Awesome! You're living in the future now.

### The Happy Path (When Everything Just Works)

Under normal circumstances, you can use them like you've always done: slap together a `@Component` or `@Service` class, whip up a public method, and let other classes call it. Easy-peasy, lemon squeezy.

```java
@Service
public class UserService {
    
  @Cacheable("users")
  public User getUser(Long id) {
    // Expensive database call here
    // Happy database noise
    return userRepository.findById(id);
  }
}
```

Life is good. Everything works. You feel like a coding wizard.

### Then Reality Hits You Like a Truck

But then one fateful day, you fall into one of those classic traps:

* **Self-invocation** (calling the annotated method from within the same class)

* Using a **private method** (because encapsulation matters, right?)

* Not even putting it **in a bean** (rookie mistake)

* Or committing all of them at once (absolute heresy!)

Spring looks at you with disappointed eyes and says: **nope, no magic for you!**

```java
@Service
public class OrderService {
    
  // This won't work! Self-invocation trap
  public void processOrder(Order order) {
    this.saveOrder(order); // Calling internally? No transaction!
  }
    
  @Transactional
  // Uh oh, private too? Double trouble!
  private void saveOrder(Order order) {
    // Angry database noise
    orderRepository.save(order);
  }
}
```

### When Everything Burns

Now your business logic fails spectacularly. 

Your transactions don't roll back when they should. 

Your cache never gets hit, turning your poor database into a punching bag with repeated calls hammering it relentlessly. 

That third-party API you're calling? Yeah, you're basically DDoS-ing them now. 

Your thread thinks `@Async` will save it from blocking work, but nope, it's stuck doing everything synchronously like it's 1999.

Everything burns. Your throughput drops faster than you can say "throughput." Angry customer emails flood in. Your server fans spin up to jet engine levels. The cooling system maxes out. Your on-call phone starts buzzing at 2 AM. Beautiful chaos.

### The Rules (Because Spring Has Standards)

Those fancy annotations have specific requirements, and Spring is not messing around:

* **Must be a Spring-managed bean** (obviously! And honestly, if it's not, be glad Spring Boot refuses to start instead of letting your code silently destroy the business)

* **The method has to be public** (or as of Spring 6, anything that's NOT private). Otherwise, you need additional dark magic like AspectJ, and trust me, that's ugly

* **If you're using interface-based proxies**, the method still needs to be public (private methods inside interfaces haven't worked since JDK 9 anyway)

* **No internal invocation!** Seriously, call it from another bean or suffer

```java
// The RIGHT way
@Service
public class OrderService {
    
  private final OrderProcessor processor;
    
  public OrderService(OrderProcessor processor) {
    this.processor = processor;
  }
    
  public void processOrder(Order order) {
    processor.saveOrder(order); // Call through another bean!
  }
}

@Component
public class OrderProcessor {
    
  @Transactional
  public void saveOrder(Order order) {
    // Happy proxy noise
    orderRepository.save(order);
  }
}
```

### One Last Thing

This applies to ANY custom annotations you might create using the power of AOP. Don't think you can outsmart the proxy gods. They're watching. They're always watching.

Now go forth and annotate responsibly!