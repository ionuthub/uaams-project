# UAT protocol

Issue #232, PRD-TEST-03. Sessions with representative users who are not the delivery team. Findings come from real sessions or the requirement stays open - a team walkthrough does not count and has already been recorded as exactly that.

## Participants

4-5 students who have never seen the platform. No developers, no flatmates who watched us build it. Record for each: participant number, date, device and browser. Never record their real name against findings - P1, P2, P3 is enough.

## Fictional applicant data

Participants must NOT use their own details. Give each a data sheet before the session:

| | P1 | P2 | P3 | P4 |
|---|---|---|---|---|
| Name | Maria Enescu | Tom Okafor | Lena Kovacs | Daniel Reid |
| DOB | 14/03/2004 | 02/11/2003 | 27/06/2004 | 19/01/2003 |
| Passport | FIC101234 | FIC205678 | FIC309012 | FIC403456 |
| Email | a fresh +alias supplied on the day | same | same | same |

Any document upload uses a supplied placeholder PDF, never a real document.

## Scenarios, one per participant

1. **Apply end to end.** "You want to study Computer Science at the University of Portsmouth. Create an account, apply, upload the required documents, and submit. Then find out what happens next."
2. **Return to a draft.** "You started an application yesterday. Sign in, finish it, and submit it." (Draft pre-created for their account.)
3. **Track and understand a decision.** "The university has responded. Sign in and find out what they said, and what it means for you." (Decision pre-recorded.)
4. **Withdraw.** "You have changed your mind about one of your applications. Withdraw it, and make sure you understand what that means."

## Running a session (20-30 min)

1. Read the scenario aloud. Hand over the data sheet. Say: "Think out loud. Nothing you can do is wrong - if something confuses you, that is a finding about the system, not about you."
2. Observer watches and takes notes. DO NOT HELP. Note every hesitation, wrong turn, re-read, and comment, with a rough timestamp.
3. Intervene only if the participant is fully stuck for over two minutes - and record the intervention as a finding.
4. Debrief, five minutes: What was confusing? What did you expect that did not happen? What would you tell a friend about it?

## Recording findings

One row per finding: participant, scenario step, what happened, severity (blocked / struggled / noticed), and later a decision: fix now, defer with reason, or accept. Findings we choose not to act on are recorded WITH the reason - an unactioned finding with reasoning is evidence; a missing one is a hole.

## Outputs

- This protocol, as run (note any deviations)
- Observer notes per session
- The findings table with decisions
- Fixes raised as repository issues linked to #232
- Compliance register PRD-TEST-03 updated citing #232
