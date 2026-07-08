import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

/* ── auth state listener ─────────────────────────────────────────── */
export function subscribeAuth(cb) {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      // No user — sign in anonymously so Me tab always has a profile
      try {
        await signInAnonymously(auth);
        // onAuthStateChanged will fire again with the anonymous user
      } catch (e) {
        console.warn('[Auth] anonymous sign-in failed:', e.message);
        cb(null);
      }
    } else {
      // Ensure a Firestore users doc exists for this user
      try {
        const ref  = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            uid:          firebaseUser.uid,
            displayName:  '',
            instagram:    '',
            facebook:     '',
            joinedAt:     serverTimestamp(),
            isBanned:     false,
            isAdmin:      false,
            messageCount: 0,
            isAnonymous:  firebaseUser.isAnonymous,
          });
        }
      } catch (e) {
        console.warn('[Auth] profile init error:', e.message);
      }
      cb(firebaseUser);
    }
  });
}

/* ── sign up ─────────────────────────────────────────────────────── */
export async function signUp({ email, password, displayName, instagram, facebook }) {
  if (!auth) throw new Error('Auth not available in this environment.');
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user       = credential.user;
  await updateProfile(user, { displayName: displayName.trim() });
  await sendEmailVerification(user);
  await setDoc(doc(db, 'users', user.uid), {
    uid:          user.uid,
    email:        email.trim().toLowerCase(),
    displayName:  displayName.trim(),
    instagram:    instagram?.trim().replace(/^@/, '') || '',
    facebook:     facebook?.trim() || '',
    joinedAt:     serverTimestamp(),
    isBanned:     false,
    isAdmin:      false,
    messageCount: 0,
  });
  return user;
}

/* ── sign in ─────────────────────────────────────────────────────── */
export async function signIn(email, password) {
  if (!auth) throw new Error('Auth not available in this environment.');
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

/* ── sign out ────────────────────────────────────────────────────── */
export async function logOut() {
  if (!auth) return;
  await signOut(auth);
}

/* ── email verification ──────────────────────────────────────────── */
export async function resendVerification() {
  if (auth?.currentUser) await sendEmailVerification(auth.currentUser);
}

export async function reloadUser() {
  if (auth?.currentUser) await auth.currentUser.reload();
  return auth?.currentUser ?? null;
}

/* ── password reset ──────────────────────────────────────────────── */
export async function resetPassword(email) {
  if (!auth) throw new Error('Auth not available in this environment.');
  await sendPasswordResetEmail(auth, email.trim());
}

/* ── fetch Firestore profile ─────────────────────────────────────── */
export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch (_) {
    return null;
  }
}