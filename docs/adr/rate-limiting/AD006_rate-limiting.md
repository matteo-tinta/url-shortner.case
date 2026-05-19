---
status: Pending
date: 2026-05-19
---

# AD: Rate Limiting

## Context and Problem Statement
> Which concept is needed to achieve the architecture decision?

We think we are going to receive a lot of request (see [AD001](../general/AD001_Service_Architecture.md)).

Thus we cannot allow infinite rate count of every endpoint, so that:
- We can defend ourselves versus attacks such as DDos
- We can provide equal service access to everybody since we are limiting some client to access our services

We are going to use Redis and log the IP with the given timestamp and - as score - just the timestamp because the set will always be automatically sorted by timestamp by the infrastructure (Redis). 

## Decision Drivers
> Which drivers decides that this AD is important and why?

* Defend ourselves from spam attacks (eg: DDos)
* Equal api rate equals equal service access from users
* Reduce the overall resource usage both on server (request evaluation) and database access (since we are blocking requests, we avoid read or write to database at all)

## Considered Options
> Which options did you considered except the one you are taking (no options is not valid)

- Fixed window limit
- Moving window limit

## Decision Outcome
> What is the final decision, and why?
>

Even tho *fixed window limit* (with INCR) would be easier and faster to use and deploy, we decided to follow the *moving window limit* because the *fixed window limit* is exposed through flooding after the window is expired, eg: rate limit to 100 request every minute, with fixed window after the minute the user can flood 100 request fast and at every minute, forever. With moving window limit instead it can happen only 1 time until the whole key is expired.

### Consequences
> What are the consequences of this approach? Must include both good and bad decisions

**Good**:
- *Moving window* gives us a real rate limiting compared to *fixed window* because we avoid the hack of sending messages at the end of the window, to overflow the server.

**Bad**:
- *fixed windows* cannot cover the necessity of ddos in a time window (ig: 5 minutes) because a user can send 100 request at 11:59, and other 100 at 12:00 so we got 200 requests into 2 minutes