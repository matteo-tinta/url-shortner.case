---
status: Pending
date: 2026-05-18
---

# AD: SCM as Git Strategy

## Context and Problem Statement

We are starting a new project (refer to [AD001](./AD001_Service_Architecture.md) for more information) and we need to decide which git branching strategy and commit we are going to use in order to have a consistent project history and commits.

## Decision Drivers

* Desire to have a detailed history from which understand features
* Desire to have meaningful tags, so that we can refine the search
* Desire to have a `main` protected branch which identifies the current deployable state of arts, and a `develop` branch where we merge only finished features.

## Considered Options

1. Git Flow
2. GitHub Flow

## Decision Outcome

We decided to use git flow since:
- It will allow us to develop more "versions" of the software (prod, staging, prod)
- It's simpler in terms of team knowledge
- It allow us to have a better history comparing to Github flow

We also going to use conventional commits (CC):
- first part is restricted to `fix` for fixes, `feat` for features, `docs` for docs/adr changes, `ci` for all ci related changes, `chore` for everything else.
- message should be composed as example: `feat(feature): brief english description in lowercase`

Features:
- Each feature start from develop, is developed in one or more features and then a final PR is opened towards main with --ff

Branches:
- `main` branch will be protected, only PR changes is allowed
- `develop` branch is open for small fixes (eg: typos)
- `feat/[feature]`: identifies a feature branch
- `fix/[feature]`: identifies a fix branch. Starting from main is suggested

Merges:
- no rebases, merges with --ff

Releases:
- Will discuss this in a new ADR when needed

### Consequences

**Good:**
- Better suite for the team (already on git flow)
- Easy to manage different releases and understanding which release is where
- Allows us to go progressivelly into prod (having a stage environment is good). For this case study, development in local is the staging environment but in a real scenario we will need a different environment where to deploy a staging packet.
- CC allows us to be precise on what the commit contains
- --ff allows us to have a linear history
- avoiding rebases is good because we avoid to overwrite histories by accidents

**Bad**
- Complex, if you are not used to. (not our case)
- Longer for onboarding users
- CC is an added thing over an hard flow, for a team is good but for a single person it could lead into an overbloat history. 
- --ff will blend feature branches into a single branch, making impossible to understand it was developed into a feature branch

## More Information
- See [Git Flow vs GitHub Flow](https://codewithmukesh.com/blog/git-workflows-gitflow-vs-github-flow-vs-trunk-based-development/#:~:text=GitFlow%20uses%20multiple%20long%2Dlived,one%20version%20is%20in%20production.)