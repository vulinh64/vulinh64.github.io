---
slug: string-immutability-truth
title: String Immutability Truth
authors: [vulinh64]
tags: [java, string]
description: Is String truly immutable?
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# String Immutability Truth

The title is not a clickbait. Because it isn't. Let's have a deep dive towards the actual immutability of our beloved `String` class!

<!--truncate-->

You're sitting in an interview, feeling all confident and stuff. The interviewer leans back and hits you with the classic "So, tell me about Java String immutability." You're thinking "Pfft, easy money!" and you start rattling off how String is totally immutable, just like you learned in your bootcamp or that dusty computer science textbook.

Well, I am gonna bust your bubble. You may call me heretic and blasphemous, but it is what it is!

## The Answer That'll Make Your Interviewer Do a Double-Take

Here's the tea:

> *Java String is technically mutable, but effectively immutable.*

## String is... Mutable?

Before you start having an existential crisis and questioning your entire Java journey, let me explain what's really going on under the hood (don't panic).

When you crack open the String class like it's a mystery novel, you'll find sneaky little fields that aren't marked as `final`:

Look here:

<Tabs>

<TabItem value="jdk9+" label="JDK 9+">

This is how `String` class looks like from JDK 9 onwards:

```java
public final class String {

    private final byte[] value; // Actual holder of String value
    private final byte coder; // either LATIN (0) or UTF16 (1)

    private int hash; // This little rebel
    private boolean hashIsZero; // And its sidekick

    // rest of the code not shown
}
```

</TabItem>

<TabItem value="jdk8" label="JDK 8">

For JDK 8 and below, the implementation is "simpler":

```java
public final class String {

    private final char[] value;

    private int hash; // Still rebellious

    // rest of the code not shown
}
```

</TabItem>

</Tabs>

These non-final fields are basically the reason String can't sit at the "truly immutable" table with the cool kids like `Optional` and `LocalDateTime`. Those classes have ALL their fields locked down tighter than your parent's Wi-Fi password.

## So Why Did Java Do This to Us?

Now you're probably thinking "Why would Java betray us like this? I trusted you, Java!"

Calculating a String's hash code can be more expensive than your newly bought gift you are going to give to your crush.

Think about it - a String could be as short as how your crush curtly responded to your messages ("k"), or as long as your sorry love story with your crush. ~~Totally unrequited and not reciprocated~~

Every time you calculate that hash code, Java has to loop through every single character like it's counting sheep.

For massive strings (for example: a blog post, or a CLOB from a database), this is quite an expensive operation.

## Java Cares About Performance

Here's where Java gets all smart and stuff: Instead of calculating everything on-demand, Java says "You know what? I'll calculate this hash code when someone actually needs it, and then I'll remember it forever." At least until JVM is shut down, obviously, or when it gets garbage collected.

Java isn't here to hold your hand and explain why your crush left you on read. Java's got bigger fish to fry, like keeping your applications from throwing performance tantrums that could cost you your job. Hash codes aren't used that often (mainly just when you're dealing with HashMap and its gang).

So Java takes the "work smarter, not harder" approach: calculate once, cache forever, and keep your career prospects intact. ~~Your heart might be broken, but your career would not, thank you Java.~~

If you are curious, this is how hash code is calculated in String class:

<details>

```java
// Implementation in JDK 21
public final class String implements
        java.io.Serializable, Comparable<String>,
        CharSequence, Constable, ConstantDesc {

    //
    // Other parts not shown
    //

    private int hash;
    private boolean hashIsZero;

    //
    // Other parts not shown
    //

    public int hashCode() {
        int h = this.hash;

        if (h == 0 && !this.hashIsZero) {
            h = isLatin1()
                    ? StringLatin1.hashCode(value)
                    : StringUTF16.hashCode(value);

            if (h == 0) {
                this.hashIsZero = true;
            } else {
                this.hash = h;
            }
        }

        return h;
    }

    //
    // Other parts not shown
    //
}
```

</details>

## We Came to the "Effectively" Immutable Part!

All this internal drama with hash code caching? It's completely invisible from the outside! It's like a really good magic trick where you know something's happening behind the curtain, but you can't see it.

Unless you're one of those people who likes to play with fire and use Reflection API (why though?) ~~or go completely off the rails with something like Cheat Engine~~, you'll never notice these internal shenanigans.

The hash code gets calculated, cached, and from that point on, it's stable as how your crush only sees you as a backup plan, best friend forever (read: ***friendzone***, and don't even try to deny that!).

So, indeed, String is technically mutable because of these internal changes, but practically speaking, it behaves like it's completely immutable, and reaps all the benefits from being one (JVM optimization notwithstanding). It works just as good as any other immutable classes you know and love.

## The Real Talk

This whole situation is actually a masterclass in pragmatic programming. They chose the path that gives you all the benefits of immutability that you actually care about:

* Thread safety without the headache of synchronization

* You can pass Strings around like they're going out of style without worrying about side effects

* HashMaps won't have nervous breakdowns

* No need for defensive copying (still, `toCharArray()` provides a defensive copy by creating a new array, thereby ensuring the String's internal array remains unchanged and upholding its effective immutability. This design is crucial until truly immutable "frozen arrays" become available.).

So next time someone asks you about Java String immutability in an interview, you can drop this knowledge bomb and watch their face go through the five stages of grief.

"Well," you can say with a knowing smile:

> *Java String is technically mutable due to lazy hash code initialization, but effectively immutable for all practical purposes*.

Yes, there is no beating around the bush here. Just straight up cold and hard facts. Some compromises have to be made ~~and sacrificed to the Programming Gods~~ so that your program can run smoothly 99.99999999% most of the time.