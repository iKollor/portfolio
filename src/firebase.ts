import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Todas las variables deben tener prefijo PUBLIC_ para estar disponibles en el cliente (Astro)
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

function isConfigValid(cfg: Record<string, any>): cfg is Required<typeof firebaseConfig> {
  return Object.values(cfg).every(v => typeof v === 'string' && v.trim() !== '');
}

let dbExport: ReturnType<typeof getFirestore> | undefined;
if (isConfigValid(firebaseConfig)) {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  dbExport = getFirestore(app);
} else {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn('[firebase] Config incompleta. Firestore deshabilitado en cliente.');
  }
}

export const db = dbExport;
