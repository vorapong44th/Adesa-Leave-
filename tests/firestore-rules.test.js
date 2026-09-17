import test from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

test('database rules enforce member scope and server-only decisions', async () => {
  const env = await initializeTestEnvironment({ projectId: 'demo-adesa-rules', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
  try {
    await env.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      for (const [id, role, department] of [['alice','employee','Trade'],['bob','employee','Trade'],['manager','manager','Trade'],['other','manager','Other'],['ceo','ceo','HQ']]) {
        await setDoc(doc(db,'users',id),{ id, role, department, active:true });
      }
      await setDoc(doc(db,'requests','leave'), { employeeId:'alice',employeeDepartment:'Trade',status:'Pending' });
      await setDoc(doc(db,'users','alice','notifications','note'), { read:false,message:'Private' });
    });
    const user = id => env.authenticatedContext(id, { email_verified:true }).firestore();
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'requests','leave')));
    await assertFails(getDoc(doc(env.authenticatedContext('alice',{email_verified:false}).firestore(),'requests','leave')));
    await assertFails(getDoc(doc(user('unknown'),'requests','leave')));
    await assertSucceeds(getDoc(doc(user('alice'),'requests','leave')));
    await assertFails(getDoc(doc(user('bob'),'requests','leave')));
    await assertSucceeds(getDoc(doc(user('manager'),'requests','leave')));
    await assertFails(getDoc(doc(user('other'),'requests','leave')));
    await assertSucceeds(getDoc(doc(user('ceo'),'requests','leave')));
    await assertSucceeds(getDocs(query(collection(user('alice'),'requests'),where('employeeId','==','alice'))));
    await assertFails(getDocs(collection(user('alice'),'requests')));
    await assertSucceeds(getDocs(query(collection(user('manager'),'requests'),where('employeeDepartment','==','Trade'))));
    await assertSucceeds(getDocs(query(collection(user('alice'),'users'),where('id','==','alice'))));
    await assertFails(updateDoc(doc(user('alice'),'users','alice'),{role:'ceo'}));
    await assertFails(updateDoc(doc(user('ceo'),'requests','leave'),{status:'Approved'}));
    await assertFails(setDoc(doc(user('alice'),'requests','forged'),{employeeId:'alice',employeeDepartment:'Trade',status:'Approved'}));
    await assertFails(getDoc(doc(user('bob'),'users','alice','notifications','note')));
    await assertSucceeds(updateDoc(doc(user('alice'),'users','alice','notifications','note'),{read:true}));
    await assertFails(updateDoc(doc(user('alice'),'users','alice','notifications','note'),{message:'Changed'}));
    await assertSucceeds(deleteDoc(doc(user('alice'),'users','alice','notifications','note')));
  } finally { await env.cleanup(); }
});
