---
status: Pending
date: 2026-05-18
---

# AD: Persistence Layer

## Context and Problem Statement

In our persistence layer we need to choose a technology that allows us faster readings and writings.
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
- PostgreSQL is faster in readings and writings
- We have transactions -> so we can update and rollback the database in a secure way
- With transactions we can store incrementally database updates (shipping is not a problem)
- *data integrity* is secured on infra layer (database enforced)

**Bad**:
- *More complexity*: Must add an ORM (PRISMA) in order to manage schemas and transations
- MongoDB feels "native" on javascript, since it stores jsons

## More Information
- [PRISMA ORM docs](https://www.prisma.io/docs/orm)
- [MongoDB vs PostgreSQL performance](https://www.mdpi.com/2504-2289/10/2/66)