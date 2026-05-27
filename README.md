# Url Shortner - The Case Study

![Status:Development](https://img.shields.io/badge/status-development-yellow)

Case study exploring microservices patterns:
- OpenAPI
- rate limiting (sliding window),
- idempotency,
- distributed locking (both optimistic / pessimistic),
- write-through 
- caching
- circuit breakers

## Architectural decisions
- See [ADRs](./docs/adr/README.md) for the full ADRs list

## What is being done
### Persistence
![Status:Development](https://img.shields.io/badge/status-development-yellow)

- [ ] OpenAPI
- [x] Idempotency results and caching
- [x] Rate limiting
- [x] Distributed locking (optimisting and pessimistic)
- [ ] Rollbacks

### Redirect Service
![Status:Development](https://img.shields.io/badge/status-planned-darkgray)
- [ ] Circuit breaker
- [x] Write Through
- [x] Rate Limiting

## Future implementations
> These implementations will be considered when the above will work.
> This section will grow or shrink, it's not definitive.
- [ ] [User Authentication (oAuth2) with easy IAM Auth](https://github.com/matteo-tinta/easy.iam.authentication)
- [ ] [User Role Management for administration interfaces with internalize](https://github.com/matteo-tinta/internalize.headless)
- [ ] A real user interface (FE)

## How to run locally
### Persistence
- navigate inside persistence folder
- run `npm run start:dependencies` to run docker compose file
- run `npm run prisma:migrate` to apply migrations inside postgres
- run `npm run dev` to run the REST (level 2) application

### Redirect Service
*Not ready yet*