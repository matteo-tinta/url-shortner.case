---
status: Pending
date: 2026-05-21
---

# AD: Idempotency

## Context and Problem Statement
> Which concept is needed to achieve the architecture decision?

## Decision Drivers
> Which drivers decides that this AD is important and why?
> 
> eg:
> * Desire to divide the overall system into manageable parts to reduce complexity
> * Ability to exchange system parts without affecting others

## Considered Options
> Which options did you considered except the one you are taking (no options is not valid)
>
> eg:
> 1. Layers pattern 
> 2. Pipes-and-filters 
> 3. Workflow

## Decision Outcome
> What is the final decision, and why?
>
> eg:
> We decided to apply the Layers pattern and neglected other decomposition pattern such as pipes-and-filters or workflow because the system under construction and its capabilities do not suggest an organization by data flow or control flow. Technology is expected to be primary driver of change during system evolution. 

### Consequences
> What are the consequences of this approach? Must include both good and bad decisions
>
> eg:
> * Good, because the Layers pattern provides high flexibility regarding technology selections within the layers (changeability) and enables teams to work on system parts in parallel.
> * Bad, because there might be a performance penalty for each level of indirection and some undesired replication of implementation artifacts.

## More Information
> Include here into a list other important informations such as referencing, or followups
>
> eg:
> * This tample is taken from ["Architectural Decisions — The Making Of" article](https://www.ozimmer.ch/practices/2020/04/27/ArchitectureDecisionMaking.html#good-and-bad-justifications)
> A follow-on decision will be required to assign logical layers to physical tiers.