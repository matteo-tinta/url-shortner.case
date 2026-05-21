---
status: Accepted
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
- Sliding window limit

## Decision Outcome
> What is the final decision, and why?

We chose *moving window limit* over *fixed window limit* to prevent flooding at window edges (e.g., 100 requests/minute; fixed window allows bursts). Redis ZADD will log requests with timestamps as scores, enabling sliding window calculations. When the limit is reached, a `429` error with a `RetryAfter` header will be returned. Current tracking uses IPs, which may cause issues behind proxies; future improvements will address this.

## Happy Path Flow
-> Request arrives, extract IP and timestamp
-> zRemRangeByScore of the old requests (identified by IP)
-> Did we exceeded the quota? no
-> zAdd the new request and set the TTL to window * 3 (so we can have an efficient sliding window) 
-> execute the request
-> (the set will expire by TTL or updated when the next request will arrive)

## 429 Flow
-> Request arrives, extract IP and timestamp
-> zRemRangeByScore of the old requests (identified by IP)
-> Did we exceeded the quota? yes
-> zRangeWithScores -> get the first request timestamp in the set
-> calculate the `RetryAfter` header in HTTP Date
-> Setting the header and returning 429 to the user
-> Exit 

> For now we are going just the IP to trace the user across the requests but this is not optimal because we could be behind a proxy thus loosing the real IP from where the user is reaching us thus all the traffic will be used within the same key (*shared state*). In future we should evaluate a stronger pattern.

Configuration is stored inside environment variables (in local with file .env) with these configuration:
```env
RATE_LIMIT_WINDOW_MS=10000
RATE_LIMIT_MAX_REQUESTS=1000
```

## Redis Down

If redis is down we fail closed with a 503.

### Consequences
> What are the consequences of this approach? Must include both good and bad decisions

**Good**:
- *Sliding window* gives us a real rate limiting compared to *fixed window* because we avoid the hack of sending messages at the end of the window, to overflow the server. E.g., user sends 100 requests at 23:59:50, then 100 more at 00:00:10 (total 200 in 20 seconds, bypassing the intent)
- *Less Query time*: in general, rate limiting limits the quantity of requests protecting our database infrastructure from spikes because we reject connections when they overflow the given rate leaving space for new connections (and users)

**Bad**:
- *Overall complexity*: adding rate limiting is a new layer of complexity because we need to manage connections to an external services which brings in new challenges such as maintenability
- *Fail closed*: Redis became a failure point, but its accepted because we really want to enforce rate limiting (in next ADRs we will evaluate a better strategy maybe with L1, L2 caches)