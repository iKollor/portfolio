import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebasePublicConfig } from './config/firebasePublic';

// Todas las variables deben tener prefijo PUBLIC_ para estar disponibles en el cliente (Astro)
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || firebasePublicConfig.apiKey,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || firebasePublicConfig.authDomain,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || firebasePublicConfig.projectId,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || firebasePublicConfig.storageBucket,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebasePublicConfig.messagingSenderId,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID || firebasePublicConfig.appId,
};

function isConfigValid(cfg: Record<string, any>): cfg is Required<typeof firebaseConfig> {
  return Object.values(cfg).every(v => typeof v === 'string' && v.trim() !== '');
}

let dbExport: ReturnType<typeof getFirestore> | undefined;
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
try {
  if (isConfigValid(firebaseConfig)) {
    dbExport = getFirestore(app);
  } else {
    // Fallback ya rellenado con firebasePublicConfig, debería ser válido.
    dbExport = getFirestore(app);
  }
} catch (e) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn('[firebase] No se pudo inicializar Firestore:', e);
  }
}

export const db = dbExport;
