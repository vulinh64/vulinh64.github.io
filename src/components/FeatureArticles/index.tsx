import React, { useState } from 'react';
import styles from './styles.module.css';

interface FeatureArticle {
  title: string;
  excerpt: string;
  slug: string;
}

interface FeatureArticlesProps {
  articles: FeatureArticle[];
}

type Direction = 'left' | 'right' | null;

const FeatureArticles: React.FC<FeatureArticlesProps> = ({ articles }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<Direction>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const handleDotClick = (index: number): void => {
    if (index !== currentIndex && !isAnimating) {
      setDirection(index > currentIndex ? 'right' : 'left');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsAnimating(false);
      }, 300);
    }
  };

  const currentArticle: FeatureArticle = articles[currentIndex];

  return (
    <section className={styles.featureArticles}>
      <div className="container">
        <div
          className={`${styles.articleContent} ${
            isAnimating
              ? direction === 'left'
                ? styles.slideLeft
                : styles.slideRight
              : styles.fadeIn
          }`}
          key={currentIndex}
        >
          <h2 className={styles.articleTitle}>{currentArticle.title}</h2>
          <p className={styles.articleExcerpt}>{currentArticle.excerpt}</p>
        </div>
        <a href={`/blog/${currentArticle.slug}`} className={styles.readMoreBtn}>
          Read More
        </a>

        <div className={styles.navigation}>
          <div className={styles.dots}>
            {articles.map((_, index) => (
              <span
                key={index}
                className={`${styles.dot} ${currentIndex === index ? styles.activeDot : ''}`}
                onClick={() => handleDotClick(index)}
              ></span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureArticles;