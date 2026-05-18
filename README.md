# Url Shortner - The Case Study

This test cases is used mainly to adapt, and improve my knowledge of microservices and the managing of multiple ADRs like it was a real case scenario

Some take off before going deep in:
- This repository will use the same database instance, but different tables (no NASA pc unfortunatelly): but in reality every service has it's own database instance.

## Core feature
- Url shortner: take in an url, store it inside a database and when prompt a redirect is made

## Core principles (in practice)
- ADR writing
- rate limiting
- idempotency and atomic operations
- microservices
- No AI involved (except made for english polishing)