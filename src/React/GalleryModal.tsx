import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Tipos de medios admitidos
export type ImageLike = {
  src: string;
  width?: number;
  height?: number;
};

export type MediaItem =
  | {
      kind: "image" | "gif";
      src: string | ImageLike;
      alt?: string;
    }
  | {
      kind: "video";
      // Opción A: usar un único src directo (compatibilidad actual)
      src?: string;
      // Opción B: usar `base` para construir fuentes responsivas (AV1/MP4) como en VideoResponsive
      base?: string; // e.g., "CIDDT/CIDDT" -> /src/projects/CIDDT/CIDDT_* (se resuelve con import.meta.glob)
      largeBreakpoint?: string; // media query para 1080p (default 1024px)
      poster?: string;
      alt?: string;
      autoplay?: boolean;
      loop?: boolean;
      muted?: boolean;
      controls?: boolean;
    };

export interface GalleryModalProps {
  open: boolean;
  onClose: () => void;
  media: MediaItem[];
  initialIndex?: number;
}

type ViewMode = "slider" | "list";

function isImageLike(value: string | ImageLike): value is ImageLike {
  return typeof value === "object" && value !== null && "src" in value;
}

function getSrc(value: string | ImageLike): string {
  return isImageLike(value) ? value.src : value;
}

// Utilidad simple para clases condicionales
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const ANIM_IN = 300;
const ANIM_OUT = 300;
const PANEL_BASE = "relative z-10 w-[95vw] max-w-5xl max-h-[90vh] bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transform transition-all will-change-transform will-change-opacity";
const OVERLAY_BASE = "fixed inset-0 z-[9999] flex items-center justify-center transition-opacity";
const BACKDROP_BASE = "absolute inset-0 bg-black transition-opacity";
const ARROW_BTN = "z-20 absolute top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/90 border border-white/10";
const MEDIA_BASE_IMG = "max-h-full max-w-full rounded-xl border border-white/10 object-contain";
const MEDIA_BASE_VIDEO = "max-h-full max-w-full rounded-xl border border-white/10";
import { LARGE_BP_DEFAULT, resolvePosterForBase, resolveVideoAssets } from "../lib/media";

// Componente para renderizar un media homogéneo
const MediaView: React.FC<{ item: MediaItem; altFallback?: string }> = ({ item, altFallback }) => {
  if (item.kind === "video") {
    const controls = (item as any).controls ?? true;
    const autoplay = (item as any).autoplay ?? false;
    const loop = (item as any).loop ?? false;
    const muted = (item as any).muted ?? autoplay; // si autoplay, mutear por UX
  const largeBp = (item as any).largeBreakpoint ?? LARGE_BP_DEFAULT;

    // Si se proporciona `base`, construimos <source> responsivos (AV1 primero, luego MP4)
    if ((item as any).base) {
  const base = (item as any).base as string;
  const { av1_720, av1_1080, mp4_720, mp4_1080, poster } = resolveVideoAssets(base);
  const posterResolved = (item as any).poster ?? poster;

      return (
        <video
          className={MEDIA_BASE_VIDEO}
          poster={posterResolved}
          controls={controls}
          autoPlay={autoplay}
          loop={loop}
          muted={muted}
          playsInline
          preload="metadata"
        >
          {av1_1080 && <source src={av1_1080} type="video/webm" media={largeBp} />}
          {av1_720 && <source src={av1_720} type="video/webm" />}
          {mp4_1080 && <source src={mp4_1080} type="video/mp4" media={largeBp} />}
          {mp4_720 && <source src={mp4_720} type="video/mp4" />}
          Tu navegador no soporta la reproducción de video.
        </video>
      );
    }

    // Fallback a src único
    return (
      <video
        className={MEDIA_BASE_VIDEO}
        src={(item as any).src}
        poster={(item as any).poster}
        controls={controls}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
      />
    );
  }
  return (
    <img
      className={MEDIA_BASE_IMG}
      src={getSrc(item.src)}
      alt={item.alt ?? altFallback ?? "gallery item"}
      loading="lazy"
    />
  );
};

export const GalleryModal: React.FC<GalleryModalProps> = ({ open, onClose, media, initialIndex = 0 }) => {
  const [mode, setMode] = useState<ViewMode>("slider");
  const [index, setIndex] = useState(initialIndex);
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);

  // Bloquear scroll cuando está visible
  useEffect(() => {
    if (render) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [render]);

  // Control de montaje y visibilidad para animaciones de entrada/salida
  useEffect(() => {
    if (open) {
      setRender(true);
      // Garantizar un frame antes de mostrar para que la transición se aplique
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(t);
    } else if (render) {
      setVisible(false);
      const t = setTimeout(() => setRender(false), ANIM_OUT);
      return () => clearTimeout(t);
    }
  }, [open, render]);

  // Enfocar el contenedor al abrir
  useEffect(() => {
    if (render && visible && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [render, visible]);

  // Controles de teclado: Esc para cerrar, flechas para navegar en slider
  useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (mode === "slider" && e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (mode === "slider" && e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [render, mode]);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex, open]);

  const hasItems = media && media.length > 0;
  const safeIndex = useMemo(() => {
    if (!hasItems) return 0;
    return Math.max(0, Math.min(index, media.length - 1));
  }, [index, media, hasItems]);

  // Llevar el carril al slide activo cuando cambia el índice en modo slider
  useEffect(() => {
    if (mode !== "slider") return;
    const el = trackRef.current;
    if (!el) return;
    const x = el.clientWidth * safeIndex;
    el.scrollTo({ left: x, behavior: "smooth" });
  }, [safeIndex, mode]);

  // Cierre con animación centralizado
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, ANIM_OUT);
  }, [onClose]);

  // Finalizar drag y snap al slide más cercano
  const finalizeDrag = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    el.style.scrollBehavior = "smooth";
    const width = el.clientWidth || 1;
    const newIndex = Math.round(el.scrollLeft / width);
    setIndex(Math.max(0, Math.min(media.length - 1, newIndex)));
  }, [media.length]);

  if (!render) return null;

  const next = () => setIndex((i) => (i + 1) % media.length);
  const prev = () => setIndex((i) => (i - 1 + media.length) % media.length);

  return (
    <div
      className={cx(
        OVERLAY_BASE,
        visible ? "opacity-100 duration-300 ease-out" : "opacity-0 duration-250 ease-in"
      )}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={cx(
          BACKDROP_BASE,
          visible ? "opacity-80 duration-300 ease-out" : "opacity-0 duration-250 ease-in"
        )}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cx(
          PANEL_BASE,
          visible ? "opacity-100 scale-100 translate-y-0 duration-300 ease-out" : "opacity-0 scale-95 translate-y-4 duration-250 ease-in"
        )}
        ref={dialogRef}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0f0f0f]">
          <div className="flex items-center gap-2 text-white/80">
            <button
              onClick={() => setMode((m) => (m === "slider" ? "list" : "slider"))}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-white/90 hover:text-white hover:bg-white/5 transition"
              title={mode === "slider" ? "Vista continua" : "Vista carrusel"}
              aria-label={mode === "slider" ? "Cambiar a vista continua" : "Cambiar a vista carrusel"}
            >
              {mode === "slider" ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M7 5h14v2H7V5zm0 6h14v2H7v-2zm0 6h14v2H7v-2zM3 5h2v2H3V5zm0 6h2v2H3v-2zm0 6h2v2H3v-2z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M8 5h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zm0 2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H8z" />
                </svg>
              )}
            </button>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7a1 1 0 1 0-1.41 1.41L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.41z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="relative bg-[#0c0c0c]">
          {mode === "slider" ? (
            <div className="relative w-full h-[60vh] md:h-[70vh]">
              {media.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className={cx(ARROW_BTN, "left-2 md:left-4")}
                    aria-label="Anterior"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                      <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className={cx(ARROW_BTN, "right-2 md:right-4")}
                    aria-label="Siguiente"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                      <path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                    </svg>
                  </button>
                </>
              )}

              <div
                ref={trackRef}
                className="w-full h-full overflow-x-auto overflow-y-hidden scroll-smooth no-scrollbar snap-x snap-mandatory select-none"
                onPointerDown={(e) => {
                  const el = trackRef.current;
                  if (!el) return;
                  // Evitar iniciar drag desde controles de video
                  const tag = (e.target as HTMLElement)?.tagName;
                  if (tag === "VIDEO" || tag === "BUTTON" || tag === "A") return;
                  isDraggingRef.current = true;
                  try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch {}
                  startXRef.current = e.clientX;
                  startScrollRef.current = el.scrollLeft;
                  el.style.scrollBehavior = "auto";
                }}
                onPointerMove={(e) => {
                  if (!isDraggingRef.current) return;
                  const el = trackRef.current;
                  if (!el) return;
                  const dx = e.clientX - startXRef.current;
                  el.scrollLeft = startScrollRef.current - dx;
                  e.preventDefault();
                }}
                onPointerUp={(e) => {
                  if (!isDraggingRef.current) return;
                  isDraggingRef.current = false;
                  finalizeDrag();
                }}
                onPointerCancel={() => {
                  if (!isDraggingRef.current) return;
                  isDraggingRef.current = false;
                  finalizeDrag();
                }}
              >
                <div className="h-full flex">
                  {media.map((m, i) => (
                    <div key={i} className="min-w-full h-full flex items-center justify-center p-3 md:p-6 snap-start">
                      <MediaView item={m} altFallback={`gallery item ${i + 1}`} />
                    </div>
                  ))}
                </div>
              </div>

              {!hasItems && <div className="w-full h-[60vh] grid place-items-center text-white/60">Sin elementos</div>}
            </div>
          ) : (
    <div className="max-h-[70vh] overflow-y-auto p-3 md:p-6 space-y-4">
              {media.map((m, i) => (
                <div key={i} className="w-full flex items-center justify-center">
      <MediaView item={m} altFallback={`gallery item ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {mode === "slider" && media.length > 1 && (
          <div className="px-3 md:px-4 py-2 md:py-3 bg-[#0f0f0f] border-t border-white/10 overflow-x-auto">
            <div className="flex items-center gap-2 md:gap-3 min-w-max">
              {media.map((m, i) => {
                const active = i === safeIndex;
                const common = "w-16 h-12 md:w-20 md:h-14 rounded-md border border-white/10 object-cover";
                return (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`shrink-0 relative outline-none ${active ? "ring-2 ring-white/70" : "opacity-70 hover:opacity-100"}`}
                    aria-current={active ? "true" : undefined}
                    aria-label={`Ir al elemento ${i + 1}`}
                  >
                    {m.kind === "video" ? (() => {
                      const base = (m as any).base as string | undefined;
                      const posterFromBase = base ? resolvePosterForBase(base) : undefined;
                      const poster = (m as any).poster ?? posterFromBase;
                      if (poster) {
                        return <img src={poster} alt={m.alt ?? `miniatura video ${i + 1}`} className={common} />;
                      }
                      return (
                        <div className={`${common} grid place-items-center bg-black/40`}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white/80">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      );
                    })() : (
                      <img src={getSrc(m.src)} alt={m.alt ?? `miniatura ${i + 1}`} className={common} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

  {mode === "slider" && hasItems && (
          <div className="px-4 py-2 text-sm text-white/70 bg-[#0f0f0f] border-t border-white/10 flex items-center justify-center">
            {safeIndex + 1} / {media.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryModal;
