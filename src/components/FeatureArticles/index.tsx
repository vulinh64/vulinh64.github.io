import React, {useState, useRef} from 'react';
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

const FeatureArticles: React.FC<FeatureArticlesProps> = ({articles}) => {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [direction, setDirection] = useState<Direction>(null);
    const [isAnimating, setIsAnimating] = useState<boolean>(false);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

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

    const handleTouchStart = (e: React.TouchEvent): void => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent): void => {
        touchEndX.current = e.changedTouches[0].clientX;
        handleSwipe();
    };

    const handleSwipe = (): void => {
        if (touchStartX.current === null || touchEndX.current === null) return;

        const deltaX = touchEndX.current - touchStartX.current;
        const swipeThreshold = 50; // Minimum distance for a swipe (in pixels)

        if (Math.abs(deltaX) > swipeThreshold && !isAnimating) {
            if (deltaX > 0 && currentIndex > 0) {
                // Swipe right, go to previous article
                setDirection('left');
                setIsAnimating(true);
                setTimeout(() => {
                    setCurrentIndex(currentIndex - 1);
                    setIsAnimating(false);
                }, 300);
            } else if (deltaX < 0 && currentIndex < articles.length - 1) {
                // Swipe left, go to next article
                setDirection('right');
                setIsAnimating(true);
                setTimeout(() => {
                    setCurrentIndex(currentIndex + 1);
                    setIsAnimating(false);
                }, 300);
            }
        }

        // Reset touch coordinates
        touchStartX.current = null;
        touchEndX.current = null;
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
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
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