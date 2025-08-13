import { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc, increment, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const LikeButton = () => {
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const [animateLikes, setAnimateLikes] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);

    const storedIsLiked = localStorage.getItem("websiteIsLiked");
    if (storedIsLiked) {
      setIsLiked(storedIsLiked === "true");
    }

    if (db) {
      const likeDocRef = doc(db, "likes", "counter");
      const unsubscribe = onSnapshot(
        likeDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const currentLikes = docSnap.data().likes;
            setLikes(Math.max(0, currentLikes));
            setAnimateLikes(true);
            setTimeout(() => setAnimateLikes(false), 300);
          }
        },
        (error) => {
          if ((error as any)?.code === 'permission-denied') {
            setPermissionError('No tienes permisos para ver/actualizar los likes.');
          } else {
            setPermissionError('Error cargando likes.');
          }
        }
      );
      return () => unsubscribe();
    }
    return () => {};
  }, []);

  const triggerLikeAnimation = () => {
    setTriggerAnimation(true);
    setTimeout(() => {
      setTriggerAnimation(false);
    }, 300);
  };

  const handleLike = async () => {
    if (isProcessing) return;
    if (!db || permissionError) {
      console.warn('Firestore no disponible o sin permisos. Acción ignorada.');
      return;
    }

    try {
      setIsProcessing(true);
      const likeDocRef = doc(db, "likes", "counter");
      const snap = await getDoc(likeDocRef);
      if (!snap.exists()) {
        try { await setDoc(likeDocRef, { likes: 0 }, { merge: true }); } catch {}
      }

      if (!isLiked) {
        // Dar like
        await updateDoc(likeDocRef, { likes: increment(1) });
        setIsLiked(true);
        localStorage.setItem('websiteIsLiked', 'true');
        setFeedback('¡Gracias por tu like!');
        setTimeout(() => setFeedback(null), 4000);
      } else {
        // Quitar like (evitar bajar de 0 en UI)
        if (likes > 0) {
          await updateDoc(likeDocRef, { likes: increment(-1) });
        }
        setIsLiked(false);
        localStorage.removeItem('websiteIsLiked');
        setFeedback(null);
      }
      triggerLikeAnimation();
    } catch (error) {
      const code = (error as any)?.code;
      if (code === 'permission-denied') {
        setPermissionError('No tienes permisos para actualizar los likes.');
      }
      console.error('Error updating likes:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isClient) return null;

  const borderColorClass = isLiked
    ? "border-[var(--sec)]"
    : "border-[var(--white-icon)]";

  const svgClasses = `
    w-6 h-6 transition-all duration-300 ease-in-out
    ${isLiked ? "text-[var(--sec)] scale-110" : "text-[var(--white-icon)] group-hover:text-[var(--white)] group-hover:scale-105"}
    ${triggerAnimation ? " animate-scale" : ""}
  `;

  return (
    <div className="flex items-center">
      <button
        onClick={handleLike}
        disabled={isProcessing || !!permissionError}
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
          aria-label={isLiked ? 'Liked' : 'Not liked'}
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
          {likes} Likes
        </span>
      </button>
      {permissionError && (
        <span className="ml-3 text-xs text-red-400 max-w-[12rem]">{permissionError}</span>
      )}
      {!permissionError && feedback && (
        <span aria-live="polite" className="ml-3 text-xs text-green-400">{feedback}</span>
      )}
    </div>
  );
};

export default LikeButton;
