// Carga diferida de Firebase solo cuando se necesita (reduce bundle inicial)
import type { Firestore } from 'firebase/firestore';

let dbInstance: Firestore | null = null;
let initPromise: Promise<Firestore> | null = null;

async function init(): Promise<Firestore> {
    if (dbInstance) return dbInstance;
    if (initPromise) return initPromise;
    initPromise = (async () => {
        const [{ initializeApp, getApps }, { getFirestore }, { initializeAppCheck, ReCaptchaV3Provider }] = await Promise.all([
            import('firebase/app'),
            import('firebase/firestore'),
            import('firebase/app-check'),
        ]);

        const firebaseConfig = {
            apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
            authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
        };

        const valid = Object.values(firebaseConfig).every(v => typeof v === 'string' && v.trim() !== '');
        if (!valid) throw new Error('Firebase config incompleta');

        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

        const appCheckKey = import.meta.env.PUBLIC_FIREBASE_APPCHECK_KEY;
        if (appCheckKey) {
            try {
                initializeAppCheck(app, { provider: new ReCaptchaV3Provider(appCheckKey), isTokenAutoRefreshEnabled: true });
            } catch (_) {
                // silencioso
            }
        }

        dbInstance = getFirestore(app);
        return dbInstance;
    })();
    return initPromise;
}

export async function getDbLazy(): Promise<Firestore | undefined> {
    try {
        return await init();
    } catch (e) {
        if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn('[firebaseLazy] No se pudo inicializar Firestore:', e);
        }
        return undefined;
    }
}
