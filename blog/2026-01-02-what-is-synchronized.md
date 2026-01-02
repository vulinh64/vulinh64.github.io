---
slug: what-is-synchronized
title: What Is Synchronized In Java?
authors: [ vulinh64 ]
tags: [ java ]
description: Fast or slow?
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

There's a *"mantra"* that gets chanted in developer circles like it's some sort of sacred incantation: 

> *The `synchronized` keyword hurts performance.*
 
You've probably repeated this wisdom during countless interviews, nodding sagely while the interviewer checks their mental scoreboard. But here's a wild thought: 

Have you ever actually questioned ***why***?

<!-- truncate -->

Good news! Being a skeptic in 2025 won't get you burned at the stake like it would have in medieval times (~~or being forced to work with JDK version less than 8~~). Doubt is not just allowed; it's practically a requirement for integrity in software engineering. So let's put on our skeptic hats and actually investigate this claim.

## The Short Answer

Yes, `synchronized` *did* hurt performance. But (and this is a big but) there are nuances thicker than a Java stack trace.

## The *Less* Short Answer

It really ***depends*** on your use case. Are you optimizing for throughput? Strict data integrity? *CPU-bound* or *IO-bound* operations? Your answer will determine whether `synchronized` is your friend or your annoying boss who yelled at you at random.

## What Happens Under the Hood

When you slap a `synchronized` keyword on something, you're essentially asking the JVM to acquire the object's monitor (also known as a lock). This process does incur performance overhead, though it's often less noticeable than you'd think. The JVM is pretty smart about this and will optimize aggressively when needed.

```java
public class Counter {

  private volatile int count = 0;
    
  public synchronized void increment() {
    count++;  // JVM acquires monitor, does work, releases monitor
  }
}
```

Once the lock is acquired, `synchronized` acts like the world's strictest bouncer at an exclusive club. Only one thread gets in at a time. Everyone else? They wait outside in the cold, questioning their life choices.

```java
public class ExclusiveClub {

  private final Object lock = new Object();
    
  public void vipEntry() {
// highlight-start
    synchronized (lock) {
// highlight-end
      // Only one thread at a time gets to party here
      System.out.println(Thread.currentThread().getName() + " is inside!");
      // Other threads are outside, probably checking their phones
    }
  }
}
```

## Funny Times!

Here's a fun fact that'll make you chuckle (or cry, depending on your debugging history): trying to synchronize on a null object will gift you a delightful `NullPointerException`.

```java
Object lock = null;
// highlight-start
synchronized(lock) {  // Surprise! NullPointerException
// highlight-end
  System.out.println("This will never print");
}
```

If you are using JDK 14+, you will get this fancy (or painful) message:

```text
Cannot enter synchronized block because "lock" is null
```

You cannot acquire what doesn't exist without making a silly goose of yourself. The JVM basically looks at you and says, *"Really? You want me to lock... nothing? Is this a metaphorically philosophy question, or you are trying a funny prank?"*

Also, speaking of acquiring something that doesn't exist:

<details>

<summary>A Glimpse Into the Future: Project Valhalla</summary>

When Project Valhalla delivers [value classes](https://openjdk.org/jeps/401) (hopefully before we all retire), you'll get a compile error if you try synchronizing on those instances. If the type is only determined at runtime, expect an `IdentityException` instead, at least according to the latest early access builds.

Why?

Because value classes, just like null objects, don't have monitors to begin with. They're the ghosts of the Java world: they exist, but you can't grab hold of them.

Future candidates for this exclusive "unsynchronizable" club include `Optional`, `LocalDateTime`, and their immutable friends. Plan accordingly!

</details>

## Small Apps: No Big Deal

In your small, mostly single-threaded toy applications, the performance hit from `synchronized` is negligible. Though honestly, if you're working with a single thread, why are you even using `synchronized` in the first place? That's like hiring a bouncer for a party where you're the only guest.

```java
public class LonelyApp {

  private volatile int data = 0;
    
  // Synchronized in a single-threaded app... why though?
  public synchronized void updateData(int value) {
    data = value;
  }
}
```

It's like having a bouncer serve a single customer during the slowest hours of the night. Sure, the bouncer's there, but they're mostly just scrolling through their phone.

## Welcome to the Enterprise Zone

Problems arise when we move to enterprise domains, where things get spicy. In these applications, the performance hits often come from accessing external resources: database visits, third-party API calls, transferring data to and from other services, and so on.

The internal computation stuff (JSON marshaling, validating business objects) takes nanoseconds or microseconds to complete. 

But external resource access?

That takes ***milliseconds*** to even ***seconds*** (and it happens to be the main bottleneck for most enterprise applications). We're talking about a scale difference like comparing human lifespan to shark evolution. Millions of years of difference!

```java
public class CacheManager {

  // Okay, not actually how we use cache, but whatever
  private final Map<String, Object> cache = new ConcurrentHashMap<>();
    
  public synchronized void updateCache(String key) {
    // Internal validation: blazingly fast
    validateKey(key);
        
    // External API call: MILLISECONDS TO SECONDS
    Object data = fetchFromExternalAPI(key);
        
    // Writing to cache: nanoseconds
    cache.put(key, data);
  }
    
  // Meanwhile, 50 other threads are waiting outside...
}
```

When you use `synchronized` on those resource accesses (mostly to protect data integrity, like when writing or evicting caches), you pay with performance bottlenecks. When multiple requests start piling up, delays range from milliseconds to seconds, and sometimes even *minutes*.

That strict bouncer is now a real liability. And what's worse? There's no order to this line. Whichever thread is faster gets served first. This is what we call thread starvation, where threads get blocked for too long without getting their turn.

If race conditions are comparable to anarchy, then this starvation is like organized chaos. Data integrity is respected, sure, but not your performance. And definitely not poor thread #99, which just got cut in line by thread #221 after waiting for what feels like 4 billion years.

```java
public class SlowServiceAPI {

  private final Object lock = new Object();
    
  public void processRequest(String userId) {
    synchronized(lock) {
      // This takes 5 seconds
      callSlowExternalService(userId);
            
      // Thread #1 is happy
      // Thread #2-#100: "Are we a joke to you?"
    }
  }
}
```

## So What Are Your Options?

The `synchronized` keyword is the simplest way to ensure thread safety, but it's about as flexible as a steel beam. Consider these alternatives:

### Java Locks

**Java Locks** for more flexibility and control over thread access: fairness policies, multiple simultaneous reads, finer-grained controls.

```java
public class FlexibleCounter {

  private final Lock lock = new ReentrantLock(true); // fair lock
  
  private volatile int count = 0;
    
  public void increment() {
    lock.lock();
    
    try {
      count++;
    } finally {
      lock.unlock();
    }
  }
}
```

<details>

<summary>JDK 21 times!</summary>

Before JDK 24, `synchronized` and Virtual Threads (introduced in JDK 21) were mortal enemies. Sure, JDK 25 landed in September 2025 with [the fix from JDK 24](https://openjdk.org/jeps/491), but let's be real: most enterprises move slower than a synchronized `StringBuffer`. If you're on JDK 21 (the current hottest LTS), this is still your reality.

```java
// Bad with Virtual Threads (before JDK 24)
public synchronized void problematicMethod() {
  // Virtual thread gets pinned
  // Angery Virtual Thread noise
}

private final Lock lock = new ReentrantLock(true);

public void betterMethod() {
  lock.lock();
  
  try {
    // Virtual thread can yield properly
    // Happy Virtual Thread noise
  } finally {
    // Important! Release the Kraken, I mean Lock
    lock.unlock();
  }
}
```

</details>

### Ditching the Imperative Style

**Non-blocking programming** or **event-driven development** to increase throughput.

That's a story we will be telling for another time! Because this blog post is long enough already!

### Lightweight Options

**Lightweight alternatives** like atomic objects and `volatile` reads:

```java
public class AtomicCounter {

  private final AtomicInteger count = new AtomicInteger(0);
    
  public void increment() {
    count.incrementAndGet();  // Lock-free, much faster
  }
}
```

### Or Have No State That Can Be Changed

**Statelessness** or **immutable objects** (no worries if data is final to begin with):

<Tabs>

<TabItem value="modern-java-records" label="Modern Java Records">

```java
// One line to rule them all!
public record ImmutablePoint(int x, int y) {}
```

</TabItem>

<TabItem value="good-old-class" label="Good Old Immutable Class">

```java
public final class ImmutablePoint {

  private final int x;
  private final int y;
    
  public ImmutablePoint(int x, int y) {
    this.x = x;
    this.y = y;
  }
    
  // No synchronization needed! It's immutable!
}
```

</TabItem>

</Tabs>

Prefer **Java Records** if possible!

### Be Specific What You Lock

When using `synchronized`, use it on a dummy object as a lock instead of locking the whole instance (`synchronized this` or `synchronized` methods). That's why synchronized classes like `StringBuffer` or `Vector` are less prominent nowadays. They're the dinosaurs of Java collections, and we all know what happened to them.

```java
public class BetterLocking {

  private final Object lock = new Object();  // Dedicated lock object
  
  private volatile int sharedData = 0;
    
  public void updateData(int value) {
    synchronized(lock) {  // Lock only this specific resource
      sharedData = value;
    }
  }
    
  // Other methods can run concurrently if they don't need sharedData
}
```

## The Verdict

So there you have it: your complete answer for why `synchronized` can be a performance hit, especially for throughput, and when it becomes a serious problem.

Is it bad? Is it worth the price of data integrity?

The answer is the most developer thing ever: **it depends**. 

Measure your projects. 

Profile your code (yeah yeah, easy said than done, but still).

Choose the best approach for your specific use case.

Because `synchronized` might be the easy answer, but it's not always the right one.