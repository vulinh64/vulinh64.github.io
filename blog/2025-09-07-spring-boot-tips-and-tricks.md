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

---

Leave a comment below, and tell me some of the tips and tricks you've been using to great successes!