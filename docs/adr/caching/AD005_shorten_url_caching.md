---
status: Peding
date: 2026-05-18
---

# AD: URL Shortner Caching

## Context and Problem Statement
> Which concept is needed to achieve the architecture decision?

Urge a caching strategy for our redirect layer.

This layer must respond fast, we cannot allow it to read back and forth from persistence layer. So this layer will cache the short url key into a redis instance alongside with it's long url so reply are faster.

We will store the key in a *write-through* strategy since we have a lot of readings but not a lot of writings: this allows us to have even less overhead over the database instance.

## Decision Drivers
> Which drivers decides that this AD is important and why?
> 

* The application need to read and redirect FAST
* The persistence layer cannot handle so much readings per day: overload

## Considered Options
> Which options did you considered except the one you are taking (no options is not valid)

* Write-behind

## Decision Outcome
> What is the final decision, and why?

We decided to use *write-through* so that we can ensure that data is consistent. If something fails behind, we will always have the more centric one updated (persistence) first and having the cache populated after.

*Write-behind* writes the cache prior updating the persistence layer, and this may lead into an inconsitent state where services are not aligned.

The operation of writing is cosidered done if - and only if - both writing operations are went well. otherwise, it failed.

We also decided to use Redis so that cache can work well in scalable services since redis offers is a distributed caching system. Memory cache wont work, because multiple services means that the cache is unique in each of those services and thus inconsistent during calls

### Consequences
> What are the consequences of this approach? Must include both good and bad decisions

**Good**:
- *Data integrity*: forcing system synchronization (both writing must be ok) data will always have integrity among services
- *Faster reading*: cache will always be updated, thus there is any need to be double check the persistence layer which is there just for persistence in time.
 - *Faster reading*: since we are not lookup persistence so often, we are protecting it from overloading and eventually crashing.

**Bad**
- *Slower writings*: Since we are synchronzating two or more services, this will be slower.
- *Error more frequent*: Since we waiting for multiple services ok status, this may leading us into more frequent error (service unavailable, stuck, broken, ...)
