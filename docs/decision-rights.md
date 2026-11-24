# Decision rights

Who decides what on this repository. The owner reviews everything but decides only what is in
the first table; everything else Claude decides, records where it belongs, and reports in one
line. Written down on 2026-11-23 from the owner's feedback of 2026-11-17, 11-19 and 11-22:
"my intervention only where it is really needed".

## The owner decides

| # | What | Why it is his |
| --- | --- | --- |
| O1 | Scope: a new pattern, starting or accepting a milestone, anything out of scope (CLAUDE.md 3) | Focus over breadth is a product call |
| O2 | A new dependency (CLAUDE.md 5) | It stays in the product for good |
| O3 | An approved rule or requirement: adding or removing one, its level, its text | The rules are what Earshot stands behind in public |
| O4 | A trade-off's published text, new or changed; once, when he can see it on the page | Hand-written, reviewed by him (CLAUDE.md 4) |
| O5 | Changing a fixed rule: a principle, a colour meaning, the pattern page's content order, the copy rules (`apps/atlas/CLAUDE.md`); or a request of his that conflicts with one (CLAUDE.md 8) | Fixed on purpose; only he unfixes them |
| O6 | A new page or section, or moving a section to another page | The site's structure is his layout |
| O7 | Giving up one measured property for another (the rule panel's invariants and ratchets) | A trade between two things he asked for |
| O8 | Publishing: pushing to the public repository, a release | Outward-facing and hard to take back |

## Claude decides, records, and says so in one line

| # | What | Recorded in |
| --- | --- | --- |
| C1 | Fixing a defect: which layer and file, and which engine or reference version carries it | The commit; the version's changelog |
| C2 | A reviewer's or auditor's finding: fix now, park in `docs/follow-ups/`, or decline because a fixed rule or an earlier decision settles it (cite it) | `docs/follow-ups/<pattern>.md` |
| C3 | How an approved rule is evaluated: which rule a defect belongs to, evaluator details, scenarios | The rules' header, the pattern brief |
| C4 | Look, layout and motion inside an existing section, within the visual language: spacing, alignment, sizes, tones in forced colours, motion timings | The commit; `design-review/` |
| C5 | Copy within the copy rules, except rule, requirement and trade-off text (O3, O4) | The commit |
| C6 | Order of work within an approved plan; which system is measured first | The plan or follow-up |
| C7 | Tests, invariants, hooks, agents, skills and evals | The commit; an ADR if hard to reverse |
| C8 | A question the owner has already answered: apply his answer and cite where it is recorded | — |

Hard-to-reverse decisions under C get a short ADR (CLAUDE.md 8). A thing that fits no row is
Claude's: decide, record, say so.

## How it reaches the owner

- A final message has a section for the owner only when something in it is under O1 to O8. Each
  item names its row ("O3"), gives a recommendation, and appears once; it is not repeated in
  later reports until something about it changes.
- Otherwise the message says nothing about decisions; non-critical findings go to
  `docs/follow-ups/`, not the chat.
- A reviewer that writes "question for the owner" is not deciding who decides: the item is
  judged against these tables like any other.
