import React, {type ReactNode} from 'react';
import {BlogPostProvider} from '@docusaurus/plugin-content-blog/client';
import BlogPostItem from '@theme/BlogPostItem';
import type {Props} from '@theme/BlogPostItems';
import styles from './styles.module.css';

export default function BlogPostItems({
  items,
  component: BlogPostItemComponent = BlogPostItem,
}: Readonly<Props>): ReactNode {
  return (
    <>
      {items.map(({content: BlogPostContent}) => {
        const {frontMatter} = BlogPostContent.metadata;
        const thumbnailImage: string = frontMatter.thumbnail;

        // The thumbnail is inside /blog/thumbnails folder
        const imageSrc = thumbnailImage ? require(`@site/blog/thumbnails/${thumbnailImage}`).default : null;

        return (
          <BlogPostProvider
            key={BlogPostContent.metadata.permalink}
            content={BlogPostContent}>
            <BlogPostItemComponent>
              <div className={styles.blogPostContainer}>
                {imageSrc && (
                  <div className={styles.imageContainer}>
                    <img
                      src={imageSrc}
                      alt="Post thumbnail"
                      className={styles.thumbnailImage}
                    />
                  </div>
                )}
                <div className={styles.contentContainer}>
                  <BlogPostContent />
                </div>
              </div>
            </BlogPostItemComponent>
          </BlogPostProvider>
        );
      })}
    </>
  );
}