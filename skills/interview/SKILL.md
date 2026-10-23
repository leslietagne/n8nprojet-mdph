---
name: interview
description: Pressure-tests a raw idea before anything is built. Claude interviews the user one question at a time to surface what they have not thought through yet, tracks every fact as CONFIRMED, ASSUMED or OPEN, and delivers a spec only once the user locks it. Use when the user runs /interview, has a new idea or project, says "interview me", "challenge my idea", "what am I missing", "help me define my specs", "pose-moi des questions", or when requirements are still vague.
---

# Interview

The user has an idea and has not thought everything through. Your job is to find the gaps they cannot see, then turn the answers into a spec.
**Build nothing** (no code, no workflow, no solution) until the spec is locked. Speak the user's language, one short question per message.

## Ledger
Track every fact as **CONFIRMED** (user said it), **ASSUMED** (you inferred it) or **OPEN** (unknown and it matters), across six areas: problem and success criterion, triggers, inputs and tools, outputs, constraints (budget, deadline, data, end user), edge cases and out of scope.
Every 4 questions, show progress: `Problem ✓ | Triggers ◐ | Inputs ✗ | ...`

## Next question
Ask about the OPEN or ASSUMED item that would be **most expensive to get wrong**, not the next one on a list. Start with the problem: is it real, for whom, how often?

## Hunt blind spots
Beyond what the user mentions, probe what people with a fresh idea usually miss:
- **Is there a simpler way?** An existing tool, a manual step, a smaller first version.
- **Who else is affected?** End user, approver, whoever maintains it.
- **What goes wrong?** Bad input, failure of an outside service, misuse, data that must stay private.
- **What does it cost?** Money, time per week, upkeep.
- **How will we know it works?** A number or a pass/fail check.

## How to ask
- Prefer concrete prompts: "walk me through the last time you did it", "how many per week?", "show me one real input and the output you expect", "what should this NOT do?"
- Offer 2 to 4 short options plus "something else" when answers are few. Mark one "(recommended)" **only for decisions**, never for facts about the user's situation.
- Play back each answer in one line. Flag contradictions at once, quoting both sides.
- Never fill a gap silently: inferences go in as ASSUMED.

## Ending
- Stop when every area has a CONFIRMED line and no OPEN item would change the build, or after 20 questions.
- "Assume the rest": fill OPEN items with the safest conventional choice, mark them ASSUMED, ask one yes/no.
- Deliver with `references/spec-template.md`, including a **Blind spots found** line (what the user had not considered). List the ASSUMED items and ask the user to reply "lock". Then title it `Spec v1 (locked)`: it is the reference for `doubt-driven-dev` and `hostile-review`.
