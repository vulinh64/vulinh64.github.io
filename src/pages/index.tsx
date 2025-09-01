import clsx from "clsx";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import RecentBlogPosts from "../components/RecentBlogPosts";
import FeatureArticles from "../components/FeatureArticles";
import styles from "./index.module.css";
import { JSX } from "react";

interface SiteConfig {
  title: string;
  tagline: string;
}

interface DocusaurusContext {
  siteConfig: SiteConfig;
}

interface FeatureArticle {
  title: string;
  excerpt: string;
  slug: string;
}

function HomepageHeader(): JSX.Element {
  const { siteConfig }: DocusaurusContext = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig }: DocusaurusContext = useDocusaurusContext();

  // Sample feature articles data
  const featureArticles: FeatureArticle[] = [
    {
      title: "What Features Can We Use in Java 25?",
      excerpt: "Find out what new features we can be using in Java 25 (assuming the enterprises will jump ship)...",
      slug: "java-25-new-features"
    },
    {
      title: "Java Coding's Tips and Tricks",
      excerpt: "A few tips to make coding in Java more enjoyable and less frustrating...",
      slug: "java-coding-tips-and-tricks"
    }
  ];

  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="My own space for writing random stuff..."
    >
      <section className={styles.imageContainer}>
        <img src="./img/independence-day.jpg" alt="independence-day" />
      </section>
      <main>
        <FeatureArticles articles={featureArticles} />
        <RecentBlogPosts />
      </main>
    </Layout>
  );
}