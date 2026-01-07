import clsx from "clsx";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import RecentBlogPosts from "../components/RecentBlogPosts";
import FeatureArticles from "../components/FeatureArticles";
import styles from "./index.module.css";
import {JSX} from "react";
import {currentFeatureArticles} from "../components/FeatureArticles/feature-articles";
import {DocusaurusContext} from "@docusaurus/types";

function HomepageHeader(): JSX.Element {
    const {siteConfig}: DocusaurusContext = useDocusaurusContext();
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
    const {siteConfig}: DocusaurusContext = useDocusaurusContext();

    return (
        <Layout
            title={`Hello from ${siteConfig.title}`}
            description="My own space for writing random stuff..."
        >
            <HomepageHeader/>
            <FeatureArticles articles={currentFeatureArticles}/>
            <RecentBlogPosts/>
        </Layout>
    );
}