---
slug: christmas-special-diy-maven-dependency
title: (A Christmas Special Story) How to DIY for Maven Dependency?
authors: [ vulinh64 ]
tags: [ java, spring boot, docker ]
description: Embrace Zen spirit!
---

Or how I learned from my silly mistakes when creating myself a common Maven dependency.

<!-- truncate -->

## The Pain Begins

So there you are, working on your adorable toy project. You know, the one that's supposed to "reinforce your knowledge" but somehow ended up as three different services pretending to be microservices. You're copying and pasting the same Java files between projects like it's 2005, and every time you make a change, you have to remember to sync it across all your services. It's a nightmare, honestly.

Theoretically, you're at square 1 or maybe 2 when it comes to microservices, but whatever. No one's gonna judge your project anyway. It's your learning playground, and that's perfectly fine!

## The Lightbulb Moment

Then it hits you: "*Hey, why don't I just extract this into a common library?*" Brilliant! You're basically a software architect now.

Your next thought? "*I should publish this to Maven Central!*" Look at you, thinking big!

## Reality Check

But then reality slaps you in the face harder than a `NullPointerException` at 3 AM. Maven Central isn't something you can just throw your nonsense at and get away with it. The whole pain train of getting the required certificates, signing your artifacts, proving you own a domain... it's like applying for a mortgage just to share some code.

Being a reasonable person (and unlike those lovely folks who fill npm with packages that score a perfect 10/10 on the CVE scale), you decide to be decent and NOT inflict your questionable code on the entire Java community. Good call.

## The DIY Solution

So you get creative. Time to host one yourself! Enter the hero of our story: `mvn clean install`.

```shell
mvn clean install
```

Just like that, you've got your common library installed in your local `.m2` repository. You can now use it in your other projects like you're working for some fancy enterprise with a dedicated Artifactory server. Look at you go!

```xml
<dependency>
    <groupId>com.myawesomeproject</groupId>
    <artifactId>common-library</artifactId>
    <version>1.0.0</version>
</dependency>
```

## The Plot Twist

Then you move to another computer. Maybe you're at a coffee shop trying to look productive, or maybe you got a new laptop. You fire up your project and... wait, where's your dependency?

Oh, right. It's chilling in your old computer's `.m2` folder, probably laughing at you.

## Git to the Rescue

Time to get creative again! You decide to put your cute little dependency on GitHub. Or GitLab. Or Bitbucket. But let's be honest, you chose GitHub because you need to impress your future employer with your shiny green contribution graph.

Now you can just check out your common library on any machine and work like nothing happened. Crisis averted!

```shell
git clone https://github.com/yourname/common-library.git
cd common-library
mvn clean install
```

## Versioning: A Journey of Acceptance

One day, you realize you need to update your library. Time for versioning! So you create tags like:

* `1.0.0.Final`

* `1.0.0.Final.Final`

* `1.0.0.Final.OkayIGotItFinalThisTime`

We've all been there. No judgment.

You update the version in your pom.xml and create a git tag:

```shell
git tag 1.0.0.Final
git push origin 1.0.0.Final
```

## The Version Compatibility Dance

Then comes the fun part. Service A is living its best life with version `2.0.0`, but Service B throws a tantrum with anything newer than `1.1.9`. You're out of coffee, so debugging is out of the question.

Enter the `--branch` flag!

```shell
git clone --branch 1.1.9 https://github.com/yourname/common-library.git
```

This works like magic. Service A uses the shiny `2.0.0`, Service B chills with `1.1.9`. Two versions living independently in your `.m2` folder like civilized neighbors. When you finally create `2.0.0-FIX`, you just rebuild and update the version tags in each service's pom.xml accordingly.

## Optimization Time

As your project grows, you start noticing something annoying. Every time you clone from GitHub, you're downloading the entire commit history. You don't need to know that you fixed a typo in a comment 47 commits ago!

Enter `--depth 1` for shallow cloning:

```shell
git clone --branch 1.1.9 --depth 1 https://github.com/yourname/common-library.git
```

Just the essentials. Clean. Efficient. Beautiful.

## Docker Integration

Then you realize this combo of `--branch` and `--depth` is absolutely perfect for Docker caching! You pat yourself on the back because you're basically a professional now.

In your Dockerfile:

```dockerfile
# Look convincing, right?
FROM maven:3.9-eclipse-temurin-25-alpine AS build

# Install git
RUN apk add --no-cache git

RUN git clone --branch 1.1.9 --depth 1 https://github.com/yourname/common-library.git \
    && cd common-library \
    && mvn clean install

# Rest of your build...
```

Docker will happily cache this layer. It only busts the cache when you change the version tag. Assuming you don't delete and recreate tags like a silly goose, of course.

## Automation Nation

But why stop there? You realize you can automate EVERYTHING.

Create a batch script for Windows:

```shell
@echo off
set VERSION=1.1.9
git clone --branch %VERSION% --depth 1 https://github.com/yourname/common-library.git
cd common-library
mvn clean install
cd ..
docker-compose up --build
```

Or a shell script for Linux:

```shell
#!/bin/bash
VERSION="1.1.9"
git clone --branch $VERSION --depth 1 https://github.com/yourname/common-library.git
cd common-library
mvn clean install
cd ..
docker-compose up --build
```

One lazy `chmod +x build.sh` (if your Linux is feeling particular), a quick `./build.sh`, and BAM! Everything's ready. For debugging, of course. Or maybe for publishing to AWS or Render if you've got some extra cash burning a hole in your pocket.

## The Power of Variables

By creating these scripts, you've discovered the joy of script variables! One central point of control for common info. Change the `VERSION` variable, and everything cascades through your build process. It's either brilliant centralized control or a cascading catastrophe if you pick the wrong version. Choose wisely!

## The Wisdom We Gained

And that's it! From a simple requirement of not copy-pasting the same Java files around, you've learned:

* Local Maven repositories

* Git tagging and versioning

* Shallow cloning

* Docker layer caching

* Build automation with scripts

* Variable management

## Bonus Round: The AI Advantage

We're in 2025, baby! You can ask AI chatbots to review and help you craft most of these scripts. You've learned how to leverage AI to speed up your work. It's like having a rubber duck that actually talks back and writes code!

## Go Forth and Automate!

Now go forth and automate everything! Make scripts for your scripts. Automate your morning coffee if you can figure out the API.

Maybe that Zen wisdom was right all along: it's not about the destination, but the journey we made along the way. 

What you've learned from this unexpected train full of bumps can absolutely be applied to larger projects. You know, the ones that actually pay your bills in enterprise environments.

The skills are the same, just with more meetings and fewer personal naming conventions like `1.0.0.Final.Final.PleaseWork`.

Happy coding, fellow DIY Maven dependency warrior! 🚀

## Sneak-peek: A Personal Experience

Yes, that was the journey I have been through in order to work with those "services":

* The chilling [main project](https://github.com/vulinh64/spring-base) that handles most of the hard works.

* The [supporting project](https://github.com/vulinh64/spring-base-event) that communicate with the main project via RabbitMQ (I am too lazy to implement Spring Security), and do some shady background worker tasks.

* The [dependency](https://github.com/vulinh64/spring-base-commons) that I made along the way.

* And [an orchestrating script holder](https://github.com/vulinh64/spring-base-squad) pretending to cosplay Kubernetes (yes, I suck, I know).