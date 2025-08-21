import React from 'react';
import styles from './styles.module.css';


export default function CustomBlogThumbnail({filename}) {
    // The thumbnail is inside /blog/thumbnails folder
    const imageSrc = filename ? require(`@site/blog/thumbnails/${filename}`).default : null;

    if (!imageSrc) {
        return null;
    }

    return (
        <div className={styles.thumbnailContainer}>
            <img src={imageSrc} alt={imageSrc} className={styles.thumbnail}/>
        </div>
    );
}