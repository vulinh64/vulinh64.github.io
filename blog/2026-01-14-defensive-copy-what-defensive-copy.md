---
slug: defensive-copy-what-defensive-copy
title: Defensive Copy? What Defensive Copy?
authors: [ vulinh64 ]
tags: [ java ]
description: Always be on guard!
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import YoutubePlayer from '@site/src/components/YoutubePlayer/YoutubePlayer';

What is defensive copy? What defensive copy?

<!-- truncate -->

## The Wild ~~West~~ Collections Era

The era of using Stream API made people forget an era when we lived mostly with `ArrayList`, `LinkedList`, `HashSet`, `TreeMap`... you know, the classics. The good old days when we manually looped through everything like cavemen discovering fire.

What do those collections and maps have in common?

They are **mutable**, yep.

You could poke them, prod them, add stuff, remove stuff. Total chaos, but in a fun way.

## The Stream API Made Us Soft

Stream operations produced mostly immutable collections, so we often didn't hear about defensive copy anymore. We got comfortable. Too comfortable. We thought we were safe.

### ☢️ Trap Alert!!! ☢️

<YoutubePlayer videoId="3XpImo80neo">
Nuclear launch detected!
</YoutubePlayer>

There are some gotchas about using collections that you need to pay attention to:

<details>

<summary>Differences between `.toList()` and `.collect(Collectors.toList())`</summary>

`Collectors.toList()` actually returns an `ArrayList`! Dangerous if you expected this to not be modified! It's like ordering a locked safe and receiving a cardboard box instead. Use `.toList()` since Java 16, or use `Collectors.toUnmodifiableList()` instead.

Even SonarQube agrees with me on this one! Check out [RSPEC-6204](https://rules.sonarsource.com/java/tag/java16/RSPEC-6204/) where they literally say:

```text
"Stream.toList()" method should be used instead of "collectors" when unmodifiable list needed
```

When the linters are throwing shade at your code, you know it's serious.

```java
// The trap (brought to you by Java's commitment to backwards compatibility)
var names = stream.collect(Collectors.toList()); 
// Oh no, someone can do names.add("chaos")!

// The safe way (Java 16+)
var names = stream.toList(); // Actually immutable! Finally!

// The verbose but safe way
var names = stream.collect(Collectors.toUnmodifiableList());
```

</details>

<details>

<summary>The Trollish `Arrays.asList` Shenanigan</summary>

`Arrays.asList` is a convenient method for wrapping around an array, but that fake "ArrayList" (same name, but different FQCN) allowed modification, and it reflects back the backing array. Yikes! It's like looking in a mirror that punches you back.

```java
var arr = new String[] {"Java", "Python", "Go"};
var list = Arrays.asList(arr); // Looks innocent enough...
list.set(0, "Kotlin"); // This changes arr too! Surprise!
System.out.println(arr[0]); // Prints "Kotlin" 😱

// Use List.of instead (the adult in the room)
var safeList = List.of(arr); // Truly immutable, no tricks
```

</details>

<details>

<summary>`Collectors.groupingBy`, The Gift That Keeps On Giving (Mutability)</summary>

Even some methods like `Collectors.groupingBy`, by default, don't return immutable maps. The worst of the worst: a `HashMap` of a key and an `ArrayList` value! Doubly mutable! Heresy!

Also:

```java
// The backing map is still a HashMap! Got you again!
Collectors.groupingBy(
    keyMapper, 
    Collectors.toUnmodifiableList());
    
// Collectors.toUnmodifiableMap() is still susceptible 
// to value mutation, if the value mapper does not 
// give an immutable collection
// It's turtles all the way down, folks
```

</details>

## When You Need to Go Commando with Mutable Collections

But what if you need to work "nakedly" with the lowest implementation of collections, like mutable `ArrayList` or rebellious `HashMap`? Defensive copy comes to the rescue!

## The Problem: Shallow Immutability

In Java, `final` fields are ***shallowly immutable***, which means their references (or value for primitive ones) stay fixed, but nothing prevents some funny users from getting the references and messing with the content.

<Tabs>

<TabItem value="raw-array" label="Raw Arrays">

```java
public class BadDataHolder {

  // Being final here won't save your data from modification!
  // It's like putting a "Do Not Touch" sign on a public buffet
  private final String[] data;
    
  public BadDataHolder(String[] data) {
    this.data = data;
  }
    
  public String[] getData() {
    // Uh oh, direct exposure! We're basically handing out the keys to the kingdom
    return data;
  }
}

// Meanwhile, in villain headquarters...
var secretData = new String[] {"password123", "admin", "secret"};
var holder = new BadDataHolder(secretData);
var exposed = holder.getData();

// The original is now compromised! *evil laughter* 😈
exposed[0] = "HACKED";
// Your "secure" holder just became a security theater
```

From the code above, while you cannot specify a different array, you can freely mutate it as you wish. It's like having a vault with a door that can't be replaced, but the door is wide open.

</TabItem>

<TabItem value="mutable-collections" label="Mutable Collections">

```java
public class BadListHolder {

  // Again, this is what we called "shallowly immutable"
  // More like "immutable in name only"
  private final List<String> items;
    
  public BadListHolder(List<String> items) {
    this.items = items;
  }
    
  public List<String> getItems() {
    // Direct reference, danger zone! Not approved!
    return items;
  }
}

// The chaos ensues
var myList = new ArrayList<>(List.of("A", "B", "C"));
var holder = new BadListHolder(myList);
var gotcha = holder.getItems(); // Gotcha indeed

// Oops! Everything's gone! *poof*
gotcha.clear();
// Hope you weren't attached to that data
```

`ArrayList`, `HashMap`, `TreeSet`... they are especially vulnerable to external modification. This made sense for JPA entities (where you actually want that shared reference behavior), but for most of your operations, this is not acceptable.

</TabItem>

</Tabs>

## The Solution: Copy Everything Like You're Being Paranoid

Solution? Create a wrapper around the field you wish to return, also from the input, if you feel extra cautious.

See here:

<Tabs>

<TabItem value="defensive-arrays" label="Defensive Array Copy"> 

```java
public class GoodDataHolder {

  private final String[] data;
    
  public GoodDataHolder(String[] data) {
    // Defensive copy on input
    // Trust no one, not even the constructor caller
    this.data = new String[data.length];
    System.arraycopy(data, 0, this.data, 0, data.length);
  }
    
  public String[] getData() {
    // Defensive copy on output
    // Still trusting no one, good policy
    var copy = new String[data.length];
    
    // Here's YOUR copy, go wild with it
    System.arraycopy(data, 0, copy, 0, data.length);
    return copy;
  }
}
```

</TabItem>

<TabItem value="immutable-list" label="Immutable Lists">

```java
public class GoodListHolder {

  private final List<String> items;
    
  public GoodListHolder(List<String> items) {
    // Defensive copy on input
    // Safe even with immutable inputs
    // This is the "measure twice, cut once" of programming
    this.items = List.copyOf(items);
  }
    
  public List<String> getItems() {
    // Already immutable, but you can do List.copyOf again if paranoid
    // And hey, paranoia is just good planning in this case
    return items;
  }
}
```

</TabItem>

<TabItem value="set-map" label="Sets and Maps Examples">

```java
// For Sets and Maps (same protective energy)
var safeSet = Set.copyOf(originalSet); // Untouchable!

// Make doubly sure that the value associated to its key
// is also untouchable!
var safeMap = Map.copyOf(originalMap); // Also untouchable!
```

</TabItem>

</Tabs>

They can retrieve a copy of the original content and do whatever they want with it, while the original remains intact. Problem solved! You can sleep peacefully at night.

:::tip

However, you can relax this rule if you are passing parameters formed from an immutable factory method itself. `List.of()`? Go with the flow. `Map.ofEntries()`? Go wild, never worry.

Still, `List.copyOf` and others are very smart: they will return the immutable collection itself if you pass an immutable collection as a parameter, so... safer than sorry, I guess?

```java
var immutable = List.of("A", "B", "C");
var copy = List.copyOf(immutable); 
// copy == immutable (same reference!), 
// because it's already immutable
// Java being smart for once! It won't waste time 
// copying what's already safe, thank you Brian Goetz
```

:::

But if you need some mutations internally, but cannot let others jeopardize your work? Then wrapping the returning value for the getters is a MUST:

```java
class InternalShenanigan {

  // Default initial value: a mutable ArrayList
// highlight-start
  private List<String> works = new ArrayList<>();
// highlight-end  

  public InternalShenanigan() {
    // Default constructor does nothing
  }
  
  public InternalShenanigan(List<String> works) {
    // You truly need mutable collections
// highlight-start
    this.works = new ArrayList<>(works);
// highlight-end
  }
  
  public void process() {
    // Do something with the works above
  }
  
  public List<String> getWorks() {
    // Don't let outside noise distract you!
// highlight-start
    return List.copyOf(works);
// highlight-end
    // Can also return a mutable copy like this:
    // return new ArrayList<>(works);
    // But only if the caller needs to modify their own copy
    // (and they're too lazy to wrap it in ArrayList themselves, how dare they)
  }
}
```

## The Price of Safety

Sure, this will incur some overhead in performance. But here's the kicker: you're actually getting better constant folding optimizations from the JVM when working with immutable collections! The compiler can make assumptions about your data that it simply cannot make with mutable structures.

So you sacrifice a tiny bit of performance upfront (copying data), but you get a MUCH better return on investment:

* **Data integrity**: Your data stays yours, untouched, unmolested

* **Thread safety**: No more race conditions because someone mutated your collection

* **Better JVM optimizations**: Constant folding and other compiler tricks kick in

* **Peace of mind**: Sleep soundly knowing your data is safe

* **Clearer code**: Immutability makes reasoning about code so much easier

And thanks to `List.copyOf` and its gang's smart decision to return the same reference for already immutable collections, the overhead is minimal when you're already working with immutable data structures.

Or better yet, favor immutable collection types in place of raw arrays if possible. Modern Java gives you all the tools you need!

You might get the occasional `UnsupportedOperationException` when someone tries to modify your immutable collections (and they'll learn their lesson real quick). But that's a feature, not a bug! It's the universe telling them "*No. Bad developer. No biscuit.*"

Your data is worth more than a few nanoseconds of copying time. Probably. Maybe. Okay, it depends on your use case, but you get the idea! And honestly, with those JVM optimizations, you might even come out ahead in the long run. Win-win!