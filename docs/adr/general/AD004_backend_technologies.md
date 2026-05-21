---
status: Accepted
date: 2026-05-18
---

# AD: Backend Technologies

## Context and Problem Statement
> Which concept is needed to achieve the architecture decision?

We are starting a new project (see [AD001](./AD001_Service_Architecture.md) for more info).

We have to decide which technologies and/or framework we are going to use in our backend services that satisfies the need of doing it alone since no team is available. 

## Decision Drivers

* It must be easy writing code (no verbose languages)

## Considered Options
> Which options did you considered except the one you are taking (no options is not valid)

1. Node + Express + Typescript
2. Python + Flask
3. Go
4. C# WebApi (dotnet)

## Decision Outcome
> What is the final decision, and why?

Even though in a real production scenario maybe go will handle this process in a better, suitable, faster and lightweight way we decided to go with Node + Express + Typescript because the team lack experience in Go applications.

Python is excluded because team is not confident about using it (knowledge too big to fill the gaps) this would likely bring another layer of complexity that we now want to avoid.

C# is the enterprise choice by design, it's secure, fast, use a lot of parallelism but the strong tradeoff is that it is verbose and uses a lot of resources while node has a faster setup + usage curve

### Consequences
> What are the consequences of this approach? Must include both good and bad decisions

**Good**:
- Team is more skilled on the Node stack
- More confidence on internal processes (unit tests, code)
- *Less Complex*: being more skilled allow us to reduce complexity

**Bad**:
- *More resources*: Node does not handle well a lot of simultaneous readings, so it will have to scale a lot more
- *Not so secure*: it needs to be secure by the people writing it, it does not provide any framework by design (which C# does) -> for this case study it will be ok, in production code we will expect to have a focused code reviews and a strong CI/CD (SonarQube?) that scans the repository and returns potential security issues and code smells.