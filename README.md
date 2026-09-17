# Adesa Leave

Authenticated leave requests, scoped manager approvals, shared Firestore records and Google Workspace integration.

## Deployment prerequisites

This branch replaces the local-browser prototype. Deploy the backend and database rules before the frontend. Until an administrator provisions a verified Firebase Auth user, access is denied; there is no demo fallback or persona switcher.

1. Use Node.js 22 and install the root and functions dependencies:
   `npm install` and `npm install --prefix functions`.
2. In the Firebase project identified by `firebase-applet-config.json`, enable Google Authentication, add the deployed domain to authorized domains, and create a **default Firestore database**. Use the billing plan required by Cloud Functions; deployment may incur Google Cloud charges.
3. Enable Google Calendar API, Google Sheets API and Firebase Cloud Messaging API. Configure the Google OAuth consent screen and authorize the Calendar events and Sheets scopes for your staff.
4. Sign in to the Firebase CLI with an administrator account. Deploy to the explicit project:
   `npx firebase-tools deploy --only firestore:rules,functions --project YOUR_PROJECT_ID`.
   Functions run in `asia-southeast1`. The browser uses the same region.
5. Each employee signs in once to create their Firebase Auth identity. An administrator reviews the account and provisions `users/{firebaseAuthUid}` (below).
6. For background device notifications, generate a Web Push certificate in Firebase Messaging settings, put its public key in `VITE_FIREBASE_VAPID_KEY` in `.env.local`, and rebuild. The user must click **Enable device notifications** and grant browser permission. Keep the public Firebase config in `public/firebase-messaging-sw.js` aligned with `firebase-applet-config.json` when changing projects. HTTPS and a supported browser are required.
7. Run `npm run lint`, `npm test`, and `npm run build`. Deploy the frontend with `npx firebase-tools deploy --only hosting --project YOUR_PROJECT_ID`, or serve `dist` on your chosen HTTPS host with SPA fallback and the service worker at the site root.
8. As a CEO or department head, configure the shared Calendar ID and spreadsheet in Workspace Settings, then enable the desired integrations. Each approving manager needs Google access to those resources and a current Google connection.

## Provisioning employees

No browser user can create their own profile, promote themselves, edit balances, or write request decisions directly. A trusted administrator provisions employee records using Application Default Credentials (never commit a service account key):

`node functions/provision-user.js /path/to/employee.json YOUR_PROJECT_ID`

Input example (replace all sample details with reviewed company records):

```json
{
  "email": "employee@example.com",
  "name": "Employee Name",
  "department": "Global Trade",
  "title": "Executive",
  "role": "employee",
  "balancesByYear": {
    "2026": {
      "Annual Leave": { "allocated": 14, "used": 0 },
      "Business Leave": { "allocated": 3, "used": 0 },
      "Sick Leave": { "allocated": 30, "used": 0 }
    }
  }
}
```

Roles: `employee`, `manager`, `head_of_dept`, `ceo`. The script only creates a new profile and refuses to overwrite an existing one. Set `active: false` administratively to disable an employee. Changes to existing roles and audited opening balances must be made by a trusted administrator.

CEO users can read all records and approve others. Department heads can approve managers and employees in their department; managers can approve employees in their department. Self-approval is always blocked. Staff read their own requests; managers and department heads read department records. The team calendar is limited to the same scope, including private leave details only for authorized viewers.

## Data migration

Old browser localStorage records are **not automatically trusted or imported**. Export and reconcile any real historical leave records and opening balances with HR before staff switch to this version. Existing demo profiles/requests are not loaded by the application. The current year is shown in dashboards; balances are stored by leave year and cross-year leave must be split into separate requests. The existing weekday-only policy remains; company holidays and alternative workweeks are not configured.

## Approval and synchronization

The server checks the employee identity and current role, validates dates and balances, and commits the decision, balance and persistent notification in one Firestore transaction. Repeated or concurrent decisions cannot charge the balance twice. Submission IDs are idempotent, and overlapping pending/approved requests are rejected (opposite half-days are allowed).

Google Calendar/Sheets writes happen **after** the authoritative approval transaction:
- `synced`: the provider confirmed success.
- `disabled`: that integration was not enabled.
- `needs_connection`: reconnect Google before subsequent approvals.
- `needs_configuration`: configure a spreadsheet.
- `needs_review`: the remote outcome needs administrator reconciliation.
- `pending`: processing is ongoing or was interrupted; investigate if it remains pending.

Decisions stay saved when Google fails. The record's review dialog shows each sync status. There is deliberately no blind Sheets-append retry: a timeout could mean a row was already appended. Administrators must search the sheet by request ID, verify Calendar, and reconcile missing records manually. Never reapprove a request to retry sync. Calendar IDs are deterministic to prevent duplicate event insertion.

Full-day events include the final date. Half-days use Bangkok hours: morning 09:00–12:00, afternoon 13:00–17:00. Confirm these hours against company policy before rollout. Google access tokens are used transiently and are not stored in Firestore. A page refresh retains Firebase identity but may require reconnecting Google for integration access.

Notifications are persisted per recipient and appear across signed-in devices. Optional FCM delivers generic background alerts without names/reasons on the lock screen. Delivery depends on browser permission and platform support; the persistent inbox remains authoritative.

## Verification

`npm test` covers authority, dates, balances, terminal status and Google-sync outcomes.

With Java 21 installed, run database tests against emulators only:

```sh
npx firebase-tools@14 emulators:exec --only firestore --project demo-adesa-leave "npm run test:rules && npm run test:integration --prefix functions"
```

The draft pull request workflow runs type checking, production build, regression tests, database authorization rules, and concurrent approval tests. Before production, use two separate browser accounts to test submission, approval, cancellation, inbox delivery, background push, and real Calendar/Sheets access. These live checks require deployed Firebase services and authorized company accounts.
