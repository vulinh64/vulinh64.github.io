---
slug: rant-single-interface-single-impl
title: 'Rant: What the Hell Is With Single Interface and Single Implementation?'
authors: [vulinh64]
tags: [java, rant]
description: Why pollute your codebase?
thumbnail: 2025-08-25-rant-single-interface-single-impl.png
image: ./thumbnails/2025-08-25-rant-single-interface-single-impl.png
---

import { QuestionAnswerBox, Question, Answer } from '@site/src/components/QuestionAnswerBox';

Why do we still stick to the old dogma of a single `Service` and a single `ServiceImpl`? What are the pros and cons of this kind of "methodology"?

<!-- truncate -->

## Abstraction (Yes, Why Not?)

You often see this kind of "coding style" in some (perhaps very old, but also in some more recent) codebases:

```java
interface Service {
  // abstract methods here
}

public class ServiceImpl implements Service {
  // implementations here
}
```

When I started learning Java years ago, I was taught to use this approach without question! Especially when I worked with some projects from Japan (I still have PTSD about SomethingDAO and SomethingDAOImpl). I was too inexperienced to ask questions, and later, I was too intimidated to argue with those who had worked on the projects before me. Everyone adhered to this interface-implementation pattern, and before long, the momentum had built up such inertia that there seemed to be no way to stop it. Even as a novice, I had already sensed some problems:

* **File proliferation**: For each class, there was also its accompanying interface. Very annoying, and perhaps contributing to how people often criticize Java for its verbosity. Lengthy syntax was one thing, but the rigid mindset of developers who were convinced they were following "best practices" was another.

* **Poor development experience**: If you were used to using `Ctrl + Click` in your IDE to navigate to method implementations, you'd land on the interface declaration instead. It required an extra step (`Ctrl + T`, or `Ctrl + Alt + B`/`Ctrl + Alt + Click` in IntelliJ) to reach the actual implementation where the logic resided.

* **Additional mental overhead**: Either you created utility classes to escape this "interface hell," or you grudgingly created yet another interface-implementation pair. You didn't dare question it because, while your instincts might be right, the established pattern had institutional weight behind it.

The supposed benefits (clear contracts, interface segregation, and so on) were mostly negligible in the projects I worked on. These were self-contained applications (not frameworks or libraries meant for reuse, and not exposing APIs as Service Provider Interfaces). I came to dislike this style of programming intensely, especially the unquestioning adherence to it unless you had sufficient authority to challenge the status quo.

Fortunately, experiencing this antipattern didn't turn me against interfaces entirely. I've come to appreciate the true power of interfaces when used appropriately, that is, when there's an actual need for abstraction rather than following dogma.

## When This Actually Makes Sense

The interface-implementation pattern is justified in these scenarios:

### Genuine Technical Needs

* **Multiple implementations exist or are genuinely expected** - You have a payment processor that needs to handle credit cards, PayPal, and bank transfers. The key word is "genuinely" - not "someday we might need it."

* **Framework or library development** - You're building APIs or SPIs that others will extend. Your users need defined contracts to implement against.

* **System boundaries with external dependencies** - You need to isolate your business logic from external services or infrastructure concerns.

### Organizational Realities

* **Established team conventions** - Your team has already adopted this pattern consistently. Fighting every interface may not be worth the political capital, especially if the codebase is already structured this way.

### When It's Just Overhead

If your project is self-contained without exposing extension points to external users, and you only have single implementations, this pattern typically adds more complexity than value. In these cases, you're often following dogma rather than solving actual problems.

The key is distinguishing between genuine architectural needs and cargo cult programming.

## A Balance Approach?

Actually, there is no "balance" method that satisfies both camps. So before choosing your approach, ask yourself and your team those questions when it comes to design your service (for example, email sending services or payment processors):

* Do I actually have multiple implementations?

* Am I planning to have multiple implementations in the near future (maybe means never, and when that day comes, just let your IDE extract your interfaces and call it a day)?

* Is this a boundary to an external system?

* Am I building something that others will extend?

If the answer is no, then stick to a single class. 

If yes, then feel free to write your interfaces and your implementations, because there is a *genuine need* for it.

If there is only a single implementation, then having an accompanying interface, most of the time, is just noises and mental overhead that increases the number of tabs on your IDE most of the time.

## My Own Counter-Arguments

<QuestionAnswerBox>
<Question>SOLID, bruh?</Question>
<Answer>
SOLID doesn't mean "interface all the things!" YAGNI trumps premature abstraction. Creating single-implementation interfaces is like wearing a helmet while sitting in your living room, technically "safer" but missing the point entirely.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>But what about mocking for testing?</Question>
<Answer>
This argument died around 2010. Modern mocking frameworks handle concrete classes effortlessly. Mockito, the most popular Java mocking framework, has supported class mocking since version 2.0 (released in 2014).

```java
@ExtendsWith(MockitoExtension.class)
class OrderServiceTest {

    // Mock a concrete class - no interface needed
    @Mock 
    private PaymentRepository paymentRepository;
    
    @Mock 
    private EmailService emailService;
    
    // UserService is a concrete class, not an interface
    @InjectMocks 
    private OrderService orderService;

    @Test
    void shouldProcessPayment() {
        // Works perfectly with concrete classes
        when(paymentRepository.save(any())).thenReturn(savedPayment);
        
        orderService.processOrder(order);
        
        verify(emailService).sendConfirmation(any());
    }
}
```

Even Spring's `@MockBean` works with concrete classes:

```java
@SpringBootTest
class IntegrationTest {

    // Concrete class, no problem
    @MockBean
    private PaymentService paymentService;
    
    @Test
    void contextLoads() {
        // Spring happily mocks concrete implementations
    }
}
```

If you're still creating interfaces "because of mocking," you're solving a problem that hasn't existed for over a decade. Your IDE probably has better mocking support than your justification for interfaces.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>Interfaces serve as living documentation of your application's architectural boundaries!</Question>
<Answer>
Package structure, naming conventions, and actual documentation serve this purpose better. Interfaces without multiple implementations don't document architecture: they obscure it.
</Answer>
</QuestionAnswerBox>