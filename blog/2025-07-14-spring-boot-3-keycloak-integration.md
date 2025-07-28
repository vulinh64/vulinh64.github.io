---
slug: spring-boot-3-keycloak-integration
title: Spring Boot 3 + KeyCloak Integration
authors: [vulinh64]
tags: [java, spring boot, keycloak, spring security, oauth2, docker]
description: How to integrate your Spring Boot 3 application with KeyCloak
---

# Spring Boot 3 + KeyCloak Integration

This is a comprehensive guide on how to integrate KeyCloak into your Spring Boot application.

<!--truncate-->

## TL;DR

<details>

<summary>⚠️ If you are lazy and do not want to read this whole article, click here!</summary>

If you are impatient and don't want to read (we are now in the era of absolute *brainrot* and A.I infesting, damaging and corroding our own lives), there is a link to the GitHub repository that backs this article, here:

> https://github.com/vulinh64/spring-boot-3-keycloak-integration

### **Quick Summary:** 

We're integrating Spring Boot 3 with KeyCloak using OAuth2 Resource Server. You'll get JWT-based authentication with role-based access control. The whole setup takes about 30 minutes if you don't mess around.

The source code should be workable in most cases when you successfully clone (or download) it to your local computer.

</details>

## What we need

If you managed to reach this part, congratulations, your brain is still working well.

In this example, we need:

* An instance of KeyCloak (Docker recommended unless you enjoy pain)
* A demo Spring Boot 3 application
* Basic understanding of OAuth2 and JWT (if you don't know these, go learn them first)
* Coffee (optional but highly recommended)

## Installing KeyCloak

It is better that you should be using Docker at this point. You can manually run the KeyCloak standalone application, but you will need to do some manual configuration, and frankly, why would you torture yourself?

I'll show you two approaches: a quick development setup and a more robust production-ready setup with persistent data.

### Option 1: Quick Development Setup (Single Container)

<details>

Start your KeyCloak docker container, using this command:

```shell
docker run -d -p 8080:8080 -p 9000:9000 \
  -e KC_HEALTH_ENABLED=true \
  -e KC_METRICS_ENABLED=true \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  --name standalone-keycloak \
  quay.io/keycloak/keycloak:26.3 start-dev
```

This command fires up a Keycloak container using its volatile H2 database.

**Pro-Tip:** Add the `-e KC_HOSTNAME=keycloak` parameter to the docker run command. This configures the JWT `iss` (issuer) claim to use the container's service name (e.g., `http://keycloak:8080/realms/spring-boot-realm`). This allows your Spring Boot application to consistently connect to Keycloak using the service name `keycloak`, which works for both debugging from your IDE and running in a fully containerized environment.

:::warning

This setup is... fragile, and all your configurations will be vaporized the moment the container is deleted.

:::

</details>

### Option 2: Setup with Docker Compose

<details>

For a more robust setup that includes PostgreSQL persistence and proper data management, the source code repository already includes a comprehensive `docker-compose.yaml` file that sets up:

- **KeyCloak server** with proper configuration
- **PostgreSQL database** for data persistence
- **External volumes** for data that survives container restarts
- **Health checks** to ensure proper startup order
- **Network isolation** for security

If you are lazy, go to [TL;DR](#tldr), again. The backing source code is there. Download it, or clone it.

**Why use the Docker Compose setup instead of the simple container?**

- **Data persistence:** Your configurations, users, and realms won't disappear when you restart containers
- **Production-ready:** Uses PostgreSQL instead of the default H2 database
- **Better performance:** Proper JVM tuning and dedicated database
- **Easier management:** Start/stop everything with simple commands
- **Health checks:** Containers wait for dependencies to be healthy before starting

**To use the Docker Compose setup from the repository:**

```shell
# From the project root folder
docker-compose up -d
```

```shell
# Check logs
docker-compose logs -f keycloak
```

```shell
# Stop everything
docker-compose down
```

```shell
# Stop and remove volumes (WARNING: This will delete all data!)
docker-compose down -v
```

**Important Notes:**
- Change the default passwords in production!
- PostgreSQL data is persisted in external volumes
- If you need to reset everything, use `docker-compose down -v` to remove volumes
- The setup includes health checks to ensure proper startup order

</details>

### Option 3: Option #1 Plus an external PostgreSQL Database for Data Persisting

<details>

The accompanying source code includes a [script](https://github.com/vulinh64/spring-boot-3-keycloak-integration/blob/main/run-keycloak-postgresql.cmd) (named `run-keycloak-postgresql.cmd`). Running it will start KeyCloak with a PostgreSQL database that uses an external volume for data persistence, preventing any data loss.

</details>

## Visiting KeyCloak Administrator Interface

Access http://localhost:8080 (by default configuration) and start configuring KeyCloak (we need a realm, a client, some test users and some client roles for this article).

Default login username is `admin`, and default password is `admin`, as defined in the configuration above.

## Adding Required Information to KeyCloak

Keycloak's user interface is rather straightforward, though it can be overwhelming if you're new to it. We will be using pre-defined names in this article to keep things simple:

### Step-by-step KeyCloak Configuration:

<details>

<summary>KeyCloak basic info</summary>

1. **Create a Realm:**
    - Realm name: `spring-boot-realm`

2. **Create a Client:**
    - Client ID: `spring-boot-client`
    - Client type: `OpenID Connect`
    - Remember to tick the "**Direct Access grants**" checkbox
   
3. **Create Client Roles:**
   - `role_admin` (for administrator privilege)
   - `role_user` (for normal user privilege)

4. **Create Users:**
   - `admin` with role `role_admin`, password `123456` (or your own choice of password)
   - `user` with role `role_user`, password `123456` or your own choice

</details>

After you configured KeyCloak, it is time to write our Spring Boot application.

## Kickstart Our Spring Boot Application

### Dependency

We start with the very basic of a Maven project:

<details>

#### Spring Boot Parent POM

```xml
<!-- Spring Boot parent pom -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.3</version>
    <relativePath/>
</parent>
```

#### Global Properties

```xml
<!-- Some properties -->
<properties>
    <java.version>21</java.version>
    <springdoc.openapi.version>2.8.9</springdoc.openapi.version>
</properties>
```

#### Minimum Dependencies

We will be needing these dependencies (and yes, I'm using Maven because I am not used to work with Gradle much, but same principles could):


<summary>Maven's POM</summary>

```xml
<!-- Basic dependencies -->
<dependencies>
   <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
   </dependency>
   <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-security</artifactId>
   </dependency>
   <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
   </dependency>
   <!-- For health check -->
   <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-actuator</artifactId>
   </dependency>
   <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <optional>true</optional>
   </dependency>
   <dependency>
      <groupId>org.apache.commons</groupId>
      <artifactId>commons-lang3</artifactId>
   </dependency>
   <!-- For Swagger UI -->
   <dependency>
      <groupId>org.springdoc</groupId>
      <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
      <version>${springdoc.openapi.version}</version>
   </dependency>
</dependencies>
```

#### Build Configurations

If you want to use Lombok (and you should, unless you enjoy writing boilerplate code), then you need to do additional configurations:

<summary>Maven build settings</summary>

```xml
<!-- Maven build settings -->
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <annotationProcessorPaths>
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                        <version>${lombok.version}</version>
                    </path>
                    <!-- other annotation processors below -->
                </annotationProcessorPaths>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <excludes>
                    <exclude>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                    </exclude>
                </excludes>
            </configuration>
        </plugin>
        <!-- Other plugins -->
    </plugins>
</build>
```

</details>

You can always visit [Spring Initializr](https://start.spring.io/) to generate your own project, and then make your own changes to fit your preferences.

### The `application.yaml` Hero We Need (and Deserve!)

<details>

<summary>`application.yaml` Example</summary>

YAML is GOAT.

Period.

~~Traditional `application.properties` is for the weak.~~

Therefore, rename the ~~peasant~~ `application.properties` into a more elegant `application.yaml` and start adding properties, for example:


```yaml
application-properties:
   realm-name: spring-boot-realm
   client-name: spring-boot-client
   admin-privilege-urls:
      - /test/admin/**
   no-auth-urls:
      # OpenAPI Swagger URLs
      - /swagger-ui.html
      - /swagger-ui/**
      - /v3/api-docs/**
      - /v3/api-docs.yaml
      # Actuator endpoints:
      - /actuator/**
      # Custom no-auth URLs:
      - /test/free
server.port: 8088
spring:
   threads.virtual.enabled: true # Make use of Spring Boot 3.2+ Virtual Threads support
   security.oauth2.resourceserver:
      jwt.issuer-uri: http://${KEYCLOAK_HOST:localhost:8080}/realms/${application-properties.realm-name}
logging.level:
   # If you are curious about how Spring Security OAuth2 works behind the scene
   org.springframework.security.oauth2: TRACE
```

Note that our KeyCloak instance is running on port `8080`, and therefore, we will be using a different port (`8088`) for our Spring Boot application, as defined in `server.port` property.

</details>

### Using Java Record Like a Sir to Inject Application Properties

:::warning

Spring Boot 3 requires Java 17 as minimum baseline, and with that, we gain access to the noble Java records. Forget about peasant classes with getters and setters, Java Records are the way forward, aside from JPA entities, and you cannot change my mind.

:::

Create our own record to store application properties, like this:

<details>

<summary>`ApplicationProperties.class` file</summary>

```java
// Import omitted for brevity

@ConfigurationProperties(prefix = "application-properties")
public record ApplicationProperties(
    String clientName, List<String> adminPrivilegeUrls, List<String> noAuthUrls) {}

```

Look at the `application.yaml` file above, we are storing our properties in `application-properties` part. And therefore, we will be using prefix `application-properties` in our record class.

</details>

And finally, register your configuration properties in the main class:

<details>

<summary>Spring Boot's main class</summary>

```java
// Import omitted for brevity

@SpringBootApplication
@EnableConfigurationProperties(ApplicationProperties.class)
public class Application {

  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}

```

</details>

### Our Security Configuration

#### `SecurityConfig` class

Create a `SecurityConfig` class and start defining our security configuration:

<details>

<summary>`SecurityConfig` Class</summary>

```java
// Import omitted for brevity

@Slf4j
@EnableWebSecurity
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

  private final ApplicationProperties applicationProperties;

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity, JwtConverter jwtConverter)
      throws Exception {
    return httpSecurity
        .headers(
            headers ->
                headers
                    .xssProtection(
                        xssConfig ->
                            xssConfig.headerValue(
                                XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                    .contentSecurityPolicy(cps -> cps.policyDirectives("script-src 'self'")))
        .csrf(AbstractHttpConfigurer::disable)
        .cors(customizer -> customizer.configurationSource(corsConfigurationSource()))
        .sessionManagement(
            sessionManagementConfigurer ->
                sessionManagementConfigurer.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            customizer ->
                customizer
                    .requestMatchers(asArray(applicationProperties.noAuthUrls()))
                    .permitAll()
                    .requestMatchers(asArray(applicationProperties.adminPrivilegeUrls()))
                    .hasAuthority(UserRole.ROLE_ADMIN.name())
                    .anyRequest()
                    .authenticated())
        .oauth2ResourceServer(
            customizer ->
                customizer.jwt(
                    jwtConfigurer -> jwtConfigurer.jwtAuthenticationConverter(jwtConverter)))
        .build();
  }

  @Bean
  public RoleHierarchy roleHierarchy() {
    var roleHierarchy = "%s > %s".formatted(UserRole.ROLE_ADMIN, UserRole.ROLE_USER);

    log.info("Role hierarchy configured -- {}", roleHierarchy);

    return RoleHierarchyImpl.fromHierarchy(roleHierarchy);
  }

  private static CorsConfigurationSource corsConfigurationSource() {
    var corsConfigurationSource = new UrlBasedCorsConfigurationSource();

    var corsConfiguration = new CorsConfiguration();

    corsConfiguration.setAllowCredentials(true);

    var everything = List.of("*");

    corsConfiguration.setAllowedOriginPatterns(everything);
    corsConfiguration.setAllowedHeaders(everything);
    corsConfiguration.setAllowedMethods(everything);

    corsConfigurationSource.registerCorsConfiguration("/**", corsConfiguration);

    return corsConfigurationSource;
  }

  private static String[] asArray(List<String> list) {
    return list.toArray(String[]::new);
  }

  // Customized UserDetails object
  public record AuthorizedUserDetails(
      UUID userId,
      String username,
      String email,
      Collection<? extends GrantedAuthority> authorities)
      implements UserDetails {

    public AuthorizedUserDetails {
      authorities = authorities == null ? Collections.emptyList() : authorities;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
      return authorities;
    }

    // No credentials expose
    @Override
    public String getPassword() {
      return null;
    }

    @Override
    public String getUsername() {
      return username;
    }
  }
}

```

And `UserRole` enum:

```java
public enum UserRole {
  ROLE_ADMIN,
  ROLE_USER
}
```

</details>

We are using the default KeyCloak JWT payload, which would look like this:

<details>

<summary>JSON Example</summary>

```json
{
  
  "exp": 1752478679,
  "iat": 1752478379,
  "sub": "a5f7aea0-219e-42a9-95bb-60fc5c096b92",
  "azp": "spring-boot-client",
  "resource_access": {
    "spring-boot-client": {
      "roles": [
        "role_admin"
      ]
    }
  },
  "preferred_username": "admin",
  "email": "admin@service.com"
}
```

:::important

The `resource_access` claim is where KeyCloak stores the client-specific roles. This is different from realm roles, so make sure you're assigning CLIENT roles to your users.

:::

</details>

To get our access token, import the following CURL to your Postman:

<details>

<summary>Example CURL command</summary>

```shell
curl --location 'http://localhost:8080/realms/spring-boot-realm/protocol/openid-connect/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=password' \
--data-urlencode 'client_id=spring-boot-client' \
--data-urlencode 'username=admin' \
--data-urlencode 'password=123456'
```

</details>

The response will contain an `access_token` field - copy that value and use it in your Authorization header as `Bearer {token}`.

#### `JwtConverter` class

<details>

<summary>`JwtConverter` Class</summary>

And this is our custom `JwtConverter` class, the protagonist of this project:

~~(We are still responsible for mapping KeyCloak roles into Spring Security roles and authority, too bad)~~

```java
// Import omitted for brevity

@Component
@RequiredArgsConstructor
public class JwtConverter implements Converter<Jwt, UsernamePasswordAuthenticationToken> {

  static final String RESOURCE_ACCESS_CLAIM = "resource_access";
  static final String EMAIL_CLAIM = "email";

  private final ApplicationProperties applicationProperties;

  @Override
  @SuppressWarnings("unchecked")
  public UsernamePasswordAuthenticationToken convert(Jwt jwt) {
    var clientName = applicationProperties.clientName();

    // cannot have different authorized party
    if (!clientName.equalsIgnoreCase(jwt.getClaimAsString("azp"))) {
      throw new AuthorizationException(
          "Invalid authorized party (azp), expected [%s]".formatted(clientName));
    }

    // get the top-level "resource_access" claim.
    var resourceAccess =
        nonMissing(jwt.getClaimAsMap(RESOURCE_ACCESS_CLAIM), RESOURCE_ACCESS_CLAIM);

    // get the map specific to our client ID.
    var clientRolesMap =
        (Map<String, Collection<String>>)
            getMapValue(resourceAccess, clientName, RESOURCE_ACCESS_CLAIM);

    // get the collection of role strings from that map.
    var roleNames = getMapValue(clientRolesMap, "roles", RESOURCE_ACCESS_CLAIM, clientName);

    var authorities =
        roleNames.stream()
            .filter(StringUtils::isNotBlank)
            .map(String::toUpperCase)
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toSet());

    var userDetails =
        new SecurityConfig.AuthorizedUserDetails(
            UUID.fromString(nonMissing(jwt.getSubject(), "subject")),
            nonMissing(jwt.getClaimAsString("preferred_username"), "username"),
            nonMissing(jwt.getClaimAsString(EMAIL_CLAIM), EMAIL_CLAIM),
            authorities);

    return UsernamePasswordAuthenticationToken.authenticated(
        userDetails, jwt.getTokenValue(), authorities);
  }

  private static <T> T getMapValue(Map<String, T> map, String key, String... origin) {
    var claimName =
        ArrayUtils.isEmpty(origin) ? key : "%s.%s".formatted(String.join(".", origin), key);

    return nonMissing(map.get(key), claimName);
  }

  private static <T> T nonMissing(T object, String name) {
    if (object == null) {
      throw new AuthorizationException("Claim [%s] is missing".formatted(name));
    }

    return object;
  }
}

```

And `AuthorizationException`, our simple exception we throw when something goes wrong:

```java
// Import omitted for brevity

public class AuthorizationException extends RuntimeException {

  @Serial private static final long serialVersionUID = -4977646741872972264L;

  public AuthorizationException(String message) {
    super(message);
  }
}
```

Nothing spectacular here, just a custom exception to make debugging easier.

</details>

That's basically the core of our application!

And all hail the `var` keyword. 

~~And screw explicit data type definitions, ain't nobody got time for that! What's point of knowing the explicit data type when you still have to Ctrl + Click to access the actual class?~~

### Testing Our Application

Create a simple `@RestController` and start testing:

<details>

<summary>`Controller` class</summary>

```java
// Import omitted for brevity

@RestController
@RequestMapping("/test")
public class Controller {

  @GetMapping("/free")
  public String free() {
    return "Hello";
  }

  @GetMapping
  public String hello() {
    return "Hello, World!";
  }

  @GetMapping("/admin")
  public String adminAccess() {
    return "Hello admin";
  }
}

```

</details>

You can access [Swagger UI](http://localhost:8088/swagger-ui/index.html) and test the APIs by yourself, or using Postman to make API calls. The Swagger UI link requires no authorization to access.

**Testing scenarios:**

1. **No token:** Should return 401 Unauthorized, but can access `/test/free`
2. **Valid token with role_user:** Can access `/test`, BUT NOT `/test/admin`
3. **Valid token with role_admin:** Can access everything due to role hierarchy

If we obtain the correct access token, we can access `/test` just fine.

The endpoint `/test/admin` requires `role_admin`, and cannot be accessed if the access token doesn't have this role.

## Troubleshooting

### 1. "Client not allowed for direct access grants" error

<details>

Check if "Direct Access grants" is enabled for the client.

</details>

### 2. "Account is not fully set up" even with correct credentials

<details>

Check if:

- The user has enough information (email, first name, last name);
- Or the user has correct credentials information (with password and not temporary status)
- Or the user has finished all the "required user actions" (setting up OTP, update password, etc...). In this simple example, such actions are out of scope, and we will not be going that far.

</details>

### 3. "Realm does not exist" error

<details>

Check if the realm `spring-boot-realm` is created properly.

</details>

TBA

## Conclusion

We have successfully created our Spring Boot 3 application and integrated with KeyCloak as an authorization server. The setup provides JWT-based authentication with role-based access control, which is exactly what you need for modern microservices.

Now it's time to apply this to your real projects and see the results for yourself! And remember - if it doesn't work the first time, it's probably a configuration issue. Check your logs, they don't lie (maybe).