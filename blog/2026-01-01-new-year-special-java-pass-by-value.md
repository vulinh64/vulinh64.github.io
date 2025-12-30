---
slug: new-year-special-java-pass-by-value
title: (A New Year Special Story) Java Is Pass-by-Value, No Exceptions
authors: [ vulinh64 ]
tags: [ java, spring boot, docker ]
description: Embrace Zen spirit!
---

import YoutubePlayer from '@site/src/components/YoutubePlayer/YoutubePlayer';

Look, I'm just going to say it: Java is always pass-by-value. No exception. Period. End of story.

<!-- truncate -->

Oracle said it.

Sun said it.

The Java creators said it.

José Paumard said it (check out his video below). They've said it numerous times, in fact.

<YoutubePlayer videoId="Qeb4UQUlINI"></YoutubePlayer>

But hey, people love to say *"doubt is a part of integrity"*, so fine, let's be skeptics. We're not living in the medieval era where questioning the established doctrine gets you branded as a heretic and thrown into a dungeon (or worse, maybe forcing you to use any JDK below 8).

If you don't like my tone and think I'm committing some sort of *"fallacy by appealing to authority"*, that's cool. We'll do the test ourselves. No need to take anyone's word for it.

## The Classic Swap Test

Take this example:

```java
// famous or infamous classic variable swapping
public void swap(int a, int b) {
  // fancy fancy sweet sweet XOR magic
  a ^= b;
  b ^= a;
  a ^= b;
}
```

When you do a test run, you'll realize that your original `a` and `b` have their values **unchanged**:

```java
// JDK 25, kids!
void main() {
  var a = 11;
  var b = 21;

  swap(a, b);

  // JDK 25, folks!
  IO.println(a); // Still 11
  IO.println(b); // Still 21
}
```

*"But you said that was for primitive, not for object!"*, you protest.

## The Object Test

Fine, here's your kitchen sink solution:

```java
public void increaseAge(Cat cat) {
  cat = new Cat(cat.getAge() + 1);
}

void main() {
  var cat = new Cat(10);
  increaseAge(cat);
  IO.println(cat.getAge()); // still 10, don't even think otherwise
}
```

You think your `cat` you passed in will age up, but nope. Your cat will still be one year earlier than your intended behavior. Sorry, not sorry.

## So What Are "Values" in Java?

Let's define what values in Java actually are:

**For primitive types**, the values are... values. Well, what do you expect? An integer is an integer. A boolean is a boolean. Simple stuff.

**For object types** (and this is where it gets confusing), consider what we have here:

```java
Cat cat = new Cat(10); // set initial age
```

The variable `cat` is a **reference** (fancy way to describe something like an address) to the `Cat` object that's chilling peacefully in the heap.

When we invoke the `increaseAge` method, a **copy** of said reference IS passed into the method argument (very important). Because what we do inside the method is working with a copy of the original reference, our cat still hasn't aged up. The original reference in `main()` is completely untouched.

## The Confusing Counter-Example

You scream: *"What about this?"*

```java
public void increaseAge(Cat cat) {
  cat.setAge(cat.getAge() + 1);
}
```

Yes, this is also one source of confusion.

This is like saying *"execute order #123 (increase age) at the address `0x12345678`"*. Yes, we are working with the same reference. Of course, what we issue to said reference will be reflected back to the cat object in heap too.

Or in short: this is called internal state mutation. Same reference, same object. Java doesn't allow you to change the reference (in this case, our VALUE) by reassignment in a method, but it sure as heck lets you mutate what that reference points to.

## The Naming Problem

And yes, the name *"reference"* is confusing. The correct term could have been *"managed pointer"* or *"reference-as-value"*, or anything else that makes more sense than *"reference"*. Well, I'm no expert in naming things (and naming is hard, we all know that).

## TL;DR

Java is strictly passed by value. If you can believe the Java ~~God~~ creators who literally set the rules of the language, then who else would you believe?

Just know that Java has made everything so much simpler by not using C/C++ pointers, and this pass-by-value design is also a blessing (because sometimes your code works without you even knowing why and how, and that's okay).

So the next time someone tries to tell you Java is pass-by-reference for objects, you can smile politely and show them this blog post. Or just let them figure it out on their own. Either way, the truth remains: pass-by-value, always and forever.