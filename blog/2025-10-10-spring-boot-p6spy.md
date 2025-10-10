---
slug: spring-boot-p6spy
title: Spring Boot + P6Spy for SQL Debugging
authors: [ vulinh64 ]
tags: [ spring boot, docker, postgresql ]
description: An alternative way to inspect generated SQL statements
thumbnail: 2025-10-10-spring-boot-p6spy.png
image: ./thumbnails/2025-10-10-spring-boot-p6spy.png
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This tutorial shows how to use P6Spy to inspect generated SQL statements when debugging a Spring Boot application. Because let's face it, squinting at TRACE logs is about as fun as a root canal.

<!-- truncate -->

## TL;DR

Here is the [complete repository](https://github.com/vulinh64/spring-boot-p6spy-demo) if you don't want to read the text below (it can be quite long, and I won't judge you for skipping ahead).

## Prerequisites

* Spring Boot 3 (version `3.5.6` at the time of this writing)

* JDK 25

## Initialize Our Spring Boot Application

Visit [Spring Initializr](https://start.spring.io/) to quickstart our Spring Boot program. It's like ordering a pizza, but for code. We will be using this configuration:

* Project: Maven (because Gradle is cool but we're keeping it simple today)

* Language: Java (version 25)

* Spring Boot: 3.5.6 (at the time of this writing)

* Dependencies:

    * Starter Web (without it, the application will terminate immediately after running, which is technically a successful execution but not very useful)

    * Spring Data JPA Starter

    * PostgreSQL Driver (we need an actual database, not an in-memory one like H2, to better illustrate the library's purpose. Plus, it's more "enterprise-y")

    * Lombok (because why not? Life's too short for getters and setters)

    * Liquibase (for automatic database schema generation, so we don't have to manually write CREATE TABLE statements like cavemen)

## The `pom.xml` File

For our project, this is the complete `pom.xml` file. Yes, it's XML. Yes, it's 2025. No, we're not going to talk about it.

<details>

<summary>`pom.xml` file</summary>

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.5.6</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.vulinh</groupId>
    <artifactId>p6spy-demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>p6spy-demo</name>
    <description>Demo project for Spring Boot</description>

    <properties>
        <java.version>25</java.version>

        <!-- https://mvnrepository.com/artifact/com.github.gavlyukovskiy/p6spy-spring-boot-starter -->
        <p6spy-springboot.version>1.12.0</p6spy-springboot.version>

        <!-- https://mvnrepository.com/artifact/org.mapstruct/mapstruct -->
        <mapstruct.version>1.6.3</mapstruct.version>

        <!-- https://mvnrepository.com/artifact/org.springdoc/springdoc-openapi-starter-webmvc-ui -->
        <springdoc.openapi.version>2.8.13</springdoc.openapi.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.liquibase</groupId>
            <artifactId>liquibase-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <!-- highlight-start --> 
        <dependency>
            <groupId>com.github.gavlyukovskiy</groupId>
            <artifactId>p6spy-spring-boot-starter</artifactId>
            <version>${p6spy-springboot.version}</version>
        </dependency>
        <!-- highlight-end -->
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>${mapstruct.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>${springdoc.openapi.version}</version>
        </dependency>
    </dependencies>

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
                        </path>
                        <path>
                            <groupId>org.mapstruct</groupId>
                            <artifactId>mapstruct-processor</artifactId>
                            <version>${mapstruct.version}</version>
                        </path>
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
        </plugins>
    </build>
</project>
```

</details>

Additional goodies we're throwing into the mix:

* MapStruct for easier entity-DTO mapping without boilerplate code. Because if I have to write one more manual mapper method, I'm going to lose it.

* `springdoc-openapi-starter-webmvc-ui` for making API calls via a GUI easier. Swagger UI is basically Postman's cooler cousin.

## Create Sample Database

You can run the following command to initialize a sample PostgreSQL Docker container. Copy-paste this bad boy into your terminal:

```shell
docker run --detach --name postgresql -e "POSTGRES_USER=postgres" -e "POSTGRES_PASSWORD=123456" -e "POSTGRES_DB=mydatabase" -p 5432:5432 -v postgresql-volume:/var/lib/postgresql/data postgres:alpine
```

This will create a PostgreSQL instance with:

* Initial database: `mydatabase` (creative, I know)

* Username: `postgres` (we're keeping it simple)

* Password: `123456` (yes, this is terrible for production, but this is a demo, Karen)

* The instance is accessible via port `5432`

* An external volume `postgresql-volume` (so your data survives container restarts)

## Connection Properties

Create (or rename `application.properties` to) our "configuration" file, `application.yaml`. Because YAML is objectively better than properties files, fight me:

```yaml
spring.datasource:
  url: jdbc:postgresql://localhost:5432/mydatabase
  username: postgres
  password: 123456
```

Yes, that's it. Our simple project only needs these four lines, and the configuration is (almost) ready! See how easy that was? Now, let's code!

## Sample Code Implementation

For an easier reading experience (and to save you from scrolling through a wall of Java), I will be using tabs to display the code.

### Our Data Classes (Entities, DTOs, Mappers, and Stuff)

#### Entity

<Tabs>

<TabItem value="entity" label="Entity">

```java
package com.vulinh.entity;

import module java.base;

import com.vulinh.data.Gender;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString
@Builder
public class Employee implements Serializable {

  @Serial private static final long serialVersionUID = 4867198256816172976L;

  @Id @UuidGenerator UUID id;

  String name;

  LocalDate birthDate;

  @Enumerated(EnumType.STRING)
  Gender gender;
}
```

</TabItem>

<TabItem value="gender" label="Gender Enum">

```java
package com.vulinh.data;

public enum Gender {
  MALE,
  FEMALE,
  APACHE_HELICOPTER // Because fuck DEI and ESG, there are only two biological genders
}
```

</TabItem>

</Tabs>

#### DTOs

Nothing fancy here, just some good old-fashioned Java records doing their thing.

<Tabs>

<TabItem value="EmployeeIdResponse" label="EmployeeIdResponse">

```java
package com.vulinh.dto;

import java.util.UUID;

public record EmployeeIdResponse(UUID id) {}
```

</TabItem>

<TabItem value="EmployeePageResponse" label="EmployeePageResponse">

```java
package com.vulinh.dto;

import module java.base;

public record EmployeePageResponse(UUID id, String name) {}
```

</TabItem>

<TabItem value="EmployeeRequest" label="EmployeeRequest">

```java
package com.vulinh.dto;

import module java.base;

import com.vulinh.data.Gender;

public record EmployeeRequest(String name, LocalDate birthDate, Gender gender) {}
```

</TabItem>

<TabItem value="EmployeeResponse" label="EmployeeResponse">

```java
package com.vulinh.dto;

import module java.base;

import com.vulinh.data.Gender;

public record EmployeeResponse(UUID id, String name, LocalDate birthDate, Gender gender) {}
```

</TabItem>

</Tabs>

#### Mapper

MapStruct does the heavy lifting here. It's basically magic, but the boring kind that actually works.

<details>

<summary>The `Employee` mapper class</summary>

```java
package com.vulinh.mapper;

import com.vulinh.dto.EmployeePageResponse;
import com.vulinh.dto.EmployeeRequest;
import com.vulinh.dto.EmployeeResponse;
import com.vulinh.entity.Employee;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.factory.Mappers;

@Mapper
public interface EmployeeMapper {

  // So you don't have to mock the damn thing
  EmployeeMapper INSTANCE = Mappers.getMapper(EmployeeMapper.class);

  // Convert Entity to DTO
  EmployeeResponse toEmployeeResponse(Employee employee);

  // Convert Entity to a minimal DTO for paging
  EmployeePageResponse toEmployeePageResponse(Employee employee);

  // Convert DTO to Entity
  Employee toEmployee(EmployeeRequest employeeRequest);

  // Merge DTO into an existing Entity
  void merge(EmployeeRequest employeeRequest, @MappingTarget Employee employee);
}
```

</details>

#### Exceptions and Handler

Because things go wrong, and we need to handle that gracefully (or at least pretend to).

<Tabs>

<TabItem value="exceptions" label="Exceptions">

```java
public class EmployeeNotFoundException extends RuntimeException {

  @Serial private static final long serialVersionUID = -3660291849879050821L;

  public EmployeeNotFoundException(UUID id) {
    super("Employee with id [%s] not found".formatted(id));
  }
}

public class EmployeeUnchangedException extends RuntimeException {

  @Serial private static final long serialVersionUID = -5371661974850849202L;

  public EmployeeUnchangedException(UUID id) {
    super("Data for employee with id [%s] is unchanged".formatted(id));
  }
}
```

</TabItem>

<TabItem value="handler" label="Exception Handler">

```java
package com.vulinh.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(RuntimeException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public String handleRuntimeException(RuntimeException exception) {
    log.error("Unexpected error occurred", exception);
    return "An unexpected error occurred. Please try again later.";
  }

  @ExceptionHandler(EmployeeNotFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  public void employeeNotFoundException(EmployeeNotFoundException exception) {
    logExpectedException(exception);
  }

  @ExceptionHandler(EmployeeUnchangedException.class)
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void employeeUnchangedException(EmployeeUnchangedException exception) {
    logExpectedException(exception);
  }

  private static void logExpectedException(Exception exception) {
    log.info(exception.getMessage());
  }
}
```

</TabItem>

</Tabs>

### And Then, Our Control Classes (Spring Beans, Main Class)

The controller is where the actual work happens. Well, "work" is a strong word. It's more like "data shuffling."

<Tabs>

<TabItem value="controller" label="Controller Class">

```java
package com.vulinh.controller;

import module java.base;

import com.vulinh.dto.EmployeeIdResponse;
import com.vulinh.dto.EmployeePageResponse;
import com.vulinh.dto.EmployeeRequest;
import com.vulinh.dto.EmployeeResponse;
import com.vulinh.exception.EmployeeUnchangedException;
import com.vulinh.mapper.EmployeeMapper;
import com.vulinh.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

// No service classes are needed for this simple CRUD

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeCRUDController {

  static EmployeeMapper EMPLOYEE_MAPPER = EmployeeMapper.INSTANCE;

  private final EmployeeRepository employeeRepository;

  // Sample demo, no validation enforced

  // Returns 201
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public EmployeeIdResponse createEmployee(@RequestBody EmployeeRequest employeeRequest) {
    return new EmployeeIdResponse(
        employeeRepository.save(EMPLOYEE_MAPPER.toEmployee(employeeRequest)).getId());
  }

  @GetMapping
  public Page<EmployeePageResponse> getAllEmployees(Pageable pageable) {
    return employeeRepository.findAll(pageable).map(EMPLOYEE_MAPPER::toEmployeePageResponse);
  }

  @GetMapping("/{id}")
  public EmployeeResponse getEmployeeDetails(@PathVariable UUID id) {
    return EMPLOYEE_MAPPER.toEmployeeResponse(employeeRepository.findByIdOrThrow(id));
  }

  // Returns 204 if data is unchanged
  @PutMapping("/{id}")
  public EmployeeIdResponse updateEmployee(
      @PathVariable UUID id, @RequestBody EmployeeRequest employeeRequest) {
    var employee = employeeRepository.findByIdOrThrow(id);

    // Skip the persistence part if data is unchanged
    if (StringUtils.equalsIgnoreCase(employee.getName(), employeeRequest.name())
        && Objects.equals(employee.getBirthDate(), employeeRequest.birthDate())
        && Objects.equals(employee.getGender(), employeeRequest.gender())) {
      throw new EmployeeUnchangedException(id);
    }

    EMPLOYEE_MAPPER.merge(employeeRequest, employee);

    return new EmployeeIdResponse(employeeRepository.save(employee).getId());
  }

  @DeleteMapping("/{id}")
  public void deleteEmployee(@PathVariable UUID id) {
    var employee = employeeRepository.findByIdOrThrow(id);

    employeeRepository.delete(employee);
  }
}
```

</TabItem>

<TabItem value="repository" label="Repository Class">

```java
package com.vulinh.repository;

import module java.base;

import com.vulinh.entity.Employee;
import com.vulinh.exception.EmployeeNotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

  @NonNull
  default Employee findByIdOrThrow(UUID id) {
    return findById(id).orElseThrow(() -> new EmployeeNotFoundException(id));
  }
}
```

</TabItem>

<TabItem value="main-class" label="Main Class">

```java
package com.vulinh;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode;

@SpringBootApplication
@EnableSpringDataWebSupport(pageSerializationMode = PageSerializationMode.VIA_DTO)
public class P6spyDemoApplication {

  // Spring Boot might fail to run the main method if the public access modifier isn't here,
  // even though JDK 25 no longer requires it.
  public static void main(String[] args) {
    SpringApplication.run(P6spyDemoApplication.class, args);
  }
}
```

</TabItem>

</Tabs>

### Database Changelog

Liquibase needs these files to know what tables to create. Think of it as assembly instructions, but for databases.

<Tabs>

<TabItem value="main-changelog" label="db.changelog-master.yaml">

```yaml
databaseChangeLog:
  - include:
      file: 0000-create-employee-table.sql
      relativeToChangelogFile: true
```

</TabItem>

<TabItem value="employee-table" label="0000-create-employee-table.sql">

```sql
CREATE TABLE employee
(
    id         UUID PRIMARY KEY,
    name       VARCHAR(255),
    birth_date DATE,
    gender     VARCHAR(255)
);

insert into employee (birth_date, gender, name, id)
values ('1994-11-09', 'MALE', 'John', '4d4cc49b-6507-4b0b-8ef9-8b7cdcc9cbd5'::uuid),
       ('1997-08-23', 'FEMALE', 'Jane', 'b58344cb-9776-49ee-ba89-79462bec2812'::uuid),
       ('1986-04-01', 'APACHE_HELICOPTER', 'Apache Helicopter', 'b05272ea-b83e-4e22-8ecb-e2295b7236c1'::uuid);
```

</TabItem>

</Tabs>

And with that, our application is ready to run! Time to see if all this actually works or if we're about to spend the next hour debugging `ClassNotFoundException`.

## Test Run

Fire up the program, then visit `http://localhost:8080/swagger-ui.html` to test our API calls for CRUD operations. It's like playing with a toy car, but nerdier.

### Find All Employees

Hit that GET endpoint and watch the magic happen. The logged SQL statements will look as follows:

```text
2025-10-10T13:44:02.747+07:00  INFO 1116 --- [nio-8080-exec-2] p6spy                                    : #1760078642747 | took 2ms | statement | connection 4| url jdbc:postgresql://localhost:5432/mydatabase
select e1_0.id,e1_0.birth_date,e1_0.gender,e1_0.name from employee e1_0 offset ? rows fetch first ? rows only
select e1_0.id,e1_0.birth_date,e1_0.gender,e1_0.name from employee e1_0 offset 0 rows fetch first 2 rows only;
2025-10-10T13:44:02.754+07:00  INFO 1116 --- [nio-8080-exec-2] p6spy                                    : #1760078642754 | took 2ms | statement | connection 4| url jdbc:postgresql://localhost:5432/mydatabase
select count(e1_0.id) from employee e1_0
select count(e1_0.id) from employee e1_0;
2025-10-10T13:44:02.756+07:00  INFO 1116 --- [nio-8080-exec-2] p6spy                                    : #1760078642756 | took 0ms | commit | connection 4| url jdbc:postgresql://localhost:5432/mydatabase

;

```

### Find a Specific Employee

Let's get specific and look up John. Poor guy has no idea he's being used as demo data.

```text
2025-10-10T13:45:04.651+07:00  INFO 1116 --- [nio-8080-exec-5] p6spy                                    : #1760078704651 | took 3ms | statement | connection 5| url jdbc:postgresql://localhost:5432/mydatabase
select e1_0.id,e1_0.birth_date,e1_0.gender,e1_0.name from employee e1_0 where e1_0.id=?
select e1_0.id,e1_0.birth_date,e1_0.gender,e1_0.name from employee e1_0 where e1_0.id='4d4cc49b-6507-4b0b-8ef9-8b7cdcc9cbd5';
2025-10-10T13:45:04.654+07:00  INFO 1116 --- [nio-8080-exec-5] p6spy                                    : #1760078704654 | took 1ms | commit | connection 5| url jdbc:postgresql://localhost:5432/mydatabase

;

```

### Create an Employee

Time to add someone to the database. Welcome to the team, whoever you are!

```text
2025-10-10T13:46:02.540+07:00  INFO 1116 --- [nio-8080-exec-3] p6spy                                    : #1760078762540 | took 2ms | statement | connection 6| url jdbc:postgresql://localhost:5432/mydatabase
insert into employee (birth_date,gender,name,id) values (?,?,?,?)
insert into employee (birth_date,gender,name,id) values ('1993-04-06T00:00:00.000+0700','MALE','Linh','d96080db-3cbe-4fb4-87e6-af920016b3fa');
2025-10-10T13:46:02.548+07:00  INFO 1116 --- [nio-8080-exec-3] p6spy                                    : #1760078762548 | took 5ms | commit | connection 6| url jdbc:postgresql://localhost:5432/mydatabase

;

```

### Update an Existing Employee

Oops, typo in the name. Let's fix that real quick.

```text
2025-10-10T13:46:50.030+07:00  INFO 1116 --- [nio-8080-exec-6] p6spy                                    : #1760078810030 | took 3ms | statement | connection 7| url jdbc:postgresql://localhost:5432/mydatabase
select e1_0.id,e1_0.birth_date,e1_0.gender,e1_0.name from employee e1_0 where e1_0.id=?
select e1_0.id,e1_0.birth_date,e1_0.gender,e1_0.name from employee e1_0 where e1_0.id='d96080db-3cbe-4fb4-87e6-af920016b3fa';
2025-10-10T13:46:50.036+07:00  INFO 1116 --- [nio-8080-exec-6] p6spy                                    : #1760078810036 | took 3ms | commit | connection 7| url jdbc:postgresql://localhost:5432/mydatabase

;
2025-10-10T13:46:50.050+07:00  INFO 1116 --- [nio-8080-exec-6] p6spy                                    : #1760078810050 | took 5ms | statement | connection 7| url jdbc:postgresql://localhost:5432/mydatabase
update employee set birth_date=?,gender=?,name=? where id=?
update employee set birth_date='1993-04-06T00:00:00.000+0700',gender='MALE',name='Linh 2' where id='d96080db-3cbe-4fb4-87e6-af920016b3fa';
2025-10-10T13:46:50.057+07:00  INFO 1116 --- [nio-8080-exec-6] p6spy                                    : #1760078810057 | took 5ms | commit | connection 7| url jdbc:postgresql://localhost:5432/mydatabase

;

```

### Delete an Existing Employee

Sorry buddy, you've been terminated. Not in the Schwarzenegger way, just in the database way.

```text
2025-10-10T13:47:25.675+07:00  INFO 1116 --- [nio-8080-exec-7] p6spy                                    : #1760078845675 | took 4ms | statement | connection 8| url jdbc:postgresql://localhost:5432/mydatabase
select e1_0.id,e1_0.birth_date,e1_0.gender,e1_0.name from employee e1_0 where e1_0.id=?
select e1_0.id,e1_0.birth_date,e1_0.gender,e1_0.name from employee e1_0 where e1_0.id='d96080db-3cbe-4fb4-87e6-af920016b3fa';
2025-10-10T13:47:25.680+07:00  INFO 1116 --- [nio-8080-exec-7] p6spy                                    : #1760078845680 | took 3ms | commit | connection 8| url jdbc:postgresql://localhost:5432/mydatabase

;
2025-10-10T13:47:25.693+07:00  INFO 1116 --- [nio-8080-exec-7] p6spy                                    : #1760078845693 | took 1ms | statement | connection 8| url jdbc:postgresql://localhost:5432/mydatabase
delete from employee where id=?
delete from employee where id='d96080db-3cbe-4fb4-87e6-af920016b3fa';
2025-10-10T13:47:25.700+07:00  INFO 1116 --- [nio-8080-exec-7] p6spy                                    : #1760078845700 | took 5ms | commit | connection 8| url jdbc:postgresql://localhost:5432/mydatabase

;

```

You can see the result already! No need for additional binding TRACE logging, just a simple library and you are good to go! It's like putting on glasses and suddenly being able to read the restaurant menu.

## Customize the Generated Statements

If you think that the generated statements are quite bloated and ugly (and let's be honest, they are), you can customize how the log is displayed. Let's Marie Kondo this thing.

In this example, we will display the statement with bound values only, because who needs all that extra fluff?

### Define Custom Logging

Add these lines into your `application.yaml` file:

```yaml
decorator.datasource.p6spy:
  custom-appender-class: com.vulinh.MyP6SpyLogging
  logging: custom
```

Then create our custom logging class. Don't worry, it's not as scary as it looks:

<details>

<summary>`com.vulinh.MyP6SpyLogging` class</summary>

```java
package com.vulinh.configuration;

import module java.base;

import com.p6spy.engine.logging.Category;
import com.p6spy.engine.spy.appender.Slf4JLogger;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

@Slf4j
public class MyP6SpyLogging extends Slf4JLogger {

  private enum LogCategory {
    ERROR,
    WARN,
    INFO,
    DEBUG,
    BATCH,
    STATEMENT,
    RESULTSET,
    COMMIT,
    ROLLBACK,
    RESULT,
    OUTAGE;

    static final Set<String> SETS =
        Arrays.stream(LogCategory.values()).map(Enum::name).collect(Collectors.toSet());
  }

  @Override
  public void logSQL(
      int connectionId,
      String time,
      long elapsed,
      Category category,
      String prepared,
      String sql,
      String url) {
    var categoryName = category.getName().toUpperCase();

    if (StringUtils.isBlank(sql)) {
      if (LogCategory.SETS.contains(categoryName)) {
        log.info(
            "#{} [ {} ] - {}",
            "%04d".formatted(connectionId),
            "%9s".formatted(categoryName),
            switch (LogCategory.valueOf(categoryName)) {
              case COMMIT -> "Transaction committed";
              case ROLLBACK -> "Transaction rolled back";
              case BATCH -> "Batch executed";
              case OUTAGE -> "Connection outage occurred";
              default -> "...";
            });

        return;
      }

      super.logSQL(connectionId, time, elapsed, category, prepared, sql, url);

      return;
    }

    log.info(sql);
  }
}
```

</details>

Now, our log will look like this (much better, right?):

```text
2025-10-10T15:40:39.751+07:00  INFO 18352 --- [nio-8080-exec-3] com.vulinh.MyP6SpyLogging                : select e1_0.id,e1_0.birth_date,e1_0.gender,e1_0.name from employee e1_0 where e1_0.id='4d4cc49b-6507-4b0b-8ef9-8b7cdcc9cbd5'
2025-10-10T15:40:39.754+07:00  INFO 18352 --- [nio-8080-exec-3] com.vulinh.MyP6SpyLogging                : #0004 [    COMMIT ] - Transaction committed
```

You can see the complete example in [`custom-logging-appender` branch](https://github.com/vulinh64/spring-boot-p6spy-demo/tree/custom-logging-appender).

## The Fine Print (But Funnier)

### SQL Statement Compatibility: The Database Drama

Look, we've all been there. You copy-paste that beautiful, ready-to-execute **SQL statement**, feeling like a coding rockstar, only to have your database throw a *hissy fit*. Why? Because databases are like stubborn siblings: they all want to do things their *own* way.

Our demo's statements should play nicely with PostgreSQL, but try that same line on an Oracle DB, and it might just give you the silent treatment (or, you know, a syntax error about datetime binding). **The moral of the story?** Always, *always* test those queries on your specific database. Don't let your database's unique quirks ruin your day.

### Environment-Specific Configuration: The Schizophrenic Logger

Your logger needs to know when to party and when to put on a suit and tie. That's where **Spring Profiles** come in, giving your logging behavior a split personality (in a good way!):

* **Development**: Unleash the Kraken! We want **detailed SQL logging with P6Spy**. See everything. Debug all the things. This is your all-access backstage pass.

* **Production**: Time to go dark. Disable that verbose SQL statement logging faster than a ninja. This cuts down on unnecessary overhead and, more importantly, keeps sensitive query data away from prying eyes (and massive log files).

Handle this split personality by conditionally loading your P6Spy settings based on your active profile in your `application.yaml` or `application.properties`. It's like giving your app a mood ring.

### Dependency Management: The Supply Chain Saga

Before you make the deployment, make sure your **production build environment** can actually *find* P6Spy. It lives happily on Maven Central, but if your production environment is running on a secluded mountain with no internet access (it happens!), you've got a couple of choices:

1.  **Set up a Private Maven Repository:** Build a little fortress of dependencies just for your application.

2.  **Bundle the JARs:** Shove the necessary JAR files right into your deployment package.

Basically, make sure your app's favorite library isn't ghosted at the last minute.

## The Grand Finale: Happy Coding!

Seriously, P6Spy is the MVP of SQL debugging in Spring Boot. You toss in **one dependency**, and BAM! You get gorgeous, clean, and *actually readable* SQL statements complete with the real parameter values. No more squinting at complex, multi-line **TRACE logging** configurations that look like ancient hieroglyphics.

And the **customization**? It's like a tailor for your logs. You can snip and tuck the output format until it shows exactly what you need, filtering out the digital noise and letting you laser-focus on the good stuff.

Whether you're hunting down a performance goblin or just confirming your application didn't generate a truly ridiculous query, P6Spy is your lightweight, effective sidekick. For the full, working example (because seeing is believing), go check out the **[GitHub repository](https://github.com/vulinh64/spring-boot-p6spy-demo)**.

Now go forth and debug with style!