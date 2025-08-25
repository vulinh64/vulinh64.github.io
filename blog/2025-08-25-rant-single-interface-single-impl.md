---
slug: rant-single-interface-single-impl
title: 'Rant: What the Hell Is With Single Interface and Single Implementation?'
authors: [vulinh64]
tags: [java, rant]
description: Why pollute your codebase?
---
Why do we still stick to the old dogma of a single `Service` and a single `ServiceImpl`? What are the pros and cons of this kind of "methodology"?

<!-- truncate -->

## Abstraction (Yes, Why Not?)

You often see this kind of "coding style" in some (perhaps very old) codebases:

```java
interface Service {
    // abstract methods here
}

public class ServiceImpl implements Service {
    // implementations here
}
```

When I started learning Java years ago, I was taught that you should use this kind of approach without question! Especially when I worked with some projects from Japan (I still have PTSD about `SomethingDAO` and `SomethingDAOImpl` since then). I was too inexperienced to ask, and now, I was too scared to even argue with those who ~~came before~~ worked on the projects before. Everyone sticks to this interface-implementation pattern, and before long, the conga line has already moved with its inertia, and there's no way to know when it will stop.

And yes, even when I was still unskilled, I had already sensed some problems:

1. The number of files increased. For each class, there was also its accompanying interface. Very annoying, and perhaps contributing to how people often diss Java due to its verbosity. Longer syntax was one thing, but the "rigid" mindset of the developers who were convinced that they were following the "best practices" was another.

2. Ugly coding experience. If you got used to using `Ctrl + Click` in Eclipse to get to the method implementation, oh boy, you would be landing on the interface with the method declaration instead. It took an extra step (`Ctrl + T`, or `Ctrl + Alt + B` or `Ctrl + Alt + Click` in IntelliJ) to get to your actual implementations, where most of the logic happened.

3. Additional mental overhead. Either you create a utility class to escape this interface hell, or you grudgingly create a pair of interface and its implementation. You don't even dare to question, because, truth be told, you are also right, but so are they!

Its benefits—for example, clear contracts, interface segregation, and so on—were mostly negligible because most of the projects I've been working on were self-sustaining and closed in nature (meaning they are not frameworks or libraries to be reused by other projects, and you don't mean to expose your APIs as some sort of SPI - Service Provider Interface). And I hate to say this, but I hate this kind of programming with a passion. I also hate that most of the time, you are not allowed to question; you are expected to follow, unless you are someone with authority.

But thankfully, the beauty of OOP prevents me from hating interfaces. In fact, I've come to love the true power of interfaces when used correctly.