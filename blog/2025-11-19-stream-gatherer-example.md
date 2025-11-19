---
slug: stream-gatherer-example
title: JDK 25's Stream Gatherer Example
authors: [ vulinh64 ]
tags: [ java, jdk25 ]
description: A simple example of how to use Stream Gatherer
thumbnail: 2025-11-19-stream-gatherer-example.png
image: ./thumbnails/2025-11-19-stream-gatherer-example.png
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import YoutubePlayer from '@site/src/components/YoutubePlayer/YoutubePlayer';

Stream Gatherers are basically custom superpowers for your Stream API (they return another `Stream` and mostly just chill until a terminal operation shows up to actually do the work, basically intermediate operations). This JEP is like giving the Stream API steroids: now you can bend streams to your will in ways that would make previous Java developers weep tears of pure joy.

<!-- truncate -->

This article is a part of the original article [here](./2025-08-18-java-25-new-features.md).

## Stream Gatherers ([JEP 485](https://openjdk.org/jeps/485))

Current status: **Finalized in JDK 24.**

## The Example

Take this classic headache: filtering by a field that's not the ID.

You've got two choices: wrap your objects in some custom contraption or drag Google Guava into the party with its `Equivalence` wizardry:

### The Data Class

```java
public record Person(Integer id, String name) {}
```

### The Implementations

<Tabs>

<TabItem value="use-stream-gatherer" label="Use Stream Gatherer">

First we create our own gatherer:

```java
public class DistinctByNameGatherer 
    implements Gatherer<Person, Set<String>, Person> {

  @Override
  public Supplier<Set<String>> initializer() {
    // Create the state: a HashSet that will track which names we've seen
    return HashSet::new;
  }

  @Override
  public Integrator<Set<String>, Person, Person> integrator() {
    return Integrator.ofGreedy(
        (state, element, downstream) -> {
          // Extract the name from the Person element
          var extracted = element.name();

          // If we haven't seen this name before...
          if (!state.contains(extracted)) {
            // Remember it for posterity
            state.add(extracted);
            
            // Push the Person downstream (keep it in the stream)
            downstream.push(element);
          }
          
          // Always return true because we're optimists
          return true;
        });
  }
}
```

Then we apply our beautiful creation:

```java
persons.stream()
    .gather(new DistinctByNameGatherer())
    .toList();
```

</TabItem>

<TabItem value="use-google-guava" label="Use Guava's Equivalence">

```java
import com.google.common.base.Equivalence;

persons.stream()
    .map(Equivalence.equals().onResultOf(Person::name)::wrap)
    .distinct()
    .map(Equivalence.Wrapper::get)
    .toList();
```

We create an equivalence for `Person` objects using Google Guava's `Equivalence` class (because apparently we need an entire library to compare names). We wrap each object, apply `distinct()` to yeet the duplicates, then unwrap everything. Three stream operations to do what should be simple: peak Java energy!

</TabItem>

</Tabs>

You can dig into JEP 485 for the nerdy details, or just download JDK 24 and explore the `java.util.stream.Gatherers` class for some sweet built-in examples!

## Deep-dive by José Paumard

You can see the videos by José Paumard for a more comprehensive explanation:

<YoutubePlayer videoId="jqUhObgDd5Q"></YoutubePlayer>

<YoutubePlayer videoId="fgQQIV3B-uo"></YoutubePlayer>
