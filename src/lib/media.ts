// Utilidades compartidas para resolver rutas de video/poster desde src/projects

export const LARGE_BP_DEFAULT = "(min-width: 1024px)";

const av1Map: Record<string, string> = import.meta.glob("/src/projects/**/*_av1.webm", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

const mp4Map: Record<string, string> = import.meta.glob("/src/projects/**/*_h264.mp4", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

const posterMap: Record<string, string> = import.meta.glob("/src/projects/**/*_poster.jpg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

export function resolveVideoAssets(base: string): {
    av1_720?: string;
    av1_1080?: string;
    mp4_720?: string;
    mp4_1080?: string;
    poster?: string;
} {
    return {
        av1_720: av1Map[`/src/projects/${base}_720_av1.webm`],
        av1_1080: av1Map[`/src/projects/${base}_1080_av1.webm`],
        mp4_720: mp4Map[`/src/projects/${base}_720_h264.mp4`],
        mp4_1080: mp4Map[`/src/projects/${base}_1080_h264.mp4`],
        poster: posterMap[`/src/projects/${base}_poster.jpg`],
    };
}

export function resolvePosterForBase(base?: string): string | undefined {
    if (!base) return undefined;
    return posterMap[`/src/projects/${base}_poster.jpg`];
}
