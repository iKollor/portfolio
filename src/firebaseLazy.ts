// Carga diferida de Firebase solo cuando se necesita (reduce bundle inicial)
import type { Firestore } from 'firebase/firestore';

// Estado interno para diagnóstico
let lastInitError: unknown = null;
let attemptedInit = false;

let dbInstance: Firestore | null = null;
let initPromise: Promise<Firestore> | null = null;

async function init(): Promise<Firestore> {
    if (dbInstance) return dbInstance;
    if (initPromise) return initPromise;
    initPromise = (async () => {
        attemptedInit = true;
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

        const entries = Object.entries(firebaseConfig);
        const missing = entries.filter(([_, v]) => !(typeof v === 'string' && v.trim() !== ''));
        const valid = missing.length === 0;
        if (!valid) {
            const msg = `[firebaseLazy] Config incompleta. Faltan claves: ${missing.map(m => m[0]).join(', ')}`;
            throw new Error(msg);
        }
        if (import.meta.env.PUBLIC_LIKES_DEBUG === '1') {
            // eslint-disable-next-line no-console
            console.info('[firebaseLazy] Config verificada OK');
        }

        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        if (import.meta.env.PUBLIC_LIKES_DEBUG === '1') {
            // eslint-disable-next-line no-console
            console.info('[firebaseLazy] App inicializada');
        }

        const appCheckKey = import.meta.env.PUBLIC_FIREBASE_APPCHECK_KEY;
        if (appCheckKey) {
            try {
                initializeAppCheck(app, { provider: new ReCaptchaV3Provider(appCheckKey), isTokenAutoRefreshEnabled: true });
                if (import.meta.env.PUBLIC_LIKES_DEBUG === '1') {
                    // eslint-disable-next-line no-console
                    console.info('[firebaseLazy] App Check inicializado');
                }
            } catch (e) {
                if (import.meta.env.PUBLIC_LIKES_DEBUG === '1') {
                    // eslint-disable-next-line no-console
                    console.warn('[firebaseLazy] Falló App Check:', e);
                }
            }
        } else if (import.meta.env.PUBLIC_LIKES_DEBUG === '1') {
            // eslint-disable-next-line no-console
            console.info('[firebaseLazy] App Check no configurado (sin clave)');
        }

        dbInstance = getFirestore(app);
        if (import.meta.env.PUBLIC_LIKES_DEBUG === '1') {
            // eslint-disable-next-line no-console
            console.info('[firebaseLazy] Firestore obtenido');
        }
        return dbInstance;
    })();
    return initPromise;
}

export async function getDbLazy(): Promise<Firestore | undefined> {
    try {
        const db = await init();
        lastInitError = null;
        return db;
    } catch (e) {
        lastInitError = e;
        if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn('[firebaseLazy] No se pudo inicializar Firestore:', e);
        }
        return undefined;
    }
}

// Helper de diagnóstico (Punto C apartado diagnóstico extra)
export function getFirebaseStatus() {
    return {
        initialized: !!dbInstance,
        initializing: !!initPromise && !dbInstance,
        attempted: attemptedInit,
        lastError: lastInitError ? (lastInitError instanceof Error ? lastInitError.message : String(lastInitError)) : null,
    };
}
