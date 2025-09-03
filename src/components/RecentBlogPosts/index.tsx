import clsx from "clsx";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";
import CustomBlogThumbnail from "../CustomBlogThumbnail"

const recentPosts = require("../../../.docusaurus/docusaurus-plugin-content-blog/default/blog-post-list-prop-default.json");

const MAX_RECENT_POST: number = 6;

function BlogPostItem({title, date, permalink}) {
    const formattedDate = date
        ? new Date(date).toISOString().split("T")[0]
        : "Unknown date";

    // extract slug after /blog/
    const slug = permalink.replace(/^\/blog\//, "");

    // construct expected thumbnail filename
    const thumbnailFilename = `${formattedDate}-${slug}.png`;

    return (
        <Link to={permalink} className={clsx("text--no-decoration", styles.blogPostItem)}>
            <CustomBlogThumbnail filename={thumbnailFilename} />

            <Heading as="h2" className={styles.blogPostTitle}>
                {title}
            </Heading>

            {date && (
                <div className={clsx(styles.blogPostDate)}>
                    <time dateTime={new Date(date).toISOString()}>{formattedDate}</time>
                </div>
            )}
        </Link>
    );
}

export default function RecentBlogPosts() {
    const items = recentPosts?.items?.filter((item) => !item.unlisted) ?? [];

    if (items.length === 0) {
        return (
            <section className="container margin-vert--lg text--center">
                <Heading as="h1">🚧 No blog posts yet 🚧</Heading>
            </section>
        );
    }

    return (
        <section className="container margin-vert--lg">
            <Heading as="h1" className={clsx("margin-bottom--xl", "margin-top--lg", "text--center")}>
                Recent Blog Posts
            </Heading>
            <div className="row">
                {items.slice(0, MAX_RECENT_POST).map(({title, date, permalink}, index) => (
                    <div key={index} className={clsx("col", "col--6", "margin-bottom--lg")}>
                        <BlogPostItem title={title} date={date} permalink={permalink} />
                    </div>
                ))}
            </div>
            <div className="text--center margin-top--lg">
                <Link
                    to="/blog"
                    className="button button--outline button--primary button--lg"
                >
                    View All Posts
                </Link>
            </div>
        </section>
    );
}
