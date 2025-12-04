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

---

Leave a comment below, and tell me some of the tips and tricks you've been using to great successes!