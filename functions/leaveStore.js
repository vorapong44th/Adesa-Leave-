import { canApprove, validateLeave, assertPending, balanceAfterApproval } from './core.js';

function profile(snapshot) {
  if (!snapshot.exists || snapshot.data().active !== true) throw new Error('Your employee account has not been enabled.');
  return { ...snapshot.data(), id: snapshot.id };
}
function notification(tx, db, uid, id, request, type, title, message) {
  tx.set(db.doc('users/' + uid + '/notifications/' + id), {
    id, requestId: request.id, type, title, message, timestamp: new Date().toISOString(),
    read: false, employeeName: request.employeeName, targetRole: type === 'leave_submitted' ? 'manager' : 'employee'
  });
}
export async function submitLeave(db, uid, data) {
  if (typeof data.id !== 'string' || !/^[a-zA-Z0-9-]{20,80}$/.test(data.id)) throw new Error('Invalid request identifier.');
  const clean = validateLeave(data);
  const ref = db.doc('requests/' + data.id);
  return db.runTransaction(async tx => {
    const user = profile(await tx.get(db.doc('users/' + uid)));
    const existing = await tx.get(ref);
    if (existing.exists) {
      if (existing.data().employeeId !== uid) throw new Error('Request identifier already used.');
      const previous = existing.data();
      if (Object.entries(clean).some(([key, value]) => previous[key] !== value)) throw new Error('This submission was already saved with different details. Close and reopen the form.');
      return previous;
    }
    const staff = await tx.get(db.collection('users').where('active', '==', true));
    // Serialize submissions/decisions for this employee to prevent overlapping requests.
    const pending = await tx.get(db.collection('requests').where('employeeId', '==', uid));
    const overlap = pending.docs.some(d => {
      const r = d.data();
      if (!['Pending', 'Approved'].includes(r.status) || r.startDate > clean.endDate || r.endDate < clean.startDate) return false;
      return !(r.isHalfDay && clean.isHalfDay && r.startDate === clean.startDate && r.halfDayPeriod !== clean.halfDayPeriod);
    });
    if (overlap) throw new Error('You already have pending or approved leave during this period.');
    balanceAfterApproval(user, clean);
    const request = { ...clean, id: data.id, employeeId: uid, employeeName: user.name,
      employeeEmail: user.email, employeeDepartment: user.department, employeeTitle: user.title,
      status: 'Pending', submittedAt: new Date().toISOString() };
    tx.set(ref, request);
    tx.update(db.doc('users/' + uid), { revision: (user.revision || 0) + 1 });
    for (const doc of staff.docs) {
      if (canApprove({ ...doc.data(), id: doc.id }, user)) {
        notification(tx, db, doc.id, request.id + '-submitted', request, 'leave_submitted',
          'New leave request', request.employeeName + ' submitted a leave request.');
      }
    }
    return request;
  });
}
export async function decideLeave(db, uid, data) {
  if (typeof data.id !== 'string' || !/^[a-zA-Z0-9-]{20,80}$/.test(data.id)) throw new Error('Invalid request identifier.');
  if (!['Approved', 'Rejected', 'Cancelled'].includes(data.status)) throw new Error('Invalid decision.');
  const note = typeof data.managerNote === 'string' ? data.managerNote.trim() : '';
  if (note.length > 2000 || (data.status === 'Rejected' && !note)) throw new Error('Enter a rejection reason of 1–2000 characters.');
  return db.runTransaction(async tx => {
    const approver = profile(await tx.get(db.doc('users/' + uid)));
    const ref = db.doc('requests/' + data.id);
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('Request not found.');
    const request = snap.data();
    assertPending(request);
    const applicantRef = db.doc('users/' + request.employeeId);
    const applicant = profile(await tx.get(applicantRef));
    if (data.status === 'Cancelled') {
      if (uid !== applicant.id) throw new Error('Only the applicant can cancel pending leave.');
    } else if (!canApprove(approver, applicant)) {
      throw new Error('You do not have authority to decide this leave request.');
    }
    const workspace = await tx.get(db.doc('settings/workspace'));
    const update = { status: data.status, decisionAt: new Date().toISOString(), decisionBy: approver.name,
      decisionUid: uid, managerNote: note };
    if (data.status === 'Approved') {
      validateLeave(request);
      tx.update(applicantRef, { balancesByYear: balanceAfterApproval(applicant, request), revision: (applicant.revision || 0) + 1 });
      update.sync = { calendar: 'pending', sheets: 'pending' };
    } else {
      tx.update(applicantRef, { revision: (applicant.revision || 0) + 1 });
    }
    tx.update(ref, update);
    const decided = { ...request, ...update };
    if (data.status !== 'Cancelled') {
      notification(tx, db, applicant.id, request.id + '-decision', decided,
        data.status === 'Approved' ? 'leave_approved' : 'leave_rejected',
        'Leave request ' + data.status.toLowerCase(), 'Your leave request was ' + data.status.toLowerCase() + ' by ' + approver.name + '.');
    }
    return { request: decided, config: workspace.data() || {} };
  });
}
