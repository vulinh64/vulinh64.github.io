export interface FeatureArticle {
    title: string;
    excerpt: string;
    slug: string;
    date: string;
}

// Sample feature articles data
export const currentFeatureArticles: FeatureArticle[] = [
    {
        title: "Spring Boot's Tips and Tricks",
        excerpt: "Turbo charge your Spring Boot experience...",
        slug: 'spring-boot-tips-and-tricks',
        date: "2025-09-07"
    },
    {
        title: "Java Coding's Tips and Tricks",
        excerpt: "A few tips to make coding in Java more enjoyable and less frustrating...",
        slug: "java-coding-tips-and-tricks",
        date: "2025-08-22"
    },
    {
        title: "What Features Can We Use in Java 25?",
        excerpt: "Find out what new features we can be using in Java 25...",
        slug: "java-25-new-features",
        date: "2025-08-18"
    },
    {
        title: "Quick Common Docker Run Commands",
        excerpt: "Quick cheat sheet for some of the most common Docker image usage.",
        slug: "quick-common-docker-run-commands",
        date: "2025-09-24"
    }
];