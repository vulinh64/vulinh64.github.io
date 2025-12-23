export function getThumbnailSrc(filename?: string): string | null {
    if (!filename) return null;

    try {
        return require(`@site/blog/thumbnails/${filename}`).default as string;
    } catch {
        return null; // File not found -> no thumbnail
    }
}