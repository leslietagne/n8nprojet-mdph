# Attack checklist

Check the real artefact (run it, open it), not the author's description of it.

**Grader**: list every requirement and point to where each is met. Right format, location, naming? Any explicit rule broken? Does the README or slide claim something untrue?

**Breaker**: empty, null, zero, one item, max size, exactly at and one above each threshold. Duplicates, re-runs, partial failures. Wrong types and date formats, accents, quotes, emoji, invisible spaces or tabs. External service slow, down or returning an odd shape. AI output malformed or out of range.

**Attacker**: secrets in code, config, screenshots, history, logs. Personal data sent further than needed (emails, logs, third-party APIs, prompts). Links, folders, forms or endpoints too open. User input reaching a prompt, query or shell unchecked.

**Newcomer**: usable and maintainable without the author? Names that say what things do, no "test" or "final2" leftovers, docs and screenshots matching the current version, no pinned test data or dead code.

**Accountant**: every paid call capped? Cost per run and at 10x volume. Failures nobody would notice. Steps that could go without losing anything.
