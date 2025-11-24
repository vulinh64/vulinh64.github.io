---
slug: test-final-method
title: Test Final Method
---

Test

<!-- truncate -->

```java
class Parent {
    
  public final void cannotOverride() {
    Io.println("Not overridable");
  }
   
}

class Child extends Parent {
  
  // ⛔ Not compile
  public void cannotOverride() {
    // ⛔ Nope, not happening
  }
}
```

```java
class Parent {
  
  // Rare, but it does happen
  public static final staticNotOverridable() {
    // Io.println("Static method not hidable");
  }
}

class Child extends Parent {
  
  // 💀 Also not compile
  public static void staticNotOverridable() {
    // 💀 Nope, also not happening
  }
}
```

```java
class Parent {
  
  // Can be final, but why?
  private final void doMyStuff() {
    Io.println("Parent being parent");
  }
}

class Child extends Parent {

  // This is fine
  private void doMyStuff() {
    Io.println("I am a naughty kid");
  }
}
```