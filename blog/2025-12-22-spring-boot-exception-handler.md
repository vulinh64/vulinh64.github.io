---
slug: spring-boot-exception-handler
title: A Quick Guide on Spring Boot Exception Handler
authors: [ vulinh64 ]
tags: [ java, spring boot ]
description: A short introduction on how to handle exceptions for requests in Spring Boot
thumbnail: 2025-12-22-spring-boot-exception-handler.png
image: ./thumbnails/2025-12-22-spring-boot-exception-handler.png
---

import YoutubePlayer from '@site/src/components/YoutubePlayer/YoutubePlayer';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

The quickest, cleanest, and easiest way to handle exceptions for requests in Spring Boot like a professional programmer in enterprises (or at least look like one).

<!-- truncate -->

## Introduction

Look, I know there are approximately 47 billion online guides about exception handling in Spring Boot. So I'll keep this one short.

This guide is for everyone: the ADHD developers who can't sit still for more than 30 seconds, the seniors who've seen some stuff (and by "stuff" I mean legacy code that makes you hate yourself), and everyone in between who just wants to get stuff done and go home.

I highly recommend reading [this excellent deep-dive article](https://www.baeldung.com/exception-handling-for-rest-with-spring) if you want the serious, enterprise-grade explanation. Me? I'm just here to make exception handling less painful than stepping on a LEGO.

:::danger[LIGHT THEME ALERT!]

Beware of the light theme on the Baeldung site! It's brighter than your future! 💀💀💀💀

<details>

<summary>Deploying flashbang!</summary>

<YoutubePlayer videoId="nA9ShuzY0hA"></YoutubePlayer>

</details>

:::

## TL;DR

Too lazy to read? I feel you. Here's the [GitHub repository](https://github.com/vulinh64/exception-handler-demo) so you can yoink the code and pretend you wrote it yourself. Your secret is safe with me.

Still here? Awesome! Grab your favorite coffee cup, because we're about to dive into the magical world of exception handling in Spring Boot. Don't worry, it's way easier than configuring Webpack.

## Create Our Spring Boot Application

Head over to [Spring Initializr](https://start.spring.io/) and let's cook up a sample Spring Boot app.

Here's what we're going with:

* Project: Maven

* Language: Java (I mean, duh? This isn't a JavaScript tutorial... yet)

* Spring Boot: `3.5.9` - Yeah, I know Spring Boot 4 is the new hotness, but hold your horses! It'll take at least a year for most libraries to catch up. Think of it like buying the new iPhone on launch day - you're basically a beta tester. Spring Boot 3 is still absolutely crushing it and will keep us employed for at least two more years.

* Dependencies: Spring Boot Starter Web, Lombok (because who actually enjoys writing getters and setters? Masochists, that's who).

We're keeping this lean and mean. But hey, these principles work for everything from your weekend side project to that monolithic enterprise beast that takes 10 minutes to start up.

## Define Our Custom Exceptions

Java has plenty of built-in exceptions. Like... a LOT. But sometimes you just wanna make your own, like customizing your coffee order. So let's brew some custom exceptions!

:::tip

Two sacred rules of exception handling (ignore these and the coding gods will judge you):

* **Never, EVER** swallow your exceptions! That's like ignoring the check engine light. For sure, the car still runs, but you're gonna have a bad time eventually. Log them, trace them, rethrow them, do something about them! **Just. Don't. Pretend. They. Didn't. Happen!**

* If you're rethrowing an exception, you **MUST** include the original one. It's like those Russian nesting dolls, but for debugging. Keep that stack trace intact or future-you will hate present-you.

:::

Our custom exceptions live [here](https://github.com/vulinh64/exception-handler-demo/tree/main/src/main/java/com/vulinh/exception). Go check 'em out, they're pretty chill.

## Define the Logic to Handle Our Exceptions

### A Centralized and Controlled Data Structure

Here's the deal: we want to handle exceptions like adults: in a structured, predictable way. No more random error messages that make users (and future developers) cry.

We want something like this beautiful JSON masterpiece:

```json
{
  "errorCode": "M400",
  "message": "Bad data"
}
```

Simple. Clean. Beautiful.

So let's whip up a response DTO (because Java Records are too cool to be ignored):

```java
@Builder
@With
@JsonInclude(Include.NON_NULL)
public record ResponseObject<T>(ErrorCode errorCode, String message, T data) {

  // Factory method to quickly 
  // create a successful response data wrapper
  public static <T> ResponseObject<T> of(T data) {
    return ResponseObject.<T>builder()
        .errorCode(ErrorCode.M000)
        .message(ErrorCode.M000.getMessage())
        .data(data)
        .build();
  }
}
```

This bad boy wraps all our responses. The good, the bad, and the "oh no, what did you do?"

### The Exception Handling

Alright, time for the main event! This is where the magic happens, folks!

First, we create a class with the fancy `@RestControllerAdvice` annotation:

```java
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  // exception logic goes here
  // (spoiler: it's about to get awesome)
}
```

:::note

Why `@RestControllerAdvice` and not `@ControllerAdvice`?

Technically, we can use `@ControllerAdvice`. But here's the catch: since we're building a (mostly) pure backend project that speaks JSON all day long, using `@ControllerAdvice` would force us to wrap everything in `ResponseEntity` like we're packaging gifts for Christmas. 

Every. Single. Time.

`@RestControllerAdvice` is basically `@ControllerAdvice` + `@ResponseBody`, which means Spring automatically serializes our return values to JSON. More flexibility, less boilerplate, more time for coffee breaks. It's a win-win-win!

:::

Pro tip: Always create a handler for `RuntimeException`. Why? Because we're not perfect (shocking, I know), and sometimes we forget to handle specific exceptions. This is your safety net. Your backup parachute. Your "oh crap" button.

<Tabs>

<TabItem value="runtime-exception-handler" label="Handling the RuntimeException"> 

```java
// The imports are as follows:
// import org.springframework.web.bind.annotation.ExceptionHandler;
// import org.springframework.web.bind.annotation.ResponseStatus;

@ExceptionHandler(RuntimeException.class)
@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public ResponseObject<Object> handleRuntimeException(RuntimeException ex) {
  log.error("Internal server error:", ex);

  return fromErrorCode(ErrorCode.M999);
}

private static ResponseObject<Object> fromErrorCode(ErrorCode errorCode) {
  return ResponseObject.builder()
    .errorCode(errorCode)
    .message(errorCode.getMessage())
    .build();
}
```

</TabItem>

<TabItem value="simple-error-code" label="Simple ErrorCode enum">

For the sake of not overcomplicating things (looking at you, microservices architecture), here's our simple error code enum:

```java
@Getter
@RequiredArgsConstructor
public enum ErrorCode {
  M000("Success"),
  M999("Internal Server Error"),
  M001("Data existed"),
  M400("Bad data");

  private final String message;
}
```

In actual enterprise projects (you know, the ones that pay the bills), you'll probably be using i18n properties files for these messages. Why? Because your app needs to speak English, Spanish, Japanese, and probably Klingon too. But that's a whole different can of worms and totally out of scope for this article. If you need to learn about i18n, do yourself a favor: go bother Google. Or Bing, if you're desperate. Point is, that's homework for another day!

</TabItem>

</Tabs>

A few words regarding Spring Boot's built-in exception handlers:

<details>

<summary>Spring Boot has your back... most of the times</summary>

Before we go all custom exception crazy, I should mention that Spring Boot isn't completely useless out of the box. It already handles some common exceptions for you! For example, if some genius tries to use `POST` instead of `GET` on an endpoint that only accepts `GET`, Spring Boot automatically responds with:

```json
{
    "timestamp": "some random timestamp",
    "status": 405,
    "error": "Method Not Allowed",
    "path": "/get"
}
```

Pretty neat, right? So you don't have to handle everything yourself. Spring Boot is like that friend who's got your back... but only for the obvious stuff. For the weird, business-logic-specific exceptions? That's on you, buddy.

What if you want to override this default behavior and make it match your fancy custom error format? Easy-peasy! Just create a handler for `HttpRequestMethodNotSupportedException` (yeah, it's a mouthful, blame the Spring team, not me). You'll find this class chilling in the `org.springframework.web` package.

Just one thing though: for the love of all that is holy, remember to return HTTP Status `405` instead of `200`! I know it's tempting to just return `200` for everything, but that's like telling someone "everything's fine" while your house is on fire. The HTTP status codes exist for a reason, people!

</details>

Now for the fun part - handling our custom exceptions! In our tiny demo, we've got:

* `IdenticalException`: Thrown when someone tries to add the same thing twice. It's like trying to add your ex on Facebook again - just... no.

* `NotFound401Exception`: When you're looking for something that doesn't exist. Like my motivation on Monday mornings.

* `IllegalArgumentException`: For when someone passes us garbage Base64 data. We're not a recycling center, folks. This is a Java's built-in exception.

You've got two ways to handle these troublemakers:

<Tabs>

<TabItem value="use-annotation" label="Use @ResponseStatus annotation">

The lazy way (I mean "efficient" way 😏):

```java
@ExceptionHandler(IdenticalException.class)
// highlight-start
@ResponseStatus(HttpStatus.CONFLICT)
// highlight-end
public ResponseObject<Object> handleIdenticalException(IdenticalException ex) {
  showExceptionMessage(ex);

  return fromErrorCode(ErrorCode.M001);
}
```

</TabItem>

<TabItem value="not-use-annotation" label="Specify the HTTP status manually">

The "I want full control" way (for when you're feeling extra fancy):

```java
@ExceptionHandler(NotFound401Exception.class)
public ResponseEntity<Void> handleNotFound401Exception(NotFound401Exception ex) {
  showExceptionMessage(ex);

  // Another way to return HttpStatus without @ResponseStatus
  // Because sometimes we like to do things the hard way
  return ResponseEntity
// highlight-start
    .status(HttpStatus.NOT_FOUND)
// highlight-end
    .build();
}
```

</TabItem>

</Tabs>

And boom! Just like that, our project is basically done. Time to update that LinkedIn profile to "Exception Handling Expert."

### A Sample Controller

Check out our adorable little controller [here](https://github.com/vulinh64/exception-handler-demo/blob/main/src/main/java/com/vulinh/controller/DemoController.java). It's like a puppy, but for code.

## Our Test Run

Let's break some stuff! (Responsibly, of course.)

### Passing an Empty Body (Results in a `NullPointerException`)

AKA "I forgot to send data" syndrome.

<details>

#### Request

```shell
curl --location 'localhost:8080/create' \
--header 'Content-Type: application/json' \
--data '{}'
```

#### Response

```JSON
{
  "errorCode": "M999",
  "message": "Internal Server Error"
}
```

Oops! But at least it failed gracefully, right?

</details>

### Try Adding an Entry That Already Exists (Results in an `IdenticalException`)

Also known as "Why can't I have two accounts with the same username?"

<details>

#### Request

Run this request twice to trigger our error (because once is never enough):

```shell
curl --location 'localhost:8080/create' \
--header 'Content-Type: application/json' \
--data '{
    "name": "1"
}'
```

#### Response

```json
{
  "errorCode": "M001",
  "message": "Data existed"
}
```

Nice try, buddy!

</details>

### Passing an Invalid Base64 Payload

When you keyboard-smash and hope for the best.

<details>

#### Request

```shell
curl --location 'localhost:8080/get?name=assa324320023--231415'
```

#### Response

```json
{
  "errorCode": "M400",
  "message": "Bad data"
}
```

That's what you get for random typing!

</details>

## Finishing Touches

And there you have it! You now know how to handle exceptions in Spring Boot like a boss. Is it the absolute most comprehensive guide ever? Nah. But will it get you 90% of the way there while keeping you awake? Absolutely!

The code is waiting for you at the [GitHub repository](https://github.com/vulinh64/exception-handler-demo). Go forth and handle those exceptions with style!

Now if you'll excuse me, I need to go handle some exceptions in my life. Like why I thought finishing this blog post at 2 AM was a good idea. 🌙