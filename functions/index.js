import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { createHash } from 'node:crypto';
import { submitLeave, decideLeave } from './leaveStore.js';
import { syncApproval } from './googleSync.js';

initializeApp();
const db = getFirestore();
const options = { region: 'asia-southeast1', timeoutSeconds: 120 };
function uidOf(request) {
  if (!request.auth || request.auth.token.email_verified !== true) throw new HttpsError('unauthenticated', 'Sign in with your verified company Google account.');
  return request.auth.uid;
}
async function member(uid) {
  const snap = await db.doc('users/' + uid).get();
  if (!snap.exists || snap.data().active !== true) throw new HttpsError('permission-denied', 'Your employee account has not been enabled.');
  return snap.data();
}
export const submitLeaveRequest = onCall(options, async req => {
  const uid = uidOf(req);
  try { return await submitLeave(db, uid, req.data || {}); }
  catch (error) { throw new HttpsError('failed-precondition', error.message); }
});
export const decideLeaveRequest = onCall(options, async req => {
  const uid = uidOf(req);
  let decision;
  try { decision = await decideLeave(db, uid, req.data || {}); }
  catch (error) { throw new HttpsError('failed-precondition', error.message); }
  if (decision.request.status !== 'Approved') return decision.request;
  // Decision/balance/notification commit once, before any external side effect.
  // A process interruption leaves a visible pending sync state, never a false success.
  const token = typeof req.data.accessToken === 'string' && req.data.accessToken.length < 8192 ? req.data.accessToken : null;
  const update = await syncApproval(decision.request, decision.config, token);
  await db.doc('requests/' + decision.request.id).update(update);
  return { ...decision.request, ...update };
});
export const saveWorkspace = onCall(options, async req => {
  const uid = uidOf(req), user = await member(uid);
  if (!['ceo', 'head_of_dept'].includes(user.role)) throw new HttpsError('permission-denied', 'Only a CEO or department head can configure integrations.');
  const data = req.data || {}, config = {};
  for (const key of ['sheetId', 'sheetName', 'sheetUrl', 'calendarId']) {
    if (typeof data[key] !== 'string' || data[key].length > 2048) throw new HttpsError('invalid-argument', 'Invalid workspace settings.');
    config[key] = data[key].trim();
  }
  if (config.sheetId && !/^[a-zA-Z0-9_-]+$/.test(config.sheetId)) throw new HttpsError('invalid-argument', 'Invalid spreadsheet ID.');
  config.sheetUrl = config.sheetId ? 'https://docs.google.com/spreadsheets/d/' + config.sheetId + '/edit' : '';
  for (const key of ['autoSyncCalendar', 'autoSyncSheets']) {
    if (typeof data[key] !== 'boolean') throw new HttpsError('invalid-argument', 'Invalid sync settings.');
    config[key] = data[key];
  }
  await db.doc('settings/workspace').set(config);
  return config;
});
export const registerPushToken = onCall(options, async req => {
  const uid = uidOf(req);
  await member(uid);
  const token = req.data?.token;
  if (typeof token !== 'string' || token.length < 20 || token.length > 4096) throw new HttpsError('invalid-argument', 'Invalid push token.');
  const id = createHash('sha256').update(token).digest('hex');
  const ref = db.doc('users/' + uid + '/tokens/' + id);
  if (req.data.remove === true) await ref.delete();
  else await ref.set({ token, updatedAt: new Date().toISOString() });
  return { registered: req.data.remove !== true };
});
export const sendLeavePush = onDocumentCreated({ document: 'users/{uid}/notifications/{id}', region: options.region }, async event => {
  const user = await db.doc('users/' + event.params.uid).get();
  if (user.data()?.active !== true) return;
  const tokens = await db.collection('users/' + event.params.uid + '/tokens').get();
  // Generic lock-screen content keeps employee names/reasons private on shared devices.
  for (let i = 0; i < tokens.docs.length; i += 500) {
    const batch = tokens.docs.slice(i, i + 500);
    const result = await getMessaging().sendEachForMulticast({
      tokens: batch.map(d => d.data().token),
      notification: { title: 'Adesa Leave', body: 'You have a new leave update. Open the app to view it.' },
      webpush: { notification: { tag: event.params.id } }
    });
    await Promise.all(result.responses.map((r, j) => !r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error?.code)
      ? batch[j].ref.delete() : Promise.resolve()));
  }
});
