---
slug: java-coding-tips-and-tricks
title: Java's Coding Tips and Tricks
authors: [vulinh64]
tags: [java ]
description: Don't shoot yourself in the foot (or your teammates)!
image: ./thumbnails/2025-08-22-java-coding-tips-and-tricks.png
thumbnail: 2025-08-22-java-coding-tips-and-tricks.png
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Here are some non-exhaustive battle-tested tips and tricks for coding with Java (yes, yes, I hear you muttering about Kotlin, Go, or C#, but if Java is currently keeping the lights on and ramen in your bowl, then buckle up and keep reading).

<!-- truncate -->

## Prefer Returning `java.util.Optional` Over `null`

AKA: Stop Playing Russian Roulette with null pointers.

The full deep-dive article is [here](2025-08-11-java-optional-usage.md), where I geek out about `java.util.Optional` like it's the best thing since sliced bread. But here's the TL;DR version with a side of common sense:

<Tabs>

<TabItem value="return-optional" label="Do This">

Do this and sleep better at night:

```java
import java.util.Optional;

public Optional<User> getUser(UUID id) {
  // Find active user with "true"
  // We're wrapping it like a responsible adult
  return Optional.ofNullable(fetchUser(id, true));
}
```

</TabItem>

<TabItem value="return-null" label="Don't Do This">

Instead of this disaster waiting to happen:

```java
public User getUser(UUID id) {
  // Find active user with "true"
  // This can return null (spoiler alert: it will, at the worst possible moment)
  return fetchUser(id, true);
}
```

</TabItem>

</Tabs>

Why? Because when you return `null`, your only option is the boring old null check (yawn), and you are tempted to forget this (just like how C or C++ developers forget to free the memory). But with `Optional`, you get access to a whole arsenal of awesome methods like `map`, `filter`, `stream`, `flatMap`, and more! It's like upgrading from a rusty bicycle to a Tesla.

:::tip[Pro Tip]

`Optional` is for return values only! Don't go crazy and start using it for fields or method parameters. That's like wearing a tuxedo to do yard work (and because you can pass a `null` in place of the `Optional` object, yikes).

:::

Want the full story? Check the article linked above, where I ramble extensively about this beautiful piece of Java engineering!

## Prefer Returning Empty Collections or Empty Arrays Over `null`

Still sailing on the HMS Anti-Null, I see!

Joshua Bloch already roasted this topic to perfection in "Effective Java" (item 43), so I'll just give you the highlight reel:

<Tabs>

<TabItem value="return-empty" label="Return Empty Collections">

Be the hero your codebase deserves:

```java
public List<User> getUsers() {
  return isAuthorized ? fetchUsers() : Collections.emptyList();
}
```

</TabItem>

<TabItem value="return-null" label="Don't Return Null">

Instead of this ticking time bomb:

```java
public List<User> getUsers() {
  // Let's return null and watch the world burn
  return isAuthorized ? fetchUsers() : null;
}
```

</TabItem>

</Tabs>

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

<Tabs>

<TabItem value="relog" label="Re-Log the Exception">


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

</TabItem>

<TabItem value="rethrow" label="Re-throw the Exception">

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

</TabItem>

</Tabs>

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

<details>

<summary>Pro Tip: Even the Good Guys Benefit</summary>

Here's a bonus nugget: even those well-behaved, idempotent methods can benefit from the "introduce variable" treatment. Sure, calling `user.getName()` five times in a row won't break anything, but extracting it to a variable makes your code cleaner and more maintainable. Don't expect miracles in performance, because modern JVMs are goddamn smart and will optimize the hell out of your code anyway, but your fellow developers (including future you) will appreciate the clarity.

</details>

### Final Takeaway ~~(Yes, I am using A.I to generate this)~~

Remember: 

* in Java, consistency isn't just a virtue, for it's a **survival skill**. Your code should be predictable, not a source of existential dread. So the next time you see a method that might return different values, ask yourself: "*Do I want chaos, or do I want to sleep peacefully tonight?*"

* Check the source codes to make sure if the repeatedly calling a method is safe or not. Choose wisely.

## Favor Unambiguous Date Time Units

Speaking of consistency:

:::tip[TL;DR]

Let your backend use a single unambiguous time unit, and let clients decide how to parse them in their timezone. It's time for the frontend to at least share some burden to earn their keeps.

:::

When designing a distributed system with multiple services that need to handle time, you'll quickly discover that date time is the software equivalent of that one friend who seems simple on the surface but turns into an absolute nightmare after a few drinks.

The good news? You can avoid most of this drama by embracing a beautifully simple philosophy: stick to unambiguous datetime units and stop overthinking it.

For 99% of applications, you only need two datetime types in your arsenal: `LocalDateTime` and `Instant`. That's it. Forget about the bewildering zoo of timezone-aware classes that promise "flexibility" but actually deliver the coding equivalent of a root canal.

### `LocalDateTime`, The Chill Option

`LocalDateTime` is like that reliable friend who shows up on time and doesn't cause drama. It represents date and time without any timezone baggage: no political opinions, no geographical tantrums, just pure temporal bliss.

If you're building a system for users who mostly live in the same general area (and your servers aren't running on some cursed timezone configuration that makes no sense), `LocalDateTime` is probably all you need. It's straightforward, predictable, and won't wake you up at 3 AM because someone in Germany decided they don't believe in daylight saving time.

Think about it: if your users are all hanging out in roughly the same timezone and your business logic doesn't need to coordinate a UN summit across continents, why add complexity that'll make future you want to travel back in time and slap current you?

### `Instant`, The Absolute Unit

When you need to go global and deal with the beautiful chaos of international timezones, `Instant` becomes your new best friend. This thing represents an absolute point in time at UTC +0, and it gives exactly zero damns about political shenanigans or geographical weirdness. 

No more dealing with daylight saving time transitions that somehow manage to create duplicate hours or black holes in your timeline. No more navigating brilliant policies like China's "*let's make a continent-sized country use one timezone because why not?*" decision. `Instant` doesn't care if some politician wakes up tomorrow and decides to shift their country's clocks by 37 minutes just to mess with developers. An absolute instant remains the undisputed champion of "*I don't have time for your nonsense.*" 

~~Seriously, whoever thought of DST just to save a few hours of sunlight should be sent to the North Pole in summer, or the South Pole in winter, to enjoy uninterruptible light for 6 months. It's reasonable to not make timezone boundaries align perfectly in parallel lines to match geographical realities, but it's absolute heresy to mess with time itself just because the Earth tilts.~~

When you store everything as `Instant`, you're working with an immutable point of truth that stays rock-solid regardless of human stupidity, seasonal mood swings, or regional preferences. Think of it this way: `LocalDateTime` is your local objective reality, and `Instant` is the world's objective reality. Hell, it could even represent the entire universe from a fixed point. Objective realities don't care whether you believe in them or not. Save the timezone conversions for the presentation layer, and let the frontend deal with making things pretty for users.

### When You Shouldn't Ignore the Underrated Weirdos

Now, before you go deleting every `OffsetDateTime` and `ZonedDateTime` from your codebase in a fit of minimalist rage, let me save you from some future pain. There are actually times when these more complex types earn their keep.

* `OffsetDateTime` is surprisingly useful when you're dealing with database storage that needs to preserve exact offset information, or when you're building network protocols where precision matters. It's also your friend when you need to do date arithmetic while keeping track of the original offset context, something `Instant` can't help you with since it only knows about epoch seconds and couldn't care less about your need to add three hours and twenty-seven minutes.

* `ZonedDateTime` steps up when you're building business apps that actually need to handle the messy reality of timezone politics. Appointment scheduling across timezones? Financial trading systems that must respect market hours in specific regions? Date math that needs to survive DST transitions without breaking? This is `ZonedDateTime`'s moment to shine.

The trick is knowing when you actually need these capabilities versus when you're just adding complexity because it feels "more complete" or "future-proof." Spoiler alert: most of the time, you don't need them.

<details>

<summary>⚠️ A Word of Caution Regarding `ZonedDateTime` Support</summary>

However, if you're using JPA for persistence, here's the plot twist: `ZonedDateTime` is NOT officially supported by the JPA specification (including JPA 2.2, 3.0, and 3.1). The spec only includes `LocalDate`, `LocalDateTime`, `LocalTime`, `OffsetTime`, and `OffsetDateTime` as standard temporal types.

While Hibernate (the most popular JPA implementation) does provide proprietary support for `ZonedDateTime`, it comes with a significant gotcha: it loses the timezone information when saving to the database, converting the `ZonedDateTime` to your JVM's local timezone and storing it as a plain `TIMESTAMP`. This means that beautiful timezone context you carefully preserved? Gone. Vanished. Sacrificed on the altar of database compatibility.

The pragmatic approach: Use `ZonedDateTime` freely in your request/response DTOs and business logic where it makes sense, but convert to `Instant` or `OffsetDateTime` (which IS in the JPA spec) for your JPA entities. This requires a bit of manual conversion in your service layer, but it beats the alternative of silently losing timezone data or discovering your code doesn't work with other JPA implementations.

If you're on Hibernate 6+, you can use the `@TimeZoneStorage` annotation to control timezone handling, but remember this is a Hibernate-specific extension that won't work if you ever switch JPA providers.

References:

* [How To Map The Date And Time API with JPA 2.2](https://thorben-janssen.com/map-date-time-api-jpa-2-2/)

* [What’s new in JPA 2.2 – Java 8 Date and Time Types](https://vladmihalcea.com/whats-new-in-jpa-2-2-java-8-date-and-time-types/)

</details>

#### Example

Your manager decides that some critical event absolutely must happen at 3 PM in Germany on October 5th (Oktoberfest), "because reasons." In this case, `ZonedDateTime` will be way more convenient than trying to figure out what absolute `Instant` corresponds to "*3 PM German time on that specific date with all the DST nonsense factored in.*" Sometimes business requirements are tied to local human time, not cosmic absolute time.

### The Bottom Line

Keep your backend simple and sane with unambiguous time units. Push all the timezone conversion headaches to the client side where they belong. Your frontend developers have been getting away with making things look pretty for too long. It's time they earned their paychecks by handling some actual logic for once.

One source of truth for time, minimal complexity, maximum sanity. Your future self will thank you when you're not debugging timezone-related bugs at 2 AM while questioning your life choices.

### Bonus: Converting Back and Forth

Sometimes you'll need to convert between these types, and here's where things get interesting:

<Tabs>

<TabItem value="to-instant" label="To Instant">

```java
var ldtToInstant = localDateTime.atZone(ZoneId.systemDefault()).toInstant();
```

</TabItem>

<TabItem value="to-ldt" label="To LocalDateTime">

```java
var instantToLdt = instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
```

</TabItem>

</Tabs>

Notice something? You need a timezone to provide the time context: either to convert from local date time to universal time, or vice versa. That's exactly why you can't completely ditch `ZonedDateTime`, even if you wanted to. Not everyone lives in the UTC +0 ideal land where time conversions are just academic exercises. The timezone becomes the bridge between your local reality and the universal truth. It's like having a translator who speaks both "what time my users think it is" and "what time the universe knows it actually is."

## Comparing Objects with Null Safety

The tip was so long that I got a dedicated article [here](2025-09-19-null-safe-comparisons.md).

## Remember the Lazy Evaluation, Too!

Let's take this simple null-coalescing example:

```java
var object = object == null 
    ? getDefaultObject() 
    : object;
```

A simple but elegant solution when you want to assign a default value to a variable if the object is `null`. It's like a safety net for your variables, minus the circus.

Then, you get fancy and create a helper method to adhere to the DRY principle:

```java
// Sweet, sweet juicy usage of generics
// that would make Joshua Bloch shed a single tear of pride
<T> T getOrDefault(T object, T defaultValue) {
  return object == null
    ? defaultValue
    : object;
}
```

Also, FYI:

> DRY principle stands for Don't Repeat Yourself (ironically, I just repeated that)

And then, riding high on your DRY-fueled motivation, you refactor your entire code base like a caffeinated code warrior. You feel invincible. You feel productive. You feel... oh so proud of yourself.

Hold your horses, cowboy!

Before your brain drowns in dopamine, and you start updating your LinkedIn with "Refactoring Ninja" as a skill, let me burst your bubble with a question:

**What do you think will happen in this code snippet?**

```java
var object = getOrDefault(object, expensiveComputation());
```

Plot twist: The `expensiveComputation()` will *ALWAYS* execute, regardless of whether our lovely `object` is `null` or not. Surprise!

The consequences? Could range from wasting precious CPU cycles (your laptop fan is already judging you) to the dreaded "*oh no, I've accidentally launched the nuclear missile twice*" scenario. That's programmer speak for "your non-idempotent operations fired twice and caused chaos that should've only happened once, but here we are, with two charges on the customer's credit card and an angry email in your inbox."

The fix? Use lazy evaluation. Or in layman's terms, use `Supplier<T>`. Think of it as saying "I'll tell you the answer... but only when you actually need it."

Specifically, don't delete your current helper method yet (we're collectors, not destroyers). We'll add an overloaded one:

```java
// Are you ready to get your OCP certificate?
// This is the bliss of Generics Usage (chef's kiss)
<T> T getOrDefault(T object, Supplier<? extends T> defaultValueSupplier) {
  return object == null
    ? defaultValueSupplier.get()
    : object;
}
```

And then, modify the expensive method call like this:

```java
var object = getOrDefault(object, () -> expensiveComputation());
```

You can now rest easy knowing that `expensiveComputation()` will only be called if your shiny `object` is null. Otherwise? It stays asleep. Lazy. Unbothered. Living its best life.

And to think that the humble ternary operator above could masterfully handle both eager and lazy evaluation. Truly a *How do you do, fellow kids* moment for the ages.

But wait, don't delete the original helper method! (Yes, I know I already said this, but some of you are trigger-happy with that delete key.) It's still useful. Let's talk about when to use which:

* The eager evaluation version is perfect for already computed values (simple getters, defined constants, that sort of thing). It's like having fast food: already prepared, ready to go, no waiting.

* The lazy evaluation one is suitable when the default value requires invoking some rather expensive computations. But here's the kicker: using lazy evaluation on already computed values is wasteful. You're creating a `Supplier<T>` wrapper just to contain a value that's already sitting right there. It's like gift-wrapping a gift that's already unwrapped. Inefficient and slightly ridiculous.

Choose your approach carefully! Know what you need to do, and know which method to use (both versions are lovingly supported by Apache Commons Lang 3 libraries, bless their hearts). Our null-coalescing task is just a simple one, but the same principle can also be applied to other stuff, for example: hit the database only if the cache does not contain our desired value.

---

Leave a comment below, and tell me some of the tips and tricks you've been using to great successes!