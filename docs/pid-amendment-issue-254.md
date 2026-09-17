# PID amendment for application references and applicant layout

This amendment records the implementation branch for issue 254. It does not claim
that the changes have been merged, deployed or accepted by external users.

## Results paragraph

Following further team approval, issue 254 introduces readable, unique application
references and improves the applicant page's alignment, spacing and date/status
labels. Each application keeps its original internal identifier, with an additional
permanent reference displayed consistently in applicant and admin views. The admin
queue supports searching by either identifier, and CSV includes both. The shared
desktop sidebar is kept visible while scrolling. Unlike the earlier presentation-only
changes, reference allocation adds server logic and stored metadata and therefore
has its own verification record. At the time of this amendment, implementation and
local checks are complete on the feature branch; deployment verification remains
outstanding.

## Appendix A data model addition

Issue 254 adds `applications.referenceNumber` and two server-only collections:
`applicationReferenceCounters/{year}` containing `lastSequence`, and
`applicationReferences/{referenceNumber}` containing the existing `applicationId`.
A transaction allocates and reserves a unique number and stores it on the existing
record. The internal ID and all existing relationships remain unchanged. Previously
submitted applications use their submission year; drafts use their creation year
and keep that reference thereafter. Existing applications are assigned references
when accessed, without replacing their data or changing historical timestamps.
The earlier ERD remains a snapshot of its stated commit; this is an additive schema
extension documented with issue 254.

## Appendix F later verification addition

On 17 September 2026, the reference implementation passed 13 unit tests and six
Firestore-emulator integration tests. The integration checks covered concurrent and
repeated allocation, preservation of existing application data, legacy years,
university/ownership restrictions, refusal of client reference writes, allowed
ordinary updates and counter-conflict handling. Browser rendering of the changed
pages with isolated test data checked desktop/mobile layout, matching displayed
references, admin search/filtered CSV, sidebar scrolling and reference fallback.
The screenshots are local render evidence, not authenticated production tests or
external UAT. Signed-in deployment verification remains outstanding.

Evidence: [issue 254](https://github.com/ionuthub/uaams-project/issues/254) and
the [verification folder](evidence/issue-254/README.md). Preserve the dated July and
August acceptance records unchanged. After deployment verification, add the actual
build identifier and results rather than relabelling these local checks.
