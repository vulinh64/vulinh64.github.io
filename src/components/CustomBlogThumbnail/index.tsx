import React from 'react';
import styles from './styles.module.css';

interface CustomBlogThumbnailProps {
    filename?: string;
}

export default function CustomBlogThumbnail({ filename }: CustomBlogThumbnailProps) {
    const imageUrl = getThumbnailSrc(filename);

    if (!imageUrl) {
        return null;
    }

    return (
        <div className={styles.thumbnailContainer}>
            <img src={imageUrl} alt="thumbnail" className={styles.thumbnail} />
        </div>
    );
}

function getThumbnailSrc(filename?: string): string | null {
    if (!filename) return null;

    try {
        return require(`@site/blog/thumbnails/${filename}`).default as string;
    } catch {
        return null; // File not found -> no thumbnail
    }
}
