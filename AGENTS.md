# Agents.MD

The role of this file is to describe common mistakes and confusion points that agents might encounter as they work in this project. If you ever encounter something in the project that suprises you, please alert the developer working with you and indicate that this is the case in the AgentMD file to help prevent future agents from having the same issue.

## Guidelines

- keep chat short and concise.
- All code must be optimized, readable, secure, and testable. Prefer clarity over cleverness, avoid premature abstractions, never hardcode secrets, and ensure new logic can be covered by unit tests. Also keep the UI easy to read and understand and accessible.

## Reference Specifications

For architecture, data flow, and module responsibilities, see the following specs:

- [specs/architecture.md](specs/architecture.md) — High-level architecture
- [specs/data-flow.md](specs/data-flow.md) — Data flow through the system
- [specs/webapp.md](specs/webapp.md) — Web application structure
- [specs/midi-convert.md](specs/midi-convert.md) — MIDI conversion logic

Refer to these files for guidance when working on or extending agents in specific areas.

## Gotchas about the project

- webapp lives in /webapp/-folder, not in root. run `yarn` in /webapp/ and install packages in /webapp/ and not in root!
- use yarn instead of npm.
- remember to check build works with `yarn build` and tests with `yarn test` after making changes.
