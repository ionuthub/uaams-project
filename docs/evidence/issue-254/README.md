# Application references and applicant layout verification

Date: 17 September 2026. Issue: [254](https://github.com/ionuthub/uaams-project/issues/254).
Base: `develop` at `ef5d011`. The commit containing this evidence identifies the tested changes.

## Change

Applications receive a unique, permanent `APP-year-number` reference from an
authenticated server endpoint. Applicant cards/details and admin queue/details
display the same number. Admin search accepts both the new number and the original
ID; CSV retains the original ID and adds the readable reference. Submission email
and withdrawal notification reference text use the stored number where available.
Application URLs, ownership, documents, dates and decisions retain their existing IDs.

The applicant detail page retains its existing sections and fields, aligns labels
and values, uses readable status/date wording and consistently spaces the content.
The shared desktop sidebar remains at the viewport top during page scrolling;
mobile navigation remains collapsible.

## Recorded local checks

| Check | Expected result | Actual result |
|---|---|---|
| Unit suite | Format, search, authentication and request validation pass alongside existing tests | 13 passed |
| Locked dependency checks | Repository validation, unit suite and production build succeed after clean `npm ci` | Passed with Next.js 15.5.20 |
| Concurrent allocation | Different applications receive different references; repeated allocation of one record consumes one number | Passed against Firestore emulator |
| Legacy dates and drafts | Original year is used; numbers remain permanent | Passed against Firestore emulator |
| Access boundaries | Other applicants, other universities and unverified users cannot retrieve or allocate references | Passed against Firestore emulator |
| Client writes | Applicants/admins cannot change reference fields, counters or reservations; ordinary permitted updates still work | Passed against Firestore emulator |
| Counter inconsistency | Existing reservation cannot be overwritten or assigned to another record | Passed against Firestore emulator |
| Actual-page layout rendering | Desktop alignment, sidebar position, mobile fit and menu interactions work | Passed; see screenshots and `ui-results.json` |
| Admin reference search and CSV | One matching row; CSV contains its reference and original ID only | Passed in isolated UI render |
| Missing reference service | Existing record remains readable, with labelled internal-ID fallback | Passed in isolated UI render |

The integration suite contains six tests, all passed. Expected `PERMISSION_DENIED`
messages are the successful negative cases, not failed checks. The first run exposed
an Admin SDK timestamp used in a browser SDK test fixture; the fixture was corrected
to a JavaScript Date and the suite rerun successfully.

The repository checker now normalises Windows path separators before applying its
existing exclusions and source rules. Without that change it incorrectly inspected
itself for the attribution terms that it defines. No checks were removed.

## Screenshots

These are renders of the changed application source with an isolated local fixture
based on the supplied existing Playwright test record. The two short numbers are
fixture values, not numbers assigned to live records. Unavailable course/document
values are left empty rather than invented. No credentials or accounts were created.
These images prove presentation and local interactions, not authenticated deployment
behaviour or external user acceptance.

- [Applicant details on desktop](01-applicant-details-desktop.png)
- [Sidebar after scrolling](02-applicant-sidebar-scrolled.png)
- [Applicant dashboard](03-applicant-dashboard.png)
- [Admin reference search](04-admin-reference-search.png)
- [Admin details](05-admin-details.png)
- [Applicant details on mobile](06-applicant-details-mobile.png)
- [Applicant dashboard on mobile](07-applicant-dashboard-mobile.png)

## Reproduction

Run `npm ci`, `npm test`, `npm run verify:repo` and `npm run build` for the locked app.
For optional integration tooling, install `firebase-tools@14` and
`@firebase/rules-unit-testing@4` locally without saving app dependency changes, then:

```sh
firebase emulators:exec --only firestore --project demo-uaams-references --config firebase.references-test.json "node --test tests/application-reference.emulator.mjs"
```

The integration script refuses non-loopback emulator hosts. It uses disposable
local records and never a real Firebase project.

For UI evidence, install `esbuild` and `@playwright/test` in a separate tools directory,
install Playwright Chromium, set `UAAMS_TEST_TOOLS` to that directory (and
`PLAYWRIGHT_BROWSERS_PATH` if applicable), and run
`node scripts/verify-reference-ui.mjs` after the app build.

## Deployment verification still required

No production records were changed during these local checks. After preview/release,
use the existing authorised applicant/admin accounts to verify the same stored
reference on both sides, reopen the existing record, search/export it as its scoped
admin and check a new submission. Confirm server Firebase configuration and rule
deployment. Record the tested deployment, date, outcomes and any failures here;
do not treat local renders as proof that these checks have happened.

Keep issue 25 and all earlier acceptance screenshots as historical evidence.
