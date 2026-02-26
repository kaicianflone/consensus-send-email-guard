---
name: consensus-send-email-guard
description: Open-source Consensus.Tools skill for governed AI decisions with board-native artifacts, strict JSON contracts, and deterministic policy behavior.
homepage: https://github.com/kaicianflone/consensus-send-email-guard
source: https://github.com/kaicianflone/consensus-send-email-guard
---

# consensus-send-email-guard

This skill is part of the Consensus.Tools ecosystem and is designed for production-grade agent governance.

## Why this skill exists

Most agent systems fail because a single model decides and executes without explicit arbitration. This skill addresses that by applying consensus-style controls:

- structured multi-perspective evaluation
- hard-block safety checks
- deterministic aggregation and replayable outputs
- board-native artifact persistence for auditing

## Core capabilities

- strict input/output JSON contracts for pipeline integration
- deterministic policy evaluation where possible
- idempotent retry behavior to avoid duplicate side effects
- versioned artifacts written to board ledger history

## Stack assumptions

- built to compose with consensus-interact workflows
- uses consensus-tools board/job/submission primitives
- designed to integrate with persona-generator persona_set artifacts

## Quick start

Use the repo examples and run script to execute locally.

## Expected outcomes

- a decision/result artifact persisted to board state
- optional updated persona_set artifact for adaptive governance
- machine-parseable output suitable for automation systems
