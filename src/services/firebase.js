import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyBGtns8qDchrGGMqRnlCceo8x5w85Fe2kA',
  authDomain:        'hammer-radio-395cb.firebaseapp.com',
  projectId:         'hammer-radio-395cb',
  storageBucket:     'hammer-radio-395cb.firebasestorage.app',
  messagingSenderId: '621020120834',
  appId:             '1:621020120834:web:d7cc3726c4efdf74e3641b',
};

const app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db   = getFirestore(app);
const auth = null;

export { app, db, auth };
export const configured = db !== null;