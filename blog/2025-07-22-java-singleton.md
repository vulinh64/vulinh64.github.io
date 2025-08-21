---
slug: java-singleton
title: "Java Singleton: How To (Without Losing Your Sanity)"
authors: [vulinh64]
tags: [java, singleton, design-patterns]
description: Everything you need to know about creating singleton objects in Java - from the disasters to the victories
---

Singleton and its (also singleton) friends are here to rescue (or ruin) your day, depending on how you implement them! Buckle up for a journey through the good, the bad, and the "why does this even compile?"

<!-- truncate -->

## When Does Singleton Actually Make Sense?

Before we dive into the "how," let's talk about the "when".

Here are some legit scenarios where having just one instance makes total sense:

<details>

<summary>Real-world singleton use cases</summary>

* **Database Connection Pools**: You need one single pool to manage all connections efficiently.

* **Logging Services**: One logger to rule them all - multiple loggers writing to the same file is a recipe for chaos.

* **Configuration Managers**: Having multiple config managers is like having more than one micromanaging bosses (nobody wants that).

* **Cache Managers**: Multiple cache instances can lead to inconsistent data and memory waste.

* **Thread Pool Executors**: One executor to coordinate all your background tasks.

* **Application State Managers**: Single source of truth for your app's global state.

</details>

:::warning

Just because you *can* make something a singleton doesn't mean you *should*. Singletons can make testing harder and create hidden dependencies. Use them sparingly and only when you genuinely need global access to a single instance.

:::

## TL;DR for the Impatient

Yes, I got you, here is your `TL;DR`:

<details>

Look, I know you just want the solution. There are several ways to create singleton objects in Java, but really only two that matter:

* **Using static fields with lazy initialization** (the "I enjoy pain" way)

* **Using enums** (the "why didn't anyone tell me this from day one?" way)

The static field approach means making your constructor private so people can't just `new` their way to chaos. But spoiler alert: the enum approach is almost always better, and you'll understand why after reading this.

**Bottom line**: Use enum singletons unless you absolutely need lazy loading, in which case use the Bill Pugh initialization-on-demand holder pattern. Skip everything else unless you're studying for a job interview.

</details>

Come back to this article later and read the whole content if you want more insight. I won't blame you!

## The Eager ~~Beaver~~ Initialization

Every Java developer's first singleton looks something like this:

```java
public class EagerSingleton {
    
  private static final EagerSingleton INSTANCE = new EagerSingleton();

  private EagerSingleton() {
    // No 'new' keyword for you outside this class!
    // You can put initialization logic here
  }

  public static EagerSingleton getInstance() {
    return INSTANCE;
  }

  // Your actual business methods go here
  public void doSomething() {
    System.out.println("Doing singleton things...");
  }
}
```

This is actually not terrible! It's simple, thread-safe (thanks, JVM!), and the `final` keyword makes the reference immutable. The instance gets created when the class loads, whether you need it immediately or not. Think of it like making dinner even when you're not particularly hungry - it's there when you need it!

So we have a pattern that:

✅ Simple, thread-safe, foolproof

⚠️ But no lazy loading: instance created even if never used

## When Lazy Loading Gone Wrong

Then you discover lazy loading and think you're being clever:

```java
public class LazySingleton {

  private static LazySingleton instance;

  private LazySingleton() {
    // Expensive initialization here
  }

  public static LazySingleton getInstance() {
    if (instance == null) {
      instance = new LazySingleton(); // Things could go from bad to worse here
    }
    
    return instance;
  }
}
```

Congratulations! You've just created a singleton that works perfectly... until someone mentions "multithreading" and your beautiful code transforms into a beautiful disaster in production.

<details>

<summary>Nightmare fuels go here</summary>

Multiple threads can simultaneously pass the `instance == null` check, and each thread will happily create its own instance. Sure, only one of them gets to actually assign to the static field (the last one wins), but you've just wasted resources creating multiple expensive objects!

If your singleton does heavy initialization - like loading configuration files, establishing database connections, or computing complex data structures - you're doing all that expensive work multiple times for absolutely no benefit.

This ranges from mildly annoying (wasting memory and making your CPU work overtime for nothing) to absolutely catastrophic: when your initialization has side effects that aren't idempotent - fancy computer science speak for "doing it twice breaks everything."

**Side effects** can either be, but not limited to:

* incrementing counters;

* sending welcome emails;

* reserving resources;

* or writing to audit logs;

* other unspeakable horrors that should not happen more than once;

Your "harmless" threading bug becomes a production incident where users get triple-charged, your database connections are exhausted, or your audit trail looks like it was reading the Bible in a loop.

</details>

## Just Add `synchronized` Then?

So you opt for a fix. And then comes your next "brilliant" idea (not yours, but maybe from **StackOverflow** or some random IT blogs, who knows?):

```java
public class ThreadSafeSingleton {

  private static ThreadSafeSingleton instance;

  private ThreadSafeSingleton() {}

  public static synchronized ThreadSafeSingleton getInstance() {
    if (instance == null) {
      instance = new ThreadSafeSingleton();
    }
    
    return instance;
  }
}
```

This works, but now every single call to `getInstance()` has to wait in line like it's Black Friday at Best Buy.

In this case, only one thread can execute the method at a time - even after the instance exists and no more creation is needed, threads are still forming an orderly queue for absolutely no reason. Your app's performance just took a nosedive, and that's particularly painful in high-throughput environments.

:::info

`synchronized` modifier for the method here acts like an overzealous security officer who checks everyone's ID even after they're already inside the building, have been working for two hours, and are clearly not going anywhere (his reason may be justified, but still...).

:::

You can only hope that the JVM is smart enough to optimize this section.

## Double-Checked Locking Madness and Losing Your Mind

So you get the fancy idea of double-checked locking:

```java
public class DoubleCheckedSingleton {

  // volatile is CRUCIAL here - don't forget it!
  private static volatile DoubleCheckedSingleton instance;

  private DoubleCheckedSingleton() {}

  public static DoubleCheckedSingleton getInstance() {
    if (instance == null) { // First check: "Are we there yet?"
      synchronized (DoubleCheckedSingleton.class) {
        if (instance == null) { // Second check: "Are we there yet?" (for real this time)
          instance = new DoubleCheckedSingleton();
        }
      }
    }
    
    return instance;
  }
}

```

Look at this beautiful monstrosity! Your simple singleton has evolved into something that looks like it escaped from a computer science textbook and is seeking revenge.

The `volatile` keyword is doing the heavy lifting here. Without it, threads might cache the `instance` variable locally, leading to situations where one thread creates the singleton but another thread is still looking at its cached copy where `instance` is still null. The `volatile` keyword ensures all threads see the same, up-to-date value from main memory.

:::note[Historical Background]

**This pattern was completely broken in JDK versions prior to 1.5!** 

Before Java fixed its memory model, the double-checked locking pattern could literally trash your application. Even with `volatile`, you could end up with a partially constructed object - imagine other threads peeking into your changing room while you're only halfway through putting on your shirt. They'd see you "dressed" (non-null reference) but you're actually still getting ready (object not fully initialized).

It was so notorious that it had its own warning labels in programming literature.

Thankfully, if JDK 8 is considered a fossil now, then JDK 4 and below have completed their radioactive half-life cycle down to absolute zero. But it's a good reminder of why sometimes "clever" solutions can bite you in ways you never expected.

:::

This pattern *may* work correctly now, but tools like SonarQube will frown disapprovingly at your code during quality gate checks, and some will outright reject it faster than you can say `synchronized`. 

For more information about how SonarQube warns about the usage of Singleton design pattern, see [their rule article](https://next.sonarqube.com/sonarqube/coding_rules?open=java%3AS6548&rule_key=java%3AS6548).

But even if you get it past the gatekeepers, the code complexity is absolutely through the roof. It's harder to read than even the assembly language itself, and it honestly can compete with esoteric programming languages like __Brainf***__ and __Malbolge__ for the "who makes the best unreadable nonsense" award.

<details>

<summary>Want to blow your mind? Click here!</summary>

Yes, this is the legendary __Brainf***__ program that prints `Hello, World!` to the screen. Bear witness to the ~~horror~~ nonsense that lies herein: _a cryptic, arcane invocation scrawled in the gibbering tongue of pure and unadulterated madness_.

```brainfuck
>++++++++[<+++++++++>-]<.
>++++[<+++++++>-]<+.
+++++++..
+++.
>>++++++[<+++++++>-]<++.
------------.
>++++++[<+++++++++>-]<+.
<.
+++.
------.
--------.
>>>++++[<++++++++>-]<+.
```

Hungry for more? Behold the **Malbolge** equivalent: a mind-shattering incantation of utterly pure gibberish:

```malbolge
('&%:9]!~}|z2Vxwv-,POqponl$Hjig%eB@@>}=<M:9wv6WsU2T|nm-,jcL(I&%$#"
`CB]V?Tx<uVtT`Rpo3NlF.Jh++FdbCBA@?]!~|4XzyTT43Qsqq(Lnmkj"Fhg${z@>
```

So yeah, I might have overestimated the complexity of double-checked singleton, but you get the point: double-checked locking pattern IS complicated.

</details>

## The Clever Bill Pugh Solution

Then Bill Pugh comes along like a programming superhero and shows us this elegant solution:

```java
public class BillPughSingleton {

  private BillPughSingleton() {}

  // This inner class won't be loaded until we actually need it
  private static class SingletonHolder {
    private static final BillPughSingleton INSTANCE = new BillPughSingleton();
  }

  public static BillPughSingleton getInstance() {
    return SingletonHolder.INSTANCE;
  }
}
```

This is lazy loading without the synchronization nightmare! The inner class `SingletonHolder` doesn't get loaded until someone actually calls `getInstance()`, and the JVM handles all the thread-safety for us automatically.

:::info[**How it works**]

The JVM's class loading mechanism ensures that the `SingletonHolder` class is loaded (and thus `INSTANCE` is created) only when it's first referenced. Class loading in Java is inherently thread-safe, so we get lazy initialization with guaranteed thread safety.

:::

## The Ultimate Jailbreak Cheat Codes

But wait! Even our fancy singletons have vulnerabilities. Behold, the potential "jailbreaks":

```java
// The reflection "jailbreak" - breaking and entering via Java's backdoor
var constructor = BillPughSingleton.class.getDeclaredConstructor();

constructor.setAccessible(true); // Reflection's magic key to bypass access modifiers

var impostorInstance = constructor.newInstance(); // A wild second instance appears!

// If your singleton implements Serializable, deserialization can create new instances
// ObjectInputStream basically ignores your carefully crafted singleton logic
```

It's both amazing and terrifying how human ingenuity can make wonders... and then immediately figure out how to break those wonders in the most creative ways possible. We're like cats - give us a perfectly designed system, and we'll find seventeen different ways to knock it off the table.

## Accidental ~~Innuendo~~ Mutation

But here's another vulnerability that's easier to overlook: **accidental mutation from within the class itself**. Remember our lazy singleton approaches? They're not using `final`:

```java
public class LazySingleton {

  private static LazySingleton instance; // Not final! 😱

  // Some method inside the class could accidentally do this:
  private void oopsIBrokeEverything() {
    instance = null; // Whoops! Now getInstance() will create a new one
    // Or worse: instance = new LazySingleton(); // Now we have a different instance
    // Or instance = anything(); We can reassign the value at will
  }
}
```

This applies to all the lazy approaches (basic lazy, synchronized, double-checked locking) - but **not** to the Bill Pugh method, which uses `final`.

Of course, reflection can still mess with `final` fields if it really wants to (`Field.setAccessible(true)` is like a master key), but at least you're protected from accidental internal mutations and most casual tampering.

Now, before you start having nightmares - these aren't "attacks" that hackers are using to bring down your enterprise application. This is more like the programming equivalent of lock picking for fun. It's usually just overly clever developers showing off or testing edge cases.

However, if your application logic genuinely depends on having exactly one instance (like for managing a hardware resource), these shenanigans could cause some serious head-scratching problems.

## The Enum Singleton, the Hero We Deserved All Along

And finally, the solution that makes you wonder why anyone bothered teaching you all those other complicated approaches first:

```java
public enum EnumSingleton {
  INSTANCE;

  // You can have fields
  private int counter = 0;

  // You can have methods
  public void doSomething() {
    System.out.println("I'm a singleton, and I know it!");
  }

  public void incrementCounter() {
    counter++;
  }

  public int getCounter() {
    return counter;
  }
}
```

Usage is beautifully simple:

```java
EnumSingleton.INSTANCE.doSomething();
EnumSingleton.INSTANCE.incrementCounter();
```

This little beauty gives you:

* **JVM-level thread safety**: The JVM guarantees safe initialization

* **Reflection immunity**: Try to reflect your way in - the JVM will laugh at you and throw exceptions

* **Serialization safety**: Enum serialization is handled specially by the JVM

* **Simplicity**: Clean, readable, and hard to mess up

* **No boilerplate**: No private constructors, no static methods, no inner classes

### The Fine Print on Thread Safety

The JVM guarantees safe creation of the enum instance itself, but if you add mutable state, you're still responsible for protecting it in multithreaded environments. It's like having a bulletproof car - the car itself won't break, but you need to ensure that the car's windows are closed during a thunderstorm:

```java
public enum EnumSingleton {
  INSTANCE;

  // This field could be accessed by multiple threads
  private volatile int counter = 0;
  private final Object lock = new Object();

  // For simple operations, volatile might be enough
  public void simpleIncrement() {
    counter++; // Still not atomic! Use AtomicInteger for this
  }

  // For complex operations, you'll need synchronization
  public synchronized void safeIncrement() {
    counter++;
  }

  // Or use explicit locking for more control
  public void customIncrement() {
    synchronized (lock) {
      counter++;
    }
  }

  public int getCounter() {
    return counter; // Reading volatile int is atomic
  }
}
```

This applies to all singleton approaches, not just enums - it's just the reality of concurrent programming.

## The Catch: Enums Love Getting Up Early

Enum singletons have one quirk: they're eager beavers. The instance gets created when the enum class is first loaded, just like our initial eager approach. There's no built-in lazy loading.

If you absolutely, positively need lazy loading (maybe your singleton is expensive to create and might never be used), then the Bill Pugh initialization-on-demand holder pattern is your best alternative.

## Your Decision Tree: Choosing the Right Approach

Still unsure which approach to use? Click below for guidance:

<details>

**Use Enum Singleton if:**

* You want maximum simplicity and bulletproof protection (90% of cases)

* You don't need lazy loading

* You want the most maintainable code

* You're tired of writing boilerplate

**Use Bill Pugh Pattern if:**

* You absolutely need lazy loading

* You're willing to deal with slightly more complexity

* You need the singleton to extend a class (enums can't extend classes)

**Avoid everything else unless:**

* You're studying for interviews (learn them to understand the evolution)

* You're working with legacy code that already uses them

* You enjoy explaining complex threading concepts to confused teammates

</details>

## Modern (or Somewhat Overkilling) Java: AtomicReference Alternative

For completeness, here's a modern approach using `AtomicReference`:

<details>

<summary>Prepare yourself for some (dark) magic</summary>

```java
public class AtomicSingleton {
  private static final AtomicReference<AtomicSingleton> INSTANCE = new AtomicReference<>();

  private AtomicSingleton() {}

  public static AtomicSingleton getInstance() {
    var singleton = INSTANCE.get();
    
    if (singleton == null) {
      singleton = new AtomicSingleton();
      if (!INSTANCE.compareAndSet(null, singleton)) {
        // Another thread beat us to it, use their instance
        singleton = INSTANCE.get();
      }
    }
    
    return singleton;
  }
}

```

This gives you lazy loading with lock-free thread safety, but honestly, just use the enum unless you have a very specific need.

</details>

## Conclusion

The era of wrestling with `synchronized` keywords and double-checked locking patterns is basically over (thank goodness). Modern Java development is about leveraging what the JVM already does well instead of trying to outsmart it with "clever" solutions that usually backfire spectacularly.

:::tip

Use enum singletons for 90% of your needs.

Use Bill Pugh for the remaining 10% where lazy loading is critical.

Everything else is mostly historical curiosity at this point.

:::

So go forth and singleton responsibly! And remember - if someone asks you to implement a singleton in an interview, start with the enum version. If they look impressed, you're in good company. If they look confused and insist on seeing the double-checked locking version, well... you probably don't want to work there anyway.

Happy coding, and may your singletons be forever... single! 🎯