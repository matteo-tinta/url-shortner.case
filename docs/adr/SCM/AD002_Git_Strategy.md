---
status: Accepted
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

We decided to use an hybrid git flow approach since:
- It will allow us to develop more "versions" of the software (staging, prod)
- It's simpler in terms of team knowledge
- It allow us to have a better history comparing to Github flow

We also going to use conventional commits (CC):
- first part is restricted to `fix` for fixes, `feat` for features, `docs` for docs/adr changes, `ci` for all ci related changes, `chore` for everything else.
- message should be composed as example: `feat(feature): brief english description in lowercase`

Features:
- split a branch from develop, called `feat/[feature]`
- develop the feature inside this branch -> splitting more branches from this branch **is ok** until they all refers to the same feature and they are all merged/deleted at the end
- open a PR on develop branch when finished

Branches:
- `main` branch will be protected, only PR changes is allowed
- `develop` branch is open for small fixes (eg: typos)
- `release/v[version]`: branches that identifies a specific release
- `feat/[feature]`: identifies a feature branch
- `fix/[feature]`: identifies a fix branch. Starting from main is suggested

Merges:
- no rebases, all merges on main branches (`main`, `develop`, `release`) must be done with --ff
- merges between feature branch is deliberatelly left to developer to handle

Releases:
> this section defines how a real world scenario will behave but we DO NOT enforce this in this case study
- split a `release/v1.2.3` branch from `main`
- since we are using conventional commit, we can run automatic tools for updating the changelog (eg: release-it) 
- update the version into the package.json (release-it does it automatically)
- push updated CHANGELOG + new version + code to create a new branch
- run a pipeline to release in prod

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
- *Accepted Tradeoff*: --ff will blend feature branches into a single branch, making impossible to understand it was developed into a feature branch

## More Information
- See [Git Flow vs GitHub Flow](https://codewithmukesh.com/blog/git-workflows-gitflow-vs-github-flow-vs-trunk-based-development/#:~:text=GitFlow%20uses%20multiple%20long%2Dlived,one%20version%20is%20in%20production.)