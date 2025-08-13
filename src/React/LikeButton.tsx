import { useState, useEffect, useRef } from "react";
import { getDbLazy, getFirebaseStatus } from '../firebaseLazy';
import es from '../i18n/es';
import en from '../i18n/en';

const LikeButton = () => {
  const enabled = import.meta.env.PUBLIC_LIKES_ENABLED !== '0';
  const realtime = import.meta.env.PUBLIC_LIKES_REALTIME !== '0';
  const [likes, setLikes] = useState(0);
  const [tGlobal, setTGlobal] = useState(en);
  const [isLiked, setIsLiked] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const [animateLikes, setAnimateLikes] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [toggleCountWindow, setToggleCountWindow] = useState<{start:number; count:number}>({start: Date.now(), count:0});

  // Configuración de mitigación ligera
  const COOLDOWN_MS = 1200; // tiempo mínimo entre toggles
  const TOGGLE_WINDOW_MS = 60000; // ventana de 60s para contar toggles
  const TOGGLE_WINDOW_MAX = 10; // máximo toggles (like/unlike) por minuto

  const dbRef = useRef<any>(null);
  const unsubRef = useRef<null | (() => void)>(null);

  // Helpers simplificados
  const ensureDb = async () => {
    if (dbRef.current) return true;
    try {
      const db = await getDbLazy();
      if (!db) {
        const status = getFirebaseStatus();
        if (status.lastError) setInitError(status.lastError);
        return false;
      }
      dbRef.current = db;
      return true;
    } catch (_) {
      const status = getFirebaseStatus();
      if (status.lastError) setInitError(status.lastError);
      return false;
    }
  };

  const initLikes = async () => {
    if (!enabled || permissionError) return;
    const ok = await ensureDb();
    if (!ok) return;
    try {
      const { doc, onSnapshot, getDoc } = await import('firebase/firestore');
      const likeDocRef = doc(dbRef.current, 'likes', 'counter');
      if (realtime) {
        // Suscripción en tiempo real
        unsubRef.current = onSnapshot(
          likeDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const currentLikes = docSnap.data().likes;
              setLikes(Math.max(0, currentLikes));
              localStorage.setItem('websiteLikesCache', String(currentLikes));
              setAnimateLikes(true);
              setTimeout(() => setAnimateLikes(false), 300);
            }
          },
          (error) => {
            if ((error as any)?.code === 'permission-denied') {
              setPermissionError(tGlobal.likes.noPermission);
            } else {
              setPermissionError(tGlobal.likes.loadError);
            }
          }
        );
      } else {
        // Lectura única para mostrar el número real sin interacción
        const docSnap = await getDoc(likeDocRef);
        if (docSnap.exists()) {
          const currentLikes = docSnap.data().likes;
          setLikes(Math.max(0, currentLikes));
          localStorage.setItem('websiteLikesCache', String(currentLikes));
        }
      }
    } catch (e) {
      const status = getFirebaseStatus();
      if (status.lastError && !permissionError) setInitError(status.lastError);
      if (import.meta.env.PUBLIC_LIKES_DEBUG === '1') {
        // eslint-disable-next-line no-console
        console.warn('[LikeButton] initLikes fallido:', status);
      }
    }
  };

  useEffect(() => {
    const isEsLocale = typeof window !== 'undefined' && window.location.pathname.startsWith('/es');
    setTGlobal(isEsLocale ? es : en);
    setIsClient(true);

    if (!enabled) return; // feature flag off

    const storedIsLiked = localStorage.getItem("websiteIsLiked");
    if (storedIsLiked) {
      setIsLiked(storedIsLiked === "true");
    }

    // Cache local de likes para primera pintura rápida (opcional)
    const cachedLikes = localStorage.getItem('websiteLikesCache');
    if (cachedLikes && !isNaN(Number(cachedLikes))) {
      setLikes(Math.max(0, Number(cachedLikes)));
    }

    // Inicialización ligera en idle o ASAP
    const schedule = () => initLikes();
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      // @ts-ignore
      requestIdleCallback(schedule, { timeout: 1500 });
    } else {
      setTimeout(schedule, 0);
    }

    return () => {
      if (unsubRef.current) {
        try { unsubRef.current(); } catch {}
        unsubRef.current = null;
      }
    };
  }, []);

  const triggerLikeAnimation = () => {
    setTriggerAnimation(true);
    setTimeout(() => {
      setTriggerAnimation(false);
    }, 300);
  };

  const handleLike = async () => {
    const now = Date.now();
    if (isProcessing) return;
    if (now < cooldownUntil) {
      setFeedback(tGlobal.likes.wait);
      return;
    }
    // Rate limit ventana
    if (now - toggleCountWindow.start > TOGGLE_WINDOW_MS) {
      setToggleCountWindow({start: now, count:0});
    } else if (toggleCountWindow.count >= TOGGLE_WINDOW_MAX) {
      setFeedback(tGlobal.likes.rateLimited);
      return;
    }
    if ((!dbRef.current) && !permissionError) {
      // Fallback: intentar inicializar en la interacción del usuario (por si IntersectionObserver no disparó o falló antes)
      try {
        const db = await getDbLazy();
        if (db) {
          dbRef.current = db;
        } else {
          const status = getFirebaseStatus();
          if (status.lastError) setInitError(status.lastError);
        }
      } catch (e) {
        const status = getFirebaseStatus();
        if (status.lastError) setInitError(status.lastError);
        if (import.meta.env.PUBLIC_LIKES_DEBUG === '1') {
          // eslint-disable-next-line no-console
          console.error('[LikeButton] Error inicializando Firestore en fallback:', status);
        }
      }
    }
    if (!dbRef.current || permissionError) {
      console.warn('Firestore no disponible o sin permisos. Acción ignorada.');
      return;
    }

    // Actualización optimista
    const optimisticPrevLiked = isLiked;
    const optimisticPrevLikes = likes;
    const newLiked = !optimisticPrevLiked;
    const newLikes = Math.max(0, optimisticPrevLikes + (newLiked ? 1 : -1));
    setIsLiked(newLiked);
    setLikes(newLikes);
    if (newLiked) {
      localStorage.setItem('websiteIsLiked', 'true');
      setFeedback(tGlobal.likes.thanks);
      setTimeout(() => setFeedback(prev => prev === tGlobal.likes.thanks ? null : prev), 4000);
    } else {
      localStorage.removeItem('websiteIsLiked');
      setFeedback(null);
    }
    triggerLikeAnimation();

    try {
      setIsProcessing(true);
      // Punto D: usar una transacción para asegurar consistencia bajo concurrencia
      const { doc, runTransaction } = await import('firebase/firestore');
      const delta = newLiked ? 1 : -1;
      const finalLikes = await runTransaction(dbRef.current, async (tx) => {
        const likeDocRef = doc(dbRef.current, 'likes', 'counter');
        const snap = await tx.get(likeDocRef);
        let current = 0;
        if (snap.exists()) {
          const raw = snap.data().likes;
          current = (typeof raw === 'number' && !isNaN(raw)) ? raw : 0;
        }
        let updated = current + delta;
        if (updated < 0) {
          // Evitar valores negativos; revertimos el toggle si se intentó decrementar por debajo de 0.
          updated = current;
        }
        if (!snap.exists()) {
          tx.set(likeDocRef, { likes: updated });
        } else {
          tx.update(likeDocRef, { likes: updated });
        }
        return updated;
      });
      // Si el resultado real difiere del optimista (debido a corrección de underflow u otra carrera), sincronizar.
      if (finalLikes !== newLikes) {
        setLikes(finalLikes);
        // Si hubo underflow evitado y el usuario quiso hacer unlike en 0, garantizamos estado coherente.
        if (finalLikes === optimisticPrevLikes && newLiked === false && optimisticPrevLiked === true && finalLikes === 0) {
          setIsLiked(false);
        }
      }
      // éxito: registrar toggle
      setToggleCountWindow(prev => ({
        start: (now - prev.start > TOGGLE_WINDOW_MS) ? now : prev.start,
        count: (now - prev.start > TOGGLE_WINDOW_MS) ? 1 : prev.count + 1
      }));
      setCooldownUntil(now + COOLDOWN_MS);
    } catch (error) {
      // rollback
      setIsLiked(optimisticPrevLiked);
      setLikes(optimisticPrevLikes);
      if (optimisticPrevLiked) {
        localStorage.setItem('websiteIsLiked', 'true');
      } else {
        localStorage.removeItem('websiteIsLiked');
      }
      const code = (error as any)?.code;
      if (code === 'permission-denied') {
        setPermissionError(tGlobal.likes.noPermission);
      }
      console.error('Error updating likes:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isClient || !enabled) return null;

  const borderColorClass = isLiked
    ? "border-[var(--sec)]"
    : "border-[var(--white-icon)]";

  const svgClasses = `
    w-6 h-6 transition-all duration-300 ease-in-out
    ${isLiked ? "text-[var(--sec)] scale-110" : "text-[var(--white-icon)] group-hover:text-[var(--white)] group-hover:scale-105"}
    ${triggerAnimation ? " animate-scale" : ""}
  `;

  // Selección de traducciones (simple heurística basado en URL)
  const t = tGlobal; // alias local

  return (
  <div className="flex items-center">
      <button
        onClick={handleLike}
        aria-label={t.likes.aria(likes, isLiked)}
        disabled={isProcessing || !!permissionError || Date.now() < cooldownUntil}
        className={`hover:scale-105
          group relative w-40 h-10 flex items-center justify-center p-3
          rounded-full transition-all duration-300 ease-in-out transform border-2 ${borderColorClass}
          ${!isLiked ? "md:hover:border-[var(--white)]" : ""}
          ${triggerAnimation ? " animate-scale" : ""}
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          className={svgClasses}
          role="img"
          aria-hidden="true"
        >
          {isLiked ? (
            <path
              fillRule="evenodd"
              d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"
              fill="currentColor"
            />
          ) : (
            <path
              d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15"
              fill="currentColor"
            />
          )}
        </svg>
        <span
          className={`
          text-sm pl-3 transition-all duration-300 ease-in-out ${animateLikes ? "animate-scale" : ""}
          text-[var(--white)]
        `}
        >
          {t.likes.label(likes)}
        </span>
      </button>
      {(permissionError || initError) && (
        <span className="ml-3 text-xs text-red-400 max-w-[14rem]">
          {permissionError || initError}
        </span>
      )}
      {!permissionError && feedback && (
        <span aria-live="polite" className="ml-3 text-xs text-green-400">{feedback}</span>
      )}
    </div>
  );
};

export default LikeButton;
