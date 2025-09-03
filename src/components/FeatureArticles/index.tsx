import React, {useState, useRef, useCallback} from 'react';
import styles from './styles.module.css';
import clsx from "clsx";

interface FeatureArticle {
    title: string;
    excerpt: string;
    slug: string;
}

interface FeatureArticlesProps {
    articles: FeatureArticle[];
}

type Direction = 'left' | 'right';
type InteractionType = 'swipe' | 'dot';

// Custom hook to manage carousel state and transitions
const useCarousel = (articles: FeatureArticle[], animationDuration: number = 300) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState<Direction | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [interactionType, setInteractionType] = useState<InteractionType | null>(null);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    // Handle navigation (dot click or swipe)
    const navigateTo = useCallback(
        (newIndex: number, type: InteractionType, navDirection: Direction) => {
            if (newIndex !== currentIndex && !isAnimating && newIndex >= 0 && newIndex < articles.length) {
                setDirection(navDirection);
                setInteractionType(type);
                setIsAnimating(true);
                setTimeout(() => {
                    setCurrentIndex(newIndex);
                    setIsAnimating(false);
                    setInteractionType(null);
                }, animationDuration);
            }
        },
        [currentIndex, isAnimating, articles.length, animationDuration]
    );

    // Handle dot click
    const handleDotClick = useCallback(
        (index: number) => {
            const direction = index > currentIndex ? 'right' : 'left';
            navigateTo(index, 'dot', direction);
        },
        [currentIndex, navigateTo]
    );

    // Handle touch start
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    }, []);

    // Handle touch end and swipe
    const handleTouchEnd = useCallback(
        (e: React.TouchEvent) => {
            touchEndX.current = e.changedTouches[0].clientX;
            const deltaX = touchEndX.current! - touchStartX.current!;
            const swipeThreshold = 50;

            if (Math.abs(deltaX) > swipeThreshold && !isAnimating) {
                if (deltaX > 0 && currentIndex > 0) {
                    // Right swipe: previous article, text flies right
                    navigateTo(currentIndex - 1, 'swipe', 'right');
                } else if (deltaX < 0 && currentIndex < articles.length - 1) {
                    // Left swipe: next article, text flies left
                    navigateTo(currentIndex + 1, 'swipe', 'left');
                }
            }

            touchStartX.current = null;
            touchEndX.current = null;
        },
        [currentIndex, articles.length, isAnimating, navigateTo]
    );

    return {
        currentIndex,
        direction,
        isAnimating,
        interactionType,
        handleDotClick,
        handleTouchStart,
        handleTouchEnd,
    };
};

const FeatureArticles: React.FC<FeatureArticlesProps> = ({articles}) => {
    const {
        currentIndex,
        direction,
        isAnimating,
        interactionType,
        handleDotClick,
        handleTouchStart,
        handleTouchEnd,
    } = useCarousel(articles);

    const currentArticle = articles[currentIndex];

    // Determine animation class based on interaction type and direction
    const getAnimationClass = (): string => {
        if (!isAnimating) return styles.fadeIn;
        if (interactionType === 'swipe') {
            return direction === 'left' ? styles.swipeLeft : styles.swipeRight;
        }
        return direction === 'left' ? styles.slideLeft : styles.slideRight;
    };

    return (
        <section className={clsx(styles.featureArticles, "margin-bottom-lg")}>
            <div className="container">
                <div
                    className={`${styles.articleContent} ${getAnimationClass()}`}
                    key={currentIndex}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <h2 className={clsx(styles.articleTitle, "margin-bottom--lg")}>{currentArticle.title}</h2>
                    <p className={clsx(styles.articleExcerpt, "margin-top--lg margin-bottom--lg")}>{currentArticle.excerpt}</p>
                </div>
                <a href={`/blog/${currentArticle.slug}`} className={styles.readMoreBtn}>
                    Read More
                </a>
                <div className={clsx(styles.navigation, "margin-top--md")}>
                    <div className={styles.dots}>
                        {articles.map((_, index) => (
                            <span
                                key={index}
                                className={`${styles.dot} ${currentIndex === index ? styles.activeDot : ''}`}
                                onClick={() => handleDotClick(index)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeatureArticles;