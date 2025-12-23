import React from 'react';
import styles from './styles.module.css';
import {getThumbnailSrc} from "../commons/utils";

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