---
name: hostile-review
description: Adversarial review of work that has been declared done (code, workflow, spec, document, slides). Claude does not trust the "it works": it re-tests every claim of the builder, runs a pre-mortem, attacks the work through five hostile personas, keeps only findings it can locate and prove, and ends with a SHIP or DO NOT SHIP verdict. No praise, no invented issues. Use when the user runs /hostile-review, says "tear this apart", "find the remaining flaws", "review before I submit", "trouve les failles", or after a build is announced as done.
---

# Hostile review

The work has been declared done. Assume it is not, and prove where. No compliments, no softening, no invented issues. Do not fix anything unless asked. Write in the user's language.

1. **Baseline**: read the spec (a locked spec from `interview` if there is one), brief or rubric. If none exists, state the objective in 3 lines and get it confirmed.
2. **Audit the "done"**: list every claim the builder made ("works", "tested", "handles X", each VERIFIED line of an evidence report). Re-test each one yourself on the current version. Earlier evidence does not count: things change, tests can be wrong. Mark each claim HOLDS or BROKEN.
3. **Pre-mortem**: imagine it already failed. Write the 3 most likely reasons, then check them first.
4. **Five personas**, each ending with findings or "checked X, solid" (see `references/attack-checklist.md`):
   - **Grader**: every requirement ticked one by one
   - **Breaker**: empty, duplicate, malformed, huge or accented input, run twice, service down
   - **Attacker**: secrets, sensitive data travelling too far, over-open access
   - **Newcomer**: what a stranger cannot understand or maintain
   - **Accountant**: unbounded costs, 10x volume, silent failures
5. **Prove or demote**: a finding needs a location (file:line, node, page) and a proof (reproduced, quoted, breaking input). Otherwise it is a **suspicion**, listed with the test that would settle it.
6. **Rank**: Blocker (fails the requirement, leaks data, breaks a rule), Major (fails a realistic edge case), Minor, Nit (3 max). Merge duplicates.

## Report
```
Verdict: SHIP / DO NOT SHIP (any Blocker or BROKEN claim = DO NOT SHIP)
Claims audited: | Claim | HOLDS / BROKEN | Proof |
Fix first: 1. 2. 3.
| # | Severity | Persona | Where | Problem | Proof | Fix |
Suspicions: | Suspicion | Test that settles it |
Solid: what was checked and held
```
On re-review, re-check each previous finding (fixed / not fixed) and look for regressions.
