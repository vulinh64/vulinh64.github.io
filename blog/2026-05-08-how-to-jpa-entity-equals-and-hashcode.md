---
slug: how-to-jpa-entity-equals-and-hashcode
title: How to JPA Entity's equals() and hashCode()
authors: [ vulinh64 ]
tags: [ java, jpa ]
description: JPA entities are rebellious
image: ./thumbnails/2026-05-08-how-to-jpa-entity-equals-and-hashcode.png
thumbnail: 2026-05-08-how-to-jpa-entity-equals-and-hashcode.png
---

Sometimes, you wonder why JPA entities are a very different beast type in the large world of Java.

{/* truncate */}

## TL;DR

* Go read [this article](https://jpa-buddy.com/blog/hopefully-the-final-article-about-equals-and-hashcode-for-jpa-entities-with-db-generated-ids/). Seriously. But if you're the type who likes to suffer through my rambling first, grab your coffee and settle in.

* Too long? Copy and paste everything from [this class](https://github.com/vulinh64/spring-base-commons/blob/main/src/main/java/com/vulinh/data/base/AbstractEntity.java), then let your JPA entities extend it (and perhaps override the `getIdType()` to return `IdType.CONCRETE` if any of your JPA entities has preset ID value).

Still with me? Good, now let's hear my long rambling below.

## The Problem Nobody Talks About (Until It's Too Late)

Here's the dirty secret about JPA entities that they don't warn you about in those fancy enterprise architecture courses:

**Their IDs are unstable psychopaths**.

### A JPA entity has two lives

* **Transient**: freshly `new`'d up. ID is `null`. The database has never heard of it.

* **Persisted**: after `persist()` / `save()`. ID is suddenly populated, either by the database (sequence, identity column) or by the ORM itself (UUID generator, table generator, and so on).

> The detached state is a different thing, but basically, it comes out from persisted state with an ID, then the entity manager doesn't care for it anymore. Still with an ID.

Your entity quite literally becomes a different person mid-lifecycle.

### Why this wrecks hash-based collections

If you only ever put entities in a `List`, you'd never notice. But the moment you reach for `HashSet`, `HashMap`, or anything hash-based, things get spicy. These collections rely on `equals()`/`hashCode()` staying consistent, and those methods change their answer the second the ID is assigned.

> **Example:**
>
> * You add a transient entity to a `HashSet`. `hashCode()` runs against a `null` ID and the entity gets tucked into bucket X.
>
> * You persist it. The ID is now `42`.
>
> * The next `hashCode()` call returns a completely different value, pointing at bucket Y. The entity is still in the set, just permanently unreachable. It ghosted itself.

### The defaults won't save you

- `Object.equals` falls back to reference identity. That's fine until Hibernate hands you a proxy or a second-level cache copy of the same row.

- `Object.hashCode` is identity-based too, so two instances representing the same row hash to different buckets.

About as useful as a screen door on a submarine.

### And the naive `@Id`-based approach? It explodes catastrophically.

Here's what the naive version typically looks like. It's the kind of thing your IDE happily generates when you click "Generate equals() and hashCode()":

```java
@Entity
public class User {

  @Id
  @GeneratedValue
  private Long id;

  private String name;

  // ... getters, setters, etc.

  @Override
  public boolean equals(Object other) {
    if (this == other) {
      return true;
    }

    // Yes, this is what IDE will generate
    if (!(other instanceof User user)) {
      return false;
    }

    return Objects.equals(id, user.id);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
```

Looks innocent, right? Now watch it implode:

```java
var user = new User();
user.setName("Alice");

var users = new HashSet<User>();
users.add(user);          // hashCode() based on id == null -> goes into bucket X

entityManager.persist(user); // mutates the SAME user object in place; user.id is now 42

users.contains(user);     // false. hashCode() now based on 42 -> looks in bucket Y
users.remove(user);       // does nothing. The entity is still in there, just unreachable.
```

And here's the part that catches everyone off guard: `persist()` does **not** hand you back a shiny new ID-populated copy. It reaches into the very object you passed in and slaps the generated ID onto it. Same instance, same memory address, brand new identity. The reference sitting in your `HashSet`? Same one. The `hashCode()` it returns now? Completely different. The collection has no idea its tenant just grew a new face.

You've just leaked an entity into a `HashSet` you can never get back. Two transient entities with `null` IDs are also considered equal to each other under this implementation, which is its own special kind of fun. Multiply this across a real codebase and you get the bugs we'll spend the rest of this article preventing.

## So We Have to Get Creative

We need plan B:

**Use the effective class's `hashCode()` instead.**

I know what you're thinking: "*Wait, if I use the class hash code, don't all instances of the same class get the same hash?*"

Yes. Yes, they do.

"*Isn't that terrible?*"

A slight speed bump, yes. But not too much.

Well, let's call it a "pragmatic trade-off."

See, the beautiful thing about using the class hash code for transient entities is that it's *stable*. It doesn't change. Your entity can stay in a hash-based collection before persistence without causing any chaos. It's boring. It's predictable. It works.

But here comes the Hibernate nightmare.

## The Hibernate Plot Twist: Proxies Are Sneaky Little Gremlins

Hibernate doesn't just hand you plain entities. It loves to wrap them in proxies for lazy loading and other magic. These proxies look like your entity, walk like your entity, but from Java's perspective, they're a different class entirely.

If you blindly call `getClass().hashCode()`, you might be comparing a real entity with a Hibernate proxy of that same entity. From `equals()` contract perspective, these are different classes. Your logic breaks. Again.

The fix? **Use Hibernate's tools to get the effective class:**

```java
static Class<?> getEffectiveClass(Object object) {
  return object instanceof HibernateProxy proxy
      ? proxy.getHibernateLazyInitializer().getPersistentClass()
      : object.getClass();
}
```

This extracts the real underlying class from the proxy, so you can actually compare apples to apples. Problem solved. You're welcome.

### "But I never put entities in a `HashSet` myself!"

Cute. You think you can dodge this whole mess by simply… not using hash-based collections in your own code. Just stick to `List` everywhere, problem solved, time for lunch.

I have bad news for you: Hibernate has been using them on your behalf this entire time. Behind your back. Under your nose. While you were drinking that lunch.

Map a `Set<Order>` or a `Map<String, Address>` on an entity and Hibernate doesn't politely ask if you'd like a `HashSet`. It hands you a `PersistentSet` (which is `HashSet` in a trench coat) or a `PersistentMap` (you get the idea). The instant a lazy collection wakes up, every child entity inside it gets `hashCode()` called on it to find its bucket. You don't get a say.

So this innocent-looking little snippet?

```java
@Entity
public class Customer {
  @OneToMany(mappedBy = "customer")
  private Set<Order> orders = new HashSet<>();
}
```

Congratulations, you're knee-deep in hash-based collection territory. A broken `equals()`/`hashCode()` will quietly trash those collections during cascade saves, dirty checking, and orphan removal, and the framework will keep smiling at you the whole time. 

> Switching to `List` means you may lose some of the benefits of being a `Set` (for example, `@EntityGraph` with multiple attributes means you absolutely must use `Set`, or risk the wrath of `MultipleBagFetchException`. Try it out, and you will know why.

<details>

<summary>"*Wait, what about the ***sorted*** cousins?*" (a brief detour into `TreeSet`'s identity crisis)</summary>

Oh, you noticed. Yes, Hibernate also ships `PersistentSortedSet` and `PersistentSortedMap`, the introverted siblings of the family, backed by `TreeSet` and `TreeMap`. They couldn't care less about `equals()`/`hashCode()`. They live and die by `Comparable`/`Comparator` instead. So technically, they're someone else's problem.

But hold on. The *flavor* of disaster is suspiciously familiar:

- **`Comparable` (natural ordering)**: for JPA entities, `compareTo()` is almost always written against the ID, because of course it is. Which means it inherits the exact same lifecycle bug we've been ranting about for the last few sections. Transient entity orders one way, persisted entity orders another, `TreeSet` quietly loses track of it. Same villain, different cape. Same fix: keep the ID immutable.

- **`Comparator` (custom ordering)**: *this* one is genuinely scary. Real-world code is full of `Comparator.comparing(User::getName)`, `Comparator.comparing(Order::getCreatedAt)`, `Comparator.comparing(Task::getStatus)`. These fields are not IDs. They are emphatically allowed to change. Names get edited. Orders get shipped. Statuses progress. And the second business logic mutates one of them on an entity already living inside a `TreeSet`, the ordering invariant is quietly violated. No transient-to-persisted plot twist required. A boring Tuesday afternoon is enough.

With `Comparable`-based ordering, the same "ID is sacred" rule from the rest of this article keeps you alive. With `Comparator`-based ordering, either sort on a field that is itself immutable, or treat the `TreeSet`/`TreeMap` as a one-time snapshot and rebuild it after the mutation. Anything else is just a slower, more elegant footgun.

Be careful!

</details>

## The Smart Solution: Meet Adaptive IDs

Now here's where we get clever. Not all IDs are created equal in the JPA world. You've got two main flavors:

1. **Dynamic IDs**: The database assigns them. Most common. Your problem child.

2. **Concrete IDs**: The application assigns them before persistence. These are stable from day one.

With dynamic IDs, yeah, you're stuck using that class-based hashCode for transient entities. It's a compromise, and honestly? It's a good one.

But with concrete IDs, where the application is responsible for setting the ID before it hits the database, you've got a golden opportunity. The ID is *already there*, already *set*, already *stable*. Why not leverage it for `equals()` and `hashCode()`?

This is where adaptive logic shines. We make our implementation smart enough to handle both modes:

### Default Mode: Dynamic IDs

```java
protected IdType getIdType() {
  return IdType.DYNAMIC;
}
```

Most of your entities will use this. For transient entities with `null` IDs, we use the effective class hashCode. Stable. Functional. Boring in the best way possible.

### Concrete Mode: IDs Set by Application

```java
public enum IdType {
  CONCRETE,   // ID set by application before persistence
  DYNAMIC     // ID assigned by persistence provider
}
```

Override `getIdType()` to return `CONCRETE` and suddenly your `equals()` and `hashCode()` use the actual ID. And here's the beautiful part: if someone tries to use a concrete ID entity without setting an ID first, we throw an exception:

```java
private void throwIfNullConcreteId() {
  if (getIdType() == IdType.CONCRETE) {
    throw new ConcreteEntityIdMissingException(
        "CONCRETE entity %s has null id".formatted(getEffectiveClass(this).getName()));
  }
}
```

This is *perfect* because concrete ID entities should never have `null` IDs anyway. They can't be persisted in that state. So failing fast and loud is exactly what you want. No silent corruption. No mysterious bugs. Just a clear error message telling you exactly what's wrong.

## The Full Implementation (Where the Magic Happens)

You've already seen the spoiler. It's bullet #2 from the [TL;DR](#tldr). Grab the source from [`AbstractEntity` on GitHub](https://github.com/vulinh64/spring-base-commons/blob/main/src/main/java/com/vulinh/data/base/AbstractEntity.java), drop it into your project, have your entities extend it, and go enjoy a coffee.

<details>

<summary>"*Why is `equals()`/`hashCode()` declared `final`? Are you trying to ***cage*** me?*" (yes)</summary>

You opened the source, you noticed this:

```java
@Override
public final boolean equals(Object other) { ... }

@Override
public final int hashCode() { ... }
```

That `final` is not a mood swing. It is load-bearing. Here is why I locked the door:

* **Subclasses helpfully "improving" things**: Without `final`, every entity that extends `AbstractEntity` is one well-meaning override away from re-introducing the exact bugs the rest of this article exists to prevent. Someone *will* think, "Oh, I'll just add a quick comparison on `email` here, no big deal." It is a big deal. Two seconds later you are back to mismatched buckets and ghost entities.

* **The Hibernate proxy contract is delicate**: The whole "compare via effective class" dance only works if every entity in the hierarchy goes through the same code path. Allow overrides and any one entity can quietly opt out, breaking comparisons between proxies and real instances in genuinely mysterious ways.

* **Future-you protection**: `final` is a love letter from current-you to 3 AM-you. Current-you knows the trade-offs. 3 AM-you, exhausted and Slack-pinged, will absolutely "just temporarily" override `equals` to ship a bug fix. `final` is the door slamming shut before you can do something you'll regret.

If you genuinely believe you need different `equals`/`hashCode` semantics for a specific entity, that is a strong hint that entity does not want to extend `AbstractEntity`. Build a different base class.

</details>

## How to Use This Beautiful Thing

Most of your entities?

Just extend `AbstractEntity` and forget about implementing `equals()` and `hashCode()`. They'll work correctly with dynamic IDs right out of the box. No fuss. No muss.

Got a special snowflake entity with a concrete ID? Just override one method:

```java
@Entity
public class UserProfile extends AbstractEntity<String> {

  @Id
  private String username;  // Set by application before saving

  @Override
  protected IdType getIdType() {
    return IdType.CONCRETE;
  }

  @Override
  public String getId() {
    return username;
  }
}
```

Done. Your `equals()` and `hashCode()` now respect your preset IDs, and you get an immediate exception if someone tries to persist without setting the ID first.

## The Sacred Rule: ID Immutability

Okay, real talk time. This is the part they don't teach in CS classes, but your production database will teach you at 3 AM on a Monday morning:

**Your ID must be immutable after the entity is created.**

This means two things:

1. **Never call `setId()`**. Once an entity is in a collection, cached, or in a persistence context, never change it via a setter. For concrete, do not change after persisting.

2. **Never mutate the ID's internal state**. If your ID is a composite key (like an `@EmbeddedId`), the object itself must be immutable. Don't just avoid setters; design the ID class as an immutable value type with no way to change its internal fields.

If you violate this, you're silently corrupting hash-based structures. You might not notice for weeks. Then one day:

- Your customer gets charged twice

- A report shows impossible data

- Duplicate entries appear everywhere

- Your manager pages you at 3 AM

- You're explaining in code review why you thought mutating IDs was a good idea

**Example of what NOT to do:**

```java
// BAD: Mutable ID class
@Embeddable
public class CompositeKey {
  private String tenantId;
  private String entityId;

  // These setters are evil
  public void setTenantId(String tenantId) { this.tenantId = tenantId; }
  public void setEntityId(String entityId) { this.entityId = entityId; }
}

// Even worse: Mutating the ID inside the entity
User user = new User();
user.setId(new CompositeKey("tenant1", "user123"));
hashSet.add(user);
user.getId().setTenantId("tenant2");  // ☠️ DEAD INSIDE ☠️
```

**Example of what TO do:**

```java
// GOOD: Immutable ID class
@Embeddable
public final class CompositeKey implements Serializable {

  private final String tenantId;
  private final String entityId;

  public CompositeKey(String tenantId, String entityId) {
    this.tenantId = tenantId;
    this.entityId = entityId;
  }

  // Only getters, no setters
  // Immutable fields can never have setters anyway
  public String getTenantId() { return tenantId; }
  public String getEntityId() { return entityId; }

  @Override
  public boolean equals(Object o) { /* ... */ }

  @Override
  public int hashCode() { /* ... */ }
}
```

Treat IDs like constants. Use them. Love them. But don't change them. Your future self at 3 AM will thank you.

### Bonus

#### Hibernate 6.5+

:::tip

If you're on **Hibernate 6.5 or newer**, congratulations, the universe has gifted you a shortcut. You can skip the whole ceremony above and just use a Java `record`:

```java
@Embeddable
public record CompositeKey(String tenantId, String entityId) implements Serializable {}
```

That. Is. The. Whole. Class. No setters to forget. No `equals()`/`hashCode()` boilerplate that some intern will "helpfully" rewrite next sprint. No `final` keyword sprinkled around like seasoning. The language itself locks the door behind you. If your runtime supports it, this is the version you want, no questions asked.

:::

#### Lombok's `@Value`

:::tip

Allergic to records? Or stuck on a project that hasn't been blessed with a runtime new enough to use them? If Lombok is already on your classpath, you can get *most* of the same benefits with a single annotation:

```java
@Value
@Embeddable
public class CompositeKey implements Serializable {

  String tenantId;
  String entityId;
}
```

`@Value` is Lombok's "I am a value type, please stop me from doing anything stupid" annotation. It makes the class `final`, makes every field `private final`, generates getters, generates `equals()`/`hashCode()`, generates `toString()`, and pointedly refuses to generate any setters. Effectively the manual immutable version above, minus the carpal-tunnel risk.

For tests, you'll often want to construct one of these with mostly-default values, or copy an existing one with a single field tweaked. That's what `@Builder` and `@With` are for:

```java
@Value
@Builder
@With
@Embeddable
public class CompositeKey implements Serializable {
  String tenantId;
  String entityId;
}

// In a test:
var key  = CompositeKey.builder().tenantId("acme").entityId("user-42").build();
var copy = key.withEntityId("user-43"); // returns a NEW CompositeKey, original untouched
```

`@Builder` gives you a fluent constructor without writing one. `@With` gives you "copy-on-write" methods (`withTenantId(...)`, `withEntityId(...)`) that return a *new* instance with that one field changed, leaving the original untouched. Immutability stays intact. Test fixtures stay readable. Everyone wins.

:::

## Conclusion: The Happy Ending

So there you have it: a practical, safe, and elegant way to implement `equals()` and `hashCode()` for JPA entities. We handle Hibernate proxies without breaking a sweat. We support both dynamic and concrete IDs. We fail fast when things go wrong.

It's not rocket science. It's just being honest about the constraints we're working with and making smart compromises instead of pretending Java's defaults are sufficient for an ORM.

Your collections will be stable. Your entities will behave predictably. And maybe, just *maybe*, you'll avoid that 3 AM debugging session where you're explaining to a furious manager why customers got double-charged.

You're welcome. Now go forth and implement this. Your future self is counting on you.

*P.S. If you implement a `setId()` method on your entities after reading this, please reconsider. It is meaningless to do that to an entity with dynamic ID, and for concrete one, stay away from it after persisting. Maybe asking yourself if you would even need such a method in the first place.