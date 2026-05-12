---
slug: just-how-bad-is-lombok-data-for-jpa
title: "Just How Bad Is Lombok's @Data for JPA?"
authors: [ vulinh64 ]
tags: [ java, jpa, lombok ]
description: "We ran the experiments so you don't have to. Spoiler: it's worse than you think."
image: ./thumbnails/2026-05-12-just-how-bad-is-lombok-data-for-jpa.png
thumbnail: 2026-05-12-just-how-bad-is-lombok-data-for-jpa.png
---

You've been warned. You've read the theory. Maybe you even read my [previous article](./2026-05-08-how-to-jpa-entity-equals-and-hashcode.md) about why `equals()` and `hashCode()` are so treacherous on JPA entities.

But theory is easy to ignore. Log output is not.

{/* truncate */}

So I did what any reasonable developer does before writing a blog post: I blew things up on purpose. Every disaster below was reproduced against a real PostgreSQL database in a dedicated PoC project. Full stack traces, SQL logs, and endpoint code are in the [REPORT.md](https://github.com/vulinh64/lombok-disaster/blob/main/REPORT.md). This article covers only what happened and why.

:::note[A note on the research process]

At one point during the investigation, Anthropic's AI assistant forcefully terminated my chat session. The likely culprit was a `StackOverflowError` or `OutOfMemoryError` triggered while analysing the stack traces, as Anthropic apparently saw this as self-sabotage in progress and pulled the plug before the AI could take the blame. I like to think it was an act of corporate self-preservation. Either way, I took it as a sign that we were on to something. If the stack traces can overflow an AI session, they can certainly overflow yours.

:::

The defendant is Lombok's `@Data`. The crimes are numerous. The judge is a `StackOverflowError` (and perhaps, `OutOfMemoryError` if those bad practices are to be on production).

## The Setup

Three entities: `User`, `Post`, `Comment`.

`User` has `@OneToMany` to both `Post` and `Comment`. `Post` has `@ManyToOne` back to `User` and `@OneToMany` to `Comment`. `Comment` has `@ManyToOne` to both. All associations are lazy.

All three entities carry `@Data` ([here they are](https://github.com/vulinh64/lombok-disaster/tree/main/src/main/java/com/vulinh/entity) if you want to follow along).

This is the part where experienced JPA developers start wincing.

:::note

`open-in-view` is **disabled** throughout. Keeping it enabled would silently hide several of the disasters below by holding the Hibernate session open across the entire HTTP request. We're not letting it babysit us today.

:::

## Part I: The `equals()` and `hashCode()` Disasters

### Disaster 1: Just Holding an Entity Is Unsafe

You load a `User` outside a transaction. You call `user.hashCode()`. That's it. That's the disaster.

Nobody calls `hashCode()` for fun, of course. But put that entity into a `HashSet`, pass it to a `HashMap`, or hand it to anything that hashes its keys, and `hashCode()` gets called for you: silently, automatically, and at the worst possible moment.

Lombok's generated `hashCode()` iterates over every field, including the lazy `posts` collection. The session is already closed. `PersistentSet.hashCode()` tries to initialize it. Boom. `LazyInitializationException`.

Passing the entity to a `HashMap`, calling `Objects.hash()` with it, logging it with SLF4J format parameters. All of these detonate the same way. Outside a transaction, you cannot safely hold the reference. It's a live grenade with a very polite-looking API.

<details>

<summary>Show the stack trace</summary>

```
org.hibernate.LazyInitializationException: failed to lazily initialize a collection
of role: com.vulinh.entity.User.posts: could not initialize proxy - no Session
    at org.hibernate.collection.spi.PersistentSet.hashCode(PersistentSet.java:409)
    at com.vulinh.entity.User.hashCode(User.java:16)   <-- @Data
    at com.vulinh.web.DisasterController.lazyInitException(...)
```

</details>

### Disaster 2: Not N+1, but a Hydration Storm and a `ConcurrentModificationException`

:::info[WHAT IS HYDRATION?]

**Hydration** is the process by which Hibernate loads a lazy collection's rows from the database and builds the in-memory objects. `PersistentSet.injectLoadedState()` is the internal method responsible for this work.

:::

This one is more creative. A plain `for` loop adding users to a `HashSet` fires **7 SQL queries for a single `set.add(user)`** call, then crashes. Here is the chain of chaos:

1. `HashSet.add(user)` calls `User.hashCode()`, which touches `user.posts`. Lazy load triggered.

2. While `PersistentSet.injectLoadedState()` is mid-hydration, each `Post` being added calls `Post.hashCode()`, which calls `User.hashCode()` again.

3. `User.hashCode()` re-enters `user.posts`. Hibernate doesn't notice a load is already in progress and re-issues the same `SELECT`. Because why not.

4. Two passes are now mutating the same backing `ArrayList` concurrently. The outermost iterator throws `ConcurrentModificationException`.

Here is the call chain visualised:

```
HashSet.add(user)
  └─ User.hashCode()
      └─ user.posts.hashCode()                          [lazy load triggered]
          └─ PersistentSet.injectLoadedState()          [ENTRY 1: mid-hydration]
              └─ HashSet.add(post)
                  └─ Post.hashCode()
                      └─ User.hashCode()
                          └─ user.posts.hashCode()      [Hibernate re-issues SELECT]
                              └─ PersistentSet.injectLoadedState()    [ENTRY 2: concurrent mutation]
                                  └─ HashSet.add(post)
                                      └─ Post.hashCode()
                                          └─ User.hashCode()
                                              └─ user.posts.hashCode()
                                                  └─ PersistentSet.injectLoadedState()    [ENTRY 3]
                                                      └─ ConcurrentModificationException
```

Hibernate's collection hydration is not reentrant. The moment `User.hashCode()` re-enters a collection that is already mid-hydration, two passes are writing to the same backing `ArrayList`. The outermost frame throws.

<details>

<summary>Show the stack trace (3 nested <code>injectLoadedState</code> frames)</summary>

```
java.util.ConcurrentModificationException
    at org.hibernate.collection.spi.PersistentSet.injectLoadedState(PersistentSet.java:311)  <-- 3rd re-entry
    at org.hibernate.collection.spi.PersistentSet.hashCode(PersistentSet.java:409)
    at com.vulinh.entity.Post.hashCode(Post.java:11)
    at java.util.HashSet.add(HashSet.java:230)
    at org.hibernate.collection.spi.PersistentSet.injectLoadedState(PersistentSet.java:311)  <-- 2nd re-entry
    at org.hibernate.collection.spi.PersistentSet.hashCode(PersistentSet.java:409)
    at com.vulinh.entity.User.hashCode(User.java:16)
    at org.hibernate.collection.spi.PersistentSet.injectLoadedState(PersistentSet.java:311)  <-- 1st entry
    at java.util.HashSet.add(HashSet.java:230)
    at com.vulinh.web.DisasterController.nPlusOneEquals(DisasterController.java:86)
```

</details>

This is not just N+1. This is N+1 plus corruption: extra queries that load data Hibernate can't even finish using.

### Disaster 3: `StackOverflowError` from `equals()`/`hashCode()`

No database required for this one. Pure Java. You wire up two `Post` objects the usual way (`post.author` points to a `User`, `user.posts` contains the post) and call `a.equals(b)`.

`Post.equals` compares `author`. `User.equals` compares `posts`. `AbstractSet.equals` calls `contains(post)`. `post.hashCode()` includes `author`. `User.hashCode()` includes `posts`…

The 3-frame cycle repeats **1026 times** until the stack is gone. Elegant, in a horrifying sort of way.

<details>

<summary>Show the stack trace (1026 lines, 3-frame repeating cycle)</summary>

```
java.lang.StackOverflowError
    at java.util.AbstractSet.hashCode(AbstractSet.java:120)
    at com.vulinh.entity.User.hashCode(User.java:16)
    at com.vulinh.entity.Post.hashCode(Post.java:11)
    at java.util.AbstractSet.hashCode(AbstractSet.java:124)
    at com.vulinh.entity.User.hashCode(User.java:16)
    at com.vulinh.entity.Post.hashCode(Post.java:11)
    ... (1026 lines)
```

</details>

### Disaster 4: `HashSet` Corruption (Silent, No Exception)

This one has no crash. That's what makes it the cruelest.

Add a transient entity to a `HashSet`, then call `saveAndFlush`. The same object reference that's already in the set gets its `id` field mutated from `null` to the assigned primary key. `@Data` includes `id` in `hashCode()`, so the hash value changes. The entity is now in the wrong bucket.

`set.contains(user)` returns `false` on the exact object that's still physically inside the set. No exception. **200 OK.** Any cache or deduplication structure built before the first `save()` is silently corrupted. And you'll never know.

In real applications, one of the most common ways this plays out is a `.collect(Collectors.toSet())` on a stream of entities that haven't been persisted yet. The stream runs, the `HashSet` is built, `saveAll()` is called on the batch, and every entity in the set quietly moves to the wrong bucket. The resulting set looks fine. Iterating it works. But any lookup by entity reference will miss. Silently.

<details>

<summary>Show the response</summary>

```json
{
  "hashBefore": 1254518467,
  "hashAfter":  830410832,
  "user == persisted (same reference)": true,
  "set.contains(user) before save": true,
  "set.contains(user) after save":  false
}
```

</details>

### Disaster 5: JPA Identity Violation (Also Silent)

JPA has a rule: two objects representing the same database row must be considered equal. It's kind of the whole point.

Detach an entity, drift one field, then load the same row again. Both objects have `id == 1`. JPA says they're the same thing. `@Data` disagrees: one field doesn't match, so `equals()` returns `false`. Every `Set<User>`, every `Map<User, ?>`, every equality-based deduplication silently misfires. **200 OK.** Production data quietly does the wrong thing.

<details>

<summary>Show the endpoint code</summary>

```java
@GetMapping("/identity-violation")
@Transactional
public Map<String, Object> identityViolation() {
    User a = userRepository.findById(1L).orElseThrow();
    em.detach(a);
    a.setUsername(a.getUsername() + "-stale"); // field drifts after detach

    User b = userRepository.findById(1L).orElseThrow(); // fresh load of the same row

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("a.id", a.getId());
    result.put("b.id", b.getId());
    result.put("same row?", Objects.equals(a.getId(), b.getId()));
    result.put("a.equals(b)", a.equals(b));
    return result;
}
```

</details>

<details>

<summary>Show the response</summary>

```json
{
  "a.id": 1,
  "b.id": 1,
  "same row?": true,
  "a.equals(b)": false
}
```

</details>

### Disaster 6: Asymmetric Proxy Equality

`em.getReference()` returns an uninitialized proxy. Call `proxy.equals(real)` and you get `false`. Call `real.equals(proxy)` and you get `true`. Same row. Different answer depending on which object goes first.

Lombok's generated `equals` reads fields directly on whatever object it's called on, bypassing the proxy interceptor when the proxy hasn't been initialized. Raw fields are `null`. The `equals` contract requires `a.equals(b) == b.equals(a)`. `@Data` violates it, and which result you get depends on initialization order at runtime. Fun!

As a bonus, the `equals` call also triggers a 7-query hydration storm before failing. `@Data` is nothing if not thorough.

<details>

<summary>Show the response (same row, asymmetric result)</summary>

```json
{
  "proxy.getClass()": "com.vulinh.entity.User$HibernateProxy",
  "real.getClass()":  "com.vulinh.entity.User$HibernateProxy",
  "proxy.equals(real)": false,
  "real.equals(proxy)": true
}
```

</details>

## Part II: The `toString()` Disasters

### Disaster 7: `StackOverflowError` from `toString()`

Same idea as Disaster 3, different entry point.

`u.toString()` includes `posts`. Iterates over them. Calls `p.toString()`. Which includes `author`. Which calls `u.toString()`. The 7-frame cycle runs **1031 times**.

This fires on any string operation: concatenation, `log.debug("{}", user)`, debugger watch expressions, REST response rendering. No Hibernate, no database required. Just two bidirectional entities and one stray string operation.

:::note

The PoC runs with `-Xss256k`, a deliberately tiny stack, so the recursion hits `StackOverflowError` fast and the stack trace stays manageable. In real production with a default 512k–1MB stack, the cycle runs far longer before crashing. The stack trace gets proportionally more glorious. And the `StringBuilder` allocations have even more time to pile up, making `OutOfMemoryError` an increasingly realistic outcome instead.

:::

Here is the stack trace:

<details>

<summary>Show the stack trace (1031 lines, 7-frame repeating cycle)</summary>

```
java.lang.StackOverflowError: null
    at com.vulinh.entity.User.toString(User.java:16)
    at java.lang.String.valueOf(String.java:4530)
    at com.vulinh.entity.Post.toString(Post.java:11)
    at java.lang.String.valueOf(String.java:4530)
    at java.lang.StringBuilder.append(StringBuilder.java:173)
    at java.util.AbstractCollection.toString(AbstractCollection.java:459)
    at java.lang.String.valueOf(String.java:4530)
    at com.vulinh.entity.User.toString(User.java:16)
    ... (1031 lines)
```

</details>

Also, another nightmare you may pay attention to:

:::danger[SIMPLE MISTAKE THAT MAY CRASH YOUR APP]

Notice `StringBuilder.append` and `AbstractCollection.toString` in the stack trace. Each recursive call allocates its own `StringBuilder`, and none of them get released until the recursion unwinds. It never unwinds. The allocations just keep stacking.

With a large enough collection and a generous JVM stack size, the heap runs out before the stack does. `StackOverflowError` becomes `OutOfMemoryError`.

That's the worse outcome. A `StackOverflowError` is at least loud: one dead thread, clear stack trace, obvious culprit. An `OutOfMemoryError` takes the whole JVM with it. GC thrashes. Every thread slows down. The app dies gradually. The heap dump is full of `String` and `StringBuilder` objects with no obvious owner. The log line that started it may never appear at all, because SLF4J already swallowed it. The whole thing looks like a memory leak.

All from a single `log.debug` on an entity. Good luck in production.

:::

### Disaster 8: The LOB Bomb

`@Data` includes every field in `toString()`. Including `TEXT` columns. Including the ones that hold 50 MB of content in production.

Every log line that touches the entity allocates that full column as a `String`. On every call. And because `log.debug("{}", entity.toString())` evaluates `toString()` as a Java argument *before* `log.debug` is even called, it does this regardless of whether DEBUG logging is enabled. Your log level is `INFO` but the heap doesn't care.

This is a direct Sonar `java:S2629` violation. The correct pattern is `log.atDebug().log("{}", entity)`, with lazy evaluation and no allocation unless the level is enabled.

### Disaster 9: One Log Line to Rule Them All

This is the grand finale of the `toString()` section.

`log.debug("Inspecting user: {}", user)`, inside a transaction, fires **7 SQL queries**, corrupts Hibernate's collection state, has the `ConcurrentModificationException` swallowed silently by SLF4J's `safeObjectAppend`, and returns **200 OK**.

The log line reads `[FAILED toString()]`. The `SLF4J(E)` error appears on stderr after the request has already completed, potentially in a different log file.

<details>

<summary>Show the log output (CME swallowed, request returns 200)</summary>

```
-- 1 SELECT + 6 more from the hydration storm

DEBUG c.v.web.DisasterController : Inspecting user: [FAILED toString()]

SLF4J(E): Failed toString() invocation on an object of type [com.vulinh.entity.User]
SLF4J(E): Reported exception:
java.util.ConcurrentModificationException
    at org.hibernate.collection.spi.PersistentSet.injectLoadedState(...)
    at com.vulinh.entity.User.toString(User.java:16)
    at org.slf4j.helpers.MessageFormatter.safeObjectAppend(MessageFormatter.java:291)  <-- swallowed here
    at ch.qos.logback.classic.Logger.debug(...)
```

</details>

Without `@Transactional`, the same line produces a `LazyInitializationException` instead of a hydration storm. SLF4J swallows that too. **200 OK.** The most recognizable Hibernate error in the industry, invisible to the caller.

One debug log line. Seven queries, a corruption, a swallowed exception, and a clean HTTP response. Impressive, really.

## Part III: The Setter Disaster

`@Data` generates setters for **every field**. Including `@Id`. What could go wrong?

### Disaster 10: Mutating `@Id`

**With `@Transactional`:** call `user.setId(999_999L)` on a managed entity, then `em.flush()`. No UPDATE is issued. Hibernate detects the primary key mutation at flush time and throws before generating any SQL, marking the transaction rollback-only.

Any `try/catch` around the flush call catches Hibernate's exception normally, so the method body returns cleanly. Then Spring's `TransactionInterceptor` tries to commit, finds rollback-only, and throws `UnexpectedRollbackException` *outside* the controller's error handling. Two-stage failure. Your error handling never sees it.

**Without `@Transactional`:** `saveAndFlush` on the detached entity calls `merge()`. With `IDENTITY` generation, Hibernate treats any non-null `id` as "must already exist." The missing row triggers `ObjectOptimisticLockingFailureException`, whose message says "updated or deleted by another transaction." The real cause (that you just called `setId()` on an entity) is nowhere in the stack trace.

<details>

<summary>Show the misleading error (no-tx variant)</summary>

```json
{
  "originalId": 1,
  "mutatedId": 999999,
  "outcome": "exploded: ObjectOptimisticLockingFailureException: Row was updated or
              deleted by another transaction (or unsaved-value mapping was incorrect):
              [com.vulinh.entity.User#999999]"
}
```

</details>

<details>

<summary>Show the two-stage failure (<code>@Transactional</code> variant)</summary>

```
-- 1 SELECT. No UPDATE ever issued.
-- Hibernate detects the @Id mutation and marks the transaction rollback-only.
-- The try/catch around em.flush() catches Hibernate's exception.
-- The method body returns normally.
-- Spring's TransactionInterceptor tries to commit and finds rollback-only.

ERROR ... UnexpectedRollbackException: Transaction silently rolled back
because it has been marked as rollback-only
    at TransactionAspectSupport.commitTransactionAfterReturning(...)
    at DisasterController$$SpringCGLIB$$0.idMutation(<generated>)
```

</details>

## The Full Scoreboard

| # | Endpoint | Disaster | Silent? |
|---|----------|----------|---------|
| 1 | `/lazy-init-exception` | `LazyInitializationException` from `hashCode()` outside transaction | No (500) |
| 2 | `/n-plus-one-equals` | 7 SQL queries + hydration storm → `ConcurrentModificationException` | No (500) |
| 3 | `/equals-stackoverflow` | `StackOverflowError` from bidirectional `equals()`/`hashCode()` | No (500) |
| 4 | `/hashset-corruption` | Entity unreachable in `HashSet` after `save()` | **Yes (200)** |
| 5 | `/identity-violation` | Same row, drifted field → `equals()` returns `false` | **Yes (200)** |
| 6 | `/proxy-equals-fail` | Asymmetric equality: `proxy.equals(real)` ≠ `real.equals(proxy)` | **Yes (200)** |
| 7 | `/tostring-stackoverflow` | `StackOverflowError` from bidirectional `toString()` | No (500) |
| 8 | `/lob-bomb` | LOB columns serialized on every log line | Partial |
| 9 | `/logging-trigger` | One `log.debug` fires 7 SELECTs + CME swallowed by SLF4J | **Yes (200)** |
| 9b | `/logging-trigger-no-tx` | `LazyInitializationException` swallowed by SLF4J | **Yes (200)** |
| 10 | `/id-mutation` | `@Id` setter → `UnexpectedRollbackException` bypasses try/catch | No (500) |
| 10b | `/id-mutation-no-tx` | `@Id` setter → phantom merge, misleading error message | No (500) |
| 11 | N/A | `@Version` in `equals()` → entity unreachable in `HashSet` after every update | **Yes (200)** |

Seven of thirteen disasters return **200 OK** with no exception reaching the caller. These are the ones that survive code review, pass tests, and make it to production. The noisy ones at least tell you something is wrong.

## Part IV: The @Version Disaster

### Disaster 11: `equals()` Breaks After Every Update (Silent)

`@Data` includes `@Version` fields in `equals()`. After every `merge()`, the version increments. The same row before and after an update is no longer `equals` to itself, silently breaking every deduplication set, cache, or collection that held the entity before the update.

```java
User user = userRepository.findById(1L).orElseThrow(); // version = 0
Set<User> cache = new HashSet<>();
cache.add(user);

assertTrue(cache.contains(user)); // true — version 0, bucket X

user.setUsername("NewName");
userRepository.saveAndFlush(user); // version incremented to 1

assertFalse(cache.contains(user)); // false — hashCode changed, wrong bucket now
```

The entity is still physically in the set. Iterating it still yields the object. But any lookup by reference silently misses. No exception. **200 OK.**

The version field exists to detect concurrent modification. `@Data` turns it into an equality breaker for every set and map that holds the entity across a save. Chef's kiss.

## In Defense of `@Data`: It Works, Just Not Here

After twelve disasters it would be easy to conclude that `@Data` is cursed. That would be unfair.

`@Data` does exactly what it says. For DTOs, request bodies, response payloads, and simple value containers with no lifecycle and no associations, it works perfectly and is encouraged. The disasters above don't happen because `@Data` is broken. They happen because `@Data` generates `equals()`, `hashCode()`, and `toString()` over **all fields**, and that assumption only holds when all fields are stable values that don't change after construction.

JPA entities fail that condition on multiple fronts: lazy associations require an open session to read, bidirectional references create cycles, and `id` mutates from `null` to assigned at persist time.

The practical rule: if the class has any of the following, `@Data` will eventually cause one of the disasters above.

| Field annotation or type | Risk |
|--------------------------|------|
| `@OneToMany` / `@ManyToMany` | `toString` / `equals` recursion, hydration storm |
| `@ManyToOne` / `@OneToOne` | Proxy asymmetric equality, recursion |
| `@Id @GeneratedValue` | `HashSet` corruption, `setId()` setter |
| `@Version` | `equals()` breaks after every update |
| `@Lob` / `TEXT` column | LOB bomb in every log line |

Use `@Data` freely on pure data carriers. Keep it away from anything Hibernate manages.

## The Deeper Problem: Mutability

Most of the disasters above share a common root beyond just JPA. `@Data` generates `equals()` and `hashCode()` over mutable fields. The moment any of those fields change after the object is put into a hash-based structure, the contract breaks. Silently.

JPA entities are particularly brutal in this regard because mutation is basically their job description: `id` goes from `null` to assigned, `@Version` increments on every update, lazy collections initialize mid-use. The object's state is fundamentally unstable across its lifecycle.

But this isn't unique to JPA. Any mutable class with `@Data` is sitting on the same landmine. The fuse is just shorter with entities.

The obvious answer for everything that doesn't need mutation: use Lombok's `@Value`, or just use Java records. Both give you immutability by default. Fields can't change after construction, so `equals()` and `hashCode()` stay stable, hash-based collections stay consistent, and a whole class of bugs simply can't happen. Less mutation to worry about, less surface area for `@Data` to detonate on.

Save mutability for the things that genuinely need it. JPA entities do. Your DTOs and response payloads almost certainly don't. And in the rare case they do, Lombok's `@With` generates copy methods that return a new instance with the changed field, keeping the original immutable. Mutation without the footgun.

## The Fix

The [previous article](./2026-05-08-how-to-jpa-entity-equals-and-hashcode.md) covers the `equals()`/`hashCode()` side in full depth. Short version:

**For `equals()`/`hashCode()`:** base them solely on the primary key, using Hibernate's effective class instead of `getClass()` to handle proxies correctly.

**For `toString()`:** use `@ToString.Exclude` on every association field and every `@Lob`/`TEXT` column. `toString()` must never trigger lazy loading and must never recurse.

**For the `@Id` setter:** don't expose one. Use `@Setter(AccessLevel.NONE)` on the `id` field, or drop `@Data` entirely in favour of explicit `@Getter` + `@Setter`.

The nuclear option, making everything intentional:

```java
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"posts", "comments", "biography"})
@Getter
@Setter
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    @Setter(AccessLevel.NONE)
    private Long id;

    // ...
}
```

Notice that `@Data` is gone. Every capability it provided has been replaced with something intentional. At this point you've typed more Lombok annotations than you saved, and the annotation that was supposed to reduce boilerplate has become the boilerplate.

:::danger[The Final Verdict]

Do not put `@Data` on a JPA entity. Not "be careful when you put `@Data`." Not "put `@Data` but add some excludes." **Do not put it at all.**

`@Data` was designed for simple value objects: DTOs, configuration records, data transfer containers with no lifecycle, no lazy loading, no bidirectional associations, no primary key semantics. JPA entities are none of those things.

The annotation is not buggy. It does exactly what it says. The problem is that what it says is precisely wrong for the context you're using it in.

:::

The PoC project that produced every log excerpt referenced in this article is available at [lombok-disaster](https://github.com/vulinh64/lombok-disaster). Clone it, run `docker compose up -d`, hit the endpoints, and watch the disasters unfold in your own terminal.

> *P.S. If you are reading this and you have `@Data` on a JPA entity in a production codebase: I am sorry. The good news is that none of these disasters require a database migration to fix. The bad news is that several of them have been silently corrupting data this whole time and you may not have noticed. Start with the silent ones in the scoreboard. Those are the ones already in production doing their quiet worst.*
