---
slug: java-thread-safety
title: Java's Journey to Thread Safety
authors: [vulinh64]
tags: [java, thread safety]
description: Everything you need to know about creating singleton objects in Java - from the disasters to the victories
---

Thread safety ensures data consistency and integrity in multithreaded environments, preventing race conditions and unpredictable behavior. This guide explores robust strategies to make your Java applications thread-safe, from stateless designs to advanced locking mechanisms.

<!-- truncate -->

A common technical interview question is:

> What is thread safety, and how can you ensure it?

Thread safety is critical when multiple threads access shared resources concurrently. Without proper safeguards, this can lead to data corruption, race conditions, or inconsistent states. While simple applications like "Hello, World" may not require thread safety, enterprise systems -- such as banking platforms or e-commerce backends -- demand it to ensure data integrity. Below, we explore key approaches to achieve thread safety, each with distinct trade-offs and use cases.

## The Stateless Approach

The simplest way to achieve thread safety is to avoid shared mutable state. Stateless designs eliminate data corruption risks because threads operate independently with their own local variables.

Utility classes are a prime example of stateless design. Each thread calling a utility method uses its own stack, ensuring no interference. Here's an example:

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

Stateless designs shine in functional programming paradigms, where methods produce the same output for the same input, enhancing predictability and testability.

:::

## The Unbreakable Immutability

When state is unavoidable, immutability ensures thread safety by preventing modifications after object creation. Immutable objects are inherently thread-safe and benefit from JVM optimizations like escape analysis.

### Traditional Immutable Classes

The classic approach involves creating final classes with final fields:

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

</details>

### Lombok-Enhanced Immutability

If you're using Lombok, you can achieve immutability more concisely:

<details>

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

Java Records, introduced in Java 16, provide a concise way to create immutable data carriers with automatic implementation of `boolean equals(Object)`, `int hashCode()`, and `String toString()` methods. Java records are immutable by design, eliminating problems with their usage in multithreaded environments.

```java
// One line to make you forget that final keyword exists
public record Point(double x, double y) {}
```

### Caveats of State Immutability

While immutability provides excellent thread safety guarantees, it comes with a performance trade-off: object creation overhead during transformations.

Take a look at this example:

<details>

```java
import java.util.List;

public class Transformer {

  public record Point(double x, double y) {

    public static Record withX(double x) {
      return Double.compare(this.x, x) == 0 ? this : new Point(x, this.y);
    }

    public static Record withY(double y) {
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

The JVM's escape analysis and Just-In-Time (JIT) compiler can optimize some of these intermediate object creations, especially in "hot" code paths. However, complex transformations may still incur overhead. This cost is generally acceptable given the thread safety guarantees and code clarity that immutability provides.

Still, it is far better than mutating your objects during transformations. Sometimes, mutating shared state can break without obvious causes, and most of the time, it indicates questionable design that requires refactoring.

:::tip

You can use `@lombok.With` to automatically generate "wither" methods for your data classes, creating new instances with modified fields while keeping the original immutable.

:::

## The `synchronized` Chronicles: When Immutability Is Insufficient

Data can change, and will change. Sometimes, you have no choice but to make your data mutable, or you simply cannot accept multiple threads accessing a single resource and causing all sorts of problems: data corruption, race conditions, state inconsistency, and numerous other concurrency issues.

Enter the `synchronized` keyword, acting like a queue manager that allows only one thread to pass at a time. This intrinsic locking mechanism provides mutual exclusion, ensuring that only one thread can execute a synchronized block or method at any given time.

<details>

```java
public class GlobalState {

  // Dedicated lock object - preferred over synchronizing on "this"
  private final Object lock = new Object();

  // recommend this field to be volatile
  // but will be covered next section
  private int currentCounter = 0;

  public synchronized void increase() {
    currentCounter++;
  }

  // Generally recommended over synchronized method
  // which generally mean synchronized (this)
  public void increase2() {
    synchronized (lock) {
      currentCounter++;
    }
  }

  // No need for synchronized here
  // but recommends volatile keyword
  // more on that later
  public int getCounter() {
    return currentCounter;
  }
}
```

</details>

While effective, synchronized lacks flexibility in scenarios requiring:

* Timeout capabilities to avoid indefinite lock waiting

* Interruptible lock acquisition

* Fairness to prevent thread starvation

* Non-blocking lock attempts

* Separate read/write locks for read-heavy workloads

Starting from JDK 5, you can use various Lock implementations in the `java.util.concurrent.locks` package to address these limitations.

## The Programmatic Locks

If you need more control over synchronization than synchronized provides, Java's Lock classes offer powerful alternatives. Key implementations include `ReentrantLock`, `ReentrantReadWriteLock`, and `Semaphore`.

### Using `ReentrantLock`

ReentrantLock provides the same basic behavior as synchronized but with additional capabilities:

<details>

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class YourBusinessService {

  private final Lock lock = new ReentrantLock(true);

  public void executeBusiness() {
    lock.lock();

    try {
      // Do your business here
    } finally {
      lock.unlock();
    }
  }

  public void tryExecuteBusiness() {
    // Give up after 5 seconds of waiting
    if (!lock.tryLock(5, TimeUnit.SECONDS)) {
      return;
    }

    try {
      // Do your business here
      // If tryLock() returns true, the lock is automatically acquired
    } finally {
      lock.unlock();
    }
  }
}
```

</details>

### Leveraging `ReadWriteLock`

:::note

A `ReadWriteLock` maintains a pair of associated locks: one for read-only operations and one for writing. 

Key characteristics:

* Multiple concurrent readers: Multiple threads can acquire the read lock simultaneously if no thread holds the write lock. 

* Exclusive writer: Only one thread can acquire the write lock, and no other threads can acquire either read or write locks until the write lock is released.

* Read-write coordination: Read operations can proceed concurrently unless a write operation is in progress, improving performance for read-heavy workloads.

This pattern is ideal for scenarios like caching systems, configuration management, or any data structure with frequent reads and infrequent writes.

:::

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

</details>

:::tip

Lombok comes with the support of both `Lock` and `ReadWriteLock`. The above code can be simplified by using Lombok's `@lombok.Locked` annotations:

<details>

<summary>Example of Lombok's Lock annotations</summary>

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

Note that this "shortcut" approach currently does not support fairness or other advanced features like timing out or interruptibility... Moreover, the annotations requires Lombok version `1.18.32` or above.

Read the detail [Lombok's Lock article](https://projectlombok.org/features/Locked) for more details.

:::

:::warning[A Note Regarding Virtual Threads in JDK 21+]

JDK 21's virtual threads (Project Loom) are lightweight and ideal for I/O-bound tasks. However, synchronized blocks can pin virtual threads to platform threads, reducing efficiency. Use `ReentrantLock` or `ReentrantReadWriteLock` to avoid pinning, as noted in JEP 444.

While JEP 491 (JDK 24) resolves pinning issues with synchronized, adoption of JDK 25 (the latest LTS) may be slow in enterprise environments, so prefer Lock implementations for virtual threads.

:::

### Using `Semaphore` for Resource Control

A `Semaphore` manages a fixed set of permits, controlling access to a shared resource pool. Unlike `ReentrantLock`, a `Semaphore` allows a permit to be acquired by one thread and released by another, providing flexibility in scenarios like resource pools or task delegation. This makes it ideal for limiting concurrent access to resources, such as database connections or thread pools.

Key Characteristics of `Semaphore`:

* Permit-based access: Controls the number of threads that can access a resource simultaneously.

* Flexible release: A permit can be released by a different thread than the one that acquired it, unlike locks.

* Fairness option: Can be configured to grant permits in request order.

* Non-blocking and timed acquisition: Supports `tryAcquire()` and timed acquisition for dynamic control.

Here's an example demonstrating `Semaphore` usage to limit concurrent access to a resource:

<details>

```java
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

public class SharedAccess {

  // Allow up to 3 concurrent threads to access the resource
  // Also specify fairness here
  private final Semaphore semaphore = new Semaphore(3, true);

  public void accessResource() {
    // Attempt to acquire a permit with a 5-second timeout
    if (!semaphore.tryAcquire(5, TimeUnit.SECONDS)) {
      return;
    }

    try {
      // Your business execution here
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    } finally {
      // Release the permit, can be done by any thread
      semaphore.release();
    }
  }

  // Example of releasing a permit from a different thread
  public void releasePermit() {
    semaphore.release();
  }
}
```

In this example, Semaphore limits resource access to three threads at a time. The `releasePermit()` method demonstrates that a permit can be released by a different thread, which is useful in scenarios like worker threads completing tasks and freeing resources for others.

</details>

:::tip 

Use Semaphore when you need to control access to a fixed number of resources, especially when acquisition and release may occur in different threads, such as in producer-consumer patterns. 

:::

## The `volatile` Keyword: Always Up-to-Date

In multithreaded environments, threads may cache variables in CPU registers or local memory, leading to inconsistent reads if another thread modifies the shared variable. The `volatile` keyword ensures that reads and writes to a variable are always performed directly to main memory, guaranteeing visibility of the latest value across all threads.

Additionally, `volatile` prevents the JVM and CPU from reordering instructions around the variable's access, which could otherwise cause unexpected behavior due to compiler optimizations. This is particularly important in scenarios where threads read shared state without frequent writes, but synchronized alone may not suffice for visibility.

Here's an updated example from the [previous](#the-synchronized-chronicles-when-immutability-is-insufficient) section, incorporating volatile:

<details>

<summary>Updated `GlobalState` class</summary>

```java
public class GlobalState {

  // Dedicated lock object - preferred over synchronizing on "this"
  private final Object lock = new Object();

  // note the volatile keyword here
  private volatile int currentCounter = 0;

  // other methods
}
```

</details>

### When to Use `volatile`

The `volatile` keyword is ideal for:

* Single-writer, multiple-reader scenarios: When one thread updates a variable (e.g., a status flag) and others read it, volatile ensures readers see the latest value without needing synchronized for reads.

* Lightweight synchronization: When mutual exclusion isn't required, but visibility is critical, volatile avoids the overhead of locks.

* Preventing instruction reordering: Ensures that operations like setting a flag or updating a counter are not reordered by the JVM or CPU, maintaining program correctness.

Example: Using `volatile` for a Status Flag

Consider a scenario where a thread monitors a flag to stop processing:

<details>

```java
public class TaskController {

  private volatile boolean isRunning = true;

  public void stopTask() {
    isRunning = false; // Write is visible to all threads
  }

  public void runTask() {
    while (isRunning) {
      try {
        // Perform task
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
      }
    }
  }
}
```

In this example, `isRunning` is marked `volatile` to ensure that when `stopTask()` sets it to false, the change is immediately visible to the thread running `runTask()`. Without `volatile`, the reading thread might cache `isRunning` as true, causing the loop to continue indefinitely.

</details>

### Limitations of `volatile`

* No atomicity: `volatile` ensures visibility but does not guarantee atomic operations. For example, currentCounter++ is not thread-safe with `volatile` alone, as it involves a read, increment, and write that can be interrupted. Use synchronized or AtomicInteger for atomic updates.

* Not a replacement for locks: If mutual exclusion or complex coordination is needed, use synchronized, ReentrantLock, or other concurrency utilities.

* Performance considerations: While volatile has lower overhead than locks, frequent writes to volatile variables can impact performance due to memory barriers.

## The Atomicity: Either We Are Golden, or We Failed Together

The `java.util.concurrent.atomic` package provides classes like `AtomicInteger`, `AtomicLong`, `AtomicReference`, and `AtomicBoolean` for performing thread-safe atomic operations without explicit locks. These classes leverage low-level hardware instructions (e.g., Compare-And-Swap, or CAS) to ensure atomicity and visibility, complementing the `volatile` keyword by addressing its lack of atomicity for operations like increments or updates.

### Why Use Atomic Classes?

Unlike `volatile`, which ensures visibility but not atomicity, atomic classes guarantee that operations like incrementing a counter or updating a reference are performed as a single, uninterruptible unit. This eliminates the need for synchronized blocks in many cases, reducing contention and improving performance, especially in high-concurrency scenarios.

### Key Features of Atomic Classes

* Atomic operations: Operations like `incrementAndGet()` or `compareAndSet()` are executed atomically, preventing race conditions.

* Lock-free design: Uses CAS operations for efficiency, avoiding the overhead of locks.

* Visibility guarantees: Like `volatile`, atomic classes ensure that updates are visible across threads.

* Flexible updates: Supports complex updates via methods like `updateAndGet()` or `accumulateAndGet()` with custom logic.

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

In this example, `AtomicInteger` ensures that `incrementAndGet()` is thread-safe without locks, and `get()` provides visibility of the latest value. The `compareAndSet` method demonstrates optimistic locking, where the counter is updated only if its current value matches the expected value.

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

Here, `AtomicReference` ensures thread-safe updates to a String configuration, with compareAndSet allowing conditional updates without locks.

</details>

### When to Use Atomic Classes

* Simple atomic updates: Use `AtomicInteger` or `AtomicLong` for counters or accumulators.

* Object references: Use `AtomicReference` for thread-safe updates to objects, such as configurations or shared data structures.

* High-concurrency scenarios: Atomic classes excel in environments with many threads, as CAS operations are more efficient than locks.

* Custom updates: Use methods like `updateAndGet()` with lambdas for complex atomic transformations.

### Limitations of Atomic Classes

* Complex coordination: Atomic classes are not suitable for scenarios requiring multiple operations to be grouped atomically (use `synchronized` or `Lock` instead).

* Performance under contention: While CAS is efficient, high contention can lead to repeated retries, impacting performance. Locks may be better for such cases.

* Limited scope: Atomic classes are designed for single-variable updates, not for coordinating access to multiple variables.

## Thread-Safe Collections: Safe Concurrent Access

When working with collections in a multithreaded environment, standard collections like `ArrayList` or `HashMap` are not thread-safe, as concurrent modifications can lead to data corruption or exceptions like `ConcurrentModificationException`. Java provides several thread-safe collection options, each designed for specific use cases, including concurrent collections, synchronized wrappers, and immutable collections.

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

### Key Thread-Safe Collection Types

#### `ConcurrentHashMap`:

- Uses fine-grained locking or lock-free techniques for concurrent access.

- Ideal for high-concurrency scenarios like caching or shared key-value stores.

- Operations like put and get are thread-safe without locking the entire map.

- Example use case: A shared configuration store accessed by multiple threads.

#### `CopyOnWriteArrayList`:

- Creates a new copy of the underlying array on each modification, ensuring reads are safe without locks.

- Best for scenarios with frequent reads and infrequent writes, such as event listener lists.

- Trade-off: High memory and performance overhead for frequent modifications.

- Example use case: Maintaining a thread-safe list of subscribers in a publish-subscribe system.

#### `Collections.synchronizedList(List)` and `Collections.synchronizedMap(Map)`:

- Wraps a standard collection with synchronized methods, locking the entire collection for each operation.

- Suitable for simple scenarios or legacy code but can lead to contention under high concurrency.

- Example use case: Protecting a list or map in a low-concurrency environment.

#### Immutable Collections (`List.of(E...)`, `Map.ofEntries(Map.Entry...)`, `Set.of(E...)`):

- Created via factory methods introduced in Java 9, these collections are unmodifiable.

- Inherently thread-safe due to immutability, with no synchronization overhead.

- Best for fixed datasets that don’t need modification, like configuration constants.

- Trade-off: Any change requires creating a new collection (unlikely).

- Example use case: A fixed list of allowed values shared across threads.

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


In this example, `ConcurrentHashMap` allows multiple threads to safely read and write to the cache without explicit synchronization. The computeIfAbsent method demonstrates an atomic operation that checks for a key and computes a value if absent, all in a thread-safe manner.

</details>

### Choosing the Right Thread-Safe Collection

- Use `ConcurrentHashMap` or `ConcurrentLinkedQueue` for high-concurrency scenarios with frequent reads and writes.

- Use CopyOnWriteArrayList for read-heavy scenarios with infrequent updates, like event listeners.

- Use synchronized list or map for simple or legacy applications where coarse-grained locking is acceptable.

- Use `List.of(E...)`, `Map.ofEntries(Map.Entry...)`, or `Set.of(E...)` for fixed, immutable datasets that are shared across threads.

### Limitations and Trade-Offs

- Performance overhead: `CopyOnWriteArrayList` and synchronized wrappers can introduce significant overhead under high contention or frequent modifications.

- Immutability constraints: Immutable collections cannot be modified, requiring new instances for updates, which may impact memory usage.

- Complexity: Concurrent collections like `ConcurrentHashMap` are more complex to use correctly compared to synchronized wrappers, requiring careful consideration of atomic operations.