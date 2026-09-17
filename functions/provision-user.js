// Run locally with administrator credentials. Never ship credentials or this script to the browser.
import { readFileSync } from 'node:fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
const [file, projectId] = process.argv.slice(2);
if (!file || !projectId) throw new Error('Usage: node functions/provision-user.js employee.json PROJECT_ID');
const input = JSON.parse(readFileSync(file, 'utf8'));
const levels = { ceo: 100, head_of_dept: 50, manager: 30, employee: 10 };
if (!Object.hasOwn(levels, input.role)) throw new Error('Invalid employee role.');
for (const field of ['email', 'name', 'department', 'title']) {
  if (typeof input[field] !== 'string' || !input[field].trim()) throw new Error('Missing ' + field);
}
initializeApp({ credential: applicationDefault(), projectId });
const account = await getAuth().getUserByEmail(input.email.trim());
if (!account.emailVerified || account.disabled) throw new Error('Account must be verified and enabled.');
await getFirestore().doc('users/' + account.uid).create({
  id: account.uid, active: true, email: account.email, name: input.name.trim(),
  department: input.department.trim(), title: input.title.trim(), role: input.role,
  hierarchyLevel: levels[input.role], avatar: '', balancesByYear: input.balancesByYear || {}, revision: 0
});
console.log('Employee profile created for UID ' + account.uid);
