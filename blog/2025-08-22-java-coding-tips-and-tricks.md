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

* `no-privilege-method-urls` is where things get spicy - it's a list of objects with `method` and `url` fields. We create a custom `List<MethodUrl>` where `MethodUrl` is our inner record. Nested records are like Russian dolls, but useful.

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

Leave a comment below, and tell me some of the tips and tricks you've been using to great successes!