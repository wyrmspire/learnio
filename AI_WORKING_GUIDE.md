# AI Working Guide

This document defines the architectural invariants of the system.
Any AI modifying this codebase MUST follow these rules.

If a change violates these invariants, the change is incorrect even if it "works".

## Architectural Invariants (DO NOT VIOLATE)

1. This system is EVENT-SOURCED.
   - No UI component may mutate domain state directly.
   - All state changes happen via Commands → DomainEvents → EventStore.

2. Commands are PURE FUNCTIONS.
   - Commands validate input and RETURN events.
   - Commands do not read from or write to the store.
   - Commands do not perform side effects.

3. The Event Store is the Source of Truth.
   - Read models are ALWAYS derived.
   - No derived state is persisted independently.
   - Replaying the same events MUST produce the same read models.

4. UI Never Contains Business Logic.
   - UI dispatches commands.
   - UI renders read models.
   - UI does not calculate confidence, stability, or progression.

5. PDCA Logic Lives ONLY in lib/pdca/.
   - UI uses the reducer.
   - Stage rules are not duplicated elsewhere.

If a proposed change breaks any of the above, reject it.

This alone will save you months.

## How to Think About This System

Think of this app as a LEARNING FACTORY.

- Commands = operator actions
- Events = production telemetry
- Read models = dashboards
- PDCA reducer = process controller

The system does NOT store "progress".
It stores EVENTS and derives progress.

Never ask:
❌ "Where is progress stored?"

Always ask:
✅ "Which events produce this read model?"

## Safe Change Patterns

### Adding a New Capability Signal
1. Add a new DomainEvent type
2. Emit it from a Command
3. Update derived read models
4. Update UI to render the new signal

### Changing Confidence Logic
1. Modify command logic only
2. Ensure determinism
3. Update tests
4. Do NOT patch confidence in UI or store

### Adding a New Screen
1. Consume existing hooks
2. If new data is needed, add it to read models
3. Do NOT read raw events directly from UI

## Forbidden Changes

DO NOT:
- Write to localStorage outside the EventStore
- Calculate confidence or stability in React components
- Fetch data directly in pages without the DataClient
- Add stateful logic to API route handlers
- Persist read models
- Skip Zod validation at boundaries

## Production Evolution Path (DO NOT JUMP AHEAD)

Current:
- Local EventStore
- Client-side command execution

Next:
- Server-side command execution
- DB-backed event store
- Read models via API

Later:
- Auth
- Multi-tenancy
- Background processors

Rule:
Do NOT implement future stages early.
Only scaffold them.
