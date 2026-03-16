---
slug: how-to-log-correctly-in-java
title: How to Log Correctly in Java
authors: [ vulinh64 ]
tags: [ java, spring boot ]
description: Logging carefully and responsibly!
image: ./thumbnails/2026-03-16-how-to-log-correctly-in-java.png
thumbnail: 2026-03-16-how-to-log-correctly-in-java.png
---

Today's lesson: logging. I know, I know. "*It's just printing stuff.*" Sure. And a forest fire is "*just a candle*". Let's talk.

<!-- truncate -->

Congratulations, you graduated! You survived four years of instant noodle, existential dread, and professors who thought 8 AM lectures were a great idea. You built a to-do app. You put it on GitHub. You even wrote a README (half of it, anyway) and made some fancy CI/CD pipelines. Now you've landed your first real Java job (assuming A.I left anything to salvage) and you're about to discover that everything you think you know about software is, to put it professionally, adorable.

## Put the `System.out.println` Down! Put. It. Down.

I'm going to need you to take a deep breath. Look at your keyboard. Find the characters:

```text
S Y S T E M . O U T . P R I N T L N
```

Now imagine a tiny restraining order between you and those characters. That's what I'm issuing right now.

## Do Not Use `System.out.println` in Production

Not once. Not "*just temporarily*". Not "*just to check something real quick*". The last guy who said "*just to check something real quick*" is still haunted by an AWS bill from 2019.

And before you try to be sneaky: `System.err.println` is also banned. Yes, I know about it. No, it doesn't count. And if you're already thinking about JDK 25's shiny new `IO.println`, I need you to step away from the keyboard, go outside, touch some grass, and come back when you're ready to have a serious conversation.

*"But it works on my machine"*, so yeah. Three users, zero consequences, and your mom refreshing the page to be supportive. That's not a stress test. That's a family reunion.

<details>

<summary>Why `System.out.println` Is a Heresy?</summary>

Let's count the ways this little line of code is ruining your life without you even knowing it:

First, you have absolutely zero log level control. You get one setting: ON. That's it. No "*only show me the important stuff*". No "*be quiet unless something explodes*". Just a relentless wall of text streaming into the void. Congratulations, you've reinvented shouting.

And the second, the `PrintStream` talks directly to the console and it is NOT happy about it. Under the hood, `System.out` is a `PrintStream` stomping straight to the console with all the grace of a shopping cart with a broken wheel. Not exactly what you'd call lightweight.

Next, it uses a lock. Two kinds, actually. Peek inside the JDK source and you'll find that `PrintStream` has commitment issues: when the instance is exactly a `PrintStream`, it grabs an `InternalLock`; otherwise it falls back to plain old `synchronized`. Either way, every single `println` is out here acquiring a lock like it's picking up a coffee order. In a multi-threaded enterprise app with real traffic, your "harmless little debug line" is now a bottleneck wearing a trench coat pretending to be business logic. Your thread pool called. It's furious.

And finally, no async support: Some one is gonna say "*I'll just spawn a new thread to print to the console*", oops, no! That's not async logging. That's chaos in a hoodie. Put the keyboard down. Let a dedicate logging framework handle it. They have the training, the tools, and the emotional maturity to do it right. You do not.

</details>

## The Adults in the Room: Log4j and Logback

Allow me to introduce you to the people who will save your career when production is on fire at midnight and your manager is calling.

* **Apache Log4j**: battle-hardened, configurable, fast enough to make you feel guilty about your life choices.

  * [**Log4Shell vulnerability**](https://www.dynatrace.com/news/blog/what-is-log4shell/)? Yes, it happened. But the Log4j team handled it with the professionalism of a bomb squad. They patched it, documented it, and made sure everyone knew how to fix it. That's the kind of reliability you want in your logging framework.

* **Logback**: Spring Boot's default, elegant, efficient, and the kind of tool that makes other tools feel bad about themselves.

These frameworks were built on one core idea:

> Logging should never get in the way of the actual work.

Async appenders, log levels, rolling file policies, structured output... basically everything `System.out` wishes it could be when it grows up.

Oh, and you'll want to use **SLF4J** on top of all this. SLF4J is the universal TV remote for logging frameworks. Your code talks to SLF4J. SLF4J talks to whatever logging framework is underneath. Want to swap frameworks someday? No problem. Your code doesn't even notice. It just keeps living its best life.

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MyService {

  private static final Logger log = LoggerFactory.getLogger(MyService.class);
}
```

Frame this. Put it on your wall. Get it tattooed. Remember it. This is your new identity.

## Advice #1: Log at the Right Level

Logging everything at `ERROR` is the developer equivalent of the car alarm that goes off when a butterfly lands on the hood. Nobody takes it seriously, and eventually everyone just... ignores it. Here's what the levels actually mean:

| Level            | When to Use It                                                                     |
|------------------|------------------------------------------------------------------------------------|
| `log.error(...)` | Something genuinely terrible happened. Wake someone up. Consider therapy.          |
| `log.warn(...)`  | Something smells weird. Not a fire yet, but definitely some smoke.                 |
| `log.info(...)`  | Normal important stuff. The breadcrumbs a sane ops engineer would want to see.     |
| `log.debug(...)` | The gory details, for when you're actively wrestling with a bug. Keep out of prod. |
| `log.trace(...)` | Every single thing your code is doing, in excruciating detail. Use sparingly.      |

Production gets `INFO`. Staging gets `DEBUG`. `TRACE` gets used when you're desperate and talking to yourself.

:::tip

In Spring Boot, you can configure log levels per class or package right in your `application.properties` or `application.yml`. No XML sacrifices required:

```properties
# application.properties
logging.level.com.mycompany.myapp.MyService=DEBUG
logging.level.com.mycompany.myapp.payments=WARN
```

This is genuinely great because you can crank up `DEBUG` for just the one suspicious class without drowning in logs from everything else. Surgical precision. Very cool. Very adult.

:::

There is a subtle reason why this is a good strategy beyond just keeping your logs clean:

:::warning[A word about Sentry (and your credit card)]

If your project uses Sentry for error monitoring, and it probably does or will, here's something nobody warns you about: by default, Sentry hoovers up everything at `WARN` level and above and ships it off to their service. Every. Single. One. Which is great when it's a real error! Less great when half your codebase is `warn`-ing about things that are, honestly, totally fine. Sentry runs on a credit system, and logging irresponsibly means you'll burn through your quota on noise before the real problems even show up. Log `WARN` like you mean it. Your billing page will thank you.

:::

## Advice #2: Stop Concatenating Strings

I know you've done this. We've all done this. It's okay. But we're moving past it:

```java
// NO! NO! JUST. NO!
log.debug("User " + userId + " requested resource " + resourceId + " at " + timestamp);
```

Here's the thing: Java is out here building that full string in memory *before* it even asks whether debug logging is enabled. So in production, running at `INFO`, this line is sitting there like a contractor who showed up, built half a wall, got paid, and left. Completely useless work, every single request, forever.

The fix is embarrassingly simple:

```java
log.debug("User {} requested resource {} at {}", userId, resourceId, timestamp);
```

Now the framework holds the template and the raw arguments together like a responsible adult and only assembles the final string if it actually needs to. Your GC stops working overtime. Your server stops sighing quietly. Everyone wins.

## Advice #3: Parameterized Logging Has One Weakness and You Need to Know About It

Alright, you've adopted `{}` parameters. You're feeling good. Maybe a little smug, even. I hate to do this, but:

```java
log.debug("Required value: {}", someCalculation());
```

See that `someCalculation()` call? Java is going to run that method **before** passing the result into the logger, regardless of whether debug logging is on. Eager argument evaluation does not care about your feelings or your log level configuration.

If `someCalculation()` is doing a database query, a heavy computation, or really anything more strenuous than looking up a variable, you're paying that cost every single time. In production. For a debug log nobody will ever see. Rough.

:::info[SonarQube Is Not Being Nice, But It Is Saving Your Life]

By the way, if your project uses SonarQube, it will flag exactly this pattern as rule **S2629**. Yes, Sonar has opinions about your logging. Strong ones. Delivered in that particular tone of voice that implies it is very disappointed in you but is trying to remain professional about it. The rule is called "*Logging arguments should not require evaluation*" and it is not Sonar being paranoid, it is Sonar being right while also being slightly insufferable about it. Listen to it.

:::

There are two ways out:

### Option A: The OG Guard Clause

```java
if (log.isDebugEnabled()) {
  log.debug("Required value: {}", someCalculation());
}
```

Ugly? Slightly. Effective? Completely. Works everywhere, requires no special versions of anything, and has been saving developer lives since before you could drive.

:::warning[Cognitive Complexity]

One small catch though: that `if` statement is a branch, and Sonar will dutifully count it toward your cognitive complexity score like the little hall monitor it is. It also means your test suite needs to cover both the enabled and disabled paths, or your code coverage metric starts giving you the side-eye. If you care about either of those things (and your tech lead might care on your behalf), Option B sidesteps both problems entirely.

:::

### Option B: The Fancy Modern Way (SLF4J 2.x+)

```java
log.atDebug()
 .setMessage("Required value: {}")
 .addArgument(() -> someCalculation())
 .log();
```

That lambda means `someCalculation()` only runs if debug logging is actually enabled. Lazy evaluation on demand. No guard clause, no mess, looks like you know what you're doing at code review. 10/10.

Other logging frameworks have similar APIs, but SLF4J's is particularly elegant.

## Advice #4: Pass `e`, Not `e.getMessage()`

Picture this: production is down. Users are angry. Your Slack is a horror show. You crack open the logs and you find this:

```text
[ERROR] Failed to process request: Connection refused
```

...cool. Cool cool cool. *Where?* To *what?* *Why?* From *which part of the code?* Was there a cause? A nested cause? A cause that had a cause?

This is what happens when someone logs exceptions like this:

```java
log.error("Failed to process request: {}", e.getMessage());
```

You took a full exception object with a beautiful detailed stack trace and turned it into one line of barely useful text. You threw away the receipt. You are debugging in the dark now.

Do this instead:

```java
log.error("Failed to process request", e);
```

SLF4J automatically prints the full stack trace. No `{}` needed. No ceremony. Just the message and the exception, and suddenly you have everything you need to actually fix the problem.

:::tip[The One Legitimate Exception to This Rule]

Now, the one legitimate exception to this rule (yes, pun intended, no I'm not apologizing): **expected, boring, routine errors.** User submitted an invalid email. JSON came in malformed. Someone typed letters into a number field because people are unpredictable creatures. These are not emergencies. Logging a full stack trace for them will cause junior devs to have minor panic attacks for no reason.

For those, drop it down:

```java
// It's fine, this happens, nobody panic
log.info("Rejected request: {}", e.getMessage());
```

The rule of thumb: `warn` and `error` mean something genuinely went wrong, so give us the full stack trace. `info` and below are just breadcrumbs, so the message is plenty. Match the drama of your logging to the drama of the situation. ~~Do not cry wolf~~ Do not pollute the console log. The ~~wolf~~ error will come eventually, and you'll need people to take it seriously.

:::

## In Conclusion: Your Logs Are Your Legacy

Logging is not sexy. Nobody is going to clap at your standup because you wrote a beautiful log statement. You are not getting a LinkedIn endorsement for "*excellent use of parameterized logging*". And yet, when something goes sideways at 2 AM and your whole team is half-asleep squinting at a terminal, your logs are the only thing standing between a 10-minute fix and a multi-hour disaster with a postmortem.

So here are your commandments, carved in stone, laminated, framed, and hung above your monitor:

1. **`System.out.println` is banned.** You know why. We talked about it.

2. **SLF4J + Logback or Log4j.** Be a professional.

3. **Use the right log level.** Not everything is an emergency. Not everything is fine.

4. **`{}` patterns, not string concatenation.** Your GC deserves better.

5. **Guard expensive arguments.** Lazy evaluation is a virtue.

6. **Pass `e`, not `e.getMessage()`.** Give yourself the stack trace. You'll need it.

Now go forth. Write logs that would make your on-call self weep with gratitude. May your production systems be boring, your alerts be silent, and your 2 AM be reserved entirely for sleep.