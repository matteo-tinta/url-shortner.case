---
status: Accepted
date: 2026-05-18
---

# AD: Subdivide Project in microservices

## Context and Problem Statement

We are starting a new project that will shortner urls. 

This project will be divided in two branches:
1. The url storage and url shortner key generation, this will handle:
    * storage responsibility (persistence)
    * creating a short url key from the long url key
    * update and delete operation on the url itself
2. The redirect service, this will handle:
    * given a short url, it will resolve the long url and - if found - redirect with a 302 Status Code or return a 404

Expected read/write: 1M read over 1k writes per day

Constraints:
* Fast redirect (avoid hangings)
* Updating and deletion of a shortage
* Rate limiting on url shortage creation and redirect
* Caching (Protecting) massive readings in persistence to leave space for writing
* Observability must cover the three pillars: Logs, Metrics, and Traces

## Decision Drivers

* Need to differenciate write from reading because it has different need to be scalable (a lot of readings, not so much writings)
* Need to protect persistence layer for continuous readings 
* So, possibility to exchange system parts without affecting others

## Considered Options

1. Monolith
2. Microservices

## Decision Outcome

We decided to go with microservices since, they provide:
* independent scalar necessity to cover the huge readings
* loose couplings so that we can exchange nodes independently

while monolith does not cover this scenarios:
* growing is all togheter, not single pieces - no need to scale persistence layer
* hard couplings makes exchanges of single part, hard
* scaling a monolith requires more resources per node, and it's hard to differenciate what service is needed the most observing the system.

### Consequences

**Good**:
- independent grow
- isolated nodes scalability can handle more traffic at once

**Bad**:
- More complexity (each service is a project)
- Loose coupling make observability hard (must enfornce trace ids)
- Each service has its own persistence which may lead to inconsistence between services
- Events between services can be lost causing inconsistent state (at-least-once delivery not guaranteed in this implementation). Acceptable for a case study — production systems should implement the Outbox pattern