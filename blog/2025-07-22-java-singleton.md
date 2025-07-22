---
slug: java-singleton
title: "Java Singleton: How To?"
authors: [vulinh64]
tags: [java, singleton]
description: What you should know about how to create singleton objects in Java
---

Singleton and its (also singleton) friends are here to rescue (or rue) the day, depending on how you would implement them!

<!-- truncate -->

## When Does Singleton Actually Make Sense?

Before we dive into the "how," let's talk about the "when" (because your mom doesn't need to be a singleton, despite what you might think).

Here are some legit scenarios where having just one instance makes total sense:

<details>

- **Database Connection Pools**: You (mostly) need one single pool to ~~swim in~~ choose from
- **Logging Services**: One logger to rule them all. There should be no more than one instance of this kind of bad boys
- **Configuration Managers**: Wonderful when suddenly, you found that you have two micromanaging managers 
- **Cache Managers**: Mismanaging cache can cause all sort of fatal problems
- **Thread Pool Executors**: Yes, sure, you should never need more than one

</details>

## TL;DR for the Impatient

<details>

Look, I know you just want the answer. There are two main ways to create singleton objects in Java: 

- **using static fields** (the hard way); 
- and **using enums** (the "why didn't anyone tell me this earlier?" way).

The static field approach usually means making your constructor private so people can't just `new` their way to chaos. 

But spoiler alert: the enum approach is almost always better, and you'll see why in about 3 minutes.

</details>

## The "I Just Learned Java" Approach: Eager Initialization

Every Java developer's first singleton looks something like this:

```java
public class EagerSingleton {

  private static final EagerSingleton INSTANCE = new EagerSingleton();

  private EagerSingleton() {
    // No new keyword for you outside this class!
  }

  public static EagerSingleton getInstance() {
    return INSTANCE;
  }
}

```

This is actually not terrible! It's simple, thread-safe (thanks, JVM!), and the `final` keyword makes it immutable. The instance gets created when the class loads, whether you need it or not. Think of why you need to eat your dinner for your own good despite not being particularly hungry!

## "But What If I Don't Need It Right Away?": Lazy Loading Gone Wrong

Then you discover lazy loading and think you're super clever:

```java
public class LazySingleton {

  private static LazySingleton instance;

  private LazySingleton() {}

  public static LazySingleton getInstance() {
    if (instance == null) {
      instance = new LazySingleton(); // This is where things go wrong
    }
    
    return instance;
  }
}

```

Congratulations! You've just created a singleton that works perfectly... until someone mentions "multi-threading" and your beautiful code suddenly becomes a beautiful mess in production.

Here's what actually happens: 

Multiple threads can simultaneously see `instance == null` check, and each thread will create its own object. Sure, only one of them gets to actually assign to the static field (the last one wins), but you've just wasted resources creating multiple expensive objects! If your singleton does heavy initialization - like loading configuration files, establishing database connections, or computing complex data structures - you're doing all that work multiple times for nothing. Whoops!

## "I'll Just Add synchronized!": The Performance Killer

Your next brilliant idea:

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

This works, but now every single call to `getInstance()` has to wait in line like it's Black Friday at Best Buy. Even after the instance exists, threads are still queueing up for no reason. Your app's performance just took a hit, and that's bad. Really, really bad in a high throughput environment.

## "I'm A Threading Wizard!": Double-Checked Locking Madness

So you get fancy with double-checked locking:

```java
public class DoubleCheckedSingleton {
    
  private static volatile DoubleCheckedSingleton instance;

  private DoubleCheckedSingleton() {}

  public static DoubleCheckedSingleton getInstance() {
    if (instance == null) { // "Are we there yet?"
      synchronized (DoubleCheckedSingleton.class) {
        if (instance == null) { // "Are we there yet?" (again)
          instance = new DoubleCheckedSingleton();
        }
      }
    }
    
    return instance;
  }
}
```

Look at this monstrosity! Your simple singleton has turned into something that looks like it escaped from a computer science textbook.

The `volatile` keyword is doing the heavy lifting here. Here's the deal: normally, threads read variables from their CPU cache for performance, but volatile forces every thread to read from main memory instead. Without `volatile`, one thread might create the singleton, but another thread is still looking at its cached copy where `instance` is still null, so the latter goes "well, here goes creating another one!" The `volatile` keyword ensures all threads see the same, up-to-date value of our singleton instance.

But honestly, this code is still harder to read than assembly language written by someone with shaky handwriting.

## The Bill Pugh "Wait, That Actually Works?" Solution

Then Bill Pugh comes along like a programming superhero and shows us this beauty:

```java
public class BillPughSingleton {
    
  private BillPughSingleton() {}

  private static class SingletonHolder {
    private static final BillPughSingleton INSTANCE = new BillPughSingleton();
  }

  public static BillPughSingleton getInstance() {
    return SingletonHolder.INSTANCE;
  }
}
```

This is lazy loading without the synchronization nightmare. The inner class doesn't get loaded until someone actually calls `getInstance()`, and the JVM handles all the thread-safety for us. It's like having a personal assistant who only shows up when you actually need them.

## The "Oops, I Can Break It" Problem

But wait! Even our fancy singletons have weaknesses. Behold, the "jailbreak":

```java
// The reflection "jailbreak"
Constructor<BillPughSingleton> constructor = BillPughSingleton.class.getDeclaredConstructor();
constructor.setAccessible(true); // Reflection API's magic key to most doors
BillPughSingleton impostorInstance = constructor.newInstance();

// If your singleton implements Serializable, deserialization goes full savage and creates new instances
```

Now, before you panic - these aren't real "attacks" that hackers are using to bring down your enterprise application. This is more like the programming equivalent of picking a lock for fun. Usually, it's just "clever" developers showing off or testing edge cases. Though if your app logic really depends on having exactly one instance, these shenanigans could cause some head-scratching bugs.

## The Enum Singleton: The Hero We Deserved All Along

And finally, the solution that makes you wonder why anyone taught you the other ways first:

```java
public enum EnumSingleton {
  INSTANCE;

  public void doSomething() {
    System.out.println("I'm a singleton, and I know it!");
  }
}

// Usage (so simple it hurts)
EnumSingleton.INSTANCE.doSomething();
```

This little beauty gives you:

- **JVM-level thread safety**: Because the JVM's got your back
- **Reflection immunity**: Try to reflect your way in - the JVM will just laugh at you with an exception or two. Don't even try outsmarting JVM, you will make a fool of yourself!
- **Serialization safety**: The JVM handles enum serialization like a pro
- **Simplicity**: It may confuse you at first, but it is actually very easy to read and to write

### **The Fine Print**

The JVM guarantees the safety of creating the enum instance itself, but if you add mutable state, you're still on the hook for thread safety. It's like having a bulletproof car - the car won't break, but you can still leave the windows down in a thunderstorm:

```java
public enum EnumSingleton {
  INSTANCE;

  // Still your responsibility to protect this
  private volatile int counter = 0;

  // Yes, you may need synchronized
  // But be warned: this operation is not atomic
  public synchronized void increment() {
    counter++;
  }

  // may be a bit too overkilling here 
  // if you need synchronized here
  public synchronized int getCounter() {
    return counter;
  }
}
```

This applies to static field approaches too: it's not an enum-specific gotcha, just reality being reality.

## The Catch: Enum Likes Getting Up Early

Enum singletons have one quirk: they're eager beavers. The instance gets created when the class loads, just like our first eager approach.

If you absolutely and positively need lazy loading, then Bill Pugh's method is your runner-up choice.

## The Short Guideline on How to Pick Your Friends:

Here's your decision tree:

<details>

<summary>If you are still unsure, click me!</summary>

- **Need lazy loading and willing to deal with complexity?** → Bill Pugh pattern
- **Want maximum simplicity and bulletproof protection?** → Enum singleton (seriously, just use this)
- **Don't care about lazy loading?** → Enum singleton (use this one!)

</details>

The era of wrestling with `synchronized` keywords and double-checked locking patterns is basically over (maybe). Modern Java development is about leveraging what the JVM already does well instead of trying to outsmart it with cleverness that usually backfires.

So go forth and singleton responsibly! And remember - if someone asks you to implement a singleton in an interview, just write the enum version and watch them nod approvingly (or look confused, in which case you probably don't want to work there anyway).