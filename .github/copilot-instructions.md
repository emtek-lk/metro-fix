# AI agent instructions (pointer)

This repo keeps one set of agent instructions for every AI tool: **read `AGENTS.md` first** (architecture, design system, lifecycle, documentation upkeep in section 6, working agreement in section 7), then `STATUS.md` (current state and backlog) and `PRODUCT.md` (what we are building).

Non-negotiables, repeated here because they are easy to miss:
- Update `STATUS.md` and the doc that owns any fact you change, in the same change as the code.
- Verify with real commands (AGENTS.md 7.3) and report failures honestly.
- Never run destructive SQL against the shared dev database, never weaken auth, never commit or push unless asked.
