---
slug: quick-common-docker-run-commands
title: Quick Common Docker Run Commands
authors: [ vulinh64 ]
tags: [ docker ]
description: Quick commonly used Docker run commands
thumbnail: 2025-09-24-quick-common-docker-run-commands.png
image: ./thumbnails/2025-09-24-quick-common-docker-run-commands.png
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

A simple cheat sheet for some of the most common `docker run` commands. Suitable for development environments, but more tinkering is needed if you want to run production-grade containers.

<!-- truncate -->

:::warning

You will need to adjust the values of container names, environment variables, and other information yourself to suit your development needs.

:::

## Databases

### MySQL

Create a local instance of MySQL, using the `mysql:latest` image with the following information:

<details>

* Container name: `mysql`

* Root user: `root`

* Password: `123456`

* Initial database: `mydatabase`

* Exposed port: `3306`

* Volume: `mysql-volume`

</details>

<Tabs>

<TabItem value="windows" label="Windows">

```shell
docker run --detach --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 -e MYSQL_DATABASE=mydatabase -v mysql-volume:/var/lib/mysql mysql:latest
```

</TabItem>

<TabItem value="not-windows" label="Linux/MacOS">

```shell
docker run \
  --detach \
  --name mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=mydatabase \
  -v mysql-volume:/var/lib/mysql \
  mysql:latest
```

</TabItem>

</Tabs>

### MariaDB

Create a local instance of MariaDB, using the `mariadb:lts` image, with the following information:

<details>

* Container name: `mariadb`

* Root user: `root`

* Password: `123456`

* Initial database: `mydatabase`

* Exposed port: `3306`

* Volume: `mariadb-volume`

</details>

<Tabs>

<TabItem value="windows" label="Windows">

```shell
docker run --detach --name mariadb -e MARIADB_ROOT_PASSWORD=123456 -e MARIADB_DATABASE=mydatabase -p 3306:3306 -v mariadb-volume:/var/lib/mysql mariadb:lts
```

</TabItem>

<TabItem value="not-windows" label="Linux/MacOS">

```shell
docker run \
  --detach \
  --name mariadb \
  -e MARIADB_ROOT_PASSWORD=123456 \
  -e MARIADB_DATABASE=mydatabase \
  -p 3306:3306 \
  -v mariadb-volume:/var/lib/mysql \
  mariadb:lts
```

</TabItem>

</Tabs>

### SQL Server

Create a local instance of Microsoft SQL Server, using the `mcr.microsoft.com/mssql/server:2025-latest` image, with the following information:

<details>

SQL Server requires complex password usage, so we cannot use the simple `123456` as our default SA password.

* Container name: `sqlserver`

* Root user: `sa`

* Password: `123456Aa@`

* Initial database: `master`

* Exposed port: `1433`

* Volume: `sqlserver-volume`

</details>

<Tabs>

<TabItem value="windows" label="Windows">

```shell
docker run --detach -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=123456Aa@" -e "MSSQL_PID=Evaluation" -p 1433:1433 --name sqlserver --hostname sqlserver -v sqlserver-volume:/var/opt/mssql mcr.microsoft.com/mssql/server:2025-latest
```

</TabItem>

<TabItem value="not-windows" label="Linux/MacOS">

```shell
docker run \
  --detach \
  --name sqlserver \
  --hostname sqlserver \
  -e "ACCEPT_EULA=Y" \
  -e "MSSQL_SA_PASSWORD=123456Aa@" \
  -e "MSSQL_PID=Evaluation" \
  -p 1433:1433 \
  -v sqlserver-volume:/var/opt/mssql \
  mcr.microsoft.com/mssql/server:2025-latest
```

</TabItem>

</Tabs>

### PostgreSQL

Create a local instance of PostgreSQL, using the `postgres:latest` image, with the following information:

<details>

* Container name: `postgresql`

* Root user: `postgres`

* Password: `123456`

* Initial database: `mydatabase`

* Exposed port: `5432`

* Volume: `postgresql-volume`

</details>

<Tabs>

<TabItem value="windows" label="Windows">

```shell
docker run --detach --name postgresql -e "POSTGRES_USER=postgres" -e "POSTGRES_PASSWORD=123456" -e "POSTGRES_DB=mydatabase" -p 5432:5432 -v postgresql-volume:/var/lib/postgresql/data postgres:latest
```

</TabItem>

<TabItem value="not-windows" label="Linux/MacOS">

```shell
docker run \
  --detach \
  --name postgresql \
  -e "POSTGRES_USER=postgres" \
  -e "POSTGRES_PASSWORD=123456" \
  -e "POSTGRES_DB=mydatabase" \
  -p 5432:5432 \
  -v postgresql-volume:/var/lib/postgresql/data \
  postgres:latest
```

</TabItem>

</Tabs>

### Oracle Database

Create a local instance of Oracle Database, using the `gvenzl/oracle-free:slim-faststart` image, with the following information:

<details>

* Container name: `oracledb`

* Root user: `SYSTEM`

* Password: `123456`

* Default schema: `FREE`

* Exposed port: `1521`

* Volume: `oracledb-volume`

</details>

<Tabs>

<TabItem value="windows" label="Windows">

```shell
docker run --detach --name oracledb -e "ORACLE_PASSWORD=123456" -v oracledb-volume:/opt/oracle/oradata -p 1521:1521 gvenzl/oracle-free:slim-faststart
```

</TabItem>

<TabItem value="not-windows" label="Linux/MacOS">

```shell
docker run \
  --detach \
  --name oracledb \
  -e "ORACLE_PASSWORD=123456" \
  -v oracledb-volume:/opt/oracle/oradata \
  -p 1521:1521 \
  gvenzl/oracle-free:slim-faststart
```

</TabItem>

</Tabs>

## Apache Kafka (Without Zookeeper)

Create a local instance of Apache Kafka, using the `bashj79/kafka-kraft` image, with the following information:

<details>

* Container name: `kafka`

* Exposed port: `9092`

</details>

<Tabs>

<TabItem value="windows" label="Windows">

```shell
docker run --detach --name kafka -p 9092:9092 bashj79/kafka-kraft
```

</TabItem>

<TabItem value="not-windows" label="Linux/MacOS">

```shell
docker run \
  --detach \
  --name kafka \
  -p 9092:9092 \
  bashj79/kafka-kraft
```

</TabItem>

</Tabs>

## Redis

Create a local instance of Redis, using the `redis:alpine` image, with the following information:

<details>

* Container name: `redis`

* Exposed port: `6379`

* Password: `123456` (use `redis-cli` and type `auth 123456` to access Redis on the command line interface)

* Volume: `redis-volume`

</details>

<Tabs>

<TabItem value="windows" label="Windows">

```shell
docker run --detach --name redis -v redis-volume:/data -p 6379:6379 redis:alpine redis-server --requirepass 123456 --save 60 1 --loglevel warning
```

</TabItem>

<TabItem value="not-windows" label="Linux/MacOS">

```shell
docker run \
  --detach \
  --name redis \
  -v redis-volume:/data \
  -p 6379:6379 \
  redis:alpine \
  redis-server --requirepass 123456 --save 60 1 --loglevel warning
```

</TabItem>

</Tabs>

## Keycloak

### Without External Database

Create a local instance of Keycloak, using the `quay.io/keycloak/keycloak:latest` image, with the following information:

<details>

* Container name: `keycloak`

* Credentials:

  * Admin username: `admin`
  
  * Admin password: `123456`

  - Visit `localhost:8080` and use `admin`/`123456` as username and password to log in

- Exposed ports: `8080` and `9000` (for health check and metrics)

</details>

<Tabs>

<TabItem value="windows" label="Windows">

```shell
docker run --name keycloak --detach -p 8080:8080 -p 9000:9000 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=123456 -e KC_HEALTH_ENABLED=true -e KC_METRICS_ENABLED=true quay.io/keycloak/keycloak:latest start-dev
```

</TabItem>

<TabItem value="not-windows" label="Linux/MacOS">

```shell
docker run \
  --name keycloak \
  --detach \
  -p 8080:8080 \
  -p 9000:9000 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=123456 \
  -e KC_HEALTH_ENABLED=true \
  -e KC_METRICS_ENABLED=true \
  quay.io/keycloak/keycloak:latest \
  start-dev
```

</TabItem>

</Tabs>

### With External Database

With an external database, you need additional environment variables:

<details>

* `KC_DB`: The vendor of the external database. Supported values are `mariadb` (MariaDB), `mssql` (SQL Server), `mysql` (MySQL), `oracle` (Oracle Database), and `postgres` (PostgreSQL).

* `KC_DB_URL_HOST`: The hostname of the chosen database vendor

* `KC_DB_URL_PORT`: The port number of the chosen database vendor (by default, `3306` for MySQL/MariaDB, `1433` for SQL Server, `5432` for PostgreSQL, and `1521` for Oracle Database)

* `KC_DB_DATABASE`: The database schema to be used. Sometimes you need to provide `KC_DB_SCHEMA` as well.

* `KC_DB_USERNAME`: The username

* `KC_DB_PASSWORD`: The password

</details>

#### Example

Suppose you want to connect to an external PostgreSQL database (often on the same network) with the hostname `postgres` and credentials `keycloak`/`123456`. This will be your new `docker run` command:

<Tabs>

<TabItem value="windows" label="Windows">

```shell
docker run --name keycloak --detach -p 8080:8080 -p 9000:9000 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=123456 -e KC_HEALTH_ENABLED=true -e KC_METRICS_ENABLED=true -e KC_DB=postgres -e KC_DB_URL_HOST=postgres -e KC_DB_URL_PORT=5432 -e KC_DB_DATABASE=keycloak -e KC_DB_USERNAME=keycloak -e KC_DB_PASSWORD=123456 quay.io/keycloak/keycloak:latest start-dev
```

</TabItem>

<TabItem value="not-windows" label="Linux/MacOS">

```shell
docker run \
  --name keycloak \
  --detach \
  -p 8080:8080 \
  -p 9000:9000 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=123456 \
  -e KC_HEALTH_ENABLED=true \
  -e KC_METRICS_ENABLED=true \
  -e KC_DB=postgres \
  -e KC_DB_URL_HOST=postgres \
  -e KC_DB_URL_PORT=5432 \
  -e KC_DB_DATABASE=keycloak \
  -e KC_DB_USERNAME=keycloak \
  -e KC_DB_PASSWORD=123456 \
  quay.io/keycloak/keycloak:latest \
  start-dev
```

</TabItem>

</Tabs>

You can see this [demo repository](https://github.com/vulinh64/spring-boot-3-keycloak-integration) for better usage of Keycloak with external PostgreSQL.

(to be updated)