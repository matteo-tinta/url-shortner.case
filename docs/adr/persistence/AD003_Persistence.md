---
status: Accepted
date: 2026-05-18
---

# AD: Persistence Layer

## Context and Problem Statement

In our persistence layer we need to choose a technology that allows us faster readings than writings.
Since our cache layer may fail, and service die, we need that database keep its consistentency.

At this moment no previous technology are being adopted

## Decision Drivers

* Faster readings (allowed slower writings)
* *data integrity*: structured data will benefit us on long term because

## Considered Options

1. PostgreSQL (SQL)
2. MongoDB (no SQL)

## Decision Outcome

We decided to go for SQL because its faster on readings on larger datasets meaning we can access data faster in case our cache layer is dead.

### Consequences
**Good**:
- For complex analytical queries, Postgres outperforms MongoDB. For our single key equality lookup pattern, performance is comparable. Postgres chosen primarily for data integrity constraints enforced at DB level.
- *Migrations* We have migrations -> so we can update and rollback the database in a secure way. With them we can store *incrementally database updates* so deploying or updating the database in a new or already deployed application is faster and secure, ensuring also *backwards compatibility*
- *data integrity* is secured on infra layer (database enforced)

**Bad**:
- *More complexity*: Must add an ORM (PRISMA) in order to manage schemas and transations
- *Data Interigrity By Code*: Mongo does not provide minimal data integrity on infrastructure layer so a new service connecting to the database can break it up

## More Information
- [PRISMA ORM docs](https://www.prisma.io/docs/orm)
- [MongoDB vs PostgreSQL performance](https://www.mdpi.com/2504-2289/10/2/66)