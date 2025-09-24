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

A simple cheat sheet for some of the most common `docker run` commands. Suitable for development environment, but more tinkering is needed if you want to run a production-grade container.

<!-- truncate -->

:::warning

You will need to adjust the value of container names, environment variables and other information by yourself to suit your development need.

:::

## Databases

### MySQL

Create a local instance of MySQL, using `mysql:latest` image with the following information:

<details>

* Container name: `mysql`

* Root user: `root`

* Password: `123456`

* Initial database: `mydatabase`

* Exposed ports: `3306`

* Volume: `mysql-volume`

</details>

<Tabs>

<TabItem value="windows" label="Windows">

```shell
docker run --detach --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 -e MYSQL_DATABASE=mydatabase -v mysql-volume:/var/lib/mysql mysql:latest
```

</TabItem>

<TabItem value="linux/macos" label="Linux/MacOS">

```shell
docker run \
  --detach \
  --name mysql \ 
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=mydatabase \
  -v mysql-volume:/var/lib/mysql 
  mysql:latest
```

</TabItem>

</Tabs>

### MariaDB

Create a local instance of MariaDB, using `mariadb:lts` image, with the following information:

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
docker run --detatch --name mariadb -e MARIADB_ROOT_PASSWORD=123456 -e MARIADB_DATABASE=mydatabase -p 3306:3306 -v mariadb-volume:/var/lib/mysql mariadb:lts
```

</TabItem>

<TabItem value="linux/macos" label="Linux/MacOS">

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

Create a local instance of Microsoft SQL Server, using `mcr.microsoft.com/mssql/server:2025-latest` image, with the following information:

<details>

* Container name: `sqlserver`

* Root user: `sa`

* Password: `123456Aa@`

* Initial database: `master`

* Exposed port: `1433`

* Volume: `sqlserver-volume`

SQL Server requires a complex password usage so we cannot use the simple `123456` as our default SA password.

</details>

<Tabs>

<TabItem value="windows" label="Windows">

```shell
docker run --detach -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=123456Aa@" -e "MSSQL_PID=Evaluation" -p 1433:1433 --name sqlserver --hostname sqlserver -v sqlserver-volume:/var/opt/mssql mcr.microsoft.com/mssql/server:2025-latest
```

</TabItem>

<TabItem value="linux/macos" label="Linux/MacOS">

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

Create a local instance of PostgreSQL, using `postgres:latest` image, with the following information:

<details>

* Container name: `posgresql`

* Root user: `posgres`

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

<TabItem value="linux/macos" label="Linux/MacOS">

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

Create a local instance of Oracle Database, using `gvenzl/oracle-free:slim-faststart` image, with the following information:

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

<TabItem value="linux/macos" label="Linux/MacOS">

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

Create a local instance of Apache Kafka, using `bashj79/kafka-kraft` image, with the following information:

<details>

* Container name: `kafka`

* Exposed port: `9092`

</details>

<Tabs>

<TabItem value="windows" label="Windows">

```shell
docker run --detach --name default-kafka -p 9092:9092 bashj79/kafka-kraft
```

</TabItem>

<TabItem value="linux/macos" label="Linux/MacOS">

```shell
docker run \
  --detach \
  --name kafka \
  -p 9092:9092 \
  bashj79/kafka-kraft
```

</TabItem>

</Tabs>

(to be updated)