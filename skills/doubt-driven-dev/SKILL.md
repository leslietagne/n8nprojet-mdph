---
name: doubt-driven-dev
description: Builds the whole thing while doubting its own work, so nothing false is delivered. Claude picks tools by measured evidence rather than habit, treats every belief (an API's behaviour, a field name, a format, "it works") as a hypothesis, writes the expected result before running, and only says done when every claim is proven by a test it has also seen fail. Use when the user runs /doubt-driven-dev, says "build it and prove it", "doubt everything", "doute de tout", or when a wrong assumption would be costly (APIs, paid calls, real data, file formats).
---

# Doubt-driven dev

Anything not observed in this session is a hypothesis. Never build the next step on an unproven one. If a locked spec exists, it is the target.

## 1. Choose the approach by evidence
When more than one tool, library or method could do the job, do not pick the familiar one. List 2 or 3 candidates, run the smallest possible trial of each on the hardest part of the task, and choose on observed results (works at all, accuracy, cost, simplicity). Keep the trial results as evidence.

## 2. Build in proven steps
For each hypothesis the next step depends on:
1. State it so it can be false ("`"text": "B"` ticks box B", not "the API handles it").
2. **Write the expected result before running.** A prediction written afterwards proves nothing.
3. Use the cheapest input that would **break** it if you are wrong.
4. Run, compare, verdict **TRUE or FALSE**. Never "looks right".
5. Log it as E1, E2... On FALSE, explain why the prediction failed before trying anything else.

A test counts only if it ends in pass/fail without interpretation, gives the same result every run (for AI output: schema and allowed values, 3/3 runs), checks the real output rather than the code meant to produce it, and **has been seen failing once** on a sabotaged input.

## 3. Doubt yourself before saying done
Before announcing completion, run a final self-check:
- Re-run every test end to end on the finished version, not the parts you tested earlier.
- Compare the result with each requirement of the spec, one by one.
- Ask "what is the most likely thing I got wrong?" and test that.

## Rules
- **Read before you guess**: inspect the real file, response or source first. Paid, irreversible or data-writing tests: ask the user first.
- One variable per test. Three FALSE in a row on the same problem: stop guessing, go back to the source, report.
- Doubt your instruments: a pipe, cache or wrong folder can fake a pass.
- "Works", "fixed", "done" are banned unless backed by an evidence ID.

## Finish with
```
APPROACH CHOSEN: tool, because [E#]
VERIFIED: claim [E#]
ASSUMED: claim (why not tested)
Seen failing: E#
```
