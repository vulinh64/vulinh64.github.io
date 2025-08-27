---
slug: rant-single-interface-single-impl
title: 'Rant: Single Interface and Single Implementation Boogaloo'
authors: [vulinh64]
tags: [java, rant]
description: Why pollute your codebase?
thumbnail: 2025-08-25-rant-single-interface-single-impl.png
image: ./thumbnails/2025-08-25-rant-single-interface-single-impl.png
---

import { QuestionAnswerBox, Question, Answer } from '@site/src/components/QuestionAnswerBox';

Why do we still cling to the ancient dogma of single `Service` and single `ServiceImpl`? What are the pros and cons of this "methodology"?

This will be a very long rant post. I've put some sections into expandable boxes so that you can read them only when you need to.

<!-- truncate -->

## Abstraction (Yes, Why Not?)

You often encounter this "coding style" in codebases (particularly legacy ones, but surprisingly in recent projects too):

```java
interface Service {
  // abstract methods here
}

// There is absolutely one implementation of the Service
// in the whole codebase
public class ServiceImpl implements Service {
  // implementations here
}
```

When I started learning Java years ago, I was indoctrinated with this approach without question! Especially working on legacy projects from the pre-JDK 8 era (I still have PTSD about `SomethingDAO` and `SomethingDAOImpl`). I was too inexperienced to ask questions, later too intimidated to challenge those who came before me. Everyone adhered to this interface-implementation pattern religiously, and momentum built such inertia that stopping seemed impossible.

Even as a novice, I sensed problems:

* **File proliferation**: Each service class spawned its accompanying interface. Infuriating, and contributing to Java's reputation for verbosity. Lengthy syntax was bad enough, but the rigid mindset of developers convinced they followed "best practices" was worse.

* **Poor developer experience**: Using `Ctrl + Click` to navigate to method implementations? You'd land on the interface declaration instead. It required an extra step (`Ctrl + T`, or `Ctrl + Alt + B`/`Ctrl + Alt + Click` in IntelliJ) to reach actual implementation where logic resided.

* **Mental overhead**: Either create utility classes to escape this "interface hell", or grudgingly create another interface-implementation pair. You didn't dare question it because while instincts might be right, the established pattern carried institutional weight.

The supposed benefits (clear contracts, interface segregation, etc.) were mostly negligible in projects I worked on. These were self-contained applications, not frameworks or libraries for reuse, not exposing APIs as Service Provider Interfaces. I came to loathe this programming style intensely, especially the unquestioning adherence unless you had authority to challenge the status quo.

Fortunately, experiencing this antipattern didn't sour me on interfaces entirely. I've learned to appreciate their true power when used appropriately, when there's actual need for abstraction rather than cargo cult programming.

## When Interfaces Actually Earn Their Keep

### The Theoretical Heaven

Look, I'm not an interface nihilist. There are legitimate times when you absolutely need them, when they solve real problems, not imaginary ones:

<QuestionAnswerBox>
<Question>You're building a framework or library</Question>
<Answer>
Your users will implement your `PaymentProcessor` interface with their own credit card, crypto, or carrier pigeon implementations. Here, interfaces are contracts with the outside world, not internal ceremony.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>You already have multiple implementations in production</Question>
<Answer>
Not "*we might add Stripe someday*" but "*we currently use both PayPal and direct bank transfer, and customers can switch between them*". Real polymorphism for real business needs.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>You're mocking external systems</Question>
<Answer>
Your `EmailService` talks to SendGrid in production but needs a fake implementation for testing. This is system boundary isolation, not architectural theater.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>You're doing strategy pattern correctly</Question>
<Answer>
Different tax calculation algorithms based on country, each with genuine complexity that warrants separate classes. Not "*let's make everything pluggable just in case*". No just-in-case here, we want genuine needs here.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>You're writing Spring's Controller</Question>
<Answer>
Spring controllers are a rare case where interfaces can actually pull their weight, and I'm not just saying that to appease the framework gods.

Why?

You can dump all your OpenAPI annotations (can be overwhelmingly long), Spring-specific metadata (except for `@Controller` or `@RestController`, which Spring demands to wire up those precious beans), and even those cringe-worthy Javadocs into the interface. This keeps your controller implementation clean, focused, and free of annotation bloat.

:::warning

Only annotations marked with `@Inherited` will carry over. Take a look at the annotation's source code and see if it is annotated with said annotation.

:::

Moreover, if you’re exposing your API to the outside world, an interface can act as a clear contract for your endpoints, making it easier for consumers to understand what’s on offer without wading through implementation details. It’s not just ceremony here, it’s about separating the "what" from the "how" in a way that actually reduces clutter and improves maintainability.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>Javadocs in Service Classes</Question>
<Answer>
On the same spirit, for service classes, if you are asked to write the Javadocs (either suffering the painful manual typing or sending it to A.I chatbot and let it write it for you), you can seriously consider dumping the Javadocs to the interface and keep your "impl" class clean. This way, the interface will look like an actual contract and not just a childish drawing of ceremonious procedures.

By placing detailed method descriptions, parameter explanations, and return value documentation in the interface, you free your implementation class from repetitive boilerplate. The interface becomes a single source of truth for what the service does, while the impl class focuses on how it’s done. This approach leans into the idea of interfaces as contracts, giving them a purpose beyond mindless ritual and making your codebase less of a documentation nightmare.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>Making Use of Facade or Template Design Patterns</Question>
<Answer>
In the same vein, making use of the Facade or Template design patterns can at least provide some good uses for interfaces, even in single-implementation scenarios. It's similar to how accessors (those getters and setters) are theoretically meant to make field access safer and more controlled, but in practice, they often turn into glorified, mindless boilerplate generated by Lombok just to satisfy some dusty JavaBeans specifications.

At least with these patterns, the interface earns its keep by structuring complexity or algorithms in a meaningful way, rather than existing for the sake of existence.

For the Facade pattern, the interface acts as a simplified front for a tangled mess of subsystems, hiding the gory details and presenting a clean API. Even if there's only one facade implementation right now, it decouples the client from the chaos behind the scenes, making maintenance less of a nightmare.

Here's a quick demo example:

```java
// Complex subsystems
class PaymentProcessor {
    
  public void processPayment() {
    /* complex logic */
  }
}

class InventoryManager {
    
  public void updateStock() {
    /* complex logic */
  }
}

class NotificationService {
    
  public void sendConfirmation() {
    /* complex logic */
  }
}

// Facade Interface
interface OrderFacade {
    
  void placeOrder();
}

// Single Implementation (for now)
class OrderFacadeImpl implements OrderFacade {
    
  private final PaymentProcessor paymentProcessor;
  private final InventoryManager inventoryManager;
  private final NotificationService notificationService;

  public OrderFacadeImpl(
      PaymentProcessor paymentProcessor,
      InventoryManager inventoryManager,
      NotificationService notificationService) {
    this.paymentProcessor = paymentProcessor;
    this.inventoryManager = inventoryManager;
    this.notificationService = notificationService;
  }

  @Override
  public void placeOrder() {
    payment.processPayment();
    inventory.updateStock();
    notification.sendConfirmation();
  }
}

```

Clients just depend on `OrderFacade` and call `placeOrder()`, blissfully ignorant of the underlying spaghetti. If you later need a different facade for, say, bulk orders, you can add another impl without touching the clients.

For the Template pattern, the interface (or often an abstract class, but interfaces work too with default methods) defines the skeleton of an algorithm, letting implementations fill in the variable parts. This is great for enforcing a consistent process while allowing customization.

Demo example:

```java
// Template Interface
interface ReportGenerator {
    
  default void generateReport() {
    fetchData();
    processData();
    formatOutput();
    saveReport();
  }

  void fetchData();

  void processData();

  void formatOutput();

  void saveReport();
}

// Single Implementation (could add more later)
class PdfReportGenerator implements ReportGenerator {
  @Override
  public void fetchData() {
    /* SQL query or API call */
  }

  @Override
  public void processData() {
    /* crunch numbers */
  }

  @Override
  public void formatOutput() {
    /* PDF specific formatting */
  }

  @Override
  public void saveReport() {
    /* save as PDF */
  }
}

```

The interface ensures the steps are followed in order, but the impl handles the details. If you need an Excel version tomorrow, just implement another class, no need for rewriting the wheel.

These patterns give interfaces a real job: organizing code structure without premature over-abstraction. It's not cargo cult; it's actually solving problems like complexity hiding or algorithm consistency. Use them when they fit, not as an excuse to interface everything.

:::tip

Not sold on Facade or Template patterns? No sweat: stick to concrete classes if you’ve only got one implementation. **YAGNI** still rules, and you’re not obligated to cosplay as an enterprise architect just to prove a point. Readability and programming experience trump!

:::
</Answer>
</QuestionAnswerBox>

### A Disappointing Reality

These scenarios represent maybe 5% of the interfaces I've encountered in codebases. The other 95% were ceremony masquerading as engineering.

The real test: if removing the interface would break something beyond compilation, you probably need it. If it only breaks your architecture diagram, you probably don't.

## A Pragmatic Approach

Start with concrete classes. Refactor to interfaces when the need becomes real, not imaginary. Here's the practical workflow: begin with a single `PaymentProcessor` class. When you genuinely need to add Stripe alongside your existing PayPal implementation, then extract the interface. Takes 30 seconds with any decent IDE: right-click, extract interface, done. When interfaces are genuinely expected:

* Environment-based implementations: Your email service logs to `stdout` in development, sends internal emails in staging, and uses SendGrid in production. Three concrete implementations serving the same contract.

* Payment method expansion: You're launching with credit cards but know mobile payments are coming next quarter. Not "someday maybe" but actual roadmap items.

* A/B testing scenarios: You need to swap recommendation algorithms based on feature flags.

The key difference: these are concrete, near-term requirements, not hypothetical "what-ifs."

Default approach: Start concrete, refactor when multiple implementations actually exist. Stop creating interfaces for imaginary flexibility that never materializes.

## My Own Counter-Arguments

Here are some of my own counter-arguments for blindly using interface everywhere:

<QuestionAnswerBox>
<Question>SOLID principles, though?</Question>
<Answer>
**SOLID** doesn't mean "interface all the things!" **YAGNI** trumps premature abstraction. Creating single-implementation interfaces is like wearing a helmet while sitting in your living room. It is technically "safer" but missing the point entirely.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>But what about mocking for testing?</Question>
<Answer>
This argument died around 2010. Modern mocking frameworks handle concrete classes effortlessly. Mockito, the most popular Java mocking framework, has supported class mocking since version 2.x (released in 2016).

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

If you're still creating interfaces "for mocking," you're solving a problem that hasn't existed for over a decade. Your IDE probably has better mocking support than your justification for interfaces.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>Interfaces serve as living documentation of your application's architectural boundaries!</Question>
<Answer>
Package structure, naming conventions, and actual documentation serve this purpose better. Interfaces without multiple implementations don't document architecture, they obscure it instead.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>What about dependency inversion? We should depend on abstractions, not concretions!</Question>
<Answer>
Dependency inversion doesn't mandate interfaces everywhere. It's all about depending on stable abstractions. Your single-implementation `PaymentService` class can be plenty stable. The principle was written to prevent tight coupling to volatile dependencies, not to create busywork. If your concrete class has a stable API and single responsibility, you're already following the spirit of DIP.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>But interfaces make the code more "enterprise" and professional-looking!</Question>
<Answer>
Professional code solves real problems efficiently, not cosplaying as enterprise software. Adding interfaces for appearances is like wearing a three-piece suit to write code: it might look impressive but doesn't make you more productive. Your teammates will thank you for readable, navigable code over ceremonial abstractions.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>What if requirements change and I need multiple implementations later?</Question>
<Answer>
Then extract the interface when you actually need it. All it takes is 30 seconds with any modern IDE. Anticipating every possible future change is how you end up with overengineered messes. **YAGNI** exists for a reason. Code for today's requirements, refactor for tomorrow's reality.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>Interfaces improve code readability by showing the contract upfront!</Question>
<Answer>
Good method names, clear parameter types, and proper documentation improve readability. An interface that mirrors its single implementation line-for-line adds zero semantic value: it's just duplication with extra steps. If your concrete class methods need an interface to be readable, the real problem is naming and design.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>Our architecture team mandates it as a standard!</Question>
<Answer>
Architecture by decree rather than engineering judgment is how you get cargo cult programming. Standards should solve actual problems, not exist for their own sake. If the architecture team can't explain the specific value for your use case beyond "it's our standard," then it's bureaucracy masquerading as engineering discipline.
</Answer>
</QuestionAnswerBox>

<QuestionAnswerBox>
<Question>It makes dependency injection cleaner and more explicit!</Question>
<Answer>
Modern DI frameworks inject concrete classes just fine. Spring, Guice, and others handle concrete dependencies without breaking a sweat. Your `@Autowired PaymentService paymentService` works identically whether `PaymentService` is an interface or class. The DI container doesn't care, and neither should you unless you actually have multiple implementations to choose from.
</Answer>
</QuestionAnswerBox>

## Final Word

Ditch the reflex to slap interfaces on every service class. Most of the time, it’s just bureaucratic bloat masquerading as best practice. 

Use interfaces when they solve real problems, like framework contracts, multiple implementations, or patterns like Facade and Template that actually organize complexity. Start with concrete classes, refactor when needed, and keep **YAGNI** as your guiding star to avoid overengineered nonsense.

Everything has two sides, so question the pros and cons before making any decision. It is a part of our integrity.

Still, I know this is a controversy topic, so if you have any comment, let me know!

As a bonus, you can read this [article on Baeldung](https://www.baeldung.com/java-interface-single-implementation) for a better and more technical explanation than my long rant above!