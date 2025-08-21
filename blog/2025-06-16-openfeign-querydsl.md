---
slug: openfeign-querydsl
title: OpenFeign's QueryDSL
authors: [vulinh64]
tags: [java, querydsl, openfeign]
description: How to use new OpenFeign's QueryDSL
---

Guide on how to make use of new QueryDSL fork by OpenFeign team.

<!--truncate-->

:::note

This article is intended for the new Jakarta EE Persistence API, but the same principles can also be applied to older or
legacy projects if possible (you run into risk of CVEs when using old version anyway).

:::

## !!!Update!!!

### 2025-06-16

The current configuration of just this:

```xml

<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <source>${java.version}</source>
        <target>${java.version}</target>
        <annotationProcessorPaths>
            <!-- Other annotation processors above -->

            <!-- The original QueryDSL is no longer maintained (2024-11-12) -->
            <!-- Switching to OpenFeign's QueryDSL -->
            <path>
                <groupId>io.github.openfeign.querydsl</groupId>
                <artifactId>querydsl-apt</artifactId>
                <version>${openfeign.querydsl.version}</version>
                <classifier>jakarta</classifier>
            </path>
        </annotationProcessorPaths>
    </configuration>
</plugin>
```

and the transitive dependency declaration like this:

```xml

<dependency>
    <groupId>io.github.openfeign.querydsl</groupId>
    <artifactId>querydsl-jpa</artifactId>
    <version>${openfeign.querydsl.version}</version>
</dependency>
```

works fine for the time being (tested on both `mvn clean install` and IntelliJ's Build -> Rebuild Project), for whatever
reason (IntelliJ's Rebuild Project has failed before, but works now, maybe the latest version of OpenFeign QueryDSL
works).

The current version of `openfeign.querydsl.version` is `6.11`, as the time of this writing (`2025-06-16 @ 15:00 UTC +7`).


> Get your latest `openfeign.querydsl.version` value [here](https://mvnrepository.com/artifact/io.github.openfeign.querydsl/querydsl-jpa/7.0).
>
> You can visit the fork [here](https://github.com/OpenFeign/querydsl)

## ~~Old Implementation~~

<details>

<summary>~~For reference only~~</summary>

### Dependency Declaration

```xml

<dependency>
    <groupId>com.querydsl</groupId>
    <artifactId>querydsl-jpa</artifactId>
    <classifier>jakarta</classifier> <!-- Pay attention to this classifier -->
    <version>${querydsl.version}</version>
</dependency>
```

### Maven Plugin `maven-compiler-plugin` Configuration

```xml

<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <source>${java.version}</source>
        <target>${java.version}</target>
        <annotationProcessorPaths>
            <!-- Other annotation processor paths here -->

            <path>
                <groupId>com.querydsl</groupId>
                <artifactId>querydsl-apt</artifactId>
                <version>${querydsl.version}</version>
                <classifier>jakarta</classifier>
            </path>
            <!-- Required to make querydsl-apt works -->
            <path>
                <groupId>jakarta.persistence</groupId>
                <artifactId>jakarta.persistence-api</artifactId>
                <version>${jakarta-persistence.version}</version>
            </path>
        </annotationProcessorPaths>
    </configuration>
</plugin>
```

</details>