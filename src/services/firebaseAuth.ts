import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
export const app = getApps()[0] || initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.setCustomParameters({ prompt: 'select_account consent' });
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;
export const getAccessToken = () => Date.now() < tokenExpiresAt ? cachedAccessToken : null;
export const initAuth = (onSuccess: (user: User, token: string | null) => void, onFailure: () => void) =>
  onAuthStateChanged(auth, user => user ? onSuccess(user, getAccessToken()) : onFailure());
export async function googleSignIn() {
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  cachedAccessToken = credential?.accessToken || null;
  tokenExpiresAt = Date.now() + 50 * 60 * 1000;
  return { user: result.user, accessToken: cachedAccessToken };
}
export async function logout() {
  await signOut(auth);
  cachedAccessToken = null;
  tokenExpiresAt = 0;
}
