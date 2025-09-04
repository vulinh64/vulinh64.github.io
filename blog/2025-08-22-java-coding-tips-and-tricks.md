---
slug: java-coding-tips-and-tricks
title: Java's Coding Tips and Tricks
authors: [vulinh64]
tags: [java]
description: Don't shoot yourself in the foot (or your teammates)!
image: ./thumbnails/2025-08-22-java-coding-tips-and-tricks.png
thumbnail: 2025-08-22-java-coding-tips-and-tricks.png
---

Here are some non-exhaustive battle-tested tips and tricks for coding with Java (yes, yes, I hear you muttering about Kotlin, Go, or C#, but if Java is currently keeping the lights on and ramen in your bowl, then buckle up and keep reading).

<!-- truncate -->

## Prefer Returning `java.util.Optional` Over `null`

AKA: Stop Playing Russian Roulette with null pointers.

The full deep-dive article is [here](2025-08-11-java-optional-usage.md), where I geek out about `java.util.Optional` like it's the best thing since sliced bread. But here's the TL;DR version with a side of common sense:

Instead of this disaster waiting to happen:

```java
public User getUser(UUID id) {
  // Find active user with "true"
  // This can return null (spoiler alert: it will, at the worst possible moment)
  return fetchUser(id, true);
}
```

Do this and sleep better at night:

```java
import java.util.Optional;

public Optional<User> getUser(UUID id) {
  // Find active user with "true"
  // We're wrapping it like a responsible adult
  return Optional.ofNullable(fetchUser(id, true));
}
```

Why? Because when you return `null`, your only option is the boring old null check (yawn), and you are tempted to forget this (just like how C or C++ developers forget to free the memory). But with `Optional`, you get access to a whole arsenal of awesome methods like `map`, `filter`, `stream`, `flatMap`, and more! It's like upgrading from a rusty bicycle to a Tesla.

:::tip[Pro Tip]

`Optional` is for return values only! Don't go crazy and start using it for fields or method parameters. That's like wearing a tuxedo to do yard work (and because you can pass a `null` in place of the `Optional` object, yikes).

:::

Want the full story? Check the article linked above, where I ramble extensively about this beautiful piece of Java engineering!

## Prefer Returning Empty Collections or Empty Arrays Over `null`

Still sailing on the HMS Anti-Null, I see!

Joshua Bloch already roasted this topic to perfection in "Effective Java" (item 43), so I'll just give you the highlight reel:

Instead of this ticking time bomb:

```java
public List<User> getUsers() {
  // Only return users if user has correct authorization
  // Otherwise, let's return null and watch the world burn
  return isAuthorized ? fetchUsers() : null;
}
```

Be the hero your codebase deserves:

```java
public List<User> getUsers() {
  return isAuthorized ? fetchUsers() : Collections.emptyList();
}
```

Here's your emergency cheat sheet (screenshot this, print it, tattoo it on your arm):

* **For Lists**: Use `List.of()` (Java 9+) or `Collections.emptyList()`. Both are fine, pick your poison.

* **For Sets**: Go with `Set.of()` (Java 9+) or `Collections.emptySet()`. Your call, captain.

* **For Maps**: Choose from `Map.of()`, `Map.ofEntries()` (Java 9+ gang) or the classic `Collections.emptyMap()`.

Trust me on this one: your future self will send you a thank-you card. Your teammates will stop giving you the stink eye. Your team lead might even crack a smile. And most importantly, you won't be debugging a nasty `NullPointerException` at 2 AM while surviving on energy drinks and regret.


## Exception Handling: Don't Let Your Errors Vanish Into the Void

One of the cardinal sins in Java development is the dreaded "exception swallowing": catching an exception and then doing absolutely nothing with it. This practice is tantamount to committing programming heresy, and here's why you should never, ever do it.

### The Anti-Pattern: Swallowing Exceptions

```java
// DON'T DO THIS - Exception swallowing
try {
  riskyOperation();
} catch (Exception e) {
  // Silence is NOT golden here
}
```

When you swallow exceptions like this, you're essentially creating a black hole where errors disappear without a trace. Your application continues running, potentially in an inconsistent state, and you have no idea what went wrong when things inevitably break later.

Instead, always handle exceptions properly by either logging them appropriately or rethrowing them:

### Option 1: Log the Exception

```java
// For exceptional cases - use WARN or ERROR level
try {
  connectToDatabase();
} catch (SQLException e) {
  logger.warn("Database connection failed, retrying with backup", e);
  // Handle the fallback logic
}

// For expected cases - INFO level is sufficient
try {
  parseOptionalConfig();
} catch (ConfigNotFoundException e) {
  logger.info("Optional config file not found, using defaults", e);
  // Continue with default configuration
}
```

### Option 2: Rethrow with Context

If you need to rethrow the exception, **always include the original exception** to preserve the complete stack trace:

```java
// WRONG - Stack trace gets yeeted into the void
try {
  processUserData(userData);
} catch (ValidationException e) {
  throw new ServiceException("User processing failed");
}

// RIGHT - Original exception preserved
try {
  processUserData(userData);
} catch (ValidationException e) {
  throw new ServiceException("User processing failed", e);
}
```

### Why This Matters

Preserving the original exception in your rethrow statement maintains the complete stack trace, showing you exactly where the problem originated. Without it, you'll spend countless hours debugging issues that could have been immediately obvious with proper exception chaining.

Remember: exceptions are your friends trying to tell you something went wrong. Don't silence them! Listen to what they have to say!

## Beware of Method Calls That Introduce Non-Idempotent Values

### The Good, The Bad, and The Randomly Different

**The Good:** Normal getters are your best friends. They're reliable, predictable, and won't surprise you at 3 AM when you're debugging production issues. Call `user.getEmail()` as many times as you want. Not like it's going to suddenly decide to return a different email address just to mess with you.

**The Bad (and Sneaky):** Methods like `LocalDateTime.now()`, `Random.nextInt()`, `System.currentTimeMillis()`, and their mischievous cousins. These little rascals return something different every time you invoke them. It's like asking "What time is it?" and getting a different answer each nanosecond: technically, is correct, but can turn your code into a house of cards.

### The Million-Dollar Question

So here's the thing: **Do you explicitly want different values each time?**

If you're building a timestamp logger or generating random passwords, then yes, embrace the chaos! 

But if you're doing something like this:

```java
// Don't do this!!!
// You're asking for trouble!!!
if (someCondition(LocalDateTime.now()) && anotherCondition(LocalDateTime.now())) {
  processEvent(LocalDateTime.now());
}
```

Congratulations! You've just created a temporal paradox where three different timestamps might be involved in what should be a single moment in time.

### The Solution: Introduce a Variable (Your IDE Is Smarter Than You Think)

Instead, let your IDE be your wingman. In IntelliJ IDEA, the "Introduce Local Variable" refactoring (usually `Ctrl + Alt + V` or `Cmd + Alt + V`) is basically your free ticket:

```java
// Much better now that everyone's on the same page
LocalDateTime now = LocalDateTime.now();

if (someCondition(now) && anotherCondition(now)) {
  processEvent(now);
}
```

### The ~~Horror~~ Production Story: JWT TTL Edition

Here's where things get really spicy. Imagine you're working with JWT tokens and their time-to-live (TTL) values. Every nanosecond matters in this game, and if you're not careful, you'll create a bug so subtle and elusive that it'll keep you awake at night, questioning your life choices and wondering why you chose this career in the first place:

```java
// This is a recipe for disaster and sleepless nights
JwtBuilder builder = Jwts.builder()
    .setIssuedAt(Date.from(LocalDateTime.now().atZone(ZoneId.systemDefault()).toInstant()))
    .setExpiration(Date.from(LocalDateTime.now().plusHours(1).atZone(ZoneId.systemDefault()).toInstant()));
```

Those two `LocalDateTime.now()` calls might happen microseconds apart, and suddenly your JWT's TTL isn't exactly one hour. It might be 59 minutes, 59 seconds, and 999,999 microseconds. Close, but still wrong, and in the world of security tokens, "close" is often synonymous with "broken."

The fix? Introduce that variable and save your sanity:

```java
LocalDateTime now = LocalDateTime.now();

JwtBuilder builder = Jwts.builder()
    .setIssuedAt(Date.from(now.atZone(ZoneId.systemDefault()).toInstant()))
    .setExpiration(Date.from(now.plusHours(1).atZone(ZoneId.systemDefault()).toInstant()));
```

### Pro Tip: Even the Good Guys Benefit

Here's a bonus nugget: even those well-behaved, idempotent methods can benefit from the "introduce variable" treatment. Sure, calling `user.getName()` five times in a row won't break anything, but extracting it to a variable makes your code cleaner and more maintainable. Don't expect miracles in performance, because modern JVMs are goddamn smart and will optimize the hell out of your code anyway, but your fellow developers (including future you) will appreciate the clarity.

### Final Takeaway ~~(Yes, I am using A.I to generate this)~~

Remember: 

* in Java, consistency isn't just a virtue, for it's a **survival skill**. Your code should be predictable, not a source of existential dread. So the next time you see a method that might return different values, ask yourself: "*Do I want chaos, or do I want to sleep peacefully tonight?*"

* Check the source codes to make sure if the repeatedly calling a method is safe or not. Choose wisely.

## Spring Boot Tips: Use Java Records for Configuration Properties

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

Just slap `@EnableConfigurationProperties(ApplicationProperties.class)` on your main class and call it a day:

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

---

Leave a comment below, and tell me some of the tips and tricks you've been using to great successes!