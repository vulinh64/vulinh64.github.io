---
slug: java-thread-safety
title: Java's Journey to Thread Safety
authors: [vulinh64]
tags: [java, thread-safety]
description: Everything you need to know about creating singleton objects in Java - from the disasters to the victories
---

This guide is your trusty sidekick on a quest to make your Java apps behave in a polite, orderly, and thread-safe manner. We'll go from making your code so chill it doesn't even have state, to wielding mighty locking mechanisms that make sure everyone takes turns.

<!-- truncate -->

So, you're in a tech interview, heart pounding, and they hit you with the classic:

> What is thread safety, and how can you ensure it?

You might want to laugh (or cry) at how simple "Hello, World" seems in comparison. Thread safety is crucial when your application isn't just saying "Hi" but is managing your bank account or helping thousands of people shop online. Without the right bouncers at the data club, you're looking at corrupted data, race conditions that make no sense, and states so inconsistent they'd make a chameleon blush. So, let's dive into how to wrangle these concurrent beasts, each with its own quirks and perks.

## The Stateless Approach

Want to know the easiest way to achieve thread safety? Just don't have any shared mutable state! Boom. Problem solved. When your code is stateless, it's like a lone wolf -- each thread does its own thing with its own toys (local variables), so there's zero chance of them bickering over who gets to play with what.

Utility classes are the poster children for this Zen-like approach. Every time a thread calls a utility method, it gets its very own playground on the stack, no sharing, no fighting. Check it out:

<details>

```java
public class MathUtility {

  // Can be public to let other classes access this static field
  public static final double PI = 3.14;

  // A good practice is to always have a private constructor
  // that throws exception in your utility classes
  private MathUtility() {
    throw new UnsupportedOperationException("No utility class instance for you!");
  }

  public static double computeCircleArea(double radius) {
    // local variable that only the current thread can use
    var squaredRadius = radius * radius;

    return PI * squaredRadius;
  }
}

```

The `PI` constant demonstrates the immutability approach (covered next), while the methods showcase perfect stateless design. Since there's no shared mutable state, multiple threads can safely call these methods concurrently without any synchronization overhead.

</details>

:::tip

Stateless designs are like the cool kids in functional programming. Give them the same input, and they'll always give you the same output. Predictable and testable? Yes, please!

:::

## The Unbreakable Immutability: Once Born, Forever Fixed!

Sometimes, state is like that one friend who just has to come to the party. When you can't avoid state, make it immutable. This means once an object is created, it's set in stone -- no sneaky modifications allowed. Immutable objects are inherently thread-safe because, well, you can't mess with them! Plus, the JVM loves them and can pull off some cool tricks like escape analysis.

:::warning[Just a mischievous whisper]

while `final` sounds unbreakable, Java's Reflection API can (and will) make it weep softly in a dark corner. And for truly unsettling fun, other memory tools like Cheat Engine exist to prove that nothing is truly "set in stone." You likely won't ever need this dark knowledge, but it's proof that humans are equally adept at building beautiful things and then gleefully smashing them.

:::

### Traditional Immutable Classes

The classic way to go immutable is with final classes and final fields. It's like putting your variables in a vault and throwing away the key.

<details>

```java
public final class Point {

  private final double x;
  private final double y;

  public Point(double x, double y) {
    this.x = x;
    this.y = y;
  }

  // Getters and setters omitted for brevity
}
```

If you're rocking Lombok (and why wouldn't you be?), you can achieve immutability with way less typing. Because who has time for boilerplate?

```java
import lombok.*;

@Data
@Builder
public class Point {

  // @lombok.Data makes all fields final
  // Provide all-args constructor and getters

  double x;
  double y;
}
```

</details>

### Java Records: The Modern Approach

Java Records, hitting the scene with Java 16, are like the ultimate mic drop for immutable data. One line, and you get all the good stuff: immutability, plus `boolean equals(Object)`, `int hashCode()`, and `String toString()` for free. Say goodbye to the final keyword in your mind!

<details>

<summary>What? You expected anything fancy here?</summary>

```java
// One line to make you forget that final keyword exists
public record Point(double x, double y) {}
```

</details>

### Caveats of State Immutability

While immutability is awesome for thread safety, it's not a free lunch. Every time you need to "change" an immutable object, you're actually creating a brand new one. That's a bit of object creation overhead.

Take a look at this example:

<details>

```java
import java.util.List;

public class Transformer {

  public record Point(double x, double y) {

    public Point withX(double x) {
      return Double.compare(this.x, x) == 0 ? this : new Point(x, this.y);
    }

    public Point withY(double y) {
      return Double.compare(this.y, y) == 0 ? this : new Point(this.x, y);
    }
  }

  public List<Point> toThirdQuadrant(List<Point> points) {
    return points.stream()
        // Only take the points from 1st quadrant
        .filter(p -> p.x() > 0 && p.y() > 0)
        // Negate the value of x and y, for 3rd quadrant
        // This will create a transitional objects on the fly
        // for each original object
        .map(p -> p.withY(-p.y()).withX(-p.x()))
        .toList();
  }

  // Direct object instantiation via "new" keyword
  public List<Point> toThirdQuadrant2(List<Point> points) {
    return points.stream()
        .filter(p -> p.x() > 0 && p.y() > 0)
        .map(p -> new Point(-p.x(), -p.y()))
        .toList();
  }
}
```

</details>

The JVM's got some smart tricks (like escape analysis and JIT compilation) to make some of these temporary objects disappear, especially in "hot" code that runs a lot. But for really complex transformations, you might feel a bit of a performance hit. Still, it's generally a small price to pay for rock-solid thread safety and code that's actually clear to read.

And let's be real, it's way, way better than mutating your objects mid-transformation. That's how you get sneaky bugs that only show up on a full moon during a leap year. Seriously, if you're mutating shared state without a good reason, it's probably time to rethink your life choices... I mean, your design choices.

:::tip

You can use `@lombok.With` to automatically generate "wither" methods for your data classes, creating new instances with modified fields while keeping the original immutable.

:::

## The `synchronized` Chronicles: When Immutability Is Insufficient

:::info[Are you here before?]

If you are here for the first time, continue reading!

If you came here from [this part](#the-volatile-keyword-always-up-to-date), well, click there and go back!

:::

Alright, let's face it. Data changes. It's the circle of life in programming. And sometimes, you just have to let your data be mutable. Or maybe you're in a situation where multiple threads trying to do the same thing at once would cause utter chaos: data corruption, race conditions (the digital equivalent of everyone trying to grab the last cookie), and general state inconsistencies.

Enter the `synchronized` keyword! Think of it as the ultimate bouncer at the club of your code. It lets only one thread in at a time to do its thing inside a specific block or method. This "mutual exclusion" is your first line of defense against concurrency nightmares.

<details>

```java
public class GlobalState {

  // Dedicated lock object - preferred over synchronizing on "this".
  private final Object lock = new Object();
  
  // You can add as many "locks" as you need. Better than locking the whole instance.

  // recommend this field to be volatile
  // but will be covered next section (suspense!)
  private int currentCounter = 0;

  public synchronized void increase() {
    currentCounter++;
  }

  // Generally recommended over synchronized method
  // which generally mean synchronized (this). More precise locking!
  public void increase2() {
    synchronized (lock) {
      currentCounter++;
    }
  }

  // No need for synchronized here
  // but recommends volatile keyword
  // more on that later. Stay tuned!
  public int getCounter() {
    return currentCounter;
  }
}

```

</details>

:::tip

`synchronized` on a null object? Prepare for a `NullPointerException`! Your IDE will warn you, but it's a good reminder that a monitor needs to exist to be acquired.

:::

### Caveats of Being `synchronized`

`synchronized` is effective, no doubt. But it's also a bit of a control freak. It lacks finesse when you need things like:

* _"Hey, if the lock isn't free in 5 seconds, I'm out!"_ (Timeout capabilities)

* _"Can I just give up waiting for this lock and do something else?"_ (Interruptible lock acquisition)

* _"Shouldn't the thread that asked first get the lock first?"_ (Fairness to prevent thread starvation)

* _"Can I just try to grab the lock without getting stuck?"_ (Non-blocking lock attempts)

* _"Why are readers waiting for writers, and writers waiting for readers, when they could totally coexist?"_ (Separate read/write locks for read-heavy stuff)

That's where the fancy pants `Lock` implementations from the `java.util.concurrent.locks` package (since JDK 5, bless its heart) come in to save the day!

## The Programmatic Locks

If synchronized feels like wearing a straitjacket, Java's Lock classes are your custom-tailored superhero suit. They give you way more granular control. We're talking `ReentrantLock`, `ReentrantReadWriteLock`, and `Semaphore`. And there are more for you in waiting!

### Using `ReentrantLock`

`ReentrantLock` does what `synchronized` does, but with a lot more flair:

<details>

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class YourBusinessService {

  // True means fair mode. No cutting in line!
  private final Lock lock = new ReentrantLock(true);

  public void executeBusiness() {
    lock.lock(); // Grab the lock!

    try {
      // Do your super important business here. Only one thread at a time, please!
    } finally {
      lock.unlock(); // Always, always release the lock! Don't be that guy.
    }
  }

  public void tryExecuteBusiness() {
    // Give up after 5 seconds of waiting. My patience has limits!
    if (!lock.tryLock(5, TimeUnit.SECONDS)) {
      // Nope, couldn't get it. Moving on!
      return;
    }

    try {
      // Do your business here
      // If tryLock() returns true, the lock is automatically acquired. Fancy!
    } finally {
      lock.unlock(); // Phew, done! Let go.
    }
  }
}

```

</details>

### Leveraging `ReadWriteLock`

A `ReadWriteLock` maintains a pair of associated locks: one for read-only operations and one for writing.

Here is a simple example of how `ReadWriteLock` can be used:

<details>

```java
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class GlobalState {

  // ReadWriteLock can be made fair
  private final ReadWriteLock lock = new ReentrantReadWriteLock(true);

  private int currentCounter = 0;

  public void increaseCounter() {
    var writeLock = lock.writeLock();

    writeLock.lock();

    try {
      currentCounter++;
    } catch (InterruptedException interruptedException) {
      Thread.currentThread().interrupt();
    } finally {
      writeLock.unlock();
    }
  }

  public int getCurrentCounter() {
    var readLock = lock.readLock();

    readLock.lock();

    try {
      return currentCounter;
    } finally {
      readLock.unlock();
    }
  }
}

```

This pattern is ideal for scenarios like caching systems, configuration management, or any data structure with frequent reads and infrequent writes.

</details>

#### Key characteristics

* Multiple concurrent readers: Go nuts, read all you want, as long as no one's scribbling in the margins.

* Exclusive writer: One writer, one lock. No one else gets in (readers or writers) until the writer is done.

* Read-write coordination: Readers don't block other readers, and writers have the whole place to themselves. Great for when you read a lot more than you write!

:::tip

Lombok comes with the support of both `Lock` and `ReadWriteLock`. The above code can be simplified by using Lombok's `@lombok.Locked` annotations:

<details>

<summary>Example of Lombok's Lock annotations</summary>

Just a heads-up: You'll need Lombok `1.18.32` or higher. Read the detail [Lombok's Lock article](https://projectlombok.org/features/Locked) for more details.

```java
import lombok.Locked;

public class GlobalState {

  private int currentCounter = 0;

  @Locked.WriteLock
  public void increaseCounter() {
    currentCounter++;
  }

  @Locked.ReadLock
  public int getCurrentCounter() {
    return currentCounter;
  }

  @Locked
  public void doSeriousBusiness() {
    // Your serious, single-handed uninterruptible business here
  }
}
```

</details>

:::

### Using `Semaphore` for Resource Control

A `Semaphore` is like a traffic cop for your resources. It hands out a fixed number of permits, and only threads with a permit can access the shared resource. Unlike `ReentrantLock` (which is a one-thread, one-lock kind of deal), a `Semaphore` is chill enough to let one thread acquire a permit and another thread release it. Super flexible for things like connection pools or task queues.

Here's an example demonstrating `Semaphore` usage to limit concurrent access to a resource:

<details>

```java
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

public class SharedAccess {

  // Allow up to 3 concurrent threads to access the resource.
  // Also specify fairness here, because we're not savages.
  private final Semaphore semaphore = new Semaphore(3, true);

  public void accessResource() {
    // Attempt to acquire a permit with a 5-second timeout.
    if (!semaphore.tryAcquire(5, TimeUnit.SECONDS)) {
      return; // Timed out. I am going home!
    }

    try {
      // Your business execution here. You got the permit, go for it!
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt(); // Always be polite and handle interruptions.
    } finally {
      // Release the permit. Can be done by any thread, the semaphore doesn't judge.
      semaphore.release();
    }
  }

  // Example of releasing a permit from a different thread.
  // "I'm busy, can you drop off my permit?"
  public void releasePermit() {
    semaphore.release();
  }
}
```

In this example, `Semaphore` is like the bouncer letting only three threads into the exclusive resource club at a time. The `releasePermit()` method shows off its flexibility -- a permit can be released by a different thread, which is super handy for producer-consumer setups where one thread creates a task and another completes it, freeing up a resource.

</details>

#### Key Characteristics of `Semaphore`

* Permit-based access: _"Only 3 cars at a time on this bridge!"_

* Flexible release: _"I picked up the permit, but my buddy can drop it off."_

* Fairness option: _"First come, first served, buddy."_

* Non-blocking and timed acquisition: _"Can I get a permit? If not now, how about in 5 seconds?"_

:::tip 

Use `Semaphore` when you need to put a cap on how many threads can use a fixed number of resources. Especially useful when the thread that gets the permit might not be the one that releases it. Think of it for connection pools or limiting concurrent requests.

:::

### Caveats with Virtual Threads in JDK 21+

Okay, listen up. JDK 21 brought us virtual threads (Project Loom), which are super lightweight and awesome for tasks that spend a lot of time waiting (like talking to a database or a web service). But here's the catch: good old synchronized blocks can "pin" these virtual threads to heavier platform threads, slowing things down. Not cool. So, for virtual threads, you'll want to lean on `ReentrantLock` or `ReentrantReadWriteLock` to avoid this pinning problem, as JEP 444 warned us.

:::note

Even though JEP 491 (JDK 24) fixes some of the pinning with `synchronized`, enterprise environments are like giant cargo ships -- they don't turn on a dime. So, until JDK 25 (the next LTS) is universally adopted, sticking with the `Lock` implementations for virtual threads is the smart move. Better safe than sorry, right?

:::

## The `volatile` Keyword: Always Up-to-Date

You know how threads sometimes get a little too comfortable and cache variables in their own little bubbles (CPU registers or local memory)? That's like them having an old copy of a newspaper when the breaking news just hit! If another thread changes the shared variable, the first thread might be reading stale news, leading to all sorts of inconsistent reads.

Enter the `volatile` keyword! It's like making sure every read and write to a variable always goes straight to the main memory. No caching, no old news. This guarantees that all threads see the latest value. Instantly.

Plus, `volatile` is like a strict editor: it prevents the JVM and CPU from reordering instructions around the variable's access. This is super important because compiler optimizations, while usually good, can sometimes play tricks with the order of operations, leading to bizarre bugs. So, when threads are just reading shared state without much writing, but visibility is key, volatile is your friend.

Here's our [previous](#the-synchronized-chronicles-when-immutability-is-insufficient) example again, now with volatile for that extra visibility boost:

### With `volatile`

<details>

<summary>Updated `GlobalState` class</summary>

```java
public class GlobalState {

  // Dedicated lock object - preferred over synchronizing on "this"
  private final Object lock = new Object();

  // note the volatile keyword here. Fresh data, always!
  private volatile int currentCounter = 0;

  // other methods
}
```

</details>

### Example: Using `volatile` for a Status Flag

Consider a scenario where a thread monitors a flag to stop processing:

<details>

```java
public class TaskController {

  private volatile boolean isRunning = true; // Volatile ensures this flag is always fresh!

  public void stopTask() {
    isRunning = false; // Write is immediately visible to all threads. Poof, task stops!
  }

  public void runTask() {
    while (isRunning) { // Checking the freshest value of isRunning
      try {
        // Perform task here
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt(); // Don't forget to clean up after interrupts!
      }
    }
  }
}
```

In this example, if `isRunning` wasn't `volatile`, the `runTask()` thread might keep a cached `isRunning = true` value and run forever, even after `stopTask()` sets it to false. `volatile` saves the day by forcing it to check the main memory, seeing the updated `false`, and stopping the task. Phew!

</details>

### When to Use `volatile`

The `volatile` keyword is perfect for:

* Single-writer, multiple-reader scenarios: When one thread is like the news anchor updating a status, and everyone else is just watching, volatile makes sure readers see the latest broadcast without needing heavy synchronized locks for every glance.

* Lightweight synchronization: When you just need visibility, not a full-blown bouncer. volatile avoids the overhead of locks.

* Preventing instruction reordering: It's like telling the compiler, _"No funny business with the order of these operations!"_ Keeps your program's logic intact.

### Limitations of `volatile`

* No atomicity: `volatile` guarantees visibility, but it doesn't mean operations like `currentCounter++` are thread-safe. That's actually three steps (read, increment, write), and a thread could get interrupted in the middle. For atomic updates, you need `synchronized` or `AtomicInteger`.

* Not a replacement for locks: If you need strict mutual exclusion or complex coordination, don't ditch your `synchronized` blocks or `ReentrantLock` yet. `volatile` is good for visibility, not for controlling who gets to do what when.

* Performance considerations: While lighter than locks, frequent writes to volatile variables can still cause some performance hiccups due to "memory barriers." It's like building little walls in memory.

## The Atomicity: Either We Are Golden, or We Failed Together

When you need operations to be truly "all or nothing" -- either they complete perfectly or they don't happen at all -- the `java.util.concurrent.atomic` package is your best friend. Classes like `AtomicInteger`, `AtomicLong`, `AtomicReference`, and `AtomicBoolean` let you perform thread-safe atomic operations without explicit locks! 

How? They use magical low-level hardware instructions (like Compare-And-Swap, or CAS) to make sure things happen in one uninterruptible go. They're like the atomic bomb of thread safety, addressing volatile's one weakness: lack of atomicity for multistep operations.

### Why Use Atomic Classes?

Unlike `volatile`, which just makes sure everyone sees the same value, atomic classes guarantee that operations like incrementing a counter or updating a reference are executed as a single, indivisible unit. This often means you can ditch those `synchronized` blocks, reducing contention and boosting performance, especially when tons of threads are trying to get in on the action.

### Example: Using `AtomicInteger`

Here’s an updated version of the GlobalState example from the Synchronization section, using AtomicInteger to replace `synchronized` and `volatile`:

<details>

```java
import java.util.concurrent.atomic.AtomicInteger;

public class GlobalState {

  // AtomicInteger provides atomic operations and visibility
  private final AtomicInteger currentCounter = new AtomicInteger(0);

  public void increase() {
    // Atomic increment, no synchronization needed
    currentCounter.incrementAndGet();
  }

  public int getCounter() {
    // Atomic read, guaranteed to see the latest value
    return currentCounter.get();
  }

  // Example of compare-and-swap for conditional updates
  public boolean tryIncreaseTo(int expected, int newValue) {
    return currentCounter.compareAndSet(expected, newValue);
  }
}
```

In this example, `AtomicInteger` makes `incrementAndGet()` thread-safe without needing any bulky locks. And `get()` always gives you the absolute latest value. The `compareAndSet(int, int)` method is a neat trick for "optimistic locking" – it only updates the counter if its current value is what you expect it to be, preventing overwrites if another thread snuck in first.

</details>

### Example: Using `AtomicReference` for Complex Objects

For thread-safe updates to objects, `AtomicReference` is useful:

<details>

```java
import java.util.concurrent.atomic.AtomicReference;

public class ConfigurationManager {

  private final AtomicReference<String> config = new AtomicReference<>("default");

  public void updateConfig(String newConfig) {
    // Atomically update the configuration
    config.set(newConfig);
  }

  public String getConfig() {
    // Always see the latest configuration
    return config.get();
  }

  public boolean tryUpdateConfig(String expected, String newConfig) {
    // Update only if the current config matches the expected value
    return config.compareAndSet(expected, newConfig);
  }
}
```

Here, `AtomicReference` ensures your `String` configuration is updated safely across threads. `compareAndSet(T, T)` lets you update conditionally without getting tangled in locks.

</details>


### Key Features of Atomic Classes:

* Atomic operations: `incrementAndGet()`, `compareAndSet()` – these are like tiny, perfectly executed transactions.

* Lock-free design: They use CAS, which is often more efficient than traditional locks, especially with less contention.

* Visibility guarantees: Just like `volatile`, atomic classes ensure updates are seen by all threads.

* Flexible updates: Need to do something more complex than just incrementing? Methods like `updateAndGet()` let you define custom logic, all atomically!

### When to Use Atomic Classes

* Simple atomic updates: Counters, accumulators – `AtomicInteger` or `AtomicLong` are your go-to.

* Object references: Need to safely swap out an object? `AtomicReference` is your guy.

* High-concurrency scenarios: When you have tons of threads vying for a single variable, CAS operations are usually more efficient than locks.

* Custom updates: Need to do a bit more than just increment? `updateAndGet()` with a lambda lets you apply custom logic atomically.

### Limitations of Atomic Classes

* Complex coordination: If you need multiple operations to happen atomically together, atomic classes won't cut it. You'll still need `synchronized` or `Lock`.

* Performance under contention: While CAS is great, if there's super high contention (threads constantly trying to update the same thing), you might see a lot of retries, which can hurt performance. Sometimes, a good old lock is better there.

* Limited scope: They're for single-variable updates, not for coordinating access to a whole bunch of variables.

## Thread-Safe Collections: Safe Concurrent Access

So, you're juggling collections in a multithreaded environment. Using plain old `ArrayList` or `HashMap` is like playing with fire – one concurrent modification and BAM! `ConcurrentModificationException` rears its ugly head, or worse, corrupted data. Java, being the benevolent overlord it is, gives us a bunch of thread-safe collection options, each tailored for different situations. We're talking concurrent collections, synchronized wrappers, and even immutable collections.

### Thread-Safe Collection Options

Here’s an example demonstrating various thread-safe collection options:

<details>

```java
// use concurrent hash map
var concurrentHashMap = new ConcurrentHashMap<Integer, String>();

// copy on write array list is another example of thread-safe collections
var copyOnWriteArrayList = new CopyOnWriteArrayList<String>();

// factory method that create a synchronized list wrapper
var synchronizedList = Collections.synchronizedList(Arrays.asList(1, 2, 3, 4, 5, 6, 7));

// non synchronized map
var maps = HashMap.<Integer, String>newHashMap(2);

maps.put(1, "A");
maps.put(2, "B");

var synchronizedMap = Collections.synchronizedMap(maps);

// immutable lists are inherently thread-safe
var immutableList = List.of(1, 2, 3, 4, 5);

// and so is immutable map
var immutableMap = Map.ofEntries(Map.entry(1, "A"), Map.ofEntries(2, "B"));
```

</details>

### Key Thread-Safe Collection Types:

#### `ConcurrentHashMap`: The Multitasking Marvel

* Uses fancy fine-grained locking or even lock-free magic for concurrent access.

* Best for: High-concurrency situations like caches or shared key-value stores.

* You can put and get without locking the entire map, which is super efficient.

* Use case: A shared config store that many threads need to read and write to.

#### `CopyOnWriteArrayList`: The _"Read A Lot, Write A Little"_ Champion

* Every time you modify it, it makes a whole new copy of the underlying array. Reads are then lock-free and super fast!

* Best for: Scenarios where you read way more than you write, like lists of event listeners.

* Trade-off: Can be a memory hog and slow down if you modify it frequently.

* Use case: Keeping a thread-safe list of subscribers in a publish-subscribe system.

#### `Collections.synchronizedList(List)` and `Collections.synchronizedMap(Map)`

* These simply wrap your regular collections and slap a synchronized block on every method.

* Good for: Simple stuff or when you're dealing with old code.

* Downside: Can create a bottleneck under high concurrency because the entire collection is locked for any operation.

* Use case: Protecting a simple list or map in a low-traffic area of your app.

#### Immutable Collections (`List.of(E...)`, `Map.ofEntries(Map.Entry...)`, `Set.of(E...)`)

Introduced in Java 9, these are unmodifiable from birth.

* Inherently thread-safe: Because they literally cannot be changed, there's zero synchronization overhead.

* Best for: Fixed datasets that never need to change, like a list of constant values.

* Trade-off: If you need to "change" them, you have to create a brand-new collection (which is usually fine for these use cases).

* Use case: A fixed list of allowed user roles shared across all threads.

### Practical Example: Concurrent Access with `ConcurrentHashMap`

A simple example of how to use `ConcurrentHashMap`:

<details>

```java
import java.util.concurrent.ConcurrentHashMap;

public class CacheManager {

  private final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();

  public void put(String key, String value) {
    cache.put(key, value); // Thread-safe write
  }

  public String get(String key) {
    return cache.get(key); // Thread-safe read
  }

  public String computeIfAbsent(String key, String value) {
    return cache.computeIfAbsent(key, k -> value); // Atomic operation
  }
  
  // Mechanics to invalidate cache not shown
}

```


With `ConcurrentHashMap`, your cache operations are smooth and thread-safe without you even breaking a sweat. The `computeIfAbsent` method is a shining example of atomic operations – it checks if a key exists, and if not, it computes and puts the value, all in one safe, swift move.

</details>

### Choosing the Right Thread-Safe Collection

* High-concurrency reads AND writes: Go for `ConcurrentHashMap` or `ConcurrentLinkedQueue`. They're built for speed and safety.

* Read-heavy with infrequent writes: `CopyOnWriteArrayList` is your guy. Think event listeners.

* Simple or legacy apps, low concurrency: The `Collections.synchronizedList(List)` or `Collections.synchronizedMap(Map)` wrappers are okay.

* Fixed, unchanging data: Embrace immutability with `List.of(E...)`, `Map.ofEntries(Map.Entry...)`, or `Set.of(E...)`.

### Limitations and Trade-Offs

* Performance overhead: `CopyOnWriteArrayList` and those synchronized wrappers can be slowpokes if you're doing a lot of writing or have high contention.

* Immutability constraints: Can't change 'em. Period. If you need a modified version, you get a whole new object.

* Complexity: Concurrent collections like `ConcurrentHashMap` are powerful, but they require a bit more brainpower to use correctly, especially with their atomic operations.

## Conclusion

And there you have it! Java's journey to thread safety, from the "just don't share stuff" approach to the heavy-duty lock managers and fancy atomic operations. Now go forth and write some rock-solid, thread-safe code without any unexpected tantrums!